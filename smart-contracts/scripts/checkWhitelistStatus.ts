import { network } from "hardhat";

const { ethers } = await network.connect();

// Deployed contract addresses on Sepolia
const WHITELIST_MANAGER_ADDRESS = "0x9Dc786Ad986e1d4cb1E85e4469E8443efCBfAD2E";

async function main() {
  const [signer] = await ethers.getSigners();

  // Get address to check from env or use signer's address
  const ADDRESS_TO_CHECK = process.env.ADDRESS_TO_CHECK || signer.address;

  console.log("\n🔍 Checking Whitelist Status");
  console.log("============================");
  console.log("WhitelistManager:", WHITELIST_MANAGER_ADDRESS);
  console.log("Checking address:", ADDRESS_TO_CHECK);
  console.log("Your account:", signer.address, "\n");

  if (!ethers.isAddress(ADDRESS_TO_CHECK)) {
    console.log("❌ Invalid Ethereum address");
    return;
  }

  // Get WhitelistManager contract
  const whitelistManager = await ethers.getContractAt("WhitelistManager", WHITELIST_MANAGER_ADDRESS);

  try {
    // Check whitelist status
    const isWhitelisted = await whitelistManager.isWhitelisted(ADDRESS_TO_CHECK);
    console.log("✓ isWhitelisted():", isWhitelisted);

    // Check if active (not paused)
    const isWhitelistedAndActive = await whitelistManager.isWhitelistedAndActive(ADDRESS_TO_CHECK);
    console.log("✓ isWhitelistedAndActive():", isWhitelistedAndActive);

    // Check if contract is paused
    const isPaused = await whitelistManager.paused();
    console.log("✓ Contract paused:", isPaused);

    // Get owner
    const owner = await whitelistManager.owner();
    console.log("✓ Contract owner:", owner);
    console.log("✓ Is signer the owner:", owner.toLowerCase() === signer.address.toLowerCase());

    console.log("\n📊 Summary:");
    console.log("===========");
    if (isWhitelistedAndActive) {
      console.log("✅ Address is WHITELISTED and can use the DEX");
    } else if (isWhitelisted && isPaused) {
      console.log("⚠️  Address is whitelisted but contract is PAUSED");
      console.log("💡 Contract owner needs to unpause the contract");
    } else {
      console.log("❌ Address is NOT whitelisted");
      console.log("\n💡 To whitelist this address, run:");
      console.log(`   ADDRESS_TO_WHITELIST=${ADDRESS_TO_CHECK} npm run whitelist:sepolia`);
    }

  } catch (error: any) {
    console.error("\n❌ Error checking whitelist:");
    console.error(error.message);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Error:", error);
    process.exit(1);
  });
