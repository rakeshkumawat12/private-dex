import { network } from "hardhat";

const { ethers } = await network.connect();

// Deployed contract addresses on Sepolia
const WHITELIST_MANAGER_ADDRESS = "0x3B0CD801d3F0f3F5C69905e7D3bfE225A994469F";

async function main() {
  const [signer] = await ethers.getSigners();
  console.log("🔍 Diagnosing Whitelist Issues\n");
  console.log("━".repeat(60));
  console.log("Connected wallet:", signer.address);
  console.log("━".repeat(60), "\n");

  // Get WhitelistManager contract
  const whitelistManager = await ethers.getContractAt("WhitelistManager", WHITELIST_MANAGER_ADDRESS);

  try {
    // 1. Check contract owner
    console.log("1️⃣  Checking Contract Ownership:");
    const owner = await whitelistManager.owner();
    console.log("   Contract owner:", owner);
    console.log("   Your address:  ", signer.address);
    const isOwner = owner.toLowerCase() === signer.address.toLowerCase();
    console.log("   You are owner:", isOwner ? "✅ YES" : "❌ NO");

    if (!isOwner) {
      console.log("\n⚠️  WARNING: You are not the owner!");
      console.log("   Only the owner can add addresses to the whitelist.");
      console.log("   Please switch to the owner wallet:", owner);
    }
    console.log("");

    // 2. Check if contract is paused
    console.log("2️⃣  Checking Contract Status:");
    const isPaused = await whitelistManager.paused();
    console.log("   Contract paused:", isPaused ? "❌ YES" : "✅ NO");

    if (isPaused) {
      console.log("\n⚠️  WARNING: Contract is paused!");
      console.log("   You need to unpause the contract before adding addresses.");
    }
    console.log("");

    // 3. Check network and balance
    console.log("3️⃣  Checking Network & Balance:");
    const network = await ethers.provider.getNetwork();
    console.log("   Network:", network.name, `(Chain ID: ${network.chainId})`);

    const balance = await ethers.provider.getBalance(signer.address);
    console.log("   ETH Balance:", ethers.formatEther(balance), "ETH");

    if (balance === 0n) {
      console.log("\n⚠️  WARNING: Zero balance!");
      console.log("   You need ETH to pay for gas fees.");
    }
    console.log("");

    // 4. Test address to whitelist from environment or use a sample
    const testAddress = process.env.ADDRESS_TO_WHITELIST || "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb";
    console.log("4️⃣  Testing Address:", testAddress);

    if (!ethers.isAddress(testAddress)) {
      console.log("   ❌ Invalid address format");
      return;
    }

    // Check if already whitelisted
    const isWhitelisted = await whitelistManager.isWhitelisted(testAddress);
    console.log("   Currently whitelisted:", isWhitelisted ? "✅ YES" : "❌ NO");

    const isWhitelistedAndActive = await whitelistManager.isWhitelistedAndActive(testAddress);
    console.log("   Whitelisted & Active:", isWhitelistedAndActive ? "✅ YES" : "❌ NO");
    console.log("");

    // 5. Try to estimate gas for addToWhitelist
    if (isOwner && !isPaused && !isWhitelisted) {
      console.log("5️⃣  Estimating Gas for Transaction:");
      try {
        const gasEstimate = await whitelistManager.addToWhitelist.estimateGas(testAddress);
        console.log("   Estimated gas:", gasEstimate.toString());

        const feeData = await ethers.provider.getFeeData();
        const estimatedCost = gasEstimate * (feeData.gasPrice || 0n);
        console.log("   Estimated cost:", ethers.formatEther(estimatedCost), "ETH");
        console.log("   ✅ Transaction should work!");
      } catch (error: any) {
        console.log("   ❌ Gas estimation failed!");
        console.log("   Error:", error.message);

        if (error.message.includes("already whitelisted")) {
          console.log("\n   ℹ️  Address is already whitelisted in the contract");
        } else if (error.message.includes("Ownable")) {
          console.log("\n   ℹ️  You don't have permission (not the owner)");
        }
      }
    } else if (isWhitelisted) {
      console.log("5️⃣  ⏭️  Skipping gas estimation (address already whitelisted)");
    } else {
      console.log("5️⃣  ⏭️  Skipping gas estimation (prerequisites not met)");
    }
    console.log("");

    // Summary
    console.log("━".repeat(60));
    console.log("📋 SUMMARY:");
    console.log("━".repeat(60));

    const issues: string[] = [];
    if (!isOwner) issues.push("❌ Not the contract owner");
    if (isPaused) issues.push("❌ Contract is paused");
    if (balance === 0n) issues.push("⚠️  Zero ETH balance");
    if (isWhitelisted) issues.push("ℹ️  Address already whitelisted");

    if (issues.length === 0) {
      console.log("✅ Everything looks good! You should be able to add addresses.");
    } else {
      console.log("Issues found:");
      issues.forEach(issue => console.log("  ", issue));
    }

    console.log("\n💡 NEXT STEPS:");
    if (!isOwner) {
      console.log("   • Switch to the owner wallet:", owner);
      console.log("   • Or transfer ownership to your current wallet");
    } else if (isPaused) {
      console.log("   • Run: npx hardhat run scripts/unpauseWhitelist.ts --network sepolia");
    } else if (balance === 0n) {
      console.log("   • Get Sepolia ETH from: https://sepoliafaucet.com");
    } else if (!isWhitelisted) {
      console.log("   • You can add the address using:");
      console.log("   • ADDRESS_TO_WHITELIST=" + testAddress + " npm run whitelist:sepolia");
    } else {
      console.log("   • Address is already whitelisted and ready to use!");
    }

  } catch (error: any) {
    console.error("\n❌ Error:", error.message);
    console.error("\nFull error:", error);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Fatal error:", error);
    process.exit(1);
  });
