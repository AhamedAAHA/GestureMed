import OpenAI from 'openai';

let client = null;

function getClient() {
  if (!process.env.OPENAI_API_KEY) return null;
  if (!client) {
    client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return client;
}

const LANG_NAMES = { en: 'English', ta: 'Tamil', si: 'Sinhala' };

export async function improveMessage(rawMessage, language = 'en') {
  const openai = getClient();
  if (!openai) {
    return fallbackImprove(rawMessage);
  }

  try {
    const lang = LANG_NAMES[language] || 'English';
    const response = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are a medical communication assistant. Convert patient messages into clear, doctor-friendly sentences in ${lang}. Be concise and professional. If signs are listed, combine them naturally.`,
        },
        { role: 'user', content: rawMessage },
      ],
      temperature: 0.3,
    });

    return response.choices[0]?.message?.content?.trim() || fallbackImprove(rawMessage);
  } catch (err) {
    console.warn('OpenAI message improvement fallback:', err.message);
    return fallbackImprove(rawMessage);
  }
}

export async function detectUrgency(message) {
  const openai = getClient();
  if (!openai) {
    return fallbackUrgency(message);
  }

  try {
    const response = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content:
            'Classify patient medical messages urgency as exactly one of: Normal, Warning, Emergency. Reply JSON only: {"urgency":"...","reason":"..."}',
        },
        { role: 'user', content: message },
      ],
      temperature: 0,
      response_format: { type: 'json_object' },
    });
    const parsed = JSON.parse(response.choices[0]?.message?.content || '{}');
    const urgency = ['Normal', 'Warning', 'Emergency'].includes(parsed.urgency)
      ? parsed.urgency
      : 'Normal';
    return { urgency, reason: parsed.reason || '' };
  } catch (err) {
    console.warn('OpenAI urgency fallback:', err.message);
    return fallbackUrgency(message);
  }
}

export async function translateMessage(message, targetLanguage) {
  const openai = getClient();
  const lang = LANG_NAMES[targetLanguage] || 'English';
  if (!openai || targetLanguage === 'en') {
    return message;
  }

  try {
    const response = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `Translate this medical patient message to ${lang}. Keep medical meaning accurate.`,
        },
        { role: 'user', content: message },
      ],
      temperature: 0.2,
    });

    return response.choices[0]?.message?.content?.trim() || message;
  } catch (err) {
    console.warn('OpenAI translation fallback:', err.message);
    return message;
  }
}

function fallbackImprove(raw) {
  const words = (raw || '').trim().split(/\s+/);
  if (!words.length || words[0] === '') return 'Please assist me with my medical concern.';
  const capitalized = raw.charAt(0).toUpperCase() + raw.slice(1);
  if (!/[.!?]$/.test(capitalized)) {
    return `${capitalized}. Please help me immediately.`;
  }
  return capitalized;
}

function fallbackUrgency(message) {
  const text = (message || '').toLowerCase();
  if (/can'?t breathe|chest pain|heavy bleeding|unconscious|stroke/.test(text)) {
    return { urgency: 'Emergency', reason: 'Critical symptoms detected' };
  }
  if (/pain|fever|bleeding|dizzy|help|doctor/.test(text)) {
    return { urgency: 'Warning', reason: 'Concerning symptoms detected' };
  }
  return { urgency: 'Normal', reason: 'Routine communication' };
}
