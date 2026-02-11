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
    <Card className="glass-card border-0 shadow-2xl shadow-[rgb(var(--color-success))]/10 animate-scale-in overflow-hidden relative">
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[rgb(var(--color-success))] to-transparent opacity-50"></div>
      <CardContent className="p-8 text-center relative z-10">
        {/* Success Icon */}
        <div className="w-24 h-24 rounded-full bg-[rgb(var(--color-success))]/10 flex items-center justify-center mx-auto mb-6 glow-primary shadow-lg shadow-[rgb(var(--color-success))]/20 animate-pulse-slow">
          <CheckCircle2 className="w-12 h-12 text-success drop-shadow-md" />
        </div>

        <h3 className="text-3xl font-extrabold text-success mb-2 glow-text">Payment Sent!</h3>
        <p className="text-text-med mb-8 text-lg">
          You successfully sent{' '}
          <strong className="text-text-high text-xl">{amount} {currency}</strong>
        </p>

        {/* Transaction Details */}
        <div className="p-5 bg-surface-900/50 rounded-2xl mb-8 text-left space-y-4 border border-white/5 shadow-inner">
          <div className="flex justify-between items-center">
            <span className="text-text-low text-sm font-medium uppercase tracking-wider">Recipient</span>
            <span className="font-mono text-text-high text-sm bg-surface-800 px-2 py-1 rounded-md border border-white/5">{truncateAddress(destination)}</span>
          </div>
          {txHash && (
            <>
              <Separator className="bg-white/5" />
              <div className="flex justify-between items-center">
                <span className="text-text-low text-sm font-medium uppercase tracking-wider">Transaction</span>
                <a
                  href={`https://testnet.xrpl.org/transactions/${txHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary-500 hover:text-primary-400 text-xs font-bold flex items-center gap-1.5 transition-colors bg-primary-500/10 px-3 py-1.5 rounded-full hover:bg-primary-500/20"
                >
                  View on Explorer
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </>
          )}
        </div>

        {/* Action Button */}
        <Button
          onClick={onReset}
          className="w-full h-14 rounded-xl font-bold text-white bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 transition-all shadow-lg shadow-primary-500/25 text-lg gap-2 hover:scale-[1.02]"
        >
          Make Another Payment
          <ArrowRight className="w-5 h-5" />
        </Button>
      </CardContent>
    </Card>
  );
}
