import { network } from "hardhat";

const { ethers } = await network.connect();

async function main() {
  const WHITELIST_ADDRESS = "0x9Dc786Ad986e1d4cb1E85e4469E8443efCBfAD2E";
  const OWNER_WALLET = "0xe68C17C8a4e782e27038d189E1fE8b3a4546c9b9";

  const [signer] = await ethers.getSigners();
  console.log("\n🔐 Whitelisting Owner Wallet");
  console.log("Signer:", signer.address);
  console.log("=====================================\n");

  const whitelist = await ethers.getContractAt("WhitelistManager", WHITELIST_ADDRESS);

  // Check if already whitelisted
  const isWhitelisted = await whitelist.isWhitelisted(OWNER_WALLET);
  console.log("Current status:", isWhitelisted ? "✅ Already whitelisted" : "❌ Not whitelisted");

  if (!isWhitelisted) {
    console.log("\nAdding to whitelist...");
    const tx = await whitelist.addToWhitelist(OWNER_WALLET);
    await tx.wait();
    console.log("✅ Added to whitelist!");
    console.log("Transaction:", tx.hash);
  }

  console.log("\n=====================================\n");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
