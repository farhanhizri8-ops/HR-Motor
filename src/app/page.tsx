'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Users,
  Target,
  GitPullRequest,
  CalendarClock,
  AlertTriangle,
  Trophy,
  XCircle,
  TrendingUp,
  ArrowUpRight,
  MessageCircle,
  Clock,
  CheckCircle2,
  Calendar,
  Filter,
  Car,
  ChevronRight,
  Flame,
  Wrench,
  ShieldCheck,
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
  Legend,
  CartesianGrid,
} from 'recharts';
import { useCrm } from '@/context/CrmContext';

type DateFilterType = 'hari_ini' | 'minggu_ini' | 'bulan_ini' | 'kustom';

export default function DashboardPage() {
  const {
    metrics,
    customers,
    leads,
    followUps,
    purchases,
    repairClaims,
    activityLogs,
    formatRupiah,
    formatDate,
    formatWhatsAppLink,
  } = useCrm();

  const [dateFilter, setDateFilter] = useState<DateFilterType>('bulan_ini');
  const [customStartDate, setCustomStartDate] = useState('2026-10-01');
  const [customEndDate, setCustomEndDate] = useState('2026-11-02');

  // Filtered data based on selected date filter
  const filteredData = useMemo(() => {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    let start = new Date();
    let end = new Date();

    if (dateFilter === 'hari_ini') {
      start = new Date(todayStr + 'T00:00:00');
      end = new Date(todayStr + 'T23:59:59');
    } else if (dateFilter === 'minggu_ini') {
      start.setDate(now.getDate() - 7);
    } else if (dateFilter === 'bulan_ini') {
      start.setDate(now.getDate() - 30);
    } else if (dateFilter === 'kustom') {
      start = new Date(customStartDate + 'T00:00:00');
      end = new Date(customEndDate + 'T23:59:59');
    }

    const filteredLeads = leads.filter((l) => {
      const d = new Date(l.dateReceived || l.createdAt);
      return d >= start && d <= end;
    });

    const filteredPurchases = purchases.filter((p) => {
      const d = new Date(p.purchaseDate || p.createdAt);
      return d >= start && d <= end;
    });

    return {
      filteredLeads,
      filteredPurchases,
    };
  }, [dateFilter, customStartDate, customEndDate, leads, purchases]);

  // Lead Source Chart Data
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
    leads.forEach((l) => {
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
  }, [leads]);

  // Pipeline Stage Distribution Chart Data
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
      jumlah: leads.filter((l) => l.status === st).length,
    }));
  }, [leads]);

  // Customer Growth Trend
  const growthTrendData = [
    { bulan: 'Mei', pelanggan: 14, prospek: 28 },
    { bulan: 'Jun', pelanggan: 18, prospek: 35 },
    { bulan: 'Jul', pelanggan: 22, prospek: 42 },
    { bulan: 'Agu', pelanggan: 27, prospek: 49 },
    { bulan: 'Sep', pelanggan: 34, prospek: 58 },
    { bulan: 'Okt', pelanggan: 42, prospek: 67 },
    { bulan: 'Nov (Berjalan)', pelanggan: customers.length, prospek: leads.length },
  ];

  // Monthly Conversion Trend
  const conversionTrendData = [
    { bulan: 'Jul', konversi: 21 },
    { bulan: 'Agu', konversi: 24 },
    { bulan: 'Sep', konversi: 28 },
    { bulan: 'Okt', konversi: 32 },
    { bulan: 'Nov', konversi: metrics.conversionRate },
  ];

  const SOURCE_COLORS = ['#3b82f6', '#ec4899', '#06b6d4', '#10b981', '#f59e0b', '#8b5cf6', '#64748b'];

  const upcomingFollowUps = followUps
    .filter((f) => f.status !== 'Selesai' && f.status !== 'Dibatalkan')
    .slice(0, 4);

  const recentDeals = purchases.slice(0, 4);
  const recentLeads = leads.slice(0, 4);
  const recentLogs = activityLogs.slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Top Banner & Date Filter */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Sistem Aktif
            </span>
            <span className="text-xs text-slate-400">•</span>
            <span className="text-xs text-slate-500 font-medium">Garut, Jawa Barat</span>
          </div>
          <h1 className="text-xl lg:text-2xl font-black text-slate-900 mt-1">
            Dashboard Performa CRM
          </h1>
          <p className="text-xs text-slate-500">
            Monitoring hubungan pelanggan, pipa penjualan mobil bekas, dan tindak lanjut sales di HR MOTOR Garut.
          </p>
        </div>

        {/* Date Filter Controls */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex p-1 bg-slate-100 rounded-xl border border-slate-200">
            <button
              onClick={() => setDateFilter('hari_ini')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                dateFilter === 'hari_ini'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Hari Ini
            </button>
            <button
              onClick={() => setDateFilter('minggu_ini')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                dateFilter === 'minggu_ini'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Minggu Ini
            </button>
            <button
              onClick={() => setDateFilter('bulan_ini')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                dateFilter === 'bulan_ini'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Bulan Ini
            </button>
            <button
              onClick={() => setDateFilter('kustom')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                dateFilter === 'kustom'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Kustom
            </button>
          </div>

          {dateFilter === 'kustom' && (
            <div className="flex items-center gap-1.5 text-xs bg-white p-1 rounded-xl border border-slate-200">
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="px-2 py-1 text-xs border border-slate-200 rounded-lg outline-none"
              />
              <span className="text-slate-400">-</span>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="px-2 py-1 text-xs border border-slate-200 rounded-lg outline-none"
              />
            </div>
          )}
        </div>
      </div>

      {/* KPI METRIC CARDS (All from actual database records) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        {/* Total Pelanggan */}
        <div className="crm-card p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500">Total Pelanggan</span>
            <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-black text-slate-900">{metrics.totalCustomers}</div>
            <div className="flex items-center gap-1 text-[11px] text-emerald-600 font-medium mt-0.5">
              <TrendingUp className="w-3 h-3" />
              <span>+{metrics.newCustomersThisMonth} bulan ini</span>
            </div>
          </div>
        </div>

        {/* Total Prospek */}
        <div className="crm-card p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500">Total Prospek</span>
            <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Target className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-black text-slate-900">{metrics.totalLeads}</div>
            <div className="text-[11px] text-slate-500 font-medium mt-0.5">
              <span className="font-bold text-indigo-600">{metrics.activeLeads}</span> aktif di pipeline
            </div>
          </div>
        </div>

        {/* Follow-up Hari Ini */}
        <div className="crm-card p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500">Follow-up Hari Ini</span>
            <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <CalendarClock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-black text-slate-900">{metrics.followUpsToday}</div>
            <div className="text-[11px] text-slate-500 font-medium mt-0.5">
              Jadwal kontak konsumen
            </div>
          </div>
        </div>

        {/* Follow-up Terlambat (CRITICAL ALERT) */}
        <div className={`crm-card p-4 flex flex-col justify-between ${
          metrics.followUpsOverdue > 0 ? 'bg-rose-50/50 border-rose-200 ring-1 ring-rose-200' : ''
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-rose-700">Follow-up Terlambat</span>
            <div className="w-7 h-7 rounded-lg bg-rose-100 text-rose-600 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-black text-rose-700">{metrics.followUpsOverdue}</div>
            <div className="text-[11px] text-rose-600 font-medium mt-0.5">
              {metrics.followUpsOverdue > 0 ? 'Perlu tindakan segera!' : 'Tepat waktu'}
            </div>
          </div>
        </div>

        {/* Total Deal & Conversion */}
        <div className="crm-card p-4 flex flex-col justify-between col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500">Total Deal & Konversi</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Trophy className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-emerald-700">{metrics.totalDeals}</span>
              <span className="text-xs font-bold text-emerald-600">({metrics.conversionRate}%)</span>
            </div>
            <div className="text-[11px] text-slate-500 font-medium mt-0.5 truncate">
              {formatRupiah(metrics.totalDealValue)}
            </div>
          </div>
        </div>
      </div>

      {/* CHARTS ROW 1: Customer Growth & Pipeline Funnel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Customer & Lead Growth Chart */}
        <div className="crm-card p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                Tren Pertumbuhan Pelanggan & Prospek
              </h2>
              <p className="text-xs text-slate-500">
                Akumulasi data relasi calon pembeli di HR MOTOR Garut (2026)
              </p>
            </div>
            <span className="text-xs font-medium text-slate-400 bg-slate-100 px-2 py-1 rounded-md">
              Bulanan
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={growthTrendData}>
                <defs>
                  <linearGradient id="colorPelanggan" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="colorProspek" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="bulan" tick={{ fontSize: 11, fill: '#64748b' }} />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                />
                <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }} />
                <Area
                  type="monotone"
                  dataKey="prospek"
                  name="Prospek Masuk"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorProspek)"
                />
                <Area
                  type="monotone"
                  dataKey="pelanggan"
                  name="Total Pelanggan Terdaftar"
                  stroke="#10b981"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorPelanggan)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Lead Source Distribution */}
        <div className="crm-card p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Sumber Prospek (Leads by Source)</h2>
              <p className="text-xs text-slate-500">Saluran asal calon pembeli mobil</p>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={leadSourceData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={4}
                  dataKey="total"
                >
                  {leadSourceData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={SOURCE_COLORS[index % SOURCE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '4px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* CHARTS ROW 2: Sales Pipeline Distribution & Conversion Rate */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pipeline Distribution Bar Chart */}
        <div className="crm-card p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Distribusi Tahapan Sales Pipeline</h2>
              <p className="text-xs text-slate-500">Jumlah calon pembeli pada tiap tahap corong penjualan</p>
            </div>
            <Link
              href="/pipeline"
              className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
            >
              Buka Kanban Board <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={pipelineDistribution}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="stage" tick={{ fontSize: 10, fill: '#64748b' }} interval={0} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#64748b' }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                />
                <Bar dataKey="jumlah" name="Jumlah Prospek" radius={[6, 6, 0, 0]} fill="#101F42" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Conversion Rate Trend */}
        <div className="crm-card p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Efektivitas Konversi (Win Rate)</h2>
              <p className="text-xs text-slate-500">Persentase prospek menjadi deal penjualan</p>
            </div>
          </div>

          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={conversionTrendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="bulan" tick={{ fontSize: 11, fill: '#64748b' }} />
                <YAxis unit="%" tick={{ fontSize: 11, fill: '#64748b' }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                  formatter={(val: any) => [`${val}%`, 'Tingkat Konversi']}
                />
                <Bar dataKey="konversi" name="Konversi (%)" radius={[6, 6, 0, 0]} fill="#10b981" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* GARANSI & PERBAIKAN SHOWROOM WIDGET */}
      <div className="crm-card p-4 bg-gradient-to-r from-slate-900 to-slate-800 text-white rounded-xl shadow-md border border-slate-700/60">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/30">
              <Wrench className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-950/60 border border-emerald-800/60 px-2 py-0.5 rounded">
                  Purna Jual Showroom
                </span>
                <span className="text-xs text-slate-300">Layanan Purna Jual & Garansi HR MOTOR Garut</span>
              </div>
              <h3 className="text-sm sm:text-base font-bold text-white mt-1">
                {repairClaims.length} Riwayat Perbaikan Tercatat • {repairClaims.filter(c => c.claimType === 'Garansi').length} Ditanggung Garansi HR MOTOR
              </h3>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/riwayat-perbaikan"
              className="px-4 py-2 text-xs font-semibold text-slate-900 bg-emerald-400 hover:bg-emerald-300 active:bg-emerald-500 rounded-lg shadow-sm transition-all flex items-center gap-1.5 whitespace-nowrap"
            >
              <span>Buka Riwayat Perbaikan Garansi</span>
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>

      {/* OPERATIONAL WIDGETS GRID: 4 COLUMNS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* 1. Prospek Terbaru (Recent Leads) with WhatsApp CTA */}
        <div className="crm-card p-4 flex flex-col">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-emerald-600" />
              <h3 className="text-xs font-bold text-slate-900">Prospek Terbaru</h3>
            </div>
            <Link href="/leads" className="text-[11px] font-semibold text-emerald-600 hover:underline">
              Semua
            </Link>
          </div>

          <div className="flex-1 divide-y divide-slate-100 mt-2">
            {recentLeads.map((lead) => (
              <div key={lead.id} className="py-2.5 first:pt-1">
                <div className="flex items-start justify-between gap-1">
                  <div>
                    <p className="text-xs font-bold text-slate-800">{lead.customerName}</p>
                    <p className="text-[11px] text-slate-500 truncate max-w-[170px]">
                      {lead.interestedVehicle}
                    </p>
                    <div className="flex items-center gap-1.5 mt-1">
                      <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded bg-slate-100 text-slate-600">
                        {lead.leadSource}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {formatDate(lead.dateReceived)}
                      </span>
                    </div>
                  </div>

                  <a
                    href={formatWhatsAppLink(
                      lead.contactNumber,
                      `Sampurasun Bapak/Ibu ${lead.customerName}, salam dari HR MOTOR Garut terkait minat unit ${lead.interestedVehicle}.`
                    )}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-colors"
                    title="Chat WhatsApp Sekarang"
                  >
                    <MessageCircle className="w-4 h-4" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 2. Jadwal Follow-up Mendatang (Upcoming Follow-ups) */}
        <div className="crm-card p-4 flex flex-col">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <CalendarClock className="w-4 h-4 text-amber-600" />
              <h3 className="text-xs font-bold text-slate-900">Jadwal Follow-up</h3>
            </div>
            <Link href="/follow-up" className="text-[11px] font-semibold text-emerald-600 hover:underline">
              Kelola
            </Link>
          </div>

          <div className="flex-1 divide-y divide-slate-100 mt-2">
            {upcomingFollowUps.map((flw) => {
              const isOverdue = flw.status === 'Terlambat';
              return (
                <div key={flw.id} className="py-2.5 first:pt-1">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-slate-800">{flw.customerName}</span>
                        {isOverdue && (
                          <span className="text-[9px] font-bold px-1 py-0.2 rounded bg-rose-100 text-rose-700">
                            TERLAMBAT
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">{flw.notes}</p>
                      <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-1">
                        <Clock className="w-3 h-3" />
                        <span>
                          {flw.scheduledDate} ({flw.scheduledTime} WIB)
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 3. Transaksi Deal Sukses Terbaru (Recent Deals) */}
        <div className="crm-card p-4 flex flex-col">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Trophy className="w-4 h-4 text-emerald-600" />
              <h3 className="text-xs font-bold text-slate-900">Deal Sukses Terbaru</h3>
            </div>
            <Link href="/after-sales" className="text-[11px] font-semibold text-emerald-600 hover:underline">
              After Sales
            </Link>
          </div>

          <div className="flex-1 divide-y divide-slate-100 mt-2">
            {recentDeals.map((deal) => (
              <div key={deal.id} className="py-2.5 first:pt-1">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-bold text-slate-800">{deal.vehicleModel}</p>
                    <p className="text-[11px] text-slate-500">
                      Pembeli: <span className="font-semibold text-slate-700">{deal.customerName}</span>
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] font-bold text-emerald-700">
                        {formatRupiah(deal.purchasePrice)}
                      </span>
                      <span className="text-[10px] px-1 py-0.2 rounded bg-slate-100 text-slate-600">
                        {deal.plateNumber}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 4. Aktivitas Terkini (Recent Customer Activities Timeline) */}
        <div className="crm-card p-4 flex flex-col">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-slate-600" />
              <h3 className="text-xs font-bold text-slate-900">Aktivitas CRM Terkini</h3>
            </div>
            <Link href="/activity-logs" className="text-[11px] font-semibold text-emerald-600 hover:underline">
              Audit Log
            </Link>
          </div>

          <div className="flex-1 divide-y divide-slate-100 mt-2">
            {recentLogs.map((log) => (
              <div key={log.id} className="py-2 first:pt-1">
                <div className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-bold text-slate-800 leading-tight">
                      {log.action}
                    </p>
                    <p className="text-[10px] text-slate-500 truncate mt-0.5">
                      {log.details}
                    </p>
                    <span className="text-[9px] text-slate-400 mt-0.5 block">
                      Oleh: {log.userName}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
