const hre = require("hardhat");

/**
 * Script to check if an address is whitelisted
 * Usage: npx hardhat run scripts/check-whitelist.js --network sepolia
 */
async function main() {
  const WHITELIST_MANAGER_ADDRESS = "0x9Dc786Ad986e1d4cb1E85e4469E8443efCBfAD2E";

  // Get the address to check from command line or use the deployer address
  const [deployer] = await hre.ethers.getSigners();
  const addressToCheck = process.env.ADDRESS_TO_CHECK || deployer.address;

  console.log("\n🔍 Checking Whitelist Status");
  console.log("============================");
  console.log(`WhitelistManager: ${WHITELIST_MANAGER_ADDRESS}`);
  console.log(`Checking address: ${addressToCheck}\n`);

  // Get WhitelistManager contract
  const WhitelistManager = await hre.ethers.getContractAt(
    "WhitelistManager",
    WHITELIST_MANAGER_ADDRESS
  );

  try {
    // Check if address is whitelisted
    const isWhitelisted = await WhitelistManager.isWhitelisted(addressToCheck);
    console.log(`✓ isWhitelisted(): ${isWhitelisted}`);

    // Check if address is whitelisted and active (not paused)
    const isWhitelistedAndActive = await WhitelistManager.isWhitelistedAndActive(addressToCheck);
    console.log(`✓ isWhitelistedAndActive(): ${isWhitelistedAndActive}`);

    // Check if contract is paused
    const isPaused = await WhitelistManager.paused();
    console.log(`✓ Contract paused: ${isPaused}`);

    // Get contract owner
    const owner = await WhitelistManager.owner();
    console.log(`✓ Contract owner: ${owner}`);
    console.log(`✓ Is deployer the owner: ${owner.toLowerCase() === deployer.address.toLowerCase()}`);

    console.log("\n📊 Summary:");
    console.log("===========");
    if (isWhitelistedAndActive) {
      console.log("✅ Address is WHITELISTED and can use the DEX");
    } else if (isWhitelisted && isPaused) {
      console.log("⚠️  Address is whitelisted but contract is PAUSED");
    } else {
      console.log("❌ Address is NOT whitelisted");
      console.log("\n💡 To whitelist this address, run:");
      console.log(`   ADDRESS_TO_WHITELIST=${addressToCheck} npx hardhat run scripts/add-to-whitelist.js --network sepolia`);
    }

  } catch (error) {
    console.error("\n❌ Error checking whitelist:");
    console.error(error.message);

    if (error.message.includes("invalid address")) {
      console.log("\n💡 Make sure the WhitelistManager address is correct");
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
