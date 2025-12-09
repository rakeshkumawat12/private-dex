const hre = require("hardhat");

/**
 * Script to add an address to the whitelist
 * Usage: ADDRESS_TO_WHITELIST=0x... npx hardhat run scripts/add-to-whitelist.js --network sepolia
 */
async function main() {
  const WHITELIST_MANAGER_ADDRESS = "0x3B0CD801d3F0f3F5C69905e7D3bfE225A994469F";

  const [deployer] = await hre.ethers.getSigners();
  const addressToWhitelist = process.env.ADDRESS_TO_WHITELIST;

  if (!addressToWhitelist) {
    console.error("❌ Error: ADDRESS_TO_WHITELIST environment variable not set");
    console.log("\n💡 Usage:");
    console.log("   ADDRESS_TO_WHITELIST=0x... npx hardhat run scripts/add-to-whitelist.js --network sepolia");
    process.exit(1);
  }

  // Validate address
  if (!hre.ethers.isAddress(addressToWhitelist)) {
    console.error("❌ Error: Invalid Ethereum address");
    process.exit(1);
  }

  console.log("\n➕ Adding Address to Whitelist");
  console.log("================================");
  console.log(`WhitelistManager: ${WHITELIST_MANAGER_ADDRESS}`);
  console.log(`Deployer: ${deployer.address}`);
  console.log(`Address to whitelist: ${addressToWhitelist}\n`);

  // Get WhitelistManager contract
  const WhitelistManager = await hre.ethers.getContractAt(
    "WhitelistManager",
    WHITELIST_MANAGER_ADDRESS
  );

  try {
    // Check if already whitelisted
    const alreadyWhitelisted = await WhitelistManager.isWhitelisted(addressToWhitelist);
    if (alreadyWhitelisted) {
      console.log("✓ Address is already whitelisted");
      const isActive = await WhitelistManager.isWhitelistedAndActive(addressToWhitelist);
      console.log(`✓ Is active (not paused): ${isActive}`);
      return;
    }

    // Check if deployer is owner
    const owner = await WhitelistManager.owner();
    if (owner.toLowerCase() !== deployer.address.toLowerCase()) {
      console.error(`❌ Error: Deployer is not the owner`);
      console.error(`   Owner: ${owner}`);
      console.error(`   Deployer: ${deployer.address}`);
      process.exit(1);
    }

    console.log("📝 Sending transaction to whitelist address...");

    // Add to whitelist
    const tx = await WhitelistManager.addToWhitelist(addressToWhitelist);
    console.log(`✓ Transaction sent: ${tx.hash}`);

    console.log("⏳ Waiting for confirmation...");
    const receipt = await tx.wait();
    console.log(`✓ Transaction confirmed in block ${receipt.blockNumber}`);

    // Verify
    const isWhitelisted = await WhitelistManager.isWhitelisted(addressToWhitelist);
    const isActive = await WhitelistManager.isWhitelistedAndActive(addressToWhitelist);

    console.log("\n📊 Verification:");
    console.log("================");
    console.log(`✅ Address whitelisted: ${isWhitelisted}`);
    console.log(`✅ Address active: ${isActive}`);

    if (isActive) {
      console.log("\n🎉 Success! Address can now use the DEX");
      console.log("\n💡 Next steps:");
      console.log("   1. Refresh the frontend");
      console.log("   2. Connect the whitelisted wallet");
      console.log("   3. Access swap and liquidity features");
    }

    console.log(`\n🔍 View on Etherscan:`);
    console.log(`   https://sepolia.etherscan.io/tx/${tx.hash}`);

  } catch (error) {
    console.error("\n❌ Error adding to whitelist:");
    console.error(error.message);

    if (error.message.includes("already whitelisted")) {
      console.log("\n💡 This address is already whitelisted");
    } else if (error.message.includes("Ownable: caller is not the owner")) {
      console.log("\n💡 You need to use the owner wallet to whitelist addresses");
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
