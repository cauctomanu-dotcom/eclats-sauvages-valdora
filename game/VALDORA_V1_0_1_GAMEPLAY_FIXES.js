// ÉCLATS SAUVAGES — VALDORA V1.0.1
// Correctifs de gameplay publics : sortie de Clairval, PNJ urbains et populations intérieures.
(function(){
'use strict';

const VERSION='V1.0.1-GAMEPLAY-FIXES-4';
let lastZoneKey='';

function gameState(){try{return typeof state!=='undefined'&&state&&typeof state==='object'?state:null}catch(_){return null}}
function currentSceneSafe(){
  try{if(typeof currentScene==='function')return currentScene();const s=gameState();return typeof SCENES==='object'&&SCENES&&s?SCENES[s.zone]:null}catch(_){return null}
}
function hash(value){let h=2166136261>>>0;for(const c of String(value??'')){h^=c.charCodeAt(0);h=Math.imul(h,16777619)}return h>>>0}
function creator(){try{return /CREATEUR/i.test(location.pathname)||window.CREATOR_MODE===true||window.creatorMode===true||(typeof v61CreatorMode==='function'&&v61CreatorMode())}catch(_){return false}}
function dialogOpen(){const d=document.getElementById('dialog');return !!(d&&(d.classList.contains('show')||getComputedStyle(d).display!=='none'))}

// -----------------------------------------------------------------------------
// SORTIE DE CLAIRVAL
// Deux créatures distinctes : une niveau 9+ et une deuxième niveau 7+.
// -----------------------------------------------------------------------------
function clairvalProgress(){
  const team=(gameState()?.team||[]).filter(Boolean).map((m,index)=>({index,level:Number(m.level)||0})).sort((a,b)=>b.level-a.level);
  const strongest=team[0]?.level||0,second=team[1]?.level||0;
  return {team,strongest,second,highReady:strongest>8,secondReady:second>6,ready:team.length>=2&&strongest>8&&second>6};
}
function clairvalReadyTeam(){const p=clairvalProgress();return p.ready?p.team.slice(0,2):[]}
function clairvalGateMessage(){
  const p=clairvalProgress();
  if(!p.team.length)return 'Le Professeur Aurine t’attend au laboratoire : récupère d’abord ton premier Éclat.';
  if(p.team.length<2)return `Sortie de Clairval verrouillée : prépare deux créatures. Il faut une créature au niveau 9 minimum et une deuxième au niveau 7 minimum. Actuellement : niveau ${p.strongest}.`;
  const missing=[];
  if(!p.highReady)missing.push(`une créature niveau 9 minimum (meilleure : ${p.strongest})`);
  if(!p.secondReady)missing.push(`une deuxième créature niveau 7 minimum (deuxième : ${p.second})`);
  return missing.length?`Sortie de Clairval verrouillée : ${missing.join(' et ')}. Entraîne-toi dans les hautes herbes de Clairval.`:null;
}
function exitTarget(ex){return String(ex?.to||ex?.target||'')}
function insideRect(x,y,r){
  try{if(typeof pointIn==='function')return pointIn(x,y,r)}catch(_){}
  return !!r&&x>Number(r.x)&&x<Number(r.x)+Number(r.w)&&y>Number(r.y)&&y<Number(r.y)+Number(r.h)
}
function touchingClairvalExit(){
  const s=gameState(),sc=currentSceneSafe();if(!s||s.zone!=='town0'||!sc)return null;
  return (sc.exits||[]).find(ex=>exitTarget(ex)==='route0'&&insideRect(Number(s.x),Number(s.y),ex))||null
}
function pushBack(ex){
  const s=gameState();if(!s||!ex)return;const d=62;
  if(ex.side==='north')s.y+=d;else if(ex.side==='south')s.y-=d;else if(ex.side==='west')s.x+=d;else if(ex.side==='east')s.x-=d;
}
function showClairvalGate(msg,ex){
  const s=gameState();pushBack(ex);const now=Date.now();if(!s||now-Number(s._v101ClairvalGateShown||0)<850)return;
  s._v101ClairvalGateShown=now;try{toast(msg)}catch(_){}try{dialog('<b>Préparation avant le départ</b><br><br>'+msg)}catch(_){}
}
function withLegacyClairvalBypass(run){
  const s=gameState();if(!s||!clairvalProgress().ready)return run();
  const original=s.team;
  const promoted=(original||[]).map((m,i)=>i<2?{...m,level:Math.max(10,Number(m?.level)||1)}:m);
  while(promoted.length<3&&promoted.length)promoted.push({...promoted[0],level:10,_v101GateGhost:true});
  s.team=promoted;
  try{return run()}finally{s.team=original;try{if(typeof hud==='function')hud()}catch(_){}try{if(typeof save==='function')save(false)}catch(_){}}
}
function installClairvalGate(){
  const portal=window.checkPortal;
  if(typeof portal==='function'&&!portal.__valdoraV101Clairval){
    const wrapped=function(){
      if(!creator()){
        const ex=touchingClairvalExit();
        if(ex){const msg=clairvalGateMessage();if(msg){showClairvalGate(msg,ex);return false}return withLegacyClairvalBypass(()=>portal.apply(this,arguments))}
      }
      return portal.apply(this,arguments)
    };
    wrapped.__valdoraV101Clairval=true;wrapped.__base=portal;window.checkPortal=wrapped;try{checkPortal=wrapped}catch(_){}
  }
  const enter=window.enterZone;
  if(typeof enter==='function'&&!enter.__valdoraV101Clairval){
    const wrapped=function(to,entry){
      const s=gameState();
      if(!creator()&&s?.zone==='town0'&&String(to)==='route0'){
        const msg=clairvalGateMessage();if(msg){try{toast(msg)}catch(_){}try{dialog('<b>Préparation avant le départ</b><br><br>'+msg)}catch(_){}return false}
        return withLegacyClairvalBypass(()=>enter.apply(this,arguments))
      }
      return enter.apply(this,arguments)
    };
    wrapped.__valdoraV101Clairval=true;wrapped.__base=enter;window.enterZone=wrapped;try{enterZone=wrapped}catch(_){}
  }
  try{
    if(window.ValdoraProgressionV107K){
      window.ValdoraProgressionV107K.clairvalReady=clairvalReadyTeam;
      if(!window.ValdoraProgressionV107K.gate?.__valdoraV101Clairval){
        const oldGate=window.ValdoraProgressionV107K.gate;
        const gate=function(from,to){if(!creator()&&String(from)==='town0'&&String(to)==='route0')return clairvalGateMessage();return typeof oldGate==='function'?oldGate(from,to):null};
        gate.__valdoraV101Clairval=true;window.ValdoraProgressionV107K.gate=gate;
      }
    }
  }catch(_){}
  return true
}
function patchObjectiveText(){
  let current=null;try{current=window.objectivesV84||(typeof objectivesV84==='function'?objectivesV84:null)}catch(_){current=window.objectivesV84}
  if(typeof current!=='function'||current.__valdoraV101ClairvalObjectives)return false;
  const base=current,wrapped=function(){
    let list=[];try{list=base.apply(this,arguments)||[]}catch(_){list=[]}
    return list.map(item=>{
      if(!item||typeof item!=='object')return item;const txt=String(item.txt||'');
      const oldRule=/((trois|3)\s+(Éclats?|créatures?)[^.!]{0,55}niveau\s*10)|(niveau\s*10[^.!]{0,55}(trois|3)\s+(Éclats?|créatures?))/i.test(txt);
      return oldRule?{...item,txt:'Prépare deux créatures : une au niveau 9 minimum et une deuxième au niveau 7 minimum, puis poursuis l’enquête vers la Route 1.'}:item
    })
  };
  wrapped.__valdoraV101ClairvalObjectives=true;wrapped.__v125Outer=true;wrapped.__base=base;window.objectivesV84=wrapped;try{objectivesV84=wrapped}catch(_){}return true
}

// -----------------------------------------------------------------------------
// PNJ EXTÉRIEURS
// Un seul moteur de déplacement : la patrouille V122. Les PNJ historiques sont
// ajoutés à la même collection que les citoyens générés puis marqués v121Roamer.
// V122 prend alors la main sur tous les habitants ordinaires, sans deuxième RAF.
// -----------------------------------------------------------------------------
function uniquePush(out,seen,n){if(!n||seen.has(n))return;seen.add(n);out.push(n)}
function ordinaryNpc(n){
  if(!n||n.taron||n.guardian||n.service||n.v125Story||n.finalBoss||n.templeGuard)return false;
  if(String(n.id||'').startsWith('special_'))return false;
  return Number.isFinite(Number(n.x))&&Number.isFinite(Number(n.y))
}
function historicalTownNpcs(sc,zone){
  const out=[],seen=new Set();
  try{if(typeof NPCDATA!=='undefined'&&Array.isArray(NPCDATA))for(const n of NPCDATA)if(n?.zone===zone)uniquePush(out,seen,n)}catch(_){}
  for(const key of ['megaNPCs','v105dStreetNPCs','townNPCs','v103NPCs','v105dNPCs','npcs'])for(const n of (Array.isArray(sc?.[key])?sc[key]:[]))uniquePush(out,seen,n);
  return out.filter(n=>ordinaryNpc(n)&&n.v118Generated!==true)
}
function roadSlots(sc){
  const cached=Array.isArray(sc?._v118SpawnSlots?.list)?sc._v118SpawnSlots.list.filter(q=>Number.isFinite(Number(q.x))&&Number.isFinite(Number(q.y))):[];
  if(cached.length)return cached;
  const raw=sc?.v105dRoad,keys=raw instanceof Set?[...raw]:raw instanceof Map?[...raw.keys()]:Array.isArray(raw)?raw:[],cell=Number(sc?.v105dCell)||72,out=[];
  for(const key of keys){const m=/^(-?\d+),(-?\d+)$/.exec(String(key));if(!m)continue;out.push({x:(Number(m[1])+.5)*cell,y:(Number(m[2])+.5)*cell,nodeKey:String(key)})}
  return out
}
function nearestSlot(slots,x,y){let best=null,bd=Infinity;for(const q of slots){const d=Math.hypot(Number(q.x)-x,Number(q.y)-y);if(d<bd){bd=d;best=q}}return best?{...best,d:bd}:null}
function adoptTownNpcs(force=false){
  let sceneMode='';try{sceneMode=typeof scene==='string'?scene:''}catch(_){}
  const s=gameState(),sc=currentSceneSafe();if(sceneMode!=='world'||!s||!sc||sc.kind!=='town')return {adopted:0,roamers:0};
  sc.v118Citizens=Array.isArray(sc.v118Citizens)?sc.v118Citizens:[];
  const slots=roadSlots(sc),people=historicalTownNpcs(sc,s.zone);let adopted=0;
  for(const n of people){
    if(!sc.v118Citizens.includes(n)){sc.v118Citizens.push(n);adopted++}
    n.zone=n.zone||s.zone;n.v121Roamer=true;n._v101AdoptedRoamer=true;n.stationaryV118=false;n._v104Paused=false;n._v118PauseUntil=0;n._v118Wait=0;n._v118FreeTarget=null;
    if(force||!n._v101RoadPlaced){
      const q=nearestSlot(slots,Number(n.x),Number(n.y));if(q&&q.d>38){n.x=q.x;n.y=q.y;n.homeX=q.x;n.homeY=q.y;n._v118Node=q.nodeKey||null}
      n._v101RoadPlaced=true;n._v122Patrol=null;
    }
  }
  const roamers=sc.v118Citizens.filter(n=>ordinaryNpc(n)&&(n.v118Generated===true||n.v121Roamer===true));
  if(force)for(const n of roamers){n._v122Patrol=null;n.stationaryV118=false;n._v118PauseUntil=0;n._v118Wait=0;n._v118FreeTarget=null;n._v101MotionWatch=null}
  try{window.ValdoraRegressionV122?.repairNpcPatrol?.()}catch(_){}
  return {adopted,roamers:roamers.length}
}
function watchTownPatrols(){
  let sceneMode='';try{sceneMode=typeof scene==='string'?scene:''}catch(_){}
  const s=gameState(),sc=currentSceneSafe();if(sceneMode!=='world'||!s||!sc||sc.kind!=='town'||dialogOpen())return;
  const now=Date.now(),people=(sc.v118Citizens||[]).filter(n=>ordinaryNpc(n)&&(n.v118Generated===true||n.v121Roamer===true));
  for(const n of people){
    const x=Number(n.x),y=Number(n.y),w=n._v101MotionWatch;
    if(!w){n._v101MotionWatch={x,y,lastMove:now};continue}
    if(Math.hypot(x-w.x,y-w.y)>1.5){w.x=x;w.y=y;w.lastMove=now;continue}
    if(now-w.lastMove>4200&&now>Number(n._v118PauseUntil||0)+500){
      n._v122Patrol=null;n.stationaryV118=false;n._v118PauseUntil=0;n._v118Wait=0;n._v118FreeTarget=null;w.lastMove=now;
      try{window.ValdoraRegressionV122?.repairNpcPatrol?.()}catch(_){}
    }
  }
}

// -----------------------------------------------------------------------------
// INTÉRIEURS
// La population dépend du bâtiment physique, pas seulement du modèle de façade.
// -----------------------------------------------------------------------------
const NAMES=['Anaïs','Bastien','Camille','Damien','Élodie','Farid','Gaëlle','Hugo','Inès','Jules','Karine','Léo','Maëlys','Nolan','Océane','Paul','Quitterie','Romain','Sarah','Théo','Uma','Victor','Wendy','Yanis','Zoé','Aline','Bruno','Célia','Dorian','Emma','Florian','Gina','Hector','Iris','Joachim','Lina','Mathis','Noémie','Olivier','Perrine','Robin','Sonia','Tom','Valentine','William','Yasmine','Adèle','Clément','Lou','Milan','Nina','Axel','Lila','Sacha','Émile','Maya'];
const ROLES={
  maison:['habitante','parent','jeune dresseuse','voisin en visite'],residence:['résidente','voisin','gardienne de l’immeuble','livreur'],immeuble_moyen:['résidente','employé de bureau','technicienne','visiteur'],grand_immeuble:['résidente','agent d’entretien','consultante','visiteur'],
  centre_soins:['patient','accompagnatrice','stagiaire médicale','dresseur en convalescence'],laboratoire:['assistante de recherche','étudiant','technicienne','observateur du Codex'],boutique:['cliente','fournisseur','apprentie marchande','collectionneur'],gare:['voyageuse','contrôleur','employée des quais','touriste'],musee:['visiteuse','archiviste','guide','chercheuse'],ecole:['élève','professeur invité','surveillante','parent'],gardien:['aspirante','arbitre','supporter','dresseur local'],hotel:['cliente','concierge','voyageuse','bagagiste'],restaurant_cafe:['cliente','cuisinier','serveuse','habitué'],bureau_guilde:['éclaireuse','cartographe','contractuelle','responsable de mission'],bibliotheque_publique:['lectrice','archiviste','étudiante','bibliothécaire adjointe'],citadelle:['gardienne','érudit','émissaire','stratège']
};
const COUNTS={maison:3,residence:4,immeuble_moyen:4,grand_immeuble:5,centre_soins:4,laboratoire:4,boutique:3,gare:5,musee:5,ecole:5,gardien:4,hotel:4,restaurant_cafe:5,bureau_guilde:4,bibliotheque_publique:5,citadelle:4};
function interiorApi(){return window.ValdoraInteriorV109V||window.ValdoraBuildingV109I||null}
function heroHomeSession(s){
  if(!s)return false;const b=s.source||{},text=[b.id,b.type,b.urbanType,b.label,b.name,b.interiorKey,b.key,s.key].filter(Boolean).join(' ').toLowerCase();
  return s.zone==='town0'&&(/playerhome/.test(text)||/maison[_ -]?hero/.test(text)||/maison du h[eé]ros/.test(text)||String(b.id||'')==='maison_hero_clairval')
}
function coord(value,fallback=0){const n=Number(value);return Number.isFinite(n)?Math.round(n):fallback}
function physicalInteriorKey(s){
  const b=s?.source||{},x=coord(b.x,coord(b.doorX,0)),y=coord(b.y,coord(b.doorY,0));
  const type=String(s?.key||b.urbanType||b.type||b.id||b.label||'batiment');
  return `${s?.zone||'zone'}|${type}|${x},${y}|${s?.floorId||'rdc'}|${s?.roomId||'piece'}`
}
function roomSize(api){
  try{const rr=api?.rawRoom?.(),r=rr?.room||{};return {w:Math.max(320,Number(r.width)||1200),h:Math.max(260,Number(r.height)||800)}}catch(_){return {w:1200,h:800}}
}
function furnRect(m){if(m?.collision)return{x:Number(m.collision.x)||0,y:Number(m.collision.y)||0,w:Number(m.collision.w)||0,h:Number(m.collision.h)||0};return{x:Number(m?.x)||0,y:Number(m?.y)||0,w:Number(m?.w)||0,h:Number(m?.h)||0}}
function interiorCandidates(api,size){
  let furniture=[];try{furniture=api?.furniture?.()||[]}catch(_){}
  const out=[];for(let y=92;y<size.h-92;y+=72)for(let x=74;x<size.w-74;x+=84){
    if(y>size.h-150&&Math.abs(x-size.w/2)<150)continue;
    if(furniture.some(m=>{const r=furnRect(m);return x>r.x-36&&x<r.x+r.w+36&&y>r.y-42&&y<r.y+r.h+38}))continue;
    out.push({x,y})
  }
  return out
}
function diversifyInteriorPopulation(){
  const api=interiorApi();let s=null;try{s=api?.session?.()||null}catch(_){return false}if(!s||heroHomeSession(s))return false;
  const key=physicalInteriorKey(s);if(s._v101PhysicalPopulationKey===key&&(s.npcs||[]).some(n=>n._v101PhysicalResident))return true;
  s.npcs=Array.isArray(s.npcs)?s.npcs:[];
  const base=s.npcs.filter(n=>!n?.v118Resident||n?.v123HeroHomeGuard),size=roomSize(api),candidates=interiorCandidates(api,size),seed=hash(key);
  const type=String(s.key||s.source?.urbanType||s.source?.type||'maison'),roles=ROLES[type]||ROLES.maison,baseCount=COUNTS[type]||3;
  const residential=/maison|residence|immeuble/i.test(type),count=Math.max(1,Math.min(candidates.length,baseCount+(residential?((seed>>>7)%3)-1:0)));
  const reservedLooks=new Set(base.map(n=>Number(n?.look)).filter(Number.isFinite)),used=base.map(n=>({x:Number(n.x)||0,y:Number(n.y)||0})),people=[];
  let nameIndex=seed%NAMES.length,step=7+(seed%5)*2;
  for(let i=0;i<count&&candidates.length;i++){
    let pick=-1;for(let t=0;t<candidates.length;t++){const at=(seed+i*17+t*11)%candidates.length,p=candidates[at];if(used.every(o=>Math.hypot(p.x-o.x,p.y-o.y)>=76)){pick=at;break}}if(pick<0)pick=0;
    const p=candidates.splice(pick,1)[0];let name=NAMES[nameIndex%NAMES.length];nameIndex=(nameIndex+step)%NAMES.length;
    while(people.some(n=>n.name===name)){nameIndex=(nameIndex+1)%NAMES.length;name=NAMES[nameIndex]}
    let look=(seed+i*9)%41;while(reservedLooks.has(look)||people.some(n=>n.look===look))look=(look+5)%41;
    const role=roles[(seed+i)%roles.length];
    people.push({id:`v101_inside_${seed.toString(36)}_${i}`,name,look,x:p.x,y:p.y,homeX:p.x,homeY:p.y,targetX:p.x,targetY:p.y,dir:(seed+i)%4,moving:false,service:false,v118Resident:true,_v101PhysicalResident:true,v118Role:role,nextDecision:0,pauseUntil:0});used.push(p)
  }
  s.npcs=[...base,...people];s._v101PhysicalPopulationKey=key;s._v101PhysicalPopulationSeed=seed;return true
}

function patchUpdateNotes(){
  try{
    const notes=window.ValdoraUpdateNotesV126?.release?.notes;if(!Array.isArray(notes))return false;
    const npc='Les PNJ ordinaires des villes utilisent désormais un seul moteur de patrouille et circulent réellement sur les chemins.';
    const interior='Chaque bâtiment possède maintenant sa propre population intérieure : deux bâtiments du même type ne recopient plus automatiquement les mêmes habitants.';
    const gate='La sortie de Clairval est assouplie : il suffit désormais de deux créatures, une niveau 9 minimum et une deuxième niveau 7 minimum.';
    for(const line of [npc,interior,gate])if(!notes.includes(line))notes.push(line);
    return true
  }catch(_){return false}
}
function maintain(){
  installClairvalGate();patchObjectiveText();patchUpdateNotes();
  const s=gameState(),sc=currentSceneSafe(),key=s&&sc?`${s.zone}|${sc.v118Citizens?.length||0}|${sc._v118SpawnSlots?.sig||''}`:'';
  if(sc?.kind==='town'){const force=key!==lastZoneKey;adoptTownNpcs(force);if(force)lastZoneKey=`${s.zone}|${sc.v118Citizens?.length||0}|${sc._v118SpawnSlots?.sig||''}`}
  diversifyInteriorPopulation();document.documentElement.dataset.valdoraGameplayFixes=VERSION
}

window.ValdoraV101GameplayFixes={version:VERSION,maintain,clairvalProgress,clairvalReady:()=>clairvalProgress().ready,adoptTownNpcs,watchTownPatrols,diversifyInteriorPopulation};
[60,240,600,1200,2400,4800,8000].forEach(ms=>setTimeout(maintain,ms));
setInterval(()=>{try{maintain()}catch(e){console.warn('Valdora V1.0.1 — maintenance',e)}},1200);
setInterval(()=>{try{watchTownPatrols();diversifyInteriorPopulation()}catch(e){console.warn('Valdora V1.0.1 — PNJ',e)}},500);
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',maintain);else maintain();
console.log('Valdora V1.0.1 : patrouilles unifiées et populations intérieures individualisées.');
})();