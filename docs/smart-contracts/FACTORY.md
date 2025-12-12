# Factory Contract

The Factory contract is responsible for creating and managing trading pair contracts in the VΛULT Private DEX.

## Contract Information

| Property | Value |
|----------|-------|
| File | `contracts/core/Factory.sol` |
| Solidity | ^0.8.20 |
| License | MIT |
| Inherits | None |
| Deployed (Sepolia) | `0x01DD4b85b88DE66d1d632a799944249da7c58B9A` |

## Overview

```solidity
contract Factory {
    address public immutable whitelistManager;

    mapping(address => mapping(address => address)) public getPair;
    address[] public allPairs;

    function createPair(address tokenA, address tokenB) external returns (address pair);
    function allPairsLength() external view returns (uint);
}
```

## State Variables

### `whitelistManager`
```solidity
address public immutable whitelistManager;
```
Immutable reference to the WhitelistManager contract. Set during deployment and cannot be changed.

### `getPair`
```solidity
mapping(address => mapping(address => address)) public getPair;
```
Nested mapping to look up pair addresses. `getPair[tokenA][tokenB]` returns the pair address (works both ways).

### `allPairs`
```solidity
address[] public allPairs;
```
Array of all created pair addresses.

## Functions

### Write Functions

#### `createPair`
```solidity
function createPair(address tokenA, address tokenB) external returns (address pair)
```

Creates a new liquidity pair for two tokens.

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| tokenA | address | First token address |
| tokenB | address | Second token address |

**Returns:** Address of the newly created Pair contract.

**Requirements:**
- Caller must be whitelisted
- `tokenA` and `tokenB` must be different
- Neither token can be zero address
- Pair must not already exist

**Events:**
- Emits `PairCreated(token0, token1, pair, allPairs.length)`

**Technical Details:**
- Uses CREATE2 for deterministic addresses
- Tokens are sorted (token0 < token1) for consistency
- Pair is added to both mapping directions

**Example:**
```javascript
const tx = await factory.createPair(
  "0xTokenA...",
  "0xTokenB..."
);
const receipt = await tx.wait();

// Get pair address from event
const pairCreatedEvent = receipt.events.find(e => e.event === 'PairCreated');
const pairAddress = pairCreatedEvent.args.pair;
```

---

### Read Functions

#### `getPair`
```solidity
function getPair(address tokenA, address tokenB) external view returns (address pair)
```

Returns the pair address for two tokens.

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| tokenA | address | First token address |
| tokenB | address | Second token address |

**Returns:** Pair address, or zero address if not created.

**Note:** Order of tokens doesn't matter - both directions work.

**Example:**
```javascript
const pairAddress = await factory.getPair(tokenA, tokenB);
if (pairAddress === ethers.ZeroAddress) {
  console.log("Pair does not exist");
}
```

---

#### `allPairs`
```solidity
function allPairs(uint index) external view returns (address pair)
```

Returns the pair address at the specified index.

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| index | uint | Index in the allPairs array |

**Returns:** Pair address at that index.

---

#### `allPairsLength`
```solidity
function allPairsLength() external view returns (uint)
```

Returns the total number of pairs created.

**Returns:** Number of pairs.

**Example:**
```javascript
const totalPairs = await factory.allPairsLength();
console.log(`Total pairs: ${totalPairs}`);

// Iterate all pairs
for (let i = 0; i < totalPairs; i++) {
  const pairAddress = await factory.allPairs(i);
  console.log(`Pair ${i}: ${pairAddress}`);
}
```

## Events

### `PairCreated`
```solidity
event PairCreated(
    address indexed token0,
    address indexed token1,
    address pair,
    uint allPairsLength
);
```

Emitted when a new pair is created.

| Parameter | Type | Description |
|-----------|------|-------------|
| token0 | address | Lower address token |
| token1 | address | Higher address token |
| pair | address | New pair contract address |
| allPairsLength | uint | Total number of pairs after creation |

## CREATE2 Address Derivation

Pair addresses are deterministic based on:
- Factory address
- Token addresses (sorted)
- Pair bytecode hash

This allows calculating pair addresses off-chain:

```javascript
import { getCreate2Address, keccak256, solidityPacked } from 'ethers';

function getPairAddress(factoryAddress, tokenA, tokenB, pairBytecodeHash) {
  const [token0, token1] = tokenA.toLowerCase() < tokenB.toLowerCase()
    ? [tokenA, tokenB]
    : [tokenB, tokenA];

  const salt = keccak256(solidityPacked(['address', 'address'], [token0, token1]));

  return getCreate2Address(factoryAddress, salt, pairBytecodeHash);
}
```

## Usage Examples

### Create a New Pair

```typescript
import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi';

function CreatePairButton({ tokenA, tokenB }) {
  const { writeContractAsync } = useWriteContract();

  const handleCreate = async () => {
    const hash = await writeContractAsync({
      address: FACTORY_ADDRESS,
      abi: FACTORY_ABI,
      functionName: 'createPair',
      args: [tokenA, tokenB],
    });

    console.log('Transaction hash:', hash);
  };

  return <button onClick={handleCreate}>Create Pair</button>;
}
```

### Check if Pair Exists

```typescript
import { useReadContract } from 'wagmi';

function usePairExists(tokenA: string, tokenB: string) {
  const { data: pairAddress } = useReadContract({
    address: FACTORY_ADDRESS,
    abi: FACTORY_ABI,
    functionName: 'getPair',
    args: [tokenA, tokenB],
  });

  return pairAddress && pairAddress !== '0x0000000000000000000000000000000000000000';
}
```

### Get All Pairs (Hardhat Script)

```typescript
async function getAllPairs() {
  const factory = await ethers.getContractAt("Factory", FACTORY_ADDRESS);

  const pairCount = await factory.allPairsLength();
  const pairs = [];

  for (let i = 0; i < pairCount; i++) {
    const pairAddress = await factory.allPairs(i);
    const pair = await ethers.getContractAt("Pair", pairAddress);

    const token0 = await pair.token0();
    const token1 = await pair.token1();
    const reserves = await pair.getReserves();

    pairs.push({
      address: pairAddress,
      token0,
      token1,
      reserve0: reserves[0],
      reserve1: reserves[1],
    });
  }

  return pairs;
}
```

## Integration with Router

The Router uses the Factory to:
1. Look up existing pairs for swaps
2. Create new pairs when adding initial liquidity

```solidity
// In Router.sol
function _getPair(address tokenA, address tokenB) internal view returns (address) {
    address pair = factory.getPair(tokenA, tokenB);
    require(pair != address(0), "Router: pair does not exist");
    return pair;
}
```

## Security Considerations

1. **Whitelist Enforcement**: Only whitelisted users can create pairs
2. **Duplicate Prevention**: Same pair cannot be created twice
3. **Token Validation**: Prevents zero address and identical tokens
4. **Immutable Whitelist Reference**: Cannot be changed after deployment

## Gas Costs

| Function | Estimated Gas |
|----------|--------------|
| createPair | ~2,500,000 |
| getPair | ~2,500 (view) |
| allPairsLength | ~2,500 (view) |
