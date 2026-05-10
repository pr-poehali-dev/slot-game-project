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
    """Профиль, история игр/транзакций, поддержка, платежи"""
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
        # GET /profile
        if method == "GET" and path.endswith("/profile"):
            cur.execute(f"SELECT id, username, balance, is_admin, created_at, last_login FROM {SCHEMA}.users WHERE id=%s", (user_id,))
            row = cur.fetchone()
            if not row:
                return {"statusCode": 404, "headers": cors_headers(), "body": json.dumps({"error": "Not found"})}
            uid, uname, balance, is_admin, created_at, last_login = row
            cur.execute(f"""
                SELECT COUNT(*), COALESCE(SUM(bet),0), COALESCE(SUM(CASE WHEN result>0 THEN 1 ELSE 0 END),0)
                FROM {SCHEMA}.game_sessions WHERE user_id=%s
            """, (user_id,))
            stats = cur.fetchone()
            total_games, total_bet, wins = stats
            return {"statusCode": 200, "headers": cors_headers(), "body": json.dumps({
                "id": uid, "username": uname, "balance": float(balance), "is_admin": is_admin,
                "created_at": created_at.isoformat() if created_at else None,
                "last_login": last_login.isoformat() if last_login else None,
                "stats": {"total_games": int(total_games), "total_bet": float(total_bet), "wins": int(wins)}
            })}

        # GET /history
        if method == "GET" and path.endswith("/history"):
            cur.execute(f"""
                SELECT game_type, bet, result, multiplier, game_data, created_at
                FROM {SCHEMA}.game_sessions WHERE user_id=%s ORDER BY created_at DESC LIMIT 50
            """, (user_id,))
            rows = cur.fetchall()
            games = [{"game_type": r[0], "bet": float(r[1]), "result": float(r[2]), "multiplier": float(r[3]), "data": r[4], "created_at": r[5].isoformat()} for r in rows]
            return {"statusCode": 200, "headers": cors_headers(), "body": json.dumps({"games": games})}

        # GET /transactions
        if method == "GET" and path.endswith("/transactions"):
            cur.execute(f"""
                SELECT type, amount, status, details, created_at
                FROM {SCHEMA}.transactions WHERE user_id=%s ORDER BY created_at DESC LIMIT 50
            """, (user_id,))
            rows = cur.fetchall()
            txs = [{"type": r[0], "amount": float(r[1]), "status": r[2], "details": r[3], "created_at": r[4].isoformat()} for r in rows]
            return {"statusCode": 200, "headers": cors_headers(), "body": json.dumps({"transactions": txs})}

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
            return {"statusCode": 200, "headers": cors_headers(), "body": json.dumps({"ok": True, "tx_id": tx_id, "message": "Заявка на пополнение создана."})}

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

        # POST /ticket
        if method == "POST" and path.endswith("/ticket"):
            subject = body.get("subject", "").strip()
            message = body.get("message", "").strip()
            if not subject or not message:
                return {"statusCode": 400, "headers": cors_headers(), "body": json.dumps({"error": "subject and message required"})}
            cur.execute(
                f"INSERT INTO {SCHEMA}.support_tickets (user_id, subject, message) VALUES (%s, %s, %s) RETURNING id",
                (user_id, subject, message)
            )
            ticket_id = cur.fetchone()[0]
            conn.commit()
            return {"statusCode": 200, "headers": cors_headers(), "body": json.dumps({"ok": True, "ticket_id": ticket_id})}

        # GET /tickets
        if method == "GET" and path.endswith("/tickets"):
            cur.execute(
                f"SELECT id, subject, message, status, admin_reply, created_at FROM {SCHEMA}.support_tickets WHERE user_id=%s ORDER BY created_at DESC",
                (user_id,)
            )
            rows = cur.fetchall()
            tickets = [{"id": r[0], "subject": r[1], "message": r[2], "status": r[3], "admin_reply": r[4], "created_at": r[5].isoformat()} for r in rows]
            return {"statusCode": 200, "headers": cors_headers(), "body": json.dumps({"tickets": tickets})}

        return {"statusCode": 404, "headers": cors_headers(), "body": json.dumps({"error": "Not found"})}
    finally:
        cur.close()
        conn.close()
