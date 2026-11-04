'use client';

import React, { useState, useMemo } from 'react';
import { useCrm } from '@/context/CrmContext';
import { VehicleStock, VehicleStockStatus, TransmissionType, FuelType } from '@/types/crm';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  Car,
  Plus,
  Search,
  Filter,
  ArrowUpDown,
  Eye,
  Edit2,
  Trash2,
  Calendar,
  Fuel,
  Gauge,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  MessageCircle,
  X,
  Layers,
  ShoppingBag,
  DollarSign,
  LayoutGrid,
  List,
  CreditCard,
  Download,
  FileSpreadsheet,
  Printer,
  ChevronRight,
  ShieldCheck,
  Check,
  Calculator,
  Share2,
  BadgePercent,
  Clock,
  Camera,
  Wrench,
  Percent,
  Save,
  Pencil,
  MapPin,
} from 'lucide-react';

const COMMON_BRANDS = ['Semua', 'Toyota', 'Honda', 'Daihatsu', 'Mitsubishi', 'Suzuki'];
const TRANSMISSIONS: TransmissionType[] = ['Manual', 'Otomatis', 'CVT'];
const FUELS: FuelType[] = ['Bensin', 'Diesel', 'Hybrid'];
const STATUSES: VehicleStockStatus[] = ['Tersedia', 'Booking', 'Terjual', 'Tidak Aktif'];

// Color config for aesthetic color dots in table and cards
const COLOR_CONFIG: Record<string, { bg: string; dot: string; text: string; label: string }> = {
  KUNING: { bg: 'bg-amber-50 border-amber-200', dot: 'bg-amber-400', text: 'text-amber-800', label: 'Kuning' },
  MERAH: { bg: 'bg-rose-50 border-rose-200', dot: 'bg-rose-500', text: 'text-rose-800', label: 'Merah' },
  HITAM: { bg: 'bg-slate-100 border-slate-300', dot: 'bg-slate-900', text: 'text-slate-900', label: 'Hitam' },
  'ABU-ABU': { bg: 'bg-slate-50 border-slate-200', dot: 'bg-slate-500', text: 'text-slate-700', label: 'Abu-Abu' },
  SILVER: { bg: 'bg-slate-50 border-slate-300', dot: 'bg-slate-400', text: 'text-slate-700', label: 'Silver' },
  PUTIH: { bg: 'bg-white border-slate-200 shadow-xs', dot: 'bg-slate-200 border border-slate-400', text: 'text-slate-700', label: 'Putih' },
  'HITAM PUTIH': { bg: 'bg-slate-50 border-slate-200', dot: 'bg-gradient-to-r from-slate-900 via-slate-500 to-slate-200', text: 'text-slate-800', label: 'Hitam Putih' },
  COKLAT: { bg: 'bg-amber-50/70 border-amber-300', dot: 'bg-[#78350F]', text: 'text-[#78350F]', label: 'Coklat' },
};

// Helper: Deteksi daerah asal nomor polisi (Garut, Bandung, Jakarta, dll.)
function detectPlateRegion(plate?: string): string {
  if (!plate) return 'Garut';
  const clean = plate.trim().toUpperCase();
  if (clean.startsWith('D ') || clean.startsWith('D')) return 'Bandung';
  if (clean.startsWith('B ') || clean.startsWith('B')) return 'Jakarta';
  if (clean.startsWith('F ') || clean.startsWith('F')) return 'Bogor';
  if (clean.startsWith('E ') || clean.startsWith('E')) return 'Cirebon';
  if (clean.startsWith('T ') || clean.startsWith('T')) return 'Karawang';
  if (clean.startsWith('A ') || clean.startsWith('A')) return 'Banten';
  if (clean.startsWith('Z')) {
    const parts = clean.split(/\s+/);
    const suffix = parts.length >= 3 ? parts[2] : (parts.length === 2 ? parts[1].replace(/^[0-9]+/, '') : '');
    if (/^[HIJKLMN]/i.test(suffix)) return 'Tasikmalaya';
    if (/^[ABC]/i.test(suffix)) return 'Sumedang';
    if (/^[TUVW]/i.test(suffix)) return 'Ciamis';
    return 'Garut';
  }
  return 'Garut';
}

// Helper: Ekstraksi brand, model, transmisi dari string Merk / Tipe
function parseMerkType(text: string) {
  const upper = text.trim().toUpperCase();
  const knownBrands = ['TOYOTA', 'HONDA', 'DAIHATSU', 'MITSUBISHI', 'SUZUKI', 'NISSAN', 'WULING', 'HYUNDAI', 'MAZDA', 'ISUZU', 'KIA', 'FORD', 'CHEVROLET'];
  let foundBrand = 'Toyota';
  for (const b of knownBrands) {
    if (upper.startsWith(b)) {
      foundBrand = b.charAt(0) + b.slice(1).toLowerCase();
      break;
    }
  }
  const model = text.replace(new RegExp(`^${foundBrand}\\s*`, 'i'), '').trim() || text.trim();
  const isMatic = /A\/T|CVT|AT|MATIC|OTOMATIS/i.test(upper);
  const isDiesel = /DIESEL|SOLAR/i.test(upper);
  return {
    brand: foundBrand,
    model: model || foundBrand,
    transmission: (isMatic ? 'Otomatis' : 'Manual') as TransmissionType,
    fuel: (isDiesel ? 'Diesel' : 'Bensin') as FuelType,
  };
}

// Helper: Ekstraksi KM dari format ODO ("26RB", "26.000", dll)
function parseOdometer(odoStr: string): number {
  if (!odoStr) return 30000;
  const upper = odoStr.toUpperCase().trim();
  const rbMatch = upper.match(/^([0-9.,]+)\s*RB/i);
  if (rbMatch) {
    const num = parseFloat(rbMatch[1].replace(',', '.'));
    return Math.round(num * 1000);
  }
  const digits = parseInt(upper.replace(/[^0-9]/g, ''), 10);
  return isNaN(digits) ? 30000 : digits;
}

export default function StokUnitPage() {
  const {
    stocks,
    leads,
    addStock,
    updateStock,
    deleteStock,
    formatRupiah,
    formatDate,
    formatWhatsAppLink,
  } = useCrm();

  // Search, Filter, Sort States
  const [searchQuery, setSearchQuery] = useState('');
  const [filterBrand, setFilterBrand] = useState('Semua');
  const [filterStatus, setFilterStatus] = useState<string>('Semua');
  const [filterCreditOnly, setFilterCreditOnly] = useState(false);
  const [filterYearMin, setFilterYearMin] = useState<string>('');
  const [filterYearMax, setFilterYearMax] = useState<string>('');
  const [filterPriceMin, setFilterPriceMin] = useState<string>('');
  const [filterPriceMax, setFilterPriceMax] = useState<string>('');
  const [sortBy, setSortBy] = useState<'no_asc' | 'price_asc' | 'price_desc' | 'year_desc' | 'odo_asc'>('no_asc');
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showCreditCalculatorModal, setShowCreditCalculatorModal] = useState(false);
  const [selectedStock, setSelectedStock] = useState<VehicleStock | null>(null);

  // Credit Calculator State
  const [calcCarPrice, setCalcCarPrice] = useState<number>(150000000);
  const [calcDpNominal, setCalcDpNominal] = useState<number>(25000000);
  const [calcTenorYears, setCalcTenorYears] = useState<number>(4); // 4 years (47x)
  const [calcInterestRate, setCalcInterestRate] = useState<number>(8); // 8% flat/year
  const [calcInstallment35x, setCalcInstallment35x] = useState<string>('');
  const [calcInstallment47x, setCalcInstallment47x] = useState<string>('');
  const [calcInstallment59x, setCalcInstallment59x] = useState<string>('');

  // Form State for Add / Edit
  const [formData, setFormData] = useState<{
    stockNumber: number;
    merkType: string;
    brand: string;
    model: string;
    year: number;
    color: string;
    transmission: TransmissionType;
    fuel: FuelType;
    mileage: number;
    odometerDisplay: string;
    price: number;
    entryDate: string;
    description: string;
    status: VehicleStockStatus;
    licensePlate: string;
    plateRegion: string;
    creditDp: string;
    installment35x: string;
    installment47x: string;
    installment59x: string;
    readinessNotes: string;
    photos: string[];
    newPhotoUrl: string;
  }>({
    stockNumber: 33,
    merkType: '',
    brand: 'Toyota',
    model: '',
    year: 2022,
    color: 'Putih',
    transmission: 'Manual',
    fuel: 'Bensin',
    mileage: 30000,
    odometerDisplay: '30RB',
    price: 150000000,
    entryDate: new Date().toISOString().split('T')[0],
    description: '',
    status: 'Tersedia',
    licensePlate: '',
    plateRegion: 'Garut',
    creditDp: '',
    installment35x: '',
    installment47x: '',
    installment59x: '',
    readinessNotes: '',
    photos: [],
    newPhotoUrl: '',
  });

  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Dashboard Metrics Calculation
  const dashboardStats = useMemo(() => {
    const total = stocks.length;
    const tersedia = stocks.filter((s) => s.status === 'Tersedia').length;
    const booking = stocks.filter((s) => s.status === 'Booking').length;
    const terjual = stocks.filter((s) => s.status === 'Terjual').length;
    const denganKredit = stocks.filter((s) => s.creditDp || s.installment35x || s.installment47x || s.installment59x).length;
    const totalAssetValue = stocks.reduce((acc, s) => acc + (s.price || 0), 0);
    const avgPrice = total > 0 ? Math.round(totalAssetValue / total) : 0;

    return {
      total,
      tersedia,
      booking,
      terjual,
      denganKredit,
      totalAssetValue,
      avgPrice,
    };
  }, [stocks]);

  // Filter and Sort Processing
  const filteredStocks = useMemo(() => {
    return stocks
      .filter((item) => {
        // Search query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const matchMerkType = item.merkType?.toLowerCase().includes(q);
          const matchBrand = item.brand.toLowerCase().includes(q);
          const matchModel = item.model.toLowerCase().includes(q);
          const matchPlate = item.licensePlate?.toLowerCase().includes(q) || item.plateNumber?.toLowerCase().includes(q);
          const matchRegion = (item.plateRegion || detectPlateRegion(item.licensePlate || item.plateNumber))?.toLowerCase().includes(q);
          const matchColor = item.color.toLowerCase().includes(q);
          const matchOdo = item.odometerDisplay?.toLowerCase().includes(q);
          if (!matchMerkType && !matchBrand && !matchModel && !matchPlate && !matchRegion && !matchColor && !matchOdo) {
            return false;
          }
        }

        // Brand filter
        if (filterBrand !== 'Semua' && item.brand !== filterBrand) {
          return false;
        }

        // Status filter
        if (filterStatus !== 'Semua' && item.status !== filterStatus) {
          return false;
        }

        // Credit Promo Only Filter
        if (filterCreditOnly && !(item.creditDp || item.installment35x || item.installment47x || item.installment59x)) {
          return false;
        }

        // Year filter
        if (filterYearMin && item.year < Number(filterYearMin)) return false;
        if (filterYearMax && item.year > Number(filterYearMax)) return false;

        // Price filter
        if (filterPriceMin && item.price < Number(filterPriceMin)) return false;
        if (filterPriceMax && item.price > Number(filterPriceMax)) return false;

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'no_asc') {
          return (a.stockNumber || 999) - (b.stockNumber || 999);
        }
        if (sortBy === 'price_asc') {
          return a.price - b.price;
        }
        if (sortBy === 'price_desc') {
          return b.price - a.price;
        }
        if (sortBy === 'year_desc') {
          return b.year - a.year;
        }
        if (sortBy === 'odo_asc') {
          return a.mileage - b.mileage;
        }
        return 0;
      });
  }, [
    stocks,
    searchQuery,
    filterBrand,
    filterStatus,
    filterCreditOnly,
    filterYearMin,
    filterYearMax,
    filterPriceMin,
    filterPriceMax,
    sortBy,
  ]);

  // Leads matching for selected stock in detail view
  const matchingLeads = useMemo(() => {
    if (!selectedStock) return [];
    const stockBrandLower = selectedStock.brand.toLowerCase().trim();
    const stockModelLower = selectedStock.model.toLowerCase().trim();

    return leads.filter((lead) => {
      if (lead.status === 'Deal') return false;
      const leadBrand = (lead.searchBrand || '').toLowerCase().trim();
      const leadModel = (lead.searchModel || '').toLowerCase().trim();
      const interested = (lead.interestedVehicle || '').toLowerCase().trim();

      const brandMatched =
        (leadBrand && (stockBrandLower.includes(leadBrand) || leadBrand.includes(stockBrandLower))) ||
        (!leadBrand && stockBrandLower.length > 0 && interested.includes(stockBrandLower));

      if (!brandMatched) return false;

      let modelMatched = true;
      if (leadModel) {
        const words = leadModel.split(' ').filter((w) => w.length > 1);
        modelMatched = words.some((w) => stockModelLower.includes(w));
      } else if (interested) {
        const words = interested.split(' ').filter((w) => w.length > 2);
        modelMatched = words.some((w) => stockModelLower.includes(w));
      }
      if (!modelMatched) return false;

      if (lead.searchYearMin && selectedStock.year < lead.searchYearMin) return false;
      if (lead.searchYearMax && selectedStock.year > lead.searchYearMax) return false;
      if (lead.searchBudgetMax && selectedStock.price > lead.searchBudgetMax * 1.15) return false;

      return true;
    });
  }, [selectedStock, leads]);

  // Helper: Hitung estimasi 3 tenor angsuran leasing showroom HR MOTOR (35x, 47x, 59x)
  const calculateEstimatedInstallments = (carPrice: number, dpNominal: number) => {
    const principal = Math.max(0, carPrice - dpNominal);
    if (principal <= 0) {
      return { installment35x: '', installment47x: '', installment59x: '' };
    }

    // 35x (3 Tahun): ~8% flat per tahun (standar showroom HR MOTOR)
    const total35 = principal * (1 + 0.08 * 3);
    const val35 = Math.round(total35 / 35 / 1000);
    const formatted35 = `${val35.toLocaleString('id-ID')} (35x)`;

    // 47x (4 Tahun): ~8.5% flat per tahun
    const total47 = principal * (1 + 0.085 * 4);
    const val47 = Math.round(total47 / 47 / 1000);
    const formatted47 = `${val47.toLocaleString('id-ID')} (47x)`;

    // 59x (5 Tahun): ~9% flat per tahun
    const total59 = principal * (1 + 0.09 * 5);
    const val59 = Math.round(total59 / 59 / 1000);
    const formatted59 = `${val59.toLocaleString('id-ID')} (59x)`;

    return {
      installment35x: formatted35,
      installment47x: formatted47,
      installment59x: formatted59,
    };
  };

  // Open Add Modal
  const handleOpenAdd = () => {
    const nextNum = (stocks || []).reduce((max, s) => Math.max(max, Number(s.stockNumber) || 0), 0) + 1;
    const defaultPrice = 150000000;
    const defaultDp = Math.round(defaultPrice * 0.2);
    const est = calculateEstimatedInstallments(defaultPrice, defaultDp);
    const defaultPlate = `Z ${1100 + nextNum} DA`;

    setFormData({
      stockNumber: nextNum,
      merkType: '',
      brand: 'Toyota',
      model: '',
      year: 2022,
      color: 'Putih',
      transmission: 'Manual',
      fuel: 'Bensin',
      mileage: 30000,
      odometerDisplay: '30RB',
      price: defaultPrice,
      entryDate: new Date().toISOString().split('T')[0],
      description: '',
      status: 'Tersedia',
      licensePlate: defaultPlate,
      plateRegion: detectPlateRegion(defaultPlate),
      creditDp: String(defaultDp),
      installment35x: est.installment35x,
      installment47x: est.installment47x,
      installment59x: est.installment59x,
      readinessNotes: '',
      photos: [
        'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=800&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1502877338535-766e1452684a?w=800&auto=format&fit=crop&q=80',
      ],
      newPhotoUrl: '',
    });
    setFormError('');
    setShowAddModal(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (stock: VehicleStock) => {
    setSelectedStock(stock);
    const carPrice = stock.price || 150000000;
    const defaultDp = stock.creditDp !== undefined && stock.creditDp !== null && stock.creditDp > 0
      ? stock.creditDp
      : Math.round(carPrice * 0.2);
    const est = calculateEstimatedInstallments(carPrice, defaultDp);
    const plate = stock.licensePlate || stock.plateNumber || '';

    setFormData({
      stockNumber: stock.stockNumber || 1,
      merkType: stock.merkType || `${stock.brand} ${stock.model}`,
      brand: stock.brand,
      model: stock.model,
      year: stock.year,
      color: stock.color,
      transmission: stock.transmission,
      fuel: stock.fuel,
      mileage: stock.mileage,
      odometerDisplay: stock.odometerDisplay || `${Math.round(stock.mileage / 1000)}RB`,
      price: stock.price,
      entryDate: stock.entryDate,
      description: stock.description || '',
      status: stock.status,
      licensePlate: plate,
      plateRegion: stock.plateRegion || detectPlateRegion(plate),
      creditDp: stock.creditDp ? String(stock.creditDp) : String(defaultDp),
      installment35x: stock.installment35x || est.installment35x,
      installment47x: stock.installment47x || est.installment47x,
      installment59x: stock.installment59x || est.installment59x,
      readinessNotes: stock.readinessNotes ? stock.readinessNotes.join(', ') : '',
      photos: stock.photos && stock.photos.length > 0 ? [...stock.photos] : [],
      newPhotoUrl: '',
    });
    setFormError('');
    setShowEditModal(true);
  };

  // Helper perubahan Merk / Tipe Unit
  const handleMerkTypeChange = (val: string) => {
    const parsed = parseMerkType(val);
    setFormData((prev) => ({
      ...prev,
      merkType: val,
      brand: parsed.brand,
      model: parsed.model,
      transmission: parsed.transmission,
      fuel: parsed.fuel,
    }));
  };

  // Helper perubahan No Polisi (auto-update wilayah plat jika belum diubah khusus)
  const handlePlateChange = (val: string) => {
    setFormData((prev) => {
      const suggested = detectPlateRegion(val);
      const shouldAutoUpdate = !prev.plateRegion || prev.plateRegion === 'Garut' || prev.plateRegion === detectPlateRegion(prev.licensePlate);
      return {
        ...prev,
        licensePlate: val,
        plateRegion: shouldAutoUpdate ? suggested : prev.plateRegion,
      };
    });
  };

  // Helper perubahan harga & DP di modal Tambah/Edit
  const handlePriceChangeInForm = (newPrice: number) => {
    setFormData((prev) => {
      const currentDpNum = Number(prev.creditDp) || 0;
      const prevPriceNum = Number(prev.price) || 0;
      const wasAutoDp = prevPriceNum > 0 && Math.abs(currentDpNum - Math.round(prevPriceNum * 0.2)) < 2000000;

      let nextDp = prev.creditDp;
      let next35 = prev.installment35x;
      let next47 = prev.installment47x;
      let next59 = prev.installment59x;

      if (!prev.creditDp || wasAutoDp || currentDpNum === 0) {
        const dpVal = Math.round(newPrice * 0.2);
        nextDp = String(dpVal);
        const est = calculateEstimatedInstallments(newPrice, dpVal);
        next35 = est.installment35x;
        next47 = est.installment47x;
        next59 = est.installment59x;
      }

      return {
        ...prev,
        price: newPrice,
        creditDp: nextDp,
        installment35x: next35,
        installment47x: next47,
        installment59x: next59,
      };
    });
  };

  const handleDpChangeInForm = (newDpStr: string) => {
    const dpVal = Number(newDpStr) || 0;
    const price = Number(formData.price) || 0;
    if (dpVal > 0 && price > 0) {
      const est = calculateEstimatedInstallments(price, dpVal);
      setFormData((prev) => ({
        ...prev,
        creditDp: newDpStr,
        installment35x: est.installment35x,
        installment47x: est.installment47x,
        installment59x: est.installment59x,
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        creditDp: newDpStr,
      }));
    }
  };

  const handleAutoFillCreditInForm = (pct: number = 20) => {
    const price = Number(formData.price) || 0;
    if (price <= 0) return;
    const dp = Math.round(price * (pct / 100));
    const est = calculateEstimatedInstallments(price, dp);
    setFormData((prev) => ({
      ...prev,
      creditDp: String(dp),
      installment35x: est.installment35x,
      installment47x: est.installment47x,
      installment59x: est.installment59x,
    }));
  };

  // Open Detail Modal
  const handleOpenDetail = (stock: VehicleStock) => {
    setSelectedStock(stock);
    setShowDetailModal(true);
  };

  // Open Credit Calculator & Package Setting for a specific vehicle
  const handleOpenCalculator = (stock: VehicleStock) => {
    setSelectedStock(stock);
    const carPrice = stock.price || 150000000;
    const defaultDp = stock.creditDp !== undefined && stock.creditDp !== null && stock.creditDp > 0
      ? stock.creditDp
      : Math.round(carPrice * 0.2);
    setCalcCarPrice(carPrice);
    setCalcDpNominal(defaultDp);

    const est = calculateEstimatedInstallments(carPrice, defaultDp);
    setCalcInstallment35x(stock.installment35x || est.installment35x);
    setCalcInstallment47x(stock.installment47x || est.installment47x);
    setCalcInstallment59x(stock.installment59x || est.installment59x);

    setShowCreditCalculatorModal(true);
  };

  const handleUpdateCalcDp = (newDp: number) => {
    setCalcDpNominal(newDp);
    const est = calculateEstimatedInstallments(calcCarPrice, newDp);
    setCalcInstallment35x(est.installment35x);
    setCalcInstallment47x(est.installment47x);
    setCalcInstallment59x(est.installment59x);
  };

  const handleSaveCreditPackage = async () => {
    if (!selectedStock) return;
    setIsSubmitting(true);
    try {
      await updateStock({
        id: selectedStock.id,
        creditDp: calcDpNominal > 0 ? Number(calcDpNominal) : undefined,
        installment35x: calcInstallment35x.trim() || undefined,
        installment47x: calcInstallment47x.trim() || undefined,
        installment59x: calcInstallment59x.trim() || undefined,
        leasingPartners: ['OTO', 'MUF', 'ADIRA'],
      });
      setShowCreditCalculatorModal(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClearCreditPackage = async () => {
    if (!selectedStock) return;
    setIsSubmitting(true);
    try {
      await updateStock({
        id: selectedStock.id,
        creditDp: undefined,
        installment35x: undefined,
        installment47x: undefined,
        installment59x: undefined,
      });
      setShowCreditCalculatorModal(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Photo management
  const handleAddPhoto = () => {
    if (formData.newPhotoUrl.trim()) {
      setFormData({
        ...formData,
        photos: [...formData.photos, formData.newPhotoUrl.trim()],
        newPhotoUrl: '',
      });
    }
  };

  const handleRemovePhoto = (idx: number) => {
    const next = [...formData.photos];
    next.splice(idx, 1);
    setFormData({ ...formData, photos: next });
  };

  // Submit Add
  const handleSubmitAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.merkType.trim() && !formData.model.trim()) {
      setFormError('Merek / Tipe unit kendaraan wajib diisi');
      return;
    }
    if (!formData.price || formData.price <= 0) {
      setFormError('Harga mobil harus lebih besar dari 0');
      return;
    }

    setIsSubmitting(true);
    setFormError('');
    try {
      const res = await addStock({
        stockNumber: Number(formData.stockNumber),
        merkType: formData.merkType.trim() || `${formData.brand.toUpperCase()} ${formData.model.toUpperCase()}`,
        brand: formData.brand,
        model: formData.model.trim() || formData.merkType.trim() || 'Unit Baru',
        year: Number(formData.year),
        color: formData.color.trim() || 'Putih',
        transmission: formData.transmission,
        fuel: formData.fuel,
        mileage: Number(formData.mileage) || 30000,
        odometerDisplay: formData.odometerDisplay.trim() || `${Math.round(Number(formData.mileage) / 1000)}RB`,
        price: Number(formData.price),
        entryDate: formData.entryDate,
        description: formData.description.trim() || `Unit ${formData.merkType || `${formData.brand} ${formData.model}`} tahun ${formData.year}. Bergaransi 100% showroom HR MOTOR Garut.`,
        status: formData.status,
        licensePlate: formData.licensePlate.trim() || `Z ${1200 + Number(formData.stockNumber)} DA`,
        plateRegion: formData.plateRegion.trim() || detectPlateRegion(formData.licensePlate),
        creditDp: formData.creditDp ? Number(formData.creditDp) : undefined,
        installment35x: formData.installment35x.trim() || undefined,
        installment47x: formData.installment47x.trim() || undefined,
        installment59x: formData.installment59x.trim() || undefined,
        leasingPartners: (formData.creditDp || formData.installment35x) ? ['OTO', 'MUF', 'ADIRA'] : undefined,
        readinessNotes: formData.readinessNotes.trim() ? formData.readinessNotes.split(',').map((s) => s.trim()) : undefined,
        photos:
          formData.photos.length > 0
            ? formData.photos
            : ['https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=800&auto=format&fit=crop&q=80'],
      });

      if (res.success) {
        setShowAddModal(false);
      } else {
        setFormError(res.error || 'Gagal menyimpan unit kendaraan');
      }
    } catch {
      setFormError('Terjadi kesalahan jaringan');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Submit Edit
  const handleSubmitEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStock) return;
    if (!formData.merkType.trim() && !formData.model.trim()) {
      setFormError('Merek / Tipe unit kendaraan wajib diisi');
      return;
    }
    if (!formData.price || formData.price <= 0) {
      setFormError('Harga mobil harus lebih besar dari 0');
      return;
    }

    setIsSubmitting(true);
    setFormError('');
    try {
      const res = await updateStock({
        id: selectedStock.id,
        stockNumber: Number(formData.stockNumber),
        merkType: formData.merkType.trim() || `${formData.brand.toUpperCase()} ${formData.model.toUpperCase()}`,
        brand: formData.brand,
        model: formData.model.trim() || formData.merkType.trim() || selectedStock.model,
        year: Number(formData.year),
        color: formData.color.trim(),
        transmission: formData.transmission,
        fuel: formData.fuel,
        mileage: Number(formData.mileage),
        odometerDisplay: formData.odometerDisplay.trim() || `${Math.round(Number(formData.mileage) / 1000)}RB`,
        price: Number(formData.price),
        entryDate: formData.entryDate,
        description: formData.description.trim(),
        status: formData.status,
        licensePlate: formData.licensePlate.trim(),
        plateRegion: formData.plateRegion.trim() || detectPlateRegion(formData.licensePlate),
        creditDp: formData.creditDp ? Number(formData.creditDp) : undefined,
        installment35x: formData.installment35x.trim() || undefined,
        installment47x: formData.installment47x.trim() || undefined,
        installment59x: formData.installment59x.trim() || undefined,
        readinessNotes: formData.readinessNotes.trim() ? formData.readinessNotes.split(',').map((s) => s.trim()) : undefined,
        photos: formData.photos,
      });

      if (res.success) {
        setShowEditModal(false);
      } else {
        setFormError(res.error || 'Gagal memperbarui unit kendaraan');
      }
    } catch {
      setFormError('Terjadi kesalahan jaringan');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Confirm Delete
  const handleConfirmDelete = async () => {
    if (!selectedStock) return;
    setIsSubmitting(true);
    try {
      await deleteStock(selectedStock.id);
      setShowDeleteModal(false);
      setSelectedStock(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Export to Excel (Matches Google Sheet Format + Modern Extras)
  const handleExportExcel = () => {
    const dataToExport = filteredStocks.map((s, idx) => ({
      NO: s.stockNumber || idx + 1,
      'MERK / TYPE': s.merkType || `${s.brand} ${s.model}`,
      TAHUN: s.year,
      WARNA: s.color,
      ODO: s.odometerDisplay || `${Math.round(s.mileage / 1000)}RB`,
      'NO POLISI': s.licensePlate || '-',
      'DAERAH PLAT': s.plateRegion || detectPlateRegion(s.licensePlate),
      'HARGA CASH (Rp)': s.price,
      'KREDIT DP (Rp)': s.creditDp || '-',
      'CICILAN 35x (3 Thn)': s.installment35x || '-',
      'CICILAN 47x (4 Thn)': s.installment47x || '-',
      'CICILAN 59x (5 Thn)': s.installment59x || '-',
      'MITRA LEASING': s.leasingPartners?.join(', ') || 'OTO, MUF, ADIRA',
      'STATUS SHOWROOM': s.status,
      'CATATAN KESIAPAN': s.readinessNotes?.join(' | ') || '-',
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Stok Ready HR MOTOR');

    worksheet['!cols'] = [
      { wch: 5 },
      { wch: 36 },
      { wch: 8 },
      { wch: 12 },
      { wch: 10 },
      { wch: 14 },
      { wch: 18 },
      { wch: 16 },
      { wch: 18 },
      { wch: 18 },
      { wch: 18 },
      { wch: 18 },
      { wch: 14 },
      { wch: 20 },
    ];

    const filename = `UPDATE_STOK_READY_HR_MOTOR_${new Date().toISOString().slice(0, 10)}.xlsx`;
    XLSX.writeFile(workbook, filename);
  };

  // Export to PDF
  const handleExportPDF = () => {
    const doc = new jsPDF('landscape');

    doc.setFontSize(14);
    doc.setTextColor(20, 20, 20);
    doc.text('HR MOTOR GARUT — DAFTAR STOK KENDARAAN READY SHOWROOM', 14, 15);

    doc.setFontSize(8.5);
    doc.setTextColor(100, 116, 139);
    doc.text(`Waktu Cetak: ${new Date().toLocaleDateString('id-ID')} | Total Armada: ${filteredStocks.length} Unit | 100% Bergaransi Resmi Showroom`, 14, 21);

    const headers = [
      ['No', 'Merk / Type Kendaraan', 'Tahun', 'Warna', 'Odo', 'No Polisi', 'Harga Cash', 'Kredit DP', 'Cicilan 35x', 'Cicilan 47x', 'Cicilan 59x', 'Status'],
    ];

    const rows = filteredStocks.map((s, idx) => [
      s.stockNumber || idx + 1,
      s.merkType || `${s.brand} ${s.model}`,
      s.year,
      s.color,
      s.odometerDisplay || `${Math.round(s.mileage / 1000)}RB`,
      s.licensePlate ? `${s.licensePlate} (${s.plateRegion || detectPlateRegion(s.licensePlate)})` : '-',
      formatRupiah(s.price),
      s.creditDp ? formatRupiah(s.creditDp) : '-',
      s.installment35x || '-',
      s.installment47x || '-',
      s.installment59x || '-',
      s.status,
    ]);

    autoTable(doc, {
      head: headers,
      body: rows,
      startY: 25,
      theme: 'grid',
      styles: { fontSize: 7, cellPadding: 2 },
      headStyles: { fillColor: [20, 20, 20], textColor: [217, 154, 50], fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [248, 250, 252] },
    });

    doc.save(`Katalog_Stok_HR_MOTOR_${new Date().toISOString().slice(0, 10)}.pdf`);
  };

  // Calculated Credit for Modal Calculator
  const calculatedMonthly = useMemo(() => {
    const principal = Math.max(0, calcCarPrice - calcDpNominal);
    const months = calcTenorYears === 3 ? 35 : calcTenorYears === 4 ? 47 : calcTenorYears === 5 ? 59 : calcTenorYears * 12;
    const totalInterest = principal * (calcInterestRate / 100) * calcTenorYears;
    const totalPayable = principal + totalInterest;
    return Math.round(totalPayable / months);
  }, [calcCarPrice, calcDpNominal, calcTenorYears, calcInterestRate]);

  return (
    <div className="space-y-6 pb-12">
      {/* Header Showroom & Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 crm-card p-4 sm:p-6 border-b-2 border-b-gold-500/40">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-charcoal-900 text-gold-400 flex items-center justify-center shadow-md shrink-0">
              <Car className="w-5 h-5 text-gold-400" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl lg:text-2xl font-black tracking-tight text-charcoal-900">
                  Stok Unit Kendaraan
                </h1>
                <span className="badge-gold">
                  HR MOTOR Garut
                </span>
              </div>
              <p className="text-xs text-charcoal-500 mt-0.5">
                Katalog digital resmi inventaris mobil showroom: {dashboardStats.total} total armada, {dashboardStats.tersedia} unit siap uji kendara.
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons: Responsive for Mobile & Desktop */}
        <div className="flex items-center gap-2 w-full md:w-auto">
          <button
            onClick={handleOpenAdd}
            className="flex-1 sm:flex-initial btn-gold inline-flex items-center justify-center gap-1.5 text-xs py-2.5 px-4 shadow-sm cursor-pointer"
          >
            <Plus className="w-4 h-4 shrink-0" />
            <span>+ Tambah Unit Baru</span>
          </button>

          <button
            onClick={() => setShowCreditCalculatorModal(true)}
            className="btn-outline-warm inline-flex items-center justify-center gap-1.5 text-xs py-2.5 px-3 cursor-pointer"
            title="Kalkulator Simulasi Kredit Showroom"
          >
            <Calculator className="w-4 h-4 text-gold-600 shrink-0" />
            <span className="hidden sm:inline">Kalkulator</span>
          </button>

          <button
            onClick={handleExportExcel}
            className="btn-outline-warm inline-flex items-center justify-center gap-1.5 text-xs py-2.5 px-3 text-emerald-800 cursor-pointer"
            title="Ekspor Format Spreadsheet Excel"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="hidden sm:inline">Excel</span>
          </button>

          <button
            onClick={handleExportPDF}
            className="btn-outline-warm inline-flex items-center justify-center gap-1.5 text-xs py-2.5 px-3 text-rose-800 cursor-pointer"
            title="Unduh Katalog PDF"
          >
            <Download className="w-4 h-4 text-rose-600 shrink-0" />
            <span className="hidden sm:inline">PDF</span>
          </button>
        </div>
      </div>

      {/* DASHBOARD RINGKASAN STOK UNIT (Desktop 4 Cards) */}
      <div className="hidden sm:grid sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Unit */}
        <div className="crm-card p-3 sm:p-4">
          <div className="flex items-center justify-between text-charcoal-500 mb-1.5 sm:mb-2">
            <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-charcoal-700">Total Stok</span>
            <div className="w-6 h-6 rounded-lg bg-charcoal-100 flex items-center justify-center text-charcoal-700 shrink-0">
              <Layers className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-charcoal-900">{dashboardStats.total} Unit</div>
          <div className="text-[10px] text-charcoal-500 mt-0.5 truncate">Armada Showroom</div>
        </div>

        {/* Ready Stock */}
        <div className="crm-card p-3 sm:p-4 border-l-4 border-l-emerald-500">
          <div className="flex items-center justify-between text-charcoal-500 mb-1.5 sm:mb-2">
            <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-emerald-800">Unit Tersedia</span>
            <div className="w-6 h-6 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-emerald-700">{dashboardStats.tersedia} Unit</div>
          <div className="text-[10px] text-emerald-800 mt-0.5 font-semibold truncate">Siap Uji Kendara</div>
        </div>

        {/* Booking */}
        <div className="crm-card p-3 sm:p-4 border-l-4 border-l-amber-500">
          <div className="flex items-center justify-between text-charcoal-500 mb-1.5 sm:mb-2">
            <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-amber-800">Dibooking</span>
            <div className="w-6 h-6 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
              <Clock className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-amber-700">{dashboardStats.booking} Unit</div>
          <div className="text-[10px] text-amber-800 mt-0.5 font-medium truncate">Tanda Jadi Masuk</div>
        </div>

        {/* Terjual / Sold Out */}
        <div className="crm-card p-3 sm:p-4 border-l-4 border-l-charcoal-500">
          <div className="flex items-center justify-between text-charcoal-500 mb-1.5 sm:mb-2">
            <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-charcoal-700">Sudah Terjual</span>
            <div className="w-6 h-6 rounded-lg bg-charcoal-100 text-charcoal-700 flex items-center justify-center shrink-0">
              <ShoppingBag className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-charcoal-800">{dashboardStats.terjual} Unit</div>
          <div className="text-[10px] text-charcoal-500 mt-0.5 truncate">Transaksi Selesai</div>
        </div>
      </div>

      {/* QUICK STATUS PILL BAR FOR MOBILE (1-Tap Filter, Rapi & Tidak Makan Layar) */}
      <div className="sm:hidden crm-card p-1.5 bg-[#F8F7F4] border border-[#EAE8E3] rounded-2xl grid grid-cols-4 gap-1 text-center shadow-2xs">
        <button
          type="button"
          onClick={() => setFilterStatus('Semua')}
          className={`py-2 px-1 rounded-xl transition-all cursor-pointer ${
            filterStatus === 'Semua'
              ? 'bg-charcoal-900 text-gold-400 font-bold shadow-xs'
              : 'text-charcoal-600 hover:text-charcoal-900'
          }`}
        >
          <span className="text-[10px] block opacity-80 uppercase tracking-wider">Semua</span>
          <span className="text-sm font-black">{dashboardStats.total}</span>
        </button>

        <button
          type="button"
          onClick={() => setFilterStatus('Tersedia')}
          className={`py-2 px-1 rounded-xl transition-all cursor-pointer ${
            filterStatus === 'Tersedia'
              ? 'bg-emerald-600 text-white font-bold shadow-xs'
              : 'text-emerald-800 hover:text-emerald-950'
          }`}
        >
          <span className="text-[10px] block opacity-90 uppercase tracking-wider">Ready</span>
          <span className="text-sm font-black text-emerald-600">{dashboardStats.tersedia}</span>
        </button>

        <button
          type="button"
          onClick={() => setFilterStatus('Booking')}
          className={`py-2 px-1 rounded-xl transition-all cursor-pointer ${
            filterStatus === 'Booking'
              ? 'bg-amber-500 text-charcoal-950 font-bold shadow-xs'
              : 'text-amber-800 hover:text-amber-950'
          }`}
        >
          <span className="text-[10px] block opacity-90 uppercase tracking-wider">Dibooking</span>
          <span className="text-sm font-black text-amber-700">{dashboardStats.booking}</span>
        </button>

        <button
          type="button"
          onClick={() => setFilterStatus('Terjual')}
          className={`py-2 px-1 rounded-xl transition-all cursor-pointer ${
            filterStatus === 'Terjual'
              ? 'bg-charcoal-800 text-white font-bold shadow-xs'
              : 'text-charcoal-500 hover:text-charcoal-800'
          }`}
        >
          <span className="text-[10px] block opacity-80 uppercase tracking-wider">Terjual</span>
          <span className="text-sm font-black text-charcoal-700">{dashboardStats.terjual}</span>
        </button>
      </div>

      {/* FILTER & PENCARIAN MODERN */}
      <div className="crm-card p-3.5 sm:p-4 space-y-3.5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Search bar with quick filter toggle for mobile */}
          <div className="flex items-center gap-2 flex-1">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-charcoal-400" />
              <input
                type="text"
                placeholder="Cari unit: 'Ayla', 'Brio', 'Pajero', 'Z 1083 NV', 'Abu-Abu'..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-8 py-2 text-xs bg-warm-50 border border-warm-200 rounded-xl text-charcoal-900 focus:outline-none focus:border-gold-500 font-medium"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-charcoal-400 hover:text-charcoal-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Mobile Filter Toggle Button */}
            <button
              type="button"
              onClick={() => setShowMobileFilters(!showMobileFilters)}
              className={`sm:hidden p-2 rounded-xl border text-xs font-bold flex items-center gap-1 shrink-0 cursor-pointer ${
                showMobileFilters || filterYearMin || filterYearMax || filterPriceMax || filterCreditOnly
                  ? 'bg-gold-500 text-charcoal-950 border-gold-600'
                  : 'bg-warm-50 border-warm-200 text-charcoal-700'
              }`}
              title="Filter Lanjutan"
            >
              <Filter className="w-4 h-4" />
            </button>
          </div>

          {/* Quick Filter Pills (Brand + Promo Kredit) */}
          <div className="flex items-center gap-1.5 flex-wrap overflow-x-auto pb-1 sm:pb-0">
            {/* Brand Pills */}
            <div className="flex items-center bg-warm-100 p-1 rounded-xl gap-1 text-xs shrink-0">
              {COMMON_BRANDS.map((brand) => (
                <button
                  key={brand}
                  type="button"
                  onClick={() => setFilterBrand(brand)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all shrink-0 cursor-pointer ${
                    filterBrand === brand
                      ? 'bg-charcoal-900 text-gold-400 shadow-xs'
                      : 'text-charcoal-600 hover:text-charcoal-900'
                  }`}
                >
                  {brand}
                </button>
              ))}
            </div>

            {/* Filter Paket Kredit Only */}
            <button
              onClick={() => setFilterCreditOnly(!filterCreditOnly)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
                filterCreditOnly
                  ? 'bg-gold-500 text-charcoal-950 border-gold-600 shadow-xs'
                  : 'bg-warm-50 text-charcoal-700 border-warm-200 hover:border-gold-400'
              }`}
            >
              <BadgePercent className="w-3.5 h-3.5" />
              <span>Promo Kredit ({stocks.filter((s) => s.creditDp || s.installment35x).length})</span>
            </button>
          </div>
        </div>

        {/* Secondary filters row (collapsible on mobile, inline on desktop) */}
        <div className={`${showMobileFilters ? 'flex' : 'hidden sm:flex'} flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-warm-200/80 text-xs`}>
          <div className="flex flex-wrap items-center gap-2 text-charcoal-500">
            <span className="flex items-center gap-1 font-semibold text-charcoal-700">
              <Filter className="w-3.5 h-3.5 text-gold-600" /> Filter Lanjutan:
            </span>

            {/* Filter Status (Desktop) */}
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-2.5 py-1.5 bg-warm-50 border border-warm-200 rounded-xl text-xs font-medium text-charcoal-900 focus:outline-none focus:border-gold-500"
            >
              <option value="Semua">Semua Status ({stocks.length})</option>
              <option value="Tersedia">Tersedia Siap Jual ({dashboardStats.tersedia})</option>
              <option value="Booking">Dibooking Konsumen ({dashboardStats.booking})</option>
              <option value="Terjual">Sudah Terjual ({dashboardStats.terjual})</option>
            </select>

            {/* Tahun */}
            <div className="flex items-center gap-1 bg-warm-50 px-2 py-1 rounded-xl border border-warm-200">
              <span className="text-[11px] text-charcoal-500">Tahun:</span>
              <input
                type="number"
                placeholder="2010"
                value={filterYearMin}
                onChange={(e) => setFilterYearMin(e.target.value)}
                className="w-12 bg-transparent text-charcoal-900 focus:outline-none text-center text-xs font-semibold"
              />
              <span className="text-charcoal-400">-</span>
              <input
                type="number"
                placeholder="2026"
                value={filterYearMax}
                onChange={(e) => setFilterYearMax(e.target.value)}
                className="w-12 bg-transparent text-charcoal-900 focus:outline-none text-center text-xs font-semibold"
              />
            </div>

            {/* Harga */}
            <div className="flex items-center gap-1 bg-warm-50 px-2 py-1 rounded-xl border border-warm-200">
              <span className="text-[11px] text-charcoal-500">Harga Max (Jt):</span>
              <input
                type="number"
                placeholder="cth: 200"
                value={filterPriceMax ? Number(filterPriceMax) / 1000000 : ''}
                onChange={(e) => setFilterPriceMax(e.target.value ? String(Number(e.target.value) * 1000000) : '')}
                className="w-20 bg-transparent text-charcoal-900 focus:outline-none text-center text-xs font-semibold"
              />
            </div>

            {(filterBrand !== 'Semua' ||
              filterStatus !== 'Semua' ||
              filterCreditOnly ||
              filterYearMin ||
              filterYearMax ||
              filterPriceMax ||
              searchQuery) && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setFilterBrand('Semua');
                  setFilterStatus('Semua');
                  setFilterCreditOnly(false);
                  setFilterYearMin('');
                  setFilterYearMax('');
                  setFilterPriceMin('');
                  setFilterPriceMax('');
                }}
                className="text-gold-700 hover:text-gold-800 font-bold underline px-1 text-xs cursor-pointer"
              >
                Reset Filter
              </button>
            )}
          </div>

          {/* Sort By */}
          <div className="flex items-center gap-2 ml-auto">
            <span className="text-charcoal-500 flex items-center gap-1 text-xs">
              <ArrowUpDown className="w-3.5 h-3.5 text-gold-600" /> Urutkan:
            </span>
            <select
              value={sortBy}
              onChange={(e: any) => setSortBy(e.target.value)}
              className="px-2.5 py-1.5 bg-warm-50 border border-warm-200 rounded-xl text-xs font-medium text-charcoal-900 focus:outline-none focus:border-gold-500"
            >
              <option value="no_asc">No. Urut Showroom (1-32)</option>
              <option value="price_asc">Harga Termurah</option>
              <option value="price_desc">Harga Termahal</option>
              <option value="year_desc">Tahun Terbaru</option>
              <option value="odo_asc">Kilometer Terendah</option>
            </select>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TABEL STOK KENDARAAN (DESKTOP TABEL + MOBILE CARD VIEW PAS LAYAR)         */}
      {/* ========================================================================= */}
      <div className="crm-card overflow-hidden">
        {/* DESKTOP TABLE VIEW (MD+): Tabel Spreadsheet Lengkap */}
        <div className="hidden md:block overflow-x-auto w-full">
          <table className="crm-table w-full min-w-[980px] text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#141414] text-white border-b border-[#2A2A2A]">
                  <th className="py-3.5 px-3 text-center w-12 text-[11px] font-bold text-gold-400">NO</th>
                  <th className="py-3.5 px-4 text-[11px] font-bold">MERK / TYPE KENDARAAN</th>
                  <th className="py-3.5 px-2.5 text-center text-[11px] font-bold">TAHUN</th>
                  <th className="py-3.5 px-3.5 text-left text-[11px] font-bold">WARNA</th>
                  <th className="py-3.5 px-3 text-center text-[11px] font-bold">ODO</th>
                  <th className="py-3.5 px-3 text-center text-[11px] font-bold">NO POLISI &amp; DAERAH</th>
                  <th className="py-3.5 px-4 text-right text-[11px] font-bold text-gold-400">HARGA CASH</th>
                  <th className="py-3.5 px-4 text-center text-[11px] font-bold text-amber-300">PAKET KREDIT (DP & TENOR)</th>
                  <th className="py-3.5 px-3 text-center text-[11px] font-bold">STATUS</th>
                  <th className="py-3.5 px-3 text-center text-[11px] font-bold w-28">AKSI</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-warm-200/80">
                {filteredStocks.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="py-12 text-center text-charcoal-400">
                      <Car className="w-10 h-10 mx-auto text-charcoal-300 mb-2 stroke-[1.5]" />
                      <p className="text-sm font-semibold text-charcoal-700">Tidak ada unit kendaraan yang sesuai kriteria</p>
                      <p className="text-xs text-charcoal-400 mt-1">Coba ubah kata kunci pencarian atau sesuaikan filter showroom.</p>
                    </td>
                  </tr>
                ) : (
                  filteredStocks.map((stock, idx) => {
                    const colorKey = (stock.color || '').toUpperCase().trim();
                    const colorStyle = COLOR_CONFIG[colorKey] || {
                      bg: 'bg-warm-100 border-warm-200',
                      dot: 'bg-charcoal-400',
                      text: 'text-charcoal-700',
                      label: stock.color,
                    };

                    return (
                      <tr
                        key={stock.id}
                        onClick={() => handleOpenDetail(stock)}
                        className="hover:bg-amber-50/40 transition-colors group cursor-pointer"
                      >
                        {/* 1. NO */}
                        <td className="py-3.5 px-3 text-center font-bold font-mono">
                          <span className="w-7 h-7 inline-flex items-center justify-center rounded-lg bg-warm-100 text-charcoal-800 text-xs font-bold border border-warm-200 shadow-xs">
                            {stock.stockNumber || idx + 1}
                          </span>
                        </td>

                        {/* 2. MERK / TYPE */}
                        <td className="py-3.5 px-4 font-semibold text-charcoal-900">
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-gold-100/90 text-gold-950 border border-gold-300/70 shadow-xs shrink-0">
                              {stock.brand}
                            </span>
                            <span className="font-bold text-xs text-charcoal-950 group-hover:text-gold-700 transition-colors">
                              {stock.model}
                            </span>
                          </div>
                          <div className="text-[10px] text-charcoal-500 flex items-center flex-wrap gap-1.5 mt-1">
                            <span className="px-1.5 py-0.2 rounded bg-warm-100 font-semibold text-charcoal-700 border border-warm-200">
                              {stock.transmission}
                            </span>
                            <span className="text-charcoal-300">•</span>
                            <span className="text-charcoal-600 font-medium">{stock.fuel}</span>
                            {stock.readinessNotes && stock.readinessNotes.length > 0 && (
                              <>
                                <span className="text-charcoal-300">•</span>
                                <span className="text-amber-800 font-bold bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200 text-[9px]">
                                  {stock.readinessNotes.join(', ')}
                                </span>
                              </>
                            )}
                            {stock.leasingPartners && stock.leasingPartners.length > 0 && (
                              <>
                                <span className="text-charcoal-300">•</span>
                                <span className="text-gold-800 font-bold bg-gold-50 px-1.5 py-0.2 rounded border border-gold-200 text-[9px]">
                                  Mitra: {stock.leasingPartners.join(', ')}
                                </span>
                              </>
                            )}
                          </div>
                        </td>

                        {/* 3. TAHUN */}
                        <td className="py-3.5 px-2.5 text-center font-black text-charcoal-900">
                          <span className="px-2.5 py-1 rounded-lg bg-warm-100 font-extrabold text-charcoal-800 border border-warm-200 text-xs shadow-xs">
                            {stock.year}
                          </span>
                        </td>

                        {/* 4. WARNA */}
                        <td className="py-3.5 px-3.5">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${colorStyle.bg} ${colorStyle.text} shadow-xs whitespace-nowrap`}
                          >
                            <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${colorStyle.dot}`} />
                            <span>{colorStyle.label}</span>
                          </span>
                        </td>

                        {/* 5. ODO */}
                        <td className="py-3.5 px-3 text-center whitespace-nowrap">
                          <span className="font-mono text-xs font-bold text-charcoal-800 bg-warm-50 px-2.5 py-1 rounded-lg border border-warm-200 shadow-xs">
                            {stock.odometerDisplay ? `${stock.odometerDisplay} km` : `${stock.mileage.toLocaleString('id-ID')} km`}
                          </span>
                        </td>

                        {/* 6. NO POLISI & DAERAH */}
                        <td className="py-3.5 px-3 text-center whitespace-nowrap font-mono text-xs font-bold text-charcoal-800">
                          {stock.licensePlate ? (
                            <div className="inline-flex flex-col items-center gap-1">
                              <span className="bg-charcoal-900 text-gold-400 font-bold px-2.5 py-1 rounded-md border border-charcoal-700 text-xs tracking-wider shadow-xs">
                                {stock.licensePlate}
                              </span>
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[10px] font-extrabold bg-warm-100 text-charcoal-700 border border-warm-200">
                                <MapPin className="w-2.5 h-2.5 text-gold-600" />
                                {stock.plateRegion || detectPlateRegion(stock.licensePlate)}
                              </span>
                            </div>
                          ) : (
                            <span className="text-charcoal-400 text-[11px] italic">Siap Balik Nama</span>
                          )}
                        </td>

                        {/* 7. HARGA CASH */}
                        <td className="py-3.5 px-4 text-right font-black text-sm text-charcoal-900 whitespace-nowrap">
                          <span className="block font-black text-sm text-charcoal-950">{formatRupiah(stock.price)}</span>
                          <span className="text-[10px] text-charcoal-400 font-medium">Cash OTR</span>
                        </td>

                        {/* 8. PAKET KREDIT (DP & TENOR) */}
                        <td className="py-3.5 px-4 text-center whitespace-nowrap">
                          {stock.creditDp || stock.installment35x || stock.installment47x || stock.installment59x ? (
                            <div
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenCalculator(stock);
                              }}
                              className="inline-flex flex-col items-center gap-1 cursor-pointer group/kredit p-1 rounded-lg hover:bg-gold-50/50 transition-all"
                              title="Klik untuk ubah / sesuaikan estimasi DP & cicilan unit ini"
                            >
                              {stock.creditDp && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-gold-100/80 text-gold-950 border border-gold-300 font-extrabold text-[10px] shadow-xs group-hover/kredit:bg-gold-200">
                                  DP {formatRupiah(stock.creditDp)}
                                  <Pencil className="w-2.5 h-2.5 text-gold-700 ml-0.5 opacity-60 group-hover/kredit:opacity-100" />
                                </span>
                              )}
                              <div className="flex items-center gap-1 text-[10px] text-charcoal-600 font-mono">
                                {stock.installment35x && (
                                  <span className="bg-warm-100 px-1.5 py-0.5 rounded border border-warm-200" title="Cicilan 35x (3 Thn)">
                                    <span className="text-charcoal-400 text-[9px]">35x:</span> {stock.installment35x}
                                  </span>
                                )}
                                {stock.installment47x && (
                                  <span className="bg-warm-100 px-1.5 py-0.5 rounded border border-warm-200" title="Cicilan 47x (4 Thn)">
                                    <span className="text-charcoal-400 text-[9px]">47x:</span> {stock.installment47x}
                                  </span>
                                )}
                                {stock.installment59x && (
                                  <span className="bg-warm-100 px-1.5 py-0.5 rounded border border-warm-200" title="Cicilan 59x (5 Thn)">
                                    <span className="text-charcoal-400 text-[9px]">59x:</span> {stock.installment59x}
                                  </span>
                                )}
                              </div>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenCalculator(stock);
                              }}
                              className="text-[10px] text-gold-900 font-bold hover:bg-gold-100 bg-gold-50/90 px-2.5 py-1 rounded-lg border border-gold-300 shadow-2xs transition-all flex items-center gap-1 mx-auto cursor-pointer"
                              title="Klik untuk memasukkan DP & estimasi cicilan unit ini"
                            >
                              <Calculator className="w-3 h-3 text-gold-600" />
                              <span>+ Hitung Kredit</span>
                            </button>
                          )}
                        </td>

                        {/* 9. STATUS */}
                        <td className="py-3.5 px-3 text-center whitespace-nowrap">
                          {stock.status === 'Tersedia' && (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 shadow-xs">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                              Ready
                            </span>
                          )}
                          {stock.status === 'Booking' && (
                            <div className="flex flex-col items-center gap-1">
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300 shadow-xs">
                                <Clock className="w-3.5 h-3.5 text-amber-700" />
                                BOKING
                              </span>
                              <span className="text-[10px] text-amber-950 font-bold bg-amber-50 px-2 py-0.5 rounded border border-amber-200 text-center max-w-[140px] truncate" title={`Dipesan: ${stock.bookingCustomerName || 'Pelanggan'} (${stock.bookingLeasing || 'Leasing'})`}>
                                {stock.bookingCustomerName || 'Pelanggan'} • {stock.bookingLeasing || 'Leasing'}
                              </span>
                            </div>
                          )}
                          {stock.status === 'Terjual' && (
                            <div className="flex flex-col items-center gap-1">
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-800 border border-rose-200 shadow-xs">
                                <CheckCircle2 className="w-3.5 h-3.5 text-rose-600" />
                                SOLD OUT
                              </span>
                              {stock.soldToCustomerName && (
                                <span className="text-[10px] text-rose-900 font-medium bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200 text-center max-w-[130px] truncate" title={`Pembeli: ${stock.soldToCustomerName}`}>
                                  {stock.soldToCustomerName}
                                </span>
                              )}
                            </div>
                          )}
                        </td>

                        {/* 10. AKSI */}
                        <td className="py-3.5 px-3 text-center" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleOpenCalculator(stock)}
                              title="Simulasi Kredit"
                              className="p-1.5 rounded-md text-gold-700 bg-gold-50 hover:bg-gold-100 border border-gold-200 transition-colors shadow-xs"
                            >
                              <Calculator className="w-3.5 h-3.5" />
                            </button>

                            <button
                              type="button"
                              onClick={() => handleOpenDetail(stock)}
                              title="Lihat Detail Spesifikasi"
                              className="p-1.5 rounded-md text-charcoal-700 bg-warm-100 hover:bg-warm-200 transition-colors shadow-xs"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>

                            <button
                              type="button"
                              onClick={() => handleOpenEdit(stock)}
                              title="Edit Data Unit"
                              className="p-1.5 rounded-md text-blue-700 bg-blue-50 hover:bg-blue-100 transition-colors shadow-xs"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                setSelectedStock(stock);
                                setShowDeleteModal(true);
                              }}
                              title="Hapus Unit"
                              className="p-1.5 rounded-md text-rose-700 bg-rose-50 hover:bg-rose-100 transition-colors shadow-xs"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
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

          {/* MOBILE TABLE VIEW (HP) - Berbentuk Tabel Penuh, Tanpa Foto, Pas 100% Layar Tanpa Geser Kiri-Kanan */}
          <div className="md:hidden w-full overflow-hidden bg-white">
            <table className="w-full text-left border-collapse table-fixed text-xs">
              <thead>
                <tr className="bg-[#141414] text-white border-b border-[#2A2A2A]">
                  <th className="py-2.5 px-1.5 text-center w-8 text-[10px] font-bold text-gold-400">NO</th>
                  <th className="py-2.5 px-2 text-[10px] font-bold text-warm-100">UNIT & SPESIFIKASI</th>
                  <th className="py-2.5 px-2 text-right w-28 sm:w-32 text-[10px] font-bold text-gold-400">HARGA & STATUS</th>
                  <th className="py-2.5 px-1 text-center w-10 text-[10px] font-bold text-warm-200">AKSI</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-warm-200/80">
                {filteredStocks.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-12 px-4 text-center text-charcoal-400">
                      <Car className="w-10 h-10 mx-auto text-charcoal-300 mb-2 stroke-[1.5]" />
                      <p className="text-sm font-bold text-charcoal-800">Tidak ada unit kendaraan</p>
                      <p className="text-xs text-charcoal-500 mt-0.5">Sesuaikan filter atau kata kunci pencarian.</p>
                      <button
                        type="button"
                        onClick={() => {
                          setSearchQuery('');
                          setFilterBrand('Semua');
                          setFilterStatus('Semua');
                          setFilterCreditOnly(false);
                          setFilterYearMin('');
                          setFilterYearMax('');
                          setFilterPriceMin('');
                          setFilterPriceMax('');
                        }}
                        className="mt-3 px-3 py-1.5 rounded-xl bg-warm-100 hover:bg-warm-200 text-charcoal-800 text-xs font-bold transition-colors cursor-pointer"
                      >
                        Reset Filter
                      </button>
                    </td>
                  </tr>
                ) : (
                  filteredStocks.map((stock, idx) => {
                    const colorKey = (stock.color || '').toUpperCase().trim();
                    const colorStyle = COLOR_CONFIG[colorKey] || {
                      bg: 'bg-warm-100 border-warm-200',
                      dot: 'bg-charcoal-400',
                      text: 'text-charcoal-700',
                      label: stock.color,
                    };

                    const isBooking = stock.status === 'Booking';
                    const isTerjual = stock.status === 'Terjual';

                    return (
                      <tr
                        key={stock.id}
                        onClick={() => handleOpenDetail(stock)}
                        className="hover:bg-amber-50/50 transition-colors cursor-pointer group"
                      >
                        {/* 1. NO URUT */}
                        <td className="py-3 px-1.5 text-center align-top font-mono font-bold">
                          <span className="w-6 h-6 inline-flex items-center justify-center rounded-md bg-warm-100 text-charcoal-900 text-[11px] font-extrabold border border-warm-200/80 shadow-2xs">
                            {stock.stockNumber || idx + 1}
                          </span>
                        </td>

                        {/* 2. UNIT & SPESIFIKASI */}
                        <td className="py-3 px-2 align-top min-w-0">
                          {/* Brand & Model Name */}
                          <div className="flex items-center gap-1 flex-wrap">
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-black uppercase tracking-wider bg-gold-100 text-gold-950 border border-gold-300/70 shrink-0">
                              {stock.brand}
                            </span>
                            <span className="font-bold text-xs text-charcoal-950 group-hover:text-gold-700 transition-colors leading-tight">
                              {stock.model}
                            </span>
                          </div>

                          {/* Sub-spesifikasi: Tahun, Transmisi, BBM */}
                          <div className="flex items-center gap-1 text-[10px] text-charcoal-600 mt-1 flex-wrap leading-tight">
                            <span className="font-bold text-charcoal-800 bg-warm-100 px-1 rounded border border-warm-200">
                              {stock.year}
                            </span>
                            <span>•</span>
                            <span>{stock.transmission}</span>
                            <span>•</span>
                            <span>{stock.fuel}</span>
                          </div>

                          {/* Plat Polisi & Daerah & Warna & Odo */}
                          <div className="flex items-center gap-1 text-[10px] mt-1 flex-wrap leading-tight">
                            {stock.licensePlate ? (
                              <span className="inline-flex items-center gap-1">
                                <span className="bg-charcoal-900 text-gold-400 font-mono text-[9px] font-bold px-1.5 py-0.2 rounded border border-charcoal-700">
                                  {stock.licensePlate}
                                </span>
                                <span className="text-[9px] font-extrabold text-charcoal-700 bg-warm-100 px-1 py-0.2 rounded border border-warm-200 inline-flex items-center gap-0.5">
                                  <MapPin className="w-2 h-2 text-gold-600" />
                                  {stock.plateRegion || detectPlateRegion(stock.licensePlate)}
                                </span>
                              </span>
                            ) : (
                              <span className="text-charcoal-400 text-[9px] italic">
                                Siap Balik Nama
                              </span>
                            )}
                            <span className={`inline-flex items-center gap-1 px-1.5 py-0.2 rounded border text-[9px] font-semibold ${colorStyle.bg} ${colorStyle.text}`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${colorStyle.dot}`} />
                              {colorStyle.label}
                            </span>
                            <span className="text-charcoal-500 font-mono text-[9px]">
                              {stock.odometerDisplay ? `${stock.odometerDisplay} km` : `${stock.mileage.toLocaleString('id-ID')} km`}
                            </span>
                          </div>

                          {/* Info Booking / Terjual jika ada */}
                          {isBooking && (stock.bookingCustomerName || stock.bookingLeasing) && (
                            <div className="mt-1 text-[9px] bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 text-amber-900 leading-tight">
                              ⏳ {stock.bookingCustomerName ? `Pmsn: ${stock.bookingCustomerName}` : ''} {stock.bookingLeasing ? `(${stock.bookingLeasing})` : ''}
                            </div>
                          )}
                          {isTerjual && stock.soldToCustomerName && (
                            <div className="mt-1 text-[9px] bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200 text-rose-900 leading-tight">
                              🏁 Pembeli: {stock.soldToCustomerName}
                            </div>
                          )}
                        </td>

                        {/* 3. HARGA CASH & PAKET KREDIT & STATUS */}
                        <td className="py-3 px-2 text-right align-top min-w-0">
                          {/* Status Badge */}
                          <div className="flex justify-end mb-1">
                            {stock.status === 'Tersedia' && (
                              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded text-[9px] font-bold bg-emerald-100 text-emerald-900 border border-emerald-300">
                                <CheckCircle2 className="w-2.5 h-2.5 text-emerald-700" />
                                Ready
                              </span>
                            )}
                            {stock.status === 'Booking' && (
                              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-100 text-amber-950 border border-amber-300">
                                <Clock className="w-2.5 h-2.5 text-amber-700" />
                                Boking
                              </span>
                            )}
                            {stock.status === 'Terjual' && (
                              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded text-[9px] font-bold bg-rose-100 text-rose-900 border border-rose-300">
                                <CheckCircle2 className="w-2.5 h-2.5 text-rose-700" />
                                Sold
                              </span>
                            )}
                          </div>

                          {/* Harga Cash OTR */}
                          <div className="font-mono font-black text-xs text-charcoal-950 tracking-tight leading-tight">
                            {formatRupiah(stock.price)}
                          </div>

                          {/* Simulasi Kredit DP & Cicilan */}
                          {stock.creditDp || stock.installment35x || stock.installment47x || stock.installment59x ? (
                            <div
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenCalculator(stock);
                              }}
                              className="mt-0.5 text-[9px] leading-tight cursor-pointer hover:opacity-80 p-0.5 rounded"
                              title="Klik untuk ubah estimasi DP & cicilan"
                            >
                              <span className="text-gold-900 font-extrabold block flex items-center justify-end gap-0.5">
                                DP {stock.creditDp ? formatRupiah(stock.creditDp) : 'Tersedia'}
                                <Pencil className="w-2 h-2 text-gold-700" />
                              </span>
                              <span className="text-charcoal-500 font-mono block">
                                {stock.installment47x || stock.installment35x || stock.installment59x || ''}
                              </span>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenCalculator(stock);
                              }}
                              className="text-[9px] text-gold-800 font-bold underline block mt-0.5 ml-auto cursor-pointer"
                            >
                              + Hitung Kredit
                            </button>
                          )}
                        </td>

                        {/* 4. AKSI */}
                        <td 
                          className="py-3 px-1 text-center align-top"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="flex flex-col items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleOpenDetail(stock)}
                              className="p-1.5 rounded-lg bg-charcoal-900 hover:bg-black text-gold-400 shadow-2xs transition-colors cursor-pointer"
                              title="Lihat Detail Unit"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleOpenEdit(stock)}
                              className="p-1.5 rounded-lg bg-warm-100 hover:bg-warm-200 text-blue-700 border border-warm-200 shadow-2xs transition-colors cursor-pointer"
                              title="Edit Unit"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedStock(stock);
                                setShowDeleteModal(true);
                              }}
                              className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 shadow-2xs transition-colors cursor-pointer"
                              title="Hapus Unit"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
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
          <div className="p-4 bg-warm-50 border-t border-warm-200 text-xs text-charcoal-600 flex flex-col sm:flex-row items-center justify-between gap-2">
            <div>
              Menampilkan <strong>{filteredStocks.length}</strong> dari <strong>{stocks.length}</strong> total armada showroom HR MOTOR Garut
            </div>
            <div className="flex items-center gap-4 text-[11px]">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                Ready: <strong>{dashboardStats.tersedia} Unit</strong>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                Booking: <strong>{dashboardStats.booking} Unit</strong>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                Sold: <strong>{dashboardStats.terjual} Unit</strong>
              </span>
            </div>
          </div>
        </div>


      {/* ========================================================================= */}
      {/* MODAL 1: KALKULATOR SIMULASI KREDIT SHOWROOM                              */}
      {/* ========================================================================= */}
      {showCreditCalculatorModal && selectedStock && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-charcoal-950/75 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-luxury border border-[#EAE8E3] overflow-hidden my-auto max-h-[90vh] flex flex-col">
            {/* Header Modal */}
            <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 sm:py-4 bg-charcoal-900 text-white shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-gold-500/20 text-gold-400 flex items-center justify-center shrink-0">
                  <Calculator className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Atur &amp; Hitung Paket Kredit Showroom</h3>
                  <p className="text-[11px] text-charcoal-400 truncate max-w-[220px] sm:max-w-xs">
                    {selectedStock.merkType || selectedStock.model} ({selectedStock.year}) • No #{selectedStock.stockNumber}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowCreditCalculatorModal(false)}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-charcoal-400 hover:text-white hover:bg-charcoal-800 transition-colors shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 sm:p-6 space-y-4 overflow-y-auto">
              {/* Info Mobil & Harga Cash */}
              <div className="p-3 bg-[#FAF9F5] rounded-xl border border-warm-200 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-charcoal-500 font-medium uppercase tracking-wider block">Harga Tunai OTR</span>
                  <span className="text-base font-black text-charcoal-950 font-mono">{formatRupiah(calcCarPrice)}</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-charcoal-500 font-medium uppercase tracking-wider block">Status Paket</span>
                  <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                    selectedStock.creditDp ? 'bg-gold-100 text-gold-900 border border-gold-300' : 'bg-warm-100 text-charcoal-600'
                  }`}>
                    {selectedStock.creditDp ? 'Sudah Ada Paket' : 'Belum Ada Paket'}
                  </span>
                </div>
              </div>

              {/* Uang Muka (DP) */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-charcoal-800">
                    Uang Muka / DP (Rp) *
                  </label>
                  <span className="text-[11px] font-bold text-gold-800 bg-gold-50 px-2 py-0.5 rounded border border-gold-200">
                    {calcCarPrice > 0 ? `${Math.round((calcDpNominal / calcCarPrice) * 100)}% dari Harga OTR` : '0%'}
                  </span>
                </div>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-charcoal-400 font-bold text-xs">Rp</span>
                  <input
                    type="number"
                    step="1000000"
                    value={calcDpNominal}
                    onChange={(e) => handleUpdateCalcDp(Number(e.target.value) || 0)}
                    className="w-full pl-9 pr-3 py-2 text-sm border border-warm-300 rounded-lg font-bold font-mono text-charcoal-950 bg-white focus:outline-none focus:border-gold-500"
                  />
                </div>
                <p className="text-[10px] text-charcoal-500 mt-1 font-mono">
                  {formatRupiah(calcDpNominal)} (Pokok Hutang: {formatRupiah(Math.max(0, calcCarPrice - calcDpNominal))})
                </p>

                {/* DP Shortcut Buttons */}
                <div className="grid grid-cols-4 gap-1.5 mt-2">
                  {[15, 20, 25, 30].map((pct) => (
                    <button
                      key={pct}
                      type="button"
                      onClick={() => handleUpdateCalcDp(Math.round(calcCarPrice * (pct / 100)))}
                      className={`px-2 py-1 rounded text-[10px] font-bold border transition-colors text-center ${
                        calcCarPrice > 0 && Math.round((calcDpNominal / calcCarPrice) * 100) === pct
                          ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                          : 'bg-warm-100 hover:bg-gold-50 text-charcoal-700 border-warm-200'
                      }`}
                    >
                      DP {pct}%
                    </button>
                  ))}
                </div>
              </div>

              {/* 3 Tenor Angsuran Showroom */}
              <div className="space-y-2 pt-2 border-t border-warm-200">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-charcoal-800">
                    Estimasi Angsuran / Cicilan per Tenor:
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      const est = calculateEstimatedInstallments(calcCarPrice, calcDpNominal);
                      setCalcInstallment35x(est.installment35x);
                      setCalcInstallment47x(est.installment47x);
                      setCalcInstallment59x(est.installment59x);
                    }}
                    className="text-[10px] text-gold-700 font-bold hover:underline flex items-center gap-1"
                  >
                    <Sparkles className="w-3 h-3 text-gold-600" />
                    <span>Hitung Ulang Otomatis</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <div className="bg-[#FAF9F5] p-2.5 rounded-xl border border-warm-200 space-y-1">
                    <span className="text-[10px] font-bold text-charcoal-600 block">35x (3 Tahun)</span>
                    <input
                      type="text"
                      placeholder="5.350 (35x)"
                      value={calcInstallment35x}
                      onChange={(e) => setCalcInstallment35x(e.target.value)}
                      className="w-full p-1.5 border border-warm-300 rounded-lg font-mono font-bold text-xs bg-white text-charcoal-900 focus:outline-none focus:border-gold-500"
                    />
                    <span className="text-[9px] text-charcoal-400 block font-sans">Bunga ~8% flat</span>
                  </div>

                  <div className="bg-[#FAF9F5] p-2.5 rounded-xl border border-warm-200 space-y-1">
                    <span className="text-[10px] font-bold text-charcoal-600 block">47x (4 Tahun)</span>
                    <input
                      type="text"
                      placeholder="4.335 (47x)"
                      value={calcInstallment47x}
                      onChange={(e) => setCalcInstallment47x(e.target.value)}
                      className="w-full p-1.5 border border-warm-300 rounded-lg font-mono font-bold text-xs bg-white text-charcoal-900 focus:outline-none focus:border-gold-500"
                    />
                    <span className="text-[9px] text-charcoal-400 block font-sans">Bunga ~8.5% flat</span>
                  </div>

                  <div className="bg-[#FAF9F5] p-2.5 rounded-xl border border-warm-200 space-y-1">
                    <span className="text-[10px] font-bold text-charcoal-600 block">59x (5 Tahun)</span>
                    <input
                      type="text"
                      placeholder="4.065 (59x)"
                      value={calcInstallment59x}
                      onChange={(e) => setCalcInstallment59x(e.target.value)}
                      className="w-full p-1.5 border border-warm-300 rounded-lg font-mono font-bold text-xs bg-white text-charcoal-900 focus:outline-none focus:border-gold-500"
                    />
                    <span className="text-[9px] text-charcoal-400 block font-sans">Bunga ~9% flat</span>
                  </div>
                </div>
              </div>

              {/* Mitra Pembiayaan Showroom */}
              <div className="p-2.5 rounded-lg bg-warm-50 border border-warm-200 flex items-center justify-between text-xs">
                <span className="text-[11px] text-charcoal-600 font-medium">Mitra Leasing Showroom:</span>
                <div className="flex items-center gap-1.5">
                  <span className="px-2 py-0.5 rounded font-bold text-[10px] bg-white border border-warm-200 text-charcoal-800">OTO</span>
                  <span className="px-2 py-0.5 rounded font-bold text-[10px] bg-white border border-warm-200 text-charcoal-800">MUF</span>
                  <span className="px-2 py-0.5 rounded font-bold text-[10px] bg-white border border-warm-200 text-charcoal-800">ADIRA</span>
                </div>
              </div>

              {/* Actions Button */}
              <div className="flex flex-col gap-2 pt-2 border-t border-warm-200">
                <button
                  type="button"
                  onClick={handleSaveCreditPackage}
                  disabled={isSubmitting}
                  className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-charcoal-950 font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-sm cursor-pointer disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  <span>{isSubmitting ? 'Menyimpan...' : 'Simpan Paket Kredit ke Unit Ini'}</span>
                </button>

                <div className="flex items-center gap-2">
                  {selectedStock.creditDp ? (
                    <button
                      type="button"
                      onClick={handleClearCreditPackage}
                      disabled={isSubmitting}
                      className="flex-1 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs border border-rose-200 transition-colors"
                    >
                      Hapus Paket Kredit (Cash Only)
                    </button>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => setShowCreditCalculatorModal(false)}
                    className="flex-1 py-2 rounded-xl bg-warm-100 hover:bg-warm-200 text-charcoal-700 font-bold text-xs transition-colors"
                  >
                    Batal
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: DETAIL SPESIFIKASI KENDARAAN                                     */}
      {/* ========================================================================= */}
      {showDetailModal && selectedStock && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-charcoal-950/75 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200">
          <div className="relative w-full max-w-3xl bg-white rounded-2xl shadow-luxury border border-[#EAE8E3] overflow-hidden my-auto max-h-[90vh] flex flex-col">
            {/* Header Modal */}
            <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 sm:py-4 bg-charcoal-900 text-white shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-gold-500/20 text-gold-400 flex items-center justify-center shrink-0">
                  <Car className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white truncate max-w-[220px] sm:max-w-md">
                    {selectedStock.merkType || `${selectedStock.brand} ${selectedStock.model}`}
                  </h3>
                  <p className="text-[11px] text-charcoal-400">
                    No. Urut #{selectedStock.stockNumber} • ID: {selectedStock.id}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowDetailModal(false)}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-charcoal-400 hover:text-white hover:bg-charcoal-800 transition-colors shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 sm:p-6 space-y-4 sm:space-y-5 overflow-y-auto">
              {/* Alert Status Boking / Sold Out di Modal */}
              {selectedStock.status === 'Booking' && (
                <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-300 flex items-start gap-3 shadow-xs">
                  <Clock className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs font-bold text-amber-950">Unit Sedang Dalam Status BOKING (Pengajuan Kredit)</h4>
                    <p className="text-[11px] text-amber-900 mt-0.5 leading-relaxed">
                      Unit ini sedang dibooking oleh <strong>{selectedStock.bookingCustomerName || 'Pelanggan Showroom'}</strong> untuk pengajuan kredit ke <strong>{selectedStock.bookingLeasing || 'Bank/Leasing'}</strong>{selectedStock.bookingDp ? ` (DP Awal: ${formatRupiah(selectedStock.bookingDp)})` : ''}. Selama status booking aktif, unit ini tidak dapat dibeli atau dibooking oleh calon pembeli lain.
                    </p>
                  </div>
                </div>
              )}

              {selectedStock.status === 'Terjual' && (
                <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-3 shadow-xs">
                  <CheckCircle2 className="w-5 h-5 text-rose-700 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs font-bold text-rose-950">Unit Berstatus SOLD OUT (Sudah Terjual)</h4>
                    <p className="text-[11px] text-rose-800 mt-0.5">
                      Unit ini telah resmi terjual kepada <strong>{selectedStock.soldToCustomerName || 'Pelanggan Showroom'}</strong>{selectedStock.soldDate ? ` pada tanggal ${formatDate(selectedStock.soldDate)}` : ''}.
                    </p>
                  </div>
                </div>
              )}

              {/* Unit Specifications Header Banner (Tanpa Foto) */}
              <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-charcoal-900 via-charcoal-950 to-charcoal-900 text-white border border-gold-500/30 shadow-md">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="badge-gold">
                        100% Bergaransi Resmi Showroom
                      </span>
                      {selectedStock.licensePlate ? (
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="px-2.5 py-0.5 rounded bg-black/70 text-gold-400 font-mono text-xs font-bold border border-gold-500/30">
                            {selectedStock.licensePlate}
                          </span>
                          <span className="px-2 py-0.5 rounded bg-gold-500/20 text-gold-300 font-bold text-xs border border-gold-500/40 inline-flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-gold-400" />
                            Plat {selectedStock.plateRegion || detectPlateRegion(selectedStock.licensePlate)}
                          </span>
                        </div>
                      ) : (
                        <span className="px-2 py-0.5 rounded bg-black/50 text-warm-300 font-mono text-[11px] italic">
                          Siap Balik Nama
                        </span>
                      )}
                    </div>
                    <h3 className="text-lg sm:text-xl font-black text-white tracking-tight">
                      {selectedStock.brand} {selectedStock.model}
                    </h3>
                    <p className="text-xs text-warm-300">
                      Tahun {selectedStock.year} • {selectedStock.transmission} • {selectedStock.fuel} • Odo: {selectedStock.odometerDisplay || `${selectedStock.mileage.toLocaleString('id-ID')} km`}
                    </p>
                  </div>
                  <div className="sm:text-right shrink-0">
                    <span className="text-[10px] text-warm-400 block uppercase tracking-wider font-bold">Harga Cash OTR</span>
                    <span className="text-xl sm:text-2xl font-black text-gold-400 font-mono">
                      {formatRupiah(selectedStock.price)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Specs Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-3 bg-warm-50 rounded-xl border border-warm-200">
                  <span className="text-[10px] text-charcoal-500 block">Tahun Produksi</span>
                  <span className="text-sm font-bold text-charcoal-900 mt-0.5 block">{selectedStock.year}</span>
                </div>
                <div className="p-3 bg-warm-50 rounded-xl border border-warm-200">
                  <span className="text-[10px] text-charcoal-500 block">Warna Kendaraan</span>
                  <span className="text-sm font-bold text-charcoal-900 mt-0.5 block">{selectedStock.color}</span>
                </div>
                <div className="p-3 bg-warm-50 rounded-xl border border-warm-200">
                  <span className="text-[10px] text-charcoal-500 block">Odometer Asli</span>
                  <span className="text-sm font-bold text-charcoal-900 mt-0.5 block">{selectedStock.odometerDisplay || `${selectedStock.mileage.toLocaleString('id-ID')} km`}</span>
                </div>
                <div className="p-3 bg-warm-50 rounded-xl border border-warm-200">
                  <span className="text-[10px] text-charcoal-500 block">Transmisi & BBM</span>
                  <span className="text-sm font-bold text-charcoal-900 mt-0.5 block">{selectedStock.transmission} • {selectedStock.fuel}</span>
                </div>
              </div>

              {/* Kredit Package Card */}
              <div className="p-4 rounded-xl bg-gold-50/70 border border-gold-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase text-gold-900 flex items-center gap-1.5">
                    <BadgePercent className="w-4 h-4 text-gold-700" /> Paket Simulasi Kredit Showroom
                  </span>
                  <span className="text-[10px] font-bold text-gold-800">
                    Mitra: OTO • MUF • Adira
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 pt-1 text-xs">
                  <div className="p-2 bg-white rounded-lg border border-gold-200">
                    <span className="text-[10px] text-charcoal-500 block">Uang Muka (DP)</span>
                    <span className="font-extrabold text-gold-900 text-sm">
                      {selectedStock.creditDp ? formatRupiah(selectedStock.creditDp) : 'Mulai 20%'}
                    </span>
                  </div>
                  <div className="p-2 bg-white rounded-lg border border-gold-200">
                    <span className="text-[10px] text-charcoal-500 block">Tenor 35x (3 Thn)</span>
                    <span className="font-mono font-bold text-charcoal-900">
                      {selectedStock.installment35x || '-'}
                    </span>
                  </div>
                  <div className="p-2 bg-white rounded-lg border border-gold-200">
                    <span className="text-[10px] text-charcoal-500 block">Tenor 47x (4 Thn)</span>
                    <span className="font-mono font-bold text-charcoal-900">
                      {selectedStock.installment47x || '-'}
                    </span>
                  </div>
                  <div className="p-2 bg-white rounded-lg border border-gold-200">
                    <span className="text-[10px] text-charcoal-500 block">Tenor 59x (5 Thn)</span>
                    <span className="font-mono font-bold text-charcoal-900">
                      {selectedStock.installment59x || '-'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Matching CRM Leads */}
              {matchingLeads.length > 0 && (
                <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 space-y-2">
                  <span className="text-xs font-bold text-emerald-950 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-emerald-600" />
                    {matchingLeads.length} Calon Konsumen di CRM Mencari Unit Ini:
                  </span>
                  <div className="divide-y divide-emerald-200/60 text-xs">
                    {matchingLeads.map((ld) => {
                      const clientName = ld.customerName || 'Konsumen';
                      const clientPhone = ld.contactNumber || ld.customerPhone || '';
                      return (
                        <div key={ld.id} className="py-2 flex items-center justify-between">
                          <div>
                            <span className="font-bold text-emerald-950">{clientName}</span>
                            <span className="text-emerald-700 text-[11px] ml-2 font-mono">Kontak: {clientPhone || '-'}</span>
                          </div>
                          <span className="text-[11px] font-bold text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full border border-emerald-300">
                            Cocok Preferensi
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Description */}
              <div className="text-xs text-charcoal-700 bg-warm-50 p-3 rounded-xl border border-warm-200">
                <span className="font-bold text-charcoal-900 block mb-1">Catatan Showroom HR MOTOR:</span>
                <p>{selectedStock.description}</p>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-2.5 pt-3 border-t border-warm-200">
                <button
                  type="button"
                  onClick={() => {
                    setShowDetailModal(false);
                    setShowDeleteModal(true);
                  }}
                  className="text-xs font-semibold text-rose-600 hover:text-rose-800 transition-colors flex items-center justify-center gap-1 py-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Hapus Unit</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowDetailModal(false);
                      handleOpenCalculator(selectedStock);
                    }}
                    className="flex-1 sm:flex-initial btn-gold text-xs flex items-center justify-center gap-1.5 py-2 px-3.5 shadow-xs"
                  >
                    <Calculator className="w-3.5 h-3.5" />
                    <span>Simulasi Kredit</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setShowDetailModal(false);
                      handleOpenEdit(selectedStock);
                    }}
                    className="flex-1 sm:flex-initial btn-outline-warm text-xs flex items-center justify-center gap-1.5 py-2 px-3 shadow-xs"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>Edit Unit</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: TAMBAH & EDIT UNIT KENDARAAN                                     */}
      {/* ========================================================================= */}
      {(showAddModal || showEditModal) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-charcoal-950/75 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200">
          <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-luxury border border-[#EAE8E3] overflow-hidden my-auto max-h-[90vh] flex flex-col">
            {/* Header Modal */}
            <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 sm:py-4 bg-charcoal-900 text-white shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-gold-500/20 text-gold-400 flex items-center justify-center shrink-0">
                  <Car className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">
                    {showAddModal ? 'Tambah Unit Baru ke Inventaris Showroom' : 'Edit Data Unit Kendaraan'}
                  </h3>
                  <p className="text-[11px] text-charcoal-400">Inventaris resmi HR MOTOR Garut</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setShowEditModal(false);
                }}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-charcoal-400 hover:text-white hover:bg-charcoal-800 transition-colors shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form
              onSubmit={showAddModal ? handleSubmitAdd : handleSubmitEdit}
              className="p-4 sm:p-6 space-y-4 overflow-y-auto text-xs"
            >
              {formError && (
                <div className="p-3 rounded-lg bg-rose-50 text-rose-800 border border-rose-200 font-semibold">
                  {formError}
                </div>
              )}

              {/* ======================================================= */}
              {/* BAGIAN 1: IDENTITAS UNIT KENDARAAN (MEREK/TYPE, TAHUN, WARNA, ODO, NO POLISI & DAERAH) */}
              {/* ======================================================= */}
              <div className="p-4 bg-warm-50/70 rounded-xl border border-warm-200 space-y-3">
                <div className="flex items-center gap-2 pb-2 border-b border-warm-200">
                  <Car className="w-4 h-4 text-gold-600" />
                  <span className="font-black text-xs uppercase tracking-wide text-charcoal-900">
                    1. Identitas Unit Kendaraan
                  </span>
                </div>

                {/* Merek / Type Unit */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-charcoal-800">
                      Merek / Type Unit <span className="text-rose-500">*</span>
                    </label>
                    <span className="text-[10px] text-charcoal-400">Contoh: DAIHATSU SIGRA 1.2 R FACELIFT M/T</span>
                  </div>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: DAIHATSU SIGRA 1.2 R FACELIFT M/T atau HONDA BRIO 1.2 E"
                    value={formData.merkType}
                    onChange={(e) => handleMerkTypeChange(e.target.value)}
                    className="w-full p-2.5 border border-warm-300 rounded-lg bg-white uppercase font-bold text-sm text-charcoal-900 focus:outline-none focus:border-gold-500 shadow-2xs"
                  />
                  {/* Quick Brand Selector Chips */}
                  <div className="flex items-center gap-1 mt-1.5 flex-wrap">
                    <span className="text-[10px] text-charcoal-400 font-medium">Pilih Merek:</span>
                    {COMMON_BRANDS.filter((b) => b !== 'Semua').map((b) => (
                      <button
                        key={b}
                        type="button"
                        onClick={() => {
                          const currentRest = formData.merkType.replace(new RegExp(`^${formData.brand}\\s*`, 'i'), '').trim();
                          const newMerk = `${b.toUpperCase()} ${currentRest}`.trim();
                          handleMerkTypeChange(newMerk);
                        }}
                        className={`text-[10px] px-2 py-0.5 rounded border transition-colors ${
                          formData.brand.toLowerCase() === b.toLowerCase()
                            ? 'bg-gold-500 text-charcoal-950 font-bold border-gold-600'
                            : 'bg-white text-charcoal-700 border-warm-200 hover:bg-gold-50'
                        }`}
                      >
                        {b}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Tahun, Warna, Odo */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-charcoal-800 mb-1">
                      Tahun <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="number"
                      required
                      min={2000}
                      max={2030}
                      placeholder="2021"
                      value={formData.year}
                      onChange={(e) => setFormData({ ...formData, year: Number(e.target.value) || 2022 })}
                      className="w-full p-2 border border-warm-300 rounded-lg bg-white font-mono font-bold text-charcoal-900"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-charcoal-800 mb-1">
                      Warna <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Putih, Hitam, Abu-Abu..."
                      value={formData.color}
                      onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                      className="w-full p-2 border border-warm-300 rounded-lg bg-white uppercase font-bold text-charcoal-900"
                    />
                    <div className="flex items-center gap-1 mt-1 flex-wrap">
                      {['PUTIH', 'HITAM', 'ABU-ABU', 'SILVER', 'MERAH'].map((c) => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => setFormData({ ...formData, color: c })}
                          className={`text-[9px] px-1.5 py-0.2 rounded border transition-colors ${
                            formData.color.toUpperCase() === c
                              ? 'bg-gold-500 text-charcoal-950 font-bold border-gold-600'
                              : 'bg-white text-charcoal-600 border-warm-200 hover:bg-warm-100'
                          }`}
                        >
                          {c}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-charcoal-800 mb-1">
                      Odo (KM) <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Contoh: 26RB"
                      value={formData.odometerDisplay}
                      onChange={(e) => {
                        const val = e.target.value;
                        setFormData({
                          ...formData,
                          odometerDisplay: val,
                          mileage: parseOdometer(val),
                        });
                      }}
                      className="w-full p-2 border border-warm-300 rounded-lg bg-white font-mono font-bold text-charcoal-900 uppercase"
                    />
                    <span className="text-[10px] text-charcoal-400 mt-0.5 block font-mono">
                      ~{formData.mileage.toLocaleString('id-ID')} KM
                    </span>
                  </div>
                </div>

                {/* No Polisi & Daerah Asal Plat */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="block text-xs font-bold text-charcoal-800 mb-1">
                      No Polisi <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Contoh: Z 1083 NV atau D 1482 AB"
                      value={formData.licensePlate}
                      onChange={(e) => handlePlateChange(e.target.value)}
                      className="w-full p-2 border border-warm-300 rounded-lg bg-white font-mono font-black text-charcoal-950 uppercase tracking-wider text-sm focus:border-gold-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-bold text-charcoal-800 flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-gold-600" />
                        <span>Daerah Asal No Polisi</span>
                      </label>
                      <span className="text-[10px] text-gold-800 font-semibold">(Bisa diketik / dipilih)</span>
                    </div>
                    <input
                      type="text"
                      placeholder="Contoh: Garut, Bandung, Jakarta, dll."
                      value={formData.plateRegion}
                      onChange={(e) => setFormData({ ...formData, plateRegion: e.target.value })}
                      className="w-full p-2 border border-warm-300 rounded-lg bg-white font-bold text-charcoal-900 focus:border-gold-500 focus:outline-none"
                    />
                    {/* Quick Region Selector Chips */}
                    <div className="flex items-center gap-1 mt-1 flex-wrap">
                      <span className="text-[9px] text-charcoal-400 font-medium">Pilih:</span>
                      {['Garut', 'Bandung', 'Tasikmalaya', 'Sumedang', 'Ciamis', 'Jakarta'].map((reg) => (
                        <button
                          key={reg}
                          type="button"
                          onClick={() => setFormData({ ...formData, plateRegion: reg })}
                          className={`text-[9px] px-1.5 py-0.5 rounded border transition-colors ${
                            formData.plateRegion.toLowerCase() === reg.toLowerCase()
                              ? 'bg-charcoal-900 text-gold-400 font-bold border-charcoal-900'
                              : 'bg-white text-charcoal-600 border-warm-200 hover:bg-gold-50'
                          }`}
                        >
                          {reg}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* ======================================================= */}
              {/* BAGIAN 2: HARGA CASH, DP, DAN CICILAN (35x, 47x, 59x)   */}
              {/* ======================================================= */}
              <div className="p-4 bg-gradient-to-br from-amber-50/70 via-warm-50 to-amber-100/30 rounded-xl border border-amber-200 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 pb-2 border-b border-amber-200/80">
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-amber-700" />
                    <span className="font-black text-xs uppercase tracking-wide text-charcoal-900">
                      2. Harga Cash, DP &amp; Cicilan (35x, 47x, 59x)
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleAutoFillCreditInForm(20)}
                    className="text-[11px] font-bold text-amber-900 bg-amber-100 hover:bg-amber-200 border border-amber-300 px-2.5 py-1 rounded-lg flex items-center gap-1 transition-colors self-start sm:self-auto cursor-pointer"
                    title="Hitung ulang otomatis estimasi DP 20% dan cicilan 35x, 47x, 59x"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                    <span>⚡ Hitung Estimasi Otomatis (DP 20%)</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Harga Cash */}
                  <div>
                    <label className="block text-xs font-bold text-charcoal-800 mb-1">
                      Harga Cash OTR (Rp) <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-charcoal-400 font-bold text-xs">Rp</span>
                      <input
                        type="number"
                        step="1000000"
                        required
                        value={formData.price}
                        onChange={(e) => handlePriceChangeInForm(Number(e.target.value) || 0)}
                        className="w-full pl-9 pr-3 py-2 border border-warm-300 rounded-lg font-mono font-black text-charcoal-950 bg-white text-sm focus:outline-none focus:border-gold-500"
                      />
                    </div>
                    <p className="text-[10px] text-charcoal-500 mt-1 font-mono">
                      {formatRupiah(formData.price)} Cash OTR
                    </p>
                  </div>

                  {/* DP (Uang Muka) */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-bold text-charcoal-800">
                        Uang Muka / DP (Rp)
                      </label>
                      <span className="text-[10px] font-bold text-gold-800 bg-gold-50 px-1.5 py-0.2 rounded border border-gold-200">
                        {formData.price > 0 && formData.creditDp ? `~${Math.round((Number(formData.creditDp) / formData.price) * 100)}% OTR` : 'Pilihan DP'}
                      </span>
                    </div>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-charcoal-400 font-bold text-xs">Rp</span>
                      <input
                        type="number"
                        step="1000000"
                        placeholder="Contoh: 15000000"
                        value={formData.creditDp}
                        onChange={(e) => handleDpChangeInForm(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 border border-warm-300 rounded-lg font-mono font-bold text-charcoal-950 bg-white text-sm focus:outline-none focus:border-gold-500"
                      />
                    </div>
                    {/* DP Shortcut Buttons */}
                    <div className="flex items-center gap-1 mt-1.5 flex-wrap">
                      <span className="text-[9px] text-charcoal-400 font-medium">Pilih %:</span>
                      {[15, 20, 25, 30].map((pct) => (
                        <button
                          key={pct}
                          type="button"
                          onClick={() => handleAutoFillCreditInForm(pct)}
                          className={`px-1.5 py-0.5 rounded text-[10px] font-bold border transition-colors ${
                            formData.price > 0 && Math.round((Number(formData.creditDp) / formData.price) * 100) === pct
                              ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                              : 'bg-white text-charcoal-700 border-warm-200 hover:bg-gold-50'
                          }`}
                        >
                          {pct}%
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Cicilan 35x, 47x, 59x */}
                <div className="pt-2">
                  <label className="block text-[11px] font-bold text-charcoal-800 mb-1.5">
                    Masukan Cicilan per Tenor (35x, 47x, 59x):
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    <div className="bg-white p-2.5 rounded-lg border border-warm-200 shadow-xs">
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-[10px] font-extrabold text-charcoal-700">Cicilan 35x (3 Thn)</label>
                        <span className="text-[9px] text-amber-700 bg-amber-50 px-1 rounded font-bold">35 Bulan</span>
                      </div>
                      <input
                        type="text"
                        placeholder="Contoh: 5.350 (35x)"
                        value={formData.installment35x}
                        onChange={(e) => setFormData({ ...formData, installment35x: e.target.value })}
                        className="w-full p-1.5 border border-warm-300 rounded-md font-mono font-bold text-xs bg-warm-50/50 focus:bg-white text-charcoal-900"
                      />
                    </div>

                    <div className="bg-white p-2.5 rounded-lg border border-warm-200 shadow-xs">
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-[10px] font-extrabold text-charcoal-700">Cicilan 47x (4 Thn)</label>
                        <span className="text-[9px] text-amber-700 bg-amber-50 px-1 rounded font-bold">47 Bulan</span>
                      </div>
                      <input
                        type="text"
                        placeholder="Contoh: 4.335 (47x)"
                        value={formData.installment47x}
                        onChange={(e) => setFormData({ ...formData, installment47x: e.target.value })}
                        className="w-full p-1.5 border border-warm-300 rounded-md font-mono font-bold text-xs bg-warm-50/50 focus:bg-white text-charcoal-900"
                      />
                    </div>

                    <div className="bg-white p-2.5 rounded-lg border border-warm-200 shadow-xs">
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-[10px] font-extrabold text-charcoal-700">Cicilan 59x (5 Thn)</label>
                        <span className="text-[9px] text-amber-700 bg-amber-50 px-1 rounded font-bold">59 Bulan</span>
                      </div>
                      <input
                        type="text"
                        placeholder="Contoh: 4.065 (59x)"
                        value={formData.installment59x}
                        onChange={(e) => setFormData({ ...formData, installment59x: e.target.value })}
                        className="w-full p-1.5 border border-warm-300 rounded-md font-mono font-bold text-xs bg-warm-50/50 focus:bg-white text-charcoal-900"
                      />
                    </div>
                  </div>
                  <p className="text-[10px] text-charcoal-400 mt-1">
                    * Estimasi bunga flat leasing resmi rekanan Garut (OTO, MUF, Adira). Anda dapat mengubah nominal cicilan kapan saja.
                  </p>
                </div>
              </div>

              {/* ======================================================= */}
              {/* BAGIAN 3: PENGATURAN TAMBAHAN (TRANSMISI, BBM, STATUS) */}
              {/* ======================================================= */}
              <div className="p-3 bg-warm-50/50 rounded-xl border border-warm-200 space-y-3">
                <span className="font-bold text-[11px] text-charcoal-600 block uppercase">
                  3. Pengaturan Tambahan (Transmisi, BBM &amp; Status)
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
                  <div>
                    <label className="block text-[11px] font-semibold text-charcoal-700 mb-1">Transmisi</label>
                    <select
                      value={formData.transmission}
                      onChange={(e) => setFormData({ ...formData, transmission: e.target.value as TransmissionType })}
                      className="w-full p-2 border border-warm-300 rounded-lg bg-white text-xs"
                    >
                      {TRANSMISSIONS.map((t) => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-charcoal-700 mb-1">Bahan Bakar</label>
                    <select
                      value={formData.fuel}
                      onChange={(e) => setFormData({ ...formData, fuel: e.target.value as FuelType })}
                      className="w-full p-2 border border-warm-300 rounded-lg bg-white text-xs"
                    >
                      {FUELS.map((f) => (
                        <option key={f} value={f}>{f}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-charcoal-700 mb-1">Status Showroom</label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value as VehicleStockStatus })}
                      className="w-full p-2 border border-warm-300 rounded-lg bg-white font-bold text-xs"
                    >
                      {STATUSES.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-charcoal-700 mb-1">No. Urut Showroom</label>
                    <input
                      type="number"
                      value={formData.stockNumber}
                      onChange={(e) => setFormData({ ...formData, stockNumber: Number(e.target.value) || 1 })}
                      className="w-full p-2 border border-warm-300 rounded-lg bg-white text-xs font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-charcoal-700 mb-1">Catatan Kesiapan (misal: ❌ FOTO, ❌ DETAILING)</label>
                  <input
                    type="text"
                    placeholder="Pisahkan dengan koma, misal: ❌ FOTO, ❌ DETAILING"
                    value={formData.readinessNotes}
                    onChange={(e) => setFormData({ ...formData, readinessNotes: e.target.value })}
                    className="w-full p-2 border border-warm-300 rounded-lg bg-white text-xs"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-charcoal-700 mb-1">Deskripsi Kondisi Unit</label>
                  <textarea
                    rows={2}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full p-2 border border-warm-300 rounded-lg bg-white text-xs"
                    placeholder="Catatan kondisi mobil, riwayat servis, kondisi ban, kelengkapan surat..."
                  />
                </div>
              </div>

              <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2.5 pt-3 border-t border-warm-200 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setShowEditModal(false);
                  }}
                  className="px-4 py-2 bg-warm-200 text-charcoal-800 font-bold rounded-lg hover:bg-warm-300 w-full sm:w-auto text-center"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn-gold px-5 py-2 text-xs font-bold w-full sm:w-auto text-center"
                >
                  {isSubmitting ? 'Menyimpan...' : showAddModal ? 'Simpan Unit Baru' : 'Perbarui Unit'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 4: KONFIRMASI HAPUS                                                 */}
      {/* ========================================================================= */}
      {showDeleteModal && selectedStock && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-charcoal-950/75 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl p-5 sm:p-6 max-w-sm w-full space-y-4 border border-[#EAE8E3] shadow-luxury my-auto">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div className="text-center">
              <h4 className="text-base font-bold text-charcoal-900">Hapus Unit Kendaraan?</h4>
              <p className="text-xs text-charcoal-500 mt-1">
                Apakah Anda yakin ingin menghapus <strong>{selectedStock.merkType || selectedStock.model}</strong> dari inventaris showroom?
              </p>
            </div>
            <div className="flex flex-col-reverse sm:flex-row items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                className="w-full sm:flex-1 py-2 rounded-lg bg-warm-200 text-charcoal-800 font-bold text-xs hover:bg-warm-300"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isSubmitting}
                className="w-full sm:flex-1 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs"
              >
                {isSubmitting ? 'Menghapus...' : 'Ya, Hapus'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
