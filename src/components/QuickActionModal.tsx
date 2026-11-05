'use client';

import React, { useState, useMemo } from 'react';
import { X, UserPlus, Target, CalendarClock, MessageSquare, Wrench, ShieldCheck, CheckCircle2, AlertTriangle } from 'lucide-react';
import { useCrm } from '@/context/CrmContext';
import { LeadSourceType, VehicleCategory, PriorityLevel, FollowUpChannel, RepairPartCategory } from '@/types/crm';
import { checkWarrantyStatus, parseRupiahInput } from '@/lib/warranty';

interface QuickActionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

function guessVehicleCategory(brand: string, model: string): VehicleCategory {
  const combined = `${brand} ${model}`.toLowerCase();
  if (
    combined.includes('avanza') ||
    combined.includes('innova') ||
    combined.includes('xpander') ||
    combined.includes('sigra') ||
    combined.includes('calya') ||
    combined.includes('mobilio') ||
    combined.includes('ertiga') ||
    combined.includes('serena') ||
    combined.includes('cortez') ||
    combined.includes('confero') ||
    combined.includes('veloz') ||
    combined.includes('sienta') ||
    combined.includes('livina') ||
    combined.includes('br-v') ||
    combined.includes('brv')
  ) {
    return 'MPV';
  }
  if (
    combined.includes('pajero') ||
    combined.includes('fortuner') ||
    combined.includes('rush') ||
    combined.includes('terios') ||
    combined.includes('cr-v') ||
    combined.includes('crv') ||
    combined.includes('hr-v') ||
    combined.includes('hrv') ||
    combined.includes('wr-v') ||
    combined.includes('wrv') ||
    combined.includes('raize') ||
    combined.includes('rocky') ||
    combined.includes('creta') ||
    combined.includes('almaz') ||
    combined.includes('outlander') ||
    combined.includes('mu-x')
  ) {
    return 'SUV';
  }
  if (
    combined.includes('brio') ||
    combined.includes('agya') ||
    combined.includes('ayla') ||
    combined.includes('karimun') ||
    combined.includes('ignis') ||
    combined.includes('sirion') ||
    combined.includes('picanto') ||
    combined.includes('march') ||
    combined.includes('mirage') ||
    combined.includes('datsun go')
  ) {
    return 'City Car';
  }
  if (
    combined.includes('yaris') ||
    combined.includes('jazz') ||
    combined.includes('baleno') ||
    combined.includes('swift') ||
    combined.includes('mazda 2')
  ) {
    return 'Hatchback';
  }
  if (
    combined.includes('civic') ||
    combined.includes('corolla') ||
    combined.includes('altis') ||
    combined.includes('camry') ||
    combined.includes('accord') ||
    combined.includes('city') ||
    combined.includes('vios')
  ) {
    return 'Sedan';
  }
  return 'MPV';
}

const REPAIR_CATEGORIES: RepairPartCategory[] = [
  'Mesin',
  'Kelistrikan & AC',
  'Kaki-kaki & Suspensi',
  'Sistem Rem',
  'Transmisi',
  'Bodi & Cat',
  'Lainnya',
];

const RECOMMENDED_WORKSHOPS = [
  'Bengkel Garut Motor Mandiri (Rujukan HR MOTOR)',
  'Bengkel Resmi HR MOTOR Garut - Samarang',
  'Bengkel Garut Otomotif Sentra (Rujukan HR MOTOR)',
  'Bengkel Mandiri Motor Samarang (Rujukan HR MOTOR)',
  'Bengkel Mitra Bodi Otomotif Garut (Rujukan HR MOTOR)',
];

export const QuickActionModal: React.FC<QuickActionModalProps> = ({ isOpen, onClose }) => {
  const { addCustomer, addLead, addFollowUp, logCommunication, addRepairClaim, customers, leads, users, currentUser, stocks, purchases, formatRupiah } = useCrm();

  const readyStocks = (stocks || []).filter((s) => s.status === 'Tersedia');

  const [activeTab, setActiveTab] = useState<'customer' | 'lead' | 'followup' | 'comm' | 'repair'>('customer');
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // 1. List of Customers Who Have Purchased Cars (Auto-fill dropdown for Garansi)
  const purchaseCustomersList = useMemo(() => {
    const list: Array<{
      key: string;
      customerId: string;
      customerName: string;
      customerPhone: string;
      vehicleBrand: string;
      vehicleModel: string;
      vehicleYear: number;
      plateNumber: string;
      purchaseDate: string;
      label: string;
    }> = [];

    (purchases || []).forEach((p, idx) => {
      const cust = customers.find(
        (c) => c.id === p.customerId || c.fullName.toLowerCase() === p.customerName.toLowerCase()
      );
      const phone = cust?.whatsapp || (p as any).customerPhone || '';
      const brand = p.vehicleBrand || (p.vehicleName ? p.vehicleName.split(' ')[0] : 'Toyota');
      const model = p.vehicleModel || p.vehicleName || 'Mobil';
      const plate = p.plateNumber || '-';

      list.push({
        key: `PURCHASE-${p.id || idx}`,
        customerId: p.customerId || cust?.id || '',
        customerName: p.customerName,
        customerPhone: phone,
        vehicleBrand: brand,
        vehicleModel: model,
        vehicleYear: p.vehicleYear || 2021,
        plateNumber: plate,
        purchaseDate: p.purchaseDate || '',
        label: `${p.customerName} — ${brand} ${model} [${plate}] (Beli: ${p.purchaseDate || '-'})`,
      });
    });

    (customers || []).forEach((c) => {
      if (c.status === 'Sudah Beli') {
        const alreadyIn = list.some(
          (item) => item.customerId === c.id || item.customerName.toLowerCase() === c.fullName.toLowerCase()
        );
        if (!alreadyIn) {
          const brand = c.interestedVehicle ? c.interestedVehicle.split(' ')[0] : 'Toyota';
          const model = c.interestedVehicle || 'Mobil';
          const plate = c.plateNumber || '-';
          list.push({
            key: `CUST-${c.id}`,
            customerId: c.id,
            customerName: c.fullName,
            customerPhone: c.whatsapp,
            vehicleBrand: brand,
            vehicleModel: model,
            vehicleYear: 2021,
            plateNumber: plate,
            purchaseDate: c.receiptDate || c.registeredDate || '',
            label: `${c.fullName} — ${brand} ${model} [${plate}] • ${c.whatsapp}`,
          });
        }
      }
    });

    return list;
  }, [purchases, customers]);

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
    selectedPurchaseKey: '',
    isManualMode: false,
    customerId: '',
    customerName: '',
    customerPhone: '',
    vehicleBrand: 'Toyota',
    vehicleModel: '',
    vehicleYear: 2021,
    plateNumber: '',
    purchaseDate: '',
    claimDate: new Date().toISOString().split('T')[0],
    damageCategory: 'Mesin' as RepairPartCategory,
    complaintOrDamage: '',
    partsToRepair: '',
    workshop: 'Bengkel Garut Motor Mandiri (Rujukan HR MOTOR)',
    customWorkshop: '',
    repairCost: 0,
  });

  const quickWarrantyCheck = useMemo(() => {
    return checkWarrantyStatus(repairForm.purchaseDate, repairForm.claimDate);
  }, [repairForm.purchaseDate, repairForm.claimDate]);

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
      status: 'Hanya Menanyakan',
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

  const handleSelectRepairCustomer = (key: string) => {
    if (!key) {
      setRepairForm((prev) => ({
        ...prev,
        selectedPurchaseKey: '',
        customerId: '',
        customerName: '',
        customerPhone: '',
        vehicleBrand: 'Toyota',
        vehicleModel: '',
        vehicleYear: 2021,
        plateNumber: '',
        purchaseDate: '',
      }));
      return;
    }
    const selected = purchaseCustomersList.find((p) => p.key === key);
    if (!selected) return;
    setRepairForm((prev) => ({
      ...prev,
      selectedPurchaseKey: key,
      isManualMode: false,
      customerId: selected.customerId,
      customerName: selected.customerName,
      customerPhone: selected.customerPhone || prev.customerPhone,
      vehicleBrand: selected.vehicleBrand,
      vehicleModel: selected.vehicleModel,
      vehicleYear: selected.vehicleYear,
      plateNumber: selected.plateNumber !== '-' ? selected.plateNumber : '',
      purchaseDate: selected.purchaseDate,
    }));
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

    const cost = parseRupiahInput(repairForm.repairCost);
    const finalWorkshop =
      repairForm.workshop === 'Lainnya'
        ? repairForm.customWorkshop.trim() || 'Bengkel Rekanan HR MOTOR'
        : repairForm.workshop;

    const res = await addRepairClaim({
      customerId: repairForm.customerId || undefined,
      customerName: repairForm.customerName.trim(),
      customerPhone: repairForm.customerPhone.trim(),
      vehicleBrand: repairForm.vehicleBrand || (repairForm.vehicleModel.split(' ')[0] || 'Toyota'),
      vehicleModel: repairForm.vehicleModel.trim(),
      vehicleYear: Number(repairForm.vehicleYear) || 2021,
      plateNumber: repairForm.plateNumber.trim().toUpperCase() || undefined,
      workshop: finalWorkshop,
      purchaseDate: repairForm.purchaseDate || undefined,
      claimDate: repairForm.claimDate || new Date().toISOString().split('T')[0],
      claimType: 'Garansi',
      damageCategory: repairForm.damageCategory,
      complaintOrDamage: repairForm.complaintOrDamage.trim(),
      complaint: repairForm.complaintOrDamage.trim(),
      partsToRepair: repairForm.partsToRepair.trim(),
      damagedParts: repairForm.partsToRepair.trim(),
      repairActionDescription: `Perbaikan garansi gratis showroom HR MOTOR: ${repairForm.partsToRepair.trim() || repairForm.damageCategory}`,
      actionTaken: `Perbaikan garansi gratis showroom HR MOTOR: ${repairForm.partsToRepair.trim() || repairForm.damageCategory}`,
      sparepartCost: cost,
      serviceCost: 0,
      totalCost: cost,
      status: 'Selesai',
      notes: 'Garansi Perbaikan Gratis (< 1 Bulan) HR MOTOR Garut',
      completedDate: repairForm.claimDate,
    });

    setSubmitting(false);
    if (res.success) {
      onClose();
    } else {
      setErrorMessage(res.error || 'Gagal menambahkan klaim perbaikan');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-charcoal-950/40 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="crm-card w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden shadow-luxury border-gold-500/30">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#EAE8E3] bg-[#FAF9F5] text-charcoal-900 relative">
          <div className="absolute top-0 left-0 right-0 h-[2.5px] bg-gradient-to-r from-gold-500 via-gold-400 to-gold-600" />
          <div>
            <span className="badge-gold text-[10px] mb-1 inline-block">Shortcut Pintasan</span>
            <h2 className="text-base font-black text-charcoal-900">Aksi Cepat Showroom</h2>
            <p className="text-xs text-charcoal-500">Pilih tindakan cepat operasional HR MOTOR Garut</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-charcoal-400 hover:text-charcoal-900 hover:bg-[#F0EDE6] transition-colors cursor-pointer"
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
            + Klaim Garansi
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
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-semibold text-slate-700">Mobil Diminati</label>
                    {readyStocks.length > 0 && (
                      <span className="text-[10px] text-emerald-600 font-semibold">{readyStocks.length} unit ready</span>
                    )}
                  </div>
                  <input
                    type="text"
                    list="quick-ready-stocks"
                    required
                    value={custForm.interestedVehicle}
                    onChange={(e) => {
                      const val = e.target.value;
                      const matched = readyStocks.find(
                        (s) => `${s.brand} ${s.model} ${s.year}`.toLowerCase().trim() === val.toLowerCase().trim()
                      );
                      if (matched) {
                        setCustForm((prev) => ({
                          ...prev,
                          interestedVehicle: `${matched.brand} ${matched.model} ${matched.year}`,
                          vehicleType: guessVehicleCategory(matched.brand, matched.model),
                          budget: String(matched.price || prev.budget),
                          notes: prev.notes || `Unit Ready Stok Showroom: ${matched.brand} ${matched.model} (${matched.licensePlate || matched.plateNumber || '-'})`,
                        }));
                      } else {
                        setCustForm({ ...custForm, interestedVehicle: val });
                      }
                    }}
                    placeholder="Pilih dari stok ready atau ketik..."
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
                  />
                  <datalist id="quick-ready-stocks">
                    {readyStocks.map((s) => (
                      <option
                        key={s.id}
                        value={`${s.brand} ${s.model} ${s.year}`}
                      >
                        {s.licensePlate || s.plateNumber ? `[${s.licensePlate || s.plateNumber}] ` : ''}Rp {s.price?.toLocaleString('id-ID')} • {s.color}
                      </option>
                    ))}
                  </datalist>
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
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-semibold text-slate-700">Unit Mobil Diminati</label>
                    {readyStocks.length > 0 && (
                      <span className="text-[10px] text-emerald-600 font-semibold">{readyStocks.length} unit ready</span>
                    )}
                  </div>
                  <input
                    type="text"
                    list="quick-ready-stocks"
                    required
                    value={leadForm.interestedVehicle}
                    onChange={(e) => {
                      const val = e.target.value;
                      const matched = readyStocks.find(
                        (s) => `${s.brand} ${s.model} ${s.year}`.toLowerCase().trim() === val.toLowerCase().trim()
                      );
                      if (matched) {
                        setLeadForm((prev) => ({
                          ...prev,
                          interestedVehicle: `${matched.brand} ${matched.model} ${matched.year}`,
                          estimatedBudget: String(matched.price || prev.estimatedBudget),
                          notes: prev.notes || `Unit Ready Stok Showroom: ${matched.brand} ${matched.model} (${matched.licensePlate || matched.plateNumber || '-'})`,
                        }));
                      } else {
                        setLeadForm({ ...leadForm, interestedVehicle: val });
                      }
                    }}
                    placeholder="Pilih dari stok ready atau ketik..."
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

          {/* TAB 5: FORM PERBAIKAN / KLAIM GARANSI */}
          {activeTab === 'repair' && (
            <form onSubmit={handleRepairSubmit} className="space-y-4">
              {/* 1. DATA PELANGGAN */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5">
                <div className="flex items-center justify-between flex-wrap gap-1">
                  <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-gold-600" />
                    Data Pelanggan (Pilih Pembeli Unit Mobil HR MOTOR):
                  </label>
                  <button
                    type="button"
                    onClick={() =>
                      setRepairForm((prev) => ({
                        ...prev,
                        isManualMode: !prev.isManualMode,
                        selectedPurchaseKey: '',
                      }))
                    }
                    className="text-[11px] font-semibold text-gold-700 hover:text-gold-900 underline"
                  >
                    {repairForm.isManualMode ? '← Pilih dari Daftar Pembelian' : 'Atau Ketik Data Manual'}
                  </button>
                </div>

                {!repairForm.isManualMode ? (
                  <select
                    value={repairForm.selectedPurchaseKey}
                    onChange={(e) => handleSelectRepairCustomer(e.target.value)}
                    className="w-full text-xs py-2 px-3 bg-white border border-slate-300 rounded-lg text-slate-900 font-medium focus:outline-none focus:ring-1 focus:ring-gold-500"
                  >
                    <option value="">-- Pilih Pelanggan yang Sudah Membeli Mobil --</option>
                    {purchaseCustomersList.map((p) => (
                      <option key={p.key} value={p.key}>
                        {p.label}
                      </option>
                    ))}
                  </select>
                ) : (
                  <p className="text-[11px] text-slate-500 italic">
                    Mode ketik manual aktif. Silakan isi data pelanggan dan unit mobil di kolom bawah.
                  </p>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Nama Pelanggan <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Contoh: Budi Santoso"
                      value={repairForm.customerName}
                      onChange={(e) => setRepairForm({ ...repairForm, customerName: e.target.value })}
                      className="w-full text-xs py-2 px-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-gold-500 bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Nomor WhatsApp <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="0812xxxxxxxx"
                      value={repairForm.customerPhone}
                      onChange={(e) => setRepairForm({ ...repairForm, customerPhone: e.target.value })}
                      className="w-full text-xs py-2 px-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-gold-500 font-mono bg-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Unit Mobil (Model) <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Contoh: Toyota Avanza 1.3 G"
                      value={repairForm.vehicleModel}
                      onChange={(e) => setRepairForm({ ...repairForm, vehicleModel: e.target.value })}
                      className="w-full text-xs py-2 px-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-gold-500 bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      No. Polisi (Plat)
                    </label>
                    <input
                      type="text"
                      placeholder="Contoh: Z 1524 DB"
                      value={repairForm.plateNumber}
                      onChange={(e) => setRepairForm({ ...repairForm, plateNumber: e.target.value.toUpperCase() })}
                      className="w-full text-xs py-2 px-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-gold-500 font-mono uppercase bg-white font-bold"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Tanggal Pembelian Mobil
                    </label>
                    <input
                      type="date"
                      value={repairForm.purchaseDate}
                      onChange={(e) => setRepairForm({ ...repairForm, purchaseDate: e.target.value })}
                      className="w-full text-xs py-2 px-3 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-gold-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Tanggal Klaim / Perbaikan <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="date"
                      required
                      value={repairForm.claimDate}
                      onChange={(e) => setRepairForm({ ...repairForm, claimDate: e.target.value })}
                      className="w-full text-xs py-2 px-3 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-gold-500"
                    />
                  </div>
                </div>

                {/* Real-time Warranty Indicator */}
                {repairForm.purchaseDate && (
                  <div
                    className={`p-2 rounded-lg border text-xs flex items-center gap-2 mt-1 ${
                      quickWarrantyCheck.isWithinWarranty
                        ? 'bg-emerald-50 text-emerald-900 border-emerald-300'
                        : 'bg-amber-50 text-amber-900 border-amber-300'
                    }`}
                  >
                    {quickWarrantyCheck.isWithinWarranty ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                    )}
                    <div>
                      <span className="font-bold">{quickWarrantyCheck.badgeLabel}:</span>{' '}
                      <span>{quickWarrantyCheck.notes}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* 2. KATEGORI PERBAIKAN */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Kategori Perbaikan <span className="text-rose-500">*</span>
                </label>
                <select
                  value={repairForm.damageCategory}
                  onChange={(e) =>
                    setRepairForm({ ...repairForm, damageCategory: e.target.value as RepairPartCategory })
                  }
                  className="w-full text-xs py-2 px-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-gold-500 bg-white font-medium"
                >
                  {REPAIR_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              {/* 3. KELUHAN PERBAIKAN */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Keluhan Perbaikan Konsumen <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={2}
                  required
                  value={repairForm.complaintOrDamage}
                  onChange={(e) => setRepairForm({ ...repairForm, complaintOrDamage: e.target.value })}
                  placeholder="Contoh: AC kurang dingin, bunyi decit rem saat turunan..."
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-gold-500"
                />
              </div>

              {/* 4. BAGIAN YANG DIPERBAIKI */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Bagian yang Diperbaiki <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={repairForm.partsToRepair}
                  onChange={(e) => setRepairForm({ ...repairForm, partsToRepair: e.target.value })}
                  placeholder="Contoh: Kampas rem depan, pengisian freon AC..."
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-gold-500"
                />
              </div>

              {/* 5. BENGKEL REKANAN RUJUKAN */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center justify-between">
                  <span>Bengkel Rekanan HR MOTOR yang Disarankan</span>
                  <span className="text-[10px] text-slate-400">Rujukan Resmi Showroom</span>
                </label>
                <select
                  value={repairForm.workshop}
                  onChange={(e) => setRepairForm({ ...repairForm, workshop: e.target.value })}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-gold-500 bg-white"
                >
                  {RECOMMENDED_WORKSHOPS.map((ws) => (
                    <option key={ws} value={ws}>
                      {ws}
                    </option>
                  ))}
                  <option value="Lainnya">+ Ketik Bengkel Rekanan Lainnya</option>
                </select>

                {repairForm.workshop === 'Lainnya' && (
                  <input
                    type="text"
                    placeholder="Ketik nama bengkel rekanan rujukan..."
                    value={repairForm.customWorkshop}
                    onChange={(e) => setRepairForm({ ...repairForm, customWorkshop: e.target.value })}
                    className="w-full text-xs px-3 py-2 mt-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-gold-500"
                  />
                )}
              </div>

              {/* 6. BIAYA PERBAIKAN */}
              <div className="p-3 bg-gold-50/60 border border-gold-300 rounded-xl space-y-1">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-900">
                    Biaya Perbaikan (Rp) <span className="text-rose-500">*</span>
                  </label>
                  <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded border border-emerald-200">
                    100% Ditanggung HR MOTOR
                  </span>
                </div>
                <input
                  type="text"
                  required
                  value={repairForm.repairCost || ''}
                  onChange={(e) => setRepairForm({ ...repairForm, repairCost: parseRupiahInput(e.target.value) })}
                  placeholder="Contoh: 850000"
                  className="w-full text-sm font-bold py-2 px-3 bg-white border border-gold-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-gold-600 font-mono"
                />
                <div className="text-[11px] text-charcoal-600 font-medium">
                  Terbilang: <strong className="text-slate-900 font-bold">{formatRupiah(repairForm.repairCost)}</strong>
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
                  className="px-5 py-2 text-xs font-semibold text-white bg-gold-600 hover:bg-gold-700 rounded-lg shadow-sm transition-all disabled:opacity-50 flex items-center gap-1.5"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>{submitting ? 'Menyimpan...' : 'Simpan Klaim Garansi'}</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
