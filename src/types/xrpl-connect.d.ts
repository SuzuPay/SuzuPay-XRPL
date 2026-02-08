/**
 * Type declarations for xrpl-connect web component
 * 
 * React 19 / Next.js 16 requires module augmentation instead of global declaration
 * See: https://github.com/DefinitelyTyped/DefinitelyTyped/discussions/71395
 */

import type { DetailedHTMLProps, HTMLAttributes } from 'react';

// Custom attributes for the xrpl-wallet-connector web component
interface XRPLWalletConnectorAttributes {
  'background-color'?: string;
  'primary-color'?: string;
  'primary-wallet'?: string;
}

// Augment the JSX runtime module (required for React 19 with "jsx": "react-jsx")
declare module 'react/jsx-runtime' {
  namespace JSX {
    interface IntrinsicElements {
      'xrpl-wallet-connector': DetailedHTMLProps<
        HTMLAttributes<HTMLElement> & XRPLWalletConnectorAttributes,
        HTMLElement
      >;
    }
  }
}

export {};
