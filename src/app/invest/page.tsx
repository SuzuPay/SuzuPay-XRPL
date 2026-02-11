'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Search, TrendingUp, Shield, Clock, Coins, Lock, ArrowUpRight, Check, AlertCircle, Wallet, Activity, RefreshCw } from 'lucide-react';
import { useWallet } from '@/lib/wallet-context';
import { WalletConnectButton } from '@/components/wallet-connect-button';
import { formatXRP, truncateAddress } from '@/lib/utils';
import { 
  getAccountMPTIssuances, 
  getMPTSellOffers, 
  constructMPTBuyOfferTx,
  MPTIssuanceData
} from '@/lib/mpt-utils';

export default function InvestPage() {
  const { isConnected, address, balance, signAndSubmit } = useWallet();
  
  // Search State
  const [merchantAddress, setMerchantAddress] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  
  // Campaign Data
  const [campaign, setCampaign] = useState<MPTIssuanceData | null>(null);
  const [tokenPrice, setTokenPrice] = useState<number | null>(null); // XRP per Token
  
  // Investment State
  const [investAmount, setInvestAmount] = useState(''); // XRP Amount
  const [isInvesting, setIsInvesting] = useState(false);

  const handleSearch = async () => {
    if (!merchantAddress) return;
    
    setIsSearching(true);
    setSearchError(null);
    setCampaign(null);
    setTokenPrice(null);

    try {
      // 1. Get Issuances
      const issuances = await getAccountMPTIssuances(merchantAddress);
      if (issuances.length === 0) {
        setSearchError('No active financing campaigns found for this merchant.');
        return;
      }

      const activeCampaign = issuances[0]; // Assume first one for MVP
      setCampaign(activeCampaign);

      // 2. Get Sell Offers to determine price
      const offers = await getMPTSellOffers(merchantAddress, activeCampaign.mpt_issuance_id);
      
      if (offers.length > 0) {
        // Calculate Price: Total XRP / Total Tokens
        // Note: This is a simplified "spot price" calculation based on the first offer
        const offer = offers[0];
        // account_offers returns snake_case fields (taker_gets, taker_pays)
        // MPT values are decimal strings (not hex) per XRPL encoding standards
        const mptAmount = parseInt(offer.taker_gets.value, 10);
        const xrpAmountDrops = parseInt(offer.taker_pays);
        
        if (mptAmount > 0) {
           const pricePerTokenDrops = xrpAmountDrops / mptAmount;
           const pricePerTokenXRP = pricePerTokenDrops / 1_000_000;
           setTokenPrice(pricePerTokenXRP);
        }
      } else {
        setSearchError('Campaign found, but no active sell offers available.');
      }

    } catch (error) {
      console.error('Search error:', error);
      setSearchError('Failed to fetch merchant data. Please check the address.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleInvest = async () => {
    if (!campaign || !investAmount || !address || !tokenPrice) return;

    setIsInvesting(true);
    try {
      const xrpAmount = parseFloat(investAmount);
      const tokenAmount = Math.floor(xrpAmount / tokenPrice);

      if (tokenAmount <= 0) {
        alert('Investment amount too low to buy 1 token');
        return;
      }

      const tx = constructMPTBuyOfferTx(
        address,
        campaign.mpt_issuance_id,
        tokenAmount.toString(),
        (xrpAmount * 1_000_000).toString() // Drops
      );

      console.log('Submitting Buy Offer:', tx);
      const result = await signAndSubmit(tx);
      console.log('Buy Offer Result:', result);
      
      alert(`Successfully invested ${xrpAmount} XRP! You will receive approx ${tokenAmount} ${campaign.metadataRec?.ticker || 'Tokens'}`);
      setInvestAmount('');
      
    } catch (error) {
      console.error('Investment failed:', error);
      alert('Investment failed. See console for details.');
    } finally {
      setIsInvesting(false);
    }
  };

  // Helper: Calculate estimated tokens
  const estimatedTokens = (amount: string) => {
    if (!amount || !tokenPrice) return '0';
    return Math.floor(parseFloat(amount) / tokenPrice).toLocaleString();
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
        {/* Search Section */}
        <div className="mb-8 space-y-4">
          <h1 className="text-2xl font-bold text-text-high">Find Campaigns</h1>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-low" />
              <input
                type="text"
                value={merchantAddress}
                onChange={(e) => setMerchantAddress(e.target.value)}
                placeholder="Enter Merchant XRPL Address"
                className="w-full pl-12 pr-4 py-3 bg-surface-800 border border-surface-700 rounded-xl text-text-high placeholder-text-low focus:border-success focus:outline-none focus:ring-2 focus:ring-success/20 transition-all"
              />
            </div>
            <button
              onClick={handleSearch}
              disabled={isSearching || !merchantAddress}
              className="px-6 py-3 rounded-xl font-semibold text-white bg-success hover:bg-success-hover disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {isSearching ? 'Searching...' : 'Search'}
            </button>
          </div>
          
          {searchError && (
            <div className="p-4 rounded-xl bg-error/10 border border-error/20 flex items-center gap-3 text-error">
              <AlertCircle className="w-5 h-5" />
              <p className="text-sm">{searchError}</p>
            </div>
          )}
        </div>

        {/* Campaign Details */}
        {campaign && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="p-6 bg-surface-800 rounded-2xl border border-surface-700">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-xl font-bold text-text-high mb-1">
                    {campaign.metadataRec?.name || 'Financing Campaign'}
                  </h2>
                  <p className="text-text-med text-sm max-w-md">
                    {campaign.metadataRec?.description || 'No description provided.'}
                  </p>
                </div>
                <div className="px-3 py-1 rounded-full bg-success/20 text-success text-sm font-medium flex items-center gap-2">
                  <Activity className="w-4 h-4" />
                  Live
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="p-4 bg-surface-700/50 rounded-xl">
                  <p className="text-xs text-text-low mb-1">Token</p>
                  <p className="font-bold text-text-high">{campaign.metadataRec?.ticker || 'TKN'}</p>
                </div>
                <div className="p-4 bg-surface-700/50 rounded-xl">
                  <p className="text-xs text-text-low mb-1">Price</p>
                  <p className="font-bold text-text-high">
                    {tokenPrice ? `${tokenPrice.toFixed(6)} XRP` : 'Calculating...'}
                  </p>
                </div>
                <div className="p-4 bg-surface-700/50 rounded-xl">
                  <p className="text-xs text-text-low mb-1">Available</p>
                  <p className="font-bold text-text-high">
                    {formatXRP(campaign.outstanding_amount)}
                  </p>
                </div>
              </div>

              {/* Investment Input */}
              <div className="p-4 bg-surface-700/30 rounded-xl border border-surface-700">
                <div className="flex justify-between items-center mb-4">
                  <label className="text-sm font-medium text-text-med">Investment Amount (XRP)</label>
                  <span className="text-xs text-text-low">
                    Balance: {balance ? formatXRP(balance) : '0'} XRP
                  </span>
                </div>
                
                <div className="flex gap-4 mb-4">
                  <input
                    type="number"
                    value={investAmount}
                    onChange={(e) => setInvestAmount(e.target.value)}
                    placeholder="0.00"
                    disabled={!isConnected}
                    className="flex-1 px-4 py-3 bg-surface-800 border border-surface-600 rounded-xl text-text-high focus:border-success focus:outline-none focus:ring-2 focus:ring-success/20 transition-all"
                  />
                  <button
                    onClick={handleInvest}
                    disabled={isInvesting || !investAmount || !isConnected || !tokenPrice}
                    className="px-8 py-3 rounded-xl font-bold text-white bg-success hover:bg-success-hover disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
                  >
                    {isInvesting ? (
                      <RefreshCw className="w-5 h-5 animate-spin" />
                    ) : (
                      <>
                        <Coins className="w-5 h-5" />
                        Invest
                      </>
                    )}
                  </button>
                </div>

                <div className="flex justify-between items-center text-sm">
                  <span className="text-text-med">You will receive approx:</span>
                  <span className="font-bold text-success">
                    {estimatedTokens(investAmount)} {campaign.metadataRec?.ticker || 'Tokens'}
                  </span>
                </div>
              </div>
            </div>

            {/* Platform Benefits */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-5 bg-surface-800 rounded-xl border border-surface-700">
                <div className="w-10 h-10 rounded-lg bg-primary-500/20 flex items-center justify-center mb-3">
                  <Shield className="w-5 h-5 text-primary-500" />
                </div>
                <h3 className="font-semibold text-text-high mb-1">Secured by XRPL</h3>
                <p className="text-xs text-text-med">
                  Funds are held in escrow and released based on verified merchant milestones.
                </p>
              </div>
              <div className="p-5 bg-surface-800 rounded-xl border border-surface-700">
                <div className="w-10 h-10 rounded-lg bg-accent-500/20 flex items-center justify-center mb-3">
                  <ArrowUpRight className="w-5 h-5 text-accent-500" />
                </div>
                <h3 className="font-semibold text-text-high mb-1">Automated Returns</h3>
                <p className="text-xs text-text-med">
                  Revenue share is automatically distributed to token holders via payment channels.
                </p>
              </div>
            </div>
          </div>
        )}

        {!campaign && !isSearching && (
          /* Empty State / Intro */
          <div className="mt-8 text-center py-12">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-surface-800 mb-4">
              <Search className="w-8 h-8 text-text-low" />
            </div>
            <h3 className="text-lg font-medium text-text-high mb-2">Search for a Merchant</h3>
            <p className="text-text-med max-w-sm mx-auto">
              Enter a merchant&apos;s XRPL address above to view their active financing campaigns and investment opportunities.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
