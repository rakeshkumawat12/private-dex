# Security Documentation

This document outlines the security measures, best practices, and considerations for the VΛULT Private DEX.

## Overview

Security is a fundamental design principle of the Private DEX. The protocol implements multiple layers of protection:

1. **Access Control** - Whitelist-based permissioning
2. **Smart Contract Security** - Battle-tested patterns and guards
3. **Frontend Security** - Input validation and secure Web3 interactions
4. **API Security** - Rate limiting and validation

---

## Smart Contract Security

### Access Control Model

```
┌─────────────────────────────────────────────────────────────┐
│                    WhitelistManager                          │
│                    (Owner: Admin)                            │
├─────────────────────────────────────────────────────────────┤
│  addToWhitelist()     ──► Only Owner                        │
│  removeFromWhitelist() ──► Only Owner                       │
│  isWhitelisted()       ──► Public (view)                    │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│              Router / Factory / Pair                         │
│         (Check whitelist before operations)                  │
├─────────────────────────────────────────────────────────────┤
│  All state-changing functions require:                       │
│  require(whitelistManager.isWhitelisted(msg.sender))        │
└─────────────────────────────────────────────────────────────┘
```

### Security Patterns Used

#### 1. Reentrancy Guard
All state-changing functions in Router and Pair contracts use OpenZeppelin's `ReentrancyGuard`:

```solidity
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract Router is ReentrancyGuard {
    function swapExactTokensForTokens(...) external nonReentrant {
        // Protected from reentrancy
    }
}
```

#### 2. Checks-Effects-Interactions Pattern
State changes occur before external calls:

```solidity
function swap(...) external {
    // 1. Checks
    require(amount0Out > 0 || amount1Out > 0, "Insufficient output");

    // 2. Effects (state changes)
    _update(balance0, balance1);

    // 3. Interactions (external calls)
    IERC20(token0).transfer(to, amount0Out);
}
```

#### 3. SafeERC20
All token transfers use OpenZeppelin's SafeERC20 wrapper:

```solidity
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

using SafeERC20 for IERC20;

function _safeTransfer(address token, address to, uint value) internal {
    IERC20(token).safeTransfer(to, value);
}
```

#### 4. Immutable Variables
Critical addresses are set once and cannot be changed:

```solidity
address public immutable factory;
address public immutable whitelistManager;
```

### Known Attack Vectors & Mitigations

#### Flash Loan Attacks
**Risk:** Manipulate reserves within a single transaction.
**Mitigation:**
- K-invariant check ensures reserves remain balanced
- Fee mechanism (0.3%) makes manipulation costly

#### Sandwich Attacks
**Risk:** Front-run user transactions for profit.
**Mitigation:**
- Slippage parameters (`amountOutMin`, `amountInMax`)
- Deadline parameter prevents stale transactions
- Private DEX nature limits attacker pool

#### Oracle Manipulation
**Risk:** Price manipulation through reserve changes.
**Mitigation:**
- No external oracle dependency
- Time-weighted average price (TWAP) accumulator
- Whitelist limits participants

#### First Depositor Attack
**Risk:** First LP manipulates initial price.
**Mitigation:**
- `MINIMUM_LIQUIDITY` (1000 wei) permanently locked
- Prevents division by zero
- Limits manipulation impact

---

## Frontend Security

### Wallet Connection

RainbowKit handles secure wallet connections:

```typescript
// Secure configuration
const config = createConfig({
  chains: [sepolia],
  transports: {
    [sepolia.id]: http(rpcUrl),
  },
});
```

### Transaction Security

#### 1. Deadline Protection
All transactions include a deadline:

```typescript
const deadline = BigInt(Math.floor(Date.now() / 1000) + 1200); // 20 minutes
```

#### 2. Slippage Protection
Users can set maximum slippage tolerance:

```typescript
const minOutput = expectedOutput * (100n - slippageBps) / 100n;
```

#### 3. Gas Limit Control
Explicit gas limits prevent unexpected costs:

```typescript
const hash = await writeContractAsync({
  // ...
  gas: BigInt(150000),
});
```

### Input Validation

All user inputs are validated:

```typescript
// Amount validation
const isValidAmount = (value: string): boolean => {
  if (!value || value === "") return false;
  const num = parseFloat(value);
  return !isNaN(num) && num > 0 && isFinite(num);
};

// Address validation
const isValidAddress = (address: string): boolean => {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
};
```

### Environment Variables

Sensitive data is stored in environment variables:

```env
# Never commit these to version control
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SEPOLIA_PRIVATE_KEY=...  # Backend only
```

---

## API Security

### Database Security

#### Row Level Security (RLS)
Supabase RLS policies control data access:

```sql
-- Enable RLS
ALTER TABLE whitelist_requests ENABLE ROW LEVEL SECURITY;

-- Read policy (public)
CREATE POLICY "Enable read access for all users"
ON whitelist_requests FOR SELECT USING (true);

-- Insert policy (authenticated)
CREATE POLICY "Enable insert for all users"
ON whitelist_requests FOR INSERT WITH CHECK (true);
```

### Input Sanitization

API routes sanitize all inputs:

```typescript
export async function POST(req: NextRequest) {
  const body = await req.json();

  // Validate wallet address
  const walletAddress = body.walletAddress?.trim().toLowerCase();
  if (!walletAddress || !/^0x[a-f0-9]{40}$/i.test(walletAddress)) {
    return NextResponse.json(
      { error: "Invalid wallet address" },
      { status: 400 }
    );
  }

  // Sanitize text inputs
  const reason = body.reason?.trim().slice(0, 1000);
  const email = body.email?.trim().toLowerCase().slice(0, 255);
}
```

### Rate Limiting

Consider implementing rate limiting for production:

```typescript
// Example using next-rate-limit
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per window
});
```

---

## Authentication

### Admin Authentication

Admin access uses wallet signature verification:

```typescript
// Frontend: Sign message
const message = `Authenticate as admin\nTimestamp: ${Date.now()}`;
const signature = await signMessageAsync({ message });

// Backend: Verify signature
import { verifyMessage } from 'viem';

const recoveredAddress = await verifyMessage({
  message,
  signature,
});

const isAdmin = ADMIN_WALLETS.includes(recoveredAddress.toLowerCase());
```

### Admin Wallet Management

Admin wallets are defined in `lib/auth.ts`:

```typescript
export const ADMIN_WALLETS = [
  '0x24Ed4212a29808D2B11d8D23a1bbBe7f8443ac8C', // Contract owner
  // Add additional admins as needed
].map(addr => addr.toLowerCase());
```

---

## Security Checklist

### Smart Contracts

- [x] ReentrancyGuard on all state-changing functions
- [x] Whitelist check before all operations
- [x] SafeERC20 for token transfers
- [x] Immutable critical addresses
- [x] K-invariant enforcement
- [x] Minimum liquidity lock
- [x] Overflow protection (Solidity 0.8+)
- [ ] Professional security audit (recommended for mainnet)

### Frontend

- [x] Wallet signature verification for admin
- [x] Slippage protection on all swaps
- [x] Deadline on all transactions
- [x] Input validation and sanitization
- [x] Environment variable protection
- [x] HTTPS enforcement (via Vercel)

### Database

- [x] Row Level Security enabled
- [x] Input sanitization
- [x] Parameterized queries (via Supabase client)
- [x] No direct SQL in client code

### Infrastructure

- [x] Environment variables for secrets
- [x] Vercel production deployment
- [x] Supabase managed database
- [ ] Rate limiting (recommended)
- [ ] DDoS protection (via Vercel)

---

## Incident Response

### Suspected Compromise

1. **Immediate Actions:**
   - Pause frontend if possible
   - Do NOT interact with contracts
   - Document the issue

2. **Investigation:**
   - Review transaction history
   - Check whitelist modifications
   - Analyze contract state

3. **Recovery:**
   - Transfer ownership if compromised
   - Remove malicious whitelist entries
   - Deploy new contracts if necessary

### Contract Ownership

Only the owner can:
- Add/remove whitelist entries
- Transfer ownership

**Transfer Ownership:**
```bash
npx hardhat run scripts/transferOwnership.ts --network sepolia
```

---

## Audit Recommendations

Before mainnet deployment:

1. **Smart Contract Audit**
   - Recommended auditors: OpenZeppelin, Trail of Bits, Consensys Diligence
   - Focus on: access control, math overflow, reentrancy

2. **Frontend Security Review**
   - XSS vulnerability scan
   - Dependency audit (`npm audit`)
   - CSP header configuration

3. **Penetration Testing**
   - API endpoint security
   - Admin authentication bypass attempts
   - Rate limiting effectiveness

---

## Reporting Vulnerabilities

If you discover a security vulnerability:

1. **Do NOT** disclose publicly
2. Email details to: [security contact]
3. Include:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if any)

We take all security reports seriously and will respond within 48 hours.

---

## Resources

- [OpenZeppelin Security](https://docs.openzeppelin.com/contracts/4.x/)
- [Solidity Security Considerations](https://docs.soliditylang.org/en/latest/security-considerations.html)
- [Ethereum Smart Contract Best Practices](https://consensys.github.io/smart-contract-best-practices/)
- [OWASP Web Security](https://owasp.org/www-project-web-security-testing-guide/)
