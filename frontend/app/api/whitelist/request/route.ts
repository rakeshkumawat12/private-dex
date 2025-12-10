import { NextRequest, NextResponse } from 'next/server';
import { whitelistDB } from '@/lib/db';
import { isAddress } from 'ethers';

export const dynamic = 'force-dynamic';

// POST - Submit a new whitelist request
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { walletAddress, email, reason } = body;

    // Validation
    if (!walletAddress || typeof walletAddress !== 'string') {
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

    if (!reason || typeof reason !== 'string' || reason.trim().length < 10) {
      return NextResponse.json(
        { error: 'Reason must be at least 10 characters long' },
        { status: 400 }
      );
    }

    if (reason.length > 500) {
      return NextResponse.json(
        { error: 'Reason must not exceed 500 characters' },
        { status: 400 }
      );
    }

    if (email && typeof email === 'string') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return NextResponse.json(
          { error: 'Invalid email format' },
          { status: 400 }
        );
      }
    }

    // Check if wallet already has a request
    const existingRequest = await whitelistDB.getRequestByWallet(walletAddress);
    if (existingRequest) {
      return NextResponse.json(
        {
          error: 'A whitelist request already exists for this wallet address',
          status: existingRequest.status,
          request: existingRequest,
        },
        { status: 409 }
      );
    }

    // Create the request
    const newRequest = await whitelistDB.createRequest({
      wallet_address: walletAddress,
      email: email || undefined,
      reason: reason.trim(),
    });

    return NextResponse.json(
      {
        message: 'Whitelist request submitted successfully',
        request: newRequest,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating whitelist request:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET - Check status of a whitelist request by wallet address
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

    const existingRequest = await whitelistDB.getRequestByWallet(walletAddress);

    if (!existingRequest) {
      return NextResponse.json(
        { exists: false, request: null },
        { status: 200 }
      );
    }

    return NextResponse.json(
      {
        exists: true,
        request: existingRequest,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error fetching whitelist request:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
