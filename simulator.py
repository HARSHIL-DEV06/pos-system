import pandas as pd
import sqlite3
import time
from datetime import datetime
import os

def run_simulator(csv_path):
    if not os.path.exists(csv_path):
        print(f"Error: {csv_path} not found.")
        return

    # 1. Load CSV
    df = pd.read_csv(csv_path)
    
    # Robust Column Mapping
    col_mapping = {
        'CustomerType': ['CustomerType', 'Customer', 'customer_type'],
        'ProductCategory': ['ProductCategory', 'category', 'Category'],
        'UnitPrice': ['UnitPrice', 'unit_price', 'Price'],
        'Quantity': ['Quantity', 'quantity', 'Qty'],
        'Total': ['Total', 'total_amount', 'Amount'],
        'FullName': ['FullName', 'customer_name', 'CustomerName']
    }
    
    def get_col(target):
        for possible in col_mapping[target]:
            if possible in df.columns:
                return possible
        return None

    conn = sqlite3.connect('pos_system.db')
    print("Starting Simulation V2 (Robust)... Press Ctrl+C to stop.")
    
    for index, row in df.iterrows():
        cursor = conn.cursor()
        now = datetime.now()
        hour = now.hour
        
        if False: # Removed business hours restriction (8AM-10PM) for testing
            print(f"[{now.strftime('%H:%M:%S')}] Outside business hours (8AM-10PM). Sleeping...")
            time.sleep(60)
            continue

        current_date = now.strftime("%Y-%m-%d")
        current_time = now.strftime("%H:%M:%S")

        query = '''INSERT INTO sales 
                   (transaction_date, transaction_time, customer_type, category, unit_price, quantity, total_amount, customer_name) 
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?)'''
        
        import random
        is_refund = random.random() < 0.15 # 15% chance of being a refund
        
        # Safe extraction
        unit_price = row.get(get_col('UnitPrice'), 0)
        qty = row.get(get_col('Quantity'), 0)
        total = row.get(get_col('Total'), 0)
        cust_type = row.get(get_col('CustomerType'), 'Normal')
        
        if is_refund:
            total = -abs(total)
            cust_type = "Refund"
            
        data_tuple = (
            current_date, 
            current_time, 
            cust_type,
            row.get(get_col('ProductCategory'), 'General'),
            unit_price if not is_refund else -abs(unit_price),
            qty if not is_refund else -abs(qty),
            total,
            row.get(get_col('FullName'), 'Walking Customer')
        )
        
        cursor.execute(query, data_tuple)
        conn.commit()
        
        print(f"[{current_time}] {'Refund' if is_refund else 'Sale'} Added: {data_tuple[7]} | {data_tuple[3]} | ₹{data_tuple[6]}")
        time.sleep(10)

    conn.close()

if __name__ == "__main__":
    # Ensure correct data path
    data_file = 'data/POS_Data.csv'
    if not os.path.exists(data_file):
        data_file = 'POS_Data.csv'
    run_simulator(data_file)