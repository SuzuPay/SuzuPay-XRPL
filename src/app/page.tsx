'use client';

import Link from 'next/link';
import { Store, QrCode, TrendingUp, Zap, Shield, Globe } from 'lucide-react';
import { WalletConnectButton } from '@/components/wallet-connect-button';

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-bg-900">
      {/* Header */}
      <header className="border-b border-surface-700 bg-surface-800/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
              <span className="text-white font-bold text-lg">S</span>
            </div>
            <span className="text-xl font-bold text-text-high">SuzuPay</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-primary-500/20 text-primary-500 font-medium">
              XRPL
            </span>
          </div>
          <WalletConnectButton />
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1">
        <section className="container mx-auto px-4 py-16 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-surface-800 border border-surface-700 mb-6">
            <Zap className="w-4 h-4 text-accent-500" />
            <span className="text-sm text-text-med">Powered by XRP Ledger</span>
          </div>
          
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            <span className="text-text-high">Fast, Secure Payments</span>
            <br />
            <span className="text-gradient-primary">on the XRP Ledger</span>
          </h1>
          
          <p className="text-lg text-text-med max-w-2xl mx-auto mb-12">
            Experience instant, low-cost payments with SuzuPay. Built for merchants and customers 
            who demand speed, security, and simplicity.
          </p>

          {/* Action Cards */}
          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {/* Merchant Portal */}
            <Link 
              href="/merchant"
              className="group p-6 rounded-2xl bg-surface-800 border border-surface-700 hover:border-primary-500 transition-all duration-300 hover:shadow-lg hover:shadow-primary-500/10"
            >
              <div className="w-14 h-14 rounded-xl bg-primary-500/20 flex items-center justify-center mb-4 mx-auto group-hover:scale-110 transition-transform">
                <Store className="w-7 h-7 text-primary-500" />
              </div>
              <h3 className="text-xl font-semibold text-text-high mb-2">Merchant Portal</h3>
              <p className="text-text-med text-sm">
                Generate QR codes for instant XRP payments. Track transactions in real-time.
              </p>
            </Link>

            {/* Customer Pay */}
            <Link 
              href="/pay"
              className="group p-6 rounded-2xl bg-surface-800 border border-surface-700 hover:border-accent-500 transition-all duration-300 hover:shadow-lg hover:shadow-accent-500/10"
            >
              <div className="w-14 h-14 rounded-xl bg-accent-500/20 flex items-center justify-center mb-4 mx-auto group-hover:scale-110 transition-transform">
                <QrCode className="w-7 h-7 text-accent-500" />
              </div>
              <h3 className="text-xl font-semibold text-text-high mb-2">Scan & Pay</h3>
              <p className="text-text-med text-sm">
                Scan merchant QR codes and pay instantly with XRP or RLUSD.
              </p>
            </Link>

            {/* Invest/Finance */}
            <Link 
              href="/invest"
              className="group p-6 rounded-2xl bg-surface-800 border border-surface-700 hover:border-success transition-all duration-300 hover:shadow-lg hover:shadow-success/10"
            >
              <div className="w-14 h-14 rounded-xl bg-success/20 flex items-center justify-center mb-4 mx-auto group-hover:scale-110 transition-transform">
                <TrendingUp className="w-7 h-7 text-success" />
              </div>
              <h3 className="text-xl font-semibold text-text-high mb-2">Invest</h3>
              <p className="text-text-med text-sm">
                Support merchants with micro-financing. Earn returns on XRPL.
              </p>
            </Link>
          </div>
        </section>

        {/* Features Section */}
        <section className="container mx-auto px-4 py-16">
          <h2 className="text-2xl font-bold text-center text-text-high mb-12">Why SuzuPay on XRPL?</h2>
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-primary-500/10 flex items-center justify-center mx-auto mb-4">
                <Zap className="w-6 h-6 text-primary-500" />
              </div>
              <h3 className="font-semibold text-text-high mb-2">3-5 Second Finality</h3>
              <p className="text-sm text-text-med">Transactions settle in seconds, not minutes</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-accent-500/10 flex items-center justify-center mx-auto mb-4">
                <Shield className="w-6 h-6 text-accent-500" />
              </div>
              <h3 className="font-semibold text-text-high mb-2">Ultra-Low Fees</h3>
              <p className="text-sm text-text-med">~0.00001 XRP per transaction</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-4">
                <Globe className="w-6 h-6 text-success" />
              </div>
              <h3 className="font-semibold text-text-high mb-2">Global Scalability</h3>
              <p className="text-sm text-text-med">1,500+ TPS with carbon-neutral validation</p>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-surface-700 bg-surface-800/50 py-6">
        <div className="container mx-auto px-4 text-center">
          <p className="text-sm text-text-low">
            © {new Date().getFullYear()} SuzuPay. Built for JFIIP Hackathon on XRPL Testnet.
          </p>
        </div>
      </footer>
    </div>
  );
}
