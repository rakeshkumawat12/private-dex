# Private DEX - Quick Start Guide

## 🚀 Your DEX is Ready!

All contracts are deployed to Sepolia testnet and the frontend is configured!

## ✅ What's Done

- ✅ Smart contracts deployed to Sepolia
- ✅ Frontend built and configured
- ✅ Contract addresses added to all files
- ✅ Test tokens created (TSTA & TSTB)
- ✅ Initial pair created (TSTA/TSTB)
- ✅ Deployer and Router whitelisted

## 📍 Deployed Addresses

### Core Contracts
- **Router**: `0xc0aeB8bc024b95De284ADe61AF00c436181870d9`
- **Factory**: `0x01DD4b85b88DE66d1d632a799944249da7c58B9A`
- **WhitelistManager**: `0x3B0CD801d3F0f3F5C69905e7D3bfE225A994469F`

### Test Tokens
- **TSTA**: `0x0ae33C217fd0BE9D23d1596309095E816ac9e41a`
- **TSTB**: `0x2EecA34C81d95d578D22A9102d40A8FF57C0AE5F`

### Liquidity Pair
- **TSTA/TSTB**: `0xE456D652f42b840951a64ACFd797F2f30724D97f`

## 🏃‍♂️ Run Frontend Locally

### 1. Start Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### 2. Get WalletConnect Project ID (Optional)

For better wallet connection experience:

1. Go to https://cloud.walletconnect.com/
2. Create a free account
3. Create a new project
4. Copy the Project ID
5. Add to `.env.local`:
   ```
   NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id_here
   ```

## 🧪 Testing the DEX

### Step 1: Get Sepolia ETH

Get free testnet ETH from faucets:
- https://sepoliafaucet.com/
- https://www.alchemy.com/faucets/ethereum-sepolia

### Step 2: Get Whitelisted

**Option A: You're the deployer** (address: `0xe68C17C8a4e782e27038d189E1fE8b3a4546c9b9`)
- Your address is already whitelisted! ✅
- Skip to Step 3

**Option B: Different address**
- Contact deployer to add your address
- Or use Hardhat script:
  ```bash
  cd ../smart-contracts
  npx hardhat run scripts/addToWhitelist.ts --network sepolia
  ```

### Step 3: Get Test Tokens

**Mint tokens using Hardhat:**

```bash
cd ../smart-contracts

# Mint TSTA
npx hardhat console --network sepolia
> const tokenA = await ethers.getContractAt("MockERC20", "0x0ae33C217fd0BE9D23d1596309095E816ac9e41a")
> await tokenA.mint(ethers.parseEther("10000"))

# Mint TSTB
> const tokenB = await ethers.getContractAt("MockERC20", "0x2EecA34C81d95d578D22A9102d40A8FF57C0AE5F")
> await tokenB.mint(ethers.parseEther("10"))
```

Or use Etherscan directly:
1. Go to token contract on Etherscan
2. Connect wallet
3. Call `mint` function with your address and amount

### Step 4: Test Swap

1. Go to http://localhost:3000/swap
2. Connect your wallet
3. Switch to Sepolia network
4. Select TSTA → TSTB
5. Enter amount (e.g., 100)
6. Click "Approve TSTA"
7. Wait for approval
8. Click "Swap"
9. Confirm transaction
10. See success message! 🎉

### Step 5: Test Liquidity

1. Go to http://localhost:3000/liquidity
2. Click "Add Liquidity"
3. Enter TSTA amount (e.g., 1000)
4. Enter TSTB amount (e.g., 5)
5. Approve both tokens if needed
6. Click "Add Liquidity"
7. Receive LP tokens! 📈

### Step 6: View Stats

1. Go to http://localhost:3000/stats
2. See pool information
3. Check reserves
4. View your liquidity position

## 🚀 Deploy to Production

### Option 1: Vercel (Recommended)

1. **Push to GitHub**
   ```bash
   git add .
   git commit -m "Complete DEX frontend"
   git push
   ```

2. **Deploy on Vercel**
   - Go to https://vercel.com
   - Click "Import Project"
   - Select your GitHub repo
   - Add environment variables:
     - `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID`
     - `NEXT_PUBLIC_ROUTER_ADDRESS`
     - `NEXT_PUBLIC_FACTORY_ADDRESS`
     - `NEXT_PUBLIC_WHITELIST_MANAGER_ADDRESS`
   - Click "Deploy"

3. **Done!** Your DEX is live! 🎉

### Option 2: Other Platforms

Build and deploy:
```bash
npm run build
npm start
```

Or export static site:
```bash
npm run build
# Deploy .next folder to any static host
```

## 📊 Managing the DEX

### Add User to Whitelist

```bash
cd smart-contracts
npx hardhat console --network sepolia

> const wm = await ethers.getContractAt("WhitelistManager", "0x3B0CD801d3F0f3F5C69905e7D3bfE225A994469F")
> await wm.addToWhitelist("USER_ADDRESS")
```

### Create New Token Pair

```bash
> const factory = await ethers.getContractAt("Factory", "0x01DD4b85b88DE66d1d632a799944249da7c58B9A")
> await factory.createPair("TOKEN_A_ADDRESS", "TOKEN_B_ADDRESS")
```

### Mint More Test Tokens

```bash
> const token = await ethers.getContractAt("MockERC20", "TOKEN_ADDRESS")
> await token.mint(ethers.parseEther("AMOUNT"))
```

## 🔍 Verify Contracts (Optional)

Make contracts readable on Etherscan:

```bash
cd ../smart-contracts

# Set API key in .env
ETHERSCAN_API_KEY=your_api_key

# Verify contracts
npm run verify:sepolia
```

## 🎨 Customize Frontend

### Change Colors
Edit `app/globals.css`:
```css
@theme {
  --color-primary: oklch(0.6 0.2 240); /* Change this */
}
```

### Add More Tokens
Edit token lists in:
- `app/swap/page.tsx`
- `app/liquidity/page.tsx`
- `app/stats/page.tsx`

### Change Branding
- Update logo in `components/layout/navbar.tsx`
- Modify title in `app/layout.tsx`

## 📚 Documentation

- **Full Docs**: `README.md`
- **Setup Guide**: `SETUP.md`
- **Project Overview**: `PROJECT_SUMMARY.md`
- **Deployment Info**: `DEPLOYMENT_INFO.md`
- **Smart Contracts**: `../smart-contracts/README.md`

## 🆘 Troubleshooting

### Frontend won't connect to wallet
- Install MetaMask
- Switch to Sepolia network
- Check console for errors

### "Not whitelisted" error
- Add your address to whitelist
- Use deployer address: `0xe68C17C8a4e782e27038d189E1fE8b3a4546c9b9`

### "Insufficient balance" error
- Mint test tokens (see Step 3 above)
- Get Sepolia ETH from faucet

### Transactions failing
- Check gas balance (need Sepolia ETH)
- Verify token approval
- Check slippage tolerance

### Can't see pool data
- Wait for transactions to confirm
- Refresh the page
- Check you're on correct network

## 🎉 You're All Set!

Your Private DEX is:
- ✅ Fully functional
- ✅ Deployed on Sepolia
- ✅ Ready for testing
- ✅ Production-ready code

Start testing now:
```bash
npm run dev
```

Then visit: http://localhost:3000

**Happy Trading! 🚀💰**

---

Need help? Check the documentation files or open an issue on GitHub.
