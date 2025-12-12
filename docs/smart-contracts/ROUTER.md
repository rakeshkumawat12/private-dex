# Router Contract

The Router is the main user-facing contract for executing trades and managing liquidity in the VΛULT Private DEX.

## Contract Information

| Property | Value |
|----------|-------|
| File | `contracts/core/Router.sol` |
| Solidity | ^0.8.20 |
| License | MIT |
| Inherits | ReentrancyGuard |
| Deployed (Sepolia) | `0xc0aeB8bc024b95De284ADe61AF00c436181870d9` |

## Overview

```solidity
contract Router is ReentrancyGuard {
    address public immutable factory;
    address public immutable whitelistManager;

    // Liquidity Functions
    function addLiquidity(...) external returns (uint amountA, uint amountB, uint liquidity);
    function removeLiquidity(...) external returns (uint amountA, uint amountB);

    // Swap Functions
    function swapExactTokensForTokens(...) external returns (uint[] memory amounts);
    function swapTokensForExactTokens(...) external returns (uint[] memory amounts);

    // Helper Functions
    function quote(...) external pure returns (uint amountB);
    function getAmountOut(...) external pure returns (uint amountOut);
    function getAmountIn(...) external pure returns (uint amountIn);
}
```

## State Variables

### `factory`
```solidity
address public immutable factory;
```
Immutable reference to the Factory contract.

### `whitelistManager`
```solidity
address public immutable whitelistManager;
```
Immutable reference to the WhitelistManager contract.

## Modifiers

### `ensure`
```solidity
modifier ensure(uint deadline) {
    require(deadline >= block.timestamp, "Router: EXPIRED");
    _;
}
```
Ensures transaction is executed before the deadline.

## Functions

### Liquidity Functions

#### `addLiquidity`
```solidity
function addLiquidity(
    address tokenA,
    address tokenB,
    uint amountADesired,
    uint amountBDesired,
    uint amountAMin,
    uint amountBMin,
    address to,
    uint deadline
) external nonReentrant ensure(deadline) returns (
    uint amountA,
    uint amountB,
    uint liquidity
)
```

Adds liquidity to a trading pair.

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| tokenA | address | First token address |
| tokenB | address | Second token address |
| amountADesired | uint | Desired amount of tokenA |
| amountBDesired | uint | Desired amount of tokenB |
| amountAMin | uint | Minimum tokenA (slippage protection) |
| amountBMin | uint | Minimum tokenB (slippage protection) |
| to | address | Recipient of LP tokens |
| deadline | uint | Transaction deadline timestamp |

**Returns:**
| Name | Type | Description |
|------|------|-------------|
| amountA | uint | Actual tokenA deposited |
| amountB | uint | Actual tokenB deposited |
| liquidity | uint | LP tokens minted |

**Requirements:**
- Caller must be whitelisted
- Transaction must be before deadline
- Actual amounts must meet minimums
- User must have approved tokens

**Example:**
```javascript
// First approve both tokens
await tokenA.approve(ROUTER_ADDRESS, amountA);
await tokenB.approve(ROUTER_ADDRESS, amountB);

// Add liquidity
const deadline = Math.floor(Date.now() / 1000) + 3600; // 1 hour
const tx = await router.addLiquidity(
  tokenA.address,
  tokenB.address,
  ethers.parseEther("100"),  // 100 Token A
  ethers.parseEther("100"),  // 100 Token B
  ethers.parseEther("95"),   // Min 95 Token A (5% slippage)
  ethers.parseEther("95"),   // Min 95 Token B
  userAddress,
  deadline
);
```

---

#### `removeLiquidity`
```solidity
function removeLiquidity(
    address tokenA,
    address tokenB,
    uint liquidity,
    uint amountAMin,
    uint amountBMin,
    address to,
    uint deadline
) external nonReentrant ensure(deadline) returns (
    uint amountA,
    uint amountB
)
```

Removes liquidity from a trading pair.

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| tokenA | address | First token address |
| tokenB | address | Second token address |
| liquidity | uint | LP tokens to burn |
| amountAMin | uint | Minimum tokenA to receive |
| amountBMin | uint | Minimum tokenB to receive |
| to | address | Recipient of tokens |
| deadline | uint | Transaction deadline |

**Returns:**
| Name | Type | Description |
|------|------|-------------|
| amountA | uint | TokenA received |
| amountB | uint | TokenB received |

**Requirements:**
- Caller must be whitelisted
- Must approve LP tokens to Router
- Amounts must meet minimums

**Example:**
```javascript
// Approve LP tokens
const pairAddress = await factory.getPair(tokenA, tokenB);
const pair = await ethers.getContractAt("Pair", pairAddress);
await pair.approve(ROUTER_ADDRESS, lpAmount);

// Remove liquidity
const tx = await router.removeLiquidity(
  tokenA.address,
  tokenB.address,
  lpAmount,
  minAmountA,
  minAmountB,
  userAddress,
  deadline
);
```

---

### Swap Functions

#### `swapExactTokensForTokens`
```solidity
function swapExactTokensForTokens(
    uint amountIn,
    uint amountOutMin,
    address[] calldata path,
    address to,
    uint deadline
) external nonReentrant ensure(deadline) returns (uint[] memory amounts)
```

Swaps an exact amount of input tokens for as many output tokens as possible.

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| amountIn | uint | Exact input amount |
| amountOutMin | uint | Minimum output (slippage) |
| path | address[] | Trading path [tokenIn, tokenOut] |
| to | address | Recipient of output tokens |
| deadline | uint | Transaction deadline |

**Returns:**
| Name | Type | Description |
|------|------|-------------|
| amounts | uint[] | Actual amounts [in, out] |

**Example:**
```javascript
// Approve input token
await tokenA.approve(ROUTER_ADDRESS, amountIn);

// Swap Token A for Token B
const tx = await router.swapExactTokensForTokens(
  ethers.parseEther("10"),     // Swap exactly 10 Token A
  ethers.parseEther("9.5"),    // Expect at least 9.5 Token B
  [tokenA.address, tokenB.address],
  userAddress,
  deadline
);
```

---

#### `swapTokensForExactTokens`
```solidity
function swapTokensForExactTokens(
    uint amountOut,
    uint amountInMax,
    address[] calldata path,
    address to,
    uint deadline
) external nonReentrant ensure(deadline) returns (uint[] memory amounts)
```

Swaps tokens to receive an exact amount of output tokens.

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| amountOut | uint | Exact output amount wanted |
| amountInMax | uint | Maximum input (slippage) |
| path | address[] | Trading path |
| to | address | Recipient |
| deadline | uint | Deadline |

**Returns:**
| Name | Type | Description |
|------|------|-------------|
| amounts | uint[] | Actual amounts [in, out] |

**Example:**
```javascript
// I want exactly 10 Token B, willing to spend up to 11 Token A
await tokenA.approve(ROUTER_ADDRESS, ethers.parseEther("11"));

const tx = await router.swapTokensForExactTokens(
  ethers.parseEther("10"),     // Want exactly 10 Token B
  ethers.parseEther("11"),     // Spend max 11 Token A
  [tokenA.address, tokenB.address],
  userAddress,
  deadline
);
```

---

### Helper Functions

#### `quote`
```solidity
function quote(
    uint amountA,
    uint reserveA,
    uint reserveB
) public pure returns (uint amountB)
```

Calculates equivalent amount based on reserves.

**Formula:** `amountB = amountA * reserveB / reserveA`

**Use Case:** Calculate proportional amounts when adding liquidity.

---

#### `getAmountOut`
```solidity
function getAmountOut(
    uint amountIn,
    uint reserveIn,
    uint reserveOut
) public pure returns (uint amountOut)
```

Calculates output amount for a given input (including 0.3% fee).

**Formula:**
```
amountInWithFee = amountIn * 997
amountOut = (amountInWithFee * reserveOut) / (reserveIn * 1000 + amountInWithFee)
```

---

#### `getAmountIn`
```solidity
function getAmountIn(
    uint amountOut,
    uint reserveIn,
    uint reserveOut
) public pure returns (uint amountIn)
```

Calculates required input for a desired output (including 0.3% fee).

---

#### `getAmountsOut`
```solidity
function getAmountsOut(
    uint amountIn,
    address[] memory path
) public view returns (uint[] memory amounts)
```

Calculates output amounts for a multi-hop swap path.

**Example:**
```javascript
const amounts = await router.getAmountsOut(
  ethers.parseEther("10"),
  [tokenA.address, tokenB.address]
);
console.log(`Input: ${amounts[0]}, Output: ${amounts[1]}`);
```

---

#### `getAmountsIn`
```solidity
function getAmountsIn(
    uint amountOut,
    address[] memory path
) public view returns (uint[] memory amounts)
```

Calculates required inputs for a desired output in multi-hop.

## Events

The Router itself doesn't emit events, but operations trigger events in Pair contracts:
- `Mint` - When liquidity is added
- `Burn` - When liquidity is removed
- `Swap` - When tokens are swapped

## Usage Examples

### Complete Swap Flow (Frontend)

```typescript
import { useWriteContract, useReadContract } from 'wagmi';
import { parseEther, formatEther } from 'viem';

function SwapComponent() {
  const { writeContractAsync } = useWriteContract();

  // Get expected output
  const { data: amounts } = useReadContract({
    address: ROUTER_ADDRESS,
    abi: ROUTER_ABI,
    functionName: 'getAmountsOut',
    args: [parseEther('10'), [TOKEN_A, TOKEN_B]],
  });

  const handleSwap = async () => {
    const deadline = BigInt(Math.floor(Date.now() / 1000) + 3600);
    const minOutput = amounts[1] * 95n / 100n; // 5% slippage

    // Step 1: Approve
    await writeContractAsync({
      address: TOKEN_A,
      abi: ERC20_ABI,
      functionName: 'approve',
      args: [ROUTER_ADDRESS, parseEther('10')],
    });

    // Step 2: Swap
    await writeContractAsync({
      address: ROUTER_ADDRESS,
      abi: ROUTER_ABI,
      functionName: 'swapExactTokensForTokens',
      args: [
        parseEther('10'),
        minOutput,
        [TOKEN_A, TOKEN_B],
        userAddress,
        deadline,
      ],
    });
  };

  return (
    <div>
      <p>Expected output: {amounts ? formatEther(amounts[1]) : '...'}</p>
      <button onClick={handleSwap}>Swap</button>
    </div>
  );
}
```

## Security Features

1. **Reentrancy Guard**: All state-changing functions are protected
2. **Whitelist Check**: Every operation verifies caller is whitelisted
3. **Deadline Check**: Prevents stale transactions from executing
4. **Slippage Protection**: Min/max amount parameters protect users
5. **Immutable References**: Factory and whitelist addresses cannot change

## Gas Costs

| Function | Estimated Gas |
|----------|--------------|
| addLiquidity | ~150,000 |
| removeLiquidity | ~120,000 |
| swapExactTokensForTokens | ~100,000 |
| swapTokensForExactTokens | ~100,000 |
| getAmountsOut | ~5,000 (view) |

## Error Messages

| Error | Cause |
|-------|-------|
| "Router: EXPIRED" | Transaction deadline passed |
| "Router: caller not whitelisted" | Caller not on whitelist |
| "Router: INSUFFICIENT_OUTPUT_AMOUNT" | Slippage exceeded |
| "Router: INSUFFICIENT_A_AMOUNT" | Not enough token A received |
| "Router: INSUFFICIENT_B_AMOUNT" | Not enough token B received |
| "Router: INVALID_PATH" | Path must have 2+ tokens |
