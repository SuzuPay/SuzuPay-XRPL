/**
 * Type declarations for @crossmarkio/sdk
 * Based on official Crossmark docs: https://docs.crossmark.io/
 */

declare module '@crossmarkio/sdk' {
  /** Standard XRPL transaction request (Payment, OfferCreate, etc.) */
  type AllTransactionRequest = Record<string, any>;

  /** Options passed to sign/submit methods */
  interface SignOpts {
    description?: string;
    service?: {
      address: string;
      amount: string; // XRP in drops
    };
  }

  /** Response meta flags */
  interface CrossmarkResponseMeta {
    isError: boolean;
    isRejected: boolean;
    isExpired: boolean;
    isSigned: boolean;
    isPending: boolean;
    isSuccess: boolean;
    isFail: boolean;
    isVerified: boolean;
  }

  /** Base request structure */
  interface BaseRequest {
    app: string;
    type: string;
    id: string;
    command: string;
    data: Record<string, any>;
  }

  /** Base response structure */
  interface BaseResponse {
    app: string;
    id: string;
    type: string;
    data: {
      resp: {
        id?: number;
        result: Record<string, any>;
        type?: string;
      };
      meta: CrossmarkResponseMeta;
      service?: Record<string, any>;
    };
  }

  /** Result returned from async methods */
  interface CrossmarkResult {
    request: BaseRequest;
    response: BaseResponse;
    createdAt: number;
    resolvedAt: number;
  }

  /** Sign-in result */
  interface SignInResult {
    request: BaseRequest;
    response: {
      data: {
        address: string;
        publicKey?: string;
      };
    };
    createdAt: number;
    resolvedAt: number;
  }

  /** SDK methods namespace */
  interface CrossmarkMethods {
    /** Sign in with Crossmark wallet (async, waits for user) */
    signInAndWait(): Promise<SignInResult>;

    /** Sign a transaction (does NOT submit to ledger) */
    signAndWait(
      tx: AllTransactionRequest,
      opts?: SignOpts,
    ): Promise<CrossmarkResult>;

    /** Sign and submit a transaction to the XRPL */
    signAndSubmitAndWait(
      tx: AllTransactionRequest,
      opts?: SignOpts,
    ): Promise<CrossmarkResult>;

    /** Bulk sign multiple transactions */
    bulkSignAndWait(
      txns: AllTransactionRequest[],
      opts?: SignOpts,
    ): Promise<CrossmarkResult>;

    /** Bulk sign and submit multiple transactions */
    bulkSignAndSubmitAndWait(
      txns: AllTransactionRequest[],
      opts?: SignOpts,
    ): Promise<CrossmarkResult>;

    /** Submit a pre-signed transaction blob */
    submitAndWait(
      address: string,
      txblob: string,
      opts?: SignOpts,
    ): Promise<CrossmarkResult>;

    /** Bulk submit pre-signed transaction blobs */
    bulkSubmitAndWait(
      address: string,
      txblobs: string[],
      opts?: SignOpts,
    ): Promise<CrossmarkResult>;
  }

  /** Synchronous (fire-and-forget) methods that return a request ID */
  interface CrossmarkSyncMethods {
    signIn(): string;
    sign(tx: AllTransactionRequest, opts?: SignOpts): string;
    signAndSubmit(tx: AllTransactionRequest, opts?: SignOpts): string;
    submit(address: string, txblob: string, opts?: SignOpts): string;
    bulkSign(txns: AllTransactionRequest[], opts?: SignOpts): string;
    bulkSignAndSubmit(txns: AllTransactionRequest[], opts?: SignOpts): string;
    bulkSubmit(address: string, txblobs: string[], opts?: SignOpts): string;
  }

  /** The default SDK export */
  interface CrossmarkSDK {
    /** Async methods that return a Promise (recommended) */
    methods: CrossmarkMethods;

    /** Synchronous methods that return a request ID */
    sync: CrossmarkSyncMethods;

    /** Legacy alias for async methods */
    async: CrossmarkMethods;

    /** Connect to the Crossmark extension */
    connect(timeout?: number): Promise<boolean>;

    /** Check if Crossmark is connected */
    isConnected(): boolean;

    /** SDK version */
    version?: string;
    VERSION?: string;
  }

  const sdk: CrossmarkSDK;
  export default sdk;
}
