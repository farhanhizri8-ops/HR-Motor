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
  AlertCircle,
  Wrench,
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
          className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 flex flex-col bg-crm-navy-900 text-white transition-all duration-300 ease-in-out border-r border-crm-navy-700 ${
          collapsed ? 'w-20' : 'w-64'
        } ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
      >
        {/* Brand Header */}
        <div className="flex items-center justify-between h-16 px-4 bg-crm-navy-800 border-b border-crm-navy-700">
          <Link href="/" className="flex items-center gap-3 overflow-hidden">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-emerald-500 text-white shadow-md shadow-emerald-500/20 shrink-0">
              <Car className="w-6 h-6" />
            </div>
            {!collapsed && (
              <div className="flex flex-col">
                <span className="font-extrabold text-base tracking-wider text-white">
                  HR MOTOR
                </span>
                <span className="text-[10px] text-emerald-400 font-medium uppercase tracking-widest">
                  Garut • CRM Dealership
                </span>
              </div>
            )}
          </Link>

          {/* Desktop Toggle Button */}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="hidden lg:flex items-center justify-center w-7 h-7 rounded-md bg-crm-navy-700 hover:bg-crm-navy-600 text-slate-300 hover:text-white transition-colors"
            title={collapsed ? 'Perluas Sidebar' : 'Ciutkan Sidebar'}
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>

          {/* Mobile Close Button */}
          <button
            onClick={() => setMobileOpen(false)}
            className="flex lg:hidden items-center justify-center w-8 h-8 rounded-md text-slate-300 hover:text-white hover:bg-crm-navy-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Location Info Banner */}
        {!collapsed && (
          <div className="px-4 py-2 bg-crm-navy-800/50 border-b border-crm-navy-700/60 text-[11px] text-slate-300">
            <span className="truncate">Cabang Garut: Jl. Otista No. 128</span>
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
                className={`group flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-900/30 font-semibold'
                    : 'text-slate-300 hover:bg-crm-navy-800 hover:text-white'
                } ${collapsed ? 'justify-center' : ''}`}
                title={collapsed ? item.name : undefined}
              >
                <Icon
                  className={`w-5 h-5 shrink-0 ${
                    isActive ? 'text-white' : 'text-slate-400 group-hover:text-emerald-400'
                  }`}
                />

                {!collapsed && (
                  <span className="truncate">{item.name}</span>
                )}
              </Link>
            );
          })}
        </div>

        {/* User Card & Role Status Footer */}
        <div className="p-3 bg-crm-navy-800 border-t border-crm-navy-700">
          <div className={`flex items-center gap-3 ${collapsed ? 'justify-center' : ''}`}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={currentUser.avatar || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100'}
              alt={currentUser.name}
              className="w-9 h-9 rounded-full object-cover border-2 border-emerald-500 shrink-0"
            />
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-white truncate">
                  {currentUser.name}
                </p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  <p className="text-[10px] text-emerald-300 font-medium truncate">
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
