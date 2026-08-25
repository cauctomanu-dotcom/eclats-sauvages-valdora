(() => {
  'use strict';

  const VERSION = 'V118-SAVE-1';
  const FORMAT = 'ECLATS_SAUVAGES_VALDORA_SAVE';
  const DB_NAME = 'ValdoraSaveDB';
  const DB_STORE = 'saves';
  const DB_SLOT = 'main';
  const AUTOSAVE_DELAY = 20000;
  const WRITE_THROTTLE = 4000;
  let lastWrite = 0;
  let fileInput = null;

  const saveKey = () => (typeof SAVE !== 'undefined' && SAVE) ? SAVE : 'valdora_v41_player';
  const getState = () => (typeof state !== 'undefined' ? state : null);
  const inWorld = () => typeof scene !== 'undefined' && scene === 'world';

  function notify(message) {
    try {
      if (typeof toast === 'function') toast(message);
      else console.info('[Valdora]', message);
    } catch (_) {
      console.info('[Valdora]', message);
    }
  }

  function cleanName(value) {
    try {
      return String(value || 'Dresseur')
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-zA-Z0-9_-]+/g, '_')
        .replace(/^_+|_+$/g, '').slice(0, 28) || 'Dresseur';
    } catch (_) {
      return 'Dresseur';
    }
  }

  function playerName() {
    try {
      return cleanName((typeof window.ValdoraPlayerName === 'function' && window.ValdoraPlayerName()) || getState()?.playerName);
    } catch (_) {
      return 'Dresseur';
    }
  }

  function fileName() {
    const date = new Date();
    const part = value => String(value).padStart(2, '0');
    const stamp = `${date.getFullYear()}${part(date.getMonth() + 1)}${part(date.getDate())}_${part(date.getHours())}${part(date.getMinutes())}`;
    return `Valdora_${playerName()}_${stamp}.valdora`;
  }

  function parseLoose(value) {
    let parsed = value;
    for (let index = 0; index < 6 && typeof parsed === 'string'; index += 1) {
      const text = parsed.replace(/^\uFEFF/, '').trim();
      if (!text) throw new Error('La sauvegarde est vide.');
      parsed = JSON.parse(text);
    }
    return parsed;
  }

  function unwrapSave(raw) {
    let parsed = parseLoose(raw);
    for (let index = 0; index < 6; index += 1) {
      if (typeof parsed === 'string') {
        parsed = parseLoose(parsed);
        continue;
      }
      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) break;
      if (parsed.format === FORMAT && parsed.state != null) {
        parsed = parsed.state;
        continue;
      }
      if (parsed.state != null && (parsed.gameVersion || parsed.formatVersion || parsed.exportedAt)) {
        parsed = parsed.state;
        continue;
      }
      if (parsed.payload != null) {
        parsed = parsed.payload;
        continue;
      }
      if (parsed.save != null) {
        parsed = parsed.save;
        continue;
      }
      break;
    }
    parsed = parseLoose(parsed);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error('Ce fichier ne contient pas une partie Valdora.');
    if (!parsed.zone && parsed._saveMeta?.zone) parsed.zone = parsed._saveMeta.zone;
    if (!parsed.zone && (Array.isArray(parsed.team) || Array.isArray(parsed.box)) && ('story' in parsed || 'inventory' in parsed)) parsed.zone = 'town0';
    if (typeof parsed.zone !== 'string' || !parsed.zone) throw new Error('La zone de jeu est absente.');
    return parsed;
  }

  function tryUnwrap(raw) {
    try {
      return unwrapSave(raw);
    } catch (_) {
      return null;
    }
  }

  function progressFingerprint(value) {
    const source = typeof value === 'string' ? tryUnwrap(value) : value;
    if (!source || typeof source !== 'object') return null;
    try {
      return JSON.stringify(source, (key, item) => key === '_saveMeta' ? undefined : item);
    } catch (_) {
      return null;
    }
  }

  function makeMeta(current) {
    return {
      version: VERSION,
      savedAt: Date.now(),
      zone: current.zone || 'town0',
      playerMode: typeof PLAYER_PROGRESSION_LOCK !== 'undefined' ? Boolean(PLAYER_PROGRESSION_LOCK) : true
    };
  }

  function persistLocal(options = {}) {
    const current = getState();
    if (!current || typeof current !== 'object' || Array.isArray(current) || !current.zone) return false;
    if (!options.force && Date.now() - lastWrite < WRITE_THROTTLE) return true;

    try {
      if (typeof ensureInventoryV81 === 'function') ensureInventoryV81(current);
      const currentFingerprint = progressFingerprint(current);
      current._saveMeta = makeMeta(current);
      const payload = JSON.stringify(current);
      const key = saveKey();

      try {
        const previous = localStorage.getItem(key);
        const previousFingerprint = progressFingerprint(previous);
        if (options.rotateBackup !== false && previous && previousFingerprint && previousFingerprint !== currentFingerprint) {
          localStorage.setItem(`${key}_backup`, previous);
        } else if (!localStorage.getItem(`${key}_backup`)) {
          localStorage.setItem(`${key}_backup`, payload);
        }
        localStorage.setItem(key, payload);
        localStorage.setItem(`${key}_meta`, JSON.stringify(current._saveMeta));
      } catch (error) {
        console.warn('V118 stockage local indisponible', error);
      }

      if (typeof window.v96SaveIndexedDB === 'function') window.v96SaveIndexedDB(payload);
      lastWrite = Date.now();
      return true;
    } catch (error) {
      console.error('V118 sauvegarde locale', error);
      if (!options.silent) notify(`Impossible d’enregistrer : ${error?.message || error}`);
      return false;
    }
  }

  function saveGame(show = true) {
    const success = persistLocal({ force: Boolean(show), silent: !show });
    if (show && success) {
      notify('Partie enregistrée sur cet appareil ✓');
      refreshCenter();
    }
    return success;
  }

  function buildExportText() {
    if (!persistLocal({ force: true })) throw new Error('La partie ne peut pas être enregistrée.');
    const current = getState();
    return JSON.stringify({
      format: FORMAT,
      formatVersion: 2,
      gameVersion: VERSION,
      exportedAt: Date.now(),
      mode: typeof PLAYER_PROGRESSION_LOCK !== 'undefined' && PLAYER_PROGRESSION_LOCK ? 'joueur' : 'createur',
      state: current
    }, null, 2);
  }

  async function exportSave() {
    try {
      const text = buildExportText();
      const name = fileName();
      const blob = new Blob([text], { type: 'application/json' });
      const file = new File([blob], name, { type: 'application/json', lastModified: Date.now() });

      if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
        try {
          await navigator.share({ files: [file], title: 'Sauvegarde Valdora', text: 'Copie de ma partie Éclats Sauvages — Valdora' });
          notify('Copie de sauvegarde partagée ✓');
          centerMessage('La copie peut être placée dans Fichiers, iCloud Drive ou envoyée par AirDrop.', 'success');
          return true;
        } catch (error) {
          if (error?.name === 'AbortError') return false;
          console.warn('Partage de fichier indisponible', error);
        }
      }

      if (typeof window.showSaveFilePicker === 'function') {
        try {
          const handle = await window.showSaveFilePicker({
            suggestedName: name,
            types: [{ description: 'Sauvegarde Éclats Sauvages — Valdora', accept: { 'application/json': ['.valdora'] } }],
            excludeAcceptAllOption: false
          });
          const writable = await handle.createWritable();
          await writable.write(text);
          await writable.close();
          notify('Copie .valdora exportée ✓');
          centerMessage('La copie de sauvegarde a bien été créée.', 'success');
          return true;
        } catch (error) {
          if (error?.name === 'AbortError') return false;
          console.warn('Enregistrement natif indisponible', error);
        }
      }

      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = name;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      setTimeout(() => URL.revokeObjectURL(url), 2000);
      notify('Copie .valdora téléchargée ✓');
      centerMessage('Sur iPhone, ouvre le fichier téléchargé puis utilise Partager → Enregistrer dans Fichiers.', 'success');
      return true;
    } catch (error) {
      console.error('V118 export', error);
      centerMessage(`Export impossible : ${error?.message || error}`, 'error');
      notify('Impossible d’exporter la sauvegarde.');
      return false;
    }
  }

  function normalizeState(next) {
    try {
      if (typeof migrateState === 'function') next = migrateState(next);
    } catch (error) {
      console.warn('Migration complète impossible, restauration tolérante', error);
    }
    next.team = Array.isArray(next.team) ? next.team : [];
    next.box = Array.isArray(next.box) ? next.box : [];
    next.dex = next.dex && typeof next.dex === 'object' ? next.dex : {};
    next.inventory = next.inventory && typeof next.inventory === 'object' ? next.inventory : {};
    try {
      if (typeof ensureInventoryV81 === 'function') ensureInventoryV81(next);
    } catch (_) {}
    return next;
  }

  function applyState(raw, label, options = {}) {
    let next = normalizeState(unwrapSave(raw));
    state = next;
    try { scene = 'world'; } catch (_) {}
    try { battle = null; } catch (_) {}
    try { building = null; } catch (_) {}
    try { if (typeof migrateDragonsV107W === 'function') migrateDragonsV107W(); } catch (_) {}

    const title = document.getElementById('title');
    if (title) title.style.display = 'none';
    const menu = document.getElementById('menuov');
    if (menu) menu.style.display = 'none';
    document.body.classList.remove('valdoraMobileMenu');
    closeCenter();

    try { if (typeof startMusic === 'function') startMusic(); } catch (_) {}
    try { if (typeof resetFollowerTrail === 'function') resetFollowerTrail(); } catch (_) {}
    try { if (typeof hud === 'function') hud(); } catch (_) {}
    persistLocal({ force: true, rotateBackup: options.rotateBackup !== false });
    notify(`Partie récupérée ✓ — ${label}`);
    return true;
  }

  function localCandidates() {
    const key = saveKey();
    const candidates = [];
    try {
      candidates.push({ raw: localStorage.getItem(key), label: 'sauvegarde de cet appareil', backup: false });
      candidates.push({ raw: localStorage.getItem(`${key}_backup`), label: 'copie précédente', backup: true });
    } catch (_) {}
    return candidates.filter(candidate => candidate.raw);
  }

  function openDatabase() {
    return new Promise((resolve, reject) => {
      if (!window.indexedDB) return reject(new Error('IndexedDB indisponible'));
      const request = indexedDB.open(DB_NAME, 1);
      request.onupgradeneeded = () => {
        if (!request.result.objectStoreNames.contains(DB_STORE)) request.result.createObjectStore(DB_STORE);
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error || new Error('Erreur IndexedDB'));
    });
  }

  async function readIndexedDB() {
    try {
      const database = await openDatabase();
      const raw = await new Promise((resolve, reject) => {
        const transaction = database.transaction(DB_STORE, 'readonly');
        const request = transaction.objectStore(DB_STORE).get(DB_SLOT);
        request.onsuccess = () => resolve(request.result || null);
        request.onerror = () => reject(request.error);
      });
      database.close();
      return raw;
    } catch (_) {
      return null;
    }
  }

  async function continueLocal() {
    const button = document.getElementById('continue');
    if (button) button.disabled = true;
    try {
      for (const candidate of localCandidates()) {
        if (!tryUnwrap(candidate.raw)) continue;
        return applyState(candidate.raw, candidate.label, { rotateBackup: !candidate.backup });
      }
      const indexed = await readIndexedDB();
      if (indexed && tryUnwrap(indexed)) return applyState(indexed, 'copie locale de secours', { rotateBackup: false });
      openCenter('Aucune sauvegarde locale n’a été trouvée. Utilise « Importer depuis Fichiers » pour récupérer une copie .valdora.');
      return false;
    } finally {
      if (button) button.disabled = false;
    }
  }

  function importSave() {
    if (!fileInput) {
      fileInput = document.createElement('input');
      fileInput.type = 'file';
      fileInput.accept = '.valdora,.json,application/json,text/plain';
      fileInput.hidden = true;
      fileInput.addEventListener('change', async () => {
        const file = fileInput.files?.[0];
        fileInput.value = '';
        if (!file) return;
        try {
          applyState(await file.text(), file.name || 'fichier importé');
        } catch (error) {
          console.error('V118 import', error);
          centerMessage(`Ce fichier n’est pas une sauvegarde Valdora valide : ${error?.message || error}`, 'error');
          notify('Impossible de récupérer cette sauvegarde.');
        }
      });
      document.body.appendChild(fileInput);
    }
    fileInput.click();
    return true;
  }

  function formatSavedAt(raw) {
    const parsed = tryUnwrap(raw);
    if (!parsed) return null;
    const savedAt = Number(parsed._saveMeta?.savedAt || 0);
    const date = savedAt ? new Date(savedAt) : null;
    return {
      text: date && !Number.isNaN(date.getTime())
        ? date.toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' })
        : 'date inconnue',
      zone: parsed.zone || 'zone inconnue',
      name: parsed.playerName || 'Dresseur'
    };
  }

  function ensureCenter() {
    let center = document.getElementById('valdoraSaveCenter');
    if (center) return center;

    const style = document.createElement('style');
    style.id = 'valdoraSaveV118Style';
    style.textContent = `
      #valdoraSaveCenter{position:fixed;inset:0;z-index:2100000;display:grid;place-items:center;padding:calc(14px + var(--safe-top,0px)) calc(14px + var(--safe-right,0px)) calc(14px + var(--safe-bottom,0px)) calc(14px + var(--safe-left,0px));background:rgba(5,20,32,.84);backdrop-filter:blur(12px)}
      #valdoraSaveCenter[hidden]{display:none}.valdoraSaveCard{width:min(720px,100%);max-height:100%;overflow:auto;padding:22px;border-radius:25px;background:linear-gradient(155deg,#f9fdff,#eaf5f9);color:#173548;box-shadow:0 28px 90px rgba(0,0,0,.5);border:1px solid rgba(255,255,255,.8)}
      .valdoraSaveHead{display:flex;align-items:flex-start;justify-content:space-between;gap:16px}.valdoraSaveHead h2{margin:0;color:#174d70;font-size:25px}.valdoraSaveHead p{margin:5px 0 0;color:#587180;line-height:1.4}.valdoraSaveClose{flex:0 0 auto;width:42px;height:42px;padding:0;border-radius:50%;background:#173548;color:#fff;font-size:20px}
      .valdoraSaveStatus{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;margin:18px 0}.valdoraSaveSlot{padding:13px;border-radius:16px;background:#fff;border:1px solid #cadde5;line-height:1.45}.valdoraSaveSlot b{display:block;color:#174d70}.valdoraSaveSlot span{display:block;font-size:12px;color:#5f7886;margin-top:3px}
      .valdoraSaveAuto{display:flex;align-items:center;gap:9px;padding:10px 12px;border-radius:14px;background:#dff4e9;color:#245d44;font-weight:800}.valdoraSaveAuto i{display:block;width:10px;height:10px;border-radius:50%;background:#38a86f;box-shadow:0 0 0 4px rgba(56,168,111,.15)}
      .valdoraSaveActions{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;margin-top:14px}.valdoraSaveActions button{min-height:58px;padding:11px 13px;text-align:left;background:#fff;border:1px solid #c6dce5;box-shadow:0 5px 14px rgba(23,53,72,.1)}.valdoraSaveActions button b,.valdoraSaveActions button small{display:block}.valdoraSaveActions button small{margin-top:3px;color:#607986;font-weight:650;line-height:1.3}.valdoraSaveActions .primary{background:linear-gradient(145deg,#216b91,#174d70);color:#fff;border-color:#174d70}.valdoraSaveActions .primary small{color:#d9eff8}.valdoraSaveActions button:disabled{opacity:.45;cursor:not-allowed}
      #valdoraSaveMessage{min-height:0;margin-top:12px;padding:0;line-height:1.45;font-size:13px}#valdoraSaveMessage:not(:empty){padding:10px 12px;border-radius:13px;background:#e6f1f5}#valdoraSaveMessage.success{background:#dff4e9;color:#245d44}#valdoraSaveMessage.error{background:#fde8e6;color:#8a352f}
      .valdoraSaveTip{margin:14px 0 0;font-size:12px;line-height:1.5;color:#607986}
      @media(max-width:620px){.valdoraSaveCard{padding:16px;border-radius:20px}.valdoraSaveStatus,.valdoraSaveActions{grid-template-columns:1fr}.valdoraSaveHead h2{font-size:21px}.valdoraSaveActions button{min-height:52px}}
    `;
    document.head.appendChild(style);

    center = document.createElement('div');
    center.id = 'valdoraSaveCenter';
    center.hidden = true;
    center.setAttribute('role', 'dialog');
    center.setAttribute('aria-modal', 'true');
    center.setAttribute('aria-labelledby', 'valdoraSaveTitle');
    center.innerHTML = `
      <div class="valdoraSaveCard">
        <div class="valdoraSaveHead">
          <div><h2 id="valdoraSaveTitle">Mes sauvegardes</h2><p>Ta partie reste disponible sur cet appareil et tu peux en garder une copie où tu veux.</p></div>
          <button type="button" class="valdoraSaveClose" data-save-action="close" aria-label="Fermer">×</button>
        </div>
        <div class="valdoraSaveStatus">
          <div class="valdoraSaveSlot"><b>Sur cet appareil</b><span id="valdoraPrimaryStatus">Aucune partie enregistrée</span></div>
          <div class="valdoraSaveSlot"><b>Copie précédente</b><span id="valdoraBackupStatus">Aucune copie disponible</span></div>
        </div>
        <div class="valdoraSaveAuto"><i aria-hidden="true"></i>Sauvegarde automatique active</div>
        <div class="valdoraSaveActions">
          <button type="button" class="primary" data-save-action="save"><b>Sauvegarder maintenant</b><small>Enregistre immédiatement sur cet appareil.</small></button>
          <button type="button" data-save-action="export"><b>Exporter vers Fichiers / iCloud</b><small>Crée une copie .valdora à conserver ou transférer.</small></button>
          <button type="button" data-save-action="import"><b>Importer depuis Fichiers</b><small>Récupère une copie .valdora, même sur un nouvel appareil.</small></button>
          <button type="button" id="valdoraRestoreBackup" data-save-action="restore"><b>Restaurer la copie précédente</b><small>Revient à l’enregistrement antérieur disponible.</small></button>
        </div>
        <div id="valdoraSaveMessage" role="status" aria-live="polite"></div>
        <p class="valdoraSaveTip"><b>Conseil iPhone :</b> après « Exporter », choisis <b>Enregistrer dans Fichiers</b> puis <b>iCloud Drive</b>. L’import utilise ensuite le sélecteur Fichiers d’iOS.</p>
      </div>`;
    document.body.appendChild(center);

    center.addEventListener('click', event => {
      if (event.target === center) return closeCenter();
      const action = event.target.closest('[data-save-action]')?.dataset.saveAction;
      if (action === 'close') closeCenter();
      if (action === 'save') saveGame(true);
      if (action === 'export') exportSave();
      if (action === 'import') importSave();
      if (action === 'restore') restoreBackup();
    });
    return center;
  }

  function centerMessage(message, type = '') {
    const target = document.getElementById('valdoraSaveMessage');
    if (!target) return;
    target.textContent = message || '';
    target.className = type;
  }

  function refreshCenter() {
    const center = document.getElementById('valdoraSaveCenter');
    if (!center) return;
    const key = saveKey();
    let primary = null;
    let backup = null;
    try {
      primary = formatSavedAt(localStorage.getItem(key));
      backup = formatSavedAt(localStorage.getItem(`${key}_backup`));
    } catch (_) {}
    const primaryText = document.getElementById('valdoraPrimaryStatus');
    const backupText = document.getElementById('valdoraBackupStatus');
    if (primaryText) primaryText.textContent = primary ? `${primary.name} — ${primary.zone} — ${primary.text}` : 'Aucune partie enregistrée';
    if (backupText) backupText.textContent = backup ? `${backup.name} — ${backup.zone} — ${backup.text}` : 'Aucune copie disponible';
    const restore = document.getElementById('valdoraRestoreBackup');
    if (restore) restore.disabled = !backup;
  }

  function openCenter(message = '') {
    const center = ensureCenter();
    refreshCenter();
    centerMessage(message);
    center.hidden = false;
    center.querySelector('.valdoraSaveClose')?.focus();
    return true;
  }

  function closeCenter() {
    const center = document.getElementById('valdoraSaveCenter');
    if (center) center.hidden = true;
  }

  function restoreBackup() {
    const key = saveKey();
    let backup = null;
    try { backup = localStorage.getItem(`${key}_backup`); } catch (_) {}
    if (!backup || !tryUnwrap(backup)) {
      centerMessage('Aucune copie précédente valide n’est disponible.', 'error');
      return false;
    }
    if (!window.confirm('Remplacer la partie actuelle par la copie précédente ?')) return false;
    return applyState(backup, 'copie précédente', { rotateBackup: false });
  }

  function installBindings() {
    window.save = saveGame;
    try { save = saveGame; } catch (_) {}
    window.v96Continue = continueLocal;
    window.v96OpenSavePicker = importSave;
    window.v96DownloadSaveFile = exportSave;

    const quick = document.getElementById('save');
    if (quick) {
      quick.textContent = 'Sauver maintenant';
      quick.title = 'Enregistrer immédiatement sur cet appareil';
      quick.onclick = () => saveGame(true);
    }
    const continueButton = document.getElementById('continue');
    if (continueButton) {
      continueButton.title = 'Reprendre la sauvegarde de cet appareil';
      continueButton.onclick = continueLocal;
    }
    const manager = document.getElementById('v107fSaveMenu');
    if (manager) {
      manager.textContent = 'MES SAUVEGARDES';
      manager.onclick = () => openCenter();
    }
    const importButton = document.getElementById('v96ImportSave');
    if (importButton) {
      importButton.textContent = 'Récupérer une partie';
      importButton.onclick = () => openCenter();
    }
    const titleImport = document.getElementById('v107fImportTitle');
    if (titleImport) {
      titleImport.textContent = 'Récupérer une sauvegarde';
      titleImport.onclick = () => openCenter();
    }

    const aliases = [window.ValdoraSaveV108A, window.ValdoraSaveV108B, window.ValdoraSaveV107Z, window.ValdoraSaveV107Q].filter(Boolean);
    for (const api of aliases) Object.assign(api, {
      saveAsNow: exportSave,
      saveNow: saveGame,
      saveSlot: saveGame,
      loadFile: importSave,
      continueGame: continueLocal,
      loadSlot: continueLocal,
      exportCurrent: exportSave,
      folderHelp: openCenter,
      openSaveMenu: openCenter,
      applyState
    });
    if (window.ValdoraV107F) {
      window.ValdoraV107F.exportSave = exportSave;
      window.ValdoraV107F.openSaveHelp = openCenter;
      window.ValdoraV107F.saveFolderHelp = openCenter;
    }
  }

  window.ValdoraSaveV118 = {
    version: VERSION,
    saveNow: saveGame,
    persistLocal,
    continueGame: continueLocal,
    exportSave,
    importSave,
    applyState,
    openCenter,
    closeCenter,
    refreshCenter
  };

  window.addEventListener('pagehide', () => {
    if (inWorld()) persistLocal({ force: true, silent: true });
  });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && inWorld()) persistLocal({ force: true, silent: true });
  });
  document.addEventListener('keydown', event => {
    const center = document.getElementById('valdoraSaveCenter');
    if (!center || center.hidden || event.key !== 'Escape') return;
    event.preventDefault();
    event.stopImmediatePropagation();
    closeCenter();
  }, true);
  setInterval(() => {
    if (inWorld() && getState()?.team?.length) persistLocal({ silent: true });
  }, AUTOSAVE_DELAY);

  installBindings();
  document.addEventListener('DOMContentLoaded', installBindings);
  setTimeout(installBindings, 100);
  setTimeout(installBindings, 700);
  setTimeout(installBindings, 1900);
  setTimeout(installBindings, 3600);
})();
