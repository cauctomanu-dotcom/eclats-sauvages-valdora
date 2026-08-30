// VALDORA V124 — déplacement tactile direct sans joystick
(() => {
  'use strict';

  const VERSION = 'V124-TOUCH-DIRECT-1';
  const DEAD_ZONE = 11;
  const FULL_SPEED_DISTANCE = 78;
  const TICK_MS = 34;

  let pointerId = null;
  let originX = 0;
  let originY = 0;
  let direction = null;
  let intensity = 0;
  let moveTimer = 0;

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function sceneMode() {
    try { return typeof scene === 'string' ? scene : ''; } catch (_) { return ''; }
  }

  function controlsUsable() {
    const root = document.getElementById('touchControlsV79');
    const cluster = root?.querySelector('.cluster');
    const mode = sceneMode();
    if (!root || !cluster || !['world', 'interior'].includes(mode)) return false;
    const rootStyle = getComputedStyle(root);
    const clusterStyle = getComputedStyle(cluster);
    return rootStyle.display !== 'none' && rootStyle.visibility !== 'hidden'
      && clusterStyle.display !== 'none' && clusterStyle.visibility !== 'hidden';
  }

  function clearTimer() {
    if (moveTimer) window.clearInterval(moveTimer);
    moveTimer = 0;
  }

  function stopMovement() {
    clearTimer();
    pointerId = null;
    direction = null;
    intensity = 0;
    document.getElementById('valdoraJoystick')?.classList.remove('active');
    try { if (typeof v79StopMove === 'function') v79StopMove(); } catch (_) {}
  }

  function movementVector() {
    const amount = 5 + Math.round(5 * clamp(intensity, 0, 1));
    if (direction === 'left') return { dx: -amount, dy: 0, dir: 1 };
    if (direction === 'right') return { dx: amount, dy: 0, dir: 2 };
    if (direction === 'up') return { dx: 0, dy: -amount, dir: 3 };
    if (direction === 'down') return { dx: 0, dy: amount, dir: 0 };
    return null;
  }

  function stepMovement() {
    if (!controlsUsable()) return stopMovement();
    const v = movementVector();
    if (!v) return;
    try {
      if (typeof v81TouchStep === 'function') v81TouchStep(v.dx, v.dy, v.dir);
      else if (sceneMode() === 'interior' && typeof moveInterior === 'function') moveInterior(v.dx, v.dy, v.dir);
      else if (sceneMode() === 'world' && typeof move === 'function') move(v.dx, v.dy, v.dir);
    } catch (error) {
      console.error('Déplacement tactile Valdora V124', error);
      stopMovement();
    }
  }

  function refreshDirection(event) {
    const dx = event.clientX - originX;
    const dy = event.clientY - originY;
    const distance = Math.hypot(dx, dy);

    if (distance < DEAD_ZONE) {
      direction = null;
      intensity = 0;
      clearTimer();
      return;
    }

    direction = Math.abs(dx) >= Math.abs(dy)
      ? (dx >= 0 ? 'right' : 'left')
      : (dy >= 0 ? 'down' : 'up');
    intensity = clamp((distance - DEAD_ZONE) / (FULL_SPEED_DISTANCE - DEAD_ZONE), 0.28, 1);

    if (!moveTimer) {
      stepMovement();
      moveTimer = window.setInterval(stepMovement, TICK_MS);
    }
  }

  function bindSurface(surface) {
    surface.addEventListener('pointerdown', event => {
      if (!controlsUsable() || (event.pointerType === 'mouse' && event.button !== 0)) return;
      event.preventDefault();
      pointerId = event.pointerId;
      originX = event.clientX;
      originY = event.clientY;
      direction = null;
      intensity = 0;
      clearTimer();
      surface.classList.add('active');
      try { surface.setPointerCapture(pointerId); } catch (_) {}
    }, { passive: false });

    surface.addEventListener('pointermove', event => {
      if (event.pointerId !== pointerId) return;
      event.preventDefault();
      refreshDirection(event);
    }, { passive: false });

    const release = event => {
      if (pointerId !== null && event?.pointerId != null && event.pointerId !== pointerId) return;
      stopMovement();
    };
    surface.addEventListener('pointerup', release, { passive: false });
    surface.addEventListener('pointercancel', release, { passive: false });
    surface.addEventListener('lostpointercapture', release, { passive: false });
    surface.addEventListener('contextmenu', event => event.preventDefault());
  }

  function installStyle() {
    if (document.getElementById('valdoraTouchDirectV124Style')) return;
    const style = document.createElement('style');
    style.id = 'valdoraTouchDirectV124Style';
    style.textContent = `
      #valdoraJoystick.v124TouchSurface{
        position:relative!important;
        width:clamp(150px,26vw,230px)!important;
        height:clamp(150px,42vh,230px)!important;
        border-radius:28px!important;
        pointer-events:auto!important;
        touch-action:none!important;
        user-select:none!important;
        -webkit-user-select:none!important;
        background:rgba(8,31,47,.075)!important;
        border:1px solid rgba(255,255,255,.12)!important;
        box-shadow:none!important;
        backdrop-filter:none!important;
        outline:none!important;
        overflow:hidden!important;
      }
      #valdoraJoystick.v124TouchSurface:before{display:none!important}
      #valdoraJoystick.v124TouchSurface #valdoraJoystickKnob{display:none!important}
      #valdoraJoystick.v124TouchSurface #valdoraJoystickHint{
        display:grid!important;
        place-items:center!important;
        inset:0!important;
        color:rgba(255,255,255,.34)!important;
        font-size:10px!important;
        font-weight:900!important;
        letter-spacing:.10em!important;
        transition:opacity .12s ease!important;
      }
      #valdoraJoystick.v124TouchSurface.active{
        background:rgba(30,95,125,.10)!important;
        border-color:rgba(129,222,255,.23)!important;
        box-shadow:inset 0 0 32px rgba(95,205,240,.055)!important;
      }
      #valdoraJoystick.v124TouchSurface.active #valdoraJoystickHint{opacity:.12!important}
      @media (orientation:landscape) and (max-height:520px){
        #valdoraJoystick.v124TouchSurface{width:clamp(150px,22vw,205px)!important;height:clamp(150px,43vh,190px)!important}
      }
    `;
    document.head.appendChild(style);
  }

  function makeSurface(old) {
    stopMovement();
    const surface = document.createElement('div');
    surface.id = 'valdoraJoystick';
    surface.className = 'v124TouchSurface';
    surface.dataset.v124TouchDirect = '1';
    surface.setAttribute('role', 'application');
    surface.setAttribute('aria-label', 'Zone tactile de déplacement par glissement');
    surface.tabIndex = 0;
    surface.innerHTML = '<span id="valdoraJoystickHint" aria-hidden="true">GLISSER</span>';
    old.replaceWith(surface);
    bindSurface(surface);
    document.documentElement.dataset.valdoraTouchControl = VERSION;
    return surface;
  }

  function install() {
    installStyle();
    const old = document.getElementById('valdoraJoystick');
    if (!old) return false;
    if (old.dataset.v124TouchDirect === '1') return true;
    makeSurface(old);
    return true;
  }

  window.ValdoraTouchDirectV124 = {
    version: VERSION,
    install,
    stop: stopMovement,
    active: () => document.getElementById('valdoraJoystick')?.dataset.v124TouchDirect === '1'
  };

  [100, 450, 1000, 1800, 3200, 5200, 8500, 13000].forEach(delay => window.setTimeout(install, delay));
  window.setInterval(() => {
    try { install(); } catch (error) { console.warn('V124 contrôle tactile', error); }
  }, 2500);
  window.addEventListener('blur', stopMovement);
  document.addEventListener('visibilitychange', () => { if (document.hidden) stopMovement(); });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install);
  else install();

  console.log('V124 : déplacement tactile direct actif — glisser le doigt pour marcher.');
})();
