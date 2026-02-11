'use client';

import Link from 'next/link';
import { Store, QrCode, TrendingUp, Zap, Shield, Globe, ArrowRight } from 'lucide-react';
import { WalletConnectButton } from '@/components/wallet-connect-button';
import { Logo } from '@/components/logo';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-bg-900">
      {/* ─── Header ─── */}
      <header className="border-b border-surface-700 bg-surface-800/60 backdrop-blur-md sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Logo size="md" />
          <WalletConnectButton />
        </div>
      </header>

      {/* ─── Hero Section ─── */}
      <main className="flex-1">
        <section className="container mx-auto px-4 py-20 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-surface-800 border border-surface-700 mb-8 animate-fade-in">
            <Zap className="w-4 h-4 text-accent-500" />
            <span className="text-sm text-text-med font-medium">Powered by XRP Ledger</span>
          </div>

          <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold mb-6 leading-tight">
            <span className="text-text-high">Fast, Secure Payments</span>
            <br />
            <span className="text-gradient-primary">on the XRP Ledger</span>
          </h1>

          <p className="text-lg md:text-xl text-text-med max-w-2xl mx-auto mb-14 leading-relaxed">
            Experience instant, low-cost payments with SuzuPay. Built for merchants and customers
            who demand speed, security, and simplicity.
          </p>

          {/* ─── Action Cards ─── */}
          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {/* Merchant Portal */}
            <Link href="/merchant" className="group">
              <Card className="h-full bg-surface-800 border-surface-700 hover:border-primary-500 transition-all duration-300 hover:shadow-xl hover:shadow-[rgba(255,79,112,0.08)]">
                <CardContent className="p-8 text-center">
                  <div className="w-16 h-16 rounded-2xl bg-primary-500/15 flex items-center justify-center mb-5 mx-auto group-hover:scale-110 transition-transform duration-300">
                    <Store className="w-8 h-8 text-primary-500" />
                  </div>
                  <h3 className="text-xl font-bold text-text-high mb-2">Merchant Portal</h3>
                  <p className="text-text-med text-sm leading-relaxed">
                    Generate QR codes for instant XRP payments. Track transactions in real-time.
                  </p>
                  <div className="mt-4 flex items-center justify-center gap-1 text-primary-500 text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                    <span>Get Started</span>
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </CardContent>
              </Card>
            </Link>

            {/* Customer Pay */}
            <Link href="/pay" className="group">
              <Card className="h-full bg-surface-800 border-surface-700 hover:border-accent-500 transition-all duration-300 hover:shadow-xl hover:shadow-[rgba(255,199,89,0.08)]">
                <CardContent className="p-8 text-center">
                  <div className="w-16 h-16 rounded-2xl bg-accent-500/15 flex items-center justify-center mb-5 mx-auto group-hover:scale-110 transition-transform duration-300">
                    <QrCode className="w-8 h-8 text-accent-500" />
                  </div>
                  <h3 className="text-xl font-bold text-text-high mb-2">Scan & Pay</h3>
                  <p className="text-text-med text-sm leading-relaxed">
                    Scan merchant QR codes and pay instantly with XRP or RLUSD.
                  </p>
                  <div className="mt-4 flex items-center justify-center gap-1 text-accent-500 text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                    <span>Scan Now</span>
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </CardContent>
              </Card>
            </Link>

            {/* Invest/Finance */}
            <Link href="/invest" className="group">
              <Card className="h-full bg-surface-800 border-surface-700 hover:border-[rgb(var(--color-success))] transition-all duration-300 hover:shadow-xl hover:shadow-[rgba(34,197,94,0.08)]">
                <CardContent className="p-8 text-center">
                  <div className="w-16 h-16 rounded-2xl bg-[rgb(var(--color-success))]/15 flex items-center justify-center mb-5 mx-auto group-hover:scale-110 transition-transform duration-300">
                    <TrendingUp className="w-8 h-8 text-success" />
                  </div>
                  <h3 className="text-xl font-bold text-text-high mb-2">Invest</h3>
                  <p className="text-text-med text-sm leading-relaxed">
                    Support merchants with micro-financing. Earn returns on XRPL.
                  </p>
                  <div className="mt-4 flex items-center justify-center gap-1 text-success text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                    <span>Explore</span>
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          </div>
        </section>

        <Separator className="max-w-4xl mx-auto opacity-30" />

        {/* ─── Features Section ─── */}
        <section className="container mx-auto px-4 py-20">
          <h2 className="text-2xl md:text-3xl font-bold text-center text-text-high mb-14">
            Why SuzuPay on XRPL?
          </h2>
          <div className="grid md:grid-cols-3 gap-10 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="w-14 h-14 rounded-2xl bg-primary-500/10 flex items-center justify-center mx-auto mb-5">
                <Zap className="w-7 h-7 text-primary-500" />
              </div>
              <h3 className="font-bold text-text-high mb-2 text-lg">3-5 Second Finality</h3>
              <p className="text-sm text-text-med leading-relaxed">
                Transactions settle in seconds, not minutes. Instant confirmation for every payment.
              </p>
            </div>
            <div className="text-center">
              <div className="w-14 h-14 rounded-2xl bg-accent-500/10 flex items-center justify-center mx-auto mb-5">
                <Shield className="w-7 h-7 text-accent-500" />
              </div>
              <h3 className="font-bold text-text-high mb-2 text-lg">Ultra-Low Fees</h3>
              <p className="text-sm text-text-med leading-relaxed">
                ~0.00001 XRP per transaction. Save significantly compared to traditional payment processors.
              </p>
            </div>
            <div className="text-center">
              <div className="w-14 h-14 rounded-2xl bg-[rgb(var(--color-success))]/10 flex items-center justify-center mx-auto mb-5">
                <Globe className="w-7 h-7 text-success" />
              </div>
              <h3 className="font-bold text-text-high mb-2 text-lg">Global Scalability</h3>
              <p className="text-sm text-text-med leading-relaxed">
                1,500+ TPS with carbon-neutral validation. Built for worldwide adoption.
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* ─── Footer ─── */}
      <footer className="border-t border-surface-700 bg-surface-800/50 py-8">
        <div className="container mx-auto px-4 text-center">
          <p className="text-sm text-text-low">
            © {new Date().getFullYear()} SuzuPay. Built for JFIIP Hackathon on XRPL Testnet.
          </p>
        </div>
      </footer>
    </div>
  );
}
