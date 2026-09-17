// Sound synthesis and speech announcement utility for MediToken

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext {
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    audioCtx = new AudioContextClass();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

/**
 * Plays a classic hospital/airport 2-tone notification chime
 */
export function playChime(): Promise<void> {
  return new Promise((resolve) => {
    try {
      const ctx = getAudioContext();
      const now = ctx.currentTime;

      // Note 1: D5 (587.33 Hz)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(587.33, now);

      gain1.gain.setValueAtTime(0.001, now);
      gain1.gain.exponentialRampToValueAtTime(0.25, now + 0.05);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.5);

      // Note 2: A5 (880 Hz)
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(880, now + 0.35);

      gain2.gain.setValueAtTime(0.001, now + 0.35);
      gain2.gain.exponentialRampToValueAtTime(0.3, now + 0.4);
      gain2.gain.exponentialRampToValueAtTime(0.0001, now + 0.95);

      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.35);
      osc2.stop(now + 1.0);

      setTimeout(() => {
        resolve();
      }, 900);
    } catch {
      resolve();
    }
  });
}

/**
 * Speaks an announcement using the Web Speech API
 */
export async function announceToken(tokenNumber: string, roomNumber: string, enabled = true): Promise<void> {
  if (!enabled) return;

  // Play chime first
  await playChime();

  if (!('speechSynthesis' in window)) return;

  try {
    window.speechSynthesis.cancel(); // Cancel any existing speaking

    // Format speech phonetically so hyphens sound natural: "G-E-N 101"
    const formattedToken = tokenNumber.replace('-', ' ');
    const text = `Attention please. Token number ${formattedToken}, please proceed to ${roomNumber}.`;

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.92; // slightly slower for hospital clarity
    utterance.pitch = 1.05;

    // Pick an English voice if available
    const voices = window.speechSynthesis.getVoices();
    const englishVoice = voices.find(v => v.lang.startsWith('en') && (v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('Samantha')));
    if (englishVoice) {
      utterance.voice = englishVoice;
    }

    window.speechSynthesis.speak(utterance);
  } catch {
    // Gracefully handle browser speech restrictions
  }
}
