import { network } from "hardhat";

const { ethers } = await network.connect();

async function main() {
  const [deployer] = await ethers.getSigners();
  
  console.log("\n💰 Minting Test Tokens to:", deployer.address);
  console.log("=".repeat(50));
  
  const TOKENS = {
    WETH: { address: "0x35287D9fDb7a1E7CC2212Fd1d57F8ae71cCA030A", decimals: 18, amount: "100" },
    USDC: { address: "0x01134D4D7A522a5d601413dD3Bf33859B193063e", decimals: 6, amount: "100000" },
    DAI: { address: "0x64c178393Bbe0cAe2a78A19c58e9B3944c2D5B42", decimals: 18, amount: "100000" },
    USDT: { address: "0x5ccE1Fda0efe9A51302B3F26E3ca0d672536c2F7", decimals: 6, amount: "100000" },
  };
  
  for (const [name, token] of Object.entries(TOKENS)) {
    const contract = await ethers.getContractAt("MockERC20", token.address);
    const amount = ethers.parseUnits(token.amount, token.decimals);
    
    // Check current balance
    const balanceBefore = await contract.balanceOf(deployer.address);
    console.log("\n" + name + ":");
    console.log("  Current balance:", ethers.formatUnits(balanceBefore, token.decimals));
    
    // Mint tokens
    console.log("  Minting " + token.amount + " " + name + "...");
    const tx = await contract.mint(deployer.address, amount);
    await tx.wait();
    
    // Check new balance
    const balanceAfter = await contract.balanceOf(deployer.address);
    console.log("  New balance:", ethers.formatUnits(balanceAfter, token.decimals));
  }
  
  console.log("\n✅ Done! You now have test tokens in your wallet.");
}

main().then(() => process.exit(0)).catch(console.error);
