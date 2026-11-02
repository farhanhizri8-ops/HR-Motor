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
} from '@/types/crm';

function triggerStockMatching(stock: VehicleStock, db: CrmDatabase, userName: string) {
  if (stock.status !== 'Tersedia') return;
  if (!db.leads || !Array.isArray(db.leads)) return;
  if (!db.followUps) db.followUps = [];

  const stockBrandLower = stock.brand.toLowerCase().trim();
  const stockModelLower = stock.model.toLowerCase().trim();

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
        modelMatched = words.some((w) => stockModelLower.includes(w));
      } else if (interested) {
        const words = interested.split(' ').filter((w) => w.length > 2);
        modelMatched = words.some((w) => stockModelLower.includes(w));
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
          customerId: lead.customerId,
          customerName: lead.customerName,
          customerPhone: phone,
          leadId: lead.id,
          category: 'Unit yang Dicari Sudah Tersedia',
          scheduledDate: new Date().toISOString().split('T')[0],
          scheduledTime: '09:00',
          channel: 'WhatsApp',
          status: 'Belum Dihubungi',
          priority: 'Tinggi',
          vehicleStockId: stock.id,
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

        // Duplicate WhatsApp check
        const existing = db.customers.find((c) => c.whatsapp === customer.whatsapp);
        if (existing) {
          return NextResponse.json(
            { success: false, error: `Nomor WhatsApp ${customer.whatsapp} sudah terdaftar atas nama ${existing.fullName}` },
            { status: 400 }
          );
        }

        db.customers.unshift(customer);
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
        const initialStage = payload.status || 'Menanyakan Unit';
        const now = new Date().toISOString();
        const lead: Lead = {
          ...payload,
          id: payload.id || `LEAD-2026-${String(db.leads.length + 1).padStart(3, '0')}`,
          status: initialStage,
          dateReceived: payload.dateReceived || now.split('T')[0],
          lastContactDate: now,
          stageHistory: payload.stageHistory || [
            {
              stage: initialStage,
              timestamp: now,
              notes: payload.notes || 'Prospek pertama kali tercatat di sistem showroom',
              updatedByName: userName,
            },
          ],
          createdAt: now,
          updatedAt: now,
        };
        db.leads.unshift(lead);
        logActivity('Menerima Prospek Baru', 'Prospek', lead.id, `Prospek baru ${lead.customerName} sumber ${lead.leadSource} (Unit: ${lead.interestedVehicle})`);
        break;
      }

      case 'UPDATE_LEAD': {
        const index = db.leads.findIndex((l) => l.id === payload.id);
        if (index === -1) {
          return NextResponse.json({ success: false, error: 'Prospek tidak ditemukan' }, { status: 404 });
        }
        db.leads[index] = {
          ...db.leads[index],
          ...payload,
          updatedAt: new Date().toISOString(),
        };
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

        if (newStage === 'Cek Unit') {
          lead.visitNotes = payload.visitNotes || lead.visitNotes || payload.notes;
          lead.visitDate = payload.visitDate || now;
        }
        if (newStage === 'Negosiasi') {
          if (payload.negotiationOffer) lead.negotiationOffer = Number(payload.negotiationOffer);
          if (payload.negotiationNotes) lead.negotiationNotes = payload.negotiationNotes;
          if (payload.notes) lead.notes = payload.notes;
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
        if (outcome === 'Berhasil Transaksi / Deal') {
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
        } else if (outcome === 'Tertarik Datang ke Showroom' || outcome === 'Minta Foto / Video Detail') {
          item.status = 'Sudah Dihubungi';
        } else if (outcome === 'Menunggu Konfirmasi Keluarga' || outcome === 'Sedang Mempertimbangkan Unit Lain') {
          item.status = 'Menunggu Respons';
        } else if (outcome === 'Tidak Ada Respons') {
          item.status = 'Sudah Dihubungi';
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
        const sparepartCost = Number(payload.sparepartCost) || 0;
        const serviceCost = Number(payload.serviceCost) || 0;
        const totalCost = sparepartCost + serviceCost;
        const count = (db.repairClaims || []).length + 1;
        const claimNum = payload.claimNumber || `GRS-2026-${String(count).padStart(3, '0')}`;
        const newClaim: RepairClaim = {
          id: payload.id || `REP-2026-${String(count).padStart(3, '0')}`,
          claimNumber: claimNum,
          customerId: payload.customerId || '',
          customerName: payload.customerName || '',
          customerPhone: payload.customerPhone || '',
          vehicleBrand: payload.vehicleBrand || '',
          vehicleModel: payload.vehicleModel || '',
          vehicleYear: Number(payload.vehicleYear) || 2020,
          purchaseDate: payload.purchaseDate || '',
          claimDate: payload.claimDate || new Date().toISOString().split('T')[0],
          claimType: payload.claimType || 'Garansi',
          damageCategory: payload.damageCategory || 'Mesin',
          complaint: payload.complaint || '',
          damagedParts: payload.damagedParts || '',
          actionTaken: payload.actionTaken || '',
          sparepartCost,
          serviceCost,
          totalCost,
          status: payload.status || 'Menunggu',
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
        const sparepartCost = payload.sparepartCost !== undefined ? Number(payload.sparepartCost) || 0 : existing.sparepartCost;
        const serviceCost = payload.serviceCost !== undefined ? Number(payload.serviceCost) || 0 : existing.serviceCost;
        const totalCost = sparepartCost + serviceCost;

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

        // If status changed to Tersedia, run matching
        if (updated.status === 'Tersedia' && oldStatus !== 'Tersedia') {
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
              avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=120&auto=format&fit=crop&q=80',
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
          return NextResponse.json({ success: false, error: 'Email belum terdaftar di sistem HR MOTOR.' }, { status: 404 });
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
        u.updatedAt = new Date().toISOString();
        logActivity('Mengubah Hak Akses User', 'User', u.id, `Mengubah peran ${u.name} dari ${oldRole} menjadi ${payload.role}`);
        break;
      }

      case 'REGISTER_USER': {
        const cleanEmail = (payload.email || '').trim().toLowerCase();
        const exists = db.users.find((u) => u.email.toLowerCase() === cleanEmail);
        if (exists) {
          return NextResponse.json({ success: false, error: 'Email sudah terdaftar di sistem' }, { status: 400 });
        }
        const newUser = {
          id: `USR-${String(db.users.length + 1).padStart(3, '0')}`,
          name: payload.name.trim(),
          email: cleanEmail,
          password: payload.password || 'Garut2005',
          role: payload.role || 'Sales Representative',
          phone: payload.phone || '',
          avatar: `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&auto=format&fit=crop&q=80`,
          isApproved: false, // Wajib disetujui Owner (Farhan Hizri)!
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        db.users.push(newUser);

        // Add notification for Owner
        db.notifications.unshift({
          id: `NOTIF-${Date.now()}`,
          userId: 'USR-001',
          title: 'Pengajuan Akun Karyawan Baru',
          message: `${newUser.name} (${newUser.email}) mengajukan akses login (${newUser.role}). Menunggu persetujuan Owner.`,
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
