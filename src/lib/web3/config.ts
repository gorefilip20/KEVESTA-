import { http, createConfig } from "wagmi";
import { mainnet, sepolia, polygon, arbitrum, optimism, bsc } from "wagmi/chains";
import { coinbaseWallet, injected, walletConnect } from "wagmi/connectors";

const walletConnectProjectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || "";

export const wagmiConfig = createConfig({
  chains: [mainnet, sepolia, polygon, arbitrum, optimism, bsc],
  connectors: [
    injected(),
    ...(walletConnectProjectId
      ? [walletConnect({ projectId: walletConnectProjectId })]
      : []),
    coinbaseWallet({ appName: "Kevesta" }),
  ],
  transports: {
    [mainnet.id]: http(
      process.env.NEXT_PUBLIC_RPC_MAINNET || "https://eth.llamarpc.com"
    ),
    [sepolia.id]: http(
      process.env.NEXT_PUBLIC_RPC_SEPOLIA || "https://rpc.sepolia.org"
    ),
    [polygon.id]: http(
      process.env.NEXT_PUBLIC_RPC_POLYGON || "https://polygon-rpc.com"
    ),
    [arbitrum.id]: http(
      process.env.NEXT_PUBLIC_RPC_ARBITRUM || "https://arb1.arbitrum.io/rpc"
    ),
    [optimism.id]: http(
      process.env.NEXT_PUBLIC_RPC_OPTIMISM || "https://mainnet.optimism.io"
    ),
    [bsc.id]: http(
      process.env.NEXT_PUBLIC_RPC_BSC || "https://bsc-dataseed.binance.org"
    ),
  },
});

export const USDT_ADDRESS = "0xdAC17F958D2ee523a2206206994597C13D831ec7" as const;
export const USDC_ADDRESS = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48" as const;

export const ERC20_ABI = [
  {
    type: "function",
    name: "transfer",
    inputs: [
      { name: "to", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "balanceOf",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "decimals",
    inputs: [],
    outputs: [{ name: "", type: "uint8" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "allowance",
    inputs: [
      { name: "owner", type: "address" },
      { name: "spender", type: "address" },
    ],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
  },
] as const;

export function getTokenAddress(symbol: string): `0x${string}` | null {
  switch (symbol) {
    case "USDT":
      return USDT_ADDRESS;
    case "USDC":
      return USDC_ADDRESS;
    default:
      return null;
  }
}

export function isWeb3Configured(): boolean {
  return !!walletConnectProjectId;
}
