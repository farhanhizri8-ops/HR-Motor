'use client';

import React, { useState, useMemo } from 'react';
import { useCrm } from '@/context/CrmContext';
import { VehicleStock, VehicleStockStatus, TransmissionType, FuelType } from '@/types/crm';
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
  Tag,
  Clock,
  Sparkles,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Image as ImageIcon,
  MessageCircle,
  ExternalLink,
  ChevronRight,
  X,
  Layers,
  ShoppingBag,
  DollarSign,
  LayoutGrid,
  List,
} from 'lucide-react';

const COMMON_BRANDS = ['Toyota', 'Honda', 'Daihatsu', 'Mitsubishi', 'Suzuki', 'Nissan', 'Mazda', 'Wuling', 'Hyundai', 'Isuzu', 'Lainnya'];
const TRANSMISSIONS: TransmissionType[] = ['Manual', 'Otomatis', 'CVT'];
const FUELS: FuelType[] = ['Bensin', 'Diesel', 'Hybrid'];
const STATUSES: VehicleStockStatus[] = ['Tersedia', 'Terjual', 'Tidak Aktif'];

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
  const [filterYearMin, setFilterYearMin] = useState<string>('');
  const [filterYearMax, setFilterYearMax] = useState<string>('');
  const [filterPriceMin, setFilterPriceMin] = useState<string>('');
  const [filterPriceMax, setFilterPriceMax] = useState<string>('');
  const [sortBy, setSortBy] = useState<'date_desc' | 'date_asc' | 'price_asc' | 'price_desc'>('date_desc');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedStock, setSelectedStock] = useState<VehicleStock | null>(null);

  // Form State for Add / Edit
  const [formData, setFormData] = useState<{
    brand: string;
    model: string;
    year: number;
    color: string;
    transmission: TransmissionType;
    fuel: FuelType;
    mileage: number;
    price: number;
    entryDate: string;
    description: string;
    status: VehicleStockStatus;
    licensePlate: string;
    photos: string[];
    newPhotoUrl: string;
  }>({
    brand: 'Toyota',
    model: '',
    year: 2021,
    color: 'Hitam Metalik',
    transmission: 'Manual',
    fuel: 'Bensin',
    mileage: 35000,
    price: 185000000,
    entryDate: new Date().toISOString().split('T')[0],
    description: '',
    status: 'Tersedia',
    licensePlate: '',
    photos: [],
    newPhotoUrl: '',
  });

  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Active Photo in Detail View
  const [activePhotoIdx, setActivePhotoIdx] = useState(0);

  // Dashboard Metrics Calculation
  const dashboardStats = useMemo(() => {
    const total = stocks.length;
    const tersedia = stocks.filter((s) => s.status === 'Tersedia').length;
    const terjual = stocks.filter((s) => s.status === 'Terjual').length;
    const tidakAktif = stocks.filter((s) => s.status === 'Tidak Aktif').length;

    // Unit terbaru masuk
    const sortedByDateDesc = [...stocks].sort(
      (a, b) => new Date(b.entryDate).getTime() - new Date(a.entryDate).getTime()
    );
    const newestUnit = sortedByDateDesc.length > 0 ? sortedByDateDesc[0] : null;

    // Unit paling lama tersedia (aging)
    const availableUnits = stocks.filter((s) => s.status === 'Tersedia');
    const sortedAvailableOldest = [...availableUnits].sort(
      (a, b) => new Date(a.entryDate).getTime() - new Date(b.entryDate).getTime()
    );
    const oldestAvailable = sortedAvailableOldest.length > 0 ? sortedAvailableOldest[0] : null;

    let agingDays = 0;
    if (oldestAvailable) {
      const diffTime = Math.abs(new Date().getTime() - new Date(oldestAvailable.entryDate).getTime());
      agingDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }

    return {
      total,
      tersedia,
      terjual,
      tidakAktif,
      newestUnit,
      oldestAvailable,
      agingDays,
    };
  }, [stocks]);

  // Filter and Sort Processing
  const filteredStocks = useMemo(() => {
    return stocks
      .filter((item) => {
        // Search query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchName = `${item.brand} ${item.model}`.toLowerCase().includes(q);
          const matchPlate = item.licensePlate?.toLowerCase().includes(q);
          const matchDesc = item.description?.toLowerCase().includes(q);
          if (!matchName && !matchPlate && !matchDesc) return false;
        }

        // Brand filter
        if (filterBrand !== 'Semua' && item.brand !== filterBrand) {
          return false;
        }

        // Status filter
        if (filterStatus !== 'Semua' && item.status !== filterStatus) {
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
        if (sortBy === 'date_desc') {
          return new Date(b.entryDate).getTime() - new Date(a.entryDate).getTime();
        }
        if (sortBy === 'date_asc') {
          return new Date(a.entryDate).getTime() - new Date(b.entryDate).getTime();
        }
        if (sortBy === 'price_asc') {
          return a.price - b.price;
        }
        if (sortBy === 'price_desc') {
          return b.price - a.price;
        }
        return 0;
      });
  }, [
    stocks,
    searchQuery,
    filterBrand,
    filterStatus,
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

  // Open Add Modal
  const handleOpenAdd = () => {
    setFormData({
      brand: 'Toyota',
      model: '',
      year: 2021,
      color: 'Hitam Metalik',
      transmission: 'Manual',
      fuel: 'Bensin',
      mileage: 35000,
      price: 185000000,
      entryDate: new Date().toISOString().split('T')[0],
      description: '',
      status: 'Tersedia',
      licensePlate: '',
      photos: [
        'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=600&auto=format&fit=crop&q=80',
      ],
      newPhotoUrl: '',
    });
    setFormError('');
    setShowAddModal(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (stock: VehicleStock) => {
    setSelectedStock(stock);
    setFormData({
      brand: stock.brand,
      model: stock.model,
      year: stock.year,
      color: stock.color,
      transmission: stock.transmission,
      fuel: stock.fuel,
      mileage: stock.mileage,
      price: stock.price,
      entryDate: stock.entryDate,
      description: stock.description || '',
      status: stock.status,
      licensePlate: stock.licensePlate || '',
      photos: stock.photos && stock.photos.length > 0 ? [...stock.photos] : [],
      newPhotoUrl: '',
    });
    setFormError('');
    setShowEditModal(true);
  };

  // Open Detail Modal
  const handleOpenDetail = (stock: VehicleStock) => {
    setSelectedStock(stock);
    setActivePhotoIdx(0);
    setShowDetailModal(true);
  };

  // Handle Add Photo URL
  const handleAddPhoto = () => {
    if (formData.newPhotoUrl.trim()) {
      setFormData({
        ...formData,
        photos: [...formData.photos, formData.newPhotoUrl.trim()],
        newPhotoUrl: '',
      });
    }
  };

  // Handle Remove Photo URL
  const handleRemovePhoto = (idx: number) => {
    const next = [...formData.photos];
    next.splice(idx, 1);
    setFormData({ ...formData, photos: next });
  };

  // Submit Add
  const handleSubmitAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.model.trim()) {
      setFormError('Model / tipe mobil wajib diisi');
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
        brand: formData.brand,
        model: formData.model.trim(),
        year: Number(formData.year),
        color: formData.color.trim(),
        transmission: formData.transmission,
        fuel: formData.fuel,
        mileage: Number(formData.mileage),
        price: Number(formData.price),
        entryDate: formData.entryDate,
        description: formData.description.trim(),
        status: formData.status,
        licensePlate: formData.licensePlate.trim(),
        photos:
          formData.photos.length > 0
            ? formData.photos
            : ['https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=600&auto=format&fit=crop&q=80'],
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
    if (!formData.model.trim()) {
      setFormError('Model / tipe mobil wajib diisi');
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
        brand: formData.brand,
        model: formData.model.trim(),
        year: Number(formData.year),
        color: formData.color.trim(),
        transmission: formData.transmission,
        fuel: formData.fuel,
        mileage: Number(formData.mileage),
        price: Number(formData.price),
        entryDate: formData.entryDate,
        description: formData.description.trim(),
        status: formData.status,
        licensePlate: formData.licensePlate.trim(),
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

  return (
    <div className="space-y-6 pb-12">
      {/* Header Showroom */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 crm-card p-6">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-charcoal-900 text-gold-400 flex items-center justify-center shadow-md">
              <Car className="w-5 h-5 text-gold-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl lg:text-2xl font-bold tracking-tight text-charcoal-900">
                  Manajemen Stok Unit Showroom
                </h1>
                <span className="badge-gold">
                  Showroom HR MOTOR Garut
                </span>
              </div>
              <p className="text-xs text-charcoal-500 mt-0.5">
                Inventaris kendaraan mobil bekas premium: unit display showroom, inspeksi garansi, dan unit deal konsumen di Garut.
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={handleOpenAdd}
          className="btn-gold inline-flex items-center justify-center gap-2 self-start md:self-auto text-xs"
        >
          <Plus className="w-4 h-4" />
          Tambah Unit Baru
        </button>
      </div>

      {/* DASHBOARD RINGKASAN STOK UNIT (6 KPI Cards) */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
        {/* Total Unit */}
        <div className="crm-card p-4">
          <div className="flex items-center justify-between text-charcoal-500 mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Total Stok</span>
            <div className="w-6 h-6 rounded-lg bg-charcoal-100 flex items-center justify-center text-charcoal-700">
              <Layers className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-charcoal-900">{dashboardStats.total}</div>
          <div className="text-[11px] text-charcoal-400 mt-1">Seluruh inventaris</div>
        </div>

        {/* Unit Tersedia */}
        <div className="crm-card p-4 border-l-4 border-l-gold-500">
          <div className="flex items-center justify-between text-charcoal-500 mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-gold-700">Tersedia</span>
            <div className="w-6 h-6 rounded-lg bg-gold-50 text-gold-600 flex items-center justify-center">
              <CheckCircle2 className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-gold-600">{dashboardStats.tersedia}</div>
          <div className="text-[11px] text-gold-700/80 mt-1">Ready di showroom</div>
        </div>

        {/* Unit Terjual */}
        <div className="crm-card p-4">
          <div className="flex items-center justify-between text-charcoal-500 mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Terjual</span>
            <div className="w-6 h-6 rounded-lg bg-charcoal-100 text-charcoal-700 flex items-center justify-center">
              <ShoppingBag className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-charcoal-800">{dashboardStats.terjual}</div>
          <div className="text-[11px] text-charcoal-400 mt-1">Deal konsumen</div>
        </div>

        {/* Unit Tidak Aktif */}
        <div className="crm-card p-4">
          <div className="flex items-center justify-between text-charcoal-500 mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Maintenance</span>
            <div className="w-6 h-6 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center">
              <AlertTriangle className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-amber-700">{dashboardStats.tidakAktif}</div>
          <div className="text-[11px] text-charcoal-400 mt-1">Salon / perbaikan</div>
        </div>

        {/* Unit Terbaru Masuk */}
        <div className="crm-card p-4">
          <div className="flex items-center justify-between text-charcoal-500 mb-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Unit Baru</span>
            <div className="w-6 h-6 rounded-lg bg-gold-50 text-gold-600 flex items-center justify-center">
              <Sparkles className="w-3.5 h-3.5" />
            </div>
          </div>
          {dashboardStats.newestUnit ? (
            <div>
              <div className="text-xs font-bold text-charcoal-900 truncate mt-1" title={`${dashboardStats.newestUnit.brand} ${dashboardStats.newestUnit.model}`}>
                {dashboardStats.newestUnit.brand} {dashboardStats.newestUnit.model}
              </div>
              <div className="text-[10px] text-gold-700 mt-0.5 font-medium">
                Masuk: {formatDate(dashboardStats.newestUnit.entryDate)}
              </div>
            </div>
          ) : (
            <div className="text-xs text-charcoal-400">-</div>
          )}
        </div>

        {/* Unit Paling Lama (Aging) */}
        <div className="crm-card p-4">
          <div className="flex items-center justify-between text-charcoal-500 mb-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Aging Terlama</span>
            <div className="w-6 h-6 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
              <Clock className="w-3.5 h-3.5" />
            </div>
          </div>
          {dashboardStats.oldestAvailable ? (
            <div>
              <div className="text-xs font-bold text-charcoal-900 truncate mt-1" title={`${dashboardStats.oldestAvailable.brand} ${dashboardStats.oldestAvailable.model}`}>
                {dashboardStats.oldestAvailable.brand} {dashboardStats.oldestAvailable.model}
              </div>
              <div className="text-[10px] text-rose-600 mt-0.5 font-bold">
                {dashboardStats.agingDays} hari di showroom
              </div>
            </div>
          ) : (
            <div className="text-xs text-charcoal-400">-</div>
          )}
        </div>
      </div>

      {/* SEARCH, FILTER & VIEW MODE TOGGLE */}
      <div className="crm-card p-4 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 flex-1">
            {/* Search */}
            <div className="relative">
              <Search className="w-4 h-4 text-charcoal-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Cari unit (Merek, model, plat nomor, deskripsi)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-warm-50 border border-warm-200 rounded-xl text-xs text-charcoal-900 placeholder-charcoal-400 focus:outline-none focus:border-gold-500 focus:ring-1 focus:ring-gold-500/30 transition-all"
              />
            </div>

            {/* Merek Filter */}
            <div>
              <select
                value={filterBrand}
                onChange={(e) => setFilterBrand(e.target.value)}
                className="w-full px-3 py-2 bg-warm-50 border border-warm-200 rounded-xl text-xs text-charcoal-900 focus:outline-none focus:border-gold-500 focus:ring-1 focus:ring-gold-500/30 transition-all"
              >
                <option value="Semua">Semua Merek</option>
                {COMMON_BRANDS.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full px-3 py-2 bg-warm-50 border border-warm-200 rounded-xl text-xs text-charcoal-900 focus:outline-none focus:border-gold-500 focus:ring-1 focus:ring-gold-500/30 transition-all"
              >
                <option value="Semua">Semua Status</option>
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    Status: {s}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* View Mode Switcher */}
          <div className="flex items-center gap-1 p-1 bg-warm-100 rounded-xl border border-warm-200 self-end lg:self-auto">
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                viewMode === 'grid'
                  ? 'bg-white text-charcoal-900 shadow-sm'
                  : 'text-charcoal-500 hover:text-charcoal-900'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5 text-gold-600" />
              Kartu Showroom
            </button>
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                viewMode === 'table'
                  ? 'bg-white text-charcoal-900 shadow-sm'
                  : 'text-charcoal-500 hover:text-charcoal-900'
              }`}
            >
              <List className="w-3.5 h-3.5 text-gold-600" />
              Tabel Enterprise
            </button>
          </div>
        </div>

        {/* Secondary filters: Year, Price, Sort */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-warm-200/80 text-xs">
          <div className="flex flex-wrap items-center gap-2 text-charcoal-500">
            <span className="flex items-center gap-1 font-semibold text-charcoal-700">
              <Filter className="w-3.5 h-3.5 text-gold-600" /> Filter Rentang:
            </span>

            {/* Tahun */}
            <div className="flex items-center gap-1 bg-warm-50 px-2.5 py-1 rounded-lg border border-warm-200">
              <span className="text-[11px] text-charcoal-500">Tahun:</span>
              <input
                type="number"
                placeholder="Min"
                value={filterYearMin}
                onChange={(e) => setFilterYearMin(e.target.value)}
                className="w-12 bg-transparent text-charcoal-900 focus:outline-none text-center text-xs font-semibold"
              />
              <span className="text-charcoal-400">-</span>
              <input
                type="number"
                placeholder="Maks"
                value={filterYearMax}
                onChange={(e) => setFilterYearMax(e.target.value)}
                className="w-12 bg-transparent text-charcoal-900 focus:outline-none text-center text-xs font-semibold"
              />
            </div>

            {/* Harga */}
            <div className="flex items-center gap-1 bg-warm-50 px-2.5 py-1 rounded-lg border border-warm-200">
              <span className="text-[11px] text-charcoal-500">Harga:</span>
              <input
                type="number"
                placeholder="Min Rp"
                value={filterPriceMin}
                onChange={(e) => setFilterPriceMin(e.target.value)}
                className="w-16 bg-transparent text-charcoal-900 focus:outline-none text-center text-xs font-semibold"
              />
              <span className="text-charcoal-400">-</span>
              <input
                type="number"
                placeholder="Maks Rp"
                value={filterPriceMax}
                onChange={(e) => setFilterPriceMax(e.target.value)}
                className="w-16 bg-transparent text-charcoal-900 focus:outline-none text-center text-xs font-semibold"
              />
            </div>

            {(filterBrand !== 'Semua' ||
              filterStatus !== 'Semua' ||
              filterYearMin ||
              filterYearMax ||
              filterPriceMin ||
              filterPriceMax ||
              searchQuery) && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setFilterBrand('Semua');
                  setFilterStatus('Semua');
                  setFilterYearMin('');
                  setFilterYearMax('');
                  setFilterPriceMin('');
                  setFilterPriceMax('');
                }}
                className="text-gold-700 hover:text-gold-800 font-semibold underline px-1 py-0.5 text-xs"
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
              className="px-2.5 py-1 bg-warm-50 border border-warm-200 rounded-lg text-xs text-charcoal-900 focus:outline-none focus:border-gold-500"
            >
              <option value="date_desc">Tanggal Masuk (Terbaru)</option>
              <option value="date_asc">Tanggal Masuk (Terlama)</option>
              <option value="price_asc">Harga (Termurah)</option>
              <option value="price_desc">Harga (Termahal)</option>
            </select>
          </div>
        </div>
      </div>

      {/* VIEW 1: KARTU SHOWROOM (GRID CARD - AUTOMOTIVE LUXURY) */}
      {viewMode === 'grid' && (
        <div className="space-y-4">
          {filteredStocks.length === 0 ? (
            <div className="crm-card py-16 text-center text-charcoal-400">
              <Car className="w-12 h-12 mx-auto text-charcoal-300 mb-3 stroke-[1.5]" />
              <p className="text-base font-semibold text-charcoal-800">Tidak ada unit kendaraan yang sesuai kriteria</p>
              <p className="text-xs text-charcoal-500 mt-1">Coba ubah kata kunci pencarian atau sesuaikan filter showroom.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredStocks.map((stock) => {
                const thumbnail =
                  stock.photos && stock.photos.length > 0
                    ? stock.photos[0]
                    : 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=600&auto=format&fit=crop&q=80';

                return (
                  <div
                    key={stock.id}
                    className="crm-card overflow-hidden group cursor-pointer hover:border-gold-400 transition-all duration-300 flex flex-col"
                    onClick={() => handleOpenDetail(stock)}
                  >
                    {/* Vehicle Photo Container */}
                    <div className="relative w-full h-52 bg-charcoal-950 overflow-hidden">
                      <img
                        src={thumbnail}
                        alt={`${stock.brand} ${stock.model}`}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>

                      {/* Status Badge Overlay */}
                      <div className="absolute top-3 left-3">
                        {stock.status === 'Tersedia' && (
                          <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-charcoal-900/90 text-gold-400 border border-gold-500/40 backdrop-blur shadow-sm flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-gold-400 animate-pulse"></span>
                            Tersedia Showroom
                          </span>
                        )}
                        {stock.status === 'Terjual' && (
                          <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-charcoal-900/90 text-charcoal-300 border border-charcoal-700 backdrop-blur shadow-sm flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5 text-gold-400" />
                            Terjual
                          </span>
                        )}
                        {stock.status === 'Tidak Aktif' && (
                          <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-950/90 text-amber-300 border border-amber-500/40 backdrop-blur shadow-sm flex items-center gap-1">
                            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                            Salon / Perbaikan
                          </span>
                        )}
                      </div>

                      {/* Photo Count */}
                      {stock.photos && stock.photos.length > 1 && (
                        <div className="absolute top-3 right-3 px-2 py-0.5 rounded-md bg-black/70 text-white text-[10px] font-medium backdrop-blur">
                          {stock.photos.length} Foto
                        </div>
                      )}

                      {/* Price Badge Overlay */}
                      <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between">
                        <div>
                          <span className="text-[10px] uppercase tracking-wider text-charcoal-300 font-semibold block">Harga Penawaran</span>
                          <span className="text-xl font-black text-white drop-shadow-md">
                            {formatRupiah(stock.price)}
                          </span>
                        </div>
                        <span className="text-[11px] font-mono text-gold-300 font-bold px-2 py-0.5 rounded bg-black/60 backdrop-blur border border-gold-500/30">
                          {stock.licensePlate || stock.id}
                        </span>
                      </div>
                    </div>

                    {/* Vehicle Info Body */}
                    <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <span className="text-[11px] font-bold uppercase tracking-wider text-gold-700">
                              {stock.brand}
                            </span>
                            <h3 className="text-base font-bold text-charcoal-900 leading-snug group-hover:text-gold-700 transition-colors">
                              {stock.model}
                            </h3>
                          </div>
                          <span className="px-2 py-1 rounded-lg bg-warm-100 text-charcoal-800 text-xs font-bold shrink-0">
                            {stock.year}
                          </span>
                        </div>

                        {/* Specs Pill Grid */}
                        <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-warm-200/80 text-[11px]">
                          <div className="bg-warm-50 p-2 rounded-lg border border-warm-200">
                            <span className="text-charcoal-400 block text-[10px]">Transmisi</span>
                            <span className="font-semibold text-charcoal-800">{stock.transmission}</span>
                          </div>
                          <div className="bg-warm-50 p-2 rounded-lg border border-warm-200">
                            <span className="text-charcoal-400 block text-[10px]">Odometer</span>
                            <span className="font-semibold text-charcoal-800 font-mono">
                              {stock.mileage.toLocaleString('id-ID')} km
                            </span>
                          </div>
                          <div className="bg-warm-50 p-2 rounded-lg border border-warm-200">
                            <span className="text-charcoal-400 block text-[10px]">Bahan Bakar</span>
                            <span className="font-semibold text-charcoal-800">{stock.fuel}</span>
                          </div>
                        </div>

                        {/* Color & Description preview */}
                        <div className="mt-2.5 flex items-center justify-between text-xs text-charcoal-500">
                          <span className="flex items-center gap-1">
                            <span className="w-2.5 h-2.5 rounded-full bg-charcoal-700 border border-warm-300"></span>
                            {stock.color}
                          </span>
                          <span className="text-[11px] text-charcoal-400">
                            Masuk: {formatDate(stock.entryDate)}
                          </span>
                        </div>
                      </div>

                      {/* Card Action Buttons */}
                      <div className="pt-3 border-t border-warm-200/80 flex items-center justify-between gap-2" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={() => handleOpenDetail(stock)}
                          className="flex-1 py-1.5 px-3 rounded-lg bg-warm-100 hover:bg-gold-50 hover:text-gold-800 text-charcoal-800 font-semibold text-xs transition-colors flex items-center justify-center gap-1.5"
                        >
                          <Eye className="w-3.5 h-3.5 text-gold-600" />
                          Detail Unit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(stock)}
                          className="p-2 rounded-lg bg-warm-100 hover:bg-warm-200 text-charcoal-700 transition-colors"
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
                          className="p-2 rounded-lg bg-warm-100 hover:bg-rose-50 text-charcoal-700 hover:text-rose-600 transition-colors"
                          title="Hapus Unit"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* VIEW 2: TABEL ENTERPRISE */}
      {viewMode === 'table' && (
        <div className="crm-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="crm-table">
              <thead>
                <tr>
                  <th className="py-3 px-3 text-center w-12">No</th>
                  <th className="py-3 px-3 w-20 text-center">Foto</th>
                  <th className="py-3 px-4">Nama Unit</th>
                  <th className="py-3 px-3 text-center">Tahun</th>
                  <th className="py-3 px-3">Warna</th>
                  <th className="py-3 px-3 text-center">Transmisi</th>
                  <th className="py-3 px-3 text-right">Kilometer</th>
                  <th className="py-3 px-4 text-right">Harga</th>
                  <th className="py-3 px-3 text-center">Tgl Masuk</th>
                  <th className="py-3 px-3 text-center">Status</th>
                  <th className="py-3 px-4 text-center w-28">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filteredStocks.length === 0 ? (
                  <tr>
                    <td colSpan={11} className="py-12 text-center text-charcoal-400">
                      <Car className="w-10 h-10 mx-auto text-charcoal-300 mb-2 stroke-[1.5]" />
                      <p className="text-sm font-semibold text-charcoal-700">Tidak ada data unit yang sesuai kriteria</p>
                      <p className="text-xs text-charcoal-400 mt-1">Coba ubah kata kunci pencarian atau reset filter.</p>
                    </td>
                  </tr>
                ) : (
                  filteredStocks.map((stock, idx) => {
                    const thumbnail =
                      stock.photos && stock.photos.length > 0
                        ? stock.photos[0]
                        : 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=150&auto=format&fit=crop&q=80';

                    return (
                      <tr
                        key={stock.id}
                        className="hover:bg-warm-100/60 transition-colors group cursor-pointer"
                        onClick={() => handleOpenDetail(stock)}
                      >
                        {/* No */}
                        <td className="py-3 px-3 text-center text-charcoal-400 font-mono text-xs">
                          {idx + 1}
                        </td>

                        {/* Foto Thumbnail */}
                        <td className="py-2.5 px-3 text-center">
                          <div className="w-14 h-10 rounded-lg overflow-hidden bg-charcoal-900 border border-warm-200 mx-auto relative group-hover:border-gold-500 transition-colors">
                            <img
                              src={thumbnail}
                              alt={`${stock.brand} ${stock.model}`}
                              className="w-full h-full object-cover"
                            />
                            {stock.photos && stock.photos.length > 1 && (
                              <span className="absolute bottom-0 right-0 bg-black/80 text-[9px] text-gold-300 px-1 font-bold rounded-tl">
                                +{stock.photos.length - 1}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Nama Unit */}
                        <td className="py-3 px-4 font-medium text-charcoal-900">
                          <div className="flex items-center gap-1.5">
                            <span className="text-gold-700 font-bold">{stock.brand}</span>
                            <span className="font-bold">{stock.model}</span>
                          </div>
                          <div className="text-[11px] text-charcoal-500 flex items-center gap-2 mt-0.5">
                            <span className="font-mono text-[10px] bg-warm-100 px-1.5 py-0.5 rounded text-charcoal-700 font-semibold border border-warm-200">
                              {stock.licensePlate || stock.id}
                            </span>
                            <span>•</span>
                            <span>{stock.fuel}</span>
                          </div>
                        </td>

                        {/* Tahun */}
                        <td className="py-3 px-3 text-center font-bold text-charcoal-800">
                          {stock.year}
                        </td>

                        {/* Warna */}
                        <td className="py-3 px-3 text-charcoal-700 text-xs">
                          {stock.color}
                        </td>

                        {/* Transmisi */}
                        <td className="py-3 px-3 text-center">
                          <span className="px-2 py-0.5 text-[11px] font-semibold rounded bg-warm-100 text-charcoal-800 border border-warm-200">
                            {stock.transmission}
                          </span>
                        </td>

                        {/* Kilometer */}
                        <td className="py-3 px-3 text-right font-mono text-xs text-charcoal-700 font-medium">
                          {stock.mileage.toLocaleString('id-ID')} km
                        </td>

                        {/* Harga */}
                        <td className="py-3 px-4 text-right font-bold text-charcoal-900">
                          {formatRupiah(stock.price)}
                        </td>

                        {/* Tgl Masuk */}
                        <td className="py-3 px-3 text-center text-xs text-charcoal-500 font-mono">
                          {formatDate(stock.entryDate)}
                        </td>

                        {/* Status */}
                        <td className="py-3 px-3 text-center">
                          {stock.status === 'Tersedia' && (
                            <span className="badge-gold">
                              <span className="w-1.5 h-1.5 rounded-full bg-gold-600 animate-pulse"></span>
                              Tersedia
                            </span>
                          )}
                          {stock.status === 'Terjual' && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-charcoal-100 text-charcoal-800 border border-warm-200">
                              <CheckCircle2 className="w-3 h-3 text-gold-600" />
                              Terjual
                            </span>
                          )}
                          {stock.status === 'Tidak Aktif' && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                              <AlertTriangle className="w-3 h-3 text-amber-500" />
                              Tidak Aktif
                            </span>
                          )}
                        </td>

                        {/* Aksi */}
                        <td className="py-3 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-center gap-1">
                            <button
                              title="Lihat Detail Unit"
                              onClick={() => handleOpenDetail(stock)}
                              className="p-1.5 text-charcoal-500 hover:text-gold-700 hover:bg-warm-100 rounded-lg transition-colors"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              title="Edit Data Unit"
                              onClick={() => handleOpenEdit(stock)}
                              className="p-1.5 text-charcoal-500 hover:text-charcoal-900 hover:bg-warm-100 rounded-lg transition-colors"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              title="Hapus Unit"
                              onClick={() => {
                                setSelectedStock(stock);
                                setShowDeleteModal(true);
                              }}
                              className="p-1.5 text-charcoal-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
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
          <div className="py-3 px-4 bg-warm-50 border-t border-warm-200 flex items-center justify-between text-xs text-charcoal-500">
            <div>
              Menampilkan <span className="text-charcoal-900 font-bold">{filteredStocks.length}</span> dari{' '}
              <span className="text-charcoal-900 font-bold">{stocks.length}</span> total unit kendaraan
            </div>
            <div className="text-charcoal-400">
              Klik baris untuk membuka spesifikasi dan rekomendasi prospek
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL DETAIL UNIT (DENGAN REKOMENDASI PROSPEK LEADS)     */}
      {/* ======================================================== */}
      {showDetailModal && selectedStock && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-charcoal-950/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white border border-warm-200 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-luxury flex flex-col">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-warm-200 flex items-center justify-between sticky top-0 bg-white/95 backdrop-blur z-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-charcoal-900 text-gold-400 flex items-center justify-center shadow-sm">
                  <Car className="w-5 h-5 text-gold-400" />
                </div>
                <div>
                  <h3 className="text-base lg:text-lg font-bold text-charcoal-900 flex items-center gap-2">
                    {selectedStock.brand} {selectedStock.model}
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-warm-100 text-charcoal-700">
                      {selectedStock.year}
                    </span>
                  </h3>
                  <div className="text-xs text-charcoal-500 flex items-center gap-2 mt-0.5">
                    <span className="font-mono text-gold-700 font-bold">{selectedStock.id}</span>
                    <span>•</span>
                    <span className="font-mono">{selectedStock.licensePlate || 'Plat belum terdaftar'}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setShowDetailModal(false);
                    handleOpenEdit(selectedStock);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-warm-100 hover:bg-gold-50 text-xs font-semibold text-charcoal-800 transition-colors flex items-center gap-1.5 border border-warm-200"
                >
                  <Edit2 className="w-3.5 h-3.5 text-gold-600" />
                  Edit Unit
                </button>
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="p-2 text-charcoal-400 hover:text-charcoal-700 rounded-xl hover:bg-warm-100 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6">
              {/* Image Gallery */}
              <div className="space-y-3">
                <div className="w-full h-72 md:h-84 rounded-2xl overflow-hidden bg-charcoal-950 border border-warm-200 relative shadow-sm">
                  {selectedStock.photos && selectedStock.photos.length > 0 ? (
                    <img
                      src={selectedStock.photos[activePhotoIdx] || selectedStock.photos[0]}
                      alt={`${selectedStock.brand} ${selectedStock.model}`}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-charcoal-500">
                      <ImageIcon className="w-12 h-12 mb-2 text-charcoal-600" />
                      <span>Belum ada foto mobil</span>
                    </div>
                  )}

                  {/* Status Overlay */}
                  <div className="absolute top-3 left-3">
                    {selectedStock.status === 'Tersedia' && (
                      <span className="px-3 py-1 rounded-full text-xs font-bold bg-charcoal-900/90 text-gold-400 border border-gold-500/40 shadow-lg backdrop-blur">
                        Tersedia di Showroom
                      </span>
                    )}
                    {selectedStock.status === 'Terjual' && (
                      <span className="px-3 py-1 rounded-full text-xs font-bold bg-charcoal-900/90 text-charcoal-200 border border-charcoal-700 shadow-lg backdrop-blur">
                        Terjual ({selectedStock.soldDate ? formatDate(selectedStock.soldDate) : 'Selesai'})
                      </span>
                    )}
                    {selectedStock.status === 'Tidak Aktif' && (
                      <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-950/90 text-amber-300 border border-amber-500/40 shadow-lg backdrop-blur">
                        Tidak Aktif / Maintenance
                      </span>
                    )}
                  </div>

                  {/* Price Overlay */}
                  <div className="absolute bottom-3 right-3 bg-charcoal-950/90 border border-gold-500/30 px-4 py-2.5 rounded-xl backdrop-blur shadow-lg">
                    <div className="text-[10px] uppercase tracking-wider text-charcoal-400 font-semibold">Harga Penawaran</div>
                    <div className="text-xl font-black text-gold-400">
                      {formatRupiah(selectedStock.price)}
                    </div>
                  </div>
                </div>

                {/* Thumbnails row */}
                {selectedStock.photos && selectedStock.photos.length > 1 && (
                  <div className="flex items-center gap-2 overflow-x-auto pb-1">
                    {selectedStock.photos.map((p: string, idx: number) => (
                      <button
                        key={idx}
                        onClick={() => setActivePhotoIdx(idx)}
                        className={`w-20 h-14 rounded-xl overflow-hidden border-2 transition-all flex-shrink-0 ${
                          activePhotoIdx === idx
                            ? 'border-gold-500 ring-2 ring-gold-500/30 scale-102'
                            : 'border-warm-200 opacity-70 hover:opacity-100'
                        }`}
                      >
                        <img src={p} alt={`Foto ${idx + 1}`} className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Technical Specifications Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-warm-50 p-4 rounded-xl border border-warm-200">
                <div className="p-2">
                  <span className="text-[11px] text-charcoal-500 flex items-center gap-1 font-medium">
                    <Calendar className="w-3.5 h-3.5 text-gold-600" /> Tahun
                  </span>
                  <div className="text-sm font-bold text-charcoal-900 mt-1">{selectedStock.year}</div>
                </div>
                <div className="p-2">
                  <span className="text-[11px] text-charcoal-500 flex items-center gap-1 font-medium">
                    <Tag className="w-3.5 h-3.5 text-gold-600" /> Warna
                  </span>
                  <div className="text-sm font-bold text-charcoal-900 mt-1">{selectedStock.color}</div>
                </div>
                <div className="p-2">
                  <span className="text-[11px] text-charcoal-500 flex items-center gap-1 font-medium">
                    <Gauge className="w-3.5 h-3.5 text-gold-600" /> Transmisi
                  </span>
                  <div className="text-sm font-bold text-charcoal-900 mt-1">{selectedStock.transmission}</div>
                </div>
                <div className="p-2">
                  <span className="text-[11px] text-charcoal-500 flex items-center gap-1 font-medium">
                    <Fuel className="w-3.5 h-3.5 text-gold-600" /> Bahan Bakar
                  </span>
                  <div className="text-sm font-bold text-charcoal-900 mt-1">{selectedStock.fuel}</div>
                </div>
                <div className="p-2">
                  <span className="text-[11px] text-charcoal-500 flex items-center gap-1 font-medium">
                    <Gauge className="w-3.5 h-3.5 text-gold-600" /> Odometer
                  </span>
                  <div className="text-sm font-bold text-charcoal-900 mt-1 font-mono">
                    {selectedStock.mileage.toLocaleString('id-ID')} KM
                  </div>
                </div>
                <div className="p-2">
                  <span className="text-[11px] text-charcoal-500 flex items-center gap-1 font-medium">
                    <Clock className="w-3.5 h-3.5 text-gold-600" /> Tanggal Masuk
                  </span>
                  <div className="text-sm font-bold text-charcoal-900 mt-1">
                    {formatDate(selectedStock.entryDate)}
                  </div>
                </div>
                <div className="p-2">
                  <span className="text-[11px] text-charcoal-500 flex items-center gap-1 font-medium">
                    <Car className="w-3.5 h-3.5 text-gold-600" /> No. Polisi
                  </span>
                  <div className="text-sm font-bold text-charcoal-900 mt-1 font-mono">
                    {selectedStock.licensePlate || '-'}
                  </div>
                </div>
                <div className="p-2">
                  <span className="text-[11px] text-charcoal-500 flex items-center gap-1 font-medium">
                    <DollarSign className="w-3.5 h-3.5 text-gold-600" /> Status Unit
                  </span>
                  <div className="text-sm font-bold text-gold-700 mt-1">
                    {selectedStock.status}
                  </div>
                </div>
              </div>

              {/* Description */}
              {selectedStock.description && (
                <div className="space-y-1.5">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-charcoal-500">
                    Deskripsi & Kondisi Kendaraan
                  </h4>
                  <p className="text-xs text-charcoal-700 bg-warm-50 p-4 rounded-xl border border-warm-200 leading-relaxed whitespace-pre-line">
                    {selectedStock.description}
                  </p>
                </div>
              )}

              {/* INTEGRASI CRM: DAFTAR PROSPEK YANG MEMBUTUHKAN UNIT INI */}
              <div className="space-y-3 pt-2 border-t border-warm-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-gold-600" />
                    <h4 className="text-xs font-bold text-charcoal-900">
                      Prospek Konsumen yang Mencari Unit Ini ({matchingLeads.length})
                    </h4>
                  </div>
                  <span className="text-[11px] text-charcoal-500">
                    Otomatis dicocokkan dari Leads Management
                  </span>
                </div>

                {matchingLeads.length === 0 ? (
                  <div className="text-xs text-charcoal-500 bg-warm-50 p-4 rounded-xl border border-warm-200 text-center">
                    Belum ada prospek aktif di Leads Management yang mencari {selectedStock.brand} {selectedStock.model}.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {matchingLeads.map((lead) => {
                      const leadPhone = lead.contactNumber || lead.customerPhone || '';
                      const waMessage = `Halo ${lead.customerName}, kami dari HR MOTOR Garut ingin mengabarkan bahwa unit ${selectedStock.brand} ${selectedStock.model} (${selectedStock.year}) yang Anda cari baru saja tersedia di showroom kami dengan harga ${formatRupiah(selectedStock.price)}. Apakah berkenan kami kirimkan foto dan videonya?`;
                      const waLink = formatWhatsAppLink(leadPhone, waMessage);

                      return (
                        <div
                          key={lead.id}
                          className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl bg-warm-50 border border-warm-200 hover:border-gold-400 transition-colors"
                        >
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-xs text-charcoal-900">{lead.customerName}</span>
                              <span className="badge-gold text-[10px]">
                                {lead.status}
                              </span>
                            </div>
                            <div className="text-xs text-charcoal-500 mt-1 flex flex-wrap items-center gap-2">
                              <span>Telp: {leadPhone}</span>
                              <span>•</span>
                              <span>
                                Budget: {lead.searchBudgetMax ? formatRupiah(lead.searchBudgetMax) : 'Fleksibel'}
                              </span>
                              {lead.searchYearMin && (
                                <>
                                  <span>•</span>
                                  <span>Tahun: {lead.searchYearMin} - {lead.searchYearMax || 'Sekarang'}</span>
                                </>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <a
                              href={waLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="btn-gold inline-flex items-center gap-1.5 py-1.5 px-3 text-xs"
                            >
                              <MessageCircle className="w-3.5 h-3.5" />
                              Hubungi WhatsApp
                            </a>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3.5 border-t border-warm-200 bg-warm-50 flex items-center justify-between text-xs text-charcoal-500">
              <span className="font-mono">ID: {selectedStock.id}</span>
              <button
                onClick={() => setShowDetailModal(false)}
                className="px-4 py-2 rounded-xl bg-charcoal-800 hover:bg-charcoal-900 text-white font-semibold text-xs transition-colors"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL TAMBAH UNIT BARU / EDIT UNIT                        */}
      {/* ======================================================== */}
      {(showAddModal || showEditModal) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-charcoal-950/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white border border-warm-200 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-luxury flex flex-col">
            <div className="px-6 py-4 border-b border-warm-200 flex items-center justify-between sticky top-0 bg-white/95 backdrop-blur z-10">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-charcoal-900 text-gold-400 flex items-center justify-center shadow-sm">
                  <Car className="w-4 h-4 text-gold-400" />
                </div>
                <h3 className="text-base font-bold text-charcoal-900">
                  {showAddModal ? 'Tambah Stok Unit Baru Showroom' : `Edit Data Unit (${selectedStock?.id})`}
                </h3>
              </div>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setShowEditModal(false);
                }}
                className="p-1.5 text-charcoal-400 hover:text-charcoal-700 rounded-lg hover:bg-warm-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={showAddModal ? handleSubmitAdd : handleSubmitEdit} className="p-6 space-y-4">
              {formError && (
                <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Merek */}
                <div>
                  <label className="block text-xs font-semibold text-charcoal-700 mb-1">
                    Merek Mobil <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={formData.brand}
                    onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                    className="w-full px-3 py-2 bg-warm-50 border border-warm-200 rounded-xl text-xs text-charcoal-900 focus:outline-none focus:border-gold-500 focus:ring-1 focus:ring-gold-500/30"
                  >
                    {COMMON_BRANDS.map((b) => (
                      <option key={b} value={b}>
                        {b}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Model */}
                <div>
                  <label className="block text-xs font-semibold text-charcoal-700 mb-1">
                    Model / Tipe Mobil <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Avanza 1.3 G, Brio Satya E"
                    value={formData.model}
                    onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                    className="w-full px-3 py-2 bg-warm-50 border border-warm-200 rounded-xl text-xs text-charcoal-900 focus:outline-none focus:border-gold-500 focus:ring-1 focus:ring-gold-500/30"
                  />
                </div>

                {/* Tahun */}
                <div>
                  <label className="block text-xs font-semibold text-charcoal-700 mb-1">
                    Tahun Kendaraan <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    min={2000}
                    max={2030}
                    value={formData.year}
                    onChange={(e) => setFormData({ ...formData, year: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-warm-50 border border-warm-200 rounded-xl text-xs text-charcoal-900 focus:outline-none focus:border-gold-500 focus:ring-1 focus:ring-gold-500/30"
                  />
                </div>

                {/* Warna */}
                <div>
                  <label className="block text-xs font-semibold text-charcoal-700 mb-1">
                    Warna Mobil <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Hitam Metalik, Putih Mutiara"
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    className="w-full px-3 py-2 bg-warm-50 border border-warm-200 rounded-xl text-xs text-charcoal-900 focus:outline-none focus:border-gold-500 focus:ring-1 focus:ring-gold-500/30"
                  />
                </div>

                {/* Transmisi */}
                <div>
                  <label className="block text-xs font-semibold text-charcoal-700 mb-1">
                    Transmisi <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={formData.transmission}
                    onChange={(e) => setFormData({ ...formData, transmission: e.target.value as TransmissionType })}
                    className="w-full px-3 py-2 bg-warm-50 border border-warm-200 rounded-xl text-xs text-charcoal-900 focus:outline-none focus:border-gold-500 focus:ring-1 focus:ring-gold-500/30"
                  >
                    {TRANSMISSIONS.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Bahan Bakar */}
                <div>
                  <label className="block text-xs font-semibold text-charcoal-700 mb-1">
                    Bahan Bakar <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={formData.fuel}
                    onChange={(e) => setFormData({ ...formData, fuel: e.target.value as FuelType })}
                    className="w-full px-3 py-2 bg-warm-50 border border-warm-200 rounded-xl text-xs text-charcoal-900 focus:outline-none focus:border-gold-500 focus:ring-1 focus:ring-gold-500/30"
                  >
                    {FUELS.map((f) => (
                      <option key={f} value={f}>
                        {f}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Kilometer */}
                <div>
                  <label className="block text-xs font-semibold text-charcoal-700 mb-1">
                    Kilometer (KM) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={formData.mileage}
                    onChange={(e) => setFormData({ ...formData, mileage: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-warm-50 border border-warm-200 rounded-xl text-xs text-charcoal-900 focus:outline-none focus:border-gold-500 focus:ring-1 focus:ring-gold-500/30 font-mono"
                  />
                </div>

                {/* Harga */}
                <div>
                  <label className="block text-xs font-semibold text-charcoal-700 mb-1">
                    Harga Jual (Rp) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    min={1000000}
                    step={1000000}
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-warm-50 border border-warm-200 rounded-xl text-xs text-charcoal-900 font-bold focus:outline-none focus:border-gold-500 focus:ring-1 focus:ring-gold-500/30"
                  />
                  <div className="text-[11px] text-gold-700 font-semibold mt-1">
                    Preview: {formatRupiah(formData.price || 0)}
                  </div>
                </div>

                {/* Tanggal Masuk */}
                <div>
                  <label className="block text-xs font-semibold text-charcoal-700 mb-1">
                    Tanggal Masuk Showroom <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.entryDate}
                    onChange={(e) => setFormData({ ...formData, entryDate: e.target.value })}
                    className="w-full px-3 py-2 bg-warm-50 border border-warm-200 rounded-xl text-xs text-charcoal-900 focus:outline-none focus:border-gold-500 focus:ring-1 focus:ring-gold-500/30"
                  />
                </div>

                {/* Status Unit */}
                <div>
                  <label className="block text-xs font-semibold text-charcoal-700 mb-1">
                    Status Unit <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as VehicleStockStatus })}
                    className="w-full px-3 py-2 bg-warm-50 border border-warm-200 rounded-xl text-xs text-charcoal-900 focus:outline-none focus:border-gold-500 focus:ring-1 focus:ring-gold-500/30"
                  >
                    {STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Nomor Polisi */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-charcoal-700 mb-1">
                    Nomor Polisi (Plat Mobil)
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: Z 1482 DA (Garut / Jawa Barat)"
                    value={formData.licensePlate}
                    onChange={(e) => setFormData({ ...formData, licensePlate: e.target.value })}
                    className="w-full px-3 py-2 bg-warm-50 border border-warm-200 rounded-xl text-xs text-charcoal-900 focus:outline-none focus:border-gold-500 focus:ring-1 focus:ring-gold-500/30 font-mono"
                  />
                </div>
              </div>

              {/* Multi-Photo Input */}
              <div className="space-y-2 pt-2 border-t border-warm-200">
                <label className="block text-xs font-semibold text-charcoal-700">
                  Foto-foto Mobil (URL Gambar)
                </label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    placeholder="Masukkan URL foto mobil (https://...)"
                    value={formData.newPhotoUrl}
                    onChange={(e) => setFormData({ ...formData, newPhotoUrl: e.target.value })}
                    className="flex-1 px-3 py-2 bg-warm-50 border border-warm-200 rounded-xl text-xs text-charcoal-900 focus:outline-none focus:border-gold-500 focus:ring-1 focus:ring-gold-500/30"
                  />
                  <button
                    type="button"
                    onClick={handleAddPhoto}
                    className="px-4 py-2 rounded-xl bg-charcoal-800 hover:bg-charcoal-900 text-xs font-semibold text-white transition-colors"
                  >
                    Tambah Foto
                  </button>
                </div>

                {/* Thumbnails preview */}
                {formData.photos.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {formData.photos.map((p, idx) => (
                      <div key={idx} className="relative group w-20 h-14 rounded-xl overflow-hidden border border-warm-200">
                        <img src={p} alt={`Foto ${idx + 1}`} className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => handleRemovePhoto(idx)}
                          className="absolute inset-0 bg-black/70 flex items-center justify-center text-rose-400 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-semibold text-charcoal-700 mb-1">
                  Deskripsi / Catatan Kondisi Unit Showroom
                </label>
                <textarea
                  rows={3}
                  placeholder="Kondisi mesin, keaslian kilometer, kondisi body dan cat, kelengkapan surat, masa berlaku pajak..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 bg-warm-50 border border-warm-200 rounded-xl text-xs text-charcoal-900 focus:outline-none focus:border-gold-500 focus:ring-1 focus:ring-gold-500/30"
                ></textarea>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-warm-200">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setShowEditModal(false);
                  }}
                  className="px-4 py-2 rounded-xl bg-warm-100 hover:bg-warm-200 text-charcoal-700 font-semibold text-xs transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn-gold px-5 py-2 text-xs"
                >
                  {isSubmitting ? 'Menyimpan...' : showAddModal ? 'Simpan Unit Baru' : 'Perbarui Unit'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL HAPUS UNIT                                          */}
      {/* ======================================================== */}
      {showDeleteModal && selectedStock && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-charcoal-950/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white border border-warm-200 rounded-2xl w-full max-w-md p-6 shadow-luxury space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-charcoal-900">Hapus Unit Kendaraan</h3>
                <p className="text-xs text-charcoal-500">{selectedStock.id}</p>
              </div>
            </div>

            <p className="text-xs text-charcoal-600 leading-relaxed">
              Apakah Anda yakin ingin menghapus unit{' '}
              <span className="font-bold text-charcoal-900">
                {selectedStock.brand} {selectedStock.model} ({selectedStock.year})
              </span>{' '}
              dari daftar stok showroom? Data yang dihapus tidak dapat dipulihkan.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 rounded-xl bg-warm-100 hover:bg-warm-200 text-charcoal-700 font-semibold text-xs transition-colors"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isSubmitting}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs transition-all shadow-sm disabled:opacity-50"
              >
                {isSubmitting ? 'Menghapus...' : 'Ya, Hapus Unit'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
