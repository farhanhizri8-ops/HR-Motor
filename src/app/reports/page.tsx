'use client';

import React, { useState, useMemo } from 'react';
import {
  BarChart3,
  Calendar,
  Filter,
  Users,
  Target,
  XCircle,
  TrendingUp,
  FileSpreadsheet,
  FileText,
  CheckCircle2,
  PieChart as PieIcon,
  Award,
  Car,
  DollarSign,
  ArrowUpRight,
  ShieldCheck,
  ChevronRight,
  Percent,
  Layers,
  Sparkles,
  HelpCircle,
  AlertCircle,
  Package,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from 'recharts';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useCrm } from '@/context/CrmContext';
import { LeadSourceType, PipelineStage } from '@/types/crm';

// Official HR MOTOR Brand Palette
const BRAND_COLORS = {
  gold: '#D99A32',
  champagne: '#F0B653',
  charcoal: '#242424',
  charcoalLight: '#3E3E3E',
  warmWhite: '#F7F6F2',
  softGrey: '#E5E2DB',
  neutralGrey: '#8C877D',
};

const PIE_COLORS = [
  '#D99A32',
  '#F0B653',
  '#242424',
  '#3E3E3E',
  '#8C877D',
  '#C4C0B6',
];

type PeriodFilter = 'all' | 'this_month' | 'last_month' | 'this_quarter' | 'this_year';

export default function ReportsAnalyticsPage() {
  const {
    leads,
    purchases,
    stocks,
    formatRupiah,
    formatDate,
  } = useCrm();

  // Period Filter & Active Focus View
  const [datePeriod, setDatePeriod] = useState<PeriodFilter>('all');
  const [activeTab, setActiveTab] = useState<'all' | 'sales' | 'sources' | 'pipeline' | 'lost' | 'stocks'>('all');

  // Helper: check if a date string falls inside the chosen period
  const isDateInPeriod = (dateStr?: string, period: PeriodFilter = datePeriod): boolean => {
    if (!dateStr || period === 'all') return true;
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return true;

    // Fixed reference to November 2026 as per dealership timeline
    const refYear = 2026;
    const refMonth = 10; // November (0-indexed)

    const year = d.getFullYear();
    const month = d.getMonth();

    switch (period) {
      case 'this_month':
        return year === refYear && month === refMonth;
      case 'last_month':
        return year === refYear && month === (refMonth - 1);
      case 'this_quarter':
        // Q4 2026 (Oct, Nov, Dec: months 9, 10, 11)
        return year === refYear && month >= 9 && month <= 11;
      case 'this_year':
        return year === refYear;
      default:
        return true;
    }
  };

  // 1. FILTERED DATASETS BASED ON ACTIVE PERIOD
  const filteredLeads = useMemo(() => {
    return leads.filter((l) => isDateInPeriod(l.dateReceived || l.createdAt, datePeriod));
  }, [leads, datePeriod]);

  const filteredPurchases = useMemo(() => {
    return purchases.filter((p) => isDateInPeriod(p.purchaseDate || p.createdAt, datePeriod));
  }, [purchases, datePeriod]);

  // 2. MAIN KPI CALCULATIONS
  const totalLeadsCount = filteredLeads.length;
  const totalDealsCount = filteredLeads.filter((l) => l.status === 'Deal').length;
  const totalLostCount = filteredLeads.filter((l) => l.status === 'Lost').length;

  // Formula strictly specified: Deal / (Deal + Lost) * 100%
  const resolvedCount = totalDealsCount + totalLostCount;
  const conversionRate = resolvedCount > 0
    ? Number(((totalDealsCount / resolvedCount) * 100).toFixed(1))
    : 0;

  // Total Unit Terjual:
  const totalUnitsSold = filteredPurchases.length > 0
    ? filteredPurchases.length
    : totalDealsCount;

  // Total Omzet Penjualan (Rp):
  const totalOmzet = useMemo(() => {
    const fromPurchases = filteredPurchases.reduce((sum, p) => sum + (p.purchasePrice || 0), 0);
    if (fromPurchases > 0) return fromPurchases;
    return filteredLeads
      .filter((l) => l.status === 'Deal')
      .reduce((sum, l) => sum + (l.dealValue || l.estimatedBudget || 0), 0);
  }, [filteredPurchases, filteredLeads]);

  // 3. MONTHLY SALES PERFORMANCE TRENDS
  const monthlySalesTrend = useMemo(() => {
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    const currentYear = 2026;
    const map: Record<number, { month: string; omzet: number; omzetJuta: number; unitTerjual: number; prospek: number; deal: number }> = {};

    for (let m = 0; m < 12; m++) {
      map[m] = {
        month: monthNames[m],
        omzet: 0,
        omzetJuta: 0,
        unitTerjual: 0,
        prospek: 0,
        deal: 0,
      };
    }

    leads.forEach((l) => {
      const dStr = l.dateReceived || l.createdAt;
      if (dStr) {
        const d = new Date(dStr);
        if (d.getFullYear() === currentYear) {
          const m = d.getMonth();
          if (map[m]) {
            map[m].prospek += 1;
            if (l.status === 'Deal') {
              map[m].deal += 1;
              map[m].omzet += (l.dealValue || l.estimatedBudget || 0);
            }
          }
        }
      }
    });

    purchases.forEach((p) => {
      const dStr = p.purchaseDate || p.createdAt;
      if (dStr) {
        const d = new Date(dStr);
        if (d.getFullYear() === currentYear) {
          const m = d.getMonth();
          if (map[m]) {
            map[m].unitTerjual += 1;
            if (map[m].omzet === 0) {
              map[m].omzet += (p.purchasePrice || 0);
            }
          }
        }
      }
    });

    Object.values(map).forEach((item) => {
      item.omzetJuta = Number((item.omzet / 1000000).toFixed(0));
    });

    const activeList = Object.values(map).filter(
      (m) => m.prospek > 0 || m.deal > 0 || m.unitTerjual > 0 || m.omzet > 0
    );

    return activeList.length > 0 ? activeList : Object.values(map).slice(6);
  }, [leads, purchases]);

  // 4. PROMOTIONAL CHANNELS ANALYSIS (SALURAN PROMOSI)
  const sourcePerformance = useMemo(() => {
    const channelList: LeadSourceType[] = [
      'WhatsApp',
      'Instagram',
      'Facebook',
      'TikTok',
      'Walk-in',
      'Referral',
      'Other',
    ];

    return channelList
      .map((ch) => {
        const chLeads = filteredLeads.filter((l) => l.leadSource === ch);
        const chDeals = chLeads.filter((l) => l.status === 'Deal');
        const chLost = chLeads.filter((l) => l.status === 'Lost');
        const resolved = chDeals.length + chLost.length;
        const rate = resolved > 0 ? Number(((chDeals.length / resolved) * 100).toFixed(1)) : 0;
        const revenue = chDeals.reduce((sum, l) => sum + (l.dealValue || l.estimatedBudget || 0), 0);

        return {
          channelKey: ch,
          channel: ch === 'Other' ? 'Lainnya' : ch === 'Walk-in' ? 'Walk-in (Showroom)' : ch,
          leads: chLeads.length,
          deals: chDeals.length,
          lost: chLost.length,
          conversionRate: rate,
          revenue,
          revenueJuta: Number((revenue / 1000000).toFixed(0)),
        };
      })
      .filter((s) => s.leads > 0 || s.deals > 0)
      .sort((a, b) => b.deals - a.deals || b.revenue - a.revenue);
  }, [filteredLeads]);

  // 5. SALES PIPELINE FUNNEL ANALYSIS
  const pipelineFunnel = useMemo(() => {
    const stages: PipelineStage[] = [
      'Menanyakan Unit',
      'Tertarik',
      'Cek Unit',
      'Negosiasi',
      'Deal',
      'Lost',
    ];

    const total = filteredLeads.length || 1;

    return stages.map((stg) => {
      const count = filteredLeads.filter((l) => l.status === stg).length;
      const percentage = Number(((count / total) * 100).toFixed(1));
      const value = filteredLeads
        .filter((l) => l.status === stg)
        .reduce((sum, l) => sum + (l.dealValue || l.estimatedBudget || 0), 0);

      return {
        stage: stg,
        count,
        percentage,
        value,
      };
    });
  }, [filteredLeads]);

  // 6. LOST LEADS REASONS ANALYSIS
  const lostReasonsData = useMemo(() => {
    const lostLeads = filteredLeads.filter((l) => l.status === 'Lost');
    const reasonsMap: Record<string, number> = {
      'Harga tidak cocok': 0,
      'Unit tidak sesuai kebutuhan': 0,
      'Membeli di tempat lain': 0,
      'Tidak melanjutkan komunikasi': 0,
      'Alasan lainnya': 0,
    };

    lostLeads.forEach((l) => {
      const cat = l.lostReasonCategory;
      if (cat && reasonsMap[cat] !== undefined) {
        reasonsMap[cat]++;
      } else {
        const txt = (l.lostReason || '').toLowerCase();
        if (txt.includes('harga') || txt.includes('budget') || txt.includes('mahal') || txt.includes('dp')) {
          reasonsMap['Harga tidak cocok']++;
        } else if (txt.includes('unit') || txt.includes('warna') || txt.includes('tipe') || txt.includes('tahun')) {
          reasonsMap['Unit tidak sesuai kebutuhan']++;
        } else if (txt.includes('tempat lain') || txt.includes('showroom lain') || txt.includes('dealer')) {
          reasonsMap['Membeli di tempat lain']++;
        } else if (txt.includes('hubungi') || txt.includes('kontak') || txt.includes('respons') || txt.includes('wa')) {
          reasonsMap['Tidak melanjutkan komunikasi']++;
        } else {
          reasonsMap['Alasan lainnya']++;
        }
      }
    });

    return Object.entries(reasonsMap)
      .map(([reason, count]) => ({ reason, count }))
      .filter((item) => item.count > 0);
  }, [filteredLeads]);

  // 7. STOCK UNIT INVENTORY ANALYSIS
  const stockMetrics = useMemo(() => {
    const total = stocks.length;
    const ready = stocks.filter((s) => s.status === 'Tersedia');
    const sold = stocks.filter((s) => s.status === 'Terjual');
    const inactive = stocks.filter((s) => s.status === 'Tidak Aktif');
    const totalReadyValue = ready.reduce((sum, s) => sum + (s.price || 0), 0);

    const brandCounts: Record<string, number> = {};
    stocks.forEach((s) => {
      const b = s.brand || 'Lainnya';
      brandCounts[b] = (brandCounts[b] || 0) + 1;
    });

    const topBrands = Object.entries(brandCounts)
      .map(([brand, count]) => ({ brand, count }))
      .sort((a, b) => b.count - a.count);

    return {
      total,
      readyCount: ready.length,
      soldCount: sold.length,
      inactiveCount: inactive.length,
      totalReadyValue,
      topBrands,
    };
  }, [stocks]);

  // EXPORT TO EXCEL (Clean, no sales rep data, matching period)
  const handleExportExcel = () => {
    const wb = XLSX.utils.book_new();

    // Sheet 1: Ringkasan Eksekutif & KPI
    const summaryRows = [
      ['LAPORAN ANALITIK SHOWROOM — HR MOTOR GARUT', ''],
      ['Tanggal Ekspor', new Date().toLocaleDateString('id-ID')],
      ['Lokasi Showroom', 'Jl. Otista No. 128, Tarogong Kidul, Garut, Jawa Barat'],
      ['Filter Periode', getPeriodLabel(datePeriod)],
      ['', ''],
      ['Indikator Kinerja Utama (KPI)', 'Nilai Aktual'],
      ['Total Prospek Masuk', totalLeadsCount],
      ['Total Deal Ditutup', totalDealsCount],
      ['Total Prospek Batal (Lost)', totalLostCount],
      ['Tingkat Konversi (Deal / (Deal + Lost))', `${conversionRate}%`],
      ['Total Unit Mobil Terjual', totalUnitsSold],
      ['Total Omzet Penjualan (Rp)', totalOmzet],
      ['Total Stok Unit di Showroom', stockMetrics.total],
      ['Unit Stok Tersedia (Ready)', stockMetrics.readyCount],
      ['Estimasi Nilai Inventori Ready (Rp)', stockMetrics.totalReadyValue],
    ];
    const wsSummary = XLSX.utils.aoa_to_sheet(summaryRows);
    XLSX.utils.book_append_sheet(wb, wsSummary, 'Ringkasan KPI');

    // Sheet 2: Analisis Saluran Promosi
    const channelRows = sourcePerformance.map((s, idx) => ({
      'No': idx + 1,
      'Saluran Promosi': s.channel,
      'Total Prospek': s.leads,
      'Deal Sukses': s.deals,
      'Prospek Batal': s.lost,
      'Tingkat Konversi (%)': `${s.conversionRate}%`,
      'Total Omzet Penjualan (Rp)': s.revenue,
    }));
    const wsChannels = XLSX.utils.json_to_sheet(channelRows);
    XLSX.utils.book_append_sheet(wb, wsChannels, 'Saluran Promosi');

    // Sheet 3: Pipeline Funnel
    const funnelRows = pipelineFunnel.map((f, idx) => ({
      'Tahap Ke': idx + 1,
      'Tahap Pipeline': f.stage,
      'Jumlah Prospek': f.count,
      'Persentase Pipeline (%)': `${f.percentage}%`,
      'Potensi Nilai (Rp)': f.value,
    }));
    const wsFunnel = XLSX.utils.json_to_sheet(funnelRows);
    XLSX.utils.book_append_sheet(wb, wsFunnel, 'Pipeline Funnel');

    // Sheet 4: Lost Leads
    const lostRows = lostReasonsData.map((l, idx) => ({
      'No': idx + 1,
      'Alasan Pembatalan': l.reason,
      'Jumlah Kasus': l.count,
      'Porsi (%):': `${totalLostCount > 0 ? ((l.count / totalLostCount) * 100).toFixed(1) : 0}%`,
    }));
    const wsLost = XLSX.utils.json_to_sheet(lostRows);
    XLSX.utils.book_append_sheet(wb, wsLost, 'Analisis Lost Leads');

    // Sheet 5: Inventori Stok Unit
    const stockRows = stocks.map((stk, idx) => ({
      'No': idx + 1,
      'Unit Mobil': `${stk.brand} ${stk.model} (${stk.year})`,
      'Warna': stk.color,
      'Transmisi': stk.transmission,
      'Harga Jual (Rp)': stk.price,
      'Status': stk.status,
      'Tgl Masuk': stk.entryDate,
    }));
    const wsStocks = XLSX.utils.json_to_sheet(stockRows);
    XLSX.utils.book_append_sheet(wb, wsStocks, 'Inventori Stok Unit');

    XLSX.writeFile(wb, `HR_MOTOR_REPORTS_ANALYTICS_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  // EXPORT TO PDF (Executive letterhead, brand colors, no sales rep)
  const handleExportPDF = () => {
    const doc = new jsPDF();

    // HR MOTOR Executive Letterhead
    doc.setFontSize(15);
    doc.setFont('helvetica', 'bold');
    doc.text('HR MOTOR GARUT — EXECUTIVE DEALERSHIP REPORT', 14, 18);

    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'normal');
    doc.text('Showroom Pusat: Jl. Otista No. 128, Tarogong Kidul, Garut, Jawa Barat | Telepon: 0812-2233-4455', 14, 24);
    doc.text(
      `Waktu Cetak: ${new Date().toLocaleString('id-ID')} WIB | Periode: ${getPeriodLabel(datePeriod)} | Status Data: Aktual`,
      14,
      29
    );

    // Decorative Gold Line
    doc.setLineWidth(0.75);
    doc.setDrawColor(217, 154, 50); // Gold
    doc.line(14, 32, 196, 32);

    // KPI Summary Table
    autoTable(doc, {
      startY: 36,
      head: [['Indikator Kinerja Utama (KPI)', 'Nilai Aktual']],
      body: [
        ['Total Prospek Masuk', `${totalLeadsCount} Calon Konsumen`],
        ['Total Deal Sukses', `${totalDealsCount} Transaksi`],
        ['Total Prospek Batal (Lost)', `${totalLostCount} Kasus`],
        ['Tingkat Konversi (Deal / (Deal + Lost))', `${conversionRate}%`],
        ['Total Unit Mobil Terjual', `${totalUnitsSold} Unit Mobil`],
        ['Total Omzet Penjualan', formatRupiah(totalOmzet)],
        ['Stok Unit Tersedia di Showroom', `${stockMetrics.readyCount} dari total ${stockMetrics.total} unit`],
        ['Estimasi Total Aset Inventori Ready', formatRupiah(stockMetrics.totalReadyValue)],
      ],
      theme: 'grid',
      headStyles: { fillColor: [36, 36, 36], textColor: [240, 182, 83], fontSize: 8 },
      bodyStyles: { fontSize: 8 },
    });

    // Promotional Channel Performance Table
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('Efektivitas Saluran Promosi Showroom:', 14, (doc as any).lastAutoTable.finalY + 9);

    const channelBody = sourcePerformance.map((s) => [
      s.channel,
      `${s.leads} Prospek`,
      `${s.deals} Deal`,
      `${s.conversionRate}%`,
      formatRupiah(s.revenue),
    ]);

    autoTable(doc, {
      startY: (doc as any).lastAutoTable.finalY + 12,
      head: [['Saluran Promosi', 'Prospek', 'Deal Sukses', 'Konversi', 'Total Omset']],
      body: channelBody,
      theme: 'striped',
      headStyles: { fillColor: [217, 154, 50], textColor: [36, 36, 36], fontSize: 8 },
      bodyStyles: { fontSize: 8 },
    });

    // Pipeline Funnel Table
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('Distribusi Tahapan Sales Pipeline:', 14, (doc as any).lastAutoTable.finalY + 9);

    const funnelBody = pipelineFunnel.map((f) => [
      f.stage,
      `${f.count} Prospek`,
      `${f.percentage}%`,
      formatRupiah(f.value),
    ]);

    autoTable(doc, {
      startY: (doc as any).lastAutoTable.finalY + 12,
      head: [['Tahap Pipeline', 'Jumlah Prospek', 'Porsi Pipeline', 'Nilai Potensi']],
      body: funnelBody,
      theme: 'grid',
      headStyles: { fillColor: [36, 36, 36], textColor: [255, 255, 255], fontSize: 8 },
      bodyStyles: { fontSize: 8 },
    });

    doc.save(`HR_MOTOR_EXECUTIVE_REPORT_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  function getPeriodLabel(period: PeriodFilter): string {
    switch (period) {
      case 'this_month':
        return 'Bulan Ini (November 2026)';
      case 'last_month':
        return 'Bulan Lalu (Oktober 2026)';
      case 'this_quarter':
        return 'Kuartal Ini (Q4 2026)';
      case 'this_year':
        return 'Tahun Ini (2026)';
      default:
        return 'Semua Waktu';
    }
  }

  return (
    <div className="space-y-6">
      {/* 1. HEADER SECTION */}
      <div className="crm-card p-6 border-b-2 border-b-gold-500/40">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="badge-gold">
                <BarChart3 className="w-3.5 h-3.5 mr-1 text-gold-700" />
                Executive Dealership Analytics
              </span>
              <span className="text-xs text-charcoal-400">•</span>
              <span className="text-xs text-charcoal-500 font-medium">HR MOTOR Garut</span>
            </div>
            <h1 className="text-xl lg:text-2xl font-black text-charcoal-900 tracking-tight">
              Reports & Analytics
            </h1>
            <p className="text-xs text-charcoal-500 mt-0.5">
              Analisis performa penjualan dan perkembangan bisnis HR MOTOR.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Period Filter Dropdown */}
            <div className="flex items-center gap-1.5 bg-[#F7F6F2] px-3 py-1.5 rounded-xl border border-[#E5E2DB]">
              <Calendar className="w-3.5 h-3.5 text-gold-600" />
              <label htmlFor="period-select" className="text-xs font-semibold text-charcoal-700 sr-only">
                Periode Laporan
              </label>
              <select
                id="period-select"
                value={datePeriod}
                onChange={(e) => setDatePeriod(e.target.value as PeriodFilter)}
                className="bg-transparent text-xs font-bold text-charcoal-900 outline-none cursor-pointer"
              >
                <option value="all">Semua Waktu</option>
                <option value="this_month">Bulan Ini (November 2026)</option>
                <option value="last_month">Bulan Lalu (Oktober 2026)</option>
                <option value="this_quarter">Kuartal Ini (Q4 2026)</option>
                <option value="this_year">Tahun Ini (2026)</option>
              </select>
            </div>

            {/* Export Buttons */}
            <button
              onClick={handleExportExcel}
              className="btn-outline-warm flex items-center gap-1.5 text-xs py-2"
              title="Unduh laporan lengkap dalam format Microsoft Excel"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-gold-600" />
              <span>Ekspor Excel</span>
            </button>
            <button
              onClick={handleExportPDF}
              className="btn-gold flex items-center gap-1.5 text-xs py-2"
              title="Unduh dokumen laporan resmi dalam format PDF"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Ekspor PDF</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. NAVIGATION SUB-TABS */}
      <div className="crm-card p-1.5 border border-[#E5E2DB]">
        <div className="flex flex-wrap gap-1 p-1 bg-[#F7F6F2] rounded-xl border border-[#E5E2DB]">
          <button
            onClick={() => setActiveTab('all')}
            className={`py-2 px-3.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
              activeTab === 'all'
                ? 'bg-charcoal-900 text-gold-400 shadow-luxury border border-gold-500/30'
                : 'text-charcoal-700 hover:text-charcoal-900 hover:bg-gold-50/60'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            Semua Laporan
          </button>
          <button
            onClick={() => setActiveTab('sales')}
            className={`py-2 px-3.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
              activeTab === 'sales'
                ? 'bg-charcoal-900 text-gold-400 shadow-luxury border border-gold-500/30'
                : 'text-charcoal-700 hover:text-charcoal-900 hover:bg-gold-50/60'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            Performa Penjualan
          </button>
          <button
            onClick={() => setActiveTab('sources')}
            className={`py-2 px-3.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
              activeTab === 'sources'
                ? 'bg-charcoal-900 text-gold-400 shadow-luxury border border-gold-500/30'
                : 'text-charcoal-700 hover:text-charcoal-900 hover:bg-gold-50/60'
            }`}
          >
            <Target className="w-3.5 h-3.5" />
            Saluran Promosi
          </button>
          <button
            onClick={() => setActiveTab('pipeline')}
            className={`py-2 px-3.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
              activeTab === 'pipeline'
                ? 'bg-charcoal-900 text-gold-400 shadow-luxury border border-gold-500/30'
                : 'text-charcoal-700 hover:text-charcoal-900 hover:bg-gold-50/60'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            Sales Pipeline
          </button>
          <button
            onClick={() => setActiveTab('lost')}
            className={`py-2 px-3.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
              activeTab === 'lost'
                ? 'bg-charcoal-900 text-gold-400 shadow-luxury border border-gold-500/30'
                : 'text-charcoal-700 hover:text-charcoal-900 hover:bg-gold-50/60'
            }`}
          >
            <XCircle className="w-3.5 h-3.5" />
            Analisis Lost Leads
          </button>
          <button
            onClick={() => setActiveTab('stocks')}
            className={`py-2 px-3.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
              activeTab === 'stocks'
                ? 'bg-charcoal-900 text-gold-400 shadow-luxury border border-gold-500/30'
                : 'text-charcoal-700 hover:text-charcoal-900 hover:bg-gold-50/60'
            }`}
          >
            <Package className="w-3.5 h-3.5" />
            Analisis Stok Unit
          </button>
        </div>
      </div>

      {/* 3. MAIN KPI SECTION (6 PREMIUM STATISTIC CARDS) */}
      <div>
        <div className="flex items-center justify-between mb-2.5">
          <h2 className="text-xs font-bold uppercase tracking-wider text-charcoal-700 flex items-center gap-1.5">
            <Award className="w-4 h-4 text-gold-600" />
            Ringkasan Metrik Utama Showroom ({getPeriodLabel(datePeriod)})
          </h2>
          <span className="text-[11px] text-charcoal-500 font-medium">
            *Dihitung dari data aktual transaksi & prospek
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {/* Card 1: Total Prospek */}
          <div className="crm-card p-4 border border-[#E5E2DB] hover:border-gold-500/50 transition-all">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] font-semibold text-charcoal-500">Total Prospek</span>
              <div className="w-7 h-7 rounded-lg bg-gold-50 text-gold-700 flex items-center justify-center">
                <Users className="w-3.5 h-3.5" />
              </div>
            </div>
            <span className="text-xl lg:text-2xl font-black text-charcoal-900 block tracking-tight">
              {totalLeadsCount}
            </span>
            <span className="text-[10px] text-charcoal-500 font-medium mt-1 block">
              Calon pembeli masuk
            </span>
          </div>

          {/* Card 2: Total Deal */}
          <div className="crm-card p-4 border border-[#E5E2DB] hover:border-gold-500/50 transition-all">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] font-semibold text-charcoal-500">Total Deal</span>
              <div className="w-7 h-7 rounded-lg bg-gold-100 text-gold-800 flex items-center justify-center">
                <CheckCircle2 className="w-3.5 h-3.5" />
              </div>
            </div>
            <span className="text-xl lg:text-2xl font-black text-gold-700 block tracking-tight">
              {totalDealsCount}
            </span>
            <span className="text-[10px] text-gold-800 font-semibold mt-1 block">
              Transaksi berhasil
            </span>
          </div>

          {/* Card 3: Total Lost */}
          <div className="crm-card p-4 border border-[#E5E2DB] hover:border-gold-500/50 transition-all">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] font-semibold text-charcoal-500">Total Lost</span>
              <div className="w-7 h-7 rounded-lg bg-charcoal-100 text-charcoal-700 flex items-center justify-center">
                <XCircle className="w-3.5 h-3.5" />
              </div>
            </div>
            <span className="text-xl lg:text-2xl font-black text-charcoal-800 block tracking-tight">
              {totalLostCount}
            </span>
            <span className="text-[10px] text-charcoal-500 font-medium mt-1 block">
              Batal / tidak jadi
            </span>
          </div>

          {/* Card 4: Conversion Rate */}
          <div className="crm-card p-4 border border-[#E5E2DB] hover:border-gold-500/50 transition-all">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] font-semibold text-charcoal-500">Conversion Rate</span>
              <div className="w-7 h-7 rounded-lg bg-gold-50 text-gold-700 flex items-center justify-center">
                <Percent className="w-3.5 h-3.5" />
              </div>
            </div>
            <span className="text-xl lg:text-2xl font-black text-charcoal-900 block tracking-tight">
              {conversionRate}%
            </span>
            <span className="text-[10px] text-charcoal-400 font-medium mt-1 block">
              Deal / (Deal + Lost)
            </span>
          </div>

          {/* Card 5: Total Unit Terjual */}
          <div className="crm-card p-4 border border-[#E5E2DB] hover:border-gold-500/50 transition-all">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] font-semibold text-charcoal-500">Unit Terjual</span>
              <div className="w-7 h-7 rounded-lg bg-gold-50 text-gold-700 flex items-center justify-center">
                <Car className="w-3.5 h-3.5" />
              </div>
            </div>
            <span className="text-xl lg:text-2xl font-black text-charcoal-900 block tracking-tight">
              {totalUnitsSold} <span className="text-xs font-semibold text-charcoal-500">Unit</span>
            </span>
            <span className="text-[10px] text-charcoal-500 font-medium mt-1 block">
              Mobil keluar showroom
            </span>
          </div>

          {/* Card 6: Total Omzet Penjualan */}
          <div className="crm-card-charcoal p-4 text-white border border-gold-500/30">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] font-semibold text-gold-400">Total Omzet Penjualan</span>
              <div className="w-7 h-7 rounded-lg bg-gold-500/20 text-gold-400 flex items-center justify-center">
                <TrendingUp className="w-3.5 h-3.5" />
              </div>
            </div>
            <span className="text-lg lg:text-xl font-black text-white block tracking-tight truncate">
              {formatRupiah(totalOmzet)}
            </span>
            <span className="text-[10px] text-gold-300 font-semibold mt-1 block">
              Akumulasi nilai transaksi
            </span>
          </div>
        </div>
      </div>

      {/* 4. BAGIAN GRAFIK PERFORMA PENJUALAN */}
      {(activeTab === 'all' || activeTab === 'sales') && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-wider text-charcoal-700 flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-gold-600" />
              Performa & Tren Penjualan Showroom HR MOTOR (Tahun 2026)
            </h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Chart 1: Tren Omzet & Unit Terjual */}
            <div className="crm-card p-5 border border-[#E5E2DB] space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-charcoal-900">
                    Tren Omzet Penjualan & Unit Terjual Bulanan
                  </h3>
                  <p className="text-xs text-charcoal-500">
                    Nilai transaksi kotor (dalam Juta Rupiah) vs kuantitas unit mobil
                  </p>
                </div>
                <div className="flex items-center gap-3 text-xs">
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded bg-gold-500 inline-block" />
                    <span className="text-charcoal-700 font-medium">Omzet (Jt)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded bg-charcoal-900 inline-block" />
                    <span className="text-charcoal-700 font-medium">Unit Mobil</span>
                  </div>
                </div>
              </div>

              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlySalesTrend} margin={{ top: 10, right: 10, left: 10, bottom: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E2DB" vertical={false} />
                    <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#666666' }} />
                    <YAxis
                      yAxisId="left"
                      tick={{ fontSize: 10, fill: '#666666' }}
                      tickFormatter={(v) => `Rp ${v}Jt`}
                    />
                    <YAxis
                      yAxisId="right"
                      orientation="right"
                      tick={{ fontSize: 10, fill: '#666666' }}
                      unit=" unit"
                    />
                    <Tooltip
                      formatter={(val: any, name: any) => [
                        name === 'Omzet Penjualan' ? formatRupiah(Number(val) * 1000000) : `${val} Unit`,
                        name,
                      ]}
                      contentStyle={{
                        backgroundColor: '#ffffff',
                        borderRadius: '10px',
                        border: '1px solid #E5E2DB',
                        fontSize: '11px',
                      }}
                    />
                    <Bar
                      yAxisId="left"
                      dataKey="omzetJuta"
                      name="Omzet Penjualan"
                      fill={BRAND_COLORS.gold}
                      radius={[4, 4, 0, 0]}
                    />
                    <Bar
                      yAxisId="right"
                      dataKey="unitTerjual"
                      name="Unit Terjual"
                      fill={BRAND_COLORS.charcoal}
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart 2: Perbandingan Prospek Masuk vs Deal Ditutup */}
            <div className="crm-card p-5 border border-[#E5E2DB] space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-charcoal-900">
                    Rasio Prospek Masuk vs Deal Ditutup
                  </h3>
                  <p className="text-xs text-charcoal-500">
                    Evaluasi konversi volume prospek menjadi deal pembelian
                  </p>
                </div>
                <div className="flex items-center gap-3 text-xs">
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded bg-charcoal-800 inline-block" />
                    <span className="text-charcoal-700 font-medium">Prospek</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded bg-gold-500 inline-block" />
                    <span className="text-charcoal-700 font-medium">Deal Sukses</span>
                  </div>
                </div>
              </div>

              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlySalesTrend} margin={{ top: 10, right: 10, left: 10, bottom: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E2DB" vertical={false} />
                    <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#666666' }} />
                    <YAxis tick={{ fontSize: 10, fill: '#666666' }} unit=" org" />
                    <Tooltip
                      formatter={(val: any, name: any) => [`${val} Orang`, name]}
                      contentStyle={{
                        backgroundColor: '#ffffff',
                        borderRadius: '10px',
                        border: '1px solid #E5E2DB',
                        fontSize: '11px',
                      }}
                    />
                    <Bar dataKey="prospek" name="Prospek Masuk" fill={BRAND_COLORS.charcoal} radius={[4, 4, 0, 0]} />
                    <Bar dataKey="deal" name="Deal Sukses" fill={BRAND_COLORS.gold} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 5. BAGIAN ANALISIS SALURAN PROMOSI (PROMOTIONAL CHANNELS) */}
      {(activeTab === 'all' || activeTab === 'sources') && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-wider text-charcoal-700 flex items-center gap-1.5">
              <Target className="w-4 h-4 text-gold-600" />
              Analisis Efektivitas Saluran Promosi Showroom
            </h2>
            <span className="text-[11px] text-charcoal-500 font-medium">
              Evaluasi kanal iklan & kedatangan konsumen ke Tarogong Kidul
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Visualisasi Grafik Kontribusi Omzet per Saluran */}
            <div className="crm-card p-5 border border-[#E5E2DB] space-y-4">
              <div>
                <h3 className="text-sm font-bold text-charcoal-900">
                  Kontribusi Omzet per Saluran Promosi
                </h3>
                <p className="text-xs text-charcoal-500">
                  Total omzet transaksi deal yang dihasilkan dari masing-masing kanal
                </p>
              </div>

              <div className="h-60 w-full">
                {sourcePerformance.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-xs text-charcoal-400">
                    Tidak ada data promosi pada periode ini
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={sourcePerformance}
                      layout="vertical"
                      margin={{ top: 5, right: 10, left: 10, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#E5E2DB" horizontal={false} />
                      <XAxis
                        type="number"
                        tick={{ fontSize: 10, fill: '#666666' }}
                        tickFormatter={(v) => `Rp ${v}Jt`}
                      />
                      <YAxis
                        type="category"
                        dataKey="channel"
                        tick={{ fontSize: 11, fill: '#242424' }}
                        width={90}
                      />
                      <Tooltip
                        formatter={(val: any) => [formatRupiah(Number(val) * 1000000), 'Total Omzet']}
                        contentStyle={{
                          backgroundColor: '#ffffff',
                          borderRadius: '10px',
                          border: '1px solid #E5E2DB',
                          fontSize: '11px',
                        }}
                      />
                      <Bar dataKey="revenueJuta" fill={BRAND_COLORS.gold} radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* Tabel Detail Saluran Promosi */}
            <div className="lg:col-span-2 crm-card border border-[#E5E2DB] overflow-hidden">
              <div className="p-4 border-b border-[#E5E2DB] bg-[#FCFBF9]">
                <h3 className="text-sm font-bold text-charcoal-900">
                  Tabel Kinerja Kanal Promosi
                </h3>
                <p className="text-xs text-charcoal-500">
                  Jumlah prospek, deal sukses, dan rasio konversi per sumber
                </p>
              </div>

              <div className="overflow-x-auto">
                <table className="crm-table w-full text-left">
                  <thead>
                    <tr className="bg-[#242424] text-gold-400 text-[11px] font-bold uppercase tracking-wider border-b border-charcoal-800">
                      <th className="py-3 px-4">Saluran Promosi</th>
                      <th className="py-3 px-4">Jumlah Prospek</th>
                      <th className="py-3 px-4">Jumlah Deal</th>
                      <th className="py-3 px-4">Konversi (%)</th>
                      <th className="py-3 px-4">Total Omzet</th>
                      <th className="py-3 px-4 text-center">Status Efektivitas</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E5E2DB] text-xs">
                    {sourcePerformance.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-charcoal-400">
                          Belum ada data prospek pada filter periode ini.
                        </td>
                      </tr>
                    ) : (
                      sourcePerformance.map((s) => (
                        <tr key={s.channelKey} className="hover:bg-gold-50/30 transition-colors">
                          <td className="py-3 px-4 font-bold text-charcoal-900">{s.channel}</td>
                          <td className="py-3 px-4 font-semibold text-charcoal-800">{s.leads} Orang</td>
                          <td className="py-3 px-4 font-bold text-gold-700">{s.deals} Unit</td>
                          <td className="py-3 px-4 font-black text-charcoal-900">{s.conversionRate}%</td>
                          <td className="py-3 px-4 font-bold text-gold-700">{formatRupiah(s.revenue)}</td>
                          <td className="py-3 px-4 text-center">
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                                s.conversionRate >= 30
                                  ? 'badge-gold'
                                  : s.conversionRate >= 15
                                  ? 'bg-[#E5E2DB] text-charcoal-800 border border-charcoal-200'
                                  : 'bg-warm-100 text-charcoal-600'
                              }`}
                            >
                              {s.conversionRate >= 30
                                ? 'Sangat Tinggi'
                                : s.conversionRate >= 15
                                ? 'Optimal'
                                : 'Perlu Optimasi'}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 6. BAGIAN ANALISIS SALES PIPELINE (FUNNEL TAHAPAN) */}
      {(activeTab === 'all' || activeTab === 'pipeline') && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-wider text-charcoal-700 flex items-center gap-1.5">
              <BarChart3 className="w-4 h-4 text-gold-600" />
              Analisis Sales Pipeline (Funnel Tahapan Prospek)
            </h2>
            <span className="text-[11px] text-charcoal-500 font-medium">
              Alur perpindahan konsumen dari tanya unit hingga deal transaksi
            </span>
          </div>

          <div className="crm-card p-5 border border-[#E5E2DB]">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {pipelineFunnel.map((item, idx) => (
                <div
                  key={item.stage}
                  className={`p-3.5 rounded-xl border transition-all ${
                    item.stage === 'Deal'
                      ? 'bg-gold-50/60 border-gold-400'
                      : item.stage === 'Lost'
                      ? 'bg-[#F7F6F2] border-[#E5E2DB]'
                      : 'bg-white border-[#E5E2DB] hover:border-gold-500/40'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-charcoal-500">
                      Tahap {idx + 1}
                    </span>
                    <span
                      className={`text-[10px] font-black px-1.5 py-0.2 rounded ${
                        item.stage === 'Deal'
                          ? 'bg-gold-200 text-gold-900'
                          : 'bg-charcoal-100 text-charcoal-700'
                      }`}
                    >
                      {item.percentage}%
                    </span>
                  </div>
                  <h3 className="font-bold text-xs text-charcoal-900 truncate" title={item.stage}>
                    {item.stage}
                  </h3>
                  <div className="mt-2 flex items-baseline gap-1">
                    <span
                      className={`text-xl font-black ${
                        item.stage === 'Deal' ? 'text-gold-700' : 'text-charcoal-900'
                      }`}
                    >
                      {item.count}
                    </span>
                    <span className="text-[11px] font-medium text-charcoal-400">Prospek</span>
                  </div>
                  <div className="mt-2.5 w-full bg-[#E5E2DB] h-1.5 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        item.stage === 'Deal' ? 'bg-gold-500' : 'bg-charcoal-800'
                      }`}
                      style={{ width: `${Math.min(100, Math.max(5, item.percentage))}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 7. BAGIAN ANALISIS LOST LEADS */}
      {(activeTab === 'all' || activeTab === 'lost') && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-wider text-charcoal-700 flex items-center gap-1.5">
              <XCircle className="w-4 h-4 text-charcoal-700" />
              Analisis Penyebab Calon Pembeli Batal (Lost Leads)
            </h2>
            <span className="text-[11px] text-charcoal-500 font-medium">
              Identifikasi kendala transaksi untuk evaluasi negosiasi & inventori
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Donut Chart Distribusi Alasan Lost */}
            <div className="crm-card p-5 border border-[#E5E2DB] space-y-4">
              <div>
                <h3 className="text-sm font-bold text-charcoal-900">
                  Proporsi Alasan Pembatalan
                </h3>
                <p className="text-xs text-charcoal-500">
                  Penyebab utama prospek tidak melanjutkan pembelian mobil
                </p>
              </div>

              <div className="h-56 w-full flex items-center justify-center">
                {lostReasonsData.length === 0 ? (
                  <span className="text-xs text-charcoal-400">Tidak ada data lost leads pada periode ini</span>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={lostReasonsData}
                        dataKey="count"
                        nameKey="reason"
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={75}
                        paddingAngle={3}
                      >
                        {lostReasonsData.map((_, idx) => (
                          <Cell key={idx} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(val: any) => [`${val} Kasus`, 'Jumlah']}
                        contentStyle={{
                          backgroundColor: '#ffffff',
                          borderRadius: '10px',
                          border: '1px solid #E5E2DB',
                          fontSize: '11px',
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>

              {/* Legend Box */}
              <div className="space-y-1.5 pt-2 border-t border-[#E5E2DB] text-xs">
                {lostReasonsData.map((item, idx) => (
                  <div key={item.reason} className="flex items-center justify-between">
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: PIE_COLORS[idx % PIE_COLORS.length] }}
                      />
                      <span className="text-charcoal-700 truncate">{item.reason}</span>
                    </div>
                    <span className="font-bold text-charcoal-900 shrink-0 ml-2">
                      {item.count} ({totalLostCount > 0 ? ((item.count / totalLostCount) * 100).toFixed(0) : 0}%)
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Rekapitulasi & Solusi Preventif Showroom */}
            <div className="lg:col-span-2 crm-card p-5 border border-[#E5E2DB] space-y-4">
              <div>
                <h3 className="text-sm font-bold text-charcoal-900">
                  Evaluasi & Solusi Preventif Showroom HR MOTOR
                </h3>
                <p className="text-xs text-charcoal-500">
                  Langkah praktis berbasis data riil pembatalan konsumen di Garut
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 text-xs">
                <div className="p-4 bg-[#F7F6F2] rounded-xl border border-[#E5E2DB] space-y-1.5">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-gold-100 text-gold-800 flex items-center justify-center font-bold">
                      1
                    </div>
                    <span className="font-bold text-charcoal-900">Kendala Anggaran & Harga Mobil</span>
                  </div>
                  <p className="text-[11px] text-charcoal-600 leading-relaxed">
                    Sediakan simulasi kredit alternatif dengan tenor hingga 5 tahun dan DP fleksibel bekerjasama dengan multi-finance di Garut (BCA Finance, Adira, Mandiri Utama Finance).
                  </p>
                </div>

                <div className="p-4 bg-[#F7F6F2] rounded-xl border border-[#E5E2DB] space-y-1.5">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-charcoal-200 text-charcoal-800 flex items-center justify-center font-bold">
                      2
                    </div>
                    <span className="font-bold text-charcoal-900">Unit Tidak Sesuai Kebutuhan</span>
                  </div>
                  <p className="text-[11px] text-charcoal-600 leading-relaxed">
                    Gunakan fitur <strong>Auto-Match Stok Unit</strong> untuk langsung menawarkan alternatif mobil sekelas jika unit yang dicari (MPV/SUV) sedang kosong di showroom.
                  </p>
                </div>

                <div className="p-4 bg-[#F7F6F2] rounded-xl border border-[#E5E2DB] space-y-1.5">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-gold-100 text-gold-800 flex items-center justify-center font-bold">
                      3
                    </div>
                    <span className="font-bold text-charcoal-900">Membeli di Showroom Lain</span>
                  </div>
                  <p className="text-[11px] text-charcoal-600 leading-relaxed">
                    Tegaskan nilai tambah <strong>Garansi Mesin & Transmisi 1 Bulan</strong> resmi HR MOTOR dan keaslian dokumen plat Z yang jarang disediakan showroom kompetitor.
                  </p>
                </div>

                <div className="p-4 bg-[#F7F6F2] rounded-xl border border-[#E5E2DB] space-y-1.5">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-charcoal-200 text-charcoal-800 flex items-center justify-center font-bold">
                      4
                    </div>
                    <span className="font-bold text-charcoal-900">Tidak Melanjutkan Komunikasi</span>
                  </div>
                  <p className="text-[11px] text-charcoal-600 leading-relaxed">
                    Jadwalkan pesan tindak lanjut WhatsApp otomatis pada modul Follow-up dengan jeda 3 hari menggunakan sapaan ramah dan foto unit terbaru.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 8. BAGIAN ANALISIS STOK UNIT (INVENTORI SHOWROOM) */}
      {(activeTab === 'all' || activeTab === 'stocks') && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-wider text-charcoal-700 flex items-center gap-1.5">
              <Package className="w-4 h-4 text-gold-600" />
              Analisis Stok Unit & Inventori Showroom
            </h2>
            <span className="text-[11px] text-charcoal-500 font-medium">
              Monitoring ketersediaan unit mobil siap jual di Jalan Otista Garut
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* KPI Cards Ringkasan Stok */}
            <div className="crm-card p-5 border border-[#E5E2DB] space-y-3.5">
              <h3 className="text-sm font-bold text-charcoal-900">
                Ringkasan Inventori Armada
              </h3>

              <div className="space-y-2.5">
                <div className="flex items-center justify-between p-3 bg-[#F7F6F2] rounded-xl border border-[#E5E2DB]">
                  <span className="text-xs font-semibold text-charcoal-600">Total Stok Unit</span>
                  <span className="text-base font-black text-charcoal-900">{stockMetrics.total} Mobil</span>
                </div>

                <div className="flex items-center justify-between p-3 bg-gold-50/60 rounded-xl border border-gold-300">
                  <span className="text-xs font-semibold text-gold-900">Unit Tersedia (Ready)</span>
                  <span className="text-base font-black text-gold-800">{stockMetrics.readyCount} Mobil</span>
                </div>

                <div className="flex items-center justify-between p-3 bg-[#F7F6F2] rounded-xl border border-[#E5E2DB]">
                  <span className="text-xs font-semibold text-charcoal-600">Unit Terjual (Sold)</span>
                  <span className="text-base font-black text-charcoal-800">{stockMetrics.soldCount} Mobil</span>
                </div>

                <div className="flex items-center justify-between p-3 bg-[#F7F6F2] rounded-xl border border-[#E5E2DB]">
                  <span className="text-xs font-semibold text-charcoal-600">Unit Perbaikan / Booking</span>
                  <span className="text-base font-black text-charcoal-700">{stockMetrics.inactiveCount} Mobil</span>
                </div>

                <div className="p-3.5 crm-card-charcoal text-white rounded-xl border border-gold-500/40">
                  <span className="text-[11px] font-semibold text-gold-400 block">
                    Estimasi Nilai Inventori Ready
                  </span>
                  <span className="text-base font-black text-white block mt-0.5 truncate">
                    {formatRupiah(stockMetrics.totalReadyValue)}
                  </span>
                </div>
              </div>
            </div>

            {/* Merek Mobil Paling Dominan di Stok */}
            <div className="lg:col-span-2 crm-card p-5 border border-[#E5E2DB] space-y-4">
              <div>
                <h3 className="text-sm font-bold text-charcoal-900">
                  Distribusi Merek Mobil di Showroom HR MOTOR
                </h3>
                <p className="text-xs text-charcoal-500">
                  Komposisi stok unit bekas berdasarkan pabrikan otomotif
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {stockMetrics.topBrands.map((b) => (
                  <div
                    key={b.brand}
                    className="p-3.5 bg-[#F7F6F2] rounded-xl border border-[#E5E2DB] flex items-center justify-between"
                  >
                    <div>
                      <span className="text-xs font-bold text-charcoal-900 block">{b.brand}</span>
                      <span className="text-[11px] text-charcoal-500">
                        {stockMetrics.total > 0 ? ((b.count / stockMetrics.total) * 100).toFixed(0) : 0}% inventori
                      </span>
                    </div>
                    <span className="text-lg font-black text-gold-700">{b.count} Unit</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
