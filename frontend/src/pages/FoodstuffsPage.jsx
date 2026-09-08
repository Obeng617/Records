import React, { useState, useEffect, useCallback } from 'react';
import { PiggyBank, Search, UserPlus, CheckCircle2, XCircle, ChevronLeft, ChevronRight, Calendar, Users, Filter, Loader2, Trash2, Eye, RefreshCw } from 'lucide-react';
import { formatNaira, formatDate } from '../utils/formatters';
import { api } from '../services/api';

// Helper to get current calendar week Monday date (YYYY-MM-DD)
function getCurrentMonday() {
  const d = new Date();
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(d.setDate(diff));
  return monday.toISOString().split('T')[0];
}

// Add or subtract weeks from a Monday date string
function shiftWeekMonday(mondayStr, weeksCount) {
  const [year, month, day] = mondayStr.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  date.setDate(date.getDate() + (weeksCount * 7));
  return date.toISOString().split('T')[0];
}

export default function FoodstuffsPage({
  onOpenNewContributor,
  onSelectContributor,
  onDeleteContributorRequest,
  showToast
}) {
  const [activeSubTab, setActiveSubTab] = useState('weekly'); // 'weekly' | 'contributors'
  
  // Weekly Check-in State
  const [selectedWeekDate, setSelectedWeekDate] = useState(getCurrentMonday());
  const [weeklyRecords, setWeeklyRecords] = useState([]);
  const [loadingWeekly, setLoadingWeekly] = useState(false);
  const [weeklyFilter, setWeeklyFilter] = useState('all'); // 'all' | 'paid' | 'missed' | 'unmarked'
  const [togglingId, setTogglingId] = useState(null);

  // Contributors Directory State
  const [contributors, setContributors] = useState([]);
  const [loadingContributors, setLoadingContributors] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Stats State
  const [stats, setStats] = useState({
    grand_total: 0,
    contributors_count: 0,
    current_week_paid_count: 0,
    current_week_missed_count: 0,
    fixed_weekly_amount: 3500
  });

  // Load stats
  const loadStats = useCallback(async () => {
    try {
      const res = await api.getContributionStats();
      if (res.stats) setStats(res.stats);
    } catch (err) {
      console.error('Failed to load foodstuffs stats:', err);
    }
  }, []);

  // Load weekly check-in list
  const loadWeeklySheet = useCallback(async () => {
    setLoadingWeekly(true);
    try {
      const res = await api.getWeeklyContributions(selectedWeekDate);
      setWeeklyRecords(res.records || []);
    } catch (err) {
      console.error('Failed to load weekly sheet:', err);
      if (showToast) showToast('Failed to load weekly check-in sheet.', 'error');
    } finally {
      setLoadingWeekly(false);
    }
  }, [selectedWeekDate, showToast]);

  // Load contributors list
  const loadContributors = useCallback(async () => {
    setLoadingContributors(true);
    try {
      const res = await api.getContributors(searchTerm);
      setContributors(res.contributors || []);
    } catch (err) {
      console.error('Failed to load contributors:', err);
    } finally {
      setLoadingContributors(false);
    }
  }, [searchTerm]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  useEffect(() => {
    if (activeSubTab === 'weekly') {
      loadWeeklySheet();
    } else {
      loadContributors();
    }
  }, [activeSubTab, loadWeeklySheet, loadContributors]);

  // Toggle paid / missed status for a contributor on the weekly check-in sheet
  const handleToggleWeekly = async (record, targetStatus) => {
    setTogglingId(record.contributor_id);
    try {
      await api.toggleContribution(record.contributor_id, {
        week_date: selectedWeekDate,
        status: targetStatus,
        date_paid: targetStatus === 'paid' ? new Date().toISOString().split('T')[0] : null
      });

      // Update local state immediately for snappy response
      setWeeklyRecords(prev => prev.map(r => {
        if (r.contributor_id === record.contributor_id) {
          return {
            ...r,
            status: targetStatus,
            amount: targetStatus === 'paid' ? 3500 : 0
          };
        }
        return r;
      }));

      loadStats();
      if (showToast) {
        showToast(
          targetStatus === 'paid' 
            ? `${record.name} marked PAID (₦3,500)` 
            : `${record.name} marked MISSED (₦0)`
        );
      }
    } catch (err) {
      console.error('Failed to update weekly status:', err);
      if (showToast) showToast(err.message || 'Failed to update payment status.', 'error');
    } finally {
      setTogglingId(null);
    }
  };

  const filteredWeeklyRecords = weeklyRecords.filter(r => {
    if (weeklyFilter === 'all') return true;
    return r.status === weeklyFilter;
  });

  const filteredContributors = contributors.filter(c => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return c.name.toLowerCase().includes(term) || c.contributor_code.toLowerCase().includes(term);
  });

  const totalPaidThisWeek = weeklyRecords.filter(r => r.status === 'paid').length;
  const totalMissedThisWeek = weeklyRecords.filter(r => r.status === 'missed').length;

  return (
    <div className="space-y-6 pb-20">
      
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#e2e8f0] pb-5">
        <div>
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded bg-[#fef3c7] border border-[#f59e0b]/40 flex items-center justify-center text-[#d97706]">
              <PiggyBank className="w-5 h-5" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-[#0b1c30] tracking-tight font-sans">
              Foodstuffs Scheme Tracker
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-[#45464d] font-mono mt-1">
            Weekly contribution scheme — fixed ₦3,500 per contributor per week
          </p>
        </div>

        <button
          onClick={onOpenNewContributor}
          className="flex items-center space-x-2 px-4 py-2 text-xs sm:text-sm font-bold text-white bg-[#d97706] hover:bg-[#b45309] border border-[#f59e0b] rounded-sm transition-colors shadow-sm self-start sm:self-auto"
        >
          <UserPlus className="w-4 h-4" />
          <span>Register Contributor</span>
        </button>
      </div>

      {/* Aggregate Stats Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Grand Total */}
        <div className="institutional-card p-4 bg-[#ffffff] border-l-4 border-l-[#d97706] shadow-xs">
          <span className="text-[10px] font-mono uppercase text-[#45464d] font-semibold block">Total Scheme Collections</span>
          <div className="text-2xl font-bold font-mono tnum text-[#b45309] mt-1">
            {formatNaira(stats.grand_total || 0)}
          </div>
          <span className="text-[11px] font-mono text-slate-500 mt-1 block">
            {stats.total_paid_weeks || 0} total paid weeks
          </span>
        </div>

        {/* Total Members */}
        <div className="institutional-card p-4 bg-[#ffffff] border-l-4 border-l-[#0051d5] shadow-xs">
          <span className="text-[10px] font-mono uppercase text-[#45464d] font-semibold block">Active Contributors</span>
          <div className="text-2xl font-bold font-mono tnum text-[#0b1c30] mt-1">
            {stats.contributors_count || 0} Members
          </div>
          <span className="text-[11px] font-mono text-slate-500 mt-1 block">
            Auto-assigned FS-XXXX codes
          </span>
        </div>

        {/* Current Week Status */}
        <div className="institutional-card p-4 bg-[#ffffff] border-l-4 border-l-[#059669] shadow-xs">
          <span className="text-[10px] font-mono uppercase text-[#45464d] font-semibold block">This Week's Collections</span>
          <div className="text-2xl font-bold font-mono tnum text-[#059669] mt-1 flex items-center space-x-2">
            <span>{totalPaidThisWeek} / {weeklyRecords.length} Paid</span>
          </div>
          <span className="text-[11px] font-mono text-slate-500 mt-1 block">
            {totalMissedThisWeek} marked missed
          </span>
        </div>

        {/* Fixed Rate */}
        <div className="institutional-card p-4 bg-[#ffffff] border-l-4 border-l-slate-400 shadow-xs">
          <span className="text-[10px] font-mono uppercase text-[#45464d] font-semibold block">Fixed Weekly Amount</span>
          <div className="text-2xl font-bold font-mono tnum text-[#0b1c30] mt-1">
            ₦3,500.00
          </div>
          <span className="text-[11px] font-mono text-slate-500 mt-1 block">
            Standard rate per member
          </span>
        </div>

      </div>

      {/* Sub-Navigation Tabs */}
      <div className="flex items-center space-x-2 border-b border-[#cbd5e1] pb-1 font-sans">
        <button
          onClick={() => setActiveSubTab('weekly')}
          className={`px-4 py-2 text-xs sm:text-sm font-bold rounded-t-sm transition-colors border-b-2 ${
            activeSubTab === 'weekly'
              ? 'border-[#d97706] text-[#d97706] bg-[#fffbeb]'
              : 'border-transparent text-slate-600 hover:text-[#0b1c30]'
          }`}
        >
          <span>Weekly Rapid Check-in</span>
        </button>

        <button
          onClick={() => setActiveSubTab('contributors')}
          className={`px-4 py-2 text-xs sm:text-sm font-bold rounded-t-sm transition-colors border-b-2 ${
            activeSubTab === 'contributors'
              ? 'border-[#d97706] text-[#d97706] bg-[#fffbeb]'
              : 'border-transparent text-slate-600 hover:text-[#0b1c30]'
          }`}
        >
          <span>Contributors Directory ({stats.contributors_count || contributors.length})</span>
        </button>
      </div>

      {/* Tab 1: Weekly Rapid Check-in Sheet */}
      {activeSubTab === 'weekly' && (
        <div className="space-y-4">
          
          {/* Week Date Picker Navigation Bar */}
          <div className="institutional-card p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#ffffff]">
            
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setSelectedWeekDate(prev => shiftWeekMonday(prev, -1))}
                className="px-3 py-1.5 text-xs font-mono font-bold text-[#0b1c30] bg-[#f1f5f9] hover:bg-[#e2e8f0] border border-[#cbd5e1] rounded-sm transition-colors flex items-center space-x-1"
                title="Previous Calendar Week"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Prev Week</span>
              </button>

              <div className="flex items-center space-x-2 bg-[#fffbeb] border border-[#fef3c7] px-3 py-1.5 rounded-sm">
                <Calendar className="w-4 h-4 text-[#d97706]" />
                <span className="text-xs sm:text-sm font-mono font-bold text-[#b45309]">
                  Week of {formatDate(selectedWeekDate)}
                </span>
              </div>

              <button
                onClick={() => setSelectedWeekDate(prev => shiftWeekMonday(prev, 1))}
                className="px-3 py-1.5 text-xs font-mono font-bold text-[#0b1c30] bg-[#f1f5f9] hover:bg-[#e2e8f0] border border-[#cbd5e1] rounded-sm transition-colors flex items-center space-x-1"
                title="Next Calendar Week"
              >
                <span>Next Week</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Quick Filter by Status */}
            <div className="flex items-center space-x-2 text-xs font-mono">
              <span className="text-slate-500 font-semibold hidden sm:inline">Filter Status:</span>
              <div className="flex items-center space-x-1 bg-[#f1f5f9] p-1 rounded-sm border border-[#cbd5e1]">
                {['all', 'paid', 'missed', 'unmarked'].map((filterOption) => (
                  <button
                    key={filterOption}
                    onClick={() => setWeeklyFilter(filterOption)}
                    className={`px-2.5 py-1 text-xs font-mono font-bold rounded-xs capitalize transition-all ${
                      weeklyFilter === filterOption
                        ? 'bg-[#d97706] text-white shadow-xs'
                        : 'text-slate-600 hover:text-[#0b1c30]'
                    }`}
                  >
                    {filterOption}
                  </button>
                ))}
              </div>
            </div>

          </div>

          {/* Weekly Check-in Table */}
          <div className="institutional-panel overflow-hidden">
            {loadingWeekly ? (
              <div className="p-12 text-center text-slate-500 text-sm font-mono flex items-center justify-center space-x-2">
                <Loader2 className="w-4 h-4 animate-spin text-[#d97706]" />
                <span>Loading week {selectedWeekDate} check-in sheet...</span>
              </div>
            ) : filteredWeeklyRecords.length === 0 ? (
              <div className="p-12 text-center text-slate-500 text-sm font-mono">
                No contributors match the selected filter "{weeklyFilter}".
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="institutional-table">
                  <thead>
                    <tr>
                      <th>Contributor ID</th>
                      <th>Full Name</th>
                      <th>Joining Date</th>
                      <th>Status for Week</th>
                      <th className="text-right">Weekly Amount</th>
                      <th className="text-center">Quick Toggle Payment</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredWeeklyRecords.map((r) => {
                      const isPaid = r.status === 'paid';
                      const isMissed = r.status === 'missed';
                      const isToggling = togglingId === r.contributor_id;

                      return (
                        <tr key={r.contributor_id} className="group">
                          <td className="font-mono">
                            <span className="badge-code">{r.contributor_code}</span>
                          </td>
                          <td className="font-bold text-[#0b1c30] text-sm sm:text-base">
                            <button
                              onClick={() => onSelectContributor({ id: r.contributor_id, name: r.name, contributor_code: r.contributor_code, start_date: r.start_date })}
                              className="hover:text-[#d97706] hover:underline text-left transition-colors"
                            >
                              {r.name}
                            </button>
                          </td>
                          <td className="font-mono text-slate-500 text-xs">
                            {formatDate(r.start_date)}
                          </td>
                          <td>
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
                          <td className={`text-right font-mono tnum font-bold text-sm sm:text-base ${
                            isPaid ? 'text-[#059669]' : 'text-slate-400'
                          }`}>
                            {isPaid ? '₦3,500.00' : '₦0.00'}
                          </td>
                          <td>
                            <div className="flex items-center justify-center space-x-2">
                              {/* Mark Paid Button */}
                              <button
                                onClick={() => handleToggleWeekly(r, 'paid')}
                                disabled={isToggling || isPaid}
                                className={`px-3 py-1.5 text-xs font-bold font-mono rounded-xs border transition-colors shadow-xs flex items-center space-x-1.5 ${
                                  isPaid
                                    ? 'bg-[#059669] text-white border-[#059669] cursor-default opacity-90'
                                    : 'bg-[#ecfdf5] hover:bg-[#d1fae5] text-[#059669] border-[#a7f3d0]'
                                }`}
                              >
                                {isToggling ? (
                                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                ) : (
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                )}
                                <span>{isPaid ? 'Paid ₦3,500' : 'Mark Paid (₦3,500)'}</span>
                              </button>

                              {/* Mark Missed Button */}
                              <button
                                onClick={() => handleToggleWeekly(r, 'missed')}
                                disabled={isToggling || isMissed}
                                className={`px-3 py-1.5 text-xs font-bold font-mono rounded-xs border transition-colors shadow-xs flex items-center space-x-1.5 ${
                                  isMissed
                                    ? 'bg-[#ba1a1a] text-white border-[#ba1a1a] cursor-default opacity-90'
                                    : 'bg-[#fef2f2] hover:bg-[#ffe4e6] text-[#ba1a1a] border-[#fecaca]'
                                }`}
                              >
                                {isToggling ? (
                                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
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

        </div>
      )}

      {/* Tab 2: Contributors Directory */}
      {activeSubTab === 'contributors' && (
        <div className="space-y-4">
          
          {/* Search & Actions Bar */}
          <div className="institutional-card p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#ffffff]">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search contributor by name or FS code..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-[#ffffff] border border-[#cbd5e1] rounded-sm text-sm text-[#0b1c30] placeholder-slate-400 focus:outline-none focus:border-[#d97706] shadow-sm"
              />
            </div>

            <div className="flex items-center space-x-2 text-xs font-mono text-[#45464d]">
              <span>Total Members:</span>
              <span className="font-bold text-[#0b1c30] bg-[#fffbeb] px-2.5 py-1 rounded-xs border border-[#fef3c7]">
                {filteredContributors.length}
              </span>
            </div>
          </div>

          {/* Directory Table */}
          <div className="institutional-panel overflow-hidden">
            {loadingContributors ? (
              <div className="p-12 text-center text-slate-500 text-sm font-mono flex items-center justify-center space-x-2">
                <Loader2 className="w-4 h-4 animate-spin text-[#d97706]" />
                <span>Loading contributors directory...</span>
              </div>
            ) : filteredContributors.length === 0 ? (
              <div className="p-12 text-center text-slate-500 text-sm font-mono">
                No contributors match your search "{searchTerm}".
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="institutional-table">
                  <thead>
                    <tr>
                      <th>Contributor Code</th>
                      <th>Account Name</th>
                      <th>Phone / Contact</th>
                      <th className="text-right">Total Contributed</th>
                      <th>Joined Date</th>
                      <th className="text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredContributors.map((c) => (
                      <tr key={c.id} className="group">
                        <td className="font-mono">
                          <span className="badge-code">{c.contributor_code}</span>
                        </td>
                        <td className="font-bold text-[#0b1c30] text-sm sm:text-base">
                          <button
                            onClick={() => onSelectContributor(c)}
                            className="hover:text-[#d97706] hover:underline text-left transition-colors"
                          >
                            {c.name}
                          </button>
                        </td>
                        <td className="font-mono text-slate-600 text-xs sm:text-sm">
                          {c.phone || '—'}
                        </td>
                        <td className="text-right font-mono tnum font-bold text-[#b45309] text-sm sm:text-base">
                          {formatNaira(c.total_contributed || 0)}
                        </td>
                        <td className="font-mono text-slate-500 text-xs sm:text-sm">
                          {formatDate(c.start_date)}
                        </td>
                        <td>
                          <div className="flex items-center justify-center space-x-2">
                            <button
                              onClick={() => onSelectContributor(c)}
                              className="px-3 py-1.5 text-xs font-bold text-[#b45309] bg-[#fffbeb] hover:bg-[#fef3c7] border border-[#fde68a] rounded-xs flex items-center space-x-1"
                              title="View Member History"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>View History</span>
                            </button>

                            <button
                              onClick={() => onDeleteContributorRequest(c)}
                              className="p-1.5 text-slate-400 hover:text-[#ba1a1a] hover:bg-[#fef2f2] rounded-xs transition-colors"
                              title="Delete Contributor Account"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>
      )}

    </div>
  );
}
