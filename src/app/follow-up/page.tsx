'use client';

import React, { useState, useMemo } from 'react';
import { useCrm } from '@/context/CrmContext';
import {
  FollowUp,
  FollowUpCategory,
  FollowUpStatus,
  CommunicationResultOutcome,
  PriorityLevel,
  FollowUpChannel,
} from '@/types/crm';
import {
  CalendarClock,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertTriangle,
  MessageCircle,
  Phone,
  User,
  Car,
  ChevronRight,
  X,
  History,
  Send,
  Calendar,
  Sparkles,
  AlertCircle,
  Check,
  RotateCcw,
  Tag,
  DollarSign,
  TrendingUp,
  ArrowRight,
} from 'lucide-react';

const CATEGORIES: FollowUpCategory[] = [
  'Pelanggan Lama (1 Tahun)',
  'Prospek Tidak Jadi (1 Bulan)',
  'Unit yang Dicari Sudah Tersedia',
];

const STATUS_LIST: FollowUpStatus[] = [
  'Belum Dihubungi',
  'Sudah Dihubungi',
  'Menunggu Respons',
  'Berhasil Transaksi',
  'Tidak Berminat',
];

const OUTCOMES: CommunicationResultOutcome[] = [
  'Tertarik Datang ke Showroom',
  'Minta Foto / Video Detail',
  'Menunggu Konfirmasi Keluarga',
  'Sedang Mempertimbangkan Unit Lain',
  'Sudah Beli di Tempat Lain',
  'Tidak Ada Respons',
  'Berhasil Transaksi / Deal',
];

export default function FollowUpPage() {
  const {
    followUps,
    stocks,
    leads,
    customers,
    currentUser,
    addFollowUp,
    logFollowUpCommunication,
    deleteFollowUp,
    formatDate,
    formatWhatsAppLink,
    formatRupiah,
  } = useCrm();

  const todayStr = new Date().toISOString().split('T')[0];

  // Filters & State
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('Semua');
  const [filterStatus, setFilterStatus] = useState<string>('Semua');
  const [filterTimeTab, setFilterTimeTab] = useState<'all' | 'today' | 'overdue' | 'upcoming' | 'deal'>('all');

  // Modals
  const [showLogModal, setShowLogModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<FollowUp | null>(null);

  // Form for Log Communication
  const [logForm, setLogForm] = useState<{
    outcome: CommunicationResultOutcome;
    notes: string;
    currentInterestNotes: string;
    scheduleNext: boolean;
    scheduleNextDate: string;
    scheduleNextCategory: FollowUpCategory;
    scheduleNextTime: string;
    scheduleNextReason: string;
  }>({
    outcome: 'Tertarik Datang ke Showroom',
    notes: '',
    currentInterestNotes: '',
    scheduleNext: false,
    scheduleNextDate: new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0],
    scheduleNextCategory: 'Unit yang Dicari Sudah Tersedia',
    scheduleNextTime: '10:00',
    scheduleNextReason: '',
  });

  // Form for Add New Follow-up
  const [newForm, setNewForm] = useState<{
    customerName: string;
    customerPhone: string;
    category: FollowUpCategory;
    vehicleInfo: string;
    followUpReason: string;
    scheduledDate: string;
    scheduledTime: string;
    priority: PriorityLevel;
    notes: string;
  }>({
    customerName: '',
    customerPhone: '',
    category: 'Unit yang Dicari Sudah Tersedia',
    vehicleInfo: '',
    followUpReason: '',
    scheduledDate: todayStr,
    scheduledTime: '10:00',
    priority: 'Tinggi',
    notes: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  // 8 Dashboard Metrics Calculation
  const dashboardStats = useMemo(() => {
    const total = followUps.length;

    const today = followUps.filter(
      (f) =>
        f.scheduledDate === todayStr &&
        f.status !== 'Berhasil Transaksi' &&
        f.status !== 'Tidak Berminat'
    ).length;

    const overdue = followUps.filter((f) => {
      if (f.status === 'Berhasil Transaksi' || f.status === 'Tidak Berminat') return false;
      return f.scheduledDate < todayStr;
    }).length;

    const belumDihubungi = followUps.filter((f) => f.status === 'Belum Dihubungi').length;
    const sudahDihubungi = followUps.filter((f) => f.status === 'Sudah Dihubungi').length;
    const berhasilTransaksi = followUps.filter((f) => f.status === 'Berhasil Transaksi').length;

    const pelangganLama = followUps.filter(
      (f) => f.category === 'Pelanggan Lama (1 Tahun)'
    ).length;

    const prospekTidakJadi = followUps.filter(
      (f) => f.category === 'Prospek Tidak Jadi (1 Bulan)'
    ).length;

    return {
      total,
      today,
      overdue,
      belumDihubungi,
      sudahDihubungi,
      berhasilTransaksi,
      pelangganLama,
      prospekTidakJadi,
    };
  }, [followUps, todayStr]);

  // Filtered Follow-up List
  const filteredFollowUps = useMemo(() => {
    return followUps.filter((item) => {
      if (!item) return false;
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = (item.customerName || '').toLowerCase().includes(q);
        const matchPhone = (item.customerPhone || '').includes(q);
        const matchUnit = (item.vehicleInfo || '').toLowerCase().includes(q);
        const matchReason = (item.followUpReason || '').toLowerCase().includes(q);
        const matchNotes = (item.notes || '').toLowerCase().includes(q);
        if (!matchName && !matchPhone && !matchUnit && !matchReason && !matchNotes) {
          return false;
        }
      }

      // Category filter
      if (filterCategory !== 'Semua' && item.category !== filterCategory) {
        return false;
      }

      // Status filter
      if (filterStatus !== 'Semua' && item.status !== filterStatus) {
        return false;
      }

      // Time Tab Filter
      const sDate = item.scheduledDate || '';
      if (filterTimeTab === 'today') {
        return (
          sDate === todayStr &&
          item.status !== 'Berhasil Transaksi' &&
          item.status !== 'Tidak Berminat'
        );
      }
      if (filterTimeTab === 'overdue') {
        return (
          sDate !== '' &&
          sDate < todayStr &&
          item.status !== 'Berhasil Transaksi' &&
          item.status !== 'Tidak Berminat'
        );
      }
      if (filterTimeTab === 'upcoming') {
        return (
          sDate > todayStr &&
          item.status !== 'Berhasil Transaksi' &&
          item.status !== 'Tidak Berminat'
        );
      }
      if (filterTimeTab === 'deal') {
        return item.status === 'Berhasil Transaksi';
      }

      return true;
    });
  }, [followUps, searchQuery, filterCategory, filterStatus, filterTimeTab, todayStr]);

  // Generate Pre-formatted WhatsApp Message according to BAGIAN D & Alur Komunikasi
  const getWhatsAppMessage = (item: FollowUp): string => {
    const custName = item.customerName || 'Bapak/Ibu';
    const unitName = item.vehicleInfo || 'mobil idaman';

    if (item.category === 'Pelanggan Lama (1 Tahun)') {
      return `Halo Bapak/Ibu ${custName}, salam hangat dari HR MOTOR Garut.\n\nTidak terasa sudah 1 tahun Bapak/Ibu menggunakan unit ${unitName}. Bagaimana kondisi dan performa kendaraannya saat ini? Apakah ada rencana untuk mengganti unit / tukar tambah (trade-in), atau berniat menjual kembali mobil tersebut melalui HR MOTOR Garut?\n\nKami siap memberikan penawaran terbaik untuk Bapak/Ibu. Terima kasih.`;
    }

    if (item.category === 'Prospek Tidak Jadi (1 Bulan)') {
      return `Halo Bapak/Ibu ${custName}, salam dari HR MOTOR Garut.\n\nKami ingin menyapa kembali Bapak/Ibu. Apakah saat ini Bapak/Ibu masih mencari unit mobil idaman? Saat ini di showroom HR MOTOR tersedia beberapa pilihan unit stok baru yang mungkin sesuai dengan kriteria Bapak/Ibu.\n\nSilakan kabari kami jika berkenan mendapatkan informasi unit lebih lengkap. Terima kasih.`;
    }

    // Unit yang Dicari Sudah Tersedia
    return `Halo Bapak/Ibu ${custName}, kabar baik dari HR MOTOR Garut!\n\nUnit mobil ${unitName} yang sebelumnya Bapak/Ibu cari/tanyakan baru saja tersedia di showroom kami dengan kondisi istimewa dan siap pakai.\n\nMengingat unit ini banyak peminatnya, silakan hubungi kami segera jika Bapak/Ibu ingin cek unit langsung atau menjadwalkan test drive. Terima kasih.`;
  };

  // Open Log Communication Modal
  const handleOpenLogModal = (item: FollowUp) => {
    setSelectedItem(item);
    setLogForm({
      outcome: 'Tertarik Datang ke Showroom',
      notes: '',
      currentInterestNotes: '',
      scheduleNext: false,
      scheduleNextDate: new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0],
      scheduleNextCategory: item.category,
      scheduleNextTime: '10:00',
      scheduleNextReason: '',
    });
    setFormError('');
    setShowLogModal(true);
  };

  // Open History Modal
  const handleOpenHistoryModal = (item: FollowUp) => {
    setSelectedItem(item);
    setShowHistoryModal(true);
  };

  // Submit Log Communication
  const handleSubmitLog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem) return;

    setIsSubmitting(true);
    setFormError('');

    try {
      const payload: any = {
        id: selectedItem.id,
        outcome: logForm.outcome,
        notes: logForm.notes.trim() || logForm.currentInterestNotes.trim(),
        currentInterestNotes: logForm.currentInterestNotes.trim(),
      };

      if (logForm.scheduleNext) {
        payload.scheduleNextDate = logForm.scheduleNextDate;
        payload.scheduleNextCategory = logForm.scheduleNextCategory;
        payload.scheduleNextTime = logForm.scheduleNextTime;
        payload.scheduleNextReason = logForm.scheduleNextReason || `Follow-up lanjutan: ${logForm.outcome}`;
      }

      const res = await logFollowUpCommunication(payload);
      if (res.success) {
        setShowLogModal(false);
        setSelectedItem(null);
      } else {
        setFormError(res.error || 'Gagal menyimpan catatan hasil komunikasi');
      }
    } catch {
      setFormError('Terjadi kesalahan jaringan');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Submit Add Manual Follow-up
  const handleSubmitAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newForm.customerName.trim()) {
      setFormError('Nama konsumen wajib diisi');
      return;
    }
    if (!newForm.customerPhone.trim()) {
      setFormError('Nomor WhatsApp wajib diisi');
      return;
    }

    setIsSubmitting(true);
    setFormError('');

    try {
      const res = await addFollowUp({
        customerName: newForm.customerName.trim(),
        customerPhone: newForm.customerPhone.trim(),
        category: newForm.category,
        vehicleInfo: newForm.vehicleInfo.trim(),
        followUpReason: newForm.followUpReason.trim(),
        scheduledDate: newForm.scheduledDate,
        scheduledTime: newForm.scheduledTime,
        priority: newForm.priority,
        status: 'Belum Dihubungi',
        channel: 'WhatsApp',
        notes: newForm.notes.trim(),
      });

      if (res.success) {
        setShowAddModal(false);
      } else {
        setFormError(res.error || 'Gagal membuat jadwal follow-up');
      }
    } catch {
      setFormError('Terjadi kesalahan jaringan');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 crm-card p-6">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-charcoal-900 text-gold-400 flex items-center justify-center shadow-md">
              <CalendarClock className="w-5 h-5 text-gold-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl lg:text-2xl font-bold tracking-tight text-charcoal-900">
                  Follow-up Management
                </h1>
                <span className="badge-gold">
                  Alur Otomatis Showroom Garut
                </span>
              </div>
              <p className="text-xs text-charcoal-500 mt-0.5">
                Manajemen 3 skenario follow-up showroom: Pelanggan Lama (1 Thn), Prospek Batal (1 Bln), dan Notifikasi Unit Masuk Cocok.
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={() => {
            setNewForm({
              customerName: '',
              customerPhone: '',
              category: 'Unit yang Dicari Sudah Tersedia',
              vehicleInfo: '',
              followUpReason: '',
              scheduledDate: todayStr,
              scheduledTime: '10:00',
              priority: 'Tinggi',
              notes: '',
            });
            setFormError('');
            setShowAddModal(true);
          }}
          className="btn-gold inline-flex items-center justify-center gap-2 self-start md:self-auto text-xs"
        >
          <Plus className="w-4 h-4" />
          Jadwalkan Follow-up Manual
        </button>
      </div>

      {/* 8 SUMMARY METRICS CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
        {/* Total */}
        <div className="crm-card p-3.5">
          <div className="text-[10px] font-bold uppercase tracking-wider text-charcoal-400">Total Follow-up</div>
          <div className="text-xl font-bold text-charcoal-900 mt-1">{dashboardStats.total}</div>
          <div className="text-[10px] text-charcoal-400 mt-0.5">Semua data</div>
        </div>

        {/* Hari Ini */}
        <div className="crm-card p-3.5 border-l-3 border-l-gold-500">
          <div className="text-[10px] font-bold uppercase tracking-wider text-gold-700 flex items-center gap-1">
            <Clock className="w-3 h-3 text-gold-600" /> Hari Ini
          </div>
          <div className="text-xl font-bold text-gold-600 mt-1">{dashboardStats.today}</div>
          <div className="text-[10px] text-gold-700/80 mt-0.5 font-medium">Perlu dihubungi</div>
        </div>

        {/* Terlambat */}
        <div className="crm-card p-3.5 border-l-3 border-l-rose-500">
          <div className="text-[10px] font-bold uppercase tracking-wider text-rose-600 flex items-center gap-1">
            <AlertTriangle className="w-3 h-3 text-rose-500" /> Terlambat
          </div>
          <div className="text-xl font-bold text-rose-600 mt-1">{dashboardStats.overdue}</div>
          <div className="text-[10px] text-rose-500/80 mt-0.5 font-medium">Lewat jadwal</div>
        </div>

        {/* Belum Dihubungi */}
        <div className="crm-card p-3.5">
          <div className="text-[10px] font-bold uppercase tracking-wider text-charcoal-500">Belum Kontak</div>
          <div className="text-xl font-bold text-charcoal-800 mt-1">{dashboardStats.belumDihubungi}</div>
          <div className="text-[10px] text-charcoal-400 mt-0.5">Menunggu follow-up</div>
        </div>

        {/* Sudah Dihubungi */}
        <div className="crm-card p-3.5">
          <div className="text-[10px] font-bold uppercase tracking-wider text-charcoal-500">Sudah Kontak</div>
          <div className="text-xl font-bold text-charcoal-800 mt-1">{dashboardStats.sudahDihubungi}</div>
          <div className="text-[10px] text-charcoal-400 mt-0.5">Terkontak sales</div>
        </div>

        {/* Berhasil Deal */}
        <div className="crm-card p-3.5 border-l-3 border-l-gold-500">
          <div className="text-[10px] font-bold uppercase tracking-wider text-gold-800 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-gold-600" /> Deal Sukses
          </div>
          <div className="text-xl font-bold text-gold-700 mt-1">{dashboardStats.berhasilTransaksi}</div>
          <div className="text-[10px] text-gold-800/80 mt-0.5 font-medium">Deal konsumen</div>
        </div>

        {/* Pelanggan Lama */}
        <div className="crm-card p-3.5">
          <div className="text-[10px] font-bold uppercase tracking-wider text-charcoal-500">1 Thn Lama</div>
          <div className="text-xl font-bold text-charcoal-800 mt-1">{dashboardStats.pelangganLama}</div>
          <div className="text-[10px] text-charcoal-400 mt-0.5">Retensi / Trade-in</div>
        </div>

        {/* Prospek Tidak Jadi */}
        <div className="crm-card p-3.5">
          <div className="text-[10px] font-bold uppercase tracking-wider text-charcoal-500">1 Bln Lost</div>
          <div className="text-xl font-bold text-charcoal-800 mt-1">{dashboardStats.prospekTidakJadi}</div>
          <div className="text-[10px] text-charcoal-400 mt-0.5">Reaktivasi prospek</div>
        </div>
      </div>

      {/* FILTER & TABS SECTION */}
      <div className="crm-card p-4 space-y-4">
        {/* Navigation Tabs */}
        <div className="flex flex-wrap items-center gap-2 border-b border-warm-200 pb-3">
          <button
            onClick={() => setFilterTimeTab('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              filterTimeTab === 'all'
                ? 'bg-charcoal-900 text-gold-400 shadow-sm'
                : 'text-charcoal-500 hover:text-charcoal-900 hover:bg-warm-100'
            }`}
          >
            Semua Jadwal ({followUps.length})
          </button>
          <button
            onClick={() => setFilterTimeTab('today')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
              filterTimeTab === 'today'
                ? 'bg-charcoal-900 text-gold-400 shadow-sm'
                : 'text-charcoal-500 hover:text-charcoal-900 hover:bg-warm-100'
            }`}
          >
            <Clock className="w-3.5 h-3.5 text-gold-400" />
            Hari Ini ({dashboardStats.today})
          </button>
          <button
            onClick={() => setFilterTimeTab('overdue')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
              filterTimeTab === 'overdue'
                ? 'bg-charcoal-900 text-rose-400 shadow-sm'
                : 'text-charcoal-500 hover:text-charcoal-900 hover:bg-warm-100'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
            Terlambat ({dashboardStats.overdue})
          </button>
          <button
            onClick={() => setFilterTimeTab('upcoming')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              filterTimeTab === 'upcoming'
                ? 'bg-charcoal-900 text-gold-400 shadow-sm'
                : 'text-charcoal-500 hover:text-charcoal-900 hover:bg-warm-100'
            }`}
          >
            Mendatang
          </button>
          <button
            onClick={() => setFilterTimeTab('deal')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
              filterTimeTab === 'deal'
                ? 'bg-charcoal-900 text-gold-400 shadow-sm'
                : 'text-charcoal-500 hover:text-charcoal-900 hover:bg-warm-100'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-gold-400" />
            Berhasil Transaksi ({dashboardStats.berhasilTransaksi})
          </button>
        </div>

        {/* Search & Filter Dropdowns */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="md:col-span-2 relative">
            <Search className="w-4 h-4 text-charcoal-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Cari nama konsumen, nomor WA, unit mobil, atau catatan..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-warm-50 border border-warm-200 rounded-xl text-xs text-charcoal-900 placeholder-charcoal-400 focus:outline-none focus:border-gold-500 focus:ring-1 focus:ring-gold-500/30 transition-all"
            />
          </div>

          {/* Kategori Filter */}
          <div>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="w-full px-3 py-2 bg-warm-50 border border-warm-200 rounded-xl text-xs text-charcoal-900 focus:outline-none focus:border-gold-500"
            >
              <option value="Semua">Semua Alur Follow-up</option>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-3 py-2 bg-warm-50 border border-warm-200 rounded-xl text-xs text-charcoal-900 focus:outline-none focus:border-gold-500"
            >
              <option value="Semua">Semua Status</option>
              {STATUS_LIST.map((s) => (
                <option key={s} value={s}>
                  Status: {s}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* TABLE FOLLOW-UP ENTERPRISE */}
      <div className="crm-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="crm-table">
            <thead>
              <tr>
                <th className="py-3 px-3 text-center w-12">No</th>
                <th className="py-3 px-4">Nama Konsumen</th>
                <th className="py-3 px-3">Nomor WhatsApp</th>
                <th className="py-3 px-4">Unit Terkait</th>
                <th className="py-3 px-3">Jenis Alur</th>
                <th className="py-3 px-4">Alasan & Catatan</th>
                <th className="py-3 px-3 text-center">Tgl Follow-up</th>
                <th className="py-3 px-3 text-center">Status</th>
                <th className="py-3 px-4 text-center min-w-[280px]">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filteredFollowUps.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-charcoal-400">
                    <CalendarClock className="w-10 h-10 mx-auto text-charcoal-300 mb-2 stroke-[1.5]" />
                    <p className="text-sm font-semibold text-charcoal-700">Tidak ada data jadwal follow-up</p>
                    <p className="text-xs text-charcoal-400 mt-1">Ubah filter atau jadwalkan follow-up baru untuk konsumen showroom.</p>
                  </td>
                </tr>
              ) : (
                filteredFollowUps.map((item, idx) => {
                  const isToday = item.scheduledDate === todayStr;
                  const isOverdue =
                    item.scheduledDate < todayStr &&
                    item.status !== 'Berhasil Transaksi' &&
                    item.status !== 'Tidak Berminat';

                  const custPhone =
                    item.customerPhone ||
                    customers.find((c) => c.id === item.customerId)?.whatsapp ||
                    leads.find((l) => l.id === item.leadId)?.contactNumber ||
                    '';

                  const waMessage = getWhatsAppMessage(item);
                  const waLink = custPhone ? formatWhatsAppLink(custPhone, waMessage) : '#';

                  // Check if stock unit is sold
                  const linkedStock = stocks.find((s) => s.id === item.vehicleStockId);
                  const isSold = item.isUnitSold || (linkedStock && linkedStock.status === 'Terjual');

                  return (
                    <tr key={item.id} className="hover:bg-warm-100/60 transition-colors">
                      {/* No */}
                      <td className="py-3 px-3 text-center text-charcoal-400 font-mono text-xs">
                        {idx + 1}
                      </td>

                      {/* Nama Konsumen */}
                      <td className="py-3 px-4 font-medium text-charcoal-900">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold">{item.customerName}</span>
                          {item.priority === 'Tinggi' && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-50 text-rose-600 border border-rose-200">
                              Prioritas
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-charcoal-400 font-mono mt-0.5">
                          {item.id}
                        </div>
                      </td>

                      {/* Nomor WhatsApp */}
                      <td className="py-3 px-3 font-mono text-xs text-charcoal-800 font-semibold">
                        {custPhone ? (
                          <a
                            href={waLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-gold-700 hover:text-gold-900 hover:underline"
                          >
                            <Phone className="w-3 h-3 text-gold-600" />
                            {custPhone}
                          </a>
                        ) : (
                          <span className="text-charcoal-400 italic font-sans text-xs">Belum ada no.</span>
                        )}
                      </td>

                      {/* Unit yang Dibeli / Dicari */}
                      <td className="py-3 px-4">
                        <div className="font-semibold text-charcoal-800 text-xs">
                          {item.vehicleInfo || '-'}
                        </div>
                        {isSold && (
                          <div className="inline-flex items-center gap-1 px-2 py-0.5 mt-1 rounded text-[10px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                            <AlertTriangle className="w-3 h-3 text-rose-500" />
                            Unit Terjual! Tawarkan alternatif
                          </div>
                        )}
                      </td>

                      {/* Jenis Follow-up */}
                      <td className="py-3 px-3">
                        {item.category === 'Pelanggan Lama (1 Tahun)' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-warm-100 text-charcoal-800 border border-warm-200">
                            1 Thn - Pelanggan Lama
                          </span>
                        )}
                        {item.category === 'Prospek Tidak Jadi (1 Bulan)' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-charcoal-100 text-charcoal-800 border border-warm-200">
                            1 Bln - Prospek Batal
                          </span>
                        )}
                        {item.category === 'Unit yang Dicari Sudah Tersedia' && (
                          <span className="badge-gold">
                            <Sparkles className="w-3 h-3 text-gold-600" />
                            Unit Baru Tersedia
                          </span>
                        )}
                        {!item.category && (
                          <span className="px-2 py-0.5 rounded text-xs bg-warm-100 text-charcoal-600">
                            Reguler
                          </span>
                        )}
                      </td>

                      {/* Alasan Follow-up */}
                      <td className="py-3 px-4 text-xs text-charcoal-700 max-w-xs">
                        <p className="line-clamp-2" title={item.followUpReason || item.notes}>
                          {item.followUpReason || item.notes || '-'}
                        </p>
                        {item.lastOutcome && (
                          <div className="text-[11px] text-gold-800 font-semibold mt-1 flex items-center gap-1">
                            <span>Hasil:</span>
                            <span>{item.lastOutcome}</span>
                          </div>
                        )}
                      </td>

                      {/* Tgl Follow-up */}
                      <td className="py-3 px-3 text-center">
                        <div className="font-mono text-xs text-charcoal-800 font-medium">
                          {formatDate(item.scheduledDate)}
                        </div>
                        {isToday && (
                          <span className="inline-block mt-0.5 px-2 py-0.5 rounded text-[10px] font-bold bg-gold-100 text-gold-900 border border-gold-200">
                            Hari Ini ({item.scheduledTime || '10:00'})
                          </span>
                        )}
                        {isOverdue && (
                          <span className="inline-block mt-0.5 px-2 py-0.5 rounded text-[10px] font-bold bg-rose-50 text-rose-600 border border-rose-200">
                            Terlambat
                          </span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3 px-3 text-center">
                        {item.status === 'Belum Dihubungi' && (
                          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                            Belum Dihubungi
                          </span>
                        )}
                        {item.status === 'Sudah Dihubungi' && (
                          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-warm-100 text-charcoal-800 border border-warm-200">
                            Sudah Dihubungi
                          </span>
                        )}
                        {item.status === 'Menunggu Respons' && (
                          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-warm-100 text-charcoal-700 border border-warm-200">
                            Menunggu Respons
                          </span>
                        )}
                        {item.status === 'Berhasil Transaksi' && (
                          <span className="badge-gold">
                            <CheckCircle2 className="w-3 h-3 text-gold-600" />
                            Berhasil Deal
                          </span>
                        )}
                        {item.status === 'Tidak Berminat' && (
                          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-warm-100 text-charcoal-500 border border-warm-200">
                            Tidak Berminat
                          </span>
                        )}
                      </td>

                      {/* Aksi */}
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* Hubungi via WhatsApp */}
                          <a
                            href={waLink}
                            target={waLink !== '#' ? '_blank' : undefined}
                            rel="noopener noreferrer"
                            title={custPhone ? 'Buka Chat WhatsApp dengan Draft Pesan Otomatis Showroom' : 'Nomor WhatsApp belum tercatat'}
                            className={`btn-gold inline-flex items-center gap-1.5 py-1.5 px-3 text-xs whitespace-nowrap ${!custPhone ? 'opacity-50 cursor-not-allowed' : ''}`}
                            onClick={(e) => {
                              if (!custPhone || waLink === '#') {
                                e.preventDefault();
                                alert('Nomor WhatsApp belum tercatat untuk konsumen ini.');
                              }
                            }}
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                            <span>Kirim WhatsApp</span>
                          </a>

                          {/* Catat Hasil Komunikasi */}
                          <button
                            onClick={() => handleOpenLogModal(item)}
                            title="Catat Hasil Komunikasi & Riwayat Follow-up"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-warm-100 hover:bg-gold-50 text-charcoal-800 font-semibold text-xs border border-warm-200 transition-colors whitespace-nowrap"
                          >
                            <Check className="w-3.5 h-3.5 text-gold-600" />
                            <span>Catat Hasil</span>
                          </button>

                          {/* Riwayat Log */}
                          {item.communicationLogs && item.communicationLogs.length > 0 && (
                            <button
                              onClick={() => handleOpenHistoryModal(item)}
                              title="Lihat Riwayat Komunikasi"
                              className="p-1.5 text-charcoal-500 hover:text-gold-700 rounded-lg hover:bg-warm-100 transition-colors"
                            >
                              <History className="w-4 h-4 text-gold-600" />
                            </button>
                          )}
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
            Menampilkan <span className="text-charcoal-900 font-bold">{filteredFollowUps.length}</span> jadwal follow-up
          </div>
          <div className="text-charcoal-400">
            Klik WhatsApp untuk membuka chat konsumen dengan draft template resmi HR MOTOR
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* MODAL CATAT HASIL KOMUNIKASI (BAGIAN E)                   */}
      {/* ======================================================== */}
      {showLogModal && selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-charcoal-950/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white border border-warm-200 rounded-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto shadow-luxury flex flex-col">
            <div className="px-6 py-4 border-b border-warm-200 flex items-center justify-between sticky top-0 bg-white/95 backdrop-blur z-10">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-charcoal-900 text-gold-400 flex items-center justify-center shadow-sm">
                  <CheckCircle2 className="w-4 h-4 text-gold-400" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-charcoal-900">
                    Catat Hasil Komunikasi Follow-up
                  </h3>
                  <p className="text-xs text-charcoal-500">
                    {selectedItem.customerName} {selectedItem.customerPhone ? `(${selectedItem.customerPhone})` : ''}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowLogModal(false)}
                className="p-1.5 text-charcoal-400 hover:text-charcoal-700 rounded-lg hover:bg-warm-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitLog} className="p-6 space-y-4">
              {formError && (
                <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Info Follow-up saat ini */}
              <div className="bg-warm-50 p-3.5 rounded-xl border border-warm-200 space-y-1 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-charcoal-500">Jenis Follow-up:</span>
                  <span className="text-gold-700 font-bold">{selectedItem.category}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-charcoal-500">Unit Terkait:</span>
                  <span className="text-charcoal-900 font-bold">{selectedItem.vehicleInfo || '-'}</span>
                </div>
              </div>

              {/* Pilihan Hasil Komunikasi (Outcome) */}
              <div>
                <label className="block text-xs font-semibold text-charcoal-700 mb-1.5">
                  Hasil Respon Konsumen <span className="text-rose-500">*</span>
                </label>
                <div className="space-y-1.5">
                  {OUTCOMES.map((o) => (
                    <label
                      key={o}
                      className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors text-xs ${
                        logForm.outcome === o
                          ? 'bg-gold-50/50 border-gold-400 text-charcoal-900 font-semibold'
                          : 'bg-warm-50 border-warm-200 text-charcoal-700 hover:bg-warm-100'
                      }`}
                    >
                      <input
                        type="radio"
                        name="outcome"
                        value={o}
                        checked={logForm.outcome === o}
                        onChange={() => setLogForm({ ...logForm, outcome: o })}
                        className="text-gold-600 focus:ring-0"
                      />
                      <span>{o}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Catatan Komunikasi */}
              <div>
                <label className="block text-xs font-semibold text-charcoal-700 mb-1">
                  Catatan Komunikasi & Respon Konsumen <span className="text-rose-500">*</span>
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="Tuliskan respon konsumen, poin negosiasi, alasan pertimbangan, atau jadwal janjian cek unit..."
                  value={logForm.notes}
                  onChange={(e) => setLogForm({ ...logForm, notes: e.target.value })}
                  className="w-full px-3 py-2 bg-warm-50 border border-warm-200 rounded-xl text-xs text-charcoal-900 focus:outline-none focus:border-gold-500 focus:ring-1 focus:ring-gold-500/30"
                ></textarea>
              </div>

              {/* Kebutuhan / Minat Konsumen Saat Ini */}
              <div>
                <label className="block text-xs font-semibold text-charcoal-700 mb-1">
                  Kebutuhan / Minat Unit Konsumen Saat Ini
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Lebih tertarik SUV matik transmisi CVT, budget 200jt..."
                  value={logForm.currentInterestNotes}
                  onChange={(e) => setLogForm({ ...logForm, currentInterestNotes: e.target.value })}
                  className="w-full px-3 py-2 bg-warm-50 border border-warm-200 rounded-xl text-xs text-charcoal-900 focus:outline-none focus:border-gold-500 focus:ring-1 focus:ring-gold-500/30"
                />
              </div>

              {/* Opsi Jadwalkan Follow-up Lanjutan */}
              <div className="pt-3 border-t border-warm-200 space-y-3">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-charcoal-800">
                  <input
                    type="checkbox"
                    checked={logForm.scheduleNext}
                    onChange={(e) => setLogForm({ ...logForm, scheduleNext: e.target.checked })}
                    className="rounded text-gold-600 focus:ring-0"
                  />
                  <span>Jadwalkan Follow-up Berikutnya</span>
                </label>

                {logForm.scheduleNext && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 bg-warm-50 rounded-xl border border-warm-200">
                    <div>
                      <label className="block text-[11px] font-semibold text-charcoal-600 mb-1">
                        Tanggal Follow-up Lanjutan
                      </label>
                      <input
                        type="date"
                        required={logForm.scheduleNext}
                        value={logForm.scheduleNextDate}
                        onChange={(e) => setLogForm({ ...logForm, scheduleNextDate: e.target.value })}
                        className="w-full px-2.5 py-1.5 bg-white border border-warm-200 rounded-lg text-xs text-charcoal-900 focus:border-gold-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-charcoal-600 mb-1">
                        Jenis Follow-up
                      </label>
                      <select
                        value={logForm.scheduleNextCategory}
                        onChange={(e: any) =>
                          setLogForm({ ...logForm, scheduleNextCategory: e.target.value })
                        }
                        className="w-full px-2.5 py-1.5 bg-white border border-warm-200 rounded-lg text-xs text-charcoal-900 focus:border-gold-500"
                      >
                        {CATEGORIES.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-[11px] font-semibold text-charcoal-600 mb-1">
                        Alasan / Rencana Aksi Lanjutan
                      </label>
                      <input
                        type="text"
                        placeholder="Contoh: Cek unit hari Minggu sore di showroom Garut"
                        value={logForm.scheduleNextReason}
                        onChange={(e) => setLogForm({ ...logForm, scheduleNextReason: e.target.value })}
                        className="w-full px-2.5 py-1.5 bg-white border border-warm-200 rounded-lg text-xs text-charcoal-900 focus:border-gold-500"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-warm-200">
                <button
                  type="button"
                  onClick={() => setShowLogModal(false)}
                  className="px-4 py-2 rounded-xl bg-warm-100 hover:bg-warm-200 text-charcoal-700 font-semibold text-xs transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn-gold px-5 py-2 text-xs"
                >
                  {isSubmitting ? 'Menyimpan...' : 'Simpan Hasil Komunikasi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL RIWAYAT LOG KOMUNIKASI                              */}
      {/* ======================================================== */}
      {showHistoryModal && selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-charcoal-950/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white border border-warm-200 rounded-2xl w-full max-w-xl max-h-[85vh] overflow-y-auto shadow-luxury flex flex-col">
            <div className="px-6 py-4 border-b border-warm-200 flex items-center justify-between sticky top-0 bg-white/95 backdrop-blur z-10">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-charcoal-900 text-gold-400 flex items-center justify-center shadow-sm">
                  <History className="w-4 h-4 text-gold-400" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-charcoal-900">
                    Riwayat Komunikasi Follow-up
                  </h3>
                  <p className="text-xs text-charcoal-500">
                    {selectedItem.customerName} - {selectedItem.vehicleInfo}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowHistoryModal(false)}
                className="p-1.5 text-charcoal-400 hover:text-charcoal-700 rounded-lg hover:bg-warm-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {!selectedItem.communicationLogs || selectedItem.communicationLogs.length === 0 ? (
                <div className="text-center py-8 text-charcoal-400 text-xs">
                  Belum ada catatan riwayat komunikasi.
                </div>
              ) : (
                <div className="relative border-l-2 border-warm-200 ml-3 space-y-4">
                  {selectedItem.communicationLogs.map((log) => (
                    <div key={log.id} className="relative pl-6">
                      <div className="absolute -left-1.5 top-1.5 w-3 h-3 rounded-full bg-gold-500 ring-4 ring-white shadow-xs"></div>
                      <div className="bg-warm-50 p-3.5 rounded-xl border border-warm-200 space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-charcoal-900">{log.outcome}</span>
                          <span className="text-charcoal-400 font-mono text-[11px]">
                            {formatDate(log.timestamp, true)}
                          </span>
                        </div>
                        {log.notes && (
                          <p className="text-xs text-charcoal-700 leading-relaxed pt-1">
                            {log.notes}
                          </p>
                        )}
                        <div className="flex items-center justify-between text-[11px] text-charcoal-500 pt-1.5 border-t border-warm-200/80 mt-1">
                          <span>Oleh: {log.salesName || 'Sales Representative'}</span>
                          {log.nextFollowUpDate && (
                            <span className="text-gold-700 font-bold">
                              Lanjutan: {formatDate(log.nextFollowUpDate)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="px-6 py-3.5 border-t border-warm-200 bg-warm-50 flex items-center justify-end">
              <button
                onClick={() => setShowHistoryModal(false)}
                className="px-4 py-2 rounded-xl bg-charcoal-800 hover:bg-charcoal-900 text-white font-semibold text-xs transition-colors"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL TAMBAH FOLLOW-UP MANUAL                            */}
      {/* ======================================================== */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-charcoal-950/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white border border-warm-200 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-luxury flex flex-col">
            <div className="px-6 py-4 border-b border-warm-200 flex items-center justify-between sticky top-0 bg-white/95 backdrop-blur z-10">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-charcoal-900 text-gold-400 flex items-center justify-center shadow-sm">
                  <CalendarClock className="w-4 h-4 text-gold-400" />
                </div>
                <h3 className="text-base font-bold text-charcoal-900">
                  Jadwalkan Follow-up Baru Showroom
                </h3>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1.5 text-charcoal-400 hover:text-charcoal-700 rounded-lg hover:bg-warm-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitAdd} className="p-6 space-y-4">
              {formError && (
                <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-charcoal-700 mb-1">
                  Nama Konsumen <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Nama lengkap konsumen..."
                  value={newForm.customerName}
                  onChange={(e) => setNewForm({ ...newForm, customerName: e.target.value })}
                  className="w-full px-3 py-2 bg-warm-50 border border-warm-200 rounded-xl text-xs text-charcoal-900 focus:outline-none focus:border-gold-500 focus:ring-1 focus:ring-gold-500/30"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-charcoal-700 mb-1">
                  Nomor WhatsApp <span className="text-rose-500">*</span>
                </label>
                <input
                  type="tel"
                  required
                  placeholder="08123456789"
                  value={newForm.customerPhone}
                  onChange={(e) => setNewForm({ ...newForm, customerPhone: e.target.value })}
                  className="w-full px-3 py-2 bg-warm-50 border border-warm-200 rounded-xl text-xs text-charcoal-900 focus:outline-none focus:border-gold-500 focus:ring-1 focus:ring-gold-500/30 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-charcoal-700 mb-1">
                  Jenis Follow-up <span className="text-rose-500">*</span>
                </label>
                <select
                  value={newForm.category}
                  onChange={(e) =>
                    setNewForm({ ...newForm, category: e.target.value as FollowUpCategory })
                  }
                  className="w-full px-3 py-2 bg-warm-50 border border-warm-200 rounded-xl text-xs text-charcoal-900 focus:outline-none focus:border-gold-500"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-charcoal-700 mb-1">
                  Unit yang Dibeli / Dicari
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Toyota Avanza 2020 / Honda Brio"
                  value={newForm.vehicleInfo}
                  onChange={(e) => setNewForm({ ...newForm, vehicleInfo: e.target.value })}
                  className="w-full px-3 py-2 bg-warm-50 border border-warm-200 rounded-xl text-xs text-charcoal-900 focus:outline-none focus:border-gold-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-charcoal-700 mb-1">
                    Tanggal Jadwal <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={newForm.scheduledDate}
                    onChange={(e) => setNewForm({ ...newForm, scheduledDate: e.target.value })}
                    className="w-full px-3 py-2 bg-warm-50 border border-warm-200 rounded-xl text-xs text-charcoal-900 focus:outline-none focus:border-gold-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-charcoal-700 mb-1">
                    Jam Follow-up
                  </label>
                  <input
                    type="time"
                    value={newForm.scheduledTime}
                    onChange={(e) => setNewForm({ ...newForm, scheduledTime: e.target.value })}
                    className="w-full px-3 py-2 bg-warm-50 border border-warm-200 rounded-xl text-xs text-charcoal-900 focus:outline-none focus:border-gold-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-charcoal-700 mb-1">
                  Alasan / Tujuan Follow-up
                </label>
                <textarea
                  rows={2}
                  placeholder="Alasan menghubungi konsumen showroom..."
                  value={newForm.followUpReason}
                  onChange={(e) => setNewForm({ ...newForm, followUpReason: e.target.value })}
                  className="w-full px-3 py-2 bg-warm-50 border border-warm-200 rounded-xl text-xs text-charcoal-900 focus:outline-none focus:border-gold-500"
                ></textarea>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-warm-200">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl bg-warm-100 hover:bg-warm-200 text-charcoal-700 font-semibold text-xs transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn-gold px-5 py-2 text-xs"
                >
                  {isSubmitting ? 'Menyimpan...' : 'Jadwalkan Follow-up'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
