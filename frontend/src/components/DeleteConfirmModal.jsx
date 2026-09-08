import React from 'react';
import { AlertTriangle, Trash2, X, Loader2 } from 'lucide-react';
import { formatNaira, formatDate } from '../utils/formatters';

export default function DeleteConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  transaction,
  submitting
}) {
  if (!isOpen || !transaction) return null;

  const isPayment = transaction.type === 'payment';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-[#0b1c30]/50 backdrop-blur-sm animate-fade-in">
      <div className="institutional-card w-full max-w-md bg-[#ffffff] border border-[#ba1a1a]/40 overflow-hidden shadow-2xl">
        
        {/* Header */}
        <div className="px-4 py-3 bg-[#fef2f2] border-b border-[#fecaca] flex items-center justify-between">
          <div className="flex items-center space-x-2 text-[#ba1a1a]">
            <AlertTriangle className="w-4 h-4" />
            <h3 className="font-semibold text-sm font-sans">Delete Transaction Entry</h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1 rounded-xs hover:bg-[#ffe4e6] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-3 text-[#0b1c30]">
          <p className="text-xs text-slate-700">
            Are you sure you want to delete this transaction record?
          </p>

          {/* Entry Card Summary */}
          <div className="p-3 rounded-xs bg-[#f8fafc] border border-[#e2e8f0] space-y-1 font-mono text-xs">
            <div className="flex justify-between">
              <span className="text-slate-500">Transaction Date:</span>
              <span className="text-[#0b1c30] font-bold">{formatDate(transaction.transaction_date)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Entry Directive:</span>
              <span className={isPayment ? 'text-[#059669] font-bold' : 'text-[#ba1a1a] font-bold'}>
                {isPayment ? '+ PAYMENT (CREDIT)' : '- WITHDRAWAL (DEBIT)'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Entry Amount:</span>
              <span className="text-[#0b1c30] font-bold tnum">{formatNaira(transaction.amount)}</span>
            </div>
          </div>

          <div className="p-2.5 rounded-xs bg-[#fef2f2] border border-[#fecaca] text-[11px] font-mono text-[#ba1a1a]">
            ⚠️ Deleting this entry will automatically recalculate the client's current balance and subsequent transaction balances.
          </div>

          {/* Actions */}
          <div className="pt-2 flex items-center justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-3 py-1.5 text-xs font-mono text-[#45464d] hover:text-[#0b1c30] bg-[#f1f5f9] hover:bg-[#e2e8f0] rounded-sm transition-colors border border-[#cbd5e1]"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={submitting}
              className="px-4 py-1.5 text-xs font-semibold font-mono text-white bg-[#ba1a1a] hover:bg-[#991b1b] border border-[#ef4444] rounded-sm flex items-center space-x-1.5 transition-colors disabled:opacity-50 shadow-sm"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Deleting...</span>
                </>
              ) : (
                <>
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Confirm Delete</span>
                </>
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
