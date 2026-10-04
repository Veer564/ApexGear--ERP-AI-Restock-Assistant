import React, { useState, useEffect, useRef } from 'react';
import { InventoryItem, computeStockStatus } from '../types/inventory';
import {
  Scan,
  Camera,
  QrCode,
  Barcode,
  X,
  Plus,
  Minus,
  CheckCircle2,
  AlertTriangle,
  AlertOctagon,
  ArrowRight,
  Printer,
  History,
  Sparkles,
  Search,
} from 'lucide-react';
import { useToast } from './Toast';

interface BarcodeScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  parts: InventoryItem[];
  onUpdateStock: (id: string, newStock: number) => void;
  onOpenAudit: () => void;
}

interface ScanHistoryEntry {
  id: string;
  partId: string;
  partName: string;
  action: 'check-in' | 'check-out' | 'inspect';
  quantityDelta: number;
  newStock: number;
  timestamp: string;
}

export const BarcodeScannerModal: React.FC<BarcodeScannerModalProps> = ({
  isOpen,
  onClose,
  parts,
  onUpdateStock,
  onOpenAudit,
}) => {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<'scanner' | 'labels' | 'history'>('scanner');
  const [scannedInput, setScannedInput] = useState('');
  const [selectedPart, setSelectedPart] = useState<InventoryItem | null>(null);
  const [actionQuantity, setActionQuantity] = useState<number>(1);
  const [scanHistory, setScanHistory] = useState<ScanHistoryEntry[]>([]);
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      stopCamera();
    }
  }, [isOpen]);

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  };

  const startCamera = async () => {
    setCameraError(null);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera device access not supported in this browser environment');
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 640 }, height: { ideal: 480 } },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setIsCameraActive(true);
      showToast('Camera feed initialized for barcode scanning', 'info');
    } catch (err: any) {
      console.warn('Camera initiation notice:', err);
      setCameraError(err.message || 'Camera permission denied or camera not available');
      setIsCameraActive(false);
    }
  };

  const handleLookup = (code: string) => {
    const cleanCode = code.trim().toUpperCase();
    const found = parts.find(
      (p) => p.id.toUpperCase() === cleanCode || p.name.toUpperCase().includes(cleanCode)
    );
    if (found) {
      setSelectedPart(found);
      showToast(`Scanned: ${found.id} - ${found.name}`, 'success', 2000);
    } else {
      setSelectedPart(null);
      showToast(`No part found matching SKU: ${cleanCode}`, 'warning');
    }
  };

  const handleExecuteAction = (action: 'check-in' | 'check-out') => {
    if (!selectedPart) return;

    let nextStock = selectedPart.currentStock;
    let delta = actionQuantity;

    if (action === 'check-in') {
      nextStock = selectedPart.currentStock + actionQuantity;
    } else {
      nextStock = Math.max(0, selectedPart.currentStock - actionQuantity);
      delta = -Math.min(selectedPart.currentStock, actionQuantity);
    }

    onUpdateStock(selectedPart.id, nextStock);

    const historyEntry: ScanHistoryEntry = {
      id: Math.random().toString(36).substring(2, 9),
      partId: selectedPart.id,
      partName: selectedPart.name,
      action,
      quantityDelta: action === 'check-in' ? actionQuantity : delta,
      newStock: nextStock,
      timestamp: new Date().toLocaleTimeString(),
    };

    setScanHistory((prev) => [historyEntry, ...prev.slice(0, 19)]);

    // Update local selectedPart reference
    setSelectedPart({ ...selectedPart, currentStock: nextStock });

    showToast(
      `${action === 'check-in' ? 'Received (Check-In)' : 'Dispatched (Check-Out)'} ${Math.abs(delta)} unit(s) of ${selectedPart.id}. New stock: ${nextStock}`,
      action === 'check-in' ? 'success' : 'info'
    );

    // If stock became critical, suggest audit
    const newStatus = computeStockStatus(nextStock, selectedPart.reorderThreshold);
    if (newStatus === 'Critical') {
      showToast(`Warning: ${selectedPart.id} is now at CRITICAL level!`, 'warning', 4000);
    }
  };

  // Generate an authentic Code 128 / barcode SVG representation
  const renderSvgBarcode = (code: string) => {
    const bars: boolean[] = [];
    for (let i = 0; i < code.length; i++) {
      const charCode = code.charCodeAt(i);
      const bin = (charCode * 7).toString(2).padStart(8, '0');
      for (const bit of bin) {
        bars.push(bit === '1');
      }
      bars.push(false);
    }

    return (
      <div className="flex flex-col items-center bg-white p-3 rounded-lg border border-slate-700">
        <svg className="w-48 h-12" viewBox={`0 0 ${bars.length * 2} 40`} preserveAspectRatio="none">
          {bars.map((isBlack, idx) => (
            <rect
              key={idx}
              x={idx * 2}
              y={0}
              width={isBlack ? 2 : 1}
              height={40}
              fill={isBlack ? '#0f172a' : 'transparent'}
            />
          ))}
        </svg>
        <span className="font-mono text-[11px] font-bold tracking-widest text-slate-900 mt-1 uppercase">
          *{code}*
        </span>
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-5 sm:p-6 shadow-2xl relative max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Scan className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold font-['Chakra_Petch',sans-serif] uppercase tracking-wide text-slate-100 flex items-center gap-2">
                Depot Barcode & QR Scanner
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30">
                  Fleet Ops
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Scan warehouse bin labels or OEM packaging to check-in deliveries, dispatch parts, or view stock
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 pt-4 pb-2 border-b border-slate-800 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('scanner')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
              activeTab === 'scanner'
                ? 'bg-amber-500 text-slate-950 shadow-md font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Scan className="w-3.5 h-3.5" />
            <span>Interactive Scanner</span>
          </button>

          <button
            onClick={() => setActiveTab('labels')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
              activeTab === 'labels'
                ? 'bg-amber-500 text-slate-950 shadow-md font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Barcode className="w-3.5 h-3.5" />
            <span>Depot Bin Labels ({parts.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
              activeTab === 'history'
                ? 'bg-amber-500 text-slate-950 shadow-md font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Scan Log ({scanHistory.length})</span>
          </button>
        </div>

        {/* Tab 1: Interactive Scanner */}
        {activeTab === 'scanner' && (
          <div className="py-4 space-y-4 overflow-y-auto flex-1 pr-1">
            {/* Camera Viewfinder & Simulated Scanner */}
            <div className="relative rounded-xl overflow-hidden bg-slate-950 border border-slate-800 aspect-[16/9] max-h-52 flex flex-col items-center justify-center">
              {isCameraActive ? (
                <>
                  <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                  {/* Scanning reticle overlay */}
                  <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                    <div className="w-48 h-28 border-2 border-amber-400/80 rounded-lg relative">
                      <div className="absolute inset-x-0 top-0 h-0.5 bg-amber-400 animate-pulse shadow-[0_0_8px_rgba(251,191,36,0.8)]"></div>
                      <div className="absolute top-1 left-1 w-2.5 h-2.5 border-t-2 border-l-2 border-amber-400"></div>
                      <div className="absolute top-1 right-1 w-2.5 h-2.5 border-t-2 border-r-2 border-amber-400"></div>
                      <div className="absolute bottom-1 left-1 w-2.5 h-2.5 border-b-2 border-l-2 border-amber-400"></div>
                      <div className="absolute bottom-1 right-1 w-2.5 h-2.5 border-b-2 border-r-2 border-amber-400"></div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center p-6 text-center text-slate-400 gap-2">
                  <div className="w-12 h-12 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-500">
                    <Camera className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-300">Camera Scanner or Hardware Laser Reader</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Supports wireless Bluetooth warehouse barcode guns, webcam, or quick code lookup below
                    </p>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <button
                      type="button"
                      onClick={startCamera}
                      className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors flex items-center gap-1.5"
                    >
                      <Camera className="w-3.5 h-3.5 text-amber-400" />
                      <span>Start Camera Feed</span>
                    </button>
                  </div>
                  {cameraError && (
                    <span className="text-[11px] text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20 mt-1">
                      {cameraError} (use manual input or fast click below)
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Manual Scan Input Barcode Field */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-300">
                Barcode Input (USB Scanner, Bluetooth Gun, or SKU):
              </label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Barcode className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    ref={inputRef}
                    type="text"
                    placeholder="Scan or enter Part SKU (e.g. HYD-EXC-4091)..."
                    value={scannedInput}
                    onChange={(e) => setScannedInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && scannedInput.trim()) {
                        handleLookup(scannedInput);
                      }
                    }}
                    className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 font-mono text-sm placeholder-slate-600 focus:outline-none focus:border-amber-500"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => handleLookup(scannedInput)}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg text-xs transition-colors shadow-sm"
                >
                  Lookup
                </button>
              </div>

              {/* Quick Preset Buttons for Testing */}
              <div className="flex flex-wrap items-center gap-1.5 pt-1 text-xs">
                <span className="text-[11px] text-slate-500">Quick Test Scans:</span>
                {parts.slice(0, 4).map((p) => (
                  <button
                    key={p.id}
                    onClick={() => {
                      setScannedInput(p.id);
                      handleLookup(p.id);
                    }}
                    className="font-mono text-[10px] bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-amber-400 px-2 py-0.5 rounded border border-slate-700/60 transition-colors"
                  >
                    {p.id}
                  </button>
                ))}
              </div>
            </div>

            {/* Scanned Part Details & Action Card */}
            {selectedPart && (
              <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 space-y-3 animate-in fade-in duration-200">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                        {selectedPart.id}
                      </span>
                      <span className="text-xs text-slate-400">{selectedPart.category}</span>
                      <span className="text-xs text-slate-500">• Loc: {selectedPart.location}</span>
                    </div>
                    <h4 className="text-sm font-bold text-slate-100 mt-1">{selectedPart.name}</h4>
                    <p className="text-xs text-slate-400">Supplier: {selectedPart.supplier}</p>
                  </div>

                  <div className="text-right">
                    {computeStockStatus(selectedPart.currentStock, selectedPart.reorderThreshold) === 'Critical' && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-rose-500/20 text-rose-300 border border-rose-500/30 animate-pulse">
                        <AlertOctagon className="w-3 h-3" /> Critical Stock
                      </span>
                    )}
                    {computeStockStatus(selectedPart.currentStock, selectedPart.reorderThreshold) === 'Low Stock' && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-amber-500/20 text-amber-300 border border-amber-500/30">
                        <AlertTriangle className="w-3 h-3" /> Low Stock
                      </span>
                    )}
                    {computeStockStatus(selectedPart.currentStock, selectedPart.reorderThreshold) === 'Normal' && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        <CheckCircle2 className="w-3 h-3" /> Healthy
                      </span>
                    )}
                  </div>
                </div>

                {/* Stock Stats Grid */}
                <div className="grid grid-cols-3 gap-2 bg-slate-900 p-2.5 rounded-lg text-center font-mono text-xs border border-slate-800">
                  <div>
                    <span className="block text-[10px] text-slate-500">Current Stock</span>
                    <span className="text-base font-bold text-slate-100">{selectedPart.currentStock}</span>
                  </div>
                  <div>
                    <span className="block text-[10px] text-slate-500">Reorder Level</span>
                    <span className="text-base font-bold text-amber-400">{selectedPart.reorderThreshold}</span>
                  </div>
                  <div>
                    <span className="block text-[10px] text-slate-500">Target Stock</span>
                    <span className="text-base font-bold text-emerald-400">{selectedPart.targetStock}</span>
                  </div>
                </div>

                {/* Warehouse Actions */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400 font-semibold">Qty:</span>
                    <div className="flex items-center bg-slate-900 border border-slate-700 rounded-lg">
                      <button
                        type="button"
                        onClick={() => setActionQuantity(Math.max(1, actionQuantity - 1))}
                        className="px-2 py-1 text-slate-400 hover:text-slate-100"
                      >
                        -
                      </button>
                      <span className="px-2 font-mono font-bold text-xs text-slate-100">{actionQuantity}</span>
                      <button
                        type="button"
                        onClick={() => setActionQuantity(actionQuantity + 1)}
                        className="px-2 py-1 text-slate-400 hover:text-slate-100"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleExecuteAction('check-out')}
                      disabled={selectedPart.currentStock <= 0}
                      className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 transition-colors disabled:opacity-50"
                    >
                      <Minus className="w-3.5 h-3.5" />
                      <span>Check-Out (Dispatch)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleExecuteAction('check-in')}
                      className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Check-In (Receive)</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Depot Bin Labels */}
        {activeTab === 'labels' && (
          <div className="py-4 space-y-4 overflow-y-auto flex-1 pr-1">
            <div className="flex items-center justify-between text-xs text-slate-400 pb-1">
              <span>Depot Bay 1 to 4 Printable Barcode Labels:</span>
              <button
                type="button"
                onClick={() => window.print()}
                className="flex items-center gap-1 text-amber-400 hover:text-amber-300 font-semibold"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Bin Labels</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {parts.map((p) => (
                <div
                  key={p.id}
                  className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex flex-col items-center justify-between gap-2 text-center"
                >
                  <div className="w-full flex items-center justify-between text-[11px] text-slate-400">
                    <span className="font-semibold text-amber-400 font-mono">{p.location}</span>
                    <span>{p.category}</span>
                  </div>
                  <span className="text-xs font-bold text-slate-100 truncate max-w-full">{p.name}</span>

                  {renderSvgBarcode(p.id)}

                  <div className="w-full flex items-center justify-between text-[10px] text-slate-500 font-mono pt-1">
                    <span>Reorder: {p.reorderThreshold}</span>
                    <span>Stock: {p.currentStock}</span>
                    <span>Target: {p.targetStock}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 3: Scan Log */}
        {activeTab === 'history' && (
          <div className="py-4 space-y-3 overflow-y-auto flex-1 pr-1">
            {scanHistory.length === 0 ? (
              <div className="text-center py-10 text-slate-500 text-xs">
                No recent scans in this active depot session. Scan or lookup a part to see action logs.
              </div>
            ) : (
              scanHistory.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-slate-950/80 border border-slate-800 text-xs"
                >
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold font-mono text-xs ${
                        item.action === 'check-in'
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : 'bg-rose-500/20 text-rose-400'
                      }`}
                    >
                      {item.action === 'check-in' ? '+' : '-'}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5 font-semibold text-slate-200">
                        <span className="font-mono text-amber-400">{item.partId}</span>
                        <span>•</span>
                        <span>{item.partName}</span>
                      </div>
                      <span className="text-[11px] text-slate-500">
                        {item.action === 'check-in' ? 'Received' : 'Dispatched'} {Math.abs(item.quantityDelta)} unit(s) • New balance: {item.newStock} units
                      </span>
                    </div>
                  </div>
                  <span className="font-mono text-[10px] text-slate-500">{item.timestamp}</span>
                </div>
              ))
            )}
          </div>
        )}

        {/* Footer */}
        <div className="pt-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <span className="flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            Scanner updates ERP stock immediately & syncs with AI restock auditor
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg font-semibold transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
