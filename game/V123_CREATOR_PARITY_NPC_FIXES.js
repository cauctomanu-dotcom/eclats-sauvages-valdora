// VALDORA V123 — parité Créateur + implantation cohérente des PNJ
(function(){
'use strict';
const VERSION='V123-CREATOR-PARITY-NPC-1';
const HERO_SENTINEL='v123_hero_home_population_guard';
let lastTownKey='';

function isCreator(){
  try{return /CREATEUR/i.test(location.pathname)||window.CREATOR_MODE===true||window.creatorMode===true||(typeof v61CreatorMode==='function'&&v61CreatorMode())}catch(_){return /CREATEUR/i.test(location.pathname)}
}
function currentState(){try{return typeof state!=='undefined'&&state&&typeof state==='object'?state:null}catch(_){return null}}
function currentScene(){
  try{
    if(typeof window.currentScene==='function')return window.currentScene();
    const s=currentState();return typeof SCENES==='object'&&SCENES&&s?SCENES[s.zone]:null
  }catch(_){return null}
}
function hash(v){let h=2166136261>>>0;for(const c of String(v??'')){h^=c.charCodeAt(0);h=Math.imul(h,16777619)}return h>>>0}
function roadCells(sc){
  const raw=sc?.v105dRoad;
  if(raw instanceof Set)return [...raw].map(String);
  if(raw instanceof Map)return [...raw.keys()].map(String);
  if(Array.isArray(raw))return raw.map(String);
  if(raw&&typeof raw==='object')return Object.keys(raw).filter(k=>raw[k]).map(String);
  return [];
}
function parseCell(v){const m=/^(-?\d+),(-?\d+)$/.exec(String(v));return m?{gx:Number(m[1]),gy:Number(m[2])}:null}
function inBuilding(sc,x,y,p=18){return (sc?.buildings||[]).some(b=>x>Number(b.x)-p&&x<Number(b.x)+Number(b.w)+p&&y>Number(b.y)-p&&y<Number(b.y)+Number(b.h)+p)}
function nearTree(sc,x,y){return (sc?.v105dTrees||[]).some(t=>Math.hypot(x-Number(t.x),y-Number(t.y))<42*(Number(t.s)||1))}
function nearExit(sc,x,y){return (sc?.exits||[]).some(e=>Math.hypot(x-(Number(e.x)+Number(e.w)/2),y-(Number(e.y)+Number(e.h)/2))<72)}
function strictRoadSlots(sc){
  if(!sc||sc.kind!=='town')return [];
  const cell=Number(sc.v105dCell)||72,core=Math.max(40,Number(sc.v105dCore)||90),cells=roadCells(sc),set=new Set(cells),out=[],seen=new Set();
  function add(x,y,nodeKey){
    x=Math.round(x);y=Math.round(y);const k=`${Math.round(x/8)},${Math.round(y/8)}`;
    if(seen.has(k))return;if(x<28||y<28||x>(Number(sc.width)||1800)-28||y>(Number(sc.height)||1100)-28)return;
    if(inBuilding(sc,x,y,20)||nearTree(sc,x,y)||nearExit(sc,x,y))return;
    seen.add(k);out.push({x,y,key:`v123:${k}`,nodeKey:nodeKey||null,v123StrictRoad:true});
  }
  for(const raw of cells){
    const c=parseCell(raw);if(!c)continue;const cx=(c.gx+.5)*cell,cy=(c.gy+.5)*cell;
    const horiz=set.has(`${c.gx-1},${c.gy}`)||set.has(`${c.gx+1},${c.gy}`),vert=set.has(`${c.gx},${c.gy-1}`)||set.has(`${c.gx},${c.gy+1}`);
    add(cx,cy,raw);
    const lane=Math.min(core*.20,28);
    if(horiz&&!vert){add(cx,cy-lane,raw);add(cx,cy+lane,raw)}
    else if(vert&&!horiz){add(cx-lane,cy,raw);add(cx+lane,cy,raw)}
    else if(horiz&&vert){add(cx-lane*.7,cy,raw);add(cx+lane*.7,cy,raw);add(cx,cy-lane*.7,raw);add(cx,cy+lane*.7,raw)}
  }
  return out;
}
function townNpcList(sc,zone){
  const out=[],seen=new Set();
  function add(n){if(!n||seen.has(n))return;seen.add(n);out.push(n)}
  try{if(typeof NPCDATA!=='undefined'&&Array.isArray(NPCDATA))for(const n of NPCDATA)if(n?.zone===zone)add(n)}catch(_){}
  for(const key of ['megaNPCs','v105dStreetNPCs','v118Citizens'])for(const n of (Array.isArray(sc?.[key])?sc[key]:[]))add(n);
  return out;
}
function nearestSlot(slots,x,y,occupied,seed){
  if(!slots.length)return null;let best=null,bestScore=Infinity;
  const start=hash(seed)%slots.length;
  for(let i=0;i<slots.length;i++){
    const q=slots[(start+i)%slots.length],d=Math.hypot(q.x-x,q.y-y);
    const crowd=occupied.some(o=>Math.hypot(q.x-o.x,q.y-o.y)<48)?140:0,score=d+crowd;
    if(score<bestScore){best=q;bestScore=score;if(score<12)break}
  }
  return best;
}
function distanceToSlots(slots,x,y,limit=Infinity){let d=limit;for(const q of slots){const v=Math.hypot(q.x-x,q.y-y);if(v<d)d=v;if(d<10)break}return d}
function normalizeTownNpcs(sc,zone){
  if(!sc||sc.kind!=='town')return {moved:0,total:0,slots:0};
  const slots=strictRoadSlots(sc);if(!slots.length)return {moved:0,total:0,slots:0};
  // V118 et V122 utilisent ce cache pour les cibles de promenade. On conserve
  // leur signature, mais on remplace la liste par des points réellement situés
  // sur la chaussée afin qu'aucune promenade ne reparte dans les parcelles.
  if(sc._v118SpawnSlots&&typeof sc._v118SpawnSlots==='object')sc._v118SpawnSlots.list=slots;
  const npcs=townNpcList(sc,zone),occupied=[],toMove=[];
  for(const n of npcs){
    if(n?.taron||n?.guardian)continue;
    const x=Number(n.x),y=Number(n.y);if(!Number.isFinite(x)||!Number.isFinite(y)){toMove.push(n);continue}
    const roadDistance=distanceToSlots(slots,x,y,9999),bad=inBuilding(sc,x,y,8)||nearTree(sc,x,y)||roadDistance>Math.max(38,(Number(sc.v105dCore)||90)*.50);
    if(bad)toMove.push(n);else occupied.push({x,y});
  }
  let moved=0;
  for(const n of toMove){
    const x=Number.isFinite(Number(n.x))?Number(n.x):(Number(sc.width)||1800)/2,y=Number.isFinite(Number(n.y))?Number(n.y):(Number(sc.height)||1100)/2;
    const q=nearestSlot(slots,x,y,occupied,`${zone}|${n.id||n.name||moved}`);if(!q)continue;
    n.x=q.x;n.y=q.y;n.homeX=q.x;n.homeY=q.y;n._v118Node=q.nodeKey;n._v118Target=null;n._v118FreeTarget=null;n.moving=false;
    if(n.v118Generated||n.v121Roamer){n._v118Placed=true;n._v121Placed=true;n.v121Roamer=true;if(n._v122Patrol){const a=n._v122Patrol.a,b=n._v122Patrol.b;if(distanceToSlots(slots,a?.x,a?.y,9999)>42||distanceToSlots(slots,b?.x,b?.y,9999)>42)n._v122Patrol=null}}
    else n.stationaryV118=true;
    occupied.push({x:q.x,y:q.y});moved++;
  }
  sc._v123NpcPlacement={version:VERSION,zone,moved,total:npcs.length,slots:slots.length,at:Date.now()};
  return sc._v123NpcPlacement;
}
function interiorApi(){return window.ValdoraInteriorV109V||window.ValdoraBuildingV109I||null}
function buildingId(b,s){return String(b?.id||b?.label||b?.name||`${s?.key||'batiment'}:${Math.round(Number(b?.x)||0)}:${Math.round(Number(b?.y)||0)}`)}
function isHeroHomeSession(s){
  if(!s)return false;const b=s.source||{},text=[b.id,b.type,b.urbanType,b.label,b.name,b.interiorKey,b.key,s.key].filter(Boolean).join(' ').toLowerCase();
  return s.zone==='town0'&&(/playerhome/.test(text)||/maison[_ -]?hero/.test(text)||/maison du h[eé]ros/.test(text)||buildingId(b,s)==='maison_hero_clairval');
}
function sanitizeHeroHome(){
  const api=interiorApi();let s=null;try{s=api?.session?.()||null}catch(_){return false}if(!isHeroHomeSession(s))return false;
  s.npcs=Array.isArray(s.npcs)?s.npcs:[];
  const base=s.npcs.filter(n=>!n?.v118Resident&&!n?.v123HeroHomeGuard);
  const guard={id:HERO_SENTINEL,name:'',look:0,x:-99999,y:-99999,homeX:-99999,homeY:-99999,dir:0,moving:false,service:false,v118Resident:true,v123HeroHomeGuard:true,stationaryV118:true};
  s.npcs=[...base,guard];
  s._v118PopulationKey=`${s.zone}|${buildingId(s.source,s)}|${s.floorId}|${s.roomId}`;
  s._v123HeroHomeSanitized=true;
  return true;
}
function loadCreatorSaveParity(){
  if(!isCreator()||window.ValdoraSaveV118||document.getElementById('v123CreatorSaveParity'))return;
  const script=document.createElement('script');script.id='v123CreatorSaveParity';script.src='VALDORA_SAVE_V118.js?v=118-save-3';script.async=false;document.head.appendChild(script);
}
function ensureCreatorParity(){
  if(!isCreator())return;
  loadCreatorSaveParity();
  try{window.ValdoraStableV110?.repair?.()}catch(_){}
  try{window.ValdoraLivingWorldV118?.install?.()}catch(_){}
  try{window.ValdoraRegressionV122?.install?.();window.ValdoraRegressionV122?.ensureCreatorCompletion?.()}catch(_){}
  document.documentElement.dataset.valdoraCreatorParity=VERSION;
}
function maintain(){
  ensureCreatorParity();sanitizeHeroHome();
  const s=currentState(),sc=currentScene();if(!s||!sc||sc.kind!=='town')return;
  const key=`${s.zone}|${sc._v118SpawnSlots?.sig||''}|${sc.buildings?.length||0}|${sc.v118Citizens?.length||0}`;
  const result=normalizeTownNpcs(sc,s.zone);if(key!==lastTownKey){lastTownKey=key;try{console.info('V123 implantation PNJ',result)}catch(_){}}
}
function audit(){
  const s=currentState(),sc=currentScene();return {version:VERSION,creator:isCreator(),saveParity:!!window.ValdoraSaveV118,zone:s?.zone||null,townPlacement:sc?._v123NpcPlacement||null,heroHomeSanitized:!!(()=>{try{return interiorApi()?.session?.()?._v123HeroHomeSanitized}catch(_){return false}})()};
}
window.ValdoraV123={version:VERSION,maintain,audit,normalizeTownNpcs,sanitizeHeroHome,ensureCreatorParity};
[80,450,1200,2600,5200,9000,15000].forEach(ms=>setTimeout(maintain,ms));
setInterval(()=>{try{maintain()}catch(e){console.warn('V123 maintenance',e)}},2400);
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',maintain);else maintain();
console.log('V123 : mode Créateur synchronisé et PNJ urbains recalés sur les chemins.');
})();
