import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('access_token')?.value;
    
    console.log('[API Routes] /api/transactions - Token:', token ? '***' : 'NO TOKEN');
    
    if (!token) {
      console.warn('[API Routes] /api/transactions - No auth token found');
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = searchParams.get('limit') || '5';

    console.log('[API Routes] /api/transactions - Making request to NestJS...');
    const response = await fetch(
      `http://forrealbank-api:3001/api/transactions/recent?limit=${limit}`,
      {
        method: 'GET',
        headers: {
          'Cookie': `access_token=${token}`,
          'Content-Type': 'application/json',
        },
        cache: 'no-store',
      }
    );

    console.log('[API Routes] /api/transactions - Response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[API Routes] /api/transactions - Error response:', errorText);
      return NextResponse.json(
        { error: 'Failed to fetch transactions' },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log('[API Routes] /api/transactions - Success, returning data');
    return NextResponse.json(data);
  } catch (error) {
    console.error('[API Routes] GET /api/transactions error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
