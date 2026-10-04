import React, { useState, useEffect } from 'react';
import { InventoryItem, PartCategory } from '../types/inventory';
import { X, Save, AlertTriangle } from 'lucide-react';
import { useToast } from './Toast';

interface EditPartModalProps {
  part: InventoryItem | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedPart: InventoryItem) => void;
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

export const EditPartModal: React.FC<EditPartModalProps> = ({
  part,
  isOpen,
  onClose,
  onSave,
}) => {
  const { showToast } = useToast();
  const [formData, setFormData] = useState<InventoryItem | null>(null);
  const [machineryStr, setMachineryStr] = useState('');

  useEffect(() => {
    if (part) {
      setFormData({ ...part });
      setMachineryStr(part.machineryModels?.join(', ') || '');
    }
  }, [part]);

  if (!isOpen || !formData) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      showToast('Part name cannot be empty', 'warning');
      return;
    }
    if (formData.targetStock < formData.reorderThreshold) {
      showToast('Target stock must be greater than or equal to reorder threshold', 'warning');
      return;
    }

    const updated: InventoryItem = {
      ...formData,
      machineryModels: machineryStr
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
    };

    onSave(updated);
    showToast(`Updated specs for ${formData.id}`, 'success');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-xl w-full p-6 shadow-2xl relative">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                {formData.id}
              </span>
              <h3 className="text-lg font-bold font-['Chakra_Petch',sans-serif] uppercase tracking-wide text-slate-100">
                Edit Part Specifications
              </h3>
            </div>
            <p className="text-xs text-slate-400 mt-1">Adjust stock levels, triggers, or supplier terms</p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4 text-xs sm:text-sm">
          <div>
            <label className="block font-semibold text-slate-300 mb-1">Part Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-amber-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Category</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value as PartCategory })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-amber-500 cursor-pointer"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">Unit Price ($ USD)</label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                value={formData.unitPrice}
                onChange={(e) => setFormData({ ...formData, unitPrice: parseFloat(e.target.value) || 0 })}
                required
                className="w-full font-mono bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          {/* Stock Quantities */}
          <div className="grid grid-cols-3 gap-3 bg-slate-950/70 p-3.5 rounded-xl border border-slate-800">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Current Stock</label>
              <input
                type="number"
                min="0"
                value={formData.currentStock}
                onChange={(e) =>
                  setFormData({ ...formData, currentStock: Math.max(0, parseInt(e.target.value) || 0) })
                }
                className="w-full font-mono text-center bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-slate-100 font-bold focus:outline-none focus:border-amber-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Reorder Threshold</label>
              <input
                type="number"
                min="1"
                value={formData.reorderThreshold}
                onChange={(e) =>
                  setFormData({ ...formData, reorderThreshold: Math.max(1, parseInt(e.target.value) || 1) })
                }
                className="w-full font-mono text-center bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-amber-400 font-bold focus:outline-none focus:border-amber-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Target Stock</label>
              <input
                type="number"
                min="1"
                value={formData.targetStock}
                onChange={(e) =>
                  setFormData({ ...formData, targetStock: Math.max(1, parseInt(e.target.value) || 1) })
                }
                className="w-full font-mono text-center bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-emerald-400 font-bold focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Primary Supplier</label>
              <input
                type="text"
                value={formData.supplier}
                onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">Warehouse Bin / Location</label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-300 mb-1">Compatible Machinery Models</label>
            <input
              type="text"
              value={machineryStr}
              onChange={(e) => setMachineryStr(e.target.value)}
              placeholder="e.g. CAT 336D, Komatsu PC390"
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-amber-500"
            />
          </div>

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
              <Save className="w-4 h-4" />
              <span>Save Changes</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
