import os
import random
import numpy as np
import pandas as pd
import joblib
from sklearn.ensemble import RandomForestRegressor, GradientBoostingRegressor
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error, r2_score

try:
    from mlxtend.preprocessing import TransactionEncoder
    from mlxtend.frequent_patterns import apriori, association_rules
    HAS_MLXTEND = True
except ImportError:
    HAS_MLXTEND = False

try:
    from xgboost import XGBRegressor
    HAS_XGBOOST = True
except ImportError:
    HAS_XGBOOST = False

# Ensure output directory exists
SAVED_MODELS_DIR = os.path.join(os.path.dirname(__file__), "..", "..", "saved_models")
os.makedirs(SAVED_MODELS_DIR, exist_ok=True)

print("Starting ML Models Training...")

# ==========================================
# 1. FOOD RECOMMENDATION ENGINE (APRIORI)
# ==========================================
def train_recommender():
    print("\n--- Training Food Recommendation Engine (Apriori) ---")
    
    frequent_combos = [
        ["Samosa", "Masala Chai"],
        ["Samosa", "Masala Chai", "Mint Chutney"],
        ["Paneer Butter Masala", "Butter Naan", "Mango Lassi"],
        ["Paneer Butter Masala", "Butter Naan"],
        ["Veg Biryani", "Raita", "Gulab Jamun"],
        ["Veg Biryani", "Raita"],
        ["Chole Bhature", "Sweet Lassi"],
        ["Masala Dosa", "Filter Coffee"],
        ["Idli Sambhar", "Filter Coffee"],
        ["Burger", "French Fries", "Cold Coffee"],
        ["Burger", "French Fries"],
        ["Hakka Noodles", "Manchow Soup"],
        ["Spring Roll", "Cold Drink"],
        ["Pasta", "Garlic Bread", "Cold Drink"],
        ["Sandwich", "Cold Coffee"],
        ["Cold Coffee", "French Fries"],
        ["Masala Chai", "Bun Maska"],
    ]
    
    all_items = [
        "Samosa", "Masala Chai", "Mint Chutney", "Paneer Butter Masala", 
        "Butter Naan", "Mango Lassi", "Veg Biryani", "Raita", "Gulab Jamun", 
        "Chole Bhature", "Sweet Lassi", "Masala Dosa", "Filter Coffee", 
        "Idli Sambhar", "Burger", "French Fries", "Cold Coffee", 
        "Hakka Noodles", "Manchow Soup", "Spring Roll", "Cold Drink", 
        "Pasta", "Garlic Bread", "Sandwich", "Bun Maska"
    ]
    
    transactions = []
    np.random.seed(42)
    random.seed(42)
    
    for _ in range(1200):
        if random.random() < 0.75:
            combo = list(random.choice(frequent_combos))
            if random.random() < 0.3:
                random_item = random.choice(all_items)
                if random_item not in combo:
                    combo.append(random_item)
            transactions.append(combo)
        else:
            k = random.randint(1, 3)
            sample_items = random.sample(all_items, k=k)
            transactions.append(sample_items)

    recommendation_map = {}

    if HAS_MLXTEND:
        print("Using mlxtend Apriori engine...")
        te = TransactionEncoder()
        te_ary = te.fit(transactions).transform(transactions)
        df = pd.DataFrame(te_ary, columns=te.columns_)

        frequent_itemsets = apriori(df, min_support=0.015, use_colnames=True)
        rules = association_rules(frequent_itemsets, metric="lift", min_threshold=1.1)

        for _, row in rules.iterrows():
            ants = list(row['antecedents'])
            conseqs = list(row['consequents'])
            confidence = float(row['confidence'])
            lift = float(row['lift'])
            
            for ant in ants:
                if ant not in recommendation_map:
                    recommendation_map[ant] = []
                for c in conseqs:
                    if c != ant:
                        recommendation_map[ant].append({
                            "item": c,
                            "confidence": round(confidence, 3),
                            "lift": round(lift, 3)
                        })
    else:
        print("Using Native Apriori Rule Mining engine...")
        # Pure Python Apriori implementation
        N = len(transactions)
        item_counts = {}
        pair_counts = {}

        for t in transactions:
            unique_t = set(t)
            for item in unique_t:
                item_counts[item] = item_counts.get(item, 0) + 1
            for item1 in unique_t:
                for item2 in unique_t:
                    if item1 != item2:
                        pair_counts[(item1, item2)] = pair_counts.get((item1, item2), 0) + 1

        for (item1, item2), pair_c in pair_counts.items():
            supp_both = pair_c / N
            if supp_both >= 0.015:
                conf = pair_c / item_counts[item1]
                supp_item2 = item_counts[item2] / N
                lift = conf / supp_item2 if supp_item2 > 0 else 1.0
                
                if lift >= 1.1:
                    if item1 not in recommendation_map:
                        recommendation_map[item1] = []
                    recommendation_map[item1].append({
                        "item": item2,
                        "confidence": round(conf, 3),
                        "lift": round(lift, 3)
                    })

    # Deduplicate and sort recommendation map
    for item, recs in recommendation_map.items():
        seen = set()
        unique_recs = []
        for r in sorted(recs, key=lambda x: (x['lift'], x['confidence']), reverse=True):
            if r['item'] not in seen:
                seen.add(r['item'])
                unique_recs.append(r)
        recommendation_map[item] = unique_recs

    recommender_path = os.path.join(SAVED_MODELS_DIR, "recommender_rules.joblib")
    joblib.dump({"recommendation_map": recommendation_map}, recommender_path)
    print(f"Saved Recommender Model to {recommender_path} ({len(recommendation_map)} items mapped)")


# ==========================================
# 2. DYNAMIC WAIT-TIME REGRESSOR
# ==========================================
def train_wait_time_model():
    print("\n--- Training Dynamic Wait-Time Regressor ---")
    
    np.random.seed(42)
    n_samples = 2500
    
    total_items = np.random.randint(1, 12, size=n_samples)
    unique_items = np.clip(total_items - np.random.randint(0, 3, size=n_samples), 1, None)
    max_base_prep_time = np.random.choice([5, 8, 12, 15, 20], size=n_samples)
    current_queue_orders = np.random.randint(0, 25, size=n_samples)
    is_peak_hour = np.random.choice([0, 1], size=n_samples, p=[0.6, 0.4])
    
    wait_time = (
        max_base_prep_time * 0.8 +
        (total_items * 1.4) +
        (unique_items * 0.9) +
        (current_queue_orders * 1.8) +
        (is_peak_hour * 5.5) +
        np.random.normal(0, 1.5, size=n_samples)
    )
    wait_time = np.clip(wait_time, 4, 60)

    X = pd.DataFrame({
        "total_items": total_items,
        "unique_items": unique_items,
        "max_base_prep_time": max_base_prep_time,
        "current_queue_orders": current_queue_orders,
        "is_peak_hour": is_peak_hour
    })
    y = wait_time

    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

    if HAS_XGBOOST:
        print("Using XGBoost Regressor engine...")
        model = XGBRegressor(
            n_estimators=120,
            learning_rate=0.06,
            max_depth=5,
            subsample=0.85,
            colsample_bytree=0.85,
            random_state=42
        )
    else:
        print("Using Scikit-Learn GradientBoostingRegressor engine...")
        model = GradientBoostingRegressor(
            n_estimators=120,
            learning_rate=0.06,
            max_depth=5,
            random_state=42
        )

    model.fit(X_train, y_train)

    preds = model.predict(X_test)
    mae = mean_absolute_error(y_test, preds)
    r2 = r2_score(y_test, preds)
    print(f"Wait-Time Model Performance: MAE = {mae:.2f} mins, R2 Score = {r2:.3f}")

    wait_time_path = os.path.join(SAVED_MODELS_DIR, "wait_time_xgb.joblib")
    joblib.dump(model, wait_time_path)
    print(f"Saved Dynamic Wait-Time Model to {wait_time_path}")


# ==========================================
# 3. DAILY DEMAND FORECASTER (RANDOM FOREST)
# ==========================================
def train_demand_forecaster():
    print("\n--- Training Daily Demand Forecaster (Random Forest) ---")
    
    np.random.seed(42)
    item_ids = list(range(1, 16))
    
    base_demand = {
        1: 95, 2: 140, 3: 70, 4: 85, 5: 65, 
        6: 50, 7: 60, 8: 55, 9: 75, 10: 80, 
        11: 40, 12: 35, 13: 45, 14: 30, 15: 50
    }

    records = []
    for day in range(180):
        day_of_week = day % 7
        is_weekend = 1 if day_of_week in [5, 6] else 0
        is_holiday = 1 if day in [15, 45, 90, 135, 170] else 0
        
        for item_id in item_ids:
            b_demand = base_demand[item_id]
            weekend_multiplier = 1.3 if is_weekend and item_id in [3, 4, 5, 6] else (0.85 if is_weekend else 1.0)
            holiday_multiplier = 0.4 if is_holiday else 1.0
            day_mult = 1.15 if day_of_week in [0, 4] else 1.0
            
            actual_quantity = max(10, int(b_demand * weekend_multiplier * holiday_multiplier * day_mult + np.random.normal(0, 8)))
            
            records.append({
                "day": day,
                "item_id": item_id,
                "day_of_week": day_of_week,
                "is_weekend": is_weekend,
                "is_holiday": is_holiday,
                "actual_quantity": actual_quantity
            })

    df = pd.DataFrame(records)
    df['rolling_7d_avg'] = df.groupby('item_id')['actual_quantity'].transform(lambda x: x.shift(1).rolling(7, min_periods=1).mean()).fillna(df['actual_quantity'])

    X = df[['item_id', 'day_of_week', 'rolling_7d_avg', 'is_weekend', 'is_holiday']]
    y = df['actual_quantity']

    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.15, random_state=42)

    rf_model = RandomForestRegressor(n_estimators=100, max_depth=10, random_state=42)
    rf_model.fit(X_train, y_train)

    preds = rf_model.predict(X_test)
    mae = mean_absolute_error(y_test, preds)
    r2 = r2_score(y_test, preds)
    print(f"Random Forest Demand Forecaster Performance: MAE = {mae:.2f} units, R2 Score = {r2:.3f}")

    forecaster_path = os.path.join(SAVED_MODELS_DIR, "demand_forecaster_rf.joblib")
    joblib.dump(rf_model, forecaster_path)
    print(f"Saved Daily Demand Forecaster to {forecaster_path}")

if __name__ == "__main__":
    train_recommender()
    train_wait_time_model()
    train_demand_forecaster()
    print("\nAll 3 ML models trained and serialized successfully!")
