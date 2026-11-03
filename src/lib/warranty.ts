import { RepairPartCategory } from '@/types/crm';

export const REPAIR_CATEGORIES: RepairPartCategory[] = [
  'Mesin',
  'Kelistrikan & AC',
  'Kaki-kaki & Suspensi',
  'Sistem Rem',
  'Transmisi',
  'Bodi & Cat',
  'Lainnya',
];

export const RECOMMENDED_WORKSHOPS = [
  'Bengkel Garut Motor Mandiri (Rujukan HR MOTOR)',
  'Bengkel Resmi HR MOTOR Garut - Samarang',
  'Bengkel Garut Otomotif Sentra (Rujukan HR MOTOR)',
  'Bengkel Mandiri Motor Samarang (Rujukan HR MOTOR)',
  'Bengkel Mitra Bodi Otomotif Garut (Rujukan HR MOTOR)',
];

export interface WarrantyStatusResult {
  isWithinWarranty: boolean;
  statusLabel: 'Dalam Garansi (Gratis)' | 'Di Luar Garansi';
  badgeLabel: string;
  daysDiff: number;
  daysRemaining: number;
  expiryDateStr: string;
  notes: string;
}

// Helper to parse Indonesian currency string or number to integer safely
export function parseRupiahInput(value: string | number | undefined | null): number {
  if (value === undefined || value === null) return 0;
  if (typeof value === 'number') return isNaN(value) ? 0 : Math.max(0, Math.round(value));
  let str = String(value).trim().replace(/,\d{2}$/, '');
  const digitsOnly = str.replace(/[^0-9]/g, '');
  const parsed = parseInt(digitsOnly, 10);
  return isNaN(parsed) ? 0 : Math.max(0, parsed);
}

// Helper to check 30-day warranty status based on purchaseDate and claimDate
export function checkWarrantyStatus(purchaseDateStr?: string, repairDateStr?: string): WarrantyStatusResult {
  if (!purchaseDateStr) {
    return {
      isWithinWarranty: false,
      statusLabel: 'Di Luar Garansi',
      badgeLabel: 'Di Luar Garansi',
      daysDiff: 0,
      daysRemaining: 0,
      expiryDateStr: '-',
      notes: 'Tanggal pembelian belum tercatat',
    };
  }

  const pStr = purchaseDateStr.slice(0, 10);
  const rStr = (repairDateStr ? repairDateStr : new Date().toISOString()).slice(0, 10);

  const pDate = new Date(pStr + 'T00:00:00');
  const rDate = new Date(rStr + 'T00:00:00');

  // Exactly 30 calendar days warranty (< 1 Bulan)
  const expiryDate = new Date(pDate);
  expiryDate.setDate(expiryDate.getDate() + 30);

  const diffTime = rDate.getTime() - pDate.getTime();
  const daysDiff = Math.round(diffTime / (1000 * 60 * 60 * 24));
  const isWithin = daysDiff >= 0 && daysDiff <= 30;

  const y = expiryDate.getFullYear();
  const m = String(expiryDate.getMonth() + 1).padStart(2, '0');
  const d = String(expiryDate.getDate()).padStart(2, '0');
  const expiryDateFormatted = `${y}-${m}-${d}`;
  const daysRemaining = isWithin ? Math.max(0, 30 - daysDiff) : 0;

  return {
    isWithinWarranty: isWithin,
    statusLabel: isWithin ? 'Dalam Garansi (Gratis)' : 'Di Luar Garansi',
    badgeLabel: isWithin ? 'Gratis < 1 Bulan' : 'Di Luar Garansi',
    daysDiff,
    daysRemaining,
    expiryDateStr: expiryDateFormatted,
    notes: isWithin
      ? `Hari ke-${daysDiff} dari 30 hari (Sisa ${daysRemaining} hari garansi gratis showroom ke bengkel rujukan HR MOTOR)`
      : daysDiff < 0
        ? 'Tanggal perbaikan mendahului tanggal pembelian unit'
        : `Melewati masa garansi 30 hari (+ ${daysDiff - 30} hari)`,
  };
}

export interface FleetHealthResult {
  healthPercentage: string;
  grade: 'Grade A+ (Sangat Prima)' | 'Grade A (Prima & Terkontrol)' | 'Grade B (Standar Baik)' | 'Perlu Evaluasi QC';
  badgeColor: string;
  textColor: string;
  description: string;
}

// Helper to calculate showroom fleet health card metrics based on warranty claim ratio
export function calculateFleetHealth(claimRatio: number | string): FleetHealthResult {
  const ratio = typeof claimRatio === 'string' ? parseFloat(claimRatio) || 0 : (isNaN(claimRatio) ? 0 : claimRatio);
  const health = Math.max(0, Math.min(100, 100 - ratio));
  const healthFormatted = health.toFixed(1);

  if (health >= 90) {
    return {
      healthPercentage: healthFormatted,
      grade: 'Grade A+ (Sangat Prima)',
      badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
      textColor: 'text-emerald-400',
      description: 'Kondisi armada showroom sangat prima, minim kendala garansi pasca penjualan (< 10% klaim).',
    };
  } else if (health >= 80) {
    return {
      healthPercentage: healthFormatted,
      grade: 'Grade A (Prima & Terkontrol)',
      badgeColor: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
      textColor: 'text-blue-400',
      description: 'Kondisi armada showroom dalam batas toleransi sehat dan terkontrol dengan baik (10-20% klaim).',
    };
  } else if (health >= 70) {
    return {
      healthPercentage: healthFormatted,
      grade: 'Grade B (Standar Baik)',
      badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
      textColor: 'text-amber-400',
      description: 'Kondisi armada standar showroom, perhatikan komponen perbaikan yang sering berulang.',
    };
  } else {
    return {
      healthPercentage: healthFormatted,
      grade: 'Perlu Evaluasi QC',
      badgeColor: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
      textColor: 'text-rose-400',
      description: 'Frekuensi klaim tinggi (> 30%), disarankan audit inspeksi pra-jual unit kendaraan masuk.',
    };
  }
}

