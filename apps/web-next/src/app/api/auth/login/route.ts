import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('[Auth Login] Received body:', JSON.stringify(body));
    
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
    const fullUrl = `${apiUrl}/auth/login`;

    console.log('[Auth Login] POST request to:', fullUrl);
    console.log('[Auth Login] Body to send:', JSON.stringify(body));

    const bodyString = JSON.stringify(body);
    const response = await fetch(fullUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': String(bodyString.length),
      },
      body: bodyString,
    });

    const text = await response.text();
    console.log('[Auth Login] Response status:', response.status);
    console.log('[Auth Login] Response text:', text);

    let data;
    try {
      data = JSON.parse(text);
    } catch {
      data = { error: 'Invalid JSON response', raw: text };
    }
    

    const setCookieHeader = response.headers.get('set-cookie');
    const res = NextResponse.json(data, { status: response.status });
    
    if (setCookieHeader) {
      res.headers.set('set-cookie', setCookieHeader);
    }
    
    return res;
  } catch (error) {
    console.error('[Auth Login] Error:', error);
    return NextResponse.json(
      { error: 'Login failed', details: String(error) },
      { status: 500 }
    );
  }
}
