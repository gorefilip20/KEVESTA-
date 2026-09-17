"use client";

import { FormEvent, ReactNode, Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, CircleAlert, CreditCard, Loader2, LockKeyhole, ShieldCheck, WalletCards } from "lucide-react";
import { isAddress, parseEther, parseUnits } from "viem";
import { useAccount, useChainId, useConnect, useSendTransaction, useSwitchChain, useWaitForTransactionReceipt, useWriteContract } from "wagmi";
import { mainnet } from "wagmi/chains";
import AppShell from "@/components/layout/AppShell";
import { formatCryptoAmount } from "@/data/crypto";
import { ERC20_ABI, getTokenAddress } from "@/lib/web3/config";

type Method = "bank" | "crypto";
type CryptoCurrency = "ETH" | "USDC" | "USDT";
type PaymentResult = { mode: "column" | "setup_required"; status: string; paymentId: string; message?: string };
type CryptoQuote = { quoteId: string; currency: CryptoCurrency; cryptoAmount: number; rate: number; expiresAt: string };
type BookingIntent = { id: string; title: string; amount: number; currency: string; expiresAt: string };

function CheckoutContent() {
  const searchParams = useSearchParams();
  const type = searchParams.get("type") || "flight";
  const itemId = searchParams.get("id") || "";
  const title = searchParams.get("title") || (type === "apartment" ? "Accommodation booking" : "Flight booking");
  const [intent, setIntent] = useState<BookingIntent | null>(null);
  const [authRequired, setAuthRequired] = useState(false);
  const [intentLoading, setIntentLoading] = useState(true);
  const checkoutAmount = intent?.amount || 0;
  const checkoutTitle = intent?.title || title;
  const formattedAmount = useMemo(() => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(checkoutAmount), [checkoutAmount]);

  const [method, setMethod] = useState<Method>("bank");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [cryptoCurrency, setCryptoCurrency] = useState<CryptoCurrency>("USDC");
  const [bankSubmitting, setBankSubmitting] = useState(false);
  const [bankResult, setBankResult] = useState<PaymentResult | null>(null);
  const [cryptoHash, setCryptoHash] = useState<`0x${string}`>();
  const [cryptoStatus, setCryptoStatus] = useState<"idle" | "processing" | "confirmed">("idle");
  const [cryptoServerConfirmed, setCryptoServerConfirmed] = useState(false);
  const [quote, setQuote] = useState<CryptoQuote | null>(null);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [error, setError] = useState("");

  const { address, isConnected } = useAccount();
  const { connect, connectors, isPending: connecting } = useConnect();
  const { switchChain, isPending: switching } = useSwitchChain();
  const chainId = useChainId();
  const { sendTransaction, isPending: sendingEth } = useSendTransaction();
  const { writeContract, isPending: sendingToken } = useWriteContract();
  const { isLoading: confirming } = useWaitForTransactionReceipt({ hash: cryptoHash });

  const merchantWallet = process.env.NEXT_PUBLIC_MERCHANT_WALLET || "";
  const cryptoConfigured = isAddress(merchantWallet);
  const cryptoAmount = quote?.cryptoAmount || 0;
  const cryptoBusy = connecting || switching || sendingEth || sendingToken || confirming;
  const cryptoButtonLabel = isConnected
    ? quote ? `Pay ${formatCryptoAmount(cryptoAmount, cryptoCurrency)} ${cryptoCurrency}` : "Loading live quote…"
    : "Connect wallet to pay";

  const cryptoConfirmed = Boolean(cryptoHash && !confirming && cryptoStatus === "processing");

  useEffect(() => {
    fetch("/api/bookings/intents", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ itemType: type, itemId }) })
      .then(async (response) => {
        const payload = await response.json();
        if (response.status === 401) { setAuthRequired(true); return; }
        if (!response.ok) throw new Error(payload.error || "Booking intent is unavailable.");
        setIntent(payload.intent);
      })
      .catch((intentError) => setError(intentError instanceof Error ? intentError.message : "Booking intent is unavailable."))
      .finally(() => setIntentLoading(false));
  }, [itemId, type]);

  useEffect(() => {
    if (!cryptoConfirmed || !cryptoHash || !quote) return;
    fetch("/api/payments/crypto/confirm", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ quoteId: quote.quoteId, txHash: cryptoHash }) })
      .then((response) => { if (response.ok) setCryptoServerConfirmed(true); })
      .catch(() => undefined);
  }, [cryptoConfirmed, cryptoHash, quote]);

  useEffect(() => {
    if (method !== "crypto") return;
    let cancelled = false;
    fetch(`/api/payments/crypto/quote?amount=${checkoutAmount}&currency=${cryptoCurrency}`, { cache: "no-store" })
      .then(async (response) => {
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.error || "Live crypto pricing is unavailable.");
        if (!cancelled) setQuote(payload.quote);
      })
      .catch((quoteError) => {
        if (!cancelled) {
          setQuote(null);
          setError(quoteError instanceof Error ? quoteError.message : "Live crypto pricing is unavailable.");
        }
      })
      .finally(() => { if (!cancelled) setQuoteLoading(false); });
    return () => { cancelled = true; };
  }, [checkoutAmount, cryptoCurrency, method]);

  async function handleBankSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBankSubmitting(true);
    setError("");
    try {
      const response = await fetch("/api/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Idempotency-Key": crypto.randomUUID() },
        body: JSON.stringify({ intentId: intent?.id, customerName: name, customerEmail: email }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Payment could not be started.");
      setBankResult(payload.payment);
    } catch (bankError) {
      setError(bankError instanceof Error ? bankError.message : "Payment could not be started.");
    } finally {
      setBankSubmitting(false);
    }
  }

  function connectWallet() {
    setError("");
    const connector = connectors[0];
    if (!connector) {
      setError("No browser wallet was detected. Install MetaMask or Coinbase Wallet.");
      return;
    }
    connect({ connector }, { onError: (connectError) => setError(connectError.message.split("\n")[0]) });
  }

  function payWithCrypto() {
    setError("");
    if (!cryptoConfigured) {
      setError("Crypto checkout needs a valid NEXT_PUBLIC_MERCHANT_WALLET.");
      return;
    }
    if (!quote || Date.parse(quote.expiresAt) <= Date.now()) {
      setError("This crypto quote expired. Choose the currency again to refresh it.");
      return;
    }
    if (!isConnected || !address) {
      connectWallet();
      return;
    }
    if (chainId !== mainnet.id) {
      switchChain({ chainId: mainnet.id });
      return;
    }

    setCryptoStatus("processing");
    const tokenAddress = getTokenAddress(cryptoCurrency);
    if (cryptoCurrency === "ETH") {
      sendTransaction(
        { to: merchantWallet as `0x${string}`, value: parseEther(String(cryptoAmount)) },
        {
          onSuccess: (hash) => setCryptoHash(hash),
          onError: (txError) => { setCryptoStatus("idle"); setError(txError.message.split("\n")[0]); },
        },
      );
      return;
    }
    if (!tokenAddress) {
      setCryptoStatus("idle");
      setError("This token is not configured for Ethereum mainnet.");
      return;
    }
    writeContract(
      { address: tokenAddress, abi: ERC20_ABI, functionName: "transfer", args: [merchantWallet as `0x${string}`, parseUnits(cryptoAmount.toFixed(6), 6)] },
      {
        onSuccess: (hash) => setCryptoHash(hash),
        onError: (txError) => { setCryptoStatus("idle"); setError(txError.message.split("\n")[0]); },
      },
    );
  }

  if (authRequired) return <AuthRequiredCard />;
  if (!intentLoading && error && !intent) return <div className="mx-auto max-w-xl px-5 py-16 text-center"><div className="rounded-3xl border bg-white p-8 shadow-sm" style={{ borderColor: "#F0C8C6" }}><h1 className="heritage-heading text-3xl font-semibold" style={{ color: "var(--kv-text)" }}>Secure checkout is unavailable</h1><p className="mt-3 text-sm leading-6 text-red-700">{error}</p></div></div>;
  if (intentLoading || !intent) return <div className="mx-auto flex min-h-[60vh] max-w-3xl items-center justify-center gap-3 px-5" style={{ color: "var(--kv-text-secondary)" }}><Loader2 className="h-5 w-5 animate-spin" /> Preparing your secure booking…</div>;
  if (bankResult) {
    return <ResultCard type={type} setup={bankResult.mode === "setup_required"} amount={formattedAmount} reference={bankResult.paymentId} message={bankResult.message || "Your bank payment has been created. Your booking is only confirmed after the provider sends a confirmed event."} />;
  }
  if (cryptoServerConfirmed && cryptoHash) {
    return <ResultCard type={type} setup={false} amount={formattedAmount} reference={cryptoHash} crypto message="Your wallet transaction is confirmed on Ethereum. Booking confirmation should be finalized from the transaction receipt and your internal booking record." />;
  }

  return (
    <div className="mx-auto max-w-6xl px-5 py-8 lg:px-10 lg:py-12">
      <Link href={type === "apartment" ? "/apartments" : "/flights"} className="mb-8 inline-flex items-center gap-2 text-sm font-semibold" style={{ color: "var(--kv-primary)" }}><ArrowLeft className="h-4 w-4" /> Back to browsing</Link>
      <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
        <section>
          <p className="heritage-caption" style={{ color: "var(--kv-primary)" }}>Secure checkout</p>
          <h1 className="heritage-heading mt-2 text-4xl font-semibold sm:text-5xl" style={{ color: "var(--kv-text)" }}>Move with confidence.</h1>
          <p className="mt-4 max-w-xl leading-7" style={{ color: "var(--kv-text-secondary)" }}>Choose bank payment or crypto. Both methods keep your booking pending until settlement is verifiable.</p>
          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            <MethodButton active={method === "bank"} onClick={() => { setMethod("bank"); setError(""); }} icon={<CreditCard className="h-5 w-5" />} title="Pay by bank" description="Column ACH / bank transfer" />
            <MethodButton active={method === "crypto"} onClick={() => { setMethod("crypto"); setError(""); }} icon={<WalletCards className="h-5 w-5" />} title="Pay with crypto" description="ETH, USDC or USDT on Ethereum" />
          </div>

          {method === "bank" ? (
            <form onSubmit={handleBankSubmit} className="mt-5 rounded-3xl border bg-white p-6 shadow-sm sm:p-8" style={{ borderColor: "var(--kv-border-light)" }}>
              <div className="grid gap-5 sm:grid-cols-2">
                <label className="text-sm font-semibold" style={{ color: "var(--kv-text)" }}>Full name<input required value={name} onChange={(event) => setName(event.target.value)} className="mt-2 w-full rounded-xl border px-4 py-3 font-normal outline-none" style={{ borderColor: "var(--kv-border)", color: "var(--kv-text)" }} placeholder="Alex Morgan" /></label>
                <label className="text-sm font-semibold" style={{ color: "var(--kv-text)" }}>Email address<input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} className="mt-2 w-full rounded-xl border px-4 py-3 font-normal outline-none" style={{ borderColor: "var(--kv-border)", color: "var(--kv-text)" }} placeholder="alex@example.com" /></label>
              </div>
              <ActionButton busy={bankSubmitting} label="Continue to bank payment" />
            </form>
          ) : (
            <div className="mt-5 rounded-3xl border bg-white p-6 shadow-sm sm:p-8" style={{ borderColor: "var(--kv-border-light)" }}>
              <p className="text-sm" style={{ color: "var(--kv-text-secondary)" }}>Select a currency. Your wallet will ask you to approve the exact amount before the transaction is broadcast.</p>
              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                {(["USDC", "USDT", "ETH"] as const).map((currency) => (
                  <button key={currency} onClick={() => setCryptoCurrency(currency)} className="rounded-2xl border p-4 text-left" style={{ borderColor: cryptoCurrency === currency ? "var(--kv-primary)" : "var(--kv-border)", background: cryptoCurrency === currency ? "#F4F7FF" : "white" }}>
                    <div className="font-semibold" style={{ color: "var(--kv-text)" }}>{currency}</div>
                    <div className="mt-1 text-xs" style={{ color: "var(--kv-text-secondary)" }}>{currency === cryptoCurrency && quote ? `${formatCryptoAmount(quote.cryptoAmount, currency)} ${currency}` : "Live quote"}</div>
                    <div className="mt-1 text-xs" style={{ color: "var(--kv-text-tertiary)" }}>{currency === cryptoCurrency && quote ? `$${quote.rate.toLocaleString()} per ${currency}` : "Refresh on selection"}</div>
                  </button>
                ))}
              </div>
              {isConnected && <p className="mt-4 text-xs" style={{ color: "var(--kv-text-secondary)" }}>Wallet connected: {address?.slice(0, 6)}…{address?.slice(-4)}</p>}
              <div className="mt-4 flex items-center justify-between text-xs" style={{ color: "var(--kv-text-tertiary)" }}><span>{quoteLoading ? "Fetching live rate…" : quote ? `Quote locked until ${new Date(quote.expiresAt).toLocaleTimeString([], { minute: "2-digit", second: "2-digit" })}` : "Quote unavailable"}</span><span>Source: live spot price</span></div>
              <button onClick={payWithCrypto} disabled={cryptoBusy || quoteLoading || !quote} className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl px-5 py-3.5 text-sm font-semibold text-white disabled:opacity-60" style={{ background: "var(--kv-primary)" }}>{cryptoBusy ? <><Loader2 className="h-4 w-4 animate-spin" /> {confirming ? "Waiting for confirmation…" : "Confirm in wallet…"}</> : cryptoButtonLabel}</button>
              <p className="mt-4 flex items-center justify-center gap-2 text-xs" style={{ color: "var(--kv-text-tertiary)" }}><LockKeyhole className="h-3.5 w-3.5" /> Kevesta never asks for your seed phrase.</p>
            </div>
          )}
          {error && <div className="mt-4 flex gap-2 rounded-xl bg-red-50 p-3 text-sm text-red-700"><CircleAlert className="mt-0.5 h-4 w-4 shrink-0" />{error}</div>}
        </section>
        <aside className="h-fit rounded-3xl border bg-white p-6 shadow-sm" style={{ borderColor: "var(--kv-border-light)" }}><p className="heritage-caption" style={{ color: "var(--kv-text-tertiary)" }}>Order summary</p><h2 className="mt-3 text-xl font-semibold" style={{ color: "var(--kv-text)" }}>{checkoutTitle}</h2><div className="my-6 border-t pt-5" style={{ borderColor: "var(--kv-border-light)" }}><div className="flex items-center justify-between"><span style={{ color: "var(--kv-text-secondary)" }}>Total</span><span className="text-2xl font-bold" style={{ color: "var(--kv-primary)" }}>{formattedAmount}</span></div></div><div className="space-y-4 text-sm" style={{ color: "var(--kv-text-secondary)" }}><div className="flex gap-3"><ShieldCheck className="h-5 w-5 shrink-0 text-[#1B8A57]" /><span>Bank status is reconciled from signed provider events.</span></div><div className="flex gap-3"><ShieldCheck className="h-5 w-5 shrink-0 text-[#1B8A57]" /><span>Crypto status is based on a confirmed Ethereum receipt.</span></div></div></aside>
      </div>
    </div>
  );
}

function MethodButton({ active, onClick, icon, title, description }: { active: boolean; onClick: () => void; icon: ReactNode; title: string; description: string }) {
  return <button onClick={onClick} className="flex items-center gap-3 rounded-2xl border p-4 text-left" style={{ borderColor: active ? "var(--kv-primary)" : "var(--kv-border-light)", background: active ? "#F4F7FF" : "white" }}><div className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ background: active ? "#E5EDFF" : "var(--kv-bg-secondary)", color: "var(--kv-primary)" }}>{icon}</div><div><div className="font-semibold" style={{ color: "var(--kv-text)" }}>{title}</div><div className="text-xs" style={{ color: "var(--kv-text-secondary)" }}>{description}</div></div></button>;
}

function ActionButton({ busy, label }: { busy: boolean; label: string }) {
  return <button disabled={busy} className="mt-7 flex w-full items-center justify-center gap-2 rounded-xl px-5 py-3.5 text-sm font-semibold text-white disabled:opacity-60" style={{ background: "var(--kv-primary)" }}>{busy ? <><Loader2 className="h-4 w-4 animate-spin" /> Starting secure payment…</> : <>{label} <ArrowLeft className="h-4 w-4 rotate-180" /></>}</button>;
}

function ResultCard({ type, setup, amount, reference, message, crypto = false }: { type: string; setup: boolean; amount: string; reference: string; message: string; crypto?: boolean }) {
  return <div className="mx-auto max-w-3xl px-5 py-12 lg:px-10"><Link href={type === "apartment" ? "/apartments" : "/flights"} className="mb-8 inline-flex items-center gap-2 text-sm font-semibold" style={{ color: "var(--kv-primary)" }}><ArrowLeft className="h-4 w-4" /> Back to browsing</Link><section className="rounded-3xl border bg-white p-8 shadow-sm sm:p-12"><div className="mx-auto max-w-xl text-center"><div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full" style={{ background: setup ? "#FFF4D6" : "#E9F8F0" }}>{setup ? <CircleAlert className="h-8 w-8 text-[#B7791F]" /> : <CheckCircle2 className="h-8 w-8 text-[#1B8A57]" />}</div><p className="heritage-caption mt-6" style={{ color: "var(--kv-primary)" }}>{setup ? "Payment setup" : crypto ? "Crypto payment confirmed" : "Payment initiated"}</p><h1 className="heritage-heading mt-2 text-4xl font-semibold" style={{ color: "var(--kv-text)" }}>{setup ? "One final connection" : crypto ? "Your wallet payment is confirmed" : "Your payment is in motion"}</h1><p className="mt-4 leading-7" style={{ color: "var(--kv-text-secondary)" }}>{message}</p><div className="mt-8 rounded-2xl p-5 text-left" style={{ background: "var(--kv-bg-secondary)" }}><div className="flex justify-between gap-4 text-sm"><span style={{ color: "var(--kv-text-secondary)" }}>Reference</span><span className="max-w-[65%] truncate font-mono font-semibold" style={{ color: "var(--kv-text)" }}>{reference}</span></div><div className="mt-3 flex justify-between gap-4 text-sm"><span style={{ color: "var(--kv-text-secondary)" }}>Amount</span><span className="font-semibold" style={{ color: "var(--kv-text)" }}>{amount}</span></div><div className="mt-3 flex justify-between gap-4 text-sm"><span style={{ color: "var(--kv-text-secondary)" }}>Status</span><span className="font-semibold" style={{ color: setup ? "#B7791F" : "#1B8A57" }}>{setup ? "Action required" : "Confirmed"}</span></div></div><div className="mt-8 flex flex-wrap justify-center gap-3"><Link href="/dashboard" className="rounded-xl px-5 py-3 text-sm font-semibold text-white" style={{ background: "var(--kv-primary)" }}>Go to dashboard</Link><Link href="/support" className="rounded-xl border px-5 py-3 text-sm font-semibold" style={{ borderColor: "var(--kv-border)", color: "var(--kv-text)" }}>Contact support</Link></div></div></section></div>;
}

export default function CheckoutPage() {
  return <AppShell title="Checkout"><Suspense fallback={<div className="flex min-h-[60vh] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" style={{ color: "var(--kv-primary)" }} /></div>}><CheckoutContent /></Suspense></AppShell>;
}

function AuthRequiredCard() {
  return <div className="mx-auto max-w-xl px-5 py-16 text-center"><div className="rounded-3xl border bg-white p-8 shadow-sm" style={{ borderColor: "var(--kv-border-light)" }}><div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl" style={{ background: "#EDF3FF", color: "var(--kv-primary)" }}><LockKeyhole className="h-7 w-7" /></div><h1 className="heritage-heading mt-6 text-3xl font-semibold" style={{ color: "var(--kv-text)" }}>Sign in to secure your booking</h1><p className="mt-3 leading-7" style={{ color: "var(--kv-text-secondary)" }}>We create a private booking intent for your account before showing a final price. This prevents tampered totals and keeps your payment tied to you.</p><Link href="/login?returnTo=/checkout" className="mt-7 inline-flex rounded-xl px-5 py-3 text-sm font-semibold text-white" style={{ background: "var(--kv-primary)" }}>Sign in or create account</Link></div></div>;
}
