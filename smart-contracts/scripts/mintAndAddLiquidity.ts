import { network } from "hardhat";

const { ethers } = await network.connect();

// Deployed contract addresses on Sepolia
const ROUTER_ADDRESS = "0x4258A353E95428646bE249c795DC7891f4CFd1c1";
const TOKEN_A_ADDRESS = "0x3380f8feFD7A89B0a0C611fE486e884799B9Bd17";
const TOKEN_B_ADDRESS = "0xbb7b45e5f6F2876CF86899c4FdBf23b5dd858988";
const PAIR_ADDRESS = "0x2612151a8DD985BDFef0C998C4690D8aC2aD467A";

async function main() {
  const [signer] = await ethers.getSigners();
  console.log("🔗 Account:", signer.address, "\n");

  // Get contract instances
  const tokenA = await ethers.getContractAt("MockERC20", TOKEN_A_ADDRESS);
  const tokenB = await ethers.getContractAt("MockERC20", TOKEN_B_ADDRESS);
  const router = await ethers.getContractAt("Router", ROUTER_ADDRESS);
  const pair = await ethers.getContractAt("Pair", PAIR_ADDRESS);

  // Step 1: Mint tokens
  console.log("1️⃣  Minting test tokens...");
  const mintAmount = ethers.parseEther("30000"); // Mint extra for future use

  console.log("Minting Token A...");
  let tx = await tokenA.mint(signer.address, mintAmount);
  await tx.wait();
  console.log("✅ Minted 30000 Token A");

  console.log("Minting Token B...");
  tx = await tokenB.mint(signer.address, mintAmount);
  await tx.wait();
  console.log("✅ Minted 30000 Token B");

  // Check balances
  const balanceA = await tokenA.balanceOf(signer.address);
  const balanceB = await tokenB.balanceOf(signer.address);
  console.log("\n💰 Your balances:");
  console.log("   Token A:", ethers.formatEther(balanceA));
  console.log("   Token B:", ethers.formatEther(balanceB));

  // Step 2: Approve tokens
  console.log("\n2️⃣  Approving tokens for Router...");
  const approveAmount = ethers.parseEther("10000"); // Approve 10,000 Token A
  const approveBAmount = ethers.parseEther("20000"); // Approve 20,000 Token B

  console.log("Approving Token A...");
  tx = await tokenA.approve(ROUTER_ADDRESS, approveAmount);
  await tx.wait();
  console.log("✅ Token A approved");

  console.log("Approving Token B...");
  tx = await tokenB.approve(ROUTER_ADDRESS, approveBAmount);
  await tx.wait();
  console.log("✅ Token B approved");

  // Step 3: Add liquidity
  console.log("\n3️⃣  Adding liquidity...");
  const amountA = ethers.parseEther("10000"); // 10,000 Token A
  const amountB = ethers.parseEther("20000"); // 20,000 Token B (1:2 ratio)

  const deadline = Math.floor(Date.now() / 1000) + 3600; // 1 hour from now

  console.log("Adding 10,000 Token A and 20,000 Token B...");
  tx = await router.addLiquidity(
    TOKEN_A_ADDRESS,
    TOKEN_B_ADDRESS,
    amountA,
    amountB,
    0, // min amount A (0 for first liquidity)
    0, // min amount B (0 for first liquidity)
    signer.address,
    deadline
  );

  console.log("Transaction sent:", tx.hash);
  console.log("Waiting for confirmation...");
  const receipt = await tx.wait();
  console.log("✅ Liquidity added!");

  // Step 4: Check LP tokens
  console.log("\n4️⃣  Checking LP tokens...");
  const lpBalance = await pair.balanceOf(signer.address);
  console.log("LP Token balance:", ethers.formatEther(lpBalance));

  // Step 5: Check pool reserves
  console.log("\n5️⃣  Pool information:");
  const [reserve0, reserve1] = await pair.getReserves();
  const token0 = await pair.token0();

  if (token0.toLowerCase() === TOKEN_A_ADDRESS.toLowerCase()) {
    console.log("   Token A Reserve:", ethers.formatEther(reserve0));
    console.log("   Token B Reserve:", ethers.formatEther(reserve1));
    console.log("   Price (B per A):", Number(reserve1) / Number(reserve0));
  } else {
    console.log("   Token A Reserve:", ethers.formatEther(reserve1));
    console.log("   Token B Reserve:", ethers.formatEther(reserve0));
    console.log("   Price (B per A):", Number(reserve0) / Number(reserve1));
  }

  console.log("\n🎉 Setup complete! You can now:");
  console.log("   - Swap tokens using the Router");
  console.log("   - Add more liquidity");
  console.log("   - Remove liquidity");
  console.log("\n📝 View on Sepolia Etherscan:");
  console.log("   Pair: https://sepolia.etherscan.io/address/" + PAIR_ADDRESS);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Error:", error);
    process.exit(1);
  });
