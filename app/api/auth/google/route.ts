import { NextResponse } from 'next/server';
import { dbManager } from '@/lib/db';

export async function GET() {
  try {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const redirectUri = process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000';
    
    if (!clientId) {
      return NextResponse.json({ error: 'Google Client ID is not configured' }, { status: 500 });
    }

    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${encodeURIComponent(clientId)}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${encodeURIComponent('openid email profile')}&access_type=offline&prompt=consent`;

    return NextResponse.json({ url: authUrl });
  } catch (err) {
    console.error('Failed to generate Google OAuth URL:', err);
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { code } = await request.json();
    if (!code) {
      return NextResponse.json({ error: 'OAuth code is required' }, { status: 400 });
    }

    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const redirectUri = process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000';

    if (!clientId || !clientSecret) {
      return NextResponse.json({ error: 'Google OAuth credentials are not configured' }, { status: 500 });
    }

    // 1. Exchange authorization code for access token
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });

    if (!tokenResponse.ok) {
      const errText = await tokenResponse.text();
      throw new Error(`Google token exchange failed: ${errText}`);
    }

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;

    // 2. Fetch user profile information using the access token
    const userResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!userResponse.ok) {
      const errText = await userResponse.text();
      throw new Error(`Google user profile fetch failed: ${errText}`);
    }

    const googleUser = await userResponse.json();
    const email = googleUser.email;
    const name = googleUser.name || email.split('@')[0];

    if (!email) {
      return NextResponse.json({ error: 'Email address not received from Google' }, { status: 400 });
    }

    const sanitizedEmail = email.trim().toLowerCase();

    // Ensure database connection is initialized
    await dbManager.initDb();

    // 3. Save or update the user in the database
    let user = await dbManager.getUser(sanitizedEmail);
    if (!user) {
      user = await dbManager.saveUser(
        name,
        sanitizedEmail,
        '', // targetRole default empty
        0.0 // readinessScore default 0
      );
    }

    // 4. Retrieve their session data
    const session = await dbManager.getPipelineSession(sanitizedEmail);

    return NextResponse.json({
      success: true,
      user,
      session,
    });
  } catch (err) {
    console.error('Google OAuth callback handler failed:', err);
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
