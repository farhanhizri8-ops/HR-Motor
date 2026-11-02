'use client';

import React, { useState, useMemo } from 'react';
import {
  BarChart3,
  Download,
  Calendar,
  Filter,
  Users,
  Target,
  Trophy,
  XCircle,
  TrendingUp,
  FileSpreadsheet,
  FileText,
  Search,
  CheckCircle2,
  PieChart as PieIcon,
  Award,
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

export default function ReportsAnalyticsPage() {
  const {
    customers,
    leads,
    followUps,
    purchases,
    feedback,
    repairClaims,
    users,
    metrics,
    formatRupiah,
    formatDate,
  } = useCrm();

  const [datePeriod, setDatePeriod] = useState<'bulan_ini' | '7_hari' | 'kuartal' | 'semua'>('bulan_ini');
  const [activeTab, setActiveTab] = useState<'overview' | 'sources' | 'reps' | 'lost'>('overview');

  // Sales Representative Performance Leaderboard
  const salesLeaderboard = useMemo(() => {
    const salesReps = users.filter((u) => u.role === 'Sales Representative' || u.role === 'CRM Administrator');

    return salesReps.map((rep) => {
      const repLeads = leads.filter((l) => l.assignedSalesId === rep.id);
      const repDeals = leads.filter((l) => l.assignedSalesId === rep.id && l.status === 'Deal');
      const repLost = leads.filter((l) => l.assignedSalesId === rep.id && l.status === 'Lost');
      const repFollowUps = followUps.filter((f) => f.assignedSalesId === rep.id);
      const repCompletedFollowUps = repFollowUps.filter((f) => f.status === 'Selesai');

      const totalDealValue = purchases
        .filter((p) => p.salesId === rep.id)
        .reduce((sum, p) => sum + (p.purchasePrice || 0), 0);

      const repResolved = repDeals.length + repLost.length;
      const convRate = repResolved > 0 ? Math.round((repDeals.length / repResolved) * 100) : 0;
      const followUpRate = repFollowUps.length > 0 ? Math.round((repCompletedFollowUps.length / repFollowUps.length) * 100) : 0;

      return {
        id: rep.id,
        name: rep.name,
        role: rep.role,
        totalLeads: repLeads.length,
        dealsClosed: repDeals.length,
        lostLeads: repLost.length,
        totalDealValue,
        conversionRate: convRate,
        followUpCompletionRate: followUpRate,
      };
    }).sort((a, b) => b.dealsClosed - a.dealsClosed || b.totalDealValue - a.totalDealValue);
  }, [users, leads, followUps, purchases]);

  // Lead Source Performance Analysis
  const sourcePerformance = useMemo(() => {
    const sources = ['WhatsApp', 'Instagram', 'Facebook', 'TikTok', 'Walk-in', 'Referral', 'Other'];

    return sources.map((src) => {
      const srcLeads = leads.filter((l) => l.leadSource === src);
      const srcDeals = leads.filter((l) => l.leadSource === src && l.status === 'Deal');
      const srcLost = leads.filter((l) => l.leadSource === src && l.status === 'Lost');
      const srcResolved = srcDeals.length + srcLost.length;
      const convRate = srcResolved > 0 ? Math.round((srcDeals.length / srcResolved) * 100) : 0;
      const totalRevenue = leads
        .filter((l) => l.leadSource === src && l.status === 'Deal')
        .reduce((sum, l) => sum + (l.dealValue || l.estimatedBudget || 0), 0);

      return {
        source: src,
        leads: srcLeads.length,
        deals: srcDeals.length,
        conversionRate: convRate,
        revenue: totalRevenue,
      };
    }).filter((s) => s.leads > 0);
  }, [leads]);

  // Lost Lead Reasons (Official Showroom Categories)
  const lostReasonsAnalysis = useMemo(() => {
    const lostLeads = leads.filter((l) => l.status === 'Lost');
    const counts: Record<string, number> = {
      'Harga tidak cocok': 0,
      'Memilih unit lain': 0,
      'Tidak jadi membeli': 0,
      'Tidak mencapai kesepakatan': 0,
      'Tidak dapat dihubungi': 0,
      'Alasan lainnya': 0,
    };

    lostLeads.forEach((l) => {
      const category = l.lostReasonCategory;
      if (category && counts[category] !== undefined) {
        counts[category]++;
      } else {
        const text = l.lostReason || '';
        if (text.includes('Harga') || text.includes('Budget')) counts['Harga tidak cocok']++;
        else if (text.includes('unit lain') || text.includes('showroom')) counts['Memilih unit lain']++;
        else if (text.includes('kesepakatan') || text.includes('kredit') || text.includes('leasing')) counts['Tidak mencapai kesepakatan']++;
        else if (text.includes('Tidak dapat dihubungi') || text.includes('ghosting')) counts['Tidak dapat dihubungi']++;
        else if (text.includes('Tidak jadi')) counts['Tidak jadi membeli']++;
        else counts['Alasan lainnya']++;
      }
    });

    return Object.entries(counts)
      .map(([reason, count]) => ({ reason, count }))
      .filter((item) => item.count > 0);
  }, [leads]);

  const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ec4899', '#8b5cf6', '#ef4444', '#06b6d4'];

  // EXPORT TO EXCEL
  const handleExportExcel = () => {
    const wb = XLSX.utils.book_new();

    // Sheet 1: Ringkasan CRM
    const summaryData = [
      ['LAPORAN CRM HR MOTOR GARUT', ''],
      ['Tanggal Ekspor', new Date().toLocaleDateString('id-ID')],
      ['Lokasi', 'Garut, Jawa Barat, Indonesia'],
      ['', ''],
      ['Metrik Utama', 'Nilai'],
      ['Total Pelanggan Terdaftar', metrics.totalCustomers],
      ['Total Prospek Masuk', metrics.totalLeads],
      ['Prospek Aktif di Pipeline', metrics.activeLeads],
      ['Total Deal Penjualan', metrics.totalDeals],
      ['Tingkat Konversi Keseluruhan (%)', `${metrics.conversionRate}%`],
      ['Total Nilai Transaksi Deal (Rp)', metrics.totalDealValue],
    ];
    const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(wb, wsSummary, 'Ringkasan CRM');

    // Sheet 2: Data Pelanggan
    const customerRows = customers.map((c) => ({
      'ID Pelanggan': c.id,
      'Nama Lengkap': c.fullName,
      'Nomor WhatsApp': c.whatsapp,
      'Email': c.email || '-',
      'Alamat': c.address,
      'Kecamatan': c.district,
      'Sumber': c.source,
      'Mobil Diminati': c.interestedVehicle,
      'Budget (Rp)': c.budget,
      'Tanggal Daftar': c.registeredDate,
    }));
    const wsCustomers = XLSX.utils.json_to_sheet(customerRows);
    XLSX.utils.book_append_sheet(wb, wsCustomers, 'Database Pelanggan');

    // Sheet 3: Pipeline & Deals
    const leadRows = leads.map((l) => ({
      'ID Prospek': l.id,
      'Nama Calon': l.customerName,
      'No. Kontak': l.contactNumber,
      'Sumber Prospek': l.leadSource,
      'Unit Diminati': l.interestedVehicle,
      'Estimasi Budget (Rp)': l.estimatedBudget,
      'Tahap Saat Ini': l.status,
      'Sales PJ': l.assignedSalesName,
      'Alasan Lost': l.lostReason || '-',
      'Nilai Deal (Rp)': l.dealValue || 0,
      'Tanggal Masuk': l.dateReceived,
    }));
    const wsLeads = XLSX.utils.json_to_sheet(leadRows);
    XLSX.utils.book_append_sheet(wb, wsLeads, 'Sales Pipeline');

    // Sheet 4: Kinerja Sales Representative
    const repRows = salesLeaderboard.map((r) => ({
      'Nama Sales': r.name,
      'Total Prospek Ditangani': r.totalLeads,
      'Deal Ditutup': r.dealsClosed,
      'Prospek Lost': r.lostLeads,
      'Tingkat Konversi (%)': `${r.conversionRate}%`,
      'Total Nilai Penjualan (Rp)': r.totalDealValue,
      'Penyelesaian Follow-up (%)': `${r.followUpCompletionRate}%`,
    }));
    const wsReps = XLSX.utils.json_to_sheet(repRows);
    XLSX.utils.book_append_sheet(wb, wsReps, 'Kinerja Sales');

    // Sheet 5: Garansi & Perbaikan Mobil
    const repairRows = (repairClaims || []).map((r, idx) => ({
      'No.': idx + 1,
      'No. Klaim': r.claimNumber,
      'Nama Konsumen': r.customerName,
      'WhatsApp': r.customerPhone,
      'Unit Mobil': `${r.vehicleBrand} ${r.vehicleModel} (${r.vehicleYear})`,
      'Tgl Pembelian': r.purchaseDate || '-',
      'Tgl Pengajuan': r.claimDate,
      'Jenis Pengajuan': r.claimType,
      'Kategori Kerusakan': r.damageCategory,
      'Keluhan': r.complaint,
      'Bagian Diperbaiki': r.damagedParts || '-',
      'Tindakan': r.actionTaken || '-',
      'Biaya Sparepart (Rp)': r.sparepartCost,
      'Biaya Jasa (Rp)': r.serviceCost,
      'Total Biaya (Rp)': r.totalCost,
      'Status': r.status,
      'Catatan': r.notes || '-',
    }));
    const wsRepairs = XLSX.utils.json_to_sheet(repairRows);
    XLSX.utils.book_append_sheet(wb, wsRepairs, 'Garansi & Perbaikan');

    XLSX.writeFile(wb, `HR_MOTOR_GARUT_CRM_REPORT_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  // EXPORT TO PDF
  const handleExportPDF = () => {
    const doc = new jsPDF();

    // HR MOTOR Letterhead
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('HR MOTOR GARUT — DEALERSHIP CRM REPORT', 14, 18);

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text('Showroom Pusat: Jl. Otista No. 128, Tarogong Kidul, Garut, Jawa Barat', 14, 24);
    doc.text(`Waktu Cetak: ${new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })} WIB | Dibuat oleh: ${users[0]?.name || 'Sistem CRM'}`, 14, 29);

    doc.setLineWidth(0.5);
    doc.setDrawColor(16, 185, 129); // emerald line
    doc.line(14, 32, 196, 32);

    // Summary KPI Table
    autoTable(doc, {
      startY: 36,
      head: [['Metrik CRM Utama', 'Jumlah / Nilai']],
      body: [
        ['Total Pelanggan Terdaftar', String(metrics.totalCustomers)],
        ['Total Prospek Masuk', String(metrics.totalLeads)],
        ['Prospek Aktif di Pipeline', String(metrics.activeLeads)],
        ['Total Deal Sukses', `${metrics.totalDeals} Transaksi (${formatRupiah(metrics.totalDealValue)})`],
        ['Tingkat Konversi (Conversion Rate)', `${metrics.conversionRate}%`],
        ['Follow-up Terlambat', String(metrics.followUpsOverdue)],
      ],
      theme: 'grid',
      headStyles: { fillColor: [16, 31, 66] },
      styles: { fontSize: 8 },
    });

    // Sales Representative Performance Table
    doc.text('Kinerja Sales Representative HR MOTOR Garut:', 14, (doc as any).lastAutoTable.finalY + 10);

    const repTableBody = salesLeaderboard.map((r) => [
      r.name,
      String(r.totalLeads),
      String(r.dealsClosed),
      `${r.conversionRate}%`,
      formatRupiah(r.totalDealValue),
      `${r.followUpCompletionRate}%`,
    ]);

    autoTable(doc, {
      startY: (doc as any).lastAutoTable.finalY + 14,
      head: [['Nama Sales', 'Prospek', 'Deal', 'Konversi', 'Total Omset Deal', 'Follow-up']],
      body: repTableBody,
      theme: 'striped',
      headStyles: { fillColor: [16, 185, 129] },
      styles: { fontSize: 8 },
    });

    // Source Performance Table
    doc.text('Efektivitas Saluran Prospek (Lead Sources):', 14, (doc as any).lastAutoTable.finalY + 10);

    const sourceTableBody = sourcePerformance.map((s) => [
      s.source,
      String(s.leads),
      String(s.deals),
      `${s.conversionRate}%`,
      formatRupiah(s.revenue),
    ]);

    autoTable(doc, {
      startY: (doc as any).lastAutoTable.finalY + 14,
      head: [['Sumber Lead', 'Jumlah Prospek', 'Deal Sukses', 'Tingkat Konversi', 'Omset']],
      body: sourceTableBody,
      theme: 'grid',
      headStyles: { fillColor: [30, 41, 59] },
      styles: { fontSize: 8 },
    });

    doc.save(`HR_MOTOR_CRM_LAPORAN_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-200">
              Laporan Eksekutif CRM
            </span>
            <span className="text-xs text-slate-400">•</span>
            <span className="text-xs text-slate-500">Analitik & Evaluasi</span>
          </div>
          <h1 className="text-xl lg:text-2xl font-black text-slate-900 mt-1">
            Reports & Analytics (Laporan Kinerja CRM)
          </h1>
          <p className="text-xs text-slate-500">
            Analisis pertumbuhan pelanggan, efektivitas saluran prospek, leaderboard sales, dan ekspor dokumen Excel & PDF.
          </p>
        </div>

        {/* Export Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleExportExcel}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded-xl transition-colors shadow-xs"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            Ekspor Excel (.xlsx)
          </button>
          <button
            onClick={handleExportPDF}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-emerald-600 rounded-xl transition-colors shadow-xs"
          >
            <FileText className="w-4 h-4 text-white" />
            Ekspor PDF Resmi
          </button>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex p-1 bg-white rounded-xl border border-slate-200 max-w-xl shadow-xs">
        <button
          onClick={() => setActiveTab('overview')}
          className={`flex-1 py-1.5 px-3 text-xs font-bold rounded-lg transition-all ${
            activeTab === 'overview'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Ringkasan & ROI
        </button>
        <button
          onClick={() => setActiveTab('sources')}
          className={`flex-1 py-1.5 px-3 text-xs font-bold rounded-lg transition-all ${
            activeTab === 'sources'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Saluran Prospek
        </button>
        <button
          onClick={() => setActiveTab('reps')}
          className={`flex-1 py-1.5 px-3 text-xs font-bold rounded-lg transition-all ${
            activeTab === 'reps'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Kinerja Sales Rep
        </button>
        <button
          onClick={() => setActiveTab('lost')}
          className={`flex-1 py-1.5 px-3 text-xs font-bold rounded-lg transition-all ${
            activeTab === 'lost'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Analisis Lost Leads
        </button>
      </div>

      {/* TAB 1: OVERVIEW & ROI */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Sales Pipeline Conversion Funnel */}
            <div className="crm-card p-5">
              <h2 className="text-sm font-bold text-slate-900 mb-1">
                Kinerja Konversi Saluran (Lead to Deal)
              </h2>
              <p className="text-xs text-slate-500 mb-4">
                Tingkat konversi per saluran pemasaran mobil bekas
              </p>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={sourcePerformance}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="source" tick={{ fontSize: 11 }} />
                    <YAxis unit="%" tick={{ fontSize: 11 }} />
                    <Tooltip
                      formatter={(val: any) => [`${val}%`, 'Konversi']}
                      contentStyle={{ backgroundColor: '#ffffff', borderRadius: '8px', fontSize: '12px' }}
                    />
                    <Bar dataKey="conversionRate" fill="#10b981" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Revenue Contribution by Source */}
            <div className="crm-card p-5">
              <h2 className="text-sm font-bold text-slate-900 mb-1">
                Kontribusi Omset Deal Menurut Sumber (Rp)
              </h2>
              <p className="text-xs text-slate-500 mb-4">
                Total nominal penjualan unit berdasarkan asal calon pembeli
              </p>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={sourcePerformance} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis type="number" tickFormatter={(v) => `Rp ${(v / 1000000).toFixed(0)}Jt`} tick={{ fontSize: 10 }} />
                    <YAxis type="category" dataKey="source" tick={{ fontSize: 11 }} width={80} />
                    <Tooltip
                      formatter={(val: any) => [formatRupiah(val), 'Omset']}
                      contentStyle={{ backgroundColor: '#ffffff', borderRadius: '8px', fontSize: '12px' }}
                    />
                    <Bar dataKey="revenue" fill="#101F42" radius={[0, 6, 6, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: SOURCES PERFORMANCE */}
      {activeTab === 'sources' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100">
            <h2 className="text-sm font-bold text-slate-900">
              Tabel Analitik Sumber Prospek (Lead Source Performance)
            </h2>
            <p className="text-xs text-slate-500">
              Evaluasi efektivitas biaya dan produktivitas setiap kanal promosi HR MOTOR Garut
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                  <th className="py-3 px-4">Saluran / Media</th>
                  <th className="py-3 px-4">Total Prospek Masuk</th>
                  <th className="py-3 px-4">Deal Penjualan Sukses</th>
                  <th className="py-3 px-4">Tingkat Konversi (%)</th>
                  <th className="py-3 px-4">Total Omset Transaksi</th>
                  <th className="py-3 px-4">Status Efektivitas</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sourcePerformance.map((s) => (
                  <tr key={s.source} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 font-bold text-slate-900">{s.source}</td>
                    <td className="py-3 px-4 font-semibold text-slate-800">{s.leads} Prospek</td>
                    <td className="py-3 px-4 font-bold text-emerald-700">{s.deals} Deal</td>
                    <td className="py-3 px-4">
                      <span className="font-extrabold text-slate-800">{s.conversionRate}%</span>
                    </td>
                    <td className="py-3 px-4 font-black text-slate-900">{formatRupiah(s.revenue)}</td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          s.conversionRate >= 25
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {s.conversionRate >= 25 ? 'Sangat Tinggi (ROI Prima)' : 'Stabil'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: SALES REPRESENTATIVE LEADERBOARD */}
      {activeTab === 'reps' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
              <Award className="w-4 h-4 text-amber-500" />
              Leaderboard Kinerja Tim Sales HR MOTOR Garut
            </h2>
            <p className="text-xs text-slate-500">
              Evaluasi kecepatan respon, rasio penutupan deal, dan kepatuhan tindak lanjut follow-up
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                  <th className="py-3 px-4">Peringkat & Nama Sales</th>
                  <th className="py-3 px-4">Peran</th>
                  <th className="py-3 px-4">Prospek Ditugaskan</th>
                  <th className="py-3 px-4">Deal Ditutup</th>
                  <th className="py-3 px-4">Prospek Lost</th>
                  <th className="py-3 px-4">Tingkat Konversi</th>
                  <th className="py-3 px-4">Kepatuhan Follow-up</th>
                  <th className="py-3 px-4">Total Omset Penjualan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {salesLeaderboard.map((rep, idx) => (
                  <tr key={rep.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <span
                          className={`w-5 h-5 rounded-full flex items-center justify-center font-black text-[10px] ${
                            idx === 0
                              ? 'bg-amber-400 text-amber-950 shadow-xs'
                              : idx === 1
                              ? 'bg-slate-300 text-slate-800'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {idx + 1}
                        </span>
                        <span className="font-bold text-slate-900">{rep.name}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-slate-600">{rep.role}</td>
                    <td className="py-3 px-4 font-semibold text-slate-800">{rep.totalLeads} Prospek</td>
                    <td className="py-3 px-4 font-bold text-emerald-700">{rep.dealsClosed} Unit</td>
                    <td className="py-3 px-4 text-rose-600 font-semibold">{rep.lostLeads}</td>
                    <td className="py-3 px-4 font-extrabold text-slate-900">{rep.conversionRate}%</td>
                    <td className="py-3 px-4">
                      <span className="font-semibold text-emerald-700">
                        {rep.followUpCompletionRate}% Selesai
                      </span>
                    </td>
                    <td className="py-3 px-4 font-black text-slate-900">
                      {formatRupiah(rep.totalDealValue)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: LOST LEADS ANALYSIS */}
      {activeTab === 'lost' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Lost Reasons Pie Chart */}
            <div className="crm-card p-5">
              <h2 className="text-sm font-bold text-slate-900 mb-1">
                Distribusi Alasan Pembatalan (Lost Reasons)
              </h2>
              <p className="text-xs text-slate-500 mb-4">
                Penyebab utama prospek tidak berlanjut menjadi transaksi
              </p>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={lostReasonsAnalysis}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      paddingAngle={4}
                      dataKey="count"
                      nameKey="reason"
                    >
                      {lostReasonsAnalysis.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ backgroundColor: '#ffffff', borderRadius: '8px', fontSize: '12px' }}
                    />
                    <Legend wrapperStyle={{ fontSize: '11px' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Strategic Recommendations Card */}
            <div className="crm-card p-5 space-y-4">
              <h2 className="text-sm font-bold text-slate-900">
                Rekomendasi Strategis CRM untuk HR MOTOR
              </h2>
              <div className="space-y-3 text-xs text-slate-600">
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
                  <p className="font-bold text-emerald-900">1. Sinergi dengan Multi-Leasing</p>
                  <p className="text-[11px] text-emerald-800 mt-0.5">
                    Sebagian besar alasan lost disebabkan oleh penolakan BI checking pada 1 leasing. Menyediakan opsi leasing alternatif (MUF, Adira, OTO) dapat menyelamatkan hingga 30% prospek kredit.
                  </p>
                </div>

                <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl">
                  <p className="font-bold text-blue-900">2. Kecepatan Respon WhatsApp Prospek TikTok/IG</p>
                  <p className="text-[11px] text-blue-800 mt-0.5">
                    Prospek dari media sosial memiliki rentang perhatian pendek. Menjaga respons &lt; 15 menit menggunakan template percakapan terbukti meningkatkan konversi test drive.
                  </p>
                </div>

                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl">
                  <p className="font-bold text-amber-900">3. Optimalisasi Garansi & Layanan Purna Jual</p>
                  <p className="text-[11px] text-amber-800 mt-0.5">
                    Garansi mesin 1 tahun resmi HR MOTOR menjadi faktor penentu utama konsumen Garut memilih membeli di showroom lokal daripada ke Bandung.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
