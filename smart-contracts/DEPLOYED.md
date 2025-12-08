# Deployed Contracts - Sepolia Testnet

## Contract Addresses

```
WhitelistManager: 0xf85b33a94947F55f84B0228008C5CFd47a42B7EC
Factory:          0xE3a3eBF9458913Fb214b6f7d3ECf04fdF4B00F2a
Router:           0x4258A353E95428646bE249c795DC7891f4CFd1c1
Token A (Test):   0x3380f8feFD7A89B0a0C611fE486e884799B9Bd17
Token B (Test):   0xbb7b45e5f6F2876CF86899c4FdBf23b5dd858988
Pair (A-B):       0x2612151a8DD985BDFef0C998C4690D8aC2aD467A
```

## Etherscan Links

- [WhitelistManager](https://sepolia.etherscan.io/address/0xf85b33a94947F55f84B0228008C5CFd47a42B7EC)
- [Factory](https://sepolia.etherscan.io/address/0xE3a3eBF9458913Fb214b6f7d3ECf04fdF4B00F2a)
- [Router](https://sepolia.etherscan.io/address/0x4258A353E95428646bE249c795DC7891f4CFd1c1)
- [Token A](https://sepolia.etherscan.io/address/0x3380f8feFD7A89B0a0C611fE486e884799B9Bd17)
- [Token B](https://sepolia.etherscan.io/address/0xbb7b45e5f6F2876CF86899c4FdBf23b5dd858988)
- [Pair](https://sepolia.etherscan.io/address/0x2612151a8DD985BDFef0C998C4690D8aC2aD467A)

## Quick Start Commands

### 1. Check Your Balance
```bash
npm run balance:sepolia
```

### 2. Mint Test Tokens & Add Liquidity
```bash
npm run mint:sepolia
```

This will:
- Mint 1000 Token A
- Mint 1000 Token B
- Approve Router to spend tokens
- Add 100 Token A and 200 Token B as liquidity
- Show your LP token balance

### 3. Swap Tokens
```bash
npm run swap:sepolia
```

This will swap 10 Token A for Token B

### 4. Add Address to Whitelist
```bash
npm run whitelist:sepolia
```

Edit `scripts/addToWhitelist.ts` first to set the address you want to whitelist.

### 5. Interact with Contracts
```bash
npm run interact
```

## Manual Interaction Examples

### Using Hardhat Console

```bash
npx hardhat console --network sepolia
```

Then in the console:

#### Mint Tokens
```javascript
const tokenA = await ethers.getContractAt("MockERC20", "0x3380f8feFD7A89B0a0C611fE486e884799B9Bd17");
await tokenA.mint("YOUR_ADDRESS", ethers.parseEther("1000"));
```

#### Add to Whitelist
```javascript
const wl = await ethers.getContractAt("WhitelistManager", "0xf85b33a94947F55f84B0228008C5CFd47a42B7EC");
await wl.addToWhitelist("ADDRESS_TO_WHITELIST");
```

#### Check if Whitelisted
```javascript
const wl = await ethers.getContractAt("WhitelistManager", "0xf85b33a94947F55f84B0228008C5CFd47a42B7EC");
const isWhitelisted = await wl.isWhitelisted("ADDRESS");
console.log(isWhitelisted);
```

#### Get Pool Reserves
```javascript
const pair = await ethers.getContractAt("Pair", "0x2612151a8DD985BDFef0C998C4690D8aC2aD467A");
const [reserve0, reserve1] = await pair.getReserves();
console.log("Reserve 0:", ethers.formatEther(reserve0));
console.log("Reserve 1:", ethers.formatEther(reserve1));
```

#### Create New Pair
```javascript
const factory = await ethers.getContractAt("Factory", "0xE3a3eBF9458913Fb214b6f7d3ECf04fdF4B00F2a");
await factory.createPair(TOKEN_X_ADDRESS, TOKEN_Y_ADDRESS);
const pairAddr = await factory.getPair(TOKEN_X_ADDRESS, TOKEN_Y_ADDRESS);
console.log("Pair created at:", pairAddr);
```

## Deployment Info

- **Network**: Sepolia Testnet
- **Deployer**: 0xe68C17C8a4e782e27038d189E1fE8b3a4546c9b9
- **Date**: December 2024
- **Solidity Version**: 0.8.28
- **Hardhat Version**: 3.0.7

## Configuration Status

✅ Deployer is whitelisted
✅ Router is whitelisted
✅ Test pair created (Token A / Token B)
✅ System operational

## Security Notes

⚠️ **These are TEST tokens on Sepolia testnet**
- Do NOT send real ETH to these addresses
- Do NOT use these contracts on mainnet without audit
- Test tokens can be minted by anyone (MockERC20)
- Only whitelisted addresses can interact with the DEX

## Need Help?

Check the main [README.md](./README.md) for:
- Architecture overview
- Detailed usage examples
- Security features
- Troubleshooting guide
