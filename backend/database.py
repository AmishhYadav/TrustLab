import sqlite3
import json
import uuid
import time
import hashlib
import os
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
        
        # Add password_hash column if missing
        cursor.execute("PRAGMA table_info(users)")
        columns = [info[1] for info in cursor.fetchall()]
        if "password_hash" not in columns:
            cursor.execute("ALTER TABLE users ADD COLUMN password_hash TEXT")
            conn.commit()

def hash_password(password: str, salt: bytes = None) -> str:
    if salt is None:
        salt = os.urandom(16)
    key = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt, 100000)
    return salt.hex() + ":" + key.hex()

def verify_password(password: str, hashed: str) -> bool:
    try:
        salt_hex, key_hex = hashed.split(":")
        salt = bytes.fromhex(salt_hex)
        key = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt, 100000)
        return key.hex() == key_hex
    except Exception:
        return False

def authenticate_user(username: str, password: str) -> Optional[Dict[str, Any]]:
    '''Verify username and password. Supports migrating old users without passwords.'''
    with sqlite3.connect(DB_PATH) as conn:
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        
        cursor.execute("SELECT id, username, created_at, password_hash FROM users WHERE username = ?", (username,))
        row = cursor.fetchone()
        
        if not row:
            return None
            
        user_dict = dict(row)
        
        # If user has no password (migrated from older version), set it now.
        if not user_dict.get("password_hash"):
            new_hash = hash_password(password)
            cursor.execute("UPDATE users SET password_hash = ? WHERE id = ?", (new_hash, user_dict["id"]))
            conn.commit()
            return {"id": user_dict["id"], "username": user_dict["username"]}
            
        if verify_password(password, user_dict["password_hash"]):
            return {"id": user_dict["id"], "username": user_dict["username"]}
            
        return None

def signup_user(username: str, password: str) -> Optional[Dict[str, Any]]:
    '''Create a new user. Returns None if username already exists.'''
    with sqlite3.connect(DB_PATH) as conn:
        cursor = conn.cursor()
        
        # Check existing
        cursor.execute("SELECT id FROM users WHERE username = ?", (username,))
        if cursor.fetchone():
            return None
            
        new_id = str(uuid.uuid4())
        created_at = time.time()
        p_hash = hash_password(password)
        
        cursor.execute(
            "INSERT INTO users (id, username, created_at, password_hash) VALUES (?, ?, ?, ?)",
            (new_id, username, created_at, p_hash)
        )
        conn.commit()
        
        return {"id": new_id, "username": username}

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
