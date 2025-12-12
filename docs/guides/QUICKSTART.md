# Quick Start Guide

Get the VΛULT Private DEX running in under 10 minutes.

## Prerequisites

- Node.js 18+
- MetaMask wallet with Sepolia ETH
- Git

## 1. Clone & Install

```bash
git clone <repository-url>
cd private-dex

# Install smart contract dependencies
cd smart-contracts && npm install

# Install frontend dependencies
cd ../frontend && npm install
```

## 2. Configure Environment

### Smart Contracts (.env)

```bash
cd smart-contracts
cp .env.example .env
```

Edit `.env`:
```env
SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_KEY
SEPOLIA_PRIVATE_KEY=0xYOUR_PRIVATE_KEY
```

### Frontend (.env.local)

```bash
cd frontend
cp .env.example .env.local
```

Edit `.env.local`:
```env
# WalletConnect (get from cloud.walletconnect.com)
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id

# Contract Addresses (use existing Sepolia deployment)
NEXT_PUBLIC_ROUTER_ADDRESS=0xc0aeB8bc024b95De284ADe61AF00c436181870d9
NEXT_PUBLIC_FACTORY_ADDRESS=0x01DD4b85b88DE66d1d632a799944249da7c58B9A
NEXT_PUBLIC_WHITELIST_MANAGER_ADDRESS=0x3B0CD801d3F0f3F5C69905e7D3bfE225A994469F
NEXT_PUBLIC_TOKEN_A_ADDRESS=0x0ae33C217fd0BE9D23d1596309095E816ac9e41a
NEXT_PUBLIC_TOKEN_B_ADDRESS=0x2EecA34C81d95d578D22A9102d40A8FF57C0AE5F

# Network
NEXT_PUBLIC_CHAIN_ID=11155111
NEXT_PUBLIC_CHAIN_NAME=Sepolia

# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_key
```

## 3. Start Development Server

```bash
cd frontend
npm run dev
```

Open http://localhost:3000

## 4. Connect Wallet

1. Click "Connect Wallet"
2. Select MetaMask
3. Ensure you're on Sepolia network

## 5. Request Whitelist Access

1. Go to `/whitelist`
2. Enter your reason for access
3. Submit request
4. Wait for admin approval

## 6. Start Trading

Once whitelisted:
- **Swap:** Exchange tokens at `/swap`
- **Liquidity:** Add/remove liquidity at `/liquidity`

---

## Deploy Your Own Contracts

```bash
cd smart-contracts
npx hardhat run scripts/deploy.ts --network sepolia
```

Update frontend `.env.local` with new addresses.

---

## Common Issues

### "Caller not whitelisted"
Your wallet isn't on the whitelist. Submit a request at `/whitelist`.

### "Transaction failed"
- Check you have enough Sepolia ETH for gas
- Ensure slippage is set correctly
- Verify token approval

### "Connect wallet not working"
- Install MetaMask
- Switch to Sepolia network
- Refresh the page

---

## Next Steps

- Read [Architecture Overview](../ARCHITECTURE.md)
- Explore [Smart Contract Docs](../smart-contracts/)
- Check [API Reference](../api/)
