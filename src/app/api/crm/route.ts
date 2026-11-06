import { NextResponse } from 'next/server';
import {
  readDatabaseAsync,
  writeDatabaseAsync,
  resetDatabase,
  syncToSupabaseRelational,
  CrmDatabase,
} from '@/lib/serverStore';
import { getSupabaseConfigInfo, getServerSupabase } from '@/lib/supabase';
import {
  Customer,
  Lead,
  FollowUp,
  CommunicationRecord,
  CustomerPurchase,
  CustomerFeedback,
  CustomerComplaint,
  ActivityLog,
  RepairClaim,
  VehicleStock,
  CreditApplication,
} from '@/types/crm';

function cleanPhone(p?: string): string {
  if (!p) return '';
  const digits = p.replace(/[^0-9]/g, '');
  if (digits.startsWith('62')) return '0' + digits.slice(2);
  return digits;
}

function triggerStockMatching(stock: VehicleStock, db: CrmDatabase, userName: string) {
  if (stock.status !== 'Tersedia') return;
  if (!db.followUps) db.followUps = [];
  if (!db.notifications) db.notifications = [];
  if (!db.activityLogs) db.activityLogs = [];

  const stockBrandLower = (stock.brand || '').toLowerCase().trim();
  const stockModelLower = (stock.model || '').toLowerCase().trim();
  const stockMerkTypeLower = (stock.merkType || '').toLowerCase().trim();

  // 1. Match Prospect Follow-Ups
  db.followUps.forEach((flw) => {
    if (flw.followUpType === 'PROSPECT' && flw.status !== 'Sudah Deal' && flw.status !== 'Tidak Tertarik') {
      const pBrand = (flw.searchBrand || '').toLowerCase().trim();
      const pModel = (flw.searchModel || '').toLowerCase().trim();
      const pYear = flw.searchYear ? Number(flw.searchYear) : undefined;
      const pBudget = flw.searchBudget ? Number(flw.searchBudget) : undefined;

      const brandMatched =
        !pBrand ||
        stockBrandLower.includes(pBrand) ||
        pBrand.includes(stockBrandLower);

      if (brandMatched) {
        // Model matching: all meaningful keywords in pModel (excluding brand words) must match stock
        let modelMatched = true;
        const fullStockDesc = `${stockBrandLower} ${stockModelLower} ${stockMerkTypeLower}`;
        if (pModel) {
          const words = pModel
            .split(/[\s,-]+/)
            .map((w) => w.trim().toLowerCase())
            .filter((w) => w.length >= 2 && !pBrand.includes(w) && !stockBrandLower.includes(w));
          modelMatched = words.length > 0
            ? words.every((w) => fullStockDesc.includes(w))
            : true;
        }

        // Year matching (within +/- 1 year tolerance)
        let yearMatched = true;
        if (pYear && Math.abs(stock.year - pYear) > 1) {
          yearMatched = false;
        }

        // Budget matching (+15% showroom allowance)
        let budgetMatched = true;
        if (pBudget && stock.price > pBudget * 1.15) {
          budgetMatched = false;
        }

        if (brandMatched && modelMatched && yearMatched && budgetMatched) {
          flw.status = 'Mobil Sudah Ready';
          flw.prospectStatus = 'Mobil Sudah Ready';
          flw.matchedStockId = stock.id;
          flw.matchedStockPrice = stock.price;
          flw.matchedStockInfo = `${stock.brand} ${stock.model} (${stock.year}) - Rp ${stock.price.toLocaleString('id-ID')} [${stock.licensePlate || '-'}]`;
          flw.priority = 'Tinggi';
          flw.updatedAt = new Date().toISOString();

          // Add notification with direct tab link
          const notifExists = db.notifications.some(
            (n) => n.title.includes(flw.customerName) && n.message.includes(stock.model)
          );
          if (!notifExists) {
            db.notifications.unshift({
              id: `NOTIF-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
              userId: 'USR-001',
              title: `Mobil Tersedia: ${flw.customerName}`,
              message: `Unit ${stock.brand} ${stock.model} (${stock.year}) kini READY! Cocok dengan pencarian calon pembeli ${flw.customerName}. Segera hubungi via WhatsApp.`,
              type: 'system',
              isRead: false,
              link: '/follow-up?tab=prospect',
              createdAt: new Date().toISOString(),
            });
          }

          db.activityLogs.unshift({
            id: `LOG-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            userId: 'SYS-001',
            userName: 'Sistem CRM HR MOTOR',
            userRole: 'CRM Administrator',
            action: 'Pencocokan Prospek Otomatis',
            entityType: 'Follow-up',
            entityId: flw.id,
            details: `Unit ${stock.brand} ${stock.model} cocok dengan kebutuhan ${flw.customerName}. Status prospek diubah menjadi "Mobil Sudah Ready"!`,
            createdAt: new Date().toISOString(),
          });
        }
      }
    }
  });

  // 2. Match Leads
  if (db.leads && Array.isArray(db.leads)) {
    db.leads.forEach((lead) => {
      if (lead.status === 'Deal') return;

      let isMatch = false;

      // Check brand match
      const leadBrand = (lead.searchBrand || '').toLowerCase().trim();
      const leadModel = (lead.searchModel || '').toLowerCase().trim();
      const interested = (lead.interestedVehicle || '').toLowerCase().trim();

      const brandMatched =
        (leadBrand && (stockBrandLower.includes(leadBrand) || leadBrand.includes(stockBrandLower))) ||
        (!leadBrand && stockBrandLower.length > 0 && interested.includes(stockBrandLower));

      if (brandMatched) {
        // Check model match
        let modelMatched = true;
        if (leadModel) {
          const words = leadModel.split(' ').filter((w) => w.length > 1);
          modelMatched = words.some((w) => stockModelLower.includes(w) || stockMerkTypeLower.includes(w));
        } else if (interested) {
          const words = interested.split(' ').filter((w) => w.length > 2);
          modelMatched = words.some((w) => stockModelLower.includes(w) || stockMerkTypeLower.includes(w));
        }

        // Check year range
        let yearMatched = true;
        if (lead.searchYearMin && stock.year < lead.searchYearMin) yearMatched = false;
        if (lead.searchYearMax && stock.year > lead.searchYearMax) yearMatched = false;

        // Check budget with 15% allowance
        let budgetMatched = true;
        if (lead.searchBudgetMax && stock.price > lead.searchBudgetMax * 1.15) {
          budgetMatched = false;
        }

        if (brandMatched && modelMatched && yearMatched && budgetMatched) {
          isMatch = true;
        }
      }

      if (isMatch) {
        // Avoid duplicate follow-up for the same lead and vehicleStockId
        const alreadyExists = db.followUps.some(
          (f) => f.leadId === lead.id && f.vehicleStockId === stock.id
        );

        if (!alreadyExists) {
          const matchedCust = lead.customerId ? db.customers?.find((c) => c.id === lead.customerId) : null;
          const phone = lead.contactNumber || lead.customerPhone || matchedCust?.whatsapp || '';

          const newFlw: FollowUp = {
            id: `FLW-2026-${String(db.followUps.length + 1).padStart(3, '0')}`,
            followUpType: 'PROSPECT',
            customerId: lead.customerId,
            customerName: lead.customerName,
            customerPhone: phone,
            leadId: lead.id,
            category: 'Unit yang Dicari Sudah Tersedia',
            scheduledDate: new Date().toISOString().split('T')[0],
            scheduledTime: '09:00',
            channel: 'WhatsApp',
            status: 'Mobil Sudah Ready',
            prospectStatus: 'Mobil Sudah Ready',
            priority: 'Tinggi',
            vehicleStockId: stock.id,
            matchedStockId: stock.id,
            matchedStockInfo: `${stock.brand} ${stock.model} (${stock.year}) - Rp ${stock.price.toLocaleString('id-ID')}`,
            vehicleInfo: `${stock.brand} ${stock.model} (${stock.year}) - Rp ${stock.price.toLocaleString('id-ID')}`,
            followUpReason: `Unit yang dicari konsumen (${stock.brand} ${stock.model} ${stock.year}) baru saja tersedia di showroom HR MOTOR. Segera hubungi sebelum unit terjual.`,
            isUnitSold: false,
            notes: `Otomatis dijadwalkan oleh sistem: Cocok dengan preferensi pencarian ${lead.customerName}.`,
            communicationLogs: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };

          db.followUps.unshift(newFlw);

          db.activityLogs.unshift({
            id: `LOG-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            userId: 'SYS-001',
            userName: 'Sistem CRM HR MOTOR',
            userRole: 'CRM Administrator',
            action: 'Pencocokan Stok Otomatis',
            entityType: 'Follow-up',
            entityId: newFlw.id,
            details: `Unit ${stock.brand} ${stock.model} cocok dengan kebutuhan ${lead.customerName}. Dibuat follow-up prioritas tinggi!`,
            createdAt: new Date().toISOString(),
          });
        }
      }
    });
  }
}

export async function GET() {
  try {
    const db = await readDatabaseAsync();
    return NextResponse.json({ success: true, data: db, supabase: getSupabaseConfigInfo() });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, payload, currentUser } = body;
    const db = await readDatabaseAsync();

    const userName = currentUser?.name || 'Sistem CRM';
    const userRole = currentUser?.role || 'CRM Administrator';
    const userId = currentUser?.id || 'USR-002';

    const logActivity = (actionTitle: string, entityType: ActivityLog['entityType'], entityId: string, details: string) => {
      const newLog: ActivityLog = {
        id: `LOG-${Date.now()}`,
        userId,
        userName,
        userRole,
        action: actionTitle,
        entityType,
        entityId,
        details,
        createdAt: new Date().toISOString(),
      };
      db.activityLogs.unshift(newLog);
      if (db.activityLogs.length > 200) {
        db.activityLogs = db.activityLogs.slice(0, 200);
      }
    };

    switch (action) {
      case 'RESET_DEMO_DATA': {
        const fresh = resetDatabase();
        return NextResponse.json({ success: true, data: fresh });
      }

      // CUSTOMERS
      case 'ADD_CUSTOMER': {
        const customer: Customer = {
          ...payload,
          id: payload.id || `CUST-2026-${String(db.customers.length + 1).padStart(3, '0')}`,
          registeredDate: payload.registeredDate || new Date().toISOString().split('T')[0],
          updatedAt: new Date().toISOString(),
        };

        // Duplicate WhatsApp check (only if non-empty)
        if (customer.whatsapp && customer.whatsapp.trim().length > 4) {
          const existing = db.customers.find((c) => c.whatsapp && c.whatsapp === customer.whatsapp);
          if (existing) {
            return NextResponse.json(
              { success: false, error: `Nomor WhatsApp ${customer.whatsapp} sudah terdaftar atas nama ${existing.fullName}` },
              { status: 400 }
            );
          }
        }

        db.customers.unshift(customer);

        // Otomatis buat Kwitansi & Riwayat Transaksi Showroom HR MOTOR
        if (customer.interestedVehicle || customer.plateNumber || customer.receiptAmount || customer.budget) {
          const purchaseId = `DEAL-2026-${String(db.purchases.length + 1).padStart(3, '0')}`;
          const dateNow = customer.registeredDate || new Date().toISOString().split('T')[0];
          const newPurchase: CustomerPurchase = {
            id: purchaseId,
            customerId: customer.id,
            customerName: customer.fullName,
            vehicleBrand: (customer.interestedVehicle || '').split(' ')[0] || 'Showroom HR MOTOR',
            vehicleModel: customer.interestedVehicle || 'Unit Showroom HR MOTOR',
            vehicleYear: new Date().getFullYear(),
            plateNumber: customer.plateNumber || 'Z - HR MOTOR',
            color: 'Orisinal Showroom',
            mileageKm: 35000,
            purchasePrice: customer.receiptAmount || customer.budget || 0,
            paymentMethod: (customer.notes || '').toUpperCase().includes('OTO') ? 'Kredit OTO Multiartha' : 'Cash Keras',
            purchaseDate: dateNow,
            warrantyUntil: `${parseInt(dateNow.slice(0, 4)) + 1}${dateNow.slice(4)}`,
            salesId: currentUser?.id || 'USR-001',
            salesName: customer.receiptReceiver || 'HR MOTOR',
            notes: customer.notes || `Kwitansi Pembayaran Showroom HR MOTOR`,
            createdAt: new Date().toISOString(),
            receiptNumber: customer.receiptNumber || `No. ${db.customers.length}`,
            receiptDate: customer.receiptDate || `GARUT, ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }).toUpperCase()}`,
            receiptReceiver: customer.receiptReceiver || 'HR MOTOR',
          };
          db.purchases.unshift(newPurchase);
        }

        logActivity('Menambah Pelanggan Baru', 'Pelanggan', customer.id, `Mendaftarkan pelanggan baru ${customer.fullName} (${customer.district}, Garut)`);
        break;
      }

      case 'UPDATE_CUSTOMER': {
        const index = db.customers.findIndex((c) => c.id === payload.id);
        if (index === -1) {
          return NextResponse.json({ success: false, error: 'Pelanggan tidak ditemukan' }, { status: 404 });
        }
        db.customers[index] = {
          ...db.customers[index],
          ...payload,
          updatedAt: new Date().toISOString(),
        };
        logActivity('Memperbarui Data Pelanggan', 'Pelanggan', payload.id, `Memperbarui profil ${db.customers[index].fullName}`);
        break;
      }

      case 'DELETE_CUSTOMER': {
        const customer = db.customers.find((c) => c.id === payload.id);
        if (!customer) {
          return NextResponse.json({ success: false, error: 'Pelanggan tidak ditemukan' }, { status: 404 });
        }
        db.customers = db.customers.filter((c) => c.id !== payload.id);
        logActivity('Menghapus Pelanggan', 'Pelanggan', payload.id, `Menghapus data pelanggan ${customer.fullName}`);
        break;
      }

      // LEADS
      case 'ADD_LEAD': {
        const initialStage = payload.status || 'Hanya Menanyakan';
        const now = new Date().toISOString();
        const contactNum = payload.contactNumber || payload.customerPhone || '';
        
        // Prevent ID collisions after deletion by finding maximum existing sequence
        const maxLeadNum = (db.leads || []).reduce((max, l) => {
          const match = (l.id || '').match(/LEAD-\d+-(\d+)/);
          if (match) {
            const num = parseInt(match[1], 10);
            return num > max ? num : max;
          }
          return max;
        }, 0);
        const assignedLeadId = payload.id || `LEAD-2026-${String(maxLeadNum + 1).padStart(3, '0')}`;

        // Link with existing customer if matching whatsapp exists
        let customerId = payload.customerId;
        if (!customerId && db.customers && contactNum) {
          const cleanPhone = contactNum.replace(/\D/g, '');
          const matchedCust = db.customers.find((c) => {
            const custPhone = (c.whatsapp || '').replace(/\D/g, '');
            return (
              cleanPhone.length >= 8 &&
              custPhone.length >= 8 &&
              (cleanPhone === custPhone || cleanPhone.endsWith(custPhone) || custPhone.endsWith(cleanPhone))
            );
          });
          if (matchedCust) {
            customerId = matchedCust.id;
          }
        }

        const lead: Lead = {
          ...payload,
          id: assignedLeadId,
          customerId,
          contactNumber: contactNum,
          customerPhone: contactNum,
          leadSource: payload.leadSource || 'WhatsApp',
          status: initialStage,
          dateReceived: payload.dateReceived || now.split('T')[0],
          lastContactDate: now,
          stageHistory: payload.stageHistory || [
            {
              stage: initialStage,
              timestamp: now,
              notes: payload.notes || 'Calon konsumen tercatat di sistem Sales Pipeline WhatsApp',
              updatedByName: userName,
            },
          ],
          createdAt: now,
          updatedAt: now,
        };
        db.leads.unshift(lead);
        logActivity('Menerima Prospek Baru', 'Prospek', lead.id, `Prospek baru ${lead.customerName} sumber ${lead.leadSource} (Unit: ${lead.interestedVehicle || 'Belum spesifik'})`);
        break;
      }

      case 'UPDATE_LEAD': {
        const index = db.leads.findIndex((l) => l.id === payload.id);
        if (index === -1) {
          return NextResponse.json({ success: false, error: 'Prospek tidak ditemukan' }, { status: 404 });
        }
        const oldLead = db.leads[index];
        const oldStage = oldLead.status;
        const newStage = payload.status && payload.status !== oldStage ? payload.status : oldStage;
        const now = new Date().toISOString();
        const contactNum = payload.contactNumber || payload.customerPhone || oldLead.contactNumber || oldLead.customerPhone || '';

        let stageHistory = [...(oldLead.stageHistory || [])];
        if (payload.status && payload.status !== oldStage) {
          stageHistory.push({
            stage: newStage,
            timestamp: now,
            notes: payload.notes || `Tahapan komunikasi diubah menjadi "${newStage}"`,
            updatedByName: userName,
          });
        }

        db.leads[index] = {
          ...oldLead,
          ...payload,
          contactNumber: contactNum,
          customerPhone: contactNum,
          status: newStage,
          stageHistory,
          updatedAt: now,
        };

        // Synchronize customer name & WhatsApp to linked Customer record and Follow-ups
        const updatedName = payload.customerName || oldLead.customerName;
        if (oldLead.customerId && db.customers) {
          const cust = db.customers.find((c) => c.id === oldLead.customerId);
          if (cust) {
            if (payload.customerName) cust.fullName = payload.customerName;
            if (contactNum) cust.whatsapp = contactNum;
            cust.updatedAt = now;
          }
        }
        if (db.followUps) {
          db.followUps.forEach((f) => {
            if (f.leadId === payload.id) {
              if (updatedName) f.customerName = updatedName;
              if (contactNum) f.customerPhone = contactNum;
              f.updatedAt = now;
            }
          });
        }

        logActivity('Memperbarui Data Prospek', 'Prospek', payload.id, `Memperbarui info prospek ${db.leads[index].customerName}`);
        break;
      }

      case 'UPDATE_LEAD_STAGE': {
        const lead = db.leads.find((l) => l.id === payload.id);
        if (!lead) {
          return NextResponse.json({ success: false, error: 'Prospek tidak ditemukan' }, { status: 404 });
        }
        const oldStage = lead.status;
        const newStage = payload.stage;
        const now = new Date().toISOString();

        lead.status = newStage;
        lead.lastContactDate = now;
        lead.updatedAt = now;
        if (payload.notes) lead.notes = payload.notes;

        if (newStage === 'Cek Unit') {
          lead.visitNotes = payload.visitNotes || payload.notes || lead.visitNotes;
          lead.visitDate = payload.visitDate || now;
        }
        if (newStage === 'Negosiasi') {
          if (payload.negotiationOffer) lead.negotiationOffer = Number(payload.negotiationOffer);
          if (payload.negotiationNotes) lead.negotiationNotes = payload.negotiationNotes;
        }
        if (newStage === 'Lost') {
          lead.lostReason = payload.lostReason;
          if (payload.lostReasonCategory) lead.lostReasonCategory = payload.lostReasonCategory;

          // Auto-schedule 1-month follow-up for Prospek Tidak Jadi
          const lostDateObj = new Date(now);
          lostDateObj.setMonth(lostDateObj.getMonth() + 1);
          const oneMonthDate = lostDateObj.toISOString().split('T')[0];

          const leadCust = lead.customerId ? db.customers?.find((c) => c.id === lead.customerId) : null;
          const leadPhone = lead.contactNumber || lead.customerPhone || leadCust?.whatsapp || '';

          if (!db.followUps) db.followUps = [];
          const oneMonthFollowUp: FollowUp = {
            id: `FLW-2026-${String(db.followUps.length + 1).padStart(3, '0')}`,
            customerId: lead.customerId,
            customerName: lead.customerName,
            customerPhone: leadPhone,
            leadId: lead.id,
            category: 'Prospek Tidak Jadi (1 Bulan)',
            scheduledDate: oneMonthDate,
            scheduledTime: '10:00',
            channel: 'WhatsApp',
            status: 'Belum Dihubungi',
            priority: 'Sedang',
            vehicleInfo: lead.interestedVehicle || 'Unit yang pernah diminati',
            followUpReason: `Prospek sebelumnya berstatus Lost (${payload.lostReason || 'Tidak jadi membeli'}). Menanyakan apakah masih mencari mobil atau tertarik dengan unit stok terbaru di HR MOTOR.`,
            notes: `Jadwal otomatis 1 bulan pasca-Lost (${now.split('T')[0]}).`,
            communicationLogs: [],
            createdAt: now,
            updatedAt: now,
          };
          db.followUps.unshift(oneMonthFollowUp);
        }
        if (newStage === 'Deal') {
          lead.dealValue = payload.dealValue || lead.estimatedBudget;
          lead.dealVehicle = payload.dealVehicle || lead.interestedVehicle;
          lead.dealDate = payload.dealDate || now.split('T')[0];

          // Also create purchase record if not exists
          const newPurchase: CustomerPurchase = {
            id: `DEAL-2026-${String(db.purchases.length + 1).padStart(3, '0')}`,
            customerId: lead.customerId || `CUST-2026-${String(db.customers.length + 1).padStart(3, '0')}`,
            customerName: lead.customerName,
            leadId: lead.id,
            vehicleBrand: (lead.interestedVehicle || 'Toyota').split(' ')[0],
            vehicleModel: lead.interestedVehicle || 'Kendaraan Bermotor',
            vehicleYear: 2020,
            plateNumber: payload.plateNumber || 'Z ' + Math.floor(1000 + Math.random() * 9000) + ' HR',
            color: payload.color || 'Hitam Metalik',
            mileageKm: payload.mileageKm || 45000,
            purchasePrice: lead.dealValue || lead.estimatedBudget || 0,
            paymentMethod: payload.paymentMethod || 'Cash Keras',
            purchaseDate: lead.dealDate || new Date().toISOString().split('T')[0],
            warrantyUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            salesId: lead.assignedSalesId || userId,
            salesName: lead.assignedSalesName || userName,
            notes: payload.notes || 'Penyerahan unit sukses di HR MOTOR Garut.',
            createdAt: now,
          };
          db.purchases.unshift(newPurchase);

          // Update customer status to Sudah Beli
          if (lead.customerId) {
            const cust = db.customers.find((c) => c.id === lead.customerId);
            if (cust) cust.status = 'Sudah Beli';
          }

          // Auto-schedule 1-year follow-up for Pelanggan Lama
          const dealDateObj = new Date(lead.dealDate || now);
          dealDateObj.setFullYear(dealDateObj.getFullYear() + 1);
          const oneYearDate = dealDateObj.toISOString().split('T')[0];

          const dealCust = lead.customerId ? db.customers?.find((c) => c.id === lead.customerId) : null;
          const dealPhone = lead.contactNumber || lead.customerPhone || dealCust?.whatsapp || '';

          if (!db.followUps) db.followUps = [];
          const oneYearFollowUp: FollowUp = {
            id: `FLW-2026-${String(db.followUps.length + 1).padStart(3, '0')}`,
            customerId: lead.customerId,
            customerName: lead.customerName,
            customerPhone: dealPhone,
            leadId: lead.id,
            category: 'Pelanggan Lama (1 Tahun)',
            scheduledDate: oneYearDate,
            scheduledTime: '10:00',
            channel: 'WhatsApp',
            status: 'Belum Dihubungi',
            priority: 'Sedang',
            vehicleInfo: lead.dealVehicle || lead.interestedVehicle || 'Unit HR MOTOR',
            followUpReason: 'Pengecekan kepuasan 1 tahun pemakaian unit, kondisi kendaraan, dan penawaran tukar tambah (trade-in) atau penjualan kembali ke HR MOTOR.',
            notes: `Jadwal otomatis 1 tahun pasca-Deal (${lead.dealDate || now.split('T')[0]}).`,
            communicationLogs: [],
            createdAt: now,
            updatedAt: now,
          };
          db.followUps.unshift(oneYearFollowUp);
        }

        // Append to stageHistory
        if (!lead.stageHistory) lead.stageHistory = [];
        lead.stageHistory.push({
          stage: newStage,
          timestamp: now,
          notes: payload.notes,
          visitNotes: payload.visitNotes,
          negotiationOffer: payload.negotiationOffer ? Number(payload.negotiationOffer) : undefined,
          negotiationNotes: payload.negotiationNotes,
          lostReason: payload.lostReason,
          dealDate: payload.dealDate,
          dealValue: payload.dealValue,
          updatedByName: userName,
        });

        logActivity(
          'Perubahan Tahapan Pipeline',
          'Prospek',
          lead.id,
          `Mengubah tahapan prospek ${lead.customerName} dari "${oldStage}" ke "${newStage}"`
        );
        break;
      }

      case 'DELETE_LEAD': {
        const leadIndex = db.leads.findIndex((l) => l.id === payload.id);
        if (leadIndex === -1) {
          return NextResponse.json({ success: false, error: 'Lead tidak ditemukan' }, { status: 404 });
        }
        const deletedLead = db.leads[leadIndex];
        db.leads.splice(leadIndex, 1);
        if (db.followUps) {
          db.followUps = db.followUps.filter((f) => f.leadId !== payload.id);
        }
        logActivity(
          'Menghapus Data Lead',
          'Prospek',
          payload.id,
          `Menghapus data calon konsumen ${deletedLead.customerName} (${deletedLead.contactNumber || deletedLead.customerPhone || '-'})`
        );
        break;
      }

      // FOLLOW-UPS
      case 'ADD_FOLLOW_UP': {
        if (!db.followUps) db.followUps = [];
        const followUp: FollowUp = {
          ...payload,
          id: payload.id || `FLW-2026-${String(db.followUps.length + 1).padStart(3, '0')}`,
          status: payload.status || 'Belum Dihubungi',
          category: payload.category || 'Unit yang Dicari Sudah Tersedia',
          communicationLogs: payload.communicationLogs || [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        db.followUps.unshift(followUp);
        logActivity('Menjadwalkan Follow-up', 'Follow-up', followUp.id, `Jadwal follow-up (${followUp.category}) untuk ${followUp.customerName} pada ${followUp.scheduledDate}`);
        break;
      }

      case 'LOG_FOLLOW_UP_COMMUNICATION': {
        if (!db.followUps) db.followUps = [];
        const item = db.followUps.find((f) => f.id === payload.id);
        if (!item) {
          return NextResponse.json({ success: false, error: 'Follow-up tidak ditemukan' }, { status: 404 });
        }
        const now = new Date().toISOString();
        const outcome = payload.outcome; // CommunicationResultOutcome
        const notes = payload.notes || payload.currentInterestNotes || '';
        const nextDate = payload.scheduleNextDate;
        const nextCategory = payload.scheduleNextCategory;

        if (!item.communicationLogs) item.communicationLogs = [];
        item.communicationLogs.unshift({
          id: `LOG-FLW-${Date.now()}`,
          timestamp: now,
          outcome,
          notes,
          salesName: userName,
          nextFollowUpDate: nextDate,
        });

        item.lastOutcome = outcome;
        item.lastContactDate = now;
        item.updatedAt = now;

        const itemCust = item.customerId ? db.customers?.find((c) => c.id === item.customerId) : null;
        const itemLead = item.leadId ? db.leads?.find((l) => l.id === item.leadId) : null;
        const resolvedPhone = item.customerPhone || itemLead?.contactNumber || itemLead?.customerPhone || itemCust?.whatsapp || '';
        if (!item.customerPhone && resolvedPhone) {
          item.customerPhone = resolvedPhone;
        }

        // Determine new follow-up status
        if (item.followUpType === 'CUSTOMER') {
          if (payload.status) {
            item.status = payload.status;
          }
          if (payload.periodicStep) {
            item.periodicStep = payload.periodicStep;
          }
          if (payload.scheduledDate) {
            item.scheduledDate = payload.scheduledDate;
          }
        } else {
          if (payload.status) {
            item.status = payload.status;
          } else if (outcome === 'Berhasil Transaksi / Deal') {
            item.status = 'Berhasil Transaksi';
            const dealDateObj = new Date();
            dealDateObj.setFullYear(dealDateObj.getFullYear() + 1);
            const oneYearDate = dealDateObj.toISOString().split('T')[0];

            db.followUps.unshift({
              id: `FLW-2026-${String(db.followUps.length + 1).padStart(3, '0')}`,
              customerId: item.customerId,
              customerName: item.customerName,
              customerPhone: resolvedPhone,
              leadId: item.leadId,
              category: 'Pelanggan Lama (1 Tahun)',
              scheduledDate: oneYearDate,
              scheduledTime: '10:00',
              channel: 'WhatsApp',
              status: 'Belum Dihubungi',
              priority: 'Sedang',
              vehicleInfo: item.vehicleInfo || 'Unit HR MOTOR',
              followUpReason: 'Pengecekan kepuasan 1 tahun pemakaian unit pasca-transaksi follow-up, cek kondisi kendaraan, dan penawaran trade-in.',
              notes: `Hasil follow-up sukses deal. Jadwal otomatis 1 tahun ke depan (${oneYearDate}).`,
              communicationLogs: [],
              createdAt: now,
              updatedAt: now,
            });
          } else if (outcome === 'Sudah Beli di Tempat Lain') {
            item.status = 'Tidak Berminat';
            const nextYearObj = new Date();
            nextYearObj.setFullYear(nextYearObj.getFullYear() + 1);
            const oneYearDate = nextYearObj.toISOString().split('T')[0];

            db.followUps.unshift({
              id: `FLW-2026-${String(db.followUps.length + 1).padStart(3, '0')}`,
              customerId: item.customerId,
              customerName: item.customerName,
              customerPhone: resolvedPhone || item.customerPhone || '',
              leadId: item.leadId,
              category: 'Pelanggan Lama (1 Tahun)',
              scheduledDate: oneYearDate,
              scheduledTime: '10:00',
              channel: 'WhatsApp',
              status: 'Belum Dihubungi',
              priority: 'Rendah',
              vehicleInfo: item.vehicleInfo || 'Mobil yang dibeli di luar',
              followUpReason: 'Konsumen sempat beli di luar showroom 1 tahun lalu. Follow-up untuk penawaran upgrade unit atau penjualan kembali ke HR MOTOR.',
              notes: `Auto-convert pasca beli di tempat lain: Jadwal cek 1 tahun (${oneYearDate}).`,
              communicationLogs: [],
              createdAt: now,
              updatedAt: now,
            });
          } else if (outcome === 'Tertarik Datang ke Showroom' || outcome === 'Minta Foto / Video Detail' || outcome === 'Sudah Dihubungi') {
            item.status = 'Sudah Dihubungi';
          } else if (outcome === 'Menunggu Konfirmasi Keluarga' || outcome === 'Sedang Mempertimbangkan Unit Lain') {
            item.status = 'Menunggu Respons';
          } else if (outcome === 'Tidak Ada Respons' || outcome === 'Tidak Merespons') {
            item.status = 'Tidak Merespons';
          } else if (outcome === 'Selesai') {
            item.status = 'Selesai';
          } else if (outcome === 'Belum Dihubungi') {
            item.status = 'Belum Dihubungi';
          }
        }

        // If manual next follow-up date was specified
        if (nextDate) {
          const nextFlw: FollowUp = {
            id: `FLW-2026-${String(db.followUps.length + 1).padStart(3, '0')}`,
            customerId: item.customerId,
            customerName: item.customerName,
            customerPhone: resolvedPhone || item.customerPhone || '',
            leadId: item.leadId,
            category: nextCategory || item.category,
            scheduledDate: nextDate,
            scheduledTime: payload.scheduleNextTime || '10:00',
            channel: payload.scheduleNextChannel || item.channel || 'WhatsApp',
            status: 'Belum Dihubungi',
            priority: payload.scheduleNextPriority || 'Sedang',
            vehicleStockId: item.vehicleStockId,
            vehicleInfo: item.vehicleInfo,
            followUpReason: payload.scheduleNextReason || `Follow-up lanjutan berdasarkan hasil komunikasi: ${outcome}`,
            notes: payload.scheduleNextNotes || notes,
            communicationLogs: [],
            createdAt: now,
            updatedAt: now,
          };
          db.followUps.unshift(nextFlw);
        }

        // Also record communication in db.communications
        db.communications.unshift({
          id: `COMM-2026-${String(db.communications.length + 1).padStart(3, '0')}`,
          customerId: item.customerId || '',
          customerName: item.customerName,
          customerPhone: item.customerPhone || '',
          leadId: item.leadId,
          channel: (item.channel === 'Kunjungan Dealer' || item.channel === 'Kunjungan Rumah' ? 'Walk-in' : (item.channel as any)) || 'WhatsApp',
          direction: 'Keluar',
          notes: notes || `Hasil komunikasi follow-up: ${outcome}`,
          messageContent: notes || `Follow-up (${item.category}): ${outcome}`,
          loggedById: userId,
          loggedByName: userName,
          lastContactDate: now,
          createdAt: now,
        });

        logActivity('Mencatat Hasil Follow-up', 'Follow-up', item.id, `Catatan komunikasi untuk ${item.customerName}: ${outcome}. Catatan: ${notes}`);
        break;
      }

      case 'COMPLETE_FOLLOW_UP': {
        const item = db.followUps.find((f) => f.id === payload.id);
        if (!item) {
          return NextResponse.json({ success: false, error: 'Follow-up tidak ditemukan' }, { status: 404 });
        }
        item.status = payload.status || 'Berhasil Transaksi';
        item.resultNotes = payload.resultNotes || 'Follow-up telah diselesaikan.';
        item.completedAt = new Date().toISOString();
        item.updatedAt = new Date().toISOString();

        logActivity('Menyelesaikan Follow-up', 'Follow-up', item.id, `Follow-up ${item.customerName} selesai: ${item.resultNotes}`);
        break;
      }

      case 'UPDATE_FOLLOW_UP': {
        if (!db.followUps) db.followUps = [];
        const index = db.followUps.findIndex((f) => f.id === payload.id);
        if (index === -1) {
          return NextResponse.json({ success: false, error: 'Follow-up tidak ditemukan' }, { status: 404 });
        }
        db.followUps[index] = {
          ...db.followUps[index],
          ...payload,
          updatedAt: new Date().toISOString(),
        };
        logActivity('Memperbarui Follow-up', 'Follow-up', payload.id, `Memperbarui follow-up ${db.followUps[index].customerName}`);
        break;
      }

      case 'DELETE_FOLLOW_UP': {
        if (!db.followUps) db.followUps = [];
        const flw = db.followUps.find((f) => f.id === payload.id);
        if (!flw) {
          return NextResponse.json({ success: false, error: 'Follow-up tidak ditemukan' }, { status: 404 });
        }
        db.followUps = db.followUps.filter((f) => f.id !== payload.id);
        logActivity('Menghapus Follow-up', 'Follow-up', payload.id, `Menghapus jadwal follow-up ${flw.customerName}`);
        break;
      }

      // COMMUNICATIONS
      case 'LOG_COMMUNICATION': {
        const comm: CommunicationRecord = {
          ...payload,
          id: payload.id || `COMM-2026-${String(db.communications.length + 1).padStart(3, '0')}`,
          loggedById: userId,
          loggedByName: userName,
          lastContactDate: new Date().toISOString(),
          createdAt: new Date().toISOString(),
        };
        db.communications.unshift(comm);

        // Update last contact on lead if present
        if (comm.leadId) {
          const l = db.leads.find((lead) => lead.id === comm.leadId);
          if (l) l.lastContactDate = new Date().toISOString();
        }

        logActivity('Mencatat Komunikasi', 'Komunikasi', comm.id, `Interaksi via ${comm.channel} dengan ${comm.customerName}`);
        break;
      }

      // AFTER SALES & COMPLAINTS
      case 'ADD_FEEDBACK': {
        const fdb: CustomerFeedback = {
          ...payload,
          id: payload.id || `FDB-2026-${String(db.feedback.length + 1).padStart(3, '0')}`,
          createdAt: new Date().toISOString(),
        };
        db.feedback.unshift(fdb);
        logActivity('Mencatat Umpan Balik Konsumen', 'Pelanggan', fdb.customerId, `Rating ${fdb.rating}/5 dari ${fdb.customerName}`);
        break;
      }

      case 'ADD_COMPLAINT': {
        const cmp: CustomerComplaint = {
          ...payload,
          id: payload.id || `CMP-2026-${String(db.complaints.length + 1).padStart(3, '0')}`,
          ticketNumber: `TIKET-GARUT-${String(db.complaints.length + 1).padStart(3, '0')}`,
          status: 'Baru',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        db.complaints.unshift(cmp);
        logActivity('Membuka Tiket Komplain', 'Komplain', cmp.id, `Tiket ${cmp.ticketNumber}: ${cmp.title} (${cmp.customerName})`);
        break;
      }

      case 'RESOLVE_COMPLAINT': {
        const cmp = db.complaints.find((c) => c.id === payload.id);
        if (!cmp) {
          return NextResponse.json({ success: false, error: 'Komplain tidak ditemukan' }, { status: 404 });
        }
        cmp.status = payload.status || 'Selesai';
        cmp.resolutionNotes = payload.resolutionNotes;
        cmp.resolvedAt = new Date().toISOString();
        cmp.updatedAt = new Date().toISOString();
        logActivity('Menyelesaikan Tiket Komplain', 'Komplain', cmp.id, `Tiket ${cmp.ticketNumber} diselesaikan: ${cmp.resolutionNotes}`);
        break;
      }

      // GARANSI & PERBAIKAN (REPAIR & WARRANTY CLAIMS)
      case 'ADD_REPAIR_CLAIM': {
        const hasExplicitTotal = payload.totalCost !== undefined;
        const totalCost = hasExplicitTotal
          ? Number(payload.totalCost) || 0
          : (Number(payload.sparepartCost) || 0) + (Number(payload.serviceCost) || 0);
        const sparepartCost = payload.sparepartCost !== undefined
          ? Number(payload.sparepartCost) || 0
          : totalCost;
        const serviceCost = payload.serviceCost !== undefined
          ? Number(payload.serviceCost) || 0
          : 0;
        let maxNum = 0;
        (db.repairClaims || []).forEach((c) => {
          const match = (c.claimNumber || c.id || '').match(/(\d+)$/);
          if (match) {
            const num = parseInt(match[1], 10);
            if (!isNaN(num) && num > maxNum) maxNum = num;
          }
        });
        const nextSeq = Math.max(maxNum + 1, (db.repairClaims || []).length + 1);
        const claimNum = payload.claimNumber || `GRS-2026-${String(nextSeq).padStart(3, '0')}`;
        const newClaim: RepairClaim = {
          id: payload.id || `REP-2026-${String(nextSeq).padStart(3, '0')}`,
          claimNumber: claimNum,
          customerId: payload.customerId || '',
          customerName: payload.customerName || '',
          customerPhone: payload.customerPhone || '',
          vehicleBrand: payload.vehicleBrand || '',
          vehicleModel: payload.vehicleModel || '',
          vehicleYear: Number(payload.vehicleYear) || 2020,
          plateNumber: payload.plateNumber || '',
          workshop: payload.workshop || '',
          purchaseDate: payload.purchaseDate || '',
          claimDate: payload.claimDate || new Date().toISOString().split('T')[0],
          claimType: payload.claimType || 'Garansi',
          damageCategory: payload.damageCategory || 'Mesin',
          complaint: payload.complaint || payload.complaintOrDamage || '',
          complaintOrDamage: payload.complaintOrDamage || payload.complaint || '',
          partsToRepair: payload.partsToRepair || payload.damagedParts || '',
          damagedParts: payload.damagedParts || payload.partsToRepair || '',
          actionTaken: payload.actionTaken || payload.repairActionDescription || '',
          repairActionDescription: payload.repairActionDescription || payload.actionTaken || '',
          sparepartCost,
          serviceCost,
          totalCost,
          status: payload.status || 'Selesai',
          notes: payload.notes || '',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          resolvedAt: payload.status === 'Selesai' ? new Date().toISOString() : undefined,
        };

        if (!db.repairClaims) db.repairClaims = [];
        db.repairClaims.unshift(newClaim);
        logActivity(
          'Mencatat Pengajuan Perbaikan',
          'Pelanggan',
          newClaim.customerId || newClaim.id,
          `Pengajuan ${newClaim.claimType} ${newClaim.claimNumber} (${newClaim.customerName} - ${newClaim.vehicleBrand} ${newClaim.vehicleModel}) Total: Rp ${totalCost.toLocaleString('id-ID')}`
        );
        break;
      }

      case 'UPDATE_REPAIR_CLAIM': {
        if (!db.repairClaims) db.repairClaims = [];
        const index = db.repairClaims.findIndex((r) => r.id === payload.id);
        if (index === -1) {
          return NextResponse.json({ success: false, error: 'Data klaim perbaikan tidak ditemukan' }, { status: 404 });
        }
        const existing = db.repairClaims[index];
        const hasExplicitTotal = payload.totalCost !== undefined;
        const totalCost = hasExplicitTotal
          ? Number(payload.totalCost) || 0
          : (payload.sparepartCost !== undefined ? Number(payload.sparepartCost) || 0 : existing.sparepartCost) +
            (payload.serviceCost !== undefined ? Number(payload.serviceCost) || 0 : existing.serviceCost);
        const sparepartCost = payload.sparepartCost !== undefined
          ? Number(payload.sparepartCost) || 0
          : (hasExplicitTotal ? totalCost : existing.sparepartCost);
        const serviceCost = payload.serviceCost !== undefined
          ? Number(payload.serviceCost) || 0
          : (hasExplicitTotal ? 0 : existing.serviceCost);

        const wasFinished = existing.status === 'Selesai';
        const isNowFinished = payload.status === 'Selesai';
        const resolvedAt = isNowFinished && !wasFinished ? new Date().toISOString() : existing.resolvedAt;

        db.repairClaims[index] = {
          ...existing,
          ...payload,
          sparepartCost,
          serviceCost,
          totalCost,
          resolvedAt,
          updatedAt: new Date().toISOString(),
        };
        logActivity(
          'Memperbarui Pengajuan Perbaikan',
          'Pelanggan',
          payload.id,
          `Pembaruan klaim ${existing.claimNumber} (${existing.customerName}) menjadi status ${payload.status || existing.status}`
        );
        break;
      }

      case 'DELETE_REPAIR_CLAIM': {
        if (!db.repairClaims) db.repairClaims = [];
        const claim = db.repairClaims.find((r) => r.id === payload.id);
        if (!claim) {
          return NextResponse.json({ success: false, error: 'Data klaim perbaikan tidak ditemukan' }, { status: 404 });
        }
        db.repairClaims = db.repairClaims.filter((r) => r.id !== payload.id);
        logActivity(
          'Menghapus Pengajuan Perbaikan',
          'Pelanggan',
          payload.id,
          `Menghapus data klaim perbaikan ${claim.claimNumber} (${claim.customerName})`
        );
        break;
      }

      // MANAJEMEN STOK UNIT
      case 'ADD_STOCK': {
        if (!db.stocks) db.stocks = [];
        const count = db.stocks.length + 1;
        const newStock: VehicleStock = {
          ...payload,
          id: payload.id || `STK-2026-${String(count).padStart(3, '0')}`,
          photos: payload.photos && payload.photos.length > 0 ? payload.photos : ['https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=600&auto=format&fit=crop&q=80'],
          brand: payload.brand || 'Toyota',
          model: payload.model || '',
          year: Number(payload.year) || 2020,
          color: payload.color || 'Hitam',
          transmission: payload.transmission || 'Manual',
          fuel: payload.fuel || 'Bensin',
          mileage: Number(payload.mileage) || 0,
          price: Number(payload.price) || 0,
          entryDate: payload.entryDate || new Date().toISOString().split('T')[0],
          description: payload.description || '',
          status: payload.status || 'Tersedia',
          licensePlate: payload.licensePlate || '',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        db.stocks.unshift(newStock);
        logActivity(
          'Menambah Stok Kendaraan',
          'Stok Unit',
          newStock.id,
          `Menambahkan unit ${newStock.brand} ${newStock.model} (${newStock.year}) Rp ${newStock.price.toLocaleString('id-ID')}`
        );

        // Run automated matching engine
        triggerStockMatching(newStock, db, userName);
        break;
      }

      case 'UPDATE_STOCK': {
        if (!db.stocks) db.stocks = [];
        const index = db.stocks.findIndex((s) => s.id === payload.id);
        if (index === -1) {
          return NextResponse.json({ success: false, error: 'Stok tidak ditemukan' }, { status: 404 });
        }
        const oldStatus = db.stocks[index].status;
        db.stocks[index] = {
          ...db.stocks[index],
          ...payload,
          price: payload.price !== undefined ? Number(payload.price) : db.stocks[index].price,
          year: payload.year !== undefined ? Number(payload.year) : db.stocks[index].year,
          mileage: payload.mileage !== undefined ? Number(payload.mileage) : db.stocks[index].mileage,
          updatedAt: new Date().toISOString(),
        };
        const updated = db.stocks[index];
        logActivity(
          'Memperbarui Stok Kendaraan',
          'Stok Unit',
          updated.id,
          `Memperbarui data unit ${updated.brand} ${updated.model} (Status: ${updated.status})`
        );

        // If status is Tersedia, run matching
        if (updated.status === 'Tersedia') {
          triggerStockMatching(updated, db, userName);
        }

        // If status changed to Terjual or Tidak Aktif, mark pending follow-ups with isUnitSold = true
        if (updated.status === 'Terjual' || updated.status === 'Tidak Aktif') {
          if (db.followUps) {
            db.followUps.forEach((f) => {
              if (f.vehicleStockId === updated.id && f.status !== 'Berhasil Transaksi' && f.status !== 'Tidak Berminat') {
                f.isUnitSold = true;
                f.updatedAt = new Date().toISOString();
              }
            });
          }
        }
        break;
      }

      case 'DELETE_STOCK': {
        if (!db.stocks) db.stocks = [];
        const s = db.stocks.find((item) => item.id === payload.id);
        if (!s) {
          return NextResponse.json({ success: false, error: 'Stok tidak ditemukan' }, { status: 404 });
        }
        db.stocks = db.stocks.filter((item) => item.id !== payload.id);
        logActivity('Menghapus Stok Kendaraan', 'Stok Unit', payload.id, `Menghapus unit ${s.brand} ${s.model}`);
        break;
      }

      // USER MANAGEMENT
      case 'LOGIN_USER': {
        const email = (payload.email || '').trim().toLowerCase();
        const password = payload.password || '';

        // Check Owner account
        const isOwnerEmail = email === 'farhanhizri8@gmail.com' || email === 'farhanhizri8gmail.com';
        if (isOwnerEmail) {
          if (password !== 'Garut2005') {
            return NextResponse.json({ success: false, error: 'Kata sandi akun Owner salah.' }, { status: 401 });
          }
          let owner = db.users.find((u) => u.email.toLowerCase() === 'farhanhizri8@gmail.com' || u.role === 'Owner');
          if (!owner) {
            owner = {
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
            };
            db.users.unshift(owner);
          }
          owner.isApproved = true;
          owner.role = 'Owner';
          logActivity('Owner Login', 'User', owner.id, `Owner Farhan Hizri berhasil login ke sistem CRM`);
          break;
        }

        // Check regular user
        const user = db.users.find((u) => u.email.toLowerCase() === email);
        if (!user) {
          return NextResponse.json({
            success: false,
            error: 'Akun tidak ditemukan atau telah dihapus oleh Owner. Silakan lakukan pendaftaran akun baru dan tunggu persetujuan Owner.'
          }, { status: 404 });
        }

        const expectedPw = user.password || 'Garut2005';
        if (password !== expectedPw) {
          return NextResponse.json({ success: false, error: 'Kata sandi salah.' }, { status: 401 });
        }

        if (!user.isApproved) {
          return NextResponse.json({
            success: false,
            error: 'Akun Anda sedang menunggu persetujuan (approval) dari Owner (farhanhizri8@gmail.com). Silakan hubungi Owner untuk aktivasi akun login.'
          }, { status: 403 });
        }

        logActivity('User Login', 'User', user.id, `${user.name} (${user.role}) berhasil login ke sistem CRM`);
        break;
      }

      case 'APPROVE_USER': {
        const isOwnerRequester =
          currentUser?.role === 'Owner' ||
          currentUser?.email?.toLowerCase().includes('farhanhizri8');

        if (!isOwnerRequester) {
          return NextResponse.json({
            success: false,
            error: 'Akses Ditolak: Hanya akun Owner (farhanhizri8@gmail.com) yang berhak menyetujui akun login karyawan.'
          }, { status: 403 });
        }

        const u = db.users.find((user) => user.id === payload.id);
        if (!u) {
          return NextResponse.json({ success: false, error: 'User tidak ditemukan' }, { status: 404 });
        }
        u.isApproved = true;
        u.updatedAt = new Date().toISOString();
        logActivity('Menyetujui Registrasi Karyawan', 'User', u.id, `Owner (Farhan Hizri) menyetujui akun ${u.name} (${u.email}) sebagai ${u.role}`);
        break;
      }

      case 'REJECT_USER': {
        const isOwnerRequester =
          currentUser?.role === 'Owner' ||
          currentUser?.email?.toLowerCase().includes('farhanhizri8');

        if (!isOwnerRequester) {
          return NextResponse.json({
            success: false,
            error: 'Akses Ditolak: Hanya akun Owner (farhanhizri8@gmail.com) yang berhak menolak pendaftaran akun.'
          }, { status: 403 });
        }

        const target = db.users.find((user) => user.id === payload.id);
        if (!target) {
          return NextResponse.json({ success: false, error: 'User tidak ditemukan' }, { status: 404 });
        }

        if (target.role === 'Owner' || target.email.toLowerCase().includes('farhanhizri8')) {
          return NextResponse.json({ success: false, error: 'Akun Owner tidak dapat ditolak.' }, { status: 400 });
        }

        db.users = db.users.filter((user) => user.id !== payload.id);

        const supabase = getServerSupabase();
        if (supabase) {
          try {
            await supabase.from('crm_users').delete().eq('id', payload.id);
          } catch (e) {
            console.error('Error deleting rejected user from supabase:', e);
          }
        }

        logActivity('Menolak Pendaftaran Karyawan', 'User', target.id, `Owner menolak pengajuan akun pendaftaran ${target.name} (${target.email}). Akun dihapus dari sistem.`);
        break;
      }

      case 'DELETE_USER': {
        const isOwnerRequester =
          !currentUser ||
          currentUser?.role === 'Owner' ||
          currentUser?.role === 'CRM Administrator' ||
          currentUser?.email?.toLowerCase().includes('farhanhizri8') ||
          currentUser?.email?.toLowerCase().includes('owner');
        const isAdmin = currentUser?.role === 'CRM Administrator';

        if (!isOwnerRequester && !isAdmin) {
          return NextResponse.json({
            success: false,
            error: 'Akses Ditolak: Hanya akun Owner atau Administrator yang berhak menghapus akun pengguna.'
          }, { status: 403 });
        }

        const target = db.users.find((user) => user.id === payload.id);
        if (!target) {
          return NextResponse.json({ success: true, data: db });
        }

        if (target.role === 'Owner' || target.email?.toLowerCase().includes('farhanhizri8')) {
          return NextResponse.json({
            success: false,
            error: 'Akses Ditolak: Akun Owner Utama (farhanhizri8@gmail.com) dilindungi dan tidak dapat dihapus.'
          }, { status: 403 });
        }

        if (currentUser && (currentUser.id === payload.id || currentUser.email?.toLowerCase() === target.email?.toLowerCase())) {
          return NextResponse.json({
            success: false,
            error: 'Anda tidak dapat menghapus akun Anda sendiri saat sedang aktif.'
          }, { status: 400 });
        }

        db.users = db.users.filter((user) => user.id !== payload.id);

        const supabase = getServerSupabase();
        if (supabase) {
          try {
            await supabase.from('crm_users').delete().eq('id', payload.id);
          } catch (e) {
            console.error('Error deleting user from supabase:', e);
          }
        }

        logActivity('Menghapus Akun Pengguna', 'User', target.id, `Akun ${target.name} (${target.email} - ${target.role}) telah dihapus dari sistem CRM`);
        break;
      }

      case 'CHANGE_USER_ROLE': {
        const isOwnerRequester =
          currentUser?.role === 'Owner' ||
          currentUser?.email?.toLowerCase().includes('farhanhizri8');

        if (!isOwnerRequester) {
          return NextResponse.json({
            success: false,
            error: 'Akses Ditolak: Hanya akun Owner (farhanhizri8@gmail.com) yang berhak mengubah hak akses.'
          }, { status: 403 });
        }

        const u = db.users.find((user) => user.id === payload.id);
        if (!u) {
          return NextResponse.json({ success: false, error: 'User tidak ditemukan' }, { status: 404 });
        }
        const oldRole = u.role;
        u.role = payload.role;
        if (payload.jobdesks && Array.isArray(payload.jobdesks)) {
          u.jobdesks = payload.jobdesks;
        } else if (!u.jobdesks || u.jobdesks.length === 0) {
          u.jobdesks = [payload.role];
        }
        u.updatedAt = new Date().toISOString();
        logActivity('Mengubah Hak Akses User', 'User', u.id, `Mengubah peran ${u.name} dari ${oldRole} menjadi ${payload.role}`);
        break;
      }

      case 'UPDATE_USER_PROFILE': {
        const targetId = payload.id || currentUser?.id;
        const u = db.users.find(
          (user) => user.id === targetId || (currentUser?.email && user.email.toLowerCase() === currentUser.email.toLowerCase())
        );
        if (u) {
          if (payload.name) u.name = payload.name;
          if (payload.phone) u.phone = payload.phone;
          if (payload.email) u.email = payload.email;
          if (payload.avatar) u.avatar = payload.avatar;
          if (payload.password) u.password = payload.password;
          if (payload.jobdesks && Array.isArray(payload.jobdesks)) u.jobdesks = payload.jobdesks;
          u.updatedAt = new Date().toISOString();
          logActivity('Perbarui Profil Pengguna', 'User', u.id, `Pengguna ${u.name} memperbarui informasi profil akun.`);
        }
        break;
      }

      case 'REGISTER_USER': {
        const cleanEmail = (payload.email || '').trim().toLowerCase();
        const exists = db.users.find((u) => u.email.toLowerCase() === cleanEmail);
        if (exists) {
          if (!exists.isApproved) {
            return NextResponse.json({
              success: false,
              error: 'Email ini telah terdaftar dan sedang menunggu persetujuan Owner. Silakan hubungi Owner HR MOTOR (farhanhizri8@gmail.com).'
            }, { status: 400 });
          }
          return NextResponse.json({ success: false, error: 'Email sudah terdaftar aktif di sistem HR MOTOR. Silakan langsung login.' }, { status: 400 });
        }

        const isOwnerEmail = cleanEmail === 'farhanhizri8@gmail.com' || cleanEmail === 'farhanhizri8gmail.com';
        const newUserId = `USR-${String(Date.now()).slice(-4)}`;
        const assignedJobdesks = Array.isArray(payload.jobdesks) && payload.jobdesks.length > 0
          ? payload.jobdesks
          : (payload.role ? [payload.role] : ['Staf Operasional Showroom']);
        const primaryRole = isOwnerEmail ? 'Owner' : (payload.role || assignedJobdesks[0] || 'Staf Operasional Showroom');
        const newUser = {
          id: newUserId,
          name: (payload.name || '').trim(),
          email: cleanEmail,
          password: payload.password || 'Garut2005',
          role: primaryRole,
          jobdesks: assignedJobdesks,
          phone: payload.phone || '',
          avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(cleanEmail)}&backgroundColor=d1d4f9`,
          isApproved: isOwnerEmail, // Pengguna baru WAJIB menunggu persetujuan (approval) Owner sebelum bisa login!
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        db.users.push(newUser);

        // Add notification for Owner
        const jobdeskSummary = assignedJobdesks.join(', ');
        db.notifications.unshift({
          id: `NOTIF-${Date.now()}`,
          userId: 'USR-001',
          title: 'Pengajuan Akun Karyawan Baru',
          message: `${newUser.name} (${newUser.email}) mengajukan pendaftaran akun dengan jobdesk: ${jobdeskSummary}. Menunggu persetujuan Owner.`,
          type: 'approval',
          isRead: false,
          link: '/users',
          createdAt: new Date().toISOString(),
        });

        logActivity('Pengajuan Akun Baru', 'User', newUser.id, `${newUser.name} mendaftar sebagai ${newUser.role} (Menunggu persetujuan Owner)`);
        break;
      }

      // SUPABASE INTEGRATION ACTIONS
      case 'TEST_SUPABASE_CONNECTION': {
        const supabase = getServerSupabase();
        if (!supabase) {
          return NextResponse.json({
            success: false,
            error: 'Supabase belum dikonfigurasi. Masukkan NEXT_PUBLIC_SUPABASE_URL dan Anon Key pada berkas .env.local',
          });
        }
        try {
          const startTime = Date.now();
          const { error } = await supabase.from('crm_snapshots').select('id').limit(1);
          const latency = Date.now() - startTime;
          if (error && !error.message.includes('relation "public.crm_snapshots" does not exist')) {
            return NextResponse.json({
              success: false,
              error: `Respon Supabase: ${error.message}`,
            });
          }
          return NextResponse.json({
            success: true,
            message: `Koneksi ke Supabase berhasil! (Latency: ${latency}ms)`,
            latency,
          });
        } catch (e: any) {
          return NextResponse.json({
            success: false,
            error: `Gagal terhubung ke Supabase: ${e.message || String(e)}`,
          });
        }
      }

      // =========================================================================
      // FITUR 1: TRANSAKSI PENJUALAN CASH (TUNAI)
      // =========================================================================
      case 'CREATE_CASH_TRANSACTION': {
        const {
          customerName,
          customerPhone,
          customerAddress,
          customerSource,
          vehicleStockId,
          dealPrice,
          notes,
          transactionDate,
          prospectFollowUpId,
        } = payload;

        if (!customerName || !customerPhone || !vehicleStockId) {
          return NextResponse.json({ success: false, error: 'Nama pelanggan, nomor WhatsApp, dan unit mobil wajib diisi' }, { status: 400 });
        }

        const stock = db.stocks.find((s) => s.id === vehicleStockId);
        if (!stock) {
          return NextResponse.json({ success: false, error: 'Unit kendaraan tidak ditemukan di database stok' }, { status: 404 });
        }

        if (stock.status !== 'Tersedia') {
          return NextResponse.json({
            success: false,
            error: `Unit ${stock.brand} ${stock.model} (${stock.licensePlate || '-'}) saat ini berstatus ${stock.status === 'Booking' ? 'BOKING' : 'SOLD OUT'} dan tidak dapat dipilih untuk transaksi baru.`,
          }, { status: 400 });
        }

        const dateTx = transactionDate || new Date().toISOString().split('T')[0];
        const nominal = Number(dealPrice) || stock.price;

        // 1. Save / Update Customer
        let cust = db.customers.find(
          (c) => (c.whatsapp && cleanPhone(c.whatsapp) === cleanPhone(customerPhone)) || (payload.customerId && c.id === payload.customerId)
        );
        const custId = cust?.id || `CUST-2026-${String(db.customers.length + 1).padStart(3, '0')}`;
        const newReceiptNumber = `No. ${db.customers.length + 1}`;
        const todayStr = new Date(dateTx).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }).toUpperCase();
        const receiptPlaceDate = `GARUT, ${todayStr}`;

        const updatedCustomer: Customer = {
          id: custId,
          fullName: customerName.trim(),
          whatsapp: customerPhone.trim(),
          email: cust?.email || '',
          address: customerAddress?.trim() || cust?.address || 'Garut',
          district: cust?.district || 'Tarogong Kidul',
          source: customerSource || cust?.source || 'Walk-in',
          interestedVehicle: `${stock.brand} ${stock.model} (${stock.year})`,
          vehicleType: (stock.brand.toLowerCase().includes('sigra') || stock.brand.toLowerCase().includes('avanza') ? 'MPV' : 'SUV') as any,
          budget: nominal,
          notes: notes || 'Transaksi Penjualan Tunai (Cash)',
          registeredDate: cust?.registeredDate || dateTx,
          status: 'Sudah Beli',
          paymentType: 'Cash',
          plateNumber: stock.licensePlate || stock.plateNumber || '',
          receiptNumber: newReceiptNumber,
          receiptAmount: nominal,
          receiptDate: receiptPlaceDate,
          receiptReceiver: 'HR MOTOR',
          receiptNotes: notes || 'LUNAS (CASH)',
          updatedAt: new Date().toISOString(),
        };

        if (cust) {
          const idx = db.customers.findIndex((c) => c.id === cust!.id);
          db.customers[idx] = updatedCustomer;
        } else {
          db.customers.unshift(updatedCustomer);
        }

        // 2. Add CustomerPurchase (Laporan Penjualan)
        const purchaseId = `DEAL-2026-${String(db.purchases.length + 1).padStart(3, '0')}`;
        const newPurchase: CustomerPurchase = {
          id: purchaseId,
          customerId: custId,
          customerName: customerName.trim(),
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
          warrantyUntil: `${parseInt(dateTx.slice(0, 4)) + 1}${dateTx.slice(4)}`,
          salesId: userId,
          salesName: userName || 'HR MOTOR',
          notes: notes || 'Transaksi Penjualan Tunai (Cash) Sukses di HR MOTOR Garut',
          receiptNumber: newReceiptNumber,
          receiptDate: receiptPlaceDate,
          receiptReceiver: 'HR MOTOR',
          vehicleStockId: stock.id,
          createdAt: new Date().toISOString(),
        };
        db.purchases.unshift(newPurchase);

        // 3. Update VehicleStock to SOLD OUT (Terjual)
        stock.status = 'Terjual';
        stock.soldDate = dateTx;
        stock.soldToCustomerId = custId;
        stock.soldToCustomerName = customerName.trim();
        stock.bookingCustomerId = undefined;
        stock.bookingCustomerName = undefined;
        stock.bookingLeasing = undefined;
        stock.bookingDp = undefined;
        stock.bookingDate = undefined;
        stock.bookingApplicationId = undefined;
        stock.updatedAt = new Date().toISOString();

        // 4. Schedule Customer Follow Up (Pelanggan yang sudah membeli)
        if (!db.followUps) db.followUps = [];
        const dealDateObj = new Date(dateTx);
        dealDateObj.setMonth(dealDateObj.getMonth() + 1);
        const nextScheduleDate = dealDateObj.toISOString().split('T')[0];

        const newFollowUp: FollowUp = {
          id: `FLW-2026-${String(db.followUps.length + 1).padStart(3, '0')}`,
          followUpType: 'CUSTOMER',
          customerId: custId,
          customerName: customerName.trim(),
          customerPhone: customerPhone.trim(),
          customerAddress: customerAddress?.trim() || 'Garut',
          customerSource: customerSource || 'Walk-in',
          vehicleInfo: `${stock.brand} ${stock.model} (${stock.year})`,
          paymentType: 'Cash',
          purchaseDate: dateTx,
          periodicStep: '1 Bulan',
          category: 'Pelanggan Lama (1 Tahun)',
          scheduledDate: nextScheduleDate,
          scheduledTime: '10:00',
          channel: 'WhatsApp',
          status: 'Belum Dihubungi',
          priority: 'Tinggi',
          followUpReason: 'Pengecekan berkala kepuasan 1 tahun (Cash): kondisi mobil setelah digunakan, kendala kendaraan, rencana ganti unit/trade-in, dan rencana jual kembali.',
          notes: `Pembelian Cash: ${stock.brand} ${stock.model} (${stock.licensePlate || '-'}).`,
          communicationLogs: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        db.followUps.unshift(newFollowUp);

        // 5. If this transaction was converted from a prospect follow-up
        if (prospectFollowUpId) {
          const prospect = db.followUps.find((f) => f.id === prospectFollowUpId);
          if (prospect) {
            prospect.status = 'Sudah Deal';
            prospect.prospectStatus = 'Sudah Deal';
            prospect.customerId = custId;
            prospect.notes = `${prospect.notes || ''} [Deal Cash: ${stock.brand} ${stock.model}]`.trim();
            prospect.updatedAt = new Date().toISOString();
          }
        } else {
          // Check if any matching prospect by phone
          const existingProspect = db.followUps.find(
            (f) => f.followUpType === 'PROSPECT' && cleanPhone(f.customerPhone) === cleanPhone(customerPhone) && f.status !== 'Sudah Deal'
          );
          if (existingProspect) {
            existingProspect.status = 'Sudah Deal';
            existingProspect.prospectStatus = 'Sudah Deal';
            existingProspect.customerId = custId;
            existingProspect.updatedAt = new Date().toISOString();
          }
        }

        // 6. Log Activity
        logActivity(
          'Penjualan Mobil Tunai (Cash)',
          'Deal',
          newPurchase.id,
          `Penjualan Cash unit ${stock.brand} ${stock.model} (${stock.licensePlate || '-'}) kepada ${customerName.trim()} senilai Rp ${nominal.toLocaleString('id-ID')}. Status unit SOLD OUT.`
        );
        break;
      }

      // =========================================================================
      // FITUR 2: TRANSAKSI PENJUALAN KREDIT (PENGAJUAN AWAL -> STATUS: PENDING)
      // =========================================================================
      case 'CREATE_CREDIT_APPLICATION': {
        const {
          customerName,
          customerPhone,
          customerAddress,
          customerSource,
          vehicleStockId,
          targetLeasing,
          dealPrice,
          initialDp,
          notes,
          applicationDate,
          prospectFollowUpId,
        } = payload;

        if (!customerName || !customerPhone || !vehicleStockId || !targetLeasing) {
          return NextResponse.json({
            success: false,
            error: 'Nama pelanggan, nomor WhatsApp, unit mobil, dan bank/leasing tujuan wajib diisi',
          }, { status: 400 });
        }

        const stock = db.stocks.find((s) => s.id === vehicleStockId);
        if (!stock) {
          return NextResponse.json({ success: false, error: 'Unit kendaraan tidak ditemukan di database stok' }, { status: 404 });
        }

        if (stock.status !== 'Tersedia') {
          return NextResponse.json({
            success: false,
            error: `Unit ${stock.brand} ${stock.model} (${stock.licensePlate || '-'}) saat ini berstatus ${stock.status === 'Booking' ? 'BOKING' : 'SOLD OUT'} dan tidak dapat dipilih untuk pengajuan kredit.`,
          }, { status: 400 });
        }

        const dateApp = applicationDate || new Date().toISOString().split('T')[0];
        const nominalDeal = Number(dealPrice) || stock.price;
        const nominalDp = Number(initialDp) || (stock.creditDp || Math.round(nominalDeal * 0.2));

        // 1. Identify Customer Reference (Permintaan User: Pengajuan kredit baru TIDAK langsung masuk tabel pelanggan, tapi masuk tabel Menunggu ACC)
        let cust = db.customers?.find(
          (c) => (c.whatsapp && cleanPhone(c.whatsapp) === cleanPhone(customerPhone)) || (payload.customerId && c.id === payload.customerId)
        );
        const custId = cust?.id || `CUST-PENDING-${Date.now()}`;

        // 2. Create Credit Application (Status: PENDING)
        if (!db.creditApplications) db.creditApplications = [];
        const appId = `CRD-2026-${String(db.creditApplications.length + 1).padStart(3, '0')}`;
        const newApplication: CreditApplication = {
          id: appId,
          customerId: custId,
          customerName: customerName.trim(),
          customerPhone: customerPhone.trim(),
          customerAddress: customerAddress?.trim() || 'Garut',
          customerSource: customerSource || 'Walk-in',
          vehicleStockId: stock.id,
          vehicleName: `${stock.brand} ${stock.model} (${stock.year})`,
          plateNumber: stock.licensePlate || stock.plateNumber || '',
          targetLeasing: targetLeasing,
          dealPrice: nominalDeal,
          initialDp: nominalDp,
          status: 'PENDING',
          applicationDate: dateApp,
          notes: notes || '',
          history: [
            {
              status: 'PENDING',
              timestamp: new Date().toISOString(),
              adminName: userName,
              notes: `Pengajuan kredit pertama kali dibuat (Status: PENDING), unit mobil otomatis BOKING untuk ${customerName.trim()} ke ${targetLeasing}.`,
              dpAmount: nominalDp,
              leasingPartner: targetLeasing,
            },
          ],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        db.creditApplications.unshift(newApplication);

        // 3. Update VehicleStock to BOKING (Booking)
        stock.status = 'Booking';
        stock.bookingCustomerId = custId;
        stock.bookingCustomerName = customerName.trim();
        stock.bookingLeasing = targetLeasing;
        stock.bookingDp = nominalDp;
        stock.bookingDate = dateApp;
        stock.bookingApplicationId = appId;
        stock.updatedAt = new Date().toISOString();

        // 4. Link with prospect if applicable
        const targetProspect = prospectFollowUpId
          ? db.followUps?.find((f) => f.id === prospectFollowUpId)
          : db.followUps?.find((f) => f.followUpType === 'PROSPECT' && cleanPhone(f.customerPhone) === cleanPhone(customerPhone) && f.status !== 'Sudah Deal');

        if (targetProspect) {
          targetProspect.status = 'Tertarik';
          targetProspect.prospectStatus = 'Tertarik';
          targetProspect.notes = `${targetProspect.notes || ''} [Pengajuan Kredit: ${stock.brand} ${stock.model} via ${targetLeasing}]`.trim();
          targetProspect.updatedAt = new Date().toISOString();
        }

        // 5. Add Notification for Dealer
        if (!db.notifications) db.notifications = [];
        db.notifications.unshift({
          id: `NOTIF-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          userId: 'USR-001',
          title: `Pengajuan Kredit: ${customerName.trim()}`,
          message: `Pengajuan kredit baru (Status PENDING) untuk ${stock.brand} ${stock.model} ke ${targetLeasing} (DP: Rp ${nominalDp.toLocaleString('id-ID')}). Unit berstatus BOKING.`,
          type: 'approval',
          isRead: false,
          link: '/customers?tab=transactions',
          createdAt: new Date().toISOString(),
        });

        // 6. Log Activity
        logActivity(
          'Pengajuan Kredit Baru (PENDING)',
          'Stok Unit',
          stock.id,
          `Pengajuan kredit atas nama ${customerName.trim()} ke ${targetLeasing} untuk unit ${stock.brand} ${stock.model} (DP: Rp ${nominalDp.toLocaleString('id-ID')}). Status unit berubah menjadi BOKING.`
        );
        break;
      }

      // =========================================================================
      // FITUR 2B: PERSETUJUAN KREDIT (ACC)
      // =========================================================================
      case 'APPROVE_CREDIT_APPLICATION': {
        const { applicationId, finalDp, approvedLeasing, approvalNotes } = payload;

        if (!applicationId || !approvedLeasing) {
          return NextResponse.json({ success: false, error: 'ID pengajuan kredit dan bank/leasing yang ACC wajib diisi' }, { status: 400 });
        }

        // Role check
        const canApprove =
          userRole === 'Owner' ||
          userRole === 'CRM Administrator' ||
          userRole === 'Admin' ||
          currentUser?.role === 'Owner' ||
          currentUser?.role === 'CRM Administrator' ||
          currentUser?.role === 'Admin' ||
          (currentUser?.email && currentUser.email.toLowerCase().includes('farhanhizri8'));

        if (!canApprove) {
          return NextResponse.json({
            success: false,
            error: 'Akses Ditolak: Hanya akun Owner atau CRM Administrator yang berhak menyetujui (ACC) pengajuan kredit.',
          }, { status: 403 });
        }

        if (!db.creditApplications) db.creditApplications = [];
        const app = db.creditApplications.find((a) => a.id === applicationId);
        if (!app) {
          return NextResponse.json({ success: false, error: 'Data pengajuan kredit tidak ditemukan' }, { status: 404 });
        }

        if (app.status !== 'PENDING') {
          return NextResponse.json({ success: false, error: `Pengajuan kredit ini sudah berstatus ${app.status}` }, { status: 400 });
        }

        const finalDpNominal = Number(finalDp) !== undefined && !isNaN(Number(finalDp)) ? Number(finalDp) : app.initialDp;
        const nowIso = new Date().toISOString();
        const todayDate = nowIso.split('T')[0];

        // 1. Find Stock and ensure safety
        const stock = db.stocks.find((s) => s.id === app.vehicleStockId);
        if (!stock) {
          return NextResponse.json({ success: false, error: 'Unit kendaraan tidak ditemukan di database stok' }, { status: 404 });
        }

        // Safety: verify the unit isn't already sold to another customer or actively booked by someone else
        if (stock.status === 'Terjual' && stock.soldToCustomerId && stock.soldToCustomerId !== app.customerId) {
          return NextResponse.json({
            success: false,
            error: `Gagal ACC: Unit ${stock.brand} ${stock.model} (${stock.licensePlate || '-'}) sudah SOLD OUT (terjual) kepada ${stock.soldToCustomerName || 'pelanggan lain'}.`,
          }, { status: 400 });
        }

        if (stock.status === 'Booking' && stock.bookingApplicationId && stock.bookingApplicationId !== app.id) {
          return NextResponse.json({
            success: false,
            error: `Gagal ACC: Unit ${stock.brand} ${stock.model} saat ini sedang aktif dibooking oleh ${stock.bookingCustomerName || 'pelanggan lain'} (${stock.bookingLeasing || 'Leasing'}).`,
          }, { status: 400 });
        }

        if (stock.status === 'Tidak Aktif') {
          return NextResponse.json({
            success: false,
            error: `Gagal ACC: Unit ${stock.brand} ${stock.model} berstatus Tidak Aktif.`,
          }, { status: 400 });
        }

        stock.status = 'Terjual'; // Changed from BOKING to SOLD OUT
        stock.soldDate = todayDate;
        stock.soldToCustomerId = app.customerId;
        stock.soldToCustomerName = app.customerName;
        stock.bookingCustomerId = undefined;
        stock.bookingCustomerName = undefined;
        stock.bookingLeasing = undefined;
        stock.bookingDp = undefined;
        stock.bookingDate = undefined;
        stock.bookingApplicationId = undefined;
        stock.updatedAt = nowIso;

        // 2. Update Application Status to APPROVED
        app.status = 'APPROVED';
        app.finalDp = finalDpNominal;
        app.approvedLeasing = approvedLeasing;
        app.approvalDate = todayDate;
        app.updatedAt = nowIso;
        if (!app.history) app.history = [];
        app.history.unshift({
          status: 'APPROVED',
          timestamp: nowIso,
          adminName: userName,
          notes: approvalNotes || `Pengajuan kredit disetujui (ACC) oleh ${approvedLeasing}.`,
          dpAmount: finalDpNominal,
          leasingPartner: approvedLeasing,
        });

        // 3. Update or Insert Customer Record (Permintaan User: Kredit ACC OTOMATIS masuk ke tabel data pelanggan)
        if (!db.customers) db.customers = [];
        let cust = db.customers.find((c) => (app.customerId && c.id === app.customerId) || (c.whatsapp && cleanPhone(c.whatsapp) === cleanPhone(app.customerPhone)));
        const newReceiptNum = `No. ${db.customers.length + 1}`;
        const placeDate = `GARUT, ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }).toUpperCase()}`;
        const finalCustId = cust?.id || ((app.customerId && !app.customerId.startsWith('CUST-PENDING-')) ? app.customerId : `CUST-2026-${String(db.customers.length + 1).padStart(3, '0')}`);

        if (cust) {
          cust.status = 'Sudah Beli';
          cust.paymentType = 'Kredit';
          cust.creditStatus = 'APPROVED';
          cust.downPayment = finalDpNominal;
          cust.leasingPartner = approvedLeasing;
          cust.receiptNumber = cust.receiptNumber || newReceiptNum;
          cust.receiptAmount = finalDpNominal;
          cust.receiptDate = placeDate;
          cust.receiptNotes = `DP KREDIT ${approvedLeasing} (ACC)`;
          cust.updatedAt = nowIso;
        } else {
          cust = {
            id: finalCustId,
            fullName: app.customerName.trim(),
            whatsapp: app.customerPhone.trim(),
            email: '',
            address: app.customerAddress?.trim() || 'Garut',
            district: 'Tarogong Kidul',
            source: app.customerSource || 'Walk-in',
            interestedVehicle: app.vehicleName,
            vehicleType: 'SUV',
            budget: app.dealPrice,
            notes: approvalNotes || `Kredit ACC via ${approvedLeasing}`,
            registeredDate: todayDate,
            status: 'Sudah Beli',
            paymentType: 'Kredit',
            creditStatus: 'APPROVED',
            downPayment: finalDpNominal,
            leasingPartner: approvedLeasing,
            receiptNumber: newReceiptNum,
            receiptAmount: finalDpNominal,
            receiptDate: placeDate,
            receiptReceiver: 'HR MOTOR',
            receiptNotes: `DP KREDIT ${approvedLeasing} (ACC)`,
            updatedAt: nowIso,
          };
          db.customers.unshift(cust);
        }

        // 4. Record CustomerPurchase (Laporan Penjualan Kredit)
        const purchaseId = `DEAL-2026-${String(db.purchases.length + 1).padStart(3, '0')}`;
        const newPurchase: CustomerPurchase = {
          id: purchaseId,
          customerId: app.customerId || cust?.id || `CUST-2026-${String(db.customers.length + 1).padStart(3, '0')}`,
          customerName: app.customerName,
          vehicleBrand: stock?.brand || 'HR MOTOR',
          vehicleModel: stock ? `${stock.brand} ${stock.model}` : app.vehicleName,
          vehicleYear: stock?.year || 2021,
          vehicleName: app.vehicleName,
          plateNumber: stock?.licensePlate || stock?.plateNumber || app.plateNumber || 'Z - HR MOTOR',
          color: stock?.color || 'Hitam',
          mileageKm: stock?.mileage || 35000,
          purchasePrice: app.dealPrice,
          paymentType: 'Kredit',
          paymentMethod: `Kredit ${approvedLeasing}`,
          downPayment: finalDpNominal,
          leasingPartner: approvedLeasing,
          creditApplicationId: app.id,
          vehicleStockId: stock?.id,
          purchaseDate: todayDate,
          warrantyUntil: `${parseInt(todayDate.slice(0, 4)) + 1}${todayDate.slice(4)}`,
          salesId: userId,
          salesName: userName || 'HR MOTOR',
          notes: `Kredit disetujui (ACC) oleh ${approvedLeasing} dengan DP Final Rp ${finalDpNominal.toLocaleString('id-ID')}. ${approvalNotes || ''}`.trim(),
          receiptNumber: newReceiptNum,
          receiptDate: placeDate,
          receiptReceiver: 'HR MOTOR',
          createdAt: nowIso,
        };
        db.purchases.unshift(newPurchase);

        // 5. Schedule Customer Follow Up (Pelanggan yang sudah membeli via Kredit ACC)
        if (!db.followUps) db.followUps = [];
        const dealDateObj = new Date(todayDate);
        dealDateObj.setMonth(dealDateObj.getMonth() + 1);
        const nextScheduleDate = dealDateObj.toISOString().split('T')[0];

        const newFollowUp: FollowUp = {
          id: `FLW-2026-${String(db.followUps.length + 1).padStart(3, '0')}`,
          followUpType: 'CUSTOMER',
          customerId: app.customerId || cust?.id,
          customerName: app.customerName,
          customerPhone: app.customerPhone,
          customerAddress: app.customerAddress,
          customerSource: app.customerSource,
          vehicleInfo: app.vehicleName,
          paymentType: 'Kredit',
          leasingPartner: approvedLeasing,
          purchaseDate: todayDate,
          periodicStep: '1 Bulan',
          category: 'Pelanggan Lama (1 Tahun)',
          scheduledDate: nextScheduleDate,
          scheduledTime: '10:00',
          channel: 'WhatsApp',
          status: 'Belum Dihubungi',
          priority: 'Tinggi',
          followUpReason: `Pengecekan berkala kepuasan 1 tahun (Kredit ${approvedLeasing}): kondisi mobil setelah digunakan, kendala kendaraan, rencana ganti unit/trade-in, dan rencana jual kembali.`,
          notes: `Pembelian Kredit ACC via ${approvedLeasing} (DP Final: Rp ${finalDpNominal.toLocaleString('id-ID')}).`,
          communicationLogs: [],
          createdAt: nowIso,
          updatedAt: nowIso,
        };
        db.followUps.unshift(newFollowUp);

        // 6. Link with prospect if any
        const linkedProspect = db.followUps.find(
          (f) => f.followUpType === 'PROSPECT' && cleanPhone(f.customerPhone) === cleanPhone(app.customerPhone) && f.status !== 'Sudah Deal'
        );
        if (linkedProspect) {
          linkedProspect.status = 'Sudah Deal';
          linkedProspect.prospectStatus = 'Sudah Deal';
          linkedProspect.customerId = cust.id;
          linkedProspect.updatedAt = nowIso;
        }

        // 7. Log Activity
        logActivity(
          'Persetujuan Kredit (ACC)',
          'Deal',
          newPurchase.id,
          `Kredit disetujui (ACC) oleh ${approvedLeasing} atas nama ${app.customerName} (DP Final: Rp ${finalDpNominal.toLocaleString('id-ID')}). Unit ${stock?.brand || ''} ${stock?.model || ''} berstatus SOLD OUT.`
        );
        break;
      }

      // =========================================================================
      // FITUR 2C: PENOLAKAN KREDIT (REJECTED / DITOLAK)
      // =========================================================================
      case 'REJECT_CREDIT_APPLICATION': {
        const { applicationId, rejectionReason } = payload;

        if (!applicationId) {
          return NextResponse.json({ success: false, error: 'ID pengajuan kredit wajib diisi' }, { status: 400 });
        }

        // Role check
        const canReject =
          userRole === 'Owner' ||
          userRole === 'CRM Administrator' ||
          userRole === 'Admin' ||
          currentUser?.role === 'Owner' ||
          currentUser?.role === 'CRM Administrator' ||
          currentUser?.role === 'Admin' ||
          (currentUser?.email && currentUser.email.toLowerCase().includes('farhanhizri8'));

        if (!canReject) {
          return NextResponse.json({
            success: false,
            error: 'Akses Ditolak: Hanya akun Owner atau CRM Administrator yang berhak menolak pengajuan kredit.',
          }, { status: 403 });
        }

        if (!db.creditApplications) db.creditApplications = [];
        const app = db.creditApplications.find((a) => a.id === applicationId);
        if (!app) {
          return NextResponse.json({ success: false, error: 'Data pengajuan kredit tidak ditemukan' }, { status: 404 });
        }

        if (app.status !== 'PENDING') {
          return NextResponse.json({ success: false, error: `Pengajuan kredit ini sudah berstatus ${app.status}` }, { status: 400 });
        }

        const nowIso = new Date().toISOString();
        const todayDate = nowIso.split('T')[0];
        const reasonText = (rejectionReason || 'Ditolak oleh pihak bank/leasing (BI Checking / Kapasitas)').trim();

        // 1. Revert Stock status from Booking back to READY (Tersedia)
        const stock = db.stocks.find((s) => s.id === app.vehicleStockId);
        if (stock) {
          // Safety: Only revert if the unit was booked by this application
          const isBookedByThisApp =
            stock.status === 'Booking' &&
            ((stock.bookingApplicationId && stock.bookingApplicationId === app.id) ||
             (stock.bookingCustomerId && app.customerId && stock.bookingCustomerId === app.customerId) ||
             (stock.bookingCustomerName && stock.bookingCustomerName === app.customerName));

          if (isBookedByThisApp) {
            stock.status = 'Tersedia'; // Reverted to READY!
            stock.bookingCustomerId = undefined;
            stock.bookingCustomerName = undefined;
            stock.bookingLeasing = undefined;
            stock.bookingDp = undefined;
            stock.bookingDate = undefined;
            stock.bookingApplicationId = undefined;
            stock.updatedAt = nowIso;
          }
        }

        // 2. Update Application Status to REJECTED (Preserve permanently in history)
        app.status = 'REJECTED';
        app.rejectionReason = reasonText;
        app.rejectionDate = todayDate;
        app.updatedAt = nowIso;
        if (!app.history) app.history = [];
        app.history.unshift({
          status: 'REJECTED',
          timestamp: nowIso,
          adminName: userName,
          notes: `Pengajuan kredit ditolak bank: ${reasonText}`,
          rejectionReason: reasonText,
        });

        // 3. Ensure rejected credit application does NOT enter or exist in db.customers (Permintaan User: Tidak masuk ke data pelanggan jika kredit ditolak)
        if (db.customers) {
          db.customers = db.customers.filter((c) => {
            const isThisCust = (app.customerId && c.id === app.customerId) || (c.whatsapp && cleanPhone(c.whatsapp) === cleanPhone(app.customerPhone));
            // Hapus dari data pelanggan jika belum menjadi pembeli sah ('Sudah Beli')
            if (isThisCust && c.status !== 'Sudah Beli') {
              return false;
            }
            return true;
          });
        }

        // 4. Log Activity
        logActivity(
          'Penolakan Pengajuan Kredit (REJECTED)',
          'Stok Unit',
          app.vehicleStockId,
          `Pengajuan kredit ${app.customerName} ditolak bank (${reasonText}). Unit ${stock?.brand || ''} ${stock?.model || ''} otomatis kembali READY di halaman stok.`
        );

        // 5. Check if any prospect waiting for this newly READY stock
        if (stock && stock.status === 'Tersedia') {
          triggerStockMatching(stock, db, userName);
        }
        break;
      }

      // =========================================================================
      // FITUR 4: PROSPECT FOLLOW UP (CALON PELANGGAN YANG MENCARI MOBIL)
      // =========================================================================
      case 'ADD_PROSPECT_FOLLOW_UP': {
        const {
          customerName,
          customerPhone,
          customerAddress,
          customerSource,
          searchBrand,
          searchModel,
          searchYear,
          searchBudget,
          notes,
          firstInquiryDate,
        } = payload;

        if (!customerName || !customerPhone || !searchBrand) {
          return NextResponse.json({
            success: false,
            error: 'Nama calon pelanggan, nomor WhatsApp, dan merek mobil yang dicari wajib diisi',
          }, { status: 400 });
        }

        const nowIso = new Date().toISOString();
        const todayDate = nowIso.split('T')[0];
        const dateInquiry = firstInquiryDate || todayDate;
        const yearWanted = searchYear ? Number(searchYear) : undefined;
        const budgetWanted = searchBudget ? Number(searchBudget) : undefined;

        if (!db.followUps) db.followUps = [];

        // Check stock matching immediately
        let initialStatus: any = 'Menunggu Mobil Ready';
        let matchedStock: VehicleStock | undefined;

        const pBrandLower = searchBrand.toLowerCase().trim();
        const pModelLower = (searchModel || '').toLowerCase().trim();

        matchedStock = db.stocks.find((s) => {
          if (s.status !== 'Tersedia') return false;
          const sBrand = s.brand.toLowerCase().trim();
          const sModel = s.model.toLowerCase().trim();
          const sMerk = (s.merkType || '').toLowerCase().trim();

          // Brand match
          const brandOk = sBrand.includes(pBrandLower) || pBrandLower.includes(sBrand);
          if (!brandOk) return false;

          // Model / Tipe match: all meaningful spec words must match
          if (pModelLower) {
            const words = pModelLower
              .split(/[\s,-]+/)
              .map((w: string) => w.trim().toLowerCase())
              .filter((w: string) => w.length >= 2 && !pBrandLower.includes(w) && !sBrand.includes(w));
            const fullStockDesc = `${sBrand} ${sModel} ${sMerk}`.toLowerCase();
            const modelOk = words.length > 0
              ? words.every((w: string) => fullStockDesc.includes(w))
              : true;
            if (!modelOk) return false;
          }

          // Year match
          if (yearWanted && Math.abs(s.year - yearWanted) > 1) {
            return false;
          }

          // Budget match
          if (budgetWanted && s.price > budgetWanted * 1.15) {
            return false;
          }

          return true;
        });

        if (matchedStock) {
          initialStatus = 'Mobil Sudah Ready';
        }

        const newFlwId = `FLW-2026-${String(db.followUps.length + 1).padStart(3, '0')}`;
        const newProspect: FollowUp = {
          id: newFlwId,
          followUpType: 'PROSPECT',
          category: 'Unit yang Dicari Sudah Tersedia',
          customerName: customerName.trim(),
          customerPhone: customerPhone.trim(),
          customerAddress: customerAddress?.trim() || '',
          customerSource: customerSource || 'Walk-in',
          searchBrand: searchBrand.trim(),
          searchModel: (searchModel || '').trim(),
          searchYear: yearWanted,
          searchBudget: budgetWanted,
          firstInquiryDate: dateInquiry,
          scheduledDate: todayDate,
          scheduledTime: '10:00',
          channel: 'WhatsApp',
          status: initialStatus,
          prospectStatus: initialStatus,
          priority: matchedStock ? 'Tinggi' : 'Sedang',
          vehicleStockId: matchedStock?.id,
          matchedStockId: matchedStock?.id,
          matchedStockPrice: matchedStock?.price,
          matchedStockInfo: matchedStock ? `${matchedStock.brand} ${matchedStock.model} (${matchedStock.year}) - Rp ${matchedStock.price.toLocaleString('id-ID')} [Plat: ${matchedStock.licensePlate || '-'}]` : undefined,
          vehicleInfo: `${searchBrand} ${searchModel || ''} ${yearWanted ? `(${yearWanted})` : ''}`.trim(),
          followUpReason: `Calon pelanggan mencari ${searchBrand} ${searchModel || ''} ${yearWanted ? `tahun ${yearWanted}` : ''}. Hubungi jika unit ready di showroom HR MOTOR.`,
          notes: notes || '',
          communicationLogs: [],
          createdAt: nowIso,
          updatedAt: nowIso,
        };

        db.followUps.unshift(newProspect);

        // Also add or sync with Leads for Sales Pipeline consistency
        if (!db.leads) db.leads = [];
        const maxLeadNum = db.leads.reduce((max, l) => {
          const match = (l.id || '').match(/LEAD-\d+-(\d+)/);
          if (match) {
            const num = parseInt(match[1], 10);
            return num > max ? num : max;
          }
          return max;
        }, 0);
        const newLead: Lead = {
          id: `LEAD-2026-${String(maxLeadNum + 1).padStart(3, '0')}`,
          customerName: customerName.trim(),
          contactNumber: customerPhone.trim(),
          customerPhone: customerPhone.trim(),
          leadSource: customerSource || 'Walk-in',
          interestedVehicle: newProspect.vehicleInfo,
          estimatedBudget: budgetWanted || 150000000,
          searchBrand: searchBrand.trim(),
          searchModel: (searchModel || '').trim(),
          searchYearMin: yearWanted,
          searchYearMax: yearWanted,
          searchBudgetMax: budgetWanted,
          assignedSalesId: userId,
          assignedSalesName: userName,
          status: 'Hanya Menanyakan',
          notes: notes || 'Calon pembeli mencari unit mobil',
          dateReceived: dateInquiry,
          lastContactDate: nowIso,
          stageHistory: [
            {
              stage: 'Hanya Menanyakan',
              timestamp: nowIso,
              notes: notes || 'Calon pembeli mencari unit mobil',
              updatedByName: userName,
            },
          ],
          createdAt: nowIso,
          updatedAt: nowIso,
        };
        db.leads.unshift(newLead);
        newProspect.leadId = newLead.id;

        // Add Notification if matched
        if (matchedStock) {
          if (!db.notifications) db.notifications = [];
          db.notifications.unshift({
            id: `NOTIF-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            userId: 'USR-001',
            title: `Mobil Tersedia: ${customerName.trim()}`,
            message: `Unit ${matchedStock.brand} ${matchedStock.model} (${matchedStock.year}) sudah READY di showroom! Cocok dengan pencarian ${customerName.trim()}. Segera hubungi via WhatsApp.`,
            type: 'system',
            isRead: false,
            link: '/follow-up?tab=prospect',
            createdAt: nowIso,
          });
        }

        logActivity(
          'Input Prospek Mencari Mobil',
          'Follow-up',
          newProspect.id,
          `Mencatat data calon pelanggan ${customerName.trim()} mencari ${searchBrand} ${searchModel || ''} (Status: ${initialStatus})`
        );
        break;
      }

      case 'UPDATE_PROSPECT_FOLLOW_UP_STATUS': {
        const { id, status, notes } = payload;
        if (!db.followUps) db.followUps = [];
        const prospect = db.followUps.find((f) => f.id === id);
        if (!prospect) {
          return NextResponse.json({ success: false, error: 'Data prospek tidak ditemukan' }, { status: 404 });
        }

        const oldStatus = prospect.status;
        prospect.status = status;
        prospect.prospectStatus = status;
        prospect.updatedAt = new Date().toISOString();

        if (notes) {
          if (!prospect.communicationLogs) prospect.communicationLogs = [];
          prospect.communicationLogs.unshift({
            id: `LOG-${Date.now()}`,
            timestamp: new Date().toISOString(),
            outcome: status,
            notes: notes,
            loggedByName: userName,
          });
        }

        logActivity(
          'Update Status Prospek',
          'Follow-up',
          prospect.id,
          `Mengubah status prospek ${prospect.customerName} dari "${oldStatus}" menjadi "${status}"`
        );
        break;
      }

      case 'SYNC_TO_SUPABASE': {
        const result = await syncToSupabaseRelational(db);
        if (result.success) {
          logActivity('Sinkronisasi Supabase', 'User', userId, 'Sinkronisasi dataset CRM HR MOTOR ke PostgreSQL Supabase');
          await writeDatabaseAsync(db);
        }
        return NextResponse.json(result);
      }

      default:
        return NextResponse.json({ success: false, error: 'Aksi tidak dikenali' }, { status: 400 });
    }

    await writeDatabaseAsync(db);
    return NextResponse.json({ success: true, data: db });
  } catch (error) {
    console.error('API CRM error:', error);
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
