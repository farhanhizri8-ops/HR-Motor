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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              Keamanan & Hak Akses
            </span>
            <span className="text-xs text-slate-400">•</span>
            <span className="text-xs text-slate-500">RBAC (Role-Based Access Control)</span>
          </div>
          <h1 className="text-xl lg:text-2xl font-black text-slate-900 mt-1">
            User Management & Role Permissions
          </h1>
          <p className="text-xs text-slate-500">
            Kelola akun staf HR MOTOR Garut, otorisasi persetujuan Owner, dan kontrol izin modul berdasarkan peran jabatan.
          </p>
        </div>

        <button
          onClick={() => setIsRegisterModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-emerald-600 rounded-xl transition-colors shadow-xs"
        >
          <UserPlus className="w-4 h-4" />
          Daftarkan Karyawan Baru
        </button>
      </div>

      {/* Action alert message */}
      {actionMessage && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 font-semibold flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-600" />
          {actionMessage}
        </div>
      )}

      {/* Security Info Card */}
      <div className="p-4 bg-slate-900 text-white rounded-2xl shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30 shrink-0">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-400">
              Status Akun Aktif: {currentUser.name}
            </h3>
            <p className="text-xs text-slate-300">
              Peran Anda saat ini: <strong className="text-white">{currentUser.role}</strong>.
              {isOwner ? (
                ' Anda memiliki wewenang penuh untuk menyetujui akun dan mengatur peran staf.'
              ) : (
                ' Hak akses dibatasi sesuai kebijakan server-side authorization.'
              )}
            </p>
          </div>
        </div>

        <div className="text-xs text-slate-300 bg-slate-800/80 px-3 py-2 rounded-xl border border-slate-700">
          Akun Utama Owner: <strong>owner@hrmotor.id</strong> (H. Rahmat Hidayat)
        </div>
      </div>

      {/* ROLE PERMISSION MATRIX TABLE */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-3">
        <div>
          <h2 className="text-sm font-bold text-slate-900">
            Matriks Hak Akses Modul CRM (Role & Permissions Matrix)
          </h2>
          <p className="text-xs text-slate-500">
            Struktur wewenang operasional dealer mobil bekas HR MOTOR Garut
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                <th className="py-2.5 px-3">Peran / Jabatan</th>
                <th className="py-2.5 px-3">Database Pelanggan</th>
                <th className="py-2.5 px-3">Leads & Pipeline</th>
                <th className="py-2.5 px-3">Follow-up</th>
                <th className="py-2.5 px-3">Komunikasi WA</th>
                <th className="py-2.5 px-3">After Sales</th>
                <th className="py-2.5 px-3">Laporan Analitik</th>
                <th className="py-2.5 px-3">Kelola Pengguna</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              <tr>
                <td className="py-2 px-3 font-bold text-slate-900">Owner (Pemilik)</td>
                <td className="py-2 px-3 text-emerald-700 font-bold">Semua</td>
                <td className="py-2 px-3 text-emerald-700 font-bold">Semua</td>
                <td className="py-2 px-3 text-emerald-700 font-bold">Semua</td>
                <td className="py-2 px-3 text-emerald-700 font-bold">Semua</td>
                <td className="py-2 px-3 text-emerald-700 font-bold">Semua</td>
                <td className="py-2 px-3 text-emerald-700 font-bold">Semua & Ekspor</td>
                <td className="py-2 px-3 text-emerald-700 font-bold">Master Control</td>
              </tr>
              <tr>
                <td className="py-2 px-3 font-bold text-slate-900">CRM Administrator</td>
                <td className="py-2 px-3 text-emerald-700 font-bold">Kelola</td>
                <td className="py-2 px-3 text-emerald-700 font-bold">Kelola</td>
                <td className="py-2 px-3 text-emerald-700 font-bold">Kelola</td>
                <td className="py-2 px-3 text-emerald-700 font-bold">Kelola</td>
                <td className="py-2 px-3 text-emerald-700 font-bold">Kelola</td>
                <td className="py-2 px-3 text-emerald-700 font-bold">Lihat & Ekspor</td>
                <td className="py-2 px-3 text-slate-400">Terbatas</td>
              </tr>
              <tr>
                <td className="py-2 px-3 font-bold text-slate-900">Sales Representative</td>
                <td className="py-2 px-3 text-blue-700 font-semibold">Tugas Sendiri</td>
                <td className="py-2 px-3 text-blue-700 font-semibold">Tugas Sendiri</td>
                <td className="py-2 px-3 text-blue-700 font-semibold">Jadwalkan & Selesaikan</td>
                <td className="py-2 px-3 text-blue-700 font-semibold">Catat Kontak</td>
                <td className="py-2 px-3 text-slate-400">Hanya Lihat Unit</td>
                <td className="py-2 px-3 text-slate-400">Leaderboard</td>
                <td className="py-2 px-3 text-slate-400">Tidak Ada</td>
              </tr>
              <tr>
                <td className="py-2 px-3 font-bold text-slate-900">WhatsApp Administrator</td>
                <td className="py-2 px-3 text-slate-600">Lihat & Kontak</td>
                <td className="py-2 px-3 text-slate-600">Lihat Kontak</td>
                <td className="py-2 px-3 text-emerald-700 font-bold">Kelola</td>
                <td className="py-2 px-3 text-emerald-700 font-bold">Template & Broadcast</td>
                <td className="py-2 px-3 text-emerald-700 font-bold">Survey CSAT</td>
                <td className="py-2 px-3 text-slate-400">Tidak Ada</td>
                <td className="py-2 px-3 text-slate-400">Tidak Ada</td>
              </tr>
              <tr>
                <td className="py-2 px-3 font-bold text-slate-900">Marketing</td>
                <td className="py-2 px-3 text-slate-400">Statistik</td>
                <td className="py-2 px-3 text-emerald-700 font-bold">Kelola Sumber Lead</td>
                <td className="py-2 px-3 text-slate-400">Tidak Ada</td>
                <td className="py-2 px-3 text-slate-400">Tidak Ada</td>
                <td className="py-2 px-3 text-slate-400">Tidak Ada</td>
                <td className="py-2 px-3 text-emerald-700 font-bold">Analisis Saluran & ROI</td>
                <td className="py-2 px-3 text-slate-400">Tidak Ada</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* USER LIST TABLE */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Daftar Akun Pengguna CRM</h2>
            <p className="text-xs text-slate-500">Persetujuan Owner dan penetapan peran pengguna</p>
          </div>
          <span className="text-xs font-semibold text-slate-500">
            Total {users.length} Akun Terdaftar
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                <th className="py-3 px-4">Nama Staf</th>
                <th className="py-3 px-4">Email Login</th>
                <th className="py-3 px-4">No. HP / WA</th>
                <th className="py-3 px-4">Peran Saat Ini</th>
                <th className="py-3 px-4">Status Approval</th>
                <th className="py-3 px-4">Terdaftar</th>
                <th className="py-3 px-4 text-center">Tindakan Owner</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map((u) => {
                const isPending = !u.isApproved;

                return (
                  <tr key={u.id} className="hover:bg-slate-50/70 transition-colors">
                    {/* Name & Avatar */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={u.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100'}
                          alt={u.name}
                          className="w-8 h-8 rounded-full object-cover border border-slate-200"
                        />
                        <div>
                          <p className="font-bold text-slate-900">{u.name}</p>
                          <span className="text-[10px] text-slate-400">{u.id}</span>
                        </div>
                      </div>
                    </td>

                    {/* Email */}
                    <td className="py-3 px-4 font-medium text-slate-700">{u.email}</td>

                    {/* Phone */}
                    <td className="py-3 px-4 text-slate-600">{u.phone || '-'}</td>

                    {/* Role */}
                    <td className="py-3 px-4">
                      {isOwner && u.role !== 'Owner' ? (
                        <select
                          value={u.role}
                          onChange={(e) => handleChangeRole(u.id, e.target.value as UserRole, u.name)}
                          className="text-xs p-1.5 bg-slate-50 border border-slate-300 rounded-lg outline-none font-semibold text-slate-800"
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
                              ? 'bg-purple-100 text-purple-800'
                              : u.role === 'CRM Administrator'
                              ? 'bg-blue-100 text-blue-800'
                              : u.role === 'Sales Representative'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {u.role}
                        </span>
                      )}
                    </td>

                    {/* Approval Status */}
                    <td className="py-3 px-4">
                      {isPending ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 animate-pulse">
                          <Clock className="w-3 h-3" />
                          Menunggu Persetujuan Owner
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                          <CheckCircle className="w-3 h-3" />
                          Disetujui Aktif
                        </span>
                      )}
                    </td>

                    {/* Registered Date */}
                    <td className="py-3 px-4 text-slate-400 text-[11px]">{formatDate(u.createdAt)}</td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-center">
                      {isPending ? (
                        <button
                          onClick={() => handleApprove(u.id, u.name)}
                          className="px-3 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors shadow-xs"
                        >
                          Setujui Akun
                        </button>
                      ) : (
                        <span className="text-[11px] text-slate-400 italic">Terverifikasi</span>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-slate-50">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Daftarkan Karyawan Baru</h3>
                <p className="text-xs text-slate-500">Akun baru akan berstatus PENDING hingga disetujui Owner</p>
              </div>
              <button
                onClick={() => setIsRegisterModalOpen(false)}
                className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {formError && (
              <div className="mx-5 mt-4 p-2.5 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700">
                {formError}
              </div>
            )}

            <form onSubmit={handleRegisterSubmit} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Nama Lengkap <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Contoh: Budi Santoso"
                  className="w-full text-xs p-2 border border-slate-300 rounded-lg outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Email Login <span className="text-rose-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="nama@hrmotor.id"
                  className="w-full text-xs p-2 border border-slate-300 rounded-lg outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nomor WhatsApp / HP</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="0813xxxxxxxx"
                  className="w-full text-xs p-2 border border-slate-300 rounded-lg outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Peran yang Diajukan</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
                  className="w-full text-xs p-2 border border-slate-300 rounded-lg outline-none"
                >
                  <option value="Sales Representative">Sales Representative</option>
                  <option value="WhatsApp Administrator">WhatsApp Administrator</option>
                  <option value="Marketing">Marketing</option>
                  <option value="CRM Administrator">CRM Administrator</option>
                </select>
              </div>

              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-900 space-y-1">
                <span className="font-bold block">Ketentuan Persetujuan:</span>
                <p className="text-[11px] leading-tight">
                  Akun ini tidak dapat mengakses database hingga H. Rahmat Hidayat (Owner) memberikan persetujuan resmi di halaman ini.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsRegisterModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-emerald-600 rounded-lg shadow-xs"
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
