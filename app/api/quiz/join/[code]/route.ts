import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/db';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;

    if (!code) {
      return NextResponse.json(
        { message: 'Join code is required' },
        { status: 400 }
      );
    }

    // Get quiz info
    const quizzes = await executeQuery<any[]>(
      'SELECT id, title FROM quizzes WHERE join_code = ?',
      [code]
    );

    if (quizzes.length === 0) {
      return NextResponse.json(
        { message: 'Invalid join code' },
        { status: 404 }
      );
    }

    const quiz = quizzes[0];

    // Get questions (EXCLUDING answer_key)
    const questions = await executeQuery<any[]>(
      'SELECT id, question_text, opt_a, opt_b, opt_c, opt_d FROM questions WHERE quiz_id = ?',
      [quiz.id]
    );

    return NextResponse.json(
      {
        quizId: quiz.id,
        title: quiz.title,
        questions
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Join quiz error:', error);
    return NextResponse.json(
      { message: 'Internal Server Error', error: error.message },
      { status: 500 }
    );
  }
}
