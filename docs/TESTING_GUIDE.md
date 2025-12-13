# Manual Testing Guide - VΛULT Private DEX

This guide walks you through testing the complete swap and liquidity functionality via the UI.

## Prerequisites

Before you start testing, ensure you have:

1. **MetaMask installed** and connected to Sepolia testnet
2. **Sepolia ETH** for gas fees ([Get from faucet](https://sepoliafaucet.com/))
3. **Your wallet whitelisted** (address: `0xe68C17C8a4e782e27038d189E1fE8b3a4546c9b9` is already whitelisted as owner)
4. **Frontend running** locally or deployed on Vercel

---

## Part 1: Setup & Get Test Tokens

### Step 1: Connect Wallet

1. Open your DEX frontend (localhost:3000 or Vercel URL)
2. Click **"CONNECT_WALLET"** button in navbar
3. Select MetaMask and approve connection
4. Verify you're on **Sepolia** network (should show in navbar)
5. Your wallet address should appear in navbar

### Step 2: Get Test Tokens via Faucet

1. Navigate to **FAUCET** page (F4 or click "FAUCET" in navbar)
2. You should see 4 tokens listed:
   - WETH (Wrapped Ether)
   - USDC (USD Coin)
   - DAI (Dai Stablecoin)
   - USDT (Tether USD)
3. Click **"Get Test Tokens"** button
4. Approve **4 transactions** in MetaMask (one for each token):
   - Transaction 1: Mint 1000 WETH
   - Transaction 2: Mint 1000 USDC
   - Transaction 3: Mint 1000 DAI
   - Transaction 4: Mint 1000 USDT
5. Wait for all transactions to confirm (watch progress indicators)
6. You should see green checkmarks for all tokens when complete

### Step 3: Add Tokens to MetaMask

To see your token balances in MetaMask:

1. Open MetaMask
2. Click **"Import tokens"** at the bottom
3. Click **"Custom token"**
4. Add each token using these addresses:

**WETH:**
- Token Contract Address: `0x35287D9fDb7a1E7CC2212Fd1d57F8ae71cCA030A`
- Token Symbol: WETH
- Token Decimal: 18

**USDC:**
- Token Contract Address: `0x01134D4D7A522a5d601413dD3Bf33859B193063e`
- Token Symbol: USDC
- Token Decimal: 6

**DAI:**
- Token Contract Address: `0x64c178393Bbe0cAe2a78A19c58e9B3944c2D5B42`
- Token Symbol: DAI
- Token Decimal: 18

**USDT:**
- Token Contract Address: `0x5ccE1Fda0efe9A51302B3F26E3ca0d672536c2F7`
- Token Symbol: USDT
- Token Decimal: 6

5. After adding all tokens, verify you see:
   - 1000 WETH
   - 1000 USDC
   - 1000 DAI
   - 1000 USDT

---

## Part 2: Test Token Swap

### Test Case 1: Simple Swap (WETH → USDC)

1. Navigate to **SWAP** page (F1 or click "SWAP" in navbar)

2. **Select tokens:**
   - From (top): Select **WETH**
   - To (bottom): Select **USDC**

3. **Enter amount:**
   - Type `10` in the WETH input field
   - You should see the estimated USDC output appear automatically
   - Check the exchange rate displayed

4. **Check your balance:**
   - Should show "Balance: 1000.0 WETH" under input field

5. **Approve WETH spending** (first time only):
   - Click **"Approve WETH"** button
   - MetaMask will popup asking for approval
   - Click **"Confirm"** in MetaMask
   - Wait for approval transaction to confirm
   - Button should change to "Swap"

6. **Execute swap:**
   - Click **"Swap"** button
   - Review transaction details in MetaMask
   - Click **"Confirm"** in MetaMask
   - Wait for transaction to confirm (watch for success message)

7. **Verify results:**
   - Check MetaMask - WETH balance should decrease by ~10
   - USDC balance should increase
   - Check transaction on [Sepolia Etherscan](https://sepolia.etherscan.io/)

### Test Case 2: Reverse Swap (USDC → WETH)

1. Click the **swap direction button** (⇅ icon between token selectors)
   - This flips the tokens
   - Or manually select USDC (from) and WETH (to)

2. **Enter amount:**
   - Type `100` in USDC field
   - See estimated WETH output

3. **Approve USDC** (if not already approved):
   - Click **"Approve USDC"**
   - Confirm in MetaMask

4. **Execute swap:**
   - Click **"Swap"**
   - Confirm in MetaMask
   - Wait for confirmation

5. **Verify results** in MetaMask

### Test Case 3: Swap with Slippage Settings

1. Look for **slippage settings** (usually a gear icon ⚙️)
2. Try different slippage values:
   - 0.5% (default)
   - 1%
   - 5% (for testing)

3. Execute a swap with custom slippage
4. Verify the minimum received amount changes with slippage

### Test Case 4: Large Swap (Test Price Impact)

1. Try swapping a large amount: `500 WETH`
2. Notice:
   - Higher price impact warning
   - Less favorable exchange rate
   - Minimum received amount

3. This tests the AMM constant product formula (x * y = k)

---

## Part 3: Test Liquidity Provision

### Test Case 5: Add Liquidity (WETH/USDC Pool)

1. Navigate to **LIQUIDITY** page (F2 or click "LIQUIDITY" in navbar)

2. **Ensure "Add Liquidity" mode is selected** (toggle at top)

3. **Select token pair:**
   - Token A: Select **WETH**
   - Token B: Select **USDC**

4. **Enter amount for first token:**
   - Type `50` in WETH field
   - The USDC field should **auto-calculate** based on current pool ratio
   - Example: If pool is 100 WETH / 200,000 USDC, entering 50 WETH will require 100,000 USDC

5. **Check pool information:**
   - Should display current pool reserves
   - Your share of pool percentage
   - LP tokens you'll receive

6. **Approve tokens** (if not already approved):
   - Click **"Approve WETH"**
   - Confirm in MetaMask
   - Wait for confirmation
   - Click **"Approve USDC"**
   - Confirm in MetaMask
   - Wait for confirmation

7. **Add liquidity:**
   - Click **"Add Liquidity"** button
   - Review transaction details
   - Confirm in MetaMask
   - Wait for transaction confirmation

8. **Verify results:**
   - You should receive **LP tokens** representing your pool share
   - Check your LP token balance on the page
   - Your WETH and USDC balances should decrease
   - Pool information should update showing your contribution

### Test Case 6: Add Liquidity to Different Pool (DAI/USDT)

1. Still on LIQUIDITY page

2. **Select different pair:**
   - Token A: Select **DAI**
   - Token B: Select **USDT**

3. **Add liquidity:**
   - Enter `100` DAI
   - USDT amount should auto-calculate (should be ~100 USDT based on 1:1 pool ratio)
   - Approve both tokens if needed
   - Click "Add Liquidity"
   - Confirm transaction

4. **Verify:**
   - You now have LP tokens for TWO different pools
   - Check both pool balances

---

## Part 4: Test Liquidity Removal

### Test Case 7: Remove Liquidity

1. Still on **LIQUIDITY** page

2. **Switch to "Remove Liquidity" mode:**
   - Click the **"Remove"** toggle at top of page

3. **Select pool:**
   - Choose the same pair you added liquidity to (e.g., WETH/USDC)

4. **Enter LP token amount to remove:**
   - You can use percentage buttons: 25%, 50%, 75%, 100%
   - Or manually enter amount of LP tokens to burn

5. **Check preview:**
   - Should show how much WETH and USDC you'll receive back
   - Shows your remaining pool share

6. **Remove liquidity:**
   - Click **"Remove Liquidity"** button
   - Confirm transaction in MetaMask
   - Wait for confirmation

7. **Verify results:**
   - Your WETH and USDC balances should increase
   - LP token balance should decrease
   - Pool share percentage should decrease

---

## Part 5: Test Edge Cases

### Test Case 8: Insufficient Balance

1. Try to swap more tokens than you have
   - Enter `10000 WETH` (more than your balance)
   - Button should be disabled
   - Should show error message "Insufficient balance"

### Test Case 9: Zero Amount

1. Try entering `0` or leaving field empty
2. Swap/Add Liquidity button should be disabled

### Test Case 10: Wallet Disconnect/Reconnect

1. Disconnect wallet from MetaMask
2. Page should show "Connect Wallet" button
3. Reconnect wallet
4. All functionality should work again

### Test Case 11: Wrong Network

1. In MetaMask, switch to a different network (e.g., Ethereum Mainnet)
2. Frontend should show **"WRONG_NETWORK"** warning
3. Click to switch back to Sepolia
4. Should reconnect properly

---

## Part 6: Verify On-Chain Data

### Check Pool Stats

1. Navigate to **STATS** page (F3)
2. Verify you see all 4 pools:
   - WETH/USDC
   - WETH/DAI
   - USDC/USDT
   - DAI/USDT

3. Check pool information:
   - Total liquidity (TVL)
   - Your liquidity contribution
   - Trading volume
   - Reserve balances

### Check Transactions on Etherscan

1. Go to [Sepolia Etherscan](https://sepolia.etherscan.io/)
2. Enter your wallet address
3. Verify all transactions:
   - Token mints from faucet
   - Token approvals
   - Swaps
   - Add liquidity
   - Remove liquidity

### Check Contract Interactions on Blockscout

1. Go to [Sepolia Blockscout](https://eth-sepolia.blockscout.com/)
2. Check each contract:

**Router Contract:** `0x05b6B7d9cE4BA0f12040664167b34382E050eC87`
- Verify swap transactions
- Check addLiquidity calls
- Verify removeLiquidity calls

**Pool Contracts:**
- WETH/USDC: `0xcC885a0801eEA25E53daAD94008CF89B4299D208`
- Check reserves
- Verify mint/burn events
- Check swap events

---

## Common Issues & Solutions

### Issue 1: Transaction Fails - "Caller not whitelisted"
**Solution:** Ensure your wallet is whitelisted. Check on Admin dashboard or run:
```bash
cd smart-contracts
npx hardhat run scripts/checkWhitelist.ts --network sepolia
```

### Issue 2: "Insufficient allowance"
**Solution:** Click "Approve" button again and confirm transaction

### Issue 3: High slippage error
**Solution:**
- Increase slippage tolerance in settings
- Or reduce swap amount (large swaps have higher price impact)

### Issue 4: "Pair does not exist"
**Solution:** Verify the pool exists on Stats page. If not, contact admin.

### Issue 5: Can't see tokens in MetaMask
**Solution:** Manually add token contract addresses (see Step 3 above)

### Issue 6: Pending transaction stuck
**Solution:**
- Check Sepolia Etherscan for transaction status
- May need to wait for network congestion to clear
- Can try speeding up transaction in MetaMask

---

## Expected Results Summary

After completing all test cases, you should have:

✅ **Tokens in wallet:**
- Original 1000 tokens minus what you swapped/added to liquidity
- Additional tokens received from swaps
- Tokens received from removing liquidity

✅ **LP Tokens:**
- LP tokens from pools you provided liquidity to
- Less LP tokens if you removed some liquidity

✅ **Transaction history showing:**
- 4 token mints (from faucet)
- Multiple token approvals
- Swap transactions (WETH→USDC, USDC→WETH, etc.)
- Add liquidity transactions
- Remove liquidity transactions

✅ **Pool contributions visible on:**
- Stats page showing your liquidity
- Your LP token balances

---

## Testing Checklist

Use this checklist to track your testing:

**Setup:**
- [ ] Wallet connected to Sepolia
- [ ] Wallet whitelisted
- [ ] Got test tokens from faucet (1000 each)
- [ ] Added tokens to MetaMask

**Swap Tests:**
- [ ] WETH → USDC swap
- [ ] USDC → WETH swap (reverse)
- [ ] Tested slippage settings
- [ ] Large swap (price impact test)
- [ ] Insufficient balance error
- [ ] Zero amount error

**Liquidity Tests:**
- [ ] Add liquidity to WETH/USDC pool
- [ ] Add liquidity to DAI/USDT pool
- [ ] Remove liquidity (partial)
- [ ] Remove liquidity (full)

**UI/UX Tests:**
- [ ] Wallet disconnect/reconnect
- [ ] Wrong network warning
- [ ] Stats page displays pools correctly
- [ ] Transaction links work

**On-Chain Verification:**
- [ ] Etherscan shows all transactions
- [ ] Blockscout contract interactions verified
- [ ] Pool reserves updated correctly

---

## Advanced Testing (Optional)

### Test Multiple Pools
1. Add liquidity to all 4 pools
2. Track LP tokens for each
3. Execute swaps through different pools
4. Compare price impact across pools

### Test Complex Swaps
1. Swap through multiple hops (if supported)
   - Example: WETH → USDC → DAI
2. Compare direct vs multi-hop pricing

### Test Concentrated Liquidity
1. Add large liquidity to one pool
2. Execute swaps to see reduced slippage
3. Remove liquidity and see impact

---

## Need Help?

- Check transaction on Etherscan for error messages
- Review browser console for errors (F12)
- Check MetaMask activity tab
- Verify contract addresses match deployment

---

**Happy Testing! 🚀**
