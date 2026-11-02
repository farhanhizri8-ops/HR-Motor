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
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden flex flex-col">
        {/* Search Input Bar */}
        <div className="flex items-center px-4 py-3 border-b border-slate-200">
          <Search className="w-5 h-5 text-slate-400 mr-3" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ketik nama pelanggan, no. WA, mobil, nopol, atau kecamatan di Garut..."
            className="flex-1 text-sm bg-transparent outline-none placeholder:text-slate-400 text-slate-800"
          />
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Results Body */}
        <div className="max-h-96 overflow-y-auto p-4 space-y-4">
          {!cleanQ && (
            <div className="text-center py-8 text-xs text-slate-400">
              <Search className="w-8 h-8 mx-auto mb-2 text-slate-300" />
              Ketik kata kunci untuk mencari seluruh data CRM HR MOTOR Garut
            </div>
          )}

          {cleanQ && totalResults === 0 && (
            <div className="text-center py-8 text-xs text-slate-500">
              Tidak ada hasil yang cocok dengan &quot;{query}&quot;.
            </div>
          )}

          {/* Customers */}
          {filteredCustomers.length > 0 && (
            <div>
              <p className="text-[11px] font-bold uppercase text-slate-400 tracking-wider mb-2 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-blue-500" /> Pelanggan ({filteredCustomers.length})
              </p>
              <div className="space-y-1">
                {filteredCustomers.slice(0, 4).map((c) => (
                  <Link
                    key={c.id}
                    href={`/customers?search=${encodeURIComponent(c.fullName)}`}
                    onClick={onClose}
                    className="flex items-center justify-between p-2.5 rounded-lg hover:bg-slate-50 border border-transparent hover:border-slate-200 transition-colors"
                  >
                    <div>
                      <p className="text-xs font-bold text-slate-800">{c.fullName}</p>
                      <p className="text-[11px] text-slate-500">
                        {c.whatsapp} • {c.district}, Garut • Minat: {c.interestedVehicle}
                      </p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-400" />
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Leads */}
          {filteredLeads.length > 0 && (
            <div>
              <p className="text-[11px] font-bold uppercase text-slate-400 tracking-wider mb-2 flex items-center gap-1.5">
                <Target className="w-3.5 h-3.5 text-emerald-500" /> Prospek Pipeline ({filteredLeads.length})
              </p>
              <div className="space-y-1">
                {filteredLeads.slice(0, 4).map((l) => (
                  <Link
                    key={l.id}
                    href={`/pipeline`}
                    onClick={onClose}
                    className="flex items-center justify-between p-2.5 rounded-lg hover:bg-slate-50 border border-transparent hover:border-slate-200 transition-colors"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-800">{l.customerName}</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-700 font-medium">
                          {l.status}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500">
                        {l.interestedVehicle} • Budget: {formatRupiah(l.estimatedBudget)}
                      </p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-400" />
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Purchases */}
          {filteredPurchases.length > 0 && (
            <div>
              <p className="text-[11px] font-bold uppercase text-slate-400 tracking-wider mb-2 flex items-center gap-1.5">
                <Car className="w-3.5 h-3.5 text-indigo-500" /> Unit Transaksi Deal ({filteredPurchases.length})
              </p>
              <div className="space-y-1">
                {filteredPurchases.slice(0, 3).map((p) => (
                  <Link
                    key={p.id}
                    href={`/after-sales`}
                    onClick={onClose}
                    className="flex items-center justify-between p-2.5 rounded-lg hover:bg-slate-50 border border-transparent hover:border-slate-200 transition-colors"
                  >
                    <div>
                      <p className="text-xs font-bold text-slate-800">{p.vehicleModel} ({p.plateNumber})</p>
                      <p className="text-[11px] text-slate-500">
                        Pembeli: {p.customerName} • {formatRupiah(p.purchasePrice)}
                      </p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-400" />
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
