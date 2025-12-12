"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Terminal, Menu, X, Activity, ShieldCheck, Shield } from "lucide-react";
import { useState } from "react";
import { useAccount } from "wagmi";
import { isAdminWallet } from "@/lib/auth";

const navItems = [
  { name: "SWAP", href: "/swap", shortcut: "F1" },
  { name: "LIQUIDITY", href: "/liquidity", shortcut: "F2" },
  { name: "STATS", href: "/stats", shortcut: "F3" },
  { name: "FAUCET", href: "/faucet", shortcut: "F4" },
  { name: "WHITELIST", href: "/whitelist", shortcut: "F5", icon: ShieldCheck },
];

export function Navbar() {
  const pathname = usePathname();
  const { address } = useAccount();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const isAdmin = address ? isAdminWallet(address) : false;

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-primary/20 bg-background/80 backdrop-blur-xl">
      <div className="container mx-auto flex h-14 items-center justify-between px-4">
        <div className="flex items-center gap-8">
          <Link href="/" className="group flex items-center gap-3">
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="relative flex h-9 w-9 items-center justify-center"
            >
              <div className="absolute inset-0 rounded bg-primary/20 blur-sm group-hover:bg-primary/30 transition-colors" />
              <Terminal className="relative h-5 w-5 text-primary" />
            </motion.div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold tracking-tight text-primary">VΛULT</span>
              <span className="hidden sm:inline-flex items-center gap-1.5 rounded border border-primary/30 bg-primary/5 px-2 py-0.5 text-[10px] text-primary/70">
                <Activity className="h-2.5 w-2.5" />
                MAINNET
              </span>
            </div>
          </Link>

          <div className="hidden md:flex md:items-center md:gap-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "group relative flex items-center gap-2 px-4 py-2 text-xs font-medium tracking-wide transition-all",
                  pathname === item.href
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <span>{item.name}</span>
                <span className="hidden lg:inline text-[10px] text-muted-foreground/50 font-normal">
                  [{item.shortcut}]
                </span>
                {pathname === item.href && (
                  <motion.div
                    layoutId="nav-active"
                    className="absolute inset-0 -z-10 rounded bg-primary/10 border border-primary/20"
                    transition={{ type: "spring", stiffness: 500, damping: 35 }}
                  />
                )}
              </Link>
            ))}
            {isAdmin && (
              <Link
                href="/admin"
                className={cn(
                  "group relative flex items-center gap-2 px-4 py-2 text-xs font-medium tracking-wide transition-all",
                  pathname === "/admin"
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Shield className="w-3.5 h-3.5" />
                <span>ADMIN</span>
                {pathname === "/admin" && (
                  <motion.div
                    layoutId="nav-active"
                    className="absolute inset-0 -z-10 rounded bg-primary/10 border border-primary/20"
                    transition={{ type: "spring", stiffness: 500, damping: 35 }}
                  />
                )}
              </Link>
            )}
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center gap-3">
            <div className="flex items-center gap-2 text-xs text-muted-foreground border border-border/50 rounded px-3 py-1.5 bg-muted/30">
              <div className="status-online" />
              <span>CONNECTED</span>
            </div>
            <ConnectButton.Custom>
              {({
                account,
                chain,
                openAccountModal,
                openChainModal,
                openConnectModal,
                mounted,
              }) => {
                const ready = mounted;
                const connected = ready && account && chain;

                return (
                  <div
                    {...(!ready && {
                      "aria-hidden": true,
                      style: {
                        opacity: 0,
                        pointerEvents: "none",
                        userSelect: "none",
                      },
                    })}
                  >
                    {(() => {
                      if (!connected) {
                        return (
                          <button
                            onClick={openConnectModal}
                            className="flex items-center gap-2 rounded border border-primary/40 bg-primary/10 px-4 py-2 text-xs font-medium text-primary transition-all hover:bg-primary/20 hover:border-primary/60 hover:shadow-[0_0_15px_rgba(0,255,136,0.15)]"
                          >
                            <Terminal className="h-3.5 w-3.5" />
                            CONNECT_WALLET
                          </button>
                        );
                      }

                      if (chain.unsupported) {
                        return (
                          <button
                            onClick={openChainModal}
                            className="flex items-center gap-2 rounded border border-destructive/40 bg-destructive/10 px-4 py-2 text-xs font-medium text-destructive"
                          >
                            WRONG_NETWORK
                          </button>
                        );
                      }

                      return (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={openChainModal}
                            className="flex items-center gap-2 rounded border border-border/50 bg-muted/30 px-3 py-2 text-xs transition-all hover:border-primary/30"
                          >
                            {chain.hasIcon && chain.iconUrl && (
                              <img
                                alt={chain.name ?? "Chain"}
                                src={chain.iconUrl}
                                className="h-4 w-4"
                              />
                            )}
                            <span className="hidden lg:inline text-muted-foreground">
                              {chain.name}
                            </span>
                          </button>

                          <button
                            onClick={openAccountModal}
                            className="flex items-center gap-2 rounded border border-primary/30 bg-primary/5 px-4 py-2 text-xs font-medium text-primary transition-all hover:bg-primary/10 hover:border-primary/50"
                          >
                            <span className="font-mono">
                              {account.displayName}
                            </span>
                            <span className="text-muted-foreground">
                              {account.displayBalance ? `// ${account.displayBalance}` : ""}
                            </span>
                          </button>
                        </div>
                      );
                    })()}
                  </div>
                );
              }}
            </ConnectButton.Custom>
          </div>

          <button
            className="md:hidden p-2 text-muted-foreground hover:text-foreground transition-colors"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </button>
        </div>
      </div>

      {mobileMenuOpen && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="border-t border-primary/10 md:hidden"
        >
          <div className="container mx-auto space-y-1 px-4 py-4">
            {navItems.map((item, index) => (
              <motion.div
                key={item.href}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Link
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    "flex items-center justify-between rounded px-4 py-3 text-sm font-medium transition-all",
                    pathname === item.href
                      ? "bg-primary/10 text-primary border border-primary/20"
                      : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                  )}
                >
                  <span>{item.name}</span>
                  <span className="text-xs text-muted-foreground/50">{item.shortcut}</span>
                </Link>
              </motion.div>
            ))}
            {isAdmin && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: navItems.length * 0.05 }}
              >
                <Link
                  href="/admin"
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    "flex items-center justify-between rounded px-4 py-3 text-sm font-medium transition-all",
                    pathname === "/admin"
                      ? "bg-primary/10 text-primary border border-primary/20"
                      : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                  )}
                >
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4" />
                    <span>ADMIN</span>
                  </div>
                </Link>
              </motion.div>
            )}
            <div className="pt-4 border-t border-border/50 mt-4">
              <ConnectButton />
            </div>
          </div>
        </motion.div>
      )}
    </nav>
  );
}
