import { NextRequest, NextResponse } from 'next/server';
import { whitelistDB } from '@/lib/db';
import { validateAdminAuth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// GET - Fetch all whitelist requests (admin only)
export async function GET(request: NextRequest) {
  try {
    // Validate admin authentication
    const authResult = await validateAdminAuth(request);
    if (!authResult.isValid) {
      return NextResponse.json(
        { error: authResult.error || 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    let requests;
    if (status && ['pending', 'approved', 'rejected'].includes(status)) {
      requests = await whitelistDB.getAllRequests(status);
    } else {
      requests = await whitelistDB.getAllRequests();
    }

    const stats = await whitelistDB.getStats();

    return NextResponse.json(
      {
        requests,
        stats,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error fetching whitelist requests:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
