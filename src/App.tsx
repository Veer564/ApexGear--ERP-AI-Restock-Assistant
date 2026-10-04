/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { InventoryItem, AuditResult, RestockRecommendation } from './types/inventory';
import { INITIAL_INVENTORY_PARTS } from './data/initialParts';
import { Header } from './components/Header';
import { MetricCards } from './components/MetricCards';
import { InventoryTable } from './components/InventoryTable';
import { AiAuditSection } from './components/AiAuditSection';
import { AddPartModal } from './components/AddPartModal';
import { EditPartModal } from './components/EditPartModal';
import { BarcodeScannerModal } from './components/BarcodeScannerModal';
import { ToastProvider, useToast } from './components/Toast';
import { ShieldCheck, HardHat, AlertTriangle, Layers, Sparkles } from 'lucide-react';

const STORAGE_KEY = 'apexgear_erp_inventory_v1';

function AppContent() {
  const { showToast } = useToast();

  // Inventory state with localStorage persistence
  const [parts, setParts] = useState<InventoryItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // ignore
    }
    return INITIAL_INVENTORY_PARTS;
  });

  const [auditResult, setAuditResult] = useState<AuditResult | null>(null);
  const [isAuditLoading, setIsAuditLoading] = useState<boolean>(false);
  const [isAuditOutOfDate, setIsAuditOutOfDate] = useState<boolean>(false);

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [editingPart, setEditingPart] = useState<InventoryItem | null>(null);

  // Sync to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(parts));
    } catch (e) {
      console.error('Failed to persist inventory:', e);
    }
  }, [parts]);

  // Handle stock quantity updates
  const handleUpdateStock = useCallback((id: string, newStock: number) => {
    setParts((prev) =>
      prev.map((p) => {
        if (p.id === id) {
          return { ...p, currentStock: Math.max(0, newStock) };
        }
        return p;
      })
    );
    setIsAuditOutOfDate(true);
  }, []);

  // Handle adding new part
  const handleAddPart = useCallback((newPart: InventoryItem) => {
    setParts((prev) => [newPart, ...prev]);
    setIsAuditOutOfDate(true);
  }, []);

  // Handle editing existing part
  const handleSaveEditedPart = useCallback((updated: InventoryItem) => {
    setParts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
    setIsAuditOutOfDate(true);
  }, []);

  // Handle deleting a part
  const handleDeletePart = useCallback((id: string) => {
    setParts((prev) => prev.filter((p) => p.id !== id));
    setIsAuditOutOfDate(true);
  }, []);

  // Reset to initial mock parts
  const handleResetData = useCallback(() => {
    setParts(INITIAL_INVENTORY_PARTS);
    setAuditResult(null);
    setIsAuditOutOfDate(false);
    showToast('Reset inventory to initial 7 sample heavy machinery parts', 'info');
  }, [showToast]);

  // Simulate heavy job-site wear (decrements stock on key equipment parts)
  const handleSimulateWear = useCallback(() => {
    setParts((prev) =>
      prev.map((p) => {
        // Decrease by 1 or 2 with probability to simulate machinery usage
        if (Math.random() > 0.3) {
          const decrement = Math.random() > 0.5 ? 2 : 1;
          const nextStock = Math.max(0, p.currentStock - decrement);
          return { ...p, currentStock: nextStock };
        }
        return p;
      })
    );
    setIsAuditOutOfDate(true);
    showToast('Simulated fleet usage: heavy components consumed on work sites', 'warning');
  }, [showToast]);

  // Export inventory to CSV
  const handleExportCsv = useCallback(() => {
    const headers = [
      'Part ID',
      'Part Name',
      'Category',
      'Current Stock',
      'Reorder Threshold',
      'Target Stock',
      'Unit Price USD',
      'Total Value USD',
      'Supplier',
      'Location',
      'Lead Time Days',
    ];

    const rows = parts.map((p) => [
      `"${p.id}"`,
      `"${p.name.replace(/"/g, '""')}"`,
      `"${p.category}"`,
      p.currentStock,
      p.reorderThreshold,
      p.targetStock,
      p.unitPrice,
      (p.currentStock * p.unitPrice).toFixed(2),
      `"${p.supplier.replace(/"/g, '""')}"`,
      `"${p.location.replace(/"/g, '""')}"`,
      p.leadTimeDays,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ApexGear-Inventory-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    showToast('Inventory exported to CSV', 'success');
  }, [parts, showToast]);

  // Run AI Inventory Audit
  const handleRunAudit = useCallback(
    async (urgency: 'standard' | 'expedited' = 'standard', notes: string = '') => {
      setIsAuditLoading(true);
      showToast('Initiating AI Inventory Audit with Gemini...', 'info', 2500);

      try {
        const payload = {
          parts,
          urgencyLevel: urgency,
          notes,
        };

        const res = await fetch('/api/inventory/audit', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || `Server responded with status ${res.status}`);
        }

        const data: AuditResult = await res.json();
        setAuditResult(data);
        setIsAuditOutOfDate(false);
        showToast('AI Inventory Audit completed successfully!', 'success');

        // Smooth scroll to results
        setTimeout(() => {
          const el = document.getElementById('ai-audit-section');
          if (el) {
            el.scrollIntoView({ behavior: 'smooth' });
          }
        }, 150);
      } catch (err: any) {
        console.error('Audit execution error:', err);
        showToast(`Audit failed: ${err.message || 'Unknown error'}`, 'error', 4000);
      } finally {
        setIsAuditLoading(false);
      }
    },
    [parts, showToast]
  );

  // Apply single restock recommendation to current inventory
  const handleApplyRestockItem = useCallback(
    (partId: string, qty: number) => {
      setParts((prev) =>
        prev.map((p) => {
          if (p.id === partId) {
            return { ...p, currentStock: p.currentStock + qty };
          }
          return p;
        })
      );
      setIsAuditOutOfDate(true);
    },
    []
  );

  // Apply all restock recommendations
  const handleApplyAllRestocks = useCallback(
    (recommendations: RestockRecommendation[]) => {
      setParts((prev) =>
        prev.map((part) => {
          const rec = recommendations.find((r) => r.partId === part.id);
          if (rec && rec.recommendedOrderQty > 0) {
            return { ...part, currentStock: part.currentStock + rec.recommendedOrderQty };
          }
          return part;
        })
      );
      setIsAuditOutOfDate(true);
    },
    []
  );

  // Calculate critical parts count for header badge
  const criticalCount = parts.filter(
    (p) => p.currentStock <= 0 || p.currentStock <= Math.max(1, Math.floor(p.reorderThreshold * 0.35))
  ).length;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-['Inter',sans-serif]">
      {/* Top Header */}
      <Header
        onOpenAddModal={() => setIsAddModalOpen(true)}
        onOpenScanner={() => setIsScannerOpen(true)}
        onResetData={handleResetData}
        onSimulateWear={handleSimulateWear}
        onExportCsv={handleExportCsv}
        onTriggerAudit={() => handleRunAudit('standard')}
        isAuditRunning={isAuditLoading}
        totalParts={parts.length}
        criticalParts={criticalCount}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
        {/* Metric Cards Top Overview */}
        <MetricCards parts={parts} />

        {/* Heavy Equipment Spare Parts Inventory Table */}
        <InventoryTable
          parts={parts}
          onUpdateStock={handleUpdateStock}
          onEditPart={(p) => setEditingPart(p)}
          onDeletePart={handleDeletePart}
          onOpenAddModal={() => setIsAddModalOpen(true)}
          onOpenScanner={() => setIsScannerOpen(true)}
          isAuditOutOfDate={isAuditOutOfDate && auditResult !== null}
        />

        {/* AI Restock Audit Section */}
        <AiAuditSection
          auditResult={auditResult}
          isLoading={isAuditLoading}
          onRunAudit={handleRunAudit}
          onApplyRestockItem={handleApplyRestockItem}
          onApplyAllRestocks={handleApplyAllRestocks}
          isOutOfDate={isAuditOutOfDate}
        />
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-6 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-bold uppercase tracking-wider text-slate-400 font-['Chakra_Petch',sans-serif]">
              ApexGear Fleet ERP
            </span>
            <span>•</span>
            <span>Depot #04 Maintenance & Materials Logistics</span>
          </div>
          <div className="flex items-center gap-4 text-[11px]">
            <span>Model: Gemini 3.8 Flash</span>
            <span>•</span>
            <span>Zero-Downtime Supply Chain Intelligence</span>
          </div>
        </div>
      </footer>

      {/* Barcode & QR Scanner Modal */}
      <BarcodeScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        parts={parts}
        onUpdateStock={handleUpdateStock}
        onOpenAudit={() => handleRunAudit('standard')}
      />

      {/* Add Part Modal */}
      <AddPartModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAddPart={handleAddPart}
        existingIds={parts.map((p) => p.id)}
      />

      {/* Edit Part Modal */}
      <EditPartModal
        part={editingPart}
        isOpen={editingPart !== null}
        onClose={() => setEditingPart(null)}
        onSave={handleSaveEditedPart}
      />
    </div>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <AppContent />
    </ToastProvider>
  );
}
