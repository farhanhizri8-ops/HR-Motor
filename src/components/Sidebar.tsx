'use client';

import React, { useState } from 'react';
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
  ChevronDown,
  Car,
  X,
  Wrench,
  ShieldCheck,
  Sparkles,
  LogOut,
  Landmark,
  ClipboardCheck,
} from 'lucide-react';
import { useCrm } from '@/context/CrmContext';

interface NavSubItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  roles: string[];
}

interface NavItem {
  name: string;
  href?: string;
  icon: React.ComponentType<{ className?: string }>;
  roles: string[];
  children?: NavSubItem[];
}

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

  const cleanPath = (pathname || '').replace(/\/$/, '') || '/';

  // Dropdown menu CRM tertutup secara default saat login/buka aplikasi
  // Menu hanya akan terbuka saat user mengkliknya, dan jika diklik lagi akan tertutup
  const [crmOpen, setCrmOpen] = useState(false);

  const navigationItems: NavItem[] = [
    {
      name: 'Dasbor Utama',
      href: '/',
      icon: LayoutDashboard,
      roles: ['Owner', 'CRM Administrator', 'Sales Representative', 'WhatsApp Administrator', 'Marketing'],
    },
    {
      name: 'Tugas Saya',
      href: '/tugas-saya',
      icon: ClipboardCheck,
      roles: [
        'Owner',
        'CRM Administrator',
        'Sales Representative',
        'WhatsApp Administrator',
        'Marketing',
        'Host Live',
        'Teknisi Otomotif',
        'Staf Operasional Showroom',
        'Staf Administrasi Keuangan',
        'Konten Kreator',
        'Admin Layanan Pelanggan',
      ],
    },
    {
      name: 'CRM',
      icon: Users,
      roles: ['Owner', 'CRM Administrator', 'Sales Representative', 'WhatsApp Administrator', 'Marketing'],
      children: [
        {
          name: 'Data Pelanggan',
          href: '/customers',
          icon: Users,
          roles: ['Owner', 'CRM Administrator', 'Sales Representative', 'WhatsApp Administrator'],
        },
        {
          name: 'Prospek',
          href: '/leads',
          icon: Target,
          roles: ['Owner', 'CRM Administrator', 'Sales Representative', 'WhatsApp Administrator', 'Marketing'],
        },
        {
          name: 'Follow Up',
          href: '/follow-up',
          icon: CalendarClock,
          roles: ['Owner', 'CRM Administrator', 'Sales Representative', 'WhatsApp Administrator'],
        },
      ],
    },
    {
      name: 'Stok Mobil Showroom',
      href: '/stok-unit',
      icon: Car,
      roles: ['Owner', 'CRM Administrator', 'Sales Representative', 'Marketing'],
    },
    {
      name: 'Garansi & Servis Mobil',
      href: '/riwayat-perbaikan',
      icon: ShieldCheck,
      roles: ['Owner', 'CRM Administrator', 'WhatsApp Administrator', 'Sales Representative', 'Marketing'],
    },
    {
      name: 'Keuangan & Pembukuan',
      href: '/keuangan',
      icon: Landmark,
      roles: ['Owner', 'Staf Administrasi Keuangan'],
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

  const checkRoleAccess = (allowedRoles: string[]) => {
    if (currentUser.role === 'Owner' || (currentUser.email && currentUser.email.toLowerCase().includes('farhanhizri8') || currentUser.email.toLowerCase().includes('danimr7263'))) return true;
    if (allowedRoles.includes(currentUser.role)) return true;
    if (currentUser.jobdesks && currentUser.jobdesks.some((j) => allowedRoles.includes(j))) return true;
    const showroomJobdesks = [
      'Host Live',
      'Teknisi Otomotif',
      'Staf Operasional Showroom',
      'Staf Administrasi Keuangan',
      'Konten Kreator',
      'Admin Layanan Pelanggan',
    ];
    if (
      showroomJobdesks.includes(currentUser.role) ||
      (currentUser.jobdesks && currentUser.jobdesks.some((j) => showroomJobdesks.includes(j)))
    ) {
      if (allowedRoles.includes('Sales Representative') || allowedRoles.includes('Marketing')) {
        return true;
      }
    }
    return false;
  };

  const filteredNav = navigationItems
    .map((item) => {
      if (item.children) {
        const visibleChildren = item.children.filter((child) =>
          checkRoleAccess(child.roles)
        );
        if (visibleChildren.length === 0) return null;
        return {
          ...item,
          children: visibleChildren,
        };
      }
      return checkRoleAccess(item.roles) ? item : null;
    })
    .filter((item): item is NavItem => item !== null);

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-charcoal-950/40 backdrop-blur-xs lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar Container: Clean Luxury Warm Dealership Theme */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 flex flex-col bg-[#FCFBF9] text-charcoal-800 transition-all duration-300 ease-in-out border-r border-[#EAE8E3] shadow-md w-72 max-w-[85vw] ${
          collapsed ? 'lg:w-20' : 'lg:w-64'
        } ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
      >
        {/* Brand Header with Real HR MOTOR Logo */}
        <div className="flex items-center justify-between h-20 px-4 bg-[#FAF9F5] border-b border-[#EAE8E3] relative">
          {/* Subtle top gold accent line */}
          <div className="absolute top-0 left-0 right-0 h-[2.5px] bg-gradient-to-r from-gold-500 via-gold-400 to-gold-600 opacity-90" />

          <Link
            href="/"
            onClick={() => setMobileOpen(false)}
            className={`flex items-center overflow-hidden group transition-all ${
              collapsed ? 'lg:justify-center w-full lg:w-auto' : 'gap-2.5'
            }`}
          >
            {/* Real Official HR MOTOR Logo */}
            <div
              className={`flex items-center justify-center transition-all ${
                collapsed ? 'lg:w-12 lg:h-12 p-1' : 'h-14 w-auto max-w-[190px] py-1'
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/logo-transparent.png?v=5"
                alt="Logo Resmi HR MOTOR"
                className="h-full w-auto max-h-12 object-contain drop-shadow-xs hover:scale-105 transition-transform"
              />
            </div>
          </Link>

          {/* Desktop Toggle Button */}
          {!collapsed && (
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="hidden lg:flex items-center justify-center w-7 h-7 rounded-lg bg-[#F0EDE6] hover:bg-[#E5E1D8] text-charcoal-600 hover:text-gold-700 border border-[#DDD9CF] transition-colors"
              title="Ciutkan Sidebar"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          )}

          {/* Mobile Close Button */}
          <button
            onClick={() => setMobileOpen(false)}
            className="flex lg:hidden items-center justify-center w-9 h-9 rounded-xl bg-[#F0EDE6] text-charcoal-600 hover:text-charcoal-900 border border-[#DDD9CF] transition-colors shadow-2xs"
            aria-label="Tutup Menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Collapsed Expand Trigger */}
        {collapsed && (
          <div className="hidden lg:flex justify-center py-2 border-b border-[#EAE8E3]">
            <button
              onClick={() => setCollapsed(false)}
              className="flex items-center justify-center w-7 h-7 rounded-lg bg-[#F0EDE6] hover:bg-[#E5E1D8] text-charcoal-600 hover:text-gold-700 border border-[#DDD9CF] transition-colors"
              title="Perluas Sidebar"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Navigation Items */}
        <div className="flex-1 overflow-y-auto py-3 px-3 space-y-1.5">
          {filteredNav.map((item) => {
            const Icon = item.icon;

            // Jika item memiliki anak (seperti menu dropdown CRM)
            if (item.children && item.children.length > 0) {
              const hasActiveChild = item.children.some(
                (sub) =>
                  cleanPath === sub.href ||
                  (sub.href === '/leads' && cleanPath === '/pipeline')
              );

              return (
                <div key={item.name} className="space-y-1">
                  <button
                    type="button"
                    onClick={() => {
                      if (collapsed) {
                        setCollapsed(false);
                        setCrmOpen(true);
                      } else {
                        setCrmOpen((prev) => !prev);
                      }
                    }}
                    className={`group w-full flex items-center gap-3 px-3 py-2.5 sm:py-3 rounded-xl text-xs font-semibold transition-all duration-150 cursor-pointer relative ${
                      hasActiveChild
                        ? 'bg-[#FDF8ED] text-gold-800 border border-gold-300 shadow-xs font-bold border-l-4 border-l-gold-500'
                        : 'text-charcoal-700 hover:bg-[#F3EFE6] hover:text-gold-700 border-l-4 border-l-transparent'
                    } ${collapsed ? 'lg:justify-center lg:px-0 lg:border-l-0' : ''}`}
                    title={collapsed ? `${item.name} (Data Pelanggan, Prospek, Follow Up)` : undefined}
                  >
                    <Icon
                      className={`w-4.5 h-4.5 shrink-0 transition-colors ${
                        hasActiveChild
                          ? 'text-gold-600 stroke-[2.2]'
                          : 'text-charcoal-400 group-hover:text-gold-600'
                      }`}
                    />

                    {/* Show label on mobile always, or on desktop when not collapsed */}
                    <span className={`truncate tracking-wide font-bold ${collapsed ? 'lg:hidden' : 'inline'}`}>
                      {item.name}
                    </span>

                    {/* Chevron Indicator */}
                    <span
                      className={`ml-auto transition-transform duration-200 ${
                        collapsed ? 'lg:hidden' : 'flex items-center'
                      }`}
                    >
                      <ChevronDown
                        className={`w-4 h-4 transition-transform duration-200 ${
                          crmOpen ? 'rotate-180 text-gold-600' : 'text-charcoal-400 group-hover:text-gold-600'
                        }`}
                      />
                    </span>

                    {/* Collapsed dot */}
                    {hasActiveChild && collapsed && (
                      <span className="w-1.5 h-1.5 rounded-full bg-gold-500 absolute top-2 right-2 hidden lg:block" />
                    )}
                  </button>

                  {/* Dropdown sub-items for CRM */}
                  {crmOpen && (!collapsed || mobileOpen) && (
                    <div className="ml-4 pl-3.5 border-l-2 border-gold-400/40 space-y-1 my-1 transition-all">
                      {item.children.map((sub) => {
                        const isSubActive =
                          cleanPath === sub.href ||
                          (sub.href === '/leads' && cleanPath === '/pipeline');
                        const SubIcon = sub.icon;

                        return (
                          <Link
                            key={sub.href}
                            href={sub.href}
                            prefetch={true}
                            onClick={() => setMobileOpen(false)}
                            className={`group flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs transition-all duration-150 relative ${
                              isSubActive
                                ? 'bg-[#FDF8ED] text-gold-800 border border-gold-300 font-bold shadow-xs'
                                : 'text-charcoal-600 hover:bg-[#F3EFE6] hover:text-charcoal-900 font-medium'
                            }`}
                            title={sub.name}
                          >
                            <SubIcon
                              className={`w-4 h-4 shrink-0 transition-colors ${
                                isSubActive
                                  ? 'text-gold-600 stroke-[2.2]'
                                  : 'text-charcoal-400 group-hover:text-gold-600'
                              }`}
                            />
                            <span className="truncate">{sub.name}</span>
                            {isSubActive && (
                              <span className="w-1.5 h-1.5 rounded-full bg-gold-500 ml-auto shrink-0 shadow-xs" />
                            )}
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            }

            // Menu reguler tanpa anak
            const isActive =
              cleanPath === item.href ||
              (item.href === '/leads' && cleanPath === '/pipeline') ||
              (item.href === '/riwayat-perbaikan' &&
                (cleanPath === '/garansi-perbaikan' || cleanPath === '/riwayat-perbaikan'));

            return (
              <Link
                key={item.href || item.name}
                href={item.href || '/'}
                prefetch={true}
                onClick={() => setMobileOpen(false)}
                className={`group flex items-center gap-3 px-3 py-2.5 sm:py-3 rounded-xl text-xs font-semibold transition-all duration-150 relative ${
                  isActive
                    ? 'bg-[#FDF8ED] text-gold-800 border border-gold-300 shadow-xs font-bold border-l-4 border-l-gold-500'
                    : 'text-charcoal-700 hover:bg-[#F3EFE6] hover:text-gold-700 border-l-4 border-l-transparent'
                } ${collapsed ? 'lg:justify-center lg:px-0 lg:border-l-0' : ''}`}
                title={collapsed ? item.name : undefined}
              >
                <Icon
                  className={`w-4.5 h-4.5 shrink-0 transition-colors ${
                    isActive
                      ? 'text-gold-600 stroke-[2.2]'
                      : 'text-charcoal-400 group-hover:text-gold-600'
                  }`}
                />

                {/* Show label on mobile always, or on desktop when not collapsed */}
                <span className={`truncate tracking-wide ${collapsed ? 'lg:hidden' : 'inline'}`}>
                  {item.name}
                </span>

                {isActive && (
                  <span className={`w-1.5 h-1.5 rounded-full bg-gold-500 ml-auto ${collapsed ? 'lg:hidden' : 'inline-block'}`} />
                )}
              </Link>
            );
          })}
        </div>

        {/* User Profile Card & Role Footer */}
        <div className="p-3 bg-[#FAF9F5] border-t border-[#EAE8E3]">
          <div className={`flex items-center gap-3 ${collapsed ? 'lg:justify-center' : ''}`}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={currentUser.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=FarhanOwner&backgroundColor=ffdfbf'}
              alt={currentUser.name}
              className="w-9 h-9 rounded-full object-cover aspect-square border-2 border-gold-400 shadow-xs shrink-0"
            />
            <div className={`flex-1 min-w-0 flex items-center justify-between gap-1 ${collapsed ? 'lg:hidden' : 'flex'}`}>
              <div className="min-w-0">
                <p className="text-xs font-bold text-charcoal-900 truncate">
                  {currentUser.name}
                </p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-gold-500" />
                  <p className="text-[10px] text-gold-700 font-semibold truncate uppercase tracking-wider">
                    {getRoleDisplayName(currentUser.role)}
                    {currentUser.jobdesks && currentUser.jobdesks.length > 1 && ` (+${currentUser.jobdesks.length - 1})`}
                  </p>
                </div>
              </div>
              <button
                onClick={logout}
                title="Keluar dari Akun"
                className="p-2 text-charcoal-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors shrink-0 cursor-pointer"
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
