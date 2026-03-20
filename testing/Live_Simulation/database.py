import mysql.connector

def init_mysql():

    db = mysql.connector.connect(
        host="localhost",
        user="root",        
        password=""         
    )
    cursor = db.cursor()
    

    cursor.execute("CREATE DATABASE IF NOT EXISTS pos_demo")
    cursor.execute("USE pos_demo")
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS sales (
            id INT AUTO_INCREMENT PRIMARY KEY,
            transaction_date VARCHAR(50),
            transaction_time VARCHAR(50),
            category VARCHAR(100),
            total_amount FLOAT,
            customer_name VARCHAR(100)
        )
    ''')
    print("MySQL Database & Table 'sales' ready!")
    db.close()

if __name__ == "__main__":
    init_mysql()