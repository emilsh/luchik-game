// Voice-over via the Web Speech API. If it is unavailable, the functions simply do nothing.

function synth(): SpeechSynthesis | null {
  try {
    return 'speechSynthesis' in window ? window.speechSynthesis : null;
  } catch {
    return null;
  }
}

function pickVoice(lang: string): SpeechSynthesisVoice | undefined {
  const s = synth();
  if (!s) return undefined;
  const voices = s.getVoices();
  const prefix = lang.slice(0, 2);
  return voices.find((v) => v.lang === lang) ?? voices.find((v) => v.lang.startsWith(prefix));
}

function say(text: string, lang: string, rate: number): void {
  const s = synth();
  if (!s || typeof SpeechSynthesisUtterance === 'undefined') return;
  try {
    s.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = lang;
    u.rate = rate;
    const voice = pickVoice(lang);
    if (voice) u.voice = voice;
    s.speak(u);
  } catch {
    // ignore
  }
}

export const speechAvailable = (): boolean => synth() !== null;

/** English word in lowercase so it is not spelled out letter by letter. */
export function speakEnglish(word: string): void {
  say(word.toLowerCase(), 'en-US', 0.8);
}

export function speakRussian(text: string): void {
  say(text, 'ru-RU', 0.95);
}

/** iOS allows speech only after a gesture — "warm it up" with an empty phrase. */
export function unlockSpeech(): void {
  const s = synth();
  if (!s || typeof SpeechSynthesisUtterance === 'undefined') return;
  try {
    const u = new SpeechSynthesisUtterance(' ');
    u.volume = 0;
    s.speak(u);
  } catch {
    // ignore
  }
}
