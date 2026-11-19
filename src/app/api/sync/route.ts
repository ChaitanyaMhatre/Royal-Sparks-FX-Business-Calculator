import { NextRequest, NextResponse } from 'next/server';
import { put, list } from '@vercel/blob';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const BLOB_PATH = 'royal-sparks-fx-state.json';

// GET: Fetch centralized cloud state for all devices (phone, laptop, iPad, etc.)
export async function GET() {
  try {
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      return NextResponse.json({
        success: false,
        message: 'Blob token not configured in this environment.',
        data: null,
      });
    }

    const { blobs } = await list({ prefix: BLOB_PATH });
    const targetBlob = blobs.find((b) => b.pathname === BLOB_PATH) || blobs[0];

    if (!targetBlob) {
      return NextResponse.json({
        success: true,
        data: null,
        message: 'No cloud state stored yet.',
      });
    }

    // Fetch the JSON contents from the blob storage with cache busting
    const freshUrl = targetBlob.url.includes('?') 
      ? `${targetBlob.url}&t=${Date.now()}` 
      : `${targetBlob.url}?t=${Date.now()}`;
    const res = await fetch(freshUrl, {
      cache: 'no-store',
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        Pragma: 'no-cache',
      },
    });

    if (!res.ok) {
      return NextResponse.json({
        success: false,
        message: `Failed to read cloud blob (HTTP ${res.status})`,
        data: null,
      });
    }

    const cloudData = await res.json();
    return NextResponse.json({
      success: true,
      data: cloudData,
      url: targetBlob.url,
      updatedAt: targetBlob.uploadedAt,
    });
  } catch (error: any) {
    console.error('Error reading centralized cloud state:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal error' },
      { status: 500 }
    );
  }
}

// POST: Save centralized cloud state from any device
export async function POST(req: NextRequest) {
  try {
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      return NextResponse.json({
        success: false,
        message: 'Blob token not configured. Falling back to local device storage.',
      });
    }

    const body = await req.json();

    const payload = {
      events: body.events || [],
      cashTransactions: body.cashTransactions || [],
      openingBalance: Number(body.openingBalance) || 0,
      inventory: body.inventory || [],
      activityLogs: body.activityLogs || [],
      lastUpdated: new Date().toISOString(),
      updatedBy: body.user || 'Royal Sparks Member',
    };

    // Overwrite the centralized document
    const blob = await put(BLOB_PATH, JSON.stringify(payload), {
      access: 'public',
      addRandomSuffix: false,
      allowOverwrite: true,
      contentType: 'application/json',
      cacheControlMaxAge: 0,
    });

    return NextResponse.json({
      success: true,
      url: blob.url,
      updatedAt: payload.lastUpdated,
    });
  } catch (error: any) {
    console.error('Error saving centralized cloud state:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to persist state' },
      { status: 500 }
    );
  }
}
