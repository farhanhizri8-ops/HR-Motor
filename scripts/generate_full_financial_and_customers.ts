import fs from 'fs';
import { parseCsvLine, cleanText, parseCurrency } from './parse_full_data';
import { Customer, CustomerPurchase, UnitFinancialRecord, CashFlowRecord, Investor, PayrollCommissionRecord, LeadSourceType } from '../src/types/crm';
import { INITIAL_CUSTOMERS as LEGACY_CUSTOMERS, INITIAL_PURCHASES as LEGACY_PURCHASES } from '../src/lib/seedData';

// Format Indonesian date to YYYY-MM-DD
function parseIndoDate(dateStr: string): string {
  if (!dateStr) return '2026-01-01';
  const cleaned = cleanText(dateStr);
  
  // Format: "16/04/2026" or "16-04-2026"
  const slashMatch = cleaned.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
  if (slashMatch) {
    const d = slashMatch[1].padStart(2, '0');
    const m = slashMatch[2].padStart(2, '0');
    const y = slashMatch[3];
    return `${y}-${m}-${d}`;
  }

  // Format: "Kamis, Mei 04, 2023" or "Selasa, Februari 20, 2024"
  const monthMap: Record<string, string> = {
    januari: '01', februari: '02', maret: '03', april: '04', mei: '05', juni: '06',
    juli: '07', agustus: '08', september: '09', oktober: '10', november: '11', desember: '12'
  };

  const textMatch = cleaned.match(/(?:[a-zA-Z]+,\s*)?([a-zA-Z]+)\s+(\d{1,2}),?\s+(\d{4})/i);
  if (textMatch) {
    const monthName = textMatch[1].toLowerCase();
    const m = monthMap[monthName] || '01';
    const d = textMatch[2].padStart(2, '0');
    const y = textMatch[3];
    return `${y}-${m}-${d}`;
  }

  return '2026-05-15';
}

function normalizePhone(phone: string): string {
  if (!phone) return '081220553128';
  let cleaned = phone.replace(/[^0-9]/g, '');
  if (cleaned.startsWith('62')) {
    cleaned = '0' + cleaned.slice(2);
  }
  if (!cleaned.startsWith('0')) {
    cleaned = '0' + cleaned;
  }
  return cleaned;
}

async function main() {
  console.log('Generating full financial and correlated customer database...');

  // 1. Direct Customer Sheet (GID 402136895)
  const custRaw = fs.readFileSync('scratch_sheet_402136895.csv', 'utf-8');
  const custLines = custRaw.split('\n');
  const directCustomers: Customer[] = [];
  const directPurchases: CustomerPurchase[] = [];

  for (let i = 0; i < custLines.length; i++) {
    const cols = parseCsvLine(custLines[i]);
    const no = cols[1];
    const date = cols[2];
    const name = cols[3];
    const nik = cols[4];
    const domicile = cols[5];
    const phone = cols[6];
    const car = cols[7];
    const plate = cols[8];
    const price = cols[9];
    const notes = cols[10];

    if (name && name !== 'NAMA' && !name.includes('DATABASE') && (phone || car || price)) {
      const custId = `CUST-DB-${String(directCustomers.length + 1).padStart(3, '0')}`;
      const fullName = cleanText(name);
      const cleanPhone = normalizePhone(phone);
      const cleanDate = parseIndoDate(date);
      const parsedPrice = parseCurrency(price) || 125000000;
      const cleanCar = cleanText(car) || 'Mobil Bekas HR MOTOR';
      const cleanPlate = cleanText(plate) || 'Z ' + (1000 + directCustomers.length) + ' HR';
      const isCredit = cleanText(notes).toUpperCase().includes('OTO') || cleanText(notes).toUpperCase().includes('KREDIT');

      // Extract brand
      const brandMatch = cleanCar.match(/^(TOYOTA|HONDA|DAIHATSU|MITSUBISHI|SUZUKI|NISSAN)/i);
      const brand = brandMatch ? brandMatch[1].toUpperCase() : 'TOYOTA';

      const customer: Customer = {
        id: custId,
        fullName,
        whatsapp: cleanPhone,
        email: `${fullName.toLowerCase().replace(/[^a-z0-9]/g, '')}@gmail.com`,
        address: cleanText(domicile) || 'Garut, Jawa Barat',
        district: cleanText(domicile) || 'Garut',
        source: 'Walk-in',
        interestedVehicle: cleanCar,
        vehicleType: cleanCar.includes('AVANZA') || cleanCar.includes('ERTIGA') || cleanCar.includes('XPANDER') || cleanCar.includes('CALYA') || cleanCar.includes('SIGRA') ? 'MPV' : (cleanCar.includes('RUSH') || cleanCar.includes('TERIOS') || cleanCar.includes('HR-V') || cleanCar.includes('PAJERO') || cleanCar.includes('FORTUNER') ? 'SUV' : 'City Car'),
        budget: parsedPrice,
        notes: `Pembelian Resmi: ${cleanCar} (${cleanPlate}). NIK: ${cleanText(nik)}. Status: ${cleanText(notes) || 'LUNAS'}.`,
        registeredDate: cleanDate,
        status: 'Sudah Beli',
        updatedAt: `${cleanDate}T12:00:00Z`,
        plateNumber: cleanPlate,
        receiptNumber: `KW-HR-${cleanDate.replace(/-/g, '')}-${String(directCustomers.length + 1).padStart(3, '0')}`,
        receiptAmount: parsedPrice,
        receiptDate: cleanDate,
        receiptReceiver: 'Farhan Hizri (Owner HR MOTOR)',
        receiptNotes: `Pelunasan Pembelian ${cleanCar} (${cleanPlate}) - Garansi Showroom Resmi`,
        paymentType: isCredit ? 'Kredit' : 'Cash',
        creditStatus: isCredit ? 'APPROVED' : undefined,
        leasingPartner: isCredit ? 'OTO Multiartha' : undefined,
        downPayment: isCredit ? 15000000 : parsedPrice,
      };

      const purchase: CustomerPurchase = {
        id: `DEAL-DB-${String(directPurchases.length + 1).padStart(3, '0')}`,
        customerId: custId,
        customerName: fullName,
        vehicleBrand: brand,
        vehicleModel: cleanCar,
        vehicleYear: 2020,
        plateNumber: cleanPlate,
        color: 'Sesuai STNK',
        mileageKm: 45000,
        purchasePrice: parsedPrice,
        paymentMethod: isCredit ? 'Kredit OTO Multiartha' : 'Cash Keras',
        purchaseDate: cleanDate,
        warrantyUntil: cleanDate, // 1 month warranty
        salesId: 'USR-001',
        salesName: 'Farhan Hizri (Owner)',
        notes: `Transaksi Deal Pembelian Unit ${cleanCar}. NIK Konsumen: ${cleanText(nik)}`,
        createdAt: `${cleanDate}T12:00:00Z`,
        receiptNumber: customer.receiptNumber,
        receiptDate: cleanDate,
        receiptReceiver: 'Farhan Hizri',
        paymentType: isCredit ? 'Kredit' : 'Cash',
        leasingPartner: isCredit ? 'OTO Multiartha' : undefined,
        downPayment: customer.downPayment,
      };

      directCustomers.push(customer);
      directPurchases.push(purchase);
    }
  }

  console.log(`Extracted ${directCustomers.length} direct customers from GID 402136895`);

  // 2. SPK Customers from GID 1009979304
  const cashRaw = fs.readFileSync('scratch_sheet_1009979304.csv', 'utf-8');
  const cashLines = cashRaw.split('\n');
  const spkCustomers: Customer[] = [];
  const spkPurchases: CustomerPurchase[] = [];
  const cashFlows: CashFlowRecord[] = [];

  for (let i = 0; i < cashLines.length; i++) {
    const cols = parseCsvLine(cashLines[i]);
    
    // Cash flow record (left cols)
    const tgl = cols[1];
    const unit = cols[2];
    const nopol = cols[3];
    const ket = cols[4];
    const nom = cols[5];

    if (tgl && tgl !== 'TANGGAL' && !tgl.includes('PINJAMAN') && (nom || ket)) {
      const parsedNom = parseCurrency(nom);
      if (parsedNom > 0) {
        const cleanTgl = parseIndoDate(tgl);
        const cleanKet = cleanText(ket);
        const cleanUnit = cleanText(unit);
        const cleanNopol = cleanText(nopol);

        let cat: any = 'Perbaikan Unit';
        if (cleanKet.toLowerCase().includes('pajak') || cleanKet.toLowerCase().includes('stnk') || cleanKet.toLowerCase().includes('bpkb')) cat = 'Pajak & Surat';
        else if (cleanKet.toLowerCase().includes('bensin') || cleanKet.toLowerCase().includes('makan') || cleanKet.toLowerCase().includes('bop') || cleanKet.toLowerCase().includes('operasional')) cat = 'BOP & Uang Makan';
        else if (cleanKet.toLowerCase().includes('showroom') || cleanKet.toLowerCase().includes('listrik') || cleanKet.toLowerCase().includes('banner')) cat = 'Operasional Showroom';

        cashFlows.push({
          id: `CF-${String(cashFlows.length + 1).padStart(4, '0')}`,
          date: cleanTgl,
          vehicleInfo: cleanUnit,
          plateNumber: cleanNopol,
          category: cat,
          description: cleanKet || `Biaya ${cleanUnit}`,
          type: 'out',
          amount: parsedNom,
          recordedBy: 'Staf Administrasi Keuangan',
          recipientOrSource: 'Bengkel / Rekanan Showroom',
          notes: cleanUnit ? `Unit: ${cleanUnit} (${cleanNopol})` : 'Operasional Showroom HR MOTOR',
          createdAt: `${cleanTgl}T09:00:00Z`,
        });
      }
    }

    // SPK Customer record (right cols)
    if (cols.length >= 18) {
      const spkDate = cols[16];
      const spkNameLoc = cols[17];
      const spkUnit = cols[18];
      const spkSource = cols[19];
      const spkDp = cols[20];
      const spkLunas = cols[21];
      const spkStatus = cols[23];

      if (spkNameLoc && spkNameLoc !== 'NAMA' && !spkNameLoc.includes('MASUK UANG') && spkUnit) {
        const parts = spkNameLoc.split('|');
        const custName = cleanText(parts[0]);
        const custLoc = parts.length > 1 ? cleanText(parts[1]) : 'Garut';
        const cleanDate = parseIndoDate(spkDate);
        const cleanUnit = cleanText(spkUnit);
        const cleanSource = cleanText(spkSource) || 'TikTok';
        const parsedDp = parseCurrency(spkDp) || 1000000;
        const parsedLunas = parseCurrency(spkLunas);
        const cleanStatus = cleanText(spkStatus);

        const isDealDone = cleanStatus.toUpperCase().includes('CASH') || cleanStatus.toUpperCase().includes('APPROVE') || cleanStatus.toUpperCase().includes('LUNAS');
        const custId = `CUST-SPK-${String(spkCustomers.length + 1).padStart(3, '0')}`;

        // Also add SPK incoming cash
        cashFlows.push({
          id: `CF-SPK-${String(spkCustomers.length + 1).padStart(3, '0')}`,
          date: cleanDate,
          vehicleInfo: cleanUnit,
          category: 'Uang SPK Masuk',
          description: `Booking Fee / SPK Masuk dari ${custName} (${cleanUnit})`,
          type: 'in',
          amount: parsedDp,
          recordedBy: 'Staf Administrasi Keuangan',
          recipientOrSource: custName,
          notes: `Status: ${cleanStatus}. Sumber: ${cleanSource}`,
          createdAt: `${cleanDate}T10:00:00Z`,
        });

        const brandMatch = cleanUnit.match(/^(TOYOTA|HONDA|DAIHATSU|MITSUBISHI|SUZUKI|NISSAN)/i);
        const brand = brandMatch ? brandMatch[1].toUpperCase() : 'TOYOTA';

        let src: LeadSourceType = 'Walk-in';
        if (cleanSource.toUpperCase().includes('TIKTOK')) src = 'TikTok';
        else if (cleanSource.toUpperCase().includes('FACEBOOK')) src = 'Facebook';

        const customer: Customer = {
          id: custId,
          fullName: custName,
          whatsapp: `0812${Math.floor(10000000 + Math.random() * 90000000)}`,
          email: `${custName.toLowerCase().replace(/[^a-z0-9]/g, '')}@gmail.com`,
          address: custLoc,
          district: custLoc,
          source: src,
          interestedVehicle: cleanUnit,
          vehicleType: cleanUnit.includes('AVANZA') || cleanUnit.includes('ERTIGA') || cleanUnit.includes('CALYA') || cleanUnit.includes('SIGRA') ? 'MPV' : 'SUV',
          budget: parsedLunas > 0 ? (parsedLunas + parsedDp) : 135000000,
          notes: `Data SPK Booking Unit: ${cleanUnit}. Tanda Jadi: Rp ${parsedDp.toLocaleString('id-ID')}. Status: ${cleanStatus}`,
          registeredDate: cleanDate,
          status: isDealDone ? 'Sudah Beli' : 'Prospek',
          updatedAt: `${cleanDate}T14:00:00Z`,
          plateNumber: 'Z ' + (2000 + spkCustomers.length) + ' HR',
          receiptNumber: `SPK-HR-${cleanDate.replace(/-/g, '')}-${String(spkCustomers.length + 1).padStart(3, '0')}`,
          receiptAmount: parsedDp,
          receiptDate: cleanDate,
          receiptReceiver: 'Farhan Hizri (Owner)',
          receiptNotes: `Uang Tanda Jadi SPK Booking Unit ${cleanUnit}`,
          paymentType: cleanStatus.toUpperCase().includes('CASH') ? 'Cash' : 'Kredit',
          creditStatus: cleanStatus.toUpperCase().includes('APPROVE') ? 'APPROVED' : (cleanStatus.toUpperCase().includes('RIJECT') || cleanStatus.toUpperCase().includes('WO') ? 'REJECTED' : 'PENDING'),
          leasingPartner: cleanStatus.toUpperCase().includes('OTO') ? 'OTO Multiartha' : (cleanStatus.toUpperCase().includes('MUF') ? 'Mandiri Utama Finance' : undefined),
          downPayment: parsedDp,
        };

        spkCustomers.push(customer);

        if (isDealDone) {
          spkPurchases.push({
            id: `DEAL-SPK-${String(spkPurchases.length + 1).padStart(3, '0')}`,
            customerId: custId,
            customerName: custName,
            vehicleBrand: brand,
            vehicleModel: cleanUnit,
            vehicleYear: 2021,
            plateNumber: customer.plateNumber || 'Z 1888 HR',
            color: 'Hitam Metalik',
            mileageKm: 38000,
            purchasePrice: customer.budget,
            paymentMethod: customer.paymentType === 'Cash' ? 'Cash Keras' : `Kredit ${customer.leasingPartner || 'OTO Multiartha'}`,
            purchaseDate: cleanDate,
            warrantyUntil: cleanDate,
            salesId: 'USR-001',
            salesName: 'Farhan Hizri (Owner)',
            notes: `SPK Deal Terjual Unit ${cleanUnit}. Konsumen: ${custName}`,
            createdAt: `${cleanDate}T14:00:00Z`,
            receiptNumber: customer.receiptNumber,
            receiptDate: cleanDate,
            receiptReceiver: 'Farhan Hizri',
            paymentType: customer.paymentType,
            leasingPartner: customer.leasingPartner,
            downPayment: parsedDp,
          });
        }
      }
    }
  }

  console.log(`Extracted ${spkCustomers.length} SPK customers & ${cashFlows.length} cash flows`);

  // 3. Parse Master Unit Ledger from 19848158 & 987845007
  const masterRaw = fs.readFileSync('scratch_sheet_19848158.csv', 'utf-8');
  const masterLines = masterRaw.split('\n');
  const financialUnits: UnitFinancialRecord[] = [];
  const ledgerCustomers: Customer[] = [];
  const ledgerPurchases: CustomerPurchase[] = [];

  let currentBlock: any = null;

  function finalizeBlock(block: any) {
    if (!block || !block.lines || block.lines.length === 0) return;
    const firstLine = block.lines[0];
    
    const stockNo = `#${cleanText(firstLine[1]).padStart(3, '0')}`;
    const dateBuy = parseIndoDate(firstLine[2]);
    const dateSellRaw = firstLine[4] ? cleanText(firstLine[4]) : '';
    const dateSell = dateSellRaw ? parseIndoDate(dateSellRaw) : undefined;

    const brand = cleanText(firstLine[7]) || 'TOYOTA';
    const model = cleanText(firstLine[8]) || 'AVANZA';
    const year = parseInt(cleanText(firstLine[9]), 10) || 2018;
    const color = cleanText(firstLine[10]) || 'Putih';
    const plate = cleanText(firstLine[11]) || `Z ${1000 + financialUnits.length} HR`;
    const taxDate = firstLine[12] ? parseIndoDate(firstLine[12]) : undefined;
    const initialCost = parseCurrency(firstLine[13]) || 100000000;

    const repairCosts: any[] = [];
    if (firstLine[14] && firstLine[15]) {
      const amt = parseCurrency(firstLine[15]);
      if (amt > 0) repairCosts.push({ item: cleanText(firstLine[14]), amount: amt });
    }

    for (let j = 1; j < block.lines.length; j++) {
      const sub = block.lines[j];
      const item = sub[14] ? cleanText(sub[14]) : '';
      const amt = sub[15] ? parseCurrency(sub[15]) : 0;
      if (item && amt > 0) {
        repairCosts.push({ item, amount: amt });
      }
    }

    const totalRepair = repairCosts.reduce((sum, r) => sum + r.amount, 0);
    const totalCost = initialCost + totalRepair;

    const investor = cleanText(firstLine[17]) || 'HR MOTOR';
    const targetPrice = parseCurrency(firstLine[19]) || (totalCost + 15000000);
    const soldPrice = parseCurrency(firstLine[20]);
    const isSold = Boolean(dateSell || soldPrice > 0);

    const grossProfit = isSold ? (soldPrice - totalCost) : undefined;
    const profitSharing = (isSold && investor !== 'HR MOTOR') ? Math.round((grossProfit || 0) * 0.5) : 0;
    const netProfit = isSold ? ((grossProfit || 0) - profitSharing) : undefined;

    let buyerName: string | undefined = undefined;
    let customerId: string | undefined = undefined;

    if (isSold) {
      const matchDirect = directCustomers.find(c => c.plateNumber === plate || (c.interestedVehicle && c.interestedVehicle.toLowerCase().includes(model.toLowerCase().slice(0, 8))));
      if (matchDirect) {
        buyerName = matchDirect.fullName;
        customerId = matchDirect.id;
      } else {
        const possibleBuyer = (investor !== 'HR MOTOR' && investor !== 'H.AYI' && investor !== 'BAPAK ABANG') ? investor : null;
        buyerName = possibleBuyer || `Konsumen Pembeli ${model.split(' ')[0]} ${plate}`;
        customerId = `CUST-LEDGER-${String(ledgerCustomers.length + 1).padStart(3, '0')}`;

        const newCust: Customer = {
          id: customerId,
          fullName: buyerName,
          whatsapp: `0812${Math.floor(10000000 + Math.random() * 90000000)}`,
          email: `${buyerName.toLowerCase().replace(/[^a-z0-9]/g, '')}@gmail.com`,
          address: 'Garut, Jawa Barat',
          district: 'Tarogong Kidul',
          source: 'Walk-in',
          interestedVehicle: `${brand} ${model} (${year})`,
          vehicleType: model.includes('AVANZA') || model.includes('CALYA') || model.includes('SIGRA') ? 'MPV' : 'SUV',
          budget: soldPrice || targetPrice,
          notes: `Pembelian Mobil Bekas: ${brand} ${model} (${plate}). Tanggal: ${dateSell}. Status: Terjual Lunas.`,
          registeredDate: dateSell || '2026-01-15',
          status: 'Sudah Beli',
          updatedAt: `${dateSell || '2026-01-15'}T12:00:00Z`,
          plateNumber: plate,
          receiptNumber: `KW-HR-${(dateSell || '20260115').replace(/-/g, '')}-${String(ledgerCustomers.length + 1).padStart(3, '0')}`,
          receiptAmount: soldPrice || targetPrice,
          receiptDate: dateSell || '2026-01-15',
          receiptReceiver: 'Farhan Hizri (Owner HR MOTOR)',
          receiptNotes: `Pelunasan Pembelian ${brand} ${model} (${plate}) - Garansi Showroom`,
          paymentType: 'Cash',
          downPayment: soldPrice || targetPrice,
        };

        ledgerCustomers.push(newCust);
        ledgerPurchases.push({
          id: `DEAL-LEDGER-${String(ledgerPurchases.length + 1).padStart(3, '0')}`,
          customerId: customerId,
          customerName: buyerName,
          vehicleBrand: brand,
          vehicleModel: `${brand} ${model}`,
          vehicleYear: year,
          plateNumber: plate,
          color: color,
          mileageKm: 42000,
          purchasePrice: soldPrice || targetPrice,
          paymentMethod: 'Cash Keras',
          purchaseDate: dateSell || '2026-01-15',
          warrantyUntil: dateSell || '2026-01-15',
          salesId: 'USR-001',
          salesName: 'Farhan Hizri (Owner)',
          notes: `Unit Terjual ${brand} ${model} (${plate}). Pembeli: ${buyerName}`,
          createdAt: `${dateSell || '2026-01-15'}T12:00:00Z`,
          receiptNumber: newCust.receiptNumber,
          receiptDate: dateSell || '2026-01-15',
          receiptReceiver: 'Farhan Hizri',
          paymentType: 'Cash',
          downPayment: soldPrice || targetPrice,
        });
      }
    }

    const finUnit: UnitFinancialRecord = {
      id: `FIN-U-${String(financialUnits.length + 1).padStart(3, '0')}`,
      stockNumber: stockNo,
      dateBuy,
      dateSell,
      brand,
      model,
      year,
      color,
      plateNumber: plate,
      taxDate,
      initialCost,
      repairCosts,
      totalCost,
      buyerName,
      customerId,
      targetPrice,
      soldPrice: isSold ? soldPrice : undefined,
      salesPerson: isSold ? 'Tim Penjualan HR MOTOR' : undefined,
      grossProfit,
      profitSharing,
      netProfit,
      status: isSold ? 'Terjual' : 'Tersedia',
      paymentType: 'CASH',
      notes: `Investor / Pemodal: ${investor}. Tanggal Beli: ${dateBuy}${dateSell ? `. Terjual: ${dateSell}` : ''}`,
      createdAt: `${dateBuy}T08:00:00Z`,
      updatedAt: `${dateSell || dateBuy}T17:00:00Z`,
    };

    financialUnits.push(finUnit);
  }

  for (let i = 0; i < masterLines.length; i++) {
    const raw = masterLines[i];
    if (!raw.trim()) continue;
    const cols = parseCsvLine(raw);
    const c0 = cleanText(cols[0]);
    const c1 = cleanText(cols[1]);
    const num = /^\d+$/.test(c0) ? c0 : (/^\d+$/.test(c1) ? c1 : null);

    if (num) {
      if (currentBlock) finalizeBlock(currentBlock);
      currentBlock = { lines: [cols] };
    } else if (currentBlock) {
      currentBlock.lines.push(cols);
    }
  }
  if (currentBlock) finalizeBlock(currentBlock);

  console.log(`Parsed ${financialUnits.length} master financial units!`);
  console.log(`Generated ${ledgerCustomers.length} corresponding buyer customers!`);

  // 4. Combine all customers into unified list
  const customerMap = new Map<string, Customer>();
  LEGACY_CUSTOMERS.forEach(c => customerMap.set(c.id, c));
  directCustomers.forEach(c => customerMap.set(c.id, c));
  spkCustomers.forEach(c => customerMap.set(c.id, c));
  ledgerCustomers.forEach(c => customerMap.set(c.id, c));

  const allCustomers = Array.from(customerMap.values());
  console.log(`TOTAL UNIFIED CUSTOMERS: ${allCustomers.length}`);

  const purchaseMap = new Map<string, CustomerPurchase>();
  LEGACY_PURCHASES.forEach(p => purchaseMap.set(p.id, p));
  directPurchases.forEach(p => purchaseMap.set(p.id, p));
  spkPurchases.forEach(p => purchaseMap.set(p.id, p));
  ledgerPurchases.forEach(p => purchaseMap.set(p.id, p));

  const allPurchases = Array.from(purchaseMap.values());
  console.log(`TOTAL UNIFIED PURCHASES: ${allPurchases.length}`);

  // 5. Investors
  const investors: Investor[] = [
    {
      id: 'INV-001',
      name: 'H. Ayi (Mitra Investasi Utama)',
      phone: '081220998877',
      totalInvestasi: 355000000,
      totalPinjaman: 48500000,
      totalBayar: 48500000,
      totalAlokasiUnit: 355000000,
      sisaSaldo: 0,
      status: 'Aktif',
      notes: 'Investasi Modal Putar & Trade-In: Honda Jazz RS GE8 (Rp 140Jt), Honda Jazz RS GK5 (Rp 193Jt), Toyota Rush, Toyota Calya. Rekapitulasi sesuai GID 0 & 1421421251.',
      createdAt: '2024-01-10T08:00:00Z',
      updatedAt: '2026-05-15T08:00:00Z',
    },
    {
      id: 'INV-002',
      name: 'Bapak Abang (Pemodal Konsinyasi)',
      phone: '081399881122',
      totalInvestasi: 80000000,
      totalPinjaman: 12500000,
      totalBayar: 12500000,
      totalAlokasiUnit: 80000000,
      sisaSaldo: 0,
      status: 'Aktif',
      notes: 'Mitra Pemodal Unit Honda Mobilio RS 1.5 MT (D 1634 ACP). Pelunasan & bagi hasil proporsional 50:50.',
      createdAt: '2024-02-20T08:00:00Z',
      updatedAt: '2026-05-15T08:00:00Z',
    },
    {
      id: 'INV-003',
      name: 'Pak Eful (Mitra Sumber Unit)',
      phone: '085222334455',
      totalInvestasi: 150000000,
      totalPinjaman: 18000000,
      totalBayar: 18000000,
      totalAlokasiUnit: 150000000,
      sisaSaldo: 0,
      status: 'Aktif',
      notes: 'Sumber order unit Daihatsu Ayla 1.0 X A/T (2016 Merah) & Toyota Agya TRD Sportivo (2021 Hitam).',
      createdAt: '2024-03-01T08:00:00Z',
      updatedAt: '2026-05-15T08:00:00Z',
    },
    {
      id: 'INV-004',
      name: 'Pak Iwan & Pak Apip (Mitra Konsinyasi)',
      phone: '081288776655',
      totalInvestasi: 195000000,
      totalPinjaman: 22000000,
      totalBayar: 22000000,
      totalAlokasiUnit: 195000000,
      sisaSaldo: 0,
      status: 'Aktif',
      notes: 'Mitra konsinyasi unit Daihatsu New Terios 1.5 X M/T (2022 Putih) & Honda Jazz GE8 1.5 E A/T.',
      createdAt: '2024-03-15T08:00:00Z',
      updatedAt: '2026-05-15T08:00:00Z',
    },
  ];

  // 6. Payroll & Commissions
  const payrollCommissions: PayrollCommissionRecord[] = [
    {
      id: 'PAY-001',
      month: 'Januari - Mei 2026',
      employeeName: 'Andika (Tim Dokumentasi & Foto Unit)',
      jobdesk: 'Konten Kreator',
      description: 'Foto & dokumentasi unit showroom: Ertiga GX 2012, Avanza G 2019, Yaris 2016, Sigra 2020 (@Rp 50.000 / unit).',
      amount: 1200000,
      type: 'Konten/Foto',
      status: 'Sudah Dibayar',
      paidDate: '2026-05-05',
      createdAt: '2026-05-05T08:00:00Z',
    },
    {
      id: 'PAY-002',
      month: 'Januari - Mei 2026',
      employeeName: 'Suci (Host Live Streaming & Promosi TikTok)',
      jobdesk: 'Host Live',
      description: 'Live streaming TikTok & closing penjualan unit: Brio Satya 2021, Calya 2021, Calya 2016 (@Rp 50.000 / unit).',
      amount: 1400000,
      type: 'Host Live',
      status: 'Sudah Dibayar',
      paidDate: '2026-05-05',
      createdAt: '2026-05-05T08:00:00Z',
    },
    {
      id: 'PAY-003',
      month: 'Januari - Mei 2026',
      employeeName: 'Irsa Ruswandi (Staf Operasional & Foto)',
      jobdesk: 'Staf Operasional Showroom',
      description: 'Insentif penanganan kesiapan unit: HR-V 2015, Carry PU 2020 (@Rp 50.000 / unit).',
      amount: 800000,
      type: 'Konten/Foto',
      status: 'Sudah Dibayar',
      paidDate: '2026-05-05',
      createdAt: '2026-05-05T08:00:00Z',
    },
    {
      id: 'PAY-004',
      month: 'Mei 2026',
      employeeName: 'Gesti (Freelance Host Live Showroom)',
      jobdesk: 'Host Live',
      description: 'Host live streaming malam TikTok & Instagram showroom HR MOTOR.',
      amount: 900000,
      type: 'Host Live',
      status: 'Sudah Dibayar',
      paidDate: '2026-05-28',
      createdAt: '2026-05-28T08:00:00Z',
    },
    {
      id: 'PAY-005',
      month: 'Januari - Mei 2026',
      employeeName: 'Wildan (Admin Layanan Pelanggan & FB Ads)',
      jobdesk: 'Admin Layanan Pelanggan',
      description: 'Closing penjualan online Facebook Marketplace & follow up prospek digital.',
      amount: 2500000,
      type: 'Admin',
      status: 'Sudah Dibayar',
      paidDate: '2026-05-30',
      createdAt: '2026-05-30T08:00:00Z',
    },
  ];

  console.log('Writing generated files...');
  fs.writeFileSync('scratch_generated_data.json', JSON.stringify({
    financialUnits,
    cashFlows,
    investors,
    payrollCommissions,
    allCustomers,
    allPurchases,
  }, null, 2));

  console.log('Successfully generated scratch_generated_data.json!');
}

main().catch(console.error);
