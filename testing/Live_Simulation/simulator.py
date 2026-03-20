import pandas as pd
import mysql.connector
import time
from datetime import datetime
import os

def start_simulation():
    
    if not os.path.exists('POS_Data.csv'):
        print("CSV file not found")
        return

    print("reading CSV file")
    df = pd.read_csv('POS_Data.csv')
    
    db = None
    try:
        print("connecting to MySQL")
        db = mysql.connector.connect(
            host="localhost",
            user="root",
            password="",
            database="pos_demo"
        )
        print("connection Successfully")
        print("simulation start..")

        for index, row in df.iterrows():
            cursor = db.cursor()
            now = datetime.now()
            
            
            sql = "INSERT INTO sales (transaction_date, transaction_time, category, total_amount, customer_name) VALUES (%s, %s, %s, %s, %s)"
            
     
            val = (
                now.strftime("%Y-%m-%d"), 
                now.strftime("%H:%M:%S"), 
                row['ProductCategory'], 
                row['Total'], 
                row['FullName']
            )
            
            cursor.execute(sql, val)
            db.commit()
            
            print(f"[{now.strftime('%H:%M:%S')}] Added: {row['FullName']} - ₹{row['Total']}")
            time.sleep(10)

    except mysql.connector.Error as err:
        print(f"MySQL Error: {err}")
    except Exception as e:
        print(f"Error: {e}")
    finally:
        if db and db.is_connected():
            db.close()
            print("connection closed")

if __name__ == "__main__":
    start_simulation()