# Smart Sales Prediction POS System

A comprehensive Point of Sale (POS) and Analytics Web Application built with Python (Flask), SQLite, and Machine Learning (XGBoost). The system provides real-time transaction monitoring, dynamic AI-driven predictions for key business metrics, and an extensive deep-dive analytics dashboard.

## Features

- **Live Ledger Dashboard:** Monitors and lists incoming real-time transactions. Visually separates positive incoming revenue (sales) from negative revenue (refunds/returns).
- **Smart Metric Widgets (AI Powered):** Real-time monitoring of Net Revenue, Average Transaction Sizes, and Business Momentum. The AI subsystem (XGBoost) actively calculates trailing and expected future values, and updates UI trend indicators to reflect both Positive (↑ Green) and Negative (↓ Red) movements.
- **Deep Analytics Platform:** Advanced line graphs and bar charts built using Chart.js to visualize daily sales trajectories, peak hour analyses, and categorical breakdowns.
- **Data Simulator:** Includes a built-in transaction data simulator (`simulator.py`) to systematically pump CSV datasets into the actual SQLite database to test real-time UI reactions. It includes functionality to ingest entirely synthetic standard datasets, as well as a script (`generate_50_50_data.py`) to generate exactly equal parts positive and negative data for testing refunds and UI limits.

## Technology Stack

- **Backend:** Python 3.x, Flask (Web Framework)
- **Database:** SQLite3
- **Machine Learning Integration:** XGBoost, Pandas
- **Frontend:** Vanilla HTML/CSS/JavaScript with glassmorphism/modern styling elements.
- **Data Visualization:** Chart.js

## Installation

1. Clone or download this repository.
2. Install dependencies using pip:
   ```bash
   pip install -r requirements.txt
   ```
3. Initialize the application (This will spin up the Flask web server on `http://127.0.0.1:5000/`)
   ```bash
   python app.py
   ```
4. _(Optional)_ In a separate terminal, launch the transaction simulator to start generating live data for the dashboard:
   ```bash
   python simulator.py
   ```

## Included Scripts

- **`app.py`**: The main Flask Application backend. Configures all REST API routes and hosts the HTML templates. Includes the machine learning prediction endpoints mapping DB context against the XGBoost algorithm.
- **`simulator.py`**: Reads `data/POS_Data.csv` row by row and writes them slowly to the active SQL table (`pos_system.db`), simulating an active store day. Automatically injects standard 15% refund-variance probability to demonstrate dynamic UI capabilities.
- **`generate_50_50_data.py`**: A helper script to recreate an artificially perfect 50% positive and 50% negative (refund) trajectory for testing pure red/green dashboard states. Outputs to `data/POS_Data_50_50.csv`.

## Core Logic Elements

The UI connects to the backend exclusively through asynchronous `fetch()` requests on a timer. The backend responds with live AI prediction confidence values which the client-side `dashboard.js` engine reads to appropriately style up/down widgets. Negative values natively turn red with down indicators, while positive transactions calculate optimistic trajectories with green visualization.

## Author

Smart Prediction Team 2026
