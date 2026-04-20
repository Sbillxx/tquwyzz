import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/db';
import { hashPassword } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const { username, password } = await req.json();

    if (!username || !password) {
      return NextResponse.json(
        { message: 'Username and password are required' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUsers = await executeQuery<any[]>(
      'SELECT id FROM admins WHERE username = ?',
      [username]
    );

    if (existingUsers.length > 0) {
      return NextResponse.json(
        { message: 'Username already taken' },
        { status: 400 }
      );
    }

    const hashedPassword = await hashPassword(password);

    await executeQuery(
      'INSERT INTO admins (username, password_hash) VALUES (?, ?)',
      [username, hashedPassword]
    );

    return NextResponse.json(
      { message: 'Admin registered successfully' },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { message: 'Internal Server Error', error: error.message },
      { status: 500 }
    );
  }
}
