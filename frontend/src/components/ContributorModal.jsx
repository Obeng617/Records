import React, { useState, useEffect } from 'react';
import { X, UserPlus, Info, Loader2 } from 'lucide-react';

export default function ContributorModal({
  isOpen,
  onClose,
  onSubmit,
  submitting
}) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [startDate, setStartDate] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (isOpen) {
      setName('');
      setPhone('');
      setStartDate(new Date().toISOString().split('T')[0]);
      setNotes('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    onSubmit({
      name: name.trim(),
      phone: phone.trim(),
      start_date: startDate,
      notes: notes.trim()
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-[#0b1c30]/50 backdrop-blur-sm animate-fade-in">
      <div className="institutional-card w-full max-w-md bg-[#ffffff] overflow-hidden border border-[#cbd5e1] shadow-2xl">
        
        {/* Modal Header */}
        <div className="px-5 py-4 bg-[#0b132b] text-white flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-7 h-7 rounded bg-[#1c2541] border border-[#f59e0b]/40 flex items-center justify-center text-[#f59e0b]">
              <UserPlus className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-base font-sans">Register Contributor</h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-300 hover:text-white p-1 rounded-xs hover:bg-[#1c2541] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-[#0b1c30]">
          
          <div className="p-3 bg-[#fffbeb] border border-[#fef3c7] rounded-sm text-xs text-[#92400e] flex items-start space-x-2">
            <Info className="w-4 h-4 shrink-0 mt-0.5 text-[#d97706]" />
            <span>
              Fixed Weekly Contribution: <strong>₦3,500 / week</strong> for all members. Auto-generated ID format: <strong>FS-0001</strong>.
            </span>
          </div>

          {/* Full Name */}
          <div>
            <label className="block text-xs font-mono font-bold uppercase text-[#45464d] mb-1">
              Contributor Name <span className="text-[#ba1a1a]">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Samuel Adewale"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2 bg-[#ffffff] border border-[#cbd5e1] rounded-sm text-sm text-[#0b1c30] placeholder-slate-400 focus:outline-none focus:border-[#d97706] shadow-sm font-medium"
            />
          </div>

          {/* Phone */}
          <div>
            <label className="block text-xs font-mono font-bold uppercase text-[#45464d] mb-1">
              Phone Number <span className="text-slate-400 font-normal">(Optional)</span>
            </label>
            <input
              type="tel"
              placeholder="e.g. 08012345678"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full px-3.5 py-2 bg-[#ffffff] border border-[#cbd5e1] rounded-sm text-sm text-[#0b1c30] placeholder-slate-400 focus:outline-none focus:border-[#d97706] shadow-sm font-mono"
            />
          </div>

          {/* Scheme Start Date */}
          <div>
            <label className="block text-xs font-mono font-bold uppercase text-[#45464d] mb-1">
              Scheme Joining Date <span className="text-[#ba1a1a]">*</span>
            </label>
            <input
              type="date"
              required
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3.5 py-2 bg-[#ffffff] border border-[#cbd5e1] rounded-sm text-sm text-[#0b1c30] font-mono font-bold focus:outline-none focus:border-[#d97706] shadow-sm"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-mono font-bold uppercase text-[#45464d] mb-1">
              Notes / Reference <span className="text-slate-400 font-normal">(Optional)</span>
            </label>
            <input
              type="text"
              placeholder="e.g. Department, referral, or notes..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3.5 py-2 bg-[#ffffff] border border-[#cbd5e1] rounded-sm text-sm text-[#0b1c30] placeholder-slate-400 focus:outline-none focus:border-[#d97706] shadow-sm"
            />
          </div>

          {/* Modal Footer */}
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
              disabled={submitting || !name.trim()}
              className="px-5 py-2 text-xs sm:text-sm font-bold font-mono text-white bg-[#d97706] hover:bg-[#b45309] border border-[#f59e0b] disabled:opacity-50 disabled:cursor-not-allowed rounded-sm flex items-center space-x-2 transition-colors shadow-sm"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span>Registering...</span>
                </>
              ) : (
                <span>Register Member</span>
              )}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
