'use client';

import Link from 'next/link';
import { ArrowLeft, TrendingUp, Shield, Clock, Coins, Lock, ArrowUpRight } from 'lucide-react';
import { WalletConnectButton } from '@/components/wallet-connect-button';

export default function InvestPage() {
  return (
    <div className="min-h-screen bg-bg-900">
      {/* Header */}
      <header className="border-b border-surface-700 bg-surface-800/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Link href="/" className="p-2 rounded-lg hover:bg-surface-700 transition-colors">
              <ArrowLeft className="w-5 h-5 text-text-med" />
            </Link>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-success flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-white" />
              </div>
              <span className="text-xl font-bold text-text-high">Invest</span>
            </div>
          </div>
          <WalletConnectButton />
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-2xl">
        {/* Coming Soon Banner */}
        <div className="mb-8 p-6 rounded-2xl gradient-primary text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/20 backdrop-blur-sm mb-4">
            <Clock className="w-4 h-4 text-white" />
            <span className="text-sm font-medium text-white">Coming in Phase 3</span>
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Merchant Financing</h1>
          <p className="text-white/80">
            Support local merchants and earn returns on XRPL
          </p>
        </div>

        {/* Feature Preview */}
        <div className="space-y-4 mb-8">
          <h2 className="text-lg font-semibold text-text-high">What's Coming</h2>
          
          <div className="p-5 bg-surface-800 rounded-xl border border-surface-700">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-lg bg-success/20 flex items-center justify-center flex-shrink-0">
                <Coins className="w-5 h-5 text-success" />
              </div>
              <div>
                <h3 className="font-semibold text-text-high mb-1">Invest in Merchants</h3>
                <p className="text-sm text-text-med">
                  Fund merchant campaigns and receive SZP-FUND tokens representing your investment.
                </p>
              </div>
            </div>
          </div>

          <div className="p-5 bg-surface-800 rounded-xl border border-surface-700">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-lg bg-primary-500/20 flex items-center justify-center flex-shrink-0">
                <Lock className="w-5 h-5 text-primary-500" />
              </div>
              <div>
                <h3 className="font-semibold text-text-high mb-1">Secure Escrow</h3>
                <p className="text-sm text-text-med">
                  Funds are held in XRPL escrow with conditional release based on merchant milestones.
                </p>
              </div>
            </div>
          </div>

          <div className="p-5 bg-surface-800 rounded-xl border border-surface-700">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-lg bg-accent-500/20 flex items-center justify-center flex-shrink-0">
                <ArrowUpRight className="w-5 h-5 text-accent-500" />
              </div>
              <div>
                <h3 className="font-semibold text-text-high mb-1">Automatic Repayments</h3>
                <p className="text-sm text-text-med">
                  Merchants repay via XRPL payment channels, distributing returns to investors.
                </p>
              </div>
            </div>
          </div>

          <div className="p-5 bg-surface-800 rounded-xl border border-surface-700">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-lg bg-warning/20 flex items-center justify-center flex-shrink-0">
                <Shield className="w-5 h-5 text-warning" />
              </div>
              <div>
                <h3 className="font-semibold text-text-high mb-1">Trust Score System</h3>
                <p className="text-sm text-text-med">
                  AI-powered merchant scoring based on transaction history and repayment behavior.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Tech Stack */}
        <div className="p-6 bg-surface-800 rounded-2xl border border-surface-700">
          <h3 className="font-semibold text-text-high mb-4">XRPL Features Used</h3>
          <div className="flex flex-wrap gap-2">
            <span className="px-3 py-1.5 rounded-lg bg-surface-700 text-sm text-text-med">
              MPT (Multi-Purpose Tokens)
            </span>
            <span className="px-3 py-1.5 rounded-lg bg-surface-700 text-sm text-text-med">
              Escrow
            </span>
            <span className="px-3 py-1.5 rounded-lg bg-surface-700 text-sm text-text-med">
              Payment Channels
            </span>
            <span className="px-3 py-1.5 rounded-lg bg-surface-700 text-sm text-text-med">
              TrustSet
            </span>
            <span className="px-3 py-1.5 rounded-lg bg-surface-700 text-sm text-text-med">
              AccountSet
            </span>
          </div>
        </div>
      </main>
    </div>
  );
}
