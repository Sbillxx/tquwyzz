import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/db';
import { getAdminFromSession } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const admin = await getAdminFromSession();

    if (!admin) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { quizId, questions } = await req.json();

    if (!quizId || !Array.isArray(questions) || questions.length === 0) {
      return NextResponse.json(
        { message: 'Invalid data. quizId and a non-empty questions array are required.' },
        { status: 400 }
      );
    }

    // Verify the quiz belongs to the admin
    const quiz = await executeQuery<any[]>(
      'SELECT id FROM quizzes WHERE id = ? AND admin_id = ?',
      [quizId, admin.id]
    );

    if (quiz.length === 0) {
      return NextResponse.json(
        { message: 'Quiz not found or unauthorized' },
        { status: 404 }
      );
    }

    // Prepare for bulk insert
    // MySQL bulk insert syntax: INSERT INTO table (cols) VALUES (row1), (row2), ...
    const values: any[] = [];
    const placeholders = questions.map(() => '(?, ?, ?, ?, ?, ?, ?)').join(', ');

    questions.forEach((q: any) => {
      values.push(
        quizId,
        q.question_text,
        q.opt_a,
        q.opt_b,
        q.opt_c,
        q.opt_d,
        q.answer_key
      );
    });

    const query = `
      INSERT INTO questions 
      (quiz_id, question_text, opt_a, opt_b, opt_c, opt_d, answer_key) 
      VALUES ${placeholders}
    `;

    await executeQuery(query, values);

    return NextResponse.json(
      { message: 'Questions added successfully' },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Add questions error:', error);
    return NextResponse.json(
      { message: 'Internal Server Error', error: error.message },
      { status: 500 }
    );
  }
}
