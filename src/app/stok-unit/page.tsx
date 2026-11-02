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
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              <Car className="w-7 h-7 text-emerald-400" />
              Manajemen Stok Unit
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              Live Showroom HR MOTOR
            </span>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Pantau ketersediaan unit masuk, unit display showroom, dan mobil yang telah terjual di Garut.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-sm transition-all shadow-lg shadow-emerald-950/40 active:scale-95"
        >
          <Plus className="w-4 h-4" />
          Tambah Unit Baru
        </button>
      </div>

      {/* DASHBOARD RINGKASAN STOK UNIT */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {/* Total Unit */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 shadow-sm backdrop-blur">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Total Stok Unit</span>
            <Layers className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-bold text-white">{dashboardStats.total}</div>
          <div className="text-xs text-slate-500 mt-1">Seluruh inventaris</div>
        </div>

        {/* Unit Tersedia */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 shadow-sm backdrop-blur">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Unit Tersedia</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-emerald-400">{dashboardStats.tersedia}</div>
          <div className="text-xs text-emerald-500/70 mt-1">Siap dipasarkan</div>
        </div>

        {/* Unit Terjual */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 shadow-sm backdrop-blur">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Unit Terjual</span>
            <ShoppingBag className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-bold text-blue-400">{dashboardStats.terjual}</div>
          <div className="text-xs text-blue-500/70 mt-1">Deal konsumen</div>
        </div>

        {/* Unit Tidak Aktif */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 shadow-sm backdrop-blur">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Tidak Aktif</span>
            <AlertTriangle className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-amber-400">{dashboardStats.tidakAktif}</div>
          <div className="text-xs text-amber-500/70 mt-1">Salon / perbaikan</div>
        </div>

        {/* Unit Terbaru Masuk */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 shadow-sm backdrop-blur">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-medium">Unit Terbaru</span>
            <Sparkles className="w-4 h-4 text-purple-400" />
          </div>
          {dashboardStats.newestUnit ? (
            <div>
              <div className="text-sm font-semibold text-white truncate" title={`${dashboardStats.newestUnit.brand} ${dashboardStats.newestUnit.model}`}>
                {dashboardStats.newestUnit.brand} {dashboardStats.newestUnit.model}
              </div>
              <div className="text-xs text-purple-400 mt-0.5">
                {formatDate(dashboardStats.newestUnit.entryDate)}
              </div>
            </div>
          ) : (
            <div className="text-sm text-slate-500">-</div>
          )}
        </div>

        {/* Unit Paling Lama (Aging) */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 shadow-sm backdrop-blur">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-medium">Paling Lama (Aging)</span>
            <Clock className="w-4 h-4 text-rose-400" />
          </div>
          {dashboardStats.oldestAvailable ? (
            <div>
              <div className="text-sm font-semibold text-white truncate" title={`${dashboardStats.oldestAvailable.brand} ${dashboardStats.oldestAvailable.model}`}>
                {dashboardStats.oldestAvailable.brand} {dashboardStats.oldestAvailable.model}
              </div>
              <div className="text-xs text-rose-400 mt-0.5 font-medium">
                {dashboardStats.agingDays} hari tersedia
              </div>
            </div>
          ) : (
            <div className="text-sm text-slate-500">-</div>
          )}
        </div>
      </div>

      {/* SEARCH, FILTER & SORT BAR */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 space-y-4 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          {/* Search */}
          <div className="md:col-span-2 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Cari unit (Merek, model, nomor polisi, deskripsi)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-950/60 border border-slate-800 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50"
            />
          </div>

          {/* Merek Filter */}
          <div>
            <select
              value={filterBrand}
              onChange={(e) => setFilterBrand(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950/60 border border-slate-800 rounded-lg text-sm text-white focus:outline-none focus:border-emerald-500/50"
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
              className="w-full px-3 py-2 bg-slate-950/60 border border-slate-800 rounded-lg text-sm text-white focus:outline-none focus:border-emerald-500/50"
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

        {/* Secondary filters: Year, Price, Sort */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-800/60 text-xs">
          <div className="flex flex-wrap items-center gap-2 text-slate-400">
            <span className="flex items-center gap-1 font-medium text-slate-300">
              <Filter className="w-3.5 h-3.5" /> Filter Rentang:
            </span>

            {/* Tahun */}
            <div className="flex items-center gap-1 bg-slate-950/50 px-2 py-1 rounded border border-slate-800">
              <span>Tahun:</span>
              <input
                type="number"
                placeholder="Min"
                value={filterYearMin}
                onChange={(e) => setFilterYearMin(e.target.value)}
                className="w-14 bg-transparent text-white focus:outline-none text-center"
              />
              <span>-</span>
              <input
                type="number"
                placeholder="Maks"
                value={filterYearMax}
                onChange={(e) => setFilterYearMax(e.target.value)}
                className="w-14 bg-transparent text-white focus:outline-none text-center"
              />
            </div>

            {/* Harga */}
            <div className="flex items-center gap-1 bg-slate-950/50 px-2 py-1 rounded border border-slate-800">
              <span>Harga:</span>
              <input
                type="number"
                placeholder="Min Rp"
                value={filterPriceMin}
                onChange={(e) => setFilterPriceMin(e.target.value)}
                className="w-20 bg-transparent text-white focus:outline-none text-center"
              />
              <span>-</span>
              <input
                type="number"
                placeholder="Maks Rp"
                value={filterPriceMax}
                onChange={(e) => setFilterPriceMax(e.target.value)}
                className="w-20 bg-transparent text-white focus:outline-none text-center"
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
                className="text-emerald-400 hover:underline px-1 py-0.5"
              >
                Reset Filter
              </button>
            )}
          </div>

          {/* Sort By */}
          <div className="flex items-center gap-2 ml-auto">
            <span className="text-slate-400 flex items-center gap-1">
              <ArrowUpDown className="w-3.5 h-3.5" /> Urutkan:
            </span>
            <select
              value={sortBy}
              onChange={(e: any) => setSortBy(e.target.value)}
              className="px-2.5 py-1 bg-slate-950/60 border border-slate-800 rounded text-xs text-white focus:outline-none focus:border-emerald-500"
            >
              <option value="date_desc">Tanggal Masuk (Terbaru)</option>
              <option value="date_asc">Tanggal Masuk (Terlama)</option>
              <option value="price_asc">Harga (Termurah)</option>
              <option value="price_desc">Harga (Termahal)</option>
            </select>
          </div>
        </div>
      </div>

      {/* STOK UNIT TABLE */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="text-xs uppercase bg-slate-950/70 text-slate-400 border-b border-slate-800">
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
            <tbody className="divide-y divide-slate-800/60">
              {filteredStocks.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-12 text-center text-slate-500">
                    <Car className="w-12 h-12 mx-auto text-slate-600 mb-2 stroke-[1.5]" />
                    <p className="text-base font-medium text-slate-400">Tidak ada data unit yang sesuai kriteria</p>
                    <p className="text-xs text-slate-500 mt-1">Coba ubah kata kunci pencarian atau reset filter.</p>
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
                      className="hover:bg-slate-800/40 transition-colors group cursor-pointer"
                      onClick={() => handleOpenDetail(stock)}
                    >
                      {/* No */}
                      <td className="py-3 px-3 text-center text-slate-500 font-mono text-xs">
                        {idx + 1}
                      </td>

                      {/* Foto Thumbnail */}
                      <td className="py-2.5 px-3 text-center">
                        <div className="w-14 h-10 rounded-lg overflow-hidden bg-slate-950 border border-slate-800 mx-auto relative group-hover:border-emerald-500/50 transition-colors">
                          <img
                            src={thumbnail}
                            alt={`${stock.brand} ${stock.model}`}
                            className="w-full h-full object-cover"
                          />
                          {stock.photos && stock.photos.length > 1 && (
                            <span className="absolute bottom-0 right-0 bg-black/70 text-[9px] text-white px-1 font-medium rounded-tl">
                              +{stock.photos.length - 1}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Nama Unit */}
                      <td className="py-3 px-4 font-medium text-white">
                        <div className="flex items-center gap-1.5">
                          <span className="text-emerald-400 font-semibold">{stock.brand}</span>
                          <span>{stock.model}</span>
                        </div>
                        <div className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
                          <span className="font-mono text-[11px] bg-slate-800 px-1.5 py-0.2 rounded text-slate-300">
                            {stock.licensePlate || stock.id}
                          </span>
                          <span className="text-slate-500">•</span>
                          <span>{stock.fuel}</span>
                        </div>
                      </td>

                      {/* Tahun */}
                      <td className="py-3 px-3 text-center font-medium text-slate-300">
                        {stock.year}
                      </td>

                      {/* Warna */}
                      <td className="py-3 px-3 text-slate-300 text-xs">
                        {stock.color}
                      </td>

                      {/* Transmisi */}
                      <td className="py-3 px-3 text-center">
                        <span className="px-2 py-0.5 text-xs rounded bg-slate-800 text-slate-300 border border-slate-700/50">
                          {stock.transmission}
                        </span>
                      </td>

                      {/* Kilometer */}
                      <td className="py-3 px-3 text-right font-mono text-xs text-slate-300">
                        {stock.mileage.toLocaleString('id-ID')} km
                      </td>

                      {/* Harga */}
                      <td className="py-3 px-4 text-right font-bold text-emerald-400">
                        {formatRupiah(stock.price)}
                      </td>

                      {/* Tgl Masuk */}
                      <td className="py-3 px-3 text-center text-xs text-slate-400 font-mono">
                        {formatDate(stock.entryDate)}
                      </td>

                      {/* Status */}
                      <td className="py-3 px-3 text-center">
                        {stock.status === 'Tersedia' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                            Tersedia
                          </span>
                        )}
                        {stock.status === 'Terjual' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                            <CheckCircle2 className="w-3 h-3" />
                            Terjual
                          </span>
                        )}
                        {stock.status === 'Tidak Aktif' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                            <AlertTriangle className="w-3 h-3" />
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
                            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-colors"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            title="Edit Data Unit"
                            onClick={() => handleOpenEdit(stock)}
                            className="p-1.5 text-slate-400 hover:text-emerald-400 hover:bg-slate-800 rounded transition-colors"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            title="Hapus Unit"
                            onClick={() => {
                              setSelectedStock(stock);
                              setShowDeleteModal(true);
                            }}
                            className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded transition-colors"
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
        <div className="py-2.5 px-4 bg-slate-950/70 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <div>
            Menampilkan <span className="text-white font-medium">{filteredStocks.length}</span> dari{' '}
            <span className="text-white font-medium">{stocks.length}</span> total unit kendaraan
          </div>
          <div className="text-slate-500">
            Klik baris untuk membuka spesifikasi dan rekomendasi prospek
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* MODAL DETAIL UNIT (DENGAN REKOMENDASI PROSPEK LEADS)     */}
      {/* ======================================================== */}
      {showDetailModal && selectedStock && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between sticky top-0 bg-slate-900/95 backdrop-blur z-10">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <Car className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    {selectedStock.brand} {selectedStock.model}
                    <span className="text-sm font-normal text-slate-400">({selectedStock.year})</span>
                  </h3>
                  <div className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
                    <span className="font-mono text-emerald-400 font-semibold">{selectedStock.id}</span>
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
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 transition-colors flex items-center gap-1.5"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  Edit Unit
                </button>
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6">
              {/* Image Gallery */}
              <div className="space-y-3">
                <div className="w-full h-72 md:h-80 rounded-xl overflow-hidden bg-slate-950 border border-slate-800 relative">
                  {selectedStock.photos && selectedStock.photos.length > 0 ? (
                    <img
                      src={selectedStock.photos[activePhotoIdx] || selectedStock.photos[0]}
                      alt={`${selectedStock.brand} ${selectedStock.model}`}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-slate-600">
                      <ImageIcon className="w-12 h-12 mb-2" />
                      <span>Belum ada foto mobil</span>
                    </div>
                  )}

                  {/* Status Overlay */}
                  <div className="absolute top-3 left-3">
                    {selectedStock.status === 'Tersedia' && (
                      <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/90 text-white shadow-lg backdrop-blur">
                        Tersedia di Showroom
                      </span>
                    )}
                    {selectedStock.status === 'Terjual' && (
                      <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-600/90 text-white shadow-lg backdrop-blur">
                        Terjual ({selectedStock.soldDate ? formatDate(selectedStock.soldDate) : 'Selesai'})
                      </span>
                    )}
                    {selectedStock.status === 'Tidak Aktif' && (
                      <span className="px-3 py-1 rounded-full text-xs font-semibold bg-amber-600/90 text-white shadow-lg backdrop-blur">
                        Tidak Aktif / Maintenance
                      </span>
                    )}
                  </div>

                  {/* Price Overlay */}
                  <div className="absolute bottom-3 right-3 bg-slate-950/90 border border-slate-700/60 px-4 py-2 rounded-xl backdrop-blur">
                    <div className="text-[11px] text-slate-400">Harga Penawaran</div>
                    <div className="text-xl font-bold text-emerald-400">
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
                        className={`w-16 h-12 rounded-lg overflow-hidden border-2 transition-all flex-shrink-0 ${
                          activePhotoIdx === idx
                            ? 'border-emerald-500 ring-2 ring-emerald-500/30'
                            : 'border-slate-800 opacity-60 hover:opacity-100'
                        }`}
                      >
                        <img src={p} alt={`Foto ${idx + 1}`} className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Technical Specifications Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-950/60 p-4 rounded-xl border border-slate-800">
                <div>
                  <span className="text-xs text-slate-500 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" /> Tahun
                  </span>
                  <div className="text-sm font-semibold text-white mt-1">{selectedStock.year}</div>
                </div>
                <div>
                  <span className="text-xs text-slate-500 flex items-center gap-1">
                    <Tag className="w-3.5 h-3.5" /> Warna
                  </span>
                  <div className="text-sm font-semibold text-white mt-1">{selectedStock.color}</div>
                </div>
                <div>
                  <span className="text-xs text-slate-500 flex items-center gap-1">
                    <Gauge className="w-3.5 h-3.5" /> Transmisi
                  </span>
                  <div className="text-sm font-semibold text-white mt-1">{selectedStock.transmission}</div>
                </div>
                <div>
                  <span className="text-xs text-slate-500 flex items-center gap-1">
                    <Fuel className="w-3.5 h-3.5" /> Bahan Bakar
                  </span>
                  <div className="text-sm font-semibold text-white mt-1">{selectedStock.fuel}</div>
                </div>
                <div>
                  <span className="text-xs text-slate-500 flex items-center gap-1">
                    <Gauge className="w-3.5 h-3.5" /> Odometer
                  </span>
                  <div className="text-sm font-semibold text-white mt-1 font-mono">
                    {selectedStock.mileage.toLocaleString('id-ID')} KM
                  </div>
                </div>
                <div>
                  <span className="text-xs text-slate-500 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" /> Tanggal Masuk
                  </span>
                  <div className="text-sm font-semibold text-white mt-1">
                    {formatDate(selectedStock.entryDate)}
                  </div>
                </div>
                <div>
                  <span className="text-xs text-slate-500 flex items-center gap-1">
                    <Car className="w-3.5 h-3.5" /> No. Polisi
                  </span>
                  <div className="text-sm font-semibold text-white mt-1 font-mono">
                    {selectedStock.licensePlate || '-'}
                  </div>
                </div>
                <div>
                  <span className="text-xs text-slate-500 flex items-center gap-1">
                    <DollarSign className="w-3.5 h-3.5" /> Status Unit
                  </span>
                  <div className="text-sm font-semibold text-emerald-400 mt-1">
                    {selectedStock.status}
                  </div>
                </div>
              </div>

              {/* Description */}
              {selectedStock.description && (
                <div className="space-y-1.5">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Deskripsi & Kondisi Kendaraan
                  </h4>
                  <p className="text-sm text-slate-300 bg-slate-950/40 p-3.5 rounded-xl border border-slate-800 leading-relaxed whitespace-pre-line">
                    {selectedStock.description}
                  </p>
                </div>
              )}

              {/* INTEGRASI CRM: DAFTAR PROSPEK YANG MEMBUTUHKAN UNIT INI */}
              <div className="space-y-3 pt-2 border-t border-slate-800">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-emerald-400" />
                    <h4 className="text-sm font-bold text-white">
                      Prospek Konsumen yang Mencari Unit Ini ({matchingLeads.length})
                    </h4>
                  </div>
                  <span className="text-xs text-slate-500">
                    Otomatis dicocokkan dari Leads Management
                  </span>
                </div>

                {matchingLeads.length === 0 ? (
                  <div className="text-xs text-slate-500 bg-slate-950/30 p-3.5 rounded-xl border border-slate-800/80 text-center">
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
                          className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-xl bg-slate-950 border border-slate-800 hover:border-emerald-500/30 transition-colors"
                        >
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-sm text-white">{lead.customerName}</span>
                              <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                {lead.status}
                              </span>
                            </div>
                            <div className="text-xs text-slate-400 mt-1 flex flex-wrap items-center gap-2">
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
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs transition-colors shadow-sm"
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
            <div className="px-6 py-3.5 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between text-xs text-slate-500">
              <span>ID: {selectedStock.id}</span>
              <button
                onClick={() => setShowDetailModal(false)}
                className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col">
            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between sticky top-0 bg-slate-900/95 backdrop-blur z-10">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Car className="w-5 h-5 text-emerald-400" />
                {showAddModal ? 'Tambah Stok Unit Baru' : `Edit Data Unit (${selectedStock?.id})`}
              </h3>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setShowEditModal(false);
                }}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={showAddModal ? handleSubmitAdd : handleSubmitEdit} className="p-6 space-y-4">
              {formError && (
                <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Merek */}
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Merek Mobil <span className="text-rose-400">*</span>
                  </label>
                  <select
                    value={formData.brand}
                    onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white focus:outline-none focus:border-emerald-500"
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
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Model / Tipe Mobil <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Avanza 1.3 G, Brio Satya E"
                    value={formData.model}
                    onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                {/* Tahun */}
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Tahun Kendaraan <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    min={2000}
                    max={2030}
                    value={formData.year}
                    onChange={(e) => setFormData({ ...formData, year: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                {/* Warna */}
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Warna Mobil <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Hitam Metalik, Putih"
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                {/* Transmisi */}
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Transmisi <span className="text-rose-400">*</span>
                  </label>
                  <select
                    value={formData.transmission}
                    onChange={(e) => setFormData({ ...formData, transmission: e.target.value as TransmissionType })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white focus:outline-none focus:border-emerald-500"
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
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Bahan Bakar <span className="text-rose-400">*</span>
                  </label>
                  <select
                    value={formData.fuel}
                    onChange={(e) => setFormData({ ...formData, fuel: e.target.value as FuelType })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white focus:outline-none focus:border-emerald-500"
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
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Kilometer (KM) <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={formData.mileage}
                    onChange={(e) => setFormData({ ...formData, mileage: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                {/* Harga */}
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Harga Jual (Rp) <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    min={1000000}
                    step={1000000}
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-emerald-400 font-bold focus:outline-none focus:border-emerald-500"
                  />
                  <div className="text-[11px] text-slate-500 mt-1">
                    Preview: {formatRupiah(formData.price || 0)}
                  </div>
                </div>

                {/* Tanggal Masuk */}
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Tanggal Masuk Showroom <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.entryDate}
                    onChange={(e) => setFormData({ ...formData, entryDate: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                {/* Status Unit */}
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Status Unit <span className="text-rose-400">*</span>
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as VehicleStockStatus })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white focus:outline-none focus:border-emerald-500"
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
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Nomor Polisi (Plat Mobil)
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: Z 1482 DA (Garut / Jawa Barat)"
                    value={formData.licensePlate}
                    onChange={(e) => setFormData({ ...formData, licensePlate: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>
              </div>

              {/* Multi-Photo Input */}
              <div className="space-y-2 pt-2 border-t border-slate-800">
                <label className="block text-xs font-medium text-slate-300">
                  Foto-foto Mobil (URL Gambar)
                </label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    placeholder="Masukkan URL foto mobil (https://...)"
                    value={formData.newPhotoUrl}
                    onChange={(e) => setFormData({ ...formData, newPhotoUrl: e.target.value })}
                    className="flex-1 px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                  <button
                    type="button"
                    onClick={handleAddPhoto}
                    className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-white transition-colors"
                  >
                    Tambah Foto
                  </button>
                </div>

                {/* Thumbnails preview */}
                {formData.photos.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {formData.photos.map((p, idx) => (
                      <div key={idx} className="relative group w-20 h-14 rounded-lg overflow-hidden border border-slate-800">
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
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Deskripsi / Catatan Kondisi Unit
                </label>
                <textarea
                  rows={3}
                  placeholder="Kondisi mesin, keaslian kilometer, kondisi body dan cat, kelengkapan surat, masa berlaku pajak..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white focus:outline-none focus:border-emerald-500"
                ></textarea>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setShowEditModal(false);
                  }}
                  className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-sm transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-sm transition-all shadow-lg shadow-emerald-950/40 disabled:opacity-50"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-rose-400">
              <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Hapus Unit Kendaraan</h3>
                <p className="text-xs text-slate-400">{selectedStock.id}</p>
              </div>
            </div>

            <p className="text-sm text-slate-300 leading-relaxed">
              Apakah Anda yakin ingin menghapus unit{' '}
              <span className="font-semibold text-white">
                {selectedStock.brand} {selectedStock.model} ({selectedStock.year})
              </span>{' '}
              dari daftar stok showroom? Data yang dihapus tidak dapat dipulihkan.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-xs transition-colors"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isSubmitting}
                className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-medium text-xs transition-all shadow-lg shadow-rose-950/40 disabled:opacity-50"
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
