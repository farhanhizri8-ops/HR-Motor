'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Target,
  Search,
  Filter,
  Plus,
  Edit,
  Eye,
  MessageCircle,
  CalendarClock,
  ArrowRight,
  UserCheck,
  Tag,
  DollarSign,
  Car,
  Clock,
  X,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';
import { useCrm } from '@/context/CrmContext';
import { Lead, LeadSourceType, PipelineStage, VehicleCategory } from '@/types/crm';

export default function LeadsPage() {
  const {
    leads,
    users,
    currentUser,
    addLead,
    updateLead,
    updateLeadStage,
    addCustomer,
    customers,
    formatRupiah,
    formatDate,
    formatWhatsAppLink,
  } = useCrm();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterSource, setFilterSource] = useState('ALL');
  const [filterStage, setFilterStage] = useState('ALL');
  const [filterSales, setFilterSales] = useState('ALL');

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [formError, setFormError] = useState('');

  // Form data state
  const [formData, setFormData] = useState({
    customerName: '',
    contactNumber: '',
    email: '',
    leadSource: 'WhatsApp' as LeadSourceType,
    interestedVehicle: '',
    vehicleType: 'MPV' as VehicleCategory,
    estimatedBudget: '',
    assignedSalesId: 'USR-003',
    status: 'Menanyakan Unit' as PipelineStage,
    notes: '',
    searchBrand: '',
    searchModel: '',
    searchYearMin: '',
    searchYearMax: '',
    searchBudgetMax: '',
    searchTransmission: 'Semua',
  });

  const filteredLeads = useMemo(() => {
    let result = [...leads];

    if (currentUser.role === 'Sales Representative') {
      result = result.filter((l) => l.assignedSalesId === currentUser.id || !l.assignedSalesId);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (l) =>
          l.customerName.toLowerCase().includes(q) ||
          l.contactNumber.includes(q) ||
          l.interestedVehicle.toLowerCase().includes(q) ||
          l.id.toLowerCase().includes(q)
      );
    }

    if (filterSource !== 'ALL') {
      result = result.filter((l) => l.leadSource === filterSource);
    }
    if (filterStage !== 'ALL') {
      result = result.filter((l) => l.status === filterStage);
    }
    if (filterSales !== 'ALL') {
      result = result.filter((l) => l.assignedSalesId === filterSales);
    }

    return result;
  }, [leads, currentUser, searchQuery, filterSource, filterStage, filterSales]);

  const openAddModal = () => {
    setEditingLead(null);
    setFormData({
      customerName: '',
      contactNumber: '',
      email: '',
      leadSource: 'WhatsApp',
      interestedVehicle: '',
      vehicleType: 'MPV',
      estimatedBudget: '',
      assignedSalesId: currentUser.role === 'Sales Representative' ? currentUser.id : 'USR-003',
      status: 'Menanyakan Unit',
      notes: '',
      searchBrand: '',
      searchModel: '',
      searchYearMin: '',
      searchYearMax: '',
      searchBudgetMax: '',
      searchTransmission: 'Semua',
    });
    setFormError('');
    setIsAddModalOpen(true);
  };

  const openEditModal = (lead: Lead) => {
    setEditingLead(lead);
    setFormData({
      customerName: lead.customerName,
      contactNumber: lead.contactNumber,
      email: lead.email || '',
      leadSource: lead.leadSource,
      interestedVehicle: lead.interestedVehicle,
      vehicleType: lead.vehicleType || 'MPV',
      estimatedBudget: String(lead.estimatedBudget || ''),
      assignedSalesId: lead.assignedSalesId || 'USR-003',
      status: lead.status,
      notes: lead.notes || '',
      searchBrand: lead.searchBrand || '',
      searchModel: lead.searchModel || '',
      searchYearMin: lead.searchYearMin ? String(lead.searchYearMin) : '',
      searchYearMax: lead.searchYearMax ? String(lead.searchYearMax) : '',
      searchBudgetMax: lead.searchBudgetMax ? String(lead.searchBudgetMax) : '',
      searchTransmission: lead.searchTransmission || 'Semua',
    });
    setFormError('');
    setIsAddModalOpen(true);
  };

  const handleSaveLead = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    const assignedUser = users.find((u) => u.id === formData.assignedSalesId);
    const searchData = {
      searchBrand: formData.searchBrand.trim() || undefined,
      searchModel: formData.searchModel.trim() || undefined,
      searchYearMin: formData.searchYearMin ? Number(formData.searchYearMin) : undefined,
      searchYearMax: formData.searchYearMax ? Number(formData.searchYearMax) : undefined,
      searchBudgetMax: formData.searchBudgetMax ? Number(formData.searchBudgetMax) : undefined,
      searchTransmission: (formData.searchTransmission !== 'Semua' ? formData.searchTransmission : undefined) as any,
    };

    if (editingLead) {
      const res = await updateLead({
        id: editingLead.id,
        ...formData,
        ...searchData,
        estimatedBudget: Number(formData.estimatedBudget) || 0,
        assignedSalesName: assignedUser?.name || 'Asep Kurniawan',
      });
      if (res.success) {
        setIsAddModalOpen(false);
      } else {
        setFormError(res.error || 'Gagal memperbarui prospek');
      }
    } else {
      const res = await addLead({
        ...formData,
        ...searchData,
        estimatedBudget: Number(formData.estimatedBudget) || 0,
        assignedSalesName: assignedUser?.name || 'Asep Kurniawan',
      });
      if (res.success) {
        setIsAddModalOpen(false);
      } else {
        setFormError(res.error || 'Gagal menambahkan prospek');
      }
    }
  };

  const handleConvertToCustomer = async (lead: Lead) => {
    if (lead.customerId) {
      alert('Prospek ini sudah terhubung ke database pelanggan.');
      return;
    }
    const res = await addCustomer({
      fullName: lead.customerName,
      whatsapp: lead.contactNumber,
      email: lead.email || '',
      address: 'Garut',
      district: 'Tarogong Kidul',
      source: lead.leadSource === 'Referral' ? 'Other' : lead.leadSource,
      interestedVehicle: lead.interestedVehicle,
      vehicleType: lead.vehicleType || 'MPV',
      budget: lead.estimatedBudget,
      notes: `Dikonversi dari prospek ${lead.id}. Catatan: ${lead.notes}`,
      status: 'Aktif',
    });

    if (res.success) {
      alert(`Sukses mengonversi ${lead.customerName} menjadi data pelanggan resmi HR MOTOR!`);
    } else {
      alert(res.error || 'Gagal mengonversi pelanggan.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="crm-card p-6 border-b-2 border-b-gold-500/40">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="badge-gold">
                Manajemen Prospek
              </span>
              <span className="text-xs text-charcoal-300">•</span>
              <span className="text-xs text-charcoal-400 font-medium tracking-wide">Corong Akuisisi Showroom</span>
            </div>
            <h1 className="text-2xl font-black text-charcoal-900 mt-1 tracking-tight">
              Prospek & Calon Pembeli (Leads)
            </h1>
            <p className="text-xs text-charcoal-500 mt-0.5">
              Kelola prospek masuk dari Facebook Marketplace, Instagram, TikTok, WhatsApp, Walk-in Showroom Garut, dan Referral.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <Link
              href="/pipeline"
              className="btn-outline-warm flex items-center gap-1.5 text-xs py-2"
            >
              <span>Kanban Pipeline</span>
              <ArrowRight className="w-3.5 h-3.5 text-gold-600" />
            </Link>
            <button
              onClick={openAddModal}
              className="btn-gold flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Prospek Baru</span>
            </button>
          </div>
        </div>

        {/* Quick KPI Strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6 pt-5 border-t border-[#EAE8E3]">
          <div className="bg-[#FAF9F5] p-3 rounded-xl border border-[#EAE8E3]/80">
            <p className="text-[11px] font-semibold text-charcoal-400 uppercase tracking-wider">Total Prospek</p>
            <p className="text-xl font-black text-charcoal-900 mt-0.5">{leads.length}</p>
          </div>
          <div className="bg-[#FAF9F5] p-3 rounded-xl border border-[#EAE8E3]/80">
            <p className="text-[11px] font-semibold text-charcoal-400 uppercase tracking-wider">Prospek Aktif</p>
            <p className="text-xl font-black text-gold-600 mt-0.5">
              {leads.filter((l) => l.status !== 'Deal' && l.status !== 'Lost').length}
            </p>
          </div>
          <div className="bg-[#FAF9F5] p-3 rounded-xl border border-[#EAE8E3]/80">
            <p className="text-[11px] font-semibold text-charcoal-400 uppercase tracking-wider">Tahap Cek & Nego</p>
            <p className="text-xl font-black text-charcoal-900 mt-0.5">
              {leads.filter((l) => l.status === 'Cek Unit' || l.status === 'Negosiasi').length}
            </p>
          </div>
          <div className="bg-[#FAF9F5] p-3 rounded-xl border border-[#EAE8E3]/80">
            <p className="text-[11px] font-semibold text-charcoal-400 uppercase tracking-wider">Potensi Pipeline</p>
            <p className="text-base font-black text-gold-600 mt-1 truncate">
              {formatRupiah(leads.reduce((s, l) => s + (l.estimatedBudget || 0), 0))}
            </p>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="crm-card p-4 space-y-3">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="w-4 h-4 text-charcoal-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari prospek berdasarkan nama, no telepon, atau tipe unit..."
              className="w-full text-xs pl-9 pr-4 py-2.5 bg-[#F8F7F4] border border-[#EAE8E3] rounded-xl outline-none focus:border-gold-500 focus:ring-2 focus:ring-gold-500/20 text-charcoal-900 placeholder-charcoal-400 transition-all font-medium"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={filterSource}
              onChange={(e) => setFilterSource(e.target.value)}
              className="text-xs px-3 py-2.5 bg-[#F8F7F4] border border-[#EAE8E3] rounded-xl text-charcoal-800 font-medium outline-none focus:border-gold-500"
            >
              <option value="ALL">Semua Sumber</option>
              <option value="WhatsApp">WhatsApp</option>
              <option value="Instagram">Instagram</option>
              <option value="Facebook">Facebook</option>
              <option value="TikTok">TikTok</option>
              <option value="Walk-in">Walk-in Showroom</option>
              <option value="Referral">Referral</option>
            </select>

            <select
              value={filterStage}
              onChange={(e) => setFilterStage(e.target.value)}
              className="text-xs px-3 py-2.5 bg-[#F8F7F4] border border-[#EAE8E3] rounded-xl text-charcoal-800 font-medium outline-none focus:border-gold-500"
            >
              <option value="ALL">Semua Tahapan</option>
              <option value="Menanyakan Unit">Menanyakan Unit</option>
              <option value="Tertarik">Tertarik</option>
              <option value="Cek Unit">Cek Unit (Showroom)</option>
              <option value="Negosiasi">Negosiasi</option>
              <option value="Deal">Deal (Selesai)</option>
              <option value="Lost">Lost (Tidak Jadi)</option>
            </select>

            <select
              value={filterSales}
              onChange={(e) => setFilterSales(e.target.value)}
              className="text-xs px-3 py-2.5 bg-[#F8F7F4] border border-[#EAE8E3] rounded-xl text-charcoal-800 font-medium outline-none focus:border-gold-500"
            >
              <option value="ALL">Semua Sales</option>
              {users
                .filter((u) => u.role === 'Sales Representative' || u.role === 'CRM Administrator')
                .map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                  </option>
                ))}
            </select>
          </div>
        </div>

        <div className="text-[11px] text-charcoal-500 pt-2 border-t border-[#EAE8E3] flex items-center justify-between">
          <span>
            Menampilkan <strong className="text-charcoal-900">{filteredLeads.length}</strong> data prospek tersaring
          </span>
          <span className="text-charcoal-400 font-medium">
            Kanal Dominan: Instagram & TikTok HR MOTOR
          </span>
        </div>
      </div>

      {/* Leads Table */}
      <div className="crm-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="crm-table w-full text-left">
            <thead>
              <tr>
                <th className="py-3.5 px-4">Calon Pembeli</th>
                <th className="py-3.5 px-4">Sumber Lead</th>
                <th className="py-3.5 px-4">Unit Diminati</th>
                <th className="py-3.5 px-4">Estimasi Budget</th>
                <th className="py-3.5 px-4">Sales PJ</th>
                <th className="py-3.5 px-4">Tahap Pipeline</th>
                <th className="py-3.5 px-4">Kontak Terakhir</th>
                <th className="py-3.5 px-4 text-center">Aksi Cepat</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EAE8E3] text-xs">
              {filteredLeads.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-charcoal-400">
                    <Target className="w-9 h-9 mx-auto mb-2 text-charcoal-300" />
                    <p className="font-semibold text-charcoal-700">Tidak ada prospek yang sesuai kriteria pencarian</p>
                    <p className="text-[11px] text-charcoal-400 mt-0.5">Coba ubah filter tahapan atau hapus kata kunci pencarian.</p>
                  </td>
                </tr>
              ) : (
                filteredLeads.map((lead) => {
                  return (
                    <tr key={lead.id} className="hover:bg-[#F8F7F4]/80 transition-colors">
                      {/* Name & Contact */}
                      <td className="py-3.5 px-4">
                        <div>
                          <p className="font-bold text-charcoal-900 text-sm">{lead.customerName}</p>
                          <a
                            href={formatWhatsAppLink(lead.contactNumber)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 text-xs text-charcoal-800 hover:text-gold-600 font-semibold transition-colors mt-0.5"
                          >
                            <span className="w-4 h-4 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
                              <MessageCircle className="w-2.5 h-2.5" />
                            </span>
                            {lead.contactNumber}
                          </a>
                          <span className="text-[10px] text-charcoal-400 font-mono block mt-0.5">{lead.id}</span>
                        </div>
                      </td>

                      {/* Lead Source */}
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold bg-[#FAF9F5] border border-[#EAE8E3] text-charcoal-700">
                          {lead.leadSource}
                        </span>
                      </td>

                      {/* Interested Vehicle */}
                      <td className="py-3.5 px-4">
                        <p className="font-bold text-charcoal-900">{lead.interestedVehicle}</p>
                        <p className="text-[10px] text-charcoal-500 line-clamp-1 italic mt-0.5">{lead.notes || 'Tidak ada catatan'}</p>
                      </td>

                      {/* Budget */}
                      <td className="py-3.5 px-4 font-black text-gold-600 text-sm">
                        {formatRupiah(lead.estimatedBudget)}
                      </td>

                      {/* Sales PJ */}
                      <td className="py-3.5 px-4">
                        <span className="font-semibold text-charcoal-800">
                          {lead.assignedSalesName || 'Asep Kurniawan'}
                        </span>
                      </td>

                      {/* Status / Stage */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            lead.status === 'Deal'
                              ? 'bg-emerald-50 text-emerald-800 border border-emerald-300'
                              : lead.status === 'Lost'
                              ? 'bg-rose-50 text-rose-700 border border-rose-200'
                              : lead.status === 'Negosiasi'
                              ? 'bg-gold-50 text-gold-800 border border-gold-300 font-black'
                              : lead.status === 'Cek Unit'
                              ? 'bg-amber-50 text-amber-800 border border-amber-300'
                              : lead.status === 'Tertarik'
                              ? 'bg-charcoal-100 text-charcoal-800 border border-charcoal-200'
                              : 'bg-warm-100 text-charcoal-700 border border-warm-200'
                          }`}
                        >
                          {lead.status}
                        </span>
                      </td>

                      {/* Last Contact */}
                      <td className="py-3.5 px-4 text-charcoal-500 text-[11px]">
                        {formatDate(lead.lastContactDate || lead.dateReceived)}
                      </td>

                      {/* Quick Actions */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* WhatsApp Button */}
                          <a
                            href={formatWhatsAppLink(
                              lead.contactNumber,
                              `Sampurasun Bapak/Ibu ${lead.customerName}, salam dari HR MOTOR Garut mengenai unit ${lead.interestedVehicle}.`
                            )}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 rounded-lg text-emerald-700 bg-emerald-50 hover:bg-emerald-100 transition-colors border border-emerald-200"
                            title="Chat WhatsApp Langsung"
                          >
                            <MessageCircle className="w-4 h-4" />
                          </a>

                          {/* Convert to Customer button */}
                          <button
                            onClick={() => handleConvertToCustomer(lead)}
                            className="p-1.5 rounded-lg text-gold-700 bg-gold-50/70 hover:bg-gold-100/70 transition-colors border border-gold-200"
                            title="Konversi ke Database Pelanggan"
                          >
                            <UserCheck className="w-4 h-4" />
                          </button>

                          {/* Edit Lead */}
                          <button
                            onClick={() => openEditModal(lead)}
                            className="p-1.5 rounded-lg text-charcoal-500 hover:text-charcoal-900 hover:bg-charcoal-100 transition-colors border border-transparent hover:border-charcoal-300"
                            title="Edit Prospek"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ADD / EDIT LEAD MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-charcoal-950/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="crm-card w-full max-w-xl max-h-[90vh] flex flex-col overflow-hidden shadow-luxury border-gold-500/30">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 bg-charcoal-900 border-b border-gold-500/30 text-white">
              <div>
                <span className="badge-gold text-[10px] mb-1 inline-block">
                  {editingLead ? 'Perbarui Prospek' : 'Input Prospek Baru'}
                </span>
                <h2 className="text-base font-black text-white tracking-tight">
                  {editingLead ? `Edit Prospek: ${editingLead.customerName}` : 'Tambah Calon Pembeli (Lead)'}
                </h2>
                <p className="text-xs text-charcoal-300">
                  {editingLead ? `ID Prospek: ${editingLead.id}` : 'Input data prospek calon pembeli mobil HR MOTOR'}
                </p>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-charcoal-400 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="mx-6 mt-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-medium">
                {formError}
              </div>
            )}

            <form onSubmit={handleSaveLead} className="flex-1 overflow-y-auto p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-charcoal-800 mb-1">
                    Nama Calon Pembeli <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.customerName}
                    onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                    placeholder="Contoh: Wawan Hermawan"
                    className="w-full text-xs px-3.5 py-2.5 bg-[#F8F7F4] border border-[#EAE8E3] rounded-xl focus:outline-none focus:border-gold-500 focus:ring-2 focus:ring-gold-500/20 text-charcoal-900 font-medium"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-charcoal-800 mb-1">
                    Nomor WhatsApp <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    value={formData.contactNumber}
                    onChange={(e) => setFormData({ ...formData, contactNumber: e.target.value })}
                    placeholder="0857xxxxxxxx"
                    className="w-full text-xs px-3.5 py-2.5 bg-[#F8F7F4] border border-[#EAE8E3] rounded-xl focus:outline-none focus:border-gold-500 focus:ring-2 focus:ring-gold-500/20 text-charcoal-900 font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-charcoal-800 mb-1">Sumber Prospek</label>
                  <select
                    value={formData.leadSource}
                    onChange={(e) => setFormData({ ...formData, leadSource: e.target.value as LeadSourceType })}
                    className="w-full text-xs px-3.5 py-2.5 bg-[#F8F7F4] border border-[#EAE8E3] rounded-xl focus:outline-none focus:border-gold-500 focus:ring-2 focus:ring-gold-500/20 text-charcoal-900 font-semibold"
                  >
                    <option value="WhatsApp">WhatsApp</option>
                    <option value="Instagram">Instagram Ads / DM</option>
                    <option value="Facebook">Facebook Marketplace</option>
                    <option value="TikTok">TikTok Video / DM</option>
                    <option value="Walk-in">Walk-in Showroom Garut</option>
                    <option value="Referral">Referral Rekanan</option>
                    <option value="Other">Lainnya</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-charcoal-800 mb-1">Tahap Awal Pipeline</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as PipelineStage })}
                    className="w-full text-xs px-3.5 py-2.5 bg-[#F8F7F4] border border-[#EAE8E3] rounded-xl focus:outline-none focus:border-gold-500 focus:ring-2 focus:ring-gold-500/20 text-charcoal-900 font-semibold"
                  >
                    <option value="Menanyakan Unit">Menanyakan Unit</option>
                    <option value="Tertarik">Tertarik</option>
                    <option value="Cek Unit">Cek Unit (Kunjungan Showroom)</option>
                    <option value="Negosiasi">Negosiasi</option>
                    <option value="Deal">Deal (Transaksi Berhasil)</option>
                    <option value="Lost">Lost (Tidak Jadi)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-charcoal-800 mb-1">Unit Mobil Diminati</label>
                  <input
                    type="text"
                    required
                    value={formData.interestedVehicle}
                    onChange={(e) => setFormData({ ...formData, interestedVehicle: e.target.value })}
                    placeholder="Toyota Avanza 1.3 G 2019"
                    className="w-full text-xs px-3.5 py-2.5 bg-[#F8F7F4] border border-[#EAE8E3] rounded-xl focus:outline-none focus:border-gold-500 focus:ring-2 focus:ring-gold-500/20 text-charcoal-900 font-medium"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-charcoal-800 mb-1">Estimasi Budget (Rp)</label>
                  <input
                    type="number"
                    value={formData.estimatedBudget}
                    onChange={(e) => setFormData({ ...formData, estimatedBudget: e.target.value })}
                    placeholder="170000000"
                    className="w-full text-xs px-3.5 py-2.5 bg-[#F8F7F4] border border-[#EAE8E3] rounded-xl focus:outline-none focus:border-gold-500 focus:ring-2 focus:ring-gold-500/20 text-charcoal-900 font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-charcoal-800 mb-1">Sales Representative</label>
                  <select
                    value={formData.assignedSalesId}
                    onChange={(e) => setFormData({ ...formData, assignedSalesId: e.target.value })}
                    className="w-full text-xs px-3.5 py-2.5 bg-[#F8F7F4] border border-[#EAE8E3] rounded-xl focus:outline-none focus:border-gold-500 focus:ring-2 focus:ring-gold-500/20 text-charcoal-900 font-semibold"
                  >
                    {users
                      .filter((u) => u.role === 'Sales Representative' || u.role === 'CRM Administrator')
                      .map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.name} ({u.role})
                        </option>
                      ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-charcoal-800 mb-1">Email (Opsional)</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="email@domain.com"
                    className="w-full text-xs px-3.5 py-2.5 bg-[#F8F7F4] border border-[#EAE8E3] rounded-xl focus:outline-none focus:border-gold-500 focus:ring-2 focus:ring-gold-500/20 text-charcoal-900 font-medium"
                  />
                </div>
              </div>

              {/* Kriteria Mobil yang Dicari (Untuk Auto-Matching Stok Unit) */}
              <div className="pt-3 border-t border-[#EAE8E3] space-y-3 bg-[#FAF9F5] p-4 rounded-xl border border-gold-500/30">
                <div className="flex items-center gap-2 text-xs font-black text-charcoal-900">
                  <Car className="w-4 h-4 text-gold-600" />
                  <span>Kriteria Pencarian Armada (Auto-Matching Stok Showroom)</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-charcoal-700 mb-1">Merek Dicari</label>
                    <input
                      type="text"
                      value={formData.searchBrand}
                      onChange={(e) => setFormData({ ...formData, searchBrand: e.target.value })}
                      placeholder="Contoh: Honda"
                      className="w-full text-xs px-3 py-2 bg-white border border-[#EAE8E3] rounded-lg focus:outline-none focus:border-gold-500 text-charcoal-900"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-charcoal-700 mb-1">Model Dicari</label>
                    <input
                      type="text"
                      value={formData.searchModel}
                      onChange={(e) => setFormData({ ...formData, searchModel: e.target.value })}
                      placeholder="Contoh: Brio Satya E"
                      className="w-full text-xs px-3 py-2 bg-white border border-[#EAE8E3] rounded-lg focus:outline-none focus:border-gold-500 text-charcoal-900"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-charcoal-700 mb-1">Transmisi</label>
                    <select
                      value={formData.searchTransmission}
                      onChange={(e) => setFormData({ ...formData, searchTransmission: e.target.value })}
                      className="w-full text-xs px-3 py-2 bg-white border border-[#EAE8E3] rounded-lg focus:outline-none focus:border-gold-500 text-charcoal-900 font-semibold"
                    >
                      <option value="Semua">Semua Transmisi</option>
                      <option value="Manual">Manual</option>
                      <option value="Otomatis">Otomatis</option>
                      <option value="CVT">CVT</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-charcoal-700 mb-1">Tahun Minimal - Maksimal</label>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="number"
                        placeholder="2019"
                        value={formData.searchYearMin}
                        onChange={(e) => setFormData({ ...formData, searchYearMin: e.target.value })}
                        className="w-full text-xs px-2.5 py-2 bg-white border border-[#EAE8E3] rounded-lg text-center text-charcoal-900 font-semibold"
                      />
                      <span className="text-charcoal-400 font-bold">-</span>
                      <input
                        type="number"
                        placeholder="2022"
                        value={formData.searchYearMax}
                        onChange={(e) => setFormData({ ...formData, searchYearMax: e.target.value })}
                        className="w-full text-xs px-2.5 py-2 bg-white border border-[#EAE8E3] rounded-lg text-center text-charcoal-900 font-semibold"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-charcoal-700 mb-1">Budget Maksimal (Rp)</label>
                    <input
                      type="number"
                      placeholder="165000000"
                      value={formData.searchBudgetMax}
                      onChange={(e) => setFormData({ ...formData, searchBudgetMax: e.target.value })}
                      className="w-full text-xs px-3 py-2 bg-white border border-[#EAE8E3] rounded-lg focus:outline-none focus:border-gold-500 text-charcoal-900 font-semibold"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-charcoal-800 mb-1">Catatan Respon Awal</label>
                <textarea
                  rows={3}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Catatan kebutuhan konsumen, penawaran harga, atau pertanyaan spesifik..."
                  className="w-full text-xs px-3.5 py-2.5 bg-[#F8F7F4] border border-[#EAE8E3] rounded-xl focus:outline-none focus:border-gold-500 focus:ring-2 focus:ring-gold-500/20 text-charcoal-900 font-medium"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-[#EAE8E3]">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="btn-outline-warm"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="btn-gold"
                >
                  {editingLead ? 'Simpan Perubahan' : 'Registrasi Prospek'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
