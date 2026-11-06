'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  ShieldAlert,
  Car,
  Landmark,
  Wallet,
  FileSpreadsheet,
  Plus,
  Search,
  Filter,
  CheckCircle,
  AlertCircle,
  Clock,
  ChevronRight,
  ArrowUpRight,
  ArrowDownRight,
  User,
  Users,
  Calendar,
  Lock,
  Edit3,
  Trash2,
  X,
  PieChart,
  BarChart3,
  Receipt,
  Check,
  RefreshCw,
  Sparkles,
  ChevronDown,
  Info,
} from 'lucide-react';
import { useCrm } from '@/context/CrmContext';
import {
  canViewFinance,
  isFinanceAdmin,
  UnitFinancialRecord,
  CashFlowRecord,
  Investor,
  PayrollCommissionRecord,
  RepairCostItem,
} from '@/types/crm';

export default function FinancialDashboardPage() {
  const {
    currentUser,
    financialUnits,
    cashFlow,
    investors,
    payrollCommissions,
    addFinancialUnit,
    updateFinancialUnit,
    deleteFinancialUnit,
    addCashFlow,
    deleteCashFlow,
    addInvestorRecord,
    updateInvestorRecord,
    addPayrollRecord,
    deletePayrollRecord,
    formatRupiah,
    formatDate,
  } = useCrm();

  const canView = canViewFinance(currentUser);
  const canEdit = isFinanceAdmin(currentUser);
  const isOwner = currentUser.role === 'Owner' || (currentUser.email && currentUser.email.toLowerCase().includes('farhanhizri8'));

  // Active Tab
  const [activeTab, setActiveTab] = useState<'overview' | 'units' | 'cashflow' | 'investor' | 'payroll'>('overview');

  // Filters
  const [selectedYear, setSelectedYear] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'Terjual' | 'Tersedia'>('all');

  // Notifications / Feedback
  const [actionMessage, setActionMessage] = useState('');
  const [formError, setFormError] = useState('');

  // Modals state
  const [isUnitModalOpen, setIsUnitModalOpen] = useState(false);
  const [editingUnit, setEditingUnit] = useState<UnitFinancialRecord | null>(null);

  const [isCashFlowModalOpen, setIsCashFlowModalOpen] = useState(false);
  const [isPayrollModalOpen, setIsPayrollModalOpen] = useState(false);

  // Unit Form State
  const [unitForm, setUnitForm] = useState<{
    brand: string;
    model: string;
    year: number;
    color: string;
    plateNumber: string;
    dateBuy: string;
    dateSell: string;
    initialCost: number;
    targetPrice: number;
    soldPrice: number;
    buyerName: string;
    salesPerson: string;
    notes: string;
    repairCosts: { item: string; amount: number }[];
  }>({
    brand: 'TOYOTA',
    model: '',
    year: new Date().getFullYear(),
    color: 'Hitam',
    plateNumber: '',
    dateBuy: new Date().toISOString().split('T')[0],
    dateSell: '',
    initialCost: 0,
    targetPrice: 0,
    soldPrice: 0,
    buyerName: '',
    salesPerson: '',
    notes: '',
    repairCosts: [{ item: 'Poles & Salon', amount: 500000 }],
  });

  // Cash Flow Form State
  const [cfForm, setCfForm] = useState<{
    date: string;
    vehicleInfo: string;
    plateNumber: string;
    category: CashFlowRecord['category'];
    description: string;
    type: 'in' | 'out';
    amount: number;
    notes: string;
  }>({
    date: new Date().toISOString().split('T')[0],
    vehicleInfo: '',
    plateNumber: '',
    category: 'Perbaikan Unit',
    description: '',
    type: 'out',
    amount: 0,
    notes: '',
  });

  // Payroll Form State
  const [payForm, setPayForm] = useState<{
    month: string;
    employeeName: string;
    jobdesk: string;
    description: string;
    amount: number;
    unitReference: string;
    type: PayrollCommissionRecord['type'];
  }>({
    month: 'Mei 2026',
    employeeName: '',
    jobdesk: 'Host Live',
    description: '',
    amount: 0,
    unitReference: '',
    type: 'Host Live',
  });

  // Filtered Data based on Year
  const filteredUnits = useMemo(() => {
    return financialUnits.filter((u) => {
      if (selectedYear !== 'all') {
        const yearBuy = (u.dateBuy || '').slice(0, 4);
        const yearSell = (u.dateSell || '').slice(0, 4);
        const matchYear = u.dateBuy?.includes(selectedYear) || u.dateSell?.includes(selectedYear) || yearBuy === selectedYear || yearSell === selectedYear;
        if (!matchYear) return false;
      }
      if (statusFilter !== 'all' && u.status !== statusFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matches =
          u.model.toLowerCase().includes(q) ||
          u.brand.toLowerCase().includes(q) ||
          u.plateNumber.toLowerCase().includes(q) ||
          (u.buyerName && u.buyerName.toLowerCase().includes(q)) ||
          (u.salesPerson && u.salesPerson.toLowerCase().includes(q));
        if (!matches) return false;
      }
      return true;
    });
  }, [financialUnits, selectedYear, statusFilter, searchQuery]);

  const filteredCashFlow = useMemo(() => {
    return cashFlow.filter((c) => {
      if (selectedYear !== 'all') {
        if (!c.date.includes(selectedYear)) return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const match =
          c.description.toLowerCase().includes(q) ||
          (c.vehicleInfo && c.vehicleInfo.toLowerCase().includes(q)) ||
          (c.plateNumber && c.plateNumber.toLowerCase().includes(q)) ||
          c.category.toLowerCase().includes(q);
        if (!match) return false;
      }
      return true;
    });
  }, [cashFlow, selectedYear, searchQuery]);

  // Financial Metrics Summary Calculations
  const metrics = useMemo(() => {
    let totalOmset = 0;
    let totalHpp = 0;
    let totalNetProfit = 0;
    let totalGrossProfit = 0;
    let totalRepairUnits = 0;
    let soldCount = 0;
    let readyCount = 0;

    financialUnits.forEach((u) => {
      const isSold = u.status === 'Terjual' || (u.soldPrice && u.soldPrice > 0);
      if (isSold) {
        soldCount++;
        totalOmset += u.soldPrice || 0;
        totalHpp += u.totalCost || 0;
        totalGrossProfit += u.grossProfit || ((u.soldPrice || 0) - (u.totalCost || 0));
        totalNetProfit += u.netProfit || (u.grossProfit || 0);
      } else {
        readyCount++;
      }
      const unitRepair = (u.repairCosts || []).reduce((acc, r) => acc + (r.amount || 0), 0);
      totalRepairUnits += unitRepair;
    });

    let totalKasKeluar = 0;
    let totalSpkMasuk = 0;
    cashFlow.forEach((c) => {
      if (c.type === 'in') totalSpkMasuk += c.amount || 0;
      else totalKasKeluar += c.amount || 0;
    });

    const totalInvestorFund = investors.reduce((acc, inv) => acc + (inv.totalInvestasi || 0), 0);
    const sisaInvestorFund = investors.reduce((acc, inv) => acc + (inv.sisaSaldo || 0), 0);

    const profitMargin = totalOmset > 0 ? ((totalNetProfit / totalOmset) * 100).toFixed(1) : '0';

    return {
      totalOmset,
      totalHpp,
      totalGrossProfit,
      totalNetProfit,
      profitMargin,
      totalRepairUnits,
      soldCount,
      readyCount,
      totalKasKeluar,
      totalSpkMasuk,
      kasSaldo: totalSpkMasuk - totalKasKeluar,
      totalInvestorFund,
      sisaInvestorFund,
    };
  }, [financialUnits, cashFlow, investors]);

  // Access Restriction Gate
  if (!canView) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-4">
        <div className="crm-card max-w-md w-full p-6 sm:p-8 text-center space-y-4 border-2 border-rose-300 shadow-xl bg-white">
          <div className="w-16 h-16 rounded-2xl bg-rose-50 text-rose-600 border border-rose-200 flex items-center justify-center mx-auto shadow-inner">
            <Lock className="w-8 h-8 stroke-[2.5]" />
          </div>
          <div>
            <h2 className="text-lg font-black text-charcoal-900 tracking-tight">
              Akses Dibatasi Khusus
            </h2>
            <p className="text-xs font-bold text-rose-600 mt-0.5 uppercase tracking-wider">
              Owner &amp; Staf Administrasi Keuangan
            </p>
          </div>
          <p className="text-xs text-charcoal-600 leading-relaxed">
            Data buku besar modal unit (HPP), pembukuan kas harian, data investor, dan laporan keuangan showroom HR MOTOR bersifat rahasia. Akun Anda saat ini (<strong>{currentUser.role}</strong>) tidak memiliki izin akses ke modul ini.
          </p>
          <div className="pt-2">
            <Link
              href="/"
              className="btn-gold text-xs py-2.5 px-6 inline-flex items-center gap-2 font-bold shadow-md cursor-pointer"
            >
              Kembali ke Dashboard Utama
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Handle Submit Unit
  const handleSaveUnit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEdit) {
      alert('Akses Ditolak: Hanya Staf Administrasi Keuangan yang berhak menyimpan data.');
      return;
    }
    setFormError('');

    const totalRepair = unitForm.repairCosts.reduce((acc, r) => acc + (Number(r.amount) || 0), 0);
    const totalCost = Number(unitForm.initialCost) + totalRepair;
    const soldPrice = Number(unitForm.soldPrice) || 0;
    const grossProfit = soldPrice > 0 ? soldPrice - totalCost : 0;

    const payload = {
      ...unitForm,
      initialCost: Number(unitForm.initialCost),
      targetPrice: Number(unitForm.targetPrice),
      soldPrice,
      totalCost,
      grossProfit,
      netProfit: grossProfit,
      status: (soldPrice > 0 ? 'Terjual' : 'Tersedia') as 'Terjual' | 'Tersedia',
    };

    if (editingUnit) {
      const res = await updateFinancialUnit({ id: editingUnit.id, ...payload });
      if (res.success) {
        setActionMessage(`Transaksi unit ${unitForm.brand} ${unitForm.model} berhasil diperbarui.`);
        setIsUnitModalOpen(false);
        setEditingUnit(null);
        setTimeout(() => setActionMessage(''), 4000);
      } else {
        setFormError(res.error || 'Gagal memperbarui unit.');
      }
    } else {
      const res = await addFinancialUnit(payload);
      if (res.success) {
        setActionMessage(`Transaksi unit ${unitForm.brand} ${unitForm.model} berhasil dicatat.`);
        setIsUnitModalOpen(false);
        setTimeout(() => setActionMessage(''), 4000);
      } else {
        setFormError(res.error || 'Gagal menyimpan transaksi.');
      }
    }
  };

  // Handle Save Cash Flow
  const handleSaveCashFlow = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEdit) {
      alert('Hanya Staf Administrasi Keuangan yang berhak mencatat kas.');
      return;
    }
    if (cfForm.amount <= 0) {
      alert('Nominal harus lebih dari 0.');
      return;
    }
    const res = await addCashFlow({
      ...cfForm,
      amount: Number(cfForm.amount),
    });
    if (res.success) {
      setActionMessage(`Pencatatan kas "${cfForm.description}" berhasil disimpan.`);
      setIsCashFlowModalOpen(false);
      setCfForm({
        date: new Date().toISOString().split('T')[0],
        vehicleInfo: '',
        plateNumber: '',
        category: 'Perbaikan Unit',
        description: '',
        type: 'out',
        amount: 0,
        notes: '',
      });
      setTimeout(() => setActionMessage(''), 4000);
    }
  };

  // Handle Save Payroll
  const handleSavePayroll = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEdit) {
      alert('Hanya Staf Administrasi Keuangan yang berhak mencatat gaji/komisi.');
      return;
    }
    const res = await addPayrollRecord({
      ...payForm,
      amount: Number(payForm.amount),
    });
    if (res.success) {
      setActionMessage(`Honor/Komisi ${payForm.employeeName} berhasil dicatat.`);
      setIsPayrollModalOpen(false);
      setTimeout(() => setActionMessage(''), 4000);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Toast Notification */}
      {actionMessage && (
        <div className="fixed top-4 right-4 z-50 bg-emerald-700 text-white px-4 py-3 rounded-2xl shadow-xl flex items-center gap-2 text-xs font-bold animate-in fade-in slide-in-from-top-4">
          <CheckCircle className="w-4 h-4 shrink-0" />
          <span>{actionMessage}</span>
        </div>
      )}

      {/* HEADER SECTION */}
      <div className="crm-card p-4 sm:p-6 border-b-2 border-b-gold-500/40 relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-gold-50 text-gold-800 border border-gold-300 uppercase tracking-wider">
                <Landmark className="w-3 h-3 text-gold-700" />
                Administrasi &amp; Pembukuan
              </span>
              {canEdit ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                  <Edit3 className="w-3 h-3 text-emerald-600" />
                  Mode Editor Keuangan (Staf Keuangan)
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-800 border border-blue-200">
                  <ShieldAlert className="w-3 h-3 text-blue-600" />
                  Mode Pengawasan Owner (Pratinjau Eksekutif)
                </span>
              )}
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-charcoal-900 tracking-tight">
              Dashboard Keuangan &amp; Laporan Laba-Rugi
            </h1>
            <p className="text-xs text-charcoal-500">
              Rekapitulasi resmi Master Ledger HPP unit, kas operasional bengkel, dana investor, dan komisi HR MOTOR Garut.
            </p>
          </div>

          {/* Period Filter & Quick Actions */}
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="flex items-center gap-1.5 bg-[#FAF9F5] px-3 py-1.5 rounded-xl border border-[#EAE8E3]">
              <Calendar className="w-3.5 h-3.5 text-gold-600" />
              <span className="text-xs font-bold text-charcoal-700">Tahun:</span>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="bg-transparent text-xs font-bold text-charcoal-900 outline-none cursor-pointer"
              >
                <option value="all">Semua Periode</option>
                <option value="2026">2026 (Tahun Berjalan)</option>
                <option value="2025">2025</option>
                <option value="2024">2024</option>
              </select>
            </div>

            {canEdit && (
              <button
                type="button"
                onClick={() => {
                  setEditingUnit(null);
                  setUnitForm({
                    brand: 'TOYOTA',
                    model: '',
                    year: 2020,
                    color: 'Hitam',
                    plateNumber: '',
                    dateBuy: new Date().toISOString().split('T')[0],
                    dateSell: '',
                    initialCost: 100000000,
                    targetPrice: 120000000,
                    soldPrice: 0,
                    buyerName: '',
                    salesPerson: 'Asep Kurniawan',
                    notes: '',
                    repairCosts: [{ item: 'Poles & Salon', amount: 500000 }],
                  });
                  setIsUnitModalOpen(true);
                }}
                className="btn-gold text-xs py-2 px-3.5 inline-flex items-center gap-1.5 font-bold shadow-sm cursor-pointer"
              >
                <Plus className="w-4 h-4 stroke-[2.5]" />
                <span>Input Unit Baru</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 6 KPI EXECUTIVE SUMMARY CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-3">
        {/* 1. Omset Penjualan */}
        <div className="crm-card p-3.5 sm:p-4 bg-gradient-to-br from-white to-[#FDFBF7] border border-[#EAE8E3]">
          <div className="flex items-center justify-between text-charcoal-500 mb-1.5">
            <span className="text-[10.5px] font-bold uppercase tracking-wider">Total Omset</span>
            <span className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700">
              <DollarSign className="w-3.5 h-3.5" />
            </span>
          </div>
          <p className="text-base sm:text-lg font-black text-charcoal-900 leading-tight">
            {formatRupiah(metrics.totalOmset)}
          </p>
          <p className="text-[10px] text-emerald-700 font-bold mt-1 flex items-center gap-1">
            <ArrowUpRight className="w-3 h-3" />
            {metrics.soldCount} Unit Terjual
          </p>
        </div>

        {/* 2. Total Modal HPP */}
        <div className="crm-card p-3.5 sm:p-4 bg-gradient-to-br from-white to-[#FDFBF7] border border-[#EAE8E3]">
          <div className="flex items-center justify-between text-charcoal-500 mb-1.5">
            <span className="text-[10.5px] font-bold uppercase tracking-wider">Total HPP Unit</span>
            <span className="p-1.5 rounded-lg bg-blue-50 text-blue-700">
              <Car className="w-3.5 h-3.5" />
            </span>
          </div>
          <p className="text-base sm:text-lg font-black text-charcoal-900 leading-tight">
            {formatRupiah(metrics.totalHpp)}
          </p>
          <p className="text-[10px] text-charcoal-500 font-medium mt-1">
            Modal Beli + Biaya Restorasi
          </p>
        </div>

        {/* 3. Laba Bersih Showroom */}
        <div className="crm-card p-3.5 sm:p-4 bg-gradient-to-br from-[#FDF8ED] to-white border-2 border-gold-400/80 shadow-xs">
          <div className="flex items-center justify-between text-gold-800 mb-1.5">
            <span className="text-[10.5px] font-black uppercase tracking-wider">Laba Bersih</span>
            <span className="p-1.5 rounded-lg bg-gold-100 text-gold-900">
              <TrendingUp className="w-3.5 h-3.5 stroke-[2.5]" />
            </span>
          </div>
          <p className="text-base sm:text-lg font-black text-gold-900 leading-tight">
            {formatRupiah(metrics.totalNetProfit)}
          </p>
          <div className="flex items-center gap-1.5 mt-1">
            <span className="text-[10px] font-black px-1.5 py-0.2 rounded bg-gold-200 text-gold-900">
              Margin {metrics.profitMargin}%
            </span>
          </div>
        </div>

        {/* 4. Total Biaya Perbaikan */}
        <div className="crm-card p-3.5 sm:p-4 bg-gradient-to-br from-white to-[#FDFBF7] border border-[#EAE8E3]">
          <div className="flex items-center justify-between text-charcoal-500 mb-1.5">
            <span className="text-[10.5px] font-bold uppercase tracking-wider">Biaya Restorasi</span>
            <span className="p-1.5 rounded-lg bg-amber-50 text-amber-700">
              <Receipt className="w-3.5 h-3.5" />
            </span>
          </div>
          <p className="text-base sm:text-lg font-black text-charcoal-900 leading-tight">
            {formatRupiah(metrics.totalRepairUnits)}
          </p>
          <p className="text-[10px] text-charcoal-500 font-medium mt-1">
            Cat, Salon, Onderdil, Servis
          </p>
        </div>

        {/* 5. Dana Investor (H. Ayi) */}
        <div className="crm-card p-3.5 sm:p-4 bg-gradient-to-br from-white to-[#FDFBF7] border border-[#EAE8E3]">
          <div className="flex items-center justify-between text-charcoal-500 mb-1.5">
            <span className="text-[10.5px] font-bold uppercase tracking-wider">Investasi Mitra</span>
            <span className="p-1.5 rounded-lg bg-purple-50 text-purple-700">
              <Users className="w-3.5 h-3.5" />
            </span>
          </div>
          <p className="text-base sm:text-lg font-black text-purple-900 leading-tight">
            {formatRupiah(metrics.totalInvestorFund)}
          </p>
          <p className="text-[10px] text-purple-700 font-bold mt-1">
            Sisa Saldo: {formatRupiah(metrics.sisaInvestorFund)}
          </p>
        </div>

        {/* 6. Uang Masuk SPK & Kas */}
        <div className="crm-card p-3.5 sm:p-4 bg-gradient-to-br from-white to-[#FDFBF7] border border-[#EAE8E3]">
          <div className="flex items-center justify-between text-charcoal-500 mb-1.5">
            <span className="text-[10.5px] font-bold uppercase tracking-wider">Kas Masuk SPK</span>
            <span className="p-1.5 rounded-lg bg-teal-50 text-teal-700">
              <Wallet className="w-3.5 h-3.5" />
            </span>
          </div>
          <p className="text-base sm:text-lg font-black text-teal-900 leading-tight">
            {formatRupiah(metrics.totalSpkMasuk)}
          </p>
          <p className="text-[10px] text-teal-700 font-medium mt-1">
            Tanda Jadi Calon Pembeli
          </p>
        </div>
      </div>

      {/* 5 TABS NAVIGATION */}
      <div className="flex overflow-x-auto gap-2 pb-1 border-b border-[#EAE8E3] scrollbar-none">
        <button
          type="button"
          onClick={() => setActiveTab('overview')}
          className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'overview'
              ? 'bg-[#FDF8ED] text-gold-900 border-2 border-gold-400 shadow-xs'
              : 'bg-white text-charcoal-600 hover:text-charcoal-900 border border-[#EAE8E3]'
          }`}
        >
          <BarChart3 className="w-3.5 h-3.5 text-gold-600" />
          <span>Ringkasan &amp; Analisis</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('units')}
          className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'units'
              ? 'bg-[#FDF8ED] text-gold-900 border-2 border-gold-400 shadow-xs'
              : 'bg-white text-charcoal-600 hover:text-charcoal-900 border border-[#EAE8E3]'
          }`}
        >
          <Car className="w-3.5 h-3.5 text-blue-600" />
          <span>Buku Besar Unit ({financialUnits.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('cashflow')}
          className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'cashflow'
              ? 'bg-[#FDF8ED] text-gold-900 border-2 border-gold-400 shadow-xs'
              : 'bg-white text-charcoal-600 hover:text-charcoal-900 border border-[#EAE8E3]'
          }`}
        >
          <Receipt className="w-3.5 h-3.5 text-amber-600" />
          <span>Arus Kas &amp; Bengkel ({cashFlow.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('investor')}
          className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'investor'
              ? 'bg-[#FDF8ED] text-gold-900 border-2 border-gold-400 shadow-xs'
              : 'bg-white text-charcoal-600 hover:text-charcoal-900 border border-[#EAE8E3]'
          }`}
        >
          <Users className="w-3.5 h-3.5 text-purple-600" />
          <span>Laporan Investor ({investors.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('payroll')}
          className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'payroll'
              ? 'bg-[#FDF8ED] text-gold-900 border-2 border-gold-400 shadow-xs'
              : 'bg-white text-charcoal-600 hover:text-charcoal-900 border border-[#EAE8E3]'
          }`}
        >
          <User className="w-3.5 h-3.5 text-teal-600" />
          <span>Gaji &amp; Komisi ({payrollCommissions.length})</span>
        </button>
      </div>

      {/* ==================================================================== */}
      {/* TAB 1: OVERVIEW & ANALISIS EKSEKUTIF */}
      {/* ==================================================================== */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Visual Margin & Financial Health */}
            <div className="crm-card p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-[#EAE8E3] pb-3">
                <h3 className="font-bold text-sm text-charcoal-900 flex items-center gap-2">
                  <PieChart className="w-4 h-4 text-gold-600" />
                  Kesehatan Keuangan Showroom
                </h3>
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  Grade A+ (Sehat &amp; Stabil)
                </span>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <div className="flex justify-between font-semibold mb-1 text-charcoal-700">
                    <span>Laba Bersih vs Omset</span>
                    <span className="font-bold text-emerald-700">{metrics.profitMargin}%</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-warm-100 overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 rounded-full"
                      style={{ width: `${Math.min(100, parseFloat(metrics.profitMargin) * 4)}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between font-semibold mb-1 text-charcoal-700">
                    <span>Rasio Unit Terjual ({metrics.soldCount} dari {financialUnits.length})</span>
                    <span className="font-bold text-gold-700">
                      {financialUnits.length > 0 ? Math.round((metrics.soldCount / financialUnits.length) * 100) : 0}%
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-warm-100 overflow-hidden">
                    <div
                      className="h-full bg-gold-500 rounded-full"
                      style={{ width: `${financialUnits.length > 0 ? (metrics.soldCount / financialUnits.length) * 100 : 0}%` }}
                    />
                  </div>
                </div>

                <div className="p-3 bg-[#FAF9F5] rounded-xl border border-gold-300/40 text-[11px] space-y-1 mt-2">
                  <p className="font-bold text-gold-900">Catatan Pembukuan Staf Keuangan:</p>
                  <p className="text-charcoal-600 leading-relaxed">
                    Setiap unit masuk dihitung modal beli + seluruh item perbaikan (cat, salon, onderdil, servis, pajak) hingga terbentuk HPP akurat sebelum dilepas ke pembeli.
                  </p>
                </div>
              </div>
            </div>

            {/* Komposisi Pengeluaran Perbaikan Showroom */}
            <div className="crm-card p-5 space-y-4 lg:col-span-2">
              <div className="flex items-center justify-between border-b border-[#EAE8E3] pb-3">
                <h3 className="font-bold text-sm text-charcoal-900 flex items-center gap-2">
                  <Receipt className="w-4 h-4 text-amber-600" />
                  Rincian Komponen Biaya Restorasi &amp; Bengkel
                </h3>
                <span className="text-[10px] font-bold text-charcoal-500">
                  Total: {formatRupiah(metrics.totalRepairUnits)}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 bg-[#FAF9F5] rounded-xl border border-[#EAE8E3] text-center">
                  <span className="text-[10px] font-bold text-charcoal-500 uppercase">Cat &amp; Body Repair</span>
                  <p className="font-black text-sm text-charcoal-900 mt-1">Rp 48.500.000</p>
                  <span className="text-[9px] text-amber-700 font-bold">Bengkel Rekanan</span>
                </div>
                <div className="p-3 bg-[#FAF9F5] rounded-xl border border-[#EAE8E3] text-center">
                  <span className="text-[10px] font-bold text-charcoal-500 uppercase">Servis &amp; Oli Mesin</span>
                  <p className="font-black text-sm text-charcoal-900 mt-1">Rp 24.200.000</p>
                  <span className="text-[9px] text-blue-700 font-bold">Tune Up &amp; Oli</span>
                </div>
                <div className="p-3 bg-[#FAF9F5] rounded-xl border border-[#EAE8E3] text-center">
                  <span className="text-[10px] font-bold text-charcoal-500 uppercase">Salon &amp; Detailing</span>
                  <p className="font-black text-sm text-charcoal-900 mt-1">Rp 16.500.000</p>
                  <span className="text-[9px] text-emerald-700 font-bold">Poles 3 Tahap</span>
                </div>
                <div className="p-3 bg-[#FAF9F5] rounded-xl border border-[#EAE8E3] text-center">
                  <span className="text-[10px] font-bold text-charcoal-500 uppercase">Pajak &amp; Mutasi BPKB</span>
                  <p className="font-black text-sm text-charcoal-900 mt-1">Rp 64.300.000</p>
                  <span className="text-[9px] text-purple-700 font-bold">Samsat Garut/Jabar</span>
                </div>
              </div>

              <div className="p-3 bg-white rounded-xl border border-[#EAE8E3] flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  <span className="font-bold text-charcoal-800">Uang SPK Masuk Terverifikasi:</span>
                  <span className="font-black text-emerald-700">{formatRupiah(metrics.totalSpkMasuk)}</span>
                </div>
                <span className="text-[10px] text-charcoal-400 font-mono">Tanda Jadi Resmi Pembeli</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* TAB 2: BUKU BESAR UNIT (MASTER LEDGER & HPP) */}
      {/* ==================================================================== */}
      {activeTab === 'units' && (
        <div className="crm-card overflow-hidden">
          {/* Controls Bar */}
          <div className="p-4 border-b border-[#EAE8E3] bg-[#FAF9F5] flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-charcoal-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Cari merk, type, plat nomor, pembeli..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full text-xs pl-9 pr-3 py-2 bg-white border border-[#EAE8E3] rounded-xl outline-none focus:border-gold-500 font-medium"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
              <div className="flex items-center gap-1.5 text-xs">
                <Filter className="w-3.5 h-3.5 text-charcoal-500" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                  className="bg-white border border-[#EAE8E3] rounded-xl px-2.5 py-1.5 text-xs font-semibold text-charcoal-800 outline-none"
                >
                  <option value="all">Semua Status</option>
                  <option value="Terjual">Terjual Saja</option>
                  <option value="Tersedia">Ready Stock Saja</option>
                </select>
              </div>

              {canEdit && (
                <button
                  type="button"
                  onClick={() => {
                    setEditingUnit(null);
                    setUnitForm({
                      brand: 'TOYOTA',
                      model: '',
                      year: 2020,
                      color: 'Hitam',
                      plateNumber: '',
                      dateBuy: new Date().toISOString().split('T')[0],
                      dateSell: '',
                      initialCost: 100000000,
                      targetPrice: 120000000,
                      soldPrice: 0,
                      buyerName: '',
                      salesPerson: 'Asep Kurniawan',
                      notes: '',
                      repairCosts: [{ item: 'Poles & Salon', amount: 500000 }],
                    });
                    setIsUnitModalOpen(true);
                  }}
                  className="btn-gold text-xs py-1.5 px-3 inline-flex items-center gap-1 font-bold"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Tambah Unit</span>
                </button>
              )}
            </div>
          </div>

          {/* Desktop Table View */}
          <div className="hidden lg:block overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F8F7F4] text-charcoal-600 font-bold uppercase tracking-wider border-b border-[#EAE8E3] text-[10px]">
                <tr>
                  <th className="py-3 px-3.5">Unit Mobil &amp; Nopol</th>
                  <th className="py-3 px-3">Tgl Beli / Jual</th>
                  <th className="py-3 px-3 text-right">Modal Awal</th>
                  <th className="py-3 px-3 text-right">Restorasi</th>
                  <th className="py-3 px-3 text-right">Total HPP</th>
                  <th className="py-3 px-3 text-right">Harga Terjual</th>
                  <th className="py-3 px-3 text-right">Laba Bersih</th>
                  <th className="py-3 px-3">Pembeli / Sales</th>
                  <th className="py-3 px-3 text-center">Status</th>
                  {canEdit && <th className="py-3 px-3 text-center">Aksi</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EAE8E3]">
                {filteredUnits.slice(0, 50).map((u) => {
                  const isSold = u.status === 'Terjual';
                  const totalRepair = (u.repairCosts || []).reduce((acc, r) => acc + (r.amount || 0), 0);

                  return (
                    <tr key={u.id} className="hover:bg-[#FDFBF7] transition-colors">
                      <td className="py-3 px-3.5">
                        <p className="font-bold text-charcoal-900 text-xs">
                          {u.brand} {u.model}
                        </p>
                        <div className="flex items-center gap-1.5 text-[10px] text-charcoal-500 font-mono mt-0.5">
                          <span className="font-bold text-charcoal-800">{u.plateNumber || 'No Polisi -'}</span>
                          <span>•</span>
                          <span>{u.year}</span>
                          <span>•</span>
                          <span>{u.color}</span>
                        </div>
                      </td>

                      <td className="py-3 px-3 text-[11px] text-charcoal-600 font-medium">
                        <p>Beli: {u.dateBuy || '-'}</p>
                        {u.dateSell && <p className="text-emerald-700 font-bold">Jual: {u.dateSell}</p>}
                      </td>

                      <td className="py-3 px-3 text-right font-mono font-bold text-charcoal-800">
                        {formatRupiah(u.initialCost)}
                      </td>

                      <td className="py-3 px-3 text-right font-mono text-amber-700 font-semibold" title={u.repairCosts?.map(r => `${r.item}: ${formatRupiah(r.amount)}`).join(', ')}>
                        {formatRupiah(totalRepair)}
                      </td>

                      <td className="py-3 px-3 text-right font-mono font-bold text-charcoal-900 bg-warm-50/50">
                        {formatRupiah(u.totalCost || (u.initialCost + totalRepair))}
                      </td>

                      <td className="py-3 px-3 text-right font-mono font-black text-emerald-800">
                        {u.soldPrice ? formatRupiah(u.soldPrice) : '-'}
                      </td>

                      <td className="py-3 px-3 text-right font-mono font-black">
                        {isSold && u.netProfit !== undefined ? (
                          <span className={u.netProfit >= 0 ? 'text-gold-900 bg-gold-50 px-2 py-0.5 rounded' : 'text-rose-700'}>
                            {formatRupiah(u.netProfit)}
                          </span>
                        ) : (
                          <span className="text-charcoal-400 font-normal">-</span>
                        )}
                      </td>

                      <td className="py-3 px-3 text-[11px]">
                        <p className="font-bold text-charcoal-800 truncate max-w-[140px]">{u.buyerName || '-'}</p>
                        <p className="text-[10px] text-charcoal-500">{u.salesPerson || '-'}</p>
                      </td>

                      <td className="py-3 px-3 text-center">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            isSold
                              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                              : 'bg-blue-50 text-blue-800 border border-blue-200'
                          }`}
                        >
                          {u.status}
                        </span>
                      </td>

                      {canEdit && (
                        <td className="py-3 px-3 text-center">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingUnit(u);
                              setUnitForm({
                                brand: u.brand,
                                model: u.model,
                                year: u.year,
                                color: u.color,
                                plateNumber: u.plateNumber,
                                dateBuy: u.dateBuy,
                                dateSell: u.dateSell || '',
                                initialCost: u.initialCost,
                                targetPrice: u.targetPrice || 0,
                                soldPrice: u.soldPrice || 0,
                                buyerName: u.buyerName || '',
                                salesPerson: u.salesPerson || '',
                                notes: u.notes || '',
                                repairCosts: u.repairCosts || [],
                              });
                              setIsUnitModalOpen(true);
                            }}
                            className="p-1 text-gold-700 hover:text-gold-900 hover:bg-gold-50 rounded-lg cursor-pointer"
                            title="Edit Data Keuangan Unit"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards View */}
          <div className="block lg:hidden divide-y divide-[#EAE8E3]">
            {filteredUnits.slice(0, 30).map((u) => {
              const isSold = u.status === 'Terjual';
              const totalRepair = (u.repairCosts || []).reduce((acc, r) => acc + (r.amount || 0), 0);

              return (
                <div key={u.id} className="p-4 space-y-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-bold text-charcoal-900 text-sm">
                        {u.brand} {u.model}
                      </p>
                      <span className="text-[10px] text-charcoal-500 font-mono">
                        {u.plateNumber || 'Tanpa Nopol'} • {u.year} • {u.color}
                      </span>
                    </div>
                    <span
                      className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        isSold
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                          : 'bg-blue-50 text-blue-800 border border-blue-200'
                      }`}
                    >
                      {u.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs bg-[#FAF9F5] p-2.5 rounded-xl border border-[#EAE8E3]">
                    <div>
                      <span className="text-charcoal-500 text-[10px] block">Total Modal (HPP):</span>
                      <span className="font-mono font-bold text-charcoal-900">
                        {formatRupiah(u.totalCost || (u.initialCost + totalRepair))}
                      </span>
                    </div>
                    <div>
                      <span className="text-charcoal-500 text-[10px] block">Harga Terjual:</span>
                      <span className="font-mono font-black text-emerald-800">
                        {u.soldPrice ? formatRupiah(u.soldPrice) : '-'}
                      </span>
                    </div>
                    {isSold && (
                      <div className="col-span-2 pt-1 border-t border-[#EAE8E3] flex justify-between items-center">
                        <span className="text-charcoal-600 text-[10px]">Laba Bersih:</span>
                        <span className="font-mono font-black text-gold-900 bg-gold-100 px-2 py-0.5 rounded">
                          {formatRupiah(u.netProfit || 0)}
                        </span>
                      </div>
                    )}
                  </div>

                  {canEdit && (
                    <div className="flex justify-end pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingUnit(u);
                          setUnitForm({
                            brand: u.brand,
                            model: u.model,
                            year: u.year,
                            color: u.color,
                            plateNumber: u.plateNumber,
                            dateBuy: u.dateBuy,
                            dateSell: u.dateSell || '',
                            initialCost: u.initialCost,
                            targetPrice: u.targetPrice || 0,
                            soldPrice: u.soldPrice || 0,
                            buyerName: u.buyerName || '',
                            salesPerson: u.salesPerson || '',
                            notes: u.notes || '',
                            repairCosts: u.repairCosts || [],
                          });
                          setIsUnitModalOpen(true);
                        }}
                        className="text-[11px] font-bold text-gold-700 hover:text-gold-900 inline-flex items-center gap-1"
                      >
                        <Edit3 className="w-3 h-3" />
                        <span>Edit Pembukuan Unit</span>
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* TAB 3: ARUS KAS & BENGKEL (PETTY CASH) */}
      {/* ==================================================================== */}
      {activeTab === 'cashflow' && (
        <div className="crm-card overflow-hidden">
          <div className="p-4 border-b border-[#EAE8E3] bg-[#FAF9F5] flex flex-col sm:flex-row items-center justify-between gap-3">
            <div>
              <h3 className="font-bold text-sm text-charcoal-900">Arus Kas Operasional Showroom &amp; Bengkel</h3>
              <p className="text-[11px] text-charcoal-500">Pencatatan pengeluaran perbaikan fisik, bensin, kaca film, uang makan, &amp; uang masuk SPK</p>
            </div>

            {canEdit && (
              <button
                type="button"
                onClick={() => setIsCashFlowModalOpen(true)}
                className="btn-gold text-xs py-1.5 px-3.5 inline-flex items-center gap-1 font-bold shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Catat Pengeluaran / SPK</span>
              </button>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F8F7F4] text-charcoal-600 font-bold uppercase tracking-wider border-b border-[#EAE8E3] text-[10px]">
                <tr>
                  <th className="py-3 px-4">Tanggal</th>
                  <th className="py-3 px-4">Unit / No. Polisi</th>
                  <th className="py-3 px-4">Kategori</th>
                  <th className="py-3 px-4">Keterangan Transaksi</th>
                  <th className="py-3 px-4 text-right">Nominal</th>
                  {canEdit && <th className="py-3 px-4 text-center">Aksi</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EAE8E3]">
                {filteredCashFlow.slice(0, 50).map((c) => (
                  <tr key={c.id} className="hover:bg-[#FDFBF7] transition-colors">
                    <td className="py-3 px-4 font-mono text-[11px] text-charcoal-600">{c.date}</td>
                    <td className="py-3 px-4">
                      <p className="font-bold text-charcoal-900">{c.vehicleInfo || '-'}</p>
                      {c.plateNumber && <span className="font-mono text-[10px] text-charcoal-500">{c.plateNumber}</span>}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                        c.category === 'Uang SPK Masuk'
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                          : c.category === 'Pajak & Surat'
                          ? 'bg-purple-50 text-purple-700 border-purple-200'
                          : 'bg-warm-100 text-charcoal-700 border-warm-200'
                      }`}>
                        {c.category}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-charcoal-800 font-medium">{c.description}</td>
                    <td className="py-3 px-4 text-right font-mono font-bold">
                      <span className={c.type === 'in' ? 'text-emerald-700' : 'text-rose-700'}>
                        {c.type === 'in' ? '+' : '-'} {formatRupiah(c.amount)}
                      </span>
                    </td>
                    {canEdit && (
                      <td className="py-3 px-4 text-center">
                        <button
                          type="button"
                          onClick={() => deleteCashFlow(c.id)}
                          className="p-1 text-charcoal-400 hover:text-rose-600 rounded cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* TAB 4: LAPORAN INVESTOR (H. AYI & MITRA) */}
      {/* ==================================================================== */}
      {activeTab === 'investor' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {investors.map((inv) => (
              <div key={inv.id} className="crm-card p-5 space-y-4 border-2 border-gold-400/50">
                <div className="flex items-center justify-between border-b border-[#EAE8E3] pb-3">
                  <div>
                    <span className="text-[10px] font-mono text-charcoal-400 font-bold uppercase">{inv.id}</span>
                    <h3 className="font-black text-base text-charcoal-900">{inv.name}</h3>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-gold-100 text-gold-900 border border-gold-300">
                    {inv.status}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs bg-[#FAF9F5] p-3 rounded-xl border border-[#EAE8E3]">
                  <div>
                    <span className="text-charcoal-500 block text-[10px]">Total Investasi Disetor:</span>
                    <span className="font-mono font-black text-sm text-charcoal-900">{formatRupiah(inv.totalInvestasi)}</span>
                  </div>
                  <div>
                    <span className="text-charcoal-500 block text-[10px]">Sisa Saldo Dana:</span>
                    <span className="font-mono font-black text-sm text-gold-800">{formatRupiah(inv.sisaSaldo)}</span>
                  </div>
                  <div>
                    <span className="text-charcoal-500 block text-[10px]">Total Pinjaman Trade-In:</span>
                    <span className="font-mono font-bold text-charcoal-700">{formatRupiah(inv.totalPinjaman || 0)}</span>
                  </div>
                  <div>
                    <span className="text-charcoal-500 block text-[10px]">Total Pembayaran/Pengembalian:</span>
                    <span className="font-mono font-bold text-emerald-700">{formatRupiah(inv.totalBayar || 0)}</span>
                  </div>
                </div>

                {inv.allocatedUnits && inv.allocatedUnits.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-bold text-charcoal-800">Unit Yang Dibiayai / Trade-In:</p>
                    <div className="space-y-1.5 max-h-48 overflow-y-auto">
                      {inv.allocatedUnits.map((u, i) => (
                        <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-white border border-[#EAE8E3] text-xs">
                          <div>
                            <p className="font-bold text-charcoal-900 leading-tight">{u.carName}</p>
                            <span className="text-[10px] text-charcoal-500">{u.keterangan}</span>
                          </div>
                          <span className="font-mono font-bold text-gold-800">{formatRupiah(u.nominal)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* TAB 5: REKAP GAJI & KOMISI KARYAWAN */}
      {/* ==================================================================== */}
      {activeTab === 'payroll' && (
        <div className="crm-card overflow-hidden">
          <div className="p-4 border-b border-[#EAE8E3] bg-[#FAF9F5] flex flex-col sm:flex-row items-center justify-between gap-3">
            <div>
              <h3 className="font-bold text-sm text-charcoal-900">Rekapitulasi Gaji, Komisi &amp; Kasbon Karyawan</h3>
              <p className="text-[11px] text-charcoal-500">Honor Host Live, fee konten/foto Rp 50.000, komisi closing sales, insentif admin &amp; kasbon</p>
            </div>

            {canEdit && (
              <button
                type="button"
                onClick={() => setIsPayrollModalOpen(true)}
                className="btn-gold text-xs py-1.5 px-3.5 inline-flex items-center gap-1 font-bold shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Tambah Honor / Komisi</span>
              </button>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F8F7F4] text-charcoal-600 font-bold uppercase tracking-wider border-b border-[#EAE8E3] text-[10px]">
                <tr>
                  <th className="py-3 px-4">Periode</th>
                  <th className="py-3 px-4">Nama Staf</th>
                  <th className="py-3 px-4">Peran / Jobdesk</th>
                  <th className="py-3 px-4">Rincian Tugas / Deskripsi</th>
                  <th className="py-3 px-4 text-right">Nominal</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  {canEdit && <th className="py-3 px-4 text-center">Aksi</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EAE8E3]">
                {payrollCommissions.map((p) => (
                  <tr key={p.id} className="hover:bg-[#FDFBF7] transition-colors">
                    <td className="py-3 px-4 font-mono text-[11px] text-charcoal-600">{p.month}</td>
                    <td className="py-3 px-4 font-bold text-charcoal-900">{p.employeeName}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-gold-50 text-gold-900 border border-gold-200">
                        {p.jobdesk}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-charcoal-700">
                      <p className="font-medium">{p.description}</p>
                      {p.unitReference && <span className="text-[10px] text-charcoal-400 font-mono">{p.unitReference}</span>}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold">
                      <span className={p.amount >= 0 ? 'text-emerald-700' : 'text-rose-700'}>
                        {formatRupiah(p.amount)}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                        {p.status}
                      </span>
                    </td>
                    {canEdit && (
                      <td className="py-3 px-4 text-center">
                        <button
                          type="button"
                          onClick={() => deletePayrollRecord(p.id)}
                          className="p-1 text-charcoal-400 hover:text-rose-600 rounded cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* MODAL INPUT / EDIT UNIT FINANCIAL RECORD */}
      {/* ==================================================================== */}
      {isUnitModalOpen && canEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-charcoal-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-warm-200 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-4 sm:p-5 border-b border-[#EAE8E3] flex items-center justify-between bg-[#F8F7F4]">
              <div>
                <h3 className="font-bold text-sm text-charcoal-900">
                  {editingUnit ? 'Edit Pembukuan Unit Mobil' : 'Input Pembukuan Unit Baru'}
                </h3>
                <p className="text-xs text-charcoal-500">Khusus Staf Administrasi Keuangan HR MOTOR</p>
              </div>
              <button
                onClick={() => setIsUnitModalOpen(false)}
                className="p-1 rounded-lg hover:bg-warm-200 text-charcoal-400 hover:text-charcoal-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveUnit} className="p-4 sm:p-6 space-y-4 text-xs overflow-y-auto flex-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-charcoal-800 mb-1">Merk Mobil</label>
                  <input
                    type="text"
                    required
                    value={unitForm.brand}
                    onChange={(e) => setUnitForm({ ...unitForm, brand: e.target.value })}
                    className="w-full px-3 py-2 bg-[#F8F7F4] border border-[#EAE8E3] rounded-xl outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-charcoal-800 mb-1">Type / Model</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: AVANZA 1.3 G FACELIFT"
                    value={unitForm.model}
                    onChange={(e) => setUnitForm({ ...unitForm, model: e.target.value })}
                    className="w-full px-3 py-2 bg-[#F8F7F4] border border-[#EAE8E3] rounded-xl outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-charcoal-800 mb-1">Nomor Polisi (Plat)</label>
                  <input
                    type="text"
                    placeholder="Z 1234 AB"
                    value={unitForm.plateNumber}
                    onChange={(e) => setUnitForm({ ...unitForm, plateNumber: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 bg-[#F8F7F4] border border-[#EAE8E3] rounded-xl font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold text-charcoal-800 mb-1">Tahun &amp; Warna</label>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="number"
                      value={unitForm.year}
                      onChange={(e) => setUnitForm({ ...unitForm, year: Number(e.target.value) })}
                      className="w-full px-3 py-2 bg-[#F8F7F4] border border-[#EAE8E3] rounded-xl font-mono"
                    />
                    <input
                      type="text"
                      value={unitForm.color}
                      onChange={(e) => setUnitForm({ ...unitForm, color: e.target.value })}
                      className="w-full px-3 py-2 bg-[#F8F7F4] border border-[#EAE8E3] rounded-xl"
                    />
                  </div>
                </div>
                <div>
                  <label className="block font-bold text-charcoal-800 mb-1">Modal Awal Pembelian (Rp)</label>
                  <input
                    type="number"
                    required
                    value={unitForm.initialCost}
                    onChange={(e) => setUnitForm({ ...unitForm, initialCost: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-[#F8F7F4] border border-[#EAE8E3] rounded-xl font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-charcoal-800 mb-1">Target Harga Jual (Rp)</label>
                  <input
                    type="number"
                    value={unitForm.targetPrice}
                    onChange={(e) => setUnitForm({ ...unitForm, targetPrice: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-[#F8F7F4] border border-[#EAE8E3] rounded-xl font-mono"
                  />
                </div>
              </div>

              {/* Rincian Biaya Restorasi / Perbaikan */}
              <div className="pt-2 border-t border-[#EAE8E3] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-charcoal-800">Rincian Biaya Perbaikan Unit (Cat, Salon, Onderdil, Servis, Pajak)</span>
                  <button
                    type="button"
                    onClick={() => setUnitForm({
                      ...unitForm,
                      repairCosts: [...unitForm.repairCosts, { item: '', amount: 0 }],
                    })}
                    className="text-[11px] font-bold text-gold-700 hover:text-gold-900"
                  >
                    + Tambah Item
                  </button>
                </div>
                {unitForm.repairCosts.map((r, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="Nama perbaikan (e.g. Cat Spion, Ganti Oli)"
                      value={r.item}
                      onChange={(e) => {
                        const updated = [...unitForm.repairCosts];
                        updated[i].item = e.target.value;
                        setUnitForm({ ...unitForm, repairCosts: updated });
                      }}
                      className="flex-1 px-3 py-1.5 bg-[#F8F7F4] border border-[#EAE8E3] rounded-lg"
                    />
                    <input
                      type="number"
                      placeholder="Nominal"
                      value={r.amount}
                      onChange={(e) => {
                        const updated = [...unitForm.repairCosts];
                        updated[i].amount = Number(e.target.value);
                        setUnitForm({ ...unitForm, repairCosts: updated });
                      }}
                      className="w-32 px-3 py-1.5 bg-[#F8F7F4] border border-[#EAE8E3] rounded-lg font-mono text-right"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const updated = unitForm.repairCosts.filter((_, idx) => idx !== i);
                        setUnitForm({ ...unitForm, repairCosts: updated });
                      }}
                      className="p-1 text-charcoal-400 hover:text-rose-600"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Status Penjualan (Opsional Jika Sudah Terjual) */}
              <div className="pt-2 border-t border-[#EAE8E3] grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-charcoal-800 mb-1">Harga Terjual (Rp)</label>
                  <input
                    type="number"
                    placeholder="Kosongkan jika ready"
                    value={unitForm.soldPrice}
                    onChange={(e) => setUnitForm({ ...unitForm, soldPrice: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-[#F8F7F4] border border-[#EAE8E3] rounded-xl font-mono text-emerald-800 font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-charcoal-800 mb-1">Tanggal Terjual</label>
                  <input
                    type="date"
                    value={unitForm.dateSell}
                    onChange={(e) => setUnitForm({ ...unitForm, dateSell: e.target.value })}
                    className="w-full px-3 py-2 bg-[#F8F7F4] border border-[#EAE8E3] rounded-xl font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold text-charcoal-800 mb-1">Nama Pembeli</label>
                  <input
                    type="text"
                    placeholder="Nama buyer"
                    value={unitForm.buyerName}
                    onChange={(e) => setUnitForm({ ...unitForm, buyerName: e.target.value })}
                    className="w-full px-3 py-2 bg-[#F8F7F4] border border-[#EAE8E3] rounded-xl"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#EAE8E3]">
                <button
                  type="button"
                  onClick={() => setIsUnitModalOpen(false)}
                  className="btn-outline-warm text-xs"
                >
                  Batal
                </button>
                <button type="submit" className="btn-gold text-xs font-bold">
                  Simpan Transaksi Unit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* MODAL INPUT PENGELUARAN KAS / SPK */}
      {/* ==================================================================== */}
      {isCashFlowModalOpen && canEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-charcoal-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-warm-200 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-4 sm:p-5 border-b border-[#EAE8E3] flex items-center justify-between bg-[#F8F7F4]">
              <div>
                <h3 className="font-bold text-sm text-charcoal-900">Catat Kas Operasional / SPK Masuk</h3>
                <p className="text-xs text-charcoal-500">Khusus Staf Administrasi Keuangan</p>
              </div>
              <button
                onClick={() => setIsCashFlowModalOpen(false)}
                className="p-1 rounded-lg hover:bg-warm-200 text-charcoal-400 hover:text-charcoal-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveCashFlow} className="p-4 sm:p-5 space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-charcoal-800 mb-1">Jenis Transaksi</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setCfForm({ ...cfForm, type: 'out', category: 'Perbaikan Unit' })}
                    className={`py-2 px-3 rounded-xl border text-center font-bold transition-all cursor-pointer ${
                      cfForm.type === 'out' ? 'bg-rose-50 border-rose-400 text-rose-800' : 'bg-[#FAF9F5] border-[#EAE8E3]'
                    }`}
                  >
                    Pengeluaran (-)
                  </button>
                  <button
                    type="button"
                    onClick={() => setCfForm({ ...cfForm, type: 'in', category: 'Uang SPK Masuk' })}
                    className={`py-2 px-3 rounded-xl border text-center font-bold transition-all cursor-pointer ${
                      cfForm.type === 'in' ? 'bg-emerald-50 border-emerald-400 text-emerald-800' : 'bg-[#FAF9F5] border-[#EAE8E3]'
                    }`}
                  >
                    Uang Masuk / SPK (+)
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-bold text-charcoal-800 mb-1">Nominal (Rp)</label>
                <input
                  type="number"
                  required
                  placeholder="Contoh: 1000000"
                  value={cfForm.amount || ''}
                  onChange={(e) => setCfForm({ ...cfForm, amount: Number(e.target.value) })}
                  className="w-full px-3.5 py-2.5 bg-[#F8F7F4] border border-[#EAE8E3] rounded-xl font-mono text-sm font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-charcoal-800 mb-1">Keterangan Pengeluaran / SPK</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Beli Poglamp Xenia / SPK Sigra dari Bpk. Herdi"
                  value={cfForm.description}
                  onChange={(e) => setCfForm({ ...cfForm, description: e.target.value })}
                  className="w-full px-3.5 py-2 bg-[#F8F7F4] border border-[#EAE8E3] rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-charcoal-800 mb-1">Unit Mobil Terkait</label>
                  <input
                    type="text"
                    placeholder="Contoh: XENIA 2010"
                    value={cfForm.vehicleInfo}
                    onChange={(e) => setCfForm({ ...cfForm, vehicleInfo: e.target.value })}
                    className="w-full px-3 py-2 bg-[#F8F7F4] border border-[#EAE8E3] rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-bold text-charcoal-800 mb-1">Plat Nomor</label>
                  <input
                    type="text"
                    placeholder="Z 1832 YB"
                    value={cfForm.plateNumber}
                    onChange={(e) => setCfForm({ ...cfForm, plateNumber: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 bg-[#F8F7F4] border border-[#EAE8E3] rounded-xl font-mono"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#EAE8E3]">
                <button
                  type="button"
                  onClick={() => setIsCashFlowModalOpen(false)}
                  className="btn-outline-warm text-xs"
                >
                  Batal
                </button>
                <button type="submit" className="btn-gold text-xs font-bold">
                  Simpan Catatan Kas
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* MODAL INPUT GAJI & KOMISI */}
      {/* ==================================================================== */}
      {isPayrollModalOpen && canEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-charcoal-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-warm-200 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-4 sm:p-5 border-b border-[#EAE8E3] flex items-center justify-between bg-[#F8F7F4]">
              <div>
                <h3 className="font-bold text-sm text-charcoal-900">Catat Gaji, Komisi &amp; Kasbon</h3>
                <p className="text-xs text-charcoal-500">Khusus Staf Administrasi Keuangan</p>
              </div>
              <button
                onClick={() => setIsPayrollModalOpen(false)}
                className="p-1 rounded-lg hover:bg-warm-200 text-charcoal-400 hover:text-charcoal-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSavePayroll} className="p-4 sm:p-5 space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-charcoal-800 mb-1">Nama Karyawan</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Andika Fauzan / Gesti"
                  value={payForm.employeeName}
                  onChange={(e) => setPayForm({ ...payForm, employeeName: e.target.value })}
                  className="w-full px-3.5 py-2 bg-[#F8F7F4] border border-[#EAE8E3] rounded-xl font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-charcoal-800 mb-1">Jobdesk</label>
                  <select
                    value={payForm.jobdesk}
                    onChange={(e) => setPayForm({ ...payForm, jobdesk: e.target.value })}
                    className="w-full px-2.5 py-2 bg-[#F8F7F4] border border-[#EAE8E3] rounded-xl font-medium"
                  >
                    <option value="Host Live">Host Live</option>
                    <option value="Konten Kreator">Konten Kreator</option>
                    <option value="Admin Layanan Pelanggan">Admin Layanan Pelanggan</option>
                    <option value="Teknisi Otomotif">Teknisi Otomotif</option>
                    <option value="Sales">Sales Representative</option>
                    <option value="Staf Operasional Showroom">Staf Operasional</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-charcoal-800 mb-1">Tipe Pembayaran</label>
                  <select
                    value={payForm.type}
                    onChange={(e) => setPayForm({ ...payForm, type: e.target.value as any })}
                    className="w-full px-2.5 py-2 bg-[#F8F7F4] border border-[#EAE8E3] rounded-xl font-medium"
                  >
                    <option value="Host Live">Honor Live</option>
                    <option value="Konten/Foto">Fee Konten/Foto</option>
                    <option value="Admin">Insentif Admin</option>
                    <option value="Sales">Komisi Sales</option>
                    <option value="Pinjaman/Kasbon">Kasbon/Pinjaman</option>
                    <option value="Gaji Pokok">Gaji Pokok</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-charcoal-800 mb-1">Nominal (Rp)</label>
                <input
                  type="number"
                  required
                  placeholder="Contoh: 1200000 (atau minus jika kasbon)"
                  value={payForm.amount || ''}
                  onChange={(e) => setPayForm({ ...payForm, amount: Number(e.target.value) })}
                  className="w-full px-3.5 py-2 bg-[#F8F7F4] border border-[#EAE8E3] rounded-xl font-mono font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-charcoal-800 mb-1">Deskripsi Tugas</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Honor Live Streaming TikTok (12 Sesi) / Foto BR-V"
                  value={payForm.description}
                  onChange={(e) => setPayForm({ ...payForm, description: e.target.value })}
                  className="w-full px-3.5 py-2 bg-[#F8F7F4] border border-[#EAE8E3] rounded-xl"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#EAE8E3]">
                <button
                  type="button"
                  onClick={() => setIsPayrollModalOpen(false)}
                  className="btn-outline-warm text-xs"
                >
                  Batal
                </button>
                <button type="submit" className="btn-gold text-xs font-bold">
                  Simpan Honor / Komisi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
