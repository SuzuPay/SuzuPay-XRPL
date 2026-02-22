'use client';

import { useState } from 'react';
import { Wallet, QrCode, Send, AlertCircle, Loader2, Camera } from 'lucide-react';
import { useWallet } from '@/lib/wallet-context';
import { PageHeader } from '@/components/page-header';
import { WalletConnectButton } from '@/components/wallet-connect-button';
import { truncateAddress, formatXRP } from '@/lib/utils';
import { parsePaymentRequest, isValidXRPLAddress } from '@/lib/payment-request';
import { buildPaymentTx } from '@/lib/payment';
import { PaymentConfirmation } from '@/components/payment-confirmation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';

type PaymentStatus = 'idle' | 'scanned' | 'confirming' | 'signing' | 'success' | 'error';

interface ParsedPayment {
  destination: string;
  amount: string;
  currency: string;
  issuer?: string;
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
      issuer: parsed.issuer,
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

      const payment = buildPaymentTx({
        source: address,
        destination: parsedPayment.destination,
        amount: parsedPayment.amount,
        currency: parsedPayment.currency,
        issuer: parsedPayment.issuer,
        memo: parsedPayment.memo
      });

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
    
    // For hackathon scope, bypass strict balance checks for issued currencies 
    // since we can't synchronously check non-XRP token balance easily here.
    if (parsedPayment.currency !== 'XRP') return true;

    const balanceNum = parseFloat(balance);
    const amountNum = parseFloat(parsedPayment.amount);
    return balanceNum >= amountNum + 3.00001; // Base reserve buffer
  };

  return (
    <div className="min-h-screen bg-bg-900" suppressHydrationWarning>
      {/* Header */}
      <PageHeader title="Pay" icon />

      <main className="container mx-auto px-4 py-8 max-w-md">
        {!isConnected ? (
          /* Not Connected State */
          <div className="text-center py-16 animate-fade-in">
            <div className="w-20 h-20 rounded-full bg-surface-800 border border-surface-700 flex items-center justify-center mx-auto mb-6">
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
            <Card className="glass-card border-0">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-text-low mb-1 font-medium uppercase tracking-wider">Your Balance</p>
                    <p className="text-2xl font-bold text-text-high drop-shadow-md">
                      {balance ? formatXRP(balance) : '0'} <span className="text-sm text-text-med font-normal">XRP</span>
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-text-low mb-1 font-medium uppercase tracking-wider">Address</p>
                    <p className="font-mono text-sm text-text-med bg-surface-900/50 px-2 py-1 rounded-md border border-white/5">{truncateAddress(address!)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Idle State - Scan/Enter QR */}
            {status === 'idle' && !quickPayMode && (
              <div className="space-y-4 animate-fade-in">
                <Card className="glass-card border-0 shadow-lg shadow-primary-500/5">
                  <CardHeader>
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-primary-500/15 flex items-center justify-center glow-primary">
                        <Camera className="w-6 h-6 text-primary-500" />
                      </div>
                      <div>
                        <CardTitle className="text-xl font-bold">Scan QR Code</CardTitle>
                        <CardDescription className="text-text-med">Paste payment QR data below</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <textarea
                      value={manualQRInput}
                      onChange={(e) => setManualQRInput(e.target.value)}
                      placeholder="Paste Xaman URL or payment JSON here..."
                      rows={4}
                      className="w-full px-4 py-3 bg-surface-900/50 border border-white/5 rounded-xl text-text-high placeholder-text-low focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 transition-all resize-none font-mono text-sm"
                    />

                    <Button
                      onClick={handleParseQR}
                      disabled={!manualQRInput.trim()}
                      className="w-full h-12 rounded-xl font-semibold bg-linear-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white shadow-lg shadow-primary-500/20 gap-2 transition-all hover:scale-[1.02]"
                    >
                      <QrCode className="w-5 h-5" />
                      Parse Payment
                    </Button>
                  </CardContent>
                </Card>

                <div className="flex items-center gap-4 my-2">
                  <Separator className="flex-1 bg-surface-700/50" />
                  <span className="text-text-low text-xs uppercase tracking-widest font-medium">or</span>
                  <Separator className="flex-1 bg-surface-700/50" />
                </div>

                <Button
                  variant="outline"
                  onClick={() => setQuickPayMode(true)}
                  className="w-full h-12 rounded-xl font-semibold border-2 border-surface-700 bg-transparent text-text-high hover:bg-surface-800 hover:border-surface-600 transition-all"
                >
                  Enter Payment Manually
                </Button>

                {error && (
                  <Card className="glass-card border-l-4 border-l-[rgb(var(--color-error))] bg-[rgb(var(--color-error))]/5">
                    <CardContent className="p-4 flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-error shrink-0 mt-0.5" />
                      <p className="text-error text-sm font-medium">{error}</p>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}

            {/* Quick Pay Mode - Manual Entry */}
            {quickPayMode && (status === 'idle') && (
              <Card className="glass-card border-0 animate-fade-in">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-xl font-bold">Quick Pay</CardTitle>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setQuickPayMode(false)}
                      className="text-text-med hover:text-text-high hover:bg-surface-800"
                    >
                      Cancel
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-text-med mb-2">
                      Destination Address
                    </label>
                    <Input
                      type="text"
                      value={quickPayAddress}
                      onChange={(e) => setQuickPayAddress(e.target.value)}
                      placeholder="rXXXX..."
                      className="bg-surface-900/50 border-white/5 text-text-high placeholder:text-text-low focus:border-primary-500 focus-visible:ring-primary-500/20 h-12 rounded-xl font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-text-med mb-2">
                      Amount (XRP)
                    </label>
                    <Input
                      type="number"
                      value={quickPayAmount}
                      onChange={(e) => setQuickPayAmount(e.target.value)}
                      placeholder="0.00"
                      min="0"
                      step="0.000001"
                      className="bg-surface-900/50 border-white/5 text-text-high placeholder:text-text-low focus:border-primary-500 focus-visible:ring-primary-500/20 h-12 rounded-xl"
                    />
                  </div>

                  <Button
                    onClick={handleQuickPay}
                    disabled={!quickPayAddress || !quickPayAmount}
                    className="w-full h-12 rounded-xl font-semibold bg-linear-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white shadow-lg shadow-primary-500/20 transition-all hover:scale-[1.02]"
                  >
                    Continue
                  </Button>

                  {error && (
                    <Card className="glass-card border-l-4 border-l-[rgb(var(--color-error))] bg-[rgb(var(--color-error))]/5">
                      <CardContent className="p-4 flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-error shrink-0 mt-0.5" />
                        <p className="text-error text-sm font-medium">{error}</p>
                      </CardContent>
                    </Card>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Scanned - Confirm Payment */}
            {status === 'scanned' && parsedPayment && (
              <Card className="glass-card border-0 animate-fade-in shadow-2xl shadow-primary-500/10">
                <CardHeader className="text-center pb-2">
                  <div className="w-16 h-16 rounded-full bg-surface-900/50 flex items-center justify-center mx-auto mb-4 border border-white/5">
                    <Send className="w-8 h-8 text-primary-500" />
                  </div>
                  <CardTitle className="text-xl font-bold">Confirm Payment</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="p-5 bg-surface-900/60 rounded-2xl space-y-4 border border-white/5">
                    <div className="flex justify-between items-center">
                      <span className="text-text-low text-sm font-medium">To</span>
                      <span className="font-mono text-text-high bg-surface-800 px-2 py-1 rounded text-sm">{truncateAddress(parsedPayment.destination)}</span>
                    </div>
                    <Separator className="bg-white/5" />
                    <div className="flex justify-between items-center">
                      <span className="text-text-low text-sm font-medium">Amount</span>
                      <span className="text-text-high font-bold text-lg">{parsedPayment.amount} <span className="text-sm font-normal text-text-med">{parsedPayment.currency}</span></span>
                    </div>
                    {parsedPayment.memo && (
                      <>
                      <Separator className="bg-white/5" />
                      <div className="flex justify-between items-center">
                        <span className="text-text-low text-sm font-medium">Memo</span>
                        <span className="text-text-med text-sm italic">{parsedPayment.memo}</span>
                      </div>
                      </>
                    )}
                    <Separator className="bg-white/5" />
                    <div className="flex justify-between items-center">
                      <span className="text-text-low text-sm font-medium">Network Fee</span>
                      <span className="text-text-med text-xs">~0.00001 XRP</span>
                    </div>
                  </div>

                  {!hasSufficientBalance() && (
                    <Card className="glass-card border-l-4 border-l-[rgb(var(--color-warning))] bg-[rgb(var(--color-warning))]/5">
                      <CardContent className="p-4 flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-warning shrink-0 mt-0.5" />
                        <p className="text-warning text-sm font-medium">
                          Insufficient balance. You need at least {parsedPayment.amount} XRP + 3 XRP reserve.
                        </p>
                      </CardContent>
                    </Card>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <Button
                      variant="outline"
                      onClick={handleReset}
                      className="h-12 rounded-xl font-semibold border-surface-700 text-text-med hover:bg-surface-800 hover:text-text-high transition-colors"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleConfirmPayment}
                      disabled={!hasSufficientBalance()}
                      className="h-12 rounded-xl font-bold bg-primary-500 hover:bg-primary-600 text-white gap-2 shadow-lg shadow-primary-500/20 transition-all hover:scale-105"
                    >
                      <Send className="w-4 h-4" />
                      Send Now
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Confirming/Signing State */}
            {(status === 'confirming' || status === 'signing') && (
              <Card className="glass-card border-0 animate-pulse">
                <CardContent className="p-8 text-center">
                  <div className="relative w-16 h-16 mx-auto mb-6">
                    <div className="absolute inset-0 rounded-full border-4 border-primary-500/30"></div>
                    <div className="absolute inset-0 rounded-full border-4 border-t-primary-500 animate-spin"></div>
                    <Loader2 className="absolute inset-0 m-auto w-8 h-8 text-primary-500 animate-pulse" />
                  </div>
                  <h3 className="text-xl font-bold text-text-high mb-2">
                    {status === 'confirming' ? 'Preparing Transaction...' : 'Check Your Wallet'}
                  </h3>
                  <p className="text-text-med text-sm max-w-xs mx-auto">
                    {status === 'confirming' 
                      ? 'Constructing the payment on XRPL...' 
                      : 'A sign request has been sent to your connected wallet. Please approve it to continue.'}
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Success State handled by Component */}

            {/* Error State */}
            {status === 'error' && (
              <Card className="glass-card border-l-4 border-l-[rgb(var(--color-error))] bg-[rgb(var(--color-error))]/5 shadow-2xl shadow-[rgb(var(--color-error))]/5 animate-fade-in">
                <CardContent className="p-8 text-center">
                  <div className="w-20 h-20 rounded-full bg-[rgb(var(--color-error))]/10 flex items-center justify-center mx-auto mb-6 glow-text text-error">
                    <AlertCircle className="w-10 h-10" />
                  </div>
                  <h3 className="text-2xl font-bold text-error mb-2">Payment Failed</h3>
                  <p className="text-text-med mb-8 leading-relaxed max-w-xs mx-auto">{error || 'Something went wrong. Please try again.'}</p>

                  <Button
                    onClick={handleReset}
                    className="w-full h-12 rounded-xl font-bold bg-surface-800 hover:bg-surface-700 text-text-high border border-white/5 transition-all"
                  >
                    Try Again
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
