import React from 'react';
import { InventoryItem, computeStockStatus } from '../types/inventory';
import {
  Boxes,
  AlertOctagon,
  Clock3,
  DollarSign,
  TrendingDown,
  ShieldCheck,
} from 'lucide-react';

interface MetricCardsProps {
  parts: InventoryItem[];
}

export const MetricCards: React.FC<MetricCardsProps> = ({ parts }) => {
  let criticalCount = 0;
  let lowStockCount = 0;
  let normalCount = 0;
  let totalValue = 0;
  let totalUnitsInStock = 0;
  let totalDeficitUnits = 0;

  parts.forEach((p) => {
    const status = computeStockStatus(p.currentStock, p.reorderThreshold);
    if (status === 'Critical') criticalCount++;
    else if (status === 'Low Stock') lowStockCount++;
    else normalCount++;

    totalValue += p.currentStock * p.unitPrice;
    totalUnitsInStock += p.currentStock;
    if (p.currentStock < p.targetStock) {
      totalDeficitUnits += p.targetStock - p.currentStock;
    }
  });

  return (
    <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4 mb-6">
      {/* Total SKUs */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 sm:p-5 flex flex-col justify-between relative overflow-hidden group hover:border-slate-700 transition-all">
        <div className="flex items-center justify-between text-slate-400 mb-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Tracked SKUs</span>
          <div className="p-2 rounded-lg bg-slate-800/80 text-slate-300">
            <Boxes className="w-4 h-4 text-slate-400" />
          </div>
        </div>
        <div className="flex items-baseline justify-between">
          <span className="text-2xl sm:text-3xl font-bold font-mono text-slate-100">{parts.length}</span>
          <span className="text-xs text-slate-500 font-mono">{totalUnitsInStock} total units</span>
        </div>
        <div className="w-full bg-slate-800 h-1 rounded-full mt-3 overflow-hidden">
          <div className="bg-slate-400 h-full rounded-full" style={{ width: '100%' }}></div>
        </div>
      </div>

      {/* Critical Stock Alerts */}
      <div
        className={`border rounded-xl p-4 sm:p-5 flex flex-col justify-between relative overflow-hidden transition-all ${
          criticalCount > 0
            ? 'bg-rose-950/20 border-rose-500/40 hover:border-rose-500/60 shadow-lg shadow-rose-950/20'
            : 'bg-slate-900/80 border-slate-800'
        }`}
      >
        <div className="flex items-center justify-between text-slate-400 mb-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-rose-300">Critical Stock</span>
          <div className={`p-2 rounded-lg ${criticalCount > 0 ? 'bg-rose-500/20 text-rose-400' : 'bg-slate-800 text-slate-400'}`}>
            <AlertOctagon className="w-4 h-4" />
          </div>
        </div>
        <div className="flex items-baseline justify-between">
          <span className={`text-2xl sm:text-3xl font-bold font-mono ${criticalCount > 0 ? 'text-rose-400' : 'text-slate-300'}`}>
            {criticalCount}
          </span>
          {criticalCount > 0 ? (
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-400 bg-rose-500/10 px-1.5 py-0.5 rounded border border-rose-500/20">
              Immediate Risk
            </span>
          ) : (
            <span className="text-xs text-emerald-400">Zero Critical</span>
          )}
        </div>
        <div className="w-full bg-slate-800 h-1 rounded-full mt-3 overflow-hidden">
          <div
            className="bg-rose-500 h-full rounded-full transition-all duration-500"
            style={{ width: `${parts.length ? (criticalCount / parts.length) * 100 : 0}%` }}
          ></div>
        </div>
      </div>

      {/* Low Stock Buffer Alerts */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 sm:p-5 flex flex-col justify-between relative overflow-hidden group hover:border-amber-500/30 transition-all">
        <div className="flex items-center justify-between text-slate-400 mb-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-amber-300">Low Stock Buffer</span>
          <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400">
            <Clock3 className="w-4 h-4" />
          </div>
        </div>
        <div className="flex items-baseline justify-between">
          <span className="text-2xl sm:text-3xl font-bold font-mono text-amber-400">{lowStockCount}</span>
          <span className="text-xs text-slate-500 font-mono">at/below reorder</span>
        </div>
        <div className="w-full bg-slate-800 h-1 rounded-full mt-3 overflow-hidden">
          <div
            className="bg-amber-400 h-full rounded-full transition-all duration-500"
            style={{ width: `${parts.length ? (lowStockCount / parts.length) * 100 : 0}%` }}
          ></div>
        </div>
      </div>

      {/* Total Inventory Value */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 sm:p-5 flex flex-col justify-between relative overflow-hidden group hover:border-slate-700 transition-all">
        <div className="flex items-center justify-between text-slate-400 mb-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Warehouse Valuation</span>
          <div className="p-2 rounded-lg bg-slate-800/80 text-emerald-400">
            <DollarSign className="w-4 h-4" />
          </div>
        </div>
        <div className="flex items-baseline justify-between">
          <span className="text-xl sm:text-2xl font-bold font-mono text-emerald-400">
            ${totalValue.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
          </span>
          <span className="text-xs text-slate-500">Asset Value</span>
        </div>
        <div className="w-full bg-slate-800 h-1 rounded-full mt-3 overflow-hidden">
          <div className="bg-emerald-500 h-full rounded-full" style={{ width: '100%' }}></div>
        </div>
      </div>

      {/* Total Reorder Deficit */}
      <div className="col-span-2 lg:col-span-1 bg-slate-900/80 border border-slate-800 rounded-xl p-4 sm:p-5 flex flex-col justify-between relative overflow-hidden group hover:border-slate-700 transition-all">
        <div className="flex items-center justify-between text-slate-400 mb-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Restock Deficit</span>
          <div className="p-2 rounded-lg bg-slate-800/80 text-amber-400">
            <TrendingDown className="w-4 h-4" />
          </div>
        </div>
        <div className="flex items-baseline justify-between">
          <span className="text-2xl sm:text-3xl font-bold font-mono text-amber-300">
            {totalDeficitUnits}
          </span>
          <span className="text-xs text-slate-500 font-mono">units to target</span>
        </div>
        <div className="w-full bg-slate-800 h-1 rounded-full mt-3 overflow-hidden">
          <div
            className="bg-amber-500 h-full rounded-full"
            style={{ width: `${Math.min(100, (totalDeficitUnits / Math.max(1, totalUnitsInStock + totalDeficitUnits)) * 100)}%` }}
          ></div>
        </div>
      </div>
    </div>
  );
};
