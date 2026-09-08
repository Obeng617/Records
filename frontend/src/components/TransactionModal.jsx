import React, { useState, useEffect } from 'react';
import { X, ArrowDownRight, ArrowUpLeft, AlertTriangle, Loader2 } from 'lucide-react';
import { formatNaira } from '../utils/formatters';

export default function TransactionModal({
  isOpen,
  onClose,
  onSubmit,
  clients = [],
  presetClient = null,
  submitting,
  errorMsg
}) {
  const [selectedClientId, setSelectedClientId] = useState('');
  const [type, setType] = useState('payment'); // 'payment' | 'withdrawal'
  const [amount, setAmount] = useState('');
  const [transactionDate, setTransactionDate] = useState('');
  const [notes, setNotes] = useState('');

  const prevIsOpen = React.useRef(false);

  useEffect(() => {
    if (isOpen && !prevIsOpen.current) {
      const today = new Date().toISOString().split('T')[0];
      setTransactionDate(today);
      if (presetClient) {
        setSelectedClientId(presetClient.id);
      } else if (clients.length > 0 && !selectedClientId) {
        setSelectedClientId(clients[0].id);
      }
      setAmount('');
      setNotes('');
      setType('payment');
    }
    prevIsOpen.current = isOpen;
  }, [isOpen, presetClient, clients, selectedClientId]);

  if (!isOpen) return null;

  const activeClient = clients.find(c => c.id === selectedClientId) || presetClient;
  const currentBalance = activeClient ? parseFloat(activeClient.current_balance) || 0 : 0;
  const numericAmount = parseFloat(amount) || 0;

  const willOverdraft = type === 'withdrawal' && numericAmount > currentBalance;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!selectedClientId || !amount || numericAmount <= 0 || !transactionDate) return;

    onSubmit({
      clientId: selectedClientId,
      type,
      amount: numericAmount,
      transaction_date: transactionDate,
      notes: notes.trim()
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-[#0b1c30]/50 backdrop-blur-sm animate-fade-in">
      <div className="institutional-card w-full max-w-lg bg-[#ffffff] overflow-hidden border border-[#cbd5e1] max-h-[90vh] flex flex-col shadow-2xl">
        
        {/* Header */}
        <div className="px-5 py-4 bg-[#0b132b] text-white flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className={`w-7 h-7 rounded flex items-center justify-center ${
              type === 'payment' ? 'bg-[#059669]/30 text-[#34d399]' : 'bg-[#ba1a1a]/30 text-[#f87171]'
            }`}>
              {type === 'payment' ? <ArrowDownRight className="w-4 h-4" /> : <ArrowUpLeft className="w-4 h-4" />}
            </div>
            <h3 className="font-bold text-base font-sans">Record Journal Entry</h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-300 hover:text-white p-1 rounded-xs hover:bg-[#1c2541] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto flex-1 text-[#0b1c30]">
          {errorMsg && (
            <div className="p-3 rounded-xs bg-[#fef2f2] border border-[#fecaca] flex items-start space-x-2.5 text-xs sm:text-sm text-[#991b1b]">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold font-mono">Entry Rejected</p>
                <p className="mt-0.5 opacity-90">{errorMsg}</p>
              </div>
            </div>
          )}

          {/* Client Selection */}
          <div>
            <label className="block text-xs font-mono font-bold uppercase text-[#45464d] mb-1.5">
              Client Account <span className="text-[#ba1a1a]">*</span>
            </label>
            {presetClient ? (
              <div className="px-3.5 py-2 bg-[#f8fafc] border border-[#cbd5e1] rounded-sm text-sm flex items-center justify-between font-bold">
                <span className="text-[#0b1c30]">{presetClient.name}</span>
                <span className="badge-code">{presetClient.client_code}</span>
              </div>
            ) : (
              <select
                value={selectedClientId}
                onChange={(e) => setSelectedClientId(e.target.value)}
                required
                className="w-full px-3.5 py-2 bg-[#ffffff] border border-[#cbd5e1] rounded-sm text-sm text-[#0b1c30] focus:outline-none focus:border-[#0051d5] shadow-sm font-medium"
              >
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.client_code} — {c.name} ({formatNaira(c.current_balance)})
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Current Balance Display */}
          {activeClient && (
            <div className="p-2.5 rounded-xs bg-[#f8fafc] border border-[#e2e8f0] flex items-center justify-between text-xs sm:text-sm font-mono">
              <span className="text-slate-600 font-medium">Current Ledger Standing:</span>
              <span className="tnum font-bold text-[#059669] text-sm sm:text-base">{formatNaira(currentBalance)}</span>
            </div>
          )}

          {/* Type Selector */}
          <div>
            <label className="block text-xs font-mono font-bold uppercase text-[#45464d] mb-1.5">
              Transaction Directive
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => setType('payment')}
                className={`py-2.5 rounded-sm text-xs sm:text-sm font-bold font-mono flex items-center justify-center space-x-2 border transition-all ${
                  type === 'payment'
                    ? 'bg-[#ecfdf5] text-[#059669] border-[#a7f3d0] shadow-sm'
                    : 'bg-[#ffffff] text-[#45464d] border-[#cbd5e1] hover:bg-[#f8fafc]'
                }`}
              >
                <ArrowDownRight className="w-4 h-4 text-[#059669]" />
                <span>+ PAYMENT (CREDIT)</span>
              </button>

              <button
                type="button"
                onClick={() => setType('withdrawal')}
                className={`py-2.5 rounded-sm text-xs sm:text-sm font-bold font-mono flex items-center justify-center space-x-2 border transition-all ${
                  type === 'withdrawal'
                    ? 'bg-[#fef2f2] text-[#ba1a1a] border-[#fecaca] shadow-sm'
                    : 'bg-[#ffffff] text-[#45464d] border-[#cbd5e1] hover:bg-[#f8fafc]'
                }`}
              >
                <ArrowUpLeft className="w-4 h-4 text-[#ba1a1a]" />
                <span>- WITHDRAWAL (DEBIT)</span>
              </button>
            </div>
          </div>

          {/* Amount */}
          <div>
            <label className="block text-xs font-mono font-bold uppercase text-[#45464d] mb-1.5">
              Amount (NGN ₦) <span className="text-[#ba1a1a]">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500 font-mono font-bold text-sm">
                ₦
              </div>
              <input
                type="number"
                step="0.01"
                min="0.01"
                required
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full pl-9 pr-3.5 py-2 bg-[#ffffff] border border-[#cbd5e1] rounded-sm text-sm text-[#0b1c30] font-mono tnum font-bold placeholder-slate-400 focus:outline-none focus:border-[#0051d5] shadow-sm"
              />
            </div>
            {willOverdraft && (
              <p className="mt-1 text-xs font-mono text-[#ba1a1a]">
                ⚠️ Warning: Amount exceeds current balance ({formatNaira(currentBalance)}). System will reject overdraft.
              </p>
            )}
          </div>

          {/* Transaction Date */}
          <div>
            <label className="block text-xs font-mono font-bold uppercase text-[#45464d] mb-1.5">
              Effective Date of Entry <span className="text-[#ba1a1a]">*</span>
            </label>
            <input
              type="date"
              required
              value={transactionDate}
              onChange={(e) => setTransactionDate(e.target.value)}
              className="w-full px-3.5 py-2 bg-[#ffffff] border border-[#cbd5e1] rounded-sm text-sm text-[#0b1c30] focus:outline-none focus:border-[#0051d5] shadow-sm font-medium"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-mono font-bold uppercase text-[#45464d] mb-1.5">
              Audit Reference / Memo <span className="text-slate-400 font-normal">(Optional)</span>
            </label>
            <input
              type="text"
              placeholder="e.g. Bank deposit reference, invoice #, receipt notes..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3.5 py-2 bg-[#ffffff] border border-[#cbd5e1] rounded-sm text-sm text-[#0b1c30] placeholder-slate-400 focus:outline-none focus:border-[#0051d5] shadow-sm"
            />
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-[#e2e8f0] flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2 text-xs sm:text-sm font-mono font-semibold text-[#45464d] hover:text-[#0b1c30] bg-[#f1f5f9] hover:bg-[#e2e8f0] rounded-sm transition-colors border border-[#cbd5e1]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !selectedClientId || numericAmount <= 0 || willOverdraft}
              className={`px-5 py-2 text-xs sm:text-sm font-bold font-mono text-white border disabled:opacity-50 disabled:cursor-not-allowed rounded-sm flex items-center space-x-2 transition-colors shadow-sm ${
                type === 'payment'
                  ? 'bg-[#059669] hover:bg-[#047857] border-[#10b981]'
                  : 'bg-[#ba1a1a] hover:bg-[#991b1b] border-[#ef4444]'
              }`}
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span>Recording...</span>
                </>
              ) : (
                <span>Post Entry</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
