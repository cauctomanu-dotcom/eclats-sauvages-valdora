(() => {
  'use strict';

  const VERSION = 'V118-MOBILE-4';
  const RELEASE_KEY = 'valdora_last_seen_update';
  const RELEASE = {
    id: 'v118-mobile-4',
    title: 'Mise à jour — Musique et sauvegardes',
    intro: 'Cette mise à jour fiabilise deux fonctions essentielles de Valdora sur smartphone.',
    notes: [
      'La musique démarre après le premier toucher autorisé par le téléphone et reprend au retour dans le jeu.',
      'Chaque sauvegarde est vérifiée et conservée dans deux stockages locaux indépendants.',
      'Continuer choisit automatiquement la copie valide la plus récente.',
      'Un bouton FERMER apparaît sous MENU et ACTION pendant les dialogues.',
      'Le joystick et les écrans adaptés au mode paysage restent disponibles.'
    ]
  };

  let installFrame = 0;
  let moveTimer = 0;
  let pointerId = null;
  let vector = { x: 0, y: 0, magnitude: 0 };

  const style = document.createElement('style');
  style.id = 'valdoraMobileUiV118Style';
  style.textContent = `
    #valdoraJoystick{position:relative;width:var(--touch-joystick-size,120px);height:var(--touch-joystick-size,120px);border-radius:50%;pointer-events:auto;touch-action:none;user-select:none;-webkit-user-select:none;background:radial-gradient(circle at 42% 38%,rgba(54,94,113,.82),rgba(10,34,50,.92) 68%);border:2px solid rgba(255,255,255,.46);box-shadow:inset 0 0 0 8px rgba(255,255,255,.055),0 9px 24px rgba(0,0,0,.32);backdrop-filter:blur(7px);outline:none}
    #valdoraJoystick:before{content:"";position:absolute;inset:22%;border-radius:50%;border:1px solid rgba(255,255,255,.2);box-shadow:0 0 18px rgba(91,198,233,.12)}
    #valdoraJoystickKnob{position:absolute;left:50%;top:50%;width:43%;height:43%;border-radius:50%;transform:translate(-50%,-50%);background:radial-gradient(circle at 38% 32%,#f9fdff,#bcd5df 56%,#7597a6);border:2px solid rgba(255,255,255,.92);box-shadow:0 6px 16px rgba(0,0,0,.38);transition:transform 70ms ease,box-shadow 120ms ease;pointer-events:none}
    #valdoraJoystick.active{border-color:rgba(121,226,255,.9);box-shadow:inset 0 0 0 8px rgba(111,218,248,.1),0 0 0 4px rgba(76,176,211,.16),0 10px 25px rgba(0,0,0,.38)}
    #valdoraJoystick.active #valdoraJoystickKnob{transition:none;box-shadow:0 8px 18px rgba(0,0,0,.45),0 0 16px rgba(137,229,255,.34)}
    #valdoraJoystickHint{position:absolute;inset:0;display:grid;place-items:center;color:rgba(255,255,255,.62);font-size:11px;font-weight:950;letter-spacing:.08em;pointer-events:none}
    #touchControlsV79 .actions{grid-template-columns:auto auto;grid-template-areas:"menu action" "close close";align-items:center;justify-items:center}
    #touchControlsV79 #v79Menu{grid-area:menu}#touchControlsV79 #v79Action{grid-area:action}
    #valdoraDialogClose{grid-area:close;width:100%;min-height:38px;height:38px;margin-top:5px;padding:0 10px;border-radius:999px!important;background:linear-gradient(145deg,rgba(169,54,48,.96),rgba(112,31,31,.96))!important;color:#fff;font-size:11px!important;font-weight:950!important;letter-spacing:.035em;pointer-events:auto;touch-action:manipulation!important;box-shadow:0 5px 14px rgba(0,0,0,.3)!important}
    #valdoraDialogClose[hidden]{display:none!important}
    #gamewrap.valdoraTouchRails #touchControlsV79 #valdoraDialogClose{width:100%!important;min-width:100%!important;height:34px!important;min-height:34px!important;margin-top:var(--touch-action-gap,6px)!important;padding:0 6px!important;border-radius:999px!important;font-size:clamp(8px,1.45vw,11px)!important}
    #valdoraUpdateDialog{position:fixed;inset:0;z-index:2300000;display:grid;place-items:center;padding:calc(16px + var(--safe-top,0px)) calc(16px + var(--safe-right,0px)) calc(16px + var(--safe-bottom,0px)) calc(16px + var(--safe-left,0px));background:rgba(5,18,29,.88);backdrop-filter:blur(13px)}
    #valdoraUpdateDialog[hidden]{display:none}.valdoraUpdateCard{width:min(620px,100%);max-height:100%;overflow:auto;padding:24px;border-radius:26px;background:linear-gradient(150deg,#f9fdff,#e7f4f8);color:#173548;border:1px solid rgba(255,255,255,.86);box-shadow:0 30px 90px rgba(0,0,0,.54)}
    .valdoraUpdateKicker{display:inline-block;margin-bottom:8px;padding:5px 9px;border-radius:999px;background:#d9f1e7;color:#256145;font-size:11px;font-weight:950;letter-spacing:.07em}.valdoraUpdateCard h2{margin:0;color:#174d70;font-size:27px}.valdoraUpdateCard>p{margin:9px 0 14px;line-height:1.5;color:#587180}.valdoraUpdateList{display:grid;gap:8px;margin:0 0 17px;padding:0;list-style:none}.valdoraUpdateList li{position:relative;padding:10px 11px 10px 38px;border-radius:14px;background:#fff;border:1px solid #d0e1e7;line-height:1.4}.valdoraUpdateList li:before{content:"✓";position:absolute;left:12px;top:9px;display:grid;place-items:center;width:18px;height:18px;border-radius:50%;background:#3eaa76;color:#fff;font-size:11px;font-weight:1000}.valdoraUpdateClose{width:100%;min-height:48px;background:linear-gradient(145deg,#216b91,#174d70);color:#fff;font-weight:950}
    @media (max-width:900px),(max-height:520px){
      #menuov,#starterov{align-items:stretch!important;justify-content:stretch!important;padding:calc(7px + var(--safe-top,0px)) calc(7px + var(--safe-right,0px)) calc(7px + var(--safe-bottom,0px)) calc(7px + var(--safe-left,0px))!important}
      #menuov>.card,#starterov>.card{width:100%!important;height:100%!important;max-width:none!important;max-height:none!important;min-width:0!important;min-height:0!important;padding:10px!important;border-radius:15px!important;overflow:auto!important;overscroll-behavior:contain;-webkit-overflow-scrolling:touch}
      #menuov>.card h2,#starterov>.card h2{margin:0 0 7px!important;font-size:clamp(17px,4.5vh,23px)!important;line-height:1.1}
      .baggrid,.partyselect,.v99-party-grid,.v101d-pcgrid,.dexgrid{grid-template-columns:repeat(auto-fit,minmax(min(145px,42vw),1fr))!important;gap:7px!important}
      .bagitem,.partycard,.dexitem{min-width:0!important;padding:8px!important}.dexitem{min-height:0!important}.dexthumb{width:min(86px,19vh)!important;height:min(86px,19vh)!important}
      .dexentry,.mapwrap,.v108s-creature-detail,.v108s-team-click{grid-template-columns:1fr!important;gap:8px!important}.dexentry canvas{width:min(150px,32vh)!important;height:min(150px,32vh)!important}.mapboard{min-height:260px!important}
      #dialog{padding:7px!important}.dbox{width:100%!important;max-height:72%!important;overflow:auto!important;padding:10px 12px!important;border-radius:14px!important;font-size:13px;line-height:1.35}
      #forcedReplacementV97{padding:7px!important;align-items:stretch!important}#forcedReplacementV97>div{width:100%!important;max-width:none!important;max-height:100%!important;padding:11px!important;border-radius:15px!important}
      .v107fPanel,#v107mNameCard{width:min(620px,100%)!important;max-height:calc(100dvh - 14px)!important;padding:14px!important;border-radius:17px!important;overflow:auto!important}.v107fChoices{grid-template-columns:repeat(3,minmax(0,1fr))!important;gap:7px!important}.v107fChoices button{padding:9px!important;min-width:0!important}
      .titlecard{width:min(720px,96%)!important;min-width:0!important;max-width:96%!important;padding:8px!important;gap:7px!important;flex-wrap:wrap!important}.titlecard button{min-width:min(150px,42vw)!important;flex:1 1 150px!important;padding:8px!important;font-size:12px!important}
      .valdoraUpdateCard{padding:16px;border-radius:19px}.valdoraUpdateCard h2{font-size:21px}.valdoraUpdateCard>p{font-size:13px;margin:7px 0 10px}.valdoraUpdateList{gap:5px;margin-bottom:10px}.valdoraUpdateList li{padding:7px 8px 7px 32px;font-size:12px}.valdoraUpdateList li:before{left:9px;top:7px}.valdoraUpdateClose{min-height:42px}
    }
    @media (orientation:landscape) and (max-height:520px){
      #starterov>.card{display:flex!important;flex-direction:column!important;overflow:hidden!important}
      #starterlist.starters{flex:1;min-height:0;display:grid!important;grid-template-columns:repeat(4,minmax(0,1fr))!important;grid-template-rows:minmax(0,1fr)!important;gap:7px!important;overflow-x:auto!important;overflow-y:hidden!important}
      #starterlist .starter{min-width:132px;min-height:0;padding:7px!important;border-radius:12px!important;display:grid!important;grid-template-rows:auto auto minmax(0,1fr) auto!important;align-items:start;overflow:hidden}
      #starterlist .starter canvas{width:clamp(54px,18vh,74px)!important;height:clamp(54px,18vh,74px)!important;max-height:none!important;margin:0 auto!important}
      #starterlist .starter b{font-size:11px;line-height:1.15;min-width:0}#starterlist .starter p{min-height:0;max-height:none;margin:4px 0!important;padding-right:3px;overflow:auto;font-size:10px;line-height:1.25;text-align:left}#starterlist .starter button{min-height:34px!important;padding:5px!important;border-radius:9px!important;font-size:10px!important}
    }
    @media (orientation:portrait) and (max-width:700px){#starterlist.starters{grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:7px!important}#starterlist .starter{padding:8px!important}#starterlist .starter canvas{width:78px!important;height:78px!important}#starterlist .starter p{font-size:11px;line-height:1.3}.v107fChoices{grid-template-columns:1fr!important}}
  `;
  document.head.appendChild(style);

  function currentScene() {
    try { return typeof scene === 'string' ? scene : ''; } catch (_) { return ''; }
  }

  function controlsUsable() {
    const root = document.getElementById('touchControlsV79');
    const cluster = root?.querySelector('.cluster');
    const mode = currentScene();
    if (!root || !cluster || !['world', 'interior'].includes(mode)) return false;
    const rootStyle = getComputedStyle(root);
    const clusterStyle = getComputedStyle(cluster);
    return rootStyle.display !== 'none' && rootStyle.visibility !== 'hidden' && clusterStyle.display !== 'none' && clusterStyle.visibility !== 'hidden';
  }

  function stepMovement() {
    if (!controlsUsable()) return stopJoystick();
    if (vector.magnitude < .18) {
      if (moveTimer) window.clearInterval(moveTimer);
      moveTimer = 0;
      return;
    }
    const horizontal = Math.abs(vector.x) >= Math.abs(vector.y);
    const amount = 4 + Math.round(6 * vector.magnitude);
    let dx = 0, dy = 0, dir = 0;
    if (horizontal) {
      dx = vector.x > 0 ? amount : -amount;
      dir = vector.x > 0 ? 2 : 1;
    } else {
      dy = vector.y > 0 ? amount : -amount;
      dir = vector.y > 0 ? 0 : 3;
    }
    try {
      if (typeof v81TouchStep === 'function') v81TouchStep(dx, dy, dir);
      else if (currentScene() === 'interior' && typeof moveInterior === 'function') moveInterior(dx, dy, dir);
      else if (currentScene() === 'world' && typeof move === 'function') move(dx, dy, dir);
    } catch (error) {
      console.error('Joystick Valdora', error);
      stopJoystick();
    }
  }

  function updateVector(event, joystick) {
    const rect = joystick.getBoundingClientRect();
    const radius = Math.max(1, rect.width / 2);
    let x = (event.clientX - (rect.left + radius)) / radius;
    let y = (event.clientY - (rect.top + radius)) / radius;
    const rawMagnitude = Math.hypot(x, y);
    if (rawMagnitude > 1) { x /= rawMagnitude; y /= rawMagnitude; }
    const magnitude = Math.min(1, rawMagnitude);
    vector = { x, y, magnitude };
    const knob = joystick.querySelector('#valdoraJoystickKnob');
    const travel = radius * .47;
    if (knob) knob.style.transform = `translate(calc(-50% + ${x * travel}px),calc(-50% + ${y * travel}px))`;
    if (magnitude < .18 && moveTimer) {
      window.clearInterval(moveTimer);
      moveTimer = 0;
    }
    if (magnitude >= .18 && !moveTimer) {
      stepMovement();
      moveTimer = window.setInterval(stepMovement, 36);
    }
  }

  function stopJoystick() {
    if (moveTimer) window.clearInterval(moveTimer);
    moveTimer = 0;
    pointerId = null;
    vector = { x: 0, y: 0, magnitude: 0 };
    const joystick = document.getElementById('valdoraJoystick');
    const knob = document.getElementById('valdoraJoystickKnob');
    joystick?.classList.remove('active');
    if (knob) knob.style.transform = 'translate(-50%,-50%)';
    try { if (typeof v79StopMove === 'function') v79StopMove(); } catch (_) {}
  }

  function bindJoystick(joystick) {
    joystick.addEventListener('pointerdown', event => {
      if (!controlsUsable()) return;
      event.preventDefault();
      pointerId = event.pointerId;
      try { joystick.setPointerCapture(pointerId); } catch (_) {}
      joystick.classList.add('active');
      updateVector(event, joystick);
    });
    joystick.addEventListener('pointermove', event => {
      if (event.pointerId !== pointerId) return;
      event.preventDefault();
      updateVector(event, joystick);
    });
    const release = event => {
      if (pointerId != null && event.pointerId != null && event.pointerId !== pointerId) return;
      event.preventDefault();
      stopJoystick();
    };
    joystick.addEventListener('pointerup', release);
    joystick.addEventListener('pointercancel', release);
    joystick.addEventListener('lostpointercapture', stopJoystick);
    joystick.addEventListener('contextmenu', event => event.preventDefault());
  }

  function installJoystick() {
    const root = document.getElementById('touchControlsV79');
    const cluster = root?.querySelector('.cluster');
    if (!root || !cluster || cluster.querySelector('#valdoraJoystick')) return false;
    stopJoystick();
    cluster.replaceChildren();
    const joystick = document.createElement('div');
    joystick.id = 'valdoraJoystick';
    joystick.setAttribute('role', 'application');
    joystick.setAttribute('aria-label', 'Joystick de déplacement');
    joystick.tabIndex = 0;
    joystick.innerHTML = '<span id="valdoraJoystickHint" aria-hidden="true">DÉPLACER</span><span id="valdoraJoystickKnob" aria-hidden="true"></span>';
    cluster.appendChild(joystick);
    bindJoystick(joystick);
    return true;
  }

  function installDialogCloseButton() {
    const root = document.getElementById('touchControlsV79');
    const actions = root?.querySelector('.actions');
    if (!actions || actions.querySelector('#valdoraDialogClose')) return false;
    const button = document.createElement('button');
    button.id = 'valdoraDialogClose';
    button.type = 'button';
    button.hidden = true;
    button.textContent = 'FERMER';
    button.setAttribute('aria-label', 'Fermer la boîte de dialogue');
    button.addEventListener('click', event => {
      event.preventDefault();
      event.stopPropagation();
      try { if (typeof closeDialog === 'function') closeDialog(true); } catch (error) {
        console.error('Fermeture du dialogue Valdora', error);
      }
    });
    actions.appendChild(button);
    return true;
  }

  function scheduleInstall() {
    cancelAnimationFrame(installFrame);
    installFrame = requestAnimationFrame(() => {
      installJoystick();
      installDialogCloseButton();
      installNewsButton();
    });
  }

  function seenRelease() {
    try { return localStorage.getItem(RELEASE_KEY) === RELEASE.id; } catch (_) {
      try { return sessionStorage.getItem(RELEASE_KEY) === RELEASE.id; } catch (__) { return false; }
    }
  }

  function markReleaseSeen() {
    try { localStorage.setItem(RELEASE_KEY, RELEASE.id); } catch (_) {
      try { sessionStorage.setItem(RELEASE_KEY, RELEASE.id); } catch (__) {}
    }
  }

  function ensureUpdateDialog() {
    let dialog = document.getElementById('valdoraUpdateDialog');
    if (dialog) return dialog;
    dialog = document.createElement('div');
    dialog.id = 'valdoraUpdateDialog';
    dialog.hidden = true;
    dialog.setAttribute('role', 'dialog');
    dialog.setAttribute('aria-modal', 'true');
    dialog.setAttribute('aria-labelledby', 'valdoraUpdateTitle');
    dialog.innerHTML = `<div class="valdoraUpdateCard"><span class="valdoraUpdateKicker">NOUVEAUTÉS</span><h2 id="valdoraUpdateTitle"></h2><p id="valdoraUpdateIntro"></p><ul class="valdoraUpdateList"></ul><button type="button" class="valdoraUpdateClose">Fermer et jouer</button></div>`;
    document.body.appendChild(dialog);
    dialog.querySelector('.valdoraUpdateClose').addEventListener('click', closeUpdateDialog);
    return dialog;
  }

  function openUpdateDialog(force = false) {
    if (!force && seenRelease()) return false;
    const dialog = ensureUpdateDialog();
    dialog.querySelector('#valdoraUpdateTitle').textContent = RELEASE.title;
    dialog.querySelector('#valdoraUpdateIntro').textContent = RELEASE.intro;
    const list = dialog.querySelector('.valdoraUpdateList');
    list.replaceChildren(...RELEASE.notes.map(note => {
      const item = document.createElement('li');
      item.textContent = note;
      return item;
    }));
    dialog.hidden = false;
    stopJoystick();
    setTimeout(() => dialog.querySelector('.valdoraUpdateClose')?.focus(), 0);
    return true;
  }

  function closeUpdateDialog() {
    const dialog = document.getElementById('valdoraUpdateDialog');
    if (!dialog || dialog.hidden) return;
    markReleaseSeen();
    dialog.hidden = true;
  }

  function installNewsButton() {
    const grid = document.querySelector('aside .panel .grid');
    if (!grid || document.getElementById('valdoraWhatsNewBtn')) return;
    const button = document.createElement('button');
    button.id = 'valdoraWhatsNewBtn';
    button.type = 'button';
    button.textContent = 'NOUVEAUTÉS';
    button.title = 'Relire les nouveautés de cette mise à jour';
    button.addEventListener('click', () => openUpdateDialog(true));
    grid.appendChild(button);
  }

  document.addEventListener('keydown', event => {
    const dialog = document.getElementById('valdoraUpdateDialog');
    if (!dialog || dialog.hidden) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    if (['Escape', 'Enter', 'Space'].includes(event.code) || ['Escape', 'Enter', ' '].includes(event.key)) closeUpdateDialog();
  }, true);
  window.addEventListener('blur', stopJoystick);
  document.addEventListener('visibilitychange', () => { if (document.hidden) stopJoystick(); });
  window.addEventListener('orientationchange', () => setTimeout(scheduleInstall, 120), { passive: true });
  window.addEventListener('resize', scheduleInstall, { passive: true });

  new MutationObserver(scheduleInstall).observe(document.body, { childList: true, subtree: true });
  scheduleInstall();
  setTimeout(scheduleInstall, 180);
  setTimeout(scheduleInstall, 900);
  setTimeout(scheduleInstall, 2200);
  setTimeout(() => openUpdateDialog(false), 80);

  window.ValdoraMobileUIV118 = {
    version: VERSION,
    release: RELEASE,
    installJoystick,
    installDialogCloseButton,
    stopJoystick,
    openUpdateDialog,
    closeUpdateDialog
  };
})();
