import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseKey);

// Types
export interface WhitelistRequest {
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
  createRequest: async (data: CreateWhitelistRequest): Promise<WhitelistRequest> => {
    const { data: result, error } = await supabase
      .from('whitelist_requests')
      .insert({
        wallet_address: data.wallet_address.toLowerCase(),
        email: data.email || null,
        reason: data.reason,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create request: ${error.message}`);
    }

    return result as WhitelistRequest;
  },

  // Get request by ID
  getRequestById: async (id: number): Promise<WhitelistRequest | null> => {
    const { data, error } = await supabase
      .from('whitelist_requests')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No rows returned
        return null;
      }
      throw new Error(`Failed to get request: ${error.message}`);
    }

    return data as WhitelistRequest;
  },

  // Get request by wallet address
  getRequestByWallet: async (walletAddress: string): Promise<WhitelistRequest | null> => {
    const { data, error } = await supabase
      .from('whitelist_requests')
      .select('*')
      .eq('wallet_address', walletAddress.toLowerCase())
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No rows returned
        return null;
      }
      throw new Error(`Failed to get request: ${error.message}`);
    }

    return data as WhitelistRequest;
  },

  // Get all requests with optional status filter
  getAllRequests: async (status?: string): Promise<WhitelistRequest[]> => {
    let query = supabase
      .from('whitelist_requests')
      .select('*')
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to get requests: ${error.message}`);
    }

    return (data as WhitelistRequest[]) || [];
  },

  // Get pending requests count
  getPendingCount: async (): Promise<number> => {
    const { count, error } = await supabase
      .from('whitelist_requests')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending');

    if (error) {
      throw new Error(`Failed to get pending count: ${error.message}`);
    }

    return count || 0;
  },

  // Update request status
  updateRequestStatus: async (
    id: number,
    update: UpdateWhitelistRequest
  ): Promise<WhitelistRequest | null> => {
    const { data, error } = await supabase
      .from('whitelist_requests')
      .update({
        status: update.status,
        reviewed_by: update.reviewed_by.toLowerCase(),
        reviewed_at: new Date().toISOString(),
        tx_hash: update.tx_hash || null,
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update request: ${error.message}`);
    }

    return data as WhitelistRequest;
  },

  // Check if wallet has existing request
  hasExistingRequest: async (walletAddress: string): Promise<boolean> => {
    const request = await whitelistDB.getRequestByWallet(walletAddress);
    return !!request;
  },

  // Get statistics
  getStats: async () => {
    const { data, error } = await supabase
      .from('whitelist_requests')
      .select('status');

    if (error) {
      throw new Error(`Failed to get stats: ${error.message}`);
    }

    const stats = {
      total: data.length,
      pending: data.filter((r) => r.status === 'pending').length,
      approved: data.filter((r) => r.status === 'approved').length,
      rejected: data.filter((r) => r.status === 'rejected').length,
    };

    return stats;
  },

  // Delete request (admin only - for testing)
  deleteRequest: async (id: number): Promise<void> => {
    const { error } = await supabase
      .from('whitelist_requests')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`Failed to delete request: ${error.message}`);
    }
  },
};

export default supabase;
