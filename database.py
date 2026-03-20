import sqlite3
import hashlib

def init_db():
    conn = sqlite3.connect('pos_system.db')
    cursor = conn.cursor()
    
    # Table for Sales Data
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS sales (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            transaction_date TEXT,
            transaction_time TEXT,
            customer_type TEXT,
            category TEXT,
            unit_price REAL,
            quantity INTEGER,
            total_amount REAL,
            customer_name TEXT
        )
    ''')
    
    # Table for Users
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE,
            password TEXT,
            role TEXT
        )
    ''')
    
    # Seed Admin User
    admin_user = "Admin"
    admin_pass = "parth@2026"
    # Simple hash for this example as requested
    hashed_pass = hashlib.sha256(admin_pass.encode()).hexdigest()
    
    cursor.execute("SELECT * FROM users WHERE username = ?", (admin_user,))
    if not cursor.fetchone():
        cursor.execute("INSERT INTO users (username, password, role) VALUES (?, ?, ?)", 
                       (admin_user, hashed_pass, 'admin'))
    
    conn.commit()
    conn.close()
    print("Database & Tables Created Successfully!")

if __name__ == "__main__":
    init_db()