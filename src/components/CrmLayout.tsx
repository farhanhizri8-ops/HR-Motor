'use client';

import React, { useState } from 'react';
import { CrmProvider } from '@/context/CrmContext';
import { Sidebar } from '@/components/Sidebar';
import { Header } from '@/components/Header';
import { QuickActionModal } from '@/components/QuickActionModal';
import { GlobalSearchModal } from '@/components/GlobalSearchModal';

export const CrmLayoutContent: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [quickActionOpen, setQuickActionOpen] = useState(false);
  const [globalSearchOpen, setGlobalSearchOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#F8F7F4] text-[#202020] flex">
      {/* Sidebar */}
      <Sidebar
        collapsed={collapsed}
        setCollapsed={setCollapsed}
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
      />

      {/* Main Container */}
      <div
        className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ease-in-out ${
          collapsed ? 'lg:pl-20' : 'lg:pl-64'
        }`}
      >
        <Header
          setMobileOpen={setMobileOpen}
          onOpenQuickAction={() => setQuickActionOpen(true)}
          onOpenGlobalSearch={() => setGlobalSearchOpen(true)}
        />

        <main className="flex-1 p-4 lg:p-6 overflow-x-hidden">
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
