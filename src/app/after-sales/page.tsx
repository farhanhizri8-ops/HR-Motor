'use client';

import React, { useState, useMemo } from 'react';
import {
  ShieldCheck,
  Star,
  AlertTriangle,
  Gift,
  Plus,
  Car,
  FileText,
  Clock,
  CheckCircle2,
  Phone,
  MessageCircle,
  X,
  Search,
  Filter,
  Users,
  Wrench,
  FileSpreadsheet,
  Printer,
  Download,
  DollarSign,
  TrendingUp,
  AlertCircle,
  Eye,
  Edit,
  Trash2,
  ChevronRight,
  PieChart as PieIcon,
  BarChart3,
  Calendar,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useCrm } from '@/context/CrmContext';
import {
  CustomerComplaint,
  CustomerFeedback,
  RepairClaim,
  RepairClaimType,
  RepairStatus,
  RepairPartCategory,
} from '@/types/crm';

const REPAIR_CATEGORIES: RepairPartCategory[] = [
  'Mesin',
  'Transmisi',
  'Kaki-kaki & Suspensi',
  'Kelistrikan & AC',
  'Sistem Rem',
  'Bodi & Cat',
  'Lainnya',
];

const CAR_BRANDS = [
  'Toyota',
  'Honda',
  'Daihatsu',
  'Mitsubishi',
  'Suzuki',
  'Nissan',
  'Hyundai',
  'Wuling',
  'Mazda',
  'Lainnya',
];

export default function AfterSalesPage() {
  const {
    purchases,
    feedback,
    complaints,
    referrals,
    customers,
    users,
    repairClaims,
    addFeedback,
    addComplaint,
    resolveComplaint,
    addRepairClaim,
    updateRepairClaim,
    deleteRepairClaim,
    addCustomer,
    formatRupiah,
    formatDate,
    formatWhatsAppLink,
  } = useCrm();

  const [activeTab, setActiveTab] = useState<'repairs' | 'purchases' | 'feedback' | 'complaints' | 'referrals'>('repairs');

  // ===================== REPAIR CLAIMS FILTER & SEARCH STATE =====================
  const [repairSearch, setRepairSearch] = useState('');
  const [repairTypeFilter, setRepairTypeFilter] = useState<'ALL' | RepairClaimType>('ALL');
  const [repairStatusFilter, setRepairStatusFilter] = useState<'ALL' | RepairStatus>('ALL');
  const [repairMonthFilter, setRepairMonthFilter] = useState<string>('ALL');
  const [repairYearFilter, setRepairYearFilter] = useState<string>('ALL');

  // ===================== REPAIR MODALS STATE =====================
  const [isRepairModalOpen, setIsRepairModalOpen] = useState(false);
  const [editingRepair, setEditingRepair] = useState<RepairClaim | null>(null);
  const [detailRepair, setDetailRepair] = useState<RepairClaim | null>(null);
  const [deleteConfirmRepairId, setDeleteConfirmRepairId] = useState<string | null>(null);

  // Customer pick mode: 'EXISTING' | 'NEW'
  const [customerPickMode, setCustomerPickMode] = useState<'EXISTING' | 'NEW'>('EXISTING');
  const [saveToCustomerDb, setSaveToCustomerDb] = useState(true);

  // Repair Form State
  const [repairForm, setRepairForm] = useState({
    customerId: '',
    customerName: '',
    customerPhone: '',
    vehicleBrand: 'Toyota',
    vehicleModel: '',
    vehicleYear: 2020,
    purchaseDate: '',
    claimDate: new Date().toISOString().split('T')[0],
    claimType: 'Garansi' as RepairClaimType,
    damageCategory: 'Mesin' as RepairPartCategory,
    complaint: '',
    damagedParts: '',
    actionTaken: '',
    sparepartCost: 0,
    serviceCost: 0,
    status: 'Menunggu' as RepairStatus,
    notes: '',
  });

  // ===================== EXISTING FEEDBACK & COMPLAINT MODALS =====================
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);
  const [isComplaintModalOpen, setIsComplaintModalOpen] = useState(false);
  const [resolvingComplaint, setResolvingComplaint] = useState<CustomerComplaint | null>(null);
  const [resolutionNotes, setResolutionNotes] = useState('');

  // Feedback Form
  const [feedbackForm, setFeedbackForm] = useState({
    customerId: '',
    rating: 5,
    npsScore: 10,
    category: 'Kepuasan Kendaraan' as CustomerFeedback['category'],
    comment: '',
  });

  // Complaint Form
  const [complaintForm, setComplaintForm] = useState({
    customerId: '',
    title: '',
    description: '',
    category: 'Mesin & Transmisi' as CustomerComplaint['category'],
    priority: 'Sedang' as CustomerComplaint['priority'],
    assignedToId: 'USR-002',
  });

  // ===================== FILTERED REPAIR CLAIMS =====================
  const filteredClaims = useMemo(() => {
    return repairClaims.filter((claim) => {
      // Search
      if (repairSearch.trim()) {
        const q = repairSearch.toLowerCase().trim();
        const match =
          claim.customerName.toLowerCase().includes(q) ||
          claim.customerPhone.includes(q) ||
          claim.vehicleBrand.toLowerCase().includes(q) ||
          claim.vehicleModel.toLowerCase().includes(q) ||
          (claim.complaint || claim.complaintOrDamage || '').toLowerCase().includes(q) ||
          (claim.claimNumber || claim.id || '').toLowerCase().includes(q);
        if (!match) return false;
      }
      // Type
      if (repairTypeFilter !== 'ALL' && claim.claimType !== repairTypeFilter) return false;
      // Status
      if (repairStatusFilter !== 'ALL' && claim.status !== repairStatusFilter) return false;
      // Year
      if (repairYearFilter !== 'ALL') {
        const yr = claim.claimDate.split('-')[0];
        if (yr !== repairYearFilter) return false;
      }
      // Month
      if (repairMonthFilter !== 'ALL') {
        const m = claim.claimDate.split('-')[1];
        if (m !== repairMonthFilter) return false;
      }
      return true;
    });
  }, [repairClaims, repairSearch, repairTypeFilter, repairStatusFilter, repairYearFilter, repairMonthFilter]);

  // Realized claims (excluding Dibatalkan for expenditures as required by constraint)
  const realizedClaims = useMemo(() => {
    return filteredClaims.filter((c) => c.status !== 'Dibatalkan');
  }, [filteredClaims]);

  // ===================== REPAIR METRICS CALCULATIONS =====================
  const totalCustomersCount = useMemo(() => {
    return new Set(filteredClaims.map((c) => c.customerName.trim().toLowerCase())).size;
  }, [filteredClaims]);

  const totalClaimsCount = filteredClaims.length;
  const warrantyClaimsCount = filteredClaims.filter((c) => c.claimType === 'Garansi').length;
  const nonWarrantyClaimsCount = filteredClaims.filter((c) => c.claimType === 'Non-Garansi').length;
  const completedClaimsCount = filteredClaims.filter((c) => c.status === 'Selesai').length;
  const inProgressClaimsCount = filteredClaims.filter((c) => c.status === 'Dalam Proses').length;
  const pendingClaimsCount = filteredClaims.filter((c) => c.status === 'Menunggu').length;
  const cancelledClaimsCount = filteredClaims.filter((c) => c.status === 'Dibatalkan').length;

  const totalSparepartCost = useMemo(() => {
    return realizedClaims.reduce((sum, c) => sum + (c.sparepartCost || 0), 0);
  }, [realizedClaims]);

  const totalServiceCost = useMemo(() => {
    return realizedClaims.reduce((sum, c) => sum + (c.serviceCost || 0), 0);
  }, [realizedClaims]);

  const totalOverallCost = useMemo(() => {
    return realizedClaims.reduce((sum, c) => sum + (c.totalCost || 0), 0);
  }, [realizedClaims]);

  const totalWarrantyCost = useMemo(() => {
    return realizedClaims.filter((c) => c.claimType === 'Garansi').reduce((sum, c) => sum + (c.totalCost || 0), 0);
  }, [realizedClaims]);

  const totalNonWarrantyCost = useMemo(() => {
    return realizedClaims.filter((c) => c.claimType === 'Non-Garansi').reduce((sum, c) => sum + (c.totalCost || 0), 0);
  }, [realizedClaims]);

  // ===================== REPAIR ANALYTICS CALCULATIONS =====================
  // 1. Monthly Repair Trend (Garansi vs Non-Garansi)
  const monthlyExpenseChartData = useMemo(() => {
    const monthsMap: Record<string, { month: string; garansi: number; nonGaransi: number; total: number }> = {};
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

    // Collect all realized claims
    realizedClaims.forEach((claim) => {
      const parts = claim.claimDate.split('-');
      if (parts.length >= 2) {
        const year = parts[0];
        const monthNum = parseInt(parts[1], 10);
        const key = `${monthNames[monthNum - 1]} ${year}`;

        if (!monthsMap[key]) {
          monthsMap[key] = { month: key, garansi: 0, nonGaransi: 0, total: 0 };
        }
        if (claim.claimType === 'Garansi') {
          monthsMap[key].garansi += claim.totalCost;
        } else {
          monthsMap[key].nonGaransi += claim.totalCost;
        }
        monthsMap[key].total += claim.totalCost;
      }
    });

    return Object.values(monthsMap);
  }, [realizedClaims]);

  // 2. Top Consumers with most repairs and costs
  const topRepairCustomers = useMemo(() => {
    const map: Record<string, { name: string; phone: string; count: number; totalCost: number; models: string[] }> = {};
    filteredClaims.forEach((c) => {
      const key = c.customerName.trim();
      if (!map[key]) {
        map[key] = {
          name: c.customerName,
          phone: c.customerPhone,
          count: 0,
          totalCost: 0,
          models: [],
        };
      }
      map[key].count += 1;
      if (c.status !== 'Dibatalkan') {
        map[key].totalCost += c.totalCost;
      }
      const modelLabel = `${c.vehicleBrand} ${c.vehicleModel}`;
      if (!map[key].models.includes(modelLabel)) {
        map[key].models.push(modelLabel);
      }
    });
    return Object.values(map).sort((a, b) => b.count - a.count || b.totalCost - a.totalCost).slice(0, 5);
  }, [filteredClaims]);

  // 3. Cars most frequently repaired
  const topRepairedCars = useMemo(() => {
    const map: Record<string, { model: string; count: number; totalCost: number }> = {};
    filteredClaims.forEach((c) => {
      const key = `${c.vehicleBrand} ${c.vehicleModel}`.trim();
      if (!map[key]) {
        map[key] = { model: key, count: 0, totalCost: 0 };
      }
      map[key].count += 1;
      if (c.status !== 'Dibatalkan') {
        map[key].totalCost += c.totalCost;
      }
    });
    return Object.values(map).sort((a, b) => b.count - a.count).slice(0, 5);
  }, [filteredClaims]);

  // 4. Damage Category Distribution
  const topDamageCategories = useMemo(() => {
    const map: Record<string, { category: string; count: number; totalCost: number }> = {};
    REPAIR_CATEGORIES.forEach((cat) => {
      map[cat] = { category: cat, count: 0, totalCost: 0 };
    });
    filteredClaims.forEach((c) => {
      const cat = c.damageCategory || 'Lainnya';
      if (!map[cat]) {
        map[cat] = { category: cat, count: 0, totalCost: 0 };
      }
      map[cat].count += 1;
      if (c.status !== 'Dibatalkan') {
        map[cat].totalCost += c.totalCost;
      }
    });
    return Object.values(map).filter((item) => item.count > 0).sort((a, b) => b.count - a.count);
  }, [filteredClaims]);

  // 5. Warranty vs Non-Warranty Cost Comparison
  const warrantyVsNonWarrantyData = useMemo(() => {
    return [
      { name: 'Klaim Garansi (Ditanggung Showroom)', value: totalWarrantyCost, color: '#10b981' },
      { name: 'Non-Garansi (Dibayar Konsumen)', value: totalNonWarrantyCost, color: '#3b82f6' },
    ].filter((item) => item.value > 0);
  }, [totalWarrantyCost, totalNonWarrantyCost]);

  // ===================== REPAIR ACTIONS =====================
  const openAddRepairModal = () => {
    setEditingRepair(null);
    setCustomerPickMode('EXISTING');
    setRepairForm({
      customerId: '',
      customerName: '',
      customerPhone: '',
      vehicleBrand: 'Toyota',
      vehicleModel: '',
      vehicleYear: 2020,
      purchaseDate: '',
      claimDate: new Date().toISOString().split('T')[0],
      claimType: 'Garansi',
      damageCategory: 'Mesin',
      complaint: '',
      damagedParts: '',
      actionTaken: '',
      sparepartCost: 0,
      serviceCost: 0,
      status: 'Menunggu',
      notes: '',
    });
    setIsRepairModalOpen(true);
  };

  const openEditRepairModal = (claim: RepairClaim) => {
    setEditingRepair(claim);
    setCustomerPickMode(claim.customerId ? 'EXISTING' : 'NEW');
    setRepairForm({
      customerId: claim.customerId || '',
      customerName: claim.customerName,
      customerPhone: claim.customerPhone,
      vehicleBrand: claim.vehicleBrand,
      vehicleModel: claim.vehicleModel,
      vehicleYear: claim.vehicleYear,
      purchaseDate: claim.purchaseDate || '',
      claimDate: claim.claimDate,
      claimType: claim.claimType,
      damageCategory: claim.damageCategory || 'Mesin',
      complaint: claim.complaint || claim.complaintOrDamage || '',
      damagedParts: claim.damagedParts || claim.partsToRepair || '',
      actionTaken: claim.actionTaken || claim.repairActionDescription || '',
      sparepartCost: claim.sparepartCost,
      serviceCost: claim.serviceCost,
      status: claim.status,
      notes: claim.notes || '',
    });
    setIsRepairModalOpen(true);
  };

  // Handle customer pick dropdown auto-fill
  const handleSelectCustomer = (custKey: string) => {
    if (!custKey) {
      setRepairForm((prev) => ({
        ...prev,
        customerId: '',
        customerName: '',
        customerPhone: '',
        vehicleBrand: 'Toyota',
        vehicleModel: '',
        vehicleYear: 2020,
        purchaseDate: '',
      }));
      return;
    }

    const cust = customers.find((c) => c.id === custKey);
    if (!cust) return;

    // Check if customer purchased a car from HR MOTOR
    const purchase = purchases.find((p) => p.customerId === cust.id);

    let brand = 'Toyota';
    let model = cust.interestedVehicle || '';
    let year = 2020;
    let pDate = cust.registeredDate || '';

    if (purchase) {
      model = purchase.vehicleModel;
      year = purchase.vehicleYear;
      pDate = purchase.purchaseDate;
      const firstWord = purchase.vehicleModel.split(' ')[0];
      if (CAR_BRANDS.includes(firstWord)) {
        brand = firstWord;
      }
    } else if (cust.interestedVehicle) {
      const firstWord = cust.interestedVehicle.split(' ')[0];
      if (CAR_BRANDS.includes(firstWord)) {
        brand = firstWord;
      }
    }

    setRepairForm((prev) => ({
      ...prev,
      customerId: cust.id,
      customerName: cust.fullName,
      customerPhone: cust.whatsapp,
      vehicleBrand: brand,
      vehicleModel: model,
      vehicleYear: year,
      purchaseDate: pDate,
    }));
  };

  // Save Repair Form
  const handleSaveRepair = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!repairForm.customerName.trim() || !repairForm.customerPhone.trim()) {
      alert('Nama konsumen dan nomor WhatsApp wajib diisi');
      return;
    }

    if (!repairForm.complaint.trim()) {
      alert('Keluhan atau kerusakan mobil wajib diisi');
      return;
    }

    // Auto calculate totalCost
    const sparepart = Number(repairForm.sparepartCost) || 0;
    const service = Number(repairForm.serviceCost) || 0;
    const total = sparepart + service;

    // If new customer and user wants to save to database
    let assignedCustId = repairForm.customerId;
    if (customerPickMode === 'NEW' && saveToCustomerDb && !assignedCustId) {
      const newCustRes = await addCustomer({
        fullName: repairForm.customerName.trim(),
        whatsapp: repairForm.customerPhone.trim(),
        interestedVehicle: `${repairForm.vehicleBrand} ${repairForm.vehicleModel} (${repairForm.vehicleYear})`.trim(),
        budget: 0,
        source: 'Walk-in',
        vehicleType: 'MPV',
        district: 'Tarogong Kidul',
        address: 'Garut',
        notes: `Terdaftar otomatis dari pengajuan perbaikan ${repairForm.claimType}`,
      });
      // The API generates customer ID or we can proceed
    }

    if (editingRepair) {
      const res = await updateRepairClaim({
        id: editingRepair.id,
        ...repairForm,
        sparepartCost: sparepart,
        serviceCost: service,
        totalCost: total,
      });
      if (res.success) {
        setIsRepairModalOpen(false);
        setEditingRepair(null);
      } else {
        alert(res.error || 'Gagal memperbarui pengajuan perbaikan');
      }
    } else {
      const res = await addRepairClaim({
        ...repairForm,
        sparepartCost: sparepart,
        serviceCost: service,
        totalCost: total,
      });
      if (res.success) {
        setIsRepairModalOpen(false);
      } else {
        alert(res.error || 'Gagal menambahkan pengajuan perbaikan');
      }
    }
  };

  // Delete Repair
  const handleDeleteRepair = async (id: string) => {
    const res = await deleteRepairClaim(id);
    if (res.success) {
      setDeleteConfirmRepairId(null);
      if (detailRepair?.id === id) setDetailRepair(null);
    } else {
      alert(res.error || 'Gagal menghapus data klaim');
    }
  };

  // ===================== EXPORT TO EXCEL =====================
  const handleExportRepairsExcel = () => {
    const wb = XLSX.utils.book_new();

    // Sheet 1: Ringkasan Pengeluaran Perbaikan
    const summaryRows = [
      ['LAPORAN GARANSI & PERBAIKAN MOBIL — HR MOTOR GARUT', ''],
      ['Tanggal Ekspor', new Date().toLocaleDateString('id-ID')],
      ['Lokasi Showroom', 'Jl. Otista No. 128, Tarogong Kidul, Garut, Jawa Barat'],
      ['Filter Periode', `Bulan: ${repairMonthFilter === 'ALL' ? 'Semua' : repairMonthFilter} | Tahun: ${repairYearFilter === 'ALL' ? 'Semua' : repairYearFilter}`],
      ['', ''],
      ['Indikator Perbaikan & Garansi', 'Jumlah / Nilai'],
      ['Total Konsumen Mengajukan', totalCustomersCount],
      ['Total Pengajuan Perbaikan', totalClaimsCount],
      ['Jumlah Perbaikan Garansi (Showroom)', warrantyClaimsCount],
      ['Jumlah Perbaikan Non-Garansi (Konsumen)', nonWarrantyClaimsCount],
      ['Jumlah Status Selesai', completedClaimsCount],
      ['Jumlah Status Dalam Proses', inProgressClaimsCount],
      ['Jumlah Status Menunggu', pendingClaimsCount],
      ['Jumlah Status Dibatalkan (Tidak Dihitung Biaya)', cancelledClaimsCount],
      ['Total Biaya Sparepart (Realisasi)', totalSparepartCost],
      ['Total Biaya Jasa Perbaikan (Realisasi)', totalServiceCost],
      ['Total Keseluruhan Pengeluaran Perbaikan', totalOverallCost],
      ['Beban Biaya Garansi HR MOTOR', totalWarrantyCost],
      ['Beban Biaya Non-Garansi Konsumen', totalNonWarrantyCost],
    ];
    const wsSummary = XLSX.utils.aoa_to_sheet(summaryRows);
    XLSX.utils.book_append_sheet(wb, wsSummary, 'Ringkasan Biaya Bulanan');

    // Sheet 2: Detail Seluruh Pengajuan Perbaikan
    const claimRows = filteredClaims.map((c, idx) => ({
      'No.': idx + 1,
      'No. Klaim': c.claimNumber || c.id,
      'Nama Konsumen': c.customerName,
      'Nomor WhatsApp': c.customerPhone,
      'Merek Mobil': c.vehicleBrand,
      'Tipe Mobil': c.vehicleModel,
      'Tahun Mobil': c.vehicleYear,
      'Tanggal Pembelian': c.purchaseDate || '-',
      'Tanggal Pengajuan': c.claimDate,
      'Jenis Pengajuan': c.claimType,
      'Kategori Kerusakan': c.damageCategory || '-',
      'Keluhan / Kerusakan': c.complaint || c.complaintOrDamage || '-',
      'Bagian Diperbaiki': c.damagedParts || c.partsToRepair || '-',
      'Tindakan Perbaikan': c.actionTaken || c.repairActionDescription || '-',
      'Biaya Sparepart (Rp)': c.sparepartCost,
      'Biaya Jasa (Rp)': c.serviceCost,
      'Total Biaya (Rp)': c.totalCost,
      'Status': c.status,
      'Catatan': c.notes || '-',
    }));
    const wsClaims = XLSX.utils.json_to_sheet(claimRows);
    XLSX.utils.book_append_sheet(wb, wsClaims, 'Data Pengajuan Perbaikan');

    XLSX.writeFile(wb, `HR_MOTOR_GARANSI_PERBAIKAN_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  // ===================== EXPORT TO PDF =====================
  const handleExportRepairsPDF = () => {
    const doc = new jsPDF('landscape');

    // HR MOTOR Letterhead
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('HR MOTOR GARUT — LAPORAN GARANSI & PERBAIKAN MOBIL', 14, 16);

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text('Showroom Pusat: Jl. Otista No. 128, Tarogong Kidul, Garut, Jawa Barat | Telepon: 0812-2233-4455', 14, 22);
    doc.text(
      `Waktu Cetak: ${new Date().toLocaleString('id-ID')} WIB | Periode: ${
        repairMonthFilter === 'ALL' ? 'Semua Bulan' : 'Bulan ' + repairMonthFilter
      } ${repairYearFilter === 'ALL' ? 'Semua Tahun' : repairYearFilter} | Dibuat oleh: ${users[0]?.name || 'Owner CRM'}`,
      14,
      27
    );

    doc.setLineWidth(0.5);
    doc.setDrawColor(16, 185, 129);
    doc.line(14, 30, 283, 30);

    // KPI Summary Table
    autoTable(doc, {
      startY: 34,
      head: [
        [
          'Total Konsumen',
          'Total Klaim',
          'Garansi',
          'Non-Garansi',
          'Selesai',
          'Proses',
          'Biaya Sparepart',
          'Biaya Jasa',
          'Total Realisasi Biaya',
        ],
      ],
      body: [
        [
          `${totalCustomersCount} Org`,
          `${totalClaimsCount} Klaim`,
          `${warrantyClaimsCount}`,
          `${nonWarrantyClaimsCount}`,
          `${completedClaimsCount}`,
          `${inProgressClaimsCount}`,
          formatRupiah(totalSparepartCost),
          formatRupiah(totalServiceCost),
          formatRupiah(totalOverallCost),
        ],
      ],
      theme: 'striped',
      headStyles: { fillColor: [15, 23, 42], fontSize: 8 },
      bodyStyles: { fontSize: 8, fontStyle: 'bold' },
    });

    // Claims Detailed Table
    autoTable(doc, {
      startY: (doc as any).lastAutoTable.finalY + 6,
      head: [
        [
          'No',
          'No. Klaim',
          'Konsumen',
          'Kontak WA',
          'Mobil & Tahun',
          'Tgl Ajuan',
          'Jenis',
          'Keluhan / Kerusakan',
          'Biaya Sparepart',
          'Biaya Jasa',
          'Total Biaya',
          'Status',
        ],
      ],
      body: filteredClaims.map((c, idx) => {
        const comp = c.complaint || c.complaintOrDamage || '';
        return [
          idx + 1,
          c.claimNumber || c.id,
          c.customerName,
          c.customerPhone,
          `${c.vehicleBrand} ${c.vehicleModel} (${c.vehicleYear})`,
          formatDate(c.claimDate),
          c.claimType,
          comp.length > 35 ? comp.substring(0, 35) + '...' : comp,
          formatRupiah(c.sparepartCost),
          formatRupiah(c.serviceCost),
          formatRupiah(c.totalCost),
          c.status,
        ];
      }),
      theme: 'grid',
      headStyles: { fillColor: [16, 185, 129], fontSize: 7 },
      bodyStyles: { fontSize: 7 },
      styles: { overflow: 'linebreak' },
    });

    doc.save(`HR_MOTOR_GARANSI_PERBAIKAN_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  // ===================== FEEDBACK & COMPLAINTS HANDLERS =====================
  const handleSaveFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    const cust = customers.find((c) => c.id === feedbackForm.customerId);
    if (!cust) {
      alert('Pilih pelanggan terlebih dahulu');
      return;
    }

    const res = await addFeedback({
      customerId: cust.id,
      customerName: cust.fullName,
      vehicleInfo: cust.interestedVehicle,
      rating: Number(feedbackForm.rating),
      npsScore: Number(feedbackForm.npsScore),
      category: feedbackForm.category,
      comment: feedbackForm.comment,
      followUpRequired: false,
    });

    if (res.success) {
      setIsFeedbackModalOpen(false);
      setFeedbackForm({
        customerId: '',
        rating: 5,
        npsScore: 10,
        category: 'Kepuasan Kendaraan',
        comment: '',
      });
    } else {
      alert(res.error || 'Gagal menyimpan ulasan');
    }
  };

  const handleSaveComplaint = async (e: React.FormEvent) => {
    e.preventDefault();
    const cust = customers.find((c) => c.id === complaintForm.customerId);
    if (!cust) {
      alert('Pilih pelanggan terlebih dahulu');
      return;
    }

    const assignedUser = users.find((u) => u.id === complaintForm.assignedToId);

    const res = await addComplaint({
      customerId: cust.id,
      customerName: cust.fullName,
      customerPhone: cust.whatsapp,
      title: complaintForm.title,
      description: complaintForm.description,
      category: complaintForm.category,
      priority: complaintForm.priority,
      assignedToId: complaintForm.assignedToId,
      assignedToName: assignedUser?.name || 'Tim Showroom',
    });

    if (res.success) {
      setIsComplaintModalOpen(false);
      setComplaintForm({
        customerId: '',
        title: '',
        description: '',
        category: 'Mesin & Transmisi',
        priority: 'Sedang',
        assignedToId: 'USR-002',
      });
    } else {
      alert(res.error || 'Gagal membuat tiket komplain');
    }
  };

  const handleFinishResolution = async () => {
    if (!resolvingComplaint) return;
    if (!resolutionNotes.trim()) {
      alert('Tuliskan catatan tindakan penyelesaian');
      return;
    }

    const res = await resolveComplaint(resolvingComplaint.id, resolutionNotes, 'Selesai');
    if (res.success) {
      setResolvingComplaint(null);
      setResolutionNotes('');
    } else {
      alert(res.error || 'Gagal menyelesaikan komplain');
    }
  };

  // Average CSAT calculation
  const averageRating =
    feedback.length > 0
      ? (feedback.reduce((sum, f) => sum + f.rating, 0) / feedback.length).toFixed(1)
      : '5.0';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              Retensi & Purna Jual
            </span>
            <span className="text-xs text-slate-400">•</span>
            <span className="text-xs text-slate-500">Loyalitas Pelanggan HR MOTOR</span>
          </div>
          <h1 className="text-xl lg:text-2xl font-black text-slate-900 mt-1">
            After Sales & Customer Retention
          </h1>
          <p className="text-xs text-slate-500">
            Kelola klaim garansi & perbaikan mobil purna jual, kepuasan konsumen, tiket keluhan, dan program referral di Garut.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={openAddRepairModal}
            className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-sm shadow-emerald-600/30 transition-all flex items-center gap-1.5"
          >
            <Wrench className="w-3.5 h-3.5" />
            + Ajukan Perbaikan Mobil
          </button>
          <button
            onClick={() => setIsComplaintModalOpen(true)}
            className="px-3.5 py-2 text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl transition-colors flex items-center gap-1.5"
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            + Buat Tiket Komplain
          </button>
          <button
            onClick={() => setIsFeedbackModalOpen(true)}
            className="px-3.5 py-2 text-xs font-bold text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-xl transition-colors flex items-center gap-1.5"
          >
            <Star className="w-3.5 h-3.5" />
            + Catat Kepuasan
          </button>
        </div>
      </div>

      {/* Main Tabs Navigation */}
      <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex flex-wrap gap-1 p-1 bg-slate-100 rounded-lg border border-slate-200">
          <button
            onClick={() => setActiveTab('repairs')}
            className={`py-2 px-3.5 text-xs font-bold rounded-md transition-all flex items-center gap-2 ${
              activeTab === 'repairs'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-700 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <Wrench className="w-3.5 h-3.5" />
            Garansi & Perbaikan ({repairClaims.length})
          </button>
          <button
            onClick={() => setActiveTab('purchases')}
            className={`py-2 px-3.5 text-xs font-bold rounded-md transition-all flex items-center gap-2 ${
              activeTab === 'purchases'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-700 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <Car className="w-3.5 h-3.5" />
            Kendaraan Terjual ({purchases.length})
          </button>
          <button
            onClick={() => setActiveTab('feedback')}
            className={`py-2 px-3.5 text-xs font-bold rounded-md transition-all flex items-center gap-2 ${
              activeTab === 'feedback'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-700 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <Star className="w-3.5 h-3.5" />
            Kepuasan & Ulasan ({feedback.length})
          </button>
          <button
            onClick={() => setActiveTab('complaints')}
            className={`py-2 px-3.5 text-xs font-bold rounded-md transition-all flex items-center gap-2 ${
              activeTab === 'complaints'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-700 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            Keluhan / Komplain ({complaints.length})
          </button>
          <button
            onClick={() => setActiveTab('referrals')}
            className={`py-2 px-3.5 text-xs font-bold rounded-md transition-all flex items-center gap-2 ${
              activeTab === 'referrals'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-700 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <Gift className="w-3.5 h-3.5" />
            Pelacakan Referral ({referrals.length})
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: GARANSI & PERBAIKAN MOBIL (UTAMA) */}
      {/* ========================================================================= */}
      {activeTab === 'repairs' && (
        <div className="space-y-6">
          {/* Quick Filter & Action Header */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Cari konsumen, no. WA, unit mobil, no. klaim..."
                  value={repairSearch}
                  onChange={(e) => setRepairSearch(e.target.value)}
                  className="w-full text-xs pl-9 pr-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={handleExportRepairsExcel}
                  className="px-3 py-1.5 text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors flex items-center gap-1.5"
                  title="Unduh laporan dalam format Microsoft Excel"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                  Ekspor Excel
                </button>
                <button
                  onClick={handleExportRepairsPDF}
                  className="px-3 py-1.5 text-xs font-bold text-rose-800 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-colors flex items-center gap-1.5"
                  title="Unduh laporan dalam format dokumen PDF"
                >
                  <FileText className="w-3.5 h-3.5 text-rose-600" />
                  Unduh PDF
                </button>
                <button
                  onClick={() => window.print()}
                  className="px-3 py-1.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors flex items-center gap-1.5"
                  title="Cetak langsung melalui printer browser"
                >
                  <Printer className="w-3.5 h-3.5 text-slate-600" />
                  Cetak
                </button>
              </div>
            </div>

            {/* Dropdown Filters */}
            <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 text-xs">
              <div className="flex items-center gap-1.5">
                <Filter className="w-3.5 h-3.5 text-slate-400" />
                <span className="font-semibold text-slate-600">Filter:</span>
              </div>

              <select
                value={repairTypeFilter}
                onChange={(e) => setRepairTypeFilter(e.target.value as any)}
                className="px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white text-slate-700 font-medium"
              >
                <option value="ALL">Semua Jenis Pengajuan</option>
                <option value="Garansi">Garansi Showroom</option>
                <option value="Non-Garansi">Non-Garansi (Konsumen)</option>
              </select>

              <select
                value={repairStatusFilter}
                onChange={(e) => setRepairStatusFilter(e.target.value as any)}
                className="px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white text-slate-700 font-medium"
              >
                <option value="ALL">Semua Status Perbaikan</option>
                <option value="Menunggu">Menunggu Antrean</option>
                <option value="Dalam Proses">Dalam Proses Pengerjaan</option>
                <option value="Selesai">Selesai Beres</option>
                <option value="Dibatalkan">Dibatalkan</option>
              </select>

              <select
                value={repairMonthFilter}
                onChange={(e) => setRepairMonthFilter(e.target.value)}
                className="px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white text-slate-700 font-medium"
              >
                <option value="ALL">Semua Bulan</option>
                <option value="01">Januari</option>
                <option value="02">Februari</option>
                <option value="03">Maret</option>
                <option value="04">April</option>
                <option value="05">Mei</option>
                <option value="06">Juni</option>
                <option value="07">Juli</option>
                <option value="08">Agustus</option>
                <option value="09">September</option>
                <option value="10">Oktober</option>
                <option value="11">November</option>
                <option value="12">Desember</option>
              </select>

              <select
                value={repairYearFilter}
                onChange={(e) => setRepairYearFilter(e.target.value)}
                className="px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white text-slate-700 font-medium"
              >
                <option value="ALL">Semua Tahun</option>
                <option value="2026">2026</option>
                <option value="2025">2025</option>
              </select>

              {(repairSearch || repairTypeFilter !== 'ALL' || repairStatusFilter !== 'ALL' || repairMonthFilter !== 'ALL' || repairYearFilter !== 'ALL') && (
                <button
                  onClick={() => {
                    setRepairSearch('');
                    setRepairTypeFilter('ALL');
                    setRepairStatusFilter('ALL');
                    setRepairMonthFilter('ALL');
                    setRepairYearFilter('ALL');
                  }}
                  className="px-2.5 py-1 text-slate-500 hover:text-rose-600 hover:underline font-medium text-[11px]"
                >
                  Reset Filter
                </button>
              )}
            </div>
          </div>

          {/* ===================== LAPORAN PERBAIKAN BULANAN (KPI METRIC CARDS) ===================== */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <BarChart3 className="w-4 h-4 text-emerald-600" />
                Laporan & Realisasi Pengeluaran Perbaikan Bulanan
              </h2>
              <span className="text-[11px] text-slate-400">
                *Status Dibatalkan otomatis tidak dihitung dalam biaya
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              <div className="crm-card p-3.5 bg-gradient-to-br from-white to-slate-50 border-slate-200">
                <span className="text-[11px] font-semibold text-slate-500 block">Total Konsumen</span>
                <span className="text-xl lg:text-2xl font-black text-slate-900 mt-0.5 block">
                  {totalCustomersCount}
                </span>
                <span className="text-[10px] text-slate-400">Konsumen unik</span>
              </div>

              <div className="crm-card p-3.5 bg-gradient-to-br from-white to-slate-50 border-slate-200">
                <span className="text-[11px] font-semibold text-slate-500 block">Total Klaim</span>
                <span className="text-xl lg:text-2xl font-black text-slate-900 mt-0.5 block">
                  {totalClaimsCount}
                </span>
                <span className="text-[10px] text-emerald-600 font-medium">
                  {warrantyClaimsCount} Garansi • {nonWarrantyClaimsCount} Non
                </span>
              </div>

              <div className="crm-card p-3.5 bg-gradient-to-br from-white to-slate-50 border-slate-200">
                <span className="text-[11px] font-semibold text-slate-500 block">Penyelesaian</span>
                <span className="text-xl lg:text-2xl font-black text-emerald-700 mt-0.5 block">
                  {completedClaimsCount} Beres
                </span>
                <span className="text-[10px] text-amber-600 font-medium">
                  {inProgressClaimsCount} Proses • {pendingClaimsCount} Antre
                </span>
              </div>

              <div className="crm-card p-3.5 bg-gradient-to-br from-white to-slate-50 border-slate-200">
                <span className="text-[11px] font-semibold text-slate-500 block">Biaya Sparepart</span>
                <span className="text-lg lg:text-xl font-black text-slate-800 mt-0.5 block truncate">
                  {formatRupiah(totalSparepartCost)}
                </span>
                <span className="text-[10px] text-slate-400">Komponen pengganti</span>
              </div>

              <div className="crm-card p-3.5 bg-gradient-to-br from-white to-slate-50 border-slate-200">
                <span className="text-[11px] font-semibold text-slate-500 block">Biaya Jasa</span>
                <span className="text-lg lg:text-xl font-black text-slate-800 mt-0.5 block truncate">
                  {formatRupiah(totalServiceCost)}
                </span>
                <span className="text-[10px] text-slate-400">Ongkos teknisi</span>
              </div>

              <div className="crm-card p-3.5 bg-gradient-to-br from-emerald-50/60 to-white border-emerald-200">
                <span className="text-[11px] font-semibold text-emerald-800 block">Total Biaya Perbaikan</span>
                <span className="text-lg lg:text-xl font-black text-emerald-700 mt-0.5 block truncate">
                  {formatRupiah(totalOverallCost)}
                </span>
                <span className="text-[10px] text-emerald-600 font-bold">Sparepart + Jasa</span>
              </div>
            </div>
          </div>

          {/* ===================== GRAFIK & ANALISIS OWNER ===================== */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Chart: Monthly Expenses (Garansi vs Non-Garansi) */}
            <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Tren Pengeluaran Biaya Perbaikan Bulanan
                  </h3>
                  <p className="text-xs text-slate-500">
                    Perbandingan realisasi biaya Garansi Showroom vs Non-Garansi Konsumen
                  </p>
                </div>
                <div className="flex items-center gap-3 text-xs">
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded bg-emerald-500 inline-block" />
                    <span className="text-slate-600 font-medium">Garansi</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded bg-blue-500 inline-block" />
                    <span className="text-slate-600 font-medium">Non-Garansi</span>
                  </div>
                </div>
              </div>

              <div className="h-64 w-full">
                {monthlyExpenseChartData.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-xs text-slate-400">
                    Tidak ada data pengeluaran perbaikan pada filter yang dipilih.
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={monthlyExpenseChartData} margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                      <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#64748b' }} />
                      <YAxis
                        tick={{ fontSize: 10, fill: '#64748b' }}
                        tickFormatter={(v) => `Rp ${(v / 1000000).toFixed(0)}jt`}
                      />
                      <Tooltip
                        formatter={(val: any) => [formatRupiah(Number(val) || 0), '']}
                        contentStyle={{ fontSize: '11px', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                      />
                      <Bar dataKey="garansi" name="Garansi Showroom" fill="#10b981" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="nonGaransi" name="Non-Garansi" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* Analysis: Warranty vs Non-Warranty Proportion */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4 flex flex-col justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Perbandingan Beban Biaya
                </h3>
                <p className="text-xs text-slate-500">
                  Proporsi pengeluaran showroom vs mandiri konsumen
                </p>
              </div>

              <div className="h-44 w-full flex items-center justify-center">
                {warrantyVsNonWarrantyData.length === 0 ? (
                  <span className="text-xs text-slate-400">Tidak ada pengeluaran terealisasi</span>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={warrantyVsNonWarrantyData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={45}
                        outerRadius={70}
                        paddingAngle={4}
                      >
                        {warrantyVsNonWarrantyData.map((entry, idx) => (
                          <Cell key={idx} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(val: any) => [formatRupiah(Number(val) || 0), '']} />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>

              <div className="space-y-2 pt-2 border-t border-slate-100 text-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                    <span className="text-slate-600 font-medium">Beban Garansi Showroom</span>
                  </div>
                  <span className="font-bold text-emerald-700">{formatRupiah(totalWarrantyCost)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                    <span className="text-slate-600 font-medium">Non-Garansi (Konsumen)</span>
                  </div>
                  <span className="font-bold text-blue-700">{formatRupiah(totalNonWarrantyCost)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* ===================== WIDGET ANALISIS MENDALAM OWNER ===================== */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Widget 1: Konsumen paling sering meminta perbaikan */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-emerald-600" />
                Konsumen dengan Klaim Perbaikan
              </h3>
              <p className="text-[11px] text-slate-500">
                Konsumen yang sering mengajukan klaim servis & akumulasi biayanya
              </p>

              <div className="space-y-2.5">
                {topRepairCustomers.length === 0 ? (
                  <p className="text-xs text-slate-400 py-3 text-center">Belum ada data konsumen</p>
                ) : (
                  topRepairCustomers.map((cust, idx) => (
                    <div key={idx} className="p-2.5 bg-slate-50 hover:bg-slate-100 rounded-xl text-xs space-y-1 transition-colors">
                      <div className="flex items-center justify-between font-bold text-slate-900">
                        <span>{cust.name}</span>
                        <span className="text-emerald-700">{cust.count} kali klaim</span>
                      </div>
                      <p className="text-[11px] text-slate-500">
                        Unit: {cust.models.join(', ')}
                      </p>
                      <div className="flex items-center justify-between pt-1 border-t border-slate-200/60 text-[10px] text-slate-400">
                        <span>Kontak: {cust.phone}</span>
                        <span className="font-bold text-slate-800">Total Biaya: {formatRupiah(cust.totalCost)}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Widget 2: Mobil Paling Sering Diperbaiki */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <Car className="w-3.5 h-3.5 text-blue-600" />
                Mobil Paling Sering Diperbaiki
              </h3>
              <p className="text-[11px] text-slate-500">
                Model kendaraan yang paling sering mengalami kendala teknis
              </p>

              <div className="space-y-2.5">
                {topRepairedCars.length === 0 ? (
                  <p className="text-xs text-slate-400 py-3 text-center">Belum ada data kendaraan</p>
                ) : (
                  topRepairedCars.map((car, idx) => (
                    <div key={idx} className="p-2.5 bg-slate-50 hover:bg-slate-100 rounded-xl text-xs space-y-1 transition-colors">
                      <div className="flex items-center justify-between font-bold text-slate-900">
                        <span>{car.model}</span>
                        <span className="text-blue-700">{car.count} kali masuk</span>
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-slate-500">
                        <span>Akumulasi Pengeluaran:</span>
                        <span className="font-bold text-slate-800">{formatRupiah(car.totalCost)}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Widget 3: Kategori Kerusakan Paling Sering Terjadi */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                Kategori Kerusakan Terbanyak
              </h3>
              <p className="text-[11px] text-slate-500">
                Penyebaran bagian mobil yang diperbaiki untuk evaluasi QC inspeksi
              </p>

              <div className="space-y-2">
                {topDamageCategories.length === 0 ? (
                  <p className="text-xs text-slate-400 py-3 text-center">Belum ada data kerusakan</p>
                ) : (
                  topDamageCategories.map((item, idx) => (
                    <div key={idx} className="space-y-1 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-slate-700">{item.category}</span>
                        <span className="font-bold text-slate-900">{item.count} kasus ({formatRupiah(item.totalCost)})</span>
                      </div>
                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-emerald-500 h-full rounded-full"
                          style={{
                            width: `${Math.min(100, (item.count / Math.max(1, totalClaimsCount)) * 100)}%`,
                          }}
                        />
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* ===================== TABEL DAFTAR KONSUMEN YANG MEMINTA PERBAIKAN ===================== */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Daftar Konsumen yang Meminta Perbaikan
                </h3>
                <p className="text-xs text-slate-500">
                  Menampilkan {filteredClaims.length} catatan pengajuan garansi & perbaikan
                </p>
              </div>
              <button
                onClick={openAddRepairModal}
                className="px-3.5 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs transition-colors flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                Tambah Pengajuan
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                    <th className="py-3 px-4 w-12 text-center">No.</th>
                    <th className="py-3 px-4">Nama Konsumen</th>
                    <th className="py-3 px-4">Mobil yang Dimiliki</th>
                    <th className="py-3 px-4">Tgl Pengajuan</th>
                    <th className="py-3 px-4">Jenis</th>
                    <th className="py-3 px-4">Keluhan / Kerusakan</th>
                    <th className="py-3 px-4">Biaya (Sparepart + Jasa)</th>
                    <th className="py-3 px-4">Total Biaya</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredClaims.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="py-8 text-center text-slate-400">
                        Tidak ada catatan pengajuan perbaikan yang cocok dengan kriteria pencarian / filter.
                      </td>
                    </tr>
                  ) : (
                    filteredClaims.map((claim, index) => (
                      <tr key={claim.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3.5 px-4 text-center font-semibold text-slate-400">
                          {index + 1}
                        </td>
                        <td className="py-3.5 px-4">
                          <p className="font-bold text-slate-900">{claim.customerName}</p>
                          <a
                            href={formatWhatsAppLink(
                              claim.customerPhone,
                              `Halo Bapak/Ibu ${claim.customerName}, salam dari HR MOTOR Garut mengenai update perbaikan unit ${claim.vehicleBrand} ${claim.vehicleModel} (${claim.claimNumber}).`
                            )}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-emerald-700 text-[11px] font-medium hover:underline flex items-center gap-1 mt-0.5"
                          >
                            <Phone className="w-3 h-3" />
                            {claim.customerPhone}
                          </a>
                        </td>
                        <td className="py-3.5 px-4">
                          <p className="font-bold text-slate-800">
                            {claim.vehicleBrand} {claim.vehicleModel}
                          </p>
                          <p className="text-[11px] text-slate-500">
                            Tahun {claim.vehicleYear} {claim.purchaseDate ? `• Beli: ${formatDate(claim.purchaseDate)}` : ''}
                          </p>
                        </td>
                        <td className="py-3.5 px-4 text-slate-600 font-medium">
                          {formatDate(claim.claimDate)}
                        </td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                              claim.claimType === 'Garansi'
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                : 'bg-blue-100 text-blue-800 border border-blue-200'
                            }`}
                          >
                            {claim.claimType}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 max-w-xs">
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 mr-1.5 border border-slate-200">
                            {claim.damageCategory}
                          </span>
                          <span className="font-medium text-slate-800">{claim.complaint || claim.complaintOrDamage}</span>
                          {(claim.damagedParts || claim.partsToRepair) && (
                            <p className="text-[11px] text-slate-500 mt-0.5">
                              Bagian: {claim.damagedParts || claim.partsToRepair}
                            </p>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-[11px] text-slate-600">
                          <div>Sparepart: {formatRupiah(claim.sparepartCost)}</div>
                          <div>Jasa: {formatRupiah(claim.serviceCost)}</div>
                        </td>
                        <td className="py-3.5 px-4 font-black text-slate-900">
                          <span className={claim.status === 'Dibatalkan' ? 'line-through text-slate-400' : 'text-emerald-700'}>
                            {formatRupiah(claim.totalCost)}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                              claim.status === 'Selesai'
                                ? 'bg-emerald-100 text-emerald-800'
                                : claim.status === 'Dalam Proses'
                                ? 'bg-amber-100 text-amber-800'
                                : claim.status === 'Dibatalkan'
                                ? 'bg-slate-200 text-slate-600'
                                : 'bg-blue-100 text-blue-800'
                            }`}
                          >
                            {claim.status}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => setDetailRepair(claim)}
                              className="p-1.5 text-slate-600 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                              title="Lihat Detail Klaim"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => openEditRepairModal(claim)}
                              className="p-1.5 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Edit Pengajuan Perbaikan"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setDeleteConfirmRepairId(claim.id)}
                              className="p-1.5 text-slate-600 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                              title="Hapus Data Klaim"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: KENDARAAN TERJUAL (PURCHASES) */}
      {/* ========================================================================= */}
      {activeTab === 'purchases' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                  <th className="py-3 px-4">Pembeli Mobil</th>
                  <th className="py-3 px-4">Unit Mobil Bekas</th>
                  <th className="py-3 px-4">No. Polisi (Plat Z)</th>
                  <th className="py-3 px-4">Nilai Transaksi</th>
                  <th className="py-3 px-4">Metode Bayar</th>
                  <th className="py-3 px-4">Garansi Resmi</th>
                  <th className="py-3 px-4">Sales PJ</th>
                  <th className="py-3 px-4">Tanggal Pembelian</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {purchases.map((pur) => (
                  <tr key={pur.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4">
                      <p className="font-bold text-slate-900">{pur.customerName}</p>
                      <p className="text-[11px] text-slate-500">ID: {pur.customerId}</p>
                    </td>
                    <td className="py-3 px-4">
                      <p className="font-bold text-slate-800">{pur.vehicleModel}</p>
                      <p className="text-[11px] text-slate-500">
                        Tahun {pur.vehicleYear} • {pur.color} • {pur.mileageKm.toLocaleString()} KM
                      </p>
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded bg-slate-100 font-bold text-slate-800 border border-slate-200">
                        {pur.plateNumber}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-black text-emerald-700">
                      {formatRupiah(pur.purchasePrice)}
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-700">{pur.paymentMethod}</td>
                    <td className="py-3 px-4">
                      <span className="text-emerald-700 font-semibold block">
                        s/d {formatDate(pur.warrantyUntil)}
                      </span>
                      <span className="text-[10px] text-slate-400">Garansi Mesin & Transmisi</span>
                    </td>
                    <td className="py-3 px-4 text-slate-700">{pur.salesName}</td>
                    <td className="py-3 px-4 text-slate-500">{formatDate(pur.purchaseDate)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: FEEDBACK & SATISFACTION */}
      {/* ========================================================================= */}
      {activeTab === 'feedback' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {feedback.map((fdb) => (
            <div key={fdb.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">{fdb.customerName}</h3>
                  <p className="text-[11px] text-slate-500">{fdb.vehicleInfo}</p>
                </div>
                <div className="flex text-amber-400">
                  {[...Array(fdb.rating)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-amber-400" />
                  ))}
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 italic text-slate-700 leading-relaxed">
                &ldquo;{fdb.comment}&rdquo;
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-100">
                <span className="font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                  Kategori: {fdb.category}
                </span>
                <span>NPS: {fdb.npsScore}/10 • {formatDate(fdb.createdAt)}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: COMPLAINTS */}
      {/* ========================================================================= */}
      {activeTab === 'complaints' && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                    <th className="py-3 px-4">No. Tiket</th>
                    <th className="py-3 px-4">Pelanggan & Kontak</th>
                    <th className="py-3 px-4">Judul & Kategori Keluhan</th>
                    <th className="py-3 px-4">Prioritas</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Penanggung Jawab</th>
                    <th className="py-3 px-4">Solusi / Penyelesaian</th>
                    <th className="py-3 px-4 text-center">Tindakan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {complaints.map((cmp) => (
                    <tr key={cmp.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4 font-bold text-slate-900">{cmp.ticketNumber}</td>
                      <td className="py-3 px-4">
                        <p className="font-bold text-slate-900">{cmp.customerName}</p>
                        <a
                          href={formatWhatsAppLink(cmp.customerPhone)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-emerald-700 text-[11px] hover:underline"
                        >
                          {cmp.customerPhone}
                        </a>
                      </td>
                      <td className="py-3 px-4 max-w-xs">
                        <p className="font-bold text-slate-800">{cmp.title}</p>
                        <p className="text-[11px] text-slate-500 line-clamp-2">{cmp.description}</p>
                        <span className="text-[10px] text-slate-400 block mt-0.5">
                          Kategori: {cmp.category}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`font-bold px-2 py-0.5 rounded-full text-[10px] ${
                            cmp.priority === 'Darurat' || cmp.priority === 'Tinggi'
                              ? 'bg-rose-100 text-rose-700'
                              : 'bg-amber-100 text-amber-700'
                          }`}
                        >
                          {cmp.priority}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`font-bold px-2 py-0.5 rounded-full text-[10px] ${
                            cmp.status === 'Selesai'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}
                        >
                          {cmp.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-700">{cmp.assignedToName}</td>
                      <td className="py-3 px-4 text-[11px] text-slate-600 max-w-xs">
                        {cmp.resolutionNotes ? (
                          <span className="text-emerald-800 font-medium">{cmp.resolutionNotes}</span>
                        ) : (
                          <span className="text-slate-400 italic">Sedang dalam proses investigasi teknis</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {cmp.status !== 'Selesai' ? (
                          <button
                            onClick={() => {
                              setResolvingComplaint(cmp);
                              setResolutionNotes('');
                            }}
                            className="px-2.5 py-1 text-[11px] font-bold text-white bg-slate-900 hover:bg-emerald-600 rounded-lg transition-colors shadow-xs"
                          >
                            Selesaikan
                          </button>
                        ) : (
                          <span className="text-[11px] text-emerald-600 font-bold flex items-center justify-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Beres
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 5: REFERRALS */}
      {/* ========================================================================= */}
      {activeTab === 'referrals' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                  <th className="py-3 px-4">Pelanggan Pemberi Rekomendasi</th>
                  <th className="py-3 px-4">Calon Pembeli Direferensikan</th>
                  <th className="py-3 px-4">Kontak Prospek</th>
                  <th className="py-3 px-4">Mobil Diminati</th>
                  <th className="py-3 px-4">Status Negosiasi</th>
                  <th className="py-3 px-4">Reward Referral</th>
                  <th className="py-3 px-4">Status Pencairan Reward</th>
                  <th className="py-3 px-4">Tanggal Masuk</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {referrals.map((ref) => (
                  <tr key={ref.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 font-bold text-slate-900">{ref.referrerCustomerName}</td>
                    <td className="py-3 px-4 font-bold text-slate-800">{ref.referredName}</td>
                    <td className="py-3 px-4">
                      <a
                        href={formatWhatsAppLink(ref.referredPhone)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-emerald-700 font-semibold hover:underline"
                      >
                        {ref.referredPhone}
                      </a>
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-800">{ref.interestedVehicle}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800">
                        {ref.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-bold text-emerald-700">
                      {formatRupiah(ref.rewardAmount)}
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 text-amber-800">
                        {ref.rewardStatus}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-500">{formatDate(ref.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: TAMBAH / EDIT PENGAJUAN PERBAIKAN */}
      {/* ========================================================================= */}
      {isRepairModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl max-h-[92vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/80">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Wrench className="w-4 h-4 text-emerald-600" />
                  {editingRepair ? 'Edit Pengajuan Perbaikan' : 'Formulir Pengajuan Perbaikan Mobil'}
                </h3>
                <p className="text-xs text-slate-500">
                  Layanan garansi showroom & perbaikan purna jual konsumen HR MOTOR Garut
                </p>
              </div>
              <button
                onClick={() => setIsRepairModalOpen(false)}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/60"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveRepair} className="p-6 space-y-4 overflow-y-auto text-xs flex-1">
              {/* Opsi Pilih dari Database Pelanggan vs Input Baru */}
              {!editingRepair && (
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                  <span className="text-[11px] font-bold text-slate-700 block">
                    Metode Pemilihan Konsumen:
                  </span>
                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="radio"
                        name="custPick"
                        checked={customerPickMode === 'EXISTING'}
                        onChange={() => setCustomerPickMode('EXISTING')}
                        className="text-emerald-600"
                      />
                      <span className="font-semibold text-slate-800">Pilih dari Database Pelanggan</span>
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="radio"
                        name="custPick"
                        checked={customerPickMode === 'NEW'}
                        onChange={() => setCustomerPickMode('NEW')}
                        className="text-emerald-600"
                      />
                      <span className="font-semibold text-slate-800">Input Konsumen Baru</span>
                    </label>
                  </div>

                  {customerPickMode === 'EXISTING' && (
                    <div className="pt-2">
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        Cari & Pilih Pelanggan Terdaftar:
                      </label>
                      <select
                        value={repairForm.customerId}
                        onChange={(e) => handleSelectCustomer(e.target.value)}
                        className="w-full text-xs p-2.5 border border-slate-300 rounded-lg outline-none bg-white font-medium"
                      >
                        <option value="">-- Pilih dari Database Pelanggan HR MOTOR --</option>
                        {customers.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.fullName} • {c.whatsapp} ({c.interestedVehicle})
                          </option>
                        ))}
                      </select>
                      <p className="text-[10px] text-slate-400 mt-1">
                        *Data mobil dan nomor WhatsApp akan terisi otomatis saat pelanggan dipilih.
                      </p>
                    </div>
                  )}

                  {customerPickMode === 'NEW' && (
                    <div className="pt-1">
                      <label className="flex items-center gap-2 cursor-pointer text-[11px] text-emerald-800 font-semibold">
                        <input
                          type="checkbox"
                          checked={saveToCustomerDb}
                          onChange={(e) => setSaveToCustomerDb(e.target.checked)}
                          className="rounded text-emerald-600"
                        />
                        Simpan juga data konsumen ini ke Database Pelanggan HR MOTOR
                      </label>
                    </div>
                  )}
                </div>
              )}

              {/* Data Konsumen */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Nama Konsumen <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={repairForm.customerName}
                    onChange={(e) => setRepairForm({ ...repairForm, customerName: e.target.value })}
                    placeholder="Contoh: Pak Herman Suherman"
                    className="w-full text-xs p-2.5 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Nomor WhatsApp Konsumen <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={repairForm.customerPhone}
                    onChange={(e) => setRepairForm({ ...repairForm, customerPhone: e.target.value })}
                    placeholder="08123456789"
                    className="w-full text-xs p-2.5 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>
              </div>

              {/* Data Mobil */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Merek Mobil</label>
                  <select
                    value={repairForm.vehicleBrand}
                    onChange={(e) => setRepairForm({ ...repairForm, vehicleBrand: e.target.value })}
                    className="w-full text-xs p-2.5 border border-slate-300 rounded-lg outline-none"
                  >
                    {CAR_BRANDS.map((brand) => (
                      <option key={brand} value={brand}>{brand}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Tipe Mobil</label>
                  <input
                    type="text"
                    required
                    value={repairForm.vehicleModel}
                    onChange={(e) => setRepairForm({ ...repairForm, vehicleModel: e.target.value })}
                    placeholder="Innova Reborn 2.4 V AT"
                    className="w-full text-xs p-2.5 border border-slate-300 rounded-lg outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Tahun Mobil</label>
                  <input
                    type="number"
                    min={2000}
                    max={2030}
                    value={repairForm.vehicleYear}
                    onChange={(e) => setRepairForm({ ...repairForm, vehicleYear: Number(e.target.value) })}
                    className="w-full text-xs p-2.5 border border-slate-300 rounded-lg outline-none"
                  />
                </div>
              </div>

              {/* Tanggal Beli & Tanggal Pengajuan */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Tanggal Pembelian Mobil</label>
                  <input
                    type="date"
                    value={repairForm.purchaseDate}
                    onChange={(e) => setRepairForm({ ...repairForm, purchaseDate: e.target.value })}
                    className="w-full text-xs p-2.5 border border-slate-300 rounded-lg outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Tanggal Pengajuan Perbaikan <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={repairForm.claimDate}
                    onChange={(e) => setRepairForm({ ...repairForm, claimDate: e.target.value })}
                    className="w-full text-xs p-2.5 border border-slate-300 rounded-lg outline-none font-bold"
                  />
                </div>
              </div>

              {/* Jenis Pengajuan & Kategori Kerusakan */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Jenis Pengajuan <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={repairForm.claimType}
                    onChange={(e) => setRepairForm({ ...repairForm, claimType: e.target.value as RepairClaimType })}
                    className="w-full text-xs p-2.5 border border-slate-300 rounded-lg outline-none font-bold text-slate-900"
                  >
                    <option value="Garansi">Garansi (Beban Showroom HR MOTOR)</option>
                    <option value="Non-Garansi">Non-Garansi (Beban Konsumen)</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Kategori Kerusakan</label>
                  <select
                    value={repairForm.damageCategory}
                    onChange={(e) => setRepairForm({ ...repairForm, damageCategory: e.target.value as RepairPartCategory })}
                    className="w-full text-xs p-2.5 border border-slate-300 rounded-lg outline-none"
                  >
                    {REPAIR_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Keluhan & Bagian Mobil */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Keluhan atau Kerusakan Mobil <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={2}
                  required
                  value={repairForm.complaint}
                  onChange={(e) => setRepairForm({ ...repairForm, complaint: e.target.value })}
                  placeholder="Contoh: AC kurang dingin saat siang hari dan ada bunyi mendecit dari fan belt..."
                  className="w-full text-xs p-2.5 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Bagian Mobil yang Perlu Diperbaiki</label>
                  <input
                    type="text"
                    value={repairForm.damagedParts}
                    onChange={(e) => setRepairForm({ ...repairForm, damagedParts: e.target.value })}
                    placeholder="Contoh: Kompresor AC & Fan Belt"
                    className="w-full text-xs p-2.5 border border-slate-300 rounded-lg outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Status Perbaikan</label>
                  <select
                    value={repairForm.status}
                    onChange={(e) => setRepairForm({ ...repairForm, status: e.target.value as RepairStatus })}
                    className="w-full text-xs p-2.5 border border-slate-300 rounded-lg outline-none font-bold"
                  >
                    <option value="Menunggu">Menunggu Antrean</option>
                    <option value="Dalam Proses">Dalam Proses Pengerjaan</option>
                    <option value="Selesai">Selesai Beres</option>
                    <option value="Dibatalkan">Dibatalkan</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Deskripsi Tindakan Perbaikan</label>
                <textarea
                  rows={2}
                  value={repairForm.actionTaken}
                  onChange={(e) => setRepairForm({ ...repairForm, actionTaken: e.target.value })}
                  placeholder="Contoh: Pengisian ulang freon R134a dan penggantian fan belt original di bengkel rekanan..."
                  className="w-full text-xs p-2.5 border border-slate-300 rounded-lg outline-none"
                />
              </div>

              {/* Rincian Biaya: Sparepart + Jasa = Total Otomatis */}
              <div className="p-4 bg-emerald-50/60 rounded-xl border border-emerald-200 space-y-3">
                <span className="text-[11px] font-bold text-emerald-900 uppercase tracking-wider block">
                  Perhitungan Biaya Perbaikan (Rupiah)
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Biaya Sparepart (Rp)</label>
                    <input
                      type="number"
                      min={0}
                      value={repairForm.sparepartCost}
                      onChange={(e) => setRepairForm({ ...repairForm, sparepartCost: Number(e.target.value) })}
                      placeholder="0"
                      className="w-full text-xs p-2.5 border border-slate-300 rounded-lg outline-none font-bold text-slate-900 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Biaya Jasa Perbaikan (Rp)</label>
                    <input
                      type="number"
                      min={0}
                      value={repairForm.serviceCost}
                      onChange={(e) => setRepairForm({ ...repairForm, serviceCost: Number(e.target.value) })}
                      placeholder="0"
                      className="w-full text-xs p-2.5 border border-slate-300 rounded-lg outline-none font-bold text-slate-900 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-emerald-900 mb-1">
                      Total Biaya Perbaikan (Otomatis)
                    </label>
                    <div className="w-full text-xs p-2.5 bg-emerald-100 border border-emerald-300 rounded-lg font-black text-emerald-800">
                      {formatRupiah((Number(repairForm.sparepartCost) || 0) + (Number(repairForm.serviceCost) || 0))}
                    </div>
                  </div>
                </div>
                <p className="text-[10px] text-emerald-700">
                  *Total biaya otomatis dihitung dari penjumlahan biaya sparepart dan jasa perbaikan.
                </p>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Catatan Tambahan</label>
                <input
                  type="text"
                  value={repairForm.notes}
                  onChange={(e) => setRepairForm({ ...repairForm, notes: e.target.value })}
                  placeholder="Catatan garansi part, teknisi bengkel rekanan, dll..."
                  className="w-full text-xs p-2.5 border border-slate-300 rounded-lg outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsRepairModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm shadow-emerald-600/30 transition-all"
                >
                  {editingRepair ? 'Perbarui Data Perbaikan' : 'Simpan Pengajuan Perbaikan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: DETAIL PENGAJUAN PERBAIKAN */}
      {/* ========================================================================= */}
      {detailRepair && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
              <div className="flex items-center gap-2">
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    detailRepair.claimType === 'Garansi'
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-blue-100 text-blue-800'
                  }`}
                >
                  {detailRepair.claimType}
                </span>
                <h3 className="text-sm font-bold text-slate-900">
                  Detail Klaim: {detailRepair.claimNumber}
                </h3>
              </div>
              <button
                onClick={() => setDetailRepair(null)}
                className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs overflow-y-auto">
              <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
                <div>
                  <span className="text-slate-400 block text-[10px]">Konsumen</span>
                  <span className="font-bold text-slate-900 text-sm">{detailRepair.customerName}</span>
                  <a
                    href={formatWhatsAppLink(detailRepair.customerPhone)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-emerald-700 text-[11px] font-medium hover:underline flex items-center gap-1 mt-0.5"
                  >
                    <Phone className="w-3 h-3" />
                    {detailRepair.customerPhone}
                  </a>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Unit Kendaraan</span>
                  <span className="font-bold text-slate-900 text-sm">
                    {detailRepair.vehicleBrand} {detailRepair.vehicleModel}
                  </span>
                  <span className="text-[11px] text-slate-500 block">Tahun {detailRepair.vehicleYear}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-slate-700">
                <div>
                  <span className="text-slate-400 block text-[10px]">Tanggal Pengajuan</span>
                  <span className="font-semibold">{formatDate(detailRepair.claimDate)}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Tanggal Pembelian Unit</span>
                  <span className="font-semibold">{detailRepair.purchaseDate ? formatDate(detailRepair.purchaseDate) : '-'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Kategori Kerusakan</span>
                  <span className="font-semibold text-emerald-800">{detailRepair.damageCategory}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Status Saat Ini</span>
                  <span className="font-bold text-slate-900">{detailRepair.status}</span>
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-slate-400 block text-[10px]">Keluhan Konsumen</span>
                <p className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 text-slate-800 font-medium leading-relaxed">
                  {detailRepair.complaint || detailRepair.complaintOrDamage}
                </p>
              </div>

              {(detailRepair.damagedParts || detailRepair.partsToRepair) && (
                <div className="space-y-1">
                  <span className="text-slate-400 block text-[10px]">Bagian yang Diperbaiki</span>
                  <p className="text-slate-700 font-semibold">{detailRepair.damagedParts || detailRepair.partsToRepair}</p>
                </div>
              )}

              {(detailRepair.actionTaken || detailRepair.repairActionDescription) && (
                <div className="space-y-1">
                  <span className="text-slate-400 block text-[10px]">Tindakan Perbaikan yang Dilakukan</span>
                  <p className="p-2.5 bg-emerald-50/50 rounded-lg border border-emerald-100 text-slate-800">
                    {detailRepair.actionTaken || detailRepair.repairActionDescription}
                  </p>
                </div>
              )}

              {/* Rincian Biaya */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                  Rincian Biaya Perbaikan
                </span>
                <div className="flex items-center justify-between text-slate-600">
                  <span>Biaya Sparepart:</span>
                  <span className="font-semibold">{formatRupiah(detailRepair.sparepartCost)}</span>
                </div>
                <div className="flex items-center justify-between text-slate-600">
                  <span>Biaya Jasa:</span>
                  <span className="font-semibold">{formatRupiah(detailRepair.serviceCost)}</span>
                </div>
                <div className="flex items-center justify-between pt-1.5 border-t border-slate-200 font-bold text-sm text-slate-900">
                  <span>Total Keseluruhan:</span>
                  <span className="text-emerald-700">{formatRupiah(detailRepair.totalCost)}</span>
                </div>
              </div>

              {detailRepair.notes && (
                <p className="text-[11px] text-slate-400 italic">Catatan: {detailRepair.notes}</p>
              )}
            </div>

            <div className="flex items-center justify-between px-6 py-3 border-t border-slate-100 bg-slate-50">
              <a
                href={formatWhatsAppLink(
                  detailRepair.customerPhone,
                  `Halo Bapak/Ibu ${detailRepair.customerName}, berikut info perkembangan perbaikan unit ${detailRepair.vehicleBrand} ${detailRepair.vehicleModel} (${detailRepair.claimNumber}) dengan status: ${detailRepair.status}.`
                )}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 text-xs font-bold text-emerald-800 bg-emerald-100 hover:bg-emerald-200 rounded-lg flex items-center gap-1.5"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                Hubungi via WhatsApp
              </a>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setDetailRepair(null);
                    openEditRepairModal(detailRepair);
                  }}
                  className="px-3 py-1.5 text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg"
                >
                  Edit Klaim
                </button>
                <button
                  onClick={() => setDetailRepair(null)}
                  className="px-4 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-200 rounded-lg"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: DELETE CONFIRMATION REPAIR */}
      {/* ========================================================================= */}
      {deleteConfirmRepairId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-sm w-full p-5 space-y-4">
            <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div className="text-center">
              <h3 className="text-sm font-bold text-slate-900">Hapus Data Pengajuan Perbaikan</h3>
              <p className="text-xs text-slate-500 mt-1">
                Apakah Anda yakin ingin menghapus data klaim perbaikan ini? Tindakan ini akan dicatat dalam riwayat audit CRM HR MOTOR.
              </p>
            </div>
            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={() => setDeleteConfirmRepairId(null)}
                className="flex-1 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
              >
                Batal
              </button>
              <button
                onClick={() => handleDeleteRepair(deleteConfirmRepairId)}
                className="flex-1 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-sm shadow-rose-600/30 transition-all"
              >
                Hapus Data
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: ADD FEEDBACK */}
      {/* ========================================================================= */}
      {isFeedbackModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-slate-50">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Catat Ulasan & Kepuasan Pelanggan</h3>
                <p className="text-xs text-slate-500">Dokumentasikan testimoni pembeli HR MOTOR Garut</p>
              </div>
              <button
                onClick={() => setIsFeedbackModalOpen(false)}
                className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveFeedback} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Pilih Pelanggan <span className="text-rose-500">*</span>
                </label>
                <select
                  required
                  value={feedbackForm.customerId}
                  onChange={(e) => setFeedbackForm({ ...feedbackForm, customerId: e.target.value })}
                  className="w-full text-xs p-2.5 border border-slate-300 rounded-lg outline-none"
                >
                  <option value="">-- Pilih dari Pelanggan --</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.fullName} ({c.interestedVehicle})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Rating (Bintang)</label>
                  <select
                    value={feedbackForm.rating}
                    onChange={(e) => setFeedbackForm({ ...feedbackForm, rating: Number(e.target.value) })}
                    className="w-full text-xs p-2 border border-slate-300 rounded-lg outline-none font-bold text-amber-600"
                  >
                    <option value={5}>★★★★★ 5 Bintang (Sangat Puas)</option>
                    <option value={4}>★★★★☆ 4 Bintang (Puas)</option>
                    <option value={3}>★★★☆☆ 3 Bintang (Cukup)</option>
                    <option value={2}>★★☆☆☆ 2 Bintang (Kurang)</option>
                    <option value={1}>★☆☆☆☆ 1 Bintang (Kecewa)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Kategori Kepuasan</label>
                  <select
                    value={feedbackForm.category}
                    onChange={(e) => setFeedbackForm({ ...feedbackForm, category: e.target.value as any })}
                    className="w-full text-xs p-2 border border-slate-300 rounded-lg outline-none"
                  >
                    <option value="Kepuasan Kendaraan">Kepuasan Kendaraan</option>
                    <option value="Pelayanan Sales">Pelayanan Sales</option>
                    <option value="Kelengkapan Dokumen BPKB/STNK">Kelengkapan Dokumen BPKB/STNK</option>
                    <option value="Kebersihan & Kesiapan Unit">Kebersihan & Kesiapan Unit</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Testimoni / Ulasan Konsumen</label>
                <textarea
                  rows={3}
                  required
                  value={feedbackForm.comment}
                  onChange={(e) => setFeedbackForm({ ...feedbackForm, comment: e.target.value })}
                  placeholder="Kutipan kepuasan konsumen terhadap unit dan pelayanan..."
                  className="w-full text-xs p-2.5 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsFeedbackModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm shadow-emerald-600/30"
                >
                  Simpan Ulasan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: ADD COMPLAINT */}
      {/* ========================================================================= */}
      {isComplaintModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-slate-50">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Buka Tiket Komplain Baru</h3>
                <p className="text-xs text-slate-500">Penanganan kendala purna jual unit konsumen</p>
              </div>
              <button
                onClick={() => setIsComplaintModalOpen(false)}
                className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveComplaint} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Pilih Pelanggan <span className="text-rose-500">*</span>
                </label>
                <select
                  required
                  value={complaintForm.customerId}
                  onChange={(e) => setComplaintForm({ ...complaintForm, customerId: e.target.value })}
                  className="w-full text-xs p-2.5 border border-slate-300 rounded-lg outline-none"
                >
                  <option value="">-- Pilih dari Pelanggan --</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.fullName} ({c.interestedVehicle})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Judul Komplain <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={complaintForm.title}
                  onChange={(e) => setComplaintForm({ ...complaintForm, title: e.target.value })}
                  placeholder="Misal: AC Mobil Kurang Dingin Saat Cuaca Panas"
                  className="w-full text-xs p-2.5 border border-slate-300 rounded-lg outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Kategori Kendala</label>
                  <select
                    value={complaintForm.category}
                    onChange={(e) => setComplaintForm({ ...complaintForm, category: e.target.value as any })}
                    className="w-full text-xs p-2 border border-slate-300 rounded-lg outline-none"
                  >
                    <option value="Mesin & Transmisi">Mesin & Transmisi</option>
                    <option value="Kelistrikan & AC">Kelistrikan & AC</option>
                    <option value="Kaki-kaki & Suspensi">Kaki-kaki & Suspensi</option>
                    <option value="Dokumen BPKB/STNK">Dokumen BPKB/STNK</option>
                    <option value="Lainnya">Lainnya</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Prioritas</label>
                  <select
                    value={complaintForm.priority}
                    onChange={(e) => setComplaintForm({ ...complaintForm, priority: e.target.value as any })}
                    className="w-full text-xs p-2 border border-slate-300 rounded-lg outline-none font-bold"
                  >
                    <option value="Rendah">Rendah</option>
                    <option value="Sedang">Sedang</option>
                    <option value="Tinggi">Tinggi</option>
                    <option value="Darurat">Darurat</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Deskripsi Lengkap Masalah <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={3}
                  required
                  value={complaintForm.description}
                  onChange={(e) => setComplaintForm({ ...complaintForm, description: e.target.value })}
                  placeholder="Jelaskan detail kendala teknis atau administrasi..."
                  className="w-full text-xs p-2.5 border border-slate-300 rounded-lg outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsComplaintModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-sm shadow-rose-600/30"
                >
                  Buka Tiket
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: RESOLVE COMPLAINT */}
      {/* ========================================================================= */}
      {resolvingComplaint && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-slate-50">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Selesaikan Tiket Komplain</h3>
                <p className="text-xs text-slate-500">Tiket: {resolvingComplaint.ticketNumber}</p>
              </div>
              <button
                onClick={() => setResolvingComplaint(null)}
                className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <div>
                <p className="font-bold text-slate-800">{resolvingComplaint.title}</p>
                <p className="text-slate-500 text-[11px] mt-0.5">{resolvingComplaint.description}</p>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Catatan Solusi / Tindakan Perbaikan <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={3}
                  required
                  value={resolutionNotes}
                  onChange={(e) => setResolutionNotes(e.target.value)}
                  placeholder="Misal: Sudah diganti freon dan sensor AC di bengkel rekanan resmi HR MOTOR Garut..."
                  className="w-full text-xs p-2.5 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 px-5 py-3 border-t border-slate-100 bg-slate-50">
              <button
                type="button"
                onClick={() => setResolvingComplaint(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-lg"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={!resolutionNotes.trim()}
                onClick={handleFinishResolution}
                className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm shadow-emerald-600/30 disabled:opacity-50"
              >
                Tutup Tiket Selesai
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
