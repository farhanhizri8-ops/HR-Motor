'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Users,
  GitPullRequest,
  CalendarClock,
  Car,
  ShieldCheck,
  Clock,
  CheckCircle2,
  Calendar,
  MessageCircle,
  ArrowUpRight,
  Sparkles,
  Phone,
  Layers,
  ChevronRight,
  History,
  Wrench,
  Check,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { useCrm } from '@/context/CrmContext';
import { CorePipelineStage, normalizePipelineStage } from '@/types/crm';
import { checkWarrantyStatus, calculateFleetHealth } from '@/lib/warranty';

type DateFilterType =
  | 'hari_ini'
  | 'minggu_ini'
  | 'bulan_ini'
  | 'per_bulan'
  | 'tahun_ini'
  | 'per_tahun'
  | 'semua'
  | 'kustom';

const MONTH_OPTIONS = [
  { month: 10, year: 2026, label: 'November 2026 (Bulan Ini)' },
  { month: 9, year: 2026, label: 'Oktober 2026' },
  { month: 8, year: 2026, label: 'September 2026' },
  { month: 7, year: 2026, label: 'Agustus 2026' },
  { month: 6, year: 2026, label: 'Juli 2026' },
  { month: 5, year: 2026, label: 'Juni 2026' },
  { month: 4, year: 2026, label: 'Mei 2026' },
  { month: 3, year: 2026, label: 'April 2026' },
  { month: 2, year: 2026, label: 'Maret 2026' },
  { month: 1, year: 2026, label: 'Februari 2026' },
  { month: 0, year: 2026, label: 'Januari 2026' },
];

const YEAR_OPTIONS = [
  { year: 2026, label: 'Tahun 2026' },
  { year: 2025, label: 'Tahun 2025' },
  { year: 2024, label: 'Tahun 2024' },
];

export default function DashboardPage() {
  const {
    customers,
    leads,
    followUps,
    purchases,
    repairClaims,
    stocks,
    activityLogs,
    currentUser,
    formatRupiah,
    formatDate,
    formatWhatsAppLink,
  } = useCrm();

  const [dateFilter, setDateFilter] = useState<DateFilterType>('bulan_ini');
  const [selectedMonthIndex, setSelectedMonthIndex] = useState<number>(10); // Nov
  const [selectedMonthYear, setSelectedMonthYear] = useState<number>(2026);
  const [selectedYear, setSelectedYear] = useState<number>(2026);
  const [customStartDate, setCustomStartDate] = useState('2026-10-01');
  const [customEndDate, setCustomEndDate] = useState('2026-11-04');

  // Exact period boundary computation
  const periodInfo = useMemo(() => {
    let start = new Date(2026, 0, 1, 0, 0, 0);
    let end = new Date(2026, 11, 31, 23, 59, 59);
    let label = 'Tahun 2026';
    let rangeDesc = '1 Jan 2026 - 31 Des 2026';

    if (dateFilter === 'hari_ini') {
      const todayStr = '2026-11-04';
      start = new Date(`${todayStr}T00:00:00`);
      end = new Date(`${todayStr}T23:59:59`);
      label = 'Hari Ini';
      rangeDesc = '4 Nov 2026';
    } else if (dateFilter === 'minggu_ini') {
      start = new Date('2026-10-28T00:00:00');
      end = new Date('2026-11-04T23:59:59');
      label = 'Minggu Ini';
      rangeDesc = '28 Okt - 4 Nov 2026';
    } else if (dateFilter === 'bulan_ini') {
      start = new Date(2026, 10, 1, 0, 0, 0);
      end = new Date(2026, 11, 0, 23, 59, 59);
      label = 'Bulan Ini';
      rangeDesc = 'November 2026';
    } else if (dateFilter === 'per_bulan') {
      start = new Date(selectedMonthYear, selectedMonthIndex, 1, 0, 0, 0);
      end = new Date(selectedMonthYear, selectedMonthIndex + 1, 0, 23, 59, 59);
      const mNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
      label = `${mNames[selectedMonthIndex]} ${selectedMonthYear}`;
      rangeDesc = `1 - ${end.getDate()} ${mNames[selectedMonthIndex]} ${selectedMonthYear}`;
    } else if (dateFilter === 'tahun_ini') {
      start = new Date(2026, 0, 1, 0, 0, 0);
      end = new Date(2026, 11, 31, 23, 59, 59);
      label = 'Tahun 2026';
      rangeDesc = '1 Jan - 31 Des 2026';
    } else if (dateFilter === 'per_tahun') {
      start = new Date(selectedYear, 0, 1, 0, 0, 0);
      end = new Date(selectedYear, 11, 31, 23, 59, 59);
      label = `Tahun ${selectedYear}`;
      rangeDesc = `1 Jan - 31 Des ${selectedYear}`;
    } else if (dateFilter === 'semua') {
      start = new Date(2020, 0, 1, 0, 0, 0);
      end = new Date(2030, 11, 31, 23, 59, 59);
      label = 'Semua Waktu';
      rangeDesc = 'Seluruh data showroom';
    } else if (dateFilter === 'kustom') {
      start = new Date(`${customStartDate}T00:00:00`);
      end = new Date(`${customEndDate}T23:59:59`);
      label = 'Kustom';
      rangeDesc = `${customStartDate} s/d ${customEndDate}`;
    }

    return { start, end, label, rangeDesc };
  }, [dateFilter, selectedMonthIndex, selectedMonthYear, selectedYear, customStartDate, customEndDate]);

  // Filtered Leads
  const filteredLeads = useMemo(() => {
    if (dateFilter === 'semua') return leads;
    return leads.filter((l) => {
      const dStr = l.dateReceived || l.createdAt;
      if (!dStr) return false;
      const d = new Date(dStr);
      return d >= periodInfo.start && d <= periodInfo.end;
    });
  }, [leads, periodInfo, dateFilter]);

  // Filtered Customers
  const filteredCustomers = useMemo(() => {
    if (dateFilter === 'semua') return customers;
    return customers.filter((c) => {
      const dStr = c.registeredDate;
      if (!dStr) return false;
      const d = new Date(dStr);
      return d >= periodInfo.start && d <= periodInfo.end;
    });
  }, [customers, periodInfo, dateFilter]);

  // Filtered Follow-ups
  const filteredFollowUps = useMemo(() => {
    if (dateFilter === 'semua') return followUps;
    return followUps.filter((f) => {
      const dStr = f.scheduledDate || f.createdAt;
      if (!dStr) return false;
      const d = new Date(dStr);
      return d >= periodInfo.start && d <= periodInfo.end;
    });
  }, [followUps, periodInfo, dateFilter]);

  // 1. FITUR: STOK UNIT
  const stocksTotal = (stocks || []).length;
  const stocksReady = (stocks || []).filter((s) => s.status === 'Tersedia').length;
  const stocksBooking = (stocks || []).filter((s) => s.status === 'Booking').length;
  const stocksSold = (stocks || []).filter((s) => s.status === 'Terjual').length;
  const readyStocksList = useMemo(() => {
    return (stocks || []).filter((s) => s.status === 'Tersedia').slice(0, 4);
  }, [stocks]);

  // 2. FITUR: DATABASE PELANGGAN
  const totalCustomers = filteredCustomers.length;
  const recentCustomers = useMemo(() => {
    return (filteredCustomers.length > 0 ? filteredCustomers : customers).slice(0, 4);
  }, [filteredCustomers, customers]);

  // 3. FITUR: LEADS & PIPELINE (3 Tahapan Resmi)
  const totalLeads = filteredLeads.length;
  const pipelineDistribution = useMemo(() => {
    const stages: CorePipelineStage[] = ['Hanya Menanyakan', 'Negosiasi', 'Cek Unit'];
    const counts: Record<CorePipelineStage, number> = {
      'Hanya Menanyakan': 0,
      Negosiasi: 0,
      'Cek Unit': 0,
    };
    filteredLeads.forEach((l) => {
      const core = normalizePipelineStage(l.status);
      counts[core] = (counts[core] || 0) + 1;
    });
    return stages.map((st) => ({
      stage: st,
      jumlah: counts[st] || 0,
    }));
  }, [filteredLeads]);
  const recentLeads = useMemo(() => {
    return (filteredLeads.length > 0 ? filteredLeads : leads).slice(0, 4);
  }, [filteredLeads, leads]);

  // 4. FITUR: FOLLOW-UP MANAGEMENT
  const activeFollowUps = useMemo(() => {
    return filteredFollowUps.filter((f) => f.status !== 'Selesai' && f.status !== 'Dibatalkan');
  }, [filteredFollowUps]);
  const upcomingFollowUps = useMemo(() => {
    if (activeFollowUps.length > 0) return activeFollowUps.slice(0, 4);
    return followUps.filter((f) => f.status !== 'Selesai' && f.status !== 'Dibatalkan').slice(0, 4);
  }, [activeFollowUps, followUps]);

  // 5. FITUR: GARANSI PERBAIKAN (< 1 Bulan)
  const warrantyClaims = useMemo(() => {
    return (repairClaims || []).filter((c) => c.claimType === 'Garansi' || !c.claimType);
  }, [repairClaims]);
  const filteredWarrantyClaims = useMemo(() => {
    if (dateFilter === 'semua') return warrantyClaims;
    return warrantyClaims.filter((c) => {
      const dStr = c.claimDate || c.createdAt;
      if (!dStr) return false;
      const d = new Date(dStr);
      return d >= periodInfo.start && d <= periodInfo.end;
    });
  }, [warrantyClaims, periodInfo, dateFilter]);
  const totalWarrantyClaimsCount = filteredWarrantyClaims.length;
  const totalWarrantyCost = useMemo(() => {
    return filteredWarrantyClaims.reduce((acc, c) => acc + (c.totalCost || 0), 0);
  }, [filteredWarrantyClaims]);

  // Fleet Health calculation for Warranty
  const totalSalesCount = useMemo(() => {
    return stocksSold || (purchases || []).length || 20;
  }, [stocksSold, purchases]);
  const uniqueWarrantyCustomers = useMemo(() => {
    return new Set(warrantyClaims.map((c) => (c.customerPhone || c.customerName).trim().toLowerCase())).size;
  }, [warrantyClaims]);
  const claimRatioPercentage = useMemo(() => {
    if (totalSalesCount <= 0) return '0.0';
    return ((uniqueWarrantyCustomers / totalSalesCount) * 100).toFixed(1);
  }, [uniqueWarrantyCustomers, totalSalesCount]);
  const fleetHealth = useMemo(() => {
    return calculateFleetHealth(claimRatioPercentage);
  }, [claimRatioPercentage]);

  const recentWarrantyClaims = useMemo(() => {
    return (filteredWarrantyClaims.length > 0 ? filteredWarrantyClaims : warrantyClaims).slice(0, 4);
  }, [filteredWarrantyClaims, warrantyClaims]);

  // 6. ACTIVITY LOGS FEED
  const recentLogs = useMemo(() => {
    return (activityLogs || []).slice(0, 4);
  }, [activityLogs]);

  // Growth Trend Chart Data
  const growthTrendData = useMemo(() => {
    if (dateFilter === 'bulan_ini' || dateFilter === 'per_bulan') {
      const targetYear = dateFilter === 'bulan_ini' ? 2026 : selectedMonthYear;
      const targetMonth = dateFilter === 'bulan_ini' ? 10 : selectedMonthIndex;
      const weeks = [
        { name: 'Mg 1', startDay: 1, endDay: 7 },
        { name: 'Mg 2', startDay: 8, endDay: 14 },
        { name: 'Mg 3', startDay: 15, endDay: 21 },
        { name: 'Mg 4', startDay: 22, endDay: 28 },
        { name: 'Mg 5', startDay: 29, endDay: 31 },
      ];
      return weeks.map((w) => {
        const pCount = leads.filter((l) => {
          const dStr = l.dateReceived || l.createdAt;
          if (!dStr) return false;
          const d = new Date(dStr);
          return (
            d.getFullYear() === targetYear &&
            d.getMonth() === targetMonth &&
            d.getDate() >= w.startDay &&
            d.getDate() <= w.endDay
          );
        }).length;

        const cCount = customers.filter((c) => {
          const dStr = c.registeredDate;
          if (!dStr) return false;
          const d = new Date(dStr);
          return (
            d.getFullYear() === targetYear &&
            d.getMonth() === targetMonth &&
            d.getDate() >= w.startDay &&
            d.getDate() <= w.endDay
          );
        }).length;

        return {
          label: w.name,
          prospek: pCount,
          pelanggan: cCount,
        };
      });
    }

    const targetYear = dateFilter === 'per_tahun' ? selectedYear : 2026;
    const monthLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

    return monthLabels.map((lbl, idx) => {
      const pCount = leads.filter((l) => {
        const dStr = l.dateReceived || l.createdAt;
        if (!dStr) return false;
        const d = new Date(dStr);
        return d.getFullYear() === targetYear && d.getMonth() === idx;
      }).length;

      const cCount = customers.filter((c) => {
        const dStr = c.registeredDate;
        if (!dStr) return false;
        const d = new Date(dStr);
        return d.getFullYear() === targetYear && d.getMonth() === idx;
      }).length;

      return {
        label: lbl,
        prospek: pCount,
        pelanggan: cCount,
      };
    });
  }, [dateFilter, selectedMonthIndex, selectedMonthYear, selectedYear, leads, customers]);

  return (
    <div className="space-y-4 sm:space-y-6 w-full max-w-full overflow-x-hidden min-w-0 box-border">
      {/* ========================================================================= */}
      {/* 1. TOP HEADER & FILTER PERIODE (100% RESPONSIVE TANPA SCROLL SAMPING)      */}
      {/* ========================================================================= */}
      <div className="crm-card p-3.5 sm:p-5 bg-white border border-warm-200 relative overflow-hidden">
        {/* Subtle decorative gold light accent */}
        <div className="absolute top-0 right-0 w-64 h-full bg-gradient-to-l from-gold-50/50 via-gold-50/10 to-transparent pointer-events-none" />

        <div className="relative flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="badge-gold inline-flex items-center gap-1.5 text-[10px] sm:text-xs">
                <span className="w-1.5 h-1.5 rounded-full bg-gold-500 animate-pulse" />
                Showroom Operasional
              </span>
              <span className="text-xs text-warm-400">•</span>
              <span className="text-xs text-charcoal-500 font-medium">Garut, Jawa Barat</span>
            </div>

            <h1 className="text-lg sm:text-2xl font-black text-charcoal-900 tracking-tight">
              Selamat Bertugas, {currentUser.name}
            </h1>
            <p className="text-xs text-charcoal-500 max-w-2xl leading-relaxed">
              Ringkasan operasional terpadu: stok unit, database konsumen, calon pembeli, jadwal follow-up, dan garansi perbaikan HR MOTOR.
            </p>
          </div>

          {/* Filter Periode: Menggunakan wrapping responsif agar pas di layar HP tanpa geser ke samping */}
          <div className="flex flex-col gap-2 w-full lg:w-auto shrink-0">
            <div className="flex flex-wrap items-center gap-1.5 p-1 bg-warm-100 rounded-xl border border-warm-200">
              <button
                type="button"
                onClick={() => setDateFilter('bulan_ini')}
                className={`flex-1 sm:flex-none text-center px-2.5 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  dateFilter === 'bulan_ini'
                    ? 'bg-white text-charcoal-900 shadow-luxury font-bold border border-warm-200'
                    : 'text-charcoal-600 hover:text-charcoal-900'
                }`}
              >
                Bulan Ini
              </button>
              <button
                type="button"
                onClick={() => setDateFilter('per_bulan')}
                className={`flex-1 sm:flex-none text-center px-2.5 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  dateFilter === 'per_bulan'
                    ? 'bg-white text-charcoal-900 shadow-luxury font-bold border border-warm-200'
                    : 'text-charcoal-600 hover:text-charcoal-900'
                }`}
              >
                Per Bulan
              </button>
              <button
                type="button"
                onClick={() => setDateFilter('tahun_ini')}
                className={`flex-1 sm:flex-none text-center px-2.5 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  dateFilter === 'tahun_ini'
                    ? 'bg-white text-charcoal-900 shadow-luxury font-bold border border-warm-200'
                    : 'text-charcoal-600 hover:text-charcoal-900'
                }`}
              >
                Tahun Ini
              </button>
              <button
                type="button"
                onClick={() => setDateFilter('per_tahun')}
                className={`flex-1 sm:flex-none text-center px-2.5 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  dateFilter === 'per_tahun'
                    ? 'bg-white text-charcoal-900 shadow-luxury font-bold border border-warm-200'
                    : 'text-charcoal-600 hover:text-charcoal-900'
                }`}
              >
                Per Tahun
              </button>
              <button
                type="button"
                onClick={() => setDateFilter('semua')}
                className={`flex-1 sm:flex-none text-center px-2.5 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  dateFilter === 'semua'
                    ? 'bg-white text-charcoal-900 shadow-luxury font-bold border border-warm-200'
                    : 'text-charcoal-600 hover:text-charcoal-900'
                }`}
              >
                Semua
              </button>
              <button
                type="button"
                onClick={() => setDateFilter('kustom')}
                className={`flex-1 sm:flex-none text-center px-2.5 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  dateFilter === 'kustom'
                    ? 'bg-white text-charcoal-900 shadow-luxury font-bold border border-warm-200'
                    : 'text-charcoal-600 hover:text-charcoal-900'
                }`}
              >
                Kustom
              </button>
            </div>

            {/* Sub-selector Per Bulan */}
            {dateFilter === 'per_bulan' && (
              <div className="flex items-center gap-2 bg-[#FAF9F5] p-2 rounded-xl border border-warm-200 text-xs w-full">
                <span className="font-bold text-charcoal-700 shrink-0">Bulan:</span>
                <select
                  value={`${selectedMonthIndex}-${selectedMonthYear}`}
                  onChange={(e) => {
                    const [m, y] = e.target.value.split('-').map(Number);
                    setSelectedMonthIndex(m);
                    setSelectedMonthYear(y);
                  }}
                  className="bg-white px-2.5 py-1 rounded-lg border border-warm-200 text-charcoal-900 font-bold focus:outline-none focus:border-gold-500 shadow-2xs w-full cursor-pointer"
                >
                  {MONTH_OPTIONS.map((opt) => (
                    <option key={`${opt.month}-${opt.year}`} value={`${opt.month}-${opt.year}`}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Sub-selector Per Tahun */}
            {dateFilter === 'per_tahun' && (
              <div className="flex items-center gap-2 bg-[#FAF9F5] p-2 rounded-xl border border-warm-200 text-xs w-full">
                <span className="font-bold text-charcoal-700 shrink-0">Tahun:</span>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(Number(e.target.value))}
                  className="bg-white px-2.5 py-1 rounded-lg border border-warm-200 text-charcoal-900 font-bold focus:outline-none focus:border-gold-500 shadow-2xs w-full cursor-pointer"
                >
                  {YEAR_OPTIONS.map((opt) => (
                    <option key={opt.year} value={opt.year}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Sub-selector Kustom */}
            {dateFilter === 'kustom' && (
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 bg-[#FAF9F5] p-2 rounded-xl border border-warm-200 text-xs w-full">
                <div className="flex items-center gap-1.5 flex-1">
                  <span className="font-bold text-charcoal-700 shrink-0">Dari:</span>
                  <input
                    type="date"
                    value={customStartDate}
                    onChange={(e) => setCustomStartDate(e.target.value)}
                    className="bg-white px-2 py-1 rounded-lg border border-warm-200 text-charcoal-900 text-xs font-mono w-full"
                  />
                </div>
                <div className="flex items-center gap-1.5 flex-1">
                  <span className="font-bold text-charcoal-700 shrink-0">Sampai:</span>
                  <input
                    type="date"
                    value={customEndDate}
                    onChange={(e) => setCustomEndDate(e.target.value)}
                    className="bg-white px-2 py-1 rounded-lg border border-warm-200 text-charcoal-900 text-xs font-mono w-full"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Info Strip Periode Aktif */}
        <div className="mt-3.5 pt-3 border-t border-warm-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="w-2 h-2 rounded-full bg-gold-500 animate-pulse shrink-0" />
            <span className="text-charcoal-500 text-[11px] shrink-0">Periode Data:</span>
            <span className="font-bold text-charcoal-900 bg-gold-50 text-gold-800 px-2.5 py-0.5 rounded-full border border-gold-200 text-[11px]">
              {periodInfo.label} ({periodInfo.rangeDesc})
            </span>
          </div>

          <div className="flex items-center gap-3 text-charcoal-600 font-medium text-[11px] flex-wrap">
            <span>Stok Ready: <strong className="text-charcoal-900 font-bold">{stocksReady}</strong></span>
            <span>•</span>
            <span>Konsumen: <strong className="text-charcoal-900 font-bold">{totalCustomers}</strong></span>
            <span>•</span>
            <span>Prospek: <strong className="text-charcoal-900 font-bold">{totalLeads}</strong></span>
            <span>•</span>
            <span>Garansi: <strong className="text-gold-700 font-bold">{totalWarrantyClaimsCount}</strong></span>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. 5 METRIK UTAMA PERSIS SESUAI 5 FITUR HR MOTOR                          */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 sm:gap-4">
        {/* Fitur 1: Stok Unit */}
        <Link
          href="/stok-unit"
          className="crm-card p-3 sm:p-4 flex flex-col justify-between hover:border-gold-500 hover:shadow-luxury transition-all group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-[11px] font-bold text-charcoal-600 uppercase tracking-wider truncate">
              Stok Unit Ready
            </span>
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-gold-50 text-gold-600 border border-gold-200 flex items-center justify-center shrink-0 group-hover:bg-gold-500 group-hover:text-charcoal-950 transition-colors">
              <Car className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <div className="mt-2 sm:mt-3">
            <div className="text-xl sm:text-2xl font-black text-charcoal-900 group-hover:text-gold-600 transition-colors">
              {stocksReady} <span className="text-xs sm:text-sm font-bold text-charcoal-500">Unit</span>
            </div>
            <div className="text-[10px] sm:text-[11px] text-charcoal-500 font-medium mt-0.5 truncate flex items-center justify-between">
              <span>Total: {stocksTotal} mobil</span>
              <span className="text-gold-600 font-bold flex items-center">Buka →</span>
            </div>
          </div>
        </Link>

        {/* Fitur 2: Database Pelanggan */}
        <Link
          href="/customers"
          className="crm-card p-3 sm:p-4 flex flex-col justify-between hover:border-gold-500 hover:shadow-luxury transition-all group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-[11px] font-bold text-charcoal-600 uppercase tracking-wider truncate">
              Pelanggan
            </span>
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-warm-100 text-charcoal-800 border border-warm-200 flex items-center justify-center shrink-0 group-hover:bg-gold-500 group-hover:text-charcoal-950 transition-colors">
              <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <div className="mt-2 sm:mt-3">
            <div className="text-xl sm:text-2xl font-black text-charcoal-900 group-hover:text-gold-600 transition-colors">
              {totalCustomers} <span className="text-xs sm:text-sm font-bold text-charcoal-500">Orang</span>
            </div>
            <div className="text-[10px] sm:text-[11px] text-charcoal-500 font-medium mt-0.5 truncate flex items-center justify-between">
              <span>Database Konsumen</span>
              <span className="text-gold-600 font-bold flex items-center">Buka →</span>
            </div>
          </div>
        </Link>

        {/* Fitur 3: Leads & Pipeline */}
        <Link
          href="/leads"
          className="crm-card p-3 sm:p-4 flex flex-col justify-between hover:border-gold-500 hover:shadow-luxury transition-all group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-[11px] font-bold text-charcoal-600 uppercase tracking-wider truncate">
              Total Prospek
            </span>
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-warm-100 text-charcoal-800 border border-warm-200 flex items-center justify-center shrink-0 group-hover:bg-gold-500 group-hover:text-charcoal-950 transition-colors">
              <GitPullRequest className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <div className="mt-2 sm:mt-3">
            <div className="text-xl sm:text-2xl font-black text-charcoal-900 group-hover:text-gold-600 transition-colors">
              {totalLeads} <span className="text-xs sm:text-sm font-bold text-charcoal-500">Calon</span>
            </div>
            <div className="text-[10px] sm:text-[11px] text-charcoal-500 font-medium mt-0.5 truncate flex items-center justify-between">
              <span>3 Tahap Pipeline</span>
              <span className="text-gold-600 font-bold flex items-center">Buka →</span>
            </div>
          </div>
        </Link>

        {/* Fitur 4: Follow-up Management */}
        <Link
          href="/follow-up"
          className="crm-card p-3 sm:p-4 flex flex-col justify-between hover:border-gold-500 hover:shadow-luxury transition-all group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-[11px] font-bold text-charcoal-600 uppercase tracking-wider truncate">
              Jadwal Follow-up
            </span>
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-gold-50 text-gold-600 border border-gold-200 flex items-center justify-center shrink-0 group-hover:bg-gold-500 group-hover:text-charcoal-950 transition-colors">
              <CalendarClock className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <div className="mt-2 sm:mt-3">
            <div className="text-xl sm:text-2xl font-black text-charcoal-900 group-hover:text-gold-600 transition-colors">
              {activeFollowUps.length} <span className="text-xs sm:text-sm font-bold text-charcoal-500">Jadwal</span>
            </div>
            <div className="text-[10px] sm:text-[11px] text-charcoal-500 font-medium mt-0.5 truncate flex items-center justify-between">
              <span>Kontak Konsumen</span>
              <span className="text-gold-600 font-bold flex items-center">Buka →</span>
            </div>
          </div>
        </Link>

        {/* Fitur 5: Garansi Perbaikan (< 1 Bulan) - span 2 di mobile agar tampil luas & rapi */}
        <Link
          href="/riwayat-perbaikan"
          className="crm-card p-3 sm:p-4 flex flex-col justify-between col-span-2 sm:col-span-1 border-l-4 border-l-gold-500 hover:border-gold-600 hover:shadow-luxury transition-all group bg-gradient-to-br from-white to-[#FAF8F3]"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-[11px] font-bold text-gold-800 uppercase tracking-wider truncate flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-gold-600" />
              Garansi Perbaikan
            </span>
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-gold-100 text-gold-700 border border-gold-300 flex items-center justify-center shrink-0 group-hover:bg-gold-500 group-hover:text-charcoal-950 transition-colors">
              <ShieldCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <div className="mt-2 sm:mt-3">
            <div className="text-xl sm:text-2xl font-black text-charcoal-900 group-hover:text-gold-600 transition-colors">
              {totalWarrantyClaimsCount} <span className="text-xs sm:text-sm font-bold text-charcoal-500">Klaim</span>
            </div>
            <div className="text-[10px] sm:text-[11px] text-emerald-700 font-bold mt-0.5 truncate flex items-center justify-between">
              <span>Gratis &lt; 1 Bulan</span>
              <span className="text-gold-600 font-bold flex items-center">Buka →</span>
            </div>
          </div>
        </Link>
      </div>

      {/* ========================================================================= */}
      {/* 3. BAGIAN VISUAL: PIPELINE 3 TAHAPAN & TREN KONSUMEN (BEBAS OVERFLOW)      */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 min-w-0">
        {/* Distribusi 3 Tahapan Sales Pipeline */}
        <div className="crm-card p-3.5 sm:p-5 min-w-0 overflow-hidden">
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-warm-200">
            <div>
              <h2 className="text-xs sm:text-sm font-bold text-charcoal-900 flex items-center gap-1.5">
                <GitPullRequest className="w-4 h-4 text-gold-600" />
                <span>Distribusi 3 Tahapan Sales Pipeline</span>
              </h2>
              <p className="text-[11px] text-charcoal-500 mt-0.5">
                Prospek aktif showroom: Hanya Menanyakan, Negosiasi, dan Cek Unit
              </p>
            </div>
            <Link
              href="/leads"
              className="text-[11px] font-bold text-gold-700 hover:text-gold-800 flex items-center gap-0.5 shrink-0"
            >
              <span>Buka Pipeline</span>
              <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="h-48 sm:h-56 w-full min-w-0 overflow-hidden">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={pipelineDistribution} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#EAE8E3" />
                <XAxis dataKey="stage" tick={{ fontSize: 10, fill: '#666666' }} />
                <YAxis tick={{ fontSize: 10, fill: '#666666' }} allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#FFFFFF',
                    borderColor: '#EAE8E3',
                    borderRadius: '8px',
                    fontSize: '11px',
                    boxShadow: '0 4px 12px rgba(32,32,32,0.08)',
                  }}
                />
                <Bar dataKey="jumlah" fill="#D99A32" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Quick breakdown pills */}
          <div className="grid grid-cols-3 gap-2 mt-2 pt-2 border-t border-warm-200 text-center">
            {pipelineDistribution.map((item) => (
              <div key={item.stage} className="p-1.5 bg-warm-50 rounded-lg border border-warm-200">
                <span className="text-[10px] text-charcoal-500 block truncate">{item.stage}</span>
                <span className="text-xs sm:text-sm font-black text-charcoal-900">{item.jumlah}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Tren Konsumen & Prospek */}
        <div className="crm-card p-3.5 sm:p-5 min-w-0 overflow-hidden">
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-warm-200">
            <div>
              <h2 className="text-xs sm:text-sm font-bold text-charcoal-900 flex items-center gap-1.5">
                <Users className="w-4 h-4 text-gold-600" />
                <span>Tren Pertumbuhan Konsumen &amp; Prospek</span>
              </h2>
              <p className="text-[11px] text-charcoal-500 mt-0.5">
                Perkembangan data relasi showroom HR MOTOR
              </p>
            </div>
            <span className="text-[10px] font-bold text-charcoal-700 bg-warm-100 border border-warm-200 px-2 py-0.5 rounded shrink-0">
              {periodInfo.label}
            </span>
          </div>

          <div className="h-48 sm:h-56 w-full min-w-0 overflow-hidden">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={growthTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="prospekGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#D99A32" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#D99A32" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="pelangganGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#202020" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#202020" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#EAE8E3" />
                <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#666666' }} />
                <YAxis tick={{ fontSize: 10, fill: '#666666' }} allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#FFFFFF',
                    borderColor: '#EAE8E3',
                    borderRadius: '8px',
                    fontSize: '11px',
                    boxShadow: '0 4px 12px rgba(32,32,32,0.08)',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="prospek"
                  name="Prospek"
                  stroke="#D99A32"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#prospekGrad)"
                />
                <Area
                  type="monotone"
                  dataKey="pelanggan"
                  name="Pelanggan"
                  stroke="#202020"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#pelangganGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="flex items-center justify-center gap-4 mt-2 pt-2 border-t border-warm-200 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-gold-500" />
              <span className="text-[11px] text-charcoal-600 font-medium">Prospek Masuk</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-charcoal-900" />
              <span className="text-[11px] text-charcoal-600 font-medium">Pelanggan Terdaftar</span>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4. BANNER KESEHATAN ARMADA & GARANSI PERBAIKAN HR MOTOR                   */}
      {/* ========================================================================= */}
      <div className="crm-card p-3.5 sm:p-5 bg-gradient-to-r from-[#172018] via-[#1B221C] to-[#141414] text-white border border-emerald-500/40 relative overflow-hidden shadow-luxury">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/30">
              <ShieldCheck className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] sm:text-[11px] font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-gold-400" />
                  Kesehatan Armada Showroom
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  {fleetHealth.grade}
                </span>
              </div>
              <h3 className="text-sm sm:text-base font-black text-white mt-0.5 tracking-tight">
                {fleetHealth.healthPercentage}% Armada Mobil Bebas Kendala Garansi
              </h3>
              <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
                Garansi perbaikan gratis (&lt; 1 bulan sejak pembelian) ke bengkel rekanan rujukan HR MOTOR Garut. 100% biaya perbaikan ditanggung oleh pihak showroom.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto shrink-0 justify-between md:justify-end border-t md:border-t-0 pt-3 md:pt-0 border-white/10">
            <div className="text-left md:text-right pr-2">
              <div className="text-[10px] text-slate-400 uppercase font-bold">Biaya Ditanggung Showroom</div>
              <div className="text-sm sm:text-base font-black text-gold-400">{formatRupiah(totalWarrantyCost)}</div>
            </div>
            <Link
              href="/riwayat-perbaikan"
              className="btn-gold px-3.5 py-2 text-xs font-bold inline-flex items-center gap-1 shrink-0 shadow-md"
            >
              <span>Detail Garansi</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 5. 5 DAFTAR AKTIVITAS FITUR RESMI (VERTIKAL TERTATA DI HP, GRID DI LAPTOP)*/}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Kolom 1: Prospek Terbaru (Fitur Leads) */}
        <div className="crm-card p-3.5 sm:p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-2.5 border-b border-warm-200">
              <div className="flex items-center gap-2">
                <GitPullRequest className="w-4 h-4 text-gold-600" />
                <h3 className="text-xs font-bold text-charcoal-900">Prospek Terbaru</h3>
              </div>
              <Link href="/leads" className="text-[11px] font-bold text-gold-700 hover:underline">
                Semua ({leads.length}) →
              </Link>
            </div>

            <div className="divide-y divide-warm-200 mt-1">
              {recentLeads.length === 0 ? (
                <p className="text-xs text-charcoal-400 py-3 text-center">Belum ada prospek</p>
              ) : (
                recentLeads.map((lead) => (
                  <div key={lead.id} className="py-2.5 first:pt-1">
                    <div className="flex items-start justify-between gap-1">
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-charcoal-900 truncate">{lead.customerName}</p>
                        <p className="text-[11px] text-charcoal-500 truncate">{lead.interestedVehicle || 'Minat Unit'}</p>
                        <div className="flex items-center gap-1.5 mt-1">
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-warm-100 border border-warm-200 text-charcoal-700">
                            {normalizePipelineStage(lead.status)}
                          </span>
                        </div>
                      </div>

                      <a
                        href={formatWhatsAppLink(
                          lead.contactNumber || lead.customerPhone || '',
                          `Halo Bapak/Ibu ${lead.customerName}, salam dari HR MOTOR Garut.`
                        )}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 transition-colors shrink-0"
                        title="Chat WhatsApp"
                      >
                        <MessageCircle className="w-4 h-4" />
                      </a>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="mt-3 pt-2.5 border-t border-warm-200">
            <Link
              href="/leads"
              className="text-xs font-bold text-charcoal-700 hover:text-gold-700 flex items-center justify-between"
            >
              <span>Kelola Prospek &amp; Pipeline</span>
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* Kolom 2: Jadwal Follow-up (Fitur Follow-up) */}
        <div className="crm-card p-3.5 sm:p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-2.5 border-b border-warm-200">
              <div className="flex items-center gap-2">
                <CalendarClock className="w-4 h-4 text-gold-600" />
                <h3 className="text-xs font-bold text-charcoal-900">Jadwal Follow-up</h3>
              </div>
              <Link href="/follow-up" className="text-[11px] font-bold text-gold-700 hover:underline">
                Kelola ({activeFollowUps.length}) →
              </Link>
            </div>

            <div className="divide-y divide-warm-200 mt-1">
              {upcomingFollowUps.length === 0 ? (
                <p className="text-xs text-charcoal-400 py-3 text-center">Tidak ada jadwal tertunda</p>
              ) : (
                upcomingFollowUps.map((flw) => (
                  <div key={flw.id} className="py-2.5 first:pt-1">
                    <p className="text-xs font-bold text-charcoal-900 truncate">{flw.customerName}</p>
                    <p className="text-[11px] text-charcoal-500 truncate mt-0.5">
                      {flw.category || flw.vehicleInfo || 'Follow-up showroom'}
                    </p>
                    <div className="flex items-center gap-2 text-[10px] text-charcoal-500 mt-1">
                      <Clock className="w-3 h-3 text-gold-600 shrink-0" />
                      <span>{formatDate(flw.scheduledDate)} ({flw.scheduledTime || '09:00'} WIB)</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="mt-3 pt-2.5 border-t border-warm-200">
            <Link
              href="/follow-up"
              className="text-xs font-bold text-charcoal-700 hover:text-gold-700 flex items-center justify-between"
            >
              <span>Buka Follow-up Management</span>
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* Kolom 3: Garansi Perbaikan Terbaru (Fitur Garansi) */}
        <div className="crm-card p-3.5 sm:p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-2.5 border-b border-warm-200">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-gold-600" />
                <h3 className="text-xs font-bold text-charcoal-900">Klaim Garansi Terbaru</h3>
              </div>
              <Link href="/riwayat-perbaikan" className="text-[11px] font-bold text-gold-700 hover:underline">
                Semua ({warrantyClaims.length}) →
              </Link>
            </div>

            <div className="divide-y divide-warm-200 mt-1">
              {recentWarrantyClaims.length === 0 ? (
                <p className="text-xs text-charcoal-400 py-3 text-center">Belum ada klaim garansi</p>
              ) : (
                recentWarrantyClaims.map((claim) => (
                  <div key={claim.id} className="py-2.5 first:pt-1">
                    <div className="flex items-start justify-between gap-1">
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-charcoal-900 truncate">
                          {claim.vehicleBrand} {claim.vehicleModel}
                        </p>
                        <p className="text-[11px] text-charcoal-500 truncate">
                          {claim.customerName} • {claim.damageCategory}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[10px] font-bold text-emerald-700">
                            {formatRupiah(claim.totalCost)} (Gratis)
                          </span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 font-semibold">
                            {claim.status || 'Selesai'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="mt-3 pt-2.5 border-t border-warm-200">
            <Link
              href="/riwayat-perbaikan"
              className="text-xs font-bold text-charcoal-700 hover:text-gold-700 flex items-center justify-between"
            >
              <span>Kelola Garansi Perbaikan</span>
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* Kolom 4: Stok Unit Siap Jual (Fitur Stok Unit) */}
        <div className="crm-card p-3.5 sm:p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-2.5 border-b border-warm-200">
              <div className="flex items-center gap-2">
                <Car className="w-4 h-4 text-gold-600" />
                <h3 className="text-xs font-bold text-charcoal-900">Unit Siap Jual (Ready)</h3>
              </div>
              <Link href="/stok-unit" className="text-[11px] font-bold text-gold-700 hover:underline">
                Stok ({stocksReady}) →
              </Link>
            </div>

            <div className="divide-y divide-warm-200 mt-1">
              {readyStocksList.map((stk) => (
                <div key={stk.id} className="py-2.5 first:pt-1">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-charcoal-900 truncate">
                        {stk.brand} {stk.model} ({stk.year})
                      </p>
                      <p className="text-[10px] text-charcoal-500">
                        {stk.transmission} • {stk.color}
                      </p>
                    </div>
                    <span className="text-xs font-black text-gold-600">
                      {formatRupiah(stk.price)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-3 pt-2.5 border-t border-warm-200">
            <Link
              href="/stok-unit"
              className="text-xs font-bold text-charcoal-700 hover:text-gold-700 flex items-center justify-between"
            >
              <span>Kelola Seluruh Stok Unit</span>
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* Kolom 5: Pelanggan Showroom Terbaru (Fitur Database Pelanggan) */}
        <div className="crm-card p-3.5 sm:p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-2.5 border-b border-warm-200">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-gold-600" />
                <h3 className="text-xs font-bold text-charcoal-900">Pelanggan Showroom</h3>
              </div>
              <Link href="/customers" className="text-[11px] font-bold text-gold-700 hover:underline">
                Semua ({customers.length}) →
              </Link>
            </div>

            <div className="divide-y divide-warm-200 mt-1">
              {recentCustomers.map((cust) => (
                <div key={cust.id} className="py-2.5 first:pt-1">
                  <div className="flex items-start justify-between gap-1">
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-charcoal-900 truncate">{cust.fullName}</p>
                      <p className="text-[11px] text-charcoal-500 truncate">
                        {cust.interestedVehicle || 'Pelanggan Showroom'}
                      </p>
                      <span className="text-[10px] text-charcoal-400 block mt-0.5">
                        {cust.district || 'Tarogong Kidul, Garut'}
                      </span>
                    </div>

                    {cust.whatsapp && (
                      <a
                        href={formatWhatsAppLink(
                          cust.whatsapp,
                          `Halo Bapak/Ibu ${cust.fullName}, salam dari HR MOTOR Garut.`
                        )}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 transition-colors shrink-0"
                        title="Chat WhatsApp"
                      >
                        <MessageCircle className="w-4 h-4" />
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-3 pt-2.5 border-t border-warm-200">
            <Link
              href="/customers"
              className="text-xs font-bold text-charcoal-700 hover:text-gold-700 flex items-center justify-between"
            >
              <span>Buka Database Pelanggan</span>
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* Kolom 6: Aktivitas Karyawan Terkini (Activity Logs) */}
        <div className="crm-card p-3.5 sm:p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-2.5 border-b border-warm-200">
              <div className="flex items-center gap-2">
                <History className="w-4 h-4 text-charcoal-600" />
                <h3 className="text-xs font-bold text-charcoal-900">Aktivitas Terkini</h3>
              </div>
              <Link href="/activity-logs" className="text-[11px] font-bold text-gold-700 hover:underline">
                Audit Log →
              </Link>
            </div>

            <div className="divide-y divide-warm-200 mt-1">
              {recentLogs.map((log) => (
                <div key={log.id} className="py-2 first:pt-1">
                  <div className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-gold-500 mt-1.5 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] font-bold text-charcoal-900 leading-tight">
                        {log.action}
                      </p>
                      <p className="text-[10px] text-charcoal-500 truncate mt-0.5">
                        {log.details}
                      </p>
                      <span className="text-[9px] text-charcoal-400 mt-0.5 block">
                        Oleh: {log.userName}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-3 pt-2.5 border-t border-warm-200">
            <Link
              href="/activity-logs"
              className="text-xs font-bold text-charcoal-700 hover:text-gold-700 flex items-center justify-between"
            >
              <span>Lihat Seluruh Log Aktivitas</span>
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
