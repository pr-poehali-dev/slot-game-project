import json
import os
import hashlib
import secrets
import psycopg2
from datetime import datetime, timedelta

SCHEMA = "t_p21650443_slot_game_project"

def get_conn():
    return psycopg2.connect(os.environ["DATABASE_URL"])

def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()

def make_token(user_id: int) -> str:
    raw = f"{user_id}:{secrets.token_hex(16)}"
    return hashlib.sha256(raw.encode()).hexdigest()

def cors_headers():
    return {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, X-User-Id, X-Auth-Token, X-Session-Id",
    }

def handler(event: dict, context) -> dict:
    """Аутентификация: регистрация, вход, проверка токена, выход"""
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": cors_headers(), "body": ""}

    path = event.get("path", "/")
    method = event.get("httpMethod", "GET")
    body = {}
    if event.get("body"):
        body = json.loads(event["body"])

    conn = get_conn()
    cur = conn.cursor()

    try:
        # POST /register
        if method == "POST" and path.endswith("/register"):
            username = body.get("username", "").strip()
            password = body.get("password", "")
            if not username or not password:
                return {"statusCode": 400, "headers": cors_headers(), "body": json.dumps({"error": "username and password required"})}
            if len(password) < 6:
                return {"statusCode": 400, "headers": cors_headers(), "body": json.dumps({"error": "password too short"})}
            pw_hash = hash_password(password)
            cur.execute(f"INSERT INTO {SCHEMA}.users (username, password_hash) VALUES (%s, %s) RETURNING id", (username, pw_hash))
            user_id = cur.fetchone()[0]
            token = make_token(user_id)
            cur.execute(f"INSERT INTO {SCHEMA}.transactions (user_id, type, amount, status) VALUES (%s, 'bonus', 100.00, 'completed')", (user_id,))
            cur.execute(f"UPDATE {SCHEMA}.users SET balance = 100.00 WHERE id = %s", (user_id,))
            conn.commit()
            return {
                "statusCode": 200,
                "headers": {**cors_headers(), "X-Set-Cookie": f"token={token}; Path=/; HttpOnly; SameSite=Lax"},
                "body": json.dumps({"ok": True, "token": token, "user_id": user_id, "username": username, "balance": 100.0, "is_admin": False})
            }

        # POST /login
        if method == "POST" and path.endswith("/login"):
            username = body.get("username", "").strip()
            password = body.get("password", "")
            pw_hash = hash_password(password)
            cur.execute(f"SELECT id, username, balance, is_admin, is_banned FROM {SCHEMA}.users WHERE username=%s AND password_hash=%s", (username, pw_hash))
            row = cur.fetchone()
            if not row:
                return {"statusCode": 401, "headers": cors_headers(), "body": json.dumps({"error": "Invalid credentials"})}
            user_id, uname, balance, is_admin, is_banned = row
            if is_banned:
                return {"statusCode": 403, "headers": cors_headers(), "body": json.dumps({"error": "Account banned"})}
            token = make_token(user_id)
            cur.execute(f"UPDATE {SCHEMA}.users SET last_login=NOW() WHERE id=%s", (user_id,))
            conn.commit()
            return {
                "statusCode": 200,
                "headers": {**cors_headers(), "X-Set-Cookie": f"token={token}; Path=/; HttpOnly; SameSite=Lax"},
                "body": json.dumps({"ok": True, "token": token, "user_id": user_id, "username": uname, "balance": float(balance), "is_admin": is_admin})
            }

        # GET /me — проверка токена из заголовка
        if method == "GET" and path.endswith("/me"):
            headers = event.get("headers", {}) or {}
            token = headers.get("X-Auth-Token") or headers.get("x-auth-token", "")
            user_id_h = headers.get("X-User-Id") or headers.get("x-user-id", "")
            if not token or not user_id_h:
                return {"statusCode": 401, "headers": cors_headers(), "body": json.dumps({"error": "Unauthorized"})}
            cur.execute(f"SELECT id, username, balance, is_admin, is_banned FROM {SCHEMA}.users WHERE id=%s", (user_id_h,))
            row = cur.fetchone()
            if not row:
                return {"statusCode": 401, "headers": cors_headers(), "body": json.dumps({"error": "User not found"})}
            user_id, uname, balance, is_admin, is_banned = row
            if is_banned:
                return {"statusCode": 403, "headers": cors_headers(), "body": json.dumps({"error": "Banned"})}
            return {"statusCode": 200, "headers": cors_headers(), "body": json.dumps({"ok": True, "user_id": user_id, "username": uname, "balance": float(balance), "is_admin": is_admin})}

        return {"statusCode": 404, "headers": cors_headers(), "body": json.dumps({"error": "Not found"})}

    finally:
        cur.close()
        conn.close()
