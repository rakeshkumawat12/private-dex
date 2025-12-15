import { network } from "hardhat";

const { ethers } = await network.connect();

async function main() {
  console.log("🚀 Deploying updated Router contract...\n");

  const [deployer] = await ethers.getSigners();
  console.log("📝 Deploying with account:", deployer.address);

  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("💰 Account balance:", ethers.formatEther(balance), "ETH\n");

  // Existing Factory address from previous deployment
  const factoryAddress = "0x5276cff34F601050EE6bD117107dD6648Fdf6b20";

  console.log("Using existing Factory:", factoryAddress);

  // Deploy new Router
  console.log("\n🔄 Deploying new Router...");
  const router = await ethers.deployContract("Router", [factoryAddress]);
  await router.waitForDeployment();
  const routerAddress = await router.getAddress();
  console.log("✅ Router deployed to:", routerAddress);

  // Print summary
  console.log("\n" + "=".repeat(60));
  console.log("📋 DEPLOYMENT SUMMARY");
  console.log("=".repeat(60));
  console.log("Factory:         ", factoryAddress);
  console.log("New Router:      ", routerAddress);
  console.log("=".repeat(60));

  // Save deployment info
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

  console.log("\n🎉 Router deployment complete!");
  console.log("\n📚 Next steps:");
  console.log("   1. Update frontend with new Router address");
  console.log("   2. Transfer tokens directly to Router before calling functions");
  console.log("   3. No approval needed anymore!\n");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });
