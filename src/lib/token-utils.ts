import { 
  AccountSet, 
  TrustSet, 
  OfferCreate, 
  Payment,
  xrpToDrops, 
  dropsToXrp, 
  AccountLinesRequest,
  AccountInfoRequest,
  Transaction,
  Client, // Import Client type for client usage
  BookOffersRequest
} from 'xrpl';
import { getClient } from './xrpl-client';

export interface TokenInfo {
  currency: string;
  issuer: string;
  value: string;
}

// ── RLUSD Configuration ──────────────────────────────────────────────────
export const RLUSD_CONFIG: TokenInfo = {
  currency: 'RLUSD',
  // Default to Testnet issuer if environment variable is not explicitly set
  issuer: process.env.NEXT_PUBLIC_RLUSD_ISSUER || process.env.NEXT_PUBLIC_RLUSD_ISSUER_TESTNET || 'rQhWct2VNDRj1toKchXEqEUNyHkE5y14Wz',
  value: '0' // For TokenInfo compatibility
};

// ── Account Configuration ────────────────────────────────────────────────

/**
 * Ensures the merchant account has DefaultRipple enabled.
 * This is required for users to trade the merchant's tokens freely.
 */
export async function ensureDefaultRipple(address: string): Promise<AccountSet | null> {
  const client = await getClient();
  
  const accountInfo = await client.request({
    command: 'account_info',
    account: address,
    ledger_index: 'validated'
  });

  const flags = accountInfo.result.account_data.Flags;
  // tfDefaultRipple = 0x00800000 (8388608)
  const isDefaultRippleSet = (flags & 8388608) !== 0;

  if (isDefaultRippleSet) {
    return null; // Already set
  }

  // Create AccountSet transaction to enable DefaultRipple
  const tx: AccountSet = {
    TransactionType: 'AccountSet',
    Account: address,
    SetFlag: 8 // tfDefaultRipple
  };

  return tx;
}

// ── Trust Lines ──────────────────────────────────────────────────────────

/**
 * Checks if a user has a trust line for a specific token.
 */
export async function hasTrustLine(
  userAddress: string, 
  token: TokenInfo
): Promise<boolean> {
  const client = await getClient();
  
  try {
    const response = await client.request({
      command: 'account_lines',
      account: userAddress,
      peer: token.issuer,
      ledger_index: 'validated'
    });

    return response.result.lines.some(
      line => line.currency === token.currency && parseFloat(line.limit) > 0
    );
  } catch (error) {
    console.warn('Failed to check trust lines:', error);
    return false;
  }
}

/**
 * Constructs a TrustSet transaction for the user to trust the merchant's token.
 */
export function constructTrustSetTx(
  userAddress: string,
  token: TokenInfo,
  limit: string = '1000000000' // High default limit
): TrustSet {
  return {
    TransactionType: 'TrustSet',
    Account: userAddress,
    LimitAmount: {
      currency: token.currency,
      issuer: token.issuer,
      value: limit
    }
  };
}

// ── DEX Offers ───────────────────────────────────────────────────────────

/**
 * Constructs an OfferCreate transaction for the Merchant to SELL tokens for XRP.
 * This provides initial liquidity.
 */
export function constructSellOfferTx(
  merchantAddress: string,
  token: TokenInfo,
  amountToken: string, // How many tokens to sell
  amountXRP: string    // Total XRP requested
): OfferCreate {
  return {
    TransactionType: 'OfferCreate',
    Account: merchantAddress,
    TakerGets: {
      currency: token.currency,
      issuer: merchantAddress, // Self-issued
      value: amountToken
    },
    TakerPays: xrpToDrops(amountXRP)
  };
}

/**
 * Constructs an OfferCreate transaction for the User to BUY tokens with XRP.
 */
export function constructBuyOfferTx(
  userAddress: string,
  token: TokenInfo,
  amountToken: string, // How many tokens to buy
  maxXRP: string       // Max XRP willing to spend
): OfferCreate {
  return {
    TransactionType: 'OfferCreate',
    Account: userAddress,
    TakerGets: xrpToDrops(maxXRP), // User offers XRP
    TakerPays: {
      currency: token.currency,
      issuer: token.issuer,
      value: amountToken // User wants Token
    }
  };
}

/**
 * Fetches active Sell Offers for a specific token issued by the merchant.
 * This is used to "discover" the campaign and get the price.
 */
export async function getTokenSellOffers(
  merchantAddress: string,
  currencyCode: string = 'SZP'
): Promise<any[]> {
  const client = await getClient();
  
  try {
    // Look for offers where:
    // TakerGets = Merchant's Token (SZP)
    // TakerPays = XRP
    const response = await client.request({
      command: 'book_offers',
      taker_gets: {
        currency: currencyCode,
        issuer: merchantAddress
      },
      taker_pays: {
        currency: 'XRP'
      },
      ledger_index: 'validated',
      limit: 10
    });

    return response.result.offers;
  } catch (error) {
    console.warn('Failed to fetch sell offers:', error);
    return [];
  }
}

// ── Balances ─────────────────────────────────────────────────────────────

/**
 * Fetches all token balances for an account.
 */
export async function getAccountTokens(address: string): Promise<TokenInfo[]> {
  const client = await getClient();
  
  try {
    const response = await client.request({
      command: 'account_lines',
      account: address,
      ledger_index: 'validated'
    });

    return response.result.lines.map(line => ({
      currency: line.currency,
      issuer: line.account,
      value: line.balance
    }));
  } catch (error) {
    console.error('Failed to fetch account tokens:', error);
    return [];
  }
}
