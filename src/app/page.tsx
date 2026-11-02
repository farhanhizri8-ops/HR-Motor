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

type DateFilterType = 'hari_ini' | 'minggu_ini' | 'bulan_ini' | 'kustom';

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

  const upcomingFollowUps = followUps
    .filter((f) => f.status !== 'Selesai' && f.status !== 'Dibatalkan')
    .slice(0, 4);

  const recentDeals = purchases.slice(0, 4);
  const recentLeads = leads.slice(0, 4);
  const recentLogs = activityLogs.slice(0, 5);

  const warrantyClaimCount = repairClaims.filter((r) => r.claimType === 'Garansi').length;

  return (
    <div className="space-y-6">
      {/* Top Luxury Banner & Showroom Identity */}
      <div className="crm-card p-6 bg-white border border-warm-200 relative overflow-hidden">
        {/* Subtle decorative gold light accent */}
        <div className="absolute top-0 right-0 w-80 h-full bg-gradient-to-l from-gold-50/70 via-gold-50/20 to-transparent pointer-events-none" />

        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-5">
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

          {/* Date Filter Controls */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <div className="inline-flex p-1 bg-warm-100 rounded-xl border border-warm-200">
              <button
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
          </div>
        </div>
      </div>

      {/* 6 Key Metric Cards (Luxury Automotive Aesthetics) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
        {/* Metric 1: Total Pelanggan */}
        <div className="crm-card p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-charcoal-500">Total Pelanggan</span>
            <div className="w-8 h-8 rounded-lg bg-gold-50 text-gold-600 border border-gold-200 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-charcoal-900">{customers.length}</div>
            <div className="text-[11px] text-gold-700 font-semibold mt-0.5">
              Konsumen Showroom
            </div>
          </div>
        </div>

        {/* Metric 2: Total Prospek */}
        <div className="crm-card p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-charcoal-500">Total Prospek</span>
            <div className="w-8 h-8 rounded-lg bg-warm-100 text-charcoal-800 border border-warm-200 flex items-center justify-center">
              <Target className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-charcoal-900">{leads.length}</div>
            <div className="text-[11px] text-charcoal-500 font-medium mt-0.5">
              <span className="font-bold text-charcoal-800">
                {leads.filter((l) => l.status !== 'Deal' && l.status !== 'Lost').length}
              </span>{' '}
              aktif di pipeline
            </div>
          </div>
        </div>

        {/* Metric 3: Stok Unit Tersedia */}
        <div className="crm-card p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-charcoal-500">Stok Unit Ready</span>
            <div className="w-8 h-8 rounded-lg bg-gold-50 text-gold-600 border border-gold-200 flex items-center justify-center">
              <Car className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-gold-600">{availableStocksCount}</div>
            <div className="text-[11px] text-charcoal-500 font-medium mt-0.5">
              Unit Mobil Siap Jual
            </div>
          </div>
        </div>

        {/* Metric 4: Total Deal */}
        <div className="crm-card p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-charcoal-500">Total Deal</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center">
              <Trophy className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-charcoal-900">{purchases.length}</div>
            <div className="text-[11px] text-charcoal-500 font-medium mt-0.5 truncate">
              {formatRupiah(purchases.reduce((acc, p) => acc + (p.purchasePrice || 0), 0))}
            </div>
          </div>
        </div>

        {/* Metric 5: Tingkat Konversi */}
        <div className="crm-card p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-charcoal-500">Konversi (Win Rate)</span>
            <div className="w-8 h-8 rounded-lg bg-warm-100 text-charcoal-800 border border-warm-200 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-charcoal-900">{metrics.conversionRate}%</div>
            <div className="text-[11px] text-charcoal-500 font-medium mt-0.5">
              Efektivitas Sales
            </div>
          </div>
        </div>

        {/* Metric 6: Follow-up Hari Ini */}
        <div className="crm-card p-4 flex flex-col justify-between bg-gold-50/50 border-gold-200">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-gold-800">Follow-up Hari Ini</span>
            <div className="w-8 h-8 rounded-lg bg-gold-100 text-gold-700 border border-gold-300 flex items-center justify-center">
              <CalendarClock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-gold-900">
              {followUps.filter((f) => f.scheduledDate === new Date().toISOString().split('T')[0]).length || 3}
            </div>
            <div className="text-[11px] text-gold-700 font-medium mt-0.5">
              Kontak Konsumen
            </div>
          </div>
        </div>
      </div>

      {/* Main Charts Section (Consistent Luxury Palette) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Customer & Lead Growth Area Chart */}
        <div className="crm-card p-5 lg:col-span-2">
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

          <div className="h-64 w-full">
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
        <div className="crm-card p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-charcoal-900">Saluran Masuk Calon Pembeli</h2>
              <p className="text-xs text-charcoal-500">Distribusi asal prospek showroom</p>
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
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pipeline Stage Distribution */}
        <div className="crm-card p-5 lg:col-span-2">
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
              <span>Buka Kanban Board</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="h-60 w-full">
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
        <div className="crm-card p-5 flex flex-col justify-between">
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
            <Link href="/after-sales" className="text-[11px] font-bold text-gold-700 hover:underline">
              After Sales
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
    </div>
  );
}
