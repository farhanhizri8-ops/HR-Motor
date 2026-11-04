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
  const { isAuthenticated } = useCrm();
  const [mounted, setMounted] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [quickActionOpen, setQuickActionOpen] = useState(false);
  const [globalSearchOpen, setGlobalSearchOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && isAuthenticated && pathname === '/login') {
      router.replace('/');
    }
  }, [mounted, isAuthenticated, pathname, router]);

  // Render satset langsung tanpa layar tunggu loading
  if (!mounted) {
    return null;
  }

  if (!isAuthenticated) {
    return <LoginScreen />;
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
