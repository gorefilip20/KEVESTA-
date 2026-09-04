import { NextRequest, NextResponse } from "next/server";
import { convertFromUSD, formatCryptoAmount, generateTxHash, exchangeRates } from "@/data/crypto";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { amount, currency, cryptoCurrency, walletAddress } = body;

    if (!amount || !cryptoCurrency || !walletAddress) {
      return NextResponse.json(
        { error: "amount, cryptoCurrency, and walletAddress are required" },
        { status: 400 }
      );
    }

    if (!exchangeRates[cryptoCurrency]) {
      return NextResponse.json(
        { error: `Unsupported cryptocurrency: ${cryptoCurrency}` },
        { status: 400 }
      );
    }

    const cryptoAmount = convertFromUSD(Number(amount), cryptoCurrency);
    const txHash = generateTxHash();

    return NextResponse.json({
      success: true,
      transaction: {
        id: `TX-${Date.now().toString(36).toUpperCase()}`,
        amount: Number(amount),
        currency: currency || "USD",
        cryptoCurrency,
        cryptoAmount,
        formattedCryptoAmount: formatCryptoAmount(cryptoAmount, cryptoCurrency),
        walletAddress,
        txHash,
        status: "confirmed",
        exchangeRate: exchangeRates[cryptoCurrency],
        timestamp: new Date().toISOString(),
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
