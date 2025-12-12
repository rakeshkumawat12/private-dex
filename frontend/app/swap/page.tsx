"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowDownUp, Settings, AlertCircle, Zap, ChevronDown, ShieldAlert, Loader2 } from "lucide-react";
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { parseUnits, formatUnits } from "viem";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/useToast";
import { ROUTER_ADDRESS, ROUTER_ABI, ERC20_ABI } from "@/lib/contracts";
import { useWhitelistProtection } from "@/hooks/useWhitelist";
import Link from "next/link";

const MOCK_TOKENS = [
  { address: "0x35287D9fDb7a1E7CC2212Fd1d57F8ae71cCA030A", symbol: "WETH", name: "Wrapped Ether", decimals: 18 },
  { address: "0x01134D4D7A522a5d601413dD3Bf33859B193063e", symbol: "USDC", name: "USD Coin", decimals: 6 },
  { address: "0x64c178393Bbe0cAe2a78A19c58e9B3944c2D5B42", symbol: "DAI", name: "Dai Stablecoin", decimals: 18 },
  { address: "0x5ccE1Fda0efe9A51302B3F26E3ca0d672536c2F7", symbol: "USDT", name: "Tether USD", decimals: 6 },
];

export default function SwapPage() {
  const { address, isConnected } = useAccount();
  const { toast } = useToast();
  const { isWhitelisted, isCheckingWhitelist } = useWhitelistProtection(true);

  const [fromToken, setFromToken] = useState(MOCK_TOKENS[0]);
  const [toToken, setToToken] = useState(MOCK_TOKENS[1]);
  const [fromAmount, setFromAmount] = useState("");
  const [toAmount, setToAmount] = useState("");
  const [slippage, setSlippage] = useState("0.5");
  const [showSettings, setShowSettings] = useState(false);

  const { writeContract, data: hash, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const { data: fromBalance } = useReadContract({
    address: fromToken.address as `0x${string}`,
    abi: ERC20_ABI,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
  });

  const { data: toBalance } = useReadContract({
    address: toToken.address as `0x${string}`,
    abi: ERC20_ABI,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
  });

  const { data: allowance } = useReadContract({
    address: fromToken.address as `0x${string}`,
    abi: ERC20_ABI,
    functionName: "allowance",
    args: address ? [address, ROUTER_ADDRESS] : undefined,
  });

  useEffect(() => {
    if (isSuccess) {
      toast({
        title: "SWAP_EXECUTED",
        description: `${fromAmount} ${fromToken.symbol} → ${toAmount} ${toToken.symbol}`,
        variant: "success",
      });
      setFromAmount("");
      setToAmount("");
    }
  }, [isSuccess]);

  const handleSwapTokens = () => {
    const temp = fromToken;
    setFromToken(toToken);
    setToToken(temp);
    setFromAmount(toAmount);
    setToAmount(fromAmount);
  };

  const handleApprove = async () => {
    if (!fromAmount || !isConnected) return;

    try {
      const amount = parseUnits(fromAmount, fromToken.decimals);

      writeContract({
        address: fromToken.address as `0x${string}`,
        abi: ERC20_ABI,
        functionName: "approve",
        args: [ROUTER_ADDRESS, amount],
      });

      toast({
        title: "APPROVAL_PENDING",
        description: "Awaiting confirmation...",
      });
    } catch (error: any) {
      toast({
        title: "APPROVAL_FAILED",
        description: error.message,
        variant: "error",
      });
    }
  };

  const handleSwap = async () => {
    if (!fromAmount || !toAmount || !isConnected) return;

    try {
      const amountIn = parseUnits(fromAmount, fromToken.decimals);
      const amountOutMin = parseUnits(
        (parseFloat(toAmount) * (1 - parseFloat(slippage) / 100)).toString(),
        toToken.decimals
      );
      const deadline = BigInt(Math.floor(Date.now() / 1000) + 3600);

      writeContract({
        address: ROUTER_ADDRESS,
        abi: ROUTER_ABI,
        functionName: "swapExactTokensForTokens",
        args: [
          amountIn,
          amountOutMin,
          [fromToken.address as `0x${string}`, toToken.address as `0x${string}`],
          address as `0x${string}`,
          deadline,
        ],
      });

      toast({
        title: "SWAP_PENDING",
        description: "Awaiting confirmation...",
      });
    } catch (error: any) {
      toast({
        title: "SWAP_FAILED",
        description: error.message,
        variant: "error",
      });
    }
  };

  const needsApproval = allowance !== undefined && fromAmount
    ? allowance < parseUnits(fromAmount, fromToken.decimals)
    : true;

  // Show loading state while checking whitelist
  if (isCheckingWhitelist) {
    return (
      <div className="relative min-h-[calc(100vh-8rem)] flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 mx-auto animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">VERIFYING_WHITELIST_STATUS...</p>
        </div>
      </div>
    );
  }

  // Show not whitelisted message
  if (isConnected && !isWhitelisted) {
    return (
      <div className="relative min-h-[calc(100vh-8rem)] flex items-center justify-center">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 left-1/2 h-[500px] w-[500px] -translate-x-1/2 rounded-full bg-destructive/5 blur-[100px]" />
          <div className="grid-pattern absolute inset-0 opacity-20" />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="container relative mx-auto px-4 max-w-md"
        >
          <div className="terminal-card rounded-lg p-8 text-center space-y-6">
            <div className="flex justify-center">
              <div className="p-4 rounded-full bg-destructive/10 border border-destructive/20">
                <ShieldAlert className="h-8 w-8 text-destructive" />
              </div>
            </div>

            <div className="space-y-2">
              <h2 className="text-xl font-bold text-destructive">ACCESS_DENIED</h2>
              <p className="text-sm text-muted-foreground">
                Your wallet address is not whitelisted for this protocol.
              </p>
            </div>

            <div className="pt-4 space-y-3">
              <Link href="/whitelist">
                <Button variant="glow" size="lg" className="w-full">
                  REQUEST_WHITELIST_ACCESS
                </Button>
              </Link>
              <p className="text-xs text-muted-foreground">
                // Submit a request to gain access to swap and liquidity features
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="relative min-h-[calc(100vh-8rem)]">
      {/* Background effects */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/2 h-[500px] w-[500px] -translate-x-1/2 rounded-full bg-primary/5 blur-[100px]" />
        <div className="grid-pattern absolute inset-0 opacity-20" />
      </div>

      <div className="container relative mx-auto px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-lg mx-auto space-y-6"
        >
          {/* Header */}
          <div className="text-center space-y-2">
            <div className="inline-flex items-center gap-2 text-xs text-muted-foreground">
              <Zap className="h-3.5 w-3.5 text-primary" />
              <span>INSTANT_EXECUTION</span>
            </div>
            <h1 className="text-3xl font-bold">
              <span className="gradient-primary">SWAP_TOKENS</span>
            </h1>
            <p className="text-sm text-muted-foreground">
              // AMM-powered atomic swaps
            </p>
          </div>

          {/* Main Swap Card */}
          <div className="terminal-card rounded-lg overflow-hidden">
            {/* Terminal Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-primary/10 bg-primary/5">
              <div className="flex items-center gap-2">
                <div className="flex gap-1.5">
                  <div className="h-2.5 w-2.5 rounded-full bg-destructive/60" />
                  <div className="h-2.5 w-2.5 rounded-full bg-accent/60" />
                  <div className="h-2.5 w-2.5 rounded-full bg-primary/60" />
                </div>
                <span className="text-xs text-muted-foreground ml-2">swap_terminal</span>
              </div>
              <button
                onClick={() => setShowSettings(!showSettings)}
                className="p-1.5 rounded hover:bg-primary/10 transition-colors"
              >
                <Settings className="h-4 w-4 text-muted-foreground" />
              </button>
            </div>

            {/* Settings Panel */}
            {showSettings && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="px-4 py-3 border-b border-primary/10 bg-muted/30"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">SLIPPAGE_TOLERANCE</span>
                  <div className="flex items-center gap-2">
                    {["0.1", "0.5", "1.0"].map((value) => (
                      <button
                        key={value}
                        onClick={() => setSlippage(value)}
                        className={`px-3 py-1 text-xs rounded border transition-all ${
                          slippage === value
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-border/50 text-muted-foreground hover:border-primary/50"
                        }`}
                      >
                        {value}%
                      </button>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {/* Swap Content */}
            <div className="p-4 space-y-3">
              {/* From Token */}
              <div className="rounded border border-border/50 bg-muted/30 p-4 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">FROM</span>
                  {fromBalance !== undefined && (
                    <button
                      onClick={() => setFromAmount(formatUnits(fromBalance, fromToken.decimals))}
                      className="text-muted-foreground hover:text-primary transition-colors"
                    >
                      BAL: {parseFloat(formatUnits(fromBalance, fromToken.decimals)).toFixed(4)}
                    </button>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <select
                      value={fromToken.address}
                      onChange={(e) => {
                        const token = MOCK_TOKENS.find(t => t.address === e.target.value);
                        if (token) setFromToken(token);
                      }}
                      className="appearance-none bg-primary/10 border border-primary/20 rounded px-3 py-2 pr-8 text-sm font-medium text-primary cursor-pointer hover:bg-primary/20 transition-colors"
                    >
                      {MOCK_TOKENS.map((token) => (
                        <option key={token.address} value={token.address}>
                          {token.symbol}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-primary pointer-events-none" />
                  </div>
                  <Input
                    type="number"
                    placeholder="0.00"
                    value={fromAmount}
                    onChange={(e) => setFromAmount(e.target.value)}
                    className="flex-1 text-right text-xl font-bold bg-transparent border-0 focus:ring-0 p-0"
                  />
                </div>
              </div>

              {/* Swap Button */}
              <div className="flex justify-center -my-1 relative z-10" style={{ margin: "0.7rem 0" }}>
                <motion.button
                  onClick={handleSwapTokens}
                  whileHover={{ scale: 1.1, rotate: 180 }}
                  whileTap={{ scale: 0.95 }}
                  transition={{ duration: 0.3 }}
                  className="p-2.5 rounded-lg bg-primary/10 border border-primary/30 text-primary hover:bg-primary/20 transition-colors"
                >
                  <ArrowDownUp className="h-4 w-4" />
                </motion.button>
              </div>

              {/* To Token */}
              <div className="rounded border border-border/50 bg-muted/30 p-4 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">TO</span>
                  {toBalance !== undefined && (
                    <span className="text-muted-foreground">
                      BAL: {parseFloat(formatUnits(toBalance, toToken.decimals)).toFixed(4)}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <select
                      value={toToken.address}
                      onChange={(e) => {
                        const token = MOCK_TOKENS.find(t => t.address === e.target.value);
                        if (token) setToToken(token);
                      }}
                      className="appearance-none bg-accent/10 border border-accent/20 rounded px-3 py-2 pr-8 text-sm font-medium text-accent cursor-pointer hover:bg-accent/20 transition-colors"
                    >
                      {MOCK_TOKENS.map((token) => (
                        <option key={token.address} value={token.address}>
                          {token.symbol}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-accent pointer-events-none" />
                  </div>
                  <Input
                    type="number"
                    placeholder="0.00"
                    value={toAmount}
                    onChange={(e) => setToAmount(e.target.value)}
                    className="flex-1 text-right text-xl font-bold bg-transparent border-0 focus:ring-0 p-0"
                  />
                </div>
              </div>

              {/* Trade Info */}
              {fromAmount && toAmount && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="rounded border border-primary/10 bg-primary/5 p-3 space-y-2"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">RATE</span>
                    <span className="font-medium">
                      1 {fromToken.symbol} = {(parseFloat(toAmount) / parseFloat(fromAmount)).toFixed(6)} {toToken.symbol}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">MIN_RECEIVED</span>
                    <span className="font-medium">
                      {(parseFloat(toAmount) * (1 - parseFloat(slippage) / 100)).toFixed(6)} {toToken.symbol}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">SLIPPAGE</span>
                    <span className="text-accent font-medium">{slippage}%</span>
                  </div>
                </motion.div>
              )}

              {/* Action Button */}
              <div className="pt-2">
                {!isConnected ? (
                  <Button className="w-full" size="lg" disabled>
                    CONNECT_WALLET_REQUIRED
                  </Button>
                ) : needsApproval && fromAmount ? (
                  <Button
                    className="w-full"
                    size="lg"
                    variant="outline"
                    onClick={handleApprove}
                    disabled={isPending || isConfirming}
                  >
                    {isPending || isConfirming ? (
                      <span className="flex items-center gap-2">
                        <span className="h-4 w-4 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                        APPROVING...
                      </span>
                    ) : (
                      `APPROVE_${fromToken.symbol}`
                    )}
                  </Button>
                ) : (
                  <Button
                    className="w-full"
                    size="lg"
                    variant="glow"
                    onClick={handleSwap}
                    disabled={!fromAmount || !toAmount || isPending || isConfirming}
                  >
                    {isPending || isConfirming ? (
                      <span className="flex items-center gap-2">
                        <span className="h-4 w-4 rounded-full border-2 border-primary-foreground border-t-transparent animate-spin" />
                        EXECUTING...
                      </span>
                    ) : (
                      "EXECUTE_SWAP"
                    )}
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Info Card */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="terminal-card rounded-lg p-4"
          >
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
              <AlertCircle className="h-3.5 w-3.5" />
              <span>PROTOCOL_INFO</span>
            </div>
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="space-y-1">
                <span className="text-muted-foreground">FEE_TIER</span>
                <p className="font-medium text-primary">0.30%</p>
              </div>
              <div className="space-y-1">
                <span className="text-muted-foreground">NETWORK</span>
                <p className="font-medium">SEPOLIA_TESTNET</p>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
