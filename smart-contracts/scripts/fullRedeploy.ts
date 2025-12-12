import { network } from "hardhat";
import fs from "fs";
import path from "path";

const { ethers } = await network.connect();

async function main() {
  console.log("🚀 Starting FULL REDEPLOY of Private DEX...\n");
  console.log("=" .repeat(70));

  const [deployer] = await ethers.getSigners();
  console.log("📝 Deploying with account:", deployer.address);

  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("💰 Account balance:", ethers.formatEther(balance), "ETH");
  console.log("=" .repeat(70) + "\n");

  // ============================================================================
  // STEP 1: Deploy WhitelistManager
  // ============================================================================
  console.log("1️⃣  Deploying WhitelistManager...");
  const whitelistManager = await ethers.deployContract("WhitelistManager");
  await whitelistManager.waitForDeployment();
  const whitelistAddress = await whitelistManager.getAddress();
  console.log("✅ WhitelistManager deployed to:", whitelistAddress);

  // Verify owner
  const owner = await whitelistManager.owner();
  console.log("   Owner:", owner);
  console.log("   ✓ Owner is deployer:", owner === deployer.address);

  // ============================================================================
  // STEP 2: Deploy Factory
  // ============================================================================
  console.log("\n2️⃣  Deploying Factory...");
  const factory = await ethers.deployContract("Factory", [whitelistAddress]);
  await factory.waitForDeployment();
  const factoryAddress = await factory.getAddress();
  console.log("✅ Factory deployed to:", factoryAddress);

  // ============================================================================
  // STEP 3: Deploy Router
  // ============================================================================
  console.log("\n3️⃣  Deploying Router...");
  const router = await ethers.deployContract("Router", [factoryAddress, whitelistAddress]);
  await router.waitForDeployment();
  const routerAddress = await router.getAddress();
  console.log("✅ Router deployed to:", routerAddress);

  // ============================================================================
  // STEP 4: Deploy Test Tokens
  // ============================================================================
  console.log("\n4️⃣  Deploying Test Tokens...");

  const tokens = [
    { name: "Wrapped Ether", symbol: "WETH", decimals: 18 },
    { name: "USD Coin", symbol: "USDC", decimals: 6 },
    { name: "Dai Stablecoin", symbol: "DAI", decimals: 18 },
    { name: "Tether USD", symbol: "USDT", decimals: 6 },
  ];

  const deployedTokens: Record<string, string> = {};

  for (const token of tokens) {
    console.log(`   Deploying ${token.symbol}...`);
    const tokenContract = await ethers.deployContract("MockERC20", [
      token.name,
      token.symbol,
      token.decimals,
    ]);
    await tokenContract.waitForDeployment();
    const tokenAddress = await tokenContract.getAddress();
    deployedTokens[token.symbol] = tokenAddress;
    console.log(`   ✅ ${token.symbol} deployed to: ${tokenAddress}`);
  }

  // ============================================================================
  // STEP 5: Configure Whitelist
  // ============================================================================
  console.log("\n5️⃣  Configuring Whitelist...");

  console.log("   Adding deployer to whitelist...");
  let tx = await whitelistManager.addToWhitelist(deployer.address);
  await tx.wait();
  console.log("   ✅ Deployer whitelisted");

  console.log("   Adding router to whitelist...");
  tx = await whitelistManager.addToWhitelist(routerAddress);
  await tx.wait();
  console.log("   ✅ Router whitelisted");

  // ============================================================================
  // STEP 6: Create Trading Pairs
  // ============================================================================
  console.log("\n6️⃣  Creating Trading Pairs...");

  const pairs = [
    ["WETH", "USDC"],
    ["WETH", "DAI"],
    ["USDC", "USDT"],
    ["DAI", "USDT"],
  ];

  const deployedPairs: Record<string, string> = {};

  for (const [tokenA, tokenB] of pairs) {
    console.log(`   Creating ${tokenA}/${tokenB} pair...`);
    const tx = await factory.createPair(deployedTokens[tokenA], deployedTokens[tokenB]);
    await tx.wait();
    const pairAddress = await factory.getPair(deployedTokens[tokenA], deployedTokens[tokenB]);
    deployedPairs[`${tokenA}-${tokenB}`] = pairAddress;
    console.log(`   ✅ ${tokenA}/${tokenB} pair: ${pairAddress}`);
  }

  // ============================================================================
  // STEP 7: Add Liquidity to All Pools
  // ============================================================================
  console.log("\n7️⃣  Adding Liquidity to All Pools...");

  const liquidityConfig = [
    { tokenA: "WETH", tokenB: "USDC", amountA: "10", amountB: "30000" }, // 1 ETH = $3000
    { tokenA: "WETH", tokenB: "DAI", amountA: "10", amountB: "30000" },  // 1 ETH = $3000
    { tokenA: "USDC", tokenB: "USDT", amountA: "10000", amountB: "10000" }, // 1:1
    { tokenA: "DAI", tokenB: "USDT", amountA: "10000", amountB: "10000" },  // 1:1
  ];

  for (const config of liquidityConfig) {
    console.log(`\n   Adding liquidity to ${config.tokenA}/${config.tokenB}...`);

    const tokenAContract = await ethers.getContractAt("MockERC20", deployedTokens[config.tokenA]);
    const tokenBContract = await ethers.getContractAt("MockERC20", deployedTokens[config.tokenB]);

    const decimalsA = await tokenAContract.decimals();
    const decimalsB = await tokenBContract.decimals();

    const amountA = ethers.parseUnits(config.amountA, decimalsA);
    const amountB = ethers.parseUnits(config.amountB, decimalsB);

    // Mint tokens
    console.log(`   Minting ${config.amountA} ${config.tokenA}...`);
    tx = await tokenAContract.mint(deployer.address, amountA);
    await tx.wait();

    console.log(`   Minting ${config.amountB} ${config.tokenB}...`);
    tx = await tokenBContract.mint(deployer.address, amountB);
    await tx.wait();

    // Approve router
    console.log(`   Approving tokens...`);
    tx = await tokenAContract.approve(routerAddress, amountA);
    await tx.wait();

    tx = await tokenBContract.approve(routerAddress, amountB);
    await tx.wait();

    // Add liquidity
    const deadline = Math.floor(Date.now() / 1000) + 3600;
    console.log(`   Adding liquidity...`);
    tx = await router.addLiquidity(
      deployedTokens[config.tokenA],
      deployedTokens[config.tokenB],
      amountA,
      amountB,
      0,
      0,
      deployer.address,
      deadline
    );
    await tx.wait();
    console.log(`   ✅ Liquidity added to ${config.tokenA}/${config.tokenB}`);
  }

  // ============================================================================
  // STEP 8: Save Deployment Info
  // ============================================================================
  console.log("\n8️⃣  Saving Deployment Information...");

  const deployment = {
    network: network.name,
    timestamp: new Date().toISOString(),
    deployer: deployer.address,
    contracts: {
      WhitelistManager: whitelistAddress,
      Factory: factoryAddress,
      Router: routerAddress,
    },
    tokens: deployedTokens,
    pairs: deployedPairs,
  };

  // Save to JSON file
  const deploymentPath = path.join(__dirname, "..", "deployments", `${network.name}-latest.json`);
  const deploymentsDir = path.dirname(deploymentPath);

  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }

  fs.writeFileSync(deploymentPath, JSON.stringify(deployment, null, 2));
  console.log("✅ Deployment info saved to:", deploymentPath);

  // ============================================================================
  // FINAL SUMMARY
  // ============================================================================
  console.log("\n" + "=".repeat(70));
  console.log("🎉 DEPLOYMENT COMPLETE!");
  console.log("=".repeat(70));

  console.log("\n📋 CORE CONTRACTS:");
  console.log("   WhitelistManager:", whitelistAddress);
  console.log("   Factory:         ", factoryAddress);
  console.log("   Router:          ", routerAddress);

  console.log("\n🪙 TOKENS:");
  Object.entries(deployedTokens).forEach(([symbol, address]) => {
    console.log(`   ${symbol.padEnd(6)}:`, address);
  });

  console.log("\n💧 LIQUIDITY POOLS:");
  Object.entries(deployedPairs).forEach(([pair, address]) => {
    console.log(`   ${pair.padEnd(12)}:`, address);
  });

  console.log("\n👤 OWNER/ADMIN:");
  console.log("   Address:", deployer.address);
  console.log("   Whitelisted: ✓");

  console.log("\n📚 NEXT STEPS:");
  console.log("   1. Update frontend with new contract addresses");
  console.log("   2. Verify contracts on Etherscan (optional)");
  console.log("   3. Test swaps on your frontend");
  console.log("   4. Share your portfolio project!");

  console.log("\n🔗 VIEW ON ETHERSCAN:");
  console.log(`   WhitelistManager: https://sepolia.etherscan.io/address/${whitelistAddress}`);
  console.log(`   Factory:          https://sepolia.etherscan.io/address/${factoryAddress}`);
  console.log(`   Router:           https://sepolia.etherscan.io/address/${routerAddress}`);

  console.log("\n" + "=".repeat(70) + "\n");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ Deployment failed:", error);
    process.exit(1);
  });
