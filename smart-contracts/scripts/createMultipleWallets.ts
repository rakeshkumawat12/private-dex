import { network } from "hardhat";

const { ethers } = await network.connect();

async function main() {
  const numWallets = 3; // Create 3 test wallets

  console.log(`🔐 Creating ${numWallets} test wallets...\n`);

  for (let i = 1; i <= numWallets; i++) {
    const wallet = ethers.Wallet.createRandom();

    console.log("=".repeat(60));
    console.log(`WALLET #${i}`);
    console.log("=".repeat(60));
    console.log("Address:     ", wallet.address);
    console.log("Private Key: ", wallet.privateKey);
    console.log("Mnemonic:    ", wallet.mnemonic?.phrase);
    console.log("=".repeat(60));
    console.log();
  }

  console.log("\n📝 For .env file, use the private key from Wallet #1:");
  console.log("   SEPOLIA_PRIVATE_KEY=<private_key_here>");

  console.log("\n💡 Tips:");
  console.log("   - Wallet #1: Use for deploying contracts");
  console.log("   - Wallet #2: Use for testing as user1");
  console.log("   - Wallet #3: Use for testing as user2");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Error:", error);
    process.exit(1);
  });
