# Smart AI-Powered Canteen Management System

An end-to-end, real-time, AI-driven canteen order management, wait-time prediction, and kitchen demand forecasting platform built with **FastAPI**, **XGBoost**, **Scikit-Learn (Apriori & Random Forest)**, **React**, **Vite**, and **Tailwind CSS**.

---

## 🌟 Key System Features

### 1. 🛒 Customer Portal
- **Interactive Food Menu**: Filter by categories (*Snacks*, *Meals*, *Beverages*), view preparation time indicators, prices, and high-resolution food previews.
- **Apriori Association Rule Recommender**: Real-time *"Frequently Paired With"* item recommendations dynamically returned as customers add dishes to cart (e.g., Samosa ➔ Masala Chai / Mint Chutney).
- **Dual Payment Selector**: Supports **Cash on Counter** and simulated **UPI QR Code modal** (GPay / PhonePe / Paytm).
- **Live Order Tracking**: Visual progress stepper (*Placed* ➔ *In Kitchen* ➔ *Ready for Pickup*) with dynamic **XGBoost ML wait-time estimation** in minutes.
- **Real-Time WebSockets Alerts**: Immediate celebratory golden banner and audio chime when food is marked ready by kitchen staff.

### 2. 👨‍🍳 Kitchen & Admin Dashboard
- **Live Order Board**: Real-time incoming order cards sorted by timestamp with customer details, item breakdown, and current status.
- **Audio Chime System**: Web Audio API dual-tone chime when a new order arrives at the counter.
- **Mark as Ready CTA**: Updates status to `READY` and instantly triggers WebSockets notification to the customer's device.
- **AI Kitchen Demand Forecaster**: Random Forest Regressor tab predicting daily dish preparation quantities (with 10% safety buffer) based on day of week and 7-day rolling averages.

---

## 🧠 AIML Architecture

Three integrated machine learning models are maintained under `backend/app/ml/` and serialized to `backend/saved_models/`:

1. **Food Recommendation Engine (`recommender_rules.joblib`)**:
   - Uses `mlxtend` Apriori Association Rule Mining on transaction history.
   - Measures antecedent-consequent support, confidence, and lift.

2. **Dynamic Wait-Time Regressor (`wait_time_xgb.joblib`)**:
   - **Model**: `XGBoost Regressor`
   - **Features**: `[total_items, unique_items, max_base_prep_time, current_queue_orders, is_peak_hour]`
   - Dynamically calculates estimated preparation wait time in minutes based on real-time canteen load.

3. **Daily Demand Forecaster (`demand_forecaster_rf.joblib`)**:
   - **Model**: `Random Forest Regressor`
   - **Features**: `[item_id, day_of_week, rolling_7d_avg, is_weekend, is_holiday]`
   - Forecasts daily preparation quantities to reduce food waste and optimize kitchen prep batching.

---

## 🚀 Quick Startup Guide

### Prerequisites
- **Python 3.10+**
- **Node.js v18+ & npm**

---

### Step 1: Train ML Models & Start FastAPI Backend

```bash
# Navigate to backend directory
cd backend

# Install Python dependencies
pip install -r requirements.txt

# Run the self-contained ML Training Pipeline
python app/ml/train_models.py

# Start FastAPI server on port 8000
python -m uvicorn app.main:app --reload --port 8000
```
Backend running on: `http://localhost:8000`  
Interactive API Docs (Swagger): `http://localhost:8000/docs`

---

### Step 2: Start React + Vite Frontend

```bash
# Navigate to frontend directory (in a new terminal)
cd frontend

# Install Node dependencies
npm install

# Start Vite dev server on port 5173
npm run dev
```
Frontend running on: `http://localhost:5173`

---

## 🔌 API Endpoints Reference

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/menu` | Returns all food items with price, category, and base prep time |
| `POST` | `/api/recommendations` | Apriori association rule recommendation for current cart |
| `POST` | `/api/order` | Creates new order, runs XGBoost wait-time prediction, notifies admin |
| `GET` | `/api/orders` | Retrieves all active and past orders for kitchen dashboard |
| `GET` | `/api/orders/{order_id}` | Retrieves specific order details for customer tracking |
| `POST` | `/api/orders/{order_id}/status` | Admin updates status to `READY`, pushes WS to customer |
| `GET` | `/api/admin/forecast` | Returns Random Forest predicted daily dish demand |
| `WS` | `/ws/admin` | WebSocket connection for kitchen live queue updates |
| `WS` | `/ws/customer/{order_id}` | WebSocket connection for individual order status updates |

---

## 🛠 Tech Stack

- **Backend**: Python, FastAPI, Uvicorn, Pydantic, WebSockets
- **Machine Learning**: XGBoost, Scikit-Learn, mlxtend (Apriori), Pandas, NumPy, Joblib
- **Frontend**: React (Vite), Tailwind CSS, Lucide React Icons, Web Audio API Synthesizer
