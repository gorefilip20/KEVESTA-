"use client";

import { useEffect, useMemo, useState } from "react";
import { parseEther, parseUnits } from "viem";
import { useAccount, useConnect, useSendTransaction, useWaitForTransactionReceipt, useWriteContract } from "wagmi";
import {
  ArrowLeft,
  ArrowRight,
  ArrowRightLeft,
  Check,
  CheckCircle2,
  Copy,
  Luggage,
  Plane,
  Search,
  ShieldCheck,
  Sparkles,
  Ticket,
  WalletCards,
} from "lucide-react";
import AppShell from "@/components/layout/AppShell";
import { cn } from "@/lib/utils";
import { getAirportSuggestions, searchFlights } from "@/data/flights";
import { convertFromUSD, formatCryptoAmount, supportedCryptos } from "@/data/crypto";
import { ERC20_ABI, getTokenAddress, isWeb3Configured } from "@/lib/web3/config";
import type { Airport, FlightResult } from "@/types";

type BookingStep = "search" | "results" | "seat" | "passenger" | "payment" | "confirmed";
type Seat = { id: string; row: number; letter: string; status: "available" | "selected" | "occupied"; price: number };

const stepItems: { id: BookingStep; label: string }[] = [
  { id: "search", label: "Search" },
  { id: "results", label: "Results" },
  { id: "seat", label: "Seat map" },
  { id: "passenger", label: "Passenger" },
  { id: "payment", label: "Payment" },
  { id: "confirmed", label: "Boarding" },
];

function createSeats(): Seat[] {
  return Array.from({ length: 36 }, (_, index) => {
    const row = Math.floor(index / 6) + 1;
    const letter = ["A", "B", "C", "D", "E", "F"][index % 6];
    const occupied = [2, 5, 8, 14, 19, 24, 29, 33].includes(index);
    return { id: `${row}${letter}`, row, letter, status: occupied ? "occupied" : "available", price: row <= 3 ? 35 : 0 };
  });
}

export default function FlightsPage() {
  const [step, setStep] = useState<BookingStep>("search");
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [selectedOrigin, setSelectedOrigin] = useState<Airport | null>(null);
  const [selectedDest, setSelectedDest] = useState<Airport | null>(null);
  const [departDate, setDepartDate] = useState("");
  const [returnDate, setReturnDate] = useState("");
  const [passengers, setPassengers] = useState(1);
  const [cabinClass, setCabinClass] = useState("economy");
  const [tripType, setTripType] = useState<"one_way" | "round_trip">("round_trip");
  const [results, setResults] = useState<FlightResult[]>([]);
  const [sortBy, setSortBy] = useState<"price" | "duration" | "stops">("price");
  const [originSuggestions, setOriginSuggestions] = useState<Airport[]>([]);
  const [destSuggestions, setDestSuggestions] = useState<Airport[]>([]);
  const [showOriginDropdown, setShowOriginDropdown] = useState(false);
  const [showDestDropdown, setShowDestDropdown] = useState(false);
  const [selectedFlight, setSelectedFlight] = useState<FlightResult | null>(null);
  const [selectedSeat, setSelectedSeat] = useState<string | null>(null);
  const [passenger, setPassenger] = useState({ firstName: "", lastName: "", email: "", phone: "" });
  const [crypto, setCrypto] = useState("USDC");
  const [paymentStatus, setPaymentStatus] = useState<"idle" | "processing" | "complete">("idle");
  const [bookingCode, setBookingCode] = useState("");
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [transactionHash, setTransactionHash] = useState<string | null>(null);

  const web3Ready = isWeb3Configured();
  const { address, isConnected } = useAccount();
  const { connect, connectors, isPending: isConnecting } = useConnect();
  const { sendTransaction, isPending: isSendingEth } = useSendTransaction();
  const { writeContract, isPending: isSendingToken } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash: transactionHash as `0x${string}` | undefined,
  });

  const seats = useMemo(() => createSeats(), []);
  const sortedResults = [...results].sort((a, b) => sortBy === "price" ? a.price - b.price : sortBy === "stops" ? a.stops - b.stops : parseInt(a.duration) - parseInt(b.duration));
  const selectedSeatData = seats.find((seat) => seat.id === selectedSeat);
  const total = (selectedFlight?.price || 0) + (selectedSeatData?.price || 0);
  const cryptoAmount = convertFromUSD(total, crypto);
  const stepIndex = stepItems.findIndex((item) => item.id === step);
  const merchantWallet = (process.env.NEXT_PUBLIC_MERCHANT_WALLET || "0x0000000000000000000000000000000000000000") as `0x${string}`;

  function updateOrigin(value: string) {
    setOrigin(value);
    setSelectedOrigin(null);
    setOriginSuggestions(value.length > 1 ? getAirportSuggestions(value) : []);
    setShowOriginDropdown(value.length > 1);
  }
  function updateDestination(value: string) {
    setDestination(value);
    setSelectedDest(null);
    setDestSuggestions(value.length > 1 ? getAirportSuggestions(value) : []);
    setShowDestDropdown(value.length > 1);
  }
  function selectAirport(airport: Airport, type: "origin" | "destination") {
    if (type === "origin") { setSelectedOrigin(airport); setOrigin(`${airport.city} (${airport.code})`); setShowOriginDropdown(false); }
    else { setSelectedDest(airport); setDestination(`${airport.city} (${airport.code})`); setShowDestDropdown(false); }
  }
  function search() {
    if (!selectedOrigin || !selectedDest || !departDate) return;
    setResults(searchFlights(selectedOrigin.code, selectedDest.code, departDate, cabinClass, passengers));
    setStep("results");
  }
  function chooseFlight(flight: FlightResult) { setSelectedFlight(flight); setStep("seat"); }
  function finishBooking() {
    setPaymentStatus("complete");
    setBookingCode(`KV${Math.random().toString(36).slice(2, 8).toUpperCase()}`);
    setStep("confirmed");
  }
  function startPayment() {
    setPaymentError(null);
    if (!web3Ready) {
      setPaymentStatus("processing");
      window.setTimeout(finishBooking, 1200);
      return;
    }
    if (!isConnected || !address) {
      setPaymentError("Connect a wallet before confirming payment.");
      return;
    }
    setPaymentStatus("processing");
    const tokenAddress = getTokenAddress(crypto);
    if (crypto === "ETH") {
      sendTransaction(
        { to: merchantWallet, value: parseEther(String(cryptoAmount)) },
        { onSuccess: (hash) => setTransactionHash(hash), onError: (error) => { setPaymentStatus("idle"); setPaymentError(error.message.split("\n")[0]); } }
      );
      return;
    }
    if (tokenAddress) {
      writeContract(
        { address: tokenAddress, abi: ERC20_ABI, functionName: "transfer", args: [merchantWallet, parseUnits(String(cryptoAmount), 6)] },
        { onSuccess: (hash) => setTransactionHash(hash), onError: (error) => { setPaymentStatus("idle"); setPaymentError(error.message.split("\n")[0]); } }
      );
      return;
    }
    setPaymentStatus("idle");
    setPaymentError(`${crypto} is not enabled for live wallet checkout yet. Choose ETH, USDT, or USDC.`);
  }
  // The receipt hook is an external async source; transition only after it reports success.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { if (paymentStatus === "processing" && transactionHash && isConfirmed) finishBooking(); }, [isConfirmed, paymentStatus, transactionHash]);
  function resetFlow() {
    setStep("search"); setSelectedFlight(null); setSelectedSeat(null); setPaymentStatus("idle"); setBookingCode(""); setPaymentError(null); setTransactionHash(null);
  }

  const fieldClass = "w-full rounded-xl border bg-white px-4 py-3 text-sm text-[#17243A] outline-none transition focus:border-[#2F72E8]";
  const labelClass = "mb-1 block text-xs font-semibold text-[#52627A]";

  return (
    <AppShell title="Flights">
      <div className="mx-auto max-w-6xl space-y-5 p-4 md:p-6">
        <div className="overflow-x-auto rounded-2xl border bg-white px-4 py-3" style={{ borderColor: "var(--kv-border-light)" }}>
          <div className="flex min-w-[660px] items-center justify-between gap-2">
            {stepItems.map((item, index) => {
              const done = index < stepIndex;
              const active = item.id === step;
              return <button key={item.id} onClick={() => index <= stepIndex && setStep(item.id)} className="flex items-center gap-2 text-left" disabled={index > stepIndex}>
                <span className="flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold" style={{ background: done ? "#3B9B73" : active ? "#2F72E8" : "#EEF1F6", color: done || active ? "white" : "#8A98AA" }}>{done ? <Check className="h-4 w-4" /> : index + 1}</span>
                <span className="whitespace-nowrap text-xs font-semibold" style={{ color: active ? "#2F72E8" : done ? "#3B9B73" : "#8A98AA" }}>{item.label}</span>
                {index < stepItems.length - 1 && <span className="mx-2 h-px w-8" style={{ background: done ? "#3B9B73" : "#D9E3F4" }} />}
              </button>;
            })}
          </div>
        </div>

        {step === "search" && <section className="relative overflow-hidden rounded-2xl border p-5 shadow-sm md:p-7" style={{ background: "#EEF3FB", borderColor: "#D9E3F4" }}>
          <div className="pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full" style={{ background: "radial-gradient(circle, rgba(47,114,232,.18), transparent 70%)" }} />
          <div className="relative">
            <div className="mb-1 flex items-center gap-2 text-sm font-semibold text-[#2F72E8]"><Plane className="h-5 w-5" /> Flight Search</div>
            <h1 className="mb-5 text-2xl font-bold text-[#17243A]">Find your next flight</h1>
            <div className="mb-5 flex gap-2"><button onClick={() => setTripType("round_trip")} className={cn("rounded-full px-4 py-2 text-sm font-semibold", tripType === "round_trip" ? "bg-[#2F72E8] text-white" : "bg-white text-[#52627A]")}>Round Trip</button><button onClick={() => setTripType("one_way")} className={cn("rounded-full px-4 py-2 text-sm font-semibold", tripType === "one_way" ? "bg-[#2F72E8] text-white" : "bg-white text-[#52627A]")}>One Way</button></div>
            <div className="grid gap-3 lg:grid-cols-12">
              <div className="relative lg:col-span-3"><label className={labelClass}>From</label><input className={fieldClass} value={origin} placeholder="City or airport" onChange={(event) => updateOrigin(event.target.value)} />{showOriginDropdown && originSuggestions.length > 0 && <div className="absolute z-20 mt-1 w-full overflow-hidden rounded-xl border bg-white shadow-xl">{originSuggestions.map((airport) => <button key={airport.code} onMouseDown={() => selectAirport(airport, "origin")} className="block w-full px-4 py-3 text-left text-sm hover:bg-[#EEF3FB]">{airport.city} <span className="text-[#8A98AA]">({airport.code})</span></button>)}</div>}</div>
              <button aria-label="Swap airports" onClick={() => { const text = origin; setOrigin(destination); setDestination(text); const airport = selectedOrigin; setSelectedOrigin(selectedDest); setSelectedDest(airport); }} className="mt-5 flex h-11 w-11 items-center justify-center rounded-full border bg-white text-[#2F72E8] hover:rotate-180" style={{ borderColor: "#D9E3F4" }}><ArrowRightLeft className="h-4 w-4" /></button>
              <div className="relative lg:col-span-3"><label className={labelClass}>To</label><input className={fieldClass} value={destination} placeholder="City or airport" onChange={(event) => updateDestination(event.target.value)} />{showDestDropdown && destSuggestions.length > 0 && <div className="absolute z-20 mt-1 w-full overflow-hidden rounded-xl border bg-white shadow-xl">{destSuggestions.map((airport) => <button key={airport.code} onMouseDown={() => selectAirport(airport, "destination")} className="block w-full px-4 py-3 text-left text-sm hover:bg-[#EEF3FB]">{airport.city} <span className="text-[#8A98AA]">({airport.code})</span></button>)}</div>}</div>
              <div className="lg:col-span-3"><label className={labelClass}>Depart {tripType === "round_trip" && "/ Return"}</label><div className="grid grid-cols-2 gap-2"><input aria-label="Depart date" type="date" className={fieldClass} value={departDate} onChange={(event) => setDepartDate(event.target.value)} /><input aria-label="Return date" type="date" className={fieldClass} value={returnDate} onChange={(event) => setReturnDate(event.target.value)} disabled={tripType === "one_way"} /></div></div>
              <div className="lg:col-span-3 grid grid-cols-2 gap-2"><div><label className={labelClass}>Passengers</label><select className={fieldClass} value={passengers} onChange={(event) => setPassengers(Number(event.target.value))}>{[1, 2, 3, 4, 5, 6].map((number) => <option key={number} value={number}>{number} {number === 1 ? "Passenger" : "Passengers"}</option>)}</select></div><div><label className={labelClass}>Class</label><select className={fieldClass} value={cabinClass} onChange={(event) => setCabinClass(event.target.value)}><option value="economy">Economy</option><option value="premium_economy">Premium Economy</option><option value="business">Business</option><option value="first">First Class</option></select></div></div>
            </div>
            <button onClick={search} disabled={!selectedOrigin || !selectedDest || !departDate} className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#2F72E8] px-6 py-3 font-semibold text-white transition hover:bg-[#245FC8] disabled:cursor-not-allowed disabled:opacity-50"><Search className="h-4 w-4" /> Search flights</button>
          </div>
        </section>}

        {step === "results" && <section className="space-y-4"><div className="flex flex-wrap items-end justify-between gap-3"><div><button onClick={() => setStep("search")} className="mb-3 flex items-center gap-2 text-sm font-semibold text-[#2F72E8]"><ArrowLeft className="h-4 w-4" /> Edit search</button><h1 className="text-2xl font-bold text-[#17243A]">{selectedOrigin?.city} <span className="text-[#8A98AA]">to</span> {selectedDest?.city}</h1><p className="mt-1 text-sm text-[#6D7D93]">{results.length} flights found · {departDate}</p></div><div className="flex items-center gap-2 text-sm"><span className="text-[#6D7D93]">Sort by</span>{(["price", "duration", "stops"] as const).map((value) => <button key={value} onClick={() => setSortBy(value)} className={cn("rounded-lg px-3 py-2 capitalize", sortBy === value ? "bg-[#2F72E8] text-white" : "bg-white text-[#52627A] border")}>{value}</button>)}</div></div><div className="space-y-3">{sortedResults.map((flight) => <article key={flight.id} className="rounded-2xl border bg-white p-4 shadow-sm md:p-5" style={{ borderColor: "var(--kv-border-light)" }}><div className="grid items-center gap-4 md:grid-cols-[1.2fr_1.8fr_.8fr_auto]"><div className="flex items-center gap-3"><span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#EEF3FB] text-sm font-bold text-[#2F72E8]">{flight.airlineLogo}</span><div><p className="font-semibold text-[#17243A]">{flight.airline}</p><p className="text-xs text-[#8A98AA]">{flight.flightNumber} · {flight.aircraft}</p></div></div><div className="flex items-center justify-center gap-3 text-center"><div><p className="text-lg font-bold text-[#17243A]">{flight.departureTime}</p><p className="text-xs text-[#8A98AA]">{flight.origin.code}</p></div><div className="min-w-24"><p className="text-xs text-[#8A98AA]">{flight.duration}</p><div className="my-1 flex items-center"><span className="h-px flex-1 bg-[#D9E3F4]" /><Plane className="mx-1 h-3 w-3 text-[#2F72E8]" /><span className="h-px flex-1 bg-[#D9E3F4]" /></div><p className={cn("text-xs font-semibold", flight.stops === 0 ? "text-[#3B9B73]" : "text-[#B7791F]")}>{flight.stops === 0 ? "Direct" : `${flight.stops} stop${flight.stops > 1 ? "s" : ""}`}</p></div><div><p className="text-lg font-bold text-[#17243A]">{flight.arrivalTime}</p><p className="text-xs text-[#8A98AA]">{flight.destination.code}</p></div></div><div className="text-center md:text-right"><p className="text-xl font-bold text-[#2F72E8]">${flight.price.toLocaleString()}</p><p className="text-xs text-[#8A98AA]">{flight.baggage}</p></div><button onClick={() => chooseFlight(flight)} className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#2F72E8] px-4 py-3 text-sm font-semibold text-white hover:bg-[#245FC8]">Select <ArrowRight className="h-4 w-4" /></button></div></article>)}</div></section>}

        {step === "seat" && selectedFlight && <section className="grid gap-5 lg:grid-cols-[1.4fr_.8fr]"><div className="rounded-2xl border bg-white p-5" style={{ borderColor: "var(--kv-border-light)" }}><button onClick={() => setStep("results")} className="mb-4 flex items-center gap-2 text-sm font-semibold text-[#2F72E8]"><ArrowLeft className="h-4 w-4" /> Back to results</button><h1 className="text-2xl font-bold text-[#17243A]">Choose your seat</h1><p className="mt-1 text-sm text-[#6D7D93]">Select a seat for {selectedFlight.flightNumber} · {selectedFlight.origin.code} to {selectedFlight.destination.code}</p><div className="mx-auto mt-6 max-w-sm rounded-[2rem] border-2 border-[#D9E3F4] bg-[#F7F9FC] p-5"><div className="mb-5 flex items-center justify-center gap-2 text-xs font-semibold text-[#8A98AA]"><Plane className="h-4 w-4 rotate-90" /> FRONT OF AIRCRAFT</div><div className="grid grid-cols-6 gap-2">{seats.map((seat, index) => <button key={seat.id} disabled={seat.status === "occupied"} onClick={() => setSelectedSeat(seat.id)} className={cn("h-10 rounded-lg text-xs font-bold transition", seat.status === "occupied" ? "bg-[#D9E0EA] text-[#9AA8BC]" : selectedSeat === seat.id ? "bg-[#2F72E8] text-white ring-2 ring-[#9FC0FA]" : "bg-white text-[#52627A] shadow-sm hover:bg-[#E7F0FF]", index % 6 === 2 ? "mr-3" : "")}>{seat.id}</button>)}</div><div className="mt-6 flex justify-center gap-4 text-xs text-[#6D7D93]"><span><i className="mr-1 inline-block h-3 w-3 rounded bg-white shadow-sm" /> Available</span><span><i className="mr-1 inline-block h-3 w-3 rounded bg-[#2F72E8]" /> Selected</span><span><i className="mr-1 inline-block h-3 w-3 rounded bg-[#D9E0EA]" /> Occupied</span></div></div></div><aside className="h-fit rounded-2xl border bg-white p-5" style={{ borderColor: "var(--kv-border-light)" }}><p className="text-xs font-semibold uppercase tracking-wider text-[#8A98AA]">Selected flight</p><h2 className="mt-2 font-bold text-[#17243A]">{selectedFlight.airline} {selectedFlight.flightNumber}</h2><div className="my-4 flex items-center justify-between text-center"><div><b className="text-xl text-[#17243A]">{selectedFlight.departureTime}</b><p className="text-xs text-[#8A98AA]">{selectedFlight.origin.code}</p></div><ArrowRight className="h-4 w-4 text-[#2F72E8]" /><div><b className="text-xl text-[#17243A]">{selectedFlight.arrivalTime}</b><p className="text-xs text-[#8A98AA]">{selectedFlight.destination.code}</p></div></div><div className="border-t pt-4 text-sm text-[#6D7D93]"><div className="flex justify-between"><span>Flight</span><b className="text-[#17243A]">${selectedFlight.price}</b></div><div className="mt-2 flex justify-between"><span>Seat {selectedSeat || "—"}</span><b className="text-[#17243A]">{selectedSeatData ? `$${selectedSeatData.price}` : "—"}</b></div></div><button disabled={!selectedSeat} onClick={() => setStep("passenger")} className="mt-5 w-full rounded-xl bg-[#2F72E8] px-4 py-3 font-semibold text-white disabled:opacity-50">Continue to passenger</button></aside></section>}

        {step === "passenger" && selectedFlight && <section className="mx-auto grid max-w-4xl gap-5 lg:grid-cols-[1.2fr_.8fr]"><div className="rounded-2xl border bg-white p-5" style={{ borderColor: "var(--kv-border-light)" }}><button onClick={() => setStep("seat")} className="mb-4 flex items-center gap-2 text-sm font-semibold text-[#2F72E8]"><ArrowLeft className="h-4 w-4" /> Back to seat map</button><div className="mb-5 flex items-center gap-3"><div className="rounded-xl bg-[#E7F0FF] p-3 text-[#2F72E8]"><Ticket className="h-5 w-5" /></div><div><h1 className="text-2xl font-bold text-[#17243A]">Passenger details</h1><p className="text-sm text-[#6D7D93]">Enter the details exactly as shown on your travel document.</p></div></div><div className="grid gap-4 sm:grid-cols-2"><div><label className={labelClass}>First name</label><input className={fieldClass} value={passenger.firstName} onChange={(event) => setPassenger({ ...passenger, firstName: event.target.value })} placeholder="Sophia" /></div><div><label className={labelClass}>Last name</label><input className={fieldClass} value={passenger.lastName} onChange={(event) => setPassenger({ ...passenger, lastName: event.target.value })} placeholder="Demo" /></div><div><label className={labelClass}>Email address</label><input className={fieldClass} type="email" value={passenger.email} onChange={(event) => setPassenger({ ...passenger, email: event.target.value })} placeholder="sophia@example.com" /></div><div><label className={labelClass}>Phone number</label><input className={fieldClass} value={passenger.phone} onChange={(event) => setPassenger({ ...passenger, phone: event.target.value })} placeholder="+1 202 555 0144" /></div></div><div className="mt-5 flex items-start gap-3 rounded-xl bg-[#F7F9FC] p-4 text-sm text-[#52627A]"><ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-[#3B9B73]" />Your information is encrypted and only used to issue your booking.</div><button disabled={!passenger.firstName || !passenger.lastName || !passenger.email} onClick={() => setStep("payment")} className="mt-5 w-full rounded-xl bg-[#2F72E8] px-4 py-3 font-semibold text-white disabled:opacity-50">Continue to payment</button></div><BookingSummary flight={selectedFlight} seat={selectedSeatData} /></section>}

        {step === "payment" && selectedFlight && <section className="mx-auto grid max-w-4xl gap-5 lg:grid-cols-[1.1fr_.9fr]"><div className="rounded-2xl border bg-white p-5" style={{ borderColor: "var(--kv-border-light)" }}><button onClick={() => setStep("passenger")} className="mb-4 flex items-center gap-2 text-sm font-semibold text-[#2F72E8]"><ArrowLeft className="h-4 w-4" /> Back to passenger details</button><div className="mb-5 flex items-center gap-3"><div className="rounded-xl bg-[#E7F0FF] p-3 text-[#2F72E8]"><WalletCards className="h-5 w-5" /></div><div><h1 className="text-2xl font-bold text-[#17243A]">Pay with crypto</h1><p className="text-sm text-[#6D7D93]">{web3Ready ? "Connect your wallet to settle this booking on-chain." : "Demo mode is active until a WalletConnect project ID is configured."}</p></div></div><div className="grid gap-3 sm:grid-cols-3">{supportedCryptos.filter((coin) => ["ETH", "USDT", "USDC"].includes(coin.symbol)).map((coin) => <button key={coin.symbol} onClick={() => setCrypto(coin.symbol)} className={cn("rounded-xl border p-4 text-left", crypto === coin.symbol ? "border-[#2F72E8] bg-[#E7F0FF]" : "bg-white")}><div className="text-lg font-bold text-[#17243A]">{coin.symbol}</div><div className="mt-1 text-xs text-[#6D7D93]">{formatCryptoAmount(convertFromUSD(total, coin.symbol), coin.symbol)}</div></button>)}</div><div className="mt-5 rounded-2xl bg-[#F7F9FC] p-5"><div className="flex items-center justify-between"><span className="text-sm text-[#6D7D93]">Amount due</span><span className="text-2xl font-bold text-[#17243A]">${total.toLocaleString()} <small className="text-sm font-medium text-[#8A98AA]">USD</small></span></div><div className="mt-4 flex items-center justify-between border-t pt-4"><span className="text-sm text-[#6D7D93]">Paying with {crypto}</span><b className="text-[#2F72E8]">{formatCryptoAmount(cryptoAmount, crypto)}</b></div></div>{web3Ready && !isConnected && <div className="mt-5 grid gap-2 sm:grid-cols-3">{connectors.map((connector) => <button key={connector.uid} onClick={() => connect({ connector })} disabled={isConnecting} className="rounded-xl border px-3 py-2 text-sm font-semibold text-[#52627A] hover:border-[#2F72E8]">{isConnecting ? "Connecting…" : `Connect ${connector.name}`}</button>)}</div>}{web3Ready && isConnected && <div className="mt-5 flex items-center justify-between rounded-xl bg-[#E7F6EF] p-3 text-sm text-[#287A58]"><span>Wallet connected</span><span className="font-mono">{address?.slice(0, 6)}…{address?.slice(-4)}</span></div>}{paymentError && <div className="mt-5 rounded-xl border border-[#F0C8C6] bg-[#FFF5F4] p-3 text-sm text-[#A63E39]">{paymentError}</div>}{paymentStatus === "processing" && <div className="mt-5 rounded-xl border border-[#D9E3F4] bg-[#F7F9FC] p-3 text-sm text-[#52627A]">{transactionHash ? (isConfirming ? "Transaction submitted. Waiting for network confirmation…" : "Finalizing booking…") : isSendingEth || isSendingToken ? "Waiting for wallet approval…" : "Preparing payment…"}</div>}<button onClick={startPayment} disabled={paymentStatus === "processing" || isSendingEth || isSendingToken || isConfirming} className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-[#2F72E8] px-4 py-3 font-semibold text-white disabled:opacity-60">{paymentStatus === "processing" ? "Confirming payment…" : `Confirm payment · ${formatCryptoAmount(cryptoAmount, crypto)}`}</button></div><BookingSummary flight={selectedFlight} seat={selectedSeatData} /></section>}

        {step === "confirmed" && selectedFlight && <section className="mx-auto max-w-2xl"><div className="rounded-3xl border bg-white p-6 text-center shadow-sm md:p-8" style={{ borderColor: "#CDE9DB" }}><div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#DDF4E8] text-[#3B9B73]"><CheckCircle2 className="h-9 w-9" /></div><p className="mt-4 text-sm font-semibold uppercase tracking-wider text-[#3B9B73]">Booking confirmed</p><h1 className="mt-2 text-3xl font-bold text-[#17243A]">Your trip is ready</h1><p className="mt-2 text-sm text-[#6D7D93]">A boarding pass has been issued for {passenger.firstName || "your passenger"}.</p><div className="my-6 rounded-2xl bg-[#17243A] p-5 text-left text-white"><div className="flex items-center justify-between"><div><p className="text-xs uppercase tracking-wider text-white/60">Boarding pass</p><p className="mt-1 text-xl font-bold">{selectedFlight.airline}</p></div><Plane className="h-7 w-7 text-[#8DB6FF]" /></div><div className="my-6 flex items-center justify-between"><div><b className="text-3xl">{selectedFlight.origin.code}</b><p className="text-xs text-white/60">{selectedFlight.departureTime}</p></div><div className="flex-1 px-4"><div className="h-px bg-white/30" /><p className="mt-2 text-center text-xs text-white/60">{selectedFlight.duration}</p></div><div className="text-right"><b className="text-3xl">{selectedFlight.destination.code}</b><p className="text-xs text-white/60">{selectedFlight.arrivalTime}</p></div></div><div className="grid grid-cols-3 gap-3 border-t border-white/15 pt-4 text-sm"><div><p className="text-xs text-white/60">Passenger</p><b>{passenger.lastName || "Demo"}</b></div><div><p className="text-xs text-white/60">Seat</p><b>{selectedSeat}</b></div><div><p className="text-xs text-white/60">Booking code</p><b>{bookingCode}</b></div></div></div><div className="flex flex-wrap justify-center gap-3"><button onClick={() => navigator.clipboard?.writeText(bookingCode)} className="inline-flex items-center gap-2 rounded-xl border px-4 py-3 text-sm font-semibold text-[#52627A]"><Copy className="h-4 w-4" /> Copy booking code</button><button onClick={resetFlow} className="inline-flex items-center gap-2 rounded-xl bg-[#2F72E8] px-4 py-3 text-sm font-semibold text-white"><Sparkles className="h-4 w-4" /> Book another flight</button></div></div></section>}
      </div>
    </AppShell>
  );
}

function BookingSummary({ flight, seat }: { flight: FlightResult; seat?: Seat }) {
  return <aside className="h-fit rounded-2xl border bg-white p-5" style={{ borderColor: "var(--kv-border-light)" }}><p className="text-xs font-semibold uppercase tracking-wider text-[#8A98AA]">Booking summary</p><div className="mt-3 flex items-center justify-between"><div><p className="text-2xl font-bold text-[#17243A]">{flight.origin.code}</p><p className="text-xs text-[#8A98AA]">{flight.departureTime}</p></div><ArrowRight className="h-4 w-4 text-[#2F72E8]" /><div className="text-right"><p className="text-2xl font-bold text-[#17243A]">{flight.destination.code}</p><p className="text-xs text-[#8A98AA]">{flight.arrivalTime}</p></div></div><div className="mt-4 space-y-2 border-t pt-4 text-sm text-[#6D7D93]"><div className="flex justify-between"><span>{flight.airline} · {flight.flightNumber}</span><Luggage className="h-4 w-4" /></div><div className="flex justify-between"><span>Seat</span><b className="text-[#17243A]">{seat?.id || "Not selected"}</b></div><div className="flex justify-between"><span>Total</span><b className="text-lg text-[#2F72E8]">${(flight.price + (seat?.price || 0)).toLocaleString()}</b></div></div></aside>;
}
