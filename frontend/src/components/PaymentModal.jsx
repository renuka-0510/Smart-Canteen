import React, { useState } from 'react';
import { QrCode, CheckCircle2, X, Smartphone, ShieldCheck, Loader2 } from 'lucide-react';

export default function PaymentModal({ totalAmount, customerName, customerPhone, onClose, onConfirmPayment }) {
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSimulatePayment = () => {
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      onConfirmPayment();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-md rounded-3xl bg-slate-900 border border-teal-500/30 shadow-2xl p-6 space-y-6 overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center space-x-2">
            <div className="p-2 rounded-xl bg-teal-500/20 text-teal-400">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Scan UPI QR Code</h3>
              <p className="text-xs text-slate-400">Pay using GPay, PhonePe, or Paytm</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Amount & Details */}
        <div className="bg-slate-800/60 rounded-2xl p-4 border border-slate-700/50 flex justify-between items-center">
          <div>
            <p className="text-xs text-slate-400">Paying for {customerName}</p>
            <p className="text-xs text-teal-400 font-mono">+91 {customerPhone}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-slate-400">Total Payable</p>
            <p className="text-2xl font-black text-amber-400">₹{totalAmount.toFixed(2)}</p>
          </div>
        </div>

        {/* QR Code Container */}
        <div className="flex flex-col items-center justify-center p-6 bg-white rounded-2xl shadow-inner space-y-3 relative group">
          <div className="relative p-2 bg-white rounded-xl border-4 border-slate-900">
            {/* Visual Stylized QR Code Graphic */}
            <svg className="w-48 h-48" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect width="100" height="100" fill="white" />
              {/* Corner Position Detection Patterns */}
              <rect x="5" y="5" width="25" height="25" fill="#0B4F4A" />
              <rect x="9" y="9" width="17" height="17" fill="white" />
              <rect x="13" y="13" width="9" height="9" fill="#0B4F4A" />

              <rect x="70" y="5" width="25" height="25" fill="#0B4F4A" />
              <rect x="74" y="9" width="17" height="17" fill="white" />
              <rect x="78" y="13" width="9" height="9" fill="#0B4F4A" />

              <rect x="5" y="70" width="25" height="25" fill="#0B4F4A" />
              <rect x="9" y="74" width="17" height="17" fill="white" />
              <rect x="13" y="78" width="9" height="9" fill="#0B4F4A" />

              {/* Data modules pattern */}
              <rect x="35" y="5" width="6" height="6" fill="#1F2937" />
              <rect x="45" y="5" width="6" height="6" fill="#1F2937" />
              <rect x="55" y="5" width="6" height="6" fill="#1F2937" />
              <rect x="35" y="15" width="6" height="6" fill="#1F2937" />
              <rect x="50" y="15" width="6" height="6" fill="#1F2937" />
              
              <rect x="5" y="35" width="6" height="6" fill="#1F2937" />
              <rect x="15" y="35" width="6" height="6" fill="#1F2937" />
              <rect x="25" y="35" width="6" height="6" fill="#1F2937" />
              <rect x="35" y="35" width="10" height="10" fill="#0B4F4A" />
              <rect x="50" y="35" width="6" height="6" fill="#1F2937" />
              <rect x="65" y="35" width="10" height="10" fill="#F59E0B" />
              <rect x="80" y="35" width="6" height="6" fill="#1F2937" />

              <rect x="35" y="50" width="6" height="6" fill="#1F2937" />
              <rect x="45" y="50" width="10" height="10" fill="#0B4F4A" />
              <rect x="60" y="50" width="6" height="6" fill="#1F2937" />
              <rect x="75" y="50" width="6" height="6" fill="#1F2937" />

              <rect x="35" y="65" width="6" height="6" fill="#F59E0B" />
              <rect x="50" y="65" width="6" height="6" fill="#1F2937" />
              <rect x="65" y="65" width="6" height="6" fill="#1F2937" />

              <rect x="35" y="80" width="10" height="10" fill="#1F2937" />
              <rect x="55" y="80" width="6" height="6" fill="#0B4F4A" />
              <rect x="70" y="80" width="10" height="10" fill="#1F2937" />
            </svg>
          </div>

          <div className="flex items-center space-x-2 text-xs font-semibold text-slate-700">
            <Smartphone className="w-4 h-4 text-emerald-600" />
            <span>UPI ID: <strong className="text-slate-900 font-mono">canteen@upi</strong></span>
          </div>
        </div>

        {/* Security badge & Actions */}
        <div className="space-y-3">
          <div className="flex items-center justify-center space-x-1.5 text-[11px] text-teal-300">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Secure Instant 256-Bit Encrypted Payment</span>
          </div>

          <button
            onClick={handleSimulatePayment}
            disabled={isProcessing}
            className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-emerald-700 to-teal-800 hover:from-emerald-600 hover:to-teal-700 text-white font-bold text-sm flex items-center justify-center space-x-2 shadow-lg shadow-teal-950/50 border border-teal-500/30 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-5 h-5 text-amber-300 animate-spin" />
                <span>Verifying Payment...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-5 h-5 text-amber-300" />
                <span>Simulate UPI Payment Success</span>
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
}
