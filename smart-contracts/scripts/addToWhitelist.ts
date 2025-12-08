import { network } from "hardhat";

const { ethers } = await network.connect();

// Deployed contract addresses on Sepolia
const WHITELIST_MANAGER_ADDRESS = "0xf85b33a94947F55f84B0228008C5CFd47a42B7EC";

async function main() {
  const [signer] = await ethers.getSigners();
  console.log("🔗 Admin account:", signer.address, "\n");

  // Get WhitelistManager contract
  const whitelistManager = await ethers.getContractAt("WhitelistManager", WHITELIST_MANAGER_ADDRESS);

  // Check if current account is owner
  const owner = await whitelistManager.owner();
  console.log("Contract owner:", owner);

  if (owner.toLowerCase() !== signer.address.toLowerCase()) {
    console.log("❌ You are not the owner. Only the owner can add addresses to the whitelist.");
    return;
  }

  // Example: Add an address to whitelist
  // Replace with the address you want to whitelist
  const ADDRESS_TO_WHITELIST = "0x0000000000000000000000000000000000000000"; // Replace this!

  if (ADDRESS_TO_WHITELIST === "0x0000000000000000000000000000000000000000") {
    console.log("\n⚠️  Please edit this script and replace ADDRESS_TO_WHITELIST with the actual address.");
    console.log("Example usage:");
    console.log('  const ADDRESS_TO_WHITELIST = "0x1234...";');
    return;
  }

  // Check if already whitelisted
  const isWhitelisted = await whitelistManager.isWhitelisted(ADDRESS_TO_WHITELIST);

  if (isWhitelisted) {
    console.log("\n✅ Address is already whitelisted:", ADDRESS_TO_WHITELIST);
    return;
  }

  // Add to whitelist
  console.log("\n📝 Adding address to whitelist:", ADDRESS_TO_WHITELIST);
  const tx = await whitelistManager.addToWhitelist(ADDRESS_TO_WHITELIST);
  console.log("Transaction sent:", tx.hash);

  console.log("Waiting for confirmation...");
  await tx.wait();

  console.log("✅ Address added to whitelist!");

  // Verify
  const verified = await whitelistManager.isWhitelisted(ADDRESS_TO_WHITELIST);
  console.log("Verification:", verified ? "✅ Success" : "❌ Failed");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Error:", error);
    process.exit(1);
  });
