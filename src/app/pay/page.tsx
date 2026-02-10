'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Wallet, QrCode, Send, CheckCircle2, AlertCircle, Loader2, ExternalLink, Camera } from 'lucide-react';
import { useWallet } from '@/lib/wallet-context';
import { WalletConnectButton } from '@/components/wallet-connect-button';
import { truncateAddress, formatXRP } from '@/lib/utils';
import { parsePaymentRequest, isValidXRPLAddress } from '@/lib/payment-request';
import { buildPaymentTx } from '@/lib/payment';
import { PaymentConfirmation } from '@/components/payment-confirmation';

type PaymentStatus = 'idle' | 'scanned' | 'confirming' | 'signing' | 'success' | 'error';

interface ParsedPayment {
  destination: string;
  amount: string;
  currency: string;
  memo?: string;
  isXamanURL: boolean;
}

export default function PayPage() {
  const { isConnected, address, balance, signAndSubmit } = useWallet();
  const [status, setStatus] = useState<PaymentStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);
  
  // Manual entry (for demo - in production would use camera scanner)
  const [manualQRInput, setManualQRInput] = useState('');
  const [parsedPayment, setParsedPayment] = useState<ParsedPayment | null>(null);
  
  // Quick pay mode (manual entry without QR)
  const [quickPayMode, setQuickPayMode] = useState(false);
  const [quickPayAddress, setQuickPayAddress] = useState('');
  const [quickPayAmount, setQuickPayAmount] = useState('');

  // Parse QR input
  const handleParseQR = () => {
    if (!manualQRInput.trim()) {
      setError('Please enter QR code data');
      return;
    }

    const parsed = parsePaymentRequest(manualQRInput.trim());
    
    if (!parsed.destination || !isValidXRPLAddress(parsed.destination)) {
      setError('Invalid payment request: No valid destination address found');
      return;
    }

    if (!parsed.amount || parseFloat(parsed.amount) <= 0) {
      setError('Invalid payment request: No valid amount found');
      return;
    }

    setParsedPayment({
      destination: parsed.destination,
      amount: parsed.amount,
      currency: parsed.currency || 'XRP',
      memo: parsed.memo,
      isXamanURL: parsed.isXamanURL,
    });
    setStatus('scanned');
    setError(null);
  };

  // Handle quick pay
  const handleQuickPay = () => {
    if (!quickPayAddress || !isValidXRPLAddress(quickPayAddress)) {
      setError('Please enter a valid XRPL address');
      return;
    }

    if (!quickPayAmount || parseFloat(quickPayAmount) <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    setParsedPayment({
      destination: quickPayAddress,
      amount: quickPayAmount,
      currency: 'XRP',
      isXamanURL: false,
    });
    setStatus('scanned');
    setError(null);
  };

  // Confirm and send payment
  const handleConfirmPayment = async () => {
    if (!parsedPayment || !address) return;

    setStatus('confirming');
    setError(null);

    try {
      setStatus('signing');

      // Build payment transaction (amount in drops)
      // Build payment transaction (amount in drops)
      const payment = buildPaymentTx({
        source: address,
        destination: parsedPayment.destination,
        amount: parsedPayment.amount,
        currency: 'XRP',
        memo: parsedPayment.memo
      });

      // Sign and submit using wallet
      const result = await signAndSubmit(payment);

      if (result?.hash) {
        setTxHash(result.hash);
        setStatus('success');
      } else {
        throw new Error('Transaction failed - no hash returned');
      }
    } catch (err: unknown) {
      console.error('Payment error:', err);
      setError(err instanceof Error ? err.message : 'Payment failed. Please try again.');
      setStatus('error');
    }
  };

  // Reset to initial state
  const handleReset = () => {
    setStatus('idle');
    setError(null);
    setTxHash(null);
    setParsedPayment(null);
    setManualQRInput('');
    setQuickPayAddress('');
    setQuickPayAmount('');
    setQuickPayMode(false);
  };

  // Check balance is sufficient
  const hasSufficientBalance = () => {
    if (!balance || !parsedPayment) return false;
    const balanceNum = parseFloat(balance);
    const amountNum = parseFloat(parsedPayment.amount);
    // Need to keep 10 XRP reserve + ~0.00001 XRP for fee
    return balanceNum >= amountNum + 10.00001;
  };

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
              <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
                <span className="text-white font-bold text-lg">S</span>
              </div>
              <span className="text-xl font-bold text-text-high">Pay</span>
            </div>
          </div>
          <WalletConnectButton />
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-md">
        {!isConnected ? (
          /* Not Connected State */
          <div className="text-center py-16">
            <div className="w-20 h-20 rounded-full bg-surface-800 flex items-center justify-center mx-auto mb-6">
              <Wallet className="w-10 h-10 text-text-low" />
            </div>
            <h2 className="text-2xl font-bold text-text-high mb-4">Connect to Pay</h2>
            <p className="text-text-med mb-8">
              Connect your XRPL wallet to send payments
            </p>
            <WalletConnectButton />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Balance Card */}
            <div className="p-4 bg-surface-800 rounded-xl border border-surface-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-text-low mb-1">Your Balance</p>
                  <p className="text-xl font-bold text-text-high">
                    {balance ? formatXRP(balance) : '0'} <span className="text-sm text-text-med">XRP</span>
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-text-low mb-1">Address</p>
                  <p className="font-mono text-sm text-text-med">{truncateAddress(address!)}</p>
                </div>
              </div>
            </div>

            {/* Idle State - Scan/Enter QR */}
            {status === 'idle' && !quickPayMode && (
              <div className="space-y-4">
                <div className="p-6 bg-surface-800 rounded-2xl border border-surface-700">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-lg bg-primary-500/20 flex items-center justify-center">
                      <Camera className="w-5 h-5 text-primary-500" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-text-high">Scan QR Code</h3>
                      <p className="text-sm text-text-med">Paste payment QR data below</p>
                    </div>
                  </div>

                  <textarea
                    value={manualQRInput}
                    onChange={(e) => setManualQRInput(e.target.value)}
                    placeholder="Paste Xaman URL or payment JSON here..."
                    rows={4}
                    className="w-full px-4 py-3 bg-surface-700 border border-surface-700 rounded-xl text-text-high placeholder-text-low focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 transition-all resize-none font-mono text-sm"
                  />

                  <button
                    onClick={handleParseQR}
                    disabled={!manualQRInput.trim()}
                    className="w-full mt-4 py-3 rounded-xl font-semibold text-white bg-primary-500 hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                  >
                    <QrCode className="w-5 h-5" />
                    Parse Payment
                  </button>
                </div>

                <div className="text-center">
                  <span className="text-text-low text-sm">or</span>
                </div>

                <button
                  onClick={() => setQuickPayMode(true)}
                  className="w-full py-4 rounded-xl font-semibold text-text-high border border-surface-700 hover:bg-surface-800 transition-all"
                >
                  Enter Payment Manually
                </button>

                {error && (
                  <div className="p-4 bg-error/10 border border-error/30 rounded-xl flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-error flex-shrink-0 mt-0.5" />
                    <p className="text-error text-sm">{error}</p>
                  </div>
                )}
              </div>
            )}

            {/* Quick Pay Mode - Manual Entry */}
            {status === 'idle' && quickPayMode && (
              <div className="p-6 bg-surface-800 rounded-2xl border border-surface-700 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-text-high">Quick Pay</h3>
                  <button
                    onClick={() => setQuickPayMode(false)}
                    className="text-sm text-text-med hover:text-text-high"
                  >
                    Cancel
                  </button>
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-med mb-2">
                    Destination Address
                  </label>
                  <input
                    type="text"
                    value={quickPayAddress}
                    onChange={(e) => setQuickPayAddress(e.target.value)}
                    placeholder="rXXXX..."
                    className="w-full px-4 py-3 bg-surface-700 border border-surface-700 rounded-xl text-text-high placeholder-text-low focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 transition-all font-mono"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-med mb-2">
                    Amount (XRP)
                  </label>
                  <input
                    type="number"
                    value={quickPayAmount}
                    onChange={(e) => setQuickPayAmount(e.target.value)}
                    placeholder="0.00"
                    min="0"
                    step="0.000001"
                    className="w-full px-4 py-3 bg-surface-700 border border-surface-700 rounded-xl text-text-high placeholder-text-low focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 transition-all"
                  />
                </div>

                <button
                  onClick={handleQuickPay}
                  disabled={!quickPayAddress || !quickPayAmount}
                  className="w-full py-4 rounded-xl font-semibold text-white bg-primary-500 hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  Continue
                </button>

                {error && (
                  <div className="p-4 bg-error/10 border border-error/30 rounded-xl flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-error flex-shrink-0 mt-0.5" />
                    <p className="text-error text-sm">{error}</p>
                  </div>
                )}
              </div>
            )}

            {/* Scanned - Confirm Payment */}
            {status === 'scanned' && parsedPayment && (
              <div className="p-6 bg-surface-800 rounded-2xl border border-surface-700 space-y-4">
                <h3 className="text-lg font-semibold text-text-high text-center">Confirm Payment</h3>

                <div className="p-4 bg-surface-700/50 rounded-xl space-y-3">
                  <div className="flex justify-between">
                    <span className="text-text-low">To</span>
                    <span className="font-mono text-text-high">{truncateAddress(parsedPayment.destination)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-low">Amount</span>
                    <span className="text-text-high font-semibold">{parsedPayment.amount} {parsedPayment.currency}</span>
                  </div>
                  {parsedPayment.memo && (
                    <div className="flex justify-between">
                      <span className="text-text-low">Memo</span>
                      <span className="text-text-med text-sm">{parsedPayment.memo}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-text-low">Network Fee</span>
                    <span className="text-text-med">~0.00001 XRP</span>
                  </div>
                </div>

                {!hasSufficientBalance() && (
                  <div className="p-4 bg-warning/10 border border-warning/30 rounded-xl flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-warning flex-shrink-0 mt-0.5" />
                    <p className="text-warning text-sm">
                      Insufficient balance. You need at least {parsedPayment.amount} XRP + 10 XRP reserve.
                    </p>
                  </div>
                )}

                <div className="flex gap-3">
                  <button
                    onClick={handleReset}
                    className="flex-1 py-3 rounded-xl font-semibold text-text-med border border-surface-700 hover:bg-surface-700 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleConfirmPayment}
                    disabled={!hasSufficientBalance()}
                    className="flex-1 py-3 rounded-xl font-semibold text-white bg-primary-500 hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                  >
                    <Send className="w-4 h-4" />
                    Send
                  </button>
                </div>
              </div>
            )}

            {/* Confirming/Signing State */}
            {(status === 'confirming' || status === 'signing') && (
              <div className="p-6 bg-surface-800 rounded-2xl border border-surface-700 text-center">
                <Loader2 className="w-12 h-12 text-primary-500 animate-spin mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-text-high mb-2">
                  {status === 'confirming' ? 'Preparing Transaction...' : 'Sign in your wallet'}
                </h3>
                <p className="text-text-med text-sm">
                  {status === 'signing' && 'Please approve the transaction in your wallet app'}
                </p>
              </div>
            )}

            {/* Success State */}
            {status === 'success' && parsedPayment && (
              <PaymentConfirmation
                amount={parsedPayment.amount}
                currency={parsedPayment.currency}
                destination={parsedPayment.destination}
                txHash={txHash || undefined}
                onReset={handleReset}
              />
            )}

            {/* Error State */}
            {status === 'error' && (
              <div className="p-6 bg-surface-800 rounded-2xl border border-error/50 text-center">
                <div className="w-16 h-16 rounded-full bg-error/20 flex items-center justify-center mx-auto mb-4">
                  <AlertCircle className="w-8 h-8 text-error" />
                </div>
                <h3 className="text-2xl font-bold text-error mb-2">Payment Failed</h3>
                <p className="text-text-med mb-6">{error || 'Something went wrong. Please try again.'}</p>

                <button
                  onClick={handleReset}
                  className="w-full py-4 rounded-xl font-semibold text-white bg-primary-500 hover:bg-primary-600 transition-all"
                >
                  Try Again
                </button>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
