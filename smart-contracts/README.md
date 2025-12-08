# Private Whitelisted DEX

A production-ready private decentralized exchange (DEX) with access control, built on Ethereum using Solidity and Hardhat.

## Overview

This DEX implements an **Automated Market Maker (AMM)** using the constant product formula (x * y = k), similar to Uniswap V2, with an additional whitelist layer for access control. Only whitelisted addresses can trade, provide liquidity, or create trading pairs.

### Key Features

- **Global Whitelist System**: Admin-controlled access management for all DEX operations
- **AMM Mechanism**: Constant product formula for automated pricing
- **Liquidity Pools**: Add/remove liquidity and earn 0.3% trading fees
- **Token Swaps**: Exchange tokens with slippage protection
- **LP Tokens**: Standard ERC20 tokens representing pool ownership
- **Emergency Controls**: Pausable functionality for security
- **Gas Optimized**: Built with Solidity 0.8.28 and compiler optimizations

## Architecture

```
contracts/
├── core/
│   ├── Factory.sol      # Creates and manages trading pairs
│   ├── Router.sol       # Main user-facing interface
│   └── Pair.sol         # LP token + AMM logic
├── access/
│   └── WhitelistManager.sol  # Access control
├── tokens/
│   └── MockERC20.sol    # Test tokens
├── libraries/
│   └── Math.sol         # AMM calculations
└── interfaces/
    ├── IFactory.sol
    ├── IPair.sol
    └── IWhitelistManager.sol
```

### Contract Roles

1. **WhitelistManager**: Manages the global whitelist of approved addresses
2. **Factory**: Deploys new Pair contracts for token pairs
3. **Router**: Safe interface for adding/removing liquidity and swapping tokens
4. **Pair**: Holds liquidity reserves, mints LP tokens, executes swaps

## Getting Started

### Prerequisites

- Node.js >= 18.x
- npm or yarn
- An Ethereum wallet with testnet ETH (for Sepolia deployment)

### Installation

```bash
# Clone the repository
git clone <your-repo-url>
cd smart-contracts

# Install dependencies
npm install
```

### Configuration

Create a `.env` file for Sepolia deployment (optional):

```bash
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_INFURA_KEY
SEPOLIA_PRIVATE_KEY=your_private_key_here
```

### Compile Contracts

```bash
npm run compile
```

### Run Tests

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage
```

**Test Results**: 58 passing tests covering all contract functionality

## Deployment

### Local Deployment (Hardhat Network)

```bash
# Terminal 1: Start local node
npm run node

# Terminal 2: Deploy contracts
npm run deploy:local
```

### Sepolia Testnet Deployment

```bash
# Make sure .env is configured with SEPOLIA_RPC_URL and SEPOLIA_PRIVATE_KEY
npm run deploy:sepolia
```

### Deployment Output

The deployment script will:
1. Deploy WhitelistManager
2. Deploy Factory (with whitelist reference)
3. Deploy Router (with factory and whitelist)
4. Deploy test tokens (MockERC20)
5. Create an initial trading pair
6. Whitelist the deployer and router
7. Print all contract addresses

Save these addresses for interaction!

## Usage Examples

### 1. Whitelist Management

```javascript
const whitelistManager = await ethers.getContractAt("WhitelistManager", WHITELIST_ADDRESS);

// Add single address
await whitelistManager.addToWhitelist(userAddress);

// Add multiple addresses
await whitelistManager.batchAddToWhitelist([addr1, addr2, addr3]);

// Check if whitelisted
const isWhitelisted = await whitelistManager.isWhitelisted(userAddress);

// Emergency pause
await whitelistManager.pause();
await whitelistManager.unpause();
```

### 2. Create Trading Pair

```javascript
const factory = await ethers.getContractAt("Factory", FACTORY_ADDRESS);

// Create pair for Token A and Token B
await factory.createPair(tokenAAddress, tokenBAddress);

// Get pair address
const pairAddress = await factory.getPair(tokenAAddress, tokenBAddress);
```

### 3. Add Liquidity

```javascript
const router = await ethers.getContractAt("Router", ROUTER_ADDRESS);

// Approve tokens
await tokenA.approve(routerAddress, amountA);
await tokenB.approve(routerAddress, amountB);

// Add liquidity
const deadline = Math.floor(Date.now() / 1000) + 3600; // 1 hour
await router.addLiquidity(
  tokenAAddress,
  tokenBAddress,
  amountA,                    // Amount of token A
  amountB,                    // Amount of token B
  amountAMin,                 // Min A (slippage protection)
  amountBMin,                 // Min B (slippage protection)
  recipientAddress,
  deadline
);
```

### 4. Remove Liquidity

```javascript
// Approve LP tokens
const pair = await ethers.getContractAt("Pair", pairAddress);
await pair.approve(routerAddress, lpTokenAmount);

// Remove liquidity
await router.removeLiquidity(
  tokenAAddress,
  tokenBAddress,
  lpTokenAmount,
  amountAMin,
  amountBMin,
  recipientAddress,
  deadline
);
```

### 5. Swap Tokens

```javascript
// Approve input token
await tokenA.approve(routerAddress, swapAmount);

// Swap exact tokens for tokens
await router.swapExactTokensForTokens(
  swapAmount,                          // Exact input amount
  minOutputAmount,                     // Min output (slippage)
  [tokenAAddress, tokenBAddress],      // Swap path
  recipientAddress,
  deadline
);

// OR swap tokens for exact tokens
await router.swapTokensForExactTokens(
  exactOutputAmount,                   // Exact output amount
  maxInputAmount,                      // Max input (slippage)
  [tokenAAddress, tokenBAddress],      // Swap path
  recipientAddress,
  deadline
);
```

### 6. Query Pool Information

```javascript
const pair = await ethers.getContractAt("Pair", pairAddress);

// Get reserves
const [reserve0, reserve1] = await pair.getReserves();

// Get LP token balance
const lpBalance = await pair.balanceOf(userAddress);

// Calculate price
const price = reserve1 / reserve0;  // Token1 per Token0
```

## Interaction Script

Use the provided interaction script for common operations:

```bash
# Edit scripts/interact.ts with your deployed addresses
# Then run:
npm run interact
```

The script provides functions for:
- Viewing balances
- Adding/removing liquidity
- Swapping tokens
- Viewing pool information
- Managing whitelist

## Security Features

### Access Control
- Only whitelisted addresses can interact with the DEX
- Owner-only functions for whitelist management
- Pausable system for emergencies

### AMM Safety
- Reentrancy guards on all state-changing functions
- Slippage protection on swaps and liquidity operations
- Deadline checks to prevent stale transactions
- K invariant validation on every swap

### Code Quality
- Solidity 0.8.28 (built-in overflow protection)
- OpenZeppelin contracts for security standards
- Comprehensive test coverage (58 tests)
- Gas optimizations enabled

## Fee Structure

- **Trading Fee**: 0.3% per swap
- **Fee Distribution**: All fees go to liquidity providers
- **LP Token Burn**: 1000 wei (MINIMUM_LIQUIDITY) permanently locked on first deposit

## Testing

The test suite covers:

1. **WhitelistManager** (22 tests)
   - Deployment, ownership
   - Adding/removing addresses
   - Batch operations
   - Pause functionality

2. **Factory** (16 tests)
   - Pair creation
   - Duplicate prevention
   - Whitelist enforcement

3. **Router & Pair** (20 tests)
   - Adding/removing liquidity
   - Token swaps (exact in/out)
   - Slippage protection
   - K invariant maintenance
   - Quote calculations

```bash
npm test
```

## Gas Optimization

The contracts are optimized for gas efficiency:
- Compiler optimization: 200 runs (development), 800 runs (production)
- Immutable variables where possible
- Efficient storage patterns
- Minimal external calls

## Troubleshooting

### Common Issues

**"Router: expired"**
- Transaction deadline has passed
- Solution: Use `Math.floor(Date.now() / 1000) + 3600` for deadline

**"Router: insufficient output amount"**
- Slippage too high
- Solution: Increase `amountOutMin` or split into smaller swaps

**"Factory/Router: not whitelisted"**
- Address not on whitelist
- Solution: Add address using `WhitelistManager.addToWhitelist()`

**"Pair: K"**
- K invariant violated (should never happen in production)
- Solution: This indicates a critical error - contact support

## Development

### Project Structure

```
smart-contracts/
├── contracts/          # Solidity contracts
├── test/              # Test files
├── scripts/           # Deployment & interaction scripts
├── hardhat.config.ts  # Hardhat configuration
└── package.json       # Dependencies & scripts
```

### Available Scripts

```bash
npm run compile        # Compile contracts
npm test              # Run tests
npm run test:coverage # Run tests with coverage
npm run node          # Start local Hardhat node
npm run deploy:local  # Deploy to local node
npm run deploy:sepolia # Deploy to Sepolia
npm run interact      # Run interaction script
npm run clean         # Clean artifacts
```

## License

MIT

## Contributing

Pull requests are welcome! Please ensure:
1. All tests pass
2. Code follows existing style
3. New features have tests
4. Documentation is updated

## Support

For issues, questions, or contributions, please open an issue on GitHub.

---

**Built with**:
- Solidity ^0.8.20
- Hardhat 3.x
- OpenZeppelin Contracts 5.x
- TypeScript
- Ethers.js v6

📊 Visual Flow

  1. Initial Pool Creation
     ┌──────────────────┐
     │  Empty Pool      │
     │  USDC: 0         │
     │  ETH:  0         │
     └──────────────────┘

  2. Bob Adds Liquidity
     ┌──────────────────┐
     │  Pool Active     │
     │  USDC: 10,000    │
     │  ETH:  5         │
     │  K = 50,000      │
     └──────────────────┘
          ↓
     Bob gets 222 LP tokens

  3. Alice Swaps 1000 USDC → ETH
     ┌──────────────────┐
     │  Pool Updated    │
     │  USDC: 11,000    │
     │  ETH:  4.547     │
     │  K = 50,017      │
     └──────────────────┘
          ↓
     Alice gets 0.453 ETH
     Fee: 3 USDC stays in pool

  4. Bob Removes Liquidity
     ┌──────────────────┐
     │  Pool Drained    │
     │  USDC: ~50       │
     │  ETH:  ~0.02     │
     └──────────────────┘
          ↓
     Bob gets 10,950 USDC + 4.527 ETH
     (Profit from trading fees!)