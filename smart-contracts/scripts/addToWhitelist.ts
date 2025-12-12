import { network } from "hardhat";

const { ethers } = await network.connect();

// Deployed contract addresses on Sepolia
const WHITELIST_MANAGER_ADDRESS = "0x9Dc786Ad986e1d4cb1E85e4469E8443efCBfAD2E";

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

  // Get address from environment variable or use the deployer's address
  const ADDRESS_TO_WHITELIST = process.env.ADDRESS_TO_WHITELIST || signer.address;

  console.log("Address to whitelist:", ADDRESS_TO_WHITELIST);

  if (!ethers.isAddress(ADDRESS_TO_WHITELIST)) {
    console.log("\n❌ Invalid Ethereum address");
    console.log("Usage: ADDRESS_TO_WHITELIST=0x... npm run whitelist:sepolia");
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
