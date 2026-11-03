'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Users,
  Search,
  Filter,
  Plus,
  Trash2,
  Edit,
  Eye,
  MessageCircle,
  Phone,
  Mail,
  MapPin,
  Calendar,
  AlertCircle,
  X,
  CheckCircle,
  ArrowUpDown,
  Car,
  Clock,
  ChevronRight,
  Shield,
  Send,
  Wrench,
  FileText,
  Printer,
} from 'lucide-react';
import { useCrm } from '@/context/CrmContext';
import { Customer, CustomerPurchase, LeadSourceType, VehicleCategory } from '@/types/crm';

interface KwitansiData {
  nomorKwitansi: string;
  terimaDari: string;
  sejumlahUang: number;
  terbilang: string;
  untukPembayaran: string;
  nomorPolisi: string;
  tempatTanggal: string;
  keterangan: string;
  penerima: string;
}

function formatRupiahWords(n: number): string {
  const bilangan = ['', 'Satu', 'Dua', 'Tiga', 'Empat', 'Lima', 'Enam', 'Tujuh', 'Delapan', 'Sembilan', 'Sepuluh', 'Sebelas'];
  if (n < 12) return bilangan[n];
  if (n < 20) return `${bilangan[n - 10]} Belas`;
  if (n < 100) return `${bilangan[Math.floor(n / 10)]} Puluh ${bilangan[n % 10]}`.trim();
  if (n < 200) return `Seratus ${formatRupiahWords(n - 100)}`.trim();
  if (n < 1000) return `${bilangan[Math.floor(n / 100)]} Ratus ${formatRupiahWords(n % 100)}`.trim();
  if (n < 2000) return `Seribu ${formatRupiahWords(n - 1000)}`.trim();
  if (n < 1000000) return `${formatRupiahWords(Math.floor(n / 1000))} Ribu ${formatRupiahWords(n % 1000)}`.trim();
  if (n < 1000000000) return `${formatRupiahWords(Math.floor(n / 1000000))} Juta ${formatRupiahWords(n % 1000000)}`.trim();
  if (n < 1000000000000) return `${formatRupiahWords(Math.floor(n / 1000000000))} Miliar ${formatRupiahWords(n % 1000000000)}`.trim();
  return `${n}`;
}

function getKwitansiForCustomer(customer: Customer, allPurchases: CustomerPurchase[] = []): KwitansiData {
  const purchase = allPurchases.find(
    (p) =>
      p.customerId === customer.id ||
      (customer.plateNumber && p.plateNumber === customer.plateNumber) ||
      (p.customerName && customer.fullName && p.customerName.toLowerCase() === customer.fullName.toLowerCase())
  );

  const terimaDari = customer.fullName;
  const plateNo = customer.plateNumber || purchase?.plateNumber || '-';
  const untukPembayaran = customer.interestedVehicle || purchase?.vehicleModel || '1 UNIT KENDARAAN';
  const nominal = customer.receiptAmount || Number(customer.budget) || purchase?.purchasePrice || 0;
  const terbilang = `${formatRupiahWords(nominal)} Rupiah`;
  const tempatTanggal =
    customer.receiptDate ||
    purchase?.receiptDate ||
    `GARUT, ${customer.registeredDate || new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }).toUpperCase()}`;
  const keterangan = customer.receiptNotes || customer.notes || purchase?.notes || 'Lunas';
  const penerima = customer.receiptReceiver || purchase?.salesName || 'HR MOTOR';
  const nomorKwitansi =
    customer.receiptNumber ||
    (purchase?.receiptNumber) ||
    `No. ${customer.id.replace('CUST-2026-', '').replace(/^0+/, '') || '1'}`;

  return {
    nomorKwitansi,
    terimaDari,
    sejumlahUang: nominal,
    terbilang,
    untukPembayaran,
    nomorPolisi: plateNo,
    tempatTanggal,
    keterangan,
    penerima,
  };
}

export default function CustomersPage() {
  const {
    customers,
    leads,
    followUps,
    communications,
    purchases,
    repairClaims,
    users,
    currentUser,
    addCustomer,
    updateCustomer,
    deleteCustomer,
    formatRupiah,
    formatDate,
    formatWhatsAppLink,
  } = useCrm();

  // Search & Filter & Sort state
  const [searchQuery, setSearchQuery] = useState('');
  const [filterSource, setFilterSource] = useState('ALL');
  const [filterType, setFilterType] = useState('ALL');
  const [sortBy, setSortBy] = useState<'date' | 'name' | 'budget'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [selectedKwitansi, setSelectedKwitansi] = useState<KwitansiData | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [formError, setFormError] = useState('');

  // Form input state
  const [formData, setFormData] = useState({
    fullName: '',
    whatsapp: '',
    email: '',
    address: '',
    district: 'Tarogong Kidul',
    source: 'Walk-in' as LeadSourceType,
    interestedVehicle: '',
    vehicleType: 'MPV' as VehicleCategory,
    budget: '',
    notes: '',
    plateNumber: '',
    receiptAmount: '',
    receiptDate: '',
    receiptReceiver: 'HR MOTOR',
  });

  // Filtered & Sorted Customers
  const processedCustomers = useMemo(() => {
    let result = [...customers];

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (c) =>
          c.fullName.toLowerCase().includes(q) ||
          c.whatsapp.includes(q) ||
          c.district.toLowerCase().includes(q) ||
          c.address.toLowerCase().includes(q) ||
          c.interestedVehicle.toLowerCase().includes(q) ||
          (c.plateNumber && c.plateNumber.toLowerCase().includes(q)) ||
          c.id.toLowerCase().includes(q)
      );
    }

    // Filters
    if (filterSource !== 'ALL') {
      result = result.filter((c) => c.source === filterSource);
    }
    if (filterType !== 'ALL') {
      result = result.filter((c) => c.vehicleType === filterType);
    }

    // Sort
    result.sort((a, b) => {
      if (sortBy === 'name') {
        const cmp = a.fullName.localeCompare(b.fullName);
        return sortOrder === 'asc' ? cmp : -cmp;
      }
      if (sortBy === 'budget') {
        return sortOrder === 'asc' ? a.budget - b.budget : b.budget - a.budget;
      }
      // date
      const dateA = new Date(a.registeredDate || a.updatedAt).getTime();
      const dateB = new Date(b.registeredDate || b.updatedAt).getTime();
      return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
    });

    return result;
  }, [customers, searchQuery, filterSource, filterType, sortBy, sortOrder]);

  const openAddModal = () => {
    setEditingCustomer(null);
    const todayStr = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }).toUpperCase();
    setFormData({
      fullName: '',
      whatsapp: '',
      email: '',
      address: '',
      district: 'Tarogong Kidul',
      source: 'Walk-in',
      interestedVehicle: '',
      vehicleType: 'MPV',
      budget: '',
      notes: '',
      plateNumber: '',
      receiptAmount: '',
      receiptDate: `GARUT, ${todayStr}`,
      receiptReceiver: 'HR MOTOR',
    });
    setFormError('');
    setIsAddModalOpen(true);
  };

  const openEditModal = (c: Customer) => {
    setEditingCustomer(c);
    const kw = getKwitansiForCustomer(c, purchases);
    setFormData({
      fullName: c.fullName,
      whatsapp: c.whatsapp,
      email: c.email || '',
      address: c.address,
      district: c.district || 'Tarogong Kidul',
      source: c.source === 'Referral' ? 'Walk-in' : c.source,
      interestedVehicle: c.interestedVehicle,
      vehicleType: c.vehicleType || 'MPV',
      budget: String(c.budget || ''),
      notes: c.notes || '',
      plateNumber: c.plateNumber || kw.nomorPolisi || '',
      receiptAmount: String(c.receiptAmount || kw.sejumlahUang || ''),
      receiptDate: c.receiptDate || kw.tempatTanggal || '',
      receiptReceiver: c.receiptReceiver || kw.penerima || 'HR MOTOR',
    });
    setFormError('');
    setIsAddModalOpen(true);
  };

  const handleSaveCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    const nominal = Number(formData.receiptAmount || formData.budget) || 0;
    const todayStr = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }).toUpperCase();
    const placeDate = formData.receiptDate.trim() || `GARUT, ${todayStr}`;
    const receiver = formData.receiptReceiver.trim() || 'HR MOTOR';
    const plateNo = formData.plateNumber.trim().toUpperCase();

    if (editingCustomer) {
      // Update
      const res = await updateCustomer({
        id: editingCustomer.id,
        ...formData,
        plateNumber: plateNo,
        receiptAmount: nominal,
        budget: nominal,
        receiptDate: placeDate,
        receiptReceiver: receiver,
        receiptNotes: formData.notes,
        status: editingCustomer.status || 'Sudah Beli',
      });

      if (res.success) {
        setIsAddModalOpen(false);
      } else {
        setFormError(res.error || 'Gagal memperbarui data');
      }
    } else {
      // Add Customer + Otomatis generate Kwitansi
      const newReceiptNumber = `No. ${customers.length + 1}`;
      const payload: Partial<Customer> = {
        ...formData,
        plateNumber: plateNo,
        receiptAmount: nominal,
        budget: nominal,
        receiptNumber: newReceiptNumber,
        receiptDate: placeDate,
        receiptReceiver: receiver,
        receiptNotes: formData.notes,
        status: 'Sudah Beli',
      };

      const res = await addCustomer(payload);

      if (res.success) {
        setIsAddModalOpen(false);
        // Otomatis tampilkan kwitansi resmi yang siap di-print
        setSelectedKwitansi({
          nomorKwitansi: newReceiptNumber,
          terimaDari: formData.fullName,
          sejumlahUang: nominal,
          terbilang: `${formatRupiahWords(nominal)} Rupiah`,
          untukPembayaran: formData.interestedVehicle || '1 UNIT KENDARAAN',
          nomorPolisi: plateNo || '-',
          tempatTanggal: placeDate,
          keterangan: formData.notes || 'Lunas',
          penerima: receiver,
        });
      } else {
        setFormError(res.error || 'Gagal menyimpan data');
      }
    }
  };

  const handleDelete = async (id: string) => {
    setIsDeleting(true);
    const res = await deleteCustomer(id);
    setIsDeleting(false);
    setDeleteConfirmId(null);
    if (selectedCustomer?.id === id) {
      setSelectedCustomer(null);
    }
    if (!res.success) {
      alert(res.error || 'Gagal menghapus data pelanggan');
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="crm-card p-6 border-b-2 border-b-gold-500/40">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="badge-gold">
                Database Pelanggan
              </span>
              <span className="text-xs text-charcoal-300">•</span>
              <span className="text-xs text-charcoal-400 font-medium tracking-wide">Showroom HR MOTOR Garut</span>
            </div>
            <h1 className="text-2xl font-black text-charcoal-900 mt-1 tracking-tight">
              Database Konsumen & Pembeli
            </h1>
            <p className="text-xs text-charcoal-500 mt-0.5">
              Kelola profil lengkap pembeli, riwayat komunikasi, preferensi armada, serta histori kepemilikan dan garansi showroom.
            </p>
          </div>

          <button
            onClick={openAddModal}
            className="btn-gold flex items-center gap-2 self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Pelanggan Baru</span>
          </button>
        </div>

        {/* Quick KPI Bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6 pt-5 border-t border-[#EAE8E3]">
          <div className="bg-[#FAF9F5] p-3 rounded-xl border border-[#EAE8E3]/80">
            <p className="text-[11px] font-semibold text-charcoal-400 uppercase tracking-wider">Total Pelanggan</p>
            <p className="text-xl font-black text-charcoal-900 mt-0.5">{customers.length}</p>
          </div>
          <div className="bg-[#FAF9F5] p-3 rounded-xl border border-[#EAE8E3]/80">
            <p className="text-[11px] font-semibold text-charcoal-400 uppercase tracking-wider">Transaksi Pembelian</p>
            <p className="text-xl font-black text-gold-600 mt-0.5">{purchases.length} Unit</p>
          </div>
          <div className="bg-[#FAF9F5] p-3 rounded-xl border border-[#EAE8E3]/80">
            <p className="text-[11px] font-semibold text-charcoal-400 uppercase tracking-wider">Klaim Garansi</p>
            <p className="text-xl font-black text-charcoal-900 mt-0.5">{repairClaims.length}</p>
          </div>
          <div className="bg-[#FAF9F5] p-3 rounded-xl border border-[#EAE8E3]/80">
            <p className="text-[11px] font-semibold text-charcoal-400 uppercase tracking-wider">Hasil Pencarian</p>
            <p className="text-xl font-black text-charcoal-800 mt-0.5">{processedCustomers.length}</p>
          </div>
        </div>
      </div>

      {/* Search & Filters Bar */}
      <div className="crm-card p-4 space-y-3">
        <div className="flex flex-col md:flex-row gap-3">
          {/* Search box */}
          <div className="flex-1 relative">
            <Search className="w-4 h-4 text-charcoal-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari berdasarkan nama konsumen, nomor WhatsApp, unit mobil yang dicari, atau alamat di Garut..."
              className="w-full text-xs pl-9 pr-4 py-2.5 bg-[#F8F7F4] border border-[#EAE8E3] rounded-xl outline-none focus:border-gold-500 focus:ring-2 focus:ring-gold-500/20 text-charcoal-900 placeholder-charcoal-400 transition-all font-medium"
            />
          </div>

          {/* Quick Filters */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Filter by Sumber */}
            <select
              value={filterSource}
              onChange={(e) => setFilterSource(e.target.value)}
              className="text-xs px-3 py-2.5 bg-[#F8F7F4] border border-[#EAE8E3] rounded-xl text-charcoal-800 font-medium outline-none focus:border-gold-500"
            >
              <option value="ALL">Semua Sumber</option>
              <option value="Walk-in">Walk-in Showroom</option>
              <option value="WhatsApp">WhatsApp</option>
              <option value="Instagram">Instagram</option>
              <option value="Facebook">Facebook</option>
              <option value="TikTok">TikTok</option>
              <option value="Other">Lainnya</option>
            </select>

            {/* Sort Order Button */}
            <button
              onClick={() => {
                if (sortBy === 'date') setSortBy('name');
                else if (sortBy === 'name') setSortBy('budget');
                else setSortBy('date');
              }}
              className="flex items-center gap-1.5 text-xs px-3 py-2.5 bg-[#F8F7F4] border border-[#EAE8E3] hover:border-gold-500/50 hover:bg-gold-50/30 rounded-xl text-charcoal-800 font-semibold transition-colors"
              title="Ganti Urutan Pengurutan"
            >
              <ArrowUpDown className="w-3.5 h-3.5 text-gold-600" />
              <span>
                Urut: {sortBy === 'date' ? 'Tanggal' : sortBy === 'name' ? 'Nama' : 'Budget'}
              </span>
            </button>
          </div>
        </div>

        {/* Active counter & info */}
        <div className="flex items-center justify-between text-[11px] text-charcoal-500 pt-2 border-t border-[#EAE8E3]">
          <span>
            Menampilkan <strong className="text-charcoal-900">{processedCustomers.length}</strong> dari{' '}
            {customers.length} total pelanggan terdata di sistem HR MOTOR
          </span>
        </div>
      </div>

      {/* Customer Data Table */}
      <div className="crm-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="crm-table w-full text-left">
            <thead>
              <tr>
                <th className="py-3.5 px-4">Konsumen</th>
                <th className="py-3.5 px-4">Kontak & WhatsApp</th>
                <th className="py-3.5 px-4">Domisili Garut</th>
                <th className="py-3.5 px-4">Minat Kendaraan</th>
                <th className="py-3.5 px-4">Estimasi Budget</th>
                <th className="py-3.5 px-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EAE8E3] text-xs">
              {processedCustomers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-charcoal-400">
                    <Users className="w-9 h-9 mx-auto mb-2 text-charcoal-300" />
                    <p className="font-semibold text-charcoal-700">Tidak ada data konsumen yang sesuai</p>
                    <p className="text-[11px] text-charcoal-400 mt-0.5">Ubah kata kunci pencarian atau sesuaikan filter sumber.</p>
                  </td>
                </tr>
              ) : (
                processedCustomers.map((cust) => {
                  const kwitansi = getKwitansiForCustomer(cust, purchases);
                  return (
                    <tr key={cust.id} className="hover:bg-[#F8F7F4]/80 transition-colors">
                      {/* Pelanggan */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-charcoal-900 text-gold-400 border border-gold-500/30 flex items-center justify-center font-bold text-xs uppercase shrink-0 shadow-xs">
                            {cust.fullName.charAt(0)}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <p className="font-bold text-charcoal-900 text-sm">{cust.fullName}</p>
                              {kwitansi && (
                                <span className="inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded bg-gold-50 text-gold-800 border border-gold-300 shadow-2xs">
                                  <FileText className="w-2.5 h-2.5 text-gold-600" /> Kwitansi Kasir
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] text-charcoal-400 font-mono tracking-tight">{cust.id}</span>
                          </div>
                        </div>
                      </td>

                      {/* WhatsApp & Email */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-0.5">
                          <a
                            href={formatWhatsAppLink(cust.whatsapp)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 font-semibold text-charcoal-900 hover:text-gold-600 transition-colors"
                          >
                            <span className="w-5 h-5 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
                              <MessageCircle className="w-3 h-3" />
                            </span>
                            {cust.whatsapp}
                          </a>
                          {cust.email && (
                            <p className="text-[11px] text-charcoal-400 truncate max-w-[150px] pl-6">
                              {cust.email}
                            </p>
                          )}
                        </div>
                      </td>

                      {/* Lokasi */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-start gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-gold-600 mt-0.5 shrink-0" />
                          <div>
                            <p className="font-semibold text-charcoal-800">{cust.district}</p>
                            <p className="text-[10px] text-charcoal-400 line-clamp-1">{cust.address}</p>
                          </div>
                        </div>
                      </td>

                      {/* Minat Kendaraan */}
                      <td className="py-3.5 px-4">
                        <div>
                          <p className="font-bold text-charcoal-900">{cust.interestedVehicle}</p>
                          <span className="inline-block text-[10px] font-semibold px-2 py-0.5 rounded-md bg-[#FAF9F5] border border-[#EAE8E3] text-charcoal-600 mt-0.5">
                            {cust.vehicleType}
                          </span>
                        </div>
                      </td>

                      {/* Budget */}
                      <td className="py-3.5 px-4 font-black text-gold-600 text-sm">
                        {formatRupiah(cust.budget)}
                      </td>

                      {/* Action buttons */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* Kwitansi Kasir */}
                          {kwitansi && (
                            <button
                              onClick={() => setSelectedKwitansi(kwitansi)}
                              className="p-1.5 rounded-lg text-gold-600 hover:text-gold-800 hover:bg-gold-50 transition-colors border border-gold-300/60 shadow-2xs"
                              title="Lihat / Cetak Kwitansi Resmi Kasir"
                            >
                              <FileText className="w-4 h-4" />
                            </button>
                          )}

                          {/* View Detail */}
                          <button
                            onClick={() => setSelectedCustomer(cust)}
                            className="p-1.5 rounded-lg text-charcoal-500 hover:text-gold-600 hover:bg-gold-50/60 transition-colors border border-transparent hover:border-gold-500/30"
                            title="Lihat Detail Profil & Riwayat"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {/* Edit */}
                          <button
                            onClick={() => openEditModal(cust)}
                            className="p-1.5 rounded-lg text-charcoal-500 hover:text-charcoal-900 hover:bg-charcoal-100 transition-colors border border-transparent hover:border-charcoal-300"
                            title="Edit Pelanggan"
                          >
                            <Edit className="w-4 h-4" />
                          </button>

                          {/* Delete */}
                          <button
                            onClick={() => setDeleteConfirmId(cust.id)}
                            className="p-1.5 rounded-lg text-charcoal-400 hover:text-rose-600 hover:bg-rose-50 transition-colors border border-transparent hover:border-rose-200"
                            title="Hapus Data Pelanggan"
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
      </div>

      {/* ADD / EDIT CUSTOMER MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-charcoal-950/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="crm-card w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden shadow-luxury border-gold-500/30">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 bg-charcoal-900 border-b border-gold-500/30 text-white">
              <div>
                <span className="badge-gold text-[10px] mb-1 inline-block">
                  {editingCustomer ? 'Perbarui Data Konsumen' : 'Registrasi Konsumen Baru'}
                </span>
                <h2 className="text-base font-black text-white tracking-tight">
                  {editingCustomer ? `Edit: ${editingCustomer.fullName}` : 'Tambah Konsumen Baru Showroom'}
                </h2>
                <p className="text-xs text-charcoal-300">
                  {editingCustomer ? `ID Pelanggan: ${editingCustomer.id}` : 'Registrasi calon atau pembeli mobil HR MOTOR Garut'}
                </p>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-charcoal-400 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="mx-6 mt-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-medium">
                {formError}
              </div>
            )}

            <form onSubmit={handleSaveCustomer} className="flex-1 overflow-y-auto p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-charcoal-800 mb-1">
                    Nama Lengkap <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    placeholder="Contoh: Agus Gunawan"
                    className="w-full text-xs px-3.5 py-2.5 bg-[#F8F7F4] border border-[#EAE8E3] rounded-xl focus:outline-none focus:border-gold-500 focus:ring-2 focus:ring-gold-500/20 text-charcoal-900 font-medium"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-charcoal-800 mb-1">
                    Nomor WhatsApp <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    value={formData.whatsapp}
                    onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                    placeholder="0812xxxxxxxx"
                    className="w-full text-xs px-3.5 py-2.5 bg-[#F8F7F4] border border-[#EAE8E3] rounded-xl focus:outline-none focus:border-gold-500 focus:ring-2 focus:ring-gold-500/20 text-charcoal-900 font-medium"
                  />
                  <p className="text-[10px] text-charcoal-400 mt-1">Sistem memvalidasi duplikasi nomor secara otomatis.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-charcoal-800 mb-1">Alamat Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="nama@email.com"
                    className="w-full text-xs px-3.5 py-2.5 bg-[#F8F7F4] border border-[#EAE8E3] rounded-xl focus:outline-none focus:border-gold-500 focus:ring-2 focus:ring-gold-500/20 text-charcoal-900 font-medium"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-charcoal-800 mb-1">Kecamatan di Garut</label>
                  <select
                    value={formData.district}
                    onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                    className="w-full text-xs px-3.5 py-2.5 bg-[#F8F7F4] border border-[#EAE8E3] rounded-xl focus:outline-none focus:border-gold-500 focus:ring-2 focus:ring-gold-500/20 text-charcoal-900 font-semibold"
                  >
                    <option value="Tarogong Kidul">Tarogong Kidul</option>
                    <option value="Tarogong Kaler">Tarogong Kaler</option>
                    <option value="Garut Kota">Garut Kota</option>
                    <option value="Samarang">Samarang</option>
                    <option value="Karangpawitan">Karangpawitan</option>
                    <option value="Kadungora">Kadungora</option>
                    <option value="Limbangan">Balubur Limbangan</option>
                    <option value="Leles">Leles</option>
                    <option value="Cilawu">Cilawu</option>
                    <option value="Wanaraja">Wanaraja</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-charcoal-800 mb-1">Alamat Domisili Lengkap</label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Jl. Raya Cipanas No. 42"
                  className="w-full text-xs px-3.5 py-2.5 bg-[#F8F7F4] border border-[#EAE8E3] rounded-xl focus:outline-none focus:border-gold-500 focus:ring-2 focus:ring-gold-500/20 text-charcoal-900 font-medium"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-charcoal-800 mb-1">Sumber Pelanggan</label>
                  <select
                    value={formData.source}
                    onChange={(e) => setFormData({ ...formData, source: e.target.value as LeadSourceType })}
                    className="w-full text-xs px-3.5 py-2.5 bg-[#F8F7F4] border border-[#EAE8E3] rounded-xl focus:outline-none focus:border-gold-500 focus:ring-2 focus:ring-gold-500/20 text-charcoal-900 font-semibold"
                  >
                    <option value="Walk-in">Walk-in Showroom</option>
                    <option value="WhatsApp">WhatsApp</option>
                    <option value="Instagram">Instagram</option>
                    <option value="Facebook">Facebook</option>
                    <option value="TikTok">TikTok</option>
                    <option value="Other">Lainnya</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-charcoal-800 mb-1">Kategori Kendaraan</label>
                  <select
                    value={formData.vehicleType}
                    onChange={(e) => setFormData({ ...formData, vehicleType: e.target.value as VehicleCategory })}
                    className="w-full text-xs px-3.5 py-2.5 bg-[#F8F7F4] border border-[#EAE8E3] rounded-xl focus:outline-none focus:border-gold-500 focus:ring-2 focus:ring-gold-500/20 text-charcoal-900 font-semibold"
                  >
                    <option value="MPV">MPV (Keluarga)</option>
                    <option value="SUV">SUV</option>
                    <option value="City Car">City Car</option>
                    <option value="Sedan">Sedan</option>
                    <option value="Hatchback">Hatchback</option>
                    <option value="Commercial">Commercial / Pickup</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-charcoal-800 mb-1">Unit Mobil Diminati</label>
                  <input
                    type="text"
                    required
                    value={formData.interestedVehicle}
                    onChange={(e) => setFormData({ ...formData, interestedVehicle: e.target.value })}
                    placeholder="Contoh: Innova Reborn 2020"
                    className="w-full text-xs px-3.5 py-2.5 bg-[#F8F7F4] border border-[#EAE8E3] rounded-xl focus:outline-none focus:border-gold-500 focus:ring-2 focus:ring-gold-500/20 text-charcoal-900 font-medium"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-charcoal-800 mb-1">Estimasi Budget (Rp)</label>
                  <input
                    type="number"
                    value={formData.budget}
                    onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                    placeholder="350000000"
                    className="w-full text-xs px-3.5 py-2.5 bg-[#F8F7F4] border border-[#EAE8E3] rounded-xl focus:outline-none focus:border-gold-500 focus:ring-2 focus:ring-gold-500/20 text-charcoal-900 font-medium"
                  />
                </div>
              </div>

              {/* Kwitansi Pembayaran Kasir Showroom */}
              <div className="bg-[#FAF9F5] p-4 rounded-xl border border-gold-300/80 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-gold-600" />
                    <span className="font-bold text-xs text-charcoal-900 uppercase tracking-wide">
                      Data Kwitansi Pembayaran Showroom (Format Excel Resmi)
                    </span>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-gold-100 text-gold-800 border border-gold-300">
                    Otomatis Siap Cetak
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-charcoal-700 mb-1">
                      Plat Nomor Polisi (Plat No)
                    </label>
                    <input
                      type="text"
                      value={formData.plateNumber}
                      onChange={(e) => setFormData({ ...formData, plateNumber: e.target.value.toUpperCase() })}
                      placeholder="Contoh: Z 1529 TK / D 1581 OR"
                      className="w-full text-xs font-mono font-bold px-3 py-2 bg-white border border-[#EAE8E3] rounded-xl focus:outline-none focus:border-gold-500 text-charcoal-900 uppercase"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-charcoal-700 mb-1">
                      Jumlah Uang Kasir (Jumlah Rp)
                    </label>
                    <input
                      type="number"
                      value={formData.receiptAmount || formData.budget}
                      onChange={(e) => {
                        setFormData({
                          ...formData,
                          receiptAmount: e.target.value,
                          budget: e.target.value,
                        });
                      }}
                      placeholder="Contoh: 1000000 / 80000000"
                      className="w-full text-xs font-bold px-3 py-2 bg-white border border-[#EAE8E3] rounded-xl focus:outline-none focus:border-gold-500 text-charcoal-900"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-charcoal-700 mb-1">
                      Tempat dan Tanggal
                    </label>
                    <input
                      type="text"
                      value={formData.receiptDate}
                      onChange={(e) => setFormData({ ...formData, receiptDate: e.target.value })}
                      placeholder="GARUT, 3 NOVEMBER 2026"
                      className="w-full text-xs font-semibold px-3 py-2 bg-white border border-[#EAE8E3] rounded-xl focus:outline-none focus:border-gold-500 text-charcoal-900"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-charcoal-700 mb-1">
                      Yang Menerima (Penerima)
                    </label>
                    <input
                      type="text"
                      value={formData.receiptReceiver}
                      onChange={(e) => setFormData({ ...formData, receiptReceiver: e.target.value })}
                      placeholder="HR MOTOR"
                      className="w-full text-xs font-bold px-3 py-2 bg-white border border-[#EAE8E3] rounded-xl focus:outline-none focus:border-gold-500 text-charcoal-900"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-charcoal-800 mb-1">
                  Keterangan Kwitansi & Catatan Khusus
                </label>
                <input
                  type="text"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Contoh: LUNAS / SISA 40 JUTA RUPIAH DIBAYAR PIHAK OTO / BOKING KREDIT..."
                  className="w-full text-xs px-3.5 py-2.5 bg-[#F8F7F4] border border-[#EAE8E3] rounded-xl focus:outline-none focus:border-gold-500 focus:ring-2 focus:ring-gold-500/20 text-charcoal-900 font-medium"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-[#EAE8E3]">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="btn-outline-warm"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="btn-gold"
                >
                  {editingCustomer ? 'Simpan Perubahan' : 'Registrasi Konsumen'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CUSTOMER DETAIL DRAWER / MODAL */}
      {selectedCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-charcoal-950/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="crm-card w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden shadow-luxury border-gold-500/40">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 bg-charcoal-900 border-b border-gold-500/30 text-white">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-charcoal-800 text-gold-400 border border-gold-500/40 flex items-center justify-center font-black text-lg uppercase shadow-xs">
                  {selectedCustomer.fullName.charAt(0)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-black text-white">{selectedCustomer.fullName}</h2>
                    <span className="badge-gold text-[10px]">Pelanggan Terdaftar</span>
                  </div>
                  <p className="text-xs text-charcoal-300">
                    ID: {selectedCustomer.id} • Terdaftar: {formatDate(selectedCustomer.registeredDate)}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <a
                  href={formatWhatsAppLink(
                    selectedCustomer.whatsapp,
                    `Sampurasun Bapak/Ibu ${selectedCustomer.fullName}, salam dari HR MOTOR Garut.`
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-gold flex items-center gap-1.5 py-1.5 text-xs"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span>Chat WhatsApp</span>
                </a>
                <button
                  onClick={() => setSelectedCustomer(null)}
                  className="w-8 h-8 flex items-center justify-center rounded-lg text-charcoal-400 hover:text-white hover:bg-white/10 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Content Tabs */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Profile Card */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-5 bg-[#FAF9F5] rounded-2xl border border-[#EAE8E3] text-xs">
                <div>
                  <span className="text-charcoal-400 block text-[11px] font-semibold uppercase tracking-wider">Nomor WhatsApp</span>
                  <span className="font-bold text-charcoal-900 text-sm">{selectedCustomer.whatsapp}</span>
                </div>
                <div>
                  <span className="text-charcoal-400 block text-[11px] font-semibold uppercase tracking-wider">Alamat Email</span>
                  <span className="font-semibold text-charcoal-800">{selectedCustomer.email || '-'}</span>
                </div>
                <div>
                  <span className="text-charcoal-400 block text-[11px] font-semibold uppercase tracking-wider">Alamat & Domisili Garut</span>
                  <span className="font-semibold text-charcoal-800">
                    {selectedCustomer.address}, {selectedCustomer.district}, Garut
                  </span>
                </div>
                <div>
                  <span className="text-charcoal-400 block text-[11px] font-semibold uppercase tracking-wider">Sumber Asal Konsumen</span>
                  <span className="font-semibold text-charcoal-800">{selectedCustomer.source}</span>
                </div>
                <div>
                  <span className="text-charcoal-400 block text-[11px] font-semibold uppercase tracking-wider">Minat Armada & Tipe</span>
                  <span className="font-black text-charcoal-900 text-sm">
                    {selectedCustomer.interestedVehicle} <span className="text-xs text-gold-600 font-bold">({selectedCustomer.vehicleType})</span>
                  </span>
                </div>
                <div>
                  <span className="text-charcoal-400 block text-[11px] font-semibold uppercase tracking-wider">Estimasi Budget</span>
                  <span className="font-black text-gold-600 text-base">
                    {formatRupiah(selectedCustomer.budget)}
                  </span>
                </div>
                <div className="md:col-span-2 pt-2 border-t border-[#EAE8E3]">
                  <span className="text-charcoal-400 block text-[11px] font-semibold uppercase tracking-wider">Catatan Konsumen</span>
                  <span className="text-charcoal-700 italic">{selectedCustomer.notes || 'Tidak ada catatan tambahan.'}</span>
                </div>
              </div>

              {/* Purchase History */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-charcoal-700 mb-3 flex items-center gap-2">
                  <Car className="w-4 h-4 text-gold-600" /> Riwayat Pembelian Mobil Showroom
                </h3>
                {purchases.filter((p) => p.customerId === selectedCustomer.id).length === 0 ? (
                  <div className="p-4 text-center text-xs text-charcoal-400 bg-[#FAF9F5] rounded-xl border border-dashed border-[#EAE8E3]">
                    Belum ada transaksi pembelian unit mobil yang selesai untuk pelanggan ini.
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {purchases
                      .filter((p) => p.customerId === selectedCustomer.id)
                      .map((pur) => (
                        <div
                          key={pur.id}
                          className="p-4 bg-white border border-[#EAE8E3] rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between text-xs border-l-4 border-l-gold-500 shadow-xs gap-3"
                        >
                          <div className="flex-1">
                            <p className="font-black text-charcoal-900 text-sm">{pur.vehicleModel} ({pur.vehicleYear})</p>
                            <p className="text-charcoal-500 text-[11px] mt-0.5">
                              No. Polisi: <span className="font-bold text-charcoal-800 font-mono bg-charcoal-50 px-1.5 py-0.5 rounded border border-charcoal-200">{pur.plateNumber}</span> • Warna: {pur.color} • Metode: {pur.paymentMethod}
                            </p>
                            <span className="text-[10px] text-gold-700 font-bold block mt-1.5 bg-gold-50 px-2 py-0.5 rounded border border-gold-200 inline-block">
                              Garansi HR MOTOR Aktif s.d: {formatDate(pur.warrantyUntil)}
                            </span>
                            {pur.notes && (
                              <p className="text-[11px] text-charcoal-600 mt-2 bg-[#FAF9F5] p-2 rounded-lg border border-[#EAE8E3] italic">
                                &ldquo;{pur.notes}&rdquo;
                              </p>
                            )}
                          </div>
                          <div className="text-left sm:text-right flex flex-col items-start sm:items-end gap-1 shrink-0">
                            <span className="text-base font-black text-gold-600">
                              {formatRupiah(pur.purchasePrice)}
                            </span>
                            <span className="text-[10px] text-charcoal-400 block">
                              Tgl Beli: {formatDate(pur.purchaseDate)}
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                const kw = getKwitansiForCustomer(selectedCustomer, [pur]);
                                if (kw) setSelectedKwitansi(kw);
                              }}
                              className="mt-1 inline-flex items-center gap-1.5 text-[11px] font-bold text-gold-800 bg-gold-50 hover:bg-gold-100 border border-gold-300 px-2.5 py-1 rounded-lg transition-colors shadow-2xs"
                              title="Buka Kwitansi Resmi Kasir HR MOTOR"
                            >
                              <FileText className="w-3.5 h-3.5 text-gold-600" />
                              <span>Lihat Kwitansi</span>
                            </button>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </div>

              {/* Riwayat Garansi & Perbaikan */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-charcoal-700 flex items-center gap-2">
                    <Wrench className="w-4 h-4 text-gold-600" /> Riwayat Perbaikan & Garansi Showroom
                  </h3>
                  <Link
                    href="/riwayat-perbaikan"
                    className="text-[11px] font-bold text-gold-600 hover:text-gold-700 transition-colors"
                  >
                    Buka Menu Riwayat Perbaikan →
                  </Link>
                </div>
                {repairClaims.filter(
                  (r) =>
                    r.customerId === selectedCustomer.id ||
                    r.customerPhone === selectedCustomer.whatsapp ||
                    r.customerName.toLowerCase() === selectedCustomer.fullName.toLowerCase()
                ).length === 0 ? (
                  <div className="p-4 text-center text-xs text-charcoal-400 bg-[#FAF9F5] rounded-xl border border-dashed border-[#EAE8E3]">
                    Belum ada pengajuan garansi atau perbaikan unit yang tercatat untuk konsumen ini.
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {repairClaims
                      .filter(
                        (r) =>
                          r.customerId === selectedCustomer.id ||
                          r.customerPhone === selectedCustomer.whatsapp ||
                          r.customerName.toLowerCase() === selectedCustomer.fullName.toLowerCase()
                      )
                      .map((rep) => (
                        <div
                          key={rep.id}
                          className="p-3.5 bg-white border border-[#EAE8E3] rounded-xl text-xs space-y-2 shadow-xs"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="badge-gold text-[10px]">
                                {rep.claimType}
                              </span>
                              <span className="font-black text-charcoal-900">{rep.claimNumber}</span>
                              <span className="text-[11px] text-charcoal-500">
                                • {rep.vehicleBrand} {rep.vehicleModel} ({rep.vehicleYear})
                              </span>
                            </div>
                            <span
                              className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${
                                rep.status === 'Selesai'
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : rep.status === 'Dalam Proses'
                                  ? 'bg-gold-50 text-gold-800 border border-gold-300'
                                  : rep.status === 'Dibatalkan'
                                  ? 'bg-charcoal-100 text-charcoal-500'
                                  : 'bg-blue-50 text-blue-700 border border-blue-200'
                              }`}
                            >
                              {rep.status}
                            </span>
                          </div>

                          <div className="bg-[#FAF9F5] p-2.5 rounded-lg border border-[#EAE8E3]">
                            <p className="text-charcoal-800">
                              <span className="font-bold text-charcoal-600">Keluhan: </span>
                              {rep.complaint}
                            </p>
                            {rep.damagedParts && (
                              <p className="text-charcoal-600 text-[11px] mt-0.5">
                                <span className="font-semibold text-charcoal-500">Bagian Diperbaiki: </span>
                                {rep.damagedParts}
                              </p>
                            )}
                            {rep.actionTaken && (
                              <p className="text-gold-700 text-[11px] mt-0.5 font-medium">
                                <span className="font-bold">Tindakan Bengkel: </span>
                                {rep.actionTaken}
                              </p>
                            )}
                          </div>

                          <div className="flex items-center justify-between pt-1 border-t border-[#EAE8E3] text-[11px]">
                            <span className="text-charcoal-400">
                              Tgl Pengajuan: {formatDate(rep.claimDate)}
                            </span>
                            <div className="text-right">
                              <span className="font-black text-charcoal-900">
                                Total: {formatRupiah(rep.totalCost)}
                              </span>
                              <span className="text-[10px] text-charcoal-500 block">
                                (Part: {formatRupiah(rep.sparepartCost)} + Jasa: {formatRupiah(rep.serviceCost)})
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </div>

              {/* Communication History */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-charcoal-700 mb-3 flex items-center gap-2">
                  <MessageCircle className="w-4 h-4 text-gold-600" /> Riwayat Interaksi & Komunikasi
                </h3>
                {communications.filter((c) => c.customerId === selectedCustomer.id).length === 0 ? (
                  <div className="p-4 text-center text-xs text-charcoal-400 bg-[#FAF9F5] rounded-xl border border-dashed border-[#EAE8E3]">
                    Belum ada catatan interaksi komunikasi untuk konsumen ini.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {communications
                      .filter((c) => c.customerId === selectedCustomer.id)
                      .map((comm) => (
                        <div key={comm.id} className="p-3 bg-[#FAF9F5] border border-[#EAE8E3] rounded-xl text-xs space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-charcoal-900">
                              Kanal {comm.channel} ({comm.direction})
                            </span>
                            <span className="text-[10px] text-charcoal-400">
                              {formatDate(comm.createdAt, true)}
                            </span>
                          </div>
                          <p className="text-charcoal-800 italic bg-white p-2.5 rounded-lg border border-[#EAE8E3]">
                            &ldquo;{comm.messageContent}&rdquo;
                          </p>
                          <p className="text-[11px] text-charcoal-500">
                            Dicatat oleh: {comm.loggedByName} • Hasil: {comm.notes || '-'}
                          </p>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer Actions */}
            <div className="p-4 bg-warm-50 border-t border-warm-200 flex items-center justify-between">
              <button
                type="button"
                onClick={() => {
                  setDeleteConfirmId(selectedCustomer.id);
                }}
                className="px-3 py-2 rounded-xl text-xs font-bold text-rose-600 hover:text-rose-800 hover:bg-rose-50 border border-rose-200 transition-colors flex items-center gap-1.5 shadow-xs"
              >
                <Trash2 className="w-4 h-4" />
                <span>Hapus Data Pelanggan</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const custToEdit = selectedCustomer;
                    setSelectedCustomer(null);
                    openEditModal(custToEdit);
                  }}
                  className="btn-outline-warm text-xs flex items-center gap-1.5 py-2 px-3 shadow-xs"
                >
                  <Edit className="w-3.5 h-3.5" />
                  <span>Edit Profil</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedCustomer(null)}
                  className="px-4 py-2 rounded-xl bg-charcoal-900 text-white font-bold text-xs hover:bg-black transition-colors shadow-xs"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION DIALOG */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-charcoal-950/70 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="crm-card max-w-sm w-full p-6 space-y-4 shadow-luxury border-rose-200">
            <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto border border-rose-200">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div className="text-center">
              <h3 className="text-sm font-black text-charcoal-900">Hapus Data Pelanggan?</h3>
              <p className="text-xs text-charcoal-500 mt-1">
                Apakah Anda yakin ingin menghapus pelanggan ini dari database HR MOTOR? Seluruh riwayat akan dihapus dan tindakan ini dicatat dalam audit log.
              </p>
            </div>
            <div className="flex items-center gap-2 pt-2">
              <button
                disabled={isDeleting}
                onClick={() => setDeleteConfirmId(null)}
                className="btn-outline-warm flex-1 py-2 text-xs disabled:opacity-50"
              >
                Batal
              </button>
              <button
                disabled={isDeleting}
                onClick={() => handleDelete(deleteConfirmId)}
                className="flex-1 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 disabled:opacity-50 rounded-xl shadow-sm transition-all flex items-center justify-center gap-1.5"
              >
                {isDeleting ? 'Menghapus...' : 'Ya, Hapus'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL KWITANSI PEMBAYARAN KASIR RESMI HR MOTOR */}
      {selectedKwitansi && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-3 sm:p-4 bg-charcoal-950/75 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-2xl w-full border border-gold-500/40 shadow-2xl overflow-hidden flex flex-col max-h-[95vh]">
            {/* Header Toolbar */}
            <div className="px-5 py-3.5 bg-charcoal-900 text-white flex items-center justify-between border-b border-gold-500/30 shrink-0">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-gold-400" />
                <span className="font-bold text-xs sm:text-sm tracking-wide">
                  Kwitansi Resmi Showroom HR MOTOR Garut
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-3 py-1.5 rounded-lg bg-gold-500 hover:bg-gold-600 text-charcoal-950 font-bold text-xs flex items-center gap-1.5 transition-colors shadow-xs"
                  title="Cetak Kwitansi / Print"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Cetak</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedKwitansi(null)}
                  className="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Printable Kwitansi Sheet */}
            <div className="p-4 sm:p-6 overflow-y-auto bg-[#FAF8F5]">
              <div id="printable-kwitansi" className="bg-white border-2 border-[#D4C3A3] rounded-xl p-5 sm:p-7 shadow-sm relative overflow-hidden text-charcoal-900">
                {/* Watermark HR MOTOR */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.03] select-none">
                  <span className="text-7xl sm:text-8xl font-black rotate-[-22deg] tracking-widest text-charcoal-950">
                    HR MOTOR
                  </span>
                </div>

                {/* Kop Surat Showroom */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-4 border-b-2 border-charcoal-900 gap-3">
                  <div>
                    <h2 className="text-lg sm:text-xl font-black tracking-wider text-charcoal-950">
                      SHOWROOM HR MOTOR GARUT
                    </h2>
                    <p className="text-[11px] text-charcoal-600 font-medium mt-0.5">
                      Pusat Jual Beli Mobil Bekas Berkualitas, Bergaransi Resmi & Terpercaya
                    </p>
                    <p className="text-[10px] text-charcoal-500">
                      Garut, Jawa Barat • Telepon / WA: 0812-2345-0001
                    </p>
                  </div>
                  <div className="text-left sm:text-right shrink-0">
                    <span className="inline-block px-2.5 py-1 bg-charcoal-900 text-gold-400 font-black text-[11px] uppercase tracking-wider rounded">
                      KWITANSI PEMBAYARAN
                    </span>
                    <p className="text-xs font-mono font-bold text-charcoal-700 mt-1">
                      {selectedKwitansi.nomorKwitansi}
                    </p>
                    <div className="inline-block mt-1 px-2.5 py-0.5 border border-charcoal-800 rounded bg-[#FAF9F5] font-mono font-black text-xs text-charcoal-900 shadow-2xs">
                      Plat: {selectedKwitansi.nomorPolisi}
                    </div>
                  </div>
                </div>

                {/* Isi Kwitansi (Sesuai Layout Excel Resmi HR MOTOR) */}
                <div className="py-5 space-y-3.5 text-xs sm:text-sm">
                  <div className="grid grid-cols-12 items-baseline py-1 border-b border-charcoal-200 gap-2">
                    <span className="col-span-4 sm:col-span-3 font-bold text-charcoal-800 uppercase tracking-wide text-[11px] sm:text-xs">
                      Terima Dari
                    </span>
                    <span className="col-span-1 text-center font-bold text-charcoal-500">:</span>
                    <span className="col-span-7 sm:col-span-8 font-black text-charcoal-950 text-sm sm:text-base uppercase tracking-tight">
                      {selectedKwitansi.terimaDari}
                    </span>
                  </div>

                  <div className="grid grid-cols-12 items-baseline py-1 border-b border-charcoal-200 gap-2">
                    <span className="col-span-4 sm:col-span-3 font-bold text-charcoal-800 uppercase tracking-wide text-[11px] sm:text-xs">
                      Sejumlah Uang
                    </span>
                    <span className="col-span-1 text-center font-bold text-charcoal-500">:</span>
                    <span className="col-span-7 sm:col-span-8 font-bold italic text-charcoal-900 bg-[#FAF7F0] px-3 py-1.5 rounded-lg border border-[#E8DFC8]">
                      &ldquo;{selectedKwitansi.terbilang}&rdquo;
                    </span>
                  </div>

                  <div className="grid grid-cols-12 items-baseline py-1 border-b border-charcoal-200 gap-2">
                    <span className="col-span-4 sm:col-span-3 font-bold text-charcoal-800 uppercase tracking-wide text-[11px] sm:text-xs">
                      Untuk Pembayaran
                    </span>
                    <span className="col-span-1 text-center font-bold text-charcoal-500">:</span>
                    <span className="col-span-7 sm:col-span-8 font-black text-charcoal-950 uppercase">
                      {selectedKwitansi.untukPembayaran}
                    </span>
                  </div>

                  <div className="grid grid-cols-12 items-baseline py-1 border-b border-charcoal-200 gap-2">
                    <span className="col-span-4 sm:col-span-3 font-bold text-charcoal-800 uppercase tracking-wide text-[11px] sm:text-xs">
                      Plat No
                    </span>
                    <span className="col-span-1 text-center font-bold text-charcoal-500">:</span>
                    <span className="col-span-7 sm:col-span-8 font-mono font-black text-charcoal-950 text-xs sm:text-sm bg-charcoal-100/70 px-2 py-0.5 rounded border border-charcoal-300 inline-block w-fit">
                      {selectedKwitansi.nomorPolisi || '-'}
                    </span>
                  </div>

                  <div className="grid grid-cols-12 items-baseline py-1 border-b border-charcoal-200 gap-2">
                    <span className="col-span-4 sm:col-span-3 font-bold text-charcoal-800 uppercase tracking-wide text-[11px] sm:text-xs">
                      Keterangan
                    </span>
                    <span className="col-span-1 text-center font-bold text-charcoal-500">:</span>
                    <span className="col-span-7 sm:col-span-8 font-medium text-charcoal-800">
                      {selectedKwitansi.keterangan || 'Walk in'}
                    </span>
                  </div>
                </div>

                {/* Bagian Bawah: Jumlah Uang & Tanda Tangan */}
                <div className="pt-4 border-t-2 border-charcoal-900 flex flex-col sm:flex-row items-center justify-between gap-4">
                  {/* Kotak Jumlah Rp */}
                  <div className="w-full sm:w-auto p-3.5 bg-charcoal-950 text-gold-400 rounded-xl border border-gold-500/40 text-center sm:text-left shadow-xs">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-white/70 block">Jumlah Rp</span>
                    <span className="text-lg sm:text-xl font-black tracking-tight font-mono text-gold-400">
                      Rp {selectedKwitansi.sejumlahUang.toLocaleString('id-ID')} ,-
                    </span>
                  </div>

                  {/* Tanda Tangan & Cap Kasir Showroom */}
                  <div className="text-center sm:text-right shrink-0">
                    <p className="text-xs sm:text-sm font-black text-charcoal-900 uppercase">{selectedKwitansi.tempatTanggal}</p>
                    <p className="text-[11px] font-bold text-charcoal-500 mt-0.5">Penerima,</p>
                    <div className="my-1.5 flex justify-center sm:justify-end">
                      <div className="w-26 h-10 border-2 border-dashed border-emerald-600/70 rounded-lg flex items-center justify-center rotate-[-3deg] bg-emerald-50/70 text-emerald-800 text-[10px] font-black uppercase tracking-wider px-2 shadow-2xs">
                        ✓ LUNAS HR MOTOR
                      </div>
                    </div>
                    <p className="text-xs sm:text-sm font-black text-charcoal-950 underline underline-offset-2 uppercase">
                      {selectedKwitansi.penerima || 'HR MOTOR'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer Modal */}
            <div className="px-5 py-3 bg-[#FAF9F5] border-t border-[#EAE8E3] flex items-center justify-end shrink-0">
              <button
                type="button"
                onClick={() => setSelectedKwitansi(null)}
                className="px-4 py-2 rounded-xl bg-charcoal-900 text-white font-bold text-xs hover:bg-black transition-colors"
              >
                Tutup Kwitansi
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
