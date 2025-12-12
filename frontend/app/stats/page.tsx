"use client";

import { motion } from "framer-motion";
import { TrendingUp, Activity, DollarSign, Users, BarChart3, Layers } from "lucide-react";
import { useReadContract } from "wagmi";
import { formatUnits } from "viem";
import { FACTORY_ADDRESS, FACTORY_ABI, PAIR_ABI } from "@/lib/contracts";

const MOCK_TOKENS = [
  { address: "0x35287D9fDb7a1E7CC2212Fd1d57F8ae71cCA030A", symbol: "WETH", decimals: 18 },
  { address: "0x01134D4D7A522a5d601413dD3Bf33859B193063e", symbol: "USDC", decimals: 6 },
  { address: "0x64c178393Bbe0cAe2a78A19c58e9B3944c2D5B42", symbol: "DAI", decimals: 18 },
  { address: "0x5ccE1Fda0efe9A51302B3F26E3ca0d672536c2F7", symbol: "USDT", decimals: 6 },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
    },
  },
};

function StatCard({
  title,
  value,
  description,
  icon: Icon,
  trend,
  color = "primary",
}: {
  title: string;
  value: string;
  description: string;
  icon: any;
  trend?: string;
  color?: "primary" | "accent";
}) {
  return (
    <motion.div variants={itemVariants} whileHover={{ scale: 1.02 }} className="group">
      <div className="terminal-card h-full rounded-lg p-5 transition-all">
        <div className="flex items-start justify-between mb-3">
          <div className={`p-2 rounded bg-${color}/10 border border-${color}/20`}>
            <Icon className={`h-4 w-4 text-${color}`} />
          </div>
          {trend && (
            <div className="flex items-center gap-1 text-xs text-primary">
              <TrendingUp className="h-3 w-3" />
              <span>{trend}</span>
            </div>
          )}
        </div>
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">{title}</p>
          <p className={`text-2xl font-bold ${color === "primary" ? "text-primary text-glow-sm" : "text-accent"}`}>
            {value}
          </p>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
      </div>
    </motion.div>
  );
}

function PoolCard({
  tokenA,
  tokenB,
  pairAddress,
}: {
  tokenA: typeof MOCK_TOKENS[0];
  tokenB: typeof MOCK_TOKENS[0];
  pairAddress: string;
}) {
  const { data: reserves } = useReadContract({
    address: pairAddress as `0x${string}`,
    abi: PAIR_ABI,
    functionName: "getReserves",
    query: {
      enabled: pairAddress !== "0x0000000000000000000000000000000000000000",
    },
  });

  const { data: totalSupply } = useReadContract({
    address: pairAddress as `0x${string}`,
    abi: PAIR_ABI,
    functionName: "totalSupply",
    query: {
      enabled: pairAddress !== "0x0000000000000000000000000000000000000000",
    },
  });

  if (!reserves || !totalSupply) {
    return null;
  }

  const reserve0 = formatUnits(reserves[0], tokenA.decimals);
  const reserve1 = formatUnits(reserves[1], tokenB.decimals);
  const price = parseFloat(reserve1) / parseFloat(reserve0);

  return (
    <motion.div variants={itemVariants} whileHover={{ scale: 1.02 }} className="group">
      <div className="terminal-card rounded-lg overflow-hidden transition-all">
        {/* Pool Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-primary/10 bg-primary/5">
          <div className="flex items-center gap-2">
            <Layers className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium">
              {tokenA.symbol}/{tokenB.symbol}
            </span>
          </div>
          <span className="text-xs text-accent px-2 py-0.5 rounded bg-accent/10 border border-accent/20">
            0.3% FEE
          </span>
        </div>

        <div className="p-4 space-y-4">
          {/* Reserves */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <span className="text-xs text-muted-foreground">{tokenA.symbol}_RESERVE</span>
              <p className="text-lg font-bold text-primary">{parseFloat(reserve0).toFixed(2)}</p>
            </div>
            <div className="space-y-1">
              <span className="text-xs text-muted-foreground">{tokenB.symbol}_RESERVE</span>
              <p className="text-lg font-bold text-accent">{parseFloat(reserve1).toFixed(2)}</p>
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-border/50" />

          {/* Pool Info */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">PRICE</span>
              <span className="font-medium">
                1 {tokenA.symbol} = {price.toFixed(6)} {tokenB.symbol}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">LP_SUPPLY</span>
              <span className="font-medium">{parseFloat(formatUnits(totalSupply, 18)).toFixed(4)}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">TVL</span>
              <span className="font-medium text-primary">~$12,450</span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default function StatsPage() {
  const { data: allPairsLength } = useReadContract({
    address: FACTORY_ADDRESS,
    abi: FACTORY_ABI,
    functionName: "allPairsLength",
  });

  // Fetch all 4 pair addresses
  const { data: pair0 } = useReadContract({
    address: FACTORY_ADDRESS,
    abi: FACTORY_ABI,
    functionName: "getPair",
    args: [MOCK_TOKENS[0].address as `0x${string}`, MOCK_TOKENS[1].address as `0x${string}`],
  });

  const { data: pair1 } = useReadContract({
    address: FACTORY_ADDRESS,
    abi: FACTORY_ABI,
    functionName: "getPair",
    args: [MOCK_TOKENS[0].address as `0x${string}`, MOCK_TOKENS[2].address as `0x${string}`],
  });

  const { data: pair2 } = useReadContract({
    address: FACTORY_ADDRESS,
    abi: FACTORY_ABI,
    functionName: "getPair",
    args: [MOCK_TOKENS[1].address as `0x${string}`, MOCK_TOKENS[3].address as `0x${string}`],
  });

  const { data: pair3 } = useReadContract({
    address: FACTORY_ADDRESS,
    abi: FACTORY_ABI,
    functionName: "getPair",
    args: [MOCK_TOKENS[2].address as `0x${string}`, MOCK_TOKENS[3].address as `0x${string}`],
  });

  const pools = [
    { tokenA: MOCK_TOKENS[0], tokenB: MOCK_TOKENS[1], address: pair0 },
    { tokenA: MOCK_TOKENS[0], tokenB: MOCK_TOKENS[2], address: pair1 },
    { tokenA: MOCK_TOKENS[1], tokenB: MOCK_TOKENS[3], address: pair2 },
    { tokenA: MOCK_TOKENS[2], tokenB: MOCK_TOKENS[3], address: pair3 },
  ];

  const validPools = pools.filter(p => p.address && p.address !== "0x0000000000000000000000000000000000000000");

  return (
    <div className="relative min-h-[calc(100vh-8rem)]">
      {/* Background effects */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute top-0 left-1/4 h-[600px] w-[600px] rounded-full bg-primary/5 blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 h-[500px] w-[500px] rounded-full bg-accent/5 blur-[100px]" />
        <div className="grid-pattern absolute inset-0 opacity-20" />
      </div>

      <div className="container relative mx-auto px-4 py-12">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={containerVariants}
          className="space-y-8"
        >
          {/* Header */}
          <motion.div variants={itemVariants} className="text-center space-y-2">
            <div className="inline-flex items-center gap-2 text-xs text-muted-foreground">
              <BarChart3 className="h-3.5 w-3.5 text-primary" />
              <span>PROTOCOL_ANALYTICS</span>
            </div>
            <h1 className="text-3xl font-bold">
              <span className="gradient-primary">POOL_STATISTICS</span>
            </h1>
            <p className="text-sm text-muted-foreground">
              // Real-time metrics and liquidity analysis
            </p>
          </motion.div>

          {/* Stats Command Line */}
          <motion.div variants={itemVariants}>
            <div className="terminal-card rounded-lg overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-2 border-b border-primary/10 bg-primary/5">
                <span className="text-primary text-xs">$</span>
                <span className="text-xs text-muted-foreground">vault stats --overview</span>
                <span className="cursor-blink text-xs">_</span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-primary/10">
                <StatCard
                  title="TOTAL_VALUE_LOCKED"
                  value="$2.4M"
                  description="Across all pools"
                  icon={DollarSign}
                  trend="+12.5%"
                />
                <StatCard
                  title="24H_VOLUME"
                  value="$156K"
                  description="Trading volume"
                  icon={Activity}
                  trend="+8.3%"
                  color="accent"
                />
                <StatCard
                  title="ACTIVE_POOLS"
                  value={allPairsLength ? allPairsLength.toString() : "0"}
                  description="Trading pairs"
                  icon={Layers}
                />
                <StatCard
                  title="WHITELISTED"
                  value="342"
                  description="Active traders"
                  icon={Users}
                  trend="+5.2%"
                  color="accent"
                />
              </div>
            </div>
          </motion.div>

          {/* Active Pools Section */}
          <motion.div variants={itemVariants} className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold">ACTIVE_POOLS</h2>
                <p className="text-xs text-muted-foreground">
                  // Explore liquidity pools and their metrics
                </p>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground border border-border/50 rounded px-3 py-1.5 bg-muted/30">
                <div className="status-online" />
                <span>LIVE</span>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {validPools.map((pool, index) => (
                <PoolCard
                  key={index}
                  tokenA={pool.tokenA}
                  tokenB={pool.tokenB}
                  pairAddress={pool.address as string}
                />
              ))}
            </div>

            {validPools.length === 0 && (
              <motion.div variants={itemVariants}>
                <div className="terminal-card rounded-lg overflow-hidden">
                  <div className="flex items-center gap-2 px-4 py-2 border-b border-primary/10 bg-primary/5">
                    <span className="text-xs text-muted-foreground">system_message</span>
                  </div>
                  <div className="p-8 text-center space-y-4">
                    <div className="flex justify-center">
                      <div className="p-4 rounded-full bg-muted/50">
                        <Activity className="h-8 w-8 text-muted-foreground" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-lg font-bold">NO_ACTIVE_POOLS</h3>
                      <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                        // No liquidity pools detected. Be the first to initialize a pool.
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </motion.div>

          {/* Documentation Section */}
          <motion.div variants={itemVariants}>
            <div className="terminal-card rounded-lg overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-2 border-b border-primary/10 bg-primary/5">
                <span className="text-xs text-muted-foreground">vault --help metrics</span>
              </div>
              <div className="p-6 space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <h4 className="text-sm font-bold text-primary">TOTAL_VALUE_LOCKED</h4>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Aggregate value of all tokens deposited across protocol pools.
                      Indicates overall liquidity available for trading operations.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <h4 className="text-sm font-bold text-accent">TRADING_VOLUME</h4>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Total value of executed swaps in 24h window. Higher volume
                      correlates with increased fee generation for LPs.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <h4 className="text-sm font-bold text-primary">POOL_RESERVES</h4>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Token quantities held in pool smart contract. Used for
                      price computation via constant product formula (x * y = k).
                    </p>
                  </div>
                  <div className="space-y-2">
                    <h4 className="text-sm font-bold text-accent">LP_TOKENS</h4>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Proportional ownership representation of pool share.
                      Redeemable for underlying assets plus accumulated fees.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
