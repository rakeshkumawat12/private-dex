import { ethers } from "hardhat";

async function main() {
  const FACTORY_ADDRESS = "0xC36EE51C750F6290977D212FEE5C0Af95Fc3bC57";

  const factory = await ethers.getContractAt("PrivateDEXFactory", FACTORY_ADDRESS);
  const allPairsLength = await factory.allPairsLength();

  console.log("\n📊 Total Pools:", allPairsLength.toString());
  console.log("================================\n");

  for (let i = 0; i < allPairsLength; i++) {
    const pairAddress = await factory.allPairs(i);
    console.log("Pool " + (i + 1) + ": " + pairAddress);
  }
}

main().then(() => process.exit(0)).catch(console.error);
