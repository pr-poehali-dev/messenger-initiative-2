"""
Аутентификация пользователей: регистрация, вход, проверка сессии, выход, поиск по username.
Роутинг через query param: ?action=register|login|me|logout|search
"""
import json
import os
import hashlib
import secrets
import re
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


def validate_username(username: str):
    if not username:
        return "Введите имя пользователя"
    if len(username) < 3:
        return "Username минимум 3 символа"
    if len(username) > 32:
        return "Username максимум 32 символа"
    if not re.match(r'^[a-zA-Z0-9_]+$', username):
        return "Только латинские буквы, цифры и _"
    return None


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
        username = (body.get("username") or "").strip().lower()

        if not name or not contact or not password:
            cur.close(); conn.close()
            return resp(400, {"error": "Заполните все поля"})
        if len(password) < 6:
            cur.close(); conn.close()
            return resp(400, {"error": "Пароль минимум 6 символов"})

        username_err = validate_username(username)
        if username_err:
            cur.close(); conn.close()
            return resp(400, {"error": username_err})

        pw_hash = hash_password(password)
        try:
            cur.execute(
                "INSERT INTO " + SCHEMA + ".users (name, contact, password_hash, username) VALUES (%s, %s, %s, %s) RETURNING id, name, contact, avatar, username",
                (name, contact, pw_hash, username)
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
                "user": {"id": user[0], "name": user[1], "contact": user[2], "avatar": user[3], "username": user[4]}
            })
        except psycopg2.errors.UniqueViolation as e:
            conn.rollback()
            cur.close(); conn.close()
            if "username" in str(e):
                return resp(409, {"error": "Этот username уже занят, попробуйте другой"})
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
            "SELECT id, name, contact, avatar, username FROM " + SCHEMA + ".users WHERE contact = %s AND password_hash = %s",
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
            "user": {"id": user[0], "name": user[1], "contact": user[2], "avatar": user[3], "username": user[4]}
        })

    # me
    if action == "me":
        if not token:
            cur.close(); conn.close()
            return resp(401, {"error": "Нет токена"})
        cur.execute(
            "SELECT u.id, u.name, u.contact, u.avatar, u.username FROM " + SCHEMA + ".sessions s JOIN " + SCHEMA + ".users u ON u.id = s.user_id WHERE s.token = %s",
            (token,)
        )
        user = cur.fetchone()
        cur.close(); conn.close()
        if not user:
            return resp(401, {"error": "Сессия истекла"})
        return resp(200, {"user": {"id": user[0], "name": user[1], "contact": user[2], "avatar": user[3], "username": user[4]}})

    # search — поиск пользователей по username
    if action == "search":
        query = (params.get("q") or "").strip().lower().lstrip("@")
        if len(query) < 2:
            cur.close(); conn.close()
            return resp(400, {"error": "Введите минимум 2 символа"})
        cur.execute(
            "SELECT id, name, username, avatar FROM " + SCHEMA + ".users WHERE LOWER(username) LIKE %s AND username IS NOT NULL LIMIT 20",
            (query + "%",)
        )
        rows = cur.fetchall()
        cur.close(); conn.close()
        users = [{"id": r[0], "name": r[1], "username": r[2], "avatar": r[3]} for r in rows]
        return resp(200, {"users": users})

    # logout
    if action == "logout":
        if token:
            cur.execute("UPDATE " + SCHEMA + ".sessions SET token = '' WHERE token = %s", (token,))
            conn.commit()
        cur.close(); conn.close()
        return resp(200, {"ok": True})

    cur.close(); conn.close()
    return resp(404, {"error": "Маршрут не найден"})
