'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { ArrowLeft, Wallet, QrCode, Copy, Check, RefreshCw, ExternalLink, Activity, Rocket, TrendingUp, Clock, CheckCircle2 } from 'lucide-react';
import { QRGenerator } from '@/components/qr-generator';
import { useWallet } from '@/lib/wallet-context';
import { WalletConnectButton } from '@/components/wallet-connect-button';
import { truncateAddress, formatXRP } from '@/lib/utils';
import { generateXamanPaymentURL, generateGenericPaymentRequest, generatePaymentId } from '@/lib/payment-request';
import { subscribeToAccount } from '@/lib/xrpl-client';
import { 
  constructMPTIssuanceTx, 
  constructMPTSellOfferTx, 
  getAccountMPTIssuances, 
  MPTIssuanceData 
} from '@/lib/mpt-utils';

type PaymentStatus = 'idle' | 'waiting' | 'received' | 'expired';

interface PendingPayment {
  id: string;
  amount: string;
  description: string;
  xamanUrl: string;
  genericQR: string;
  createdAt: Date;
  expiresAt: Date;
}

export default function MerchantPage() {
  const { isConnected, address, balance, signAndSubmit } = useWallet();
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

  // Financing State
  const [financingGoal, setFinancingGoal] = useState('');
  const [isIssuingToken, setIsIssuingToken] = useState(false);
  const [mptData, setMptData] = useState<MPTIssuanceData | null>(null);
  const [isLoadingMpt, setIsLoadingMpt] = useState(false);

  // Poll for existing MPT on load
  useEffect(() => {
    if (address && isConnected) {
      setIsLoadingMpt(true);
      getAccountMPTIssuances(address)
        .then(issuances => {
          if (issuances.length > 0) {
            setMptData(issuances[0]);
          }
        })
        .catch(console.error)
        .finally(() => setIsLoadingMpt(false));
    }
  }, [address, isConnected]);

  // Subscribe to incoming payments when waiting
  useEffect(() => {
    if (!address || paymentStatus !== 'waiting' || !pendingPayment) return;

    let unsubscribe: (() => void) | null = null;
    
    const startSubscription = async () => {
      try {
        unsubscribe = await subscribeToAccount(address, (tx) => {
          // Check if this is an incoming payment
          if (tx.transaction?.TransactionType === 'Payment' && 
              tx.transaction?.Destination === address &&
              tx.validated) {
            
            const receivedDrops = tx.transaction.Amount;
            const receivedXRP = typeof receivedDrops === 'string' 
              ? (parseInt(receivedDrops) / 1_000_000).toString()
              : '0';
            
            // Check if amount matches (with small tolerance for fees)
            const expectedAmount = parseFloat(pendingPayment.amount);
            const actualAmount = parseFloat(receivedXRP);
            
            if (actualAmount >= expectedAmount * 0.99) {
              setReceivedAmount(receivedXRP);
              setReceivedTxHash(tx.transaction.hash);
              setPaymentStatus('received');
            }
          }
        });
      } catch (error) {
        console.error('Failed to subscribe to account:', error);
      }
    };

    startSubscription();

    // Cleanup subscription on unmount or status change
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [address, paymentStatus, pendingPayment]);

  // Timer for payment expiry
  useEffect(() => {
    if (!pendingPayment || paymentStatus !== 'waiting') return;

    const checkExpiry = setInterval(() => {
      if (new Date() > pendingPayment.expiresAt) {
        setPaymentStatus('expired');
        clearInterval(checkExpiry);
      }
    }, 1000);

    return () => clearInterval(checkExpiry);
  }, [pendingPayment, paymentStatus]);

  const handleGenerateQR = useCallback(() => {
    if (!amount || parseFloat(amount) <= 0 || !address) return;

    const paymentId = generatePaymentId();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    // Generate Xaman-compatible URL
    const xamanPayment = generateXamanPaymentURL(address, amount, {
      network: 'XRPL',
    });

    // Generate generic JSON QR (for Crossmark and other wallets)
    const genericQR = generateGenericPaymentRequest(address, amount, {
      memo: description || `SuzuPay Payment ${paymentId}`,
    });

    setPendingPayment({
      id: paymentId,
      amount,
      description,
      xamanUrl: xamanPayment.qrData,
      genericQR,
      createdAt: new Date(),
      expiresAt,
    });
    setPaymentStatus('waiting');
  }, [amount, description, address]);

  const handleCopyAddress = async () => {
    if (address) {
      await navigator.clipboard.writeText(address);
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
    if (!address || !financingGoal) return;
    
    setIsIssuingToken(true);
    try {
      // 1. Issue MPT Transaction
      console.log('[Merchant] 1. Creating MPT Issuance Transaction...');
      const issuanceTx = constructMPTIssuanceTx(
        address,
        { 
          ticker: 'SZP-FUND',
          name: 'SuzuPay Fund Token',
          description: `Financing Campaign for ${financingGoal} XRP`
        },
        "1000000", // Fix supply: 1M tokens
        0 // No decimals
      );
      
      const issuanceResult = await signAndSubmit(issuanceTx);
      console.log('[Merchant] Issuance Submitted:', issuanceResult);
      
      // 2. Poll for MPT ID (wait for ledger confirmation)
      console.log('[Merchant] 2. Waiting for validation to get MPT ID...');
      let newMptData: MPTIssuanceData | undefined;
      
      // Poll a few times
      for (let i = 0; i < 10; i++) {
        await new Promise(r => setTimeout(r, 2000)); // Wait 2s
        const issuances = await getAccountMPTIssuances(address);
        if (issuances.length > 0) {
           newMptData = issuances[0]; 
           break;
        }
      }

      if (!newMptData) {
        throw new Error('Timed out waiting for MPT Issuance confirmation');
      }
      
      console.log('[Merchant] Found MPT ID:', newMptData.mpt_issuance_id);

      // 3. Create Sell Offer (Sell 100% of tokens for Goal Amount)
      console.log('[Merchant] 3. Creating Sell Offer...');
      const sellOfferTx = constructMPTSellOfferTx(
        address,
        newMptData.mpt_issuance_id,
        "1000000", // Sell 1M Tokens
        (parseFloat(financingGoal) * 1_000_000).toString() // Total Price in Drops
      );
      
      await signAndSubmit(sellOfferTx);
      console.log('[Merchant] Sell Offer Created Successfully');
      
      setMptData(newMptData);
      alert('Successfully launched financing campaign!');

    } catch (error) {
      console.error('Financing error:', error);
      alert('Failed to start campaign. See console.');
    } finally {
      setIsIssuingToken(false);
    }
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
              <span className="text-xl font-bold text-text-high">Merchant Portal</span>
            </div>
          </div>
          <WalletConnectButton />
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-2xl">
        {!isConnected ? (
          /* Not Connected State */
          <div className="text-center py-16">
            <div className="w-20 h-20 rounded-full bg-surface-800 flex items-center justify-center mx-auto mb-6">
              <Wallet className="w-10 h-10 text-text-low" />
            </div>
            <h2 className="text-2xl font-bold text-text-high mb-4">Connect Your Wallet</h2>
            <p className="text-text-med mb-8">
              Connect your XRPL wallet to start receiving payments and raise capital
            </p>
            <WalletConnectButton />
          </div>
        ) : (
          /* Connected State */
          <div className="space-y-8">
            {/* Wallet Info Card */}
            <div className="p-6 bg-surface-800 rounded-2xl border border-surface-700">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-text-high">Your Wallet</h3>
                <span className="px-3 py-1 rounded-full bg-success/20 text-success text-sm font-medium">
                  Connected
                </span>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-surface-700/50 rounded-xl">
                  <div>
                    <p className="text-xs text-text-low mb-1">Address</p>
                    <p className="font-mono text-text-high">{truncateAddress(address!)}</p>
                  </div>
                  <button 
                    onClick={handleCopyAddress}
                    className="p-2 rounded-lg hover:bg-surface-700 transition-colors"
                  >
                    {copied ? (
                      <Check className="w-5 h-5 text-success" />
                    ) : (
                      <Copy className="w-5 h-5 text-text-med" />
                    )}
                  </button>
                </div>
                
                <div className="p-4 bg-surface-700/50 rounded-xl">
                  <p className="text-xs text-text-low mb-1">Balance</p>
                  <p className="text-2xl font-bold text-text-high">
                    {balance ? formatXRP(balance) : '0'} <span className="text-lg text-text-med">XRP</span>
                  </p>
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 p-1 bg-surface-800 rounded-xl border border-surface-700">
              <button
                onClick={() => setActiveTab('payments')}
                className={`flex-1 py-3 rounded-lg font-medium text-sm transition-all ${
                  activeTab === 'payments' 
                    ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/20' 
                    : 'text-text-med hover:bg-surface-700'
                }`}
              >
                QR Payments
              </button>
              <button
                onClick={() => setActiveTab('financing')}
                className={`flex-1 py-3 rounded-lg font-medium text-sm transition-all ${
                  activeTab === 'financing' 
                    ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/20' 
                    : 'text-text-med hover:bg-surface-700'
                }`}
              >
                Micro-Financing
              </button>
            </div>

            {/* Content Switcher */}
            {activeTab === 'payments' ? (
              /* PAYMENTS TAB */
              <>
                {/* Payment Status States */}
                {paymentStatus === 'idle' && (
                  /* QR Generator Form */
                  <div className="p-6 bg-surface-800 rounded-2xl border border-surface-700">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-10 h-10 rounded-lg bg-primary-500/20 flex items-center justify-center">
                        <QrCode className="w-5 h-5 text-primary-500" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-text-high">Generate Payment QR</h3>
                        <p className="text-sm text-text-med">Create a QR code for customers to scan</p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-text-med mb-2">
                          Amount (XRP)
                        </label>
                        <input
                          type="number"
                          value={amount}
                          onChange={(e) => setAmount(e.target.value)}
                          placeholder="0.00"
                          min="0"
                          step="0.000001"
                          className="w-full px-4 py-3 bg-surface-700 border border-surface-700 rounded-xl text-text-high placeholder-text-low focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 transition-all"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-text-med mb-2">
                          Description (Optional)
                        </label>
                        <input
                          type="text"
                          value={description}
                          onChange={(e) => setDescription(e.target.value)}
                          placeholder="e.g., Coffee order #123"
                          className="w-full px-4 py-3 bg-surface-700 border border-surface-700 rounded-xl text-text-high placeholder-text-low focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 transition-all"
                        />
                      </div>

                      <button
                        onClick={handleGenerateQR}
                        disabled={!amount || parseFloat(amount) <= 0}
                        className="w-full py-4 rounded-xl font-semibold text-white bg-primary-500 hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                      >
                        Generate QR Code
                      </button>
                    </div>
                  </div>
                )}

                {paymentStatus === 'waiting' && pendingPayment && (
                  /* Waiting for Payment */
                  <div className="p-6 bg-surface-800 rounded-2xl border border-surface-700">
                    <div className="text-center mb-6">
                      <div className="flex items-center justify-center gap-2 mb-2">
                        <Clock className="w-5 h-5 text-primary-500 animate-pulse" />
                        <span className="text-sm text-text-med">Waiting for payment...</span>
                      </div>
                      <h3 className="text-3xl font-bold text-primary-500 mb-1">{pendingPayment.amount} XRP</h3>
                      {pendingPayment.description && (
                        <p className="text-sm text-text-med">&quot;{pendingPayment.description}&quot;</p>
                      )}
                    </div>

                    {/* QR Type Toggle */}
                    <div className="flex justify-center gap-2 mb-4">
                      <button
                        onClick={() => setQrType('xaman')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                          qrType === 'xaman'
                            ? 'bg-primary-500 text-white'
                            : 'bg-surface-700 text-text-med hover:bg-surface-600'
                        }`}
                      >
                        Xaman
                      </button>
                      <button
                        onClick={() => setQrType('generic')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                          qrType === 'generic'
                            ? 'bg-primary-500 text-white'
                            : 'bg-surface-700 text-text-med hover:bg-surface-600'
                        }`}
                      >
                        Crossmark / Other
                      </button>
                    </div>

                    <div className="flex justify-center mb-4">
                      <div className="inline-block">
                        <QRGenerator 
                          destination={address!}
                          amount={pendingPayment.amount}
                          currency="XRP"
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

                    {/* Actions */}
                    <div className="flex gap-3">
                      <button
                        onClick={handleCopyQR}
                        className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border border-surface-700 text-text-med hover:bg-surface-700 transition-colors"
                      >
                        <Copy className="w-4 h-4" />
                        Copy Data
                      </button>
                      <button
                        onClick={handleReset}
                        className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border border-surface-700 text-text-med hover:bg-surface-700 transition-colors"
                      >
                        <RefreshCw className="w-4 h-4" />
                        Cancel
                      </button>
                    </div>

                    {qrType === 'xaman' && (
                      <a
                        href={pendingPayment.xamanUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-4 flex items-center justify-center gap-2 py-3 rounded-xl bg-surface-700 text-text-med hover:bg-surface-600 transition-colors"
                      >
                        <ExternalLink className="w-4 h-4" />
                        Open in Xaman
                      </a>
                    )}
                  </div>
                )}

                {paymentStatus === 'received' && (
                  /* Payment Received */
                  <div className="p-6 bg-surface-800 rounded-2xl border border-success/50 text-center">
                    <div className="w-16 h-16 rounded-full bg-success/20 flex items-center justify-center mx-auto mb-4">
                      <CheckCircle2 className="w-8 h-8 text-success" />
                    </div>
                    <h3 className="text-2xl font-bold text-success mb-2">Payment Received!</h3>
                    <p className="text-3xl font-bold text-text-high mb-4">
                      {receivedAmount} XRP
                    </p>
                    
                    {receivedTxHash && (
                      <a
                        href={`https://testnet.xrpl.org/transactions/${receivedTxHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-sm text-primary-500 hover:underline mb-6"
                      >
                        View Transaction
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    )}

                    <button
                      onClick={handleReset}
                      className="w-full py-4 rounded-xl font-semibold text-white bg-primary-500 hover:bg-primary-600 transition-all"
                    >
                      New Payment
                    </button>
                  </div>
                )}

                {paymentStatus === 'expired' && (
                  /* Payment Expired */
                  <div className="p-6 bg-surface-800 rounded-2xl border border-warning/50 text-center">
                    <div className="w-16 h-16 rounded-full bg-warning/20 flex items-center justify-center mx-auto mb-4">
                      <Clock className="w-8 h-8 text-warning" />
                    </div>
                    <h3 className="text-2xl font-bold text-warning mb-2">Payment Expired</h3>
                    <p className="text-text-med mb-6">
                      The payment request has expired. Please generate a new QR code.
                    </p>

                    <button
                      onClick={handleReset}
                      className="w-full py-4 rounded-xl font-semibold text-white bg-primary-500 hover:bg-primary-600 transition-all"
                    >
                      Generate New QR
                    </button>
                  </div>
                )}
              </>
            ) : (
              /* FINANCING TAB */
              <div className="space-y-6">
                {!mptData ? (
                  /* Start Campaign Form */
                  <div className="p-6 bg-surface-800 rounded-2xl border border-surface-700">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-10 h-10 rounded-lg bg-accent-500/20 flex items-center justify-center">
                        <Rocket className="w-5 h-5 text-accent-500" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-text-high">Start Financing Campaign</h3>
                        <p className="text-sm text-text-med">Raise capital using XRPL MPTs</p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-text-med mb-2">
                          Funding Goal (XRP)
                        </label>
                        <input
                          type="number"
                          value={financingGoal}
                          onChange={(e) => setFinancingGoal(e.target.value)}
                          placeholder="e.g. 1000"
                          min="1"
                          className="w-full px-4 py-3 bg-surface-700 border border-surface-700 rounded-xl text-text-high placeholder-text-low focus:border-accent-500 focus:outline-none focus:ring-2 focus:ring-accent-500/20 transition-all"
                        />
                      </div>
                      
                      <button
                        onClick={handleStartFinancing}
                        disabled={isIssuingToken || !financingGoal}
                        className="w-full py-4 rounded-xl font-semibold text-white bg-accent-500 hover:bg-accent-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
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
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Active Campaign Dashboard */
                  <div className="space-y-6">
                    <div className="p-6 bg-surface-800 rounded-2xl border border-accent-500/30">
                      <div className="flex items-center justify-between mb-6">
                         <div>
                           <h3 className="text-xl font-bold text-text-high">Active Campaign</h3>
                           <p className="text-sm text-accent-500 font-mono mt-1">
                             ID: {mptData.mpt_issuance_id.substring(0, 16)}...
                           </p>
                         </div>
                         <div className="px-3 py-1 rounded-full bg-accent-500/20 text-accent-500 text-sm font-medium flex items-center gap-2">
                           <Activity className="w-4 h-4" />
                           Live
                         </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 bg-surface-700/50 rounded-xl">
                          <p className="text-xs text-text-low mb-1">Total Supply</p>
                          <p className="text-lg font-bold text-text-high">
                            1,000,000 <span className="text-sm font-normal text-text-med">SZP-FUND</span>
                          </p>
                        </div>
                        <div className="p-4 bg-surface-700/50 rounded-xl">
                          <p className="text-xs text-text-low mb-1">Outstanding</p>
                          <p className="text-lg font-bold text-text-high">
                            {formatXRP(mptData.outstanding_amount)} <span className="text-sm font-normal text-text-med">Sold</span>
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="p-6 bg-surface-800 rounded-2xl border border-surface-700">
                      <h4 className="font-semibold text-text-high mb-4">Investor Benefits</h4>
                      <ul className="space-y-3">
                        <li className="flex items-start gap-3 text-sm text-text-med">
                          <Check className="w-5 h-5 text-success shrink-0" />
                          <span>Investors hold <b>SZP-FUND</b> tokens representing their stake.</span>
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
                    </div>
                  </div>
                )}

                <div className="p-4 rounded-xl bg-primary-500/10 border border-primary-500/20">
                  <div className="flex gap-3">
                    <TrendingUp className="w-5 h-5 text-primary-500 shrink-0" />
                    <div>
                      <h4 className="font-medium text-primary-500 mb-1">Grow your business</h4>
                      <p className="text-xs text-text-med leading-relaxed">
                        Campaigns run for 30 days. Funds are released automatically as you hit milestones.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
