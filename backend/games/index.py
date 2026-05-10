import json
import os
import random
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

def get_user(cur, user_id):
    cur.execute(f"SELECT id, balance, is_banned FROM {SCHEMA}.users WHERE id=%s", (user_id,))
    return cur.fetchone()

def play_slots(bet: float) -> dict:
    symbols = ["🍒", "🍋", "🍊", "🍇", "⭐", "💎", "7️⃣"]
    weights = [30, 25, 20, 15, 5, 3, 2]
    reels = random.choices(symbols, weights=weights, k=3)
    if reels[0] == reels[1] == reels[2]:
        sym = reels[0]
        mults = {"💎": 50, "7️⃣": 25, "⭐": 10, "🍇": 5, "🍊": 3, "🍋": 2, "🍒": 2}
        mult = mults.get(sym, 2)
    elif reels[0] == reels[1] or reels[1] == reels[2] or reels[0] == reels[2]:
        mult = 1.5
    else:
        mult = 0
    return {"reels": reels, "multiplier": mult, "win": round(bet * mult, 2)}

def play_crash(bet: float, cashout: float) -> dict:
    r = random.random()
    crash_point = round(max(1.0, 0.99 / (1 - r * 0.95)), 2) if r < 0.97 else round(random.uniform(1.0, 100.0), 2)
    won = cashout <= crash_point
    mult = cashout if won else 0
    return {"crash_point": crash_point, "cashout": cashout, "won": won, "multiplier": mult, "win": round(bet * mult, 2) if won else 0}

def play_dice(bet: float, prediction: str, value: int) -> dict:
    roll = random.randint(1, 6)
    if prediction == "exact":
        won = roll == value
        mult = 5.5
    elif prediction == "over":
        won = roll > value
        cnt = 6 - value
        mult = round(6 / cnt, 2) * 0.95 if cnt > 0 else 0
    else:
        won = roll < value
        cnt = value - 1
        mult = round(6 / cnt, 2) * 0.95 if cnt > 0 else 0
    return {"roll": roll, "won": won, "multiplier": mult if won else 0, "win": round(bet * mult, 2) if won else 0}

def play_roulette(bet: float, bet_type: str, bet_value) -> dict:
    number = random.randint(0, 36)
    red = {1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36}
    won = False
    mult = 0
    if bet_type == "number":
        won = number == int(bet_value)
        mult = 35
    elif bet_type == "color":
        if number == 0:
            won = False
        elif bet_value == "red":
            won = number in red
        else:
            won = number not in red and number != 0
        mult = 1
    elif bet_type == "parity":
        if number == 0:
            won = False
        elif bet_value == "even":
            won = number % 2 == 0
        else:
            won = number % 2 == 1
        mult = 1
    elif bet_type == "half":
        if number == 0:
            won = False
        elif bet_value == "low":
            won = 1 <= number <= 18
        else:
            won = 19 <= number <= 36
        mult = 1
    win_amt = round(bet * mult + bet, 2) if won else 0
    return {"number": number, "won": won, "multiplier": mult, "win": win_amt}

def handler(event: dict, context) -> dict:
    """Игры: slots, crash, dice, roulette — расчёт результатов и запись в БД"""
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": cors_headers(), "body": ""}

    headers = event.get("headers", {}) or {}
    user_id = headers.get("X-User-Id") or headers.get("x-user-id")
    if not user_id:
        return {"statusCode": 401, "headers": cors_headers(), "body": json.dumps({"error": "Unauthorized"})}

    body = json.loads(event.get("body") or "{}")
    game_type = body.get("game_type", "")
    bet = float(body.get("bet", 0))

    if bet <= 0:
        return {"statusCode": 400, "headers": cors_headers(), "body": json.dumps({"error": "Invalid bet"})}

    conn = get_conn()
    cur = conn.cursor()
    try:
        row = get_user(cur, user_id)
        if not row:
            return {"statusCode": 404, "headers": cors_headers(), "body": json.dumps({"error": "User not found"})}
        uid, balance, is_banned = row
        balance = float(balance)
        if is_banned:
            return {"statusCode": 403, "headers": cors_headers(), "body": json.dumps({"error": "Banned"})}
        if balance < bet:
            return {"statusCode": 400, "headers": cors_headers(), "body": json.dumps({"error": "Insufficient balance"})}

        result = {}
        if game_type == "slots":
            result = play_slots(bet)
        elif game_type == "crash":
            cashout = float(body.get("cashout", 1.5))
            result = play_crash(bet, cashout)
        elif game_type == "dice":
            prediction = body.get("prediction", "over")
            value = int(body.get("value", 3))
            result = play_dice(bet, prediction, value)
        elif game_type == "roulette":
            bet_type = body.get("bet_type", "color")
            bet_value = body.get("bet_value", "red")
            result = play_roulette(bet, bet_type, bet_value)
        else:
            return {"statusCode": 400, "headers": cors_headers(), "body": json.dumps({"error": "Unknown game"})}

        win = result.get("win", 0)
        new_balance = round(balance - bet + win, 2)
        cur.execute(f"UPDATE {SCHEMA}.users SET balance=%s WHERE id=%s", (new_balance, uid))
        cur.execute(
            f"INSERT INTO {SCHEMA}.game_sessions (user_id, game_type, bet, result, multiplier, game_data) VALUES (%s, %s, %s, %s, %s, %s)",
            (uid, game_type, bet, win - bet, result.get("multiplier", 0), json.dumps(result))
        )
        conn.commit()
        return {"statusCode": 200, "headers": cors_headers(), "body": json.dumps({**result, "new_balance": new_balance})}
    finally:
        cur.close()
        conn.close()
