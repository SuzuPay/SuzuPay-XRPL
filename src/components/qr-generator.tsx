import { QRCodeSVG } from 'qrcode.react';
import { generateXamanPaymentURL, generateGenericPaymentRequest } from '@/lib/payment-request';

interface QRGeneratorProps {
  destination: string;
  amount: string;
  currency?: string;
  destinationTag?: number;
  size?: number;
  type?: 'xaman' | 'generic';
}

export function QRGenerator({ 
  destination, 
  amount, 
  currency = 'XRP', 
  destinationTag,
  size = 256,
  type = 'xaman'
}: QRGeneratorProps) {
  
  let qrData = '';

  if (type === 'xaman') {
    const { url } = generateXamanPaymentURL(destination, amount, {
      currency,
      destinationTag,
      network: 'XRPL'
    });
    qrData = url;
  } else {
    qrData = generateGenericPaymentRequest(destination, amount, {
      currency,
      destinationTag
    });
  }

  return (
    <div className="bg-white p-4 rounded-xl shadow-sm inline-block">
      <QRCodeSVG
        value={qrData}
        size={size}
        level="M"
        includeMargin={false}
        className="w-full h-full"
      />
    </div>
  );
}
