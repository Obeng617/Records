import React, { useState } from 'react';
import { X, UserPlus, Info, Loader2 } from 'lucide-react';

export default function ClientModal({ isOpen, onClose, onSubmit, submitting }) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSubmit({
      name: name.trim(),
      phone: phone.trim(),
      notes: notes.trim()
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-[#0b1c30]/50 backdrop-blur-sm animate-fade-in">
      <div className="institutional-card w-full max-w-lg bg-[#ffffff] overflow-hidden border border-[#cbd5e1] max-h-[90vh] flex flex-col shadow-2xl">
        
        {/* Header */}
        <div className="px-5 py-4 bg-[#0b132b] text-white flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <UserPlus className="w-5 h-5 text-[#60a5fa]" />
            <h3 className="font-bold text-base font-sans">Register New Client Account</h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-300 hover:text-white p-1 rounded-xs hover:bg-[#1c2541] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto flex-1 text-[#0b1c30]">
          <div className="p-3 rounded-xs bg-[#eff4ff] border border-[#bfdbfe] flex items-start space-x-2.5 text-xs sm:text-sm text-[#0051d5]">
            <Info className="w-4 h-4 shrink-0 mt-0.5" />
            <span className="font-mono text-xs sm:text-sm">
              Sequential code (e.g. <strong className="font-bold">CLI-0001</strong>) is assigned automatically upon creation.
            </span>
          </div>

          <div>
            <label className="block text-xs font-mono font-bold uppercase text-[#45464d] mb-1.5">
              Client Account Name <span className="text-[#ba1a1a]">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Zenith Logistics Ltd"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2 bg-[#ffffff] border border-[#cbd5e1] rounded-sm text-sm text-[#0b1c30] placeholder-slate-400 focus:outline-none focus:border-[#0051d5] shadow-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-mono font-bold uppercase text-[#45464d] mb-1.5">
              Phone / Contact Number <span className="text-slate-400 font-normal">(Numbers only)</span>
            </label>
            <input
              type="tel"
              inputMode="numeric"
              placeholder="e.g. 08012345678"
              value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/[^0-9]/g, ''))}
              className="w-full px-3.5 py-2 bg-[#ffffff] border border-[#cbd5e1] rounded-sm text-sm text-[#0b1c30] font-mono placeholder-slate-400 focus:outline-none focus:border-[#0051d5] shadow-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-mono font-bold uppercase text-[#45464d] mb-1.5">
              Notes / Business Address <span className="text-slate-400 font-normal">(Optional)</span>
            </label>
            <textarea
              rows="3"
              placeholder="e.g. Account metadata or location details..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3.5 py-2 bg-[#ffffff] border border-[#cbd5e1] rounded-sm text-sm text-[#0b1c30] placeholder-slate-400 focus:outline-none focus:border-[#0051d5] resize-none shadow-sm"
            />
          </div>

          {/* Footer Actions */}
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
              className="px-5 py-2 text-xs sm:text-sm font-bold text-white bg-[#0051d5] hover:bg-[#1d4ed8] border border-[#3b82f6] disabled:opacity-50 disabled:cursor-not-allowed rounded-sm flex items-center space-x-2 transition-colors shadow-sm"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span>Registering...</span>
                </>
              ) : (
                <span>Register Account</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
