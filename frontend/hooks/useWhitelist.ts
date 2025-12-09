"use client";

import { useEffect, useState } from "react";
import { useAccount, useReadContract } from "wagmi";
import { useRouter } from "next/navigation";
import { WHITELIST_MANAGER_ADDRESS, WHITELIST_MANAGER_ABI } from "@/lib/contracts";

export function useWhitelist() {
  const { address, isConnected } = useAccount();
  const router = useRouter();
  const [isCheckingWhitelist, setIsCheckingWhitelist] = useState(true);

  // Check if the address is whitelisted on-chain
  const { data: isWhitelisted, isLoading, refetch } = useReadContract({
    address: WHITELIST_MANAGER_ADDRESS,
    abi: WHITELIST_MANAGER_ABI,
    functionName: "isWhitelistedAndActive",
    args: address ? [address] : undefined,
    query: {
      enabled: !!address && isConnected,
    },
  });

  useEffect(() => {
    if (isConnected && !isLoading) {
      setIsCheckingWhitelist(false);
    } else if (!isConnected) {
      setIsCheckingWhitelist(false);
    }
  }, [isConnected, isLoading]);

  return {
    isWhitelisted: isWhitelisted ?? false,
    isCheckingWhitelist: isLoading || isCheckingWhitelist,
    refetchWhitelistStatus: refetch,
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
