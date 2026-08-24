(function () {
  'use strict';

  const VERSION = 'V112-BIOMES';
  const MAP_IMAGE = 'assets/v112/world_map_valdora_v112.png';
  const ASSET_PATHS = {
    swimmer: 'assets/v112/swimmer_npc_chibi3d_v112.png',
    playerBuoy: 'assets/v112/player_buoy_chibi3d_v112.png',
    roadside: 'assets/v112/roadside_cluster_chibi3d_v112.png',
    tree: 'assets/v112/tree_chibi3d_v112.png'
  };
  const IMAGES = {};
  for (const [key, src] of Object.entries(ASSET_PATHS)) {
    const image = new Image(); image.decoding = 'async'; image.src = src; IMAGES[key] = image;
  }

  const LOCATIONS = [
    {id:'town0',name:'Clairval',x:13,y:29,theme:'prairie',biome:'Prairies de l’Aube',desc:'Prairies claires, fleurs sauvages et premiers chemins de l’aventure.'},
    {id:'town1',name:'Rochebrune',x:20,y:13,theme:'redrock',biome:'Collines de roche rouge',desc:'Falaises ferrugineuses, pins secs et sentiers taillés dans la pierre.'},
    {id:'town2',name:'Azurive',x:32,y:23,theme:'azure',biome:'Lacs azurés',desc:'Eaux limpides, roseaux bleutés et pontons au milieu des cascades.'},
    {id:'town3',name:'Montfaucon',x:42,y:12,theme:'autumn',biome:'Monts d’automne',desc:'Érables cuivrés, hauteurs rocheuses et vents chargés de feuilles.'},
    {id:'town4',name:'Belrive',x:30,y:43,theme:'river',biome:'Vallée fluviale',desc:'Canaux verts, berges fleuries et vieux ponts de pierre.'},
    {id:'town5',name:'Soléria',x:50,y:44,theme:'solar',biome:'Plaine solaire',desc:'Prairies dorées, jardins chauds et lumière généreuse.'},
    {id:'town6',name:'Nova-Cité',x:21,y:63,theme:'modern',biome:'Métropole boréale',desc:'Architecture claire, énergie bleue et jardins urbains ordonnés.'},
    {id:'town7',name:'Valombre',x:41,y:59,theme:'shadow',biome:'Vallée des ombres',desc:'Cristaux violets, brumes profondes et lumières nocturnes.'},
    {id:'town8',name:'Cimes-d’Or',x:49,y:78,theme:'goldpeaks',biome:'Cimes enneigées d’or',desc:'Pics blancs, minerai doré et lumière froide de haute altitude.'},
    {id:'route_simdor',name:'Simdor',x:40,y:37,theme:'simdor',biome:'Carrefour montagnard',desc:'Ville de montagne au croisement de cinq passages historiques.'},
    {id:'town9',name:'Port-Écume',x:70,y:85,theme:'coast',biome:'Littoral d’Écume',desc:'Plages turquoise, embruns, palmiers et quais blancs.'},
    {id:'town10',name:'Luminor',x:78,y:70,theme:'luminous',biome:'Détroit lumineux',desc:'Eaux scintillantes, îlots clairs et balises solaires.'},
    {id:'town11',name:'Brumelac',x:69,y:57,theme:'mist',biome:'Lac des brumes',desc:'Pins bleutés, nappes de brouillard et eau silencieuse.'},
    {id:'town12',name:'Sylvaris',x:72,y:42,theme:'forest',biome:'Forêt sylvestre',desc:'Canopée émeraude, lianes et clairières anciennes.'},
    {id:'town13',name:'Taronis',x:72,y:24,theme:'industrial',biome:'Bastion industriel',desc:'Métal sombre, lumières ambrées et installations de la Team Taron.'},
    {id:'town14',name:'Aubeval',x:83,y:18,theme:'dawn',biome:'Vallée de l’aurore',desc:'Cerisiers roses, roches claires et horizon baigné d’aube.'}
  ];

  const LINKS = [
    {id:'route0',a:'town0',b:'town1',name:'Route 1',kind:'main',theme:'prairie',as:'east',bs:'west',ra:'west',rb:'east'},
    {id:'route1',a:'town1',b:'town2',name:'Route 2',kind:'main',theme:'redrock',as:'east',bs:'west',ra:'west',rb:'east'},
    {id:'route2',a:'town2',b:'town3',name:'Route 3',kind:'main',theme:'azure',as:'east',bs:'west',ra:'west',rb:'east'},
    {id:'route3',a:'town3',b:'town4',name:'Route 4',kind:'main',theme:'autumn',as:'east',bs:'west',ra:'west',rb:'east'},
    {id:'route4',a:'town4',b:'town5',name:'Route 5',kind:'main',theme:'river',as:'east',bs:'west',ra:'west',rb:'east',ly:-2},
    {id:'route4bis',a:'town4',b:'town5',name:'Route 4 bis — Lac des Reflets',kind:'lake',theme:'lake',as:'south',bs:'south',ra:'west',rb:'east',curve:9,ly:4},
    {id:'route5',a:'town5',b:'town6',name:'Route 6',kind:'main',theme:'solar',as:'east',bs:'west',ra:'west',rb:'east'},
    {id:'route6',a:'town6',b:'town7',name:'Route 7',kind:'main',theme:'shadow',as:'east',bs:'west',ra:'west',rb:'east'},
    {id:'route7',a:'town7',b:'town8',name:'Route des Cimes',kind:'main',theme:'goldpeaks',as:'east',bs:'west',ra:'west',rb:'east',lx:4},
    {id:'route_m1',a:'town8',b:'route_simdor',name:'Sentier des Hauts de Brume',kind:'simdor',theme:'mistpeak',as:'north',bs:'north',ra:'east',rb:'west',lx:-5},
    {id:'route_m2',a:'town3',b:'route_simdor',name:'Corniche de Simdor',kind:'simdor',theme:'simdor',as:'south',bs:'north',ra:'north',rb:'south',lx:5},
    {id:'route_m3',a:'town5',b:'route_simdor',name:'Passe de Soléria',kind:'simdor',theme:'solar',as:'north',bs:'south',ra:'south',rb:'north',ly:-3},
    {id:'route_m4',a:'route_simdor',b:'town6',name:'Col de Nova',kind:'simdor',theme:'modern',as:'east',bs:'north',ra:'west',rb:'east',ly:3},
    {id:'route_m5',a:'route_simdor',b:'town7',name:'Route des Ombres',kind:'simdor',theme:'shadow',as:'west',bs:'east',ra:'east',rb:'west',lx:5},
    {id:'route8',a:'town8',b:'town9',name:'Route du Littoral',kind:'main',theme:'coast',as:'east',bs:'west',ra:'west',rb:'east',ly:-2},
    {id:'route9',a:'town9',b:'town10',name:'Détroit de Luminor',kind:'main',theme:'coast',as:'east',bs:'west',ra:'west',rb:'east',lx:4},
    {id:'route10',a:'town10',b:'town11',name:'Route des Brumes',kind:'main',theme:'mist',as:'east',bs:'west',ra:'west',rb:'east',lx:4},
    {id:'route11',a:'town11',b:'town12',name:'Route Sylvestre',kind:'main',theme:'forest',as:'east',bs:'west',ra:'west',rb:'east',lx:4},
    {id:'route12',a:'town12',b:'town13',name:'Route de Taronis',kind:'main',theme:'industrial',as:'east',bs:'west',ra:'west',rb:'east',lx:5},
    {id:'route13',a:'town13',b:'town14',name:'Route des Aubes',kind:'main',theme:'dawn',as:'east',bs:'west',ra:'west',rb:'east',ly:-3}
  ];

  const LEGEND_TYPES = {
    legend_nature:'Nature', legend_feu:'Feu', legend_eau:'Eau', legend_foudre:'Foudre',
    legend_ombre:'Ombre', legend_roche:'Roche', legend_air:'Air', legend_spore:'Spore',
    legend_glace:'Glace', legend_lumiere:'Lumière', legend_neutre:'Neutre'
  };
  const THEME = {
    prairie:['#76c55f','#d5f3a5'],redrock:['#9e593b','#e7a165'],azure:['#258dc1','#a4eff7'],autumn:['#9b552c','#f0ad49'],
    river:['#3c9f80','#b8e7a4'],solar:['#d7aa31','#ffe49a'],modern:['#4b8fa9','#d5f6ff'],shadow:['#342852','#8b4db5'],
    goldpeaks:['#8aa8bd','#fff0a4'],simdor:['#657784','#d6e0df'],coast:['#168fb2','#9ff2d4'],luminous:['#42a8c4','#fff2aa'],
    mist:['#6d8e9d','#d8edf0'],forest:['#226a46','#9bd278'],industrial:['#5e493f','#e39a43'],dawn:['#c77a84','#ffd5a8'],
    lake:['#217fa9','#7edce8'],mistpeak:['#718899','#d7e6e9'],cosmic:['#30245e','#c387ff']
  };
  const STYLE_ALIAS = {prairie:'prairie',redrock:'mountain',azure:'lake',autumn:'mountain',river:'river',solar:'garden',modern:'modern',shadow:'capital',goldpeaks:'mountain',simdor:'mountain',coast:'harbor',luminous:'island',mist:'lake',forest:'forest',industrial:'industrial',dawn:'prairie',lake:'lake',mistpeak:'mountain',cosmic:'mountain'};

  const target = exit => String(exit?.to || exit?.target || '');
  const esc = value => String(value ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  const creator = () => /CREATEUR/i.test(window.location.pathname);
  const ready = image => !!(image?.complete && image.naturalWidth && image.naturalHeight);
  const place = id => LOCATIONS.find(row => row.id === id);
  const discovered = id => creator() || id === state?.zone || (state?.discovered || []).includes(id);

  function exitRect(scene, side, depth=115, span=190) {
    const width=Number(scene?.width)||1800,height=Number(scene?.height)||1100;
    if(side==='north')return{x:width/2-span/2,y:0,w:span,h:depth,side};
    if(side==='south')return{x:width/2-span/2,y:height-depth,w:span,h:depth,side};
    if(side==='west')return{x:0,y:height/2-span/2,w:depth,h:span,side};
    return{x:width-depth,y:height/2-span/2,w:depth,h:span,side:'east'};
  }
  function upsert(scene,to,label,side,extra={}) {
    if(!scene)return;scene.exits=Array.isArray(scene.exits)?scene.exits:[];
    const index=scene.exits.findIndex(exit=>target(exit)===to),value={...exitRect(scene,side),...extra,to,label,v112Canonical:true};
    if(index>=0)scene.exits[index]={...scene.exits[index],...value};else scene.exits.push(value);
  }
  function canonicalTopology() {
    if(typeof SCENES!=='object'||!SCENES)return;
    const travel=new Set(),allowed=new Map();
    const allow=(a,b)=>{travel.add(a);travel.add(b);if(!allowed.has(a))allowed.set(a,new Set());allowed.get(a).add(b)};
    for(const link of LINKS){allow(link.a,link.id);allow(link.id,link.a);allow(link.b,link.id);allow(link.id,link.b)}
    for(const [id,set] of allowed){const scene=SCENES[id];if(!scene)continue;scene.exits=(scene.exits||[]).filter(exit=>{const to=target(exit);return !travel.has(to)||set.has(to)})}
    for(const link of LINKS){
      const route=SCENES[link.id],a=SCENES[link.a],b=SCENES[link.b];if(!route||!a||!b)continue;
      route.name=link.name;route.kind='route';route.v112Canonical=true;route.exits=(route.exits||[]).filter(exit=>target(exit)===link.a||target(exit)===link.b);
      upsert(route,link.a,place(link.a)?.name||a.name,link.ra);upsert(route,link.b,place(link.b)?.name||b.name,link.rb);
      upsert(a,link.id,link.name,link.as);upsert(b,link.id,link.name,link.bs);
    }
    applyBiomeData();
    if(window.ValdoraWorldV114?.active)window.ValdoraWorldV114.repairTopology({source:'V112'});
  }
  function applyBiomeData() {
    for(const row of LOCATIONS){const scene=SCENES?.[row.id];if(!scene)continue;scene.name=row.name;scene.v112Theme=row.theme;scene.biome=row.theme;scene.v105dStyle=STYLE_ALIAS[row.theme]||scene.v105dStyle}
    for(const link of LINKS){const scene=SCENES?.[link.id];if(!scene)continue;scene.v112Theme=link.theme;scene.biome=link.theme;scene.routeKind=STYLE_ALIAS[link.theme]||link.theme;scene.v105dStyle=STYLE_ALIAS[link.theme]||scene.v105dStyle}
    for(const [zone,type] of Object.entries(LEGEND_TYPES)){const scene=SCENES?.[zone];if(!scene||scene.v116Sanctuary||scene.v117Configured)continue;scene.v112Theme='legend_'+type.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');scene.biome=scene.v112Theme;scene.legendaryType=type;scene.v105dTrees=[]}
    if(SCENES?.route_legends){SCENES.route_legends.v112Theme='cosmic';SCENES.route_legends.biome='cosmic'}
    if(SCENES?.route_horizons){SCENES.route_horizons.v112Theme='dawn';SCENES.route_horizons.biome='dawn'}
  }

  function bookState(){state.v111=state.v111&&typeof state.v111==='object'?state.v111:{};state.v111.book=state.v111.book&&typeof state.v111.book==='object'?state.v111.book:{};return state.v111.book}
  function persist(){try{save(false);hud()}catch(_){}}
  function creatorPreviewZone(zone){
    if(!creator()||!SCENES?.[zone])return false;try{if(typeof enterZone==='function')enterZone(zone)}catch(_){}state.zone=zone;const sceneData=SCENES[zone];state.x=(sceneData.width||3000)/2;state.y=zone==='route4bis'?1180:(sceneData.height||1800)/2;try{scene='world'}catch(_){}for(const id of['title','menuov','starterov','dialog','battleUI']){const element=document.getElementById(id);if(element)element.style.display='none'}try{hud();window.drawWorld?.()}catch(_){}return true
  }
  function connections(id){return LINKS.filter(link=>link.a===id||link.b===id).map(link=>({id:link.id,route:link.name,to:link.a===id?link.b:link.a}))}
  function lineMarkup(link){
    const a=place(link.a),b=place(link.b);if(!a||!b)return'';const mx=(a.x+b.x)/2+(link.lx||0),my=(a.y+b.y)/2+(link.ly||0),klass=link.kind==='lake'?'lake':link.kind==='simdor'?'simdor':'main';
    const path=link.curve?`M ${a.x} ${a.y} Q ${(a.x+b.x)/2} ${(a.y+b.y)/2+link.curve} ${b.x} ${b.y}`:`M ${a.x} ${a.y} L ${b.x} ${b.y}`;
    return `<g class="v112-route ${klass}" data-route="${link.id}"><path d="${path}"/><text x="${mx}" y="${my}">${esc(link.name)}</text></g>`;
  }
  function mapNodes(){const tracked=bookState().trackedZone;return LOCATIONS.map(row=>{const seen=discovered(row.id),current=state.zone===row.id;return `<button class="v112-node ${seen?'':'locked'} ${current?'current':''} ${tracked===row.id?'tracked':''}" style="left:${row.x}%;top:${row.y}%" data-zone="${row.id}"><i>${seen?'':'?'}</i><span>${seen?esc(row.name):'Zone inconnue'}</span></button>`}).join('')}
  function injectMapStyle(){
    if(document.getElementById('v112-style'))return;const style=document.createElement('style');style.id='v112-style';style.textContent=`
      .v112-overlay{position:fixed;inset:0;z-index:90000;background:rgba(3,10,20,.9);backdrop-filter:blur(11px);display:grid;place-items:center;padding:18px;font-family:Inter,Segoe UI,sans-serif;color:#f1fbff}
      .v112-shell{width:min(1410px,98vw);height:min(880px,96vh);border-radius:24px;overflow:hidden;border:1px solid #8beaff77;background:#071a25;box-shadow:0 30px 110px #000c;display:flex;flex-direction:column}
      .v112-head{height:68px;display:flex;align-items:center;padding:0 20px;background:linear-gradient(90deg,#164e68,#122b3b);border-bottom:1px solid #8beaff44}.v112-head h2{margin:0;font-size:22px}.v112-head small{display:block;color:#b9dae5}.v112-head button{margin-left:auto;border:1px solid #a8ebff88;background:#174a60;color:white;border-radius:12px;padding:10px 15px;font-weight:900;cursor:pointer}
      .v112-body{display:grid;grid-template-columns:minmax(0,1fr) 320px;min-height:0;flex:1}.v112-stage{position:relative;overflow:hidden;background:#04121b}.v112-mapimage{width:100%;height:100%;object-fit:cover;display:block}.v112-svg{position:absolute;inset:0;width:100%;height:100%;pointer-events:none}.v112-route path{fill:none;stroke:#ffe099;stroke-width:.55;stroke-linecap:round;stroke-dasharray:1.3 1;filter:drop-shadow(0 0 2px #3a1f00)}.v112-route.simdor path{stroke:#8fe7ff}.v112-route.lake path{stroke:#50d7ff;stroke-width:.8;stroke-dasharray:.6 .7}.v112-route text{display:none}.v112-route.simdor text{fill:#bdf3ff}.v112-route.lake text{fill:#b6f4ff}
      .v112-node{position:absolute;transform:translate(-50%,-50%);background:none;border:0;color:white;text-align:center;cursor:pointer;filter:drop-shadow(0 3px 5px #000)}.v112-node i{display:grid;place-items:center;width:21px;height:21px;margin:auto;border-radius:50%;background:#21aecd;border:3px solid #fff;box-shadow:0 0 0 4px #07566faa,0 0 14px #7bf1ff}.v112-node span{display:block;margin-top:4px;padding:3px 6px;border-radius:7px;background:#061924e8;font-size:10px;font-weight:900;white-space:nowrap}.v112-node.locked i{background:#59666c;box-shadow:none}.v112-node.locked span{display:none}.v112-node.current i{background:#ffe45e;box-shadow:0 0 0 5px #ffaf2688,0 0 22px #fff09a}.v112-node.tracked i{background:#ff625f;animation:v112pulse 1s infinite alternate}.v112-special{position:absolute;transform:translate(-50%,-50%);padding:6px 8px;border-radius:10px;background:#321f57dd;border:1px solid #dfc2ff;color:#fff;font-size:10px;font-weight:900;text-align:center;box-shadow:0 0 18px #a966ff99}.v112-special.citadel{background:#6b3442dd;border-color:#ffd3b3}
      .v112-side{padding:18px;background:linear-gradient(180deg,#0b2836,#071821);overflow:auto}.v112-side h3{font-size:25px;margin:0 0 4px}.v112-biome{display:inline-block;border-radius:20px;padding:5px 10px;background:#ffffff12;border:1px solid #ffffff26;color:#a8edff;font-size:12px;font-weight:900}.v112-side p{line-height:1.5;color:#cfe1e7}.v112-kpi{display:grid;grid-template-columns:1fr 1fr;gap:9px;margin:13px 0}.v112-kpi div{padding:10px;border-radius:12px;background:#ffffff0c;border:1px solid #ffffff17}.v112-kpi b{display:block;font-size:19px;color:#78e7ff}.v112-linklist{display:grid;gap:7px;margin:12px 0}.v112-link{padding:8px 10px;border-radius:10px;background:#ffffff0a;border-left:3px solid #55cfe9;font-size:12px}.v112-link button{float:right;margin-top:-3px;border:1px solid #8de1f066;background:#143d50;color:#fff;border-radius:7px;padding:4px 7px;font-size:10px;font-weight:900;cursor:pointer}.v112-actions{display:grid;gap:8px;margin-top:14px}.v112-actions button{border:1px solid #9be6ff66;background:#174c62;color:white;border-radius:11px;padding:10px 12px;font-weight:900;cursor:pointer}.v112-actions button:hover{background:#26748e}.v112-actions button[disabled]{opacity:.38;cursor:not-allowed}.v112-key{font-size:11px;color:#92adb7;margin-top:14px}
      body:has(#v112-map) #v76routes{display:none!important}
      @keyframes v112pulse{to{transform:scale(1.27);box-shadow:0 0 0 8px #ff6b6544,0 0 25px #ff9b79}}@media(max-width:850px){.v112-body{grid-template-columns:1fr}.v112-side{position:absolute;right:8px;bottom:8px;width:min(310px,82vw);max-height:48%;border-radius:15px}.v112-route text{font-size:2px}}
    `;document.head.appendChild(style)
  }
  function closeMap(){document.getElementById('v112-map')?.remove()}
  function renderSide(root,id){
    const row=place(id)||LOCATIONS[0],side=root.querySelector('.v112-side'),seen=discovered(row.id),tracked=bookState().trackedZone===row.id,links=connections(row.id),canFly=seen&&row.id!==state.zone&&(creator()||state.fly||window.v108mCanUseVolNow?.()),canBus=seen&&/^town\d+$/.test(row.id)&&row.id!==state.zone;
    const lakePreview=creator()&&['town4','town5'].includes(row.id)?'<button data-lake-preview>◉ Aperçu Créateur : Lac des Reflets</button>':'';
    const zonePreview=creator()?`<button data-zone-preview>▶ Aperçu Créateur : ${esc(row.name)}</button>`:'';
    side.innerHTML=`<h3>${seen?esc(row.name):'Territoire inconnu'}</h3><span class="v112-biome">${seen?esc(row.biome):'Biome à découvrir'}</span><p>${seen?esc(row.desc):'Explore les routes adjacentes pour révéler ce territoire.'}</p><div class="v112-kpi"><div><b>${LOCATIONS.filter(x=>discovered(x.id)).length}/${LOCATIONS.length}</b>lieux</div><div><b>${(state.seals||[]).length}/7</b>Sceaux</div></div>${seen?`<div class="v112-linklist">${links.map(link=>`<div class="v112-link"><b>${esc(link.route)}</b>${creator()?`<button data-route-preview="${esc(link.id)}">Aperçu</button>`:''}<br>vers ${esc(place(link.to)?.name||SCENES?.[link.to]?.name||link.to)}</div>`).join('')}</div>`:''}<div class="v112-actions"><button data-track ${seen?'':'disabled'}>${tracked?'✓ Destination suivie':'Suivre cette destination'}</button><button data-bus ${canBus?'':'disabled'}>🚌 Bus régional — 40 V</button><button data-fly ${canFly?'':'disabled'}>✦ Utiliser Vol</button>${zonePreview}${lakePreview}<button data-book>Ouvrir le Livret secret</button></div><div class="v112-key">Ligne dorée : itinéraire principal<br>Ligne bleue : accès à Simdor<br>Ligne cyan : traversée du Lac des Reflets<br>Sélectionnez un lieu pour afficher le nom exact de ses routes.</div>`;
    side.querySelector('[data-track]').onclick=()=>{if(!seen)return;bookState().trackedZone=row.id;persist();openMap(row.id)};
    side.querySelector('[data-bus]').onclick=()=>{if(!canBus)return;root.remove();window.ValdoraProV111?.busTravel?.(row.id)};
    side.querySelector('[data-fly]').onclick=()=>{if(!canFly)return;root.remove();window.flyTo?.(row.id)};
    side.querySelector('[data-book]').onclick=()=>{root.remove();window.ValdoraProV111?.openBook?.()};
    side.querySelectorAll('[data-route-preview]').forEach(button=>button.onclick=()=>{root.remove();creatorPreviewZone(button.dataset.routePreview)});
    const zoneButton=side.querySelector('[data-zone-preview]');if(zoneButton)zoneButton.onclick=()=>{root.remove();creatorPreviewZone(row.id)};
    const preview=side.querySelector('[data-lake-preview]');if(preview)preview.onclick=()=>{root.remove();creatorPreviewZone('route4bis')};
  }
  function renderLegendSide(root){
    const side=root.querySelector('.v112-side'),permit=creator()||!!state.flags?.aubevalExpeditionLicense;
    side.innerHTML=`<h3>Biomes légendaires</h3><span class="v112-biome">Onze sanctuaires thématiques</span><p>Depuis Aubeval, la Route des Horizons mène au Carrefour des Sanctuaires. Chaque biome possède désormais sa propre palette, son atmosphère animée et ses monuments.</p><div class="v112-linklist">${Object.entries(LEGEND_TYPES).map(([zone,type])=>`<div class="v112-link"><b>${esc(type)}</b> — ${esc(SCENES?.[zone]?.name||zone)}${creator()?`<div class="v112-actions"><button data-legend="${zone}">Prévisualiser</button></div>`:''}</div>`).join('')}</div>${!permit?'<p><small>Obtenez le Permis des Horizons à Aubeval pour ouvrir ces expéditions.</small></p>':''}`;
    side.querySelectorAll('[data-legend]').forEach(button=>button.onclick=()=>{root.remove();creatorPreviewZone(button.dataset.legend)});
  }
  function openMap(selected){
    injectMapStyle();document.getElementById('v111-map')?.remove();closeMap();const root=document.createElement('div');root.id='v112-map';root.className='v112-overlay';const current=selected||bookState().trackedZone||state.zone||'town0';
    root.innerHTML=`<div class="v112-shell"><header class="v112-head"><div><h2>Carte vivante de Valdora</h2><small>Réseau canonique V114 — sorties distinctes, routes alignées et accès finaux</small></div><button data-close>Fermer ✕</button></header><div class="v112-body"><section class="v112-stage"><img class="v112-mapimage" src="${MAP_IMAGE}" alt="Nouvelle carte illustrée de Valdora"><svg class="v112-svg" viewBox="0 0 100 100" preserveAspectRatio="none">${LINKS.map(lineMarkup).join('')}<path d="M 83 18 L 92 11" style="stroke:#ffd3b3;stroke-width:.7;stroke-dasharray:1 1"/><path d="M 83 18 Q 91 35 89 64" style="fill:none;stroke:#d6a5ff;stroke-width:.7;stroke-dasharray:1 1"/></svg>${mapNodes()}<div class="v112-special citadel" style="left:92%;top:11%">♥ Citadelle du Cœur</div><button class="v112-special" data-legends style="left:89%;top:64%">✦ Biomes légendaires</button></section><aside class="v112-side"></aside></div></div>`;
    root.querySelector('[data-close]').onclick=()=>root.remove();root.addEventListener('click',event=>{if(event.target===root)root.remove()});root.querySelectorAll('[data-zone]').forEach(button=>button.onclick=()=>renderSide(root,button.dataset.zone));root.querySelector('[data-legends]').onclick=()=>renderLegendSide(root);document.body.appendChild(root);renderSide(root,current);return root
  }

  function rgba(hex,alpha){const value=parseInt(hex.slice(1),16);return`rgba(${value>>16},${value>>8&255},${value&255},${alpha})`}
  function paletteFor(scene){const key=String(scene?.v112Theme||'prairie').replace(/^legend_/,'');const aliases={nature:'forest',feu:'industrial',eau:'azure',foudre:'modern',ombre:'shadow',roche:'redrock',air:'mist',spore:'forest',glace:'goldpeaks',lumiere:'luminous',neutre:'simdor'};return THEME[aliases[key]||key]||THEME.prairie}
  function camera(sceneData){const mw=sceneData.width||1800,mh=sceneData.height||1100;return{camX:Math.max(0,Math.min(Math.max(0,mw-1600),state.x-800)),camY:Math.max(0,Math.min(Math.max(0,mh-1000),state.y-500)),sx:960/1600,sy:600/1000}}
  function tint(sceneData,alpha=.12){const colors=paletteFor(sceneData),gradient=ctx.createLinearGradient(0,0,960,600);gradient.addColorStop(0,rgba(colors[0],alpha));gradient.addColorStop(1,rgba(colors[1],alpha*.72));ctx.fillStyle=gradient;ctx.fillRect(0,0,960,600)}
  function pathPoints(sceneData){
    if(Array.isArray(sceneData.v112Decor))return sceneData.v112Decor;const path=sceneData.v104Path||sceneData.v76Path||[],points=[];
    for(let index=0;index<path.length-1&&points.length<10;index++){const a=path[index],b=path[index+1];if(!Array.isArray(a)||!Array.isArray(b))continue;const dx=b[0]-a[0],dy=b[1]-a[1],length=Math.hypot(dx,dy);if(length<260)continue;const nx=-dy/length,ny=dx/length;
      for(const [j,t] of [[0,.28],[1,.72]]){const side=(index+j)%2?1:-1,off=330+(index%3)*35,x=a[0]+dx*t+nx*off*side,y=a[1]+dy*t+ny*off*side;if(x>210&&y>180&&x<(sceneData.width||3000)-210&&y<(sceneData.height||1800)-180)points.push({x,y,flip:side<0,hue:(index*23+j*41)%80-40,distance:off})}
    }
    sceneData.v112Decor=points;return points
  }
  function drawRoadside(sceneData,camX,camY,sx,sy){
    if(!ready(IMAGES.roadside)||sceneData.legendaryBiome||state.zone==='route4bis'||state.zone==='route_legends')return;for(const item of pathPoints(sceneData)){const x=(item.x-camX)*sx,y=(item.y-camY)*sy,w=330*sx,h=220*sy;if(x<-w||x>960+w||y<-h||y>600+h)continue;ctx.save();ctx.globalAlpha=.94;ctx.filter=`hue-rotate(${item.hue}deg) saturate(.92)`;if(item.flip){ctx.translate(x,y);ctx.scale(-1,1);ctx.drawImage(IMAGES.roadside,-w/2,-h*.86,w,h)}else ctx.drawImage(IMAGES.roadside,x-w/2,y-h*.86,w,h);ctx.restore()}
  }
  function softShadow(x,y,w){ctx.fillStyle='rgba(0,0,0,.2)';ctx.beginPath();ctx.ellipse(x,y,w,.24*w,0,0,Math.PI*2);ctx.fill()}
  function legendaryProp(type,x,y,s,index){
    ctx.save();ctx.translate(x,y);ctx.scale(s,s);ctx.shadowBlur=16;ctx.shadowColor='rgba(0,0,0,.35)';softShadow(0,18,35);
    if(type==='Nature'){ctx.fillStyle='#71502d';ctx.fillRect(-7,-45,14,64);ctx.fillStyle='#3ca257';for(const p of[[-20,-42,22],[18,-38,23],[0,-62,27]]){ctx.beginPath();ctx.arc(p[0],p[1],p[2],0,Math.PI*2);ctx.fill()}ctx.fillStyle='#b7f56b';ctx.beginPath();ctx.arc(-8,-67,8,0,Math.PI*2);ctx.fill()}
    else if(type==='Feu'){ctx.fillStyle='#4b2928';ctx.beginPath();ctx.moveTo(-40,18);ctx.lineTo(0,-58);ctx.lineTo(42,18);ctx.closePath();ctx.fill();ctx.fillStyle='#ff692e';ctx.beginPath();ctx.moveTo(-12,17);ctx.lineTo(1,-30);ctx.lineTo(13,17);ctx.fill();ctx.fillStyle='#ffd05a';ctx.beginPath();ctx.arc(0,-40,9,0,Math.PI*2);ctx.fill()}
    else if(type==='Eau'){ctx.strokeStyle='#54d9ed';ctx.lineWidth=9;for(const r of[-22,0,22]){ctx.beginPath();ctx.moveTo(r,16);ctx.quadraticCurveTo(r-8,-25,r+4,-52);ctx.stroke()}ctx.fillStyle='#ff8fb0';for(const p of[[-25,-18],[8,-42],[24,-12]]){ctx.beginPath();ctx.arc(p[0],p[1],7,0,Math.PI*2);ctx.fill()}}
    else if(type==='Foudre'){ctx.fillStyle='#596879';for(const p of[[-20,-30,24],[8,-37,28],[26,-25,20]]){ctx.beginPath();ctx.arc(p[0],p[1],p[2],0,Math.PI*2);ctx.fill()}ctx.fillStyle='#ffe45d';ctx.beginPath();ctx.moveTo(2,-26);ctx.lineTo(-13,6);ctx.lineTo(0,3);ctx.lineTo(-8,33);ctx.lineTo(21,-7);ctx.lineTo(6,-4);ctx.closePath();ctx.fill()}
    else if(type==='Ombre'){ctx.fillStyle='#26203a';ctx.fillRect(-30,-45,60,63);ctx.fillStyle='#7b41ae';for(let i=0;i<3;i++){ctx.beginPath();ctx.arc(-18+i*18,-27+i%2*18,7,0,Math.PI*2);ctx.fill()}ctx.strokeStyle='#d278ff';ctx.lineWidth=4;ctx.strokeRect(-24,-39,48,49)}
    else if(type==='Roche'){ctx.fillStyle='#9a704d';ctx.beginPath();ctx.moveTo(-28,18);ctx.lineTo(-18,-58);ctx.lineTo(8,-73);ctx.lineTo(31,-34);ctx.lineTo(24,18);ctx.closePath();ctx.fill();ctx.strokeStyle='#e4bc74';ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(-13,-40);ctx.lineTo(13,-24);ctx.lineTo(-4,4);ctx.stroke()}
    else if(type==='Air'){ctx.fillStyle='#6c8192';ctx.beginPath();ctx.moveTo(-28,5);ctx.lineTo(-8,-32);ctx.lineTo(25,-20);ctx.lineTo(36,8);ctx.closePath();ctx.fill();ctx.fillStyle='#e9f7ff';for(const p of[[-22,-44,18],[2,-50,24],[28,-43,16]]){ctx.beginPath();ctx.arc(p[0],p[1],p[2],0,Math.PI*2);ctx.fill()}}
    else if(type==='Spore'){ctx.fillStyle='#ead3a2';ctx.fillRect(-7,-25,14,43);ctx.fillStyle='#9a53c7';ctx.beginPath();ctx.arc(0,-28,30,Math.PI,0);ctx.fill();ctx.fillStyle='#76f1ca';for(const p of[[-13,-37],[4,-44],[15,-29]]){ctx.beginPath();ctx.arc(p[0],p[1],4,0,Math.PI*2);ctx.fill()}}
    else if(type==='Glace'){ctx.fillStyle='#a9ecff';ctx.beginPath();ctx.moveTo(-30,18);ctx.lineTo(-15,-50);ctx.lineTo(0,18);ctx.moveTo(-4,18);ctx.lineTo(13,-72);ctx.lineTo(30,18);ctx.fill();ctx.strokeStyle='#f5ffff';ctx.lineWidth=3;ctx.stroke()}
    else if(type==='Lumière'){ctx.strokeStyle='#ffe88b';ctx.lineWidth=5;for(let a=0;a<Math.PI*2;a+=Math.PI/4){ctx.beginPath();ctx.moveTo(Math.cos(a)*24,-35+Math.sin(a)*24);ctx.lineTo(Math.cos(a)*42,-35+Math.sin(a)*42);ctx.stroke()}ctx.fillStyle='#fff2a5';ctx.beginPath();ctx.arc(0,-35,23,0,Math.PI*2);ctx.fill();ctx.fillStyle='#d7ba67';ctx.fillRect(-7,-10,14,29)}
    else{ctx.strokeStyle='#d9d2c6';ctx.lineWidth=9;ctx.beginPath();ctx.arc(0,-18,31,0,Math.PI*2);ctx.stroke();ctx.strokeStyle=['#76d8ff','#ffca70','#a2ef8b'][index%3];ctx.lineWidth=4;ctx.beginPath();ctx.arc(0,-18,20,0,Math.PI*2);ctx.stroke();ctx.fillStyle='#716d69';ctx.fillRect(-6,5,12,14)}
    ctx.restore()
  }
  function drawLegendary(sceneData,camX,camY,sx,sy){
    const type=sceneData.legendaryType||LEGEND_TYPES[state.zone]||'Neutre',positions=[[.34,.31],[.66,.29],[.36,.72],[.64,.74]];ctx.save();ctx.globalCompositeOperation='color';tint(sceneData,.68);ctx.globalCompositeOperation='source-over';tint(sceneData,.2);positions.forEach((p,index)=>{const wx=(sceneData.width||3000)*p[0],wy=(sceneData.height||1800)*p[1],x=(wx-camX)*sx,y=(wy-camY)*sy;if(x>-100&&x<1060&&y>-100&&y<700)legendaryProp(type,x,y,1.02+index*.07,index)});if(ready(IMAGES.roadside)&&(type==='Nature'||type==='Spore')){for(const [index,p] of [[.28,.42],[.72,.57]].entries()){const x=((sceneData.width||3000)*p[0]-camX)*sx,y=((sceneData.height||1800)*p[1]-camY)*sy,w=300*sx,h=205*sy;if(x>-w&&x<960+w&&y>-h&&y<600+h){ctx.save();ctx.globalAlpha=.92;ctx.filter=type==='Spore'?'hue-rotate(55deg) saturate(1.25)':'saturate(1.08)';if(index){ctx.translate(x,y);ctx.scale(-1,1);ctx.drawImage(IMAGES.roadside,-w/2,-h*.85,w,h)}else ctx.drawImage(IMAGES.roadside,x-w/2,y-h*.85,w,h);ctx.restore()}}}ctx.restore()
  }
  function routeEnhancement(sceneData,camX,camY,sx,sy){if(document.documentElement.dataset.valdoraV115&&sceneData.legendaryBiome)return;ctx.save();tint(sceneData,sceneData.legendaryBiome?.2:.095);if(sceneData.legendaryBiome)drawLegendary(sceneData,camX,camY,sx,sy);else drawRoadside(sceneData,camX,camY,sx,sy);ctx.restore()}
  function drawMotes(sceneData){
    const key=String(sceneData.v112Theme||''),colors=paletteFor(sceneData),time=Date.now()/1000;ctx.save();ctx.globalAlpha=.5;
    if(key==='coast'||key==='azure'||key==='river'||key==='lake'||key==='luminous'){ctx.strokeStyle=rgba(colors[1],.5);ctx.lineWidth=2;for(let y=430;y<620;y+=38){ctx.beginPath();for(let x=-20;x<1000;x+=28)ctx.lineTo(x,y+Math.sin(x*.035+time+y)*4);ctx.stroke()}}
    else if(key==='mist'||key==='mistpeak'||key==='simdor'){ctx.fillStyle='rgba(226,244,248,.13)';for(let i=0;i<5;i++){const y=95+i*105+Math.sin(time*.3+i)*18;ctx.beginPath();ctx.ellipse(480+Math.sin(i*7)*250,y,360,42,0,0,Math.PI*2);ctx.fill()}}
    else if(key==='shadow'){ctx.fillStyle='rgba(195,101,255,.28)';for(let i=0;i<18;i++){const x=(i*137+time*18)%1000,y=80+(i*83)%480;ctx.beginPath();ctx.arc(x,y,2+i%3,0,Math.PI*2);ctx.fill()}}
    else if(key==='goldpeaks'||key==='modern'){ctx.fillStyle='rgba(240,252,255,.65)';for(let i=0;i<25;i++){const x=(i*97+time*11)%980,y=(i*61+time*19)%600;ctx.beginPath();ctx.arc(x,y,1.4+i%2,0,Math.PI*2);ctx.fill()}}
    else if(key==='industrial'){ctx.fillStyle='rgba(255,166,69,.52)';for(let i=0;i<16;i++){const x=(i*163)%960,y=560-((time*28+i*47)%480);ctx.beginPath();ctx.arc(x,y,2+i%2,0,Math.PI*2);ctx.fill()}}
    else if(key==='dawn'){const g=ctx.createLinearGradient(960,0,500,600);g.addColorStop(0,'rgba(255,218,167,.22)');g.addColorStop(1,'rgba(255,190,209,0)');ctx.fillStyle=g;ctx.fillRect(0,0,960,600)}
    else{ctx.fillStyle=rgba(colors[1],.4);for(let i=0;i<18;i++){const x=(i*149+Math.sin(time+i)*35)%980,y=(i*79+time*9)%590;ctx.beginPath();ctx.arc(x,y,1.5+i%3,0,Math.PI*2);ctx.fill()}}
    ctx.restore()
  }
  function drawLakeBackdrop(sceneData){
    if(state.zone!=='route4bis')return;const {camX,camY,sx,sy}=camera(sceneData),time=Date.now()/900;
    const water=ctx.createLinearGradient(0,0,0,600);water.addColorStop(0,'#72d9e5');water.addColorStop(.48,'#35abc8');water.addColorStop(1,'#176e9e');ctx.fillStyle=water;ctx.fillRect(0,0,960,600);
    ctx.save();ctx.globalAlpha=.42;ctx.strokeStyle='#d9fbff';ctx.lineWidth=2;for(let wy=Math.floor(camY/95)*95;wy<camY+1100;wy+=95){ctx.beginPath();for(let wx=Math.floor(camX/70)*70;wx<camX+1700;wx+=70){const x=(wx-camX)*sx,y=(wy-camY)*sy+Math.sin(wx*.008+time+wy*.004)*5;if(wx===Math.floor(camX/70)*70)ctx.moveTo(x,y);else ctx.lineTo(x,y)}ctx.stroke()}ctx.restore();
    for(const dock of [{x:0,y:760,w:280,h:300},{x:3320,y:760,w:280,h:300}]){const x=(dock.x-camX)*sx,y=(dock.y-camY)*sy,w=dock.w*sx,h=dock.h*sy;if(x>980||x+w<-20)continue;ctx.fillStyle='#70513a';ctx.fillRect(x,y,w,h);ctx.strokeStyle='#cfad75';ctx.lineWidth=4;for(let px=x+12;px<x+w;px+=25){ctx.beginPath();ctx.moveTo(px,y);ctx.lineTo(px,y+h);ctx.stroke()}ctx.fillStyle='#3d2b21';for(const py of[y+8,y+h-14])ctx.fillRect(x-7,py,w+14,8)}
    const pads=[[280,530],[610,1270],[980,430],[1340,1430],[1760,560],[2170,1340],[2600,480],[3030,1260],[3370,570]];for(const [wx,wy] of pads){const x=(wx-camX)*sx,y=(wy-camY)*sy;if(x<-30||x>990||y<-20||y>620)continue;ctx.fillStyle='#288a72';ctx.beginPath();ctx.ellipse(x,y,18,10,-.3,0,Math.PI*2);ctx.fill();ctx.fillStyle='#ffd1eb';ctx.beginPath();ctx.arc(x+5,y-5,4,0,Math.PI*2);ctx.fill()}
    const buoys=[[430,900],[920,820],[1450,1030],[2010,760],[2520,1010],[3080,860]];for(const [wx,wy] of buoys){const x=(wx-camX)*sx,y=(wy-camY)*sy;if(x<-20||x>980||y<-20||y>620)continue;ctx.strokeStyle='rgba(255,255,255,.55)';ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(x,y+5,15,5,0,0,Math.PI*2);ctx.stroke();ctx.fillStyle='#f6b83f';ctx.beginPath();ctx.arc(x,y,7,0,Math.PI*2);ctx.fill();ctx.fillStyle='#fff';ctx.fillRect(x-2,y-7,4,7)}
    const shade=ctx.createRadialGradient(480,300,130,480,300,590);shade.addColorStop(0,'rgba(255,255,255,.04)');shade.addColorStop(1,'rgba(1,31,62,.24)');ctx.fillStyle=shade;ctx.fillRect(0,0,960,600)
  }
  function drawLakeSprites(sceneData){
    if(state.zone!=='route4bis'||scene!=='world')return;const {camX,camY,sx,sy}=camera(sceneData),time=Date.now()/650;
    const residents=(NPCDATA||[]).filter(n=>n.zone==='route4bis'&&n.swimmerV109O),trainers=(sceneData.trainers||[]).filter(n=>n.swimmer),swimmers=[...residents,...trainers];
    for(const [index,npc] of swimmers.entries()){const x=(npc.x-camX)*sx,y=(npc.y-camY)*sy+Math.sin(time+index)*2;if(x<-80||x>1040||y<-100||y>690)continue;ctx.save();ctx.strokeStyle='rgba(225,252,255,.82)';ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(x,y+11,45,9,0,0,Math.PI*2);ctx.stroke();if(ready(IMAGES.swimmer)){ctx.filter=`hue-rotate(${index*39}deg) saturate(${.88+(index%3)*.12})`;ctx.drawImage(IMAGES.swimmer,x-48,y-72,96,96)}ctx.restore()}
    const x=(state.x-camX)*sx,y=(state.y-camY)*sy+Math.sin(time)*2;ctx.save();ctx.strokeStyle='rgba(255,255,255,.9)';ctx.lineWidth=3;ctx.beginPath();ctx.ellipse(x,y+13,53,10,0,0,Math.PI*2);ctx.stroke();if(ready(IMAGES.playerBuoy))ctx.drawImage(IMAGES.playerBuoy,x-59,y-88,118,118);ctx.restore()
  }
  function drawTreeOverlays(sceneData){
    if(!ready(IMAGES.tree)||sceneData.legendaryType)return;const {camX,camY,sx,sy}=camera(sceneData),theme=String(sceneData.v112Theme||'');for(const item of sceneData.v105dTrees||[]){const x=(item.x-camX)*sx,y=(item.y-camY)*sy,s=(item.s||1)*sx;if(x<-100||x>1060||y<-140||y>710)continue;ctx.save();if(theme==='autumn')ctx.filter='hue-rotate(300deg) saturate(1.15)';else if(theme==='shadow')ctx.filter='hue-rotate(65deg) brightness(.72) saturate(1.1)';else if(theme==='mist'||theme==='goldpeaks'||theme==='modern')ctx.filter='hue-rotate(35deg) saturate(.72) brightness(1.08)';else if(theme==='redrock'||theme==='industrial')ctx.filter='hue-rotate(325deg) saturate(.82)';ctx.shadowColor='rgba(14,45,28,.3)';ctx.shadowBlur=6;ctx.drawImage(IMAGES.tree,x-58*s,y-100*s,116*s,124*s);ctx.restore()}
  }
  function drawCoastline(sceneData){
    if(sceneData.kind!=='town'||sceneData.v112Theme!=='coast')return;const time=Date.now()/1000,shore=470;
    ctx.save();ctx.fillStyle='#d5b372';ctx.fillRect(0,shore-16,960,42);ctx.fillStyle='#f2d28d';ctx.beginPath();ctx.moveTo(0,shore);for(let x=0;x<=960;x+=48)ctx.lineTo(x,shore+8+Math.sin(x*.024)*7);ctx.lineTo(960,532);ctx.lineTo(0,532);ctx.closePath();ctx.fill();
    const sea=ctx.createLinearGradient(0,510,0,600);sea.addColorStop(0,'#54d6d0');sea.addColorStop(1,'#178aa8');ctx.fillStyle=sea;ctx.fillRect(0,510,960,90);ctx.strokeStyle='rgba(239,255,250,.8)';ctx.lineWidth=3;for(let y=522;y<596;y+=24){ctx.beginPath();for(let x=-30;x<1000;x+=24){const py=y+Math.sin(x*.035+time*1.8+y)*3;if(x===-30)ctx.moveTo(x,py);else ctx.lineTo(x,py)}ctx.stroke()}
    ctx.fillStyle='#9b6a3d';ctx.fillRect(0,443,960,14);ctx.fillStyle='#e0c28b';for(let x=10;x<960;x+=42)ctx.fillRect(x,443,4,14);
    for(const [x,color] of [[105,'#ff6e62'],[805,'#56a8ef']]){ctx.fillStyle='#9b6a3d';ctx.fillRect(x-2,474,4,36);ctx.fillStyle=color;ctx.beginPath();ctx.moveTo(x,470);ctx.lineTo(x-36,489);ctx.lineTo(x+36,489);ctx.closePath();ctx.fill();ctx.fillStyle='#fff';ctx.beginPath();ctx.moveTo(x,470);ctx.lineTo(x,489);ctx.lineTo(x+18,489);ctx.closePath();ctx.fill()}
    for(const [x,y] of [[245,493],[680,486]]){ctx.strokeStyle='#8e6f4c';ctx.lineWidth=4;ctx.beginPath();ctx.arc(x,y,11,.25,Math.PI*1.75);ctx.stroke();ctx.fillStyle='#fff0cb';ctx.beginPath();ctx.arc(x+4,y-2,3,0,Math.PI*2);ctx.fill()}ctx.restore()
  }
  function worldOverlay(){if(window.ValdoraPolishV113?.active)return window.ValdoraPolishV113.overlay();if(typeof scene!=='undefined'&&scene!=='world')return;const sceneData=typeof currentScene==='function'?currentScene():SCENES?.[state.zone];if(!sceneData)return;ctx.save();if(state.zone==='route4bis')drawLakeBackdrop(sceneData);else{if(sceneData.kind==='town')tint(sceneData,.075);drawMotes(sceneData);drawTreeOverlays(sceneData);drawCoastline(sceneData)}drawLakeSprites(sceneData);ctx.restore()}

  function hookRouteDrawing(){
    let current=null;try{current=window.drawRouteObjectsV93||drawRouteObjectsV93}catch(_){}if(typeof current!=='function'||current.__v112Route)return;const base=current;
    const wrapped=function(sceneData,camX,camY,sx,sy){base.apply(this,arguments);try{routeEnhancement(sceneData,camX,camY,sx,sy)}catch(error){console.warn('V112 décor de route',error)}};wrapped.__v112Route=true;window.drawRouteObjectsV93=wrapped;try{drawRouteObjectsV93=wrapped}catch(_){}
  }
  function hookWorldDrawing(){
    let current=null;try{current=window.drawWorld||drawWorld}catch(_){}if(typeof current!=='function'||current.__v112World)return;const base=current;
    const wrapped=function(){base.apply(this,arguments);try{worldOverlay()}catch(error){console.warn('V112 ambiance',error)}};wrapped.__v112World=true;wrapped.__v107dDraw=true;window.drawWorld=wrapped;try{drawWorld=wrapped}catch(_){}
  }
  function hookHero(){
    let current=null;try{current=window.drawHero||drawHero}catch(_){}if(typeof current!=='function'||current.__v112Hero)return;const base=current;
    const wrapped=function(){if(state?.zone!=='route4bis')return base.apply(this,arguments);const bike=state.bike;state.bike=false;try{return base.apply(this,arguments)}finally{state.bike=bike}};wrapped.__v112Hero=true;window.drawHero=wrapped;try{drawHero=wrapped}catch(_){}
  }
  function hookTrees(){
    let current=null;try{current=window.tree||tree}catch(_){}if(typeof current!=='function'||current.__v112Tree)return;const base=current;
    const wrapped=function(item,camX,camY,sx,sy){if(!ready(IMAGES.tree))return base.apply(this,arguments);const x=(item.x-camX)*sx,y=(item.y-camY)*sy,s=(item.s||1)*sx;if(x<-100||x>1060||y<-140||y>710)return;const theme=String(SCENES?.[state.zone]?.v112Theme||'');ctx.save();if(theme==='autumn')ctx.filter='hue-rotate(300deg) saturate(1.15)';else if(theme==='shadow')ctx.filter='hue-rotate(65deg) brightness(.72) saturate(1.1)';else if(theme==='mist'||theme==='goldpeaks'||theme==='modern')ctx.filter='hue-rotate(35deg) saturate(.72) brightness(1.08)';else if(theme==='redrock'||theme==='industrial')ctx.filter='hue-rotate(325deg) saturate(.82)';ctx.shadowColor='rgba(14,45,28,.3)';ctx.shadowBlur=6;ctx.drawImage(IMAGES.tree,x-58*s,y-100*s,116*s,124*s);ctx.restore()};wrapped.__v112Tree=true;window.tree=wrapped;try{tree=wrapped}catch(_){}
  }
  function hookCreatorNavigation(){if(!creator())return;window.creatorTeleportZoneV105N=creatorPreviewZone;try{creatorTeleportZoneV105N=creatorPreviewZone}catch(_){}}
  function hookCreatorNavigationClicks(){if(!creator()||document.documentElement.dataset.v112CreatorClicks==='1')return;document.documentElement.dataset.v112CreatorClicks='1';document.addEventListener('click',event=>{const button=event.target?.closest?.('button[onclick*="creatorTeleportZoneV105N"]');if(!button)return;const match=String(button.getAttribute('onclick')||'').match(/creatorTeleportZoneV105N\(['"]([^'"]+)['"]\)/);if(!match)return;event.preventDefault();event.stopImmediatePropagation();creatorPreviewZone(match[1])},true)}
  function installButton(){const button=document.getElementById('v111MapBtn');if(!button)return;const final=window.ValdoraWorldV117||window.ValdoraWorldV116,version=document.documentElement.dataset.valdoraPolish,label=final?.active?'Carte du monde V117':version==='V115-BIOMES-AUDIO'?'Carte du monde V115':version==='V114-ROUTES-BIOMES'?'Carte du monde V114':version==='V113-POLISH'?'Carte du monde V113':'Carte du monde V112';if(button.textContent!==label)button.textContent=label;button.onclick=()=>openMap()}
  function enforceIdentity(){const final=window.ValdoraWorldV117||window.ValdoraWorldV116;if(final?.active)return final.enforceIdentity?.();if(document.documentElement.dataset.valdoraPolish==='V113-POLISH')return window.ValdoraPolishV113?.enforceIdentity?.();const title='Éclats Sauvages — Valdora V112 Biomes';if(document.title!==title)document.title=title;const brand=document.querySelector('.brand'),label=`ÉCLATS SAUVAGES — VALDORA V112 BIOMES — ${creator()?'CRÉATEUR':'JOUEUR'}`;if(brand&&brand.textContent!==label)brand.textContent=label;document.documentElement.dataset.valdoraVersion=VERSION}
  function audit(){
    const issues=[],travel=new Set();for(const link of LINKS){travel.add(link.a);travel.add(link.b);travel.add(link.id);const route=SCENES?.[link.id],a=SCENES?.[link.a],b=SCENES?.[link.b];if(!route)issues.push(`${link.id}: route absente`);else{const exits=(route.exits||[]).map(target);if(exits.length!==2||!exits.includes(link.a)||!exits.includes(link.b))issues.push(`${link.id}: extrémités invalides`)}if(!a?.exits?.some(exit=>target(exit)===link.id))issues.push(`${link.a} -> ${link.id}: accès absent`);if(!b?.exits?.some(exit=>target(exit)===link.id))issues.push(`${link.b} -> ${link.id}: accès absent`)}
    const wrong=[['town3','route_m1'],['town3','route_m5'],['town11','route_m1']];for(const [from,to] of wrong)if(SCENES?.[from]?.exits?.some(exit=>target(exit)===to)||SCENES?.[to]?.exits?.some(exit=>target(exit)===from))issues.push(`${from} <-> ${to}: ancien raccord fantôme`);
    for(const [zone,type] of Object.entries(LEGEND_TYPES))if(!SCENES?.[zone]||SCENES[zone].legendaryType!==type||!String(SCENES[zone].v112Theme).startsWith('legend_'))issues.push(`${zone}: ambiance ${type} absente`);
    const lakeNPC=(typeof NPCDATA!=='undefined'?NPCDATA:[]).filter(n=>n.zone==='route4bis'&&n.swimmerV109O).length;
    const core={scenes:Object.keys(SCENES||{}).length,creatures:(typeof CREATURES!=='undefined'?CREATURES:[]).length,moves:typeof MOVE_DB!=='undefined'?Object.keys(MOVE_DB||{}).length:0,save:typeof save==='function',load:typeof load==='function'||typeof loadGame==='function',battle:typeof startBattle==='function',codex:!!document.getElementById('dexBtn')||!!document.getElementById('dexov')};
    const systems={movement:typeof window.collision==='function',interaction:typeof window.interact==='function',shop:typeof window.openShop==='function',healing:typeof window.startHealingSequence==='function',objectives:typeof window.openObjectivesV84==='function',bag:typeof window.openBag==='function',pc:typeof window.openPC==='function',saveFile:typeof window.ValdoraSaveV108A?.saveAsNow==='function'&&typeof window.ValdoraSaveV108A?.loadFile==='function',transport:typeof window.ValdoraProV111?.playTransport==='function',secretBook:typeof window.ValdoraProV111?.openBook==='function'};
    for(const [name,ok] of Object.entries(systems))if(!ok)issues.push(`système ${name} indisponible`);
    return{version:VERSION,ok:issues.length===0,issues,locations:LOCATIONS.length,routes:LINKS.length,legendaryBiomes:Object.keys(LEGEND_TYPES).length,lakeNPC,lakeTrainers:(SCENES?.route4bis?.trainers||[]).filter(n=>n.swimmer).length,core,systems,assets:{map:MAP_IMAGE,swimmer:ready(IMAGES.swimmer),playerBuoy:ready(IMAGES.playerBuoy),roadside:ready(IMAGES.roadside),tree:ready(IMAGES.tree)},hooks:{world:!!window.drawWorld?.__v112World,route:!!window.drawRouteObjectsV93?.__v112Route,hero:!!window.drawHero?.__v112Hero,treeOverlay:ready(IMAGES.tree),creatorNavigation:!creator()||window.creatorTeleportZoneV105N===creatorPreviewZone}}
  }
  function publishAudit(){try{document.documentElement.dataset.valdoraV112Audit=JSON.stringify(audit())}catch(_){}}
  function install(){canonicalTopology();injectMapStyle();hookRouteDrawing();hookWorldDrawing();hookHero();hookTrees();hookCreatorNavigation();hookCreatorNavigationClicks();installButton();enforceIdentity();window.ValdoraProV112={version:VERSION,locations:LOCATIONS,links:LINKS,openMap,previewZone:creatorPreviewZone,repair:canonicalTopology,audit};document.documentElement.dataset.valdoraBiomes=VERSION;publishAudit()}

  install();if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install);[900,3200,7800,10800,13300,14900].forEach(delay=>setTimeout(install,delay));setInterval(()=>{try{canonicalTopology();installButton();enforceIdentity();publishAudit()}catch(_){}},2800);
})();
