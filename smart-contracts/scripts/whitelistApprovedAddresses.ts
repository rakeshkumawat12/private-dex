import { network } from "hardhat";
import * as fs from "fs";
import * as path from "path";

const { ethers } = await network.connect();

// Deployed contract addresses on Sepolia
const WHITELIST_MANAGER_ADDRESS = "0x3B0CD801d3F0f3F5C69905e7D3bfE225A994469F";

// Addresses that were "approved" in database but failed on-chain
const APPROVED_ADDRESSES = [
  "0x3ca65a48947590298821c3d2f83b47152ead38b0",
  "0xd503d61a1dc0a2d127bb7b182f2231bd9575331e",
];

async function main() {
  const [signer] = await ethers.getSigners();
  console.log("🔧 Whitelisting Previously Approved Addresses\n");
  console.log("━".repeat(60));
  console.log("Admin wallet:", signer.address);
  console.log("Contract:", WHITELIST_MANAGER_ADDRESS);
  console.log("━".repeat(60), "\n");

  // Get WhitelistManager contract
  const whitelistManager = await ethers.getContractAt("WhitelistManager", WHITELIST_MANAGER_ADDRESS);

  // Verify ownership
  const owner = await whitelistManager.owner();
  if (owner.toLowerCase() !== signer.address.toLowerCase()) {
    console.log("❌ ERROR: You are not the contract owner!");
    console.log("   Owner:", owner);
    console.log("   Your address:", signer.address);
    console.log("\n   Please run this script with the owner wallet.");
    return;
  }

  console.log("✅ Ownership verified\n");

  const results: any[] = [];

  for (let i = 0; i < APPROVED_ADDRESSES.length; i++) {
    const address = APPROVED_ADDRESSES[i];
    console.log(`\n[${i + 1}/${APPROVED_ADDRESSES.length}] Processing: ${address}`);

    try {
      // Check if already whitelisted
      const isWhitelisted = await whitelistManager.isWhitelisted(address);

      if (isWhitelisted) {
        console.log("   ℹ️  Already whitelisted, skipping...");
        results.push({
          address,
          status: "already_whitelisted",
          txHash: null,
        });
        continue;
      }

      // Add to whitelist
      console.log("   📝 Sending transaction...");
      const tx = await whitelistManager.addToWhitelist(address);
      console.log("   TX Hash:", tx.hash);

      // Wait for confirmation
      console.log("   ⏳ Waiting for confirmation...");
      const receipt = await tx.wait();

      if (receipt.status === 1) {
        console.log("   ✅ SUCCESS! Gas used:", receipt.gasUsed.toString());
        results.push({
          address,
          status: "success",
          txHash: tx.hash,
          gasUsed: receipt.gasUsed.toString(),
        });
      } else {
        console.log("   ❌ FAILED");
        results.push({
          address,
          status: "failed",
          txHash: tx.hash,
        });
      }

      // Verify
      const verified = await whitelistManager.isWhitelisted(address);
      console.log("   Verification:", verified ? "✅ Confirmed" : "❌ Not whitelisted");

    } catch (error: any) {
      console.log("   ❌ ERROR:", error.message);
      results.push({
        address,
        status: "error",
        error: error.message,
      });
    }
  }

  // Summary
  console.log("\n" + "━".repeat(60));
  console.log("📊 SUMMARY");
  console.log("━".repeat(60));

  const successful = results.filter(r => r.status === "success");
  const alreadyWhitelisted = results.filter(r => r.status === "already_whitelisted");
  const failed = results.filter(r => r.status === "failed" || r.status === "error");

  console.log("✅ Successfully whitelisted:", successful.length);
  console.log("ℹ️  Already whitelisted:", alreadyWhitelisted.length);
  console.log("❌ Failed:", failed.length);

  console.log("\n📋 Detailed Results:");
  results.forEach((result, index) => {
    console.log(`\n${index + 1}. ${result.address}`);
    console.log(`   Status: ${result.status}`);
    if (result.txHash) {
      console.log(`   TX: https://sepolia.etherscan.io/tx/${result.txHash}`);
    }
    if (result.error) {
      console.log(`   Error: ${result.error}`);
    }
  });

  // Save results to file
  const resultsPath = path.join(process.cwd(), "whitelist-results.json");
  fs.writeFileSync(resultsPath, JSON.stringify(results, null, 2));
  console.log(`\n💾 Results saved to: ${resultsPath}`);

  // Print SQL commands to update database
  console.log("\n" + "━".repeat(60));
  console.log("📝 DATABASE UPDATE COMMANDS");
  console.log("━".repeat(60));
  console.log("\nRun these commands to update your database:\n");

  console.log("cd frontend && sqlite3 whitelist-requests.db");

  successful.forEach(result => {
    console.log(`UPDATE whitelist_requests SET tx_hash = '${result.txHash}', updated_at = ${Math.floor(Date.now() / 1000)} WHERE wallet_address = '${result.address}';`);
  });

  alreadyWhitelisted.forEach(result => {
    console.log(`-- ${result.address} is already whitelisted`);
  });

  failed.forEach(result => {
    console.log(`UPDATE whitelist_requests SET status = 'pending', tx_hash = NULL WHERE wallet_address = '${result.address}';`);
  });

  console.log("\n.quit");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Fatal error:", error);
    process.exit(1);
  });
