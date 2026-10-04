import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json({ limit: '10mb' }));

// Initialize Google Gen AI client with telemetry user-agent
const apiKey = process.env.GEMINI_API_KEY;
const ai = apiKey
  ? new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    })
  : null;

interface InventoryItemPayload {
  id: string;
  name: string;
  category: string;
  currentStock: number;
  reorderThreshold: number;
  targetStock: number;
  unitPrice: number;
  supplier: string;
  leadTimeDays?: number;
  machineryModels?: string[];
  location?: string;
  status: 'Normal' | 'Low Stock' | 'Critical';
}

interface AuditRequestBody {
  parts: InventoryItemPayload[];
  urgencyLevel?: 'standard' | 'expedited';
  notes?: string;
}

// Fallback rule-based generator if Gemini API key is missing or encounters rate limit
function generateRuleBasedAudit(parts: InventoryItemPayload[], urgency: string = 'standard') {
  const recommendations: any[] = [];
  let criticalCount = 0;
  let lowStockCount = 0;
  let healthyCount = 0;
  let totalRestockCost = 0;

  parts.forEach((part) => {
    let priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' = 'LOW';
    let isReorderNeeded = false;
    let qtyToOrder = 0;

    if (part.currentStock <= 0) {
      priority = 'CRITICAL';
      criticalCount++;
      isReorderNeeded = true;
      qtyToOrder = Math.max(1, part.targetStock - part.currentStock);
    } else if (part.currentStock <= Math.max(1, Math.floor(part.reorderThreshold * 0.4))) {
      priority = 'CRITICAL';
      criticalCount++;
      isReorderNeeded = true;
      qtyToOrder = Math.max(1, part.targetStock - part.currentStock);
    } else if (part.currentStock <= part.reorderThreshold) {
      priority = 'HIGH';
      lowStockCount++;
      isReorderNeeded = true;
      qtyToOrder = Math.max(1, part.targetStock - part.currentStock);
    } else if (part.currentStock < part.targetStock) {
      priority = 'MEDIUM';
      healthyCount++;
      // Optional top-up
      if (part.currentStock / part.targetStock < 0.75) {
        qtyToOrder = part.targetStock - part.currentStock;
        isReorderNeeded = true;
      }
    } else {
      healthyCount++;
    }

    if (isReorderNeeded && qtyToOrder > 0) {
      const estimatedCost = qtyToOrder * part.unitPrice;
      totalRestockCost += estimatedCost;
      recommendations.push({
        partId: part.id,
        partName: part.name,
        currentStock: part.currentStock,
        targetStock: part.targetStock,
        recommendedOrderQty: qtyToOrder,
        estimatedCost: Math.round(estimatedCost * 100) / 100,
        priority,
        leadTimeRisk: part.currentStock <= 0 ? 'High - Immediate Work Stoppage' : 'Moderate - Approaching Buffer Limit',
        reason:
          part.currentStock <= 0
            ? 'Stock depleted to zero. Heavy machinery repair jobs halted.'
            : `Stock level (${part.currentStock}) is at or below reorder threshold (${part.reorderThreshold}). Buffer replenishment required to meet target stock (${part.targetStock}).`,
        supplier: part.supplier || 'Primary OEM Supplier',
      });
    }
  });

  // Sort recommendations by priority (CRITICAL -> HIGH -> MEDIUM -> LOW)
  const priorityOrder: Record<string, number> = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
  recommendations.sort((a, b) => (priorityOrder[a.priority] ?? 4) - (priorityOrder[b.priority] ?? 4));

  const poNumber = `PO-AG-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
  const dateStr = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });

  const lineItemsText = recommendations
    .map(
      (r, idx) =>
        `${idx + 1}. [${r.partId}] ${r.partName}\n   - Qty Requested: ${r.recommendedOrderQty} units @ $${(r.estimatedCost / r.recommendedOrderQty).toFixed(2)} / unit\n   - Line Total: $${r.estimatedCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}\n   - Priority / Urgency: ${r.priority}\n   - Target Vendor: ${r.supplier}`
    )
    .join('\n\n');

  const emailBody = `Dear Supplier Procurement Team,

Please treat this communication as an official Purchase Order requisition on behalf of ApexGear Fleet Maintenance Depot.

PURCHASE ORDER NUMBER: ${poNumber}
DATE ISSUED: ${dateStr}
DISPATCH MODE: ${urgency === 'expedited' ? 'EXPEDITED FREIGHT (CRITICAL DOWNTIME)' : 'STANDARD COMMERCIAL FREIGHT'}
DELIVERY BAY: Receiving Dock B, Heavy Machinery Depot 4, Apex Industrial Parkway

REQUISITION LINE ITEMS:
--------------------------------------------------------------------------------
${lineItemsText || 'No urgent restock items flagged at this time.'}
--------------------------------------------------------------------------------
TOTAL ESTIMATED REQUISITION VALUE: $${totalRestockCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD

COMPLIANCE & RECEIVING REQUIREMENTS:
1. Provide signed bill of lading and manufacturer certificate of conformance with delivery.
2. Tag all pallets with purchase order reference: ${poNumber}.
3. Please send order confirmation and estimated tracking ETA to procurement@apexgear-fleet.internal within 24 hours.

Authorized Signature:
Marcus Vance, Chief Logistics & Equipment Maintenance Officer
ApexGear Industrial Operations`;

  return {
    totalItemsScanned: parts.length,
    criticalItemsCount: criticalCount,
    lowStockItemsCount: lowStockCount,
    healthyItemsCount: healthyCount,
    estimatedTotalRestockCost: Math.round(totalRestockCost * 100) / 100,
    overallRiskLevel: criticalCount > 0 ? 'CRITICAL' : lowStockCount > 0 ? 'ELEVATED' : 'LOW',
    executiveSummary: `Audit completed across ${parts.length} equipment components. Identified ${criticalCount} critical deficit(s) requiring immediate procurement authorization to prevent fleet downtime. Total estimated restock outlay: $${totalRestockCost.toLocaleString()}.`,
    keyInsights: [
      criticalCount > 0
        ? `${criticalCount} mission-critical component(s) have reached zero or sub-critical buffers.`
        : 'All core assemblies currently operate above minimum emergency reserve levels.',
      `Aggregate capital expenditure required to restore target inventory buffers is $${totalRestockCost.toLocaleString()}.`,
      urgency === 'expedited'
        ? 'Expedited transit flagged due to ongoing field machinery maintenance schedules.'
        : 'Lead times remain manageable if orders are dispatched within standard 48-hour procurement windows.',
      'Recommended batching orders by OEM supplier to optimize freight consolidation and trade discounts.',
    ],
    recommendations,
    purchaseOrderEmail: {
      subject: `${urgency === 'expedited' ? '[URGENT PO REQUEST] ' : '[PURCHASE ORDER] '}Heavy Equipment Spare Parts Replenishment - Ref ${poNumber}`,
      to: 'orders@oem-heavyparts-supplier.com',
      cc: 'procurement-team@apexgear-fleet.internal, maintenance-lead@apexgear.internal',
      poNumber,
      emailBody,
    },
    auditTimestamp: new Date().toISOString(),
    aiEngineUsed: 'Gemini 3.8 Flash (Simulated Fallback Mode)',
  };
}

// POST endpoint for AI Inventory Audit
app.post('/api/inventory/audit', async (req: Request, res: Response): Promise<void> => {
  try {
    const { parts, urgencyLevel = 'standard', notes = '' } = req.body as AuditRequestBody;

    if (!parts || !Array.isArray(parts) || parts.length === 0) {
      res.status(400).json({ error: 'Inventory parts array is required and must not be empty.' });
      return;
    }

    if (!ai) {
      console.warn('GEMINI_API_KEY is not defined. Using rule-based fallback generator.');
      const fallbackResult = generateRuleBasedAudit(parts, urgencyLevel);
      res.json(fallbackResult);
      return;
    }

    const partsSummaryForAi = parts.map((p) => ({
      partId: p.id,
      partName: p.name,
      category: p.category,
      currentStock: p.currentStock,
      reorderThreshold: p.reorderThreshold,
      targetStock: p.targetStock,
      unitPriceUsd: p.unitPrice,
      supplier: p.supplier,
      stockDeficit: Math.max(0, p.targetStock - p.currentStock),
      status: p.currentStock <= 0 ? 'Out of Stock / Critical' : p.currentStock <= p.reorderThreshold ? 'Low Stock' : 'Normal',
    }));

    const prompt = `You are a Senior Fleet Maintenance & Supply Chain Director auditing a heavy equipment / earthmoving machinery spare parts inventory (excavators, bulldozers, wheel loaders, haul trucks).

Current Inventory Snapshot:
${JSON.stringify(partsSummaryForAi, null, 2)}

Urgency Dispatch Level: ${urgencyLevel.toUpperCase()}
Auditor Context Notes: ${notes || 'Standard operational maintenance cycle'}

TASK:
1. Conduct a rigorous supply chain risk audit.
2. Categorize items into Critical, Low Stock, or Healthy.
3. For all items that are at or below reorder threshold (or below target stock where prudent), formulate an optimal order quantity and priority (CRITICAL, HIGH, MEDIUM, LOW), considering downtime risk on job sites.
4. Calculate total estimated restock capital expenditure in USD.
5. Compose a professional, executive-grade Purchase Order Requisition Email drafted to OEM spare parts suppliers. The email must contain clean formatting, a PO reference number (e.g. PO-AG-2026-XXXX), clearly itemized part numbers, quantities, target pricing, delivery warehouse docks, and clear terms.`;

    let response: any = null;
    let lastError: any = null;
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        response = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: prompt,
          config: {
            systemInstruction:
              'You are ApexGear Industrial AI, an expert enterprise ERP inventory analyst and heavy equipment restock controller. Output strictly structured JSON according to the schema.',
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                totalItemsScanned: { type: Type.INTEGER },
                criticalItemsCount: { type: Type.INTEGER },
                lowStockItemsCount: { type: Type.INTEGER },
                healthyItemsCount: { type: Type.INTEGER },
                estimatedTotalRestockCost: { type: Type.NUMBER },
                overallRiskLevel: {
                  type: Type.STRING,
                  description: 'One of: CRITICAL, ELEVATED, MODERATE, LOW',
                },
                executiveSummary: {
                  type: Type.STRING,
                  description: '2-3 sentence strategic executive brief for the fleet manager',
                },
                keyInsights: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                  description: '3-4 actionable bullet points on supply chain exposure and recommendations',
                },
                recommendations: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      partId: { type: Type.STRING },
                      partName: { type: Type.STRING },
                      currentStock: { type: Type.INTEGER },
                      targetStock: { type: Type.INTEGER },
                      recommendedOrderQty: { type: Type.INTEGER },
                      estimatedCost: { type: Type.NUMBER },
                      priority: {
                        type: Type.STRING,
                        description: 'CRITICAL, HIGH, MEDIUM, or LOW',
                      },
                      leadTimeRisk: { type: Type.STRING },
                      reason: {
                        type: Type.STRING,
                        description: 'Machinery operational risk / failure impact analysis',
                      },
                      supplier: { type: Type.STRING },
                    },
                    required: [
                      'partId',
                      'partName',
                      'currentStock',
                      'targetStock',
                      'recommendedOrderQty',
                      'estimatedCost',
                      'priority',
                      'reason',
                    ],
                  },
                },
                purchaseOrderEmail: {
                  type: Type.OBJECT,
                  properties: {
                    subject: { type: Type.STRING },
                    to: { type: Type.STRING },
                    cc: { type: Type.STRING },
                    poNumber: { type: Type.STRING },
                    emailBody: {
                      type: Type.STRING,
                      description: 'Complete, nicely structured plain-text purchase order email ready to send',
                    },
                  },
                  required: ['subject', 'to', 'poNumber', 'emailBody'],
                },
              },
              required: [
                'totalItemsScanned',
                'criticalItemsCount',
                'lowStockItemsCount',
                'healthyItemsCount',
                'estimatedTotalRestockCost',
                'overallRiskLevel',
                'executiveSummary',
                'keyInsights',
                'recommendations',
                'purchaseOrderEmail',
              ],
            },
          },
        });
        if (response?.text) break;
      } catch (err: any) {
        lastError = err;
        console.warn(`Gemini attempt ${attempt + 1} failed:`, err?.message);
        if (attempt < 2) {
          await new Promise((r) => setTimeout(r, 800 * (attempt + 1)));
        }
      }
    }

    if (!response && lastError) {
      throw lastError;
    }

    const responseText = response.text;
    if (!responseText) {
      throw new Error('Empty response received from Gemini API');
    }

    const parsedData = JSON.parse(responseText.trim());
    res.json({
      ...parsedData,
      auditTimestamp: new Date().toISOString(),
      aiEngineUsed: 'Gemini 3.8 Flash',
    });
  } catch (error: any) {
    console.error('Gemini Audit API error:', error);
    // If Gemini fails due to quota or network, gracefully return rule-based audit so app continues seamlessly
    try {
      const { parts, urgencyLevel = 'standard' } = req.body as AuditRequestBody;
      if (parts && Array.isArray(parts)) {
        const fallback = generateRuleBasedAudit(parts, urgencyLevel);
        res.json({
          ...fallback,
          warning: 'Generated using local ERP heuristic engine due to temporary Gemini connectivity: ' + (error?.message || 'Check API key'),
        });
        return;
      }
    } catch {
      // ignore
    }
    res.status(500).json({
      error: 'Failed to complete AI inventory audit',
      details: error instanceof Error ? error.message : String(error),
    });
  }
});

// Health check endpoint
app.get('/api/health', (_req, res) => {
  res.json({ status: 'healthy', geminiConfigured: !!ai, timestamp: new Date().toISOString() });
});

// Mount Vite or serve static assets
async function startServer() {
  const PORT = Number(process.env.PORT) || 3000;

  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`ApexGear ERP server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
