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
  Trash2,
  Edit3,
  Check,
} from 'lucide-react';
import { useCrm } from '@/context/CrmContext';
import { UserRole, ShowroomJobdesk, SHOWROOM_JOBDESKS, User as UserType } from '@/types/crm';

const getUserJobdesks = (u: UserType): string[] => {
  if (u.jobdesks && Array.isArray(u.jobdesks) && u.jobdesks.length > 0) {
    return u.jobdesks;
  }
  return [u.role];
};

const getJobdeskBadgeStyle = (desk: string) => {
  switch (desk) {
    case 'Host Live':
      return 'bg-rose-50 text-rose-700 border-rose-200';
    case 'Teknisi Otomotif':
      return 'bg-amber-50 text-amber-800 border-amber-200';
    case 'Staf Operasional Showroom':
      return 'bg-blue-50 text-blue-700 border-blue-200';
    case 'Staf Administrasi Keuangan':
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    case 'Konten Kreator':
      return 'bg-purple-50 text-purple-700 border-purple-200';
    case 'Admin Layanan Pelanggan':
      return 'bg-teal-50 text-teal-700 border-teal-200';
    case 'Owner':
      return 'bg-gold-50 text-gold-800 border-gold-300 font-black';
    default:
      return 'bg-warm-100 text-charcoal-700 border-warm-200';
  }
};

export default function UserManagementPage() {
  const {
    users,
    currentUser,
    approveUser,
    rejectUser,
    deleteUser,
    changeUserRole,
    registerUser,
    formatDate,
  } = useCrm();

  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [formData, setFormData] = useState<{
    name: string;
    email: string;
    phone: string;
    role: UserRole;
    jobdesks: ShowroomJobdesk[];
  }>({
    name: '',
    email: '',
    phone: '',
    role: 'Staf Operasional Showroom',
    jobdesks: ['Staf Operasional Showroom'],
  });
  const [editingUserJobdesks, setEditingUserJobdesks] = useState<{
    id: string;
    name: string;
    jobdesks: string[];
  } | null>(null);

  const toggleFormJobdesk = (desk: ShowroomJobdesk) => {
    setFormData((prev) => {
      const exists = prev.jobdesks.includes(desk);
      let updated: ShowroomJobdesk[];
      if (exists) {
        if (prev.jobdesks.length === 1) return prev;
        updated = prev.jobdesks.filter((d) => d !== desk);
      } else {
        updated = [...prev.jobdesks, desk];
      }
      return {
        ...prev,
        jobdesks: updated,
        role: updated[0] as UserRole,
      };
    });
  };
  const [formError, setFormError] = useState('');
  const [actionMessage, setActionMessage] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  // Confirmation modals state
  const [deleteConfirmUser, setDeleteConfirmUser] = useState<{ id: string; name: string; email: string } | null>(null);
  const [rejectConfirmUser, setRejectConfirmUser] = useState<{ id: string; name: string; email: string } | null>(null);

  const isOwner =
    currentUser.role === 'Owner' ||
    currentUser.email.toLowerCase().includes('farhanhizri8');

  const pendingUsers = users.filter((u) => !u.isApproved);
  const activeUsers = users.filter((u) => u.isApproved);

  const handleApprove = async (id: string, name: string) => {
    if (!isOwner) {
      alert('Akses Ditolak: Hanya Owner (farhanhizri8@gmail.com) yang berhak menyetujui akun karyawan baru.');
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

  const handleReject = async (id: string, name: string) => {
    if (!isOwner) {
      alert('Akses Ditolak: Hanya Owner (farhanhizri8@gmail.com) yang berhak menolak permohonan pendaftaran.');
      return;
    }
    const res = await rejectUser(id);
    if (res.success) {
      setRejectConfirmUser(null);
      setActionMessage(`Pengajuan akun ${name} telah ditolak dan dihapus dari sistem.`);
      setTimeout(() => setActionMessage(''), 4000);
    } else {
      alert(res.error || 'Gagal menolak akun.');
    }
  };

  const handleDeleteUser = async (id: string, name: string) => {
    if (!isOwner && currentUser.role !== 'CRM Administrator') {
      alert('Akses Ditolak: Hanya Owner atau Administrator yang berhak menghapus akun.');
      return;
    }
    setIsDeleting(true);
    const res = await deleteUser(id);
    setIsDeleting(false);
    if (res.success) {
      setDeleteConfirmUser(null);
      setActionMessage(`Akun ${name} berhasil dihapus dari sistem CRM HR MOTOR.`);
      setTimeout(() => setActionMessage(''), 4000);
    } else {
      alert(res.error || 'Gagal menghapus akun.');
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

    if (formData.jobdesks.length === 0) {
      setFormError('Silakan pilih minimal 1 posisi / jobdesk showroom.');
      return;
    }

    const res = await registerUser({
      name: formData.name.trim(),
      email: formData.email.trim(),
      phone: formData.phone.trim(),
      role: formData.jobdesks[0] as UserRole,
      jobdesks: formData.jobdesks,
    });
    if (res.success) {
      setIsRegisterModalOpen(false);
      setFormData({
        name: '',
        email: '',
        phone: '',
        role: 'Staf Operasional Showroom',
        jobdesks: ['Staf Operasional Showroom'],
      });
      alert('Pendaftaran akun karyawan berhasil diajukan! Akun ini menunggu persetujuan (approval) dari Owner sebelum dapat login.');
    } else {
      setFormError(res.error || 'Gagal mendaftarkan akun.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="crm-card p-4 sm:p-6 border-b-2 border-b-gold-500/40">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="badge-gold">
                Keamanan &amp; Hak Akses
              </span>
              <span className="text-xs text-charcoal-300">•</span>
              <span className="text-xs text-charcoal-400 font-medium tracking-wide">Otorisasi Jabatan Showroom</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-charcoal-900 mt-1 tracking-tight">
              Manajemen Pengguna &amp; Otorisasi Jabatan
            </h1>
            <p className="text-xs text-charcoal-500 mt-0.5">
              Kelola akun staf HR MOTOR Garut, otorisasi persetujuan Owner, hapus akun yang tidak aktif, dan kontrol izin modul.
            </p>
          </div>

          <button
            onClick={() => setIsRegisterModalOpen(true)}
            className="btn-gold flex items-center justify-center gap-2 w-full sm:w-auto"
          >
            <UserPlus className="w-4 h-4" />
            <span>Daftarkan Karyawan Baru</span>
          </button>
        </div>
      </div>

      {/* Action alert message */}
      {actionMessage && (
        <div className="p-3.5 bg-gold-50/80 border border-gold-300 rounded-xl text-xs text-gold-900 font-semibold flex items-center gap-2 animate-in fade-in">
          <CheckCircle className="w-4 h-4 text-gold-600 shrink-0" />
          <span>{actionMessage}</span>
        </div>
      )}

      {/* Pending Approval Banner if any */}
      {pendingUsers.length > 0 && (
        <div className="p-4 bg-amber-50 border-2 border-amber-400/80 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0 border border-amber-300">
              <Clock className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h4 className="text-xs font-black text-amber-900 uppercase tracking-wider">
                Ada {pendingUsers.length} Pengajuan Pendaftaran Akun Baru
              </h4>
              <p className="text-xs text-amber-800 mt-0.5">
                Pengguna baru belum dapat login ke aplikasi hingga Owner (Farhan Hizri) menyetujui akun mereka.
              </p>
            </div>
          </div>
          <span className="text-[11px] font-bold text-amber-900 bg-amber-200/80 px-3 py-1 rounded-full border border-amber-400">
            {pendingUsers.length} Menunggu Tindakan
          </span>
        </div>
      )}

      {/* Security Info Card */}
      <div className="crm-card p-5 bg-[#FAF9F5] flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border border-gold-300">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gold-100 text-gold-900 flex items-center justify-center border border-gold-300 shrink-0 shadow-2xs">
            <Shield className="w-6 h-6 text-gold-700" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="badge-gold text-[10px]">Akun Aktif</span>
              <h3 className="text-sm font-black text-charcoal-900">
                {currentUser.name}
              </h3>
            </div>
            <p className="text-xs text-charcoal-600 mt-0.5">
              Peran Anda saat ini: <strong className="text-gold-700">{currentUser.role}</strong>.
              {isOwner ? (
                ' Anda memiliki wewenang penuh untuk menyetujui, menolak, dan menghapus akun staf showroom.'
              ) : (
                ' Hak akses dibatasi sesuai kebijakan otorisasi server HR MOTOR.'
              )}
            </p>
          </div>
        </div>

        <div className="text-xs text-charcoal-300 bg-charcoal-800/90 px-3.5 py-2 rounded-xl border border-charcoal-700 font-mono">
          Akun Utama Owner: <strong className="text-white">farhanhizri8@gmail.com</strong> (Farhan Hizri)
        </div>
      </div>

      {/* ROLE PERMISSION MATRIX TABLE */}
      <div className="crm-card p-5 space-y-4">
        <div>
          <h2 className="text-base font-black text-charcoal-900">
            Matriks Hak Akses Modul Showroom HR MOTOR
          </h2>
          <p className="text-xs text-charcoal-500 mt-0.5">
            Struktur wewenang operasional dealer mobil bekas HR MOTOR Garut
          </p>
        </div>

        <div className="overflow-x-auto w-full">
          <table className="crm-table w-full min-w-[750px] text-left">
            <thead>
              <tr>
                <th className="py-3 px-3">Peran / Jabatan</th>
                <th className="py-3 px-3">Basis Data Pelanggan</th>
                <th className="py-3 px-3">Prospek &amp; Penjualan</th>
                <th className="py-3 px-3">Tindak Lanjut</th>
                <th className="py-3 px-3">Komunikasi WA</th>
                <th className="py-3 px-3">Garansi &amp; Bengkel</th>
                <th className="py-3 px-3">Stok Mobil</th>
                <th className="py-3 px-3">Manajemen Pengguna</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EAE8E3] text-xs">
              <tr className="hover:bg-[#FAF9F5]">
                <td className="py-3 px-3 font-bold text-charcoal-900">Owner</td>
                <td className="py-3 px-3 text-gold-600 font-bold">Akses Penuh</td>
                <td className="py-3 px-3 text-gold-600 font-bold">Akses Penuh</td>
                <td className="py-3 px-3 text-gold-600 font-bold">Akses Penuh</td>
                <td className="py-3 px-3 text-gold-600 font-bold">Akses Penuh</td>
                <td className="py-3 px-3 text-gold-600 font-bold">Akses Penuh</td>
                <td className="py-3 px-3 text-gold-600 font-bold">Akses Penuh</td>
                <td className="py-3 px-3 text-gold-600 font-bold">Persetujuan & Hapus</td>
              </tr>
              <tr className="hover:bg-[#FAF9F5]">
                <td className="py-3 px-3 font-bold text-charcoal-900">CRM Administrator</td>
                <td className="py-3 px-3 text-gold-600 font-bold">Akses Penuh</td>
                <td className="py-3 px-3 text-gold-600 font-bold">Akses Penuh</td>
                <td className="py-3 px-3 text-gold-600 font-bold">Akses Penuh</td>
                <td className="py-3 px-3 text-gold-600 font-bold">Akses Penuh</td>
                <td className="py-3 px-3 text-gold-600 font-bold">Akses Penuh</td>
                <td className="py-3 px-3 text-gold-600 font-bold">Akses Penuh</td>
                <td className="py-3 px-3 text-charcoal-700">Kelola Akun Staf</td>
              </tr>
              <tr className="hover:bg-[#FAF9F5]">
                <td className="py-3 px-3 font-bold text-charcoal-900">Sales Representative</td>
                <td className="py-3 px-3 text-charcoal-700">Lihat & Tambah</td>
                <td className="py-3 px-3 text-gold-600 font-bold">Kelola Pipeline</td>
                <td className="py-3 px-3 text-gold-600 font-bold">Input Follow-up</td>
                <td className="py-3 px-3 text-gold-600 font-bold">Kirim Template</td>
                <td className="py-3 px-3 text-charcoal-400">Hanya Lihat</td>
                <td className="py-3 px-3 text-charcoal-700">Cek Ketersediaan</td>
                <td className="py-3 px-3 text-charcoal-400">Tidak Ada</td>
              </tr>
              <tr className="hover:bg-[#FAF9F5]">
                <td className="py-3 px-3 font-bold text-charcoal-900">WhatsApp Administrator</td>
                <td className="py-3 px-3 text-charcoal-700">Lihat Kontak</td>
                <td className="py-3 px-3 text-gold-600 font-bold">Kelola</td>
                <td className="py-3 px-3 text-gold-600 font-bold">Template & Broadcast</td>
                <td className="py-3 px-3 text-gold-600 font-bold">Survey CSAT</td>
                <td className="py-3 px-3 text-charcoal-400">Tidak Ada</td>
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
        <div className="p-4 sm:p-5 border-b border-[#EAE8E3] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-black text-charcoal-900">Daftar Akun Pengguna CRM</h2>
            <p className="text-xs text-charcoal-500 mt-0.5">Persetujuan Owner, penghapusan akun, dan penetapan peran jabatan</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
              {activeUsers.length} Aktif
            </span>
            {pendingUsers.length > 0 && (
              <span className="text-xs font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-300 animate-pulse">
                {pendingUsers.length} Pending
              </span>
            )}
            <span className="text-xs font-bold text-gold-600 bg-gold-50 px-2.5 py-1 rounded-lg border border-gold-200">
              Total {users.length} Akun
            </span>
          </div>
        </div>

        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto w-full">
          <table className="crm-table w-full min-w-[750px] text-left">
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
                const isSelf = u.id === currentUser.id || u.email.toLowerCase() === currentUser.email.toLowerCase();
                const isOwnerAccount = u.role === 'Owner' || u.email.toLowerCase().includes('farhanhizri8');

                return (
                  <tr key={u.id} className="hover:bg-[#F8F7F4]/80 transition-colors">
                    {/* Name & Avatar */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        {u.avatar ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={u.avatar}
                            alt={u.name}
                            className="w-9 h-9 rounded-xl object-cover border border-gold-300 shadow-2xs shrink-0 bg-warm-100"
                          />
                        ) : (
                          <div className="w-9 h-9 rounded-xl bg-gold-100 text-gold-900 border border-gold-300 flex items-center justify-center font-bold text-xs uppercase shrink-0 shadow-2xs">
                            {u.name.charAt(0)}
                          </div>
                        )}
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

                    {/* Role / Jobdesks */}
                    <td className="py-3.5 px-4">
                      {isOwnerAccount ? (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-gold-50 text-gold-800 border border-gold-300">
                          Owner
                        </span>
                      ) : (
                        <div className="space-y-1.5">
                          <div className="flex flex-wrap gap-1 max-w-[260px]">
                            {getUserJobdesks(u).map((desk) => (
                              <span
                                key={desk}
                                className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${getJobdeskBadgeStyle(desk)}`}
                              >
                                {desk}
                              </span>
                            ))}
                          </div>
                          {isOwner && (
                            <button
                              type="button"
                              onClick={() =>
                                setEditingUserJobdesks({
                                  id: u.id,
                                  name: u.name,
                                  jobdesks: getUserJobdesks(u),
                                })
                              }
                              className="text-[10px] font-bold text-gold-700 hover:text-gold-900 inline-flex items-center gap-1 hover:underline cursor-pointer"
                            >
                              <Edit3 className="w-3 h-3" />
                              <span>Atur Jobdesk</span>
                            </button>
                          )}
                        </div>
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
                        <div className="flex items-center justify-center gap-1.5">
                          {isOwner && (
                            <button
                              onClick={() => handleApprove(u.id, u.name)}
                              className="btn-gold py-1 px-2.5 text-xs inline-flex items-center gap-1 shadow-xs font-bold"
                              title="Setujui akun login karyawan"
                            >
                              <CheckCircle className="w-3.5 h-3.5" />
                              <span>Setujui</span>
                            </button>
                          )}
                          <button
                            onClick={() => setDeleteConfirmUser({ id: u.id, name: u.name, email: u.email })}
                            className="text-rose-700 hover:text-white hover:bg-rose-600 bg-rose-50 px-2.5 py-1 rounded-xl border border-rose-200 inline-flex items-center gap-1 text-xs font-semibold transition-colors"
                            title={`Tolak pendaftaran & hapus akun ${u.name}`}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Hapus Akun</span>
                          </button>
                        </div>
                      ) : isOwnerAccount ? (
                        <span className="badge-gold text-[10px] font-black inline-flex items-center gap-1">
                          <Shield className="w-3 h-3" />
                          Owner Utama
                        </span>
                      ) : isSelf ? (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-charcoal-100 text-charcoal-700 border border-charcoal-200 inline-flex items-center gap-1">
                          <User className="w-3 h-3" />
                          Akun Anda
                        </span>
                      ) : (
                        <button
                          onClick={() => setDeleteConfirmUser({ id: u.id, name: u.name, email: u.email })}
                          className="text-rose-700 hover:text-white hover:bg-rose-600 bg-rose-50 px-2.5 py-1 rounded-xl border border-rose-200 inline-flex items-center gap-1 text-xs font-semibold transition-colors cursor-pointer"
                          title={`Hapus akun ${u.name}`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Hapus Akun</span>
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Mobile View Cards */}
        <div className="block md:hidden divide-y divide-[#EAE8E3]">
          {users.map((u) => {
            const isPending = !u.isApproved;
            const isSelf = u.id === currentUser.id || u.email.toLowerCase() === currentUser.email.toLowerCase();
            const isOwnerAccount = u.role === 'Owner' || u.email.toLowerCase().includes('farhanhizri8');

            return (
              <div key={u.id} className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gold-100 text-gold-900 border border-gold-300 flex items-center justify-center font-bold text-sm uppercase shrink-0 shadow-2xs">
                      {u.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-bold text-charcoal-900 text-sm leading-tight">{u.name}</p>
                      <p className="text-xs text-charcoal-600 font-semibold">{u.email}</p>
                      <span className="text-[10px] text-charcoal-400 font-mono">{u.id} • {formatDate(u.createdAt)}</span>
                    </div>
                  </div>
                  {isPending ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-300">
                      <Clock className="w-3 h-3" />
                      Pending
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                      <CheckCircle className="w-3 h-3" />
                      Aktif
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between text-xs bg-[#F8F7F4] p-2.5 rounded-xl border border-[#EAE8E3]">
                  <span className="text-charcoal-500">No. WA / HP:</span>
                  <span className="font-mono text-charcoal-800 font-medium">{u.phone || '-'}</span>
                </div>

                <div className="space-y-1.5 bg-[#F8F7F4] p-2.5 rounded-xl border border-[#EAE8E3]">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-charcoal-500 font-medium">Jobdesk Showroom:</span>
                    {isOwner && !isOwnerAccount && (
                      <button
                        type="button"
                        onClick={() =>
                          setEditingUserJobdesks({
                            id: u.id,
                            name: u.name,
                            jobdesks: getUserJobdesks(u),
                          })
                        }
                        className="text-[10px] font-bold text-gold-700 flex items-center gap-1 hover:underline cursor-pointer"
                      >
                        <Edit3 className="w-3 h-3" />
                        <span>Ubah Jobdesk</span>
                      </button>
                    )}
                  </div>
                  {isOwnerAccount ? (
                    <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-black bg-gold-50 text-gold-800 border border-gold-300">
                      Owner
                    </span>
                  ) : (
                    <div className="flex flex-wrap gap-1 pt-0.5">
                      {getUserJobdesks(u).map((desk) => (
                        <span
                          key={desk}
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${getJobdeskBadgeStyle(desk)}`}
                        >
                          {desk}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Mobile Actions */}
                <div className="pt-1 flex items-center justify-end gap-2">
                  {isPending ? (
                    <div className="flex items-center gap-2 w-full">
                      {isOwner && (
                        <button
                          onClick={() => handleApprove(u.id, u.name)}
                          className="btn-gold py-1.5 px-3 text-xs inline-flex items-center gap-1 flex-1 justify-center font-bold"
                        >
                          <CheckCircle className="w-3.5 h-3.5" />
                          <span>Setujui</span>
                        </button>
                      )}
                      <button
                        onClick={() => setDeleteConfirmUser({ id: u.id, name: u.name, email: u.email })}
                        className="py-1.5 px-3 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-600 hover:text-white border border-rose-200 rounded-xl inline-flex items-center gap-1 flex-1 justify-center transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Hapus Akun</span>
                      </button>
                    </div>
                  ) : isOwnerAccount ? (
                    <span className="badge-gold text-[10px] font-black inline-flex items-center gap-1">
                      <Shield className="w-3 h-3" /> Owner Showroom (Utama)
                    </span>
                  ) : isSelf ? (
                    <span className="px-2.5 py-1 rounded-xl text-[10px] font-bold bg-charcoal-100 text-charcoal-700 border border-charcoal-200">
                      Akun Anda Saat Ini
                    </span>
                  ) : (
                    <button
                      onClick={() => setDeleteConfirmUser({ id: u.id, name: u.name, email: u.email })}
                      className="text-rose-700 hover:text-white hover:bg-rose-600 bg-rose-50 px-3 py-1.5 rounded-xl border border-rose-200 inline-flex items-center gap-1 text-xs font-semibold transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Hapus Akun</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* MODAL: KONFIRMASI HAPUS AKUN */}
      {deleteConfirmUser && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-charcoal-950/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="crm-card w-full max-w-md overflow-hidden flex flex-col shadow-2xl border-rose-500/40 bg-white">
            <div className="flex items-center justify-between px-5 py-4 bg-rose-950/20 border-b border-rose-500/30">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-rose-500/20 text-rose-600 flex items-center justify-center border border-rose-500/30">
                  <Trash2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-charcoal-900">Konfirmasi Hapus Akun</h3>
                  <p className="text-[11px] text-charcoal-500">Tindakan ini menghapus akses secara permanen</p>
                </div>
              </div>
              <button
                disabled={isDeleting}
                onClick={() => setDeleteConfirmUser(null)}
                className="w-7 h-7 flex items-center justify-center rounded-lg text-charcoal-400 hover:text-charcoal-700 hover:bg-warm-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-3 text-xs text-charcoal-700">
              <p>
                Apakah Anda yakin ingin menghapus akun <strong className="text-charcoal-900">{deleteConfirmUser.name}</strong> ({deleteConfirmUser.email})?
              </p>
              <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-900 space-y-1.5">
                <span className="font-bold flex items-center gap-1.5 text-xs text-rose-800">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  Konsekuensi Penting:
                </span>
                <p className="text-[11px] leading-relaxed">
                  Setelah akun dihapus, pengguna ini <strong>otomatis tidak dapat login lagi</strong> ke sistem HR MOTOR. Jika pengguna ingin menggunakan aplikasi kembali, mereka harus melakukan pendaftaran akun baru dan menunggu persetujuan (approval) dari Owner.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 px-5 py-3.5 bg-[#FAF9F5] border-t border-[#EAE8E3]">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setDeleteConfirmUser(null)}
                className="btn-outline-warm text-xs py-2 px-3.5 cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => handleDeleteUser(deleteConfirmUser.id, deleteConfirmUser.name)}
                className="py-2 px-4 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 transition-colors shadow-xs flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{isDeleting ? 'Menghapus...' : 'Ya, Hapus Akun Ini'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: KONFIRMASI TOLAK PENDAFTARAN */}
      {rejectConfirmUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-charcoal-950/40 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="crm-card w-full max-w-md overflow-hidden flex flex-col shadow-luxury border-amber-500/40">
            <div className="flex items-center justify-between px-5 py-4 bg-amber-950/20 border-b border-amber-500/30">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-700 flex items-center justify-center border border-amber-500/30">
                  <XCircle className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-charcoal-900">Tolak Permohonan Akun</h3>
                  <p className="text-[11px] text-charcoal-500">Batalkan pendaftaran akses login</p>
                </div>
              </div>
              <button
                onClick={() => setRejectConfirmUser(null)}
                className="w-7 h-7 flex items-center justify-center rounded-lg text-charcoal-400 hover:text-charcoal-700 hover:bg-warm-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-3 text-xs text-charcoal-700">
              <p>
                Tolak pengajuan akun pendaftaran dari <strong className="text-charcoal-900">{rejectConfirmUser.name}</strong> ({rejectConfirmUser.email})?
              </p>
              <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 space-y-1">
                <span className="font-bold flex items-center gap-1.5 text-xs text-amber-800">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                  Informasi:
                </span>
                <p className="text-[11px] leading-relaxed">
                  Data pendaftaran akan dibatalkan dan dihapus. Pengguna tidak akan bisa login ke sistem dan harus mendaftar ulang jika membutuhkan akses showroom.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 px-5 py-3.5 bg-[#FAF9F5] border-t border-[#EAE8E3]">
              <button
                type="button"
                onClick={() => setRejectConfirmUser(null)}
                className="btn-outline-warm text-xs py-2 px-3.5"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => handleReject(rejectConfirmUser.id, rejectConfirmUser.name)}
                className="py-2 px-4 rounded-xl text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 transition-colors shadow-xs flex items-center gap-1.5"
              >
                <XCircle className="w-3.5 h-3.5" />
                <span>Tolak & Hapus Pengajuan</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: REGISTER EMPLOYEE */}
      {isRegisterModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-charcoal-950/40 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-150">
          <div className="crm-card w-full max-w-md my-auto max-h-[90vh] overflow-hidden flex flex-col shadow-luxury border-gold-500/30">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 sm:py-4 bg-[#FAF9F5] border-b border-[#EAE8E3] text-charcoal-900 shrink-0 relative">
              <div>
                <span className="badge-gold text-[10px] mb-1 inline-block">Registrasi Akun</span>
                <h3 className="text-base font-black text-charcoal-900">Daftarkan Karyawan Baru</h3>
                <p className="text-xs text-charcoal-500">Akun baru akan berstatus PENDING hingga disetujui Owner</p>
              </div>
              <button
                onClick={() => setIsRegisterModalOpen(false)}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-charcoal-400 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {formError && (
              <div className="mx-4 sm:mx-6 mt-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-medium shrink-0">
                {formError}
              </div>
            )}

            <form onSubmit={handleRegisterSubmit} className="p-4 sm:p-6 space-y-4 text-xs overflow-y-auto flex-1">
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
                <div className="flex items-center justify-between mb-1">
                  <label className="block font-bold text-charcoal-800 text-xs">
                    Pilihan Jobdesk / Posisi Showroom <span className="text-rose-500">*</span>
                  </label>
                  <span className="text-[10px] font-bold text-gold-800 bg-gold-50 px-2 py-0.5 rounded-full border border-gold-300">
                    Bisa pilih &gt; 1 ({formData.jobdesks.length} terpilih)
                  </span>
                </div>
                <p className="text-[11px] text-charcoal-500 mb-2">
                  Tandai tugas yang dipegang oleh karyawan ini di showroom:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {SHOWROOM_JOBDESKS.map((desk) => {
                    const isSelected = formData.jobdesks.includes(desk.id);
                    return (
                      <button
                        key={desk.id}
                        type="button"
                        onClick={() => toggleFormJobdesk(desk.id)}
                        className={`flex items-start gap-2 p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-[#FDF8ED] border-gold-500 ring-1 ring-gold-500/30'
                            : 'bg-white border-[#EAE8E3] hover:border-gold-300'
                        }`}
                      >
                        <div
                          className={`w-4 h-4 rounded-md flex items-center justify-center shrink-0 mt-0.5 ${
                            isSelected ? 'bg-gold-600 text-white' : 'border border-warm-300 bg-warm-50'
                          }`}
                        >
                          {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-bold text-[11px] text-charcoal-900 leading-tight">
                            {desk.title}
                          </p>
                          <p className="text-[9.5px] text-charcoal-500 leading-tight mt-0.5 line-clamp-1">
                            {desk.description}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="p-3.5 bg-[#FAF9F5] rounded-xl border border-gold-500/30 text-charcoal-700 space-y-1">
                <span className="font-bold text-gold-800 block text-[11px] uppercase tracking-wider">Ketentuan Persetujuan:</span>
                <p className="text-[11px] leading-relaxed">
                  Akun ini tidak dapat mengakses database hingga Farhan Hizri (Owner) memberikan persetujuan resmi di halaman ini.
                </p>
              </div>

              <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-2.5 pt-3 border-t border-[#EAE8E3]">
                <button
                  type="button"
                  onClick={() => setIsRegisterModalOpen(false)}
                  className="btn-outline-warm text-xs w-full sm:w-auto"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="btn-gold text-xs w-full sm:w-auto"
                >
                  Ajukan Pendaftaran
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Kelola Jobdesk Karyawan */}
      {editingUserJobdesks && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-charcoal-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-warm-200 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-4 sm:p-5 border-b border-[#EAE8E3] flex items-center justify-between bg-[#F8F7F4]">
              <div>
                <h3 className="font-bold text-sm text-charcoal-900">Kelola Jobdesk Karyawan</h3>
                <p className="text-xs text-charcoal-600 font-semibold mt-0.5">{editingUserJobdesks.name}</p>
              </div>
              <button
                onClick={() => setEditingUserJobdesks(null)}
                className="p-1 rounded-lg hover:bg-warm-200 text-charcoal-400 hover:text-charcoal-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 sm:p-5 space-y-3 overflow-y-auto">
              <div className="flex items-center justify-between">
                <p className="text-xs text-charcoal-600 font-medium">
                  Pilih tugas yang dijalankan oleh karyawan ini (bisa lebih dari satu):
                </p>
                <span className="text-[10px] font-bold text-gold-800 bg-gold-50 px-2 py-0.5 rounded-full border border-gold-300">
                  {editingUserJobdesks.jobdesks.length} Terpilih
                </span>
              </div>

              <div className="space-y-2">
                {SHOWROOM_JOBDESKS.map((desk) => {
                  const isChecked = editingUserJobdesks.jobdesks.includes(desk.id);
                  return (
                    <button
                      key={desk.id}
                      type="button"
                      onClick={() => {
                        setEditingUserJobdesks((prev) => {
                          if (!prev) return null;
                          const exists = prev.jobdesks.includes(desk.id);
                          if (exists && prev.jobdesks.length === 1) return prev;
                          const updated = exists
                            ? prev.jobdesks.filter((d) => d !== desk.id)
                            : [...prev.jobdesks, desk.id];
                          return { ...prev, jobdesks: updated };
                        });
                      }}
                      className={`w-full flex items-start gap-3 p-3 rounded-xl border text-left transition-all cursor-pointer ${
                        isChecked
                          ? 'bg-[#FDF8ED] border-gold-500 ring-1 ring-gold-500/30'
                          : 'bg-warm-50/60 border-warm-200 hover:border-gold-300 hover:bg-white'
                      }`}
                    >
                      <div
                        className={`w-4 h-4 rounded-md flex items-center justify-center shrink-0 mt-0.5 ${
                          isChecked ? 'bg-gold-600 text-white' : 'border border-warm-300 bg-white'
                        }`}
                      >
                        {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-bold text-xs text-charcoal-900 leading-tight">
                          {desk.title}
                        </p>
                        <p className="text-[10px] text-charcoal-500 leading-tight mt-0.5">
                          {desk.description}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="p-4 border-t border-[#EAE8E3] bg-[#F8F7F4] flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setEditingUserJobdesks(null)}
                className="btn-outline-warm text-xs"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={async () => {
                  if (!editingUserJobdesks || editingUserJobdesks.jobdesks.length === 0) return;
                  const primaryRole = editingUserJobdesks.jobdesks[0] as UserRole;
                  const res = await changeUserRole(editingUserJobdesks.id, primaryRole, editingUserJobdesks.jobdesks);
                  if (res.success) {
                    setActionMessage(`Jobdesk ${editingUserJobdesks.name} berhasil diperbarui.`);
                    setTimeout(() => setActionMessage(''), 4000);
                    setEditingUserJobdesks(null);
                  } else {
                    alert(res.error || 'Gagal memperbarui jobdesk.');
                  }
                }}
                className="btn-gold text-xs"
              >
                Simpan Jobdesk
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
