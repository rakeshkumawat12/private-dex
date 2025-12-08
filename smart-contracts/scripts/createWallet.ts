import { network } from "hardhat";

const { ethers } = await network.connect();

async function main() {
  console.log("🔐 Creating a new test wallet...\n");

  // Create a random wallet
  const wallet = ethers.Wallet.createRandom();

  console.log("=".repeat(60));
  console.log("✅ NEW TEST WALLET CREATED");
  console.log("=".repeat(60));
  console.log("Address:     ", wallet.address);
  console.log("Private Key: ", wallet.privateKey);
  console.log("Mnemonic:    ", wallet.mnemonic?.phrase);
  console.log("=".repeat(60));

  console.log("\n📝 Add this to your .env file:");
  console.log("=".repeat(60));
  console.log(`SEPOLIA_PRIVATE_KEY=${wallet.privateKey}`);
  console.log("=".repeat(60));

  console.log("\n💰 Fund this address with Sepolia test ETH:");
  console.log("   Address:", wallet.address);
  console.log("\n   Faucets:");
  console.log("   - https://sepoliafaucet.com/");
  console.log("   - https://www.infura.io/faucet/sepolia");
  console.log("   - https://faucet.quicknode.com/ethereum/sepolia");

  console.log("\n⚠️  IMPORTANT:");
  console.log("   - Save the mnemonic phrase in a safe place");
  console.log("   - NEVER use this wallet for real funds");
  console.log("   - NEVER commit the private key to git");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Error:", error);
    process.exit(1);
  });
