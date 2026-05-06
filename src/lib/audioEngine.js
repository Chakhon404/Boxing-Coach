const MOVE_AUDIO_MAP = {
  '1': 'Jab.mp3',
  '2': 'Cross.mp3',
  '3': 'Lead-Hook.mp3',
  '4': 'Rear-Hook.mp3',
  '5': 'Lead-Uppercut.mp3',
  '6': 'Rear-Uppercut.mp3',
  '1-1': 'Double-Jab.mp3',
  '1 2': 'Jab-Cross.mp3',
  '1 2 3': 'Jab-Cross-Lead-Hook.mp3',
  'body-2': 'Cross-Body.mp3',
  'body-3': 'Lead-Hook-Body.mp3',
  '1 body': 'Jab-Body.mp3',
  'body-5': 'Lead-Uppercut-Body.mp3',
  'body-4': 'Rear-Hook-Body.mp3',
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

let activeSources = new Set();
let activeTimeouts = new Set();
let pendingResolvers = new Set();

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

export function stopAllAudio() {
  // Stop all active audio nodes
  activeSources.forEach(src => {
    try { src.stop(); } catch (e) {}
  });
  activeSources.clear();

  // Clear all pending timeouts (ghost loops)
  activeTimeouts.forEach(id => clearTimeout(id));
  activeTimeouts.clear();

  // Resolve pending playCombo promises early to avoid hanging
  pendingResolvers.forEach(resolve => resolve());
  pendingResolvers.clear();

  if (window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }
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
    activeSources.add(source);
    source.onended = () => {
      activeSources.delete(source);
      resolve(true);
    };
    source.onerror = (e) => {
      activeSources.delete(source);
      console.warn(`[audioEngine] Playback error:`, e);
      resolve(false);
    };
    source.start();
  });
}

function speak(text, rate = 1.2, pitch = 0.6) {
  return new Promise((resolve) => {
    if (!window.speechSynthesis) { resolve(); return; }
    window.speechSynthesis.cancel();
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
  const ctx = resumeContext();
  const items = [];

  // Parse combo into items (move or speech)
  const parts = comboString.split(' ');
  let i = 0;
  while (i < parts.length) {
    let found = false;
    // Check 3-word combo
    if (i + 2 < parts.length) {
      const threeKey = `${parts[i]} ${parts[i+1]} ${parts[i+2]}`;
      if (MOVE_AUDIO_MAP[threeKey]) {
        items.push({ type: 'move', filename: MOVE_AUDIO_MAP[threeKey] });
        i += 3;
        found = true;
      }
    }
    // Check 2-word combo
    if (!found && i + 1 < parts.length) {
      const twoKey = `${parts[i]} ${parts[i+1]}`;
      if (MOVE_AUDIO_MAP[twoKey]) {
        items.push({ type: 'move', filename: MOVE_AUDIO_MAP[twoKey] });
        i += 2;
        found = true;
      }
    }
    // Check 1-word combo or fallback
    if (!found) {
      const filename = MOVE_AUDIO_MAP[parts[i]];
      if (filename) {
        items.push({ type: 'move', filename });
      } else {
        items.push({ type: 'speech', text: parts[i] });
      }
      i++;
    }
  }

  // Load all buffers first
  const scheduledItems = await Promise.all(items.map(async item => {
    if (item.type === 'move') {
      const buffer = await loadAudioBuffer(`/sounds/moves/${item.filename}`);
      return { ...item, buffer };
    }
    return item;
  }));

  // Schedule sequentially
  let startTime = ctx.currentTime + 0.05;
  for (const item of scheduledItems) {
    if (item.type === 'move' && item.buffer) {
      const source = ctx.createBufferSource();
      const gain = ctx.createGain();
      source.buffer = item.buffer;
      gain.gain.setValueAtTime(0.8, startTime);
      source.connect(gain);
      gain.connect(ctx.destination);
      activeSources.add(source);
      source.onended = () => activeSources.delete(source);
      source.start(startTime);
      startTime += item.buffer.duration;
    } else {
      // Sync speech fallback (wait for AudioContext to reach current startTime)
      const waitMs = (startTime - ctx.currentTime) * 1000;
      if (waitMs > 0) {
        await new Promise(resolve => {
          const id = setTimeout(() => {
            activeTimeouts.delete(id);
            pendingResolvers.delete(resolve);
            resolve();
          }, waitMs);
          activeTimeouts.add(id);
          pendingResolvers.add(resolve);
        });
      }
      
      const text = item.type === 'speech' ? item.text : item.filename.replace(/\.mp3$/i, '').replace(/-/g, ' ');
      await speak(text, 1.5, 0.9);
      startTime = ctx.currentTime + 0.05;
    }
  }

  // Wait for scheduled audio to finish + 100ms padding
  const finalWaitMs = (startTime - ctx.currentTime) * 1000 + 100;
  if (finalWaitMs > 0) {
    await new Promise(resolve => {
      const id = setTimeout(() => {
        activeTimeouts.delete(id);
        pendingResolvers.delete(resolve);
        resolve();
      }, finalWaitMs);
      activeTimeouts.add(id);
      pendingResolvers.add(resolve);
    });
  }
}

export async function playVoiceSFX(name) {
  const filename = VOICE_SFX[name];
  if (filename) {
    await playAudioFile(filename);
  }
}

export function playBellStart() {
  stopAllAudio();
  loadAudioBuffer(BELL_SFX.START).then(buf => {
    if (!buf || !playBuffer(buf)) playVoiceSFX('FIGHT');
  });
}

export function playBellEnd() {
  stopAllAudio();
  loadAudioBuffer(BELL_SFX.END).then(buf => {
    if (!buf || !playBuffer(buf)) playVoiceSFX('TIME');
  });
}

export function playTick() { playSynthTone(60, 0.1, 'sine', 0.3); }
export function playCountdown() { playSynthTone(440, 0.2, 'triangle', 0.3); }
export function speakSimple(text) { speak(text, 1, 1); }

export async function preloadAll() {
  const allFiles = [
    ...Object.values(MOVE_AUDIO_MAP).map(name => `/sounds/moves/${name}`),
    ...Object.values(VOICE_SFX).map(name => `/sounds/${name}`),
    BELL_SFX.START,
    BELL_SFX.END,
  ];
  await Promise.all(allFiles.map(url => loadAudioBuffer(url)));
  console.log(`[audioEngine] Preloaded ${allFiles.length} audio files`);
}
