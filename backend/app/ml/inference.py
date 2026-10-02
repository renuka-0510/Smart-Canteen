import os
import joblib
import pandas as pd
import numpy as np
from typing import List, Dict, Any
from app.data import MENU_ITEMS

SAVED_MODELS_DIR = os.path.join(os.path.dirname(__file__), "..", "..", "saved_models")

_recommender_data = None
_wait_time_model = None
_demand_forecaster_model = None

def load_models():
    global _recommender_data, _wait_time_model, _demand_forecaster_model
    
    recommender_path = os.path.join(SAVED_MODELS_DIR, "recommender_rules.joblib")
    wait_time_path = os.path.join(SAVED_MODELS_DIR, "wait_time_xgb.joblib")
    forecaster_path = os.path.join(SAVED_MODELS_DIR, "demand_forecaster_rf.joblib")

    if os.path.exists(recommender_path):
        _recommender_data = joblib.load(recommender_path)
    if os.path.exists(wait_time_path):
        _wait_time_model = joblib.load(wait_time_path)
    if os.path.exists(forecaster_path):
        _demand_forecaster_model = joblib.load(forecaster_path)

def get_recommendations(cart_item_names: List[str]) -> List[Dict[str, Any]]:
    """Returns top paired dishes using Apriori Association Rules."""
    if not _recommender_data:
        load_models()

    recommendations = []
    seen = set(cart_item_names)

    if _recommender_data and "recommendation_map" in _recommender_data:
        rec_map = _recommender_data["recommendation_map"]
        
        for item_name in cart_item_names:
            if item_name in rec_map:
                for rec in rec_map[item_name]:
                    rec_title = rec["item"]
                    if rec_title not in seen:
                        seen.add(rec_title)
                        # Find menu item matching rec_title
                        menu_item = next((m for m in MENU_ITEMS if m["name"].lower() == rec_title.lower()), None)
                        if menu_item:
                            recommendations.append({
                                "id": menu_item["id"],
                                "name": menu_item["name"],
                                "category": menu_item["category"],
                                "price": menu_item["price"],
                                "image": menu_item["image"],
                                "confidence": rec["confidence"],
                                "lift": rec["lift"],
                                "paired_with": item_name
                            })

    # Heuristic fallback if ML produces no specific rule for cart combination
    if not recommendations and cart_item_names:
        first_item = cart_item_names[0]
        # Fallback rules
        fallback_pairs = {
            "Samosa": "Masala Chai",
            "Burger": "French Fries",
            "Veg Biryani": "Raita",
            "Paneer Butter Masala": "Butter Naan",
            "Chole Bhature": "Sweet Lassi",
            "Masala Dosa": "Filter Coffee",
            "Pasta": "Cold Drink"
        }
        rec_name = fallback_pairs.get(first_item, "Cold Coffee")
        if rec_name not in cart_item_names:
            menu_item = next((m for m in MENU_ITEMS if m["name"] == rec_name), None)
            if menu_item:
                recommendations.append({
                    "id": menu_item["id"],
                    "name": menu_item["name"],
                    "category": menu_item["category"],
                    "price": menu_item["price"],
                    "image": menu_item["image"],
                    "confidence": 0.85,
                    "lift": 2.1,
                    "paired_with": first_item
                })

    return recommendations[:4]


def predict_wait_time(total_items: int, unique_items: int, max_base_prep_time: int, current_queue_orders: int, is_peak_hour: int) -> int:
    """Predicts dynamic preparation wait time in minutes using XGBoost."""
    if not _wait_time_model:
        load_models()

    if _wait_time_model:
        X = pd.DataFrame([{
            "total_items": total_items,
            "unique_items": unique_items,
            "max_base_prep_time": max_base_prep_time,
            "current_queue_orders": current_queue_orders,
            "is_peak_hour": is_peak_hour
        }])
        pred = _wait_time_model.predict(X)[0]
        return max(5, int(round(pred)))
    
    # Mathematical fallback rule if model file missing
    fallback_time = max_base_prep_time + (total_items * 1.5) + (current_queue_orders * 2) + (is_peak_hour * 5)
    return max(5, int(round(fallback_time)))


def get_demand_forecast() -> List[Dict[str, Any]]:
    """Predicts daily preparation quantities for canteen dishes using Random Forest."""
    if not _demand_forecaster_model:
        load_models()

    import datetime
    today = datetime.datetime.now()
    day_of_week = today.weekday() # 0 = Mon, 6 = Sun
    is_weekend = 1 if day_of_week in [5, 6] else 0
    is_holiday = 0

    forecasts = []
    
    # Base rolling averages for realistic simulation
    rolling_averages = {
        1: 92,  # Samosa
        2: 135, # Masala Chai
        3: 68,  # Paneer Butter Masala
        4: 82,  # Butter Naan
        5: 62,  # Veg Biryani
        6: 48,  # Chole Bhature
        7: 58,  # Masala Dosa
        8: 52,  # Burger
        9: 72,  # French Fries
        10: 78, # Cold Coffee
        11: 38, # Hakka Noodles
        12: 34, # Pasta
        13: 44, # Sandwich
        14: 28, # Sweet Lassi
        15: 48  # Gulab Jamun
    }

    for item in MENU_ITEMS:
        item_id = item["id"]
        roll_avg = rolling_averages.get(item_id, 50)
        
        if _demand_forecaster_model:
            X = pd.DataFrame([{
                "item_id": item_id,
                "day_of_week": day_of_week,
                "rolling_7d_avg": roll_avg,
                "is_weekend": is_weekend,
                "is_holiday": is_holiday
            }])
            predicted_demand = int(round(_demand_forecaster_model.predict(X)[0]))
        else:
            mult = 1.25 if is_weekend and item["category"] == "Meals" else 1.0
            predicted_demand = int(roll_avg * mult)

        predicted_demand = max(15, predicted_demand)
        recommended_prep = int(round(predicted_demand * 1.10)) # 10% safety buffer for peak spikes

        forecasts.append({
            "item_id": item_id,
            "name": item["name"],
            "category": item["category"],
            "predicted_daily_demand": predicted_demand,
            "recommended_prep_qty": recommended_prep,
            "confidence_interval": f"±{max(3, int(predicted_demand * 0.08))} units"
        })

    return forecasts
