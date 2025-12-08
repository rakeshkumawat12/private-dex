# Whitelist System - Quick Start Guide

Get the whitelist request system up and running in 5 minutes!

## Quick Setup (3 Steps)

### Step 1: Configure Your Admin Wallet

Edit `frontend/lib/auth.ts`:

```typescript
export const ADMIN_WALLETS = [
  '0xYourActualAdminWalletAddress', // ← Replace this!
].map(addr => addr.toLowerCase());
```

**Important**: This must be the same wallet that owns the WhitelistManager contract.

### Step 2: Verify Contract Address

Check `frontend/lib/contracts.ts`:

```typescript
export const WHITELIST_MANAGER_ADDRESS = '0x3B0CD801d3F0f3F5C69905e7D3bfE225A994469F';
```

Make sure this matches your deployed WhitelistManager contract.

### Step 3: Start the Application

```bash
cd frontend
npm run dev
```

That's it! 🎉

## Testing the System

### As a User:

1. Go to `http://localhost:3000/whitelist`
2. Connect your wallet
3. Fill out the form and submit a request
4. Check the status on the same page

### As an Admin:

1. Connect with your admin wallet
2. Go to `http://localhost:3000/admin` (visible in navbar for admins only)
3. Sign the authentication message
4. See all pending requests
5. Click "Approve" to whitelist a wallet on-chain

## How It Works

```
User submits request → Saved to database → Admin reviews → Admin approves
→ Blockchain transaction → Wallet whitelisted → User can use DEX
```

## Key Features

✅ User request form with wallet address, email (optional), and reason
✅ Real-time status tracking (pending/approved/rejected)
✅ Secure admin dashboard with wallet-based authentication
✅ Automatic on-chain whitelisting via smart contract
✅ Transaction hash tracking and Etherscan links
✅ Filter and search functionality for admins

## Pages

- **User**: `/whitelist` - Submit and check request status
- **Admin**: `/admin` - Manage all requests (admin wallets only)

## Database

The SQLite database is automatically created at:
```
frontend/whitelist-requests.db
```

No additional database setup required!

## Need Help?

See the full documentation: [WHITELIST_FEATURE.md](./WHITELIST_FEATURE.md)

## Common Issues

**"Access Denied" on admin page**
→ Make sure your wallet address is added to `ADMIN_WALLETS` in `frontend/lib/auth.ts`

**"Request already exists"**
→ Each wallet can only submit one request. Contact admin to delete if needed.

**Transaction fails on approval**
→ Ensure you're on the correct network (Sepolia) and have ETH for gas

## Production Checklist

Before deploying to production:

- [ ] Update `ADMIN_WALLETS` with production admin addresses
- [ ] Verify `WHITELIST_MANAGER_ADDRESS` is correct for production network
- [ ] Use HTTPS for all connections
- [ ] Set up database backups for `whitelist-requests.db`
- [ ] Consider implementing rate limiting on API routes
- [ ] Test thoroughly with multiple wallets
- [ ] Document admin procedures for your team

---

**Built with**: Next.js 16 • React 19 • Wagmi • RainbowKit • SQLite • Ethers v6
