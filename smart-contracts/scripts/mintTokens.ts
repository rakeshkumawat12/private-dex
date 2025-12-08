import { network } from "hardhat";

const { ethers } = await network.connect();

// Your deployed token addresses
const TOKEN_A_ADDRESS = "0x0ae33C217fd0BE9D23d1596309095E816ac9e41a"; // TSTA
const TOKEN_B_ADDRESS = "0x2EecA34C81d95d578D22A9102d40A8FF57C0AE5F"; // TSTB

async function main() {
  const [signer] = await ethers.getSigners();

  console.log("🪙 Minting Test Tokens for:", signer.address);
  console.log("=" .repeat(60));

  // Get contract instances
  const tokenA = await ethers.getContractAt("MockERC20", TOKEN_A_ADDRESS);
  const tokenB = await ethers.getContractAt("MockERC20", TOKEN_B_ADDRESS);

  // Amount to mint (you can change this)
  const mintAmountA = ethers.parseEther("10000"); // 10,000 TSTA
  const mintAmountB = ethers.parseEther("10");    // 10 TSTB

  // Mint Token A (TSTA)
  console.log("\n1️⃣  Minting TSTA (Test Token A)...");
  console.log("   Amount: 10,000 TSTA");
  let tx = await tokenA.mint(signer.address, mintAmountA);
  console.log("   Transaction:", tx.hash);
  await tx.wait();
  console.log("   ✅ Minted successfully!");

  // Mint Token B (TSTB)
  console.log("\n2️⃣  Minting TSTB (Test Token B)...");
  console.log("   Amount: 10 TSTB");
  tx = await tokenB.mint(signer.address, mintAmountB);
  console.log("   Transaction:", tx.hash);
  await tx.wait();
  console.log("   ✅ Minted successfully!");

  // Check balances
  console.log("\n3️⃣  Your Token Balances:");
  const balanceA = await tokenA.balanceOf(signer.address);
  const balanceB = await tokenB.balanceOf(signer.address);
  console.log("   TSTA:", ethers.formatEther(balanceA));
  console.log("   TSTB:", ethers.formatEther(balanceB));

  console.log("\n" + "=".repeat(60));
  console.log("🎉 Success! Tokens minted to your wallet!");
  console.log("\n📝 Add tokens to MetaMask:");
  console.log("\n   TSTA Token:");
  console.log("   Address: " + TOKEN_A_ADDRESS);
  console.log("   Symbol: TSTA");
  console.log("   Decimals: 18");
  console.log("\n   TSTB Token:");
  console.log("   Address: " + TOKEN_B_ADDRESS);
  console.log("   Symbol: TSTB");
  console.log("   Decimals: 18");
  console.log("\n🚀 Now you can:");
  console.log("   1. Add tokens to MetaMask (instructions below)");
  console.log("   2. Go to http://localhost:3001/swap");
  console.log("   3. Start trading!");
  console.log("=" .repeat(60));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Error:", error);
    process.exit(1);
  });
