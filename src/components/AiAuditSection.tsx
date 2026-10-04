import React, { useState } from 'react';
import {
  AuditResult,
  InventoryItem,
  RestockRecommendation,
} from '../types/inventory';
import {
  Sparkles,
  Bot,
  AlertOctagon,
  Clock,
  DollarSign,
  Copy,
  Check,
  Download,
  Mail,
  RotateCcw,
  PackageCheck,
  ShieldAlert,
  ArrowRight,
  TrendingUp,
  FileText,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  RefreshCw,
} from 'lucide-react';
import { useToast } from './Toast';

interface AiAuditSectionProps {
  auditResult: AuditResult | null;
  isLoading: boolean;
  onRunAudit: (urgency: 'standard' | 'expedited', notes?: string) => void;
  onApplyRestockItem: (partId: string, qty: number) => void;
  onApplyAllRestocks: (recommendations: RestockRecommendation[]) => void;
  isOutOfDate: boolean;
}

export const AiAuditSection: React.FC<AiAuditSectionProps> = ({
  auditResult,
  isLoading,
  onRunAudit,
  onApplyRestockItem,
  onApplyAllRestocks,
  isOutOfDate,
}) => {
  const { showToast } = useToast();
  const [urgencyMode, setUrgencyMode] = useState<'standard' | 'expedited'>('standard');
  const [customNotes, setCustomNotes] = useState('');
  const [showNotesInput, setShowNotesInput] = useState(false);
  const [copiedEmail, setCopiedEmail] = useState(false);

  // Editable email state
  const [editableSubject, setEditableSubject] = useState('');
  const [editableTo, setEditableTo] = useState('');
  const [editableBody, setEditableBody] = useState('');
  const [isEditingEmail, setIsEditingEmail] = useState(false);

  // Synchronize email state when audit result changes
  React.useEffect(() => {
    if (auditResult?.purchaseOrderEmail) {
      setEditableSubject(auditResult.purchaseOrderEmail.subject);
      setEditableTo(auditResult.purchaseOrderEmail.to);
      setEditableBody(auditResult.purchaseOrderEmail.emailBody);
      setIsEditingEmail(false);
    }
  }, [auditResult]);

  const handleCopyEmail = () => {
    if (!editableBody) return;
    const fullContent = `TO: ${editableTo}\nSUBJECT: ${editableSubject}\n\n${editableBody}`;
    navigator.clipboard.writeText(fullContent);
    setCopiedEmail(true);
    showToast('Purchase Order email copied to clipboard!', 'success');
    setTimeout(() => setCopiedEmail(false), 2000);
  };

  const handleDownloadTxt = () => {
    if (!editableBody) return;
    const fullContent = `TO: ${editableTo}\nSUBJECT: ${editableSubject}\n\n${editableBody}`;
    const blob = new Blob([fullContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${auditResult?.purchaseOrderEmail.poNumber || 'Purchase-Order'}.txt`;
    link.click();
    URL.revokeObjectURL(url);
    showToast('Downloaded Purchase Order as .txt', 'info');
  };

  const handleOpenMailClient = () => {
    if (!editableBody) return;
    const subjectEncoded = encodeURIComponent(editableSubject);
    const bodyEncoded = encodeURIComponent(editableBody);
    const mailto = `mailto:${encodeURIComponent(editableTo)}?subject=${subjectEncoded}&body=${bodyEncoded}`;
    window.open(mailto, '_blank');
  };

  const handleResetEmail = () => {
    if (auditResult?.purchaseOrderEmail) {
      setEditableSubject(auditResult.purchaseOrderEmail.subject);
      setEditableTo(auditResult.purchaseOrderEmail.to);
      setEditableBody(auditResult.purchaseOrderEmail.emailBody);
      showToast('Reset email to original AI draft', 'info');
    }
  };

  return (
    <section id="ai-audit-section" className="scroll-mt-24 space-y-6">
      {/* AI Auditor Action Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900 to-amber-950/40 border border-amber-500/30 p-6 sm:p-8 shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="max-w-2xl">
            <div className="flex items-center gap-2.5 mb-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                Gemini 3.8 Flash Supply Chain Engine
              </span>
              <span className="text-xs text-slate-400 font-mono hidden sm:inline">
                • Real-time Restock Model
              </span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-bold font-['Chakra_Petch',sans-serif] tracking-wide text-slate-100 uppercase">
              AI Inventory & Restock Audit Assistant
            </h2>

            <p className="text-sm text-slate-300 mt-2 leading-relaxed">
              Deep scans current heavy machinery stock against reorder thresholds, models fleet downtime
              probabilities, recommends prioritized replenishments, and auto-generates OEM supplier purchase orders.
            </p>

            {/* Custom Notes Toggle */}
            <div className="mt-3 flex items-center gap-4 text-xs">
              <button
                type="button"
                onClick={() => setShowNotesInput(!showNotesInput)}
                className="text-amber-400 hover:text-amber-300 flex items-center gap-1 font-medium transition-colors"
              >
                {showNotesInput ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                {showNotesInput ? 'Hide Auditor Notes' : '+ Add Fleet Maintenance Notes (Optional)'}
              </button>

              {auditResult && isOutOfDate && (
                <span className="flex items-center gap-1 text-amber-400 font-medium">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  Stock updated since last audit — run again for fresh requisition
                </span>
              )}
            </div>

            {showNotesInput && (
              <div className="mt-3 animate-in fade-in duration-200">
                <input
                  type="text"
                  placeholder="e.g., Major overhaul planned for CAT 336 Excavator next Monday; prefer Parker OEM seals."
                  value={customNotes}
                  onChange={(e) => setCustomNotes(e.target.value)}
                  className="w-full bg-slate-950/90 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500"
                />
              </div>
            )}
          </div>

          {/* Right Action: Urgency Mode + Big Button */}
          <div className="flex flex-col sm:flex-row lg:flex-col items-stretch sm:items-center lg:items-end gap-3 shrink-0">
            {/* Urgency Mode Selector */}
            <div className="flex items-center bg-slate-950/80 p-1 rounded-xl border border-slate-800 self-start sm:self-auto">
              <button
                type="button"
                onClick={() => setUrgencyMode('standard')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  urgencyMode === 'standard'
                    ? 'bg-slate-800 text-slate-100 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Standard Freight
              </button>
              <button
                type="button"
                onClick={() => setUrgencyMode('expedited')}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  urgencyMode === 'expedited'
                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                    : 'text-slate-400 hover:text-rose-300'
                }`}
              >
                <span>Expedited AOG</span>
              </button>
            </div>

            {/* Run Audit Button */}
            <button
              onClick={() => onRunAudit(urgencyMode, customNotes)}
              disabled={isLoading}
              className="relative group flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-xl font-bold font-['Chakra_Petch',sans-serif] uppercase tracking-wider text-slate-950 bg-gradient-to-r from-amber-400 via-amber-300 to-amber-400 hover:from-amber-300 hover:to-amber-200 transition-all shadow-xl shadow-amber-500/25 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Sparkles className={`w-5 h-5 text-slate-950 ${isLoading ? 'animate-spin' : 'animate-pulse'}`} />
              <span className="text-base sm:text-lg">
                {isLoading ? 'Analyzing Inventory...' : 'Run AI Inventory Audit'}
              </span>
            </button>
          </div>
        </div>

        {/* Loading Progress State */}
        {isLoading && (
          <div className="mt-6 pt-6 border-t border-amber-500/20 animate-in fade-in duration-300">
            <div className="flex items-center justify-between text-xs font-mono text-amber-300 mb-2">
              <span className="flex items-center gap-2">
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                Gemini 3.8 Flash Supply Chain Intelligence in progress...
              </span>
              <span>Processing SKU Matrix</span>
            </div>
            <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-amber-500/30">
              <div className="bg-gradient-to-r from-amber-500 via-amber-300 to-amber-500 h-full w-2/3 rounded-full animate-pulse transition-all"></div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-3 text-[11px] text-slate-400 font-mono">
              <span className="flex items-center gap-1 text-amber-400">✓ Auditing stock buffers</span>
              <span className="flex items-center gap-1 text-amber-400">✓ Flagging critical deficits</span>
              <span className="flex items-center gap-1 text-amber-300 animate-pulse">⏳ Sizing reorders</span>
              <span className="flex items-center gap-1 text-slate-500">○ Formulating PO requisition</span>
            </div>
          </div>
        )}
      </div>

      {/* Audit Results View */}
      {auditResult && !isLoading && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-3 duration-300">
          {/* Audit Header Banner */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-slate-900/80 border border-slate-800 rounded-xl">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-slate-100">
                    Latest AI Inventory Audit Completed
                  </span>
                  <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                    Verified
                  </span>
                </div>
                <span className="text-xs text-slate-400 font-mono">
                  Executed at {new Date(auditResult.auditTimestamp).toLocaleTimeString()} • Engine:{' '}
                  {auditResult.aiEngineUsed || 'Gemini 3.8 Flash'}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {auditResult.warning && (
                <span className="text-xs text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded border border-amber-500/20">
                  {auditResult.warning}
                </span>
              )}
              <button
                onClick={() => onRunAudit(urgencyMode, customNotes)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5 text-amber-400" />
                <span>Re-Run Audit</span>
              </button>
            </div>
          </div>

          {/* Metric Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {/* Total Items Scanned */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 sm:p-5 flex flex-col justify-between">
              <div className="flex items-center justify-between text-slate-400 mb-1">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Total Items Scanned
                </span>
                <span className="text-xs font-mono text-slate-500">100% SKU Coverage</span>
              </div>
              <div className="flex items-baseline justify-between mt-2">
                <span className="text-3xl font-bold font-mono text-slate-100">
                  {auditResult.totalItemsScanned}
                </span>
                <span className="text-xs text-slate-400 font-mono">
                  {auditResult.healthyItemsCount} healthy
                </span>
              </div>
              <div className="w-full bg-slate-800 h-1.5 rounded-full mt-3 overflow-hidden">
                <div className="bg-emerald-500 h-full rounded-full" style={{ width: '100%' }}></div>
              </div>
            </div>

            {/* Critical Items Flagged */}
            <div
              className={`rounded-xl p-4 sm:p-5 flex flex-col justify-between border ${
                auditResult.criticalItemsCount > 0
                  ? 'bg-rose-950/20 border-rose-500/50 shadow-lg shadow-rose-950/20'
                  : 'bg-slate-900 border-slate-800'
              }`}
            >
              <div className="flex items-center justify-between text-slate-400 mb-1">
                <span className="text-xs font-semibold uppercase tracking-wider text-rose-300">
                  Critical Items Flagged
                </span>
                <AlertOctagon
                  className={`w-4 h-4 ${
                    auditResult.criticalItemsCount > 0 ? 'text-rose-400 animate-pulse' : 'text-slate-500'
                  }`}
                />
              </div>
              <div className="flex items-baseline justify-between mt-2">
                <span
                  className={`text-3xl font-bold font-mono ${
                    auditResult.criticalItemsCount > 0 ? 'text-rose-400' : 'text-slate-100'
                  }`}
                >
                  {auditResult.criticalItemsCount}
                </span>
                <span className="text-xs text-amber-400 font-mono">
                  +{auditResult.lowStockItemsCount} low stock
                </span>
              </div>
              <div className="w-full bg-slate-800 h-1.5 rounded-full mt-3 overflow-hidden">
                <div
                  className="bg-rose-500 h-full rounded-full"
                  style={{
                    width: `${Math.min(
                      100,
                      (auditResult.criticalItemsCount / Math.max(1, auditResult.totalItemsScanned)) * 100
                    )}%`,
                  }}
                ></div>
              </div>
            </div>

            {/* Total Estimated Restock Cost */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 sm:p-5 flex flex-col justify-between">
              <div className="flex items-center justify-between text-slate-400 mb-1">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Total Restock Outlay
                </span>
                <DollarSign className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="flex items-baseline justify-between mt-2">
                <span className="text-2xl sm:text-3xl font-bold font-mono text-emerald-400">
                  ${auditResult.estimatedTotalRestockCost.toLocaleString(undefined, {
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0,
                  })}
                </span>
                <span className="text-xs text-slate-400 font-mono">USD</span>
              </div>
              <div className="w-full bg-slate-800 h-1.5 rounded-full mt-3 overflow-hidden">
                <div className="bg-emerald-500 h-full rounded-full" style={{ width: '100%' }}></div>
              </div>
            </div>

            {/* Overall Fleet Risk Level */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 sm:p-5 flex flex-col justify-between">
              <div className="flex items-center justify-between text-slate-400 mb-1">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Fleet Downtime Exposure
                </span>
                <ShieldAlert className="w-4 h-4 text-amber-400" />
              </div>
              <div className="flex items-baseline justify-between mt-2">
                <span
                  className={`text-xl sm:text-2xl font-bold font-['Chakra_Petch',sans-serif] tracking-wider ${
                    auditResult.overallRiskLevel === 'CRITICAL'
                      ? 'text-rose-400'
                      : auditResult.overallRiskLevel === 'ELEVATED'
                      ? 'text-amber-400'
                      : 'text-emerald-400'
                  }`}
                >
                  {auditResult.overallRiskLevel}
                </span>
                <span className="text-xs text-slate-400">Downtime Index</span>
              </div>
              <div className="w-full bg-slate-800 h-1.5 rounded-full mt-3 overflow-hidden">
                <div
                  className={`h-full rounded-full ${
                    auditResult.overallRiskLevel === 'CRITICAL'
                      ? 'bg-rose-500 w-full'
                      : auditResult.overallRiskLevel === 'ELEVATED'
                      ? 'bg-amber-400 w-3/4'
                      : 'bg-emerald-400 w-1/4'
                  }`}
                ></div>
              </div>
            </div>
          </div>

          {/* AI Executive Summary & Insights Box */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 sm:p-6 space-y-4">
            <div className="flex items-center gap-2">
              <Bot className="w-5 h-5 text-amber-400" />
              <h3 className="font-bold text-base sm:text-lg font-['Chakra_Petch',sans-serif] uppercase tracking-wide text-slate-100">
                Auditor Executive Brief & Fleet Risk Intelligence
              </h3>
            </div>

            <p className="text-sm text-slate-200 leading-relaxed bg-slate-950/60 p-4 rounded-xl border border-slate-800/80">
              {auditResult.executiveSummary}
            </p>

            {/* Key Insights List */}
            {auditResult.keyInsights && auditResult.keyInsights.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                {auditResult.keyInsights.map((insight, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-2.5 p-3 rounded-lg bg-slate-950/40 border border-slate-800/60 text-xs text-slate-300"
                  >
                    <span className="w-5 h-5 rounded-full bg-amber-500/10 text-amber-400 flex items-center justify-center shrink-0 font-mono text-[11px] font-bold">
                      {idx + 1}
                    </span>
                    <span className="leading-snug">{insight}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Actionable Restock Table */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="p-4 sm:p-6 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold font-['Chakra_Petch',sans-serif] uppercase tracking-wide text-slate-100">
                    Actionable Restock Recommendations
                  </h3>
                  <span className="text-xs font-mono font-semibold bg-amber-500/10 text-amber-400 px-2 py-0.5 rounded border border-amber-500/20">
                    {auditResult.recommendations.length} Action Items
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  AI-calculated reorder quantities based on buffer depletion, lead times, and operational risk
                </p>
              </div>

              {auditResult.recommendations.length > 0 && (
                <button
                  onClick={() => {
                    onApplyAllRestocks(auditResult.recommendations);
                    showToast(
                      `Applied all ${auditResult.recommendations.length} restock recommendations to inventory!`,
                      'success'
                    );
                  }}
                  className="flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-bold rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 transition-colors shadow-md shadow-emerald-500/20"
                >
                  <PackageCheck className="w-4 h-4" />
                  <span>Receive All to Target</span>
                </button>
              )}
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm text-slate-300 border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-950/50 text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-slate-400">
                    <th className="py-3 px-4">Priority</th>
                    <th className="py-3 px-4">Part Identifier & Specs</th>
                    <th className="py-3 px-4 text-center">Stock Buffer</th>
                    <th className="py-3 px-4 text-center">Recommended Order</th>
                    <th className="py-3 px-4 text-right">Est. Cost</th>
                    <th className="py-3 px-4">Operational Risk / Justification</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {auditResult.recommendations.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-400">
                        <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
                        <p className="font-semibold text-slate-200">No Restock Actions Required</p>
                        <p className="text-xs text-slate-500">All heavy machinery components are currently above safety thresholds.</p>
                      </td>
                    </tr>
                  ) : (
                    auditResult.recommendations.map((rec) => {
                      const isCritical = rec.priority === 'CRITICAL';
                      const isHigh = rec.priority === 'HIGH';

                      return (
                        <tr
                          key={rec.partId}
                          className={`hover:bg-slate-800/40 transition-colors ${
                            isCritical ? 'bg-rose-950/10' : isHigh ? 'bg-amber-950/5' : ''
                          }`}
                        >
                          {/* Priority Badge */}
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            {isCritical && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-rose-500/20 text-rose-300 border border-rose-500/30">
                                <AlertOctagon className="w-3 h-3 text-rose-400 animate-pulse" />
                                Critical
                              </span>
                            )}
                            {isHigh && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30">
                                High
                              </span>
                            )}
                            {rec.priority === 'MEDIUM' && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-blue-500/20 text-blue-300 border border-blue-500/30">
                                Medium
                              </span>
                            )}
                            {rec.priority === 'LOW' && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-slate-800 text-slate-300 border border-slate-700">
                                Low
                              </span>
                            )}
                          </td>

                          {/* Part Details */}
                          <td className="py-3.5 px-4">
                            <div className="flex flex-col">
                              <span className="font-semibold text-slate-100">{rec.partName}</span>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className="font-mono text-xs text-amber-400 font-semibold">{rec.partId}</span>
                                <span className="text-slate-500 text-xs">• {rec.supplier}</span>
                              </div>
                            </div>
                          </td>

                          {/* Stock Buffer (Current vs Target) */}
                          <td className="py-3.5 px-4 text-center whitespace-nowrap">
                            <div className="font-mono text-xs">
                              <span className={isCritical ? 'text-rose-400 font-bold' : 'text-slate-300'}>
                                {rec.currentStock}
                              </span>
                              <span className="text-slate-500"> / </span>
                              <span className="text-emerald-400">{rec.targetStock} target</span>
                            </div>
                          </td>

                          {/* Recommended Order Qty */}
                          <td className="py-3.5 px-4 text-center whitespace-nowrap">
                            <span className="font-mono text-base font-bold text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded border border-amber-500/20">
                              +{rec.recommendedOrderQty} units
                            </span>
                          </td>

                          {/* Estimated Cost */}
                          <td className="py-3.5 px-4 text-right whitespace-nowrap font-mono">
                            <span className="font-bold text-slate-200">
                              ${rec.estimatedCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                          </td>

                          {/* Reason */}
                          <td className="py-3.5 px-4 max-w-xs text-xs text-slate-300 leading-snug">
                            <p>{rec.reason}</p>
                            {rec.leadTimeRisk && (
                              <span className="text-[11px] text-amber-400 font-mono block mt-0.5">
                                Lead Time: {rec.leadTimeRisk}
                              </span>
                            )}
                          </td>

                          {/* Action Button: Apply Restock */}
                          <td className="py-3.5 px-4 text-right whitespace-nowrap">
                            <button
                              onClick={() => {
                                onApplyRestockItem(rec.partId, rec.recommendedOrderQty);
                                showToast(`Restocked ${rec.recommendedOrderQty} units of ${rec.partId}`, 'success');
                              }}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-emerald-500/20 text-slate-200 hover:text-emerald-300 border border-slate-700 hover:border-emerald-500/40 transition-colors"
                            >
                              <PackageCheck className="w-3.5 h-3.5 text-emerald-400" />
                              <span>Apply to Stock</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Editable Supplier Purchase Order Email Card */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
              <div>
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-amber-400" />
                  <h3 className="text-lg font-bold font-['Chakra_Petch',sans-serif] uppercase tracking-wide text-slate-100">
                    Pre-Drafted Supplier Purchase Order Requisition
                  </h3>
                  <span className="font-mono text-xs font-bold bg-slate-800 text-amber-400 px-2 py-0.5 rounded border border-slate-700">
                    {auditResult.purchaseOrderEmail.poNumber}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  AI-generated, fully editable purchase order email ready for immediate supplier dispatch
                </p>
              </div>

              {/* Action Buttons: Copy, Download, Mailto, Reset */}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={handleResetEmail}
                  title="Reset to original AI generation"
                  className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 border border-slate-700 transition-colors"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
                <button
                  onClick={handleDownloadTxt}
                  title="Download PO as text file"
                  className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download .txt</span>
                </button>
                <button
                  onClick={handleOpenMailClient}
                  title="Open in your default mail app"
                  className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
                >
                  <Mail className="w-3.5 h-3.5 text-amber-400" />
                  <span>Open Email Client</span>
                </button>
                <button
                  onClick={handleCopyEmail}
                  className="flex items-center gap-1.5 px-4 py-2 text-xs sm:text-sm font-bold rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 transition-colors shadow-md shadow-amber-500/20"
                >
                  {copiedEmail ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  <span>{copiedEmail ? 'Copied to Clipboard!' : 'Copy PO Email'}</span>
                </button>
              </div>
            </div>

            {/* Email Metadata Fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block text-slate-400 font-semibold mb-1">To (Supplier Requisition Desk):</label>
                <input
                  type="text"
                  value={editableTo}
                  onChange={(e) => setEditableTo(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 font-mono focus:outline-none focus:border-amber-500/60"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Subject Line:</label>
                <input
                  type="text"
                  value={editableSubject}
                  onChange={(e) => setEditableSubject(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 font-semibold focus:outline-none focus:border-amber-500/60"
                />
              </div>
            </div>

            {/* Editable Text Card for Email Body */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-400">
                  Purchase Order Message Body (Directly Editable):
                </label>
                <span className="text-[11px] text-slate-500 font-mono">
                  {editableBody.split('\n').length} lines • Markdown / Monospace
                </span>
              </div>
              <textarea
                value={editableBody}
                onChange={(e) => setEditableBody(e.target.value)}
                rows={14}
                className="w-full font-mono text-xs sm:text-sm bg-slate-950 border border-slate-800 rounded-xl p-4 text-slate-200 leading-relaxed focus:outline-none focus:border-amber-500/60 focus:ring-1 focus:ring-amber-500/30 selection:bg-amber-500 selection:text-slate-950 resize-y"
              />
            </div>
          </div>
        </div>
      )}

      {/* Empty State before first audit is run */}
      {!auditResult && !isLoading && (
        <div className="p-8 sm:p-12 rounded-2xl bg-slate-900/60 border border-dashed border-slate-800 text-center flex flex-col items-center justify-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
            <Bot className="w-8 h-8" />
          </div>
          <div className="max-w-md">
            <h3 className="text-lg font-bold font-['Chakra_Petch',sans-serif] uppercase tracking-wide text-slate-100">
              No Audit Executed Yet
            </h3>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Click the <span className="text-amber-400 font-semibold">"Run AI Inventory Audit"</span> button above to
              send your spare parts data to Gemini for automated restock analysis and purchase order generation.
            </p>
          </div>
          <button
            onClick={() => onRunAudit(urgencyMode, customNotes)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 transition-colors shadow-lg shadow-amber-500/20"
          >
            <Sparkles className="w-4 h-4" />
            <span>Start First Audit</span>
          </button>
        </div>
      )}
    </section>
  );
};
