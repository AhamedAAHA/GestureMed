import fetch from 'node-fetch';

const VOICE_MAP = {
  en: process.env.ELEVENLABS_VOICE_EN || '21m00Tcm4TlvDq8ikWAM',
  ta: process.env.ELEVENLABS_VOICE_TA || '21m00Tcm4TlvDq8ikWAM',
  si: process.env.ELEVENLABS_VOICE_SI || '21m00Tcm4TlvDq8ikWAM',
};

export async function generateSpeech(text, language = 'en') {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) {
    return { provider: 'browser-fallback', audioBase64: null, message: text };
  }

  const voiceId = VOICE_MAP[language] || VOICE_MAP.en;
  const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'xi-api-key': apiKey,
      Accept: 'audio/mpeg',
    },
    body: JSON.stringify({
      text,
      model_id: 'eleven_multilingual_v2',
      voice_settings: { stability: 0.5, similarity_boost: 0.75 },
    }),
  });

  if (!res.ok) {
    console.warn(`ElevenLabs unavailable (${res.status}); using browser speech fallback.`);
    return { provider: 'browser-fallback', audioBase64: null, message: text };
  }

  const buffer = Buffer.from(await res.arrayBuffer());
  return {
    provider: 'elevenlabs',
    audioBase64: buffer.toString('base64'),
    mimeType: 'audio/mpeg',
  };
}
