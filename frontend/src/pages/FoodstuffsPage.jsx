import React, { useState, useEffect, useCallback } from 'react';
import { PiggyBank, Search, CheckCircle2, XCircle, ChevronLeft, ChevronRight, Calendar, Users, Filter, Loader2, Trash2, Eye, RefreshCw, Zap, CheckSquare, Square, AlertCircle, Layers } from 'lucide-react';
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
  const [weeklySearchTerm, setWeeklySearchTerm] = useState('');

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

  const [refreshing, setRefreshing] = useState(false);

  // Manual refresh handler
  const handleManualRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        loadStats(),
        activeSubTab === 'weekly' ? loadWeeklySheet() : loadContributors()
      ]);
      if (showToast) showToast('Foodstuffs scheme data refreshed!');
    } catch (err) {
      console.error('Refresh failed:', err);
    } finally {
      setRefreshing(false);
    }
  };

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

  // Batch / Multi-Select State
  const [selectedIds, setSelectedIds] = useState([]);
  const [batchModal, setBatchModal] = useState(null);
  const [submittingBatch, setSubmittingBatch] = useState(false);

  // Toggle selection for a single contributor row
  const toggleSelectOne = (id) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  // Open batch modal for Global Mark action
  const openGlobalMarkModal = (type) => {
    let targetIds = [];
    let title = '';
    let status = 'paid';
    let countDescription = '';

    if (type === 'unmarked_paid') {
      const unmarkedRecords = weeklyRecords.filter(r => r.status === 'unmarked');
      targetIds = unmarkedRecords.map(r => r.contributor_id);
      status = 'paid';
      title = 'Global Mark All Unmarked as Paid';
      countDescription = `${targetIds.length} currently unmarked contributors`;
    } else if (type === 'filtered_paid') {
      targetIds = filteredWeeklyRecords.map(r => r.contributor_id);
      status = 'paid';
      title = 'Global Mark Filtered as Paid';
      countDescription = `${targetIds.length} contributors matching search/filter`;
    } else if (type === 'filtered_missed') {
      targetIds = filteredWeeklyRecords.map(r => r.contributor_id);
      status = 'missed';
      title = 'Global Mark Filtered as Missed';
      countDescription = `${targetIds.length} contributors matching search/filter`;
    } else if (type === 'selected_paid') {
      targetIds = selectedIds;
      status = 'paid';
      title = 'Mark Selected Contributors as Paid';
      countDescription = `${targetIds.length} manually selected contributors`;
    } else if (type === 'selected_missed') {
      targetIds = selectedIds;
      status = 'missed';
      title = 'Mark Selected Contributors as Missed';
      countDescription = `${targetIds.length} manually selected contributors`;
    }

    if (targetIds.length === 0) {
      if (showToast) showToast('No contributors match this batch action.', 'error');
      return;
    }

    setBatchModal({
      title,
      status,
      targetIds,
      countDescription,
      count: targetIds.length
    });
  };

  // Confirm and execute batch update
  const handleConfirmBatchMark = async () => {
    if (!batchModal) return;
    setSubmittingBatch(true);
    try {
      const res = await api.batchToggleContributions({
        week_date: selectedWeekDate,
        status: batchModal.status,
        contributor_ids: batchModal.targetIds
      });

      if (showToast) {
        showToast(
          batchModal.status === 'paid'
            ? `Successfully marked ${res.count} contributors as PAID (₦3,500)!`
            : `Successfully marked ${res.count} contributors as MISSED.`
        );
      }

      setBatchModal(null);
      setSelectedIds([]);
      await Promise.all([loadWeeklySheet(), loadStats()]);
    } catch (err) {
      console.error('Batch update failed:', err);
      if (showToast) showToast(err.message || 'Batch update failed.', 'error');
    } finally {
      setSubmittingBatch(false);
    }
  };

  // Display Limit States (Keeps layout compact without overflowing)
  const [showAllWeekly, setShowAllWeekly] = useState(false);
  const [showAllContributors, setShowAllContributors] = useState(false);
  const DEFAULT_ROW_LIMIT = 5;

  const filteredWeeklyRecords = weeklyRecords.filter(r => {
    if (weeklyFilter !== 'all' && r.status !== weeklyFilter) return false;
    if (weeklySearchTerm) {
      const term = weeklySearchTerm.toLowerCase();
      return r.name.toLowerCase().includes(term) || (r.contributor_code && r.contributor_code.toLowerCase().includes(term));
    }
    return true;
  });

  const displayedWeeklyRecords = showAllWeekly 
    ? filteredWeeklyRecords 
    : filteredWeeklyRecords.slice(0, DEFAULT_ROW_LIMIT);

  const filteredContributors = contributors.filter(c => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return c.name.toLowerCase().includes(term) || c.contributor_code.toLowerCase().includes(term);
  });

  const displayedContributors = showAllContributors 
    ? filteredContributors 
    : filteredContributors.slice(0, DEFAULT_ROW_LIMIT);

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

        {/* Refresh Data Button with Animated Loader */}
        <div className="flex items-center space-x-2 self-start sm:self-auto">
          <button
            onClick={handleManualRefresh}
            disabled={refreshing || loadingWeekly || loadingContributors}
            className="flex items-center space-x-1.5 px-3.5 py-2 text-xs font-mono font-bold text-[#0b1c30] bg-[#ffffff] hover:bg-[#f1f5f9] border border-[#cbd5e1] rounded-sm transition-colors shadow-sm"
            title="Force refresh foodstuffs database records"
          >
            <RefreshCw className={`w-4 h-4 text-[#d97706] ${refreshing || loadingWeekly || loadingContributors ? 'animate-spin' : ''}`} />
            <span>{refreshing ? 'Refreshing...' : 'Refresh Data'}</span>
          </button>
        </div>
      </div>

      {/* Aggregate Stats Cards (Matching Dashboard Card Design & Sizing) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5 mb-6">
        
        {/* Total Scheme Collections */}
        <div className="institutional-card p-3.5 sm:p-5 relative overflow-hidden group">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] sm:text-xs font-mono font-bold uppercase tracking-wider text-[#45464d] truncate">
              Total Collections
            </span>
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded bg-[#fffbeb] text-[#d97706] border border-[#fde68a] flex items-center justify-center shrink-0">
              <PiggyBank className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <div className="text-base xs:text-lg sm:text-3xl font-bold font-mono tnum text-[#b45309] tracking-tight my-0.5 truncate">
            {formatNaira(stats.grand_total || 0)}
          </div>
          <div className="flex items-center justify-between mt-2 pt-2 border-t border-[#e2e8f0] text-[10px] sm:text-xs text-[#45464d]">
            <span className="truncate">Total scheme funds</span>
            <span className="font-mono text-[#d97706] font-bold shrink-0">{stats.total_paid_weeks || 0} wks</span>
          </div>
        </div>

        {/* Active Contributors */}
        <div className="institutional-card p-3.5 sm:p-5 relative overflow-hidden group">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] sm:text-xs font-mono font-bold uppercase tracking-wider text-[#45464d] truncate">
              Contributors
            </span>
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded bg-[#eff4ff] text-[#0051d5] border border-[#bfdbfe] flex items-center justify-center shrink-0">
              <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <div className="text-base xs:text-lg sm:text-3xl font-bold font-mono tnum text-[#0b1c30] tracking-tight my-0.5 truncate">
            {stats.contributors_count || 0}
          </div>
          <div className="flex items-center justify-between mt-2 pt-2 border-t border-[#e2e8f0] text-[10px] sm:text-xs text-[#45464d]">
            <span className="truncate">Active members</span>
            <span className="font-mono text-[#0051d5] font-bold shrink-0">FS-XXXX</span>
          </div>
        </div>

        {/* Current Week Collections */}
        <div className="institutional-card p-3.5 sm:p-5 relative overflow-hidden group">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] sm:text-xs font-mono font-bold uppercase tracking-wider text-[#45464d] truncate">
              This Week
            </span>
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded bg-[#ecfdf5] text-[#059669] border border-[#a7f3d0] flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <div className="text-base xs:text-lg sm:text-3xl font-bold font-mono tnum text-[#059669] tracking-tight my-0.5 truncate">
            {totalPaidThisWeek} / {weeklyRecords.length}
          </div>
          <div className="flex items-center justify-between mt-2 pt-2 border-t border-[#e2e8f0] text-[10px] sm:text-xs text-[#45464d]">
            <span className="truncate">Collections paid</span>
            <span className="font-mono text-[#059669] font-bold shrink-0">{totalMissedThisWeek} missed</span>
          </div>
        </div>

        {/* Fixed Weekly Rate */}
        <div className="institutional-card p-3.5 sm:p-5 relative overflow-hidden group">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] sm:text-xs font-mono font-bold uppercase tracking-wider text-[#45464d] truncate">
              Weekly Rate
            </span>
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded bg-[#f1f5f9] text-slate-600 border border-[#cbd5e1] flex items-center justify-center shrink-0">
              <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <div className="text-base xs:text-lg sm:text-3xl font-bold font-mono tnum text-[#0b1c30] tracking-tight my-0.5 truncate">
            ₦3,500
          </div>
          <div className="flex items-center justify-between mt-2 pt-2 border-t border-[#e2e8f0] text-[10px] sm:text-xs text-[#45464d]">
            <span className="truncate">Fixed weekly rate</span>
            <span className="font-mono text-slate-500 font-bold shrink-0">PER MEMBER</span>
          </div>
        </div>

      </div>

      {/* Sub-Navigation Tabs */}
      <div className="flex items-center space-x-2 border-b border-[#cbd5e1] pb-1 font-sans overflow-x-auto whitespace-nowrap scrollbar-none">
        <button
          onClick={() => setActiveSubTab('weekly')}
          className={`px-4 py-2 text-xs sm:text-sm font-bold rounded-t-sm transition-colors border-b-2 whitespace-nowrap ${
            activeSubTab === 'weekly'
              ? 'border-[#d97706] text-[#d97706] bg-[#fffbeb]'
              : 'border-transparent text-slate-600 hover:text-[#0b1c30]'
          }`}
        >
          <span>Weekly Rapid Check-in</span>
        </button>

        <button
          onClick={() => setActiveSubTab('contributors')}
          className={`px-4 py-2 text-xs sm:text-sm font-bold rounded-t-sm transition-colors border-b-2 whitespace-nowrap ${
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
          
          {/* Week Date Picker & Filter Control Bar (Mobile Optimized) */}
          <div className="institutional-card p-3 sm:p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-[#ffffff]">
            
            {/* Week Date Stepper */}
            <div className="flex items-center justify-between sm:justify-start space-x-1.5 sm:space-x-2 w-full md:w-auto">
              <button
                onClick={() => setSelectedWeekDate(prev => shiftWeekMonday(prev, -1))}
                className="px-2.5 sm:px-3 py-1.5 text-xs font-mono font-bold text-[#0b1c30] bg-[#f1f5f9] hover:bg-[#e2e8f0] border border-[#cbd5e1] rounded-sm transition-colors flex items-center space-x-1 shrink-0 whitespace-nowrap shadow-xs"
                title="Previous Calendar Week"
              >
                <ChevronLeft className="w-4 h-4" />
                <span className="hidden sm:inline">Prev Week</span>
              </button>

              <div className="flex items-center justify-center space-x-1.5 bg-[#fffbeb] border border-[#fef3c7] px-2.5 sm:px-3 py-1.5 rounded-sm shrink-0 whitespace-nowrap flex-1 sm:flex-initial">
                <Calendar className="w-4 h-4 text-[#d97706] shrink-0" />
                <span className="text-xs sm:text-sm font-mono font-bold text-[#b45309] whitespace-nowrap">
                  Week of {formatDate(selectedWeekDate)}
                </span>
              </div>

              <button
                onClick={() => setSelectedWeekDate(prev => shiftWeekMonday(prev, 1))}
                className="px-2.5 sm:px-3 py-1.5 text-xs font-mono font-bold text-[#0b1c30] bg-[#f1f5f9] hover:bg-[#e2e8f0] border border-[#cbd5e1] rounded-sm transition-colors flex items-center space-x-1 shrink-0 whitespace-nowrap shadow-xs"
                title="Next Calendar Week"
              >
                <span className="hidden sm:inline">Next Week</span>
                <ChevronRight className="w-4 h-4" />
              </button>

              <button
                onClick={loadWeeklySheet}
                disabled={loadingWeekly}
                className="p-1.5 text-xs text-slate-600 hover:text-[#d97706] bg-[#f1f5f9] hover:bg-[#fffbeb] border border-[#cbd5e1] rounded-sm transition-colors shadow-xs shrink-0"
                title="Reload Weekly Check-in Sheet"
              >
                <RefreshCw className={`w-4 h-4 ${loadingWeekly ? 'animate-spin text-[#d97706]' : ''}`} />
              </button>
            </div>

            {/* Quick Filter Status Segmented Control */}
            <div className="flex items-center space-x-2 text-xs font-mono w-full md:w-auto">
              <span className="text-slate-500 font-semibold hidden md:inline shrink-0">Filter Status:</span>
              <div className="grid grid-cols-4 sm:flex items-center gap-1 bg-[#f1f5f9] p-1 rounded-sm border border-[#cbd5e1] w-full md:w-auto">
                {['all', 'paid', 'missed', 'unmarked'].map((filterOption) => (
                  <button
                    key={filterOption}
                    onClick={() => setWeeklyFilter(filterOption)}
                    className={`px-2 sm:px-2.5 py-1 text-xs font-mono font-bold rounded-xs capitalize transition-all text-center whitespace-nowrap ${
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

          {/* Weekly Search Bar (Sticky) */}
          <div className="sticky top-14 sm:top-[72px] z-30 bg-white/95 backdrop-blur-sm border border-[#cbd5e1] rounded-sm p-3 shadow-md">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search contributor by name or FS code..."
                value={weeklySearchTerm}
                onChange={(e) => setWeeklySearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-[#ffffff] border border-[#cbd5e1] rounded-sm text-sm text-[#0b1c30] placeholder-slate-400 focus:outline-none focus:border-[#d97706] shadow-sm"
              />
            </div>
          </div>

          {/* Multi-Select Floating Executive Action Bar */}
          {selectedIds.length > 0 && (
            <div className="sticky top-[125px] sm:top-[132px] z-30 bg-[#0b1c30]/95 backdrop-blur-md text-white p-3 sm:px-4 rounded-md shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-3 border border-amber-500/40 animate-fade-in">
              <div className="flex items-center space-x-2.5 text-xs sm:text-sm font-sans">
                <CheckSquare className="w-4 h-4 text-amber-400 shrink-0" />
                <span className="flex items-center space-x-1.5">
                  <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 font-mono font-bold text-xs">
                    {selectedIds.length}
                  </span>
                  <span className="font-semibold text-slate-200">
                    {selectedIds.length === 1 ? 'Contributor Selected' : 'Contributors Selected'}
                  </span>
                </span>
              </div>

              <div className="flex items-center space-x-2 w-full sm:w-auto shrink-0">
                <button
                  onClick={() => openGlobalMarkModal('selected_paid')}
                  className="flex-1 sm:flex-initial px-3.5 py-1.5 text-xs sm:text-sm font-semibold font-sans bg-[#059669] hover:bg-[#10b981] text-white rounded-xs transition-all shadow-sm flex items-center justify-center space-x-1.5 whitespace-nowrap active:scale-95 cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-200 shrink-0" />
                  <span>Mark Paid (₦3,500)</span>
                </button>

                <button
                  onClick={() => openGlobalMarkModal('selected_missed')}
                  className="flex-1 sm:flex-initial px-3.5 py-1.5 text-xs sm:text-sm font-semibold font-sans bg-[#ba1a1a] hover:bg-[#dc2626] text-white rounded-xs transition-all shadow-sm flex items-center justify-center space-x-1.5 whitespace-nowrap active:scale-95 cursor-pointer"
                >
                  <XCircle className="w-4 h-4 text-rose-200 shrink-0" />
                  <span>Mark Missed</span>
                </button>

                <button
                  onClick={() => setSelectedIds([])}
                  className="px-3 py-1.5 text-xs font-mono font-medium text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700 border border-slate-700 rounded-xs transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  Clear
                </button>
              </div>
            </div>
          )}

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
                      <th className="w-10 text-center">
                        <input
                          type="checkbox"
                          checked={
                            displayedWeeklyRecords.length > 0 &&
                            displayedWeeklyRecords.every(r => selectedIds.includes(r.contributor_id))
                          }
                          onChange={() => {
                            const visibleIds = displayedWeeklyRecords.map(r => r.contributor_id);
                            const allSelected = visibleIds.length > 0 && visibleIds.every(id => selectedIds.includes(id));
                            if (allSelected) {
                              setSelectedIds(prev => prev.filter(id => !visibleIds.includes(id)));
                            } else {
                              setSelectedIds(prev => Array.from(new Set([...prev, ...visibleIds])));
                            }
                          }}
                          className="w-4 h-4 rounded-xs border-slate-300 text-[#d97706] focus:ring-[#d97706] cursor-pointer"
                          title="Select / Deselect all visible rows"
                        />
                      </th>
                      <th>Contributor ID</th>
                      <th>Full Name</th>
                      <th>Joining Date</th>
                      <th>Status for Week</th>
                      <th className="text-right">Weekly Amount</th>
                      <th className="text-center">Quick Toggle Payment</th>
                    </tr>
                  </thead>
                  <tbody>
                    {displayedWeeklyRecords.map((r) => {
                      const isPaid = r.status === 'paid';
                      const isMissed = r.status === 'missed';
                      const isToggling = togglingId === r.contributor_id;
                      const isSelected = selectedIds.includes(r.contributor_id);

                      return (
                        <tr key={r.contributor_id} className={`group ${isSelected ? 'bg-[#fffbeb]/80' : ''}`}>
                          <td className="text-center">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleSelectOne(r.contributor_id)}
                              className="w-4 h-4 rounded-xs border-slate-300 text-[#d97706] focus:ring-[#d97706] cursor-pointer"
                            />
                          </td>
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

            {/* View All / Show Less Footer Bar */}
            {filteredWeeklyRecords.length > DEFAULT_ROW_LIMIT && (
              <div className="px-4 py-3 bg-[#f8fafc] border-t border-[#cbd5e1] flex flex-col sm:flex-row items-center justify-between gap-2 text-xs font-mono">
                <span className="text-slate-500 font-semibold">
                  Showing {displayedWeeklyRecords.length} of {filteredWeeklyRecords.length} contributors for week {formatDate(selectedWeekDate)}
                </span>
                <button
                  onClick={() => setShowAllWeekly(!showAllWeekly)}
                  className="w-full sm:w-auto px-4 py-1.5 text-xs font-bold font-mono text-[#b45309] bg-[#fffbeb] hover:bg-[#fef3c7] border border-[#fde68a] rounded-xs transition-colors flex items-center justify-center space-x-1.5 shadow-xs"
                >
                  <span>{showAllWeekly ? 'Show Less' : `View All (${filteredWeeklyRecords.length} Contributors)`}</span>
                  <ChevronRight className={`w-3.5 h-3.5 transition-transform ${showAllWeekly ? '-rotate-90' : 'rotate-90'}`} />
                </button>
              </div>
            )}
          </div>

        </div>
      )}

      {/* Tab 2: Contributors Directory */}
      {activeSubTab === 'contributors' && (
        <div className="space-y-4">
          
          {/* Search & Actions Bar (Sticky) */}
          <div className="institutional-card p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white/95 backdrop-blur-sm sticky top-14 sm:top-[72px] z-30 shadow-md">
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
            <>
            {/* Desktop Directory Table View (>= 768px) */}
            <div className="hidden md:block overflow-x-auto">
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
                  {displayedContributors.map((c) => (
                    <tr key={c.id} className="group">
                      <td className="font-mono whitespace-nowrap">
                        <span className="badge-code">{c.contributor_code}</span>
                      </td>
                      <td className="font-bold text-[#0b1c30] text-sm sm:text-base whitespace-nowrap">
                        <button
                          onClick={() => onSelectContributor(c)}
                          className="hover:text-[#d97706] hover:underline text-left transition-colors"
                        >
                          {c.name}
                        </button>
                      </td>
                      <td className="font-mono text-slate-600 text-xs sm:text-sm whitespace-nowrap">
                        {c.phone || '—'}
                      </td>
                      <td className="text-right font-mono tnum font-bold text-[#b45309] text-sm sm:text-base whitespace-nowrap">
                        {formatNaira(c.total_contributed || 0)}
                      </td>
                      <td className="font-mono text-slate-500 text-xs sm:text-sm whitespace-nowrap">
                        {formatDate(c.start_date)}
                      </td>
                      <td className="whitespace-nowrap">
                        <div className="flex items-center justify-center space-x-2 whitespace-nowrap">
                          <button
                            onClick={() => onSelectContributor(c)}
                            className="px-3 py-1.5 text-xs font-bold text-[#b45309] bg-[#fffbeb] hover:bg-[#fef3c7] border border-[#fde68a] rounded-xs flex items-center space-x-1 whitespace-nowrap shrink-0"
                            title="View Member History & Mark Payments"
                          >
                            <Eye className="w-3.5 h-3.5 shrink-0" />
                            <span className="whitespace-nowrap">View & Mark History</span>
                          </button>

                          <button
                            onClick={() => onDeleteContributorRequest(c)}
                            className="p-1.5 text-slate-400 hover:text-[#ba1a1a] hover:bg-[#fef2f2] rounded-xs transition-colors shrink-0"
                            title="Delete Contributor Account"
                          >
                            <Trash2 className="w-4 h-4 shrink-0" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Stacked Card View (< 768px) */}
            <div className="md:hidden divide-y divide-[#f1f5f9]">
              {displayedContributors.map((c) => (
                <div key={c.id} className="p-4 space-y-3 bg-[#ffffff]">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="badge-code mb-1 inline-block">{c.contributor_code}</span>
                      <h3
                        onClick={() => onSelectContributor(c)}
                        className="font-bold text-[#0b1c30] text-base hover:text-[#d97706] cursor-pointer"
                      >
                        {c.name}
                      </h3>
                      <p className="text-xs font-mono text-slate-500 mt-0.5">
                        Joined: {formatDate(c.start_date)} • {c.phone || 'No phone'}
                      </p>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] uppercase font-mono text-slate-500 block font-semibold">Total Balance</span>
                      <span className="font-mono tnum font-bold text-base text-[#b45309]">
                        {formatNaira(c.total_contributed || 0)}
                      </span>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-[#f1f5f9] flex items-center space-x-2 text-xs">
                    <button
                      onClick={() => onSelectContributor(c)}
                      className="flex-1 py-2 px-3 text-[#b45309] font-bold bg-[#fffbeb] hover:bg-[#fef3c7] border border-[#fde68a] rounded-sm flex items-center justify-center space-x-1.5 transition-colors whitespace-nowrap shadow-xs"
                    >
                      <Eye className="w-4 h-4 shrink-0" />
                      <span>View & Mark History</span>
                    </button>

                    <button
                      onClick={() => onDeleteContributorRequest(c)}
                      className="p-2 text-slate-400 hover:text-[#ba1a1a] hover:bg-[#fef2f2] border border-[#cbd5e1] rounded-sm transition-colors shrink-0"
                      title="Delete Contributor Account"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
            </>
            )}

            {/* View All / Show Less Footer Bar */}
            {filteredContributors.length > DEFAULT_ROW_LIMIT && (
              <div className="px-4 py-3 bg-[#f8fafc] border-t border-[#cbd5e1] flex flex-col sm:flex-row items-center justify-between gap-2 text-xs font-mono">
                <span className="text-slate-500 font-semibold">
                  Showing {displayedContributors.length} of {filteredContributors.length} directory members
                </span>
                <button
                  onClick={() => setShowAllContributors(!showAllContributors)}
                  className="w-full sm:w-auto px-4 py-1.5 text-xs font-bold font-mono text-[#b45309] bg-[#fffbeb] hover:bg-[#fef3c7] border border-[#fde68a] rounded-xs transition-colors flex items-center justify-center space-x-1.5 shadow-xs"
                >
                  <span>{showAllContributors ? 'Show Less' : `View All (${filteredContributors.length} Members)`}</span>
                  <ChevronRight className={`w-3.5 h-3.5 transition-transform ${showAllContributors ? '-rotate-90' : 'rotate-90'}`} />
                </button>
              </div>
            )}
          </div>

        </div>
      )}

      {/* Batch Confirmation Modal */}
      {batchModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-sm border border-[#cbd5e1] max-w-md w-full p-5 space-y-4 shadow-2xl animate-scale-up">
            <div className="flex items-center space-x-3 text-[#d97706]">
              <div className="w-10 h-10 rounded-full bg-[#fffbeb] border border-[#fde68a] flex items-center justify-center shrink-0">
                <Zap className="w-5 h-5 text-[#d97706]" />
              </div>
              <div>
                <h3 className="font-bold text-base text-[#0b1c30]">
                  {batchModal.title}
                </h3>
                <p className="text-xs text-slate-500 font-mono">
                  Batch operation confirmation
                </p>
              </div>
            </div>

            <div className="p-3 bg-[#f8fafc] border border-[#e2e8f0] rounded-xs text-xs font-mono space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500">Week Date:</span>
                <span className="font-bold text-[#0b1c30]">{formatDate(selectedWeekDate)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Target Records:</span>
                <span className="font-bold text-[#0b1c30]">{batchModal.countDescription}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Action:</span>
                <span className={`font-bold ${batchModal.status === 'paid' ? 'text-[#059669]' : 'text-[#ba1a1a]'}`}>
                  Mark as {batchModal.status.toUpperCase()} {batchModal.status === 'paid' ? '(₦3,500.00 each)' : '(₦0.00)'}
                </span>
              </div>
              {batchModal.status === 'paid' && (
                <div className="flex justify-between pt-2 border-t border-[#cbd5e1] text-sm">
                  <span className="text-[#0b1c30] font-bold">Total Collection Added:</span>
                  <span className="font-bold text-[#059669]">{formatNaira(batchModal.count * 3500)}</span>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end space-x-3 pt-2">
              <button
                onClick={() => setBatchModal(null)}
                disabled={submittingBatch}
                className="px-4 py-2 text-xs font-semibold font-sans text-slate-700 hover:text-slate-900 bg-[#f1f5f9] hover:bg-[#e2e8f0] border border-[#cbd5e1] rounded-xs transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmBatchMark}
                disabled={submittingBatch}
                className={`px-4 py-2 text-xs font-semibold font-sans text-white rounded-xs transition-all shadow-xs flex items-center space-x-1.5 whitespace-nowrap cursor-pointer ${
                  batchModal.status === 'paid'
                    ? 'bg-[#059669] hover:bg-[#047857]'
                    : 'bg-[#ba1a1a] hover:bg-[#991b1b]'
                }`}
              >
                {submittingBatch ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="w-4 h-4" />
                )}
                <span>{submittingBatch ? 'Processing...' : `Confirm Mark (${batchModal.count} Contributors)`}</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
