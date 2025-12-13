import { network } from "hardhat";

const { ethers } = await network.connect();

async function main() {
  const WETH_ADDRESS = "0x35287D9fDb7a1E7CC2212Fd1d57F8ae71cCA030A";
  const USDC_ADDRESS = "0x01134D4D7A522a5d601413dD3Bf33859B193063e";

  const WALLET_1 = "0xe68C17C8a4e782e27038d189E1fE8b3a4546c9b9"; // Owner
  const WALLET_2 = "0x24Ed4212a29808D2B11d8D23a1bbBe7f8443ac8C"; // Other wallet

  const weth = await ethers.getContractAt("MockERC20", WETH_ADDRESS);
  const usdc = await ethers.getContractAt("MockERC20", USDC_ADDRESS);

  console.log("\n💰 Checking Both Wallets");
  console.log("=====================================\n");

  // Check Wallet 1
  const weth1 = await weth.balanceOf(WALLET_1);
  const usdc1 = await usdc.balanceOf(WALLET_1);
  console.log("Wallet 1:", WALLET_1);
  console.log("  WETH:", ethers.formatEther(weth1), "WETH");
  console.log("  USDC:", ethers.formatUnits(usdc1, 6), "USDC");
  console.log("");

  // Check Wallet 2
  const weth2 = await weth.balanceOf(WALLET_2);
  const usdc2 = await usdc.balanceOf(WALLET_2);
  console.log("Wallet 2:", WALLET_2);
  console.log("  WETH:", ethers.formatEther(weth2), "WETH");
  console.log("  USDC:", ethers.formatUnits(usdc2, 6), "USDC");
  console.log("");

  console.log("=====================================\n");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
