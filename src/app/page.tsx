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
      <main className="flex-1 bg-gradient-dark">
        <section className="container mx-auto px-4 py-20 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-surface-800/50 backdrop-blur-md border border-surface-700/50 mb-8 animate-fade-in shadow-lg">
            <Zap className="w-4 h-4 text-accent-500 fill-accent-500" />
            <span className="text-sm text-text-med font-medium tracking-wide">Powered by XRP Ledger</span>
          </div>

          <h1 className="text-5xl md:text-7xl font-extrabold mb-6 leading-tight tracking-tight">
            <span className="text-text-high drop-shadow-2xl">Fast, Secure Payments</span>
            <br />
            <span className="text-gradient-primary">on the XRP Ledger</span>
          </h1>

          <p className="text-lg md:text-xl text-text-med max-w-2xl mx-auto mb-14 leading-relaxed font-light">
            Experience instant, low-cost payments with SuzuPay. Built for merchants and customers
            who demand speed, security, and simplicity.
          </p>

          {/* ─── Action Cards ─── */}
          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {/* Merchant Portal */}
            <Link href="/merchant" className="group">
              <Card className="h-full glass-card border-0 hover:border-primary-500/50 transition-all duration-500 hover:shadow-2xl hover:shadow-primary-500/10 hover:-translate-y-2">
                <CardContent className="p-8 text-center">
                  <div className="w-20 h-20 rounded-3xl bg-primary-500/10 flex items-center justify-center mb-6 mx-auto group-hover:scale-110 transition-transform duration-500 group-hover:bg-primary-500/20">
                    <Store className="w-10 h-10 text-primary-500" />
                  </div>
                  <h3 className="text-2xl font-bold text-text-high mb-3">Merchant Portal</h3>
                  <p className="text-text-med text-sm leading-relaxed mb-6">
                    Generate QR codes for instant XRP payments. Track transactions in real-time.
                  </p>
                  <div className="flex items-center justify-center gap-2 text-primary-500 text-sm font-bold opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0">
                    <span>Get Started</span>
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </CardContent>
              </Card>
            </Link>

            {/* Customer Pay */}
            <Link href="/pay" className="group">
              <Card className="h-full glass-card border-0 hover:border-accent-500/50 transition-all duration-500 hover:shadow-2xl hover:shadow-accent-500/10 hover:-translate-y-2">
                <CardContent className="p-8 text-center">
                  <div className="w-20 h-20 rounded-3xl bg-accent-500/10 flex items-center justify-center mb-6 mx-auto group-hover:scale-110 transition-transform duration-500 group-hover:bg-accent-500/20">
                    <QrCode className="w-10 h-10 text-accent-500" />
                  </div>
                  <h3 className="text-2xl font-bold text-text-high mb-3">Scan & Pay</h3>
                  <p className="text-text-med text-sm leading-relaxed mb-6">
                    Scan merchant QR codes and pay instantly with XRP or RLUSD.
                  </p>
                  <div className="flex items-center justify-center gap-2 text-accent-500 text-sm font-bold opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0">
                    <span>Scan Now</span>
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </CardContent>
              </Card>
            </Link>

            {/* Invest/Finance */}
            <Link href="/invest" className="group">
              <Card className="h-full glass-card border-0 hover:border-success/50 transition-all duration-500 hover:shadow-2xl hover:shadow-success/10 hover:-translate-y-2">
                <CardContent className="p-8 text-center">
                  <div className="w-20 h-20 rounded-3xl bg-success/10 flex items-center justify-center mb-6 mx-auto group-hover:scale-110 transition-transform duration-500 group-hover:bg-success/20">
                    <TrendingUp className="w-10 h-10 text-success" />
                  </div>
                  <h3 className="text-2xl font-bold text-text-high mb-3">Invest</h3>
                  <p className="text-text-med text-sm leading-relaxed mb-6">
                    Support merchants with micro-financing. Earn returns on XRPL.
                  </p>
                  <div className="flex items-center justify-center gap-2 text-success text-sm font-bold opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0">
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
