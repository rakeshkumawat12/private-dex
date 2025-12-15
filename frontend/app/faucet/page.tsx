"use client";

import { useState, useEffect } from "react";
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { motion } from "framer-motion";
import { Droplet, Loader2, CheckCircle2, XCircle, ExternalLink } from "lucide-react";
import { parseUnits } from "viem";

const MOCK_TOKENS = [
  { address: "0x35287D9fDb7a1E7CC2212Fd1d57F8ae71cCA030A", symbol: "WETH", name: "Wrapped Ether", decimals: 18 },
  { address: "0x01134D4D7A522a5d601413dD3Bf33859B193063e", symbol: "USDC", name: "USD Coin", decimals: 6 },
  { address: "0x64c178393Bbe0cAe2a78A19c58e9B3944c2D5B42", symbol: "DAI", name: "Dai Stablecoin", decimals: 18 },
  { address: "0x5ccE1Fda0efe9A51302B3F26E3ca0d672536c2F7", symbol: "USDT", name: "Tether USD", decimals: 6 },
];

const ERC20_ABI = [
  {
    inputs: [
      { name: "to", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    name: "mint",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
] as const;

function TokenCard({ token, index }: { token: typeof MOCK_TOKENS[0]; index: number }) {
  const { address, isConnected } = useAccount();
  const [hasMinted, setHasMinted] = useState(false);

  const { data: hash, writeContract, isPending, error } = useWriteContract();

  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
  });

  const handleMint = () => {
    if (!address || !isConnected) return;

    const amount = parseUnits("1000", token.decimals);

    writeContract({
      address: token.address as `0x${string}`,
      abi: ERC20_ABI,
      functionName: "mint",
      args: [address as `0x${string}`, amount],
    });
  };

  // Update minted status when transaction confirms
  useEffect(() => {
    if (isConfirmed && !hasMinted) {
      setHasMinted(true);
    }
  }, [isConfirmed, hasMinted]);

  const isMinting = isPending || isConfirming;

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.1 + index * 0.05 }}
      className="rounded-lg border border-border/50 bg-muted/30 p-4 space-y-3"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-primary/30 bg-primary/10">
            <span className="text-sm font-bold text-primary">{token.symbol[0]}</span>
          </div>
          <div>
            <div className="font-semibold font-mono">{token.symbol}</div>
            <div className="text-xs text-muted-foreground">{token.name}</div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {!isConnected ? (
            <span className="text-xs text-muted-foreground">Connect wallet</span>
          ) : (
            <>
              {!hasMinted && !isMinting && !error && (
                <button
                  onClick={handleMint}
                  className="cursor-pointer rounded-lg border border-primary/40 bg-primary/10 px-4 py-2 text-xs font-medium text-primary transition-all hover:bg-primary/20 hover:border-primary/60 hover:shadow-[0_0_15px_rgba(0,255,136,0.15)]"
                >
                  <div className="flex items-center gap-2">
                    <Droplet className="h-3.5 w-3.5" />
                    MINT_1000
                  </div>
                </button>
              )}

              {isMinting && (
                <div className="flex items-center gap-2 px-4 py-2 rounded-lg border border-primary/20 bg-primary/5">
                  <div className="h-4 w-4 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                  <span className="text-xs font-mono text-primary">
                    {isPending ? "CONFIRM_IN_WALLET..." : "MINTING..."}
                  </span>
                </div>
              )}

              {isConfirmed && hasMinted && (
                <div className="flex items-center gap-2 px-4 py-2 rounded-lg border border-primary/40 bg-primary/10">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  <span className="text-xs font-mono text-primary">MINTED_SUCCESS</span>
                </div>
              )}

              {error && (
                <div className="flex items-center gap-2 px-4 py-2 rounded-lg border border-destructive/40 bg-destructive/10">
                  <XCircle className="h-4 w-4 text-destructive" />
                  <span className="text-xs font-mono text-destructive">TX_FAILED</span>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Transaction link - Improved styling */}
      {hash && (
        <div className="rounded-md border border-primary/10 bg-primary/5 p-3">
          <a
            href={`https://sepolia.etherscan.io/tx/${hash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between group"
          >
            <div className="flex items-center gap-2">
              <ExternalLink className="h-3.5 w-3.5 text-primary" />
              <span className="text-xs font-mono text-muted-foreground group-hover:text-primary transition-colors">
                VIEW_ON_ETHERSCAN
              </span>
            </div>
            <span className="text-xs font-mono text-primary/60">
              {hash.slice(0, 6)}...{hash.slice(-4)}
            </span>
          </a>
        </div>
      )}

      {/* Error message - Improved styling */}
      {error && (
        <div className="rounded-md border border-destructive/20 bg-destructive/5 p-3">
          <div className="flex items-start gap-2">
            <XCircle className="h-4 w-4 text-destructive flex-shrink-0 mt-0.5" />
            <p className="text-xs text-destructive/90 font-mono">
              {error.message.includes("rejected") ? "USER_REJECTED_TRANSACTION" : "ERROR: " + error.message.slice(0, 50)}
            </p>
          </div>
        </div>
      )}
    </motion.div>
  );
}

export default function FaucetPage() {
  const { isConnected } = useAccount();

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8 space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-4"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg border border-primary/30 bg-primary/10">
            <Droplet className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">TOKEN FAUCET</h1>
            <p className="text-sm text-muted-foreground">Get test tokens for trading</p>
          </div>
        </div>
      </motion.div>

      {/* Main Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="rounded-lg border border-primary/20 bg-card/50 backdrop-blur-sm p-8 space-y-6"
      >
        {/* Info Section */}
        <div className="space-y-2">
          <h2 className="text-xl font-semibold">Get Test Tokens</h2>
          <p className="text-sm text-muted-foreground">
            Click the "Mint" button for each token you want to receive. Each mint will give you 1000 tokens.
          </p>
        </div>

        {/* Connection Warning */}
        {!isConnected && (
          <div className="rounded-lg border border-yellow-500/20 bg-yellow-500/10 p-4 text-sm text-yellow-500">
            Please connect your wallet to use the faucet
          </div>
        )}

        {/* Token List */}
        <div className="space-y-3">
          {MOCK_TOKENS.map((token, index) => (
            <TokenCard key={token.address} token={token} index={index} />
          ))}
        </div>

        {/* Instructions */}
        <div className="space-y-3 pt-4 border-t border-border/50">
          <h3 className="text-sm font-semibold text-muted-foreground">How to use:</h3>
          <ol className="space-y-2 text-sm text-muted-foreground">
            <li className="flex gap-2">
              <span className="text-primary">1.</span>
              <span>Connect your wallet using the button in the navbar</span>
            </li>
            <li className="flex gap-2">
              <span className="text-primary">2.</span>
              <span>Click the "Mint" button for each token you want</span>
            </li>
            <li className="flex gap-2">
              <span className="text-primary">3.</span>
              <span>Approve the transaction in your wallet</span>
            </li>
            <li className="flex gap-2">
              <span className="text-primary">4.</span>
              <span>Add token contracts to MetaMask to see your balances</span>
            </li>
            <li className="flex gap-2">
              <span className="text-primary">5.</span>
              <span>Head to the Swap or Liquidity page to start trading!</span>
            </li>
          </ol>
        </div>

        {/* Token Addresses */}
        <div className="space-y-3 pt-4 border-t border-border/50">
          <h3 className="text-sm font-semibold text-muted-foreground">Token Addresses:</h3>
          <div className="space-y-2">
            {MOCK_TOKENS.map((token) => (
              <div key={token.address} className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">{token.symbol}:</span>
                <a
                  href={`https://sepolia.etherscan.io/address/${token.address}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-mono text-primary hover:underline flex items-center gap-1"
                >
                  {token.address.slice(0, 6)}...{token.address.slice(-4)}
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
