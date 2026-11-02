'use client';

import React, { useState } from 'react';
import {
  Lock,
  Mail,
  User as UserIcon,
  Phone,
  ShieldCheck,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  UserCheck,
  KeyRound,
} from 'lucide-react';
import { useCrm } from '@/context/CrmContext';
import { UserRole } from '@/types/crm';

export const LoginScreen: React.FC = () => {
  const { login, registerUser } = useCrm();

  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Register Form States
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regRole, setRegRole] = useState<UserRole>('Sales Representative');

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!email.trim()) {
      setErrorMsg('Silakan masukkan email akun Anda.');
      return;
    }
    if (!password) {
      setErrorMsg('Silakan masukkan kata sandi Anda.');
      return;
    }

    setLoading(true);
    const res = await login(email, password);
    setLoading(false);

    if (!res.success) {
      setErrorMsg(res.error || 'Gagal masuk ke sistem.');
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!regName.trim()) {
      setErrorMsg('Nama lengkap karyawan wajib diisi.');
      return;
    }
    if (!regEmail.trim()) {
      setErrorMsg('Email karyawan wajib diisi.');
      return;
    }
    if (!regPassword) {
      setErrorMsg('Kata sandi wajib diisi.');
      return;
    }

    setLoading(true);
    const res = await registerUser({
      name: regName.trim(),
      email: regEmail.trim(),
      phone: regPhone.trim(),
      role: regRole,
      password: regPassword,
    });
    setLoading(false);

    if (res.success) {
      setSuccessMsg(
        'Pengajuan akun berhasil dikirim! Status akun Anda adalah "Menunggu Persetujuan". Silakan hubungi Owner (farhanhizri8@gmail.com) untuk disetujui sebelum login.'
      );
      setMode('login');
      setEmail(regEmail.trim());
      setPassword('');
      setRegName('');
      setRegEmail('');
      setRegPhone('');
      setRegPassword('');
    } else {
      setErrorMsg(res.error || 'Gagal mengajukan akun baru.');
    }
  };

  const fillQuickPreset = (presetEmail: string, presetPw: string) => {
    setEmail(presetEmail);
    setPassword(presetPw);
    setErrorMsg('');
  };

  return (
    <div className="min-h-screen bg-[#1A1A1A] text-slate-100 flex flex-col justify-center items-center p-4 sm:p-6 relative overflow-hidden font-sans">
      {/* Subtle Background Glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[350px] bg-gold-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 right-10 w-[400px] h-[300px] bg-gold-600/5 rounded-full blur-[100px] pointer-events-none" />

      {/* Main Container */}
      <div className="w-full max-w-md z-10 space-y-6">
        {/* Header & Brand Identity */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-[#242424] border border-gold-500/30 shadow-2xl">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logo.png?v=3"
              alt="HR MOTOR Logo"
              className="h-14 sm:h-16 w-auto object-contain drop-shadow"
            />
          </div>

          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gold-500/10 border border-gold-500/30 text-gold-400 text-[11px] font-bold tracking-wider uppercase mb-1">
              <Sparkles className="w-3 h-3 text-gold-400" />
              Sistem Manajemen Showroom CRM Resmi
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-wide">
              HR MOTOR GARUT
            </h1>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              Portal Akses Otentikasi & Otorisasi Karyawan Showroom Mobil Bekas Berkualitas
            </p>
          </div>
        </div>

        {/* Card Box */}
        <div className="bg-[#242424] border border-[#333333] rounded-2xl shadow-2xl overflow-hidden backdrop-blur-md">
          {/* Mode Switcher Tabs */}
          <div className="grid grid-cols-2 border-b border-[#333333] bg-[#1E1E1E]">
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setErrorMsg('');
              }}
              className={`py-3 text-xs font-bold transition-all flex items-center justify-center gap-2 border-b-2 ${
                mode === 'login'
                  ? 'border-gold-500 text-gold-400 bg-[#242424]'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <KeyRound className="w-3.5 h-3.5" />
              Masuk ke CRM
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('register');
                setErrorMsg('');
              }}
              className={`py-3 text-xs font-bold transition-all flex items-center justify-center gap-2 border-b-2 ${
                mode === 'register'
                  ? 'border-gold-500 text-gold-400 bg-[#242424]'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <UserCheck className="w-3.5 h-3.5" />
              Ajukan Akun Baru
            </button>
          </div>

          <div className="p-6 space-y-5">
            {/* Success Message Banner */}
            {successMsg && (
              <div className="p-3.5 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-200 text-xs flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span className="leading-relaxed">{successMsg}</span>
              </div>
            )}

            {/* Error Message Banner */}
            {errorMsg && (
              <div className="p-3.5 rounded-xl bg-rose-950/70 border border-rose-500/50 text-rose-200 text-xs flex items-start gap-2.5 animate-shake">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <span className="leading-relaxed">{errorMsg}</span>
              </div>
            )}

            {/* FORM: LOGIN */}
            {mode === 'login' && (
              <form onSubmit={handleLoginSubmit} className="space-y-4">
                {/* Email Field */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                    Email Pengguna
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="farhanhizri8@gmail.com"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#1A1A1A] border border-[#3A3A3A] text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-gold-500 focus:ring-1 focus:ring-gold-500 transition-colors"
                    />
                  </div>
                </div>

                {/* Password Field */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                    Kata Sandi
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-10 pr-11 py-2.5 rounded-xl bg-[#1A1A1A] border border-[#3A3A3A] text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-gold-500 focus:ring-1 focus:ring-gold-500 transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 p-1"
                      title={showPassword ? 'Sembunyikan sandi' : 'Tampilkan sandi'}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 px-4 rounded-xl btn-gold text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg hover:shadow-gold-500/20 transition-all disabled:opacity-50"
                >
                  {loading ? (
                    <span className="inline-block w-4 h-4 border-2 border-charcoal-900 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>Masuk ke Dashboard CRM</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            )}

            {/* FORM: REGISTER NEW ACCOUNT */}
            {mode === 'register' && (
              <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
                {/* Notice on Approval */}
                <div className="p-3 rounded-xl bg-amber-950/40 border border-amber-500/30 text-amber-300 text-[11px] leading-relaxed flex items-start gap-2">
                  <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">Otorisasi Khusus:</span> Pendaftaran akun baru wajib disetujui langsung oleh Owner resmi (<strong>farhanhizri8@gmail.com</strong>). Akun tidak dapat login sebelum di-approve.
                  </div>
                </div>

                {/* Full Name */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">
                    Nama Lengkap Karyawan
                  </label>
                  <div className="relative">
                    <UserIcon className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      value={regName}
                      onChange={(e) => setRegName(e.target.value)}
                      placeholder="Nama Lengkap"
                      className="w-full pl-10 pr-4 py-2 rounded-xl bg-[#1A1A1A] border border-[#3A3A3A] text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-gold-500"
                    />
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">
                    Email Resmi Karyawan
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      required
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      placeholder="karyawan@hrmotor.id"
                      className="w-full pl-10 pr-4 py-2 rounded-xl bg-[#1A1A1A] border border-[#3A3A3A] text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-gold-500"
                    />
                  </div>
                </div>

                {/* WhatsApp Phone */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">
                    No. WhatsApp
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={regPhone}
                      onChange={(e) => setRegPhone(e.target.value)}
                      placeholder="081234567890"
                      className="w-full pl-10 pr-4 py-2 rounded-xl bg-[#1A1A1A] border border-[#3A3A3A] text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-gold-500 font-mono"
                    />
                  </div>
                </div>

                {/* Role */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">
                    Posisi / Peran di Showroom
                  </label>
                  <select
                    value={regRole}
                    onChange={(e) => setRegRole(e.target.value as UserRole)}
                    className="w-full px-3 py-2 rounded-xl bg-[#1A1A1A] border border-[#3A3A3A] text-white text-xs focus:outline-none focus:border-gold-500"
                  >
                    <option value="Sales Representative">Sales Representative</option>
                    <option value="CRM Administrator">CRM Administrator</option>
                    <option value="Marketing">Marketing</option>
                    <option value="WhatsApp Administrator">WhatsApp Administrator</option>
                  </select>
                </div>

                {/* Password */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">
                    Buat Kata Sandi
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="password"
                      required
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      placeholder="Minimal 6 karakter"
                      className="w-full pl-10 pr-4 py-2 rounded-xl bg-[#1A1A1A] border border-[#3A3A3A] text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-gold-500"
                    />
                  </div>
                </div>

                {/* Submit Register */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 px-4 rounded-xl bg-gold-500 hover:bg-gold-400 text-charcoal-950 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all mt-2 disabled:opacity-50"
                >
                  {loading ? (
                    <span className="inline-block w-4 h-4 border-2 border-charcoal-900 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>Ajukan Akun ke Owner</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            )}

            {/* Quick Presets for Evaluation */}
            <div className="pt-4 border-t border-[#333333] space-y-2">
              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <span className="font-semibold uppercase tracking-wider text-[10px]">
                  Akun Demo Resmi Showroom:
                </span>
                <span className="text-[10px] text-gold-400 font-mono">Sandi: Garut2005</span>
              </div>
              <div className="space-y-1.5">
                {/* Owner Preset */}
                <button
                  type="button"
                  onClick={() => fillQuickPreset('farhanhizri8@gmail.com', 'Garut2005')}
                  className="w-full text-left p-2 rounded-xl bg-[#1C1C1C] hover:bg-[#282828] border border-gold-500/40 hover:border-gold-400 transition-all flex items-center justify-between group"
                >
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-gold-400" />
                    <div>
                      <p className="text-xs font-bold text-gold-300 group-hover:text-gold-200">
                        Farhan Hizri (Owner)
                      </p>
                      <p className="text-[10px] text-slate-400 font-mono">farhanhizri8@gmail.com</p>
                    </div>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-gold-500/20 text-gold-300 border border-gold-500/30 font-bold">
                    Hak Setujui Akun
                  </span>
                </button>

                {/* Approved Staff Preset */}
                <button
                  type="button"
                  onClick={() => fillQuickPreset('admin@hrmotor.id', 'Garut2005')}
                  className="w-full text-left p-2 rounded-xl bg-[#1C1C1C] hover:bg-[#282828] border border-[#333333] hover:border-slate-400 transition-all flex items-center justify-between group"
                >
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    <div>
                      <p className="text-xs font-bold text-slate-200">Deni Pratama (CRM Admin)</p>
                      <p className="text-[10px] text-slate-400 font-mono">admin@hrmotor.id</p>
                    </div>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
                    Disetujui
                  </span>
                </button>

                {/* Unapproved Staff Preset to test approval block */}
                <button
                  type="button"
                  onClick={() => fillQuickPreset('sales.budi@hrmotor.id', 'Garut2005')}
                  className="w-full text-left p-2 rounded-xl bg-[#1C1C1C] hover:bg-[#282828] border border-[#333333] hover:border-rose-400 transition-all flex items-center justify-between group"
                >
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-rose-400" />
                    <div>
                      <p className="text-xs font-bold text-slate-300">Budi Santoso (Sales Baru)</p>
                      <p className="text-[10px] text-slate-500 font-mono">sales.budi@hrmotor.id</p>
                    </div>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-rose-500/10 text-rose-300 border border-rose-500/30">
                    Belum Diapprove
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="text-center text-[11px] text-slate-500">
          HR MOTOR Garut • Sistem CRM Keamanan Terpadu Hak Akses Showroom
        </div>
      </div>
    </div>
  );
};
