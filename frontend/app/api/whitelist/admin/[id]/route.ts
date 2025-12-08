import { NextRequest, NextResponse } from 'next/server';
import { whitelistDB } from '@/lib/db';
import { validateAdminAuth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// PATCH - Approve or reject a whitelist request
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Validate admin authentication
    const authResult = await validateAdminAuth(request);
    if (!authResult.isValid) {
      return NextResponse.json(
        { error: authResult.error || 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const requestId = parseInt(id);

    if (isNaN(requestId)) {
      return NextResponse.json(
        { error: 'Invalid request ID' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { status, txHash } = body;

    // Validation
    if (!status || !['approved', 'rejected'].includes(status)) {
      return NextResponse.json(
        { error: 'Status must be either "approved" or "rejected"' },
        { status: 400 }
      );
    }

    // Check if request exists
    const existingRequest = whitelistDB.getRequestById(requestId);
    if (!existingRequest) {
      return NextResponse.json(
        { error: 'Request not found' },
        { status: 404 }
      );
    }

    // Check if already reviewed
    if (existingRequest.status !== 'pending') {
      return NextResponse.json(
        { error: `Request has already been ${existingRequest.status}` },
        { status: 400 }
      );
    }

    // For approved requests, txHash is required
    if (status === 'approved' && !txHash) {
      return NextResponse.json(
        { error: 'Transaction hash is required for approval' },
        { status: 400 }
      );
    }

    // Update the request
    const updatedRequest = whitelistDB.updateRequestStatus(requestId, {
      status,
      reviewed_by: authResult.address!,
      tx_hash: txHash,
    });

    return NextResponse.json(
      {
        message: `Request ${status} successfully`,
        request: updatedRequest,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error updating whitelist request:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE - Delete a request (admin only, for cleanup)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Validate admin authentication
    const authResult = await validateAdminAuth(request);
    if (!authResult.isValid) {
      return NextResponse.json(
        { error: authResult.error || 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const requestId = parseInt(id);

    if (isNaN(requestId)) {
      return NextResponse.json(
        { error: 'Invalid request ID' },
        { status: 400 }
      );
    }

    // Check if request exists
    const existingRequest = whitelistDB.getRequestById(requestId);
    if (!existingRequest) {
      return NextResponse.json(
        { error: 'Request not found' },
        { status: 404 }
      );
    }

    // Delete the request
    whitelistDB.deleteRequest(requestId);

    return NextResponse.json(
      { message: 'Request deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting whitelist request:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
