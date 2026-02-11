import { CheckCircle2, ExternalLink, ArrowRight } from 'lucide-react';
import { truncateAddress } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

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
    <Card className="border-[rgb(var(--color-success))]/30 bg-surface-800 shadow-xl shadow-[rgba(34,197,94,0.06)] animate-scale-in overflow-hidden">
      <CardContent className="p-8 text-center">
        {/* Success Icon */}
        <div className="w-20 h-20 rounded-full bg-[rgb(var(--color-success))]/15 flex items-center justify-center mx-auto mb-5">
          <CheckCircle2 className="w-10 h-10 text-success" />
        </div>

        <h3 className="text-2xl font-bold text-success mb-2">Payment Sent!</h3>
        <p className="text-text-med mb-6">
          You successfully sent{' '}
          <strong className="text-text-high">{amount} {currency}</strong>
        </p>

        <Separator className="opacity-20 mb-6" />

        {/* Transaction Details */}
        <div className="p-4 bg-surface-700/50 rounded-xl mb-6 text-left space-y-3">
          <div className="flex justify-between items-center">
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
                className="text-primary-500 hover:text-primary-600 text-xs flex items-center gap-1 transition-colors"
              >
                View on Explorer
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          )}
        </div>

        {/* Action Button */}
        <Button
          onClick={onReset}
          className="w-full py-6 rounded-xl font-semibold text-white bg-primary-500 hover:bg-primary-600 transition-all shadow-lg shadow-[rgba(255,79,112,0.2)] text-base gap-2"
        >
          Make Another Payment
          <ArrowRight className="w-4 h-4" />
        </Button>
      </CardContent>
    </Card>
  );
}
