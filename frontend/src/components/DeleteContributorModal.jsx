import React from 'react';
import { AlertTriangle, Trash2, X, Loader2 } from 'lucide-react';
import { formatNaira } from '../utils/formatters';

export default function DeleteContributorModal({
  isOpen,
  onClose,
  onConfirm,
  contributor,
  submitting
}) {
  if (!isOpen || !contributor) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-[#0b1c30]/50 backdrop-blur-sm animate-fade-in">
      <div className="institutional-card w-full max-w-md bg-[#ffffff] overflow-hidden border border-[#cbd5e1] shadow-2xl">
        
        {/* Header */}
        <div className="px-5 py-4 bg-[#ba1a1a] text-white flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <AlertTriangle className="w-5 h-5 text-white" />
            <h3 className="font-bold text-base font-sans">Confirm Contributor Deletion</h3>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white p-1 rounded-xs hover:bg-[#991b1b] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 space-y-4 text-[#0b1c30]">
          <p className="text-sm text-slate-700">
            Are you sure you want to permanently delete the contributor record for:
          </p>

          <div className="p-3 bg-[#fef2f2] border border-[#fecaca] rounded-sm font-mono space-y-1">
            <div className="flex items-center justify-between text-sm font-bold text-[#ba1a1a]">
              <span>{contributor.name}</span>
              <span className="bg-[#ba1a1a] text-white text-xs px-2 py-0.5 rounded-xs">
                {contributor.contributor_code}
              </span>
            </div>
            {contributor.total_contributed !== undefined && (
              <p className="text-xs text-slate-600">
                Total Contributions Recorded: <strong>{formatNaira(contributor.total_contributed)}</strong>
              </p>
            )}
          </div>

          <div className="p-3 bg-[#fffbeb] border border-[#fef3c7] rounded-sm text-xs text-[#92400e] flex items-start space-x-2">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-[#d97706]" />
            <span>
              <strong>Warning:</strong> Deleting this contributor will permanently wipe all their weekly payment records from the system. This action cannot be undone.
            </span>
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
              type="button"
              onClick={onConfirm}
              disabled={submitting}
              className="px-5 py-2 text-xs sm:text-sm font-bold font-mono text-white bg-[#ba1a1a] hover:bg-[#991b1b] border border-[#ef4444] rounded-sm flex items-center space-x-2 transition-colors shadow-sm disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span>Deleting...</span>
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4" />
                  <span>Delete Contributor</span>
                </>
              )}
            </button>
          </div>

        </div>

      </div>
    </div>
  );
}
