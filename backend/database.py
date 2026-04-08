import sqlite3
import json
import uuid
import time
from typing import Optional, Dict, Any

DB_PATH = "trustlab.db"

def init_db():
    '''Initialize the SQLite database schema.'''
    with sqlite3.connect(DB_PATH) as conn:
        cursor = conn.cursor()
        
        # Users Table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS users (
                id TEXT PRIMARY KEY,
                username TEXT UNIQUE NOT NULL,
                created_at REAL NOT NULL
            )
        ''')
        
        # Events Table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS events (
                id TEXT PRIMARY KEY,
                user_id TEXT NOT NULL,
                event_type TEXT NOT NULL,
                timestamp REAL NOT NULL,
                metadata_payload TEXT NOT NULL,
                FOREIGN KEY (user_id) REFERENCES users (id)
            )
        ''')
        
        conn.commit()

def get_or_create_user(username: str) -> Dict[str, Any]:
    '''Look up a user by username, or create if they don't exist.'''
    with sqlite3.connect(DB_PATH) as conn:
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        
        # Check existing
        cursor.execute("SELECT id, username, created_at FROM users WHERE username = ?", (username,))
        row = cursor.fetchone()
        
        if row:
            return dict(row)
            
        # Create new
        new_id = str(uuid.uuid4())
        created_at = time.time()
        
        cursor.execute(
            "INSERT INTO users (id, username, created_at) VALUES (?, ?, ?)",
            (new_id, username, created_at)
        )
        conn.commit()
        
        return {"id": new_id, "username": username, "created_at": created_at}

def insert_event(user_id: str, event_type: str, timestamp: float, metadata: Dict[str, Any]) -> str:
    '''Insert a telemetry event.'''
    with sqlite3.connect(DB_PATH) as conn:
        cursor = conn.cursor()
        event_id = str(uuid.uuid4())
        
        cursor.execute(
            "INSERT INTO events (id, user_id, event_type, timestamp, metadata_payload) VALUES (?, ?, ?, ?, ?)",
            (event_id, user_id, event_type, timestamp, json.dumps(metadata))
        )
        conn.commit()
        return event_id
