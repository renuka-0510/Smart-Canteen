from pydantic import BaseModel, Field
from typing import List, Optional

class CartItemSchema(BaseModel):
    id: int
    name: str
    category: str
    price: float
    prep_time: int
    quantity: int
    image: str

class OrderCreateSchema(BaseModel):
    customer_name: str = Field(..., min_length=2, max_length=50)
    customer_phone: str = Field(..., min_length=10, max_length=15)
    items: List[CartItemSchema]
    payment_method: str = Field(default="UPI") # "UPI" or "CASH"

class OrderResponseSchema(BaseModel):
    order_id: str
    customer_name: str
    customer_phone: str
    items: List[CartItemSchema]
    total_amount: float
    status: str # "PLACED", "PREPARING", "READY", "COMPLETED"
    estimated_wait_time: int # predicted by XGBoost in minutes
    payment_method: str
    created_at: str

class OrderStatusUpdateSchema(BaseModel):
    status: str

class RecommendationRequestSchema(BaseModel):
    cart_items: List[str]

class RecommendationItemSchema(BaseModel):
    id: int
    name: str
    category: str
    price: float
    image: str
    confidence: float
    lift: float
    paired_with: str

class DemandForecastSchema(BaseModel):
    item_id: int
    name: str
    category: str
    predicted_daily_demand: int
    recommended_prep_qty: int
    confidence_interval: str
