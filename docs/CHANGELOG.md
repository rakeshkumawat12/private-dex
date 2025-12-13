# Changelog

All notable changes to the VΛULT Private DEX project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- **Token Faucet Feature** - New `/faucet` page for easy test token distribution
  - One-click minting of all test tokens (WETH, USDC, DAI, USDT)
  - Sequential minting with real-time progress tracking
  - Visual indicators for completed, pending, and failed transactions
  - Transaction links to Sepolia Etherscan
  - Helpful instructions and token addresses
  - Mints 1000 tokens of each type per click

### Changed
- **Navigation Updates**
  - Added "Faucet" link to navbar with F4 keyboard shortcut
  - Moved "Whitelist" shortcut from F4 to F5
  - Navigation now includes: Swap (F1), Liquidity (F2), Stats (F3), Faucet (F4), Whitelist (F5)

- **Admin Access Control**
  - Removed unauthorized admin address from ADMIN_WALLETS array
  - Restricted admin panel access to contract owner and development account only
  - Updated `frontend/lib/auth.ts` with correct admin addresses

- **Smart Contract Configuration**
  - Added Etherscan API key support to Hardhat config
  - Updated verification settings for Hardhat 3.x format
  - Contracts verified on Blockscout (alternative to Etherscan)

### Fixed
- Admin tab no longer visible to unauthorized addresses
- Contract verification process documented with Blockscout alternative

---

## [1.0.0] - 2024-12-11

### Added
- **Complete DEX Redeployment to Sepolia**
  - New WhitelistManager: `0x9Dc786Ad986e1d4cb1E85e4469E8443efCBfAD2E`
  - New Factory: `0xC36EE51C750F6290977D212FEE5C0Af95Fc3bC57`
  - New Router: `0x05b6B7d9cE4BA0f12040664167b34382E050eC87`

- **Test Token Deployment**
  - WETH (Wrapped Ether): `0x35287D9fDb7a1E7CC2212Fd1d57F8ae71cCA030A`
  - USDC (USD Coin): `0x01134D4D7A522a5d601413dD3Bf33859B193063e`
  - DAI (Dai Stablecoin): `0x64c178393Bbe0cAe2a78A19c58e9B3944c2D5B42`
  - USDT (Tether USD): `0x5ccE1Fda0efe9A51302B3F26E3ca0d672536c2F7`

- **Initial Liquidity Pools**
  - WETH/USDC: `0xcC885a0801eEA25E53daAD94008CF89B4299D208` (100 WETH / 200,000 USDC)
  - WETH/DAI: `0xc6E56F5e6Af03535180f9ad416942a557DCFeEd2` (50 WETH / 100,000 DAI)
  - USDC/USDT: `0xf2cb6319FC611447A4A37091877658DbEf121c29` (100,000 USDC / 100,000 USDT)
  - DAI/USDT: `0xD21800b9587c761De6C07342c1f9E3f7ebb8cd90` (100,000 DAI / 100,000 USDT)

### Changed
- **Updated All Contract Addresses**
  - Frontend `.env.local` with new deployment addresses
  - Frontend `lib/contracts.ts` with updated constants
  - All page components using hardcoded token arrays (swap, liquidity, stats)
  - Documentation with current contract addresses

- **Token Display Updates**
  - Replaced TSTA/TSTB with WETH/USDC/DAI/USDT across frontend
  - Updated MOCK_TOKENS arrays in all relevant pages
  - Stats page now displays all 4 active pools
  - Home page stats updated to reflect 4 active pairs

- **Ownership Transfer**
  - Set contract owner to `0xe68C17C8a4e782e27038d189E1fE8b3a4546c9b9`
  - Removed previous admin addresses
  - Updated deployment scripts with correct owner

### Security
- All contracts verified on Blockscout
- Etherscan verification configured (optional)
- Admin access restricted to authorized wallets only
- Router contract whitelisted for operations

---

## Project Milestones

### Initial Development
- Smart contract architecture design
- AMM implementation with constant product formula
- Whitelist-based access control system
- Factory and Router pattern implementation
- Frontend development with Next.js 16
- RainbowKit wallet integration
- Supabase database integration
- Admin dashboard for whitelist management

### Testing & Deployment
- Hardhat test suite
- Sepolia testnet deployment
- Contract verification on Blockscout
- Initial liquidity provision
- Frontend deployment to Vercel

### Current Focus
- Portfolio preparation and testing improvements
- Token faucet for easy demo access
- Documentation updates
- User experience enhancements

---

## Notes

### Contract Verification
- Primary verification: Blockscout (eth-sepolia.blockscout.com)
- Etherscan verification may fail due to bytecode mismatch
- All contracts are fully functional and accessible

### Admin Addresses
- Contract Owner: `0xe68C17C8a4e782e27038d189E1fE8b3a4546c9b9`
- Development Account: `0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266`

### Testing Tokens
All test tokens have public `mint()` functions for easy testing. Use the Faucet page or call mint directly on Blockscout.

---

## Links

- **Repository**: [github.com/rakeshkumawat12/private-dex](https://github.com/rakeshkumawat12/private-dex)
- **Blockscout**: [eth-sepolia.blockscout.com](https://eth-sepolia.blockscout.com)
- **Documentation**: [docs/](.)

---

**Last Updated**: December 12, 2024
