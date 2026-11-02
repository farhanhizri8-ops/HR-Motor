'use client';

import React, { useState } from 'react';
import {
  UserCheck,
  Shield,
  UserPlus,
  CheckCircle,
  XCircle,
  AlertCircle,
  Lock,
  Mail,
  Phone,
  Clock,
  X,
  User,
  Key,
} from 'lucide-react';
import { useCrm } from '@/context/CrmContext';
import { UserRole } from '@/types/crm';

export default function UserManagementPage() {
  const {
    users,
    currentUser,
    approveUser,
    changeUserRole,
    registerUser,
    formatDate,
  } = useCrm();

  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'Sales Representative' as UserRole,
  });
  const [formError, setFormError] = useState('');
  const [actionMessage, setActionMessage] = useState('');

  const isOwner = currentUser.role === 'Owner';

  const handleApprove = async (id: string, name: string) => {
    if (!isOwner) {
      alert('Hanya Owner (Pemilik) yang berhak menyetujui akun karyawan baru.');
      return;
    }
    const res = await approveUser(id);
    if (res.success) {
      setActionMessage(`Akun ${name} telah berhasil disetujui aktif.`);
      setTimeout(() => setActionMessage(''), 4000);
    } else {
      alert(res.error || 'Gagal menyetujui akun.');
    }
  };

  const handleChangeRole = async (id: string, newRole: UserRole, name: string) => {
    if (!isOwner) {
      alert('Hanya Owner yang berhak mengubah hak akses dan peran pengguna.');
      return;
    }
    const res = await changeUserRole(id, newRole);
    if (res.success) {
      setActionMessage(`Peran ${name} diubah menjadi ${newRole}.`);
      setTimeout(() => setActionMessage(''), 4000);
    } else {
      alert(res.error || 'Gagal mengubah peran.');
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    const res = await registerUser(formData);
    if (res.success) {
      setIsRegisterModalOpen(false);
      setFormData({
        name: '',
        email: '',
        phone: '',
        role: 'Sales Representative',
      });
      alert('Pendaftaran akun karyawan berhasil diajukan! Akun ini menunggu persetujuan (approval) dari Owner.');
    } else {
      setFormError(res.error || 'Gagal mendaftarkan akun.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="crm-card p-6 border-b-2 border-b-gold-500/40">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="badge-gold">
                Keamanan & Hak Akses
              </span>
              <span className="text-xs text-charcoal-300">•</span>
              <span className="text-xs text-charcoal-400 font-medium tracking-wide">RBAC (Role-Based Access Control)</span>
            </div>
            <h1 className="text-2xl font-black text-charcoal-900 mt-1 tracking-tight">
              Manajemen Pengguna & Otorisasi RBAC
            </h1>
            <p className="text-xs text-charcoal-500 mt-0.5">
              Kelola akun staf HR MOTOR Garut, otorisasi persetujuan Owner, dan kontrol izin modul berdasarkan peran jabatan.
            </p>
          </div>

          <button
            onClick={() => setIsRegisterModalOpen(true)}
            className="btn-gold flex items-center gap-2"
          >
            <UserPlus className="w-4 h-4" />
            <span>Daftarkan Karyawan Baru</span>
          </button>
        </div>
      </div>

      {/* Action alert message */}
      {actionMessage && (
        <div className="p-3.5 bg-gold-50/80 border border-gold-300 rounded-xl text-xs text-gold-900 font-semibold flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-gold-600" />
          {actionMessage}
        </div>
      )}

      {/* Security Info Card */}
      <div className="crm-card-charcoal p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border border-gold-500/30">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-charcoal-800 text-gold-400 flex items-center justify-center border border-gold-500/40 shrink-0 shadow-xs">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="badge-gold text-[10px]">Akun Aktif</span>
              <h3 className="text-sm font-black text-white">
                {currentUser.name}
              </h3>
            </div>
            <p className="text-xs text-charcoal-300 mt-0.5">
              Peran Anda saat ini: <strong className="text-gold-400">{currentUser.role}</strong>.
              {isOwner ? (
                ' Anda memiliki wewenang penuh untuk menyetujui akun dan mengatur peran seluruh staf showroom.'
              ) : (
                ' Hak akses dibatasi sesuai kebijakan server-side authorization HR MOTOR.'
              )}
            </p>
          </div>
        </div>

        <div className="text-xs text-charcoal-300 bg-charcoal-800/90 px-3.5 py-2 rounded-xl border border-charcoal-700 font-mono">
          Akun Utama Owner: <strong className="text-white">owner@hrmotor.id</strong> (H. Rahmat Hidayat)
        </div>
      </div>

      {/* ROLE PERMISSION MATRIX TABLE */}
      <div className="crm-card p-5 space-y-4">
        <div>
          <h2 className="text-base font-black text-charcoal-900">
            Matriks Hak Akses Modul CRM (Role & Permissions Matrix)
          </h2>
          <p className="text-xs text-charcoal-500 mt-0.5">
            Struktur wewenang operasional dealer mobil bekas HR MOTOR Garut
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="crm-table w-full text-left">
            <thead>
              <tr>
                <th className="py-3 px-3">Peran / Jabatan</th>
                <th className="py-3 px-3">Database Pelanggan</th>
                <th className="py-3 px-3">Leads & Pipeline</th>
                <th className="py-3 px-3">Follow-up</th>
                <th className="py-3 px-3">Komunikasi WA</th>
                <th className="py-3 px-3">Stok & Garansi</th>
                <th className="py-3 px-3">Laporan Analitik</th>
                <th className="py-3 px-3">Kelola Pengguna</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EAE8E3] text-xs">
              <tr className="hover:bg-[#FAF9F5]">
                <td className="py-3 px-3 font-black text-charcoal-900">Owner (Pemilik)</td>
                <td className="py-3 px-3 text-gold-600 font-bold">Semua</td>
                <td className="py-3 px-3 text-gold-600 font-bold">Semua</td>
                <td className="py-3 px-3 text-gold-600 font-bold">Semua</td>
                <td className="py-3 px-3 text-gold-600 font-bold">Semua</td>
                <td className="py-3 px-3 text-gold-600 font-bold">Semua</td>
                <td className="py-3 px-3 text-gold-600 font-bold">Semua & Ekspor</td>
                <td className="py-3 px-3 text-gold-600 font-bold">Master Control</td>
              </tr>
              <tr className="hover:bg-[#FAF9F5]">
                <td className="py-3 px-3 font-bold text-charcoal-900">CRM Administrator</td>
                <td className="py-3 px-3 text-gold-600 font-bold">Kelola</td>
                <td className="py-3 px-3 text-gold-600 font-bold">Kelola</td>
                <td className="py-3 px-3 text-gold-600 font-bold">Kelola</td>
                <td className="py-3 px-3 text-gold-600 font-bold">Kelola</td>
                <td className="py-3 px-3 text-gold-600 font-bold">Kelola</td>
                <td className="py-3 px-3 text-gold-600 font-bold">Lihat & Ekspor</td>
                <td className="py-3 px-3 text-charcoal-400">Terbatas</td>
              </tr>
              <tr className="hover:bg-[#FAF9F5]">
                <td className="py-3 px-3 font-bold text-charcoal-900">Sales Representative</td>
                <td className="py-3 px-3 text-charcoal-700 font-semibold">Tugas Sendiri</td>
                <td className="py-3 px-3 text-charcoal-700 font-semibold">Tugas Sendiri</td>
                <td className="py-3 px-3 text-charcoal-700 font-semibold">Jadwalkan & Selesaikan</td>
                <td className="py-3 px-3 text-charcoal-700 font-semibold">Catat Kontak</td>
                <td className="py-3 px-3 text-charcoal-400">Hanya Lihat Unit</td>
                <td className="py-3 px-3 text-charcoal-400">Leaderboard</td>
                <td className="py-3 px-3 text-charcoal-400">Tidak Ada</td>
              </tr>
              <tr className="hover:bg-[#FAF9F5]">
                <td className="py-3 px-3 font-bold text-charcoal-900">WhatsApp Administrator</td>
                <td className="py-3 px-3 text-charcoal-700">Lihat & Kontak</td>
                <td className="py-3 px-3 text-charcoal-700">Lihat Kontak</td>
                <td className="py-3 px-3 text-gold-600 font-bold">Kelola</td>
                <td className="py-3 px-3 text-gold-600 font-bold">Template & Broadcast</td>
                <td className="py-3 px-3 text-gold-600 font-bold">Survey CSAT</td>
                <td className="py-3 px-3 text-charcoal-400">Tidak Ada</td>
                <td className="py-3 px-3 text-charcoal-400">Tidak Ada</td>
              </tr>
              <tr className="hover:bg-[#FAF9F5]">
                <td className="py-3 px-3 font-bold text-charcoal-900">Marketing</td>
                <td className="py-3 px-3 text-charcoal-400">Statistik</td>
                <td className="py-3 px-3 text-gold-600 font-bold">Kelola Sumber Lead</td>
                <td className="py-3 px-3 text-charcoal-400">Tidak Ada</td>
                <td className="py-3 px-3 text-charcoal-400">Tidak Ada</td>
                <td className="py-3 px-3 text-charcoal-400">Tidak Ada</td>
                <td className="py-3 px-3 text-gold-600 font-bold">Analisis Saluran & ROI</td>
                <td className="py-3 px-3 text-charcoal-400">Tidak Ada</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* USER LIST TABLE */}
      <div className="crm-card overflow-hidden">
        <div className="p-5 border-b border-[#EAE8E3] flex items-center justify-between">
          <div>
            <h2 className="text-base font-black text-charcoal-900">Daftar Akun Pengguna CRM</h2>
            <p className="text-xs text-charcoal-500 mt-0.5">Persetujuan Owner dan penetapan peran pengguna showroom</p>
          </div>
          <span className="text-xs font-bold text-gold-600 bg-gold-50 px-2.5 py-1 rounded-lg border border-gold-200">
            Total {users.length} Akun Terdaftar
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="crm-table w-full text-left">
            <thead>
              <tr>
                <th className="py-3.5 px-4">Nama Staf</th>
                <th className="py-3.5 px-4">Email Login</th>
                <th className="py-3.5 px-4">No. HP / WA</th>
                <th className="py-3.5 px-4">Peran Saat Ini</th>
                <th className="py-3.5 px-4">Status Approval</th>
                <th className="py-3.5 px-4">Terdaftar</th>
                <th className="py-3.5 px-4 text-center">Tindakan Owner</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EAE8E3] text-xs">
              {users.map((u) => {
                const isPending = !u.isApproved;

                return (
                  <tr key={u.id} className="hover:bg-[#F8F7F4]/80 transition-colors">
                    {/* Name & Avatar */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-charcoal-900 text-gold-400 border border-gold-500/30 flex items-center justify-center font-bold text-xs uppercase shrink-0 shadow-xs">
                          {u.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-bold text-charcoal-900 text-sm">{u.name}</p>
                          <span className="text-[10px] text-charcoal-400 font-mono">{u.id}</span>
                        </div>
                      </div>
                    </td>

                    {/* Email */}
                    <td className="py-3.5 px-4 font-semibold text-charcoal-800">{u.email}</td>

                    {/* Phone */}
                    <td className="py-3.5 px-4 text-charcoal-600 font-mono">{u.phone || '-'}</td>

                    {/* Role */}
                    <td className="py-3.5 px-4">
                      {isOwner && u.role !== 'Owner' ? (
                        <select
                          value={u.role}
                          onChange={(e) => handleChangeRole(u.id, e.target.value as UserRole, u.name)}
                          className="text-xs py-1.5 px-2.5 bg-[#F8F7F4] border border-[#EAE8E3] rounded-xl outline-none font-semibold text-charcoal-900 focus:border-gold-500"
                        >
                          <option value="CRM Administrator">CRM Administrator</option>
                          <option value="Sales Representative">Sales Representative</option>
                          <option value="WhatsApp Administrator">WhatsApp Administrator</option>
                          <option value="Marketing">Marketing</option>
                        </select>
                      ) : (
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                            u.role === 'Owner'
                              ? 'bg-gold-50 text-gold-800 border border-gold-300 font-black'
                              : u.role === 'CRM Administrator'
                              ? 'bg-charcoal-900 text-gold-400'
                              : 'bg-warm-100 text-charcoal-700 border border-warm-200'
                          }`}
                        >
                          {u.role}
                        </span>
                      )}
                    </td>

                    {/* Approval Status */}
                    <td className="py-3.5 px-4">
                      {isPending ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-300 animate-pulse">
                          <Clock className="w-3 h-3" />
                          Menunggu Persetujuan Owner
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                          <CheckCircle className="w-3 h-3" />
                          Disetujui Aktif
                        </span>
                      )}
                    </td>

                    {/* Registered Date */}
                    <td className="py-3.5 px-4 text-charcoal-400 text-[11px]">{formatDate(u.createdAt)}</td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-center">
                      {isPending ? (
                        <button
                          onClick={() => handleApprove(u.id, u.name)}
                          className="btn-gold py-1 px-3 text-xs"
                        >
                          Setujui Akun
                        </button>
                      ) : (
                        <span className="text-[11px] text-charcoal-400 font-medium">Terverifikasi</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: REGISTER EMPLOYEE */}
      {isRegisterModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-charcoal-950/70 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="crm-card w-full max-w-md overflow-hidden flex flex-col shadow-luxury border-gold-500/30">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 bg-charcoal-900 border-b border-gold-500/30 text-white">
              <div>
                <span className="badge-gold text-[10px] mb-1 inline-block">Registrasi Akun</span>
                <h3 className="text-base font-black text-white">Daftarkan Karyawan Baru</h3>
                <p className="text-xs text-charcoal-300">Akun baru akan berstatus PENDING hingga disetujui Owner</p>
              </div>
              <button
                onClick={() => setIsRegisterModalOpen(false)}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-charcoal-400 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {formError && (
              <div className="mx-6 mt-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-medium">
                {formError}
              </div>
            )}

            <form onSubmit={handleRegisterSubmit} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-charcoal-800 mb-1">
                  Nama Lengkap <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Contoh: Budi Santoso"
                  className="w-full text-xs px-3.5 py-2.5 bg-[#F8F7F4] border border-[#EAE8E3] rounded-xl outline-none focus:border-gold-500 focus:ring-2 focus:ring-gold-500/20 text-charcoal-900 font-medium"
                />
              </div>

              <div>
                <label className="block font-bold text-charcoal-800 mb-1">
                  Email Login <span className="text-rose-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="nama@hrmotor.id"
                  className="w-full text-xs px-3.5 py-2.5 bg-[#F8F7F4] border border-[#EAE8E3] rounded-xl outline-none focus:border-gold-500 focus:ring-2 focus:ring-gold-500/20 text-charcoal-900 font-medium"
                />
              </div>

              <div>
                <label className="block font-bold text-charcoal-800 mb-1">Nomor WhatsApp / HP</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="0813xxxxxxxx"
                  className="w-full text-xs px-3.5 py-2.5 bg-[#F8F7F4] border border-[#EAE8E3] rounded-xl outline-none focus:border-gold-500 focus:ring-2 focus:ring-gold-500/20 text-charcoal-900 font-medium"
                />
              </div>

              <div>
                <label className="block font-bold text-charcoal-800 mb-1">Peran yang Diajukan</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
                  className="w-full text-xs px-3.5 py-2.5 bg-[#F8F7F4] border border-[#EAE8E3] rounded-xl outline-none focus:border-gold-500 font-semibold text-charcoal-900"
                >
                  <option value="Sales Representative">Sales Representative</option>
                  <option value="WhatsApp Administrator">WhatsApp Administrator</option>
                  <option value="Marketing">Marketing</option>
                  <option value="CRM Administrator">CRM Administrator</option>
                </select>
              </div>

              <div className="p-3.5 bg-[#FAF9F5] rounded-xl border border-gold-500/30 text-charcoal-700 space-y-1">
                <span className="font-bold text-gold-800 block text-[11px] uppercase tracking-wider">Ketentuan Persetujuan:</span>
                <p className="text-[11px] leading-relaxed">
                  Akun ini tidak dapat mengakses database hingga H. Rahmat Hidayat (Owner) memberikan persetujuan resmi di halaman ini.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#EAE8E3]">
                <button
                  type="button"
                  onClick={() => setIsRegisterModalOpen(false)}
                  className="btn-outline-warm text-xs"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="btn-gold text-xs"
                >
                  Ajukan Pendaftaran
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
