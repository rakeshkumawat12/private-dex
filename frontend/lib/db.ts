import Database from 'better-sqlite3';
import path from 'path';

// Database will be stored in the project root
const dbPath = path.join(process.cwd(), 'whitelist-requests.db');
const db = new Database(dbPath);

// Enable WAL mode for better concurrent access
db.pragma('journal_mode = WAL');

// Create whitelist_requests table
db.exec(`
  CREATE TABLE IF NOT EXISTS whitelist_requests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    wallet_address TEXT NOT NULL UNIQUE COLLATE NOCASE,
    email TEXT,
    reason TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'approved', 'rejected')),
    tx_hash TEXT,
    created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
    updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
    reviewed_by TEXT,
    reviewed_at INTEGER
  );

  CREATE INDEX IF NOT EXISTS idx_status ON whitelist_requests(status);
  CREATE INDEX IF NOT EXISTS idx_wallet_address ON whitelist_requests(wallet_address);
  CREATE INDEX IF NOT EXISTS idx_created_at ON whitelist_requests(created_at DESC);
`);

// Types
export interface WhitelistRequest {
  id: number;
  wallet_address: string;
  email?: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  tx_hash?: string;
  created_at: number;
  updated_at: number;
  reviewed_by?: string;
  reviewed_at?: number;
}

export interface CreateWhitelistRequest {
  wallet_address: string;
  email?: string;
  reason: string;
}

export interface UpdateWhitelistRequest {
  status: 'approved' | 'rejected';
  reviewed_by: string;
  tx_hash?: string;
}

// Database operations
export const whitelistDB = {
  // Create a new whitelist request
  createRequest: (data: CreateWhitelistRequest): WhitelistRequest => {
    const stmt = db.prepare(`
      INSERT INTO whitelist_requests (wallet_address, email, reason)
      VALUES (?, ?, ?)
    `);

    const result = stmt.run(
      data.wallet_address.toLowerCase(),
      data.email || null,
      data.reason
    );

    return whitelistDB.getRequestById(result.lastInsertRowid as number)!;
  },

  // Get request by ID
  getRequestById: (id: number): WhitelistRequest | undefined => {
    const stmt = db.prepare('SELECT * FROM whitelist_requests WHERE id = ?');
    return stmt.get(id) as WhitelistRequest | undefined;
  },

  // Get request by wallet address
  getRequestByWallet: (walletAddress: string): WhitelistRequest | undefined => {
    const stmt = db.prepare('SELECT * FROM whitelist_requests WHERE wallet_address = ?');
    return stmt.get(walletAddress.toLowerCase()) as WhitelistRequest | undefined;
  },

  // Get all requests with optional status filter
  getAllRequests: (status?: string): WhitelistRequest[] => {
    let stmt;
    if (status) {
      stmt = db.prepare('SELECT * FROM whitelist_requests WHERE status = ? ORDER BY created_at DESC');
      return stmt.all(status) as WhitelistRequest[];
    } else {
      stmt = db.prepare('SELECT * FROM whitelist_requests ORDER BY created_at DESC');
      return stmt.all() as WhitelistRequest[];
    }
  },

  // Get pending requests count
  getPendingCount: (): number => {
    const stmt = db.prepare('SELECT COUNT(*) as count FROM whitelist_requests WHERE status = ?');
    const result = stmt.get('pending') as { count: number };
    return result.count;
  },

  // Update request status
  updateRequestStatus: (id: number, update: UpdateWhitelistRequest): WhitelistRequest | undefined => {
    const now = Math.floor(Date.now() / 1000);

    const stmt = db.prepare(`
      UPDATE whitelist_requests
      SET status = ?,
          reviewed_by = ?,
          reviewed_at = ?,
          tx_hash = ?,
          updated_at = ?
      WHERE id = ?
    `);

    stmt.run(
      update.status,
      update.reviewed_by.toLowerCase(),
      now,
      update.tx_hash || null,
      now,
      id
    );

    return whitelistDB.getRequestById(id);
  },

  // Check if wallet has existing request
  hasExistingRequest: (walletAddress: string): boolean => {
    const request = whitelistDB.getRequestByWallet(walletAddress);
    return !!request;
  },

  // Get statistics
  getStats: () => {
    const stmt = db.prepare(`
      SELECT
        COUNT(*) as total,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
        SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) as approved,
        SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) as rejected
      FROM whitelist_requests
    `);
    return stmt.get() as {
      total: number;
      pending: number;
      approved: number;
      rejected: number;
    };
  },

  // Delete request (admin only - for testing)
  deleteRequest: (id: number): void => {
    const stmt = db.prepare('DELETE FROM whitelist_requests WHERE id = ?');
    stmt.run(id);
  },
};

// Close database on process exit
process.on('exit', () => db.close());
process.on('SIGINT', () => {
  db.close();
  process.exit(0);
});

export default db;
