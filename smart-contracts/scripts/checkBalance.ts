import { network } from "hardhat";

const { ethers } = await network.connect();

async function main() {
  const WETH_ADDRESS = "0x35287D9fDb7a1E7CC2212Fd1d57F8ae71cCA030A";
  const ADDRESS_TO_CHECK = "0x24ed4212a29808d2b11d8d23a1bbbe7f8443ac8c";
  
  const weth = await ethers.getContractAt("MockERC20", WETH_ADDRESS);
  const balance = await weth.balanceOf(ADDRESS_TO_CHECK);
  
  console.log("\nWETH Balance for", ADDRESS_TO_CHECK);
  console.log("Balance:", ethers.formatEther(balance), "WETH");
}

main().then(() => process.exit(0)).catch(console.error);
