# Smart Contracts Documentation

This section covers all smart contracts in the VΛULT Private DEX protocol.

## Overview

The protocol consists of four main contracts:

| Contract | Purpose | Key Features |
|----------|---------|--------------|
| [WhitelistManager](./WHITELIST_MANAGER.md) | Access Control | Global whitelist, emergency pause |
| [Factory](./FACTORY.md) | Pair Management | Create pairs, track deployments |
| [Router](./ROUTER.md) | User Interface | Swaps, liquidity operations |
| [Pair](./PAIR.md) | AMM Logic | LP tokens, constant product |

## Contract Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                       WhitelistManager                          │
│                     (Global Access Control)                     │
└───────────────────────────┬─────────────────────────────────────┘
                            │
            ┌───────────────┼───────────────┐
            │               │               │
            ▼               ▼               ▼
    ┌───────────────┐ ┌───────────────┐ ┌───────────────┐
    │    Factory    │ │    Router     │ │     Pair      │
    │ (Creates Pairs)│ │ (User Ops)   │ │  (AMM Pool)   │
    └───────────────┘ └───────────────┘ └───────────────┘
```

## Deployed Addresses (Sepolia)

```solidity
// Core Contracts
WhitelistManager: 0x3B0CD801d3F0f3F5C69905e7D3bfE225A994469F
Factory:          0x01DD4b85b88DE66d1d632a799944249da7c58B9A
Router:           0xc0aeB8bc024b95De284ADe61AF00c436181870d9

// Test Tokens
Token A:          0x0ae33C217fd0BE9D23d1596309095E816ac9e41a
Token B:          0x2EecA34C81d95d578D22A9102d40A8FF57C0AE5F
```

## Compilation

```bash
cd smart-contracts
npm install
npx hardhat compile
```

## Testing

The test suite includes 58 comprehensive tests covering all functionality.

```bash
# Run all tests
npx hardhat test

# Run specific test file
npx hardhat test test/WhitelistManager.test.ts

# Run with gas reporting
REPORT_GAS=true npx hardhat test

# Run with coverage
npx hardhat coverage
```

### Test Coverage Areas

- WhitelistManager: Add/remove addresses, pause mechanism
- Factory: Pair creation, duplicate prevention
- Router: Swaps, liquidity operations, slippage protection
- Pair: AMM logic, LP token minting/burning

## Deployment

### Local Development

```bash
# Start local node
npx hardhat node

# Deploy to local
npx hardhat run scripts/deploy.ts --network localhost
```

### Testnet (Sepolia)

```bash
# Configure .env with SEPOLIA_RPC_URL and SEPOLIA_PRIVATE_KEY

# Deploy
npx hardhat run scripts/deploy.ts --network sepolia
```

## Key Concepts

### Automated Market Maker (AMM)

The protocol uses the constant product formula:

```
x * y = k

Where:
- x = Reserve of Token A
- y = Reserve of Token B
- k = Constant (increases with fees)
```

### Trading Fees

- **Fee Rate**: 0.3% per swap
- **Distribution**: 100% to liquidity providers
- **Mechanism**: Fees increase the `k` constant

### Liquidity Provision

When adding liquidity:
1. User deposits both tokens in the current ratio
2. LP tokens are minted proportionally
3. LP tokens represent share of the pool

When removing liquidity:
1. User burns LP tokens
2. Receives proportional share of both tokens
3. Includes accumulated fees

### Minimum Liquidity

The first liquidity provider must deposit enough to mint at least 1000 wei of LP tokens. This prevents manipulation of the initial price.

## Security Features

### Access Control
- `onlyOwner` modifier on admin functions
- Whitelist verification on all DEX operations

### Reentrancy Protection
- `nonReentrant` modifier on state-changing functions
- Checks-Effects-Interactions pattern

### Slippage Protection
- Minimum output amount parameters
- Transaction deadline checks

### Emergency Controls
- Pausable whitelist system
- Owner can halt all operations

## Gas Optimization

| Operation | Estimated Gas |
|-----------|---------------|
| addToWhitelist | ~50,000 |
| createPair | ~2,500,000 |
| addLiquidity | ~150,000 |
| swap | ~100,000 |

## Interfaces

All contracts implement interfaces for composability:

```solidity
interface IWhitelistManager {
    function isWhitelisted(address account) external view returns (bool);
    function isWhitelistedAndActive(address account) external view returns (bool);
}

interface IFactory {
    function getPair(address tokenA, address tokenB) external view returns (address);
    function createPair(address tokenA, address tokenB) external returns (address);
}

interface IPair {
    function getReserves() external view returns (uint112, uint112, uint32);
    function swap(uint amount0Out, uint amount1Out, address to) external;
}
```

## Events

All state changes emit events for off-chain tracking:

```solidity
// WhitelistManager
event AddressWhitelisted(address indexed account);
event AddressRemovedFromWhitelist(address indexed account);

// Factory
event PairCreated(address indexed token0, address indexed token1, address pair, uint);

// Pair
event Mint(address indexed sender, uint amount0, uint amount1);
event Burn(address indexed sender, uint amount0, uint amount1, address indexed to);
event Swap(address indexed sender, uint amount0In, uint amount1In, uint amount0Out, uint amount1Out, address indexed to);
```

## Upgradeability

The current contracts are **not upgradeable**. This is intentional for:
- Security (no proxy vulnerabilities)
- Transparency (code is immutable)
- Trust (users know exactly what they interact with)

For upgrades, new contracts must be deployed and users must migrate.

## Audit Status

⚠️ **These contracts have not been formally audited.**

Before mainnet deployment, we recommend:
1. Professional security audit
2. Bug bounty program
3. Gradual rollout with caps
