#!/usr/bin/env node
/**
 * Mock of the Quran-ASR AI service.
 *
 * Implements the async contract specified in docs/AI-Integration-Spec-AR.md so
 * the backend integration can be exercised end to end before the real service
 * is ready. No dependencies — plain node.
 *
 *   POST /api/evaluate   JSON + Bearer AI_API_KEY  ->  { status, jobId }
 *   ...then, after a delay, POST {webhookUrl} with Bearer {webhookSecret}
 *
 * Usage:
 *   node scripts/mock-ai-service.js
 *
 * Environment:
 *   MOCK_PORT       port to listen on                     (default 5000)
 *   AI_API_KEY      required bearer key; empty = allow any (default empty)
 *   MOCK_DELAY_MS   delay before firing the webhook        (default 5000)
 *   MOCK_SCENARIO   success | error | silent | ratio | badfield
 *
 * Scenarios:
 *   success   normal result, overallScore on the correct 0-100 scale
 *   error     status:"error" — should mark FAILED and refund the session
 *   silent    accepts the job and never calls back — exercises the stale sweeper
 *   ratio     sends 0.875 instead of 87.5 — should trigger the backend's
 *             normalisation warning (the mistake the spec warns against)
 *   badfield  adds an extra top-level field — should be rejected with 400
 */

const http = require('http');
const crypto = require('crypto');

const PORT = parseInt(process.env.MOCK_PORT || '5000', 10);
const API_KEY = process.env.AI_API_KEY || '';
const DELAY_MS = parseInt(process.env.MOCK_DELAY_MS || '5000', 10);
const SCENARIO = process.env.MOCK_SCENARIO || 'success';

const log = (...a) => console.log(new Date().toISOString().slice(11, 19), ...a);

function buildWords() {
  return [
    {
      word: 'بسم', expected: 'بسم', isCorrect: true, score: 1.0,
      errorType: null, errorTypeAr: null, charErrors: [],
      timestampStart: 0.5, timestampEnd: 0.92,
    },
    {
      word: 'اللا', expected: 'الله', isCorrect: false, score: 0.667,
      errorType: 'substitution', errorTypeAr: 'استبدال',
      charErrors: [{
        type: 'استبدال_حرف', typeEn: 'char_substitution',
        position: 3, got: 'ا', expected: 'ه',
      }],
      timestampStart: 0.92, timestampEnd: 1.4,
    },
    {
      word: null, expected: 'الرحيم', isCorrect: false, score: 0.0,
      errorType: 'deletion', errorTypeAr: 'حذف', charErrors: [],
      timestampStart: null, timestampEnd: null,
    },
  ];
}

function buildPayload(jobId, req) {
  const base = {
    jobId,
    recitationId: req.recitationId,
    userId: req.userId,
  };

  if (SCENARIO === 'error') {
    return { ...base, status: 'error', message: 'Mock failure: audio corrupted' };
  }

  const words = buildWords();
  const payload = {
    ...base,
    status: 'success',
    data: {
      // 'ratio' deliberately sends the wrong scale the spec warns about
      overallScore: SCENARIO === 'ratio' ? 0.875 : 87.5,
      passed: true,
      totalWords: words.length,
      correctWords: words.filter((w) => w.isCorrect).length,
      incorrectWords: words.filter((w) => !w.isCorrect).length,
      userRecitation: 'بسم اللا الرحمن',
      expectedRecitation: 'بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ',
      words,
      errors: ["خطأ: قلت 'اللا' بدلاً من 'الله'", "كلمة ناقصة: 'الرحيم'"],
      errorSummary: { substitution: 1, deletion: 1, insertion: 0 },
      suggestions: ['ركّز على نطق حرف الهاء في نهاية كلمة الله'],
      feedbackAudio: `http://localhost:${PORT}/audio/feedback_${jobId}.mp3`,
      referenceAudio:
        'https://everyayah.com/data/Minshawy_Mujawwad_192kbps/001001.mp3',
      segmentsProcessed: 1,
      requestId: jobId,
      modelVersion: 'mock-v5-30k',
    },
  };

  if (SCENARIO === 'badfield') {
    // Illegal: anything outside the six allowed top-level fields is rejected
    payload.request_id = jobId;
    payload.processing_time = 12.4;
  }

  return payload;
}

async function fireWebhook(jobId, req) {
  const payload = buildPayload(jobId, req);
  log(`-> POST ${req.webhookUrl}  (scenario=${SCENARIO})`);

  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const res = await fetch(req.webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${req.webhookSecret}`,
        },
        body: JSON.stringify(payload),
      });
      const body = await res.text();
      log(`<- ${res.status} ${body.slice(0, 160)}`);

      if (res.status < 400) return;
      if (res.status < 500) {
        log(`   ${res.status} is a client error — not retrying`);
        return;
      }
    } catch (err) {
      log(`   attempt ${attempt} failed: ${err.message}`);
    }
    await new Promise((r) => setTimeout(r, 2 ** attempt * 1000));
  }
  log('   webhook FAILED after 3 attempts');
}

const server = http.createServer((request, response) => {
  if (request.method !== 'POST' || !request.url.startsWith('/api/evaluate')) {
    response.writeHead(404, { 'Content-Type': 'application/json' });
    return response.end(JSON.stringify({ status: 'error', message: 'Not found' }));
  }

  let raw = '';
  request.on('data', (c) => (raw += c));
  request.on('end', () => {
    const auth = request.headers.authorization || '';
    if (API_KEY && auth !== `Bearer ${API_KEY}`) {
      log('401 — bad or missing API key');
      response.writeHead(401, { 'Content-Type': 'application/json' });
      return response.end(
        JSON.stringify({ status: 'error', message: 'Invalid API key', code: 'AUTH_FAILED' }),
      );
    }

    let body;
    try {
      body = JSON.parse(raw);
    } catch {
      response.writeHead(400, { 'Content-Type': 'application/json' });
      return response.end(JSON.stringify({ status: 'error', message: 'Invalid JSON' }));
    }

    const jobId = crypto.randomUUID();
    log(
      `evaluate: recitation=${body.recitationId} user=${body.userId} ` +
        `surah=${body.surahNumber} ayahs=${body.fromAyah}-${body.toAyah}`,
    );
    log(`   audioUrl=${body.audioUrl}`);
    log(`   jobId=${jobId}`);

    // Respond immediately — the whole point of the async contract
    response.writeHead(200, { 'Content-Type': 'application/json' });
    response.end(
      JSON.stringify({
        status: 'processing',
        jobId,
        estimatedTime: Math.round(DELAY_MS / 1000),
      }),
    );

    if (SCENARIO === 'silent') {
      log('   scenario=silent — no callback will be sent');
      return;
    }
    setTimeout(() => fireWebhook(jobId, body), DELAY_MS);
  });
});

server.listen(PORT, () => {
  log(`mock AI service listening on http://localhost:${PORT}`);
  log(`  scenario=${SCENARIO}  delay=${DELAY_MS}ms  apiKey=${API_KEY ? 'required' : 'not enforced'}`);
});
