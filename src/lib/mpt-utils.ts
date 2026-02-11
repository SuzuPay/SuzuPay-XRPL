import { MPTokenIssuanceCreate, OfferCreate, convertStringToHex } from 'xrpl';
import { getClient } from './xrpl-client';

// Constants for the Fund Token
export const MPT_FLAGS = {
  tfMPTCanTransfer: 0x00000020, // Allow transfers
  tfMPTCanTrade: 0x00000010,    // Allow trading on DEX
  tfMPTCanClawback: 0x00000040, // Allow clawback (optional)
  tfMPTCanEscrow: 0x00000008,   // Allow escrow
};

// Interface for MPT Issuance data
export interface MPTIssuanceData {
  mpt_issuance_id: string;
  issuer: string;
  max_amount: string;
  outstanding_amount: string;
  metadata?: string; // Hex
  metadataRec?: Record<string, any>; // Parsed JSON
}

/**
 * Constructs a Transaction to issue a new MPT.
 * @param account Issuer Account Address
 * @param metadata Metadata object (ticker, name, etc.)
 * @param maxAmount Maximum supply (e.g., "1000000")
 * @param assetScale Asset scale (decimals), defaulting to 0
 */
export function constructMPTIssuanceTx(
  account: string,
  metadata: { ticker: string; name: string; description: string },
  maxAmount: string = "1000000",
  assetScale: number = 0
): MPTokenIssuanceCreate {
  const metadataJson = JSON.stringify(metadata);
  const metadataHex = convertStringToHex(metadataJson);
  const maxAmountVal = BigInt(maxAmount).toString(10);

  return {
    TransactionType: "MPTokenIssuanceCreate",
    Account: account,
    AssetScale: assetScale,
    MaximumAmount: maxAmountVal, 
    MPTokenMetadata: metadataHex,
    Flags: MPT_FLAGS.tfMPTCanTransfer | MPT_FLAGS.tfMPTCanTrade | MPT_FLAGS.tfMPTCanEscrow | MPT_FLAGS.tfMPTCanClawback,
    TransferFee: 0,
  };
}

/**
 * Constructs a Sell Offer (Merchant defines price).
 * @param account Merchant Account
 * @param mptIssuanceID MPT ID to sell
 * @param amount MPT Amount to sell (e.g. "100")
 * @param priceInXRP Total XRP asking price (in drops) for the *entire* amount
 */
export function constructMPTSellOfferTx(
  account: string,
  mptIssuanceID: string,
  amount: string,
  priceInXRP: string 
): OfferCreate {
  const mptAmountVal = BigInt(amount).toString(10);

  return {
    TransactionType: "OfferCreate",
    Account: account,
    Flags: 524288, // tfSell
    TakerGets: {
        mpt_issuance_id: mptIssuanceID,
        value: mptAmountVal
    } as any,
    TakerPays: priceInXRP // Amount in drops
  };
}

/**
 * Constructs a Buy Offer (Investor buys MPT).
 * @param account Investor Account
 * @param mptIssuanceID MPT ID to buy
 * @param mptAmount Amount of MPT to buy
 * @param xrpAmount XRP Amount to pay (in drops)
 */
export function constructMPTBuyOfferTx(
  account: string,
  mptIssuanceID: string,
  mptAmount: string,
  xrpAmount: string
): OfferCreate {
  const mptAmountVal = BigInt(mptAmount).toString(10);

  return {
    TransactionType: "OfferCreate",
    Account: account,
    TakerGets: xrpAmount, // I give XRP (drops)
    TakerPays: {          // I want MPT
        mpt_issuance_id: mptIssuanceID,
        value: mptAmountVal
    } as any
  };
}


/**
 * Helper: Parse Metadata from Hex
 */
function parseMetadata(hex: string): any {
  try {
    let str = "";
    for (let i = 0; i < hex.length; i += 2) {
      str += String.fromCharCode(parseInt(hex.substr(i, 2), 16));
    }
    return JSON.parse(str);
  } catch (e) {
    return null;
  }
}

/**
 * Fetches all MPT Issuances for a given account.
 * Used to find the newly created "SZP-FUND" token.
 */
export async function getAccountMPTIssuances(account: string): Promise<MPTIssuanceData[]> {
  const client = await getClient();
  const response = await client.request({
    command: "account_objects",
    account: account,
    type: "mpt_issuance" as any, // Type might need casting if generic string not allowed
    deletion_blockers_only: false
  });

  if (!response.result.account_objects) return [];

  // Filter and map
  return response.result.account_objects
    .filter((obj: any) => obj.LedgerEntryType === "MPTokenIssuance")
    .map((obj: any) => ({
      mpt_issuance_id: obj.mpt_issuance_id as string || "", // Ensure field exists
      issuer: obj.Issuer as string || account,
      max_amount: BigInt("0x" + (obj.MaximumAmount || "0")).toString(),
      outstanding_amount: BigInt("0x" + (obj.OutstandingAmount || "0")).toString(),
      metadata: obj.MPTokenMetadata,
      metadataRec: obj.MPTokenMetadata ? parseMetadata(obj.MPTokenMetadata) : undefined
    }));
}

/**
 * Fetches Sell Offers for a specific MPT Issuance ID from an account.
 * Used to determine the price/exchange rate.
 */
export async function getMPTSellOffers(account: string, mptIssuanceID: string): Promise<any[]> {
  const client = await getClient();
  const response = await client.request({
    command: "account_offers",
    account: account
  });

  if (!response.result.offers) return [];

  return response.result.offers.filter((offer: any) => {
    // Check if taker_gets is the MPT we are looking for
    // Note: account_offers API returns snake_case (taker_gets, taker_pays)
    // taker_gets can be string (XRP) or object (Token/MPT)
    if (typeof offer.taker_gets === 'string') return false;
    
    // Check for MPT (mpt_issuance_id)
    return offer.taker_gets.mpt_issuance_id === mptIssuanceID;
  });
}
