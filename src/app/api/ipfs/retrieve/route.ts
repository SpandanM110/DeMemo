/**
 * API Route: Retrieve encrypted memory from IPFS via Pinata Gateway
 */

import { NextRequest, NextResponse } from 'next/server';

const PINATA_GATEWAY = 'https://gateway.pinata.cloud/ipfs';

export async function GET(request: NextRequest) {
  try {
    // Get CID from query parameters
    const { searchParams } = new URL(request.url);
    const cid = searchParams.get('cid');

    if (!cid) {
      return NextResponse.json(
        { error: 'CID is required' },
        { status: 400 }
      );
    }

    // Validate CID format (basic check)
    if (!cid.startsWith('Qm') && !cid.startsWith('bafy')) {
      return NextResponse.json(
        { error: 'Invalid CID format' },
        { status: 400 }
      );
    }

    // Fetch from Pinata gateway
    const response = await fetch(`${PINATA_GATEWAY}/${cid}`, {
      headers: {
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        return NextResponse.json(
          { error: 'Memory not found on IPFS' },
          { status: 404 }
        );
      }
      return NextResponse.json(
        { error: 'Failed to retrieve from IPFS' },
        { status: 500 }
      );
    }

    const data = await response.json();

    return NextResponse.json(data);
  } catch (error) {
    console.error('IPFS retrieval error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
