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
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = item.customerName.toLowerCase().includes(q);
        const matchPhone = item.customerPhone.includes(q);
        const matchUnit = item.vehicleInfo?.toLowerCase().includes(q);
        const matchReason = item.followUpReason?.toLowerCase().includes(q);
        const matchNotes = item.notes?.toLowerCase().includes(q);
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
      if (filterTimeTab === 'today') {
        return (
          item.scheduledDate === todayStr &&
          item.status !== 'Berhasil Transaksi' &&
          item.status !== 'Tidak Berminat'
        );
      }
      if (filterTimeTab === 'overdue') {
        return (
          item.scheduledDate < todayStr &&
          item.status !== 'Berhasil Transaksi' &&
          item.status !== 'Tidak Berminat'
        );
      }
      if (filterTimeTab === 'upcoming') {
        return (
          item.scheduledDate > todayStr &&
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
    const unitName = item.vehicleInfo || 'mobil idaman';

    if (item.category === 'Pelanggan Lama (1 Tahun)') {
      return `Halo Bapak/Ibu ${item.customerName}, salam hangat dari HR MOTOR Garut.\n\nTidak terasa sudah 1 tahun Bapak/Ibu menggunakan unit ${unitName}. Bagaimana kondisi dan performa kendaraannya saat ini? Apakah ada rencana untuk mengganti unit / tukar tambah (trade-in), atau berniat menjual kembali mobil tersebut melalui HR MOTOR Garut?\n\nKami siap memberikan penawaran terbaik untuk Bapak/Ibu. Terima kasih.`;
    }

    if (item.category === 'Prospek Tidak Jadi (1 Bulan)') {
      return `Halo Bapak/Ibu ${item.customerName}, salam dari HR MOTOR Garut.\n\nKami ingin menyapa kembali Bapak/Ibu. Apakah saat ini Bapak/Ibu masih mencari unit mobil idaman? Saat ini di showroom HR MOTOR tersedia beberapa pilihan unit stok baru yang mungkin sesuai dengan kriteria Bapak/Ibu.\n\nSilakan kabari kami jika berkenan mendapatkan informasi unit lebih lengkap. Terima kasih.`;
    }

    // Unit yang Dicari Sudah Tersedia
    return `Halo Bapak/Ibu ${item.customerName}, kabar baik dari HR MOTOR Garut!\n\nUnit mobil ${unitName} yang sebelumnya Bapak/Ibu cari/tanyakan baru saja tersedia di showroom kami dengan kondisi istimewa dan siap pakai.\n\nMengingat unit ini banyak peminatnya, silakan hubungi kami segera jika Bapak/Ibu ingin cek unit langsung atau menjadwalkan test drive. Terima kasih.`;
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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              <CalendarClock className="w-7 h-7 text-emerald-400" />
              Follow-up Management
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              Otomatis & Terintegrasi
            </span>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Manajemen follow-up otomatis 3 alur: Pelanggan Lama (1 Thn), Prospek Tidak Jadi (1 Bln), dan Unit Stok yang Cocok.
          </p>
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
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-sm transition-all shadow-lg shadow-emerald-950/40 active:scale-95"
        >
          <Plus className="w-4 h-4" />
          Jadwalkan Follow-up Manual
        </button>
      </div>

      {/* 8 SUMMARY METRICS (BAGIAN G) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
        {/* Total */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3 shadow-sm">
          <div className="text-[11px] font-medium text-slate-400">Total Follow-up</div>
          <div className="text-xl font-bold text-white mt-1">{dashboardStats.total}</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Semua data</div>
        </div>

        {/* Hari Ini */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3 shadow-sm">
          <div className="text-[11px] font-medium text-emerald-400 flex items-center gap-1">
            <Clock className="w-3 h-3" /> Hari Ini
          </div>
          <div className="text-xl font-bold text-emerald-400 mt-1">{dashboardStats.today}</div>
          <div className="text-[10px] text-emerald-500/70 mt-0.5">Perlu dihubungi</div>
        </div>

        {/* Terlambat */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3 shadow-sm">
          <div className="text-[11px] font-medium text-rose-400 flex items-center gap-1">
            <AlertTriangle className="w-3 h-3" /> Terlambat
          </div>
          <div className="text-xl font-bold text-rose-400 mt-1">{dashboardStats.overdue}</div>
          <div className="text-[10px] text-rose-500/70 mt-0.5">Lewat jadwal</div>
        </div>

        {/* Belum Dihubungi */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3 shadow-sm">
          <div className="text-[11px] font-medium text-amber-400">Belum Kontak</div>
          <div className="text-xl font-bold text-amber-400 mt-1">{dashboardStats.belumDihubungi}</div>
          <div className="text-[10px] text-amber-500/70 mt-0.5">Menunggu follow-up</div>
        </div>

        {/* Sudah Dihubungi */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3 shadow-sm">
          <div className="text-[11px] font-medium text-blue-400">Sudah Kontak</div>
          <div className="text-xl font-bold text-blue-400 mt-1">{dashboardStats.sudahDihubungi}</div>
          <div className="text-[10px] text-blue-500/70 mt-0.5">Terkontak sales</div>
        </div>

        {/* Berhasil Deal */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3 shadow-sm">
          <div className="text-[11px] font-medium text-emerald-400 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" /> Deal / Sukses
          </div>
          <div className="text-xl font-bold text-emerald-400 mt-1">{dashboardStats.berhasilTransaksi}</div>
          <div className="text-[10px] text-emerald-500/70 mt-0.5">Transaksi Deal</div>
        </div>

        {/* Pelanggan Lama */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3 shadow-sm">
          <div className="text-[11px] font-medium text-purple-400">1 Thn Lama</div>
          <div className="text-xl font-bold text-purple-400 mt-1">{dashboardStats.pelangganLama}</div>
          <div className="text-[10px] text-purple-500/70 mt-0.5">Retensi / Trade-in</div>
        </div>

        {/* Prospek Tidak Jadi */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3 shadow-sm">
          <div className="text-[11px] font-medium text-cyan-400">1 Bln Lost</div>
          <div className="text-xl font-bold text-cyan-400 mt-1">{dashboardStats.prospekTidakJadi}</div>
          <div className="text-[10px] text-cyan-500/70 mt-0.5">Reaktivasi prospek</div>
        </div>
      </div>

      {/* FILTER & TABS SECTION */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 space-y-4 shadow-sm">
        {/* Navigation Tabs */}
        <div className="flex flex-wrap items-center gap-2 border-b border-slate-800 pb-3">
          <button
            onClick={() => setFilterTimeTab('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              filterTimeTab === 'all'
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            Semua Jadwal ({followUps.length})
          </button>
          <button
            onClick={() => setFilterTimeTab('today')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 ${
              filterTimeTab === 'today'
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Clock className="w-3.5 h-3.5 text-emerald-400" />
            Hari Ini ({dashboardStats.today})
          </button>
          <button
            onClick={() => setFilterTimeTab('overdue')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 ${
              filterTimeTab === 'overdue'
                ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
            Terlambat ({dashboardStats.overdue})
          </button>
          <button
            onClick={() => setFilterTimeTab('upcoming')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              filterTimeTab === 'upcoming'
                ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            Mendatang
          </button>
          <button
            onClick={() => setFilterTimeTab('deal')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 ${
              filterTimeTab === 'deal'
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            Berhasil Transaksi ({dashboardStats.berhasilTransaksi})
          </button>
        </div>

        {/* Search & Filter Dropdowns */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="md:col-span-2 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Cari nama konsumen, nomor WA, unit mobil, atau catatan..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-950/60 border border-slate-800 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500/50"
            />
          </div>

          {/* Kategori Filter */}
          <div>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950/60 border border-slate-800 rounded-lg text-sm text-white focus:outline-none focus:border-emerald-500/50"
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
              className="w-full px-3 py-2 bg-slate-950/60 border border-slate-800 rounded-lg text-sm text-white focus:outline-none focus:border-emerald-500/50"
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

      {/* TABLE FOLLOW-UP (BAGIAN C) */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="text-xs uppercase bg-slate-950/70 text-slate-400 border-b border-slate-800">
              <tr>
                <th className="py-3 px-3 text-center w-12">No</th>
                <th className="py-3 px-4">Nama Konsumen</th>
                <th className="py-3 px-3">Nomor WhatsApp</th>
                <th className="py-3 px-4">Unit Dibeli / Dicari</th>
                <th className="py-3 px-3">Jenis Follow-up</th>
                <th className="py-3 px-4">Alasan Follow-up</th>
                <th className="py-3 px-3 text-center">Tgl Follow-up</th>
                <th className="py-3 px-3 text-center">Status</th>
                <th className="py-3 px-4 text-center min-w-[280px]">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredFollowUps.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-500">
                    <CalendarClock className="w-12 h-12 mx-auto text-slate-600 mb-2 stroke-[1.5]" />
                    <p className="text-base font-medium text-slate-400">Tidak ada data follow-up</p>
                    <p className="text-xs text-slate-500 mt-1">Ubah filter atau jadwal follow-up baru akan muncul di sini.</p>
                  </td>
                </tr>
              ) : (
                filteredFollowUps.map((item, idx) => {
                  const isToday = item.scheduledDate === todayStr;
                  const isOverdue =
                    item.scheduledDate < todayStr &&
                    item.status !== 'Berhasil Transaksi' &&
                    item.status !== 'Tidak Berminat';

                  const waMessage = getWhatsAppMessage(item);
                  const waLink = formatWhatsAppLink(item.customerPhone, waMessage);

                  // Check if stock unit is sold
                  const linkedStock = stocks.find((s) => s.id === item.vehicleStockId);
                  const isSold = item.isUnitSold || (linkedStock && linkedStock.status === 'Terjual');

                  return (
                    <tr key={item.id} className="hover:bg-slate-800/40 transition-colors">
                      {/* No */}
                      <td className="py-3 px-3 text-center text-slate-500 font-mono text-xs">
                        {idx + 1}
                      </td>

                      {/* Nama Konsumen */}
                      <td className="py-3 px-4 font-medium text-white">
                        <div className="flex items-center gap-1.5">
                          <span>{item.customerName}</span>
                          {item.priority === 'Tinggi' && (
                            <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30">
                              Prioritas
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                          {item.id}
                        </div>
                      </td>

                      {/* Nomor WhatsApp */}
                      <td className="py-3 px-3 font-mono text-xs text-slate-300">
                        <a
                          href={waLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-emerald-400 hover:underline"
                        >
                          <Phone className="w-3 h-3" />
                          {item.customerPhone}
                        </a>
                      </td>

                      {/* Unit yang Dibeli / Dicari */}
                      <td className="py-3 px-4">
                        <div className="font-medium text-slate-200">
                          {item.vehicleInfo || '-'}
                        </div>
                        {isSold && (
                          <div className="inline-flex items-center gap-1 px-2 py-0.5 mt-1 rounded text-[10px] font-semibold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                            <AlertTriangle className="w-3 h-3 text-rose-400" />
                            Unit Sudah Terjual! Tawarkan unit lain
                          </div>
                        )}
                      </td>

                      {/* Jenis Follow-up */}
                      <td className="py-3 px-3">
                        {item.category === 'Pelanggan Lama (1 Tahun)' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-500/10 text-purple-300 border border-purple-500/20">
                            1 Thn - Pelanggan Lama
                          </span>
                        )}
                        {item.category === 'Prospek Tidak Jadi (1 Bulan)' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
                            1 Bln - Prospek Lost
                          </span>
                        )}
                        {item.category === 'Unit yang Dicari Sudah Tersedia' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                            <Sparkles className="w-3 h-3 text-emerald-400" />
                            Unit Tersedia di Stok
                          </span>
                        )}
                        {!item.category && (
                          <span className="px-2 py-0.5 rounded text-xs bg-slate-800 text-slate-400">
                            Reguler
                          </span>
                        )}
                      </td>

                      {/* Alasan Follow-up */}
                      <td className="py-3 px-4 text-xs text-slate-300 max-w-xs">
                        <p className="line-clamp-2" title={item.followUpReason || item.notes}>
                          {item.followUpReason || item.notes || '-'}
                        </p>
                        {item.lastOutcome && (
                          <div className="text-[11px] text-amber-400/90 mt-1 flex items-center gap-1">
                            <span>Hasil terakhir:</span>
                            <span className="font-semibold">{item.lastOutcome}</span>
                          </div>
                        )}
                      </td>

                      {/* Tgl Follow-up */}
                      <td className="py-3 px-3 text-center">
                        <div className="font-mono text-xs text-slate-200">
                          {formatDate(item.scheduledDate)}
                        </div>
                        {isToday && (
                          <span className="inline-block mt-0.5 px-1.5 py-0.2 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400">
                            Hari Ini ({item.scheduledTime || '10:00'})
                          </span>
                        )}
                        {isOverdue && (
                          <span className="inline-block mt-0.5 px-1.5 py-0.2 rounded text-[10px] font-bold bg-rose-500/20 text-rose-400">
                            Terlambat
                          </span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3 px-3 text-center">
                        {item.status === 'Belum Dihubungi' && (
                          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                            Belum Dihubungi
                          </span>
                        )}
                        {item.status === 'Sudah Dihubungi' && (
                          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                            Sudah Dihubungi
                          </span>
                        )}
                        {item.status === 'Menunggu Respons' && (
                          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                            Menunggu Respons
                          </span>
                        )}
                        {item.status === 'Berhasil Transaksi' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                            <CheckCircle2 className="w-3 h-3" />
                            Berhasil Deal
                          </span>
                        )}
                        {item.status === 'Tidak Berminat' && (
                          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-800 text-slate-400 border border-slate-700">
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
                            target="_blank"
                            rel="noopener noreferrer"
                            title="Buka Chat WhatsApp dengan Draft Pesan Otomatis (Admin meninjau dan mengirim manual)"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs transition-colors shadow-sm whitespace-nowrap active:scale-95"
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                            <span>Hubungi via WhatsApp</span>
                          </a>

                          {/* Catat Hasil Komunikasi */}
                          <button
                            onClick={() => handleOpenLogModal(item)}
                            title="Catat Hasil Komunikasi & Riwayat Follow-up"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-xs transition-colors border border-slate-700/60 whitespace-nowrap active:scale-95"
                          >
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                            <span>Catat Hasil</span>
                          </button>

                          {/* Riwayat Log */}
                          {item.communicationLogs && item.communicationLogs.length > 0 && (
                            <button
                              onClick={() => handleOpenHistoryModal(item)}
                              title="Lihat Riwayat Komunikasi"
                              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
                            >
                              <History className="w-4 h-4 text-purple-400" />
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
        <div className="py-2.5 px-4 bg-slate-950/70 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <div>
            Menampilkan <span className="text-white font-medium">{filteredFollowUps.length}</span> jadwal follow-up
          </div>
          <div className="text-slate-500">
            Klik WhatsApp untuk langsung chat konsumen dengan template otomatis
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* MODAL CATAT HASIL KOMUNIKASI (BAGIAN E)                   */}
      {/* ======================================================== */}
      {showLogModal && selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col">
            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between sticky top-0 bg-slate-900/95 backdrop-blur z-10">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    Catat Hasil Komunikasi Follow-up
                  </h3>
                  <p className="text-xs text-slate-400">
                    {selectedItem.customerName} ({selectedItem.customerPhone})
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowLogModal(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitLog} className="p-6 space-y-4">
              {formError && (
                <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Info Follow-up saat ini */}
              <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800 space-y-1 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Jenis Follow-up:</span>
                  <span className="text-emerald-400 font-semibold">{selectedItem.category}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Unit Terkait:</span>
                  <span className="text-white font-medium">{selectedItem.vehicleInfo || '-'}</span>
                </div>
              </div>

              {/* Pilihan Hasil Komunikasi (Outcome) */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Hasil Respon Konsumen <span className="text-rose-400">*</span>
                </label>
                <div className="space-y-1.5">
                  {OUTCOMES.map((o) => (
                    <label
                      key={o}
                      className={`flex items-center gap-3 p-2.5 rounded-lg border cursor-pointer transition-colors text-xs ${
                        logForm.outcome === o
                          ? 'bg-emerald-500/10 border-emerald-500/50 text-white'
                          : 'bg-slate-950/40 border-slate-800 text-slate-300 hover:bg-slate-800/40'
                      }`}
                    >
                      <input
                        type="radio"
                        name="outcome"
                        value={o}
                        checked={logForm.outcome === o}
                        onChange={() => setLogForm({ ...logForm, outcome: o })}
                        className="text-emerald-500 focus:ring-0"
                      />
                      <span className="font-medium">{o}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Catatan Komunikasi */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Catatan Komunikasi & Respon Konsumen <span className="text-rose-400">*</span>
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="Tuliskan respon konsumen, poin negosiasi, alasan pertimbangan, atau jadwal janjian cek unit..."
                  value={logForm.notes}
                  onChange={(e) => setLogForm({ ...logForm, notes: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white focus:outline-none focus:border-emerald-500"
                ></textarea>
              </div>

              {/* Kebutuhan / Minat Konsumen Saat Ini */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Kebutuhan / Minat Unit Konsumen Saat Ini
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Lebih tertarik SUV matik transmisi CVT, budget 200jt..."
                  value={logForm.currentInterestNotes}
                  onChange={(e) => setLogForm({ ...logForm, currentInterestNotes: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Opsi Jadwalkan Follow-up Lanjutan */}
              <div className="pt-3 border-t border-slate-800 space-y-3">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-white">
                  <input
                    type="checkbox"
                    checked={logForm.scheduleNext}
                    onChange={(e) => setLogForm({ ...logForm, scheduleNext: e.target.checked })}
                    className="rounded text-emerald-500 focus:ring-0"
                  />
                  <span>Jadwalkan Follow-up Berikutnya</span>
                </label>

                {logForm.scheduleNext && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 bg-slate-950/60 rounded-xl border border-slate-800">
                    <div>
                      <label className="block text-[11px] text-slate-400 mb-1">
                        Tanggal Follow-up Lanjutan
                      </label>
                      <input
                        type="date"
                        required={logForm.scheduleNext}
                        value={logForm.scheduleNextDate}
                        onChange={(e) => setLogForm({ ...logForm, scheduleNextDate: e.target.value })}
                        className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded text-xs text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-slate-400 mb-1">
                        Jenis Follow-up
                      </label>
                      <select
                        value={logForm.scheduleNextCategory}
                        onChange={(e: any) =>
                          setLogForm({ ...logForm, scheduleNextCategory: e.target.value })
                        }
                        className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded text-xs text-white"
                      >
                        {CATEGORIES.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-[11px] text-slate-400 mb-1">
                        Alasan / Rencana Aksi Lanjutan
                      </label>
                      <input
                        type="text"
                        placeholder="Contoh: Cek unit hari Minggu sore di showroom Garut"
                        value={logForm.scheduleNextReason}
                        onChange={(e) => setLogForm({ ...logForm, scheduleNextReason: e.target.value })}
                        className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded text-xs text-white"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowLogModal(false)}
                  className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-xs transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs transition-all shadow-lg shadow-emerald-950/40 disabled:opacity-50"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl max-h-[85vh] overflow-y-auto shadow-2xl flex flex-col">
            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between sticky top-0 bg-slate-900/95 backdrop-blur z-10">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
                  <History className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    Riwayat Komunikasi Follow-up
                  </h3>
                  <p className="text-xs text-slate-400">
                    {selectedItem.customerName} - {selectedItem.vehicleInfo}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowHistoryModal(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {!selectedItem.communicationLogs || selectedItem.communicationLogs.length === 0 ? (
                <div className="text-center py-8 text-slate-500 text-sm">
                  Belum ada catatan riwayat komunikasi.
                </div>
              ) : (
                <div className="relative border-l-2 border-slate-800 ml-3 space-y-4">
                  {selectedItem.communicationLogs.map((log) => (
                    <div key={log.id} className="relative pl-6">
                      <div className="absolute -left-1.5 top-1.5 w-3 h-3 rounded-full bg-emerald-500 ring-4 ring-slate-900"></div>
                      <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-semibold text-emerald-400">{log.outcome}</span>
                          <span className="text-slate-500 font-mono">
                            {formatDate(log.timestamp, true)}
                          </span>
                        </div>
                        {log.notes && (
                          <p className="text-xs text-slate-300 leading-relaxed pt-1">
                            {log.notes}
                          </p>
                        )}
                        <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-800/60 mt-1">
                          <span>Oleh: {log.salesName || 'Sales Representative'}</span>
                          {log.nextFollowUpDate && (
                            <span className="text-purple-400">
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

            <div className="px-6 py-3.5 border-t border-slate-800 bg-slate-950/60 flex items-center justify-end">
              <button
                onClick={() => setShowHistoryModal(false)}
                className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-xs"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col">
            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between sticky top-0 bg-slate-900/95 backdrop-blur z-10">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <CalendarClock className="w-5 h-5 text-emerald-400" />
                Jadwalkan Follow-up Baru
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitAdd} className="p-6 space-y-4">
              {formError && (
                <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Nama Konsumen <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Nama lengkap konsumen..."
                  value={newForm.customerName}
                  onChange={(e) => setNewForm({ ...newForm, customerName: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Nomor WhatsApp <span className="text-rose-400">*</span>
                </label>
                <input
                  type="tel"
                  required
                  placeholder="08123456789"
                  value={newForm.customerPhone}
                  onChange={(e) => setNewForm({ ...newForm, customerPhone: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white focus:outline-none focus:border-emerald-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Jenis Follow-up <span className="text-rose-400">*</span>
                </label>
                <select
                  value={newForm.category}
                  onChange={(e) =>
                    setNewForm({ ...newForm, category: e.target.value as FollowUpCategory })
                  }
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white focus:outline-none focus:border-emerald-500"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Unit yang Dibeli / Dicari
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Toyota Avanza 2020 / Honda Brio"
                  value={newForm.vehicleInfo}
                  onChange={(e) => setNewForm({ ...newForm, vehicleInfo: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Tanggal Jadwal <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={newForm.scheduledDate}
                    onChange={(e) => setNewForm({ ...newForm, scheduledDate: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Jam Follow-up
                  </label>
                  <input
                    type="time"
                    value={newForm.scheduledTime}
                    onChange={(e) => setNewForm({ ...newForm, scheduledTime: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Alasan / Tujuan Follow-up
                </label>
                <textarea
                  rows={2}
                  placeholder="Alasan menghubungi konsumen..."
                  value={newForm.followUpReason}
                  onChange={(e) => setNewForm({ ...newForm, followUpReason: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white focus:outline-none focus:border-emerald-500"
                ></textarea>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-xs transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs transition-all shadow-lg shadow-emerald-950/40 disabled:opacity-50"
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
