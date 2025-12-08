import { network } from "hardhat";

const { ethers } = await network.connect();

// Deployed contract addresses on Sepolia
const ROUTER_ADDRESS = "0x4258A353E95428646bE249c795DC7891f4CFd1c1";
const TOKEN_A_ADDRESS = "0x3380f8feFD7A89B0a0C611fE486e884799B9Bd17";
const TOKEN_B_ADDRESS = "0xbb7b45e5f6F2876CF86899c4FdBf23b5dd858988";

async function main() {
  const [signer] = await ethers.getSigners();
  console.log("🔗 Account:", signer.address, "\n");

  // Get contract instances
  const tokenA = await ethers.getContractAt("MockERC20", TOKEN_A_ADDRESS);
  const tokenB = await ethers.getContractAt("MockERC20", TOKEN_B_ADDRESS);
  const router = await ethers.getContractAt("Router", ROUTER_ADDRESS);

  // Check balances before swap
  console.log("💰 Balances before swap:");
  let balanceA = await tokenA.balanceOf(signer.address);
  let balanceB = await tokenB.balanceOf(signer.address);
  console.log("   Token A:", ethers.formatEther(balanceA));
  console.log("   Token B:", ethers.formatEther(balanceB));

  // Swap 10 Token A for Token B
  const swapAmount = ethers.parseEther("10");
  console.log("\n🔄 Swapping 10 Token A for Token B...");

  // Approve Token A
  console.log("Approving Token A...");
  let tx = await tokenA.approve(ROUTER_ADDRESS, swapAmount);
  await tx.wait();
  console.log("✅ Approved");

  // Perform swap
  const deadline = Math.floor(Date.now() / 1000) + 3600;
  const path = [TOKEN_A_ADDRESS, TOKEN_B_ADDRESS];

  console.log("Executing swap...");
  tx = await router.swapExactTokensForTokens(
    swapAmount,
    0, // min amount out (set to 0 for demo, use real slippage in production)
    path,
    signer.address,
    deadline
  );

  console.log("Transaction sent:", tx.hash);
  console.log("Waiting for confirmation...");
  await tx.wait();
  console.log("✅ Swap completed!");

  // Check balances after swap
  console.log("\n💰 Balances after swap:");
  balanceA = await tokenA.balanceOf(signer.address);
  balanceB = await tokenB.balanceOf(signer.address);
  console.log("   Token A:", ethers.formatEther(balanceA));
  console.log("   Token B:", ethers.formatEther(balanceB));

  console.log("\n🎉 Swap successful!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Error:", error);
    process.exit(1);
  });
