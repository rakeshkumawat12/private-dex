import { network } from "hardhat";

const { ethers } = await network.connect();

async function main() {
  const WETH_ADDRESS = "0x35287D9fDb7a1E7CC2212Fd1d57F8ae71cCA030A";
  const USDC_ADDRESS = "0x01134D4D7A522a5d601413dD3Bf33859B193063e";
  const YOUR_WALLET = "0xe68C17C8a4e782e27038d189E1fE8b3a4546c9b9";

  const weth = await ethers.getContractAt("MockERC20", WETH_ADDRESS);
  const usdc = await ethers.getContractAt("MockERC20", USDC_ADDRESS);

  const wethBalance = await weth.balanceOf(YOUR_WALLET);
  const usdcBalance = await usdc.balanceOf(YOUR_WALLET);

  console.log("\n💰 Token Balances for:", YOUR_WALLET);
  console.log("=====================================");
  console.log("WETH:", ethers.formatEther(wethBalance), "WETH");
  console.log("USDC:", ethers.formatUnits(usdcBalance, 6), "USDC");
  console.log("=====================================\n");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
