import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST() {
  const cookieStore = await cookies();
  const cookieHeader = cookieStore.toString();

  const apiUrl = process.env.API_URL || 'http://localhost:3001/api';

  try {
    await fetch(`${apiUrl}/auth/logout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(cookieHeader ? { Cookie: cookieHeader } : {}),
      },
    });
  } catch {
    // NestJS indisponible — on efface quand même côté Next.js
  }

  const res = NextResponse.json({ success: true });
  res.cookies.delete('access_token');
  return res;
}
