'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Wrench,
  ShieldCheck,
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
  Printer,
  Download,
  AlertCircle,
  AlertTriangle,
  Eye,
  Edit,
  Trash2,
  ChevronRight,
  BarChart3,
  Calendar,
  DollarSign,
  TrendingUp,
  FileSpreadsheet,
  RotateCcw,
  UserCheck,
  Award,
  Layers,
  ArrowUpRight,
  PieChart as PieChartIcon,
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
  LineChart,
  Line,
} from 'recharts';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useCrm } from '@/context/CrmContext';
import {
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

const MONTH_NAMES = [
  'Januari',
  'Februari',
  'Maret',
  'April',
  'Mei',
  'Juni',
  'Juli',
  'Agustus',
  'September',
  'Oktober',
  'November',
  'Desember',
];

const PIE_COLORS = ['#D99A32', '#F0AD45', '#B87D20', '#202020', '#2E2E2E', '#4A4A4A', '#7A7A7A'];

// Helper to check 1-month warranty status based on purchaseDate and repairDate
function checkWarrantyStatus(purchaseDateStr?: string, repairDateStr?: string): {
  isWithinWarranty: boolean;
  statusLabel: 'Dalam Masa Garansi' | 'Di Luar Masa Garansi';
  daysDiff: number;
  expiryDateStr: string;
  notes: string;
} {
  if (!purchaseDateStr || !repairDateStr) {
    return {
      isWithinWarranty: false,
      statusLabel: 'Di Luar Masa Garansi',
      daysDiff: 0,
      expiryDateStr: '-',
      notes: 'Tanggal pembelian belum tercatat',
    };
  }

  const pDate = new Date(purchaseDateStr + 'T00:00:00');
  const rDate = new Date(repairDateStr + 'T00:00:00');

  // 1 month warranty calculation (calendar month)
  const expiryDate = new Date(pDate);
  expiryDate.setMonth(expiryDate.getMonth() + 1);

  const diffTime = rDate.getTime() - pDate.getTime();
  const daysDiff = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  const isWithin = rDate.getTime() <= expiryDate.getTime() && daysDiff >= 0;
  const expiryDateFormatted = expiryDate.toISOString().split('T')[0];

  return {
    isWithinWarranty: isWithin,
    statusLabel: isWithin ? 'Dalam Masa Garansi' : 'Di Luar Masa Garansi',
    daysDiff,
    expiryDateStr: expiryDateFormatted,
    notes: isWithin
      ? `Hari ke-${daysDiff} dari masa garansi 1 bulan (Batas garansi: ${expiryDateFormatted})`
      : daysDiff < 0
      ? 'Tanggal perbaikan mendahului tanggal pembelian unit'
      : `Melewati masa garansi ${Math.floor((rDate.getTime() - expiryDate.getTime()) / (1000 * 60 * 60 * 24))} hari`,
  };
}

export default function RiwayatPerbaikanGaransiPage() {
  const {
    repairClaims,
    customers,
    purchases,
    addRepairClaim,
    updateRepairClaim,
    deleteRepairClaim,
    addCustomer,
    formatRupiah,
    formatDate,
    formatWhatsAppLink,
  } = useCrm();

  // Active sub-tab: 'list' (Tabel Riwayat) | 'reports' (Dashboard & Laporan Analitik Owner)
  const [activeTab, setActiveTab] = useState<'list' | 'reports'>('list');

  // Search & Filter state for Table
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'Semua' | RepairClaimType>('Semua');
  const [warrantyFilter, setWarrantyFilter] = useState<'Semua' | 'Dalam Masa Garansi' | 'Di Luar Masa Garansi'>('Semua');
  const [selectedYearFilter, setSelectedYearFilter] = useState<string>('Semua');
  const [selectedMonthFilter, setSelectedMonthFilter] = useState<string>('Semua');
  const [customerFilter, setCustomerFilter] = useState<string>('Semua');

  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedClaim, setSelectedClaim] = useState<RepairClaim | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Form State for Adding New Repair Record
  const [formData, setFormData] = useState({
    customerId: '',
    customerName: '',
    customerPhone: '',
    vehicleBrand: 'Toyota',
    vehicleModel: '',
    vehicleYear: 2021,
    purchaseDate: '',
    claimDate: new Date().toISOString().split('T')[0], // Tanggal Perbaikan
    claimType: 'Garansi' as RepairClaimType,
    complaintOrDamage: '',
    partsToRepair: '',
    damageCategory: 'Mesin' as RepairPartCategory,
    repairActionDescription: '',
    sparepartCost: 0,
    serviceCost: 0,
    notes: '',
    saveNewCustomer: false,
  });

  // State for Editing Existing Repair Record
  const [editFormData, setEditFormData] = useState<{
    id: string;
    claimNumber: string;
    customerName: string;
    customerPhone: string;
    vehicleBrand: string;
    vehicleModel: string;
    vehicleYear: number;
    purchaseDate: string;
    claimDate: string;
    claimType: RepairClaimType;
    complaintOrDamage: string;
    partsToRepair: string;
    damageCategory: RepairPartCategory;
    repairActionDescription: string;
    sparepartCost: number;
    serviceCost: number;
    notes: string;
  } | null>(null);

  // Monthly Report Filter for Owner
  const currentMonthKey = new Date().toISOString().slice(0, 7); // e.g. 2026-11
  const [selectedReportPeriod, setSelectedReportPeriod] = useState<string>('ALL');
  const [reportTypeFilter, setReportTypeFilter] = useState<'Semua' | RepairClaimType>('Semua');

  const triggerSuccess = (msg: string) => {
    setActionSuccess(msg);
    setTimeout(() => setActionSuccess(null), 4000);
  };

  // Real-time warranty status check for Add Form
  const addFormWarrantyCheck = useMemo(() => {
    return checkWarrantyStatus(formData.purchaseDate, formData.claimDate);
  }, [formData.purchaseDate, formData.claimDate]);

  // Real-time warranty status check for Edit Form
  const editFormWarrantyCheck = useMemo(() => {
    if (!editFormData) return null;
    return checkWarrantyStatus(editFormData.purchaseDate, editFormData.claimDate);
  }, [editFormData]);

  // 1. Dashboard Ringkasan Metrik untuk Owner
  const ownerSummary = useMemo(() => {
    const totalRecords = repairClaims.length;

    // Unique customers count
    const uniqueCustomerKeys = new Set(
      repairClaims.map((c) => (c.customerPhone || c.customerName).trim().toLowerCase())
    );
    const totalUniqueCustomers = uniqueCustomerKeys.size;

    // Unique vehicles count (brand + model + year)
    const uniqueVehicles = new Set(
      repairClaims.map((c) => `${c.vehicleBrand} ${c.vehicleModel} ${c.vehicleYear}`.trim().toLowerCase())
    );
    const totalUniqueVehicles = uniqueVehicles.size;

    // This month costs
    const thisMonthClaims = repairClaims.filter((c) => {
      const d = c.claimDate || c.createdAt;
      return d && d.startsWith(currentMonthKey);
    });
    const totalCostThisMonth = thisMonthClaims.reduce((acc, c) => acc + (c.totalCost || 0), 0);

    // Total Garansi vs Non-Garansi
    const totalGaransiCost = repairClaims
      .filter((c) => c.claimType === 'Garansi')
      .reduce((acc, c) => acc + (c.totalCost || 0), 0);

    const totalNonGaransiCost = repairClaims
      .filter((c) => c.claimType === 'Non-Garansi')
      .reduce((acc, c) => acc + (c.totalCost || 0), 0);

    const grandTotalCost = totalGaransiCost + totalNonGaransiCost;

    return {
      totalRecords,
      totalUniqueCustomers,
      totalUniqueVehicles,
      totalCostThisMonth,
      totalGaransiCost,
      totalNonGaransiCost,
      grandTotalCost,
    };
  }, [repairClaims, currentMonthKey]);

  // 2. Filtered Repairs Table Data
  const filteredClaims = useMemo(() => {
    return repairClaims.filter((claim) => {
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        claim.customerName.toLowerCase().includes(q) ||
        claim.customerPhone.includes(q) ||
        claim.vehicleBrand.toLowerCase().includes(q) ||
        claim.vehicleModel.toLowerCase().includes(q) ||
        (claim.claimNumber && claim.claimNumber.toLowerCase().includes(q)) ||
        (claim.complaintOrDamage && claim.complaintOrDamage.toLowerCase().includes(q)) ||
        (claim.repairActionDescription && claim.repairActionDescription.toLowerCase().includes(q));

      const matchType = typeFilter === 'Semua' || claim.claimType === typeFilter;

      // Check warranty status
      const wStatus = checkWarrantyStatus(claim.purchaseDate, claim.claimDate).statusLabel;
      const matchWarranty = warrantyFilter === 'Semua' || wStatus === warrantyFilter;

      // Year & Month filter
      const claimDate = claim.claimDate || claim.createdAt;
      const claimYear = claimDate.slice(0, 4);
      const claimMonth = claimDate.slice(5, 7);

      const matchYear = selectedYearFilter === 'Semua' || claimYear === selectedYearFilter;
      const matchMonth = selectedMonthFilter === 'Semua' || claimMonth === selectedMonthFilter;

      const matchCustomer =
        customerFilter === 'Semua' ||
        claim.customerPhone === customerFilter ||
        claim.customerName.toLowerCase() === customerFilter.toLowerCase();

      return matchSearch && matchType && matchWarranty && matchYear && matchMonth && matchCustomer;
    });
  }, [
    repairClaims,
    searchQuery,
    typeFilter,
    warrantyFilter,
    selectedYearFilter,
    selectedMonthFilter,
    customerFilter,
  ]);

  // Handle Customer Selection in Add Form
  const handleSelectCustomer = (custId: string) => {
    if (!custId) {
      setFormData((prev) => ({
        ...prev,
        customerId: '',
      }));
      return;
    }

    const cust = customers.find((c) => c.id === custId);
    if (!cust) return;

    // Check if customer has purchase history in purchases
    const purchase = purchases.find((p) => p.customerId === custId);

    const vehicleBrand = purchase
      ? purchase.vehicleBrand || (purchase.vehicleName ? purchase.vehicleName.split(' ')[0] : 'Toyota')
      : cust.interestedVehicle
      ? cust.interestedVehicle.split(' ')[0]
      : 'Toyota';

    const vehicleModel = purchase ? (purchase.vehicleModel || purchase.vehicleName || '') : cust.interestedVehicle || '';
    const vehicleYear = purchase ? purchase.vehicleYear : 2021;
    const purchaseDate = purchase ? purchase.purchaseDate : '';

    // Auto-determine warranty recommendation
    const today = new Date().toISOString().split('T')[0];
    const warrantyCheck = checkWarrantyStatus(purchaseDate, today);

    setFormData((prev) => ({
      ...prev,
      customerId: cust.id,
      customerName: cust.fullName,
      customerPhone: cust.whatsapp,
      vehicleBrand: CAR_BRANDS.includes(vehicleBrand) ? vehicleBrand : 'Toyota',
      vehicleModel,
      vehicleYear,
      purchaseDate,
      claimType: warrantyCheck.isWithinWarranty ? 'Garansi' : 'Non-Garansi',
    }));
  };

  // Submit Add Form
  const handleSubmitAdd = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.customerName.trim() || !formData.customerPhone.trim() || !formData.vehicleModel.trim()) {
      alert('Mohon lengkapi Nama Konsumen, Nomor WhatsApp, dan Model Kendaraan.');
      return;
    }

    const sparepart = Number(formData.sparepartCost) || 0;
    const service = Number(formData.serviceCost) || 0;
    const total = sparepart + service;

    const count = repairClaims.length + 1;
    const ticketNo = `GRS-2026-${String(count).padStart(3, '0')}`;

    const newPayload: Partial<RepairClaim> = {
      claimNumber: ticketNo,
      customerId: formData.customerId || undefined,
      customerName: formData.customerName.trim(),
      customerPhone: formData.customerPhone.trim(),
      vehicleBrand: formData.vehicleBrand,
      vehicleModel: formData.vehicleModel.trim(),
      vehicleYear: Number(formData.vehicleYear) || 2021,
      purchaseDate: formData.purchaseDate || undefined,
      claimDate: formData.claimDate || new Date().toISOString().split('T')[0],
      claimType: formData.claimType,
      damageCategory: formData.damageCategory,
      complaintOrDamage: formData.complaintOrDamage.trim(),
      complaint: formData.complaintOrDamage.trim(),
      partsToRepair: formData.partsToRepair.trim(),
      damagedParts: formData.partsToRepair.trim(),
      repairActionDescription: formData.repairActionDescription.trim(),
      actionTaken: formData.repairActionDescription.trim(),
      sparepartCost: sparepart,
      serviceCost: service,
      totalCost: total,
      status: 'Selesai', // Perbaikan yang dicatat adalah yang telah dilaksanakan
      notes: formData.notes.trim() || undefined,
      completedDate: formData.claimDate,
    };

    const res = await addRepairClaim(newPayload);

    if (res.success) {
      // If user selected to save as new customer in Database Pelanggan
      if (formData.saveNewCustomer && !formData.customerId) {
        await addCustomer({
          fullName: formData.customerName.trim(),
          whatsapp: formData.customerPhone.trim(),
          address: 'Garut, Jawa Barat',
          district: 'Garut Kota',
          source: 'Walk-in',
          interestedVehicle: `${formData.vehicleBrand} ${formData.vehicleModel}`,
          vehicleType: 'MPV',
          budget: total,
          status: 'Aktif',
          notes: `Konsumen Riwayat Perbaikan Garansi (${ticketNo})`,
        });
      }

      setIsAddModalOpen(false);
      triggerSuccess(`Riwayat perbaikan berhasil disimpan dengan nomor tiket: ${ticketNo}`);

      // Reset form
      setFormData({
        customerId: '',
        customerName: '',
        customerPhone: '',
        vehicleBrand: 'Toyota',
        vehicleModel: '',
        vehicleYear: 2021,
        purchaseDate: '',
        claimDate: new Date().toISOString().split('T')[0],
        claimType: 'Garansi',
        complaintOrDamage: '',
        partsToRepair: '',
        damageCategory: 'Mesin',
        repairActionDescription: '',
        sparepartCost: 0,
        serviceCost: 0,
        notes: '',
        saveNewCustomer: false,
      });
    } else {
      alert(`Gagal menyimpan: ${res.error || 'Terjadi kesalahan sistem'}`);
    }
  };

  // Open Edit Modal
  const handleOpenEdit = (claim: RepairClaim) => {
    setEditFormData({
      id: claim.id,
      claimNumber: claim.claimNumber || claim.id,
      customerName: claim.customerName,
      customerPhone: claim.customerPhone,
      vehicleBrand: claim.vehicleBrand,
      vehicleModel: claim.vehicleModel,
      vehicleYear: claim.vehicleYear,
      purchaseDate: claim.purchaseDate || '',
      claimDate: claim.claimDate,
      claimType: claim.claimType,
      complaintOrDamage: claim.complaintOrDamage || claim.complaint || '',
      partsToRepair: claim.partsToRepair || claim.damagedParts || '',
      damageCategory: claim.damageCategory,
      repairActionDescription: claim.repairActionDescription || claim.actionTaken || '',
      sparepartCost: claim.sparepartCost,
      serviceCost: claim.serviceCost,
      notes: claim.notes || '',
    });
    setIsEditModalOpen(true);
  };

  // Submit Edit Form
  const handleSubmitEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editFormData) return;

    const sparepart = Number(editFormData.sparepartCost) || 0;
    const service = Number(editFormData.serviceCost) || 0;
    const total = sparepart + service;

    const res = await updateRepairClaim({
      id: editFormData.id,
      customerName: editFormData.customerName.trim(),
      customerPhone: editFormData.customerPhone.trim(),
      vehicleBrand: editFormData.vehicleBrand,
      vehicleModel: editFormData.vehicleModel.trim(),
      vehicleYear: Number(editFormData.vehicleYear),
      purchaseDate: editFormData.purchaseDate || undefined,
      claimDate: editFormData.claimDate,
      claimType: editFormData.claimType,
      damageCategory: editFormData.damageCategory,
      complaintOrDamage: editFormData.complaintOrDamage.trim(),
      complaint: editFormData.complaintOrDamage.trim(),
      partsToRepair: editFormData.partsToRepair.trim(),
      damagedParts: editFormData.partsToRepair.trim(),
      repairActionDescription: editFormData.repairActionDescription.trim(),
      actionTaken: editFormData.repairActionDescription.trim(),
      sparepartCost: sparepart,
      serviceCost: service,
      totalCost: total,
      status: 'Selesai',
      notes: editFormData.notes.trim() || undefined,
      completedDate: editFormData.claimDate,
    });

    if (res.success) {
      setIsEditModalOpen(false);
      triggerSuccess(`Data perbaikan tiket ${editFormData.claimNumber} berhasil diperbarui.`);
      if (selectedClaim && selectedClaim.id === editFormData.id) {
        setSelectedClaim({
          ...selectedClaim,
          ...editFormData,
          totalCost: total,
        });
      }
    } else {
      alert(`Gagal memperbarui: ${res.error || 'Terjadi kesalahan sistem'}`);
    }
  };

  // Handle Delete
  const handleDelete = async (id: string) => {
    const res = await deleteRepairClaim(id);
    if (res.success) {
      setDeleteConfirmId(null);
      if (selectedClaim?.id === id) {
        setIsDetailModalOpen(false);
        setSelectedClaim(null);
      }
      triggerSuccess('Data riwayat perbaikan berhasil dihapus.');
    } else {
      alert(`Gagal menghapus: ${res.error || 'Terjadi kesalahan'}`);
    }
  };

  // 3. ANALITIK LAPORAN OWNER
  // (A) Siapa saja konsumen yang meminta dan sudah mendapatkan perbaikan & total biaya per konsumen
  const customerAnalytics = useMemo(() => {
    const map: Record<
      string,
      {
        customerName: string;
        customerPhone: string;
        repairCount: number;
        warrantyCount: number;
        nonWarrantyCount: number;
        totalCost: number;
        vehicles: Set<string>;
        latestRepairDate: string;
      }
    > = {};

    repairClaims.forEach((claim) => {
      const key = (claim.customerPhone || claim.customerName).trim().toLowerCase();
      if (!map[key]) {
        map[key] = {
          customerName: claim.customerName,
          customerPhone: claim.customerPhone,
          repairCount: 0,
          warrantyCount: 0,
          nonWarrantyCount: 0,
          totalCost: 0,
          vehicles: new Set(),
          latestRepairDate: claim.claimDate,
        };
      }
      map[key].repairCount += 1;
      if (claim.claimType === 'Garansi') {
        map[key].warrantyCount += 1;
      } else {
        map[key].nonWarrantyCount += 1;
      }
      map[key].totalCost += claim.totalCost || 0;
      map[key].vehicles.add(`${claim.vehicleBrand} ${claim.vehicleModel}`);
      if (claim.claimDate > map[key].latestRepairDate) {
        map[key].latestRepairDate = claim.claimDate;
      }
    });

    return Object.values(map)
      .map((item) => ({
        ...item,
        vehicleList: Array.from(item.vehicles).join(', '),
      }))
      .sort((a, b) => b.totalCost - a.totalCost);
  }, [repairClaims]);

  // (B) Mobil apa saja yang pernah diperbaiki & total biaya per mobil
  const vehicleAnalytics = useMemo(() => {
    const map: Record<
      string,
      {
        vehicleName: string;
        brand: string;
        model: string;
        year: number;
        repairCount: number;
        warrantyCount: number;
        nonWarrantyCount: number;
        totalCost: number;
        commonDamage: Record<string, number>;
      }
    > = {};

    repairClaims.forEach((claim) => {
      const key = `${claim.vehicleBrand} ${claim.vehicleModel} (${claim.vehicleYear})`;
      if (!map[key]) {
        map[key] = {
          vehicleName: key,
          brand: claim.vehicleBrand,
          model: claim.vehicleModel,
          year: claim.vehicleYear,
          repairCount: 0,
          warrantyCount: 0,
          nonWarrantyCount: 0,
          totalCost: 0,
          commonDamage: {},
        };
      }
      map[key].repairCount += 1;
      if (claim.claimType === 'Garansi') map[key].warrantyCount += 1;
      else map[key].nonWarrantyCount += 1;
      map[key].totalCost += claim.totalCost || 0;

      const cat = claim.damageCategory || 'Lainnya';
      map[key].commonDamage[cat] = (map[key].commonDamage[cat] || 0) + 1;
    });

    return Object.values(map)
      .map((item) => {
        const topCat = Object.entries(item.commonDamage).sort((a, b) => b[1] - a[1])[0]?.[0] || '-';
        return {
          ...item,
          topCategory: topCat,
        };
      })
      .sort((a, b) => b.totalCost - a.totalCost);
  }, [repairClaims]);

  // (C) Kerusakan yang paling sering terjadi (Peringkat Kerusakan)
  const damageCategoryAnalytics = useMemo(() => {
    const counts: Record<string, { count: number; totalCost: number; warrantyCount: number }> = {};
    const totalCount = repairClaims.length || 1;

    repairClaims.forEach((c) => {
      const cat = c.damageCategory || 'Lainnya';
      if (!counts[cat]) {
        counts[cat] = { count: 0, totalCost: 0, warrantyCount: 0 };
      }
      counts[cat].count += 1;
      counts[cat].totalCost += c.totalCost || 0;
      if (c.claimType === 'Garansi') counts[cat].warrantyCount += 1;
    });

    return Object.entries(counts)
      .map(([name, data]) => ({
        name,
        count: data.count,
        totalCost: data.totalCost,
        warrantyCount: data.warrantyCount,
        percentage: Math.round((data.count / totalCount) * 100),
      }))
      .sort((a, b) => b.count - a.count);
  }, [repairClaims]);

  // (D) Pengeluaran perbaikan setiap bulan & data grafik tren bulanan
  const monthlyTimelineData = useMemo(() => {
    const groups: Record<
      string,
      {
        monthKey: string;
        monthLabel: string;
        totalClaims: number;
        garansiCost: number;
        nonGaransiCost: number;
        totalCost: number;
        uniqueCustomers: Set<string>;
      }
    > = {};

    repairClaims.forEach((claim) => {
      const d = claim.claimDate || claim.createdAt;
      const key = d.slice(0, 7); // YYYY-MM
      const [year, month] = key.split('-');
      const monthIdx = parseInt(month, 10) - 1;
      const label = `${MONTH_NAMES[monthIdx] || month} ${year}`;

      if (!groups[key]) {
        groups[key] = {
          monthKey: key,
          monthLabel: label,
          totalClaims: 0,
          garansiCost: 0,
          nonGaransiCost: 0,
          totalCost: 0,
          uniqueCustomers: new Set(),
        };
      }

      groups[key].totalClaims += 1;
      groups[key].uniqueCustomers.add((claim.customerPhone || claim.customerName).trim().toLowerCase());
      if (claim.claimType === 'Garansi') {
        groups[key].garansiCost += claim.totalCost || 0;
      } else {
        groups[key].nonGaransiCost += claim.totalCost || 0;
      }
      groups[key].totalCost += claim.totalCost || 0;
    });

    return Object.values(groups)
      .map((g) => ({
        ...g,
        customerCount: g.uniqueCustomers.size,
        'Biaya Garansi (Showroom)': g.garansiCost,
        'Biaya Non-Garansi': g.nonGaransiCost,
        'Total Pengeluaran': g.totalCost,
      }))
      .sort((a, b) => a.monthKey.localeCompare(b.monthKey));
  }, [repairClaims]);

  // Export to Excel Function
  const handleExportExcel = () => {
    const dataToExport = filteredClaims.map((c, idx) => {
      const warrantyInfo = checkWarrantyStatus(c.purchaseDate, c.claimDate);
      return {
        No: idx + 1,
        'Nomor Tiket': c.claimNumber || c.id,
        'Nama Konsumen': c.customerName,
        'No WhatsApp': c.customerPhone,
        'Merek Mobil': c.vehicleBrand,
        'Tipe Mobil': c.vehicleModel,
        'Tahun Mobil': c.vehicleYear,
        'Tanggal Pembelian': c.purchaseDate || '-',
        'Tanggal Perbaikan': c.claimDate,
        'Status Masa Garansi': warrantyInfo.statusLabel,
        'Keterangan Durasi Garansi': warrantyInfo.notes,
        'Jenis Perbaikan': c.claimType,
        'Kategori Kerusakan': c.damageCategory,
        'Keluhan / Kerusakan': c.complaintOrDamage || c.complaint || '-',
        'Bagian Diperbaiki': c.partsToRepair || c.damagedParts || '-',
        'Tindakan Perbaikan': c.repairActionDescription || c.actionTaken || '-',
        'Biaya Sparepart (Rp)': c.sparepartCost,
        'Biaya Jasa Mekanik (Rp)': c.serviceCost,
        'Total Biaya (Rp)': c.totalCost,
        Catatan: c.notes || '-',
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Riwayat Perbaikan HR MOTOR');

    // Auto fit column widths
    const maxProps = Object.keys(dataToExport[0] || {}).map((key) => ({
      wch: Math.max(key.length, 14),
    }));
    worksheet['!cols'] = maxProps;

    const filename = `Riwayat_Perbaikan_Garansi_HR_MOTOR_${new Date().toISOString().slice(0, 10)}.xlsx`;
    XLSX.writeFile(workbook, filename);
  };

  // Export to PDF Function
  const handleExportPDF = () => {
    const doc = new jsPDF('landscape');

    // Header HR MOTOR
    doc.setFontSize(15);
    doc.setTextColor(15, 23, 42); // slate-900
    doc.text('HR MOTOR GARUT — REKAPITULASI RIWAYAT PERBAIKAN GARANSI', 14, 15);

    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139); // slate-500
    doc.text(`Dicetak pada: ${new Date().toLocaleDateString('id-ID')} | Showroom Mobil Bekas Berkualitas Garut`, 14, 21);
    doc.text('Showroom: HR MOTOR Garut • Telp/WA: 0812-2134-5678', 14, 26);

    // Summary Box
    doc.setFontSize(9);
    doc.setTextColor(15, 23, 42);
    doc.text(
      `Total Riwayat: ${ownerSummary.totalRecords} Unit | Total Konsumen: ${ownerSummary.totalUniqueCustomers} Orang | Biaya Garansi: ${formatRupiah(ownerSummary.totalGaransiCost)} | Biaya Non-Garansi: ${formatRupiah(ownerSummary.totalNonGaransiCost)} | Total Pengeluaran: ${formatRupiah(ownerSummary.grandTotalCost)}`,
      14,
      32
    );

    // Table Data
    const tableHeaders = [
      ['No', 'Tiket', 'Konsumen', 'WhatsApp', 'Mobil', 'Tgl Beli', 'Tgl Perbaikan', 'Status Garansi', 'Jenis', 'Tindakan Perbaikan', 'Total Biaya'],
    ];

    const tableRows = filteredClaims.map((c, idx) => {
      const wInfo = checkWarrantyStatus(c.purchaseDate, c.claimDate);
      return [
        idx + 1,
        c.claimNumber || c.id,
        c.customerName,
        c.customerPhone,
        `${c.vehicleBrand} ${c.vehicleModel} (${c.vehicleYear})`,
        c.purchaseDate || '-',
        c.claimDate,
        wInfo.statusLabel,
        c.claimType,
        (c.repairActionDescription || c.actionTaken || '-').slice(0, 30) + '...',
        formatRupiah(c.totalCost),
      ];
    });

    autoTable(doc, {
      head: tableHeaders,
      body: tableRows,
      startY: 36,
      theme: 'grid',
      styles: {
        fontSize: 7.5,
        cellPadding: 2,
      },
      headStyles: {
        fillColor: [15, 23, 42],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252],
      },
    });

    const filename = `Riwayat_Perbaikan_Garansi_HR_MOTOR_${new Date().toISOString().slice(0, 10)}.pdf`;
    doc.save(filename);
  };

  // WhatsApp Message Generator
  const generateWhatsAppMessage = (claim: RepairClaim) => {
    const carName = `${claim.vehicleBrand} ${claim.vehicleModel} (${claim.vehicleYear})`;
    const ticketNo = claim.claimNumber || claim.id;
    const warrantyCheck = checkWarrantyStatus(claim.purchaseDate, claim.claimDate);

    const text = `Sampurasun Bapak/Ibu *${claim.customerName}*,\n\nSalam hormat dari *HR MOTOR Garut*.\n\nBerikut konfirmasi rincian riwayat perbaikan mobil Bapak/Ibu yang telah selesai dikerjakan:\n\n• No. Tiket: *${ticketNo}*\n• Unit Mobil: *${carName}*\n• Tanggal Perbaikan: *${formatDate(claim.claimDate)}*\n• Status Garansi: *${warrantyCheck.statusLabel}*\n• Jenis Perbaikan: *${claim.claimType}* (${claim.claimType === 'Garansi' ? '100% Ditanggung HR MOTOR' : 'Dibayar Konsumen'})\n• Keluhan: ${claim.complaintOrDamage || claim.complaint}\n• Tindakan: ${claim.repairActionDescription || claim.actionTaken}\n• Total Biaya: *${formatRupiah(claim.totalCost)}*\n\nUnit mobil siap digunakan kembali dalam kondisi prima. Terima kasih telah mempercayakan pembelian dan perawatan mobil di HR MOTOR Garut.\n\n*HR MOTOR GARUT*`;

    return formatWhatsAppLink(claim.customerPhone, text);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Header */}
      <div className="crm-card p-6 border-b-2 border-b-gold-500/40">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="badge-gold">
                Layanan Purna Jual Showroom
              </span>
              <span className="text-xs text-charcoal-300">•</span>
              <span className="text-xs text-charcoal-400 font-medium tracking-wide">Garansi 1 Bulan HR MOTOR Garut</span>
            </div>
            <h1 className="text-2xl font-black text-charcoal-900 mt-1 tracking-tight flex items-center gap-2.5">
              <Wrench className="w-6 h-6 text-gold-600" />
              <span>Riwayat Perbaikan & Klaim Garansi</span>
            </h1>
            <p className="text-xs text-charcoal-500 mt-0.5">
              Pencatatan dan pemantauan menyeluruh riwayat servis armada konsumen yang telah dilaksanakan, baik selama maupun di luar masa garansi resmi 1 bulan HR MOTOR Garut.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="btn-gold flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Riwayat Perbaikan</span>
            </button>

            <button
              onClick={handleExportExcel}
              className="btn-outline-warm flex items-center gap-1.5 text-xs py-2"
              title="Ekspor ke Excel"
            >
              <FileSpreadsheet className="w-4 h-4 text-gold-600" />
              <span className="hidden sm:inline">Excel</span>
            </button>

            <button
              onClick={handleExportPDF}
              className="btn-outline-warm flex items-center gap-1.5 text-xs py-2"
              title="Ekspor ke PDF"
            >
              <Download className="w-4 h-4 text-charcoal-600" />
              <span className="hidden sm:inline">PDF</span>
            </button>

            <button
              onClick={() => window.print()}
              className="btn-outline-warm flex items-center gap-1.5 text-xs py-2"
              title="Cetak Laporan"
            >
              <Printer className="w-4 h-4 text-charcoal-600" />
              <span className="hidden md:inline">Cetak</span>
            </button>
          </div>
        </div>
      </div>

      {/* Success Notification Banner */}
      {actionSuccess && (
        <div className="flex items-center justify-between p-3.5 text-xs text-gold-900 bg-gold-50/80 border border-gold-300 rounded-xl animate-in fade-in duration-200">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-gold-600 shrink-0" />
            <span className="font-semibold">{actionSuccess}</span>
          </div>
          <button onClick={() => setActionSuccess(null)} className="text-gold-700 hover:text-gold-900">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 6 RINGKASAN METRIK UNTUK OWNER */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
        {/* 1. Total Konsumen yang Melakukan Perbaikan */}
        <div className="crm-card p-4">
          <div className="flex items-center justify-between text-charcoal-400 mb-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-charcoal-500">Total Konsumen</span>
            <Users className="w-4 h-4 text-gold-600" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-xl font-black text-charcoal-900">{ownerSummary.totalUniqueCustomers}</span>
            <span className="text-[11px] text-charcoal-400 font-medium">orang</span>
          </div>
          <p className="text-[10px] text-charcoal-400 mt-1">Konsumen unik diservis</p>
        </div>

        {/* 2. Total Kendaraan yang Diperbaiki */}
        <div className="crm-card p-4">
          <div className="flex items-center justify-between text-charcoal-400 mb-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-charcoal-500">Total Kendaraan</span>
            <Car className="w-4 h-4 text-charcoal-700" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-xl font-black text-charcoal-900">{ownerSummary.totalUniqueVehicles}</span>
            <span className="text-[11px] text-charcoal-400 font-medium">unit mobil</span>
          </div>
          <p className="text-[10px] text-charcoal-400 mt-1">Armada pernah diperbaiki</p>
        </div>

        {/* 3. Total Riwayat Perbaikan */}
        <div className="crm-card p-4">
          <div className="flex items-center justify-between text-charcoal-400 mb-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-charcoal-500">Riwayat Perbaikan</span>
            <FileText className="w-4 h-4 text-charcoal-700" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-xl font-black text-charcoal-900">{ownerSummary.totalRecords}</span>
            <span className="text-[11px] text-charcoal-400 font-medium">tindakan</span>
          </div>
          <p className="text-[10px] text-charcoal-400 mt-1">Total seluruh penanganan</p>
        </div>

        {/* 4. Total Biaya Perbaikan Bulan Ini */}
        <div className="crm-card p-4 bg-[#FAF9F5] border-gold-500/30">
          <div className="flex items-center justify-between text-charcoal-600 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-gold-700">Biaya Bulan Ini</span>
            <DollarSign className="w-4 h-4 text-gold-600" />
          </div>
          <div className="text-base font-black text-charcoal-900 truncate" title={formatRupiah(ownerSummary.totalCostThisMonth)}>
            {formatRupiah(ownerSummary.totalCostThisMonth)}
          </div>
          <p className="text-[10px] text-charcoal-500 mt-1 font-medium">
            Bulan {MONTH_NAMES[new Date().getMonth()]} {new Date().getFullYear()}
          </p>
        </div>

        {/* 5. Total Biaya Garansi */}
        <div className="crm-card p-4 bg-[#FAF9F5] border-gold-500/50">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-black uppercase tracking-wider text-gold-700">Garansi Showroom</span>
            <ShieldCheck className="w-4 h-4 text-gold-600" />
          </div>
          <div className="text-base font-black text-gold-600 truncate" title={formatRupiah(ownerSummary.totalGaransiCost)}>
            {formatRupiah(ownerSummary.totalGaransiCost)}
          </div>
          <p className="text-[10px] text-gold-800 mt-1 font-semibold">100% Ditanggung HR MOTOR</p>
        </div>

        {/* 6. Total Biaya Non-Garansi */}
        <div className="crm-card p-4">
          <div className="flex items-center justify-between text-charcoal-600 mb-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-charcoal-600">Biaya Non-Garansi</span>
            <DollarSign className="w-4 h-4 text-charcoal-400" />
          </div>
          <div className="text-base font-black text-charcoal-800 truncate" title={formatRupiah(ownerSummary.totalNonGaransiCost)}>
            {formatRupiah(ownerSummary.totalNonGaransiCost)}
          </div>
          <p className="text-[10px] text-charcoal-400 mt-1 font-medium">Dibayar Oleh Konsumen</p>
        </div>
      </div>

      {/* Sub-Tab Navigasi Halaman */}
      <div className="flex items-center justify-between border-b border-[#EAE8E3]">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setActiveTab('list')}
            className={`flex items-center gap-2 py-3 px-3 text-xs font-bold border-b-2 transition-colors ${
              activeTab === 'list'
                ? 'border-gold-500 text-gold-600'
                : 'border-transparent text-charcoal-500 hover:text-charcoal-900'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Tabel Riwayat Perbaikan ({filteredClaims.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('reports')}
            className={`flex items-center gap-2 py-3 px-3 text-xs font-bold border-b-2 transition-colors ${
              activeTab === 'reports'
                ? 'border-gold-500 text-gold-600'
                : 'border-transparent text-charcoal-500 hover:text-charcoal-900'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>Dashboard & Laporan Bulanan Owner</span>
          </button>
        </div>

        {customerFilter !== 'Semua' && (
          <div className="flex items-center gap-1.5 px-3 py-1 text-xs text-gold-800 bg-gold-50/80 border border-gold-300 rounded-lg">
            <span>Filter Konsumen: <strong>{customerFilter}</strong></span>
            <button
              onClick={() => setCustomerFilter('Semua')}
              className="ml-1 text-gold-700 hover:text-gold-900"
              title="Hapus filter konsumen"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: TABEL RIWAYAT PERBAIKAN                                            */}
      {/* ========================================================================= */}
      {activeTab === 'list' && (
        <div className="space-y-4">
          {/* Toolbar Pencarian & Filter */}
          <div className="p-3 bg-white border border-slate-200 rounded-xl shadow-xs flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
            {/* Input Pencarian */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Cari nama konsumen, nomor WhatsApp, nomor tiket, atau kendaraan..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs text-slate-800 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:bg-white"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Quick Filters */}
            <div className="flex items-center gap-2 flex-wrap">
              {/* Filter Jenis Perbaikan */}
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] text-slate-500 font-medium">Jenis:</span>
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value as any)}
                  className="text-xs py-1.5 px-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                >
                  <option value="Semua">Semua Jenis</option>
                  <option value="Garansi">Garansi (Beban Showroom)</option>
                  <option value="Non-Garansi">Non-Garansi (Bayar Konsumen)</option>
                </select>
              </div>

              {/* Filter Keterangan Masa Garansi */}
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] text-slate-500 font-medium">Masa Garansi:</span>
                <select
                  value={warrantyFilter}
                  onChange={(e) => setWarrantyFilter(e.target.value as any)}
                  className="text-xs py-1.5 px-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                >
                  <option value="Semua">Semua Keterangan</option>
                  <option value="Dalam Masa Garansi">Dalam Masa Garansi (≤ 1 Bulan)</option>
                  <option value="Di Luar Masa Garansi">Di Luar Masa Garansi (&gt; 1 Bulan)</option>
                </select>
              </div>

              {/* Filter Tahun */}
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] text-slate-500 font-medium">Tahun:</span>
                <select
                  value={selectedYearFilter}
                  onChange={(e) => setSelectedYearFilter(e.target.value)}
                  className="text-xs py-1.5 px-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                >
                  <option value="Semua">Semua Tahun</option>
                  <option value="2026">2026</option>
                  <option value="2025">2025</option>
                </select>
              </div>

              {/* Reset Filter Button */}
              {(typeFilter !== 'Semua' || warrantyFilter !== 'Semua' || selectedYearFilter !== 'Semua' || searchQuery || customerFilter !== 'Semua') && (
                <button
                  onClick={() => {
                    setTypeFilter('Semua');
                    setWarrantyFilter('Semua');
                    setSelectedYearFilter('Semua');
                    setSelectedMonthFilter('Semua');
                    setCustomerFilter('Semua');
                    setSearchQuery('');
                  }}
                  className="flex items-center gap-1 text-[11px] text-slate-500 hover:text-rose-600 px-2 py-1 rounded transition-colors"
                  title="Reset Semua Filter"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Reset</span>
                </button>
              )}
            </div>
          </div>

          {/* Tabel Riwayat Perbaikan (Sesuai Kolom Permintaan Pengguna) */}
          <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-600">
                    <th className="py-3 px-3 w-12 text-center">No</th>
                    <th className="py-3 px-3">Nama Konsumen</th>
                    <th className="py-3 px-3">Nomor WhatsApp</th>
                    <th className="py-3 px-3">Mobil</th>
                    <th className="py-3 px-3">Tgl Beli</th>
                    <th className="py-3 px-3">Tgl Perbaikan</th>
                    <th className="py-3 px-3">Keluhan</th>
                    <th className="py-3 px-3">Tindakan Perbaikan</th>
                    <th className="py-3 px-3">Jenis Perbaikan</th>
                    <th className="py-3 px-3 text-right">Total Biaya</th>
                    <th className="py-3 px-3 text-center">Keterangan Garansi</th>
                    <th className="py-3 px-3 text-center w-28">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {filteredClaims.length === 0 ? (
                    <tr>
                      <td colSpan={12} className="py-12 text-center text-slate-500">
                        <Wrench className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                        <p className="font-semibold text-slate-700">Tidak ada riwayat perbaikan ditemukan</p>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          Silakan klik tombol &quot;Tambah Riwayat Perbaikan&quot; untuk mencatat perbaikan yang telah dilaksanakan.
                        </p>
                      </td>
                    </tr>
                  ) : (
                    filteredClaims.map((claim, index) => {
                      const warrantyCheck = checkWarrantyStatus(claim.purchaseDate, claim.claimDate);

                      // Check if customer has multiple repairs
                      const customerRepairsCount = repairClaims.filter(
                        (c) =>
                          (c.customerPhone && c.customerPhone === claim.customerPhone) ||
                          c.customerName.toLowerCase() === claim.customerName.toLowerCase()
                      ).length;

                      return (
                        <tr key={claim.id} className="hover:bg-slate-50/80 transition-colors">
                          {/* 1. Nomor / Tiket */}
                          <td className="py-3 px-3 text-center text-slate-500 font-mono text-[11px]">
                            {index + 1}
                            <div className="text-[9px] text-slate-400 font-sans">{claim.claimNumber || claim.id}</div>
                          </td>

                          {/* 2. Nama Konsumen */}
                          <td className="py-3 px-3 font-semibold text-slate-900 whitespace-nowrap">
                            <div className="flex items-center gap-1.5">
                              <span>{claim.customerName}</span>
                              {customerRepairsCount > 1 && (
                                <button
                                  onClick={() => setCustomerFilter(claim.customerPhone || claim.customerName)}
                                  className="px-1.5 py-0.2 text-[9px] font-bold rounded-full bg-emerald-100 text-emerald-800 hover:bg-emerald-200 transition-colors"
                                  title={`Konsumen ini memiliki ${customerRepairsCount} riwayat perbaikan. Klik untuk filter.`}
                                >
                                  {customerRepairsCount}x
                                </button>
                              )}
                            </div>
                          </td>

                          {/* 3. Nomor WhatsApp */}
                          <td className="py-3 px-3 whitespace-nowrap">
                            <a
                              href={generateWhatsAppMessage(claim)}
                              target="_blank"
                              rel="noreferrer"
                              className="text-slate-700 hover:text-emerald-600 transition-colors flex items-center gap-1"
                              title="Kirim Konfirmasi WhatsApp"
                            >
                              <Phone className="w-3 h-3 text-slate-400" />
                              <span className="font-mono text-[11px]">{claim.customerPhone}</span>
                            </a>
                          </td>

                          {/* 4. Mobil */}
                          <td className="py-3 px-3 whitespace-nowrap">
                            <div className="font-medium text-slate-800 flex items-center gap-1">
                              <Car className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <span>{claim.vehicleBrand} {claim.vehicleModel}</span>
                            </div>
                            <span className="text-[10px] text-slate-400">Tahun {claim.vehicleYear}</span>
                          </td>

                          {/* 5. Tanggal Pembelian */}
                          <td className="py-3 px-3 whitespace-nowrap text-slate-600 text-[11px]">
                            {claim.purchaseDate ? formatDate(claim.purchaseDate) : '-'}
                          </td>

                          {/* 6. Tanggal Perbaikan */}
                          <td className="py-3 px-3 whitespace-nowrap font-medium text-slate-800 text-[11px]">
                            {formatDate(claim.claimDate)}
                          </td>

                          {/* 7. Keluhan */}
                          <td className="py-3 px-3 max-w-[170px]">
                            <p className="line-clamp-2 text-slate-700 text-[11px]" title={claim.complaintOrDamage || claim.complaint}>
                              {claim.complaintOrDamage || claim.complaint || '-'}
                            </p>
                          </td>

                          {/* 8. Tindakan Perbaikan */}
                          <td className="py-3 px-3 max-w-[200px]">
                            <p className="line-clamp-2 text-slate-800 font-medium text-[11px]" title={claim.repairActionDescription || claim.actionTaken}>
                              {claim.repairActionDescription || claim.actionTaken || '-'}
                            </p>
                            {claim.partsToRepair && (
                              <span className="text-[10px] text-slate-400 block truncate">Part: {claim.partsToRepair}</span>
                            )}
                          </td>

                          {/* 9. Jenis Perbaikan (Garansi / Non-Garansi) */}
                          <td className="py-3 px-3 whitespace-nowrap">
                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-0.5 text-[11px] font-semibold rounded-full ${
                                claim.claimType === 'Garansi'
                                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                  : 'bg-blue-100 text-blue-800 border border-blue-200'
                              }`}
                            >
                              {claim.claimType === 'Garansi' ? (
                                <ShieldCheck className="w-3 h-3 text-emerald-600" />
                              ) : (
                                <DollarSign className="w-3 h-3 text-blue-600" />
                              )}
                              {claim.claimType}
                            </span>
                          </td>

                          {/* 10. Total Biaya */}
                          <td className="py-3 px-3 text-right whitespace-nowrap">
                            <div className="font-bold text-slate-900 text-xs">
                              {formatRupiah(claim.totalCost)}
                            </div>
                            <span className="text-[9px] text-slate-400 block">
                              Part: {formatRupiah(claim.sparepartCost)} | Jasa: {formatRupiah(claim.serviceCost)}
                            </span>
                          </td>

                          {/* 11. Keterangan Masa Garansi */}
                          <td className="py-3 px-3 text-center whitespace-nowrap">
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-semibold rounded-md ${
                                warrantyCheck.isWithinWarranty
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : 'bg-amber-50 text-amber-700 border border-amber-200'
                              }`}
                              title={warrantyCheck.notes}
                            >
                              {warrantyCheck.isWithinWarranty ? (
                                <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                              ) : (
                                <AlertTriangle className="w-3 h-3 text-amber-600 shrink-0" />
                              )}
                              <span>{warrantyCheck.statusLabel}</span>
                            </span>
                            <div className="text-[9px] text-slate-400 mt-0.5">
                              {warrantyCheck.isWithinWarranty ? `Hari ke-${warrantyCheck.daysDiff}` : `Lewat ${Math.max(0, warrantyCheck.daysDiff - 31)} hari`}
                            </div>
                          </td>

                          {/* 12. Aksi: Detail, Edit, Hapus */}
                          <td className="py-3 px-3 text-center">
                            <div className="flex items-center justify-center gap-1">
                              <button
                                onClick={() => {
                                  setSelectedClaim(claim);
                                  setIsDetailModalOpen(true);
                                }}
                                className="p-1.5 text-slate-600 hover:text-emerald-600 hover:bg-slate-100 rounded-md transition-colors"
                                title="Lihat Detail Lengkap & Cetak Tanda Terima"
                              >
                                <Eye className="w-4 h-4" />
                              </button>

                              <button
                                onClick={() => handleOpenEdit(claim)}
                                className="p-1.5 text-slate-600 hover:text-blue-600 hover:bg-slate-100 rounded-md transition-colors"
                                title="Edit Riwayat Perbaikan"
                              >
                                <Edit className="w-4 h-4" />
                              </button>

                              <button
                                onClick={() => setDeleteConfirmId(claim.id)}
                                className="p-1.5 text-slate-600 hover:text-rose-600 hover:bg-slate-100 rounded-md transition-colors"
                                title="Hapus Data Perbaikan"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Table Footer Summary */}
            <div className="p-3 bg-slate-50 border-t border-slate-200 text-xs text-slate-600 flex flex-col sm:flex-row items-center justify-between gap-2">
              <div>
                Menampilkan <strong>{filteredClaims.length}</strong> dari <strong>{repairClaims.length}</strong> total riwayat perbaikan
              </div>
              <div className="flex items-center gap-4 text-[11px]">
                <span>
                  Beban Garansi HR MOTOR: <strong className="text-amber-800">{formatRupiah(ownerSummary.totalGaransiCost)}</strong>
                </span>
                <span>
                  Dibayar Konsumen: <strong className="text-blue-800">{formatRupiah(ownerSummary.totalNonGaransiCost)}</strong>
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: DASHBOARD & LAPORAN BULANAN OWNER                                   */}
      {/* ========================================================================= */}
      {activeTab === 'reports' && (
        <div className="space-y-6">
          {/* Header Periode Laporan */}
          <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800">
                Laporan Eksekutif Owner
              </span>
              <h3 className="text-base font-bold text-slate-900 mt-0.5">
                Analitik Riwayat Perbaikan, Kerusakan Mobil & Kontrol Biaya Showroom
              </h3>
              <p className="text-xs text-slate-500">
                Memantau pengeluaran klaim garansi HR MOTOR, biaya per unit kendaraan, dan rekapitulasi konsumen.
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={handleExportExcel}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                <span>Unduh Excel</span>
              </button>

              <button
                onClick={handleExportPDF}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-rose-800 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-colors"
              >
                <Download className="w-4 h-4 text-rose-600" />
                <span>Unduh PDF</span>
              </button>
            </div>
          </div>

          {/* VISUALISASI GRAFIK 1: Grafik Biaya Perbaikan Berdasarkan Bulan dan Tahun */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 p-4 bg-white border border-slate-200 rounded-xl shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h4 className="text-sm font-bold text-slate-900">
                    Grafik Biaya Perbaikan Berdasarkan Bulan & Tahun
                  </h4>
                  <p className="text-xs text-slate-500">
                    Perbandingan pengeluaran Biaya Garansi (Showroom) vs Biaya Non-Garansi (Konsumen)
                  </p>
                </div>
                <TrendingUp className="w-4 h-4 text-emerald-600" />
              </div>

              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyTimelineData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="monthLabel" tick={{ fontSize: 11, fill: '#64748b' }} />
                    <YAxis
                      tick={{ fontSize: 10, fill: '#64748b' }}
                      tickFormatter={(v) => `${(v / 1000000).toFixed(1)}jt`}
                    />
                    <Tooltip
                      formatter={(val: any) => [formatRupiah(Number(val)), '']}
                      labelFormatter={(lbl) => `Periode: ${lbl}`}
                    />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Bar dataKey="Biaya Garansi (Showroom)" fill="#D99A32" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Biaya Non-Garansi" fill="#202020" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* VISUALISASI GRAFIK 2: Kerusakan yang Paling Sering Terjadi */}
            <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-xs">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h4 className="text-sm font-bold text-slate-900">Kerusakan Paling Sering</h4>
                  <p className="text-xs text-slate-500">Distribusi komponen mobil yang diservis</p>
                </div>
                <PieChartIcon className="w-4 h-4 text-emerald-600" />
              </div>

              <div className="h-56 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={damageCategoryAnalytics}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={75}
                      paddingAngle={3}
                      dataKey="count"
                    >
                      {damageCategoryAnalytics.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(val: any, name: any, item: any) => [
                        `${val} kasus (${formatRupiah(item.payload.totalCost)})`,
                        item.payload.name,
                      ]}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="space-y-1 mt-1 text-[11px] max-h-28 overflow-y-auto divide-y divide-slate-100">
                {damageCategoryAnalytics.map((item, idx) => (
                  <div key={item.name} className="flex items-center justify-between py-1">
                    <div className="flex items-center gap-1.5">
                      <span
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: PIE_COLORS[idx % PIE_COLORS.length] }}
                      />
                      <span className="font-semibold text-slate-800">{item.name}</span>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-slate-900">{item.count} unit</span>
                      <span className="text-[10px] text-slate-400 ml-1">({item.percentage}%)</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* LAPORAN 1: SIAPA SAJA KONSUMEN YANG MEMINTA DAN SUDAH MENDAPATKAN PERBAIKAN */}
          <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Users className="w-4 h-4 text-emerald-600" />
                  Daftar Konsumen yang Telah Menerima Perbaikan & Total Biaya per Konsumen
                </h4>
                <p className="text-xs text-slate-500">
                  Rekapitulasi riwayat penanganan purna jual bagi masing-masing konsumen showroom HR MOTOR Garut
                </p>
              </div>
              <span className="px-2.5 py-1 text-xs font-semibold text-emerald-800 bg-emerald-50 rounded-md border border-emerald-200">
                {customerAnalytics.length} Konsumen Terlayani
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-600">
                    <th className="py-3 px-4">Nama Konsumen</th>
                    <th className="py-3 px-4">Nomor WhatsApp</th>
                    <th className="py-3 px-4">Kendaraan yang Pernah Diservis</th>
                    <th className="py-3 px-4 text-center">Jumlah Perbaikan</th>
                    <th className="py-3 px-4 text-center">Status Garansi</th>
                    <th className="py-3 px-4 text-right font-bold text-slate-800">Total Biaya Perbaikan Konsumen</th>
                    <th className="py-3 px-4 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {customerAnalytics.map((c) => (
                    <tr key={c.customerPhone || c.customerName} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-4 font-semibold text-slate-900">{c.customerName}</td>
                      <td className="py-3 px-4 font-mono text-slate-600">{c.customerPhone}</td>
                      <td className="py-3 px-4 text-slate-700">{c.vehicleList}</td>
                      <td className="py-3 px-4 text-center">
                        <span className="px-2 py-0.5 text-[11px] font-bold rounded-full bg-slate-100 text-slate-800">
                          {c.repairCount}x perbaikan
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="text-[10px] text-emerald-700 font-semibold">{c.warrantyCount} Garansi</span>
                        {c.nonWarrantyCount > 0 && (
                          <span className="text-[10px] text-blue-700 font-semibold ml-1.5">• {c.nonWarrantyCount} Non-Garansi</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right font-extrabold text-slate-900">
                        {formatRupiah(c.totalCost)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => {
                            setCustomerFilter(c.customerPhone || c.customerName);
                            setActiveTab('list');
                          }}
                          className="text-xs font-semibold text-emerald-600 hover:text-emerald-800 transition-colors"
                        >
                          Lihat Rincian →
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* LAPORAN 2: MOBIL APA SAJA YANG PERNAH DIPERBAIKI & TOTAL BIAYA SETIAP MOBIL */}
          <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Car className="w-4 h-4 text-blue-600" />
                  Daftar Kendaraan yang Pernah Diperbaiki & Total Biaya per Mobil
                </h4>
                <p className="text-xs text-slate-500">
                  Statistik frekuensi kerusakan unit kendaraan dan akumulasi pengeluaran perbaikan per model
                </p>
              </div>
              <span className="px-2.5 py-1 text-xs font-semibold text-blue-800 bg-blue-50 rounded-md border border-blue-200">
                {vehicleAnalytics.length} Tipe Kendaraan
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-600">
                    <th className="py-3 px-4">Merek & Model Kendaraan</th>
                    <th className="py-3 px-4 text-center">Tahun</th>
                    <th className="py-3 px-4 text-center">Frekuensi Diservis</th>
                    <th className="py-3 px-4">Kerusakan Paling Umum</th>
                    <th className="py-3 px-4 text-center">Rincian Klaim</th>
                    <th className="py-3 px-4 text-right font-bold text-slate-800">Total Biaya Perbaikan Mobil</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {vehicleAnalytics.map((v) => (
                    <tr key={v.vehicleName} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-4 font-semibold text-slate-900 flex items-center gap-1.5">
                        <Car className="w-3.5 h-3.5 text-slate-400" />
                        <span>{v.brand} {v.model}</span>
                      </td>
                      <td className="py-3 px-4 text-center text-slate-600">{v.year}</td>
                      <td className="py-3 px-4 text-center font-bold text-slate-800">{v.repairCount} kali</td>
                      <td className="py-3 px-4 text-slate-700">
                        <span className="px-2 py-0.5 text-[10px] font-semibold bg-slate-100 rounded text-slate-700">
                          {v.topCategory}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center text-[11px]">
                        <span className="text-emerald-700 font-semibold">{v.warrantyCount} Garansi</span>
                        <span className="text-slate-400 mx-1">/</span>
                        <span className="text-blue-700 font-semibold">{v.nonWarrantyCount} Non</span>
                      </td>
                      <td className="py-3 px-4 text-right font-extrabold text-slate-900">
                        {formatRupiah(v.totalCost)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* LAPORAN 3: TOTAL PENGELUARAN PERBAIKAN SETIAP BULAN */}
          <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-indigo-600" />
                  Rekapitulasi Total Pengeluaran Perbaikan Setiap Bulan
                </h4>
                <p className="text-xs text-slate-500">
                  Rincian biaya garansi yang ditanggung dealer vs biaya non-garansi konsumen per bulan
                </p>
              </div>
              <span className="px-2.5 py-1 text-xs font-semibold text-slate-700 bg-slate-100 rounded-md">
                {monthlyTimelineData.length} Bulan Aktif
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-600">
                    <th className="py-3 px-4">Bulan & Tahun</th>
                    <th className="py-3 px-4 text-center">Total Unit Diservis</th>
                    <th className="py-3 px-4 text-center">Konsumen Unik</th>
                    <th className="py-3 px-4 text-right text-amber-800">Biaya Garansi (HR MOTOR)</th>
                    <th className="py-3 px-4 text-right text-blue-800">Biaya Non-Garansi (Konsumen)</th>
                    <th className="py-3 px-4 text-right font-bold text-slate-900">Total Pengeluaran Bulan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {monthlyTimelineData.map((m) => (
                    <tr key={m.monthKey} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-4 font-semibold text-slate-900">
                        {m.monthLabel}
                        {m.monthKey === currentMonthKey && (
                          <span className="ml-2 px-1.5 py-0.2 text-[9px] font-bold bg-emerald-100 text-emerald-800 rounded">
                            Bulan Ini
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center font-bold text-slate-800">{m.totalClaims} unit</td>
                      <td className="py-3 px-4 text-center text-slate-600">{m.customerCount} orang</td>
                      <td className="py-3 px-4 text-right font-semibold text-amber-700">{formatRupiah(m.garansiCost)}</td>
                      <td className="py-3 px-4 text-right font-semibold text-blue-700">{formatRupiah(m.nonGaransiCost)}</td>
                      <td className="py-3 px-4 text-right font-black text-slate-900">{formatRupiah(m.totalCost)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: FORMULIR TAMBAH RIWAYAT PERBAIKAN                                */}
      {/* ========================================================================= */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
            {/* Header Modal */}
            <div className="flex items-center justify-between p-4 bg-slate-900 text-white">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                  <Wrench className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold">Formulir Tambah Riwayat Perbaikan</h3>
                  <p className="text-[11px] text-slate-400">Pencatatan perbaikan yang telah dilaksanakan oleh HR MOTOR Garut</p>
                </div>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmitAdd} className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
              {/* Auto-fill Konsumen Terdaftar */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-emerald-600" />
                    Pilih Konsumen Terdaftar (Auto-fill Data Pembelian):
                  </label>
                  <span className="text-[10px] text-slate-500">Atau ketik manual di bawah</span>
                </div>
                <select
                  value={formData.customerId}
                  onChange={(e) => handleSelectCustomer(e.target.value)}
                  className="w-full text-xs py-2 px-3 bg-white border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                >
                  <option value="">-- Ketik Konsumen Baru Secara Manual --</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.fullName} ({c.whatsapp}) — {c.interestedVehicle || 'Pelanggan Showroom'}
                    </option>
                  ))}
                </select>
              </div>

              {/* Data Konsumen */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nama Konsumen <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Agus Gunawan"
                    value={formData.customerName}
                    onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                    className="w-full text-xs py-2 px-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nomor WhatsApp Konsumen <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="Contoh: 081221345678"
                    value={formData.customerPhone}
                    onChange={(e) => setFormData({ ...formData, customerPhone: e.target.value })}
                    className="w-full text-xs py-2 px-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono"
                  />
                </div>
              </div>

              {/* Data Kendaraan */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Merek Mobil <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={formData.vehicleBrand}
                    onChange={(e) => setFormData({ ...formData, vehicleBrand: e.target.value })}
                    className="w-full text-xs py-2 px-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-white"
                  >
                    {CAR_BRANDS.map((b) => (
                      <option key={b} value={b}>
                        {b}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Tipe & Model Mobil <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Innova Reborn 2.4 V Diesel A/T"
                    value={formData.vehicleModel}
                    onChange={(e) => setFormData({ ...formData, vehicleModel: e.target.value })}
                    className="w-full text-xs py-2 px-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Tahun Mobil <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="2000"
                    max="2027"
                    required
                    value={formData.vehicleYear}
                    onChange={(e) => setFormData({ ...formData, vehicleYear: Number(e.target.value) })}
                    className="w-full text-xs py-2 px-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* Tanggal Pembelian, Tanggal Perbaikan & Pemeriksaan Masa Garansi Otomatis */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                <div className="text-xs font-bold text-slate-800 flex items-center justify-between">
                  <span>Pemeriksaan Masa Garansi 1 Bulan HR MOTOR</span>
                  <span className="text-[10px] text-slate-500">Dihitung otomatis dari Tgl Beli & Perbaikan</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Tanggal Pembelian Mobil
                    </label>
                    <input
                      type="date"
                      value={formData.purchaseDate}
                      onChange={(e) => setFormData({ ...formData, purchaseDate: e.target.value })}
                      className="w-full text-xs py-2 px-3 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Tanggal Perbaikan Dilaksanakan <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="date"
                      required
                      value={formData.claimDate}
                      onChange={(e) => setFormData({ ...formData, claimDate: e.target.value })}
                      className="w-full text-xs py-2 px-3 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                {/* Banner Status Masa Garansi Otomatis */}
                {formData.purchaseDate && (
                  <div
                    className={`p-2.5 rounded-lg border text-xs flex items-center gap-2 ${
                      addFormWarrantyCheck.isWithinWarranty
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        : 'bg-amber-50 text-amber-900 border-amber-200'
                    }`}
                  >
                    {addFormWarrantyCheck.isWithinWarranty ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                    )}
                    <div>
                      <span className="font-bold">{addFormWarrantyCheck.statusLabel}:</span>{' '}
                      <span>{addFormWarrantyCheck.notes}</span>
                      {!addFormWarrantyCheck.isWithinWarranty && (
                        <p className="text-[10px] text-amber-700 mt-0.5 font-medium">
                          ⚠️ Perbaikan di luar masa garansi disarankan ditandai sebagai Non-Garansi.
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Pilihan Keputusan Jenis Perbaikan */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Keputusan Jenis Perbaikan <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, claimType: 'Garansi' })}
                    className={`py-2 px-3 text-xs font-semibold rounded-lg border text-left transition-all ${
                      formData.claimType === 'Garansi'
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                        : 'bg-slate-50 text-slate-700 border-slate-300 hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 font-bold">
                      <ShieldCheck className="w-4 h-4" />
                      <span>Garansi (Ditanggung HR MOTOR)</span>
                    </div>
                    <span className="text-[10px] opacity-90 block mt-0.5">
                      Beban operasional dealer 100%
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, claimType: 'Non-Garansi' })}
                    className={`py-2 px-3 text-xs font-semibold rounded-lg border text-left transition-all ${
                      formData.claimType === 'Non-Garansi'
                        ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                        : 'bg-slate-50 text-slate-700 border-slate-300 hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 font-bold">
                      <DollarSign className="w-4 h-4" />
                      <span>Non-Garansi (Dibayar Konsumen)</span>
                    </div>
                    <span className="text-[10px] opacity-90 block mt-0.5">
                      Ditagihkan langsung ke konsumen
                    </span>
                  </button>
                </div>
              </div>

              {/* Keluhan & Informasi Kerusakan */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Keluhan atau Kerusakan Mobil <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    rows={2}
                    required
                    placeholder="Contoh: Suara decit rem depan saat turunan dan sedikit getar..."
                    value={formData.complaintOrDamage}
                    onChange={(e) => setFormData({ ...formData, complaintOrDamage: e.target.value })}
                    className="w-full text-xs py-2 px-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Kategori Kerusakan <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={formData.damageCategory}
                    onChange={(e) => setFormData({ ...formData, damageCategory: e.target.value as any })}
                    className="w-full text-xs py-2 px-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-white"
                  >
                    {REPAIR_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>

                  <label className="block text-xs font-semibold text-slate-700 mt-2 mb-1">
                    Bagian yang Diperbaiki
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: Kampas rem & piringan rotor"
                    value={formData.partsToRepair}
                    onChange={(e) => setFormData({ ...formData, partsToRepair: e.target.value })}
                    className="w-full text-xs py-1.5 px-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* Tindakan Perbaikan yang Dilakukan */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Tindakan Perbaikan yang Dilakukan <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Penggantian kampas rem orisinal Toyota dan pembubutan piringan cakram halus"
                  value={formData.repairActionDescription}
                  onChange={(e) => setFormData({ ...formData, repairActionDescription: e.target.value })}
                  className="w-full text-xs py-2 px-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              {/* Rincian Biaya Perbaikan (Sparepart + Jasa Mekanik = Total Otomatis) */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                  <span>Biaya Perbaikan</span>
                  <span className="text-[11px] font-semibold text-emerald-700">
                    Total Otomatis: Sparepart + Jasa Mekanik
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Biaya Sparepart (Rp)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="10000"
                      value={formData.sparepartCost || ''}
                      onChange={(e) => setFormData({ ...formData, sparepartCost: Number(e.target.value) || 0 })}
                      className="w-full text-xs py-2 px-3 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono"
                      placeholder="0"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Biaya Jasa Mekanik (Rp)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="10000"
                      value={formData.serviceCost || ''}
                      onChange={(e) => setFormData({ ...formData, serviceCost: Number(e.target.value) || 0 })}
                      className="w-full text-xs py-2 px-3 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono"
                      placeholder="0"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-emerald-800 mb-1">
                      Total Biaya Perbaikan
                    </label>
                    <div className="text-sm font-extrabold text-emerald-700 py-2 px-3 bg-emerald-50 border border-emerald-200 rounded-lg font-mono">
                      {formatRupiah((formData.sparepartCost || 0) + (formData.serviceCost || 0))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Catatan Tambahan */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Catatan Tambahan</label>
                <input
                  type="text"
                  placeholder="Contoh: Garansi resmi HR MOTOR ditanggung 100% oleh showroom"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full text-xs py-2 px-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              {/* Checkbox Save to Customer Database */}
              {!formData.customerId && (
                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="saveCustCheck"
                    checked={formData.saveNewCustomer}
                    onChange={(e) => setFormData({ ...formData, saveNewCustomer: e.target.checked })}
                    className="rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  <label htmlFor="saveCustCheck" className="text-xs text-slate-600 cursor-pointer">
                    Simpan juga konsumen ini ke Database Pelanggan HR MOTOR Garut
                  </label>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm shadow-emerald-600/30 transition-all flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Simpan Riwayat Perbaikan</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: DETAIL RIWAYAT PERBAIKAN & TANDA TERIMA / SPK                    */}
      {/* ========================================================================= */}
      {isDetailModalOpen && selectedClaim && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex items-center justify-between p-4 bg-slate-900 text-white">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold flex items-center gap-2">
                    <span>Tiket: {selectedClaim.claimNumber || selectedClaim.id}</span>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                        selectedClaim.claimType === 'Garansi'
                          ? 'bg-emerald-500/20 text-emerald-300'
                          : 'bg-blue-500/20 text-blue-300'
                      }`}
                    >
                      {selectedClaim.claimType}
                    </span>
                  </h3>
                  <p className="text-[11px] text-slate-400">Rincian Riwayat Perbaikan Mobil Konsumen HR MOTOR</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setIsDetailModalOpen(false);
                    handleOpenEdit(selectedClaim);
                  }}
                  className="px-2.5 py-1 text-xs font-semibold text-slate-200 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-md transition-colors flex items-center gap-1"
                >
                  <Edit className="w-3.5 h-3.5" />
                  <span>Edit</span>
                </button>
                <button
                  onClick={() => setIsDetailModalOpen(false)}
                  className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
              {/* Header Box: Konsumen & Kendaraan */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Konsumen</div>
                  <div className="text-base font-bold text-slate-900 mt-0.5">{selectedClaim.customerName}</div>
                  <div className="flex items-center gap-1.5 text-xs text-slate-600 mt-1">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    <span className="font-mono">{selectedClaim.customerPhone}</span>
                  </div>
                </div>

                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Unit Kendaraan</div>
                  <div className="text-base font-bold text-slate-900 mt-0.5">
                    {selectedClaim.vehicleBrand} {selectedClaim.vehicleModel}
                  </div>
                  <div className="text-xs text-slate-600 mt-1">
                    Tahun {selectedClaim.vehicleYear}
                    {selectedClaim.purchaseDate && ` • Beli: ${formatDate(selectedClaim.purchaseDate)}`}
                  </div>
                </div>
              </div>

              {/* Status Masa Garansi Box */}
              {(() => {
                const wInfo = checkWarrantyStatus(selectedClaim.purchaseDate, selectedClaim.claimDate);
                return (
                  <div
                    className={`p-3.5 rounded-xl border text-xs flex items-start gap-2.5 ${
                      wInfo.isWithinWarranty
                        ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
                        : 'bg-amber-50 text-amber-900 border-amber-200'
                    }`}
                  >
                    {wInfo.isWithinWarranty ? (
                      <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                    ) : (
                      <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                    )}
                    <div>
                      <span className="font-bold text-sm block">Status: {wInfo.statusLabel}</span>
                      <p className="mt-0.5">{wInfo.notes}</p>
                      <div className="mt-1 text-[11px] font-medium">
                        Jenis Perbaikan Ditetapkan:{' '}
                        <strong>{selectedClaim.claimType}</strong>{' '}
                        ({selectedClaim.claimType === 'Garansi' ? 'Ditanggung HR MOTOR 100%' : 'Ditagihkan ke Konsumen'})
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Keluhan & Tindakan */}
              <div className="space-y-3">
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
                  <div className="text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Keluhan atau Kerusakan yang Dialami:
                  </div>
                  <p className="text-xs text-slate-800 leading-relaxed">
                    {selectedClaim.complaintOrDamage || selectedClaim.complaint || '-'}
                  </p>
                  {selectedClaim.partsToRepair && (
                    <p className="text-[11px] text-slate-500 font-medium mt-1.5">
                      Bagian Mobil: {selectedClaim.partsToRepair} ({selectedClaim.damageCategory})
                    </p>
                  )}
                </div>

                <div className="p-3.5 bg-emerald-50/50 border border-emerald-200/80 rounded-xl">
                  <div className="text-[11px] font-bold text-emerald-900 uppercase tracking-wider mb-1">
                    Tindakan Perbaikan yang Dilakukan Teknisi:
                  </div>
                  <p className="text-xs text-slate-800 leading-relaxed">
                    {selectedClaim.repairActionDescription || selectedClaim.actionTaken || '-'}
                  </p>
                  {selectedClaim.notes && (
                    <p className="text-[11px] text-slate-500 mt-1 italic">Catatan: {selectedClaim.notes}</p>
                  )}
                </div>
              </div>

              {/* Rincian Biaya */}
              <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-xs">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200 mb-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    Rincian Biaya Perbaikan
                  </span>
                  <span
                    className={`text-[11px] font-bold px-2 py-0.5 rounded ${
                      selectedClaim.claimType === 'Garansi'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-blue-100 text-blue-800'
                    }`}
                  >
                    {selectedClaim.claimType === 'Garansi' ? '100% Ditanggung HR MOTOR' : 'Dibayar Konsumen'}
                  </span>
                </div>

                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span>Biaya Sparepart</span>
                    <span className="font-mono">{formatRupiah(selectedClaim.sparepartCost)}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Biaya Jasa Mekanik</span>
                    <span className="font-mono">{formatRupiah(selectedClaim.serviceCost)}</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-slate-200 text-sm font-extrabold text-slate-900">
                    <span>Total Biaya Perbaikan</span>
                    <span className="font-mono text-emerald-700">{formatRupiah(selectedClaim.totalCost)}</span>
                  </div>
                </div>
              </div>

              {/* WhatsApp Notification CTA */}
              <div className="p-3.5 bg-emerald-50/70 border border-emerald-200 rounded-xl flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <MessageCircle className="w-5 h-5 text-emerald-600 shrink-0" />
                  <div>
                    <h5 className="text-xs font-bold text-emerald-950">Konfirmasi ke WhatsApp Konsumen</h5>
                    <p className="text-[11px] text-emerald-700">Kirimkan rincian perbaikan ini ke nomor {selectedClaim.customerPhone}</p>
                  </div>
                </div>
                <a
                  href={generateWhatsAppMessage(selectedClaim)}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3.5 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm transition-all whitespace-nowrap"
                >
                  Kirim WhatsApp
                </a>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between p-4 bg-slate-50 border-t border-slate-200">
              <button
                onClick={() => setDeleteConfirmId(selectedClaim.id)}
                className="text-xs font-semibold text-rose-600 hover:text-rose-800 transition-colors flex items-center gap-1"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Hapus Riwayat Ini</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg transition-colors flex items-center gap-1.5"
                >
                  <Printer className="w-4 h-4 text-slate-500" />
                  <span>Cetak Tanda Terima / SPK</span>
                </button>

                <button
                  onClick={() => setIsDetailModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: EDIT RIWAYAT PERBAIKAN                                           */}
      {/* ========================================================================= */}
      {isEditModalOpen && editFormData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-4 bg-slate-900 text-white">
              <div className="flex items-center gap-2">
                <Edit className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-bold">Edit Riwayat Perbaikan ({editFormData.claimNumber})</h3>
              </div>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitEdit} className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Nama Konsumen</label>
                  <input
                    type="text"
                    required
                    value={editFormData.customerName}
                    onChange={(e) => setEditFormData({ ...editFormData, customerName: e.target.value })}
                    className="w-full text-xs py-2 px-3 border border-slate-300 rounded-lg focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Nomor WhatsApp</label>
                  <input
                    type="tel"
                    required
                    value={editFormData.customerPhone}
                    onChange={(e) => setEditFormData({ ...editFormData, customerPhone: e.target.value })}
                    className="w-full text-xs py-2 px-3 border border-slate-300 rounded-lg focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Merek Mobil</label>
                  <select
                    value={editFormData.vehicleBrand}
                    onChange={(e) => setEditFormData({ ...editFormData, vehicleBrand: e.target.value })}
                    className="w-full text-xs py-2 px-3 border border-slate-300 rounded-lg bg-white"
                  >
                    {CAR_BRANDS.map((b) => (
                      <option key={b} value={b}>
                        {b}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Model / Tipe Mobil</label>
                  <input
                    type="text"
                    required
                    value={editFormData.vehicleModel}
                    onChange={(e) => setEditFormData({ ...editFormData, vehicleModel: e.target.value })}
                    className="w-full text-xs py-2 px-3 border border-slate-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Tahun Mobil</label>
                  <input
                    type="number"
                    value={editFormData.vehicleYear}
                    onChange={(e) => setEditFormData({ ...editFormData, vehicleYear: Number(e.target.value) })}
                    className="w-full text-xs py-2 px-3 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              {/* Tanggal & Garansi */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Tanggal Pembelian</label>
                  <input
                    type="date"
                    value={editFormData.purchaseDate}
                    onChange={(e) => setEditFormData({ ...editFormData, purchaseDate: e.target.value })}
                    className="w-full text-xs py-2 px-3 border border-slate-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Tanggal Perbaikan</label>
                  <input
                    type="date"
                    required
                    value={editFormData.claimDate}
                    onChange={(e) => setEditFormData({ ...editFormData, claimDate: e.target.value })}
                    className="w-full text-xs py-2 px-3 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              {editFormWarrantyCheck && (
                <div
                  className={`p-2 rounded-lg border text-xs flex items-center gap-2 ${
                    editFormWarrantyCheck.isWithinWarranty
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                      : 'bg-amber-50 text-amber-800 border-amber-200'
                  }`}
                >
                  <span className="font-bold">{editFormWarrantyCheck.statusLabel}:</span>
                  <span>{editFormWarrantyCheck.notes}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Jenis Perbaikan</label>
                  <select
                    value={editFormData.claimType}
                    onChange={(e) => setEditFormData({ ...editFormData, claimType: e.target.value as any })}
                    className="w-full text-xs py-2 px-3 border border-slate-300 rounded-lg bg-white"
                  >
                    <option value="Garansi">Garansi (Beban Showroom HR MOTOR)</option>
                    <option value="Non-Garansi">Non-Garansi (Dibayar Konsumen)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Kategori Bagian</label>
                  <select
                    value={editFormData.damageCategory}
                    onChange={(e) => setEditFormData({ ...editFormData, damageCategory: e.target.value as any })}
                    className="w-full text-xs py-2 px-3 border border-slate-300 rounded-lg bg-white"
                  >
                    {REPAIR_CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Keluhan / Kerusakan</label>
                <textarea
                  rows={2}
                  value={editFormData.complaintOrDamage}
                  onChange={(e) => setEditFormData({ ...editFormData, complaintOrDamage: e.target.value })}
                  className="w-full text-xs py-2 px-3 border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Tindakan Perbaikan</label>
                <input
                  type="text"
                  value={editFormData.repairActionDescription}
                  onChange={(e) => setEditFormData({ ...editFormData, repairActionDescription: e.target.value })}
                  className="w-full text-xs py-2 px-3 border border-slate-300 rounded-lg"
                />
              </div>

              {/* Rincian Biaya */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Biaya Sparepart (Rp)</label>
                  <input
                    type="number"
                    min="0"
                    step="10000"
                    value={editFormData.sparepartCost}
                    onChange={(e) => setEditFormData({ ...editFormData, sparepartCost: Number(e.target.value) || 0 })}
                    className="w-full text-xs py-2 px-3 bg-white border border-slate-300 rounded-lg font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Biaya Jasa Mekanik (Rp)</label>
                  <input
                    type="number"
                    min="0"
                    step="10000"
                    value={editFormData.serviceCost}
                    onChange={(e) => setEditFormData({ ...editFormData, serviceCost: Number(e.target.value) || 0 })}
                    className="w-full text-xs py-2 px-3 bg-white border border-slate-300 rounded-lg font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-emerald-800 mb-1">Total Biaya Baru</label>
                  <div className="text-xs font-extrabold text-emerald-700 py-2 px-3 bg-emerald-50 border border-emerald-200 rounded-lg font-mono">
                    {formatRupiah((editFormData.sparepartCost || 0) + (editFormData.serviceCost || 0))}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Catatan Tambahan</label>
                <input
                  type="text"
                  value={editFormData.notes}
                  onChange={(e) => setEditFormData({ ...editFormData, notes: e.target.value })}
                  className="w-full text-xs py-2 px-3 border border-slate-300 rounded-lg"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm transition-all"
                >
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 4: KONFIRMASI HAPUS                                                 */}
      {/* ========================================================================= */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-sm bg-white rounded-2xl shadow-2xl border border-slate-200 p-5 space-y-4">
            <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div className="text-center">
              <h4 className="text-sm font-bold text-slate-900">Hapus Riwayat Perbaikan?</h4>
              <p className="text-xs text-slate-500 mt-1">
                Data perbaikan ini akan dihapus secara permanen dari server database CRM.
              </p>
            </div>
            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                Batal
              </button>
              <button
                onClick={() => handleDelete(deleteConfirmId)}
                className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-sm transition-colors"
              >
                Ya, Hapus
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
