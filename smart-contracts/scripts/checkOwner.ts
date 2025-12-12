import { network } from "hardhat";

const { ethers } = await network.connect();

async function main() {
  const WHITELIST_MANAGER_ADDRESS = "0x9Dc786Ad986e1d4cb1E85e4469E8443efCBfAD2E";
  
  const whitelistManager = await ethers.getContractAt("WhitelistManager", WHITELIST_MANAGER_ADDRESS);
  const owner = await whitelistManager.owner();
  
  console.log("\n👑 Current Owner/Admin:");
  console.log("======================");
  console.log("Owner address:", owner);
  console.log("");
  console.log("Is 0xe68C17C8a4e782e27038d189E1fE8b3a4546c9b9 the owner?", owner.toLowerCase() === "0xe68C17C8a4e782e27038d189E1fE8b3a4546c9b9".toLowerCase());
  console.log("Is 0x24Ed4212a29808D2B11d8D23a1bbBe7f8443ac8C the owner?", owner.toLowerCase() === "0x24Ed4212a29808D2B11d8D23a1bbBe7f8443ac8C".toLowerCase());
}

main().then(() => process.exit(0)).catch(console.error);
