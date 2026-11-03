export type UserRole =
  | 'Owner'
  | 'CRM Administrator'
  | 'Sales Representative'
  | 'WhatsApp Administrator'
  | 'Marketing';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  phone: string;
  avatar?: string;
  password?: string;
  isApproved: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export type LeadSourceType =
  | 'Facebook'
  | 'Instagram'
  | 'TikTok'
  | 'WhatsApp'
  | 'Walk-in'
  | 'Referral'
  | 'Other';

export type CorePipelineStage = 'Hanya Menanyakan' | 'Negosiasi' | 'Cek Unit';

export type PipelineStage =
  | 'Hanya Menanyakan'
  | 'Negosiasi'
  | 'Cek Unit'
  | 'Menanyakan Unit'
  | 'Tertarik'
  | 'Deal'
  | 'Lost';

export const CORE_PIPELINE_STAGES: CorePipelineStage[] = [
  'Hanya Menanyakan',
  'Negosiasi',
  'Cek Unit',
];

export const LEGACY_STAGE_MAPPING: Record<string, CorePipelineStage> = {
  'Hanya Menanyakan': 'Hanya Menanyakan',
  'Menanyakan Unit': 'Hanya Menanyakan',
  'Negosiasi': 'Negosiasi',
  'Tertarik': 'Negosiasi',
  'Cek Unit': 'Cek Unit',
  'Deal': 'Negosiasi',
  'Lost': 'Hanya Menanyakan',
};

export function getCorePipelineStage(stage?: string | null): CorePipelineStage {
  if (!stage) return 'Hanya Menanyakan';
  return LEGACY_STAGE_MAPPING[stage] || 'Hanya Menanyakan';
}

export function normalizePipelineStage(stage?: string | null): CorePipelineStage {
  return getCorePipelineStage(stage);
}

export type LostReasonType =
  | 'Harga tidak cocok'
  | 'Memilih unit lain'
  | 'Tidak jadi membeli'
  | 'Tidak mencapai kesepakatan'
  | 'Tidak dapat dihubungi'
  | 'Alasan lainnya';

export interface StageHistoryItem {
  stage: PipelineStage;
  timestamp: string;
  notes?: string;
  visitNotes?: string;
  negotiationOffer?: number;
  negotiationNotes?: string;
  lostReason?: string;
  dealDate?: string;
  dealValue?: number;
  updatedByName?: string;
}

export type VehicleCategory = 'MPV' | 'SUV' | 'City Car' | 'Sedan' | 'Hatchback' | 'Commercial';

export interface Customer {
  id: string; // e.g. CUST-2026-001
  fullName: string;
  whatsapp: string;
  email: string;
  address: string;
  district: string; // e.g. Tarogong Kidul, Garut
  source: LeadSourceType;
  interestedVehicle: string;
  vehicleType: VehicleCategory;
  budget: number; // in IDR
  assignedSalesId?: string;
  assignedSalesName?: string;
  notes: string;
  registeredDate: string;
  status: 'Aktif' | 'Prospek' | 'Sudah Beli' | 'Tidak Aktif';
  updatedAt: string;
  // Official Showroom Kwitansi / Receipt fields
  plateNumber?: string;
  receiptNumber?: string;
  receiptAmount?: number;
  receiptDate?: string;
  receiptReceiver?: string;
  receiptNotes?: string;
  // Transaction & Credit fields
  paymentType?: 'Cash' | 'Kredit';
  creditStatus?: 'PENDING' | 'APPROVED' | 'REJECTED';
  creditApplicationId?: string;
  leasingPartner?: string;
  downPayment?: number;
}

export interface Lead {
  id: string; // e.g. LEAD-2026-001
  customerName: string;
  contactNumber: string;
  customerPhone?: string;
  email?: string;
  leadSource: LeadSourceType;
  interestedVehicle: string;
  vehicleType?: VehicleCategory;
  estimatedBudget: number; // in IDR
  assignedSalesId: string;
  assignedSalesName?: string;
  status: PipelineStage;
  notes: string;
  lostReason?: string;
  lostReasonCategory?: LostReasonType;
  visitNotes?: string; // Catatan hasil kunjungan showroom pada tahap Cek Unit
  visitDate?: string;
  negotiationOffer?: number; // Harga penawaran konsumen pada tahap Negosiasi
  negotiationNotes?: string; // Hasil tawar-menawar
  dealValue?: number;
  dealVehicle?: string;
  dealDate?: string; // Tanggal transaksi berhasil
  customerId?: string; // linked customer ID if converted
  lastContactDate: string;
  dateReceived: string;
  stageHistory?: StageHistoryItem[]; // Riwayat perjalanan konsumen dari awal sampai akhir
  // Kebutuhan Unit yang Dicari Calon Pembeli (Matching System Stok Unit)
  searchBrand?: string;
  searchModel?: string;
  searchYearMin?: number;
  searchYearMax?: number;
  searchBudgetMin?: number;
  searchBudgetMax?: number;
  searchTransmission?: string;
  searchColor?: string;
  searchNotes?: string;
  createdAt: string;
  updatedAt: string;
}

export type FollowUpChannel = 'WhatsApp' | 'Telepon' | 'Kunjungan Dealer' | 'Kunjungan Rumah';
export type FollowUpCategory =
  | 'Pelanggan Lama (1 Tahun)'
  | 'Prospek Tidak Jadi (1 Bulan)'
  | 'Unit yang Dicari Sudah Tersedia';

export type FollowUpStatus =
  | 'Belum Dihubungi'
  | 'Sudah Dihubungi'
  | 'Menunggu Respons'
  | 'Berhasil Transaksi'
  | 'Tidak Berminat'
  | 'Terjadwal'
  | 'Selesai'
  | 'Terlambat'
  | 'Dibatalkan';

export type PriorityLevel = 'Tinggi' | 'Sedang' | 'Rendah';

export type CommunicationResultOutcome =
  | 'Tertarik Datang ke Showroom'
  | 'Minta Foto / Video Detail'
  | 'Menunggu Konfirmasi Keluarga'
  | 'Sedang Mempertimbangkan Unit Lain'
  | 'Sudah Beli di Tempat Lain'
  | 'Tidak Ada Respons'
  | 'Berhasil Transaksi / Deal'
  | 'Konsumen masih mencari mobil'
  | 'Konsumen tertarik dengan unit lain'
  | 'Konsumen ingin tukar tambah'
  | 'Konsumen ingin menjual mobilnya'
  | 'Konsumen belum berminat'
  | 'Konsumen sudah membeli dari tempat lain'
  | 'Konsumen berhasil melakukan transaksi di HR MOTOR';

export type FollowUpType = 'CUSTOMER' | 'PROSPECT';

export type ProspectFollowUpStatus =
  | 'Menunggu Mobil Ready'
  | 'Mobil Sudah Ready'
  | 'Sudah Dihubungi'
  | 'Tertarik'
  | 'Tidak Tertarik'
  | 'Sudah Deal'
  | 'Tidak Merespons';

export type CustomerFollowUpStatus =
  | 'Belum Dihubungi'
  | 'Sudah Dihubungi'
  | 'Tidak Merespons'
  | 'Selesai';

export interface FollowUpLogItem {
  id: string;
  timestamp: string;
  resultOutcome?: CommunicationResultOutcome | string;
  outcome?: CommunicationResultOutcome | string;
  notes: string;
  currentInterest?: string;
  interestedUnit?: string;
  nextFollowUpPlan?: string;
  nextFollowUpDate?: string;
  loggedByName?: string;
  salesName?: string;
}

export interface FollowUp {
  id: string; // e.g. FLW-2026-001
  followUpType?: FollowUpType; // 'CUSTOMER' (Pelanggan yang sudah beli) | 'PROSPECT' (Calon pelanggan mencari mobil)
  customerId?: string;
  customerName: string;
  customerPhone: string;
  customerAddress?: string;
  customerSource?: LeadSourceType;
  leadId?: string;
  vehicleStockId?: string; // Tautan ke stok unit jika cocok
  vehicleInfo: string; // Unit yang dibeli atau dicari
  category: FollowUpCategory;
  followUpReason: string; // Alasan follow-up
  scheduledDate: string; // YYYY-MM-DD
  scheduledTime?: string; // HH:mm
  channel?: FollowUpChannel;
  status: FollowUpStatus | ProspectFollowUpStatus | CustomerFollowUpStatus;
  priority: PriorityLevel;
  assignedSalesId?: string;
  assignedSalesName?: string;
  notes: string;
  resultNotes?: string;
  isUnitSold?: boolean; // Peringatan jika unit sudah terjual sebelum dihubungi
  communicationLogs?: FollowUpLogItem[];
  lastContactDate?: string;
  lastOutcome?: CommunicationResultOutcome | string;
  completedAt?: string;
  // Customer Follow Up fields
  paymentType?: 'Cash' | 'Kredit';
  purchaseDate?: string;
  leasingPartner?: string;
  periodicStep?: '1 Bulan' | '3 Bulan' | '6 Bulan' | '1 Tahun';
  // Prospect Follow Up fields
  searchBrand?: string;
  searchModel?: string;
  searchYear?: number;
  searchYearMin?: number;
  searchYearMax?: number;
  searchBudget?: number;
  firstInquiryDate?: string;
  prospectStatus?: ProspectFollowUpStatus;
  matchedStockId?: string;
  matchedStockInfo?: string;
  matchedStockPrice?: number;
  createdAt: string;
  updatedAt: string;
}

export type VehicleStockStatus = 'Tersedia' | 'Booking' | 'Terjual' | 'Tidak Aktif';
export type TransmissionType = 'Manual' | 'Otomatis' | 'CVT';
export type FuelType = 'Bensin' | 'Diesel' | 'Hybrid';

export interface VehicleStock {
  id: string; // e.g. STK-2026-001
  stockNumber?: number; // No. urut 1 - 32 dari spreadsheet showroom
  merkType?: string; // e.g. "DAIHATSU SIGRA 1.2 R FACELIFT M/T"
  brand: string;
  model: string;
  year: number;
  color: string;
  transmission: TransmissionType;
  fuelType?: FuelType;
  fuel: FuelType;
  mileageKm?: number;
  mileage: number;
  odometerDisplay?: string; // e.g. "26RB", "130RB"
  price: number; // in IDR
  entryDate: string; // YYYY-MM-DD
  images?: string[];
  photos: string[];
  description: string;
  status: VehicleStockStatus;
  plateNumber?: string;
  licensePlate?: string;
  // Simulasi Paket Kredit Showroom HR MOTOR (dari Google Sheet)
  creditDp?: number; // e.g. 15000000
  installment35x?: string; // e.g. "5.350 (35x)"
  installment47x?: string; // e.g. "4.335 (47x)"
  installment59x?: string; // e.g. "4.065 (59x)"
  leasingPartners?: string[]; // e.g. ["OTO", "MUF", "ADIRA"]
  readinessNotes?: string[]; // e.g. ["❌ FOTO", "❌ DETAILING", "SOLDOUT", "BOOKING"]
  engineNumber?: string;
  chassisNumber?: string;
  taxValidUntil?: string;
  soldDate?: string;
  soldToCustomerId?: string;
  soldToCustomerName?: string;
  // Booking info for credit application / showroom reservation
  bookingCustomerId?: string;
  bookingCustomerName?: string;
  bookingLeasing?: string;
  bookingDate?: string;
  bookingDp?: number;
  bookingApplicationId?: string;
  createdAt: string;
  updatedAt: string;
}

export type CreditStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface CreditApplicationHistory {
  status: CreditStatus;
  timestamp: string;
  adminName: string;
  notes?: string;
  dpAmount?: number;
  leasingPartner?: string;
  rejectionReason?: string;
}

export interface CreditApplication {
  id: string; // e.g. CRD-2026-001
  customerId?: string;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  customerSource: LeadSourceType;
  vehicleStockId: string;
  vehicleName: string;
  plateNumber?: string;
  targetLeasing: string; // Bank atau leasing tujuan pengajuan kredit
  approvedLeasing?: string; // Bank atau leasing yang memberikan persetujuan ACC
  dealPrice: number; // Harga deal
  initialDp: number; // DP awal pengajuan
  finalDp?: number; // DP final disetujui (saat ACC)
  status: CreditStatus; // PENDING, APPROVED, REJECTED
  applicationDate: string; // Tanggal pengajuan
  approvalDate?: string;
  rejectionDate?: string;
  rejectionReason?: string; // Alasan penolakan dari bank
  notes?: string; // Keterangan tambahan
  history: CreditApplicationHistory[];
  createdAt: string;
  updatedAt: string;
}

export interface CommunicationRecord {
  id: string; // e.g. COMM-2026-001
  customerId?: string;
  customerName: string;
  customerPhone: string;
  leadId?: string;
  channel: 'WhatsApp' | 'Telepon' | 'Walk-in' | 'Email';
  direction: 'Keluar' | 'Masuk';
  templateId?: string;
  messageContent: string;
  notes: string;
  loggedById: string;
  loggedByName: string;
  lastContactDate: string;
  nextContactDate?: string;
  createdAt: string;
}

export interface MessageTemplate {
  id: string;
  title: string;
  category: 'Sapaan' | 'Follow-up' | 'Cek Unit' | 'Test Drive' | 'Kredit & Dokumen' | 'Deal' | 'After Sales';
  content: string;
}

export interface CustomerPurchase {
  id: string; // e.g. DEAL-2026-001
  customerId: string;
  customerName: string;
  leadId?: string;
  vehicleBrand: string;
  vehicleModel: string;
  vehicleYear: number;
  vehicleName?: string;
  plateNumber: string; // e.g. Z 1452 DA
  color: string;
  mileageKm: number;
  purchasePrice: number; // in IDR
  paymentMethod: 'Cash Keras' | 'Cash Bertahap' | 'Kredit BCA Finance' | 'Kredit Mandiri Utama' | 'Kredit Adira Finance' | 'Kredit OTO Multiartha' | string;
  purchaseDate: string;
  warrantyUntil: string;
  salesId: string;
  salesName: string;
  notes: string;
  createdAt: string;
  receiptNumber?: string;
  receiptDate?: string;
  receiptReceiver?: string;
  // Transaction and credit linkage
  paymentType?: 'Cash' | 'Kredit';
  creditApplicationId?: string;
  leasingPartner?: string;
  downPayment?: number;
  vehicleStockId?: string;
}

export interface CustomerFeedback {
  id: string; // e.g. FDB-2026-001
  customerId: string;
  customerName: string;
  purchaseId?: string;
  vehicleInfo: string;
  rating: number; // 1 - 5
  npsScore: number; // 1 - 10
  category: 'Kepuasan Kendaraan' | 'Pelayanan Sales' | 'Kelengkapan Dokumen BPKB/STNK' | 'Kebersihan & Kesiapan Unit';
  comment: string;
  followUpRequired: boolean;
  createdAt: string;
}

export interface CustomerComplaint {
  id: string; // e.g. CMP-2026-001
  ticketNumber: string; // e.g. TIKET-GARUT-012
  customerId: string;
  customerName: string;
  customerPhone: string;
  purchaseId?: string;
  vehicleInfo?: string;
  title: string;
  description: string;
  category: 'Administrasi/Berkas BPKB-STNK' | 'Mesin & Transmisi' | 'Kelistrikan & AC' | 'Aksesoris & Kunci Cadangan' | 'Pelayanan Sales';
  priority: 'Rendah' | 'Sedang' | 'Tinggi' | 'Darurat';
  status: 'Baru' | 'Dalam Penanganan' | 'Menunggu Sparepart/Unit' | 'Selesai';
  assignedToId: string;
  assignedToName: string;
  resolutionNotes?: string;
  resolvedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ReferralRecord {
  id: string;
  referrerCustomerId: string;
  referrerCustomerName: string;
  referredName: string;
  referredPhone: string;
  interestedVehicle: string;
  status: 'Prospek Baru' | 'Dalam Negosiasi' | 'Deal (Reward Cair)' | 'Batal';
  rewardAmount: number; // e.g. Rp 1.500.000
  rewardStatus: 'Menunggu Transaksi' | 'Siap Diberikan' | 'Sudah Ditransfer';
  notes: string;
  createdAt: string;
}

export interface NotificationItem {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'lead' | 'followup' | 'deal' | 'complaint' | 'approval' | 'system';
  isRead: boolean;
  link?: string;
  createdAt: string;
}

export interface ActivityLog {
  id: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  action: string;
  entityType: 'Pelanggan' | 'Prospek' | 'Follow-up' | 'Komunikasi' | 'Deal' | 'Komplain' | 'User' | 'Stok Unit';
  entityId: string;
  details: string;
  createdAt: string;
}

export interface DashboardMetrics {
  totalCustomers: number;
  newCustomersThisMonth: number;
  totalLeads: number;
  activeLeads: number;
  followUpsToday: number;
  followUpsOverdue: number;
  totalDeals: number;
  totalLeadsLost: number;
  conversionRate: number; // in %
  totalDealValue: number; // in IDR
}

export type RepairClaimType = 'Garansi' | 'Garansi Khusus';
export type RepairStatus = 'Menunggu' | 'Dalam Proses' | 'Selesai' | 'Dibatalkan';
export type RepairPartCategory =
  | 'Mesin'
  | 'Transmisi'
  | 'Kaki-kaki & Suspensi'
  | 'Kelistrikan & AC'
  | 'Sistem Rem'
  | 'Bodi & Cat'
  | 'Lainnya';

export interface RepairClaim {
  id: string; // e.g. RPR-2026-001
  claimNumber?: string;
  customerId?: string;
  customerName: string;
  customerPhone: string;
  vehicleBrand: string;
  vehicleModel: string;
  vehicleYear: number;
  purchaseDate?: string;
  claimDate: string; // YYYY-MM-DD
  claimType: RepairClaimType; // Selalu Garansi Resmi Showroom HR MOTOR
  complaint?: string;
  complaintOrDamage?: string; // Keluhan atau kerusakan mobil
  partsToRepair?: string;
  damagedParts?: string; // Bagian mobil yang perlu diperbaiki
  damageCategory: RepairPartCategory;
  repairActionDescription?: string;
  actionTaken?: string; // Deskripsi tindakan perbaikan
  sparepartCost: number; // Biaya sparepart
  serviceCost: number; // Biaya jasa perbaikan
  totalCost: number; // sparepartCost + serviceCost
  status: RepairStatus; // Menunggu, Dalam Proses, Selesai, Dibatalkan
  notes?: string;
  completedDate?: string;
  resolvedAt?: string;
  createdAt: string;
  updatedAt: string;
}
