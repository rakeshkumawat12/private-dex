# Whitelist Request System

A comprehensive whitelist management system for the Private DEX that allows users to request access and enables admins to approve/reject requests with automatic on-chain whitelisting.

## Features

- **User Request Form**: Users can submit whitelist requests with their wallet address, optional email, and reason
- **Request Status Tracking**: Users can check the status of their whitelist request (pending, approved, rejected)
- **Admin Dashboard**: Secure admin panel to manage all whitelist requests
- **Blockchain Integration**: Automatic on-chain whitelisting via WhitelistManager contract upon approval
- **Authentication**: Wallet-based authentication for admin access using message signing
- **Database Storage**: SQLite database for persistent storage of whitelist requests

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     SYSTEM FLOW                              │
├─────────────────────────────────────────────────────────────┤
│  1. User connects wallet (RainbowKit/Wagmi)                 │
│  2. User submits whitelist request form                     │
│  3. Request stored in SQLite database                       │
│  4. Admin authenticates with wallet signature               │
│  5. Admin reviews requests in dashboard                     │
│  6. Admin approves → Calls WhitelistManager.addToWhitelist()│
│  7. Transaction hash stored in database                     │
│  8. User automatically gains access to DEX functions        │
└─────────────────────────────────────────────────────────────┘
```

## Setup Instructions

### 1. Configure Admin Wallet

Edit [frontend/lib/auth.ts](frontend/lib/auth.ts) and update the `ADMIN_WALLETS` array with your admin wallet address(es):

```typescript
export const ADMIN_WALLETS = [
  '0xYourAdminWalletAddress', // Replace with your actual admin wallet
  // Add more admin wallets as needed
].map(addr => addr.toLowerCase());
```

**Important**: The admin wallet address must match the owner of the WhitelistManager contract.

### 2. Verify Contract Addresses

Check [frontend/lib/contracts.ts](frontend/lib/contracts.ts) to ensure the WhitelistManager contract address is correct:

```typescript
export const WHITELIST_MANAGER_ADDRESS = '0x3B0CD801d3F0f3F5C69905e7D3bfE225A994469F';
```

Update this if you've deployed to a different address.

### 3. Database Setup

The SQLite database is automatically created when the application starts. The database file will be created at:
```
/frontend/whitelist-requests.db
```

**Database Schema**:
```sql
CREATE TABLE whitelist_requests (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  wallet_address TEXT NOT NULL UNIQUE COLLATE NOCASE,
  email TEXT,
  reason TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  tx_hash TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  reviewed_by TEXT,
  reviewed_at INTEGER
);
```

### 4. Install Dependencies

The system requires `better-sqlite3`:

```bash
cd frontend
npm install better-sqlite3 @types/better-sqlite3
```

### 5. Run the Application

```bash
cd frontend
npm run dev
```

The application will be available at `http://localhost:3000`

## User Guide

### Submitting a Whitelist Request

1. Navigate to `/whitelist` in the application
2. Connect your wallet using the Connect Wallet button
3. Fill out the whitelist request form:
   - **Wallet Address**: Automatically filled from connected wallet
   - **Email** (Optional): Provide an email for notifications
   - **Reason**: Explain why you need access (minimum 10 characters, maximum 500)
4. Click "Submit Request"
5. Wait for admin review

### Checking Request Status

- After submission, the page automatically shows your request status
- Status can be: **Pending**, **Approved**, or **Rejected**
- For approved requests, the transaction hash is displayed with a link to Etherscan

## Admin Guide

### Accessing the Admin Dashboard

1. Connect your wallet (must be an admin wallet configured in `auth.ts`)
2. Navigate to `/admin` (visible only to admin wallets in the navbar)
3. Sign a message to authenticate
4. View and manage all whitelist requests

### Approving Requests

1. View pending requests in the dashboard
2. Review the user's wallet address, email, and reason
3. Click "Approve" button
4. Confirm the transaction in your wallet (MetaMask, etc.)
5. Wait for transaction confirmation
6. The request status will automatically update to "Approved"
7. The wallet is now whitelisted on-chain

**Note**: Approving a request triggers an on-chain transaction that calls `WhitelistManager.addToWhitelist()`. Gas fees apply.

### Rejecting Requests

1. View pending requests in the dashboard
2. Click "Reject" button
3. The request status will update to "Rejected" (no blockchain transaction)

### Dashboard Features

- **Statistics**: View total, pending, approved, and rejected request counts
- **Filters**: Filter requests by status (All, Pending, Approved, Rejected)
- **Refresh**: Manually refresh the request list
- **Request Details**: View full details including wallet address, email, reason, timestamps, and transaction hashes

## API Routes

### User Endpoints

#### POST `/api/whitelist/request`
Submit a new whitelist request

**Request Body**:
```json
{
  "walletAddress": "0x...",
  "email": "optional@email.com",
  "reason": "Reason for requesting access..."
}
```

**Response** (201):
```json
{
  "message": "Whitelist request submitted successfully",
  "request": { /* request object */ }
}
```

#### GET `/api/whitelist/request?wallet=0x...`
Check status of a whitelist request

**Response** (200):
```json
{
  "exists": true,
  "request": {
    "id": 1,
    "wallet_address": "0x...",
    "status": "pending",
    "created_at": 1234567890,
    // ... other fields
  }
}
```

### Admin Endpoints (Require Authentication)

#### GET `/api/whitelist/admin?status=pending`
Fetch all whitelist requests (optionally filtered by status)

**Headers**:
```
Authorization: Bearer <auth-token>
```

**Response** (200):
```json
{
  "requests": [ /* array of requests */ ],
  "stats": {
    "total": 10,
    "pending": 3,
    "approved": 5,
    "rejected": 2
  }
}
```

#### PATCH `/api/whitelist/admin/:id`
Approve or reject a whitelist request

**Headers**:
```
Authorization: Bearer <auth-token>
```

**Request Body**:
```json
{
  "status": "approved",
  "txHash": "0x..." // Required for approvals
}
```

**Response** (200):
```json
{
  "message": "Request approved successfully",
  "request": { /* updated request object */ }
}
```

## Authentication

Admin authentication uses wallet-based message signing:

1. Admin connects wallet
2. System generates a message containing wallet address and timestamp
3. Admin signs the message with their wallet
4. System verifies the signature and checks if the recovered address is in the admin list
5. An auth token is created and used for subsequent API requests

**Auth Token Format**:
```
address:signature:encodedMessage
```

## Security Considerations

1. **Admin Access**: Only wallets listed in `ADMIN_WALLETS` can access the admin dashboard
2. **Signature Verification**: All admin actions require valid wallet signatures
3. **Address Validation**: All wallet addresses are validated using `ethers.isAddress()`
4. **Rate Limiting**: Consider implementing rate limiting in production
5. **HTTPS**: Always use HTTPS in production to protect authentication tokens

## Troubleshooting

### Database Issues

If the database becomes corrupted or you need to reset:
```bash
rm frontend/whitelist-requests.db
# Restart the application to recreate
```

### Admin Authentication Fails

1. Verify your wallet address is in the `ADMIN_WALLETS` array
2. Ensure the address matches exactly (case-insensitive)
3. Check that you're signing the correct message
4. Try disconnecting and reconnecting your wallet

### Transaction Fails on Approval

1. Verify you're using the correct network (Sepolia testnet)
2. Ensure you have sufficient ETH for gas fees
3. Check that you're the owner of the WhitelistManager contract
4. Verify the contract address is correct in `contracts.ts`

### Request Already Exists Error

Each wallet address can only submit one request. If you need to submit a new request:
1. Contact an admin to delete the existing request
2. Or use a different wallet address

## Pages

- **User Request Form**: [/whitelist](http://localhost:3000/whitelist)
- **Admin Dashboard**: [/admin](http://localhost:3000/admin) (admin only)

## Technology Stack

- **Frontend**: Next.js 16 (App Router), React 19, TypeScript
- **Styling**: Tailwind CSS, Framer Motion
- **Web3**: Wagmi, RainbowKit, Ethers v6
- **Database**: SQLite (better-sqlite3)
- **Smart Contracts**: Solidity, Hardhat

## File Structure

```
frontend/
├── app/
│   ├── api/
│   │   └── whitelist/
│   │       ├── request/
│   │       │   └── route.ts          # User endpoints
│   │       └── admin/
│   │           ├── route.ts          # Admin list endpoint
│   │           └── [id]/
│   │               └── route.ts      # Admin approve/reject
│   ├── whitelist/
│   │   └── page.tsx                  # User request form
│   └── admin/
│       └── page.tsx                  # Admin dashboard
├── components/
│   └── ui/
│       └── textarea.tsx              # New textarea component
├── lib/
│   ├── db.ts                         # Database setup & operations
│   ├── auth.ts                       # Admin authentication
│   └── contracts.ts                  # Contract ABIs & addresses
└── whitelist-requests.db             # SQLite database (auto-created)
```

## Future Enhancements

- [ ] Email notifications for request status updates
- [ ] Batch approval of multiple requests
- [ ] Request comments/notes from admin
- [ ] Analytics dashboard for request metrics
- [ ] CSV export of requests
- [ ] Request expiration/auto-rejection after X days
- [ ] User profile with request history
- [ ] Webhook notifications for external systems

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review the console logs for error messages
3. Verify all configuration steps were completed
4. Check that the WhitelistManager contract is deployed and accessible
