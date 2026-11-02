'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Search, X, Users, Target, CalendarClock, Car, ArrowRight } from 'lucide-react';
import { useCrm } from '@/context/CrmContext';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({ isOpen, onClose }) => {
  const { customers, leads, purchases, followUps, formatRupiah } = useCrm();
  const [query, setQuery] = useState('');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        // Toggle or open
      }
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!isOpen) return null;

  const cleanQ = query.toLowerCase().trim();

  const filteredCustomers = cleanQ
    ? customers.filter(
        (c) =>
          c.fullName.toLowerCase().includes(cleanQ) ||
          c.whatsapp.includes(cleanQ) ||
          c.district.toLowerCase().includes(cleanQ) ||
          c.interestedVehicle.toLowerCase().includes(cleanQ)
      )
    : [];

  const filteredLeads = cleanQ
    ? leads.filter(
        (l) =>
          l.customerName.toLowerCase().includes(cleanQ) ||
          l.contactNumber.includes(cleanQ) ||
          l.interestedVehicle.toLowerCase().includes(cleanQ) ||
          l.status.toLowerCase().includes(cleanQ)
      )
    : [];

  const filteredPurchases = cleanQ
    ? purchases.filter(
        (p) =>
          p.customerName.toLowerCase().includes(cleanQ) ||
          p.vehicleModel.toLowerCase().includes(cleanQ) ||
          p.plateNumber.toLowerCase().includes(cleanQ)
      )
    : [];

  const totalResults = filteredCustomers.length + filteredLeads.length + filteredPurchases.length;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4 bg-charcoal-950/70 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="crm-card w-full max-w-2xl overflow-hidden flex flex-col shadow-luxury border-gold-500/30">
        {/* Search Input Bar */}
        <div className="flex items-center px-5 py-4 border-b border-[#EAE8E3] bg-[#FAF9F5]">
          <Search className="w-5 h-5 text-gold-600 mr-3 shrink-0" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Cari konsumen, no. WhatsApp, armada, nopol, atau kecamatan di Garut..."
            className="flex-1 text-sm bg-transparent outline-none placeholder:text-charcoal-400 text-charcoal-900 font-medium"
          />
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-charcoal-400 hover:text-charcoal-900 hover:bg-[#EAE8E3]/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Results Body */}
        <div className="max-h-96 overflow-y-auto p-5 space-y-4">
          {!cleanQ && (
            <div className="text-center py-10 text-xs text-charcoal-400">
              <Search className="w-9 h-9 mx-auto mb-2 text-charcoal-300" />
              <p className="font-semibold text-charcoal-700">Pencarian Global CRM HR MOTOR</p>
              <p className="text-[11px] text-charcoal-400 mt-0.5">Ketik kata kunci nama pembeli, nomor WhatsApp, atau model kendaraan.</p>
            </div>
          )}

          {cleanQ && totalResults === 0 && (
            <div className="text-center py-10 text-xs text-charcoal-500">
              Tidak ada data yang cocok dengan &quot;<strong className="text-charcoal-900">{query}</strong>&quot;.
            </div>
          )}

          {/* Customers */}
          {filteredCustomers.length > 0 && (
            <div>
              <p className="text-[11px] font-bold uppercase text-charcoal-400 tracking-wider mb-2 flex items-center gap-2">
                <Users className="w-3.5 h-3.5 text-gold-600" /> Konsumen Terdaftar ({filteredCustomers.length})
              </p>
              <div className="space-y-1.5">
                {filteredCustomers.slice(0, 4).map((c) => (
                  <Link
                    key={c.id}
                    href={`/customers`}
                    onClick={onClose}
                    className="flex items-center justify-between p-3 rounded-xl hover:bg-[#F8F7F4] border border-transparent hover:border-gold-500/30 transition-colors"
                  >
                    <div>
                      <p className="text-xs font-bold text-charcoal-900">{c.fullName}</p>
                      <p className="text-[11px] text-charcoal-500 mt-0.5">
                        {c.whatsapp} • {c.district}, Garut • Minat: <strong className="text-charcoal-800">{c.interestedVehicle}</strong>
                      </p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-gold-600" />
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Leads */}
          {filteredLeads.length > 0 && (
            <div>
              <p className="text-[11px] font-bold uppercase text-charcoal-400 tracking-wider mb-2 flex items-center gap-2">
                <Target className="w-3.5 h-3.5 text-gold-600" /> Prospek Pipeline ({filteredLeads.length})
              </p>
              <div className="space-y-1.5">
                {filteredLeads.slice(0, 4).map((l) => (
                  <Link
                    key={l.id}
                    href={`/pipeline`}
                    onClick={onClose}
                    className="flex items-center justify-between p-3 rounded-xl hover:bg-[#F8F7F4] border border-transparent hover:border-gold-500/30 transition-colors"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-charcoal-900">{l.customerName}</span>
                        <span className="badge-gold text-[10px]">
                          {l.status}
                        </span>
                      </div>
                      <p className="text-[11px] text-charcoal-500 mt-0.5">
                        {l.interestedVehicle} • Budget: <strong className="text-gold-600 font-bold">{formatRupiah(l.estimatedBudget)}</strong>
                      </p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-gold-600" />
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Purchases */}
          {filteredPurchases.length > 0 && (
            <div>
              <p className="text-[11px] font-bold uppercase text-charcoal-400 tracking-wider mb-2 flex items-center gap-2">
                <Car className="w-3.5 h-3.5 text-gold-600" /> Unit Transaksi Selesai ({filteredPurchases.length})
              </p>
              <div className="space-y-1.5">
                {filteredPurchases.slice(0, 3).map((p) => (
                  <Link
                    key={p.id}
                    href={`/riwayat-perbaikan`}
                    onClick={onClose}
                    className="flex items-center justify-between p-3 rounded-xl hover:bg-[#F8F7F4] border border-transparent hover:border-gold-500/30 transition-colors"
                  >
                    <div>
                      <p className="text-xs font-bold text-charcoal-900">{p.vehicleModel} ({p.plateNumber})</p>
                      <p className="text-[11px] text-charcoal-500 mt-0.5">
                        Pembeli: {p.customerName} • <span className="font-bold text-gold-600">{formatRupiah(p.purchasePrice)}</span>
                      </p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-gold-600" />
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
