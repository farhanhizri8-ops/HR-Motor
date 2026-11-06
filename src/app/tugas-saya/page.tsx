'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useCrm } from '@/context/CrmContext';
import {
  Wrench,
  Sparkles,
  Landmark,
  Video,
  MessageCircle,
  Radio,
  CheckCircle2,
  Clock,
  Car,
  Search,
  Plus,
  Trash2,
  ExternalLink,
  RotateCcw,
  Calendar,
  FileSpreadsheet,
  Check,
  Send,
  Eye,
  Camera,
  Layers,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Tag,
  Smartphone,
} from 'lucide-react';
import {
  ContentPlatform,
  ContentStatus,
  ContentCategory,
  CleaningChecklistItem,
  VehicleStock,
  CashFlowCategory,
} from '@/types/crm';

export default function TugasSayaPage() {
  const {
    currentUser,
    stocks,
    updateStock,
    cleaningChecklist,
    toggleCleaningChecklist,
    resetDailyCleaningChecklist,
    contentStocks,
    addContentStock,
    updateContentStock,
    deleteContentStock,
    cashFlow,
    addCashFlow,
    leads,
    followUps,
    formatRupiah,
  } = useCrm();

  // Ambil daftar jobdesk pengguna saat ini (dengan fallback ke role)
  const userJobdesks = useMemo(() => {
    if (currentUser?.jobdesks && currentUser.jobdesks.length > 0) {
      return currentUser.jobdesks;
    }
    return [currentUser?.role || 'Owner'];
  }, [currentUser]);

  const isOwner = currentUser?.role === 'Owner' || (currentUser?.email && currentUser.email.toLowerCase().includes('farhanhizri8') || currentUser.email.toLowerCase().includes('danimr7263'));

  // Active Tab state: 'ALL' (tampilkan semua tugas jika punya >1 jobdesk), atau nama jobdesk tertentu
  const [activeTab, setActiveTab] = useState<string>('ALL');

  // Search & Filter states untuk Teknisi
  const [techSearch, setTechSearch] = useState('');
  const [techFilter, setTechFilter] = useState<'ALL' | 'UNREPAIRED' | 'UNPAINTED' | 'UNDETAILED' | 'UNPHOTOGRAPHED' | 'DONE'>('UNREPAIRED');

  // Filter states untuk Operasional
  const [cleaningFilter, setCleaningFilter] = useState<'ALL' | 'UNFINISHED' | 'FINISHED'>('ALL');

  // Form Modal & Filter states untuk Konten Kreator
  const [contentFilter, setContentFilter] = useState<'ALL' | 'Draf' | 'Siap Tayang' | 'Sudah Tayang'>('ALL');
  const [isAddContentOpen, setIsAddContentOpen] = useState(false);
  const [contentForm, setContentForm] = useState({
    title: '',
    platform: 'TikTok' as ContentPlatform,
    category: 'Review Unit' as ContentCategory,
    vehicleModel: '',
    status: 'Draf' as ContentStatus,
    targetPublishDate: new Date().toISOString().split('T')[0],
    notes: '',
    videoUrl: '',
  });

  // Form Modal untuk Tambah Arus Kas (Keuangan)
  const [isAddCashFlowOpen, setIsAddCashFlowOpen] = useState(false);
  const [cashFlowForm, setCashFlowForm] = useState<{
    type: 'in' | 'out';
    category: CashFlowCategory;
    amount: string;
    description: string;
    date: string;
  }>({
    type: 'out',
    category: 'Operasional Showroom',
    amount: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
  });

  // Filter states untuk Admin WA / CRM
  const [crmSearch, setCrmSearch] = useState('');

  // Toast feedback state
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // ---------------------------------------------------------------------------
  // FILTER DATA PER JOBDESK
  // ---------------------------------------------------------------------------

  // 1. Data Teknisi Otomotif (Stok Mobil Butuh Perbaikan / Pengecatan / Salon)
  const filteredTechStocks = useMemo(() => {
    return (stocks || []).filter((car) => {
      const plate = car.plateNumber || car.licensePlate || '';
      // Search query
      const matchSearch =
        techSearch.trim() === '' ||
        car.brand.toLowerCase().includes(techSearch.toLowerCase()) ||
        car.model.toLowerCase().includes(techSearch.toLowerCase()) ||
        plate.toLowerCase().includes(techSearch.toLowerCase()) ||
        car.id.toLowerCase().includes(techSearch.toLowerCase());

      if (!matchSearch) return false;

      if (techFilter === 'UNREPAIRED') return !car.isRepaired;
      if (techFilter === 'UNPAINTED') return !car.isPainted;
      if (techFilter === 'UNDETAILED') return !car.isDetailed;
      if (techFilter === 'UNPHOTOGRAPHED') return !car.isPhotographed;
      if (techFilter === 'DONE') return car.isRepaired && car.isPainted && car.isDetailed && car.isPhotographed;
      return true;
    });
  }, [stocks, techSearch, techFilter]);

  const techUnrepairedCount = (stocks || []).filter((s) => !s.isRepaired).length;
  const techUnpaintedCount = (stocks || []).filter((s) => !s.isPainted).length;
  const techUndetailedCount = (stocks || []).filter((s) => !s.isDetailed).length;
  const techUnphotographedCount = (stocks || []).filter((s) => !s.isPhotographed).length;
  const techDoneCount = (stocks || []).filter((s) => s.isRepaired && s.isPainted && s.isDetailed && s.isPhotographed).length;

  // 2. Data Staf Operasional Showroom (Monitoring Kebersihan)
  const filteredCleaningList = useMemo(() => {
    return (cleaningChecklist || []).filter((item) => {
      if (cleaningFilter === 'UNFINISHED') return !item.isClean;
      if (cleaningFilter === 'FINISHED') return item.isClean;
      return true;
    });
  }, [cleaningChecklist, cleaningFilter]);

  const cleanTotalCount = (cleaningChecklist || []).length;
  const cleanFinishedCount = (cleaningChecklist || []).filter((c) => c.isClean).length;
  const cleanPercentage = cleanTotalCount > 0 ? Math.round((cleanFinishedCount / cleanTotalCount) * 100) : 0;

  // 3. Data Keuangan & Pembukuan
  const cashInTotal = useMemo(() => {
    return (cashFlow || []).filter((c) => c.type === 'in').reduce((acc, c) => acc + (c.amount || 0), 0);
  }, [cashFlow]);

  const cashOutTotal = useMemo(() => {
    return (cashFlow || []).filter((c) => c.type === 'out').reduce((acc, c) => acc + (c.amount || 0), 0);
  }, [cashFlow]);

  const currentCashBalance = cashInTotal - cashOutTotal;

  // 4. Data Konten Kreator
  const filteredContentStocks = useMemo(() => {
    return (contentStocks || []).filter((c) => {
      if (contentFilter === 'ALL') return true;
      return c.status === contentFilter;
    });
  }, [contentStocks, contentFilter]);

  const contentDraftCount = (contentStocks || []).filter((c) => c.status === 'Draf').length;
  const contentReadyCount = (contentStocks || []).filter((c) => c.status === 'Siap Tayang').length;
  const contentPublishedCount = (contentStocks || []).filter((c) => c.status === 'Sudah Tayang').length;

  // 5. Data Admin WA / CRM
  const filteredLeads = useMemo(() => {
    return (leads || []).filter((lead) => {
      if (crmSearch.trim() === '') return true;
      return (
        lead.customerName.toLowerCase().includes(crmSearch.toLowerCase()) ||
        lead.contactNumber.toLowerCase().includes(crmSearch.toLowerCase()) ||
        (lead.interestedVehicle && lead.interestedVehicle.toLowerCase().includes(crmSearch.toLowerCase()))
      );
    });
  }, [leads, crmSearch]);

  const pendingFollowUps = useMemo(() => {
    return (followUps || []).filter((f) => f.status === 'Terjadwal');
  }, [followUps]);

  // ---------------------------------------------------------------------------
  // HANDLERS
  // ---------------------------------------------------------------------------

  // Handle Perubahan Checklist Kesiapan Mobil oleh Teknisi
  const handleToggleTechReadiness = async (
    car: VehicleStock,
    field: 'isRepaired' | 'isPainted' | 'isDetailed' | 'isPhotographed',
    currentVal: boolean
  ) => {
    const nextVal = !currentVal;
    const res = await updateStock({ id: car.id, [field]: nextVal });
    if (res.success) {
      const fieldNames = {
        isRepaired: 'Perbaikan Mesin/Kaki',
        isPainted: 'Pengecatan Body',
        isDetailed: 'Salon & Detailing',
        isPhotographed: 'Foto Unit Showroom',
      };
      showToast(`✓ ${car.model}: ${fieldNames[field]} ditandai ${nextVal ? 'SUDAH' : 'BELUM'}`);
    } else {
      showToast(`Gagal memperbarui status unit: ${res.error || 'Terjadi kesalahan'}`);
    }
  };

  // Handle Checklist Kebersihan Operasional
  const handleToggleCleaning = async (item: CleaningChecklistItem) => {
    const nextClean = !item.isClean;
    const res = await toggleCleaningChecklist(
      item.id,
      nextClean,
      currentUser?.name || 'Staf Operasional',
      item.notes
    );
    if (res.success) {
      showToast(`✓ Area "${item.areaName}" ditandai: ${nextClean ? 'BERSIH' : 'BELUM BERSIH'}`);
    }
  };

  // Handle Tambah Stok Konten
  const handleSaveContent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contentForm.title.trim()) {
      alert('Mohon isi judul konten!');
      return;
    }
    const res = await addContentStock({
      ...contentForm,
      creatorName: currentUser?.name || 'Konten Kreator HR MOTOR',
    });
    if (res.success) {
      showToast(`✓ Stok konten "${contentForm.title}" berhasil ditambahkan!`);
      setIsAddContentOpen(false);
      setContentForm({
        title: '',
        platform: 'TikTok',
        category: 'Review Unit',
        vehicleModel: '',
        status: 'Draf',
        targetPublishDate: new Date().toISOString().split('T')[0],
        notes: '',
        videoUrl: '',
      });
    } else {
      showToast(`Gagal menambahkan konten: ${res.error}`);
    }
  };

  // Handle Hapus Konten
  const handleDeleteContent = async (id: string, title: string) => {
    if (confirm(`Yakin ingin menghapus stok konten "${title}"?`)) {
      const res = await deleteContentStock(id);
      if (res.success) {
        showToast(`✓ Konten berhasil dihapus`);
      }
    }
  };

  // Handle Tambah Kas Keuangan
  const handleSaveCashFlow = async (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = parseInt(cashFlowForm.amount.replace(/\D/g, ''), 10);
    if (!amountNum || isNaN(amountNum)) {
      alert('Nominal uang tidak valid!');
      return;
    }
    const res = await addCashFlow({
      type: cashFlowForm.type,
      category: cashFlowForm.category,
      amount: amountNum,
      description: cashFlowForm.description || `Pencatatan kas oleh ${currentUser?.name || 'Staf Keuangan'}`,
      date: cashFlowForm.date,
    });
    if (res.success) {
      showToast(`✓ Berhasil mencatat kas: ${formatRupiah(amountNum)}`);
      setIsAddCashFlowOpen(false);
      setCashFlowForm({
        type: 'out',
        category: 'Operasional Showroom',
        amount: '',
        description: '',
        date: new Date().toISOString().split('T')[0],
      });
    } else {
      showToast(`Gagal mencatat arus kas: ${res.error}`);
    }
  };

  // Helper WhatsApp direct chat untuk Admin Layanan Pelanggan
  const openWhatsApp = (contactNumber: string, customerName: string, interestedVehicle?: string) => {
    const cleanNum = contactNumber.replace(/\D/g, '');
    const intlPhone = cleanNum.startsWith('0') ? '62' + cleanNum.substring(1) : cleanNum;
    const greeting = `Halo Kak ${customerName}, saya ${currentUser?.name || 'Admin'} dari HR MOTOR Garut. Menindaklanjuti ketertarikan Kakak terhadap unit ${
      interestedVehicle || 'mobil showroom kami'
    }, apakah ada informasi spesifikasi, simulasi cicilan, atau jadwal test drive yang ingin kami bantu jelaskan?`;
    window.open(`https://wa.me/${intlPhone}?text=${encodeURIComponent(greeting)}`, '_blank');
  };

  // Logika Menentukan Tampilan Berdasarkan Peran & Jobdesk Pengguna
  const hasTeknisi = isOwner || userJobdesks.includes('Teknisi Otomotif');
  const hasOperasional = isOwner || userJobdesks.includes('Staf Operasional Showroom');
  const hasKeuangan = isOwner || userJobdesks.includes('Staf Administrasi Keuangan');
  const hasKonten = isOwner || userJobdesks.includes('Konten Kreator');
  const hasAdminWa =
    isOwner ||
    userJobdesks.includes('Admin Layanan Pelanggan') ||
    userJobdesks.includes('WhatsApp Administrator') ||
    userJobdesks.includes('CRM Administrator') ||
    userJobdesks.includes('Sales Representative');
  const hasHostLive = isOwner || userJobdesks.includes('Host Live');

  // Daftar Jobdesk yang dimiliki user untuk Tab Switcher
  const availableTabs = useMemo(() => {
    const list: { id: string; label: string; icon: React.ComponentType<{ className?: string }>; count?: number }[] = [];
    if (hasTeknisi) {
      list.push({ id: 'Teknisi Otomotif', label: 'Teknisi Otomotif', icon: Wrench, count: techUnrepairedCount });
    }
    if (hasOperasional) {
      list.push({ id: 'Staf Operasional Showroom', label: 'Staf Operasional', icon: Sparkles, count: cleanTotalCount - cleanFinishedCount });
    }
    if (hasKeuangan) {
      list.push({ id: 'Staf Administrasi Keuangan', label: 'Admin Keuangan', icon: Landmark });
    }
    if (hasKonten) {
      list.push({ id: 'Konten Kreator', label: 'Konten Kreator', icon: Video, count: contentReadyCount + contentDraftCount });
    }
    if (hasAdminWa) {
      list.push({ id: 'Admin Layanan Pelanggan', label: 'Admin Layanan / WA', icon: MessageCircle, count: pendingFollowUps.length });
    }
    if (hasHostLive) {
      list.push({ id: 'Host Live', label: 'Host Live', icon: Radio });
    }
    return list;
  }, [
    hasTeknisi,
    hasOperasional,
    hasKeuangan,
    hasKonten,
    hasAdminWa,
    hasHostLive,
    techUnrepairedCount,
    cleanTotalCount,
    cleanFinishedCount,
    contentReadyCount,
    contentDraftCount,
    pendingFollowUps.length,
  ]);

  const hasMultipleJobdesks = availableTabs.length > 1;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 pb-28 lg:pb-12 text-charcoal-900">
      {/* Toast Feedback */}
      {toastMessage && (
        <div className="fixed bottom-20 right-4 lg:bottom-8 lg:right-8 z-50 bg-charcoal-900 text-white text-sm font-semibold px-4 py-3 rounded-xl shadow-xl flex items-center gap-2 border border-gold-500/40 animate-in fade-in slide-in-from-bottom-3 duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Halaman Tugas Saya */}
      <div className="bg-[#FAF9F5] border border-[#EAE8E3] rounded-3xl p-5 sm:p-7 shadow-xs relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-gold-500 via-amber-400 to-gold-600" />
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-gold-100 text-gold-950 border border-gold-300 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-gold-600 animate-pulse" />
                Pusat Tugas Personal
              </span>
              <span className="text-xs text-charcoal-500">
                {new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-charcoal-950">
              Tugas Saya &amp; Monitoring Showroom
            </h1>
            <p className="text-sm text-charcoal-600 mt-1 max-w-2xl">
              Workspace tugas terintegrasi sesuai tanggung jawab Anda: Teknisi perbaikan mobil, checklist kebersihan showroom, pembukuan kas, stok konten, dan CRM follow-up prospek.
            </p>
          </div>

          {/* User Profile Badge & Multi-Jobdesk Pill */}
          <div className="flex items-center gap-3 bg-white border border-[#EAE8E3] rounded-2xl p-3 shadow-2xs self-start sm:self-center shrink-0">
            {currentUser?.avatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={currentUser.avatar}
                alt={currentUser.name}
                className="w-11 h-11 rounded-full object-cover aspect-square border-2 border-gold-500/80 shadow-xs"
              />
            ) : (
              <div className="w-11 h-11 rounded-full bg-gold-100 border-2 border-gold-400 flex items-center justify-center font-bold text-gold-950">
                {currentUser?.name?.charAt(0) || 'U'}
              </div>
            )}
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="text-sm font-bold text-charcoal-950 leading-tight">{currentUser?.name || 'Pengguna'}</h3>
                {isOwner && (
                  <span className="text-[10px] font-black uppercase px-1.5 py-0.2 rounded bg-amber-100 text-amber-900 border border-amber-300">
                    Owner
                  </span>
                )}
              </div>
              <div className="flex flex-wrap gap-1 mt-1">
                {userJobdesks.map((jb) => (
                  <span
                    key={jb}
                    className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-charcoal-100 text-charcoal-800 border border-charcoal-200"
                  >
                    {jb}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Tab Switcher jika Pengguna Memiliki > 1 Jobdesk atau Owner */}
        {hasMultipleJobdesks && (
          <div className="mt-6 pt-5 border-t border-[#EAE8E3] flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-charcoal-600 mr-1 flex items-center gap-1">
              <Layers className="w-3.5 h-3.5 text-gold-600" />
              Tampilan Tugas:
            </span>

            <button
              type="button"
              onClick={() => setActiveTab('ALL')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'ALL'
                  ? 'bg-gold-500 text-charcoal-950 shadow-xs font-extrabold ring-1 ring-gold-600'
                  : 'bg-white text-charcoal-700 border border-[#EAE8E3] hover:bg-gold-50 hover:text-charcoal-950'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Semua Tugas Saya ({availableTabs.length} Peran)</span>
            </button>

            {availableTabs.map((tab) => {
              const TabIcon = tab.icon;
              const isSelected = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    isSelected
                      ? 'bg-charcoal-900 text-white shadow-xs font-extrabold ring-1 ring-charcoal-950'
                      : 'bg-white text-charcoal-700 border border-[#EAE8E3] hover:bg-[#FAF9F5] hover:text-charcoal-950'
                  }`}
                >
                  <TabIcon className={`w-3.5 h-3.5 ${isSelected ? 'text-gold-400' : 'text-charcoal-500'}`} />
                  <span>{tab.label}</span>
                  {tab.count !== undefined && tab.count > 0 && (
                    <span
                      className={`text-[10px] font-black px-1.5 py-0.2 rounded-full ${
                        isSelected ? 'bg-gold-500 text-charcoal-950' : 'bg-gold-100 text-gold-950 border border-gold-300'
                      }`}
                    >
                      {tab.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 1. SEKSI TUGAS: TEKNISI OTOMOTIF                                          */}
      {/* ========================================================================= */}
      {hasTeknisi && (activeTab === 'ALL' || activeTab === 'Teknisi Otomotif') && (
        <section className="bg-white border border-[#EAE8E3] rounded-3xl p-5 sm:p-7 shadow-xs space-y-6">
          {/* Header Modul Teknisi */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#EAE8E3]">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-100 border border-amber-300 flex items-center justify-center text-amber-900 shrink-0">
                <Wrench className="w-6 h-6 text-amber-800" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold text-charcoal-950">Tugas Teknisi Otomotif</h2>
                  <span className="text-xs font-extrabold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300">
                    {techUnrepairedCount} Mobil Butuh Perbaikan
                  </span>
                </div>
                <p className="text-xs text-charcoal-500 mt-0.5">
                  Centang unit yang sudah selesai perbaikan mesin, pengecatan body, salon detailing, atau foto display.
                </p>
              </div>
            </div>

            <Link
              href="/riwayat-perbaikan"
              className="text-xs font-bold text-charcoal-700 bg-[#FAF9F5] border border-[#EAE8E3] px-3.5 py-2 rounded-xl hover:border-gold-400 hover:text-charcoal-950 transition-all flex items-center gap-1.5 self-start sm:self-center"
            >
              <Eye className="w-3.5 h-3.5 text-gold-600" />
              Lihat Riwayat Servis Garansi
            </Link>
          </div>

          {/* Quick Metrics Teknisi */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <button
              type="button"
              onClick={() => setTechFilter('UNREPAIRED')}
              className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                techFilter === 'UNREPAIRED'
                  ? 'bg-amber-500/10 border-amber-400 ring-1 ring-amber-400'
                  : 'bg-[#FAF9F5] border-[#EAE8E3] hover:border-amber-300'
              }`}
            >
              <div className="flex items-center justify-between text-xs text-charcoal-600 mb-1">
                <span>Belum Perbaikan</span>
                <Wrench className="w-4 h-4 text-amber-700" />
              </div>
              <p className="text-2xl font-extrabold text-charcoal-950">{techUnrepairedCount}</p>
              <span className="text-[10px] text-amber-800 font-bold">Mesin / Kaki-kaki</span>
            </button>

            <button
              type="button"
              onClick={() => setTechFilter('UNPAINTED')}
              className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                techFilter === 'UNPAINTED'
                  ? 'bg-orange-500/10 border-orange-400 ring-1 ring-orange-400'
                  : 'bg-[#FAF9F5] border-[#EAE8E3] hover:border-orange-300'
              }`}
            >
              <div className="flex items-center justify-between text-xs text-charcoal-600 mb-1">
                <span>Belum Cat Body</span>
                <Sparkles className="w-4 h-4 text-orange-600" />
              </div>
              <p className="text-2xl font-extrabold text-charcoal-950">{techUnpaintedCount}</p>
              <span className="text-[10px] text-orange-700 font-bold">Baret / Bumper</span>
            </button>

            <button
              type="button"
              onClick={() => setTechFilter('UNDETAILED')}
              className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                techFilter === 'UNDETAILED'
                  ? 'bg-teal-500/10 border-teal-400 ring-1 ring-teal-400'
                  : 'bg-[#FAF9F5] border-[#EAE8E3] hover:border-teal-300'
              }`}
            >
              <div className="flex items-center justify-between text-xs text-charcoal-600 mb-1">
                <span>Belum Salon</span>
                <Layers className="w-4 h-4 text-teal-600" />
              </div>
              <p className="text-2xl font-extrabold text-charcoal-950">{techUndetailedCount}</p>
              <span className="text-[10px] text-teal-700 font-bold">Cuci Jamur &amp; Poles</span>
            </button>

            <button
              type="button"
              onClick={() => setTechFilter('DONE')}
              className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                techFilter === 'DONE'
                  ? 'bg-emerald-500/10 border-emerald-400 ring-1 ring-emerald-400'
                  : 'bg-[#FAF9F5] border-[#EAE8E3] hover:border-emerald-300'
              }`}
            >
              <div className="flex items-center justify-between text-xs text-charcoal-600 mb-1">
                <span>Siap Jual Penuh</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              </div>
              <p className="text-2xl font-extrabold text-charcoal-950">{techDoneCount}</p>
              <span className="text-[10px] text-emerald-700 font-bold">Lengkap 4 Centang</span>
            </button>
          </div>

          {/* Search Bar & Filter Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-charcoal-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Cari unit mobil atau plat nomor..."
                value={techSearch}
                onChange={(e) => setTechSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-[#FAF9F5] border border-[#EAE8E3] rounded-xl text-xs focus:outline-hidden focus:border-gold-500 focus:bg-white"
              />
              {techSearch && (
                <button
                  type="button"
                  onClick={() => setTechSearch('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-charcoal-400 hover:text-charcoal-700 text-xs"
                >
                  ✕
                </button>
              )}
            </div>

            <div className="flex flex-wrap gap-1.5 self-start sm:self-auto">
              <button
                type="button"
                onClick={() => setTechFilter('ALL')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  techFilter === 'ALL'
                    ? 'bg-charcoal-900 text-white'
                    : 'bg-[#FAF9F5] text-charcoal-700 border border-[#EAE8E3] hover:bg-white'
                }`}
              >
                Semua Unit ({stocks?.length || 0})
              </button>
              <button
                type="button"
                onClick={() => setTechFilter('UNREPAIRED')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  techFilter === 'UNREPAIRED'
                    ? 'bg-amber-600 text-white'
                    : 'bg-[#FAF9F5] text-amber-900 border border-amber-200 hover:bg-white'
                }`}
              >
                Belum Perbaikan ({techUnrepairedCount})
              </button>
              <button
                type="button"
                onClick={() => setTechFilter('UNPHOTOGRAPHED')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  techFilter === 'UNPHOTOGRAPHED'
                    ? 'bg-blue-600 text-white'
                    : 'bg-[#FAF9F5] text-blue-900 border border-blue-200 hover:bg-white'
                }`}
              >
                Belum Foto ({techUnphotographedCount})
              </button>
            </div>
          </div>

          {/* Tabel / Kartu Mobil Teknisi */}
          {filteredTechStocks.length === 0 ? (
            <div className="p-8 text-center bg-[#FAF9F5] border border-dashed border-[#EAE8E3] rounded-2xl">
              <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2 opacity-80" />
              <h4 className="text-sm font-bold text-charcoal-900">Tidak ada mobil dalam kriteria ini</h4>
              <p className="text-xs text-charcoal-500 mt-0.5">Semua perbaikan unit terpantau rapi dan sesuai standar showroom.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredTechStocks.map((car) => {
                const isFullyReady = car.isRepaired && car.isPainted && car.isDetailed && car.isPhotographed;
                const plate = car.plateNumber || car.licensePlate || 'Plat Garut';
                return (
                  <div
                    key={car.id}
                    className={`p-4 rounded-2xl border transition-all ${
                      isFullyReady
                        ? 'bg-[#FAF9F5]/70 border-[#EAE8E3] opacity-80 hover:opacity-100'
                        : 'bg-white border-[#EAE8E3] shadow-xs hover:border-gold-400'
                    }`}
                  >
                    <div className="flex gap-3.5 items-start">
                      {/* Car Thumbnail */}
                      <div className="relative w-24 h-20 rounded-xl overflow-hidden bg-charcoal-100 shrink-0 border border-[#EAE8E3]">
                        {car.images && car.images[0] ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={car.images[0]}
                            alt={car.model}
                            className="w-full h-full object-cover"
                          />
                        ) : car.photos && car.photos[0] ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={car.photos[0]}
                            alt={car.model}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-charcoal-400">
                            <Car className="w-8 h-8" />
                          </div>
                        )}
                        <span className="absolute bottom-1 left-1 text-[9px] font-black px-1.5 py-0.2 rounded bg-charcoal-900/80 text-white backdrop-blur-xs">
                          {car.year}
                        </span>
                      </div>

                      {/* Car Info */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-charcoal-100 text-charcoal-800 border border-charcoal-200">
                            {plate}
                          </span>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              car.status === 'Tersedia'
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                : 'bg-charcoal-100 text-charcoal-700'
                            }`}
                          >
                            {car.status}
                          </span>
                        </div>

                        <h4 className="text-sm font-bold text-charcoal-950 mt-1 truncate">
                          {car.brand} {car.model}
                        </h4>

                        <div className="flex items-center gap-2 text-[11px] text-charcoal-500 mt-0.5">
                          <span>{car.transmission}</span>
                          <span>•</span>
                          <span>{car.color}</span>
                          <span>•</span>
                          <span>{(car.mileage || car.mileageKm || 0).toLocaleString('id-ID')} KM</span>
                        </div>
                      </div>
                    </div>

                    {/* Checkbox Group Readiness Showroom */}
                    <div className="mt-4 pt-3 border-t border-[#EAE8E3] grid grid-cols-2 gap-2 text-xs">
                      {/* 1. SUDAH PERBAIKAN */}
                      <button
                        type="button"
                        onClick={() => handleToggleTechReadiness(car, 'isRepaired', !!car.isRepaired)}
                        className={`p-2 rounded-xl border flex items-center justify-between gap-2 transition-all cursor-pointer ${
                          car.isRepaired
                            ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                            : 'bg-[#FFFDF7] border-amber-300 text-amber-950 font-semibold hover:bg-amber-50'
                        }`}
                      >
                        <div className="flex items-center gap-1.5 min-w-0">
                          <Wrench className="w-3.5 h-3.5 shrink-0 text-amber-700" />
                          <span className="truncate">Perbaikan Mesin</span>
                        </div>
                        <span
                          className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 text-xs font-bold ${
                            car.isRepaired ? 'bg-emerald-600 text-white' : 'border border-amber-400 bg-white'
                          }`}
                        >
                          {car.isRepaired ? '✓' : ''}
                        </span>
                      </button>

                      {/* 2. SUDAH CAT */}
                      <button
                        type="button"
                        onClick={() => handleToggleTechReadiness(car, 'isPainted', !!car.isPainted)}
                        className={`p-2 rounded-xl border flex items-center justify-between gap-2 transition-all cursor-pointer ${
                          car.isPainted
                            ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                            : 'bg-[#FFFDF7] border-orange-300 text-orange-950 font-semibold hover:bg-orange-50'
                        }`}
                      >
                        <div className="flex items-center gap-1.5 min-w-0">
                          <Sparkles className="w-3.5 h-3.5 shrink-0 text-orange-600" />
                          <span className="truncate">Cat Body</span>
                        </div>
                        <span
                          className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 text-xs font-bold ${
                            car.isPainted ? 'bg-emerald-600 text-white' : 'border border-orange-400 bg-white'
                          }`}
                        >
                          {car.isPainted ? '✓' : ''}
                        </span>
                      </button>

                      {/* 3. SUDAH SALON */}
                      <button
                        type="button"
                        onClick={() => handleToggleTechReadiness(car, 'isDetailed', !!car.isDetailed)}
                        className={`p-2 rounded-xl border flex items-center justify-between gap-2 transition-all cursor-pointer ${
                          car.isDetailed
                            ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                            : 'bg-[#FFFDF7] border-teal-300 text-teal-950 font-semibold hover:bg-teal-50'
                        }`}
                      >
                        <div className="flex items-center gap-1.5 min-w-0">
                          <Layers className="w-3.5 h-3.5 shrink-0 text-teal-600" />
                          <span className="truncate">Salon &amp; Poles</span>
                        </div>
                        <span
                          className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 text-xs font-bold ${
                            car.isDetailed ? 'bg-emerald-600 text-white' : 'border border-teal-400 bg-white'
                          }`}
                        >
                          {car.isDetailed ? '✓' : ''}
                        </span>
                      </button>

                      {/* 4. SUDAH FOTO */}
                      <button
                        type="button"
                        onClick={() => handleToggleTechReadiness(car, 'isPhotographed', !!car.isPhotographed)}
                        className={`p-2 rounded-xl border flex items-center justify-between gap-2 transition-all cursor-pointer ${
                          car.isPhotographed
                            ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                            : 'bg-[#FFFDF7] border-blue-300 text-blue-950 font-semibold hover:bg-blue-50'
                        }`}
                      >
                        <div className="flex items-center gap-1.5 min-w-0">
                          <Camera className="w-3.5 h-3.5 shrink-0 text-blue-600" />
                          <span className="truncate">Foto Display</span>
                        </div>
                        <span
                          className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 text-xs font-bold ${
                            car.isPhotographed ? 'bg-emerald-600 text-white' : 'border border-blue-400 bg-white'
                          }`}
                        >
                          {car.isPhotographed ? '✓' : ''}
                        </span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      )}

      {/* ========================================================================= */}
      {/* 2. SEKSI TUGAS: STAF OPERASIONAL SHOWROOM (MONITORING KEBERSIHAN)         */}
      {/* ========================================================================= */}
      {hasOperasional && (activeTab === 'ALL' || activeTab === 'Staf Operasional Showroom') && (
        <section className="bg-white border border-[#EAE8E3] rounded-3xl p-5 sm:p-7 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#EAE8E3]">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-teal-100 border border-teal-300 flex items-center justify-center text-teal-900 shrink-0">
                <Sparkles className="w-6 h-6 text-teal-800" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold text-charcoal-950">Monitoring Kebersihan Showroom</h2>
                  <span className="text-xs font-extrabold px-2.5 py-0.5 rounded-full bg-teal-100 text-teal-900 border border-teal-300">
                    {cleanFinishedCount} / {cleanTotalCount} Area Selesai ({cleanPercentage}%)
                  </span>
                </div>
                <p className="text-xs text-charcoal-500 mt-0.5">
                  Checklist harian staf operasional: kebersihan lantai display, kaca mobil, toilet tamu, dan kerapihan showroom.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={async () => {
                if (confirm('Mulai checklist hari baru? Semua status kebersihan akan di-reset untuk diisi kembali hari ini.')) {
                  await resetDailyCleaningChecklist();
                  showToast('✓ Checklist harian berhasil di-reset untuk hari baru');
                }
              }}
              className="text-xs font-bold text-charcoal-700 bg-[#FAF9F5] border border-[#EAE8E3] px-3.5 py-2 rounded-xl hover:border-gold-400 hover:text-charcoal-950 transition-all flex items-center gap-1.5 self-start sm:self-center cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5 text-gold-600" />
              Mulai Checklist Hari Baru
            </button>
          </div>

          {/* Progress Bar Kebersihan */}
          <div className="bg-[#FAF9F5] border border-[#EAE8E3] rounded-2xl p-4">
            <div className="flex items-center justify-between text-xs font-bold text-charcoal-800 mb-2">
              <span>Progres Standar Kebersihan Showroom HR Motor</span>
              <span className="text-teal-800 font-extrabold">{cleanPercentage}% Bersih</span>
            </div>
            <div className="w-full h-3 bg-charcoal-100 rounded-full overflow-hidden border border-[#DDD9CF]">
              <div
                className="h-full bg-gradient-to-r from-teal-500 via-emerald-500 to-gold-500 rounded-full transition-all duration-500"
                style={{ width: `${cleanPercentage}%` }}
              />
            </div>
          </div>

          {/* Filter Bar Operasional */}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setCleaningFilter('ALL')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                cleaningFilter === 'ALL'
                  ? 'bg-charcoal-900 text-white'
                  : 'bg-[#FAF9F5] text-charcoal-700 border border-[#EAE8E3]'
              }`}
            >
              Semua Area ({cleanTotalCount})
            </button>
            <button
              type="button"
              onClick={() => setCleaningFilter('UNFINISHED')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                cleaningFilter === 'UNFINISHED'
                  ? 'bg-amber-600 text-white'
                  : 'bg-[#FAF9F5] text-amber-900 border border-amber-200'
              }`}
            >
              Belum Dibersihkan ({cleanTotalCount - cleanFinishedCount})
            </button>
            <button
              type="button"
              onClick={() => setCleaningFilter('FINISHED')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                cleaningFilter === 'FINISHED'
                  ? 'bg-teal-600 text-white'
                  : 'bg-[#FAF9F5] text-teal-900 border border-teal-200'
              }`}
            >
              Sudah Bersih ({cleanFinishedCount})
            </button>
          </div>

          {/* Checklist Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {filteredCleaningList.map((item) => (
              <div
                key={item.id}
                onClick={() => handleToggleCleaning(item)}
                className={`p-4 rounded-2xl border transition-all cursor-pointer select-none flex items-start justify-between gap-3 ${
                  item.isClean
                    ? 'bg-emerald-50/60 border-emerald-300 hover:border-emerald-400'
                    : 'bg-[#FAF9F5] border-[#EAE8E3] hover:border-gold-400 hover:bg-white'
                }`}
              >
                <div className="space-y-1 min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-bold text-charcoal-950">{item.areaName}</h4>
                    {item.isClean ? (
                      <span className="text-[10px] font-bold px-2 py-0.2 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                        Bersih ✓
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold px-2 py-0.2 rounded-full bg-amber-100 text-amber-900 border border-amber-300">
                        Belum
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-charcoal-600">{item.description}</p>

                  {item.isClean && item.cleanedAt && (
                    <div className="flex items-center gap-2 text-[10px] text-emerald-800 font-medium pt-1">
                      <Clock className="w-3 h-3" />
                      <span>
                        Dibersihkan oleh {item.cleanedBy || 'Staf Operasional'} pada{' '}
                        {new Date(item.cleanedAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB
                      </span>
                    </div>
                  )}

                  {item.notes && (
                    <p className="text-[11px] text-charcoal-500 italic pt-0.5">Catatan: &ldquo;{item.notes}&rdquo;</p>
                  )}
                </div>

                <div
                  className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 border transition-all mt-0.5 ${
                    item.isClean
                      ? 'bg-emerald-600 border-emerald-700 text-white shadow-xs'
                      : 'border-charcoal-300 bg-white'
                  }`}
                >
                  {item.isClean && <Check className="w-4 h-4 stroke-[3]" />}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ========================================================================= */}
      {/* 3. SEKSI TUGAS: STAF ADMINISTRASI KEUANGAN (PEMBUKUAN & KAS SHOWROOM)     */}
      {/* ========================================================================= */}
      {hasKeuangan && (activeTab === 'ALL' || activeTab === 'Staf Administrasi Keuangan') && (
        <section className="bg-white border border-[#EAE8E3] rounded-3xl p-5 sm:p-7 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#EAE8E3]">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 border border-emerald-300 flex items-center justify-center text-emerald-900 shrink-0">
                <Landmark className="w-6 h-6 text-emerald-800" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold text-charcoal-950">Keuangan &amp; Pembukuan Showroom</h2>
                  <span className="text-xs font-extrabold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300">
                    Khusus Staf Keuangan &amp; Owner
                  </span>
                </div>
                <p className="text-xs text-charcoal-500 mt-0.5">
                  Pencatatan kas masuk/keluar, data 436 unit Google Sheets, komisi staf, dan arus kas harian HR MOTOR.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-center">
              <button
                type="button"
                onClick={() => setIsAddCashFlowOpen(true)}
                className="text-xs font-bold text-charcoal-950 bg-gold-500 hover:bg-gold-400 px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                Catat Arus Kas
              </button>

              <Link
                href="/keuangan"
                className="text-xs font-bold text-charcoal-700 bg-[#FAF9F5] border border-[#EAE8E3] px-3.5 py-2 rounded-xl hover:border-gold-400 hover:text-charcoal-950 transition-all flex items-center gap-1.5"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                Buka Pembukuan Lengkap (436 Unit)
              </Link>
            </div>
          </div>

          {/* Quick Metrics Keuangan */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200">
              <div className="flex items-center justify-between text-xs text-emerald-800 mb-1 font-bold">
                <span>Total Kas Masuk Showroom</span>
                <TrendingUp className="w-4 h-4 text-emerald-600" />
              </div>
              <p className="text-xl sm:text-2xl font-extrabold text-charcoal-950">{formatRupiah(cashInTotal)}</p>
              <span className="text-[11px] text-emerald-700">Pelunasan unit, booking fee &amp; DP</span>
            </div>

            <div className="p-4 rounded-2xl bg-rose-50/60 border border-rose-200">
              <div className="flex items-center justify-between text-xs text-rose-800 mb-1 font-bold">
                <span>Total Kas Keluar Operasional</span>
                <TrendingDown className="w-4 h-4 text-rose-600" />
              </div>
              <p className="text-xl sm:text-2xl font-extrabold text-charcoal-950">{formatRupiah(cashOutTotal)}</p>
              <span className="text-[11px] text-rose-700">Biaya servis unit, operasional &amp; belanja</span>
            </div>

            <div className="p-4 rounded-2xl bg-gold-50/70 border border-gold-300">
              <div className="flex items-center justify-between text-xs text-gold-900 mb-1 font-bold">
                <span>Saldo Kas Aktif HR MOTOR</span>
                <DollarSign className="w-4 h-4 text-gold-700" />
              </div>
              <p className="text-xl sm:text-2xl font-extrabold text-charcoal-950">{formatRupiah(currentCashBalance)}</p>
              <span className="text-[11px] text-gold-800 font-semibold">Kas likuid tersimpan di showroom</span>
            </div>
          </div>

          {/* Tabel Ringkasan Transaksi Arus Kas Terkini */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-charcoal-500">
                Catatan Arus Kas Terkini ({cashFlow?.length || 0} Transaksi)
              </h4>
              <Link href="/keuangan" className="text-xs text-gold-700 hover:text-gold-900 font-bold flex items-center gap-1">
                Lihat Seluruh Laporan <ExternalLink className="w-3 h-3" />
              </Link>
            </div>

            <div className="overflow-x-auto border border-[#EAE8E3] rounded-2xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#FAF9F5] text-charcoal-600 font-bold border-b border-[#EAE8E3]">
                  <tr>
                    <th className="py-2.5 px-3">Tanggal</th>
                    <th className="py-2.5 px-3">Jenis &amp; Kategori</th>
                    <th className="py-2.5 px-3">Keterangan</th>
                    <th className="py-2.5 px-3 text-right">Nominal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EAE8E3]">
                  {(cashFlow || []).slice(0, 6).map((item) => (
                    <tr key={item.id} className="hover:bg-[#FAF9F5] transition-colors">
                      <td className="py-2.5 px-3 text-charcoal-500 whitespace-nowrap">{item.date}</td>
                      <td className="py-2.5 px-3">
                        <span
                          className={`font-bold px-2 py-0.5 rounded-full text-[10px] mr-1.5 ${
                            item.type === 'in'
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                              : 'bg-rose-100 text-rose-800 border border-rose-300'
                          }`}
                        >
                          {item.type === 'in' ? 'Kas Masuk' : 'Kas Keluar'}
                        </span>
                        <span className="text-charcoal-800 font-semibold">{item.category}</span>
                      </td>
                      <td className="py-2.5 px-3 text-charcoal-600">{item.description}</td>
                      <td
                        className={`py-2.5 px-3 text-right font-bold whitespace-nowrap ${
                          item.type === 'in' ? 'text-emerald-700' : 'text-rose-700'
                        }`}
                      >
                        {item.type === 'in' ? '+' : '-'} {formatRupiah(item.amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}

      {/* ========================================================================= */}
      {/* 4. SEKSI TUGAS: KONTEN KREATOR SHOWROOM                                   */}
      {/* ========================================================================= */}
      {hasKonten && (activeTab === 'ALL' || activeTab === 'Konten Kreator') && (
        <section className="bg-white border border-[#EAE8E3] rounded-3xl p-5 sm:p-7 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#EAE8E3]">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-purple-100 border border-purple-300 flex items-center justify-center text-purple-900 shrink-0">
                <Video className="w-6 h-6 text-purple-800" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold text-charcoal-950">Stok Konten Kreator Showroom</h2>
                  <span className="text-xs font-extrabold px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-900 border border-purple-300">
                    {contentStocks?.length || 0} Stok Video Terdaftar
                  </span>
                </div>
                <p className="text-xs text-charcoal-500 mt-0.5">
                  Input dan monitor persediaan stok konten: TikTok, Instagram Reels, YouTube Shorts, dan Facebook Video HR MOTOR.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsAddContentOpen(true)}
              className="text-xs font-bold text-charcoal-950 bg-gold-500 hover:bg-gold-400 px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5 shadow-xs self-start sm:self-center cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              + Masukkan Stok Konten Baru
            </button>
          </div>

          {/* Metrics Konten */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <button
              type="button"
              onClick={() => setContentFilter('ALL')}
              className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                contentFilter === 'ALL'
                  ? 'bg-purple-500/10 border-purple-400 ring-1 ring-purple-400'
                  : 'bg-[#FAF9F5] border-[#EAE8E3]'
              }`}
            >
              <div className="flex items-center justify-between text-xs text-charcoal-600 mb-1">
                <span>Total Stok Konten</span>
                <Video className="w-4 h-4 text-purple-600" />
              </div>
              <p className="text-2xl font-extrabold text-charcoal-950">{contentStocks?.length || 0}</p>
              <span className="text-[10px] text-purple-700 font-bold">Semua Platform</span>
            </button>

            <button
              type="button"
              onClick={() => setContentFilter('Siap Tayang')}
              className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                contentFilter === 'Siap Tayang'
                  ? 'bg-emerald-500/10 border-emerald-400 ring-1 ring-emerald-400'
                  : 'bg-[#FAF9F5] border-[#EAE8E3]'
              }`}
            >
              <div className="flex items-center justify-between text-xs text-charcoal-600 mb-1">
                <span>Siap Tayang</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              </div>
              <p className="text-2xl font-extrabold text-charcoal-950">{contentReadyCount}</p>
              <span className="text-[10px] text-emerald-700 font-bold">Sudah Edit &amp; Render</span>
            </button>

            <button
              type="button"
              onClick={() => setContentFilter('Draf')}
              className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                contentFilter === 'Draf'
                  ? 'bg-amber-500/10 border-amber-400 ring-1 ring-amber-400'
                  : 'bg-[#FAF9F5] border-[#EAE8E3]'
              }`}
            >
              <div className="flex items-center justify-between text-xs text-charcoal-600 mb-1">
                <span>Draf / Proses Edit</span>
                <Clock className="w-4 h-4 text-amber-600" />
              </div>
              <p className="text-2xl font-extrabold text-charcoal-950">{contentDraftCount}</p>
              <span className="text-[10px] text-amber-700 font-bold">Take / Audio / Script</span>
            </button>

            <button
              type="button"
              onClick={() => setContentFilter('Sudah Tayang')}
              className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                contentFilter === 'Sudah Tayang'
                  ? 'bg-blue-500/10 border-blue-400 ring-1 ring-blue-400'
                  : 'bg-[#FAF9F5] border-[#EAE8E3]'
              }`}
            >
              <div className="flex items-center justify-between text-xs text-charcoal-600 mb-1">
                <span>Sudah Tayang</span>
                <Send className="w-4 h-4 text-blue-600" />
              </div>
              <p className="text-2xl font-extrabold text-charcoal-950">{contentPublishedCount}</p>
              <span className="text-[10px] text-blue-700 font-bold">Publish di Medsos</span>
            </button>
          </div>

          {/* Content Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {filteredContentStocks.map((item) => (
              <div
                key={item.id}
                className="p-4 rounded-2xl border border-[#EAE8E3] bg-[#FAF9F5] hover:bg-white hover:border-gold-400 transition-all shadow-xs flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span
                      className={`text-[10px] font-black px-2 py-0.5 rounded-md ${
                        item.platform === 'TikTok'
                          ? 'bg-charcoal-950 text-white'
                          : item.platform === 'Instagram Reels'
                          ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white'
                          : item.platform === 'YouTube Shorts'
                          ? 'bg-red-600 text-white'
                          : 'bg-blue-600 text-white'
                      }`}
                    >
                      {item.platform}
                    </span>

                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        item.status === 'Siap Tayang'
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          : item.status === 'Sudah Tayang'
                          ? 'bg-blue-100 text-blue-800 border border-blue-300'
                          : 'bg-amber-100 text-amber-900 border border-amber-300'
                      }`}
                    >
                      {item.status}
                    </span>
                  </div>

                  <h4 className="text-sm font-bold text-charcoal-950 line-clamp-2 leading-snug">{item.title}</h4>

                  <div className="mt-2 space-y-1 text-xs text-charcoal-600">
                    <div className="flex items-center gap-1.5">
                      <Tag className="w-3.5 h-3.5 text-gold-600 shrink-0" />
                      <span className="font-semibold text-charcoal-800">{item.category}</span>
                      {item.vehicleModel && <span className="text-charcoal-500">• {item.vehicleModel}</span>}
                    </div>

                    {item.targetPublishDate && (
                      <div className="flex items-center gap-1.5 text-charcoal-500">
                        <Calendar className="w-3.5 h-3.5 text-charcoal-400 shrink-0" />
                        <span>Rencana Tayang: {item.targetPublishDate}</span>
                      </div>
                    )}

                    {item.notes && (
                      <p className="text-[11px] text-charcoal-500 bg-white border border-[#EAE8E3] rounded-lg p-2 mt-2 italic">
                        {item.notes}
                      </p>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="mt-4 pt-3 border-t border-[#EAE8E3] flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    {item.status !== 'Sudah Tayang' && (
                      <button
                        type="button"
                        onClick={async () => {
                          await updateContentStock({ id: item.id, status: 'Sudah Tayang' });
                          showToast(`✓ Konten "${item.title}" ditandai SUDAH TAYANG!`);
                        }}
                        className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition-all cursor-pointer"
                      >
                        ✓ Tandai Tayang
                      </button>
                    )}
                    {item.status === 'Draf' && (
                      <button
                        type="button"
                        onClick={async () => {
                          await updateContentStock({ id: item.id, status: 'Siap Tayang' });
                          showToast(`✓ Konten siap diposting!`);
                        }}
                        className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-gold-500 text-charcoal-950 hover:bg-gold-400 transition-all cursor-pointer"
                      >
                        Set Siap Tayang
                      </button>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => handleDeleteContent(item.id, item.title)}
                    className="p-1.5 rounded-lg text-charcoal-400 hover:text-rose-600 hover:bg-rose-50 transition-all cursor-pointer"
                    title="Hapus Konten"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ========================================================================= */}
      {/* 5. SEKSI TUGAS: ADMIN LAYANAN PELANGGAN / ADMIN WA (CRM)                  */}
      {/* ========================================================================= */}
      {hasAdminWa && (activeTab === 'ALL' || activeTab === 'Admin Layanan Pelanggan') && (
        <section className="bg-white border border-[#EAE8E3] rounded-3xl p-5 sm:p-7 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#EAE8E3]">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-blue-100 border border-blue-300 flex items-center justify-center text-blue-900 shrink-0">
                <MessageCircle className="w-6 h-6 text-blue-800" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold text-charcoal-950">Workspace CRM &amp; Admin WhatsApp</h2>
                  <span className="text-xs font-extrabold px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-900 border border-blue-300">
                    {leads?.length || 0} Prospek Aktif
                  </span>
                </div>
                <p className="text-xs text-charcoal-500 mt-0.5">
                  Balas pesan calon pembeli, follow-up jadwal test drive showroom Garut, dan kirim simulasi kredit via WhatsApp.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-center">
              <Link
                href="/leads"
                className="text-xs font-bold text-charcoal-700 bg-[#FAF9F5] border border-[#EAE8E3] px-3.5 py-2 rounded-xl hover:border-gold-400 hover:text-charcoal-950 transition-all flex items-center gap-1.5"
              >
                Pipeline Prospek
              </Link>
              <Link
                href="/follow-up"
                className="text-xs font-bold text-charcoal-950 bg-gold-500 hover:bg-gold-400 px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5 shadow-xs"
              >
                Jadwal Follow Up ({pendingFollowUps.length})
              </Link>
            </div>
          </div>

          {/* Search Bar CRM */}
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-charcoal-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari nama prospek atau mobil yang diminati..."
              value={crmSearch}
              onChange={(e) => setCrmSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-[#FAF9F5] border border-[#EAE8E3] rounded-xl text-xs focus:outline-hidden focus:border-gold-500 focus:bg-white"
            />
          </div>

          {/* Quick Lead Follow Up Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {filteredLeads.slice(0, 9).map((lead) => (
              <div
                key={lead.id}
                className="p-4 rounded-2xl border border-[#EAE8E3] bg-[#FAF9F5] hover:bg-white hover:border-gold-400 transition-all shadow-xs flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-900 border border-blue-200">
                      {lead.status}
                    </span>
                    <span className="text-[11px] text-charcoal-400">
                      {lead.dateReceived ? new Date(lead.dateReceived).toLocaleDateString('id-ID') : 'Baru'}
                    </span>
                  </div>

                  <h4 className="text-sm font-bold text-charcoal-950">{lead.customerName}</h4>
                  <p className="text-xs text-charcoal-600 font-mono mt-0.5">{lead.contactNumber}</p>

                  <div className="mt-2.5 pt-2 border-t border-[#EAE8E3] space-y-1 text-xs">
                    <div className="flex items-center gap-1.5 text-charcoal-700">
                      <Car className="w-3.5 h-3.5 text-gold-600 shrink-0" />
                      <span className="font-semibold">{lead.interestedVehicle || 'Unit Showroom'}</span>
                    </div>
                    {lead.estimatedBudget && (
                      <p className="text-[11px] text-charcoal-500">
                        Budget: {formatRupiah(lead.estimatedBudget)}
                      </p>
                    )}
                    {lead.notes && (
                      <p className="text-[11px] text-charcoal-500 italic line-clamp-2">
                        &ldquo;{lead.notes}&rdquo;
                      </p>
                    )}
                  </div>
                </div>

                {/* Direct WhatsApp Button */}
                <div className="mt-4 pt-3 border-t border-[#EAE8E3] flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => openWhatsApp(lead.contactNumber, lead.customerName, lead.interestedVehicle)}
                    className="w-full py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs transition-all active:scale-98 cursor-pointer"
                  >
                    <Smartphone className="w-3.5 h-3.5" />
                    Chat WhatsApp Sekarang
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ========================================================================= */}
      {/* 6. SEKSI TUGAS: HOST LIVE SHOWROOM                                        */}
      {/* ========================================================================= */}
      {hasHostLive && (activeTab === 'ALL' || activeTab === 'Host Live') && (
        <section className="bg-white border border-[#EAE8E3] rounded-3xl p-5 sm:p-7 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#EAE8E3]">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-rose-100 border border-rose-300 flex items-center justify-center text-rose-900 shrink-0">
                <Radio className="w-6 h-6 text-rose-800" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold text-charcoal-950">Persiapan Host Live Streaming</h2>
                  <span className="text-xs font-extrabold px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-900 border border-rose-300">
                    Live Showroom HR MOTOR
                  </span>
                </div>
                <p className="text-xs text-charcoal-500 mt-0.5">
                  Unit display unggulan untuk disiarkan langsung di TikTok Live &amp; Shopee Live dengan simulasi DP minim Garut.
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
            {(stocks || []).filter((s) => s.status === 'Tersedia').slice(0, 6).map((car) => {
              const plate = car.plateNumber || car.licensePlate || 'Plat Garut';
              return (
                <div key={car.id} className="p-4 rounded-2xl border border-[#EAE8E3] bg-[#FAF9F5] shadow-xs">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-mono font-bold text-charcoal-800">{plate}</span>
                    <span className="font-bold text-gold-950 bg-gold-200 px-2 py-0.2 rounded-full">Unit Siap Spill</span>
                  </div>
                  <h4 className="text-sm font-bold text-charcoal-950">{car.brand} {car.model}</h4>
                  <p className="text-xs text-charcoal-500 mt-0.5">Tahun {car.year} • {car.transmission} • {car.color}</p>
                  <div className="mt-3 pt-2 border-t border-[#EAE8E3] flex items-center justify-between">
                    <span className="text-xs text-charcoal-500">Harga Cash:</span>
                    <span className="text-sm font-extrabold text-charcoal-950">{formatRupiah(car.price)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* ========================================================================= */}
      {/* MODAL: TAMBAH STOK KONTEN BARU (KONTEN KREATOR)                            */}
      {/* ========================================================================= */}
      {isAddContentOpen && (
        <div className="fixed inset-0 z-50 bg-charcoal-950/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 border border-[#EAE8E3] shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-[#EAE8E3]">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-900 flex items-center justify-center">
                  <Video className="w-5 h-5 text-purple-700" />
                </div>
                <h3 className="text-base font-bold text-charcoal-950">Tambah Stok Konten Showroom</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAddContentOpen(false)}
                className="w-8 h-8 rounded-full bg-charcoal-100 text-charcoal-600 flex items-center justify-center hover:bg-charcoal-200"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveContent} className="mt-4 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-charcoal-800 mb-1">Judul / Konsep Konten *</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Review Honda Brio RS Kuning Facelift DP 15 Juta"
                  value={contentForm.title}
                  onChange={(e) => setContentForm({ ...contentForm, title: e.target.value })}
                  className="w-full p-2.5 bg-[#FAF9F5] border border-[#EAE8E3] rounded-xl focus:outline-hidden focus:border-gold-500 focus:bg-white text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-charcoal-800 mb-1">Platform Medsos</label>
                  <select
                    value={contentForm.platform}
                    onChange={(e) => setContentForm({ ...contentForm, platform: e.target.value as ContentPlatform })}
                    className="w-full p-2.5 bg-[#FAF9F5] border border-[#EAE8E3] rounded-xl focus:outline-hidden focus:border-gold-500 focus:bg-white text-xs"
                  >
                    <option value="TikTok">TikTok</option>
                    <option value="Instagram Reels">Instagram Reels</option>
                    <option value="YouTube Shorts">YouTube Shorts</option>
                    <option value="Facebook Video">Facebook Video</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-charcoal-800 mb-1">Kategori Konten</label>
                  <select
                    value={contentForm.category}
                    onChange={(e) => setContentForm({ ...contentForm, category: e.target.value as ContentCategory })}
                    className="w-full p-2.5 bg-[#FAF9F5] border border-[#EAE8E3] rounded-xl focus:outline-hidden focus:border-gold-500 focus:bg-white text-xs"
                  >
                    <option value="Review Unit">Review Unit</option>
                    <option value="Spill Harga / DP">Spill Harga / DP</option>
                    <option value="Cinematic Unit">Cinematic Unit</option>
                    <option value="Tips Otomotif">Tips Otomotif</option>
                    <option value="Aktivitas Showroom">Aktivitas Showroom</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-charcoal-800 mb-1">Unit Mobil Terkait (Opsional)</label>
                  <select
                    value={contentForm.vehicleModel}
                    onChange={(e) => setContentForm({ ...contentForm, vehicleModel: e.target.value })}
                    className="w-full p-2.5 bg-[#FAF9F5] border border-[#EAE8E3] rounded-xl focus:outline-hidden focus:border-gold-500 focus:bg-white text-xs"
                  >
                    <option value="">-- Pilih Unit Display --</option>
                    {(stocks || []).map((car) => {
                      const plate = car.plateNumber || car.licensePlate || '';
                      return (
                        <option key={car.id} value={`${car.brand} ${car.model} (${plate})`}>
                          {car.brand} {car.model} ({plate})
                        </option>
                      );
                    })}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-charcoal-800 mb-1">Status Awal</label>
                  <select
                    value={contentForm.status}
                    onChange={(e) => setContentForm({ ...contentForm, status: e.target.value as ContentStatus })}
                    className="w-full p-2.5 bg-[#FAF9F5] border border-[#EAE8E3] rounded-xl focus:outline-hidden focus:border-gold-500 focus:bg-white text-xs"
                  >
                    <option value="Draf">Draf (Proses Rekam/Edit)</option>
                    <option value="Siap Tayang">Siap Tayang (Ready)</option>
                    <option value="Sudah Tayang">Sudah Tayang (Live)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-charcoal-800 mb-1">Target Tanggal Tayang</label>
                <input
                  type="date"
                  value={contentForm.targetPublishDate}
                  onChange={(e) => setContentForm({ ...contentForm, targetPublishDate: e.target.value })}
                  className="w-full p-2.5 bg-[#FAF9F5] border border-[#EAE8E3] rounded-xl focus:outline-hidden focus:border-gold-500 focus:bg-white text-xs"
                />
              </div>

              <div>
                <label className="block font-bold text-charcoal-800 mb-1">Catatan Hook / Script / Sound Tren</label>
                <textarea
                  rows={3}
                  placeholder="Contoh: Hook 3 detik awal: 'Mobil Garut paling lincah buat anak muda budget 100 jutaan!'"
                  value={contentForm.notes}
                  onChange={(e) => setContentForm({ ...contentForm, notes: e.target.value })}
                  className="w-full p-2.5 bg-[#FAF9F5] border border-[#EAE8E3] rounded-xl focus:outline-hidden focus:border-gold-500 focus:bg-white text-xs"
                />
              </div>

              <div className="pt-3 border-t border-[#EAE8E3] flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddContentOpen(false)}
                  className="px-4 py-2 rounded-xl border border-[#EAE8E3] text-charcoal-700 font-bold hover:bg-[#FAF9F5]"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-gold-500 hover:bg-gold-400 text-charcoal-950 font-bold shadow-xs"
                >
                  Simpan Stok Konten
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: TAMBAH CATATAN ARUS KAS (ADMIN KEUANGAN)                           */}
      {/* ========================================================================= */}
      {isAddCashFlowOpen && (
        <div className="fixed inset-0 z-50 bg-charcoal-950/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 border border-[#EAE8E3] shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-[#EAE8E3]">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-900 flex items-center justify-center">
                  <Landmark className="w-5 h-5 text-emerald-700" />
                </div>
                <h3 className="text-base font-bold text-charcoal-950">Catat Arus Kas Showroom</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAddCashFlowOpen(false)}
                className="w-8 h-8 rounded-full bg-charcoal-100 text-charcoal-600 flex items-center justify-center hover:bg-charcoal-200"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveCashFlow} className="mt-4 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-charcoal-800 mb-1">Jenis Transaksi</label>
                  <select
                    value={cashFlowForm.type}
                    onChange={(e) =>
                      setCashFlowForm({
                        ...cashFlowForm,
                        type: e.target.value as 'in' | 'out',
                        category: e.target.value === 'in' ? 'Uang SPK Masuk' : 'Operasional Showroom',
                      })
                    }
                    className="w-full p-2.5 bg-[#FAF9F5] border border-[#EAE8E3] rounded-xl focus:outline-hidden focus:border-gold-500 focus:bg-white text-xs font-bold"
                  >
                    <option value="in">Kas Masuk (+)</option>
                    <option value="out">Kas Keluar (-)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-charcoal-800 mb-1">Kategori</label>
                  <select
                    value={cashFlowForm.category}
                    onChange={(e) => setCashFlowForm({ ...cashFlowForm, category: e.target.value as CashFlowCategory })}
                    className="w-full p-2.5 bg-[#FAF9F5] border border-[#EAE8E3] rounded-xl focus:outline-hidden focus:border-gold-500 focus:bg-white text-xs"
                  >
                    {cashFlowForm.type === 'in' ? (
                      <>
                        <option value="Uang SPK Masuk">Uang SPK Masuk</option>
                        <option value="Lain-lain">Lain-lain (Penerimaan)</option>
                      </>
                    ) : (
                      <>
                        <option value="Operasional Showroom">Operasional Showroom</option>
                        <option value="Perbaikan Unit">Perbaikan Unit</option>
                        <option value="Pajak & Surat">Pajak &amp; Surat</option>
                        <option value="BOP & Uang Makan">BOP &amp; Uang Makan</option>
                        <option value="Lain-lain">Lain-lain (Pengeluaran)</option>
                      </>
                    )}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-charcoal-800 mb-1">Nominal (Rp) *</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: 1.500.000"
                  value={cashFlowForm.amount}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, '');
                    setCashFlowForm({
                      ...cashFlowForm,
                      amount: val ? parseInt(val, 10).toLocaleString('id-ID') : '',
                    });
                  }}
                  className="w-full p-2.5 bg-[#FAF9F5] border border-[#EAE8E3] rounded-xl focus:outline-hidden focus:border-gold-500 focus:bg-white text-xs font-mono font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-charcoal-800 mb-1">Tanggal Transaksi</label>
                <input
                  type="date"
                  value={cashFlowForm.date}
                  onChange={(e) => setCashFlowForm({ ...cashFlowForm, date: e.target.value })}
                  className="w-full p-2.5 bg-[#FAF9F5] border border-[#EAE8E3] rounded-xl focus:outline-hidden focus:border-gold-500 focus:bg-white text-xs"
                />
              </div>

              <div>
                <label className="block font-bold text-charcoal-800 mb-1">Keterangan / Rincian</label>
                <textarea
                  rows={3}
                  placeholder="Contoh: Biaya ganti oli mesin dan kampas rem Avanza"
                  value={cashFlowForm.description}
                  onChange={(e) => setCashFlowForm({ ...cashFlowForm, description: e.target.value })}
                  className="w-full p-2.5 bg-[#FAF9F5] border border-[#EAE8E3] rounded-xl focus:outline-hidden focus:border-gold-500 focus:bg-white text-xs"
                />
              </div>

              <div className="pt-3 border-t border-[#EAE8E3] flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddCashFlowOpen(false)}
                  className="px-4 py-2 rounded-xl border border-[#EAE8E3] text-charcoal-700 font-bold hover:bg-[#FAF9F5]"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-gold-500 hover:bg-gold-400 text-charcoal-950 font-bold shadow-xs"
                >
                  Catat Transaksi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
