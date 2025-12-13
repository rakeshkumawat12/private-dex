import { NextRequest, NextResponse } from "next/server";
import { whitelistDB, supabase } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    // Check if auto-whitelist is enabled
    const autoWhitelistEnabled = process.env.NEXT_PUBLIC_AUTO_WHITELIST_ENABLED === "true";

    if (!autoWhitelistEnabled) {
      return NextResponse.json(
        { error: "Auto-whitelist is disabled" },
        { status: 403 }
      );
    }

    const { address } = await request.json();

    if (!address) {
      return NextResponse.json(
        { error: "Address is required" },
        { status: 400 }
      );
    }

    // Check if already whitelisted
    const existing = await whitelistDB.getRequestByWallet(address);

    if (existing) {
      // Update status to approved if not already
      if (existing.status !== "approved") {
        await supabase
          .from("whitelist_requests")
          .update({
            status: "approved",
            reviewed_by: "auto-system",
            reviewed_at: new Date().toISOString(),
          })
          .eq("wallet_address", address.toLowerCase());
      }

      return NextResponse.json({
        success: true,
        message: "Already in system",
        status: "approved",
        isApproved: true,
      });
    }

    // Auto-approve new address - insert directly as approved
    const { error } = await supabase.from("whitelist_requests").insert({
      wallet_address: address.toLowerCase(),
      email: "auto@approved.demo",
      reason: "Auto-approved for portfolio demo",
      status: "approved",
      reviewed_by: "auto-system",
      reviewed_at: new Date().toISOString(),
    });

    if (error) {
      console.error("Auto-whitelist error:", error);
      return NextResponse.json(
        { error: "Failed to auto-whitelist", details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Auto-whitelisted successfully",
      status: "approved",
      isApproved: true,
    });
  } catch (error) {
    console.error("Auto-whitelist error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
