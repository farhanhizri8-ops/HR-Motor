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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">
              Audit Trail & Kepatuhan
            </span>
            <span className="text-xs text-slate-400">•</span>
            <span className="text-xs text-slate-500">Log Aktivitas Sistem</span>
          </div>
          <h1 className="text-xl lg:text-2xl font-black text-slate-900 mt-1">
            Activity Logs (Riwayat Jejak Audit CRM)
          </h1>
          <p className="text-xs text-slate-500">
            Catatan kronologis seluruh tindakan staf, penambahan data, perubahan status pipeline, dan interaksi di HR MOTOR Garut.
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari aktivitas berdasarkan nama staf, tindakan, atau detail..."
            className="w-full text-xs pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500/20"
          />
        </div>

        <select
          value={filterEntity}
          onChange={(e) => setFilterEntity(e.target.value)}
          className="text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none font-semibold text-slate-700"
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
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                <th className="py-3 px-4">Waktu Kejadian (WIB)</th>
                <th className="py-3 px-4">Pengguna / Staf</th>
                <th className="py-3 px-4">Peran</th>
                <th className="py-3 px-4">Entitas</th>
                <th className="py-3 px-4">Tindakan / Aksi</th>
                <th className="py-3 px-4">Detail Perubahan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <History className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                    Tidak ada log aktivitas yang cocok.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">
                      {formatDate(log.createdAt, true)}
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-900">{log.userName}</td>
                    <td className="py-3 px-4">
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-semibold">
                        {log.userRole}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-semibold text-emerald-700">{log.entityType}</span>
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-800">{log.action}</td>
                    <td className="py-3 px-4 text-slate-600 max-w-md">{log.details}</td>
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
