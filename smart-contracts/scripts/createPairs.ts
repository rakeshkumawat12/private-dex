import { network } from "hardhat";

const { ethers } = await network.connect();

async function main() {
  console.log("🚀 Creating token pairs...\n");

  const [deployer] = await ethers.getSigners();
  console.log("📝 Creating pairs with account:", deployer.address);

  const FACTORY_ADDRESS = "0x5276cff34F601050EE6bD117107dD6648Fdf6b20";

  // Token addresses from your .env
  const WETH_ADDRESS = "0x35287D9fDb7a1E7CC2212Fd1d57F8ae71cCA030A";
  const USDC_ADDRESS = "0x01134D4D7A522a5d601413dD3Bf33859B193063e";
  const DAI_ADDRESS = "0x64c178393Bbe0cAe2a78A19c58e9B3944c2D5B42";
  const USDT_ADDRESS = "0x5ccE1Fda0efe9A51302B3F26E3ca0d672536c2F7";

  const factory = await ethers.getContractAt("Factory", FACTORY_ADDRESS);

  const pairs = [
    { tokenA: WETH_ADDRESS, tokenB: USDC_ADDRESS, name: "WETH/USDC" },
    { tokenA: WETH_ADDRESS, tokenB: DAI_ADDRESS, name: "WETH/DAI" },
    { tokenA: WETH_ADDRESS, tokenB: USDT_ADDRESS, name: "WETH/USDT" },
    { tokenA: USDC_ADDRESS, tokenB: DAI_ADDRESS, name: "USDC/DAI" },
    { tokenA: USDC_ADDRESS, tokenB: USDT_ADDRESS, name: "USDC/USDT" },
    { tokenA: DAI_ADDRESS, tokenB: USDT_ADDRESS, name: "DAI/USDT" },
  ];

  console.log("Creating pairs...\n");

  for (const pair of pairs) {
    try {
      // Check if pair already exists
      const existingPair = await factory.getPair(pair.tokenA, pair.tokenB);

      if (existingPair !== "0x0000000000000000000000000000000000000000") {
        console.log(`✅ ${pair.name} pair already exists at: ${existingPair}`);
        continue;
      }

      // Create pair
      console.log(`Creating ${pair.name} pair...`);
      const tx = await factory.createPair(pair.tokenA, pair.tokenB);
      await tx.wait();

      const pairAddress = await factory.getPair(pair.tokenA, pair.tokenB);
      console.log(`✅ ${pair.name} pair created at: ${pairAddress}\n`);
    } catch (error: any) {
      console.error(`❌ Failed to create ${pair.name} pair:`, error.message);
    }
  }

  console.log("\n" + "=".repeat(60));
  console.log("🎉 Pair creation complete!");
  console.log("=".repeat(60));

  const totalPairs = await factory.allPairsLength();
  console.log(`Total pairs: ${totalPairs}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Pair creation failed:", error);
    process.exit(1);
  });
