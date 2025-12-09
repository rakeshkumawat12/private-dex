import { network } from "hardhat";

const { ethers } = await network.connect();

async function main() {
  const txHashes = [
    "0x5dd1d18e293d8dc67ea925146fe6867d3e8bb4cecbcfa74a5156ce000a24613a",
    "0x0085cecb8ee1df13246aba9b09e82235f066eb100317fe13ccc96298d8a542c2"
  ];

  console.log("🔍 Checking Transaction Status on Sepolia\n");
  console.log("━".repeat(60));

  for (const txHash of txHashes) {
    console.log("\n📝 Transaction:", txHash);

    try {
      // Get transaction receipt
      const receipt = await ethers.provider.getTransactionReceipt(txHash);

      if (!receipt) {
        console.log("   Status: ❌ NOT FOUND (transaction doesn't exist)");
        continue;
      }

      console.log("   Block Number:", receipt.blockNumber);
      console.log("   From:", receipt.from);
      console.log("   To:", receipt.to);
      console.log("   Gas Used:", receipt.gasUsed.toString());

      if (receipt.status === 1) {
        console.log("   Status: ✅ SUCCESS");
      } else {
        console.log("   Status: ❌ FAILED");

        // Try to get the transaction to see if we can get more info
        const tx = await ethers.provider.getTransaction(txHash);
        if (tx) {
          console.log("   Gas Limit:", tx.gasLimit.toString());
          console.log("   Gas Price:", ethers.formatUnits(tx.gasPrice || 0n, "gwei"), "Gwei");
        }
      }

      // Check logs to see if AddressWhitelisted event was emitted
      if (receipt.logs.length > 0) {
        console.log("   Events:", receipt.logs.length, "log(s) emitted");
      } else {
        console.log("   Events: ⚠️  No events emitted");
      }

    } catch (error: any) {
      console.log("   Error checking transaction:", error.message);
    }
  }

  console.log("\n" + "━".repeat(60));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Fatal error:", error);
    process.exit(1);
  });
