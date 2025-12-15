"use client";

import { useState } from "react";
import { Info, X } from "lucide-react";

export function DemoBanner() {
  const [isVisible, setIsVisible] = useState(true);
  const autoWhitelistEnabled = process.env.NEXT_PUBLIC_AUTO_WHITELIST_ENABLED === "true";

  if (!autoWhitelistEnabled || !isVisible) return null;

  return (
    <div className="w-full relative overflow-hidden border-b border-primary/10 bg-gradient-to-r from-primary/5 via-accent/5 to-primary/5">
      {/* Animated grid pattern background */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,oklch(0.75_0.2_145/0.03)_1px,transparent_1px),linear-gradient(to_bottom,oklch(0.75_0.2_145/0.03)_1px,transparent_1px)] bg-[size:24px_24px]" />
      </div>

      <div className="container mx-auto px-4 py-3 relative">
        <div className="flex items-center justify-center gap-3 text-sm">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10 border border-primary/20">
            <Info className="h-4 w-4 text-primary" />
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <span className="font-mono font-bold text-primary">DEMO_MODE:</span>
            <span className="hidden sm:inline">All wallets auto-whitelisted</span>
            <span className="text-primary/40">•</span>
            <span>Connect any wallet to explore</span>
          </div>

          {/* Close button */}
          <button
            onClick={() => setIsVisible(false)}
            className="cursor-pointer ml-auto p-1.5 rounded-lg hover:bg-primary/10 border border-transparent hover:border-primary/20 transition-colors group"
            aria-label="Close banner"
          >
            <X className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
          </button>
        </div>
      </div>
    </div>
  );
}
