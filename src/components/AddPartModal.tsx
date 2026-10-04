import React, { useState } from 'react';
import { InventoryItem, PartCategory } from '../types/inventory';
import { X, Plus, Sparkles } from 'lucide-react';
import { useToast } from './Toast';

interface AddPartModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddPart: (part: InventoryItem) => void;
  existingIds: string[];
}

const CATEGORIES: PartCategory[] = [
  'Hydraulics',
  'Engine',
  'Undercarriage',
  'Transmission',
  'Filtration',
  'Electrical',
  'Wear Parts',
];

export const AddPartModal: React.FC<AddPartModalProps> = ({
  isOpen,
  onClose,
  onAddPart,
  existingIds,
}) => {
  const { showToast } = useToast();
  const [partId, setPartId] = useState('');
  const [partName, setPartName] = useState('');
  const [category, setCategory] = useState<PartCategory>('Hydraulics');
  const [currentStock, setCurrentStock] = useState<number>(5);
  const [reorderThreshold, setReorderThreshold] = useState<number>(8);
  const [targetStock, setTargetStock] = useState<number>(20);
  const [unitPrice, setUnitPrice] = useState<number>(150);
  const [supplier, setSupplier] = useState('');
  const [location, setLocation] = useState('Bay 1 - Rack A-01');
  const [machineryModels, setMachineryModels] = useState('CAT 336, Komatsu PC390');

  if (!isOpen) return null;

  const handleGenerateId = () => {
    const prefixes: Record<PartCategory, string> = {
      Hydraulics: 'HYD',
      Engine: 'ENG',
      Undercarriage: 'TRK',
      Transmission: 'GER',
      Filtration: 'FLT',
      Electrical: 'ELC',
      'Wear Parts': 'WER',
    };
    const code = prefixes[category] || 'PRT';
    const rand = Math.floor(1000 + Math.random() * 9000);
    setPartId(`${code}-GEN-${rand}`);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!partId.trim()) {
      showToast('Part ID is required', 'warning');
      return;
    }

    if (existingIds.includes(partId.trim().toUpperCase())) {
      showToast(`Part ID ${partId} already exists in inventory`, 'warning');
      return;
    }

    if (!partName.trim()) {
      showToast('Part Name is required', 'warning');
      return;
    }

    if (targetStock < reorderThreshold) {
      showToast('Target stock must be greater than or equal to reorder threshold', 'warning');
      return;
    }

    const newPart: InventoryItem = {
      id: partId.trim().toUpperCase(),
      name: partName.trim(),
      category,
      currentStock: Number(currentStock),
      reorderThreshold: Number(reorderThreshold),
      targetStock: Number(targetStock),
      unitPrice: Number(unitPrice),
      supplier: supplier.trim() || 'Direct OEM Requisition',
      location: location.trim() || 'General Depot Bay',
      leadTimeDays: 5,
      machineryModels: machineryModels
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
    };

    onAddPart(newPart);
    showToast(`Added part ${newPart.id} successfully!`, 'success');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-xl w-full p-6 shadow-2xl relative">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div>
            <h3 className="text-lg font-bold font-['Chakra_Petch',sans-serif] uppercase tracking-wide text-slate-100">
              Add Heavy Equipment Spare Part
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Enter part details, stock thresholds, and compatible fleet models
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4 text-xs sm:text-sm">
          {/* Part ID & Category */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="font-semibold text-slate-300">Part ID / SKU *</label>
                <button
                  type="button"
                  onClick={handleGenerateId}
                  className="text-[11px] text-amber-400 hover:text-amber-300 flex items-center gap-1"
                >
                  <Sparkles className="w-3 h-3" />
                  Auto-Gen ID
                </button>
              </div>
              <input
                type="text"
                placeholder="e.g. HYD-EXC-4091"
                value={partId}
                onChange={(e) => setPartId(e.target.value.toUpperCase())}
                required
                className="w-full font-mono uppercase bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-amber-500/60"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">Category *</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as PartCategory)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-amber-500/60 cursor-pointer"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Part Name */}
          <div>
            <label className="block font-semibold text-slate-300 mb-1">Part Name & Specification *</label>
            <input
              type="text"
              placeholder="e.g. Excavator Hydraulic Cylinder Seal Kit"
              value={partName}
              onChange={(e) => setPartName(e.target.value)}
              required
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-amber-500/60"
            />
          </div>

          {/* Stock Metrics: Current, Threshold, Target */}
          <div className="grid grid-cols-3 gap-3 bg-slate-950/60 p-3.5 rounded-xl border border-slate-800/80">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Current Stock</label>
              <input
                type="number"
                min="0"
                value={currentStock}
                onChange={(e) => setCurrentStock(Math.max(0, parseInt(e.target.value) || 0))}
                className="w-full font-mono text-center bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-slate-100 font-bold focus:outline-none focus:border-amber-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Reorder Threshold</label>
              <input
                type="number"
                min="1"
                value={reorderThreshold}
                onChange={(e) => setReorderThreshold(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-full font-mono text-center bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-amber-300 font-bold focus:outline-none focus:border-amber-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Target Stock</label>
              <input
                type="number"
                min="1"
                value={targetStock}
                onChange={(e) => setTargetStock(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-full font-mono text-center bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-emerald-400 font-bold focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          {/* Unit Price & Supplier */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Unit Price ($ USD) *</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-mono">$</span>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={unitPrice}
                  onChange={(e) => setUnitPrice(Math.max(0.01, parseFloat(e.target.value) || 0))}
                  required
                  className="w-full pl-7 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 font-mono focus:outline-none focus:border-amber-500/60"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">Primary Supplier</label>
              <input
                type="text"
                placeholder="e.g. Parker Hannifin Corp"
                value={supplier}
                onChange={(e) => setSupplier(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-amber-500/60"
              />
            </div>
          </div>

          {/* Location & Compatible Machinery */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Depot Storage Bin / Bay</label>
              <input
                type="text"
                placeholder="e.g. Bay 2 - Rack H-04"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-amber-500/60"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">Compatible Machinery (CSV)</label>
              <input
                type="text"
                placeholder="e.g. CAT 336D, Komatsu PC390"
                value={machineryModels}
                onChange={(e) => setMachineryModels(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-amber-500/60"
              />
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs sm:text-sm font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 px-5 py-2 text-xs sm:text-sm font-bold rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 transition-colors shadow-md shadow-amber-500/20"
            >
              <Plus className="w-4 h-4" />
              <span>Create Part SKU</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
