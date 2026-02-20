import { Payment, xrpToDrops } from 'xrpl';

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
        currency: currency,
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
          MemoData: Buffer.from(memo, 'utf8').toString('hex')
        }
      }
    ];
  }

  return tx;
}
