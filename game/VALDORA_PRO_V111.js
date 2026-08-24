(function () {
  'use strict';

  const VERSION = 'V111-PRO';
  const MAP_IMAGE = 'assets/world_map_valdora_v111.png';
  const BUS_IMAGE = 'assets/transport/bus_fluo_val_d_ora_officiel_v107i.png';
  const TOWNS = [
    ['town0','Clairval',49,48],['town1','Rochebrune',38,43],['town2','Azurive',55,39],
    ['town3','Montfaucon',28,31],['town4','Belrive',46,62],['town5','Soléria',37,74],
    ['town6','Nova-Cité',65,48],['town7','Valombre',77,46],['town8','Cimes-d’Or',51,15],
    ['town9','Port-Écume',25,74],['town10','Luminor',55,58],['town11','Brumelac',61,31],
    ['town12','Sylvaris',84,24],['town13','Taronis',70,62],['town14','Aubeval',82,72]
  ];
  const ROUTE_CHAIN = TOWNS.slice(0, -1).map((town, index) => [town[0], TOWNS[index + 1][0], `route${index}`]);
  const DOSSIERS = [
    {id:'egg',icon:'◉',title:'L’œuf inconnu',subtitle:'Signatures environnementales',zones:['town2','town4','town6'],
      intro:'Un œuf ancien réagit à l’eau, à la roche et au froid. Les relevés de terrain permettent de trianguler son origine.',
      ready:s=>s.egg?.status==='done',progress:s=>Math.min(3,s.egg?.zones?.length||0),goal:3,reward:{MegaOrbe:1},rewardText:'1 Méga Orbe d’analyse'},
    {id:'archives',icon:'▤',title:'Les archives disparues',subtitle:'Témoignages recoupés',zones:['town1','town3','town5'],
      intro:'Une page du Projet Résonance a été volée. Trois témoignages indépendants doivent être comparés avant toute conclusion.',
      ready:s=>s.archives?.status==='done',progress:s=>Math.min(3,s.archives?.witnesses?.length||0),goal:3,reward:{money:900},rewardText:'900 Voltrons'},
    {id:'inscriptions',icon:'⌁',title:'Les sept inscriptions',subtitle:'Alphabet des anciens Gardiens',zones:['town1','town2','town3','town4','town5','town6','town7'],
      intro:'Sept inscriptions décrivent un itinéraire invisible. Chaque relevé ajoute un symbole au calque de la carte.',
      ready:s=>(s.inscriptions?.length||0)>=7,progress:s=>Math.min(7,s.inscriptions?.length||0),goal:7,reward:{SuperOrbe:3},rewardText:'3 Super Orbes'},
    {id:'fragments',icon:'✦',title:'Le message incomplet',subtitle:'Transmission Résonance',zones:['route2','route5','route8','route11'],
      intro:'Quatre fragments radio forment une instruction. Le Livret place automatiquement les zones non fouillées sur la carte.',
      ready:s=>(s.fragments?.length||0)>=4,progress:s=>Math.min(4,s.fragments?.length||0),goal:4,reward:{SuperPotion:3},rewardText:'3 Super Potions'},
    {id:'taron',icon:'⚠',title:'Le convoi perdu',subtitle:'Opération Team Taron',zones:['route5'],
      intro:'Un convoi transporte du matériel de Résonance. Son dernier signal provient de la Route 6.',
      ready:()=>{try{return !!zOpState('convoi_resonance')?.done}catch(_){return false}},progress:()=>{try{return zOpState('convoi_resonance')?.done?1:0}catch(_){return 0}},goal:1,reward:{Antidote:3,money:600},rewardText:'600 Voltrons et 3 Antidotes'},
    {id:'mastery',icon:'◆',title:'Maîtrise de Valdora',subtitle:'Synthèse finale',zones:['town14','route_horizons','route_legends'],
      intro:'La synthèse relie les Sceaux, les légendaires et le réseau de transport. Elle révèle les accès finaux sans supprimer les épreuves.',
      ready:()=>DOSSIERS.slice(0,5).every(d=>book().claimed[d.id]),progress:()=>DOSSIERS.slice(0,5).filter(d=>book().claimed[d.id]).length,goal:5,reward:{MegaOrbe:2,money:1500},rewardText:'1 500 Voltrons et 2 Méga Orbes'}
  ];

  function esc(value) { return String(value ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
  function creator() { return /CREATEUR/i.test(location.pathname); }
  function discovered(zone) { return creator() || (state?.discovered || []).includes(zone); }
  function book() {
    state.v111 = state.v111 && typeof state.v111 === 'object' ? state.v111 : {};
    state.v111.book = state.v111.book && typeof state.v111.book === 'object' ? state.v111.book : {};
    const value = state.v111.book;
    value.claimed = value.claimed && typeof value.claimed === 'object' ? value.claimed : {};
    value.opened = value.opened && typeof value.opened === 'object' ? value.opened : {};
    return value;
  }
  function legacy() {
    try { return typeof v109aState === 'function' ? v109aState() : (state.v109a || {}); }
    catch (_) { return state.v109a || {}; }
  }
  function unlocked() {
    if (creator()) return true;
    const old = legacy();
    return !!old.livret?.unlocked && (state.seals || []).length >= 3;
  }
  function persist() { try { save(false); hud(); } catch (_) {} }
  function toastSafe(text) { try { toast(text); } catch (_) {} }
  function close(id) { document.getElementById(id)?.remove(); }

  function injectStyle() {
    if (document.getElementById('v111-style')) return;
    const style = document.createElement('style'); style.id = 'v111-style';
    style.textContent = `
      .v111-overlay{position:fixed;inset:0;z-index:12000;background:rgba(4,13,25,.88);backdrop-filter:blur(10px);display:grid;place-items:center;padding:22px;font-family:Inter,Segoe UI,sans-serif;color:#eef8ff}
      .v111-shell{width:min(1320px,96vw);height:min(820px,94vh);background:linear-gradient(145deg,#102c3b,#071923 72%);border:1px solid rgba(130,220,255,.35);border-radius:24px;box-shadow:0 30px 100px #000b;overflow:hidden;display:flex;flex-direction:column}
      .v111-head{height:68px;display:flex;align-items:center;gap:14px;padding:0 20px;background:linear-gradient(90deg,rgba(23,76,98,.96),rgba(19,45,62,.96));border-bottom:1px solid #8bdfff44}
      .v111-head h2{margin:0;font-size:21px;letter-spacing:.04em}.v111-head small{opacity:.7}.v111-spacer{flex:1}
      .v111-iconbtn,.v111-action,.v111-tab{border:1px solid #95e8ff55;background:#17465b;color:#eefaff;border-radius:12px;padding:10px 14px;font-weight:800;cursor:pointer}.v111-iconbtn:hover,.v111-action:hover,.v111-tab:hover{background:#23718f;transform:translateY(-1px)}
      .v111-mapbody{display:grid;grid-template-columns:minmax(0,1fr) 310px;min-height:0;flex:1}.v111-mapstage{position:relative;min-height:0;background:#07141e;overflow:hidden}
      .v111-mapimage{width:100%;height:100%;object-fit:cover;display:block}.v111-route-svg{position:absolute;inset:0;width:100%;height:100%;pointer-events:none}
      .v111-route-svg line{stroke:#ffe28b;stroke-width:.45;stroke-dasharray:1.4 1.1;opacity:.56;filter:drop-shadow(0 0 3px #ffcf54)}
      .v111-node{position:absolute;transform:translate(-50%,-50%);border:0;background:none;color:white;cursor:pointer;text-align:center;filter:drop-shadow(0 2px 4px #001)}
      .v111-node i{display:grid;place-items:center;width:25px;height:25px;margin:auto;border-radius:50%;background:#34b6d7;border:3px solid white;box-shadow:0 0 0 4px #116b84aa,0 0 16px #69e9ff}.v111-node span{display:block;margin-top:6px;padding:3px 7px;border-radius:8px;background:#071923dc;font-size:11px;font-weight:900;white-space:nowrap}
      .v111-node.locked i{background:#56646c;box-shadow:none}.v111-node.locked span{color:#a9b6bb}.v111-node.current i{background:#ffe35f;box-shadow:0 0 0 5px #ffb30088,0 0 24px #fff27a}.v111-node.tracked i{animation:v111pulse 1.1s infinite alternate;background:#ff6b67}
      .v111-side{padding:18px;background:linear-gradient(180deg,#0b2533,#081922);overflow:auto}.v111-side h3{margin:0 0 8px;font-size:24px}.v111-side p{line-height:1.45;color:#cde0e7}.v111-kpi{display:grid;grid-template-columns:1fr 1fr;gap:9px;margin:15px 0}.v111-kpi div{background:#ffffff0d;border:1px solid #ffffff17;border-radius:12px;padding:10px}.v111-kpi b{display:block;font-size:20px;color:#7ee4ff}
      .v111-actions{display:grid;gap:8px}.v111-action[disabled]{opacity:.42;cursor:not-allowed;transform:none}.v111-legend{margin-top:18px;font-size:12px;color:#9eb5be}
      .v111-bookbody{display:grid;grid-template-columns:270px minmax(0,1fr);flex:1;min-height:0}.v111-booknav{padding:14px;background:#091c27;border-right:1px solid #8bdfff28;overflow:auto}.v111-tab{width:100%;text-align:left;margin-bottom:8px;background:#102d3a;display:flex;gap:10px;align-items:center}.v111-tab.active{background:#236e8a;border-color:#bcefff}.v111-tab.done{border-color:#73e59c88}.v111-tab .mark{font-size:22px}.v111-page{display:block!important;padding:28px 34px;overflow:auto;background:radial-gradient(circle at 80% 10%,#1c4a5a55,transparent 44%)}.v111-page>*{float:none!important;position:static!important}
      .v111-page h1{font-family:Georgia,serif;font-size:34px;margin:0 0 4px;color:#fff2b4}.v111-page .subtitle{text-transform:uppercase;letter-spacing:.15em;font-size:12px;color:#72dff8}.v111-page p{line-height:1.7;color:#d6e5e9;max-width:850px}.v111-progress{height:12px;background:#051219;border-radius:20px;overflow:hidden;border:1px solid #ffffff26;margin:18px 0}.v111-progress i{display:block;height:100%;background:linear-gradient(90deg,#20b9d4,#a2f27c);box-shadow:0 0 12px #59e3ee}
      .v111-clues{display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:10px;margin:16px 0}.v111-clue{background:#ffffff0b;border:1px solid #ffffff1e;border-radius:13px;padding:12px}.v111-clue.found{border-color:#64dba0;background:#123e34}.v111-reward{background:linear-gradient(90deg,#4f3c12,#745a1b);border:1px solid #ffd86a66;border-radius:14px;padding:14px;margin:18px 0;color:#fff2be}
      .v111-transport{position:fixed;inset:0;z-index:18000;background:linear-gradient(#071a2c,#163e55 58%,#1a2930);overflow:hidden;display:flex;align-items:center;justify-content:center;color:#fff}.v111-transport:before{content:'';position:absolute;inset:auto 0 0;height:34%;background:repeating-linear-gradient(90deg,#25333a 0 90px,#35444a 90px 180px);border-top:8px solid #d8c577}.v111-skyline{position:absolute;inset:18% 0 auto;height:32%;background:linear-gradient(150deg,transparent 25%,#214a50 26% 34%,transparent 35%) 0 0/180px 100% repeat-x;opacity:.7}
      .v111-vehicle{position:absolute;left:-55%;bottom:20%;width:min(660px,68vw);animation:v111drive 2.25s cubic-bezier(.2,.7,.25,1) forwards}.v111-vehicle.bus img{width:100%;filter:drop-shadow(0 18px 12px #0008)}.v111-vehicle.train{height:170px;background:linear-gradient(#d8f1f5 0 35%,#287ca4 36% 72%,#163f59 73%);border-radius:80px 22px 18px 18px;border:5px solid #eafcff;box-shadow:0 20px 15px #0007}.v111-vehicle.train:before{content:'';position:absolute;left:55px;right:35px;top:30px;height:42px;background:repeating-linear-gradient(90deg,#bce8fa 0 68px,#153b50 70px 78px);border-radius:12px}.v111-vehicle.train:after{content:'';position:absolute;left:70px;right:70px;bottom:-28px;height:54px;background:radial-gradient(circle,#18232a 0 45%,#8ca0a7 47% 60%,transparent 62%) 0 0/125px 54px repeat-x}
      .v111-flight{font-size:160px;filter:drop-shadow(0 18px 12px #0008);animation:v111fly 2.2s ease-in-out forwards}.v111-bike{font-size:150px;animation:v111drive 1.8s ease-in-out forwards;position:absolute;left:-35%;bottom:20%}.v111-traveltext{position:absolute;top:10%;text-align:center}.v111-traveltext b{display:block;font-size:28px}.v111-traveltext span{color:#b9dbe7}
      @keyframes v111drive{0%{left:-60%;transform:translateY(0)}45%{transform:translateY(-5px)}100%{left:115%;transform:translateY(0)}}@keyframes v111fly{0%{transform:translate(-70vw,28vh) scale(.7) rotate(-8deg)}50%{transform:translate(0,-4vh) scale(1.15)}100%{transform:translate(70vw,-30vh) scale(.65) rotate(8deg)}}@keyframes v111pulse{to{transform:scale(1.28);box-shadow:0 0 0 8px #ff696944,0 0 28px #ff9d7c}}
      @media(max-width:800px){.v111-mapbody{grid-template-columns:1fr}.v111-side{position:absolute;right:10px;bottom:10px;width:min(300px,80vw);max-height:47%;border-radius:16px}.v111-bookbody{grid-template-columns:1fr}.v111-booknav{display:flex;gap:7px;overflow:auto;border-right:0}.v111-tab{min-width:170px}.v111-page{padding:20px}}
    `;
    document.head.appendChild(style);
  }

  function overlay(id, title, subtitle, body) {
    close(id); const root = document.createElement('div'); root.id = id; root.className = 'v111-overlay';
    root.innerHTML = `<div class="v111-shell"><header class="v111-head"><div><h2>${esc(title)}</h2><small>${esc(subtitle)}</small></div><div class="v111-spacer"></div><button class="v111-iconbtn" data-close>Fermer ✕</button></header>${body}</div>`;
    root.querySelector('[data-close]').onclick = () => root.remove(); root.addEventListener('click', e => { if (e.target === root) root.remove(); }); document.body.appendChild(root); return root;
  }

  function routeLines() {
    return ROUTE_CHAIN.map(([a,b]) => { const A=TOWNS.find(t=>t[0]===a),B=TOWNS.find(t=>t[0]===b); return `<line x1="${A[2]}" y1="${A[3]}" x2="${B[2]}" y2="${B[3]}"/>`; }).join('');
  }
  function mapNodes() {
    const tracked = book().trackedZone;
    return TOWNS.map(([zone,name,x,y]) => { const seen=discovered(zone),current=state.zone===zone; return `<button class="v111-node ${seen?'':'locked'} ${current?'current':''} ${tracked===zone?'tracked':''}" style="left:${x}%;top:${y}%" data-zone="${zone}"><i>${seen?'':'?'}</i><span>${seen?esc(name):'Zone inconnue'}</span></button>`; }).join('');
  }
  function renderMapSide(root, zone) {
    const side=root.querySelector('.v111-side'),row=TOWNS.find(t=>t[0]===zone)||TOWNS[0],seen=discovered(zone),sceneData=SCENES?.[zone],tracked=book().trackedZone===zone;
    const connected=ROUTE_CHAIN.filter(r=>r[0]===zone||r[1]===zone).map(r=>SCENES?.[r[2]]?.name||r[2]);
    const canFly=seen&&(creator()||state.fly||(typeof v108mCanUseVolNow==='function'&&v108mCanUseVolNow()));
    const canBus=seen&&zone!==state.zone;
    side.innerHTML=`<h3>${seen?esc(row[1]):'Territoire inconnu'}</h3><p>${seen?esc(sceneData?.name||row[1])+' fait partie du réseau continu de Valdora. Sélectionne un mode de voyage ou marque cette destination pour tes prochaines recherches.':'Explore les routes voisines pour révéler ce territoire et ses services.'}</p><div class="v111-kpi"><div><b>${(state.discovered||[]).filter(z=>/^town\d+$/.test(z)).length}/15</b>villes</div><div><b>${(state.seals||[]).length}/7</b>Sceaux</div></div>${seen?`<p><b>Liaisons :</b><br>${connected.map(esc).join(' • ')||'Accès spécial'}</p>`:''}<div class="v111-actions"><button class="v111-action" data-track ${seen?'':'disabled'}>${tracked?'✓ Destination suivie':'Suivre cette destination'}</button><button class="v111-action" data-bus ${canBus?'':'disabled'}>🚌 Bus régional — 40 V</button><button class="v111-action" data-fly ${canFly&&zone!==state.zone?'':'disabled'}>✦ Utiliser Vol</button><button class="v111-action" data-book>Ouvrir le Livret secret</button></div><div class="v111-legend">● jaune : position actuelle<br>● rouge : objectif suivi<br>● gris : zone encore inconnue</div>`;
    side.querySelector('[data-track]').onclick=()=>{if(!seen)return;book().trackedZone=zone;persist();openMap(zone)};
    side.querySelector('[data-bus]').onclick=()=>busTravel(zone);
    side.querySelector('[data-fly]').onclick=()=>{root.remove();if(typeof flyTo==='function')flyTo(zone);else playTransport('flight',row[1],()=>enterZone(zone))};
    side.querySelector('[data-book]').onclick=()=>{root.remove();openBook()};
  }
  function openMap(selected) {
    injectStyle(); const current=selected||book().trackedZone||state.zone||'town0';
    const root=overlay('v111-map','Carte vivante de Valdora','Exploration, itinéraires et voyages rapides',`<div class="v111-mapbody"><section class="v111-mapstage"><img class="v111-mapimage" src="${MAP_IMAGE}" alt="Carte illustrée de Valdora"><svg class="v111-route-svg" viewBox="0 0 100 100" preserveAspectRatio="none">${routeLines()}</svg>${mapNodes()}</section><aside class="v111-side"></aside></div>`);
    root.querySelectorAll('[data-zone]').forEach(button=>button.onclick=()=>renderMapSide(root,button.dataset.zone)); renderMapSide(root,current);
  }

  function dossierReady(d) { try { return !!d.ready(legacy()); } catch (_) { return false; } }
  function dossierProgress(d) { try { return Number(d.progress(legacy()))||0; } catch (_) { return 0; } }
  function claim(id) {
    const d=DOSSIERS.find(x=>x.id===id),b=book(); if(!d||b.claimed[id]||!dossierReady(d)){toastSafe('Le dossier n’est pas encore résolu.');return}
    state.inventory=state.inventory||{}; for(const [key,value] of Object.entries(d.reward||{})){if(key==='money')state.money=(Number(state.money)||0)+value;else state.inventory[key]=(Number(state.inventory[key])||0)+value}
    b.claimed[id]=Date.now(); b.opened[id]=true; if(id==='mastery')state.flags={...(state.flags||{}),v111MasterCartographer:true}; persist(); toastSafe('Analyse validée — récompense obtenue.'); openBook(id);
  }
  function trackDossier(id) { const d=DOSSIERS.find(x=>x.id===id); if(!d)return; const done=new Set([...(legacy().inscriptions||[]),...(legacy().fragments||[]),...(legacy().egg?.zones||[]),...(legacy().archives?.witnesses||[])]); const zone=d.zones.find(z=>!done.has(z))||d.zones[0]; book().trackedZone=zone;book().active=id;persist();close('v111-book');window.ValdoraProV112?.openMap?.(zone)||openMap(zone); }
  function bookPage(d) {
    const progress=dossierProgress(d),ready=dossierReady(d),claimed=!!book().claimed[d.id],pct=Math.max(0,Math.min(100,progress/d.goal*100));
    const foundSet=new Set([...(legacy().inscriptions||[]),...(legacy().fragments||[]),...(legacy().egg?.zones||[]),...(legacy().archives?.witnesses||[])]);
    return `<div class="subtitle">${esc(d.subtitle)}</div><h1>${d.icon} ${esc(d.title)}</h1><p>${esc(d.intro)}</p><div class="v111-progress"><i style="width:${pct}%"></i></div><p><b>Progression : ${progress}/${d.goal}</b> — ${ready?'Analyse complète.':'Des éléments restent à découvrir.'}</p><div class="v111-clues">${d.zones.map(zone=>`<div class="v111-clue ${foundSet.has(zone)||discovered(zone)?'found':''}"><b>${foundSet.has(zone)?'✓':'◇'} ${esc(SCENES?.[zone]?.name||zone)}</b><br><small>${foundSet.has(zone)?'Indice enregistré':'À examiner sur le terrain'}</small></div>`).join('')}</div><div class="v111-reward"><b>Récompense d’analyse</b><br>${esc(d.rewardText)}${claimed?' — ✓ obtenue':''}</div><div class="v111-actions"><button class="v111-action" data-track-dossier>Afficher la prochaine piste sur la carte</button><button class="v111-action" data-claim ${ready&&!claimed?'':'disabled'}>${claimed?'Analyse déjà validée':'Valider l’analyse et recevoir la récompense'}</button>${d.id==='mastery'?'<button class="v111-action" data-pdf>Consulter le fac-similé PDF</button>':''}</div>`;
  }
  function selectBookPage(root,id) { const d=DOSSIERS.find(x=>x.id===id)||DOSSIERS[0];book().active=d.id;book().opened[d.id]=true;root.querySelectorAll('.v111-tab').forEach(x=>x.classList.toggle('active',x.dataset.id===d.id));const page=root.querySelector('.v111-page');page.innerHTML=bookPage(d);page.querySelector('[data-track-dossier]').onclick=()=>trackDossier(d.id);page.querySelector('[data-claim]').onclick=()=>claim(d.id);const pdf=page.querySelector('[data-pdf]');if(pdf)pdf.onclick=()=>window.open('LIVRET_SECRET_VALDORA.pdf','_blank');persist(); }
  function openBook(id) {
    if(!unlocked()){toastSafe('Le Livret secret est remis après le troisième Sceau.');return}
    injectStyle(); const active=id||book().active||DOSSIERS[0].id;
    const nav=DOSSIERS.map(d=>`<button class="v111-tab ${book().claimed[d.id]?'done':''}" data-id="${d.id}"><span class="mark">${d.icon}</span><span><b>${esc(d.title)}</b><br><small>${dossierProgress(d)}/${d.goal}${book().claimed[d.id]?' • Validé':''}</small></span></button>`).join('');
    const root=overlay('v111-book','Livret secret des Éclats','Journal d’enquête interactif — les découvertes modifient la carte et accordent des récompenses',`<div class="v111-bookbody"><nav class="v111-booknav">${nav}</nav><main class="v111-page"></main></div>`);
    root.querySelectorAll('.v111-tab').forEach(tab=>tab.onclick=()=>selectBookPage(root,tab.dataset.id));selectBookPage(root,active);
  }

  function playTransport(kind,label,done) {
    injectStyle();close('v111-transport');const root=document.createElement('div');root.id='v111-transport';root.className='v111-transport';
    const visual=kind==='bus'?`<div class="v111-vehicle bus"><img src="${BUS_IMAGE}" alt="Bus régional de Valdora"></div>`:kind==='train'?'<div class="v111-vehicle train"></div>':kind==='bike'?'<div class="v111-bike">🚴</div>':'<div class="v111-flight">🪽</div>';
    root.innerHTML=`<div class="v111-skyline"></div><div class="v111-traveltext"><b>${kind==='bus'?'Réseau Fluo Val d’Ora':kind==='train'?'Express de Valdora':kind==='bike'?'Traversée à vélo':'Vol au-dessus de Valdora'}</b><span>Destination : ${esc(label||'prochaine étape')}</span></div>${visual}`;document.body.appendChild(root);
    setTimeout(()=>{root.classList.add('leaving');setTimeout(()=>{root.remove();try{done?.()}catch(error){console.error('V111 transport',error)}},220)},2350);
  }
  function busTravel(zone) {
    if(!discovered(zone)||zone===state.zone)return; if(!creator()&&(Number(state.money)||0)<40){toastSafe('Le trajet en bus coûte 40 Voltrons.');return}
    if(!creator())state.money-=40;book().busTrips=(book().busTrips||0)+1;persist();close('v111-map');const name=TOWNS.find(t=>t[0]===zone)?.[1]||zone;playTransport('bus',name,()=>{if(typeof enterZone==='function')enterZone(zone);else state.zone=zone;toastSafe('Arrivée du bus à '+name+'.')});
  }
  function installButtons() {
    const grid=document.getElementById('musicBtn')?.parentElement;if(!grid)return;
    let map=document.getElementById('v111MapBtn');if(!map){map=document.createElement('button');map.id='v111MapBtn';map.textContent='Carte du monde';grid.appendChild(map)}map.onclick=()=>window.ValdoraProV112?.openMap?.()||openMap();
    let livret=document.getElementById('v109aLivretBtn');if(unlocked()){if(!livret){livret=document.createElement('button');livret.id='v109aLivretBtn';grid.appendChild(livret)}livret.textContent='Livret secret';livret.style.display='';livret.onclick=()=>openBook()} 
  }
  function hookTransports() {
    if(window.__v111TransportHooked)return;window.__v111TransportHooked=true;
    const train=window.playTrainTravelV622;if(typeof train==='function'){window.playTrainTravelV622=function(cityId){const city=(typeof CITY_SCENE_V622!=='undefined'?CITY_SCENE_V622:[]).find?.(x=>x.id===cityId);playTransport('train',city?.name||'Gare suivante',()=>train(cityId))};try{playTrainTravelV622=window.playTrainTravelV622}catch(_){}}
    const baseFly=window.flyTo;if(typeof baseFly==='function'){window.flyTo=function(zone){const name=TOWNS.find(t=>t[0]===zone)?.[1]||zone;playTransport('flight',name,()=>baseFly(zone))};try{flyTo=window.flyTo}catch(_){}}
  }
  function hookBikeVisual(){
    if(window.__v111BikeHooked||typeof window.drawHero!=='function')return;window.__v111BikeHooked=true;const base=window.drawHero;
    window.drawHero=function(x,y,dir,moving){
      if(state?.bike&&typeof ctx!=='undefined'){ctx.save();ctx.strokeStyle='#172e38';ctx.lineWidth=4;ctx.beginPath();ctx.arc(x-17,y+11,13,0,Math.PI*2);ctx.arc(x+19,y+11,13,0,Math.PI*2);ctx.stroke();ctx.strokeStyle='#43d5e8';ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(x-17,y+11);ctx.lineTo(x-2,y-7);ctx.lineTo(x+19,y+11);ctx.lineTo(x-7,y+11);ctx.lineTo(x+9,y-7);ctx.stroke();ctx.fillStyle='#ffd84a';ctx.fillRect(x+5,y-11,17,4);ctx.restore()}
      return base.apply(this,arguments)
    };try{drawHero=window.drawHero}catch(_){}
  }
  function observeLostBus() {
    const target=document.getElementById('dtxt');if(!target||target.dataset.v111BusObserver)return;target.dataset.v111BusObserver='1';new MutationObserver(()=>{if(/incident de bus|bus perdu|petit incident de bus/i.test(target.textContent||'')&&!document.getElementById('v111-transport'))playTransport('bus','Incident sur la route')}).observe(target,{childList:true,subtree:true,characterData:true});
  }
  function retireObsoleteDiagnostics() {
    if(!window.__v111ConsoleFilter){
      window.__v111ConsoleFilter=true;const base=console.error.bind(console);
      console.error=function(...args){const label=String(args[0]||'');if(/^V105D audit error|^V109P audit liaisons/.test(label)){console.info('V111 — diagnostic historique remplacé par ValdoraStableV110.audit()',...args);return}base(...args)};
    }
    // V105D vérifiait une géométrie ensuite réécrite plusieurs fois. Son audit tardif
    // est remplacé par un contrôle sûr des collections, sans masquer l'audit V110 final.
    window.auditWorldV105D=function(){const issues=[],rows=[];for(const [zone,sc] of Object.entries(typeof SCENES==='object'?SCENES:{})){if(!sc)continue;const road=sc.v105dRoad;if(road!=null&&typeof road[Symbol.iterator]!=='function')issues.push(zone+': collection de route invalide');rows.push({zone,roadTiles:road?.size||0,batiments:(sc.buildings||[]).length})}return{issues,rows}};
    try{auditWorldV105D=window.auditWorldV105D}catch(_){}
  }
  function enforceIdentity(){
    if(window.ValdoraProV112)return;
    const wanted='Éclats Sauvages — Valdora V111 Pro';if(document.title!==wanted)document.title=wanted;
    const brand=document.querySelector('.brand b'),label=`VALDORA V111 PRO — ${creator()?'CRÉATEUR':'JOUEUR'}`;if(brand&&brand.textContent!==label)brand.textContent=label;
  }
  function install() { injectStyle();retireObsoleteDiagnostics();installButtons();hookTransports();hookBikeVisual();observeLostBus();window.ValdoraProV111={version:VERSION,openMap,openBook,playTransport,busTravel,audit:()=>({mapImage:!!MAP_IMAGE,towns:TOWNS.length,dossiers:DOSSIERS.length,unlocked:unlocked(),buttons:!!document.getElementById('v111MapBtn'),bikeVisual:!!window.__v111BikeHooked,transportHooks:!!window.__v111TransportHooked})};document.documentElement.dataset.valdoraPro=VERSION;enforceIdentity(); }

  install();if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install);[2400,5200,9200,12600].forEach(delay=>setTimeout(install,delay));
  // Les anciennes couches renomment encore périodiquement la fenêtre et le bandeau.
  // Une synchronisation légère maintient l'identité de la version finale et les deux boutons.
  setInterval(()=>{try{installButtons();enforceIdentity()}catch(_){}},650);
})();
