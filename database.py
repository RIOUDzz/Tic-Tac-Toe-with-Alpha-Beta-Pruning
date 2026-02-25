import sqlite3
import os

DB_PATH = "game_scores.db"

def init_db():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS scores (
            id INTEGER PRIMARY KEY,
            wins INTEGER DEFAULT 0,
            losses INTEGER DEFAULT 0,
            draws INTEGER DEFAULT 0
        )
    ''')
    # Initialize with one row if empty
    cursor.execute("SELECT COUNT(*) FROM scores")
    if cursor.fetchone()[0] == 0:
        cursor.execute("INSERT INTO scores (wins, losses, draws) VALUES (0, 0, 0)")
    conn.commit()
    conn.close()

def get_scores():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("SELECT wins, losses, draws FROM scores WHERE id = 1")
    row = cursor.fetchone()
    conn.close()
    if row:
        return {"wins": row[0], "losses": row[1], "draws": row[2]}
    return {"wins": 0, "losses": 0, "draws": 0}

def update_score(result):
    """Result can be 'X' (AI win -> Human loss), 'O' (Human win), or 'Draw'"""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    if result == 'O':
        cursor.execute("UPDATE scores SET wins = wins + 1 WHERE id = 1")
    elif result == 'X':
        cursor.execute("UPDATE scores SET losses = losses + 1 WHERE id = 1")
    elif result == 'Draw':
        cursor.execute("UPDATE scores SET draws = draws + 1 WHERE id = 1")
    conn.commit()
    conn.close()
