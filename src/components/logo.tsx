import Link from 'next/link';
import { Badge } from '@/components/ui/badge';

interface LogoProps {
  showText?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const sizeMap = {
  sm: { icon: 'w-7 h-7', text: 'text-base', badge: 'text-[10px]' },
  md: { icon: 'w-8 h-8', text: 'text-xl', badge: 'text-xs' },
  lg: { icon: 'w-10 h-10', text: 'text-2xl', badge: 'text-xs' },
};

export function Logo({ showText = true, size = 'md' }: LogoProps) {
  const s = sizeMap[size];

  return (
    <Link href="/" className="flex items-center gap-2 group">
      <div className={`${s.icon} rounded-lg gradient-primary flex items-center justify-center shadow-lg shadow-[rgba(255,79,112,0.15)] group-hover:shadow-[rgba(255,79,112,0.3)] transition-shadow`}>
        <span className="text-white font-bold text-lg">S</span>
      </div>
      {showText && (
        <div className="flex items-center gap-2">
          <span className={`${s.text} font-bold text-text-high`}>SuzuPay</span>
          <Badge variant="secondary" className={`${s.badge} bg-primary-600/20 text-primary-600 border-0 px-1.5 py-0`}>
            XRPL
          </Badge>
        </div>
      )}
    </Link>
  );
}
