// Synthesized sound: every effect is a small WebAudio oscillator burst, so
// the game ships no audio files at all. Audio starts only after the first
// user gesture, which browsers require; screenshot runs stay silent.

export function createAudio() {
  let context = null;
  let alarmOscillator = null;
  let alarmGain = null;

  function ensureContext() {
    if (context) return context;
    const AudioContextClass = window.AudioContext ?? window.webkitAudioContext;
    if (!AudioContextClass) return null;
    context = new AudioContextClass();
    return context;
  }

  function tone(frequency, duration, type, volume, slideTo) {
    const ctx = ensureContext();
    if (!ctx) return;
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, ctx.currentTime);
    if (slideTo) oscillator.frequency.exponentialRampToValueAtTime(slideTo, ctx.currentTime + duration);
    gain.gain.setValueAtTime(volume, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);
    oscillator.connect(gain).connect(ctx.destination);
    oscillator.start();
    oscillator.stop(ctx.currentTime + duration);
  }

  return {
    unlock() {
      const ctx = ensureContext();
      if (ctx && ctx.state === 'suspended') void ctx.resume();
    },
    pickup() {
      tone(880, 0.12, 'sine', 0.16);
      setTimeout(() => tone(1318, 0.18, 'sine', 0.14), 70);
    },
    coin() {
      tone(2400, 0.07, 'triangle', 0.12, 1800);
      setTimeout(() => tone(1900, 0.09, 'triangle', 0.1), 120);
    },
    spotted() {
      tone(220, 0.25, 'sawtooth', 0.1, 440);
    },
    caught() {
      tone(330, 0.5, 'sawtooth', 0.16, 55);
      setTimeout(() => tone(165, 0.7, 'square', 0.1, 40), 150);
    },
    levelClear() {
      [523, 659, 784, 1046].forEach((frequency, i) => {
        setTimeout(() => tone(frequency, 0.22, 'sine', 0.15), i * 110);
      });
    },
    win() {
      [523, 659, 784, 1046, 1318].forEach((frequency, i) => {
        setTimeout(() => tone(frequency, 0.3, 'sine', 0.15), i * 130);
      });
    },
    startAlarmLoop() {
      const ctx = ensureContext();
      if (!ctx || alarmOscillator) return;
      alarmOscillator = ctx.createOscillator();
      alarmGain = ctx.createGain();
      alarmOscillator.type = 'sine';
      alarmOscillator.frequency.setValueAtTime(620, ctx.currentTime);
      alarmGain.gain.setValueAtTime(0.0, ctx.currentTime);
      alarmGain.gain.linearRampToValueAtTime(0.045, ctx.currentTime + 0.4);
      alarmOscillator.connect(alarmGain).connect(ctx.destination);
      alarmOscillator.start();
      const wobble = setInterval(() => {
        if (!alarmOscillator) {
          clearInterval(wobble);
          return;
        }
        alarmOscillator.frequency.setValueAtTime(
          alarmOscillator.frequency.value > 700 ? 620 : 830,
          ctx.currentTime,
        );
      }, 450);
      alarmOscillator.addEventListener('ended', () => clearInterval(wobble));
    },
    stopAlarmLoop() {
      if (!alarmOscillator) return;
      try {
        alarmGain.gain.linearRampToValueAtTime(0.0001, context.currentTime + 0.2);
        alarmOscillator.stop(context.currentTime + 0.25);
      } catch {
        // Already stopped; nothing to do.
      }
      alarmOscillator = null;
      alarmGain = null;
    },
  };
}
