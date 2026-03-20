import pandas as pd
import random
from datetime import datetime, timedelta

def generate_50_50_data(filename, num_records=1000):
    start_date = datetime(2025, 2, 1) # A month of data
    
    categories = ['Electronics', 'Beauty & Personal Care', 'Home & Kitchen', 'Clothing', 'Grocery']
    customer_types = ['Normal', 'Premium', 'Member']
    names = ['John Doe', 'Jane Smith', 'Alice Johnson', 'Bob Williams', 'Charlie Brown']
    
    data = []
    
    for i in range(num_records):
        # Generate random date within the month
        current_datetime = start_date + timedelta(days=random.randint(0, 27), hours=random.randint(0, 23), minutes=random.randint(0, 59))
        date_str = current_datetime.strftime('%d-%m-%Y')
        time_str = current_datetime.strftime('%H:%M:%S')
        
        category = random.choice(categories)
        cust_type = random.choice(customer_types)
        name = random.choice(names)
        
        # 50/50 chance for positive/negative
        is_negative = random.choice([True, False])
        
        unit_price = round(random.uniform(10.0, 500.0), 2)
        quantity = random.randint(1, 5)
        
        if is_negative:
            total = -round(unit_price * quantity, 2)
            unit_price = -unit_price
            cust_type = "Refund"
        else:
            total = round(unit_price * quantity, 2)
            
        data.append({
            'Date': date_str,
            'Time': time_str,
            'CustomerType': cust_type,
            'ProductCategory': category,
            'UnitPrice': unit_price,
            'Quantity': quantity,
            'Total': total,
            'FullName': name
        })
        
    df = pd.DataFrame(data)
    # Sort by date and time
    df['datetime'] = pd.to_datetime(df['Date'] + ' ' + df['Time'], format="%d-%m-%Y %H:%M:%S", errors='coerce')
    df = df.sort_values(by=['datetime']).drop(columns=['datetime'])
    
    df.to_csv(filename, index=False)
    print(f"Generated {filename} with {num_records} records (approximately 50% positive/negative).")

if __name__ == '__main__':
    generate_50_50_data('data/POS_Data_50_50.csv', 1000)
    print("Done")
