import React, { useState, useEffect } from 'react';
import { X, Trash2, Plus, Minus, Sparkles, CreditCard, Banknote, ShoppingBag, ArrowRight, User, Phone } from 'lucide-react';
import { fetchRecommendations } from '../utils/api';

export default function CartDrawer({
  isOpen,
  onClose,
  cart,
  onUpdateQuantity,
  onRemoveItem,
  onAddToCart,
  onPlaceOrder
}) {
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('UPI'); // 'UPI' or 'CASH'
  const [recommendations, setRecommendations] = useState([]);
  const [loadingRecs, setLoadingRecs] = useState(false);
  const [formError, setFormError] = useState('');

  // Calculate totals
  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  // Fetch ML Apriori Recommendations whenever cart contents change
  useEffect(() => {
    if (cart.length > 0) {
      const itemNames = cart.map(i => i.name);
      setLoadingRecs(true);
      fetchRecommendations(itemNames)
        .then(recs => {
          setRecommendations(recs);
          setLoadingRecs(false);
        })
        .catch(err => {
          console.warn('Error fetching ML recommendations:', err);
          setLoadingRecs(false);
        });
    } else {
      setRecommendations([]);
    }
  }, [cart]);

  if (!isOpen) return null;

  const handleCheckoutClick = () => {
    setFormError('');
    if (!customerName.trim()) {
      setFormError('Please enter your full name');
      return;
    }
    const phoneClean = customerPhone.replace(/\D/g, '');
    if (phoneClean.length !== 10) {
      setFormError('Please enter a valid 10-digit mobile number');
      return;
    }

    onPlaceOrder({
      customerName: customerName.trim(),
      customerPhone: phoneClean,
      paymentMethod
    });
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-slate-900 border-l border-teal-800/40 shadow-2xl flex flex-col justify-between">
          
          {/* Header */}
          <div className="p-5 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between sticky top-0 z-10">
            <div className="flex items-center space-x-2">
              <ShoppingBag className="w-5 h-5 text-amber-400" />
              <h2 className="text-lg font-bold text-white">Your Food Basket</h2>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-300">
                {cart.length} items
              </span>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Cart Body */}
          <div className="flex-1 overflow-y-auto p-5 space-y-6">
            
            {cart.length === 0 ? (
              <div className="py-16 flex flex-col items-center justify-center text-center space-y-3">
                <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center text-slate-500">
                  <ShoppingBag className="w-8 h-8" />
                </div>
                <h4 className="text-base font-bold text-slate-300">Your cart is empty</h4>
                <p className="text-xs text-slate-500 max-w-xs">
                  Explore our delicious menu items and add your favorite dishes to get started.
                </p>
              </div>
            ) : (
              <>
                {/* Cart Items List */}
                <div className="space-y-3">
                  {cart.map((item) => (
                    <div 
                      key={item.id}
                      className="flex items-center justify-between p-3 rounded-xl bg-slate-800/60 border border-slate-700/50 hover:border-slate-600 transition-all"
                    >
                      <img 
                        src={item.image} 
                        alt={item.name} 
                        className="w-14 h-14 rounded-lg object-cover bg-slate-900" 
                      />
                      <div className="flex-1 ml-3 mr-2">
                        <h4 className="text-sm font-bold text-white line-clamp-1">{item.name}</h4>
                        <p className="text-xs font-semibold text-amber-400">₹{item.price}</p>
                      </div>

                      <div className="flex items-center space-x-2">
                        <div className="flex items-center space-x-1 bg-slate-900 rounded-lg p-0.5 border border-slate-700">
                          <button
                            onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
                            className="w-6 h-6 rounded text-amber-400 hover:bg-slate-800 flex items-center justify-center text-xs"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="text-xs font-bold text-white px-1.5">{item.quantity}</span>
                          <button
                            onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                            className="w-6 h-6 rounded text-emerald-400 hover:bg-slate-800 flex items-center justify-center text-xs"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>

                        <button
                          onClick={() => onRemoveItem(item.id)}
                          className="p-1 text-slate-500 hover:text-red-400 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Apriori ML Recommendation Chips */}
                {recommendations.length > 0 && (
                  <div className="p-4 rounded-2xl bg-gradient-to-br from-teal-950/60 to-slate-900 border border-teal-500/30 space-y-3">
                    <div className="flex items-center space-x-1.5 text-amber-400">
                      <Sparkles className="w-4 h-4" />
                      <h4 className="text-xs font-extrabold uppercase tracking-wider">
                        Frequently Paired With (AI Rules)
                      </h4>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {recommendations.map((rec) => (
                        <button
                          key={rec.id}
                          onClick={() => onAddToCart(rec)}
                          className="group flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-teal-800 text-xs font-semibold text-slate-200 border border-teal-700/40 hover:border-teal-400 transition-all hover:scale-105"
                        >
                          <span className="text-white group-hover:text-amber-300">{rec.name}</span>
                          <span className="text-amber-400 font-bold">+₹{rec.price}</span>
                          <Plus className="w-3.5 h-3.5 text-teal-400 group-hover:text-white" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Customer Details Form */}
                <div className="space-y-3 pt-2">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Customer Information
                  </h4>

                  {formError && (
                    <div className="p-2.5 rounded-xl bg-red-950/70 border border-red-500/40 text-xs font-medium text-red-300">
                      {formError}
                    </div>
                  )}

                  <div className="relative">
                    <User className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
                    <input
                      type="text"
                      placeholder="Your Full Name (e.g. Rahul Sharma)"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-slate-800/90 border border-slate-700 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-teal-500"
                    />
                  </div>

                  <div className="relative">
                    <Phone className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
                    <input
                      type="tel"
                      maxLength={10}
                      placeholder="10-Digit Mobile Number"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-slate-800/90 border border-slate-700 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-teal-500 font-mono"
                    />
                  </div>
                </div>

                {/* Payment Method Selector */}
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Payment Method
                  </h4>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('UPI')}
                      className={`p-3 rounded-xl border flex flex-col items-center space-y-1.5 transition-all ${
                        paymentMethod === 'UPI'
                          ? 'bg-teal-950/80 border-amber-500 text-white shadow-md shadow-amber-950/30'
                          : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:bg-slate-800'
                      }`}
                    >
                      <CreditCard className={`w-5 h-5 ${paymentMethod === 'UPI' ? 'text-amber-400' : 'text-slate-400'}`} />
                      <span className="text-xs font-bold">UPI / GPay QR</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPaymentMethod('CASH')}
                      className={`p-3 rounded-xl border flex flex-col items-center space-y-1.5 transition-all ${
                        paymentMethod === 'CASH'
                          ? 'bg-teal-950/80 border-amber-500 text-white shadow-md shadow-amber-950/30'
                          : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:bg-slate-800'
                      }`}
                    >
                      <Banknote className={`w-5 h-5 ${paymentMethod === 'CASH' ? 'text-amber-400' : 'text-slate-400'}`} />
                      <span className="text-xs font-bold">Cash on Counter</span>
                    </button>
                  </div>
                </div>
              </>
            )}

          </div>

          {/* Footer Checkout CTA */}
          {cart.length > 0 && (
            <div className="p-5 bg-slate-900 border-t border-slate-800 space-y-3">
              <div className="flex justify-between items-center text-sm font-semibold">
                <span className="text-slate-400">Grand Total</span>
                <span className="text-xl font-black text-amber-400">₹{subtotal.toFixed(2)}</span>
              </div>

              <button
                onClick={handleCheckoutClick}
                className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-emerald-700 to-teal-800 hover:from-emerald-600 hover:to-teal-700 text-white font-bold text-sm flex items-center justify-center space-x-2 shadow-lg shadow-teal-950/50 border border-teal-500/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                <span>Proceed to {paymentMethod === 'UPI' ? 'Scan & Pay' : 'Place Order'}</span>
                <ArrowRight className="w-4 h-4 text-amber-300" />
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
