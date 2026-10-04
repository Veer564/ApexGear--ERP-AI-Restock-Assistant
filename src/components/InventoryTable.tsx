import React, { useState, useMemo } from 'react';
import { InventoryItem, StockStatus, computeStockStatus } from '../types/inventory';
import {
  Search,
  Filter,
  Plus,
  Minus,
  AlertTriangle,
  CheckCircle2,
  AlertOctagon,
  Edit2,
  Trash2,
  ArrowUpDown,
  Truck,
  Copy,
  Check,
  PackagePlus,
  Layers,
  Scan,
  Barcode,
} from 'lucide-react';
import { useToast } from './Toast';

interface InventoryTableProps {
  parts: InventoryItem[];
  onUpdateStock: (id: string, newStock: number) => void;
  onEditPart: (part: InventoryItem) => void;
  onDeletePart: (id: string) => void;
  onOpenAddModal: () => void;
  onOpenScanner?: () => void;
  isAuditOutOfDate: boolean;
}

type SortField = 'id' | 'name' | 'currentStock' | 'reorderThreshold' | 'targetStock' | 'unitPrice' | 'status';
type SortOrder = 'asc' | 'desc';

export const InventoryTable: React.FC<InventoryTableProps> = ({
  parts,
  onUpdateStock,
  onEditPart,
  onDeletePart,
  onOpenAddModal,
  onOpenScanner,
  isAuditOutOfDate,
}) => {
  const { showToast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [statusFilter, setStatusFilter] = useState<'All' | StockStatus>('All');
  const [sortField, setSortField] = useState<SortField>('status');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [editingStockId, setEditingStockId] = useState<string | null>(null);
  const [tempStockValue, setTempStockValue] = useState<string>('');

  const categories = useMemo(() => {
    const set = new Set<string>();
    parts.forEach((p) => set.add(p.category));
    return ['All', ...Array.from(set)];
  }, [parts]);

  // Counts for status filters
  const counts = useMemo(() => {
    let critical = 0;
    let lowStock = 0;
    let normal = 0;
    parts.forEach((p) => {
      const s = computeStockStatus(p.currentStock, p.reorderThreshold);
      if (s === 'Critical') critical++;
      else if (s === 'Low Stock') lowStock++;
      else normal++;
    });
    return { all: parts.length, critical, lowStock, normal };
  }, [parts]);

  const handleCopyId = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    showToast(`Part ID copied: ${id}`, 'success', 2000);
    setTimeout(() => setCopiedId(null), 1800);
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const handleStockDirectSubmit = (id: string) => {
    const val = parseInt(tempStockValue, 10);
    if (!isNaN(val) && val >= 0) {
      onUpdateStock(id, val);
      showToast(`Stock updated to ${val} units`, 'info');
    }
    setEditingStockId(null);
  };

  const filteredAndSortedParts = useMemo(() => {
    return parts
      .filter((part) => {
        const matchesSearch =
          part.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
          part.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          part.supplier.toLowerCase().includes(searchQuery.toLowerCase()) ||
          part.machineryModels?.some((m) => m.toLowerCase().includes(searchQuery.toLowerCase()));

        const matchesCategory = selectedCategory === 'All' || part.category === selectedCategory;

        const status = computeStockStatus(part.currentStock, part.reorderThreshold);
        const matchesStatus = statusFilter === 'All' || status === statusFilter;

        return matchesSearch && matchesCategory && matchesStatus;
      })
      .sort((a, b) => {
        let diff = 0;
        const statusWeight: Record<StockStatus, number> = { Critical: 0, 'Low Stock': 1, Normal: 2 };

        if (sortField === 'status') {
          const statusA = computeStockStatus(a.currentStock, a.reorderThreshold);
          const statusB = computeStockStatus(b.currentStock, b.reorderThreshold);
          diff = statusWeight[statusA] - statusWeight[statusB];
        } else if (sortField === 'id') {
          diff = a.id.localeCompare(b.id);
        } else if (sortField === 'name') {
          diff = a.name.localeCompare(b.name);
        } else if (sortField === 'currentStock') {
          diff = a.currentStock - b.currentStock;
        } else if (sortField === 'reorderThreshold') {
          diff = a.reorderThreshold - b.reorderThreshold;
        } else if (sortField === 'targetStock') {
          diff = a.targetStock - b.targetStock;
        } else if (sortField === 'unitPrice') {
          diff = a.unitPrice - b.unitPrice;
        }

        return sortOrder === 'asc' ? diff : -diff;
      });
  }, [parts, searchQuery, selectedCategory, statusFilter, sortField, sortOrder]);

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden shadow-xl mb-10">
      {/* Table Header Controls */}
      <div className="p-4 sm:p-6 border-b border-slate-800 flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-lg sm:text-xl font-bold font-['Chakra_Petch',sans-serif] tracking-wide text-slate-100 uppercase">
                Heavy Equipment Spare Parts Depot
              </h2>
              {isAuditOutOfDate && (
                <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded-full animate-pulse">
                  Inventory changed • Re-audit advised
                </span>
              )}
            </div>
            <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
              Real-time component stock buffers, reorder triggers, and OEM part allocation
            </p>
          </div>

          <div className="flex items-center gap-2">
            {onOpenScanner && (
              <button
                onClick={onOpenScanner}
                className="flex items-center gap-1.5 px-3 py-2 text-xs sm:text-sm font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 hover:border-amber-500/40 transition-all shadow-sm"
              >
                <Scan className="w-4 h-4 text-amber-400" />
                <span>Scan Barcode</span>
              </button>
            )}
            <button
              onClick={onOpenAddModal}
              className="flex items-center gap-2 px-3.5 py-2 text-xs sm:text-sm font-semibold rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 transition-all shadow-md shadow-amber-500/10"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Part</span>
            </button>
          </div>
        </div>

        {/* Filter Controls Row */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 pt-2">
          {/* Status Filter Tabs */}
          <div className="flex items-center gap-1 bg-slate-950/70 p-1 rounded-xl border border-slate-800/80 overflow-x-auto">
            <button
              onClick={() => setStatusFilter('All')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                statusFilter === 'All'
                  ? 'bg-slate-800 text-slate-100 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              All Parts ({counts.all})
            </button>
            <button
              onClick={() => setStatusFilter('Critical')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                statusFilter === 'Critical'
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                  : 'text-slate-400 hover:text-rose-400'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
              Critical ({counts.critical})
            </button>
            <button
              onClick={() => setStatusFilter('Low Stock')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                statusFilter === 'Low Stock'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  : 'text-slate-400 hover:text-amber-400'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-amber-400"></span>
              Low Stock ({counts.lowStock})
            </button>
            <button
              onClick={() => setStatusFilter('Normal')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                statusFilter === 'Normal'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  : 'text-slate-400 hover:text-emerald-400'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              Normal ({counts.normal})
            </button>
          </div>

          {/* Search & Category Filter */}
          <div className="flex items-center gap-2 sm:gap-3 flex-1 md:max-w-md">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search part ID, name, supplier, model..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs sm:text-sm bg-slate-950/80 border border-slate-800 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500/60 focus:ring-1 focus:ring-amber-500/30 transition-colors"
              />
            </div>

            <div className="relative">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="text-xs sm:text-sm bg-slate-950/80 border border-slate-800 rounded-lg text-slate-300 py-1.5 pl-3 pr-8 focus:outline-none focus:border-amber-500/60 transition-colors cursor-pointer"
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat === 'All' ? 'All Categories' : cat}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Main Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs sm:text-sm text-slate-300 border-collapse">
          <thead>
            <tr className="border-b border-slate-800 bg-slate-950/50 text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-slate-400">
              <th
                onClick={() => handleSort('id')}
                className="py-3.5 px-4 cursor-pointer hover:text-slate-200 transition-colors"
              >
                <div className="flex items-center gap-1.5">
                  <span>Part ID</span>
                  <ArrowUpDown className="w-3.5 h-3.5 text-slate-500" />
                </div>
              </th>
              <th
                onClick={() => handleSort('name')}
                className="py-3.5 px-4 cursor-pointer hover:text-slate-200 transition-colors min-w-[220px]"
              >
                <div className="flex items-center gap-1.5">
                  <span>Part Name & Specs</span>
                  <ArrowUpDown className="w-3.5 h-3.5 text-slate-500" />
                </div>
              </th>
              <th
                onClick={() => handleSort('currentStock')}
                className="py-3.5 px-4 cursor-pointer hover:text-slate-200 transition-colors min-w-[150px]"
              >
                <div className="flex items-center gap-1.5">
                  <span>Current Stock</span>
                  <ArrowUpDown className="w-3.5 h-3.5 text-slate-500" />
                </div>
              </th>
              <th
                onClick={() => handleSort('reorderThreshold')}
                className="py-3.5 px-4 cursor-pointer hover:text-slate-200 transition-colors"
              >
                <div className="flex items-center gap-1.5">
                  <span>Reorder Threshold</span>
                  <ArrowUpDown className="w-3.5 h-3.5 text-slate-500" />
                </div>
              </th>
              <th
                onClick={() => handleSort('targetStock')}
                className="py-3.5 px-4 cursor-pointer hover:text-slate-200 transition-colors"
              >
                <div className="flex items-center gap-1.5">
                  <span>Target Stock</span>
                  <ArrowUpDown className="w-3.5 h-3.5 text-slate-500" />
                </div>
              </th>
              <th
                onClick={() => handleSort('unitPrice')}
                className="py-3.5 px-4 cursor-pointer hover:text-slate-200 transition-colors text-right"
              >
                <div className="flex items-center justify-end gap-1.5">
                  <span>Unit Price</span>
                  <ArrowUpDown className="w-3.5 h-3.5 text-slate-500" />
                </div>
              </th>
              <th
                onClick={() => handleSort('status')}
                className="py-3.5 px-4 cursor-pointer hover:text-slate-200 transition-colors text-center"
              >
                <div className="flex items-center justify-center gap-1.5">
                  <span>Status Badge</span>
                  <ArrowUpDown className="w-3.5 h-3.5 text-slate-500" />
                </div>
              </th>
              <th className="py-3.5 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {filteredAndSortedParts.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-12 text-center text-slate-400">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <Layers className="w-8 h-8 text-slate-600" />
                    <p className="font-medium text-slate-300">No spare parts match your filter criteria</p>
                    <p className="text-xs text-slate-500">Try clearing search terms or status filters</p>
                  </div>
                </td>
              </tr>
            ) : (
              filteredAndSortedParts.map((part) => {
                const status = computeStockStatus(part.currentStock, part.reorderThreshold);
                const isCritical = status === 'Critical';
                const isLowStock = status === 'Low Stock';
                const percentOfTarget = Math.min(100, Math.round((part.currentStock / Math.max(1, part.targetStock)) * 100));

                return (
                  <tr
                    key={part.id}
                    className={`hover:bg-slate-800/40 transition-colors group ${
                      isCritical ? 'bg-rose-950/10' : isLowStock ? 'bg-amber-950/5' : ''
                    }`}
                  >
                    {/* Part ID with copy button */}
                    <td className="py-4 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-xs sm:text-sm font-semibold text-slate-200 tracking-wide bg-slate-950/80 px-2 py-1 rounded border border-slate-800">
                          {part.id}
                        </span>
                        <button
                          onClick={(e) => handleCopyId(part.id, e)}
                          title="Copy Part ID"
                          className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-slate-200 transition-opacity"
                        >
                          {copiedId === part.id ? (
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                      <span className="text-[10px] text-slate-500 font-mono block mt-1">
                        Loc: {part.location}
                      </span>
                    </td>

                    {/* Part Name & Specs */}
                    <td className="py-4 px-4">
                      <div className="flex flex-col gap-1">
                        <span className="font-semibold text-slate-100 text-sm">{part.name}</span>
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-800 text-slate-300 border border-slate-700/60">
                            {part.category}
                          </span>
                          <span className="text-slate-500 text-[11px] flex items-center gap-1">
                            <Truck className="w-3 h-3" />
                            {part.supplier}
                          </span>
                        </div>
                        {part.machineryModels && part.machineryModels.length > 0 && (
                          <div className="flex flex-wrap items-center gap-1 mt-0.5">
                            {part.machineryModels.map((m) => (
                              <span
                                key={m}
                                className="text-[10px] text-slate-400 bg-slate-950/60 px-1.5 py-0.5 rounded font-mono"
                              >
                                {m}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Current Stock with Quick +/- Steppers */}
                    <td className="py-4 px-4 whitespace-nowrap">
                      <div className="flex flex-col gap-1.5">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              const newStock = Math.max(0, part.currentStock - 1);
                              onUpdateStock(part.id, newStock);
                              showToast(`Stock decremented to ${newStock}`, 'info');
                            }}
                            title="Decrement stock (-1)"
                            className="w-6 h-6 rounded bg-slate-800 hover:bg-rose-500/20 hover:text-rose-400 text-slate-400 flex items-center justify-center transition-colors border border-slate-700 active:scale-95"
                          >
                            <Minus className="w-3 h-3" />
                          </button>

                          {editingStockId === part.id ? (
                            <input
                              type="number"
                              min="0"
                              autoFocus
                              value={tempStockValue}
                              onChange={(e) => setTempStockValue(e.target.value)}
                              onBlur={() => handleStockDirectSubmit(part.id)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleStockDirectSubmit(part.id);
                                if (e.key === 'Escape') setEditingStockId(null);
                              }}
                              className="w-14 text-center font-mono font-bold text-sm bg-slate-950 border border-amber-500 rounded py-0.5 text-slate-100 focus:outline-none"
                            />
                          ) : (
                            <button
                              onClick={() => {
                                setEditingStockId(part.id);
                                setTempStockValue(String(part.currentStock));
                              }}
                              title="Click to edit stock directly"
                              className={`min-w-10 px-2 py-0.5 rounded font-mono font-bold text-base text-center transition-all ${
                                isCritical
                                  ? 'text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30'
                                  : isLowStock
                                  ? 'text-amber-400 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30'
                                  : 'text-slate-100 hover:bg-slate-800'
                              }`}
                            >
                              {part.currentStock}
                            </button>
                          )}

                          <button
                            onClick={() => {
                              const newStock = part.currentStock + 1;
                              onUpdateStock(part.id, newStock);
                              showToast(`Stock incremented to ${newStock}`, 'success');
                            }}
                            title="Increment stock (+1)"
                            className="w-6 h-6 rounded bg-slate-800 hover:bg-emerald-500/20 hover:text-emerald-400 text-slate-400 flex items-center justify-center transition-colors border border-slate-700 active:scale-95"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>

                        {/* Progress Bar of Stock to Target */}
                        <div className="w-28 bg-slate-800 h-1.5 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-300 ${
                              isCritical ? 'bg-rose-500' : isLowStock ? 'bg-amber-400' : 'bg-emerald-400'
                            }`}
                            style={{ width: `${percentOfTarget}%` }}
                          ></div>
                        </div>
                      </div>
                    </td>

                    {/* Reorder Threshold */}
                    <td className="py-4 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-sm font-medium text-slate-300 bg-slate-950/70 px-2 py-0.5 rounded border border-slate-800">
                          {part.reorderThreshold}
                        </span>
                        <span className="text-[11px] text-slate-500">trigger</span>
                      </div>
                    </td>

                    {/* Target Stock */}
                    <td className="py-4 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-sm font-medium text-slate-300 bg-slate-950/70 px-2 py-0.5 rounded border border-slate-800">
                          {part.targetStock}
                        </span>
                        <span className="text-[11px] text-slate-500">target</span>
                      </div>
                    </td>

                    {/* Unit Price (USD) */}
                    <td className="py-4 px-4 whitespace-nowrap text-right font-mono">
                      <div className="text-sm font-semibold text-slate-200">
                        ${part.unitPrice.toFixed(2)}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        Total: ${(part.currentStock * part.unitPrice).toLocaleString(undefined, {
                          minimumFractionDigits: 0,
                          maximumFractionDigits: 0,
                        })}
                      </div>
                    </td>

                    {/* Status Badge */}
                    <td className="py-4 px-4 whitespace-nowrap text-center">
                      {isCritical && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-rose-500/15 text-rose-400 border border-rose-500/30 shadow-sm shadow-rose-950/50">
                          <AlertOctagon className="w-3.5 h-3.5 animate-pulse text-rose-400" />
                          Critical
                        </span>
                      )}
                      {isLowStock && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-500/15 text-amber-300 border border-amber-500/30">
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                          Low Stock
                        </span>
                      )}
                      {!isCritical && !isLowStock && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                          Normal
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-4 px-4 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {part.currentStock < part.targetStock && (
                          <button
                            onClick={() => {
                              const diff = part.targetStock - part.currentStock;
                              onUpdateStock(part.id, part.targetStock);
                              showToast(`Restocked ${part.name} to target (+${diff} units)`, 'success');
                            }}
                            title={`Top up stock to target (${part.targetStock} units)`}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/10 transition-colors"
                          >
                            <PackagePlus className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => onEditPart(part)}
                          title="Edit Part Specifications"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            if (window.confirm(`Are you sure you want to delete part ${part.id} (${part.name})?`)) {
                              onDeletePart(part.id);
                              showToast(`Deleted ${part.id}`, 'warning');
                            }
                          }}
                          title="Delete Part"
                          className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Table Footer info */}
      <div className="p-4 border-t border-slate-800/80 bg-slate-950/40 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-2">
        <div className="flex items-center gap-2">
          <span>Showing {filteredAndSortedParts.length} of {parts.length} equipment spare parts</span>
          <span>•</span>
          <span>Depot Bay 1 to 4 active</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-rose-500"></span> Critical: Stock ≤ 0 or ≤ 35% reorder
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-400"></span> Low Stock: Stock ≤ Reorder Threshold
          </span>
        </div>
      </div>
    </div>
  );
};
