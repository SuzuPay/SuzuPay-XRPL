import { QRCodeSVG } from 'qrcode.react';
import { generateXamanPaymentURL, generateGenericPaymentRequest } from '@/lib/payment-request';
import { Card, CardContent } from '@/components/ui/card';

interface QRGeneratorProps {
  destination: string;
  amount: string;
  currency?: string;
  issuer?: string;
  destinationTag?: number;
  size?: number;
  type?: 'xaman' | 'generic';
}

export function QRGenerator({ 
  destination, 
  amount, 
  currency = 'XRP', 
  issuer,
  destinationTag,
  size = 256,
  type = 'xaman'
}: QRGeneratorProps) {
  
  let qrData = '';

  if (type === 'xaman') {
    const { url } = generateXamanPaymentURL(destination, amount, {
      currency,
      issuer,
      destinationTag,
      network: 'XRPL'
    });
    qrData = url;
  } else {
    qrData = generateGenericPaymentRequest(destination, amount, {
      currency,
      issuer,
      destinationTag
    });
  }

  return (
    <Card className="bg-white border-0 shadow-lg shadow-black/20 inline-block overflow-hidden">
      <CardContent className="p-4">
        <QRCodeSVG
          value={qrData}
          size={size}
          level="M"
          includeMargin={false}
          className="w-full h-full"
        />
      </CardContent>
    </Card>
  );
}
