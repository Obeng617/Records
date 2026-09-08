import React, { useState, useEffect } from 'react';
import { X, Calendar, Filter, Trash2, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { formatNaira, formatDate } from '../utils/formatters';
import { api } from '../services/api';

export default function ContributorDetailModal({
  isOpen,
  onClose,
  contributor,
  onDeleteContributorRequest,
  onRefreshData
}) {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [togglingWeek, setTogglingWeek] = useState(null);

  const fetchHistory = async () => {
    if (!contributor) return;
    setLoading(true);
    try {
      const res = await api.getContributorPayments(contributor.id, {
        from: fromDate,
        to: toDate,
        status: statusFilter
      });
      setPayments(res.payments || []);
    } catch (err) {
      console.error('Failed to fetch contributor payments:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && contributor) {
      fetchHistory();
    }
  }, [isOpen, contributor, fromDate, toDate, statusFilter]);

  if (!isOpen || !contributor) return null;

  const handleToggle = async (payment) => {
    const newStatus = payment.status === 'paid' ? 'missed' : 'paid';
    setTogglingWeek(payment.id);
    try {
      await api.toggleContribution(contributor.id, {
        week_date: payment.week_date,
        status: newStatus,
        date_paid: newStatus === 'paid' ? new Date().toISOString().split('T')[0] : null
      });
      await fetchHistory();
      if (onRefreshData) onRefreshData();
    } catch (err) {
      console.error('Failed to toggle contribution:', err);
    } finally {
      setTogglingWeek(null);
    }
  };

  const clearFilters = () => {
    setFromDate('');
    setToDate('');
    setStatusFilter('all');
  };

  const totalPaidAmount = payments
    .filter(p => p.status === 'paid')
    .reduce((sum, p) => sum + (parseFloat(p.amount) || 3500), 0);

  const paidWeeksCount = payments.filter(p => p.status === 'paid').length;
  const missedWeeksCount = payments.filter(p => p.status === 'missed').length;

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-2 sm:p-4 bg-[#0b1c30]/50 backdrop-blur-sm animate-fade-in">
      <div className="institutional-card w-full max-w-4xl max-h-[92vh] bg-[#ffffff] border border-[#cbd5e1] flex flex-col overflow-hidden shadow-2xl">
        
        {/* Header */}
        <div className="px-4 py-3 bg-[#0b132b] text-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded bg-[#1c2541] border border-[#334155] flex items-center justify-center text-[#f59e0b] font-mono font-bold text-xs">
              {contributor.name.substring(0, 2).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-sm sm:text-base font-semibold text-white font-sans">{contributor.name}</h2>
                <span className="badge-code">{contributor.contributor_code}</span>
              </div>
              <div className="flex items-center space-x-3 text-[11px] font-mono text-slate-300 mt-0.5">
                {contributor.phone && <span>Phone: {contributor.phone}</span>}
                <span>Joined: {formatDate(contributor.start_date)}</span>
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
          
          {/* Summary Panel */}
          <div className="p-4 rounded-sm bg-[#fffbeb] border border-[#fef3c7] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
            <div>
              <span className="text-[10px] font-mono uppercase text-[#92400e] font-bold">Total Scheme Contributions</span>
              <div className="text-2xl sm:text-3xl font-bold font-mono tnum text-[#b45309] tracking-tight mt-0.5">
                {formatNaira(contributor.total_contributed || totalPaidAmount)}
              </div>
              <div className="flex items-center space-x-3 text-xs font-mono text-slate-600 mt-1">
                <span className="text-[#059669] font-bold">✓ {paidWeeksCount} Weeks Paid</span>
                <span className="text-[#ba1a1a] font-bold">✗ {missedWeeksCount} Weeks Missed</span>
              </div>
            </div>

            <div className="flex items-center space-x-2 w-full sm:w-auto">
              {onDeleteContributorRequest && (
                <button
                  onClick={() => {
                    onClose();
                    onDeleteContributorRequest(contributor);
                  }}
                  className="px-3 py-2 text-xs font-bold font-mono text-[#ba1a1a] bg-[#fef2f2] hover:bg-[#ffe4e6] border border-[#fecaca] rounded-sm transition-colors flex items-center space-x-1.5 shadow-xs"
                  title="Delete Contributor Account"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Delete Account</span>
                </button>
              )}
            </div>
          </div>

          {/* Filter Bar */}
          <div className="institutional-panel p-3 space-y-2">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-[#0b1c30] font-semibold uppercase flex items-center space-x-1.5">
                <Filter className="w-3.5 h-3.5 text-[#d97706]" />
                <span>Filter Weekly Ledger</span>
              </span>
              {(fromDate || toDate || statusFilter !== 'all') && (
                <button onClick={clearFilters} className="text-[#d97706] hover:underline font-bold">
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
                <label className="block text-[10px] font-mono uppercase text-[#45464d] mb-1">Status</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full px-2.5 py-1 bg-[#ffffff] border border-[#cbd5e1] rounded-sm text-xs text-[#0b1c30]"
                >
                  <option value="all">All Statuses</option>
                  <option value="paid">Paid Only (₦3,500)</option>
                  <option value="missed">Missed Only (₦0)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Payments Table */}
          <div className="institutional-panel overflow-hidden">
            <div className="px-4 py-2.5 bg-[#f8fafc] border-b border-[#cbd5e1] flex items-center justify-between">
              <span className="text-xs font-mono font-semibold uppercase text-[#0b1c30]">Contribution History</span>
              <span className="text-xs font-mono text-slate-500">{payments.length} weeks recorded</span>
            </div>

            {loading ? (
              <div className="p-8 text-center text-slate-500 text-xs font-mono flex items-center justify-center space-x-2">
                <Loader2 className="w-4 h-4 animate-spin text-[#d97706]" />
                <span>Loading payment records...</span>
              </div>
            ) : payments.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-xs font-mono">
                No weekly contribution records match the selected filter criteria.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="institutional-table">
                  <thead>
                    <tr>
                      <th>Calendar Week Date</th>
                      <th>Status</th>
                      <th className="text-right">Amount</th>
                      <th>Date Paid</th>
                      <th>Notes / Memo</th>
                      <th className="text-center">Toggle Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payments.map((p) => {
                      const isPaid = p.status === 'paid';
                      const isToggling = togglingWeek === p.id;

                      return (
                        <tr key={p.id}>
                          <td className="font-mono text-[#0b1c30] whitespace-nowrap font-bold">
                            {formatDate(p.week_date)}
                          </td>
                          <td className="whitespace-nowrap">
                            {isPaid ? (
                              <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-xs text-xs font-mono font-bold bg-[#ecfdf5] text-[#059669] border border-[#a7f3d0]">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>PAID</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-xs text-xs font-mono font-bold bg-[#fef2f2] text-[#ba1a1a] border border-[#fecaca]">
                                <XCircle className="w-3.5 h-3.5" />
                                <span>MISSED</span>
                              </span>
                            )}
                          </td>
                          <td className={`font-mono tnum font-bold text-right whitespace-nowrap ${
                            isPaid ? 'text-[#059669]' : 'text-[#ba1a1a]'
                          }`}>
                            {isPaid ? formatNaira(p.amount || 3500) : '₦0.00'}
                          </td>
                          <td className="font-mono text-xs text-slate-600 whitespace-nowrap">
                            {isPaid && p.date_paid ? formatDate(p.date_paid) : '—'}
                          </td>
                          <td className="text-slate-600 text-xs truncate max-w-xs">
                            {p.notes || '—'}
                          </td>
                          <td className="text-center whitespace-nowrap">
                            <button
                              onClick={() => handleToggle(p)}
                              disabled={isToggling}
                              className={`px-3 py-1 text-xs font-bold font-mono rounded-xs border transition-colors shadow-xs ${
                                isPaid
                                  ? 'text-[#ba1a1a] bg-[#fef2f2] hover:bg-[#ffe4e6] border-[#fecaca]'
                                  : 'text-[#059669] bg-[#ecfdf5] hover:bg-[#d1fae5] border-[#a7f3d0]'
                              }`}
                            >
                              {isToggling ? (
                                <span className="flex items-center space-x-1">
                                  <Loader2 className="w-3 h-3 animate-spin" />
                                  <span>Updating...</span>
                                </span>
                              ) : (
                                <span>{isPaid ? 'Mark Missed' : 'Mark Paid (₦3,500)'}</span>
                              )}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
