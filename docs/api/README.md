# API Reference

The VΛULT Private DEX exposes REST API endpoints through Next.js API routes for managing whitelist requests and checking on-chain status.

## Base URL

```
Production: https://your-vercel-domain.vercel.app/api
Development: http://localhost:3000/api
```

## Endpoints Overview

| Endpoint | Methods | Description |
|----------|---------|-------------|
| `/api/whitelist/check` | GET | Check on-chain whitelist status |
| `/api/whitelist/request` | GET, POST | Submit/check whitelist requests |
| `/api/whitelist/admin` | GET | List all requests (admin) |
| `/api/whitelist/admin/[id]` | PATCH, DELETE | Manage individual requests |

---

## Whitelist Check

### Check On-Chain Status

Checks if a wallet address is whitelisted on the blockchain.

```
GET /api/whitelist/check?wallet={address}
```

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| wallet | string | Yes | Ethereum wallet address |

**Response:**
```json
{
  "walletAddress": "0x123...",
  "isWhitelisted": true
}
```

**Example:**
```bash
curl "https://your-domain.com/api/whitelist/check?wallet=0x24Ed4212a29808D2B11d8D23a1bbBe7f8443ac8C"
```

**Status Codes:**
| Code | Description |
|------|-------------|
| 200 | Success |
| 400 | Missing or invalid wallet address |
| 500 | Server error |

---

## Whitelist Request

### Submit a Request

Submits a new whitelist access request.

```
POST /api/whitelist/request
```

**Request Body:**
```json
{
  "walletAddress": "0x123...",
  "email": "user@example.com",
  "reason": "I want to provide liquidity and trade on the platform."
}
```

**Parameters:**
| Field | Type | Required | Validation |
|-------|------|----------|------------|
| walletAddress | string | Yes | Valid Ethereum address |
| email | string | No | Valid email format |
| reason | string | Yes | 10-500 characters |

**Success Response (201):**
```json
{
  "message": "Whitelist request submitted successfully",
  "request": {
    "id": 1,
    "wallet_address": "0x123...",
    "email": "user@example.com",
    "reason": "I want to provide liquidity...",
    "status": "pending",
    "created_at": "2024-01-15T10:30:00Z",
    "updated_at": "2024-01-15T10:30:00Z"
  }
}
```

**Error Response (409 - Already Exists):**
```json
{
  "error": "A whitelist request already exists for this wallet address",
  "status": "pending",
  "request": {
    "id": 1,
    "wallet_address": "0x123...",
    "status": "pending",
    ...
  }
}
```

**Example:**
```bash
curl -X POST "https://your-domain.com/api/whitelist/request" \
  -H "Content-Type: application/json" \
  -d '{
    "walletAddress": "0x123...",
    "email": "user@example.com",
    "reason": "I want to trade on the platform"
  }'
```

---

### Check Request Status

Retrieves the status of a whitelist request for a wallet.

```
GET /api/whitelist/request?wallet={address}
```

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| wallet | string | Yes | Ethereum wallet address |

**Response (Request Exists):**
```json
{
  "exists": true,
  "request": {
    "id": 1,
    "wallet_address": "0x123...",
    "email": "user@example.com",
    "reason": "I want to trade...",
    "status": "pending",
    "tx_hash": null,
    "created_at": "2024-01-15T10:30:00Z",
    "updated_at": "2024-01-15T10:30:00Z",
    "reviewed_by": null,
    "reviewed_at": null
  }
}
```

**Response (No Request):**
```json
{
  "exists": false,
  "request": null
}
```

---

## Admin Endpoints

All admin endpoints require authentication via a signed message.

### Authentication

Admin endpoints require a Bearer token in the Authorization header:

```
Authorization: Bearer {address}:{signature}:{encodedMessage}
```

**Token Components:**
1. `address`: Admin wallet address (lowercase)
2. `signature`: Ethereum signature of the message
3. `encodedMessage`: URL-encoded authentication message

**Authentication Message Format:**
```
Sign this message to authenticate as admin for Private DEX.

Wallet: {walletAddress}
Timestamp: {timestamp}
```

**Example Header:**
```
Authorization: Bearer 0x24ed4212...:{signature}:Sign%20this%20message...
```

---

### List All Requests

Retrieves all whitelist requests with optional filtering.

```
GET /api/whitelist/admin
GET /api/whitelist/admin?status={status}
```

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| status | string | No | Filter by: pending, approved, rejected |

**Response:**
```json
{
  "requests": [
    {
      "id": 1,
      "wallet_address": "0x123...",
      "email": "user@example.com",
      "reason": "I want to trade...",
      "status": "pending",
      "tx_hash": null,
      "created_at": "2024-01-15T10:30:00Z",
      "updated_at": "2024-01-15T10:30:00Z",
      "reviewed_by": null,
      "reviewed_at": null
    }
  ],
  "stats": {
    "total": 10,
    "pending": 3,
    "approved": 5,
    "rejected": 2
  }
}
```

**Example:**
```bash
curl "https://your-domain.com/api/whitelist/admin?status=pending" \
  -H "Authorization: Bearer {token}"
```

---

### Update Request Status

Approves or rejects a whitelist request.

```
PATCH /api/whitelist/admin/{id}
```

**URL Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| id | number | Request ID |

**Request Body:**
```json
{
  "status": "approved",
  "txHash": "0xabc123..."
}
```

**Parameters:**
| Field | Type | Required | Description |
|-------|------|----------|------------|
| status | string | Yes | "approved" or "rejected" |
| txHash | string | For approval | Transaction hash of on-chain whitelist |

**Success Response:**
```json
{
  "message": "Request approved successfully",
  "request": {
    "id": 1,
    "wallet_address": "0x123...",
    "status": "approved",
    "tx_hash": "0xabc123...",
    "reviewed_by": "0x24ed4212...",
    "reviewed_at": "2024-01-15T11:00:00Z",
    ...
  }
}
```

**Error Responses:**
| Code | Error | Description |
|------|-------|-------------|
| 400 | "Status must be either 'approved' or 'rejected'" | Invalid status |
| 400 | "Transaction hash is required for approval" | Missing txHash |
| 400 | "Request has already been {status}" | Already processed |
| 404 | "Request not found" | Invalid ID |

---

### Delete Request

Removes a whitelist request (for testing/cleanup).

```
DELETE /api/whitelist/admin/{id}
```

**URL Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| id | number | Request ID |

**Success Response:**
```json
{
  "message": "Request deleted successfully"
}
```

---

## Error Handling

All endpoints return errors in a consistent format:

```json
{
  "error": "Error message describing what went wrong"
}
```

### Common Error Codes

| Code | Description |
|------|-------------|
| 400 | Bad Request - Invalid parameters |
| 401 | Unauthorized - Missing or invalid auth |
| 404 | Not Found - Resource doesn't exist |
| 409 | Conflict - Resource already exists |
| 500 | Internal Server Error |

---

## Rate Limiting

Currently, no rate limiting is implemented. For production, consider adding:
- Request throttling per IP
- Rate limits per wallet address
- CAPTCHA for public endpoints

---

## Database Schema

Requests are stored in Supabase PostgreSQL:

```sql
CREATE TABLE whitelist_requests (
  id            BIGSERIAL PRIMARY KEY,
  wallet_address TEXT NOT NULL UNIQUE,
  email         TEXT,
  reason        TEXT NOT NULL,
  status        TEXT NOT NULL DEFAULT 'pending',
  tx_hash       TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW(),
  reviewed_by   TEXT,
  reviewed_at   TIMESTAMPTZ,

  CONSTRAINT status_check CHECK (status IN ('pending', 'approved', 'rejected'))
);
```

---

## TypeScript Types

```typescript
interface WhitelistRequest {
  id: number;
  wallet_address: string;
  email?: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  tx_hash?: string;
  created_at: string;
  updated_at: string;
  reviewed_by?: string;
  reviewed_at?: string;
}

interface Stats {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
}
```

---

## Usage Examples

### Frontend: Check Whitelist Status

```typescript
async function checkWhitelistStatus(wallet: string) {
  const response = await fetch(`/api/whitelist/check?wallet=${wallet}`);
  const data = await response.json();
  return data.isWhitelisted;
}
```

### Frontend: Submit Request

```typescript
async function submitRequest(wallet: string, email: string, reason: string) {
  const response = await fetch('/api/whitelist/request', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ walletAddress: wallet, email, reason }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error);
  }

  return response.json();
}
```

### Frontend: Admin Authentication

```typescript
async function authenticateAdmin(address: string, signMessage: Function) {
  const message = `Sign this message to authenticate as admin for Private DEX.\n\nWallet: ${address}\nTimestamp: ${Date.now()}`;

  const signature = await signMessage({ message });
  const token = `${address.toLowerCase()}:${signature}:${encodeURIComponent(message)}`;

  return token;
}

async function fetchAdminRequests(token: string, status?: string) {
  const url = status
    ? `/api/whitelist/admin?status=${status}`
    : '/api/whitelist/admin';

  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });

  return response.json();
}
```
