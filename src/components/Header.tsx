import React, { useState, useEffect } from 'react';
import {
  Wrench,
  Bot,
  Warehouse,
  RotateCcw,
  Plus,
  Download,
  Flame,
  Clock,
  Sparkles,
  ShieldCheck,
  Scan,
  Barcode,
} from 'lucide-react';

interface HeaderProps {
  onOpenAddModal: () => void;
  onOpenScanner: () => void;
  onResetData: () => void;
  onSimulateWear: () => void;
  onExportCsv: () => void;
  onTriggerAudit: () => void;
  isAuditRunning: boolean;
  totalParts: number;
  criticalParts: number;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenAddModal,
  onOpenScanner,
  onResetData,
  onSimulateWear,
  onExportCsv,
  onTriggerAudit,
  isAuditRunning,
  totalParts,
  criticalParts,
}) => {
  const [currentTime, setCurrentTime] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false,
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="border-b border-slate-800 bg-slate-900/90 backdrop-blur-md sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20 gap-4">
          {/* Brand & Depot Info */}
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-amber-500 via-amber-600 to-amber-700 flex items-center justify-center shadow-lg shadow-amber-500/20 ring-2 ring-amber-400/30">
              <Wrench className="w-6 h-6 text-slate-950 font-bold transform -rotate-12" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg sm:text-xl tracking-wider uppercase font-['Chakra_Petch',sans-serif] text-slate-100 flex items-center gap-1.5">
                  ApexGear <span className="text-amber-400">ERP</span>
                </span>
                <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold tracking-wider uppercase bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  Fleet Ops v4.2
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <span className="flex items-center gap-1">
                  <Warehouse className="w-3.5 h-3.5 text-slate-500" />
                  Depot 04 • Heavy Equipment Hub
                </span>
                <span className="hidden md:inline text-slate-600">•</span>
                <span className="hidden md:flex items-center gap-1 font-mono text-[11px] text-slate-400">
                  <Clock className="w-3 h-3 text-slate-500" />
                  {currentTime} UTC
                </span>
              </div>
            </div>
          </div>

          {/* Right Action Bar */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Quick Simulation / Reset helper controls */}
            <div className="hidden lg:flex items-center gap-1.5 bg-slate-950/60 p-1 rounded-lg border border-slate-800">
              <button
                onClick={onSimulateWear}
                title="Simulate job-site usage: decreases stock on key equipment parts to test AI restock thresholds"
                className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-300 hover:text-amber-400 hover:bg-slate-800/80 rounded transition-colors"
              >
                <Flame className="w-3.5 h-3.5 text-amber-500" />
                <span>Simulate Usage</span>
              </button>
              <button
                onClick={onResetData}
                title="Reset inventory table to standard 7 sample heavy machinery parts"
                className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-300 hover:text-slate-100 hover:bg-slate-800/80 rounded transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
                <span>Reset Data</span>
              </button>
              <button
                onClick={onExportCsv}
                title="Export parts list to CSV"
                className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-300 hover:text-slate-100 hover:bg-slate-800/80 rounded transition-colors"
              >
                <Download className="w-3.5 h-3.5 text-slate-400" />
                <span>Export CSV</span>
              </button>
            </div>

            {/* Barcode Scanner Button */}
            <button
              onClick={onOpenScanner}
              title="Open Barcode & QR Scanner (Camera, Bluetooth laser gun, or depot labels)"
              className="flex items-center gap-1.5 px-3 py-2 text-xs sm:text-sm font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 hover:border-amber-500/40 transition-all shadow-sm"
            >
              <Scan className="w-4 h-4 text-amber-400" />
              <span className="hidden md:inline">Scan Barcode</span>
            </button>

            {/* Add Part Button */}
            <button
              onClick={onOpenAddModal}
              className="flex items-center gap-1.5 px-3 py-2 text-xs sm:text-sm font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 hover:border-slate-600 transition-all shadow-sm"
            >
              <Plus className="w-4 h-4 text-amber-400" />
              <span className="hidden sm:inline">Add Part</span>
            </button>

            {/* Run AI Inventory Audit primary button */}
            <button
              onClick={onTriggerAudit}
              disabled={isAuditRunning}
              className="relative group flex items-center gap-2 px-3.5 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-bold rounded-lg bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-300 text-slate-950 transition-all duration-200 shadow-md shadow-amber-500/20 hover:shadow-lg hover:shadow-amber-500/30 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Sparkles className="w-4 h-4 text-slate-950 animate-pulse" />
              <span className="font-['Chakra_Petch',sans-serif] tracking-wide uppercase">
                {isAuditRunning ? 'Auditing Fleet...' : 'Run AI Inventory Audit'}
              </span>
              {criticalParts > 0 && (
                <span className="flex items-center justify-center w-5 h-5 rounded-full bg-rose-600 text-white text-[11px] font-bold shadow">
                  {criticalParts}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
