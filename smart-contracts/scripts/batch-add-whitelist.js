const hre = require("hardhat");

/**
 * Script to add multiple addresses to the whitelist in one transaction
 * Usage: npx hardhat run scripts/batch-add-whitelist.js --network sepolia
 */
async function main() {
  const WHITELIST_MANAGER_ADDRESS = "0x3B0CD801d3F0f3F5C69905e7D3bfE225A994469F";

  // Add addresses here
  const addressesToWhitelist = [
    // "0x1234...", // Replace with actual addresses
    // "0x5678...",
  ];

  // Or load from environment variable (comma-separated)
  if (process.env.ADDRESSES_TO_WHITELIST) {
    const envAddresses = process.env.ADDRESSES_TO_WHITELIST.split(',').map(a => a.trim());
    addressesToWhitelist.push(...envAddresses);
  }

  if (addressesToWhitelist.length === 0) {
    console.error("❌ Error: No addresses to whitelist");
    console.log("\n💡 Usage:");
    console.log("   Option 1: Edit the script and add addresses to the array");
    console.log("   Option 2: Set ADDRESSES_TO_WHITELIST env variable");
    console.log("   Example: ADDRESSES_TO_WHITELIST=0x...,0x... npx hardhat run scripts/batch-add-whitelist.js --network sepolia");
    process.exit(1);
  }

  const [deployer] = await hre.ethers.getSigners();

  console.log("\n➕ Batch Adding Addresses to Whitelist");
  console.log("========================================");
  console.log(`WhitelistManager: ${WHITELIST_MANAGER_ADDRESS}`);
  console.log(`Deployer: ${deployer.address}`);
  console.log(`Addresses to whitelist: ${addressesToWhitelist.length}\n`);

  // Validate all addresses
  for (const addr of addressesToWhitelist) {
    if (!hre.ethers.isAddress(addr)) {
      console.error(`❌ Error: Invalid address: ${addr}`);
      process.exit(1);
    }
  }

  addressesToWhitelist.forEach((addr, i) => {
    console.log(`   ${i + 1}. ${addr}`);
  });

  // Get WhitelistManager contract
  const WhitelistManager = await hre.ethers.getContractAt(
    "WhitelistManager",
    WHITELIST_MANAGER_ADDRESS
  );

  try {
    // Check owner
    const owner = await WhitelistManager.owner();
    if (owner.toLowerCase() !== deployer.address.toLowerCase()) {
      console.error(`\n❌ Error: Deployer is not the owner`);
      console.error(`   Owner: ${owner}`);
      console.error(`   Deployer: ${deployer.address}`);
      process.exit(1);
    }

    console.log("\n📝 Sending batch transaction...");

    // Batch add to whitelist
    const tx = await WhitelistManager.batchAddToWhitelist(addressesToWhitelist);
    console.log(`✓ Transaction sent: ${tx.hash}`);

    console.log("⏳ Waiting for confirmation...");
    const receipt = await tx.wait();
    console.log(`✓ Transaction confirmed in block ${receipt.blockNumber}`);

    // Verify each address
    console.log("\n📊 Verification:");
    console.log("================");

    let successCount = 0;
    for (const addr of addressesToWhitelist) {
      const isWhitelisted = await WhitelistManager.isWhitelistedAndActive(addr);
      const status = isWhitelisted ? "✅" : "❌";
      console.log(`${status} ${addr}: ${isWhitelisted ? "ACTIVE" : "NOT ACTIVE"}`);
      if (isWhitelisted) successCount++;
    }

    console.log(`\n🎉 Successfully whitelisted ${successCount}/${addressesToWhitelist.length} addresses`);
    console.log(`\n🔍 View on Etherscan:`);
    console.log(`   https://sepolia.etherscan.io/tx/${tx.hash}`);

  } catch (error) {
    console.error("\n❌ Error batch adding to whitelist:");
    console.error(error.message);

    if (error.message.includes("Ownable: caller is not the owner")) {
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
