// يمكنك تغيير النموذج من Netlify بإضافة متغير GEMINI_MODEL دون تعديل الكود
const MODEL = process.env.GEMINI_MODEL || 'gemini-3.8-flash';
const FALLBACK = 'gemini-2.5-flash';

const LENS = 'Identify the single main object in this photo. Reply with JSON only, no markdown: {"ar":"the Arabic word with full tashkeel","en":"English name","ex":"one short simple Arabic sentence with full tashkeel using the word"}';

const CHAT = (level, topic) => `أنت «الخليل»، معلّم عربية ودود للناطقين بغيرها. المستوى: ${level}. الموضوع: ${topic}. أجب بعربية فصيحة مبسّطة مع التشكيل الكامل، في جملتين قصيرتين كحد أقصى، ثم اطرح سؤالاً بسيطاً. إذا أخطأ المتعلم فأضف في آخر الرد سطراً يبدأ بـ «تصحيح:» ثم الصيغة الصحيحة مشكولة. لا تستخدم الإنجليزية.`;

const H = { 'Content-Type': 'application/json' };

const fail = (code, e) => ({
  statusCode: code,
  headers: H,
  body: JSON.stringify({ error: e })
});

// إعداد التفكير يختلف بين الأجيال: الجيل 3 يستخدم thinkingLevel والجيل 2.5 يستخدم thinkingBudget
const thinking = (model) =>
  model.includes('gemini-3')
    ? { thinkingConfig: { thinkingLevel: 'low' } }
    : { thinkingConfig: { thinkingBudget: 0 } };

function makeBody(b, model) {
  if (b.mode === 'lens') {
    return {
      contents: [{
        parts: [
          { inline_data: { mime_type: 'image/jpeg', data: b.img } },
          { text: LENS }
        ]
      }],
      generationConfig: {
        ...thinking(model),
        responseMimeType: 'application/json',
        maxOutputTokens: 1024
      }
    };
  }

  let h = (b.h || []).map(m => ({
    role: m.r === 'model' ? 'model' : 'user',
    parts: [{ text: String(m.t).slice(0, 500) }]
  }));

  while (h.length && h[0].role !== 'user') h.shift();

  if (!h.length) {
    h = [{
      role: 'user',
      parts: [{ text: String(b.msg || 'السلام عليكم').slice(0, 500) }]
    }];
  }

  return {
    system_instruction: {
      parts: [{ text: CHAT(b.level || 'مبتدئ', b.topic || 'السوق') }]
    },
    contents: h,
    generationConfig: {
      ...thinking(model),
      temperature: 0.7,
      maxOutputTokens: 1024
    }
  };
}

async function callGemini(model, body) {
  const r = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': process.env.GEMINI_API_KEY
      },
      body: JSON.stringify(body)
    }
  );
  const j = await r.json().catch(() => ({}));
  return { r, j };
}

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return fail(405, 'method');

  if (!process.env.GEMINI_API_KEY) return fail(500, 'no_key');

  try {
    const b = JSON.parse(event.body || '{}');

    let model = MODEL;
    let { r, j } = await callGemini(model, makeBody(b, model));

    // إذا رفض النموذج الأساسي الطلب (اسم أو إعداد غير مدعوم) نجرّب النموذج البديل
    if (!r.ok && (r.status === 400 || r.status === 404) && model !== FALLBACK) {
      console.error('primary model failed:', model, JSON.stringify(j.error || j));
      model = FALLBACK;
      ({ r, j } = await callGemini(model, makeBody(b, model)));
    }

    if (!r.ok) {
      console.error(model, JSON.stringify(j.error || j));
      return fail(502, 'gemini_' + r.status);
    }

    const parts = j.candidates?.[0]?.content?.parts || [];
    const text = parts.filter(p => !p.thought).map(p => p.text || '').join('').trim();

    if (!text) {
      console.error('empty response', JSON.stringify(j.promptFeedback || j.candidates?.[0]?.finishReason || j));
      return fail(502, 'empty');
    }

    return {
      statusCode: 200,
      headers: H,
      body: JSON.stringify({ text })
    };

  } catch (e) {
    console.error(e);
    return fail(500, 'server');
  }
};
