import React, { useState, useEffect } from 'react';
import { X, Wallet, ArrowDownRight, ArrowUpLeft, Calendar, Filter, Trash2, Phone, FileText, Loader2 } from 'lucide-react';
import { formatNaira, formatDate, formatDateTime } from '../utils/formatters';
import { api } from '../services/api';

export default function ClientDetailModal({
  isOpen,
  onClose,
  client,
  onRecordTransaction,
  onDeleteTransactionRequest
}) {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');

  const fetchHistory = async () => {
    if (!client) return;
    setLoading(true);
    try {
      const res = await api.getClientTransactions(client.id, {
        from: fromDate,
        to: toDate,
        type: typeFilter
      });
      setTransactions(res.transactions || []);
    } catch (err) {
      console.error('Failed to fetch client history:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && client) {
      fetchHistory();
    }
  }, [isOpen, client, fromDate, toDate, typeFilter]);

  if (!isOpen || !client) return null;

  const currentBalance = parseFloat(client.current_balance) || 0;

  const clearFilters = () => {
    setFromDate('');
    setToDate('');
    setTypeFilter('all');
  };

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-2 sm:p-4 bg-[#0b1c30]/50 backdrop-blur-sm animate-fade-in">
      <div className="institutional-card w-full max-w-4xl max-h-[92vh] bg-[#ffffff] border border-[#cbd5e1] flex flex-col overflow-hidden shadow-2xl">
        
        {/* Header */}
        <div className="px-4 py-3 bg-[#0b132b] text-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded bg-[#1c2541] border border-[#334155] flex items-center justify-center text-[#60a5fa] font-mono font-bold text-xs">
              {client.name.substring(0, 2).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-sm sm:text-base font-semibold text-white font-sans">{client.name}</h2>
                <span className="badge-code">{client.client_code}</span>
              </div>
              <div className="flex items-center space-x-3 text-[11px] font-mono text-slate-300 mt-0.5">
                {client.phone && <span>Phone: {client.phone}</span>}
                {client.notes && <span className="truncate max-w-xs">{client.notes}</span>}
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-300 hover:text-white p-1 rounded-xs hover:bg-[#1c2541] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 text-[#0b1c30]">
          
          {/* Standing Balance Panel */}
          <div className="p-4 rounded-sm bg-[#f8fafc] border border-[#e2e8f0] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm">
            <div>
              <span className="text-[10px] font-mono uppercase text-[#45464d]">Current Ledger Standing Balance</span>
              <div className="text-2xl sm:text-3xl font-bold font-mono tnum text-[#059669] tracking-tight mt-0.5">
                {formatNaira(currentBalance)}
              </div>
              <p className="text-[11px] font-mono text-slate-500">Atomic real-time balance calculated from ledger journal</p>
            </div>

            <div className="flex items-center space-x-2 w-full sm:w-auto">
              <button
                onClick={() => onRecordTransaction(client, 'payment')}
                className="flex-1 sm:flex-initial flex items-center justify-center space-x-1 px-3 py-1.5 text-xs font-semibold font-mono text-white bg-[#059669] hover:bg-[#047857] border border-[#10b981] rounded-sm transition-colors shadow-sm"
              >
                <ArrowDownRight className="w-3.5 h-3.5" />
                <span>+ Payment</span>
              </button>

              <button
                onClick={() => onRecordTransaction(client, 'withdrawal')}
                className="flex-1 sm:flex-initial flex items-center justify-center space-x-1 px-3 py-1.5 text-xs font-semibold font-mono text-white bg-[#ba1a1a] hover:bg-[#991b1b] border border-[#ef4444] rounded-sm transition-colors shadow-sm"
              >
                <ArrowUpLeft className="w-3.5 h-3.5" />
                <span>- Withdrawal</span>
              </button>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="institutional-panel p-3 space-y-2">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-[#0b1c30] font-semibold uppercase flex items-center space-x-1.5">
                <Filter className="w-3.5 h-3.5 text-[#0051d5]" />
                <span>Filter Account Journal</span>
              </span>
              {(fromDate || toDate || typeFilter !== 'all') && (
                <button onClick={clearFilters} className="text-[#0051d5] hover:underline">
                  Clear Filters
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <div>
                <label className="block text-[10px] font-mono uppercase text-[#45464d] mb-1">From Date</label>
                <input
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  className="w-full px-2.5 py-1 bg-[#ffffff] border border-[#cbd5e1] rounded-sm text-xs text-[#0b1c30]"
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono uppercase text-[#45464d] mb-1">To Date</label>
                <input
                  type="date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  className="w-full px-2.5 py-1 bg-[#ffffff] border border-[#cbd5e1] rounded-sm text-xs text-[#0b1c30]"
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono uppercase text-[#45464d] mb-1">Type</label>
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="w-full px-2.5 py-1 bg-[#ffffff] border border-[#cbd5e1] rounded-sm text-xs text-[#0b1c30]"
                >
                  <option value="all">All Entries</option>
                  <option value="payment">Payments Only</option>
                  <option value="withdrawal">Withdrawals Only</option>
                </select>
              </div>
            </div>
          </div>

          {/* Transactions Log Table */}
          <div className="institutional-panel overflow-hidden">
            <div className="px-4 py-2.5 bg-[#f8fafc] border-b border-[#cbd5e1] flex items-center justify-between">
              <span className="text-xs font-mono font-semibold uppercase text-[#0b1c30]">Client Ledger Journal</span>
              <span className="text-xs font-mono text-slate-500">{transactions.length} entries</span>
            </div>

            {loading ? (
              <div className="p-8 text-center text-slate-500 text-xs font-mono flex items-center justify-center space-x-2">
                <Loader2 className="w-4 h-4 animate-spin text-[#0051d5]" />
                <span>Loading account history...</span>
              </div>
            ) : transactions.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-xs font-mono">
                No ledger records match the selected criteria.
              </div>
            ) : (
              <>
                {/* Desktop View */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="institutional-table">
                    <thead>
                      <tr>
                        <th>Entry Date</th>
                        <th>Type</th>
                        <th className="text-right">Amount</th>
                        <th className="text-right">Resulting Balance</th>
                        <th>Notes / Ref</th>
                        <th>Recorded At</th>
                        <th className="text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {transactions.map((tx) => {
                        const isPayment = tx.type === 'payment';
                        return (
                          <tr key={tx.id}>
                            <td className="font-mono text-[#0b1c30] whitespace-nowrap">
                              {formatDate(tx.transaction_date)}
                            </td>
                            <td className="whitespace-nowrap">
                              <span className={isPayment ? 'badge-verified' : 'badge-alert'}>
                                {isPayment ? '+ PAYMENT' : '- WITHDRAWAL'}
                              </span>
                            </td>
                            <td className={`font-mono tnum font-bold text-right whitespace-nowrap ${
                              isPayment ? 'text-[#059669]' : 'text-[#ba1a1a]'
                            }`}>
                              {isPayment ? '+' : '-'}{formatNaira(tx.amount)}
                            </td>
                            <td className="font-mono tnum font-bold text-[#0b1c30] text-right whitespace-nowrap">
                              {formatNaira(tx.resulting_balance)}
                            </td>
                            <td className="text-slate-600 max-w-xs truncate text-xs">
                              {tx.notes || '-'}
                            </td>
                            <td className="font-mono text-[11px] text-slate-500 whitespace-nowrap">
                              {formatDateTime(tx.created_at)}
                            </td>
                            <td className="text-center whitespace-nowrap">
                              <button
                                onClick={() => onDeleteTransactionRequest(tx)}
                                className="p-1 text-slate-400 hover:text-[#ba1a1a] hover:bg-[#fef2f2] rounded-xs"
                                title="Delete entry"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Mobile View */}
                <div className="md:hidden divide-y divide-[#f1f5f9]">
                  {transactions.map((tx) => {
                    const isPayment = tx.type === 'payment';
                    return (
                      <div key={tx.id} className="p-3 space-y-1.5 bg-[#ffffff]">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center space-x-2">
                            <span className={isPayment ? 'badge-verified' : 'badge-alert'}>
                              {isPayment ? 'PAYMENT' : 'WITHDRAWAL'}
                            </span>
                            <span className="font-mono text-[11px] text-slate-500">
                              {formatDate(tx.transaction_date)}
                            </span>
                          </div>
                          <span className={`font-mono tnum font-bold text-xs ${isPayment ? 'text-[#059669]' : 'text-[#ba1a1a]'}`}>
                            {isPayment ? '+' : '-'}{formatNaira(tx.amount)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-[10px] font-mono text-slate-500">
                          <span>Bal: {formatNaira(tx.resulting_balance)}</span>
                          <button
                            onClick={() => onDeleteTransactionRequest(tx)}
                            className="text-[#ba1a1a] hover:underline"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
