import { network } from "hardhat";

const { ethers } = await network.connect();

async function main() {
  const WHITELIST_MANAGER_ADDRESS = "0x9Dc786Ad986e1d4cb1E85e4469E8443efCBfAD2E";
  const ADDRESS_TO_REMOVE = "0x24Ed4212a29808D2B11d8D23a1bbBe7f8443ac8C";

  const [deployer] = await ethers.getSigners();
  
  console.log("\n🗑️  Removing Address from Whitelist");
  console.log("====================================");
  console.log("WhitelistManager:", WHITELIST_MANAGER_ADDRESS);
  console.log("Address to remove:", ADDRESS_TO_REMOVE);
  console.log("Admin/Owner:", deployer.address);
  
  const whitelistManager = await ethers.getContractAt("WhitelistManager", WHITELIST_MANAGER_ADDRESS);
  
  // Check current status
  const isWhitelistedBefore = await whitelistManager.isWhitelisted(ADDRESS_TO_REMOVE);
  console.log("\nCurrent whitelist status:", isWhitelistedBefore);
  
  if (!isWhitelistedBefore) {
    console.log("\n⚠️  Address is not whitelisted. Nothing to remove.");
    return;
  }
  
  // Remove from whitelist
  console.log("\nRemoving from whitelist...");
  const tx = await whitelistManager.removeFromWhitelist(ADDRESS_TO_REMOVE);
  console.log("Transaction hash:", tx.hash);
  
  console.log("Waiting for confirmation...");
  await tx.wait();
  
  // Verify removal
  const isWhitelistedAfter = await whitelistManager.isWhitelisted(ADDRESS_TO_REMOVE);
  console.log("\n✅ Address removed successfully!");
  console.log("New whitelist status:", isWhitelistedAfter);
}

main().then(() => process.exit(0)).catch(console.error);
