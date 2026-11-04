'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  Target,
  GitPullRequest,
  CalendarClock,
  UserCheck,
  History,
  Settings,
  ChevronLeft,
  ChevronRight,
  Car,
  X,
  Wrench,
  ShieldCheck,
  Sparkles,
  LogOut,
} from 'lucide-react';
import { useCrm } from '@/context/CrmContext';

interface SidebarProps {
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  collapsed,
  setCollapsed,
  mobileOpen,
  setMobileOpen,
}) => {
  const pathname = usePathname();
  const { currentUser, logout } = useCrm();

  const navigationItems = [
    {
      name: 'Dasbor Utama',
      href: '/',
      icon: LayoutDashboard,
      roles: ['Owner', 'CRM Administrator', 'Sales Representative', 'WhatsApp Administrator', 'Marketing'],
    },
    {
      name: 'Basis Data Pelanggan',
      href: '/customers',
      icon: Users,
      roles: ['Owner', 'CRM Administrator', 'Sales Representative', 'WhatsApp Administrator'],
    },
    {
      name: 'Prospek & Penjualan',
      href: '/leads',
      icon: GitPullRequest,
      roles: ['Owner', 'CRM Administrator', 'Sales Representative', 'WhatsApp Administrator', 'Marketing'],
    },
    {
      name: 'Stok Mobil Showroom',
      href: '/stok-unit',
      icon: Car,
      roles: ['Owner', 'CRM Administrator', 'Sales Representative', 'Marketing'],
    },
    {
      name: 'Tindak Lanjut Konsumen',
      href: '/follow-up',
      icon: CalendarClock,
      roles: ['Owner', 'CRM Administrator', 'Sales Representative', 'WhatsApp Administrator'],
    },
    {
      name: 'Garansi & Servis Mobil',
      href: '/riwayat-perbaikan',
      icon: ShieldCheck,
      roles: ['Owner', 'CRM Administrator', 'WhatsApp Administrator', 'Sales Representative', 'Marketing'],
    },
    {
      name: 'Manajemen Pengguna',
      href: '/users',
      icon: UserCheck,
      roles: ['Owner'],
    },
    {
      name: 'Catatan Riwayat Aktivitas',
      href: '/activity-logs',
      icon: History,
      roles: ['Owner', 'CRM Administrator'],
    },
    {
      name: 'Pengaturan Showroom',
      href: '/settings',
      icon: Settings,
      roles: ['Owner', 'CRM Administrator'],
    },
  ];

  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case 'Owner':
        return 'Pemilik (Owner)';
      case 'CRM Administrator':
        return 'Admin Showroom';
      case 'Sales Representative':
        return 'Sales Eksekutif';
      case 'WhatsApp Administrator':
        return 'Admin WhatsApp';
      case 'Marketing':
        return 'Pemasaran';
      default:
        return role;
    }
  };

  const filteredNav = navigationItems.filter((item) =>
    item.roles.includes(currentUser.role)
  );

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/75 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar Container: Charcoal Black Theme */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 flex flex-col bg-[#1C1C1C] text-white transition-all duration-300 ease-in-out border-r border-[#2A2A2A] shadow-2xl w-72 max-w-[85vw] ${
          collapsed ? 'lg:w-20' : 'lg:w-64'
        } ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
      >
        {/* Brand Header with Real HR MOTOR Logo */}
        <div className="flex items-center justify-between h-20 px-4 bg-[#141414] border-b border-[#2A2A2A] relative">
          {/* Subtle top gold accent line */}
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-gold-600 via-gold-400 to-gold-600 opacity-80" />

          <Link
            href="/"
            onClick={() => setMobileOpen(false)}
            className={`flex items-center overflow-hidden group transition-all ${
              collapsed ? 'lg:justify-center w-full lg:w-auto' : 'gap-2.5'
            }`}
          >
            {/* Real Official HR MOTOR Logo - Clean Transparent without Box Background */}
            <div
              className={`flex items-center justify-center transition-all ${
                collapsed ? 'lg:w-12 lg:h-12 p-1' : 'h-14 w-auto max-w-[190px] py-1'
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/logo-transparent.png?v=5"
                alt="Logo Resmi HR MOTOR"
                className="h-full w-auto max-h-12 object-contain drop-shadow-md hover:scale-105 transition-transform"
              />
            </div>
          </Link>

          {/* Desktop Toggle Button */}
          {!collapsed && (
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="hidden lg:flex items-center justify-center w-7 h-7 rounded-lg bg-[#242424] hover:bg-[#2D2D2D] text-slate-400 hover:text-gold-400 border border-[#333333] transition-colors"
              title="Ciutkan Sidebar"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          )}

          {/* Mobile Close Button */}
          <button
            onClick={() => setMobileOpen(false)}
            className="flex lg:hidden items-center justify-center w-9 h-9 rounded-xl bg-[#262626] text-slate-300 hover:text-white border border-[#333333] transition-colors shadow-2xs"
            aria-label="Tutup Menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Collapsed Expand Trigger */}
        {collapsed && (
          <div className="hidden lg:flex justify-center py-2 border-b border-[#2A2A2A]">
            <button
              onClick={() => setCollapsed(false)}
              className="flex items-center justify-center w-7 h-7 rounded-lg bg-[#242424] hover:bg-[#2D2D2D] text-slate-400 hover:text-gold-400 border border-[#333333] transition-colors"
              title="Perluas Sidebar"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Navigation Items */}
        <div className="flex-1 overflow-y-auto py-3 px-3 space-y-1.5">
          {filteredNav.map((item) => {
            const cleanPath = (pathname || '').replace(/\/$/, '') || '/';
            const isActive =
              cleanPath === item.href ||
              (item.href === '/leads' && cleanPath === '/pipeline') ||
              (item.href === '/riwayat-perbaikan' && (cleanPath === '/garansi-perbaikan' || cleanPath === '/riwayat-perbaikan'));
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                prefetch={true}
                onClick={() => setMobileOpen(false)}
                className={`group flex items-center gap-3 px-3 py-2.5 sm:py-3 rounded-xl text-xs font-semibold transition-all duration-150 relative ${
                  isActive
                    ? 'bg-[#282828] text-gold-400 border border-gold-500/40 shadow-sm font-bold border-l-4 border-l-gold-500'
                    : 'text-slate-300 hover:bg-[#262626] hover:text-gold-300 border-l-4 border-l-transparent'
                } ${collapsed ? 'lg:justify-center lg:px-0 lg:border-l-0' : ''}`}
                title={collapsed ? item.name : undefined}
              >
                <Icon
                  className={`w-4.5 h-4.5 shrink-0 transition-colors ${
                    isActive
                      ? 'text-gold-400 stroke-[2.2]'
                      : 'text-slate-400 group-hover:text-gold-400'
                  }`}
                />

                {/* Show label on mobile always, or on desktop when not collapsed */}
                <span className={`truncate tracking-wide ${collapsed ? 'lg:hidden' : 'inline'}`}>
                  {item.name}
                </span>

                {isActive && (
                  <span className={`w-1.5 h-1.5 rounded-full bg-gold-400 ml-auto ${collapsed ? 'lg:hidden' : 'inline-block'}`} />
                )}
              </Link>
            );
          })}
        </div>

        {/* User Profile Card & Role Footer */}
        <div className="p-3 bg-[#141414] border-t border-[#2A2A2A]">
          <div className={`flex items-center gap-3 ${collapsed ? 'lg:justify-center' : ''}`}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={currentUser.avatar || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100'}
              alt={currentUser.name}
              className="w-9 h-9 rounded-full object-cover border-2 border-gold-500 shadow-xs shrink-0"
            />
            <div className={`flex-1 min-w-0 flex items-center justify-between gap-1 ${collapsed ? 'lg:hidden' : 'flex'}`}>
              <div className="min-w-0">
                <p className="text-xs font-bold text-white truncate">
                  {currentUser.name}
                </p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-gold-400" />
                  <p className="text-[10px] text-gold-400/90 font-medium truncate uppercase tracking-wider">
                    {getRoleDisplayName(currentUser.role)}
                  </p>
                </div>
              </div>
              <button
                onClick={logout}
                title="Keluar dari Akun"
                className="p-2 text-slate-400 hover:text-rose-400 hover:bg-[#202020] rounded-lg transition-colors shrink-0"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
