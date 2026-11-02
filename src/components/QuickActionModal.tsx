'use client';

import React, { useState } from 'react';
import { X, UserPlus, Target, CalendarClock, MessageSquare, Wrench } from 'lucide-react';
import { useCrm } from '@/context/CrmContext';
import { LeadSourceType, VehicleCategory, PriorityLevel, FollowUpChannel } from '@/types/crm';

interface QuickActionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const QuickActionModal: React.FC<QuickActionModalProps> = ({ isOpen, onClose }) => {
  const { addCustomer, addLead, addFollowUp, logCommunication, addRepairClaim, customers, leads, users, currentUser } = useCrm();

  const [activeTab, setActiveTab] = useState<'customer' | 'lead' | 'followup' | 'comm' | 'repair'>('customer');
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Form states
  const [custForm, setCustForm] = useState({
    fullName: '',
    whatsapp: '',
    email: '',
    address: '',
    district: 'Tarogong Kidul',
    source: 'Walk-in' as LeadSourceType,
    interestedVehicle: '',
    vehicleType: 'MPV' as VehicleCategory,
    budget: '',
    notes: '',
  });

  const [leadForm, setLeadForm] = useState({
    customerName: '',
    contactNumber: '',
    email: '',
    leadSource: 'WhatsApp' as LeadSourceType,
    interestedVehicle: '',
    estimatedBudget: '',
    assignedSalesId: currentUser.role === 'Sales Representative' ? currentUser.id : 'USR-003',
    notes: '',
  });

  const [flwForm, setFlwForm] = useState({
    customerId: '',
    scheduledDate: new Date().toISOString().split('T')[0],
    scheduledTime: '10:00',
    channel: 'WhatsApp' as FollowUpChannel,
    priority: 'Sedang' as PriorityLevel,
    assignedSalesId: currentUser.role === 'Sales Representative' ? currentUser.id : 'USR-003',
    notes: '',
  });

  const [commForm, setCommForm] = useState({
    customerId: '',
    channel: 'WhatsApp' as const,
    direction: 'Keluar' as const,
    messageContent: '',
    notes: '',
  });

  const [repairForm, setRepairForm] = useState({
    customerId: '',
    customerName: '',
    customerPhone: '',
    vehicleModel: '',
    vehicleYear: 2021,
    claimType: 'Garansi' as 'Garansi',
    complaintOrDamage: '',
    sparepartCost: 0,
    serviceCost: 0,
  });

  if (!isOpen) return null;

  const handleCustomerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMessage('');

    const res = await addCustomer({
      ...custForm,
      budget: Number(custForm.budget) || 0,
      status: 'Aktif',
    });

    setSubmitting(false);
    if (res.success) {
      onClose();
    } else {
      setErrorMessage(res.error || 'Gagal menambahkan pelanggan');
    }
  };

  const handleLeadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMessage('');

    const assignedUser = users.find((u) => u.id === leadForm.assignedSalesId);

    const res = await addLead({
      ...leadForm,
      estimatedBudget: Number(leadForm.estimatedBudget) || 0,
      assignedSalesName: assignedUser?.name || 'Asep Kurniawan',
      status: 'Menanyakan Unit',
    });

    setSubmitting(false);
    if (res.success) {
      onClose();
    } else {
      setErrorMessage(res.error || 'Gagal menambahkan prospek');
    }
  };

  const handleFollowUpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMessage('');

    const cust = customers.find((c) => c.id === flwForm.customerId);
    const assignedUser = users.find((u) => u.id === flwForm.assignedSalesId);

    if (!cust) {
      setErrorMessage('Pilih pelanggan terlebih dahulu');
      setSubmitting(false);
      return;
    }

    const res = await addFollowUp({
      customerId: cust.id,
      customerName: cust.fullName,
      customerPhone: cust.whatsapp,
      scheduledDate: flwForm.scheduledDate,
      scheduledTime: flwForm.scheduledTime,
      channel: flwForm.channel,
      priority: flwForm.priority,
      assignedSalesId: flwForm.assignedSalesId,
      assignedSalesName: assignedUser?.name || 'Asep Kurniawan',
      notes: flwForm.notes,
    });

    setSubmitting(false);
    if (res.success) {
      onClose();
    } else {
      setErrorMessage(res.error || 'Gagal menjadwalkan follow-up');
    }
  };

  const handleCommSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMessage('');

    const cust = customers.find((c) => c.id === commForm.customerId);
    if (!cust) {
      setErrorMessage('Pilih pelanggan terlebih dahulu');
      setSubmitting(false);
      return;
    }

    const res = await logCommunication({
      customerId: cust.id,
      customerName: cust.fullName,
      customerPhone: cust.whatsapp,
      channel: commForm.channel,
      direction: commForm.direction,
      messageContent: commForm.messageContent,
      notes: commForm.notes,
    });

    setSubmitting(false);
    if (res.success) {
      onClose();
    } else {
      setErrorMessage(res.error || 'Gagal mencatat komunikasi');
    }
  };

  const handleRepairSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMessage('');

    if (!repairForm.customerName.trim() || !repairForm.customerPhone.trim() || !repairForm.vehicleModel.trim()) {
      setErrorMessage('Lengkapi nama konsumen, nomor WhatsApp, dan model mobil.');
      setSubmitting(false);
      return;
    }

    const sparepart = Number(repairForm.sparepartCost) || 0;
    const service = Number(repairForm.serviceCost) || 0;

    const res = await addRepairClaim({
      customerId: repairForm.customerId || undefined,
      customerName: repairForm.customerName.trim(),
      customerPhone: repairForm.customerPhone.trim(),
      vehicleBrand: repairForm.vehicleModel.split(' ')[0] || 'Toyota',
      vehicleModel: repairForm.vehicleModel.trim(),
      vehicleYear: Number(repairForm.vehicleYear) || 2021,
      claimType: repairForm.claimType,
      damageCategory: 'Mesin',
      complaintOrDamage: repairForm.complaintOrDamage.trim(),
      complaint: repairForm.complaintOrDamage.trim(),
      sparepartCost: sparepart,
      serviceCost: service,
      totalCost: sparepart + service,
      status: 'Menunggu',
    });

    setSubmitting(false);
    if (res.success) {
      onClose();
    } else {
      setErrorMessage(res.error || 'Gagal menambahkan klaim perbaikan');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-charcoal-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="crm-card w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden shadow-luxury border-gold-500/30">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gold-500/30 bg-charcoal-900 text-white">
          <div>
            <span className="badge-gold text-[10px] mb-1 inline-block">Shortcut Pintasan</span>
            <h2 className="text-base font-black text-white">Aksi Cepat Showroom</h2>
            <p className="text-xs text-charcoal-300">Pilih tindakan cepat operasional HR MOTOR Garut</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-charcoal-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selector */}
        <div className="flex border-b border-[#EAE8E3] px-6 bg-[#FAF9F5] gap-2 pt-2">
          <button
            onClick={() => { setActiveTab('customer'); setErrorMessage(''); }}
            className={`flex items-center gap-2 pb-3 px-3 text-xs font-bold border-b-2 transition-all ${
              activeTab === 'customer'
                ? 'border-gold-500 text-gold-600'
                : 'border-transparent text-charcoal-500 hover:text-charcoal-900'
            }`}
          >
            <UserPlus className="w-4 h-4" />
            + Pelanggan
          </button>
          <button
            onClick={() => { setActiveTab('lead'); setErrorMessage(''); }}
            className={`flex items-center gap-2 pb-3 px-3 text-xs font-bold border-b-2 transition-all ${
              activeTab === 'lead'
                ? 'border-gold-500 text-gold-600'
                : 'border-transparent text-charcoal-500 hover:text-charcoal-900'
            }`}
          >
            <Target className="w-4 h-4" />
            + Prospek
          </button>
          <button
            onClick={() => { setActiveTab('followup'); setErrorMessage(''); }}
            className={`flex items-center gap-2 pb-3 px-3 text-xs font-bold border-b-2 transition-all ${
              activeTab === 'followup'
                ? 'border-gold-500 text-gold-600'
                : 'border-transparent text-charcoal-500 hover:text-charcoal-900'
            }`}
          >
            <CalendarClock className="w-4 h-4" />
            + Follow-up
          </button>
          <button
            onClick={() => { setActiveTab('comm'); setErrorMessage(''); }}
            className={`flex items-center gap-2 pb-3 px-3 text-xs font-bold border-b-2 transition-all ${
              activeTab === 'comm'
                ? 'border-gold-500 text-gold-600'
                : 'border-transparent text-charcoal-500 hover:text-charcoal-900'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            + Komunikasi
          </button>
          <button
            onClick={() => { setActiveTab('repair'); setErrorMessage(''); }}
            className={`flex items-center gap-2 pb-3 px-3 text-xs font-bold border-b-2 transition-all ${
              activeTab === 'repair'
                ? 'border-gold-500 text-gold-600'
                : 'border-transparent text-charcoal-500 hover:text-charcoal-900'
            }`}
          >
            <Wrench className="w-4 h-4" />
            + Riwayat Perbaikan
          </button>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="mx-6 mt-4 p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 font-medium">
            {errorMessage}
          </div>
        )}

        {/* Form Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* TAB 1: ADD CUSTOMER */}
          {activeTab === 'customer' && (
            <form onSubmit={handleCustomerSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nama Lengkap <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={custForm.fullName}
                    onChange={(e) => setCustForm({ ...custForm, fullName: e.target.value })}
                    placeholder="Contoh: H. Dadan Wildan"
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nomor WhatsApp <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    value={custForm.whatsapp}
                    onChange={(e) => setCustForm({ ...custForm, whatsapp: e.target.value })}
                    placeholder="0812xxxxxxxx"
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={custForm.email}
                    onChange={(e) => setCustForm({ ...custForm, email: e.target.value })}
                    placeholder="nama@email.com"
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Kecamatan di Garut</label>
                  <select
                    value={custForm.district}
                    onChange={(e) => setCustForm({ ...custForm, district: e.target.value })}
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
                  >
                    <option value="Tarogong Kidul">Tarogong Kidul</option>
                    <option value="Tarogong Kaler">Tarogong Kaler</option>
                    <option value="Garut Kota">Garut Kota</option>
                    <option value="Samarang">Samarang</option>
                    <option value="Karangpawitan">Karangpawitan</option>
                    <option value="Kadungora">Kadungora</option>
                    <option value="Limbangan">Balubur Limbangan</option>
                    <option value="Leles">Leles</option>
                    <option value="Cilawu">Cilawu</option>
                    <option value="Wanaraja">Wanaraja</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Alamat Lengkap</label>
                <input
                  type="text"
                  value={custForm.address}
                  onChange={(e) => setCustForm({ ...custForm, address: e.target.value })}
                  placeholder="Jl. Raya Cipanas No. 42, RT 02/RW 05"
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Sumber Pelanggan</label>
                  <select
                    value={custForm.source}
                    onChange={(e) => setCustForm({ ...custForm, source: e.target.value as LeadSourceType })}
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
                  >
                    <option value="Walk-in">Walk-in (Showroom)</option>
                    <option value="WhatsApp">WhatsApp</option>
                    <option value="Instagram">Instagram</option>
                    <option value="Facebook">Facebook</option>
                    <option value="TikTok">TikTok</option>
                    <option value="Other">Lainnya</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Mobil Diminati</label>
                  <input
                    type="text"
                    required
                    value={custForm.interestedVehicle}
                    onChange={(e) => setCustForm({ ...custForm, interestedVehicle: e.target.value })}
                    placeholder="Contoh: Innova Reborn 2020"
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Budget (Rp)</label>
                  <input
                    type="number"
                    value={custForm.budget}
                    onChange={(e) => setCustForm({ ...custForm, budget: e.target.value })}
                    placeholder="250000000"
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Catatan Kebutuhan</label>
                <input
                  type="text"
                  value={custForm.notes}
                  onChange={(e) => setCustForm({ ...custForm, notes: e.target.value })}
                  placeholder="Rencana kredit DP 40 jt..."
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm shadow-emerald-600/30 transition-all disabled:opacity-50"
                >
                  {submitting ? 'Menyimpan...' : 'Simpan Pelanggan'}
                </button>
              </div>
            </form>
          )}

          {/* TAB 2: ADD LEAD */}
          {activeTab === 'lead' && (
            <form onSubmit={handleLeadSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nama Calon Pembeli <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={leadForm.customerName}
                    onChange={(e) => setLeadForm({ ...leadForm, customerName: e.target.value })}
                    placeholder="Contoh: Wawan Hermawan"
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nomor Kontak (WhatsApp) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    value={leadForm.contactNumber}
                    onChange={(e) => setLeadForm({ ...leadForm, contactNumber: e.target.value })}
                    placeholder="0857xxxxxxxx"
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Sumber Prospek</label>
                  <select
                    value={leadForm.leadSource}
                    onChange={(e) => setLeadForm({ ...leadForm, leadSource: e.target.value as LeadSourceType })}
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
                  >
                    <option value="WhatsApp">WhatsApp</option>
                    <option value="Instagram">Instagram</option>
                    <option value="Facebook">Facebook</option>
                    <option value="TikTok">TikTok</option>
                    <option value="Walk-in">Walk-in</option>
                    <option value="Referral">Referral</option>
                    <option value="Other">Lainnya</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Unit Mobil Diminati</label>
                  <input
                    type="text"
                    required
                    value={leadForm.interestedVehicle}
                    onChange={(e) => setLeadForm({ ...leadForm, interestedVehicle: e.target.value })}
                    placeholder="Avanza 1.3 G M/T 2019"
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Estimasi Budget (Rp)</label>
                  <input
                    type="number"
                    value={leadForm.estimatedBudget}
                    onChange={(e) => setLeadForm({ ...leadForm, estimatedBudget: e.target.value })}
                    placeholder="170000000"
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Tugaskan Sales</label>
                  <select
                    value={leadForm.assignedSalesId}
                    onChange={(e) => setLeadForm({ ...leadForm, assignedSalesId: e.target.value })}
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
                  >
                    {users.filter(u => u.role === 'Sales Representative' || u.role === 'CRM Administrator').map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name} ({u.role})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Catatan Respon Awal</label>
                  <input
                    type="text"
                    value={leadForm.notes}
                    onChange={(e) => setLeadForm({ ...leadForm, notes: e.target.value })}
                    placeholder="Tanya DP minimal dan kondisi ban..."
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm shadow-emerald-600/30 transition-all disabled:opacity-50"
                >
                  {submitting ? 'Menyimpan...' : 'Tambahkan ke Pipeline'}
                </button>
              </div>
            </form>
          )}

          {/* TAB 3: ADD FOLLOW-UP */}
          {activeTab === 'followup' && (
            <form onSubmit={handleFollowUpSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Pilih Pelanggan / Prospek <span className="text-rose-500">*</span>
                </label>
                <select
                  required
                  value={flwForm.customerId}
                  onChange={(e) => setFlwForm({ ...flwForm, customerId: e.target.value })}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
                >
                  <option value="">-- Pilih dari Database Pelanggan --</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.fullName} - {c.whatsapp} ({c.interestedVehicle})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Tanggal Jadwal</label>
                  <input
                    type="date"
                    required
                    value={flwForm.scheduledDate}
                    onChange={(e) => setFlwForm({ ...flwForm, scheduledDate: e.target.value })}
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Waktu (WIB)</label>
                  <input
                    type="time"
                    required
                    value={flwForm.scheduledTime}
                    onChange={(e) => setFlwForm({ ...flwForm, scheduledTime: e.target.value })}
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Kanal Kontak</label>
                  <select
                    value={flwForm.channel}
                    onChange={(e) => setFlwForm({ ...flwForm, channel: e.target.value as FollowUpChannel })}
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
                  >
                    <option value="WhatsApp">WhatsApp</option>
                    <option value="Telepon">Telepon Langsung</option>
                    <option value="Kunjungan Dealer">Kunjungan ke Dealer</option>
                    <option value="Kunjungan Rumah">Kunjungan ke Rumah</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Prioritas</label>
                  <select
                    value={flwForm.priority}
                    onChange={(e) => setFlwForm({ ...flwForm, priority: e.target.value as PriorityLevel })}
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
                  >
                    <option value="Tinggi">Tinggi (Hot)</option>
                    <option value="Sedang">Sedang (Warm)</option>
                    <option value="Rendah">Rendah (Cold)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Sales PJ</label>
                  <select
                    value={flwForm.assignedSalesId}
                    onChange={(e) => setFlwForm({ ...flwForm, assignedSalesId: e.target.value })}
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
                  >
                    {users.filter(u => u.role === 'Sales Representative' || u.role === 'CRM Administrator').map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Instruksi / Catatan Follow-up</label>
                <textarea
                  rows={3}
                  required
                  value={flwForm.notes}
                  onChange={(e) => setFlwForm({ ...flwForm, notes: e.target.value })}
                  placeholder="Misal: Tawarkan paket bonus kaca film dan konfirmasi jadwal cek unit..."
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm shadow-emerald-600/30 transition-all disabled:opacity-50"
                >
                  {submitting ? 'Menjadwalkan...' : 'Jadwalkan Follow-up'}
                </button>
              </div>
            </form>
          )}

          {/* TAB 4: LOG COMMUNICATION */}
          {activeTab === 'comm' && (
            <form onSubmit={handleCommSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Pilih Pelanggan <span className="text-rose-500">*</span>
                </label>
                <select
                  required
                  value={commForm.customerId}
                  onChange={(e) => setCommForm({ ...commForm, customerId: e.target.value })}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
                >
                  <option value="">-- Pilih dari Database Pelanggan --</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.fullName} - {c.whatsapp}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Kanal Komunikasi</label>
                  <select
                    value={commForm.channel}
                    onChange={(e) => setCommForm({ ...commForm, channel: e.target.value as any })}
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
                  >
                    <option value="WhatsApp">WhatsApp</option>
                    <option value="Telepon">Telepon</option>
                    <option value="Walk-in">Walk-in Showroom</option>
                    <option value="Email">Email</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Arah Percakapan</label>
                  <select
                    value={commForm.direction}
                    onChange={(e) => setCommForm({ ...commForm, direction: e.target.value as any })}
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
                  >
                    <option value="Keluar">Keluar (Outbound - Sales Hubungi Pelanggan)</option>
                    <option value="Masuk">Masuk (Inbound - Pelanggan Hubungi Dealer)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Ringkasan Pesan / Isi Percakapan</label>
                <textarea
                  rows={3}
                  required
                  value={commForm.messageContent}
                  onChange={(e) => setCommForm({ ...commForm, messageContent: e.target.value })}
                  placeholder="Isi percakapan dengan konsumen..."
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Hasil & Rencana Tindak Lanjut</label>
                <input
                  type="text"
                  value={commForm.notes}
                  onChange={(e) => setCommForm({ ...commForm, notes: e.target.value })}
                  placeholder="Konsumen meminta dikirimkan foto detail mesin..."
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm shadow-emerald-600/30 transition-all disabled:opacity-50"
                >
                  {submitting ? 'Menyimpan...' : 'Catat Komunikasi'}
                </button>
              </div>
            </form>
          )}

          {/* TAB 5: FORM PERBAIKAN / KLAIM */}
          {activeTab === 'repair' && (
            <form onSubmit={handleRepairSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Pilih Konsumen Terdaftar (Opsional)
                </label>
                <select
                  value={repairForm.customerId}
                  onChange={(e) => {
                    const cust = customers.find((c) => c.id === e.target.value);
                    if (cust) {
                      setRepairForm({
                        ...repairForm,
                        customerId: cust.id,
                        customerName: cust.fullName,
                        customerPhone: cust.whatsapp,
                        vehicleModel: cust.interestedVehicle || '',
                      });
                    } else {
                      setRepairForm({
                        ...repairForm,
                        customerId: '',
                      });
                    }
                  }}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 bg-white"
                >
                  <option value="">-- Ketik Konsumen Baru Secara Manual --</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.fullName} ({c.whatsapp}) — {c.interestedVehicle || 'Pelanggan'}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nama Konsumen <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={repairForm.customerName}
                    onChange={(e) => setRepairForm({ ...repairForm, customerName: e.target.value })}
                    placeholder="Contoh: Budi Santoso"
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nomor WhatsApp <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    value={repairForm.customerPhone}
                    onChange={(e) => setRepairForm({ ...repairForm, customerPhone: e.target.value })}
                    placeholder="081234567890"
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Mobil (Merek & Tipe) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={repairForm.vehicleModel}
                    onChange={(e) => setRepairForm({ ...repairForm, vehicleModel: e.target.value })}
                    placeholder="Contoh: Toyota Avanza 1.3 G"
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Jenis Klaim <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={repairForm.claimType}
                    onChange={(e) => setRepairForm({ ...repairForm, claimType: e.target.value as any })}
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 bg-white"
                  >
                    <option value="Garansi">Garansi Resmi Showroom HR MOTOR</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Keluhan / Kerusakan <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={2}
                  required
                  value={repairForm.complaintOrDamage}
                  onChange={(e) => setRepairForm({ ...repairForm, complaintOrDamage: e.target.value })}
                  placeholder="AC kurang dingin, bunyi decit rem..."
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Biaya Sparepart (Rp)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={repairForm.sparepartCost || ''}
                    onChange={(e) => setRepairForm({ ...repairForm, sparepartCost: Number(e.target.value) || 0 })}
                    placeholder="0"
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Biaya Jasa (Rp)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={repairForm.serviceCost || ''}
                    onChange={(e) => setRepairForm({ ...repairForm, serviceCost: Number(e.target.value) || 0 })}
                    placeholder="0"
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 font-mono"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm shadow-emerald-600/30 transition-all disabled:opacity-50"
                >
                  {submitting ? 'Menyimpan...' : 'Simpan Klaim Perbaikan'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
