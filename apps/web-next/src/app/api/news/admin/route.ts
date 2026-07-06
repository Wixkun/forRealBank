import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    const apiUrl = process.env.API_URL || 'http://localhost:3001/api';
    const cookieStore = await cookies();
    const cookieHeader = cookieStore.toString();

    const formData = await request.formData();

    const response = await fetch(`${apiUrl}/news/admin`, {
      method: 'POST',
      headers: cookieHeader ? { Cookie: cookieHeader } : {},
      body: formData,
    });

    const contentType = response.headers.get('content-type') ?? '';
    if (contentType.includes('application/json')) {
      const data = await response.json();
      return NextResponse.json(data, { status: response.status });
    }

    const text = await response.text();
    return new NextResponse(text, {
      status: response.status,
      headers: { 'Content-Type': contentType || 'text/plain; charset=utf-8' },
    });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
