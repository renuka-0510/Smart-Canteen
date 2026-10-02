import streamlit as st
import joblib
import numpy as np
import pandas as pd
import time
import os

st.set_page_config(
    page_title="Smart AI Canteen System",
    page_icon="🍲",
    layout="wide"
)

# -----------------------------------------------------------------------------
# 1. Load ML Models
# -----------------------------------------------------------------------------
@st.cache_resource
def load_models():
    # Adjust paths if files are inside backend/saved_models/
    base_path = "backend/saved_models" if os.path.exists("backend/saved_models") else "saved_models"
    
    rules = joblib.load(os.path.join(base_path, "recommender_rules.joblib"))
    wait_model = joblib.load(os.path.join(base_path, "wait_time_xgb.joblib"))
    demand_model = joblib.load(os.path.join(base_path, "demand_forecaster_rf.joblib"))
    return rules, wait_model, demand_model

try:
    rules_df, wait_time_model, demand_model = load_models()
except Exception as e:
    st.error(f"Error loading models. Run train_models.py first! Details: {e}")
    st.stop()

# -----------------------------------------------------------------------------
# 2. Session State for Orders & Menu
# -----------------------------------------------------------------------------
if "orders" not in st.session_state:
    st.session_state.orders = []

if "cart" not in st.session_state:
    st.session_state.cart = {}

menu = {
    "Samosa": {"price": 15, "category": "Snacks", "prep": 3, "img": "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=300"},
    "Masala Chai": {"price": 10, "category": "Beverages", "prep": 2, "img": "https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=300"},
    "Masala Dosa": {"price": 60, "category": "Meals", "prep": 8, "img": "https://images.unsplash.com/photo-1668236543090-82eba5ee5976?w=300"},
    "Veg Burger": {"price": 50, "category": "Snacks", "prep": 7, "img": "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=300"},
    "Cold Coffee": {"price": 30, "category": "Beverages", "prep": 2, "img": "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=300"}
}

# -----------------------------------------------------------------------------
# 3. Sidebar Navigation
# -----------------------------------------------------------------------------
st.sidebar.title("🍽️ Smart Canteen")
portal = st.sidebar.radio("Navigate View", ["Customer Portal", "Canteen Owner Dashboard"])

# -----------------------------------------------------------------------------
# 4. Customer Portal
# -----------------------------------------------------------------------------
if portal == "Customer Portal":
    st.title("🛒 Student Food Ordering Portal")
    st.write("Browse menu, get ML dish recommendations, and track orders.")
    
    col1, col2 = st.columns([2, 1])
    
    with col1:
        st.subheader("Today's Menu")
        cols = st.columns(3)
        for i, (item, details) in enumerate(menu.items()):
            with cols[i % 3]:
                st.image(details["img"], use_container_width=True)
                st.markdown(f"**{item}** — ₹{details['price']}")
                if st.button(f"Add to Cart", key=f"add_{item}"):
                    st.session_state.cart[item] = st.session_state.cart.get(item, 0) + 1
                    st.rerun()

        # Apriori Recommendation Engine
        if st.session_state.cart:
            st.markdown("---")
            st.subheader("💡 Frequently Paired With Your Cart (Apriori ML)")
            cart_items = list(st.session_state.cart.keys())
            recs = set()
            for rule in rules_df.itertuples():
                if set(rule.antecedents).issubset(set(cart_items)):
                    recs.update(rule.consequents)
            recs = list(recs - set(cart_items))
            
            if recs:
                rec_cols = st.columns(len(recs[:3]))
                for idx, r_item in enumerate(recs[:3]):
                    with rec_cols[idx]:
                        st.info(f"👉 Recommended: **{r_item}**")
                        if st.button(f"Add {r_item}", key=f"rec_{r_item}"):
                            st.session_state.cart[r_item] = st.session_state.cart.get(r_item, 0) + 1
                            st.rerun()

    with col2:
        st.subheader("Your Cart")
        if not st.session_state.cart:
            st.write("Your cart is empty.")
        else:
            total = 0
            for item, qty in list(st.session_state.cart.items()):
                price = menu.get(item, {}).get("price", 20)
                subtotal = price * qty
                total += subtotal
                st.write(f"• {item} x {qty} = ₹{subtotal}")
            
            st.markdown(f"### Total: ₹{total}")
            
            if st.button("Clear Cart"):
                st.session_state.cart = {}
                st.rerun()
                
            st.markdown("---")
            st.subheader("Checkout Details")
            c_name = st.text_input("Full Name")
            c_phone = st.text_input("10-digit Phone Number")
            payment_mode = st.radio("Payment Method", ["Cash on Counter", "UPI App"])
            
            if st.button("Place Order Now", type="primary"):
                if not c_name or not c_phone:
                    st.warning("Please enter your name and phone number.")
                else:
                    order_id = f"ORD-{np.random.randint(1000, 9999)}"
                    total_items = sum(st.session_state.cart.values())
                    unique_items = len(st.session_state.cart)
                    max_prep = max([menu.get(it, {}).get("prep", 4) for it in st.session_state.cart.keys()])
                    queue_len = len([o for o in st.session_state.orders if o["status"] != "Ready"])
                    
                    # XGBoost Wait-Time Inference
                    features = np.array([[total_items, unique_items, max_prep, queue_len, 1]])
                    pred_wait = int(np.round(wait_time_model.predict(features)[0]))
                    
                    order_entry = {
                        "order_id": order_id,
                        "name": c_name,
                        "phone": c_phone,
                        "items": dict(st.session_state.cart),
                        "total": total,
                        "payment": payment_mode,
                        "wait_time": pred_wait,
                        "status": "In Kitchen",
                        "timestamp": time.strftime("%H:%M:%S")
                    }
                    st.session_state.orders.append(order_entry)
                    st.session_state.cart = {}
                    st.success(f"Order {order_id} placed successfully!")
                    st.rerun()

    # Active Order Tracking Section
    if st.session_state.orders:
        st.markdown("---")
        st.subheader("📦 Order Live Tracker")
        for ord in reversed(st.session_state.orders[-3:]):
            with st.container():
                st.info(f"**Order ID:** {ord['order_id']} | **Customer:** {ord['name']} ({ord['phone']})")
                st.write(f"⏱️ **ML Predicted Wait Time:** ~{ord['wait_time']} mins | **Status:** `{ord['status']}`")
                if ord["status"] == "Ready":
                    st.balloons()
                    st.success("🔔 **NOTIFICATION:** Your order is packed and ready for pickup at the counter!")

# -----------------------------------------------------------------------------
# 5. Canteen Owner Dashboard
# -----------------------------------------------------------------------------
else:
    st.title("👨‍🍳 Canteen Owner & Kitchen Dashboard")
    tab1, tab2 = st.tabs(["Active Kitchen Queue", "📈 AI Demand Insights"])
    
    with tab1:
        st.subheader("Live Incoming Orders")
        if not st.session_state.orders:
            st.info("No active orders in queue.")
        else:
            for idx, ord in enumerate(st.session_state.orders):
                col_a, col_b = st.columns([3, 1])
                with col_a:
                    st.markdown(f"### {ord['order_id']} — {ord['name']} ({ord['phone']})")
                    st.write(f"**Items:** {ord['items']} | **Total:** ₹{ord['total']} ({ord['payment']})")
                    st.write(f"**Status:** `{ord['status']}` | Placed at: {ord['timestamp']}")
                with col_b:
                    if ord["status"] != "Ready":
                        if st.button("Mark as Ready 🔔", key=f"ready_{ord['order_id']}"):
                            st.session_state.orders[idx]["status"] = "Ready"
                            st.rerun()
                    else:
                        st.success("Ready for Pickup")
                st.divider()

    with tab2:
        st.subheader("Smart Stock & Demand Forecaster (Random Forest)")
        day = st.selectbox("Select Day to Forecast", ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"])
        day_map = {"Monday": 0, "Tuesday": 1, "Wednesday": 2, "Thursday": 3, "Friday": 4, "Saturday": 5, "Sunday": 6}
        
        day_val = day_map[day]
        pred_units = int(np.round(demand_model.predict(np.array([[day_val, 45]]))[0]))
        
        st.metric(label=f"Predicted Daily Demand for {day}", value=f"{pred_units} servings")
        st.info(f"Recommended batch preparation: **{pred_units + 5} units** (includes safety buffer).")