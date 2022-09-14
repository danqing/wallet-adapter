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
        'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNTYiIGhlaWdodD0iMjU2IiBmaWxsPSJub25lIj48ZyBjbGlwLXBhdGg9InVybCgjYSkiPjxnIGZpbHRlcj0idXJsKCNiKSI+PHBhdGggZmlsbD0idXJsKCNjKSIgZD0iTTAgMGgyNTZ2MjU2SDB6Ii8+PC9nPjxnIGZpbGwtcnVsZT0iZXZlbm9kZCIgY2xpcC1ydWxlPSJldmVub2RkIiBmaWx0ZXI9InVybCgjZCkiIHNoYXBlLXJlbmRlcmluZz0iY3Jpc3BFZGdlcyI+PHBhdGggZmlsbD0idXJsKCNlKSIgZD0iTTE5MSAxOTJhOTAgOTAgMCAwIDEtMTI2IDBjMzctMjkgODktMjkgMTI2IDBabTEtMWE5MCA5MCAwIDAgMCAwLTEyNmMtMjkgMzctMjkgODkgMCAxMjZabS0xLTEyN2MtMzcgMjktODkgMjktMTI2IDBhOTAgOTAgMCAwIDEgMTI2IDBaTTY0IDY1YTkwIDkwIDAgMCAwIDAgMTI2YzI5LTM3IDI5LTg5IDAtMTI2WiIvPjxwYXRoIGZpbGw9InVybCgjZikiIGQ9Ik0xOTEgMTkyYTkwIDkwIDAgMCAxLTEyNiAwYzM3LTI5IDg5LTI5IDEyNiAwWm0xLTFhOTAgOTAgMCAwIDAgMC0xMjZjLTI5IDM3LTI5IDg5IDAgMTI2Wm0tMS0xMjdjLTM3IDI5LTg5IDI5LTEyNiAwYTkwIDkwIDAgMCAxIDEyNiAwWk02NCA2NWE5MCA5MCAwIDAgMCAwIDEyNmMyOS0zNyAyOS04OSAwLTEyNloiLz48L2c+PC9nPjxkZWZzPjxyYWRpYWxHcmFkaWVudCBpZD0iYyIgY3g9IjAiIGN5PSIwIiByPSIxIiBncmFkaWVudFRyYW5zZm9ybT0icm90YXRlKDQ0IC0yMCAzMCkgc2NhbGUoMzA2LjUgMzA1LjU2NikiIGdyYWRpZW50VW5pdHM9InVzZXJTcGFjZU9uVXNlIj48c3RvcCBzdG9wLWNvbG9yPSIjODBGIi8+PHN0b3Agb2Zmc2V0PSIuNSIgc3RvcC1jb2xvcj0iI0E3MzJENiIvPjxzdG9wIG9mZnNldD0iMSIgc3RvcC1jb2xvcj0iI0VGNzlGRiIvPjwvcmFkaWFsR3JhZGllbnQ+PHJhZGlhbEdyYWRpZW50IGlkPSJmIiBjeD0iMCIgY3k9IjAiIHI9IjEiIGdyYWRpZW50VHJhbnNmb3JtPSJyb3RhdGUoOTAgMCAxMjgpIHNjYWxlKDkwKSIgZ3JhZGllbnRVbml0cz0idXNlclNwYWNlT25Vc2UiPjxzdG9wIG9mZnNldD0iLjkiIHN0b3AtY29sb3I9IiNmZmYiIHN0b3Atb3BhY2l0eT0iMCIvPjxzdG9wIG9mZnNldD0iMSIgc3RvcC1jb2xvcj0iI2ZmZiIvPjwvcmFkaWFsR3JhZGllbnQ+PGZpbHRlciBpZD0iYiIgd2lkdGg9IjI1NiIgaGVpZ2h0PSIyNTYiIHg9IjAiIHk9IjAiIGNvbG9yLWludGVycG9sYXRpb24tZmlsdGVycz0ic1JHQiIgZmlsdGVyVW5pdHM9InVzZXJTcGFjZU9uVXNlIj48ZmVGbG9vZCBmbG9vZC1vcGFjaXR5PSIwIiByZXN1bHQ9IkJhY2tncm91bmRJbWFnZUZpeCIvPjxmZUJsZW5kIGluPSJTb3VyY2VHcmFwaGljIiBpbjI9IkJhY2tncm91bmRJbWFnZUZpeCIgcmVzdWx0PSJzaGFwZSIvPjxmZUNvbG9yTWF0cml4IGluPSJTb3VyY2VBbHBoYSIgcmVzdWx0PSJoYXJkQWxwaGEiIHZhbHVlcz0iMCAwIDAgMCAwIDAgMCAwIDAgMCAwIDAgMCAwIDAgMCAwIDAgMTI3IDAiLz48ZmVPZmZzZXQvPjxmZUdhdXNzaWFuQmx1ciBzdGREZXZpYXRpb249IjIyLjUiLz48ZmVDb21wb3NpdGUgaW4yPSJoYXJkQWxwaGEiIGsyPSItMSIgazM9IjEiIG9wZXJhdG9yPSJhcml0aG1ldGljIi8+PGZlQ29sb3JNYXRyaXggdmFsdWVzPSIwIDAgMCAwIDAgMCAwIDAgMCAwIDAgMCAwIDAgMCAwIDAgMCAwLjUgMCIvPjxmZUJsZW5kIGluMj0ic2hhcGUiIG1vZGU9Im92ZXJsYXkiIHJlc3VsdD0iZWZmZWN0MV9pbm5lclNoYWRvd18xOTk3Xzk0NjIiLz48L2ZpbHRlcj48ZmlsdGVyIGlkPSJkIiB3aWR0aD0iMjEyLjIiIGhlaWdodD0iMjEyLjIiIHg9IjIxLjkiIHk9IjM4IiBjb2xvci1pbnRlcnBvbGF0aW9uLWZpbHRlcnM9InNSR0IiIGZpbHRlclVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PGZlRmxvb2QgZmxvb2Qtb3BhY2l0eT0iMCIgcmVzdWx0PSJCYWNrZ3JvdW5kSW1hZ2VGaXgiLz48ZmVDb2xvck1hdHJpeCBpbj0iU291cmNlQWxwaGEiIHJlc3VsdD0iaGFyZEFscGhhIiB2YWx1ZXM9IjAgMCAwIDAgMCAwIDAgMCAwIDAgMCAwIDAgMCAwIDAgMCAwIDEyNyAwIi8+PGZlT2Zmc2V0IGR5PSIxNi4xIi8+PGZlR2F1c3NpYW5CbHVyIHN0ZERldmlhdGlvbj0iOC4xIi8+PGZlQ29tcG9zaXRlIGluMj0iaGFyZEFscGhhIiBvcGVyYXRvcj0ib3V0Ii8+PGZlQ29sb3JNYXRyaXggdmFsdWVzPSIwIDAgMCAwIDAgMCAwIDAgMCAwIDAgMCAwIDAgMCAwIDAgMCAwLjIgMCIvPjxmZUJsZW5kIGluMj0iQmFja2dyb3VuZEltYWdlRml4IiBtb2RlPSJvdmVybGF5IiByZXN1bHQ9ImVmZmVjdDFfZHJvcFNoYWRvd18xOTk3Xzk0NjIiLz48ZmVCbGVuZCBpbj0iU291cmNlR3JhcGhpYyIgaW4yPSJlZmZlY3QxX2Ryb3BTaGFkb3dfMTk5N185NDYyIiByZXN1bHQ9InNoYXBlIi8+PC9maWx0ZXI+PGxpbmVhckdyYWRpZW50IGlkPSJlIiB4MT0iMTI4IiB4Mj0iMTI4IiB5MT0iMzgiIHkyPSIyMTgiIGdyYWRpZW50VW5pdHM9InVzZXJTcGFjZU9uVXNlIj48c3RvcCBzdG9wLWNvbG9yPSIjZmZmIi8+PHN0b3Agb2Zmc2V0PSIxIiBzdG9wLWNvbG9yPSIjZmZmIiBzdG9wLW9wYWNpdHk9Ii43Ii8+PC9saW5lYXJHcmFkaWVudD48Y2xpcFBhdGggaWQ9ImEiPjxyZWN0IHdpZHRoPSIyNTYiIGhlaWdodD0iMjU2IiBmaWxsPSIjZmZmIiByeD0iNjQiLz48L2NsaXBQYXRoPjwvZGVmcz48L3N2Zz4=';
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
