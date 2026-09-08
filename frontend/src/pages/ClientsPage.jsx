import React from 'react';
import { Search, UserPlus, ArrowDownRight, ArrowUpLeft, Eye, Phone, ChevronRight, Trash2 } from 'lucide-react';
import { formatNaira, formatDate } from '../utils/formatters';

export default function ClientsPage({
  clients = [],
  searchTerm,
  setSearchTerm,
  onOpenNewClient,
  onSelectClient,
  onRecordTransaction,
  onDeleteClientRequest
}) {
  const filteredClients = clients.filter(c => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return c.name.toLowerCase().includes(term) || c.client_code.toLowerCase().includes(term) || (c.phone && c.phone.toLowerCase().includes(term));
  });

  return (
    <div className="space-y-6 pb-20">
      
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#e2e8f0] pb-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#0b1c30] tracking-tight font-sans">
            Client Accounts Directory
          </h1>
          <p className="text-xs sm:text-sm text-[#45464d] font-mono mt-1">
            Centralized index of registered client ledgers and current standing balances
          </p>
        </div>

        <button
          onClick={onOpenNewClient}
          className="flex items-center space-x-2 px-4 py-2 text-xs sm:text-sm font-bold text-white bg-[#0051d5] hover:bg-[#1d4ed8] border border-[#3b82f6] rounded-sm transition-colors shadow-sm self-start sm:self-auto"
        >
          <UserPlus className="w-4 h-4" />
          <span>Register New Client</span>
        </button>
      </div>

      {/* Toolbar & Search */}
      <div className="institutional-card p-4 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by client name, CLI code, or phone number..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-[#ffffff] border border-[#cbd5e1] rounded-sm text-sm text-[#0b1c30] placeholder-slate-400 focus:outline-none focus:border-[#0051d5] shadow-sm"
            />
          </div>

          <div className="flex items-center justify-between sm:justify-end space-x-2 text-xs sm:text-sm font-mono text-[#45464d]">
            <span>Total Accounts:</span>
            <span className="font-bold text-[#0b1c30] bg-[#f1f5f9] px-2.5 py-1 rounded-xs border border-[#cbd5e1]">
              {filteredClients.length}
            </span>
          </div>
        </div>
      </div>

      {/* Accounts Directory Grid / Table */}
      <div className="institutional-panel overflow-hidden">
        {filteredClients.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-sm font-mono">
            No client accounts match your search filter "{searchTerm}".
          </div>
        ) : (
          <>
            {/* Desktop Table View (>= 768px) */}
            <div className="hidden md:block overflow-x-auto">
              <table className="institutional-table">
                <thead>
                  <tr>
                    <th>Client Code</th>
                    <th>Account Name</th>
                    <th>Phone / Contact</th>
                    <th className="text-right">Current Ledger Balance</th>
                    <th>Registered Date</th>
                    <th className="text-center">Quick Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredClients.map((client) => {
                    const bal = parseFloat(client.current_balance) || 0;
                    return (
                      <tr key={client.id} className="group">
                        <td className="font-mono">
                          <span className="badge-code">{client.client_code}</span>
                        </td>
                        <td className="font-bold text-[#0b1c30] text-sm sm:text-base">
                          <button
                            onClick={() => onSelectClient(client)}
                            className="hover:text-[#0051d5] hover:underline text-left transition-colors"
                          >
                            {client.name}
                          </button>
                        </td>
                        <td className="font-mono text-slate-600 text-xs sm:text-sm">
                          {client.phone || '-'}
                        </td>
                        <td className="text-right font-mono tnum font-bold text-[#059669] text-sm sm:text-base">
                          {formatNaira(bal)}
                        </td>
                        <td className="font-mono text-slate-500 text-xs sm:text-sm">
                          {formatDate(client.created_at?.split('T')[0] || '')}
                        </td>
                        <td>
                          <div className="flex items-center justify-center space-x-2">
                            <button
                              onClick={() => onRecordTransaction(client, 'payment')}
                              className="px-3 py-1.5 text-xs font-bold text-[#059669] bg-[#ecfdf5] hover:bg-[#d1fae5] border border-[#a7f3d0] rounded-xs flex items-center space-x-1"
                              title="Record Payment Deposit"
                            >
                              <ArrowDownRight className="w-3.5 h-3.5" />
                              <span>Payment</span>
                            </button>

                            <button
                              onClick={() => onRecordTransaction(client, 'withdrawal')}
                              className="px-3 py-1.5 text-xs font-bold text-[#ba1a1a] bg-[#fef2f2] hover:bg-[#ffe4e6] border border-[#fecaca] rounded-xs flex items-center space-x-1"
                              title="Record Withdrawal"
                            >
                              <ArrowUpLeft className="w-3.5 h-3.5" />
                              <span>Withdrawal</span>
                            </button>

                            <button
                              onClick={() => onSelectClient(client)}
                              className="p-1.5 text-slate-500 hover:text-[#0b1c30] hover:bg-[#f1f5f9] rounded-xs"
                              title="View Client Ledger Details"
                            >
                              <Eye className="w-4 h-4" />
                            </button>

                            <button
                              onClick={() => onDeleteClientRequest(client)}
                              className="p-1.5 text-slate-400 hover:text-[#ba1a1a] hover:bg-[#fef2f2] rounded-xs transition-colors"
                              title="Delete Client Account"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Stacked Card View (< 768px) */}
            <div className="md:hidden divide-y divide-[#f1f5f9]">
              {filteredClients.map((client) => {
                const bal = parseFloat(client.current_balance) || 0;
                return (
                  <div key={client.id} className="p-4 space-y-3 bg-[#ffffff]">
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="badge-code mb-1 inline-block">{client.client_code}</span>
                        <h3
                          onClick={() => onSelectClient(client)}
                          className="font-bold text-[#0b1c30] text-base hover:text-[#0051d5] cursor-pointer"
                        >
                          {client.name}
                        </h3>
                        {client.phone && (
                          <p className="text-xs font-mono text-slate-500 flex items-center space-x-1 mt-0.5">
                            <Phone className="w-3.5 h-3.5 text-slate-400" />
                            <span>{client.phone}</span>
                          </p>
                        )}
                      </div>

                      <div className="text-right">
                        <span className="text-[10px] uppercase font-mono text-slate-500 block font-semibold">Balance</span>
                        <span className="font-mono tnum font-bold text-base text-[#059669]">
                          {formatNaira(bal)}
                        </span>
                      </div>
                    </div>

                    <div className="pt-2.5 border-t border-[#f1f5f9] flex items-center justify-between space-x-2 text-xs">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => onRecordTransaction(client, 'payment')}
                          className="px-3 py-1.5 text-xs font-bold text-[#059669] bg-[#ecfdf5] border border-[#a7f3d0] rounded-xs flex items-center space-x-1"
                        >
                          <ArrowDownRight className="w-3.5 h-3.5" />
                          <span>+ Pay</span>
                        </button>

                        <button
                          onClick={() => onRecordTransaction(client, 'withdrawal')}
                          className="px-3 py-1.5 text-xs font-bold text-[#ba1a1a] bg-[#fef2f2] border border-[#fecaca] rounded-xs flex items-center space-x-1"
                        >
                          <ArrowUpLeft className="w-3.5 h-3.5" />
                          <span>- Withdraw</span>
                        </button>
                      </div>

                      <div className="flex items-center space-x-1.5">
                        <button
                          onClick={() => onSelectClient(client)}
                          className="px-3 py-1.5 text-[#0b1c30] font-semibold hover:text-[#0051d5] bg-[#f1f5f9] border border-[#cbd5e1] rounded-xs flex items-center space-x-1"
                        >
                          <span>Ledger</span>
                          <ChevronRight className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => onDeleteClientRequest(client)}
                          className="p-1.5 text-slate-400 hover:text-[#ba1a1a] hover:bg-[#fef2f2] border border-transparent rounded-xs"
                          title="Delete Client Account"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
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

