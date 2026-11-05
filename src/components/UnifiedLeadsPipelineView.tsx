'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  GitPullRequest,
  Target,
  Search,
  Filter,
  Plus,
  Edit,
  Trash2,
  MessageCircle,
  Phone,
  Car,
  DollarSign,
  UserCheck,
  Calendar,
  Clock,
  History,
  Layers,
  List,
  X,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import { useCrm } from '@/context/CrmContext';
import {
  Lead,
  LeadSourceType,
  CorePipelineStage,
  PipelineStage,
  VehicleCategory,
  CORE_PIPELINE_STAGES,
  normalizePipelineStage,
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
    shortDesc: 'Kunjungan / cek fisik showroom',
    fullDesc:
      'Konsumen memiliki ketertarikan lebih lanjut, berencana datang ke showroom HR MOTOR Garut untuk cek kondisi unit langsung, atau sudah selesai cek unit.',
    icon: Car,
    accentColor: '#10B981',
    badgeClass: 'bg-emerald-50 text-emerald-800 border-emerald-300 font-bold',
    borderClass: 'border-emerald-300/80',
    bgLight: 'bg-emerald-50/30',
  },
];

// Helper: normalize phone number for search and comparisons
function normalizePhone(phone?: string): string {
  let digits = (phone || '').replace(/\D/g, '');
  if (digits.startsWith('62')) {
    digits = '0' + digits.slice(2);
  }
  return digits;
}

export interface UnifiedLeadsPipelineViewProps {
  defaultView?: 'table' | 'kanban';
}

export default function UnifiedLeadsPipelineView({ defaultView = 'table' }: UnifiedLeadsPipelineViewProps) {
  const {
    leads,
    users,
    currentUser,
    stocks,
    addLead,
    updateLead,
    updateLeadStage,
    deleteLead,
    addCustomer,
    formatRupiah,
    formatDate,
    formatWhatsAppLink,
  } = useCrm();

  // View mode switcher: Table vs Kanban
  const [viewMode, setViewMode] = useState<'table' | 'kanban'>(defaultView);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [filterSource, setFilterSource] = useState('ALL');
  const [filterStage, setFilterStage] = useState<'ALL' | CorePipelineStage>('ALL');
  const [filterSales, setFilterSales] = useState('ALL');
  const [mobileKanbanTab, setMobileKanbanTab] = useState<'ALL' | CorePipelineStage>('ALL');

  // Drag and drop state for Kanban
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

  // Ready showroom stocks for datalist suggestion
  const readyStocks = useMemo(() => {
    return (stocks || []).filter((s) => s.status === 'Tersedia');
  }, [stocks]);

  // Form data state
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);
  const [formData, setFormData] = useState({
    customerName: '',
    contactNumber: '',
    email: '',
    leadSource: 'WhatsApp' as LeadSourceType,
    interestedVehicle: '',
    vehicleType: 'MPV' as VehicleCategory,
    estimatedBudget: '',
    assignedSalesId: 'USR-003',
    status: 'Hanya Menanyakan' as CorePipelineStage,
    notes: '',
    dateReceived: todayStr,
    searchBrand: '',
    searchModel: '',
    searchYearMin: '',
    searchYearMax: '',
    searchBudgetMax: '',
    searchTransmission: 'Semua',
  });

  // Helper for lead age
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

  // Filtered leads calculation
  const filteredLeads = useMemo(() => {
    let result = [...leads];

    // Filter by role if Sales Representative
    if (currentUser.role === 'Sales Representative') {
      result = result.filter((l) => l.assignedSalesId === currentUser.id || !l.assignedSalesId);
    }

    // Search query: name, phone, interested vehicle, ID
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const cleanQ = normalizePhone(q);
      const rawQ = q.replace(/\D/g, '');
      result = result.filter((l) => {
        const nameMatch = l.customerName?.toLowerCase().includes(q);
        const lPhoneNorm = normalizePhone(l.contactNumber || l.customerPhone);
        const phoneMatch = cleanQ.length >= 3 && lPhoneNorm.includes(cleanQ);
        const rawPhone = (l.contactNumber || l.customerPhone || '').replace(/\D/g, '');
        const rawPhoneMatch = rawQ.length >= 3 && rawPhone.includes(rawQ);
        const vehicleMatch = l.interestedVehicle?.toLowerCase().includes(q);
        const idMatch = l.id?.toLowerCase().includes(q);
        return nameMatch || phoneMatch || rawPhoneMatch || vehicleMatch || idMatch;
      });
    }

    // Filter by source
    if (filterSource !== 'ALL') {
      result = result.filter((l) => l.leadSource === filterSource);
    }

    // Filter by pipeline stage
    if (filterStage !== 'ALL') {
      result = result.filter((l) => normalizePipelineStage(l.status) === filterStage);
    }

    // Filter by sales PJ
    if (filterSales !== 'ALL') {
      result = result.filter((l) => l.assignedSalesId === filterSales);
    }

    return result;
  }, [leads, currentUser, searchQuery, filterSource, filterStage, filterSales]);

  // Group leads for Kanban columns
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

  // Stage counts for Dashboard & KPI Badges (across all user-authorized leads)
  const stageCounts = useMemo(() => {
    let baseLeads = leads;
    if (currentUser.role === 'Sales Representative') {
      baseLeads = baseLeads.filter((l) => l.assignedSalesId === currentUser.id || !l.assignedSalesId);
    }

    const counts: Record<CorePipelineStage, number> = {
      'Hanya Menanyakan': 0,
      'Negosiasi': 0,
      'Cek Unit': 0,
    };

    baseLeads.forEach((l) => {
      const core = normalizePipelineStage(l.status);
      counts[core] = (counts[core] || 0) + 1;
    });

    return {
      counts,
      total: baseLeads.length,
    };
  }, [leads, currentUser]);

  // Duplicate warning detector in Add/Edit form
  const duplicateWarning = useMemo(() => {
    if (!formData.contactNumber && !formData.customerName) return null;
    const cleanPhone = normalizePhone(formData.contactNumber);
    const cleanName = formData.customerName.toLowerCase().trim();

    const existing = leads.find((l) => {
      if (editingLead && l.id === editingLead.id) return false;
      const lPhone = normalizePhone(l.contactNumber || l.customerPhone);
      const phoneMatch =
        cleanPhone.length >= 8 &&
        lPhone.length >= 8 &&
        (cleanPhone === lPhone || cleanPhone.includes(lPhone) || lPhone.includes(cleanPhone));
      const nameMatch = cleanName.length >= 3 && l.customerName?.toLowerCase().trim() === cleanName;
      return phoneMatch || nameMatch;
    });

    if (existing) {
      return {
        id: existing.id,
        name: existing.customerName,
        phone: existing.contactNumber || existing.customerPhone,
        stage: normalizePipelineStage(existing.status),
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
      email: '',
      leadSource: 'WhatsApp',
      interestedVehicle: '',
      vehicleType: 'MPV',
      estimatedBudget: '',
      assignedSalesId: currentUser.role === 'Sales Representative' ? currentUser.id : 'USR-003',
      status: 'Hanya Menanyakan',
      notes: '',
      dateReceived: todayStr,
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

  // Open Edit Modal
  const openEditModal = (lead: Lead) => {
    setEditingLead(lead);
    setFormData({
      customerName: lead.customerName || '',
      contactNumber: lead.contactNumber || lead.customerPhone || '',
      email: lead.email || '',
      leadSource: lead.leadSource || 'WhatsApp',
      interestedVehicle: lead.interestedVehicle || '',
      vehicleType: lead.vehicleType || 'MPV',
      estimatedBudget: String(lead.estimatedBudget || ''),
      assignedSalesId: lead.assignedSalesId || 'USR-003',
      status: normalizePipelineStage(lead.status),
      notes: lead.notes || '',
      dateReceived: lead.dateReceived ? lead.dateReceived.split('T')[0] : todayStr,
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
      setFormError('Nama calon pembeli wajib diisi.');
      setSubmitting(false);
      return;
    }
    if (!formData.contactNumber.trim()) {
      setFormError('Nomor WhatsApp wajib diisi.');
      setSubmitting(false);
      return;
    }

    if (!editingLead && duplicateWarning && typeof window !== 'undefined') {
      const proceed = window.confirm(
        `PERINGATAN DUPLIKASI DATA CALON PEMBELI:\n\nKonsumen "${duplicateWarning.name}" (${duplicateWarning.phone}) sudah terdaftar di tahapan "${duplicateWarning.stage}" (${duplicateWarning.id}).\n\nApakah Anda yakin ingin tetap mendaftarkan calon pembeli ini?`
      );
      if (!proceed) {
        setSubmitting(false);
        return;
      }
    }

    const assignedUser = users.find((u) => u.id === formData.assignedSalesId);
    const searchData = {
      searchBrand: formData.searchBrand.trim() || undefined,
      searchModel: formData.searchModel.trim() || undefined,
      searchYearMin: formData.searchYearMin ? Number(formData.searchYearMin) : undefined,
      searchYearMax: formData.searchYearMax ? Number(formData.searchYearMax) : undefined,
      searchBudgetMax: formData.searchBudgetMax ? Number(formData.searchBudgetMax) : undefined,
      searchTransmission: (formData.searchTransmission !== 'Semua' ? formData.searchTransmission : undefined) as any,
    };

    try {
      if (editingLead) {
        const res = await updateLead({
          id: editingLead.id,
          customerName: formData.customerName.trim(),
          contactNumber: formData.contactNumber.trim(),
          customerPhone: formData.contactNumber.trim(),
          email: formData.email.trim() || undefined,
          leadSource: formData.leadSource,
          interestedVehicle: formData.interestedVehicle.trim(),
          vehicleType: formData.vehicleType,
          estimatedBudget: Number(formData.estimatedBudget) || 0,
          assignedSalesId: formData.assignedSalesId,
          assignedSalesName: assignedUser?.name || 'Asep Kurniawan',
          status: formData.status as PipelineStage,
          notes: formData.notes.trim(),
          dateReceived: formData.dateReceived,
          ...searchData,
        });

        if (res.success) {
          setIsAddModalOpen(false);
          setEditingLead(null);
        } else {
          setFormError(res.error || 'Gagal memperbarui data calon pembeli.');
        }
      } else {
        const res = await addLead({
          customerName: formData.customerName.trim(),
          contactNumber: formData.contactNumber.trim(),
          customerPhone: formData.contactNumber.trim(),
          email: formData.email.trim() || undefined,
          leadSource: formData.leadSource,
          interestedVehicle: formData.interestedVehicle.trim(),
          vehicleType: formData.vehicleType,
          estimatedBudget: Number(formData.estimatedBudget) || 0,
          assignedSalesId: formData.assignedSalesId,
          assignedSalesName: assignedUser?.name || 'Asep Kurniawan',
          status: formData.status as PipelineStage,
          notes: formData.notes.trim(),
          dateReceived: formData.dateReceived,
          lastContactDate: formData.dateReceived,
          ...searchData,
        });

        if (res.success) {
          setIsAddModalOpen(false);
        } else {
          setFormError(res.error || 'Gagal menambahkan calon pembeli.');
        }
      }
    } catch {
      setFormError('Terjadi kesalahan koneksi sistem CRM.');
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
      alert(res.error || 'Gagal menghapus data calon pembeli.');
    }
  };

  // Convert Lead to Official Customer
  const handleConvertToCustomer = async (lead: Lead) => {
    if (lead.customerId) {
      alert('Calon pembeli ini sudah terhubung ke database pelanggan.');
      return;
    }
    const res = await addCustomer({
      fullName: lead.customerName,
      whatsapp: lead.contactNumber || lead.customerPhone || '',
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
      alert(res.error || 'Gagal mengonversi ke database pelanggan.');
    }
  };

  // Drag and drop handlers for Kanban
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

  // Funnel calculations
  const totalLeadsCount = stageCounts.total || 1;
  const menanyakanCount = stageCounts.counts['Hanya Menanyakan'] || 0;
  const negosiasiCount = stageCounts.counts['Negosiasi'] || 0;
  const cekUnitCount = stageCounts.counts['Cek Unit'] || 0;

  const pctMenanyakan = Math.round((menanyakanCount / totalLeadsCount) * 100);
  const pctNegosiasi = Math.round((negosiasiCount / totalLeadsCount) * 100);
  const pctCekUnit = Math.round((cekUnitCount / totalLeadsCount) * 100);

  return (
    <div className="space-y-6">
      {/* 1. PAGE HEADER & PRIMARY ACTIONS */}
      <div className="crm-card p-5 sm:p-6 border-b-2 border-b-gold-500/40">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="badge-gold flex items-center gap-1.5 text-[11px]">
                <GitPullRequest className="w-3.5 h-3.5 text-gold-700" />
                <span>Prospek & Penjualan Mobil</span>
              </span>
              <span className="text-xs text-charcoal-300">•</span>
              <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                Fitur Terpadu Showroom
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-charcoal-900 mt-1 tracking-tight">
              Prospek & Alur Penjualan Calon Pembeli
            </h1>
            <p className="text-xs sm:text-sm text-charcoal-500 mt-1 max-w-3xl leading-relaxed">
              Kelola seluruh calon pembeli mobil showroom HR MOTOR Garut dari WhatsApp, medsos, dan walk-in.
              Pantau perkembangan interaksi mulai dari tanya unit, proses tawar-menawar harga (negosiasi), hingga cek fisik unit di showroom.
            </p>
          </div>

          {/* Header Action Toolbar: View Switcher & + Tambah Calon Pembeli */}
          <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
            {/* View Switcher: Tabel vs Kanban */}
            <div className="inline-flex bg-[#F0EEEA] p-1 rounded-xl border border-[#E0DDD5]">
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  viewMode === 'table'
                    ? 'bg-white text-charcoal-950 shadow-xs border border-[#D5D2CB]'
                    : 'text-charcoal-600 hover:text-charcoal-900'
                }`}
                title="Tampilkan dalam bentuk tabel data calon pembeli"
              >
                <List className="w-3.5 h-3.5 text-gold-600" />
                <span>📋 Tabel Calon Pembeli</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('kanban')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  viewMode === 'kanban'
                    ? 'bg-white text-charcoal-950 shadow-xs border border-[#D5D2CB]'
                    : 'text-charcoal-600 hover:text-charcoal-900'
                }`}
                title="Tampilkan dalam bentuk papan alur interaksi 3 kolom"
              >
                <Layers className="w-3.5 h-3.5 text-gold-600" />
                <span>📊 Papan Alur Interaksi (3 Kolom)</span>
              </button>
            </div>

            {/* Primary Action Button: + Tambah Calon Pembeli */}
            <button
              onClick={openAddModal}
              className="btn-gold flex items-center justify-center gap-2 text-xs py-2.5 px-4 font-bold shadow-md cursor-pointer ml-auto sm:ml-0"
            >
              <Plus className="w-4 h-4" />
              <span>+ Tambah Calon Pembeli</span>
            </button>
          </div>
        </div>

        {/* 2. TOP DASHBOARD PERKEMBANGAN INTERAKSI KONSUMEN */}
        <div className="mt-6 pt-5 border-t border-[#EAE8E3]">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-gold-600" />
              <h2 className="text-xs font-black uppercase tracking-wider text-charcoal-700">
                Ringkasan Perkembangan Interaksi Konsumen
              </h2>
            </div>
            {filterStage !== 'ALL' && (
              <button
                onClick={() => setFilterStage('ALL')}
                className="text-[11px] text-gold-700 hover:underline font-bold flex items-center gap-1"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Tampilkan Semua Tahap ({stageCounts.total})</span>
              </button>
            )}
          </div>

          {/* Metric Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Card 1: Total yang Menanyakan */}
            <div
              onClick={() => setFilterStage(filterStage === 'Hanya Menanyakan' ? 'ALL' : 'Hanya Menanyakan')}
              className={`p-4 rounded-xl border transition-all cursor-pointer relative overflow-hidden ${
                filterStage === 'Hanya Menanyakan'
                  ? 'border-blue-500 bg-blue-50/70 ring-2 ring-blue-500/30 shadow-sm'
                  : 'border-[#EAE8E3] bg-[#FAF9F5] hover:border-blue-300 hover:bg-white'
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 bg-blue-100/70 px-2 py-0.5 rounded-md">
                    Tahap 1 • Baru Bertanya
                  </span>
                  <h3 className="text-xs font-bold text-charcoal-700 mt-2">Total yang Menanyakan</h3>
                  <p className="text-2xl font-black text-blue-600 mt-0.5">{menanyakanCount}</p>
                  <p className="text-[11px] text-charcoal-500 mt-1">Inquiry awal via WhatsApp / medsos</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 border border-blue-200 flex items-center justify-center shrink-0">
                  <MessageCircle className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-3 pt-2 border-t border-blue-100 text-[10px] text-blue-800 font-semibold flex items-center justify-between">
                <span>Porsi interaksi:</span>
                <span className="font-bold">{pctMenanyakan}%</span>
              </div>
            </div>

            {/* Card 2: Total yang Negosiasi */}
            <div
              onClick={() => setFilterStage(filterStage === 'Negosiasi' ? 'ALL' : 'Negosiasi')}
              className={`p-4 rounded-xl border transition-all cursor-pointer relative overflow-hidden ${
                filterStage === 'Negosiasi'
                  ? 'border-gold-500 bg-gold-50/70 ring-2 ring-gold-500/40 shadow-sm'
                  : 'border-[#EAE8E3] bg-[#FAF9F5] hover:border-gold-300 hover:bg-white'
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-gold-800 bg-gold-100/70 px-2 py-0.5 rounded-md">
                    Tahap 2 • Tawar-Menawar
                  </span>
                  <h3 className="text-xs font-bold text-charcoal-700 mt-2">Total yang Negosiasi</h3>
                  <p className="text-2xl font-black text-gold-600 mt-0.5">{negosiasiCount}</p>
                  <p className="text-[11px] text-charcoal-500 mt-1">Bahas harga & penawaran pembelian</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-gold-50 text-gold-600 border border-gold-200 flex items-center justify-center shrink-0">
                  <DollarSign className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-3 pt-2 border-t border-gold-100 text-[10px] text-gold-800 font-semibold flex items-center justify-between">
                <span>Porsi interaksi:</span>
                <span className="font-bold">{pctNegosiasi}%</span>
              </div>
            </div>

            {/* Card 3: Total Cek Unit */}
            <div
              onClick={() => setFilterStage(filterStage === 'Cek Unit' ? 'ALL' : 'Cek Unit')}
              className={`p-4 rounded-xl border transition-all cursor-pointer relative overflow-hidden ${
                filterStage === 'Cek Unit'
                  ? 'border-emerald-500 bg-emerald-50/70 ring-2 ring-emerald-500/30 shadow-sm'
                  : 'border-[#EAE8E3] bg-[#FAF9F5] hover:border-emerald-300 hover:bg-white'
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-100/70 px-2 py-0.5 rounded-md">
                    Tahap 3 • Kunjungan Showroom
                  </span>
                  <h3 className="text-xs font-bold text-charcoal-700 mt-2">Total Cek Unit</h3>
                  <p className="text-2xl font-black text-emerald-600 mt-0.5">{cekUnitCount}</p>
                  <p className="text-[11px] text-charcoal-500 mt-1">Cek fisik mobil di showroom Garut</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center shrink-0">
                  <Car className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-3 pt-2 border-t border-emerald-100 text-[10px] text-emerald-800 font-semibold flex items-center justify-between">
                <span>Porsi interaksi:</span>
                <span className="font-bold">{pctCekUnit}%</span>
              </div>
            </div>

            {/* Card 4: Total Calon Pembeli Aktif */}
            <div
              onClick={() => setFilterStage('ALL')}
              className={`p-4 rounded-xl border transition-all cursor-pointer relative overflow-hidden ${
                filterStage === 'ALL'
                  ? 'border-2 border-gold-400 bg-[#FDF8ED] text-charcoal-900 shadow-sm'
                  : 'border-[#EAE8E3] bg-[#FAF9F5] hover:border-gold-300'
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <span
                    className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${
                      filterStage === 'ALL' ? 'bg-gold-500 text-charcoal-950 font-black' : 'bg-charcoal-200 text-charcoal-800'
                    }`}
                  >
                    Seluruh Corong
                  </span>
                  <h3 className="text-xs font-bold mt-2 text-charcoal-700">
                    Total Calon Pembeli
                  </h3>
                  <p className={`text-2xl font-black mt-0.5 ${filterStage === 'ALL' ? 'text-gold-700' : 'text-charcoal-900'}`}>
                    {stageCounts.total}
                  </p>
                  <p className="text-[11px] mt-1 text-charcoal-500">
                    Interaksi konsumen aktif terdata
                  </p>
                </div>
                <div
                  className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 ${
                    filterStage === 'ALL'
                      ? 'bg-white/10 text-gold-400 border-gold-500/40'
                      : 'bg-white text-charcoal-700 border-[#EAE8E3]'
                  }`}
                >
                  <Target className="w-5 h-5" />
                </div>
              </div>
              <div
                className={`mt-3 pt-2 border-t text-[10px] font-semibold flex items-center justify-between ${
                  filterStage === 'ALL' ? 'border-white/10 text-slate-300' : 'border-[#EAE8E3] text-charcoal-600'
                }`}
              >
                <span>Status data:</span>
                <span className="font-bold text-emerald-400">100% Sinkron</span>
              </div>
            </div>
          </div>

          {/* Visual Funnel Conversion Bar */}
          <div className="mt-4 p-3.5 bg-[#FAF9F5] rounded-xl border border-[#EAE8E3]">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs mb-2">
              <span className="font-bold text-charcoal-800 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-gold-600" />
                <span>Corong Konversi Tahapan Interaksi Calon Pembeli</span>
              </span>
              <span className="text-[11px] text-charcoal-500">
                Klik kartu tahap di atas untuk memfilter data di bawah
              </span>
            </div>

            {/* Multi-segment progress bar */}
            <div className="w-full h-3 bg-white rounded-full overflow-hidden flex border border-[#E0DDD5]">
              <div
                style={{ width: `${menanyakanCount > 0 ? Math.max(pctMenanyakan, 4) : 0}%` }}
                className="bg-blue-500 h-full transition-all duration-500"
                title={`Menanyakan: ${menanyakanCount} (${pctMenanyakan}%)`}
              />
              <div
                style={{ width: `${negosiasiCount > 0 ? Math.max(pctNegosiasi, 4) : 0}%` }}
                className="bg-gold-500 h-full transition-all duration-500"
                title={`Negosiasi: ${negosiasiCount} (${pctNegosiasi}%)`}
              />
              <div
                style={{ width: `${cekUnitCount > 0 ? Math.max(pctCekUnit, 4) : 0}%` }}
                className="bg-emerald-500 h-full transition-all duration-500"
                title={`Cek Unit: ${cekUnitCount} (${pctCekUnit}%)`}
              />
            </div>

            {/* Funnel Step Legend */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-2.5 text-[11px]">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500 shrink-0" />
                <span className="text-charcoal-700">
                  <strong>Menanyakan:</strong> {menanyakanCount} org ({pctMenanyakan}%)
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-gold-500 shrink-0" />
                <span className="text-charcoal-700">
                  <strong>Negosiasi:</strong> {negosiasiCount} org ({pctNegosiasi}%)
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
                <span className="text-charcoal-700">
                  <strong>Cek Unit:</strong> {cekUnitCount} org ({pctCekUnit}%)
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. SEARCH & FILTER TOOLBAR */}
      <div className="crm-card p-3.5 sm:p-4 space-y-3">
        <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
          {/* Search Box */}
          <div className="flex-1 relative w-full">
            <Search className="w-4 h-4 text-charcoal-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari calon pembeli berdasarkan nama, no WhatsApp, tipe unit, atau ID..."
              className="w-full text-xs pl-9 pr-8 py-2.5 bg-[#F8F7F4] border border-[#EAE8E3] rounded-xl outline-none focus:border-gold-500 focus:ring-2 focus:ring-gold-500/20 text-charcoal-900 placeholder-charcoal-400 font-medium transition-all"
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

          {/* Filter Dropdowns */}
          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            {/* Filter Sumber */}
            <select
              value={filterSource}
              onChange={(e) => setFilterSource(e.target.value)}
              className="text-xs px-3 py-2.5 bg-[#F8F7F4] border border-[#EAE8E3] rounded-xl text-charcoal-800 font-semibold outline-none focus:border-gold-500"
            >
              <option value="ALL">Semua Sumber</option>
              <option value="WhatsApp">WhatsApp</option>
              <option value="Instagram">Instagram</option>
              <option value="Facebook">Facebook</option>
              <option value="TikTok">TikTok</option>
              <option value="Walk-in">Walk-in Showroom</option>
              <option value="Referral">Referral</option>
              <option value="Other">Lainnya</option>
            </select>

            {/* Filter Tahap Pipeline */}
            <select
              value={filterStage}
              onChange={(e) => setFilterStage(e.target.value as any)}
              className="text-xs px-3 py-2.5 bg-[#F8F7F4] border border-[#EAE8E3] rounded-xl text-charcoal-800 font-semibold outline-none focus:border-gold-500"
            >
              <option value="ALL">Semua Tahapan</option>
              <option value="Hanya Menanyakan">Hanya Menanyakan ({stageCounts.counts['Hanya Menanyakan']})</option>
              <option value="Negosiasi">Negosiasi ({stageCounts.counts['Negosiasi']})</option>
              <option value="Cek Unit">Cek Unit ({stageCounts.counts['Cek Unit']})</option>
            </select>

            {/* Filter Sales */}
            <select
              value={filterSales}
              onChange={(e) => setFilterSales(e.target.value)}
              className="text-xs px-3 py-2.5 bg-[#F8F7F4] border border-[#EAE8E3] rounded-xl text-charcoal-800 font-semibold outline-none focus:border-gold-500"
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

        {/* Status Strip & Filter Reset */}
        <div className="text-[11px] text-charcoal-500 pt-2 border-t border-[#EAE8E3] flex flex-wrap items-center justify-between gap-2">
          <span>
            Menampilkan <strong className="text-charcoal-900">{filteredLeads.length}</strong> data calon pembeli
            {filterStage !== 'ALL' && (
              <span className="ml-1 text-gold-700 font-semibold">
                (filter tahap: <strong>{filterStage}</strong>)
              </span>
            )}
            {filterSource !== 'ALL' && (
              <span className="ml-1 text-charcoal-700">
                (sumber: <strong>{filterSource}</strong>)
              </span>
            )}
          </span>

          <div className="flex items-center gap-2">
            {(filterStage !== 'ALL' || filterSource !== 'ALL' || filterSales !== 'ALL' || searchQuery) && (
              <button
                onClick={() => {
                  setFilterStage('ALL');
                  setFilterSource('ALL');
                  setFilterSales('ALL');
                  setSearchQuery('');
                }}
                className="text-rose-600 hover:text-rose-700 font-bold flex items-center gap-1"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset Semua Filter</span>
              </button>
            )}
            <span className="text-charcoal-400 font-medium hidden sm:inline">
              Mode Tampilan: <strong>{viewMode === 'table' ? 'Tabel Calon Pembeli' : 'Papan Kanban'}</strong>
            </span>
          </div>
        </div>
      </div>

      {/* 4. MAIN VIEW CONTAINER: TABEL vs KANBAN */}
      {viewMode === 'table' ? (
        /* ========================================================================= */
        /* VIEW 1: TABEL CALON PEMBELI (DATA TABLE + MOBILE CARDS)                    */
        /* ========================================================================= */
        <div className="space-y-4">
          {/* MOBILE CARDS VIEW (< 768px) */}
          <div className="space-y-3 md:hidden">
            {filteredLeads.length === 0 ? (
              <div className="crm-card p-8 text-center text-charcoal-400">
                <Target className="w-9 h-9 mx-auto mb-2 text-charcoal-300" />
                <p className="font-semibold text-charcoal-700">Tidak ada calon pembeli yang sesuai kriteria</p>
                <p className="text-[11px] text-charcoal-400 mt-0.5">
                  Coba ubah kata kunci pencarian atau reset filter tahapan.
                </p>
              </div>
            ) : (
              filteredLeads.map((lead) => {
                const normStage = normalizePipelineStage(lead.status);
                const stageObj = STAGES.find((s) => s.id === normStage) || STAGES[0];
                const cleanPhone = (lead.contactNumber || lead.customerPhone || '').replace(/\D/g, '');
                const waMessage = `Sampurasun Bapak/Ibu ${lead.customerName}, salam dari HR MOTOR Garut mengenai unit ${
                  lead.interestedVehicle || 'yang Anda tanyakan'
                }. Apakah ada yang bisa kami bantu?`;
                const waHref = cleanPhone ? formatWhatsAppLink(lead.contactNumber || lead.customerPhone, waMessage) : '#';

                return (
                  <div key={lead.id} className="crm-card p-4 space-y-3">
                    {/* Header */}
                    <div className="flex items-start justify-between gap-2 border-b border-[#EAE8E3] pb-2.5">
                      <div>
                        <h4 className="font-bold text-sm text-charcoal-900">{lead.customerName}</h4>
                        <span className="text-[10px] text-charcoal-400 font-mono">
                          {lead.id} • {lead.leadSource}
                        </span>
                      </div>
                      <span className={`inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${stageObj.badgeClass}`}>
                        {normStage}
                      </span>
                    </div>

                    {/* Content Details */}
                    <div className="grid grid-cols-2 gap-2 text-xs bg-[#FAF9F5] p-2.5 rounded-xl border border-[#EAE8E3]">
                      <div>
                        <span className="text-[10px] text-charcoal-400 block">Unit Diminati:</span>
                        <p className="font-bold text-charcoal-900 truncate">
                          {lead.interestedVehicle || 'Belum spesifik'}
                        </p>
                        <p className="text-[10px] text-charcoal-500 line-clamp-1 italic">{lead.notes || '-'}</p>
                      </div>
                      <div>
                        <span className="text-[10px] text-charcoal-400 block">Estimasi Budget:</span>
                        <p className="font-black text-gold-600">{formatRupiah(lead.estimatedBudget)}</p>
                        <span className="text-[10px] text-charcoal-500 block truncate">
                          Kontak: {formatDate(lead.lastContactDate || lead.dateReceived)}
                        </span>
                      </div>
                    </div>

                    {/* Action Bar */}
                    <div className="flex items-center justify-between gap-2 pt-1 border-t border-[#EAE8E3]">
                      {cleanPhone ? (
                        <a
                          href={waHref}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 py-2 px-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold inline-flex items-center justify-center gap-1.5 shadow-xs"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                          <span>WhatsApp</span>
                        </a>
                      ) : (
                        <span className="flex-1 py-2 px-2.5 bg-charcoal-100 text-charcoal-400 rounded-xl text-xs font-bold inline-flex items-center justify-center gap-1.5 cursor-not-allowed">
                          <MessageCircle className="w-3.5 h-3.5" />
                          <span>No WA</span>
                        </span>
                      )}

                      <button
                        onClick={() => openStageChangeModal(lead)}
                        className="py-2 px-2.5 rounded-xl bg-gold-50 text-gold-800 border border-gold-300 text-xs font-bold inline-flex items-center justify-center gap-1"
                        title="Ubah Tahapan Prospek"
                      >
                        <Layers className="w-3.5 h-3.5 text-gold-600" />
                        <span>Tahap</span>
                      </button>

                      <button
                        onClick={() => openEditModal(lead)}
                        className="p-2 rounded-xl bg-white border border-[#EAE8E3] text-charcoal-600 hover:text-charcoal-900"
                        title="Edit Data"
                      >
                        <Edit className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => setDeletingLead(lead)}
                        className="p-2 rounded-xl bg-white border border-rose-200 text-rose-600 hover:bg-rose-50"
                        title="Hapus Data"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* DESKTOP DATA TABLE (>= 768px) */}
          <div className="crm-card overflow-hidden hidden md:block">
            <div className="overflow-x-auto w-full">
              <table className="crm-table w-full min-w-[900px] text-left">
                <thead>
                  <tr>
                    <th className="py-3.5 px-4 font-bold text-xs text-charcoal-700">Nama Calon Pembeli</th>
                    <th className="py-3.5 px-4 font-bold text-xs text-charcoal-700">Sumber</th>
                    <th className="py-3.5 px-4 font-bold text-xs text-charcoal-700">Unit Diminati</th>
                    <th className="py-3.5 px-4 font-bold text-xs text-charcoal-700">Estimasi Budget</th>
                    <th className="py-3.5 px-4 font-bold text-xs text-charcoal-700">Tahapan Prospek</th>
                    <th className="py-3.5 px-4 font-bold text-xs text-charcoal-700">Kontak Terakhir</th>
                    <th className="py-3.5 px-4 font-bold text-xs text-charcoal-700 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EAE8E3] text-xs">
                  {filteredLeads.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-charcoal-400">
                        <Target className="w-9 h-9 mx-auto mb-2 text-charcoal-300" />
                        <p className="font-semibold text-charcoal-700">Tidak ada calon pembeli yang sesuai kriteria pencarian</p>
                        <p className="text-[11px] text-charcoal-400 mt-0.5">
                          Coba ubah kata kunci pencarian atau reset filter tahapan di atas.
                        </p>
                      </td>
                    </tr>
                  ) : (
                    filteredLeads.map((lead) => {
                      const normStage = normalizePipelineStage(lead.status);
                      const stageObj = STAGES.find((s) => s.id === normStage) || STAGES[0];
                      const cleanPhone = (lead.contactNumber || lead.customerPhone || '').replace(/\D/g, '');
                      const waMessage = `Sampurasun Bapak/Ibu ${lead.customerName}, salam dari HR MOTOR Garut mengenai unit ${
                        lead.interestedVehicle || 'yang Anda tanyakan'
                      }. Apakah ada informasi yang bisa kami bantu?`;
                      const waHref = cleanPhone ? formatWhatsAppLink(lead.contactNumber || lead.customerPhone, waMessage) : '#';

                      return (
                        <tr key={lead.id} className="hover:bg-[#F8F7F4]/90 transition-colors">
                          {/* 1. Nama Calon Pembeli & Kontak */}
                          <td className="py-3.5 px-4">
                            <div>
                              <p className="font-bold text-charcoal-900 text-sm">{lead.customerName}</p>
                              {cleanPhone ? (
                                <a
                                  href={waHref}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1.5 text-xs text-emerald-700 hover:text-emerald-800 font-semibold transition-colors mt-0.5"
                                  title="Chat WhatsApp langsung"
                                >
                                  <span className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
                                    <Phone className="w-2.5 h-2.5" />
                                  </span>
                                  {lead.contactNumber || lead.customerPhone}
                                </a>
                              ) : (
                                <span className="text-charcoal-400 font-mono text-xs">-</span>
                              )}
                              <span className="text-[10px] text-charcoal-400 font-mono block mt-0.5">
                                {lead.id} • {lead.assignedSalesName || 'Sales HR MOTOR'}
                              </span>
                            </div>
                          </td>

                          {/* 2. Sumber */}
                          <td className="py-3.5 px-4">
                            <span className="inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-bold bg-[#FAF9F5] border border-[#EAE8E3] text-charcoal-800">
                              {lead.leadSource}
                            </span>
                          </td>

                          {/* 3. Unit Diminati */}
                          <td className="py-3.5 px-4 max-w-xs">
                            <p className="font-bold text-charcoal-900">
                              {lead.interestedVehicle && lead.interestedVehicle.trim() ? (
                                lead.interestedVehicle
                              ) : (
                                <span className="text-charcoal-400 italic font-normal">Belum spesifik</span>
                              )}
                            </p>
                            <p className="text-[10px] text-charcoal-500 line-clamp-1 italic mt-0.5">
                              {lead.notes || 'Tidak ada catatan'}
                            </p>
                          </td>

                          {/* 4. Estimasi Budget */}
                          <td className="py-3.5 px-4 font-black text-gold-600 text-sm whitespace-nowrap">
                            {formatRupiah(lead.estimatedBudget)}
                          </td>

                          {/* 5. Tahap Pipeline */}
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <span className={`inline-flex px-2.5 py-1 rounded-full text-[11px] font-bold border ${stageObj.badgeClass}`}>
                              {normStage}
                            </span>
                          </td>

                          {/* 6. Kontak Terakhir */}
                          <td className="py-3.5 px-4 text-charcoal-500 text-[11px] whitespace-nowrap">
                            {formatDate(lead.lastContactDate || lead.dateReceived)}
                          </td>

                          {/* 7. Aksi */}
                          <td className="py-3.5 px-4 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              {/* Direct WhatsApp Button */}
                              {cleanPhone ? (
                                <a
                                  href={waHref}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="p-1.5 rounded-lg text-emerald-700 bg-emerald-50 hover:bg-emerald-100 transition-colors border border-emerald-200"
                                  title="Chat WhatsApp Langsung"
                                >
                                  <MessageCircle className="w-4 h-4" />
                                </a>
                              ) : (
                                <span
                                  className="p-1.5 rounded-lg text-charcoal-300 bg-charcoal-50 border border-charcoal-200 cursor-not-allowed"
                                  title="Nomor WhatsApp tidak tersedia"
                                >
                                  <MessageCircle className="w-4 h-4" />
                                </span>
                              )}

                              {/* Ubah Tahap Pipeline Button */}
                              <button
                                onClick={() => openStageChangeModal(lead)}
                                className="p-1.5 rounded-lg text-gold-700 bg-gold-50/70 hover:bg-gold-100/70 transition-colors border border-gold-200"
                                title="Ubah Tahapan Prospek"
                              >
                                <Layers className="w-4 h-4" />
                              </button>

                              {/* Konversi ke Database Pelanggan */}
                              <button
                                onClick={() => handleConvertToCustomer(lead)}
                                className="p-1.5 rounded-lg text-blue-700 bg-blue-50/70 hover:bg-blue-100 transition-colors border border-blue-200"
                                title="Konversi ke Database Pelanggan"
                              >
                                <UserCheck className="w-4 h-4" />
                              </button>

                              {/* Edit Data */}
                              <button
                                onClick={() => openEditModal(lead)}
                                className="p-1.5 rounded-lg text-charcoal-600 hover:text-charcoal-900 hover:bg-charcoal-100 transition-colors border border-transparent hover:border-charcoal-300"
                                title="Edit Data Calon Pembeli"
                              >
                                <Edit className="w-4 h-4" />
                              </button>

                              {/* Hapus Data */}
                              <button
                                onClick={() => setDeletingLead(lead)}
                                className="p-1.5 rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-50 transition-colors border border-transparent hover:border-rose-200"
                                title="Hapus Data Calon Pembeli"
                              >
                                <Trash2 className="w-4 h-4" />
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
        </div>
      ) : (
        /* ========================================================================= */
        /* VIEW 2: PAPAN KANBAN PIPELINE (3 KOLOM DRAG & DROP)                       */
        /* ========================================================================= */
        <div className="space-y-4">
          {/* Mobile Kanban Tab Selector (< 1024px) */}
          <div className="flex lg:hidden overflow-x-auto gap-2 p-1 bg-[#FAF9F5] rounded-xl border border-[#EAE8E3]">
            <button
              onClick={() => setMobileKanbanTab('ALL')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
                mobileKanbanTab === 'ALL'
                  ? 'bg-[#FDF8ED] text-gold-900 border-2 border-gold-400 font-bold shadow-xs'
                  : 'bg-white text-charcoal-600 border border-[#EAE8E3]'
              }`}
            >
              Semua Kolom ({filteredLeads.length})
            </button>
            {STAGES.map((stg) => (
              <button
                key={stg.id}
                onClick={() => setMobileKanbanTab(stg.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                  mobileKanbanTab === stg.id
                    ? 'bg-gold-500 text-charcoal-950 font-black shadow-xs'
                    : 'bg-white text-charcoal-600 border border-[#EAE8E3]'
                }`}
              >
                <span>{stg.title}</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-charcoal-100 text-charcoal-900">
                  {groupedLeads[stg.id].length}
                </span>
              </button>
            ))}
          </div>

          {/* 3-Column Kanban Board Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-start">
            {STAGES.map((stg) => {
              const leadsInStage = groupedLeads[stg.id];
              const isOver = dragOverStage === stg.id;
              const isMobileHidden = mobileKanbanTab !== 'ALL' && mobileKanbanTab !== stg.id;

              return (
                <div
                  key={stg.id}
                  onDragOver={(e) => handleDragOver(e, stg.id)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, stg.id)}
                  className={`${
                    isMobileHidden ? 'hidden lg:flex' : 'flex'
                  } flex-col rounded-2xl transition-all duration-200 ${
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
                        <h3 className="font-black text-sm text-charcoal-900 tracking-tight">{stg.title}</h3>
                      </div>
                      <span className={`text-xs font-black px-2.5 py-0.5 rounded-full border ${stg.badgeClass}`}>
                        {leadsInStage.length}
                      </span>
                    </div>
                    <p className="text-[11px] text-charcoal-500 leading-snug line-clamp-2">{stg.fullDesc}</p>
                  </div>

                  {/* Cards Container */}
                  <div className="p-3.5 space-y-3 min-h-[380px]">
                    {leadsInStage.length === 0 ? (
                      <div className="py-12 px-4 text-center border-2 border-dashed border-[#EAE8E3] rounded-xl bg-white/60">
                        <stg.icon className="w-8 h-8 mx-auto mb-2 text-charcoal-300 stroke-[1.5]" />
                        <p className="text-xs font-bold text-charcoal-600">Belum ada calon pembeli</p>
                        <p className="text-[10px] text-charcoal-400 mt-0.5">
                          Tarik kartu ke kolom ini atau klik tombol &quot;+ Tambah Calon Pembeli&quot;.
                        </p>
                      </div>
                    ) : (
                      leadsInStage.map((lead) => {
                        const cleanPhone = (lead.contactNumber || lead.customerPhone || '').replace(/\D/g, '');
                        const waMessage = `Sampurasun Bapak/Ibu ${lead.customerName}, salam dari HR MOTOR Garut mengenai unit ${
                          lead.interestedVehicle || 'yang Anda tanyakan'
                        }. Apakah ada informasi yang bisa kami bantu?`;
                        const waHref = cleanPhone ? formatWhatsAppLink(lead.contactNumber || lead.customerPhone, waMessage) : '#';

                        return (
                          <div
                            key={lead.id}
                            draggable
                            onDragStart={(e) => handleDragStart(e, lead.id)}
                            className="bg-white rounded-xl border border-[#EAE8E3] p-4 shadow-sm hover:shadow-md hover:border-gold-300 transition-all cursor-grab active:cursor-grabbing group space-y-3"
                          >
                            {/* Card Top: Name & ID */}
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

                              <span className="shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#FAF9F5] border border-[#EAE8E3] text-charcoal-700">
                                {lead.leadSource}
                              </span>
                            </div>

                            {/* WhatsApp Direct Action Bar */}
                            <div className="flex items-center justify-between gap-2 bg-[#FAF9F5] p-2 rounded-lg border border-[#EAE8E3]">
                              <div className="flex items-center gap-1.5 text-xs text-charcoal-700 min-w-0">
                                <Phone className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                <span className="font-semibold truncate">
                                  {lead.contactNumber || lead.customerPhone || '-'}
                                </span>
                              </div>

                              {cleanPhone ? (
                                <a
                                  href={waHref}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold bg-[#25D366] hover:bg-[#1fb355] text-white shadow-2xs transition-colors shrink-0"
                                  title="Chat WhatsApp langsung"
                                >
                                  <MessageCircle className="w-3.5 h-3.5" />
                                  <span>Chat WA</span>
                                </a>
                              ) : (
                                <span className="text-[10px] text-charcoal-400 font-mono">No WA -</span>
                              )}
                            </div>

                            {/* Unit Asked & Budget */}
                            <div className="grid grid-cols-2 gap-2 text-xs">
                              <div>
                                <span className="text-[10px] font-semibold text-charcoal-400 block mb-0.5">
                                  Mobil Diminati:
                                </span>
                                {lead.interestedVehicle && lead.interestedVehicle.trim() ? (
                                  <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-gold-50/70 border border-gold-200 text-gold-900 font-bold text-xs truncate max-w-full">
                                    <Car className="w-3 h-3 text-gold-600 shrink-0" />
                                    <span className="truncate">{lead.interestedVehicle}</span>
                                  </div>
                                ) : (
                                  <span className="text-charcoal-400 italic text-[11px]">Belum spesifik</span>
                                )}
                              </div>
                              <div>
                                <span className="text-[10px] font-semibold text-charcoal-400 block mb-0.5">
                                  Estimasi Budget:
                                </span>
                                <p className="font-black text-gold-600 text-xs">
                                  {formatRupiah(lead.estimatedBudget)}
                                </p>
                              </div>
                            </div>

                            {/* Contact Date */}
                            <div className="flex items-center gap-1.5 text-[11px] text-charcoal-500">
                              <Calendar className="w-3.5 h-3.5 text-charcoal-400 shrink-0" />
                              <span>
                                Kontak Terakhir:{' '}
                                <strong className="text-charcoal-800">
                                  {formatDate(lead.lastContactDate || lead.dateReceived)}
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
                                title="Ubah tahapan komunikasi calon pembeli"
                              >
                                <Layers className="w-3 h-3 text-gold-600" />
                                <span>Ubah Tahap</span>
                              </button>

                              <div className="flex items-center gap-1">
                                {/* Stage History */}
                                <button
                                  onClick={() => setHistoryLead(lead)}
                                  className="p-1.5 rounded-lg text-charcoal-500 hover:text-charcoal-900 hover:bg-[#F0EEEA] transition-colors"
                                  title="Riwayat Tahapan Komunikasi"
                                >
                                  <History className="w-3.5 h-3.5" />
                                </button>

                                {/* Edit Lead */}
                                <button
                                  onClick={() => openEditModal(lead)}
                                  className="p-1.5 rounded-lg text-charcoal-600 hover:text-charcoal-900 hover:bg-[#F0EEEA] transition-colors"
                                  title="Edit Data Calon Pembeli"
                                >
                                  <Edit className="w-3.5 h-3.5" />
                                </button>

                                {/* Delete Lead */}
                                <button
                                  onClick={() => setDeletingLead(lead)}
                                  className="p-1.5 rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-50 transition-colors"
                                  title="Hapus Data Calon Pembeli"
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
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. MODAL: + TAMBAH / EDIT CALON PEMBELI                                     */}
      {/* ========================================================================= */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-charcoal-950/40 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200">
          <div className="crm-card w-full max-w-xl my-auto max-h-[90vh] flex flex-col overflow-hidden shadow-luxury border-gold-500/30">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 sm:py-4 bg-[#FAF9F5] border-b border-[#EAE8E3] text-charcoal-900 shrink-0 relative">
              <div className="absolute top-0 left-0 right-0 h-[2.5px] bg-gradient-to-r from-gold-500 via-gold-400 to-gold-600" />
              <div>
                <span className="badge-gold text-[10px] mb-1 inline-block">
                  {editingLead ? 'Perbarui Calon Pembeli' : 'Registrasi Calon Pembeli Baru'}
                </span>
                <h2 className="text-base font-black text-charcoal-900 tracking-tight">
                  {editingLead ? `Edit Data: ${editingLead.customerName}` : '+ Tambah Calon Pembeli'}
                </h2>
                <p className="text-xs text-charcoal-500">
                  {editingLead ? `ID: ${editingLead.id}` : 'Input data calon pembeli mobil showroom HR MOTOR'}
                </p>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-charcoal-400 hover:text-charcoal-900 hover:bg-[#F0EDE6] transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form Error Banner */}
            {formError && (
              <div className="mx-4 sm:mx-6 mt-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-medium shrink-0 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            {/* Duplicate Warning Detector */}
            {duplicateWarning && (
              <div className="mx-4 sm:mx-6 mt-4 p-3 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 text-xs flex items-start gap-2.5 shrink-0">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">Potensi Duplikasi Data Calon Pembeli!</p>
                  <p className="mt-0.5 text-[11px] text-amber-800">
                    Konsumen <strong>{duplicateWarning.name}</strong> ({duplicateWarning.phone}) sudah ada di tahapan{' '}
                    <strong>{duplicateWarning.stage}</strong> ({duplicateWarning.id}).
                  </p>
                </div>
              </div>
            )}

            <form onSubmit={handleSaveLead} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
              {/* 1. Nama & Nomor WhatsApp */}
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
                    placeholder="Contoh: Pak H. Dadan / Ibu Maya"
                    className="w-full text-xs px-3.5 py-2.5 bg-[#F8F7F4] border border-[#EAE8E3] rounded-xl focus:outline-none focus:border-gold-500 focus:ring-2 focus:ring-gold-500/20 text-charcoal-900 font-medium"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-charcoal-800 mb-1">
                    Nomor WhatsApp <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-emerald-600 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="tel"
                      required
                      value={formData.contactNumber}
                      onChange={(e) => setFormData({ ...formData, contactNumber: e.target.value })}
                      placeholder="0812xxxxxxxx"
                      className="w-full text-xs pl-9 pr-3.5 py-2.5 bg-[#F8F7F4] border border-[#EAE8E3] rounded-xl focus:outline-none focus:border-gold-500 focus:ring-2 focus:ring-gold-500/20 text-charcoal-900 font-medium"
                    />
                  </div>
                </div>
              </div>

              {/* 2. Sumber & Tahap Pipeline */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-charcoal-800 mb-1">Sumber Calon Pembeli</label>
                  <select
                    value={formData.leadSource}
                    onChange={(e) => setFormData({ ...formData, leadSource: e.target.value as LeadSourceType })}
                    className="w-full text-xs px-3.5 py-2.5 bg-[#F8F7F4] border border-[#EAE8E3] rounded-xl focus:outline-none focus:border-gold-500 text-charcoal-900 font-semibold"
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
                  <label className="block text-xs font-bold text-charcoal-800 mb-1">
                    Tahapan Prospek <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as CorePipelineStage })}
                    className="w-full text-xs px-3.5 py-2.5 bg-[#F8F7F4] border border-[#EAE8E3] rounded-xl focus:outline-none focus:border-gold-500 text-charcoal-900 font-bold"
                  >
                    <option value="Hanya Menanyakan">💬 Hanya Menanyakan (Tanya unit/harga via WA)</option>
                    <option value="Negosiasi">🤝 Negosiasi (Tawar-menawar harga)</option>
                    <option value="Cek Unit">🚗 Cek Unit (Kunjungan fisik showroom)</option>
                  </select>
                </div>
              </div>

              {/* 3. Unit Diminati & Estimasi Budget */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-charcoal-800">Unit Diminati</label>
                    {readyStocks.length > 0 && (
                      <span className="text-[10px] text-emerald-600 font-semibold">
                        {readyStocks.length} unit ready showroom
                      </span>
                    )}
                  </div>
                  <input
                    type="text"
                    list="leads-ready-stocks"
                    value={formData.interestedVehicle}
                    onChange={(e) => {
                      const val = e.target.value;
                      const matched = readyStocks.find(
                        (s) => `${s.brand} ${s.model} ${s.year}`.toLowerCase().trim() === val.toLowerCase().trim()
                      );
                      if (matched) {
                        setFormData((prev) => ({
                          ...prev,
                          interestedVehicle: `${matched.brand} ${matched.model} ${matched.year}`,
                          estimatedBudget: String(matched.price || prev.estimatedBudget),
                          notes:
                            prev.notes ||
                            `Unit Ready Stok Showroom: ${matched.brand} ${matched.model} (${matched.licensePlate || matched.plateNumber || '-'})`,
                        }));
                      } else {
                        setFormData({ ...formData, interestedVehicle: val });
                      }
                    }}
                    placeholder="Pilih dari stok showroom atau ketik..."
                    className="w-full text-xs px-3.5 py-2.5 bg-[#F8F7F4] border border-[#EAE8E3] rounded-xl focus:outline-none focus:border-gold-500 text-charcoal-900 font-medium"
                  />
                  <datalist id="leads-ready-stocks">
                    {readyStocks.map((s) => (
                      <option key={s.id} value={`${s.brand} ${s.model} ${s.year}`}>
                        {s.licensePlate || s.plateNumber ? `[${s.licensePlate || s.plateNumber}] ` : ''}Rp{' '}
                        {s.price?.toLocaleString('id-ID')} • {s.color}
                      </option>
                    ))}
                  </datalist>
                </div>

                <div>
                  <label className="block text-xs font-bold text-charcoal-800 mb-1">Estimasi Budget (Rp)</label>
                  <input
                    type="number"
                    value={formData.estimatedBudget}
                    onChange={(e) => setFormData({ ...formData, estimatedBudget: e.target.value })}
                    placeholder="185000000"
                    className="w-full text-xs px-3.5 py-2.5 bg-[#F8F7F4] border border-[#EAE8E3] rounded-xl focus:outline-none focus:border-gold-500 text-charcoal-900 font-medium"
                  />
                  {formData.estimatedBudget && Number(formData.estimatedBudget) > 0 && (
                    <p className="text-[10px] text-gold-700 font-bold mt-1">
                      {formatRupiah(Number(formData.estimatedBudget))}
                    </p>
                  )}
                </div>
              </div>

              {/* 4. Sales PJ & Tanggal Kontak */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-charcoal-800 mb-1">Sales Penanggung Jawab</label>
                  <select
                    value={formData.assignedSalesId}
                    onChange={(e) => setFormData({ ...formData, assignedSalesId: e.target.value })}
                    className="w-full text-xs px-3.5 py-2.5 bg-[#F8F7F4] border border-[#EAE8E3] rounded-xl focus:outline-none focus:border-gold-500 text-charcoal-900 font-semibold"
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
                  <label className="block text-xs font-bold text-charcoal-800 mb-1">
                    Tanggal Kontak / Masuk <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.dateReceived}
                    onChange={(e) => setFormData({ ...formData, dateReceived: e.target.value })}
                    className="w-full text-xs px-3.5 py-2.5 bg-[#F8F7F4] border border-[#EAE8E3] rounded-xl focus:outline-none focus:border-gold-500 text-charcoal-900 font-medium"
                  />
                </div>
              </div>

              {/* 5. Catatan / Keterangan Tambahan */}
              <div>
                <label className="block text-xs font-bold text-charcoal-800 mb-1">Catatan / Keterangan Tambahan</label>
                <textarea
                  rows={3}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Catatan kebutuhan spesifikasi unit, penawaran harga, pertanyaan DP/angsuran, atau jadwal rencana kunjungan ke showroom..."
                  className="w-full text-xs px-3.5 py-2.5 bg-[#F8F7F4] border border-[#EAE8E3] rounded-xl focus:outline-none focus:border-gold-500 focus:ring-2 focus:ring-gold-500/20 text-charcoal-900 font-medium resize-none"
                />
              </div>

              {/* 6. Form Footer Actions */}
              <div className="flex flex-col-reverse sm:flex-row justify-end gap-2.5 sm:gap-3 pt-4 border-t border-[#EAE8E3]">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  disabled={submitting}
                  className="btn-outline-warm w-full sm:w-auto"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn-gold w-full sm:w-auto font-bold flex items-center justify-center gap-1.5 shadow-md"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>
                    {submitting ? 'Menyimpan...' : editingLead ? 'Simpan Perubahan' : 'Simpan Calon Pembeli'}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 6. MODAL: UBAH TAHAP PIPELINE                                              */}
      {/* ========================================================================= */}
      {stageChangeLead && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-charcoal-950/70 backdrop-blur-xs">
          <div className="bg-white rounded-2xl w-full max-w-md border border-[#EAE8E3] shadow-2xl p-5 space-y-4 animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between border-b border-[#EAE8E3] pb-3">
              <div>
                <span className="badge-gold text-[10px]">Perkembangan Interaksi</span>
                <h3 className="text-base font-black text-charcoal-900 mt-0.5">Ubah Tahapan Prospek</h3>
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
              <label className="block text-xs font-bold text-charcoal-800">Pilih Tahap Baru:</label>
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
                Catatan Perkembangan Interaksi (Opsional):
              </label>
              <textarea
                rows={2}
                value={stageChangeNotes}
                onChange={(e) => setStageChangeNotes(e.target.value)}
                placeholder="Misal: Konsumen menawar harga Rp 185 juta nett / Konsumen berencana datang cek fisik hari Sabtu..."
                className="w-full text-xs px-3 py-2 bg-[#F8F7F4] border border-[#EAE8E3] rounded-xl text-charcoal-900 focus:outline-none focus:border-gold-500 resize-none font-medium"
              />
            </div>

            {/* Action Buttons */}
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

      {/* ========================================================================= */}
      {/* 7. MODAL: KONFIRMASI HAPUS CALON PEMBELI                                   */}
      {/* ========================================================================= */}
      {deletingLead && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-charcoal-950/70 backdrop-blur-xs">
          <div className="bg-white rounded-2xl w-full max-w-sm border border-[#EAE8E3] shadow-2xl p-5 space-y-4 animate-in fade-in zoom-in duration-150">
            <div className="w-12 h-12 rounded-full bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>

            <div className="text-center">
              <h3 className="text-base font-black text-charcoal-900">Hapus Calon Pembeli?</h3>
              <p className="text-xs text-charcoal-600 mt-2 leading-relaxed">
                Apakah Anda yakin ingin menghapus data calon pembeli{' '}
                <strong className="text-charcoal-900">{deletingLead.customerName}</strong> (
                {deletingLead.contactNumber || '-'})?
              </p>
              <p className="text-[11px] text-rose-600 mt-1.5 bg-rose-50 p-2 rounded-lg border border-rose-200">
                Data akan dihapus permanen dari sistem CRM.
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

      {/* ========================================================================= */}
      {/* 8. MODAL: RIWAYAT PERJALANAN TAHAPAN (AUDIT TRAIL)                         */}
      {/* ========================================================================= */}
      {historyLead && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-charcoal-950/70 backdrop-blur-xs">
          <div className="bg-white rounded-2xl w-full max-w-lg border border-[#EAE8E3] shadow-2xl p-5 space-y-4 animate-in fade-in zoom-in duration-150 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-[#EAE8E3] pb-3 shrink-0">
              <div>
                <span className="badge-gold text-[10px]">Audit Trail Komunikasi</span>
                <h3 className="text-base font-black text-charcoal-900 mt-0.5">Riwayat Perjalanan Konsumen</h3>
                <p className="text-xs text-charcoal-500 font-semibold">
                  {historyLead.customerName} ({historyLead.contactNumber})
                </p>
              </div>
              <button
                onClick={() => setHistoryLead(null)}
                className="p-1.5 rounded-lg text-charcoal-400 hover:text-charcoal-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="overflow-y-auto space-y-4 pr-1 py-1 flex-1">
              {!historyLead.stageHistory || historyLead.stageHistory.length === 0 ? (
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
                            {normalizePipelineStage(item.stage)}
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
              <button onClick={() => setHistoryLead(null)} className="btn-outline-warm text-xs py-2 px-4">
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
