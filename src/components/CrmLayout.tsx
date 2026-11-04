'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { CrmProvider } from '@/context/CrmContext';
import { Sidebar } from '@/components/Sidebar';
import { Header } from '@/components/Header';
import { QuickActionModal } from '@/components/QuickActionModal';
import { GlobalSearchModal } from '@/components/GlobalSearchModal';

import { useCrm } from '@/context/CrmContext';
import { LoginScreen } from '@/components/LoginScreen';

export const CrmLayoutContent: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, loading } = useCrm();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [quickActionOpen, setQuickActionOpen] = useState(false);
  const [globalSearchOpen, setGlobalSearchOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (!loading && isAuthenticated && pathname === '/login') {
      router.replace('/');
    }
  }, [loading, isAuthenticated, pathname, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8F7F4] flex flex-col items-center justify-center p-4">
        <div className="flex flex-col items-center gap-3 animate-pulse">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/emblem-transparent.png" alt="HR MOTOR" className="h-16 w-auto object-contain drop-shadow-sm" />
          <p className="text-xs text-charcoal-700 font-bold tracking-wider uppercase">
            Memuat HR MOTOR...
          </p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginScreen />;
  }

  // If already authenticated and visiting /login, transition cleanly to dashboard
  if (pathname === '/login') {
    return (
      <div className="min-h-screen bg-[#F8F7F4] flex flex-col items-center justify-center p-4">
        <div className="flex flex-col items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/emblem-transparent.png" alt="HR MOTOR" className="h-16 w-auto object-contain animate-pulse drop-shadow-sm" />
          <p className="text-xs text-gold-600 font-bold tracking-wider uppercase">
            Membuka HR MOTOR...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F7F4] text-[#202020] flex overflow-x-hidden w-full relative">
      {/* Sidebar */}
      <Sidebar
        collapsed={collapsed}
        setCollapsed={setCollapsed}
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
      />

      {/* Main Container */}
      <div
        className={`flex-1 flex flex-col min-w-0 w-full overflow-x-hidden transition-all duration-300 ease-in-out ${
          collapsed ? 'lg:pl-20' : 'lg:pl-64'
        }`}
      >
        <Header
          setMobileOpen={setMobileOpen}
          onOpenQuickAction={() => setQuickActionOpen(true)}
          onOpenGlobalSearch={() => setGlobalSearchOpen(true)}
        />

        <main className="flex-1 p-3.5 sm:p-5 lg:p-6 overflow-x-hidden w-full min-w-0">
          {children}
        </main>
      </div>

      {/* Modals */}
      <QuickActionModal
        isOpen={quickActionOpen}
        onClose={() => setQuickActionOpen(false)}
      />
      <GlobalSearchModal
        isOpen={globalSearchOpen}
        onClose={() => setGlobalSearchOpen(false)}
      />
    </div>
  );
};

export const CrmLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <CrmProvider>
      <CrmLayoutContent>{children}</CrmLayoutContent>
    </CrmProvider>
  );
};
