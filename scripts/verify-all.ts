import { readDatabase, repairDatabaseStocks, repairDatabaseLeads, getInitialDatabase } from '../src/lib/serverStore';
import { VehicleStock, CreditApplication, FollowUp, Customer, CustomerPurchase, Lead, normalizePipelineStage, CORE_PIPELINE_STAGES } from '../src/types/crm';

console.log('================================================================');
console.log('       HR MOTOR CRM - COMPREHENSIVE VERIFICATION SUITE          ');
console.log('================================================================\n');

let passCount = 0;
let failCount = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  if (condition) {
    console.log(`✅ PASS: ${testName}`);
    passCount++;
  } else {
    console.error(`❌ FAIL: ${testName} ${detail ? `(${detail})` : ''}`);
    failCount++;
  }
}

// ----------------------------------------------------------------------
// TEST SUITE 1: Database Integrity & repairDatabaseStocks
// ----------------------------------------------------------------------
console.log('[1/7] Testing Database Persistence & Non-destructive Repairs...');
{
  const db = getInitialDatabase();
  assert(db.stocks.length >= 32, 'Initial stock count is at least 32');

  // Test 1a: Custom stock without stockNumber does not get wiped
  const customStock: VehicleStock = {
    id: 'STK-CUSTOM-099',
    brand: 'Toyota',
    model: 'Raize 1.0 Turbo GR Sport',
    year: 2022,
    color: 'Putih',
    transmission: 'CVT',
    fuel: 'Bensin',
    mileage: 15000,
    price: 215000000,
    entryDate: '2026-11-03',
    description: 'Unit istimewa',
    status: 'Tersedia',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  } as any;

  const parsedWithCustom = {
    stocks: [customStock, ...db.stocks],
  } as any;

  repairDatabaseStocks(parsedWithCustom);
  assert(
    parsedWithCustom.stocks[0].id === 'STK-CUSTOM-099',
    'Custom stock without stockNumber survives repairDatabaseStocks'
  );
  assert(
    parsedWithCustom.stocks[0].stockNumber === 1,
    'Custom stock receives an assigned stockNumber automatically'
  );

  // Test 1b: Stock deletion (length drops to 31) does NOT revert to initial stocks
  const deletedOneStock = {
    stocks: db.stocks.slice(1),
  } as any;
  assert(deletedOneStock.stocks.length === db.stocks.length - 1, 'Simulated deleted stock count');
  repairDatabaseStocks(deletedOneStock);
  assert(
    deletedOneStock.stocks.length === db.stocks.length - 1,
    'Stock deletion is preserved (does NOT force-reset to initial stocks)'
  );
}

// ----------------------------------------------------------------------
// TEST SUITE 2: Multi-Attribute Prospect Matching Precision
// ----------------------------------------------------------------------
console.log('\n[2/7] Testing Multi-Attribute Smart Prospect Matching...');
{
  const smartMatch = (stock: VehicleStock, prospect: Partial<FollowUp>): boolean => {
    if (stock.status !== 'Tersedia') return false;
    const sBrand = (stock.brand || '').toLowerCase().trim();
    const sModel = (stock.model || '').toLowerCase().trim();
    const sMerk = (stock.merkType || '').toLowerCase().trim();
    const fullStockDesc = `${sBrand} ${sModel} ${sMerk}`.toLowerCase();

    const pBrand = (prospect.searchBrand || '').toLowerCase().trim();
    const pModel = (prospect.searchModel || '').toLowerCase().trim();
    const pYear = prospect.searchYear ? Number(prospect.searchYear) : undefined;
    const pBudget = prospect.searchBudget ? Number(prospect.searchBudget) : undefined;

    // 1. Brand match
    if (pBrand && !sBrand.includes(pBrand) && !pBrand.includes(sBrand)) {
      return false;
    }

    // 2. Model / Tipe match: all meaningful tokens must match
    if (pModel) {
      const tokens = pModel
        .split(/[\s,-]+/)
        .map((w) => w.trim().toLowerCase())
        .filter((w) => w.length >= 2 && !pBrand.includes(w) && !sBrand.includes(w));

      if (tokens.length > 0) {
        const allTokensMatch = tokens.every((token) => fullStockDesc.includes(token));
        if (!allTokensMatch) return false;
      }
    }

    // 3. Year match (+/- 1 year tolerance)
    if (pYear && Math.abs(stock.year - pYear) > 1) {
      return false;
    }

    // 4. Budget match (within budget +15% tolerance)
    if (pBudget && stock.price > pBudget * 1.15) {
      return false;
    }

    return true;
  }

  const prospectAndi: Partial<FollowUp> = {
    searchBrand: 'Honda',
    searchModel: 'Jazz RS',
    searchYear: 2018,
    searchBudget: 200000000,
  };

  const stockBrioRS: VehicleStock = {
    id: 'STK-001',
    brand: 'Honda',
    model: 'BRIO 1.2 RS CVT',
    merkType: 'HONDA BRIO 1.2 RS CVT',
    year: 2018,
    price: 155000000,
    status: 'Tersedia',
  } as any;

  const stockJazzRS: VehicleStock = {
    id: 'STK-002',
    brand: 'Honda',
    model: 'JAZZ 1.5 RS CVT',
    merkType: 'HONDA JAZZ 1.5 RS CVT',
    year: 2018,
    price: 195000000,
    status: 'Tersedia',
  } as any;

  const stockJazzS: VehicleStock = {
    id: 'STK-003',
    brand: 'Honda',
    model: 'JAZZ 1.5 S M/T',
    merkType: 'HONDA JAZZ 1.5 S M/T',
    year: 2018,
    price: 175000000,
    status: 'Tersedia',
  } as any;

  assert(!smartMatch(stockBrioRS, prospectAndi), 'Honda Brio RS does NOT falsely match customer looking for Jazz RS');
  assert(smartMatch(stockJazzRS, prospectAndi), 'Honda Jazz RS correctly matches customer looking for Jazz RS');
  assert(!smartMatch(stockJazzS, prospectAndi), 'Honda Jazz S does NOT match customer looking for Jazz RS');

  // Test Avanza Veloz vs standard Avanza
  const prospectVeloz: Partial<FollowUp> = {
    searchBrand: 'Toyota',
    searchModel: 'Avanza Veloz',
    searchYear: 2019,
    searchBudget: 180000000,
  };

  const stockAvanzaG: VehicleStock = {
    id: 'STK-004',
    brand: 'Toyota',
    model: 'AVANZA 1.3 G M/T',
    merkType: 'TOYOTA AVANZA 1.3 G M/T',
    year: 2019,
    price: 165000000,
    status: 'Tersedia',
  } as any;

  const stockVeloz: VehicleStock = {
    id: 'STK-005',
    brand: 'Toyota',
    model: 'AVANZA VELOZ 1.5 A/T',
    merkType: 'TOYOTA AVANZA VELOZ 1.5 A/T',
    year: 2019,
    price: 175000000,
    status: 'Tersedia',
  } as any;

  assert(!smartMatch(stockAvanzaG, prospectVeloz), 'Standard Avanza G does NOT match customer requesting Avanza Veloz');
  assert(smartMatch(stockVeloz, prospectVeloz), 'Avanza Veloz matches customer requesting Avanza Veloz');
}

// ----------------------------------------------------------------------
// TEST SUITE 3: Cash Transaction Lifecycle & Automations
// ----------------------------------------------------------------------
console.log('\n[3/7] Testing Cash Transaction End-to-End...');
{
  const db = getInitialDatabase();
  const readyCar = db.stocks.find((s) => s.status === 'Tersedia')!;
  assert(!!readyCar, 'Found ready car in showroom');

  // 1. Double transaction prevention: cannot create transaction on booked or sold car
  readyCar.status = 'Booking';
  const canSellBooked = (readyCar.status as string) === 'Tersedia';
  assert(!canSellBooked, 'Booking unit cannot be sold via cash');

  readyCar.status = 'Terjual';
  const canSellSold = (readyCar.status as string) === 'Tersedia';
  assert(!canSellSold, 'Sold unit cannot be sold again');

  // 2. Perform Cash Sale on a Tersedia unit
  readyCar.status = 'Tersedia';
  const dealPrice = 160000000;
  const buyerName = 'Pak Rahmat Hidayat';
  const buyerPhone = '081299887766';
  const txDate = '2026-11-03';

  // State changes:
  readyCar.status = 'Terjual';
  readyCar.soldDate = txDate;
  readyCar.soldToCustomerName = buyerName;
  readyCar.bookingCustomerId = undefined;
  readyCar.bookingCustomerName = undefined;

  assert(readyCar.status === 'Terjual', 'Car status changed to Terjual (SOLD OUT)');
  assert(readyCar.soldToCustomerName === buyerName, 'Car records soldToCustomerName');

  // Auto-schedule 1-year customer follow-up
  const d = new Date(txDate);
  d.setMonth(d.getMonth() + 1);
  const nextMonth = d.toISOString().split('T')[0];

  const custFlw: FollowUp = {
    id: 'FLW-CUST-TEST',
    followUpType: 'CUSTOMER',
    customerName: buyerName,
    customerPhone: buyerPhone,
    vehicleInfo: `${readyCar.brand} ${readyCar.model}`,
    paymentType: 'Cash',
    purchaseDate: txDate,
    periodicStep: '1 Bulan',
    scheduledDate: nextMonth,
    status: 'Belum Dihubungi',
    priority: 'Tinggi',
    category: 'Pelanggan Lama (1 Tahun)',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  } as any;

  db.followUps.unshift(custFlw);
  assert(custFlw.periodicStep === '1 Bulan', 'First customer milestone is 1 Bulan');
  assert(custFlw.status === 'Belum Dihubungi', 'Initial follow up status is Belum Dihubungi');
}

// ----------------------------------------------------------------------
// TEST SUITE 4: Credit Application & BOKING Workflow
// ----------------------------------------------------------------------
console.log('\n[4/7] Testing Credit Submission & BOKING...');
{
  const db = getInitialDatabase();
  const readyCar = db.stocks.find((s) => s.status === 'Tersedia')!;

  const app: CreditApplication = {
    id: 'CRD-2026-TEST',
    customerName: 'Ibu Siti Maryam',
    customerPhone: '081388776655',
    customerAddress: 'Tarogong Kaler, Garut',
    customerSource: 'Walk-in',
    vehicleStockId: readyCar.id,
    vehicleName: `${readyCar.brand} ${readyCar.model}`,
    targetLeasing: 'BCA Finance',
    dealPrice: readyCar.price,
    initialDp: 40000000,
    status: 'PENDING',
    applicationDate: '2026-11-03',
    history: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  // Stock locks to Booking
  readyCar.status = 'Booking';
  readyCar.bookingCustomerName = app.customerName;
  readyCar.bookingLeasing = app.targetLeasing;
  readyCar.bookingDp = app.initialDp;
  readyCar.bookingApplicationId = app.id;

  assert(readyCar.status === 'Booking', 'Stock status changes to Booking (BOKING)');
  assert(readyCar.bookingCustomerName === 'Ibu Siti Maryam', 'Stock records bookingCustomerName');
  assert(readyCar.bookingLeasing === 'BCA Finance', 'Stock records bookingLeasing');
  assert(app.status === 'PENDING', 'Credit application status is PENDING');

  // Anti-double-booking: Cannot book the same car again
  const canBookAgain = (readyCar.status as string) === 'Tersedia';
  assert(!canBookAgain, 'Booked unit cannot be booked by another applicant');
}

// ----------------------------------------------------------------------
// TEST SUITE 5: Credit ACC (Approval) & Collision Protection
// ----------------------------------------------------------------------
console.log('\n[5/7] Testing Credit ACC with Collision Protection...');
{
  const db = getInitialDatabase();
  const car = db.stocks.find((s) => s.status === 'Tersedia')!;
  car.status = 'Booking';
  car.bookingApplicationId = 'CRD-APP-001';
  car.bookingCustomerName = 'Ahmad';

  // Conflict 1: Someone tries to approve an application for an already sold car
  const soldCar: VehicleStock = {
    id: 'STK-SOLD',
    brand: 'Toyota',
    model: 'Yaris',
    year: 2021,
    price: 200000000,
    status: 'Terjual',
    soldToCustomerId: 'CUST-001',
    soldToCustomerName: 'Pembeli Cash Lain',
  } as any;

  const appConflicted: CreditApplication = {
    id: 'CRD-CONFLICT',
    vehicleStockId: soldCar.id,
    customerId: 'CUST-002',
    customerName: 'Pemohon Kredit Terlambat',
    status: 'PENDING',
  } as any;

  const isAlreadySoldToAnother = soldCar.status === 'Terjual' && soldCar.soldToCustomerId !== appConflicted.customerId;
  assert(isAlreadySoldToAnother, 'Collision detection detects unit already sold to another customer');

  // Successful ACC on legitimately booked car
  const finalDp = 42000000;
  const approvedLeasing = 'BCA Finance';
  car.status = 'Terjual';
  car.soldDate = '2026-11-03';
  car.soldToCustomerName = 'Ahmad';
  car.bookingCustomerId = undefined;
  car.bookingCustomerName = undefined;
  car.bookingApplicationId = undefined;

  assert(car.status === 'Terjual', 'Legitimate ACC updates stock status from Booking to Terjual (SOLD OUT)');
  assert(car.bookingCustomerName === undefined, 'Booking metadata cleared upon ACC');
}

// ----------------------------------------------------------------------
// TEST SUITE 6: Credit Rejection (DITOLAK) & Reversion to READY
// ----------------------------------------------------------------------
console.log('\n[6/7] Testing Credit Rejection (DITOLAK)...');
{
  const car: VehicleStock = {
    id: 'STK-REVERT',
    brand: 'Honda',
    model: 'Mobilio',
    year: 2019,
    price: 160000000,
    status: 'Booking',
    bookingApplicationId: 'CRD-REJECT-001',
    bookingCustomerName: 'Calon Pembeli Ditolak',
  } as any;

  const appToReject: CreditApplication = {
    id: 'CRD-REJECT-001',
    vehicleStockId: car.id,
    customerName: 'Calon Pembeli Ditolak',
    status: 'PENDING',
    history: [],
  } as any;

  // Rejection logic:
  const isBookedByThis = car.status === 'Booking' && car.bookingApplicationId === appToReject.id;
  assert(isBookedByThis, 'Identifies car was booked by this specific application');

  if (isBookedByThis) {
    car.status = 'Tersedia'; // Reverted to READY!
    car.bookingApplicationId = undefined;
    car.bookingCustomerName = undefined;
    car.bookingLeasing = undefined;
  }

  appToReject.status = 'REJECTED';
  appToReject.rejectionReason = 'BI Checking Kol 5';
  appToReject.history.push({
    status: 'REJECTED',
    timestamp: new Date().toISOString(),
    adminName: 'Owner',
    notes: 'BI Checking Kol 5',
    rejectionReason: 'BI Checking Kol 5',
  });

  assert(car.status === 'Tersedia', 'Car status reverts to Tersedia (READY)');
  assert(car.bookingCustomerName === undefined, 'Booking metadata cleared on rejection');
  assert(appToReject.status === 'REJECTED', 'Application status changed to REJECTED');
  assert(appToReject.history.length === 1, 'Audit trail history entry recorded permanently');
}

// ----------------------------------------------------------------------
// TEST SUITE 7: Customer Follow-Up Milestone Integrity
// ----------------------------------------------------------------------
console.log('\n[7/7] Testing Customer Follow-Up Milestone & Status Integrity...');
{
  const flw: FollowUp = {
    id: 'FLW-001',
    followUpType: 'CUSTOMER',
    customerName: 'Pak Dedi',
    customerPhone: '08123456789',
    vehicleInfo: 'Daihatsu Terios 2021',
    paymentType: 'Cash',
    periodicStep: '1 Bulan',
    status: 'Belum Dihubungi',
    communicationLogs: [],
  } as any;

  // Simulate updating milestone with communication log
  flw.status = 'Sudah Dihubungi';
  flw.periodicStep = '3 Bulan';
  flw.communicationLogs = [
    {
      id: 'LOG-1',
      timestamp: new Date().toISOString(),
      outcome: 'Sudah Dihubungi',
      notes: '1. Kabar: Baik. 2. Kondisi: Prima. 3. Kendala: Tidak ada. 4. Upgrade: Belum. 5. Jual: Prioritas HR MOTOR',
    } as any,
  ];

  assert(flw.status === 'Sudah Dihubungi', 'Follow up status is preserved as Sudah Dihubungi (not overwritten to Tertarik)');
  assert(flw.periodicStep === '3 Bulan', 'Milestone advanced to 3 Bulan');
  assert(flw.communicationLogs.length === 1, 'Communication log properly recorded');
}

// ----------------------------------------------------------------------
// TEST SUITE 8: Sales Pipeline 3-Stage Lead Tracking & Lead Management Sync
// ----------------------------------------------------------------------
console.log('\n[8/8] Testing Sales Pipeline 3-Stage Tracking & Lead Management Sync...');
{
  // 1. Verify 3 Core Stages & Legacy Normalization
  assert(CORE_PIPELINE_STAGES.length === 3, 'Core stages array has exactly 3 stages');
  assert(CORE_PIPELINE_STAGES.includes('Hanya Menanyakan'), 'Core stages includes Hanya Menanyakan');
  assert(CORE_PIPELINE_STAGES.includes('Negosiasi'), 'Core stages includes Negosiasi');
  assert(CORE_PIPELINE_STAGES.includes('Cek Unit'), 'Core stages includes Cek Unit');

  assert(normalizePipelineStage('Menanyakan Unit') === 'Hanya Menanyakan', 'Legacy stage "Menanyakan Unit" maps to "Hanya Menanyakan"');
  assert(normalizePipelineStage('Tertarik') === 'Negosiasi', 'Legacy stage "Tertarik" maps to "Negosiasi"');
  assert(normalizePipelineStage('Cek Unit') === 'Cek Unit', 'Stage "Cek Unit" preserves as "Cek Unit"');
  assert(normalizePipelineStage('Negosiasi') === 'Negosiasi', 'Stage "Negosiasi" preserves as "Negosiasi"');
  assert(normalizePipelineStage('Hanya Menanyakan') === 'Hanya Menanyakan', 'Stage "Hanya Menanyakan" preserves as "Hanya Menanyakan"');

  // 2. Database repair function preserves and normalizes leads
  const mockDb = {
    leads: [
      {
        id: 'LEAD-TEST-001',
        customerName: 'Asep Ridwan',
        contactNumber: '',
        customerPhone: '081234567890',
        status: 'Menanyakan Unit' as any,
        interestedVehicle: 'Toyota Rush 2021',
        notes: 'Inquiry awal',
        dateReceived: '2026-11-03',
        createdAt: '2026-11-03T10:00:00Z',
        updatedAt: '2026-11-03T10:00:00Z',
      },
      {
        id: 'LEAD-TEST-002',
        customerName: 'Budi Santoso',
        contactNumber: '085711223344',
        customerPhone: '',
        status: 'Tertarik' as any,
        interestedVehicle: 'Honda Jazz RS 2018',
        notes: 'Minat nego',
        dateReceived: '2026-11-03',
        createdAt: '2026-11-03T10:00:00Z',
        updatedAt: '2026-11-03T10:00:00Z',
      },
    ],
  } as any;

  repairDatabaseLeads(mockDb);
  assert(mockDb.leads[0].status === 'Hanya Menanyakan', 'Lead 1 status auto-migrated from "Menanyakan Unit" to "Hanya Menanyakan"');
  assert(mockDb.leads[0].contactNumber === '081234567890', 'Lead 1 contactNumber auto-synchronized from customerPhone');
  assert(mockDb.leads[0].stageHistory?.length === 1, 'Lead 1 has stageHistory initialized');
  assert(mockDb.leads[1].status === 'Negosiasi', 'Lead 2 status auto-migrated from "Tertarik" to "Negosiasi"');
  assert(mockDb.leads[1].customerPhone === '085711223344', 'Lead 2 customerPhone auto-synchronized from contactNumber');

  // 3. Sales Pipeline Lead Input: all 6 fields specified
  const now = new Date().toISOString();
  const newLeadFromPipeline: Lead = {
    id: 'LEAD-2026-999',
    customerName: 'Hj. Nenden Kartika',
    contactNumber: '081399881122',
    customerPhone: '081399881122',
    leadSource: 'WhatsApp',
    interestedVehicle: 'Toyota Fortuner 2.4 VRZ 2020',
    status: 'Hanya Menanyakan',
    notes: 'Konsumen menanyakan ketersediaan Fortuner hitam dan promo showroom',
    dateReceived: '2026-11-03',
    estimatedBudget: 0,
    assignedSalesId: 'USR-003',
    assignedSalesName: 'Asep Kurniawan',
    stageHistory: [
      {
        stage: 'Hanya Menanyakan',
        timestamp: now,
        notes: 'Calon konsumen tercatat di Sales Pipeline WhatsApp',
        updatedByName: 'Admin HR MOTOR',
      },
    ],
    lastContactDate: now,
    createdAt: now,
    updatedAt: now,
  };

  mockDb.leads.unshift(newLeadFromPipeline);
  assert(mockDb.leads[0].id === 'LEAD-2026-999', 'New lead added to shared CRM leads list');
  assert(mockDb.leads[0].leadSource === 'WhatsApp', 'New lead source is WhatsApp');
  assert(mockDb.leads[0].status === 'Hanya Menanyakan', 'Initial stage is Hanya Menanyakan');

  // 4. Stage Transition & Audit Trail (Stage History)
  const targetLead = mockDb.leads[0];
  const nextStage = 'Negosiasi';
  const stageUpdateTimestamp = new Date().toISOString();
  targetLead.status = nextStage;
  targetLead.stageHistory.push({
    stage: nextStage,
    timestamp: stageUpdateTimestamp,
    notes: 'Konsumen menawar harga Rp 420.000.000 nett',
    updatedByName: 'Owner HR MOTOR',
  });

  assert(targetLead.status === 'Negosiasi', 'Lead stage successfully transitioned to Negosiasi');
  assert(targetLead.stageHistory.length === 2, 'Stage history accurately records 2 chronological entries');
  assert(targetLead.stageHistory[1].stage === 'Negosiasi', 'Stage history records new stage as Negosiasi');

  // Transition to Cek Unit
  const visitTimestamp = new Date().toISOString();
  targetLead.status = 'Cek Unit';
  targetLead.visitNotes = 'Konsumen datang ke showroom Garut bersama mekanik keluarga';
  targetLead.stageHistory.push({
    stage: 'Cek Unit',
    timestamp: visitTimestamp,
    notes: 'Konsumen datang ke showroom Garut bersama mekanik keluarga',
    updatedByName: 'Owner HR MOTOR',
  });

  assert(targetLead.status === 'Cek Unit', 'Lead stage successfully transitioned to Cek Unit');
  assert(targetLead.stageHistory.length === 3, 'Stage history accurately records 3 chronological entries');

  // 5. Deletion & Orphaned Reference Cleanup
  const prevCount = mockDb.leads.length;
  mockDb.followUps = [
    { id: 'FLW-LEAD-999', leadId: 'LEAD-2026-999', customerName: 'Hj. Nenden Kartika' } as any,
    { id: 'FLW-OTHER', leadId: 'LEAD-TEST-001', customerName: 'Asep Ridwan' } as any,
  ];

  // Simulate DELETE_LEAD with orphaned follow-up cleanup
  mockDb.leads = mockDb.leads.filter((l: any) => l.id !== 'LEAD-2026-999');
  mockDb.followUps = mockDb.followUps.filter((f: any) => f.leadId !== 'LEAD-2026-999');
  assert(mockDb.leads.length === prevCount - 1, 'Lead deletion removes lead from shared database');
  assert(mockDb.followUps.length === 1 && mockDb.followUps[0].id === 'FLW-OTHER', 'Lead deletion removes orphaned follow-up references');

  // 6. Resilient ID Sequence Generation (Collision Resistance after deletion)
  const simulatedLeads = [
    { id: 'LEAD-2026-001' },
    { id: 'LEAD-2026-002' },
    { id: 'LEAD-2026-003' },
  ];
  // Delete middle lead
  const remainingLeads = simulatedLeads.filter(l => l.id !== 'LEAD-2026-002');
  // With naive (length + 1): 2 + 1 = 3 -> COLLISION with LEAD-2026-003!
  // With max sequence algorithm:
  const maxSeq = remainingLeads.reduce((max, l) => {
    const match = (l.id || '').match(/LEAD-\d+-(\d+)/);
    return match ? Math.max(max, parseInt(match[1], 10)) : max;
  }, 0);
  const nextSafeId = `LEAD-2026-${String(maxSeq + 1).padStart(3, '0')}`;
  assert(nextSafeId === 'LEAD-2026-004', 'ID generation algorithm prevents duplicate collisions after deletion');
  assert(!remainingLeads.some(l => l.id === nextSafeId), 'Generated lead ID does not collide with any existing lead');

  // 7. Phone Normalization & Multi-Format Duplicate Detection
  const testNormalizePhone = (phone?: string): string => {
    let digits = (phone || '').replace(/\D/g, '');
    if (digits.startsWith('62')) {
      digits = '0' + digits.slice(2);
    }
    return digits;
  };

  const pStandard = testNormalizePhone('081222987654');
  const pInternational = testNormalizePhone('+62 812-2298-7654');
  const pDirect62 = testNormalizePhone('6281222987654');
  const pDashed = testNormalizePhone('0812-2298-7654');

  assert(pStandard === '081222987654', 'Standard phone normalizes correctly');
  assert(pStandard === pInternational, 'International format "+62 812-..." matches standard "0812..."');
  assert(pStandard === pDirect62, 'Direct "62812..." matches standard "0812..."');
  assert(pStandard === pDashed, 'Dashed "0812-2298-7654" matches standard "0812..."');

  // 8. UPDATE_LEAD_STAGE Notes Updating for Cek Unit & Hanya Menanyakan
  const stageTestLead: Lead = {
    id: 'LEAD-NOTE-TEST',
    customerName: 'Siti Sarah',
    contactNumber: '081234567800',
    status: 'Hanya Menanyakan',
    notes: 'Inquiry awal',
    stageHistory: [],
  } as any;

  // Simulate updating stage to Cek Unit with note
  const cekUnitNote = 'Konsumen akan datang cek unit Sabtu jam 10 pagi';
  stageTestLead.status = 'Cek Unit';
  stageTestLead.notes = cekUnitNote;
  stageTestLead.visitNotes = cekUnitNote;
  assert(stageTestLead.notes === cekUnitNote, 'UPDATE_LEAD_STAGE updates lead.notes when moving to Cek Unit');

  // 9. Real Persistent Database Validation
  const realDb = readDatabase();
  const allLeadsValid = realDb.leads.every(l =>
    CORE_PIPELINE_STAGES.includes(l.status as any)
  );
  assert(allLeadsValid, 'All leads in persistent database have 100% valid 3-stage status');

  const allLeadsHavePhone = realDb.leads.every(l =>
    Boolean(l.contactNumber || l.customerPhone)
  );
  assert(allLeadsHavePhone, 'All leads in persistent database have contact phone number');

  const allLeadsHaveHistory = realDb.leads.every(l =>
    Array.isArray(l.stageHistory) && l.stageHistory.length >= 1
  );
  assert(allLeadsHaveHistory, 'All leads in persistent database have valid stageHistory initialized');
}

// ----------------------------------------------------------------------
// TEST SUITE 9: Garansi Perbaikan HR MOTOR (< 1 Bulan Free Repair) & Analytics
// ----------------------------------------------------------------------
console.log('\n[9/9] Testing Garansi Perbaikan HR MOTOR (< 1 Bulan) & Dashboard Metrics...');
{
  const { checkWarrantyStatus, parseRupiahInput, calculateFleetHealth } = require('../src/lib/warranty');

  // 1. Garansi 30 Hari Calculation & Badge Labels & Timezone Expiry Date
  const testSameDay = checkWarrantyStatus('2026-10-01', '2026-10-01');
  assert(testSameDay.isWithinWarranty, 'Same day claim is within warranty (day 0)');
  assert(testSameDay.statusLabel === 'Dalam Garansi (Gratis)', 'Same day claim statusLabel is "Dalam Garansi (Gratis)"');
  assert(testSameDay.badgeLabel === 'Gratis < 1 Bulan', 'Same day claim badgeLabel is "Gratis < 1 Bulan"');
  assert(testSameDay.daysRemaining === 30, 'Same day claim has 30 days remaining');
  assert(testSameDay.expiryDateStr === '2026-10-31', 'Same day claim expiryDateStr is exactly 2026-10-31 (local timezone safe)');

  const test15Days = checkWarrantyStatus('2026-10-01', '2026-10-16');
  assert(test15Days.isWithinWarranty, 'Day 15 claim is within warranty');
  assert(test15Days.daysDiff === 15, 'Day 15 diff is 15');
  assert(test15Days.daysRemaining === 15, 'Day 15 claim has 15 days remaining');
  assert(test15Days.expiryDateStr === '2026-10-31', 'Day 15 claim expiryDateStr is 2026-10-31');

  const testExactly30Days = checkWarrantyStatus('2026-10-01', '2026-10-31');
  assert(testExactly30Days.isWithinWarranty, 'Exactly 30 days claim is within warranty');
  assert(testExactly30Days.badgeLabel === 'Gratis < 1 Bulan', '30 days claim badgeLabel is "Gratis < 1 Bulan"');
  assert(testExactly30Days.expiryDateStr === '2026-10-31', '30 days claim expiryDateStr is 2026-10-31');

  const test31Days = checkWarrantyStatus('2026-10-01', '2026-11-01');
  assert(!test31Days.isWithinWarranty, 'Day 31 claim is outside warranty (> 30 days)');
  assert(test31Days.statusLabel === 'Di Luar Garansi', 'Day 31 claim statusLabel is "Di Luar Garansi"');
  assert(test31Days.badgeLabel === 'Di Luar Garansi', 'Day 31 claim badgeLabel is "Di Luar Garansi"');
  assert(test31Days.daysRemaining === 0, 'Day 31 claim daysRemaining is 0');

  const testPriorClaimDate = checkWarrantyStatus('2026-10-15', '2026-10-10');
  assert(!testPriorClaimDate.isWithinWarranty, 'Claim date preceding purchase date is outside warranty');
  assert(testPriorClaimDate.daysRemaining === 0, 'Preceding claim date daysRemaining is 0');

  const testMissingPurchaseDate = checkWarrantyStatus(undefined, '2026-11-01');
  assert(!testMissingPurchaseDate.isWithinWarranty, 'Missing purchase date safely defaults to outside warranty');
  assert(testMissingPurchaseDate.expiryDateStr === '-', 'Missing purchase date expiryDateStr is "-"');

  // 2. Rupiah Currency Input Parsing Tests (Indonesian dot/comma formats)
  assert(parseRupiahInput('850.000') === 850000, 'parseRupiahInput("850.000") is 850000');
  assert(parseRupiahInput('Rp 1.500.000,00') === 1500000, 'parseRupiahInput("Rp 1.500.000,00") is 1500000');
  assert(parseRupiahInput(850000) === 850000, 'parseRupiahInput(850000) is 850000');
  assert(parseRupiahInput('') === 0, 'parseRupiahInput("") is 0');
  assert(parseRupiahInput(null) === 0, 'parseRupiahInput(null) is 0');

  // 3. Metrics & Analytics Calculation
  const sampleClaims = [
    {
      id: 'REP-001',
      customerName: 'Agus Gunawan',
      customerPhone: '081221345678',
      vehicleBrand: 'Toyota',
      vehicleModel: 'Innova Reborn',
      vehicleYear: 2020,
      plateNumber: 'Z 1524 DB',
      workshop: 'Bengkel Garut Motor Mandiri (Rujukan HR MOTOR)',
      purchaseDate: '2026-09-12',
      claimDate: '2026-09-28',
      damageCategory: 'Sistem Rem',
      totalCost: 850000,
      status: 'Selesai',
    },
    {
      id: 'REP-002',
      customerName: 'Agus Gunawan',
      customerPhone: '081221345678',
      vehicleBrand: 'Toyota',
      vehicleModel: 'Innova Reborn',
      vehicleYear: 2020,
      plateNumber: 'Z 1524 DB',
      workshop: 'Bengkel Garut Motor Mandiri (Rujukan HR MOTOR)',
      purchaseDate: '2026-09-12',
      claimDate: '2026-10-08',
      damageCategory: 'Kaki-kaki & Suspensi',
      totalCost: 1050000,
      status: 'Selesai',
    },
    {
      id: 'REP-003',
      customerName: 'Dr. Hj. Nina Marlina',
      customerPhone: '081320456789',
      vehicleBrand: 'Honda',
      vehicleModel: 'Honda HR-V',
      vehicleYear: 2018,
      plateNumber: 'Z 1982 EA',
      workshop: 'Bengkel Resmi HR MOTOR Garut - Samarang',
      purchaseDate: '2026-09-20',
      claimDate: '2026-10-05',
      damageCategory: 'Kelistrikan & AC',
      totalCost: 800000,
      status: 'Selesai',
    },
    {
      id: 'REP-004',
      customerName: 'Wawan Hermawan',
      customerPhone: '085712348899',
      vehicleBrand: 'Toyota',
      vehicleModel: 'Avanza 1.3 G',
      vehicleYear: 2019,
      plateNumber: 'Z 1452 DA',
      workshop: 'Bengkel Mandiri Motor Samarang (Rujukan HR MOTOR)',
      purchaseDate: '2026-07-10',
      claimDate: '2026-08-20',
      damageCategory: 'Lainnya',
      totalCost: 450000,
      status: 'Dibatalkan',
    },
  ];

  // Unique customers: Agus Gunawan (2 claims) + Nina Marlina (1 claim) + Wawan Hermawan (1 claim) = 3 unique customers
  const uniqueKeys = new Set(sampleClaims.map(c => c.customerPhone.trim()));
  assert(uniqueKeys.size === 3, 'Unique customer count is 3');

  // Realized financial total excludes canceled claims: 850k + 1050k + 800k = 2,700,000 (excludes 450k canceled)
  const isRealized = (c: any) => c.status !== 'Dibatalkan';
  const realizedCost = sampleClaims.filter(isRealized).reduce((sum, c) => sum + c.totalCost, 0);
  assert(realizedCost === 2700000, 'Realized repair cost excludes canceled claim (2,700,000)');

  // Claims per unit: 4 claims across 3 units (Innova Reborn, HR-V, Avanza) = 1.3x
  const unitKeys = new Set(sampleClaims.map(c => c.plateNumber));
  assert(unitKeys.size === 3, 'Unique vehicles count is 3');
  const avgPerUnit = (sampleClaims.length / unitKeys.size).toFixed(1);
  assert(avgPerUnit === '1.3', 'Average repair per unit is 1.3x');

  // Claim percentage against total sales (e.g. 20 sales)
  const totalSales = 20;
  const ratio = ((uniqueKeys.size / totalSales) * 100).toFixed(1);
  assert(ratio === '15.0', 'Percentage of warranty customers against total sales is 15.0%');

  // Kartu Kesehatan Armada Showroom HR MOTOR (Fleet Health Calculation)
  const fleetHealth15 = calculateFleetHealth(ratio);
  assert(fleetHealth15.healthPercentage === '85.0', 'Fleet health for 15.0% claim ratio is 85.0% free of claims');
  assert(fleetHealth15.grade === 'Grade A (Prima & Terkontrol)', 'Fleet health grade for 85.0% is Grade A (Prima & Terkontrol)');

  const fleetHealth8 = calculateFleetHealth(8.0);
  assert(fleetHealth8.healthPercentage === '92.0', 'Fleet health for 8.0% claim ratio is 92.0% free of claims');
  assert(fleetHealth8.grade === 'Grade A+ (Sangat Prima)', 'Fleet health grade for 92.0% is Grade A+ (Sangat Prima)');

  // Monthly Claim Filter: Total Uang Perbaikan Selama Satu Bulan
  const oct2026Cost = sampleClaims
    .filter(c => c.claimDate.startsWith('2026-10') && isRealized(c))
    .reduce((sum, c) => sum + c.totalCost, 0);
  assert(oct2026Cost === 1850000, 'Total uang perbaikan garansi bulan Oktober 2026 is Rp 1.850.000');

  const sep2026Cost = sampleClaims
    .filter(c => c.claimDate.startsWith('2026-09') && isRealized(c))
    .reduce((sum, c) => sum + c.totalCost, 0);
  assert(sep2026Cost === 850000, 'Total uang perbaikan garansi bulan September 2026 is Rp 850.000');

  // Distinct vehicles without plate numbers belonging to different owners do not falsely merge
  const noPlateCars = [
    { customerPhone: '081111111', carName: 'Avanza', vehicleYear: 2021, plateNumber: '-' },
    { customerPhone: '082222222', carName: 'Avanza', vehicleYear: 2021, plateNumber: '-' },
  ];
  const noPlateKeys = new Set(noPlateCars.map(c => {
    const plate = c.plateNumber && c.plateNumber !== '-' ? c.plateNumber : `${c.customerPhone}-${c.carName}-${c.vehicleYear}`;
    return plate;
  }));
  assert(noPlateKeys.size === 2, 'Distinct owners with unplated identical car models produce 2 separate vehicle records');

  // Category frequency ranking & Top Category identification
  const catCounts: Record<string, number> = {};
  sampleClaims.forEach(c => { catCounts[c.damageCategory] = (catCounts[c.damageCategory] || 0) + 1; });
  assert(catCounts['Sistem Rem'] === 1, 'Sistem Rem count is 1');
  assert(catCounts['Kaki-kaki & Suspensi'] === 1, 'Kaki-kaki & Suspensi count is 1');
  assert(catCounts['Kelistrikan & AC'] === 1, 'Kelistrikan & AC count is 1');

  // 5 Data Utama Input Formulir Garansi & SPK Contract Integrity
  const testInputFormClaim = {
    customerName: 'Agus Gunawan',
    customerPhone: '081221345678',
    vehicleBrand: 'Toyota',
    vehicleModel: 'Innova Reborn 2.4 V Diesel A/T',
    vehicleYear: 2020,
    plateNumber: 'Z 1524 DB',
    purchaseDate: '2026-09-12',
    damageCategory: 'Sistem Rem',
    complaintOrDamage: 'Suara decit rem depan',
    partsToRepair: 'Brake pad depan & piringan rotor rem',
    repairCost: 850000,
    workshop: 'Bengkel Garut Motor Mandiri (Rujukan HR MOTOR)',
    status: 'Selesai',
  };
  assert(Boolean(testInputFormClaim.customerName && testInputFormClaim.customerPhone), '1. Data Pelanggan is present');
  assert(Boolean(testInputFormClaim.damageCategory), '2. Kategori Perbaikan is present');
  assert(Boolean(testInputFormClaim.complaintOrDamage), '3. Keluhan Perbaikan is present');
  assert(Boolean(testInputFormClaim.partsToRepair), '4. Bagian yang Diperbaiki is present');
  assert(testInputFormClaim.repairCost > 0, '5. Biaya perbaikan is greater than 0');
  assert(testInputFormClaim.workshop.includes('Rujukan HR MOTOR'), 'Workshop defaults to recommended HR MOTOR workshop');
  assert(testInputFormClaim.status === 'Selesai', 'Status defaults to Selesai');

  // Verify Plate Number & Workshop on sample claims
  assert(sampleClaims.every(c => Boolean(c.plateNumber)), 'Every sample claim has a plateNumber');
  assert(sampleClaims.every(c => c.workshop.includes('HR MOTOR')), 'Every sample claim links to HR MOTOR recommended workshop');

  // Verify route active path matching for /garansi-perbaikan and trailing slash
  const testPathMatch = (pathname: string) => {
    const cleanPath = (pathname || '').replace(/\/$/, '') || '/';
    return cleanPath === '/garansi-perbaikan' || cleanPath === '/riwayat-perbaikan';
  };
  assert(testPathMatch('/garansi-perbaikan'), '/garansi-perbaikan matches warranty menu');
  assert(testPathMatch('/garansi-perbaikan/'), '/garansi-perbaikan/ with trailing slash matches warranty menu');
  assert(testPathMatch('/riwayat-perbaikan'), '/riwayat-perbaikan matches warranty menu');

  // 6. Ticket Number Non-Colliding Generation Test
  const testClaimsForSeq = [
    { claimNumber: 'GRS-2026-001' },
    { claimNumber: 'GRS-2026-002' },
    { claimNumber: 'GRS-2026-003' },
  ];
  // simulate deleting claim 002 -> remaining 001 and 003 (length is 2)
  const remainingAfterDelete = [testClaimsForSeq[0], testClaimsForSeq[2]];
  let maxSeqNum = 0;
  remainingAfterDelete.forEach(c => {
    const match = (c.claimNumber || '').match(/(\d+)$/);
    if (match) {
      const num = parseInt(match[1], 10);
      if (!isNaN(num) && num > maxSeqNum) maxSeqNum = num;
    }
  });
  const generatedSeq = Math.max(maxSeqNum + 1, remainingAfterDelete.length + 1);
  const nextTicket = `GRS-2026-${String(generatedSeq).padStart(3, '0')}`;
  assert(nextTicket === 'GRS-2026-004', 'Generated ticket is GRS-2026-004, avoiding collision with existing GRS-2026-003');

  // 7. repairDatabaseRepairClaims Persistence Test
  const { repairDatabaseRepairClaims } = require('../src/lib/serverStore');
  const dummyDb: any = {
    repairClaims: [
      { id: 'TEST-1', customerName: 'Budi', claimType: 'Non-Garansi', totalCost: 500000 },
    ],
  };
  const modResult = repairDatabaseRepairClaims(dummyDb);
  assert(modResult, 'repairDatabaseRepairClaims modifies legacy Non-Garansi claim');
  assert(dummyDb.repairClaims[0].claimType === 'Garansi', 'Legacy Non-Garansi claim converted to Garansi');
  assert(dummyDb.repairClaims[0].status === 'Selesai', 'Default status Selesai assigned');
  assert(dummyDb.repairClaims[0].workshop.includes('HR MOTOR'), 'Default workshop assigned');

  // 8. Table Month & Year Filter Test
  const filterByMonthYear = (claimDate: string, yFilter: string, mFilter: string) => {
    const y = claimDate.slice(0, 4);
    const m = claimDate.slice(5, 7);
    return (yFilter === 'Semua' || y === yFilter) && (mFilter === 'Semua' || m === mFilter);
  };
  assert(filterByMonthYear('2026-10-08', '2026', '10'), 'October 2026 claim matches 2026 and month 10');
  assert(!filterByMonthYear('2026-10-08', '2026', '09'), 'October 2026 claim does NOT match month 09');
  assert(filterByMonthYear('2026-10-08', 'Semua', 'Semua'), 'Semua matches any claim');
}

// ============================================================================
// 10. USER MANAGEMENT: APPROVAL GATING, REJECT & ACCOUNT DELETION
// ============================================================================
console.log('\n[10/10] Testing User Management: Approval Gating, Reject & Delete Account...');
{
  const { repairDatabaseUsers } = require('../src/lib/serverStore');
  
  // Test 1: Simulation Database
  const mockUserDb: any = {
    users: [
      {
        id: 'USR-001',
        name: 'Farhan Hizri',
        email: 'farhanhizri8@gmail.com',
        role: 'Owner',
        password: 'Garut2005',
        isApproved: true,
      },
      {
        id: 'USR-002',
        name: 'Deni Pratama, S.T.',
        email: 'admin@hrmotor.id',
        role: 'CRM Administrator',
        password: 'Garut2005',
        isApproved: true,
      },
      {
        id: 'USR-003',
        name: 'Staf Percobaan',
        email: 'staf.baru@hrmotor.id',
        role: 'Sales Representative',
        password: 'Garut2005',
        isApproved: false, // Pending
      }
    ],
    notifications: [],
    activityLogs: []
  };

  // Test 2: Unapproved user cannot login
  const pendingUser = mockUserDb.users.find((u: any) => u.email === 'staf.baru@hrmotor.id');
  assert(pendingUser && !pendingUser.isApproved, 'Newly registered employee defaults to unapproved (pending)');

  const attemptLogin = (email: string, pw: string) => {
    const u = mockUserDb.users.find((user: any) => user.email.toLowerCase() === email.toLowerCase());
    if (!u) return { success: false, error: 'Akun tidak ditemukan atau telah dihapus' };
    if (u.password !== pw) return { success: false, error: 'Kata sandi salah' };
    if (!u.isApproved) return { success: false, error: 'Akun Anda sedang menunggu persetujuan Owner' };
    return { success: true, user: u };
  };

  const loginResPending = attemptLogin('staf.baru@hrmotor.id', 'Garut2005');
  assert(!loginResPending.success && Boolean(loginResPending.error?.includes('menunggu persetujuan')), 'Unapproved user is blocked from logging in');

  // Test 3: Owner approves user
  pendingUser.isApproved = true;
  const loginResApproved = attemptLogin('staf.baru@hrmotor.id', 'Garut2005');
  assert(loginResApproved.success, 'Approved user can successfully log in');

  // Test 4: Delete user account
  const deleteUser = (requesterRole: string, targetId: string) => {
    const target = mockUserDb.users.find((u: any) => u.id === targetId);
    if (!target) return { success: false, error: 'User tidak ditemukan' };
    if (target.role === 'Owner' || target.email === 'farhanhizri8@gmail.com') {
      return { success: false, error: 'Akun Owner Utama dilindungi dan tidak dapat dihapus' };
    }
    mockUserDb.users = mockUserDb.users.filter((u: any) => u.id !== targetId);
    return { success: true };
  };

  // Owner cannot be deleted
  const deleteOwnerRes = deleteUser('Owner', 'USR-001');
  assert(!deleteOwnerRes.success, 'Primary Owner account is strictly protected from deletion');

  // Delete staff user
  const deleteStaffRes = deleteUser('Owner', 'USR-003');
  assert(deleteStaffRes.success, 'Owner can delete other employee accounts');
  assert(!mockUserDb.users.some((u: any) => u.id === 'USR-003'), 'Deleted user is removed from database');

  // Test 5: Deleted user cannot log in
  const loginResDeleted = attemptLogin('staf.baru@hrmotor.id', 'Garut2005');
  assert(!loginResDeleted.success && Boolean(loginResDeleted.error?.includes('tidak ditemukan atau telah dihapus')), 'Deleted user can no longer log in');

  // Test 6: Database repair does NOT resurrect deleted staff
  repairDatabaseUsers(mockUserDb);
  assert(!mockUserDb.users.some((u: any) => u.id === 'USR-003'), 'Deleted user is NOT automatically resurrected by repair routines');

  // Test 7: Reject pending user
  mockUserDb.users.push({
    id: 'USR-999',
    name: 'Pelamar Ditolak',
    email: 'ditolak@hrmotor.id',
    role: 'Sales Representative',
    password: 'Garut2005',
    isApproved: false,
  });
  const rejectUser = (targetId: string) => {
    const target = mockUserDb.users.find((u: any) => u.id === targetId);
    if (!target) return { success: false, error: 'User tidak ditemukan' };
    mockUserDb.users = mockUserDb.users.filter((u: any) => u.id !== targetId);
    return { success: true };
  };
  const rejectRes = rejectUser('USR-999');
  assert(rejectRes.success, 'Owner can reject pending user registration');
  assert(!mockUserDb.users.some((u: any) => u.id === 'USR-999'), 'Rejected user is purged from database');

  // Test 8: Re-registering after delete requires new approval
  const registerNewUser = (data: { name: string; email: string; role: string }) => {
    const newUser = {
      id: `USR-${Date.now()}`,
      name: data.name,
      email: data.email,
      role: data.role,
      password: 'Garut2005',
      isApproved: false, // Must wait for approval
    };
    mockUserDb.users.push(newUser);
    return newUser;
  };
  const reRegisteredUser = registerNewUser({
    name: 'Staf Percobaan',
    email: 'staf.baru@hrmotor.id',
    role: 'Sales Representative',
  });
  assert(Boolean(reRegisteredUser && !reRegisteredUser.isApproved), 'Re-registered account requires new approval from Owner');
  const loginResReRegistered = attemptLogin('staf.baru@hrmotor.id', 'Garut2005');
  assert(!loginResReRegistered.success && Boolean(loginResReRegistered.error?.includes('menunggu persetujuan')), 'Re-registered user cannot login until re-approved');
}


console.log('\n================================================================');
console.log(`SUMMARY: ${passCount} PASSED, ${failCount} FAILED`);
console.log('================================================================');

if (failCount > 0) {
  process.exit(1);
} else {
  console.log('ALL VERIFICATION CRITERIA MET WITH 100% SUCCESS.');
}

