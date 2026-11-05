'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { useCrm } from '@/context/CrmContext';
import {
  FollowUp,
  FollowUpCategory,
  FollowUpStatus,
  CommunicationResultOutcome,
  PriorityLevel,
  FollowUpChannel,
  LeadSourceType,
  ProspectFollowUpStatus,
  CustomerFollowUpStatus,
  VehicleStock,
} from '@/types/crm';
import {
  CalendarClock,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertTriangle,
  MessageCircle,
  Phone,
  User,
  Users,
  Car,
  ChevronRight,
  X,
  History,
  Send,
  Calendar,
  Sparkles,
  AlertCircle,
  Check,
  RotateCcw,
  Tag,
  DollarSign,
  TrendingUp,
  ArrowRight,
  HelpCircle,
  ChevronDown,
  ShoppingBag,
  CreditCard,
  Building2,
  BadgeCheck,
  FileCheck,
  Flame,
  ArrowUpRight,
  ExternalLink,
} from 'lucide-react';

const CUSTOMER_PERIODIC_STEPS = ['1 Bulan', '3 Bulan', '6 Bulan', '1 Tahun'] as const;

const SHOWROOM_OPERATIONAL_QUESTIONS = [
  {
    num: 1,
    title: 'Kabar Hari Ini',
    question: 'Bagaimana kabarnya Bapak/Ibu sekeluarga hari ini?',
    purpose: 'Membangun kehangatan hubungan dan silaturahmi kekeluargaan khas Showroom HR MOTOR Garut.',
  },
  {
    num: 2,
    title: 'Kondisi & Performa Mobil',
    question: 'Bagaimana kondisi dan performa mobil setelah beberapa waktu digunakan?',
    purpose: 'Memastikan kendaraan berfungsi prima tanpa kendala teknis pasca-serah terima.',
  },
  {
    num: 3,
    title: 'Kendala atau Keluhan Kendaraan',
    question: 'Apakah ada kendala, keluhan, atau kebutuhan servis pada kendaraan saat ini?',
    purpose: 'Menjembatani layanan garansi showroom, rekomendasi bengkel rekanan Garut, atau penanganan teknis.',
  },
  {
    num: 4,
    title: 'Rencana Upgrade / Ganti Unit',
    question: 'Apakah ada rencana untuk upgrade atau menambah unit kendaraan keluarga dalam waktu dekat?',
    purpose: 'Membuka peluang repeat order atau tukar tambah (trade-in) sebelum konsumen mencari ke tempat lain.',
  },
  {
    num: 5,
    title: 'Prioritas Jual Kembali ke HR MOTOR',
    question: 'Apabila ada rencana menjual kembali kendaraan tersebut, mohon diprioritaskan kembali ke Showroom HR MOTOR Garut.',
    purpose: 'Mengamankan sumber pasokan stok mobil bekas berkualitas langsung dari tangan konsumen pertama HR MOTOR.',
  },
];

const PROSPECT_STATUSES: { label: string; value: ProspectFollowUpStatus; color: string }[] = [
  { label: 'Menunggu Mobil Ready', value: 'Menunggu Mobil Ready', color: 'bg-amber-50 text-amber-800 border-amber-300' },
  { label: 'Mobil Sudah Ready', value: 'Mobil Sudah Ready', color: 'bg-emerald-50 text-emerald-800 border-emerald-400' },
  { label: 'Sudah Dihubungi', value: 'Sudah Dihubungi', color: 'bg-blue-50 text-blue-800 border-blue-300' },
  { label: 'Tertarik', value: 'Tertarik', color: 'bg-purple-50 text-purple-800 border-purple-300' },
  { label: 'Tidak Tertarik', value: 'Tidak Tertarik', color: 'bg-charcoal-100 text-charcoal-600 border-charcoal-300' },
  { label: 'Sudah Deal', value: 'Sudah Deal', color: 'bg-gold-50 text-gold-900 border-gold-400 font-bold' },
  { label: 'Tidak Merespons', value: 'Tidak Merespons', color: 'bg-rose-50 text-rose-800 border-rose-300' },
];

export default function FollowUpPage() {
  const {
    followUps,
    stocks,
    currentUser,
    addFollowUp,
    updateFollowUp,
    deleteFollowUp,
    logFollowUpCommunication,
    addProspectFollowUp,
    updateProspectFollowUpStatus,
    formatDate,
    formatWhatsAppLink,
    formatRupiah,
  } = useCrm();

  const todayStr = new Date().toISOString().split('T')[0];

  // Main Tab State: 'customer' (Pelanggan Pembeli) vs 'prospect' (Pencari Mobil Belum Ready)
  const [activeMainTab, setActiveMainTab] = useState<'customer' | 'prospect'>('customer');

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCustomerStep, setFilterCustomerStep] = useState<string>('Semua');
  const [filterCustomerStatus, setFilterCustomerStatus] = useState<string>('Semua');
  const [filterProspectStatus, setFilterProspectStatus] = useState<string>('Semua');
  const [filterTimeTab, setFilterTimeTab] = useState<'all' | 'today' | 'overdue' | 'upcoming'>('all');

  // Modals state
  const [showAddCustomerModal, setShowAddCustomerModal] = useState(false);
  const [showAddProspectModal, setShowAddProspectModal] = useState(false);
  const [showCustomerMilestoneModal, setShowCustomerMilestoneModal] = useState(false);
  const [showProspectStatusModal, setShowProspectStatusModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<FollowUp | null>(null);

  // Form: Catat Respon Pelanggan & Maju Milestone
  const [milestoneForm, setMilestoneForm] = useState({
    operationalAnswers: {
      q1Kabar: 'Kabar baik dan sehat',
      q2Kondisi: 'Mobil dalam kondisi prima dan nyaman',
      q3Kendala: 'Tidak ada kendala',
      q4Upgrade: 'Belum ada rencana upgrade saat ini',
      q5JualKembali: 'Siap memprioritaskan HR MOTOR jika ingin jual/tukar tambah',
    },
    status: 'Sudah Dihubungi' as CustomerFollowUpStatus,
    notes: '',
    advanceStep: false,
    nextScheduledDate: '',
  });

  // Form: Tambah Calon Pelanggan Mencari Mobil (Prospect)
  const [prospectForm, setProspectForm] = useState({
    customerName: '',
    customerPhone: '',
    customerAddress: '',
    customerSource: 'Walk-in' as LeadSourceType,
    searchBrand: '',
    searchModel: '',
    searchYear: '',
    searchBudget: '',
    firstInquiryDate: todayStr,
    notes: '',
  });

  // Form: Tambah Customer Follow-up Manual
  const [manualCustomerForm, setManualCustomerForm] = useState({
    customerName: '',
    customerPhone: '',
    customerAddress: '',
    vehicleInfo: '',
    paymentType: 'Cash' as 'Cash' | 'Kredit',
    leasingPartner: 'BCA Finance',
    purchaseDate: todayStr,
    periodicStep: '1 Bulan' as '1 Bulan' | '3 Bulan' | '6 Bulan' | '1 Tahun',
    scheduledDate: todayStr,
    notes: '',
  });

  // Form: Update Status Prospek
  const [prospectStatusForm, setProspectStatusForm] = useState({
    status: 'Sudah Dihubungi' as ProspectFollowUpStatus,
    notes: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  // Detect query param ?tab=prospect or ?tab=customer
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const tabParam = new URLSearchParams(window.location.search).get('tab');
      if (tabParam === 'prospect') {
        setActiveMainTab('prospect');
      } else if (tabParam === 'customer') {
        setActiveMainTab('customer');
      }
    }
  }, []);

  // Filter Ready Stocks for matching
  const readyStocks = useMemo(() => {
    return (stocks || []).filter((s) => s.status === 'Tersedia');
  }, [stocks]);

  // Multi-attribute Match Function for Prospects
  const matchProspectWithReadyStock = (prospect: FollowUp): VehicleStock | null => {
    if (!readyStocks.length) return null;

    // 1. If explicitly linked to matchedStockId and that unit is still Tersedia
    if (prospect.matchedStockId) {
      const direct = readyStocks.find((s) => s.id === prospect.matchedStockId);
      if (direct) return direct;
    }

    const searchBrand = (prospect.searchBrand || '').trim().toLowerCase();
    const searchModel = (prospect.searchModel || '').trim().toLowerCase();
    const searchYear = Number(prospect.searchYear) || 0;
    const searchBudget = Number(prospect.searchBudget) || 0;

    // If searching using vehicleInfo string fallback
    const infoLower = (prospect.vehicleInfo || '').toLowerCase();

    for (const stock of readyStocks) {
      const stockBrand = (stock.brand || '').toLowerCase();
      const stockModel = (stock.model || '').toLowerCase();
      const stockMerk = (stock.merkType || '').toLowerCase();
      const stockYear = Number(stock.year) || 0;
      const stockPrice = Number(stock.price) || 0;

      // Brand Check
      const brandMatch =
        (searchBrand && (stockBrand.includes(searchBrand) || searchBrand.includes(stockBrand))) ||
        (infoLower && stockBrand && infoLower.includes(stockBrand));

      if (!brandMatch && searchBrand) continue;

      // Model Check: all meaningful spec tokens must match
      let modelMatch = true;
      const fullStockDesc = `${stockBrand} ${stockModel} ${stockMerk}`.toLowerCase();
      if (searchModel) {
        const modelKeywords = searchModel
          .split(/[\s,-]+/)
          .map((k) => k.trim().toLowerCase())
          .filter((k) => k.length >= 2 && !searchBrand.includes(k) && !stockBrand.includes(k));
        modelMatch = modelKeywords.length > 0
          ? modelKeywords.every((k) => fullStockDesc.includes(k))
          : true;
      } else if (infoLower) {
        modelMatch = stockModel ? infoLower.includes(stockModel) : true;
      }

      if (!modelMatch && searchModel) continue;

      // Year Check (±1 year tolerance)
      let yearMatch = true;
      if (searchYear > 0 && stockYear > 0) {
        yearMatch = Math.abs(stockYear - searchYear) <= 1;
      }
      if (!yearMatch) continue;

      // Budget Check (within budget +15% tolerance)
      let budgetMatch = true;
      if (searchBudget > 0 && stockPrice > 0) {
        budgetMatch = stockPrice <= searchBudget * 1.15;
      }
      if (!budgetMatch) continue;

      // If all passed criteria match!
      return stock;
    }

    return null;
  };

  // Separate Lists
  const customerFollowUps = useMemo(() => {
    return followUps.filter(
      (f) =>
        f.followUpType === 'CUSTOMER' ||
        f.category === 'Pelanggan Lama (1 Tahun)' ||
        (!f.followUpType && f.category !== 'Unit yang Dicari Sudah Tersedia' && f.category !== 'Prospek Tidak Jadi (1 Bulan)')
    );
  }, [followUps]);

  const prospectFollowUps = useMemo(() => {
    return followUps.filter(
      (f) =>
        f.followUpType === 'PROSPECT' ||
        f.category === 'Unit yang Dicari Sudah Tersedia' ||
        f.category === 'Prospek Tidak Jadi (1 Bulan)'
    );
  }, [followUps]);

  // Tab 1 (Customer) KPI Metrics
  const customerStats = useMemo(() => {
    const total = customerFollowUps.length;
    const today = customerFollowUps.filter(
      (f) => f.scheduledDate === todayStr && f.status !== 'Selesai'
    ).length;
    const overdue = customerFollowUps.filter(
      (f) => f.scheduledDate < todayStr && f.status !== 'Selesai'
    ).length;
    const step1Bulan = customerFollowUps.filter(
      (f) => (f.periodicStep || '1 Bulan') === '1 Bulan' && f.status !== 'Selesai'
    ).length;
    const step3Bulan = customerFollowUps.filter((f) => f.periodicStep === '3 Bulan').length;
    const step6Bulan = customerFollowUps.filter((f) => f.periodicStep === '6 Bulan').length;
    const step1Tahun = customerFollowUps.filter((f) => f.periodicStep === '1 Tahun').length;
    const selesai = customerFollowUps.filter((f) => f.status === 'Selesai').length;

    return { total, today, overdue, step1Bulan, step3Bulan, step6Bulan, step1Tahun, selesai };
  }, [customerFollowUps, todayStr]);

  // Tab 2 (Prospect) KPI Metrics & Matched Map
  const { prospectStats, matchedProspectMap } = useMemo(() => {
    const map = new Map<string, VehicleStock | null>();
    let matchedCount = 0;
    let waitingCount = 0;
    let contactedCount = 0;
    let dealCount = 0;

    for (const p of prospectFollowUps) {
      const match = matchProspectWithReadyStock(p);
      map.set(p.id, match);
      if (match) {
        matchedCount++;
      } else {
        waitingCount++;
      }

      if (p.status === 'Sudah Deal' || p.status === 'Berhasil Transaksi') {
        dealCount++;
      } else if (p.status === 'Sudah Dihubungi') {
        contactedCount++;
      }
    }

    return {
      prospectStats: {
        total: prospectFollowUps.length,
        matched: matchedCount,
        waiting: waitingCount,
        contacted: contactedCount,
        deal: dealCount,
      },
      matchedProspectMap: map,
    };
  }, [prospectFollowUps, readyStocks]);

  // Filtered Customer Follow-ups
  const filteredCustomerList = useMemo(() => {
    return customerFollowUps.filter((item) => {
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = (item.customerName || '').toLowerCase().includes(q);
        const matchPhone = (item.customerPhone || '').includes(q);
        const matchUnit = (item.vehicleInfo || '').toLowerCase().includes(q);
        const matchNotes = (item.notes || '').toLowerCase().includes(q);
        const matchResult = (item.resultNotes || '').toLowerCase().includes(q);
        if (!matchName && !matchPhone && !matchUnit && !matchNotes && !matchResult) {
          return false;
        }
      }

      // Step Filter
      if (filterCustomerStep !== 'Semua') {
        const currentStep = item.periodicStep || '1 Bulan';
        if (currentStep !== filterCustomerStep) return false;
      }

      // Status Filter
      if (filterCustomerStatus !== 'Semua') {
        if (item.status !== filterCustomerStatus) return false;
      }

      // Time Tab Filter
      const sDate = item.scheduledDate || '';
      if (filterTimeTab === 'today') {
        return sDate === todayStr && item.status !== 'Selesai';
      }
      if (filterTimeTab === 'overdue') {
        return sDate !== '' && sDate < todayStr && item.status !== 'Selesai';
      }
      if (filterTimeTab === 'upcoming') {
        return sDate > todayStr && item.status !== 'Selesai';
      }

      return true;
    });
  }, [customerFollowUps, searchQuery, filterCustomerStep, filterCustomerStatus, filterTimeTab, todayStr]);

  // Filtered Prospect Follow-ups
  const filteredProspectList = useMemo(() => {
    return prospectFollowUps.filter((item) => {
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = (item.customerName || '').toLowerCase().includes(q);
        const matchPhone = (item.customerPhone || '').includes(q);
        const matchBrand = (item.searchBrand || '').toLowerCase().includes(q);
        const matchModel = (item.searchModel || '').toLowerCase().includes(q);
        const matchUnit = (item.vehicleInfo || '').toLowerCase().includes(q);
        const matchNotes = (item.notes || '').toLowerCase().includes(q);
        if (!matchName && !matchPhone && !matchBrand && !matchModel && !matchUnit && !matchNotes) {
          return false;
        }
      }

      // Prospect Status Filter
      if (filterProspectStatus !== 'Semua') {
        if (filterProspectStatus === 'Mobil Sudah Ready') {
          const isMatched = !!matchedProspectMap.get(item.id);
          if (!isMatched) return false;
        } else if (filterProspectStatus === 'Menunggu Mobil Ready') {
          const isMatched = !!matchedProspectMap.get(item.id);
          if (isMatched || item.status === 'Sudah Deal') return false;
        } else {
          if (item.status !== filterProspectStatus && item.prospectStatus !== filterProspectStatus) {
            return false;
          }
        }
      }

      return true;
    });
  }, [prospectFollowUps, searchQuery, filterProspectStatus, matchedProspectMap]);

  // Pre-filled WhatsApp message for Customer Follow-up (5 Pertanyaan Showroom)
  const getCustomerWhatsAppMessage = (item: FollowUp): string => {
    const custName = item.customerName || 'Bapak/Ibu';
    const unitName = item.vehicleInfo || 'mobil idaman';
    const step = item.periodicStep || '1 Bulan';

    return `Halo Bapak/Ibu ${custName}, salam hangat dan hormat dari Tim Showroom HR MOTOR Garut 🙏

Semoga Bapak/Ibu sekeluarga selalu dalam keadaan sehat dan berkah. Kami dari Showroom HR MOTOR ingin menanyakan kabar dan kepuasan Bapak/Ibu setelah menggunakan unit ${unitName} (Follow-up berkala ${step}):

1. Bagaimana kabarnya Bapak/Ibu sekeluarga hari ini?
2. Bagaimana kondisi dan performa mobil setelah beberapa waktu digunakan?
3. Apakah ada kendala, keluhan, atau kebutuhan servis pada kendaraan saat ini?
4. Apakah ada rencana untuk upgrade atau menambah unit kendaraan keluarga dalam waktu dekat?
5. Apabila suatu saat Bapak/Ibu berencana menjual kembali kendaraan tersebut, mohon diprioritaskan kembali ke Showroom HR MOTOR Garut ya. Kami siap memberikan penawaran harga terbaik.

Kenyamanan dan kepuasan Bapak/Ibu adalah prioritas utama kami. Terima kasih banyak atas kepercayaan Bapak/Ibu kepada HR MOTOR Garut! 🙏`;
  };

  // Pre-filled WhatsApp message for Prospect Follow-up
  const getProspectWhatsAppMessage = (item: FollowUp, matchedStock?: VehicleStock | null): string => {
    const custName = item.customerName || 'Bapak/Ibu';

    if (matchedStock) {
      const brand = matchedStock.brand;
      const model = matchedStock.model;
      const year = matchedStock.year;
      const plate = matchedStock.licensePlate || matchedStock.plateNumber || '-';
      const priceStr = matchedStock.price ? `Rp ${matchedStock.price.toLocaleString('id-ID')}` : '-';

      return `Halo Bapak/Ibu ${custName}, kabar gembira dari Showroom HR MOTOR Garut! 🎉

Unit mobil yang sebelumnya Bapak/Ibu cari:
🚘 ${brand} ${model} Tahun ${year}
Plat: ${plate}
Harga: ${priceStr}
Warna: ${matchedStock.color || '-'} • Transmisi: ${matchedStock.transmission || '-'}

Saat ini SUDAH READY dan TERSEDIA di Showroom HR MOTOR Garut dengan kondisi istimewa, mulus, terawat, dan bergaransi!

Mengingat unit ini banyak peminatnya, silakan hubungi kami segera jika Bapak/Ibu ingin cek unit langsung ke showroom atau reservasi test drive. Terima kasih banyak 🙏`;
    }

    const searchUnit =
      `${item.searchBrand || ''} ${item.searchModel || ''} ${item.searchYear ? `(${item.searchYear})` : ''}`.trim() ||
      item.vehicleInfo ||
      'mobil idaman';

    return `Halo Bapak/Ibu ${custName}, salam hangat dari Showroom HR MOTOR Garut 🙏

Kami dari tim HR MOTOR ingin mengabarkan bahwa kami sedang terus memantau dan mencarikan unit ${searchUnit} sesuai kriteria yang Bapak/Ibu cari.

Apakah saat ini Bapak/Ibu masih aktif mencari unit tersebut? Begitu ada unit istimewa yang baru masuk ke showroom kami, Bapak/Ibu akan menjadi prioritas utama yang langsung kami kabari. Terima kasih 🙏`;
  };

  // Open Customer Milestone Modal
  const handleOpenCustomerMilestoneModal = (item: FollowUp) => {
    setSelectedItem(item);
    const currentStep = item.periodicStep || '1 Bulan';
    let nextStepDate = '';
    const baseDate = new Date();

    if (currentStep === '1 Bulan') {
      baseDate.setDate(baseDate.getDate() + 60); // +2 months to reach 3rd month
    } else if (currentStep === '3 Bulan') {
      baseDate.setDate(baseDate.getDate() + 90); // +3 months to reach 6th month
    } else if (currentStep === '6 Bulan') {
      baseDate.setDate(baseDate.getDate() + 180); // +6 months to reach 1 year
    }
    nextStepDate = baseDate.toISOString().split('T')[0];

    setMilestoneForm({
      operationalAnswers: {
        q1Kabar: 'Kabar baik dan sehat',
        q2Kondisi: 'Mobil dalam kondisi sangat prima dan nyaman digunakan harian',
        q3Kendala: 'Tidak ada kendala pada mesin maupun kelistrikan',
        q4Upgrade: 'Belum berencana upgrade saat ini',
        q5JualKembali: 'Sepakat memprioritaskan HR MOTOR bila ingin jual / trade-in',
      },
      status: 'Sudah Dihubungi',
      notes: item.notes || '',
      advanceStep: currentStep !== '1 Tahun',
      nextScheduledDate: nextStepDate,
    });
    setFormError('');
    setShowCustomerMilestoneModal(true);
  };

  // Open Prospect Status Modal
  const handleOpenProspectStatusModal = (item: FollowUp) => {
    setSelectedItem(item);
    setProspectStatusForm({
      status: (item.prospectStatus || item.status || 'Sudah Dihubungi') as ProspectFollowUpStatus,
      notes: '',
    });
    setFormError('');
    setShowProspectStatusModal(true);
  };

  // Submit Customer Milestone
  const handleSubmitCustomerMilestone = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem) return;

    setIsSubmitting(true);
    setFormError('');

    try {
      const currentStep = selectedItem.periodicStep || '1 Bulan';
      let nextStep: '1 Bulan' | '3 Bulan' | '6 Bulan' | '1 Tahun' = currentStep;
      let newStatus: CustomerFollowUpStatus = milestoneForm.status;

      if (milestoneForm.advanceStep) {
        if (currentStep === '1 Bulan') nextStep = '3 Bulan';
        else if (currentStep === '3 Bulan') nextStep = '6 Bulan';
        else if (currentStep === '6 Bulan') nextStep = '1 Tahun';
        else if (currentStep === '1 Tahun') {
          newStatus = 'Selesai';
        }
      }

      const summaryAnswers = `[Jawaban 5 Pertanyaan Operasional]:\n1. Kabar: ${milestoneForm.operationalAnswers.q1Kabar}\n2. Kondisi: ${milestoneForm.operationalAnswers.q2Kondisi}\n3. Kendala: ${milestoneForm.operationalAnswers.q3Kendala}\n4. Upgrade: ${milestoneForm.operationalAnswers.q4Upgrade}\n5. Jual Kembali: ${milestoneForm.operationalAnswers.q5JualKembali}`;

      const fullNotes = milestoneForm.notes.trim()
        ? `${milestoneForm.notes.trim()}\n\n${summaryAnswers}`
        : summaryAnswers;

      const res = await updateFollowUp({
        id: selectedItem.id,
        status: newStatus,
        periodicStep: nextStep,
        scheduledDate: milestoneForm.advanceStep && milestoneForm.nextScheduledDate ? milestoneForm.nextScheduledDate : selectedItem.scheduledDate,
        resultNotes: fullNotes,
        lastContactDate: new Date().toISOString(),
      });

      if (res.success) {
        // Also log into communication history
        await logFollowUpCommunication({
          id: selectedItem.id,
          outcome: newStatus,
          status: newStatus,
          notes: fullNotes,
        });

        setShowCustomerMilestoneModal(false);
        setSelectedItem(null);
      } else {
        setFormError(res.error || 'Gagal memperbarui data follow-up');
      }
    } catch {
      setFormError('Terjadi kesalahan saat menyimpan data');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Submit Add Prospect Follow-up
  const handleSubmitAddProspect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prospectForm.customerName.trim() || !prospectForm.customerPhone.trim() || !prospectForm.searchBrand.trim()) {
      setFormError('Nama calon pembeli, nomor WhatsApp, dan merk mobil yang dicari wajib diisi');
      return;
    }

    setIsSubmitting(true);
    setFormError('');

    try {
      const res = await addProspectFollowUp({
        customerName: prospectForm.customerName.trim(),
        customerPhone: prospectForm.customerPhone.trim(),
        customerAddress: prospectForm.customerAddress.trim(),
        customerSource: prospectForm.customerSource,
        searchBrand: prospectForm.searchBrand.trim(),
        searchModel: prospectForm.searchModel.trim(),
        searchYear: prospectForm.searchYear ? Number(prospectForm.searchYear) : undefined,
        searchBudget: prospectForm.searchBudget ? Number(prospectForm.searchBudget) : undefined,
        firstInquiryDate: prospectForm.firstInquiryDate,
        notes: prospectForm.notes.trim(),
      });

      if (res.success) {
        setShowAddProspectModal(false);
        setProspectForm({
          customerName: '',
          customerPhone: '',
          customerAddress: '',
          customerSource: 'Walk-in',
          searchBrand: '',
          searchModel: '',
          searchYear: '',
          searchBudget: '',
          firstInquiryDate: todayStr,
          notes: '',
        });
      } else {
        setFormError(res.error || 'Gagal menyimpan calon pembeli');
      }
    } catch {
      setFormError('Terjadi kesalahan koneksi');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Submit Add Manual Customer Follow-up
  const handleSubmitAddCustomerManual = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualCustomerForm.customerName.trim() || !manualCustomerForm.customerPhone.trim() || !manualCustomerForm.vehicleInfo.trim()) {
      setFormError('Nama pembeli, WhatsApp, dan unit mobil wajib diisi');
      return;
    }

    setIsSubmitting(true);
    setFormError('');

    try {
      const res = await addFollowUp({
        followUpType: 'CUSTOMER',
        customerName: manualCustomerForm.customerName.trim(),
        customerPhone: manualCustomerForm.customerPhone.trim(),
        customerAddress: manualCustomerForm.customerAddress.trim(),
        vehicleInfo: manualCustomerForm.vehicleInfo.trim(),
        paymentType: manualCustomerForm.paymentType,
        leasingPartner: manualCustomerForm.paymentType === 'Kredit' ? manualCustomerForm.leasingPartner : undefined,
        purchaseDate: manualCustomerForm.purchaseDate,
        periodicStep: manualCustomerForm.periodicStep,
        scheduledDate: manualCustomerForm.scheduledDate,
        status: 'Belum Dihubungi',
        priority: 'Tinggi',
        channel: 'WhatsApp',
        category: 'Pelanggan Lama (1 Tahun)',
        followUpReason: `Follow-up berkala kepuasan pembeli ${manualCustomerForm.periodicStep} (5 Pertanyaan Operasional)`,
        notes: manualCustomerForm.notes.trim(),
      });

      if (res.success) {
        setShowAddCustomerModal(false);
      } else {
        setFormError(res.error || 'Gagal menambahkan follow-up pembeli');
      }
    } catch {
      setFormError('Terjadi kesalahan koneksi');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Submit Update Prospect Status
  const handleSubmitProspectStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem) return;

    setIsSubmitting(true);
    setFormError('');

    try {
      const res = await updateProspectFollowUpStatus(
        selectedItem.id,
        prospectStatusForm.status,
        prospectStatusForm.notes.trim()
      );

      if (res.success) {
        setShowProspectStatusModal(false);
        setSelectedItem(null);
      } else {
        setFormError(res.error || 'Gagal memperbarui status prospek');
      }
    } catch {
      setFormError('Terjadi kesalahan koneksi');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 pb-16">
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 crm-card p-4 sm:p-6">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-[#FDF8ED] text-gold-800 flex items-center justify-center shadow-xs border border-gold-300 shrink-0">
              <CalendarClock className="w-5 h-5 sm:w-6 sm:h-6 text-gold-600" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl lg:text-2xl font-black tracking-tight text-charcoal-900">
                  Tindak Lanjut &amp; Hubungan Konsumen
                </h1>
                <span className="badge-gold">HR MOTOR Garut</span>
              </div>
              <p className="text-xs text-charcoal-500 mt-0.5">
                Sistem Terpadu: Tindak Lanjut Berkala Pembeli (1 Tahun) &amp; Pencocokan Otomatis Calon Pembeli Cari Mobil
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 w-full md:w-auto">
          {activeMainTab === 'customer' ? (
            <button
              onClick={() => {
                setManualCustomerForm({
                  customerName: '',
                  customerPhone: '',
                  customerAddress: '',
                  vehicleInfo: '',
                  paymentType: 'Cash',
                  leasingPartner: 'BCA Finance',
                  purchaseDate: todayStr,
                  periodicStep: '1 Bulan',
                  scheduledDate: todayStr,
                  notes: '',
                });
                setFormError('');
                setShowAddCustomerModal(true);
              }}
              className="btn-gold inline-flex items-center justify-center gap-2 text-xs shadow-md w-full md:w-auto py-2.5"
            >
              <Plus className="w-4 h-4" />
              <span>Jadwalkan Tindak Lanjut Pembeli Baru</span>
            </button>
          ) : (
            <button
              onClick={() => {
                setProspectForm({
                  customerName: '',
                  customerPhone: '',
                  customerAddress: '',
                  customerSource: 'Walk-in',
                  searchBrand: '',
                  searchModel: '',
                  searchYear: '',
                  searchBudget: '',
                  firstInquiryDate: todayStr,
                  notes: '',
                });
                setFormError('');
                setShowAddProspectModal(true);
              }}
              className="btn-gold inline-flex items-center justify-center gap-2 text-xs shadow-md w-full md:w-auto py-2.5"
            >
              <Plus className="w-4 h-4" />
              <span>+ Catat Calon Pelanggan Cari Mobil</span>
            </button>
          )}
        </div>
      </div>

      {/* SUB-NAVIGATION TABS (2 DEDICATED TABS) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* TAB 1: CUSTOMER FOLLOW UP */}
        <button
          onClick={() => {
            setActiveMainTab('customer');
            setSearchQuery('');
          }}
          className={`p-3.5 sm:p-4 rounded-2xl border text-left transition-all relative overflow-hidden flex items-start gap-3 sm:gap-4 ${
            activeMainTab === 'customer'
              ? 'bg-[#FDF8ED] text-charcoal-900 border-2 border-gold-400 shadow-sm'
              : 'bg-white text-charcoal-800 border-[#EAE8E3] hover:border-gold-300 hover:bg-[#FAF9F5]'
          }`}
        >
          <div
            className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
              activeMainTab === 'customer'
                ? 'bg-gold-500 text-charcoal-950 font-bold shadow-md'
                : 'bg-gold-50 text-gold-700 border border-gold-200'
            }`}
          >
            <Users className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <span className={`text-[10px] font-bold uppercase tracking-wider ${activeMainTab === 'customer' ? 'text-gold-800' : 'text-gold-700'}`}>
                Tab 1 • Pasca-Penjualan
              </span>
              <div className="flex items-center gap-1.5">
                {customerStats.overdue > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-500 text-white animate-pulse">
                    {customerStats.overdue} Terlambat
                  </span>
                )}
                <span
                  className={`px-2.5 py-0.5 rounded-full text-xs font-black ${
                    activeMainTab === 'customer' ? 'bg-gold-200 text-gold-950' : 'bg-charcoal-100 text-charcoal-800'
                  }`}
                >
                  {customerFollowUps.length} Pelanggan
                </span>
              </div>
            </div>
            <h2 className="text-base font-black tracking-tight mt-0.5 text-charcoal-950">
              Customer Follow Up (Pelanggan Pembeli)
            </h2>
            <p className={`text-xs mt-1 leading-relaxed ${activeMainTab === 'customer' ? 'text-charcoal-600' : 'text-charcoal-500'}`}>
              Jadwal berkala 1 tahun (1 Bulan, 3 Bulan, 6 Bulan, 1 Tahun) & WhatsApp 5 pertanyaan operasional showroom resmi.
            </p>
          </div>
        </button>

        {/* TAB 2: PROSPECT FOLLOW UP */}
        <button
          onClick={() => {
            setActiveMainTab('prospect');
            setSearchQuery('');
          }}
          className={`p-3.5 sm:p-4 rounded-2xl border text-left transition-all relative overflow-hidden flex items-start gap-3 sm:gap-4 ${
            activeMainTab === 'prospect'
              ? 'bg-[#FDF8ED] text-charcoal-900 border-2 border-gold-400 shadow-sm'
              : 'bg-white text-charcoal-800 border-[#EAE8E3] hover:border-gold-300 hover:bg-[#FAF9F5]'
          }`}
        >
          <div
            className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
              activeMainTab === 'prospect'
                ? 'bg-gold-500 text-charcoal-950 font-bold shadow-md'
                : 'bg-amber-50 text-amber-700 border border-amber-200'
            }`}
          >
            <Sparkles className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between flex-wrap gap-1">
              <span className={`text-[10px] font-bold uppercase tracking-wider ${activeMainTab === 'prospect' ? 'text-gold-400' : 'text-amber-700'}`}>
                Tab 2 • Smart Auto-Matching
              </span>
              <div className="flex items-center gap-1.5">
                {prospectStats.matched > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-500 text-white shadow-sm flex items-center gap-1">
                    <Flame className="w-3 h-3 text-gold-300" /> {prospectStats.matched} Unit Ready!
                  </span>
                )}
                <span
                  className={`px-2.5 py-0.5 rounded-full text-xs font-black ${
                    activeMainTab === 'prospect' ? 'bg-white/20 text-white' : 'bg-charcoal-100 text-charcoal-800'
                  }`}
                >
                  {prospectFollowUps.length} Calon
                </span>
              </div>
            </div>
            <h2 className={`text-base font-black tracking-tight mt-0.5 ${activeMainTab === 'prospect' ? 'text-white' : 'text-charcoal-950'}`}>
              Prospect Follow Up (Pencari Mobil Belum Ready)
            </h2>
            <p className={`text-xs mt-1 leading-relaxed ${activeMainTab === 'prospect' ? 'text-charcoal-300' : 'text-charcoal-500'}`}>
              Catat calon pembeli yang mencari mobil tertentu saat stok kosong & auto multi-attribute matching saat unit masuk ready!
            </p>
          </div>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* SECTION VIEW TAB 1: CUSTOMER FOLLOW UP (PELANGGAN PEMBELI)                 */}
      {/* ========================================================================= */}
      {activeMainTab === 'customer' && (
        <div className="space-y-5 animate-in fade-in duration-200">
          {/* KPI METRICS ROW FOR CUSTOMER FOLLOW UP */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2 sm:gap-3">
            <div className="crm-card p-2.5 sm:p-3">
              <span className="text-[10px] font-bold uppercase text-charcoal-400">Total Pembeli</span>
              <div className="text-xl font-black text-charcoal-900 mt-0.5">{customerStats.total}</div>
              <span className="text-[10px] text-charcoal-500 truncate block">Database aktif</span>
            </div>
            <div className="crm-card p-2.5 sm:p-3 border-l-4 border-l-amber-500">
              <span className="text-[10px] font-bold uppercase text-amber-700 flex items-center gap-1">
                <Clock className="w-3 h-3 text-amber-500 shrink-0" /> Hari Ini
              </span>
              <div className="text-xl font-black text-amber-600 mt-0.5">{customerStats.today}</div>
              <span className="text-[10px] text-amber-700 font-medium truncate block">Jadwal kontak</span>
            </div>
            <div className="crm-card p-2.5 sm:p-3 border-l-4 border-l-rose-500">
              <span className="text-[10px] font-bold uppercase text-rose-600 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3 text-rose-500 shrink-0" /> Terlambat
              </span>
              <div className="text-xl font-black text-rose-600 mt-0.5">{customerStats.overdue}</div>
              <span className="text-[10px] text-rose-500 font-medium truncate block">Lewat jadwal</span>
            </div>
            <div className="crm-card p-2.5 sm:p-3">
              <span className="text-[10px] font-bold uppercase text-charcoal-400">Tahap 1 Bulan</span>
              <div className="text-xl font-black text-charcoal-800 mt-0.5">{customerStats.step1Bulan}</div>
              <span className="text-[10px] text-charcoal-500 truncate block">Kondisi awal</span>
            </div>
            <div className="crm-card p-2.5 sm:p-3">
              <span className="text-[10px] font-bold uppercase text-charcoal-400">Tahap 3 Bulan</span>
              <div className="text-xl font-black text-charcoal-800 mt-0.5">{customerStats.step3Bulan}</div>
              <span className="text-[10px] text-charcoal-500 truncate block">Servis & garansi</span>
            </div>
            <div className="crm-card p-2.5 sm:p-3">
              <span className="text-[10px] font-bold uppercase text-charcoal-400">Tahap 6 Bulan</span>
              <div className="text-xl font-black text-charcoal-800 mt-0.5">{customerStats.step6Bulan}</div>
              <span className="text-[10px] text-charcoal-500 truncate block">Evaluasi rutin</span>
            </div>
            <div className="crm-card p-2.5 sm:p-3">
              <span className="text-[10px] font-bold uppercase text-charcoal-400">Tahap 1 Tahun</span>
              <div className="text-xl font-black text-charcoal-800 mt-0.5">{customerStats.step1Tahun}</div>
              <span className="text-[10px] text-gold-700 font-medium truncate block">Tukar tambah</span>
            </div>
            <div className="crm-card p-2.5 sm:p-3 border-l-4 border-l-emerald-500">
              <span className="text-[10px] font-bold uppercase text-emerald-700 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0" /> Selesai
              </span>
              <div className="text-xl font-black text-emerald-700 mt-0.5">{customerStats.selesai}</div>
              <span className="text-[10px] text-emerald-600 font-medium truncate block">Siklus tuntas</span>
            </div>
          </div>

          {/* Urgent Admin Follow-Up Reminder Banner */}
          {(customerStats.today > 0 || customerStats.overdue > 0) && (
            <div className="p-3.5 sm:p-4 rounded-xl bg-gradient-to-r from-amber-500/15 via-rose-500/10 to-amber-500/15 border-2 border-amber-400 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-start sm:items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500 text-charcoal-950 flex items-center justify-center shrink-0 shadow-xs font-black">
                  <AlertTriangle className="w-5 h-5 text-charcoal-950 animate-bounce" />
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-black text-charcoal-900 flex items-center gap-2 flex-wrap">
                    <span>PENGINGAT JADWAL FOLLOW-UP KONSUMEN</span>
                    {customerStats.overdue > 0 && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-600 text-white animate-pulse">
                        {customerStats.overdue} Terlambat
                      </span>
                    )}
                    {customerStats.today > 0 && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-600 text-white">
                        {customerStats.today} Hari Ini
                      </span>
                    )}
                  </h4>
                  <p className="text-[11px] text-charcoal-700 mt-0.5">
                    Sudah waktunya menghubungi konsumen pembeli untuk pengecekan berkala 1 tahun. Klik tombol WhatsApp untuk mengirim 5 pertanyaan kepuasan showroom.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
                {customerStats.today > 0 && (
                  <button
                    onClick={() => setFilterTimeTab('today')}
                    className="flex-1 sm:flex-initial px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition-all shadow-2xs text-center"
                  >
                    Hari Ini ({customerStats.today})
                  </button>
                )}
                {customerStats.overdue > 0 && (
                  <button
                    onClick={() => setFilterTimeTab('overdue')}
                    className="flex-1 sm:flex-initial px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all shadow-2xs text-center"
                  >
                    Terlambat ({customerStats.overdue})
                  </button>
                )}
              </div>
            </div>
          )}

          {/* FILTER & SEARCH BAR */}
          <div className="crm-card p-3.5 sm:p-4 space-y-3">
            {/* Time Filter Pills */}
            <div className="flex items-center gap-1.5 border-b border-[#EAE8E3] pb-3 overflow-x-auto max-w-full">
              <button
                onClick={() => setFilterTimeTab('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 cursor-pointer ${
                  filterTimeTab === 'all'
                    ? 'bg-gold-500 text-charcoal-950 shadow-xs'
                    : 'text-charcoal-600 hover:text-charcoal-900 hover:bg-[#FAF9F5]'
                }`}
              >
                Semua ({customerFollowUps.length})
              </button>
              <button
                onClick={() => setFilterTimeTab('today')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
                  filterTimeTab === 'today'
                    ? 'bg-amber-500 text-charcoal-950 shadow-xs'
                    : 'text-charcoal-600 hover:text-amber-800 hover:bg-amber-50'
                }`}
              >
                <Clock className="w-3.5 h-3.5 text-amber-700" />
                Hari Ini ({customerStats.today})
              </button>
              <button
                onClick={() => setFilterTimeTab('overdue')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
                  filterTimeTab === 'overdue'
                    ? 'bg-rose-500 text-white shadow-xs'
                    : 'text-charcoal-600 hover:text-rose-800 hover:bg-rose-50'
                }`}
              >
                <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
                Terlambat ({customerStats.overdue})
              </button>
              <button
                onClick={() => setFilterTimeTab('upcoming')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 cursor-pointer ${
                  filterTimeTab === 'upcoming'
                    ? 'bg-gold-500 text-charcoal-950 shadow-xs'
                    : 'text-charcoal-600 hover:text-charcoal-900 hover:bg-[#FAF9F5]'
                }`}
              >
                Mendatang
              </button>
            </div>

            {/* Filter Dropdowns & Search Input */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-3">
              <div className="sm:col-span-2 relative">
                <Search className="w-4 h-4 text-charcoal-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Cari nama pembeli, nomor WA, mobil, plat, atau catatan..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-[#FAF9F5] border border-[#EAE8E3] rounded-xl text-xs text-charcoal-900 placeholder-charcoal-400 focus:outline-none focus:border-gold-500"
                />
              </div>

              <div>
                <select
                  value={filterCustomerStep}
                  onChange={(e) => setFilterCustomerStep(e.target.value)}
                  className="w-full px-3 py-2 bg-[#FAF9F5] border border-[#EAE8E3] rounded-xl text-xs text-charcoal-900 focus:outline-none focus:border-gold-500"
                >
                  <option value="Semua">Semua Milestone (1 Bln - 1 Thn)</option>
                  {CUSTOMER_PERIODIC_STEPS.map((s) => (
                    <option key={s} value={s}>
                      Tahap: {s}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <select
                  value={filterCustomerStatus}
                  onChange={(e) => setFilterCustomerStatus(e.target.value)}
                  className="w-full px-3 py-2 bg-[#FAF9F5] border border-[#EAE8E3] rounded-xl text-xs text-charcoal-900 focus:outline-none focus:border-gold-500"
                >
                  <option value="Semua">Semua Status Kontak</option>
                  <option value="Belum Dihubungi">Belum Dihubungi</option>
                  <option value="Sudah Dihubungi">Sudah Dihubungi</option>
                  <option value="Tidak Merespons">Tidak Merespons</option>
                  <option value="Selesai">Selesai (Siklus Tuntas)</option>
                </select>
              </div>
            </div>
          </div>

          {/* MOBILE CARDS: CUSTOMER FOLLOW UP (HP screens < 768px) */}
          <div className="space-y-3.5 md:hidden">
            {filteredCustomerList.length === 0 ? (
              <div className="crm-card p-8 text-center text-charcoal-400">
                <Users className="w-10 h-10 mx-auto text-charcoal-300 mb-2 stroke-[1.5]" />
                <p className="text-sm font-bold text-charcoal-700">Tidak ada data jadwal follow-up pembeli</p>
                <p className="text-xs text-charcoal-400 mt-1">
                  Data otomatis bertambah saat ada transaksi penjualan cash atau ACC kredit mobil.
                </p>
              </div>
            ) : (
              filteredCustomerList.map((item, idx) => {
                const isOverdue = item.scheduledDate < todayStr && item.status !== 'Selesai';
                const isToday = item.scheduledDate === todayStr && item.status !== 'Selesai';
                const step = item.periodicStep || '1 Bulan';

                return (
                  <div
                    key={item.id}
                    className={`crm-card p-4 space-y-3 border transition-all ${
                      isOverdue
                        ? 'border-rose-300 bg-gradient-to-r from-rose-50/30 via-white to-white'
                        : isToday
                        ? 'border-amber-300 bg-gradient-to-r from-amber-50/30 via-white to-white'
                        : 'border-[#EAE8E3]'
                    }`}
                  >
                    {/* Top Row: Customer Name, Milestone Pill & Status Badge */}
                    <div className="flex items-start justify-between gap-2 border-b border-[#EAE8E3] pb-2.5">
                      <div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h4 className="font-bold text-sm text-charcoal-900">{item.customerName}</h4>
                          <span className="text-[10px] text-charcoal-400 font-mono">#{idx + 1}</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-charcoal-500 mt-0.5">
                          <a
                            href={formatWhatsAppLink(item.customerPhone, getCustomerWhatsAppMessage(item))}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-mono font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
                          >
                            <Phone className="w-3 h-3 text-emerald-600" />
                            <span>{item.customerPhone || '-'}</span>
                          </a>
                          <span>•</span>
                          <span className="text-[11px] truncate max-w-[140px]">{item.customerAddress || 'Garut / Jabar'}</span>
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-1 shrink-0">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                          <BadgeCheck className="w-3 h-3 text-amber-700" />
                          <span>{step}</span>
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[9px] font-bold border ${
                            item.status === 'Selesai'
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                              : item.status === 'Sudah Dihubungi'
                              ? 'bg-blue-50 text-blue-800 border-blue-300'
                              : item.status === 'Tidak Merespons'
                              ? 'bg-rose-50 text-rose-700 border-rose-200'
                              : 'bg-charcoal-100 text-charcoal-700 border-charcoal-200'
                          }`}
                        >
                          {item.status}
                        </span>
                      </div>
                    </div>

                    {/* Vehicle & Payment Info */}
                    <div className="flex items-center justify-between text-xs bg-[#FAF9F5] p-2.5 rounded-xl border border-[#EAE8E3]">
                      <div className="flex items-center gap-2 min-w-0">
                        <Car className="w-4 h-4 text-gold-600 shrink-0" />
                        <div className="min-w-0">
                          <p className="font-bold text-charcoal-900 truncate text-xs">{item.vehicleInfo || 'Mobil Showroom'}</p>
                          {item.purchaseDate && (
                            <p className="text-[10px] text-charcoal-500">Beli: {formatDate(item.purchaseDate)}</p>
                          )}
                        </div>
                      </div>
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold shrink-0 ${
                          item.paymentType === 'Cash'
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                            : 'bg-blue-50 text-blue-800 border border-blue-200'
                        }`}
                      >
                        {item.paymentType === 'Cash' ? <DollarSign className="w-3 h-3" /> : <CreditCard className="w-3 h-3" />}
                        <span>{item.paymentType || 'Cash'} {item.leasingPartner ? `(${item.leasingPartner})` : ''}</span>
                      </span>
                    </div>

                    {/* Schedule status */}
                    <div className="flex items-center justify-between text-xs px-1">
                      <span className="text-[11px] text-charcoal-500 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-gold-600" />
                        Jadwal: <strong className="text-charcoal-800">{formatDate(item.scheduledDate)}</strong>
                      </span>
                      {isOverdue && (
                        <span className="px-2 py-0.5 text-[10px] font-black bg-rose-100 text-rose-700 rounded-md border border-rose-200 animate-pulse">
                          Lewat Jadwal
                        </span>
                      )}
                      {isToday && (
                        <span className="px-2 py-0.5 text-[10px] font-black bg-amber-100 text-amber-800 rounded-md border border-amber-200">
                          Jadwal Hari Ini
                        </span>
                      )}
                    </div>

                    {/* 5 Questions Checklist Preview Box */}
                    <div className="bg-[#FCFBF9] p-2.5 rounded-xl border border-[#EAE8E3] text-[11px] space-y-1.5">
                      <div className="flex items-center justify-between text-charcoal-600 font-bold text-[10px] uppercase tracking-wider">
                        <span>Checklist 5 Pertanyaan SOP 1 Tahun:</span>
                        <span className="text-gold-700 font-semibold">{step}</span>
                      </div>
                      <div className="grid grid-cols-1 gap-1 text-[10px] text-charcoal-700">
                        <div className="flex items-center gap-1.5">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                          <span>1. Kondisi mesin & performa pasca serah terima unit</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                          <span>2. Kepuasan kenyamanan berkendara konsumen</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                          <span>3. Kelengkapan surat & dokumen kendaraan</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                          <span>4. Status garansi mesin showroom aktif</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                          <span>5. Rekomendasi showroom & saran layanan</span>
                        </div>
                      </div>
                    </div>

                    {/* Bottom Actions: thumb-friendly touch targets */}
                    <div className="flex items-center gap-2 pt-1 border-t border-[#EAE8E3]">
                      <a
                        href={formatWhatsAppLink(item.customerPhone, getCustomerWhatsAppMessage(item))}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold inline-flex items-center justify-center gap-1.5 shadow-xs transition-colors"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        <span>Kirim WA 5Q</span>
                      </a>

                      <button
                        onClick={() => handleOpenCustomerMilestoneModal(item)}
                        className="flex-1 py-2 px-3 bg-gold-500 hover:bg-gold-600 text-charcoal-950 rounded-xl text-xs font-bold inline-flex items-center justify-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 text-charcoal-950" />
                        <span>Catat Respon</span>
                      </button>

                      <button
                        onClick={() => {
                          setSelectedItem(item);
                          setShowHistoryModal(true);
                        }}
                        className="p-2 text-charcoal-500 hover:text-charcoal-900 rounded-xl bg-white border border-[#EAE8E3] hover:bg-warm-100 transition-colors shrink-0"
                        title="Lihat Riwayat Komunikasi"
                      >
                        <History className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* TABLE CUSTOMER FOLLOW UP (Desktop/Laptop) */}
          <div className="crm-card overflow-hidden hidden md:block">
            <div className="overflow-x-auto w-full">
              <table className="crm-table w-full min-w-[960px]">
                <thead>
                  <tr>
                    <th className="py-3 px-3 text-center w-12">No</th>
                    <th className="py-3 px-4">Konsumen Pembeli</th>
                    <th className="py-3 px-3">WhatsApp & Domisili</th>
                    <th className="py-3 px-4">Mobil yang Dibeli</th>
                    <th className="py-3 px-3">Metode Pembayaran</th>
                    <th className="py-3 px-3 text-center">Milestone Berkala</th>
                    <th className="py-3 px-3 text-center">Jadwal Kontak</th>
                    <th className="py-3 px-3 text-center">Status</th>
                    <th className="py-3 px-4 text-center min-w-[280px]">Aksi & WhatsApp</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCustomerList.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-12 text-center text-charcoal-400">
                        <Users className="w-10 h-10 mx-auto text-charcoal-300 mb-2 stroke-[1.5]" />
                        <p className="text-sm font-bold text-charcoal-700">Tidak ada data jadwal follow-up pembeli</p>
                        <p className="text-xs text-charcoal-400 mt-1">
                          Data otomatis bertambah saat ada transaksi penjualan cash atau ACC kredit mobil.
                        </p>
                      </td>
                    </tr>
                  ) : (
                    filteredCustomerList.map((item, idx) => {
                      const isOverdue = item.scheduledDate < todayStr && item.status !== 'Selesai';
                      const isToday = item.scheduledDate === todayStr && item.status !== 'Selesai';
                      const step = item.periodicStep || '1 Bulan';

                      return (
                        <tr key={item.id} className={`hover:bg-[#FAF9F5] transition-colors ${isOverdue ? 'bg-rose-50/20' : ''}`}>
                          <td className="py-3 px-3 text-center text-xs text-charcoal-400 font-mono">
                            {idx + 1}
                          </td>

                          {/* Nama Konsumen */}
                          <td className="py-3 px-4">
                            <div className="font-bold text-charcoal-900 text-xs">
                              {item.customerName}
                            </div>
                            <span className="text-[10px] text-charcoal-400 font-mono">
                              ID: {item.id}
                            </span>
                          </td>

                          {/* WhatsApp & Domisili */}
                          <td className="py-3 px-3">
                            <a
                              href={formatWhatsAppLink(item.customerPhone, getCustomerWhatsAppMessage(item))}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs font-mono font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
                            >
                              <Phone className="w-3 h-3 text-emerald-600" />
                              <span>{item.customerPhone || '-'}</span>
                            </a>
                            <div className="text-[10px] text-charcoal-500 mt-0.5 truncate max-w-[140px]">
                              {item.customerAddress || 'Garut / Jawa Barat'}
                            </div>
                          </td>

                          {/* Unit Dibeli */}
                          <td className="py-3 px-4">
                            <div className="text-xs font-bold text-charcoal-900">
                              {item.vehicleInfo || 'Unit Mobil Showroom'}
                            </div>
                            <div className="text-[10px] text-charcoal-500 flex items-center gap-1.5 mt-0.5">
                              {item.purchaseDate && (
                                <span>Tgl Beli: {formatDate(item.purchaseDate)}</span>
                              )}
                            </div>
                          </td>

                          {/* Pembayaran */}
                          <td className="py-3 px-3">
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold ${
                                item.paymentType === 'Cash'
                                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                  : 'bg-blue-50 text-blue-800 border border-blue-200'
                              }`}
                            >
                              {item.paymentType === 'Cash' ? (
                                <DollarSign className="w-3 h-3" />
                              ) : (
                                <CreditCard className="w-3 h-3" />
                              )}
                              <span>
                                {item.paymentType || 'Cash'} {item.leasingPartner ? `(${item.leasingPartner})` : ''}
                              </span>
                            </span>
                          </td>

                          {/* Milestone */}
                          <td className="py-3 px-3 text-center">
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                              <BadgeCheck className="w-3.5 h-3.5 text-amber-700" />
                              <span>{step}</span>
                            </span>
                          </td>

                          {/* Jadwal Kontak */}
                          <td className="py-3 px-3 text-center whitespace-nowrap">
                            <div className="text-xs font-medium text-charcoal-900">
                              {formatDate(item.scheduledDate)}
                            </div>
                            {isOverdue && (
                              <span className="inline-block mt-0.5 px-1.5 py-0.5 text-[9px] font-bold bg-rose-100 text-rose-700 rounded">
                                Lewat Jadwal
                              </span>
                            )}
                            {isToday && (
                              <span className="inline-block mt-0.5 px-1.5 py-0.5 text-[9px] font-bold bg-amber-100 text-amber-800 rounded">
                                Jadwal Hari Ini
                              </span>
                            )}
                          </td>

                          {/* Status */}
                          <td className="py-3 px-3 text-center whitespace-nowrap">
                            <span
                              className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                                item.status === 'Selesai'
                                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                                  : item.status === 'Sudah Dihubungi'
                                  ? 'bg-blue-50 text-blue-800 border-blue-300'
                                  : item.status === 'Tidak Merespons'
                                  ? 'bg-rose-50 text-rose-700 border-rose-200'
                                  : 'bg-charcoal-100 text-charcoal-700 border-charcoal-200'
                              }`}
                            >
                              {item.status}
                            </span>
                          </td>

                          {/* Aksi */}
                          <td className="py-3 px-4 text-center">
                            <div className="flex items-center justify-center gap-2">
                              {/* WhatsApp Button with 5 Operational Questions pre-filled */}
                              <a
                                href={formatWhatsAppLink(item.customerPhone, getCustomerWhatsAppMessage(item))}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold inline-flex items-center gap-1.5 shadow-xs transition-colors"
                                title="Kirim Pesan WhatsApp 5 Pertanyaan Operasional"
                              >
                                <MessageCircle className="w-3.5 h-3.5" />
                                <span>Kirim WA 5Q</span>
                              </a>

                              {/* Button Catat Respon */}
                              <button
                                onClick={() => handleOpenCustomerMilestoneModal(item)}
                                className="px-3 py-1.5 bg-gold-500 hover:bg-gold-600 text-charcoal-950 rounded-lg text-xs font-bold inline-flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5 text-charcoal-950" />
                                <span>Catat Respon</span>
                              </button>

                              {/* Button Riwayat */}
                              <button
                                onClick={() => {
                                  setSelectedItem(item);
                                  setShowHistoryModal(true);
                                }}
                                className="p-1.5 text-charcoal-500 hover:text-charcoal-900 rounded-lg hover:bg-warm-100 transition-colors"
                                title="Lihat Riwayat Komunikasi"
                              >
                                <History className="w-4 h-4" />
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

            <div className="py-3 px-4 bg-[#FAF9F5] border-t border-[#EAE8E3] flex items-center justify-between text-xs text-charcoal-500">
              <div>
                Menampilkan <span className="font-bold text-charcoal-900">{filteredCustomerList.length}</span> dari {customerFollowUps.length} pembeli showroom
              </div>
              <div className="text-[11px] text-charcoal-400">
                Tombol &quot;Kirim WA 5Q&quot; langsung menyusun draft 5 pertanyaan operasional resmi HR MOTOR Garut
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION VIEW TAB 2: PROSPECT FOLLOW UP (PENCARI MOBIL BELUM READY)        */}
      {/* ========================================================================= */}
      {activeMainTab === 'prospect' && (
        <div className="space-y-5 animate-in fade-in duration-200">
          {/* KPI METRICS ROW FOR PROSPECT FOLLOW UP */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <div className="crm-card p-3.5">
              <span className="text-[10px] font-bold uppercase text-charcoal-400">Total Calon Pembeli</span>
              <div className="text-xl font-black text-charcoal-900 mt-1">{prospectStats.total}</div>
              <span className="text-[10px] text-charcoal-500">Pencari unit belum ready</span>
            </div>
            <div className="crm-card p-3.5 border-l-4 border-l-emerald-500 bg-emerald-50/20">
              <span className="text-[10px] font-bold uppercase text-emerald-700 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" /> Mobil Sudah Ready!
              </span>
              <div className="text-xl font-black text-emerald-700 mt-1">{prospectStats.matched}</div>
              <span className="text-[10px] text-emerald-600 font-bold">Cocok dengan stok showroom</span>
            </div>
            <div className="crm-card p-3.5 border-l-4 border-l-amber-500">
              <span className="text-[10px] font-bold uppercase text-amber-700">Menunggu Mobil Masuk</span>
              <div className="text-xl font-black text-amber-600 mt-1">{prospectStats.waiting}</div>
              <span className="text-[10px] text-amber-600">Belum ada unit yang cocok</span>
            </div>
            <div className="crm-card p-3.5">
              <span className="text-[10px] font-bold uppercase text-charcoal-400">Sudah Dihubungi</span>
              <div className="text-xl font-black text-charcoal-800 mt-1">{prospectStats.contacted}</div>
              <span className="text-[10px] text-charcoal-500">Follow-up aktif</span>
            </div>
            <div className="crm-card p-3.5 border-l-4 border-l-gold-500">
              <span className="text-[10px] font-bold uppercase text-gold-800 flex items-center gap-1">
                <BadgeCheck className="w-3.5 h-3.5 text-gold-600" /> Sudah Deal
              </span>
              <div className="text-xl font-black text-gold-700 mt-1">{prospectStats.deal}</div>
              <span className="text-[10px] text-gold-800 font-bold">Telah beli mobil</span>
            </div>
          </div>

          {/* FILTER BAR FOR PROSPECT */}
          <div className="crm-card p-4 space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div className="md:col-span-3 relative">
                <Search className="w-4 h-4 text-charcoal-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Cari calon pelanggan, nomor WA, merk yang dicari (Toyota, Honda...), atau catatan..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-[#FAF9F5] border border-[#EAE8E3] rounded-xl text-xs text-charcoal-900 placeholder-charcoal-400 focus:outline-none focus:border-gold-500"
                />
              </div>

              <div>
                <select
                  value={filterProspectStatus}
                  onChange={(e) => setFilterProspectStatus(e.target.value)}
                  className="w-full px-3 py-2 bg-[#FAF9F5] border border-[#EAE8E3] rounded-xl text-xs text-charcoal-900 focus:outline-none focus:border-gold-500"
                >
                  <option value="Semua">Semua Status Prospek</option>
                  <option value="Mobil Sudah Ready">🎉 Unit Sudah READY (Cocok Stok)</option>
                  <option value="Menunggu Mobil Ready">Menunggu Mobil Ready</option>
                  <option value="Sudah Dihubungi">Sudah Dihubungi</option>
                  <option value="Tertarik">Tertarik</option>
                  <option value="Tidak Tertarik">Tidak Tertarik</option>
                  <option value="Sudah Deal">Sudah Deal</option>
                  <option value="Tidak Merespons">Tidak Merespons</option>
                </select>
              </div>
            </div>
          </div>

          {/* LIST CARDS / TABLE OF PROSPECTS */}
          <div className="space-y-4">
            {filteredProspectList.length === 0 ? (
              <div className="crm-card p-12 text-center text-charcoal-400">
                <Sparkles className="w-12 h-12 mx-auto text-charcoal-300 mb-3 stroke-[1.5]" />
                <h3 className="text-sm font-bold text-charcoal-700">Belum ada data calon pelanggan mencari mobil</h3>
                <p className="text-xs text-charcoal-400 mt-1 max-w-md mx-auto">
                  Klik tombol <strong>&quot;+ Catat Calon Pelanggan Cari Mobil&quot;</strong> di atas untuk mencatat konsumen yang mencari unit saat stok showroom belum tersedia.
                </p>
              </div>
            ) : (
              filteredProspectList.map((item) => {
                const matchedStock = matchedProspectMap.get(item.id);
                const isMatched = !!matchedStock;

                return (
                  <div
                    key={item.id}
                    className={`crm-card p-5 transition-all space-y-4 border ${
                      isMatched
                        ? 'border-emerald-500/60 bg-gradient-to-r from-emerald-50/20 via-white to-gold-50/20 shadow-md ring-1 ring-emerald-500/20'
                        : 'border-[#EAE8E3]'
                    }`}
                  >
                    {/* Top Row: Customer Info & Status Badge */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#EAE8E3] pb-3">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-xs ${
                            isMatched
                              ? 'bg-emerald-600 text-white shadow-xs'
                              : 'bg-gold-100 text-gold-900 border border-gold-300'
                          }`}
                        >
                          <User className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-black text-sm text-charcoal-900">
                              {item.customerName}
                            </h3>
                            <span className="text-[10px] text-charcoal-400 font-mono">
                              ({item.id})
                            </span>
                          </div>
                          <div className="flex items-center gap-3 text-xs text-charcoal-500 mt-0.5">
                            <a
                              href={formatWhatsAppLink(item.customerPhone, getProspectWhatsAppMessage(item, matchedStock))}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="font-mono font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
                            >
                              <Phone className="w-3 h-3 text-emerald-600" />
                              <span>{item.customerPhone}</span>
                            </a>
                            <span>•</span>
                            <span>{item.customerAddress || 'Garut / Jabar'}</span>
                            <span>•</span>
                            <span className="text-charcoal-400">
                              Tanya: {formatDate(item.firstInquiryDate || item.scheduledDate)}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {isMatched ? (
                          <span className="px-3 py-1 rounded-full text-xs font-black bg-emerald-600 text-white shadow-sm flex items-center gap-1.5 animate-pulse">
                            <Sparkles className="w-3.5 h-3.5 text-gold-300" />
                            <span>Mobil Sudah READY di Showroom!</span>
                          </span>
                        ) : (
                          <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-amber-600" />
                            <span>Menunggu Mobil Masuk</span>
                          </span>
                        )}

                        <button
                          onClick={() => handleOpenProspectStatusModal(item)}
                          className="px-2.5 py-1 rounded-lg text-xs font-bold bg-[#FAF9F5] border border-[#EAE8E3] text-charcoal-700 hover:bg-warm-100 transition-colors"
                        >
                          Status: {item.prospectStatus || item.status} ▾
                        </button>
                      </div>
                    </div>

                    {/* Middle Row: Criteria Search vs Matched Stock */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Left: Criteria Search Wanted */}
                      <div className="bg-[#FAF9F5] p-3.5 rounded-xl border border-[#EAE8E3] space-y-2 text-xs">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-charcoal-400 block">
                          Spesifikasi Mobil yang Dicari Konsumen:
                        </span>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <span className="text-charcoal-500 block text-[11px]">Merk & Model:</span>
                            <span className="font-bold text-charcoal-900">
                              {item.searchBrand || '-'} {item.searchModel || ''}
                            </span>
                          </div>
                          <div>
                            <span className="text-charcoal-500 block text-[11px]">Tahun Dicari:</span>
                            <span className="font-bold text-charcoal-900">
                              {item.searchYear ? `${item.searchYear} (±1 thn)` : 'Bebas / Kondisi'}
                            </span>
                          </div>
                          <div>
                            <span className="text-charcoal-500 block text-[11px]">Estimasi Budget:</span>
                            <span className="font-black text-emerald-700">
                              {item.searchBudget ? formatRupiah(item.searchBudget) : 'Sesuai Pasar'}
                            </span>
                          </div>
                          <div>
                            <span className="text-charcoal-500 block text-[11px]">Sumber Lead:</span>
                            <span className="font-medium text-charcoal-700">
                              {item.customerSource || 'Walk-in Showroom'}
                            </span>
                          </div>
                        </div>
                        {item.notes && (
                          <div className="pt-1.5 border-t border-[#EAE8E3] text-[11px] text-charcoal-600">
                            <strong>Catatan:</strong> {item.notes}
                          </div>
                        )}
                      </div>

                      {/* Right: Matched Stock Box */}
                      {isMatched && matchedStock ? (
                        <div className="bg-emerald-50/60 border border-emerald-300 rounded-xl p-3.5 space-y-2 text-xs">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800 flex items-center gap-1">
                              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                              Unit Ready Cocok Ditemukan di Showroom:
                            </span>
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-700 text-white">
                              READY STOK
                            </span>
                          </div>

                          <div className="flex items-start justify-between">
                            <div>
                              <h4 className="font-black text-sm text-charcoal-900">
                                {matchedStock.brand} {matchedStock.model} ({matchedStock.year})
                              </h4>
                              <p className="text-[11px] text-charcoal-600 font-mono mt-0.5">
                                Plat: {matchedStock.licensePlate || matchedStock.plateNumber || '-'} • Warna: {matchedStock.color} • {matchedStock.transmission}
                              </p>
                            </div>
                            <div className="text-right">
                              <span className="font-black text-emerald-800 text-sm block">
                                {formatRupiah(matchedStock.price)}
                              </span>
                              {matchedStock.creditDp && (
                                <span className="text-[10px] text-gold-700 font-bold block">
                                  DP: {formatRupiah(matchedStock.creditDp)}
                                </span>
                              )}
                            </div>
                          </div>

                          <p className="text-[10px] text-emerald-900 bg-emerald-100/60 p-1.5 rounded-lg">
                            Unit ini memenuhi kriteria merk <strong>{matchedStock.brand}</strong>, model, dan rentang budget calon pembeli.
                          </p>
                        </div>
                      ) : (
                        <div className="bg-[#FAF9F5] border border-dashed border-[#EAE8E3] rounded-xl p-3.5 flex flex-col justify-center items-center text-center text-xs text-charcoal-400 space-y-1">
                          <Clock className="w-5 h-5 text-charcoal-300" />
                          <p className="font-bold text-charcoal-600">Belum Ada Unit Stok yang Cocok</p>
                          <p className="text-[11px] text-charcoal-400 max-w-xs">
                            Sistem akan otomatis mencocokkan jika ada stok mobil baru masuk atau unit kredit ditolak yang kembali ready.
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Bottom Actions Row */}
                    <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-[#EAE8E3]">
                      <div className="text-[11px] text-charcoal-400">
                        {item.lastContactDate ? (
                          <span>Kontak Terakhir: {formatDate(item.lastContactDate, true)}</span>
                        ) : (
                          <span>Belum ada riwayat kontak</span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        {/* WhatsApp Custom Button */}
                        <a
                          href={formatWhatsAppLink(item.customerPhone, getProspectWhatsAppMessage(item, matchedStock))}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold inline-flex items-center gap-1.5 transition-all shadow-xs ${
                            isMatched
                              ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                              : 'btn-outline-warm text-emerald-700'
                          }`}
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                          <span>{isMatched ? 'Kabari Unit Ready via WA' : 'Sapa Konsumen via WA'}</span>
                        </a>

                        {/* 1-Click Convert to Deal/Transaction */}
                        {isMatched && matchedStock && (
                          <div className="inline-flex items-center gap-1.5">
                            <Link
                              href={`/customers?tab=transactions&action=cash&prospectId=${item.id}&stockId=${matchedStock.id}&name=${encodeURIComponent(item.customerName)}&phone=${encodeURIComponent(item.customerPhone)}&address=${encodeURIComponent(item.customerAddress || '')}&source=${encodeURIComponent(item.customerSource || 'Walk-in')}&price=${matchedStock.price}`}
                              className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold inline-flex items-center gap-1 shadow-xs transition-all"
                              title="Buat Transaksi Cash Langsung dari Unit Ready ini"
                            >
                              <DollarSign className="w-3.5 h-3.5" />
                              <span>Deal Cash</span>
                            </Link>

                            <Link
                              href={`/customers?tab=transactions&action=credit&prospectId=${item.id}&stockId=${matchedStock.id}&name=${encodeURIComponent(item.customerName)}&phone=${encodeURIComponent(item.customerPhone)}&address=${encodeURIComponent(item.customerAddress || '')}&source=${encodeURIComponent(item.customerSource || 'Walk-in')}&price=${matchedStock.price}&dp=${matchedStock.creditDp || Math.round(matchedStock.price * 0.2)}`}
                              className="px-2.5 py-1.5 rounded-lg bg-gold-500 hover:bg-gold-600 text-charcoal-950 text-xs font-bold inline-flex items-center gap-1 shadow-xs transition-all"
                              title="Buat Pengajuan Kredit (Boking Unit)"
                            >
                              <CreditCard className="w-3.5 h-3.5" />
                              <span>Ajukan Kredit</span>
                            </Link>
                          </div>
                        )}

                        {/* Button Riwayat */}
                        <button
                          onClick={() => {
                            setSelectedItem(item);
                            setShowHistoryModal(true);
                          }}
                          className="p-1.5 text-charcoal-400 hover:text-charcoal-700 rounded-lg hover:bg-warm-100 transition-colors"
                          title="Lihat Riwayat Komunikasi"
                        >
                          <History className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: CATAT RESPON PELANGGAN & MAJU MILESTONE (TAB 1)                   */}
      {/* ========================================================================= */}
      {showCustomerMilestoneModal && selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-charcoal-950/40 backdrop-blur-xs animate-in fade-in duration-200 overflow-y-auto">
          <div className="crm-card w-full max-w-xl max-h-[90vh] flex flex-col overflow-hidden shadow-luxury border-gold-500/40 my-auto">
            <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 sm:py-4 bg-[#FAF9F5] border-b border-[#EAE8E3] text-charcoal-900 shrink-0 relative">
              <div className="absolute top-0 left-0 right-0 h-[2.5px] bg-gradient-to-r from-gold-500 via-gold-400 to-gold-600" />
              <div>
                <span className="badge-gold text-[10px] mb-1 inline-block">
                  Tahap: {selectedItem.periodicStep || '1 Bulan'}
                </span>
                <h3 className="text-base font-black text-charcoal-900 tracking-tight">
                  Catat Respon Follow-up: {selectedItem.customerName}
                </h3>
                <p className="text-xs text-charcoal-500">
                  Unit: {selectedItem.vehicleInfo || 'Mobil Showroom'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowCustomerMilestoneModal(false)}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-charcoal-400 hover:text-charcoal-900 hover:bg-[#F0EDE6] transition-colors shrink-0 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="mx-4 sm:mx-6 mt-3 sm:mt-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-medium">
                {formError}
              </div>
            )}

            <form onSubmit={handleSubmitCustomerMilestone} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
              <div className="p-3 bg-[#FAF9F5] border border-[#EAE8E3] rounded-xl text-xs space-y-1">
                <span className="font-bold text-charcoal-900 block">
                  Ringkasan Jawaban 5 Pertanyaan Operasional Showroom:
                </span>
                <p className="text-[11px] text-charcoal-500">
                  Isikan catatan ringkas atas respon konsumen terhadap kondisi mobil dan rencana ke depan.
                </p>
              </div>

              {/* Input for Q2: Kondisi Mobil */}
              <div>
                <label className="block text-xs font-bold text-charcoal-800 mb-1">
                  Kondisi & Performa Mobil Pasca Digunakan <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={milestoneForm.operationalAnswers.q2Kondisi}
                  onChange={(e) =>
                    setMilestoneForm({
                      ...milestoneForm,
                      operationalAnswers: {
                        ...milestoneForm.operationalAnswers,
                        q2Kondisi: e.target.value,
                      },
                    })
                  }
                  className="w-full text-xs px-3.5 py-2.5 bg-[#F8F7F4] border border-[#EAE8E3] rounded-xl focus:outline-none focus:border-gold-500 text-charcoal-900 font-medium"
                />
              </div>

              {/* Input for Q3: Kendala / Keluhan */}
              <div>
                <label className="block text-xs font-bold text-charcoal-800 mb-1">
                  Keluhan / Kebutuhan Servis Kendaraan
                </label>
                <input
                  type="text"
                  value={milestoneForm.operationalAnswers.q3Kendala}
                  onChange={(e) =>
                    setMilestoneForm({
                      ...milestoneForm,
                      operationalAnswers: {
                        ...milestoneForm.operationalAnswers,
                        q3Kendala: e.target.value,
                      },
                    })
                  }
                  className="w-full text-xs px-3.5 py-2.5 bg-[#F8F7F4] border border-[#EAE8E3] rounded-xl focus:outline-none focus:border-gold-500 text-charcoal-900 font-medium"
                />
              </div>

              {/* Input for Q4: Rencana Upgrade / Ganti Unit */}
              <div>
                <label className="block text-xs font-bold text-charcoal-800 mb-1">
                  Rencana Upgrade / Tukar Tambah (Trade-in)
                </label>
                <input
                  type="text"
                  value={milestoneForm.operationalAnswers.q4Upgrade}
                  onChange={(e) =>
                    setMilestoneForm({
                      ...milestoneForm,
                      operationalAnswers: {
                        ...milestoneForm.operationalAnswers,
                        q4Upgrade: e.target.value,
                      },
                    })
                  }
                  className="w-full text-xs px-3.5 py-2.5 bg-[#F8F7F4] border border-[#EAE8E3] rounded-xl focus:outline-none focus:border-gold-500 text-charcoal-900 font-medium"
                />
              </div>

              {/* Status Kontak */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-charcoal-800 mb-1">
                    Status Respon Konsumen
                  </label>
                  <select
                    value={milestoneForm.status}
                    onChange={(e) =>
                      setMilestoneForm({
                        ...milestoneForm,
                        status: e.target.value as CustomerFollowUpStatus,
                      })
                    }
                    className="w-full text-xs px-3.5 py-2.5 bg-[#F8F7F4] border border-[#EAE8E3] rounded-xl focus:outline-none focus:border-gold-500 text-charcoal-900 font-medium"
                  >
                    <option value="Belum Dihubungi">Belum Dihubungi</option>
                    <option value="Sudah Dihubungi">Sudah Dihubungi</option>
                    <option value="Tidak Merespons">Tidak Merespons</option>
                    <option value="Selesai">Selesai (Tuntas)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-charcoal-800 mb-1">
                    Catatan Bebas Tambahan
                  </label>
                  <input
                    type="text"
                    placeholder="Catatan tambahan sales..."
                    value={milestoneForm.notes}
                    onChange={(e) => setMilestoneForm({ ...milestoneForm, notes: e.target.value })}
                    className="w-full text-xs px-3.5 py-2.5 bg-[#F8F7F4] border border-[#EAE8E3] rounded-xl focus:outline-none focus:border-gold-500 text-charcoal-900 font-medium"
                  />
                </div>
              </div>

              {/* Advance Milestone Option */}
              <div className="pt-3 border-t border-[#EAE8E3] space-y-3">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-charcoal-900">
                  <input
                    type="checkbox"
                    checked={milestoneForm.advanceStep}
                    onChange={(e) =>
                      setMilestoneForm({ ...milestoneForm, advanceStep: e.target.checked })
                    }
                    className="rounded text-gold-600 focus:ring-0"
                  />
                  <span>
                    Maju ke Jadwal Milestone Berikutnya (
                    {selectedItem.periodicStep === '1 Bulan'
                      ? '3 Bulan'
                      : selectedItem.periodicStep === '3 Bulan'
                      ? '6 Bulan'
                      : selectedItem.periodicStep === '6 Bulan'
                      ? '1 Tahun'
                      : 'Selesai'}
                    )
                  </span>
                </label>

                {milestoneForm.advanceStep && selectedItem.periodicStep !== '1 Tahun' && (
                  <div className="p-3 bg-[#FAF9F5] rounded-xl border border-[#EAE8E3]">
                    <label className="block text-[11px] font-bold text-charcoal-700 mb-1">
                      Tanggal Jadwal Follow-up Lanjutan:
                    </label>
                    <input
                      type="date"
                      required={milestoneForm.advanceStep}
                      value={milestoneForm.nextScheduledDate}
                      onChange={(e) =>
                        setMilestoneForm({ ...milestoneForm, nextScheduledDate: e.target.value })
                      }
                      className="w-full text-xs px-3 py-2 bg-white border border-[#EAE8E3] rounded-lg text-charcoal-900 font-medium"
                    />
                  </div>
                )}
              </div>

              <div className="flex flex-col-reverse sm:flex-row justify-end gap-2.5 sm:gap-3 pt-3 border-t border-[#EAE8E3]">
                <button
                  type="button"
                  onClick={() => setShowCustomerMilestoneModal(false)}
                  className="btn-outline-warm w-full sm:w-auto"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn-gold w-full sm:w-auto"
                >
                  {isSubmitting ? 'Menyimpan...' : 'Simpan Respon & Perbarui'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: CATAT CALON PELANGGAN MENCARI MOBIL (PROSPECT TAB 2)              */}
      {/* ========================================================================= */}
      {showAddProspectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-charcoal-950/40 backdrop-blur-xs animate-in fade-in duration-200 overflow-y-auto">
          <div className="crm-card w-full max-w-xl max-h-[90vh] flex flex-col overflow-hidden shadow-luxury border-gold-500/40 my-auto">
            <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 sm:py-4 bg-[#FAF9F5] border-b border-[#EAE8E3] text-charcoal-900 shrink-0 relative">
              <div className="absolute top-0 left-0 right-0 h-[2.5px] bg-gradient-to-r from-gold-500 via-gold-400 to-gold-600" />
              <div>
                <span className="badge-gold text-[10px] mb-1 inline-block">Calon Pembeli</span>
                <h3 className="text-base font-black text-charcoal-900 tracking-tight">
                  Catat Calon Pelanggan Cari Mobil (Stok Belum Ready)
                </h3>
                <p className="text-xs text-charcoal-500">
                  Sistem otomatis mencocokkan jika ada unit stok yang masuk atau kembali ready
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowAddProspectModal(false)}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-charcoal-400 hover:text-charcoal-900 hover:bg-[#F0EDE6] transition-colors shrink-0 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="mx-4 sm:mx-6 mt-3 sm:mt-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-medium">
                {formError}
              </div>
            )}

            <form onSubmit={handleSubmitAddProspect} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="block text-xs font-bold text-charcoal-800 mb-1">
                    Nama Calon Pembeli <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Hendra Kurniawan"
                    value={prospectForm.customerName}
                    onChange={(e) => setProspectForm({ ...prospectForm, customerName: e.target.value })}
                    className="w-full text-xs px-3.5 py-2.5 bg-[#F8F7F4] border border-[#EAE8E3] rounded-xl focus:outline-none focus:border-gold-500 text-charcoal-900 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-charcoal-800 mb-1">
                    Nomor WhatsApp <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="Contoh: 08123456789"
                    value={prospectForm.customerPhone}
                    onChange={(e) => setProspectForm({ ...prospectForm, customerPhone: e.target.value })}
                    className="w-full text-xs px-3.5 py-2.5 bg-[#F8F7F4] border border-[#EAE8E3] rounded-xl focus:outline-none focus:border-gold-500 text-charcoal-900 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-charcoal-800 mb-1">
                    Domisili Garut / Jabar
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: Garut Kota / Wanaraja"
                    value={prospectForm.customerAddress}
                    onChange={(e) => setProspectForm({ ...prospectForm, customerAddress: e.target.value })}
                    className="w-full text-xs px-3.5 py-2.5 bg-[#F8F7F4] border border-[#EAE8E3] rounded-xl focus:outline-none focus:border-gold-500 text-charcoal-900 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-charcoal-800 mb-1">
                    Sumber Kedatangan
                  </label>
                  <select
                    value={prospectForm.customerSource}
                    onChange={(e) => setProspectForm({ ...prospectForm, customerSource: e.target.value as LeadSourceType })}
                    className="w-full text-xs px-3.5 py-2.5 bg-[#F8F7F4] border border-[#EAE8E3] rounded-xl focus:outline-none focus:border-gold-500 text-charcoal-900 font-medium"
                  >
                    <option value="Walk-in">Walk-in Showroom</option>
                    <option value="WhatsApp">WhatsApp</option>
                    <option value="Instagram">Instagram</option>
                    <option value="Facebook">Facebook</option>
                    <option value="TikTok">TikTok</option>
                    <option value="Other">Lainnya</option>
                  </select>
                </div>
              </div>

              {/* Kriteria Mobil yang Dicari */}
              <div className="p-3.5 bg-[#FAF9F5] border border-[#EAE8E3] rounded-xl space-y-3">
                <span className="text-xs font-black text-charcoal-900 uppercase tracking-wide block">
                  Kriteria Mobil yang Dicari:
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-charcoal-800 mb-1">
                      Merk / Brand <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Toyota / Honda / Daihatsu / Mitsubishi..."
                      value={prospectForm.searchBrand}
                      onChange={(e) => setProspectForm({ ...prospectForm, searchBrand: e.target.value })}
                      className="w-full text-xs px-3 py-2 bg-white border border-[#EAE8E3] rounded-lg focus:outline-none focus:border-gold-500 text-charcoal-900 font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-charcoal-800 mb-1">
                      Model / Tipe Mobil
                    </label>
                    <input
                      type="text"
                      placeholder="Avanza / Brio / Innova / Raize..."
                      value={prospectForm.searchModel}
                      onChange={(e) => setProspectForm({ ...prospectForm, searchModel: e.target.value })}
                      className="w-full text-xs px-3 py-2 bg-white border border-[#EAE8E3] rounded-lg focus:outline-none focus:border-gold-500 text-charcoal-900 font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-charcoal-800 mb-1">
                      Estimasi Tahun (±1 Thn)
                    </label>
                    <input
                      type="number"
                      placeholder="Contoh: 2020"
                      value={prospectForm.searchYear}
                      onChange={(e) => setProspectForm({ ...prospectForm, searchYear: e.target.value })}
                      className="w-full text-xs px-3 py-2 bg-white border border-[#EAE8E3] rounded-lg focus:outline-none focus:border-gold-500 text-charcoal-900 font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-charcoal-800 mb-1">
                      Estimasi Budget Maksimal (Rp)
                    </label>
                    <input
                      type="number"
                      placeholder="Contoh: 175000000"
                      value={prospectForm.searchBudget}
                      onChange={(e) => setProspectForm({ ...prospectForm, searchBudget: e.target.value })}
                      className="w-full text-xs px-3 py-2 bg-white border border-[#EAE8E3] rounded-lg focus:outline-none focus:border-gold-500 text-charcoal-900 font-medium font-bold"
                    />
                    {Number(prospectForm.searchBudget) > 0 && (
                      <span className="text-[10px] text-emerald-700 font-bold block mt-0.5">
                        {formatRupiah(Number(prospectForm.searchBudget))}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-charcoal-800 mb-1">
                  Catatan Kebutuhan / Preferensi Warna & Transmisi
                </label>
                <textarea
                  rows={2}
                  placeholder="Contoh: Diutamakan warna putih/abu, transmisi matic CVT, pemakaian keluarga."
                  value={prospectForm.notes}
                  onChange={(e) => setProspectForm({ ...prospectForm, notes: e.target.value })}
                  className="w-full text-xs px-3.5 py-2.5 bg-[#F8F7F4] border border-[#EAE8E3] rounded-xl focus:outline-none focus:border-gold-500 text-charcoal-900 font-medium"
                />
              </div>

              <div className="flex flex-col-reverse sm:flex-row justify-end gap-2.5 sm:gap-3 pt-3 border-t border-[#EAE8E3]">
                <button
                  type="button"
                  onClick={() => setShowAddProspectModal(false)}
                  className="btn-outline-warm w-full sm:w-auto"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn-gold w-full sm:w-auto"
                >
                  {isSubmitting ? 'Menyimpan...' : 'Simpan Calon Pelanggan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: TAMBAH CUSTOMER FOLLOW-UP MANUAL (TAB 1)                         */}
      {/* ========================================================================= */}
      {showAddCustomerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-charcoal-950/40 backdrop-blur-xs animate-in fade-in duration-200 overflow-y-auto">
          <div className="crm-card w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden shadow-luxury border-gold-500/40 my-auto">
            <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 sm:py-4 bg-[#FAF9F5] border-b border-[#EAE8E3] text-charcoal-900 shrink-0 relative">
              <div className="absolute top-0 left-0 right-0 h-[2.5px] bg-gradient-to-r from-gold-500 via-gold-400 to-gold-600" />
              <div>
                <h3 className="text-base font-black text-charcoal-900 tracking-tight">
                  Jadwalkan Follow-up Pembeli Baru
                </h3>
                <p className="text-xs text-charcoal-500">
                  Masukkan jadwal follow-up berkala 1 tahun pasca-penjualan mobil
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowAddCustomerModal(false)}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-charcoal-400 hover:text-charcoal-900 hover:bg-[#F0EDE6] transition-colors shrink-0 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="mx-4 sm:mx-6 mt-3 sm:mt-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-medium">
                {formError}
              </div>
            )}

            <form onSubmit={handleSubmitAddCustomerManual} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-charcoal-800 mb-1">
                  Nama Pelanggan Pembeli <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Dedi Mulyadi"
                  value={manualCustomerForm.customerName}
                  onChange={(e) => setManualCustomerForm({ ...manualCustomerForm, customerName: e.target.value })}
                  className="w-full text-xs px-3.5 py-2.5 bg-[#F8F7F4] border border-[#EAE8E3] rounded-xl focus:outline-none focus:border-gold-500 text-charcoal-900 font-medium"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-charcoal-800 mb-1">
                    Nomor WhatsApp <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="08123456789"
                    value={manualCustomerForm.customerPhone}
                    onChange={(e) => setManualCustomerForm({ ...manualCustomerForm, customerPhone: e.target.value })}
                    className="w-full text-xs px-3.5 py-2.5 bg-[#F8F7F4] border border-[#EAE8E3] rounded-xl focus:outline-none focus:border-gold-500 text-charcoal-900 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-charcoal-800 mb-1">
                    Alamat Domisili
                  </label>
                  <input
                    type="text"
                    placeholder="Tarogong, Garut"
                    value={manualCustomerForm.customerAddress}
                    onChange={(e) => setManualCustomerForm({ ...manualCustomerForm, customerAddress: e.target.value })}
                    className="w-full text-xs px-3.5 py-2.5 bg-[#F8F7F4] border border-[#EAE8E3] rounded-xl focus:outline-none focus:border-gold-500 text-charcoal-900 font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-charcoal-800 mb-1">
                  Unit Mobil yang Dibeli <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: TOYOTA AVANZA 1.3 G 2020 (D 1234 HR)"
                  value={manualCustomerForm.vehicleInfo}
                  onChange={(e) => setManualCustomerForm({ ...manualCustomerForm, vehicleInfo: e.target.value })}
                  className="w-full text-xs px-3.5 py-2.5 bg-[#F8F7F4] border border-[#EAE8E3] rounded-xl focus:outline-none focus:border-gold-500 text-charcoal-900 font-medium"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-charcoal-800 mb-1">
                    Metode Pembayaran
                  </label>
                  <select
                    value={manualCustomerForm.paymentType}
                    onChange={(e) => setManualCustomerForm({ ...manualCustomerForm, paymentType: e.target.value as 'Cash' | 'Kredit' })}
                    className="w-full text-xs px-3.5 py-2.5 bg-[#F8F7F4] border border-[#EAE8E3] rounded-xl focus:outline-none focus:border-gold-500 text-charcoal-900 font-medium"
                  >
                    <option value="Cash">Cash (Tunai)</option>
                    <option value="Kredit">Kredit (Leasing)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-charcoal-800 mb-1">
                    Tahap Milestone Awal
                  </label>
                  <select
                    value={manualCustomerForm.periodicStep}
                    onChange={(e) => setManualCustomerForm({ ...manualCustomerForm, periodicStep: e.target.value as any })}
                    className="w-full text-xs px-3.5 py-2.5 bg-[#F8F7F4] border border-[#EAE8E3] rounded-xl focus:outline-none focus:border-gold-500 text-charcoal-900 font-medium"
                  >
                    {CUSTOMER_PERIODIC_STEPS.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-charcoal-800 mb-1">
                  Tanggal Jadwal Follow-up <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={manualCustomerForm.scheduledDate}
                  onChange={(e) => setManualCustomerForm({ ...manualCustomerForm, scheduledDate: e.target.value })}
                  className="w-full text-xs px-3.5 py-2.5 bg-[#F8F7F4] border border-[#EAE8E3] rounded-xl focus:outline-none focus:border-gold-500 text-charcoal-900 font-medium"
                />
              </div>

              <div className="flex flex-col-reverse sm:flex-row justify-end gap-2.5 sm:gap-3 pt-3 border-t border-[#EAE8E3]">
                <button
                  type="button"
                  onClick={() => setShowAddCustomerModal(false)}
                  className="btn-outline-warm w-full sm:w-auto"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn-gold w-full sm:w-auto"
                >
                  {isSubmitting ? 'Menyimpan...' : 'Jadwalkan Follow-up'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 4: UBAH STATUS PROSPEK CEPAT                                        */}
      {/* ========================================================================= */}
      {showProspectStatusModal && selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-charcoal-950/40 backdrop-blur-xs animate-in fade-in duration-200 overflow-y-auto">
          <div className="crm-card w-full max-w-md max-h-[90vh] flex flex-col overflow-hidden shadow-luxury border-[#EAE8E3] my-auto">
            <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 sm:py-4 bg-[#FAF9F5] border-b border-[#EAE8E3] text-charcoal-900 shrink-0 relative">
              <div className="absolute top-0 left-0 right-0 h-[2.5px] bg-gradient-to-r from-gold-500 via-gold-400 to-gold-600" />
              <h3 className="text-base font-black text-charcoal-900 tracking-tight">
                Update Status Calon Pembeli
              </h3>
              <button
                type="button"
                onClick={() => setShowProspectStatusModal(false)}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-charcoal-400 hover:text-charcoal-900 hover:bg-[#F0EDE6] transition-colors shrink-0 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitProspectStatus} className="p-4 sm:p-6 space-y-4 overflow-y-auto">
              <div>
                <label className="block text-xs font-bold text-charcoal-800 mb-1">
                  Status Calon Pembeli
                </label>
                <select
                  value={prospectStatusForm.status}
                  onChange={(e) => setProspectStatusForm({ ...prospectStatusForm, status: e.target.value as ProspectFollowUpStatus })}
                  className="w-full text-xs px-3.5 py-2.5 bg-[#F8F7F4] border border-[#EAE8E3] rounded-xl focus:outline-none focus:border-gold-500 text-charcoal-900 font-medium"
                >
                  {PROSPECT_STATUSES.map((ps) => (
                    <option key={ps.value} value={ps.value}>{ps.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-charcoal-800 mb-1">
                  Catatan Progres
                </label>
                <textarea
                  rows={2}
                  placeholder="Catatan respon calon pembeli..."
                  value={prospectStatusForm.notes}
                  onChange={(e) => setProspectStatusForm({ ...prospectStatusForm, notes: e.target.value })}
                  className="w-full text-xs px-3.5 py-2.5 bg-[#F8F7F4] border border-[#EAE8E3] rounded-xl focus:outline-none focus:border-gold-500 text-charcoal-900 font-medium"
                />
              </div>

              <div className="flex flex-col-reverse sm:flex-row justify-end gap-2.5 sm:gap-3 pt-3 border-t border-[#EAE8E3]">
                <button
                  type="button"
                  onClick={() => setShowProspectStatusModal(false)}
                  className="btn-outline-warm w-full sm:w-auto"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn-gold w-full sm:w-auto"
                >
                  {isSubmitting ? 'Menyimpan...' : 'Perbarui Status'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 5: RIWAYAT TIMELINE KOMUNIKASI                                      */}
      {/* ========================================================================= */}
      {showHistoryModal && selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-charcoal-950/40 backdrop-blur-xs animate-in fade-in duration-200 overflow-y-auto">
          <div className="crm-card w-full max-w-xl max-h-[90vh] flex flex-col overflow-hidden shadow-luxury border-[#EAE8E3] my-auto">
            <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 sm:py-4 bg-[#FAF9F5] border-b border-[#EAE8E3] text-charcoal-900 shrink-0 relative">
              <div className="absolute top-0 left-0 right-0 h-[2.5px] bg-gradient-to-r from-gold-500 via-gold-400 to-gold-600" />
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-gold-100 text-gold-800 border border-gold-300 flex items-center justify-center shadow-2xs shrink-0">
                  <History className="w-4 h-4 text-gold-700" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-charcoal-900 truncate max-w-[200px] sm:max-w-md">
                    Riwayat Komunikasi: {selectedItem.customerName}
                  </h3>
                  <p className="text-xs text-charcoal-500">
                    {selectedItem.vehicleInfo || selectedItem.searchBrand || 'Showroom Follow-up'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowHistoryModal(false)}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-charcoal-400 hover:text-charcoal-900 hover:bg-[#F0EDE6] transition-colors shrink-0 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
              {!selectedItem.communicationLogs || selectedItem.communicationLogs.length === 0 ? (
                <div className="text-center py-8 text-charcoal-400 text-xs">
                  Belum ada catatan riwayat komunikasi tersimpan.
                </div>
              ) : (
                <div className="relative border-l-2 border-[#EAE8E3] ml-3 space-y-4">
                  {selectedItem.communicationLogs.map((log) => (
                    <div key={log.id} className="relative pl-6">
                      <div className="absolute -left-1.5 top-1.5 w-3 h-3 rounded-full bg-gold-500 ring-4 ring-white shadow-xs"></div>
                      <div className="bg-[#FAF9F5] p-3.5 rounded-xl border border-[#EAE8E3] space-y-1">
                        <div className="flex items-center justify-between text-xs flex-wrap gap-1">
                          <span className="font-bold text-charcoal-900">{log.outcome}</span>
                          <span className="text-charcoal-400 font-mono text-[11px]">
                            {formatDate(log.timestamp, true)}
                          </span>
                        </div>
                        {log.notes && (
                          <p className="text-xs text-charcoal-700 leading-relaxed pt-1 whitespace-pre-line">
                            {log.notes}
                          </p>
                        )}
                        <div className="flex items-center justify-between text-[11px] text-charcoal-500 pt-1.5 border-t border-[#EAE8E3] mt-1 flex-wrap gap-1">
                          <span>Oleh: {log.salesName || log.loggedByName || 'Staff Showroom'}</span>
                          {log.nextFollowUpDate && (
                            <span className="text-gold-700 font-bold">
                              Lanjutan: {formatDate(log.nextFollowUpDate)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="px-4 sm:px-6 py-3 border-t border-[#EAE8E3] bg-[#FAF9F5] flex items-center justify-end">
              <button
                type="button"
                onClick={() => setShowHistoryModal(false)}
                className="btn-outline-warm w-full sm:w-auto text-xs font-semibold py-2 px-5 cursor-pointer"
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
