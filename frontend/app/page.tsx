"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Lock, Zap, TrendingUp, Shield, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useAccount } from "wagmi";
import { useWhitelist } from "@/hooks/useWhitelist";
import { useRouter } from "next/navigation";

const features = [
  {
    icon: Lock,
    title: "PERMISSIONED_ACCESS",
    description: "Whitelist-gated protocol. Only verified addresses execute trades.",
    tag: "SECURITY",
  },
  {
    icon: Zap,
    title: "ATOMIC_SWAPS",
    description: "Sub-second finality. AMM-powered price discovery with zero slippage risk.",
    tag: "PERFORMANCE",
  },
  {
    icon: TrendingUp,
    title: "LP_REWARDS",
    description: "0.3% fee accrual on every swap. Proportional distribution to providers.",
    tag: "YIELD",
  },
  {
    icon: Shield,
    title: "SOVEREIGN_CUSTODY",
    description: "Non-custodial architecture. Your keys, your tokens, always.",
    tag: "TRUST",
  },
];

const stats = [
  { label: "TOTAL_VALUE_LOCKED", value: "$2.4M", prefix: ">" },
  { label: "24H_VOLUME", value: "$156K", prefix: ">" },
  { label: "ACTIVE_PAIRS", value: "12", prefix: ">" },
  { label: "WHITELISTED", value: "342", prefix: ">" },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.2,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: [0.25, 0.46, 0.45, 0.94] as const,
    },
  },
};

export default function HomePage() {
  const { isConnected } = useAccount();
  const { isWhitelisted, isCheckingWhitelist } = useWhitelist();
  const router = useRouter();

  const handleNavigateToFeature = (path: string) => {
    if (!isConnected) {
      // Will trigger wallet connect
      return;
    }

    if (isCheckingWhitelist) {
      // Still checking, wait
      return;
    }

    if (!isWhitelisted) {
      // Redirect to whitelist page
      router.push("/whitelist");
    } else {
      // Navigate to the feature
      router.push(path);
    }
  };

  return (
    <div className="relative min-h-screen">
      {/* Atmospheric background effects */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-1/2 left-1/2 h-[800px] w-[800px] -translate-x-1/2 rounded-full bg-primary/5 blur-[120px]" />
        <div className="absolute -bottom-1/2 right-0 h-[600px] w-[600px] rounded-full bg-accent/5 blur-[100px]" />
        <div className="grid-pattern absolute inset-0 opacity-30" />
      </div>

      <div className="container relative mx-auto px-4 py-20">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={containerVariants}
          className="space-y-24"
        >
          {/* Hero Section */}
          <motion.div variants={itemVariants} className="text-center space-y-8 pt-12">
            <div className="space-y-6">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }}
                className="inline-flex items-center gap-2 rounded border border-primary/30 bg-primary/5 px-4 py-2 text-xs text-primary"
              >
                <span className="status-online" />
                <span>PROTOCOL_STATUS: ACTIVE</span>
                <span className="text-muted-foreground">// v1.0.0</span>
              </motion.div>

              <motion.h1
                className="text-6xl md:text-8xl lg:text-9xl font-bold tracking-tighter"
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1, delay: 0.2 }}
              >
                <span className="gradient-primary text-glow-sm">VΛULT</span>
              </motion.h1>

              <motion.div
                className="space-y-2"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                <p className="text-xl md:text-2xl text-muted-foreground font-light tracking-wide">
                  PRIVATE_DEX_PROTOCOL
                </p>
                <p className="text-sm md:text-base text-muted-foreground/60 max-w-xl mx-auto">
                  Permissioned liquidity infrastructure for institutional-grade
                  token exchange. Zero trust. Maximum sovereignty.
                </p>
              </motion.div>
            </div>

            <motion.div
              className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4"
              variants={itemVariants}
            >
              {isConnected ? (
                <Button
                  size="lg"
                  variant="glow"
                  className="group gap-3 text-sm"
                  onClick={() => handleNavigateToFeature("/swap")}
                  disabled={isCheckingWhitelist}
                >
                  <span>{isCheckingWhitelist ? "CHECKING_ACCESS..." : "INITIALIZE_SWAP"}</span>
                  {!isCheckingWhitelist && (
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  )}
                </Button>
              ) : (
                <ConnectButton.Custom>
                  {({ openConnectModal }) => (
                    <Button
                      size="lg"
                      variant="glow"
                      onClick={openConnectModal}
                      className="group gap-3 text-sm"
                    >
                      <span>CONNECT_WALLET</span>
                      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </Button>
                  )}
                </ConnectButton.Custom>
              )}
              <Button
                size="lg"
                variant="outline"
                className="gap-2 text-sm"
                onClick={() => handleNavigateToFeature("/liquidity")}
                disabled={!isConnected || isCheckingWhitelist}
              >
                {isCheckingWhitelist ? "CHECKING_ACCESS..." : "PROVIDE_LIQUIDITY"}
              </Button>
            </motion.div>
          </motion.div>

          {/* Stats Bar */}
          <motion.div variants={itemVariants}>
            <div className="terminal-card rounded-lg p-1">
              <div className="flex items-center gap-2 px-4 py-2 border-b border-primary/10 text-xs text-muted-foreground">
                <span className="text-primary">$</span>
                <span>vault --stats --realtime</span>
                <span className="cursor-blink ml-1">_</span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-primary/10">
                {stats.map((stat, index) => (
                  <motion.div
                    key={stat.label}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 + index * 0.1 }}
                    className="p-4 md:p-6 space-y-1"
                  >
                    <div className="text-xs text-muted-foreground font-medium">
                      {stat.prefix} {stat.label}
                    </div>
                    <div className="text-2xl md:text-3xl font-bold text-primary text-glow-sm">
                      {stat.value}
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Features Grid */}
          <motion.div variants={itemVariants}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {features.map((feature, index) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.8 + index * 0.1 }}
                  whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
                  className="group"
                >
                  <div className="terminal-card h-full rounded-lg p-6 transition-all">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded bg-primary/10 border border-primary/20 group-hover:bg-primary/20 transition-colors">
                        <feature.icon className="h-5 w-5 text-primary" />
                      </div>
                      <span className="text-[10px] font-medium text-accent px-2 py-1 rounded bg-accent/10 border border-accent/20">
                        {feature.tag}
                      </span>
                    </div>
                    <h3 className="text-sm font-bold mb-2 text-foreground group-hover:text-primary transition-colors">
                      {feature.title}
                    </h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* How It Works */}
          <motion.div variants={itemVariants} className="space-y-8">
            <div className="text-center space-y-2">
              <h2 className="text-2xl md:text-3xl font-bold">PROTOCOL_FLOW</h2>
              <p className="text-sm text-muted-foreground">
                // Automated Market Maker with constant product formula
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                {
                  step: "01",
                  title: "AUTHENTICATE",
                  description: "Connect whitelisted wallet address to protocol interface",
                  code: "wallet.connect()",
                },
                {
                  step: "02",
                  title: "CONFIGURE",
                  description: "Select token pair and input desired swap parameters",
                  code: "pair.configure()",
                },
                {
                  step: "03",
                  title: "EXECUTE",
                  description: "Sign transaction and receive tokens atomically",
                  code: "swap.execute()",
                },
              ].map((item, index) => (
                <motion.div
                  key={item.step}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1 + index * 0.15 }}
                  className="relative"
                >
                  <div className="terminal-card rounded-lg p-6 h-full">
                    <div className="flex items-center gap-3 mb-4">
                      <span className="text-3xl font-bold text-primary/30">{item.step}</span>
                      <ChevronRight className="h-4 w-4 text-primary/30" />
                    </div>
                    <h3 className="text-sm font-bold mb-2 text-foreground">{item.title}</h3>
                    <p className="text-xs text-muted-foreground mb-4">{item.description}</p>
                    <code className="text-xs text-primary bg-primary/5 px-2 py-1 rounded border border-primary/10">
                      {item.code}
                    </code>
                  </div>
                  {index < 2 && (
                    <div className="hidden md:block absolute top-1/2 -right-3 w-6 h-px bg-gradient-to-r from-primary/50 to-transparent" />
                  )}
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* CTA Section */}
          <motion.div variants={itemVariants}>
            <div className="terminal-card rounded-lg overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-2 border-b border-primary/10 bg-primary/5">
                <div className="flex gap-1.5">
                  <div className="h-2.5 w-2.5 rounded-full bg-destructive/60" />
                  <div className="h-2.5 w-2.5 rounded-full bg-accent/60" />
                  <div className="h-2.5 w-2.5 rounded-full bg-primary/60" />
                </div>
                <span className="text-xs text-muted-foreground ml-2">vault_terminal</span>
              </div>
              <div className="p-8 md:p-12 text-center space-y-6">
                <div className="space-y-3">
                  <h2 className="text-2xl md:text-3xl font-bold">
                    <span className="text-primary">$</span> READY_TO_TRADE
                    <span className="cursor-blink">_</span>
                  </h2>
                  <p className="text-sm text-muted-foreground max-w-md mx-auto">
                    Access permissioned liquidity pools. Connect your whitelisted
                    address and begin trading with zero trust assumptions.
                  </p>
                </div>
                <div className="flex justify-center">
                  {!isConnected && (
                    <ConnectButton.Custom>
                      {({ openConnectModal }) => (
                        <Button
                          size="lg"
                          variant="glow"
                          onClick={openConnectModal}
                          className="gap-3"
                        >
                          <span>INITIALIZE_CONNECTION</span>
                          <ArrowRight className="h-4 w-4" />
                        </Button>
                      )}
                    </ConnectButton.Custom>
                  )}
                  {isConnected && (
                    <Button
                      size="lg"
                      variant="glow"
                      className="gap-3"
                      onClick={() => handleNavigateToFeature("/swap")}
                      disabled={isCheckingWhitelist}
                    >
                      <span>{isCheckingWhitelist ? "CHECKING_ACCESS..." : "LAUNCH_TERMINAL"}</span>
                      {!isCheckingWhitelist && <ArrowRight className="h-4 w-4" />}
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
