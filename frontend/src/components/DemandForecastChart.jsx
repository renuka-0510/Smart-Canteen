import React, { useState, useEffect } from 'react';
import { Sparkles, TrendingUp, ChefHat, ShieldAlert, BarChart3, RefreshCw } from 'lucide-react';
import { fetchDemandForecast } from '../utils/api';

export default function DemandForecastChart() {
  const [forecasts, setForecasts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterCategory, setFilterCategory] = useState('All');

  useEffect(() => {
    loadForecastData();
  }, []);

  const loadForecastData = async () => {
    setLoading(true);
    try {
      const data = await fetchDemandForecast();
      setForecasts(data);
    } catch (err) {
      console.error('Failed to load demand forecast:', err);
    } finally {
      setLoading(false);
    }
  };

  const categories = ['All', 'Snacks', 'Meals', 'Beverages'];
  const filtered = filterCategory === 'All' 
    ? forecasts 
    : forecasts.filter(f => f.category === filterCategory);

  const totalDemand = forecasts.reduce((sum, f) => sum + f.predicted_daily_demand, 0);
  const totalRecommendedPrep = forecasts.reduce((sum, f) => sum + f.recommended_prep_qty, 0);
  const topDemandItem = forecasts.length > 0 
    ? [...forecasts].sort((a, b) => b.predicted_daily_demand - a.predicted_daily_demand)[0]
    : null;

  return (
    <div className="space-y-8 animate-fade-in">
      
      {/* Overview Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="p-6 rounded-3xl bg-slate-900 border border-teal-800/40 shadow-xl space-y-2">
          <div className="flex justify-between items-center text-teal-400">
            <span className="text-xs font-bold uppercase tracking-wider">Total Projected Daily Units</span>
            <TrendingUp className="w-5 h-5 text-emerald-400" />
          </div>
          <div className="text-3xl font-black text-white">{totalDemand} Plates</div>
          <p className="text-[11px] text-slate-400">Random Forest Regressor 7-day rolling prediction</p>
        </div>

        <div className="p-6 rounded-3xl bg-slate-900 border border-amber-500/30 shadow-xl space-y-2">
          <div className="flex justify-between items-center text-amber-400">
            <span className="text-xs font-bold uppercase tracking-wider">Recommended Prep Batch</span>
            <ChefHat className="w-5 h-5 text-amber-400" />
          </div>
          <div className="text-3xl font-black text-amber-400">{totalRecommendedPrep} Plates</div>
          <p className="text-[11px] text-slate-400">Includes 10% safety buffer for peak spikes</p>
        </div>

        <div className="p-6 rounded-3xl bg-slate-900 border border-teal-800/40 shadow-xl space-y-2">
          <div className="flex justify-between items-center text-teal-300">
            <span className="text-xs font-bold uppercase tracking-wider">Top Fast-Moving Dish</span>
            <Sparkles className="w-5 h-5 text-amber-400" />
          </div>
          <div className="text-2xl font-black text-white truncate">
            {topDemandItem ? topDemandItem.name : 'Loading...'}
          </div>
          <p className="text-[11px] text-slate-400">
            ~{topDemandItem ? topDemandItem.predicted_daily_demand : 0} units estimated today
          </p>
        </div>
      </div>

      {/* Main Forecast Panel */}
      <div className="p-6 sm:p-8 rounded-3xl bg-slate-900/90 border border-teal-500/30 shadow-2xl space-y-6">
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
          <div>
            <h3 className="text-xl font-bold text-white flex items-center space-x-2">
              <BarChart3 className="w-6 h-6 text-amber-400" />
              <span>AI Kitchen Demand Forecasting & Prep Batching</span>
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Optimizes ingredient prep & reduces food waste using historical canteen sales patterns
            </p>
          </div>

          {/* Category Filter & Refresh */}
          <div className="flex items-center space-x-3">
            <div className="flex items-center bg-slate-800 p-1 rounded-xl border border-slate-700">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setFilterCategory(cat)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    filterCategory === cat
                      ? 'bg-teal-800 text-white shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            <button
              onClick={loadForecastData}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Forecast Items Table & Visual Bars */}
        {loading ? (
          <div className="py-12 flex justify-center items-center text-slate-400 text-sm">
            Evaluating Random Forest Model Predictions...
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filtered.map((item) => {
              const maxVal = Math.max(...forecasts.map(f => f.recommended_prep_qty), 150);
              const demandPct = (item.predicted_daily_demand / maxVal) * 100;
              const prepPct = (item.recommended_prep_qty / maxVal) * 100;

              return (
                <div 
                  key={item.item_id}
                  className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/50 space-y-3 hover:border-teal-500/40 transition-all"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="text-sm font-bold text-white">{item.name}</h4>
                      <span className="text-[11px] font-semibold text-teal-400 bg-teal-500/10 px-2 py-0.5 rounded-md border border-teal-500/20">
                        {item.category}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-bold text-amber-400">
                        Prep: {item.recommended_prep_qty} pcs
                      </span>
                      <p className="text-[10px] text-slate-400">{item.confidence_interval}</p>
                    </div>
                  </div>

                  {/* Progress Bar Visualizer */}
                  <div className="space-y-1.5 pt-1">
                    <div className="flex justify-between text-[11px] text-slate-400">
                      <span>Predicted Demand: <strong className="text-white">{item.predicted_daily_demand}</strong></span>
                      <span>Buffer: <strong className="text-amber-400">+10%</strong></span>
                    </div>

                    <div className="w-full h-3 bg-slate-900 rounded-full overflow-hidden flex relative border border-slate-700/60">
                      <div 
                        style={{ width: `${demandPct}%` }} 
                        className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-l-full"
                      />
                      <div 
                        style={{ width: `${prepPct - demandPct}%` }} 
                        className="h-full bg-amber-500 rounded-r-full opacity-90"
                      />
                    </div>
                  </div>

                </div>
              );
            })}
          </div>
        )}

      </div>

    </div>
  );
}
