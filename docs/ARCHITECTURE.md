# Architecture Overview

This document provides a comprehensive overview of the VΛULT Private DEX architecture, including system design, data flow, and component interactions.

## System Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              USER INTERFACE                                  │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐ │
│  │    Swap     │  │  Liquidity  │  │  Whitelist  │  │   Admin Dashboard   │ │
│  │    Page     │  │    Page     │  │   Request   │  │  (Whitelist Mgmt)   │ │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └──────────┬──────────┘ │
└─────────┼────────────────┼────────────────┼────────────────────┼────────────┘
          │                │                │                    │
          ▼                ▼                ▼                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           WEB3 INTEGRATION LAYER                             │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │  Wagmi / Viem / RainbowKit                                           │   │
│  │  - Wallet Connection (MetaMask, WalletConnect, etc.)                 │   │
│  │  - Transaction Signing                                                │   │
│  │  - Contract Interactions                                              │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
          │                                                      │
          ▼                                                      ▼
┌─────────────────────────────────┐    ┌──────────────────────────────────────┐
│      ETHEREUM BLOCKCHAIN        │    │          BACKEND SERVICES            │
│         (Sepolia)               │    │                                      │
│  ┌───────────────────────────┐  │    │  ┌────────────────────────────────┐  │
│  │    WhitelistManager       │  │    │  │     Next.js API Routes         │  │
│  │    - Access Control       │  │    │  │     - /api/whitelist/check     │  │
│  │    - Pause Mechanism      │◄─┼────┼──┤     - /api/whitelist/request   │  │
│  └───────────────────────────┘  │    │  │     - /api/whitelist/admin     │  │
│             │                   │    │  └────────────────────────────────┘  │
│             ▼                   │    │                 │                    │
│  ┌───────────────────────────┐  │    │                 ▼                    │
│  │        Factory            │  │    │  ┌────────────────────────────────┐  │
│  │    - Create Pairs         │  │    │  │         Supabase DB            │  │
│  │    - Track All Pairs      │  │    │  │     - Whitelist Requests       │  │
│  └───────────────────────────┘  │    │  │     - Request Status           │  │
│             │                   │    │  │     - Admin Actions            │  │
│             ▼                   │    │  └────────────────────────────────┘  │
│  ┌───────────────────────────┐  │    │                                      │
│  │        Router             │  │    └──────────────────────────────────────┘
│  │    - Swap Tokens          │  │
│  │    - Add/Remove Liquidity │  │
│  └───────────────────────────┘  │
│             │                   │
│             ▼                   │
│  ┌───────────────────────────┐  │
│  │    Pair Contracts         │  │
│  │    - AMM Logic            │  │
│  │    - LP Token (ERC20)     │  │
│  └───────────────────────────┘  │
└─────────────────────────────────┘
```

## Component Breakdown

### 1. Frontend Layer

The frontend is built with Next.js 16 using the App Router pattern.

```
frontend/
├── app/                    # Next.js App Router
│   ├── layout.tsx         # Root layout with providers
│   ├── page.tsx           # Landing page
│   ├── swap/              # Token swap functionality
│   ├── liquidity/         # Add/remove liquidity
│   ├── whitelist/         # Request whitelist access
│   ├── admin/             # Admin dashboard
│   ├── stats/             # Pool analytics
│   └── api/               # Backend API routes
├── components/
│   ├── ui/                # Reusable UI components
│   ├── layout/            # Navigation, footer
│   └── providers.tsx      # Web3 providers setup
├── lib/
│   ├── contracts.ts       # ABIs and addresses
│   ├── db.ts              # Database operations
│   ├── auth.ts            # Admin authentication
│   └── wagmi.ts           # Web3 configuration
└── hooks/
    ├── useWhitelist.ts    # Whitelist status hook
    └── useToast.tsx       # Notification hook
```

### 2. Smart Contract Layer

The smart contracts follow a modular design with clear separation of concerns.

```
contracts/
├── access/
│   └── WhitelistManager.sol    # Global access control
├── core/
│   ├── Factory.sol             # Pair deployment
│   ├── Router.sol              # User-facing operations
│   └── Pair.sol                # AMM liquidity pool
├── interfaces/
│   ├── IFactory.sol
│   ├── IPair.sol
│   └── IWhitelistManager.sol
├── libraries/
│   └── Math.sol                # Mathematical utilities
└── tokens/
    └── MockERC20.sol           # Test tokens
```

### 3. Backend Layer

Backend services are implemented as Next.js API routes with Supabase for data persistence.

```
API Routes:
├── /api/whitelist/check       # Check on-chain whitelist status
├── /api/whitelist/request     # Submit/check whitelist requests
└── /api/whitelist/admin/      # Admin request management
    └── [id]/                  # Individual request operations
```

## Data Flow Diagrams

### Token Swap Flow

```
User                    Frontend                  Router                  Pair
 │                         │                        │                      │
 │  1. Enter swap params   │                        │                      │
 │─────────────────────────>                        │                      │
 │                         │                        │                      │
 │  2. Check whitelist     │                        │                      │
 │<─────────────────────────                        │                      │
 │                         │                        │                      │
 │  3. Approve tokens      │                        │                      │
 │─────────────────────────>───────────────────────>│                      │
 │                         │                        │                      │
 │  4. Sign transaction    │                        │                      │
 │─────────────────────────>                        │                      │
 │                         │                        │                      │
 │                         │  5. swapExactTokens... │                      │
 │                         │───────────────────────>│                      │
 │                         │                        │                      │
 │                         │                        │  6. Verify whitelist │
 │                         │                        │─────────────────────>│
 │                         │                        │                      │
 │                         │                        │  7. Execute swap     │
 │                         │                        │─────────────────────>│
 │                         │                        │                      │
 │                         │                        │<─────────────────────│
 │                         │<───────────────────────│                      │
 │<─────────────────────────                        │                      │
 │  8. Show success        │                        │                      │
```

### Whitelist Request Flow

```
User                    Frontend              API                  Database          Admin
 │                         │                    │                      │               │
 │  1. Submit request      │                    │                      │               │
 │─────────────────────────>                    │                      │               │
 │                         │  2. POST /request  │                      │               │
 │                         │───────────────────>│                      │               │
 │                         │                    │  3. Store request    │               │
 │                         │                    │─────────────────────>│               │
 │                         │<───────────────────│                      │               │
 │<─────────────────────────                    │                      │               │
 │  4. Pending status      │                    │                      │               │
 │                         │                    │                      │               │
 │                         │                    │                      │  5. Review    │
 │                         │                    │                      │<──────────────│
 │                         │                    │                      │               │
 │                         │                    │  6. Approve on-chain │               │
 │                         │                    │<─────────────────────────────────────│
 │                         │                    │                      │               │
 │                         │                    │  7. Update status    │               │
 │                         │                    │─────────────────────>│               │
 │                         │                    │                      │               │
 │  8. Check status        │                    │                      │               │
 │─────────────────────────>───────────────────>│                      │               │
 │<─────────────────────────<───────────────────│                      │               │
 │  9. Approved!           │                    │                      │               │
```

## Smart Contract Interactions

### Contract Dependency Graph

```
                    ┌────────────────────┐
                    │  WhitelistManager  │
                    │  (Access Control)  │
                    └─────────┬──────────┘
                              │
              ┌───────────────┼───────────────┐
              │               │               │
              ▼               ▼               ▼
      ┌───────────┐   ┌───────────┐   ┌───────────┐
      │  Factory  │   │   Router  │   │   Pair    │
      │           │   │           │   │           │
      └─────┬─────┘   └─────┬─────┘   └───────────┘
            │               │               ▲
            │               │               │
            │               └───────────────┘
            │                     │
            └─────────────────────┘
                Creates Pairs
```

### Function Call Flow

```
Router.addLiquidity()
    │
    ├── 1. Check: WhitelistManager.isWhitelistedAndActive(msg.sender)
    │
    ├── 2. Get/Create Pair: Factory.getPair() or Factory.createPair()
    │
    ├── 3. Transfer tokens: IERC20.transferFrom()
    │
    └── 4. Mint LP tokens: Pair.mint()


Router.swapExactTokensForTokens()
    │
    ├── 1. Check: WhitelistManager.isWhitelistedAndActive(msg.sender)
    │
    ├── 2. Calculate amounts: getAmountsOut()
    │
    ├── 3. Transfer input: IERC20.transferFrom()
    │
    └── 4. Execute swap: Pair.swap()
```

## Security Architecture

### Access Control Hierarchy

```
┌─────────────────────────────────────────────────────────────────┐
│                        CONTRACT OWNER                            │
│  - Can add/remove addresses from whitelist                      │
│  - Can pause/unpause the system                                 │
│  - Can transfer ownership                                        │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                     WHITELISTED USERS                            │
│  - Can swap tokens                                               │
│  - Can add/remove liquidity                                      │
│  - Cannot modify whitelist                                       │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                     NON-WHITELISTED USERS                        │
│  - Can view pool information                                     │
│  - Can request whitelist access                                  │
│  - Cannot execute any DEX operations                             │
└─────────────────────────────────────────────────────────────────┘
```

### Security Layers

1. **Smart Contract Level**
   - OpenZeppelin's `Ownable` for ownership
   - OpenZeppelin's `Pausable` for emergency stops
   - `ReentrancyGuard` on all state-changing functions
   - Whitelist checks on every operation

2. **API Level**
   - Signature verification for admin actions
   - Input validation and sanitization
   - Rate limiting considerations

3. **Frontend Level**
   - Wallet signature authentication
   - Transaction confirmation prompts
   - Error boundary handling

## Database Schema

### Whitelist Requests Table

```sql
CREATE TABLE whitelist_requests (
  id            BIGSERIAL PRIMARY KEY,
  wallet_address TEXT NOT NULL UNIQUE,
  email         TEXT,
  reason        TEXT NOT NULL,
  status        TEXT NOT NULL DEFAULT 'pending',
  tx_hash       TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reviewed_by   TEXT,
  reviewed_at   TIMESTAMPTZ,

  CONSTRAINT status_check CHECK (status IN ('pending', 'approved', 'rejected'))
);

-- Indexes
CREATE INDEX idx_status ON whitelist_requests(status);
CREATE INDEX idx_wallet_address ON whitelist_requests(wallet_address);
CREATE INDEX idx_created_at ON whitelist_requests(created_at DESC);
```

## Scalability Considerations

### Current Architecture Limitations

1. **Single Whitelist Contract** - All pairs share one whitelist
2. **Centralized Admin** - Single owner controls whitelist
3. **Off-chain Request Storage** - Database dependency

### Future Improvements

1. **Multi-sig Admin** - Multiple admins required for changes
2. **Role-based Access** - Different permission levels
3. **On-chain Requests** - Fully decentralized request system
4. **Layer 2 Deployment** - Lower gas costs

## Environment Configuration

### Required Environment Variables

```env
# Frontend (.env.local)
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=
NEXT_PUBLIC_ROUTER_ADDRESS=
NEXT_PUBLIC_FACTORY_ADDRESS=
NEXT_PUBLIC_WHITELIST_MANAGER_ADDRESS=
NEXT_PUBLIC_CHAIN_ID=11155111
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=

# Smart Contracts (.env)
SEPOLIA_RPC_URL=
SEPOLIA_PRIVATE_KEY=
```

## Performance Optimizations

### Smart Contracts
- Immutable variables for gas savings
- Optimizer enabled (200-800 runs)
- Efficient storage patterns

### Frontend
- Turbopack for fast development
- React Query for data caching
- Optimistic UI updates

### API
- Edge functions ready
- Database indexes for fast queries
- Connection pooling via Supabase
