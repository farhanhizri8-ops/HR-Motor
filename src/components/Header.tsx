'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Menu,
  Search,
  Plus,
  RotateCcw,
  UserCheck,
  CheckCircle,
  ExternalLink,
  ChevronDown,
  Building2,
  Calendar,
  Sparkles,
} from 'lucide-react';
import { useCrm } from '@/context/CrmContext';

interface HeaderProps {
  setMobileOpen: (open: boolean) => void;
  onOpenQuickAction: () => void;
  onOpenGlobalSearch: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  setMobileOpen,
  onOpenQuickAction,
  onOpenGlobalSearch,
}) => {
  const {
    currentUser,
    switchUser,
    users,
    resetToDemo,
  } = useCrm();

  const [showRoleDropdown, setShowRoleDropdown] = useState(false);

  const handleReset = async () => {
    if (window.confirm('Reset data CRM ke data demo awal HR MOTOR Garut?')) {
      await resetToDemo();
      alert('Data CRM telah berhasil direset ke dataset awal.');
    }
  };

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-18 px-4 lg:px-6 bg-[#FCFBF9]/95 backdrop-blur-md border-b border-warm-200 shadow-luxury">
      {/* Left: Mobile hamburger & Location / Brand */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => setMobileOpen(true)}
          className="flex lg:hidden items-center justify-center w-9 h-9 rounded-lg text-charcoal-700 hover:text-charcoal-900 hover:bg-warm-200/60 border border-warm-200 transition-colors"
          title="Buka Menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Mobile Logo View */}
        <Link href="/" className="flex lg:hidden items-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo.png"
            alt="HR MOTOR Logo"
            className="h-9 w-auto object-contain drop-shadow-sm"
          />
        </Link>

        {/* Desktop Showroom Brand Badge */}
        <div className="hidden sm:flex items-center gap-2.5 text-xs text-charcoal-600 bg-white px-3.5 py-1.5 rounded-full border border-warm-200 shadow-luxury">
          <div className="w-2 h-2 rounded-full bg-gold-500 animate-pulse" />
          <span className="font-black text-charcoal-900 tracking-wide">HR MOTOR Garut</span>
          <span className="text-warm-300">|</span>
          <span className="text-charcoal-500 text-[11px] font-medium">Showroom Mobil Bekas Berkualitas</span>
        </div>
      </div>

      {/* Middle: Luxury Search Bar Trigger */}
      <div className="flex-1 max-w-md mx-4">
        <button
          onClick={onOpenGlobalSearch}
          className="w-full flex items-center justify-between px-3.5 py-2 text-xs text-charcoal-500 bg-white hover:bg-warm-50 border border-warm-200 hover:border-gold-400 rounded-xl transition-all shadow-luxury group"
        >
          <div className="flex items-center gap-2.5">
            <Search className="w-4 h-4 text-charcoal-400 group-hover:text-gold-500 transition-colors" />
            <span className="text-[11px] sm:text-xs">Cari data pelanggan, stok mobil, no. WhatsApp...</span>
          </div>
          <kbd className="hidden md:inline-block px-2 py-0.5 text-[10px] font-bold text-charcoal-500 bg-warm-100 border border-warm-200 rounded-md">
            Ctrl + K
          </kbd>
        </button>
      </div>

      {/* Right: Quick Action, Role Switcher */}
      <div className="flex items-center gap-2.5">
        {/* Quick Action Button (Luxury Gold) */}
        <button
          onClick={onOpenQuickAction}
          className="btn-gold flex items-center gap-1.5 text-xs uppercase tracking-wider py-2 px-3.5"
        >
          <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
          <span className="hidden sm:inline">Aksi Cepat</span>
        </button>

        {/* Demo Switcher Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowRoleDropdown(!showRoleDropdown)}
            className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-charcoal-800 bg-white hover:bg-warm-50 border border-warm-200 hover:border-gold-400 rounded-xl transition-all shadow-luxury"
            title="Ganti Peran Akun untuk Demo"
          >
            <div className="w-2 h-2 rounded-full bg-gold-500" />
            <span className="hidden md:inline">{currentUser.name}</span>
            <span className="text-[10px] text-gold-700 bg-gold-100 border border-gold-200 px-1.5 py-0.5 rounded font-bold uppercase">
              {currentUser.role}
            </span>
            <ChevronDown className="w-3.5 h-3.5 text-charcoal-400" />
          </button>

          {showRoleDropdown && (
            <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-luxury-lg border border-warm-200 p-2 z-50 animate-in fade-in zoom-in-95 duration-100">
              <div className="px-3 py-2 border-b border-warm-200 mb-1">
                <p className="text-[11px] font-bold text-charcoal-900">Pilih Profil Pengguna Showroom</p>
                <p className="text-[10px] text-charcoal-500">Evaluasi hak akses multi-role HR MOTOR</p>
              </div>

              <div className="space-y-0.5">
                {users.map((u) => (
                  <button
                    key={u.id}
                    onClick={() => {
                      switchUser(u);
                      setShowRoleDropdown(false);
                    }}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs rounded-lg text-left transition-colors ${
                      currentUser.id === u.id
                        ? 'bg-gold-50 text-gold-900 font-bold border border-gold-200'
                        : 'text-charcoal-700 hover:bg-warm-100'
                    }`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={u.avatar || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=80'}
                      alt={u.name}
                      className="w-6 h-6 rounded-full object-cover border border-gold-400"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="truncate text-xs font-semibold">{u.name}</p>
                      <p className="text-[10px] text-charcoal-500 truncate">{u.role}</p>
                    </div>
                    {currentUser.id === u.id && (
                      <CheckCircle className="w-3.5 h-3.5 text-gold-600 shrink-0" />
                    )}
                  </button>
                ))}
              </div>

              <div className="mt-2 pt-2 border-t border-warm-200">
                <button
                  onClick={() => {
                    handleReset();
                    setShowRoleDropdown(false);
                  }}
                  className="w-full flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-semibold text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                >
                  <RotateCcw className="w-3 h-3" />
                  Reset Dataset Demo Showroom
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
