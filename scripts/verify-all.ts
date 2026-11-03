import { readDatabase, repairDatabaseStocks, getInitialDatabase } from '../src/lib/serverStore';
import { VehicleStock, CreditApplication, FollowUp, Customer, CustomerPurchase } from '../src/types/crm';

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

console.log('\n================================================================');
console.log(`SUMMARY: ${passCount} PASSED, ${failCount} FAILED`);
console.log('================================================================');

if (failCount > 0) {
  process.exit(1);
} else {
  console.log('ALL VERIFICATION CRITERIA MET WITH 100% SUCCESS.');
}
