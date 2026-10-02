import React, { useState, useEffect } from 'react';
import { LayoutDashboard, CheckCircle2, Clock, Utensils, Sparkles, Filter, AlertCircle, ChefHat, Volume2 } from 'lucide-react';
import { fetchAllOrders, updateOrderStatus, connectAdminWebSocket } from '../utils/api';
import { soundSynth } from '../utils/audio';
import DemandForecastChart from './DemandForecastChart';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('orders'); // 'orders' or 'forecast'
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [updatingId, setUpdatingId] = useState(null);

  useEffect(() => {
    loadOrders();
  }, []);

  // Connect WebSockets for Admin
  useEffect(() => {
    const socket = connectAdminWebSocket(
      (data) => {
        if (data.event === 'NEW_ORDER') {
          // Play dual audio chime sound for incoming order!
          soundSynth.playNewOrderChime();
          setOrders(prev => [data.order, ...prev.filter(o => o.order_id !== data.order.order_id)]);
        } else if (data.event === 'ORDER_STATUS_CHANGED') {
          setOrders(prev => prev.map(o => o.order_id === data.order_id ? { ...o, status: data.status } : o));
        }
      },
      (err) => console.warn('Admin WebSocket error:', err)
    );

    return () => {
      socket.close();
    };
  }, []);

  const loadOrders = async () => {
    setLoading(true);
    try {
      const data = await fetchAllOrders();
      setOrders(data);
    } catch (err) {
      console.error('Failed to load admin orders:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (orderId, newStatus) => {
    setUpdatingId(orderId);
    try {
      const updated = await updateOrderStatus(orderId, newStatus);
      setOrders(prev => prev.map(o => o.order_id === orderId ? updated : o));
    } catch (err) {
      console.error('Status update failed:', err);
    } finally {
      setUpdatingId(null);
    }
  };

  const filteredOrders = statusFilter === 'ALL'
    ? orders
    : orders.filter(o => o.status === statusFilter);

  // Summary Metrics
  const totalActive = orders.filter(o => o['status'] !== 'COMPLETED').length;
  const preparingCount = orders.filter(o => o['status'] === 'PREPARING' || o['status'] === 'PLACED').length;
  const readyCount = orders.filter(o => o['status'] === 'READY').length;
  const totalRevenue = orders.reduce((sum, o) => sum + o.total_amount, 0);

  return (
    <div className="space-y-8 animate-fade-in">
      
      {/* Admin Subnav & Header */}
      <div className="p-6 rounded-3xl bg-slate-900 border border-teal-800/40 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-white flex items-center space-x-3">
            <LayoutDashboard className="w-7 h-7 text-amber-400" />
            <span>Kitchen & Management Dashboard</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Real-time incoming orders queue & AI Kitchen demand forecasting
          </p>
        </div>

        {/* View switcher */}
        <div className="flex items-center bg-slate-800 p-1.5 rounded-2xl border border-slate-700">
          <button
            onClick={() => setActiveTab('orders')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'orders'
                ? 'bg-teal-800 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Utensils className="w-4 h-4 text-amber-300" />
            <span>Live Order Queue</span>
          </button>

          <button
            onClick={() => setActiveTab('forecast')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'forecast'
                ? 'bg-amber-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Sparkles className="w-4 h-4 text-amber-200" />
            <span>AI Demand Forecast</span>
          </button>
        </div>
      </div>

      {activeTab === 'forecast' ? (
        <DemandForecastChart />
      ) : (
        <>
          {/* Metrics bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-5 rounded-2xl bg-slate-900 border border-teal-800/40 space-y-1">
              <span className="text-[11px] font-bold text-slate-400 uppercase">Active Orders</span>
              <p className="text-2xl font-black text-white">{totalActive}</p>
            </div>
            <div className="p-5 rounded-2xl bg-slate-900 border border-amber-500/30 space-y-1">
              <span className="text-[11px] font-bold text-amber-400 uppercase">Pending Prep</span>
              <p className="text-2xl font-black text-amber-400">{preparingCount}</p>
            </div>
            <div className="p-5 rounded-2xl bg-slate-900 border border-emerald-500/30 space-y-1">
              <span className="text-[11px] font-bold text-emerald-400 uppercase">Ready for Pickup</span>
              <p className="text-2xl font-black text-emerald-400">{readyCount}</p>
            </div>
            <div className="p-5 rounded-2xl bg-slate-900 border border-teal-800/40 space-y-1">
              <span className="text-[11px] font-bold text-teal-300 uppercase">Total Sales</span>
              <p className="text-2xl font-black text-white">₹{totalRevenue.toFixed(2)}</p>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
            <div className="flex items-center space-x-2 text-xs font-bold text-slate-400">
              <Filter className="w-4 h-4 text-amber-400" />
              <span>Filter by Status:</span>
            </div>

            <div className="flex flex-wrap gap-2">
              {['ALL', 'PLACED', 'PREPARING', 'READY', 'COMPLETED'].map((st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    statusFilter === st
                      ? 'bg-amber-500 text-slate-950 shadow-md'
                      : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          {/* Orders Cards Board */}
          {loading ? (
            <div className="py-12 text-center text-slate-400 text-sm">Loading order queue...</div>
          ) : filteredOrders.length === 0 ? (
            <div className="py-16 text-center text-slate-500 space-y-2">
              <p className="text-base font-bold">No orders found matching filter</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredOrders.map((order) => (
                <div
                  key={order.order_id}
                  className={`p-6 rounded-3xl bg-slate-900 border transition-all space-y-5 ${
                    order.status === 'READY'
                      ? 'border-amber-400/80 bg-gradient-to-br from-slate-900 to-amber-950/20'
                      : 'border-slate-800 hover:border-teal-700/50'
                  }`}
                >
                  {/* Card Top */}
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-xl font-black font-mono text-amber-400">
                          #{order.order_id}
                        </span>
                        <span className="text-xs font-bold text-slate-400">• {order.payment_method}</span>
                      </div>
                      <h4 className="text-sm font-bold text-white mt-1">{order.customer_name}</h4>
                      <p className="text-xs font-mono text-slate-400">+91 {order.customer_phone}</p>
                    </div>

                    <div className="text-right space-y-1">
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-black uppercase ${
                        order.status === 'READY' ? 'bg-amber-400 text-slate-950' :
                        order.status === 'PREPARING' ? 'bg-teal-500/20 text-teal-300 border border-teal-500/30' :
                        order.status === 'COMPLETED' ? 'bg-slate-800 text-slate-400' :
                        'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                      }`}>
                        {order.status}
                      </span>
                      <p className="text-[10px] text-slate-500">{order.created_at}</p>
                    </div>
                  </div>

                  {/* Items List */}
                  <div className="p-3.5 rounded-2xl bg-slate-800/60 border border-slate-700/40 space-y-2">
                    {order.items.map((item, i) => (
                      <div key={i} className="flex justify-between items-center text-xs">
                        <span className="font-semibold text-slate-200">
                          <strong className="text-amber-400">{item.quantity}×</strong> {item.name}
                        </span>
                        <span className="text-slate-400 font-mono">₹{(item.price * item.quantity).toFixed(2)}</span>
                      </div>
                    ))}
                    <div className="pt-2 border-t border-slate-700 flex justify-between items-center font-bold text-xs">
                      <span className="text-slate-400">Total Amount</span>
                      <span className="text-amber-400 font-extrabold text-sm">₹{order.total_amount.toFixed(2)}</span>
                    </div>
                  </div>

                  {/* Quick Action Controls */}
                  <div className="flex items-center space-x-3 pt-2">
                    {order.status !== 'READY' && order.status !== 'COMPLETED' && (
                      <button
                        onClick={() => handleStatusChange(order.order_id, 'READY')}
                        disabled={updatingId === order.order_id}
                        className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black text-xs flex items-center justify-center space-x-2 shadow-lg shadow-amber-950/40 transition-all hover:scale-[1.02] active:scale-[0.98]"
                      >
                        <CheckCircle2 className="w-4 h-4 text-slate-950" />
                        <span>MARK AS READY (Notify Customer)</span>
                      </button>
                    )}

                    {order.status === 'PLACED' && (
                      <button
                        onClick={() => handleStatusChange(order.order_id, 'PREPARING')}
                        disabled={updatingId === order.order_id}
                        className="px-4 py-3 rounded-xl bg-teal-800 hover:bg-teal-700 text-white font-bold text-xs transition-colors"
                      >
                        Start Preparing
                      </button>
                    )}

                    {order.status === 'READY' && (
                      <button
                        onClick={() => handleStatusChange(order.order_id, 'COMPLETED')}
                        disabled={updatingId === order.order_id}
                        className="flex-1 py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition-colors"
                      >
                        Complete / Picked Up
                      </button>
                    )}
                  </div>

                </div>
              ))}
            </div>
          )}
        </>
      )}

    </div>
  );
}
