import React from 'react';
import { Wallet, ArrowDownRight, ArrowUpLeft, Users } from 'lucide-react';
import { formatNaira } from '../utils/formatters';

export default function StatsCards({ stats, loading }) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 mb-8">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="institutional-card p-5 animate-pulse h-32 flex flex-col justify-between">
            <div className="h-4 bg-[#e2e8f0] rounded w-2/3"></div>
            <div className="h-8 bg-[#e2e8f0] rounded w-3/4"></div>
            <div className="h-4 bg-[#e2e8f0] rounded w-1/3"></div>
          </div>
        ))}
      </div>
    );
  }

  const {
    total_clients = 0,
    total_balance_held = 0,
    total_payments = 0,
    total_withdrawals = 0,
    total_transactions = 0
  } = stats || {};

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 mb-8">
      
      {/* Total Balance Held */}
      <div className="institutional-card p-5 relative overflow-hidden group">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#45464d]">
            Net Balance Held
          </span>
          <div className="w-8 h-8 rounded bg-[#eff4ff] text-[#0051d5] border border-[#bfdbfe] flex items-center justify-center">
            <Wallet className="w-4 h-4" />
          </div>
        </div>
        <div className="text-2xl sm:text-3xl font-bold font-mono tnum text-[#0b1c30] tracking-tight my-1">
          {formatNaira(total_balance_held)}
        </div>
        <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-[#e2e8f0] text-xs text-[#45464d]">
          <span>Aggregate liability</span>
          <span className="font-mono text-[#059669] text-xs font-bold">RECONCILED</span>
        </div>
      </div>

      {/* Total Payments */}
      <div className="institutional-card p-5 relative overflow-hidden group">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#45464d]">
            Total Payments (Inflow)
          </span>
          <div className="w-8 h-8 rounded bg-[#ecfdf5] text-[#059669] border border-[#a7f3d0] flex items-center justify-center">
            <ArrowDownRight className="w-4 h-4" />
          </div>
        </div>
        <div className="text-2xl sm:text-3xl font-bold font-mono tnum text-[#059669] tracking-tight my-1">
          {formatNaira(total_payments)}
        </div>
        <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-[#e2e8f0] text-xs text-[#45464d]">
          <span>Deposits recorded</span>
          <span className="font-mono text-[#059669] text-xs font-bold">+CREDIT</span>
        </div>
      </div>

      {/* Total Withdrawals */}
      <div className="institutional-card p-5 relative overflow-hidden group">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#45464d]">
            Total Withdrawals (Outflow)
          </span>
          <div className="w-8 h-8 rounded bg-[#fef2f2] text-[#ba1a1a] border border-[#fecaca] flex items-center justify-center">
            <ArrowUpLeft className="w-4 h-4" />
          </div>
        </div>
        <div className="text-2xl sm:text-3xl font-bold font-mono tnum text-[#ba1a1a] tracking-tight my-1">
          {formatNaira(total_withdrawals)}
        </div>
        <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-[#e2e8f0] text-xs text-[#45464d]">
          <span>Payouts executed</span>
          <span className="font-mono text-[#ba1a1a] text-xs font-bold">-DEBIT</span>
        </div>
      </div>

      {/* Active Accounts */}
      <div className="institutional-card p-5 relative overflow-hidden group">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#45464d]">
            Registered Accounts
          </span>
          <div className="w-8 h-8 rounded bg-[#f1f5f9] text-[#0051d5] border border-[#cbd5e1] flex items-center justify-center">
            <Users className="w-4 h-4" />
          </div>
        </div>
        <div className="text-2xl sm:text-3xl font-bold font-mono tnum text-[#0b1c30] tracking-tight my-1">
          {total_clients}
        </div>
        <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-[#e2e8f0] text-xs text-[#45464d]">
          <span>Client ledgers</span>
          <span className="font-mono text-[#0051d5] text-xs font-bold">{total_transactions} tx entries</span>
        </div>
      </div>

    </div>
  );
}
