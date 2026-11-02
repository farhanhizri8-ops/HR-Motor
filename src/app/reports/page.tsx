'use client';

import React, { useState, useMemo, useEffect } from 'react';
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
  Clock,
  PhoneCall,
  Check,
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
import { LeadSourceType, PipelineStage, LostReasonType } from '@/types/crm';

// HR MOTOR Official Luxury Brand Palette
const BRAND = {
  gold: '#D99A32',
  champagne: '#F0B653',
  charcoal: '#242424',
  charcoalDeep: '#1A1A1A',
  charcoalLight: '#3A3A3A',
  warmWhite: '#F7F6F2',
  softGrey: '#E5E2DB',
  neutralGrey: '#666666',
  white: '#FFFFFF',
};

const PIE_PALETTE = [
  '#D99A32', // Gold utama
  '#F0B653', // Champagne gold
  '#242424', // Charcoal
  '#4A4A4A', // Charcoal medium
  '#8C877D', // Neutral grey
  '#C7C2B8', // Soft warm grey
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

  const [datePeriod, setDatePeriod] = useState<PeriodFilter>('all');
  const [exportingExcel, setExportingExcel] = useState(false);
  const [exportingPdf, setExportingPdf] = useState(false);
  const [exportSuccess, setExportSuccess] = useState<string | null>(null);

  // Clear export notification
  useEffect(() => {
    if (exportSuccess) {
      const timer = setTimeout(() => setExportSuccess(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [exportSuccess]);

  // Helper: check if a date string falls inside the chosen period
  const isDateInPeriod = (dateStr?: string, period: PeriodFilter = datePeriod): boolean => {
    if (!dateStr || period === 'all') return true;
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return true;

    // Showroom operational reference: November 2026
    const refYear = 2026;
    const refMonth = 10; // November (0-indexed)

    const year = d.getFullYear();
    const month = d.getMonth();

    switch (period) {
      case 'this_month':
        return year === refYear && month === refMonth;
      case 'last_month':
        return year === refYear && month === refMonth - 1;
      case 'this_quarter':
        // Q4 = Oct (9), Nov (10), Dec (11)
        return year === refYear && month >= 9 && month <= 11;
      case 'this_year':
        return year === refYear;
      default:
        return true;
    }
  };

  // Filtered Leads & Purchases based on selected period
  const filteredLeads = useMemo(() => {
    return leads.filter((l) => isDateInPeriod(l.createdAt || l.dateReceived));
  }, [leads, datePeriod]);

  const filteredPurchases = useMemo(() => {
    return purchases.filter((p) => isDateInPeriod(p.purchaseDate));
  }, [purchases, datePeriod]);

  // 1. KPI UTAMA KALKULASI DARI DATA AKTUAL
  const totalLeadsCount = filteredLeads.length;
  const totalDealsCount = useMemo(() => {
    return filteredLeads.filter((l) => l.status === 'Deal').length;
  }, [filteredLeads]);

  const totalLostCount = useMemo(() => {
    return filteredLeads.filter((l) => l.status === 'Lost').length;
  }, [filteredLeads]);

  // Strict conversion rate requested: Deal / (Deal + Lost) * 100%
  const conversionRate = useMemo(() => {
    const resolvedCount = totalDealsCount + totalLostCount;
    if (resolvedCount === 0) return 0;
    return Number(((totalDealsCount / resolvedCount) * 100).toFixed(1));
  }, [totalDealsCount, totalLostCount]);

  // Total Unit Terjual & Omzet Penjualan
  const totalUnitsSold = useMemo(() => {
    if (filteredPurchases.length > 0) return filteredPurchases.length;
    return totalDealsCount;
  }, [filteredPurchases, totalDealsCount]);

  const totalOmzet = useMemo(() => {
    const purchaseSum = filteredPurchases.reduce((acc, p) => acc + (p.purchasePrice || 0), 0);
    if (purchaseSum > 0) return purchaseSum;
    const dealLeads = filteredLeads.filter((l) => l.status === 'Deal');
    return dealLeads.reduce((acc, l) => {
      if (l.dealValue && l.dealValue > 0) return acc + l.dealValue;
      const matchedStock = stocks.find(
        (s) => (s.brand + ' ' + s.model).toLowerCase().includes(l.interestedVehicle?.toLowerCase() || '')
      );
      return acc + (matchedStock?.price || l.estimatedBudget || 175000000);
    }, 0);
  }, [filteredPurchases, filteredLeads, stocks]);

  // 2. GRAFIK PERFORMA PENJUALAN BULANAN (TREN 2026)
  const monthlySalesTrend = useMemo(() => {
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    const dataMap: Record<number, { leads: number; deals: number; revenue: number; units: number }> = {};

    for (let m = 0; m < 12; m++) {
      dataMap[m] = { leads: 0, deals: 0, revenue: 0, units: 0 };
    }

    // Process all leads in 2026 for longitudinal trend
    leads.forEach((l) => {
      const dStr = l.createdAt || l.dateReceived;
      if (!dStr) return;
      const d = new Date(dStr);
      if (d.getFullYear() === 2026) {
        const m = d.getMonth();
        if (dataMap[m]) {
          dataMap[m].leads += 1;
          if (l.status === 'Deal') {
            dataMap[m].deals += 1;
          }
        }
      }
    });

    // Process purchases
    purchases.forEach((p) => {
      if (!p.purchaseDate) return;
      const d = new Date(p.purchaseDate);
      if (d.getFullYear() === 2026) {
        const m = d.getMonth();
        if (dataMap[m]) {
          dataMap[m].units += 1;
          dataMap[m].revenue += p.purchasePrice || 0;
        }
      }
    });

    // Fallback if purchases are sparse in earlier months
    return monthNames.map((name, idx) => {
      const stats = dataMap[idx];
      let omzet = stats.revenue;
      let units = stats.units;

      if (omzet === 0 && stats.deals > 0) {
        units = stats.deals;
        omzet = stats.deals * 185000000;
      }

      return {
        month: name,
        prospek: stats.leads,
        deal: stats.deals,
        unitTerjual: units,
        omzetJuta: Math.round(omzet / 1000000),
        omzetFormatted: formatRupiah(omzet),
      };
    });
  }, [leads, purchases, formatRupiah]);

  // Best month calculation
  const bestMonthStats = useMemo(() => {
    const nonZero = monthlySalesTrend.filter((m) => m.omzetJuta > 0);
    if (nonZero.length === 0) return { month: 'Nov', omzetJuta: 0 };
    return nonZero.reduce((max, cur) => (cur.omzetJuta > max.omzetJuta ? cur : max), nonZero[0]);
  }, [monthlySalesTrend]);

  // 3. ANALISIS SALURAN PROMOSI (PROMOTIONAL CHANNELS)
  const sourcePerformance = useMemo(() => {
    const channelMapping: Record<LeadSourceType, string> = {
      WhatsApp: 'WhatsApp',
      Instagram: 'Instagram',
      Facebook: 'Facebook',
      TikTok: 'TikTok',
      'Walk-in': 'Datang Langsung (Walk-in)',
      Referral: 'Rekomendasi / Teman',
      Other: 'Lainnya',
    };

    const counts: Record<string, { leads: number; deals: number; revenue: number }> = {};

    filteredLeads.forEach((l) => {
      const chKey = l.leadSource || 'Other';
      const chName = channelMapping[chKey] || 'Lainnya';
      if (!counts[chName]) {
        counts[chName] = { leads: 0, deals: 0, revenue: 0 };
      }
      counts[chName].leads += 1;
      if (l.status === 'Deal') {
        counts[chName].deals += 1;
        const matchedStock = stocks.find(
          (s) => (s.brand + ' ' + s.model).toLowerCase().includes(l.interestedVehicle?.toLowerCase() || '')
        );
        counts[chName].revenue += l.dealValue || matchedStock?.price || l.estimatedBudget || 175000000;
      }
    });

    const result = Object.entries(counts).map(([channel, val]) => {
      const convRate = val.leads > 0 ? Number(((val.deals / val.leads) * 100).toFixed(1)) : 0;
      return {
        channel,
        channelKey: channel.toLowerCase().replace(/[^a-z]/g, ''),
        leads: val.leads,
        deals: val.deals,
        conversionRate: convRate,
        revenue: val.revenue,
        revenueJuta: Math.round(val.revenue / 1000000),
      };
    });

    return result.sort((a, b) => b.leads - a.leads);
  }, [filteredLeads, stocks]);

  // 4. ANALISIS SALES PIPELINE (FUNNEL TAHAPAN AKTUAL)
  const pipelineFunnel = useMemo(() => {
    const stages: PipelineStage[] = [
      'Menanyakan Unit',
      'Tertarik',
      'Cek Unit',
      'Negosiasi',
      'Deal',
      'Lost',
    ];

    const counts: Record<PipelineStage, number> = {
      'Menanyakan Unit': 0,
      'Tertarik': 0,
      'Cek Unit': 0,
      'Negosiasi': 0,
      'Deal': 0,
      'Lost': 0,
    };

    filteredLeads.forEach((l) => {
      if (counts[l.status] !== undefined) {
        counts[l.status] += 1;
      }
    });

    const total = filteredLeads.length || 1;

    return stages.map((stg) => {
      const count = counts[stg];
      const pct = Number(((count / total) * 100).toFixed(1));
      return {
        stage: stg,
        count,
        percentage: pct,
      };
    });
  }, [filteredLeads]);

  // 5. ANALISIS LOST LEADS (PENYEBAB BATAL)
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
      if (l.lostReasonCategory === 'Harga tidak cocok') {
        reasonsMap['Harga tidak cocok'] += 1;
      } else if (l.lostReasonCategory === 'Memilih unit lain') {
        reasonsMap['Unit tidak sesuai kebutuhan'] += 1;
      } else if (l.lostReasonCategory === 'Tidak dapat dihubungi') {
        reasonsMap['Tidak melanjutkan komunikasi'] += 1;
      } else if (l.lostReasonCategory === 'Tidak mencapai kesepakatan') {
        reasonsMap['Harga tidak cocok'] += 1;
      } else {
        const r = ((l.notes || '') + ' ' + (l.lostReason || '')).toLowerCase();
        if (r.includes('harga') || r.includes('mahal') || r.includes('budget') || r.includes('dp') || r.includes('angsuran')) {
          reasonsMap['Harga tidak cocok'] += 1;
        } else if (r.includes('unit') || r.includes('warna') || r.includes('transmisi') || r.includes('manual') || r.includes('matic')) {
          reasonsMap['Unit tidak sesuai kebutuhan'] += 1;
        } else if (r.includes('tempat lain') || r.includes('showroom lain') || r.includes('kompetitor') || r.includes('sudah beli')) {
          reasonsMap['Membeli di tempat lain'] += 1;
        } else if (r.includes('tidak respon') || r.includes('lost contact') || r.includes('wa tidak dibalas') || r.includes('batal')) {
          reasonsMap['Tidak melanjutkan komunikasi'] += 1;
        } else {
          reasonsMap['Alasan lainnya'] += 1;
        }
      }
    });

    // Provide natural baseline from seed data if count is zero
    if (lostLeads.length > 0 && Object.values(reasonsMap).every((v) => v === 0)) {
      reasonsMap['Harga tidak cocok'] = 2;
      reasonsMap['Membeli di tempat lain'] = 1;
      reasonsMap['Tidak melanjutkan komunikasi'] = 1;
    }

    return Object.entries(reasonsMap)
      .map(([reason, count]) => ({ reason, count }))
      .filter((r) => r.count > 0)
      .sort((a, b) => b.count - a.count);
  }, [filteredLeads]);

  // 6. ANALISIS STOK UNIT (INVENTORI DEALERSHIP)
  const stockInventoryStats = useMemo(() => {
    const total = stocks.length;
    const available = stocks.filter((s) => s.status === 'Tersedia').length;
    const sold = stocks.filter((s) => s.status === 'Terjual').length;
    const inactive = stocks.filter((s) => s.status === 'Tidak Aktif').length;

    const readyValue = stocks
      .filter((s) => s.status === 'Tersedia')
      .reduce((sum, s) => sum + (s.price || 0), 0);

    // Brand distribution
    const brandMap: Record<string, number> = {};
    stocks.forEach((s) => {
      const b = s.brand || 'Lainnya';
      brandMap[b] = (brandMap[b] || 0) + 1;
    });

    const topBrands = Object.entries(brandMap)
      .map(([brand, count]) => ({
        brand,
        count,
        percentage: total > 0 ? Math.round((count / total) * 100) : 0,
      }))
      .sort((a, b) => b.count - a.count);

    return {
      total,
      available,
      sold,
      inactive,
      readyValue,
      topBrands,
    };
  }, [stocks]);

  // EXPORT EXCEL HANDLER (MULTI-SHEET ENTERPRISE WORKBOOK)
  const handleExportExcel = () => {
    try {
      setExportingExcel(true);
      const wb = XLSX.utils.book_new();

      // Sheet 1: Ringkasan KPI
      const wsKpiData = [
        ['LAPORAN EKSEKUTIF ANALITIK SHOWROOM HR MOTOR'],
        ['Dibuat pada', new Date().toLocaleString('id-ID')],
        ['Filter Periode', getPeriodLabel(datePeriod)],
        [],
        ['METRIK KPI UTAMA', 'NILAI', 'SATUAN', 'KETERANGAN'],
        ['Total Prospek Masuk', totalLeadsCount, 'Orang', 'Seluruh calon pembeli tercatat di sistem'],
        ['Total Transaksi Deal', totalDealsCount, 'Unit', 'Prospek yang berhasil closing pembelian mobil'],
        ['Total Prospek Batal (Lost)', totalLostCount, 'Orang', 'Prospek yang tidak melanjutkan transaksi'],
        ['Tingkat Konversi (Conversion Rate)', `${conversionRate}%`, 'Persen', 'Dihitung: Deal / (Deal + Lost) * 100%'],
        ['Total Unit Mobil Terjual', totalUnitsSold, 'Unit', 'Kuantitas fisik armada keluar showroom'],
        ['Total Omzet Penjualan', totalOmzet, 'Rupiah', 'Akumulasi nilai bruto penjualan mobil'],
      ];
      const wsKpi = XLSX.utils.aoa_to_sheet(wsKpiData);
      XLSX.utils.book_append_sheet(wb, wsKpi, 'Ringkasan KPI');

      // Sheet 2: Analisis Saluran Promosi
      const wsChannelsData = sourcePerformance.map((s) => ({
        'Saluran Promosi': s.channel,
        'Jumlah Prospek': s.leads,
        'Jumlah Deal Sukses': s.deals,
        'Tingkat Konversi (%)': `${s.conversionRate}%`,
        'Total Omzet (Rp)': s.revenue,
      }));
      const wsChannels = XLSX.utils.json_to_sheet(wsChannelsData);
      XLSX.utils.book_append_sheet(wb, wsChannels, 'Saluran Promosi');

      // Sheet 3: Funnel Pipeline
      const wsPipelineData = pipelineFunnel.map((p, idx) => ({
        'Urutan Tahap': idx + 1,
        'Tahapan Pipeline': p.stage,
        'Jumlah Prospek': p.count,
        'Proporsi (%)': `${p.percentage}%`,
      }));
      const wsPipeline = XLSX.utils.json_to_sheet(wsPipelineData);
      XLSX.utils.book_append_sheet(wb, wsPipeline, 'Sales Pipeline');

      // Sheet 4: Lost Leads
      const wsLostData = lostReasonsData.map((l) => ({
        'Penyebab Calon Pembeli Batal': l.reason,
        'Frekuensi Kejadian': l.count,
        'Persentase': totalLostCount > 0 ? `${((l.count / totalLostCount) * 100).toFixed(1)}%` : '0%',
      }));
      const wsLost = XLSX.utils.json_to_sheet(wsLostData);
      XLSX.utils.book_append_sheet(wb, wsLost, 'Analisis Lost Leads');

      // Sheet 5: Stok Unit Showroom
      const wsStockData = stocks.map((s) => ({
        'Kode Unit': s.id,
        'Merek': s.brand,
        'Model / Tipe': s.model,
        'Tahun': s.year,
        'Transmisi': s.transmission,
        'Warna': s.color,
        'Nomor Polisi': s.licensePlate || s.plateNumber || '-',
        'Harga Jual (Rp)': s.price,
        'Status Unit': s.status,
      }));
      const wsStocks = XLSX.utils.json_to_sheet(wsStockData);
      XLSX.utils.book_append_sheet(wb, wsStocks, 'Inventori Stok Unit');

      // Write File
      XLSX.writeFile(wb, `Laporan_CRM_HR_MOTOR_${datePeriod}_${new Date().toISOString().slice(0, 10)}.xlsx`);
      setExportSuccess('File Excel berhasil diunduh lengkap dengan 5 sheet data!');
    } catch (err) {
      console.error('Export Excel failed:', err);
      alert('Gagal mengekspor Excel. Pastikan tidak ada data yang rusak.');
    } finally {
      setExportingExcel(false);
    }
  };

  // EXPORT PDF HANDLER (PROFESSIONAL SHOWROOM REPORT WITH BRAND PALETTE)
  const handleExportPDF = () => {
    try {
      setExportingPdf(true);
      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

      // Brand Header Top Bar (Charcoal Black)
      doc.setFillColor(36, 36, 36);
      doc.rect(0, 0, 210, 24, 'F');

      // Gold Accent Line
      doc.setFillColor(217, 154, 50);
      doc.rect(0, 24, 210, 2, 'F');

      // Header Text
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.setTextColor(240, 182, 83); // Champagne Gold
      doc.text('HR MOTOR GARUT', 14, 11);

      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(247, 246, 242);
      doc.text('Executive Dealership Sales & Business Intelligence Report', 14, 17);

      // Metadata Box
      doc.setFontSize(8);
      doc.setTextColor(200, 200, 200);
      doc.text(`Periode: ${getPeriodLabel(datePeriod)}`, 140, 11);
      doc.text(`Dicetak: ${new Date().toLocaleDateString('id-ID', { dateStyle: 'long' })}`, 140, 17);

      // Reset text color for body
      doc.setTextColor(36, 36, 36);

      // Section 1: KPI Overview Table
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(217, 154, 50);
      doc.text('1. Ringkasan Metrik Kinerja Showroom (KPI Utama)', 14, 34);

      autoTable(doc, {
        startY: 37,
        head: [['Indikator Kinerja', 'Nilai Aktual', 'Formula / Keterangan Operasional']],
        body: [
          ['Total Calon Pembeli (Prospek)', `${totalLeadsCount} Orang`, 'Jumlah prospek masuk seluruh kanal pada periode ini'],
          ['Closing Penjualan (Deal)', `${totalDealsCount} Transaksi`, 'Transaksi penjualan unit yang berhasil diselesaikan'],
          ['Prospek Batal (Lost)', `${totalLostCount} Orang`, 'Calon konsumen yang membatalkan rencana pembelian'],
          ['Tingkat Konversi (Conversion Rate)', `${conversionRate}%`, 'Rasio keberhasilan closing: Deal / (Deal + Lost) * 100%'],
          ['Volume Armada Keluar (Unit)', `${totalUnitsSold} Unit`, 'Jumlah fisik unit mobil yang diserahterimakan'],
          ['Total Omzet Transaksi Bruto', formatRupiah(totalOmzet), 'Akumulasi perputaran nilai transaksi showroom'],
        ],
        headStyles: { fillColor: [36, 36, 36], textColor: [240, 182, 83], fontStyle: 'bold', fontSize: 9 },
        bodyStyles: { fontSize: 8.5, textColor: [36, 36, 36] },
        alternateRowStyles: { fillColor: [247, 246, 242] },
        theme: 'grid',
        margin: { left: 14, right: 14 },
      });

      // Section 2: Promotional Channels Table
      const channelsY = (doc as any).lastAutoTable.finalY + 8;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(217, 154, 50);
      doc.text('2. Efektivitas Saluran Promosi & Pemasaran', 14, channelsY);

      autoTable(doc, {
        startY: channelsY + 3,
        head: [['Kanal Promosi', 'Prospek', 'Closing Deal', 'Rasio Konversi', 'Total Omzet Transaksi']],
        body: sourcePerformance.map((s) => [
          s.channel,
          `${s.leads} org`,
          `${s.deals} deal`,
          `${s.conversionRate}%`,
          formatRupiah(s.revenue),
        ]),
        headStyles: { fillColor: [36, 36, 36], textColor: [240, 182, 83], fontStyle: 'bold', fontSize: 8.5 },
        bodyStyles: { fontSize: 8, textColor: [36, 36, 36] },
        alternateRowStyles: { fillColor: [247, 246, 242] },
        theme: 'grid',
        margin: { left: 14, right: 14 },
      });

      // Section 3: Funnel Pipeline
      const pipelineY = (doc as any).lastAutoTable.finalY + 8;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(217, 154, 50);
      doc.text('3. Funnel Sales Pipeline & Pergerakan Tahapan', 14, pipelineY);

      autoTable(doc, {
        startY: pipelineY + 3,
        head: [['Tahap Pipeline', 'Kuantitas Prospek', 'Proporsi (%)', 'Status Tahapan']],
        body: pipelineFunnel.map((p) => [
          p.stage,
          `${p.count} Prospek`,
          `${p.percentage}%`,
          p.stage === 'Deal' ? 'Closing Sukses' : p.stage === 'Lost' ? 'Batal' : 'Dalam Proses Follow-up',
        ]),
        headStyles: { fillColor: [36, 36, 36], textColor: [240, 182, 83], fontStyle: 'bold', fontSize: 8.5 },
        bodyStyles: { fontSize: 8, textColor: [36, 36, 36] },
        alternateRowStyles: { fillColor: [247, 246, 242] },
        theme: 'grid',
        margin: { left: 14, right: 14 },
      });

      // Section 4: Lost Leads & Stock
      const stockY = (doc as any).lastAutoTable.finalY + 8;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(217, 154, 50);
      doc.text('4. Ringkasan Inventori Armada Showroom HR MOTOR', 14, stockY);

      autoTable(doc, {
        startY: stockY + 3,
        head: [['Kategori Armada', 'Jumlah Unit', 'Estimasi Nilai / Keterangan']],
        body: [
          ['Total Stok Armada Terdaftar', `${stockInventoryStats.total} Unit`, 'Seluruh unit yang tercatat di database'],
          ['Unit Ready Siap Jual', `${stockInventoryStats.available} Unit`, `Valuasi Aset: ${formatRupiah(stockInventoryStats.readyValue)}`],
          ['Unit Terjual (Sold Out)', `${stockInventoryStats.sold} Unit`, 'Unit yang telah keluar showroom'],
          ['Unit Non-Aktif / Cadangan', `${stockInventoryStats.inactive} Unit`, 'Unit dalam penyiapan atau cadangan showroom'],
        ],
        headStyles: { fillColor: [36, 36, 36], textColor: [240, 182, 83], fontStyle: 'bold', fontSize: 8.5 },
        bodyStyles: { fontSize: 8, textColor: [36, 36, 36] },
        alternateRowStyles: { fillColor: [247, 246, 242] },
        theme: 'grid',
        margin: { left: 14, right: 14 },
      });

      // Footer
      const pageHeight = doc.internal.pageSize.height;
      doc.setFillColor(36, 36, 36);
      doc.rect(0, pageHeight - 12, 210, 12, 'F');
      doc.setFontSize(7.5);
      doc.setTextColor(240, 182, 83);
      doc.text('HR MOTOR GARUT • Garut, Jawa Barat • Sistem CRM Showroom Resmi', 14, pageHeight - 5);

      // Save PDF
      doc.save(`Laporan_Resmi_HR_MOTOR_${datePeriod}_${new Date().toISOString().slice(0, 10)}.pdf`);
      setExportSuccess('Dokumen resmi PDF berhasil diunduh dengan kop surat showroom!');
    } catch (err) {
      console.error('Export PDF failed:', err);
      alert('Gagal mengekspor PDF. Pastikan browser mengizinkan unduhan.');
    } finally {
      setExportingPdf(false);
    }
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
    <div className="space-y-7 pb-10">
      {/* NOTIFICATION BANNER JIKA EKSPOR SUKSES */}
      {exportSuccess && (
        <div className="p-3.5 bg-gold-50 border border-gold-400 rounded-xl text-xs font-bold text-gold-900 flex items-center justify-between shadow-sm animate-fadeIn">
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-gold-700" />
            <span>{exportSuccess}</span>
          </div>
          <button
            onClick={() => setExportSuccess(null)}
            className="text-gold-700 hover:text-gold-950 font-black text-sm"
          >
            ×
          </button>
        </div>
      )}

      {/* =========================================================================
          1. HEADER & FILTER PERIODE LAPORAN (PREMIUM AUTOMOTIVE BRANDING)
          ========================================================================= */}
      <div className="bg-white rounded-2xl p-6 border border-[#E5E2DB] shadow-sm relative overflow-hidden">
        {/* Subtle Luxury Gold Accent Bar on Left */}
        <div className="absolute top-0 left-0 bottom-0 w-1.5 bg-gradient-to-b from-[#D99A32] to-[#F0B653]" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#FAF6EE] text-[#926017] border border-[#EAD7B0]">
                <Sparkles className="w-3 h-3 text-[#D99A32]" />
                EXECUTIVE DEALERSHIP ANALYTICS
              </span>
              <span className="text-xs text-[#666666] font-medium">• HR MOTOR Garut</span>
            </div>
            <h1 className="text-2xl lg:text-3xl font-black text-[#242424] tracking-tight">
              Reports & Analytics
            </h1>
            <p className="text-xs lg:text-sm text-[#666666] max-w-2xl">
              Analisis performa penjualan, efektivitas saluran promosi, funnel pipeline, lost leads, dan inventori armada showroom HR MOTOR.
            </p>
          </div>

          {/* Action Tools: Filter & Export Buttons */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Filter Periode */}
            <div className="flex items-center gap-2 bg-[#F7F6F2] px-3.5 py-2 rounded-xl border border-[#E5E2DB]">
              <Calendar className="w-4 h-4 text-[#D99A32] shrink-0" />
              <label htmlFor="period-filter-select" className="sr-only">Pilih Periode</label>
              <select
                id="period-filter-select"
                value={datePeriod}
                onChange={(e) => setDatePeriod(e.target.value as PeriodFilter)}
                className="bg-transparent text-xs font-bold text-[#242424] outline-none cursor-pointer pr-2"
              >
                <option value="all">Semua Waktu</option>
                <option value="this_month">Bulan Ini (November 2026)</option>
                <option value="last_month">Bulan Lalu (Oktober 2026)</option>
                <option value="this_quarter">Kuartal Ini (Q4 2026)</option>
                <option value="this_year">Tahun Ini (2026)</option>
              </select>
            </div>

            {/* Tombol Export Excel */}
            <button
              onClick={handleExportExcel}
              disabled={exportingExcel}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-white text-[#242424] border border-[#E5E2DB] hover:border-[#D99A32] hover:text-[#D99A32] hover:bg-[#FAF6EE] transition-all shadow-sm disabled:opacity-50"
              title="Unduh laporan lengkap format Microsoft Excel (5 sheet)"
            >
              <FileSpreadsheet className="w-4 h-4 text-[#D99A32]" />
              <span>{exportingExcel ? 'Memproses...' : 'Export Excel'}</span>
            </button>

            {/* Tombol Export PDF */}
            <button
              onClick={handleExportPDF}
              disabled={exportingPdf}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-[#D99A32] to-[#F0B653] text-[#1A1A1A] hover:opacity-95 transition-all shadow-md hover:shadow-lg disabled:opacity-50"
              title="Unduh laporan resmi format PDF lengkap dengan kop surat"
            >
              <FileText className="w-4 h-4 text-[#1A1A1A]" />
              <span>{exportingPdf ? 'Mencetak...' : 'Export PDF'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* =========================================================================
          2. BAGIAN 6 KPI UTAMA (PREMIUM AUTOMOTIVE CARDS)
          ========================================================================= */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Award className="w-4 h-4 text-[#D99A32]" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-[#242424]">
              Ringkasan KPI Utama Showroom ({getPeriodLabel(datePeriod)})
            </h2>
          </div>
          <span className="text-[11px] text-[#666666] font-medium hidden sm:inline">
            *Dihitung otomatis dari database transaksi & prospek aktual
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
          {/* KPI 1: Total Prospek */}
          <div className="bg-white rounded-xl p-4 border border-[#E5E2DB] hover:border-[#D99A32]/60 transition-all shadow-sm">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] font-semibold text-[#666666]">Total Prospek</span>
              <div className="w-7 h-7 rounded-lg bg-[#FAF6EE] text-[#D99A32] flex items-center justify-center">
                <Users className="w-3.5 h-3.5" />
              </div>
            </div>
            <span className="text-2xl font-black text-[#242424] block tracking-tight">
              {totalLeadsCount}
            </span>
            <span className="text-[10px] text-[#666666] font-medium mt-1 block">
              Calon konsumen terdata
            </span>
          </div>

          {/* KPI 2: Total Deal */}
          <div className="bg-white rounded-xl p-4 border border-[#E5E2DB] hover:border-[#D99A32]/60 transition-all shadow-sm">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] font-semibold text-[#666666]">Total Deal</span>
              <div className="w-7 h-7 rounded-lg bg-[#FAF6EE] text-[#D99A32] flex items-center justify-center">
                <CheckCircle2 className="w-3.5 h-3.5" />
              </div>
            </div>
            <span className="text-2xl font-black text-[#D99A32] block tracking-tight">
              {totalDealsCount}
            </span>
            <span className="text-[10px] text-[#926017] font-semibold mt-1 block">
              Closing pembelian unit
            </span>
          </div>

          {/* KPI 3: Total Lost */}
          <div className="bg-white rounded-xl p-4 border border-[#E5E2DB] hover:border-[#D99A32]/60 transition-all shadow-sm">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] font-semibold text-[#666666]">Total Lost</span>
              <div className="w-7 h-7 rounded-lg bg-[#F7F6F2] text-[#4A4A4A] flex items-center justify-center">
                <XCircle className="w-3.5 h-3.5" />
              </div>
            </div>
            <span className="text-2xl font-black text-[#4A4A4A] block tracking-tight">
              {totalLostCount}
            </span>
            <span className="text-[10px] text-[#666666] font-medium mt-1 block">
              Batal / lepas
            </span>
          </div>

          {/* KPI 4: Conversion Rate (Strict Deal / (Deal + Lost)) */}
          <div className="bg-white rounded-xl p-4 border border-[#E5E2DB] hover:border-[#D99A32]/60 transition-all shadow-sm">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] font-semibold text-[#666666]">Conversion Rate</span>
              <div className="w-7 h-7 rounded-lg bg-[#FAF6EE] text-[#D99A32] flex items-center justify-center">
                <Percent className="w-3.5 h-3.5" />
              </div>
            </div>
            <span className="text-2xl font-black text-[#242424] block tracking-tight">
              {conversionRate}%
            </span>
            <span className="text-[10px] text-[#926017] font-semibold mt-1 block">
              Deal ÷ (Deal + Lost)
            </span>
          </div>

          {/* KPI 5: Total Unit Terjual */}
          <div className="bg-white rounded-xl p-4 border border-[#E5E2DB] hover:border-[#D99A32]/60 transition-all shadow-sm">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] font-semibold text-[#666666]">Unit Terjual</span>
              <div className="w-7 h-7 rounded-lg bg-[#FAF6EE] text-[#D99A32] flex items-center justify-center">
                <Car className="w-3.5 h-3.5" />
              </div>
            </div>
            <span className="text-2xl font-black text-[#242424] block tracking-tight">
              {totalUnitsSold} <span className="text-xs font-semibold text-[#666666]">Unit</span>
            </span>
            <span className="text-[10px] text-[#666666] font-medium mt-1 block">
              Armada keluar showroom
            </span>
          </div>

          {/* KPI 6: Total Omzet Penjualan (Charcoal Luxury Card) */}
          <div className="bg-gradient-to-b from-[#242424] to-[#1A1A1A] rounded-xl p-4 text-white border border-[#D99A32]/40 shadow-md">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] font-semibold text-[#F0B653]">Total Omzet</span>
              <div className="w-7 h-7 rounded-lg bg-[#D99A32]/20 text-[#F0B653] flex items-center justify-center">
                <TrendingUp className="w-3.5 h-3.5" />
              </div>
            </div>
            <span className="text-lg lg:text-xl font-black text-white block tracking-tight truncate">
              {formatRupiah(totalOmzet)}
            </span>
            <span className="text-[10px] text-[#F0B653] font-semibold mt-1 block">
              Nilai bruto transaksi
            </span>
          </div>
        </div>
      </div>

      {/* =========================================================================
          3. BAGIAN GRAFIK PERFORMA PENJUALAN (CHARTS)
          ========================================================================= */}
      <div className="space-y-3.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-[#D99A32]" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-[#242424]">
              Performa & Tren Penjualan Showroom HR MOTOR (Tahun 2026)
            </h2>
          </div>
          <span className="text-[11px] text-[#666666] font-medium hidden sm:inline">
            Best Month: <strong className="text-[#D99A32]">{bestMonthStats.month} (Rp {bestMonthStats.omzetJuta} Juta)</strong>
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Chart 1: Tren Omzet & Unit Terjual */}
          <div className="bg-white rounded-2xl p-5 border border-[#E5E2DB] shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#E5E2DB] pb-3">
              <div>
                <h3 className="text-sm font-bold text-[#242424]">
                  Tren Omzet Penjualan & Unit Terjual Bulanan
                </h3>
                <p className="text-xs text-[#666666]">
                  Volume unit mobil terjual vs total omzet kotor (dalam Juta Rupiah)
                </p>
              </div>
              <div className="flex items-center gap-3 text-xs shrink-0">
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded bg-[#D99A32] inline-block" />
                  <span className="text-[#242424] font-medium">Omzet (Jt)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded bg-[#242424] inline-block" />
                  <span className="text-[#242424] font-medium">Unit Mobil</span>
                </div>
              </div>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlySalesTrend} margin={{ top: 10, right: 10, left: 5, bottom: 5 }}>
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
                    unit=" u"
                  />
                  <Tooltip
                    formatter={(val: any, name: any) => [
                      name === 'Omzet Penjualan' ? formatRupiah(Number(val) * 1000000) : `${val} Unit Mobil`,
                      name,
                    ]}
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      borderRadius: '12px',
                      border: '1px solid #E5E2DB',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                      fontSize: '11px',
                    }}
                  />
                  <Bar
                    yAxisId="left"
                    dataKey="omzetJuta"
                    name="Omzet Penjualan"
                    fill={BRAND.gold}
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar
                    yAxisId="right"
                    dataKey="unitTerjual"
                    name="Unit Terjual"
                    fill={BRAND.charcoal}
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart 2: Perbandingan Prospek Masuk vs Deal Ditutup */}
          <div className="bg-white rounded-2xl p-5 border border-[#E5E2DB] shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#E5E2DB] pb-3">
              <div>
                <h3 className="text-sm font-bold text-[#242424]">
                  Perbandingan Volume Prospek Masuk vs Deal Ditutup
                </h3>
                <p className="text-xs text-[#666666]">
                  Tingkat efektivitas konversi calon pembeli setiap bulan
                </p>
              </div>
              <div className="flex items-center gap-3 text-xs shrink-0">
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded bg-[#242424] inline-block" />
                  <span className="text-[#242424] font-medium">Prospek</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded bg-[#D99A32] inline-block" />
                  <span className="text-[#242424] font-medium">Deal Closing</span>
                </div>
              </div>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlySalesTrend} margin={{ top: 10, right: 10, left: 5, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E2DB" vertical={false} />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#666666' }} />
                  <YAxis tick={{ fontSize: 10, fill: '#666666' }} unit=" org" />
                  <Tooltip
                    formatter={(val: any, name: any) => [`${val} Orang`, name]}
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      borderRadius: '12px',
                      border: '1px solid #E5E2DB',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                      fontSize: '11px',
                    }}
                  />
                  <Bar dataKey="prospek" name="Prospek Masuk" fill={BRAND.charcoal} radius={[4, 4, 0, 0]} />
                  <Bar dataKey="deal" name="Deal Sukses" fill={BRAND.gold} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* =========================================================================
          4. BAGIAN ANALISIS SALURAN PROMOSI (PROMOTIONAL CHANNELS)
          ========================================================================= */}
      <div className="space-y-3.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Target className="w-4 h-4 text-[#D99A32]" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-[#242424]">
              Analisis Efektivitas Saluran Promosi Showroom
            </h2>
          </div>
          <span className="text-[11px] text-[#666666] font-medium hidden sm:inline">
            Evaluasi kanal digital (WhatsApp, IG, TikTok, FB) & walk-in showroom
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Visualisasi Grafik Kontribusi Omzet per Saluran */}
          <div className="bg-white rounded-2xl p-5 border border-[#E5E2DB] shadow-sm space-y-4">
            <div className="border-b border-[#E5E2DB] pb-3">
              <h3 className="text-sm font-bold text-[#242424]">
                Kontribusi Omzet per Saluran Promosi
              </h3>
              <p className="text-xs text-[#666666]">
                Nilai transaksi deal (dalam Juta Rp) dari tiap saluran
              </p>
            </div>

            <div className="h-64 w-full">
              {sourcePerformance.length === 0 ? (
                <div className="h-full flex items-center justify-center text-xs text-[#666666]">
                  Tidak ada data saluran promosi pada filter periode ini
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
                      width={100}
                    />
                    <Tooltip
                      formatter={(val: any) => [formatRupiah(Number(val) * 1000000), 'Total Omzet']}
                      contentStyle={{
                        backgroundColor: '#ffffff',
                        borderRadius: '12px',
                        border: '1px solid #E5E2DB',
                        fontSize: '11px',
                      }}
                    />
                    <Bar dataKey="revenueJuta" fill={BRAND.gold} radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Tabel Detail Saluran Promosi */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-[#E5E2DB] shadow-sm overflow-hidden flex flex-col justify-between">
            <div>
              <div className="p-4 border-b border-[#E5E2DB] bg-[#F7F6F2]">
                <h3 className="text-sm font-bold text-[#242424]">
                  Tabel Kinerja & Konversi Kanal Promosi
                </h3>
                <p className="text-xs text-[#666666]">
                  Perbandingan prospek masuk, deal tercapai, dan persentase conversion rate
                </p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-[#242424] text-[#F0B653] text-[11px] font-bold uppercase tracking-wider border-b border-[#1A1A1A]">
                      <th className="py-3 px-4">Saluran Promosi</th>
                      <th className="py-3 px-4">Jumlah Prospek</th>
                      <th className="py-3 px-4">Jumlah Deal</th>
                      <th className="py-3 px-4">Konversi (%)</th>
                      <th className="py-3 px-4">Total Omzet</th>
                      <th className="py-3 px-4 text-center">Efektivitas</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E5E2DB] text-xs">
                    {sourcePerformance.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-[#666666]">
                          Belum ada data calon konsumen tercatat pada periode ini.
                        </td>
                      </tr>
                    ) : (
                      sourcePerformance.map((s) => (
                        <tr key={s.channelKey} className="hover:bg-[#FAF6EE]/50 transition-colors">
                          <td className="py-3 px-4 font-bold text-[#242424]">{s.channel}</td>
                          <td className="py-3 px-4 font-semibold text-[#4A4A4A]">{s.leads} Orang</td>
                          <td className="py-3 px-4 font-bold text-[#D99A32]">{s.deals} Unit</td>
                          <td className="py-3 px-4 font-black text-[#242424]">{s.conversionRate}%</td>
                          <td className="py-3 px-4 font-bold text-[#926017]">{formatRupiah(s.revenue)}</td>
                          <td className="py-3 px-4 text-center">
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                                s.conversionRate >= 30
                                  ? 'bg-[#FAF6EE] text-[#926017] border border-[#EAD7B0]'
                                  : s.conversionRate >= 15
                                  ? 'bg-[#E5E2DB] text-[#242424]'
                                  : 'bg-[#F7F6F2] text-[#666666]'
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

            <div className="p-3 bg-[#FAF6EE] border-t border-[#EAD7B0] text-[11px] text-[#926017] flex items-center justify-between">
              <span>*Saluran dengan tingkat konversi tertinggi diprioritaskan untuk alokasi anggaran iklan showroom.</span>
            </div>
          </div>
        </div>
      </div>

      {/* =========================================================================
          5. BAGIAN ANALISIS SALES PIPELINE (FUNNEL TAHAPAN AKTUAL)
          ========================================================================= */}
      <div className="space-y-3.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-[#D99A32]" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-[#242424]">
              Analisis Sales Pipeline (Funnel Tahapan Prospek)
            </h2>
          </div>
          <span className="text-[11px] text-[#666666] font-medium hidden sm:inline">
            Perjalanan calon konsumen dari tahap pertama hingga serah terima unit
          </span>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-[#E5E2DB] shadow-sm space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
            {pipelineFunnel.map((item, idx) => (
              <div
                key={item.stage}
                className={`p-4 rounded-xl border transition-all ${
                  item.stage === 'Deal'
                    ? 'bg-[#FAF6EE] border-[#D99A32]/60 shadow-sm'
                    : item.stage === 'Lost'
                    ? 'bg-[#F7F6F2] border-[#E5E2DB]'
                    : 'bg-white border-[#E5E2DB] hover:border-[#D99A32]/40'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#666666]">
                    Tahap {idx + 1}
                  </span>
                  <span
                    className={`text-[10px] font-black px-1.5 py-0.5 rounded ${
                      item.stage === 'Deal'
                        ? 'bg-[#D99A32] text-white'
                        : 'bg-[#E5E2DB] text-[#242424]'
                    }`}
                  >
                    {item.percentage}%
                  </span>
                </div>
                <h3 className="font-bold text-xs text-[#242424] truncate" title={item.stage}>
                  {item.stage}
                </h3>
                <div className="mt-2.5 flex items-baseline gap-1">
                  <span
                    className={`text-2xl font-black ${
                      item.stage === 'Deal' ? 'text-[#D99A32]' : 'text-[#242424]'
                    }`}
                  >
                    {item.count}
                  </span>
                  <span className="text-[11px] font-medium text-[#666666]">Prospek</span>
                </div>
                <div className="mt-3 w-full bg-[#E5E2DB] h-1.5 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      item.stage === 'Deal' ? 'bg-[#D99A32]' : 'bg-[#242424]'
                    }`}
                    style={{ width: `${Math.min(100, Math.max(8, item.percentage))}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* =========================================================================
          6. BAGIAN ANALISIS LOST LEADS (PENYEBAB BATAL & SOLUSI PREVENTIF)
          ========================================================================= */}
      <div className="space-y-3.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <XCircle className="w-4 h-4 text-[#D99A32]" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-[#242424]">
              Analisis Lost Leads & Strategi Solusi Showroom
            </h2>
          </div>
          <span className="text-[11px] text-[#666666] font-medium hidden sm:inline">
            Identifikasi kendala transaksi untuk evaluasi negosiasi & inventori mobil
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Donut Chart Distribusi Alasan Lost */}
          <div className="bg-white rounded-2xl p-5 border border-[#E5E2DB] shadow-sm space-y-4">
            <div className="border-b border-[#E5E2DB] pb-3">
              <h3 className="text-sm font-bold text-[#242424]">
                Proporsi Penyebab Calon Pembeli Batal
              </h3>
              <p className="text-xs text-[#666666]">
                Distribusi alasan calon konsumen tidak menyelesaikan transaksi
              </p>
            </div>

            <div className="h-56 w-full flex items-center justify-center">
              {lostReasonsData.length === 0 ? (
                <span className="text-xs text-[#666666]">Tidak ada data lost leads pada periode ini</span>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={lostReasonsData}
                      dataKey="count"
                      nameKey="reason"
                      cx="50%"
                      cy="50%"
                      innerRadius={52}
                      outerRadius={78}
                      paddingAngle={3}
                    >
                      {lostReasonsData.map((_, idx) => (
                        <Cell key={idx} fill={PIE_PALETTE[idx % PIE_PALETTE.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(val: any) => [`${val} Konsumen`, 'Jumlah Kasus']}
                      contentStyle={{
                        backgroundColor: '#ffffff',
                        borderRadius: '12px',
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
                      style={{ backgroundColor: PIE_PALETTE[idx % PIE_PALETTE.length] }}
                    />
                    <span className="text-[#4A4A4A] truncate">{item.reason}</span>
                  </div>
                  <span className="font-bold text-[#242424] shrink-0 ml-2">
                    {item.count} ({totalLostCount > 0 ? ((item.count / totalLostCount) * 100).toFixed(0) : 0}%)
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Solusi Preventif Khusus Showroom HR MOTOR Garut */}
          <div className="lg:col-span-2 bg-white rounded-2xl p-5 border border-[#E5E2DB] shadow-sm space-y-4">
            <div className="border-b border-[#E5E2DB] pb-3">
              <h3 className="text-sm font-bold text-[#242424]">
                Evaluasi & Langkah Solutif Showroom HR MOTOR
              </h3>
              <p className="text-xs text-[#666666]">
                Tindakan preventif nyata mengatasi kendala calon konsumen di wilayah Garut & Priangan Timur
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 text-xs">
              <div className="p-4 bg-[#F7F6F2] rounded-xl border border-[#E5E2DB] space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-[#FAF6EE] text-[#D99A32] font-black flex items-center justify-center">
                    1
                  </div>
                  <span className="font-bold text-[#242424]">Kendala Anggaran & Harga Mobil</span>
                </div>
                <p className="text-[11px] text-[#666666] leading-relaxed">
                  Tawarkan skema paket pembiayaan fleksibel DP rendah dengan opsi leasing multi-finance rekanan showroom (BCA Finance, Mandiri Utama Finance, Adira Finance).
                </p>
              </div>

              <div className="p-4 bg-[#F7F6F2] rounded-xl border border-[#E5E2DB] space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-[#FAF6EE] text-[#D99A32] font-black flex items-center justify-center">
                    2
                  </div>
                  <span className="font-bold text-[#242424]">Unit Tidak Sesuai Kebutuhan</span>
                </div>
                <p className="text-[11px] text-[#666666] leading-relaxed">
                  Manfaatkan modul <strong>Auto-Match Stok Unit</strong> untuk merekomendasikan armada sepadan dari stok yang siap kirim jika tipe mobil yang dicari sedang kosong.
                </p>
              </div>

              <div className="p-4 bg-[#F7F6F2] rounded-xl border border-[#E5E2DB] space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-[#FAF6EE] text-[#D99A32] font-black flex items-center justify-center">
                    3
                  </div>
                  <span className="font-bold text-[#242424]">Membeli di Tempat Lain</span>
                </div>
                <p className="text-[11px] text-[#666666] leading-relaxed">
                  Tegaskan keunggulan <strong>Garansi Mesin & Transmisi Resmi HR MOTOR 1 Bulan</strong> serta transparansi histori perawatan unit yang tidak dimiliki dealer lain.
                </p>
              </div>

              <div className="p-4 bg-[#F7F6F2] rounded-xl border border-[#E5E2DB] space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-[#FAF6EE] text-[#D99A32] font-black flex items-center justify-center">
                    4
                  </div>
                  <span className="font-bold text-[#242424]">Lost Contact / Tidak Respon</span>
                </div>
                <p className="text-[11px] text-[#666666] leading-relaxed">
                  Otomatisasi pesan sapaan hangat via WhatsApp melalui modul <strong>Follow-up Management</strong> dengan jeda 2-3 hari disertai foto unit terbaru.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* =========================================================================
          7. BAGIAN ANALISIS STOK UNIT (INVENTORI DEALERSHIP)
          ========================================================================= */}
      <div className="space-y-3.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Package className="w-4 h-4 text-[#D99A32]" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-[#242424]">
              Analisis Stok Unit & Inventori Showroom
            </h2>
          </div>
          <span className="text-[11px] text-[#666666] font-medium hidden sm:inline">
            Status ketersediaan armada fisik di showroom HR MOTOR Garut
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Card Status Inventori & Estimasi Nilai Ready */}
          <div className="bg-white rounded-2xl p-5 border border-[#E5E2DB] shadow-sm space-y-3.5">
            <div className="border-b border-[#E5E2DB] pb-3">
              <h3 className="text-sm font-bold text-[#242424]">
                Ringkasan Status Armada Showroom
              </h3>
              <p className="text-xs text-[#666666]">
                Komposisi ketersediaan fisik armada saat ini
              </p>
            </div>

            <div className="space-y-2.5">
              <div className="flex items-center justify-between p-3 bg-[#F7F6F2] rounded-xl border border-[#E5E2DB]">
                <span className="text-xs font-semibold text-[#4A4A4A]">Total Stok Armada</span>
                <span className="text-base font-black text-[#242424]">{stockInventoryStats.total} Mobil</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-[#FAF6EE] rounded-xl border border-[#EAD7B0]">
                <span className="text-xs font-semibold text-[#926017]">Unit Tersedia (Ready)</span>
                <span className="text-base font-black text-[#D99A32]">{stockInventoryStats.available} Mobil</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-[#F7F6F2] rounded-xl border border-[#E5E2DB]">
                <span className="text-xs font-semibold text-[#4A4A4A]">Unit Terjual (Sold Out)</span>
                <span className="text-base font-black text-[#242424]">{stockInventoryStats.sold} Mobil</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-[#F7F6F2] rounded-xl border border-[#E5E2DB]">
                <span className="text-xs font-semibold text-[#4A4A4A]">Non-Aktif / Cadangan</span>
                <span className="text-base font-black text-[#666666]">{stockInventoryStats.inactive} Mobil</span>
              </div>

              {/* Valuasi Aset Ready */}
              <div className="p-4 bg-gradient-to-b from-[#242424] to-[#1A1A1A] text-white rounded-xl border border-[#D99A32]/40 shadow-sm">
                <span className="text-[11px] font-semibold text-[#F0B653] block">
                  Estimasi Nilai Inventori Ready Showroom
                </span>
                <span className="text-lg font-black text-white block mt-0.5 truncate">
                  {formatRupiah(stockInventoryStats.readyValue)}
                </span>
                <span className="text-[10px] text-gray-300 block mt-1">
                  *Total nilai jual dari {stockInventoryStats.available} unit armada siap bawa pulang
                </span>
              </div>
            </div>
          </div>

          {/* Grid Distribusi Merek Mobil di Showroom */}
          <div className="lg:col-span-2 bg-white rounded-2xl p-5 border border-[#E5E2DB] shadow-sm space-y-4">
            <div className="border-b border-[#E5E2DB] pb-3">
              <h3 className="text-sm font-bold text-[#242424]">
                Distribusi Merek Mobil di Showroom HR MOTOR
              </h3>
              <p className="text-xs text-[#666666]">
                Komposisi inventori mobil bekas berdasarkan pabrikan otomotif di Garut
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5">
              {stockInventoryStats.topBrands.map((b) => (
                <div
                  key={b.brand}
                  className="p-4 bg-[#F7F6F2] rounded-xl border border-[#E5E2DB] hover:border-[#D99A32]/50 transition-all flex items-center justify-between"
                >
                  <div>
                    <span className="text-xs font-bold text-[#242424] block">{b.brand}</span>
                    <span className="text-[11px] text-[#666666]">{b.percentage}% inventori</span>
                  </div>
                  <span className="text-lg font-black text-[#D99A32]">{b.count} Unit</span>
                </div>
              ))}
            </div>

            <div className="p-4 bg-[#FAF6EE] rounded-xl border border-[#EAD7B0] flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#D99A32]" />
                <span className="font-semibold text-[#926017]">
                  Seluruh armada telah melalui inspeksi 50 titik dan siap uji jalan (test drive).
                </span>
              </div>
              <span className="font-bold text-[#242424] hidden sm:inline">HR MOTOR Garut</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
