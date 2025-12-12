# Contributing Guide

Thank you for your interest in contributing to the VΛULT Private DEX! This guide will help you get started.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Project Structure](#project-structure)
- [Development Workflow](#development-workflow)
- [Coding Standards](#coding-standards)
- [Testing](#testing)
- [Submitting Changes](#submitting-changes)
- [Review Process](#review-process)

---

## Code of Conduct

- Be respectful and inclusive
- Provide constructive feedback
- Focus on the code, not the person
- Help others learn and grow

---

## Getting Started

### Prerequisites

- Node.js 18+
- Git
- MetaMask or compatible wallet
- Basic knowledge of:
  - TypeScript/JavaScript
  - React/Next.js
  - Solidity (for smart contracts)
  - Ethereum/Web3

### Fork and Clone

```bash
# Fork the repository on GitHub, then:
git clone https://github.com/YOUR_USERNAME/private-dex.git
cd private-dex
```

---

## Development Setup

### Smart Contracts

```bash
cd smart-contracts
npm install

# Create environment file
cp .env.example .env
# Edit .env with your values

# Compile contracts
npx hardhat compile

# Run tests
npx hardhat test

# Start local node
npx hardhat node
```

### Frontend

```bash
cd frontend
npm install

# Create environment file
cp .env.example .env.local
# Edit .env.local with your values

# Start development server
npm run dev
```

### Local Development Stack

For full local development:

1. **Terminal 1:** Start local Hardhat node
   ```bash
   cd smart-contracts && npx hardhat node
   ```

2. **Terminal 2:** Deploy contracts locally
   ```bash
   cd smart-contracts && npx hardhat run scripts/deploy.ts --network localhost
   ```

3. **Terminal 3:** Start frontend
   ```bash
   cd frontend && npm run dev
   ```

---

## Project Structure

```
private-dex/
├── smart-contracts/          # Solidity contracts
│   ├── contracts/
│   │   ├── core/            # Main protocol contracts
│   │   └── test/            # Test helper contracts
│   ├── scripts/             # Deployment scripts
│   ├── test/                # Contract tests
│   └── hardhat.config.ts
│
├── frontend/                 # Next.js application
│   ├── app/                 # App Router pages
│   ├── components/          # React components
│   ├── lib/                 # Utilities and config
│   └── hooks/               # Custom React hooks
│
└── docs/                    # Documentation
```

---

## Development Workflow

### Branch Naming

Use descriptive branch names:

```
feature/add-multi-hop-swaps
fix/gas-estimation-error
docs/update-api-reference
refactor/swap-component
```

### Commit Messages

Follow conventional commits:

```
feat: add multi-hop swap support
fix: resolve gas estimation overflow
docs: update deployment guide
refactor: extract swap logic to hook
test: add liquidity edge cases
chore: update dependencies
```

### Pull Request Template

When creating a PR, include:

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Tests pass locally
- [ ] Added new tests for changes
- [ ] Tested on testnet

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-reviewed code
- [ ] Comments added where needed
- [ ] Documentation updated
```

---

## Coding Standards

### TypeScript/JavaScript

```typescript
// Use TypeScript for type safety
interface SwapParams {
  tokenIn: Address;
  tokenOut: Address;
  amountIn: bigint;
  minAmountOut: bigint;
}

// Prefer const over let
const deadline = BigInt(Math.floor(Date.now() / 1000) + 1200);

// Use descriptive variable names
const isWhitelistedUser = await checkWhitelistStatus(address);

// Handle errors properly
try {
  await executeSwap(params);
} catch (error) {
  console.error("Swap failed:", error);
  throw error;
}
```

### React Components

```tsx
// Use functional components with TypeScript
interface TokenInputProps {
  value: string;
  onChange: (value: string) => void;
  token: Token;
  disabled?: boolean;
}

export function TokenInput({
  value,
  onChange,
  token,
  disabled = false,
}: TokenInputProps) {
  return (
    <div className="flex items-center gap-2">
      <Input
        type="number"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
      />
      <TokenSelector token={token} />
    </div>
  );
}
```

### Solidity

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/// @title Example Contract
/// @notice Brief description of the contract
/// @dev Implementation details
contract Example is ReentrancyGuard {
    // State variables at the top
    address public immutable factory;
    mapping(address => uint256) public balances;

    // Events
    event Deposited(address indexed user, uint256 amount);

    // Modifiers
    modifier onlyWhitelisted() {
        require(whitelist.isWhitelisted(msg.sender), "Not whitelisted");
        _;
    }

    // Constructor
    constructor(address _factory) {
        factory = _factory;
    }

    // External functions
    function deposit() external payable nonReentrant onlyWhitelisted {
        balances[msg.sender] += msg.value;
        emit Deposited(msg.sender, msg.value);
    }

    // Internal functions
    function _calculateFee(uint256 amount) internal pure returns (uint256) {
        return (amount * 3) / 1000; // 0.3%
    }
}
```

### File Organization

```
// Good: One component per file
components/
├── swap/
│   ├── SwapCard.tsx
│   ├── TokenInput.tsx
│   └── SwapButton.tsx
└── ui/
    ├── Button.tsx
    └── Input.tsx

// Good: Colocation of related files
app/
├── swap/
│   ├── page.tsx
│   ├── loading.tsx
│   └── error.tsx
```

---

## Testing

### Smart Contract Tests

```typescript
// test/Router.test.ts
import { expect } from "chai";
import { ethers } from "hardhat";

describe("Router", function () {
  let router: Router;
  let tokenA: TestToken;
  let tokenB: TestToken;

  beforeEach(async function () {
    // Setup
    const [owner] = await ethers.getSigners();
    // ... deploy contracts
  });

  describe("swapExactTokensForTokens", function () {
    it("should swap tokens correctly", async function () {
      const amountIn = ethers.parseEther("10");
      const minAmountOut = ethers.parseEther("9");

      await tokenA.approve(router.address, amountIn);

      await expect(
        router.swapExactTokensForTokens(
          amountIn,
          minAmountOut,
          [tokenA.address, tokenB.address],
          owner.address,
          deadline
        )
      ).to.emit(pair, "Swap");
    });

    it("should revert if caller not whitelisted", async function () {
      await expect(
        router.connect(nonWhitelisted).swapExactTokensForTokens(...)
      ).to.be.revertedWith("Router: caller not whitelisted");
    });
  });
});
```

Run tests:

```bash
cd smart-contracts
npx hardhat test
npx hardhat coverage  # Coverage report
```

### Frontend Tests

```typescript
// __tests__/SwapCard.test.tsx
import { render, screen, fireEvent } from "@testing-library/react";
import { SwapCard } from "@/components/swap/SwapCard";

describe("SwapCard", () => {
  it("renders swap inputs", () => {
    render(<SwapCard />);
    expect(screen.getByPlaceholderText("0.0")).toBeInTheDocument();
  });

  it("updates output on input change", async () => {
    render(<SwapCard />);
    const input = screen.getByPlaceholderText("0.0");
    fireEvent.change(input, { target: { value: "10" } });
    // Assert output updated
  });
});
```

Run tests:

```bash
cd frontend
npm test
npm run test:coverage
```

---

## Submitting Changes

### Before Submitting

1. **Ensure tests pass:**
   ```bash
   # Smart contracts
   cd smart-contracts && npx hardhat test

   # Frontend
   cd frontend && npm run lint && npm run build
   ```

2. **Update documentation** if needed

3. **Test on testnet** for smart contract changes

### Creating a Pull Request

1. Push your branch:
   ```bash
   git push origin feature/your-feature
   ```

2. Open a PR on GitHub

3. Fill out the PR template

4. Request review from maintainers

---

## Review Process

### What We Look For

- **Correctness:** Does the code work as intended?
- **Security:** Are there any vulnerabilities?
- **Performance:** Is it efficient?
- **Readability:** Is it easy to understand?
- **Tests:** Are changes covered by tests?
- **Documentation:** Is it documented?

### Review Timeline

- Initial review: 2-3 business days
- Follow-up reviews: 1-2 business days

### After Approval

Once approved, a maintainer will:
1. Squash and merge (if needed)
2. Delete the feature branch
3. Update changelog (if applicable)

---

## Areas for Contribution

### Good First Issues

Look for issues labeled `good-first-issue`:
- Documentation improvements
- Bug fixes
- Test coverage
- UI/UX improvements

### Feature Development

Before starting major features:
1. Check existing issues/PRs
2. Open an issue to discuss
3. Get feedback on approach

### Documentation

Documentation improvements are always welcome:
- Fix typos
- Add examples
- Improve clarity
- Add translations

---

## Questions?

- Open a GitHub issue for technical questions
- Check existing documentation
- Review closed issues/PRs

Thank you for contributing!
