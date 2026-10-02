import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import FoodCard from './components/FoodCard';
import CartDrawer from './components/CartDrawer';
import PaymentModal from './components/PaymentModal';
import OrderTracking from './components/OrderTracking';
import AdminDashboard from './components/AdminDashboard';
import { fetchMenu, createOrder } from './utils/api';
import { Sparkles, Utensils, Search, CheckCircle2 } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState('menu'); // 'menu', 'tracking', 'admin'
  const [menuItems, setMenuItems] = useState([]);
  const [loadingMenu, setLoadingMenu] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Cart State
  const [cart, setCart] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  
  // Payment Modal State
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [pendingCheckout, setPendingCheckout] = useState(null);

  // Active Order Tracking ID
  const [currentOrderId, setCurrentOrderId] = useState('');

  // Load Menu on Mount
  useEffect(() => {
    loadMenu();
  }, []);

  const loadMenu = async () => {
    setLoadingMenu(true);
    try {
      const data = await fetchMenu();
      setMenuItems(data);
    } catch (err) {
      console.error('Failed to load menu items:', err);
    } finally {
      setLoadingMenu(false);
    }
  };

  // Cart Handlers
  const handleAddToCart = (item) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === item.id);
      if (existing) {
        return prev.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { ...item, quantity: 1 }];
    });
  };

  const handleUpdateQuantity = (itemId, newQuantity) => {
    if (newQuantity <= 0) {
      handleRemoveFromCart(itemId);
      return;
    }
    setCart(prev => prev.map(i => i.id === itemId ? { ...i, quantity: newQuantity } : i));
  };

  const handleRemoveFromCart = (itemId) => {
    setCart(prev => prev.filter(i => i.id !== itemId));
  };

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const cartSubtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  // Checkout Handler
  const handleInitiateOrder = (checkoutDetails) => {
    setPendingCheckout(checkoutDetails);
    if (checkoutDetails.paymentMethod === 'UPI') {
      setIsCartOpen(false);
      setIsPaymentModalOpen(true);
    } else {
      // Cash on Counter direct order submission
      submitFinalOrder(checkoutDetails);
    }
  };

  const submitFinalOrder = async (checkoutDetails) => {
    try {
      const orderPayload = {
        customer_name: checkoutDetails.customerName,
        customer_phone: checkoutDetails.customerPhone,
        payment_method: checkoutDetails.paymentMethod,
        items: cart.map(i => ({
          id: i.id,
          name: i.name,
          category: i.category,
          price: i.price,
          prep_time: i.prep_time,
          quantity: i.quantity,
          image: i.image
        }))
      };

      const res = await createOrder(orderPayload);
      
      // Clear Cart & Modals
      setCart([]);
      setIsCartOpen(false);
      setIsPaymentModalOpen(false);
      setPendingCheckout(null);

      // Navigate to Order Tracking
      setCurrentOrderId(res.order_id);
      setActiveTab('tracking');

    } catch (err) {
      alert(`Order placement failed: ${err.message}`);
    }
  };

  // Filtered Menu
  const categories = ['All', 'Snacks', 'Meals', 'Beverages'];
  const filteredMenu = menuItems.filter(item => {
    const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          item.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-amber-500 selection:text-slate-950">
      
      {/* Top Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        cartCount={cartCount}
        onOpenCart={() => setIsCartOpen(true)}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {activeTab === 'menu' && (
          <div className="space-y-8 animate-fade-in">
            
            {/* Hero Banner */}
            <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-teal-950 via-slate-900 to-slate-950 border border-teal-800/40 p-8 sm:p-12 shadow-2xl">
              <div className="relative z-10 max-w-2xl space-y-4">
                <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-bold">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>AI Dynamic Wait-Time & Smart Recommendations</span>
                </div>
                <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight">
                  Delicious Food, <br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-yellow-300 to-teal-300">
                    Zero Counter Waiting.
                  </span>
                </h1>
                <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
                  Order directly from your phone. Our XGBoost AI predicts live preparation wait times and pairs your meals with smart recommendations.
                </p>
              </div>

              {/* Decorative background glow */}
              <div className="absolute -right-16 -bottom-16 w-80 h-80 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute right-32 -top-16 w-60 h-60 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
            </div>

            {/* Category Filter & Search Bar */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              
              {/* Category Pills */}
              <div className="flex items-center space-x-2 overflow-x-auto pb-2 md:pb-0 scrollbar-none">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-5 py-2.5 rounded-2xl text-xs font-extrabold transition-all duration-200 whitespace-nowrap ${
                      selectedCategory === cat
                        ? 'bg-teal-800 text-white shadow-lg shadow-teal-950/60 border border-teal-500/40 scale-105'
                        : 'bg-slate-900/80 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Search Bar */}
              <div className="relative w-full md:w-72">
                <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  placeholder="Search Samosa, Chai, Biryani..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-teal-500"
                />
              </div>

            </div>

            {/* Food Grid */}
            {loadingMenu ? (
              <div className="py-20 text-center text-slate-400 text-sm font-semibold">
                Loading gourmet menu...
              </div>
            ) : filteredMenu.length === 0 ? (
              <div className="py-20 text-center text-slate-500 space-y-2">
                <p className="text-base font-bold">No dishes found</p>
                <p className="text-xs">Try selecting a different category or clear your search.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredMenu.map((item) => {
                  const cartItem = cart.find(i => i.id === item.id);
                  const qty = cartItem ? cartItem.quantity : 0;
                  return (
                    <FoodCard
                      key={item.id}
                      item={item}
                      cartQuantity={qty}
                      onAddToCart={handleAddToCart}
                      onUpdateQuantity={handleUpdateQuantity}
                    />
                  );
                })}
              </div>
            )}

          </div>
        )}

        {activeTab === 'tracking' && (
          <OrderTracking
            currentOrderId={currentOrderId}
            onSelectNewOrder={() => setActiveTab('menu')}
          />
        )}

        {activeTab === 'admin' && (
          <AdminDashboard />
        )}

      </main>

      {/* Cart Drawer */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cart={cart}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveItem={handleRemoveFromCart}
        onAddToCart={handleAddToCart}
        onPlaceOrder={handleInitiateOrder}
      />

      {/* Payment Modal */}
      {isPaymentModalOpen && pendingCheckout && (
        <PaymentModal
          totalAmount={cartSubtotal}
          customerName={pendingCheckout.customerName}
          customerPhone={pendingCheckout.customerPhone}
          onClose={() => setIsPaymentModalOpen(false)}
          onConfirmPayment={() => submitFinalOrder(pendingCheckout)}
        />
      )}

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950 py-6 text-center text-xs text-slate-500">
        <p>© 2026 Smart AI-Powered Canteen Management System. Powered by FastAPI, XGBoost & React.</p>
      </footer>

    </div>
  );
}
