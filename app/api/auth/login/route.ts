import { NextResponse } from 'next/server';
import { dbManager } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const { email, name } = await request.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const sanitizedEmail = email.trim().toLowerCase();
    
    // Check if user exists in the database
    let user = await dbManager.getUser(sanitizedEmail);

    if (!user) {
      // If name is not provided, derive it from the email
      const defaultName = name || sanitizedEmail.split('@')[0].replace(/[^a-zA-Z]/g, ' ');
      // Capitalize first letter of each word
      const capitalizedName = defaultName
        .split(' ')
        .filter(Boolean)
        .map((w: string) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ');

      // Create new user in the database
      user = await dbManager.saveUser(
        capitalizedName || 'New User',
        sanitizedEmail,
        '', // targetRole default empty
        0.0 // readinessScore default 0
      );
    }

    // Retrieve their pipeline session if it exists
    const session = await dbManager.getPipelineSession(sanitizedEmail);

    return NextResponse.json({
      success: true,
      user,
      session
    });
  } catch (err) {
    console.error('Authentication login API failed:', err);
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
