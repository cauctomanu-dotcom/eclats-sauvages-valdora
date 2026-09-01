// ÉCLATS SAUVAGES — VALDORA V1.0.1
// Réécriture complète du moteur de PNJ extérieurs des villes.
(function(){
'use strict';

const VERSION='V1.0.1-TOWN-NPCS-REWRITE-5';
const TARGET_NORMAL=10;
const TARGET_MEGA=14;
const WALK_SPEED_MIN=34;
const WALK_SPEED_SPAN=18;
const SANITIZE_EVERY=450;
const REFRESH_EVERY=1800;
const NAMES=['Adèle','Alban','Alix','Amélie','Anatole','Apolline','Basile','Bérénice','Camille','Célestin','Clara','Colin','Diane','Éloi','Émilie','Esteban','Fanny','Florian','Garance','Gaspard','Hanaé','Hector','Iris','Ismaël','Jeanne','Joachim','Kenza','Léandre','Lila','Louison','Maël','Maëlys','Malo','Mélina','Naël','Nina','Octave','Olivia','Oscar','Paloma','Quentin','Romy','Samir','Sixtine','Solal','Thaïs','Tilio','Valentin','Victoire','Yasmine','Zélie','Aïdan','Côme','Énora','Faustine','Ilian','Lison','Marceau','Noémie','Sohan','Yuna'];
const ROLES=['habitante','artisan','étudiante','jardinier','voyageuse','chercheur','commerçante','guide local','musicienne','photographe','coursier','naturaliste'];
const FALLBACK_PALETTES=[
  ['#315f79','#d8c6aa','#3f302b','#e3b04b'],['#684b74','#d9b89d','#29252b','#a7d7c5'],['#4f6c42','#cda889','#5a3827','#e68a58'],
  ['#7a4d42','#e0bea4','#342b27','#79a8d8'],['#3e597a','#bd987c','#2c2524','#d9c86d'],['#6a6250','#d3af91','#473327','#9dcf84']
];

window.__VALDORA_TOWN_NPC_REWRITE_ACTIVE__=true;

const zones=new Map();
let lastFrame=performance.now();
let drawBase=null,interactBase=null,nearBase=null,collisionBase=null,npcCollisionBase=null;
let drawHookInstalled=false,notesPatched=false;

function stateSafe(){try{return typeof state!=='undefined'&&state&&typeof state==='object'?state:null}catch(_){return null}}
function sceneSafe(){try{if(typeof currentScene==='function')return currentScene();const s=stateSafe();return typeof SCENES==='object'&&SCENES&&s?SCENES[s.zone]:null}catch(_){return null}}
function hash(v){let h=2166136261>>>0;for(const c of String(v??'')){h^=c.charCodeAt(0);h=Math.imul(h,16777619)}return h>>>0}
function dist(a,b){return Math.hypot(Number(a?.x||0)-Number(b?.x||0),Number(a?.y||0)-Number(b?.y||0))}
function unique(out,seen,n){if(!n||seen.has(n))return;seen.add(n);out.push(n)}
function isWorldTown(){const s=stateSafe(),sc=sceneSafe();let mode='';try{mode=typeof scene==='string'?scene:''}catch(_){}return !!s&&!!sc&&mode==='world'&&sc.kind==='town'}
function specialNpc(n){
  if(!n)return true;
  const id=String(n.id||'');
  return !!(n.taron||n.guardian||n.service||n.v125Story||n.finalBoss||n.templeGuard||n._citadelV105Y||id.startsWith('special_')||id==='prof'||id==='guard'||id==='healer'||id==='seller'||id==='agent');
}
function legacyAmbient(n){const id=String(n?.id||'');return !!n&&(n.v118Generated===true||id.startsWith('v121_roamer_')||id.startsWith('v118_world_')||n._v101AdoptedRoamer===true)}
function collectSourceNpcs(sc,zone){
  const out=[],seen=new Set();
  try{if(typeof NPCDATA!=='undefined'&&Array.isArray(NPCDATA))for(const n of NPCDATA)if(n?.zone===zone)unique(out,seen,n)}catch(_){}
  for(const key of ['megaNPCs','v105dStreetNPCs','townNPCs','v103NPCs','v105dNPCs','npcs'])for(const n of (Array.isArray(sc?.[key])?sc[key]:[]))unique(out,seen,n);
  try{const t=typeof currentTaronNPC==='function'?currentTaronNPC():null;if(t)unique(out,seen,t)}catch(_){}
  return out.filter(n=>n&&Number.isFinite(Number(n.x))&&Number.isFinite(Number(n.y))&&!legacyAmbient(n));
}
function fixedSourceNpcs(sc,zone){return collectSourceNpcs(sc,zone).filter(specialNpc)}

function roadCells(sc){
  const raw=sc?.v105dRoad;
  const values=raw instanceof Set?[...raw]:raw instanceof Map?[...raw.keys()]:Array.isArray(raw)?raw:raw&&typeof raw==='object'?Object.keys(raw).filter(k=>raw[k]):[];
  const out=[];for(const v of values){const m=/^(-?\d+),(-?\d+)$/.exec(String(v));if(m)out.push({gx:Number(m[1]),gy:Number(m[2]),key:String(v)})}return out
}
function nearExit(sc,x,y){return (sc?.exits||[]).some(e=>Math.hypot(x-(Number(e.x)+Number(e.w)/2),y-(Number(e.y)+Number(e.h)/2))<88)}
function nodeSafe(sc,x,y){
  if(x<28||y<28||x>(Number(sc?.width)||1800)-28||y>(Number(sc?.height)||1100)-28)return false;
  if((sc?.buildings||[]).some(b=>x>Number(b.x)-26&&x<Number(b.x)+Number(b.w)+26&&y>Number(b.y)-22&&y<Number(b.y)+Number(b.h)+36))return false;
  if((sc?.v105dTrees||[]).some(t=>Math.hypot(x-Number(t.x),y-Number(t.y))<46*(Number(t.s)||1)))return false;
  if(nearExit(sc,x,y))return false;
  return true
}
function graphSignature(sc){const cells=roadCells(sc);return `${sc?.v105dCell||0}|${cells.length}|${cells.map(c=>c.key).join(';')}|${sc?.buildings?.length||0}|${sc?.v105dTrees?.length||0}`}
function buildGraph(sc){
  const cell=Number(sc?.v105dCell)||72,cells=roadCells(sc),byCell=new Map(),nodes=[];
  for(const c of cells){const x=(c.gx+.5)*cell,y=(c.gy+.5)*cell;if(!nodeSafe(sc,x,y))continue;const n={id:`${c.gx},${c.gy}`,gx:c.gx,gy:c.gy,x,y,neighbors:[]};nodes.push(n);byCell.set(n.id,n)}
  for(const n of nodes){for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){const q=byCell.get(`${n.gx+dx},${n.gy+dy}`);if(q)n.neighbors.push(q)}}
  for(const n of nodes)if(!n.neighbors.length){
    const candidates=nodes.filter(q=>q!==n&&((q.gx===n.gx&&Math.abs(q.gy-n.gy)<=2)||(q.gy===n.gy&&Math.abs(q.gx-n.gx)<=2))).sort((a,b)=>dist(n,a)-dist(n,b));
    if(candidates[0])n.neighbors.push(candidates[0])
  }
  if(nodes.length<3){
    const slots=Array.isArray(sc?._v118SpawnSlots?.list)?sc._v118SpawnSlots.list:[];
    for(const [i,q] of slots.entries()){const x=Number(q.x),y=Number(q.y);if(!Number.isFinite(x)||!Number.isFinite(y)||!nodeSafe(sc,x,y))continue;nodes.push({id:`fallback_${i}`,x,y,neighbors:[]})}
    for(const n of nodes)n.neighbors.push(...nodes.filter(q=>q!==n).sort((a,b)=>dist(n,a)-dist(n,b)).slice(0,3))
  }
  return {sig:graphSignature(sc),cell,nodes}
}
function nearestNode(graph,x,y,occupied=[],preferFree=false){
  let best=null,score=Infinity;
  for(const q of graph.nodes){
    const nearestCrowd=occupied.length?Math.min(...occupied.map(o=>dist(q,o))):Infinity;
    const crowd=preferFree&&nearestCrowd<graph.cell*1.65?(graph.cell*1.65-nearestCrowd)*4.2:0;
    const v=Math.hypot(q.x-x,q.y-y)+crowd;
    if(v<score){score=v;best=q}
  }
  return best
}
function spreadNode(graph,occupied,seed){
  if(!graph.nodes.length)return null;
  if(!occupied.length)return graph.nodes[hash(seed)%graph.nodes.length];
  let best=null,bestScore=-Infinity;
  for(const q of graph.nodes){
    const clearance=Math.min(...occupied.map(o=>dist(q,o)));
    const jitter=(hash(`${seed}|${q.id}`)%1000)/1000;
    const score=clearance+jitter*graph.cell*.18;
    if(score>bestScore){bestScore=score;best=q}
  }
  return best
}
function buildPatrolPath(start,graph,seed){
  if(!start)return [];
  const desired=Math.max(2,Math.min(9,4+(hash(`${seed}|length`)%6)));
  const path=[start],visited=new Set([start.id]);
  let prev=null,node=start;
  for(let i=1;i<desired;i++){
    let opts=(node.neighbors||[]).filter(q=>q&&q!==prev&&!visited.has(q.id));
    if(!opts.length)opts=(node.neighbors||[]).filter(q=>q&&q!==prev);
    if(!opts.length)opts=(node.neighbors||[]).filter(Boolean);
    if(!opts.length)break;
    opts=opts.slice().sort((a,b)=>String(a.id).localeCompare(String(b.id)));
    const pick=opts[hash(`${seed}|step|${i}|${node.id}`)%opts.length];
    path.push(pick);visited.add(pick.id);prev=node;node=pick;
  }
  if(path.length<2){const fallback=(start.neighbors||[])[0]||graph.nodes.find(q=>q!==start&&dist(q,start)<=graph.cell*2.2);if(fallback)path.push(fallback)}
  return path
}
function orientTo(n,target){
  if(!n||!target)return;
  const dx=Number(target.x)-Number(n.x),dy=Number(target.y)-Number(n.y);
  if(Math.abs(dx)>=Math.abs(dy))n.dir=dx>=0?2:1;else n.dir=dy>=0?0:3
}
function nextPatrolTarget(n,w){
  const route=w.route||[];if(route.length<2)return null;
  let next=Number(w.routeIndex||0)+Number(w.routeStep||1);
  if(next>=route.length){w.routeStep=-1;next=route.length-2;w.turns++}
  else if(next<0){w.routeStep=1;next=1;w.turns++}
  w.routeIndex=next;const target=route[next]||null;if(target)orientTo(n,target);return target
}
function seedGenerated(zone,index,usedNames){
  const h=hash(`${zone}|rewrite|${index}`);let name=NAMES[h%NAMES.length],step=5+(h%9),k=0;while(usedNames.has(name)&&k++<NAMES.length)name=NAMES[(h+k*step)%NAMES.length];usedNames.add(name);
  return {id:`v101_town_${zone}_${index}`,zone,name,look:(h>>>8)%41,v118Role:ROLES[(h>>>14)%ROLES.length],dir:h%4,moving:false,_v101TownGenerated:true,_v101TownOwned:true,x:0,y:0,homeX:0,homeY:0}
}
function attachWalker(n,graph,occupied,seed){
  n.v121Roamer=false;n.v118Generated=false;n._v101AdoptedRoamer=false;n._v122Patrol=null;n._v118FreeTarget=null;n._v118Target=null;n.stationaryV118=true;n._v101TownOwned=true;
  let node=nearestNode(graph,Number(n.x),Number(n.y),occupied,true);if(!node&&graph.nodes.length)node=spreadNode(graph,occupied,seed);
  if(node){n.x=node.x;n.y=node.y;n.homeX=node.x;n.homeY=node.y;occupied.push(node)}
  const h=hash(seed),route=buildPatrolPath(node,graph,seed);
  n._v101Walk={node,route,routeIndex:route.length>1?1:0,routeStep:1,target:route[1]||null,trips:0,turns:0,waitUntil:performance.now()+180+(h%900),speed:WALK_SPEED_MIN+(h%WALK_SPEED_SPAN),moving:false};
  if(n._v101Walk.target)orientTo(n,n._v101Walk.target);return n
}
function sanitizeLegacy(sc,source){
  if(Array.isArray(sc?.v118Citizens))sc.v118Citizens=sc.v118Citizens.filter(n=>!legacyAmbient(n));
  for(const n of source){if(!n||specialNpc(n))continue;n.v121Roamer=false;n.v118Generated=false;n._v101AdoptedRoamer=false;n._v122Patrol=null;n._v118FreeTarget=null;n._v118Target=null;n.stationaryV118=true}
}
function sourceSignature(source){return source.filter(n=>!specialNpc(n)).map(n=>String(n.id||n.name||'npc')).sort().join('|')}
function buildZone(sc,zone,force=false){
  const source=collectSourceNpcs(sc,zone);sanitizeLegacy(sc,source);const ordinary=source.filter(n=>!specialNpc(n)),sig=`${graphSignature(sc)}|${sourceSignature(source)}`;
  const old=zones.get(zone);if(old&&!force&&old.sig===sig){old.checkedAt=Date.now();return old}
  const graph=buildGraph(sc),occupied=[],walkers=[],usedNames=new Set(ordinary.map(n=>String(n.name||'')).filter(Boolean));
  for(const n of ordinary)walkers.push(attachWalker(n,graph,occupied,`${zone}|source|${n.id||n.name}`));
  const target=sc.megacity?TARGET_MEGA:TARGET_NORMAL;
  for(let i=walkers.length;i<target;i++){
    const n=seedGenerated(zone,i,usedNames),spawn=spreadNode(graph,occupied,`${zone}|spawn|${i}`);if(spawn){n.x=spawn.x;n.y=spawn.y}walkers.push(attachWalker(n,graph,occupied,`${zone}|generated|${i}`))
  }
  const z={zone,scene:sc,sig,graph,walkers,fixed:fixedSourceNpcs(sc,zone),builtAt:Date.now(),checkedAt:Date.now(),lastSanitize:0};zones.set(zone,z);return z
}
function activeZone(force=false){
  const s=stateSafe(),sc=sceneSafe();if(!s||!sc||sc.kind!=='town')return null;const old=zones.get(s.zone),now=Date.now();
  if(old&&!force&&old.scene===sc&&now-old.checkedAt<REFRESH_EVERY)return old;
  return buildZone(sc,s.zone,force)
}

function dialogOpen(){const d=document.getElementById('dialog');if(!d)return false;try{return d.classList.contains('show')||getComputedStyle(d).display!=='none'}catch(_){return false}}
function walkerNear(x,y,max=88){const z=activeZone();if(!z)return null;let best=null,bd=Infinity;for(const n of z.walkers){const d=Math.hypot(Number(n.x)-x,Number(n.y)-y);if(d<bd){bd=d;best=n}}return best&&bd<=max?best:null}
function playerNearWalker(max=88){const s=stateSafe();return s?walkerNear(Number(s.x),Number(s.y),max):null}
function blockPoint(x,y,max=31){return walkerNear(Number(x),Number(y),max)}
function lineFor(n){
  try{if(!n._v101TownGenerated&&typeof npcDialogue==='function'){const v=npcDialogue(n);if(v)return String(v)}}catch(_){}
  try{const bank=window.ValdoraLivingWorldV118?.dialogues?.[stateSafe()?.zone];if(Array.isArray(bank)&&bank.length)return String(bank[hash(`${n.id}|${n._v101Talk||0}`)%bank.length])}catch(_){}
  return 'La ville est plus animée qu’elle n’en a l’air. Prends le temps d’observer les chemins et de parler aux habitants.'
}
function facePlayer(n){const s=stateSafe();if(!s||!n)return;const dx=Number(s.x)-Number(n.x),dy=Number(s.y)-Number(n.y);n.dir=Math.abs(dx)>Math.abs(dy)?(dx<0?1:2):(dy>0?0:3);if(n._v101Walk){n._v101Walk.waitUntil=performance.now()+3200;n._v101Walk.moving=false}n.moving=false}
function talkTo(n){if(!n)return false;facePlayer(n);n._v101Talk=Number(n._v101Talk||0)+1;const text=lineFor(n);try{dialog(`<b>${n.name||'Habitant'}</b><br>${text}`);return true}catch(_){try{toast(`${n.name||'Habitant'} : ${text}`);return true}catch(__){return false}}}

function updatePopulation(now,dt){
  if(!isWorldTown())return;const s=stateSafe(),sc=sceneSafe(),z=activeZone();if(!z)return;
  if(now-z.lastSanitize>SANITIZE_EVERY){sanitizeLegacy(sc,collectSourceNpcs(sc,s.zone));z.lastSanitize=now}
  const pauseAll=dialogOpen();
  for(const n of z.walkers){const w=n._v101Walk;if(!w)continue;n.stationaryV118=true;n.v121Roamer=false;n.v118Generated=false;
    if(pauseAll||now<Number(w.waitUntil||0)||Math.hypot(Number(n.x)-Number(s.x),Number(n.y)-Number(s.y))<48){w.moving=false;n.moving=false;continue}
    if(!w.target){w.target=nextPatrolTarget(n,w);if(!w.target){w.waitUntil=now+800;w.moving=false;n.moving=false;continue}}
    const dx=w.target.x-Number(n.x),dy=w.target.y-Number(n.y),d=Math.hypot(dx,dy);
    if(d<2){
      n.x=w.target.x;n.y=w.target.y;w.node=w.target;w.trips++;
      const route=w.route||[],atEnd=w.routeIndex===0||w.routeIndex===route.length-1;
      w.target=nextPatrolTarget(n,w);w.moving=false;n.moving=false;
      if(atEnd)w.waitUntil=now+260+(hash(`${n.id}|turn|${w.turns}`)%740);
      continue
    }
    const other=z.walkers.find(o=>o!==n&&Math.hypot(Number(o.x)-Number(n.x),Number(o.y)-Number(n.y))<27&&hash(o.id)<hash(n.id));if(other){w.waitUntil=now+220;w.moving=false;n.moving=false;continue}
    const step=Math.min(d,w.speed*dt);n.x=Number(n.x)+dx/d*step;n.y=Number(n.y)+dy/d*step;w.moving=true;n.moving=true;n.dir=Math.abs(dx)>=Math.abs(dy)?(dx>=0?2:1):(dy>=0?0:3)
  }
}

function camera(sc){const s=stateSafe(),mw=Number(sc?.width)||1800,mh=Number(sc?.height)||1100;return {camX:Math.max(0,Math.min(Math.max(0,mw-1600),Number(s?.x||800)-800)),camY:Math.max(0,Math.min(Math.max(0,mh-1000),Number(s?.y||500)-500)),sx:960/1600,sy:600/1000}}
function exactNpcImageReady(look,dir){
  try{const kinds=typeof V102F_NPC_KINDS!=='undefined'?V102F_NPC_KINDS:null,images=typeof V102F_NPC_IMAGES!=='undefined'?V102F_NPC_IMAGES:null;if(!Array.isArray(kinds)||!kinds.length||!images)return false;const idx=Math.abs(Math.trunc(Number(look)||0))%kinds.length,kind=kinds[idx],d=typeof v102eDirName==='function'?v102eDirName(dir):'down',im=images?.[kind]?.[d];return !!(im&&im.complete&&Number(im.naturalWidth)>0)}catch(_){return false}
}
function drawFallback(n,x,y){try{if(typeof v101sCharacter!=='function'||typeof ctx==='undefined')return;const p=FALLBACK_PALETTES[hash(n.id)%FALLBACK_PALETTES.length];v101sCharacter(ctx,x,y,{moving:!!n._v101Walk?.moving,dir:n.dir||0,shirt:p[0],pants:'#3f4b55',hair:p[2],cap:p[3],accent:p[1]})}catch(_){}}
function drawOne(n,cam){
  const x=(Number(n.x)-cam.camX)*cam.sx,y=(Number(n.y)-cam.camY)*cam.sy;if(x<-45||x>1005||y<-55||y>655)return;
  try{if(exactNpcImageReady(n.look,n.dir)&&typeof drawNpc==='function'){drawNpc(n.look,x,y,n.dir||0,!!n._v101Walk?.moving);return}}catch(_){}drawFallback(n,x,y)
}
function drawPopulation(){if(!isWorldTown()||typeof ctx==='undefined')return;const sc=sceneSafe(),z=activeZone();if(!z)return;const cam=camera(sc);for(const n of z.walkers)drawOne(n,cam)}

function updateHook(){/* Le déplacement est détenu par la boucle RAF de ce module. */}
function drawHook(){const r=typeof drawBase==='function'?drawBase.apply(this,arguments):undefined;try{drawPopulation()}catch(e){console.warn('V1.0.1 rendu PNJ ville',e)}return r}
drawHook.__v101TownNpcRewrite=true;
function nearHook(){const n=playerNearWalker(95);if(n)return n;return typeof nearBase==='function'?nearBase.apply(this,arguments):null}
nearHook.__v101TownNpcRewrite=true;
function npcCollisionHook(x,y){const n=blockPoint(Number(x),Number(y),36);if(n)return n;return typeof npcCollisionBase==='function'?npcCollisionBase.apply(this,arguments):null}
npcCollisionHook.__v101TownNpcRewrite=true;
function collisionHook(x,y){if(isWorldTown()&&blockPoint(Number(x),Number(y),30))return true;return typeof collisionBase==='function'?collisionBase.apply(this,arguments):false}
collisionHook.__v101TownNpcRewrite=true;
function interactHook(){
  try{if(typeof closeDialog==='function'&&closeDialog())return true}catch(_){}
  try{if(window.ValdoraRegressionV122?.tryChest?.(115))return true}catch(_){}
  const n=playerNearWalker(90);if(n)return talkTo(n);return typeof interactBase==='function'?interactBase.apply(this,arguments):false
}
interactHook.__v101TownNpcRewrite=true;interactHook.__v122ChestRepair=true;

function installHooks(){
  try{
    if(window.drawWorld!==drawHook){
      const candidate=window.drawWorld;
      // Une couche graphique V107D/V112 installée après le moteur PNJ doit rester
      // au sommet : elle appelle déjà drawHook comme base. La réadopter comme base
      // créerait drawHook -> renderer -> drawHook, et la masquer détruit les sols.
      const rendererAboveTown=drawHookInstalled&&typeof candidate==='function'&&!!(candidate.__v107dDraw||candidate.__v112World);
      if(!rendererAboveTown){
        if(typeof candidate==='function')drawBase=candidate;
        window.drawWorld=drawHook;try{drawWorld=drawHook}catch(_){}
        drawHookInstalled=true;
      }
    }
    if(window.interact!==interactHook){let cur=window.interact;if(cur?.__v122ChestRepair&&cur?.__v122Base)cur=cur.__v122Base;interactBase=cur;window.interact=interactHook;try{interact=interactHook}catch(_){}}
    if(window.nearNPC!==nearHook){nearBase=window.nearNPC;window.nearNPC=nearHook;try{nearNPC=nearHook}catch(_){} }
    if(typeof window.npcCollision==='function'&&window.npcCollision!==npcCollisionHook){npcCollisionBase=window.npcCollision;window.npcCollision=npcCollisionHook;try{npcCollision=npcCollisionHook}catch(_){}}
    if(typeof window.collision==='function'&&window.collision!==collisionHook){collisionBase=window.collision;window.collision=collisionHook;try{collision=collisionHook}catch(_){}}
    window.updateTownNPCs=updateHook;try{updateTownNPCs=updateHook}catch(_){}window.updateNPCsD=updateHook;try{updateNPCsD=updateHook}catch(_){}
  }catch(e){console.warn('V1.0.1 hooks PNJ ville',e)}
}
function patchNotes(){
  if(notesPatched)return;try{const notes=window.ValdoraUpdateNotesV126?.release?.notes;if(!Array.isArray(notes))return;const line='Les habitants des villes suivent désormais de vraies patrouilles aller-retour, se retournent naturellement à chaque extrémité et sont mieux répartis dans les rues.';if(!notes.includes(line))notes.push(line);notesPatched=true}catch(_){}
}
function audit(){
  const s=stateSafe();
  const sc=sceneSafe();
  const z=sc?.kind==='town'?activeZone():null;
  return {
    version:VERSION,
    zone:s?.zone||null,
    active:!!z,
    roadNodes:z?.graph?.nodes?.length||0,
    walkers:z?.walkers?.length||0,
    moving:z?.walkers?.filter(n=>n._v101Walk?.moving).length||0,
    generated:z?.walkers?.filter(n=>n._v101TownGenerated).length||0,
    pingPong:z?.walkers?.filter(n=>(n._v101Walk?.route?.length||0)>=2).length||0,
    legacyRemaining:Array.isArray(sc?.v118Citizens)?sc.v118Citizens.filter(legacyAmbient).length:0,
    invalid:z?.walkers?.filter(n=>!Number.isFinite(Number(n.x))||!Number.isFinite(Number(n.y))).map(n=>n.id)||[]
  };
}
function rebuild(){const s=stateSafe(),sc=sceneSafe();if(!s||!sc||sc.kind!=='town')return null;zones.delete(s.zone);return buildZone(sc,s.zone,true)}

function frame(now){
  const dt=Math.min(.05,Math.max(.001,(now-lastFrame)/1000));lastFrame=now;
  try{installHooks();if(isWorldTown()){activeZone();updatePopulation(now,dt)}patchNotes();document.documentElement.dataset.valdoraTownNpcs=VERSION}catch(e){console.warn('V1.0.1 moteur PNJ ville',e)}
  requestAnimationFrame(frame)
}

window.ValdoraTownNPCsV101={version:VERSION,audit,rebuild,population:()=>activeZone()?.walkers||[],near:playerNearWalker};
requestAnimationFrame(frame);
[100,500,1500,3500].forEach(ms=>setTimeout(()=>{try{installHooks();rebuild()}catch(_){}},ms));
console.log('Valdora V1.0.1 : moteur de PNJ urbains aller-retour et dispersion améliorée.');
})();