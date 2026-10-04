export type PartCategory =
  | 'Hydraulics'
  | 'Engine'
  | 'Undercarriage'
  | 'Transmission'
  | 'Filtration'
  | 'Electrical'
  | 'Wear Parts';

export type StockStatus = 'Normal' | 'Low Stock' | 'Critical';

export interface InventoryItem {
  id: string; // e.g. "HYD-EXC-4091"
  name: string; // e.g. "Excavator Hydraulic Cylinder Seal Kit"
  category: PartCategory;
  currentStock: number;
  reorderThreshold: number;
  targetStock: number;
  unitPrice: number; // in USD
  supplier: string;
  location: string; // e.g. "Bay 3 - Shelf B12"
  leadTimeDays: number;
  machineryModels: string[]; // e.g. ["CAT 336", "CAT 349"]
  lastAuditedStock?: number;
}

export interface RestockRecommendation {
  partId: string;
  partName: string;
  currentStock: number;
  targetStock: number;
  recommendedOrderQty: number;
  estimatedCost: number;
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  leadTimeRisk?: string;
  reason: string;
  supplier: string;
  approved?: boolean;
}

export interface PurchaseOrderEmail {
  subject: string;
  to: string;
  cc?: string;
  poNumber: string;
  emailBody: string;
}

export interface AuditResult {
  totalItemsScanned: number;
  criticalItemsCount: number;
  lowStockItemsCount: number;
  healthyItemsCount: number;
  estimatedTotalRestockCost: number;
  overallRiskLevel: 'CRITICAL' | 'ELEVATED' | 'MODERATE' | 'LOW';
  executiveSummary: string;
  keyInsights: string[];
  recommendations: RestockRecommendation[];
  purchaseOrderEmail: PurchaseOrderEmail;
  auditTimestamp: string;
  aiEngineUsed?: string;
  warning?: string;
}

export function computeStockStatus(currentStock: number, reorderThreshold: number): StockStatus {
  if (currentStock <= 0 || currentStock <= Math.max(1, Math.floor(reorderThreshold * 0.35))) {
    return 'Critical';
  }
  if (currentStock <= reorderThreshold) {
    return 'Low Stock';
  }
  return 'Normal';
}
