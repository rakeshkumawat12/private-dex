import { network } from "hardhat";

const { ethers } = await network.connect();

async function main() {
  const address = "0xe68C17C8a4e782e27038d189E1fE8b3a4546c9b9";

  console.log("Checking balance for:", address);
  console.log("Network:", network.name);

  const balance = await ethers.provider.getBalance(address);
  const balanceInEth = ethers.formatEther(balance);

  console.log("\n💰 Balance:", balanceInEth, "ETH");

  if (Number(balanceInEth) === 0) {
    console.log("\n❌ No funds! You need to get test ETH from a faucet:");
    console.log("   - https://sepoliafaucet.com/");
    console.log("   - https://www.infura.io/faucet/sepolia");
    console.log("   - https://faucet.quicknode.com/ethereum/sepolia");
  } else if (Number(balanceInEth) < 0.1) {
    console.log("\n⚠️  Low balance! You may want to get more test ETH");
  } else {
    console.log("\n✅ Sufficient balance for deployment!");
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Error:", error);
    process.exit(1);
  });
