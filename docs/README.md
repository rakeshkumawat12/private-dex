# VΛULT - Private DEX Documentation

> Permissioned liquidity. Zero trust. Maximum sovereignty.

Welcome to the official documentation for VΛULT, a permissioned decentralized exchange (DEX) built on Ethereum. This documentation covers everything you need to understand, deploy, and contribute to the project.

## Table of Contents

### Getting Started
- [Quick Start Guide](./guides/QUICKSTART.md)
- [Project Overview](#project-overview)
- [Architecture](./ARCHITECTURE.md)

### Technical Documentation
- [Smart Contracts](./smart-contracts/README.md)
  - [WhitelistManager](./smart-contracts/WHITELIST_MANAGER.md)
  - [Factory](./smart-contracts/FACTORY.md)
  - [Router](./smart-contracts/ROUTER.md)
  - [Pair](./smart-contracts/PAIR.md)
- [Frontend](./frontend/README.md)
- [API Reference](./api/README.md)

### Deployment & Operations
- [Deployment Guide](./deployment/README.md)

### Security
- [Security Overview](./security/README.md)

### Contributing
- [Contributing Guide](./guides/CONTRIBUTING.md)

---

## Project Overview

VΛULT is a **permissioned Automated Market Maker (AMM)** DEX that implements a global whitelist for access control. Unlike traditional DEXes where anyone can participate, VΛULT requires users to be explicitly whitelisted before they can:

- Swap tokens
- Provide liquidity
- Remove liquidity
- Interact with any DEX contracts

### Why Permissioned?

| Feature | Public DEX | VΛULT (Permissioned) |
|---------|-----------|---------------------|
| Access | Anyone | Whitelisted only |
| Compliance | None | KYC/AML capable |
| Control | None | Full admin control |
| Use Cases | Retail | Institutional, Private |

### Core Features

1. **Whitelisted Trading** - Only approved addresses can trade
2. **AMM Protocol** - Constant product formula (x * y = k)
3. **Liquidity Provision** - Earn 0.3% trading fees
4. **LP Tokens** - ERC20 tokens representing pool shares
5. **Emergency Controls** - Pausable whitelist system
6. **Admin Dashboard** - Manage whitelist requests
7. **Token Faucet** - One-click test token minting for easy testing

---

## Tech Stack

### Blockchain Layer
| Technology | Version | Purpose |
|------------|---------|---------|
| Solidity | 0.8.28 | Smart contract language |
| Hardhat | 3.x | Development framework |
| OpenZeppelin | 5.x | Security libraries |
| Ethers.js | 6.x | Ethereum interactions |

### Frontend Layer
| Technology | Version | Purpose |
|------------|---------|---------|
| Next.js | 16.x | React framework |
| React | 19.x | UI library |
| TypeScript | 5.x | Type safety |
| Tailwind CSS | 4.x | Styling |
| Wagmi | 2.x | Web3 React hooks |
| Viem | 2.x | Ethereum library |
| RainbowKit | 2.x | Wallet connection |

### Backend Layer
| Technology | Purpose |
|------------|---------|
| Next.js API Routes | REST API |
| Supabase | PostgreSQL database |

---

## Deployed Contracts (Sepolia Testnet)

| Contract | Address | Explorer |
|----------|---------|----------|
| WhitelistManager | `0x9Dc786Ad986e1d4cb1E85e4469E8443efCBfAD2E` | [View on Blockscout](https://eth-sepolia.blockscout.com/address/0x9Dc786Ad986e1d4cb1E85e4469E8443efCBfAD2E) |
| Factory | `0xC36EE51C750F6290977D212FEE5C0Af95Fc3bC57` | [View on Blockscout](https://eth-sepolia.blockscout.com/address/0xC36EE51C750F6290977D212FEE5C0Af95Fc3bC57) |
| Router | `0x05b6B7d9cE4BA0f12040664167b34382E050eC87` | [View on Blockscout](https://eth-sepolia.blockscout.com/address/0x05b6B7d9cE4BA0f12040664167b34382E050eC87) |

### Test Tokens

| Token | Address | Explorer |
|-------|---------|----------|
| WETH (Wrapped Ether) | `0x35287D9fDb7a1E7CC2212Fd1d57F8ae71cCA030A` | [View on Blockscout](https://eth-sepolia.blockscout.com/address/0x35287D9fDb7a1E7CC2212Fd1d57F8ae71cCA030A) |
| USDC (USD Coin) | `0x01134D4D7A522a5d601413dD3Bf33859B193063e` | [View on Blockscout](https://eth-sepolia.blockscout.com/address/0x01134D4D7A522a5d601413dD3Bf33859B193063e) |
| DAI (Dai Stablecoin) | `0x64c178393Bbe0cAe2a78A19c58e9B3944c2D5B42` | [View on Blockscout](https://eth-sepolia.blockscout.com/address/0x64c178393Bbe0cAe2a78A19c58e9B3944c2D5B42) |
| USDT (Tether USD) | `0x5ccE1Fda0efe9A51302B3F26E3ca0d672536c2F7` | [View on Blockscout](https://eth-sepolia.blockscout.com/address/0x5ccE1Fda0efe9A51302B3F26E3ca0d672536c2F7) |

### Active Liquidity Pools

| Pool | Address | Initial Liquidity |
|------|---------|------------------|
| WETH/USDC | `0xcC885a0801eEA25E53daAD94008CF89B4299D208` | 100 WETH / 200,000 USDC |
| WETH/DAI | `0xc6E56F5e6Af03535180f9ad416942a557DCFeEd2` | 50 WETH / 100,000 DAI |
| USDC/USDT | `0xf2cb6319FC611447A4A37091877658DbEf121c29` | 100,000 USDC / 100,000 USDT |
| DAI/USDT | `0xD21800b9587c761De6C07342c1f9E3f7ebb8cd90` | 100,000 DAI / 100,000 USDT |

---

## Project Structure

```
private-dex/
├── docs/                      # Documentation (you are here)
├── smart-contracts/           # Solidity contracts
│   ├── contracts/
│   │   ├── access/           # WhitelistManager
│   │   ├── core/             # Factory, Router, Pair
│   │   ├── interfaces/       # Contract interfaces
│   │   ├── libraries/        # Math utilities
│   │   └── tokens/           # Test tokens
│   ├── scripts/              # Deployment scripts
│   ├── test/                 # Test suite
│   └── hardhat.config.ts
└── frontend/                  # Next.js application
    ├── app/                  # Pages (App Router)
    │   ├── api/              # API routes
    │   ├── admin/            # Admin dashboard
    │   ├── swap/             # Token swap
    │   ├── liquidity/        # Liquidity management
    │   ├── faucet/           # Token faucet
    │   ├── whitelist/        # Request access
    │   └── stats/            # Analytics
    ├── components/           # React components
    ├── lib/                  # Utilities
    └── hooks/                # Custom hooks
```

---

## Quick Links

- **Live Application**: [Your Vercel URL]
- **Sepolia Etherscan**: [View Contracts](https://sepolia.etherscan.io)
- **GitHub Repository**: [rakeshkumawat12/private-dex](https://github.com/rakeshkumawat12/private-dex)

---

## License

This project is licensed under the MIT License. See [LICENSE](../LICENSE) for details.

---

## Support

For questions or issues:
1. Open a GitHub issue
2. Check existing documentation
3. Read the Contributing Guide
