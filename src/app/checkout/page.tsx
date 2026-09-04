"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Wallet,
  ArrowRight,
  CheckCircle,
  Copy,
  ExternalLink,
  Shield,
  Clock,
  Loader2,
  AlertCircle,
  ChevronRight,
  X,
} from "lucide-react";
import AppShell from "@/components/layout/AppShell";
import { cn } from "@/lib/utils";
import {
  supportedCryptos,
  convertFromUSD,
  formatCryptoAmount,
  generateTxHash,
  shortenAddress,
  exchangeRates,
} from "@/data/crypto";
import type { CryptoWallet, CheckoutState } from "@/types";

function CheckoutContent() {
  const searchParams = useSearchParams();
  const type = searchParams.get("type") || "flight";
  const itemId = searchParams.get("id") || "";
  const amount = Number(searchParams.get("amount") || 0);
  const title = searchParams.get("title") || "Booking";

  const [state, setState] = useState<CheckoutState>({
    step: "select_crypto",
    selectedCrypto: null,
    walletConnected: false,
    transaction: null,
  });

  const [walletAddress, setWalletAddress] = useState("");
  const [copied, setCopied] = useState(false);
  const [countdown, setCountdown] = useState(0);

  const selectedWallet = supportedCryptos.find((c) => c.symbol === state.selectedCrypto);
  const cryptoAmount = state.selectedCrypto
    ? convertFromUSD(amount, state.selectedCrypto)
    : 0;

  useEffect(() => {
    if (state.step === "processing" && countdown > 0) {
      const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
      return () => clearTimeout(timer);
    }
    if (state.step === "processing" && countdown === 0) {
      setState((prev) => ({
        ...prev,
        step: "complete",
        transaction: prev.transaction
          ? { ...prev.transaction, status: "confirmed", confirmedAt: new Date() }
          : null,
      }));
    }
  }, [state.step, countdown]);

  function selectCrypto(symbol: string) {
    setState((prev) => ({ ...prev, selectedCrypto: symbol, step: "connect_wallet" }));
  }

  function connectWallet() {
    const chars = "0123456789abcdef";
    let addr = "0x";
    for (let i = 0; i < 40; i++) {
      addr += chars[Math.floor(Math.random() * chars.length)];
    }
    setWalletAddress(addr);
    setState((prev) => ({ ...prev, walletConnected: true, step: "confirm" }));
  }

  function confirmPayment() {
    const txHash = generateTxHash();
    setState((prev) => ({
      ...prev,
      step: "processing",
      transaction: {
        id: `TX-${Date.now().toString(36).toUpperCase()}`,
        type: type as "flight" | "apartment",
        itemId,
        itemTitle: title,
        amount,
        currency: "USD",
        cryptoCurrency: prev.selectedCrypto!,
        cryptoAmount,
        walletAddress,
        status: "confirming",
        txHash,
        createdAt: new Date(),
      },
    }));
    setCountdown(8);
  }

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

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
      </div>

      <div className="flex items-center gap-2 mb-2">
        {(["select_crypto", "connect_wallet", "confirm", "processing", "complete"] as const).map(
          (s, i) => {
            const stepLabels = ["Select Crypto", "Connect Wallet", "Confirm", "Processing", "Complete"];
            const stepIndex = ["select_crypto", "connect_wallet", "confirm", "processing", "complete"].indexOf(state.step);
            const isActive = i === stepIndex;
            const isDone = i < stepIndex;
            return (
              <div key={s} className="flex items-center gap-2 flex-1">
                <div
                  className={cn(
                    "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-all",
                  )}
                  style={{
                    background: isDone
                      ? "var(--kv-success)"
                      : isActive
                      ? "var(--kv-primary)"
                      : "var(--kv-bg-tertiary)",
                    color: isDone || isActive ? "#fff" : "var(--kv-text-tertiary)",
                  }}
                >
                  {isDone ? <CheckCircle className="h-4 w-4" /> : i + 1}
                </div>
                <span
                  className="text-xs font-medium hidden sm:block"
                  style={{
                    color: isActive ? "var(--kv-text)" : "var(--kv-text-tertiary)",
                  }}
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
            {supportedCryptos.map((crypto) => {
              const cryptoAmt = convertFromUSD(amount, crypto.symbol);
              return (
                <button
                  key={crypto.symbol}
                  onClick={() => selectCrypto(crypto.symbol)}
                  className="flex items-center gap-4 rounded-xl border p-4 text-left transition-all hover:shadow-md"
                  style={{
                    background: "var(--kv-surface)",
                    borderColor: "var(--kv-border)",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.borderColor = "var(--kv-primary)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.borderColor = "var(--kv-border)";
                  }}
                >
                  <div
                    className="flex h-12 w-12 items-center justify-center rounded-xl text-xl"
                    style={{ background: "var(--kv-bg-tertiary)" }}
                  >
                    {crypto.icon}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold" style={{ color: "var(--kv-text)" }}>
                      {crypto.currency}
                    </p>
                    <p className="text-xs" style={{ color: "var(--kv-text-tertiary)" }}>
                      {crypto.network}
                    </p>
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
            Connect Your {selectedWallet.currency} Wallet
          </h3>

          <div
            className="rounded-xl border p-5 text-center space-y-4"
            style={{ background: "var(--kv-surface)", borderColor: "var(--kv-border)" }}
          >
            <div
              className="flex h-16 w-16 mx-auto items-center justify-center rounded-2xl text-3xl"
              style={{ background: "var(--kv-bg-tertiary)" }}
            >
              {selectedWallet.icon}
            </div>
            <div>
              <p className="font-semibold" style={{ color: "var(--kv-text)" }}>
                {selectedWallet.currency} ({selectedWallet.symbol})
              </p>
              <p className="text-sm" style={{ color: "var(--kv-text-secondary)" }}>
                Network: {selectedWallet.network}
              </p>
            </div>

            <div className="space-y-2">
              <button
                onClick={connectWallet}
                className="w-full flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold text-white transition-all hover:opacity-90"
                style={{ background: "var(--kv-primary)" }}
              >
                <Wallet className="h-4 w-4" />
                Connect Wallet
              </button>
              <p className="text-xs" style={{ color: "var(--kv-text-tertiary)" }}>
                Simulated wallet connection for demo purposes
              </p>
            </div>
          </div>

          <button
            onClick={() => setState((prev) => ({ ...prev, step: "select_crypto", selectedCrypto: null }))}
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
                </p>
                <p className="text-xs font-mono" style={{ color: "var(--kv-text-tertiary)" }}>
                  {shortenAddress(walletAddress)}
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

            <div className="flex items-start gap-2 rounded-xl p-3" style={{ background: "var(--kv-bg-tertiary)" }}>
              <Shield className="h-4 w-4 mt-0.5 shrink-0" style={{ color: "var(--kv-success)" }} />
              <p className="text-xs" style={{ color: "var(--kv-text-secondary)" }}>
                Your transaction is secured on the {selectedWallet.network} blockchain.
                Funds will be held in escrow until booking confirmation.
              </p>
            </div>

            <button
              onClick={confirmPayment}
              className="w-full flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold text-white transition-all hover:opacity-90"
              style={{ background: "var(--kv-primary)" }}
            >
              Confirm &amp; Pay {formatCryptoAmount(cryptoAmount, selectedWallet.symbol)} {selectedWallet.symbol}
              <ArrowRight className="h-4 w-4" />
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

      {state.step === "processing" && state.transaction && (
        <div
          className="rounded-xl border p-8 text-center space-y-4"
          style={{ background: "var(--kv-surface)", borderColor: "var(--kv-border)" }}
        >
          <div className="flex items-center justify-center">
            <Loader2 className="h-12 w-12 animate-spin" style={{ color: "var(--kv-primary)" }} />
          </div>
          <h3 className="text-lg font-semibold" style={{ color: "var(--kv-text)" }}>
            Processing Payment
          </h3>
          <p className="text-sm" style={{ color: "var(--kv-text-secondary)" }}>
            Waiting for blockchain confirmation...
          </p>
          <div
            className="rounded-xl p-4 mx-auto max-w-sm"
            style={{ background: "var(--kv-bg-tertiary)" }}
          >
            <div className="flex items-center justify-between text-sm mb-2">
              <span style={{ color: "var(--kv-text-secondary)" }}>Status</span>
              <span className="flex items-center gap-1 font-medium" style={{ color: "var(--kv-warning)" }}>
                <Clock className="h-3.5 w-3.5" /> Confirming
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span style={{ color: "var(--kv-text-secondary)" }}>Estimated time</span>
              <span className="font-mono font-medium" style={{ color: "var(--kv-text)" }}>
                ~{countdown}s
              </span>
            </div>
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

      {state.step === "complete" && state.transaction && (
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
            Your booking has been confirmed and secured on the blockchain.
          </p>

          <div
            className="rounded-xl p-4 mx-auto max-w-sm space-y-3 text-left"
            style={{ background: "var(--kv-bg-tertiary)" }}
          >
            <div className="flex justify-between text-sm">
              <span style={{ color: "var(--kv-text-secondary)" }}>Transaction ID</span>
              <span className="font-mono text-xs" style={{ color: "var(--kv-text)" }}>
                {state.transaction.id}
              </span>
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
