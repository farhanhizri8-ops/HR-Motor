'use client';

import React, { useState, useMemo } from 'react';
import {
  History,
  Search,
  Filter,
  User,
  Clock,
  Shield,
  FileText,
  Tag,
  CheckCircle2,
} from 'lucide-react';
import { useCrm } from '@/context/CrmContext';

export default function ActivityLogsPage() {
  const { activityLogs, formatDate } = useCrm();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterEntity, setFilterEntity] = useState('ALL');

  const filteredLogs = useMemo(() => {
    let result = [...activityLogs];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (log) =>
          log.userName.toLowerCase().includes(q) ||
          log.action.toLowerCase().includes(q) ||
          log.details.toLowerCase().includes(q) ||
          log.entityId.toLowerCase().includes(q)
      );
    }

    if (filterEntity !== 'ALL') {
      result = result.filter((log) => log.entityType === filterEntity);
    }

    return result;
  }, [activityLogs, searchQuery, filterEntity]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="crm-card p-4 sm:p-6 border-b-2 border-b-gold-500/40">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="badge-gold">
                Audit Trail & Kepatuhan
              </span>
              <span className="text-xs text-charcoal-300">•</span>
              <span className="text-xs text-charcoal-400 font-medium tracking-wide">Log Aktivitas Sistem</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-charcoal-900 mt-1 tracking-tight">
              Audit Trail & Activity Logs
            </h1>
            <p className="text-xs text-charcoal-500 mt-0.5">
              Catatan kronologis seluruh tindakan staf, penambahan armada, perubahan status pipeline, dan interaksi konsumen di HR MOTOR Garut.
            </p>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="crm-card p-4 flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <Search className="w-4 h-4 text-charcoal-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari aktivitas berdasarkan nama staf, tindakan, atau detail..."
            className="w-full text-xs pl-9 pr-4 py-2.5 bg-[#F8F7F4] border border-[#EAE8E3] rounded-xl outline-none focus:border-gold-500 focus:ring-2 focus:ring-gold-500/20 text-charcoal-900 placeholder-charcoal-400 font-medium"
          />
        </div>

        <select
          value={filterEntity}
          onChange={(e) => setFilterEntity(e.target.value)}
          className="text-xs px-3.5 py-2.5 bg-[#F8F7F4] border border-[#EAE8E3] rounded-xl outline-none font-semibold text-charcoal-800 focus:border-gold-500"
        >
          <option value="ALL">Semua Entitas CRM</option>
          <option value="Pelanggan">Pelanggan</option>
          <option value="Prospek">Prospek / Leads</option>
          <option value="Follow-up">Follow-up</option>
          <option value="Komunikasi">Komunikasi</option>
          <option value="Deal">Transaksi Deal</option>
          <option value="Komplain">Komplain</option>
          <option value="User">Pengguna / User</option>
        </select>
      </div>

      {/* Activity Timeline Table */}
      <div className="crm-card overflow-hidden">
        <div className="overflow-x-auto w-full">
          <table className="crm-table w-full min-w-[700px] text-left">
            <thead>
              <tr>
                <th className="py-3.5 px-4">Waktu Kejadian (WIB)</th>
                <th className="py-3.5 px-4">Pengguna / Staf</th>
                <th className="py-3.5 px-4">Peran</th>
                <th className="py-3.5 px-4">Entitas</th>
                <th className="py-3.5 px-4">Tindakan / Aksi</th>
                <th className="py-3.5 px-4">Detail Perubahan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EAE8E3] text-xs">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-charcoal-400">
                    <History className="w-9 h-9 mx-auto mb-2 text-charcoal-300" />
                    <p className="font-semibold text-charcoal-700">Tidak ada log aktivitas yang cocok</p>
                    <p className="text-[11px] text-charcoal-400 mt-0.5">Ubah kata kunci pencarian atau sesuaikan filter entitas.</p>
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-[#F8F7F4]/80 transition-colors">
                    <td className="py-3.5 px-4 text-charcoal-500 font-mono text-[11px]">
                      {formatDate(log.createdAt, true)}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-charcoal-900">{log.userName}</td>
                    <td className="py-3.5 px-4">
                      <span className="text-[10px] px-2 py-0.5 rounded-md bg-[#FAF9F5] border border-[#EAE8E3] text-charcoal-700 font-semibold">
                        {log.userRole}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="badge-gold text-[10px]">{log.entityType}</span>
                    </td>
                    <td className="py-3.5 px-4 font-black text-charcoal-900">{log.action}</td>
                    <td className="py-3.5 px-4 text-charcoal-600 max-w-md">{log.details}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
