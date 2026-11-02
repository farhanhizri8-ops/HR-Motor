'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  MessageSquare,
  Send,
  Phone,
  Mail,
  Users,
  Copy,
  Check,
  ExternalLink,
  Plus,
  Clock,
  Sparkles,
  Search,
  Filter,
  Info,
  ArrowRight,
} from 'lucide-react';
import { useCrm } from '@/context/CrmContext';
import { MessageTemplate } from '@/types/crm';

export default function CommunicationCenterPage() {
  const router = useRouter();

  useEffect(() => {
    // Communication functions are centralized in Follow-up Management
    router.replace('/follow-up');
  }, [router]);

  const {
    communications,
    customers,
    templates,
    currentUser,
    logCommunication,
    formatDate,
    formatWhatsAppLink,
  } = useCrm();

  // Active Compose State
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [customMessage, setCustomMessage] = useState('');
  const [channel, setChannel] = useState<'WhatsApp' | 'Telepon' | 'Walk-in' | 'Email'>('WhatsApp');
  const [direction, setDirection] = useState<'Keluar' | 'Masuk'>('Keluar');
  const [commNotes, setCommNotes] = useState('');
  const [copiedTemplateId, setCopiedTemplateId] = useState<string | null>(null);

  const selectedCustomer = customers.find((c) => c.id === selectedCustomerId);

  // When template is selected, substitute variables
  const handleSelectTemplate = (tmpl: MessageTemplate) => {
    setSelectedTemplateId(tmpl.id);
    let text = tmpl.content;

    if (selectedCustomer) {
      text = text
        .replace(/{nama_pelanggan}/g, selectedCustomer.fullName)
        .replace(/{mobil_diminati}/g, selectedCustomer.interestedVehicle || 'unit pilihan Anda');
    } else {
      text = text
        .replace(/{nama_pelanggan}/g, '[Nama Pelanggan]')
        .replace(/{mobil_diminati}/g, '[Unit Mobil]');
    }

    setCustomMessage(text);
  };

  const handleCopyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedTemplateId(id);
    setTimeout(() => setCopiedTemplateId(null), 2000);
  };

  const handleLogInteraction = async () => {
    if (!selectedCustomer) {
      alert('Pilih pelanggan terlebih dahulu');
      return;
    }
    if (!customMessage.trim()) {
      alert('Isi pesan tidak boleh kosong');
      return;
    }

    const res = await logCommunication({
      customerId: selectedCustomer.id,
      customerName: selectedCustomer.fullName,
      customerPhone: selectedCustomer.whatsapp,
      channel,
      direction,
      templateId: selectedTemplateId || undefined,
      messageContent: customMessage,
      notes: commNotes || 'Percakapan berhasil dicatat.',
    });

    if (res.success) {
      alert('Interaksi komunikasi berhasil dicatat dalam riwayat pelanggan!');
      setCustomMessage('');
      setCommNotes('');
      setSelectedTemplateId('');
    } else {
      alert(res.error || 'Gagal menyimpan catatan komunikasi');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              WhatsApp Click-to-Chat CRM
            </span>
            <span className="text-xs text-slate-400">•</span>
            <span className="text-xs text-slate-500">Pusat Pesan & Template</span>
          </div>
          <h1 className="text-xl lg:text-2xl font-black text-slate-900 mt-1">
            Communication Center (Pusat Komunikasi Pelanggan)
          </h1>
          <p className="text-xs text-slate-500">
            Kirim pesan WhatsApp resmi berstandar HR MOTOR Garut dengan template profesional dan dokumentasikan riwayat kontak.
          </p>
        </div>

        {/* WhatsApp Integration Notice */}
        <div className="flex items-center gap-2 text-xs bg-emerald-50 text-emerald-800 p-2.5 rounded-xl border border-emerald-200 max-w-sm">
          <Info className="w-4 h-4 text-emerald-600 shrink-0" />
          <span className="text-[11px] leading-tight">
            Integrasi menggunakan <strong>WhatsApp Click-to-Chat</strong> resmi. Pesan langsung terbuka di aplikasi WhatsApp Web/Mobile tanpa perlu simpan nomor terlebih dahulu.
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT COLUMN: COMPOSE & WHATSAPP LAUNCHER (7 Cols) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Send className="w-4 h-4 text-emerald-600" />
                Kirim Pesan & Catat Komunikasi
              </h2>
              <span className="text-xs font-semibold text-slate-500">
                Operator: {currentUser.name}
              </span>
            </div>

            {/* Select Customer */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Pilih Pelanggan / Prospek Penerima <span className="text-rose-500">*</span>
              </label>
              <select
                value={selectedCustomerId}
                onChange={(e) => {
                  setSelectedCustomerId(e.target.value);
                  setSelectedTemplateId('');
                }}
                className="w-full text-xs p-2.5 bg-slate-50 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500/20"
              >
                <option value="">-- Pilih dari Database Pelanggan HR MOTOR --</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.fullName} - {c.whatsapp} (Minat: {c.interestedVehicle})
                  </option>
                ))}
              </select>
            </div>

            {/* If customer selected, display quick badge */}
            {selectedCustomer && (
              <div className="p-3 bg-emerald-50/60 border border-emerald-200 rounded-xl flex items-center justify-between text-xs">
                <div>
                  <p className="font-bold text-slate-900">{selectedCustomer.fullName}</p>
                  <p className="text-slate-500 text-[11px]">
                    No. WA: {selectedCustomer.whatsapp} • Domisili: {selectedCustomer.district}, Garut
                  </p>
                </div>
                <a
                  href={formatWhatsAppLink(selectedCustomer.whatsapp, customMessage)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm shadow-emerald-600/30 flex items-center gap-1.5 transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  Buka di WhatsApp
                </a>
              </div>
            )}

            {/* Channel & Direction */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Kanal Komunikasi</label>
                <select
                  value={channel}
                  onChange={(e) => setChannel(e.target.value as any)}
                  className="w-full text-xs p-2 bg-slate-50 border border-slate-300 rounded-lg outline-none"
                >
                  <option value="WhatsApp">WhatsApp (Resmi)</option>
                  <option value="Telepon">Telepon Langsung</option>
                  <option value="Walk-in">Tatap Muka di Showroom</option>
                  <option value="Email">Email</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Arah Kontak</label>
                <select
                  value={direction}
                  onChange={(e) => setDirection(e.target.value as any)}
                  className="w-full text-xs p-2 bg-slate-50 border border-slate-300 rounded-lg outline-none"
                >
                  <option value="Keluar">Keluar (Sales Hubungi Konsumen)</option>
                  <option value="Masuk">Masuk (Konsumen Menghubungi Dealer)</option>
                </select>
              </div>
            </div>

            {/* Message Textarea */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-slate-700">
                  Isi Pesan / Percakapan
                </label>
                <span className="text-[10px] text-slate-400">
                  Pilih template dari panel kanan untuk autofill
                </span>
              </div>
              <textarea
                rows={5}
                value={customMessage}
                onChange={(e) => setCustomMessage(e.target.value)}
                placeholder="Tulis pesan atau pilih template di samping kanan..."
                className="w-full text-xs p-3 border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500/20 font-sans"
              />
            </div>

            {/* Notes */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Catatan Hasil Percakapan / Kesepakatan
              </label>
              <input
                type="text"
                value={commNotes}
                onChange={(e) => setCommNotes(e.target.value)}
                placeholder="Konsumen merespon antusias, meminta dikirimkan simulasi angsuran..."
                className="w-full text-xs p-2.5 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-100">
              <span className="text-[11px] text-slate-400">
                Pesan akan langsung tersimpan di timeline riwayat pelanggan.
              </span>

              <div className="flex items-center gap-2">
                {selectedCustomer && (
                  <a
                    href={formatWhatsAppLink(selectedCustomer.whatsapp, customMessage)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded-xl flex items-center gap-1.5 transition-colors"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    Kirim via WA Web
                  </a>
                )}

                <button
                  onClick={handleLogInteraction}
                  className="px-4 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-emerald-600 rounded-xl shadow-xs transition-colors"
                >
                  Simpan Catatan Interaksi
                </button>
              </div>
            </div>
          </div>

          {/* RECENT COMMUNICATION LOGS */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Clock className="w-4 h-4 text-slate-500" />
              Riwayat Interaksi & Komunikasi Terakhir
            </h2>

            <div className="space-y-3">
              {communications.slice(0, 5).map((comm) => (
                <div
                  key={comm.id}
                  className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900">{comm.customerName}</span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 font-semibold">
                        {comm.channel} ({comm.direction})
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-400">
                      {formatDate(comm.createdAt, true)}
                    </span>
                  </div>

                  <p className="text-slate-700 italic bg-white p-2.5 rounded-lg border border-slate-200">
                    &ldquo;{comm.messageContent}&rdquo;
                  </p>

                  <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                    <span>
                      Hasil: <strong>{comm.notes || '-'}</strong>
                    </span>
                    <span>Operator: {comm.loggedByName}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: PROFESSIONAL MESSAGE TEMPLATES (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h2 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  Template Pesan Resmi HR MOTOR
                </h2>
                <p className="text-[11px] text-slate-500">Klik untuk menerapkan ke formulir pesan</p>
              </div>
            </div>

            <div className="space-y-3 max-h-[700px] overflow-y-auto pr-1">
              {templates.map((tmpl) => (
                <div
                  key={tmpl.id}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                    selectedTemplateId === tmpl.id
                      ? 'border-emerald-500 bg-emerald-50/50 ring-1 ring-emerald-500'
                      : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                  onClick={() => handleSelectTemplate(tmpl)}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-bold text-slate-900">{tmpl.title}</span>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                      {tmpl.category}
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-600 line-clamp-3 bg-white p-2 rounded-lg border border-slate-100 font-sans">
                    {tmpl.content}
                  </p>

                  <div className="flex items-center justify-end gap-2 mt-2 pt-2 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCopyText(tmpl.content, tmpl.id);
                      }}
                      className="text-[10px] font-semibold text-slate-500 hover:text-slate-800 flex items-center gap-1"
                    >
                      {copiedTemplateId === tmpl.id ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-600" /> Tersalin!
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" /> Salin Teks
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSelectTemplate(tmpl);
                      }}
                      className="text-[10px] font-bold text-emerald-700 hover:underline"
                    >
                      Gunakan Template &rarr;
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
