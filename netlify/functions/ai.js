
const MODEL = 'gemini-3.8-flash';

const LENS = 'Identify the single main object in this photo. Reply with JSON only, no markdown: {"ar":"the Arabic word with full tashkeel","en":"English name","ex":"one short simple Arabic sentence with full tashkeel using the word"}';

const CHAT = (level, topic) => `أنت «الخليل»، معلّم عربية ودود للناطقين بغيرها. المستوى: ${level}. الموضوع: ${topic}. أجب بعربية فصيحة مبسّطة مع التشكيل الكامل، في جملتين قصيرتين كحد أقصى، ثم اطرح سؤالاً بسيطاً. إذا أخطأ المتعلم فأضف في آخر الرد سطراً يبدأ بـ «تصحيح:» ثم الصيغة الصحيحة مشكولة. لا تستخدم الإنجليزية.`;

const H = { 'Content-Type': 'application/json' };

const fail = (code, e) => ({
  statusCode: code,
  headers: H,
  body: JSON.stringify({ error: e })
});

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return fail(405, 'method');

  if (!process.env.GEMINI_API_KEY) return fail(500, 'no_key');

  try {
    const b = JSON.parse(event.body || '{}');

    const cfg = {
      thinkingConfig: {
        thinkingLevel: "low"
      }
    };

    let body;

    if (b.mode === 'lens') {
      body = {
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
        generationConfig: cfg
      };
    } else {
      let h = (b.h || []).map(m => ({
        role: m.r === 'model' ? 'model' : 'user',
        parts: [{ text: String(m.t).slice(0, 500) }]
      }));

      while (h.length && h[0].role !== 'user') h.shift();

      if (!h.length) {
        h = [{
          role: 'user',
          parts: [{
            text: String(b.msg || 'السلام عليكم').slice(0, 500)
          }]
        }];
      }

      body = {
        system_instruction: {
          parts: [{
            text: CHAT(
              b.level || 'مبتدئ',
              b.topic || 'السوق'
            )
          }]
        },
        contents: h,
        generationConfig: {
          ...cfg,
          temperature: 0.7,
          maxOutputTokens: 500
        }
      };
    }

    const r = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`,
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

    if (!r.ok) {
      console.error(JSON.stringify(j.error || j));
      return fail(502, 'gemini_' + r.status);
    }

    const text =
      j.candidates?.[0]?.content?.parts?.map(p => p.text || '').join('') || '';

    if (!text) return fail(502, 'empty');

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
