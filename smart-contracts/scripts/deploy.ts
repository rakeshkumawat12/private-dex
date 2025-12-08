import { network } from "hardhat";

const { ethers } = await network.connect();

async function main() {
  console.log("🚀 Starting Private DEX deployment...\n");

  const [deployer] = await ethers.getSigners();
  console.log("📝 Deploying contracts with account:", deployer.address);

  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("💰 Account balance:", ethers.formatEther(balance), "ETH\n");

  // 1. Deploy WhitelistManager
  console.log("1️⃣  Deploying WhitelistManager...");
  const whitelistManager = await ethers.deployContract("WhitelistManager");
  await whitelistManager.waitForDeployment();
  const whitelistAddress = await whitelistManager.getAddress();
  console.log("✅ WhitelistManager deployed to:", whitelistAddress);

  // 2. Deploy Factory
  console.log("\n2️⃣  Deploying Factory...");
  const factory = await ethers.deployContract("Factory", [whitelistAddress]);
  await factory.waitForDeployment();
  const factoryAddress = await factory.getAddress();
  console.log("✅ Factory deployed to:", factoryAddress);

  // 3. Deploy Router
  console.log("\n3️⃣  Deploying Router...");
  const router = await ethers.deployContract("Router", [factoryAddress, whitelistAddress]);
  await router.waitForDeployment();
  const routerAddress = await router.getAddress();
  console.log("✅ Router deployed to:", routerAddress);

  // 4. Deploy test tokens (optional - only for testing)
  console.log("\n4️⃣  Deploying Test Tokens (for testing only)...");
  const tokenA = await ethers.deployContract("MockERC20", ["Test Token A", "TSTA", 18]);
  await tokenA.waitForDeployment();
  const tokenAAddress = await tokenA.getAddress();
  console.log("✅ Token A deployed to:", tokenAAddress);

  const tokenB = await ethers.deployContract("MockERC20", ["Test Token B", "TSTB", 18]);
  await tokenB.waitForDeployment();
  const tokenBAddress = await tokenB.getAddress();
  console.log("✅ Token B deployed to:", tokenBAddress);

  // 5. Initial configuration
  console.log("\n5️⃣  Configuring Whitelist...");
  console.log("Adding deployer to whitelist...");
  const tx1 = await whitelistManager.addToWhitelist(deployer.address);
  await tx1.wait();
  console.log("✅ Deployer whitelisted");

  console.log("Adding router to whitelist...");
  const tx2 = await whitelistManager.addToWhitelist(routerAddress);
  await tx2.wait();
  console.log("✅ Router whitelisted");

  // 6. Create initial pair (optional - for testing)
  console.log("\n6️⃣  Creating test pair...");
  const tx3 = await factory.createPair(tokenAAddress, tokenBAddress);
  await tx3.wait();
  const pairAddress = await factory.getPair(tokenAAddress, tokenBAddress);
  console.log("✅ Pair created at:", pairAddress);

  // Print summary
  console.log("\n" + "=".repeat(60));
  console.log("📋 DEPLOYMENT SUMMARY");
  console.log("=".repeat(60));
  console.log("WhitelistManager:", whitelistAddress);
  console.log("Factory:         ", factoryAddress);
  console.log("Router:          ", routerAddress);
  console.log("Token A:         ", tokenAAddress);
  console.log("Token B:         ", tokenBAddress);
  console.log("Pair (A-B):      ", pairAddress);
  console.log("=".repeat(60));

  // Save deployment addresses
  const deployment = {
    network: network.name,
    timestamp: new Date().toISOString(),
    deployer: deployer.address,
    contracts: {
      WhitelistManager: whitelistAddress,
      Factory: factoryAddress,
      Router: routerAddress,
      TestTokenA: tokenAAddress,
      TestTokenB: tokenBAddress,
      PairAB: pairAddress,
    },
  };

  console.log("\n💾 Deployment Info:\n", JSON.stringify(deployment, null, 2));

  console.log("\n🎉 Deployment complete!");
  console.log("\n📚 Next steps:");
  console.log("   1. Verify contracts on Etherscan (if on testnet/mainnet)");
  console.log("   2. Add addresses to whitelist using WhitelistManager");
  console.log("   3. Create trading pairs using Factory");
  console.log("   4. Add liquidity using Router");
  console.log("   5. Start trading!\n");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });
