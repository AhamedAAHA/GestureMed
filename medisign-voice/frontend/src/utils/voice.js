export function playBase64Audio(base64, mimeType = 'audio/mpeg') {
  if (!base64) return false;
  const audio = new Audio(`data:${mimeType};base64,${base64}`);
  audio.play().catch(console.error);
  return true;
}

export function speakBrowser(text, lang = 'en-US') {
  if (!window.speechSynthesis) return false;
  const utterance = new SpeechSynthesisUtterance(text);
  const langMap = { en: 'en-US', ta: 'ta-IN', si: 'si-LK' };
  utterance.lang = langMap[lang] || langMap.en;
  utterance.rate = 0.9;
  window.speechSynthesis.speak(utterance);
  return true;
}

export async function playMessageVoice(request, language) {
  if (request.voiceBase64 && playBase64Audio(request.voiceBase64)) return;
  const text = request.improvedMessage || request.rawMessage;
  speakBrowser(text, language);
}

export function playAlertSound() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = 880;
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
    osc.start();
    osc.stop(ctx.currentTime + 0.5);
  } catch {
    /* audio not available */
  }
}
