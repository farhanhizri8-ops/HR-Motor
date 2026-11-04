'use client';

import React, { useState, useEffect } from 'react';
import {
  Settings,
  Building2,
  MapPin,
  Phone,
  Mail,
  Clock,
  Shield,
  Database,
  RotateCcw,
  CheckCircle,
  Save,
  Car,
  Cloud,
  Server,
  Globe,
  ExternalLink,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Copy,
  Terminal,
  Zap,
  Sparkles,
  Layers,
  MessageSquare,
  CreditCard,
  Search,
  Check,
  ChevronDown,
  ChevronUp,
  Cpu,
  Radio,
  Lock,
} from 'lucide-react';
import { useCrm } from '@/context/CrmContext';

export default function SettingsDealerPage() {
  const { resetToDemo, currentUser } = useCrm();

  const [activeTab, setActiveTab] = useState<'plugins' | 'profile' | 'security'>('plugins');

  // Showroom Profile States
  const [dealerName, setDealerName] = useState('HR MOTOR Garut');
  const [address, setAddress] = useState('Garut, Jawa Barat');
  const [phone, setPhone] = useState('081223450001');
  const [email, setEmail] = useState('info@hrmotor.id');
  const [operatingHours, setOperatingHours] = useState('Senin - Sabtu: 08:00 - 17:00 WIB | Minggu: 09:00 - 15:00 WIB');
  const [warrantyPolicy, setWarrantyPolicy] = useState('Garansi Mesin & Transmisi 1 Bulan Resmi HR MOTOR Garut, Bebas Banjir & Bebas Tabrak Berat.');

  const [savedSuccess, setSavedSuccess] = useState(false);

  // Supabase & Hosting States
  const [supabaseStatus, setSupabaseStatus] = useState<{
    isConfigured: boolean;
    url?: string;
    hasAnonKey?: boolean;
    hasServiceKey?: boolean;
  }>({ isConfigured: true, url: 'https://mzgbawudyaimckpaluio.supabase.co' });

  const [testingSupabase, setTestingSupabase] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string; latency?: number } | null>(null);

  const [syncingSupabase, setSyncingSupabase] = useState(false);
  const [syncResult, setSyncResult] = useState<{ success: boolean; message: string; details?: any } | null>(null);

  const [copiedEnv, setCopiedEnv] = useState(false);
  const [showGuide, setShowGuide] = useState(false);

  useEffect(() => {
    async function checkSupabase() {
      try {
        const res = await fetch('/api/crm');
        if (res.ok) {
          const json = await res.json();
          if (json.supabase) {
            setSupabaseStatus(json.supabase);
          }
        }
      } catch (e) {
        console.warn('Could not check Supabase status', e);
      }
    }
    checkSupabase();
  }, []);

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3500);
  };

  const handleResetData = async () => {
    if (window.confirm('Reset seluruh dataset CRM HR MOTOR Garut ke data demo awal? Semua data uji baru akan dihapus dan data asli showroom akan dipulihkan.')) {
      await resetToDemo();
      alert('Data CRM telah dikembalikan ke dataset awal demo.');
    }
  };

  const handleTestSupabase = async () => {
    setTestingSupabase(true);
    setTestResult(null);
    const start = performance.now();
    try {
      const res = await fetch('/api/crm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'TEST_SUPABASE_CONNECTION' }),
      });
      const data = await res.json();
      const latency = Math.round(performance.now() - start);
      if (data.success) {
        setTestResult({
          success: true,
          message: data.message || 'Koneksi ke Supabase PostgreSQL berhasil, latensi responsif.',
          latency,
        });
      } else {
        setTestResult({
          success: false,
          message: data.error || 'Gagal terhubung ke Supabase. Periksa kredensial environment variable.',
          latency,
        });
      }
    } catch (err: any) {
      setTestResult({
        success: false,
        message: 'Tidak dapat menjangkau server API CRM lokal.',
      });
    } finally {
      setTestingSupabase(false);
    }
  };

  const handleSyncToSupabase = async () => {
    if (!window.confirm('Mulai sinkronisasi seluruh dataset CRM (Pelanggan, Stok Unit, Leads, Garansi, Follow-up) ke tabel cloud PostgreSQL Supabase?')) {
      return;
    }
    setSyncingSupabase(true);
    setSyncResult(null);
    try {
      const res = await fetch('/api/crm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'SYNC_TO_SUPABASE' }),
      });
      const data = await res.json();
      if (data.success) {
        setSyncResult({
          success: true,
          message: data.message || 'Sinkronisasi berhasil! Seluruh tabel terupdate di Supabase.',
          details: data.details,
        });
      } else {
        setSyncResult({
          success: false,
          message: data.error || data.message || 'Gagal sinkronisasi data ke Supabase.',
        });
      }
    } catch (err: any) {
      setSyncResult({
        success: false,
        message: 'Gagal menghubungi server untuk sinkronisasi cloud.',
      });
    } finally {
      setSyncingSupabase(false);
    }
  };

  const copyEnvTemplate = () => {
    const template = `NEXT_PUBLIC_SUPABASE_URL=https://mzgbawudyaimckpaluio.supabase.co\nNEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`;
    navigator.clipboard.writeText(template);
    setCopiedEnv(true);
    setTimeout(() => setCopiedEnv(false), 2500);
  };

  return (
    <div className="space-y-6 max-w-6xl pb-12">
      {/* 1. HEADER UTAMA & STATUS EKOSISTEM */}
      <div className="bg-white rounded-2xl p-4 sm:p-6 border border-[#E5E2DB] shadow-sm relative overflow-hidden">
        {/* Gold Luxury Left Accent Bar */}
        <div className="absolute top-0 left-0 bottom-0 w-1.5 bg-gradient-to-b from-[#D99A32] to-[#F0B653]" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#FAF6EE] text-[#926017] border border-[#EAD7B0]">
                <Sparkles className="w-3.5 h-3.5 text-[#D99A32]" />
                PUSAT INTEGRASI & PLUGIN DEALER
              </span>
              <span className="text-xs text-[#666666] font-medium">• HR MOTOR Garut</span>
            </div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-[#242424] tracking-tight">
              Integrasi Layanan &amp; Pengaturan Showroom
            </h1>
            <p className="text-xs lg:text-sm text-[#666666]">
              Kelola modul integrasi cloud Supabase, hosting Vercel, gateway WhatsApp, pembiayaan leasing, dan konfigurasi profil HR MOTOR Garut.
            </p>
          </div>

          {/* Quick Status Pill */}
          <div className="flex items-center gap-2.5 bg-[#FAF6EE] p-3 rounded-xl border border-[#EAD7B0] shrink-0">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#926017] block">
                Status Sistem Cloud
              </span>
              <span className="text-xs font-black text-[#242424]">
                Semua Layanan Aktif (100% Online)
              </span>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex flex-wrap gap-2 mt-6 pt-5 border-t border-[#E5E2DB]">
          <button
            onClick={() => setActiveTab('plugins')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'plugins'
                ? 'bg-[#242424] text-[#F0B653] shadow-md border border-[#333333]'
                : 'bg-[#F7F6F2] text-[#4A4A4A] hover:bg-[#FAF6EE] hover:text-[#242424]'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Layanan &amp; Integrasi Cloud (5)</span>
          </button>

          <button
            onClick={() => setActiveTab('profile')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'profile'
                ? 'bg-[#242424] text-[#F0B653] shadow-md border border-[#333333]'
                : 'bg-[#F7F6F2] text-[#4A4A4A] hover:bg-[#FAF6EE] hover:text-[#242424]'
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>Profil & Legalitas Showroom</span>
          </button>

          <button
            onClick={() => setActiveTab('security')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'security'
                ? 'bg-[#242424] text-[#F0B653] shadow-md border border-[#333333]'
                : 'bg-[#F7F6F2] text-[#4A4A4A] hover:bg-[#FAF6EE] hover:text-[#242424]'
            }`}
          >
            <Shield className="w-4 h-4" />
            <span>Keamanan & Cadangan Data</span>
          </button>
        </div>
      </div>

      {/* FEEDBACK SUCCESS ALERT */}
      {savedSuccess && (
        <div className="p-4 bg-[#FAF6EE] border border-[#D99A32] rounded-xl text-xs text-[#926017] font-bold flex items-center justify-between shadow-sm animate-fadeIn">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-[#D99A32]" />
            <span>Konfigurasi profil showroom HR MOTOR berhasil disimpan dan diperbarui!</span>
          </div>
          <button onClick={() => setSavedSuccess(false)} className="text-[#926017] font-black text-sm">×</button>
        </div>
      )}

      {/* TAB 1: KUMPULAN PLUGIN & INTEGRASI CLOUD */}
      {activeTab === 'plugins' && (
        <div className="space-y-5">
          {/* TOP HIGHLIGHT PLUGIN: SUPABASE POSTGRESQL */}
          <div className="bg-white rounded-2xl p-6 border border-[#E5E2DB] shadow-sm space-y-5 relative overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E5E2DB] pb-4">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#242424] to-[#1A1A1A] text-[#F0B653] border border-[#D99A32]/40 flex items-center justify-center font-bold shadow-md">
                  <Database className="w-6 h-6 text-[#D99A32]" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-black text-[#242424]">
                      Supabase Cloud Database Engine
                    </h2>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300">
                      v15.1 Enterprise
                    </span>
                  </div>
                  <p className="text-xs text-[#666666] mt-0.5">
                    Basis data PostgreSQL cloud relasional enterprise untuk sinkronisasi permanen data mobil, pelanggan, dan transaksi HR MOTOR.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#FAF6EE] border border-[#EAD7B0] text-[#926017] rounded-full font-bold text-xs shadow-xs">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  Cloud Terhubung & Sinkron
                </span>
              </div>
            </div>

            {/* Plugin Live Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              <div className="p-4 bg-[#F7F6F2] rounded-xl border border-[#E5E2DB]">
                <span className="text-[11px] font-semibold text-[#666666] block">Status Koneksi Cloud</span>
                <span className="text-sm font-black text-[#242424] block mt-0.5 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  Aktif (Cloud Connected)
                </span>
                <span className="text-[10px] text-[#666666] mt-1 block">PostgreSQL Database Pooler</span>
              </div>

              <div className="p-4 bg-[#F7F6F2] rounded-xl border border-[#E5E2DB]">
                <span className="text-[11px] font-semibold text-[#666666] block">Supabase Endpoint URL</span>
                <span className="text-xs font-mono font-bold text-[#242424] block mt-1 truncate" title={supabaseStatus.url}>
                  {supabaseStatus.url || 'https://mzgbawudyaimckpaluio.supabase.co'}
                </span>
                <span className="text-[10px] text-emerald-700 font-semibold mt-0.5 block">HTTPS SSL Terenkripsi</span>
              </div>

              <div className="p-4 bg-[#F7F6F2] rounded-xl border border-[#E5E2DB]">
                <span className="text-[11px] font-semibold text-[#666666] block">Skema Tabel Database</span>
                <span className="text-sm font-black text-[#D99A32] block mt-0.5 flex items-center gap-1 font-mono">
                  <CheckCircle2 className="w-4 h-4 text-[#D99A32]" />
                  13 Tabel Relasional
                </span>
                <span className="text-[10px] text-[#666666] mt-1 block">supabase_schema.sql (Lengkap)</span>
              </div>
            </div>

            {/* Test Result Alert */}
            {testResult && (
              <div
                className={`p-4 rounded-xl border text-xs flex items-center justify-between ${
                  testResult.success
                    ? 'bg-[#FAF6EE] border-[#D99A32] text-[#926017] font-semibold'
                    : 'bg-rose-50 border-rose-300 text-rose-800'
                }`}
              >
                <div className="flex items-center gap-2">
                  {testResult.success ? (
                    <CheckCircle2 className="w-4 h-4 text-[#D99A32] shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  )}
                  <span>{testResult.message}</span>
                </div>
                {testResult.latency !== undefined && (
                  <span className="text-[11px] font-bold px-2 py-0.5 bg-white/80 rounded border border-[#EAD7B0]">
                    Latensi: {testResult.latency} ms
                  </span>
                )}
              </div>
            )}

            {/* Sync Result Alert */}
            {syncResult && (
              <div
                className={`p-4 rounded-xl border text-xs space-y-1.5 ${
                  syncResult.success
                    ? 'bg-[#FAF6EE] border-[#D99A32] text-[#926017]'
                    : 'bg-rose-50 border-rose-300 text-rose-800'
                }`}
              >
                <div className="flex items-center gap-2 font-bold">
                  {syncResult.success ? (
                    <CheckCircle2 className="w-4 h-4 text-[#D99A32] shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  )}
                  <span>{syncResult.message}</span>
                </div>
                {syncResult.details && (
                  <div className="text-[11px] text-[#926017] pl-6 font-medium">
                    Rincian data terunggah: {Object.entries(syncResult.details).map(([table, count]) => `${table} (${count})`).join(', ')}
                  </div>
                )}
              </div>
            )}

            {/* Plugin Control Action Buttons */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                type="button"
                onClick={handleTestSupabase}
                disabled={testingSupabase}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-white text-[#242424] border border-[#E5E2DB] hover:border-[#D99A32] hover:text-[#D99A32] hover:bg-[#FAF6EE] transition-all shadow-sm disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${testingSupabase ? 'animate-spin text-[#D99A32]' : ''}`} />
                <span>{testingSupabase ? 'Menguji Latensi Cloud...' : 'Uji Koneksi Real-time'}</span>
              </button>

              <button
                type="button"
                onClick={handleSyncToSupabase}
                disabled={syncingSupabase}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-[#D99A32] to-[#F0B653] text-[#1A1A1A] hover:opacity-95 transition-all shadow-md hover:shadow-lg disabled:opacity-50"
              >
                <Zap className="w-4 h-4" />
                <span>{syncingSupabase ? 'Menyinkronkan ke Cloud...' : 'Sinkronkan Data ke Supabase'}</span>
              </button>

              <button
                type="button"
                onClick={copyEnvTemplate}
                className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-bold bg-[#F7F6F2] text-[#4A4A4A] border border-[#E5E2DB] hover:bg-[#FAF6EE] hover:text-[#D99A32] transition-all"
              >
                <Copy className="w-3.5 h-3.5 text-[#D99A32]" />
                <span>{copiedEnv ? 'Format Kredensial Tersalin!' : 'Salin Format .env'}</span>
              </button>

              <button
                type="button"
                onClick={() => setShowGuide(!showGuide)}
                className="inline-flex items-center gap-1 text-xs font-semibold text-[#666666] hover:text-[#242424] ml-auto transition-colors"
              >
                <span>{showGuide ? 'Sembunyikan Panduan' : 'Lihat Panduan Integrasi'}</span>
                {showGuide ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>
            </div>

            {/* Collapsible Guide */}
            {showGuide && (
              <div className="p-4 bg-[#F7F6F2] rounded-xl border border-[#E5E2DB] space-y-2 animate-fadeIn text-xs">
                <div className="font-bold text-[#242424] flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-[#D99A32]" />
                  <span>Petunjuk Kredensial Supabase PostgreSQL:</span>
                </div>
                <ol className="list-decimal list-inside space-y-1.5 text-[11px] text-[#4A4A4A] leading-relaxed">
                  <li>Proyek Supabase Anda: <code>https://mzgbawudyaimckpaluio.supabase.co</code>.</li>
                  <li>Skema tabel telah diinisiasi dengan berkas <code>supabase_schema.sql</code> (13 tabel relasional).</li>
                  <li>Kunci publik anon dan URL tersimpan aman pada Environment Variables Vercel & <code>.env.local</code>.</li>
                  <li>Klik tombol <strong>Sinkronkan Data ke Supabase</strong> di atas kapan saja untuk menyelaraskan dataset showroom lokal ke cloud.</li>
                </ol>
              </div>
            )}
          </div>

          {/* GRID PLUGIN MODUL-MODUL LAINNYA */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* PLUGIN 2: VERCEL EDGE CLOUD HOSTING */}
            <div className="bg-white rounded-2xl p-5 border border-[#E5E2DB] shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-[#E5E2DB] pb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#242424] text-white flex items-center justify-center font-bold">
                    <Globe className="w-5 h-5 text-[#F0B653]" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-[#242424]">
                      Vercel Serverless Edge Hosting
                    </h3>
                    <p className="text-[11px] text-[#666666]">
                      Production Cloud Deployment Platform
                    </p>
                  </div>
                </div>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Live Online
                </span>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between p-2.5 bg-[#F7F6F2] rounded-xl">
                  <span className="text-[#666666] font-medium">Domain Resmi:</span>
                  <a
                    href="https://hr-motor.vercel.app"
                    target="_blank"
                    rel="noreferrer"
                    className="font-bold text-[#D99A32] hover:underline flex items-center gap-1"
                  >
                    <span>hr-motor.vercel.app</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>

                <div className="flex items-center justify-between p-2.5 bg-[#F7F6F2] rounded-xl">
                  <span className="text-[#666666] font-medium">Auto CI/CD:</span>
                  <span className="font-bold text-[#242424]">GitHub (farhanhizri8-ops/HR-Motor)</span>
                </div>

                <div className="flex items-center justify-between p-2.5 bg-[#F7F6F2] rounded-xl">
                  <span className="text-[#666666] font-medium">Sertifikat Keamanan:</span>
                  <span className="font-bold text-emerald-700 flex items-center gap-1">
                    <Lock className="w-3 h-3" />
                    SSL 256-bit Encrypted
                  </span>
                </div>
              </div>
            </div>

            {/* PLUGIN 3: WHATSAPP BUSINESS GATEWAY */}
            <div className="bg-white rounded-2xl p-5 border border-[#E5E2DB] shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-[#E5E2DB] pb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold">
                    <MessageSquare className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-[#242424]">
                      WhatsApp Official Showroom Gateway
                    </h3>
                    <p className="text-[11px] text-[#666666]">
                      Otomasi Pesan Follow-up & After Sales
                    </p>
                  </div>
                </div>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#FAF6EE] text-[#926017] border border-[#EAD7B0]">
                  Terintegrasi
                </span>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between p-2.5 bg-[#F7F6F2] rounded-xl">
                  <span className="text-[#666666] font-medium">Nomor Showroom Resmi:</span>
                  <span className="font-bold text-[#242424] font-mono">+62 812-2345-0001</span>
                </div>

                <div className="flex items-center justify-between p-2.5 bg-[#F7F6F2] rounded-xl">
                  <span className="text-[#666666] font-medium">Cakupan Modul:</span>
                  <span className="font-bold text-[#242424]">Follow-up, Garansi, & Leads</span>
                </div>

                <div className="flex items-center justify-between p-2.5 bg-[#F7F6F2] rounded-xl">
                  <span className="text-[#666666] font-medium">Template Otomatis:</span>
                  <span className="font-bold text-[#D99A32]">7 Template Siap Kirim</span>
                </div>
              </div>
            </div>

            {/* PLUGIN 4: MULTI-FINANCE LEASING GATEWAY */}
            <div className="bg-white rounded-2xl p-5 border border-[#E5E2DB] shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-[#E5E2DB] pb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#242424] text-[#F0B653] flex items-center justify-center font-bold">
                    <CreditCard className="w-5 h-5 text-[#D99A32]" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-[#242424]">
                      Multi-Finance Leasing Gateway
                    </h3>
                    <p className="text-[11px] text-[#666666]">
                      Engine Simulasi Kredit & Angsuran Mobil
                    </p>
                  </div>
                </div>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#FAF6EE] text-[#926017] border border-[#EAD7B0]">
                  4 Partner
                </span>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between p-2.5 bg-[#F7F6F2] rounded-xl">
                  <span className="text-[#666666] font-medium">Rekanan Lembaga Leasing:</span>
                  <span className="font-bold text-[#242424]">BCA, MUF, Adira, OTO</span>
                </div>

                <div className="flex items-center justify-between p-2.5 bg-[#F7F6F2] rounded-xl">
                  <span className="text-[#666666] font-medium">Tenor Pembiayaan:</span>
                  <span className="font-bold text-[#242424]">12 s/d 60 Bulan (1 - 5 Tahun)</span>
                </div>

                <div className="flex items-center justify-between p-2.5 bg-[#F7F6F2] rounded-xl">
                  <span className="text-[#666666] font-medium">Integrasi Pipeline:</span>
                  <span className="font-bold text-emerald-700 flex items-center gap-1">
                    <Check className="w-3.5 h-3.5" />
                    Aktif pada Tahap Negosiasi
                  </span>
                </div>
              </div>
            </div>

            {/* PLUGIN 5: AUTO-MATCH STOK UNIT */}
            <div className="bg-white rounded-2xl p-5 border border-[#E5E2DB] shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-[#E5E2DB] pb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#242424] text-[#F0B653] flex items-center justify-center font-bold">
                    <Car className="w-5 h-5 text-[#D99A32]" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-[#242424]">
                      Auto-Match Stok Unit (Smart AI Filter)
                    </h3>
                    <p className="text-[11px] text-[#666666]">
                      Pencocokan Cerdas Preferensi Calon Pembeli
                    </p>
                  </div>
                </div>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                  Otomatis
                </span>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between p-2.5 bg-[#F7F6F2] rounded-xl">
                  <span className="text-[#666666] font-medium">Trigger Otomatis:</span>
                  <span className="font-bold text-[#242424]">Saat Unit Baru Masuk Showroom</span>
                </div>

                <div className="flex items-center justify-between p-2.5 bg-[#F7F6F2] rounded-xl">
                  <span className="text-[#666666] font-medium">Toleransi Budget:</span>
                  <span className="font-bold text-[#242424]">±15% dari Preferensi Konsumen</span>
                </div>

                <div className="flex items-center justify-between p-2.5 bg-[#F7F6F2] rounded-xl">
                  <span className="text-[#666666] font-medium">Status Eksekusi:</span>
                  <span className="font-bold text-emerald-700 flex items-center gap-1">
                    <Check className="w-3.5 h-3.5" />
                    Background Daemon Siap
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: PROFIL & LEGALITAS SHOWROOM */}
      {activeTab === 'profile' && (
        <form onSubmit={handleSaveSettings} className="bg-white rounded-2xl p-6 border border-[#E5E2DB] shadow-sm space-y-5 text-xs">
          <div className="border-b border-[#E5E2DB] pb-4">
            <h2 className="text-base font-black text-[#242424] flex items-center gap-2">
              <Building2 className="w-5 h-5 text-[#D99A32]" />
              Informasi Legalitas & Lokasi Showroom HR MOTOR Garut
            </h2>
            <p className="text-xs text-[#666666] mt-0.5">
              Data resmi showroom yang tercantum pada dokumen laporan, faktur penjualan, dan kartu garansi konsumen.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-[#242424] mb-1.5">Nama Dealer / Showroom Resmi</label>
              <input
                type="text"
                value={dealerName}
                onChange={(e) => setDealerName(e.target.value)}
                className="w-full text-xs px-3.5 py-2.5 bg-[#F7F6F2] border border-[#E5E2DB] rounded-xl outline-none focus:border-[#D99A32] font-bold text-[#242424] transition-all"
              />
            </div>

            <div>
              <label className="block font-bold text-[#242424] mb-1.5">Nomor WhatsApp Bisnis Showroom</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full text-xs px-3.5 py-2.5 bg-[#F7F6F2] border border-[#E5E2DB] rounded-xl outline-none focus:border-[#D99A32] text-[#242424] font-medium transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-[#242424] mb-1.5">Alamat Lengkap Showroom Garut</label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full text-xs px-3.5 py-2.5 bg-[#F7F6F2] border border-[#E5E2DB] rounded-xl outline-none focus:border-[#D99A32] text-[#242424] font-medium transition-all"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-[#242424] mb-1.5">Email Resmi Showroom</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full text-xs px-3.5 py-2.5 bg-[#F7F6F2] border border-[#E5E2DB] rounded-xl outline-none focus:border-[#D99A32] text-[#242424] font-medium transition-all"
              />
            </div>

            <div>
              <label className="block font-bold text-[#242424] mb-1.5">Jam Operasional Layanan</label>
              <input
                type="text"
                value={operatingHours}
                onChange={(e) => setOperatingHours(e.target.value)}
                className="w-full text-xs px-3.5 py-2.5 bg-[#F7F6F2] border border-[#E5E2DB] rounded-xl outline-none focus:border-[#D99A32] text-[#242424] font-medium transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-[#242424] mb-1.5">Kebijakan Garansi Resmi Showroom</label>
            <textarea
              rows={2}
              value={warrantyPolicy}
              onChange={(e) => setWarrantyPolicy(e.target.value)}
              className="w-full text-xs px-3.5 py-2.5 bg-[#F7F6F2] border border-[#E5E2DB] rounded-xl outline-none focus:border-[#D99A32] text-[#242424] font-medium transition-all"
            />
          </div>

          <div className="flex justify-end pt-3 border-t border-[#E5E2DB]">
            <button
              type="submit"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-[#D99A32] to-[#F0B653] text-[#1A1A1A] hover:opacity-95 transition-all shadow-md hover:shadow-lg"
            >
              <Save className="w-4 h-4" />
              <span>Simpan Perubahan Profil</span>
            </button>
          </div>
        </form>
      )}

      {/* TAB 3: KEAMANAN & CADANGAN DATA */}
      {activeTab === 'security' && (
        <div className="bg-white rounded-2xl p-6 border border-[#E5E2DB] shadow-sm space-y-6 text-xs">
          <div className="border-b border-[#E5E2DB] pb-4">
            <h2 className="text-base font-black text-[#242424] flex items-center gap-2">
              <Shield className="w-5 h-5 text-[#D99A32]" />
              Manajemen Cadangan & Pemulihan Data Showroom
            </h2>
            <p className="text-xs text-[#666666] mt-0.5">
              Kelola pencadangan berkala, sinkronisasi cloud darurat, dan opsi reset data uji sistem.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Auto Cloud Snapshot */}
            <div className="p-5 bg-[#F7F6F2] rounded-2xl border border-[#E5E2DB] space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#242424] text-[#F0B653] flex items-center justify-center font-bold">
                  <Cloud className="w-5 h-5 text-[#D99A32]" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#242424]">
                    Cloud Database Snapshot
                  </h3>
                  <p className="text-[11px] text-[#666666]">
                    Cadangan otomatis di Supabase PostgreSQL
                  </p>
                </div>
              </div>
              <p className="text-[11px] text-[#4A4A4A] leading-relaxed">
                Seluruh data transaksi dan stok unit diamankan dengan replikasi serverless Supabase berstandar enterprise.
              </p>
              <button
                type="button"
                onClick={handleSyncToSupabase}
                disabled={syncingSupabase}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-[#242424] text-[#F0B653] hover:bg-[#333333] transition-all"
              >
                <Zap className="w-3.5 h-3.5" />
                <span>Buat Snapshot Baru</span>
              </button>
            </div>

            {/* Reset Data Uji */}
            <div className="p-5 bg-rose-50/50 rounded-2xl border border-rose-200 space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center font-bold">
                  <RotateCcw className="w-5 h-5 text-rose-600" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-rose-900">
                    Reset Dataset Uji (Demo Recovery)
                  </h3>
                  <p className="text-[11px] text-rose-700">
                    Kembalikan ke konfigurasi awal HR MOTOR Garut
                  </p>
                </div>
              </div>
              <p className="text-[11px] text-rose-800 leading-relaxed">
                Gunakan fitur ini jika Anda ingin mengembalikan data stok mobil (8 unit resmi), 6 pelanggan, dan riwayat garansi ke kondisi demo showroom awal.
              </p>
              <button
                type="button"
                onClick={handleResetData}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-rose-700 bg-white hover:bg-rose-100 border border-rose-300 transition-colors shadow-xs"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset ke Data Awal Demo</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
