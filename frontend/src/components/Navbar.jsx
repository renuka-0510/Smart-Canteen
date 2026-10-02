import React from 'react';
import { ShoppingBag, UtensilsCrossed, LayoutDashboard, Clock, Sparkles } from 'lucide-react';

export default function Navbar({ activeTab, setActiveTab, cartCount, onOpenCart }) {
  return (
    <header className="sticky top-0 z-40 glass-nav shadow-lg border-b border-teal-800/40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo & Brand */}
          <div 
            onClick={() => setActiveTab('menu')}
            className="flex items-center space-x-3 cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-teal-500 flex items-center justify-center shadow-lg shadow-teal-900/40 group-hover:scale-105 transition-transform">
              <UtensilsCrossed className="w-6 h-6 text-slate-950 font-bold" />
            </div>
            <div>
              <div className="flex items-center space-x-1.5">
                <span className="text-xl font-extrabold tracking-tight text-white group-hover:text-amber-400 transition-colors">
                  SmartCanteen
                </span>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  <Sparkles className="w-3 h-3 mr-1" /> AI
                </span>
              </div>
              <p className="text-[10px] text-teal-200/70 font-medium">Smart AI-Powered Kitchen</p>
            </div>
          </div>

          {/* Nav Tabs */}
          <nav className="hidden md:flex items-center space-x-2 bg-slate-900/60 p-1.5 rounded-xl border border-teal-800/30">
            <button
              onClick={() => setActiveTab('menu')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                activeTab === 'menu'
                  ? 'bg-emerald-800 text-white shadow-md shadow-emerald-950/50'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <UtensilsCrossed className="w-4 h-4 text-emerald-400" />
              <span>Menu & Order</span>
            </button>

            <button
              onClick={() => setActiveTab('tracking')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                activeTab === 'tracking'
                  ? 'bg-emerald-800 text-white shadow-md shadow-emerald-950/50'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Clock className="w-4 h-4 text-amber-400" />
              <span>Live Order Status</span>
            </button>

            <button
              onClick={() => setActiveTab('admin')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                activeTab === 'admin'
                  ? 'bg-amber-600 text-white shadow-md shadow-amber-950/50'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <LayoutDashboard className="w-4 h-4 text-amber-200" />
              <span>Kitchen Dashboard</span>
            </button>
          </nav>

          {/* Cart Trigger Button */}
          <div className="flex items-center space-x-3">
            <button
              onClick={onOpenCart}
              className="relative flex items-center space-x-2 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-700 to-teal-800 hover:from-emerald-600 hover:to-teal-700 text-white font-semibold shadow-lg shadow-teal-950/40 border border-teal-500/30 transition-all hover:scale-105 active:scale-95"
            >
              <ShoppingBag className="w-5 h-5 text-amber-300" />
              <span className="hidden sm:inline">Cart</span>
              {cartCount > 0 && (
                <span className="flex items-center justify-center w-5 h-5 bg-amber-500 text-slate-950 font-bold text-xs rounded-full animate-bounce">
                  {cartCount}
                </span>
              )}
            </button>
          </div>

        </div>

        {/* Mobile Navigation Bar */}
        <div className="flex md:hidden items-center justify-around py-2 border-t border-teal-800/30">
          <button
            onClick={() => setActiveTab('menu')}
            className={`flex flex-col items-center space-y-0.5 text-xs font-medium ${
              activeTab === 'menu' ? 'text-amber-400' : 'text-slate-400'
            }`}
          >
            <UtensilsCrossed className="w-5 h-5" />
            <span>Menu</span>
          </button>
          <button
            onClick={() => setActiveTab('tracking')}
            className={`flex flex-col items-center space-y-0.5 text-xs font-medium ${
              activeTab === 'tracking' ? 'text-amber-400' : 'text-slate-400'
            }`}
          >
            <Clock className="w-5 h-5" />
            <span>Tracking</span>
          </button>
          <button
            onClick={() => setActiveTab('admin')}
            className={`flex flex-col items-center space-y-0.5 text-xs font-medium ${
              activeTab === 'admin' ? 'text-amber-400' : 'text-slate-400'
            }`}
          >
            <LayoutDashboard className="w-5 h-5" />
            <span>Kitchen</span>
          </button>
        </div>

      </div>
    </header>
  );
}
