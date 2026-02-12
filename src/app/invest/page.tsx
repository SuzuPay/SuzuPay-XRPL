'use client';

import { useState } from 'react';
import { Search, TrendingUp, Shield, Coins, ArrowUpRight, AlertCircle, Activity, RefreshCw } from 'lucide-react';
import { useWallet } from '@/lib/wallet-context';
import { PageHeader } from '@/components/page-header';
import { formatXRP } from '@/lib/utils';
import { 
  getTokenSellOffers, 
  constructTrustSetTx, 
  constructBuyOfferTx, 
  hasTrustLine 
} from '@/lib/token-utils';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { dropsToXrp } from 'xrpl';

export default function InvestPage() {
  const { isConnected, address, balance, signAndSubmit } = useWallet();
  
  // Search State
  const [merchantAddress, setMerchantAddress] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  
  // Campaign Data (Standard Token)
  const [activeToken, setActiveToken] = useState<{ currency: string; issuer: string; value: string } | null>(null);
  const [tokenPrice, setTokenPrice] = useState<number | null>(null);
  const [availableAmount, setAvailableAmount] = useState<string>('0');
  
  // Investment State
  const [investAmount, setInvestAmount] = useState('');
  const [isInvesting, setIsInvesting] = useState(false);

  // Search for Merchant's active Sell Offers (Financing Campaigns)
  const handleSearch = async () => {
    if (!merchantAddress) return;
    
    setIsSearching(true);
    setSearchError(null);
    setActiveToken(null);
    setTokenPrice(null);
    setAvailableAmount('0');

    try {
      // Find valid Sell Offers for 'SZP' issued by this merchant
      const offers = await getTokenSellOffers(merchantAddress, 'SZP');
      
      if (offers.length === 0) {
        setSearchError('No active financing campaigns (SZP Sell Offers) found for this merchant.');
        return;
      }

      // Pick the best offer (cheapest) or just the first one for this MVP
      const bestOffer = offers[0];
      
      // Calculate Price (XRP per Token)
      // TakerGets = Token (since merchant is selling Token)
      // TakerPays = XRP
      const tokenAmount = parseFloat(bestOffer.TakerGets.value);
      const xrpAmountDrops = parseInt(bestOffer.TakerPays);
      
      if (tokenAmount > 0) {
         const pricePerTokenDrops = xrpAmountDrops / tokenAmount;
         const pricePerTokenXRP = pricePerTokenDrops / 1_000_000;
         
         setTokenPrice(pricePerTokenXRP);
         setActiveToken({
           currency: 'SZP',
           issuer: merchantAddress,
           value: bestOffer.TakerGets.value
         });
         setAvailableAmount(bestOffer.TakerGets.value);
      } else {
         setSearchError('Invalid offer data found.');
      }

    } catch (error) {
      console.error('Search error:', error);
      setSearchError('Failed to fetch merchant data. Please check the address.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleInvest = async () => {
    if (!activeToken || !investAmount || !address || !tokenPrice) return;

    setIsInvesting(true);
    try {
      const xrpAmount = parseFloat(investAmount);
      const tokenAmount = Math.floor(xrpAmount / tokenPrice);

      if (tokenAmount <= 0) {
        alert('Investment amount too low to buy 1 token');
        return;
      }

      // Step 1: Check / Create Trust Line
      // Investors must trust the merchant's token before they can hold it
      const hasTrust = await hasTrustLine(address, activeToken);

      if (!hasTrust) {
        console.log('Creating TrustLine...');
        const trustTx = constructTrustSetTx(address, activeToken);
        const trustResult = await signAndSubmit(trustTx);
        
        if (!trustResult) {
          throw new Error('TrustSet transaction failed or was rejected');
        }
        console.log('TrustSet success:', trustResult);
        
        // Small delay to allow ledger to process
        await new Promise(resolve => setTimeout(resolve, 3000));
      }

      // Step 2: Create Buy Offer (Buy Token with XRP)
      // Note: constructBuyOfferTx handles xrpToDrops conversion internally
      const buyTx = constructBuyOfferTx(
        address,
        activeToken,
        tokenAmount.toString(),
        investAmount // Pass XRP string directly
      );

      console.log('Submitting Buy Offer:', buyTx);
      const result = await signAndSubmit(buyTx);
      console.log('Buy Offer Result:', result);
      
      alert(`Successfully invested ${xrpAmount} XRP! You bought approx ${tokenAmount} SZP tokens.`);
      setInvestAmount('');
      
      // Refresh search to show updated availability
      handleSearch();
      
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
      <PageHeader
        title="Invest"
        icon={<TrendingUp className="w-4 h-4 text-white" />}
        iconBg="bg-[rgb(var(--color-success))]"
      />

      <main className="container mx-auto px-4 py-8 max-w-2xl">
        {/* Search Section */}
        <div className="mb-8 space-y-4">
          <h1 className="text-2xl font-bold text-text-high">Find Campaigns</h1>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-low" />
              <Input
                type="text"
                value={merchantAddress}
                onChange={(e) => setMerchantAddress(e.target.value)}
                placeholder="Enter Merchant XRPL Address"
                className="pl-12 bg-surface-800 border-surface-700 text-text-high placeholder:text-text-low focus:border-[rgb(var(--color-success))] focus-visible:ring-[rgb(var(--color-success))]/20 h-12 rounded-xl"
              />
            </div>
            <Button
              onClick={handleSearch}
              disabled={isSearching || !merchantAddress}
              className="px-6 h-12 rounded-xl font-semibold bg-[rgb(var(--color-success))] hover:bg-[rgb(var(--color-success))]/90 text-white"
            >
              {isSearching ? 'Searching...' : 'Search'}
            </Button>
          </div>
          
          {searchError && (
            <Card className="glass-card border-l-4 border-l-[rgb(var(--color-error))] bg-[rgb(var(--color-error))]/5">
              <CardContent className="p-4 flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-error" />
                <p className="text-error text-sm font-medium">{searchError}</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Campaign Details */}
        {activeToken && (
          <div className="space-y-6 animate-fade-in">
            <Card className="glass-card border-l-4 border-l-[rgb(var(--color-success))] shadow-2xl shadow-[rgb(var(--color-success))]/5">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-xl font-bold flex items-center gap-2">
                      Merchant Financing
                      <span className="text-sm font-normal text-text-med bg-surface-900/50 px-2 py-0.5 rounded-full border border-white/5">Standard Token</span>
                    </CardTitle>
                    <CardDescription className="text-text-med mt-1 max-w-md">
                      Buy SZP tokens to fund this merchant's inventory.
                    </CardDescription>
                  </div>
                  <Badge variant="secondary" className="bg-[rgb(var(--color-success))]/10 text-success border-0 gap-1.5 font-bold px-3 py-1 animate-pulse">
                    <Activity className="w-3 h-3" />
                    Live Campaign
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Stats Grid */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="p-4 bg-surface-900/40 rounded-xl border border-white/5">
                    <p className="text-[10px] uppercase tracking-wider text-text-low mb-1 font-semibold">Token</p>
                    <p className="font-bold text-text-high tracking-tight">{activeToken.currency}</p>
                  </div>
                  <div className="p-4 bg-surface-900/40 rounded-xl border border-white/5">
                    <p className="text-[10px] uppercase tracking-wider text-text-low mb-1 font-semibold">Price</p>
                    <p className="font-bold text-text-high tracking-tight">
                      {tokenPrice ? `${tokenPrice.toFixed(6)} XRP` : 'Calculating...'}
                    </p>
                  </div>
                  <div className="p-4 bg-surface-900/40 rounded-xl border border-white/5">
                    <p className="text-[10px] uppercase tracking-wider text-text-low mb-1 font-semibold">Available</p>
                    <p className="font-bold text-text-high tracking-tight">
                      {parseInt(availableAmount).toLocaleString()}
                    </p>
                  </div>
                </div>

                {/* Investment Input */}
                <div className="p-6 bg-surface-900/30 rounded-2xl border border-white/5 space-y-4">
                  <div className="flex justify-between items-center">
                    <label className="text-sm font-medium text-text-med">Investment Amount (XRP)</label>
                    <span className="text-xs text-text-low font-mono">
                      Balance: {balance ? formatXRP(balance) : '0'} XRP
                    </span>
                  </div>
                  
                  <div className="flex gap-4">
                    <Input
                      type="number"
                      value={investAmount}
                      onChange={(e) => setInvestAmount(e.target.value)}
                      placeholder="0.00"
                      disabled={!isConnected}
                      className="flex-1 bg-surface-800/50 border-surface-700 text-text-high placeholder:text-text-low focus:border-[rgb(var(--color-success))] focus-visible:ring-[rgb(var(--color-success))]/20 h-12 rounded-xl text-lg font-medium transition-all"
                    />
                    <Button
                      onClick={handleInvest}
                      disabled={isInvesting || !investAmount || !isConnected || !tokenPrice}
                      className="px-8 h-12 rounded-xl font-bold bg-[rgb(var(--color-success))] hover:bg-[rgb(var(--color-success))]/90 text-white gap-2 shadow-lg shadow-[rgb(var(--color-success))]/20 transition-all hover:scale-105 active:scale-95"
                    >
                      {isInvesting ? (
                        <RefreshCw className="w-5 h-5 animate-spin" />
                      ) : (
                        <>
                          <Coins className="w-5 h-5" />
                          Invest
                        </>
                      )}
                    </Button>
                  </div>

                  <div className="flex justify-between items-center text-sm pt-2 border-t border-white/5">
                    <span className="text-text-med">You will receive approx:</span>
                    <span className="font-bold text-success text-base">
                      {estimatedTokens(investAmount)} {activeToken.currency}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Platform Benefits */}
            <div className="grid grid-cols-2 gap-4">
              <Card className="glass-card border-0 hover:bg-surface-800/60 transition-colors">
                <CardContent className="p-5">
                  <div className="w-10 h-10 rounded-xl bg-primary-500/15 flex items-center justify-center mb-3">
                    <Shield className="w-5 h-5 text-primary-500" />
                  </div>
                  <h3 className="font-semibold text-text-high mb-1">Secured by XRPL</h3>
                  <p className="text-xs text-text-med leading-relaxed">
                    Funds are held in escrow and released based on verified merchant milestones.
                  </p>
                </CardContent>
              </Card>
              <Card className="glass-card border-0 hover:bg-surface-800/60 transition-colors">
                <CardContent className="p-5">
                  <div className="w-10 h-10 rounded-xl bg-accent-500/15 flex items-center justify-center mb-3">
                    <ArrowUpRight className="w-5 h-5 text-accent-500" />
                  </div>
                  <h3 className="font-semibold text-text-high mb-1">Automated Returns</h3>
                  <p className="text-xs text-text-med leading-relaxed">
                    Revenue share is automatically distributed to token holders via payment channels.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {!activeToken && !isSearching && (
          /* Empty State / Intro */
          <div className="mt-8 text-center py-12 animate-fade-in">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-surface-800 border border-surface-700 mb-4">
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
