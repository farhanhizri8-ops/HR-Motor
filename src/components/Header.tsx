'use client';

import React, { useState } from 'react';
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
    formatDate,
  } = useCrm();

  const [showRoleDropdown, setShowRoleDropdown] = useState(false);
  const [resetConfirm, setResetConfirm] = useState(false);

  const handleReset = async () => {
    if (window.confirm('Reset data CRM ke data demo awal HR MOTOR Garut? Perubahan yang belum disimpan akan dikembalikan ke default.')) {
      await resetToDemo();
      alert('Data CRM telah berhasil direset ke dataset demo awal HR MOTOR.');
    }
  };

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-16 px-4 lg:px-6 bg-white/95 backdrop-blur-md border-b border-slate-200">
      {/* Left: Mobile hamburger & Location */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => setMobileOpen(true)}
          className="flex lg:hidden items-center justify-center w-9 h-9 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100"
          title="Buka Menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="hidden sm:flex items-center gap-2 text-xs text-slate-600 bg-slate-100/80 px-3 py-1.5 rounded-full border border-slate-200/80">
          <Building2 className="w-3.5 h-3.5 text-emerald-600" />
          <span className="font-semibold text-slate-800">HR MOTOR Garut</span>
          <span className="text-slate-400">|</span>
          <span className="text-slate-500">Pusat Mobil Bekas Berkualitas</span>
        </div>
      </div>

      {/* Middle: Search bar button */}
      <div className="flex-1 max-w-md mx-3">
        <button
          onClick={onOpenGlobalSearch}
          className="w-full flex items-center justify-between px-3.5 py-1.5 text-xs text-slate-500 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors shadow-sm"
        >
          <div className="flex items-center gap-2">
            <Search className="w-4 h-4 text-slate-400" />
            <span>Cari pelanggan, no. WA, prospek, atau mobil...</span>
          </div>
          <kbd className="hidden md:inline-block px-1.5 py-0.5 text-[10px] font-semibold text-slate-500 bg-white border border-slate-200 rounded shadow-xs">
            Ctrl + K
          </kbd>
        </button>
      </div>

      {/* Right: Quick Action, Demo Switcher, User */}
      <div className="flex items-center gap-2">
        {/* Quick Action Button */}
        <button
          onClick={onOpenQuickAction}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 rounded-lg shadow-sm shadow-emerald-600/30 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Aksi Cepat</span>
        </button>

        {/* Demo Switcher for University Presentation */}
        <div className="relative">
          <button
            onClick={() => setShowRoleDropdown(!showRoleDropdown)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-300 rounded-lg transition-colors"
            title="Ganti Peran Akun untuk Demo Kuliah"
          >
            <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span className="hidden md:inline font-semibold">{currentUser.role}</span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {showRoleDropdown && (
            <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in slide-in-from-top-1 duration-150">
              <div className="px-3 py-1.5 border-b border-slate-100">
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Demo Penguji / Penilai
                </p>
                <p className="text-xs text-slate-600">
                  Pilih peran untuk melihat sudut pandang hak akses:
                </p>
              </div>

              <div className="py-1 max-h-64 overflow-y-auto">
                {users.map((u) => (
                  <button
                    key={u.id}
                    onClick={() => {
                      switchUser(u);
                      setShowRoleDropdown(false);
                    }}
                    className={`w-full text-left px-3 py-2 flex items-center justify-between hover:bg-slate-50 transition-colors ${
                      u.id === currentUser.id ? 'bg-emerald-50/70' : ''
                    }`}
                  >
                    <div>
                      <p className="text-xs font-semibold text-slate-800">{u.name}</p>
                      <p className="text-[11px] text-slate-500">{u.role}</p>
                    </div>
                    {u.id === currentUser.id && (
                      <CheckCircle className="w-4 h-4 text-emerald-600" />
                    )}
                  </button>
                ))}
              </div>

              <div className="pt-2 px-3 border-t border-slate-100">
                <button
                  onClick={() => {
                    setShowRoleDropdown(false);
                    handleReset();
                  }}
                  className="w-full flex items-center justify-center gap-1.5 py-1.5 text-xs font-semibold text-slate-600 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Reset Data Demo Awal
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
