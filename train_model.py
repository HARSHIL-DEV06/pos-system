import pandas as pd
import xgboost as xgb
from sklearn.model_selection import train_test_split

# 1. Load Dmart Main Dataset
df = pd.read_csv('data/dmart_main.csv')

# 2. Convert Date to Features
df['Date'] = pd.to_datetime(df['Date'])
df['month'] = df['Date'].dt.month
df['day'] = df['Date'].dt.day
df['dayofweek'] = df['Date'].dt.dayofweek

# 3. Define X (Features) and y (Target: Sales)
X = df[['month', 'day', 'dayofweek', 'UnitPrice', 'Quantity']] 
y = df['Total']

# 4. Train XGBoost
model = xgb.XGBRegressor(objective='reg:squarederror', n_estimators=1000)
model.fit(X, y)

# 5. Save the Model
model.save_model('models/xgboost_sales_model.json')
print("Model Trained and Saved!")