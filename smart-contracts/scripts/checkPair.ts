import { network } from "hardhat";

const { ethers } = await network.connect();

async function main() {
  const FACTORY_ADDRESS = "0xC36EE51C750F6290977D212FEE5C0Af95Fc3bC57";
  const WETH = "0x35287D9fDb7a1E7CC2212Fd1d57F8ae71cCA030A";
  const USDT = "0x5ccE1Fda0efe9A51302B3F26E3ca0d672536c2F7";

  const factory = await ethers.getContractAt("Factory", FACTORY_ADDRESS);
  const pairAddress = await factory.getPair(WETH, USDT);

  console.log("\nWETH/USDT Pair Address:", pairAddress);
  
  if (pairAddress === "0x0000000000000000000000000000000000000000") {
    console.log("❌ This pair does NOT exist yet!");
    console.log("\nIf someone tries to add liquidity:");
    console.log("1. The Router will call Factory.createPair()");
    console.log("2. A new Pair contract will be deployed");
    console.log("3. Then liquidity will be added to the new pool");
  } else {
    console.log("✅ This pair EXISTS!");
  }
}

main().then(() => process.exit(0)).catch(console.error);
