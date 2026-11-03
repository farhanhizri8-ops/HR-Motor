'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import {
  Users,
  Target,
  GitPullRequest,
  CalendarClock,
  AlertTriangle,
  Trophy,
  TrendingUp,
  ArrowUpRight,
  MessageCircle,
  Clock,
  CheckCircle2,
  Calendar,
  Filter,
  Car,
  ChevronRight,
  Wrench,
  ShieldCheck,
  Sparkles,
  LayoutDashboard,
  BarChart3,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { useCrm } from '@/context/CrmContext';
import { ReportsAnalyticsView } from '@/components/ReportsAnalyticsView';

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
  { year: 2026, label: 'Tahun 2026 (Tahun Ini)' },
  { year: 2025, label: 'Tahun 2025' },
  { year: 2024, label: 'Tahun 2024' },
];

export default function DashboardPage() {
  const {
    metrics,
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

  const [dashboardTab, setDashboardTab] = useState<'operasional' | 'reports'>('operasional');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const tab = new URLSearchParams(window.location.search).get('tab');
      if (tab === 'reports') {
        setDashboardTab('reports');
      }
    }
  }, []);

  const [dateFilter, setDateFilter] = useState<DateFilterType>('bulan_ini');
  const [selectedMonthIndex, setSelectedMonthIndex] = useState<number>(10); // Nov
  const [selectedMonthYear, setSelectedMonthYear] = useState<number>(2026);
  const [selectedYear, setSelectedYear] = useState<number>(2026);
  const [customStartDate, setCustomStartDate] = useState('2026-10-01');
  const [customEndDate, setCustomEndDate] = useState('2026-11-03');

  // Exact period boundary computation
  const periodInfo = useMemo(() => {
    let start = new Date(2026, 0, 1, 0, 0, 0);
    let end = new Date(2026, 11, 31, 23, 59, 59);
    let label = 'Tahun 2026';
    let rangeDesc = '1 Jan 2026 - 31 Des 2026';

    if (dateFilter === 'hari_ini') {
      const todayStr = '2026-11-02';
      start = new Date(`${todayStr}T00:00:00`);
      end = new Date(`${todayStr}T23:59:59`);
      label = 'Hari Ini';
      rangeDesc = '2 Nov 2026';
    } else if (dateFilter === 'minggu_ini') {
      start = new Date('2026-10-27T00:00:00');
      end = new Date('2026-11-03T23:59:59');
      label = 'Minggu Ini';
      rangeDesc = '27 Okt - 3 Nov 2026';
    } else if (dateFilter === 'bulan_ini') {
      start = new Date(2026, 10, 1, 0, 0, 0);
      end = new Date(2026, 11, 0, 23, 59, 59);
      label = 'Bulan Ini (November 2026)';
      rangeDesc = '1 Nov 2026 - 30 Nov 2026';
    } else if (dateFilter === 'per_bulan') {
      start = new Date(selectedMonthYear, selectedMonthIndex, 1, 0, 0, 0);
      end = new Date(selectedMonthYear, selectedMonthIndex + 1, 0, 23, 59, 59);
      const mNames = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
      label = `Bulan ${mNames[selectedMonthIndex]} ${selectedMonthYear}`;
      rangeDesc = `1 - ${end.getDate()} ${mNames[selectedMonthIndex]} ${selectedMonthYear}`;
    } else if (dateFilter === 'tahun_ini') {
      start = new Date(2026, 0, 1, 0, 0, 0);
      end = new Date(2026, 11, 31, 23, 59, 59);
      label = 'Tahun Ini (2026)';
      rangeDesc = '1 Jan 2026 - 31 Des 2026';
    } else if (dateFilter === 'per_tahun') {
      start = new Date(selectedYear, 0, 1, 0, 0, 0);
      end = new Date(selectedYear, 11, 31, 23, 59, 59);
      label = `Tahun ${selectedYear}`;
      rangeDesc = `1 Jan ${selectedYear} - 31 Des ${selectedYear}`;
    } else if (dateFilter === 'semua') {
      start = new Date(2020, 0, 1, 0, 0, 0);
      end = new Date(2030, 11, 31, 23, 59, 59);
      label = 'Semua Waktu';
      rangeDesc = 'Seluruh data showroom';
    } else if (dateFilter === 'kustom') {
      start = new Date(`${customStartDate}T00:00:00`);
      end = new Date(`${customEndDate}T23:59:59`);
      label = 'Rentang Kustom';
      rangeDesc = `${customStartDate} s/d ${customEndDate}`;
    }

    return { start, end, label, rangeDesc };
  }, [dateFilter, selectedMonthIndex, selectedMonthYear, selectedYear, customStartDate, customEndDate]);

  // Actual filtered data across all entities
  const filteredLeads = useMemo(() => {
    if (dateFilter === 'semua') return leads;
    return leads.filter((l) => {
      const dStr = l.dateReceived || l.createdAt;
      if (!dStr) return false;
      const d = new Date(dStr);
      return d >= periodInfo.start && d <= periodInfo.end;
    });
  }, [leads, periodInfo, dateFilter]);

  const filteredPurchases = useMemo(() => {
    if (dateFilter === 'semua') return purchases;
    return purchases.filter((p) => {
      const dStr = p.purchaseDate || p.createdAt;
      if (!dStr) return false;
      const d = new Date(dStr);
      return d >= periodInfo.start && d <= periodInfo.end;
    });
  }, [purchases, periodInfo, dateFilter]);

  const filteredCustomers = useMemo(() => {
    if (dateFilter === 'semua') return customers;
    return customers.filter((c) => {
      const dStr = c.registeredDate;
      if (!dStr) return false;
      const d = new Date(dStr);
      return d >= periodInfo.start && d <= periodInfo.end;
    });
  }, [customers, periodInfo, dateFilter]);

  const filteredFollowUps = useMemo(() => {
    if (dateFilter === 'semua') return followUps;
    return followUps.filter((f) => {
      const dStr = f.scheduledDate || f.createdAt;
      if (!dStr) return false;
      const d = new Date(dStr);
      return d >= periodInfo.start && d <= periodInfo.end;
    });
  }, [followUps, periodInfo, dateFilter]);

  // Dynamic KPI Metrics
  const periodDealsCount = useMemo(() => {
    if (filteredPurchases.length > 0) return filteredPurchases.length;
    return filteredLeads.filter((l) => l.status === 'Deal').length;
  }, [filteredPurchases, filteredLeads]);

  const periodOmzet = useMemo(() => {
    const pSum = filteredPurchases.reduce((acc, p) => acc + (p.purchasePrice || 0), 0);
    if (pSum > 0) return pSum;
    const dealLeads = filteredLeads.filter((l) => l.status === 'Deal');
    return dealLeads.reduce((acc, l) => acc + (l.dealValue || l.estimatedBudget || 0), 0);
  }, [filteredPurchases, filteredLeads]);

  const periodConversionRate = useMemo(() => {
    const deals = filteredLeads.filter((l) => l.status === 'Deal').length;
    const lost = filteredLeads.filter((l) => l.status === 'Lost').length;
    const resolved = deals + lost;
    if (resolved > 0) {
      return ((deals / resolved) * 100).toFixed(1);
    }
    if (filteredLeads.length > 0 && deals > 0) {
      return ((deals / filteredLeads.length) * 100).toFixed(1);
    }
    return '0.0';
  }, [filteredLeads]);

  // Lead Source Chart Data (Dynamic based on selected period)
  const leadSourceData = useMemo(() => {
    const counts: Record<string, number> = {
      Facebook: 0,
      Instagram: 0,
      TikTok: 0,
      WhatsApp: 0,
      'Walk-in': 0,
      Referral: 0,
      Other: 0,
    };
    filteredLeads.forEach((l) => {
      if (counts[l.leadSource] !== undefined) {
        counts[l.leadSource]++;
      } else {
        counts['Other']++;
      }
    });

    return Object.entries(counts).map(([name, total]) => ({
      name,
      total,
    }));
  }, [filteredLeads]);

  // Pipeline Stage Distribution Chart Data (Dynamic based on selected period)
  const pipelineDistribution = useMemo(() => {
    const stages = [
      'Menanyakan Unit',
      'Tertarik',
      'Cek Unit',
      'Negosiasi',
      'Deal',
      'Lost',
    ];

    return stages.map((st) => ({
      stage: st,
      jumlah: filteredLeads.filter((l) => l.status === st).length,
    }));
  }, [filteredLeads]);

  // Dynamic Growth Trend Data (Monthly for per-year view, Weekly for per-month view)
  const growthTrendData = useMemo(() => {
    // If viewing per month, breakdown by weeks
    if (dateFilter === 'bulan_ini' || dateFilter === 'per_bulan') {
      const targetYear = dateFilter === 'bulan_ini' ? 2026 : selectedMonthYear;
      const targetMonth = dateFilter === 'bulan_ini' ? 10 : selectedMonthIndex;
      const weeks = [
        { name: 'Mg 1 (1-7)', startDay: 1, endDay: 7 },
        { name: 'Mg 2 (8-14)', startDay: 8, endDay: 14 },
        { name: 'Mg 3 (15-21)', startDay: 15, endDay: 21 },
        { name: 'Mg 4 (22-28)', startDay: 22, endDay: 28 },
        { name: 'Mg 5 (29-31)', startDay: 29, endDay: 31 },
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
          bulan: w.name,
          prospek: pCount,
          pelanggan: cCount,
        };
      });
    }

    // Default: 12 months view of the selected year
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
        bulan: lbl,
        prospek: pCount,
        pelanggan: cCount,
      };
    });
  }, [dateFilter, selectedMonthIndex, selectedMonthYear, selectedYear, leads, customers]);

  // Refined Luxury Showroom Color Palette (Gold & Charcoal tones, NO rainbow)
  const SOURCE_COLORS = [
    '#D99A32', // Gold Primary
    '#F0AD45', // Warm Gold
    '#B87E23', // Deep Gold
    '#202020', // Charcoal Black
    '#363636', // Charcoal Medium
    '#666666', // Charcoal Grey
    '#926017', // Antique Gold
  ];

  const availableStocksCount = useMemo(() => {
    return (stocks || []).filter((s) => s.status === 'Tersedia').length;
  }, [stocks]);

  const upcomingFollowUps = useMemo(() => {
    if (filteredFollowUps.length > 0) {
      return filteredFollowUps.slice(0, 4);
    }
    return followUps.filter((f) => f.status !== 'Selesai' && f.status !== 'Dibatalkan').slice(0, 4);
  }, [filteredFollowUps, followUps]);

  const recentDeals = useMemo(() => {
    if (filteredPurchases.length > 0) return filteredPurchases.slice(0, 4);
    return purchases.slice(0, 4);
  }, [filteredPurchases, purchases]);

  const recentLeads = useMemo(() => {
    if (filteredLeads.length > 0) return filteredLeads.slice(0, 4);
    return leads.slice(0, 4);
  }, [filteredLeads, leads]);

  const recentLogs = activityLogs.slice(0, 5);
  const warrantyClaimCount = repairClaims.filter((r) => r.claimType === 'Garansi').length;

  return (
    <div className="space-y-6">
      {/* Dashboard Executive Mode Switcher: Operasional vs Reports & Analytics */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-2.5 sm:p-3 rounded-2xl border border-warm-200 shadow-xs">
        <div className="grid grid-cols-2 sm:flex sm:items-center gap-1.5 p-1 bg-warm-100 rounded-xl w-full sm:w-auto">
          <button
            type="button"
            onClick={() => {
              setDashboardTab('operasional');
              if (typeof window !== 'undefined') {
                window.history.replaceState(null, '', '/');
              }
            }}
            className={`flex items-center justify-center gap-1.5 sm:gap-2 px-2.5 sm:px-4 py-2 sm:py-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer text-center ${
              dashboardTab === 'operasional'
                ? 'bg-charcoal-900 text-gold-400 shadow-luxury'
                : 'text-charcoal-600 hover:text-charcoal-950 hover:bg-white/70'
            }`}
          >
            <LayoutDashboard className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
            <span className="truncate">Operasional</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setDashboardTab('reports');
              if (typeof window !== 'undefined') {
                window.history.replaceState(null, '', '/?tab=reports');
              }
            }}
            className={`flex items-center justify-center gap-1.5 sm:gap-2 px-2.5 sm:px-4 py-2 sm:py-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer text-center ${
              dashboardTab === 'reports'
                ? 'bg-charcoal-900 text-gold-400 shadow-luxury'
                : 'text-charcoal-600 hover:text-charcoal-950 hover:bg-white/70'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gold-500 shrink-0" />
            <span className="truncate">Reports & Analytics</span>
            <span className="hidden md:inline-block px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-gold-500/20 text-gold-700">
              Lengkap
            </span>
          </button>
        </div>

        <div className="flex items-center gap-2 text-[11px] text-charcoal-500 font-medium px-1 sm:px-2">
          {dashboardTab === 'reports' ? (
            <span className="truncate">Analisis eksekutif penjualan, tren bulanan, saluran promosi, dan ekspor</span>
          ) : (
            <span className="truncate">Ringkasan aktivitas transaksi, stok unit, dan follow-up showroom</span>
          )}
        </div>
      </div>

      {dashboardTab === 'reports' ? (
        <ReportsAnalyticsView />
      ) : (
        <>
          {/* Top Luxury Banner & Showroom Identity */}
          <div className="crm-card p-6 bg-white border border-warm-200 relative overflow-hidden">
        {/* Subtle decorative gold light accent */}
        <div className="absolute top-0 right-0 w-80 h-full bg-gradient-to-l from-gold-50/70 via-gold-50/20 to-transparent pointer-events-none" />

        <div className="relative flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="badge-gold">
                <span className="w-1.5 h-1.5 rounded-full bg-gold-500 animate-pulse" />
                Showroom Operasional
              </span>
              <span className="text-xs text-warm-400">•</span>
              <span className="text-xs text-charcoal-500 font-medium">Garut, Jawa Barat</span>
            </div>

            <h1 className="text-xl sm:text-2xl font-black text-charcoal-900 tracking-tight">
              Selamat Bertugas, {currentUser.name}
            </h1>
            <p className="text-xs text-charcoal-500 max-w-2xl leading-relaxed">
              Monitoring performa penjualan mobil bekas, status stok unit showroom, dan manajemen relasi konsumen HR MOTOR Garut secara real-time.
            </p>
          </div>

          {/* Date Filter Controls with Per Tahun & Per Bulan Support */}
          <div className="flex flex-col gap-2 shrink-0">
            <div className="flex flex-wrap items-center gap-1.5 p-1 bg-warm-100 rounded-xl border border-warm-200">
              <button
                type="button"
                onClick={() => setDateFilter('bulan_ini')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
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
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
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
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
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
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  dateFilter === 'per_tahun'
                    ? 'bg-white text-charcoal-900 shadow-luxury font-bold border border-warm-200'
                    : 'text-charcoal-600 hover:text-charcoal-900'
                }`}
              >
                Per Tahun
              </button>
              <button
                type="button"
                onClick={() => setDateFilter('minggu_ini')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  dateFilter === 'minggu_ini'
                    ? 'bg-white text-charcoal-900 shadow-luxury font-bold border border-warm-200'
                    : 'text-charcoal-600 hover:text-charcoal-900'
                }`}
              >
                Minggu Ini
              </button>
              <button
                type="button"
                onClick={() => setDateFilter('hari_ini')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  dateFilter === 'hari_ini'
                    ? 'bg-white text-charcoal-900 shadow-luxury font-bold border border-warm-200'
                    : 'text-charcoal-600 hover:text-charcoal-900'
                }`}
              >
                Hari Ini
              </button>
              <button
                type="button"
                onClick={() => setDateFilter('semua')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
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
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  dateFilter === 'kustom'
                    ? 'bg-white text-charcoal-900 shadow-luxury font-bold border border-warm-200'
                    : 'text-charcoal-600 hover:text-charcoal-900'
                }`}
              >
                Kustom
              </button>
            </div>

            {/* Sub-selector for Per Bulan */}
            {dateFilter === 'per_bulan' && (
              <div className="flex items-center gap-2 bg-[#FAF9F5] p-2 rounded-xl border border-warm-200 text-xs">
                <span className="font-bold text-charcoal-700">Pilih Bulan:</span>
                <select
                  value={`${selectedMonthIndex}-${selectedMonthYear}`}
                  onChange={(e) => {
                    const [m, y] = e.target.value.split('-').map(Number);
                    setSelectedMonthIndex(m);
                    setSelectedMonthYear(y);
                  }}
                  className="bg-white px-3 py-1 rounded-lg border border-warm-200 text-charcoal-900 font-bold focus:outline-none focus:border-gold-500 shadow-xs cursor-pointer"
                >
                  {MONTH_OPTIONS.map((opt) => (
                    <option key={`${opt.month}-${opt.year}`} value={`${opt.month}-${opt.year}`}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Sub-selector for Per Tahun */}
            {dateFilter === 'per_tahun' && (
              <div className="flex items-center gap-2 bg-[#FAF9F5] p-2 rounded-xl border border-warm-200 text-xs">
                <span className="font-bold text-charcoal-700">Pilih Tahun:</span>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(Number(e.target.value))}
                  className="bg-white px-3 py-1 rounded-lg border border-warm-200 text-charcoal-900 font-bold focus:outline-none focus:border-gold-500 shadow-xs cursor-pointer"
                >
                  {YEAR_OPTIONS.map((opt) => (
                    <option key={opt.year} value={opt.year}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Sub-selector for Kustom Range */}
            {dateFilter === 'kustom' && (
              <div className="flex flex-wrap items-center gap-2 bg-[#FAF9F5] p-2 rounded-xl border border-warm-200 text-xs">
                <span className="font-bold text-charcoal-700">Dari:</span>
                <input
                  type="date"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  className="bg-white px-2 py-1 rounded-lg border border-warm-200 text-charcoal-900 text-xs font-mono"
                />
                <span className="font-bold text-charcoal-700">Sampai:</span>
                <input
                  type="date"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  className="bg-white px-2 py-1 rounded-lg border border-warm-200 text-charcoal-900 text-xs font-mono"
                />
              </div>
            )}
          </div>
        </div>

        {/* Active Period Info Strip */}
        <div className="mt-4 pt-3 border-t border-warm-200 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-gold-500 animate-pulse shrink-0" />
            <span className="text-charcoal-500 text-xs shrink-0">Filter Aktif:</span>
            <span className="font-bold text-charcoal-900 bg-gold-50 text-gold-800 px-2.5 py-0.5 rounded-full border border-gold-200 text-xs truncate max-w-[280px]">
              {periodInfo.label} ({periodInfo.rangeDesc})
            </span>
          </div>
          <div className="grid grid-cols-2 sm:flex sm:items-center gap-2 sm:gap-4 text-charcoal-600 font-medium text-[11px] bg-warm-50 sm:bg-transparent p-2 sm:p-0 rounded-xl">
            <span>Prospek: <strong className="text-charcoal-900 font-bold">{filteredLeads.length}</strong></span>
            <span className="hidden sm:inline">•</span>
            <span>Deal: <strong className="text-emerald-700 font-bold">{periodDealsCount}</strong></span>
            <span className="hidden sm:inline">•</span>
            <span className="truncate">Omzet: <strong className="text-gold-700 font-bold">{formatRupiah(periodOmzet)}</strong></span>
            <span className="hidden sm:inline">•</span>
            <span>Konversi: <strong className="text-charcoal-900 font-bold">{periodConversionRate}%</strong></span>
          </div>
        </div>
      </div>

      {/* 6 Key Metric Cards (Luxury Automotive Aesthetics - Connected to Filter) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 sm:gap-3.5">
        {/* Metric 1: Total Pelanggan */}
        <div className="crm-card p-3 sm:p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-[11px] font-semibold text-charcoal-500 truncate">Total Pelanggan</span>
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-gold-50 text-gold-600 border border-gold-200 flex items-center justify-center shrink-0">
              <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <div className="mt-2.5 sm:mt-3">
            <div className="text-xl sm:text-2xl font-black text-charcoal-900">{filteredCustomers.length}</div>
            <div className="text-[10px] sm:text-[11px] text-gold-700 font-semibold mt-0.5 truncate">
              {dateFilter === 'semua' ? 'Konsumen Showroom' : 'Konsumen Periode'}
            </div>
          </div>
        </div>

        {/* Metric 2: Total Prospek */}
        <div className="crm-card p-3 sm:p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-[11px] font-semibold text-charcoal-500 truncate">Total Prospek</span>
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-warm-100 text-charcoal-800 border border-warm-200 flex items-center justify-center shrink-0">
              <Target className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <div className="mt-2.5 sm:mt-3">
            <div className="text-xl sm:text-2xl font-black text-charcoal-900">{filteredLeads.length}</div>
            <div className="text-[10px] sm:text-[11px] text-charcoal-500 font-medium mt-0.5 truncate">
              <span className="font-bold text-charcoal-800">
                {filteredLeads.filter((l) => l.status !== 'Deal' && l.status !== 'Lost').length}
              </span>{' '}
              aktif pipeline
            </div>
          </div>
        </div>

        {/* Metric 3: Stok Unit Tersedia */}
        <div className="crm-card p-3 sm:p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-[11px] font-semibold text-charcoal-500 truncate">Stok Unit Ready</span>
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-gold-50 text-gold-600 border border-gold-200 flex items-center justify-center shrink-0">
              <Car className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <div className="mt-2.5 sm:mt-3">
            <div className="text-xl sm:text-2xl font-black text-gold-600">{availableStocksCount}</div>
            <div className="text-[10px] sm:text-[11px] text-charcoal-500 font-medium mt-0.5 truncate">
              Mobil Siap Jual
            </div>
          </div>
        </div>

        {/* Metric 4: Total Deal */}
        <div className="crm-card p-3 sm:p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-[11px] font-semibold text-charcoal-500 truncate">Total Deal</span>
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center shrink-0">
              <Trophy className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <div className="mt-2.5 sm:mt-3">
            <div className="text-xl sm:text-2xl font-black text-charcoal-900">{periodDealsCount}</div>
            <div className="text-[10px] sm:text-[11px] text-charcoal-500 font-medium mt-0.5 truncate" title={formatRupiah(periodOmzet)}>
              {formatRupiah(periodOmzet)}
            </div>
          </div>
        </div>

        {/* Metric 5: Tingkat Konversi */}
        <div className="crm-card p-3 sm:p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-[11px] font-semibold text-charcoal-500 truncate">Konversi Win Rate</span>
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-warm-100 text-charcoal-800 border border-warm-200 flex items-center justify-center shrink-0">
              <TrendingUp className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <div className="mt-2.5 sm:mt-3">
            <div className="text-xl sm:text-2xl font-black text-charcoal-900">{periodConversionRate}%</div>
            <div className="text-[10px] sm:text-[11px] text-charcoal-500 font-medium mt-0.5 truncate">
              {filteredLeads.filter((l) => l.status === 'Deal' || l.status === 'Lost').length} Prospek Final
            </div>
          </div>
        </div>

        {/* Metric 6: Follow-up Terjadwal */}
        <div className="crm-card p-3 sm:p-4 flex flex-col justify-between bg-gold-50/50 border-gold-200">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-[11px] font-semibold text-gold-800 truncate">
              {dateFilter === 'hari_ini' ? 'Follow-up Hari Ini' : 'Follow-up Jadwal'}
            </span>
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-gold-100 text-gold-700 border border-gold-300 flex items-center justify-center shrink-0">
              <CalendarClock className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <div className="mt-2.5 sm:mt-3">
            <div className="text-xl sm:text-2xl font-black text-gold-900">
              {filteredFollowUps.filter((f) => f.status !== 'Selesai' && f.status !== 'Dibatalkan').length}
            </div>
            <div className="text-[10px] sm:text-[11px] text-gold-700 font-medium mt-0.5 truncate">
              Kontak Konsumen
            </div>
          </div>
        </div>
      </div>

      {/* Main Charts Section (Consistent Luxury Palette) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 sm:gap-6">
        {/* Left: Customer & Lead Growth Area Chart */}
        <div className="crm-card p-4 sm:p-5 lg:col-span-2 min-w-0">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-charcoal-900">
                Tren Pertumbuhan Konsumen & Prospek
              </h2>
              <p className="text-xs text-charcoal-500">
                Akumulasi data hubungan pelanggan showroom HR MOTOR Garut
              </p>
            </div>
            <span className="text-xs font-bold text-charcoal-700 bg-warm-100 border border-warm-200 px-2.5 py-1 rounded-md">
              Bulanan
            </span>
          </div>

          <div className="h-56 sm:h-64 w-full min-w-0">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={growthTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorProspek" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#D99A32" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#D99A32" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="colorPelanggan" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#202020" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#202020" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#EAE8E3" />
                <XAxis dataKey="bulan" tick={{ fontSize: 11, fill: '#666666' }} />
                <YAxis tick={{ fontSize: 11, fill: '#666666' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#FFFFFF',
                    borderColor: '#EAE8E3',
                    borderRadius: '8px',
                    fontSize: '12px',
                    boxShadow: '0 4px 12px rgba(32,32,32,0.08)',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="prospek"
                  name="Prospek"
                  stroke="#D99A32"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#colorProspek)"
                />
                <Area
                  type="monotone"
                  dataKey="pelanggan"
                  name="Pelanggan"
                  stroke="#202020"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorPelanggan)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right: Lead Source Distribution (Clean Monochromatic Gold/Charcoal Pie) */}
        <div className="crm-card p-4 sm:p-5 min-w-0">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-charcoal-900">Saluran Masuk Calon Pembeli</h2>
              <p className="text-xs text-charcoal-500">Distribusi asal prospek showroom</p>
            </div>
          </div>

          <div className="h-56 sm:h-64 w-full min-w-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={leadSourceData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={3}
                  dataKey="total"
                >
                  {leadSourceData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={SOURCE_COLORS[index % SOURCE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#FFFFFF',
                    borderColor: '#EAE8E3',
                    borderRadius: '8px',
                    fontSize: '12px',
                    boxShadow: '0 4px 12px rgba(32,32,32,0.08)',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-warm-200">
            {leadSourceData.slice(0, 4).map((item, idx) => (
              <div key={item.name} className="flex items-center gap-2 text-[11px]">
                <span
                  className="w-2.5 h-2.5 rounded-xs shrink-0"
                  style={{ backgroundColor: SOURCE_COLORS[idx % SOURCE_COLORS.length] }}
                />
                <span className="text-charcoal-600 truncate">{item.name}</span>
                <span className="font-bold text-charcoal-900 ml-auto">{item.total}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Secondary Chart & Pipeline Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 sm:gap-6">
        {/* Pipeline Stage Distribution */}
        <div className="crm-card p-4 sm:p-5 lg:col-span-2 min-w-0">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-charcoal-900">
                Distribusi Tahapan Sales Pipeline
              </h2>
              <p className="text-xs text-charcoal-500">
                Sebaran prospek aktif pada tiap proses tawar menawar showroom
              </p>
            </div>
            <Link
              href="/pipeline"
              className="text-xs font-bold text-gold-700 hover:text-gold-800 flex items-center gap-1"
            >
              <span>Buka Kanban</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="h-56 sm:h-60 w-full min-w-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={pipelineDistribution} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#EAE8E3" />
                <XAxis dataKey="stage" tick={{ fontSize: 11, fill: '#666666' }} />
                <YAxis tick={{ fontSize: 11, fill: '#666666' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#FFFFFF',
                    borderColor: '#EAE8E3',
                    borderRadius: '8px',
                    fontSize: '12px',
                    boxShadow: '0 4px 12px rgba(32,32,32,0.08)',
                  }}
                />
                <Bar dataKey="jumlah" fill="#D99A32" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Quick Stock Status Card */}
        <div className="crm-card p-4 sm:p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-warm-200">
              <div className="flex items-center gap-2">
                <Car className="w-4 h-4 text-gold-600" />
                <h3 className="text-xs font-bold text-charcoal-900">Ringkasan Stok Showroom</h3>
              </div>
              <Link href="/stok-unit" className="text-[11px] font-bold text-gold-700 hover:underline">
                Lihat Semua
              </Link>
            </div>

            <div className="space-y-2.5 mt-3">
              <div className="flex items-center justify-between p-2.5 bg-warm-50 rounded-xl border border-warm-200">
                <span className="text-xs font-semibold text-charcoal-700">Unit Tersedia (Ready)</span>
                <span className="badge-gold font-bold">{availableStocksCount} Mobil</span>
              </div>

              <div className="flex items-center justify-between p-2.5 bg-warm-50 rounded-xl border border-warm-200">
                <span className="text-xs font-semibold text-charcoal-700">Unit Terjual (Sold)</span>
                <span className="badge-charcoal font-bold">
                  {(stocks || []).filter((s) => s.status === 'Terjual').length} Mobil
                </span>
              </div>

              <div className="flex items-center justify-between p-2.5 bg-warm-50 rounded-xl border border-warm-200">
                <span className="text-xs font-semibold text-charcoal-700">Dalam Perawatan / Salon</span>
                <span className="text-xs font-bold text-charcoal-600">
                  {(stocks || []).filter((s) => s.status === 'Tidak Aktif').length} Unit
                </span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-warm-200">
            <Link
              href="/stok-unit"
              className="btn-outline-warm w-full flex items-center justify-center gap-1.5 text-xs font-bold"
            >
              <Car className="w-3.5 h-3.5" />
              Kelola Manajemen Stok Unit
            </Link>
          </div>
        </div>
      </div>

      {/* 4 Bottom Information Columns (Enterprise Tables & Feeds) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Column 1: Prospek Terbaru */}
        <div className="crm-card p-4 flex flex-col">
          <div className="flex items-center justify-between pb-3 border-b border-warm-200">
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-gold-600" />
              <h3 className="text-xs font-bold text-charcoal-900">Prospek Terbaru</h3>
            </div>
            <Link href="/leads" className="text-[11px] font-bold text-gold-700 hover:underline">
              Semua
            </Link>
          </div>

          <div className="flex-1 divide-y divide-warm-200 mt-2">
            {recentLeads.map((lead) => (
              <div key={lead.id} className="py-2.5 first:pt-1">
                <div className="flex items-start justify-between gap-1">
                  <div>
                    <p className="text-xs font-bold text-charcoal-900">{lead.customerName}</p>
                    <p className="text-[11px] text-charcoal-500 truncate max-w-[170px]">
                      {lead.interestedVehicle}
                    </p>
                    <div className="flex items-center gap-1.5 mt-1">
                      <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-warm-100 border border-warm-200 text-charcoal-600">
                        {lead.leadSource}
                      </span>
                      <span className="text-[10px] text-charcoal-400">
                        {lead.status}
                      </span>
                    </div>
                  </div>

                  <a
                    href={formatWhatsAppLink(
                      lead.contactNumber || lead.customerPhone || '',
                      `Halo Bapak/Ibu ${lead.customerName}, salam dari HR MOTOR Garut terkait minat Anda pada unit ${lead.interestedVehicle}.`
                    )}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 transition-colors"
                    title="Hubungi WhatsApp"
                  >
                    <MessageCircle className="w-4 h-4" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Column 2: Jadwal Follow-up */}
        <div className="crm-card p-4 flex flex-col">
          <div className="flex items-center justify-between pb-3 border-b border-warm-200">
            <div className="flex items-center gap-2">
              <CalendarClock className="w-4 h-4 text-gold-600" />
              <h3 className="text-xs font-bold text-charcoal-900">Jadwal Follow-up</h3>
            </div>
            <Link href="/follow-up" className="text-[11px] font-bold text-gold-700 hover:underline">
              Kelola
            </Link>
          </div>

          <div className="flex-1 divide-y divide-warm-200 mt-2">
            {upcomingFollowUps.map((flw) => (
              <div key={flw.id} className="py-2.5 first:pt-1">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-bold text-charcoal-900">{flw.customerName}</p>
                    <p className="text-[11px] text-charcoal-500 line-clamp-1 mt-0.5">
                      {flw.category || flw.vehicleInfo}
                    </p>
                    <div className="flex items-center gap-2 text-[10px] text-charcoal-400 mt-1">
                      <Clock className="w-3 h-3 text-gold-600" />
                      <span>{flw.scheduledDate} ({flw.scheduledTime || '09:00'} WIB)</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Column 3: Deal Sukses Terbaru */}
        <div className="crm-card p-4 flex flex-col">
          <div className="flex items-center justify-between pb-3 border-b border-warm-200">
            <div className="flex items-center gap-2">
              <Trophy className="w-4 h-4 text-gold-600" />
              <h3 className="text-xs font-bold text-charcoal-900">Deal Sukses Showroom</h3>
            </div>
            <Link href="/riwayat-perbaikan" className="text-[11px] font-bold text-gold-700 hover:underline">
              Riwayat Garansi
            </Link>
          </div>

          <div className="flex-1 divide-y divide-warm-200 mt-2">
            {recentDeals.map((deal) => (
              <div key={deal.id} className="py-2.5 first:pt-1">
                <p className="text-xs font-bold text-charcoal-900">
                  {deal.vehicleBrand} {deal.vehicleModel}
                </p>
                <p className="text-[11px] text-charcoal-500">
                  Konsumen: <span className="font-semibold text-charcoal-800">{deal.customerName}</span>
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[10px] font-bold text-gold-700">
                    {formatRupiah(deal.purchasePrice)}
                  </span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-warm-100 border border-warm-200 font-semibold text-charcoal-700">
                    {deal.plateNumber}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Column 4: Audit Activity Logs */}
        <div className="crm-card p-4 flex flex-col">
          <div className="flex items-center justify-between pb-3 border-b border-warm-200">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-charcoal-600" />
              <h3 className="text-xs font-bold text-charcoal-900">Aktivitas Terkini</h3>
            </div>
            <Link href="/activity-logs" className="text-[11px] font-bold text-gold-700 hover:underline">
              Audit Log
            </Link>
          </div>

          <div className="flex-1 divide-y divide-warm-200 mt-2">
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
      </div>
        </>
      )}
    </div>
  );
}
