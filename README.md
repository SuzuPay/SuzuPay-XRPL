<div align="center">
  <h1>SuzuPay</h1>
  <p><strong>Decentralized Payment & Financing Terminal for SMEs</strong></p>
  <p>Empowering small businesses with instant crypto payments and democratized access to capital on the XRP Ledger</p>

  [![Built with Next.js](https://img.shields.io/badge/Next.js-16.1-black?style=flat-square&logo=next.js)](https://nextjs.org/)
  [![XRPL](https://img.shields.io/badge/XRPL-4.5.0-blue?style=flat-square)](https://xrpl.org/)
  [![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
  [![RLUSD](https://img.shields.io/badge/RLUSD-Mainnet-green?style=flat-square)](https://ripple.com/solutions/crypto-liquidity/)
  
  <p><a href="https://www.youtube.com/watch?v=utLo90ceZaI">Watch Demo Video</a></p>
</div>

---

## Overview

**SuzuPay** is a financial platform built on the **XRP Ledger** that bridges the gap between traditional commerce and decentralized finance. It provides merchants with three core capabilities:

1. **Instant Crypto Payments** — Accept XRP or RLUSD payments via QR codes with settlement in 3-5 seconds and fees under $0.01
2. **RLUSD Instant Settlement** — Receive Ripple USD directly to your wallet for predictable, fiat-stable treasury management
3. **Micro-Financing Campaigns** — Raise working capital by issuing tokenized IOUs backed by future revenue streams

By leveraging XRPL's speed, low costs, and programmable tokens, SuzuPay democratizes access to financial services for small and medium enterprises worldwide.

---

## Key Features

### For Merchants
- **Wallet Integration** — Connect instantly via Crossmark or Xaman in under 60 seconds
- **QR Payment Generation** — Create XRP or RLUSD payment requests with custom amounts
- **RLUSD TrustLine Management** — Enable stablecoin payments with a single in-app transaction
- **Real-Time Settlement** — Receive funds directly to your wallet with instant confirmation
- **Financing Campaigns** — Launch micro-financing initiatives by issuing standardized tokens

### For Investors
- **Campaign Discovery** — Browse active merchant financing opportunities
- **One-Click Investment** — Fund merchants with XRP and receive merchant tokens instantly
- **On-Chain Transparency** — All transactions verifiable on the XRPL public ledger
- **Portfolio Tracking** — Monitor your investments and token holdings

### Platform Benefits
- **Lightning Fast** — Transactions settle in 3-5 seconds
- **Ultra-Low Fees** — Transaction costs under $0.01
- **Decentralized** — No intermediaries, full self-custody of funds
- **Secure** — Built on battle-tested XRPL infrastructure
- **Mobile Ready** — Fully responsive UI optimized for all devices

---

## Technology Stack

| Category | Technologies |
|----------|--------------|
| **Frontend** | Next.js 16, React 19, TypeScript 5 |
| **Styling** | Tailwind CSS 4, Radix UI, Lucide Icons |
| **Blockchain** | XRPL 4.5, xrpl.js SDK |
| **Wallet Integration** | Crossmark SDK, xrpl-connect (Xaman) |
| **Stablecoin** | RLUSD (Ripple USD) — Testnet & Mainnet |
| **Backend / Database** | Prisma ORM 7, SQLite |
| **QR Functionality** | qrcode.react |
| **State Management** | React Context API |
| **Package Manager** | pnpm |

---

## Getting Started

### Prerequisites

- **Node.js** 20+ and **pnpm** 8+
- **XRPL Wallet** — Xaman (mobile) or Crossmark (browser extension)
- **XRPL Account** with mainnet funding

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/SuzuPay/SuzuPay-XRPL.git
   cd SuzuPay-XRPL
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Configure environment**
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your values
   ```

4. **Initialize the database**
   ```bash
   pnpm dlx prisma migrate dev
   ```

5. **Run the development server**
   ```bash
   pnpm dev
   ```

6. **Open in your browser**

   Navigate to [http://localhost:3000](http://localhost:3000)

### Configuration

Copy `.env.example` to `.env.local` and fill in your values. The app defaults to XRPL Mainnet (`wss://xrplcluster.com`). Optional keys for Xaman deep links and WalletConnect are documented in the example file.

---

## Usage Guide

### For Merchants

1. **Connect Your Wallet**
   - Click "Connect Wallet" in the header
   - Select Crossmark or Xaman
   - Approve the connection request

2. **Accept Payments**
   - Navigate to **Merchant Portal**
   - Enter payment amount and currency
   - Share the generated QR code with the customer
   - Receive instant on-chain confirmation

3. **Launch a Financing Campaign**
   - Navigate to **Merchant Portal** → **Financing** tab
   - Issue tokens and set a sell offer on the DEX
   - Investors can discover and fund the campaign via the **Invest** page

### For Investors

1. **Connect Your Wallet**
   - Click "Connect Wallet" and approve the connection

2. **Discover & Invest**
   - Visit the **Invest** page
   - Enter a merchant's XRPL address to view their active campaign
   - Enter an investment amount and confirm in your wallet
   - Receive merchant tokens instantly on-chain

---

## Project Structure

```
SuzuPay-XRPL/
├── prisma/                    # Database schema & migrations
│   └── schema.prisma
├── scripts/                   # Dev utilities & backend tests
├── src/
│   ├── app/                   # Next.js App Router pages
│   │   ├── api/               # REST API routes (merchant, payments)
│   │   ├── merchant/          # Merchant portal
│   │   ├── invest/            # Investor page
│   │   └── pay/               # Payment interface
│   ├── components/            # React components
│   │   ├── ui/                # shadcn/ui base components
│   │   ├── wallet-connect-button.tsx
│   │   ├── qr-generator.tsx
│   │   └── payment-confirmation.tsx
│   ├── lib/                   # Core utilities & SDKs
│   │   ├── xrpl-client.ts     # XRPL connection & network config
│   │   ├── wallet-context.tsx # Wallet state management
│   │   ├── token-utils.ts     # RLUSD & token helpers
│   │   ├── payment.ts         # Payment transaction builder
│   │   └── prisma.ts          # Prisma client singleton
│   └── types/                 # TypeScript definitions
└── public/                    # Static assets
```

---

## Acknowledgments

- **XRPL Foundation** — For the robust infrastructure and comprehensive documentation
- **Crossmark** & **Xaman** — For seamless wallet integration
- **shadcn/ui** — For the component library
- **JFIIP Program** — For supporting innovative blockchain solutions

---

<div align="center">
  <p><strong>Built on the XRP Ledger</strong></p>
  <p>Empowering the next generation of decentralized commerce</p>
</div>
