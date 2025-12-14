import os
import sqlite3
from contextlib import closing
from typing import List

import psycopg2
from flask import Flask, jsonify
from flask_cors import CORS
from psycopg2.extras import RealDictCursor


def create_app():
    app = Flask(__name__)
    CORS(app)

    @app.get("/health")
    def health():
        return {"status": "ok"}

    @app.get("/metrics/sweets")
    def sweet_metrics():
        rows = fetch_metrics()
        return jsonify(rows)

    return app


def fetch_metrics() -> List[dict]:
    database_url = os.getenv("DATABASE_URL")
    if not database_url:
        return []

    if database_url.startswith("sqlite"):
        conn = sqlite3.connect(database_url.split("///")[-1])
        conn.row_factory = sqlite3.Row
        query = """
            SELECT category,
                   COUNT(*) AS sweet_count,
                   SUM(quantity) AS total_quantity
            FROM sweets_sweet
            GROUP BY category
            ORDER BY category;
        """
        with closing(conn):
            cursor = conn.execute(query)
            return [dict(row) for row in cursor.fetchall()]

    with closing(psycopg2.connect(database_url, cursor_factory=RealDictCursor)) as conn:
        with conn.cursor() as cursor:
            cursor.execute(
                """
                SELECT category,
                       COUNT(*) AS sweet_count,
                       SUM(quantity) AS total_quantity
                FROM sweets_sweet
                GROUP BY category
                ORDER BY category;
                """
            )
            rows = cursor.fetchall()
    return rows


app = create_app()


if __name__ == "__main__":
    app.run(port=5001)
