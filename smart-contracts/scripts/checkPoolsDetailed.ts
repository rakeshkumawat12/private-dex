import { network } from "hardhat";

const { ethers } = await network.connect();

async function main() {
  const FACTORY_ADDRESS = "0xC36EE51C750F6290977D212FEE5C0Af95Fc3bC57";
  const WHITELIST_ADDRESS = "0x9Dc786Ad986e1d4cb1E85e4469E8443efCBfAD2E";
  
  const TOKENS = {
    WETH: { address: "0x35287D9fDb7a1E7CC2212Fd1d57F8ae71cCA030A", decimals: 18 },
    USDC: { address: "0x01134D4D7A522a5d601413dD3Bf33859B193063e", decimals: 6 },
    DAI: { address: "0x64c178393Bbe0cAe2a78A19c58e9B3944c2D5B42", decimals: 18 },
    USDT: { address: "0x5ccE1Fda0efe9A51302B3F26E3ca0d672536c2F7", decimals: 6 },
  };

  const factory = await ethers.getContractAt("Factory", FACTORY_ADDRESS);
  const whitelist = await ethers.getContractAt("WhitelistManager", WHITELIST_ADDRESS);
  
  // Check owner
  const owner = await whitelist.owner();
  console.log("\n👑 OWNER/ADMIN:", owner);
  console.log("   (This wallet can whitelist other addresses)\n");
  
  // Check who is whitelisted
  console.log("📋 WHITELIST STATUS:");
  console.log("====================");
  const isOwnerWhitelisted = await whitelist.isWhitelisted(owner);
  console.log("Owner whitelisted:", isOwnerWhitelisted);
  
  const routerAddress = "0x05b6B7d9cE4BA0f12040664167b34382E050eC87";
  const isRouterWhitelisted = await whitelist.isWhitelisted(routerAddress);
  console.log("Router whitelisted:", isRouterWhitelisted);
  
  // Check all pools and their liquidity
  console.log("\n💧 POOL LIQUIDITY STATUS:");
  console.log("=========================\n");
  
  const pairs = [
    { name: "WETH/USDC", tokenA: "WETH", tokenB: "USDC" },
    { name: "WETH/DAI", tokenA: "WETH", tokenB: "DAI" },
    { name: "USDC/USDT", tokenA: "USDC", tokenB: "USDT" },
    { name: "DAI/USDT", tokenA: "DAI", tokenB: "USDT" },
  ];
  
  for (const pair of pairs) {
    const tokenA = TOKENS[pair.tokenA as keyof typeof TOKENS];
    const tokenB = TOKENS[pair.tokenB as keyof typeof TOKENS];
    
    const pairAddress = await factory.getPair(tokenA.address, tokenB.address);
    
    if (pairAddress === "0x0000000000000000000000000000000000000000") {
      console.log(pair.name + ": ❌ Pool does not exist");
    } else {
      const pairContract = await ethers.getContractAt("Pair", pairAddress);
      const reserves = await pairContract.getReserves();
      const totalSupply = await pairContract.totalSupply();
      
      const reserve0 = ethers.formatUnits(reserves[0], tokenA.decimals);
      const reserve1 = ethers.formatUnits(reserves[1], tokenB.decimals);
      const lpSupply = ethers.formatUnits(totalSupply, 18);
      
      const hasLiquidity = Number(reserve0) > 0 && Number(reserve1) > 0;
      
      console.log(pair.name + ":");
      console.log("  Address: " + pairAddress);
      console.log("  " + pair.tokenA + " Reserve: " + reserve0);
      console.log("  " + pair.tokenB + " Reserve: " + reserve1);
      console.log("  LP Supply: " + lpSupply);
      console.log("  Status: " + (hasLiquidity ? "✅ HAS LIQUIDITY" : "❌ NO LIQUIDITY"));
      console.log("");
    }
  }
}

main().then(() => process.exit(0)).catch(console.error);
