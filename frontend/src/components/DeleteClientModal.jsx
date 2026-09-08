import React from 'react';
import { AlertTriangle, Trash2, X, Loader2 } from 'lucide-react';
import { formatNaira } from '../utils/formatters';

export default function DeleteClientModal({
  isOpen,
  onClose,
  onConfirm,
  client,
  submitting
}) {
  if (!isOpen || !client) return null;

  const currentBalance = parseFloat(client.current_balance) || 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-[#0b1c30]/50 backdrop-blur-sm animate-fade-in">
      <div className="institutional-card w-full max-w-md bg-[#ffffff] border border-[#ba1a1a]/40 overflow-hidden shadow-2xl">
        
        {/* Header */}
        <div className="px-4 py-3 bg-[#fef2f2] border-b border-[#fecaca] flex items-center justify-between">
          <div className="flex items-center space-x-2 text-[#ba1a1a]">
            <AlertTriangle className="w-4 h-4" />
            <h3 className="font-semibold text-sm font-sans">Delete Client Account</h3>
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
            Are you sure you want to permanently delete this client account?
          </p>

          {/* Client Card Summary */}
          <div className="p-3 rounded-xs bg-[#f8fafc] border border-[#e2e8f0] space-y-1.5 font-mono text-xs">
            <div className="flex justify-between items-center">
              <span className="text-slate-500">Client Code:</span>
              <span className="badge-code">{client.client_code}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500">Account Name:</span>
              <span className="text-[#0b1c30] font-bold">{client.name}</span>
            </div>
            {client.phone && (
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Phone:</span>
                <span className="text-slate-700">{client.phone}</span>
              </div>
            )}
            <div className="flex justify-between items-center pt-1 border-t border-[#e2e8f0]">
              <span className="text-slate-500">Standing Balance:</span>
              <span className="text-[#059669] font-bold tnum text-sm">{formatNaira(currentBalance)}</span>
            </div>
          </div>

          <div className="p-2.5 rounded-xs bg-[#fef2f2] border border-[#fecaca] text-[11px] font-mono text-[#ba1a1a]">
            ⚠️ WARNING: This action cannot be undone. Deleting this client will permanently purge all associated ledger payment & withdrawal history.
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
                  <span>Deleting Account...</span>
                </>
              ) : (
                <>
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete Client</span>
                </>
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
