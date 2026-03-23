"""
Аутентификация пользователей: регистрация, вход, проверка сессии, выход.
Роутинг через query param: ?action=register|login|me|logout
"""
import json
import os
import hashlib
import secrets
import psycopg2

SCHEMA = "t_p96043827_messenger_initiative"
CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-Authorization",
}


def get_conn():
    return psycopg2.connect(os.environ["DATABASE_URL"])


def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()


def make_token() -> str:
    return secrets.token_hex(32)


def resp(status: int, data: dict) -> dict:
    return {
        "statusCode": status,
        "headers": {**CORS, "Content-Type": "application/json"},
        "body": json.dumps(data, ensure_ascii=False),
    }


def handler(event: dict, context) -> dict:
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS, "body": ""}

    method = event.get("httpMethod", "GET")
    params = event.get("queryStringParameters") or {}
    action = params.get("action", "")
    body = {}
    if event.get("body"):
        body = json.loads(event["body"])

    token = (event.get("headers") or {}).get("X-Authorization", "").replace("Bearer ", "")

    conn = get_conn()
    cur = conn.cursor()

    # register
    if action == "register":
        name = (body.get("name") or "").strip()
        contact = (body.get("contact") or "").strip().lower()
        password = body.get("password") or ""

        if not name or not contact or not password:
            cur.close(); conn.close()
            return resp(400, {"error": "Заполните все поля"})
        if len(password) < 6:
            cur.close(); conn.close()
            return resp(400, {"error": "Пароль минимум 6 символов"})

        pw_hash = hash_password(password)
        try:
            cur.execute(
                "INSERT INTO " + SCHEMA + ".users (name, contact, password_hash) VALUES (%s, %s, %s) RETURNING id, name, contact, avatar",
                (name, contact, pw_hash)
            )
            user = cur.fetchone()
            token_val = make_token()
            cur.execute(
                "INSERT INTO " + SCHEMA + ".sessions (user_id, token) VALUES (%s, %s)",
                (user[0], token_val)
            )
            conn.commit()
            cur.close(); conn.close()
            return resp(200, {
                "token": token_val,
                "user": {"id": user[0], "name": user[1], "contact": user[2], "avatar": user[3]}
            })
        except psycopg2.errors.UniqueViolation:
            conn.rollback()
            cur.close(); conn.close()
            return resp(409, {"error": "Этот номер или email уже зарегистрирован"})

    # login
    if action == "login":
        contact = (body.get("contact") or "").strip().lower()
        password = body.get("password") or ""

        if not contact or not password:
            cur.close(); conn.close()
            return resp(400, {"error": "Введите контакт и пароль"})

        pw_hash = hash_password(password)
        cur.execute(
            "SELECT id, name, contact, avatar FROM " + SCHEMA + ".users WHERE contact = %s AND password_hash = %s",
            (contact, pw_hash)
        )
        user = cur.fetchone()
        if not user:
            cur.close(); conn.close()
            return resp(401, {"error": "Неверный номер/email или пароль"})

        token_val = make_token()
        cur.execute(
            "INSERT INTO " + SCHEMA + ".sessions (user_id, token) VALUES (%s, %s)",
            (user[0], token_val)
        )
        conn.commit()
        cur.close(); conn.close()
        return resp(200, {
            "token": token_val,
            "user": {"id": user[0], "name": user[1], "contact": user[2], "avatar": user[3]}
        })

    # me
    if action == "me":
        if not token:
            cur.close(); conn.close()
            return resp(401, {"error": "Нет токена"})
        cur.execute(
            "SELECT u.id, u.name, u.contact, u.avatar FROM " + SCHEMA + ".sessions s JOIN " + SCHEMA + ".users u ON u.id = s.user_id WHERE s.token = %s",
            (token,)
        )
        user = cur.fetchone()
        cur.close(); conn.close()
        if not user:
            return resp(401, {"error": "Сессия истекла"})
        return resp(200, {"user": {"id": user[0], "name": user[1], "contact": user[2], "avatar": user[3]}})

    # logout
    if action == "logout":
        if token:
            cur.execute("UPDATE " + SCHEMA + ".sessions SET token = '' WHERE token = %s", (token,))
            conn.commit()
        cur.close(); conn.close()
        return resp(200, {"ok": True})

    cur.close(); conn.close()
    return resp(404, {"error": "Маршрут не найден"})
