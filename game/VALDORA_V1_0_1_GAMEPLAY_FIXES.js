// ÉCLATS SAUVAGES — VALDORA V1.0.1
// Correctifs de gameplay : PNJ urbains mobiles sur les chemins + sortie de Clairval assouplie.
(function(){
'use strict';

const VERSION='V1.0.1-GAMEPLAY-FIXES-1';
let lastFrame=performance.now();
let lastZone='';

function gameState(){try{return typeof state!=='undefined'&&state&&typeof state==='object'?state:null}catch(_){return null}}
function currentSceneSafe(){
  try{if(typeof currentScene==='function')return currentScene();const s=gameState();return typeof SCENES==='object'&&SCENES&&s?SCENES[s.zone]:null}catch(_){return null}
}
function hash(value){let h=2166136261>>>0;for(const c of String(value??'')){h^=c.charCodeAt(0);h=Math.imul(h,16777619)}return h>>>0}
function creator(){try{return /CREATEUR/i.test(location.pathname)||window.CREATOR_MODE===true||window.creatorMode===true||(typeof v61CreatorMode==='function'&&v61CreatorMode())}catch(_){return false}}

// -----------------------------------------------------------------------------
// SORTIE DE CLAIRVAL
// Nouvelle règle : deux créatures distinctes suffisent.
// - la plus forte doit être au-dessus du niveau 8 (niveau 9+)
// - une deuxième doit être au-dessus du niveau 6 (niveau 7+)
// -----------------------------------------------------------------------------
function clairvalProgress(){
  const team=(gameState()?.team||[]).filter(Boolean).map((m,index)=>({index,level:Number(m.level)||0})).sort((a,b)=>b.level-a.level);
  const strongest=team[0]?.level||0,second=team[1]?.level||0;
  return {team,strongest,second,highReady:strongest>8,secondReady:second>6,ready:team.length>=2&&strongest>8&&second>6};
}
function clairvalReadyTeam(){
  const p=clairvalProgress();
  return p.ready?p.team.slice(0,2):[];
}
function clairvalGateMessage(){
  const p=clairvalProgress();
  if(!p.team.length)return 'Le Professeur Aurine t’attend au laboratoire : récupère d’abord ton premier Éclat.';
  if(p.team.length<2)return `Sortie de Clairval verrouillée : prépare deux créatures. Il faut une créature au niveau 9 minimum et une deuxième au niveau 7 minimum. Actuellement : niveau ${p.strongest}.`;
  const missing=[];
  if(!p.highReady)missing.push(`une créature niveau 9 minimum (meilleure : ${p.strongest})`);
  if(!p.secondReady)missing.push(`une deuxième créature niveau 7 minimum (deuxième : ${p.second})`);
  return missing.length?`Sortie de Clairval verrouillée : ${missing.join(' et ')}. Entraîne-toi dans les hautes herbes de Clairval.`:null;
}
function installClairvalGate(){
  let base=null;try{base=window.v107kTownGate||(typeof v107kTownGate==='function'?v107kTownGate:null)}catch(_){base=window.v107kTownGate}
  if(typeof base!=='function'||base.__valdoraV101Clairval)return false;
  const wrapped=function(from,to){
    if(!creator()&&String(from)==='town0'&&String(to)==='route0')return clairvalGateMessage();
    return base.apply(this,arguments);
  };
  wrapped.__valdoraV101Clairval=true;wrapped.__base=base;
  window.v107kTownGate=wrapped;try{v107kTownGate=wrapped}catch(_){}
  try{
    if(window.ValdoraProgressionV107K){
      window.ValdoraProgressionV107K.clairvalReady=clairvalReadyTeam;
      const oldGate=window.ValdoraProgressionV107K.gate;
      window.ValdoraProgressionV107K.gate=function(from,to){
        if(!creator()&&String(from)==='town0'&&String(to)==='route0')return clairvalGateMessage();
        return typeof oldGate==='function'?oldGate(from,to):null;
      };
    }
  }catch(_){}
  return true;
}

function patchObjectiveText(){
  let current=null;try{current=window.objectivesV84||(typeof objectivesV84==='function'?objectivesV84:null)}catch(_){current=window.objectivesV84}
  if(typeof current!=='function'||current.__valdoraV101ClairvalObjectives)return false;
  const base=current;
  const wrapped=function(){
    let list=[];try{list=base.apply(this,arguments)||[]}catch(_){list=[]}
    return list.map(item=>{
      if(!item||typeof item!=='object')return item;
      const txt=String(item.txt||'');
      if(/trois\s+Éclats?\s+de\s+niveau\s+10|3\s+créatures?\s+de\s+niveau\s+10|au moins trois/i.test(txt)){
        return {...item,txt:'Prépare deux créatures : une au niveau 9 minimum et une deuxième au niveau 7 minimum, puis poursuis l’enquête vers la Route 1.'};
      }
      return item;
    });
  };
  wrapped.__valdoraV101ClairvalObjectives=true;
  // V125 vérifie ce marqueur pour ne pas remballer indéfiniment la fonction.
  wrapped.__v125Outer=true;
  wrapped.__base=base;
  window.objectivesV84=wrapped;try{objectivesV84=wrapped}catch(_){}
  return true;
}

// -----------------------------------------------------------------------------
// PNJ URBAINS : les citoyens générés continuent d’être gérés par V122.
// Ici on prend en charge les PNJ historiques/normaux que V123 avait correctement
// replacés sur les chemins mais qui restaient ensuite immobiles.
// -----------------------------------------------------------------------------
function uniquePush(out,seen,n){if(!n||seen.has(n))return;seen.add(n);out.push(n)}
function eligibleTownNpcs(sc,zone){
  const out=[],seen=new Set();
  try{if(typeof NPCDATA!=='undefined'&&Array.isArray(NPCDATA))for(const n of NPCDATA)if(n?.zone===zone)uniquePush(out,seen,n)}catch(_){}
  for(const key of ['megaNPCs','v105dStreetNPCs'])for(const n of (Array.isArray(sc?.[key])?sc[key]:[]))uniquePush(out,seen,n);
  return out.filter(n=>{
    if(!n)return false;
    if(n.taron||n.guardian||n.service||n.v125Story)return false;
    if(String(n.id||'').startsWith('special_'))return false;
    // Les citoyens V118/V121 ont déjà leur moteur A↔B V122 : ne pas créer deux moteurs concurrents.
    if(n.v118Generated===true||n.v121Roamer===true)return false;
    return Number.isFinite(Number(n.x))&&Number.isFinite(Number(n.y));
  });
}
function roadSlots(sc){
  const cached=Array.isArray(sc?._v118SpawnSlots?.list)?sc._v118SpawnSlots.list.filter(q=>Number.isFinite(Number(q.x))&&Number.isFinite(Number(q.y))):[];
  if(cached.length)return cached;
  const raw=sc?.v105dRoad,keys=raw instanceof Set?[...raw]:raw instanceof Map?[...raw.keys()]:Array.isArray(raw)?raw:[];
  const cell=Number(sc?.v105dCell)||72,out=[];
  for(const key of keys){const m=/^(-?\d+),(-?\d+)$/.exec(String(key));if(!m)continue;out.push({x:(Number(m[1])+.5)*cell,y:(Number(m[2])+.5)*cell,nodeKey:String(key)})}
  return out;
}
function nearestSlot(slots,x,y){let best=null,bd=Infinity;for(const q of slots){const d=Math.hypot(Number(q.x)-x,Number(q.y)-y);if(d<bd){bd=d;best=q}}return best?{...best,d:bd}:null}
function nextSlot(n,slots){
  const x=Number(n.x),y=Number(n.y),prev=n._v101PrevTarget;
  let candidates=slots.filter(q=>{
    const dx=Math.abs(Number(q.x)-x),dy=Math.abs(Number(q.y)-y),d=Math.hypot(dx,dy);
    return d>=65&&d<=250&&(dx<=32||dy<=32)&&`${Math.round(q.x)},${Math.round(q.y)}`!==prev;
  });
  if(!candidates.length)candidates=slots.filter(q=>{const d=Math.hypot(Number(q.x)-x,Number(q.y)-y);return d>=55&&d<=180&&`${Math.round(q.x)},${Math.round(q.y)}`!==prev});
  if(!candidates.length)return null;
  const q=candidates[hash(`${n.id}|${n.name}|${Math.round(x)}|${Math.round(y)}|${n._v101Trips||0}`)%candidates.length];
  return {x:Number(q.x),y:Number(q.y)};
}
function prepareNpc(n,slots){
  if(!n._v101RoadWalker){
    const nearest=nearestSlot(slots,Number(n.x),Number(n.y));
    if(nearest&&nearest.d>42){n.x=nearest.x;n.y=nearest.y}
    n.homeX=Number(n.x);n.homeY=Number(n.y);n._v101RoadWalker=true;n._v101Target=null;n._v101Trips=0;n._v101WaitUntil=performance.now()+180+(hash(n.id)%700);
  }
  // Empêche les anciens moteurs de déplacer ce PNJ en parallèle : le moteur V1.0.1 le possède désormais.
  n.stationaryV118=true;
}
function moveLegacyNpcs(now,dt){
  let sceneMode='';try{sceneMode=typeof scene==='string'?scene:''}catch(_){}
  const s=gameState(),sc=currentSceneSafe();if(sceneMode!=='world'||!s||!sc||sc.kind!=='town')return;
  const slots=roadSlots(sc);if(!slots.length)return;
  const people=eligibleTownNpcs(sc,s.zone);
  for(const n of people){
    prepareNpc(n,slots);
    if(Date.now()<Number(n._v118PauseUntil||0)||n._v104Paused||now<Number(n._v101WaitUntil||0)){n.moving=false;continue}
    if(Math.hypot(Number(n.x)-Number(s.x),Number(n.y)-Number(s.y))<52){n.moving=false;n._v101WaitUntil=now+240;continue}
    if(!n._v101Target){n._v101Target=nextSlot(n,slots);if(!n._v101Target){n.moving=false;n._v101WaitUntil=now+600;continue}}
    const t=n._v101Target,dx=t.x-Number(n.x),dy=t.y-Number(n.y),d=Math.hypot(dx,dy);
    if(d<2){
      n.x=t.x;n.y=t.y;n.moving=false;n._v101PrevTarget=`${Math.round(t.x)},${Math.round(t.y)}`;n._v101Target=null;n._v101Trips=(n._v101Trips||0)+1;n._v101WaitUntil=now+300+(hash(`${n.id}|wait|${n._v101Trips}`)%900);continue
    }
    const speed=28+(hash(n.id)%17),step=Math.min(d,speed*dt),nx=Number(n.x)+dx/d*step,ny=Number(n.y)+dy/d*step;
    // Le choix des cibles est aligné avec les cellules de chemin : le segment reste sur le réseau urbain.
    n.x=nx;n.y=ny;n.moving=true;
    if(Math.abs(dx)>=Math.abs(dy))n.dir=dx>=0?2:1;else n.dir=dy>=0?0:3;
  }
}
function movementLoop(now){
  const dt=Math.min(.05,Math.max(.001,(now-lastFrame)/1000));lastFrame=now;
  try{moveLegacyNpcs(now,dt)}catch(e){console.warn('Valdora V1.0.1 — déplacement PNJ',e)}
  requestAnimationFrame(movementLoop)
}

function patchUpdateNotes(){
  try{
    const notes=window.ValdoraUpdateNotesV126?.release?.notes;if(!Array.isArray(notes))return false;
    const old=notes.findIndex(x=>/PNJ itinérants effectuent désormais de vrais allers-retours/i.test(String(x)));
    const npc='Les PNJ des villes marchent maintenant réellement sur les chemins : les anciens habitants comme les citoyens générés disposent d’un déplacement visible et cohérent.';
    if(old>=0)notes[old]=npc;else if(!notes.includes(npc))notes.push(npc);
    const gate='La sortie de Clairval est assouplie : il suffit désormais de deux créatures, une niveau 9 minimum et une deuxième niveau 7 minimum.';
    if(!notes.some(x=>/sortie de Clairval est assouplie/i.test(String(x))))notes.push(gate);
    const dialog=document.getElementById('valdoraUpdateDialog');
    if(dialog&&!dialog.hidden){const list=dialog.querySelector('.valdoraUpdateList');if(list)list.replaceChildren(...notes.map(note=>{const li=document.createElement('li');li.textContent=note;return li}))}
    return true;
  }catch(_){return false}
}

function maintain(){
  installClairvalGate();patchObjectiveText();patchUpdateNotes();
  const s=gameState();if(s?.zone!==lastZone){lastZone=s?.zone||'';try{window.ValdoraV123?.maintain?.()}catch(_){} }
  document.documentElement.dataset.valdoraGameplayFixes=VERSION;
}

window.ValdoraV101GameplayFixes={version:VERSION,maintain,clairvalProgress,clairvalReady:()=>clairvalProgress().ready,eligibleTownNpcs:()=>{const s=gameState(),sc=currentSceneSafe();return sc&&s?eligibleTownNpcs(sc,s.zone):[]}};
[80,350,900,1800,3500,6500,10000].forEach(ms=>setTimeout(maintain,ms));
setInterval(()=>{try{maintain()}catch(e){console.warn('Valdora V1.0.1 — maintenance',e)}},2200);
requestAnimationFrame(movementLoop);
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',maintain);else maintain();
console.log('Valdora V1.0.1 : PNJ urbains mobiles et sortie de Clairval assouplie.');
})();