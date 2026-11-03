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
  ChevronDown,
  LogOut,
  Bell,
  Clock,
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
    logout,
    followUps,
    creditApplications,
  } = useCrm();

  const [showRoleDropdown, setShowRoleDropdown] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  // Calculate urgent reminders
  const todayStr = new Date().toISOString().split('T')[0];
  const overdueCount = (followUps || []).filter(
    (f) => f.scheduledDate && f.scheduledDate < todayStr && f.status !== 'Selesai' && f.status !== 'Dibatalkan'
  ).length;
  const pendingCreditCount = (creditApplications || []).filter((a) => a.status === 'PENDING').length;
  const alertCount = overdueCount + pendingCreditCount;

  const handleReset = async () => {
    if (window.confirm('Reset data CRM ke data demo awal HR MOTOR Garut?')) {
      await resetToDemo();
      alert('Data CRM telah berhasil direset ke dataset awal.');
    }
  };

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between min-h-[4rem] h-16 lg:h-18 px-2.5 sm:px-4 lg:px-6 bg-[#FCFBF9]/95 backdrop-blur-md border-b border-warm-200 shadow-luxury">
      {/* Left: Mobile hamburger & Showroom Logo */}
      <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
        <button
          onClick={() => setMobileOpen(true)}
          className="flex lg:hidden items-center justify-center w-8.5 h-8.5 sm:w-9 sm:h-9 rounded-xl text-charcoal-700 hover:text-charcoal-900 bg-white hover:bg-warm-100 border border-warm-200 transition-colors shadow-2xs"
          title="Buka Menu Sidebar"
          aria-label="Buka Menu"
        >
          <Menu className="w-4.5 h-4.5" />
        </button>

        {/* Mobile Logo View */}
        <Link href="/" className="flex lg:hidden items-center">
          <div className="bg-white px-2 py-1 rounded-lg border border-gold-500/30 shadow-2xs flex items-center justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logo.png?v=3"
              alt="HR MOTOR Logo"
              className="h-6 sm:h-7 w-auto object-contain"
            />
          </div>
        </Link>

        {/* Desktop Showroom Brand Badge */}
        <div className="hidden lg:flex items-center gap-2.5 text-xs text-charcoal-600 bg-white px-3.5 py-1.5 rounded-full border border-warm-200 shadow-luxury">
          <div className="w-2 h-2 rounded-full bg-gold-500 animate-pulse" />
          <span className="font-black text-charcoal-900 tracking-wide">HR MOTOR Garut</span>
          <span className="text-warm-300">|</span>
          <span className="text-charcoal-500 text-[11px] font-medium">Showroom Mobil Bekas Berkualitas</span>
        </div>
      </div>

      {/* Middle: Luxury Search Bar Trigger */}
      <div className="flex-1 min-w-[60px] max-w-xs sm:max-w-md mx-1 sm:mx-4">
        <button
          onClick={onOpenGlobalSearch}
          className="w-full flex items-center justify-between px-2 sm:px-3.5 py-2 text-xs text-charcoal-500 bg-white hover:bg-warm-50 border border-warm-200 hover:border-gold-400 rounded-xl transition-all shadow-luxury group"
          title="Cari data CRM (Ctrl + K)"
        >
          <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
            <Search className="w-3.5 h-3.5 text-charcoal-400 group-hover:text-gold-500 transition-colors shrink-0" />
            <span className="text-[11px] sm:text-xs truncate hidden sm:inline">
              Cari pelanggan, stok mobil, no. WA...
            </span>
            <span className="text-[11px] truncate sm:hidden">
              Cari data...
            </span>
          </div>
          <kbd className="hidden md:inline-block px-1.5 py-0.5 text-[10px] font-bold text-charcoal-500 bg-warm-100 border border-warm-200 rounded-md shrink-0">
            Ctrl+K
          </kbd>
        </button>
      </div>

      {/* Right: Notification Bell, Quick Action, Role Switcher, Logout */}
      <div className="flex items-center gap-1 sm:gap-2.5 shrink-0">
        {/* Notification Bell */}
        <div className="relative">
          <button
            onClick={() => {
              setShowNotifications(!showNotifications);
              setShowRoleDropdown(false);
            }}
            className="relative flex items-center justify-center w-8.5 h-8.5 sm:w-9 sm:h-9 rounded-xl bg-white hover:bg-warm-50 border border-warm-200 text-charcoal-700 hover:text-gold-600 transition-all shadow-2xs"
            title="Pemberitahuan & Pengingat"
            aria-label="Pemberitahuan Showroom"
          >
            <Bell className="w-4 h-4" />
            {alertCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-rose-500 text-white text-[10px] font-black flex items-center justify-center border-2 border-white animate-pulse">
                {alertCount}
              </span>
            )}
          </button>

          {/* Notification Dropdown */}
          {showNotifications && (
            <div className="fixed left-3 right-3 top-16 sm:absolute sm:inset-auto sm:right-0 sm:top-full sm:mt-2 sm:w-80 bg-white rounded-2xl shadow-luxury-lg border border-warm-200 p-3 z-50 animate-in fade-in zoom-in-95 duration-100">
              <div className="flex items-center justify-between pb-2 border-b border-warm-200">
                <div className="flex items-center gap-1.5">
                  <Bell className="w-3.5 h-3.5 text-gold-600" />
                  <span className="text-xs font-bold text-charcoal-900">Pemberitahuan Showroom</span>
                </div>
                {alertCount > 0 && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-50 text-rose-600 border border-rose-200">
                    {alertCount} Perlu Ditindaklanjuti
                  </span>
                )}
              </div>

              <div className="space-y-2 mt-2.5 max-h-64 overflow-y-auto">
                {pendingCreditCount > 0 && (
                  <Link
                    href="/customers"
                    onClick={() => setShowNotifications(false)}
                    className="p-2.5 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-200 flex items-start gap-2.5 transition-colors block"
                  >
                    <Clock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-bold text-amber-900">
                        {pendingCreditCount} Pengajuan Kredit Menunggu ACC
                      </p>
                      <p className="text-[10px] text-amber-700 mt-0.5">
                        Buka tab Transaksi Penjualan untuk setujui (ACC) atau tolak pengajuan bank.
                      </p>
                    </div>
                  </Link>
                )}

                {overdueCount > 0 && (
                  <Link
                    href="/follow-up"
                    onClick={() => setShowNotifications(false)}
                    className="p-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-200 flex items-start gap-2.5 transition-colors block"
                  >
                    <Clock className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-bold text-rose-900">
                        {overdueCount} Jadwal Follow-up Konsumen Terlambat
                      </p>
                      <p className="text-[10px] text-rose-700 mt-0.5">
                        Hubungi konsumen pembeli berkala 1 tahun melalui WhatsApp resmi.
                      </p>
                    </div>
                  </Link>
                )}

                {alertCount === 0 && (
                  <div className="py-6 text-center text-charcoal-400">
                    <CheckCircle className="w-8 h-8 mx-auto text-emerald-500 mb-1.5" />
                    <p className="text-xs font-bold text-charcoal-800">Semua Terkendali Prima</p>
                    <p className="text-[10px] text-charcoal-500 mt-0.5">Tidak ada jadwal follow-up atau ACC tertunda.</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Quick Action Button (Luxury Gold) */}
        <button
          onClick={onOpenQuickAction}
          className="btn-gold flex items-center justify-center gap-1.5 text-xs uppercase tracking-wider w-8.5 h-8.5 sm:w-auto py-1.5 sm:py-2 px-0 sm:px-3.5 shadow-gold shrink-0"
          title="Aksi Cepat Showroom"
        >
          <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
          <span className="hidden sm:inline">Aksi Cepat</span>
        </button>

        {/* Role & Profile Switcher Dropdown */}
        <div className="relative">
          <button
            onClick={() => {
              setShowRoleDropdown(!showRoleDropdown);
              setShowNotifications(false);
            }}
            className="flex items-center gap-1 sm:gap-2 px-1.5 sm:px-3 py-1.5 text-xs font-semibold text-charcoal-800 bg-white hover:bg-warm-50 border border-warm-200 hover:border-gold-400 rounded-xl transition-all shadow-luxury shrink-0"
            title="Ganti Peran Akun untuk Demo"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={currentUser.avatar || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=80'}
              alt={currentUser.name}
              className="w-5 h-5 rounded-full object-cover border border-gold-400 shrink-0"
            />
            <span className="hidden lg:inline font-bold truncate max-w-[90px]">{currentUser.name}</span>
            <span className="hidden sm:inline text-[10px] text-gold-700 bg-gold-100 border border-gold-200 px-1.5 py-0.5 rounded font-bold uppercase truncate max-w-[110px]">
              {currentUser.role}
            </span>
            <ChevronDown className="w-3.5 h-3.5 text-charcoal-400 shrink-0" />
          </button>

          {showRoleDropdown && (
            <div className="fixed left-3 right-3 top-16 sm:absolute sm:inset-auto sm:right-0 sm:top-full sm:mt-2 sm:w-64 bg-white rounded-2xl shadow-luxury-lg border border-warm-200 p-2.5 z-50 animate-in fade-in zoom-in-95 duration-100">
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
                    className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs rounded-xl text-left transition-colors ${
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

        {/* Logout Button */}
        <button
          onClick={logout}
          className="flex items-center justify-center gap-1.5 w-8.5 h-8.5 sm:w-auto px-0 sm:px-3 py-1.5 text-xs font-semibold text-rose-600 hover:text-rose-700 bg-rose-50/70 hover:bg-rose-100/70 border border-rose-200/80 rounded-xl transition-all shadow-2xs shrink-0"
          title="Keluar dari sesi CRM"
          aria-label="Keluar"
        >
          <LogOut className="w-3.5 h-3.5 shrink-0" />
          <span className="hidden sm:inline">Keluar</span>
        </button>
      </div>
    </header>
  );
};
