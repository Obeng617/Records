import React, { useState, useEffect } from 'react';
import { Search, Filter, History, ArrowDownRight, ArrowUpLeft, Trash2, Calendar, RefreshCw } from 'lucide-react';
import { formatNaira, formatDate, formatDateTime } from '../utils/formatters';
import { api } from '../services/api';

export default function GlobalTransactionsPage({
  onSelectClient,
  onDeleteTransactionRequest,
  refreshTrigger
}) {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');

  const fetchGlobal = async () => {
    setLoading(true);
    try {
      const res = await api.getGlobalTransactions({
        search,
        from: fromDate,
        to: toDate,
        type: typeFilter
      });
      setTransactions(res.transactions || []);
    } catch (err) {
      console.error('Failed to fetch global transaction audit log:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGlobal();
  }, [search, fromDate, toDate, typeFilter, refreshTrigger]);

  const clearFilters = () => {
    setSearch('');
    setFromDate('');
    setToDate('');
    setTypeFilter('all');
  };

  return (
    <div className="space-y-6 pb-20">
      
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#e2e8f0] pb-5">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl sm:text-3xl font-bold text-[#0b1c30] tracking-tight font-sans">
              Global Transaction Audit Log
            </h1>
            <span className="badge-verified hidden sm:inline-flex">Audited</span>
          </div>
          <p className="text-xs sm:text-sm text-[#45464d] font-mono mt-1">
            Immutable chronological audit record across all client accounts
          </p>
        </div>

        <button
          onClick={fetchGlobal}
          className="flex items-center space-x-1.5 px-3.5 py-2 text-xs font-mono font-bold text-[#0b1c30] bg-[#ffffff] hover:bg-[#f1f5f9] border border-[#cbd5e1] rounded-sm transition-colors shadow-sm self-start sm:self-auto"
        >
          <RefreshCw className={`w-4 h-4 text-[#0051d5] ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Audit Log</span>
        </button>
      </div>

      {/* Filter Panel Toolbar */}
      <div className="institutional-card p-4 space-y-3.5">
        <div className="flex items-center justify-between">
          <span className="text-xs sm:text-sm font-mono font-bold uppercase tracking-wider text-[#0b1c30] flex items-center space-x-2">
            <Filter className="w-4 h-4 text-[#0051d5]" />
            <span>Audit Filter Controls</span>
          </span>

          {(search || fromDate || toDate || typeFilter !== 'all') && (
            <button
              onClick={clearFilters}
              className="text-xs font-mono text-[#0051d5] hover:underline font-bold"
            >
              Reset Filters
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {/* Search */}
          <div>
            <label className="block text-xs font-mono font-semibold uppercase text-[#45464d] mb-1">Search Client / Code</label>
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Client name, CLI code, notes..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-[#ffffff] border border-[#cbd5e1] rounded-sm text-sm text-[#0b1c30] placeholder-slate-400 focus:outline-none focus:border-[#0051d5]"
              />
            </div>
          </div>

          {/* From Date */}
          <div>
            <label className="block text-xs font-mono font-semibold uppercase text-[#45464d] mb-1">From Transaction Date</label>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="w-full px-3 py-2 bg-[#ffffff] border border-[#cbd5e1] rounded-sm text-sm text-[#0b1c30] focus:outline-none focus:border-[#0051d5]"
            />
          </div>

          {/* To Date */}
          <div>
            <label className="block text-xs font-mono font-semibold uppercase text-[#45464d] mb-1">To Transaction Date</label>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="w-full px-3 py-2 bg-[#ffffff] border border-[#cbd5e1] rounded-sm text-sm text-[#0b1c30] focus:outline-none focus:border-[#0051d5]"
            />
          </div>

          {/* Type Filter */}
          <div>
            <label className="block text-xs font-mono font-semibold uppercase text-[#45464d] mb-1">Transaction Type</label>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full px-3 py-2 bg-[#ffffff] border border-[#cbd5e1] rounded-sm text-sm text-[#0b1c30] focus:outline-none focus:border-[#0051d5]"
            >
              <option value="all">All Types (Payments & Withdrawals)</option>
              <option value="payment">Payments Only (+Credit)</option>
              <option value="withdrawal">Withdrawals Only (-Debit)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Global Table */}
      <div className="institutional-panel overflow-hidden">
        <div className="px-4 py-3 bg-[#f8fafc] border-b border-[#cbd5e1] flex items-center justify-between">
          <span className="text-xs sm:text-sm font-mono font-bold uppercase tracking-wider text-[#0b1c30]">
            System Journal Records
          </span>
          <span className="text-xs sm:text-sm font-mono text-slate-600 font-bold">{transactions.length} entries</span>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-500 text-sm font-mono">
            Fetching transaction records...
          </div>
        ) : transactions.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-sm font-mono">
            No transaction journal entries match specified filters.
          </div>
        ) : (
          <>
            {/* Desktop Table (>= 768px) */}
            <div className="hidden md:block overflow-x-auto">
              <table className="institutional-table">
                <thead>
                  <tr>
                    <th>Tx Date</th>
                    <th>Client Account</th>
                    <th>Type</th>
                    <th className="text-right">Entry Amount</th>
                    <th className="text-right">Resulting Balance</th>
                    <th>Audit Notes / Reference</th>
                    <th>Timestamp</th>
                    <th className="text-center">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((tx) => {
                    const isPayment = tx.type === 'payment';
                    const client = tx.clients;

                    return (
                      <tr key={tx.id}>
                        <td className="font-mono text-[#0b1c30] text-sm whitespace-nowrap">
                          {formatDate(tx.transaction_date)}
                        </td>
                        <td className="whitespace-nowrap">
                          {client ? (
                            <button
                              onClick={() => onSelectClient(client)}
                              className="text-left group"
                            >
                              <span className="font-bold text-[#0b1c30] block text-sm group-hover:text-[#0051d5]">
                                {client.name}
                              </span>
                              <span className="badge-code text-xs">{client.client_code}</span>
                            </button>
                          ) : (
                            <span className="text-slate-400">-</span>
                          )}
                        </td>
                        <td className="whitespace-nowrap">
                          <span className={isPayment ? 'badge-verified' : 'badge-alert'}>
                            {isPayment ? '+ PAYMENT' : '- WITHDRAWAL'}
                          </span>
                        </td>
                        <td className={`font-mono tnum font-bold text-right text-sm sm:text-base whitespace-nowrap ${
                          isPayment ? 'text-[#059669]' : 'text-[#ba1a1a]'
                        }`}>
                          {isPayment ? '+' : '-'}{formatNaira(tx.amount)}
                        </td>
                        <td className="font-mono tnum font-bold text-[#0b1c30] text-sm sm:text-base text-right whitespace-nowrap">
                          {formatNaira(tx.resulting_balance)}
                        </td>
                        <td className="text-slate-600 max-w-xs truncate text-xs sm:text-sm">
                          {tx.notes || '-'}
                        </td>
                        <td className="font-mono text-xs text-slate-500 whitespace-nowrap">
                          {formatDateTime(tx.created_at)}
                        </td>
                        <td className="text-center whitespace-nowrap">
                          <button
                            onClick={() => onDeleteTransactionRequest(tx)}
                            className="p-1.5 text-slate-400 hover:text-[#ba1a1a] hover:bg-[#fef2f2] rounded-xs"
                            title="Delete transaction entry"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Stacked Card View (< 768px) */}
            <div className="md:hidden divide-y divide-[#f1f5f9]">
              {transactions.map((tx) => {
                const isPayment = tx.type === 'payment';
                const client = tx.clients;

                return (
                  <div key={tx.id} className="p-4 space-y-2.5 bg-[#ffffff]">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className={isPayment ? 'badge-verified' : 'badge-alert'}>
                            {isPayment ? 'PAYMENT' : 'WITHDRAWAL'}
                          </span>
                          <span className="font-mono text-xs text-slate-500">
                            {formatDate(tx.transaction_date)}
                          </span>
                        </div>
                        {client && (
                          <div
                            onClick={() => onSelectClient(client)}
                            className="mt-1 cursor-pointer"
                          >
                            <span className="font-bold text-[#0b1c30] text-sm sm:text-base block">{client.name}</span>
                            <span className="badge-code">{client.client_code}</span>
                          </div>
                        )}
                      </div>

                      <div className="text-right">
                        <span className={`font-mono tnum font-bold text-base block ${isPayment ? 'text-[#059669]' : 'text-[#ba1a1a]'}`}>
                          {isPayment ? '+' : '-'}{formatNaira(tx.amount)}
                        </span>
                        <span className="font-mono text-xs text-slate-500 block">
                          Bal: {formatNaira(tx.resulting_balance)}
                        </span>
                      </div>
                    </div>

                    {tx.notes && (
                      <p className="text-xs text-slate-600 bg-[#f8fafc] p-2.5 rounded-xs border border-[#e2e8f0]">
                        {tx.notes}
                      </p>
                    )}

                    <div className="pt-2 border-t border-[#f1f5f9] flex items-center justify-between text-xs font-mono text-slate-500">
                      <span>{formatDateTime(tx.created_at)}</span>
                      <button
                        onClick={() => onDeleteTransactionRequest(tx)}
                        className="text-[#ba1a1a] font-bold hover:underline flex items-center space-x-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Delete Entry</span>
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
  );
}
