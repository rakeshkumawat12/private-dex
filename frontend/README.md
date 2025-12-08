# Private DEX Frontend

A modern, futuristic frontend for a whitelisted decentralized exchange (DEX) built with Next.js, TypeScript, and Web3 technologies.

## Features

- **Swap Tokens**: Instantly swap between different ERC20 tokens
- **Add/Remove Liquidity**: Provide liquidity and earn 0.3% trading fees
- **Pool Statistics**: View real-time pool analytics and metrics
- **Wallet Integration**: Connect with MetaMask and other Web3 wallets via RainbowKit
- **Responsive Design**: Fully responsive design that works on all devices
- **Dark Theme**: Futuristic dark theme with glowing effects and smooth animations

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: Shadcn UI (custom components)
- **Animations**: Framer Motion
- **Web3**: Wagmi + RainbowKit + Viem
- **State Management**: Zustand

## Getting Started

### Prerequisites

- Node.js 18+ installed
- A Web3 wallet (MetaMask recommended)
- WalletConnect Project ID (get from https://cloud.walletconnect.com/)

### Installation

1. Install dependencies:

```bash
npm install
```

2. Configure environment variables:

Copy `.env.local` and fill in the required values:

```bash
# Get your WalletConnect Project ID
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id

# Add your deployed contract addresses
NEXT_PUBLIC_ROUTER_ADDRESS=0x...
NEXT_PUBLIC_FACTORY_ADDRESS=0x...
NEXT_PUBLIC_WHITELIST_MANAGER_ADDRESS=0x...
```

3. Run the development server:

```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
frontend/
├── app/                    # Next.js app directory
│   ├── page.tsx           # Landing page
│   ├── swap/              # Swap functionality
│   ├── liquidity/         # Add/remove liquidity
│   ├── stats/             # Pool statistics
│   ├── layout.tsx         # Root layout
│   └── globals.css        # Global styles
├── components/
│   ├── ui/                # Reusable UI components
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── input.tsx
│   │   ├── select.tsx
│   │   ├── toast.tsx
│   │   └── toaster.tsx
│   ├── layout/            # Layout components
│   │   ├── navbar.tsx
│   │   └── footer.tsx
│   └── providers.tsx      # Web3 providers
├── hooks/                 # Custom React hooks
│   └── useToast.tsx
├── lib/                   # Utility libraries
│   ├── contracts.ts       # Contract ABIs and addresses
│   ├── utils.ts           # Helper functions
│   └── wagmi.ts           # Wagmi configuration
└── public/                # Static assets
```

## Key Features Explained

### Swap Page

- Select input and output tokens
- Enter swap amount
- View estimated output and price impact
- Approve tokens (if needed)
- Execute swap with slippage protection

### Liquidity Page

- **Add Liquidity**: Deposit token pairs to provide liquidity
- **Remove Liquidity**: Withdraw your tokens and earned fees
- View your liquidity positions
- See pool reserves in real-time

### Stats Page

- Total Value Locked (TVL)
- 24h Trading Volume
- Number of active pools
- Detailed pool information (reserves, prices, LP tokens)

## Smart Contract Integration

The frontend interacts with the following smart contracts:

- **Router**: Main contract for swaps and liquidity management
- **Factory**: Creates and manages trading pairs
- **Pair**: Individual liquidity pools (ERC20 LP tokens)
- **WhitelistManager**: Controls access to the DEX

Contract addresses are configured in `lib/contracts.ts`.

## Customization

### Token Configuration

Update the `MOCK_TOKENS` array in each page to add your token pairs:

```typescript
const MOCK_TOKENS = [
  {
    address: "0x...",
    symbol: "USDC",
    name: "USD Coin",
    decimals: 6
  },
  // Add more tokens...
];
```

### Styling

- **Colors**: Modify `app/globals.css` for theme colors
- **Animations**: Adjust Framer Motion variants in page components
- **UI Components**: Customize components in `components/ui/`

### Network Configuration

Change the network in `lib/wagmi.ts`:

```typescript
chains: [sepolia, mainnet, polygon, etc.]
```

## Deployment

### Build for Production

```bash
npm run build
```

### Deploy to Vercel

The easiest way to deploy:

```bash
vercel
```

Or connect your GitHub repository to Vercel for automatic deployments.

### Environment Variables

Remember to set all environment variables in your deployment platform:

- `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID`
- `NEXT_PUBLIC_ROUTER_ADDRESS`
- `NEXT_PUBLIC_FACTORY_ADDRESS`
- `NEXT_PUBLIC_WHITELIST_MANAGER_ADDRESS`

## Usage Guide

### For Users

1. **Connect Wallet**: Click "Connect Wallet" in the navbar
2. **Ensure Whitelisted**: Your address must be whitelisted by the admin
3. **Swap Tokens**:
   - Go to Swap page
   - Select tokens
   - Enter amount
   - Approve and swap
4. **Add Liquidity**:
   - Go to Liquidity page
   - Select "Add Liquidity"
   - Enter token amounts
   - Approve and add liquidity
5. **View Stats**: Check Pool Statistics page for analytics

### For Developers

See the smart contracts documentation in `/smart-contracts/README.md` for:
- Contract deployment
- Whitelist management
- Creating token pairs

## Troubleshooting

### Common Issues

**"Not whitelisted" error**
- Your wallet address needs to be added to the whitelist by the contract owner

**Transaction fails**
- Check you have enough tokens
- Ensure token approval is complete
- Verify slippage tolerance

**Wrong network**
- Switch to Sepolia testnet in your wallet
- Check `NEXT_PUBLIC_CHAIN_ID` matches your network

**Wallet won't connect**
- Clear browser cache
- Try a different browser
- Update MetaMask

## Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT

## Support

For issues or questions:
- Open a GitHub issue
- Check the smart contracts README
- Review the documentation

---

**Built with** Next.js, TypeScript, Wagmi, RainbowKit, Tailwind CSS, and Framer Motion.
