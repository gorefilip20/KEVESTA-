import { createPublicClient, decodeEventLog, getAddress, http, parseEther, parseUnits } from "viem";
import { mainnet } from "viem/chains";
import { USDC_ADDRESS, USDT_ADDRESS } from "@/lib/web3/config";

const transferAbi = [{ type: "event", name: "Transfer", inputs: [{ indexed: true, name: "from", type: "address" }, { indexed: true, name: "to", type: "address" }, { indexed: false, name: "value", type: "uint256" }]}] as const;

function client() {
  const rpc = process.env.CRYPTO_RPC_MAINNET || process.env.NEXT_PUBLIC_RPC_MAINNET || "https://eth.llamarpc.com";
  return createPublicClient({ chain: mainnet, transport: http(rpc, { timeout: 10000 }) });
}

export async function verifyCryptoSettlement(input: { txHash: `0x${string}`; currency: "ETH" | "USDC" | "USDT"; cryptoAmount: number; walletAddress: string }) {
  const merchant = process.env.NEXT_PUBLIC_MERCHANT_WALLET;
  if (!merchant) throw new Error("Merchant wallet is not configured");
  const merchantAddress = getAddress(merchant);
  const senderAddress = getAddress(input.walletAddress);
  const publicClient = client();
  const receipt = await publicClient.getTransactionReceipt({ hash: input.txHash });
  if (receipt.status !== "success") throw new Error("The wallet transaction did not succeed");
  const transaction = await publicClient.getTransaction({ hash: input.txHash });
  if (transaction.from.toLowerCase() !== senderAddress.toLowerCase()) throw new Error("Transaction sender does not match the connected wallet");

  if (input.currency === "ETH") {
    if (!transaction.to || transaction.to.toLowerCase() !== merchantAddress.toLowerCase()) throw new Error("ETH transaction recipient does not match the merchant wallet");
    const expected = parseEther(input.cryptoAmount.toFixed(18));
    if (transaction.value !== expected) throw new Error("ETH transaction amount does not match the locked quote");
    return { chainId: mainnet.id, tokenAddress: null, from: transaction.from, to: merchantAddress, amount: expected.toString() };
  }

  const tokenAddress = input.currency === "USDC" ? USDC_ADDRESS : USDT_ADDRESS;
  const expected = parseUnits(input.cryptoAmount.toFixed(6), 6);
  const transfer = receipt.logs.map((log) => {
    if (log.address.toLowerCase() !== tokenAddress.toLowerCase()) return null;
    try { return decodeEventLog({ abi: transferAbi, data: log.data, topics: log.topics, strict: false }); } catch { return null; }
  }).find((decoded) => decoded?.eventName === "Transfer" && decoded.args.to?.toLowerCase() === merchantAddress.toLowerCase() && decoded.args.from?.toLowerCase() === senderAddress.toLowerCase() && decoded.args.value === expected);
  if (!transfer) throw new Error(`${input.currency} transfer does not match the merchant, sender, and locked quote`);
  return { chainId: mainnet.id, tokenAddress, from: senderAddress, to: merchantAddress, amount: expected.toString() };
}
