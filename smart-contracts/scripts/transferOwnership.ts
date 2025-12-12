import { network } from "hardhat";

const { ethers } = await network.connect();

// WhitelistManager contract address on Sepolia
const WHITELIST_MANAGER_ADDRESS = "0x9Dc786Ad986e1d4cb1E85e4469E8443efCBfAD2E";

// New owner address
const NEW_OWNER_ADDRESS = "0x24Ed4212a29808D2B11d8D23a1bbBe7f8443ac8C";

async function main() {
  console.log("🔄 Starting ownership transfer...\n");

  const [currentOwner] = await ethers.getSigners();
  console.log("📝 Current owner wallet:", currentOwner.address);

  const balance = await ethers.provider.getBalance(currentOwner.address);
  console.log("💰 Balance:", ethers.formatEther(balance), "ETH\n");

  // Get WhitelistManager contract
  const whitelistManager = await ethers.getContractAt(
    "WhitelistManager",
    WHITELIST_MANAGER_ADDRESS
  );

  // Check current owner
  const contractOwner = await whitelistManager.owner();
  console.log("📋 Current contract owner:", contractOwner);
  console.log("🎯 New owner address:", NEW_OWNER_ADDRESS);

  if (contractOwner.toLowerCase() !== currentOwner.address.toLowerCase()) {
    console.error("\n❌ Error: Your wallet is not the current owner!");
    console.error("   Your wallet:", currentOwner.address);
    console.error("   Contract owner:", contractOwner);
    process.exit(1);
  }

  if (contractOwner.toLowerCase() === NEW_OWNER_ADDRESS.toLowerCase()) {
    console.log("\n✅ The new owner is already the current owner. No action needed.");
    process.exit(0);
  }

  console.log("\n🚀 Transferring ownership...");

  const tx = await whitelistManager.transferOwnership(NEW_OWNER_ADDRESS);
  console.log("📤 Transaction sent:", tx.hash);

  console.log("⏳ Waiting for confirmation...");
  await tx.wait();

  // Verify the transfer
  const newOwner = await whitelistManager.owner();
  console.log("\n✅ Ownership transferred successfully!");
  console.log("📋 New owner:", newOwner);

  console.log("\n" + "=".repeat(60));
  console.log("📋 TRANSFER SUMMARY");
  console.log("=".repeat(60));
  console.log("Contract:    ", WHITELIST_MANAGER_ADDRESS);
  console.log("Old Owner:   ", currentOwner.address);
  console.log("New Owner:   ", NEW_OWNER_ADDRESS);
  console.log("TX Hash:     ", tx.hash);
  console.log("=".repeat(60));

  console.log("\n🎉 Done! The new owner can now manage the whitelist.");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Transfer failed:", error);
    process.exit(1);
  });
