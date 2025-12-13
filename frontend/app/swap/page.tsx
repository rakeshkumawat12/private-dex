"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowDownUp, Settings, AlertCircle, Zap, ChevronDown } from "lucide-react";
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { parseUnits, formatUnits } from "viem";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/useToast";
import { ROUTER_ADDRESS, ROUTER_ABI, ERC20_ABI } from "@/lib/contracts";

const MOCK_TOKENS = [
  { address: "0x35287D9fDb7a1E7CC2212Fd1d57F8ae71cCA030A", symbol: "WETH", name: "Wrapped Ether", decimals: 18 },
  { address: "0x01134D4D7A522a5d601413dD3Bf33859B193063e", symbol: "USDC", name: "USD Coin", decimals: 6 },
  { address: "0x64c178393Bbe0cAe2a78A19c58e9B3944c2D5B42", symbol: "DAI", name: "Dai Stablecoin", decimals: 18 },
  { address: "0x5ccE1Fda0efe9A51302B3F26E3ca0d672536c2F7", symbol: "USDT", name: "Tether USD", decimals: 6 },
];

export default function SwapPage() {
  const { address, isConnected } = useAccount();
  const { toast } = useToast();

  const [fromToken, setFromToken] = useState(MOCK_TOKENS[0]);
  const [toToken, setToToken] = useState(MOCK_TOKENS[1]);
  const [fromAmount, setFromAmount] = useState("");
  const [toAmount, setToAmount] = useState("");
  const [slippage, setSlippage] = useState("0.5");
  const [showSettings, setShowSettings] = useState(false);
  const [approvingToken, setApprovingToken] = useState(false);

  const { writeContract, data: hash, isPending, error: writeError } = useWriteContract();
  const { isLoading: isConfirming, isSuccess, isError: txError } = useWaitForTransactionReceipt({ hash });

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

  // Get pair address from factory
  const { data: pairAddress } = useReadContract({
    address: process.env.NEXT_PUBLIC_FACTORY_ADDRESS as `0x${string}`,
    abi: [
      {
        inputs: [
          { internalType: "address", name: "tokenA", type: "address" },
          { internalType: "address", name: "tokenB", type: "address" }
        ],
        name: "getPair",
        outputs: [{ internalType: "address", name: "pair", type: "address" }],
        stateMutability: "view",
        type: "function"
      }
    ] as const,
    functionName: "getPair",
    args: [fromToken.address as `0x${string}`, toToken.address as `0x${string}`],
  });

  // Get reserves from pair
  const { data: reserves } = useReadContract({
    address: pairAddress && pairAddress !== "0x0000000000000000000000000000000000000000"
      ? pairAddress
      : undefined,
    abi: [
      {
        inputs: [],
        name: "getReserves",
        outputs: [
          { internalType: "uint112", name: "reserve0", type: "uint112" },
          { internalType: "uint112", name: "reserve1", type: "uint112" },
          { internalType: "uint32", name: "blockTimestampLast", type: "uint32" }
        ],
        stateMutability: "view",
        type: "function"
      },
      {
        inputs: [],
        name: "token0",
        outputs: [{ internalType: "address", name: "", type: "address" }],
        stateMutability: "view",
        type: "function"
      }
    ] as const,
    functionName: "getReserves",
  });

  // Get token0 address to determine reserve order
  const { data: token0Address } = useReadContract({
    address: pairAddress && pairAddress !== "0x0000000000000000000000000000000000000000"
      ? pairAddress
      : undefined,
    abi: [
      {
        inputs: [],
        name: "token0",
        outputs: [{ internalType: "address", name: "", type: "address" }],
        stateMutability: "view",
        type: "function"
      }
    ] as const,
    functionName: "token0",
  });

  // Calculate output amount
  useEffect(() => {
    if (!fromAmount || parseFloat(fromAmount) === 0) {
      setToAmount("");
      return;
    }

    if (reserves && token0Address && fromAmount) {
      try {
        const amountIn = parseUnits(fromAmount, fromToken.decimals);
        const [reserve0, reserve1] = reserves;

        // Determine which reserve is which based on token0
        const isToken0 = fromToken.address.toLowerCase() === token0Address.toLowerCase();
        const reserveIn = isToken0 ? reserve0 : reserve1;
        const reserveOut = isToken0 ? reserve1 : reserve0;

        // Calculate output using AMM formula: (amountIn * 997 * reserveOut) / (reserveIn * 1000 + amountIn * 997)
        const amountInWithFee = amountIn * BigInt(997);
        const numerator = amountInWithFee * BigInt(reserveOut);
        const denominator = BigInt(reserveIn) * BigInt(1000) + amountInWithFee;
        const amountOut = numerator / denominator;

        setToAmount(formatUnits(amountOut, toToken.decimals));
      } catch (error) {
        console.error("Error calculating output:", error);
        setToAmount("");
      }
    } else {
      setToAmount("");
    }
  }, [fromAmount, reserves, token0Address, fromToken, toToken]);

  useEffect(() => {
    if (isSuccess && hash) {
      if (approvingToken) {
        // Approval completed, auto-trigger swap
        setApprovingToken(false);
        toast({
          title: "✅ TOKEN_APPROVED",
          description: `${fromToken.symbol} approved! Executing swap...`,
          variant: "success",
        });
        setTimeout(() => handleApproveAndSwap(), 1000);
      } else {
        // Swap completed
        toast({
          title: "✅ SWAP_EXECUTED",
          description: `${fromAmount} ${fromToken.symbol} → ${toAmount} ${toToken.symbol}`,
          variant: "success",
        });
        setFromAmount("");
        setToAmount("");
        setApprovingToken(false);
      }
    }
  }, [isSuccess, hash, fromAmount, toAmount, fromToken.symbol, toToken.symbol, toast, approvingToken]);

  useEffect(() => {
    if (txError) {
      toast({
        title: "❌ SWAP_FAILED",
        description: "Transaction failed. Please check your wallet and try again.",
        variant: "error",
      });
      setApprovingToken(false);
    }
  }, [txError, toast]);

  useEffect(() => {
    if (writeError) {
      toast({
        title: "❌ TRANSACTION_REJECTED",
        description: writeError.message || "User rejected the transaction",
        variant: "error",
      });
      setApprovingToken(false);
    }
  }, [writeError, toast]);

  const handleSwapTokens = () => {
    const temp = fromToken;
    setFromToken(toToken);
    setToToken(temp);
    setFromAmount(toAmount);
    setToAmount(fromAmount);
  };

  const handleApproveAndSwap = async () => {
    if (!fromAmount || !toAmount || !isConnected || isPending || isConfirming) return;

    try {
      // Step 1: Approve token if needed (and not already approving)
      if (needsApproval && !approvingToken) {
        setApprovingToken(true);
        // Approve max amount to avoid repeated approvals
        const maxApproval = BigInt("0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff");

        writeContract({
          address: fromToken.address as `0x${string}`,
          abi: ERC20_ABI,
          functionName: "approve",
          args: [ROUTER_ADDRESS, maxApproval],
          gas: BigInt(100000),
        });

        toast({
          title: "⏳ STEP 1/2",
          description: `Approving ${fromToken.symbol}...`,
        });
        return;
      }

      // Step 2: Execute swap (only if not currently approving)
      if (!approvingToken) {
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
          gas: BigInt(300000),
        });

        toast({
          title: "⏳ STEP 2/2",
          description: `Swapping ${fromAmount} ${fromToken.symbol} for ${toToken.symbol}...`,
        });
      }
    } catch (error: any) {
      toast({
        title: "❌ TRANSACTION_FAILED",
        description: error.message || "Failed to execute swap",
        variant: "error",
      });
      setApprovingToken(false);
    }
  };

  const handleApprove = async () => {
    if (!fromAmount || !isConnected) return;

    try {
      // Approve max amount to avoid repeated approvals
      const maxApproval = BigInt("0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff");

      writeContract({
        address: fromToken.address as `0x${string}`,
        abi: ERC20_ABI,
        functionName: "approve",
        args: [ROUTER_ADDRESS, maxApproval],
        gas: BigInt(100000),
      });

      toast({
        title: "⏳ APPROVAL_PENDING",
        description: `Approving ${fromToken.symbol}...`,
      });
    } catch (error: any) {
      toast({
        title: "❌ APPROVAL_FAILED",
        description: error.message || "Failed to approve token",
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
        gas: BigInt(300000),
      });

      toast({
        title: "⏳ SWAP_PENDING",
        description: `Swapping ${fromAmount} ${fromToken.symbol} for ${toToken.symbol}...`,
      });
    } catch (error: any) {
      toast({
        title: "❌ SWAP_FAILED",
        description: error.message || "Failed to execute swap",
        variant: "error",
      });
    }
  };

  const needsApproval = allowance !== undefined && fromAmount
    ? allowance < parseUnits(fromAmount, fromToken.decimals)
    : true;

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
                    readOnly
                    className="flex-1 text-right text-xl font-bold bg-transparent border-0 focus:ring-0 p-0 cursor-not-allowed"
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
                ) : (
                  <Button
                    className="w-full"
                    size="lg"
                    variant="glow"
                    onClick={handleApproveAndSwap}
                    disabled={!fromAmount || !toAmount || isPending || isConfirming}
                  >
                    {isPending || isConfirming ? (
                      <span className="flex items-center gap-2">
                        <span className="h-4 w-4 rounded-full border-2 border-primary-foreground border-t-transparent animate-spin" />
                        {approvingToken ? `STEP 1/2: APPROVING ${fromToken.symbol}...` : "STEP 2/2: EXECUTING SWAP..."}
                      </span>
                    ) : (
                      needsApproval ? `APPROVE & SWAP` : "EXECUTE_SWAP"
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
