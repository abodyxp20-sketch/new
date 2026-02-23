import os
import sqlite3
import time
from pathlib import Path
from urllib.parse import urlparse

from flask import Flask, flash, redirect, render_template, request, url_for

app = Flask(__name__)
app.config["SECRET_KEY"] = os.getenv("FLASK_SECRET_KEY", "dev-change-this-secret")

BASE_DIR = Path(__file__).resolve().parent
DATABASE_PATH = BASE_DIR / "database.db"


def get_db_connection():
    conn = sqlite3.connect(DATABASE_PATH, timeout=10)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    conn.execute("PRAGMA busy_timeout = 10000")
    return conn


def init_db():
    try:
        with get_db_connection() as conn:
            conn.execute("PRAGMA journal_mode = WAL")
            conn.execute("PRAGMA synchronous = NORMAL")
            conn.execute(
                """
                CREATE TABLE IF NOT EXISTS student_tools (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    tool_name TEXT NOT NULL,
                    description TEXT NOT NULL,
                    link TEXT NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
                """
            )
            conn.commit()
    except sqlite3.Error as exc:
        app.logger.exception("Database initialization failed: %s", exc)


def is_valid_link(link: str) -> bool:
    parsed = urlparse(link)
    return parsed.scheme in {"http", "https"} and bool(parsed.netloc)


def clean_text(value: str, max_length: int) -> str:
    return " ".join(value.split())[:max_length].strip()


def insert_tool_with_retry(tool_name: str, description: str, link: str, retries: int = 3):
    last_error = None
    for attempt in range(retries):
        try:
            with get_db_connection() as conn:
                conn.execute(
                    """
                    INSERT INTO student_tools (tool_name, description, link)
                    VALUES (?, ?, ?)
                    """,
                    (tool_name, description, link),
                )
                conn.commit()
            return True
        except sqlite3.OperationalError as exc:
            last_error = exc
            if "locked" in str(exc).lower() and attempt < retries - 1:
                time.sleep(0.2 * (attempt + 1))
                continue
            break
        except sqlite3.Error as exc:
            last_error = exc
            break

    app.logger.exception("Insert failed after retries: %s", last_error)
    return False


@app.route("/")
def index():
    tools = []
    try:
        with get_db_connection() as conn:
            tools = conn.execute(
                """
                SELECT id, tool_name, description, link, created_at
                FROM student_tools
                ORDER BY id DESC
                """
            ).fetchall()
    except sqlite3.Error as exc:
        app.logger.exception("Fetch failed: %s", exc)
        flash("حدث خطأ أثناء تحميل الأدوات. حاول مرة أخرى.", "error")

    return render_template("index.html", tools=tools)


@app.route("/add", methods=["POST"])
def add_tool():
    tool_name = clean_text(request.form.get("tool_name", ""), 120)
    description = clean_text(request.form.get("description", ""), 600)
    link = request.form.get("link", "").strip()

    if not tool_name or not description or not link:
        flash("جميع الحقول مطلوبة.", "error")
        return redirect(url_for("index"))

    if not is_valid_link(link):
        flash("الرابط غير صحيح. يجب أن يبدأ بـ http:// أو https://", "error")
        return redirect(url_for("index"))

    if insert_tool_with_retry(tool_name, description, link):
        flash("تمت إضافة الأداة بنجاح ✅", "success")
    else:
        flash("تعذر حفظ الأداة حالياً. حاول مرة أخرى.", "error")

    return redirect(url_for("index"))


# Ensure DB/table exists even when app is launched by production WSGI runners.
init_db()


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=False)
