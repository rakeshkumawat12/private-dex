import { NextRequest } from 'next/server';
import { verifyMessage } from 'ethers';

// Admin wallet addresses (owner of WhitelistManager contract)
export const ADMIN_WALLETS = [
  '0xe68C17C8a4e782e27038d189E1fE8b3a4546c9b9', // Contract owner (Sepolia)
  '0x24ed4212a29808d2b11d8d23a1bbbe7f8443ac8c', // Secondary admin wallet
  '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266', // Default Hardhat account #0 (for development)
].map(addr => addr.toLowerCase());

export interface AuthSession {
  walletAddress: string;
  signature: string;
  message: string;
  timestamp: number;
}

// Verify admin signature
export async function verifyAdminSignature(
  message: string,
  signature: string
): Promise<{ isValid: boolean; address?: string; error?: string }> {
  try {
    // Recover the address from the signature
    const recoveredAddress = verifyMessage(message, signature);

    // Check if the recovered address is an admin
    const isAdmin = ADMIN_WALLETS.includes(recoveredAddress.toLowerCase());

    if (!isAdmin) {
      return {
        isValid: false,
        error: 'Unauthorized: Not an admin wallet',
      };
    }

    return {
      isValid: true,
      address: recoveredAddress.toLowerCase(),
    };
  } catch (error) {
    console.error('Error verifying signature:', error);
    return {
      isValid: false,
      error: 'Invalid signature',
    };
  }
}

// Generate authentication message
export function generateAuthMessage(walletAddress: string): string {
  const timestamp = Date.now();
  return `Sign this message to authenticate as admin for Private DEX.\n\nWallet: ${walletAddress}\nTimestamp: ${timestamp}`;
}

// Validate authentication from request headers
export async function validateAdminAuth(
  request: NextRequest
): Promise<{ isValid: boolean; address?: string; error?: string }> {
  try {
    const authHeader = request.headers.get('authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return {
        isValid: false,
        error: 'Missing or invalid authorization header',
      };
    }

    const token = authHeader.substring(7); // Remove 'Bearer '

    // Parse the token (format: address:signature:message)
    const parts = token.split(':');
    if (parts.length !== 3) {
      return {
        isValid: false,
        error: 'Invalid token format',
      };
    }

    const [address, signature, encodedMessage] = parts;
    const message = decodeURIComponent(encodedMessage);

    // Verify the signature
    const verification = await verifyAdminSignature(message, signature);

    if (!verification.isValid) {
      return verification;
    }

    // Check if the address matches the one in the token
    if (verification.address !== address.toLowerCase()) {
      return {
        isValid: false,
        error: 'Address mismatch',
      };
    }

    return {
      isValid: true,
      address: verification.address,
    };
  } catch (error) {
    console.error('Error validating admin auth:', error);
    return {
      isValid: false,
      error: 'Authentication validation failed',
    };
  }
}

// Check if an address is admin
export function isAdminWallet(address: string): boolean {
  return ADMIN_WALLETS.includes(address.toLowerCase());
}
