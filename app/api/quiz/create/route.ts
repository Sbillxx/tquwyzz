import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/db';
import { getAdminFromSession } from '@/lib/auth';

function generateJoinCode(length: number = 6): string {
  const characters = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Avoid ambiguous chars
  let result = '';
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
}

export async function POST(req: NextRequest) {
  try {
    const admin = await getAdminFromSession();

    if (!admin) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { title } = await req.json();

    if (!title) {
      return NextResponse.json(
        { message: 'Title is required' },
        { status: 400 }
      );
    }

    let joinCode = generateJoinCode();
    let isCodeUnique = false;

    // Ensure join code is unique
    while (!isCodeUnique) {
      const existing = await executeQuery<any[]>(
        'SELECT id FROM quizzes WHERE join_code = ?',
        [joinCode]
      );
      if (existing.length === 0) {
        isCodeUnique = true;
      } else {
        joinCode = generateJoinCode();
      }
    }

    const result = await executeQuery<any>(
      'INSERT INTO quizzes (admin_id, title, join_code) VALUES (?, ?, ?)',
      [admin.id, title, joinCode]
    );

    return NextResponse.json(
      { 
        message: 'Quiz created successfully', 
        quizId: result.insertId,
        joinCode 
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Create quiz error:', error);
    return NextResponse.json(
      { message: 'Internal Server Error', error: error.message },
      { status: 500 }
    );
  }
}
