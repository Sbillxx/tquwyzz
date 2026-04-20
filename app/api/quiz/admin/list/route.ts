import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/db';
import { getAdminFromSession } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const admin = await getAdminFromSession();

    if (!admin) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get quizzes with participant count
    const query = `
      SELECT 
        q.id, 
        q.title, 
        q.join_code, 
        q.created_at,
        COUNT(p.id) as participant_count
      FROM quizzes q
      LEFT JOIN participants p ON q.id = p.quiz_id
      WHERE q.admin_id = ?
      GROUP BY q.id
      ORDER BY q.created_at DESC
    `;

    const quizzes = await executeQuery<any[]>(query, [admin.id]);

    return NextResponse.json(quizzes, { status: 200 });
  } catch (error: any) {
    console.error('List quizzes error:', error);
    return NextResponse.json(
      { message: 'Internal Server Error', error: error.message },
      { status: 500 }
    );
  }
}
