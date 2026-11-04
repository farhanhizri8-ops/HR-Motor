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
  Sparkles,
  PieChart as PieChartIcon,
  Percent,
  Check,
  Building2,
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
  RepairClaim,
  RepairClaimType,
  RepairPartCategory,
  RepairStatus,
} from '@/types/crm';
import {
  REPAIR_CATEGORIES,
  RECOMMENDED_WORKSHOPS,
  parseRupiahInput,
  checkWarrantyStatus,
  calculateFleetHealth,
} from '@/lib/warranty';


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

const PIE_COLORS = [
  '#D99A32',
  '#3B82F6',
  '#10B981',
  '#EF4444',
  '#8B5CF6',
  '#EC4899',
  '#64748B',
];

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

  // Active sub-tab: 'all' (Semua: Dashboard & Tabel) | 'list' (Tabel Saja) | 'reports' (Visualisasi Saja)

  // Month & Year Selector for Metric: Total Uang Perbaikan Selama Satu Bulan
  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState<string>(
    String(currentDate.getMonth() + 1).padStart(2, '0')
  ); // e.g. "11"
  const [selectedYear, setSelectedYear] = useState<string>(
    String(currentDate.getFullYear())
  ); // e.g. "2026"

  // Search & Filter state for Table
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('Semua');
  const [warrantyFilter, setWarrantyFilter] = useState<'Semua' | 'Dalam Garansi (Gratis)' | 'Di Luar Garansi'>('Semua');
  const [statusFilter, setStatusFilter] = useState<string>('Semua');
  const [tableYearFilter, setTableYearFilter] = useState<string>('Semua');
  const [tableMonthFilter, setTableMonthFilter] = useState<string>('Semua');
  const [customerFilter, setCustomerFilter] = useState<string>('Semua');

  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedClaim, setSelectedClaim] = useState<RepairClaim | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Form State for Adding New Warranty Claim (5 Data Utama Sesuai Kebutuhan)
  const [formData, setFormData] = useState({
    selectedPurchaseKey: '',
    isManualMode: false,
    customerId: '',
    customerName: '',
    customerPhone: '',
    vehicleBrand: 'Toyota',
    vehicleModel: '',
    vehicleYear: 2021,
    plateNumber: '',
    purchaseDate: '',
    claimDate: new Date().toISOString().split('T')[0],
    damageCategory: 'Mesin' as RepairPartCategory,
    complaintOrDamage: '',
    partsToRepair: '',
    workshop: 'Bengkel Garut Motor Mandiri (Rujukan HR MOTOR)',
    customWorkshop: '',
    repairCost: 0,
    repairActionDescription: '',
    status: 'Selesai' as RepairStatus,
    notes: '',
    saveNewCustomer: false,
  });

  // State for Editing
  const [editFormData, setEditFormData] = useState<{
    id: string;
    claimNumber: string;
    customerName: string;
    customerPhone: string;
    vehicleBrand: string;
    vehicleModel: string;
    vehicleYear: number;
    plateNumber: string;
    purchaseDate: string;
    claimDate: string;
    claimType: RepairClaimType;
    damageCategory: RepairPartCategory;
    complaintOrDamage: string;
    partsToRepair: string;
    workshop: string;
    repairActionDescription: string;
    repairCost: number;
    status: RepairStatus;
    notes: string;
  } | null>(null);

  const triggerSuccess = (msg: string) => {
    setActionSuccess(msg);
    setTimeout(() => setActionSuccess(null), 4000);
  };

  // 1. List of Customers Who Have Purchased Cars (Auto-fill dropdown)
  const purchaseCustomersList = useMemo(() => {
    const list: Array<{
      key: string;
      customerId: string;
      customerName: string;
      customerPhone: string;
      vehicleBrand: string;
      vehicleModel: string;
      vehicleYear: number;
      plateNumber: string;
      purchaseDate: string;
      label: string;
    }> = [];

    purchases.forEach((p, idx) => {
      const cust = customers.find(
        (c) =>
          c.id === p.customerId ||
          c.fullName.toLowerCase().trim() === p.customerName.toLowerCase().trim()
      );
      const phone = cust?.whatsapp || (p as any).customerPhone || '';
      const brand = p.vehicleBrand || (p.vehicleName ? p.vehicleName.split(' ')[0] : 'Toyota');
      let model = p.vehicleModel || p.vehicleName || 'Mobil';
      if (model.toLowerCase().startsWith(brand.toLowerCase())) {
        model = model.slice(brand.length).trim() || model;
      }
      const plate = p.plateNumber || '-';

      list.push({
        key: `PURCHASE-${p.id || idx}`,
        customerId: p.customerId || cust?.id || '',
        customerName: p.customerName,
        customerPhone: phone,
        vehicleBrand: brand,
        vehicleModel: model,
        vehicleYear: p.vehicleYear || 2021,
        plateNumber: plate,
        purchaseDate: p.purchaseDate || '',
        label: `${p.customerName} — ${brand} ${model} [${plate}] (Beli: ${p.purchaseDate || '-'})`,
      });
    });

    // Also include any customer with status 'Sudah Beli' that might not be in purchases table
    customers.forEach((c) => {
      if (c.status === 'Sudah Beli') {
        const alreadyIn = list.some(
          (item) => item.customerId === c.id || item.customerName.toLowerCase().trim() === c.fullName.toLowerCase().trim()
        );
        if (!alreadyIn) {
          const brand = c.interestedVehicle ? c.interestedVehicle.split(' ')[0] : 'Toyota';
          let model = c.interestedVehicle || 'Mobil';
          if (model.toLowerCase().startsWith(brand.toLowerCase())) {
            model = model.slice(brand.length).trim() || model;
          }
          const plate = c.plateNumber || '-';
          list.push({
            key: `CUST-${c.id}`,
            customerId: c.id,
            customerName: c.fullName,
            customerPhone: c.whatsapp,
            vehicleBrand: brand,
            vehicleModel: model,
            vehicleYear: 2021,
            plateNumber: plate,
            purchaseDate: c.receiptDate || c.registeredDate || '',
            label: `${c.fullName} — ${brand} ${model} [${plate}] • ${c.whatsapp}`,
          });
        }
      }
    });

    return list;
  }, [purchases, customers]);

  // Real-time warranty status check for Add Form
  const addFormWarrantyCheck = useMemo(() => {
    return checkWarrantyStatus(formData.purchaseDate, formData.claimDate);
  }, [formData.purchaseDate, formData.claimDate]);

  // Real-time warranty status check for Edit Form
  const editFormWarrantyCheck = useMemo(() => {
    if (!editFormData) return null;
    return checkWarrantyStatus(editFormData.purchaseDate, editFormData.claimDate);
  }, [editFormData]);

  // 2. CORE DASHBOARD METRICS FOR GARANSI
  const warrantyMetrics = useMemo(() => {
    const totalClaimsCount = repairClaims.length;
    const isRealized = (c: RepairClaim) => c.status !== 'Dibatalkan';

    // A. 💰 Total Uang Perbaikan Selama Satu Bulan
    const monthKey = selectedMonth === 'ALL' ? '' : `${selectedYear}-${selectedMonth}`;
    const claimsForSelectedMonth = repairClaims.filter((c) => {
      const d = c.claimDate || c.createdAt;
      if (!d) return false;
      if (selectedMonth === 'ALL') {
        return selectedYear === 'ALL' || d.startsWith(selectedYear);
      }
      return d.startsWith(monthKey);
    });
    const totalCostSelectedMonth = claimsForSelectedMonth
      .filter(isRealized)
      .reduce((acc, c) => acc + (c.totalCost || 0), 0);

    // Total pengeluaran garansi keseluruhan (realisasi tanpa yang dibatalkan)
    const grandTotalCost = repairClaims
      .filter(isRealized)
      .reduce((acc, c) => acc + (c.totalCost || 0), 0);

    // B. 👥 Total Pelanggan yang Meminta Perbaikan (Unique customers)
    const uniqueCustomerKeys = new Set(
      repairClaims.map((c) => (c.customerPhone || c.customerName).trim().toLowerCase())
    );
    const totalUniqueCustomers = uniqueCustomerKeys.size;

    // C. 📊 Persentase Pelanggan Garansi dari Semua Penjualan
    // Rasio klaim: ((Jumlah Pelanggan Klaim / Total Seluruh Penjualan Mobil) * 100%)
    const salesCustomerIds = new Set<string>();
    purchases.forEach((p) => {
      if (p.customerId) salesCustomerIds.add(p.customerId);
      else if (p.customerName) salesCustomerIds.add(p.customerName.toLowerCase().trim());
    });
    customers.forEach((c) => {
      if (c.status === 'Sudah Beli') {
        salesCustomerIds.add(c.id);
      }
    });
    const totalCarSales = Math.max(salesCustomerIds.size, purchases.length, 1);
    const claimRatioPercentage = ((totalUniqueCustomers / totalCarSales) * 100).toFixed(1);

    // D. 🚗 Berapa Perbaikan Garansi per Unit
    // Rata-rata frekuensi klaim per unit mobil (totalKlaim / totalUnitUnik)
    const unitMap: Record<
      string,
      {
        unitKey: string;
        brand: string;
        model: string;
        year: number;
        plateNumber: string;
        customerName?: string;
        customerPhone?: string;
        claimCount: number;
        totalCost: number;
        categories: Record<string, number>;
      }
    > = {};

    repairClaims.forEach((c) => {
      const plate = (c.plateNumber || '').trim().toUpperCase();
      const carName = `${c.vehicleBrand} ${c.vehicleModel}`.trim();
      const custId = (c.customerPhone || c.customerName || '').trim().toLowerCase();
      const key = plate && plate !== '-' ? plate : `${custId}-${carName}-${c.vehicleYear}`.toLowerCase();

      if (!unitMap[key]) {
        unitMap[key] = {
          unitKey: key,
          brand: c.vehicleBrand,
          model: c.vehicleModel,
          year: c.vehicleYear,
          plateNumber: plate || '-',
          customerName: c.customerName,
          customerPhone: c.customerPhone,
          claimCount: 0,
          totalCost: 0,
          categories: {},
        };
      }
      unitMap[key].claimCount += 1;
      if (isRealized(c)) {
        unitMap[key].totalCost += c.totalCost || 0;
      }
      const cat = c.damageCategory || 'Lainnya';
      unitMap[key].categories[cat] = (unitMap[key].categories[cat] || 0) + 1;
    });

    const totalUniqueUnits = Object.keys(unitMap).length;
    const avgPerbaikanPerUnit =
      totalUniqueUnits > 0 ? (totalClaimsCount / totalUniqueUnits).toFixed(1) : '0';

    // Daftar unit mobil dengan klaim garansi terbanyak (e.g. Innova Reborn 2x, Xpander 1x)
    const rankedUnits = Object.values(unitMap)
      .map((u) => {
        const topCat = Object.entries(u.categories).sort((a, b) => b[1] - a[1])[0]?.[0] || '-';
        return {
          ...u,
          topCategory: topCat,
        };
      })
      .sort((a, b) => b.claimCount - a.claimCount || b.totalCost - a.totalCost);

    // E. 🔧 Perbaikan yang Sering Terjadi di Garansi (Ranking frekuensi kategori)
    const catMap: Record<string, { count: number; totalCost: number }> = {};
    REPAIR_CATEGORIES.forEach((cat) => {
      catMap[cat] = { count: 0, totalCost: 0 };
    });

    repairClaims.forEach((c) => {
      const cat = c.damageCategory || 'Lainnya';
      if (!catMap[cat]) {
        catMap[cat] = { count: 0, totalCost: 0 };
      }
      catMap[cat].count += 1;
      if (isRealized(c)) {
        catMap[cat].totalCost += c.totalCost || 0;
      }
    });

    const rankedCategories = Object.entries(catMap)
      .map(([name, data]) => ({
        name,
        count: data.count,
        totalCost: data.totalCost,
        percentage: totalClaimsCount > 0 ? Math.round((data.count / totalClaimsCount) * 100) : 0,
      }))
      .sort((a, b) => b.count - a.count || b.totalCost - a.totalCost);

    const hasAnyClaim = rankedCategories.some((c) => c.count > 0);
    const topCategory = hasAnyClaim ? rankedCategories[0] : null;

    // Status Garansi Distribution
    const withinCount = repairClaims.filter(
      (c) => checkWarrantyStatus(c.purchaseDate, c.claimDate).isWithinWarranty
    ).length;
    const outsideCount = totalClaimsCount - withinCount;

    // Kartu Kesehatan Armada Showroom HR MOTOR
    const fleetHealth = calculateFleetHealth(claimRatioPercentage);

    return {
      totalClaimsCount,
      totalCostSelectedMonth,
      claimsForSelectedMonthCount: claimsForSelectedMonth.length,
      grandTotalCost,
      totalUniqueCustomers,
      totalCarSales,
      claimRatioPercentage,
      fleetHealth,
      totalUniqueUnits,
      avgPerbaikanPerUnit,
      rankedUnits,
      rankedCategories,
      topCategory,
      withinCount,
      outsideCount,
    };
  }, [repairClaims, purchases, customers, selectedMonth, selectedYear]);


  // Monthly Timeline Trend Data
  const monthlyTimelineData = useMemo(() => {
    const groups: Record<
      string,
      {
        monthKey: string;
        monthLabel: string;
        totalClaims: number;
        totalCost: number;
        customers: Set<string>;
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
          totalCost: 0,
          customers: new Set(),
        };
      }
      groups[key].totalClaims += 1;
      if (claim.status !== 'Dibatalkan') {
        groups[key].totalCost += claim.totalCost || 0;
      }
      groups[key].customers.add((claim.customerPhone || claim.customerName).trim().toLowerCase());
    });

    return Object.values(groups)
      .map((g) => ({
        ...g,
        customerCount: g.customers.size,
        'Biaya Garansi Showroom': g.totalCost,
      }))
      .sort((a, b) => a.monthKey.localeCompare(b.monthKey));
  }, [repairClaims]);

  // Filtered Claims for Table
  const filteredClaims = useMemo(() => {
    return repairClaims.filter((claim) => {
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        claim.customerName.toLowerCase().includes(q) ||
        claim.customerPhone.includes(q) ||
        claim.vehicleBrand.toLowerCase().includes(q) ||
        claim.vehicleModel.toLowerCase().includes(q) ||
        (claim.plateNumber && claim.plateNumber.toLowerCase().includes(q)) ||
        (claim.claimNumber && claim.claimNumber.toLowerCase().includes(q)) ||
        (claim.complaintOrDamage && claim.complaintOrDamage.toLowerCase().includes(q)) ||
        (claim.complaint && claim.complaint.toLowerCase().includes(q)) ||
        (claim.partsToRepair && claim.partsToRepair.toLowerCase().includes(q)) ||
        (claim.workshop && claim.workshop.toLowerCase().includes(q));

      const matchCategory =
        categoryFilter === 'Semua' || claim.damageCategory === categoryFilter;

      const wStatus = checkWarrantyStatus(claim.purchaseDate, claim.claimDate).statusLabel;
      const matchWarranty = warrantyFilter === 'Semua' || wStatus === warrantyFilter;

      const claimDate = claim.claimDate || claim.createdAt;
      const claimYear = claimDate.slice(0, 4);
      const claimMonth = claimDate.slice(5, 7);

      const matchYear = tableYearFilter === 'Semua' || claimYear === tableYearFilter;
      const matchMonth = tableMonthFilter === 'Semua' || claimMonth === tableMonthFilter;

      const matchCustomer =
        customerFilter === 'Semua' ||
        claim.customerPhone === customerFilter ||
        claim.customerName.toLowerCase() === customerFilter.toLowerCase();

      const matchStatus = statusFilter === 'Semua' || (claim.status || 'Selesai') === statusFilter;

      return matchSearch && matchCategory && matchWarranty && matchYear && matchMonth && matchCustomer && matchStatus;
    });
  }, [
    repairClaims,
    searchQuery,
    categoryFilter,
    warrantyFilter,
    statusFilter,
    tableYearFilter,
    tableMonthFilter,
    customerFilter,
  ]);


  // Handle Customer Selection in Add Form (Auto-fill)
  const handleSelectCustomerPurchase = (key: string) => {
    if (!key) {
      setFormData((prev) => ({
        ...prev,
        selectedPurchaseKey: '',
        customerId: '',
        customerName: '',
        customerPhone: '',
        vehicleBrand: 'Toyota',
        vehicleModel: '',
        vehicleYear: 2021,
        plateNumber: '',
        purchaseDate: '',
      }));
      return;
    }

    const selected = purchaseCustomersList.find((p) => p.key === key);
    if (!selected) return;

    setFormData((prev) => ({
      ...prev,
      selectedPurchaseKey: key,
      isManualMode: false,
      customerId: selected.customerId,
      customerName: selected.customerName,
      customerPhone: selected.customerPhone || prev.customerPhone,
      vehicleBrand: selected.vehicleBrand,
      vehicleModel: selected.vehicleModel,
      vehicleYear: selected.vehicleYear,
      plateNumber: selected.plateNumber !== '-' ? selected.plateNumber : '',
      purchaseDate: selected.purchaseDate,
    }));
  };

  // Submit Add Form
  const handleSubmitAdd = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.customerName.trim() || !formData.customerPhone.trim() || !formData.vehicleModel.trim()) {
      alert('Mohon lengkapi Nama Pelanggan, Nomor WhatsApp, dan Model Unit Kendaraan.');
      return;
    }

    const cost = parseRupiahInput(formData.repairCost);
    const finalWorkshop =
      formData.workshop === 'Lainnya'
        ? formData.customWorkshop.trim() || 'Bengkel Rekanan HR MOTOR'
        : formData.workshop;

    let maxNum = 0;
    repairClaims.forEach((c) => {
      const match = (c.claimNumber || c.id || '').match(/(\d+)$/);
      if (match) {
        const num = parseInt(match[1], 10);
        if (!isNaN(num) && num > maxNum) maxNum = num;
      }
    });
    const nextSeq = Math.max(maxNum + 1, repairClaims.length + 1);
    const ticketNo = `GRS-2026-${String(nextSeq).padStart(3, '0')}`;

    const newPayload: Partial<RepairClaim> = {
      claimNumber: ticketNo,
      customerId: formData.customerId || undefined,
      customerName: formData.customerName.trim(),
      customerPhone: formData.customerPhone.trim(),
      vehicleBrand: formData.vehicleBrand,
      vehicleModel: formData.vehicleModel.trim(),
      vehicleYear: Number(formData.vehicleYear) || 2021,
      plateNumber: formData.plateNumber.trim().toUpperCase() || undefined,
      workshop: finalWorkshop,
      purchaseDate: formData.purchaseDate || undefined,
      claimDate: formData.claimDate || new Date().toISOString().split('T')[0],
      claimType: 'Garansi',
      damageCategory: formData.damageCategory,
      complaintOrDamage: formData.complaintOrDamage.trim(),
      complaint: formData.complaintOrDamage.trim(),
      partsToRepair: formData.partsToRepair.trim(),
      damagedParts: formData.partsToRepair.trim(),
      repairActionDescription:
        formData.repairActionDescription.trim() ||
        `Perbaikan ${formData.partsToRepair.trim() || formData.damageCategory} garansi gratis showroom HR MOTOR`,
      actionTaken:
        formData.repairActionDescription.trim() ||
        `Perbaikan ${formData.partsToRepair.trim() || formData.damageCategory} garansi gratis showroom HR MOTOR`,
      sparepartCost: cost,
      serviceCost: 0,
      totalCost: cost,
      status: formData.status || 'Selesai',
      notes: formData.notes.trim() || 'Garansi Perbaikan Gratis (< 1 Bulan) HR MOTOR Garut',
      completedDate: formData.claimDate,
    };

    const res = await addRepairClaim(newPayload);

    if (res.success) {
      if (formData.saveNewCustomer && !formData.customerId) {
        await addCustomer({
          fullName: formData.customerName.trim(),
          whatsapp: formData.customerPhone.trim(),
          address: 'Garut, Jawa Barat',
          district: 'Garut Kota',
          source: 'Walk-in',
          interestedVehicle: `${formData.vehicleBrand} ${formData.vehicleModel}`,
          plateNumber: formData.plateNumber.trim().toUpperCase() || undefined,
          vehicleType: 'MPV',
          budget: cost,
          status: 'Sudah Beli',
          receiptDate: formData.purchaseDate || formData.claimDate,
          notes: `Konsumen Klaim Garansi Perbaikan (${ticketNo})`,
        });
      }

      setIsAddModalOpen(false);
      triggerSuccess(`Klaim garansi perbaikan berhasil dicatat dengan tiket: ${ticketNo}`);

      // Reset form
      setFormData({
        selectedPurchaseKey: '',
        isManualMode: false,
        customerId: '',
        customerName: '',
        customerPhone: '',
        vehicleBrand: 'Toyota',
        vehicleModel: '',
        vehicleYear: 2021,
        plateNumber: '',
        purchaseDate: '',
        claimDate: new Date().toISOString().split('T')[0],
        damageCategory: 'Mesin',
        complaintOrDamage: '',
        partsToRepair: '',
        workshop: 'Bengkel Garut Motor Mandiri (Rujukan HR MOTOR)',
        customWorkshop: '',
        repairCost: 0,
        repairActionDescription: '',
        status: 'Selesai',
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
      plateNumber: claim.plateNumber || '',
      purchaseDate: claim.purchaseDate || '',
      claimDate: claim.claimDate,
      claimType: claim.claimType,
      damageCategory: claim.damageCategory,
      complaintOrDamage: claim.complaintOrDamage || claim.complaint || '',
      partsToRepair: claim.partsToRepair || claim.damagedParts || '',
      workshop: claim.workshop || 'Bengkel Garut Motor Mandiri (Rujukan HR MOTOR)',
      repairActionDescription: claim.repairActionDescription || claim.actionTaken || '',
      repairCost: claim.totalCost || 0,
      status: claim.status || 'Selesai',
      notes: claim.notes || '',
    });
    setIsEditModalOpen(true);
  };

  // Submit Edit Form
  const handleSubmitEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editFormData) return;

    const cost = parseRupiahInput(editFormData.repairCost);

    const res = await updateRepairClaim({
      id: editFormData.id,
      customerName: editFormData.customerName.trim(),
      customerPhone: editFormData.customerPhone.trim(),
      vehicleBrand: editFormData.vehicleBrand,
      vehicleModel: editFormData.vehicleModel.trim(),
      vehicleYear: Number(editFormData.vehicleYear),
      plateNumber: editFormData.plateNumber.trim().toUpperCase() || undefined,
      purchaseDate: editFormData.purchaseDate || undefined,
      claimDate: editFormData.claimDate,
      claimType: editFormData.claimType,
      damageCategory: editFormData.damageCategory,
      complaintOrDamage: editFormData.complaintOrDamage.trim(),
      complaint: editFormData.complaintOrDamage.trim(),
      partsToRepair: editFormData.partsToRepair.trim(),
      damagedParts: editFormData.partsToRepair.trim(),
      workshop: editFormData.workshop.trim(),
      repairActionDescription: editFormData.repairActionDescription.trim(),
      actionTaken: editFormData.repairActionDescription.trim(),
      sparepartCost: cost,
      serviceCost: 0,
      totalCost: cost,
      status: editFormData.status || 'Selesai',
      notes: editFormData.notes.trim() || undefined,
      completedDate: editFormData.claimDate,
    });


    if (res.success) {
      setIsEditModalOpen(false);
      triggerSuccess(`Data garansi tiket ${editFormData.claimNumber} berhasil diperbarui.`);
      if (selectedClaim && selectedClaim.id === editFormData.id) {
        setSelectedClaim({
          ...selectedClaim,
          ...editFormData,
          totalCost: cost,
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
      triggerSuccess('Data klaim garansi berhasil dihapus.');
    } else {
      alert(`Gagal menghapus: ${res.error || 'Terjadi kesalahan'}`);
    }
  };

  // Export to Excel Function (10 Columns)
  const handleExportExcel = () => {
    if (filteredClaims.length === 0) {
      alert('Tidak ada data klaim garansi untuk diekspor ke Excel.');
      return;
    }

    const dataToExport = filteredClaims.map((c, idx) => {
      const wInfo = checkWarrantyStatus(c.purchaseDate, c.claimDate);
      return {
        No: idx + 1,
        'No Tiket Garansi': c.claimNumber || c.id,
        'Tanggal Klaim': c.claimDate,
        'Nama Pelanggan': c.customerName,
        'Nomor WhatsApp': c.customerPhone,
        'Unit Mobil': `${c.vehicleBrand} ${c.vehicleModel} (${c.vehicleYear})`,
        'No. Polisi (Plat)': c.plateNumber || '-',
        'Tanggal Pembelian': c.purchaseDate || '-',
        'Kategori Perbaikan': c.damageCategory,
        'Keluhan Perbaikan': c.complaintOrDamage || c.complaint || '-',
        'Bagian yang Diperbaiki': c.partsToRepair || c.damagedParts || '-',
        'Bengkel Rekanan Rujukan': c.workshop || 'Bengkel Rekanan HR MOTOR Garut',
        'Biaya Perbaikan (Rp)': c.totalCost,
        'Status Garansi': wInfo.badgeLabel,
        'Keterangan Durasi': wInfo.notes,
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Garansi Perbaikan HR MOTOR');

    const maxProps = Object.keys(dataToExport[0] || {}).map((key) => ({
      wch: Math.max(key.length, 14),
    }));
    worksheet['!cols'] = maxProps;

    const filename = `Garansi_Perbaikan_HR_MOTOR_${new Date().toISOString().slice(0, 10)}.xlsx`;
    XLSX.writeFile(workbook, filename);
  };

  // Export to PDF Function
  const handleExportPDF = () => {
    if (filteredClaims.length === 0) {
      alert('Tidak ada data klaim garansi untuk diekspor ke PDF.');
      return;
    }

    const doc = new jsPDF('landscape');

    doc.setFontSize(14);
    doc.setTextColor(26, 26, 26);
    doc.text('HR MOTOR GARUT — REKAPITULASI GARANSI PERBAIKAN SHOWROOM', 14, 15);

    doc.setFontSize(8.5);
    doc.setTextColor(100, 116, 139);
    doc.text(
      `Dicetak pada: ${new Date().toLocaleDateString('id-ID')} | Garansi Perbaikan Gratis (< 1 Bulan Sejak Pembelian)`,
      14,
      21
    );

    const filteredTotalCost = filteredClaims.reduce((acc, c) => acc + (c.totalCost || 0), 0);
    const filteredUniqueCustomers = new Set(
      filteredClaims.map((c) => (c.customerPhone || c.customerName).trim().toLowerCase())
    ).size;

    doc.text(
      `Total Klaim: ${filteredClaims.length} klaim | Total Konsumen: ${filteredUniqueCustomers} orang | Total Biaya: ${formatRupiah(filteredTotalCost)} (100% Ditanggung HR MOTOR)`,
      14,
      26
    );

    const tableHeaders = [
      ['No', 'Tiket & Tgl', 'Pelanggan & WA', 'Mobil & Plat', 'Kategori', 'Keluhan', 'Bagian Diperbaiki', 'Bengkel Rekanan', 'Biaya', 'Status Garansi', 'Status Perbaikan'],
    ];

    const tableRows = filteredClaims.map((c, idx) => {
      const wInfo = checkWarrantyStatus(c.purchaseDate, c.claimDate);
      return [
        idx + 1,
        `${c.claimNumber || c.id}\n${c.claimDate}`,
        `${c.customerName}\n${c.customerPhone}`,
        `${c.vehicleBrand} ${c.vehicleModel}\n[${c.plateNumber || '-'}]`,
        c.damageCategory,
        (c.complaintOrDamage || c.complaint || '-').slice(0, 28),
        (c.partsToRepair || c.damagedParts || '-').slice(0, 24),
        (c.workshop || 'Bengkel Rekanan').slice(0, 24),
        formatRupiah(c.totalCost),
        wInfo.badgeLabel,
        c.status || 'Selesai',
      ];
    });

    autoTable(doc, {
      head: tableHeaders,
      body: tableRows,
      startY: 30,
      theme: 'grid',
      styles: { fontSize: 7, cellPadding: 2 },
      headStyles: { fillColor: [28, 28, 28], textColor: [255, 255, 255], fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [248, 247, 244] },
    });

    doc.save(`Garansi_Perbaikan_HR_MOTOR_${new Date().toISOString().slice(0, 10)}.pdf`);
  };

  // Cetak SPK Garansi HR MOTOR (Surat Perintah Kerja Perbaikan Resmi)
  const handlePrintSPK = (claim: RepairClaim) => {
    const doc = new jsPDF('portrait');
    const wInfo = checkWarrantyStatus(claim.purchaseDate, claim.claimDate);

    // Header Showroom Hitam Elegan
    doc.setFillColor(28, 28, 28);
    doc.rect(0, 0, 210, 26, 'F');

    doc.setTextColor(217, 154, 50); // Gold
    doc.setFontSize(15);
    doc.setFont('helvetica', 'bold');
    doc.text('HR MOTOR GARUT', 14, 11);

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text('Showroom Mobil Bekas Berkualitas & Bergaransi Resmi Garut', 14, 17);
    doc.text('Jl. Raya Garut - Samarang, Tarogong Kidul, Garut | WhatsApp: 0812-2345-0001', 14, 22);

    // Title SPK
    doc.setTextColor(28, 28, 28);
    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.text('SURAT PERINTAH KERJA (SPK) PERBAIKAN GARANSI', 14, 35);

    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text(`Nomor Tiket: ${claim.claimNumber || claim.id}`, 14, 41);
    doc.text(`Tanggal SPK: ${formatDate(claim.claimDate)}`, 130, 41);

    // Subtitle Jaminan Garansi Showroom
    doc.setFillColor(248, 247, 244);
    doc.roundedRect(14, 46, 182, 10, 2, 2, 'F');
    doc.setTextColor(26, 26, 26);
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'bold');
    doc.text(
      'JAMINAN GARANSI SHOWROOM: 100% BIAYA PERBAIKAN DITANGGUNG HR MOTOR GARUT (GRATIS KONSUMEN)',
      18,
      52
    );

    // Table 1: Informasi Konsumen & Unit Kendaraan
    autoTable(doc, {
      startY: 59,
      theme: 'grid',
      head: [['INFORMASI KONSUMEN & KENDARAAN', 'DETAIL DATA']],
      body: [
        ['Nama Pelanggan', claim.customerName],
        ['Nomor WhatsApp / HP', claim.customerPhone],
        ['Unit Kendaraan', `${claim.vehicleBrand} ${claim.vehicleModel} (${claim.vehicleYear})`],
        ['Nomor Polisi (Plat)', claim.plateNumber || '-'],
        ['Tanggal Pembelian Mobil', claim.purchaseDate ? formatDate(claim.purchaseDate) : '-'],
        ['Status Garansi Showroom', `${wInfo.badgeLabel} — ${wInfo.notes}`],
      ],
      styles: { fontSize: 8, cellPadding: 2.5 },
      headStyles: { fillColor: [28, 28, 28], textColor: [255, 255, 255], fontStyle: 'bold' },
      columnStyles: {
        0: { cellWidth: 65, fontStyle: 'bold', fillColor: [248, 248, 248] },
        1: { cellWidth: 117 },
      },
    });

    const afterT1Y = (doc as any).lastAutoTable.finalY + 5;

    // Table 2: Rincian Perbaikan & Rujukan Bengkel
    autoTable(doc, {
      startY: afterT1Y,
      theme: 'grid',
      head: [['RINCIAN PERBAIKAN GARANSI', 'KETERANGAN']],
      body: [
        ['Bengkel Rekanan Rujukan', claim.workshop || 'Bengkel Rekanan HR MOTOR Garut'],
        ['Kategori Perbaikan', claim.damageCategory],
        ['Keluhan Konsumen', claim.complaintOrDamage || claim.complaint || '-'],
        ['Bagian / Komponen Diperbaiki', claim.partsToRepair || claim.damagedParts || '-'],
        ['Tindakan Perbaikan Teknisi', claim.repairActionDescription || claim.actionTaken || '-'],
        ['Status Pengerjaan', claim.status || 'Selesai'],
      ],
      styles: { fontSize: 8, cellPadding: 2.5 },
      headStyles: { fillColor: [28, 28, 28], textColor: [255, 255, 255], fontStyle: 'bold' },
      columnStyles: {
        0: { cellWidth: 65, fontStyle: 'bold', fillColor: [248, 248, 248] },
        1: { cellWidth: 117 },
      },
    });

    const afterT2Y = (doc as any).lastAutoTable.finalY + 5;

    // Table 3: Rincian Biaya Garansi
    autoTable(doc, {
      startY: afterT2Y,
      theme: 'grid',
      head: [['RINCIAN BIAYA PERBAIKAN', 'NOMINAL (RP)']],
      body: [
        ['Beban Biaya Konsumen', 'Rp 0 (GRATIS / 100% FREE)'],
        ['Total Tagihan Bengkel Rekanan', formatRupiah(claim.totalCost)],
        ['Penanggung Beban Biaya', '100% Ditanggung Pihak Showroom HR MOTOR Garut'],
      ],
      styles: { fontSize: 8, cellPadding: 2.5 },
      headStyles: { fillColor: [28, 28, 28], textColor: [255, 255, 255], fontStyle: 'bold' },
      columnStyles: {
        0: { cellWidth: 65, fontStyle: 'bold', fillColor: [248, 248, 248] },
        1: { cellWidth: 117, fontStyle: 'bold' },
      },
    });

    const afterT3Y = (doc as any).lastAutoTable?.finalY ? (doc as any).lastAutoTable.finalY + 12 : 200;

    // Signature section
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(60, 60, 60);

    let signY = afterT3Y;
    if (afterT3Y + 32 > 285) {
      doc.addPage();
      signY = 30;
    }

    doc.text('Konsumen / Pemilik Unit,', 20, signY);
    doc.text('(_______________________)', 20, signY + 22);
    doc.text(claim.customerName, 20, signY + 27);

    doc.text('Bengkel Rekanan Rujukan,', 85, signY);
    doc.text('(_______________________)', 85, signY + 22);
    doc.text('Cap & Tanda Tangan Bengkel', 85, signY + 27);

    doc.text('Showroom HR MOTOR Garut,', 150, signY);
    doc.text('(_______________________)', 150, signY + 22);
    doc.text('Owner / CRM HR MOTOR', 150, signY + 27);

    doc.save(`SPK_Garansi_${claim.claimNumber || claim.id}.pdf`);
  };

  // WhatsApp Message Generator
  const generateWhatsAppMessage = (claim: RepairClaim) => {
    const carName = `${claim.vehicleBrand} ${claim.vehicleModel} (${claim.vehicleYear})`;
    const plate = claim.plateNumber ? ` [${claim.plateNumber}]` : '';
    const ticketNo = claim.claimNumber || claim.id;
    const wCheck = checkWarrantyStatus(claim.purchaseDate, claim.claimDate);
    const workshopName = claim.workshop || 'Bengkel Rujukan Resmi HR MOTOR Garut';

    const text =
      `Sampurasun Bapak/Ibu *${claim.customerName}*,\n\n` +
      `Salam hormat dari *HR MOTOR Garut*.\n\n` +
      `Berikut konfirmasi pelayanan *Garansi Perbaikan Gratis (< 1 Bulan)* showroom HR MOTOR untuk unit mobil Anda:\n\n` +
      `• No. Tiket Garansi: *${ticketNo}*\n` +
      `• Unit Mobil: *${carName}${plate}*\n` +
      `• Tanggal Beli: *${claim.purchaseDate ? formatDate(claim.purchaseDate) : '-'}*\n` +
      `• Tanggal Klaim: *${formatDate(claim.claimDate)}*\n` +
      `• Status Garansi: *${wCheck.badgeLabel}* (${wCheck.isWithinWarranty ? '100% GRATIS Showroom' : 'Layanan Khusus'})\n` +
      `• Bengkel Rekanan Rujukan: *${workshopName}*\n` +
      `• Kategori Perbaikan: *${claim.damageCategory}*\n` +
      `• Keluhan: ${claim.complaintOrDamage || claim.complaint || '-'}\n` +
      `• Bagian yang Diperbaiki: ${claim.partsToRepair || claim.damagedParts || '-'}\n` +
      `• Total Biaya: *${formatRupiah(claim.totalCost)}* (*100% Beban HR MOTOR*)\n\n` +
      `Unit mobil telah diservis dengan standar kualitas terbaik agar siap digunakan kembali dalam kondisi prima. Terima kasih telah mempercayakan pembelian mobil di HR MOTOR Garut.\n\n` +
      `*HR MOTOR GARUT*\n_Showroom Mobil Bekas Berkualitas & Bergaransi_`;

    return formatWhatsAppLink(claim.customerPhone, text);
  };

  return (
    <div className="space-y-6 max-w-full overflow-hidden">
      {/* Top Banner & Header */}
      <div className="crm-card p-4 sm:p-6 border-b-2 border-b-gold-500/40">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="badge-gold flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                Garansi Resmi Showroom
              </span>
              <span className="text-xs text-charcoal-300">•</span>
              <span className="text-xs text-emerald-700 font-bold tracking-wide bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                Gratis Perbaikan &lt; 1 Bulan Pembelian
              </span>
              <span className="text-xs text-charcoal-300">•</span>
              <span className="text-xs text-charcoal-500">Bengkel Rujukan HR MOTOR Garut</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-charcoal-900 mt-1.5 tracking-tight flex items-center gap-2.5">
              <ShieldCheck className="w-6 h-6 text-gold-600 shrink-0" />
              <span>Garansi Perbaikan HR MOTOR</span>
            </h1>
            <p className="text-xs sm:text-sm text-charcoal-500 mt-1 max-w-3xl leading-relaxed">
              Pelanggan yang membeli mobil di HR MOTOR berhak mendapatkan <strong>Garansi Perbaikan Gratis (&lt; 1 Bulan)</strong> ke bengkel rekanan rujukan jika mobil mengalami masalah sebelum 30 hari sejak tanggal pembelian.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 flex-wrap w-full lg:w-auto shrink-0">
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="btn-gold flex items-center justify-center gap-2 w-full sm:w-auto shadow-md"
            >
              <Plus className="w-4 h-4" />
              <span>+ Catat Klaim Garansi</span>
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
        <div className="flex items-center justify-between p-3.5 text-xs text-emerald-900 bg-emerald-50 border border-emerald-300 rounded-xl animate-in fade-in duration-200">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-semibold">{actionSuccess}</span>
          </div>
          <button onClick={() => setActionSuccess(null)} className="text-emerald-700 hover:text-emerald-900">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4 METRIK UTAMA DASHBOARD GARANSI                                         */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* 1. Total Uang Perbaikan Selama Satu Bulan */}
        <div className="crm-card p-4 bg-gradient-to-br from-white to-[#FAF9F5] border-gold-500/40 relative">
          <div className="flex items-center justify-between text-charcoal-600 mb-1 gap-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-gold-700 flex items-center gap-1 shrink-0">
              <DollarSign className="w-3.5 h-3.5 text-gold-600" />
              Biaya 1 Bulan
            </span>
            {/* Quick Month & Year Selector */}
            <div className="flex items-center gap-1">
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="text-[10px] font-bold py-0.5 px-1 bg-white border border-gold-300 rounded text-charcoal-800 focus:outline-none cursor-pointer"
                title="Pilih Bulan untuk Metrik Biaya 1 Bulan"
              >
                <option value="ALL">Semua</option>
                {MONTH_NAMES.map((name, idx) => {
                  const val = String(idx + 1).padStart(2, '0');
                  return (
                    <option key={val} value={val}>
                      {name.slice(0, 3)}
                    </option>
                  );
                })}
              </select>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="text-[10px] font-bold py-0.5 px-1 bg-white border border-gold-300 rounded text-charcoal-800 focus:outline-none cursor-pointer"
                title="Pilih Tahun untuk Metrik Biaya 1 Bulan"
              >
                <option value="2026">2026</option>
                <option value="2025">2025</option>
                <option value="2024">2024</option>
              </select>
            </div>
          </div>

          <div className="text-base sm:text-lg font-black text-charcoal-900 truncate" title={formatRupiah(warrantyMetrics.totalCostSelectedMonth)}>
            {formatRupiah(warrantyMetrics.totalCostSelectedMonth)}
          </div>

          <div className="flex items-center justify-between text-[10px] text-charcoal-500 mt-1">
            <span className="font-medium truncate">
              {selectedMonth === 'ALL'
                ? `Tahun ${selectedYear}`
                : `Bulan ${MONTH_NAMES[parseInt(selectedMonth, 10) - 1] || selectedMonth} ${selectedYear}`}
              {warrantyMetrics.claimsForSelectedMonthCount > 0 ? ` (${warrantyMetrics.claimsForSelectedMonthCount} klaim)` : ''}
            </span>
            <button
              type="button"
              onClick={() => {
                setTableYearFilter(selectedYear);
                setTableMonthFilter(selectedMonth === 'ALL' ? 'Semua' : selectedMonth);
              }}
              className="text-gold-700 hover:text-gold-900 font-bold underline shrink-0 ml-1"
              title="Terapkan filter bulan ini ke tabel"
            >
              Lihat Tabel →
            </button>
          </div>
        </div>

        {/* 2. Persentase Pelanggan Garansi dari Semua Penjualan */}
        <div className="crm-card p-4">
          <div className="flex items-center justify-between text-charcoal-400 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-charcoal-600 flex items-center gap-1">
              <Percent className="w-3.5 h-3.5 text-emerald-600" />
              % Rasio Klaim
            </span>
            <span className="text-[10px] font-bold px-1.5 py-0.5 bg-emerald-50 text-emerald-700 rounded border border-emerald-200">
              Penjualan
            </span>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-xl font-black text-emerald-700">{warrantyMetrics.claimRatioPercentage}%</span>
            <span className="text-[11px] text-charcoal-400 font-medium">dari total unit</span>
          </div>
          <p className="text-[10px] text-charcoal-400 mt-1 truncate" title={`${warrantyMetrics.totalUniqueCustomers} dari total ${warrantyMetrics.totalCarSales} mobil terjual`}>
            {warrantyMetrics.totalUniqueCustomers} dari {warrantyMetrics.totalCarSales} unit mobil terjual
          </p>
        </div>

        {/* 4. Berapa Perbaikan Garansi per Unit */}
        <div className="crm-card p-4">
          <div className="flex items-center justify-between text-charcoal-400 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-charcoal-600 flex items-center gap-1">
              <Car className="w-3.5 h-3.5 text-purple-600" />
              Klaim per Unit
            </span>
            <span className="text-[10px] font-bold px-1.5 py-0.5 bg-purple-50 text-purple-700 rounded border border-purple-200">
              Rata-rata
            </span>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-xl font-black text-charcoal-900">{warrantyMetrics.avgPerbaikanPerUnit}x</span>
            <span className="text-xs text-charcoal-500 font-semibold">per mobil</span>
          </div>
          <p className="text-[10px] text-charcoal-500 mt-1 truncate" title={warrantyMetrics.rankedUnits[0] ? `Unit klaim terbanyak: ${warrantyMetrics.rankedUnits[0].brand} ${warrantyMetrics.rankedUnits[0].model} (${warrantyMetrics.rankedUnits[0].claimCount}x)` : undefined}>
            {warrantyMetrics.rankedUnits[0]
              ? `Top: ${warrantyMetrics.rankedUnits[0].brand} ${warrantyMetrics.rankedUnits[0].model} (${warrantyMetrics.rankedUnits[0].claimCount}x)`
              : `${warrantyMetrics.totalClaimsCount} klaim dari ${warrantyMetrics.totalUniqueUnits} mobil`}
          </p>
        </div>

        {/* 5. Perbaikan yang Sering Terjadi di Garansi */}
        <div
          onClick={() => {
            if (warrantyMetrics.topCategory) {
              setCategoryFilter(categoryFilter === warrantyMetrics.topCategory.name ? 'Semua' : warrantyMetrics.topCategory.name);
            }
          }}
          className="crm-card p-4 bg-[#FAF9F5] border-charcoal-300 cursor-pointer hover:border-gold-500 transition-all"
          title="Klik untuk memfilter tabel berdasarkan kategori perbaikan ini"
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-charcoal-700 flex items-center gap-1">
              <Wrench className="w-3.5 h-3.5 text-rose-600" />
              Sering Terjadi
            </span>
            <span className="text-[10px] font-bold px-1.5 py-0.5 bg-rose-50 text-rose-700 rounded border border-rose-200">
              Rank #1
            </span>
          </div>
          <div className="text-base font-black text-charcoal-900 truncate">
            {warrantyMetrics.topCategory ? warrantyMetrics.topCategory.name : 'Belum Ada Klaim'}
          </div>
          {/* Visual progress bar persentase frekuensi */}
          <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden mt-1.5">
            <div
              className="bg-rose-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${warrantyMetrics.topCategory?.percentage || 0}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-[10px] text-charcoal-600 mt-1">
            <span className="font-semibold">
              {warrantyMetrics.topCategory
                ? `${warrantyMetrics.topCategory.count} kasus (${warrantyMetrics.topCategory.percentage}%)`
                : '-'}
            </span>
            {warrantyMetrics.rankedCategories.length > 1 && warrantyMetrics.rankedCategories[1].count > 0 && (
              <span className="text-charcoal-500 truncate ml-1 text-[9px]">
                #2 {warrantyMetrics.rankedCategories[1].name} ({warrantyMetrics.rankedCategories[1].count}x)
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TABEL DATA GARANSI PERBAIKAN                                              */}
      {/* ========================================================================= */}
      <div className="space-y-4">
        {/* Toolbar Pencarian & Filter */}
          <div className="p-3 bg-white border border-slate-200 rounded-xl shadow-xs flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
            {/* Input Pencarian */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Cari nama pelanggan, plat nomor, tiket, unit mobil, atau bengkel..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs text-slate-800 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-gold-500 focus:bg-white"
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
              {/* Filter Kategori Perbaikan */}
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] text-slate-500 font-medium">Kategori:</span>
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="text-xs py-1.5 px-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-700 focus:outline-none focus:ring-1 focus:ring-gold-500"
                >
                  <option value="Semua">Semua Kategori</option>
                  {REPAIR_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              

              {/* Filter Status Perbaikan */}
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] text-slate-500 font-medium">Status:</span>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="text-xs py-1.5 px-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-700 focus:outline-none focus:ring-1 focus:ring-gold-500"
                >
                  <option value="Semua">Semua Status</option>
                  <option value="Selesai">Selesai</option>
                  <option value="Dalam Proses">Dalam Proses</option>
                  <option value="Menunggu">Menunggu</option>
                  <option value="Dibatalkan">Dibatalkan</option>
                </select>
              </div>

              {/* Filter Tahun */}
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] text-slate-500 font-medium">Tahun:</span>
                <select
                  value={tableYearFilter}
                  onChange={(e) => setTableYearFilter(e.target.value)}
                  className="text-xs py-1.5 px-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-700 focus:outline-none focus:ring-1 focus:ring-gold-500"
                >
                  <option value="Semua">Semua Tahun</option>
                  <option value="2026">2026</option>
                  <option value="2025">2025</option>
                </select>
              </div>

              {/* Filter Bulan */}
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] text-slate-500 font-medium">Bulan:</span>
                <select
                  value={tableMonthFilter}
                  onChange={(e) => setTableMonthFilter(e.target.value)}
                  className="text-xs py-1.5 px-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-700 focus:outline-none focus:ring-1 focus:ring-gold-500"
                >
                  <option value="Semua">Semua Bulan</option>
                  {MONTH_NAMES.map((name, idx) => {
                    const val = String(idx + 1).padStart(2, '0');
                    return (
                      <option key={val} value={val}>
                        {name}
                      </option>
                    );
                  })}
                </select>
              </div>

              
            </div>
          </div>

          {/* DESKTOP VIEW: TABEL SPREADSHEET ENTERPRISE (hidden on mobile, visible md+) */}
          <div className="hidden md:block bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
            <div className="overflow-x-auto w-full">
              <table className="w-full min-w-[1150px] text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-600">
                    <th className="py-3 px-3 w-12 text-center">No</th>
                    <th className="py-3 px-3">Tiket &amp; Tanggal</th>
                    <th className="py-3 px-3">Pelanggan &amp; WA</th>
                    <th className="py-3 px-3">Unit Mobil &amp; Plat</th>
                    <th className="py-3 px-3 text-center">Kategori</th>
                    <th className="py-3 px-3">Keluhan Perbaikan</th>
                    <th className="py-3 px-3">Bagian Diperbaiki</th>
                    
                    <th className="py-3 px-3 text-right">Biaya (Rp)</th>
                    
                    <th className="py-3 px-3 text-center">Status Perbaikan</th>
                    <th className="py-3 px-3 text-center w-32">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {filteredClaims.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="py-12 text-center text-slate-500">

                        <ShieldCheck className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                        <p className="font-semibold text-slate-700">Tidak ada klaim garansi perbaikan ditemukan</p>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          Klik tombol &quot;+ Catat Klaim Garansi&quot; untuk mencatat klaim perbaikan garansi gratis pelanggan.
                        </p>
                      </td>
                    </tr>
                  ) : (
                    filteredClaims.map((claim, index) => {
                      const wCheck = checkWarrantyStatus(claim.purchaseDate, claim.claimDate);

                      return (
                        <tr key={claim.id} className="hover:bg-slate-50/80 transition-colors">
                          {/* 1. No */}
                          <td className="py-3 px-3 text-center text-slate-500 font-mono text-[11px]">
                            {index + 1}
                          </td>

                          {/* 2. No Tiket Garansi & Tanggal */}
                          <td className="py-3 px-3 whitespace-nowrap">
                            <div className="font-mono font-bold text-slate-900 text-xs">
                              {claim.claimNumber || claim.id}
                            </div>
                            <div className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5">
                              <Calendar className="w-3 h-3 text-slate-400" />
                              <span>{formatDate(claim.claimDate)}</span>
                            </div>
                          </td>

                          {/* 3. Pelanggan (Nama & WhatsApp) */}
                          <td className="py-3 px-3 whitespace-nowrap">
                            <div className="font-semibold text-slate-900">{claim.customerName}</div>
                            <a
                              href={generateWhatsAppMessage(claim)}
                              target="_blank"
                              rel="noreferrer"
                              className="text-slate-600 hover:text-emerald-600 transition-colors inline-flex items-center gap-1 text-[11px] font-mono mt-0.5"
                              title="Kirim Konfirmasi WhatsApp"
                            >
                              <Phone className="w-3 h-3 text-emerald-600" />
                              <span>{claim.customerPhone}</span>
                            </a>
                          </td>

                          {/* 4. Unit Mobil & No. Polisi (Plat) */}
                          <td className="py-3 px-3 whitespace-nowrap">
                            <div className="font-medium text-slate-900 flex items-center gap-1">
                              <Car className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <span>
                                {claim.vehicleBrand} {claim.vehicleModel} ({claim.vehicleYear})
                              </span>
                            </div>
                            <div className="mt-0.5">
                              {claim.plateNumber ? (
                                <span className="font-mono font-bold text-[10px] px-1.5 py-0.5 bg-slate-100 border border-slate-300 rounded text-slate-800">
                                  {claim.plateNumber}
                                </span>
                              ) : (
                                <span className="text-[10px] text-slate-400 italic">Tanpa Plat</span>
                              )}
                              {claim.purchaseDate && (
                                <span className="text-[10px] text-slate-400 ml-1.5">
                                  Beli: {formatDate(claim.purchaseDate)}
                                </span>
                              )}
                            </div>
                          </td>

                          {/* 5. Kategori Perbaikan */}
                          <td className="py-3 px-3 text-center whitespace-nowrap">
                            <span className="inline-block px-2.5 py-0.5 text-[10px] font-bold rounded-full bg-slate-100 text-slate-800 border border-slate-200">
                              {claim.damageCategory}
                            </span>
                          </td>

                          {/* 6. Keluhan Perbaikan Konsumen */}
                          <td className="py-3 px-3 max-w-[180px]">
                            <p
                              className="line-clamp-2 text-slate-800 text-[11px]"
                              title={claim.complaintOrDamage || claim.complaint}
                            >
                              {claim.complaintOrDamage || claim.complaint || '-'}
                            </p>
                          </td>

                          {/* 7. Bagian yang Diperbaiki */}
                          <td className="py-3 px-3 max-w-[160px]">
                            <p
                              className="line-clamp-2 text-slate-800 font-medium text-[11px]"
                              title={claim.partsToRepair || claim.damagedParts}
                            >
                              {claim.partsToRepair || claim.damagedParts || '-'}
                            </p>
                          </td>

                          

                          {/* 9. Biaya Perbaikan (Rp) */}
                          <td className="py-3 px-3 text-right whitespace-nowrap">
                            <div className="font-extrabold text-slate-900 text-xs">
                              {formatRupiah(claim.totalCost)}
                            </div>
                            <span className="text-[9px] text-emerald-700 font-semibold block">
                              100% Ditanggung HR
                            </span>
                          </td>

                          

                          {/* 11. Status Perbaikan */}
                          <td className="py-3 px-3 text-center whitespace-nowrap">
                            <span
                              className={`inline-block px-2.5 py-0.5 text-[10px] font-bold rounded-full ${
                                claim.status === 'Selesai'
                                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                  : claim.status === 'Dalam Proses'
                                  ? 'bg-amber-100 text-amber-800 border border-amber-200'
                                  : claim.status === 'Menunggu'
                                  ? 'bg-blue-100 text-blue-800 border border-blue-200'
                                  : 'bg-rose-100 text-rose-800 border border-rose-200'
                              }`}
                            >
                              {claim.status || 'Selesai'}
                            </span>
                          </td>

                          {/* 12. Aksi (Detail, Edit, Cetak SPK, Hapus) */}
                          <td className="py-3 px-3 text-center">
                            <div className="flex items-center justify-center gap-1">
                              <button
                                onClick={() => {
                                  setSelectedClaim(claim);
                                  setIsDetailModalOpen(true);
                                }}
                                className="p-1.5 text-slate-600 hover:text-gold-600 hover:bg-slate-100 rounded-md transition-colors"
                                title="Lihat Detail Lengkap SPK"
                              >
                                <Eye className="w-4 h-4" />
                              </button>

                              <button
                                onClick={() => handleOpenEdit(claim)}
                                className="p-1.5 text-slate-600 hover:text-blue-600 hover:bg-slate-100 rounded-md transition-colors"
                                title="Edit Klaim Garansi"
                              >
                                <Edit className="w-4 h-4" />
                              </button>

                              <button
                                onClick={() => handlePrintSPK(claim)}
                                className="p-1.5 text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-md transition-colors"
                                title="Cetak SPK Garansi HR MOTOR"
                              >
                                <Printer className="w-4 h-4 text-emerald-600" />
                              </button>

                              <button
                                onClick={() => setDeleteConfirmId(claim.id)}
                                className="p-1.5 text-slate-600 hover:text-rose-600 hover:bg-slate-100 rounded-md transition-colors"
                                title="Hapus Data Garansi"
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
                Menampilkan <strong>{filteredClaims.length}</strong> dari <strong>{repairClaims.length}</strong> total klaim garansi
              </div>
              <div className="flex items-center gap-3 text-[11px]">
                <span>
                  Total Pengeluaran Showroom:{' '}
                  <strong className="text-gold-700 font-bold">{formatRupiah(warrantyMetrics.grandTotalCost)}</strong>
                </span>
                <span className="text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  100% Ditanggung Dealer HR MOTOR
                </span>
              </div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* MOBILE VIEW: CARD VIEW RAPI TANPA GESER HORIZONTAL (md:hidden)            */}
          {/* ========================================================================= */}
          <div className="block md:hidden space-y-3">
            {filteredClaims.length === 0 ? (
              <div className="p-8 text-center bg-white border border-slate-200 rounded-xl">
                <ShieldCheck className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                <p className="font-semibold text-slate-700 text-sm">Tidak ada klaim garansi</p>
                <p className="text-xs text-slate-400 mt-1">Silakan klik tombol &quot;+ Catat Klaim Garansi&quot;.</p>
              </div>
            ) : (
              filteredClaims.map((claim, index) => {
                const wCheck = checkWarrantyStatus(claim.purchaseDate, claim.claimDate);

                return (
                  <div
                    key={claim.id}
                    className="crm-card p-4 space-y-3 border border-slate-200 shadow-sm"
                  >
                    {/* Top Row: Ticket + Status Badge */}
                    <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-mono font-bold text-xs text-slate-900 bg-slate-100 px-2 py-0.5 rounded">
                          {claim.claimNumber || claim.id}
                        </span>
                        <span className="text-[11px] text-slate-500 font-medium">
                          • {formatDate(claim.claimDate)}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 flex-wrap justify-end">
                        <span
                          className={`inline-block px-2 py-0.5 text-[10px] font-bold rounded-full ${
                            claim.status === 'Selesai'
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                              : claim.status === 'Dalam Proses'
                              ? 'bg-amber-100 text-amber-800 border border-amber-200'
                              : claim.status === 'Menunggu'
                              ? 'bg-blue-100 text-blue-800 border border-blue-200'
                              : 'bg-rose-100 text-rose-800 border border-rose-200'
                          }`}
                        >
                          {claim.status || 'Selesai'}
                        </span>
                        
                      </div>
                    </div>


                    {/* Pelanggan & WhatsApp */}
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <div className="font-bold text-slate-900 text-sm">{claim.customerName}</div>
                        <div className="text-xs text-slate-500 font-mono">{claim.customerPhone}</div>
                      </div>

                      <a
                        href={generateWhatsAppMessage(claim)}
                        target="_blank"
                        rel="noreferrer"
                        className="p-2 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 transition-colors flex items-center gap-1 text-xs font-semibold"
                        title="Kirim WhatsApp"
                      >
                        <MessageCircle className="w-4 h-4 text-emerald-600" />
                        <span>WA</span>
                      </a>
                    </div>

                    {/* Unit Mobil & Plat */}
                    <div className="p-2.5 bg-slate-50 rounded-lg flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5 font-medium text-slate-900">
                        <Car className="w-4 h-4 text-slate-500 shrink-0" />
                        <span>
                          {claim.vehicleBrand} {claim.vehicleModel} ({claim.vehicleYear})
                        </span>
                      </div>
                      {claim.plateNumber ? (
                        <span className="font-mono font-bold text-[10px] px-1.5 py-0.5 bg-white border border-slate-300 rounded text-slate-800">
                          {claim.plateNumber}
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-400 italic">-</span>
                      )}
                    </div>

                    {/* Kategori, Keluhan & Bagian Diperbaiki */}
                    <div className="space-y-1.5 text-xs text-slate-700">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          Kategori:
                        </span>
                        <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-slate-200 text-slate-800">
                          {claim.damageCategory}
                        </span>
                      </div>

                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                          Keluhan:
                        </span>
                        <p className="text-xs text-slate-800 font-medium">
                          {claim.complaintOrDamage || claim.complaint || '-'}
                        </p>
                      </div>

                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                          Bagian Diperbaiki:
                        </span>
                        <p className="text-xs text-slate-800">
                          {claim.partsToRepair || claim.damagedParts || '-'}
                        </p>
                      </div>

                      
                    </div>

                    {/* Biaya & Tombol Aksi */}
                    <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                      <div>
                        <div className="text-[10px] font-semibold text-slate-400 uppercase">
                          Biaya Perbaikan
                        </div>
                        <div className="text-sm font-black text-slate-900 font-mono">
                          {formatRupiah(claim.totalCost)}
                        </div>
                        <div className="text-[9px] text-emerald-700 font-bold">100% Beban HR MOTOR</div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => {
                            setSelectedClaim(claim);
                            setIsDetailModalOpen(true);
                          }}
                          className="px-2.5 py-1.5 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors flex items-center gap-1"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Detail</span>
                        </button>

                        <button
                          onClick={() => handleOpenEdit(claim)}
                          className="px-2.5 py-1.5 text-xs font-semibold bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg transition-colors flex items-center gap-1"
                        >
                          <Edit className="w-3.5 h-3.5" />
                          <span>Edit</span>
                        </button>

                        <button
                          onClick={() => handlePrintSPK(claim)}
                          className="px-2.5 py-1.5 text-xs font-semibold bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-lg transition-colors flex items-center gap-1 border border-emerald-200"
                          title="Cetak SPK"
                        >
                          <Printer className="w-3.5 h-3.5 text-emerald-600" />
                          <span>SPK</span>
                        </button>

                        <button
                          onClick={() => setDeleteConfirmId(claim.id)}
                          className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          title="Hapus"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      

      {/* ========================================================================= */}
      {/* DASHBOARD & VISUALISASI OWNER HR MOTOR                                    */}
      {/* ========================================================================= */}
      <div className="space-y-6">
          {/* Header Periode Laporan */}
          <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-gold-700 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-gold-600" />
                Ringkasan Eksekutif Owner
              </span>
              <h3 className="text-base font-bold text-slate-900 mt-0.5">
                Analitik &amp; Visualisasi Garansi Perbaikan Showroom HR MOTOR
              </h3>
              <p className="text-xs text-slate-500">
                Pemantauan frekuensi klaim per unit mobil, kategori perbaikan paling sering terjadi, dan kontrol biaya showroom.
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={handleExportExcel}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-800 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors"
              >
                <FileSpreadsheet className="w-4 h-4 text-gold-600" />
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

          {/* VISUALISASI GRAFIK 1 & 2: Kategori Perbaikan yang Sering Terjadi */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Visualisasi 1: Bar Chart Frekuensi & Biaya per Kategori Perbaikan */}
            <div className="lg:col-span-2 p-4 bg-white border border-slate-200 rounded-xl shadow-xs min-w-0">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h4 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                    <BarChart3 className="w-4 h-4 text-gold-600" />
                    Perbaikan yang Sering Terjadi di Garansi (Kasus &amp; Biaya)
                  </h4>
                  <p className="text-xs text-slate-500">
                    Ranking kategori perbaikan garansi gratis showroom HR MOTOR Garut
                  </p>
                </div>
                <TrendingUp className="w-4 h-4 text-emerald-600" />
              </div>

              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={warrantyMetrics.rankedCategories}
                    margin={{ top: 10, right: 10, left: -15, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis
                      dataKey="name"
                      tick={{ fontSize: 10, fill: '#64748b' }}
                      interval={0}
                      angle={-15}
                      textAnchor="end"
                      height={40}
                    />
                    <YAxis tick={{ fontSize: 10, fill: '#64748b' }} allowDecimals={false} />
                    <Tooltip
                      formatter={(val: any, name: any) => [
                        name === 'Jumlah Kasus' ? `${val} kasus` : formatRupiah(Number(val)),
                        name,
                      ]}
                    />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Bar dataKey="count" name="Jumlah Kasus" fill="#D99A32" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Visualisasi 2: Donut Chart Proporsi Kategori Kerusakan */}
            <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-xs min-w-0">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h4 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                    <PieChartIcon className="w-4 h-4 text-blue-600" />
                    Distribusi Kategori
                  </h4>
                  <p className="text-xs text-slate-500">Komposisi kerusakan garansi</p>
                </div>
              </div>

              {warrantyMetrics.rankedCategories.every((c) => c.count === 0) ? (
                <div className="h-52 flex flex-col items-center justify-center text-slate-400 text-xs">
                  <PieChartIcon className="w-8 h-8 text-slate-300 mb-1" />
                  <span>Belum ada data klaim perbaikan</span>
                </div>
              ) : (
                <div className="h-52 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={warrantyMetrics.rankedCategories.filter((c) => c.count > 0)}
                        cx="50%"
                        cy="50%"
                        innerRadius={45}
                        outerRadius={75}
                        paddingAngle={3}
                        dataKey="count"
                      >
                        {warrantyMetrics.rankedCategories
                          .filter((c) => c.count > 0)
                          .map((entry, index) => (
                            <Cell
                              key={`cell-${entry.name}`}
                              fill={PIE_COLORS[index % PIE_COLORS.length]}
                            />
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
              )}

              <div className="space-y-1 mt-1 text-[11px] max-h-28 overflow-y-auto divide-y divide-slate-100">
                {warrantyMetrics.rankedCategories.map((item, idx) => (
                  <div key={item.name} className="flex items-center justify-between py-1">
                    <div className="flex items-center gap-1.5">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: PIE_COLORS[idx % PIE_COLORS.length] }}
                      />
                      <span className="font-semibold text-slate-800">{item.name}</span>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-slate-900">{item.count} kasus</span>
                      <span className="text-[10px] text-slate-400 ml-1">({item.percentage}%)</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* DAFTAR PERBAIKAN GARANSI PER UNIT MOBIL (Permintaan Pengguna: Berapa Perbaikan Garansi per Unit) */}
          <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
              <div>
                <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Car className="w-4 h-4 text-purple-600" />
                  Daftar Unit Mobil &amp; Frekuensi Perbaikan Garansi per Unit
                </h4>
                <p className="text-xs text-slate-500">
                  Rata-rata klaim garansi: <strong>{warrantyMetrics.avgPerbaikanPerUnit}x per unit</strong> • Daftar unit mobil dengan klaim garansi terbanyak
                </p>
              </div>
              <span className="px-2.5 py-1 text-xs font-semibold text-purple-800 bg-purple-50 rounded-md border border-purple-200">
                {warrantyMetrics.totalUniqueUnits} Unit Pernah Diservis
              </span>
            </div>

            <div className="overflow-x-auto w-full">
              <table className="w-full min-w-[700px] text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-600">
                    <th className="py-3 px-4">Peringkat</th>
                    <th className="py-3 px-4">Pelanggan &amp; WhatsApp</th>
                    <th className="py-3 px-4">Unit Kendaraan</th>
                    <th className="py-3 px-4">No. Polisi (Plat)</th>
                    <th className="py-3 px-4 text-center">Frekuensi Klaim</th>
                    <th className="py-3 px-4">Kerusakan Paling Umum</th>
                    <th className="py-3 px-4 text-right font-bold text-slate-800">Total Biaya Garansi Showroom</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {warrantyMetrics.rankedUnits.map((unit, idx) => (
                    <tr key={unit.unitKey} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-4 font-bold text-slate-500">#{idx + 1}</td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900">{unit.customerName || '-'}</div>
                        {unit.customerPhone && (
                          <div className="text-[10px] text-slate-500 font-mono">{unit.customerPhone}</div>
                        )}
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-900">
                        {unit.brand} {unit.model} ({unit.year})
                      </td>
                      <td className="py-3 px-4">
                        {unit.plateNumber !== '-' ? (
                          <span className="font-mono font-bold text-[10px] px-1.5 py-0.5 bg-slate-100 border border-slate-300 rounded text-slate-800">
                            {unit.plateNumber}
                          </span>
                        ) : (
                          <span className="text-slate-400 italic text-[11px]">-</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`px-2 py-0.5 text-[11px] font-bold rounded-full ${
                            unit.claimCount > 1
                              ? 'bg-amber-100 text-amber-900 font-extrabold'
                              : 'bg-slate-100 text-slate-800'
                          }`}
                        >
                          {unit.claimCount}x perbaikan
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 text-[10px] font-semibold bg-slate-100 text-slate-700 rounded">
                          {unit.topCategory}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-black text-slate-900">
                        {formatRupiah(unit.totalCost)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Tren Pengeluaran Garansi Showroom dari Bulan ke Bulan */}
          <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-gold-600" />
                  Tren Pengeluaran Garansi Showroom HR MOTOR (Bulan ke Bulan)
                </h4>
                <p className="text-xs text-slate-500">
                  Akumulasi beban biaya perbaikan gratis showroom yang direalisasikan setiap bulan
                </p>
              </div>
              <span className="px-2.5 py-1 text-xs font-semibold text-slate-700 bg-slate-100 rounded-md">
                {monthlyTimelineData.length} Bulan Aktif
              </span>
            </div>

            <div className="overflow-x-auto w-full">
              <table className="w-full min-w-[650px] text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-600">
                    <th className="py-3 px-4">Bulan &amp; Tahun</th>
                    <th className="py-3 px-4 text-center">Jumlah Klaim</th>
                    <th className="py-3 px-4 text-center">Pelanggan Unik</th>
                    <th className="py-3 px-4 text-right font-bold text-slate-900">Total Biaya Ditanggung Showroom</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {monthlyTimelineData.map((m) => (
                    <tr key={m.monthKey} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-4 font-semibold text-slate-900">
                        {m.monthLabel}
                        {m.monthKey === `${selectedYear}-${selectedMonth}` && (
                          <span className="ml-2 px-1.5 py-0.5 text-[9px] font-bold bg-gold-100 text-gold-900 rounded">
                            Bulan Dipilih
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center font-bold text-slate-800">{m.totalClaims} klaim</td>
                      <td className="py-3 px-4 text-center text-slate-600">{m.customerCount} orang</td>
                      <td className="py-3 px-4 text-right font-black text-slate-900">{formatRupiah(m.totalCost)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      

      {/* ========================================================================= */}
      {/* MODAL 1: FORMULIR INPUT SEDERHANA ("+ Catat Klaim Garansi")               */}
      {/* ========================================================================= */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-charcoal-950/75 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200">
          <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-luxury border border-warm-200 overflow-hidden my-auto max-h-[90vh] flex flex-col">
            {/* Header Modal */}
            <div className="flex items-center justify-between p-4 bg-slate-900 text-white shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-gold-500/20 text-gold-400 flex items-center justify-center">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold">Formulir Catat Klaim Garansi Perbaikan</h3>
                  <p className="text-[11px] text-slate-400">
                    Garansi Perbaikan Gratis (&lt; 1 Bulan) ke Bengkel Rujukan HR MOTOR Garut
                  </p>
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
            <form onSubmit={handleSubmitAdd} className="p-4 sm:p-5 space-y-4 overflow-y-auto flex-1">
              {/* 1. DATA PELANGGAN (Dropdown Pemilih Pelanggan Beli Mobil) */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5">
                <div className="flex items-center justify-between flex-wrap gap-1">
                  <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-gold-600" />
                    Data Pelanggan (Pilih Pembeli Unit Mobil HR MOTOR):
                  </label>
                  <button
                    type="button"
                    onClick={() =>
                      setFormData((prev) => ({
                        ...prev,
                        isManualMode: !prev.isManualMode,
                        selectedPurchaseKey: '',
                      }))
                    }
                    className="text-[11px] font-semibold text-gold-700 hover:text-gold-900 underline"
                  >
                    {formData.isManualMode ? '← Pilih dari Daftar Pembelian' : 'Atau Ketik Data Manual'}
                  </button>
                </div>

                {!formData.isManualMode ? (
                  <select
                    value={formData.selectedPurchaseKey}
                    onChange={(e) => handleSelectCustomerPurchase(e.target.value)}
                    className="w-full text-xs py-2.5 px-3 bg-white border border-slate-300 rounded-lg text-slate-900 font-medium focus:outline-none focus:ring-1 focus:ring-gold-500"
                  >
                    <option value="">-- Pilih Pelanggan yang Sudah Membeli Mobil --</option>
                    {purchaseCustomersList.map((p) => (
                      <option key={p.key} value={p.key}>
                        {p.label}
                      </option>
                    ))}
                  </select>
                ) : (
                  <p className="text-[11px] text-slate-500 italic">
                    Mode ketik manual aktif. Silakan isi data pelanggan dan unit mobil di kolom bawah.
                  </p>
                )}

                {/* Auto-filled details */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Nama Pelanggan <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Contoh: Agus Gunawan"
                      value={formData.customerName}
                      onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                      className="w-full text-xs py-2 px-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-gold-500 bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Nomor WhatsApp Pelanggan <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="Contoh: 081221345678"
                      value={formData.customerPhone}
                      onChange={(e) => setFormData({ ...formData, customerPhone: e.target.value })}
                      className="w-full text-xs py-2 px-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-gold-500 font-mono bg-white"
                    />
                  </div>
                </div>

                {/* Data Mobil & Plat Nomor */}
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 pt-1">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Merek
                    </label>
                    <select
                      value={formData.vehicleBrand}
                      onChange={(e) => setFormData({ ...formData, vehicleBrand: e.target.value })}
                      className="w-full text-xs py-2 px-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-gold-500 bg-white"
                    >
                      {CAR_BRANDS.map((b) => (
                        <option key={b} value={b}>
                          {b}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Model Kendaraan <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Contoh: Innova Reborn 2.4 V Diesel A/T"
                      value={formData.vehicleModel}
                      onChange={(e) => setFormData({ ...formData, vehicleModel: e.target.value })}
                      className="w-full text-xs py-2 px-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-gold-500 bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      No. Polisi (Plat)
                    </label>
                    <input
                      type="text"
                      placeholder="Contoh: Z 1524 DB"
                      value={formData.plateNumber}
                      onChange={(e) => setFormData({ ...formData, plateNumber: e.target.value.toUpperCase() })}
                      className="w-full text-xs py-2 px-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-gold-500 font-mono uppercase bg-white font-bold"
                    />
                  </div>
                </div>

                {/* Tanggal Beli & Indikator Sisa Hari Garansi 1 Bulan */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Tanggal Pembelian Mobil
                    </label>
                    <input
                      type="date"
                      value={formData.purchaseDate}
                      onChange={(e) => setFormData({ ...formData, purchaseDate: e.target.value })}
                      className="w-full text-xs py-2 px-3 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-gold-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Tanggal Klaim / Perbaikan <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="date"
                      required
                      value={formData.claimDate}
                      onChange={(e) => setFormData({ ...formData, claimDate: e.target.value })}
                      className="w-full text-xs py-2 px-3 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-gold-500"
                    />
                  </div>
                </div>

                {/* Indikator Status Masa Garansi Otomatis */}
                {formData.purchaseDate && (
                  <div
                    className={`p-2.5 rounded-lg border text-xs flex items-center gap-2 mt-2 ${
                      addFormWarrantyCheck.isWithinWarranty
                        ? 'bg-emerald-50 text-emerald-900 border-emerald-300'
                        : 'bg-amber-50 text-amber-900 border-amber-300'
                    }`}
                  >
                    {addFormWarrantyCheck.isWithinWarranty ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                    )}
                    <div>
                      <span className="font-bold">{addFormWarrantyCheck.badgeLabel}:</span>{' '}
                      <span>{addFormWarrantyCheck.notes}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* 2. KATEGORI PERBAIKAN */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Kategori Perbaikan <span className="text-rose-500">*</span>
                </label>
                <select
                  value={formData.damageCategory}
                  onChange={(e) =>
                    setFormData({ ...formData, damageCategory: e.target.value as RepairPartCategory })
                  }
                  className="w-full text-xs py-2.5 px-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-gold-500 bg-white font-medium text-slate-800"
                >
                  {REPAIR_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              {/* 3. KELUHAN PERBAIKAN */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Keluhan Perbaikan Konsumen <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={2}
                  required
                  placeholder="Contoh: AC kurang dingin saat siang hari dan bunyi mendesis di kompresor..."
                  value={formData.complaintOrDamage}
                  onChange={(e) => setFormData({ ...formData, complaintOrDamage: e.target.value })}
                  className="w-full text-xs py-2 px-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-gold-500"
                />
              </div>

              {/* 4. BAGIAN YANG DIPERBAIKI */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Bagian yang Diperbaiki <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Magnetic clutch AC & pengisian freon R134a"
                  value={formData.partsToRepair}
                  onChange={(e) => setFormData({ ...formData, partsToRepair: e.target.value })}
                  className="w-full text-xs py-2 px-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-gold-500"
                />
              </div>

              {/* 5. BIAYA PERBAIKAN (RP) */}
              <div className="p-3.5 bg-gold-50/60 border border-gold-300 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-900">
                    Biaya Perbaikan (Rp) <span className="text-rose-500">*</span>
                  </label>
                  <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded border border-emerald-200">
                    100% Ditanggung HR MOTOR (Gratis Pelanggan)
                  </span>
                </div>
                <input
                  type="text"
                  required
                  placeholder="Contoh: 850.000"
                  value={formData.repairCost ? formData.repairCost.toLocaleString('id-ID') : ''}
                  onChange={(e) => setFormData({ ...formData, repairCost: parseRupiahInput(e.target.value) })}
                  className="w-full text-sm font-bold py-2.5 px-3 bg-white border border-gold-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-gold-600 font-mono text-slate-900"
                />
                <div className="text-xs text-charcoal-600 font-medium">
                  Terbilang:{' '}
                  <strong className="text-slate-900 font-bold">{formatRupiah(formData.repairCost)}</strong>
                </div>
              </div>

              {/* Status Perbaikan */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Status Perbaikan
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as RepairStatus })}
                  className="w-full text-xs py-2 px-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-gold-500 bg-white font-medium text-slate-800"
                >
                  <option value="Selesai">Selesai (Sudah Diperbaiki)</option>
                  <option value="Dalam Proses">Dalam Proses Pengerjaan</option>
                  <option value="Menunggu">Menunggu Jadwal / Sparepart</option>
                </select>
              </div>

              {/* Tindakan Perbaikan Opsional */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Tindakan Teknisi / Catatan (Opsional)

                </label>
                <input
                  type="text"
                  placeholder="Contoh: Penggantian part orisinal dan uji coba test drive Samarang"
                  value={formData.repairActionDescription}
                  onChange={(e) => setFormData({ ...formData, repairActionDescription: e.target.value })}
                  className="w-full text-xs py-2 px-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-gold-500"
                />
              </div>

              {/* Checkbox Save to Customer Database if manual */}
              {formData.isManualMode && (
                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="saveCustCheck"
                    checked={formData.saveNewCustomer}
                    onChange={(e) => setFormData({ ...formData, saveNewCustomer: e.target.checked })}
                    className="rounded text-gold-600 focus:ring-gold-500"
                  />
                  <label htmlFor="saveCustCheck" className="text-xs text-slate-600 cursor-pointer">
                    Simpan juga pelanggan ini ke Database Pelanggan HR MOTOR Garut
                  </label>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="w-full sm:w-auto px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors text-center"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="w-full sm:w-auto btn-gold flex items-center justify-center gap-1.5 text-xs font-bold"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Simpan Klaim Garansi</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: DETAIL KLAIM GARANSI & TANDA TERIMA                              */}
      {/* ========================================================================= */}
      {isDetailModalOpen && selectedClaim && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-charcoal-950/75 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200">
          <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-luxury border border-warm-200 overflow-hidden my-auto max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-4 bg-slate-900 text-white shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-gold-500/20 text-gold-400 flex items-center justify-center">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold flex items-center gap-2">
                    <span>Tiket: {selectedClaim.claimNumber || selectedClaim.id}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded font-bold bg-emerald-500/20 text-emerald-300">
                      Garansi HR MOTOR
                    </span>
                  </h3>
                  <p className="text-[11px] text-slate-400">Rincian Surat Klaim Garansi Perbaikan Showroom</p>
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
            <div className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-1">
              {/* Header Box: Pelanggan & Kendaraan */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Pelanggan
                  </div>
                  <div className="text-base font-bold text-slate-900 mt-0.5">
                    {selectedClaim.customerName}
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-slate-600 mt-1">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    <span className="font-mono">{selectedClaim.customerPhone}</span>
                  </div>
                </div>

                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Unit Kendaraan &amp; No. Polisi
                  </div>
                  <div className="text-base font-bold text-slate-900 mt-0.5">
                    {selectedClaim.vehicleBrand} {selectedClaim.vehicleModel} ({selectedClaim.vehicleYear})
                  </div>
                  <div className="text-xs text-slate-600 mt-1 flex items-center gap-2">
                    <span className="font-mono font-bold bg-white px-1.5 py-0.5 rounded border border-slate-300">
                      {selectedClaim.plateNumber || '-'}
                    </span>
                    {selectedClaim.purchaseDate && (
                      <span>Beli: {formatDate(selectedClaim.purchaseDate)}</span>
                    )}
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
                        ? 'bg-emerald-50 text-emerald-900 border-emerald-300'
                        : 'bg-amber-50 text-amber-900 border-amber-300'
                    }`}
                  >
                    {wInfo.isWithinWarranty ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                    ) : (
                      <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                    )}
                    <div>
                      <span className="font-bold text-sm block">Status Garansi: {wInfo.badgeLabel}</span>
                      <p className="mt-0.5">{wInfo.notes}</p>
                      <div className="mt-1 text-[11px] font-medium text-emerald-800">
                        Jaminan Showroom: <strong>100% Beban HR MOTOR (Gratis Pelanggan)</strong>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Rincian Bengkel & Perbaikan */}
              <div className="space-y-3">
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                  <div className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                    Bengkel Rekanan Rujukan HR MOTOR:
                  </div>
                  <p className="text-xs text-slate-900 font-semibold flex items-center gap-1.5">
                    <Building2 className="w-4 h-4 text-gold-600 shrink-0" />
                    <span>{selectedClaim.workshop || 'Bengkel Rekanan HR MOTOR Garut'}</span>
                  </p>
                </div>

                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                  <div className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                    Keluhan Perbaikan Konsumen:
                  </div>
                  <p className="text-xs text-slate-800 leading-relaxed">
                    {selectedClaim.complaintOrDamage || selectedClaim.complaint || '-'}
                  </p>
                </div>

                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                  <div className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                    Bagian yang Diperbaiki:
                  </div>
                  <p className="text-xs text-slate-900 font-semibold">
                    {selectedClaim.partsToRepair || selectedClaim.damagedParts || '-'} ({selectedClaim.damageCategory})
                  </p>
                  {selectedClaim.repairActionDescription && (
                    <p className="text-xs text-slate-600 mt-1">
                      Tindakan: {selectedClaim.repairActionDescription}
                    </p>
                  )}
                </div>
              </div>

              {/* Rincian Biaya */}
              <div className="p-4 bg-gold-50/50 border border-gold-300 rounded-xl">
                <div className="flex items-center justify-between pb-2 border-b border-gold-200 mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-800">
                    Total Biaya Perbaikan Garansi
                  </span>
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-200">
                    100% Ditanggung Showroom HR MOTOR
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-600">Beban Konsumen:</span>
                  <span className="text-sm font-extrabold text-emerald-700 font-mono">Rp 0 (GRATIS)</span>
                </div>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-xs text-slate-600">Realisasi Pengeluaran Showroom:</span>
                  <span className="text-base font-black text-slate-900 font-mono">
                    {formatRupiah(selectedClaim.totalCost)}
                  </span>
                </div>
              </div>

              {/* WhatsApp Confirmation */}
              <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <MessageCircle className="w-5 h-5 text-emerald-600 shrink-0" />
                  <div>
                    <h5 className="text-xs font-bold text-emerald-950">Kirim Konfirmasi WhatsApp</h5>
                    <p className="text-[11px] text-emerald-700">Kirimkan rincian surat garansi ke {selectedClaim.customerPhone}</p>
                  </div>
                </div>
                <a
                  href={generateWhatsAppMessage(selectedClaim)}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3.5 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm transition-all whitespace-nowrap"
                >
                  Kirim WA
                </a>
              </div>
            </div>

            {/* Footer */}
            <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-2.5 p-3 sm:p-4 bg-slate-50 border-t border-slate-200 shrink-0">
              <button
                onClick={() => setDeleteConfirmId(selectedClaim.id)}
                className="px-3 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-lg transition-colors flex items-center justify-center gap-1"
              >
                <Trash2 className="w-4 h-4" />
                <span>Hapus Klaim</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handlePrintSPK(selectedClaim)}
                  className="px-3.5 py-1.5 text-xs font-semibold text-slate-800 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg shadow-xs transition-all flex items-center gap-1.5"
                >
                  <Printer className="w-4 h-4 text-emerald-600" />
                  <span>Cetak SPK</span>
                </button>

                <button
                  onClick={() => setIsDetailModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-200 bg-slate-100 rounded-lg transition-colors"
                >
                  Tutup
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: EDIT KLAIM GARANSI                                               */}
      {/* ========================================================================= */}
      {isEditModalOpen && editFormData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-charcoal-950/75 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200">
          <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-luxury border border-warm-200 overflow-hidden my-auto max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-4 bg-slate-900 text-white shrink-0">
              <div className="flex items-center gap-2">
                <Edit className="w-4 h-4 text-gold-400" />
                <h3 className="text-sm font-bold">Edit Klaim Garansi ({editFormData.claimNumber})</h3>
              </div>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitEdit} className="p-4 sm:p-5 space-y-4 overflow-y-auto flex-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nama Pelanggan <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={editFormData.customerName}
                    onChange={(e) => setEditFormData({ ...editFormData, customerName: e.target.value })}
                    className="w-full text-xs py-2 px-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-gold-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nomor WhatsApp <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    value={editFormData.customerPhone}
                    onChange={(e) => setEditFormData({ ...editFormData, customerPhone: e.target.value })}
                    className="w-full text-xs py-2 px-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-gold-500 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Merek Mobil</label>
                  <select
                    value={editFormData.vehicleBrand}
                    onChange={(e) => setEditFormData({ ...editFormData, vehicleBrand: e.target.value })}
                    className="w-full text-xs py-2 px-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-gold-500 bg-white"
                  >
                    {CAR_BRANDS.map((b) => (
                      <option key={b} value={b}>
                        {b}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Model Mobil</label>
                  <input
                    type="text"
                    required
                    value={editFormData.vehicleModel}
                    onChange={(e) => setEditFormData({ ...editFormData, vehicleModel: e.target.value })}
                    className="w-full text-xs py-2 px-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-gold-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">No. Polisi (Plat)</label>
                  <input
                    type="text"
                    value={editFormData.plateNumber}
                    onChange={(e) => setEditFormData({ ...editFormData, plateNumber: e.target.value.toUpperCase() })}
                    className="w-full text-xs py-2 px-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-gold-500 font-mono uppercase font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Tanggal Beli</label>
                  <input
                    type="date"
                    value={editFormData.purchaseDate}
                    onChange={(e) => setEditFormData({ ...editFormData, purchaseDate: e.target.value })}
                    className="w-full text-xs py-2 px-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-gold-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Tanggal Klaim</label>
                  <input
                    type="date"
                    required
                    value={editFormData.claimDate}
                    onChange={(e) => setEditFormData({ ...editFormData, claimDate: e.target.value })}
                    className="w-full text-xs py-2 px-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-gold-500"
                  />
                </div>
              </div>

              {editFormWarrantyCheck && editFormData.purchaseDate && (
                <div
                  className={`p-2.5 rounded-lg border text-xs flex items-center gap-2 ${
                    editFormWarrantyCheck.isWithinWarranty
                      ? 'bg-emerald-50 text-emerald-900 border-emerald-300'
                      : 'bg-amber-50 text-amber-900 border-amber-300'
                  }`}
                >
                  {editFormWarrantyCheck.isWithinWarranty ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                  )}
                  <div>
                    <span className="font-bold">{editFormWarrantyCheck.badgeLabel}:</span>{' '}
                    <span>{editFormWarrantyCheck.notes}</span>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Kategori Perbaikan <span className="text-rose-500">*</span>
                </label>
                <select
                  value={editFormData.damageCategory}
                  onChange={(e) =>
                    setEditFormData({ ...editFormData, damageCategory: e.target.value as RepairPartCategory })
                  }
                  className="w-full text-xs py-2 px-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-gold-500 bg-white"
                >
                  {REPAIR_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Keluhan Perbaikan <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={2}
                  required
                  value={editFormData.complaintOrDamage}
                  onChange={(e) => setEditFormData({ ...editFormData, complaintOrDamage: e.target.value })}
                  className="w-full text-xs py-2 px-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-gold-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Bagian yang Diperbaiki <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={editFormData.partsToRepair}
                  onChange={(e) => setEditFormData({ ...editFormData, partsToRepair: e.target.value })}
                  className="w-full text-xs py-2 px-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-gold-500"
                />
              </div>

              

              <div className="p-3 bg-gold-50/60 border border-gold-300 rounded-xl">
                <label className="block text-xs font-bold text-slate-900 mb-1">
                  Biaya Perbaikan (Rp)
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: 850.000"
                  value={editFormData.repairCost ? editFormData.repairCost.toLocaleString('id-ID') : ''}
                  onChange={(e) =>
                    setEditFormData({ ...editFormData, repairCost: parseRupiahInput(e.target.value) })
                  }
                  className="w-full text-sm font-bold py-2 px-3 bg-white border border-gold-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-gold-600 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Status Perbaikan
                </label>
                <select
                  value={editFormData.status || 'Selesai'}
                  onChange={(e) =>
                    setEditFormData({ ...editFormData, status: e.target.value as RepairStatus })
                  }
                  className="w-full text-xs py-2 px-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-gold-500 bg-white font-medium text-slate-800"
                >
                  <option value="Selesai">Selesai (Sudah Diperbaiki)</option>
                  <option value="Dalam Proses">Dalam Proses Pengerjaan</option>
                  <option value="Menunggu">Menunggu Jadwal / Sparepart</option>
                  <option value="Dibatalkan">Dibatalkan</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Tindakan Teknisi / Catatan

                </label>
                <input
                  type="text"
                  value={editFormData.repairActionDescription}
                  onChange={(e) =>
                    setEditFormData({ ...editFormData, repairActionDescription: e.target.value })
                  }
                  className="w-full text-xs py-2 px-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-gold-500"
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
                  className="btn-gold flex items-center gap-1.5 text-xs font-bold"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Simpan Perubahan</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 4: KONFIRMASI HAPUS                                                  */}
      {/* ========================================================================= */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-charcoal-950/70 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-sm bg-white rounded-xl shadow-luxury border border-warm-200 p-5 space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5 text-rose-600" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900">Hapus Data Garansi?</h4>
                <p className="text-xs text-slate-500">Tindakan ini tidak dapat dibatalkan.</p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                Batal
              </button>
              <button
                onClick={() => handleDelete(deleteConfirmId)}
                className="px-3.5 py-1.5 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-sm transition-all"
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
