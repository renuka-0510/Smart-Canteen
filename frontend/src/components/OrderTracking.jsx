import React, { useState, useEffect } from 'react';
import { Clock, CheckCircle2, AlertCircle, Sparkles, Utensils, Search, Bell, Volume2, ShieldCheck } from 'lucide-react';
import { fetchOrder, connectCustomerWebSocket } from '../utils/api';
import { soundSynth } from '../utils/audio';

export default function OrderTracking({ currentOrderId, onSelectNewOrder }) {
  const [searchId, setSearchId] = useState(currentOrderId || '');
  const [activeOrder, setActiveOrder] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isReadyAlert, setIsReadyAlert] = useState(false);

  useEffect(() => {
    if (currentOrderId) {
      setSearchId(currentOrderId);
      loadOrderDetails(currentOrderId);
    }
  }, [currentOrderId]);

  // Connect WebSockets when active order changes
  useEffect(() => {
    if (!activeOrder) return;

    const socket = connectCustomerWebSocket(
      activeOrder.order_id,
      (data) => {
        if (data.event === 'STATUS_UPDATE') {
          setActiveOrder(prev => prev ? { ...prev, status: data.status } : prev);
          if (data.status === 'READY') {
            setIsReadyAlert(true);
            soundSynth.playOrderReadyChime();
          }
        }
      },
      (err) => console.warn('Customer WebSocket error:', err)
    );

    return () => {
      socket.close();
    };
  }, [activeOrder?.order_id]);

  const loadOrderDetails = async (id) => {
    if (!id) return;
    setLoading(true);
    setError('');
    setIsReadyAlert(false);

    try {
      const data = await fetchOrder(id.trim().toUpperCase());
      setActiveOrder(data);
      if (data.status === 'READY') {
        setIsReadyAlert(true);
      }
    } catch (err) {
      setError('Order not found. Please check your Order ID.');
      setActiveOrder(null);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchId) {
      loadOrderDetails(searchId);
    }
  };

  // Status Stepper indices
  const getStepStatus = (stepName) => {
    if (!activeOrder) return 'pending';
    const statusOrder = ['PLACED', 'PREPARING', 'READY', 'COMPLETED'];
    const currentIndex = statusOrder.indexOf(activeOrder.status);
    const stepIndex = statusOrder.indexOf(stepName);

    if (currentIndex > stepIndex) return 'completed';
    if (currentIndex === stepIndex) return 'active';
    return 'pending';
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
      
      {/* Search Header */}
      <div className="p-6 rounded-3xl bg-slate-900 border border-teal-800/40 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-black text-white flex items-center space-x-2">
              <Clock className="w-6 h-6 text-amber-400" />
              <span>Live Order Tracking</span>
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Real-time updates powered by FastAPI WebSockets & XGBoost Wait-Time AI
            </p>
          </div>

          {/* Search Input Form */}
          <form onSubmit={handleSearchSubmit} className="flex items-center space-x-2">
            <input
              type="text"
              placeholder="Enter ORD-XXXX"
              value={searchId}
              onChange={(e) => setSearchId(e.target.value)}
              className="px-4 py-2 rounded-xl bg-slate-800 border border-slate-700 text-sm text-white placeholder-slate-500 font-mono focus:outline-none focus:border-amber-500 uppercase"
            />
            <button
              type="submit"
              disabled={loading}
              className="p-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold transition-all"
            >
              <Search className="w-5 h-5" />
            </button>
          </form>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-red-950/80 border border-red-500/40 text-red-200 text-sm font-semibold flex items-center space-x-3">
          <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {activeOrder && (
        <>
          {/* READY FOR PICKUP PROMINENT BANNER */}
          {isReadyAlert && (
            <div className="p-6 rounded-3xl bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 text-slate-950 shadow-2xl animate-pulse-glow flex flex-col md:flex-row items-center justify-between gap-4 border-2 border-yellow-300">
              <div className="flex items-center space-x-4">
                <div className="p-3 rounded-2xl bg-slate-950 text-amber-400">
                  <Bell className="w-8 h-8 animate-bounce" />
                </div>
                <div>
                  <h3 className="text-2xl font-black tracking-tight">🎉 YOUR FOOD IS READY!</h3>
                  <p className="text-sm font-bold text-slate-900">
                    Order #{activeOrder.order_id} is hot and ready for pickup at Counter #1.
                  </p>
                </div>
              </div>
              <button
                onClick={() => soundSynth.playOrderReadyChime()}
                className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-slate-950 text-amber-300 hover:bg-slate-900 text-xs font-bold transition-colors"
              >
                <Volume2 className="w-4 h-4" />
                <span>Replay Chime</span>
              </button>
            </div>
          )}

          {/* Stepper & ML Wait Badge */}
          <div className="p-8 rounded-3xl bg-slate-900/90 border border-teal-500/30 shadow-2xl space-y-8">
            
            {/* Header info */}
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-6">
              <div>
                <div className="flex items-center space-x-3">
                  <span className="text-2xl font-black font-mono text-amber-400">
                    #{activeOrder.order_id}
                  </span>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
                    activeOrder.status === 'READY' ? 'bg-amber-400 text-slate-950 font-black' :
                    activeOrder.status === 'PREPARING' ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40' :
                    'bg-slate-800 text-slate-300'
                  }`}>
                    {activeOrder.status}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  Placed on {activeOrder.created_at} • {activeOrder.customer_name} (+91 {activeOrder.customer_phone})
                </p>
              </div>

              {/* XGBoost Wait Time Badge */}
              <div className="p-4 rounded-2xl bg-slate-800/80 border border-teal-500/40 flex items-center space-x-3 shadow-lg">
                <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-400">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-bold text-teal-300 uppercase tracking-wider">
                    XGBoost AI Estimated Wait
                  </div>
                  <div className="text-xl font-extrabold text-white">
                    ~{activeOrder.estimated_wait_time} Minutes
                  </div>
                </div>
              </div>
            </div>

            {/* Live Progress Stepper */}
            <div className="py-4">
              <div className="grid grid-cols-3 gap-4 relative">
                
                {/* Step 1: Placed */}
                <div className="flex flex-col items-center text-center space-y-2">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-sm transition-all ${
                    getStepStatus('PLACED') === 'completed' || getStepStatus('PLACED') === 'active'
                      ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-950/50 ring-4 ring-emerald-500/20'
                      : 'bg-slate-800 text-slate-500'
                  }`}>
                    1
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">Order Placed</h4>
                    <p className="text-[11px] text-slate-400">Received at Counter</p>
                  </div>
                </div>

                {/* Step 2: Preparing */}
                <div className="flex flex-col items-center text-center space-y-2">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-sm transition-all ${
                    getStepStatus('PREPARING') === 'completed'
                      ? 'bg-emerald-600 text-white shadow-lg'
                      : getStepStatus('PREPARING') === 'active'
                      ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-950/50 ring-4 ring-amber-500/30 animate-pulse'
                      : 'bg-slate-800 text-slate-500'
                  }`}>
                    2
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">In Kitchen</h4>
                    <p className="text-[11px] text-slate-400">Chef is preparing</p>
                  </div>
                </div>

                {/* Step 3: Ready */}
                <div className="flex flex-col items-center text-center space-y-2">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-sm transition-all ${
                    getStepStatus('READY') === 'active' || activeOrder.status === 'READY' || activeOrder.status === 'COMPLETED'
                      ? 'bg-amber-400 text-slate-950 shadow-xl ring-4 ring-yellow-400/40 animate-bounce'
                      : 'bg-slate-800 text-slate-500'
                  }`}>
                    3
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">Ready for Pickup</h4>
                    <p className="text-[11px] text-slate-400">Collect at Counter</p>
                  </div>
                </div>

              </div>
            </div>

            {/* Item Breakdown Summary */}
            <div className="space-y-4 pt-4 border-t border-slate-800">
              <h4 className="text-xs font-extrabold uppercase text-slate-400 tracking-wider flex items-center space-x-2">
                <Utensils className="w-4 h-4 text-teal-400" />
                <span>Order Summary ({activeOrder.items.length} dishes)</span>
              </h4>

              <div className="divide-y divide-slate-800/60 bg-slate-800/40 rounded-2xl border border-slate-700/40">
                {activeOrder.items.map((item, idx) => (
                  <div key={idx} className="p-4 flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <img src={item.image} alt={item.name} className="w-12 h-12 rounded-xl object-cover" />
                      <div>
                        <h5 className="text-sm font-bold text-white">{item.name}</h5>
                        <p className="text-xs text-slate-400">Qty: {item.quantity} × ₹{item.price}</p>
                      </div>
                    </div>
                    <span className="text-sm font-bold text-amber-400">
                      ₹{(item.price * item.quantity).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>

              <div className="flex justify-between items-center p-4 rounded-2xl bg-slate-800 border border-slate-700 text-sm font-bold">
                <span className="text-slate-300">
                  Payment Method ({activeOrder.payment_method})
                </span>
                <span className="text-xl font-black text-amber-400">
                  ₹{activeOrder.total_amount.toFixed(2)}
                </span>
              </div>
            </div>

          </div>
        </>
      )}

    </div>
  );
}
