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
  ShieldCheck,
  BarChart3,
  UserCheck,
  History,
  Settings,
  ChevronLeft,
  ChevronRight,
  Car,
  X,
  Wrench,
  Sparkles,
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
  const { currentUser } = useCrm();

  const navigationItems = [
    {
      name: 'Dashboard',
      href: '/',
      icon: LayoutDashboard,
      roles: ['Owner', 'CRM Administrator', 'Sales Representative', 'WhatsApp Administrator', 'Marketing'],
    },
    {
      name: 'Database Pelanggan',
      href: '/customers',
      icon: Users,
      roles: ['Owner', 'CRM Administrator', 'Sales Representative', 'WhatsApp Administrator'],
    },
    {
      name: 'Leads Management',
      href: '/leads',
      icon: Target,
      roles: ['Owner', 'CRM Administrator', 'Sales Representative', 'Marketing'],
    },
    {
      name: 'Sales Pipeline',
      href: '/pipeline',
      icon: GitPullRequest,
      roles: ['Owner', 'CRM Administrator', 'Sales Representative'],
    },
    {
      name: 'Manajemen Stok Unit',
      href: '/stok-unit',
      icon: Car,
      roles: ['Owner', 'CRM Administrator', 'Sales Representative', 'Marketing'],
    },
    {
      name: 'Follow-up Management',
      href: '/follow-up',
      icon: CalendarClock,
      roles: ['Owner', 'CRM Administrator', 'Sales Representative', 'WhatsApp Administrator'],
    },
    {
      name: 'Riwayat Perbaikan Garansi',
      href: '/riwayat-perbaikan',
      icon: Wrench,
      roles: ['Owner', 'CRM Administrator', 'WhatsApp Administrator', 'Sales Representative', 'Marketing'],
    },
    {
      name: 'After Sales & Retensi',
      href: '/after-sales',
      icon: ShieldCheck,
      roles: ['Owner', 'CRM Administrator', 'WhatsApp Administrator', 'Sales Representative', 'Marketing'],
    },
    {
      name: 'Reports & Analytics',
      href: '/reports',
      icon: BarChart3,
      roles: ['Owner', 'CRM Administrator', 'Marketing'],
    },
    {
      name: 'User Management',
      href: '/users',
      icon: UserCheck,
      roles: ['Owner'],
    },
    {
      name: 'Activity Logs',
      href: '/activity-logs',
      icon: History,
      roles: ['Owner', 'CRM Administrator'],
    },
    {
      name: 'Settings Dealer',
      href: '/settings',
      icon: Settings,
      roles: ['Owner', 'CRM Administrator'],
    },
  ];

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
        className={`fixed top-0 bottom-0 left-0 z-50 flex flex-col bg-[#1C1C1C] text-white transition-all duration-300 ease-in-out border-r border-[#2A2A2A] shadow-2xl ${
          collapsed ? 'w-20' : 'w-64'
        } ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
      >
        {/* Brand Header with Real HR MOTOR Logo */}
        <div className="flex items-center justify-between h-20 px-4 bg-[#141414] border-b border-[#2A2A2A] relative">
          {/* Subtle top gold accent line */}
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-gold-600 via-gold-400 to-gold-600 opacity-80" />

          <Link
            href="/"
            onClick={() => setMobileOpen(false)}
            className={`flex items-center overflow-hidden group transition-transform ${
              collapsed ? 'justify-center w-full' : 'gap-2.5'
            }`}
          >
            {/* Real Official HR MOTOR 3D Logo */}
            <div className="relative flex items-center justify-center shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/logo.png"
                alt="Logo Resmi HR MOTOR"
                className={`object-contain drop-shadow-[0_4px_16px_rgba(217,154,50,0.35)] transition-all ${
                  collapsed ? 'h-11 w-auto max-w-[58px]' : 'h-13 w-auto max-w-[155px]'
                }`}
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
            className="flex lg:hidden items-center justify-center w-8 h-8 rounded-lg text-slate-400 hover:text-white hover:bg-[#292929]"
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

        {/* Showroom Location Pill */}
        {!collapsed && (
          <div className="px-4 py-2 bg-[#171717] border-b border-[#262626] flex items-center justify-between text-[10px]">
            <span className="text-slate-400 font-medium truncate">Jl. Otista No. 128, Garut</span>
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-gold-400 animate-pulse" />
          </div>
        )}

        {/* Navigation Items */}
        <div className="flex-1 overflow-y-auto py-3 px-3 space-y-1">
          {filteredNav.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={`group flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 ${
                  isActive
                    ? 'bg-gradient-to-r from-gold-500 to-gold-400 text-charcoal-950 shadow-gold font-bold'
                    : 'text-slate-300 hover:bg-[#262626] hover:text-gold-300'
                } ${collapsed ? 'justify-center px-0' : ''}`}
                title={collapsed ? item.name : undefined}
              >
                <Icon
                  className={`w-4.5 h-4.5 shrink-0 transition-colors ${
                    isActive
                      ? 'text-charcoal-950 stroke-[2.2]'
                      : 'text-slate-400 group-hover:text-gold-400'
                  }`}
                />

                {!collapsed && (
                  <span className="truncate tracking-wide">{item.name}</span>
                )}
              </Link>
            );
          })}
        </div>

        {/* User Profile Card & Role Footer */}
        <div className="p-3 bg-[#141414] border-t border-[#2A2A2A]">
          <div className={`flex items-center gap-3 ${collapsed ? 'justify-center' : ''}`}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={currentUser.avatar || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100'}
              alt={currentUser.name}
              className="w-9 h-9 rounded-full object-cover border-2 border-gold-500 shadow-xs shrink-0"
            />
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-white truncate">
                  {currentUser.name}
                </p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-gold-400" />
                  <p className="text-[10px] text-gold-400/90 font-medium truncate uppercase tracking-wider">
                    {currentUser.role}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  );
};
