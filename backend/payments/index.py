import json
import os
import psycopg2

SCHEMA = "t_p21650443_slot_game_project"

def get_conn():
    return psycopg2.connect(os.environ["DATABASE_URL"])

def cors_headers():
    return {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, X-User-Id, X-Auth-Token, X-Session-Id",
    }

def handler(event: dict, context) -> dict:
    """Платежи: запрос на пополнение и вывод средств"""
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": cors_headers(), "body": ""}

    headers = event.get("headers", {}) or {}
    user_id = headers.get("X-User-Id") or headers.get("x-user-id")
    if not user_id:
        return {"statusCode": 401, "headers": cors_headers(), "body": json.dumps({"error": "Unauthorized"})}

    path = event.get("path", "/")
    method = event.get("httpMethod", "GET")
    body = json.loads(event.get("body") or "{}")

    conn = get_conn()
    cur = conn.cursor()
    try:
        # POST /deposit
        if method == "POST" and path.endswith("/deposit"):
            amount = float(body.get("amount", 0))
            method_pay = body.get("method", "card")
            details = body.get("details", {})
            if amount < 100:
                return {"statusCode": 400, "headers": cors_headers(), "body": json.dumps({"error": "Min deposit 100 RUB"})}
            cur.execute(
                f"INSERT INTO {SCHEMA}.transactions (user_id, type, amount, status, details) VALUES (%s, 'deposit', %s, 'pending', %s) RETURNING id",
                (user_id, amount, json.dumps({"method": method_pay, **details}))
            )
            tx_id = cur.fetchone()[0]
            conn.commit()
            return {"statusCode": 200, "headers": cors_headers(), "body": json.dumps({"ok": True, "tx_id": tx_id, "message": "Заявка на пополнение создана. Ожидайте подтверждения."})}

        # POST /withdraw
        if method == "POST" and path.endswith("/withdraw"):
            amount = float(body.get("amount", 0))
            method_pay = body.get("method", "card")
            details = body.get("details", {})
            if amount < 500:
                return {"statusCode": 400, "headers": cors_headers(), "body": json.dumps({"error": "Min withdrawal 500 RUB"})}
            cur.execute(f"SELECT balance FROM {SCHEMA}.users WHERE id=%s", (user_id,))
            row = cur.fetchone()
            if not row or float(row[0]) < amount:
                return {"statusCode": 400, "headers": cors_headers(), "body": json.dumps({"error": "Insufficient balance"})}
            cur.execute(f"UPDATE {SCHEMA}.users SET balance=balance-%s WHERE id=%s", (amount, user_id))
            cur.execute(
                f"INSERT INTO {SCHEMA}.transactions (user_id, type, amount, status, details) VALUES (%s, 'withdraw', %s, 'pending', %s) RETURNING id",
                (user_id, amount, json.dumps({"method": method_pay, **details}))
            )
            tx_id = cur.fetchone()[0]
            conn.commit()
            return {"statusCode": 200, "headers": cors_headers(), "body": json.dumps({"ok": True, "tx_id": tx_id, "message": "Заявка на вывод создана."})}

        return {"statusCode": 404, "headers": cors_headers(), "body": json.dumps({"error": "Not found"})}
    finally:
        cur.close()
        conn.close()
