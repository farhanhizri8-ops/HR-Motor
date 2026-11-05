'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Car,
  Target,
  TrendingUp,
  User,
} from 'lucide-react';
import { useCrm } from '@/context/CrmContext';

export const MobileBottomNav: React.FC = () => {
  const pathname = usePathname();
  const { stocks, leads, currentUser } = useCrm();

  const cleanPath = (pathname || '').replace(/\/$/, '') || '/';

  // Badge counts
  const readyStockCount = (stocks || []).filter((s) => s.status === 'Tersedia').length;
  const activeLeadsCount = (leads || []).length;

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
      id: 'prospek',
      name: 'Prospek',
      href: '/leads',
      icon: Target,
      badge: activeLeadsCount > 0 ? activeLeadsCount : undefined,
      badgeColor: 'bg-amber-600 text-white',
      isActive: cleanPath.startsWith('/leads') || cleanPath.startsWith('/pipeline'),
    },
    {
      id: 'laporan',
      name: 'Laporan',
      href: '/reports',
      icon: TrendingUp,
      isActive: cleanPath.startsWith('/reports'),
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

  return (
    <nav
      aria-label="Navigasi Bawah Mobile"
      className="fixed bottom-0 left-0 right-0 z-40 lg:hidden bg-[#FCFBF9]/95 backdrop-blur-lg border-t border-[#EAE8E3] shadow-[0_-4px_20px_rgba(0,0,0,0.06)] pb-[env(safe-area-inset-bottom)]"
    >
      <div className="flex items-center justify-around h-16 max-w-md mx-auto px-1">
        {navTabs.map((tab) => {
          const Icon = tab.icon;
          const active = tab.isActive;

          return (
            <Link
              key={tab.id}
              href={tab.href}
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
  );
};
