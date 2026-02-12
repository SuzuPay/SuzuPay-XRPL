'use client';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { WalletConnectButton } from '@/components/wallet-connect-button';
import { Logo } from '@/components/logo';
import { type ReactNode } from 'react';

interface PageHeaderProps {
  title: string;
  /** Pass `true` for the default branded "S" icon, or a ReactNode for a custom icon */
  icon?: boolean | ReactNode;
  showLogo?: boolean;
  /** Custom CSS class for the icon container background (default: gradient-primary) */
  iconBg?: string;
}

export function PageHeader({ title, icon, showLogo = false, iconBg }: PageHeaderProps) {
  const renderIcon = () => {
    if (!icon) return null;
    if (icon === true) {
      // Default branded "S" icon
      return (
        <div className={`w-8 h-8 rounded-lg ${iconBg || 'gradient-primary'} flex items-center justify-center`}>
          <span className="text-white font-bold text-lg">S</span>
        </div>
      );
    }
    // Custom icon ReactNode
    return (
      <div className={`w-8 h-8 rounded-lg ${iconBg || 'gradient-primary'} flex items-center justify-center`}>
        {icon}
      </div>
    );
  };

  return (
    <header className="border-b border-surface-700 bg-surface-800/60 backdrop-blur-md sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <Link href="/" className="p-2 rounded-lg hover:bg-surface-700 transition-colors">
            <ArrowLeft className="w-5 h-5 text-text-med" />
          </Link>
          {showLogo ? (
            <Logo size="sm" />
          ) : (
            <div className="flex items-center gap-2">
              {renderIcon()}
              <span className="text-xl font-bold text-text-high">{title}</span>
            </div>
          )}
        </div>
        <WalletConnectButton />
      </div>
    </header>
  );
}

