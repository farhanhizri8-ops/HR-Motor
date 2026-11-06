'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Car,
  Users,
  User,
  Target,
  CalendarClock,
  ChevronRight,
  X,
  Sparkles,
} from 'lucide-react';
import { useCrm } from '@/context/CrmContext';

export const MobileBottomNav: React.FC = () => {
  const pathname = usePathname();
  const router = useRouter();
  const { stocks, leads, currentUser } = useCrm();
  const [crmMenuOpen, setCrmMenuOpen] = useState(false);

  const cleanPath = (pathname || '').replace(/\/$/, '') || '/';

  // Badge counts
  const readyStockCount = (stocks || []).filter((s) => s.status === 'Tersedia').length;
  const activeLeadsCount = (leads || []).length;

  const isCrmActive =
    cleanPath.startsWith('/customers') ||
    cleanPath.startsWith('/leads') ||
    cleanPath.startsWith('/pipeline') ||
    cleanPath.startsWith('/follow-up');

  const navTabs = [
    {
      id: 'beranda',
      name: 'Beranda',
      href: '/',
      icon: LayoutDashboard,
      isActive: cleanPath === '/',
    },
    {
      id: 'stok',
      name: 'Stok',
      href: '/stok-unit',
      icon: Car,
      badge: readyStockCount > 0 ? readyStockCount : undefined,
      badgeColor: 'bg-gold-500 text-charcoal-950',
      isActive: cleanPath.startsWith('/stok-unit'),
    },
    {
      id: 'crm',
      name: 'CRM',
      icon: Users,
      badge: activeLeadsCount > 0 ? activeLeadsCount : undefined,
      badgeColor: 'bg-amber-600 text-white',
      isActive: isCrmActive,
      isCrmTrigger: true,
    },
    {
      id: 'profil',
      name: 'Profil',
      href: '/settings',
      icon: User,
      customAvatar: currentUser?.avatar,
      isActive: cleanPath.startsWith('/settings'),
    },
  ];

  const handleCrmItemClick = (href: string) => {
    setCrmMenuOpen(false);
    router.push(href);
  };

  return (
    <>
      {/* ========================================================================= */}
      {/* NATIVE-LIKE MOBILE BOTTOM SHEET DRAWER UNTUK MENU CRM                     */}
      {/* ========================================================================= */}
      {crmMenuOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Menu CRM Showroom"
          className="fixed inset-0 z-50 lg:hidden flex flex-col justify-end"
        >
          {/* Backdrop Blur */}
          <div
            className="fixed inset-0 bg-charcoal-950/50 backdrop-blur-xs transition-opacity"
            onClick={() => setCrmMenuOpen(false)}
          />

          {/* Sheet Modal Container */}
          <div className="relative bg-white rounded-t-3xl border-t border-[#EAE8E3] shadow-2xl p-5 pb-8 max-w-md w-full mx-auto space-y-4 animate-in slide-in-from-bottom duration-200">
            {/* Grab Handle */}
            <div className="w-12 h-1 bg-[#DDD9CF] rounded-full mx-auto" />

            {/* Header */}
            <div className="flex items-center justify-between pb-2 border-b border-[#EAE8E3]">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-gold-100 text-gold-900 border border-gold-300 flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-gold-700" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-charcoal-900">Menu CRM Showroom</h3>
                  <p className="text-[11px] text-charcoal-500">Pilih modul CRM yang ingin dibuka</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setCrmMenuOpen(false)}
                className="w-8 h-8 rounded-full bg-warm-100 hover:bg-warm-200 text-charcoal-600 flex items-center justify-center transition-colors cursor-pointer"
                title="Tutup Menu"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* 3 Modul CRM Cards */}
            <div className="space-y-2.5 pt-1">
              {/* 1. Data Pelanggan */}
              <button
                type="button"
                onClick={() => handleCrmItemClick('/customers')}
                className={`w-full p-3.5 rounded-2xl border text-left flex items-center justify-between gap-3 transition-all active:scale-98 cursor-pointer ${
                  cleanPath.startsWith('/customers')
                    ? 'bg-[#FDF8ED] border-gold-400 shadow-xs'
                    : 'bg-[#FAF9F5] border-[#EAE8E3] hover:border-gold-300 hover:bg-white'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-gold-100 text-gold-900 border border-gold-300 flex items-center justify-center shrink-0">
                    <Users className="w-5 h-5 text-gold-800" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs font-bold text-charcoal-900 leading-tight">Data Pelanggan</h4>
                      {cleanPath.startsWith('/customers') && (
                        <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full bg-gold-500 text-charcoal-950">
                          Aktif
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-charcoal-500 truncate mt-0.5">
                      Basis data pembeli &amp; kwitansi transaksi deal
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-charcoal-400 shrink-0" />
              </button>

              {/* 2. Prospek & Pipeline */}
              <button
                type="button"
                onClick={() => handleCrmItemClick('/leads')}
                className={`w-full p-3.5 rounded-2xl border text-left flex items-center justify-between gap-3 transition-all active:scale-98 cursor-pointer ${
                  cleanPath.startsWith('/leads') || cleanPath.startsWith('/pipeline')
                    ? 'bg-[#FDF8ED] border-gold-400 shadow-xs'
                    : 'bg-[#FAF9F5] border-[#EAE8E3] hover:border-gold-300 hover:bg-white'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-900 border border-amber-300 flex items-center justify-center shrink-0">
                    <Target className="w-5 h-5 text-amber-800" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs font-bold text-charcoal-900 leading-tight">Prospek &amp; Pipeline</h4>
                      {activeLeadsCount > 0 && (
                        <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full bg-amber-600 text-white">
                          {activeLeadsCount} Prospek
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-charcoal-500 truncate mt-0.5">
                      Calon pembeli, tahap nego &amp; unit yang diminati
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-charcoal-400 shrink-0" />
              </button>

              {/* 3. Follow Up Konsumen */}
              <button
                type="button"
                onClick={() => handleCrmItemClick('/follow-up')}
                className={`w-full p-3.5 rounded-2xl border text-left flex items-center justify-between gap-3 transition-all active:scale-98 cursor-pointer ${
                  cleanPath.startsWith('/follow-up')
                    ? 'bg-[#FDF8ED] border-gold-400 shadow-xs'
                    : 'bg-[#FAF9F5] border-[#EAE8E3] hover:border-gold-300 hover:bg-white'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-900 border border-blue-300 flex items-center justify-center shrink-0">
                    <CalendarClock className="w-5 h-5 text-blue-800" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs font-bold text-charcoal-900 leading-tight">Follow Up Konsumen</h4>
                      {cleanPath.startsWith('/follow-up') && (
                        <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full bg-gold-500 text-charcoal-950">
                          Aktif
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-charcoal-500 truncate mt-0.5">
                      Jadwal follow up 1, 3, 6 bulan &amp; survei kepuasan
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-charcoal-400 shrink-0" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4 FITUR UTAMA BOTTOM NAVIGATION BAR (BERANDA, STOK, CRM, PROFIL)          */}
      {/* ========================================================================= */}
      <nav
        aria-label="Navigasi Bawah Mobile"
        className="fixed bottom-0 left-0 right-0 z-40 lg:hidden bg-[#FCFBF9]/95 backdrop-blur-lg border-t border-[#EAE8E3] shadow-[0_-4px_20px_rgba(0,0,0,0.06)] pb-[env(safe-area-inset-bottom)]"
      >
        <div className="flex items-center justify-around h-16 max-w-md mx-auto px-2">
          {navTabs.map((tab) => {
            const Icon = tab.icon;
            const active = tab.isActive;

            // Jika tab CRM (Trigger Bottom Sheet)
            if (tab.isCrmTrigger) {
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setCrmMenuOpen((prev) => !prev)}
                  className={`flex-1 flex flex-col items-center justify-center py-1 px-1 h-full select-none transition-all active:scale-90 group relative cursor-pointer ${
                    active ? 'text-gold-900' : 'text-charcoal-500 hover:text-charcoal-800'
                  }`}
                  title="Menu CRM (Data Pelanggan, Prospek, Follow Up)"
                >
                  {/* Active Indicator Top Pill */}
                  {active && (
                    <span className="absolute top-0 w-8 h-1 bg-gradient-to-r from-gold-500 to-gold-600 rounded-full shadow-2xs" />
                  )}

                  {/* Icon Container with Badge */}
                  <div className="relative flex items-center justify-center mb-0.5">
                    <div
                      className={`w-9 h-7 rounded-full flex items-center justify-center transition-all ${
                        active
                          ? 'bg-gold-100/90 text-gold-900 shadow-2xs scale-105'
                          : 'text-charcoal-500 group-hover:text-charcoal-800'
                      }`}
                    >
                      <Icon className={`w-4.5 h-4.5 ${active ? 'text-gold-900 stroke-[2.4]' : 'stroke-[1.8]'}`} />
                    </div>

                    {/* Badge Count */}
                    {tab.badge !== undefined && (
                      <span
                        className={`absolute -top-1 -right-1 text-[9px] font-black px-1.5 py-0.2 rounded-full min-w-[16px] text-center shadow-xs border border-white ${tab.badgeColor}`}
                      >
                        {tab.badge > 99 ? '99+' : tab.badge}
                      </span>
                    )}
                  </div>

                  {/* Label */}
                  <span
                    className={`text-[10px] tracking-tight leading-none truncate max-w-full ${
                      active ? 'font-extrabold text-gold-950' : 'font-medium text-charcoal-600'
                    }`}
                  >
                    {tab.name}
                  </span>
                </button>
              );
            }

            // Normal Tab (Link)
            return (
              <Link
                key={tab.id}
                href={tab.href!}
                className={`flex-1 flex flex-col items-center justify-center py-1 px-1 h-full select-none transition-all active:scale-90 group relative ${
                  active ? 'text-gold-900' : 'text-charcoal-500 hover:text-charcoal-800'
                }`}
              >
                {/* Active Indicator Top Pill */}
                {active && (
                  <span className="absolute top-0 w-8 h-1 bg-gradient-to-r from-gold-500 to-gold-600 rounded-full shadow-2xs" />
                )}

                {/* Icon Container with Badge */}
                <div className="relative flex items-center justify-center mb-0.5">
                  <div
                    className={`w-9 h-7 rounded-full flex items-center justify-center transition-all ${
                      active
                        ? 'bg-gold-100/90 text-gold-900 shadow-2xs scale-105'
                        : 'text-charcoal-500 group-hover:text-charcoal-800'
                    }`}
                  >
                    {tab.id === 'profil' && tab.customAvatar ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={tab.customAvatar}
                        alt="Profil"
                        className={`w-5.5 h-5.5 rounded-full object-cover border ${
                          active ? 'border-gold-500 ring-1 ring-gold-400' : 'border-[#DDD9CF]'
                        }`}
                      />
                    ) : (
                      <Icon className={`w-4.5 h-4.5 ${active ? 'text-gold-900 stroke-[2.4]' : 'stroke-[1.8]'}`} />
                    )}
                  </div>

                  {/* Badge Count */}
                  {tab.badge !== undefined && (
                    <span
                      className={`absolute -top-1 -right-1 text-[9px] font-black px-1.5 py-0.2 rounded-full min-w-[16px] text-center shadow-xs border border-white ${tab.badgeColor}`}
                    >
                      {tab.badge > 99 ? '99+' : tab.badge}
                    </span>
                  )}
                </div>

                {/* Label */}
                <span
                  className={`text-[10px] tracking-tight leading-none truncate max-w-full ${
                    active ? 'font-extrabold text-gold-950' : 'font-medium text-charcoal-600'
                  }`}
                >
                  {tab.name}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
};
