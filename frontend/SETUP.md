# Private DEX Frontend - Quick Setup Guide

## Initial Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Create a `.env.local` file (copy from `.env.example`) or update the existing one:

```bash
# Required: Get your WalletConnect Project ID from https://cloud.walletconnect.com/
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id_here

# Required: Add your deployed contract addresses (get these after deploying smart contracts)
NEXT_PUBLIC_ROUTER_ADDRESS=0x...
NEXT_PUBLIC_FACTORY_ADDRESS=0x...
NEXT_PUBLIC_WHITELIST_MANAGER_ADDRESS=0x...
```

### 3. Deploy Smart Contracts First

Before running the frontend, you need to deploy the smart contracts:

```bash
cd ../smart-contracts
npm install
npm run deploy:sepolia  # or npm run deploy:local for local testing
```

After deployment, copy the contract addresses from the output and paste them into your `.env.local` file.

### 4. Update Token Configurations

Edit the token lists in each page to match your deployed tokens:

**Files to update:**
- `app/swap/page.tsx` - Line 12
- `app/liquidity/page.tsx` - Line 13
- `app/stats/page.tsx` - Line 10

Replace the `MOCK_TOKENS` array with your actual token addresses:

```typescript
const MOCK_TOKENS = [
  {
    address: "0xYourTokenAddress",
    symbol: "TOKEN",
    name: "Token Name",
    decimals: 18
  },
  // Add more tokens...
];
```

### 5. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 6. Build for Production

```bash
npm run build
npm start
```

## Connecting Your Wallet

1. Click "Connect Wallet" in the navbar
2. Select your wallet (MetaMask recommended)
3. Approve the connection
4. Make sure you're on Sepolia testnet
5. Ensure your address is whitelisted (contact contract owner)

## Getting Test Tokens

### Sepolia ETH Faucets:
- https://sepoliafaucet.com/
- https://www.alchemy.com/faucets/ethereum-sepolia

### After Getting ETH:
1. Go to the deployed test token contract
2. Call the `mint()` function to get test tokens
3. Or ask the contract owner to mint tokens for you

## Troubleshooting

### "Wrong network" Error
- Switch to Sepolia testnet in MetaMask
- Network settings: Chain ID 11155111

### "Not whitelisted" Error
- Your address needs to be added to the whitelist
- Contact the contract deployer/owner
- They need to call `WhitelistManager.addToWhitelist(yourAddress)`

### Contract Not Found
- Verify contract addresses in `.env.local`
- Ensure contracts are deployed to the correct network
- Check that you're connected to the right network

### Build Errors
- Delete `.next` folder and `node_modules`
- Run `npm install` again
- Run `npm run build`

## Testing Locally with Hardhat

1. Start local Hardhat node:
```bash
cd ../smart-contracts
npm run node
```

2. Deploy contracts locally:
```bash
npm run deploy:local
```

3. Update `.env.local` with local contract addresses

4. Configure MetaMask to connect to localhost:8545

5. Import a Hardhat test account to MetaMask

6. Start frontend:
```bash
cd ../frontend
npm run dev
```

## Next Steps

1. **Add Liquidity**: Go to Liquidity page and add token pairs
2. **Test Swaps**: Try swapping tokens on the Swap page
3. **View Stats**: Check pool statistics on Stats page
4. **Customize**: Update branding, colors, and features as needed

## Production Deployment

### Deploy to Vercel:

1. Push code to GitHub
2. Connect repository to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy!

Or use Vercel CLI:
```bash
vercel
```

### Environment Variables for Production:
- Set all `NEXT_PUBLIC_*` variables
- Double-check contract addresses
- Verify WalletConnect Project ID

## Support

For issues:
- Check smart-contracts/README.md
- Review Next.js documentation
- Open a GitHub issue

Happy trading!
