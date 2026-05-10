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

def is_admin(cur, user_id) -> bool:
    cur.execute(f"SELECT is_admin FROM {SCHEMA}.users WHERE id=%s", (user_id,))
    row = cur.fetchone()
    return row and row[0]

def handler(event: dict, context) -> dict:
    """Админ-панель: пользователи, транзакции, статистика, управление"""
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": cors_headers(), "body": ""}

    headers = event.get("headers", {}) or {}
    user_id = headers.get("X-User-Id") or headers.get("x-user-id")
    if not user_id:
        return {"statusCode": 401, "headers": cors_headers(), "body": json.dumps({"error": "Unauthorized"})}

    path = event.get("path", "/")
    method = event.get("httpMethod", "GET")
    body = json.loads(event.get("body") or "{}")
    params = event.get("queryStringParameters") or {}

    conn = get_conn()
    cur = conn.cursor()
    try:
        if not is_admin(cur, user_id):
            return {"statusCode": 403, "headers": cors_headers(), "body": json.dumps({"error": "Forbidden"})}

        # GET /stats
        if method == "GET" and path.endswith("/stats"):
            cur.execute(f"SELECT COUNT(*), COALESCE(SUM(balance),0) FROM {SCHEMA}.users")
            users_count, total_balance = cur.fetchone()
            cur.execute(f"SELECT COUNT(*) FROM {SCHEMA}.game_sessions")
            games_count = cur.fetchone()[0]
            cur.execute(f"SELECT COUNT(*), COALESCE(SUM(amount),0) FROM {SCHEMA}.transactions WHERE type='deposit' AND status='pending'")
            dep_count, dep_amount = cur.fetchone()
            cur.execute(f"SELECT COUNT(*), COALESCE(SUM(amount),0) FROM {SCHEMA}.transactions WHERE type='withdraw' AND status='pending'")
            wd_count, wd_amount = cur.fetchone()
            return {"statusCode": 200, "headers": cors_headers(), "body": json.dumps({
                "users": int(users_count), "total_balance": float(total_balance),
                "games": int(games_count),
                "pending_deposits": {"count": int(dep_count), "amount": float(dep_amount)},
                "pending_withdrawals": {"count": int(wd_count), "amount": float(wd_amount)}
            })}

        # GET /users
        if method == "GET" and path.endswith("/users"):
            cur.execute(f"SELECT id, username, balance, is_admin, is_banned, created_at FROM {SCHEMA}.users ORDER BY id DESC LIMIT 100")
            rows = cur.fetchall()
            users = [{"id": r[0], "username": r[1], "balance": float(r[2]), "is_admin": r[3], "is_banned": r[4], "created_at": r[5].isoformat()} for r in rows]
            return {"statusCode": 200, "headers": cors_headers(), "body": json.dumps({"users": users})}

        # POST /ban
        if method == "POST" and path.endswith("/ban"):
            target_id = body.get("user_id")
            banned = body.get("banned", True)
            cur.execute(f"UPDATE {SCHEMA}.users SET is_banned=%s WHERE id=%s", (banned, target_id))
            conn.commit()
            return {"statusCode": 200, "headers": cors_headers(), "body": json.dumps({"ok": True})}

        # POST /balance — изменить баланс пользователя
        if method == "POST" and path.endswith("/balance"):
            target_id = body.get("user_id")
            amount = float(body.get("amount", 0))
            cur.execute(f"UPDATE {SCHEMA}.users SET balance=%s WHERE id=%s", (amount, target_id))
            conn.commit()
            return {"statusCode": 200, "headers": cors_headers(), "body": json.dumps({"ok": True})}

        # GET /transactions — все транзакции
        if method == "GET" and path.endswith("/transactions"):
            status = params.get("status", "")
            if status:
                cur.execute(f"SELECT id, user_id, type, amount, status, details, created_at FROM {SCHEMA}.transactions WHERE status=%s ORDER BY created_at DESC LIMIT 100", (status,))
            else:
                cur.execute(f"SELECT id, user_id, type, amount, status, details, created_at FROM {SCHEMA}.transactions ORDER BY created_at DESC LIMIT 100")
            rows = cur.fetchall()
            txs = [{"id": r[0], "user_id": r[1], "type": r[2], "amount": float(r[3]), "status": r[4], "details": r[5], "created_at": r[6].isoformat()} for r in rows]
            return {"statusCode": 200, "headers": cors_headers(), "body": json.dumps({"transactions": txs})}

        # POST /approve-tx — подтвердить/отклонить транзакцию
        if method == "POST" and path.endswith("/approve-tx"):
            tx_id = body.get("tx_id")
            action = body.get("action", "approve")
            cur.execute(f"SELECT user_id, type, amount, status FROM {SCHEMA}.transactions WHERE id=%s", (tx_id,))
            tx = cur.fetchone()
            if not tx:
                return {"statusCode": 404, "headers": cors_headers(), "body": json.dumps({"error": "Not found"})}
            tx_user, tx_type, tx_amount, tx_status = tx
            if tx_status != "pending":
                return {"statusCode": 400, "headers": cors_headers(), "body": json.dumps({"error": "Already processed"})}
            if action == "approve":
                cur.execute(f"UPDATE {SCHEMA}.transactions SET status='completed' WHERE id=%s", (tx_id,))
                if tx_type == "deposit":
                    cur.execute(f"UPDATE {SCHEMA}.users SET balance=balance+%s WHERE id=%s", (tx_amount, tx_user))
            else:
                cur.execute(f"UPDATE {SCHEMA}.transactions SET status='rejected' WHERE id=%s", (tx_id,))
                if tx_type == "withdraw":
                    cur.execute(f"UPDATE {SCHEMA}.users SET balance=balance+%s WHERE id=%s", (tx_amount, tx_user))
            conn.commit()
            return {"statusCode": 200, "headers": cors_headers(), "body": json.dumps({"ok": True})}

        # GET /tickets
        if method == "GET" and path.endswith("/tickets"):
            cur.execute(f"""
                SELECT t.id, t.user_id, u.username, t.subject, t.message, t.status, t.admin_reply, t.created_at
                FROM {SCHEMA}.support_tickets t JOIN {SCHEMA}.users u ON u.id=t.user_id ORDER BY t.created_at DESC LIMIT 100
            """)
            rows = cur.fetchall()
            tickets = [{"id": r[0], "user_id": r[1], "username": r[2], "subject": r[3], "message": r[4], "status": r[5], "admin_reply": r[6], "created_at": r[7].isoformat()} for r in rows]
            return {"statusCode": 200, "headers": cors_headers(), "body": json.dumps({"tickets": tickets})}

        # POST /reply-ticket
        if method == "POST" and path.endswith("/reply-ticket"):
            ticket_id = body.get("ticket_id")
            reply = body.get("reply", "")
            cur.execute(f"UPDATE {SCHEMA}.support_tickets SET admin_reply=%s, status='closed', updated_at=NOW() WHERE id=%s", (reply, ticket_id))
            conn.commit()
            return {"statusCode": 200, "headers": cors_headers(), "body": json.dumps({"ok": True})}

        return {"statusCode": 404, "headers": cors_headers(), "body": json.dumps({"error": "Not found"})}
    finally:
        cur.close()
        conn.close()
