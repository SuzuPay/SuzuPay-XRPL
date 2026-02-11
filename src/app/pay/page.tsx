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

      const payment = buildPaymentTx({
        source: address,
        destination: parsedPayment.destination,
        amount: parsedPayment.amount,
        currency: 'XRP',
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
    const balanceNum = parseFloat(balance);
    const amountNum = parseFloat(parsedPayment.amount);
    return balanceNum >= amountNum + 10.00001;
  };

  return (
    <div className="min-h-screen bg-bg-900">
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
            <Card className="bg-surface-800 border-surface-700">
              <CardContent className="p-4">
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
              </CardContent>
            </Card>

            {/* Idle State - Scan/Enter QR */}
            {status === 'idle' && !quickPayMode && (
              <div className="space-y-4">
                <Card className="bg-surface-800 border-surface-700">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-primary-500/15 flex items-center justify-center">
                        <Camera className="w-5 h-5 text-primary-500" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">Scan QR Code</CardTitle>
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
                      className="w-full px-4 py-3 bg-surface-700 border border-surface-700 rounded-xl text-text-high placeholder-text-low focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 transition-all resize-none font-mono text-sm"
                    />

                    <Button
                      onClick={handleParseQR}
                      disabled={!manualQRInput.trim()}
                      className="w-full h-12 rounded-xl font-semibold bg-primary-500 hover:bg-primary-600 text-white shadow-lg shadow-[rgba(255,79,112,0.2)] gap-2"
                    >
                      <QrCode className="w-5 h-5" />
                      Parse Payment
                    </Button>
                  </CardContent>
                </Card>

                <div className="flex items-center gap-4">
                  <Separator className="flex-1 bg-surface-700" />
                  <span className="text-text-low text-sm">or</span>
                  <Separator className="flex-1 bg-surface-700" />
                </div>

                <Button
                  variant="outline"
                  onClick={() => setQuickPayMode(true)}
                  className="w-full h-12 rounded-xl font-semibold border-surface-700 text-text-high hover:bg-surface-800"
                >
                  Enter Payment Manually
                </Button>

                {error && (
                  <Card className="bg-[rgb(var(--color-error))]/10 border-[rgb(var(--color-error))]/30">
                    <CardContent className="p-4 flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-error flex-shrink-0 mt-0.5" />
                      <p className="text-error text-sm">{error}</p>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}

            {/* Quick Pay Mode - Manual Entry */}
            {status === 'idle' && quickPayMode && (
              <Card className="bg-surface-800 border-surface-700">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">Quick Pay</CardTitle>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setQuickPayMode(false)}
                      className="text-text-med hover:text-text-high"
                    >
                      Cancel
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-text-med mb-2">
                      Destination Address
                    </label>
                    <Input
                      type="text"
                      value={quickPayAddress}
                      onChange={(e) => setQuickPayAddress(e.target.value)}
                      placeholder="rXXXX..."
                      className="bg-surface-700 border-surface-700 text-text-high placeholder:text-text-low focus:border-primary-500 focus-visible:ring-primary-500/20 h-12 rounded-xl font-mono"
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
                      className="bg-surface-700 border-surface-700 text-text-high placeholder:text-text-low focus:border-primary-500 focus-visible:ring-primary-500/20 h-12 rounded-xl"
                    />
                  </div>

                  <Button
                    onClick={handleQuickPay}
                    disabled={!quickPayAddress || !quickPayAmount}
                    className="w-full h-12 rounded-xl font-semibold bg-primary-500 hover:bg-primary-600 text-white shadow-lg shadow-[rgba(255,79,112,0.2)]"
                  >
                    Continue
                  </Button>

                  {error && (
                    <Card className="bg-[rgb(var(--color-error))]/10 border-[rgb(var(--color-error))]/30">
                      <CardContent className="p-4 flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-error flex-shrink-0 mt-0.5" />
                        <p className="text-error text-sm">{error}</p>
                      </CardContent>
                    </Card>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Scanned - Confirm Payment */}
            {status === 'scanned' && parsedPayment && (
              <Card className="bg-surface-800 border-surface-700">
                <CardHeader className="text-center">
                  <CardTitle className="text-lg">Confirm Payment</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
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
                    <Card className="bg-[rgb(var(--color-warning))]/10 border-[rgb(var(--color-warning))]/30">
                      <CardContent className="p-4 flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-warning flex-shrink-0 mt-0.5" />
                        <p className="text-warning text-sm">
                          Insufficient balance. You need at least {parsedPayment.amount} XRP + 10 XRP reserve.
                        </p>
                      </CardContent>
                    </Card>
                  )}

                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      onClick={handleReset}
                      className="flex-1 h-12 rounded-xl font-semibold border-surface-700 text-text-med hover:bg-surface-700"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleConfirmPayment}
                      disabled={!hasSufficientBalance()}
                      className="flex-1 h-12 rounded-xl font-semibold bg-primary-500 hover:bg-primary-600 text-white gap-2"
                    >
                      <Send className="w-4 h-4" />
                      Send
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Confirming/Signing State */}
            {(status === 'confirming' || status === 'signing') && (
              <Card className="bg-surface-800 border-surface-700">
                <CardContent className="p-6 text-center">
                  <Loader2 className="w-12 h-12 text-primary-500 animate-spin mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-text-high mb-2">
                    {status === 'confirming' ? 'Preparing Transaction...' : 'Sign in your wallet'}
                  </h3>
                  <p className="text-text-med text-sm">
                    {status === 'signing' && 'Please approve the transaction in your wallet app'}
                  </p>
                </CardContent>
              </Card>
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
              <Card className="bg-surface-800 border-[rgb(var(--color-error))]/50">
                <CardContent className="p-6 text-center">
                  <div className="w-16 h-16 rounded-full bg-[rgb(var(--color-error))]/15 flex items-center justify-center mx-auto mb-4">
                    <AlertCircle className="w-8 h-8 text-error" />
                  </div>
                  <h3 className="text-2xl font-bold text-error mb-2">Payment Failed</h3>
                  <p className="text-text-med mb-6">{error || 'Something went wrong. Please try again.'}</p>

                  <Button
                    onClick={handleReset}
                    className="w-full h-12 rounded-xl font-semibold bg-primary-500 hover:bg-primary-600 text-white"
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
