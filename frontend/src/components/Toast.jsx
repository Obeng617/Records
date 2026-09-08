import React, { useEffect } from 'react';
import { CheckCircle2, AlertTriangle, X } from 'lucide-react';

export default function Toast({ toast, onClose }) {
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => {
        onClose();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [toast, onClose]);

  if (!toast) return null;

  const isError = toast.type === 'error';

  return (
    <div className="fixed bottom-14 sm:bottom-6 right-3 sm:right-6 z-50 max-w-sm w-full">
      <div
        className={`institutional-card p-3 font-mono text-xs shadow-2xl border flex items-start space-x-2.5 ${
          isError
            ? 'border-[#ba1a1a]/40 bg-[#ffffff] text-[#ba1a1a]'
            : 'border-[#059669]/40 bg-[#ffffff] text-[#059669]'
        }`}
      >
        {isError ? (
          <AlertTriangle className="w-4 h-4 text-[#ba1a1a] shrink-0 mt-0.5" />
        ) : (
          <CheckCircle2 className="w-4 h-4 text-[#059669] shrink-0 mt-0.5" />
        )}
        <div className="flex-1 min-w-0">
          <p className="font-bold uppercase tracking-wider">{isError ? 'System Warning' : 'Audit Notice'}</p>
          <p className="text-[11px] text-[#0b1c30] mt-0.5 leading-snug">{toast.message}</p>
        </div>
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-[#0b1c30] p-0.5 rounded-xs hover:bg-[#f1f5f9] transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
