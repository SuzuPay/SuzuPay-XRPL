/**
 * XRPL Payment Request Utilities
 * Generates Xaman-compatible payment request URLs and manages payment tracking
 */

import { xrpToDrops } from 'xrpl';

export interface PaymentRequest {
  id: string;
  destination: string;
  amount: string; // XRP amount as string
  currency: 'XRP' | string; // XRP or issued currency code
  issuer?: string; // Required for issued currencies
  destinationTag?: number;
  invoiceId?: string;
  memo?: string;
  createdAt: Date;
  expiresAt: Date;
  status: 'pending' | 'completed' | 'expired' | 'cancelled';
}

export interface XamanPaymentURL {
  url: string;
  deepLink: string;
  qrData: string;
}

/**
 * Generate a unique payment request ID
 */
export function generatePaymentId(): string {
  return `pay_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Generate Xaman-compatible payment request URL
 * Format: https://xaman.app/detect/request:{destination}?amount={amount}&network=XRPL
 * 
 * @see https://docs.xaman.dev/simple-link-qr/payment-request-link
 */
export function generateXamanPaymentURL(
  destination: string,
  amount: string,
  options?: {
    destinationTag?: number;
    currency?: string;
    issuer?: string;
    invoiceId?: string;
    network?: 'XRPL' | 'XAHAU';
  }
): XamanPaymentURL {
  const network = options?.network || 'XRPL';
  const baseURL = `https://xaman.app/detect/request:${destination}`;
  
  const params = new URLSearchParams();
  
  // Add amount
  if (amount) {
    params.set('amount', amount);
  }
  
  // Add network
  params.set('network', network);
  
  // Add destination tag if provided
  if (options?.destinationTag) {
    params.set('dt', options.destinationTag.toString());
  }
  
  // Add issued currency details if not XRP
  if (options?.currency && options.currency !== 'XRP' && options?.issuer) {
    params.set('currency', options.currency);
    params.set('issuer', options.issuer);
  }
  
  // Add invoice ID if provided (must be 64 hex chars)
  if (options?.invoiceId) {
    params.set('invoiceid', options.invoiceId);
  }
  
  const url = `${baseURL}?${params.toString()}`;
  const deepLink = url.replace('https://xaman.app/', 'xaman://');
  
  return {
    url,
    deepLink,
    qrData: url, // QR codes should encode the https URL
  };
}

/**
 * Generate a simple JSON payment request (for non-Xaman wallets like Crossmark)
 * This creates a standard format that can be parsed by our pay page
 */
export function generateGenericPaymentRequest(
  destination: string,
  amount: string,
  options?: {
    currency?: string;
    issuer?: string;
    memo?: string;
    destinationTag?: number;
  }
): string {
  const paymentData = {
    type: 'XRPL_PAYMENT_REQUEST',
    version: '1.0',
    destination,
    amount,
    amountDrops: (options?.currency && options.currency !== 'XRP') ? undefined : xrpToDrops(amount),
    currency: options?.currency || 'XRP',
    issuer: options?.issuer,
    memo: options?.memo,
    destinationTag: options?.destinationTag,
    network: process.env.NEXT_PUBLIC_XRPL_NETWORK || 'mainnet',
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(), // 15 min expiry
  };
  
  return JSON.stringify(paymentData);
}

/**
 * Parse a payment request from QR data
 */
export function parsePaymentRequest(qrData: string): {
  isXamanURL: boolean;
  destination?: string;
  amount?: string;
  currency?: string;
  issuer?: string;
  destinationTag?: number;
  memo?: string;
  raw: string;
} {
  // Check if it's a Xaman URL
  if (qrData.startsWith('https://xaman.app/detect/request:') || 
      qrData.startsWith('xaman://detect/request:')) {
    const url = new URL(qrData.replace('xaman://', 'https://xaman.app/'));
    const pathMatch = url.pathname.match(/\/detect\/request:(.+)/);
    
    return {
      isXamanURL: true,
      destination: pathMatch ? pathMatch[1] : undefined,
      amount: url.searchParams.get('amount') || undefined,
      currency: url.searchParams.get('currency') || 'XRP',
      issuer: url.searchParams.get('issuer') || undefined,
      destinationTag: url.searchParams.get('dt') ? parseInt(url.searchParams.get('dt')!) : undefined,
      raw: qrData,
    };
  }
  
  // Try to parse as JSON payment request
  try {
    const data = JSON.parse(qrData);
    if (data.type === 'XRPL_PAYMENT_REQUEST') {
      return {
        isXamanURL: false,
        destination: data.destination,
        amount: data.amount,
        currency: data.currency || 'XRP',
        issuer: data.issuer,
        destinationTag: data.destinationTag,
        memo: data.memo,
        raw: qrData,
      };
    }
    
    // Legacy format support (simple JSON)
    if (data.to || data.destination) {
      return {
        isXamanURL: false,
        destination: data.to || data.destination,
        amount: data.amount,
        currency: data.currency || 'XRP',
        issuer: data.issuer,
        destinationTag: data.destinationTag,
        memo: data.memo || data.description,
        raw: qrData,
      };
    }
  } catch {
    // Not valid JSON
  }
  
  // Unknown format
  return {
    isXamanURL: false,
    raw: qrData,
  };
}

/**
 * Validate an XRPL address
 */
export function isValidXRPLAddress(address: string): boolean {
  // XRPL uses base58check encoding — excludes 0, O, I, l
  return /^r[1-9A-HJ-NP-Za-km-z]{24,34}$/.test(address);
}

/**
 * Format amount for display with proper decimals
 */
export function formatXRPAmount(amount: string | number): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(num)) return '0';
  
  // XRP has 6 decimal places max
  return num.toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 6,
  });
}
