/**
 * XRPL Client Configuration
 * Handles connection to XRPL Testnet for payment transactions
 */

import { Client, Wallet, Payment, xrpToDrops, dropsToXrp } from 'xrpl';

// Network Configuration
export const XRPL_NETWORKS = {
  mainnet: 'wss://xrplcluster.com',
  testnet: 'wss://s.altnet.rippletest.net:51233',
  devnet: 'wss://s.devnet.rippletest.net:51233',
} as const;

export type NetworkType = keyof typeof XRPL_NETWORKS;

// Get current network from env
export const getCurrentNetwork = (): NetworkType => {
  const network = process.env.NEXT_PUBLIC_XRPL_NETWORK || 'testnet';
  return network as NetworkType;
};

export const getNetworkUrl = (): string => {
  return process.env.NEXT_PUBLIC_XRPL_WS_URL || XRPL_NETWORKS[getCurrentNetwork()];
};

// Singleton client instance
let clientInstance: Client | null = null;
let connectPromise: Promise<void> | null = null;

async function ensureConnected(client: Client): Promise<void> {
  if (client.isConnected()) {
    return;
  }

  if (!connectPromise) {
    connectPromise = client.connect()
      .then(() => {
        connectPromise = null;
      })
      .catch((error) => {
        connectPromise = null;
        throw error;
      });
  }

  await connectPromise;
}

/**
 * Get or create XRPL client connection
 */
export async function getClient(): Promise<Client> {
  if (!clientInstance) {
    const url = getNetworkUrl();
    clientInstance = new Client(url);
  }

  await ensureConnected(clientInstance);
  console.log(`✅ Connected to XRPL ${getCurrentNetwork()}: ${getNetworkUrl()}`);

  return clientInstance;
}

/**
 * Disconnect XRPL client
 */
export async function disconnectClient(): Promise<void> {
  if (clientInstance && clientInstance.isConnected()) {
    await clientInstance.disconnect();
    clientInstance = null;
    connectPromise = null;
    console.log('🔌 Disconnected from XRPL');
  }
}

/**
 * Get account info from XRPL
 */
export async function getAccountInfo(address: string) {
  const client = await getClient();
  
  try {
    const response = await client.request({
      command: 'account_info',
      account: address,
      ledger_index: 'validated',
    });
    
    return {
      address,
      balance: dropsToXrp(response.result.account_data.Balance),
      sequence: response.result.account_data.Sequence,
      ownerCount: response.result.account_data.OwnerCount,
    };
  } catch (error: any) {
    if (error.message?.includes('actNotFound')) {
      return {
        address,
        balance: '0',
        sequence: 0,
        ownerCount: 0,
        error: 'Account not found on ledger',
      };
    }
    throw error;
  }
}

/**
 * Get account XRP balance
 */
export async function getBalance(address: string): Promise<string> {
  const info = await getAccountInfo(address);
  return String(info.balance);
}

/**
 * Build a Payment transaction
 */
export interface PaymentParams {
  source: string;
  destination: string;
  amount: string; // XRP amount as string
  destinationTag?: number;
  memo?: string;
}

export function buildPaymentTransaction(params: PaymentParams): Payment {
  const payment: Payment = {
    TransactionType: 'Payment',
    Account: params.source,
    Destination: params.destination,
    Amount: xrpToDrops(params.amount),
  };

  if (params.destinationTag) {
    payment.DestinationTag = params.destinationTag;
  }

  if (params.memo) {
    payment.Memos = [
      {
        Memo: {
          MemoData: Buffer.from(params.memo, 'utf8').toString('hex').toUpperCase(),
        },
      },
    ];
  }

  return payment;
}

/**
 * Subscribe to account transactions (for real-time updates)
 */
export async function subscribeToAccount(
  address: string,
  onTransaction: (tx: any) => void
): Promise<() => void> {
  const client = await getClient();

  await client.request({
    command: 'subscribe',
    accounts: [address],
  });

  const handler = (tx: any) => {
    if (
      tx.transaction?.Account === address ||
      tx.transaction?.Destination === address
    ) {
      onTransaction(tx);
    }
  };

  client.on('transaction', handler);

  // Return unsubscribe function
  return async () => {
    client.off('transaction', handler);
    await client.request({
      command: 'unsubscribe',
      accounts: [address],
    });
  };
}

// Export utilities
export { xrpToDrops, dropsToXrp };
