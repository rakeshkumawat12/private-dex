# Frontend Documentation

The VΛULT frontend is a Next.js 16 application with a modern, cyberpunk-inspired design. It provides a complete interface for interacting with the Private DEX.

## Tech Stack

| Technology | Version | Purpose |
|------------|---------|---------|
| Next.js | 16.x | React framework with App Router |
| React | 19.x | UI library |
| TypeScript | 5.x | Type safety |
| Tailwind CSS | 4.x | Utility-first styling |
| Wagmi | 2.x | React hooks for Ethereum |
| Viem | 2.x | TypeScript Ethereum library |
| RainbowKit | 2.x | Wallet connection UI |
| Framer Motion | 12.x | Animations |
| TanStack Query | 5.x | Data fetching & caching |
| Zustand | 5.x | State management |
| Supabase | 2.x | Database client |

## Project Structure

```
frontend/
├── app/                      # Next.js App Router
│   ├── layout.tsx           # Root layout with providers
│   ├── page.tsx             # Landing page (/)
│   ├── globals.css          # Global styles
│   ├── swap/
│   │   └── page.tsx         # Swap interface (/swap)
│   ├── liquidity/
│   │   └── page.tsx         # Liquidity management (/liquidity)
│   ├── faucet/
│   │   └── page.tsx         # Token faucet (/faucet)
│   ├── whitelist/
│   │   └── page.tsx         # Whitelist request (/whitelist)
│   ├── admin/
│   │   └── page.tsx         # Admin dashboard (/admin)
│   ├── stats/
│   │   └── page.tsx         # Pool analytics (/stats)
│   └── api/                 # API routes
│       └── whitelist/       # Whitelist API endpoints
│
├── components/
│   ├── ui/                  # Reusable UI components
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── input.tsx
│   │   ├── select.tsx
│   │   ├── textarea.tsx
│   │   ├── toast.tsx
│   │   └── toaster.tsx
│   ├── layout/
│   │   ├── navbar.tsx       # Navigation bar
│   │   └── footer.tsx       # Site footer
│   └── providers.tsx        # Web3 providers setup
│
├── lib/
│   ├── contracts.ts         # ABIs and addresses
│   ├── db.ts               # Supabase database operations
│   ├── auth.ts             # Admin authentication
│   ├── wagmi.ts            # Wagmi configuration
│   └── utils.ts            # Helper functions
│
├── hooks/
│   ├── useWhitelist.ts     # Whitelist status hook
│   └── useToast.tsx        # Toast notifications
│
├── public/                  # Static assets
│   └── noise.png           # Background texture
│
├── middleware.ts            # Next.js middleware
├── next.config.js          # Next.js configuration
├── tailwind.config.ts      # Tailwind configuration
├── tsconfig.json           # TypeScript configuration
└── package.json            # Dependencies
```

## Pages

### Landing Page (`/`)
The main entry point featuring:
- Hero section with "VΛULT" branding
- Protocol status indicator
- Feature highlights (4 cards)
- Live statistics (TVL, volume, pairs)
- 3-step flow visualization
- Call-to-action buttons

### Swap Page (`/swap`)
Token trading interface:
- Token selector dropdowns
- Input/output amount fields
- Direction toggle button
- Slippage settings
- Balance display
- Approval flow
- Transaction tracking

### Liquidity Page (`/liquidity`)
Liquidity management:
- Add/Remove mode toggle
- Dual token inputs
- Pool information display
- LP token balance
- Slippage protection
- Transaction confirmation

### Faucet Page (`/faucet`)
Test token distribution:
- One-click token minting
- Sequential minting of all test tokens (WETH, USDC, DAI, USDT)
- Progress tracking with visual indicators
- Transaction status and links
- Instructions and token addresses
- 1000 tokens minted per type
- Perfect for quick testing and demos

### Whitelist Page (`/whitelist`)
Access request form:
- Wallet address display
- Email input (optional)
- Reason textarea
- Status checking
- Request submission

### Admin Dashboard (`/admin`)
Whitelist management:
- Admin authentication
- Request list view
- Status filtering
- Approve/Reject actions
- Statistics display

### Stats Page (`/stats`)
Pool analytics:
- Trading volume charts
- Liquidity depth
- Pair information
- Historical data

## Components

### UI Components

#### Button
```tsx
import { Button } from "@/components/ui/button";

// Variants: default, outline, glow, destructive
<Button variant="glow" size="lg">
  Connect Wallet
</Button>
```

#### Card
```tsx
import { Card } from "@/components/ui/card";

<Card className="p-6 bg-card/50 backdrop-blur-sm">
  {children}
</Card>
```

#### Input
```tsx
import { Input } from "@/components/ui/input";

<Input
  type="number"
  placeholder="0.0"
  value={amount}
  onChange={(e) => setAmount(e.target.value)}
/>
```

### Layout Components

#### Navbar
Navigation bar with:
- Logo
- Navigation links
- Wallet connection (RainbowKit)
- Mobile responsive menu

#### Footer
Site footer with:
- Links
- Social icons
- Copyright

### Providers
Web3 provider setup:
```tsx
// components/providers.tsx
export function Providers({ children }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider>
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
```

## Hooks

### useWhitelist
```tsx
import { useWhitelist } from "@/hooks/useWhitelist";

function MyComponent() {
  const { isWhitelisted, isLoading, error } = useWhitelist(address);

  if (isLoading) return <Loading />;
  if (!isWhitelisted) return <NotWhitelisted />;

  return <WhitelistedContent />;
}
```

### useToast
```tsx
import { useToast } from "@/hooks/use-toast";

function MyComponent() {
  const { toast } = useToast();

  const showSuccess = () => {
    toast({
      title: "Success!",
      description: "Transaction confirmed",
    });
  };
}
```

## Configuration

### Contract Addresses
```typescript
// lib/contracts.ts
export const ROUTER_ADDRESS = process.env.NEXT_PUBLIC_ROUTER_ADDRESS;
export const FACTORY_ADDRESS = process.env.NEXT_PUBLIC_FACTORY_ADDRESS;
export const WHITELIST_MANAGER_ADDRESS = process.env.NEXT_PUBLIC_WHITELIST_MANAGER_ADDRESS;
```

### Environment Variables
```env
# .env.local
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id
NEXT_PUBLIC_ROUTER_ADDRESS=0x...
NEXT_PUBLIC_FACTORY_ADDRESS=0x...
NEXT_PUBLIC_WHITELIST_MANAGER_ADDRESS=0x...
NEXT_PUBLIC_CHAIN_ID=11155111
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

## Styling

### Design System
- **Theme**: Dark mode with cyberpunk aesthetic
- **Colors**: Neon green primary, dark backgrounds
- **Typography**: IBM Plex Mono (monospace), IBM Plex Sans
- **Effects**: Glow effects, glassmorphism, scanlines

### Tailwind Configuration
```typescript
// tailwind.config.ts
export default {
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        primary: "var(--primary)",
        // ...
      },
    },
  },
};
```

## Development

### Prerequisites
- Node.js 18+
- npm or yarn
- MetaMask or compatible wallet

### Setup
```bash
cd frontend
npm install
cp .env.example .env.local
# Edit .env.local with your values
npm run dev
```

### Build
```bash
npm run build
npm start
```

### Linting
```bash
npm run lint
```

## Deployment

### Vercel (Recommended)
1. Connect GitHub repository
2. Set environment variables
3. Deploy automatically on push

### Manual
```bash
npm run build
# Deploy .next folder to your hosting
```

See [Deployment Guide](../deployment/VERCEL.md) for detailed instructions.
