import React from 'react';
import { Search, ArrowUpRight, Users, History, ArrowDownRight, ArrowUpLeft, ChevronRight, RefreshCw, PiggyBank } from 'lucide-react';
import StatsCards from '../components/StatsCards';
import { formatNaira, formatDate } from '../utils/formatters';

export default function Dashboard({
  stats,
  clients = [],
  transactions = [],
  loading,
  searchTerm,
  setSearchTerm,
  onOpenNewClient,
  onOpenNewTransaction,
  onSelectClient,
  onDeleteTransactionRequest,
  onManualRefresh,
  onViewAllClients,
  onViewAllTransactions,
  onViewAllFoodstuffs
}) {
  const filteredClients = clients.filter(c => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return c.name.toLowerCase().includes(term) || c.client_code.toLowerCase().includes(term);
  });

  const CLIENT_PREVIEW_LIMIT = 5;
  const TX_PREVIEW_LIMIT = 5;

  return (
    <div className="space-y-6 pb-20">
      
      {/* Header Banner & Audit Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#e2e8f0] pb-5">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl sm:text-3xl font-bold text-[#0b1c30] tracking-tight font-sans">
              Executive Audit Dashboard
            </h1>
            <span className="badge-verified hidden sm:inline-flex">System Reconciled</span>
          </div>
          <p className="text-xs sm:text-sm text-[#45464d] font-mono mt-1">
            Real-time control terminal for client balances & transaction ledgers
          </p>
        </div>

        <div className="flex items-center space-x-2.5">
          {/* Global Search Bar */}
          <div className="relative flex-1 sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search client name or code..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-[#ffffff] border border-[#cbd5e1] rounded-sm text-sm text-[#0b1c30] placeholder-slate-400 focus:outline-none focus:border-[#0051d5] shadow-sm"
            />
          </div>

          {/* Refresh Button */}
          <button
            onClick={onManualRefresh}
            className="flex items-center space-x-1.5 px-3.5 py-2 text-xs font-mono font-bold text-[#0b1c30] bg-[#ffffff] hover:bg-[#f1f5f9] border border-[#cbd5e1] rounded-sm transition-colors shadow-sm"
            title="Force refresh database records"
          >
            <RefreshCw className={`w-4 h-4 text-[#0051d5] ${loading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>
      </div>

      {/* Aggregate Stats Cards */}
      <StatsCards stats={stats} loading={loading} />

      {/* Main Grid Workspace: Client Directory + Recent Transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Cols: Client Directory Summary */}
        <div className="lg:col-span-2 space-y-3.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Users className="w-5 h-5 text-[#0051d5]" />
              <h2 className="text-base font-bold text-[#0b1c30] font-sans uppercase tracking-wider">
                Client Balances Directory
              </h2>
            </div>
          </div>

          <div className="institutional-panel overflow-hidden flex flex-col">
            {loading ? (
              <div className="p-10 text-center text-slate-500 text-sm font-mono">
                Loading client accounts...
              </div>
            ) : filteredClients.length === 0 ? (
              <div className="p-10 text-center text-slate-500 text-sm font-mono">
                No client records match "{searchTerm}".
              </div>
            ) : (
              <>
                <div className="divide-y divide-[#f1f5f9]">
                  {filteredClients.slice(0, CLIENT_PREVIEW_LIMIT).map((client) => {
                    const bal = parseFloat(client.current_balance) || 0;
                    return (
                      <div
                        key={client.id}
                        onClick={() => onSelectClient(client)}
                        className="p-3.5 sm:p-4 hover:bg-[#eff6ff] cursor-pointer flex items-center justify-between transition-all group border-l-2 border-transparent hover:border-[#0051d5]"
                      >
                        <div className="flex items-center space-x-3.5 min-w-0">
                          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded bg-[#f1f5f9] text-[#0051d5] font-mono font-bold text-sm flex items-center justify-center border border-[#cbd5e1] shrink-0">
                            {client.name.substring(0, 2).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center space-x-2">
                              <span className="font-bold text-[#0b1c30] text-sm sm:text-base group-hover:text-[#0051d5] transition-colors truncate">
                                {client.name}
                              </span>
                              <span className="badge-code shrink-0">
                                {client.client_code}
                              </span>
                            </div>
                            {client.phone && (
                              <p className="text-xs font-mono text-slate-500 mt-0.5 truncate">{client.phone}</p>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center space-x-3 sm:space-x-4 shrink-0 ml-2">
                          <div className="text-right">
                            <span className="text-[10px] uppercase font-mono text-slate-500 block font-semibold">Ledger Balance</span>
                            <span className="font-mono tnum font-bold text-sm sm:text-base text-[#059669]">
                              {formatNaira(bal)}
                            </span>
                          </div>
                          <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-[#0b1c30] transition-colors" />
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* View All Clients Footer Control */}
                {onViewAllClients && (
                  <div className="px-4 py-3 bg-[#f8fafc] border-t border-[#e2e8f0] flex items-center justify-end mt-auto">
                    <button
                      onClick={onViewAllClients}
                      className="w-full sm:w-auto px-4 py-2 font-sans text-xs font-bold text-white bg-[#0051d5] hover:bg-[#1d4ed8] rounded-sm transition-colors flex items-center justify-center space-x-1.5 shadow-sm"
                    >
                      <span>View All Clients</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Right 1 Col: Recent Audit Log Feed */}
        <div className="space-y-3.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <History className="w-5 h-5 text-[#059669]" />
              <h2 className="text-base font-bold text-[#0b1c30] font-sans uppercase tracking-wider">
                Recent Audit Feed
              </h2>
            </div>
            <button
              onClick={() => onOpenNewTransaction()}
              className="text-xs sm:text-sm font-bold text-[#059669] hover:text-[#047857] flex items-center space-x-1"
            >
              <ArrowUpRight className="w-4 h-4" />
              <span>Record Entry</span>
            </button>
          </div>

          <div className="institutional-panel p-3.5 space-y-2.5 flex flex-col">
            {loading ? (
              <div className="py-10 text-center text-slate-500 text-sm font-mono">
                Loading audit trail...
              </div>
            ) : transactions.length === 0 ? (
              <div className="py-10 text-center text-slate-500 text-sm font-mono">
                No recent transaction entries.
              </div>
            ) : (
              <>
                <div className="space-y-2.5">
                  {transactions.slice(0, TX_PREVIEW_LIMIT).map((tx) => {
                    const isPayment = tx.type === 'payment';
                    const clientName = tx.clients?.name || 'Client Account';
                    const clientCode = tx.clients?.client_code || '';

                    return (
                      <div
                        key={tx.id}
                        className="p-3 rounded-sm bg-[#ffffff] border border-[#e2e8f0] flex items-center justify-between hover:border-[#cbd5e1] transition-all text-xs sm:text-sm"
                      >
                        <div className="flex items-center space-x-3 min-w-0">
                          <div className={`w-8 h-8 rounded flex items-center justify-center shrink-0 ${
                            isPayment 
                              ? 'bg-[#ecfdf5] text-[#059669] border border-[#a7f3d0]' 
                              : 'bg-[#fef2f2] text-[#ba1a1a] border border-[#fecaca]'
                          }`}>
                            {isPayment ? <ArrowDownRight className="w-4 h-4" /> : <ArrowUpLeft className="w-4 h-4" />}
                          </div>
                          <div className="min-w-0">
                            <div className="font-bold text-[#0b1c30] truncate text-xs sm:text-sm">
                              {clientName}
                            </div>
                            <div className="text-xs font-mono text-slate-500 truncate">
                              {formatDate(tx.transaction_date)} • <span className="text-[#0051d5] font-bold">{clientCode}</span>
                            </div>
                          </div>
                        </div>

                        <div className="text-right shrink-0 ml-2">
                          <span className={`font-mono tnum font-bold text-xs sm:text-sm ${isPayment ? 'text-[#059669]' : 'text-[#ba1a1a]'}`}>
                            {isPayment ? '+' : '-'}{formatNaira(tx.amount)}
                          </span>
                          <span className="text-[10px] text-slate-500 block font-mono">
                            Bal: {formatNaira(tx.resulting_balance)}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* View Full Audit Log Footer Control */}
                {onViewAllTransactions && (
                  <div className="pt-2 border-t border-[#e2e8f0] flex items-center justify-end text-xs font-mono">
                    <button
                      onClick={onViewAllTransactions}
                      className="w-full sm:w-auto px-3.5 py-1.5 font-sans font-bold text-[#059669] hover:text-[#047857] bg-[#ecfdf5] hover:bg-[#d1fae5] border border-[#a7f3d0] rounded-sm transition-colors flex items-center justify-center space-x-1 text-xs"
                    >
                      <span>View Full Audit Log</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Foodstuffs Scheme Module Quick Link Widget */}
          {onViewAllFoodstuffs && (
            <div className="institutional-card p-4 bg-[#fffbeb] border border-[#fef3c7] flex items-center justify-between shadow-xs">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded bg-[#fef3c7] text-[#d97706] border border-[#fde68a] flex items-center justify-center shrink-0">
                  <PiggyBank className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs sm:text-sm font-bold text-[#0b1c30] font-sans">Foodstuffs Scheme Tracker</h3>
                  <p className="text-[11px] font-mono text-slate-500">Fixed ₦3,500 weekly contribution ledger</p>
                </div>
              </div>

              <button
                onClick={onViewAllFoodstuffs}
                className="px-3 py-1.5 text-xs font-bold font-mono text-[#b45309] bg-[#ffffff] hover:bg-[#fde68a] border border-[#fde68a] rounded-sm transition-colors flex items-center space-x-1 shrink-0 shadow-xs"
              >
                <span>View All Scheme</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}


