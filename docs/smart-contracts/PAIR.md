# Pair Contract

The Pair contract implements an Automated Market Maker (AMM) liquidity pool using the constant product formula. Each Pair is an ERC20 token representing liquidity provider shares.

## Contract Information

| Property | Value |
|----------|-------|
| File | `contracts/core/Pair.sol` |
| Solidity | ^0.8.20 |
| License | MIT |
| Inherits | ERC20, ReentrancyGuard |

## Overview

```solidity
contract Pair is ERC20, ReentrancyGuard {
    address public immutable factory;
    address public immutable whitelistManager;
    address public token0;
    address public token1;

    uint112 private reserve0;
    uint112 private reserve1;
    uint32 private blockTimestampLast;

    uint public kLast; // reserve0 * reserve1

    function initialize(address _token0, address _token1) external;
    function mint(address to) external returns (uint liquidity);
    function burn(address to) external returns (uint amount0, uint amount1);
    function swap(uint amount0Out, uint amount1Out, address to) external;
    function getReserves() external view returns (uint112, uint112, uint32);
}
```

## AMM Formula

The Pair uses the **constant product formula**:

```
x * y = k

Where:
x = reserve0 (Token A balance)
y = reserve1 (Token B balance)
k = constant (only increases from fees)
```

### How Swaps Work

When swapping `dx` of token0 for token1:

```
(x + dx * 0.997) * (y - dy) = k
dy = y - k / (x + dx * 0.997)
dy = (dx * 0.997 * y) / (x + dx * 0.997)
```

The 0.997 factor accounts for the 0.3% fee.

## State Variables

### Tokens
```solidity
address public token0;  // Lower address token
address public token1;  // Higher address token
```

### Reserves
```solidity
uint112 private reserve0;      // Current balance of token0
uint112 private reserve1;      // Current balance of token1
uint32 private blockTimestampLast;  // Last update timestamp
```

### Constants
```solidity
uint public constant MINIMUM_LIQUIDITY = 1000;
```
Minimum LP tokens locked forever to prevent division by zero.

## Functions

### `initialize`
```solidity
function initialize(address _token0, address _token1) external
```

Called once by Factory when creating the pair.

**Requirements:**
- Can only be called by Factory
- Can only be called once

---

### `mint`
```solidity
function mint(address to) external nonReentrant returns (uint liquidity)
```

Mints LP tokens when liquidity is added.

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| to | address | Recipient of LP tokens |

**Returns:** Amount of LP tokens minted.

**How it works:**
1. Calculate token amounts deposited (balance - reserve)
2. If first liquidity: `liquidity = sqrt(amount0 * amount1) - MINIMUM_LIQUIDITY`
3. Otherwise: `liquidity = min(amount0 * totalSupply / reserve0, amount1 * totalSupply / reserve1)`
4. Mint LP tokens to `to`
5. Update reserves

**Events:** `Mint(sender, amount0, amount1)`

---

### `burn`
```solidity
function burn(address to) external nonReentrant returns (uint amount0, uint amount1)
```

Burns LP tokens to withdraw liquidity.

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| to | address | Recipient of tokens |

**Returns:**
| Name | Type | Description |
|------|------|-------------|
| amount0 | uint | Token0 amount withdrawn |
| amount1 | uint | Token1 amount withdrawn |

**How it works:**
1. Calculate LP tokens held by pair (sent before calling)
2. Calculate proportional token amounts: `amount = liquidity * reserve / totalSupply`
3. Transfer tokens to `to`
4. Burn LP tokens
5. Update reserves

**Events:** `Burn(sender, amount0, amount1, to)`

---

### `swap`
```solidity
function swap(
    uint amount0Out,
    uint amount1Out,
    address to
) external nonReentrant
```

Executes a token swap.

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| amount0Out | uint | Amount of token0 to send |
| amount1Out | uint | Amount of token1 to send |
| to | address | Recipient of output tokens |

**Requirements:**
- Caller must be whitelisted
- At least one output must be > 0
- Output must be less than reserves
- K invariant must be maintained (with fee)

**How it works:**
1. Validate outputs against reserves
2. Transfer output tokens
3. Calculate input amounts from new balances
4. Verify K invariant: `balance0Adjusted * balance1Adjusted >= k`
5. Update reserves

**Events:** `Swap(sender, amount0In, amount1In, amount0Out, amount1Out, to)`

---

### `sync`
```solidity
function sync() external nonReentrant
```

Forces reserves to match actual balances.

**Use Case:** Recover from direct token transfers to pair.

---

### `skim`
```solidity
function skim(address to) external nonReentrant
```

Sends excess tokens (above reserves) to an address.

**Use Case:** Recover tokens accidentally sent to pair.

---

### `getReserves`
```solidity
function getReserves() public view returns (
    uint112 _reserve0,
    uint112 _reserve1,
    uint32 _blockTimestampLast
)
```

Returns current reserves and last update time.

**Example:**
```javascript
const [reserve0, reserve1, timestamp] = await pair.getReserves();
console.log(`Reserve0: ${reserve0}, Reserve1: ${reserve1}`);
```

## Events

### `Mint`
```solidity
event Mint(address indexed sender, uint amount0, uint amount1);
```
Emitted when liquidity is added.

### `Burn`
```solidity
event Burn(address indexed sender, uint amount0, uint amount1, address indexed to);
```
Emitted when liquidity is removed.

### `Swap`
```solidity
event Swap(
    address indexed sender,
    uint amount0In,
    uint amount1In,
    uint amount0Out,
    uint amount1Out,
    address indexed to
);
```
Emitted on every swap.

### `Sync`
```solidity
event Sync(uint112 reserve0, uint112 reserve1);
```
Emitted when reserves are updated.

## LP Token Math

### First Liquidity Provider

```
liquidity = sqrt(amount0 * amount1) - MINIMUM_LIQUIDITY
```

The `MINIMUM_LIQUIDITY` (1000 wei) is permanently locked to prevent manipulation.

### Subsequent Providers

```
liquidity = min(
    (amount0 * totalSupply) / reserve0,
    (amount1 * totalSupply) / reserve1
)
```

You receive LP tokens proportional to your contribution.

### Withdrawal Calculation

```
amount0 = (liquidity * reserve0) / totalSupply
amount1 = (liquidity * reserve1) / totalSupply
```

You receive your proportional share of the pool.

## Fee Mechanism

The 0.3% fee is implemented in the K invariant check:

```solidity
uint balance0Adjusted = balance0 * 1000 - amount0In * 3;
uint balance1Adjusted = balance1 * 1000 - amount1In * 3;
require(
    balance0Adjusted * balance1Adjusted >= k * 1000000,
    "Pair: K"
);
```

This ensures K increases with each swap, benefiting LPs.

## Usage Examples

### Get Pool Information

```typescript
const pair = await ethers.getContractAt("Pair", pairAddress);

const token0 = await pair.token0();
const token1 = await pair.token1();
const [reserve0, reserve1] = await pair.getReserves();
const totalSupply = await pair.totalSupply();

console.log(`Pool: ${token0} / ${token1}`);
console.log(`Reserves: ${reserve0} / ${reserve1}`);
console.log(`Total LP Supply: ${totalSupply}`);
```

### Calculate LP Token Value

```typescript
async function getLPValue(pairAddress: string, lpAmount: bigint) {
  const pair = await ethers.getContractAt("Pair", pairAddress);

  const [reserve0, reserve1] = await pair.getReserves();
  const totalSupply = await pair.totalSupply();

  const amount0 = (lpAmount * reserve0) / totalSupply;
  const amount1 = (lpAmount * reserve1) / totalSupply;

  return { amount0, amount1 };
}
```

### Calculate Price

```typescript
function getPrice(reserve0: bigint, reserve1: bigint) {
  // Price of token0 in terms of token1
  return reserve1 / reserve0;
}
```

## Security Features

1. **Reentrancy Guard**: All state-changing functions protected
2. **Whitelist Check**: Only whitelisted users can swap
3. **K Invariant**: Mathematical guarantee against drain attacks
4. **Minimum Liquidity**: Prevents first-depositor manipulation
5. **Reserve Overflow Protection**: Uses uint112 for packing

## Gas Costs

| Function | Estimated Gas |
|----------|--------------|
| mint | ~100,000 |
| burn | ~80,000 |
| swap | ~70,000 |
| getReserves | ~2,500 (view) |

## Error Messages

| Error | Cause |
|-------|-------|
| "Pair: FORBIDDEN" | Not called by factory or not whitelisted |
| "Pair: INSUFFICIENT_LIQUIDITY_MINTED" | Deposit too small |
| "Pair: INSUFFICIENT_LIQUIDITY_BURNED" | LP amount is zero |
| "Pair: INSUFFICIENT_OUTPUT_AMOUNT" | Output amount is zero |
| "Pair: INSUFFICIENT_LIQUIDITY" | Not enough reserves |
| "Pair: K" | K invariant violated |
