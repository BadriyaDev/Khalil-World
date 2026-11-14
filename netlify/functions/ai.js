
const MODEL = 'gemini-3.8-flash';
const FALLBACK = 'gemini-3.5-flash-lite';

const LENS = 'Identify the single main object in this photo. Reply with JSON only, no markdown: {"ar":"the Arabic word with full tashkeel","en":"English name","ex":"one short simple Arabic sentence with full tashkeel using the word"}';

const CHAT = (level, topic) =>
  `أنت «الخليل»، معلّم عربية ودود للناطقين بغيرها. المستوى: ${level}. الموضوع: ${topic}. أجب بعربية فصيحة مبسّطة مع التشكيل الكامل، في جملتين قصيرتين كحد أقصى، ثم اطرح سؤالاً بسيطاً. إذا أخطأ المتعلم فأضف في آخر الرد سطراً يبدأ بـ «تصحيح:» ثم الصيغة الصحيحة مشكولة. لا تستخدم الإنجليزية.`;

const H = { 'Content-Type': 'application/json' };

const fail = (code, error) => ({
  statusCode: code,
  headers: H,
  body: JSON.stringify({ error })
});

const thinking = {
  thinkingConfig: { thinkingLevel: 'low' }
};

function makeBody(b) {
  if (b.mode === 'lens') {
    return {
      contents: [{
        parts: [
          {
            inline_data: {
              mime_type: 'image/jpeg',
              data: b.img
            }
          },
          { text: LENS }
        ]
      }],
      generationConfig: {
        ...thinking,
        responseMimeType: 'application/json',
        maxOutputTokens: 512
      }
    };
  }

  let history = (b.h || []).slice(-4).map(m => ({
    role: m.r === 'model' ? 'model' : 'user',
    parts: [{ text: String(m.t || '').slice(0, 400) }]
  }));

  while (history.length && history[0].role !== 'user') {
    history.shift();
  }

  if (!history.length) {
    history = [{
      role: 'user',
      parts: [{
        text: String(b.msg || 'السلام عليكم').slice(0, 400)
      }]
    }];
  }

  return {
    system_instruction: {
      parts: [{
        text: CHAT(b.level || 'مبتدئ', b.topic || 'السوق')
      }]
    },
    contents: history,
    generationConfig: {
      ...thinking,
      temperature: 0.7,
      maxOutputTokens: 256
    }
  };
}

async function callGemini(model, body, timeoutMs) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': process.env.GEMINI_API_KEY
        },
        body: JSON.stringify(body),
        signal: controller.signal
      }
    );

    const data = await response.json().catch(() => ({}));

    return {
      ok: response.ok,
      status: response.status,
      data
    };

  } catch (error) {
    if (error.name === 'AbortError') {
      return { ok: false, timeout: true };
    }

    console.error('Gemini connection error:', error);
    return { ok: false, connectionError: true };

  } finally {
    clearTimeout(timer);
  }
}

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return fail(405, 'method');
  }

  if (!process.env.GEMINI_API_KEY) {
    return fail(500, 'no_key');
  }

  try {
    const b = JSON.parse(event.body || '{}');

    const body = makeBody(b);
    const isLens = b.mode === 'lens';

    // نحدد وقتًا للرد الأول ثم وقتًا احتياطيًا للنموذج الثاني
    const firstTimeout = isLens ? 5200 : 4200;
    const secondTimeout = isLens ? 3000 : 3800;

    let result = await callGemini(MODEL, body, firstTimeout);

    // عند التأخر أو تعذر النموذج الأول نجرب النموذج الأسرع
    if (
      !result.ok &&
      result.status !== 401 &&
      result.status !== 403
    ) {
      console.error(
        'Primary model failed:',
        result.timeout ? 'timeout' : result.status || 'connection error'
      );

      result = await callGemini(FALLBACK, body, secondTimeout);
    }

    if (!result.ok) {
      if (result.timeout) {
        return fail(504, 'gemini_timeout');
      }

      if (result.status) {
        console.error(
          'Fallback model failed:',
          JSON.stringify(result.data?.error || result.data)
        );

        return fail(502, 'gemini_' + result.status);
      }

      return fail(502, 'connection_error');
    }

    const parts =
      result.data?.candidates?.[0]?.content?.parts || [];

    const answer = parts
      .filter(part => !part.thought)
      .map(part => part.text || '')
      .join('')
      .trim();

    if (!answer) {
      console.error(
        'Empty Gemini response:',
        JSON.stringify(result.data?.promptFeedback || result.data)
      );

      return fail(502, 'empty_response');
    }

    return {
      statusCode: 200,
      headers: H,
      body: JSON.stringify({ text: answer })
    };

  } catch (error) {
    console.error('Function error:', error);
    return fail(500, 'server_error');
  }
};
