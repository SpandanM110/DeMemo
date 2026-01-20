/**
 * API Route: Upload encrypted memory to IPFS via Pinata
 */

import { NextRequest, NextResponse } from 'next/server';

const PINATA_JWT = process.env.PINATA_JWT;
const PINATA_API_URL = 'https://api.pinata.cloud/pinning/pinJSONToIPFS';

export async function POST(request: NextRequest) {
  try {
    // Validate Pinata JWT is configured
    if (!PINATA_JWT) {
      return NextResponse.json(
        { error: 'IPFS service not configured' },
        { status: 500 }
      );
    }

    // Get the encrypted memory data
    const encryptedMemory = await request.json();

    // Validate required fields
    if (!encryptedMemory.encryptedData || !encryptedMemory.iv) {
      return NextResponse.json(
        { error: 'Invalid memory data' },
        { status: 400 }
      );
    }

    // Upload to Pinata
    const response = await fetch(PINATA_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${PINATA_JWT}`,
      },
      body: JSON.stringify({
        pinataContent: encryptedMemory,
        pinataMetadata: {
          name: `memorychain-${Date.now()}`,
          keyvalues: {
            app: 'memorychain',
            version: encryptedMemory.version || '1.0.0',
            timestamp: encryptedMemory.timestamp?.toString() || Date.now().toString(),
          },
        },
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Pinata upload error:', error);
      return NextResponse.json(
        { error: 'Failed to upload to IPFS' },
        { status: 500 }
      );
    }

    const result = await response.json();

    return NextResponse.json({
      success: true,
      cid: result.IpfsHash,
      timestamp: result.Timestamp,
    });
  } catch (error) {
    console.error('IPFS upload error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
