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
} from 'lucide-react';
import { useCrm } from '@/context/CrmContext';

export default function SettingsDealerPage() {
  const { resetToDemo, currentUser } = useCrm();

  const [dealerName, setDealerName] = useState('HR MOTOR');
  const [address, setAddress] = useState('Jl. Otista No. 128, Tarogong Kidul, Garut, Jawa Barat');
  const [phone, setPhone] = useState('081223450001');
  const [email, setEmail] = useState('info@hrmotor.id');
  const [operatingHours, setOperatingHours] = useState('Senin - Sabtu: 08:00 - 17:00 WIB | Minggu: 09:00 - 15:00 WIB');
  const [warrantyPolicy, setWarrantyPolicy] = useState('Garansi Mesin & Transmisi 1 Bulan Resmi HR MOTOR, Garansi Bebas Banjir & Bebas Tabrak Berat.');

  const [savedSuccess, setSavedSuccess] = useState(false);

  // Supabase & Hosting States
  const [supabaseStatus, setSupabaseStatus] = useState<{
    isConfigured: boolean;
    url?: string;
    hasAnonKey?: boolean;
    hasServiceKey?: boolean;
  }>({ isConfigured: false });

  const [testingSupabase, setTestingSupabase] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  const [syncingSupabase, setSyncingSupabase] = useState(false);
  const [syncResult, setSyncResult] = useState<{ success: boolean; message: string; details?: any } | null>(null);

  const [copiedEnv, setCopiedEnv] = useState(false);

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
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const handleResetData = async () => {
    if (window.confirm('Reset seluruh dataset CRM HR MOTOR Garut ke data demo awal? Semua data uji baru akan dihapus.')) {
      await resetToDemo();
      alert('Data CRM telah dikembalikan ke dataset awal.');
    }
  };

  const handleTestSupabase = async () => {
    setTestingSupabase(true);
    setTestResult(null);
    try {
      const res = await fetch('/api/crm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'TEST_SUPABASE_CONNECTION' }),
      });
      const data = await res.json();
      if (data.success) {
        setTestResult({
          success: true,
          message: data.message || 'Koneksi ke Supabase berhasil dan responsif!',
        });
      } else {
        setTestResult({
          success: false,
          message: data.error || 'Gagal terhubung ke Supabase. Periksa URL dan Anon Key Anda.',
        });
      }
    } catch (err: any) {
      setTestResult({
        success: false,
        message: 'Tidak dapat menjangkau server API CRM.',
      });
    } finally {
      setTestingSupabase(false);
    }
  };

  const handleSyncToSupabase = async () => {
    if (!window.confirm('Mulai sinkronisasi seluruh data CRM (Pelanggan, Stok Unit, Leads, Garansi, Follow-up) ke tabel PostgreSQL Supabase?')) {
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
          message: data.message,
          details: data.details,
        });
      } else {
        setSyncResult({
          success: false,
          message: data.error || data.message || 'Gagal sinkronisasi ke Supabase.',
        });
      }
    } catch (err: any) {
      setSyncResult({
        success: false,
        message: 'Gagal menghubungi server untuk sinkronisasi.',
      });
    } finally {
      setSyncingSupabase(false);
    }
  };

  const copyEnvTemplate = () => {
    const template = `NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co\nNEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`;
    navigator.clipboard.writeText(template);
    setCopiedEnv(true);
    setTimeout(() => setCopiedEnv(false), 2500);
  };

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">
              Konfigurasi Showroom & Cloud
            </span>
            <span className="text-xs text-slate-400">•</span>
            <span className="text-xs text-slate-500">Cabang Garut Pusat</span>
          </div>
          <h1 className="text-xl lg:text-2xl font-black text-slate-900 mt-1">
            Settings, Supabase & Hosting CRM
          </h1>
          <p className="text-xs text-slate-500">
            Pengaturan identitas dealer HR MOTOR, integrasi database Supabase PostgreSQL, dan panduan hosting Vercel.
          </p>
        </div>
      </div>

      {savedSuccess && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 font-semibold flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-600" />
          Pengaturan profil showroom HR MOTOR berhasil disimpan.
        </div>
      )}

      {/* 1. Supabase Cloud Integration Panel */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4 text-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
              <Cloud className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                Database Cloud: Supabase PostgreSQL
              </h2>
              <p className="text-[11px] text-slate-500">
                Penyimpanan data cloud relasional permanen untuk HR MOTOR CRM.
              </p>
            </div>
          </div>
          <div>
            {supabaseStatus.isConfigured ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-full font-bold text-xs">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Supabase Terhubung
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 border border-amber-200 text-amber-700 rounded-full font-bold text-xs">
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                Mode Lokal (Menunggu Supabase Key)
              </span>
            )}
          </div>
        </div>

        {/* Status Details */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <span className="text-[11px] text-slate-500 block mb-1">Status Konfigurasi:</span>
            <span className="font-bold text-slate-900 block text-xs">
              {supabaseStatus.isConfigured ? 'Aktif (Cloud Connected)' : 'Lokal (data/crm_store.json)'}
            </span>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <span className="text-[11px] text-slate-500 block mb-1">Supabase Endpoint:</span>
            <span className="font-bold text-slate-900 block text-xs truncate">
              {supabaseStatus.url || 'Belum diatur di .env.local'}
            </span>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <span className="text-[11px] text-slate-500 block mb-1">Skema Database SQL:</span>
            <span className="font-bold text-emerald-600 block text-xs flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              supabase_schema.sql (13 Tabel)
            </span>
          </div>
        </div>

        {/* Test Result Alert */}
        {testResult && (
          <div
            className={`p-3 rounded-xl border text-xs flex items-center gap-2 ${
              testResult.success
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : 'bg-rose-50 border-rose-200 text-rose-800'
            }`}
          >
            {testResult.success ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{testResult.message}</span>
          </div>
        )}

        {/* Sync Result Alert */}
        {syncResult && (
          <div
            className={`p-3 rounded-xl border text-xs space-y-1 ${
              syncResult.success
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : 'bg-rose-50 border-rose-200 text-rose-800'
            }`}
          >
            <div className="flex items-center gap-2 font-bold">
              {syncResult.success ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              )}
              <span>{syncResult.message}</span>
            </div>
            {syncResult.details && (
              <div className="text-[11px] text-emerald-700 pl-6">
                Rincian data terunggah: {Object.entries(syncResult.details).map(([table, count]) => `${table} (${count})`).join(', ')}
              </div>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2 pt-2">
          <button
            type="button"
            onClick={handleTestSupabase}
            disabled={testingSupabase}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-slate-800 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-xl transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${testingSupabase ? 'animate-spin' : ''}`} />
            {testingSupabase ? 'Menguji Koneksi...' : 'Uji Koneksi Supabase'}
          </button>

          <button
            type="button"
            onClick={handleSyncToSupabase}
            disabled={syncingSupabase || !supabaseStatus.isConfigured}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-colors shadow-xs disabled:opacity-50"
          >
            <Zap className="w-3.5 h-3.5" />
            {syncingSupabase ? 'Menyinkronkan...' : 'Sinkronkan Data ke Supabase'}
          </button>

          <button
            type="button"
            onClick={copyEnvTemplate}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors ml-auto"
          >
            <Copy className="w-3.5 h-3.5" />
            {copiedEnv ? 'Tersalin!' : 'Salin Format .env'}
          </button>
        </div>

        {/* Info Guide Card */}
        <div className="p-4 bg-emerald-50/50 rounded-xl border border-emerald-100 space-y-2 mt-2">
          <div className="font-bold text-emerald-950 flex items-center gap-1.5">
            <Terminal className="w-4 h-4 text-emerald-600" />
            Petunjuk Singkat Menghubungkan Supabase:
          </div>
          <ol className="list-decimal list-inside space-y-1 text-[11px] text-emerald-900/80 leading-relaxed">
            <li>Buka dashboard <strong>Supabase.com</strong> dan buat proyek baru (contoh: <code>hr-motor-crm</code>).</li>
            <li>Masuk ke menu <strong>SQL Editor</strong> di Supabase, buka berkas <code>supabase_schema.sql</code> di proyek ini, salin seluruh kodenya lalu klik <strong>Run</strong>.</li>
            <li>Buka <strong>Project Settings</strong> → <strong>API</strong>, salin <code>Project URL</code> dan <code>anon public key</code>.</li>
            <li>Buat file <code>.env.local</code> di folder proyek dan tempel kunci tersebut (atau masukkan di menu Environment Variables Vercel).</li>
          </ol>
        </div>
      </div>

      {/* 2. Hosting & Deployment Guide Panel */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4 text-xs">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
          <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
            <Globe className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900">
              Hosting & Deployment CRM (Vercel)
            </h2>
            <p className="text-[11px] text-slate-500">
              Rekomendasi platform hosting gratis, cepat, dan terintegrasi otomatis dengan Next.js.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
            <span className="font-bold text-slate-900 block flex items-center gap-1.5">
              <Server className="w-3.5 h-3.5 text-blue-600" />
              Langkah Hosting di Vercel:
            </span>
            <ul className="space-y-1.5 text-[11px] text-slate-600 leading-relaxed">
              <li>1. Upload kode ke repository <strong>GitHub</strong> pribadi.</li>
              <li>2. Buka <strong>vercel.com</strong> dan login dengan akun GitHub.</li>
              <li>3. Klik <strong>Add New Project</strong> dan pilih repository HR MOTOR CRM.</li>
              <li>4. Masukkan Environment Variables (<code>NEXT_PUBLIC_SUPABASE_URL</code> dan <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code>).</li>
              <li>5. Klik <strong>Deploy</strong>. Dalam 1-2 menit aplikasi sudah aktif online dengan HTTPS gratis!</li>
            </ul>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
            <span className="font-bold text-slate-900 block flex items-center gap-1.5">
              <RotateCcw className="w-3.5 h-3.5 text-rose-600" />
              Reset Data Pengujian (Demo):
            </span>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Berguna saat presentasi tugas akhir / evaluasi showroom untuk mengembalikan data ke kondisi awal HR MOTOR Garut (8 stok mobil, 6 pelanggan, 3 follow-up, 6 garansi).
            </p>
            <button
              onClick={handleResetData}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset ke Data Awal Demo
            </button>
          </div>
        </div>
      </div>

      {/* 3. Showroom Identity Form */}
      <form onSubmit={handleSaveSettings} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4 text-xs">
        <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
          <Building2 className="w-4 h-4 text-emerald-600" />
          Informasi Legal & Lokasi Showroom
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Nama Dealer / Showroom</label>
            <input
              type="text"
              value={dealerName}
              onChange={(e) => setDealerName(e.target.value)}
              className="w-full text-xs p-2.5 border border-slate-300 rounded-lg outline-none font-bold text-slate-900"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Nomor WhatsApp Bisnis Resmi</label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full text-xs p-2.5 border border-slate-300 rounded-lg outline-none"
            />
          </div>
        </div>

        <div>
          <label className="block font-semibold text-slate-700 mb-1">Alamat Lengkap Showroom Garut</label>
          <input
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className="w-full text-xs p-2.5 border border-slate-300 rounded-lg outline-none"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Email Resmi</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full text-xs p-2.5 border border-slate-300 rounded-lg outline-none"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Jam Operasional Layanan</label>
            <input
              type="text"
              value={operatingHours}
              onChange={(e) => setOperatingHours(e.target.value)}
              className="w-full text-xs p-2.5 border border-slate-300 rounded-lg outline-none"
            />
          </div>
        </div>

        <div>
          <label className="block font-semibold text-slate-700 mb-1">Kebijakan Garansi Showroom</label>
          <textarea
            rows={2}
            value={warrantyPolicy}
            onChange={(e) => setWarrantyPolicy(e.target.value)}
            className="w-full text-xs p-2.5 border border-slate-300 rounded-lg outline-none"
          />
        </div>

        <div className="flex justify-end pt-3 border-t border-slate-100">
          <button
            type="submit"
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition-colors"
          >
            <Save className="w-3.5 h-3.5" />
            Simpan Perubahan Profil
          </button>
        </div>
      </form>
    </div>
  );
}
