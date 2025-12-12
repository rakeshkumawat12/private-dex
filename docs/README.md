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

| Contract | Address |
|----------|---------|
| WhitelistManager | `0x3B0CD801d3F0f3F5C69905e7D3bfE225A994469F` |
| Factory | `0x01DD4b85b88DE66d1d632a799944249da7c58B9A` |
| Router | `0xc0aeB8bc024b95De284ADe61AF00c436181870d9` |
| Token A (Test) | `0x0ae33C217fd0BE9D23d1596309095E816ac9e41a` |
| Token B (Test) | `0x2EecA34C81d95d578D22A9102d40A8FF57C0AE5F` |

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
