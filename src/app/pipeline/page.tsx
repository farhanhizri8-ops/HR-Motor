'use client';

import React, { useState } from 'react';
import {
  MessageCircle,
  Calendar,
  Clock,
  Car,
  CheckCircle,
  XCircle,
  User,
  X,
  History,
  Building2,
  DollarSign,
  GripVertical,
  HelpCircle,
  ArrowRight,
  TrendingUp,
  FileText,
  AlertTriangle,
} from 'lucide-react';
import { useCrm } from '@/context/CrmContext';
import { Lead, PipelineStage, LostReasonType } from '@/types/crm';

const MAIN_PIPELINE_STAGES: {
  stage: PipelineStage;
  label: string;
  stepNumber: number;
  description: string;
  color: string;
  badgeBg: string;
  columnBg: string;
  border: string;
}[] = [
  {
    stage: 'Menanyakan Unit',
    label: 'Menanyakan Unit',
    stepNumber: 1,
    description: 'Konsumen mulai bertanya mengenai unit mobil, harga, ketersediaan, atau spesifikasi.',
    color: 'text-blue-700',
    badgeBg: 'bg-blue-100 text-blue-800',
    columnBg: 'bg-blue-50/60',
    border: 'border-blue-200',
  },
  {
    stage: 'Tertarik',
    label: 'Tertarik',
    stepNumber: 2,
    description: 'Konsumen menunjukkan minat untuk membeli unit yang ditawarkan.',
    color: 'text-indigo-700',
    badgeBg: 'bg-indigo-100 text-indigo-800',
    columnBg: 'bg-indigo-50/60',
    border: 'border-indigo-200',
  },
  {
    stage: 'Cek Unit',
    label: 'Cek Unit',
    stepNumber: 3,
    description: 'Konsumen datang langsung ke showroom untuk melihat dan memeriksa kondisi mobil.',
    color: 'text-purple-700',
    badgeBg: 'bg-purple-100 text-purple-800',
    columnBg: 'bg-purple-50/60',
    border: 'border-purple-200',
  },
  {
    stage: 'Negosiasi',
    label: 'Negosiasi',
    stepNumber: 4,
    description: 'Konsumen melakukan tawar-menawar harga dengan pihak sales.',
    color: 'text-amber-700',
    badgeBg: 'bg-amber-100 text-amber-800',
    columnBg: 'bg-amber-50/60',
    border: 'border-amber-200',
  },
  {
    stage: 'Deal',
    label: 'Deal (Berhasil)',
    stepNumber: 5,
    description: 'Konsumen menyetujui pembelian dan transaksi berhasil.',
    color: 'text-emerald-700',
    badgeBg: 'bg-emerald-100 text-emerald-800',
    columnBg: 'bg-emerald-50/60',
    border: 'border-emerald-200',
  },
];

const LOST_REASONS: LostReasonType[] = [
  'Harga tidak cocok',
  'Memilih unit lain',
  'Tidak jadi membeli',
  'Tidak mencapai kesepakatan',
  'Tidak dapat dihubungi',
  'Alasan lainnya',
];

export default function SalesPipelinePage() {
  const {
    leads,
    updateLeadStage,
    currentUser,
    formatRupiah,
    formatDate,
    formatWhatsAppLink,
  } = useCrm();

  // Active Lead for Stage Transition Modal
  const [activeLead, setActiveLead] = useState<Lead | null>(null);
  const [targetStage, setTargetStage] = useState<PipelineStage | null>(null);
  const [modalType, setModalType] = useState<'cek_unit' | 'negosiasi' | 'deal' | 'lost' | null>(null);

  // Customer Journey Modal
  const [journeyLead, setJourneyLead] = useState<Lead | null>(null);

  // Drag and Drop state
  const [draggedLeadId, setDraggedLeadId] = useState<string | null>(null);
  const [dragOverCol, setDragOverCol] = useState<PipelineStage | null>(null);

  // Form states for stage transitions
  // 1. Cek Unit form
  const [visitNotes, setVisitNotes] = useState('');
  const [visitDate, setVisitDate] = useState(new Date().toISOString().split('T')[0]);

  // 2. Negosiasi form
  const [negotiationOffer, setNegotiationOffer] = useState('');
  const [negotiationNotes, setNegotiationNotes] = useState('');

  // 3. Deal form
  const [dealDate, setDealDate] = useState(new Date().toISOString().split('T')[0]);
  const [dealPrice, setDealPrice] = useState('');
  const [dealPaymentMethod, setDealPaymentMethod] = useState('Cash Keras');
  const [dealPlateNumber, setDealPlateNumber] = useState('');
  const [dealNotes, setDealNotes] = useState('');

  // 4. Lost form
  const [lostReasonCategory, setLostReasonCategory] = useState<LostReasonType>('Harga tidak cocok');
  const [lostCustomReason, setLostCustomReason] = useState('');
  const [lostNotes, setLostNotes] = useState('');

  // Calculate Lead Age (days since received)
  const getLeadAge = (dateStr: string) => {
    try {
      const received = new Date(dateStr).getTime();
      const now = new Date().getTime();
      const diffDays = Math.floor((now - received) / (1000 * 60 * 60 * 24));
      if (diffDays <= 0) return 'Hari ini';
      return `${diffDays} hari lalu`;
    } catch {
      return '-';
    }
  };

  // Open Stage Transition Modal
  const handleOpenStageTransition = (lead: Lead, stage: PipelineStage) => {
    if (lead.status === stage) return;

    setActiveLead(lead);
    setTargetStage(stage);

    if (stage === 'Cek Unit') {
      setVisitNotes(lead.visitNotes || '');
      setVisitDate(new Date().toISOString().split('T')[0]);
      setModalType('cek_unit');
    } else if (stage === 'Negosiasi') {
      setNegotiationOffer(lead.negotiationOffer ? String(lead.negotiationOffer) : String(lead.estimatedBudget || ''));
      setNegotiationNotes(lead.negotiationNotes || lead.notes || '');
      setModalType('negosiasi');
    } else if (stage === 'Deal') {
      setDealDate(new Date().toISOString().split('T')[0]);
      setDealPrice(String(lead.dealValue || lead.estimatedBudget || ''));
      setDealPaymentMethod('Cash Keras');
      setDealPlateNumber('Z ' + Math.floor(1000 + Math.random() * 8999) + ' HR');
      setDealNotes('Penyerahan unit sukses di showroom HR MOTOR Garut.');
      setModalType('deal');
    } else if (stage === 'Lost') {
      setLostReasonCategory('Harga tidak cocok');
      setLostCustomReason('');
      setLostNotes('');
      setModalType('lost');
    } else {
      // Direct move for 'Menanyakan Unit' or 'Tertarik'
      confirmDirectTransition(lead, stage);
    }
  };

  const confirmDirectTransition = async (lead: Lead, stage: PipelineStage) => {
    const res = await updateLeadStage(lead.id, stage, {
      notes: `Dipindahkan ke tahapan ${stage} oleh ${currentUser.name}`,
    });
    if (!res.success) {
      alert(res.error || 'Gagal mengubah status');
    }
  };

  const handleConfirmModal = async () => {
    if (!activeLead || !targetStage) return;

    const extras: Record<string, any> = {};

    if (targetStage === 'Cek Unit') {
      if (!visitNotes.trim()) {
        alert('Mohon masukkan catatan hasil kunjungan konsumen untuk memeriksa mobil.');
        return;
      }
      extras.visitNotes = visitNotes;
      extras.visitDate = visitDate;
      extras.notes = visitNotes;
    } else if (targetStage === 'Negosiasi') {
      extras.negotiationOffer = Number(negotiationOffer) || activeLead.estimatedBudget;
      extras.negotiationNotes = negotiationNotes;
      extras.notes = negotiationNotes;
    } else if (targetStage === 'Deal') {
      extras.dealDate = dealDate;
      extras.dealValue = Number(dealPrice) || activeLead.estimatedBudget;
      extras.paymentMethod = dealPaymentMethod;
      extras.plateNumber = dealPlateNumber;
      extras.notes = dealNotes || 'Transaksi pembelian berhasil disepakati.';
    } else if (targetStage === 'Lost') {
      if (lostReasonCategory === 'Alasan lainnya' && !lostCustomReason.trim()) {
        alert('Mohon tuliskan keterangan alasan lainnya secara jelas.');
        return;
      }
      const fullLostReason =
        lostReasonCategory === 'Alasan lainnya'
          ? `Alasan lainnya: ${lostCustomReason.trim()}`
          : `${lostReasonCategory}${lostNotes ? ` (${lostNotes.trim()})` : ''}`;

      extras.lostReasonCategory = lostReasonCategory;
      extras.lostReason = fullLostReason;
      extras.notes = fullLostReason;
    }

    const res = await updateLeadStage(activeLead.id, targetStage, extras);
    if (res.success) {
      setModalType(null);
      setActiveLead(null);
      setTargetStage(null);
    } else {
      alert(res.error || 'Gagal memperbarui status pipeline');
    }
  };

  // Drag and Drop Handlers
  const handleDragStart = (e: React.DragEvent, leadId: string) => {
    e.dataTransfer.setData('text/plain', leadId);
    setDraggedLeadId(leadId);
  };

  const handleDragOver = (e: React.DragEvent, stage: PipelineStage) => {
    e.preventDefault();
    setDragOverCol(stage);
  };

  const handleDragLeave = () => {
    setDragOverCol(null);
  };

  const handleDrop = (e: React.DragEvent, stage: PipelineStage) => {
    e.preventDefault();
    setDragOverCol(null);
    const leadId = e.dataTransfer.getData('text/plain') || draggedLeadId;
    if (!leadId) return;

    const lead = leads.find((l) => l.id === leadId);
    if (lead && lead.status !== stage) {
      handleOpenStageTransition(lead, stage);
    }
    setDraggedLeadId(null);
  };

  // Lost Leads List
  const lostLeads = leads.filter((l) => l.status === 'Lost');
  const activeLeadsCount = leads.filter((l) => l.status !== 'Deal' && l.status !== 'Lost').length;
  const dealLeadsCount = leads.filter((l) => l.status === 'Deal').length;
  const resolvedCount = dealLeadsCount + lostLeads.length;
  const conversionRate = resolvedCount > 0 ? Math.round((dealLeadsCount / resolvedCount) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
              Alur Showroom Mobil Bekas HR MOTOR
            </span>
            <span className="text-xs text-slate-400">•</span>
            <span className="text-xs text-slate-500">Cabang Garut</span>
          </div>
          <h1 className="text-xl lg:text-2xl font-black text-slate-900 mt-1">
            Sales Pipeline Showroom (Pipa Penjualan)
          </h1>
          <p className="text-xs text-slate-500">
            5 Tahapan Utama: <strong>Menanyakan Unit</strong> $\to$ <strong>Tertarik</strong> $\to$ <strong>Cek Unit</strong> $\to$ <strong>Negosiasi</strong> $\to$ <strong>Deal</strong>, serta status khusus <strong>Lost (Batal)</strong>.
          </p>
        </div>

        {/* Pipeline Summary Metrics Banner */}
        <div className="flex flex-wrap items-center gap-2 bg-slate-50 p-2 rounded-xl border border-slate-200 text-xs">
          <div className="px-3 py-1 bg-white rounded-lg border border-slate-200">
            <span className="text-[10px] text-slate-500 block">Total Prospek</span>
            <span className="font-black text-slate-900 text-sm">{leads.length}</span>
          </div>
          <div className="px-3 py-1 bg-white rounded-lg border border-slate-200">
            <span className="text-[10px] text-blue-600 block">Prospek Aktif</span>
            <span className="font-black text-blue-700 text-sm">{activeLeadsCount}</span>
          </div>
          <div className="px-3 py-1 bg-white rounded-lg border border-slate-200">
            <span className="text-[10px] text-emerald-600 block">Deal (Won)</span>
            <span className="font-black text-emerald-700 text-sm">{dealLeadsCount}</span>
          </div>
          <div className="px-3 py-1 bg-white rounded-lg border border-slate-200">
            <span className="text-[10px] text-rose-600 block">Lost (Batal)</span>
            <span className="font-black text-rose-700 text-sm">{lostLeads.length}</span>
          </div>
          <div className="px-3 py-1 bg-emerald-50 rounded-lg border border-emerald-200">
            <span className="text-[10px] text-emerald-800 block">Konversi Akhir</span>
            <span className="font-black text-emerald-800 text-sm">{conversionRate}%</span>
          </div>
        </div>
      </div>

      {/* DRAG & DROP INSTRUCTION NOTICE */}
      <div className="flex items-center justify-between text-xs text-slate-600 bg-slate-100/90 px-4 py-2.5 rounded-xl border border-slate-200">
        <div className="flex items-center gap-2">
          <GripVertical className="w-4 h-4 text-slate-500" />
          <span>
            <strong>Fitur Drag and Drop Aktif:</strong> Tarik dan lepaskan kartu prospek ke kolom tahapan baru, atau gunakan tombol pindah tahapan pada kartu.
          </span>
        </div>
        <span className="hidden md:inline-block text-[11px] text-slate-400">
          Setiap perpindahan tahapan mencatat riwayat perjalanan konsumen
        </span>
      </div>

      {/* KANBAN BOARD CONTAINER (5 MAIN SHOWROOM STAGES) */}
      <div className="flex gap-4 overflow-x-auto pb-4 items-start">
        {MAIN_PIPELINE_STAGES.map((col) => {
          const colLeads = leads.filter((l) => l.status === col.stage);
          const totalValue = colLeads.reduce((acc, curr) => acc + (curr.estimatedBudget || 0), 0);
          const isOver = dragOverCol === col.stage;

          return (
            <div
              key={col.stage}
              onDragOver={(e) => handleDragOver(e, col.stage)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, col.stage)}
              className={`w-72 shrink-0 rounded-2xl border transition-all duration-150 ${col.border} ${
                isOver ? 'bg-emerald-100/60 ring-2 ring-emerald-500 scale-[1.01]' : col.columnBg
              } p-3 flex flex-col shadow-xs`}
            >
              {/* Column Header */}
              <div className="flex items-start justify-between pb-2 mb-2 border-b border-slate-200/80">
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-4 h-4 rounded-full bg-slate-900 text-white font-bold text-[10px] flex items-center justify-center">
                      {col.stepNumber}
                    </span>
                    <h2 className={`text-xs font-black ${col.color}`}>{col.label}</h2>
                  </div>
                  <p className="text-[10px] text-slate-500 mt-0.5 line-clamp-1" title={col.description}>
                    {col.description}
                  </p>
                  <span className="text-[10px] font-semibold text-slate-600 block mt-1">
                    Nilai: {formatRupiah(totalValue)}
                  </span>
                </div>
                <span className="w-6 h-6 rounded-full bg-white text-slate-800 font-bold text-xs flex items-center justify-center shadow-xs border border-slate-200 shrink-0">
                  {colLeads.length}
                </span>
              </div>

              {/* Cards Container */}
              <div className="space-y-3 min-h-[460px]">
                {colLeads.length === 0 ? (
                  <div className="h-36 flex flex-col items-center justify-center text-center p-3 text-[11px] text-slate-400 border border-dashed border-slate-300 rounded-xl bg-white/50">
                    <Car className="w-6 h-6 text-slate-300 mb-1" />
                    Belum ada calon pembeli pada tahapan ini
                  </div>
                ) : (
                  colLeads.map((lead) => {
                    return (
                      <div
                        key={lead.id}
                        draggable={true}
                        onDragStart={(e) => handleDragStart(e, lead.id)}
                        className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs hover:shadow-md transition-all space-y-2.5 relative group cursor-grab active:cursor-grabbing"
                      >
                        {/* Drag Handle & Lead ID */}
                        <div className="flex items-center justify-between text-[10px] text-slate-400">
                          <span className="font-mono font-bold">{lead.id}</span>
                          <span className="flex items-center gap-1 text-[10px] text-slate-400">
                            <Clock className="w-3 h-3" /> {getLeadAge(lead.dateReceived)}
                          </span>
                        </div>

                        {/* Customer Name & Phone */}
                        <div>
                          <div className="flex items-start justify-between gap-1">
                            <h3 className="text-xs font-bold text-slate-900 leading-tight">
                              {lead.customerName}
                            </h3>
                            <a
                              href={formatWhatsAppLink(
                                lead.contactNumber,
                                `Sampurasun Bapak/Ibu ${lead.customerName}, salam dari HR MOTOR Garut mengenai unit ${lead.interestedVehicle}.`
                              )}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1 rounded-md bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-colors shrink-0"
                              title="Chat WhatsApp Sekarang"
                            >
                              <MessageCircle className="w-3.5 h-3.5" />
                            </a>
                          </div>
                          <span className="text-[11px] text-slate-500 font-medium block">
                            {lead.contactNumber}
                          </span>
                        </div>

                        {/* Interested Vehicle & Budget */}
                        <div className="bg-slate-50 p-2 rounded-lg border border-slate-100 text-xs">
                          <div className="flex items-center gap-1.5 font-bold text-slate-800">
                            <Car className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                            <span className="truncate">{lead.interestedVehicle}</span>
                          </div>
                          <div className="text-[11px] font-black text-emerald-700 mt-1">
                            Budget: {formatRupiah(lead.dealValue || lead.estimatedBudget)}
                          </div>
                        </div>

                        {/* Stage Specific Badges / Data */}
                        {lead.status === 'Cek Unit' && lead.visitNotes && (
                          <div className="text-[10px] p-2 rounded-lg bg-purple-50 text-purple-900 border border-purple-200">
                            <span className="font-bold block text-purple-800">Hasil Cek Unit:</span>
                            <p className="line-clamp-2 mt-0.5">{lead.visitNotes}</p>
                          </div>
                        )}

                        {lead.status === 'Negosiasi' && lead.negotiationOffer && (
                          <div className="text-[10px] p-2 rounded-lg bg-amber-50 text-amber-900 border border-amber-200">
                            <span className="font-bold block text-amber-800">
                              Tawaran: {formatRupiah(lead.negotiationOffer)}
                            </span>
                            {lead.negotiationNotes && (
                              <p className="line-clamp-2 mt-0.5">{lead.negotiationNotes}</p>
                            )}
                          </div>
                        )}

                        {lead.status === 'Deal' && lead.dealDate && (
                          <div className="text-[10px] p-2 rounded-lg bg-emerald-50 text-emerald-900 border border-emerald-200">
                            <span className="font-bold block text-emerald-800">
                              Deal Tanggal: {formatDate(lead.dealDate)}
                            </span>
                            <span className="text-[10px] text-emerald-700">
                              Nilai: {formatRupiah(lead.dealValue || lead.estimatedBudget)}
                            </span>
                          </div>
                        )}

                        {/* Sales PJ & History Link */}
                        <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1.5 border-t border-slate-100">
                          <span className="font-medium text-slate-700 flex items-center gap-1">
                            <User className="w-3 h-3 text-slate-400" />
                            {lead.assignedSalesName ? lead.assignedSalesName.split(' ')[0] : 'Asep'}
                          </span>

                          <button
                            type="button"
                            onClick={() => setJourneyLead(lead)}
                            className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 hover:underline flex items-center gap-1"
                            title="Lihat Riwayat Perjalanan Konsumen"
                          >
                            <History className="w-3 h-3" />
                            Riwayat
                          </button>
                        </div>

                        {/* Quick Stage Move Dropdown / Buttons */}
                        <div className="pt-1 flex items-center gap-1">
                          <select
                            value={lead.status}
                            onChange={(e) => handleOpenStageTransition(lead, e.target.value as PipelineStage)}
                            className="w-full text-[10px] font-semibold py-1 px-1.5 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded text-slate-700 outline-none transition-colors"
                          >
                            <option value={lead.status} disabled>
                              Pindah ke tahapan...
                            </option>
                            {MAIN_PIPELINE_STAGES.map((s) => (
                              <option key={s.stage} value={s.stage} disabled={s.stage === lead.status}>
                                &rarr; {s.label}
                              </option>
                            ))}
                            <option value="Lost">&rarr; Lost / Tidak Jadi</option>
                          </select>

                          {/* Quick Lost Button */}
                          <button
                            type="button"
                            onClick={() => handleOpenStageTransition(lead, 'Lost')}
                            className="p-1 rounded text-rose-500 hover:text-rose-700 hover:bg-rose-50 transition-colors"
                            title="Tandai Batal (Lost)"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
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

      {/* SPECIAL SECTION: STATUS LOST / TIDAK JADI */}
      <div className="bg-white rounded-2xl border border-rose-200 shadow-xs p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-rose-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center font-bold">
              <XCircle className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-rose-900">
                Status Khusus: Lost / Tidak Jadi ({lostLeads.length} Konsumen)
              </h2>
              <p className="text-xs text-slate-500">
                Daftar calon pembeli yang batal melanjutkan transaksi beserta dokumentasi alasan kegagalan
              </p>
            </div>
          </div>
          <span className="text-xs text-slate-500">
            Tidak dihitung sebagai prospek aktif • Digunakan untuk analisis konversi showroom
          </span>
        </div>

        {lostLeads.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-400">
            Tidak ada prospek dengan status Lost.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {lostLeads.map((lost) => (
              <div
                key={lost.id}
                className="p-3.5 rounded-xl border border-rose-200 bg-rose-50/30 space-y-2 text-xs"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] text-slate-400 font-mono font-bold block">{lost.id}</span>
                    <h3 className="font-bold text-slate-900">{lost.customerName}</h3>
                    <p className="text-[11px] text-slate-500">{lost.contactNumber}</p>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800">
                    Lost
                  </span>
                </div>

                <div className="bg-white p-2 rounded-lg border border-rose-100 text-[11px]">
                  <span className="font-semibold text-slate-700 block">Unit: {lost.interestedVehicle}</span>
                  <span className="text-rose-700 font-bold block mt-1">
                    Alasan: {lost.lostReason || lost.lostReasonCategory || 'Tidak disebutkan'}
                  </span>
                </div>

                <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-rose-100">
                  <span>Sales: {lost.assignedSalesName || 'Asep Kurniawan'}</span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setJourneyLead(lost)}
                      className="text-indigo-600 font-bold hover:underline flex items-center gap-0.5"
                    >
                      <History className="w-3 h-3" /> Riwayat
                    </button>
                    <button
                      type="button"
                      onClick={() => handleOpenStageTransition(lost, 'Menanyakan Unit')}
                      className="text-emerald-700 font-bold hover:underline"
                      title="Aktifkan kembali ke tahapan awal"
                    >
                      Aktifkan Lagi &rarr;
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* MODAL 1: CEK UNIT (Hasil Kunjungan Showroom) */}
      {modalType === 'cek_unit' && activeLead && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-purple-50/60">
              <div>
                <h3 className="text-sm font-bold text-purple-900">
                  Tahap 3: Cek Unit di Showroom
                </h3>
                <p className="text-xs text-slate-500">
                  {activeLead.customerName} • {activeLead.interestedVehicle}
                </p>
              </div>
              <button
                onClick={() => setModalType(null)}
                className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Tanggal Kunjungan Showroom</label>
                <input
                  type="date"
                  value={visitDate}
                  onChange={(e) => setVisitDate(e.target.value)}
                  className="w-full text-xs p-2 border border-slate-300 rounded-lg outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Catatan Hasil Kunjungan Konsumen <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={4}
                  required
                  value={visitNotes}
                  onChange={(e) => setVisitNotes(e.target.value)}
                  placeholder="Misal: Konsumen datang ke showroom Jl. Otista bersama keluarga, mengecek kondisi bodi, interior mulus, dan mencoba suara mesin. Respon sangat positif..."
                  className="w-full text-xs p-2.5 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-purple-500/20"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  Dokumentasi pemeriksaan kondisi mobil oleh konsumen di showroom HR MOTOR.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 px-5 py-3 border-t border-slate-100 bg-slate-50">
              <button
                type="button"
                onClick={() => setModalType(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-lg"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmModal}
                className="px-4 py-2 text-xs font-bold text-white bg-purple-700 hover:bg-purple-800 rounded-lg shadow-sm shadow-purple-700/30"
              >
                Simpan & Pindahkan ke Cek Unit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: NEGOSIASI (Harga Penawaran & Hasil Tawar-Menawar) */}
      {modalType === 'negosiasi' && activeLead && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-amber-50/60">
              <div>
                <h3 className="text-sm font-bold text-amber-900">
                  Tahap 4: Negosiasi Harga Showroom
                </h3>
                <p className="text-xs text-slate-500">
                  {activeLead.customerName} • {activeLead.interestedVehicle}
                </p>
              </div>
              <button
                onClick={() => setModalType(null)}
                className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Harga Penawaran Konsumen (Rp) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  required
                  value={negotiationOffer}
                  onChange={(e) => setNegotiationOffer(e.target.value)}
                  placeholder="Contoh: 165000000"
                  className="w-full text-xs p-2.5 border border-slate-300 rounded-lg outline-none font-bold text-slate-900"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Catatan & Hasil Negosiasi Sales
                </label>
                <textarea
                  rows={3}
                  value={negotiationNotes}
                  onChange={(e) => setNegotiationNotes(e.target.value)}
                  placeholder="Misal: Konsumen menawar Rp 165 juta nett, sales menyetujui dengan bonus kaca film baru dan ganti oli sebelum penyerahan unit..."
                  className="w-full text-xs p-2.5 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-amber-500/20"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 px-5 py-3 border-t border-slate-100 bg-slate-50">
              <button
                type="button"
                onClick={() => setModalType(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-lg"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmModal}
                className="px-4 py-2 text-xs font-bold text-white bg-amber-700 hover:bg-amber-800 rounded-lg shadow-sm shadow-amber-700/30"
              >
                Simpan & Masuk Tahap Negosiasi
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: DEAL (Transaksi Pembelian Berhasil) */}
      {modalType === 'deal' && activeLead && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-emerald-50">
              <div>
                <h3 className="text-sm font-bold text-emerald-950">
                  Tahap 5: Deal Pembelian Mobil Berhasil!
                </h3>
                <p className="text-xs text-emerald-800">
                  {activeLead.customerName} • {activeLead.interestedVehicle}
                </p>
              </div>
              <button
                onClick={() => setModalType(null)}
                className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-emerald-800">
                <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
                <span>
                  Transaksi ini dihitung sebagai <strong>Deal Berhasil</strong> dan otomatis masuk ke modul After Sales untuk pemantauan garansi 1 tahun.
                </span>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Tanggal Transaksi Berhasil <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={dealDate}
                  onChange={(e) => setDealDate(e.target.value)}
                  className="w-full text-xs p-2 border border-slate-300 rounded-lg outline-none font-bold"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Harga Deal Final (Rp) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  required
                  value={dealPrice}
                  onChange={(e) => setDealPrice(e.target.value)}
                  className="w-full text-xs p-2 border border-slate-300 rounded-lg outline-none font-black text-emerald-700"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Metode Pembayaran</label>
                  <select
                    value={dealPaymentMethod}
                    onChange={(e) => setDealPaymentMethod(e.target.value)}
                    className="w-full text-xs p-2 border border-slate-300 rounded-lg outline-none"
                  >
                    <option value="Cash Keras">Cash Keras</option>
                    <option value="Cash Bertahap">Cash Bertahap</option>
                    <option value="Kredit BCA Finance">Kredit BCA Finance</option>
                    <option value="Kredit Mandiri Utama">Kredit Mandiri Utama</option>
                    <option value="Kredit Adira Finance">Kredit Adira Finance</option>
                    <option value="Kredit OTO Multiartha">Kredit OTO Multiartha</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Nomor Polisi (Plat Z)</label>
                  <input
                    type="text"
                    value={dealPlateNumber}
                    onChange={(e) => setDealPlateNumber(e.target.value)}
                    className="w-full text-xs p-2 border border-slate-300 rounded-lg outline-none font-bold uppercase"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 px-5 py-3 border-t border-slate-100 bg-slate-50">
              <button
                type="button"
                onClick={() => setModalType(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-lg"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmModal}
                className="px-4 py-2 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg shadow-sm shadow-emerald-700/30"
              >
                Konfirmasi Deal Sukses
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: LOST / TIDAK JADI */}
      {modalType === 'lost' && activeLead && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-rose-50">
              <div>
                <h3 className="text-sm font-bold text-rose-900">
                  Tandai Status: Lost / Tidak Jadi
                </h3>
                <p className="text-xs text-slate-500">
                  {activeLead.customerName} • {activeLead.interestedVehicle}
                </p>
              </div>
              <button
                onClick={() => setModalType(null)}
                className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-[11px] leading-relaxed">
                <strong>Catatan Wajib:</strong> Anda wajib memilih alasan mengapa konsumen batal membeli unit di HR MOTOR Garut untuk evaluasi performa CRM.
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Pilihan Alasan Lost <span className="text-rose-500">*</span>
                </label>
                <select
                  value={lostReasonCategory}
                  onChange={(e) => setLostReasonCategory(e.target.value as LostReasonType)}
                  className="w-full text-xs p-2.5 border border-slate-300 rounded-lg outline-none font-bold text-slate-800"
                >
                  {LOST_REASONS.map((reason) => (
                    <option key={reason} value={reason}>
                      {reason}
                    </option>
                  ))}
                </select>
              </div>

              {/* Text input if 'Alasan lainnya' selected */}
              {lostReasonCategory === 'Alasan lainnya' && (
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Keterangan Alasan Lainnya <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={lostCustomReason}
                    onChange={(e) => setLostCustomReason(e.target.value)}
                    placeholder="Tuliskan alasan spesifik konsumen tidak jadi membeli..."
                    className="w-full text-xs p-2.5 border border-rose-300 rounded-lg outline-none focus:ring-2 focus:ring-rose-500/20"
                  />
                </div>
              )}

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Catatan Tambahan (Opsional)</label>
                <textarea
                  rows={2}
                  value={lostNotes}
                  onChange={(e) => setLostNotes(e.target.value)}
                  placeholder="Keterangan komunikasi terakhir atau respon konsumen..."
                  className="w-full text-xs p-2 border border-slate-300 rounded-lg outline-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 px-5 py-3 border-t border-slate-100 bg-slate-50">
              <button
                type="button"
                onClick={() => setModalType(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-lg"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmModal}
                className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-sm shadow-rose-600/30"
              >
                Simpan Status Lost
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 5: CUSTOMER JOURNEY TIMELINE (Riwayat Perjalanan Konsumen) */}
      {journeyLead && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-xl max-h-[85vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                  <History className="w-4 h-4 text-emerald-600" />
                  Riwayat Perjalanan Konsumen (Customer Journey)
                </h3>
                <p className="text-xs text-slate-500">
                  {journeyLead.customerName} ({journeyLead.contactNumber}) • {journeyLead.interestedVehicle}
                </p>
              </div>
              <button
                onClick={() => setJourneyLead(null)}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/60"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4">
              {/* Profile summary card */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs grid grid-cols-2 gap-2">
                <div>
                  <span className="text-slate-400 block text-[10px]">Status Terkini:</span>
                  <span className="font-bold text-slate-900">{journeyLead.status}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Budget Konsumen:</span>
                  <span className="font-bold text-emerald-700">
                    {formatRupiah(journeyLead.dealValue || journeyLead.estimatedBudget)}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Sumber Prospek:</span>
                  <span className="font-medium text-slate-700">{journeyLead.leadSource}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Sales Penanggung Jawab:</span>
                  <span className="font-medium text-slate-700">{journeyLead.assignedSalesName || 'Asep Kurniawan'}</span>
                </div>
              </div>

              {/* Timeline nodes */}
              <div>
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">
                  Kronologi Tahapan dari Awal hingga Akhir:
                </h4>

                {(!journeyLead.stageHistory || journeyLead.stageHistory.length === 0) ? (
                  <div className="p-4 text-center text-xs text-slate-400 bg-slate-50 rounded-xl">
                    Belum ada riwayat tercatat.
                  </div>
                ) : (
                  <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                    {journeyLead.stageHistory.map((item, idx) => {
                      const isDeal = item.stage === 'Deal';
                      const isLost = item.stage === 'Lost';

                      return (
                        <div key={idx} className="relative">
                          {/* Dot indicator */}
                          <div
                            className={`absolute -left-6 top-1 w-4 h-4 rounded-full border-2 border-white shadow-xs ${
                              isDeal
                                ? 'bg-emerald-600'
                                : isLost
                                ? 'bg-rose-600'
                                : 'bg-slate-900'
                            }`}
                          />

                          <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs space-y-1.5 text-xs">
                            <div className="flex items-center justify-between">
                              <span
                                className={`font-black px-2 py-0.5 rounded-full text-[10px] ${
                                  isDeal
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : isLost
                                    ? 'bg-rose-100 text-rose-800'
                                    : 'bg-slate-100 text-slate-800'
                                }`}
                              >
                                {item.stage}
                              </span>
                              <span className="text-[10px] text-slate-400 font-mono">
                                {formatDate(item.timestamp, true)}
                              </span>
                            </div>

                            {/* Specific content per stage */}
                            {item.visitNotes && (
                              <div className="p-2 rounded bg-purple-50 text-purple-900 text-[11px]">
                                <strong>Hasil Kunjungan Showroom:</strong> {item.visitNotes}
                              </div>
                            )}

                            {item.negotiationOffer && (
                              <div className="p-2 rounded bg-amber-50 text-amber-900 text-[11px]">
                                <strong>Tawaran Harga:</strong> {formatRupiah(item.negotiationOffer)}
                                {item.negotiationNotes && (
                                  <p className="mt-0.5">{item.negotiationNotes}</p>
                                )}
                              </div>
                            )}

                            {item.dealDate && (
                              <div className="p-2 rounded bg-emerald-50 text-emerald-900 text-[11px]">
                                <strong>Transaksi Berhasil:</strong> Deal ditutup pada {formatDate(item.dealDate)}
                              </div>
                            )}

                            {item.lostReason && (
                              <div className="p-2 rounded bg-rose-50 text-rose-900 text-[11px]">
                                <strong>Alasan Batal (Lost):</strong> {item.lostReason}
                              </div>
                            )}

                            {item.notes && !item.visitNotes && !item.negotiationNotes && !item.lostReason && (
                              <p className="text-slate-600 text-[11px] italic">
                                &ldquo;{item.notes}&rdquo;
                              </p>
                            )}

                            <span className="text-[10px] text-slate-400 block pt-1 border-t border-slate-100">
                              Diperbarui oleh: <strong>{item.updatedByName || 'Staf Sales HR MOTOR'}</strong>
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center justify-end px-6 py-3 border-t border-slate-100 bg-slate-50">
              <button
                type="button"
                onClick={() => setJourneyLead(null)}
                className="px-4 py-2 text-xs font-bold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl"
              >
                Tutup Riwayat
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
