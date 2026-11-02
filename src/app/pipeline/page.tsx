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
}[] = [
  {
    stage: 'Menanyakan Unit',
    label: 'Menanyakan Unit',
    stepNumber: 1,
    description: 'Konsumen mulai bertanya mengenai unit mobil, harga, ketersediaan, atau spesifikasi.',
  },
  {
    stage: 'Tertarik',
    label: 'Tertarik',
    stepNumber: 2,
    description: 'Konsumen menunjukkan minat untuk membeli unit yang ditawarkan.',
  },
  {
    stage: 'Cek Unit',
    label: 'Cek Unit',
    stepNumber: 3,
    description: 'Konsumen datang langsung ke showroom untuk melihat dan memeriksa kondisi mobil.',
  },
  {
    stage: 'Negosiasi',
    label: 'Negosiasi',
    stepNumber: 4,
    description: 'Konsumen melakukan tawar-menawar harga dengan pihak sales.',
  },
  {
    stage: 'Deal',
    label: 'Deal (Berhasil)',
    stepNumber: 5,
    description: 'Konsumen menyetujui pembelian dan transaksi berhasil.',
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
    <div className="space-y-6 pb-12">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 crm-card p-6">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-charcoal-900 text-gold-400 flex items-center justify-center shadow-md">
              <TrendingUp className="w-5 h-5 text-gold-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl lg:text-2xl font-bold tracking-tight text-charcoal-900">
                  Sales Pipeline Showroom HR MOTOR
                </h1>
                <span className="badge-gold">
                  Showroom Garut
                </span>
              </div>
              <p className="text-xs text-charcoal-500 mt-0.5">
                5 Tahapan Prospek: Menanyakan Unit &rarr; Tertarik &rarr; Cek Unit &rarr; Negosiasi &rarr; Deal, serta pemantauan status Lost (Batal).
              </p>
            </div>
          </div>
        </div>

        {/* Pipeline Summary Metrics Banner */}
        <div className="flex flex-wrap items-center gap-2 bg-warm-100 p-2 rounded-xl border border-warm-200 text-xs self-start md:self-auto">
          <div className="px-3 py-1.5 bg-white rounded-lg border border-warm-200 shadow-xs">
            <span className="text-[10px] text-charcoal-500 font-semibold block">Total Prospek</span>
            <span className="font-black text-charcoal-900 text-sm">{leads.length}</span>
          </div>
          <div className="px-3 py-1.5 bg-white rounded-lg border border-warm-200 shadow-xs">
            <span className="text-[10px] text-gold-700 font-semibold block">Prospek Aktif</span>
            <span className="font-black text-gold-700 text-sm">{activeLeadsCount}</span>
          </div>
          <div className="px-3 py-1.5 bg-white rounded-lg border border-warm-200 shadow-xs">
            <span className="text-[10px] text-charcoal-700 font-semibold block">Deal (Won)</span>
            <span className="font-black text-charcoal-900 text-sm">{dealLeadsCount}</span>
          </div>
          <div className="px-3 py-1.5 bg-white rounded-lg border border-warm-200 shadow-xs">
            <span className="text-[10px] text-rose-600 font-semibold block">Lost (Batal)</span>
            <span className="font-black text-rose-600 text-sm">{lostLeads.length}</span>
          </div>
          <div className="px-3 py-1.5 bg-gold-50 rounded-lg border border-gold-200 shadow-xs">
            <span className="text-[10px] text-gold-800 font-semibold block">Konversi Deal</span>
            <span className="font-black text-gold-800 text-sm">{conversionRate}%</span>
          </div>
        </div>
      </div>

      {/* DRAG & DROP INSTRUCTION NOTICE */}
      <div className="flex items-center justify-between text-xs text-charcoal-600 bg-warm-100 px-4 py-2.5 rounded-xl border border-warm-200">
        <div className="flex items-center gap-2">
          <GripVertical className="w-4 h-4 text-gold-600" />
          <span>
            <strong>Fitur Drag and Drop Aktif:</strong> Tarik dan lepaskan kartu prospek ke kolom tahapan baru, atau gunakan dropdown pindah tahapan pada kartu.
          </span>
        </div>
        <span className="hidden md:inline-block text-[11px] text-charcoal-500">
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
              className={`w-72 shrink-0 rounded-2xl border transition-all duration-150 border-warm-200 ${
                isOver ? 'bg-gold-50 ring-2 ring-gold-500 scale-[1.01]' : 'bg-warm-100/70'
              } p-3 flex flex-col shadow-xs`}
            >
              {/* Column Header */}
              <div className="flex items-start justify-between pb-2.5 mb-2.5 border-b border-warm-200">
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-md bg-charcoal-900 text-gold-400 font-bold text-[10px] flex items-center justify-center shadow-xs">
                      {col.stepNumber}
                    </span>
                    <h2 className="text-xs font-bold text-charcoal-900">{col.label}</h2>
                  </div>
                  <p className="text-[10px] text-charcoal-500 mt-1 line-clamp-1" title={col.description}>
                    {col.description}
                  </p>
                  <span className="text-[10px] font-bold text-gold-700 block mt-1">
                    Nilai: {formatRupiah(totalValue)}
                  </span>
                </div>
                <span className="w-6 h-6 rounded-full bg-white text-charcoal-900 font-bold text-xs flex items-center justify-center shadow-xs border border-warm-200 shrink-0">
                  {colLeads.length}
                </span>
              </div>

              {/* Cards Container */}
              <div className="space-y-3 min-h-[460px]">
                {colLeads.length === 0 ? (
                  <div className="h-36 flex flex-col items-center justify-center text-center p-3 text-[11px] text-charcoal-400 border border-dashed border-warm-300 rounded-xl bg-white/60">
                    <Car className="w-6 h-6 text-charcoal-300 mb-1" />
                    Belum ada calon pembeli pada tahapan ini
                  </div>
                ) : (
                  colLeads.map((lead) => {
                    return (
                      <div
                        key={lead.id}
                        draggable={true}
                        onDragStart={(e) => handleDragStart(e, lead.id)}
                        className="bg-white p-3.5 rounded-xl border border-warm-200 shadow-sm hover:shadow-luxury hover:border-gold-300 transition-all space-y-2.5 relative group cursor-grab active:cursor-grabbing border-l-3 border-l-gold-500"
                      >
                        {/* Drag Handle & Lead ID */}
                        <div className="flex items-center justify-between text-[10px] text-charcoal-400">
                          <span className="font-mono font-bold text-gold-700">{lead.id}</span>
                          <span className="flex items-center gap-1 text-[10px] text-charcoal-500">
                            <Clock className="w-3 h-3 text-gold-600" /> {getLeadAge(lead.dateReceived)}
                          </span>
                        </div>

                        {/* Customer Name & Phone */}
                        <div>
                          <div className="flex items-start justify-between gap-1">
                            <h3 className="text-xs font-bold text-charcoal-900 leading-tight">
                              {lead.customerName}
                            </h3>
                            <a
                              href={formatWhatsAppLink(
                                lead.contactNumber,
                                `Sampurasun Bapak/Ibu ${lead.customerName}, salam dari HR MOTOR Garut mengenai unit ${lead.interestedVehicle}.`
                              )}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1 rounded-md bg-gold-50 text-gold-700 hover:bg-gold-100 transition-colors shrink-0"
                              title="Chat WhatsApp Sekarang"
                            >
                              <MessageCircle className="w-3.5 h-3.5" />
                            </a>
                          </div>
                          <span className="text-[11px] text-charcoal-500 font-medium block">
                            {lead.contactNumber}
                          </span>
                        </div>

                        {/* Interested Vehicle & Budget */}
                        <div className="bg-warm-50 p-2 rounded-lg border border-warm-200 text-xs">
                          <div className="flex items-center gap-1.5 font-bold text-charcoal-800">
                            <Car className="w-3.5 h-3.5 text-gold-600 shrink-0" />
                            <span className="truncate">{lead.interestedVehicle}</span>
                          </div>
                          <div className="text-[11px] font-bold text-gold-700 mt-1">
                            Budget: {formatRupiah(lead.dealValue || lead.estimatedBudget)}
                          </div>
                        </div>

                        {/* Stage Specific Badges / Data */}
                        {lead.status === 'Cek Unit' && lead.visitNotes && (
                          <div className="text-[10px] p-2 rounded-lg bg-warm-50 text-charcoal-800 border border-warm-200">
                            <span className="font-bold block text-gold-700">Hasil Cek Unit:</span>
                            <p className="line-clamp-2 mt-0.5 text-charcoal-600">{lead.visitNotes}</p>
                          </div>
                        )}

                        {lead.status === 'Negosiasi' && lead.negotiationOffer && (
                          <div className="text-[10px] p-2 rounded-lg bg-warm-50 text-charcoal-800 border border-warm-200">
                            <span className="font-bold block text-gold-700">
                              Tawaran: {formatRupiah(lead.negotiationOffer)}
                            </span>
                            {lead.negotiationNotes && (
                              <p className="line-clamp-2 mt-0.5 text-charcoal-600">{lead.negotiationNotes}</p>
                            )}
                          </div>
                        )}

                        {lead.status === 'Deal' && lead.dealDate && (
                          <div className="text-[10px] p-2 rounded-lg bg-gold-50 text-charcoal-800 border border-gold-200">
                            <span className="font-bold block text-gold-800">
                              Deal Tanggal: {formatDate(lead.dealDate)}
                            </span>
                            <span className="text-[10px] text-charcoal-700 font-semibold">
                              Nilai: {formatRupiah(lead.dealValue || lead.estimatedBudget)}
                            </span>
                          </div>
                        )}

                        {/* Sales PJ & History Link */}
                        <div className="flex items-center justify-between text-[10px] text-charcoal-500 pt-1.5 border-t border-warm-200">
                          <span className="font-medium text-charcoal-700 flex items-center gap-1">
                            <User className="w-3 h-3 text-gold-600" />
                            {lead.assignedSalesName ? lead.assignedSalesName.split(' ')[0] : 'Asep'}
                          </span>

                          <button
                            type="button"
                            onClick={() => setJourneyLead(lead)}
                            className="text-[10px] font-bold text-gold-700 hover:text-gold-900 hover:underline flex items-center gap-1"
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
                            className="w-full text-[10px] font-semibold py-1 px-1.5 bg-warm-50 hover:bg-warm-100 border border-warm-200 rounded-lg text-charcoal-800 outline-none transition-colors"
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
                            className="p-1 rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-50 transition-colors"
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
      <div className="crm-card p-6 space-y-4 border-l-4 border-l-charcoal-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-warm-200 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-charcoal-100 text-charcoal-700 flex items-center justify-center font-bold">
              <XCircle className="w-4 h-4 text-charcoal-700" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-charcoal-900">
                Status Khusus: Lost / Tidak Jadi ({lostLeads.length} Konsumen)
              </h2>
              <p className="text-xs text-charcoal-500">
                Daftar calon pembeli yang batal melanjutkan transaksi beserta dokumentasi alasan evaluasi CRM HR MOTOR Garut
              </p>
            </div>
          </div>
          <span className="text-xs text-charcoal-400">
            Tidak dihitung prospek aktif • Digunakan untuk analisis konversi showroom
          </span>
        </div>

        {lostLeads.length === 0 ? (
          <div className="py-8 text-center text-xs text-charcoal-400">
            Tidak ada prospek dengan status Lost.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {lostLeads.map((lost) => (
              <div
                key={lost.id}
                className="p-4 rounded-xl border border-warm-200 bg-warm-50 space-y-2.5 text-xs"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] text-charcoal-400 font-mono font-bold block">{lost.id}</span>
                    <h3 className="font-bold text-charcoal-900 text-xs">{lost.customerName}</h3>
                    <p className="text-[11px] text-charcoal-500">{lost.contactNumber}</p>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-charcoal-200 text-charcoal-800">
                    Lost
                  </span>
                </div>

                <div className="bg-white p-2.5 rounded-lg border border-warm-200 text-[11px]">
                  <span className="font-semibold text-charcoal-800 block">Unit: {lost.interestedVehicle}</span>
                  <span className="text-rose-600 font-semibold block mt-1">
                    Alasan: {lost.lostReason || lost.lostReasonCategory || 'Tidak disebutkan'}
                  </span>
                </div>

                <div className="flex items-center justify-between text-[10px] text-charcoal-500 pt-2 border-t border-warm-200">
                  <span>Sales: {lost.assignedSalesName || 'Asep Kurniawan'}</span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setJourneyLead(lost)}
                      className="text-gold-700 font-bold hover:underline flex items-center gap-0.5"
                    >
                      <History className="w-3 h-3" /> Riwayat
                    </button>
                    <button
                      type="button"
                      onClick={() => handleOpenStageTransition(lost, 'Menanyakan Unit')}
                      className="text-charcoal-900 font-bold hover:text-gold-700 transition-colors"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-charcoal-950/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-luxury border border-warm-200 w-full max-w-md overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-warm-200 bg-warm-50">
              <div>
                <h3 className="text-sm font-bold text-charcoal-900">
                  Tahap 3: Cek Unit di Showroom
                </h3>
                <p className="text-xs text-charcoal-500">
                  {activeLead.customerName} • {activeLead.interestedVehicle}
                </p>
              </div>
              <button
                onClick={() => setModalType(null)}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-charcoal-400 hover:text-charcoal-700 hover:bg-warm-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-charcoal-700 mb-1">Tanggal Kunjungan Showroom</label>
                <input
                  type="date"
                  value={visitDate}
                  onChange={(e) => setVisitDate(e.target.value)}
                  className="w-full text-xs p-2.5 bg-warm-50 border border-warm-200 rounded-xl outline-none focus:border-gold-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-charcoal-700 mb-1">
                  Catatan Hasil Kunjungan Konsumen <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={4}
                  required
                  value={visitNotes}
                  onChange={(e) => setVisitNotes(e.target.value)}
                  placeholder="Misal: Konsumen datang ke showroom bersama keluarga, mengecek kondisi bodi, interior mulus, dan mencoba suara mesin. Respon sangat positif..."
                  className="w-full text-xs p-3 bg-warm-50 border border-warm-200 rounded-xl outline-none focus:ring-1 focus:ring-gold-500/30 focus:border-gold-500"
                />
                <p className="text-[10px] text-charcoal-400 mt-1">
                  Dokumentasi pemeriksaan kondisi mobil oleh konsumen di showroom HR MOTOR.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 px-6 py-3.5 border-t border-warm-200 bg-warm-50">
              <button
                type="button"
                onClick={() => setModalType(null)}
                className="px-4 py-2 text-xs font-semibold text-charcoal-700 hover:bg-warm-200 rounded-xl transition-colors"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmModal}
                className="btn-gold px-4 py-2 text-xs"
              >
                Simpan & Pindahkan ke Cek Unit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: NEGOSIASI (Harga Penawaran & Hasil Tawar-Menawar) */}
      {modalType === 'negosiasi' && activeLead && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-charcoal-950/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-luxury border border-warm-200 w-full max-w-md overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-warm-200 bg-warm-50">
              <div>
                <h3 className="text-sm font-bold text-charcoal-900">
                  Tahap 4: Negosiasi Harga Showroom
                </h3>
                <p className="text-xs text-charcoal-500">
                  {activeLead.customerName} • {activeLead.interestedVehicle}
                </p>
              </div>
              <button
                onClick={() => setModalType(null)}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-charcoal-400 hover:text-charcoal-700 hover:bg-warm-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-charcoal-700 mb-1">
                  Harga Penawaran Konsumen (Rp) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  required
                  value={negotiationOffer}
                  onChange={(e) => setNegotiationOffer(e.target.value)}
                  placeholder="Contoh: 165000000"
                  className="w-full text-xs p-2.5 bg-warm-50 border border-warm-200 rounded-xl outline-none font-bold text-charcoal-900 focus:border-gold-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-charcoal-700 mb-1">
                  Catatan & Hasil Negosiasi Sales
                </label>
                <textarea
                  rows={3}
                  value={negotiationNotes}
                  onChange={(e) => setNegotiationNotes(e.target.value)}
                  placeholder="Misal: Konsumen menawar Rp 165 juta nett, sales menyetujui dengan bonus kaca film baru dan ganti oli sebelum penyerahan unit..."
                  className="w-full text-xs p-3 bg-warm-50 border border-warm-200 rounded-xl outline-none focus:ring-1 focus:ring-gold-500/30 focus:border-gold-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 px-6 py-3.5 border-t border-warm-200 bg-warm-50">
              <button
                type="button"
                onClick={() => setModalType(null)}
                className="px-4 py-2 text-xs font-semibold text-charcoal-700 hover:bg-warm-200 rounded-xl transition-colors"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmModal}
                className="btn-gold px-4 py-2 text-xs"
              >
                Simpan & Masuk Tahap Negosiasi
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: DEAL (Transaksi Pembelian Berhasil) */}
      {modalType === 'deal' && activeLead && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-charcoal-950/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-luxury border border-warm-200 w-full max-w-md overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-warm-200 bg-gold-50/50">
              <div>
                <h3 className="text-sm font-bold text-charcoal-900">
                  Tahap 5: Deal Pembelian Mobil Berhasil!
                </h3>
                <p className="text-xs text-gold-800">
                  {activeLead.customerName} • {activeLead.interestedVehicle}
                </p>
              </div>
              <button
                onClick={() => setModalType(null)}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-charcoal-400 hover:text-charcoal-700 hover:bg-warm-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="p-3 bg-gold-50 border border-gold-200 rounded-xl flex items-center gap-2 text-gold-900 text-xs">
                <CheckCircle className="w-5 h-5 text-gold-600 shrink-0" />
                <span>
                  Transaksi ini dihitung sebagai <strong>Deal Berhasil</strong> dan otomatis masuk ke modul After Sales untuk pemantauan garansi 1 tahun resmi HR MOTOR.
                </span>
              </div>

              <div>
                <label className="block font-semibold text-charcoal-700 mb-1">
                  Tanggal Transaksi Berhasil <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={dealDate}
                  onChange={(e) => setDealDate(e.target.value)}
                  className="w-full text-xs p-2.5 bg-warm-50 border border-warm-200 rounded-xl outline-none font-bold"
                />
              </div>

              <div>
                <label className="block font-semibold text-charcoal-700 mb-1">
                  Harga Deal Final (Rp) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  required
                  value={dealPrice}
                  onChange={(e) => setDealPrice(e.target.value)}
                  className="w-full text-xs p-2.5 bg-warm-50 border border-warm-200 rounded-xl outline-none font-black text-charcoal-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-charcoal-700 mb-1">Metode Pembayaran</label>
                  <select
                    value={dealPaymentMethod}
                    onChange={(e) => setDealPaymentMethod(e.target.value)}
                    className="w-full text-xs p-2.5 bg-warm-50 border border-warm-200 rounded-xl outline-none"
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
                  <label className="block font-semibold text-charcoal-700 mb-1">Nomor Polisi (Plat Z)</label>
                  <input
                    type="text"
                    value={dealPlateNumber}
                    onChange={(e) => setDealPlateNumber(e.target.value)}
                    className="w-full text-xs p-2.5 bg-warm-50 border border-warm-200 rounded-xl outline-none font-bold uppercase font-mono"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 px-6 py-3.5 border-t border-warm-200 bg-warm-50">
              <button
                type="button"
                onClick={() => setModalType(null)}
                className="px-4 py-2 text-xs font-semibold text-charcoal-700 hover:bg-warm-200 rounded-xl transition-colors"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmModal}
                className="btn-gold px-5 py-2 text-xs"
              >
                Konfirmasi Deal Sukses
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: LOST / TIDAK JADI */}
      {modalType === 'lost' && activeLead && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-charcoal-950/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-luxury border border-warm-200 w-full max-w-md overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-warm-200 bg-warm-50">
              <div>
                <h3 className="text-sm font-bold text-charcoal-900">
                  Tandai Status: Lost / Tidak Jadi
                </h3>
                <p className="text-xs text-charcoal-500">
                  {activeLead.customerName} • {activeLead.interestedVehicle}
                </p>
              </div>
              <button
                onClick={() => setModalType(null)}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-charcoal-400 hover:text-charcoal-700 hover:bg-warm-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="p-3 bg-warm-100 border border-warm-200 rounded-xl text-charcoal-700 text-xs leading-relaxed">
                <strong>Catatan Evaluasi:</strong> Pilihlah alasan mengapa calon pembeli batal membeli unit di HR MOTOR Garut untuk evaluasi performa CRM.
              </div>

              <div>
                <label className="block font-semibold text-charcoal-700 mb-1">
                  Pilihan Alasan Lost <span className="text-rose-500">*</span>
                </label>
                <select
                  value={lostReasonCategory}
                  onChange={(e) => setLostReasonCategory(e.target.value as LostReasonType)}
                  className="w-full text-xs p-2.5 bg-warm-50 border border-warm-200 rounded-xl outline-none font-bold text-charcoal-800 focus:border-gold-500"
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
                  <label className="block font-semibold text-charcoal-700 mb-1">
                    Keterangan Alasan Lainnya <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={lostCustomReason}
                    onChange={(e) => setLostCustomReason(e.target.value)}
                    placeholder="Tuliskan alasan spesifik konsumen tidak jadi membeli..."
                    className="w-full text-xs p-2.5 bg-warm-50 border border-warm-200 rounded-xl outline-none focus:border-gold-500"
                  />
                </div>
              )}

              <div>
                <label className="block font-semibold text-charcoal-700 mb-1">Catatan Tambahan (Opsional)</label>
                <textarea
                  rows={2}
                  value={lostNotes}
                  onChange={(e) => setLostNotes(e.target.value)}
                  placeholder="Keterangan komunikasi terakhir atau respon konsumen..."
                  className="w-full text-xs p-2.5 bg-warm-50 border border-warm-200 rounded-xl outline-none focus:border-gold-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 px-6 py-3.5 border-t border-warm-200 bg-warm-50">
              <button
                type="button"
                onClick={() => setModalType(null)}
                className="px-4 py-2 text-xs font-semibold text-charcoal-700 hover:bg-warm-200 rounded-xl transition-colors"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmModal}
                className="px-4 py-2 text-xs font-bold text-white bg-charcoal-800 hover:bg-charcoal-900 rounded-xl shadow-sm transition-colors"
              >
                Simpan Status Lost
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 5: CUSTOMER JOURNEY TIMELINE (Riwayat Perjalanan Konsumen) */}
      {journeyLead && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-charcoal-950/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-luxury border border-warm-200 w-full max-w-xl max-h-[85vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-warm-200 bg-warm-50">
              <div>
                <h3 className="text-sm font-bold text-charcoal-900 flex items-center gap-1.5">
                  <History className="w-4 h-4 text-gold-600" />
                  Riwayat Perjalanan Konsumen (Customer Journey)
                </h3>
                <p className="text-xs text-charcoal-500">
                  {journeyLead.customerName} ({journeyLead.contactNumber}) • {journeyLead.interestedVehicle}
                </p>
              </div>
              <button
                onClick={() => setJourneyLead(null)}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-charcoal-400 hover:text-charcoal-700 hover:bg-warm-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4">
              {/* Profile summary card */}
              <div className="p-3.5 bg-warm-50 rounded-xl border border-warm-200 text-xs grid grid-cols-2 gap-2">
                <div>
                  <span className="text-charcoal-400 block text-[10px]">Status Terkini:</span>
                  <span className="font-bold text-charcoal-900">{journeyLead.status}</span>
                </div>
                <div>
                  <span className="text-charcoal-400 block text-[10px]">Budget Konsumen:</span>
                  <span className="font-bold text-gold-700">
                    {formatRupiah(journeyLead.dealValue || journeyLead.estimatedBudget)}
                  </span>
                </div>
                <div>
                  <span className="text-charcoal-400 block text-[10px]">Sumber Prospek:</span>
                  <span className="font-semibold text-charcoal-700">{journeyLead.leadSource}</span>
                </div>
                <div>
                  <span className="text-charcoal-400 block text-[10px]">Sales Penanggung Jawab:</span>
                  <span className="font-semibold text-charcoal-700">{journeyLead.assignedSalesName || 'Asep Kurniawan'}</span>
                </div>
              </div>

              {/* Timeline nodes */}
              <div>
                <h4 className="text-xs font-bold text-charcoal-700 uppercase tracking-wider mb-3">
                  Kronologi Tahapan dari Awal hingga Akhir:
                </h4>

                {(!journeyLead.stageHistory || journeyLead.stageHistory.length === 0) ? (
                  <div className="p-4 text-center text-xs text-charcoal-400 bg-warm-50 rounded-xl">
                    Belum ada riwayat tercatat.
                  </div>
                ) : (
                  <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-warm-200">
                    {journeyLead.stageHistory.map((item, idx) => {
                      const isDeal = item.stage === 'Deal';
                      const isLost = item.stage === 'Lost';

                      return (
                        <div key={idx} className="relative">
                          {/* Dot indicator */}
                          <div
                            className={`absolute -left-6 top-1 w-4 h-4 rounded-full border-2 border-white shadow-xs ${
                              isDeal
                                ? 'bg-gold-500'
                                : isLost
                                ? 'bg-charcoal-600'
                                : 'bg-charcoal-900'
                            }`}
                          />

                          <div className="bg-white p-3.5 rounded-xl border border-warm-200 shadow-xs space-y-1.5 text-xs">
                            <div className="flex items-center justify-between">
                              <span
                                className={`font-black px-2 py-0.5 rounded-full text-[10px] ${
                                  isDeal
                                    ? 'bg-gold-100 text-gold-900'
                                    : isLost
                                    ? 'bg-charcoal-100 text-charcoal-800'
                                    : 'bg-warm-100 text-charcoal-800'
                                }`}
                              >
                                {item.stage}
                              </span>
                              <span className="text-[10px] text-charcoal-400 font-mono">
                                {formatDate(item.timestamp, true)}
                              </span>
                            </div>

                            {/* Specific content per stage */}
                            {item.visitNotes && (
                              <div className="p-2 rounded-lg bg-warm-50 text-charcoal-800 text-[11px] border border-warm-200">
                                <strong>Hasil Kunjungan Showroom:</strong> {item.visitNotes}
                              </div>
                            )}

                            {item.negotiationOffer && (
                              <div className="p-2 rounded-lg bg-warm-50 text-charcoal-800 text-[11px] border border-warm-200">
                                <strong>Tawaran Harga:</strong> {formatRupiah(item.negotiationOffer)}
                                {item.negotiationNotes && (
                                  <p className="mt-0.5 text-charcoal-600">{item.negotiationNotes}</p>
                                )}
                              </div>
                            )}

                            {item.dealDate && (
                              <div className="p-2 rounded-lg bg-gold-50 text-gold-900 text-[11px] border border-gold-200">
                                <strong>Transaksi Berhasil:</strong> Deal ditutup pada {formatDate(item.dealDate)}
                              </div>
                            )}

                            {item.lostReason && (
                              <div className="p-2 rounded-lg bg-warm-50 text-charcoal-800 text-[11px] border border-warm-200">
                                <strong>Alasan Batal (Lost):</strong> {item.lostReason}
                              </div>
                            )}

                            {item.notes && !item.visitNotes && !item.negotiationNotes && !item.lostReason && (
                              <p className="text-charcoal-600 text-[11px] italic">
                                &ldquo;{item.notes}&rdquo;
                              </p>
                            )}

                            <span className="text-[10px] text-charcoal-400 block pt-1 border-t border-warm-200">
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

            <div className="flex items-center justify-end px-6 py-3.5 border-t border-warm-200 bg-warm-50">
              <button
                type="button"
                onClick={() => setJourneyLead(null)}
                className="px-4 py-2 text-xs font-bold text-charcoal-700 bg-white hover:bg-warm-100 border border-warm-200 rounded-xl transition-colors"
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
