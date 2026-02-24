import { Payment, xrpToDrops } from 'xrpl';

/**
 * XRPL requires non-3-char currency codes as 40-char hex strings.
 * 3-char codes (e.g. 'USD', 'EUR') are passed as-is.
 */
function encodeCurrencyCode(code: string): string {
  if (code.length === 3) return code;
  // If already a 40-char hex string (e.g. from RLUSD_CONFIG.currency), pass through
  if (code.length === 40 && /^[0-9A-Fa-f]{40}$/.test(code)) return code;
  // Convert ASCII to hex and right-pad to 40 chars (20 bytes)
  const hex = Array.from(code)
    .map(c => c.charCodeAt(0).toString(16).toUpperCase())
    .join('');
  return hex.padEnd(40, '0');
}

interface BuildPaymentParams {
  source: string;
  destination: string;
  amount: string; // Amount in decimal string
  currency?: string; // e.g. 'XRP' or 'RLUSD'
  issuer?: string; // Required for issued currencies
  destinationTag?: number;
  memo?: string;
}

/**
 * Builds a standard XRPL Payment transaction object.
 * Converts XRP amount to drops automatically, formats issued currencies correctly.
 */
export function buildPaymentTx({
  source,
  destination,
  amount,
  currency = 'XRP',
  issuer,
  destinationTag,
  memo
}: BuildPaymentParams): Payment {
  if (!source || !destination || !amount) {
    throw new Error('Missing required payment parameters');
  }

  if (currency !== 'XRP' && !issuer) {
    throw new Error('Issuer is required for issued currencies');
  }

  const xrplAmount = currency === 'XRP' 
    ? xrpToDrops(amount)
    : {
        currency: encodeCurrencyCode(currency),
        issuer: issuer as string,
        value: amount
      };

  const tx: Payment = {
    TransactionType: 'Payment',
    Account: source,
    Destination: destination,
    Amount: xrplAmount,
  };

  if (destinationTag) {
    tx.DestinationTag = destinationTag;
  }

  if (memo) {
    tx.Memos = [
      {
        Memo: {
          MemoData: Buffer.from(memo, 'utf8').toString('hex').toUpperCase()
        }
      }
    ];
  }

  return tx;
}
