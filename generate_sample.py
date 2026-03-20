import pandas as pd
import numpy as np
import random
from datetime import datetime, timedelta

# Configurations
START_DATE = datetime(2026, 2, 18)
END_DATE = datetime(2026, 3, 17, 23, 59, 59)
NUM_RECORDS = 5000

categories = ['Grocery', 'Electronics', 'Clothing', 'Home & Kitchen', 'Beauty']
customer_types = ['Regular', 'Member', 'Premium']
names = [
    'Priya Iyer', 'Rahul Sharma', 'Ananya Singh', 'Vikram Patel', 'Sneha Gupta',
    'Rohan Desai', 'Kavita Reddy', 'Arjun Verma', 'Neha Joshi', 'Aditya Kumar'
]

data = []
for _ in range(NUM_RECORDS):
    # Random datetime
    random_seconds = random.randint(0, int((END_DATE - START_DATE).total_seconds()))
    dt = START_DATE + timedelta(seconds=random_seconds)
    
    # Random values
    cat = random.choice(categories)
    cust_type = random.choice(customer_types)
    name = random.choice(names)
    
    # Prices
    if cat == 'Grocery':
        price = round(random.uniform(5.0, 50.0), 2)
    elif cat == 'Electronics':
        price = round(random.uniform(100.0, 1000.0), 2)
    elif cat == 'Clothing':
        price = round(random.uniform(20.0, 150.0), 2)
    elif cat == 'Home & Kitchen':
        price = round(random.uniform(30.0, 300.0), 2)
    else:
        price = round(random.uniform(10.0, 100.0), 2)
        
    qty = random.randint(1, 5)
    total = round(price * qty, 2)
    
    date_str = dt.strftime('%d-%m-%Y %H:%M')
    time_str = dt.strftime('%H:%M:%S')
    
    data.append([date_str, time_str, cust_type, cat, price, qty, total, name])

# Sort data chronologically
data.sort(key=lambda x: datetime.strptime(x[0], '%d-%m-%Y %H:%M'))

df = pd.DataFrame(data, columns=['Date', 'Time', 'CustomerType', 'ProductCategory', 'UnitPrice', 'Quantity', 'Total', 'FullName'])
output_path = 'e:/POS_P/data/sample_month_dataset.csv'
df.to_csv(output_path, index=False)

print(f"Sample dataset generated successfully at {output_path} with {NUM_RECORDS} records.")
