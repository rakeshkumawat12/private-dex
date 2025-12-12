"use client";

import { useState } from "react";
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

export default function FaucetPage() {
  const { address, isConnected } = useAccount();
  const [currentTokenIndex, setCurrentTokenIndex] = useState<number | null>(null);
  const [completedTokens, setCompletedTokens] = useState<Set<number>>(new Set());
  const [failedTokens, setFailedTokens] = useState<Set<number>>(new Set());

  const { data: hash, writeContract, isPending, error } = useWriteContract();

  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
  });

  const handleMintAll = async () => {
    if (!address || !isConnected) return;

    setCompletedTokens(new Set());
    setFailedTokens(new Set());
    setCurrentTokenIndex(0);

    mintToken(0);
  };

  const mintToken = async (tokenIndex: number) => {
    if (tokenIndex >= MOCK_TOKENS.length) {
      setCurrentTokenIndex(null);
      return;
    }

    setCurrentTokenIndex(tokenIndex);
    const token = MOCK_TOKENS[tokenIndex];

    try {
      const amount = parseUnits("1000", token.decimals);

      writeContract({
        address: token.address as `0x${string}`,
        abi: ERC20_ABI,
        functionName: "mint",
        args: [address as `0x${string}`, amount],
      });
    } catch (err) {
      console.error(`Error minting ${token.symbol}:`, err);
      setFailedTokens(prev => new Set([...prev, tokenIndex]));
      // Continue to next token
      setTimeout(() => mintToken(tokenIndex + 1), 500);
    }
  };

  // Handle transaction confirmation
  if (isConfirmed && currentTokenIndex !== null) {
    const newCompleted = new Set(completedTokens);
    newCompleted.add(currentTokenIndex);
    setCompletedTokens(newCompleted);

    // Move to next token
    const nextIndex = currentTokenIndex + 1;
    setTimeout(() => {
      if (nextIndex < MOCK_TOKENS.length) {
        mintToken(nextIndex);
      } else {
        setCurrentTokenIndex(null);
      }
    }, 1000);
  }

  const isMinting = currentTokenIndex !== null;
  const allCompleted = completedTokens.size === MOCK_TOKENS.length;

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
            Click the button below to mint 1000 tokens of each type to your wallet.
            This makes it easy to test swaps and liquidity provision.
          </p>
        </div>

        {/* Token List */}
        <div className="space-y-3">
          {MOCK_TOKENS.map((token, index) => (
            <motion.div
              key={token.address}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 + index * 0.05 }}
              className="flex items-center justify-between rounded-lg border border-border/50 bg-muted/30 p-4"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full border border-primary/30 bg-primary/10">
                  <span className="text-sm font-bold text-primary">{token.symbol[0]}</span>
                </div>
                <div>
                  <div className="font-semibold">{token.symbol}</div>
                  <div className="text-xs text-muted-foreground">{token.name}</div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-sm text-muted-foreground">1000 tokens</span>
                {completedTokens.has(index) && (
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                )}
                {failedTokens.has(index) && (
                  <XCircle className="h-5 w-5 text-destructive" />
                )}
                {currentTokenIndex === index && (
                  <Loader2 className="h-5 w-5 animate-spin text-primary" />
                )}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Action Button */}
        <div className="space-y-4">
          {!isConnected ? (
            <div className="rounded-lg border border-yellow-500/20 bg-yellow-500/10 p-4 text-sm text-yellow-500">
              Please connect your wallet to use the faucet
            </div>
          ) : (
            <button
              onClick={handleMintAll}
              disabled={isMinting}
              className="w-full flex items-center justify-center gap-2 rounded-lg border border-primary/40 bg-primary/10 px-6 py-4 text-sm font-medium text-primary transition-all hover:bg-primary/20 hover:border-primary/60 hover:shadow-[0_0_20px_rgba(0,255,136,0.15)] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isMinting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Minting {MOCK_TOKENS[currentTokenIndex]?.symbol}...
                </>
              ) : allCompleted ? (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  All Tokens Minted Successfully
                </>
              ) : (
                <>
                  <Droplet className="h-4 w-4" />
                  Get Test Tokens
                </>
              )}
            </button>
          )}

          {allCompleted && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-lg border border-green-500/20 bg-green-500/10 p-4 space-y-2"
            >
              <div className="flex items-center gap-2 text-sm font-medium text-green-500">
                <CheckCircle2 className="h-4 w-4" />
                Success! Tokens minted to your wallet
              </div>
              <p className="text-xs text-green-500/70">
                You can now add these tokens to MetaMask and start trading!
              </p>
            </motion.div>
          )}

          {error && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-lg border border-destructive/20 bg-destructive/10 p-4"
            >
              <div className="flex items-center gap-2 text-sm font-medium text-destructive">
                <XCircle className="h-4 w-4" />
                Transaction Failed
              </div>
              <p className="text-xs text-destructive/70 mt-1">
                {error.message}
              </p>
            </motion.div>
          )}

          {hash && (
            <div className="text-xs text-muted-foreground text-center">
              <a
                href={`https://sepolia.etherscan.io/tx/${hash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 hover:text-primary transition-colors"
              >
                View transaction <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          )}
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
              <span>Click "Get Test Tokens" to mint all tokens at once</span>
            </li>
            <li className="flex gap-2">
              <span className="text-primary">3.</span>
              <span>Approve each transaction in your wallet (4 total)</span>
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
