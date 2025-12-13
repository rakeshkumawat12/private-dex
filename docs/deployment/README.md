# Deployment Guide

This guide covers deploying the VΛULT Private DEX to production environments.

## Overview

The deployment consists of three parts:
1. **Smart Contracts** → Ethereum network (Sepolia/Mainnet)
2. **Frontend** → Vercel (recommended)
3. **Database** → Supabase

## Prerequisites

- Node.js 18+
- Git
- Ethereum wallet with testnet/mainnet ETH
- Vercel account
- Supabase account

---

## 1. Smart Contract Deployment

### Setup

```bash
cd smart-contracts
npm install
```

### Configure Environment

Create `.env` file:

```env
# RPC URL (Alchemy, Infura, or other provider)
SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_KEY

# Deployer wallet private key (with ETH for gas)
SEPOLIA_PRIVATE_KEY=0x...

# Optional: For mainnet deployment
MAINNET_RPC_URL=https://eth-mainnet.g.alchemy.com/v2/YOUR_KEY
MAINNET_PRIVATE_KEY=0x...

# Optional: Etherscan API key for verification
ETHERSCAN_API_KEY=your_key
```

### Deploy to Sepolia

```bash
npx hardhat run scripts/deploy.ts --network sepolia
```

**Expected Output:**
```
🚀 Starting Private DEX deployment...

📝 Deploying contracts with account: 0x...
💰 Account balance: 0.5 ETH

1️⃣  Deploying WhitelistManager...
✅ WhitelistManager deployed to: 0x...

2️⃣  Deploying Factory...
✅ Factory deployed to: 0x...

3️⃣  Deploying Router...
✅ Router deployed to: 0x...

4️⃣  Deploying Test Tokens...
✅ WETH deployed to: 0x...
✅ USDC deployed to: 0x...
✅ DAI deployed to: 0x...
✅ USDT deployed to: 0x...

5️⃣  Creating liquidity pools...
✅ WETH/USDC pool created
✅ WETH/DAI pool created
✅ USDC/USDT pool created
✅ DAI/USDT pool created

============================================================
📋 DEPLOYMENT SUMMARY
============================================================
WhitelistManager: 0x9Dc786Ad986e1d4cb1E85e4469E8443efCBfAD2E
Factory:          0xC36EE51C750F6290977D212FEE5C0Af95Fc3bC57
Router:           0x05b6B7d9cE4BA0f12040664167b34382E050eC87

Test Tokens:
WETH:             0x35287D9fDb7a1E7CC2212Fd1d57F8ae71cCA030A
USDC:             0x01134D4D7A522a5d601413dD3Bf33859B193063e
DAI:              0x64c178393Bbe0cAe2a78A19c58e9B3944c2D5B42
USDT:             0x5ccE1Fda0efe9A51302B3F26E3ca0d672536c2F7

Liquidity Pools:
WETH/USDC:        0xcC885a0801eEA25E53daAD94008CF89B4299D208
WETH/DAI:         0xc6E56F5e6Af03535180f9ad416942a557DCFeEd2
USDC/USDT:        0xf2cb6319FC611447A4A37091877658DbEf121c29
DAI/USDT:         0xD21800b9587c761De6C07342c1f9E3f7ebb8cd90
============================================================
```

### Verify Contracts

Contracts are verified on Blockscout by default. For Etherscan verification:

```bash
# Add your Etherscan API key to .env
ETHERSCAN_API_KEY=your_key

# Verify contracts
npx hardhat verify --network sepolia WHITELIST_MANAGER_ADDRESS
npx hardhat verify --network sepolia FACTORY_ADDRESS "WHITELIST_ADDRESS"
npx hardhat verify --network sepolia ROUTER_ADDRESS "FACTORY_ADDRESS" "WHITELIST_ADDRESS"
```

**Note:** If Etherscan verification fails due to bytecode mismatch, contracts are still accessible and verified on [Blockscout](https://eth-sepolia.blockscout.com).

### Post-Deployment Setup

1. **Add Router to Whitelist:**
```bash
npx hardhat run scripts/addToWhitelist.ts --network sepolia
```

2. **Add Admin Wallet:**
```bash
npx hardhat run scripts/addToWhitelist.ts --network sepolia
# Edit script to add your admin wallet
```

3. **Transfer Ownership (if needed):**
```bash
npx hardhat run scripts/transferOwnership.ts --network sepolia
```

---

## 2. Database Setup (Supabase)

### Create Project

1. Go to [supabase.com](https://supabase.com)
2. Create new project
3. Note your project URL and anon key

### Create Table

Run in Supabase SQL Editor:

```sql
-- Create whitelist_requests table
CREATE TABLE IF NOT EXISTS whitelist_requests (
  id BIGSERIAL PRIMARY KEY,
  wallet_address TEXT NOT NULL UNIQUE,
  email TEXT,
  reason TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'approved', 'rejected')),
  tx_hash TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reviewed_by TEXT,
  reviewed_at TIMESTAMPTZ
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_status ON whitelist_requests(status);
CREATE INDEX IF NOT EXISTS idx_wallet_address ON whitelist_requests(wallet_address);
CREATE INDEX IF NOT EXISTS idx_created_at ON whitelist_requests(created_at DESC);

-- Enable Row Level Security
ALTER TABLE whitelist_requests ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Enable read access for all users" ON whitelist_requests
  FOR SELECT USING (true);

CREATE POLICY "Enable insert for all users" ON whitelist_requests
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update for all users" ON whitelist_requests
  FOR UPDATE USING (true);

-- Auto-update trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_whitelist_requests_updated_at
  BEFORE UPDATE ON whitelist_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

---

## 3. Frontend Deployment (Vercel)

### Prepare Environment

Create `.env.local` for local testing:

```env
# WalletConnect
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id

# Contract Addresses (from deployment)
NEXT_PUBLIC_ROUTER_ADDRESS=0x05b6B7d9cE4BA0f12040664167b34382E050eC87
NEXT_PUBLIC_FACTORY_ADDRESS=0xC36EE51C750F6290977D212FEE5C0Af95Fc3bC57
NEXT_PUBLIC_WHITELIST_MANAGER_ADDRESS=0x9Dc786Ad986e1d4cb1E85e4469E8443efCBfAD2E

# Test Tokens
NEXT_PUBLIC_WETH_ADDRESS=0x35287D9fDb7a1E7CC2212Fd1d57F8ae71cCA030A
NEXT_PUBLIC_USDC_ADDRESS=0x01134D4D7A522a5d601413dD3Bf33859B193063e
NEXT_PUBLIC_DAI_ADDRESS=0x64c178393Bbe0cAe2a78A19c58e9B3944c2D5B42
NEXT_PUBLIC_USDT_ADDRESS=0x5ccE1Fda0efe9A51302B3F26E3ca0d672536c2F7

# Network
NEXT_PUBLIC_CHAIN_ID=11155111
NEXT_PUBLIC_CHAIN_NAME=Sepolia

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

### Deploy to Vercel

#### Option A: Vercel CLI

```bash
cd frontend
npm install -g vercel
vercel login
vercel
```

Follow prompts to:
1. Link to existing project or create new
2. Set root directory to `frontend`
3. Configure build settings (auto-detected)

#### Option B: GitHub Integration

1. Push code to GitHub
2. Go to [vercel.com](https://vercel.com)
3. Import repository
4. Configure:
   - **Root Directory:** `frontend`
   - **Build Command:** `npm run build`
   - **Output Directory:** `.next`

### Set Environment Variables

In Vercel Dashboard → Settings → Environment Variables:

| Name | Value |
|------|-------|
| `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` | Your WalletConnect ID |
| `NEXT_PUBLIC_ROUTER_ADDRESS` | Router contract address |
| `NEXT_PUBLIC_FACTORY_ADDRESS` | Factory contract address |
| `NEXT_PUBLIC_WHITELIST_MANAGER_ADDRESS` | WhitelistManager address |
| `NEXT_PUBLIC_WETH_ADDRESS` | WETH token address |
| `NEXT_PUBLIC_USDC_ADDRESS` | USDC token address |
| `NEXT_PUBLIC_DAI_ADDRESS` | DAI token address |
| `NEXT_PUBLIC_USDT_ADDRESS` | USDT token address |
| `NEXT_PUBLIC_CHAIN_ID` | 11155111 (Sepolia) |
| `NEXT_PUBLIC_CHAIN_NAME` | Sepolia |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key |

### Redeploy

After setting environment variables:

```bash
vercel --prod
```

Or trigger redeploy from Vercel dashboard.

---

## 4. Post-Deployment Checklist

### Smart Contracts
- [ ] All contracts deployed successfully
- [ ] Contracts verified on Etherscan
- [ ] Router whitelisted
- [ ] Admin wallet whitelisted
- [ ] Ownership transferred (if needed)
- [ ] Test pair created

### Database
- [ ] Supabase project created
- [ ] Schema applied
- [ ] Row Level Security enabled
- [ ] Indexes created

### Frontend
- [ ] Deployed to Vercel
- [ ] Environment variables set
- [ ] Custom domain configured (optional)
- [ ] SSL working

### Integration Testing
- [ ] Wallet connection works
- [ ] Whitelist check works
- [ ] Whitelist request submission works
- [ ] Admin authentication works
- [ ] Admin can approve/reject requests
- [ ] Approved users can swap
- [ ] Approved users can add liquidity

---

## Troubleshooting

### Contract Deployment Issues

**"Insufficient funds"**
- Ensure deployer wallet has enough ETH for gas

**"Nonce too low"**
- Reset MetaMask account or wait for pending transactions

### Vercel Build Errors

**"Module not found"**
- Check `package.json` dependencies
- Run `npm install` locally first

**"Environment variable undefined"**
- Verify all env vars are set in Vercel
- Redeploy after adding variables

### Database Connection Issues

**"Failed to fetch"**
- Check Supabase URL and key
- Verify RLS policies allow access

### Transaction Failures

**"Caller not whitelisted"**
- Ensure the wallet is whitelisted on-chain

**"Gas limit too high"**
- Use explicit gas limits in contract calls

---

## Mainnet Deployment

⚠️ **Warning:** Mainnet deployment requires additional considerations.

### Pre-Mainnet Checklist

- [ ] Security audit completed
- [ ] Extensive testing on testnet
- [ ] Gas optimization reviewed
- [ ] Emergency procedures documented
- [ ] Multi-sig wallet for ownership
- [ ] Bug bounty program (recommended)

### Configuration Changes

1. Update `.env` with mainnet RPC and keys
2. Update frontend to use mainnet chain ID (1)
3. Deploy contracts with production optimizer settings
4. Verify all contracts on Etherscan

```typescript
// hardhat.config.ts - Production settings
solidity: {
  version: "0.8.28",
  settings: {
    optimizer: {
      enabled: true,
      runs: 800,  // Higher for production
    },
  },
},
```
