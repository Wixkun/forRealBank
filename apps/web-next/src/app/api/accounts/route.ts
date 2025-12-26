import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('access_token')?.value;
    
    console.log('[API Routes] /api/accounts - Token:', token ? '***' : 'NO TOKEN');
    
    if (!token) {
      console.warn('[API Routes] /api/accounts - No auth token found');
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    console.log('[API Routes] /api/accounts - Making request to NestJS...');
    const response = await fetch('http://forrealbank-api:3001/api/accounts', {
      method: 'GET',
      headers: {
        'Cookie': `access_token=${token}`,
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    });

    console.log('[API Routes] /api/accounts - Response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[API Routes] /api/accounts - Error response:', errorText);
      return NextResponse.json(
        { error: 'Failed to fetch accounts' },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log('[API Routes] /api/accounts - Success, returning data');
    return NextResponse.json(data);
  } catch (error) {
    console.error('[API Routes] GET /api/accounts error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
