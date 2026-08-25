(() => {
  'use strict';

  const VERSION = 'V118-MOBILE-AUDIO-1';
  const AUDIO_URL = 'assets/audio/valdora_mobile_theme_v118.wav?v=118-theme-1';
  let media = null;
  let lastError = '';
  let playAttempts = 0;

  function detectMobile() {
    try {
      return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)
        || Number(navigator.maxTouchPoints || 0) > 1
        || window.matchMedia?.('(pointer: coarse)')?.matches;
    } catch (_) {
      return false;
    }
  }

  const preferred = window.ValdoraPreferMediaAudio === true || detectMobile();
  window.ValdoraPreferMediaAudio = preferred;

  function musicEnabled() {
    try { return Boolean(musicOn); } catch (_) {}
    try { return localStorage.getItem('valdora_music_v85') !== '0'; } catch (_) { return true; }
  }

  function ensureMedia() {
    if (media) return media;
    media = document.createElement('audio');
    media.id = 'valdoraMobileMusic';
    media.src = AUDIO_URL;
    media.preload = 'auto';
    media.loop = true;
    media.volume = 0.42;
    media.hidden = true;
    media.setAttribute('playsinline', '');
    media.setAttribute('webkit-playsinline', '');
    media.setAttribute('aria-hidden', 'true');
    media.addEventListener('playing', () => {
      lastError = '';
      document.documentElement.dataset.valdoraAudio = 'media-playing';
    });
    media.addEventListener('pause', () => {
      if (musicEnabled()) document.documentElement.dataset.valdoraAudio = 'media-paused';
    });
    media.addEventListener('error', () => {
      lastError = media?.error?.message || `erreur media ${media?.error?.code || ''}`.trim();
      document.documentElement.dataset.valdoraAudio = 'media-error';
    });
    document.body.appendChild(media);
    media.load();
    return media;
  }

  function stopSynth() {
    try { window.ValdoraWorldV115?.stopSynthForExternal?.(); } catch (_) {}
  }

  function pause() {
    if (media && !media.paused) media.pause();
    document.documentElement.dataset.valdoraAudio = musicEnabled() ? 'media-paused' : 'music-off';
  }

  async function playFromGesture() {
    if (!preferred || !musicEnabled()) {
      pause();
      return false;
    }
    stopSynth();
    const player = ensureMedia();
    playAttempts += 1;
    try {
      const started = player.play();
      if (started?.then) await started;
      lastError = '';
      document.documentElement.dataset.valdoraAudio = 'media-playing';
      return !player.paused;
    } catch (error) {
      lastError = error?.message || String(error);
      document.documentElement.dataset.valdoraAudio = 'media-waiting-for-touch';
      return false;
    }
  }

  function sync() {
    if (!preferred) return false;
    if (!musicEnabled()) {
      pause();
      return false;
    }
    if (document.hidden) return false;
    if (media && !media.paused) return true;
    // Une reprise sans geste fonctionne après une première lecture sur la plupart
    // des téléphones. Si iOS la refuse, le prochain toucher relance immédiatement.
    playFromGesture();
    return Boolean(media && !media.paused);
  }

  function status() {
    return {
      version: VERSION,
      preferred,
      enabled: musicEnabled(),
      created: Boolean(media),
      paused: media ? media.paused : true,
      readyState: media?.readyState || 0,
      currentTime: media?.currentTime || 0,
      duration: Number.isFinite(media?.duration) ? media.duration : 0,
      playAttempts,
      source: AUDIO_URL,
      error: lastError
    };
  }

  const api = { version: VERSION, preferred, source: AUDIO_URL, playFromGesture, pause, sync, status };
  window.ValdoraMobileAudioV118 = api;

  if (preferred) {
    ensureMedia();
    stopSynth();
    const direct = () => { if (musicEnabled()) playFromGesture(); else pause(); };
    document.addEventListener('pointerdown', direct, { capture: true, passive: true });
    document.addEventListener('touchend', direct, { capture: true, passive: true });
    document.addEventListener('click', direct, false);
    document.addEventListener('keydown', direct, true);
    window.addEventListener('pageshow', sync);
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) pause();
      else sync();
    });
  }
})();
