<div align="center">
  <h1>SuzuPay</h1>
  <p><strong>Decentralized Payment & Financing Terminal for SMEs</strong></p>
  <p>Empowering small businesses with instant crypto payments and democratized access to capital on the XRP Ledger</p>

  [![Built with Next.js](https://img.shields.io/badge/Next.js-16.1-black?style=flat-square&logo=next.js)](https://nextjs.org/)
  [![XRPL](https://img.shields.io/badge/XRPL-4.5.0-blue?style=flat-square)](https://xrpl.org/)
  [![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
  
  <p><a href="https://www.youtube.com/watch?v=utLo90ceZaI">Watch Demo Video</a></p>
</div>

---

## Overview

**SuzuPay** is a next-generation financial platform built on the **XRP Ledger** that bridges the gap between traditional commerce and decentralized finance. It provides merchants with two powerful capabilities:

1. **Instant Crypto Payments** — Accept XRP payments through QR codes with settlement in 3-5 seconds and fees under $0.01
2. **Micro-Financing Campaigns** — Raise working capital by issuing tokenized IOUs backed by future revenue streams

By leveraging XRPL's speed, low costs, and programmable tokens, SuzuPay democratizes access to financial services for small and medium enterprises worldwide.

---

## Key Features

### For Merchants
- **Wallet Integration** — Connect instantly via Crossmark or Xaman (Xumm)
- **QR Payment Generation** — Create payment requests with custom amounts in seconds
- **Real-Time Settlement** — Receive funds directly to your wallet with instant confirmation
- **Financing Campaigns** — Launch micro-financing initiatives by issuing standardized tokens
- **Dashboard Analytics** — Track payments, funding progress, and investor engagement

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
|----------|-------------|
| **Frontend** | Next.js 16, React 19, TypeScript 5 |
| **Styling** | Tailwind CSS 4, Radix UI, Lucide Icons |
| **Blockchain** | XRPL 4.5, xrpl.js SDK |
| **Wallet Integration** | Crossmark SDK, xrpl-connect (Xaman) |
| **QR Functionality** | qrcode.react |
| **State Management** | React Context API |
| **Package Manager** | pnpm |

---

## Getting Started

### Prerequisites

- **Node.js** 20+ and **pnpm** 8+
- **XRPL Wallet** (Xaman or Crossmark browser extension)
- **XRPL Account** with funding

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/suzupay-xrpl.git
   cd suzupay-xrpl
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Run the development server**
   ```bash
   pnpm dev
   ```

4. **Open in your browser**
   
   Navigate to [http://localhost:3000](http://localhost:3000)

### Configuration

Network settings can be configured in [src/lib/xrpl-client.ts](src/lib/xrpl-client.ts) to connect to your preferred XRPL network.

---

## Usage Guide

### For Merchants

1. **Connect Your Wallet**
   - Click "Connect Wallet" in the header
   - Select Crossmark or Xaman
   - Approve the connection request

2. **Accept Payments**
   - Navigate to **Merchant Portal**
   - Enter payment amount
   - Click "Generate QR Code"
   - Customer scans and pays
   - Receive instant confirmation

3. **Launch Financing Campaign**
   - Go to **Merchant Portal** > **Start Financing**
   - Set funding goal and token parameters
   - Launch campaign on-chain
   - Track funding progress in real-time

### For Investors

1. **Connect Your Wallet**
   - Click "Connect Wallet"
   - Approve connection

2. **Discover & Invest**
   - Visit **Investor Portal**
   - Browse active campaigns
   - Enter investment amount
   - Confirm transaction in wallet
   - Receive merchant tokens instantly

---

## Project Structure

```
suzupay-xrpl/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── merchant/          # Merchant portal
│   │   ├── invest/            # Investor dashboard
│   │   └── pay/               # Payment interface
│   ├── components/            # React components
│   │   ├── ui/                # shadcn/ui components
│   │   ├── wallet-connect-button.tsx
│   │   ├── qr-generator.tsx
│   │   └── payment-confirmation.tsx
│   ├── lib/                   # Core utilities & SDKs
│   │   ├── xrpl-client.ts    # XRPL connection
│   │   ├── wallet-context.tsx # Wallet state management
│   │   └── payment.ts         # Payment logic
│   └── types/                 # TypeScript definitions
├── public/                    # Static assets
└── Docs/                      # Documentation
```

---

## Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## Acknowledgments

- **XRPL Foundation** — For the robust infrastructure and comprehensive documentation
- **Crossmark** & **Xaman** — For seamless wallet integration
- **shadcn/ui** — For the beautiful component library
- **JFIIP Program** — For supporting innovative blockchain solutions

---

<div align="center">
  <p><strong>Built on the XRP Ledger</strong></p>
  <p>Empowering the next generation of decentralized commerce</p>
</div>
