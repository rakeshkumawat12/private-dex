# Private DEX - Deployment Information

## Deployed Contracts (Sepolia Testnet)

### Core Contracts

**WhitelistManager**
- Address: `0x3B0CD801d3F0f3F5C69905e7D3bfE225A994469F`
- Purpose: Manages access control for the DEX
- [View on Etherscan](https://sepolia.etherscan.io/address/0x3B0CD801d3F0f3F5C69905e7D3bfE225A994469F)

**Factory**
- Address: `0x01DD4b85b88DE66d1d632a799944249da7c58B9A`
- Purpose: Creates and manages trading pairs
- [View on Etherscan](https://sepolia.etherscan.io/address/0x01DD4b85b88DE66d1d632a799944249da7c58B9A)

**Router**
- Address: `0xc0aeB8bc024b95De284ADe61AF00c436181870d9`
- Purpose: Main user-facing interface for swaps and liquidity
- [View on Etherscan](https://sepolia.etherscan.io/address/0xc0aeB8bc024b95De284ADe61AF00c436181870d9)

### Test Tokens

**Test Token A (TSTA)**
- Address: `0x0ae33C217fd0BE9D23d1596309095E816ac9e41a`
- Symbol: TSTA
- Decimals: 18
- [View on Etherscan](https://sepolia.etherscan.io/address/0x0ae33C217fd0BE9D23d1596309095E816ac9e41a)

**Test Token B (TSTB)**
- Address: `0x2EecA34C81d95d578D22A9102d40A8FF57C0AE5F`
- Symbol: TSTB
- Decimals: 18
- [View on Etherscan](https://sepolia.etherscan.io/address/0x2EecA34C81d95d578D22A9102d40A8FF57C0AE5F)

### Liquidity Pair

**TSTA/TSTB Pair**
- Address: `0xE456D652f42b840951a64ACFd797F2f30724D97f`
- Tokens: TSTA / TSTB
- [View on Etherscan](https://sepolia.etherscan.io/address/0xE456D652f42b840951a64ACFd797F2f30724D97f)

## Deployment Details

- **Network**: Sepolia Testnet
- **Chain ID**: 11155111
- **Deployer**: `0xe68C17C8a4e782e27038d189E1fE8b3a4546c9b9`
- **Deployment Date**: October 22, 2025
- **Block Time**: ~12 seconds

## Whitelisted Addresses

The following addresses are currently whitelisted:

1. **Deployer**: `0xe68C17C8a4e782e27038d189E1fE8b3a4546c9b9`
2. **Router**: `0xc0aeB8bc024b95De284ADe61AF00c436181870d9`

## Getting Test Tokens

### Method 1: Mint from Contract (Owner Only)
If you're the contract owner, you can mint tokens:

```bash
cd smart-contracts
npx hardhat run scripts/mintTokens.ts --network sepolia
```

### Method 2: Request from Deployer
Contact the deployer to:
1. Mint tokens to your address
2. Add your address to the whitelist

### Method 3: Direct Contract Interaction
Using Etherscan:
1. Go to Token contract on Etherscan
2. Connect your wallet
3. Call `mint(address to, uint256 amount)` function

## Using the DEX

### 1. Get Sepolia ETH
Get testnet ETH from faucets:
- https://sepoliafaucet.com/
- https://www.alchemy.com/faucets/ethereum-sepolia

### 2. Get Whitelisted
Contact the deployer (`0xe68C17C8a4e782e27038d189E1fE8b3a4546c9b9`) to:
- Add your address to the whitelist
- Mint test tokens for trading

### 3. Connect Wallet
1. Open the frontend: [Your Deployed URL]
2. Click "Connect Wallet"
3. Select MetaMask
4. Switch to Sepolia network

### 4. Get Test Tokens
Request test tokens from the deployer or mint them if you're authorized.

### 5. Start Trading!
- **Swap**: Exchange tokens instantly
- **Add Liquidity**: Provide liquidity and earn 0.3% fees
- **View Stats**: Monitor pool statistics

## Contract Interactions

### Adding Users to Whitelist

```javascript
// Using Etherscan
1. Go to WhitelistManager contract
2. Connect wallet (must be owner)
3. Call: addToWhitelist(address user)

// Using Hardhat
npx hardhat run scripts/addToWhitelist.ts --network sepolia
```

### Creating New Pairs

```javascript
// Using Factory contract
1. Go to Factory contract on Etherscan
2. Call: createPair(address tokenA, address tokenB)

// Using Hardhat
npx hardhat run scripts/createPair.ts --network sepolia
```

### Adding Liquidity

Use the frontend or interact directly with Router:
```javascript
router.addLiquidity(
  tokenA,
  tokenB,
  amountADesired,
  amountBDesired,
  amountAMin,
  amountBMin,
  to,
  deadline
)
```

## Frontend Configuration

The frontend is already configured with these addresses in:
- `.env.local`
- `lib/contracts.ts`
- All page components (`swap`, `liquidity`, `stats`)

## Important Notes

### Security
- ⚠️ These are TEST contracts on Sepolia testnet
- ⚠️ DO NOT use on mainnet without thorough auditing
- ⚠️ Test tokens have NO real value
- ⚠️ Only whitelisted addresses can interact with the DEX

### Gas Fees
All transactions require Sepolia ETH for gas:
- Approve tokens: ~50,000 gas
- Swap: ~100,000-150,000 gas
- Add liquidity: ~150,000-200,000 gas
- Remove liquidity: ~100,000-150,000 gas

### Transaction Times
- Average block time: ~12 seconds
- Confirmations needed: 1-2 blocks
- Total time per transaction: ~15-30 seconds

## Verification

To verify contracts on Etherscan:

```bash
cd smart-contracts

# Verify WhitelistManager
npx hardhat verify --network sepolia 0x3B0CD801d3F0f3F5C69905e7D3bfE225A994469F

# Verify Factory
npx hardhat verify --network sepolia 0x01DD4b85b88DE66d1d632a799944249da7c58B9A "0x3B0CD801d3F0f3F5C69905e7D3bfE225A994469F"

# Verify Router
npx hardhat verify --network sepolia 0xc0aeB8bc024b95De284ADe61AF00c436181870d9 "0x01DD4b85b88DE66d1d632a799944249da7c58B9A" "0x3B0CD801d3F0f3F5C69905e7D3bfE225A994469F"

# Verify Test Tokens
npx hardhat verify --network sepolia 0x0ae33C217fd0BE9D23d1596309095E816ac9e41a "Test Token A" "TSTA" 18
npx hardhat verify --network sepolia 0x2EecA34C81d95d578D22A9102d40A8FF57C0AE5F "Test Token B" "TSTB" 18
```

## Troubleshooting

### "Not whitelisted" Error
**Solution**: Contact deployer to add your address to the whitelist

### "Insufficient Balance" Error
**Solution**: Get test tokens from deployer or mint them

### "Transaction Failed" Error
**Solutions**:
- Check you have Sepolia ETH for gas
- Verify token approval is complete
- Ensure slippage tolerance is adequate
- Check that you're on the correct network

### Wrong Network
**Solution**:
1. Open MetaMask
2. Click network dropdown
3. Select "Sepolia Test Network"
4. Refresh the page

## Support

For deployment-related issues:
- Check smart-contracts/README.md
- Review transaction on Etherscan
- Contact deployer for whitelist/token requests

## Next Steps

1. ✅ Contracts deployed
2. ✅ Frontend configured
3. ⏭️ Get WalletConnect Project ID
4. ⏭️ Deploy frontend to Vercel
5. ⏭️ Add users to whitelist
6. ⏭️ Mint test tokens for users
7. ⏭️ Test all functionality
8. ⏭️ Verify contracts on Etherscan (optional)

---

**Deployment Complete! 🎉**

Your Private DEX is now live on Sepolia testnet and ready for testing!
