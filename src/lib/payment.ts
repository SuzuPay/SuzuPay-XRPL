import { Payment, xrpToDrops } from 'xrpl';

interface BuildPaymentParams {
  source: string;
  destination: string;
  amount: string; // Amount in XRP (decimal string)
  currency?: 'XRP'; // Currently only XRP supported for straightforward payments
  destinationTag?: number;
  memo?: string;
}

/**
 * Builds a standard XRP Payment transaction object.
 * Converts XRP amount to drops automatically.
 */
export function buildPaymentTx({
  source,
  destination,
  amount,
  currency = 'XRP',
  destinationTag,
  memo
}: BuildPaymentParams): Payment {
  if (!source || !destination || !amount) {
    throw new Error('Missing required payment parameters');
  }

  const drops = xrpToDrops(amount);

  const tx: Payment = {
    TransactionType: 'Payment',
    Account: source,
    Destination: destination,
    Amount: drops,
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
