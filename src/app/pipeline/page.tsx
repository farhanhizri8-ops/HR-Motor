'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  MessageCircle,
  Car,
  Calendar,
  Clock,
  User,
  X,
  History,
  DollarSign,
  Plus,
  Search,
  Filter,
  Edit,
  Trash2,
  AlertCircle,
  ArrowRight,
  ExternalLink,
  Phone,
  FileText,
  CheckCircle2,
  Sparkles,
  HelpCircle,
  Tag,
  Layers,
} from 'lucide-react';
import { useCrm } from '@/context/CrmContext';
import {
  Lead,
  CorePipelineStage,
  CORE_PIPELINE_STAGES,
  normalizePipelineStage,
  PipelineStage,
} from '@/types/crm';

interface StageConfig {
  id: CorePipelineStage;
  title: string;
  shortDesc: string;
  fullDesc: string;
  icon: typeof MessageCircle;
  accentColor: string;
  badgeClass: string;
  borderClass: string;
  bgLight: string;
}

const STAGES: StageConfig[] = [
  {
    id: 'Hanya Menanyakan',
    title: 'Hanya Menanyakan',
    shortDesc: 'Inquiry awal via WhatsApp',
    fullDesc:
      'Konsumen baru menghubungi HR MOTOR via WhatsApp sebatas tanya info mobil, harga, spesifikasi, atau ketersediaan unit. Belum masuk ke tahap negosiasi.',
    icon: MessageCircle,
    accentColor: '#3B82F6',
    badgeClass: 'bg-blue-50 text-blue-800 border-blue-200',
    borderClass: 'border-blue-200',
    bgLight: 'bg-blue-50/40',
  },
  {
    id: 'Negosiasi',
    title: 'Negosiasi',
    shortDesc: 'Bahas harga & tawar-menawar',
    fullDesc:
      'Konsumen sudah menunjukkan ketertarikan terhadap mobil, mulai membicarakan harga, melakukan tawar-menawar, atau membahas kesepakatan pembelian.',
    icon: DollarSign,
    accentColor: '#D99A32',
    badgeClass: 'bg-gold-50 text-gold-800 border-gold-300 font-bold',
    borderClass: 'border-gold-300/80',
    bgLight: 'bg-gold-50/30',
  },
  {
    id: 'Cek Unit',
    title: 'Cek Unit',
    shortDesc: 'Kunjungan / cek fisik mobil',
    fullDesc:
      'Konsumen memiliki ketertarikan lebih lanjut, berencana datang ke showroom HR MOTOR Garut untuk cek kondisi unit langsung, atau sudah selesai cek unit.',
    icon: Car,
    accentColor: '#10B981',
    badgeClass: 'bg-emerald-50 text-emerald-800 border-emerald-300 font-bold',
    borderClass: 'border-emerald-300/80',
    bgLight: 'bg-emerald-50/30',
  },
];

export default function SalesPipelinePage() {
  const {
    leads,
    stocks,
    currentUser,
    addLead,
    updateLead,
    updateLeadStage,
    deleteLead,
    formatDate,
    formatWhatsAppLink,
  } = useCrm();

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStage, setFilterStage] = useState<'ALL' | CorePipelineStage>('ALL');
  const [mobileTab, setMobileTab] = useState<'ALL' | CorePipelineStage>('ALL');

  // Drag and drop state
  const [draggedLeadId, setDraggedLeadId] = useState<string | null>(null);
  const [dragOverStage, setDragOverStage] = useState<CorePipelineStage | null>(null);

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [stageChangeLead, setStageChangeLead] = useState<Lead | null>(null);
  const [newTargetStage, setNewTargetStage] = useState<CorePipelineStage>('Hanya Menanyakan');
  const [stageChangeNotes, setStageChangeNotes] = useState('');
  const [deletingLead, setDeletingLead] = useState<Lead | null>(null);
  const [historyLead, setHistoryLead] = useState<Lead | null>(null);
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Form data for Add / Edit
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);
  const [formData, setFormData] = useState({
    customerName: '',
    contactNumber: '',
    interestedVehicle: '',
    status: 'Hanya Menanyakan' as CorePipelineStage,
    notes: '',
    dateReceived: todayStr,
  });

  // Ready stocks suggestion list
  const readyStocks = useMemo(() => {
    return (stocks || []).filter((s) => s.status === 'Tersedia');
  }, [stocks]);

  // Lead age helper
  const getLeadAge = (dateStr?: string) => {
    if (!dateStr) return '-';
    try {
      const received = new Date(dateStr).getTime();
      const now = new Date().getTime();
      const diffDays = Math.floor((now - received) / (1000 * 60 * 60 * 24));
      if (diffDays <= 0) return 'Hari ini';
      if (diffDays === 1) return '1 hari lalu';
      return `${diffDays} hari lalu`;
    } catch {
      return '-';
    }
  };

  // Filtered Leads
  const filteredLeads = useMemo(() => {
    let result = [...leads];

    // Search query: name or phone
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const cleanQ = q.replace(/\D/g, '');
      result = result.filter((l) => {
        const nameMatch = l.customerName?.toLowerCase().includes(q);
        const phone = (l.contactNumber || l.customerPhone || '').replace(/\D/g, '');
        const phoneMatch = cleanQ.length > 0 && phone.includes(cleanQ);
        const vehicleMatch = l.interestedVehicle?.toLowerCase().includes(q);
        return nameMatch || phoneMatch || vehicleMatch;
      });
    }

    // Filter stage dropdown
    if (filterStage !== 'ALL') {
      result = result.filter((l) => normalizePipelineStage(l.status) === filterStage);
    }

    return result;
  }, [leads, searchQuery, filterStage]);

  // Group leads into the 3 core communication stages
  const groupedLeads = useMemo(() => {
    const groups: Record<CorePipelineStage, Lead[]> = {
      'Hanya Menanyakan': [],
      'Negosiasi': [],
      'Cek Unit': [],
    };

    filteredLeads.forEach((lead) => {
      const coreStage = normalizePipelineStage(lead.status);
      if (groups[coreStage]) {
        groups[coreStage].push(lead);
      } else {
        groups['Hanya Menanyakan'].push(lead);
      }
    });

    return groups;
  }, [filteredLeads]);

  // Total counts across all leads (unfiltered by search query for KPI badges)
  const stageCounts = useMemo(() => {
    const counts: Record<CorePipelineStage, number> = {
      'Hanya Menanyakan': 0,
      'Negosiasi': 0,
      'Cek Unit': 0,
    };
    leads.forEach((l) => {
      const core = normalizePipelineStage(l.status);
      counts[core] = (counts[core] || 0) + 1;
    });
    return counts;
  }, [leads]);

  // Duplicate warning detector
  const duplicateWarning = useMemo(() => {
    if (!formData.contactNumber && !formData.customerName) return null;
    const cleanPhone = formData.contactNumber.replace(/\D/g, '');
    const cleanName = formData.customerName.toLowerCase().trim();

    const existing = leads.find((l) => {
      if (editingLead && l.id === editingLead.id) return false;
      const lPhone = (l.contactNumber || l.customerPhone || '').replace(/\D/g, '');
      const phoneMatch = cleanPhone.length >= 8 && lPhone.length >= 8 && (lPhone === cleanPhone || lPhone.endsWith(cleanPhone) || cleanPhone.endsWith(lPhone));
      const nameMatch = cleanName.length >= 3 && l.customerName?.toLowerCase().trim() === cleanName;
      return phoneMatch || nameMatch;
    });

    if (existing) {
      return {
        id: existing.id,
        name: existing.customerName,
        phone: existing.contactNumber || existing.customerPhone,
        stage: existing.status,
      };
    }
    return null;
  }, [formData.contactNumber, formData.customerName, leads, editingLead]);

  // Open Add Modal
  const openAddModal = () => {
    setEditingLead(null);
    setFormData({
      customerName: '',
      contactNumber: '',
      interestedVehicle: '',
      status: 'Hanya Menanyakan',
      notes: '',
      dateReceived: todayStr,
    });
    setFormError('');
    setIsAddModalOpen(true);
  };

  // Open Edit Modal
  const openEditModal = (lead: Lead) => {
    setEditingLead(lead);
    setFormData({
      customerName: lead.customerName || '',
      contactNumber: lead.contactNumber || lead.customerPhone || '',
      interestedVehicle: lead.interestedVehicle || '',
      status: normalizePipelineStage(lead.status),
      notes: lead.notes || '',
      dateReceived: lead.dateReceived ? lead.dateReceived.split('T')[0] : todayStr,
    });
    setFormError('');
    setIsAddModalOpen(true);
  };

  // Open Stage Change Modal
  const openStageChangeModal = (lead: Lead, directTarget?: CorePipelineStage) => {
    setStageChangeLead(lead);
    setNewTargetStage(directTarget || normalizePipelineStage(lead.status));
    setStageChangeNotes('');
  };

  // Handle Save Lead (Add or Edit)
  const handleSaveLead = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setSubmitting(true);

    if (!formData.customerName.trim()) {
      setFormError('Nama konsumen wajib diisi.');
      setSubmitting(false);
      return;
    }
    if (!formData.contactNumber.trim()) {
      setFormError('Nomor WhatsApp konsumen wajib diisi.');
      setSubmitting(false);
      return;
    }

    try {
      if (editingLead) {
        // Edit existing lead
        const res = await updateLead({
          id: editingLead.id,
          customerName: formData.customerName.trim(),
          contactNumber: formData.contactNumber.trim(),
          customerPhone: formData.contactNumber.trim(),
          interestedVehicle: formData.interestedVehicle.trim(),
          status: formData.status as PipelineStage,
          notes: formData.notes.trim(),
          dateReceived: formData.dateReceived,
        });

        if (res.success) {
          setIsAddModalOpen(false);
          setEditingLead(null);
        } else {
          setFormError(res.error || 'Gagal memperbarui data konsumen.');
        }
      } else {
        // Add new lead
        const res = await addLead({
          customerName: formData.customerName.trim(),
          contactNumber: formData.contactNumber.trim(),
          customerPhone: formData.contactNumber.trim(),
          interestedVehicle: formData.interestedVehicle.trim(),
          leadSource: 'WhatsApp',
          status: formData.status as PipelineStage,
          notes: formData.notes.trim(),
          dateReceived: formData.dateReceived,
          estimatedBudget: 0,
          assignedSalesId: currentUser.id || 'USR-003',
          assignedSalesName: currentUser.name || 'Admin WhatsApp HR MOTOR',
        });

        if (res.success) {
          setIsAddModalOpen(false);
        } else {
          setFormError(res.error || 'Gagal menambahkan data konsumen.');
        }
      }
    } catch {
      setFormError('Terjadi kesalahan koneksi sistem.');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Confirm Stage Change
  const handleConfirmStageChange = async () => {
    if (!stageChangeLead) return;
    setSubmitting(true);

    const note = stageChangeNotes.trim()
      ? stageChangeNotes.trim()
      : `Tahapan diperbarui ke ${newTargetStage} oleh ${currentUser.name}`;

    const res = await updateLeadStage(stageChangeLead.id, newTargetStage as PipelineStage, {
      notes: note,
    });

    setSubmitting(false);
    if (res.success) {
      setStageChangeLead(null);
      setStageChangeNotes('');
    } else {
      alert(res.error || 'Gagal memperbarui tahapan komunikasi.');
    }
  };

  // Handle Delete Lead
  const handleConfirmDelete = async () => {
    if (!deletingLead) return;
    setSubmitting(true);
    const res = await deleteLead(deletingLead.id);
    setSubmitting(false);
    if (res.success) {
      setDeletingLead(null);
    } else {
      alert(res.error || 'Gagal menghapus data calon konsumen.');
    }
  };

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, leadId: string) => {
    e.dataTransfer.setData('text/plain', leadId);
    setDraggedLeadId(leadId);
  };

  const handleDragOver = (e: React.DragEvent, stageId: CorePipelineStage) => {
    e.preventDefault();
    setDragOverStage(stageId);
  };

  const handleDragLeave = () => {
    setDragOverStage(null);
  };

  const handleDrop = async (e: React.DragEvent, targetStage: CorePipelineStage) => {
    e.preventDefault();
    setDragOverStage(null);
    const leadId = e.dataTransfer.getData('text/plain') || draggedLeadId;
    if (!leadId) return;

    const lead = leads.find((l) => l.id === leadId);
    if (lead && normalizePipelineStage(lead.status) !== targetStage) {
      openStageChangeModal(lead, targetStage);
    }
    setDraggedLeadId(null);
  };

  return (
    <div className="space-y-6">
      {/* 1. Header & Quick Summary */}
      <div className="crm-card p-5 sm:p-6 border-b-2 border-b-gold-500/40">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="badge-gold">
                <MessageCircle className="w-3.5 h-3.5 text-gold-700" />
                <span>Sales Pipeline</span>
              </span>
              <span className="text-xs text-charcoal-300">•</span>
              <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                Terintegrasi Lead Management
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-charcoal-900 mt-1 tracking-tight">
              Sales Pipeline - Lead Tracking Calon Konsumen
            </h1>
            <p className="text-xs sm:text-sm text-charcoal-500 mt-1 max-w-3xl">
              Sistem pencatatan dan pemantauan calon konsumen yang menghubungi HR MOTOR melalui WhatsApp.
              Pantau perjalanan calon konsumen mulai dari sekadar bertanya informasi, tawar-menawar harga (negosiasi),
              hingga pengecekan unit di showroom Garut.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <Link
              href="/leads"
              className="btn-outline-warm flex items-center gap-1.5 text-xs py-2.5 px-3.5"
              title="Lihat seluruh data di Lead Management"
            >
              <span>Lead Management</span>
              <ExternalLink className="w-3.5 h-3.5 text-gold-600" />
            </Link>
            <button
              onClick={openAddModal}
              className="btn-gold flex items-center justify-center gap-2 text-xs py-2.5 px-4 font-bold shadow-md cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>+ TAMBAH LEAD</span>
            </button>
          </div>
        </div>

        {/* 3 Core Stages Counter Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-6 pt-5 border-t border-[#EAE8E3]">
          {STAGES.map((stg) => {
            const Icon = stg.icon;
            const count = stageCounts[stg.id] || 0;
            return (
              <div
                key={stg.id}
                onClick={() => setFilterStage(filterStage === stg.id ? 'ALL' : stg.id)}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                  filterStage === stg.id
                    ? 'border-gold-500 bg-gold-50/50 shadow-sm'
                    : 'border-[#EAE8E3] bg-[#FAF9F5] hover:border-gold-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: `${stg.accentColor}18`, color: stg.accentColor }}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-charcoal-900">{stg.title}</p>
                      <p className="text-[10px] text-charcoal-400">{stg.shortDesc}</p>
                    </div>
                  </div>
                  <span className="text-xl font-black text-charcoal-900 px-2 py-0.5 rounded-lg bg-white border border-[#EAE8E3]">
                    {count}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. Search & Filter Bar */}
      <div className="crm-card p-3.5 sm:p-4 space-y-3">
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="relative w-full sm:w-80 md:w-96">
            <Search className="w-4 h-4 text-charcoal-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari nama atau nomor WhatsApp konsumen..."
              className="w-full text-xs pl-9 pr-8 py-2.5 bg-[#F8F7F4] border border-[#EAE8E3] rounded-xl text-charcoal-900 focus:outline-none focus:border-gold-500 placeholder:text-charcoal-400"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-charcoal-400 hover:text-charcoal-700"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Filter className="w-3.5 h-3.5 text-charcoal-400 hidden sm:block" />
            <span className="text-xs text-charcoal-500 font-medium hidden sm:block">Filter Tahapan:</span>
            <select
              value={filterStage}
              onChange={(e) => setFilterStage(e.target.value as any)}
              className="w-full sm:w-auto text-xs px-3 py-2 bg-[#F8F7F4] border border-[#EAE8E3] rounded-xl text-charcoal-800 font-semibold focus:outline-none focus:border-gold-500"
            >
              <option value="ALL">Semua Tahapan ({leads.length})</option>
              <option value="Hanya Menanyakan">Hanya Menanyakan ({stageCounts['Hanya Menanyakan']})</option>
              <option value="Negosiasi">Negosiasi ({stageCounts['Negosiasi']})</option>
              <option value="Cek Unit">Cek Unit ({stageCounts['Cek Unit']})</option>
            </select>
          </div>
        </div>

        {/* Mobile Stage Selector Tabs (< 1024px) */}
        <div className="flex lg:hidden overflow-x-auto gap-2 pt-2 border-t border-[#EAE8E3] no-scrollbar">
          <button
            onClick={() => setMobileTab('ALL')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
              mobileTab === 'ALL'
                ? 'bg-charcoal-900 text-white'
                : 'bg-[#F8F7F4] text-charcoal-600 border border-[#EAE8E3]'
            }`}
          >
            Semua ({filteredLeads.length})
          </button>
          {STAGES.map((stg) => (
            <button
              key={stg.id}
              onClick={() => setMobileTab(stg.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                mobileTab === stg.id
                  ? 'bg-gold-500 text-charcoal-950 font-black shadow-xs'
                  : 'bg-[#F8F7F4] text-charcoal-600 border border-[#EAE8E3]'
              }`}
            >
              <span>{stg.title}</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-white/70 text-charcoal-900">
                {groupedLeads[stg.id].length}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* 3. 3-Column Kanban Board Layout (Desktop) & Tabbed Cards (Mobile) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-start">
        {STAGES.map((stg) => {
          const leadsInStage = groupedLeads[stg.id];
          const isOver = dragOverStage === stg.id;
          const isMobileVisible = mobileTab === 'ALL' || mobileTab === stg.id;

          if (!isMobileVisible) return null;

          return (
            <div
              key={stg.id}
              onDragOver={(e) => handleDragOver(e, stg.id)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, stg.id)}
              className={`flex flex-col rounded-2xl transition-all duration-200 ${
                isOver ? 'ring-2 ring-gold-500 bg-gold-50/20' : 'bg-[#FAF9F5]'
              } border border-[#EAE8E3] overflow-hidden`}
            >
              {/* Column Header */}
              <div className="p-4 border-b border-[#EAE8E3] bg-white sticky top-0 z-10">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-7 h-7 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: `${stg.accentColor}18`, color: stg.accentColor }}
                    >
                      <stg.icon className="w-4 h-4" />
                    </div>
                    <h3 className="font-black text-sm text-charcoal-900 tracking-tight">
                      {stg.title}
                    </h3>
                  </div>
                  <span
                    className={`text-xs font-black px-2.5 py-0.5 rounded-full border ${stg.badgeClass}`}
                  >
                    {leadsInStage.length}
                  </span>
                </div>
                <p className="text-[11px] text-charcoal-500 leading-snug line-clamp-2">
                  {stg.fullDesc}
                </p>
              </div>

              {/* Cards Container */}
              <div className="p-3.5 space-y-3 min-h-[360px]">
                {leadsInStage.length === 0 ? (
                  <div className="py-12 px-4 text-center border-2 border-dashed border-[#EAE8E3] rounded-xl bg-white/60">
                    <stg.icon className="w-8 h-8 mx-auto mb-2 text-charcoal-300 stroke-[1.5]" />
                    <p className="text-xs font-bold text-charcoal-600">Belum ada konsumen</p>
                    <p className="text-[10px] text-charcoal-400 mt-0.5">
                      Tarik kartu ke kolom ini atau klik tombol &quot;+ TAMBAH LEAD&quot;.
                    </p>
                  </div>
                ) : (
                  leadsInStage.map((lead) => {
                    const cleanPhone = (lead.contactNumber || lead.customerPhone || '').replace(/\D/g, '');
                    const waMessage = `Halo Bapak/Ibu ${lead.customerName}, salam hangat dari Showroom HR MOTOR Garut mengenai unit ${
                      lead.interestedVehicle || 'yang Anda tanyakan'
                    }. Apakah ada informasi yang bisa kami bantu?`;
                    const waHref = formatWhatsAppLink(lead.contactNumber || lead.customerPhone, waMessage);

                    return (
                      <div
                        key={lead.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, lead.id)}
                        className="bg-white rounded-xl border border-[#EAE8E3] p-4 shadow-sm hover:shadow-md hover:border-gold-300 transition-all cursor-grab active:cursor-grabbing group space-y-3"
                      >
                        {/* Top: Name & Stage Badge */}
                        <div className="flex items-start justify-between gap-2 border-b border-[#F0EEEA] pb-2.5">
                          <div className="min-w-0">
                            <h4 className="font-black text-sm text-charcoal-900 truncate group-hover:text-gold-700 transition-colors">
                              {lead.customerName}
                            </h4>
                            <div className="flex items-center gap-1.5 text-[10px] text-charcoal-400 font-mono mt-0.5">
                              <span>{lead.id}</span>
                              <span>•</span>
                              <span>Masuk {getLeadAge(lead.dateReceived || lead.createdAt)}</span>
                            </div>
                          </div>

                          <span
                            className={`shrink-0 inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${stg.badgeClass}`}
                          >
                            {lead.status}
                          </span>
                        </div>

                        {/* WhatsApp Contact with Click-to-Chat Button */}
                        <div className="flex items-center justify-between gap-2 bg-[#FAF9F5] p-2 rounded-lg border border-[#EAE8E3]">
                          <div className="flex items-center gap-1.5 text-xs text-charcoal-700 min-w-0">
                            <Phone className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            <span className="font-semibold truncate">
                              {lead.contactNumber || lead.customerPhone || '-'}
                            </span>
                          </div>

                          <a
                            href={waHref}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold bg-[#25D366] hover:bg-[#1fb355] text-white shadow-2xs transition-colors shrink-0"
                            title="Buka WhatsApp langsung"
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                            <span>Chat WA</span>
                          </a>
                        </div>

                        {/* Vehicle Asked */}
                        <div className="text-xs">
                          <span className="text-[10px] font-semibold text-charcoal-400 block mb-0.5">
                            Mobil yang Ditanyakan:
                          </span>
                          {lead.interestedVehicle && lead.interestedVehicle.trim() ? (
                            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-gold-50/70 border border-gold-200 text-gold-900 font-bold text-xs">
                              <Car className="w-3.5 h-3.5 text-gold-600 shrink-0" />
                              <span className="truncate">{lead.interestedVehicle}</span>
                            </div>
                          ) : (
                            <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-charcoal-100 text-charcoal-500 font-medium text-[11px]">
                              <HelpCircle className="w-3 h-3 text-charcoal-400" />
                              <span>Belum spesifik</span>
                            </div>
                          )}
                        </div>

                        {/* Contact Date */}
                        <div className="flex items-center gap-1.5 text-[11px] text-charcoal-500">
                          <Calendar className="w-3.5 h-3.5 text-charcoal-400 shrink-0" />
                          <span>
                            Tgl Hubungi:{' '}
                            <strong className="text-charcoal-800">
                              {formatDate(lead.dateReceived || lead.createdAt)}
                            </strong>
                          </span>
                        </div>

                        {/* Admin Notes */}
                        {lead.notes && (
                          <div className="bg-[#F8F7F4] p-2.5 rounded-lg border border-[#EAE8E3] text-[11px] text-charcoal-700 leading-relaxed italic">
                            <p className="line-clamp-2">&ldquo;{lead.notes}&rdquo;</p>
                          </div>
                        )}

                        {/* Action Buttons Toolbar */}
                        <div className="pt-2 border-t border-[#F0EEEA] flex flex-wrap items-center justify-between gap-1.5">
                          {/* Quick Stage Mover */}
                          <button
                            onClick={() => openStageChangeModal(lead)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-[#FAF9F5] hover:bg-gold-50 text-charcoal-800 hover:text-gold-800 border border-[#EAE8E3] hover:border-gold-300 transition-colors"
                            title="Ubah tahapan komunikasi konsumen"
                          >
                            <Layers className="w-3 h-3 text-gold-600" />
                            <span>Ubah Tahapan</span>
                          </button>

                          <div className="flex items-center gap-1">
                            {/* Riwayat Stage History */}
                            <button
                              onClick={() => setHistoryLead(lead)}
                              className="p-1.5 rounded-lg text-charcoal-500 hover:text-charcoal-900 hover:bg-[#F0EEEA] transition-colors"
                              title="Riwayat Tahapan Komunikasi"
                            >
                              <History className="w-3.5 h-3.5" />
                            </button>

                            {/* Edit Button */}
                            <button
                              onClick={() => openEditModal(lead)}
                              className="p-1.5 rounded-lg text-charcoal-600 hover:text-charcoal-900 hover:bg-[#F0EEEA] transition-colors"
                              title="Edit Data Konsumen"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>

                            {/* Delete Button */}
                            <button
                              onClick={() => setDeletingLead(lead)}
                              className="p-1.5 rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-50 transition-colors"
                              title="Hapus Calon Konsumen"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* 4. MODAL: TAMBAH LEAD & EDIT DATA KONSUMEN */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-charcoal-950/70 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl w-full max-w-lg border border-[#EAE8E3] shadow-2xl overflow-hidden my-8 animate-in fade-in zoom-in duration-150">
            {/* Modal Header */}
            <div className="p-5 border-b border-[#EAE8E3] bg-[#FAF9F5] flex items-center justify-between">
              <div>
                <span className="badge-gold text-[10px]">
                  {editingLead ? 'Edit Konsumen' : 'Input Konsumen Baru'}
                </span>
                <h3 className="text-lg font-black text-charcoal-900 mt-1">
                  {editingLead ? 'EDIT DATA KONSUMEN' : 'TAMBAH LEAD CALON KONSUMEN'}
                </h3>
                <p className="text-xs text-charcoal-500 mt-0.5">
                  Mencatat data prospek yang menghubungi HR MOTOR melalui WhatsApp.
                </p>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-2 rounded-lg text-charcoal-400 hover:text-charcoal-700 hover:bg-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body Form */}
            <form onSubmit={handleSaveLead} className="p-5 space-y-4">
              {formError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Duplicate Detection Warning */}
              {duplicateWarning && (
                <div className="p-3 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 text-xs flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold">Potensi Duplikasi Data Konsumen!</p>
                    <p className="mt-0.5 text-[11px] text-amber-800">
                      Konsumen <strong>{duplicateWarning.name}</strong> ({duplicateWarning.phone}) sudah ada di tahapan{' '}
                      <strong>{duplicateWarning.stage}</strong> ({duplicateWarning.id}). Pastikan tidak menginput ganda.
                    </p>
                  </div>
                </div>
              )}

              {/* 1. Nama Konsumen */}
              <div>
                <label className="block text-xs font-bold text-charcoal-800 mb-1">
                  1. Nama Konsumen <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.customerName}
                  onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                  placeholder="Contoh: Pak H. Dadan / Ibu Maya"
                  className="w-full text-xs px-3.5 py-2.5 bg-[#F8F7F4] border border-[#EAE8E3] rounded-xl text-charcoal-900 focus:outline-none focus:border-gold-500 focus:ring-2 focus:ring-gold-500/20 font-medium"
                />
              </div>

              {/* 2. Nomor WhatsApp Konsumen */}
              <div>
                <label className="block text-xs font-bold text-charcoal-800 mb-1">
                  2. Nomor WhatsApp Konsumen <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-emerald-600 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="tel"
                    required
                    value={formData.contactNumber}
                    onChange={(e) => setFormData({ ...formData, contactNumber: e.target.value })}
                    placeholder="Contoh: 081222987654 atau 0857xxxxxxx"
                    className="w-full text-xs pl-9 pr-3.5 py-2.5 bg-[#F8F7F4] border border-[#EAE8E3] rounded-xl text-charcoal-900 focus:outline-none focus:border-gold-500 focus:ring-2 focus:ring-gold-500/20 font-medium"
                  />
                </div>
                <p className="text-[10px] text-charcoal-400 mt-1">
                  Nomor WhatsApp akan otomatis terhubung dengan tombol direct chat WhatsApp.
                </p>
              </div>

              {/* 3. Mobil yang Ditanyakan (Opsional) */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-charcoal-800">
                    3. Mobil yang Ditanyakan (Opsional)
                  </label>
                  {readyStocks.length > 0 && (
                    <span className="text-[10px] text-gold-700 font-semibold">
                      {readyStocks.length} unit ready di showroom
                    </span>
                  )}
                </div>
                <input
                  type="text"
                  list="pipeline-ready-stocks"
                  value={formData.interestedVehicle}
                  onChange={(e) => setFormData({ ...formData, interestedVehicle: e.target.value })}
                  placeholder="Ketik unit mobil atau pilih dari stok showroom..."
                  className="w-full text-xs px-3.5 py-2.5 bg-[#F8F7F4] border border-[#EAE8E3] rounded-xl text-charcoal-900 focus:outline-none focus:border-gold-500 focus:ring-2 focus:ring-gold-500/20 font-medium"
                />
                <datalist id="pipeline-ready-stocks">
                  {readyStocks.map((s) => (
                    <option key={s.id} value={`${s.brand} ${s.model} ${s.year}`}>
                      Rp {s.price.toLocaleString('id-ID')} - {s.licensePlate || s.plateNumber || '-'}
                    </option>
                  ))}
                </datalist>
                <p className="text-[10px] text-charcoal-400 mt-1">
                  Kosongkan jika konsumen belum menentukan mobil yang diminati secara spesifik.
                </p>
              </div>

              {/* 4. Tahapan Komunikasi */}
              <div>
                <label className="block text-xs font-bold text-charcoal-800 mb-1">
                  4. Tahapan Komunikasi dengan Konsumen <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {STAGES.map((stg) => {
                    const isSelected = formData.status === stg.id;
                    const Icon = stg.icon;
                    return (
                      <div
                        key={stg.id}
                        onClick={() => setFormData({ ...formData, status: stg.id })}
                        className={`p-2.5 rounded-xl border cursor-pointer transition-all ${
                          isSelected
                            ? 'border-gold-500 bg-gold-50/70 ring-1 ring-gold-500/40 text-charcoal-900'
                            : 'border-[#EAE8E3] bg-[#F8F7F4] hover:bg-white text-charcoal-600'
                        }`}
                      >
                        <div className="flex items-center gap-1.5">
                          <Icon
                            className="w-3.5 h-3.5"
                            style={{ color: isSelected ? stg.accentColor : '#8A8A8A' }}
                          />
                          <span className="text-xs font-bold">{stg.title}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 5. Keterangan atau Catatan Tambahan */}
              <div>
                <label className="block text-xs font-bold text-charcoal-800 mb-1">
                  5. Keterangan atau Catatan Tambahan
                </label>
                <textarea
                  rows={3}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Catat rangkuman pertanyaan konsumen, penawaran harga, atau rencana kunjungan showroom..."
                  className="w-full text-xs px-3.5 py-2 bg-[#F8F7F4] border border-[#EAE8E3] rounded-xl text-charcoal-900 focus:outline-none focus:border-gold-500 focus:ring-2 focus:ring-gold-500/20 resize-none font-medium leading-relaxed"
                />
              </div>

              {/* 6. Tanggal Konsumen Menghubungi HR MOTOR */}
              <div>
                <label className="block text-xs font-bold text-charcoal-800 mb-1">
                  6. Tanggal Konsumen Menghubungi HR MOTOR <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={formData.dateReceived}
                  onChange={(e) => setFormData({ ...formData, dateReceived: e.target.value })}
                  className="w-full text-xs px-3.5 py-2.5 bg-[#F8F7F4] border border-[#EAE8E3] rounded-xl text-charcoal-900 focus:outline-none focus:border-gold-500 font-medium"
                />
              </div>

              {/* Modal Actions */}
              <div className="pt-3 border-t border-[#EAE8E3] flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  disabled={submitting}
                  className="btn-outline-warm text-xs py-2 px-4"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn-gold text-xs py-2 px-5 font-bold flex items-center gap-1.5 shadow-md"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{submitting ? 'Menyimpan...' : editingLead ? 'Simpan Perubahan' : 'Tambah Lead'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. MODAL: UBAH TAHAPAN KOMUNIKASI */}
      {stageChangeLead && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-charcoal-950/70 backdrop-blur-xs">
          <div className="bg-white rounded-2xl w-full max-w-md border border-[#EAE8E3] shadow-2xl p-5 space-y-4 animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between border-b border-[#EAE8E3] pb-3">
              <div>
                <span className="badge-gold text-[10px]">Perkembangan Komunikasi</span>
                <h3 className="text-base font-black text-charcoal-900 mt-0.5">Ubah Tahapan Konsumen</h3>
              </div>
              <button
                onClick={() => setStageChangeLead(null)}
                className="p-1.5 rounded-lg text-charcoal-400 hover:text-charcoal-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Target Consumer Info */}
            <div className="bg-[#FAF9F5] p-3 rounded-xl border border-[#EAE8E3] text-xs space-y-1">
              <p className="font-bold text-charcoal-900 text-sm">{stageChangeLead.customerName}</p>
              <p className="text-charcoal-500 font-mono text-[11px]">{stageChangeLead.contactNumber}</p>
              {stageChangeLead.interestedVehicle && (
                <p className="text-gold-700 font-semibold">{stageChangeLead.interestedVehicle}</p>
              )}
            </div>

            {/* Stage Selector Options */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-charcoal-800">
                Pilih Tahapan Baru:
              </label>
              {STAGES.map((stg) => {
                const isSelected = newTargetStage === stg.id;
                const Icon = stg.icon;
                return (
                  <div
                    key={stg.id}
                    onClick={() => setNewTargetStage(stg.id)}
                    className={`p-3 rounded-xl border cursor-pointer transition-all flex items-start gap-3 ${
                      isSelected
                        ? 'border-gold-500 bg-gold-50/70 ring-1 ring-gold-500/50'
                        : 'border-[#EAE8E3] bg-[#F8F7F4] hover:bg-white'
                    }`}
                  >
                    <div
                      className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                      style={{ backgroundColor: `${stg.accentColor}18`, color: stg.accentColor }}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-charcoal-900">{stg.title}</p>
                      <p className="text-[11px] text-charcoal-500 mt-0.5">{stg.fullDesc}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Stage Change Notes */}
            <div>
              <label className="block text-xs font-bold text-charcoal-800 mb-1">
                Catatan Perkembangan Komunikasi (Opsional):
              </label>
              <textarea
                rows={2}
                value={stageChangeNotes}
                onChange={(e) => setStageChangeNotes(e.target.value)}
                placeholder="Misal: Konsumen menawar harga Rp 185 juta nett / Konsumen akan datang hari Sabtu..."
                className="w-full text-xs px-3 py-2 bg-[#F8F7F4] border border-[#EAE8E3] rounded-xl text-charcoal-900 focus:outline-none focus:border-gold-500 resize-none font-medium"
              />
            </div>

            {/* Buttons */}
            <div className="pt-2 border-t border-[#EAE8E3] flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setStageChangeLead(null)}
                disabled={submitting}
                className="btn-outline-warm text-xs py-2 px-3.5"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmStageChange}
                disabled={submitting}
                className="btn-gold text-xs py-2 px-4 font-bold flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{submitting ? 'Memproses...' : 'Perbarui Tahapan'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. MODAL: KONFIRMASI HAPUS LEAD */}
      {deletingLead && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-charcoal-950/70 backdrop-blur-xs">
          <div className="bg-white rounded-2xl w-full max-w-sm border border-[#EAE8E3] shadow-2xl p-5 space-y-4 animate-in fade-in zoom-in duration-150">
            <div className="w-12 h-12 rounded-full bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>

            <div className="text-center">
              <h3 className="text-base font-black text-charcoal-900">Hapus Calon Konsumen?</h3>
              <p className="text-xs text-charcoal-600 mt-2 leading-relaxed">
                Apakah Anda yakin ingin menghapus data calon konsumen{' '}
                <strong className="text-charcoal-900">{deletingLead.customerName}</strong> (
                {deletingLead.contactNumber || '-'})?
              </p>
              <p className="text-[11px] text-rose-600 mt-1.5 bg-rose-50 p-2 rounded-lg border border-rose-200">
                Data akan dihapus permanen dari Sales Pipeline dan Lead Management.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeletingLead(null)}
                disabled={submitting}
                className="btn-outline-warm text-xs py-2"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={submitting}
                className="py-2 px-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-colors shadow-xs"
              >
                {submitting ? 'Menghapus...' : 'Ya, Hapus Data'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 7. MODAL: RIWAYAT PERJALANAN TAHAPAN (STAGE HISTORY) */}
      {historyLead && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-charcoal-950/70 backdrop-blur-xs">
          <div className="bg-white rounded-2xl w-full max-w-lg border border-[#EAE8E3] shadow-2xl p-5 space-y-4 animate-in fade-in zoom-in duration-150 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-[#EAE8E3] pb-3 shrink-0">
              <div>
                <span className="badge-gold text-[10px]">Audit Trail Komunikasi</span>
                <h3 className="text-base font-black text-charcoal-900 mt-0.5">Riwayat Perjalanan Konsumen</h3>
                <p className="text-xs text-charcoal-500 font-semibold">{historyLead.customerName} ({historyLead.contactNumber})</p>
              </div>
              <button
                onClick={() => setHistoryLead(null)}
                className="p-1.5 rounded-lg text-charcoal-400 hover:text-charcoal-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="overflow-y-auto space-y-4 pr-1 py-1 flex-1">
              {(!historyLead.stageHistory || historyLead.stageHistory.length === 0) ? (
                <div className="p-6 text-center text-charcoal-400">
                  <Clock className="w-8 h-8 mx-auto mb-2 text-charcoal-300" />
                  <p className="text-xs font-semibold">Belum ada riwayat perubahan tahapan</p>
                </div>
              ) : (
                <div className="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-[#EAE8E3]">
                  {historyLead.stageHistory.map((item, idx) => (
                    <div key={idx} className="relative">
                      {/* Timeline dot */}
                      <div className="absolute -left-6 top-1 w-3 h-3 rounded-full bg-gold-500 border-2 border-white shadow-xs" />

                      <div className="bg-[#FAF9F5] p-3 rounded-xl border border-[#EAE8E3] space-y-1">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-black text-charcoal-900 bg-white px-2 py-0.5 rounded-md border border-[#EAE8E3]">
                            {item.stage}
                          </span>
                          <span className="text-[10px] text-charcoal-400 font-mono">
                            {formatDate(item.timestamp, true)}
                          </span>
                        </div>
                        {item.notes && (
                          <p className="text-xs text-charcoal-700 italic pt-1">&ldquo;{item.notes}&rdquo;</p>
                        )}
                        {item.updatedByName && (
                          <p className="text-[10px] text-charcoal-400 text-right pt-0.5">
                            Oleh: <strong className="text-charcoal-600">{item.updatedByName}</strong>
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="pt-2 border-t border-[#EAE8E3] flex justify-end shrink-0">
              <button
                onClick={() => setHistoryLead(null)}
                className="btn-outline-warm text-xs py-2 px-4"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
