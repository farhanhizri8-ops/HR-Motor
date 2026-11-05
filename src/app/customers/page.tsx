'use client';

import React, { useState, useMemo, useRef, useEffect } from 'react';
import Link from 'next/link';
import {
  Users,
  Search,
  Filter,
  Plus,
  Trash2,
  Edit,
  Eye,
  MessageCircle,
  Phone,
  Mail,
  MapPin,
  Calendar,
  AlertCircle,
  X,
  CheckCircle,
  ArrowUpDown,
  Car,
  Clock,
  ChevronRight,
  Shield,
  Send,
  Wrench,
  FileText,
  Printer,
  ChevronDown,
  Check,
  CreditCard,
  DollarSign,
  CheckCircle2,
  XCircle,
  ShoppingBag,
  Building2,
  BadgePercent,
  History,
  Banknote,
} from 'lucide-react';
import { useCrm } from '@/context/CrmContext';
import { Customer, CustomerPurchase, LeadSourceType, VehicleCategory, CreditApplication, CreditStatus } from '@/types/crm';

interface KwitansiData {
  nomorKwitansi: string;
  terimaDari: string;
  sejumlahUang: number;
  terbilang: string;
  untukPembayaran: string;
  nomorPolisi: string;
  tempatTanggal: string;
  keterangan: string;
  penerima: string;
}

function formatRupiahWords(n: number): string {
  const bilangan = ['', 'Satu', 'Dua', 'Tiga', 'Empat', 'Lima', 'Enam', 'Tujuh', 'Delapan', 'Sembilan', 'Sepuluh', 'Sebelas'];
  if (n < 12) return bilangan[n];
  if (n < 20) return `${bilangan[n - 10]} Belas`;
  if (n < 100) return `${bilangan[Math.floor(n / 10)]} Puluh ${bilangan[n % 10]}`.trim();
  if (n < 200) return `Seratus ${formatRupiahWords(n - 100)}`.trim();
  if (n < 1000) return `${bilangan[Math.floor(n / 100)]} Ratus ${formatRupiahWords(n % 100)}`.trim();
  if (n < 2000) return `Seribu ${formatRupiahWords(n - 1000)}`.trim();
  if (n < 1000000) return `${formatRupiahWords(Math.floor(n / 1000))} Ribu ${formatRupiahWords(n % 1000)}`.trim();
  if (n < 1000000000) return `${formatRupiahWords(Math.floor(n / 1000000))} Juta ${formatRupiahWords(n % 1000000)}`.trim();
  if (n < 1000000000000) return `${formatRupiahWords(Math.floor(n / 1000000000))} Miliar ${formatRupiahWords(n % 1000000000)}`.trim();
  return `${n}`;
}

function getKwitansiForCustomer(customer: Customer, allPurchases: CustomerPurchase[] = []): KwitansiData {
  const purchase = allPurchases.find(
    (p) =>
      p.customerId === customer.id ||
      (customer.plateNumber && p.plateNumber === customer.plateNumber) ||
      (p.customerName && customer.fullName && p.customerName.toLowerCase() === customer.fullName.toLowerCase())
  );

  const terimaDari = customer.fullName || purchase?.customerName || 'Konsumen Showroom';
  const plateNo = customer.plateNumber || purchase?.plateNumber || '-';
  const isCredit = purchase ? purchase.paymentType === 'Kredit' : customer.paymentType === 'Kredit';
  const untukPembayaran = purchase
    ? (isCredit
        ? `UANG MUKA (DP) UNIT ${purchase.vehicleName} ${purchase.leasingPartner ? `VIA ${purchase.leasingPartner.toUpperCase()}` : ''}`
        : `PELUNASAN UNIT ${purchase.vehicleName}`)
    : (customer.interestedVehicle || '1 UNIT KENDARAAN');

  const nominal = purchase
    ? (isCredit ? (purchase.downPayment || customer.receiptAmount || 0) : (purchase.purchasePrice || customer.receiptAmount || 0))
    : (customer.receiptAmount || Number(customer.budget) || 0);

  const terbilang = `${formatRupiahWords(nominal)} Rupiah`;
  const tempatTanggal =
    customer.receiptDate ||
    purchase?.receiptDate ||
    `GARUT, ${customer.registeredDate || new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }).toUpperCase()}`;
  const keterangan = customer.receiptNotes || customer.notes || purchase?.notes || (isCredit ? 'DP Kredit ACC' : 'Lunas (Cash)');
  const penerima = customer.receiptReceiver || purchase?.salesName || 'HR MOTOR';
  const nomorKwitansi =
    customer.receiptNumber ||
    (purchase?.receiptNumber) ||
    `No. ${customer.id?.replace('CUST-2026-', '').replace(/^0+/, '') || '1'}`;

  return {
    nomorKwitansi,
    terimaDari,
    sejumlahUang: nominal,
    terbilang,
    untukPembayaran,
    nomorPolisi: plateNo,
    tempatTanggal,
    keterangan,
    penerima,
  };
}

function printKwitansiToIframe(kwitansi: KwitansiData) {
  if (typeof window === 'undefined') return;

  const oldIframe = document.getElementById('kwitansi-print-frame');
  if (oldIframe) {
    oldIframe.remove();
  }

  const iframe = document.createElement('iframe');
  iframe.id = 'kwitansi-print-frame';
  iframe.style.position = 'fixed';
  iframe.style.top = '-9999px';
  iframe.style.left = '-9999px';
  iframe.style.width = '1px';
  iframe.style.height = '1px';
  iframe.style.border = 'none';
  document.body.appendChild(iframe);

  const doc = iframe.contentWindow?.document;
  if (!doc) return;

  const html = `
<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="utf-8" />
  <title>Kwitansi - ${kwitansi.terimaDari || 'HR MOTOR'}</title>
  <style>
    @page {
      size: portrait;
      margin: 0;
    }
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    html, body {
      width: 100%;
      height: 100%;
      background: #ffffff;
      font-family: Arial, Helvetica, sans-serif;
      color: #000000;
      overflow: hidden;
    }
    .print-wrapper {
      width: 100%;
      max-width: 190mm;
      margin: 8mm auto 0 auto;
      page-break-after: avoid !important;
      page-break-inside: avoid !important;
      break-after: avoid !important;
      break-inside: avoid !important;
    }
    .kwitansi-card {
      position: relative;
      background: #ffffff;
      border: 1.5px solid #000000;
      width: 100%;
      overflow: hidden;
      display: flex;
      flex-direction: column;
    }
    .yellow-band {
      width: 100%;
      height: 12px;
      background-color: #FFEE00 !important;
      border-bottom: 1px solid rgba(0, 0, 0, 0.2);
    }
    .yellow-band.bottom {
      border-bottom: none;
      border-top: 1px solid rgba(0, 0, 0, 0.2);
    }
    .card-body {
      position: relative;
      display: flex;
      min-height: 290px;
    }
    .main-section {
      flex: 1;
      padding: 16px 24px 14px 24px;
      position: relative;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    }
    .watermark-img {
      position: absolute;
      left: 50%;
      top: 50%;
      transform: translate(-50%, -50%);
      width: 300px;
      opacity: 0.12;
      pointer-events: none;
      user-select: none;
      z-index: 1;
    }
    .top-logo-wrap {
      display: flex;
      justify-content: center;
      margin-bottom: 12px;
      position: relative;
      z-index: 2;
    }
    .top-logo-wrap img {
      height: 60px;
      width: auto;
      object-fit: contain;
    }
    .content-table {
      position: relative;
      z-index: 2;
      font-size: 13px;
      line-height: 1.45;
    }
    .content-row {
      display: flex;
      align-items: baseline;
      margin-bottom: 4px;
    }
    .c-label {
      width: 140px;
      font-weight: bold;
      flex-shrink: 0;
    }
    .c-colon {
      font-weight: bold;
      margin-right: 10px;
      flex-shrink: 0;
    }
    .c-val {
      flex: 1;
      font-weight: normal;
    }
    .c-val.bold {
      font-weight: bold;
    }
    .c-val.uppercase {
      text-transform: uppercase;
    }
    .bottom-row {
      position: relative;
      z-index: 2;
      display: flex;
      align-items: flex-end;
      justify-content: space-between;
      margin-top: 18px;
    }
    .amount-wrap {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .amount-title {
      font-size: 13px;
      font-weight: bold;
    }
    .amount-parallelogram {
      border: 2px solid #000000;
      transform: skewX(-25deg);
      padding: 3px 24px;
      background: #ffffff;
      display: inline-block;
    }
    .amount-number {
      display: inline-block;
      transform: skewX(25deg);
      font-family: Arial, monospace;
      font-weight: bold;
      font-size: 14px;
      color: #000000;
    }
    .signature-wrap {
      text-align: right;
      font-size: 12px;
      padding-right: 4px;
    }
    .sig-date {
      font-size: 12px;
      color: #000000;
    }
    .sig-label {
      margin-top: 2px;
      color: #000000;
    }
    .sig-space {
      height: 44px;
    }
    .sig-name {
      font-weight: bold;
      text-transform: uppercase;
      color: #000000;
    }
  </style>
</head>
<body>
  <div class="print-wrapper">
    <div class="kwitansi-card">
      <div class="yellow-band"></div>
      <div class="card-body">
        <div class="main-section">
          <img src="/logo-hr-motor.png" class="watermark-img" alt="" />
          <div class="top-logo-wrap">
            <img src="/logo-hr-motor.png" alt="HR MOTOR" />
          </div>
          <div class="content-table">
            <div class="content-row">
              <span class="c-label">Terima Dari</span>
              <span class="c-colon">:</span>
              <span class="c-val bold uppercase">${kwitansi.terimaDari || '-'}</span>
            </div>
            <div class="content-row">
              <span class="c-label">Sejumlah Uang</span>
              <span class="c-colon">:</span>
              <span class="c-val bold">${kwitansi.terbilang || '-'}</span>
            </div>
            <div class="content-row">
              <span class="c-label">Untuk Pembayaran</span>
              <span class="c-colon">:</span>
              <span class="c-val bold uppercase">${kwitansi.untukPembayaran || '-'}</span>
            </div>
            <div class="content-row">
              <span class="c-label">Plat No</span>
              <span class="c-colon">:</span>
              <span class="c-val bold uppercase">${kwitansi.nomorPolisi || '-'}</span>
            </div>
            <div class="content-row">
              <span class="c-label">Keterangan</span>
              <span class="c-colon">:</span>
              <span class="c-val">${kwitansi.keterangan || 'Walk in'}</span>
            </div>
          </div>
          <div class="bottom-row">
            <div class="amount-wrap">
              <span class="amount-title">Jumlah Rp</span>
              <div class="amount-parallelogram">
                <span class="amount-number">${(kwitansi.sejumlahUang || 0).toLocaleString('id-ID')}</span>
              </div>
            </div>
            <div class="signature-wrap">
              <div class="sig-date">${kwitansi.tempatTanggal || 'GARUT'}</div>
              <div class="sig-label">Penerima</div>
              <div class="sig-space"></div>
              <div class="sig-name">${kwitansi.penerima || 'HR MOTOR'}</div>
            </div>
          </div>
        </div>
      </div>
      <div class="yellow-band bottom"></div>
    </div>
  </div>
</body>
</html>
  `;

  doc.open();
  doc.write(html);
  doc.close();

  const triggerPrint = () => {
    try {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
    } catch {
      window.print();
    }
  };

  const img = doc.querySelector('.top-logo-wrap img') as HTMLImageElement;
  if (img && !img.complete) {
    img.onload = () => setTimeout(triggerPrint, 200);
    img.onerror = () => setTimeout(triggerPrint, 200);
  } else {
    setTimeout(triggerPrint, 200);
  }
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
    combined.includes('hr-v') ||
    combined.includes('hrv') ||
    combined.includes('cr-v') ||
    combined.includes('crv') ||
    combined.includes('raize') ||
    combined.includes('rocky') ||
    combined.includes('creta') ||
    combined.includes('almaz') ||
    combined.includes('mu-x') ||
    combined.includes('everest') ||
    combined.includes('santa fe') ||
    combined.includes('palisade') ||
    combined.includes('wr-v') ||
    combined.includes('wrv')
  ) {
    return 'SUV';
  }
  if (
    combined.includes('brio') ||
    combined.includes('agya') ||
    combined.includes('ayla') ||
    combined.includes('ignis') ||
    combined.includes('sirion') ||
    combined.includes('karimun') ||
    combined.includes('picanto') ||
    combined.includes('march')
  ) {
    return 'City Car';
  }
  if (
    combined.includes('yaris') ||
    combined.includes('jazz') ||
    combined.includes('baleno') ||
    combined.includes('swift') ||
    combined.includes('rio')
  ) {
    return 'Hatchback';
  }
  if (
    combined.includes('civic') ||
    combined.includes('city') ||
    combined.includes('corolla') ||
    combined.includes('camry') ||
    combined.includes('vios') ||
    combined.includes('accord') ||
    combined.includes('altis') ||
    combined.includes('mercedes') ||
    combined.includes('bmw')
  ) {
    return 'Sedan';
  }
  if (
    combined.includes('gran max') ||
    combined.includes('carry') ||
    combined.includes('l300') ||
    combined.includes('hilux') ||
    combined.includes('triton') ||
    combined.includes('blind van') ||
    combined.includes('pickup') ||
    combined.includes('d-max')
  ) {
    return 'Commercial';
  }
  return 'MPV';
}

export default function CustomersPage() {
  const {
    customers,
    leads,
    followUps,
    communications,
    purchases,
    repairClaims,
    stocks,
    users,
    currentUser,
    creditApplications,
    createCashTransaction,
    createCreditApplication,
    approveCreditApplication,
    rejectCreditApplication,
    addCustomer,
    updateCustomer,
    deleteCustomer,
    formatRupiah,
    formatDate,
    formatWhatsAppLink,
  } = useCrm();

  // Active Tab: 'customers' (Tabel Pelanggan & Penjualan) | 'pending' (Menunggu ACC) | 'rejected' (Kredit Ditolak)
  const [activeTab, setActiveTab] = useState<'customers' | 'pending' | 'rejected'>('customers');
  const [filterPayment, setFilterPayment] = useState<'ALL' | 'CASH' | 'CREDIT'>('ALL');
  const [filterTxType, setFilterTxType] = useState<'ALL' | 'CASH' | 'PENDING' | 'APPROVED' | 'REJECTED'>('ALL');

  // Hanya pembeli resmi (Sudah Beli) yang tampil di Tabel Data Pelanggan (Permintaan User)
  const officialCustomers = useMemo(() => {
    return (customers || []).filter((c) => {
      if (c.creditStatus === 'PENDING' || c.creditStatus === 'REJECTED') return false;
      return c.status === 'Sudah Beli' || c.paymentType === 'Cash' || c.creditStatus === 'APPROVED' || !c.creditStatus;
    });
  }, [customers]);

  const cashSalesCount = useMemo(() => {
    return (purchases || []).filter((p) => {
      const m = (p.paymentMethod || '').toLowerCase();
      return m.includes('cash') || p.paymentType === 'Cash';
    }).length;
  }, [purchases]);

  const pendingCreditCount = useMemo(() => {
    return (creditApplications || []).filter((a) => a.status === 'PENDING').length;
  }, [creditApplications]);

  const approvedCreditCount = useMemo(() => {
    return (creditApplications || []).filter((a) => a.status === 'APPROVED').length;
  }, [creditApplications]);

  const rejectedCreditCount = useMemo(() => {
    return (creditApplications || []).filter((a) => a.status === 'REJECTED').length;
  }, [creditApplications]);

  const totalTransactionsCount = useMemo(() => {
    return (purchases || []).length + (creditApplications || []).length;
  }, [purchases, creditApplications]);

  // Modals state for Cash & Credit transactions
  const [isCashModalOpen, setIsCashModalOpen] = useState(false);
  const [isCreditModalOpen, setIsCreditModalOpen] = useState(false);
  const [isAccModalOpen, setIsAccModalOpen] = useState(false);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [selectedCreditApp, setSelectedCreditApp] = useState<CreditApplication | null>(null);

  // Cash transaction form
  const [cashForm, setCashForm] = useState({
    customerName: '',
    customerPhone: '',
    customerAddress: '',
    customerSource: 'Walk-in' as LeadSourceType,
    vehicleStockId: '',
    dealPrice: '',
    notes: '',
    transactionDate: new Date().toISOString().split('T')[0],
    prospectFollowUpId: '',
  });

  // Credit application form
  const [creditForm, setCreditForm] = useState({
    customerName: '',
    customerPhone: '',
    customerAddress: '',
    customerSource: 'Walk-in' as LeadSourceType,
    vehicleStockId: '',
    targetLeasing: 'BCA Finance',
    dealPrice: '',
    initialDp: '',
    notes: '',
    applicationDate: new Date().toISOString().split('T')[0],
    prospectFollowUpId: '',
  });

  // ACC form
  const [accForm, setAccForm] = useState({
    finalDp: '',
    approvedLeasing: '',
    approvalNotes: '',
  });

  // Reject form
  const [rejectReason, setRejectReason] = useState('');

  // Dropdown search for vehicle selection
  const [cashStockSearch, setCashStockSearch] = useState('');
  const [isCashStockDropdownOpen, setIsCashStockDropdownOpen] = useState(false);
  const [creditStockSearch, setCreditStockSearch] = useState('');
  const [isCreditStockDropdownOpen, setIsCreditStockDropdownOpen] = useState(false);

  // Detect URL parameter ?tab=... & action=cash/credit
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get('tab');
      const action = params.get('action');
      const prospectId = params.get('prospectId');

      if (tabParam === 'transactions' || tabParam === 'pending' || action === 'credit') {
        setActiveTab('pending');
      } else if (tabParam === 'rejected') {
        setActiveTab('rejected');
      } else if (tabParam === 'all_transactions' || action === 'cash' || tabParam === 'customers') {
        setActiveTab('customers');
      }

      if (action === 'cash') {
        setCashForm({
          customerName: params.get('name') || '',
          customerPhone: params.get('phone') || '',
          customerAddress: params.get('address') || '',
          customerSource: (params.get('source') as any) || 'Walk-in',
          vehicleStockId: params.get('stockId') || '',
          dealPrice: params.get('price') || '',
          notes: prospectId ? `Deal dari Prospek Follow-Up [${prospectId}]` : '',
          transactionDate: new Date().toISOString().split('T')[0],
          prospectFollowUpId: prospectId || '',
        });
        setIsCashModalOpen(true);
      } else if (action === 'credit') {
        setCreditForm({
          customerName: params.get('name') || '',
          customerPhone: params.get('phone') || '',
          customerAddress: params.get('address') || '',
          customerSource: (params.get('source') as any) || 'Walk-in',
          vehicleStockId: params.get('stockId') || '',
          targetLeasing: 'BCA Finance',
          dealPrice: params.get('price') || '',
          initialDp: params.get('dp') || '',
          notes: prospectId ? `Pengajuan kredit dari Prospek Follow-Up [${prospectId}]` : '',
          applicationDate: new Date().toISOString().split('T')[0],
          prospectFollowUpId: prospectId || '',
        });
        setIsCreditModalOpen(true);
      }
    }
  }, []);

  // Search & Filter & Sort state
  const [searchQuery, setSearchQuery] = useState('');
  const [filterSource, setFilterSource] = useState('ALL');
  const [filterType, setFilterType] = useState('ALL');
  const [sortBy, setSortBy] = useState<'date' | 'name' | 'budget'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [selectedKwitansi, setSelectedKwitansi] = useState<KwitansiData | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [formError, setFormError] = useState('');

  // Sinkronisasi class kwitansi-open ke body untuk CSS print isolation
  useEffect(() => {
    if (selectedKwitansi) {
      document.body.classList.add('kwitansi-open');
    } else {
      document.body.classList.remove('kwitansi-open');
    }
    return () => {
      document.body.classList.remove('kwitansi-open');
    };
  }, [selectedKwitansi]);

  // Ready stocks dropdown & search state for "Mobil Diminati"
  const [isStockDropdownOpen, setIsStockDropdownOpen] = useState(false);
  const [stockSearchQuery, setStockSearchQuery] = useState('');
  const stockDropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (stockDropdownRef.current && !stockDropdownRef.current.contains(event.target as Node)) {
        setIsStockDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Filter ready showroom stock (status: 'Tersedia')
  const readyStocks = useMemo(() => {
    return (stocks || []).filter((s) => s.status === 'Tersedia');
  }, [stocks]);

  const filteredReadyStocks = useMemo(() => {
    const q = (stockSearchQuery || '').trim().toLowerCase();
    if (!q) return readyStocks;
    return readyStocks.filter((s) => {
      const brand = (s.brand || '').toLowerCase();
      const model = (s.model || '').toLowerCase();
      const merk = (s.merkType || '').toLowerCase();
      const plate = (s.licensePlate || s.plateNumber || '').toLowerCase();
      const year = String(s.year || '');
      const color = (s.color || '').toLowerCase();
      return (
        brand.includes(q) ||
        model.includes(q) ||
        merk.includes(q) ||
        plate.includes(q) ||
        year.includes(q) ||
        color.includes(q)
      );
    });
  }, [readyStocks, stockSearchQuery]);

  const handleSelectStock = (stock: any) => {
    const fullName = `${stock.brand} ${stock.model} ${stock.year}`.trim();
    const plate = stock.licensePlate || stock.plateNumber || '';
    const category = guessVehicleCategory(stock.brand, stock.model);

    setFormData((prev) => ({
      ...prev,
      interestedVehicle: fullName,
      vehicleType: category,
      budget: String(stock.price || prev.budget || ''),
      plateNumber: plate || prev.plateNumber,
      receiptAmount: String(stock.price || prev.receiptAmount || ''),
      notes: prev.notes || `Unit Ready Stok Showroom: ${fullName} (Plat: ${plate || '-'}).`,
    }));
    setIsStockDropdownOpen(false);
    setStockSearchQuery('');
  };

  const filteredCashReadyStocks = useMemo(() => {
    const q = (cashStockSearch || '').trim().toLowerCase();
    if (!q) return readyStocks;
    return readyStocks.filter((s) => {
      const brand = (s.brand || '').toLowerCase();
      const model = (s.model || '').toLowerCase();
      const plate = (s.licensePlate || s.plateNumber || '').toLowerCase();
      const year = String(s.year || '');
      return brand.includes(q) || model.includes(q) || plate.includes(q) || year.includes(q);
    });
  }, [readyStocks, cashStockSearch]);

  const filteredCreditReadyStocks = useMemo(() => {
    const q = (creditStockSearch || '').trim().toLowerCase();
    if (!q) return readyStocks;
    return readyStocks.filter((s) => {
      const brand = (s.brand || '').toLowerCase();
      const model = (s.model || '').toLowerCase();
      const plate = (s.licensePlate || s.plateNumber || '').toLowerCase();
      const year = String(s.year || '');
      return brand.includes(q) || model.includes(q) || plate.includes(q) || year.includes(q);
    });
  }, [readyStocks, creditStockSearch]);

  const handleSelectCashStock = (stock: any) => {
    setCashForm((prev) => ({
      ...prev,
      vehicleStockId: stock.id,
      dealPrice: String(stock.price || prev.dealPrice || ''),
      notes: prev.notes || `Pembelian Cash: ${stock.brand} ${stock.model} (${stock.licensePlate || '-'}).`,
    }));
    setIsCashStockDropdownOpen(false);
    setCashStockSearch('');
  };

  const handleSelectCreditStock = (stock: any) => {
    const dealPrice = stock.price || 0;
    const dp = stock.creditDp || Math.round(dealPrice * 0.2);
    setCreditForm((prev) => ({
      ...prev,
      vehicleStockId: stock.id,
      dealPrice: String(dealPrice || prev.dealPrice || ''),
      initialDp: String(dp || prev.initialDp || ''),
      notes: prev.notes || `Pengajuan Kredit: ${stock.brand} ${stock.model} (${stock.licensePlate || '-'}).`,
    }));
    setIsCreditStockDropdownOpen(false);
    setCreditStockSearch('');
  };

  const handleOpenCashModal = () => {
    setCashForm({
      customerName: '',
      customerPhone: '',
      customerAddress: '',
      customerSource: 'Walk-in',
      vehicleStockId: '',
      dealPrice: '',
      notes: '',
      transactionDate: new Date().toISOString().split('T')[0],
      prospectFollowUpId: '',
    });
    setFormError('');
    setIsCashModalOpen(true);
  };

  const handleOpenCreditModal = () => {
    setCreditForm({
      customerName: '',
      customerPhone: '',
      customerAddress: '',
      customerSource: 'Walk-in',
      vehicleStockId: '',
      targetLeasing: 'BCA Finance',
      dealPrice: '',
      initialDp: '',
      notes: '',
      applicationDate: new Date().toISOString().split('T')[0],
      prospectFollowUpId: '',
    });
    setFormError('');
    setIsCreditModalOpen(true);
  };

  const handleOpenAccModal = (app: CreditApplication) => {
    setSelectedCreditApp(app);
    setAccForm({
      finalDp: String(app.initialDp || ''),
      approvedLeasing: app.targetLeasing,
      approvalNotes: '',
    });
    setFormError('');
    setIsAccModalOpen(true);
  };

  const handleOpenRejectModal = (app: CreditApplication) => {
    setSelectedCreditApp(app);
    setRejectReason('');
    setFormError('');
    setIsRejectModalOpen(true);
  };

  const handleOpenCreditHistory = (app: CreditApplication) => {
    setSelectedCreditApp(app);
    setIsHistoryModalOpen(true);
  };

  const handleSubmitCashTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    if (!cashForm.customerName.trim() || !cashForm.customerPhone.trim() || !cashForm.vehicleStockId) {
      setFormError('Nama pelanggan, nomor WhatsApp, dan unit mobil wajib diisi');
      return;
    }
    const chosenStock = stocks.find((s) => s.id === cashForm.vehicleStockId);
    const nominal = Number(cashForm.dealPrice) || chosenStock?.price || 0;

    const res = await createCashTransaction({
      ...cashForm,
      dealPrice: nominal,
    });

    if (res.success) {
      setIsCashModalOpen(false);
      setActiveTab('customers'); // Otomatis tampil di Tabel Data Pelanggan
      // Auto-preview Kwitansi
      const plateNo = chosenStock?.licensePlate || chosenStock?.plateNumber || '-';
      const vehicleDesc = chosenStock ? `${chosenStock.brand} ${chosenStock.model} (${chosenStock.year})` : '1 UNIT KENDARAAN';
      const todayStr = new Date(cashForm.transactionDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }).toUpperCase();
      setSelectedKwitansi({
        nomorKwitansi: `No. ${officialCustomers.length + 1}`,
        terimaDari: cashForm.customerName,
        sejumlahUang: nominal,
        terbilang: `${formatRupiahWords(nominal)} Rupiah`,
        untukPembayaran: vehicleDesc,
        nomorPolisi: plateNo,
        tempatTanggal: `GARUT, ${todayStr}`,
        keterangan: cashForm.notes || 'Lunas (Cash)',
        penerima: 'HR MOTOR',
      });
    } else {
      setFormError(res.error || 'Gagal menyimpan transaksi cash');
    }
  };

  const handleSubmitCreditApplication = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    if (!creditForm.customerName.trim() || !creditForm.customerPhone.trim() || !creditForm.vehicleStockId || !creditForm.targetLeasing) {
      setFormError('Nama pelanggan, nomor WhatsApp, unit mobil, dan bank/leasing tujuan wajib diisi');
      return;
    }
    const chosenStock = stocks.find((s) => s.id === creditForm.vehicleStockId);
    const dealPrice = Number(creditForm.dealPrice) || chosenStock?.price || 0;
    const initialDp = Number(creditForm.initialDp) || chosenStock?.creditDp || Math.round(dealPrice * 0.2);

    const res = await createCreditApplication({
      ...creditForm,
      dealPrice,
      initialDp,
    });

    if (res.success) {
      setIsCreditModalOpen(false);
      setActiveTab('pending'); // Permintaan User: Masuk ke tabel Menunggu ACC (TIDAK masuk tabel pelanggan)
    } else {
      setFormError(res.error || 'Gagal menyimpan pengajuan kredit');
    }
  };

  const handleSubmitAcc = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCreditApp) return;
    setFormError('');
    const finalDp = Number(accForm.finalDp) || selectedCreditApp.initialDp;

    const res = await approveCreditApplication({
      applicationId: selectedCreditApp.id,
      finalDp,
      approvedLeasing: accForm.approvedLeasing,
      approvalNotes: accForm.approvalNotes,
    });

    if (res.success) {
      setIsAccModalOpen(false);
      setActiveTab('customers'); // Permintaan User: Kredit ACC OTOMATIS masuk ke tabel data pelanggan
      // Auto-preview Kwitansi DP resmi Showroom HR MOTOR
      const todayStr = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }).toUpperCase();
      const leasingName = accForm.approvedLeasing || selectedCreditApp.approvedLeasing || selectedCreditApp.targetLeasing;
      setSelectedKwitansi({
        nomorKwitansi: `DP-${selectedCreditApp.id}`,
        terimaDari: selectedCreditApp.customerName,
        sejumlahUang: finalDp,
        terbilang: `${formatRupiahWords(finalDp)} Rupiah`,
        untukPembayaran: `Uang Muka (DP) Kredit Unit ${selectedCreditApp.vehicleName} via ${leasingName}`,
        nomorPolisi: selectedCreditApp.plateNumber || '-',
        tempatTanggal: `GARUT, ${todayStr}`,
        keterangan: accForm.approvalNotes || `Persetujuan Kredit (ACC) ${leasingName}`,
        penerima: 'HR MOTOR',
      });
      setSelectedCreditApp(null);
    } else {
      setFormError(res.error || 'Gagal memproses persetujuan kredit');
    }
  };

  const handleSubmitReject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCreditApp) return;
    setFormError('');
    const reason = rejectReason.trim() || 'Ditolak oleh pihak bank/leasing (BI Checking / Kapasitas)';

    const res = await rejectCreditApplication({
      applicationId: selectedCreditApp.id,
      rejectionReason: reason,
    });

    if (res.success) {
      setIsRejectModalOpen(false);
      setSelectedCreditApp(null);
      setActiveTab('rejected'); // Permintaan User: Masuk ke tabel kredit ditolak (TIDAK masuk data pelanggan)
    } else {
      setFormError(res.error || 'Gagal memproses penolakan kredit');
    }
  };

  // Filtered Transactions

  const filteredTransactions = useMemo(() => {
    const creditApps = creditApplications || [];
    const cashPurchases = (purchases || []).filter((p) => p.paymentType === 'Cash' || !p.paymentType);

    let allItems: Array<
      | { type: 'CASH'; data: CustomerPurchase; date: string }
      | { type: 'CREDIT'; data: CreditApplication; date: string }
    > = [];

    if (filterTxType === 'ALL' || filterTxType === 'CASH') {
      cashPurchases.forEach((p) => allItems.push({ type: 'CASH', data: p, date: p.purchaseDate }));
    }

    if (filterTxType === 'ALL' || filterTxType !== 'CASH') {
      creditApps.forEach((app) => {
        if (filterTxType === 'PENDING' && app.status !== 'PENDING') return;
        if (filterTxType === 'APPROVED' && app.status !== 'APPROVED') return;
        if (filterTxType === 'REJECTED' && app.status !== 'REJECTED') return;
        allItems.push({ type: 'CREDIT', data: app, date: app.applicationDate });
      });
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      allItems = allItems.filter((item) => {
        if (item.type === 'CASH') {
          const p = item.data;
          return (
            p.customerName.toLowerCase().includes(q) ||
            p.vehicleModel.toLowerCase().includes(q) ||
            (p.plateNumber && p.plateNumber.toLowerCase().includes(q))
          );
        } else {
          const a = item.data;
          return (
            a.customerName.toLowerCase().includes(q) ||
            a.customerPhone.includes(q) ||
            a.vehicleName.toLowerCase().includes(q) ||
            a.targetLeasing.toLowerCase().includes(q) ||
            (a.approvedLeasing && a.approvedLeasing.toLowerCase().includes(q))
          );
        }
      });
    }

    allItems.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    return allItems;
  }, [creditApplications, purchases, filterTxType, searchQuery]);

  // Form input state
  const [formData, setFormData] = useState({
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
    plateNumber: '',
    receiptAmount: '',
    receiptDate: '',
    receiptReceiver: 'HR MOTOR',
  });

  // Filtered & Sorted Customers (Hanya pembeli sah / resmi)
  const processedCustomers = useMemo(() => {
    let result = [...officialCustomers];

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (c) =>
          c.fullName.toLowerCase().includes(q) ||
          c.whatsapp.includes(q) ||
          c.district.toLowerCase().includes(q) ||
          c.address.toLowerCase().includes(q) ||
          c.interestedVehicle.toLowerCase().includes(q) ||
          (c.plateNumber && c.plateNumber.toLowerCase().includes(q)) ||
          c.id.toLowerCase().includes(q)
      );
    }

    // Filters
    if (filterSource !== 'ALL') {
      result = result.filter((c) => c.source === filterSource);
    }
    if (filterType !== 'ALL') {
      result = result.filter((c) => c.vehicleType === filterType);
    }

    // Filter by payment method (Cash / Kredit)
    if (filterPayment === 'CASH') {
      result = result.filter((c) => {
        const isCredit = c.paymentType === 'Kredit' || c.creditStatus === 'APPROVED';
        return !isCredit;
      });
    } else if (filterPayment === 'CREDIT') {
      result = result.filter((c) => {
        const isCredit = c.paymentType === 'Kredit' || c.creditStatus === 'APPROVED';
        return isCredit;
      });
    }

    // Sort
    result.sort((a, b) => {
      if (sortBy === 'name') {
        const cmp = a.fullName.localeCompare(b.fullName);
        return sortOrder === 'asc' ? cmp : -cmp;
      }
      if (sortBy === 'budget') {
        return sortOrder === 'asc' ? a.budget - b.budget : b.budget - a.budget;
      }
      // date
      const dateA = new Date(a.registeredDate || a.updatedAt).getTime();
      const dateB = new Date(b.registeredDate || b.updatedAt).getTime();
      return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
    });

    return result;
  }, [officialCustomers, searchQuery, filterSource, filterType, filterPayment, sortBy, sortOrder]);

  const openAddModal = () => {
    setEditingCustomer(null);
    const todayStr = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }).toUpperCase();
    setFormData({
      fullName: '',
      whatsapp: '',
      email: '',
      address: '',
      district: 'Tarogong Kidul',
      source: 'Walk-in',
      interestedVehicle: '',
      vehicleType: 'MPV',
      budget: '',
      notes: '',
      plateNumber: '',
      receiptAmount: '',
      receiptDate: `GARUT, ${todayStr}`,
      receiptReceiver: 'HR MOTOR',
    });
    setFormError('');
    setIsStockDropdownOpen(false);
    setStockSearchQuery('');
    setIsAddModalOpen(true);
  };

  const openEditModal = (c: Customer) => {
    setEditingCustomer(c);
    const kw = getKwitansiForCustomer(c, purchases);
    setFormData({
      fullName: c.fullName,
      whatsapp: c.whatsapp,
      email: c.email || '',
      address: c.address,
      district: c.district || 'Tarogong Kidul',
      source: c.source === 'Referral' ? 'Walk-in' : c.source,
      interestedVehicle: c.interestedVehicle,
      vehicleType: c.vehicleType || 'MPV',
      budget: String(c.budget || ''),
      notes: c.notes || '',
      plateNumber: c.plateNumber || kw.nomorPolisi || '',
      receiptAmount: String(c.receiptAmount || kw.sejumlahUang || ''),
      receiptDate: c.receiptDate || kw.tempatTanggal || '',
      receiptReceiver: c.receiptReceiver || kw.penerima || 'HR MOTOR',
    });
    setFormError('');
    setIsStockDropdownOpen(false);
    setStockSearchQuery('');
    setIsAddModalOpen(true);
  };

  const handleSaveCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    const nominal = Number(formData.receiptAmount || formData.budget) || 0;
    const todayStr = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }).toUpperCase();
    const placeDate = formData.receiptDate.trim() || `GARUT, ${todayStr}`;
    const receiver = formData.receiptReceiver.trim() || 'HR MOTOR';
    const plateNo = formData.plateNumber.trim().toUpperCase();

    if (editingCustomer) {
      // Update
      const res = await updateCustomer({
        id: editingCustomer.id,
        ...formData,
        plateNumber: plateNo,
        receiptAmount: nominal,
        budget: nominal,
        receiptDate: placeDate,
        receiptReceiver: receiver,
        receiptNotes: formData.notes,
        status: editingCustomer.status || 'Sudah Beli',
      });

      if (res.success) {
        setIsAddModalOpen(false);
      } else {
        setFormError(res.error || 'Gagal memperbarui data');
      }
    } else {
      // Add Customer + Otomatis generate Kwitansi
      const newReceiptNumber = `No. ${customers.length + 1}`;
      const payload: Partial<Customer> = {
        ...formData,
        plateNumber: plateNo,
        receiptAmount: nominal,
        budget: nominal,
        receiptNumber: newReceiptNumber,
        receiptDate: placeDate,
        receiptReceiver: receiver,
        receiptNotes: formData.notes,
        status: 'Sudah Beli',
      };

      const res = await addCustomer(payload);

      if (res.success) {
        setIsAddModalOpen(false);
        // Otomatis tampilkan kwitansi resmi yang siap di-print
        setSelectedKwitansi({
          nomorKwitansi: newReceiptNumber,
          terimaDari: formData.fullName,
          sejumlahUang: nominal,
          terbilang: `${formatRupiahWords(nominal)} Rupiah`,
          untukPembayaran: formData.interestedVehicle || '1 UNIT KENDARAAN',
          nomorPolisi: plateNo || '-',
          tempatTanggal: placeDate,
          keterangan: formData.notes || 'Lunas',
          penerima: receiver,
        });
      } else {
        setFormError(res.error || 'Gagal menyimpan data');
      }
    }
  };

  const handleDelete = async (id: string) => {
    setIsDeleting(true);
    const res = await deleteCustomer(id);
    setIsDeleting(false);
    setDeleteConfirmId(null);
    if (selectedCustomer?.id === id) {
      setSelectedCustomer(null);
    }
    if (!res.success) {
      alert(res.error || 'Gagal menghapus data pelanggan');
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. UNIFIED MAIN HEADER: Satu Pintu Manajemen Pelanggan & Transaksi Penjualan */}
      <div className="crm-card p-4 sm:p-6 border-b-2 border-b-gold-500/40">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="badge-gold">Basis Data Konsumen &amp; Penjualan</span>
              <span className="text-xs text-charcoal-300">•</span>
              <span className="text-xs text-charcoal-400 font-medium tracking-wide">Showroom HR MOTOR Garut</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-charcoal-900 mt-1 tracking-tight">
              Basis Data Pelanggan &amp; Transaksi Penjualan
            </h1>
            <p className="text-xs text-charcoal-500 mt-0.5">
              Sistem satu pintu kelola pembeli resmi (Tunai &amp; Kredit ACC), pengajuan kredit leasing (Menunggu ACC &amp; Ditolak), dan cetak kwitansi kasir showroom.
            </p>
          </div>

          {/* Quick Action Buttons (Selalu Dapat Diakses dari Semua Tab) */}
          <div className="grid grid-cols-1 sm:flex sm:items-center gap-2 w-full lg:w-auto">
            <button
              type="button"
              onClick={() => {
                setFormError('');
                setIsCashModalOpen(true);
              }}
              className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer w-full sm:w-auto"
            >
              <Banknote className="w-4 h-4" />
              <span>+ Transaksi Tunai Baru</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setFormError('');
                setIsCreditModalOpen(true);
              }}
              className="px-4 py-2.5 rounded-xl bg-gold-500 hover:bg-gold-600 text-charcoal-950 font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer w-full sm:w-auto"
            >
              <CreditCard className="w-4 h-4 text-charcoal-950" />
              <span>+ Pengajuan Kredit Baru</span>
            </button>
          </div>
        </div>

        {/* 5 Quick KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2.5 sm:gap-3 mt-5 pt-4 border-t border-[#EAE8E3]">
          <div className="bg-[#FAF9F5] p-3 rounded-xl border border-[#EAE8E3]/80">
            <p className="text-[10px] sm:text-[11px] font-semibold text-charcoal-400 uppercase tracking-wider">Total Pelanggan Resmi</p>
            <p className="text-lg sm:text-xl font-black text-charcoal-900 mt-0.5">{officialCustomers.length} Konsumen</p>
          </div>
          <div className="bg-[#FAF9F5] p-3 rounded-xl border border-[#EAE8E3]/80">
            <p className="text-[10px] sm:text-[11px] font-semibold text-emerald-800 uppercase tracking-wider flex items-center gap-1">
              <Banknote className="w-3.5 h-3.5 text-emerald-600" /> Penjualan Cash
            </p>
            <p className="text-lg sm:text-xl font-black text-emerald-700 mt-0.5">{cashSalesCount} Unit</p>
          </div>
          <div className={`p-3 rounded-xl border transition-all ${
            pendingCreditCount > 0 ? 'bg-amber-50 border-amber-300' : 'bg-[#FAF9F5] border-[#EAE8E3]/80'
          }`}>
            <p className="text-[10px] sm:text-[11px] font-bold text-amber-900 uppercase tracking-wider flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-amber-600" /> Menunggu ACC
            </p>
            <p className="text-lg sm:text-xl font-black text-amber-950 mt-0.5">
              {pendingCreditCount} <span className="text-xs font-semibold text-amber-800">Pengajuan</span>
            </p>
          </div>
          <div className="bg-[#FAF9F5] p-3 rounded-xl border border-[#EAE8E3]/80">
            <p className="text-[10px] sm:text-[11px] font-semibold text-charcoal-400 uppercase tracking-wider">Kredit Disetujui (ACC)</p>
            <p className="text-lg sm:text-xl font-black text-gold-600 mt-0.5">{approvedCreditCount} Unit</p>
          </div>
          <div className="bg-[#FAF9F5] p-3 rounded-xl border border-[#EAE8E3]/80 col-span-2 md:col-span-1">
            <p className="text-[10px] sm:text-[11px] font-semibold text-charcoal-400 uppercase tracking-wider">Kredit Ditolak Bank</p>
            <p className="text-lg sm:text-xl font-black text-rose-600 mt-0.5">{rejectedCreditCount} Riwayat</p>
          </div>
        </div>
      </div>

      {/* 2. SUB-NAVIGATION TABS (3 TAB BERSIH, TABEL PELANGGAN & TRANSAKSI DIJADIKAN SATU) */}
      <div className="flex flex-wrap items-center gap-2 border-b border-[#EAE8E3] pb-3">
        <button
          type="button"
          onClick={() => setActiveTab('customers')}
          className={`flex items-center justify-center sm:justify-start gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer w-full sm:w-auto ${
            activeTab === 'customers'
              ? 'bg-[#FDF8ED] text-gold-900 shadow-xs border-2 border-gold-500 font-bold'
              : 'bg-white text-charcoal-600 hover:text-charcoal-900 border border-[#EAE8E3]'
          }`}
        >
          <Users className="w-4 h-4 text-gold-600" />
          <span>Tabel Data Pelanggan & Penjualan ({officialCustomers.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('pending')}
          className={`flex items-center justify-center sm:justify-start gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer w-full sm:w-auto ${
            activeTab === 'pending'
              ? 'bg-amber-100 text-amber-950 shadow-xs border-2 border-amber-500 font-black'
              : 'bg-white text-amber-900 hover:text-amber-950 border border-amber-200'
          }`}
        >
          <Clock className="w-4 h-4 text-amber-600" />
          <span>Tabel Menunggu ACC ({pendingCreditCount})</span>
          {pendingCreditCount > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-amber-600 text-white text-[10px] font-black animate-pulse shadow-xs">
              {pendingCreditCount} Butuh ACC
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('rejected')}
          className={`flex items-center justify-center sm:justify-start gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer w-full sm:w-auto ${
            activeTab === 'rejected'
              ? 'bg-rose-50 text-rose-800 shadow-xs border-2 border-rose-400 font-bold'
              : 'bg-white text-charcoal-600 hover:text-charcoal-900 border border-[#EAE8E3]'
          }`}
        >
          <XCircle className="w-4 h-4 text-rose-500" />
          <span>Tabel Kredit Ditolak ({rejectedCreditCount})</span>
        </button>
      </div>

      {activeTab === 'customers' && (
        <>

      {/* Search & Filters Bar */}
      <div className="crm-card p-3.5 sm:p-4 space-y-3">
        <div className="flex flex-col sm:flex-row gap-2.5 sm:gap-3">
          {/* Search box */}
          <div className="flex-1 relative">
            <Search className="w-4 h-4 text-charcoal-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari nama konsumen, nomor WA, unit mobil, plat nomor, atau alamat..."
              className="w-full text-xs pl-9 pr-4 py-2.5 bg-[#F8F7F4] border border-[#EAE8E3] rounded-xl outline-none focus:border-gold-500 focus:ring-2 focus:ring-gold-500/20 text-charcoal-900 placeholder-charcoal-400 transition-all font-medium"
            />
          </div>

          {/* Quick Filters */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Filter by Metode Pembayaran */}
            <select
              value={filterPayment}
              onChange={(e) => setFilterPayment(e.target.value as any)}
              className="text-xs px-3 py-2.5 bg-[#F8F7F4] border border-[#EAE8E3] rounded-xl text-charcoal-800 font-bold outline-none focus:border-gold-500"
            >
              <option value="ALL">Semua Pembayaran ({officialCustomers.length})</option>
              <option value="CASH">Cash Keras ({cashSalesCount})</option>
              <option value="CREDIT">Kredit Leasing ({approvedCreditCount})</option>
            </select>

            {/* Filter by Sumber */}
            <select
              value={filterSource}
              onChange={(e) => setFilterSource(e.target.value)}
              className="text-xs px-3 py-2.5 bg-[#F8F7F4] border border-[#EAE8E3] rounded-xl text-charcoal-800 font-medium outline-none focus:border-gold-500"
            >
              <option value="ALL">Semua Sumber</option>
              <option value="Walk-in">Walk-in Showroom</option>
              <option value="WhatsApp">WhatsApp</option>
              <option value="Instagram">Instagram</option>
              <option value="Facebook">Facebook</option>
              <option value="TikTok">TikTok</option>
              <option value="Other">Lainnya</option>
            </select>

            {/* Sort Order Button */}
            <button
              onClick={() => {
                if (sortBy === 'date') setSortBy('name');
                else if (sortBy === 'name') setSortBy('budget');
                else setSortBy('date');
              }}
              className="flex items-center gap-1.5 text-xs px-3 py-2.5 bg-[#F8F7F4] border border-[#EAE8E3] hover:border-gold-500/50 hover:bg-gold-50/30 rounded-xl text-charcoal-800 font-semibold transition-colors cursor-pointer"
              title="Ganti Urutan Pengurutan"
            >
              <ArrowUpDown className="w-3.5 h-3.5 text-gold-600" />
              <span>
                Urut: {sortBy === 'date' ? 'Tanggal' : sortBy === 'name' ? 'Nama' : 'Harga'}
              </span>
            </button>
          </div>
        </div>

        {/* Quick Payment Filter Pills */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[#EAE8E3] text-xs">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[11px] font-bold text-charcoal-500 mr-1">Filter Transaksi:</span>
            <button
              type="button"
              onClick={() => setFilterPayment('ALL')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                filterPayment === 'ALL'
                  ? 'bg-gold-500 text-charcoal-950 shadow-2xs font-bold'
                  : 'bg-[#F0EDE6] text-charcoal-700 hover:bg-[#EAE8E3]'
              }`}
            >
              Semua ({officialCustomers.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterPayment('CASH')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                filterPayment === 'CASH'
                  ? 'bg-emerald-600 text-white shadow-2xs'
                  : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
              }`}
            >
              Cash Keras ({cashSalesCount})
            </button>
            <button
              type="button"
              onClick={() => setFilterPayment('CREDIT')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                filterPayment === 'CREDIT'
                  ? 'bg-gold-500 text-charcoal-950 shadow-2xs'
                  : 'bg-gold-50 text-gold-800 hover:bg-gold-100'
              }`}
            >
              Kredit Leasing ({approvedCreditCount})
            </button>
          </div>

          <span className="text-[11px] text-charcoal-500">
            Menampilkan <strong className="text-charcoal-900">{processedCustomers.length}</strong> data transaksi pelanggan
          </span>
        </div>
      </div>

      {/* MOBILE CARDS: Customer & Transaction List (< 768px) */}
      <div className="space-y-3 md:hidden">
        {processedCustomers.length === 0 ? (
          <div className="crm-card p-8 text-center text-charcoal-400">
            <Users className="w-9 h-9 mx-auto mb-2 text-charcoal-300" />
            <p className="font-semibold text-charcoal-700">Tidak ada data konsumen yang sesuai</p>
            <p className="text-[11px] text-charcoal-400 mt-0.5">Ubah kata kunci pencarian atau sesuaikan filter.</p>
          </div>
        ) : (
          processedCustomers.map((cust, idx) => {
            const kwitansi = getKwitansiForCustomer(cust, purchases);
            const matchingPurchase = purchases.find(
              (p) =>
                p.customerId === cust.id ||
                (cust.plateNumber && p.plateNumber === cust.plateNumber) ||
                (p.customerName && cust.fullName && p.customerName.toLowerCase() === cust.fullName.toLowerCase())
            );
            const matchingCredit = creditApplications.find(
              (a) =>
                a.customerId === cust.id ||
                (a.customerName && cust.fullName && a.customerName.toLowerCase() === cust.fullName.toLowerCase())
            );

            const isCredit = cust.paymentType === 'Kredit' || matchingPurchase?.paymentType === 'Kredit' || matchingCredit !== undefined;
            const leasingName = matchingPurchase?.leasingPartner || matchingCredit?.targetLeasing || cust.leasingPartner || 'Leasing Rekanan';
            const vehicleName = matchingPurchase?.vehicleName || cust.interestedVehicle;
            const plateNo = cust.plateNumber || matchingPurchase?.plateNumber || kwitansi.nomorPolisi || '-';
            const totalPrice = matchingPurchase?.purchasePrice || cust.budget || kwitansi.sejumlahUang;
            const downPayment = matchingPurchase?.downPayment || matchingCredit?.finalDp || matchingCredit?.initialDp || (isCredit ? kwitansi.sejumlahUang : null);

            return (
              <div key={cust.id} className="crm-card p-4 space-y-3">
                {/* Header Card: No, Nama, Badge Pembayaran */}
                <div className="flex items-start justify-between gap-2 border-b border-[#EAE8E3] pb-2.5">
                  <div className="flex items-center gap-2.5">
                    <span className="w-6 h-6 rounded-md bg-warm-100 text-charcoal-900 font-mono font-bold text-xs flex items-center justify-center shrink-0 border border-warm-200">
                      {idx + 1}
                    </span>
                    <div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h4 className="font-bold text-sm text-charcoal-900">{cust.fullName}</h4>
                        {kwitansi && (
                          <span className="inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.2 rounded bg-gold-50 text-gold-900 border border-gold-300 font-mono">
                            <FileText className="w-2.5 h-2.5 text-gold-600" /> {kwitansi.nomorKwitansi}
                          </span>
                        )}
                      </div>
                      <div className="mt-0.5">
                        {isCredit ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.2 rounded-full bg-gold-100 text-charcoal-950 border border-gold-300">
                            <CreditCard className="w-3 h-3 text-gold-700" />
                            Kredit ACC • {leasingName}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.2 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300">
                            <Banknote className="w-3 h-3 text-emerald-700" />
                            Cash Keras (Lunas)
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="font-mono font-black text-charcoal-950 text-xs sm:text-sm block">
                      {formatRupiah(totalPrice)}
                    </span>
                    {isCredit && downPayment ? (
                      <span className="text-[10px] text-gold-800 font-bold block">
                        DP: {formatRupiah(downPayment)}
                      </span>
                    ) : (
                      <span className="text-[10px] text-emerald-700 font-bold block">
                        Lunas di Kasir
                      </span>
                    )}
                  </div>
                </div>

                {/* Info Mobil & Lokasi */}
                <div className="grid grid-cols-2 gap-2 text-xs bg-[#FAF9F5] p-2.5 rounded-xl border border-[#EAE8E3]">
                  <div>
                    <span className="text-[10px] text-charcoal-400 block font-semibold">Unit Kendaraan:</span>
                    <p className="font-bold text-charcoal-900 truncate">{vehicleName}</p>
                    {plateNo && plateNo !== '-' ? (
                      <span className="inline-block mt-0.5 bg-[#FDF8ED] text-gold-900 border border-gold-300 font-mono text-[9px] font-bold px-1.5 py-0.2 rounded">
                        {plateNo}
                      </span>
                    ) : (
                      <span className="text-[10px] text-charcoal-400 italic">Siap Balik Nama</span>
                    )}
                  </div>
                  <div>
                    <span className="text-[10px] text-charcoal-400 block font-semibold">Kontak & Domisili:</span>
                    <p className="font-semibold text-charcoal-800 truncate">{cust.district}</p>
                    <p className="text-[10px] text-charcoal-500 font-mono truncate">{cust.whatsapp}</p>
                  </div>
                </div>

                {/* Tombol Aksi HP */}
                <div className="flex items-center justify-between gap-1.5 pt-1 border-t border-[#EAE8E3]">
                  <a
                    href={formatWhatsAppLink(cust.whatsapp)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 py-1.5 px-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold inline-flex items-center justify-center gap-1 shadow-xs"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    <span>WA</span>
                  </a>

                  {kwitansi && (
                    <button
                      onClick={() => setSelectedKwitansi(kwitansi)}
                      className="py-1.5 px-2.5 rounded-xl bg-gold-100 hover:bg-gold-200 text-gold-950 border border-gold-300 text-xs font-bold inline-flex items-center justify-center gap-1 shadow-2xs cursor-pointer"
                      title="Lihat / Cetak Kwitansi Resmi"
                    >
                      <FileText className="w-3.5 h-3.5 text-gold-700" />
                      <span>Kwitansi</span>
                    </button>
                  )}

                  <button
                    onClick={() => setSelectedCustomer(cust)}
                    className="p-1.5 rounded-xl bg-white border border-[#EAE8E3] text-charcoal-600 hover:text-gold-600 hover:bg-warm-50 cursor-pointer"
                    title="Lihat Detail"
                  >
                    <Eye className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => openEditModal(cust)}
                    className="p-1.5 rounded-xl bg-white border border-[#EAE8E3] text-charcoal-600 hover:text-charcoal-900 hover:bg-warm-50 cursor-pointer"
                    title="Edit"
                  >
                    <Edit className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => setDeleteConfirmId(cust.id)}
                    className="p-1.5 rounded-xl bg-white border border-[#EAE8E3] text-rose-500 hover:text-rose-700 hover:bg-rose-50 cursor-pointer"
                    title="Hapus"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Customer & Transaction Table (Desktop/Laptop) */}
      <div className="crm-card overflow-hidden hidden md:block">
        <div className="overflow-x-auto">
          <table className="crm-table w-full text-left min-w-[950px]">
            <thead>
              <tr className="bg-[#FAF9F5] text-charcoal-800 border-b border-[#EAE8E3]">
                <th className="py-3 px-3 text-center w-12 text-[11px] font-bold text-gold-700">NO</th>
                <th className="py-3 px-4 text-[11px] font-bold text-charcoal-700">KONSUMEN & METODE TRANSAKSI</th>
                <th className="py-3 px-4 text-[11px] font-bold text-charcoal-700">UNIT KENDARAAN</th>
                <th className="py-3 px-4 text-[11px] font-bold text-charcoal-700">KONTAK & DOMISILI</th>
                <th className="py-3 px-4 text-right text-[11px] font-bold text-gold-700">NILAI & PEMBAYARAN</th>
                <th className="py-3 px-4 text-center text-[11px] font-bold w-40 text-charcoal-700">AKSI</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EAE8E3] text-xs">
              {processedCustomers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-charcoal-400">
                    <Users className="w-9 h-9 mx-auto mb-2 text-charcoal-300" />
                    <p className="font-semibold text-charcoal-700">Tidak ada data konsumen yang sesuai</p>
                    <p className="text-[11px] text-charcoal-400 mt-0.5">Ubah kata kunci pencarian atau sesuaikan filter sumber.</p>
                  </td>
                </tr>
              ) : (
                processedCustomers.map((cust, idx) => {
                  const kwitansi = getKwitansiForCustomer(cust, purchases);
                  const matchingPurchase = purchases.find(
                    (p) =>
                      p.customerId === cust.id ||
                      (cust.plateNumber && p.plateNumber === cust.plateNumber) ||
                      (p.customerName && cust.fullName && p.customerName.toLowerCase() === cust.fullName.toLowerCase())
                  );
                  const matchingCredit = creditApplications.find(
                    (a) =>
                      a.customerId === cust.id ||
                      (a.customerName && cust.fullName && a.customerName.toLowerCase() === cust.fullName.toLowerCase())
                  );

                  const isCredit = cust.paymentType === 'Kredit' || matchingPurchase?.paymentType === 'Kredit' || matchingCredit !== undefined;
                  const leasingName = matchingPurchase?.leasingPartner || matchingCredit?.targetLeasing || cust.leasingPartner || 'Leasing Rekanan';
                  const vehicleName = matchingPurchase?.vehicleName || cust.interestedVehicle;
                  const plateNo = cust.plateNumber || matchingPurchase?.plateNumber || kwitansi.nomorPolisi || '-';
                  const totalPrice = matchingPurchase?.purchasePrice || cust.budget || kwitansi.sejumlahUang;
                  const downPayment = matchingPurchase?.downPayment || matchingCredit?.finalDp || matchingCredit?.initialDp || (isCredit ? kwitansi.sejumlahUang : null);

                  return (
                    <tr key={cust.id} className="hover:bg-[#F8F7F4]/80 transition-colors">
                      {/* 1. NO */}
                      <td className="py-3.5 px-3 text-center font-bold font-mono text-charcoal-700">
                        {idx + 1}
                      </td>

                      {/* 2. Pelanggan & Metode Transaksi */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-gold-100 text-gold-900 border border-gold-300 flex items-center justify-center font-bold text-xs uppercase shrink-0 shadow-2xs">
                            {cust.fullName.charAt(0)}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <p className="font-bold text-charcoal-900 text-sm">{cust.fullName}</p>
                              {kwitansi && (
                                <span className="inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded bg-gold-50 text-gold-900 border border-gold-300 font-mono shadow-2xs">
                                  <FileText className="w-2.5 h-2.5 text-gold-600" /> {kwitansi.nomorKwitansi}
                                </span>
                              )}
                            </div>
                            <div className="mt-1 flex items-center gap-1.5">
                              {isCredit ? (
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-gold-100 text-charcoal-950 border border-gold-300">
                                  <CreditCard className="w-3 h-3 text-gold-700" />
                                  Kredit ACC • {leasingName}
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300">
                                  <Banknote className="w-3 h-3 text-emerald-700" />
                                  Cash Keras (Lunas)
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* 3. Unit Kendaraan Terjual */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-1">
                          <p className="font-bold text-charcoal-900 text-xs">{vehicleName}</p>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {plateNo && plateNo !== '-' ? (
                              <span className="bg-[#FDF8ED] text-gold-900 font-mono text-[10px] font-bold px-2 py-0.5 rounded border border-gold-300">
                                {plateNo}
                              </span>
                            ) : (
                              <span className="text-charcoal-400 text-[10px] italic">
                                Siap Balik Nama
                              </span>
                            )}
                            <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded bg-warm-100 border border-warm-200 text-charcoal-700">
                              {cust.vehicleType}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* 4. WhatsApp & Lokasi */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-1">
                          <a
                            href={formatWhatsAppLink(cust.whatsapp)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 font-semibold text-charcoal-900 hover:text-gold-600 transition-colors"
                          >
                            <span className="w-5 h-5 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
                              <MessageCircle className="w-3 h-3" />
                            </span>
                            {cust.whatsapp}
                          </a>
                          <div className="flex items-center gap-1 text-[11px] text-charcoal-500">
                            <MapPin className="w-3 h-3 text-gold-600 shrink-0" />
                            <span className="font-semibold text-charcoal-700">{cust.district}</span>
                            <span>•</span>
                            <span className="text-[10px] text-charcoal-400 truncate max-w-[120px]">{cust.address}</span>
                          </div>
                        </div>
                      </td>

                      {/* 5. Nilai & Pembayaran */}
                      <td className="py-3.5 px-4 text-right">
                        <div>
                          <div className="font-mono font-black text-charcoal-950 text-sm">
                            {formatRupiah(totalPrice)}
                          </div>
                          {isCredit && downPayment ? (
                            <span className="text-[10px] text-gold-800 font-bold block mt-0.5">
                              DP: {formatRupiah(downPayment)}
                            </span>
                          ) : (
                            <span className="text-[10px] text-emerald-700 font-bold block mt-0.5">
                              Lunas di Kasir
                            </span>
                          )}
                          <span className="text-[10px] text-charcoal-400 block font-sans">
                            {cust.registeredDate || 'Transaksi Sah'}
                          </span>
                        </div>
                      </td>

                      {/* 6. Action buttons */}
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* Kwitansi Kasir */}
                          {kwitansi && (
                            <button
                              onClick={() => setSelectedKwitansi(kwitansi)}
                              className="px-2.5 py-1.5 rounded-lg text-gold-900 bg-gold-100 hover:bg-gold-200 transition-colors border border-gold-300 shadow-2xs font-bold text-xs inline-flex items-center gap-1 cursor-pointer"
                              title="Lihat / Cetak Kwitansi Resmi Kasir"
                            >
                              <FileText className="w-3.5 h-3.5 text-gold-700" />
                              <span>Kwitansi</span>
                            </button>
                          )}

                          {/* View Detail */}
                          <button
                            onClick={() => setSelectedCustomer(cust)}
                            className="p-1.5 rounded-lg text-charcoal-500 hover:text-gold-600 hover:bg-gold-50/60 transition-colors border border-transparent hover:border-gold-500/30 cursor-pointer"
                            title="Lihat Detail Profil & Riwayat"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {/* Edit */}
                          <button
                            onClick={() => openEditModal(cust)}
                            className="p-1.5 rounded-lg text-charcoal-500 hover:text-charcoal-900 hover:bg-charcoal-100 transition-colors border border-transparent hover:border-charcoal-300 cursor-pointer"
                            title="Edit Pelanggan"
                          >
                            <Edit className="w-4 h-4" />
                          </button>

                          {/* Delete */}
                          <button
                            onClick={() => setDeleteConfirmId(cust.id)}
                            className="p-1.5 rounded-lg text-charcoal-400 hover:text-rose-600 hover:bg-rose-50 transition-colors border border-transparent hover:border-rose-200 cursor-pointer"
                            title="Hapus Data Pelanggan"
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
        </>
      )}

      {/* TAB 2: TABEL MENUNGGU ACC */}
      {activeTab === 'pending' && (
        <div className="space-y-4">
          {/* Header Banner */}
          <div className="crm-card p-4 bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border-l-4 border-l-amber-500 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                  Antrean Persetujuan Leasing
                </span>
                <span className="text-xs text-charcoal-300">•</span>
                <span className="text-xs text-charcoal-500 font-medium">Showroom HR MOTOR Garut</span>
              </div>
              <h2 className="text-base sm:text-lg font-black text-charcoal-900 mt-0.5 flex items-center gap-2">
                <Clock className="w-5 h-5 text-amber-600" />
                <span>Daftar Pengajuan Kredit Menunggu ACC ({pendingCreditCount})</span>
              </h2>
              <p className="text-xs text-charcoal-500 mt-0.5">
                Pengajuan di bawah ini berstatus <strong>BOKING</strong> dan <strong>belum masuk</strong> ke Data Pelanggan. Saat di-<strong>ACC</strong>, data otomatis masuk ke Tabel Pelanggan & mobil menjadi <strong>SOLD OUT</strong>.
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                setFormError('');
                setIsCreditModalOpen(true);
              }}
              className="px-3.5 py-2 rounded-xl bg-gold-500 hover:bg-gold-600 text-charcoal-950 font-bold text-xs flex items-center gap-2 shadow-xs transition-all cursor-pointer shrink-0"
            >
              <CreditCard className="w-4 h-4 text-charcoal-950" />
              <span>+ Pengajuan Kredit Baru</span>
            </button>
          </div>

          {/* Search bar inside pending tab */}
          <div className="crm-card p-3">
            <div className="relative">
              <Search className="w-4 h-4 text-charcoal-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari pengajuan pending: nama pemohon, leasing, unit mobil..."
                className="w-full text-xs pl-9 pr-4 py-2 bg-[#F8F7F4] border border-[#EAE8E3] rounded-xl outline-none focus:border-gold-500 text-charcoal-900 placeholder-charcoal-400 transition-all font-medium"
              />
            </div>
          </div>

          {creditApplications.filter((app) => app.status === 'PENDING').length === 0 ? (
            <div className="crm-card p-12 text-center space-y-3">
              <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="font-bold text-base text-charcoal-900">Tidak Ada Pengajuan Kredit Menunggu ACC</h3>
              <p className="text-xs text-charcoal-500 max-w-md mx-auto">
                Semua pengajuan kredit telah diproses. Ketika Anda menambahkan pengajuan kredit baru, data akan otomatis muncul di tabel ini sebelum disetujui atau ditolak.
              </p>
              <button
                type="button"
                onClick={() => {
                  setFormError('');
                  setIsCreditModalOpen(true);
                }}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gold-500 hover:bg-gold-600 text-charcoal-950 font-bold text-xs shadow-xs transition-all cursor-pointer mt-2"
              >
                <CreditCard className="w-4 h-4 text-charcoal-950" />
                <span>+ Buat Pengajuan Kredit Baru</span>
              </button>
            </div>
          ) : (
            <div className="crm-card overflow-hidden">
              {/* MOBILE CARDS */}
              <div className="space-y-3 p-3 md:hidden">
                {creditApplications
                  .filter((app) => app.status === 'PENDING')
                  .filter((app) => {
                    if (!searchQuery.trim()) return true;
                    const q = searchQuery.toLowerCase();
                    return (
                      app.customerName.toLowerCase().includes(q) ||
                      app.vehicleName.toLowerCase().includes(q) ||
                      app.targetLeasing.toLowerCase().includes(q)
                    );
                  })
                  .map((app) => (
                    <div key={app.id} className="p-3.5 bg-white rounded-xl border border-amber-200/80 shadow-2xs space-y-2.5">
                      <div className="flex items-start justify-between gap-2 border-b border-[#EAE8E3] pb-2">
                        <div>
                          <span className="bg-charcoal-100 text-charcoal-800 px-2 py-0.5 rounded text-[10px] font-mono font-bold">
                            {app.id}
                          </span>
                          <h4 className="font-bold text-sm text-charcoal-900 mt-1">{app.customerName}</h4>
                          <span className="text-[10px] text-charcoal-400 font-sans">
                            {formatDate(app.applicationDate)} • {app.customerSource}
                          </span>
                        </div>
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300 animate-pulse">
                          MENUNGGU ACC
                        </span>
                      </div>

                      <div className="bg-[#FAF9F5] p-2.5 rounded-lg border border-[#EAE8E3] grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <span className="text-[10px] text-charcoal-400 block">Unit Mobil (BOKING):</span>
                          <p className="font-bold text-charcoal-900 truncate">{app.vehicleName}</p>
                          {app.plateNumber && <span className="text-[10px] text-charcoal-500 font-mono">{app.plateNumber}</span>}
                        </div>
                        <div>
                          <span className="text-[10px] text-charcoal-400 block">Leasing Tujuan:</span>
                          <p className="font-bold text-indigo-700 truncate">{app.targetLeasing}</p>
                          <span className="text-[10px] text-charcoal-500">Tujuan: {app.targetLeasing}</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-xs">
                        <div>
                          <span className="text-[10px] text-charcoal-400 block">Harga Deal:</span>
                          <span className="font-bold text-charcoal-900">{formatRupiah(app.dealPrice)}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] text-charcoal-400 block">Rencana DP:</span>
                          <span className="font-bold text-amber-700">{formatRupiah(app.initialDp)}</span>
                        </div>
                      </div>

                      {/* Action buttons: ACC / Tolak */}
                      <div className="flex items-center gap-2 pt-2 border-t border-[#EAE8E3]">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedCreditApp(app);
                            setAccForm({
                              finalDp: String(app.initialDp),
                              approvedLeasing: app.targetLeasing,
                              approvalNotes: '',
                            });
                            setFormError('');
                            setIsAccModalOpen(true);
                          }}
                          className="flex-1 py-2 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs inline-flex items-center justify-center gap-1 shadow-xs cursor-pointer"
                        >
                          <CheckCircle className="w-3.5 h-3.5" />
                          <span>Setujui (ACC)</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedCreditApp(app);
                            setRejectReason('');
                            setFormError('');
                            setIsRejectModalOpen(true);
                          }}
                          className="flex-1 py-2 px-3 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs inline-flex items-center justify-center gap-1 shadow-xs cursor-pointer"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          <span>Tolak</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedCreditApp(app);
                            setIsHistoryModalOpen(true);
                          }}
                          className="p-2 rounded-lg text-charcoal-500 hover:text-charcoal-900 hover:bg-warm-100 border border-[#EAE8E3] shrink-0"
                          title="Riwayat Audit"
                        >
                          <History className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
              </div>

              {/* DESKTOP TABLE */}
              <div className="overflow-x-auto hidden md:block">
                <table className="crm-table w-full text-left text-xs min-w-[780px]">
                  <thead>
                    <tr className="bg-[#FAF9F5] border-b border-[#EAE8E3]">
                      <th className="py-3 px-4 font-bold text-charcoal-700">No. Pengajuan & Tgl</th>
                      <th className="py-3 px-4 font-bold text-charcoal-700">Pemohon Kredit</th>
                      <th className="py-3 px-4 font-bold text-charcoal-700">Unit Mobil (Boking)</th>
                      <th className="py-3 px-4 font-bold text-charcoal-700">Bank / Leasing</th>
                      <th className="py-3 px-4 font-bold text-charcoal-700">Harga Deal & DP</th>
                      <th className="py-3 px-4 font-bold text-center text-charcoal-700">Status</th>
                      <th className="py-3 px-4 font-bold text-center text-charcoal-700">Tindakan Persetujuan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#EAE8E3]">
                    {creditApplications
                      .filter((app) => app.status === 'PENDING')
                      .filter((app) => {
                        if (!searchQuery.trim()) return true;
                        const q = searchQuery.toLowerCase();
                        return (
                          app.customerName.toLowerCase().includes(q) ||
                          app.vehicleName.toLowerCase().includes(q) ||
                          app.targetLeasing.toLowerCase().includes(q)
                        );
                      })
                      .map((app) => (
                        <tr key={app.id} className="hover:bg-amber-50/40 transition-colors">
                          <td className="py-3.5 px-4 font-mono font-bold text-charcoal-900">
                            <span className="bg-charcoal-100 text-charcoal-800 px-2 py-0.5 rounded text-[11px]">
                              {app.id}
                            </span>
                            <span className="text-[10px] text-charcoal-400 block mt-1 font-sans">
                              {formatDate(app.applicationDate)}
                            </span>
                          </td>

                          <td className="py-3.5 px-4">
                            <p className="font-bold text-charcoal-900 text-sm">{app.customerName}</p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <a
                                href={formatWhatsAppLink(app.customerPhone, `Halo Bapak/Ibu ${app.customerName}, mengenai pengajuan kredit unit ${app.vehicleName} di HR MOTOR Garut...`)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[11px] text-emerald-700 font-semibold hover:underline inline-flex items-center gap-1"
                              >
                                <MessageCircle className="w-3 h-3 text-emerald-600" />
                                {app.customerPhone}
                              </a>
                              <span className="text-[10px] text-charcoal-400">• {app.customerSource}</span>
                            </div>
                            <p className="text-[10px] text-charcoal-500 mt-0.5">{app.customerAddress}</p>
                          </td>

                          <td className="py-3.5 px-4">
                            <p className="font-bold text-xs text-charcoal-900">{app.vehicleName}</p>
                            {app.plateNumber && (
                              <span className="text-[10px] font-mono font-bold bg-[#FDF8ED] text-gold-900 border border-gold-300 px-1.5 py-0.5 rounded mt-1 inline-block">
                                {app.plateNumber}
                              </span>
                            )}
                            <span className="inline-block ml-2 text-[10px] font-semibold text-amber-700 bg-amber-100 px-1.5 py-0.2 rounded">
                              BOKING
                            </span>
                          </td>

                          <td className="py-3.5 px-4">
                            <span className="px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-900 border border-indigo-200 font-bold text-xs inline-block">
                              {app.targetLeasing}
                            </span>
                            <span className="text-[10px] text-charcoal-400 block mt-0.5">
                              Tujuan: {app.targetLeasing}
                            </span>
                          </td>

                          <td className="py-3.5 px-4">
                            <span className="font-bold text-charcoal-900 block">{formatRupiah(app.dealPrice)}</span>
                            <span className="text-[11px] font-bold text-amber-700 block mt-0.5">
                              Rencana DP: {formatRupiah(app.initialDp)}
                            </span>
                          </td>

                          <td className="py-3.5 px-4 text-center">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-950 border border-amber-300 shadow-xs">
                              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                              MENUNGGU ACC
                            </span>
                          </td>

                          <td className="py-3.5 px-4 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedCreditApp(app);
                                  setAccForm({
                                    finalDp: String(app.initialDp),
                                    approvedLeasing: app.targetLeasing,
                                    approvalNotes: '',
                                  });
                                  setFormError('');
                                  setIsAccModalOpen(true);
                                }}
                                className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs flex items-center gap-1 shadow-sm transition-all cursor-pointer"
                                title="Setujui Kredit (ACC) - Ubah stok jadi SOLD OUT & masukkan ke Data Pelanggan"
                              >
                                <Check className="w-3.5 h-3.5" />
                                <span>ACC</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedCreditApp(app);
                                  setRejectReason('');
                                  setFormError('');
                                  setIsRejectModalOpen(true);
                                }}
                                className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-black text-xs flex items-center gap-1 shadow-sm transition-all cursor-pointer"
                                title="Tolak Pengajuan Kredit - Kembalikan stok jadi READY & tidak masuk data pelanggan"
                              >
                                <X className="w-3.5 h-3.5" />
                                <span>Tolak</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedCreditApp(app);
                                  setIsHistoryModalOpen(true);
                                }}
                                className="p-1.5 rounded-lg text-charcoal-500 hover:text-charcoal-900 hover:bg-warm-100 transition-colors cursor-pointer"
                                title="Lihat Riwayat Perjalanan Pengajuan"
                              >
                                <History className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: TABEL KREDIT DITOLAK */}
      {activeTab === 'rejected' && (
        <div className="space-y-4">
          {/* Header Banner */}
          <div className="crm-card p-4 bg-gradient-to-r from-rose-500/10 via-rose-500/5 to-transparent border-l-4 border-l-rose-500 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-900 border border-rose-300">
                  Riwayat Penolakan Bank / Leasing
                </span>
                <span className="text-xs text-charcoal-300">•</span>
                <span className="text-xs text-charcoal-500 font-medium">Showroom HR MOTOR Garut</span>
              </div>
              <h2 className="text-base sm:text-lg font-black text-charcoal-900 mt-0.5 flex items-center gap-2">
                <XCircle className="w-5 h-5 text-rose-600" />
                <span>Tabel Riwayat Kredit Ditolak ({rejectedCreditCount})</span>
              </h2>
              <p className="text-xs text-charcoal-500 mt-0.5">
                Pengajuan yang ditolak bank <strong>TIDAK dimasukkan</strong> ke Tabel Pelanggan. Unit mobil otomatis <strong>kembali berstatus READY</strong> agar bisa ditawarkan ke konsumen lain.
              </p>
            </div>
          </div>

          {/* Search bar inside rejected tab */}
          <div className="crm-card p-3">
            <div className="relative">
              <Search className="w-4 h-4 text-charcoal-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari data ditolak: nama konsumen, leasing, unit..."
                className="w-full text-xs pl-9 pr-4 py-2 bg-[#F8F7F4] border border-[#EAE8E3] rounded-xl outline-none focus:border-gold-500 text-charcoal-900 placeholder-charcoal-400 transition-all font-medium"
              />
            </div>
          </div>

          {creditApplications.filter((app) => app.status === 'REJECTED').length === 0 ? (
            <div className="crm-card p-12 text-center space-y-3">
              <div className="w-16 h-16 rounded-full bg-[#FAF9F5] text-charcoal-400 flex items-center justify-center mx-auto">
                <Shield className="w-8 h-8 text-gold-500" />
              </div>
              <h3 className="font-bold text-base text-charcoal-900">Belum Ada Riwayat Kredit Ditolak</h3>
              <p className="text-xs text-charcoal-500 max-w-md mx-auto">
                Jika ada pengajuan kredit yang ditolak oleh leasing, arsip datanya akan dicatat rapi di tabel ini tanpa mengotori data pelanggan resmi.
              </p>
            </div>
          ) : (
            <div className="crm-card overflow-hidden">
              {/* MOBILE CARDS */}
              <div className="space-y-3 p-3 md:hidden">
                {creditApplications
                  .filter((app) => app.status === 'REJECTED')
                  .filter((app) => {
                    if (!searchQuery.trim()) return true;
                    const q = searchQuery.toLowerCase();
                    return (
                      app.customerName.toLowerCase().includes(q) ||
                      app.vehicleName.toLowerCase().includes(q) ||
                      app.targetLeasing.toLowerCase().includes(q)
                    );
                  })
                  .map((app) => (
                    <div key={app.id} className="p-3.5 bg-white rounded-xl border border-rose-200/80 shadow-2xs space-y-2.5">
                      <div className="flex items-start justify-between gap-2 border-b border-[#EAE8E3] pb-2">
                        <div>
                          <span className="bg-charcoal-100 text-charcoal-800 px-2 py-0.5 rounded text-[10px] font-mono font-bold">
                            {app.id}
                          </span>
                          <h4 className="font-bold text-sm text-charcoal-900 mt-1">{app.customerName}</h4>
                          <span className="text-[10px] text-charcoal-400 font-sans">
                            {formatDate(app.applicationDate)} • {app.customerPhone}
                          </span>
                        </div>
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-100 text-rose-900 border border-rose-300">
                          DITOLAK
                        </span>
                      </div>

                      <div className="bg-[#FAF9F5] p-2.5 rounded-lg border border-[#EAE8E3] space-y-1.5 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] text-charcoal-400">Unit Kendaraan:</span>
                          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                            Kembali READY
                          </span>
                        </div>
                        <p className="font-bold text-charcoal-900">{app.vehicleName}</p>
                        <div className="flex items-center justify-between text-[11px] text-charcoal-500 pt-1 border-t border-[#EAE8E3]">
                          <span>Leasing: <strong>{app.targetLeasing}</strong></span>
                          <span>Deal: <strong>{formatRupiah(app.dealPrice)}</strong></span>
                        </div>
                      </div>

                      <div className="p-2.5 bg-rose-50/70 border border-rose-200 rounded-lg text-xs">
                        <span className="text-[10px] font-bold text-rose-800 block uppercase">Alasan Penolakan:</span>
                        <p className="text-rose-900 font-medium mt-0.5">{app.rejectionReason || 'Ditolak oleh pihak bank/leasing (BI Checking / Kapasitas)'}</p>
                      </div>

                      <div className="pt-1 flex justify-end">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedCreditApp(app);
                            setIsHistoryModalOpen(true);
                          }}
                          className="py-1.5 px-3 rounded-lg text-charcoal-600 hover:text-charcoal-900 hover:bg-warm-100 border border-[#EAE8E3] text-xs font-bold inline-flex items-center gap-1"
                        >
                          <History className="w-3.5 h-3.5" />
                          <span>Riwayat Catatan</span>
                        </button>
                      </div>
                    </div>
                  ))}
              </div>

              {/* DESKTOP TABLE */}
              <div className="overflow-x-auto hidden md:block">
                <table className="crm-table w-full text-left text-xs min-w-[780px]">
                  <thead>
                    <tr className="bg-[#FAF9F5] border-b border-[#EAE8E3]">
                      <th className="py-3 px-4 font-bold text-charcoal-700">No. Pengajuan</th>
                      <th className="py-3 px-4 font-bold text-charcoal-700">Calon Konsumen</th>
                      <th className="py-3 px-4 font-bold text-charcoal-700">Unit Mobil (Status Stok)</th>
                      <th className="py-3 px-4 font-bold text-charcoal-700">Bank / Leasing</th>
                      <th className="py-3 px-4 font-bold text-charcoal-700">Alasan Penolakan</th>
                      <th className="py-3 px-4 font-bold text-center text-charcoal-700">Status Mobil</th>
                      <th className="py-3 px-4 font-bold text-center text-charcoal-700">Audit</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#EAE8E3]">
                    {creditApplications
                      .filter((app) => app.status === 'REJECTED')
                      .filter((app) => {
                        if (!searchQuery.trim()) return true;
                        const q = searchQuery.toLowerCase();
                        return (
                          app.customerName.toLowerCase().includes(q) ||
                          app.vehicleName.toLowerCase().includes(q) ||
                          app.targetLeasing.toLowerCase().includes(q)
                        );
                      })
                      .map((app) => (
                        <tr key={app.id} className="hover:bg-rose-50/30 transition-colors">
                          <td className="py-3.5 px-4 font-mono font-bold text-charcoal-900">
                            <span className="bg-charcoal-100 text-charcoal-800 px-2 py-0.5 rounded text-[11px]">
                              {app.id}
                            </span>
                            <span className="text-[10px] text-charcoal-400 block mt-1 font-sans">
                              {formatDate(app.applicationDate)}
                            </span>
                          </td>

                          <td className="py-3.5 px-4">
                            <p className="font-bold text-charcoal-900 text-sm">{app.customerName}</p>
                            <span className="text-[11px] text-charcoal-500 font-mono">{app.customerPhone}</span>
                            <p className="text-[10px] text-charcoal-400 mt-0.5">{app.customerAddress}</p>
                          </td>

                          <td className="py-3.5 px-4">
                            <p className="font-bold text-xs text-charcoal-900">{app.vehicleName}</p>
                            {app.plateNumber && (
                              <span className="text-[10px] font-mono font-bold bg-charcoal-100 text-charcoal-700 px-1.5 py-0.5 rounded mt-1 inline-block">
                                {app.plateNumber}
                              </span>
                            )}
                          </td>

                          <td className="py-3.5 px-4">
                            <span className="px-2.5 py-1 rounded-lg bg-charcoal-100 text-charcoal-800 font-bold text-xs inline-block">
                              {app.targetLeasing}
                            </span>
                            <span className="text-[10px] text-charcoal-400 block mt-0.5">
                              Nilai: {formatRupiah(app.dealPrice)}
                            </span>
                          </td>

                          <td className="py-3.5 px-4 max-w-xs">
                            <span className="text-xs text-rose-700 font-medium line-clamp-2">
                              {app.rejectionReason || 'Ditolak oleh pihak bank/leasing'}
                            </span>
                          </td>

                          <td className="py-3.5 px-4 text-center">
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-900 border border-emerald-300">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              Kembali READY
                            </span>
                          </td>

                          <td className="py-3.5 px-4 text-center">
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedCreditApp(app);
                                setIsHistoryModalOpen(true);
                              }}
                              className="p-1.5 rounded-lg text-charcoal-500 hover:text-charcoal-900 hover:bg-warm-100 transition-colors cursor-pointer"
                              title="Lihat Riwayat Perjalanan Pengajuan"
                            >
                              <History className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ADD / EDIT CUSTOMER MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-charcoal-950/40 backdrop-blur-xs animate-in fade-in duration-200 overflow-y-auto">
          <div className="crm-card w-full max-w-xl max-h-[90vh] flex flex-col overflow-hidden shadow-luxury border-gold-500/30 my-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 sm:py-4 bg-[#FAF9F5] border-b border-[#EAE8E3] text-charcoal-900 shrink-0 relative">
              <div className="absolute top-0 left-0 right-0 h-[2.5px] bg-gradient-to-r from-gold-500 via-gold-400 to-gold-600" />
              <div>
                <span className="badge-gold text-[10px] mb-1 inline-block">
                  {editingCustomer ? 'Perbarui Data Konsumen' : 'Registrasi Konsumen Baru'}
                </span>
                <h2 className="text-base font-black text-charcoal-900 tracking-tight">
                  {editingCustomer ? `Edit: ${editingCustomer.fullName}` : 'Tambah Konsumen Baru Showroom'}
                </h2>
                <p className="text-xs text-charcoal-500">
                  {editingCustomer ? `ID Pelanggan: ${editingCustomer.id}` : 'Registrasi calon atau pembeli mobil HR MOTOR Garut'}
                </p>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-charcoal-400 hover:text-charcoal-900 hover:bg-[#F0EDE6] transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="mx-4 sm:mx-6 mt-3 sm:mt-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-medium">
                {formError}
              </div>
            )}

            <form onSubmit={handleSaveCustomer} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-charcoal-800 mb-1">
                    Nama Lengkap <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    placeholder="Contoh: Agus Gunawan"
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
                    value={formData.whatsapp}
                    onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                    placeholder="0812xxxxxxxx"
                    className="w-full text-xs px-3.5 py-2.5 bg-[#F8F7F4] border border-[#EAE8E3] rounded-xl focus:outline-none focus:border-gold-500 focus:ring-2 focus:ring-gold-500/20 text-charcoal-900 font-medium"
                  />
                  <p className="text-[10px] text-charcoal-400 mt-1">Sistem memvalidasi duplikasi nomor secara otomatis.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-charcoal-800 mb-1">Alamat Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="nama@email.com"
                    className="w-full text-xs px-3.5 py-2.5 bg-[#F8F7F4] border border-[#EAE8E3] rounded-xl focus:outline-none focus:border-gold-500 focus:ring-2 focus:ring-gold-500/20 text-charcoal-900 font-medium"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-charcoal-800 mb-1">Kecamatan di Garut</label>
                  <select
                    value={formData.district}
                    onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                    className="w-full text-xs px-3.5 py-2.5 bg-[#F8F7F4] border border-[#EAE8E3] rounded-xl focus:outline-none focus:border-gold-500 focus:ring-2 focus:ring-gold-500/20 text-charcoal-900 font-semibold"
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
                <label className="block text-xs font-bold text-charcoal-800 mb-1">Alamat Domisili Lengkap</label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Jl. Raya Cipanas No. 42"
                  className="w-full text-xs px-3.5 py-2.5 bg-[#F8F7F4] border border-[#EAE8E3] rounded-xl focus:outline-none focus:border-gold-500 focus:ring-2 focus:ring-gold-500/20 text-charcoal-900 font-medium"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-charcoal-800 mb-1">Sumber Pelanggan</label>
                  <select
                    value={formData.source}
                    onChange={(e) => setFormData({ ...formData, source: e.target.value as LeadSourceType })}
                    className="w-full text-xs px-3.5 py-2.5 bg-[#F8F7F4] border border-[#EAE8E3] rounded-xl focus:outline-none focus:border-gold-500 focus:ring-2 focus:ring-gold-500/20 text-charcoal-900 font-semibold"
                  >
                    <option value="Walk-in">Walk-in Showroom</option>
                    <option value="WhatsApp">WhatsApp</option>
                    <option value="Instagram">Instagram</option>
                    <option value="Facebook">Facebook</option>
                    <option value="TikTok">TikTok</option>
                    <option value="Other">Lainnya</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-charcoal-800 mb-1">Kategori Kendaraan</label>
                  <select
                    value={formData.vehicleType}
                    onChange={(e) => setFormData({ ...formData, vehicleType: e.target.value as VehicleCategory })}
                    className="w-full text-xs px-3.5 py-2.5 bg-[#F8F7F4] border border-[#EAE8E3] rounded-xl focus:outline-none focus:border-gold-500 focus:ring-2 focus:ring-gold-500/20 text-charcoal-900 font-semibold"
                  >
                    <option value="MPV">MPV (Keluarga)</option>
                    <option value="SUV">SUV</option>
                    <option value="City Car">City Car</option>
                    <option value="Sedan">Sedan</option>
                    <option value="Hatchback">Hatchback</option>
                    <option value="Commercial">Commercial / Pickup</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="relative" ref={stockDropdownRef}>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-charcoal-800">
                      Mobil Diminati <span className="text-rose-500">*</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => setIsStockDropdownOpen((prev) => !prev)}
                      className="text-[11px] font-bold text-gold-700 hover:text-gold-800 flex items-center gap-1 bg-gold-50 hover:bg-gold-100 border border-gold-300/80 px-2 py-0.5 rounded-lg transition-colors cursor-pointer"
                      title="Buka daftar mobil yang ready di stok showroom"
                    >
                      <Car className="w-3 h-3 text-gold-600" />
                      <span>Pilih dari Stok Ready ({readyStocks.length})</span>
                      <ChevronDown className={`w-3 h-3 transition-transform ${isStockDropdownOpen ? 'rotate-180' : ''}`} />
                    </button>
                  </div>

                  <div className="relative">
                    <input
                      type="text"
                      list="customer-ready-stocks"
                      required
                      value={formData.interestedVehicle}
                      onFocus={() => setIsStockDropdownOpen(true)}
                      onChange={(e) => {
                        const val = e.target.value;
                        const matched = readyStocks.find(
                          (s) => `${s.brand} ${s.model} ${s.year}`.toLowerCase().trim() === val.toLowerCase().trim()
                        );
                        if (matched) {
                          handleSelectStock(matched);
                        } else {
                          setFormData({ ...formData, interestedVehicle: val });
                          setStockSearchQuery(val);
                          setIsStockDropdownOpen(true);
                        }
                      }}
                      placeholder="Contoh: Innova Reborn 2020 (klik untuk pilih stok)"
                      className="w-full text-xs px-3.5 py-2.5 pr-8 bg-[#F8F7F4] border border-[#EAE8E3] rounded-xl focus:outline-none focus:border-gold-500 focus:ring-2 focus:ring-gold-500/20 text-charcoal-900 font-medium"
                    />
                    <datalist id="customer-ready-stocks">
                      {readyStocks.map((s) => (
                        <option key={s.id} value={`${s.brand} ${s.model} ${s.year}`}>
                          {s.licensePlate || s.plateNumber ? `[${s.licensePlate || s.plateNumber}] ` : ''}Rp {s.price?.toLocaleString('id-ID')} • {s.color}
                        </option>
                      ))}
                    </datalist>
                    <button
                      type="button"
                      onClick={() => setIsStockDropdownOpen((prev) => !prev)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-charcoal-400 hover:text-charcoal-700 p-1 rounded-md"
                      tabIndex={-1}
                    >
                      <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isStockDropdownOpen ? 'rotate-180' : ''}`} />
                    </button>
                  </div>

                  {/* Indikator jika unit dipilih dari stok ready */}
                  {readyStocks.some(
                    (s) =>
                      `${s.brand} ${s.model} ${s.year}`.toLowerCase().trim() ===
                      formData.interestedVehicle.toLowerCase().trim()
                  ) && (
                    <div className="mt-1.5 flex items-center gap-1.5 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-2.5 py-1 rounded-lg">
                      <CheckCircle className="w-3.5 h-3.5 shrink-0 text-emerald-600" />
                      <span>Unit terhubung ke Stok Ready (Plat No & Harga otomatis terisi)</span>
                    </div>
                  )}

                  {/* Dropdown Menu of Ready Stocks */}
                  {isStockDropdownOpen && (
                    <div className="absolute left-0 right-0 top-full mt-1.5 bg-white border border-[#DDD9CF] rounded-xl shadow-2xl z-50 overflow-hidden text-charcoal-900 animate-in fade-in slide-in-from-top-2 duration-150">
                      {/* Header Dropdown */}
                      <div className="p-2.5 bg-[#FAF9F5] border-b border-[#EAE8E3] flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <Car className="w-3.5 h-3.5 text-gold-600" />
                          <span className="text-[11px] font-black text-charcoal-900">
                            Unit Ready di Stok Showroom ({readyStocks.length} Mobil)
                          </span>
                        </div>
                        <span className="text-[10px] font-semibold text-charcoal-500">
                          Klik untuk memilih
                        </span>
                      </div>

                      {/* Search Filter inside dropdown */}
                      <div className="p-2 border-b border-[#F0EEEA] bg-white">
                        <div className="relative">
                          <Search className="w-3 h-3 text-charcoal-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                          <input
                            type="text"
                            value={stockSearchQuery}
                            onChange={(e) => setStockSearchQuery(e.target.value)}
                            placeholder="Cari merk, model, plat nomor, atau tahun..."
                            className="w-full text-xs pl-8 pr-2.5 py-1.5 bg-[#F8F7F4] border border-[#EAE8E3] rounded-lg focus:outline-none focus:border-gold-500 font-medium"
                          />
                        </div>
                      </div>

                      {/* List of Ready Cars */}
                      <div className="max-h-56 overflow-y-auto divide-y divide-[#F4F2EC]">
                        {filteredReadyStocks.length === 0 ? (
                          <div className="p-4 text-center">
                            <p className="text-xs text-charcoal-500">Tidak ada unit ready yang cocok dengan kata kunci.</p>
                            <p className="text-[11px] text-gold-700 font-bold mt-1">
                              Anda tetap dapat mengetik manual jika unit pesanan khusus.
                            </p>
                          </div>
                        ) : (
                          filteredReadyStocks.map((stock) => {
                            const isCurrentSelected =
                              formData.interestedVehicle.toLowerCase().trim() ===
                              `${stock.brand} ${stock.model} ${stock.year}`.toLowerCase().trim();
                            const plate = stock.licensePlate || stock.plateNumber;

                            return (
                              <button
                                key={stock.id}
                                type="button"
                                onClick={() => handleSelectStock(stock)}
                                className={`w-full text-left p-2.5 hover:bg-gold-50 transition-colors flex items-center justify-between gap-3 ${
                                  isCurrentSelected ? 'bg-gold-100/70 font-bold border-l-4 border-gold-600' : ''
                                }`}
                              >
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <span className="text-xs font-black text-charcoal-900 truncate">
                                      {stock.brand} {stock.model} {stock.year}
                                    </span>
                                    <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 border border-emerald-300">
                                      Ready
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2 text-[10px] text-charcoal-600 mt-0.5">
                                    {plate && (
                                      <span className="font-mono font-bold px-1.5 py-0.2 bg-[#F0EEEA] rounded text-charcoal-800 border border-charcoal-300">
                                        {plate}
                                      </span>
                                    )}
                                    <span>{stock.color}</span>
                                    <span>•</span>
                                    <span>{stock.transmission}</span>
                                  </div>
                                </div>

                                <div className="text-right shrink-0">
                                  <div className="text-xs font-black font-mono text-gold-700">
                                    Rp {stock.price.toLocaleString('id-ID')}
                                  </div>
                                  <div className="text-[10px] text-charcoal-400">Harga Unit</div>
                                </div>
                              </button>
                            );
                          })
                        )}
                      </div>

                      {/* Footer Info */}
                      <div className="p-2 bg-[#FAF9F5] border-t border-[#EAE8E3] flex items-center justify-between text-[10px] text-charcoal-500">
                        <span>Pilih unit untuk otomatis mengisi Plat No & Estimasi Harga</span>
                        <button
                          type="button"
                          onClick={() => setIsStockDropdownOpen(false)}
                          className="text-xs font-bold text-charcoal-800 hover:text-black underline cursor-pointer"
                        >
                          Tutup
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-charcoal-800 mb-1">Estimasi Budget (Rp)</label>
                  <input
                    type="number"
                    value={formData.budget}
                    onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                    placeholder="350000000"
                    className="w-full text-xs px-3.5 py-2.5 bg-[#F8F7F4] border border-[#EAE8E3] rounded-xl focus:outline-none focus:border-gold-500 focus:ring-2 focus:ring-gold-500/20 text-charcoal-900 font-medium"
                  />
                  <p className="text-[10px] text-charcoal-400 mt-1">Otomatis terisi jika memilih mobil dari stok ready.</p>
                </div>
              </div>

              {/* Kwitansi Pembayaran Kasir Showroom */}
              <div className="bg-[#FAF9F5] p-4 rounded-xl border border-gold-300/80 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-gold-600" />
                    <span className="font-bold text-xs text-charcoal-900 uppercase tracking-wide">
                      Data Kwitansi Pembayaran Showroom (Format Excel Resmi)
                    </span>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-gold-100 text-gold-800 border border-gold-300">
                    Otomatis Siap Cetak
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-charcoal-700 mb-1">
                      Plat Nomor Polisi (Plat No)
                    </label>
                    <input
                      type="text"
                      value={formData.plateNumber}
                      onChange={(e) => setFormData({ ...formData, plateNumber: e.target.value.toUpperCase() })}
                      placeholder="Contoh: Z 1529 TK / D 1581 OR"
                      className="w-full text-xs font-mono font-bold px-3 py-2 bg-white border border-[#EAE8E3] rounded-xl focus:outline-none focus:border-gold-500 text-charcoal-900 uppercase"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-charcoal-700 mb-1">
                      Jumlah Uang Kasir (Jumlah Rp)
                    </label>
                    <input
                      type="number"
                      value={formData.receiptAmount || formData.budget}
                      onChange={(e) => {
                        setFormData({
                          ...formData,
                          receiptAmount: e.target.value,
                          budget: e.target.value,
                        });
                      }}
                      placeholder="Contoh: 1000000 / 80000000"
                      className="w-full text-xs font-bold px-3 py-2 bg-white border border-[#EAE8E3] rounded-xl focus:outline-none focus:border-gold-500 text-charcoal-900"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-charcoal-700 mb-1">
                      Tempat dan Tanggal
                    </label>
                    <input
                      type="text"
                      value={formData.receiptDate}
                      onChange={(e) => setFormData({ ...formData, receiptDate: e.target.value })}
                      placeholder="GARUT, 3 NOVEMBER 2026"
                      className="w-full text-xs font-semibold px-3 py-2 bg-white border border-[#EAE8E3] rounded-xl focus:outline-none focus:border-gold-500 text-charcoal-900"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-charcoal-700 mb-1">
                      Yang Menerima (Penerima)
                    </label>
                    <input
                      type="text"
                      value={formData.receiptReceiver}
                      onChange={(e) => setFormData({ ...formData, receiptReceiver: e.target.value })}
                      placeholder="HR MOTOR"
                      className="w-full text-xs font-bold px-3 py-2 bg-white border border-[#EAE8E3] rounded-xl focus:outline-none focus:border-gold-500 text-charcoal-900"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-charcoal-800 mb-1">
                  Keterangan Kwitansi & Catatan Khusus
                </label>
                <input
                  type="text"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Contoh: LUNAS / SISA 40 JUTA RUPIAH DIBAYAR PIHAK OTO / BOKING KREDIT..."
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
                  {editingCustomer ? 'Simpan Perubahan' : 'Registrasi Konsumen'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CUSTOMER DETAIL DRAWER / MODAL */}
      {selectedCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-charcoal-950/40 backdrop-blur-xs animate-in fade-in duration-200 overflow-y-auto">
          <div className="crm-card w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden shadow-luxury border-gold-500/40 my-auto">
            {/* Header */}
            <div className="flex flex-col xs:flex-row items-start xs:items-center justify-between gap-3 px-4 sm:px-6 py-3.5 sm:py-4 bg-[#FAF9F5] border-b border-[#EAE8E3] text-charcoal-900 shrink-0 relative">
              <div className="absolute top-0 left-0 right-0 h-[2.5px] bg-gradient-to-r from-gold-500 via-gold-400 to-gold-600" />
              <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gold-100 text-gold-900 border border-gold-300 flex items-center justify-center font-black text-base sm:text-lg uppercase shadow-2xs shrink-0">
                  {selectedCustomer.fullName.charAt(0)}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <h2 className="text-base sm:text-lg font-black text-charcoal-900 truncate">{selectedCustomer.fullName}</h2>
                    <span className="badge-gold text-[10px]">Pelanggan Terdaftar</span>
                  </div>
                  <p className="text-[11px] sm:text-xs text-charcoal-500 truncate">
                    ID: {selectedCustomer.id} • Terdaftar: {formatDate(selectedCustomer.registeredDate)}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 self-end xs:self-auto shrink-0">
                <a
                  href={formatWhatsAppLink(
                    selectedCustomer.whatsapp,
                    `Sampurasun Bapak/Ibu ${selectedCustomer.fullName}, salam dari HR MOTOR Garut.`
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-gold flex items-center gap-1.5 py-1.5 px-3 text-xs"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Chat WhatsApp</span>
                  <span className="sm:hidden">WA</span>
                </a>
                <button
                  onClick={() => setSelectedCustomer(null)}
                  className="w-8 h-8 flex items-center justify-center rounded-lg text-charcoal-400 hover:text-white hover:bg-white/10 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Content Tabs */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 sm:space-y-6">
              {/* Profile Card */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 p-4 sm:p-5 bg-[#FAF9F5] rounded-2xl border border-[#EAE8E3] text-xs">
                <div>
                  <span className="text-charcoal-400 block text-[11px] font-semibold uppercase tracking-wider">Nomor WhatsApp</span>
                  <span className="font-bold text-charcoal-900 text-sm">{selectedCustomer.whatsapp}</span>
                </div>
                <div>
                  <span className="text-charcoal-400 block text-[11px] font-semibold uppercase tracking-wider">Alamat Email</span>
                  <span className="font-semibold text-charcoal-800">{selectedCustomer.email || '-'}</span>
                </div>
                <div>
                  <span className="text-charcoal-400 block text-[11px] font-semibold uppercase tracking-wider">Alamat & Domisili Garut</span>
                  <span className="font-semibold text-charcoal-800">
                    {selectedCustomer.address}, {selectedCustomer.district}, Garut
                  </span>
                </div>
                <div>
                  <span className="text-charcoal-400 block text-[11px] font-semibold uppercase tracking-wider">Sumber Asal Konsumen</span>
                  <span className="font-semibold text-charcoal-800">{selectedCustomer.source}</span>
                </div>
                <div>
                  <span className="text-charcoal-400 block text-[11px] font-semibold uppercase tracking-wider">Minat Armada & Tipe</span>
                  <span className="font-black text-charcoal-900 text-sm">
                    {selectedCustomer.interestedVehicle} <span className="text-xs text-gold-600 font-bold">({selectedCustomer.vehicleType})</span>
                  </span>
                </div>
                <div>
                  <span className="text-charcoal-400 block text-[11px] font-semibold uppercase tracking-wider">Estimasi Budget</span>
                  <span className="font-black text-gold-600 text-base">
                    {formatRupiah(selectedCustomer.budget)}
                  </span>
                </div>
                <div className="md:col-span-2 pt-2 border-t border-[#EAE8E3]">
                  <span className="text-charcoal-400 block text-[11px] font-semibold uppercase tracking-wider">Catatan Konsumen</span>
                  <span className="text-charcoal-700 italic">{selectedCustomer.notes || 'Tidak ada catatan tambahan.'}</span>
                </div>
              </div>

              {/* Purchase History */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-charcoal-700 mb-3 flex items-center gap-2">
                  <Car className="w-4 h-4 text-gold-600" /> Riwayat Pembelian Mobil Showroom
                </h3>
                {purchases.filter((p) => p.customerId === selectedCustomer.id).length === 0 ? (
                  <div className="p-4 text-center text-xs text-charcoal-400 bg-[#FAF9F5] rounded-xl border border-dashed border-[#EAE8E3]">
                    Belum ada transaksi pembelian unit mobil yang selesai untuk pelanggan ini.
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {purchases
                      .filter((p) => p.customerId === selectedCustomer.id)
                      .map((pur) => (
                        <div
                          key={pur.id}
                          className="p-4 bg-white border border-[#EAE8E3] rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between text-xs border-l-4 border-l-gold-500 shadow-xs gap-3"
                        >
                          <div className="flex-1">
                            <p className="font-black text-charcoal-900 text-sm">{pur.vehicleModel} ({pur.vehicleYear})</p>
                            <p className="text-charcoal-500 text-[11px] mt-0.5">
                              No. Polisi: <span className="font-bold text-charcoal-800 font-mono bg-charcoal-50 px-1.5 py-0.5 rounded border border-charcoal-200">{pur.plateNumber}</span> • Warna: {pur.color} • Metode: {pur.paymentMethod}
                            </p>
                            <span className="text-[10px] text-gold-700 font-bold block mt-1.5 bg-gold-50 px-2 py-0.5 rounded border border-gold-200 inline-block">
                              Garansi HR MOTOR Aktif s.d: {formatDate(pur.warrantyUntil)}
                            </span>
                            {pur.notes && (
                              <p className="text-[11px] text-charcoal-600 mt-2 bg-[#FAF9F5] p-2 rounded-lg border border-[#EAE8E3] italic">
                                &ldquo;{pur.notes}&rdquo;
                              </p>
                            )}
                          </div>
                          <div className="text-left sm:text-right flex flex-col items-start sm:items-end gap-1 shrink-0">
                            <span className="text-base font-black text-gold-600">
                              {formatRupiah(pur.purchasePrice)}
                            </span>
                            <span className="text-[10px] text-charcoal-400 block">
                              Tgl Beli: {formatDate(pur.purchaseDate)}
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                const kw = getKwitansiForCustomer(selectedCustomer, [pur]);
                                if (kw) setSelectedKwitansi(kw);
                              }}
                              className="mt-1 inline-flex items-center gap-1.5 text-[11px] font-bold text-gold-800 bg-gold-50 hover:bg-gold-100 border border-gold-300 px-2.5 py-1 rounded-lg transition-colors shadow-2xs"
                              title="Buka Kwitansi Resmi Kasir HR MOTOR"
                            >
                              <FileText className="w-3.5 h-3.5 text-gold-600" />
                              <span>Lihat Kwitansi</span>
                            </button>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </div>

              {/* Riwayat Garansi & Perbaikan */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-charcoal-700 flex items-center gap-2">
                    <Wrench className="w-4 h-4 text-gold-600" /> Riwayat Perbaikan & Garansi Showroom
                  </h3>
                  <Link
                    href="/riwayat-perbaikan"
                    className="text-[11px] font-bold text-gold-600 hover:text-gold-700 transition-colors"
                  >
                    Buka Menu Riwayat Perbaikan →
                  </Link>
                </div>
                {repairClaims.filter(
                  (r) =>
                    r.customerId === selectedCustomer.id ||
                    r.customerPhone === selectedCustomer.whatsapp ||
                    r.customerName.toLowerCase() === selectedCustomer.fullName.toLowerCase()
                ).length === 0 ? (
                  <div className="p-4 text-center text-xs text-charcoal-400 bg-[#FAF9F5] rounded-xl border border-dashed border-[#EAE8E3]">
                    Belum ada pengajuan garansi atau perbaikan unit yang tercatat untuk konsumen ini.
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {repairClaims
                      .filter(
                        (r) =>
                          r.customerId === selectedCustomer.id ||
                          r.customerPhone === selectedCustomer.whatsapp ||
                          r.customerName.toLowerCase() === selectedCustomer.fullName.toLowerCase()
                      )
                      .map((rep) => (
                        <div
                          key={rep.id}
                          className="p-3.5 bg-white border border-[#EAE8E3] rounded-xl text-xs space-y-2 shadow-xs"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="badge-gold text-[10px]">
                                {rep.claimType}
                              </span>
                              <span className="font-black text-charcoal-900">{rep.claimNumber}</span>
                              <span className="text-[11px] text-charcoal-500">
                                • {rep.vehicleBrand} {rep.vehicleModel} ({rep.vehicleYear})
                              </span>
                            </div>
                            <span
                              className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${
                                rep.status === 'Selesai'
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : rep.status === 'Dalam Proses'
                                  ? 'bg-gold-50 text-gold-800 border border-gold-300'
                                  : rep.status === 'Dibatalkan'
                                  ? 'bg-charcoal-100 text-charcoal-500'
                                  : 'bg-blue-50 text-blue-700 border border-blue-200'
                              }`}
                            >
                              {rep.status}
                            </span>
                          </div>

                          <div className="bg-[#FAF9F5] p-2.5 rounded-lg border border-[#EAE8E3]">
                            <p className="text-charcoal-800">
                              <span className="font-bold text-charcoal-600">Keluhan: </span>
                              {rep.complaint}
                            </p>
                            {rep.damagedParts && (
                              <p className="text-charcoal-600 text-[11px] mt-0.5">
                                <span className="font-semibold text-charcoal-500">Bagian Diperbaiki: </span>
                                {rep.damagedParts}
                              </p>
                            )}
                            {rep.actionTaken && (
                              <p className="text-gold-700 text-[11px] mt-0.5 font-medium">
                                <span className="font-bold">Tindakan Bengkel: </span>
                                {rep.actionTaken}
                              </p>
                            )}
                          </div>

                          <div className="flex items-center justify-between pt-1 border-t border-[#EAE8E3] text-[11px]">
                            <span className="text-charcoal-400">
                              Tgl Pengajuan: {formatDate(rep.claimDate)}
                            </span>
                            <div className="text-right">
                              <span className="font-black text-charcoal-900">
                                Total: {formatRupiah(rep.totalCost)}
                              </span>
                              <span className="text-[10px] text-charcoal-500 block">
                                (Part: {formatRupiah(rep.sparepartCost)} + Jasa: {formatRupiah(rep.serviceCost)})
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </div>

              {/* Communication History */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-charcoal-700 mb-3 flex items-center gap-2">
                  <MessageCircle className="w-4 h-4 text-gold-600" /> Riwayat Interaksi & Komunikasi
                </h3>
                {communications.filter((c) => c.customerId === selectedCustomer.id).length === 0 ? (
                  <div className="p-4 text-center text-xs text-charcoal-400 bg-[#FAF9F5] rounded-xl border border-dashed border-[#EAE8E3]">
                    Belum ada catatan interaksi komunikasi untuk konsumen ini.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {communications
                      .filter((c) => c.customerId === selectedCustomer.id)
                      .map((comm) => (
                        <div key={comm.id} className="p-3 bg-[#FAF9F5] border border-[#EAE8E3] rounded-xl text-xs space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-charcoal-900">
                              Kanal {comm.channel} ({comm.direction})
                            </span>
                            <span className="text-[10px] text-charcoal-400">
                              {formatDate(comm.createdAt, true)}
                            </span>
                          </div>
                          <p className="text-charcoal-800 italic bg-white p-2.5 rounded-lg border border-[#EAE8E3]">
                            &ldquo;{comm.messageContent}&rdquo;
                          </p>
                          <p className="text-[11px] text-charcoal-500">
                            Dicatat oleh: {comm.loggedByName} • Hasil: {comm.notes || '-'}
                          </p>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer Actions */}
            <div className="p-4 bg-warm-50 border-t border-warm-200 flex items-center justify-between">
              <button
                type="button"
                onClick={() => {
                  setDeleteConfirmId(selectedCustomer.id);
                }}
                className="px-3 py-2 rounded-xl text-xs font-bold text-rose-600 hover:text-rose-800 hover:bg-rose-50 border border-rose-200 transition-colors flex items-center gap-1.5 shadow-xs"
              >
                <Trash2 className="w-4 h-4" />
                <span>Hapus Data Pelanggan</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const custToEdit = selectedCustomer;
                    setSelectedCustomer(null);
                    openEditModal(custToEdit);
                  }}
                  className="btn-outline-warm text-xs flex items-center gap-1.5 py-2 px-3 shadow-xs"
                >
                  <Edit className="w-3.5 h-3.5" />
                  <span>Edit Profil</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedCustomer(null)}
                  className="btn-outline-warm text-xs font-bold py-2 px-4 shadow-xs cursor-pointer"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION DIALOG */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-charcoal-950/70 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="crm-card max-w-sm w-full p-6 space-y-4 shadow-luxury border-rose-200">
            <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto border border-rose-200">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div className="text-center">
              <h3 className="text-sm font-black text-charcoal-900">Hapus Data Pelanggan?</h3>
              <p className="text-xs text-charcoal-500 mt-1">
                Apakah Anda yakin ingin menghapus pelanggan ini dari database HR MOTOR? Seluruh riwayat akan dihapus dan tindakan ini dicatat dalam audit log.
              </p>
            </div>
            <div className="flex items-center gap-2 pt-2">
              <button
                disabled={isDeleting}
                onClick={() => setDeleteConfirmId(null)}
                className="btn-outline-warm flex-1 py-2 text-xs disabled:opacity-50"
              >
                Batal
              </button>
              <button
                disabled={isDeleting}
                onClick={() => handleDelete(deleteConfirmId)}
                className="flex-1 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 disabled:opacity-50 rounded-xl shadow-sm transition-all flex items-center justify-center gap-1.5"
              >
                {isDeleting ? 'Menghapus...' : 'Ya, Hapus'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL KWITANSI PEMBAYARAN KASIR RESMI HR MOTOR */}
      {selectedKwitansi && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-3 sm:p-4 bg-charcoal-950/40 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-2xl w-full border border-gold-500/40 shadow-2xl overflow-hidden flex flex-col max-h-[95vh]">
            {/* Header Toolbar */}
            <div className="px-3.5 sm:px-5 py-3 sm:py-3.5 bg-[#FAF9F5] text-charcoal-900 flex items-center justify-between border-b border-[#EAE8E3] shrink-0 gap-2 relative">
              <div className="absolute top-0 left-0 right-0 h-[2.5px] bg-gradient-to-r from-gold-500 via-gold-400 to-gold-600" />
              <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
                <FileText className="w-4 h-4 text-gold-600 shrink-0" />
                <span className="font-bold text-xs sm:text-sm tracking-wide text-charcoal-900 truncate max-w-[150px] xs:max-w-none">
                  Kwitansi Resmi Showroom
                </span>
              </div>
              <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    if (selectedKwitansi) {
                      printKwitansiToIframe(selectedKwitansi);
                    } else {
                      window.print();
                    }
                  }}
                  className="px-2.5 sm:px-3.5 py-1.5 rounded-lg bg-gold-500 hover:bg-gold-600 text-charcoal-950 font-bold text-xs flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
                  title="Cetak Kwitansi (1 Halaman Portrait)"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span className="hidden xs:inline">Cetak Kwitansi</span>
                  <span className="xs:hidden">Cetak</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedKwitansi(null)}
                  className="p-1.5 rounded-lg text-charcoal-500 hover:text-charcoal-900 hover:bg-[#F0EDE6] transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Printable Kwitansi Sheet (Presisi 100% Sesuai Template Excel Showroom HR MOTOR) */}
            <div className="p-3 sm:p-6 overflow-y-auto overflow-x-auto bg-[#FAF8F5] flex justify-center">
              <div
                id="printable-kwitansi"
                className="bg-white border border-black shadow-lg relative overflow-hidden text-black w-full max-w-2xl select-none min-w-[290px]"
              >
                {/* Top Yellow Bar */}
                <div className="w-full h-3 sm:h-3.5 bg-[#FFEE00] border-b border-black/20"></div>

                <div className="relative min-h-[290px] sm:min-h-[340px] p-4 sm:p-7 flex flex-col justify-between">
                    {/* Watermark Logo HR MOTOR in Center Background */}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none z-0">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src="/logo-hr-motor.png"
                        alt=""
                        className="w-56 sm:w-80 object-contain opacity-15"
                      />
                    </div>

                    {/* Logo Header in Top Center */}
                    <div className="flex justify-center mb-3 sm:mb-5 relative z-10">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src="/logo-hr-motor.png"
                        alt="HR MOTOR"
                        className="h-14 sm:h-20 object-contain drop-shadow-xs"
                      />
                    </div>

                    {/* Main Receipt Content Rows */}
                    <div className="relative z-10 space-y-1 sm:space-y-1.5 text-xs sm:text-sm font-sans text-black">
                      <div className="flex items-baseline">
                        <span className="w-28 sm:w-40 font-bold shrink-0 text-xs sm:text-sm">Terima Dari</span>
                        <span className="font-bold mr-1.5 sm:mr-3">:</span>
                        <span className="font-bold uppercase tracking-tight break-words">
                          {selectedKwitansi.terimaDari}
                        </span>
                      </div>
                      <div className="flex items-baseline">
                        <span className="w-28 sm:w-40 font-bold shrink-0 text-xs sm:text-sm">Sejumlah Uang</span>
                        <span className="font-bold mr-1.5 sm:mr-3">:</span>
                        <span className="font-medium text-black break-words">
                          {selectedKwitansi.terbilang}
                        </span>
                      </div>
                      <div className="flex items-baseline">
                        <span className="w-28 sm:w-40 font-bold shrink-0 text-xs sm:text-sm">Untuk Pembayaran</span>
                        <span className="font-bold mr-1.5 sm:mr-3">:</span>
                        <span className="font-bold uppercase text-black break-words">
                          {selectedKwitansi.untukPembayaran}
                        </span>
                      </div>
                      <div className="flex items-baseline">
                        <span className="w-28 sm:w-40 font-bold shrink-0 text-xs sm:text-sm">Plat No</span>
                        <span className="font-bold mr-1.5 sm:mr-3">:</span>
                        <span className="font-bold font-mono uppercase text-black">
                          {selectedKwitansi.nomorPolisi || '-'}
                        </span>
                      </div>
                      <div className="flex items-baseline">
                        <span className="w-28 sm:w-40 font-bold shrink-0 text-xs sm:text-sm">Keterangan</span>
                        <span className="font-bold mr-1.5 sm:mr-3">:</span>
                        <span className="font-medium text-black">
                          {selectedKwitansi.keterangan || 'Walk in'}
                        </span>
                      </div>
                    </div>

                    {/* Bottom Row: Jumlah Rp & Tanda Tangan */}
                    <div className="mt-5 sm:mt-8 pt-2 flex flex-col xs:flex-row items-start xs:items-end justify-between gap-3 sm:gap-4 relative z-10">
                      {/* Left: Jumlah Rp with Slanted Parallelogram Box */}
                      <div className="flex items-center gap-2 sm:gap-3">
                        <span className="font-bold text-xs sm:text-sm text-black shrink-0">
                          Jumlah Rp
                        </span>
                        <div className="border-2 border-black transform -skew-x-[25deg] px-3 sm:px-8 py-0.5 sm:py-1 bg-white">
                          <span className="inline-block transform skew-x-[25deg] font-bold text-xs sm:text-sm font-mono text-black">
                            {selectedKwitansi.sejumlahUang.toLocaleString('id-ID')}
                          </span>
                        </div>
                      </div>

                      {/* Right: Signature & Date */}
                      <div className="text-right text-[11px] sm:text-xs text-black shrink-0 pr-1 self-end">
                        <div>{selectedKwitansi.tempatTanggal}</div>
                        <div className="mt-0.5">Penerima</div>
                        <div className="h-8 sm:h-12"></div>
                        <div className="font-bold uppercase tracking-wide">
                          {selectedKwitansi.penerima || 'HR MOTOR'}
                        </div>
                      </div>
                    </div>
                </div>

                {/* Bottom Yellow Bar */}
                <div className="w-full h-3 sm:h-3.5 bg-[#FFEE00] border-t border-black/20"></div>
              </div>
            </div>

            {/* Footer Modal */}
            <div className="px-5 py-3 bg-[#FAF9F5] border-t border-[#EAE8E3] flex items-center justify-end shrink-0">
              <button
                type="button"
                onClick={() => setSelectedKwitansi(null)}
                className="btn-outline-warm text-xs font-bold py-2 px-4 cursor-pointer"
              >
                Tutup Kwitansi
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 1: TRANSAKSI PENJUALAN CASH */}
      {isCashModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-charcoal-950/40 backdrop-blur-xs animate-in fade-in duration-200 overflow-y-auto">
          <div className="crm-card w-full max-w-xl max-h-[90vh] flex flex-col overflow-hidden shadow-luxury border-emerald-500/40 my-auto">
            <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 sm:py-4 bg-[#FAF9F5] border-b border-emerald-500/30 text-charcoal-900 shrink-0 relative">
              <div className="absolute top-0 left-0 right-0 h-[2.5px] bg-gradient-to-r from-emerald-500 via-emerald-400 to-emerald-600" />
              <div>
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-900 border border-emerald-300 mb-1">
                  <DollarSign className="w-3 h-3" /> Transaksi Penjualan Cash Showroom
                </span>
                <h2 className="text-base font-black text-charcoal-900 tracking-tight">
                  Input Transaksi Penjualan Cash
                </h2>
                <p className="text-xs text-charcoal-500">
                  Unit mobil otomatis berstatus SOLD OUT & Kwitansi resmi otomatis diterbitkan
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsCashModalOpen(false)}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-charcoal-400 hover:text-charcoal-900 hover:bg-[#F0EDE6] transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="mx-4 sm:mx-6 mt-3 sm:mt-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-medium">
                {formError}
              </div>
            )}

            <form onSubmit={handleSubmitCashTransaction} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="block text-xs font-bold text-charcoal-800 mb-1">
                    Nama Pembeli <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={cashForm.customerName}
                    onChange={(e) => setCashForm({ ...cashForm, customerName: e.target.value })}
                    placeholder="Contoh: Budi Santoso"
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
                    value={cashForm.customerPhone}
                    onChange={(e) => setCashForm({ ...cashForm, customerPhone: e.target.value })}
                    placeholder="Contoh: 08123456789"
                    className="w-full text-xs px-3.5 py-2.5 bg-[#F8F7F4] border border-[#EAE8E3] rounded-xl focus:outline-none focus:border-gold-500 text-charcoal-900 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-charcoal-800 mb-1">
                    Alamat Domisili Garut / Jabar <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={cashForm.customerAddress}
                    onChange={(e) => setCashForm({ ...cashForm, customerAddress: e.target.value })}
                    placeholder="Contoh: Tarogong Kidul, Garut"
                    className="w-full text-xs px-3.5 py-2.5 bg-[#F8F7F4] border border-[#EAE8E3] rounded-xl focus:outline-none focus:border-gold-500 text-charcoal-900 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-charcoal-800 mb-1">
                    Sumber Penjualan
                  </label>
                  <select
                    value={cashForm.customerSource}
                    onChange={(e) => setCashForm({ ...cashForm, customerSource: e.target.value as LeadSourceType })}
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

              {/* Pilih Mobil Ready */}
              <div className="relative">
                <label className="block text-xs font-bold text-charcoal-800 mb-1">
                  Pilih Mobil dari Stok READY Showroom <span className="text-rose-500">*</span>
                </label>
                <div
                  onClick={() => setIsCashStockDropdownOpen(!isCashStockDropdownOpen)}
                  className="w-full text-xs px-3.5 py-2.5 bg-[#F8F7F4] border border-[#EAE8E3] rounded-xl cursor-pointer flex items-center justify-between text-charcoal-900 font-medium"
                >
                  {cashForm.vehicleStockId ? (
                    <span className="font-bold text-charcoal-900">
                      {(() => {
                        const s = stocks.find((st) => st.id === cashForm.vehicleStockId);
                        return s ? `${s.brand} ${s.model} (${s.year}) - [${s.licensePlate || s.plateNumber || 'No Plat'}] - Rp ${s.price.toLocaleString('id-ID')}` : 'Unit Terpilih';
                      })()}
                    </span>
                  ) : (
                    <span className="text-charcoal-400">-- Klik untuk cari dan pilih mobil ready showroom --</span>
                  )}
                  <ChevronDown className="w-4 h-4 text-charcoal-400" />
                </div>

                {isCashStockDropdownOpen && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-[#EAE8E3] rounded-xl shadow-xl z-20 overflow-hidden max-h-60 flex flex-col">
                    <div className="p-2 border-b border-[#EAE8E3] bg-[#FAF9F5]">
                      <input
                        type="text"
                        value={cashStockSearch}
                        onChange={(e) => setCashStockSearch(e.target.value)}
                        placeholder="Ketik nama mobil, tipe, atau plat..."
                        className="w-full text-xs px-3 py-1.5 bg-white border border-[#EAE8E3] rounded-lg outline-none focus:border-gold-500"
                        autoFocus
                      />
                    </div>
                    <div className="overflow-y-auto divide-y divide-[#EAE8E3]">
                      {filteredCashReadyStocks.length === 0 ? (
                        <div className="p-4 text-center text-xs text-charcoal-400">
                          Tidak ada stok mobil ready yang cocok
                        </div>
                      ) : (
                        filteredCashReadyStocks.map((stock) => (
                          <div
                            key={stock.id}
                            onClick={() => handleSelectCashStock(stock)}
                            className="p-3 hover:bg-gold-50/50 cursor-pointer flex items-center justify-between transition-colors text-xs"
                          >
                            <div>
                              <p className="font-bold text-charcoal-900">{stock.brand} {stock.model} ({stock.year})</p>
                              <p className="text-[11px] text-charcoal-500 font-mono mt-0.5">
                                Plat: {stock.licensePlate || stock.plateNumber || '-'} • Warna: {stock.color} • {stock.transmission}
                              </p>
                            </div>
                            <div className="text-right">
                              <span className="font-bold text-emerald-700">{formatRupiah(stock.price)}</span>
                              <span className="block text-[10px] text-emerald-600 font-semibold">READY</span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Harga Deal & Tanggal */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-charcoal-800 mb-1">
                    Harga Deal Penjualan (Rp) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    value={cashForm.dealPrice}
                    onChange={(e) => setCashForm({ ...cashForm, dealPrice: e.target.value })}
                    placeholder="Contoh: 185000000"
                    className="w-full text-xs font-bold px-3.5 py-2.5 bg-[#F8F7F4] border border-[#EAE8E3] rounded-xl focus:outline-none focus:border-gold-500 text-charcoal-900"
                  />
                  {Number(cashForm.dealPrice) > 0 && (
                    <p className="text-[11px] text-emerald-700 font-medium mt-1">
                      {formatRupiah(Number(cashForm.dealPrice))}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-charcoal-800 mb-1">
                    Tanggal Transaksi <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={cashForm.transactionDate}
                    onChange={(e) => setCashForm({ ...cashForm, transactionDate: e.target.value })}
                    className="w-full text-xs px-3.5 py-2.5 bg-[#F8F7F4] border border-[#EAE8E3] rounded-xl focus:outline-none focus:border-gold-500 text-charcoal-900 font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-charcoal-800 mb-1">
                  Keterangan / Catatan Pembayaran
                </label>
                <input
                  type="text"
                  value={cashForm.notes}
                  onChange={(e) => setCashForm({ ...cashForm, notes: e.target.value })}
                  placeholder="Contoh: Pembayaran transfer BCA lunas, serah terima BPKB dan unit hari ini."
                  className="w-full text-xs px-3.5 py-2.5 bg-[#F8F7F4] border border-[#EAE8E3] rounded-xl focus:outline-none focus:border-gold-500 text-charcoal-900 font-medium"
                />
              </div>

              <div className="p-3 bg-emerald-50/70 border border-emerald-300 rounded-xl text-[11px] text-emerald-950 flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="block font-bold">Otomatisasi Sistem Showroom:</strong>
                  Unit mobil yang dipilih akan langsung berubah status menjadi <strong>SOLD OUT (Terjual)</strong>, kwitansi pembayaran resmi langsung terbit siap cetak, dan jadwal berkala Customer Follow Up (1 tahun) otomatis terbuat.
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-[#EAE8E3]">
                <button
                  type="button"
                  onClick={() => setIsCashModalOpen(false)}
                  className="btn-outline-warm"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all"
                >
                  <Check className="w-4 h-4" />
                  <span>Simpan Transaksi & Terbitkan Kwitansi</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: PENGAJUAN KREDIT BARU */}
      {isCreditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-charcoal-950/40 backdrop-blur-xs animate-in fade-in duration-200 overflow-y-auto">
          <div className="crm-card w-full max-w-xl max-h-[90vh] flex flex-col overflow-hidden shadow-luxury border-gold-500/40 my-auto">
            <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 sm:py-4 bg-[#FAF9F5] border-b border-[#EAE8E3] text-charcoal-900 shrink-0 relative">
              <div className="absolute top-0 left-0 right-0 h-[2.5px] bg-gradient-to-r from-gold-500 via-gold-400 to-gold-600" />
              <div>
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-gold-100 text-gold-900 border border-gold-300 mb-1">
                  <CreditCard className="w-3 h-3 text-gold-700" /> Pengajuan Kredit Baru Showroom
                </span>
                <h2 className="text-base font-black text-charcoal-900 tracking-tight">
                  Input Pengajuan Kredit (Leasing)
                </h2>
                <p className="text-xs text-charcoal-500">
                  Unit mobil di stok otomatis berstatus BOOKING (BOKING) dan terkunci dari pemesanan lain
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsCreditModalOpen(false)}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-charcoal-400 hover:text-charcoal-900 hover:bg-[#F0EDE6] transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="mx-4 sm:mx-6 mt-3 sm:mt-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-medium">
                {formError}
              </div>
            )}

            <form onSubmit={handleSubmitCreditApplication} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="block text-xs font-bold text-charcoal-800 mb-1">
                    Nama Calon Pembeli <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={creditForm.customerName}
                    onChange={(e) => setCreditForm({ ...creditForm, customerName: e.target.value })}
                    placeholder="Contoh: Rahmat Hidayat"
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
                    value={creditForm.customerPhone}
                    onChange={(e) => setCreditForm({ ...creditForm, customerPhone: e.target.value })}
                    placeholder="Contoh: 0852xxxxxxx"
                    className="w-full text-xs px-3.5 py-2.5 bg-[#F8F7F4] border border-[#EAE8E3] rounded-xl focus:outline-none focus:border-gold-500 text-charcoal-900 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-charcoal-800 mb-1">
                    Alamat Domisili <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={creditForm.customerAddress}
                    onChange={(e) => setCreditForm({ ...creditForm, customerAddress: e.target.value })}
                    placeholder="Contoh: Tarogong Kaler, Garut"
                    className="w-full text-xs px-3.5 py-2.5 bg-[#F8F7F4] border border-[#EAE8E3] rounded-xl focus:outline-none focus:border-gold-500 text-charcoal-900 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-charcoal-800 mb-1">
                    Sumber Lead
                  </label>
                  <select
                    value={creditForm.customerSource}
                    onChange={(e) => setCreditForm({ ...creditForm, customerSource: e.target.value as LeadSourceType })}
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

              {/* Pilih Mobil Ready */}
              <div className="relative">
                <label className="block text-xs font-bold text-charcoal-800 mb-1">
                  Pilih Mobil dari Stok READY Showroom <span className="text-rose-500">*</span>
                </label>
                <div
                  onClick={() => setIsCreditStockDropdownOpen(!isCreditStockDropdownOpen)}
                  className="w-full text-xs px-3.5 py-2.5 bg-[#F8F7F4] border border-[#EAE8E3] rounded-xl cursor-pointer flex items-center justify-between text-charcoal-900 font-medium"
                >
                  {creditForm.vehicleStockId ? (
                    <span className="font-bold text-charcoal-900">
                      {(() => {
                        const s = stocks.find((st) => st.id === creditForm.vehicleStockId);
                        return s ? `${s.brand} ${s.model} (${s.year}) - [${s.licensePlate || s.plateNumber || 'No Plat'}] - Rp ${s.price.toLocaleString('id-ID')}` : 'Unit Terpilih';
                      })()}
                    </span>
                  ) : (
                    <span className="text-charcoal-400">-- Klik untuk cari dan pilih mobil ready showroom --</span>
                  )}
                  <ChevronDown className="w-4 h-4 text-charcoal-400" />
                </div>

                {isCreditStockDropdownOpen && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-[#EAE8E3] rounded-xl shadow-xl z-20 overflow-hidden max-h-60 flex flex-col">
                    <div className="p-2 border-b border-[#EAE8E3] bg-[#FAF9F5]">
                      <input
                        type="text"
                        value={creditStockSearch}
                        onChange={(e) => setCreditStockSearch(e.target.value)}
                        placeholder="Ketik nama mobil, tipe, atau plat..."
                        className="w-full text-xs px-3 py-1.5 bg-white border border-[#EAE8E3] rounded-lg outline-none focus:border-gold-500"
                        autoFocus
                      />
                    </div>
                    <div className="overflow-y-auto divide-y divide-[#EAE8E3]">
                      {filteredCreditReadyStocks.length === 0 ? (
                        <div className="p-4 text-center text-xs text-charcoal-400">
                          Tidak ada stok mobil ready yang cocok
                        </div>
                      ) : (
                        filteredCreditReadyStocks.map((stock) => (
                          <div
                            key={stock.id}
                            onClick={() => handleSelectCreditStock(stock)}
                            className="p-3 hover:bg-gold-50/50 cursor-pointer flex items-center justify-between transition-colors text-xs"
                          >
                            <div>
                              <p className="font-bold text-charcoal-900">{stock.brand} {stock.model} ({stock.year})</p>
                              <p className="text-[11px] text-charcoal-500 font-mono mt-0.5">
                                Plat: {stock.licensePlate || stock.plateNumber || '-'} • Warna: {stock.color} • {stock.transmission}
                              </p>
                            </div>
                            <div className="text-right">
                              <span className="font-bold text-charcoal-900">{formatRupiah(stock.price)}</span>
                              <span className="block text-[10px] text-gold-600 font-semibold">DP Estimasi: {formatRupiah(stock.creditDp || Math.round(stock.price * 0.2))}</span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Bank/Leasing Tujuan */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-charcoal-800 mb-1">
                    Bank / Leasing Tujuan <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={creditForm.targetLeasing}
                    onChange={(e) => setCreditForm({ ...creditForm, targetLeasing: e.target.value })}
                    className="w-full text-xs px-3.5 py-2.5 bg-[#F8F7F4] border border-[#EAE8E3] rounded-xl focus:outline-none focus:border-gold-500 text-charcoal-900 font-medium"
                  >
                    <option value="BCA Finance">BCA Finance</option>
                    <option value="Mandiri Utama Finance">Mandiri Utama Finance (MUF)</option>
                    <option value="Adira Finance">Adira Finance</option>
                    <option value="OTO Multiartha">OTO Multiartha</option>
                    <option value="Maybank Finance">Maybank Finance</option>
                    <option value="CIMB Niaga Auto Finance">CIMB Niaga Auto Finance</option>
                    <option value="BSI Oto">BSI Oto (Syariah)</option>
                    <option value="Mega Finance">Mega Finance</option>
                    <option value="Lainnya">Lainnya</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-charcoal-800 mb-1">
                    Estimasi Harga Deal (Rp) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    value={creditForm.dealPrice}
                    onChange={(e) => setCreditForm({ ...creditForm, dealPrice: e.target.value })}
                    placeholder="Contoh: 195000000"
                    className="w-full text-xs font-bold px-3.5 py-2.5 bg-[#F8F7F4] border border-[#EAE8E3] rounded-xl focus:outline-none focus:border-gold-500 text-charcoal-900"
                  />
                  {Number(creditForm.dealPrice) > 0 && (
                    <p className="text-[11px] text-charcoal-500 font-medium mt-1">
                      {formatRupiah(Number(creditForm.dealPrice))}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-charcoal-800 mb-1">
                    Uang Muka / DP Awal (Rp) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    value={creditForm.initialDp}
                    onChange={(e) => setCreditForm({ ...creditForm, initialDp: e.target.value })}
                    placeholder="Contoh: 35000000"
                    className="w-full text-xs font-bold px-3.5 py-2.5 bg-[#F8F7F4] border border-[#EAE8E3] rounded-xl focus:outline-none focus:border-gold-500 text-charcoal-900"
                  />
                  {Number(creditForm.initialDp) > 0 && (
                    <p className="text-[11px] text-gold-600 font-medium mt-1">
                      {formatRupiah(Number(creditForm.initialDp))}
                    </p>
                  )}
                </div>
              </div>

              {/* Tanggal & Keterangan */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-charcoal-800 mb-1">
                    Tanggal Pengajuan <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={creditForm.applicationDate}
                    onChange={(e) => setCreditForm({ ...creditForm, applicationDate: e.target.value })}
                    className="w-full text-xs px-3.5 py-2.5 bg-[#F8F7F4] border border-[#EAE8E3] rounded-xl focus:outline-none focus:border-gold-500 text-charcoal-900 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-charcoal-800 mb-1">
                    Keterangan / Catatan Pengajuan
                  </label>
                  <input
                    type="text"
                    value={creditForm.notes}
                    onChange={(e) => setCreditForm({ ...creditForm, notes: e.target.value })}
                    placeholder="Contoh: Berkas KTP, KK, Rekening koran 3 bulan sudah masuk surveyor."
                    className="w-full text-xs px-3.5 py-2.5 bg-[#F8F7F4] border border-[#EAE8E3] rounded-xl focus:outline-none focus:border-gold-500 text-charcoal-900 font-medium"
                  />
                </div>
              </div>

              {/* Callout Info Booking */}
              <div className="p-3 bg-amber-50/70 border border-amber-300 rounded-xl text-[11px] text-amber-950 flex items-start gap-2">
                <Clock className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                <div>
                  <strong className="block font-bold">Status Booking Unit Aktif:</strong>
                  Unit mobil yang dipilih otomatis berubah menjadi status <strong>BOOKING (BOKING)</strong>, menampilkan nama konsumen dan leasing tujuan di kartu stok, serta <strong>terkunci dan tidak dapat dipilih</strong> untuk transaksi atau booking lain sampai status pengajuan ini disetujui (ACC) atau ditolak.
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-[#EAE8E3]">
                <button
                  type="button"
                  onClick={() => setIsCreditModalOpen(false)}
                  className="btn-outline-warm"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="btn-gold"
                >
                  Simpan Pengajuan Kredit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: TOMBOL ACC (PERSETUJUAN KREDIT) */}
      {isAccModalOpen && selectedCreditApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-charcoal-950/40 backdrop-blur-xs animate-in fade-in duration-200 overflow-y-auto">
          <div className="crm-card w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden shadow-luxury border-emerald-500/40 my-auto">
            <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 sm:py-4 bg-[#FAF9F5] border-b border-emerald-500/30 text-charcoal-900 shrink-0 relative">
              <div className="absolute top-0 left-0 right-0 h-[2.5px] bg-gradient-to-r from-emerald-500 via-emerald-400 to-emerald-600" />
              <div>
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-900 border border-emerald-300 mb-1">
                  <Check className="w-3 h-3 text-emerald-700" /> Konfirmasi Keputusan Kredit
                </span>
                <h2 className="text-base font-black text-charcoal-900 tracking-tight">
                  Persetujuan Kredit (ACC)
                </h2>
                <p className="text-xs text-charcoal-500">
                  Ubah status unit menjadi Terjual (SOLD OUT) dan catat data penjualan resmi
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsAccModalOpen(false)}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-charcoal-400 hover:text-charcoal-900 hover:bg-[#F0EDE6] transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="mx-4 sm:mx-6 mt-3 sm:mt-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-medium">
                {formError}
              </div>
            )}

            <form onSubmit={handleSubmitAcc} className="p-4 sm:p-6 space-y-4 overflow-y-auto">
              {/* Ringkasan Pengajuan */}
              <div className="p-3.5 bg-[#FAF9F5] border border-[#EAE8E3] rounded-xl text-xs space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-charcoal-500">Pemohon:</span>
                  <span className="font-bold text-charcoal-900">{selectedCreditApp.customerName} ({selectedCreditApp.customerPhone})</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-charcoal-500">Unit Kendaraan:</span>
                  <span className="font-bold text-charcoal-900">{selectedCreditApp.vehicleName} [{selectedCreditApp.plateNumber || '-'}]</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-charcoal-500">Harga Deal:</span>
                  <span className="font-black text-charcoal-900">{formatRupiah(selectedCreditApp.dealPrice)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-charcoal-500">DP Pengajuan Awal:</span>
                  <span className="font-semibold text-charcoal-700">{formatRupiah(selectedCreditApp.initialDp)}</span>
                </div>
              </div>

              {/* Form Input ACC */}
              <div>
                <label className="block text-xs font-bold text-charcoal-800 mb-1">
                  Nominal DP Final Disetujui (Rp) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  required
                  value={accForm.finalDp}
                  onChange={(e) => setAccForm({ ...accForm, finalDp: e.target.value })}
                  placeholder="Contoh: 35000000"
                  className="w-full text-xs font-bold px-3.5 py-2.5 bg-[#F8F7F4] border border-[#EAE8E3] rounded-xl focus:outline-none focus:border-gold-500 text-charcoal-900"
                />
                {Number(accForm.finalDp) > 0 && (
                  <p className="text-[11px] text-emerald-700 font-medium mt-1">
                    {formatRupiah(Number(accForm.finalDp))}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-charcoal-800 mb-1">
                  Bank / Leasing yang ACC <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={accForm.approvedLeasing}
                  onChange={(e) => setAccForm({ ...accForm, approvedLeasing: e.target.value })}
                  placeholder="BCA Finance / OTO Multiartha / Adira..."
                  className="w-full text-xs px-3.5 py-2.5 bg-[#F8F7F4] border border-[#EAE8E3] rounded-xl focus:outline-none focus:border-gold-500 text-charcoal-900 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-charcoal-800 mb-1">
                  Catatan Persetujuan (Opsional)
                </label>
                <textarea
                  rows={2}
                  value={accForm.approvalNotes}
                  onChange={(e) => setAccForm({ ...accForm, approvalNotes: e.target.value })}
                  placeholder="Contoh: PO terbit, tenor 48 bulan, asuransi all-risk tahun pertama."
                  className="w-full text-xs px-3.5 py-2.5 bg-[#F8F7F4] border border-[#EAE8E3] rounded-xl focus:outline-none focus:border-gold-500 text-charcoal-900 font-medium"
                />
              </div>

              <div className="p-3 bg-emerald-50/80 border border-emerald-300 rounded-xl text-[11px] text-emerald-950 flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                <div>
                  <strong className="block font-bold">Hasil Eksekusi ACC:</strong>
                  Unit mobil resmi berstatus <strong>SOLD OUT</strong>, masuk ke Laporan Penjualan Kredit, dan konsumen otomatis terjadwal dalam <strong>Customer Follow Up CRM</strong>.
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-[#EAE8E3]">
                <button
                  type="button"
                  onClick={() => setIsAccModalOpen(false)}
                  className="btn-outline-warm"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all"
                >
                  <Check className="w-4 h-4" />
                  <span>Konfirmasi ACC & Proses Penjualan</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: TOMBOL DITOLAK (PENOLAKAN KREDIT) */}
      {isRejectModalOpen && selectedCreditApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-charcoal-950/40 backdrop-blur-xs animate-in fade-in duration-200 overflow-y-auto">
          <div className="crm-card w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden shadow-luxury border-rose-500/40 my-auto">
            <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 sm:py-4 bg-[#FAF9F5] border-b border-rose-500/30 text-charcoal-900 shrink-0 relative">
              <div className="absolute top-0 left-0 right-0 h-[2.5px] bg-gradient-to-r from-rose-500 via-rose-400 to-rose-600" />
              <div>
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-900 border border-rose-300 mb-1">
                  <XCircle className="w-3 h-3 text-rose-700" /> Konfirmasi Penolakan Pengajuan
                </span>
                <h2 className="text-base font-black text-charcoal-900 tracking-tight">
                  Tolak Pengajuan Kredit
                </h2>
                <p className="text-xs text-charcoal-500">
                  Unit mobil akan otomatis dikembalikan ke status TERSEDIA (READY) di showroom
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsRejectModalOpen(false)}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-charcoal-400 hover:text-charcoal-900 hover:bg-[#F0EDE6] transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="mx-4 sm:mx-6 mt-3 sm:mt-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-medium">
                {formError}
              </div>
            )}

            <form onSubmit={handleSubmitReject} className="p-4 sm:p-6 space-y-4 overflow-y-auto">
              <div className="p-3.5 bg-[#FAF9F5] border border-[#EAE8E3] rounded-xl text-xs space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-charcoal-500">Pemohon:</span>
                  <span className="font-bold text-charcoal-900">{selectedCreditApp.customerName} ({selectedCreditApp.customerPhone})</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-charcoal-500">Unit Kendaraan:</span>
                  <span className="font-bold text-charcoal-900">{selectedCreditApp.vehicleName}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-charcoal-500">Leasing Tujuan:</span>
                  <span className="font-bold text-charcoal-900">{selectedCreditApp.targetLeasing}</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-charcoal-800 mb-1">
                  Alasan Penolakan <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={3}
                  required
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="Contoh: Ditolak oleh analis bank/leasing karena riwayat BI Checking SLIK Kol 4 / Kapasitas angsuran tidak mencukupi."
                  className="w-full text-xs px-3.5 py-2.5 bg-[#F8F7F4] border border-[#EAE8E3] rounded-xl focus:outline-none focus:border-rose-500 text-charcoal-900 font-medium"
                />
              </div>

              <div className="p-3 bg-rose-50/80 border border-rose-300 rounded-xl text-[11px] text-rose-950 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-700 shrink-0 mt-0.5" />
                <div>
                  <strong className="block font-bold">Penting: Pemulihan Stok Unit:</strong>
                  Setelah dikonfirmasi ditolak, unit mobil <strong>{selectedCreditApp.vehicleName}</strong> akan langsung dibebaskan dari status BOKING dan kembali menjadi <strong>TERSEDIA (READY)</strong> di stok showroom untuk calon pembeli lain. Konsumen ini <strong>tidak</strong> akan dimasukkan ke follow up pembeli.
                </div>
              </div>

              <div className="flex flex-col-reverse sm:flex-row justify-end gap-2.5 sm:gap-3 pt-3 border-t border-[#EAE8E3]">
                <button
                  type="button"
                  onClick={() => setIsRejectModalOpen(false)}
                  className="btn-outline-warm w-full sm:w-auto"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition-all"
                >
                  <X className="w-4 h-4" />
                  <span>Konfirmasi Tolak Pengajuan</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 5: RIWAYAT AUDIT PENGAJUAN KREDIT */}
      {isHistoryModalOpen && selectedCreditApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-charcoal-950/40 backdrop-blur-xs animate-in fade-in duration-200 overflow-y-auto">
          <div className="crm-card w-full max-w-xl max-h-[90vh] flex flex-col overflow-hidden shadow-luxury border-[#EAE8E3] my-auto">
            <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 sm:py-4 bg-[#FAF9F5] border-b border-[#EAE8E3] text-charcoal-900 shrink-0 relative">
              <div className="absolute top-0 left-0 right-0 h-[2.5px] bg-gradient-to-r from-gold-500 via-gold-400 to-gold-600" />
              <div>
                <span className="badge-gold text-[10px] mb-1 inline-block">Audit Trail & Timeline</span>
                <h2 className="text-base font-black text-charcoal-900 tracking-tight">
                  Riwayat Pengajuan: {selectedCreditApp.customerName}
                </h2>
                <p className="text-xs text-charcoal-500">
                  ID: {selectedCreditApp.id} • Unit: {selectedCreditApp.vehicleName}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsHistoryModalOpen(false)}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-charcoal-400 hover:text-charcoal-900 hover:bg-[#F0EDE6] transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
              <div className="p-3.5 bg-[#FAF9F5] border border-[#EAE8E3] rounded-xl text-xs grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <span className="text-charcoal-400 block text-[10px] uppercase font-bold">Harga Deal</span>
                  <span className="font-bold text-charcoal-900">{formatRupiah(selectedCreditApp.dealPrice)}</span>
                </div>
                <div>
                  <span className="text-charcoal-400 block text-[10px] uppercase font-bold">Status Saat Ini</span>
                  <span className="font-bold text-charcoal-900">{selectedCreditApp.status}</span>
                </div>
                <div>
                  <span className="text-charcoal-400 block text-[10px] uppercase font-bold">Leasing Tujuan</span>
                  <span className="font-bold text-charcoal-900">{selectedCreditApp.targetLeasing}</span>
                </div>
                <div>
                  <span className="text-charcoal-400 block text-[10px] uppercase font-bold">Leasing ACC</span>
                  <span className="font-bold text-charcoal-900">{selectedCreditApp.approvedLeasing || '-'}</span>
                </div>
              </div>

              <div>
                <h4 className="text-xs font-bold text-charcoal-900 mb-3 flex items-center gap-1.5">
                  <History className="w-4 h-4 text-gold-600" />
                  <span>Timeline Perubahan Status</span>
                </h4>

                <div className="space-y-3 relative before:absolute before:inset-0 before:left-3.5 before:w-0.5 before:bg-[#EAE8E3]">
                  {(selectedCreditApp.history || []).map((h, idx) => (
                    <div key={idx} className="relative flex items-start gap-3 pl-1">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 z-10 text-[10px] font-bold ${
                        h.status === 'PENDING'
                          ? 'bg-amber-100 text-amber-900 border border-amber-400'
                          : h.status === 'APPROVED'
                          ? 'bg-emerald-100 text-emerald-900 border border-emerald-400'
                          : 'bg-rose-100 text-rose-900 border border-rose-400'
                      }`}>
                        {idx + 1}
                      </div>
                      <div className="flex-1 bg-[#FAF9F5] p-3 rounded-xl border border-[#EAE8E3] text-xs">
                        <div className="flex items-center justify-between">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            h.status === 'PENDING'
                              ? 'bg-amber-100 text-amber-900'
                              : h.status === 'APPROVED'
                              ? 'bg-emerald-100 text-emerald-900'
                              : 'bg-rose-100 text-rose-900'
                          }`}>
                            {h.status}
                          </span>
                          <span className="text-[10px] text-charcoal-400">
                            {formatDate(h.timestamp)}
                          </span>
                        </div>
                        <p className="text-charcoal-800 font-medium mt-1.5 leading-relaxed">{h.notes}</p>
                        {h.dpAmount && (
                          <p className="text-[11px] text-gold-700 font-bold mt-1">
                            DP: {formatRupiah(h.dpAmount)}
                          </p>
                        )}
                        {h.leasingPartner && (
                          <p className="text-[10px] text-charcoal-500">
                            Leasing: {h.leasingPartner}
                          </p>
                        )}
                        {h.rejectionReason && (
                          <p className="text-[11px] text-rose-600 font-medium mt-1">
                            Alasan: {h.rejectionReason}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="px-4 sm:px-6 py-3 bg-[#FAF9F5] border-t border-[#EAE8E3] flex justify-end">
              <button
                type="button"
                onClick={() => setIsHistoryModalOpen(false)}
                className="btn-outline-warm w-full sm:w-auto text-xs font-bold py-2.5 px-5 cursor-pointer"
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
