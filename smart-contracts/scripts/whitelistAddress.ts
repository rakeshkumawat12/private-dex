import { network } from "hardhat";

const { ethers } = await network.connect();

async function main() {
  const WHITELIST_ADDRESS = "0x9Dc786Ad986e1d4cb1E85e4469E8443efCBfAD2E";

  // Get the wallet address to whitelist from command line argument
  const addressToWhitelist = process.env.ADDRESS_TO_WHITELIST;

  if (!addressToWhitelist) {
    console.error("❌ Please provide ADDRESS_TO_WHITELIST environment variable");
    console.log("\nUsage: ADDRESS_TO_WHITELIST=0x... npx hardhat run scripts/whitelistAddress.ts --network sepolia");
    process.exit(1);
  }

  const [signer] = await ethers.getSigners();
  console.log("\n🔐 Whitelisting Address");
  console.log("Signer:", signer.address);
  console.log("Address to whitelist:", addressToWhitelist);
  console.log("=====================================\n");

  const whitelist = await ethers.getContractAt("WhitelistManager", WHITELIST_ADDRESS);

  // Check if already whitelisted
  const isWhitelisted = await whitelist.isWhitelisted(addressToWhitelist);
  console.log("Current status:", isWhitelisted ? "✅ Already whitelisted" : "❌ Not whitelisted");

  if (!isWhitelisted) {
    console.log("\nAdding to whitelist...");
    const tx = await whitelist.addToWhitelist(addressToWhitelist, {
      gasLimit: 200000
    });
    console.log("Transaction submitted:", tx.hash);

    await tx.wait();
    console.log("✅ Successfully whitelisted!");

    // Verify
    const isNowWhitelisted = await whitelist.isWhitelisted(addressToWhitelist);
    console.log("Verification:", isNowWhitelisted ? "✅ Confirmed whitelisted" : "❌ Failed to whitelist");
  }

  console.log("\n=====================================\n");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
