import { UnitFinancialRecord, CashFlowRecord, Investor, PayrollCommissionRecord } from '@/types/crm';

export const INITIAL_FINANCIAL_UNITS: UnitFinancialRecord[] = [
  {
    "id": "FIN-U-001",
    "stockNumber": "HRM-001",
    "dateBuy": "Kamis, Mei 04, 2023",
    "dateSell": "Jumat, Januari 26, 2024",
    "brand": "TOYOTA",
    "model": "FORTUNER G MT",
    "year": 2008,
    "color": "SILVER",
    "plateNumber": "B 1162 KLT",
    "taxDate": "Kamis, Oktober 24, 2019",
    "initialCost": 135000000,
    "repairCosts": [
      {
        "item": "OPERASIONAL",
        "amount": 500000
      },
      {
        "item": "ONDERDIL",
        "amount": 1100000
      },
      {
        "item": "CAT",
        "amount": 2350000
      },
      {
        "item": "SALON",
        "amount": 500000
      },
      {
        "item": "HEAD UNIT",
        "amount": 800000
      },
      {
        "item": "CAT",
        "amount": 200000
      },
      {
        "item": "PAJAK",
        "amount": 28500000
      },
      {
        "item": "SERVICE",
        "amount": 3500000
      }
    ],
    "buyerName": "HR MOTOR",
    "targetPrice": 200000000,
    "soldPrice": 175000000,
    "salesPerson": "Asep Kurniawan",
    "profitSharing": 0,
    "notes": "",
    "paymentType": "CASH",
    "status": "Terjual",
    "createdAt": "2024-01-10T08:00:00Z",
    "updatedAt": "2026-05-15T10:00:00Z",
    "totalCost": 172450000,
    "grossProfit": 2550000,
    "netProfit": 2550000
  },
  {
    "id": "FIN-U-002",
    "stockNumber": "HRM-002",
    "dateBuy": "Rabu, Mei 03, 2023",
    "dateSell": "",
    "brand": "MITSUBISHI",
    "model": "SS PICK UP",
    "year": 2004,
    "color": "PUTIH",
    "plateNumber": "Z 8817 NA",
    "taxDate": "Senin, Januari 31, 2022",
    "initialCost": 31000000,
    "repairCosts": [
      {
        "item": "LAS",
        "amount": 2850000
      },
      {
        "item": "PERBAIKAN",
        "amount": 2000000
      },
      {
        "item": "CAT",
        "amount": 1000000
      },
      {
        "item": "AKI",
        "amount": 700000
      },
      {
        "item": "JOK",
        "amount": 400000
      },
      {
        "item": "PAJAK",
        "amount": 2000000
      }
    ],
    "buyerName": "HR MOTOR",
    "targetPrice": 45000000,
    "soldPrice": 42000000,
    "salesPerson": "Asep Kurniawan",
    "profitSharing": 0,
    "notes": "",
    "paymentType": "CASH",
    "status": "Terjual",
    "createdAt": "2024-01-10T08:00:00Z",
    "updatedAt": "2026-05-15T10:00:00Z",
    "totalCost": 39950000,
    "grossProfit": 2050000,
    "netProfit": 2050000
  },
  {
    "id": "FIN-U-003",
    "stockNumber": "HRM-003",
    "dateBuy": "Senin, Mei 29, 2023",
    "dateSell": "Kamis, Februari 15, 2024",
    "brand": "HONDA",
    "model": "CRV 2.0 AT",
    "year": 2010,
    "color": "HITAM",
    "plateNumber": "D 1128 PE",
    "taxDate": "Selasa, Agustus 31, 2021",
    "initialCost": 113500000,
    "repairCosts": [
      {
        "item": "CAT",
        "amount": 200000
      },
      {
        "item": "CAT 2",
        "amount": 800000
      },
      {
        "item": "SERVICE",
        "amount": 800000
      },
      {
        "item": "SERVICE 2",
        "amount": 1300000
      },
      {
        "item": "SALON",
        "amount": 300000
      },
      {
        "item": "PAJAK",
        "amount": 16000000
      },
      {
        "item": "CAT 3",
        "amount": 400000
      }
    ],
    "buyerName": "SITI NURJANAH",
    "targetPrice": 145000000,
    "soldPrice": 135000000,
    "salesPerson": "Asep Kurniawan",
    "profitSharing": 0,
    "notes": "",
    "paymentType": "CASH",
    "status": "Terjual",
    "createdAt": "2024-01-10T08:00:00Z",
    "updatedAt": "2026-05-15T10:00:00Z",
    "totalCost": 133300000,
    "grossProfit": 1700000,
    "netProfit": 1700000
  },
  {
    "id": "FIN-U-004",
    "stockNumber": "HRM-004",
    "dateBuy": "Senin, Mei 29, 2023",
    "dateSell": "",
    "brand": "DAIHATSU",
    "model": "AYLA R MT",
    "year": 2018,
    "color": "HITAM",
    "plateNumber": "Z 1095 EB",
    "taxDate": "Selasa, Juni 04, 2024",
    "initialCost": 100000000,
    "repairCosts": [
      {
        "item": "AKI",
        "amount": 800000
      },
      {
        "item": "PAJAK",
        "amount": 7200000
      }
    ],
    "buyerName": "HR MOTOR",
    "targetPrice": 125000000,
    "soldPrice": 0,
    "salesPerson": "",
    "profitSharing": 0,
    "notes": "",
    "paymentType": "CASH",
    "status": "Tersedia",
    "createdAt": "2024-01-10T08:00:00Z",
    "updatedAt": "2026-05-15T10:00:00Z",
    "totalCost": 108000000,
    "grossProfit": 0,
    "netProfit": 0
  },
  {
    "id": "FIN-U-005",
    "stockNumber": "HRM-005",
    "dateBuy": "Rabu, Juli 05, 2023",
    "dateSell": "Senin, November 20, 2023",
    "brand": "MITSUBISHI",
    "model": "SS PICK UP",
    "year": 2018,
    "color": "PUTIH",
    "plateNumber": "Z 8417 NN",
    "taxDate": "Sabtu, Oktober 29, 2022",
    "initialCost": 73000000,
    "repairCosts": [
      {
        "item": "PAJAK",
        "amount": 2200000
      },
      {
        "item": "SERVICE",
        "amount": 500000
      },
      {
        "item": "PAJAK 2",
        "amount": 2800000
      }
    ],
    "buyerName": "HR MOTOR",
    "targetPrice": 90000000,
    "soldPrice": 78500000,
    "salesPerson": "Asep Kurniawan",
    "profitSharing": 0,
    "notes": "",
    "paymentType": "CASH",
    "status": "Terjual",
    "createdAt": "2024-01-10T08:00:00Z",
    "updatedAt": "2026-05-15T10:00:00Z",
    "totalCost": 78500000,
    "grossProfit": 0,
    "netProfit": 0
  },
  {
    "id": "FIN-U-006",
    "stockNumber": "HRM-006",
    "dateBuy": "Minggu, Agustus 20, 2023",
    "dateSell": "Jumat, Februari 02, 2024",
    "brand": "TOYOTA",
    "model": "AVANZA VELOZ 1.5 MT",
    "year": 2019,
    "color": "PUTIH",
    "plateNumber": "",
    "taxDate": "",
    "initialCost": 180000000,
    "repairCosts": [
      {
        "item": "SALON",
        "amount": 500000
      }
    ],
    "buyerName": "ABANG",
    "targetPrice": 195000000,
    "soldPrice": 0,
    "salesPerson": "",
    "profitSharing": 0,
    "notes": "",
    "paymentType": "CASH",
    "status": "Tersedia",
    "createdAt": "2024-01-10T08:00:00Z",
    "updatedAt": "2026-05-15T10:00:00Z",
    "totalCost": 180500000,
    "grossProfit": 0,
    "netProfit": 0
  },
  {
    "id": "FIN-U-007",
    "stockNumber": "HRM-007",
    "dateBuy": "Kamis, September 21, 2023",
    "dateSell": "Senin, Januari 29, 2024",
    "brand": "HONDA",
    "model": "FREED PSD AT",
    "year": 2012,
    "color": "PUTIH",
    "plateNumber": "Z 1482 FX",
    "taxDate": "Jumat, November 03, 2023",
    "initialCost": 139000000,
    "repairCosts": [
      {
        "item": "JOK",
        "amount": 400000
      },
      {
        "item": "FAKTUR",
        "amount": 1200000
      },
      {
        "item": "PAJAK",
        "amount": 3500000
      },
      {
        "item": "SALON",
        "amount": 400000
      }
    ],
    "buyerName": "UNI ABANG",
    "targetPrice": 160000000,
    "soldPrice": 155000000,
    "salesPerson": "Asep Kurniawan",
    "profitSharing": 0,
    "notes": "",
    "paymentType": "CASH",
    "status": "Terjual",
    "createdAt": "2024-01-10T08:00:00Z",
    "updatedAt": "2026-05-15T10:00:00Z",
    "totalCost": 144500000,
    "grossProfit": 10500000,
    "netProfit": 10500000
  },
  {
    "id": "FIN-U-008",
    "stockNumber": "HRM-008",
    "dateBuy": "Minggu, September 24, 2023",
    "dateSell": "Sabtu, Juli 06, 2024",
    "brand": "MITSUBISHI",
    "model": "PAJERO SPORT LIMITED AT",
    "year": 2013,
    "color": "PUTIH",
    "plateNumber": "D 1763 AAP",
    "taxDate": "Senin, Juli 01, 2024",
    "initialCost": 279350000,
    "repairCosts": [],
    "buyerName": "",
    "targetPrice": 294350000,
    "soldPrice": 0,
    "salesPerson": "",
    "profitSharing": 0,
    "notes": "",
    "paymentType": "CASH",
    "status": "Tersedia",
    "createdAt": "2024-01-10T08:00:00Z",
    "updatedAt": "2026-05-15T10:00:00Z",
    "totalCost": 279350000,
    "grossProfit": 0,
    "netProfit": 0
  },
  {
    "id": "FIN-U-009",
    "stockNumber": "HRM-009",
    "dateBuy": "Senin, September 25, 2023",
    "dateSell": "",
    "brand": "SUZUKI",
    "model": "ESCUDO MT",
    "year": 2004,
    "color": "BIRU",
    "plateNumber": "D 1645 OE",
    "taxDate": "Selasa, April 16, 2024",
    "initialCost": 50000000,
    "repairCosts": [
      {
        "item": "SALON",
        "amount": 500000
      }
    ],
    "buyerName": "HR MOTOR",
    "targetPrice": 80000000,
    "soldPrice": 68000000,
    "salesPerson": "Asep Kurniawan",
    "profitSharing": 0,
    "notes": "",
    "paymentType": "CASH",
    "status": "Terjual",
    "createdAt": "2024-01-10T08:00:00Z",
    "updatedAt": "2026-05-15T10:00:00Z",
    "totalCost": 50500000,
    "grossProfit": 17500000,
    "netProfit": 17500000
  },
  {
    "id": "FIN-U-010",
    "stockNumber": "HRM-010",
    "dateBuy": "2024-01-10",
    "dateSell": "",
    "brand": "TOYOTA",
    "model": "AVANZA G MT",
    "year": 2015,
    "color": "HITAM",
    "plateNumber": "Z 1202 DU",
    "taxDate": "Sabtu, Desember 16, 2023",
    "initialCost": 136000000,
    "repairCosts": [
      {
        "item": "SERVICE",
        "amount": 300000
      }
    ],
    "buyerName": "HR MOTOR",
    "targetPrice": 142000000,
    "soldPrice": 0,
    "salesPerson": "",
    "profitSharing": 0,
    "notes": "",
    "paymentType": "CASH",
    "status": "Tersedia",
    "createdAt": "2024-01-10T08:00:00Z",
    "updatedAt": "2026-05-15T10:00:00Z",
    "totalCost": 136300000,
    "grossProfit": 0,
    "netProfit": 0
  },
  {
    "id": "FIN-U-011",
    "stockNumber": "HRM-011",
    "dateBuy": "Minggu, Oktober 29, 2023",
    "dateSell": "Rabu, Maret 20, 2024",
    "brand": "TOYOTA",
    "model": "INNOVA G AT BENSIN",
    "year": 2012,
    "color": "PUTIH",
    "plateNumber": "D 1265 QN",
    "taxDate": "Minggu, November 10, 2024",
    "initialCost": 141000000,
    "repairCosts": [
      {
        "item": "PAJAK",
        "amount": 7000000
      },
      {
        "item": "SPION",
        "amount": 250000
      },
      {
        "item": "SALON",
        "amount": 500000
      },
      {
        "item": "SERVICE",
        "amount": 850000
      }
    ],
    "buyerName": "H. AYI",
    "targetPrice": 175000000,
    "soldPrice": 155000000,
    "salesPerson": "Asep Kurniawan",
    "profitSharing": 0,
    "notes": "",
    "paymentType": "CASH",
    "status": "Terjual",
    "createdAt": "2024-01-10T08:00:00Z",
    "updatedAt": "2026-05-15T10:00:00Z",
    "totalCost": 149600000,
    "grossProfit": 5400000,
    "netProfit": 5400000
  },
  {
    "id": "FIN-U-012",
    "stockNumber": "HRM-012",
    "dateBuy": "2024-01-10",
    "dateSell": "Rabu, Januari 24, 2024",
    "brand": "TOYOTA",
    "model": "RUSH TRD MT",
    "year": 2015,
    "color": "HITAM",
    "plateNumber": "Z 1039 HE",
    "taxDate": "Kamis, Desember 07, 2023",
    "initialCost": 138000000,
    "repairCosts": [
      {
        "item": "SALON",
        "amount": 350000
      },
      {
        "item": "PAJAK",
        "amount": 7000000
      },
      {
        "item": "SERVICE",
        "amount": 900000
      }
    ],
    "buyerName": "UNI ABANG",
    "targetPrice": 170000000,
    "soldPrice": 156000000,
    "salesPerson": "Asep Kurniawan",
    "profitSharing": 0,
    "notes": "",
    "paymentType": "CASH",
    "status": "Terjual",
    "createdAt": "2024-01-10T08:00:00Z",
    "updatedAt": "2026-05-15T10:00:00Z",
    "totalCost": 146250000,
    "grossProfit": 9750000,
    "netProfit": 9750000
  },
  {
    "id": "FIN-U-013",
    "stockNumber": "HRM-013",
    "dateBuy": "2024-01-10",
    "dateSell": "",
    "brand": "SUZUKI",
    "model": "SWIFT ST",
    "year": 2011,
    "color": "PUTIH",
    "plateNumber": "",
    "taxDate": "",
    "initialCost": 80000000,
    "repairCosts": [
      {
        "item": "HANDLE PINTU",
        "amount": 250000
      },
      {
        "item": "SERVICE",
        "amount": 1300000
      },
      {
        "item": "SERVICE KAKI-KAKI",
        "amount": 1900000
      },
      {
        "item": "SALON",
        "amount": 300000
      }
    ],
    "buyerName": "HR MOTOR",
    "targetPrice": 100000000,
    "soldPrice": 0,
    "salesPerson": "",
    "profitSharing": 0,
    "notes": "",
    "paymentType": "CASH",
    "status": "Tersedia",
    "createdAt": "2024-01-10T08:00:00Z",
    "updatedAt": "2026-05-15T10:00:00Z",
    "totalCost": 83750000,
    "grossProfit": 0,
    "netProfit": 0
  },
  {
    "id": "FIN-U-014",
    "stockNumber": "HRM-014",
    "dateBuy": "2024-01-10",
    "dateSell": "Sabtu, Mei 18, 2024",
    "brand": "TOYOTA",
    "model": "CALYA E MT",
    "year": 2019,
    "color": "ABU ABU",
    "plateNumber": "Z 1497 AT",
    "taxDate": "Jumat, Februari 21, 2025",
    "initialCost": 104000000,
    "repairCosts": [
      {
        "item": "PENGELUARAN",
        "amount": 700000
      },
      {
        "item": "SALON",
        "amount": 500000
      },
      {
        "item": "PAJAK",
        "amount": 7000000
      },
      {
        "item": "BAYAR BPKB",
        "amount": 300000
      },
      {
        "item": "BAN",
        "amount": 600000
      },
      {
        "item": "PENGELUARAN KE 2",
        "amount": 200000
      }
    ],
    "buyerName": "H. AYI",
    "targetPrice": 120000000,
    "soldPrice": 116500000,
    "salesPerson": "Asep Kurniawan",
    "profitSharing": 0,
    "notes": "",
    "paymentType": "CASH",
    "status": "Terjual",
    "createdAt": "2024-01-10T08:00:00Z",
    "updatedAt": "2026-05-15T10:00:00Z",
    "totalCost": 113300000,
    "grossProfit": 3200000,
    "netProfit": 3200000
  },
  {
    "id": "FIN-U-015",
    "stockNumber": "HRM-015",
    "dateBuy": "2024-01-10",
    "dateSell": "Senin, November 27, 2023",
    "brand": "MITSUBISHI",
    "model": "XPANDER ULTIMATE",
    "year": 2018,
    "color": "ABU ABU",
    "plateNumber": "Z 1078 EC",
    "taxDate": "Minggu, Oktober 13, 2024",
    "initialCost": 185000000,
    "repairCosts": [
      {
        "item": "SALON",
        "amount": 450000
      },
      {
        "item": "SERVICE",
        "amount": 600000
      }
    ],
    "buyerName": "ABANG",
    "targetPrice": 200000000,
    "soldPrice": 0,
    "salesPerson": "",
    "profitSharing": 0,
    "notes": "",
    "paymentType": "CASH",
    "status": "Tersedia",
    "createdAt": "2024-01-10T08:00:00Z",
    "updatedAt": "2026-05-15T10:00:00Z",
    "totalCost": 186050000,
    "grossProfit": 0,
    "netProfit": 0
  },
  {
    "id": "FIN-U-016",
    "stockNumber": "HRM-016",
    "dateBuy": "2024-01-10",
    "dateSell": "Minggu, Desember 31, 2023",
    "brand": "DAIHATSU",
    "model": "GRANMAX MB MT",
    "year": 2017,
    "color": "HITAM",
    "plateNumber": "Z 1588 DW",
    "taxDate": "Jumat, Februari 23, 2024",
    "initialCost": 96000000,
    "repairCosts": [
      {
        "item": "OPERASIONAL",
        "amount": 500000
      },
      {
        "item": "JOK",
        "amount": 500000
      },
      {
        "item": "ADMIN",
        "amount": 100000
      },
      {
        "item": "SALON",
        "amount": 500000
      }
    ],
    "buyerName": "HR MOTOR",
    "targetPrice": 115000000,
    "soldPrice": 100000000,
    "salesPerson": "Asep Kurniawan",
    "profitSharing": 0,
    "notes": "",
    "paymentType": "CASH",
    "status": "Terjual",
    "createdAt": "2024-01-10T08:00:00Z",
    "updatedAt": "2026-05-15T10:00:00Z",
    "totalCost": 97600000,
    "grossProfit": 2400000,
    "netProfit": 2400000
  },
  {
    "id": "FIN-U-017",
    "stockNumber": "HRM-017",
    "dateBuy": "Rabu, November 29, 2023",
    "dateSell": "Rabu, Februari 07, 2024",
    "brand": "DAIHATSU",
    "model": "XENIA X MT",
    "year": 2017,
    "color": "HITAM",
    "plateNumber": "Z 1132 DZ",
    "taxDate": "Selasa, September 19, 2023",
    "initialCost": 123000000,
    "repairCosts": [
      {
        "item": "PAJAK",
        "amount": 3000000
      },
      {
        "item": "CAT",
        "amount": 850000
      },
      {
        "item": "SALON",
        "amount": 500000
      }
    ],
    "buyerName": "HR MOTOR",
    "targetPrice": 145000000,
    "soldPrice": 132500000,
    "salesPerson": "Asep Kurniawan",
    "profitSharing": 0,
    "notes": "",
    "paymentType": "CASH",
    "status": "Terjual",
    "createdAt": "2024-01-10T08:00:00Z",
    "updatedAt": "2026-05-15T10:00:00Z",
    "totalCost": 127350000,
    "grossProfit": 5150000,
    "netProfit": 5150000
  },
  {
    "id": "FIN-U-018",
    "stockNumber": "HRM-018",
    "dateBuy": "Jumat, Desember 01, 2023",
    "dateSell": "Rabu, Februari 28, 2024",
    "brand": "TOYOTA",
    "model": "RUSH TRD MT",
    "year": 2020,
    "color": "PUTIH",
    "plateNumber": "Z 1718 EG",
    "taxDate": "Rabu, Desember 11, 2024",
    "initialCost": 102500000,
    "repairCosts": [
      {
        "item": "CAT",
        "amount": 650000
      },
      {
        "item": "PELUNASAN",
        "amount": 87000000
      },
      {
        "item": "SALON",
        "amount": 500000
      },
      {
        "item": "PAJAK",
        "amount": 12500000
      }
    ],
    "buyerName": "UNI ABANG",
    "targetPrice": 235000000,
    "soldPrice": 0,
    "salesPerson": "",
    "profitSharing": 0,
    "notes": "",
    "paymentType": "CASH",
    "status": "Tersedia",
    "createdAt": "2024-01-10T08:00:00Z",
    "updatedAt": "2026-05-15T10:00:00Z",
    "totalCost": 203150000,
    "grossProfit": 0,
    "netProfit": 0
  },
  {
    "id": "FIN-U-019",
    "stockNumber": "HRM-019",
    "dateBuy": "2024-01-10",
    "dateSell": "",
    "brand": "TOYOTA",
    "model": "RAIZE 1.5 G MT",
    "year": 2021,
    "color": "BIRU",
    "plateNumber": "Z 1109 EI",
    "taxDate": "Selasa, Agustus 16, 2022",
    "initialCost": 110000000,
    "repairCosts": [
      {
        "item": "PELUNASAN",
        "amount": 46000000
      }
    ],
    "buyerName": "HR MOTOR",
    "targetPrice": 195000000,
    "soldPrice": 0,
    "salesPerson": "",
    "profitSharing": 0,
    "notes": "",
    "paymentType": "CASH",
    "status": "Tersedia",
    "createdAt": "2024-01-10T08:00:00Z",
    "updatedAt": "2026-05-15T10:00:00Z",
    "totalCost": 156000000,
    "grossProfit": 0,
    "netProfit": 0
  },
  {
    "id": "FIN-U-020",
    "stockNumber": "HRM-020",
    "dateBuy": "2024-01-10",
    "dateSell": "Minggu, Juni 16, 2024",
    "brand": "SUZUKI",
    "model": "ERTIGA GX MT",
    "year": 2014,
    "color": "PUTIH",
    "plateNumber": "Z 1861 DP",
    "taxDate": "Jumat, Juli 05, 2024",
    "initialCost": 108000000,
    "repairCosts": [
      {
        "item": "BAN",
        "amount": 800000
      },
      {
        "item": "KAKI-KAKI",
        "amount": 850000
      },
      {
        "item": "SALON",
        "amount": 500000
      },
      {
        "item": "SERVICE AC",
        "amount": 950000
      },
      {
        "item": "SERVICE",
        "amount": 1200000
      }
    ],
    "buyerName": "HR MOTOR",
    "targetPrice": 123000000,
    "soldPrice": 0,
    "salesPerson": "",
    "profitSharing": 0,
    "notes": "",
    "paymentType": "CASH",
    "status": "Tersedia",
    "createdAt": "2024-01-10T08:00:00Z",
    "updatedAt": "2026-05-15T10:00:00Z",
    "totalCost": 112300000,
    "grossProfit": 0,
    "netProfit": 0
  },
  {
    "id": "FIN-U-021",
    "stockNumber": "HRM-021",
    "dateBuy": "2024-01-10",
    "dateSell": "Senin, April 22, 2024",
    "brand": "HONDA",
    "model": "BRIO E SATYA AT",
    "year": 2017,
    "color": "PUTIH",
    "plateNumber": "D 1480 AFH",
    "taxDate": "Rabu, Mei 08, 2024",
    "initialCost": 52500000,
    "repairCosts": [
      {
        "item": "PELUNASAN",
        "amount": 48000000
      },
      {
        "item": "SALON",
        "amount": 400000
      },
      {
        "item": "CAT",
        "amount": 600000
      },
      {
        "item": "SERVICE KAKI-KAKI",
        "amount": 1000000
      },
      {
        "item": "PAJAK",
        "amount": 8300000
      }
    ],
    "buyerName": "HR MOTOR",
    "targetPrice": 135000000,
    "soldPrice": 124000000,
    "salesPerson": "Asep Kurniawan",
    "profitSharing": 0,
    "notes": "",
    "paymentType": "CASH",
    "status": "Terjual",
    "createdAt": "2024-01-10T08:00:00Z",
    "updatedAt": "2026-05-15T10:00:00Z",
    "totalCost": 110800000,
    "grossProfit": 13200000,
    "netProfit": 13200000
  },
  {
    "id": "FIN-U-022",
    "stockNumber": "HRM-022",
    "dateBuy": "Sabtu, Desember 23, 2023",
    "dateSell": "Kamis, Januari 11, 2024",
    "brand": "HONDA",
    "model": "JAZZ IDSI AT",
    "year": 2008,
    "color": "ABU-ABU",
    "plateNumber": "D 1097 GQ",
    "taxDate": "Kamis, Agustus 22, 2024",
    "initialCost": 72500000,
    "repairCosts": [
      {
        "item": "SERVICE AC",
        "amount": 600000
      },
      {
        "item": "SERVICE KAKI-KAKI",
        "amount": 1400000
      },
      {
        "item": "CAT",
        "amount": 1500000
      },
      {
        "item": "SALON",
        "amount": 350000
      }
    ],
    "buyerName": "HR MOTOR",
    "targetPrice": 87500000,
    "soldPrice": 85000000,
    "salesPerson": "Asep Kurniawan",
    "profitSharing": 0,
    "notes": "",
    "paymentType": "CASH",
    "status": "Terjual",
    "createdAt": "2024-01-10T08:00:00Z",
    "updatedAt": "2026-05-15T10:00:00Z",
    "totalCost": 76350000,
    "grossProfit": 8650000,
    "netProfit": 8650000
  },
  {
    "id": "FIN-U-023",
    "stockNumber": "HRM-023",
    "dateBuy": "Kamis, Desember 28, 2023",
    "dateSell": "Senin, April 01, 2024",
    "brand": "DAIHATSU",
    "model": "AYLA R MT",
    "year": 2018,
    "color": "OREN",
    "plateNumber": "Z 1146 EC",
    "taxDate": "Kamis, Oktober 24, 2024",
    "initialCost": 96000000,
    "repairCosts": [
      {
        "item": "SALON",
        "amount": 500000
      }
    ],
    "buyerName": "HR MOTOR",
    "targetPrice": 115000000,
    "soldPrice": 105000000,
    "salesPerson": "Asep Kurniawan",
    "profitSharing": 0,
    "notes": "",
    "paymentType": "CASH",
    "status": "Terjual",
    "createdAt": "2024-01-10T08:00:00Z",
    "updatedAt": "2026-05-15T10:00:00Z",
    "totalCost": 96500000,
    "grossProfit": 8500000,
    "netProfit": 8500000
  },
  {
    "id": "FIN-U-024",
    "stockNumber": "HRM-024",
    "dateBuy": "Rabu, Januari 10, 2024",
    "dateSell": "",
    "brand": "SUZUKI",
    "model": "PUTURA PU",
    "year": 2019,
    "color": "HITAM",
    "plateNumber": "Z 8791 DW",
    "taxDate": "Kamis, Mei 04, 2023",
    "initialCost": 79500000,
    "repairCosts": [
      {
        "item": "CAT",
        "amount": 600000
      },
      {
        "item": "SALON",
        "amount": 400000
      }
    ],
    "buyerName": "HR MOTOR",
    "targetPrice": 94500000,
    "soldPrice": 0,
    "salesPerson": "",
    "profitSharing": 0,
    "notes": "",
    "paymentType": "CASH",
    "status": "Tersedia",
    "createdAt": "2024-01-10T08:00:00Z",
    "updatedAt": "2026-05-15T10:00:00Z",
    "totalCost": 80500000,
    "grossProfit": 0,
    "netProfit": 0
  },
  {
    "id": "FIN-U-025",
    "stockNumber": "HRM-025",
    "dateBuy": "Jumat, Januari 12, 2024",
    "dateSell": "Sabtu, Januari 27, 2024",
    "brand": "TOYOTA",
    "model": "AVANZA G MT",
    "year": 2010,
    "color": "ABU-ABU",
    "plateNumber": "D 1396 MF",
    "taxDate": "Sabtu, Februari 03, 2024",
    "initialCost": 85000000,
    "repairCosts": [
      {
        "item": "LAMPU",
        "amount": 200000
      },
      {
        "item": "PENGELUARAN",
        "amount": 900000
      },
      {
        "item": "PAJAK",
        "amount": 2400000
      }
    ],
    "buyerName": "HR MOTOR",
    "targetPrice": 100000000,
    "soldPrice": 95000000,
    "salesPerson": "Asep Kurniawan",
    "profitSharing": 0,
    "notes": "",
    "paymentType": "CASH",
    "status": "Terjual",
    "createdAt": "2024-01-10T08:00:00Z",
    "updatedAt": "2026-05-15T10:00:00Z",
    "totalCost": 88500000,
    "grossProfit": 6500000,
    "netProfit": 6500000
  },
  {
    "id": "FIN-U-026",
    "stockNumber": "HRM-026",
    "dateBuy": "Sabtu, Januari 13, 2024",
    "dateSell": "Rabu, Maret 27, 2024",
    "brand": "DAIHATSU",
    "model": "TERIOS R 1.5 MT",
    "year": 2016,
    "color": "PUTIH",
    "plateNumber": "Z 1877 DF",
    "taxDate": "Jumat, Agustus 02, 2024",
    "initialCost": 38000000,
    "repairCosts": [
      {
        "item": "PENGELUARAN",
        "amount": 900000
      },
      {
        "item": "SALON",
        "amount": 400000
      },
      {
        "item": "SERVICE",
        "amount": 1000000
      },
      {
        "item": "PELUNASAN",
        "amount": 88500000
      },
      {
        "item": "PAJAK",
        "amount": 7500000
      }
    ],
    "buyerName": "UNI ABANG",
    "targetPrice": 53000000,
    "soldPrice": 0,
    "salesPerson": "",
    "profitSharing": 0,
    "notes": "",
    "paymentType": "CASH",
    "status": "Tersedia",
    "createdAt": "2024-01-10T08:00:00Z",
    "updatedAt": "2026-05-15T10:00:00Z",
    "totalCost": 136300000,
    "grossProfit": 0,
    "netProfit": 0
  },
  {
    "id": "FIN-U-027",
    "stockNumber": "HRM-027",
    "dateBuy": "Minggu, Januari 14, 2024",
    "dateSell": "Selasa, April 16, 2024",
    "brand": "HONDA",
    "model": "BRIO E SATYA AT",
    "year": 2020,
    "color": "ABU-ABU",
    "plateNumber": "D 1675 YCD",
    "taxDate": "Selasa, November 16, 2021",
    "initialCost": 70000000,
    "repairCosts": [
      {
        "item": "PELUNASAN",
        "amount": 70500000
      },
      {
        "item": "PENGELUARAN",
        "amount": 600000
      },
      {
        "item": "SALON",
        "amount": 400000
      },
      {
        "item": "PAJAK",
        "amount": 15500000
      }
    ],
    "buyerName": "HR MOTOR",
    "targetPrice": 85000000,
    "soldPrice": 0,
    "salesPerson": "",
    "profitSharing": 0,
    "notes": "",
    "paymentType": "CASH",
    "status": "Tersedia",
    "createdAt": "2024-01-10T08:00:00Z",
    "updatedAt": "2026-05-15T10:00:00Z",
    "totalCost": 157000000,
    "grossProfit": 0,
    "netProfit": 0
  },
  {
    "id": "FIN-U-028",
    "stockNumber": "HRM-028",
    "dateBuy": "Selasa, Januari 16, 2024",
    "dateSell": "Rabu, Maret 27, 2024",
    "brand": "DAIHATSU",
    "model": "AYLA D+ MT",
    "year": 2018,
    "color": "SILVER",
    "plateNumber": "Z 1092 EB",
    "taxDate": "Jumat, Juni 04, 2021",
    "initialCost": 60000000,
    "repairCosts": [
      {
        "item": "CAT",
        "amount": 1400000
      },
      {
        "item": "KARET",
        "amount": 250000
      },
      {
        "item": "PAJAK",
        "amount": 8500000
      },
      {
        "item": "SALON",
        "amount": 500000
      },
      {
        "item": "SERVICE",
        "amount": 1000000
      }
    ],
    "buyerName": "HR MOTOR",
    "targetPrice": 75000000,
    "soldPrice": 0,
    "salesPerson": "",
    "profitSharing": 0,
    "notes": "",
    "paymentType": "CASH",
    "status": "Tersedia",
    "createdAt": "2024-01-10T08:00:00Z",
    "updatedAt": "2026-05-15T10:00:00Z",
    "totalCost": 71650000,
    "grossProfit": 0,
    "netProfit": 0
  },
  {
    "id": "FIN-U-029",
    "stockNumber": "HRM-029",
    "dateBuy": "Senin, Januari 29, 2024",
    "dateSell": "Senin, Maret 18, 2024",
    "brand": "MITSUBISHI",
    "model": "XPANDER SPORT MT",
    "year": 2019,
    "color": "PUTIH",
    "plateNumber": "Z 1257 EF",
    "taxDate": "Selasa, Desember 17, 2024",
    "initialCost": 175000000,
    "repairCosts": [
      {
        "item": "CAT",
        "amount": 1750000
      },
      {
        "item": "SALON",
        "amount": 500000
      }
    ],
    "buyerName": "UNI ABANG",
    "targetPrice": 190000000,
    "soldPrice": 0,
    "salesPerson": "",
    "profitSharing": 0,
    "notes": "",
    "paymentType": "CASH",
    "status": "Tersedia",
    "createdAt": "2024-01-10T08:00:00Z",
    "updatedAt": "2026-05-15T10:00:00Z",
    "totalCost": 177250000,
    "grossProfit": 0,
    "netProfit": 0
  },
  {
    "id": "FIN-U-030",
    "stockNumber": "HRM-030",
    "dateBuy": "Senin, Januari 29, 2024",
    "dateSell": "Jumat, Mei 17, 2024",
    "brand": "HONDA",
    "model": "BRIO E SATYA MT",
    "year": 2016,
    "color": "ABU-ABU",
    "plateNumber": "Z 1567 DE",
    "taxDate": "Selasa, April 16, 2024",
    "initialCost": 89500000,
    "repairCosts": [
      {
        "item": "LEGALISIR FAKTUR",
        "amount": 250000
      },
      {
        "item": "PAJAK",
        "amount": 2500000
      },
      {
        "item": "CAT",
        "amount": 1800000
      },
      {
        "item": "SALON",
        "amount": 500000
      },
      {
        "item": "FAKTUR",
        "amount": 750000
      },
      {
        "item": "PAJAK KE 2",
        "amount": 2150000
      }
    ],
    "buyerName": "HR MOTOR",
    "targetPrice": 104500000,
    "soldPrice": 103000000,
    "salesPerson": "Asep Kurniawan",
    "profitSharing": 0,
    "notes": "",
    "paymentType": "CASH",
    "status": "Terjual",
    "createdAt": "2024-01-10T08:00:00Z",
    "updatedAt": "2026-05-15T10:00:00Z",
    "totalCost": 97450000,
    "grossProfit": 5550000,
    "netProfit": 5550000
  },
  {
    "id": "FIN-U-031",
    "stockNumber": "HRM-031",
    "dateBuy": "Rabu, Februari 07, 2024",
    "dateSell": "Rabu, April 03, 2024",
    "brand": "MITSUBISHI",
    "model": "PAJERO",
    "year": 2019,
    "color": "HITAM",
    "plateNumber": "",
    "taxDate": "",
    "initialCost": 230000000,
    "repairCosts": [],
    "buyerName": "HR MOTOR",
    "targetPrice": 245000000,
    "soldPrice": 0,
    "salesPerson": "",
    "profitSharing": 0,
    "notes": "",
    "paymentType": "CASH",
    "status": "Tersedia",
    "createdAt": "2024-01-10T08:00:00Z",
    "updatedAt": "2026-05-15T10:00:00Z",
    "totalCost": 230000000,
    "grossProfit": 0,
    "netProfit": 0
  },
  {
    "id": "FIN-U-032",
    "stockNumber": "HRM-032",
    "dateBuy": "Jumat, Februari 09, 2024",
    "dateSell": "Rabu, Februari 28, 2024",
    "brand": "DAIHASTU",
    "model": "SIGRA R MT",
    "year": 2018,
    "color": "PUTIH",
    "plateNumber": "Z 1850 HW",
    "taxDate": "Sabtu, Mei 18, 2024",
    "initialCost": 100000000,
    "repairCosts": [
      {
        "item": "SALON",
        "amount": 500000
      }
    ],
    "buyerName": "ABANG",
    "targetPrice": 115000000,
    "soldPrice": 0,
    "salesPerson": "",
    "profitSharing": 0,
    "notes": "",
    "paymentType": "CASH",
    "status": "Tersedia",
    "createdAt": "2024-01-10T08:00:00Z",
    "updatedAt": "2026-05-15T10:00:00Z",
    "totalCost": 100500000,
    "grossProfit": 0,
    "netProfit": 0
  },
  {
    "id": "FIN-U-033",
    "stockNumber": "HRM-033",
    "dateBuy": "Selasa, Februari 20, 2024",
    "dateSell": "Selasa, Agustus 06, 2024",
    "brand": "HONDA",
    "model": "MOBILIO RS 1.5 MT",
    "year": 2014,
    "color": "SILVER",
    "plateNumber": "D 1634 ACP",
    "taxDate": "Selasa, Desember 03, 2024",
    "initialCost": 35000000,
    "repairCosts": [
      {
        "item": "PELUNASAN",
        "amount": 87200000
      },
      {
        "item": "CAT",
        "amount": 1000000
      },
      {
        "item": "SALON",
        "amount": 500000
      },
      {
        "item": "VELG + BAN",
        "amount": 3200000
      },
      {
        "item": "KNALPOT",
        "amount": 600000
      },
      {
        "item": "KUNCI SEREP",
        "amount": 1000000
      }
    ],
    "buyerName": "BAPAK ABANG",
    "targetPrice": 50000000,
    "soldPrice": 0,
    "salesPerson": "",
    "profitSharing": 0,
    "notes": "",
    "paymentType": "CASH",
    "status": "Tersedia",
    "createdAt": "2024-01-10T08:00:00Z",
    "updatedAt": "2026-05-15T10:00:00Z",
    "totalCost": 128500000,
    "grossProfit": 0,
    "netProfit": 0
  },
  {
    "id": "FIN-U-034",
    "stockNumber": "HRM-034",
    "dateBuy": "2024-01-10",
    "dateSell": "Kamis, Mei 16, 2024",
    "brand": "HONDA",
    "model": "JAZZ RS AT",
    "year": 2010,
    "color": "ABU-ABU",
    "plateNumber": "Z 1463 GU",
    "taxDate": "Sabtu, Oktober 22, 2022",
    "initialCost": 95000000,
    "repairCosts": [
      {
        "item": "CAT",
        "amount": 1000000
      },
      {
        "item": "SALON",
        "amount": 500000
      },
      {
        "item": "PAJAK",
        "amount": 11600000
      }
    ],
    "buyerName": "HR MOTOR",
    "targetPrice": 110000000,
    "soldPrice": 0,
    "salesPerson": "",
    "profitSharing": 0,
    "notes": "",
    "paymentType": "CASH",
    "status": "Tersedia",
    "createdAt": "2024-01-10T08:00:00Z",
    "updatedAt": "2026-05-15T10:00:00Z",
    "totalCost": 108100000,
    "grossProfit": 0,
    "netProfit": 0
  },
  {
    "id": "FIN-U-035",
    "stockNumber": "HRM-035",
    "dateBuy": "Sabtu, Maret 09, 2024",
    "dateSell": "Selasa, April 02, 2024",
    "brand": "DAIHATSU",
    "model": "XENIA R MT",
    "year": 2012,
    "color": "SILVER",
    "plateNumber": "",
    "taxDate": "",
    "initialCost": 40000000,
    "repairCosts": [
      {
        "item": "PELUNASAN",
        "amount": 46000000
      },
      {
        "item": "CAT",
        "amount": 1500000
      },
      {
        "item": "SERVICE",
        "amount": 3000000
      },
      {
        "item": "SALON",
        "amount": 500000
      },
      {
        "item": "PAJAK",
        "amount": 2700000
      }
    ],
    "buyerName": "SITI NURJANAH",
    "targetPrice": 55000000,
    "soldPrice": 100000000,
    "salesPerson": "",
    "profitSharing": 0,
    "notes": "",
    "paymentType": "CASH",
    "status": "Terjual",
    "createdAt": "2024-01-10T08:00:00Z",
    "updatedAt": "2026-05-15T10:00:00Z",
    "totalCost": 93700000,
    "grossProfit": 6300000,
    "netProfit": 6300000
  },
  {
    "id": "FIN-U-036",
    "stockNumber": "HRM-036",
    "dateBuy": "Sabtu, Maret 09, 2024",
    "dateSell": "Rabu, Mei 15, 2024",
    "brand": "TOYOTA",
    "model": "ETIOS VALCO G MT",
    "year": 2013,
    "color": "PUTIH",
    "plateNumber": "Z 1738 DO",
    "taxDate": "Kamis, Desember 19, 2024",
    "initialCost": 85500000,
    "repairCosts": [
      {
        "item": "CAT",
        "amount": 1000000
      },
      {
        "item": "SALON",
        "amount": 500000
      }
    ],
    "buyerName": "SITI NURJANAH",
    "targetPrice": 100500000,
    "soldPrice": 88000000,
    "salesPerson": "Asep Kurniawan",
    "profitSharing": 0,
    "notes": "",
    "paymentType": "CASH",
    "status": "Terjual",
    "createdAt": "2024-01-10T08:00:00Z",
    "updatedAt": "2026-05-15T10:00:00Z",
    "totalCost": 87000000,
    "grossProfit": 1000000,
    "netProfit": 1000000
  },
  {
    "id": "FIN-U-037",
    "stockNumber": "HRM-037",
    "dateBuy": "Kamis, Maret 14, 2024",
    "dateSell": "Kamis, Maret 21, 2024",
    "brand": "HONDA",
    "model": "BRIO E SATYA MT",
    "year": 2020,
    "color": "PUTIH",
    "plateNumber": "D 1373 AIN",
    "taxDate": "Selasa, Maret 11, 2025",
    "initialCost": 36000000,
    "repairCosts": [
      {
        "item": "PELUNASAN",
        "amount": 90000000
      },
      {
        "item": "CAT",
        "amount": 500000
      },
      {
        "item": "SALON",
        "amount": 500000
      }
    ],
    "buyerName": "HRMOTOR",
    "targetPrice": 51000000,
    "soldPrice": 140000000,
    "salesPerson": "Asep Kurniawan",
    "profitSharing": 0,
    "notes": "",
    "paymentType": "CASH",
    "status": "Terjual",
    "createdAt": "2024-01-10T08:00:00Z",
    "updatedAt": "2026-05-15T10:00:00Z",
    "totalCost": 127000000,
    "grossProfit": 13000000,
    "netProfit": 13000000
  },
  {
    "id": "FIN-U-038",
    "stockNumber": "HRM-038",
    "dateBuy": "Rabu, Maret 20, 2024",
    "dateSell": "Sabtu, Maret 23, 2024",
    "brand": "TOYOTA",
    "model": "RUSH TRD MT",
    "year": 2019,
    "color": "HITAM",
    "plateNumber": "Z 1284 ED",
    "taxDate": "Kamis, Maret 20, 2025",
    "initialCost": 190000000,
    "repairCosts": [
      {
        "item": "MEDIATOR pembelian",
        "amount": 2500000
      },
      {
        "item": "SALON",
        "amount": 500000
      }
    ],
    "buyerName": "UNI ABANG",
    "targetPrice": 205000000,
    "soldPrice": 205000000,
    "salesPerson": "Asep Kurniawan",
    "profitSharing": 0,
    "notes": "",
    "paymentType": "CASH",
    "status": "Terjual",
    "createdAt": "2024-01-10T08:00:00Z",
    "updatedAt": "2026-05-15T10:00:00Z",
    "totalCost": 193000000,
    "grossProfit": 12000000,
    "netProfit": 12000000
  },
  {
    "id": "FIN-U-039",
    "stockNumber": "HRM-039",
    "dateBuy": "Rabu, Maret 27, 2024",
    "dateSell": "Senin, April 22, 2024",
    "brand": "SUZUKI",
    "model": "PUTURA PU",
    "year": 2015,
    "color": "PUTIH",
    "plateNumber": "Z 8233 DT",
    "taxDate": "Senin, November 27, 2023",
    "initialCost": 65000000,
    "repairCosts": [
      {
        "item": "MEDIATOR pembelian",
        "amount": 1000000
      },
      {
        "item": "SERVICE",
        "amount": 1200000
      },
      {
        "item": "CAT",
        "amount": 1300000
      },
      {
        "item": "PAJAK",
        "amount": 1700000
      },
      {
        "item": "SALON",
        "amount": 500000
      }
    ],
    "buyerName": "H. AYI",
    "targetPrice": 80000000,
    "soldPrice": 75000000,
    "salesPerson": "Asep Kurniawan",
    "profitSharing": 0,
    "notes": "",
    "paymentType": "CASH",
    "status": "Terjual",
    "createdAt": "2024-01-10T08:00:00Z",
    "updatedAt": "2026-05-15T10:00:00Z",
    "totalCost": 70700000,
    "grossProfit": 4300000,
    "netProfit": 4300000
  },
  {
    "id": "FIN-U-040",
    "stockNumber": "HRM-040",
    "dateBuy": "Rabu, Maret 27, 2024",
    "dateSell": "Minggu, April 07, 2024",
    "brand": "TOYOTA",
    "model": "FORTUNER G MT",
    "year": 2009,
    "color": "Hitam",
    "plateNumber": "",
    "taxDate": "",
    "initialCost": 172000000,
    "repairCosts": [
      {
        "item": "AUDIO",
        "amount": 1800000
      },
      {
        "item": "KACA FILM",
        "amount": 300000
      },
      {
        "item": "CAT",
        "amount": 1800000
      }
    ],
    "buyerName": "HR MOTOR",
    "targetPrice": 187000000,
    "soldPrice": 0,
    "salesPerson": "",
    "profitSharing": 0,
    "notes": "",
    "paymentType": "CASH",
    "status": "Tersedia",
    "createdAt": "2024-01-10T08:00:00Z",
    "updatedAt": "2026-05-15T10:00:00Z",
    "totalCost": 175900000,
    "grossProfit": 0,
    "netProfit": 0
  },
  {
    "id": "FIN-U-041",
    "stockNumber": "HRM-041",
    "dateBuy": "Minggu, April 07, 2024",
    "dateSell": "Selasa, Juli 23, 2024",
    "brand": "TOYOTA",
    "model": "RUSH TRD ULTIMO",
    "year": 2016,
    "color": "HITAM",
    "plateNumber": "D 1363 AEN",
    "taxDate": "Kamis, September 12, 2024",
    "initialCost": 160000000,
    "repairCosts": [
      {
        "item": "CAT",
        "amount": 1000000
      },
      {
        "item": "SALON",
        "amount": 500000
      }
    ],
    "buyerName": "UNI ABANG",
    "targetPrice": 175000000,
    "soldPrice": 0,
    "salesPerson": "",
    "profitSharing": 0,
    "notes": "",
    "paymentType": "CASH",
    "status": "Tersedia",
    "createdAt": "2024-01-10T08:00:00Z",
    "updatedAt": "2026-05-15T10:00:00Z",
    "totalCost": 161500000,
    "grossProfit": 0,
    "netProfit": 0
  },
  {
    "id": "FIN-U-042",
    "stockNumber": "HRM-042",
    "dateBuy": "Selasa, April 23, 2024",
    "dateSell": "Rabu, Mei 01, 2024",
    "brand": "MITSUBISHI",
    "model": "XPANDER",
    "year": 2022,
    "color": "PUTIH",
    "plateNumber": "",
    "taxDate": "",
    "initialCost": 220000000,
    "repairCosts": [
      {
        "item": "MANUAL BOOK",
        "amount": 500000
      },
      {
        "item": "SALON",
        "amount": 500000
      },
      {
        "item": "MEDIATOR pembelian",
        "amount": 1000000
      }
    ],
    "buyerName": "HR MOTOR",
    "targetPrice": 235000000,
    "soldPrice": 0,
    "salesPerson": "",
    "profitSharing": 0,
    "notes": "",
    "paymentType": "CASH",
    "status": "Tersedia",
    "createdAt": "2024-01-10T08:00:00Z",
    "updatedAt": "2026-05-15T10:00:00Z",
    "totalCost": 222000000,
    "grossProfit": 0,
    "netProfit": 0
  },
  {
    "id": "FIN-U-043",
    "stockNumber": "HRM-043",
    "dateBuy": "Rabu, April 24, 2024",
    "dateSell": "Rabu, Mei 08, 2024",
    "brand": "DAIHATSU",
    "model": "XENIA",
    "year": 2018,
    "color": "SILVER",
    "plateNumber": "",
    "taxDate": "",
    "initialCost": 117000000,
    "repairCosts": [
      {
        "item": "CAT",
        "amount": 600000
      },
      {
        "item": "SALON",
        "amount": 500000
      }
    ],
    "buyerName": "ABANG",
    "targetPrice": 132000000,
    "soldPrice": 0,
    "salesPerson": "",
    "profitSharing": 0,
    "notes": "",
    "paymentType": "CASH",
    "status": "Tersedia",
    "createdAt": "2024-01-10T08:00:00Z",
    "updatedAt": "2026-05-15T10:00:00Z",
    "totalCost": 118100000,
    "grossProfit": 0,
    "netProfit": 0
  },
  {
    "id": "FIN-U-044",
    "stockNumber": "HRM-044",
    "dateBuy": "Senin, April 29, 2024",
    "dateSell": "Jumat, Juni 14, 2024",
    "brand": "DAIHATSU",
    "model": "TERIOS TX MT",
    "year": 2011,
    "color": "HITAM",
    "plateNumber": "Z 1563 DL",
    "taxDate": "Senin, September 23, 2024",
    "initialCost": 107500000,
    "repairCosts": [
      {
        "item": "CAT",
        "amount": 1800000
      },
      {
        "item": "SERVICE LAMPU",
        "amount": 400000
      },
      {
        "item": "SALON",
        "amount": 500000
      },
      {
        "item": "JOK",
        "amount": 300000
      },
      {
        "item": "KOPLING",
        "amount": 3000000
      },
      {
        "item": "SERVICE KAKI-KAKI",
        "amount": 850000
      }
    ],
    "buyerName": "H.AYI",
    "targetPrice": 122500000,
    "soldPrice": 0,
    "salesPerson": "",
    "profitSharing": 0,
    "notes": "",
    "paymentType": "CASH",
    "status": "Tersedia",
    "createdAt": "2024-01-10T08:00:00Z",
    "updatedAt": "2026-05-15T10:00:00Z",
    "totalCost": 114350000,
    "grossProfit": 0,
    "netProfit": 0
  },
  {
    "id": "FIN-U-045",
    "stockNumber": "HRM-045",
    "dateBuy": "Senin, April 29, 2024",
    "dateSell": "Jumat, Mei 10, 2024",
    "brand": "TOYOTA",
    "model": "AVANZA TYPE S MT",
    "year": 2008,
    "color": "HITAM",
    "plateNumber": "",
    "taxDate": "",
    "initialCost": 78000000,
    "repairCosts": [
      {
        "item": "SALON",
        "amount": 500000
      }
    ],
    "buyerName": "ABANG",
    "targetPrice": 93000000,
    "soldPrice": 0,
    "salesPerson": "",
    "profitSharing": 0,
    "notes": "",
    "paymentType": "CASH",
    "status": "Tersedia",
    "createdAt": "2024-01-10T08:00:00Z",
    "updatedAt": "2026-05-15T10:00:00Z",
    "totalCost": 78500000,
    "grossProfit": 0,
    "netProfit": 0
  }
];

export const INITIAL_CASH_FLOW: CashFlowRecord[] = [
  {
    "id": "CF-001",
    "date": "06/04/2026",
    "vehicleInfo": "DAIHATSU XENIA XI SPORTY | 2010",
    "plateNumber": "Z 1832 YB",
    "category": "Perbaikan Unit",
    "description": "POGLAMP & STOPLAMP",
    "type": "out",
    "amount": 95000,
    "recordedBy": "Staf Administrasi Keuangan",
    "createdAt": "2026-04-06T09:00:00Z"
  },
  {
    "id": "CF-002",
    "date": "06/04/2026",
    "vehicleInfo": "TOYOTA AVANZA 1.3 G | 2014",
    "plateNumber": "D 1273 VZG",
    "category": "Perbaikan Unit",
    "description": "HEADLAMP",
    "type": "out",
    "amount": 75000,
    "recordedBy": "Staf Administrasi Keuangan",
    "createdAt": "2026-04-06T09:00:00Z"
  },
  {
    "id": "CF-003",
    "date": "06/04/2026",
    "vehicleInfo": "HONDA JAZZ GE8 | 2013",
    "plateNumber": "D 1620 RS",
    "category": "Perbaikan Unit",
    "description": "KACA FILM & RACK NOPOL",
    "type": "out",
    "amount": 425000,
    "recordedBy": "Staf Administrasi Keuangan",
    "createdAt": "2026-04-06T09:00:00Z"
  },
  {
    "id": "CF-004",
    "date": "03/08/2026",
    "vehicleInfo": "DAIHATSU SIGRA 1.2 R M/T 2016 | PUTIH",
    "plateNumber": "",
    "category": "Uang SPK Masuk",
    "description": "Tanda Jadi SPK dari HERDI ESA MUHARAM | BAYONGBONG (TIKTOK) - MULTIPLE WO ( - / + ) Rp.50.000.000",
    "type": "in",
    "amount": 1000000,
    "recordedBy": "Staf Administrasi Keuangan",
    "createdAt": "2026-08-03T10:00:00Z"
  },
  {
    "id": "CF-005",
    "date": "06/04/2026",
    "vehicleInfo": "TOYOTA CALYA 1.2 G | 2018",
    "plateNumber": "Z 1393 EB",
    "category": "Perbaikan Unit",
    "description": "KACA FILM",
    "type": "out",
    "amount": 350000,
    "recordedBy": "Staf Administrasi Keuangan",
    "createdAt": "2026-04-06T09:00:00Z"
  },
  {
    "id": "CF-006",
    "date": "07/08/2026",
    "vehicleInfo": "DAIHATSU ROCKY 1.0 R ADS A/T 2022 | TWOTONE",
    "plateNumber": "",
    "category": "Uang SPK Masuk",
    "description": "Tanda Jadi SPK dari DERA BUDI PRATAMA | PAMENGPEUK (TIKTOK) - BLACKLIST AREA",
    "type": "in",
    "amount": 1000000,
    "recordedBy": "Staf Administrasi Keuangan",
    "createdAt": "2026-08-03T10:00:00Z"
  },
  {
    "id": "CF-007",
    "date": "06/04/2026",
    "vehicleInfo": "HONDA BRIO 1.2 E | 2019",
    "plateNumber": "D 1623 AIC",
    "category": "Perbaikan Unit",
    "description": "KAKI-KAKI",
    "type": "out",
    "amount": 1650000,
    "recordedBy": "Staf Administrasi Keuangan",
    "createdAt": "2026-04-06T09:00:00Z"
  },
  {
    "id": "CF-008",
    "date": "12/08/2026",
    "vehicleInfo": "TOYOTA CALYA 1.2 G FACELIFT M/T 2023 | HITAM",
    "plateNumber": "",
    "category": "Uang SPK Masuk",
    "description": "Tanda Jadi SPK dari MAMAN | KP.RADUG BAYONGBONG (TIKTOK) - APPROVE ( MUF )",
    "type": "in",
    "amount": 1000000,
    "recordedBy": "Staf Administrasi Keuangan",
    "createdAt": "2026-08-03T10:00:00Z"
  },
  {
    "id": "CF-009",
    "date": "13/08/2026",
    "vehicleInfo": "TOYOTA CALYA 1.2 G FACELIFT M/T 2022 | ABU-ABU",
    "plateNumber": "",
    "category": "Uang SPK Masuk",
    "description": "Tanda Jadi SPK dari EKA RAHMAWATI | KARANGPAWITAN (FACEBOOK ( WILDAN )) - RIJECT ( KAPASITAS )",
    "type": "in",
    "amount": 1000000,
    "recordedBy": "Staf Administrasi Keuangan",
    "createdAt": "2026-08-03T10:00:00Z"
  },
  {
    "id": "CF-010",
    "date": "06/04/2026",
    "vehicleInfo": "DAIHATSU AYLA 1.2 R | 2022",
    "plateNumber": "Z 1409 EL",
    "category": "Pajak & Surat",
    "description": "PAJAK",
    "type": "out",
    "amount": 7515000,
    "recordedBy": "Staf Administrasi Keuangan",
    "createdAt": "2026-04-06T09:00:00Z"
  },
  {
    "id": "CF-011",
    "date": "14/08/2026",
    "vehicleInfo": "DAIHATSU SIGRA 1.2 R M/T 2016 | PUTIH",
    "plateNumber": "",
    "category": "Uang SPK Masuk",
    "description": "Tanda Jadi SPK dari DERI SAPUTRA | KERESEK C.BATU (MEDIATOR ( PK.UDAY )) - WO Rp.200.000.000",
    "type": "in",
    "amount": 1000000,
    "recordedBy": "Staf Administrasi Keuangan",
    "createdAt": "2026-08-03T10:00:00Z"
  },
  {
    "id": "CF-012",
    "date": "15/08/2026",
    "vehicleInfo": "HONDA CR-V RE1 2WD 2.0 A/T 2007 | HITAM",
    "plateNumber": "",
    "category": "Uang SPK Masuk",
    "description": "Tanda Jadi SPK dari EUIS WILVI | SUKASENANG BAYONGBONG (TIKTOK) - CANCEL ORDER",
    "type": "in",
    "amount": 1000000,
    "recordedBy": "Staf Administrasi Keuangan",
    "createdAt": "2026-08-03T10:00:00Z"
  },
  {
    "id": "CF-013",
    "date": "18/08/2026",
    "vehicleInfo": "TOYOTA AVANZA 1.3 G M/T 2010 | HITAM",
    "plateNumber": "",
    "category": "Uang SPK Masuk",
    "description": "Tanda Jadi SPK dari RIKWANTO | SUKAJADI BANDUNG (TIKTOK) - CANCEL ORDER | DP ( - )",
    "type": "in",
    "amount": 1000000,
    "recordedBy": "Staf Administrasi Keuangan",
    "createdAt": "2026-08-03T10:00:00Z"
  },
  {
    "id": "CF-014",
    "date": "19/08/2026",
    "vehicleInfo": "TOYOTA RUSH 1.5 S TRDs M/T 2019 | HITAM",
    "plateNumber": "",
    "category": "Uang SPK Masuk",
    "description": "Tanda Jadi SPK dari EKSAN LEGI | TANJUNGJAYA PAKENJENG (TIKTOK) - APPROVE ( OTO )",
    "type": "in",
    "amount": 1000000,
    "recordedBy": "Staf Administrasi Keuangan",
    "createdAt": "2026-08-03T10:00:00Z"
  },
  {
    "id": "CF-015",
    "date": "20/08/2026",
    "vehicleInfo": "DAIHATSU SIGRA 1.2 R DELUXE M/T 2018 | HITAM",
    "plateNumber": "",
    "category": "Uang SPK Masuk",
    "description": "Tanda Jadi SPK dari AZKIA MAULIA BUDIMAN PUTERI | SAMARANG (TIKTOK) - CANCEL ORDER",
    "type": "in",
    "amount": 1000000,
    "recordedBy": "Staf Administrasi Keuangan",
    "createdAt": "2026-08-03T10:00:00Z"
  },
  {
    "id": "CF-016",
    "date": "19/08/2026",
    "vehicleInfo": "HONDA BRIO SATYA DD1 1.2 E M/T  2015 | MERAH",
    "plateNumber": "",
    "category": "Uang SPK Masuk",
    "description": "Tanda Jadi SPK dari USEP WAHYUDIN | SANDING SAMARANG (TIKTOK) - CASH ( LUNAS ) 21/08/2026",
    "type": "in",
    "amount": 1000000,
    "recordedBy": "Staf Administrasi Keuangan",
    "createdAt": "2026-08-03T10:00:00Z"
  },
  {
    "id": "CF-017",
    "date": "22/08/2026",
    "vehicleInfo": "MITSUBISHI XPANDER 1.5L SPORT A/T 2019 | HITAM",
    "plateNumber": "",
    "category": "Uang SPK Masuk",
    "description": "Tanda Jadi SPK dari ATEP KURNIAWAN | SOLOKANJERUK BANDUNG (TIKTOK) - CASH ( LUNAS ) 25/08/2026",
    "type": "in",
    "amount": 2000000,
    "recordedBy": "Staf Administrasi Keuangan",
    "createdAt": "2026-08-03T10:00:00Z"
  },
  {
    "id": "CF-018",
    "date": "30/08/2026",
    "vehicleInfo": "DAIHATSU XENIA 1.3 R M/T 2021 | ABU-ABU",
    "plateNumber": "",
    "category": "Uang SPK Masuk",
    "description": "Tanda Jadi SPK dari RIZKY PUTRA PRATAMA | JATINANGOR SUMEDANG (FACEBOOK ( WILDAN )) - WO ( RIJECT ALL FINANCE )",
    "type": "in",
    "amount": 1000000,
    "recordedBy": "Staf Administrasi Keuangan",
    "createdAt": "2026-08-03T10:00:00Z"
  },
  {
    "id": "CF-019",
    "date": "31/08/2026",
    "vehicleInfo": "HONDA MOBILIO DD4 1.5 E FACELIFT CVT 2019 | ABU-ABU",
    "plateNumber": "",
    "category": "Uang SPK Masuk",
    "description": "Tanda Jadi SPK dari DINI YUNITA | PANANJUNG PAMULIHAN (TIKTOK) - APPROVE ( OTO )",
    "type": "in",
    "amount": 1000000,
    "recordedBy": "Staf Administrasi Keuangan",
    "createdAt": "2026-08-03T10:00:00Z"
  },
  {
    "id": "CF-020",
    "date": "03/09/2026",
    "vehicleInfo": "TOYOTA AVANZA 1.3 G M/T 2010 | HITAM",
    "plateNumber": "",
    "category": "Uang SPK Masuk",
    "description": "Tanda Jadi SPK dari HILMAN | PADAMULYA PASIRWANGI (TIKTOK) - CASH ( LUNAS ) 04/09/2026",
    "type": "in",
    "amount": 1000000,
    "recordedBy": "Staf Administrasi Keuangan",
    "createdAt": "2026-08-03T10:00:00Z"
  },
  {
    "id": "CF-021",
    "date": "19/09/2026",
    "vehicleInfo": "TOYOTA CALYA 1.2 G FACELIFT M/T 2022 | ABU-ABU",
    "plateNumber": "",
    "category": "Uang SPK Masuk",
    "description": "Tanda Jadi SPK dari IRAD RADITYA | WANGUNJAYA BUNGBULANG (TIKTOK) - CANCEL ORDER ( GRADING 3 )",
    "type": "in",
    "amount": 1000000,
    "recordedBy": "Staf Administrasi Keuangan",
    "createdAt": "2026-08-03T10:00:00Z"
  },
  {
    "id": "CF-022",
    "date": "21/09/2026",
    "vehicleInfo": "HONDA BRIO RS 1.2 M/T CKD 2018 | ABU-ABU",
    "plateNumber": "",
    "category": "Uang SPK Masuk",
    "description": "Tanda Jadi SPK dari MUHAMAD HALIMUDIN | PASANGGRAHAN | SUKAWENING (FACEBOOK ( WILDAN )) - WO",
    "type": "in",
    "amount": 1000000,
    "recordedBy": "Staf Administrasi Keuangan",
    "createdAt": "2026-08-03T10:00:00Z"
  },
  {
    "id": "CF-023",
    "date": "22/09/2026",
    "vehicleInfo": "DAIHATSU GRAND XENIA 1.3 R M/T 2016 | PUTIH",
    "plateNumber": "",
    "category": "Uang SPK Masuk",
    "description": "Tanda Jadi SPK dari NISSA NURAENI | SANCANG CIBALONG (TIKTOK) - CASH LUNAS",
    "type": "in",
    "amount": 1000000,
    "recordedBy": "Staf Administrasi Keuangan",
    "createdAt": "2026-08-03T10:00:00Z"
  },
  {
    "id": "CF-024",
    "date": "03/10/2026",
    "vehicleInfo": "TOYOTA YARIS 1.5 S A/T 2014 | ABU-ABU",
    "plateNumber": "",
    "category": "Uang SPK Masuk",
    "description": "Tanda Jadi SPK dari BIMA ASTIAN | CILAME NGAMPRAH | BANDUNG (TIKTOK) - CASH LUNAS",
    "type": "in",
    "amount": 1000000,
    "recordedBy": "Staf Administrasi Keuangan",
    "createdAt": "2026-08-03T10:00:00Z"
  },
  {
    "id": "CF-025",
    "date": "09/10/2026",
    "vehicleInfo": "DAIHATSU AYLA 1.2 R M/T 2022 | KUNING",
    "plateNumber": "",
    "category": "Uang SPK Masuk",
    "description": "Tanda Jadi SPK dari MUHAMAD RIDWANULOH | CIPAGANTI CISURUPAN | GARUT (TIKTOK) - Bi CHEKING BANK BRI",
    "type": "in",
    "amount": 1000000,
    "recordedBy": "Staf Administrasi Keuangan",
    "createdAt": "2026-08-03T10:00:00Z"
  },
  {
    "id": "CF-026",
    "date": "07/04/2026",
    "vehicleInfo": "BRIO SATYA 1.2 E | 2022",
    "plateNumber": "D 1349 VDG",
    "category": "Operasional Showroom",
    "description": "BENSIN",
    "type": "out",
    "amount": 100000,
    "recordedBy": "Staf Administrasi Keuangan",
    "createdAt": "2026-04-06T09:00:00Z"
  },
  {
    "id": "CF-027",
    "date": "06/04/2026",
    "vehicleInfo": "CALYA 1.2 G | 2018",
    "plateNumber": "Z 1393 EB",
    "category": "Perbaikan Unit",
    "description": "COVER STIR",
    "type": "out",
    "amount": 91200,
    "recordedBy": "Staf Administrasi Keuangan",
    "createdAt": "2026-04-06T09:00:00Z"
  },
  {
    "id": "CF-028",
    "date": "08/04/2026",
    "vehicleInfo": "NEW AVANZA 1.3 G | 2014",
    "plateNumber": "D 1273 VZG",
    "category": "Perbaikan Unit",
    "description": "SOKET VVT-i",
    "type": "out",
    "amount": 200000,
    "recordedBy": "Staf Administrasi Keuangan",
    "createdAt": "2026-04-06T09:00:00Z"
  },
  {
    "id": "CF-029",
    "date": "06/04/2026",
    "vehicleInfo": "GRAND AVANZA 1.3 G | 2016",
    "plateNumber": "D 1387 AEA",
    "category": "Perbaikan Unit",
    "description": "PENGELUARAN",
    "type": "out",
    "amount": 1330000,
    "recordedBy": "Staf Administrasi Keuangan",
    "createdAt": "2026-04-06T09:00:00Z"
  },
  {
    "id": "CF-030",
    "date": "06/04/2026",
    "vehicleInfo": "AYLA 1.0 X | 2014",
    "plateNumber": "D 1151 WY",
    "category": "Perbaikan Unit",
    "description": "KAKI-KAKI",
    "type": "out",
    "amount": 1050000,
    "recordedBy": "Staf Administrasi Keuangan",
    "createdAt": "2026-04-06T09:00:00Z"
  },
  {
    "id": "CF-031",
    "date": "06/04/2026",
    "vehicleInfo": "CALYA 1.2 G | 2018",
    "plateNumber": "Z 1393 EB",
    "category": "Perbaikan Unit",
    "description": "CAT",
    "type": "out",
    "amount": 900000,
    "recordedBy": "Staf Administrasi Keuangan",
    "createdAt": "2026-04-06T09:00:00Z"
  },
  {
    "id": "CF-032",
    "date": "06/04/2026",
    "vehicleInfo": "BRIO 1.2 E | 2023",
    "plateNumber": "D 1878 SAX",
    "category": "Perbaikan Unit",
    "description": "CAT",
    "type": "out",
    "amount": 600000,
    "recordedBy": "Staf Administrasi Keuangan",
    "createdAt": "2026-04-06T09:00:00Z"
  },
  {
    "id": "CF-033",
    "date": "09/04/2026",
    "vehicleInfo": "NEW AVANZA 1.3 G | 2014",
    "plateNumber": "D 1273 VZG",
    "category": "BOP & Uang Makan",
    "description": "BOP",
    "type": "out",
    "amount": 200000,
    "recordedBy": "Staf Administrasi Keuangan",
    "createdAt": "2026-04-06T09:00:00Z"
  },
  {
    "id": "CF-034",
    "date": "10/04/2026",
    "vehicleInfo": "HONDA HR-V 1.5 E CVT | 2018",
    "plateNumber": "D 1807 AGP",
    "category": "Perbaikan Unit",
    "description": "KAKI-KAKI",
    "type": "out",
    "amount": 1500000,
    "recordedBy": "Staf Administrasi Keuangan",
    "createdAt": "2026-04-06T09:00:00Z"
  },
  {
    "id": "CF-035",
    "date": "06/04/2026",
    "vehicleInfo": "XPANDER,AVANZA,AYLA,BRIO,CALYA",
    "plateNumber": "-",
    "category": "Perbaikan Unit",
    "description": "DETAILING /1 UNIT 300K",
    "type": "out",
    "amount": 1500000,
    "recordedBy": "Staf Administrasi Keuangan",
    "createdAt": "2026-04-06T09:00:00Z"
  },
  {
    "id": "CF-036",
    "date": "06/04/2026",
    "vehicleInfo": "-",
    "plateNumber": "-",
    "category": "BOP & Uang Makan",
    "description": "BOP BANDUNG",
    "type": "out",
    "amount": 150000,
    "recordedBy": "Staf Administrasi Keuangan",
    "createdAt": "2026-04-06T09:00:00Z"
  },
  {
    "id": "CF-037",
    "date": "06/04/2026",
    "vehicleInfo": "JAZZ GE8 1.5 RS | 2013",
    "plateNumber": "D 1620 RS",
    "category": "Perbaikan Unit",
    "description": "FAKTUR",
    "type": "out",
    "amount": 1100000,
    "recordedBy": "Staf Administrasi Keuangan",
    "createdAt": "2026-04-06T09:00:00Z"
  },
  {
    "id": "CF-038",
    "date": "11/04/2026",
    "vehicleInfo": "CALYA 1.2 G | 2017",
    "plateNumber": "D 1051 UAI",
    "category": "Perbaikan Unit",
    "description": "SERVICE",
    "type": "out",
    "amount": 290000,
    "recordedBy": "Staf Administrasi Keuangan",
    "createdAt": "2026-04-06T09:00:00Z"
  },
  {
    "id": "CF-039",
    "date": "06/04/2026",
    "vehicleInfo": "CALYA | 2017 & JAZZ GK5 | 2017",
    "plateNumber": "-",
    "category": "BOP & Uang Makan",
    "description": "BOP",
    "type": "out",
    "amount": 100000,
    "recordedBy": "Staf Administrasi Keuangan",
    "createdAt": "2026-04-06T09:00:00Z"
  },
  {
    "id": "CF-040",
    "date": "11/04/2026",
    "vehicleInfo": "JAZZ GK5 | 2017",
    "plateNumber": "Z 1879 DZ",
    "category": "Pajak & Surat",
    "description": "PAJAK",
    "type": "out",
    "amount": 3960000,
    "recordedBy": "Staf Administrasi Keuangan",
    "createdAt": "2026-04-06T09:00:00Z"
  },
  {
    "id": "CF-041",
    "date": "06/04/2026",
    "vehicleInfo": "BRIO 1.2 E | 2019",
    "plateNumber": "D 1623 AIC",
    "category": "Perbaikan Unit",
    "description": "CAT",
    "type": "out",
    "amount": 900000,
    "recordedBy": "Staf Administrasi Keuangan",
    "createdAt": "2026-04-06T09:00:00Z"
  },
  {
    "id": "CF-042",
    "date": "06/04/2026",
    "vehicleInfo": "JAZZ GE8 | 2013",
    "plateNumber": "D 1620 RS",
    "category": "Perbaikan Unit",
    "description": "CAT",
    "type": "out",
    "amount": 200000,
    "recordedBy": "Staf Administrasi Keuangan",
    "createdAt": "2026-04-06T09:00:00Z"
  },
  {
    "id": "CF-043",
    "date": "06/04/2026",
    "vehicleInfo": "-",
    "plateNumber": "-",
    "category": "Perbaikan Unit",
    "description": "GAJIH IRSA & CBODAS",
    "type": "out",
    "amount": 250000,
    "recordedBy": "Staf Administrasi Keuangan",
    "createdAt": "2026-04-06T09:00:00Z"
  },
  {
    "id": "CF-044",
    "date": "13/04/2026",
    "vehicleInfo": "-",
    "plateNumber": "-",
    "category": "BOP & Uang Makan",
    "description": "UANG MAKAN BYB",
    "type": "out",
    "amount": 200000,
    "recordedBy": "Staf Administrasi Keuangan",
    "createdAt": "2026-04-06T09:00:00Z"
  },
  {
    "id": "CF-045",
    "date": "06/04/2026",
    "vehicleInfo": "HONDA JAZZ GK5 1.5 RS CVT | 2017",
    "plateNumber": "Z 1879 DZ",
    "category": "Perbaikan Unit",
    "description": "KAKI-KAKI",
    "type": "out",
    "amount": 2050000,
    "recordedBy": "Staf Administrasi Keuangan",
    "createdAt": "2026-04-06T09:00:00Z"
  },
  {
    "id": "CF-046",
    "date": "14/04/2026",
    "vehicleInfo": "-",
    "plateNumber": "-",
    "category": "BOP & Uang Makan",
    "description": "BOP > TASIK (SURVEY)",
    "type": "out",
    "amount": 100000,
    "recordedBy": "Staf Administrasi Keuangan",
    "createdAt": "2026-04-06T09:00:00Z"
  },
  {
    "id": "CF-047",
    "date": "15/04/2026",
    "vehicleInfo": "HONDA JAZZ GK5 1.5 RS CVT | 2017",
    "plateNumber": "Z 1879 DZ",
    "category": "Perbaikan Unit",
    "description": "AUDIO",
    "type": "out",
    "amount": 200000,
    "recordedBy": "Staf Administrasi Keuangan",
    "createdAt": "2026-04-06T09:00:00Z"
  },
  {
    "id": "CF-048",
    "date": "06/04/2026",
    "vehicleInfo": "HONDA BRIO SATYA 1.2 E | 2019",
    "plateNumber": "D 1623 AIC",
    "category": "Perbaikan Unit",
    "description": "SALON",
    "type": "out",
    "amount": 300000,
    "recordedBy": "Staf Administrasi Keuangan",
    "createdAt": "2026-04-06T09:00:00Z"
  },
  {
    "id": "CF-049",
    "date": "15/04/2026",
    "vehicleInfo": "-",
    "plateNumber": "-",
    "category": "Perbaikan Unit",
    "description": "TOKEN LISTRIK BYB",
    "type": "out",
    "amount": 100000,
    "recordedBy": "Staf Administrasi Keuangan",
    "createdAt": "2026-04-06T09:00:00Z"
  },
  {
    "id": "CF-050",
    "date": "17/04/2026",
    "vehicleInfo": "CALYA 1.2 G | 2018",
    "plateNumber": "Z 1383 EB",
    "category": "Perbaikan Unit",
    "description": "LANTAI",
    "type": "out",
    "amount": 650000,
    "recordedBy": "Staf Administrasi Keuangan",
    "createdAt": "2026-04-06T09:00:00Z"
  }
];

export const INITIAL_INVESTORS: Investor[] = [
  {
    "id": "INV-001",
    "name": "H. AYI",
    "phone": "0812-3344-9988",
    "email": "h.ayi.investor@gmail.com",
    "totalInvestasi": 355000000,
    "totalPinjaman": 270000000,
    "totalBayar": 85000000,
    "totalAlokasiUnit": 265000000,
    "sisaSaldo": 90000000,
    "allocatedUnits": [
      {
        "carName": "TOYOTA ETIOS VALCO 1.2 G M/T 2017 PUTIH",
        "nominal": 79000000,
        "keterangan": "Investasi Unit Buyer",
        "date": "2025-07-07"
      },
      {
        "carName": "HONDA JAZZ GE8 1.5 RS A/T 2014 PUTIH",
        "nominal": 140000000,
        "keterangan": "Trade-in Jazz GE8",
        "date": "2025-07-07"
      },
      {
        "carName": "HONDA JAZZ GK5 1.5 RS CVT 2017 HITAM",
        "nominal": 193000000,
        "keterangan": "Trade-in Jazz GK5 (Selisih Rp 53.000.000)",
        "date": "2025-07-07"
      },
      {
        "carName": "TOYOTA RUSH 1.5 S A/T 2019",
        "nominal": 180000000,
        "keterangan": "Pencairan OTO Multiartha (Sisa DP Rp 22.500.000)",
        "date": "2025-08-15"
      },
      {
        "carName": "TOYOTA CALYA 1.2 G FACELIFT M/T 2023 HITAM",
        "nominal": 125000000,
        "keterangan": "Investasi Modal Unit",
        "date": "2025-09-01"
      }
    ],
    "status": "Aktif",
    "notes": "Investor Utama HR MOTOR Garut - Modal Pembelian Unit & Trade-in Showroom",
    "avatarSeed": "HajiAyiInvestor",
    "createdAt": "2024-01-01T08:00:00Z",
    "updatedAt": "2026-05-10T10:00:00Z"
  },
  {
    "id": "INV-002",
    "name": "H. DEDI KURNIA",
    "phone": "0813-8877-6655",
    "email": "h.dedi.investor@gmail.com",
    "totalInvestasi": 180000000,
    "totalPinjaman": 0,
    "totalBayar": 0,
    "totalAlokasiUnit": 155000000,
    "sisaSaldo": 25000000,
    "allocatedUnits": [
      {
        "carName": "MITSUBISHI XPANDER 1.5L EXCEED A/T 2019",
        "nominal": 155000000,
        "keterangan": "Unit Siap Jual",
        "date": "2026-02-10"
      }
    ],
    "status": "Aktif",
    "notes": "Mitra Pembiayaan Unit Family Car Showroom",
    "avatarSeed": "HajiDediInvestor",
    "createdAt": "2025-06-01T08:00:00Z",
    "updatedAt": "2026-04-20T10:00:00Z"
  }
];

export const INITIAL_PAYROLL_COMMISSIONS: PayrollCommissionRecord[] = [
  {
    "id": "PAY-001",
    "month": "Mei 2026",
    "employeeName": "Andika Fauzan Ahmad",
    "jobdesk": "Host Live",
    "description": "Honor Live Streaming Showroom (12 Sesi Live TikTok & IG)",
    "amount": 1200000,
    "unitReference": "Showroom Live Event",
    "type": "Host Live",
    "status": "Sudah Dibayar",
    "paidDate": "2026-05-30",
    "createdAt": "2026-05-25T08:00:00Z"
  },
  {
    "id": "PAY-002",
    "month": "Mei 2026",
    "employeeName": "Andika Fauzan Ahmad",
    "jobdesk": "Admin Layanan Pelanggan",
    "description": "Insentif Layanan Chat & Follow Up Prospek (18 Lead Closing)",
    "amount": 1800000,
    "unitReference": "Lead Closing Mei",
    "type": "Admin",
    "status": "Sudah Dibayar",
    "paidDate": "2026-05-30",
    "createdAt": "2026-05-25T08:00:00Z"
  },
  {
    "id": "PAY-003",
    "month": "Mei 2026",
    "employeeName": "Andika Fauzan Ahmad",
    "jobdesk": "Konten Kreator",
    "description": "Produksi Video TikTok & Reels Showroom (11 Video Komersial)",
    "amount": 2750000,
    "unitReference": "Produksi Konten TikTok Showroom",
    "type": "Konten/Foto",
    "status": "Sudah Dibayar",
    "paidDate": "2026-05-30",
    "createdAt": "2026-05-25T08:00:00Z"
  },
  {
    "id": "PAY-004",
    "month": "Mei 2026",
    "employeeName": "Gesti (Freelance)",
    "jobdesk": "Konten Kreator",
    "description": "Foto Katalog Komersial Honda BR-V 1.5 E CVT 2017 Putih",
    "amount": 50000,
    "unitReference": "HONDA BR-V 1.5 E CVT CKD 2017",
    "type": "Konten/Foto",
    "status": "Sudah Dibayar",
    "paidDate": "2026-05-15",
    "createdAt": "2026-05-15T09:00:00Z"
  },
  {
    "id": "PAY-005",
    "month": "Mei 2026",
    "employeeName": "Gesti (Freelance)",
    "jobdesk": "Konten Kreator",
    "description": "Video Pendek Reels Honda BR-V 2017",
    "amount": 50000,
    "unitReference": "HONDA BR-V 1.5 E CVT CKD 2017",
    "type": "Konten/Foto",
    "status": "Sudah Dibayar",
    "paidDate": "2026-05-15",
    "createdAt": "2026-05-15T09:30:00Z"
  },
  {
    "id": "PAY-006",
    "month": "Mei 2026",
    "employeeName": "Asep Kurniawan",
    "jobdesk": "Sales",
    "description": "Komisi Closing Penjualan Toyota Avanza Veloz (Jajang Supriatna)",
    "amount": 1500000,
    "unitReference": "TOYOTA AVANZA 1.5 VELOZ Q CVT",
    "type": "Sales",
    "status": "Sudah Dibayar",
    "paidDate": "2026-05-20",
    "createdAt": "2026-05-18T10:00:00Z"
  },
  {
    "id": "PAY-007",
    "month": "Mei 2026",
    "employeeName": "Irsa Ruswandi",
    "jobdesk": "Teknisi Otomotif",
    "description": "Inspeksi Mesin & Detailing Unit Masuk (5 Unit)",
    "amount": 1250000,
    "unitReference": "Inspeksi & Detailing Batch Mei",
    "type": "Gaji Pokok",
    "status": "Sudah Dibayar",
    "paidDate": "2026-05-30",
    "createdAt": "2026-05-25T11:00:00Z"
  },
  {
    "id": "PAY-008",
    "month": "Mei 2026",
    "employeeName": "Irsa Ruswandi",
    "jobdesk": "Teknisi Otomotif",
    "description": "Pinjaman / Kasbon Operasional Karyawan",
    "amount": -700000,
    "unitReference": "Kasbon Pinjaman Showroom",
    "type": "Pinjaman/Kasbon",
    "status": "Sudah Dibayar",
    "paidDate": "2026-05-10",
    "createdAt": "2026-05-10T14:00:00Z"
  }
];
