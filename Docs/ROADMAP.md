# **SuzuPay XRPL Demo: Development Schedule**

**Goal:** Create a Minimum Viable Product (MVP) for QR Payments & Merchant Financing on XRPL.

---

## **📅 Phase 1: Environment Setup & Foundation**

**Focus:** Project initialization and wallet connection.

| ID | Task Name | Description | Tech / Tools | Status |
| :---- | :---- | :---- | :---- | :---- |
| **1-1** | **Repo Initialization** | Create Next.js project, install dependencies (xrpl, qrcode.react). | Next.js, Git | ✅ Done |
| **1-2** | **XRPL Client Setup** | Configure connection to **XRPL Testnet** (wss://s.altnet.rippletest.net:51233). | xrpl.js | ✅ Done |
| **1-3** | **Wallet Integration** | Implement "Connect Wallet" button using **Xumm (Xaman)** or **Crossmark**. | Xumm SDK / Crossmark | ✅ Done |
| **1-4** | **UI Scaffolding** | Create basic layout: "Merchant View" (Receiver) and "User View" (Payer). | Tailwind CSS | ✅ Done |

---

## **💸 Phase 2: QR Payment Function (Core)**

**Focus:** Enabling instant XRP payments via QR codes.

| ID | Task Name | Description | Tech / Tools | Status |
| :---- | :---- | :---- | :---- | :---- |
| **2-1** | **Generate QR Code** | Merchant inputs amount (e.g., 20 XRP) -> App generates QR with destination address. | qrcode.react | ✅ Done |
| **2-2** | **Payment Transaction** | User scans QR (or clicks "Pay") -> App builds Payment transaction. | xrpl.js (Transaction) | ✅ Done |
| **2-3** | **Sign & Submit** | User signs transaction via Wallet -> Submit to Testnet. | Wallet SDK | ✅ Done |
| **2-4** | **Verification** | Listen for transaction success and display "Payment Complete" modal. | xrpl.js (Subscribe) | ✅ Done |

---

## **💰 Phase 3: Financing Function (Simple Demo)**

**Focus:** Demonstrating liquidity sourcing (Merchant issues a token/IOU for funding).

| ID | Task Name | Description | Tech / Tools | Status |
| :---- | :---- | :---- | :---- | :---- |
| **3-1** | **Token Config** | Define a dummy token for financing (e.g., Code: SZP-FUND, Issuer: Merchant). | XRPL Token Standard | ✅ Done |
| **3-2** | **Issue Token** | Merchant creates AccountSet (DefaultRipple) + User sets TrustSet. | xrpl.js | ✅ Done |
| **3-3** | **Funding Tx** | Investor sends XRP to Merchant; Merchant sends SZP-FUND back (Manual or DEX). | Payment / MPT implementation | ✅ Done |
| **3-4** | **Dashboard** | Display "Raised Funds" (XRP Balance) on Merchant Dashboard. | React State | ✅ Done |

---

## **🚀 Phase 4: Finalize & Submit**

**Focus:** Documentation and polish for the presentation.

| ID | Task Name | Description | Tech / Tools | Status |
| :---- | :---- | :---- | :---- | :---- |
| **4-1** | **UI Polish** | Clean up styles, add SuzuPay logo, ensure mobile responsiveness. | CSS / Tailwind | 🔄 In Progress |
| **4-2** | **Testing** | Run full flow on Testnet (Merchant creates QR -> User Pays -> Merchant Requests Fund). | Manual Test | ⬜️ To Do |
| **4-3** | **Documentation** | Update README.md with setup instructions and screenshots. | Markdown | ⬜️ To Do |
| **4-4** | **Demo Video** | (Optional) Record a 1-minute screen capture of the flow. | Loom / OBS | ⬜️ To Do |

---
