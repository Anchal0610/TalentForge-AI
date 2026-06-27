import { NextResponse } from 'next/server';
import { dbManager } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');

    if (!email) {
      return NextResponse.json({ error: 'Email parameter is required' }, { status: 400 });
    }

    console.log(`Checking career session data for: ${email}`);
    const sessionData = await dbManager.getPipelineSession(email.trim());

    if (sessionData) {
      return NextResponse.json({ exists: true, session: sessionData });
    } else {
      return NextResponse.json({ exists: false });
    }
  } catch (err) {
    console.error('Session retrieval failed:', err);
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
