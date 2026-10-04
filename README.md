# ApexGear ERP — AI Restock Assistant

ApexGear ERP is an **AI-powered inventory management system for heavy-equipment spare parts**. It helps monitor stock levels, identify low-stock parts, and generate intelligent restocking recommendations.

## 🚀 Features

- 📦 Inventory management
- 📊 Stock and reorder monitoring
- 🤖 AI-powered inventory audit using Google Gemini
- 🔄 Rule-based fallback when AI is unavailable
- 🏷️ Barcode-based inventory operations
- 🛒 Restocking recommendations
- 📄 Purchase-order assistance

## 🛠️ Tech Stack

- **Frontend:** React, TypeScript, Vite, Tailwind CSS
- **Backend:** Node.js, Express
- **AI:** Google Gemini API
- **Storage:** LocalStorage

## 🔄 Workflow

```text
Inventory
    ↓
Stock Analysis
    ↓
AI Inventory Audit
    ↓
Restock Recommendation
    ↓
Procurement
```

## ⚙️ Run Locally

### Prerequisites

- Node.js
- Gemini API Key

### Installation

```bash
git clone https://github.com/Veer564/ApexGear--ERP-AI-Restock-Assistant.git
cd ApexGear--ERP-AI-Restock-Assistant
npm install
```

Create a `.env` file:

```env
GEMINI_API_KEY=your_api_key_here
```

Then start the application:

```bash
npm run dev
```

> **Note:** Never commit your `.env` file or API keys to GitHub.


