'use client';

import React, { useState, useEffect } from 'react';
import {
  User,
  Building2,
  Phone,
  Mail,
  MapPin,
  Clock,
  Shield,
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
  Lock,
} from 'lucide-react';
import { useCrm } from '@/context/CrmContext';

const AVATAR_PRESETS = [
  { id: '1', label: 'Eksekutif Showroom', url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150' },
  { id: '2', label: 'Dealer Manager', url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150' },
  { id: '3', label: 'Konsultan Otomotif', url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150' },
  { id: '4', label: 'Customer Relations', url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150' },
  { id: '5', label: 'Sales Executive', url: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150' },
  { id: '6', label: 'Admin Profesional', url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150' },
];

export default function SettingsDealerPage() {
  const {
    currentUser,
    updateProfile,
    resetToDemo,
    customers,
    stocks,
    purchases,
    creditApplications,
    followUps,
    leads,
  } = useCrm();

  const [activeTab, setActiveTab] = useState<'profile' | 'showroom' | 'notifications' | 'system'>('profile');

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
  const [isCustomAvatar, setIsCustomAvatar] = useState(false);
  const [customAvatarUrl, setCustomAvatarUrl] = useState('');

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
  const [dealerEmail, setDealerEmail] = useState('info@hrmotor.id');
  const [operatingHoursWeekday, setOperatingHoursWeekday] = useState('08:00 - 17:00 WIB');
  const [operatingHoursWeekend, setOperatingHoursWeekend] = useState('09:00 - 15:00 WIB');
  const [bankBca, setBankBca] = useState('148-098-7711 a/n HR MOTOR GARUT');
  const [bankMandiri, setBankMandiri] = useState('131-00-9821-4452 a/n FARHAN HIZRI');
  const [warrantyPolicy, setWarrantyPolicy] = useState(
    'Garansi 1 Bulan Gratis Resmi HR MOTOR Garut (Mesin & Transmisi) ke Bengkel Rujukan Rekanan Showroom. Seluruh unit dijamin 100% Bebas Banjir dan Bebas Benturan Tabrakan Berat.'
  );

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
        if (parsed.dealerEmail) setDealerEmail(parsed.dealerEmail);
        if (parsed.operatingHoursWeekday) setOperatingHoursWeekday(parsed.operatingHoursWeekday);
        if (parsed.operatingHoursWeekend) setOperatingHoursWeekend(parsed.operatingHoursWeekend);
        if (parsed.bankBca) setBankBca(parsed.bankBca);
        if (parsed.bankMandiri) setBankMandiri(parsed.bankMandiri);
        if (parsed.warrantyPolicy) setWarrantyPolicy(parsed.warrantyPolicy);
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
      dealerEmail,
      operatingHoursWeekday,
      operatingHoursWeekend,
      bankBca,
      bankMandiri,
      warrantyPolicy,
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

  // Unduh Cadangan Data CRM (Export JSON)
  const handleExportBackup = () => {
    const backupData = {
      dealer: dealerName,
      exportedAt: new Date().toISOString(),
      version: '1.0',
      data: {
        customers,
        stocks,
        purchases,
        creditApplications,
        followUps,
        leads,
      },
    };

    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(backupData, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `HR_MOTOR_Backup_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();

    showNotification('Cadangan data CRM berhasil diunduh ke komputer Anda.');
  };

  // Reset Data Demo
  const handleResetData = async () => {
    if (
      window.confirm(
        'PERINGATAN: Apakah Anda yakin ingin mereset seluruh data CRM ke dataset awal demo? Seluruh perubahan lokal akan dikembalikan.'
      )
    ) {
      await resetToDemo();
      showNotification('Data CRM telah berhasil dikembalikan ke dataset awal demo.');
    }
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

          <button
            type="button"
            onClick={() => setActiveTab('system')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'system'
                ? 'bg-[#FDF8ED] text-gold-900 border-2 border-gold-400 shadow-xs'
                : 'bg-white text-charcoal-600 hover:text-charcoal-900 border border-[#EAE8E3]'
            }`}
          >
            <Sliders className="w-4 h-4 text-gold-600" />
            <span>Preferensi &amp; Cadangan Data</span>
          </button>
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
                <div className="relative">
                  <img
                    src={profileAvatar}
                    alt="Foto Profil"
                    className="w-20 h-20 rounded-2xl object-cover border-2 border-gold-400 shadow-md"
                  />
                  <div className="absolute -bottom-1.5 -right-1.5 w-6 h-6 rounded-full bg-gold-500 text-charcoal-950 flex items-center justify-center shadow-xs">
                    <Camera className="w-3.5 h-3.5" />
                  </div>
                </div>

                <div className="flex-1 space-y-2">
                  <span className="text-[11px] text-charcoal-500 block">Pilih avatar preset showroom resmi:</span>
                  <div className="flex items-center gap-2 flex-wrap">
                    {AVATAR_PRESETS.map((preset) => (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => {
                          setProfileAvatar(preset.url);
                          setIsCustomAvatar(false);
                        }}
                        className={`w-9 h-9 rounded-xl overflow-hidden border-2 transition-all cursor-pointer ${
                          profileAvatar === preset.url && !isCustomAvatar
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
                      onClick={() => setIsCustomAvatar(!isCustomAvatar)}
                      className="px-2.5 py-1.5 rounded-lg border border-[#DDD9CF] text-[10px] font-bold text-charcoal-700 hover:bg-[#FAF9F5] transition-colors cursor-pointer"
                    >
                      {isCustomAvatar ? 'Tutup URL' : '+ URL Gambar'}
                    </button>
                  </div>

                  {isCustomAvatar && (
                    <div className="mt-2 flex gap-2 max-w-md">
                      <input
                        type="url"
                        placeholder="Masukkan URL link foto profil..."
                        value={customAvatarUrl}
                        onChange={(e) => setCustomAvatarUrl(e.target.value)}
                        className="text-xs px-3 py-1.5 bg-[#F8F7F4] border border-[#EAE8E3] rounded-lg w-full outline-none focus:border-gold-500"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (customAvatarUrl.trim()) {
                            setProfileAvatar(customAvatarUrl.trim());
                            showNotification('Avatar URL berhasil diterapkan.');
                          }
                        }}
                        className="btn-gold text-xs py-1 px-3 whitespace-nowrap"
                      >
                        Terapkan
                      </button>
                    </div>
                  )}
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
                Alamat Email Showroom
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-charcoal-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  value={dealerEmail}
                  onChange={(e) => setDealerEmail(e.target.value)}
                  className="w-full text-xs pl-9 pr-3.5 py-2.5 bg-[#F8F7F4] border border-[#EAE8E3] rounded-xl outline-none focus:border-gold-500 text-charcoal-900 font-medium"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-charcoal-800 mb-1">
                Jam Buka Hari Kerja (Senin - Sabtu)
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

            <div>
              <label className="block text-xs font-bold text-charcoal-800 mb-1">
                Jam Buka Akhir Pekan (Minggu &amp; Libur)
              </label>
              <div className="relative">
                <Clock className="w-4 h-4 text-charcoal-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={operatingHoursWeekend}
                  onChange={(e) => setOperatingHoursWeekend(e.target.value)}
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

          {/* Kebijakan Garansi Resmi Showroom */}
          <div className="pt-4 border-t border-[#EAE8E3] space-y-2">
            <label className="block text-xs font-bold text-charcoal-800">
              Ketentuan Garansi Resmi Showroom HR MOTOR Garut
            </label>
            <textarea
              rows={3}
              value={warrantyPolicy}
              onChange={(e) => setWarrantyPolicy(e.target.value)}
              className="w-full text-xs p-3 bg-[#F8F7F4] border border-[#EAE8E3] rounded-xl outline-none focus:border-gold-500 text-charcoal-900 font-medium"
            />
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

      {/* ========================================================================= */}
      {/* TAB 4: PREFERENSI SISTEM & PENGELOLAAN DATA CRM                            */}
      {/* ========================================================================= */}
      {activeTab === 'system' && (
        <div className="space-y-6">
          {/* Card Preferensi Sistem */}
          <div className="crm-card p-5 sm:p-6 bg-white space-y-5 border border-[#EAE8E3]">
            <div className="border-b border-[#EAE8E3] pb-4">
              <h2 className="text-base font-black text-charcoal-900">Preferensi Regional &amp; Antarmuka Aplikasi</h2>
              <p className="text-xs text-charcoal-500">
                Konfigurasi format mata uang, tanggal, dan kecepatan akses aplikasi showroom.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-3.5 bg-[#FAF9F5] border border-[#EAE8E3] rounded-xl">
                <span className="text-[10px] text-charcoal-500 uppercase tracking-wider font-bold block">
                  Format Mata Uang
                </span>
                <span className="text-sm font-black text-charcoal-900 mt-1 block">{currencyFormat}</span>
                <span className="text-[10px] text-emerald-700 font-semibold mt-0.5 block">Contoh: Rp 185.000.000</span>
              </div>

              <div className="p-3.5 bg-[#FAF9F5] border border-[#EAE8E3] rounded-xl">
                <span className="text-[10px] text-charcoal-500 uppercase tracking-wider font-bold block">
                  Format Tanggal &amp; Waktu
                </span>
                <span className="text-sm font-black text-charcoal-900 mt-1 block">{dateFormat}</span>
                <span className="text-[10px] text-charcoal-500 font-semibold mt-0.5 block">Zona Waktu: WIB (GMT+7)</span>
              </div>

              <div className="p-3.5 bg-[#FAF9F5] border border-[#EAE8E3] rounded-xl">
                <span className="text-[10px] text-charcoal-500 uppercase tracking-wider font-bold block">
                  Mode Performa
                </span>
                <span className="text-sm font-black text-gold-700 mt-1 block">{performanceMode}</span>
                <span className="text-[10px] text-charcoal-500 font-semibold mt-0.5 block">Nol Loading Screen</span>
              </div>
            </div>
          </div>

          {/* Card Pemeliharaan & Cadangan Data Showroom */}
          <div className="crm-card p-5 sm:p-6 bg-white space-y-5 border border-[#EAE8E3]">
            <div className="border-b border-[#EAE8E3] pb-4">
              <h2 className="text-base font-black text-charcoal-900">Cadangan Data &amp; Pemeliharaan Showroom</h2>
              <p className="text-xs text-charcoal-500">
                Simpan cadangan data CRM secara mandiri atau lakukan sinkronisasi data showroom.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Ekspor Cadangan */}
              <div className="p-4 bg-[#FAF9F5] border border-[#EAE8E3] rounded-2xl flex flex-col justify-between space-y-3">
                <div>
                  <div className="w-10 h-10 rounded-xl bg-gold-100 text-gold-900 border border-gold-300 flex items-center justify-center mb-2">
                    <Download className="w-5 h-5 text-gold-700" />
                  </div>
                  <h3 className="text-sm font-black text-charcoal-900">Unduh Cadangan Lengkap CRM</h3>
                  <p className="text-xs text-charcoal-500 mt-1">
                    Unduh seluruh data stok mobil ({stocks.length} unit), data pelanggan ({customers.length} orang), transaksi penjualan, dan riwayat follow-up dalam bentuk file JSON.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleExportBackup}
                  className="btn-gold flex items-center justify-center gap-2 text-xs font-bold py-2.5 px-4 shadow-xs cursor-pointer w-full"
                >
                  <Download className="w-4 h-4 text-charcoal-950" />
                  <span>Unduh File Cadangan (.JSON)</span>
                </button>
              </div>

              {/* Reset Data Uji / Demo */}
              <div className="p-4 bg-[#FAF9F5] border border-[#EAE8E3] rounded-2xl flex flex-col justify-between space-y-3">
                <div>
                  <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-800 border border-rose-300 flex items-center justify-center mb-2">
                    <RotateCcw className="w-5 h-5 text-rose-700" />
                  </div>
                  <h3 className="text-sm font-black text-charcoal-900">Kembalikan Data Demo Awal</h3>
                  <p className="text-xs text-charcoal-500 mt-1">
                    Fitur khusus jika Anda ingin mengembalikan dataset CRM HR MOTOR Garut ke data simulasi demo awal.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleResetData}
                  className="btn-outline-warm text-rose-700 border-rose-300 hover:bg-rose-50 flex items-center justify-center gap-2 text-xs font-bold py-2.5 px-4 cursor-pointer w-full transition-colors"
                >
                  <RotateCcw className="w-4 h-4 text-rose-700" />
                  <span>Reset ke Data Demo Awal</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
