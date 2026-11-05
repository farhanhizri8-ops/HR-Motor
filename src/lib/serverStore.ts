import fs from 'fs';
import path from 'path';
import {
  User,
  Customer,
  Lead,
  FollowUp,
  CommunicationRecord,
  CustomerPurchase,
  CustomerFeedback,
  CustomerComplaint,
  ReferralRecord,
  NotificationItem,
  ActivityLog,
  RepairClaim,
  VehicleStock,
  CreditApplication,
  normalizePipelineStage,
} from '@/types/crm';
import {
  INITIAL_USERS,
  INITIAL_CUSTOMERS,
  INITIAL_LEADS,
  INITIAL_FOLLOW_UPS,
  INITIAL_COMMUNICATIONS,
  INITIAL_PURCHASES,
  INITIAL_FEEDBACK,
  INITIAL_COMPLAINTS,
  INITIAL_REFERRALS,
  INITIAL_NOTIFICATIONS,
  INITIAL_ACTIVITY_LOGS,
  INITIAL_REPAIR_CLAIMS,
  INITIAL_STOCKS,
  MESSAGE_TEMPLATES,
  INITIAL_CREDIT_APPLICATIONS,
} from './seedData';
import { getServerSupabase, isSupabaseConfigured } from './supabase';

export { INITIAL_CREDIT_APPLICATIONS };

export interface CrmDatabase {
  users: User[];
  customers: Customer[];
  leads: Lead[];
  followUps: FollowUp[];
  communications: CommunicationRecord[];
  purchases: CustomerPurchase[];
  feedback: CustomerFeedback[];
  complaints: CustomerComplaint[];
  referrals: ReferralRecord[];
  repairClaims: RepairClaim[];
  stocks: VehicleStock[];
  notifications: NotificationItem[];
  activityLogs: ActivityLog[];
  templates: typeof MESSAGE_TEMPLATES;
  creditApplications?: CreditApplication[];
  lastUpdated: string;
}

const DATA_DIR = path.join(process.cwd(), 'data');
const DATA_FILE = path.join(DATA_DIR, 'crm_store.json');

export function getInitialDatabase(): CrmDatabase {
  return JSON.parse(JSON.stringify({
    users: INITIAL_USERS,
    customers: INITIAL_CUSTOMERS,
    leads: INITIAL_LEADS,
    followUps: INITIAL_FOLLOW_UPS,
    communications: INITIAL_COMMUNICATIONS,
    purchases: INITIAL_PURCHASES,
    feedback: INITIAL_FEEDBACK,
    complaints: INITIAL_COMPLAINTS,
    referrals: INITIAL_REFERRALS,
    repairClaims: INITIAL_REPAIR_CLAIMS,
    stocks: INITIAL_STOCKS,
    notifications: INITIAL_NOTIFICATIONS,
    activityLogs: INITIAL_ACTIVITY_LOGS,
    templates: MESSAGE_TEMPLATES,
    creditApplications: INITIAL_CREDIT_APPLICATIONS,
    lastUpdated: new Date().toISOString(),
  }));
}

export function readDatabase(): CrmDatabase {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      try {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      } catch (e) {
        // May fail on read-only serverless filesystem
      }
    }
    if (!fs.existsSync(DATA_FILE)) {
      const initial = getInitialDatabase();
      try {
        fs.writeFileSync(DATA_FILE, JSON.stringify(initial, null, 2), 'utf-8');
      } catch (e) {
        // In serverless without write access, return in-memory
      }
      return initial;
    }
    const content = fs.readFileSync(DATA_FILE, 'utf-8');
    const parsed = JSON.parse(content) as CrmDatabase;

    // Ensure repairClaims is present
    if (!parsed.repairClaims || !Array.isArray(parsed.repairClaims)) {
      parsed.repairClaims = JSON.parse(JSON.stringify(INITIAL_REPAIR_CLAIMS));
    }

    // Ensure stocks is present
    if (!parsed.stocks || !Array.isArray(parsed.stocks) || parsed.stocks.length === 0) {
      parsed.stocks = JSON.parse(JSON.stringify(INITIAL_STOCKS));
    }

    // Ensure followUps is present
    if (!parsed.followUps || !Array.isArray(parsed.followUps) || parsed.followUps.length === 0) {
      parsed.followUps = INITIAL_FOLLOW_UPS;
    }

    repairDatabaseFollowUps(parsed);
    repairDatabaseUsers(parsed);
    repairDatabaseRepairClaims(parsed);
    repairDatabaseStocks(parsed);
    repairDatabaseCustomers(parsed);
    repairDatabasePurchases(parsed);
    repairDatabaseCreditApplications(parsed);
    const leadsRepaired = repairDatabaseLeads(parsed);
    if (leadsRepaired) {
      try {
        fs.writeFileSync(DATA_FILE, JSON.stringify(parsed, null, 2), 'utf-8');
      } catch (e) {}
    }

    return parsed;
  } catch (error) {
    console.error('Error reading CRM store file, using in-memory defaults:', error);
    return getInitialDatabase();
  }
}

export function repairDatabaseUsers(db: CrmDatabase): boolean {
  if (!db || !Array.isArray(db.users)) return false;
  let modified = false;

  // Ensure every user has a password fallback
  db.users.forEach((u) => {
    if (!u.password) {
      u.password = 'Garut2005';
      modified = true;
    }
  });

  // Ensure Farhan Hizri is registered as Owner
  const owner = db.users.find(
    (u) =>
      u.email.toLowerCase() === 'farhanhizri8@gmail.com' ||
      u.email.toLowerCase() === 'farhanhizri8gmail.com' ||
      u.role === 'Owner'
  );

  if (owner) {
    if (
      owner.name !== 'Farhan Hizri' ||
      owner.email !== 'farhanhizri8@gmail.com' ||
      owner.password !== 'Garut2005' ||
      owner.role !== 'Owner' ||
      !owner.isApproved
    ) {
      owner.name = 'Farhan Hizri';
      owner.email = 'farhanhizri8@gmail.com';
      owner.password = 'Garut2005';
      owner.role = 'Owner';
      owner.isApproved = true;
      owner.isActive = true;
      modified = true;
    }
  } else {
    db.users.unshift({
      id: 'USR-001',
      name: 'Farhan Hizri',
      email: 'farhanhizri8@gmail.com',
      password: 'Garut2005',
      role: 'Owner',
      phone: '081223450001',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=FarhanOwner&backgroundColor=ffdfbf',
      isApproved: true,
      isActive: true,
      createdAt: '2026-01-01T08:00:00Z',
      updatedAt: new Date().toISOString(),
    });
    modified = true;
  }

  return modified;
}

export function repairDatabaseRepairClaims(db: CrmDatabase): boolean {
  let modified = false;
  if (!db || !Array.isArray(db.repairClaims)) {
    db.repairClaims = JSON.parse(JSON.stringify(INITIAL_REPAIR_CLAIMS));
    return true;
  }
  db.repairClaims.forEach((r, idx) => {
    if ((r.claimType as string) === 'Non-Garansi' || !r.claimType) {
      r.claimType = 'Garansi';
      modified = true;
    }
    if (!r.claimNumber) {
      r.claimNumber = `GRS-2026-${String(idx + 1).padStart(3, '0')}`;
      modified = true;
    }
    if (!r.status) {
      r.status = 'Selesai';
      modified = true;
    }
    if (!r.workshop) {
      r.workshop = 'Bengkel Garut Motor Mandiri (Rujukan HR MOTOR)';
      modified = true;
    }
    if (!r.partsToRepair && r.damagedParts) {
      r.partsToRepair = r.damagedParts;
      modified = true;
    }
    if (!r.damagedParts && r.partsToRepair) {
      r.damagedParts = r.partsToRepair;
      modified = true;
    }
    if (!r.complaintOrDamage && r.complaint) {
      r.complaintOrDamage = r.complaint;
      modified = true;
    }
    if (!r.complaint && r.complaintOrDamage) {
      r.complaint = r.complaintOrDamage;
      modified = true;
    }
    if (!r.repairActionDescription && r.actionTaken) {
      r.repairActionDescription = r.actionTaken;
      modified = true;
    }
    if (!r.actionTaken && r.repairActionDescription) {
      r.actionTaken = r.repairActionDescription;
      modified = true;
    }
  });
  return modified;
}

export function detectPlateRegion(plate?: string): string {
  if (!plate) return 'Garut';
  const clean = plate.trim().toUpperCase();
  if (clean.startsWith('D ') || clean.startsWith('D')) return 'Bandung';
  if (clean.startsWith('B ') || clean.startsWith('B')) return 'Jakarta';
  if (clean.startsWith('F ') || clean.startsWith('F')) return 'Bogor';
  if (clean.startsWith('E ') || clean.startsWith('E')) return 'Cirebon';
  if (clean.startsWith('T ') || clean.startsWith('T')) return 'Karawang';
  if (clean.startsWith('A ') || clean.startsWith('A')) return 'Banten';
  if (clean.startsWith('Z')) {
    const parts = clean.split(/\s+/);
    const suffix = parts.length >= 3 ? parts[2] : (parts.length === 2 ? parts[1].replace(/^[0-9]+/, '') : '');
    if (/^[HIJKLMN]/i.test(suffix)) return 'Tasikmalaya';
    if (/^[ABC]/i.test(suffix)) return 'Sumedang';
    if (/^[TUVW]/i.test(suffix)) return 'Ciamis';
    return 'Garut';
  }
  return 'Garut';
}

export function repairDatabaseStocks(db: CrmDatabase): boolean {
  let modified = false;
  if (!db || !Array.isArray(db.stocks) || db.stocks.length === 0) {
    db.stocks = JSON.parse(JSON.stringify(INITIAL_STOCKS));
    return true;
  }
  db.stocks.forEach((s, idx) => {
    if (s.stockNumber === undefined || s.stockNumber === null) {
      s.stockNumber = idx + 1;
      modified = true;
    }
    if (!s.plateRegion) {
      s.plateRegion = detectPlateRegion(s.licensePlate || s.plateNumber);
      modified = true;
    }
    if (s.id === 'STK-2026-022' && s.status === 'Booking' && !s.bookingCustomerName) {
      s.bookingCustomerName = 'Ahmad Fauzi';
      s.bookingLeasing = 'BCA Finance';
      s.bookingDp = 45000000;
      s.bookingDate = '2026-11-01';
      s.bookingApplicationId = 'CRD-2026-001';
      modified = true;
    }
  });
  return modified;
}

export function repairDatabaseCreditApplications(db: CrmDatabase): boolean {
  if (!db || !Array.isArray(db.creditApplications) || db.creditApplications.length === 0) {
    db.creditApplications = JSON.parse(JSON.stringify(INITIAL_CREDIT_APPLICATIONS));
    return true;
  }
  return false;
}

export function repairDatabaseLeads(db: CrmDatabase): boolean {
  if (!db || !Array.isArray(db.leads)) return false;
  let modified = false;

  db.leads.forEach((lead) => {
    // Synchronize contactNumber and customerPhone
    const phone = lead.contactNumber || lead.customerPhone || '';
    if (lead.contactNumber !== phone) {
      lead.contactNumber = phone;
      modified = true;
    }
    if (lead.customerPhone !== phone) {
      lead.customerPhone = phone;
      modified = true;
    }

    // Default leadSource to WhatsApp
    if (!lead.leadSource) {
      lead.leadSource = 'WhatsApp';
      modified = true;
    }

    // Backwards compatibility mapping for legacy stages to 3 core stages
    const normalized = normalizePipelineStage(lead.status);
    if (lead.status !== normalized) {
      lead.status = normalized;
      modified = true;
    }

    // Ensure dateReceived is present
    if (!lead.dateReceived) {
      lead.dateReceived = (lead.createdAt ? lead.createdAt.split('T')[0] : '') || new Date().toISOString().split('T')[0];
      modified = true;
    }

    // Ensure stageHistory has at least the current status and items are normalized
    if (!lead.stageHistory || !Array.isArray(lead.stageHistory) || lead.stageHistory.length === 0) {
      lead.stageHistory = [
        {
          stage: lead.status,
          timestamp: lead.createdAt || new Date().toISOString(),
          notes: lead.notes || 'Riwayat awal calon konsumen tercatat di sistem',
          updatedByName: lead.assignedSalesName || 'Admin HR MOTOR',
        },
      ];
      modified = true;
    } else {
      lead.stageHistory.forEach((item) => {
        const itemNorm = normalizePipelineStage(item.stage);
        if (item.stage !== itemNorm) {
          item.stage = itemNorm;
          modified = true;
        }
      });
    }
  });

  return modified;
}

export function repairDatabaseFollowUps(db: CrmDatabase): boolean {
  if (!db || !Array.isArray(db.followUps)) return false;
  let modified = false;
  db.followUps.forEach((f) => {
    if (!f.customerPhone) {
      const lead = (db.leads || []).find((l) => l.id === f.leadId);
      const cust = (db.customers || []).find((c) => c.id === f.customerId || (lead && c.id === lead.customerId));
      const phone = (lead && (lead.contactNumber || lead.customerPhone)) || (cust && cust.whatsapp) || '';
      if (phone) {
        f.customerPhone = phone;
        modified = true;
      }
    }
    if (!f.followUpType) {
      if (f.category === 'Pelanggan Lama (1 Tahun)') {
        f.followUpType = 'CUSTOMER';
        f.paymentType = f.paymentType || 'Cash';
      } else {
        f.followUpType = 'PROSPECT';
        f.prospectStatus = f.prospectStatus || (f.status as any) || 'Menunggu Mobil Ready';
      }
      modified = true;
    }
  });
  return modified;
}

const OLD_DEMO_NAMES = new Set([
  'Wildan Fitriadi',
  'Dr. Hj. Nina Marlina',
  'Neng Tian',
  'Baoa',
  'Udin',
  'Agus Gunawan',
  'H. Dadan Wildan',
  'Wawan Hermawan',
  'Siska Oktaviani, S.Pd.',
  'Tatang Hendrawan',
  'Yudi Karyadi',
]);

export function repairDatabaseCustomers(db: CrmDatabase): boolean {
  if (!db || !Array.isArray(db.customers)) {
    db.customers = INITIAL_CUSTOMERS;
    return true;
  }
  const hasOldTrash = db.customers.some((c) => OLD_DEMO_NAMES.has(c.fullName));
  if (hasOldTrash || db.customers.length < 60) {
    const filtered = db.customers.filter((c) => !OLD_DEMO_NAMES.has(c.fullName));
    const map = new Map<string, Customer>();
    INITIAL_CUSTOMERS.forEach((c) => map.set(c.id, c));
    filtered.forEach((c) => map.set(c.id, c));
    db.customers = Array.from(map.values());
    return true;
  }
  return false;
}

export function repairDatabasePurchases(db: CrmDatabase): boolean {
  if (!db || !Array.isArray(db.purchases)) {
    db.purchases = INITIAL_PURCHASES;
    return true;
  }
  const hasOldTrash = db.purchases.some((p) => OLD_DEMO_NAMES.has(p.customerName));
  if (hasOldTrash || db.purchases.length < 60) {
    const filtered = db.purchases.filter((p) => !OLD_DEMO_NAMES.has(p.customerName));
    const map = new Map<string, CustomerPurchase>();
    INITIAL_PURCHASES.forEach((p) => map.set(p.id, p));
    filtered.forEach((p) => map.set(p.id, p));
    db.purchases = Array.from(map.values());
    return true;
  }
  return false;
}

export function writeDatabase(data: CrmDatabase): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    data.lastUpdated = new Date().toISOString();
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (error) {
    console.warn('Note: Could not write local file (normal in read-only serverless host):', error);
  }
}

/**
 * Async database reader with Supabase cloud persistence support
 */
export async function readDatabaseAsync(): Promise<CrmDatabase> {
  const supabase = getServerSupabase();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('crm_snapshots')
        .select('data')
        .eq('id', 'latest')
        .maybeSingle();

      if (!error && data && data.data) {
        const cloudDb = data.data as CrmDatabase;
        const followUpsRepaired = repairDatabaseFollowUps(cloudDb);
        const usersRepaired = repairDatabaseUsers(cloudDb);
        const stocksRepaired = repairDatabaseStocks(cloudDb);
        const customersRepaired = repairDatabaseCustomers(cloudDb);
        const purchasesRepaired = repairDatabasePurchases(cloudDb);
        const creditsRepaired = repairDatabaseCreditApplications(cloudDb);
        const leadsRepaired = repairDatabaseLeads(cloudDb);
        if (followUpsRepaired || usersRepaired || stocksRepaired || customersRepaired || purchasesRepaired || creditsRepaired || leadsRepaired) {
          try {
            await supabase
              .from('crm_snapshots')
              .upsert({ id: 'latest', data: cloudDb, updated_at: new Date().toISOString() });
          } catch (err) {
            console.warn('Could not sync repaired data to Supabase:', err);
          }
        }
        // Cache to local file if possible
        writeDatabase(cloudDb);
        return cloudDb;
      }

      // If snapshot table does not exist or has no rows, initialize it
      const localDb = readDatabase();
      try {
        await supabase
          .from('crm_snapshots')
          .upsert({ id: 'latest', data: localDb, updated_at: new Date().toISOString() });
      } catch (err) {
        console.warn('Could not initialize crm_snapshots table in Supabase:', err);
      }
      return localDb;
    } catch (e) {
      console.warn('Error reading from Supabase cloud snapshot, falling back to disk:', e);
    }
  }

  return readDatabase();
}

/**
 * Async database writer with dual-engine sync (Disk + Supabase Cloud)
 */
export async function writeDatabaseAsync(data: CrmDatabase): Promise<void> {
  // Always update local disk cache
  writeDatabase(data);

  // Sync to Supabase cloud if credentials configured
  const supabase = getServerSupabase();
  if (supabase) {
    try {
      const { error } = await supabase
        .from('crm_snapshots')
        .upsert({
          id: 'latest',
          data,
          updated_at: new Date().toISOString(),
        });
      if (error) {
        console.warn('Warning: Could not save snapshot to Supabase:', error.message);
      }
    } catch (e) {
      console.warn('Exception during Supabase snapshot upsert:', e);
    }
  }
}

/**
 * Sync entire CRM database to individual Supabase relational tables
 */
export async function syncToSupabaseRelational(db: CrmDatabase): Promise<{ success: boolean; message: string; details?: any }> {
  const supabase = getServerSupabase();
  if (!supabase) {
    return {
      success: false,
      message: 'Supabase belum dikonfigurasi. Pastikan NEXT_PUBLIC_SUPABASE_URL dan API Key sudah diatur di environment variable.',
    };
  }

  const results: Record<string, number> = {};

  try {
    // 1. Snapshot
    await supabase.from('crm_snapshots').upsert({
      id: 'latest',
      data: db,
      updated_at: new Date().toISOString(),
    });
    results['crm_snapshots'] = 1;

    // 2. Users
    if (db.users?.length) {
      const mapped = db.users.map((u) => ({
        id: u.id,
        email: u.email,
        full_name: u.name,
        phone: u.phone,
        role: u.role,
        avatar_url: u.avatar || null,
        is_approved: u.isApproved,
        is_active: u.isActive,
      }));
      await supabase.from('crm_users').upsert(mapped);
      results['crm_users'] = mapped.length;
    }

    // 3. Customers
    if (db.customers?.length) {
      const mapped = db.customers.map((c) => ({
        id: c.id,
        full_name: c.fullName,
        whatsapp: c.whatsapp,
        email: c.email || null,
        address: c.address,
        district: c.district,
        source: c.source,
        interested_vehicle: c.interestedVehicle,
        vehicle_type: c.vehicleType,
        budget: c.budget || 0,
        status: c.status || 'Aktif',
        registered_date: c.registeredDate,
      }));
      await supabase.from('customers').upsert(mapped);
      results['customers'] = mapped.length;
    }

    // 4. Vehicle Stocks
    if (db.stocks?.length) {
      const mapped = db.stocks.map((s) => ({
        id: s.id,
        brand: s.brand,
        model: s.model,
        year: s.year,
        color: s.color,
        transmission: s.transmission,
        fuel: s.fuel || s.fuelType || 'Bensin',
        mileage: s.mileage || s.mileageKm || 0,
        price: s.price,
        entry_date: s.entryDate,
        photos: s.photos || s.images || [],
        description: s.description || '',
        status: s.status,
        license_plate: s.licensePlate || s.plateNumber || '',
      }));
      await supabase.from('vehicle_stocks').upsert(mapped);
      results['vehicle_stocks'] = mapped.length;
    }

    // 5. Leads
    if (db.leads?.length) {
      const mapped = db.leads.map((l) => ({
        id: l.id,
        customer_name: l.customerName,
        contact_number: l.contactNumber || l.customerPhone || '',
        customer_phone: l.customerPhone || l.contactNumber || '',
        email: l.email || null,
        lead_source: l.leadSource,
        interested_vehicle: l.interestedVehicle,
        vehicle_type: l.vehicleType || null,
        estimated_budget: l.estimatedBudget || 0,
        status: l.status,
        notes: l.notes || '',
        lost_reason: l.lostReason || null,
        search_brand: l.searchBrand || null,
        search_model: l.searchModel || null,
        search_year_min: l.searchYearMin || null,
        search_year_max: l.searchYearMax || null,
        search_budget_max: l.searchBudgetMax || null,
        date_received: l.dateReceived,
      }));
      await supabase.from('leads').upsert(mapped);
      results['leads'] = mapped.length;
    }

    // 6. Follow-ups
    if (db.followUps?.length) {
      const mapped = db.followUps.map((f) => ({
        id: f.id,
        customer_name: f.customerName,
        customer_phone: f.customerPhone,
        vehicle_info: f.vehicleInfo,
        category: f.category,
        follow_up_reason: f.followUpReason || '',
        scheduled_date: f.scheduledDate,
        scheduled_time: f.scheduledTime || '09:00:00',
        channel: f.channel || 'WhatsApp',
        status: f.status,
        priority: f.priority || 'Sedang',
        notes: f.notes || '',
        result_notes: f.resultNotes || '',
        is_unit_sold: Boolean(f.isUnitSold),
        communication_logs: f.communicationLogs || [],
      }));
      await supabase.from('follow_ups').upsert(mapped);
      results['follow_ups'] = mapped.length;
    }

    // 7. Repair Claims (Riwayat Perbaikan Garansi)
    if (db.repairClaims?.length) {
      const mapped = db.repairClaims.map((r) => ({
        id: r.id,
        claim_number: r.claimNumber || null,
        customer_name: r.customerName,
        customer_phone: r.customerPhone,
        vehicle_brand: r.vehicleBrand,
        vehicle_model: r.vehicleModel,
        vehicle_year: r.vehicleYear,
        purchase_date: r.purchaseDate || null,
        claim_date: r.claimDate,
        claim_type: r.claimType,
        complaint_or_damage: r.complaintOrDamage || r.complaint || '',
        parts_to_repair: r.partsToRepair || r.damagedParts || '',
        damage_category: r.damageCategory,
        repair_action_description: r.repairActionDescription || r.actionTaken || '',
        sparepart_cost: r.sparepartCost,
        service_cost: r.serviceCost,
        total_cost: r.totalCost,
        status: r.status,
        notes: r.notes || '',
        completed_date: r.completedDate || null,
      }));
      await supabase.from('repair_claims').upsert(mapped);
      results['repair_claims'] = mapped.length;
    }

    return {
      success: true,
      message: 'Berhasil menyinkronkan seluruh dataset CRM HR MOTOR ke tabel PostgreSQL Supabase!',
      details: results,
    };
  } catch (err: any) {
    return {
      success: false,
      message: `Gagal menyinkronkan ke Supabase: ${err.message || String(err)}`,
    };
  }
}

export function resetDatabase(): CrmDatabase {
  const initial = getInitialDatabase();
  writeDatabase(initial);
  return initial;
}
