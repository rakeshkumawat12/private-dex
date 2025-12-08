import { network } from "hardhat";

const { ethers } = await network.connect();

// Use the deployed addresses from the previous deployment
const FACTORY_ADDRESS = "0xE3a3eBF9458913Fb214b6f7d3ECf04fdF4B00F2a";
const TOKEN_A_ADDRESS = "0x3380f8feFD7A89B0a0C611fE486e884799B9Bd17";
const TOKEN_B_ADDRESS = "0xbb7b45e5f6F2876CF86899c4FdBf23b5dd858988";

async function main() {
  console.log("📝 Creating trading pair...\n");

  const factory = await ethers.getContractAt("Factory", FACTORY_ADDRESS);

  // Check if pair already exists
  const existingPair = await factory.getPair(TOKEN_A_ADDRESS, TOKEN_B_ADDRESS);

  if (existingPair !== ethers.ZeroAddress) {
    console.log("✅ Pair already exists at:", existingPair);
    return;
  }

  // Create pair
  console.log("Creating pair for Token A and Token B...");
  const tx = await factory.createPair(TOKEN_A_ADDRESS, TOKEN_B_ADDRESS);
  console.log("Transaction sent:", tx.hash);

  console.log("Waiting for confirmation...");
  await tx.wait();

  const pairAddress = await factory.getPair(TOKEN_A_ADDRESS, TOKEN_B_ADDRESS);
  console.log("\n✅ Pair created successfully at:", pairAddress);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Error:", error);
    process.exit(1);
  });
