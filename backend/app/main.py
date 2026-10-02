import random
import datetime
from typing import List, Dict
from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

from app.data import MENU_ITEMS
from app.models.schemas import (
    OrderCreateSchema,
    OrderResponseSchema,
    OrderStatusUpdateSchema,
    RecommendationRequestSchema,
    RecommendationItemSchema,
    DemandForecastSchema
)
from app.websocket import manager
from app.ml.inference import (
    load_models,
    get_recommendations,
    predict_wait_time,
    get_demand_forecast
)

app = FastAPI(
    title="Smart AI-Powered Canteen Management System API",
    version="1.0.0",
    description="Backend API for real-time canteen ordering, AI wait time estimation, Apriori recommendations, and demand forecasting."
)

# Enable CORS for all origins (frontend runs on 5173 or port 3000/5174)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory orders store
orders_db: Dict[str, dict] = {}

# Pre-populate with a couple of active mock orders for immediate admin board demonstration
def init_mock_orders():
    if not orders_db:
        mock1 = {
            "order_id": "ORD-1042",
            "customer_name": "Aarav Sharma",
            "customer_phone": "9876543210",
            "items": [
                {
                    "id": 1,
                    "name": "Samosa",
                    "category": "Snacks",
                    "price": 25.0,
                    "prep_time": 5,
                    "quantity": 2,
                    "image": "https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=600&q=80"
                },
                {
                    "id": 2,
                    "name": "Masala Chai",
                    "category": "Beverages",
                    "price": 20.0,
                    "prep_time": 5,
                    "quantity": 2,
                    "image": "https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=600&q=80"
                }
            ],
            "total_amount": 90.0,
            "status": "PREPARING",
            "estimated_wait_time": 12,
            "payment_method": "UPI",
            "created_at": (datetime.datetime.now() - datetime.timedelta(minutes=5)).strftime("%Y-%m-%d %H:%M:%S")
        }
        mock2 = {
            "order_id": "ORD-1041",
            "customer_name": "Priya Patel",
            "customer_phone": "9123456789",
            "items": [
                {
                    "id": 5,
                    "name": "Veg Biryani",
                    "category": "Meals",
                    "price": 160.0,
                    "prep_time": 15,
                    "quantity": 1,
                    "image": "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=600&q=80"
                },
                {
                    "id": 14,
                    "name": "Sweet Lassi",
                    "category": "Beverages",
                    "price": 50.0,
                    "prep_time": 5,
                    "quantity": 1,
                    "image": "https://images.unsplash.com/photo-1571006682860-9d046f047df1?auto=format&fit=crop&w=600&q=80"
                }
            ],
            "total_amount": 210.0,
            "status": "READY",
            "estimated_wait_time": 18,
            "payment_method": "CASH",
            "created_at": (datetime.datetime.now() - datetime.timedelta(minutes=15)).strftime("%Y-%m-%d %H:%M:%S")
        }
        orders_db["ORD-1042"] = mock1
        orders_db["ORD-1041"] = mock2

@app.on_event("startup")
def startup_event():
    load_models()
    init_mock_orders()

@app.get("/")
def read_root():
    return {
        "system": "Smart AI-Powered Canteen Management System API",
        "status": "Online",
        "version": "1.0.0"
    }

# ----------------------------------------------------
# REST ENDPOINTS
# ----------------------------------------------------

@app.get("/api/menu", response_model=List[dict])
def get_menu():
    """Return all menu items with category, price, and prep_time."""
    return MENU_ITEMS

@app.post("/api/recommendations", response_model=List[RecommendationItemSchema])
def get_cart_recommendations(req: RecommendationRequestSchema):
    """Apriori Association Rule mining recommendation endpoint."""
    return get_recommendations(req.cart_items)

@app.post("/api/order", response_model=OrderResponseSchema)
async def create_order(order_data: OrderCreateSchema):
    """Create a new order, calculate wait time using XGBoost model, and broadcast to admin."""
    if not order_data.items:
        raise HTTPException(status_code=400, detail="Cart cannot be empty.")

    total_items = sum(item.quantity for item in order_data.items)
    unique_items = len(order_data.items)
    max_base_prep_time = max(item.prep_time for item in order_data.items)
    total_amount = sum(item.price * item.quantity for item in order_data.items)
    
    # Active queue orders (pending preparation)
    current_queue_orders = sum(1 for o in orders_db.values() if o["status"] in ["PLACED", "PREPARING"])
    
    # Check if current hour is peak canteen hour (12pm-2pm or 5pm-7pm)
    now = datetime.datetime.now()
    is_peak_hour = 1 if now.hour in [12, 13, 17, 18, 19] else 0

    # ML XGBoost wait time prediction
    est_wait = predict_wait_time(
        total_items=total_items,
        unique_items=unique_items,
        max_base_prep_time=max_base_prep_time,
        current_queue_orders=current_queue_orders,
        is_peak_hour=is_peak_hour
    )

    # Generate Order ID
    order_id = f"ORD-{random.randint(1000, 9999)}"
    while order_id in orders_db:
        order_id = f"ORD-{random.randint(1000, 9999)}"

    new_order = {
        "order_id": order_id,
        "customer_name": order_data.customer_name,
        "customer_phone": order_data.customer_phone,
        "items": [item.dict() for item in order_data.items],
        "total_amount": float(total_amount),
        "status": "PLACED",
        "estimated_wait_time": est_wait,
        "payment_method": order_data.payment_method,
        "created_at": now.strftime("%Y-%m-%d %H:%M:%S")
    }

    orders_db[order_id] = new_order

    # Real-time WebSocket broadcast to Admin Dashboard
    await manager.broadcast_to_admin({
        "event": "NEW_ORDER",
        "order": new_order
    })

    return new_order

@app.get("/api/orders", response_model=List[OrderResponseSchema])
def list_orders():
    """Retrieve all orders sorted by creation time (descending)."""
    sorted_orders = sorted(orders_db.values(), key=lambda x: x["created_at"], reverse=True)
    return sorted_orders

@app.get("/api/orders/{order_id}", response_model=OrderResponseSchema)
def get_order_by_id(order_id: str):
    """Retrieve specific order details for customer tracking."""
    if order_id not in orders_db:
        raise HTTPException(status_code=404, detail="Order not found")
    return orders_db[order_id]

@app.post("/api/orders/{order_id}/status", response_model=OrderResponseSchema)
async def update_order_status(order_id: str, update: OrderStatusUpdateSchema):
    """Admin endpoint to update order status ('PREPARING', 'READY', 'COMPLETED'). Pushes WS to customer."""
    if order_id not in orders_db:
        raise HTTPException(status_code=404, detail="Order not found")

    order = orders_db[order_id]
    old_status = order["status"]
    new_status = update.status.upper()
    order["status"] = new_status

    # Push WebSocket notification to specific customer
    await manager.notify_customer(order_id, {
        "event": "STATUS_UPDATE",
        "order_id": order_id,
        "status": new_status,
        "message": f"Your order #{order_id} is now {new_status}!" if new_status != "READY" else f"🎉 Your order #{order_id} is READY for pickup at the counter!"
    })

    # Broadcast status change to admin boards as well
    await manager.broadcast_to_admin({
        "event": "ORDER_STATUS_CHANGED",
        "order_id": order_id,
        "status": new_status,
        "order": order
    })

    return order

@app.get("/api/admin/forecast", response_model=List[DemandForecastSchema])
def get_daily_demand_forecast():
    """Returns Random Forest predicted daily item prep demand for canteen kitchen."""
    return get_demand_forecast()

# ----------------------------------------------------
# WEBSOCKET ENDPOINTS
# ----------------------------------------------------

@app.websocket("/ws/admin")
async def websocket_admin(websocket: WebSocket):
    await manager.connect_admin(websocket)
    try:
        while True:
            # Keep socket alive
            data = await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect_admin(websocket)
    except Exception:
        manager.disconnect_admin(websocket)

@app.websocket("/ws/customer/{order_id}")
async def websocket_customer(order_id: str, websocket: WebSocket):
    await manager.connect_customer(order_id, websocket)
    try:
        while True:
            data = await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect_customer(order_id, websocket)
    except Exception:
        manager.disconnect_customer(order_id, websocket)
