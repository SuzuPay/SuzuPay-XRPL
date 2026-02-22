'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Wallet, QrCode, Copy, Check, RefreshCw, ExternalLink, Activity, Rocket, TrendingUp, Clock, CheckCircle2 } from 'lucide-react';
import { QRGenerator } from '@/components/qr-generator';
import { useWallet } from '@/lib/wallet-context';
import { PageHeader } from '@/components/page-header';
import { WalletConnectButton } from '@/components/wallet-connect-button';
import { truncateAddress, formatXRP } from '@/lib/utils';
import { generateXamanPaymentURL, generateGenericPaymentRequest, generatePaymentId } from '@/lib/payment-request';
import { subscribeToAccount } from '@/lib/xrpl-client';
import { 
  ensureDefaultRipple,
  constructSellOfferTx,
  getAccountTokens,
  TokenInfo,
  hasTrustLine,
  constructTrustSetTx,
  RLUSD_CONFIG
} from '@/lib/token-utils';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';

export interface PaymentRequestRecord {
  id: string;
  amount: string;
  currency: string;
  description: string | null;
  status: string;
  txHash: string | null;
  createdAt: string;
}

type PaymentStatus = 'idle' | 'waiting' | 'received' | 'expired';

const XRPL_CLASSIC_ADDRESS_REGEX = /^r[1-9A-HJ-NP-Za-km-z]{24,34}$/;

interface PendingPayment {
  id: string;
  dbId: string;
  amount: string;
  description: string;
  xamanUrl: string;
  genericQR: string;
  createdAt: Date;
  expiresAt: Date;
}

export default function MerchantPage() {
  const { isConnected, address, balance, signAndSubmit } = useWallet();
  const normalizedAddress = (address || '').trim();
  const hasValidAddress = XRPL_CLASSIC_ADDRESS_REGEX.test(normalizedAddress);
  const [activeTab, setActiveTab] = useState<'payments' | 'financing'>('payments');
  
  // Payment State
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [pendingPayment, setPendingPayment] = useState<PendingPayment | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>('idle');
  const [copied, setCopied] = useState(false);
  const [qrType, setQrType] = useState<'xaman' | 'generic'>('xaman');
  const [receivedAmount, setReceivedAmount] = useState<string | null>(null);
  const [receivedTxHash, setReceivedTxHash] = useState<string | null>(null);
  const [recentPayments, setRecentPayments] = useState<PaymentRequestRecord[]>([]);
  const [loadingPayments, setLoadingPayments] = useState(false);

  // Financing State
  const [financingGoal, setFinancingGoal] = useState('');
  const [isIssuingToken, setIsIssuingToken] = useState(false);
  const [tokenData, setTokenData] = useState<TokenInfo | null>(null);
  const [isLoadingToken, setIsLoadingToken] = useState(false);

  // Profile State
  const [hasProfile, setHasProfile] = useState<boolean | null>(null);
  const [checkingProfile, setCheckingProfile] = useState(false);
  const [businessName, setBusinessName] = useState('');
  const [email, setEmail] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileError, setProfileError] = useState('');

  // RLUSD State
  const [hasRlusdTrustline, setHasRlusdTrustline] = useState<boolean | null>(null);
  const [isEnablingRlusd, setIsEnablingRlusd] = useState(false);
  const [paymentCurrency, setPaymentCurrency] = useState<'XRP' | 'RLUSD'>('XRP');

  // Ref guard to prevent double-fetching (state guard in deps caused cleanup race)
  const fetchingRef = useRef(false);

  // Check merchant profile on connect
  useEffect(() => {
    let mounted = true;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    const controller = new AbortController();

    if (isConnected && normalizedAddress && hasProfile === null && !fetchingRef.current) {
      if (!hasValidAddress) {
        setHasProfile(false);
        setProfileError('Connected wallet returned an invalid XRPL address. Please reconnect your wallet.');
        return () => {
          mounted = false;
        };
      }

      fetchingRef.current = true;
      setCheckingProfile(true);
      timeoutId = setTimeout(() => controller.abort(), 10000);

      fetch(`/api/merchant/${normalizedAddress}`, { signal: controller.signal })
        .then(async (res) => {
          if (!mounted) return;

          const data = await res.json().catch(() => null);

          if (res.ok) {
            setHasProfile(Boolean(data?.exists));
            if (data?.exists) {
              fetchRecentPayments(normalizedAddress);
            }
          } else {
            setHasProfile(false);
            setProfileError(data?.error || 'Failed to load merchant profile');
          }
        })
        .catch((err) => {
          if (!mounted) return;
          setHasProfile(false);
          if (err?.name !== 'AbortError') {
            setProfileError('Network error while loading profile. Please try again.');
          }
        })
        .finally(() => {
          if (timeoutId) clearTimeout(timeoutId);
          fetchingRef.current = false;
          if (mounted) setCheckingProfile(false);
        });
    }
    return () => {
      mounted = false;
      controller.abort();
      if (timeoutId) clearTimeout(timeoutId);
    };
    // checkingProfile intentionally excluded — using fetchingRef to prevent feedback loop
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isConnected, normalizedAddress, hasValidAddress, hasProfile]);

  const fetchRecentPayments = async (address: string) => {
    setLoadingPayments(true);
    try {
      const res = await fetch(`/api/payments?merchantAddress=${address}`);
      if (res.ok) {
        const data = await res.json();
        setRecentPayments(data.paymentRequests || []);
      }
    } catch (err) {
      console.error("Failed to fetch recent payments", err);
    } finally {
      setLoadingPayments(false);
    }
  };

  useEffect(() => {
    if (!isConnected) {
      setHasProfile(null);
      setCheckingProfile(false);
      setProfileError('');
      return;
    }

    if (!normalizedAddress || !hasValidAddress) {
      setHasProfile(false);
      if (normalizedAddress) {
        setProfileError('Invalid XRPL address from wallet. Disconnect and reconnect Crossmark.');
      }
      return;
    }

    setProfileError('');
  }, [isConnected, normalizedAddress, hasValidAddress]);

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!businessName.trim()) {
      setProfileError("Business Name is required");
      return;
    }
    setSavingProfile(true);
    setProfileError('');
    try {
      const res = await fetch('/api/merchant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ walletAddress: address, businessName, email })
      });
      if (res.ok) {
        setHasProfile(true);
      } else {
        const data = await res.json();
        setProfileError(data.error || "Failed to save profile");
      }
    } catch (err) {
      setProfileError("Network error. Please try again.");
    } finally {
      setSavingProfile(false);
    }
  };

  // Poll for existing MPT and RLUSD lines on load
  useEffect(() => {
    if (normalizedAddress && isConnected) {
      if (!hasValidAddress) {
        setHasRlusdTrustline(false);
        setIsLoadingToken(false);
        return;
      }

      setIsLoadingToken(true);
      let cancelled = false;
      
      // Check RLUSD Trustline
      hasTrustLine(normalizedAddress, RLUSD_CONFIG)
        .then(res => {
          if (!cancelled) setHasRlusdTrustline(res);
        })
        .catch((error) => {
          if (!cancelled) {
            setHasRlusdTrustline(false);
            console.error(error);
          }
        });

      // Check MPT/Tokens
      getAccountTokens(normalizedAddress)
        .then(tokens => {
          if (cancelled) return;
          const fundToken = tokens.find(t => t.currency === 'SZP' || t.currency.startsWith('SZP'));
          if (fundToken) {
            setTokenData(fundToken);
          }
        })
        .catch((error) => {
          if (!cancelled) console.error(error);
        })
        .finally(() => {
          if (!cancelled) setIsLoadingToken(false);
        });

      return () => {
        cancelled = true;
      };
    }
  }, [normalizedAddress, hasValidAddress, isConnected]);

  const handleEnableRlusd = async () => {
    if (!normalizedAddress || !hasValidAddress) {
      setProfileError('Wallet address is invalid. Please reconnect your wallet.');
      return;
    }
    setIsEnablingRlusd(true);
    try {
      const tx = constructTrustSetTx(normalizedAddress, RLUSD_CONFIG);
      await signAndSubmit(tx);
      // Once signed, update local state
      setHasRlusdTrustline(true);
    } catch (err) {
      console.error("Failed to enable RLUSD", err);
    } finally {
      setIsEnablingRlusd(false);
    }
  };

  // Subscribe to incoming payments when waiting
  useEffect(() => {
    if (!normalizedAddress || paymentStatus !== 'waiting' || !pendingPayment || !hasValidAddress) return;

    let unsubscribe: (() => void) | null = null;
    
    const startSubscription = async () => {
      try {
        unsubscribe = await subscribeToAccount(normalizedAddress, (tx) => {
          if (tx.transaction?.TransactionType === 'Payment' && 
              tx.transaction?.Destination === normalizedAddress &&
              tx.validated) {
            
            const receivedDrops = tx.transaction.Amount;
            const receivedXRP = typeof receivedDrops === 'string' 
              ? (parseInt(receivedDrops) / 1_000_000).toString()
              : '0';
            
            const expectedAmount = parseFloat(pendingPayment.amount);
            const actualAmount = parseFloat(receivedXRP);
            
            if (actualAmount >= expectedAmount * 0.99) {
              setReceivedAmount(receivedXRP);
              setReceivedTxHash(tx.transaction.hash);
              setPaymentStatus('received');
              
              // Update DB to completed
              fetch(`/api/payments/${pendingPayment.dbId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                  status: 'completed', 
                  txHash: tx.transaction.hash 
                })
              }).then(() => fetchRecentPayments(normalizedAddress));
            }
          }
        });
      } catch (error) {
        console.error('Failed to subscribe to account:', error);
      }
    };

    startSubscription();

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [normalizedAddress, hasValidAddress, paymentStatus, pendingPayment]);

  // Timer for payment expiry
  useEffect(() => {
    if (!pendingPayment || paymentStatus !== 'waiting') return;

    const checkExpiry = setInterval(() => {
      if (new Date() > pendingPayment.expiresAt) {
        setPaymentStatus('expired');
        clearInterval(checkExpiry);
        
        // Update DB to expired
        fetch(`/api/payments/${pendingPayment.dbId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'expired' })
        }).then(() => fetchRecentPayments(normalizedAddress));
      }
    }, 1000);

    return () => clearInterval(checkExpiry);
  }, [pendingPayment, paymentStatus, normalizedAddress]);

  const handleGenerateQR = useCallback(async () => {
    if (!amount || parseFloat(amount) <= 0 || !normalizedAddress || !hasValidAddress) return;

    const paymentId = generatePaymentId();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    const xamanPayment = generateXamanPaymentURL(normalizedAddress, amount, {
      network: 'XRPL',
      currency: paymentCurrency === 'RLUSD' ? RLUSD_CONFIG.currency : 'XRP',
      issuer: paymentCurrency === 'RLUSD' ? RLUSD_CONFIG.issuer : undefined,
    });

    const genericQR = generateGenericPaymentRequest(normalizedAddress, amount, {
      memo: description || `SuzuPay Payment ${paymentId}`,
      currency: paymentCurrency === 'RLUSD' ? RLUSD_CONFIG.currency : 'XRP',
      issuer: paymentCurrency === 'RLUSD' ? RLUSD_CONFIG.issuer : undefined,
    });

    try {
      // Create backend record
      const res = await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          merchantAddress: normalizedAddress,
          amount,
          currency: paymentCurrency,
          description: description || `SuzuPay Payment ${paymentId}`,
          expiresAt: expiresAt.toISOString()
        })
      });
      
      if (!res.ok) throw new Error('Failed to create payment record');
      const dbRecord = await res.json();

      setPendingPayment({
        id: paymentId,
        dbId: dbRecord.id,
        amount,
        description,
        xamanUrl: xamanPayment.qrData,
        genericQR,
        createdAt: new Date(),
        expiresAt,
      });
      setPaymentStatus('waiting');
      fetchRecentPayments(normalizedAddress);
    } catch (err) {
      console.error('Failed to generate payment:', err);
      alert('Failed to initialize payment tracking. Please try again.');
    }
  }, [amount, description, normalizedAddress, hasValidAddress, paymentCurrency]);

  const handleCopyAddress = async () => {
    if (normalizedAddress) {
      await navigator.clipboard.writeText(normalizedAddress);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleCopyQR = async () => {
    if (pendingPayment) {
      const data = qrType === 'xaman' ? pendingPayment.xamanUrl : pendingPayment.genericQR;
      await navigator.clipboard.writeText(data);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleReset = () => {
    setPendingPayment(null);
    setPaymentStatus('idle');
    setAmount('');
    setDescription('');
    setReceivedAmount(null);
    setReceivedTxHash(null);
  };

  // Re-open a pending payment from Recent Transactions to show QR again
  const handleReopenPayment = useCallback((payment: PaymentRequestRecord) => {
    if (payment.status !== 'pending' || !normalizedAddress) return;

    const currencyHex = payment.currency === 'RLUSD' ? RLUSD_CONFIG.currency : 'XRP';
    const issuer = payment.currency === 'RLUSD' ? RLUSD_CONFIG.issuer : undefined;

    const xamanPayment = generateXamanPaymentURL(normalizedAddress, payment.amount, {
      network: 'XRPL',
      currency: currencyHex,
      issuer,
    });

    const genericQR = generateGenericPaymentRequest(normalizedAddress, payment.amount, {
      memo: payment.description || `SuzuPay Payment`,
      currency: currencyHex,
      issuer,
    });

    // Refresh expiry to 15 minutes from NOW so the reopened QR can be scanned
    const now = new Date();
    const created = new Date(payment.createdAt);
    const expiresAt = new Date(now.getTime() + 15 * 60 * 1000);

    setPendingPayment({
      id: payment.id,
      dbId: payment.id,
      amount: payment.amount,
      description: payment.description || '',
      xamanUrl: xamanPayment.qrData,
      genericQR,
      createdAt: created,
      expiresAt,
    });
    setPaymentStatus('waiting');
  }, [normalizedAddress]);

  const getTimeRemaining = () => {
    if (!pendingPayment) return '';
    const now = new Date();
    const diff = pendingPayment.expiresAt.getTime() - now.getTime();
    if (diff <= 0) return 'Expired';
    const minutes = Math.floor(diff / 60000);
    const seconds = Math.floor((diff % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // --- Financing Handlers ---

  const handleStartFinancing = async () => {
    if (!normalizedAddress || !hasValidAddress || !financingGoal) {
      if (!hasValidAddress) {
        setProfileError('Wallet address is invalid. Please reconnect your wallet.');
      }
      return;
    }
    
    setIsIssuingToken(true);
    try {
      console.log('[Merchant] 1. Configuring Account (DefaultRipple)...');
      
      // Step 1: Enable DefaultRipple if needed
      const rippleTx = await ensureDefaultRipple(normalizedAddress);
      if (rippleTx) {
        await signAndSubmit(rippleTx);
        console.log('[Merchant] Account Configured (DefaultRipple Enabled)');
      } else {
        console.log('[Merchant] Account already has DefaultRipple enabled');
      }

      console.log('[Merchant] 2. Creating Sell Offer (Initial Liquidity)...');
      
      // Define Token
      const token: TokenInfo = {
        currency: 'SZP', // Standard 3-char code
        issuer: normalizedAddress,
        value: '0' // Not used in offer construction directly
      };

      // Step 2: Create Sell Offer
      // Selling 1,000,000 SZP for the requested financing amount in XRP
      const sellOfferTx = constructSellOfferTx(
        normalizedAddress,
        token,
        "1000000", 
        financingGoal // Amount of XRP we want
      );
      
      await signAndSubmit(sellOfferTx);
      console.log('[Merchant] Sell Offer Created Successfully');
      
      // Update local state
      setTokenData({
        ...token,
        value: "1000000"
      });
      
      alert('Successfully launched financing campaign!');

    } catch (error) {
      console.error('Financing error:', error);
      alert('Failed to start campaign. See console.');
    } finally {
      setIsIssuingToken(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg-900" suppressHydrationWarning>
      {/* Header */}
      <PageHeader title="Merchant Portal" icon />

      <main className="container mx-auto px-4 py-8 max-w-2xl">
        {!isConnected ? (
          /* Not Connected State */
          <div className="text-center py-16 animate-fade-in">
            <div className="w-20 h-20 rounded-full bg-surface-800 border border-surface-700 flex items-center justify-center mx-auto mb-6">
              <Wallet className="w-10 h-10 text-text-low" />
            </div>
            <h2 className="text-2xl font-bold text-text-high mb-4">Connect Your Wallet</h2>
            <p className="text-text-med mb-8 max-w-md mx-auto">
              Connect your XRPL wallet to start receiving payments and raise capital
            </p>
            <WalletConnectButton />
          </div>
        ) : checkingProfile || hasProfile === null ? (
          /* Loading Profile State */
          <div className="text-center py-16 animate-pulse">
            <div className="w-16 h-16 rounded-full border-4 border-[rgb(var(--color-primary))] border-t-transparent animate-spin mx-auto mb-6"></div>
            <h2 className="text-xl font-bold text-text-high">Loading Profile...</h2>
          </div>
        ) : hasProfile === false ? (
          /* Missing Profile State */
          <Card className="glass-card border-0 max-w-md mx-auto mt-8 animate-fade-in">
            <CardHeader>
              <CardTitle className="text-2xl font-bold text-center text-text-high">Complete Profile</CardTitle>
              <CardDescription className="text-center text-text-med">Set up your merchant details to proceed</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleProfileSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-text-med mb-2">Business Name <span className="text-[rgb(var(--color-primary))]">*</span></label>
                  <Input 
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    placeholder="e.g. Suzu Sushi"
                    className="bg-surface-800 border-surface-700 text-text-high" 
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-med mb-2">Email (Optional)</label>
                  <Input 
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="contact@example.com"
                    className="bg-surface-800 border-surface-700 text-text-high" 
                  />
                </div>
                {profileError && <p className="text-[rgb(var(--color-primary))] text-sm">{profileError}</p>}
                <Button 
                  type="submit" 
                  disabled={savingProfile}
                  className="w-full bg-[rgb(var(--color-primary))] hover:bg-[rgb(var(--color-primary))]/90 text-white mt-4 font-bold rounded-xl h-12"
                >
                  {savingProfile ? "Saving..." : "Start Accepting Payments"}
                </Button>
              </form>
            </CardContent>
          </Card>
        ) : (
          /* Connected State */
          <div className="space-y-6">
            {/* Wallet Info Card */}
            <Card className="glass-card border-0">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-[rgb(var(--color-success))] animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.5)]" />
                    Your Wallet
                  </CardTitle>
                  <Badge variant="secondary" className="bg-[rgb(var(--color-success))]/15 text-success border-0 font-bold px-3">
                    Connected
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between p-4 bg-surface-900/40 rounded-xl border border-white/5 transition-colors hover:border-white/10">
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-text-low mb-1 font-semibold">Address</p>
                    <p className="font-mono text-text-high text-sm tracking-wide">{truncateAddress(normalizedAddress)}</p>
                  </div>
                  <Button variant="ghost" size="icon" onClick={handleCopyAddress} className="hover:bg-white/10 rounded-lg">
                    {copied ? (
                      <Check className="w-4 h-4 text-success" />
                    ) : (
                      <Copy className="w-4 h-4 text-text-med" />
                    )}
                  </Button>
                </div>
                
                <div className="p-4 bg-surface-900/40 rounded-xl border border-white/5">
                  <p className="text-[10px] uppercase tracking-wider text-text-low mb-1 font-semibold">Balance</p>
                  <p className="text-3xl font-bold text-text-high tracking-tight">
                    {balance ? formatXRP(balance) : '0'} <span className="text-lg text-text-med font-normal">XRP</span>
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'payments' | 'financing')}>
              <TabsList className="w-full bg-surface-800/80 border border-surface-700/50 h-auto p-1.5 rounded-2xl backdrop-blur-sm">
                <TabsTrigger 
                  value="payments" 
                  className="flex-1 py-3 text-sm font-semibold rounded-xl transition-all data-[state=active]:gradient-primary data-[state=active]:text-white data-[state=active]:shadow-lg"
                >
                  QR Payments
                </TabsTrigger>
                <TabsTrigger 
                  value="financing" 
                  className="flex-1 py-3 text-sm font-semibold rounded-xl transition-all data-[state=active]:bg-accent-500 data-[state=active]:text-black data-[state=active]:shadow-lg"
                >
                  Micro-Financing
                </TabsTrigger>
              </TabsList>

              {/* PAYMENTS TAB */}
              <TabsContent value="payments" className="mt-6">
                {paymentStatus === 'idle' && (
                  <Card className="bg-surface-800 border-surface-700">
                    <CardHeader>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-primary-500/15 flex items-center justify-center">
                          <QrCode className="w-5 h-5 text-primary-500" />
                        </div>
                        <div>
                          <CardTitle className="text-lg">Generate Payment QR</CardTitle>
                          <CardDescription className="text-text-med">Create a QR code for customers to scan</CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {paymentCurrency === 'RLUSD' && hasRlusdTrustline === false && (
                        <div className="p-4 bg-[rgb(var(--color-warning))]/10 border border-[rgb(var(--color-warning))]/20 rounded-xl mb-4 animate-fade-in">
                          <h4 className="font-semibold text-[rgb(var(--color-warning))] mb-2">RLUSD Not Enabled</h4>
                          <p className="text-sm text-text-med mb-3">You need to establish a trustline to receive RLUSD payments.</p>
                          <Button 
                            onClick={handleEnableRlusd} 
                            disabled={isEnablingRlusd}
                            className="w-full bg-[rgb(var(--color-warning))] hover:bg-[rgb(var(--color-warning))]/90 text-black font-semibold"
                          >
                            {isEnablingRlusd ? "Enabling..." : "Enable RLUSD Payments"}
                          </Button>
                        </div>
                      )}

                      <div className="flex gap-3">
                        <div className="flex-1">
                          <label className="block text-sm font-medium text-text-med mb-2">
                            Amount
                          </label>
                          <Input
                            type="number"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            placeholder="0.00"
                            min="0"
                            step="0.000001"
                            className="bg-surface-700 border-surface-700 text-text-high placeholder:text-text-low focus:border-[rgb(var(--color-primary))] focus-visible:ring-[rgb(var(--color-primary))]/20 h-10 rounded-xl"
                          />
                        </div>
                        <div className="w-30">
                          <label className="block text-sm font-medium text-text-med mb-2">
                            Currency
                          </label>
                          <select 
                            value={paymentCurrency} 
                            onChange={(e) => setPaymentCurrency(e.target.value as 'XRP' | 'RLUSD')}
                            className="w-full bg-surface-700 border-surface-700 text-text-high focus:border-[rgb(var(--color-primary))] focus-visible:ring-[rgb(var(--color-primary))]/20 h-10 rounded-xl px-3 outline-none"
                          >
                            <option value="XRP">XRP</option>
                            <option value="RLUSD">RLUSD</option>
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-text-med mb-2">
                          Description (Optional)
                        </label>
                        <Input
                          type="text"
                          value={description}
                          onChange={(e) => setDescription(e.target.value)}
                          placeholder="e.g., Coffee order #123"
                          className="bg-surface-700 border-surface-700 text-text-high placeholder:text-text-low focus:border-[rgb(var(--color-primary))] focus-visible:ring-[rgb(var(--color-primary))]/20 h-10 rounded-xl"
                        />
                      </div>

                      <Button
                        onClick={handleGenerateQR}
                        disabled={!amount || parseFloat(amount) <= 0 || (paymentCurrency === 'RLUSD' && hasRlusdTrustline === false)}
                        className="w-full h-12 rounded-xl font-semibold bg-[rgb(var(--color-primary))] hover:bg-[rgb(var(--color-primary))]/90 text-white shadow-lg shadow-[rgba(var(--color-primary),0.2)] mt-2"
                      >
                        Generate QR Code
                      </Button>
                    </CardContent>
                  </Card>
                )}

                {paymentStatus === 'waiting' && pendingPayment && (
                  <Card className="bg-surface-800 border-surface-700">
                    <CardContent className="p-6">
                      <div className="text-center mb-6">
                        <div className="flex items-center justify-center gap-2 mb-2">
                          <Clock className="w-5 h-5 text-primary-500 animate-pulse" />
                          <span className="text-sm text-text-med">Waiting for payment...</span>
                        </div>
                        <h3 className="text-3xl font-bold text-[rgb(var(--color-primary))] mb-1">{pendingPayment.amount} {paymentCurrency}</h3>
                        {pendingPayment.description && (
                          <p className="text-sm text-text-med">&quot;{pendingPayment.description}&quot;</p>
                        )}
                      </div>

                      {/* QR Type Toggle */}
                      <div className="flex justify-center gap-2 mb-4">
                        <Button
                          variant={qrType === 'xaman' ? 'default' : 'secondary'}
                          size="sm"
                          onClick={() => setQrType('xaman')}
                          className={qrType === 'xaman' ? 'bg-primary-500 text-white' : 'bg-surface-700 text-text-med'}
                        >
                          Xaman
                        </Button>
                        <Button
                          variant={qrType === 'generic' ? 'default' : 'secondary'}
                          size="sm"
                          onClick={() => setQrType('generic')}
                          className={qrType === 'generic' ? 'bg-primary-500 text-white' : 'bg-surface-700 text-text-med'}
                        >
                          Crossmark / Other
                        </Button>
                      </div>

                      <div className="flex justify-center mb-4">
                        <div className="inline-block">
                          <QRGenerator 
                            destination={address!}
                            amount={pendingPayment.amount}
                            currency={paymentCurrency}
                            issuer={paymentCurrency === 'RLUSD' ? RLUSD_CONFIG.issuer : undefined}
                            type={qrType}
                            size={220}
                          />
                        </div>
                      </div>

                      <p className="text-center text-sm text-text-low mb-4">
                        {qrType === 'xaman' 
                          ? 'Scan with Xaman (Xumm) wallet' 
                          : 'Scan with any XRPL wallet'
                        }
                      </p>

                      {/* Timer */}
                      <div className="flex justify-center items-center gap-2 mb-6">
                        <Clock className="w-4 h-4 text-text-low" />
                        <span className="text-sm text-text-med">Expires in: </span>
                        <span className="font-mono text-text-high">{getTimeRemaining()}</span>
                      </div>

                      <Separator className="mb-6 bg-surface-700" />

                      {/* Actions */}
                      <div className="flex gap-3">
                        <Button
                          variant="outline"
                          onClick={handleCopyQR}
                          className="flex-1 border-surface-700 text-text-med hover:bg-surface-700 gap-2"
                        >
                          <Copy className="w-4 h-4" />
                          Copy Data
                        </Button>
                        <Button
                          variant="outline"
                          onClick={handleReset}
                          className="flex-1 border-surface-700 text-text-med hover:bg-surface-700 gap-2"
                        >
                          <RefreshCw className="w-4 h-4" />
                          Cancel
                        </Button>
                      </div>

                      {qrType === 'xaman' && (
                        <Button
                          variant="secondary"
                          asChild
                          className="w-full mt-4 bg-surface-700 text-text-med hover:bg-surface-700/80 gap-2"
                        >
                          <a href={pendingPayment.xamanUrl} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="w-4 h-4" />
                            Open in Xaman
                          </a>
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                )}

                {paymentStatus === 'received' && (
                  <Card className="bg-surface-800 border-[rgb(var(--color-success))]/50 animate-scale-in">
                    <CardContent className="p-6 text-center">
                      <div className="w-16 h-16 rounded-full bg-[rgb(var(--color-success))]/15 flex items-center justify-center mx-auto mb-4">
                        <CheckCircle2 className="w-8 h-8 text-success" />
                      </div>
                      <h3 className="text-2xl font-bold text-success mb-2">Payment Received!</h3>
                      <p className="text-3xl font-bold text-text-high mb-4">
                        {receivedAmount} XRP
                      </p>
                      
                      {receivedTxHash && (
                        <a
                          href={`https://livenet.xrpl.org/transactions/${receivedTxHash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 text-sm text-primary-500 hover:underline mb-6"
                        >
                          View Transaction
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      )}

                      <Button
                        onClick={handleReset}
                        className="w-full h-12 rounded-xl font-semibold bg-primary-500 hover:bg-primary-600 text-white"
                      >
                        New Payment
                      </Button>
                    </CardContent>
                  </Card>
                )}

                {paymentStatus === 'expired' && (
                  <Card className="bg-surface-800 border-[rgb(var(--color-warning))]/50">
                    <CardContent className="p-6 text-center">
                      <div className="w-16 h-16 rounded-full bg-[rgb(var(--color-warning))]/15 flex items-center justify-center mx-auto mb-4">
                        <Clock className="w-8 h-8 text-warning" />
                      </div>
                      <h3 className="text-2xl font-bold text-warning mb-2">Payment Expired</h3>
                      <p className="text-text-med mb-6">
                        The payment request has expired. Please generate a new QR code.
                      </p>

                      <Button
                        onClick={handleReset}
                        className="w-full h-12 rounded-xl font-semibold bg-primary-500 hover:bg-primary-600 text-white"
                      >
                        Generate New QR
                      </Button>
                    </CardContent>
                  </Card>
                )}

                {/* Recent Transactions Dashboard */}
                {paymentStatus === 'idle' && (
                  <Card className="glass-card border-0 mt-8">
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center justify-between">
                        Recent Transactions
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => fetchRecentPayments(normalizedAddress)}
                          disabled={loadingPayments}
                          className="h-8 w-8 p-0"
                        >
                          <RefreshCw className={`w-4 h-4 ${loadingPayments ? 'animate-spin' : ''}`} />
                        </Button>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {recentPayments.length === 0 ? (
                        <p className="text-center text-text-med py-4 text-sm">No recent transactions found.</p>
                      ) : (
                        <div className="space-y-3">
                          {recentPayments.map(payment => (
                            <div
                              key={payment.id}
                              onClick={() => payment.status === 'pending' && handleReopenPayment(payment)}
                              className={`flex items-center justify-between p-3 bg-surface-900/40 rounded-xl border border-white/5 transition-colors ${
                                payment.status === 'pending'
                                  ? 'cursor-pointer hover:bg-surface-800/60 hover:border-primary-500/20'
                                  : ''
                              }`}
                            >
                              <div>
                                <p className="font-semibold text-text-high">{payment.amount} {payment.currency}</p>
                                <p className="text-xs text-text-low">{new Date(payment.createdAt).toLocaleDateString()} {new Date(payment.createdAt).toLocaleTimeString()}</p>
                                {payment.description && <p className="text-xs text-text-med mt-1 truncate max-w-[150px] sm:max-w-xs">{payment.description}</p>}
                              </div>
                              <div className="text-right flex flex-col items-end gap-1">
                                <Badge variant="secondary" className={`
                                  ${payment.status === 'completed' ? 'bg-[rgb(var(--color-success))]/15 text-success' : ''}
                                  ${payment.status === 'pending' ? 'bg-[rgb(var(--color-warning))]/15 text-warning' : ''}
                                  ${payment.status === 'expired' ? 'bg-surface-700 text-text-med' : ''}
                                  border-0
                                `}>
                                  {payment.status}
                                </Badge>
                                {payment.status === 'pending' && (
                                  <span className="text-xs text-primary-500 flex items-center gap-1">
                                    <QrCode className="w-3 h-3" /> Show QR
                                  </span>
                                )}
                                {payment.txHash && (
                                  <a
                                    href={`https://livenet.xrpl.org/transactions/${payment.txHash}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    onClick={(e) => e.stopPropagation()}
                                    className="text-xs text-primary-500 hover:underline flex items-center gap-1"
                                  >
                                    View <ExternalLink className="w-3 h-3" />
                                  </a>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              {/* FINANCING TAB */}
              <TabsContent value="financing" className="mt-6 space-y-6">
                {!tokenData ? (
                  <Card className="bg-surface-800 border-surface-700">
                    <CardHeader>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-accent-500/15 flex items-center justify-center">
                          <Rocket className="w-5 h-5 text-accent-500" />
                        </div>
                        <div>
                          <CardTitle className="text-lg">Start Financing Campaign</CardTitle>
                          <CardDescription className="text-text-med">Raise capital using XRPL MPTs</CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-text-med mb-2">
                          Funding Goal (XRP)
                        </label>
                        <Input
                          type="number"
                          value={financingGoal}
                          onChange={(e) => setFinancingGoal(e.target.value)}
                          placeholder="e.g. 1000"
                          min="1"
                          className="bg-surface-700 border-surface-700 text-text-high placeholder:text-text-low focus:border-accent-500 focus-visible:ring-accent-500/20 h-12 rounded-xl"
                        />
                      </div>
                      
                      <Button
                        onClick={handleStartFinancing}
                        disabled={isIssuingToken || !financingGoal}
                        className="w-full h-12 rounded-xl font-semibold bg-accent-500 hover:bg-accent-500/90 text-black gap-2"
                      >
                        {isIssuingToken ? (
                          <>
                            <RefreshCw className="w-4 h-4 animate-spin" />
                            Issuing Token...
                          </>
                        ) : (
                          <>
                            <Rocket className="w-4 h-4" />
                            Launch Campaign
                          </>
                        )}
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  /* Active Campaign Dashboard */
                  <div className="space-y-6">
                    <Card className="bg-surface-800 border-surface-700">
                  <CardHeader>
                    <CardTitle className="text-text-high flex items-center justify-between">
                      Financing Campaign
                      <Badge variant="outline" className="text-secondary-400 border-secondary-400">
                        Active
                      </Badge>
                    </CardTitle>
                    <CardDescription className="text-text-med">
                      Your fund token is live on the XRPL DEX
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {tokenData ? (
                      <div className="p-4 bg-surface-900 rounded-lg space-y-2">
                        <div className="flex justify-between">
                          <span className="text-text-med">Token Ticker:</span>
                          <span className="text-text-high font-mono">{(tokenData as any)?.currency}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-text-med">Issuer Address:</span>
                          <span className="text-text-high font-mono text-sm">
                            {truncateAddress((tokenData as any)?.issuer || '')}
                          </span>
                        </div>
                        <div className="flex justify-between border-t border-surface-700 pt-2 mt-2">
                          <span className="text-text-med">Liquidity Offered:</span>
                          <span className="text-secondary-400 font-bold">1,000,000 SZP</span>
                        </div>
                      </div>
                    ) : (
                      <div className="p-4 bg-surface-900 rounded-lg flex justify-center text-text-med">
                        Loading token details...
                      </div>
                    )}
                  </CardContent>
                </Card>

                    <Card className="bg-surface-800 border-surface-700">
                      <CardHeader>
                        <CardTitle className="text-base">Investor Benefits</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="space-y-3">
                          <li className="flex items-start gap-3 text-sm text-text-med">
                            <Check className="w-5 h-5 text-success shrink-0" />
                            <span>Investors hold <b className="text-text-high">SZP-FUND</b> tokens representing their stake.</span>
                          </li>
                          <li className="flex items-start gap-3 text-sm text-text-med">
                            <Check className="w-5 h-5 text-success shrink-0" />
                            <span>Tokens can be traded freely on the XRPL DEX.</span>
                          </li>
                          <li className="flex items-start gap-3 text-sm text-text-med">
                            <Check className="w-5 h-5 text-success shrink-0" />
                            <span>Future revenue share will be distributed to token holders.</span>
                          </li>
                        </ul>
                      </CardContent>
                    </Card>
                  </div>
                )}

                <Card className="bg-primary-500/10 border-primary-500/20">
                  <CardContent className="p-4">
                    <div className="flex gap-3">
                      <TrendingUp className="w-5 h-5 text-primary-500 shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-semibold text-primary-500 mb-1">Grow your business</h4>
                        <p className="text-xs text-text-med leading-relaxed">
                          Campaigns run for 30 days. Funds are released automatically as you hit milestones.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        )}
      </main>
    </div>
  );
}
