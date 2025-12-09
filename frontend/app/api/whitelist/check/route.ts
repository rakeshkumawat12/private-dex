import { NextRequest, NextResponse } from 'next/server';
import { createPublicClient, http } from 'viem';
import { sepolia } from 'viem/chains';
import { WHITELIST_MANAGER_ADDRESS, WHITELIST_MANAGER_ABI } from '@/lib/contracts';
import { isAddress } from 'ethers';

export const dynamic = 'force-dynamic';

// Create a public client to read from the blockchain
const publicClient = createPublicClient({
  chain: sepolia,
  transport: http(),
});

// GET - Check if a wallet address is whitelisted on-chain
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const walletAddress = searchParams.get('wallet');

    if (!walletAddress) {
      return NextResponse.json(
        { error: 'Wallet address is required' },
        { status: 400 }
      );
    }

    if (!isAddress(walletAddress)) {
      return NextResponse.json(
        { error: 'Invalid wallet address format' },
        { status: 400 }
      );
    }

    // Read from smart contract
    const isWhitelisted = await publicClient.readContract({
      address: WHITELIST_MANAGER_ADDRESS,
      abi: WHITELIST_MANAGER_ABI,
      functionName: 'isWhitelistedAndActive',
      args: [walletAddress as `0x${string}`],
    });

    return NextResponse.json(
      {
        walletAddress,
        isWhitelisted,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error checking whitelist status:', error);
    return NextResponse.json(
      { error: 'Failed to check whitelist status' },
      { status: 500 }
    );
  }
}
