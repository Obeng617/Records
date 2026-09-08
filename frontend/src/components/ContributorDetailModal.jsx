import React, { useState, useEffect } from 'react';
import { X, Calendar, Filter, Trash2, CheckCircle2, XCircle, Loader2, RefreshCw } from 'lucide-react';
import { formatNaira, formatDate } from '../utils/formatters';
import { api } from '../services/api';

// Helper to calculate Monday date (YYYY-MM-DD)
function getMonday(dStr) {
  if (!dStr) {
    const d = new Date();
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(d.setDate(diff));
    return monday.toISOString().split('T')[0];
  }
  const parts = dStr.split('-').map(Number);
  const d = new Date(parts[0], parts[1] - 1, parts[2]);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(d.setDate(diff));
  return monday.toISOString().split('T')[0];
}

// Helper to generate full weekly schedule from start_date up to max(current week + 4 weeks, existing payments max date, filter toDate)
function generateWeeklySchedule(startDateStr, existingPayments, filterToDate) {
  const currentMondayStr = getMonday();
  
  // Base default end date: current Monday + 4 weeks in advance
  const defaultEnd = new Date(currentMondayStr);
  defaultEnd.setDate(defaultEnd.getDate() + (4 * 7));
  let maxEndMondayStr = defaultEnd.toISOString().split('T')[0];

  // If existing payments extend further into the future, expand end date
  (existingPayments || []).forEach(p => {
    if (p.week_date && p.week_date > maxEndMondayStr) {
      maxEndMondayStr = getMonday(p.week_date);
    }
  });

  // If user sets a toDate filter in the future, expand end date to match filter
  if (filterToDate) {
    const filterMonday = getMonday(filterToDate);
    if (filterMonday > maxEndMondayStr) {
      maxEndMondayStr = filterMonday;
    }
  }

  let startMondayStr = startDateStr ? getMonday(startDateStr) : null;
  if (!startMondayStr || startMondayStr > currentMondayStr) {
    // Default fallback to 8 weeks ago
    const d = new Date(currentMondayStr);
    d.setDate(d.getDate() - (7 * 7));
    startMondayStr = d.toISOString().split('T')[0];
  }

  const paymentMap = {};
  (existingPayments || []).forEach(p => {
    paymentMap[p.week_date] = p;
  });

  const weeks = [];
  const [sY, sM, sD] = startMondayStr.split('-').map(Number);
  let curr = new Date(sY, sM - 1, sD);
  const [eY, eM, eD] = maxEndMondayStr.split('-').map(Number);
  const end = new Date(eY, eM - 1, eD);

  let count = 0;
  while (curr <= end && count < 260) { // Limit to 5 years max
    const year = curr.getFullYear();
    const month = String(curr.getMonth() + 1).padStart(2, '0');
    const day = String(curr.getDate()).padStart(2, '0');
    const weekDateStr = `${year}-${month}-${day}`;

    const existing = paymentMap[weekDateStr];
    if (existing) {
      weeks.push(existing);
    } else {
      weeks.push({
        id: `unmarked-${weekDateStr}`,
        week_date: weekDateStr,
        status: 'unmarked',
        amount: 0,
        date_paid: null,
        notes: null
      });
    }

    curr.setDate(curr.getDate() + 7);
    count++;
  }

  // Reverse list so newest / future week is at the top
  return weeks.reverse();
}

export default function ContributorDetailModal({
  isOpen,
  onClose,
  contributor,
  onDeleteContributorRequest,
  onRefreshData
}) {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeModalTab, setActiveModalTab] = useState('recorded'); // 'recorded' | 'schedule'
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [togglingWeek, setTogglingWeek] = useState(null);

  const fetchHistory = async () => {
    if (!contributor) return;
    setLoading(true);
    try {
      // Fetch all recorded payments for contributor (without query restriction so future payments are always returned)
      const res = await api.getContributorPayments(contributor.id);
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
  }, [isOpen, contributor]);

  if (!isOpen || !contributor) return null;

  const handleToggleWeek = async (weekDate, targetStatus) => {
    setTogglingWeek(weekDate);
    try {
      await api.toggleContribution(contributor.id, {
        week_date: weekDate,
        status: targetStatus,
        date_paid: targetStatus === 'paid' ? new Date().toISOString().split('T')[0] : null
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

  // 1. Filtered Recorded Payments Only (Pure DB History)
  const filteredRecordedPayments = (payments || []).filter(p => {
    if (fromDate && p.week_date < fromDate) return false;
    if (toDate && p.week_date > toDate) return false;
    if (statusFilter !== 'all' && p.status !== statusFilter) return false;
    return true;
  });

  // 2. Full Generated Weekly Schedule (Including Unmarked & Advance Weeks)
  const allWeeklyRecords = generateWeeklySchedule(contributor.start_date, payments, toDate);
  const filteredScheduleWeeks = allWeeklyRecords.filter(w => {
    if (fromDate && w.week_date < fromDate) return false;
    if (toDate && w.week_date > toDate) return false;
    if (statusFilter !== 'all' && w.status !== statusFilter) return false;
    return true;
  });

  const paidWeeksCount = payments.filter(p => p.status === 'paid').length;
  const missedWeeksCount = payments.filter(p => p.status === 'missed').length;
  const totalPaidAmount = payments
    .filter(p => p.status === 'paid')
    .reduce((sum, p) => {
      const amt = (p.amount !== null && p.amount !== undefined) ? (parseFloat(p.amount) || 0) : 3500;
      return sum + amt;
    }, 0);

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

          <div className="flex items-center space-x-2">
            <button
              onClick={fetchHistory}
              disabled={loading}
              className="text-slate-300 hover:text-white p-1 rounded-xs hover:bg-[#1c2541] transition-colors"
              title="Refresh Payment Records"
            >
              <RefreshCw className={`w-4 h-4 text-[#f59e0b] ${loading ? 'animate-spin' : ''}`} />
            </button>

            <button
              onClick={onClose}
              className="text-slate-300 hover:text-white p-1 rounded-xs hover:bg-[#1c2541] transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
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

          {/* Sub-Navigation Tabs */}
          <div className="flex items-center space-x-2 border-b border-[#cbd5e1] font-sans overflow-x-auto whitespace-nowrap scrollbar-none">
            <button
              onClick={() => setActiveModalTab('recorded')}
              className={`px-3.5 py-2 text-xs sm:text-sm font-bold rounded-t-sm transition-colors border-b-2 whitespace-nowrap ${
                activeModalTab === 'recorded'
                  ? 'border-[#d97706] text-[#d97706] bg-[#fffbeb]'
                  : 'border-transparent text-slate-600 hover:text-[#0b1c30]'
              }`}
            >
              <span>Recorded History ({filteredRecordedPayments.length})</span>
            </button>

            <button
              onClick={() => setActiveModalTab('schedule')}
              className={`px-3.5 py-2 text-xs sm:text-sm font-bold rounded-t-sm transition-colors border-b-2 whitespace-nowrap ${
                activeModalTab === 'schedule'
                  ? 'border-[#d97706] text-[#d97706] bg-[#fffbeb]'
                  : 'border-transparent text-slate-600 hover:text-[#0b1c30]'
              }`}
            >
              <span>Full Weekly Schedule & Advance Marking ({filteredScheduleWeeks.length})</span>
            </button>
          </div>

          {/* Filter Bar */}
          <div className="institutional-panel p-3 space-y-2">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-[#0b1c30] font-semibold uppercase flex items-center space-x-1.5">
                <Filter className="w-3.5 h-3.5 text-[#d97706]" />
                <span>Filter {activeModalTab === 'recorded' ? 'Recorded Entries' : 'Weekly Schedule'}</span>
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
                  {activeModalTab === 'schedule' && <option value="unmarked">Unmarked Only</option>}
                </select>
              </div>
            </div>
          </div>

          {/* TAB 1: Recorded Payment History Only */}
          {activeModalTab === 'recorded' && (
            <div className="institutional-panel overflow-hidden">
              <div className="px-4 py-2.5 bg-[#f8fafc] border-b border-[#cbd5e1] flex items-center justify-between">
                <span className="text-xs font-mono font-semibold uppercase text-[#0b1c30]">Recorded Payment Ledger</span>
                <span className="text-xs font-mono text-slate-500">{filteredRecordedPayments.length} entries</span>
              </div>

              {loading ? (
                <div className="p-8 text-center text-slate-500 text-xs font-mono flex items-center justify-center space-x-2">
                  <Loader2 className="w-4 h-4 animate-spin text-[#d97706]" />
                  <span>Loading payment records...</span>
                </div>
              ) : filteredRecordedPayments.length === 0 ? (
                <div className="p-8 text-center text-slate-500 text-xs font-mono space-y-2">
                  <p>No recorded payment entries match the selected filter criteria.</p>
                  <p className="text-[#d97706] font-bold">
                    Tip: Switch to the "Full Weekly Schedule" tab above to mark payments for any past or future week.
                  </p>
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
                        <th className="text-center">Toggle Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredRecordedPayments.map((p) => {
                        const isPaid = p.status === 'paid';
                        const isMissed = p.status === 'missed';
                        const isToggling = togglingWeek === p.week_date;

                        return (
                          <tr key={p.id || p.week_date}>
                            <td className="font-mono text-[#0b1c30] whitespace-nowrap font-bold">
                              Week of {formatDate(p.week_date)}
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
                            <td className="text-center whitespace-nowrap">
                              <div className="flex items-center justify-center space-x-2">
                                <button
                                  onClick={() => handleToggleWeek(p.week_date, isPaid ? 'missed' : 'paid')}
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
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: Full Weekly Schedule & Advance Marking */}
          {activeModalTab === 'schedule' && (
            <div className="institutional-panel overflow-hidden">
              <div className="px-4 py-2.5 bg-[#f8fafc] border-b border-[#cbd5e1] flex items-center justify-between">
                <span className="text-xs font-mono font-semibold uppercase text-[#0b1c30]">Full Weekly Schedule & Advance Marking</span>
                <span className="text-xs font-mono text-slate-500">{filteredScheduleWeeks.length} weeks displayed</span>
              </div>

              {loading ? (
                <div className="p-8 text-center text-slate-500 text-xs font-mono flex items-center justify-center space-x-2">
                  <Loader2 className="w-4 h-4 animate-spin text-[#d97706]" />
                  <span>Loading weekly schedule...</span>
                </div>
              ) : filteredScheduleWeeks.length === 0 ? (
                <div className="p-8 text-center text-slate-500 text-xs font-mono">
                  No weekly records match the selected filter criteria.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="institutional-table">
                    <thead>
                      <tr>
                        <th>Calendar Week Date</th>
                        <th>Current Status</th>
                        <th className="text-right">Amount</th>
                        <th>Date Paid</th>
                        <th className="text-center">Toggle Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredScheduleWeeks.map((p) => {
                        const isPaid = p.status === 'paid';
                        const isMissed = p.status === 'missed';
                        const isToggling = togglingWeek === p.week_date;

                        return (
                          <tr key={p.week_date}>
                            <td className="font-mono text-[#0b1c30] whitespace-nowrap font-bold">
                              Week of {formatDate(p.week_date)}
                            </td>
                            <td className="whitespace-nowrap">
                              {isPaid ? (
                                <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-xs text-xs font-mono font-bold bg-[#ecfdf5] text-[#059669] border border-[#a7f3d0]">
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  <span>PAID</span>
                                </span>
                              ) : isMissed ? (
                                <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-xs text-xs font-mono font-bold bg-[#fef2f2] text-[#ba1a1a] border border-[#fecaca]">
                                  <XCircle className="w-3.5 h-3.5" />
                                  <span>MISSED</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-xs text-xs font-mono font-semibold bg-[#f1f5f9] text-slate-500 border border-[#cbd5e1]">
                                  UNMARKED
                                </span>
                              )}
                            </td>
                            <td className={`font-mono tnum font-bold text-right whitespace-nowrap ${
                              isPaid ? 'text-[#059669]' : 'text-slate-400'
                            }`}>
                              {isPaid ? formatNaira(p.amount || 3500) : '₦0.00'}
                            </td>
                            <td className="font-mono text-xs text-slate-600 whitespace-nowrap">
                              {isPaid && p.date_paid ? formatDate(p.date_paid) : '—'}
                            </td>
                            <td className="text-center whitespace-nowrap">
                              <div className="flex items-center justify-center space-x-2">
                                {/* Mark Paid Button */}
                                <button
                                  onClick={() => handleToggleWeek(p.week_date, 'paid')}
                                  disabled={isToggling || isPaid}
                                  className={`px-3 py-1 text-xs font-bold font-mono rounded-xs border transition-colors shadow-xs flex items-center space-x-1 ${
                                    isPaid
                                      ? 'bg-[#059669] text-white border-[#059669] cursor-default opacity-90'
                                      : 'bg-[#ecfdf5] hover:bg-[#d1fae5] text-[#059669] border-[#a7f3d0]'
                                  }`}
                                >
                                  {isToggling ? (
                                    <Loader2 className="w-3 h-3 animate-spin" />
                                  ) : (
                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                  )}
                                  <span>{isPaid ? 'Paid ₦3,500' : 'Mark Paid (₦3,500)'}</span>
                                </button>

                                {/* Mark Missed Button */}
                                <button
                                  onClick={() => handleToggleWeek(p.week_date, 'missed')}
                                  disabled={isToggling || isMissed}
                                  className={`px-3 py-1 text-xs font-bold font-mono rounded-xs border transition-colors shadow-xs flex items-center space-x-1 ${
                                    isMissed
                                      ? 'bg-[#ba1a1a] text-white border-[#ba1a1a] cursor-default opacity-90'
                                      : 'bg-[#fef2f2] hover:bg-[#ffe4e6] text-[#ba1a1a] border-[#fecaca]'
                                  }`}
                                >
                                  {isToggling ? (
                                    <Loader2 className="w-3 h-3 animate-spin" />
                                  ) : (
                                    <XCircle className="w-3.5 h-3.5" />
                                  )}
                                  <span>{isMissed ? 'Missed' : 'Mark Missed'}</span>
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

