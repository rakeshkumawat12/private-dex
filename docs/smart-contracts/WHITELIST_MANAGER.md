# WhitelistManager Contract

The WhitelistManager is the core access control contract for the VΛULT Private DEX. It maintains a global whitelist of addresses permitted to interact with the protocol.

## Contract Information

| Property | Value |
|----------|-------|
| File | `contracts/access/WhitelistManager.sol` |
| Solidity | ^0.8.20 |
| License | MIT |
| Inherits | Ownable, Pausable |
| Deployed (Sepolia) | `0x3B0CD801d3F0f3F5C69905e7D3bfE225A994469F` |

## Overview

```solidity
contract WhitelistManager is Ownable, Pausable {
    mapping(address => bool) private _whitelist;

    function addToWhitelist(address account) external onlyOwner;
    function removeFromWhitelist(address account) external onlyOwner;
    function isWhitelisted(address account) external view returns (bool);
    function isWhitelistedAndActive(address account) external view returns (bool);
    function pause() external onlyOwner;
    function unpause() external onlyOwner;
}
```

## State Variables

### `_whitelist`
```solidity
mapping(address => bool) private _whitelist;
```
Private mapping storing whitelist status for each address.

## Functions

### Write Functions

#### `addToWhitelist`
```solidity
function addToWhitelist(address account) external onlyOwner
```

Adds a single address to the whitelist.

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| account | address | The address to whitelist |

**Requirements:**
- Caller must be the contract owner
- `account` cannot be zero address
- `account` must not already be whitelisted

**Events:**
- Emits `AddressWhitelisted(account)`

**Example:**
```javascript
const tx = await whitelistManager.addToWhitelist("0x123...");
await tx.wait();
```

---

#### `batchAddToWhitelist`
```solidity
function batchAddToWhitelist(address[] calldata accounts) external onlyOwner
```

Adds multiple addresses to the whitelist in a single transaction.

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| accounts | address[] | Array of addresses to whitelist |

**Requirements:**
- Caller must be the contract owner
- No address can be zero address
- Skips already whitelisted addresses

**Gas Savings:** More efficient than multiple `addToWhitelist` calls.

**Example:**
```javascript
const addresses = ["0x123...", "0x456...", "0x789..."];
const tx = await whitelistManager.batchAddToWhitelist(addresses);
await tx.wait();
```

---

#### `removeFromWhitelist`
```solidity
function removeFromWhitelist(address account) external onlyOwner
```

Removes a single address from the whitelist.

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| account | address | The address to remove |

**Requirements:**
- Caller must be the contract owner
- `account` must be whitelisted

**Events:**
- Emits `AddressRemovedFromWhitelist(account)`

---

#### `batchRemoveFromWhitelist`
```solidity
function batchRemoveFromWhitelist(address[] calldata accounts) external onlyOwner
```

Removes multiple addresses from the whitelist.

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| accounts | address[] | Array of addresses to remove |

**Requirements:**
- Caller must be the contract owner
- Skips non-whitelisted addresses

---

#### `pause`
```solidity
function pause() external onlyOwner
```

Pauses the whitelist system. When paused, `isWhitelistedAndActive()` returns `false` for all addresses.

**Use Case:** Emergency situations requiring immediate halt of all DEX operations.

---

#### `unpause`
```solidity
function unpause() external onlyOwner
```

Resumes normal whitelist operations after a pause.

---

### Read Functions

#### `isWhitelisted`
```solidity
function isWhitelisted(address account) external view returns (bool)
```

Checks if an address is in the whitelist.

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| account | address | The address to check |

**Returns:** `true` if whitelisted, `false` otherwise.

**Note:** Does not consider pause status.

---

#### `isWhitelistedAndActive`
```solidity
function isWhitelistedAndActive(address account) external view returns (bool)
```

Checks if an address is whitelisted AND the system is not paused.

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| account | address | The address to check |

**Returns:** `true` if whitelisted and not paused, `false` otherwise.

**Important:** This is the primary function used by other DEX contracts.

## Events

### `AddressWhitelisted`
```solidity
event AddressWhitelisted(address indexed account);
```
Emitted when an address is added to the whitelist.

### `AddressRemovedFromWhitelist`
```solidity
event AddressRemovedFromWhitelist(address indexed account);
```
Emitted when an address is removed from the whitelist.

## Usage Examples

### Check Whitelist Status (Frontend)

```typescript
import { useReadContract } from 'wagmi';
import { WHITELIST_MANAGER_ADDRESS, WHITELIST_MANAGER_ABI } from '@/lib/contracts';

function useIsWhitelisted(address: string) {
  return useReadContract({
    address: WHITELIST_MANAGER_ADDRESS,
    abi: WHITELIST_MANAGER_ABI,
    functionName: 'isWhitelistedAndActive',
    args: [address],
  });
}
```

### Add to Whitelist (Admin)

```typescript
import { useWriteContract } from 'wagmi';

function useAddToWhitelist() {
  const { writeContractAsync } = useWriteContract();

  return async (userAddress: string) => {
    const hash = await writeContractAsync({
      address: WHITELIST_MANAGER_ADDRESS,
      abi: WHITELIST_MANAGER_ABI,
      functionName: 'addToWhitelist',
      args: [userAddress],
    });
    return hash;
  };
}
```

### Check Whitelist (Hardhat Script)

```typescript
const whitelistManager = await ethers.getContractAt(
  "WhitelistManager",
  "0x3B0CD801d3F0f3F5C69905e7D3bfE225A994469F"
);

const isWhitelisted = await whitelistManager.isWhitelistedAndActive("0x123...");
console.log("Is whitelisted:", isWhitelisted);
```

## Integration with Other Contracts

Other DEX contracts call `isWhitelistedAndActive()` before executing operations:

```solidity
// In Router.sol
function addLiquidity(...) external nonReentrant returns (...) {
    require(
        whitelistManager.isWhitelistedAndActive(msg.sender),
        "Router: caller not whitelisted"
    );
    // ... rest of function
}
```

## Security Considerations

1. **Owner-Only Functions**: Only the contract owner can modify the whitelist
2. **Emergency Pause**: Owner can halt all operations instantly
3. **No Time Locks**: Changes take effect immediately
4. **Immutable Owner Transfer**: Ownership can be transferred but not renounced

## Gas Costs

| Function | Estimated Gas |
|----------|--------------|
| addToWhitelist | ~50,000 |
| removeFromWhitelist | ~30,000 |
| batchAddToWhitelist (10 addresses) | ~350,000 |
| isWhitelisted | ~2,500 (view) |
| pause | ~30,000 |

## Ownership Management

### Transfer Ownership

```typescript
// Transfer to new owner
const tx = await whitelistManager.transferOwnership("0xNewOwner...");
await tx.wait();
```

### Check Current Owner

```typescript
const owner = await whitelistManager.owner();
console.log("Current owner:", owner);
```
