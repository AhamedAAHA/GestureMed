import fetch from 'node-fetch';

const JAVA_URL = () => process.env.JAVA_SERVICE_URL || 'http://localhost:8081';

export async function triageScore(message, urgencyHint) {
  try {
    const res = await fetch(`${JAVA_URL()}/java/triage-score`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, urgencyHint }),
    });
    if (!res.ok) throw new Error(`Java service error: ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn('Java triage fallback:', err.message);
    return fallbackTriage(message, urgencyHint);
  }
}

export async function validateMessage(message) {
  try {
    const res = await fetch(`${JAVA_URL()}/java/validate-message`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message }),
    });
    if (!res.ok) throw new Error(`Java service error: ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn('Java validate fallback:', err.message);
    return { valid: message?.trim().length >= 2, issues: [] };
  }
}

function fallbackTriage(message, urgencyHint) {
  const text = (message || '').toLowerCase();
  let score = 0;
  const emergencyWords = ['breathe', 'breathing', 'chest pain', 'bleeding', 'unconscious', 'stroke', 'heart'];
  const warningWords = ['pain', 'fever', 'dizzy', 'nausea', 'help', 'doctor'];

  emergencyWords.forEach((w) => {
    if (text.includes(w)) score += 40;
  });
  warningWords.forEach((w) => {
    if (text.includes(w)) score += 15;
  });
  if (urgencyHint === 'Emergency') score += 50;
  if (urgencyHint === 'Warning') score += 25;

  let urgency = 'Normal';
  if (score >= 60) urgency = 'Emergency';
  else if (score >= 25) urgency = 'Warning';

  return {
    score,
    urgency,
    reason: score >= 60 ? 'Critical symptoms detected (fallback)' : 'Triage fallback scoring',
    source: 'nodejs-fallback',
  };
}
