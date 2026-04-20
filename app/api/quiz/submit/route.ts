import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const { quizId, nickname, answers } = await req.json();

    if (!quizId || !nickname || !Array.isArray(answers)) {
      return NextResponse.json(
        { message: 'quizId, nickname, and answers array are required' },
        { status: 400 }
      );
    }

    // 1. Ambil semua kunci jawaban asli dari DB untuk quiz ini
    const questions = await executeQuery<any[]>(
      'SELECT id, answer_key FROM questions WHERE quiz_id = ?',
      [quizId]
    );

    if (questions.length === 0) {
      return NextResponse.json(
        { message: 'Quiz questions not found' },
        { status: 404 }
      );
    }

    // 2. Hitung skor
    // answers format: [{ questionId: 1, answer: 'A' }, ...]
    let correctCount = 0;
    const totalQuestions = questions.length;

    questions.forEach((q) => {
      const userAnswer = answers.find((a: any) => a.questionId === q.id);
      if (userAnswer && userAnswer.answer === q.answer_key) {
        correctCount++;
      }
    });

    const score = Math.round((correctCount / totalQuestions) * 100);

    // 3. Simpan ke tabel participants
    await executeQuery(
      'INSERT INTO participants (quiz_id, nickname, total_score) VALUES (?, ?, ?)',
      [quizId, nickname, score]
    );

    // 4. Kembalikan hasil ke frontend
    return NextResponse.json(
      {
        message: 'Quiz submitted successfully',
        nickname,
        score,
        correctCount,
        totalQuestions
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Submit quiz error:', error);
    return NextResponse.json(
      { message: 'Internal Server Error', error: error.message },
      { status: 500 }
    );
  }
}
