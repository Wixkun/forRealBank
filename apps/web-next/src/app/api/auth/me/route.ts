import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET(_request: NextRequest) {
  try {
    const apiUrl =
      process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://api:3001/api';

    const cookieStore = await cookies();
    const cookieHeader = cookieStore.toString();

    const response = await fetch(`${apiUrl}/auth/me`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(cookieHeader ? { Cookie: cookieHeader } : {}),
      },
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('[Auth Me] Error:', error);
    return NextResponse.json({ error: 'Auth check failed' }, { status: 500 });
  }
}
