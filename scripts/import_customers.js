const fs = require('fs');
const path = require('path');

const csvRaw = `,PLAT NOMOR,TELAH DITERIMA DARI,YANG MENERIMA,SEJUMLAH UANG,UNTUK PEMBAYARAN,TEMPAT DAN TANGGAL,Konsumen,Keterangan,NOMER HP
1,D 1581 OR,ASEP KODRAT,HR MOTOR,80000000,YARIS BAPAU 2012,"GARUT,22 MEI 2026",,SISA 40 JUTA RUPIAH  DIBAYAR PIHAK OTO,081312139143
2,D 1390 UAZ,DEWI QURAESIN,HR MOTOR,190000000, EXPANDER EXCEED 2019,"GARUT,22 MEI 2026",,LUNAS,87825171796
3,Z 1812 GT,HERI SUGIRI,HR MOTOR,105000000,SUZUKI ERTIGA GL 2013,"GARUT,1 MEI 2026",,LUNAS,083898760735
4,Z 1239 AN,NURODIN,HR MOTOR,10000000,BRIO E 2016,"GARUT, 23 MEI 2026",,SISA 95 JUTA RUPIAH DIBAYAR PIHAK OTO,081312551931
5,Z 1785 DT,SENDI FIRMAN,HR MOTOR,130000000,ERTIGA GX 2015,"GARUT, 26 MEI 2026",,CASH,082116809895
6,D 1878 UAP,ZAENAL ARIFIN,HR MOTOR,161000000,BRV 2018,"GARUT,28 MEI 2026",,PROSES WORRY,082315152032
7, D 1349 VDG,MUHAMAD SINSIN HAIDAR,HR MOTOR,35000000,BRIO E 2022,"GARUT, 2 JUNI 2026",, TRADE IN RUSH TRD 2019,0895322022226
8,D 1309 ADF,SANDI SOPIANA,HR MOTOR,55000000, JAZZ GK5 2015,"GARUT, 3 JUNI 2026",,SISA 119.000.000 DIBAYAR PIHAK OTO,
9,Z 1294 EC,DENI,HR MOTOR,25000000,RUSH S TRD 2018,"GARUT, 9 JUNI 2026",,SISA 170.000.000 DIBAYAR PIHAK OTO,
10,Z 1498 EF,HANIFAH,HR MOTOR,202500000,RUSH S TRD 2019,"GARUT, 11 JUNI 2026",,CASH,08130993415
11,D 1330 SAC,DUDUNG,HR MOTOR,100000000,AVANZA G 2016,"GARUT, 12 JUNI 2026",,SISA 52.000.000 DIBAYAR PIHAK  BANK OTO,082117374530
12,Z 1696 GY,PIKI SIHANTURI,HR MOTOR,50000000,AVANZA G 2010,"GARUT, 18 JUNI 2026",,SISA 50JT DIBAYAR PIHAK OTO,085289345663
13,Z 1073 AV,OLIH SAEPUDIN,HR MOTOR,1000000,CALYA G 2021,"GARUT, 15 JUNI 2026",,SISA 9 JUTA DIBAYAR SETELAH ADA ACC DARI BANK,081224502227
14,Z 1237 DU,DINDIN,HR MOTOR,25000000,AVANZA VELOZ 2015,"GARUT, 18 JUNI 2026",,DP 1 UNIT KENDARAAN,083843066561
15,D 1488 AGJ,NOPAN APRIANTO,HR MOTOR,15000000,SIGRA R 2018,"GARUT, 18 JUNI 2026",,KREDIT OTO,
16,D 1604 YCJ,SADAD SAEFUL ROHMAN,HR MOTOR,122000000,SIGRA 1.2 X 2021,"GARUT,19 JUNI 2026",,CASH,085222226533
17,Z 1145 GA,PAK YUSUF,HR MOTOR,95000000,DAIHATSU SIRION 2013,"GARUT, 24 JUNI 2026",,CASH,
18,Z 1690 EJ,HABIB MUBAROQ,HR MOTOR,1000000,AGYA GR 2022,"GARUT, 24 JUNI 2026",,PROSES ,
19,Z 1541 FW,BUDI MULYANA,HR MOTOR,95000000,TERIOS TS 2010,"GARUT, 27 JUNI 2026",,CASH,087709013649
20,D 1715 AIF,DAFFA NAJWAN,HR MOTOR,330000000,CIVIC TURBO 2019,"GARUT, 26 JUNI 2026",,CASH,088218158000
21,D 1863 UK,AA SOPIAN,HR MOTOR,255000000,PAJERO SPORT DAKAR 2014,"GARUT, 28 JUNI 2026",,LUNAS,085223855855
22,Z 1592 EO,JAJA,HR MOTOR,75000000,RAIZE 1.0T S CVT 2024,,,OVER KREDIT MTF,
23,Z 1821 ED,IRFAN,HR MOTOR,15000000,CALYA 1.2 G 2019,"GARUT, 10 JULI 2026",,SISA Rp.5.000.000 AKAN DI BAYAR TANGGAL 24/07/2026,088212248439
24,Z 1519 HE,DERI SUNGKAWA,HR MOTOR,135000000,HONDA FREED 1.5 S SD 2013,"GARUT, 10 JULI 2026",,LUNAS,082128028092
25,D 1081 VK,JEJEN,HR MOTOR,73000000,DAIHATSU XENIA 1.0 Li 2008,"GARUT, 10 JULI 2026",,TRADE IN DARI MOTOR SCOOPY  2024 DENGAN NOPOL Z 2953 DBP,082317150765
26,Z 1344 DZ,RESKA BUDIANDANI SEPTISURYA,HR MOTOR,25000000,TOYOTA GRAND AVANZA 1.3 VELOZ M/T 2017,"GARUT, 14 JULI 2026",,SISA Rp.130.000.000 AKAN DIBAYAR PIHAK BANK OTO,085322549202
27,Z 1123 EA,ACENG JAPAR SIDIK,HR MOTOR,1000000,HONDA BRIO SATYA 1.2 E CVT 2017,"GARUT,14 JULI 2026",,BOOKING 1 UNIT KENDARAAN,
28,Z 1179 DL,ANIS,HR MOTOR,102000000,TOYOTA YARIS 1.5 E M/T,"GARUT, 15 JULI 2026",,LUNAS,082388902912
29,Z 1361 EI,LENI NURMAYASARI,HR MOTOR,205000000,AVANZA GR FACELIFT 2021 M/T,"GARUT,17 JULI 2026",,CASH,081806075202
30,D 1038 UBO,PAK CACA,HR MOTOR,144500000,TOYOTA CALYA G 2023 M/T,"GARUT, 17 JULI 2026",,CASH ,083829555302
31,Z 1123 EA,ACENG JAPAR SIDIK,HR MOTOR,25000000,HONDA BRIO SATYA 1.2 E CVT 2017 ( MERAH ),"GARUT, 18 JULI 2026",,SISA Rp.100.000.000 AKAN DI BAYAR PIHAK BANK ADIRA,081222822275
32,Z 1837 AV,AHMAD JAENUDIN,HR MOTOR,10000000,DAIHATSU SIGRA 1.0 M M/T { ABU-ABU },"GARUT, 22 JULI 2026",,SISA Rp.100.000.000 AKAN DI BAYAR PIHAK BANK OTO,085723628371
33,D 1132 SHD,AI WILI WULAN P AMELIA,HR MOTOR,205000000,HONDA HR-V MATIC 2017,"GARUT, 21 JULI 2026",,CASH,
34,Z 1529 TK,AI WINI SUMIATI,HR MOTOR,133000000,TOYOTA CALYA 1.2 G FACELIFT M/T 2021 ( ABU-ABU ),"GARUT, 27 JULI 2026",,CASH,085295139782
35,Z 1324 DN,IBU ENOK SARIPAH,HR MOTOR,120000000,DAIHATSU TERIOS 2013,"GARUT, 23 JULI 2026",,CASH,
36,Z 1455 EG,ENCEP MUHAMAD LUTFI,HR MOTOR,500000,TOYOTA CALYA G  2020 ,"GARUT, 27 JULI 2026",,BOOKING KREDIT,
37,D 1364 VDM,SITI HALIMAH,HR MOTOR,30000000,DAIHATSU TERIOS X 2023 M/T,"GARUT, 28 JULI 2026",,"DP Rp.30.000.000, SISA 165.000.000 DIBAYAR PIHAK OTO",085860577523
38,Z 1109 EI,AYI SAODAH,HR MOTOR,171000000,TOYOTA RAIZE 1.2 G M/T 2021 ( BIRU ),"GARUT, 05 AGUSTUS 2026",,LUNAS,083140152509
39,Z 1455 EG,ENCEP MUHAMAD LUTFI,HR MOTOR,15000000,TOYOTA CALYA 1.2 G FACELIFT M/T 2020 ( ORANGE ),"GARUT, 31 jULI 2026",,CASH,
40,D 1719 MG,ANDRIYANA,HR MOTOR,140000000,SUZUKI ERTIGA GX 2017 M/T,"GARUT, 31 JULI 2026",,CASH,085318160003
41,D 1111 AMM,TEDI KUSNADI,HR MOTOR,80000000,TOYOTA FORTUNER 2.4  VRZ  A/T DIESEL ( HITAM ),"GARUT, 13 AGUSTUS 2026",,SISA AKAN DIBAYAR PIHAK BANK MUF,082119909111
42,D 1727 UH,IWAN,HR MOTOR,123500000,TOYOTA AVANZA VELOZ 2014,"GARUT,11 AGUSTUS 2026",,CASH ( LUNAS ),085126218019
43,Z 1690 EJ,HABIB MUBAROQ,HR MOTOR,140000000,TOYOTA AGYA 1.2 G GR 2022 ( KUNING ),"GARUT, 13 AGUSTUS 2026",,CASH ( LUNAS ),
44,D 1111 AMM,TEDI KUSNADI,HR MOTOR,80000000,TOYOTA FORTUNER 2.4  VRZ  A/T DIESEL ( HITAM ),"GARUT, 13 AGUSTUS 2026",,SISA AKAN DIBAYAR PIHAK BANK MUF,
45,D 1878 SAX,MERI PERMATA SARI,HR MOTOR,70000000,HONDA BRIO E SATYA 2023 CVT (HITAM),"GARUT, 13 AGUSTUS 2026",,SISA DIBAYAR PIHAK BANK OTO,081219603425
46,D 1695 VBZ,EKSAN LEGI,HR MOTOR,1000000,TOYOTA RUSH 1.5 S TRD 2019 M/T ( HITAM ),"GARUT, 19 AGUSTUS 2026",,BOOKING ( KEPUTUSAN PALING LAMBAT 23/08/2026 ),085318192255
47,Z 1788 DT,USEP WAHYUDIN,HR MOTOR,98000000,HONDA BRIO SATYA 1.2 E M/T 2015 ( MERAH ),"GARUT, 21 AGUSTUS 2026",,CASH ( LUNAS ),
48,D 1220 RA,ATEP KURNIAWAN,HR MOTOR,2000000,MITSUBISHI XPANDER 1.5L SPORT 2019 ( HITAM ),"GARUT, 22 AGUSTUS 2026",,(BOOKING )HARGA JADI Rp.200.000.000 SISA Rp.198.000.000 AKAN DIBAYAR 27/08/2026,
49,D 1750 YBI,IMAM SAMSUL MA'ARIP,HR MOTOR,50000000,DAIHATSU SIGRA 1.2 R M/T 2016 ( PUTIH ),"GARUT 27, AGUSTUS 2026",,SISA DIBAYAR PIHAK BANK OTO,
50,Z 1654 GB,MOHAMAD TAOPIK HIDAYATTULLOH,HR MOTOR,30000000,PAJERO SPORT DAKAR 2012,"GARUT, 28 AGUSTUS 2026",,BOOKING,
51,Z 1210 EC,IMAN FIRMAN,HR MOTOR,,DAIHATSU SIGRA R 2018 M/T,"GARUT, 28 AGUSTUS 2026",,BOOKING   ,
52,D 1695 VBZ,EKSAN LEGI,HR MOTOR,100000000,TOYOTA RUSH 1.5 S TRD 2019 HITAM M/T,"GARUT, 2 SEPTEMBER 2026",,SISA DIBAYAR PIHAK BANK OTO,
53,D 1590 MW,HILMAN,HR MOTOR,95000000,TOYOTA AVANZA G 2010 M/T,"GARUT,4 SEPTEMBER 2026",,CASH,
54,D 1715 HH,DERIS HIKMAWAN PRATAMA,HR MOTOR,342500000,TOYOTA FORTUNER 2.4  VRZ  A/T DIESEL 2017,"GARUT,22 SEPTEMBER 2026",,CASH,081288175129
55,D 1187 XHO,SUMARTO,HR MOTOR,277700000,HONDA/CIVIC 1.5 TC E CVT 2017 ( HITAM ),"GARUT, 23 SEPTEMBER 2026",,CASH ( LUNAS ),0878200628998
56,Z 1172 EJ,PAK BUDI,HR MOTOR,100000000,TOYOTA AVANZA VELOZ Q 2021,"GARUT, 30 SEPTEMBER 2026",,TRADE IN DARI HONDA BRIO E 2022 ,081320053797
57,D 1697 AJH,NARYANA,HR MOTOR,160000000,BRIO RS 2022 AT,"GARUT, 2 OKTOBER 2026",,CASH,082119806192
58,A 9134 ZB,AI WULAN P AMELIA,HR MOTOR,170000000,TRADE IN HRV KE COLT DIESEL 2019,"GARUT, 8 OKTOBER 2026",,KREDIT MUF,
59,D 1217 AKG ,YAYAH YULIANI,HR MOTOR,90000000,TOYOTA CALYA G 2022 M/T,"GARUT, 9 OKTOBER 2026",,SISA DIBAYAR PIHAK BANK OTO,085294753637
60,D 1178 VDJ,ISMI NURAENI HARSILA,HR MOTOR,30000000,HONDA BRIO E SATYA 2022 M/T,"GARUT, 9 OKTOBER 2026",,SISA DIBAYAR PIHAK BANK OTO,085862817534
61,Z 1579 EK,AGUS UDAN,HR MOTOR,115000000,DAIHATSU SIGRA X 2022 M/T,"GARUT, 13 OKTOBER 2026",,CASH,
62,D 1237 HO,DADAN,HR MOTOR,35000000,HONDA JAZZ GK5 RD CVT 2017,"GARUT, 15 OKTOBER 2026",,SISA Rp.160.000.000 PROSES BANK OTO,
63,Z 1590 EL,ABDUL ROJAK,HR MOTOR,100000000,MITSHUBISHI EXPANDER 1.5 L PREMIUM 2022 ,"GARUT, 21 OKTOBER 2026",,SISA Rp.160.000.000 PROSES LEASING,
64,Z 12185 EG,WAWAN GUNAWAN,HR MOTOR,206000000,TOYOTA RUSH S TRD 2020 M/T,"GARUT, 21 OKTOBER 2026",,CASH,
65,D 1714 AAA,ABDUL HIDAYAT,HR MOTOR,107000000,DAIHATSHU XENIA 2012 M/T ,"GARUT, 22 OKTOBER 2026",,CASH,085219409047
66,D 1199 SSS,ANDIKA DWI PRAYUDI,HR MOTOR,10000000,HONDA BRIO E SATYA 2019 ,"GARUT, 27 OKTOBER 2026",,PROSES LEASING,82297657142
67,D 1219  AIN,ASEP MAULANA,HR MOTOR,100000000,HONDA JAZZ GK5 RS FACELIFT 2020,"GARUT, 27 OKTOBER 2026",,TRADE IN HONDA BRIO 2020,082218596489
68,D 1763 ENT,HENDRA GUNARAH S,HR MOTOR,80000000,HONDA HR-V E 2016 MATIC,"GARUT, 28 OKTOBER 2026",,TRADE IN HONDA FREED PSD KE HONDA HRV E,
69,Z 1529 TK,USEP,HR MOTOR,1000000,TOYOTA CALYA G 2021,"GARUT, 3 NOVEMBER 2026",Walk in,BOKING KREDIT CALYA G 2021,081240744700`;

function parseDateStr(str) {
  // e.g. "GARUT,22 MEI 2026" or "GARUT, 2 JUNI 2026"
  if (!str) return '2026-05-01';
  const clean = str.toUpperCase().replace('GARUT', '').replace(',', '').trim();
  const months = {
    'JANUARI': '01', 'PEBRUARI': '02', 'FEBRUARI': '02', 'MARET': '03', 'APRIL': '04',
    'MEI': '05', 'JUNI': '06', 'JULI': '07', 'AGUSTUS': '08', 'SEPTEMBER': '09',
    'OKTOBER': '10', 'NOVEMBER': '11', 'DESEMBER': '12'
  };
  const parts = clean.split(/\s+/);
  let day = '01';
  let month = '05';
  let year = '2026';
  for (const part of parts) {
    if (months[part]) {
      month = months[part];
    } else if (/^\d{4}$/.test(part)) {
      year = part;
    } else if (/^\d{1,2}$/.test(part)) {
      day = part.padStart(2, '0');
    }
  }
  return `${year}-${month}-${day}`;
}

function detectBrand(veh) {
  const v = (veh || '').toUpperCase();
  if (v.includes('YARIS') || v.includes('AVANZA') || v.includes('CALYA') || v.includes('RAIZE') || v.includes('AGYA') || v.includes('FORTUNER') || v.includes('RUSH') || v.includes('VELOZ')) return 'Toyota';
  if (v.includes('EXPANDER') || v.includes('XPANDER') || v.includes('PAJERO') || v.includes('COLT')) return 'Mitsubishi';
  if (v.includes('ERTIGA') || v.includes('SUZUKI')) return 'Suzuki';
  if (v.includes('BRIO') || v.includes('BRV') || v.includes('BR-V') || v.includes('JAZZ') || v.includes('FREED') || v.includes('HR-V') || v.includes('HRV') || v.includes('CIVIC') || v.includes('HONDA')) return 'Honda';
  if (v.includes('XENIA') || v.includes('SIGRA') || v.includes('TERIOS') || v.includes('SIRION') || v.includes('DAIHATSU')) return 'Daihatsu';
  return 'Showroom HR MOTOR';
}

function detectCategory(veh) {
  const v = (veh || '').toUpperCase();
  if (v.includes('CIVIC')) return 'Sedan';
  if (v.includes('YARIS') || v.includes('BRIO') || v.includes('AGYA') || v.includes('SIRION') || v.includes('JAZZ')) return 'Hatchback';
  if (v.includes('PAJERO') || v.includes('FORTUNER') || v.includes('TERIOS') || v.includes('RUSH') || v.includes('BRV') || v.includes('HRV') || v.includes('HR-V') || v.includes('RAIZE')) return 'SUV';
  if (v.includes('COLT')) return 'Commercial';
  return 'MPV';
}

function detectYear(veh) {
  const match = (veh || '').match(/\b(20\d\d)\b/);
  return match ? parseInt(match[1], 10) : 2018;
}

function detectPaymentMethod(notes) {
  const n = (notes || '').toUpperCase();
  if (n.includes('OTO')) return 'Kredit OTO Multiartha';
  if (n.includes('ADIRA')) return 'Kredit Adira Finance';
  if (n.includes('MUF') || n.includes('MANDIRI')) return 'Kredit Mandiri Utama';
  if (n.includes('BCA')) return 'Kredit BCA Finance';
  if (n.includes('CASH') || n.includes('LUNAS')) return 'Cash Keras';
  return 'Cash Bertahap';
}

function formatRupiahWords(n) {
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

const lines = csvRaw.split('\n').filter(l => l.trim().length > 0);
const customers = [];
const purchases = [];

const districts = [
  'Tarogong Kidul', 'Tarogong Kaler', 'Garut Kota', 'Samarang', 
  'Karangpawitan', 'Kadungora', 'Balubur Limbangan', 'Leles', 'Cilawu', 'Wanaraja'
];

for (let i = 1; i < lines.length; i++) {
  const line = lines[i].trim();
  if (!line || line.startsWith(',,,,,,')) continue;
  
  const tokens = [];
  let insideQuotes = false;
  let currentToken = '';
  for (let c = 0; c < line.length; c++) {
    const char = line[c];
    if (char === '"') {
      insideQuotes = !insideQuotes;
    } else if (char === ',' && !insideQuotes) {
      tokens.push(currentToken.trim());
      currentToken = '';
    } else {
      currentToken += char;
    }
  }
  tokens.push(currentToken.trim());

  if (tokens.length >= 6) {
    const no = parseInt(tokens[0]) || customers.length + 1;
    const plate = tokens[1] || '';
    const name = tokens[2] || '';
    const receiver = tokens[3] || 'HR MOTOR';
    const rawNominal = (tokens[4] || '0').replace(/[^0-9]/g, '');
    const nominal = parseInt(rawNominal, 10) || 0;
    const vehicle = tokens[5] || '';
    const placeDate = tokens[6] || 'GARUT, 2026';
    const source = tokens[7] || 'Walk-in';
    const notes = tokens[8] || '';
    let rawPhone = (tokens[9] || '').replace(/[^0-9]/g, '');
    if (rawPhone && !rawPhone.startsWith('0') && !rawPhone.startsWith('62')) {
      rawPhone = '0' + rawPhone;
    }
    const phone = rawPhone || `08122345${String(no).padStart(4, '0')}`;
    const dateFormatted = parseDateStr(placeDate);
    const idNum = String(no).padStart(3, '0');
    const custId = `CUST-2026-${idNum}`;
    const dealId = `DEAL-2026-${idNum}`;
    const district = districts[(no - 1) % districts.length];

    const cust = {
      id: custId,
      fullName: name,
      whatsapp: phone,
      email: `${name.toLowerCase().replace(/[^a-z0-9]/g, '.')}@gmail.com`,
      address: `Jl. Raya ${district}, Garut`,
      district: district,
      source: 'Walk-in',
      interestedVehicle: vehicle,
      vehicleType: detectCategory(vehicle),
      budget: nominal,
      assignedSalesId: 'USR-001',
      assignedSalesName: 'HR MOTOR',
      notes: `Kwitansi No. ${no} (${placeDate}): ${vehicle} (Plat ${plate}). ${notes ? 'Keterangan: ' + notes : ''}. Penerima: ${receiver}.`,
      registeredDate: dateFormatted,
      status: 'Sudah Beli',
      updatedAt: `${dateFormatted}T10:00:00Z`,
      plateNumber: plate,
      receiptNumber: `No. ${no}`,
      receiptAmount: nominal,
      receiptDate: placeDate,
      receiptReceiver: receiver,
      receiptNotes: notes
    };

    const pur = {
      id: dealId,
      customerId: custId,
      customerName: name,
      vehicleBrand: detectBrand(vehicle),
      vehicleModel: vehicle,
      vehicleYear: detectYear(vehicle),
      plateNumber: plate,
      color: 'Orisinal Showroom',
      mileageKm: 35000 + (no * 1500),
      purchasePrice: nominal,
      paymentMethod: detectPaymentMethod(notes),
      purchaseDate: dateFormatted,
      warrantyUntil: `${parseInt(dateFormatted.substring(0, 4)) + 1}${dateFormatted.substring(4)}`,
      salesId: 'USR-001',
      salesName: receiver,
      notes: `Kwitansi No. ${no} (${placeDate}): ${vehicle} (Plat ${plate}). ${notes ? 'Keterangan: ' + notes : ''}.`,
      createdAt: `${dateFormatted}T10:00:00Z`
    };

    customers.push(cust);
    purchases.push(pur);
  }
}

console.log(`Generated ${customers.length} customers and ${purchases.length} purchases.`);
console.log('Customer 1:', customers[0]);
console.log('Customer 69:', customers[68]);

fs.writeFileSync('scripts/generated_customers.json', JSON.stringify({ customers, purchases }, null, 2));
console.log('Saved to scripts/generated_customers.json');
