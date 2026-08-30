(function () {
  'use strict';

  const VERSION = 'V110-STABLE';
  const PUBLIC_VERSION = 'V1.0.1';
  const LEGEND_ZONES = [
    'legend_nature', 'legend_feu', 'legend_eau', 'legend_foudre',
    'legend_ombre', 'legend_roche', 'legend_air', 'legend_spore',
    'legend_glace', 'legend_lumiere', 'legend_neutre'
  ];

  function target(exit) {
    return String(exit?.to || exit?.target || '');
  }

  function upsertExit(scene, destination, value) {
    if (!scene) return;
    scene.exits = Array.isArray(scene.exits) ? scene.exits : [];
    const index = scene.exits.findIndex(exit => target(exit) === destination);
    if (index >= 0) scene.exits[index] = { ...scene.exits[index], ...value, to: destination };
    else scene.exits.push({ ...value, to: destination });
  }

  function routeScene(name, width, height, path) {
    return {
      name, kind: 'route', routeEngine: VERSION, width, height,
      buildings: [], trainers: [], objects: [], obstacles: [], mObstacles: [],
      grass: [], v105dTrees: [], v105dCell: 220, v105dCore: 145, v105dRoad: new Set(),
      v76Path: path, v104Path: path, kPath: path,
      exits: []
    };
  }

  function ensureLegendaryNetwork() {
    if (typeof SCENES !== 'object' || !SCENES) return;
    const aubeval = SCENES.town14;
    if (!aubeval) return;

    if (!SCENES.route_horizons) {
      SCENES.route_horizons = routeScene('Route des Horizons', 3200, 2000,
        [[1600, 1920], [1600, 1600], [1450, 1280], [1730, 960], [1500, 620], [1600, 80]]);
    }
    if (!SCENES.route_legends) {
      SCENES.route_legends = routeScene('Carrefour des Sanctuaires', 3600, 2500,
        [[1800, 2420], [1800, 1700], [1800, 1250]]);
    }

    const horizons = SCENES.route_horizons;
    const crossroad = SCENES.route_legends;
    upsertExit(aubeval, 'route_horizons', {
      x: Math.max(0, aubeval.width / 2 - 110), y: 0, w: 220, h: 120,
      side: 'north', label: 'Route des Horizons', v110Stable: true
    });
    upsertExit(horizons, 'town14', {
      x: 1490, y: 1880, w: 220, h: 120, side: 'south', label: 'Aubeval', v110Stable: true
    });
    upsertExit(horizons, 'route_legends', {
      x: 1490, y: 0, w: 220, h: 120, side: 'north', label: 'Carrefour des Sanctuaires', v110Stable: true
    });
    upsertExit(crossroad, 'route_horizons', {
      x: Math.max(0, crossroad.width / 2 - 110), y: crossroad.height - 120,
      w: 220, h: 120, side: 'south', label: 'Retour', v110Stable: true
    });

    const radius = Math.min(crossroad.width, crossroad.height) * 0.34;
    LEGEND_ZONES.forEach((zone, index) => {
      const shrine = SCENES[zone];
      if (!shrine) return;
      const angle = -Math.PI / 2 + index * Math.PI * 2 / LEGEND_ZONES.length;
      upsertExit(crossroad, zone, {
        x: crossroad.width / 2 + Math.cos(angle) * radius - 85,
        y: crossroad.height / 2 + Math.sin(angle) * radius - 55,
        w: 170, h: 110, side: 'north', label: shrine.name || 'Sanctuaire', v110Stable: true
      });
      upsertExit(shrine, 'route_legends', {
        x: Math.max(0, (shrine.width || 3000) / 2 - 110), y: 0,
        w: 220, h: 100, side: 'north', label: 'Retour au Carrefour des Sanctuaires', v110Stable: true
      });
    });
  }

  function normalizeWorldCollections() {
    if (typeof SCENES !== 'object' || !SCENES) return;
    for (const scene of Object.values(SCENES)) {
      if (!scene || typeof scene !== 'object') continue;
      scene.exits = Array.isArray(scene.exits) ? scene.exits : [];
      scene.buildings = Array.isArray(scene.buildings) ? scene.buildings : [];
      scene.grass = Array.isArray(scene.grass) ? scene.grass : [];
      if (scene.v105dRoad == null && (scene.kind === 'town' || scene.kind === 'route')) scene.v105dRoad = new Set();
      if (scene.v105dRoad != null && !(scene.v105dRoad instanceof Set)) {
        if (Array.isArray(scene.v105dRoad)) scene.v105dRoad = new Set(scene.v105dRoad.map(String));
        else if (typeof scene.v105dRoad[Symbol.iterator] !== 'function') scene.v105dRoad = new Set();
      }
    }
  }

  function oppositeSide(side) {
    return ({ north: 'south', south: 'north', east: 'west', west: 'east' })[side] || 'south';
  }

  function fallbackExit(scene, to, sourceExit) {
    const width = Number(scene.width) || 1800, height = Number(scene.height) || 1100;
    const side = oppositeSide(sourceExit?.side), span = 180, depth = 110;
    if (side === 'north') return { x: width / 2 - span / 2, y: 0, w: span, h: depth, side, to, label: 'Retour', v110Stable: true };
    if (side === 'south') return { x: width / 2 - span / 2, y: height - depth, w: span, h: depth, side, to, label: 'Retour', v110Stable: true };
    if (side === 'west') return { x: 0, y: height / 2 - span / 2, w: depth, h: span, side, to, label: 'Retour', v110Stable: true };
    return { x: width - depth, y: height / 2 - span / 2, w: depth, h: span, side, to, label: 'Retour', v110Stable: true };
  }

  function ensureReciprocalLinks() {
    if (typeof SCENES !== 'object' || !SCENES) return;
    const links = [];
    for (const [from, scene] of Object.entries(SCENES)) {
      for (const exit of scene?.exits || []) {
        const to = target(exit);
        if (to && SCENES[to]) links.push({ from, to, exit });
      }
    }
    for (const { from, to, exit } of links) {
      const destination = SCENES[to];
      if (!destination.exits?.some(candidate => target(candidate) === from)) {
        upsertExit(destination, from, fallbackExit(destination, from, exit));
      }
    }
  }

  function audit() {
    normalizeWorldCollections();
    ensureLegendaryNetwork();
    ensureReciprocalLinks();
    const issues = [];
    if (typeof SCENES !== 'object' || !SCENES) return { version: VERSION, ok: false, issues: ['SCENES indisponible'] };
    for (const [from, scene] of Object.entries(SCENES)) {
      for (const exit of scene?.exits || []) {
        const to = target(exit);
        if (!to) issues.push(`${from}: portail sans destination`);
        else if (!SCENES[to]) issues.push(`${from} -> ${to}: destination absente`);
        else if (!SCENES[to].exits?.some(candidate => target(candidate) === from)) issues.push(`${from} -> ${to}: retour absent`);
      }
    }
    const required = [
      ['town14', 'route_horizons'], ['route_horizons', 'town14'],
      ['route_horizons', 'route_legends'], ['route_legends', 'route_horizons'],
      ...LEGEND_ZONES.flatMap(zone => [['route_legends', zone], [zone, 'route_legends']])
    ];
    for (const [from, to] of required) {
      if (!SCENES[from]?.exits?.some(exit => target(exit) === to)) issues.push(`${from} -> ${to}: liaison absente`);
    }
    const creatures = typeof CREATURES !== 'undefined' ? CREATURES : [];
    const ids = new Set();
    for (const creature of creatures) {
      if (ids.has(creature.id)) issues.push(`Créature ${creature.id}: identifiant dupliqué`);
      ids.add(creature.id);
      if (!creature.name || !creature.type) issues.push(`Créature ${creature.id}: données incomplètes`);
    }
    return { version: VERSION, publicVersion: PUBLIC_VERSION, ok: issues.length === 0, issues, scenes: Object.keys(SCENES).length, creatures: creatures.length };
  }

  function applyPublicBranding() {
    document.documentElement.dataset.valdoraPublicVersion = PUBLIC_VERSION;
    document.title = `Éclats Sauvages — Valdora ${PUBLIC_VERSION}`;
    const brand = document.querySelector('.brand b');
    if (brand) brand.textContent = `VALDORA ${PUBLIC_VERSION} — ${/CREATEUR/i.test(location.pathname) ? 'CRÉATEUR' : 'JOUEUR'}`;
  }

  function install() {
    normalizeWorldCollections();
    ensureLegendaryNetwork();
    ensureReciprocalLinks();
    window.ValdoraStableV110 = { version: VERSION, publicVersion: PUBLIC_VERSION, audit, repair: install, applyPublicBranding, legendaryZones: [...LEGEND_ZONES] };
    document.documentElement.dataset.valdoraStable = VERSION;
    applyPublicBranding();
  }

  install();
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install);
  [2200, 7200, 10200, 11800].forEach(delay => setTimeout(install, delay));
  setInterval(() => { try { applyPublicBranding(); } catch (_) {} }, 3000);
})();

(function loadValdoraV123(){
  if(document.getElementById('valdoraV123ParityLoader'))return;
  const script=document.createElement('script');
  script.id='valdoraV123ParityLoader';
  script.src='V123_CREATOR_PARITY_NPC_FIXES.js?v=123-parity-2';
  script.async=false;
  (document.head||document.documentElement).appendChild(script);
})();

(function loadValdoraV124(){
  if(document.getElementById('valdoraV124TouchLoader'))return;
  const script=document.createElement('script');
  script.id='valdoraV124TouchLoader';
  script.src='V124_TOUCH_DIRECT.js?v=124-touch-1';
  script.async=false;
  (document.head||document.documentElement).appendChild(script);
})();

(function loadValdoraV125(){
  if(document.getElementById('valdoraV125StoryLoader'))return;
  const script=document.createElement('script');
  script.id='valdoraV125StoryLoader';
  script.src='V125_STORY_FIRST_HOURS.js?v=125-story-1';
  script.async=false;
  (document.head||document.documentElement).appendChild(script);
})();

(function loadValdoraV126(){
  if(document.getElementById('valdoraV126UpdateNotesLoader'))return;
  try{
    const key='valdora_last_seen_update';
    const previous=localStorage.getItem(key)||'';
    window.__valdoraUpdatePreviousSeenV126=previous;
    localStorage.setItem(key,'v118-mobile-5');
  }catch(_){
    try{
      const key='valdora_last_seen_update';
      const previous=sessionStorage.getItem(key)||'';
      window.__valdoraUpdatePreviousSeenV126=previous;
      sessionStorage.setItem(key,'v118-mobile-5');
    }catch(__){}
  }
  const script=document.createElement('script');
  script.id='valdoraV126UpdateNotesLoader';
  script.src='V126_UPDATE_NOTES.js?v=126-notes-1';
  script.async=false;
  (document.head||document.documentElement).appendChild(script);
})();

// V1.0.1 — progression + populations intérieures, sans moteur de PNJ extérieur.
(function loadValdoraV101GameplayFixes(){
  if(document.getElementById('valdoraV101GameplayFixesLoader'))return;
  const script=document.createElement('script');
  script.id='valdoraV101GameplayFixesLoader';
  script.src='VALDORA_V1_0_1_GAMEPLAY_FIXES.js?v=1.0.1-fixes-5';
  script.async=false;
  (document.head||document.documentElement).appendChild(script);
})();

// V1.0.1 — réécriture totale des PNJ extérieurs. Chargée en dernier pour devenir
// l'unique propriétaire du placement, du déplacement, du rendu et des interactions urbaines.
(function loadValdoraTownNpcRewrite(){
  if(document.getElementById('valdoraTownNpcRewriteLoader'))return;
  const script=document.createElement('script');
  script.id='valdoraTownNpcRewriteLoader';
  script.src='VALDORA_TOWN_NPCS_V1_0_1.js?v=1.0.1-town-npcs-2';
  script.async=false;
  (document.head||document.documentElement).appendChild(script);
})();