import mysql.connector
import time
import os

def get_count():
    db = mysql.connector.connect(host="localhost", user="root", password="", database="pos_demo")
    cursor = db.cursor()
    cursor.execute("SELECT COUNT(*) FROM sales")
    res = cursor.fetchone()[0]
    db.close()
    return res

while True:
    os.system('cls' if os.name == 'nt' else 'clear')
    print("="*40)
    print("📡 MYSQL LIVE MONITORING (Refresh: 10s)")
    print("="*40)
    print(f"Current Row Count: {get_count()}")
    print("Status: Data is being appended live...")
    time.sleep(10)