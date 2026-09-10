"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  useAccount,
  useConnect,
  useDisconnect,
  useSendTransaction,
  useWaitForTransactionReceipt,
  useWriteContract,
  useBalance,
} from "wagmi";
import { parseEther, parseUnits, formatEther } from "viem";
import {
  ArrowLeft,
  Wallet,
  ArrowRight,
  CheckCircle,
  Copy,
  Shield,
  Clock,
  Loader2,
  AlertCircle,
} from "lucide-react";
import AppShell from "@/components/layout/AppShell";
import {
  supportedCryptos,
  convertFromUSD,
  formatCryptoAmount,
  generateTxHash,
  shortenAddress,
  exchangeRates,
} from "@/data/crypto";
import {
  isWeb3Configured,
  getTokenAddress,
  ERC20_ABI,
} from "@/lib/web3/config";
import type { CheckoutState, PaymentTransaction } from "@/types";

function createTxId(): string {
  return `TX-${Date.now().toString(36).toUpperCase()}`;
}

function createNow(): Date {
  return new Date();
}

interface BuildPaymentTxArgs {
  id: string;
  type: "flight" | "apartment";
  itemId: string;
  itemTitle: string;
  amount: number;
  currency: string;
  cryptoCurrency: string;
  cryptoAmount: number;
  walletAddress: string;
  txHash?: string;
  createdAt: Date;
}

function buildPaymentTransaction(args: BuildPaymentTxArgs): PaymentTransaction {
  return {
    id: args.id,
    type: args.type,
    itemId: args.itemId,
    itemTitle: args.itemTitle,
    amount: args.amount,
    currency: args.currency,
    cryptoCurrency: args.cryptoCurrency,
    cryptoAmount: args.cryptoAmount,
    walletAddress: args.walletAddress,
    status: "confirming",
    txHash: args.txHash,
    createdAt: args.createdAt,
  };
}

function CheckoutContent() {
  const searchParams = useSearchParams();
  const type = searchParams.get("type") || "flight";
  const itemId = searchParams.get("id") || "";
  const amount = Number(searchParams.get("amount") || 0);
  const title = searchParams.get("title") || "Booking";

  const web3Ready = isWeb3Configured();
  const { address, isConnected, connector: activeConnector } = useAccount();
  const { connect, connectors, isPending: isConnecting } = useConnect();
  const { disconnect } = useDisconnect();

  const [state, setState] = useState<CheckoutState>({
    step: "select_crypto",
    selectedCrypto: null,
    walletConnected: false,
    transaction: null,
  });

  const [copied, setCopied] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [txError, setTxError] = useState<string | null>(null);

  const selectedWallet = supportedCryptos.find((c) => c.symbol === state.selectedCrypto);
  const cryptoAmount = state.selectedCrypto
    ? convertFromUSD(amount, state.selectedCrypto)
    : 0;

  const merchantWallet = (process.env.NEXT_PUBLIC_MERCHANT_WALLET || "0x0000000000000000000000000000000000000000") as `0x${string}`;

  const { data: ethBalance } = useBalance({
    address,
    query: { enabled: isConnected && state.selectedCrypto === "ETH" },
  });

  const {
    sendTransaction,
    isPending: isSendingEth,
    data: ethTxHash,
  } = useSendTransaction();

  const {
    writeContract,
    isPending: isSendingToken,
    data: tokenTxHash,
  } = useWriteContract();

  const actualTxHash = ethTxHash || tokenTxHash;

  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash: actualTxHash,
  });

  useEffect(() => {
    if (!web3Ready && state.step === "processing" && countdown > 0) {
      const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [state.step, countdown, web3Ready]);

  const web3TxComplete = web3Ready && state.step === "processing" && isConfirmed;
  const simulatedTxComplete = !web3Ready && state.step === "processing" && countdown === 0;
  const txComplete = web3TxComplete || simulatedTxComplete;
  const effectiveStep: CheckoutState["step"] = txComplete ? "complete" : state.step;

  function selectCrypto(symbol: string) {
    setTxError(null);
    setState((prev) => ({ ...prev, selectedCrypto: symbol, step: "connect_wallet" }));
  }

  function handleConnectWallet(connectorId: number) {
    const c = connectors[connectorId];
    if (!c) return;
    setTxError(null);
    connect(
      { connector: c },
      {
        onSuccess: () => {
          setState((prev) => ({ ...prev, walletConnected: true, step: "confirm" }));
        },
      }
    );
  }

  function handleSimulatedConnect() {
    setState((prev) => ({ ...prev, walletConnected: true, step: "confirm" }));
  }

  function confirmPayment() {
    setTxError(null);

    if (web3Ready && isConnected && state.selectedCrypto) {
      const tokenAddr = getTokenAddress(state.selectedCrypto);

      if (state.selectedCrypto === "ETH") {
        sendTransaction(
          { to: merchantWallet, value: parseEther(String(cryptoAmount)) },
          {
            onSuccess: (hash) => {
              setState((prev) => ({
                ...prev,
                step: "processing",
                transaction: buildPaymentTransaction({
                  id: createTxId(),
                  type: type as "flight" | "apartment",
                  itemId,
                  itemTitle: title,
                  amount,
                  currency: "USD",
                  cryptoCurrency: prev.selectedCrypto || state.selectedCrypto!,
                  cryptoAmount,
                  walletAddress: address || "",
                  txHash: hash,
                  createdAt: createNow(),
                }),
              }));
            },
            onError: (err) => setTxError(err.message.split("\n")[0]),
          }
        );
        return;
      }

      if (tokenAddr) {
        writeContract(
          {
            address: tokenAddr,
            abi: ERC20_ABI,
            functionName: "transfer",
            args: [merchantWallet, parseUnits(String(cryptoAmount), 6)],
          },
          {
            onSuccess: (hash) => {
              setState((prev) => ({
                ...prev,
                step: "processing",
                transaction: buildPaymentTransaction({
                  id: createTxId(),
                  type: type as "flight" | "apartment",
                  itemId,
                  itemTitle: title,
                  amount,
                  currency: "USD",
                  cryptoCurrency: prev.selectedCrypto || state.selectedCrypto!,
                  cryptoAmount,
                  walletAddress: address || "",
                  txHash: hash,
                  createdAt: createNow(),
                }),
              }));
            },
            onError: (err) => setTxError(err.message.split("\n")[0]),
          }
        );
        return;
      }
    }

    const txHash = generateTxHash();
    setState((prev) => ({
      ...prev,
      step: "processing",
      transaction: buildPaymentTransaction({
        id: createTxId(),
        type: type as "flight" | "apartment",
        itemId,
        itemTitle: title,
        amount,
        currency: "USD",
        cryptoCurrency: prev.selectedCrypto!,
        cryptoAmount,
        walletAddress: address || "0x-simulated",
        txHash,
        createdAt: createNow(),
      }),
    }));
    setCountdown(8);
  }

  const copyToClipboard = useCallback((text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, []);

  const walletDisplayAddr = web3Ready && isConnected
    ? address || ""
    : "0x-simulated";

  const connectorLabels: Record<string, string> = {
    injected: "MetaMask",
    metaMask: "MetaMask",
    walletConnect: "WalletConnect",
    coinbaseWallet: "Coinbase Wallet",
    coinbaseWalletSDK: "Coinbase Wallet",
  };

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <Link
        href={type === "flight" ? "/flights" : "/apartments"}
        className="flex items-center gap-2 text-sm font-medium transition-colors"
        style={{ color: "var(--kv-primary)" }}
      >
        <ArrowLeft className="h-4 w-4" /> Back to {type === "flight" ? "flights" : "apartments"}
      </Link>

      <div
        className="rounded-xl border p-5"
        style={{ background: "var(--kv-surface)", borderColor: "var(--kv-border)" }}
      >
        <h3 className="font-semibold mb-1" style={{ color: "var(--kv-text)" }}>Order Summary</h3>
        <p className="text-sm" style={{ color: "var(--kv-text-secondary)" }}>{title}</p>
        <div className="flex items-baseline gap-2 mt-2">
          <span className="text-2xl font-bold" style={{ color: "var(--kv-primary)" }}>
            ${amount.toLocaleString()}
          </span>
          <span className="text-sm" style={{ color: "var(--kv-text-tertiary)" }}>USD</span>
        </div>
        {!web3Ready && (
          <div className="flex items-center gap-2 mt-3 rounded-lg p-2.5 text-xs" style={{ background: "var(--kv-warning)10", color: "var(--kv-warning)" }}>
            <AlertCircle className="h-3.5 w-3.5 shrink-0" />
            Demo mode — set NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID for live wallets
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 mb-2">
        {(["select_crypto", "connect_wallet", "confirm", "processing", "complete"] as const).map(
          (s, i) => {
            const stepLabels = ["Select Crypto", "Connect Wallet", "Confirm", "Processing", "Complete"];
            const stepIndex = ["select_crypto", "connect_wallet", "confirm", "processing", "complete"].indexOf(effectiveStep);
            const isActive = i === stepIndex;
            const isDone = i < stepIndex;
            return (
              <div key={s} className="flex items-center gap-2 flex-1">
                <div
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-all"
                  style={{
                    background: isDone ? "var(--kv-success)" : isActive ? "var(--kv-primary)" : "var(--kv-bg-tertiary)",
                    color: isDone || isActive ? "#fff" : "var(--kv-text-tertiary)",
                  }}
                >
                  {isDone ? <CheckCircle className="h-4 w-4" /> : i + 1}
                </div>
                <span
                  className="text-xs font-medium hidden sm:block"
                  style={{ color: isActive ? "var(--kv-text)" : "var(--kv-text-tertiary)" }}
                >
                  {stepLabels[i]}
                </span>
                {i < 4 && (
                  <div className="flex-1 h-0.5 rounded" style={{ background: isDone ? "var(--kv-success)" : "var(--kv-border)" }} />
                )}
              </div>
            );
          }
        )}
      </div>

      {state.step === "select_crypto" && (
        <div className="space-y-3">
          <h3 className="text-lg font-semibold" style={{ color: "var(--kv-text)" }}>
            Select Payment Currency
          </h3>
          <div className="grid gap-3 sm:grid-cols-2">
            {supportedCryptos
              .filter((c) => web3Ready ? ["ETH", "USDT", "USDC"].includes(c.symbol) : true)
              .map((crypto) => {
                const cryptoAmt = convertFromUSD(amount, crypto.symbol);
                return (
                  <button
                    key={crypto.symbol}
                    onClick={() => selectCrypto(crypto.symbol)}
                    className="flex items-center gap-4 rounded-xl border p-4 text-left transition-all hover:shadow-md"
                    style={{ background: "var(--kv-surface)", borderColor: "var(--kv-border)" }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "var(--kv-primary)"; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "var(--kv-border)"; }}
                  >
                    <div
                      className="flex h-12 w-12 items-center justify-center rounded-xl text-xl"
                      style={{ background: "var(--kv-bg-tertiary)" }}
                    >
                      {crypto.icon}
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold" style={{ color: "var(--kv-text)" }}>{crypto.currency}</p>
                      <p className="text-xs" style={{ color: "var(--kv-text-tertiary)" }}>{crypto.network}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold" style={{ color: "var(--kv-primary)" }}>
                        {formatCryptoAmount(cryptoAmt, crypto.symbol)} {crypto.symbol}
                      </p>
                      <p className="text-xs" style={{ color: "var(--kv-text-tertiary)" }}>
                        1 {crypto.symbol} = ${exchangeRates[crypto.symbol]?.toLocaleString()}
                      </p>
                    </div>
                  </button>
                );
              })}
          </div>
        </div>
      )}

      {state.step === "connect_wallet" && selectedWallet && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold" style={{ color: "var(--kv-text)" }}>
            Connect Your Wallet
          </h3>

          <div
            className="rounded-xl border p-5 space-y-4"
            style={{ background: "var(--kv-surface)", borderColor: "var(--kv-border)" }}
          >
            <div className="flex items-center gap-3 justify-center">
              <div
                className="flex h-16 w-16 items-center justify-center rounded-2xl text-3xl"
                style={{ background: "var(--kv-bg-tertiary)" }}
              >
                {selectedWallet.icon}
              </div>
              <div className="text-left">
                <p className="font-semibold" style={{ color: "var(--kv-text)" }}>
                  {selectedWallet.currency} ({selectedWallet.symbol})
                </p>
                <p className="text-sm" style={{ color: "var(--kv-text-secondary)" }}>
                  {selectedWallet.network}
                </p>
              </div>
            </div>

            {web3Ready && !isConnected ? (
              <div className="space-y-2">
                {connectors.map((connector, idx) => (
                  <button
                    key={connector.uid}
                    onClick={() => handleConnectWallet(idx)}
                    disabled={isConnecting}
                    className="w-full flex items-center justify-between rounded-xl border px-4 py-3 text-sm font-medium transition-all hover:shadow-sm disabled:opacity-50"
                    style={{ borderColor: "var(--kv-border)", color: "var(--kv-text)" }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "var(--kv-surface-hover)"; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
                  >
                    <div className="flex items-center gap-3">
                      <Wallet className="h-5 w-5" style={{ color: "var(--kv-primary)" }} />
                      <span>{connectorLabels[connector.id] || connector.name}</span>
                    </div>
                    {isConnecting && <Loader2 className="h-4 w-4 animate-spin" style={{ color: "var(--kv-primary)" }} />}
                  </button>
                ))}
              </div>
            ) : web3Ready && isConnected ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2 rounded-xl p-3" style={{ background: "var(--kv-bg-tertiary)" }}>
                  <CheckCircle className="h-4 w-4" style={{ color: "var(--kv-success)" }} />
                  <span className="text-sm" style={{ color: "var(--kv-text)" }}>
                    Connected: {shortenAddress(address || "")}
                  </span>
                  <button onClick={() => disconnect()} className="ml-auto text-xs" style={{ color: "var(--kv-text-tertiary)" }}>
                    Disconnect
                  </button>
                </div>
                {ethBalance && state.selectedCrypto === "ETH" && (
                  <p className="text-xs text-center" style={{ color: "var(--kv-text-secondary)" }}>
                    Balance: {parseFloat(formatEther(ethBalance.value)).toFixed(4)} ETH
                  </p>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                <button
                  onClick={handleSimulatedConnect}
                  className="w-full flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold text-white transition-all hover:opacity-90"
                  style={{ background: "var(--kv-primary)" }}
                >
                  <Wallet className="h-4 w-4" />
                  Connect Wallet (Demo)
                </button>
                <p className="text-xs text-center" style={{ color: "var(--kv-text-tertiary)" }}>
                  Simulated connection — configure WalletConnect for live wallets
                </p>
              </div>
            )}
          </div>

          <button
            onClick={() => {
              if (isConnected) disconnect();
              setState((prev) => ({ ...prev, step: "select_crypto", selectedCrypto: null }));
            }}
            className="text-sm font-medium"
            style={{ color: "var(--kv-text-secondary)" }}
          >
            &larr; Choose a different currency
          </button>
        </div>
      )}

      {state.step === "confirm" && selectedWallet && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold" style={{ color: "var(--kv-text)" }}>
            Confirm Payment
          </h3>

          <div
            className="rounded-xl border p-5 space-y-4"
            style={{ background: "var(--kv-surface)", borderColor: "var(--kv-border)" }}
          >
            <div className="flex items-center gap-3">
              <CheckCircle className="h-5 w-5" style={{ color: "var(--kv-success)" }} />
              <div>
                <p className="text-sm font-medium" style={{ color: "var(--kv-text)" }}>
                  Wallet Connected
                  {web3Ready && activeConnector && (
                    <span className="ml-2 text-xs font-normal" style={{ color: "var(--kv-text-tertiary)" }}>
                      via {connectorLabels[activeConnector.id] || activeConnector.name}
                    </span>
                  )}
                </p>
                <p className="text-xs font-mono" style={{ color: "var(--kv-text-tertiary)" }}>
                  {shortenAddress(walletDisplayAddr)}
                </p>
              </div>
            </div>

            <div className="space-y-3 pt-3 border-t" style={{ borderColor: "var(--kv-border-light)" }}>
              <div className="flex justify-between text-sm">
                <span style={{ color: "var(--kv-text-secondary)" }}>Amount (USD)</span>
                <span className="font-medium" style={{ color: "var(--kv-text)" }}>
                  ${amount.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span style={{ color: "var(--kv-text-secondary)" }}>Currency</span>
                <span className="font-medium" style={{ color: "var(--kv-text)" }}>
                  {selectedWallet.currency} ({selectedWallet.symbol})
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span style={{ color: "var(--kv-text-secondary)" }}>Network</span>
                <span className="font-medium" style={{ color: "var(--kv-text)" }}>
                  {selectedWallet.network}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span style={{ color: "var(--kv-text-secondary)" }}>Exchange Rate</span>
                <span className="font-medium" style={{ color: "var(--kv-text)" }}>
                  1 {selectedWallet.symbol} = ${exchangeRates[selectedWallet.symbol]?.toLocaleString()}
                </span>
              </div>
              <div
                className="flex justify-between text-sm font-semibold pt-3 border-t"
                style={{ borderColor: "var(--kv-border-light)" }}
              >
                <span style={{ color: "var(--kv-text)" }}>You Pay</span>
                <span style={{ color: "var(--kv-primary)" }}>
                  {formatCryptoAmount(cryptoAmount, selectedWallet.symbol)} {selectedWallet.symbol}
                </span>
              </div>
            </div>

            {txError && (
              <div className="flex items-start gap-2 rounded-xl p-3" style={{ background: "var(--kv-error)10" }}>
                <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" style={{ color: "var(--kv-error)" }} />
                <p className="text-xs" style={{ color: "var(--kv-error)" }}>{txError}</p>
              </div>
            )}

            <div className="flex items-start gap-2 rounded-xl p-3" style={{ background: "var(--kv-bg-tertiary)" }}>
              <Shield className="h-4 w-4 mt-0.5 shrink-0" style={{ color: "var(--kv-success)" }} />
              <p className="text-xs" style={{ color: "var(--kv-text-secondary)" }}>
                {web3Ready
                  ? "Your wallet will prompt you to sign the transaction. Funds transfer directly on-chain."
                  : `Simulated transaction on the ${selectedWallet.network} network.`}
              </p>
            </div>

            <button
              onClick={confirmPayment}
              disabled={isSendingEth || isSendingToken}
              className="w-full flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold text-white transition-all hover:opacity-90 disabled:opacity-60"
              style={{ background: "var(--kv-primary)" }}
            >
              {isSendingEth || isSendingToken ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Awaiting wallet approval...
                </>
              ) : (
                <>
                  Confirm &amp; Pay {formatCryptoAmount(cryptoAmount, selectedWallet.symbol)} {selectedWallet.symbol}
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </div>

          <button
            onClick={() => setState((prev) => ({ ...prev, step: "connect_wallet", walletConnected: false }))}
            className="text-sm font-medium"
            style={{ color: "var(--kv-text-secondary)" }}
          >
            &larr; Back
          </button>
        </div>
      )}

      {state.step === "processing" && !txComplete && state.transaction && (
        <div
          className="rounded-xl border p-8 text-center space-y-4"
          style={{ background: "var(--kv-surface)", borderColor: "var(--kv-border)" }}
        >
          <Loader2 className="h-12 w-12 animate-spin mx-auto" style={{ color: "var(--kv-primary)" }} />
          <h3 className="text-lg font-semibold" style={{ color: "var(--kv-text)" }}>
            Processing Payment
          </h3>
          <p className="text-sm" style={{ color: "var(--kv-text-secondary)" }}>
            {web3Ready ? "Waiting for on-chain confirmation..." : "Waiting for blockchain confirmation..."}
          </p>
          <div className="rounded-xl p-4 mx-auto max-w-sm" style={{ background: "var(--kv-bg-tertiary)" }}>
            <div className="flex items-center justify-between text-sm mb-2">
              <span style={{ color: "var(--kv-text-secondary)" }}>Status</span>
              <span className="flex items-center gap-1 font-medium" style={{ color: "var(--kv-warning)" }}>
                <Clock className="h-3.5 w-3.5" /> {isConfirming ? "Confirming on-chain" : "Submitted"}
              </span>
            </div>
            {!web3Ready && countdown > 0 && (
              <div className="flex items-center justify-between text-sm">
                <span style={{ color: "var(--kv-text-secondary)" }}>Estimated</span>
                <span className="font-mono font-medium" style={{ color: "var(--kv-text)" }}>~{countdown}s</span>
              </div>
            )}
          </div>
          <div className="flex items-center justify-center gap-2">
            <span className="text-xs font-mono" style={{ color: "var(--kv-text-tertiary)" }}>
              TX: {shortenAddress(state.transaction.txHash || "")}
            </span>
            <button
              onClick={() => copyToClipboard(state.transaction?.txHash || "")}
              className="p-1 rounded transition-colors"
              style={{ color: "var(--kv-text-tertiary)" }}
            >
              <Copy className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}

      {txComplete && state.transaction && (
        <div
          className="rounded-xl border p-8 text-center space-y-4"
          style={{ background: "var(--kv-surface)", borderColor: "var(--kv-border)" }}
        >
          <div
            className="flex h-16 w-16 mx-auto items-center justify-center rounded-full"
            style={{ background: "var(--kv-success)15" }}
          >
            <CheckCircle className="h-8 w-8" style={{ color: "var(--kv-success)" }} />
          </div>
          <h3 className="text-xl font-bold" style={{ color: "var(--kv-text)" }}>
            Payment Confirmed!
          </h3>
          <p className="text-sm" style={{ color: "var(--kv-text-secondary)" }}>
            Your booking has been confirmed{web3Ready ? " and verified on-chain" : ""}.
          </p>

          <div className="rounded-xl p-4 mx-auto max-w-sm space-y-3 text-left" style={{ background: "var(--kv-bg-tertiary)" }}>
            <div className="flex justify-between text-sm">
              <span style={{ color: "var(--kv-text-secondary)" }}>Transaction ID</span>
              <span className="font-mono text-xs" style={{ color: "var(--kv-text)" }}>{state.transaction.id}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span style={{ color: "var(--kv-text-secondary)" }}>Amount Paid</span>
              <span className="font-medium" style={{ color: "var(--kv-text)" }}>
                {formatCryptoAmount(state.transaction.cryptoAmount, state.transaction.cryptoCurrency)}{" "}
                {state.transaction.cryptoCurrency}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span style={{ color: "var(--kv-text-secondary)" }}>TX Hash</span>
              <div className="flex items-center gap-1">
                <span className="font-mono text-xs" style={{ color: "var(--kv-text)" }}>
                  {shortenAddress(state.transaction.txHash || "")}
                </span>
                <button
                  onClick={() => copyToClipboard(state.transaction?.txHash || "")}
                  className="p-0.5"
                  style={{ color: "var(--kv-text-tertiary)" }}
                >
                  {copied ? (
                    <CheckCircle className="h-3.5 w-3.5" style={{ color: "var(--kv-success)" }} />
                  ) : (
                    <Copy className="h-3.5 w-3.5" />
                  )}
                </button>
              </div>
            </div>
            <div className="flex justify-between text-sm">
              <span style={{ color: "var(--kv-text-secondary)" }}>Status</span>
              <span className="flex items-center gap-1 font-medium" style={{ color: "var(--kv-success)" }}>
                <CheckCircle className="h-3.5 w-3.5" /> Confirmed
              </span>
            </div>
          </div>

          <div className="flex gap-3 justify-center pt-2">
            <Link
              href="/dashboard"
              className="rounded-xl px-5 py-2.5 text-sm font-medium transition-all"
              style={{ background: "var(--kv-primary)", color: "#fff" }}
            >
              Go to Dashboard
            </Link>
            <Link
              href={type === "flight" ? "/flights" : "/apartments"}
              className="rounded-xl border px-5 py-2.5 text-sm font-medium transition-all"
              style={{ borderColor: "var(--kv-border)", color: "var(--kv-text)" }}
            >
              Browse More
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <AppShell title="Checkout">
      <Suspense
        fallback={
          <div className="flex items-center justify-center min-h-[60vh]">
            <Loader2 className="h-8 w-8 animate-spin" style={{ color: "var(--kv-primary)" }} />
          </div>
        }
      >
        <CheckoutContent />
      </Suspense>
    </AppShell>
  );
}
