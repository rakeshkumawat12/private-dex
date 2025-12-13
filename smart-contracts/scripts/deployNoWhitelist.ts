import { network } from "hardhat";

const { ethers } = await network.connect();

async function main() {
  console.log("🚀 Starting Private DEX deployment (No Whitelist)...\n");

  const [deployer] = await ethers.getSigners();
  console.log("📝 Deploying contracts with account:", deployer.address);

  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("💰 Account balance:", ethers.formatEther(balance), "ETH\n");

  // 1. Deploy Factory
  console.log("1️⃣  Deploying Factory...");
  const factory = await ethers.deployContract("Factory");
  await factory.waitForDeployment();
  const factoryAddress = await factory.getAddress();
  console.log("✅ Factory deployed to:", factoryAddress);

  // 2. Deploy Router
  console.log("\n2️⃣  Deploying Router...");
  const router = await ethers.deployContract("Router", [factoryAddress]);
  await router.waitForDeployment();
  const routerAddress = await router.getAddress();
  console.log("✅ Router deployed to:", routerAddress);

  // Print summary
  console.log("\n" + "=".repeat(60));
  console.log("📋 DEPLOYMENT SUMMARY");
  console.log("=".repeat(60));
  console.log("Factory:         ", factoryAddress);
  console.log("Router:          ", routerAddress);
  console.log("=".repeat(60));

  // Save deployment addresses
  const deployment = {
    network: network.name,
    timestamp: new Date().toISOString(),
    deployer: deployer.address,
    contracts: {
      Factory: factoryAddress,
      Router: routerAddress,
    },
  };

  console.log("\n💾 Deployment Info:\n", JSON.stringify(deployment, null, 2));

  console.log("\n🎉 Deployment complete!");
  console.log("\n📚 Next steps:");
  console.log("   1. Verify contracts on Etherscan (if on testnet/mainnet)");
  console.log("   2. Update frontend with new contract addresses");
  console.log("   3. Create trading pairs using Factory (if needed)");
  console.log("   4. Add liquidity using Router");
  console.log("   5. Start trading!\n");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });
