/* 
  Cara Jalanin:
  1. Pastikan server running di http://localhost:3000 (npm run dev)
  2. Buka terminal, ketik: node scratch/test-api.js
*/

const BASE_URL = 'http://localhost:3000/api';

async function realTest() {
  const timestamp = Date.now();
  const testUser = `admin_${timestamp}`;
  const testPass = 'password123';

  console.log('🚀 Memulai Testing Backend Quiz App...\n');

  try {
    // 1. Register
    console.log(`[1] Registering Admin: ${testUser}`);
    const r1 = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      body: JSON.stringify({ username: testUser, password: testPass }),
      headers: { 'Content-Type': 'application/json' }
    });
    const r1Data = await r1.json();
    console.log('Status:', r1.status, r1Data.message);

    // 2. Login
    console.log(`[2] Logging in: ${testUser}`);
    const r2 = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      body: JSON.stringify({ username: testUser, password: testPass }),
      headers: { 'Content-Type': 'application/json' }
    });
    const loginData = await r2.json();
    const cookie = r2.headers.get('set-cookie');
    console.log('Status:', r2.status, loginData.message);

    if (!cookie) {
        throw new Error('Gagal dapetin session cookie. Pastikan /api/auth/login bener.');
    }

    // 3. Create Quiz
    console.log('[3] Creating Quiz: "Kuis IPA Dasar"');
    const r3 = await fetch(`${BASE_URL}/quiz/create`, {
      method: 'POST',
      body: JSON.stringify({ title: 'Kuis IPA Dasar' }),
      headers: { 'Content-Type': 'application/json', 'Cookie': cookie }
    });
    const quizData = await r3.json();
    const joinCode = quizData.joinCode;
    const qId = quizData.quizId;
    console.log('Join Code:', joinCode);

    // 4. Add Questions
    console.log('[4] Adding 2 Questions (Bulk)...');
    const r4 = await fetch(`${BASE_URL}/quiz/questions`, {
      method: 'POST',
      body: JSON.stringify({
        quizId: qId,
        questions: [
          { 
            question_text: 'Apa ibukota Indonesia?', 
            opt_a: 'Bandung', opt_b: 'Jakarta', opt_c: 'Surabaya', opt_d: 'Medan', 
            answer_key: 'B' 
          },
          { 
            question_text: 'Berapa 1 + 1?', 
            opt_a: '1', opt_b: '3', opt_c: '2', opt_d: '4', 
            answer_key: 'C' 
          }
        ]
      }),
      headers: { 'Content-Type': 'application/json', 'Cookie': cookie }
    });
    const r4Data = await r4.json();
    console.log('Status:', r4.status, r4Data.message);

    // 5. Join (Public)
    console.log(`[5] Testing Join Quiz (Public) with code: ${joinCode}`);
    const r5 = await fetch(`${BASE_URL}/quiz/join/${joinCode}`);
    const joinData = await r5.json();
    console.log('Quiz Title:', joinData.title);
    console.log('Questions received:', joinData.questions.length);
    console.log('Security check (answer_key exist?):', joinData.questions[0].answer_key ? '❌ BOCOR!' : '✅ AMAN');

    // 6. Submit
    console.log('[6] Submitting Answers for "Budi Hunter"...');
    const r6 = await fetch(`${BASE_URL}/quiz/submit`, {
      method: 'POST',
      body: JSON.stringify({
        quizId: qId,
        nickname: 'Budi Hunter',
        answers: [
          { questionId: joinData.questions[0].id, answer: 'B' }, // Bener
          { questionId: joinData.questions[1].id, answer: 'A' }  // Salah
        ]
      }),
      headers: { 'Content-Type': 'application/json' }
    });
    const finalResult = await r6.json();
    console.log('Skor Akhir:', finalResult.score, '/ 100');
    console.log('Bener:', finalResult.correctCount, 'dari', finalResult.totalQuestions);

    console.log('\n✅ SEMUA TEST BERHASIL DIJALANKAN!');
  } catch (err) {
    console.error('\n❌ Test Gagal:', err.message);
    console.log('Tips: Pastikan server (npm run dev) udah nyala di terminal lain.');
  }
}

realTest();
