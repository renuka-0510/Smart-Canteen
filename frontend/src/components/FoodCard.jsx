import React from 'react';
import { Plus, Minus, Clock, Sparkles } from 'lucide-react';

export default function FoodCard({ item, cartQuantity, onAddToCart, onUpdateQuantity }) {
  return (
    <div className="group rounded-2xl bg-slate-800/80 border border-slate-700/60 overflow-hidden shadow-xl hover:shadow-2xl hover:border-teal-500/40 transition-all duration-300 flex flex-col h-full hover:-translate-y-1">
      
      {/* Food Image Banner */}
      <div className="relative h-48 w-full overflow-hidden bg-slate-900">
        <img 
          src={item.image} 
          alt={item.name}
          className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-500"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-80" />
        
        {/* Category Badge */}
        <span className="absolute top-3 left-3 px-3 py-1 rounded-full text-xs font-bold bg-slate-900/80 backdrop-blur-md text-teal-300 border border-teal-500/30 shadow-md">
          {item.category}
        </span>

        {/* Prep Time Pill */}
        <span className="absolute top-3 right-3 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/90 backdrop-blur-md text-slate-950 flex items-center space-x-1 shadow-md">
          <Clock className="w-3 h-3 text-slate-950" />
          <span>{item.prep_time}m prep</span>
        </span>
      </div>

      {/* Card Body */}
      <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
        <div>
          <div className="flex items-start justify-between">
            <h3 className="text-lg font-bold text-white group-hover:text-teal-300 transition-colors">
              {item.name}
            </h3>
            <span className="text-lg font-extrabold text-amber-400">
              ₹{item.price}
            </span>
          </div>
          <p className="mt-2 text-xs text-slate-400 line-clamp-2 leading-relaxed">
            {item.description}
          </p>
        </div>

        {/* Action Button: Add or Quantity Control */}
        <div className="pt-2 border-t border-slate-700/50">
          {cartQuantity === 0 ? (
            <button
              onClick={() => onAddToCart(item)}
              className="w-full py-2.5 px-4 rounded-xl bg-teal-800 hover:bg-teal-700 text-white text-sm font-bold flex items-center justify-center space-x-2 shadow-md shadow-teal-950/40 border border-teal-600/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <Plus className="w-4 h-4 text-amber-300" />
              <span>Add to Cart</span>
            </button>
          ) : (
            <div className="flex items-center justify-between bg-slate-900/90 rounded-xl p-1 border border-teal-500/40">
              <button
                onClick={() => onUpdateQuantity(item.id, cartQuantity - 1)}
                className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-400 flex items-center justify-center transition-colors"
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="font-extrabold text-sm text-white px-3">
                {cartQuantity} in cart
              </span>
              <button
                onClick={() => onAddToCart(item)}
                className="w-8 h-8 rounded-lg bg-teal-700 hover:bg-teal-600 text-white flex items-center justify-center transition-colors"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
