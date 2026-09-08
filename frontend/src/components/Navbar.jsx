import React, { useState } from 'react';
import { ShieldCheck, LayoutDashboard, Users, FileSpreadsheet, PiggyBank, Plus, Menu, X } from 'lucide-react';

export default function Navbar({ activeTab, setActiveTab, onOpenNewClient, onOpenNewTransaction, onOpenNewContributor }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleTabSelect = (tab) => {
    setActiveTab(tab);
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 bg-[#0b132b] text-white border-b border-[#1c2541] shadow-md select-none">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 sm:h-18">
          
          {/* Brand & Audit Identity */}
          <div 
            className="flex items-center space-x-2 sm:space-x-3 cursor-pointer shrink-0" 
            onClick={() => handleTabSelect('dashboard')}
          >
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded bg-[#1c2541] border border-[#3b82f6]/40 flex items-center justify-center text-[#3b82f6] shrink-0 shadow-sm">
              <ShieldCheck className="w-4 h-4 sm:w-6 sm:h-6 text-[#60a5fa]" />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center space-x-1.5 sm:space-x-2">
                <span className="font-bold text-sm sm:text-lg text-white font-sans tracking-tight whitespace-nowrap">
                  LedgerTrack
                </span>
                <span className="hidden lg:inline-flex items-center px-2 py-0.5 rounded-xs text-[11px] font-mono uppercase bg-[#059669]/20 text-[#34d399] border border-[#059669]/40">
                  Institutional Audit • NGN ₦
                </span>
              </div>
              <p className="text-[11px] text-slate-300 font-mono hidden sm:block">
                Client Payment & Credit Control System
              </p>
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center space-x-1.5 font-sans">
            <button
              onClick={() => handleTabSelect('dashboard')}
              className={`flex items-center space-x-2 px-3.5 py-2 rounded-sm text-xs sm:text-sm font-semibold transition-colors ${
                activeTab === 'dashboard'
                  ? 'bg-[#1c2541] text-white border border-[#3b82f6]/50 shadow-inner'
                  : 'text-slate-300 hover:text-white hover:bg-[#131a33]'
              }`}
            >
              <LayoutDashboard className="w-4 h-4 text-[#3b82f6]" />
              <span>Dashboard</span>
            </button>

            <button
              onClick={() => handleTabSelect('clients')}
              className={`flex items-center space-x-2 px-3.5 py-2 rounded-sm text-xs sm:text-sm font-semibold transition-colors ${
                activeTab === 'clients'
                  ? 'bg-[#1c2541] text-white border border-[#3b82f6]/50 shadow-inner'
                  : 'text-slate-300 hover:text-white hover:bg-[#131a33]'
              }`}
            >
              <Users className="w-4 h-4 text-[#60a5fa]" />
              <span>Clients Directory</span>
            </button>

            <button
              onClick={() => handleTabSelect('transactions')}
              className={`flex items-center space-x-2 px-3.5 py-2 rounded-sm text-xs sm:text-sm font-semibold transition-colors ${
                activeTab === 'transactions'
                  ? 'bg-[#1c2541] text-white border border-[#3b82f6]/50 shadow-inner'
                  : 'text-slate-300 hover:text-white hover:bg-[#131a33]'
              }`}
            >
              <FileSpreadsheet className="w-4 h-4 text-[#34d399]" />
              <span>Global Audit Log</span>
            </button>

            <button
              onClick={() => handleTabSelect('foodstuffs')}
              className={`flex items-center space-x-2 px-3.5 py-2 rounded-sm text-xs sm:text-sm font-semibold transition-colors ${
                activeTab === 'foodstuffs'
                  ? 'bg-[#1c2541] text-white border border-[#f59e0b]/50 shadow-inner'
                  : 'text-slate-300 hover:text-white hover:bg-[#131a33]'
              }`}
            >
              <PiggyBank className="w-4 h-4 text-[#f59e0b]" />
              <span>Foodstuffs Scheme</span>
            </button>
          </nav>

          {/* Action Buttons & Mobile Toggle */}
          <div className="flex items-center space-x-1.5 sm:space-x-2.5 shrink-0">
            {/* New Client Button */}
            <button
              onClick={onOpenNewClient}
              className="flex items-center justify-center space-x-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 text-xs sm:text-sm font-semibold text-slate-100 bg-[#1c2541] hover:bg-[#334155] border border-[#334155] rounded-sm transition-colors shadow-sm whitespace-nowrap"
              title="Register New Client Account"
            >
              <Plus className="w-4 h-4 text-[#60a5fa] shrink-0" />
              <span>New Client</span>
            </button>

            {/* Mobile Menu Hamburger Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-1.5 sm:p-2 rounded-sm text-slate-300 hover:text-white hover:bg-[#1c2541] border border-[#334155] shrink-0"
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5 text-white" /> : <Menu className="w-5 h-5 text-slate-300" />}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Drawer Menu & Overlay Backdrop */}
      {mobileMenuOpen && (
        <>
          {/* Click / Touch Outside Backdrop */}
          <div 
            className="fixed inset-0 z-30 bg-black/50 backdrop-blur-xs md:hidden"
            onClick={() => setMobileMenuOpen(false)}
          />

          <div className="relative z-40 md:hidden bg-[#0b132b] border-b border-[#1c2541] px-4 pt-3 pb-4 space-y-2.5 animate-fade-in shadow-xl">
            <button
              onClick={() => handleTabSelect('dashboard')}
              className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-sm text-xs font-semibold ${
                activeTab === 'dashboard'
                  ? 'bg-[#1c2541] text-white border border-[#3b82f6]'
                  : 'text-slate-300 hover:bg-[#131a33]'
              }`}
            >
              <LayoutDashboard className="w-4 h-4 text-[#3b82f6]" />
              <span>Dashboard Overview</span>
            </button>

            <button
              onClick={() => handleTabSelect('clients')}
              className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-sm text-xs font-semibold ${
                activeTab === 'clients'
                  ? 'bg-[#1c2541] text-white border border-[#3b82f6]'
                  : 'text-slate-300 hover:bg-[#131a33]'
              }`}
            >
              <Users className="w-4 h-4 text-[#60a5fa]" />
              <span>Clients Directory</span>
            </button>

            <button
              onClick={() => handleTabSelect('transactions')}
              className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-sm text-xs font-semibold ${
                activeTab === 'transactions'
                  ? 'bg-[#1c2541] text-white border border-[#3b82f6]'
                  : 'text-slate-300 hover:bg-[#131a33]'
              }`}
            >
              <FileSpreadsheet className="w-4 h-4 text-[#34d399]" />
              <span>Global Audit Log</span>
            </button>

            <button
              onClick={() => handleTabSelect('foodstuffs')}
              className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-sm text-xs font-semibold ${
                activeTab === 'foodstuffs'
                  ? 'bg-[#1c2541] text-white border border-[#f59e0b]'
                  : 'text-slate-300 hover:bg-[#131a33]'
              }`}
            >
              <PiggyBank className="w-4 h-4 text-[#f59e0b]" />
              <span>Foodstuffs Scheme</span>
            </button>
          </div>
        </>
      )}
    </header>
  );
}

