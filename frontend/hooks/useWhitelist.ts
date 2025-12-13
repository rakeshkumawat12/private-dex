"use client";

import { useEffect, useState } from "react";
import { useAccount, useReadContract } from "wagmi";
import { useRouter } from "next/navigation";
import { WHITELIST_MANAGER_ADDRESS, WHITELIST_MANAGER_ABI } from "@/lib/contracts";

export function useWhitelist() {
  const { address, isConnected } = useAccount();
  const router = useRouter();
  const [isCheckingWhitelist, setIsCheckingWhitelist] = useState(true);
  const [hasAttemptedAutoWhitelist, setHasAttemptedAutoWhitelist] = useState(false);
  const [dbWhitelistStatus, setDbWhitelistStatus] = useState<boolean | null>(null);

  // Check if auto-whitelist is enabled
  const autoWhitelistEnabled = process.env.NEXT_PUBLIC_AUTO_WHITELIST_ENABLED === "true";

  // Check if the address is whitelisted on-chain
  const { data: isWhitelistedOnChain, isLoading, refetch } = useReadContract({
    address: WHITELIST_MANAGER_ADDRESS,
    abi: WHITELIST_MANAGER_ABI,
    functionName: "isWhitelistedAndActive",
    args: address ? [address] : undefined,
    query: {
      enabled: !!address && isConnected && !autoWhitelistEnabled, // Skip on-chain check if auto-whitelist enabled
    },
  });

  // Auto-whitelist on wallet connect (database only for demo mode)
  useEffect(() => {
    const autoWhitelist = async () => {
      if (!address || !isConnected || !autoWhitelistEnabled || hasAttemptedAutoWhitelist) return;

      try {
        setHasAttemptedAutoWhitelist(true);
        const response = await fetch("/api/whitelist/auto-approve", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ address }),
        });

        const data = await response.json();

        if (response.ok && data.isApproved) {
          console.log("✅ Auto-whitelisted:", address);
          setDbWhitelistStatus(true);
        } else {
          setDbWhitelistStatus(false);
        }
      } catch (error) {
        console.error("Auto-whitelist error:", error);
        setDbWhitelistStatus(false);
      }
    };

    autoWhitelist();
  }, [address, isConnected, autoWhitelistEnabled, hasAttemptedAutoWhitelist]);

  useEffect(() => {
    if (autoWhitelistEnabled) {
      // In demo mode, check database status
      if (isConnected && dbWhitelistStatus !== null) {
        setIsCheckingWhitelist(false);
      }
    } else {
      // In production mode, check on-chain status
      if (isConnected && !isLoading) {
        setIsCheckingWhitelist(false);
      }
    }

    if (!isConnected) {
      setIsCheckingWhitelist(false);
      setHasAttemptedAutoWhitelist(false);
      setDbWhitelistStatus(null);
    }
  }, [isConnected, isLoading, autoWhitelistEnabled, dbWhitelistStatus]);

  // Determine whitelist status based on mode
  const isWhitelisted = autoWhitelistEnabled
    ? (dbWhitelistStatus ?? false)  // Demo mode: use database status
    : (isWhitelistedOnChain ?? false); // Production mode: use on-chain status

  return {
    isWhitelisted,
    isCheckingWhitelist: isLoading || isCheckingWhitelist,
    refetchWhitelistStatus: refetch,
    autoWhitelistEnabled,
  };
}

/**
 * Hook to protect routes - redirects non-whitelisted users to whitelist request page
 * @param requireWhitelist - Whether this route requires whitelist access (default: true)
 */
export function useWhitelistProtection(requireWhitelist: boolean = true) {
  const { address, isConnected } = useAccount();
  const router = useRouter();
  const { isWhitelisted, isCheckingWhitelist } = useWhitelist();

  useEffect(() => {
    // Only enforce protection if required
    if (!requireWhitelist) return;

    // Wait until we've checked whitelist status
    if (isCheckingWhitelist) return;

    // If wallet is connected but not whitelisted, redirect to whitelist page
    if (isConnected && address && !isWhitelisted) {
      router.push("/whitelist");
    }
  }, [isConnected, address, isWhitelisted, isCheckingWhitelist, requireWhitelist, router]);

  return {
    isWhitelisted,
    isCheckingWhitelist,
    canAccessFeature: !requireWhitelist || (isConnected && isWhitelisted),
  };
}
