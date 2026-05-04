const MOVE_AUDIO_MAP = {
  '1': 'Jab.mp3',
  '2': 'Cross.mp3',
  '3': 'Lead-Hook.mp3',
  '4': 'Lead-Uppercut.mp3',
  '5': 'Rear-Hook.mp3',
  '6': 'Rear-Uppercut.mp3',
  '1-1': 'Double-Jab.mp3',
  '1 2': 'Jab-Cross.mp3',
  '1 2 3': 'Jab-Cross-Lead-Hook.mp3',
  'body-2': 'Cross-Body.mp3',
  'body-3': 'Lead-Hook-Body.mp3',
  '1 body': 'Jab-Body.mp3',
  'body-5': 'Rear-Hook-Body.mp3',
  'body-4': 'Lead-Uppercut-Body.mp3',
  'body-6': 'Rear-Uppercut-Body.mp3',
  'slip-left': 'Slip-Left.mp3',
  'slip-right': 'Slip-Right.mp3',
  'roll-under': 'Roll-Under.mp3',
  'weave': 'Weave.mp3',
  'pivot': 'Pivot.mp3',
  'drop': 'Drop.mp3',
};

const VOICE_SFX = {
  FIGHT: 'Fight.mp3',
  GET_READY: 'Get-Ready.mp3',
  GOOD_JOB: 'Good-Job.mp3',
  TIME: 'Time.mp3',
};

const BELL_SFX = {
  START: '/sounds/Bell-Start.mp3',
  END: '/sounds/Bell-End.mp3',
};

let audioCtx = null;
const audioBuffers = {};
const loaded = new Set();

function getContext() {
  if (!audioCtx || audioCtx.state === 'suspended') {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  return audioCtx;
}

function resumeContext() {
  const ctx = getContext();
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

function playSynthTone(freq, duration = 0.15, type = 'sine', volume = 0.3) {
  const ctx = resumeContext();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, ctx.currentTime);
  gain.gain.setValueAtTime(volume, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start();
  osc.stop(ctx.currentTime + duration);
}

async function loadAudioBuffer(url) {
  if (loaded.has(url)) return audioBuffers[url];
  try {
    const res = await fetch(url);
    if (!res.ok) {
      console.warn(`[audioEngine] 404: ${url}`);
      return null;
    }
    const arrayBuffer = await res.arrayBuffer();
    const ctx = getContext();
    const buffer = await ctx.decodeAudioData(arrayBuffer);
    audioBuffers[url] = buffer;
    loaded.add(url);
    return buffer;
  } catch (e) {
    console.error(`[audioEngine] Failed to load ${url}:`, e);
    return null;
  }
}

function playBuffer(buffer) {
  return new Promise((resolve) => {
    if (!buffer) { resolve(false); return; }
    const ctx = resumeContext();
    const source = ctx.createBufferSource();
    const gain = ctx.createGain();
    source.buffer = buffer;
    gain.gain.setValueAtTime(0.8, ctx.currentTime);
    source.connect(gain);
    gain.connect(ctx.destination);
    source.onended = () => resolve(true);
    source.onerror = (e) => {
      console.warn(`[audioEngine] Playback error:`, e);
      resolve(false);
    };
    source.start();
  });
}

function speak(text, rate = 1.2, pitch = 0.6) {
  return new Promise((resolve) => {
    if (!window.speechSynthesis) { resolve(); return; }
    const msg = new SpeechSynthesisUtterance(text);
    msg.lang = 'en-US';
    msg.rate = rate;
    msg.pitch = pitch;
    msg.volume = 1;
    msg.onend = resolve;
    msg.onerror = resolve;
    window.speechSynthesis.speak(msg);
  });
}

async function playAudioFile(name) {
  const url = `/sounds/${name}`;
  const buffer = await loadAudioBuffer(url);
  const played = await playBuffer(buffer);
  if (!played) {
    const label = name.replace(/\.mp3$/i, '').replace(/-/g, ' ');
    await speak(label, 1.5, 0.9);
  }
}

async function playMoveFile(name) {
  const url = `/sounds/moves/${name}`;
  const buffer = await loadAudioBuffer(url);
  const played = await playBuffer(buffer);
  if (!played) {
    const label = name.replace(/\.mp3$/i, '').replace(/-/g, ' ');
    await speak(label, 1.5, 0.9);
  }
}

export async function playMoveAudio(moveKey) {
  const filename = MOVE_AUDIO_MAP[moveKey];
  if (filename) {
    await playMoveFile(filename);
  } else {
    const labels = {
      '1': 'Jab', '2': 'Cross', '3': 'Lead Hook',
      '4': 'Lead Uppercut', '5': 'Rear Hook', '6': 'Rear Uppercut',
      'slip-left': 'Slip Left',
      'slip-right': 'Slip Right',
      'roll-under': 'Roll Under',
      'weave': 'Weave',
      'pivot': 'Pivot', 'drop': 'Drop', 'body': 'Body'
    };
    await speak(labels[moveKey] || moveKey, 1.5, 0.9);
  }
}

export async function playCombo(comboString) {
  if (MOVE_AUDIO_MAP[comboString]) {
    await playMoveFile(MOVE_AUDIO_MAP[comboString]);
    return;
  }

  const parts = comboString.split(' ');
  let i = 0;
  while (i < parts.length) {
    let found = false;
    if (i + 2 < parts.length) {
      const threeKey = `${parts[i]} ${parts[i+1]} ${parts[i+2]}`;
      if (MOVE_AUDIO_MAP[threeKey]) {
        await playMoveFile(MOVE_AUDIO_MAP[threeKey]);
        i += 3;
        found = true;
        continue;
      }
    }
    if (i + 1 < parts.length) {
      const twoKey = `${parts[i]} ${parts[i+1]}`;
      if (MOVE_AUDIO_MAP[twoKey]) {
        await playMoveFile(MOVE_AUDIO_MAP[twoKey]);
        i += 2;
        found = true;
        continue;
      }
    }
    if (!found) {
      await playMoveAudio(parts[i]);
      i++;
    }
  }
}

export async function playVoiceSFX(name) {
  const filename = VOICE_SFX[name];
  if (filename) {
    await playAudioFile(filename);
  }
}

export function playBellStart() {
  loadAudioBuffer(BELL_SFX.START).then(buf => {
    if (!playBuffer(buf)) playVoiceSFX('FIGHT');
  });
}

export function playBellEnd() {
  loadAudioBuffer(BELL_SFX.END).then(buf => {
    if (!playBuffer(buf)) playVoiceSFX('TIME');
  });
}

export function playTick() { playSynthTone(60, 0.1, 'sine', 0.3); }
export function playCountdown() { playSynthTone(440, 0.2, 'triangle', 0.3); }
export function speakSimple(text) { speak(text, 1, 1); }

export async function preloadAll() {
  const allFiles = [
    // Move sounds
    ...Object.values(MOVE_AUDIO_MAP).map(name => `/sounds/moves/${name}`),
    // Bell sounds
    BELL_SFX.START,
    BELL_SFX.END,
  ];
  await Promise.all(allFiles.map(url => loadAudioBuffer(url)));
  console.log(`[audioEngine] Preloaded ${allFiles.length} audio files`);
}
