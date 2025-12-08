import { network } from "hardhat";

const { ethers } = await network.connect();

// Deployed contract addresses on Sepolia
const WHITELIST_MANAGER_ADDRESS = "0xf85b33a94947F55f84B0228008C5CFd47a42B7EC";
const FACTORY_ADDRESS = "0xE3a3eBF9458913Fb214b6f7d3ECf04fdF4B00F2a";
const ROUTER_ADDRESS = "0x4258A353E95428646bE249c795DC7891f4CFd1c1";
const TOKEN_A_ADDRESS = "0x3380f8feFD7A89B0a0C611fE486e884799B9Bd17";
const TOKEN_B_ADDRESS = "0xbb7b45e5f6F2876CF86899c4FdBf23b5dd858988";

async function main() {
  const [signer] = await ethers.getSigners();
  console.log("🔗 Interacting with account:", signer.address, "\n");

  // Get contract instances
  const whitelistManager = await ethers.getContractAt("WhitelistManager", WHITELIST_MANAGER_ADDRESS);
  const factory = await ethers.getContractAt("Factory", FACTORY_ADDRESS);
  const router = await ethers.getContractAt("Router", ROUTER_ADDRESS);
  const tokenA = await ethers.getContractAt("MockERC20", TOKEN_A_ADDRESS);
  const tokenB = await ethers.getContractAt("MockERC20", TOKEN_B_ADDRESS);

  // Check whitelist status
  console.log("📋 Checking whitelist status...");
  const isWhitelisted = await whitelistManager.isWhitelisted(signer.address);
  console.log("Is whitelisted:", isWhitelisted, "\n");

  if (!isWhitelisted) {
    console.log("❌ Address not whitelisted. Please add your address to the whitelist first.\n");
    return;
  }

  // Get pair address
  const pairAddress = await factory.getPair(TOKEN_A_ADDRESS, TOKEN_B_ADDRESS);
  console.log("📍 Pair address:", pairAddress, "\n");

  let pair;
  if (pairAddress === ethers.ZeroAddress) {
    console.log("📝 Creating new pair...");
    const tx = await factory.createPair(TOKEN_A_ADDRESS, TOKEN_B_ADDRESS);
    await tx.wait();
    const newPairAddress = await factory.getPair(TOKEN_A_ADDRESS, TOKEN_B_ADDRESS);
    pair = await ethers.getContractAt("Pair", newPairAddress);
    console.log("✅ Pair created at:", newPairAddress, "\n");
  } else {
    pair = await ethers.getContractAt("Pair", pairAddress);
    console.log("✅ Pair already exists\n");
  }

  // Display menu
  console.log("=".repeat(60));
  console.log("AVAILABLE OPERATIONS");
  console.log("=".repeat(60));
  console.log("1. Mint test tokens");
  console.log("2. Add liquidity");
  console.log("3. Remove liquidity");
  console.log("4. Swap tokens");
  console.log("5. View balances");
  console.log("6. View pool info");
  console.log("7. Add address to whitelist");
  console.log("8. Remove address from whitelist");
  console.log("=".repeat(60) + "\n");

  // Example: View balances
  await viewBalances(tokenA, tokenB, pair, signer.address);
}

async function viewBalances(tokenA: any, tokenB: any, pair: any, address: string) {
  console.log("💰 BALANCES for", address);
  console.log("-".repeat(60));

  const balanceA = await tokenA.balanceOf(address);
  const balanceB = await tokenB.balanceOf(address);
  const lpBalance = await pair.balanceOf(address);

  const symbolA = await tokenA.symbol();
  const symbolB = await tokenB.symbol();

  console.log(`${symbolA}:`, ethers.formatEther(balanceA));
  console.log(`${symbolB}:`, ethers.formatEther(balanceB));
  console.log("LP Tokens:", ethers.formatEther(lpBalance));
  console.log("-".repeat(60) + "\n");
}

async function addLiquidity(
  router: any,
  tokenA: any,
  tokenB: any,
  amountA: bigint,
  amountB: bigint,
  recipient: string
) {
  console.log("💧 Adding liquidity...");

  // Approve tokens
  console.log("Approving Token A...");
  await (await tokenA.approve(await router.getAddress(), amountA)).wait();

  console.log("Approving Token B...");
  await (await tokenB.approve(await router.getAddress(), amountB)).wait();

  // Add liquidity
  const deadline = Math.floor(Date.now() / 1000) + 3600; // 1 hour from now
  const tx = await router.addLiquidity(
    await tokenA.getAddress(),
    await tokenB.getAddress(),
    amountA,
    amountB,
    0, // min amount A (set to 0 for testing)
    0, // min amount B (set to 0 for testing)
    recipient,
    deadline
  );

  await tx.wait();
  console.log("✅ Liquidity added successfully!\n");
}

async function removeLiquidity(
  router: any,
  pair: any,
  tokenA: any,
  tokenB: any,
  lpAmount: bigint,
  recipient: string
) {
  console.log("💧 Removing liquidity...");

  // Approve LP tokens
  console.log("Approving LP tokens...");
  await (await pair.approve(await router.getAddress(), lpAmount)).wait();

  // Remove liquidity
  const deadline = Math.floor(Date.now() / 1000) + 3600;
  const tx = await router.removeLiquidity(
    await tokenA.getAddress(),
    await tokenB.getAddress(),
    lpAmount,
    0, // min amount A
    0, // min amount B
    recipient,
    deadline
  );

  await tx.wait();
  console.log("✅ Liquidity removed successfully!\n");
}

async function swapTokens(
  router: any,
  tokenIn: any,
  tokenOut: any,
  amountIn: bigint,
  recipient: string
) {
  console.log("🔄 Swapping tokens...");

  // Approve input token
  console.log("Approving input token...");
  await (await tokenIn.approve(await router.getAddress(), amountIn)).wait();

  // Perform swap
  const deadline = Math.floor(Date.now() / 1000) + 3600;
  const path = [await tokenIn.getAddress(), await tokenOut.getAddress()];

  const tx = await router.swapExactTokensForTokens(
    amountIn,
    0, // min amount out (set to 0 for testing)
    path,
    recipient,
    deadline
  );

  await tx.wait();
  console.log("✅ Swap completed successfully!\n");
}

async function viewPoolInfo(pair: any, tokenA: any, tokenB: any) {
  console.log("🏊 POOL INFORMATION");
  console.log("-".repeat(60));

  const [reserve0, reserve1] = await pair.getReserves();
  const token0 = await pair.token0();
  const totalSupply = await pair.totalSupply();

  const symbolA = await tokenA.symbol();
  const symbolB = await tokenB.symbol();
  const tokenAAddr = await tokenA.getAddress();

  if (token0.toLowerCase() === tokenAAddr.toLowerCase()) {
    console.log(`${symbolA} Reserve:`, ethers.formatEther(reserve0));
    console.log(`${symbolB} Reserve:`, ethers.formatEther(reserve1));
  } else {
    console.log(`${symbolA} Reserve:`, ethers.formatEther(reserve1));
    console.log(`${symbolB} Reserve:`, ethers.formatEther(reserve0));
  }

  console.log("Total LP Supply:", ethers.formatEther(totalSupply));

  // Calculate price
  const price = token0.toLowerCase() === tokenAAddr.toLowerCase()
    ? Number(reserve1) / Number(reserve0)
    : Number(reserve0) / Number(reserve1);

  console.log(`Price (${symbolB} per ${symbolA}):`, price.toFixed(6));
  console.log("-".repeat(60) + "\n");
}

// Export functions for use in other scripts
export {
  viewBalances,
  addLiquidity,
  removeLiquidity,
  swapTokens,
  viewPoolInfo,
};

// Run main if executed directly
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Error:", error);
    process.exit(1);
  });
