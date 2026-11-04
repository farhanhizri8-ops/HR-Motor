'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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
  const { isAuthenticated, login, registerUser } = useCrm();
  const router = useRouter();

  // If already authenticated, redirect to dashboard immediately
  useEffect(() => {
    if (isAuthenticated) {
      router.replace('/');
    }
  }, [isAuthenticated, router]);

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

    if (res.success) {
      router.push('/');
      if (typeof window !== 'undefined' && window.location.pathname === '/login') {
        window.location.href = '/';
      }
    } else {
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
      const isOwnerEmail =
        regEmail.trim().toLowerCase() === 'farhanhizri8@gmail.com' ||
        regEmail.trim().toLowerCase() === 'farhanhizri8gmail.com';

      if (isOwnerEmail) {
        setLoading(true);
        const loginRes = await login(regEmail.trim(), regPassword);
        setLoading(false);
        if (loginRes.success) {
          router.push('/');
          if (typeof window !== 'undefined' && window.location.pathname === '/login') {
            window.location.href = '/';
          }
          return;
        }
      }

      // Karyawan / akun baru wajib menunggu persetujuan (approval) Owner
      setSuccessMsg(
        'Pendaftaran akun berhasil diajukan! Akun Anda sedang menunggu persetujuan (approval) dari Owner HR MOTOR (Farhan Hizri - farhanhizri8@gmail.com). Anda baru bisa login setelah disetujui.'
      );
      setMode('login');
      setEmail(regEmail.trim());
      setPassword('');
    } else {
      setErrorMsg(res.error || 'Gagal mengajukan akun baru.');
    }
  };


  return (
    <div className="min-h-screen bg-[#F8F7F4] text-charcoal-900 flex flex-col justify-center items-center p-4 sm:p-6 relative overflow-hidden font-sans">
      {/* Subtle Background Glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[380px] bg-gold-400/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-0 right-10 w-[450px] h-[350px] bg-warm-300/20 rounded-full blur-[120px] pointer-events-none" />

      {/* Main Container */}
      <div className="w-full max-w-md z-10 space-y-6">
        {/* Header & Brand Identity */}
        <div className="text-center space-y-3">
          {/* Logo Alami Tanpa Latar Belakang Kotak */}
          <div className="flex items-center justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/emblem-transparent.png"
              alt="HR MOTOR Logo"
              className="h-20 sm:h-24 w-auto object-contain drop-shadow-md hover:scale-105 transition-transform"
            />
          </div>

          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gold-50 border border-gold-300 text-gold-800 text-[11px] font-bold tracking-wider uppercase mb-1.5">
              <Sparkles className="w-3 h-3 text-gold-600" />
              Sistem Manajemen Showroom Resmi
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-charcoal-950 tracking-tight">
              HR MOTOR GARUT
            </h1>
            <p className="text-xs text-charcoal-500 mt-1 max-w-sm mx-auto font-medium leading-relaxed">
              Portal Akses Otentikasi &amp; Otorisasi Karyawan Showroom Mobil Bekas Berkualitas
            </p>
          </div>
        </div>

        {/* Card Box */}
        <div className="bg-white border border-warm-200/90 rounded-2xl shadow-luxury overflow-hidden">
          {/* Mode Switcher Tabs */}
          <div className="grid grid-cols-2 border-b border-warm-200 bg-[#F5F3EC]">
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setErrorMsg('');
              }}
              className={`py-3.5 text-xs font-bold transition-all flex items-center justify-center gap-2 border-b-2 ${
                mode === 'login'
                  ? 'border-gold-500 text-charcoal-900 bg-white shadow-2xs'
                  : 'border-transparent text-charcoal-500 hover:text-charcoal-800'
              }`}
            >
              <KeyRound className="w-3.5 h-3.5 text-gold-600" />
              Masuk
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('register');
                setErrorMsg('');
              }}
              className={`py-3.5 text-xs font-bold transition-all flex items-center justify-center gap-2 border-b-2 ${
                mode === 'register'
                  ? 'border-gold-500 text-charcoal-900 bg-white shadow-2xs'
                  : 'border-transparent text-charcoal-500 hover:text-charcoal-800'
              }`}
            >
              <UserCheck className="w-3.5 h-3.5 text-gold-600" />
              Ajukan Akun Baru
            </button>
          </div>

          <div className="p-6 space-y-5">
            {/* Success Message Banner */}
            {successMsg && (
              <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span className="leading-relaxed font-medium">{successMsg}</span>
              </div>
            )}

            {/* Error Message Banner */}
            {errorMsg && (
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-300 text-rose-900 text-xs flex items-start gap-2.5 animate-shake">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span className="leading-relaxed font-medium">{errorMsg}</span>
              </div>
            )}

            {/* FORM: LOGIN */}
            {mode === 'login' && (
              <form onSubmit={handleLoginSubmit} className="space-y-4">
                {/* Email Field */}
                <div>
                  <label className="block text-xs font-bold text-charcoal-700 uppercase tracking-wider mb-1.5">
                    Email Pengguna
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-charcoal-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Masukkan alamat email akun"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-warm-50 border border-warm-200 text-charcoal-900 text-xs placeholder:text-charcoal-400 focus:bg-white focus:outline-none focus:border-gold-500 focus:ring-1 focus:ring-gold-500 transition-colors font-medium"
                    />
                  </div>
                </div>

                {/* Password Field */}
                <div>
                  <label className="block text-xs font-bold text-charcoal-700 uppercase tracking-wider mb-1.5">
                    Kata Sandi
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-charcoal-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-10 pr-11 py-2.5 rounded-xl bg-warm-50 border border-warm-200 text-charcoal-900 text-xs placeholder:text-charcoal-400 focus:bg-white focus:outline-none focus:border-gold-500 focus:ring-1 focus:ring-gold-500 transition-colors font-medium"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-charcoal-400 hover:text-charcoal-700 p-1"
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
                  className="w-full py-3 px-4 rounded-xl btn-gold text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all disabled:opacity-50"
                >
                  {loading ? (
                    <span className="inline-block w-4 h-4 border-2 border-charcoal-900 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>Masuk</span>
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
                <div className="p-3 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 text-[11px] leading-relaxed flex items-start gap-2">
                  <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">Otorisasi Khusus:</span> Pendaftaran akun baru wajib disetujui langsung oleh Owner resmi Showroom. Akun tidak dapat login sebelum di-approve.
                  </div>
                </div>

                {/* Full Name */}
                <div>
                  <label className="block text-[11px] font-bold text-charcoal-700 uppercase tracking-wider mb-1">
                    Nama Lengkap Karyawan
                  </label>
                  <div className="relative">
                    <UserIcon className="w-4 h-4 text-charcoal-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      value={regName}
                      onChange={(e) => setRegName(e.target.value)}
                      placeholder="Nama Lengkap"
                      className="w-full pl-10 pr-4 py-2 rounded-xl bg-warm-50 border border-warm-200 text-charcoal-900 text-xs placeholder:text-charcoal-400 focus:bg-white focus:outline-none focus:border-gold-500 font-medium"
                    />
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label className="block text-[11px] font-bold text-charcoal-700 uppercase tracking-wider mb-1">
                    Email Resmi Karyawan
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-charcoal-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      required
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      placeholder="karyawan@hrmotor.id"
                      className="w-full pl-10 pr-4 py-2 rounded-xl bg-warm-50 border border-warm-200 text-charcoal-900 text-xs placeholder:text-charcoal-400 focus:bg-white focus:outline-none focus:border-gold-500 font-medium"
                    />
                  </div>
                </div>

                {/* WhatsApp Phone */}
                <div>
                  <label className="block text-[11px] font-bold text-charcoal-700 uppercase tracking-wider mb-1">
                    No. WhatsApp
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-charcoal-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={regPhone}
                      onChange={(e) => setRegPhone(e.target.value)}
                      placeholder="081234567890"
                      className="w-full pl-10 pr-4 py-2 rounded-xl bg-warm-50 border border-warm-200 text-charcoal-900 text-xs placeholder:text-charcoal-400 focus:bg-white focus:outline-none focus:border-gold-500 font-mono"
                    />
                  </div>
                </div>

                {/* Role */}
                <div>
                  <label className="block text-[11px] font-bold text-charcoal-700 uppercase tracking-wider mb-1">
                    Posisi / Peran di Showroom
                  </label>
                  <select
                    value={regRole}
                    onChange={(e) => setRegRole(e.target.value as UserRole)}
                    className="w-full px-3 py-2 rounded-xl bg-warm-50 border border-warm-200 text-charcoal-900 text-xs focus:bg-white focus:outline-none focus:border-gold-500 font-medium"
                  >
                    <option value="Sales Representative">Sales Representative</option>
                    <option value="CRM Administrator">Administrator Showroom</option>
                    <option value="Marketing">Marketing</option>
                    <option value="WhatsApp Administrator">WhatsApp Administrator</option>
                  </select>
                </div>

                {/* Password */}
                <div>
                  <label className="block text-[11px] font-bold text-charcoal-700 uppercase tracking-wider mb-1">
                    Buat Kata Sandi
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-charcoal-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="password"
                      required
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      placeholder="Minimal 6 karakter"
                      className="w-full pl-10 pr-4 py-2 rounded-xl bg-warm-50 border border-warm-200 text-charcoal-900 text-xs placeholder:text-charcoal-400 focus:bg-white focus:outline-none focus:border-gold-500 font-medium"
                    />
                  </div>
                </div>

                {/* Submit Register */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 px-4 rounded-xl btn-gold font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all mt-2 disabled:opacity-50 shadow-md"
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

          </div>
        </div>

        {/* Footer info */}
        <div className="text-center text-[11px] text-charcoal-400 font-medium">
          HR MOTOR Garut • Sistem Keamanan Terpadu Hak Akses Showroom
        </div>
      </div>
    </div>
  );
};
