(() => {
  'use strict';

  const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
  const isStandalone = () => window.matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
  const isMobileLayout = () => window.matchMedia('(max-width: 900px), (max-height: 520px) and (pointer: coarse)').matches;
  let installPrompt = null;

  const style = document.createElement('style');
  style.id = 'valdoraPwaStyle';
  style.textContent = `
    :root{--safe-top:env(safe-area-inset-top,0px);--safe-right:env(safe-area-inset-right,0px);--safe-bottom:env(safe-area-inset-bottom,0px);--safe-left:env(safe-area-inset-left,0px)}
    #pwaInstallBtn{min-height:34px;padding:7px 11px;background:linear-gradient(145deg,#215f82,#17445f);color:#fff;box-shadow:0 5px 14px rgba(16,52,75,.25);white-space:nowrap}
    .pwaDialog{position:fixed;inset:0;z-index:2000000;display:grid;place-items:center;padding:calc(18px + var(--safe-top)) calc(18px + var(--safe-right)) calc(18px + var(--safe-bottom)) calc(18px + var(--safe-left));background:rgba(6,22,34,.82);backdrop-filter:blur(10px)}
    .pwaDialog[hidden]{display:none}.pwaDialogCard{width:min(480px,100%);max-height:100%;overflow:auto;padding:22px;border-radius:24px;background:#f7fbfd;color:#173548;box-shadow:0 24px 80px rgba(0,0,0,.45);border:1px solid rgba(255,255,255,.7)}
    .pwaDialogCard h2{margin:0 0 10px;color:#174d70}.pwaDialogCard p{line-height:1.5;margin:9px 0}.pwaDialogCard ol{line-height:1.7;padding-left:24px}.pwaDialogCard button{width:100%;margin-top:8px;background:#174d70;color:#fff}
    #pwaRotateHint{position:fixed;inset:0;z-index:1900000;display:none;place-items:center;padding:24px;background:linear-gradient(145deg,#0d2639,#174d70);color:#fff;text-align:center}
    #pwaRotateHint .rotateCard{max-width:350px}.rotatePhone{font-size:54px;display:block;animation:valdoraRotate 1.6s ease-in-out infinite}.rotateCard h2{font-size:23px;margin:10px 0}.rotateCard p{line-height:1.45}.rotateCard button{background:#fff;color:#174d70;margin-top:8px}
    @keyframes valdoraRotate{0%,35%{transform:rotate(0)}65%,100%{transform:rotate(90deg)}}
    .pwaAsideClose{display:none;width:100%;margin:0 0 10px;background:#174d70;color:#fff}
    @media (orientation:portrait) and (max-width:700px){body:not(.pwaPortraitDismissed) #pwaRotateHint{display:grid}}
    @media (max-width:900px), (max-height:520px) and (pointer:coarse){
      html,body,#app{width:100%;height:100dvh;min-height:100dvh;overflow:hidden}
      header{height:calc(48px + var(--safe-top));padding:var(--safe-top) calc(9px + var(--safe-right)) 0 calc(9px + var(--safe-left));gap:8px}
      .brand{font-size:14px;line-height:1.05}.brand b{display:block;font-size:9px;letter-spacing:.02em}.top{gap:5px;align-items:center}.pill{padding:6px 8px;font-size:10px;border-radius:11px}
      main{display:block!important;position:relative;min-height:0;overflow:hidden}
      #gamewrap{height:calc(100% - 8px);margin:4px;border-radius:14px}
      #gamewrap canvas{display:block;width:100%!important;height:100%!important;max-width:none!important;max-height:none!important;margin:0!important;object-fit:contain}
      aside{display:none;position:fixed;z-index:100500;top:calc(52px + var(--safe-top));right:calc(8px + var(--safe-right));bottom:calc(82px + var(--safe-bottom));left:calc(8px + var(--safe-left));padding:12px;overflow:auto;border:1px solid rgba(255,255,255,.6);border-radius:20px;background:rgba(230,244,250,.97);box-shadow:0 20px 60px rgba(6,28,42,.55);backdrop-filter:blur(12px)}
      body.valdoraMobileMenu aside{display:block}.pwaAsideClose{display:block}
      #touchControlsV79{left:var(--safe-left)!important;right:var(--safe-right)!important;bottom:var(--safe-bottom)!important;padding:8px 12px!important}
      #menuov,#starterov{padding:calc(8px + var(--safe-top)) calc(8px + var(--safe-right)) calc(8px + var(--safe-bottom)) calc(8px + var(--safe-left))}
      #dialog{padding:8px calc(8px + var(--safe-right)) calc(8px + var(--safe-bottom)) calc(8px + var(--safe-left))}.dbox{max-height:72%;overflow:auto;padding:12px 14px}
      .card{border-radius:16px;padding:12px}.dexgrid{grid-template-columns:repeat(2,minmax(0,1fr))}.dexentry,.mapwrap{grid-template-columns:1fr}.battlebar{padding:7px calc(7px + var(--safe-right)) calc(7px + var(--safe-bottom)) calc(7px + var(--safe-left));gap:5px}.battlebar button{padding:7px 5px;font-size:11px}
    }
    @media (max-width:560px){#money{display:none}.brand{max-width:145px}.top{gap:4px}#pwaInstallBtn{padding:6px 8px;font-size:11px}}
  `;
  document.head.appendChild(style);

  function closeDialog() {
    document.getElementById('pwaInstallHelp')?.setAttribute('hidden', '');
  }

  function ensureInstallHelp() {
    let dialog = document.getElementById('pwaInstallHelp');
    if (dialog) return dialog;
    dialog = document.createElement('div');
    dialog.id = 'pwaInstallHelp';
    dialog.className = 'pwaDialog';
    dialog.setAttribute('hidden', '');
    dialog.setAttribute('role', 'dialog');
    dialog.setAttribute('aria-modal', 'true');
    dialog.setAttribute('aria-labelledby', 'pwaInstallTitle');
    dialog.innerHTML = `
      <div class="pwaDialogCard">
        <h2 id="pwaInstallTitle">Installer Valdora sur l’iPhone</h2>
        <p>Ouvre cette adresse dans <b>Safari</b>, puis :</p>
        <ol>
          <li>touche le bouton <b>Partager</b> (le carré avec une flèche vers le haut) ;</li>
          <li>choisis <b>Sur l’écran d’accueil</b> ;</li>
          <li>touche <b>Ajouter</b>.</li>
        </ol>
        <p>Valdora apparaîtra ensuite comme une application et s’ouvrira sans la barre du navigateur.</p>
        <button type="button" id="pwaInstallClose">J’ai compris</button>
      </div>`;
    document.body.appendChild(dialog);
    dialog.addEventListener('click', event => { if (event.target === dialog) closeDialog(); });
    dialog.querySelector('#pwaInstallClose').addEventListener('click', closeDialog);
    return dialog;
  }

  async function installApp() {
    if (installPrompt) {
      installPrompt.prompt();
      await installPrompt.userChoice;
      installPrompt = null;
      updateInstallButton();
      return;
    }
    ensureInstallHelp().removeAttribute('hidden');
  }

  function updateInstallButton() {
    const button = document.getElementById('pwaInstallBtn');
    if (!button) return;
    button.hidden = isStandalone();
    button.textContent = installPrompt ? 'Installer' : (isIOS ? 'Installer sur iPhone' : 'Installer');
  }

  function addInstallButton() {
    const top = document.querySelector('header .top');
    if (!top || document.getElementById('pwaInstallBtn')) return;
    const button = document.createElement('button');
    button.id = 'pwaInstallBtn';
    button.type = 'button';
    button.textContent = 'Installer';
    button.addEventListener('click', installApp);
    top.prepend(button);
    updateInstallButton();
  }

  function installMobileDrawer() {
    const aside = document.querySelector('aside');
    if (!aside) return;
    if (!aside.querySelector('.pwaAsideClose')) {
      const close = document.createElement('button');
      close.type = 'button';
      close.className = 'pwaAsideClose';
      close.textContent = 'Fermer le menu';
      close.addEventListener('click', () => document.body.classList.remove('valdoraMobileMenu'));
      aside.prepend(close);
      aside.addEventListener('click', event => {
        if (event.target.closest('button') && !event.target.closest('.pwaAsideClose')) {
          setTimeout(() => document.body.classList.remove('valdoraMobileMenu'), 80);
        }
      });
    }

    const baseMenu = window.v79Menu;
    if (typeof baseMenu === 'function' && !baseMenu.valdoraPwaWrapped) {
      const wrapped = function () {
        if (isMobileLayout()) {
          document.body.classList.toggle('valdoraMobileMenu');
          return;
        }
        return baseMenu.apply(this, arguments);
      };
      wrapped.valdoraPwaWrapped = true;
      window.v79Menu = wrapped;
      try { v79Menu = wrapped; } catch (_) {}
    }
  }

  function addRotateHint() {
    if (document.getElementById('pwaRotateHint')) return;
    const hint = document.createElement('div');
    hint.id = 'pwaRotateHint';
    hint.innerHTML = `<div class="rotateCard"><span class="rotatePhone" aria-hidden="true">▯</span><h2>Tourne l’iPhone</h2><p>Valdora est conçu pour être joué à l’horizontale. Tu profiteras d’une carte plus grande et de commandes plus confortables.</p><button type="button">Continuer en portrait</button></div>`;
    document.body.appendChild(hint);
    hint.querySelector('button').addEventListener('click', () => document.body.classList.add('pwaPortraitDismissed'));
    window.addEventListener('orientationchange', () => {
      if (window.matchMedia('(orientation: landscape)').matches) document.body.classList.remove('pwaPortraitDismissed');
    }, { passive: true });
  }

  window.addEventListener('beforeinstallprompt', event => {
    event.preventDefault();
    installPrompt = event;
    updateInstallButton();
  });
  window.addEventListener('appinstalled', () => {
    installPrompt = null;
    updateInstallButton();
  });

  document.addEventListener('DOMContentLoaded', () => {
    addInstallButton();
    addRotateHint();
    installMobileDrawer();
    setTimeout(installMobileDrawer, 1800);
    setTimeout(installMobileDrawer, 6000);
  });

  if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost' || location.hostname === '127.0.0.1')) {
    window.addEventListener('load', () => navigator.serviceWorker.register('./sw.js').catch(error => console.warn('Installation hors ligne indisponible :', error)));
  }
})();
