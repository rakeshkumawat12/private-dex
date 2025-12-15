"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Plus, Minus, AlertCircle, Droplets, ChevronDown, Layers } from "lucide-react";
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { parseUnits, formatUnits } from "viem";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/useToast";
import { ROUTER_ADDRESS, ROUTER_ABI, ERC20_ABI, FACTORY_ABI, PAIR_ABI, FACTORY_ADDRESS } from "@/lib/contracts";

const MOCK_TOKENS = [
  { address: "0x35287D9fDb7a1E7CC2212Fd1d57F8ae71cCA030A", symbol: "WETH", name: "Wrapped Ether", decimals: 18 },
  { address: "0x01134D4D7A522a5d601413dD3Bf33859B193063e", symbol: "USDC", name: "USD Coin", decimals: 6 },
  { address: "0x64c178393Bbe0cAe2a78A19c58e9B3944c2D5B42", symbol: "DAI", name: "Dai Stablecoin", decimals: 18 },
  { address: "0x5ccE1Fda0efe9A51302B3F26E3ca0d672536c2F7", symbol: "USDT", name: "Tether USD", decimals: 6 },
];

export default function LiquidityPage() {
  const { address, isConnected } = useAccount();
  const { toast } = useToast();

  const [mode, setMode] = useState<"add" | "remove">("add");
  const [tokenA, setTokenA] = useState(MOCK_TOKENS[0]);
  const [tokenB, setTokenB] = useState(MOCK_TOKENS[1]);
  const [amountA, setAmountA] = useState("");
  const [amountB, setAmountB] = useState("");
  const [lpAmount, setLpAmount] = useState("");
  const [liquidityStep, setLiquidityStep] = useState<"idle" | "transfer_a" | "transfer_b" | "transfer_lp" | "executing">("idle");

  const { writeContract, data: hash, isPending, error: writeError, reset: resetWrite } = useWriteContract();
  const { isLoading: isConfirming, isSuccess, isError: txError } = useWaitForTransactionReceipt({ hash });

  const { data: pairAddress } = useReadContract({
    address: FACTORY_ADDRESS,
    abi: FACTORY_ABI,
    functionName: "getPair",
    args: [tokenA.address as `0x${string}`, tokenB.address as `0x${string}`],
  });

  const { data: lpBalance, refetch: refetchLpBalance } = useReadContract({
    address: pairAddress as `0x${string}`,
    abi: PAIR_ABI,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: {
      enabled: !!pairAddress && pairAddress !== "0x0000000000000000000000000000000000000000",
    },
  });

  const { data: reserves } = useReadContract({
    address: pairAddress as `0x${string}`,
    abi: PAIR_ABI,
    functionName: "getReserves",
    query: {
      enabled: !!pairAddress && pairAddress !== "0x0000000000000000000000000000000000000000",
    },
  });

  const { data: token0Address } = useReadContract({
    address: pairAddress as `0x${string}`,
    abi: PAIR_ABI,
    functionName: "token0",
    query: {
      enabled: !!pairAddress && pairAddress !== "0x0000000000000000000000000000000000000000",
    },
  });

  // Auto-calculate amountB based on pool ratio when amountA changes
  useEffect(() => {
    if (mode === "add" && reserves && token0Address && amountA && parseFloat(amountA) > 0) {
      try {
        const [reserve0, reserve1] = reserves;

        // Skip if pool is empty (no reserves)
        if (reserve0 === BigInt(0) || reserve1 === BigInt(0)) {
          return;
        }

        const isToken0 = tokenA.address.toLowerCase() === token0Address.toLowerCase();
        const reserveA = isToken0 ? reserve0 : reserve1;
        const reserveB = isToken0 ? reserve1 : reserve0;

        // Calculate optimal amountB: amountB = (amountA * reserveB) / reserveA
        const amountABigInt = parseUnits(amountA, tokenA.decimals);
        const optimalAmountB = (amountABigInt * reserveB) / reserveA;

        setAmountB(formatUnits(optimalAmountB, tokenB.decimals));
      } catch (error) {
        console.error("Error calculating optimal amount:", error);
      }
    }
  }, [amountA, reserves, token0Address, tokenA, tokenB, mode]);

  // Handle transaction success - Multi-step flow
  useEffect(() => {
    if (isSuccess && hash) {
      const pending = (window as any).pendingLiquidity;

      if (!pending) {
        // Final success after router call
        if (mode === "add") {
          toast({
            title: "✅ LIQUIDITY_ADDED",
            description: `Successfully added liquidity!`,
            variant: "success",
          });
          setAmountA("");
          setAmountB("");
        } else {
          toast({
            title: "✅ LIQUIDITY_REMOVED",
            description: `Successfully removed liquidity!`,
            variant: "success",
          });
          setLpAmount("");
        }
        setLiquidityStep("idle");
        refetchLpBalance();
        setTimeout(() => resetWrite(), 2000);
        return;
      }

      // Handle step transitions
      if (liquidityStep === "transfer_a") {
        // Token A transferred, now transfer Token B
        toast({
          title: "✅ TOKEN_A_TRANSFERRED",
          description: `Step 2/3: Transferring ${pending.amountB} ${pending.tokenBSymbol}...`,
        });
        setLiquidityStep("transfer_b");
        setTimeout(() => {
          writeContract({
            address: pending.tokenBAddress as `0x${string}`,
            abi: ERC20_ABI,
            functionName: "transfer",
            args: [ROUTER_ADDRESS, pending.amountBDesired],
          });
        }, 1500);
      } else if (liquidityStep === "transfer_b") {
        // Both tokens transferred, now call addLiquidity
        toast({
          title: "✅ TOKENS_TRANSFERRED",
          description: `Step 3/3: Adding liquidity...`,
        });
        setLiquidityStep("executing");
        setTimeout(() => {
          writeContract({
            address: ROUTER_ADDRESS,
            abi: ROUTER_ABI,
            functionName: "addLiquidity",
            args: [
              pending.tokenAAddress as `0x${string}`,
              pending.tokenBAddress as `0x${string}`,
              pending.amountADesired,
              pending.amountBDesired,
              pending.amountAMin,
              pending.amountBMin,
              address as `0x${string}`,
              pending.deadline,
            ],
          });
          delete (window as any).pendingLiquidity;
        }, 1500);
      } else if (liquidityStep === "transfer_lp") {
        // LP tokens transferred, now call removeLiquidity
        toast({
          title: "✅ LP_TOKENS_TRANSFERRED",
          description: `Step 2/2: Removing liquidity...`,
        });
        setLiquidityStep("executing");
        setTimeout(() => {
          writeContract({
            address: ROUTER_ADDRESS,
            abi: ROUTER_ABI,
            functionName: "removeLiquidity",
            args: [
              pending.tokenAAddress as `0x${string}`,
              pending.tokenBAddress as `0x${string}`,
              pending.liquidity,
              pending.amountAMin,
              pending.amountBMin,
              address as `0x${string}`,
              pending.deadline,
            ],
          });
          delete (window as any).pendingLiquidity;
        }, 1500);
      }
    }
  }, [isSuccess, hash, liquidityStep, mode, address, toast, refetchLpBalance, resetWrite]);

  // Handle transaction errors
  useEffect(() => {
    if (txError || writeError) {
      const errorMessage = writeError?.message || "Transaction failed. Please try again.";

      toast({
        title: mode === "add" ? "❌ ADD_LIQUIDITY_FAILED" : "❌ REMOVE_LIQUIDITY_FAILED",
        description: errorMessage.includes("rejected") || errorMessage.includes("denied")
          ? "Transaction rejected by user"
          : "Transaction failed. Please check your wallet and try again.",
        variant: "error",
      });

      resetWrite();
    }
  }, [txError, writeError, mode, toast, resetWrite]);

  const handleAddLiquidity = async () => {
    if (!amountA || !amountB || !isConnected || isPending || isConfirming) return;

    try {
      const amountADesired = parseUnits(amountA, tokenA.decimals);
      const amountBDesired = parseUnits(amountB, tokenB.decimals);
      const amountAMin = (amountADesired * BigInt(98)) / BigInt(100);
      const amountBMin = (amountBDesired * BigInt(98)) / BigInt(100);
      const deadline = BigInt(Math.floor(Date.now() / 1000) + 3600);

      // Store parameters for later steps
      (window as any).pendingLiquidity = {
        mode: "add",
        amountADesired,
        amountBDesired,
        amountAMin,
        amountBMin,
        deadline,
        amountA,
        amountB,
        tokenASymbol: tokenA.symbol,
        tokenBSymbol: tokenB.symbol,
        tokenAAddress: tokenA.address,
        tokenBAddress: tokenB.address,
      };

      // Step 1: Transfer Token A to Router
      setLiquidityStep("transfer_a");
      writeContract({
        address: tokenA.address as `0x${string}`,
        abi: ERC20_ABI,
        functionName: "transfer",
        args: [ROUTER_ADDRESS, amountADesired],
      });

      toast({
        title: "⏳ TRANSFERRING_TOKENS",
        description: `Step 1/3: Transferring ${amountA} ${tokenA.symbol} to Router...`,
      });
    } catch (error: any) {
      console.error("Add liquidity error:", error);
      setLiquidityStep("idle");
      toast({
        title: "❌ ADD_LIQUIDITY_FAILED",
        description: error.message || "Failed to add liquidity",
        variant: "error",
      });
    }
  };

  const handleRemoveLiquidity = async () => {
    if (!lpAmount || !isConnected || !pairAddress || isPending || isConfirming) return;

    try {
      const liquidity = parseUnits(lpAmount, 18);
      const amountAMin = BigInt(0);
      const amountBMin = BigInt(0);
      const deadline = BigInt(Math.floor(Date.now() / 1000) + 3600);

      // Store parameters for later steps
      (window as any).pendingLiquidity = {
        mode: "remove",
        liquidity,
        amountAMin,
        amountBMin,
        deadline,
        lpAmount,
        tokenAAddress: tokenA.address,
        tokenBAddress: tokenB.address,
        pairAddress,
      };

      // Step 1: Transfer LP tokens to Router
      setLiquidityStep("transfer_lp");
      writeContract({
        address: pairAddress as `0x${string}`,
        abi: ERC20_ABI,
        functionName: "transfer",
        args: [ROUTER_ADDRESS, liquidity],
      });

      toast({
        title: "⏳ TRANSFERRING_LP_TOKENS",
        description: `Step 1/2: Transferring ${lpAmount} LP tokens to Router...`,
      });
    } catch (error: any) {
      console.error("Remove liquidity error:", error);
      setLiquidityStep("idle");
      toast({
        title: "❌ REMOVE_FAILED",
        description: error.message || "Failed to remove liquidity",
        variant: "error",
      });
    }
  };

  return (
    <div className="relative min-h-[calc(100vh-8rem)]">
      {/* Background effects */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 right-1/4 h-[500px] w-[500px] rounded-full bg-primary/5 blur-[100px]" />
        <div className="absolute bottom-1/4 left-1/4 h-[400px] w-[400px] rounded-full bg-accent/5 blur-[80px]" />
        <div className="grid-pattern absolute inset-0 opacity-20" />
      </div>

      <div className="container relative mx-auto px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-2xl mx-auto space-y-6"
        >
          {/* Header */}
          <div className="text-center space-y-2">
            <div className="inline-flex items-center gap-2 text-xs text-muted-foreground">
              <Droplets className="h-3.5 w-3.5 text-primary" />
              <span>LIQUIDITY_POOLS</span>
            </div>
            <h1 className="text-3xl font-bold">
              <span className="gradient-primary">PROVIDE_LIQUIDITY</span>
            </h1>
            <p className="text-sm text-muted-foreground">
              // Deposit tokens to earn 0.3% trading fees
            </p>
          </div>

          {/* Mode Toggle */}
          <div className="terminal-card rounded-lg p-1 flex">
            <button
              onClick={() => setMode("add")}
              className={`cursor-pointer flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium rounded transition-all ${
                mode === "add"
                  ? "bg-primary/10 text-primary border border-primary/20"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Plus className="h-4 w-4" />
              ADD_LIQUIDITY
            </button>
            <button
              onClick={() => setMode("remove")}
              className={`cursor-pointer flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium rounded transition-all ${
                mode === "remove"
                  ? "bg-destructive/10 text-destructive border border-destructive/20"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Minus className="h-4 w-4" />
              REMOVE_LIQUIDITY
            </button>
          </div>

          {/* Main Card */}
          <div className="terminal-card rounded-lg overflow-hidden">
            {/* Terminal Header */}
            <div className="flex items-center gap-2 px-4 py-3 border-b border-primary/10 bg-primary/5">
              <div className="flex gap-1.5">
                <div className="h-2.5 w-2.5 rounded-full bg-destructive/60" />
                <div className="h-2.5 w-2.5 rounded-full bg-accent/60" />
                <div className="h-2.5 w-2.5 rounded-full bg-primary/60" />
              </div>
              <span className="text-xs text-muted-foreground ml-2">
                {mode === "add" ? "add_liquidity" : "remove_liquidity"}
              </span>
            </div>

            {mode === "add" ? (
              <div className="p-4 space-y-4">
                {/* Token A */}
                <div className="rounded border border-border/50 bg-muted/30 p-4 space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">TOKEN_A</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <select
                        value={tokenA.address}
                        onChange={(e) => {
                          const token = MOCK_TOKENS.find(t => t.address === e.target.value);
                          if (token) setTokenA(token);
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
                      value={amountA}
                      onChange={(e) => setAmountA(e.target.value)}
                      className="flex-1 text-right text-xl font-bold bg-transparent border-0 focus:ring-0 p-0"
                    />
                  </div>
                </div>

                {/* Plus icon */}
                <div className="flex justify-center">
                  <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
                    <Plus className="h-4 w-4 text-primary" />
                  </div>
                </div>

                {/* Token B */}
                <div className="rounded border border-border/50 bg-muted/30 p-4 space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">TOKEN_B</span>
                    {reserves && reserves[0] !== BigInt(0) && reserves[1] !== BigInt(0) && (
                      <span className="text-primary text-[10px]">AUTO_CALCULATED</span>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <select
                        value={tokenB.address}
                        onChange={(e) => {
                          const token = MOCK_TOKENS.find(t => t.address === e.target.value);
                          if (token) setTokenB(token);
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
                      value={amountB}
                      onChange={(e) => setAmountB(e.target.value)}
                      readOnly={!!(reserves && reserves[0] !== BigInt(0) && reserves[1] !== BigInt(0))}
                      className={`flex-1 text-right text-xl font-bold bg-transparent border-0 focus:ring-0 p-0 ${
                        reserves && reserves[0] !== BigInt(0) && reserves[1] !== BigInt(0) ? 'cursor-not-allowed' : ''
                      }`}
                    />
                  </div>
                </div>

                {/* Pool Reserves */}
                {reserves && token0Address && (
                  <div className="rounded border border-primary/10 bg-primary/5 p-4 space-y-3">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Layers className="h-3.5 w-3.5" />
                      <span>POOL_RESERVES</span>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground text-xs">{tokenA.symbol}</span>
                        <p className="font-medium">
                          {parseFloat(
                            formatUnits(
                              tokenA.address.toLowerCase() === token0Address.toLowerCase() ? reserves[0] : reserves[1],
                              tokenA.decimals
                            )
                          ).toFixed(4)}
                        </p>
                      </div>
                      <div>
                        <span className="text-muted-foreground text-xs">{tokenB.symbol}</span>
                        <p className="font-medium">
                          {parseFloat(
                            formatUnits(
                              tokenA.address.toLowerCase() === token0Address.toLowerCase() ? reserves[1] : reserves[0],
                              tokenB.decimals
                            )
                          ).toFixed(4)}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Add Liquidity Button */}
                {!isConnected ? (
                  <Button className="w-full" size="lg" disabled>
                    CONNECT_WALLET_REQUIRED
                  </Button>
                ) : (
                  <Button
                    className="w-full"
                    size="lg"
                    variant="glow"
                    onClick={handleAddLiquidity}
                    disabled={!amountA || !amountB || isPending || isConfirming}
                  >
                    {isPending || isConfirming ? (
                      <span className="flex items-center gap-2">
                        <span className="h-4 w-4 rounded-full border-2 border-primary-foreground border-t-transparent animate-spin" />
                        ADDING_LIQUIDITY...
                      </span>
                    ) : (
                      "ADD_LIQUIDITY"
                    )}
                  </Button>
                )}
              </div>
            ) : (
              <div className="p-4 space-y-4">
                {/* LP Token Amount */}
                <div className="rounded border border-border/50 bg-muted/30 p-4 space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">LP_TOKENS</span>
                    {lpBalance !== undefined && (
                      <button
                        onClick={() => setLpAmount(formatUnits(lpBalance, 18))}
                        className="cursor-pointer text-muted-foreground hover:text-primary transition-colors"
                      >
                        BAL: {parseFloat(formatUnits(lpBalance, 18)).toFixed(6)}
                      </button>
                    )}
                  </div>
                  <Input
                    type="number"
                    placeholder="0.00"
                    value={lpAmount}
                    onChange={(e) => setLpAmount(e.target.value)}
                    className="text-xl font-bold bg-transparent border-0 focus:ring-0 p-0"
                  />
                </div>

                {/* Pair Info */}
                <div className="rounded border border-border/50 bg-muted/30 p-4">
                  <div className="text-xs text-muted-foreground mb-2">PAIR</div>
                  <p className="text-sm font-medium">
                    {tokenA.symbol} / {tokenB.symbol}
                  </p>
                </div>

                {!isConnected ? (
                  <Button className="w-full" size="lg" disabled>
                    CONNECT_WALLET_REQUIRED
                  </Button>
                ) : (
                  <Button
                    className="w-full"
                    size="lg"
                    variant="destructive"
                    onClick={handleRemoveLiquidity}
                    disabled={!lpAmount || isPending || isConfirming}
                  >
                    {isPending || isConfirming ? (
                      <span className="flex items-center gap-2">
                        <span className="h-4 w-4 rounded-full border-2 border-destructive-foreground border-t-transparent animate-spin" />
                        REMOVING_LIQUIDITY...
                      </span>
                    ) : (
                      "REMOVE_LIQUIDITY"
                    )}
                  </Button>
                )}
              </div>
            )}
          </div>

          {/* Your Positions */}
          {lpBalance !== undefined && lpBalance > BigInt(0) && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="terminal-card rounded-lg overflow-hidden"
            >
              <div className="flex items-center gap-2 px-4 py-3 border-b border-primary/10 bg-primary/5">
                <span className="text-xs text-muted-foreground">YOUR_POSITIONS</span>
              </div>
              <div className="p-4">
                <div className="flex items-center justify-between p-3 rounded border border-border/50 bg-muted/30">
                  <div>
                    <p className="font-medium text-sm">{tokenA.symbol} / {tokenB.symbol}</p>
                    <p className="text-xs text-muted-foreground">LP_TOKENS</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-primary">{parseFloat(formatUnits(lpBalance, 18)).toFixed(6)}</p>
                    <p className="text-xs text-muted-foreground">0.3% FEE_TIER</p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Info Card */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="terminal-card rounded-lg p-4"
          >
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
              <AlertCircle className="h-3.5 w-3.5" />
              <span>LP_INFO</span>
            </div>
            <div className="space-y-2 text-xs text-muted-foreground">
              <p>// Liquidity providers receive LP tokens proportional to their pool share</p>
              <p>// Trading fees (0.3%) are automatically accrued to LP token value</p>
              <p>// Impermanent loss may occur with volatile price movements</p>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
