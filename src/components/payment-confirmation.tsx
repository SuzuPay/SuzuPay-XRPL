import { CheckCircle2, ExternalLink, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { truncateAddress } from '@/lib/utils';

interface PaymentConfirmationProps {
  amount: string;
  currency: string;
  destination: string;
  txHash?: string;
  onReset: () => void;
}

export function PaymentConfirmation({
  amount,
  currency,
  destination,
  txHash,
  onReset
}: PaymentConfirmationProps) {
  return (
    <div className="p-6 bg-surface-800 rounded-2xl border border-success/50 text-center animate-in fade-in zoom-in duration-300">
      <div className="w-16 h-16 rounded-full bg-success/20 flex items-center justify-center mx-auto mb-4">
        <CheckCircle2 className="w-8 h-8 text-success" />
      </div>
      
      <h3 className="text-2xl font-bold text-success mb-2">Payment Sent!</h3>
      <p className="text-text-med mb-6">
        You successfully sent <strong className="text-text-high">{amount} {currency}</strong>
      </p>

      <div className="p-4 bg-surface-700/50 rounded-xl mb-6 text-left">
        <div className="flex justify-between mb-2">
          <span className="text-text-low text-sm">Recipient</span>
          <span className="font-mono text-text-high text-sm">{truncateAddress(destination)}</span>
        </div>
        {txHash && (
          <div className="flex justify-between items-center">
            <span className="text-text-low text-sm">Transaction</span>
             <a
              href={`https://testnet.xrpl.org/transactions/${txHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary-500 hover:text-primary-400 text-xs flex items-center gap-1"
            >
              View on Explorer
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        )}
      </div>

      <button
        onClick={onReset}
        className="w-full py-4 rounded-xl font-semibold text-white bg-primary-500 hover:bg-primary-600 transition-all shadow-lg shadow-primary-500/20 flex items-center justify-center gap-2"
      >
        Make Another Payment
        <ArrowRight className="w-4 h-4" />
      </button>
    </div>
  );
}
