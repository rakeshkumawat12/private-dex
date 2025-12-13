"use client";

import Link from "next/link";
import { Github, Twitter, FileText, Terminal } from "lucide-react";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="relative border-t border-primary/10 bg-background/80 backdrop-blur-sm">
      <div className="absolute inset-0 grid-pattern opacity-10" />
      <div className="container relative mx-auto px-4 py-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded bg-primary/10 border border-primary/20">
                <Terminal className="h-4 w-4 text-primary" />
              </div>
              <span className="text-lg font-bold text-primary">VΛULT</span>
            </div>
            <p className="text-xs text-muted-foreground max-w-xs leading-relaxed">
              // Permissioned DEX protocol with AMM-powered liquidity.
              Zero trust architecture. Maximum sovereignty.
            </p>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <div className="status-online" />
              <span>PROTOCOL_ACTIVE</span>
            </div>
          </div>

          {/* Navigation */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold text-muted-foreground">NAVIGATION</h4>
            <ul className="space-y-2">
              {[
                { name: "SWAP", href: "/swap" },
                { name: "LIQUIDITY", href: "/liquidity" },
                { name: "STATS", href: "/stats" },
                { name: "FAUCET", href: "/faucet" },
                { name: "WHITELIST", href: "/whitelist" },
              ].map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="group flex items-center gap-2 text-xs text-muted-foreground hover:text-primary transition-colors"
                  >
                    <span className="text-primary/50 group-hover:text-primary">{">"}</span>
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Connect */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold text-muted-foreground">CONNECT</h4>
            <div className="flex gap-3">
              {[
                { icon: Github, href: "https://github.com", label: "Github" },
                { icon: Twitter, href: "https://twitter.com", label: "Twitter" },
                { icon: FileText, href: "/docs", label: "Docs" },
              ].map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  target={social.href.startsWith("http") ? "_blank" : undefined}
                  rel={social.href.startsWith("http") ? "noopener noreferrer" : undefined}
                  className="group flex h-9 w-9 items-center justify-center rounded border border-border/50 bg-muted/30 text-muted-foreground transition-all hover:border-primary/50 hover:bg-primary/10 hover:text-primary"
                  aria-label={social.label}
                >
                  <social.icon className="h-4 w-4" />
                </a>
              ))}
            </div>
            <div className="text-xs text-muted-foreground space-y-1">
              <p>// Built with Solidity + Next.js</p>
              <p>// Powered by Ethereum</p>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-8 pt-6 border-t border-primary/10 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs text-muted-foreground">
            <span className="text-primary">$</span> {currentYear} VΛULT Protocol. All rights reserved.
          </p>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span>v1.0.0</span>
            <span className="text-primary/30">|</span>
            <span>SEPOLIA_TESTNET</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
