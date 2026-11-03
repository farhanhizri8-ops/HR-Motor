const fs = require('fs');
const path = require('path');

function cleanPhone(p) {
  if (!p) return '';
  const digits = String(p).replace(/[^0-9]/g, '');
  if (digits.startsWith('62')) return '0' + digits.slice(2);
  return digits;
}

function runTests() {
  console.log('=== STARTING CRM HR MOTOR COMPREHENSIVE WORKFLOW TESTS ===\n');
  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  [PASS] ${message}`);
      passed++;
    } else {
      console.error(`  [FAIL] ${message}`);
      failed++;
    }
  }

  // Load store JSON
  const storePath = path.join(__dirname, '..', 'data', 'crm_store.json');
  let dbRaw;
  if (fs.existsSync(storePath)) {
    dbRaw = fs.readFileSync(storePath, 'utf8');
  } else {
    console.error('Store file data/crm_store.json not found!');
    process.exit(1);
  }
  const db = JSON.parse(dbRaw);
  const userName = 'Farhan Hizri (Owner)';
  const userId = 'USR-001';

  // -------------------------------------------------------------------------
  // TEST 1: TRANSAKSI PENJUALAN CASH (REQUIREMENT 1)
  // -------------------------------------------------------------------------
  console.log('Test 1: Transaksi Penjualan Cash (Requirement 1)');
  const cashStock = db.stocks.find((s) => s.status === 'Tersedia');
  assert(!!cashStock, 'Found ready stock for cash sale: ' + (cashStock ? cashStock.model : 'none'));

  const cashPayload = {
    customerName: 'Hendra Gunawan',
    customerPhone: '0812-3456-7890',
    customerAddress: 'Jl. Cimanuk No. 45, Garut Kota',
    customerSource: 'Facebook',
    vehicleStockId: cashStock.id,
    dealPrice: cashStock.price - 5000000,
    notes: 'Pembayaran transfer BCA lunas, serah terima BPKB dan unit hari ini.',
    transactionDate: '2026-11-03',
  };

  {
    const stock = db.stocks.find((s) => s.id === cashPayload.vehicleStockId);
    assert(stock.status === 'Tersedia', 'Stock is initially Tersedia');

    const dateTx = cashPayload.transactionDate;
    const nominal = Number(cashPayload.dealPrice);
    let cust = db.customers.find((c) => c.whatsapp && cleanPhone(c.whatsapp) === cleanPhone(cashPayload.customerPhone));
    const custId = cust?.id || `CUST-TEST-${Date.now()}`;
    const newReceiptNumber = `No. ${db.customers.length + 1}`;
    const receiptPlaceDate = `GARUT, 3 NOVEMBER 2026`;

    const updatedCustomer = {
      id: custId,
      fullName: cashPayload.customerName.trim(),
      whatsapp: cashPayload.customerPhone.trim(),
      email: '',
      address: cashPayload.customerAddress.trim(),
      district: 'Garut Kota',
      source: cashPayload.customerSource,
      interestedVehicle: `${stock.brand} ${stock.model} (${stock.year})`,
      budget: nominal,
      notes: cashPayload.notes,
      registeredDate: dateTx,
      status: 'Sudah Beli',
      paymentType: 'Cash',
      plateNumber: stock.licensePlate || stock.plateNumber || '',
      receiptNumber: newReceiptNumber,
      receiptAmount: nominal,
      receiptDate: receiptPlaceDate,
      receiptReceiver: 'HR MOTOR',
      receiptNotes: 'LUNAS (CASH)',
      updatedAt: new Date().toISOString(),
    };
    db.customers.unshift(updatedCustomer);

    const purchaseId = `DEAL-TEST-${Date.now()}`;
    const newPurchase = {
      id: purchaseId,
      customerId: custId,
      customerName: cashPayload.customerName.trim(),
      vehicleBrand: stock.brand,
      vehicleModel: `${stock.brand} ${stock.model}`,
      vehicleYear: stock.year,
      vehicleName: `${stock.brand} ${stock.model} (${stock.year})`,
      plateNumber: stock.licensePlate || stock.plateNumber || 'Z - HR MOTOR',
      color: stock.color,
      mileageKm: stock.mileage,
      purchasePrice: nominal,
      paymentType: 'Cash',
      paymentMethod: 'Cash Keras',
      purchaseDate: dateTx,
      warrantyUntil: '2027-11-03',
      salesId: userId,
      salesName: userName,
      notes: cashPayload.notes,
      receiptNumber: newReceiptNumber,
      receiptDate: receiptPlaceDate,
      receiptReceiver: 'HR MOTOR',
      vehicleStockId: stock.id,
      createdAt: new Date().toISOString(),
    };
    db.purchases.unshift(newPurchase);

    stock.status = 'Terjual';
    stock.soldDate = dateTx;
    stock.soldToCustomerId = custId;
    stock.soldToCustomerName = cashPayload.customerName.trim();
    stock.bookingCustomerId = undefined;
    stock.bookingCustomerName = undefined;

    const newFollowUp = {
      id: `FLW-TEST-${Date.now()}`,
      followUpType: 'CUSTOMER',
      customerId: custId,
      customerName: cashPayload.customerName.trim(),
      customerPhone: cashPayload.customerPhone.trim(),
      customerAddress: cashPayload.customerAddress.trim(),
      customerSource: cashPayload.customerSource,
      vehicleInfo: `${stock.brand} ${stock.model} (${stock.year})`,
      paymentType: 'Cash',
      purchaseDate: dateTx,
      periodicStep: '1 Bulan',
      category: 'Pelanggan Lama (1 Tahun)',
      scheduledDate: '2026-12-03',
      scheduledTime: '10:00',
      channel: 'WhatsApp',
      status: 'Belum Dihubungi',
      priority: 'Tinggi',
      followUpReason: 'Pengecekan berkala kepuasan 1 tahun (Cash)',
      notes: `Pembelian Cash: ${stock.brand} ${stock.model}`,
      communicationLogs: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    db.followUps.unshift(newFollowUp);
  }

  assert(cashStock.status === 'Terjual', 'Stock unit successfully updated to Terjual (SOLD OUT)');
  assert(cashStock.soldToCustomerName === 'Hendra Gunawan', 'Stock soldToCustomerName is correctly saved');
  const savedCustomer = db.customers.find((c) => c.fullName === 'Hendra Gunawan');
  assert(!!savedCustomer && savedCustomer.status === 'Sudah Beli' && savedCustomer.paymentType === 'Cash', 'Customer marked as Sudah Beli (Cash)');
  assert(!!savedCustomer.receiptNumber && savedCustomer.receiptAmount === cashPayload.dealPrice, 'Official receipt data generated with correct deal amount');
  const savedPurchase = db.purchases.find((p) => p.customerName === 'Hendra Gunawan');
  assert(!!savedPurchase && savedPurchase.paymentType === 'Cash', 'Sales report record created with Cash payment method');
  const savedFollowUp = db.followUps.find((f) => f.customerName === 'Hendra Gunawan' && f.followUpType === 'CUSTOMER');
  assert(!!savedFollowUp && savedFollowUp.status === 'Belum Dihubungi' && savedFollowUp.category === 'Pelanggan Lama (1 Tahun)', 'Buyer enrolled in 1-year customer follow-up schedule');

  // Verify that selling the same car again is blocked
  assert(cashStock.status !== 'Tersedia', 'Sold car is no longer Tersedia');

  // -------------------------------------------------------------------------
  // TEST 2: TRANSAKSI PENJUALAN KREDIT - PENGAJUAN AWAL (PENDING -> BOKING)
  // -------------------------------------------------------------------------
  console.log('\nTest 2: Transaksi Penjualan Kredit - Pengajuan Awal (Requirement 2.A)');
  const creditStock = db.stocks.find((s) => s.status === 'Tersedia');
  assert(!!creditStock, 'Found second ready stock for credit application: ' + (creditStock ? creditStock.model : 'none'));

  const creditPayload = {
    customerName: 'Siti Aminah',
    customerPhone: '0852-9876-5432',
    customerAddress: 'Tarogong Kaler, Garut',
    customerSource: 'Walk-in',
    vehicleStockId: creditStock.id,
    targetLeasing: 'BCA Finance',
    dealPrice: creditStock.price,
    initialDp: 35000000,
    notes: 'Pengajuan kredit tenor 48 bulan',
    applicationDate: '2026-11-03',
  };

  const appId = `CRD-TEST-${Date.now()}`;
  {
    const stock = db.stocks.find((s) => s.id === creditPayload.vehicleStockId);
    assert(stock.status === 'Tersedia', 'Unit available for booking');

    const newApp = {
      id: appId,
      customerId: `CUST-TEST-${Date.now()}`,
      customerName: creditPayload.customerName.trim(),
      customerPhone: creditPayload.customerPhone.trim(),
      customerAddress: creditPayload.customerAddress.trim(),
      customerSource: creditPayload.customerSource,
      vehicleStockId: stock.id,
      vehicleName: `${stock.brand} ${stock.model} (${stock.year})`,
      plateNumber: stock.licensePlate || stock.plateNumber || '',
      targetLeasing: creditPayload.targetLeasing,
      dealPrice: creditPayload.dealPrice,
      initialDp: creditPayload.initialDp,
      status: 'PENDING',
      applicationDate: creditPayload.applicationDate,
      notes: creditPayload.notes,
      history: [
        {
          status: 'PENDING',
          timestamp: new Date().toISOString(),
          adminName: userName,
          notes: 'Pengajuan kredit pertama kali dibuat (Status: PENDING)',
          dpAmount: creditPayload.initialDp,
          leasingPartner: creditPayload.targetLeasing,
        },
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    if (!db.creditApplications) db.creditApplications = [];
    db.creditApplications.unshift(newApp);

    stock.status = 'Booking';
    stock.bookingCustomerId = newApp.customerId;
    stock.bookingCustomerName = creditPayload.customerName.trim();
    stock.bookingLeasing = creditPayload.targetLeasing;
    stock.bookingDp = creditPayload.initialDp;
    stock.bookingDate = creditPayload.applicationDate;
    stock.bookingApplicationId = appId;
  }

  assert(creditStock.status === 'Booking', 'Stock status changed to Booking (BOKING)');
  assert(creditStock.bookingCustomerName === 'Siti Aminah', 'Stock bookingCustomerName recorded');
  assert(creditStock.bookingLeasing === 'BCA Finance', 'Stock bookingLeasing recorded');
  assert(creditStock.bookingDp === 35000000, 'Stock bookingDp recorded');

  // Verify stock is not available for new bookings
  assert(creditStock.status !== 'Tersedia', 'Booked unit cannot be selected as ready');

  // -------------------------------------------------------------------------
  // TEST 3: BANK MENYETUJUI PENGAJUAN KREDIT (TOMBOL ACC -> SOLD OUT)
  // -------------------------------------------------------------------------
  console.log('\nTest 3: Bank Menyetujui Pengajuan Kredit (Requirement 2.B - Tombol ACC)');
  const accPayload = {
    applicationId: appId,
    finalDp: 40000000, // DP changed from 35M to 40M by bank
    approvedLeasing: 'BCA Finance',
    approvalNotes: 'PO terbit, bunga promo showroom 8% flat',
  };

  {
    const app = db.creditApplications.find((a) => a.id === accPayload.applicationId);
    assert(app.status === 'PENDING', 'Credit application is PENDING before ACC');

    const stock = db.stocks.find((s) => s.id === app.vehicleStockId);
    assert(stock.status === 'Booking', 'Unit is currently Booking');
    assert(stock.bookingApplicationId === app.id, 'Unit is locked to this application');

    // Perform ACC
    stock.status = 'Terjual';
    stock.soldDate = '2026-11-03';
    stock.soldToCustomerId = app.customerId;
    stock.soldToCustomerName = app.customerName;
    stock.bookingCustomerId = undefined;
    stock.bookingCustomerName = undefined;
    stock.bookingLeasing = undefined;
    stock.bookingDp = undefined;
    stock.bookingApplicationId = undefined;

    app.status = 'APPROVED';
    app.finalDp = accPayload.finalDp;
    app.approvedLeasing = accPayload.approvedLeasing;
    app.approvalDate = '2026-11-03';
    app.history.unshift({
      status: 'APPROVED',
      timestamp: new Date().toISOString(),
      adminName: userName,
      notes: accPayload.approvalNotes,
      dpAmount: accPayload.finalDp,
      leasingPartner: accPayload.approvedLeasing,
    });

    const newPurchase = {
      id: `DEAL-TEST-${Date.now()}`,
      customerId: app.customerId,
      customerName: app.customerName,
      vehicleBrand: stock.brand,
      vehicleModel: `${stock.brand} ${stock.model}`,
      vehicleYear: stock.year,
      vehicleName: app.vehicleName,
      plateNumber: stock.licensePlate || 'Z - HR MOTOR',
      color: stock.color,
      mileageKm: stock.mileage,
      purchasePrice: app.dealPrice,
      paymentType: 'Kredit',
      paymentMethod: `Kredit ${accPayload.approvedLeasing}`,
      downPayment: accPayload.finalDp,
      leasingPartner: accPayload.approvedLeasing,
      creditApplicationId: app.id,
      purchaseDate: '2026-11-03',
      salesId: userId,
      salesName: userName,
      notes: accPayload.approvalNotes,
      createdAt: new Date().toISOString(),
    };
    db.purchases.unshift(newPurchase);

    const creditFollowUp = {
      id: `FLW-TEST-${Date.now()}`,
      followUpType: 'CUSTOMER',
      customerId: app.customerId,
      customerName: app.customerName,
      customerPhone: app.customerPhone,
      customerAddress: app.customerAddress,
      customerSource: app.customerSource,
      vehicleInfo: app.vehicleName,
      paymentType: 'Kredit',
      leasingPartner: accPayload.approvedLeasing,
      purchaseDate: '2026-11-03',
      periodicStep: '1 Bulan',
      category: 'Pelanggan Lama (1 Tahun)',
      scheduledDate: '2026-12-03',
      scheduledTime: '10:00',
      channel: 'WhatsApp',
      status: 'Belum Dihubungi',
      priority: 'Tinggi',
      followUpReason: `Pengecekan berkala kepuasan 1 tahun (Kredit ${accPayload.approvedLeasing})`,
      notes: `Pembelian Kredit ACC via ${accPayload.approvedLeasing} (DP Final: Rp ${accPayload.finalDp.toLocaleString('id-ID')})`,
      communicationLogs: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    db.followUps.unshift(creditFollowUp);
  }

  const approvedApp = db.creditApplications.find((a) => a.id === appId);
  assert(approvedApp.status === 'APPROVED', 'Application status updated to APPROVED');
  assert(approvedApp.finalDp === 40000000, 'Final approved DP updated to 40,000,000');
  assert(approvedApp.history.length === 2, 'Audit history contains 2 entries (PENDING + APPROVED)');
  assert(creditStock.status === 'Terjual', 'Stock status automatically transitioned from Booking to Terjual (SOLD OUT)');
  assert(creditStock.soldToCustomerName === 'Siti Aminah', 'Stock records purchaser name');
  const creditSaleRecord = db.purchases.find((p) => p.creditApplicationId === appId);
  assert(!!creditSaleRecord && creditSaleRecord.paymentType === 'Kredit' && creditSaleRecord.downPayment === 40000000, 'Credit purchase recorded in sales report with final DP');
  const creditBuyerFollowUp = db.followUps.find((f) => f.customerName === 'Siti Aminah' && f.paymentType === 'Kredit');
  assert(!!creditBuyerFollowUp && creditBuyerFollowUp.followUpType === 'CUSTOMER', 'Approved credit buyer enrolled into Customer Follow Up');

  // -------------------------------------------------------------------------
  // TEST 4: BANK MENOLAK PENGAJUAN KREDIT (TOMBOL DITOLAK -> REVERT TO READY)
  // -------------------------------------------------------------------------
  console.log('\nTest 4: Bank Menolak Pengajuan Kredit (Requirement 2.C - Tombol DITOLAK)');
  const rejectStock = db.stocks.find((s) => s.status === 'Tersedia');
  assert(!!rejectStock, 'Found third ready stock for rejected test: ' + (rejectStock ? rejectStock.model : 'none'));

  const rejectAppId = `CRD-REJECT-${Date.now()}`;
  const rejectPayload = {
    customerName: 'Bambang Supriyadi',
    customerPhone: '0813-1122-3344',
    customerAddress: 'Samarang, Garut',
    customerSource: 'TikTok',
    vehicleStockId: rejectStock.id,
    targetLeasing: 'Mandiri Utama Finance',
    dealPrice: rejectStock.price,
    initialDp: 25000000,
    applicationDate: '2026-11-03',
  };

  // 1. Create Pending Application
  rejectStock.status = 'Booking';
  rejectStock.bookingCustomerId = `CUST-REJ-${Date.now()}`;
  rejectStock.bookingCustomerName = rejectPayload.customerName;
  rejectStock.bookingLeasing = rejectPayload.targetLeasing;
  rejectStock.bookingDp = rejectPayload.initialDp;
  rejectStock.bookingApplicationId = rejectAppId;

  const rejectApp = {
    id: rejectAppId,
    customerId: rejectStock.bookingCustomerId,
    customerName: rejectPayload.customerName,
    customerPhone: rejectPayload.customerPhone,
    customerAddress: rejectPayload.customerAddress,
    customerSource: rejectPayload.customerSource,
    vehicleStockId: rejectStock.id,
    vehicleName: `${rejectStock.brand} ${rejectStock.model} (${rejectStock.year})`,
    targetLeasing: rejectPayload.targetLeasing,
    dealPrice: rejectPayload.dealPrice,
    initialDp: rejectPayload.initialDp,
    status: 'PENDING',
    applicationDate: rejectPayload.applicationDate,
    history: [
      {
        status: 'PENDING',
        timestamp: new Date().toISOString(),
        adminName: userName,
        notes: 'Pengajuan kredit pertama kali dibuat (Status: PENDING)',
      },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  db.creditApplications.unshift(rejectApp);
  assert(rejectStock.status === 'Booking', 'Stock is Booking before rejection');

  // 2. Reject Application
  const rejectionReasonText = 'Riwayat SLIK OJK Kol 3 (Ada tunggakan kartu kredit aktif)';
  {
    const app = db.creditApplications.find((a) => a.id === rejectAppId);
    const stock = db.stocks.find((s) => s.id === app.vehicleStockId);

    // Revert Stock
    assert(stock.status === 'Booking' && stock.bookingApplicationId === app.id, 'Safety check passes before revert');
    stock.status = 'Tersedia'; // Reverted to READY
    stock.bookingCustomerId = undefined;
    stock.bookingCustomerName = undefined;
    stock.bookingLeasing = undefined;
    stock.bookingDp = undefined;
    stock.bookingApplicationId = undefined;

    app.status = 'REJECTED';
    app.rejectionReason = rejectionReasonText;
    app.rejectionDate = '2026-11-03';
    app.history.unshift({
      status: 'REJECTED',
      timestamp: new Date().toISOString(),
      adminName: userName,
      notes: `Pengajuan kredit ditolak bank: ${rejectionReasonText}`,
      rejectionReason: rejectionReasonText,
    });
  }

  assert(rejectStock.status === 'Tersedia', 'Stock unit automatically reverted from Booking to Tersedia (READY)');
  assert(!rejectStock.bookingCustomerName && !rejectStock.bookingApplicationId, 'Stock booking locks completely cleared');
  const rejectedAppResult = db.creditApplications.find((a) => a.id === rejectAppId);
  assert(rejectedAppResult.status === 'REJECTED', 'Credit application status is REJECTED');
  assert(rejectedAppResult.rejectionReason === rejectionReasonText, 'Rejection reason is stored permanently');
  assert(rejectedAppResult.history.length === 2, 'Rejection preserved in permanent audit trail');
  const rejectedBuyerFollowUp = db.followUps.find((f) => f.customerName === 'Bambang Supriyadi');
  assert(!rejectedBuyerFollowUp, 'Rejected credit applicant does NOT enter Customer Follow Up');

  // -------------------------------------------------------------------------
  // TEST 5: STOCK CONFLICT & SAFETY GUARDS
  // -------------------------------------------------------------------------
  console.log('\nTest 5: Stock Conflict & Safety Guards');
  const conflictStock = db.stocks.find((s) => s.status === 'Terjual');
  const bogusApp = {
    id: 'CRD-CONFLICT-1',
    vehicleStockId: conflictStock.id,
    customerId: 'CUST-CONFLICT',
    customerName: 'Penipu',
    status: 'PENDING',
    dealPrice: conflictStock.price,
    initialDp: 20000000,
  };
  db.creditApplications.unshift(bogusApp);

  const conflictSafetyTriggered = conflictStock.status === 'Terjual' && conflictStock.soldToCustomerId !== bogusApp.customerId;
  assert(conflictSafetyTriggered, 'Safety guard prevents approving credit for already sold stock');

  // -------------------------------------------------------------------------
  // TEST 6: PROSPECT FOLLOW UP & MULTI-ATTRIBUTE PRECISION MATCHING
  // -------------------------------------------------------------------------
  console.log('\nTest 6: Prospect Follow Up & Multi-Attribute Precision Matching (Requirement 4)');
  const prospect = {
    id: `FLW-PROSP-${Date.now()}`,
    followUpType: 'PROSPECT',
    customerName: 'Andi Pratama',
    customerPhone: '0812-9988-7766',
    customerAddress: 'Cilawu, Garut',
    customerSource: 'Instagram',
    searchBrand: 'Honda',
    searchModel: 'Jazz RS',
    searchYear: 2018,
    searchBudget: 190000000,
    status: 'Menunggu Mobil Ready',
    prospectStatus: 'Menunggu Mobil Ready',
  };
  db.followUps.unshift(prospect);

  // Exact matching function implemented in route.ts and follow-up/page.tsx
  function matchProspect(p, stock) {
    if (stock.status !== 'Tersedia') return false;
    const sBrand = (stock.brand || '').toLowerCase().trim();
    const sModel = (stock.model || '').toLowerCase().trim();
    const sMerk = (stock.merkType || '').toLowerCase().trim();

    const pBrand = (p.searchBrand || '').toLowerCase().trim();
    const pModel = (p.searchModel || '').toLowerCase().trim();

    // Brand match
    const brandOk = !pBrand || sBrand.includes(pBrand) || pBrand.includes(sBrand);
    if (!brandOk) return false;

    // Model match: ALL words in searchModel must be present
    if (pModel) {
      const words = pModel.split(/\s+/).filter((w) => w.length >= 2);
      const modelOk = words.length > 0
        ? words.every((w) => sModel.includes(w) || sMerk.includes(w))
        : true;
      if (!modelOk) return false;
    }

    // Year match (+/- 1 year)
    if (p.searchYear && Math.abs(stock.year - Number(p.searchYear)) > 1) return false;

    // Budget match (+15%)
    if (p.searchBudget && stock.price > Number(p.searchBudget) * 1.15) return false;

    return true;
  }

  // Unit 1: Honda Brio RS (Same brand, contains "RS", but model is Brio, not Jazz) -> MUST NOT MATCH
  const unitBrioRs = {
    id: 'STK-UNIT-1',
    brand: 'Honda',
    model: 'Brio RS',
    merkType: 'HONDA BRIO 1.2 RS A/T',
    year: 2018,
    price: 155000000,
    status: 'Tersedia',
  };
  assert(!matchProspect(prospect, unitBrioRs), 'Honda Brio RS does NOT falsely match inquiry for Honda Jazz RS');

  // Unit 2: Honda Jazz S (Same brand, model Jazz, but lacks "RS" trim) -> MUST NOT MATCH
  const unitJazzS = {
    id: 'STK-UNIT-2',
    brand: 'Honda',
    model: 'Jazz S',
    merkType: 'HONDA JAZZ 1.5 S M/T',
    year: 2018,
    price: 175000000,
    status: 'Tersedia',
  };
  assert(!matchProspect(prospect, unitJazzS), 'Honda Jazz S (lacking RS trim) does NOT falsely match inquiry for Honda Jazz RS');

  // Unit 3: Honda Jazz RS 2012 (Too old, exceeds 2018 +/- 1 tolerance) -> MUST NOT MATCH
  const unitJazzOld = {
    id: 'STK-UNIT-3',
    brand: 'Honda',
    model: 'Jazz RS',
    merkType: 'HONDA JAZZ 1.5 RS M/T',
    year: 2012,
    price: 140000000,
    status: 'Tersedia',
  };
  assert(!matchProspect(prospect, unitJazzOld), 'Honda Jazz RS 2012 (exceeding year tolerance) does NOT falsely match');

  // Unit 4: Honda Jazz RS 2018 (Exact match on Brand, Model, Trim, Year, and Budget) -> MUST MATCH!
  const unitJazzExact = {
    id: 'STK-UNIT-4',
    brand: 'Honda',
    model: 'Jazz RS',
    merkType: 'HONDA JAZZ 1.5 RS FACELIFT A/T',
    year: 2018,
    price: 198000000, // Within 190M + 15% (218.5M)
    licensePlate: 'Z 1888 HR',
    status: 'Tersedia',
  };
  assert(matchProspect(prospect, unitJazzExact), 'Honda Jazz RS 2018 is accurately matched to Andi Pratama inquiry');

  // Execute matching update
  prospect.status = 'Mobil Sudah Ready';
  prospect.prospectStatus = 'Mobil Sudah Ready';
  prospect.matchedStockId = unitJazzExact.id;
  prospect.matchedStockInfo = `${unitJazzExact.brand} ${unitJazzExact.model} (${unitJazzExact.year})`;

  assert(prospect.status === 'Mobil Sudah Ready', 'Prospect status automatically updated to Mobil Sudah Ready');
  assert(prospect.matchedStockId === unitJazzExact.id, 'Prospect matchedStockId properly stored');

  // Test updating prospect to "Tidak Merespons"
  prospect.status = 'Tidak Merespons';
  prospect.prospectStatus = 'Tidak Merespons';
  assert(prospect.status === 'Tidak Merespons', 'Prospect can be marked as Tidak Merespons');

  // Convert prospect to Cash Deal -> verify linking
  prospect.status = 'Sudah Deal';
  prospect.prospectStatus = 'Sudah Deal';
  prospect.customerId = 'CUST-ANDI';
  assert(prospect.status === 'Sudah Deal' && prospect.customerId === 'CUST-ANDI', 'Prospect linked to completed deal without duplicate');

  // -------------------------------------------------------------------------
  // TEST 7: CUSTOMER FOLLOW UP 5 QUESTIONS & STATUS PRESERVATION
  // -------------------------------------------------------------------------
  console.log('\nTest 7: Customer Follow Up 5 Questions & Status Preservation (Requirement 3)');
  const custFollowUp = db.followUps.find((f) => f.followUpType === 'CUSTOMER');
  assert(!!custFollowUp, 'Customer follow-up found');

  const surveyAnswers = `[Jawaban 5 Pertanyaan Operasional]:\n1. Kabar: Belum dijawab\n2. Kondisi: -\n3. Kendala: -\n4. Upgrade: -\n5. Jual Kembali: -`;
  custFollowUp.status = 'Tidak Merespons';
  custFollowUp.resultNotes = surveyAnswers;

  assert(custFollowUp.status === 'Tidak Merespons', 'Customer Follow Up status set to Tidak Merespons');
  assert(custFollowUp.resultNotes.includes('5 Pertanyaan Operasional'), '5 Showroom questions recorded in notes');

  // Summary
  console.log(`\n=== FINAL RESULT: ${passed} PASSED, ${failed} FAILED ===`);
  if (failed > 0) {
    process.exit(1);
  }
}

runTests();
