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
  ShoppingBag,
  CreditCard,
  Banknote,
  UserCheck,
  Building2,
  DollarSign,
  TrendingUp,
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

  // Filtered Purchases (Sales Transactions)
  const filteredPurchases = useMemo(() => {
    if (dateFilter === 'semua') return purchases;
    return purchases.filter((p) => {
      const dStr = p.purchaseDate || p.createdAt;
      if (!dStr) return false;
      const d = new Date(dStr);
      return d >= periodInfo.start && d <= periodInfo.end;
    });
  }, [purchases, periodInfo, dateFilter]);

  // Active Purchases for Calculations
  const activePurchases = useMemo(() => {
    if (dateFilter === 'semua') return purchases;
    return filteredPurchases;
  }, [dateFilter, filteredPurchases, purchases]);

  // Helper pemisah jenis transaksi: Kredit vs Cash secara ketat (mutually exclusive)
  const isCreditSale = (p: { paymentMethod?: string; paymentType?: string }): boolean => {
    if (p.paymentType === 'Kredit') return true;
    if (p.paymentType === 'Cash') return false;
    const m = (p.paymentMethod || '').trim().toLowerCase();
    return m.startsWith('kredit') || m.includes('kredit') || m.includes('leasing') || m.includes('finance');
  };

  // 1. STOK UNIT & SOLD OUT
  const stocksTotal = (stocks || []).length;
  const stocksReady = (stocks || []).filter((s) => s.status === 'Tersedia').length;
  const stocksBooking = (stocks || []).filter((s) => s.status === 'Booking').length;

  const readyStocksList = useMemo(() => {
    return (stocks || []).filter((s) => s.status === 'Tersedia').slice(0, 4);
  }, [stocks]);

  // 2. PENJUALAN CASH vs PENJUALAN KREDIT (Partisi Saling Lepas & Akurat 100%)
  const creditPurchases = useMemo(() => {
    return activePurchases.filter((p) => isCreditSale(p));
  }, [activePurchases]);

  const cashPurchases = useMemo(() => {
    return activePurchases.filter((p) => !isCreditSale(p));
  }, [activePurchases]);

  const cashSalesCount = cashPurchases.length;
  const creditSalesCount = creditPurchases.length;

  // TOTAL UNIT SOLD OUT = Penjualan Cash + Penjualan Kredit (Konsisten Secara Matematis: Cash + Kredit)
  const totalSoldOut = useMemo(() => {
    return cashPurchases.length + creditPurchases.length;
  }, [cashPurchases.length, creditPurchases.length]);

  const totalCashNominal = useMemo(() => {
    return cashPurchases.reduce((acc, p) => acc + (p.purchasePrice || 0), 0);
  }, [cashPurchases]);

  const totalCreditNominal = useMemo(() => {
    return creditPurchases.reduce((acc, p) => acc + (p.purchasePrice || 0), 0);
  }, [creditPurchases]);

  // 3. RINCIAN BANK / LEASING KREDIT & BERAPA JUMLAH KREDIT DI SETIAP BANK
  const bankBreakdown = useMemo(() => {
    const map: Record<
      string,
      { key: string; name: string; count: number; totalAmount: number; color: string; badge: string; sampleNotes: string }
    > = {};

    creditPurchases.forEach((p) => {
      const fullText = `${p.paymentMethod || ''} ${p.notes || ''}`.toLowerCase();
      let bankKey = 'Lainnya';
      let bankName = 'Leasing Rekanan';
      let color = '#D99A32';
      let badge = 'bg-amber-50 text-amber-900 border-amber-300';

      if (fullText.includes('oto')) {
        bankKey = 'OTO';
        bankName = 'OTO Multiartha';
        color = '#D99A32'; // Gold
        badge = 'bg-gold-50 text-gold-900 border-gold-300';
      } else if (fullText.includes('mandiri') || fullText.includes('muf')) {
        bankKey = 'Mandiri';
        bankName = 'Mandiri Utama Finance (MUF)';
        color = '#2563EB'; // Blue
        badge = 'bg-blue-50 text-blue-900 border-blue-300';
      } else if (fullText.includes('adira')) {
        bankKey = 'Adira';
        bankName = 'Adira Finance';
        color = '#F59E0B'; // Amber
        badge = 'bg-amber-50 text-amber-900 border-amber-300';
      } else if (fullText.includes('bca')) {
        bankKey = 'BCA';
        bankName = 'BCA Finance';
        color = '#0284C7'; // Sky
        badge = 'bg-sky-50 text-sky-900 border-sky-300';
      }

      if (!map[bankKey]) {
        map[bankKey] = {
          key: bankKey,
          name: bankName,
          count: 0,
          totalAmount: 0,
          color,
          badge,
          sampleNotes: p.notes || '',
        };
      }
      map[bankKey].count += 1;
      map[bankKey].totalAmount += p.purchasePrice || 0;
    });

    const totalCredits = creditPurchases.length || 1;
    return Object.values(map)
      .map((item) => ({
        ...item,
        percentage: ((item.count / totalCredits) * 100).toFixed(1),
      }))
      .sort((a, b) => b.count - a.count);
  }, [creditPurchases]);

  // 4. KONSUMEN SUDAH DI-FOLLOW UP (BUKAN HANYA JADWAL)
  const followedUpList = useMemo(() => {
    return followUps.filter(
      (f) =>
        f.status === 'Sudah Dihubungi' ||
        f.status === 'Selesai' ||
        f.status === 'Berhasil Transaksi' ||
        f.status === 'Sudah Deal' ||
        f.status === 'Tertarik' ||
        Boolean(f.lastContactDate) ||
        (f.communicationLogs && f.communicationLogs.length > 0)
    );
  }, [followUps]);

  const followedUpCustomersCount = followedUpList.length;

  // 5. DATABASE PELANGGAN
  const totalCustomers = filteredCustomers.length;
  const recentCustomers = useMemo(() => {
    return (filteredCustomers.length > 0 ? filteredCustomers : customers).slice(0, 4);
  }, [filteredCustomers, customers]);

  // 6. LEADS & 3 TAHAPAN PIPELINE
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

  // 7. GARANSI PERBAIKAN (< 1 BULAN)
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
  const uniqueWarrantyCustomers = useMemo(() => {
    return new Set(warrantyClaims.map((c) => (c.customerPhone || c.customerName).trim().toLowerCase())).size;
  }, [warrantyClaims]);
  const claimRatioPercentage = useMemo(() => {
    const totalSales = purchases.length || 20;
    if (totalSales <= 0) return '0.0';
    return ((uniqueWarrantyCustomers / totalSales) * 100).toFixed(1);
  }, [uniqueWarrantyCustomers, purchases.length]);
  const fleetHealth = useMemo(() => {
    return calculateFleetHealth(claimRatioPercentage);
  }, [claimRatioPercentage]);

  const recentWarrantyClaims = useMemo(() => {
    return (filteredWarrantyClaims.length > 0 ? filteredWarrantyClaims : warrantyClaims).slice(0, 4);
  }, [filteredWarrantyClaims, warrantyClaims]);

  // Recent Sales Deals (Cash & Kredit)
  const recentDeals = useMemo(() => {
    return activePurchases.slice(0, 4);
  }, [activePurchases]);

  // 8. ACTIVITY LOGS
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
      {/* 1. TOP HEADER & FILTER PERIODE (RESPONSIF TANPA SCROLL SAMPING)           */}
      {/* ========================================================================= */}
      <div className="crm-card p-3.5 sm:p-5 bg-white border border-warm-200 relative overflow-hidden">
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
              Monitoring performa transaksi penjualan cash &amp; kredit per bank, inventaris unit ready &amp; sold out, konsumen follow-up, serta klaim garansi HR MOTOR.
            </p>
          </div>

          {/* Filter Periode */}
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

        {/* Info Strip Ringkasan Transaksi & Periode */}
        <div className="mt-3.5 pt-3 border-t border-warm-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="w-2 h-2 rounded-full bg-gold-500 animate-pulse shrink-0" />
            <span className="text-charcoal-500 text-[11px] shrink-0">Filter Periode:</span>
            <span className="font-bold text-charcoal-900 bg-gold-50 text-gold-800 px-2.5 py-0.5 rounded-full border border-gold-200 text-[11px]">
              {periodInfo.label} ({periodInfo.rangeDesc})
            </span>
          </div>

          <div className="flex items-center gap-3 text-charcoal-600 font-medium text-[11px] flex-wrap">
            <span>Terjual: <strong className="text-charcoal-900 font-bold">{totalSoldOut} Unit</strong></span>
            <span>•</span>
            <span>Tunai: <strong className="text-emerald-700 font-bold">{cashSalesCount} Unit</strong></span>
            <span>•</span>
            <span>Kredit: <strong className="text-gold-700 font-bold">{creditSalesCount} Unit</strong></span>
            <span>•</span>
            <span>Tindak Lanjut: <strong className="text-charcoal-900 font-bold">{followedUpCustomersCount} Konsumen</strong></span>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. GRUP 1: RINGKASAN PENJUALAN & STOK UNIT (4 KARTU UTAMA PENJUALAN)      */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
        {/* Kartu 1: Stok Unit Ready */}
        <Link
          href="/stok-unit"
          className="crm-card p-3 sm:p-4 flex flex-col justify-between hover:border-gold-500 hover:shadow-luxury transition-all group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-[11px] font-bold text-charcoal-600 uppercase tracking-wider truncate">
              Stok Mobil Tersedia
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
              <span>Siap Uji Kendara</span>
              <span className="text-gold-600 font-bold flex items-center">Buka →</span>
            </div>
          </div>
        </Link>

        {/* Kartu 2: Total Unit Sold Out */}
        <Link
          href="/customers"
          className="crm-card p-3 sm:p-4 flex flex-col justify-between border-l-4 border-l-gold-500 hover:border-gold-500 hover:shadow-luxury transition-all group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-[11px] font-bold text-charcoal-700 uppercase tracking-wider truncate">
              Total Mobil Terjual
            </span>
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-gold-50 text-gold-800 border border-gold-200 flex items-center justify-center shrink-0 group-hover:bg-gold-500 group-hover:text-charcoal-950 transition-colors">
              <ShoppingBag className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <div className="mt-2 sm:mt-3">
            <div className="text-xl sm:text-2xl font-black text-charcoal-950 group-hover:text-gold-600 transition-colors">
              {totalSoldOut} <span className="text-xs sm:text-sm font-bold text-charcoal-500">Unit</span>
            </div>
            <div className="text-[10px] sm:text-[11px] text-charcoal-500 font-medium mt-0.5 truncate flex items-center justify-between">
              <span className="truncate">Tunai ({cashSalesCount}) + Kredit ({creditSalesCount})</span>
              <span className="text-gold-600 font-bold flex items-center shrink-0 ml-1">Buka →</span>
            </div>
          </div>
        </Link>

        {/* Kartu 3: Total Penjualan Cash */}
        <Link
          href="/customers"
          className="crm-card p-3 sm:p-4 flex flex-col justify-between border-l-4 border-l-emerald-600 hover:border-emerald-700 hover:shadow-luxury transition-all group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-[11px] font-bold text-emerald-800 uppercase tracking-wider truncate flex items-center gap-1">
              <Banknote className="w-3.5 h-3.5 text-emerald-600" />
              Penjualan Tunai
            </span>
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center shrink-0 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
              <Banknote className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <div className="mt-2 sm:mt-3">
            <div className="text-xl sm:text-2xl font-black text-emerald-700 group-hover:text-emerald-800 transition-colors">
              {cashSalesCount} <span className="text-xs sm:text-sm font-bold text-emerald-800">Unit</span>
            </div>
            <div className="text-[10px] sm:text-[11px] text-charcoal-500 font-medium mt-0.5 truncate flex items-center justify-between">
              <span title={formatRupiah(totalCashNominal)}>Pembayaran Tunai Langsung</span>
              <span className="text-emerald-700 font-bold flex items-center">Buka →</span>
            </div>
          </div>
        </Link>

        {/* Kartu 4: Total Penjualan Kredit */}
        <Link
          href="/customers"
          className="crm-card p-3 sm:p-4 flex flex-col justify-between border-l-4 border-l-gold-500 hover:border-gold-600 hover:shadow-luxury transition-all group bg-gradient-to-br from-white to-[#FAF8F3]"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-[11px] font-bold text-gold-800 uppercase tracking-wider truncate flex items-center gap-1">
              <CreditCard className="w-3.5 h-3.5 text-gold-600" />
              Penjualan Kredit
            </span>
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-gold-100 text-gold-700 border border-gold-300 flex items-center justify-center shrink-0 group-hover:bg-gold-500 group-hover:text-charcoal-950 transition-colors">
              <CreditCard className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <div className="mt-2 sm:mt-3">
            <div className="text-xl sm:text-2xl font-black text-charcoal-900 group-hover:text-gold-600 transition-colors">
              {creditSalesCount} <span className="text-xs sm:text-sm font-bold text-gold-800">Unit</span>
            </div>
            <div className="text-[10px] sm:text-[11px] text-gold-700 font-semibold mt-0.5 truncate flex items-center justify-between">
              <span title={formatRupiah(totalCreditNominal)}>Via Bank / Leasing</span>
              <span className="text-gold-600 font-bold flex items-center">Buka →</span>
            </div>
          </div>
        </Link>
      </div>

      {/* ========================================================================= */}
      {/* 3. GRUP 2: RELASI KONSUMEN, PROSPEK & GARANSI (4 KARTU OPERASIONAL)       */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
        {/* Kartu 5: Konsumen Sudah di Follow-Up (Permintaan Pengguna: Gantikan Jadwal) */}
        <Link
          href="/follow-up"
          className="crm-card p-3 sm:p-4 flex flex-col justify-between hover:border-gold-500 hover:shadow-luxury transition-all group border-l-4 border-l-blue-500 bg-blue-50/20"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-[11px] font-bold text-blue-900 uppercase tracking-wider truncate flex items-center gap-1">
              <UserCheck className="w-3.5 h-3.5 text-blue-600" />
              Sudah Follow-Up
            </span>
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-blue-100 text-blue-700 border border-blue-200 flex items-center justify-center shrink-0 group-hover:bg-blue-600 group-hover:text-white transition-colors">
              <UserCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <div className="mt-2 sm:mt-3">
            <div className="text-xl sm:text-2xl font-black text-blue-950 group-hover:text-blue-700 transition-colors">
              {followedUpCustomersCount} <span className="text-xs sm:text-sm font-bold text-blue-700">Konsumen</span>
            </div>
            <div className="text-[10px] sm:text-[11px] text-blue-800 font-medium mt-0.5 truncate flex items-center justify-between">
              <span>Telah Dihubungi Sales</span>
              <span className="text-blue-700 font-bold flex items-center">Kelola →</span>
            </div>
          </div>
        </Link>

        {/* Kartu 6: Database Pelanggan */}
        <Link
          href="/customers"
          className="crm-card p-3 sm:p-4 flex flex-col justify-between hover:border-gold-500 hover:shadow-luxury transition-all group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-[11px] font-bold text-charcoal-600 uppercase tracking-wider truncate">
              Database Pelanggan
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
              <span>Konsumen Terdaftar</span>
              <span className="text-gold-600 font-bold flex items-center">Buka →</span>
            </div>
          </div>
        </Link>

        {/* Kartu 7: Total Prospek */}
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
              <span>3 Tahapan Interaksi</span>
              <span className="text-gold-600 font-bold flex items-center">Buka →</span>
            </div>
          </div>
        </Link>

        {/* Kartu 8: Garansi Perbaikan */}
        <Link
          href="/riwayat-perbaikan"
          className="crm-card p-3 sm:p-4 flex flex-col justify-between border-l-4 border-l-gold-500 hover:border-gold-600 hover:shadow-luxury transition-all group bg-gradient-to-br from-white to-[#FAF8F3]"
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
      {/* 4. BAGIAN KHUSUS: PENYALURAN KREDIT PER BANK & DISTRIBUSI PIPELINE        */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 min-w-0">
        {/* Kolom Kiri: Penyaluran Kredit per Bank / Leasing Rekanan (Permintaan Khusus User) */}
        <div className="crm-card p-3.5 sm:p-5 min-w-0 overflow-hidden flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3 pb-2.5 border-b border-warm-200">
              <div>
                <h2 className="text-xs sm:text-sm font-bold text-charcoal-900 flex items-center gap-1.5">
                  <Building2 className="w-4 h-4 text-gold-600 shrink-0" />
                  <span>Penyaluran Kredit per Bank / Leasing Rekanan</span>
                </h2>
                <p className="text-[11px] text-charcoal-500 mt-0.5">
                  Rincian bank tujuan pembiayaan kredit &amp; jumlah unit kredit di setiap bank
                </p>
              </div>
              <span className="badge-gold font-bold text-xs shrink-0">
                {creditSalesCount} Unit Kredit
              </span>
            </div>

            {/* List Bank & Jumlah Kredit */}
            <div className="space-y-3 mt-3">
              {bankBreakdown.length === 0 ? (
                <div className="p-4 text-center text-xs text-charcoal-400 bg-warm-50 rounded-xl">
                  Belum ada transaksi kredit pada periode yang dipilih
                </div>
              ) : (
                bankBreakdown.map((bank, index) => (
                  <div
                    key={bank.key}
                    className="p-3 bg-[#FAF9F5] border border-warm-200 rounded-xl hover:border-gold-400 transition-all space-y-1.5"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="w-5 h-5 rounded-md bg-gold-100 text-gold-900 border border-gold-300 text-[10px] font-black flex items-center justify-center shrink-0">
                          {index + 1}
                        </span>
                        <div className="min-w-0">
                          <h4 className="text-xs font-bold text-charcoal-900 truncate">{bank.name}</h4>
                          <span className="text-[10px] text-charcoal-500">
                            Total Pembiayaan: <strong>{formatRupiah(bank.totalAmount)}</strong>
                          </span>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="text-xs sm:text-sm font-black text-charcoal-950">
                          {bank.count} <span className="text-[10px] text-charcoal-500 font-bold">Unit</span>
                        </span>
                        <span className="text-[10px] text-gold-700 font-extrabold block">
                          {bank.percentage}% Pangsa
                        </span>
                      </div>
                    </div>

                    {/* Progress Bar Persentase */}
                    <div className="w-full bg-warm-200 h-1.5 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${bank.percentage}%`,
                          backgroundColor: bank.color,
                        }}
                      />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Footer Info Bank Rekanan */}
          <div className="mt-3.5 pt-2.5 border-t border-warm-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] text-charcoal-500">
            <span>
              Total Nilai Kredit: <strong className="text-charcoal-900 font-bold">{formatRupiah(totalCreditNominal)}</strong>
            </span>
            <span className="text-gold-700 font-semibold">
              Mitra Resmi: OTO Multiartha, Mandiri Utama Finance, Adira Finance, BCA Finance
            </span>
          </div>
        </div>

        {/* Kolom Kanan: Distribusi 3 Tahapan Sales Pipeline */}
        <div className="crm-card p-3.5 sm:p-5 min-w-0 overflow-hidden flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3 pb-2.5 border-b border-warm-200">
              <div>
                <h2 className="text-xs sm:text-sm font-bold text-charcoal-900 flex items-center gap-1.5">
                  <GitPullRequest className="w-4 h-4 text-gold-600 shrink-0" />
                  <span>Distribusi 3 Tahapan Prospek Penjualan</span>
                </h2>
                <p className="text-[11px] text-charcoal-500 mt-0.5">
                  Prospek aktif calon pembeli mobil showroom
                </p>
              </div>
              <Link
                href="/leads"
                className="text-[11px] font-bold text-gold-700 hover:text-gold-800 flex items-center gap-0.5 shrink-0"
              >
                <span>Buka Alur Penjualan</span>
                <ArrowUpRight className="w-3 h-3" />
              </Link>
            </div>

            <div className="h-44 sm:h-52 w-full min-w-0 overflow-hidden">
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

          <div className="mt-3.5 pt-2.5 border-t border-warm-200 flex items-center justify-between text-[11px]">
            <span className="text-charcoal-500">Total Prospek Aktif: <strong className="text-charcoal-900">{totalLeads} Calon</strong></span>
            <Link href="/leads" className="text-gold-700 font-bold hover:underline">
              Kelola Alur Penjualan →
            </Link>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 5. TREN PERTUMBUHAN KONSUMEN & PROSPEK                                    */}
      {/* ========================================================================= */}
      <div className="crm-card p-3.5 sm:p-5 min-w-0 overflow-hidden">
        <div className="flex items-center justify-between mb-3 pb-2 border-b border-warm-200">
          <div>
            <h2 className="text-xs sm:text-sm font-bold text-charcoal-900 flex items-center gap-1.5">
              <Users className="w-4 h-4 text-gold-600" />
              <span>Tren Pertumbuhan Konsumen &amp; Prospek Showroom</span>
            </h2>
            <p className="text-[11px] text-charcoal-500 mt-0.5">
              Akumulasi data hubungan pelanggan showroom HR MOTOR Garut ({periodInfo.label})
            </p>
          </div>
          <span className="text-[10px] font-bold text-charcoal-700 bg-warm-100 border border-warm-200 px-2 py-0.5 rounded shrink-0">
            {periodInfo.label}
          </span>
        </div>

        <div className="h-44 sm:h-56 w-full min-w-0 overflow-hidden">
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

      {/* ========================================================================= */}
      {/* 6. 6 FEED AKTIVITAS FITUR RESMI SHOWROOM                                  */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Kolom 1: Transaksi Deal Terbaru (Menampilkan Status Cash / Kredit & Bank) */}
        <div className="crm-card p-3.5 sm:p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-2.5 border-b border-warm-200">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-4 h-4 text-gold-600" />
                <h3 className="text-xs font-bold text-charcoal-900">Transaksi Deal Terbaru</h3>
              </div>
              <Link href="/customers" className="text-[11px] font-bold text-gold-700 hover:underline">
                Semua ({totalSoldOut}) →
              </Link>
            </div>

            <div className="divide-y divide-warm-200 mt-1">
              {recentDeals.map((deal) => {
                const isKredit = isCreditSale(deal);
                return (
                  <div key={deal.id} className="py-2.5 first:pt-1">
                    <div className="flex items-start justify-between gap-1">
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-charcoal-900 truncate">
                          {deal.vehicleBrand} {deal.vehicleModel}
                        </p>
                        <p className="text-[11px] text-charcoal-500 truncate">
                          {deal.customerName} {deal.plateNumber ? `• [${deal.plateNumber}]` : ''}
                        </p>
                        <div className="flex items-center gap-1.5 mt-1">
                          <span
                            className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded border ${
                              isKredit
                                ? 'bg-gold-50 text-gold-900 border-gold-300'
                                : 'bg-emerald-50 text-emerald-900 border-emerald-300'
                            }`}
                          >
                            {deal.paymentMethod || 'Cash'}
                          </span>
                        </div>
                      </div>
                      <span className="text-xs font-black text-charcoal-900 shrink-0">
                        {formatRupiah(deal.purchasePrice)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-3 pt-2.5 border-t border-warm-200">
            <Link
              href="/customers"
              className="text-xs font-bold text-charcoal-700 hover:text-gold-700 flex items-center justify-between"
            >
              <span>Lihat Seluruh Penjualan Deal</span>
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* Kolom 2: Konsumen yang Sudah Di-Follow Up */}
        <div className="crm-card p-3.5 sm:p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-2.5 border-b border-warm-200">
              <div className="flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-blue-600" />
                <h3 className="text-xs font-bold text-charcoal-900">Konsumen Sudah Dihubungi</h3>
              </div>
              <Link href="/follow-up" className="text-[11px] font-bold text-gold-700 hover:underline">
                Kelola ({followedUpCustomersCount}) →
              </Link>
            </div>

            <div className="divide-y divide-warm-200 mt-1">
              {followedUpList.length === 0 ? (
                <p className="text-xs text-charcoal-400 py-3 text-center">Belum ada konsumen yang di-follow up</p>
              ) : (
                followedUpList.slice(0, 4).map((flw) => (
                  <div key={flw.id} className="py-2.5 first:pt-1">
                    <p className="text-xs font-bold text-charcoal-900 truncate">{flw.customerName}</p>
                    <p className="text-[11px] text-charcoal-500 truncate mt-0.5">
                      {flw.vehicleInfo || flw.category || 'Tindak lanjut showroom'}
                    </p>
                    <div className="flex items-center gap-1.5 text-[10px] text-blue-800 font-semibold mt-1">
                      <Check className="w-3 h-3 text-blue-600 shrink-0" />
                      <span>{flw.status} {flw.lastContactDate ? `(${formatDate(flw.lastContactDate)})` : ''}</span>
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
              <span>Buka Jadwal Tindak Lanjut</span>
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* Kolom 3: Klaim Garansi Perbaikan Terbaru */}
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

        {/* Kolom 4: Prospek Terbaru (Leads & Pipeline) */}
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
              <span>Kelola Prospek &amp; Penjualan</span>
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* Kolom 5: Unit Siap Jual (Ready Stock) */}
        <div className="crm-card p-3.5 sm:p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-2.5 border-b border-warm-200">
              <div className="flex items-center gap-2">
                <Car className="w-4 h-4 text-gold-600" />
                <h3 className="text-xs font-bold text-charcoal-900">Mobil Siap Jual (Tersedia)</h3>
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

        {/* Kolom 6: Pelanggan Showroom Terbaru */}
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
      </div>
    </div>
  );
}
