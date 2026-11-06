'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  User,
  Users,
  Building2,
  Phone,
  Mail,
  MapPin,
  Clock,
  Shield,
  ShieldCheck,
  Key,
  Save,
  CheckCircle2,
  Download,
  RefreshCw,
  Bell,
  MessageSquare,
  Eye,
  EyeOff,
  Car,
  Sparkles,
  Sliders,
  Check,
  AlertCircle,
  CreditCard,
  FileText,
  Camera,
  RotateCcw,
  Smartphone,
  Calendar,
  CalendarClock,
  Lock,
  Upload,
  UserCheck,
  History,
  TrendingUp,
  ChevronRight,
} from 'lucide-react';
import { useCrm } from '@/context/CrmContext';

const AVATAR_PRESETS = [
  { id: '1', label: 'Farhan (Owner)', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=FarhanOwner&backgroundColor=ffdfbf' },
  { id: '2', label: 'Deni (Manager CRM)', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=DeniManager&backgroundColor=d1d4f9' },
  { id: '3', label: 'Asep (Konsultan Sales)', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=AsepSales&backgroundColor=b6e3f4' },
  { id: '4', label: 'Rina (Customer Service)', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=RinaCS&backgroundColor=ffd5dc' },
  { id: '5', label: 'Siti (Admin WhatsApp)', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=SitiWA&backgroundColor=c0aede' },
  { id: '6', label: 'Fajar (Marketing Lead)', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=FajarMarketing&backgroundColor=ffdfbf' },
  { id: '7', label: 'Budi (Eksekutif Showroom)', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=BudiExec&backgroundColor=d1d4f9' },
  { id: '8', label: 'Dani (Spesialis Unit)', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=DaniExpert&backgroundColor=b6e3f4' },
];

export default function SettingsDealerPage() {
  const {
    currentUser,
    updateProfile,
  } = useCrm();

  const [activeTab, setActiveTab] = useState<'profile' | 'showroom' | 'notifications'>('profile');

  // ==========================================
  // TAB 1: EDIT PROFIL AKUN PENGGUNA
  // ==========================================
  const [profileName, setProfileName] = useState(currentUser.name || '');
  const [profileEmail, setProfileEmail] = useState(currentUser.email || '');
  const [profilePhone, setProfilePhone] = useState(currentUser.phone || '');
  const [profileAvatar, setProfileAvatar] = useState(currentUser.avatar || AVATAR_PRESETS[0].url);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Unggah foto profil langsung dari HP (kamera/galeri) atau Laptop (file explorer)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showNotification('Mohon pilih file gambar yang valid (JPG, PNG, WebP).', true);
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      showNotification('Ukuran foto maksimal 10MB.', true);
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const rawDataUrl = event.target?.result as string;
      if (!rawDataUrl) return;

      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_SIZE = 256;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_SIZE) {
            height = Math.round((height * MAX_SIZE) / width);
            width = MAX_SIZE;
          }
        } else {
          if (height > MAX_SIZE) {
            width = Math.round((width * MAX_SIZE) / height);
            height = MAX_SIZE;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.85);
          setProfileAvatar(compressedDataUrl);
          showNotification('Foto berhasil diunggah! Klik "Simpan Perubahan Profil" untuk menyimpan.');
        } else {
          setProfileAvatar(rawDataUrl);
          showNotification('Foto berhasil diunggah! Klik "Simpan Perubahan Profil" untuk menyimpan.');
        }
      };
      img.src = rawDataUrl;
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // Sync profile when currentUser changes
  useEffect(() => {
    if (currentUser) {
      setProfileName(currentUser.name || '');
      setProfileEmail(currentUser.email || '');
      setProfilePhone(currentUser.phone || '');
      setProfileAvatar(currentUser.avatar || AVATAR_PRESETS[0].url);
    }
  }, [currentUser]);

  // ==========================================
  // TAB 2: PROFIL & IDENTITAS SHOWROOM
  // ==========================================
  const [dealerName, setDealerName] = useState('HR MOTOR Garut');
  const [dealerTagline, setDealerTagline] = useState('Showroom Mobil Bekas Berkualitas & Bergaransi');
  const [dealerAddress, setDealerAddress] = useState('Jl. Samarang No. 88, Tarogong Kaler, Kabupaten Garut, Jawa Barat 44151');
  const [dealerPhone, setDealerPhone] = useState('0812-2345-0001');
  const [operatingHoursWeekday, setOperatingHoursWeekday] = useState('08:00 - 17:00 WIB');
  const [bankBca, setBankBca] = useState('148-098-7711 a/n HR MOTOR GARUT');
  const [bankMandiri, setBankMandiri] = useState('131-00-9821-4452 a/n FARHAN HIZRI');

  // Load saved showroom settings from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('hr_motor_dealer_settings');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.dealerName) setDealerName(parsed.dealerName);
        if (parsed.dealerTagline) setDealerTagline(parsed.dealerTagline);
        if (parsed.dealerAddress) setDealerAddress(parsed.dealerAddress);
        if (parsed.dealerPhone) setDealerPhone(parsed.dealerPhone);
        if (parsed.operatingHoursWeekday) setOperatingHoursWeekday(parsed.operatingHoursWeekday);
        if (parsed.bankBca) setBankBca(parsed.bankBca);
        if (parsed.bankMandiri) setBankMandiri(parsed.bankMandiri);
      }
    } catch (e) {}
  }, []);

  // ==========================================
  // TAB 3: NOTIFIKASI & TEMPLATE WHATSAPP
  // ==========================================
  const [notifyFollowUp, setNotifyFollowUp] = useState(true);
  const [notifyCreditAcc, setNotifyCreditAcc] = useState(true);
  const [notifyStockSold, setNotifyStockSold] = useState(true);
  const [notifyNewLead, setNotifyNewLead] = useState(true);
  const [templateGreeting, setTemplateGreeting] = useState(
    'Halo Bapak/Ibu {nama_konsumen}, salam dari {dealer_name}. Terima kasih telah menghubungi showroom kami perihal unit {nama_mobil}. Ada yang bisa kami bantu jelaskan lebih lanjut?'
  );
  const [templateFollowUp5Q, setTemplateFollowUp5Q] = useState(
    'Halo Bapak/Ibu {nama_konsumen}, ini Farhan dari HR MOTOR Garut. Bagaimana performa unit {nama_mobil} setelah pemakaian sejauh ini? Kami ingin memastikan Anda puas dengan mobil pilihan Anda. Jika ada kendala, garansi resmi 1 bulan showroom kami siap melayani.'
  );
  const [templateOfferUnit, setTemplateOfferUnit] = useState(
    'Halo Bapak/Ibu {nama_konsumen}, berikut rincian unit ready {nama_mobil} (Tahun {tahun}) di HR MOTOR Garut:\n• Harga Cash: {harga_cash}\n• Estimasi Paket Kredit DP: {dp_estimasi}\n• Angsuran: {cicilan_estimasi}\nSilakan jadwalkan cek unit langsung di showroom kami.'
  );

  // ==========================================
  // TAB 4: PREFERENSI SISTEM & DATA
  // ==========================================
  const [currencyFormat] = useState('IDR (Rp - Rupiah Indonesia)');
  const [dateFormat] = useState('DD/MM/YYYY (Standar Indonesia)');
  const [performanceMode, setPerformanceMode] = useState('Satset (Instant Local Caching)');

  // Alert State
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const showNotification = (msg: string, isError: boolean = false) => {
    if (isError) {
      setErrorMessage(msg);
      setTimeout(() => setErrorMessage(null), 4000);
    } else {
      setSuccessMessage(msg);
      setTimeout(() => setSuccessMessage(null), 3500);
    }
  };

  // Simpan Profil Pengguna
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!profileName.trim()) {
      showNotification('Nama lengkap tidak boleh kosong.', true);
      return;
    }
    if (!profileEmail.trim()) {
      showNotification('Alamat email tidak boleh kosong.', true);
      return;
    }

    if (newPassword && newPassword !== confirmPassword) {
      showNotification('Konfirmasi kata sandi baru tidak cocok. Periksa kembali.', true);
      return;
    }

    setIsSaving(true);
    try {
      const payload: { name: string; email: string; phone: string; avatar: string; password?: string } = {
        name: profileName.trim(),
        email: profileEmail.trim(),
        phone: profilePhone.trim(),
        avatar: profileAvatar,
      };

      if (newPassword.trim()) {
        payload.password = newPassword.trim();
      }

      await updateProfile(payload);
      setNewPassword('');
      setConfirmPassword('');
      showNotification('Profil akun Anda berhasil diperbarui! Perubahan langsung aktif.');
    } catch (err: any) {
      showNotification('Terjadi kendala saat memperbarui profil.', true);
    } finally {
      setIsSaving(false);
    }
  };

  // Simpan Pengaturan Showroom
  const handleSaveShowroom = (e: React.FormEvent) => {
    e.preventDefault();
    const settings = {
      dealerName,
      dealerTagline,
      dealerAddress,
      dealerPhone,
      operatingHoursWeekday,
      bankBca,
      bankMandiri,
    };
    try {
      localStorage.setItem('hr_motor_dealer_settings', JSON.stringify(settings));
      showNotification('Profil & Identitas Showroom HR MOTOR Garut berhasil disimpan!');
    } catch (e) {
      showNotification('Gagal menyimpan ke penyimpanan lokal.', true);
    }
  };

  // Simpan Pesan & Notifikasi
  const handleSaveNotifications = (e: React.FormEvent) => {
    e.preventDefault();
    showNotification('Template pesan WhatsApp dan pengaturan notifikasi berhasil disimpan!');
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-16">
      {/* 1. HEADER HALAMAN PENGATURAN DEALER */}
      <div className="crm-card p-5 sm:p-6 bg-[#FAF9F5] border border-[#EAE8E3] relative overflow-hidden shadow-xs">
        <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-gold-500 via-gold-400 to-gold-600" />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-gold-100 text-gold-900 border border-gold-300 flex items-center justify-center shrink-0 shadow-2xs">
              <Sliders className="w-6 h-6 text-gold-700" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-black text-charcoal-900 tracking-tight">
                  Pengaturan Aplikasi
                </h1>
                <span className="badge-gold text-[10px]">HR MOTOR Garut</span>
              </div>
              <p className="text-xs text-charcoal-500 mt-0.5">
                Pusat kendali profil akun, identitas dealer showroom, template pesan WhatsApp, dan preferensi operasional.
              </p>
            </div>
          </div>

          {/* Quick User Badge */}
          <div className="flex items-center gap-2.5 bg-white p-2.5 rounded-xl border border-[#EAE8E3] shadow-2xs shrink-0 self-start sm:self-auto">
            <img
              src={currentUser.avatar || AVATAR_PRESETS[0].url}
              alt={currentUser.name}
              className="w-8 h-8 rounded-full object-cover border border-gold-400"
            />
            <div>
              <p className="text-xs font-bold text-charcoal-900 leading-tight">{currentUser.name}</p>
              <span className="text-[10px] text-gold-700 font-semibold uppercase">{currentUser.role}</span>
            </div>
          </div>
        </div>

        {/* 4 TAB PENGATURAN BERSIH & ELEGAN */}
        <div className="flex flex-wrap gap-2 mt-5 pt-4 border-t border-[#EAE8E3]">
          <button
            type="button"
            onClick={() => setActiveTab('profile')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'profile'
                ? 'bg-[#FDF8ED] text-gold-900 border-2 border-gold-400 shadow-xs'
                : 'bg-white text-charcoal-600 hover:text-charcoal-900 border border-[#EAE8E3]'
            }`}
          >
            <User className="w-4 h-4 text-gold-600" />
            <span>Profil Akun Saya</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('showroom')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'showroom'
                ? 'bg-[#FDF8ED] text-gold-900 border-2 border-gold-400 shadow-xs'
                : 'bg-white text-charcoal-600 hover:text-charcoal-900 border border-[#EAE8E3]'
            }`}
          >
            <Building2 className="w-4 h-4 text-gold-600" />
            <span>Profil &amp; Legalitas Showroom</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('notifications')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'notifications'
                ? 'bg-[#FDF8ED] text-gold-900 border-2 border-gold-400 shadow-xs'
                : 'bg-white text-charcoal-600 hover:text-charcoal-900 border border-[#EAE8E3]'
            }`}
          >
            <MessageSquare className="w-4 h-4 text-gold-600" />
            <span>Template WhatsApp &amp; Notifikasi</span>
          </button>
        </div>
      </div>

      {/* 2. MENU & MODUL TAMBAHAN SHOWROOM (Pusat Akses Lengkap Navigasi Mobile & Desktop) */}
      <div className="crm-card p-4 sm:p-5 bg-white border border-[#EAE8E3] rounded-2xl shadow-xs space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-[#EAE8E3]">
          <div>
            <h2 className="text-xs sm:text-sm font-black text-charcoal-900 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-gold-600" />
              <span>Menu &amp; Modul Operasional Showroom</span>
            </h2>
            <p className="text-[11px] text-charcoal-500 mt-0.5">
              Pusat akses cepat seluruh modul CRM HR MOTOR Garut untuk kemudahan navigasi di HP &amp; Laptop
            </p>
          </div>
          <span className="badge-gold text-[10px]">Akses Lengkap</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
          {/* Data Pelanggan */}
          <Link
            href="/customers"
            className="p-3 rounded-xl bg-[#FAF9F5] border border-[#EAE8E3] hover:border-gold-400 hover:bg-[#FDF8ED] transition-all flex flex-col justify-between group active:scale-95"
          >
            <div className="flex items-center justify-between">
              <div className="w-8 h-8 rounded-lg bg-gold-100 text-gold-900 border border-gold-300 flex items-center justify-center">
                <Users className="w-4 h-4" />
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-charcoal-400 group-hover:text-gold-700" />
            </div>
            <div className="mt-2">
              <h3 className="text-xs font-bold text-charcoal-900 group-hover:text-gold-900">Data Pelanggan</h3>
              <p className="text-[10px] text-charcoal-500 truncate">Basis data &amp; kwitansi deal</p>
            </div>
          </Link>

          {/* Follow Up */}
          <Link
            href="/follow-up"
            className="p-3 rounded-xl bg-[#FAF9F5] border border-[#EAE8E3] hover:border-gold-400 hover:bg-[#FDF8ED] transition-all flex flex-col justify-between group active:scale-95"
          >
            <div className="flex items-center justify-between">
              <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-900 border border-blue-300 flex items-center justify-center">
                <CalendarClock className="w-4 h-4" />
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-charcoal-400 group-hover:text-gold-700" />
            </div>
            <div className="mt-2">
              <h3 className="text-xs font-bold text-charcoal-900 group-hover:text-gold-900">Follow Up</h3>
              <p className="text-[10px] text-charcoal-500 truncate">Riwayat &amp; kepuasan 1 tahun</p>
            </div>
          </Link>

          {/* Garansi & Servis */}
          <Link
            href="/riwayat-perbaikan"
            className="p-3 rounded-xl bg-[#FAF9F5] border border-[#EAE8E3] hover:border-gold-400 hover:bg-[#FDF8ED] transition-all flex flex-col justify-between group active:scale-95"
          >
            <div className="flex items-center justify-between">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-900 border border-emerald-300 flex items-center justify-center">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-charcoal-400 group-hover:text-gold-700" />
            </div>
            <div className="mt-2">
              <h3 className="text-xs font-bold text-charcoal-900 group-hover:text-gold-900">Garansi &amp; Servis</h3>
              <p className="text-[10px] text-charcoal-500 truncate">Klaim &lt; 1 bulan &amp; bengkel</p>
            </div>
          </Link>

          {/* Laporan & Analisis Showroom */}
          <Link
            href="/reports"
            className="p-3 rounded-xl bg-[#FAF9F5] border border-[#EAE8E3] hover:border-gold-400 hover:bg-[#FDF8ED] transition-all flex flex-col justify-between group active:scale-95"
          >
            <div className="flex items-center justify-between">
              <div className="w-8 h-8 rounded-lg bg-gold-100 text-gold-900 border border-gold-300 flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-gold-800" />
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-charcoal-400 group-hover:text-gold-700" />
            </div>
            <div className="mt-2">
              <h3 className="text-xs font-bold text-charcoal-900 group-hover:text-gold-900">Laporan &amp; Analisis</h3>
              <p className="text-[10px] text-charcoal-500 truncate">Tren penjualan &amp; kinerja showroom</p>
            </div>
          </Link>

          {/* Manajemen Pengguna (Owner Only) */}
          {currentUser.role === 'Owner' && (
            <Link
              href="/users"
              className="p-3 rounded-xl bg-[#FAF9F5] border border-[#EAE8E3] hover:border-gold-400 hover:bg-[#FDF8ED] transition-all flex flex-col justify-between group active:scale-95"
            >
              <div className="flex items-center justify-between">
                <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-900 border border-purple-300 flex items-center justify-center">
                  <UserCheck className="w-4 h-4" />
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-charcoal-400 group-hover:text-gold-700" />
              </div>
              <div className="mt-2">
                <h3 className="text-xs font-bold text-charcoal-900 group-hover:text-gold-900">Manajemen Tim</h3>
                <p className="text-[10px] text-charcoal-500 truncate">Persetujuan &amp; hak akses</p>
              </div>
            </Link>
          )}

          {/* Catatan Aktivitas */}
          <Link
            href="/activity-logs"
            className="p-3 rounded-xl bg-[#FAF9F5] border border-[#EAE8E3] hover:border-gold-400 hover:bg-[#FDF8ED] transition-all flex flex-col justify-between group active:scale-95"
          >
            <div className="flex items-center justify-between">
              <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-900 border border-amber-300 flex items-center justify-center">
                <History className="w-4 h-4" />
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-charcoal-400 group-hover:text-gold-700" />
            </div>
            <div className="mt-2">
              <h3 className="text-xs font-bold text-charcoal-900 group-hover:text-gold-900">Riwayat Aktivitas</h3>
              <p className="text-[10px] text-charcoal-500 truncate">Audit log &amp; aksi operasional</p>
            </div>
          </Link>

          {/* Hub Komunikasi WA */}
          <Link
            href="/communication"
            className="p-3 rounded-xl bg-[#FAF9F5] border border-[#EAE8E3] hover:border-gold-400 hover:bg-[#FDF8ED] transition-all flex flex-col justify-between group active:scale-95"
          >
            <div className="flex items-center justify-between">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-900 border border-emerald-300 flex items-center justify-center">
                <MessageSquare className="w-4 h-4" />
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-charcoal-400 group-hover:text-gold-700" />
            </div>
            <div className="mt-2">
              <h3 className="text-xs font-bold text-charcoal-900 group-hover:text-gold-900">WhatsApp Hub</h3>
              <p className="text-[10px] text-charcoal-500 truncate">Template &amp; respon pesan</p>
            </div>
          </Link>
        </div>
      </div>

      {/* FEEDBACK ALERT MESSAGE */}
      {successMessage && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-300 rounded-xl text-xs text-emerald-900 font-bold flex items-center justify-between shadow-2xs animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMessage}</span>
          </div>
          <button onClick={() => setSuccessMessage(null)} className="text-emerald-700 font-black text-sm cursor-pointer">
            ×
          </button>
        </div>
      )}

      {errorMessage && (
        <div className="p-3.5 bg-rose-50 border border-rose-300 rounded-xl text-xs text-rose-900 font-bold flex items-center justify-between shadow-2xs animate-in fade-in">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button onClick={() => setErrorMessage(null)} className="text-rose-700 font-black text-sm cursor-pointer">
            ×
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 1: EDIT PROFIL AKUN PENGGUNA (PROFIL SAYA)                            */}
      {/* ========================================================================= */}
      {activeTab === 'profile' && (
        <div className="space-y-6">
          <form onSubmit={handleSaveProfile} className="crm-card p-5 sm:p-6 bg-white space-y-6 border border-[#EAE8E3]">
            {/* Header Bagian Profil */}
            <div className="flex items-center justify-between border-b border-[#EAE8E3] pb-4">
              <div>
                <h2 className="text-base font-black text-charcoal-900">Informasi Pribadi &amp; Profil Pengguna</h2>
                <p className="text-xs text-charcoal-500">
                  Perbarui nama lengkap, nomor WhatsApp, foto avatar, dan kata sandi login Anda.
                </p>
              </div>
              <span className="badge-gold text-[10px] hidden sm:inline-block">Status: Akun Aktif</span>
            </div>

            {/* Avatar Selector */}
            <div>
              <label className="block text-xs font-bold text-charcoal-800 mb-2">
                Foto Profil Pengguna (Avatar)
              </label>
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <div
                  className="relative cursor-pointer group"
                  onClick={() => fileInputRef.current?.click()}
                  title="Klik untuk unggah foto baru dari HP atau Laptop"
                >
                  <img
                    src={profileAvatar}
                    alt="Foto Profil"
                    className="w-20 h-20 rounded-2xl object-cover border-2 border-gold-400 shadow-md group-hover:border-gold-500 transition-all"
                  />
                  <div className="absolute -bottom-1.5 -right-1.5 w-6 h-6 rounded-full bg-gold-500 text-charcoal-950 flex items-center justify-center shadow-xs group-hover:scale-110 transition-transform">
                    <Camera className="w-3.5 h-3.5" />
                  </div>
                </div>

                <div className="flex-1 space-y-2">
                  <span className="text-[11px] text-charcoal-500 block">Pilih avatar preset showroom resmi atau unggah foto:</span>
                  <div className="flex items-center gap-2 flex-wrap">
                    {AVATAR_PRESETS.map((preset) => (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => setProfileAvatar(preset.url)}
                        className={`w-9 h-9 rounded-xl overflow-hidden border-2 transition-all cursor-pointer ${
                          profileAvatar === preset.url
                            ? 'border-gold-500 ring-2 ring-gold-400/40 scale-105 shadow-xs'
                            : 'border-transparent hover:border-gold-300 opacity-70 hover:opacity-100'
                        }`}
                        title={preset.label}
                      >
                        <img src={preset.url} alt={preset.label} className="w-full h-full object-cover" />
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => {
                        const bgColors = ['ffdfbf', 'd1d4f9', 'b6e3f4', 'ffd5dc', 'c0aede'];
                        const randomBg = bgColors[Math.floor(Math.random() * bgColors.length)];
                        const randomSeed = `HRMotor_${Date.now()}`;
                        const newAvatar = `https://api.dicebear.com/7.x/avataaars/svg?seed=${randomSeed}&backgroundColor=${randomBg}`;
                        setProfileAvatar(newAvatar);
                      }}
                      className="px-2.5 py-1.5 rounded-lg bg-gold-100 hover:bg-gold-200 border border-gold-300 text-[10px] font-bold text-gold-900 transition-colors cursor-pointer flex items-center gap-1 shadow-2xs"
                      title="Buat karakter kartun animasi acak unik"
                    >
                      🎲 + Acak Kartun
                    </button>

                    {/* Hidden Native File Input (Bisa langsung kamera HP / Galeri HP / File Laptop) */}
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileUpload}
                      accept="image/*"
                      className="hidden"
                      id="avatar-file-upload"
                    />

                    {/* Tombol Unggah Foto (Menggantikan + URL Gambar) */}
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-2.5 py-1.5 rounded-lg border border-gold-400 bg-white hover:bg-[#FDF8ED] text-[10px] font-bold text-gold-900 transition-colors cursor-pointer flex items-center gap-1.5 shadow-2xs"
                      title="Unggah foto langsung dari kamera HP atau file laptop"
                    >
                      <Upload className="w-3.5 h-3.5 text-gold-700" />
                      <span>Unggah Foto</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Input Fields: Nama, Email, Telepon */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-charcoal-800 mb-1">
                  Nama Lengkap <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-charcoal-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={profileName}
                    onChange={(e) => setProfileName(e.target.value)}
                    placeholder="Nama lengkap Anda..."
                    className="w-full text-xs pl-9 pr-3.5 py-2.5 bg-[#F8F7F4] border border-[#EAE8E3] rounded-xl outline-none focus:border-gold-500 text-charcoal-900 font-semibold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-charcoal-800 mb-1">
                  Alamat Email Akun <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-charcoal-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={profileEmail}
                    onChange={(e) => setProfileEmail(e.target.value)}
                    placeholder="nama@hrmotor.id"
                    className="w-full text-xs pl-9 pr-3.5 py-2.5 bg-[#F8F7F4] border border-[#EAE8E3] rounded-xl outline-none focus:border-gold-500 text-charcoal-900 font-semibold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-charcoal-800 mb-1">
                  Nomor WhatsApp / Telepon
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-charcoal-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="tel"
                    value={profilePhone}
                    onChange={(e) => setProfilePhone(e.target.value)}
                    placeholder="0812-XXXX-XXXX"
                    className="w-full text-xs pl-9 pr-3.5 py-2.5 bg-[#F8F7F4] border border-[#EAE8E3] rounded-xl outline-none focus:border-gold-500 text-charcoal-900 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-charcoal-800 mb-1">
                  Peran &amp; Hak Akses Showroom
                </label>
                <div className="flex items-center gap-2 p-2.5 bg-[#FAF9F5] border border-[#EAE8E3] rounded-xl">
                  <Shield className="w-4 h-4 text-gold-600 shrink-0" />
                  <span className="text-xs font-black text-charcoal-900">{currentUser.role}</span>
                  <span className="text-[10px] text-charcoal-500 ml-auto">Wewenang Penuh Showroom</span>
                </div>
              </div>
            </div>

            {/* Bagian Ubah Kata Sandi */}
            <div className="pt-4 border-t border-[#EAE8E3] space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-black text-charcoal-900 flex items-center gap-1.5">
                    <Key className="w-3.5 h-3.5 text-gold-600" />
                    Ubah Kata Sandi (Opsional)
                  </h3>
                  <p className="text-[11px] text-charcoal-500">
                    Kosongkan jika Anda tidak bermaksud mengubah kata sandi saat ini.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-[11px] font-bold text-charcoal-600 hover:text-gold-700 flex items-center gap-1 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  <span>{showPassword ? 'Sembunyikan' : 'Lihat'}</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-charcoal-700 mb-1">Kata Sandi Baru</label>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Masukkan kata sandi baru..."
                    className="w-full text-xs px-3.5 py-2.5 bg-[#F8F7F4] border border-[#EAE8E3] rounded-xl outline-none focus:border-gold-500 text-charcoal-900 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-charcoal-700 mb-1">Konfirmasi Kata Sandi Baru</label>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Ulangi kata sandi baru..."
                    className="w-full text-xs px-3.5 py-2.5 bg-[#F8F7F4] border border-[#EAE8E3] rounded-xl outline-none focus:border-gold-500 text-charcoal-900 font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Tombol Simpan Profil */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#EAE8E3]">
              <button
                type="submit"
                disabled={isSaving}
                className="btn-gold flex items-center gap-2 text-xs font-bold py-2.5 px-6 shadow-xs cursor-pointer"
              >
                <Save className="w-4 h-4 text-charcoal-950" />
                <span>{isSaving ? 'Menyimpan...' : 'Simpan Perubahan Profil'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: PROFIL & IDENTITAS SHOWROOM                                        */}
      {/* ========================================================================= */}
      {activeTab === 'showroom' && (
        <form onSubmit={handleSaveShowroom} className="crm-card p-5 sm:p-6 bg-white space-y-6 border border-[#EAE8E3]">
          <div className="border-b border-[#EAE8E3] pb-4">
            <h2 className="text-base font-black text-charcoal-900">Identitas &amp; Legalitas Showroom HR MOTOR Garut</h2>
            <p className="text-xs text-charcoal-500">
              Data ini secara otomatis dicetak pada kwitansi pembayaran resmi kasir, dokumen penawaran, dan profil showroom.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-charcoal-800 mb-1">
                Nama Resmi Showroom <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Building2 className="w-4 h-4 text-charcoal-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={dealerName}
                  onChange={(e) => setDealerName(e.target.value)}
                  className="w-full text-xs pl-9 pr-3.5 py-2.5 bg-[#F8F7F4] border border-[#EAE8E3] rounded-xl outline-none focus:border-gold-500 text-charcoal-900 font-bold"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-charcoal-800 mb-1">
                Slogan / Tagline Showroom
              </label>
              <div className="relative">
                <Sparkles className="w-4 h-4 text-charcoal-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={dealerTagline}
                  onChange={(e) => setDealerTagline(e.target.value)}
                  className="w-full text-xs pl-9 pr-3.5 py-2.5 bg-[#F8F7F4] border border-[#EAE8E3] rounded-xl outline-none focus:border-gold-500 text-charcoal-900 font-semibold"
                />
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-charcoal-800 mb-1">
                Alamat Lengkap Showroom
              </label>
              <div className="relative">
                <MapPin className="w-4 h-4 text-charcoal-400 absolute left-3 top-3" />
                <textarea
                  rows={2}
                  value={dealerAddress}
                  onChange={(e) => setDealerAddress(e.target.value)}
                  className="w-full text-xs pl-9 pr-3.5 py-2.5 bg-[#F8F7F4] border border-[#EAE8E3] rounded-xl outline-none focus:border-gold-500 text-charcoal-900 font-medium"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-charcoal-800 mb-1">
                Nomor WhatsApp Hotline Resmi
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-charcoal-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={dealerPhone}
                  onChange={(e) => setDealerPhone(e.target.value)}
                  className="w-full text-xs pl-9 pr-3.5 py-2.5 bg-[#F8F7F4] border border-[#EAE8E3] rounded-xl outline-none focus:border-gold-500 text-charcoal-900 font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-charcoal-800 mb-1">
                Jam Operasional Showroom
              </label>
              <div className="relative">
                <Clock className="w-4 h-4 text-charcoal-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={operatingHoursWeekday}
                  onChange={(e) => setOperatingHoursWeekday(e.target.value)}
                  className="w-full text-xs pl-9 pr-3.5 py-2.5 bg-[#F8F7F4] border border-[#EAE8E3] rounded-xl outline-none focus:border-gold-500 text-charcoal-900 font-semibold"
                />
              </div>
            </div>
          </div>

          {/* Rekening Bank Resmi Showroom */}
          <div className="pt-4 border-t border-[#EAE8E3] space-y-3">
            <h3 className="text-xs font-black text-charcoal-900 flex items-center gap-1.5">
              <CreditCard className="w-4 h-4 text-gold-600" />
              Rekening Bank Resmi Showroom (Tercantum pada Kwitansi Pembayaran)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-bold text-charcoal-700 mb-1">Rekening Bank BCA</label>
                <input
                  type="text"
                  value={bankBca}
                  onChange={(e) => setBankBca(e.target.value)}
                  className="w-full text-xs px-3.5 py-2.5 bg-[#F8F7F4] border border-[#EAE8E3] rounded-xl outline-none focus:border-gold-500 text-charcoal-900 font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-charcoal-700 mb-1">Rekening Bank Mandiri</label>
                <input
                  type="text"
                  value={bankMandiri}
                  onChange={(e) => setBankMandiri(e.target.value)}
                  className="w-full text-xs px-3.5 py-2.5 bg-[#F8F7F4] border border-[#EAE8E3] rounded-xl outline-none focus:border-gold-500 text-charcoal-900 font-mono"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end pt-4 border-t border-[#EAE8E3]">
            <button
              type="submit"
              className="btn-gold flex items-center gap-2 text-xs font-bold py-2.5 px-6 shadow-xs cursor-pointer"
            >
              <Save className="w-4 h-4 text-charcoal-950" />
              <span>Simpan Profil Showroom</span>
            </button>
          </div>
        </form>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: TEMPLATE WHATSAPP & NOTIFIKASI OTOMATIS                            */}
      {/* ========================================================================= */}
      {activeTab === 'notifications' && (
        <form onSubmit={handleSaveNotifications} className="crm-card p-5 sm:p-6 bg-white space-y-6 border border-[#EAE8E3]">
          <div className="border-b border-[#EAE8E3] pb-4">
            <h2 className="text-base font-black text-charcoal-900">Template Pesan WhatsApp &amp; Notifikasi Operasional</h2>
            <p className="text-xs text-charcoal-500">
              Format standar pesan otomatis saat menghubungi calon pembeli, follow-up kepuasan 1 tahun, dan penawaran kredit.
            </p>
          </div>

          {/* Pengingat & Notifikasi Saklar */}
          <div className="space-y-3">
            <h3 className="text-xs font-black text-charcoal-900">Pengingat Notifikasi Sistem CRM</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label className="flex items-center justify-between p-3.5 bg-[#FAF9F5] border border-[#EAE8E3] rounded-xl cursor-pointer hover:border-gold-300">
                <div>
                  <p className="text-xs font-bold text-charcoal-900">Pengingat Jadwal Follow-Up Konsumen</p>
                  <p className="text-[10px] text-charcoal-500">Notifikasi harian jadwal 1 Bulan, 3 Bulan, 6 Bulan, 1 Tahun</p>
                </div>
                <input
                  type="checkbox"
                  checked={notifyFollowUp}
                  onChange={(e) => setNotifyFollowUp(e.target.checked)}
                  className="w-4 h-4 accent-gold-500 cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between p-3.5 bg-[#FAF9F5] border border-[#EAE8E3] rounded-xl cursor-pointer hover:border-gold-300">
                <div>
                  <p className="text-xs font-bold text-charcoal-900">Notifikasi Kredit Disetujui (ACC)</p>
                  <p className="text-[10px] text-charcoal-500">Pemberitahuan saat leasing rekanan mengabari ACC unit</p>
                </div>
                <input
                  type="checkbox"
                  checked={notifyCreditAcc}
                  onChange={(e) => setNotifyCreditAcc(e.target.checked)}
                  className="w-4 h-4 accent-gold-500 cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between p-3.5 bg-[#FAF9F5] border border-[#EAE8E3] rounded-xl cursor-pointer hover:border-gold-300">
                <div>
                  <p className="text-xs font-bold text-charcoal-900">Peringatan Unit Terjual (Sold Out)</p>
                  <p className="text-[10px] text-charcoal-500">Kunci otomatis unit agar tidak terjadi penawaran ganda</p>
                </div>
                <input
                  type="checkbox"
                  checked={notifyStockSold}
                  onChange={(e) => setNotifyStockSold(e.target.checked)}
                  className="w-4 h-4 accent-gold-500 cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between p-3.5 bg-[#FAF9F5] border border-[#EAE8E3] rounded-xl cursor-pointer hover:border-gold-300">
                <div>
                  <p className="text-xs font-bold text-charcoal-900">Notifikasi Prospek Konsumen Baru</p>
                  <p className="text-[10px] text-charcoal-500">Pemberitahuan saat calon pembeli menghubungi showroom</p>
                </div>
                <input
                  type="checkbox"
                  checked={notifyNewLead}
                  onChange={(e) => setNotifyNewLead(e.target.checked)}
                  className="w-4 h-4 accent-gold-500 cursor-pointer"
                />
              </label>
            </div>
          </div>

          {/* Template Pesan WhatsApp */}
          <div className="pt-4 border-t border-[#EAE8E3] space-y-4">
            <h3 className="text-xs font-black text-charcoal-900">Template Pesan WhatsApp Resmi Dealer</h3>

            <div>
              <label className="block text-xs font-bold text-charcoal-800 mb-1">
                1. Template Follow-Up Kepuasan Konsumen (5 Pertanyaan Pasca-Penjualan)
              </label>
              <textarea
                rows={3}
                value={templateFollowUp5Q}
                onChange={(e) => setTemplateFollowUp5Q(e.target.value)}
                className="w-full text-xs p-3 bg-[#F8F7F4] border border-[#EAE8E3] rounded-xl outline-none focus:border-gold-500 text-charcoal-900 font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-charcoal-800 mb-1">
                2. Template Penawaran Spesifikasi Unit &amp; Paket Kredit
              </label>
              <textarea
                rows={4}
                value={templateOfferUnit}
                onChange={(e) => setTemplateOfferUnit(e.target.value)}
                className="w-full text-xs p-3 bg-[#F8F7F4] border border-[#EAE8E3] rounded-xl outline-none focus:border-gold-500 text-charcoal-900 font-medium font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-charcoal-800 mb-1">
                3. Template Salam Sambutan Calon Konsumen Baru
              </label>
              <textarea
                rows={3}
                value={templateGreeting}
                onChange={(e) => setTemplateGreeting(e.target.value)}
                className="w-full text-xs p-3 bg-[#F8F7F4] border border-[#EAE8E3] rounded-xl outline-none focus:border-gold-500 text-charcoal-900 font-medium"
              />
            </div>
          </div>

          <div className="flex items-center justify-end pt-4 border-t border-[#EAE8E3]">
            <button
              type="submit"
              className="btn-gold flex items-center gap-2 text-xs font-bold py-2.5 px-6 shadow-xs cursor-pointer"
            >
              <Save className="w-4 h-4 text-charcoal-950" />
              <span>Simpan Pengaturan Pesan &amp; Notifikasi</span>
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
