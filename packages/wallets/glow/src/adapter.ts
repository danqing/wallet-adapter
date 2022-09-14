import type {
    EventEmitter,
    SendTransactionOptions,
    WalletAdapterNetwork,
    WalletName,
} from '@solana/wallet-adapter-base';
import {
    BaseMessageSignerWalletAdapter,
    scopePollingDetectionStrategy,
    WalletAccountError,
    WalletConnectionError,
    WalletDisconnectedError,
    WalletDisconnectionError,
    WalletError,
    WalletNotConnectedError,
    WalletNotReadyError,
    WalletPublicKeyError,
    WalletReadyState,
    WalletSendTransactionError,
    WalletSignMessageError,
    WalletSignTransactionError,
} from '@solana/wallet-adapter-base';
import type { Connection, SendOptions, Transaction, TransactionSignature } from '@solana/web3.js';
import { PublicKey } from '@solana/web3.js';

interface GlowWalletEvents {
    connect(...args: unknown[]): unknown;
    disconnect(...args: unknown[]): unknown;
}

interface GlowWallet extends EventEmitter<GlowWalletEvents> {
    isGlow?: boolean;
    publicKey?: { toBytes(): Uint8Array };
    isConnected: boolean;
    signTransaction(transaction: Transaction, network?: WalletAdapterNetwork | null): Promise<Transaction>;
    signAllTransactions(transactions: Transaction[], network?: WalletAdapterNetwork | null): Promise<Transaction[]>;
    signAndSendTransaction(
        transaction: Transaction,
        options?: SendOptions & { network?: WalletAdapterNetwork | null }
    ): Promise<{ signature: TransactionSignature }>;
    signMessage(message: Uint8Array): Promise<{ signature: Uint8Array }>;
    connect(): Promise<void>;
    disconnect(): Promise<void>;
}

interface GlowWindow extends Window {
    glowSolana?: GlowWallet;
}

declare const window: GlowWindow;

export interface GlowWalletAdapterConfig {
    network?: WalletAdapterNetwork;
}

export const GlowWalletName = 'Glow' as WalletName<'Glow'>;

export class GlowWalletAdapter extends BaseMessageSignerWalletAdapter {
    name = GlowWalletName;
    url = 'https://glow.app';
    icon =
        'data:image/png;base64,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';
    private _connecting: boolean;
    private _wallet: GlowWallet | null;
    private _publicKey: PublicKey | null;
    private _network: WalletAdapterNetwork | null;
    private _readyState: WalletReadyState =
        typeof window === 'undefined' || typeof document === 'undefined'
            ? WalletReadyState.Unsupported
            : WalletReadyState.NotDetected;

    constructor(config: GlowWalletAdapterConfig = {}) {
        super();
        this._connecting = false;
        this._wallet = null;
        this._publicKey = null;
        this._network = config.network || null;

        if (this._readyState !== WalletReadyState.Unsupported) {
            const handler = (event: MessageEvent<any>) => {
                if (typeof event.data === 'object' && event.data.__glow_loaded) {
                    if (this._readyState !== WalletReadyState.Installed) {
                        this._readyState = WalletReadyState.Installed;
                        this.emit('readyStateChange', this._readyState);
                    }
                    window.removeEventListener('message', handler);
                }
            };

            window.addEventListener('message', handler);

            scopePollingDetectionStrategy(() => {
                if (window.glowSolana?.isGlow) {
                    window.removeEventListener('message', handler);
                    if (this._readyState !== WalletReadyState.Installed) {
                        this._readyState = WalletReadyState.Installed;
                        this.emit('readyStateChange', this._readyState);
                    }
                    return true;
                }
                return false;
            });
        }
    }

    get publicKey() {
        return this._publicKey;
    }

    get connecting() {
        return this._connecting;
    }

    get connected() {
        return !!this._wallet?.isConnected;
    }

    get readyState() {
        return this._readyState;
    }

    async connect(): Promise<void> {
        try {
            if (this.connected || this.connecting) return;
            if (this._readyState !== WalletReadyState.Installed) throw new WalletNotReadyError();

            this._connecting = true;

            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            const wallet = window.glowSolana!;

            try {
                await wallet.connect();
            } catch (error: any) {
                throw new WalletConnectionError(error?.message, error);
            }

            if (!wallet.publicKey) throw new WalletAccountError();

            let publicKey: PublicKey;
            try {
                publicKey = new PublicKey(wallet.publicKey.toBytes());
            } catch (error: any) {
                throw new WalletPublicKeyError(error?.message, error);
            }

            wallet.on('disconnect', this._disconnected);

            this._wallet = wallet;
            this._publicKey = publicKey;

            this.emit('connect', publicKey);
        } catch (error: any) {
            this.emit('error', error);
            throw error;
        } finally {
            this._connecting = false;
        }
    }

    async disconnect(): Promise<void> {
        const wallet = this._wallet;
        if (wallet) {
            wallet.off('disconnect', this._disconnected);

            this._wallet = null;
            this._publicKey = null;

            try {
                await wallet.disconnect();
            } catch (error: any) {
                this.emit('error', new WalletDisconnectionError(error?.message, error));
            }
        }

        this.emit('disconnect');
    }

    async sendTransaction(
        transaction: Transaction,
        connection: Connection,
        options: SendTransactionOptions = {}
    ): Promise<TransactionSignature> {
        try {
            const wallet = this._wallet;
            if (!wallet) throw new WalletNotConnectedError();

            try {
                const { signers, ...sendOptions } = options;

                transaction = await this.prepareTransaction(transaction, connection, sendOptions);

                signers?.length && transaction.partialSign(...signers);

                sendOptions.preflightCommitment = sendOptions.preflightCommitment || connection.commitment;

                const { signature } = await wallet.signAndSendTransaction(transaction, {
                    ...sendOptions,
                    network: this._network,
                });
                return signature;
            } catch (error: any) {
                if (error instanceof WalletError) throw error;
                throw new WalletSendTransactionError(error?.message, error);
            }
        } catch (error: any) {
            this.emit('error', error);
            throw error;
        }
    }

    async signTransaction(transaction: Transaction): Promise<Transaction> {
        try {
            const wallet = this._wallet;
            if (!wallet) throw new WalletNotConnectedError();

            try {
                return (await wallet.signTransaction(transaction, this._network)) || transaction;
            } catch (error: any) {
                throw new WalletSignTransactionError(error?.message, error);
            }
        } catch (error: any) {
            this.emit('error', error);
            throw error;
        }
    }

    async signAllTransactions(transactions: Transaction[]): Promise<Transaction[]> {
        try {
            const wallet = this._wallet;
            if (!wallet) throw new WalletNotConnectedError();

            try {
                return (await wallet.signAllTransactions(transactions, this._network)) || transactions;
            } catch (error: any) {
                throw new WalletSignTransactionError(error?.message, error);
            }
        } catch (error: any) {
            this.emit('error', error);
            throw error;
        }
    }

    async signMessage(message: Uint8Array): Promise<Uint8Array> {
        try {
            const wallet = this._wallet;
            if (!wallet) throw new WalletNotConnectedError();

            try {
                const { signature } = await wallet.signMessage(message);
                return signature;
            } catch (error: any) {
                throw new WalletSignMessageError(error?.message, error);
            }
        } catch (error: any) {
            this.emit('error', error);
            throw error;
        }
    }

    private _disconnected = () => {
        const wallet = this._wallet;
        if (wallet) {
            wallet.off('disconnect', this._disconnected);

            this._wallet = null;
            this._publicKey = null;

            this.emit('error', new WalletDisconnectedError());
            this.emit('disconnect');
        }
    };
}
