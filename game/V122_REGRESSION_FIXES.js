// VALDORA V122 — correctifs finaux de régression, créateur, progression et monde vivant
(function(){
'use strict';
const VERSION='V122.1';
const LAST_MILE='V122-CHEST-NPC-4';

function creatorModeV122(){
  try{return /CREATEUR/i.test(location.pathname)||window.CREATOR_MODE===true||window.creatorMode===true||(typeof v61CreatorMode==='function'&&v61CreatorMode())}catch(_){return false}
}
function gameState(){try{return typeof state!=='undefined'&&state&&typeof state==='object'?state:null}catch(_){return null}}
function sceneV122(){
  try{
    if(typeof currentScene==='function')return currentScene();
    const s=gameState();return typeof SCENES==='object'&&SCENES&&s?SCENES[s.zone]:null
  }catch(_){return null}
}
function hashV122(value){let h=2166136261>>>0;for(const c of String(value??'')){h^=c.charCodeAt(0);h=Math.imul(h,16777619)}return h>>>0}
function species(){
  const out=new Map();
  try{for(const c of (Array.isArray(CREATURES)?CREATURES:[])){const id=Number(c?.id);if(Number.isFinite(id))out.set(id,c)}}catch(_){}
  try{if(typeof BY==='object'&&BY)for(const [k,c] of Object.entries(BY)){const id=Number(c?.id??k);if(Number.isFinite(id)&&!out.has(id))out.set(id,{...c,id})}}catch(_){}
  return [...out.values()].sort((a,b)=>Number(a.id)-Number(b.id));
}
function speciesCount(){return Math.max(169,species().length)}
function legalLevel(id){try{return Math.max(1,Number(window.ValdoraCombatV105R?.minimumLegalLevel?.(id))||1)}catch(_){return 1}}
function creatorMon(c){
  const lvl=Math.max(50,legalLevel(c.id));
  try{if(typeof mon==='function'){const m=mon(c.id,lvl);if(m){m._v122CreatorStock=true;return m}}}catch(_){}
  let moves=[];try{if(typeof defaultMoves==='function')moves=defaultMoves(c.id,lvl)||[]}catch(_){}
  return {id:Number(c.id),level:lvl,xp:0,hp:999,moves,_v122CreatorStock:true}
}
function markCollection(s,key,id){
  let c=s[key];
  if(c instanceof Set){c.add(id);return}
  if(Array.isArray(c)){if(!c.some(v=>Number(v?.id??v)===id))c.push(id);return}
  if(!c||typeof c!=='object')c=s[key]={};
  c[id]=true;
}
function addToFlatBox(box,c){
  if(!Array.isArray(box))return false;
  const id=Number(c.id);if(box.some(m=>Number(m?.id)===id))return true;box.push(creatorMon(c));return true;
}
function ensureCreatorCompletion(){
  if(!creatorModeV122())return false;
  const s=gameState(),all=species();if(!s||!all.length)return false;
  s.flags=s.flags&&typeof s.flags==='object'?s.flags:{};
  s.dex=s.dex&&typeof s.dex==='object'?s.dex:{};
  s.box=Array.isArray(s.box)?s.box:[];
  for(const c of all){
    const id=Number(c?.id);if(!Number.isFinite(id))continue;
    const old=s.dex[id];s.dex[id]=(old&&typeof old==='object')?{...old,seen:true,caught:true}:{seen:true,caught:true};
    markCollection(s,'seen',id);markCollection(s,'caught',id);
    addToFlatBox(s.box,c);
  }
  if(Array.isArray(s.boxes)){
    if(!s.boxes.length)s.boxes.push([]);
    const target=Array.isArray(s.boxes[0])?s.boxes[0]:s.boxes;
    for(const c of all)addToFlatBox(target,c);
  }
  if(s.seals instanceof Set){for(let i=1;i<=11;i++)s.seals.add(i)}
  else if(Array.isArray(s.seals)){for(let i=1;i<=11;i++)if(!s.seals.some(v=>Number(v)===i))s.seals.push(i)}
  else{s.seals={};for(let i=1;i<=11;i++)s.seals[i]=true}
  s.flags.v122CreatorComplete=true;
  s.flags.v61CitadelGateOverride=true;
  s.flags.v104GuardianCircuitUnlocked=true;
  s.flags.v109wCityMasteryBypass=true;
  s.flags.v109yTaronisPermit=true;
  s.flags.v109wVolReward=true;
  s.flyLearned=true;
  try{if(Array.isArray(s.capsules)&&!s.capsules.includes('vol'))s.capsules.push('vol')}catch(_){}
  try{if(typeof SCENES==='object'&&SCENES){s.discovered=s.discovered||{};for(const k of Object.keys(SCENES))s.discovered[k]=true}}catch(_){}
  try{save(false)}catch(_){}
  return true;
}
function wrapCreatorMenu(name){
  const fn=window[name];if(typeof fn!=='function'||fn.__v122CreatorMenu)return;
  const w=function(){ensureCreatorCompletion();return fn.apply(this,arguments)};w.__v122CreatorMenu=true;w.__v122Base=fn;window[name]=w;
}
function creatorAware(name,creatorValue){
  const fn=window[name];if(typeof fn==='function'&&fn.__v122CreatorAware)return;
  const base=typeof fn==='function'?fn:null;
  const w=function(){if(creatorModeV122())return typeof creatorValue==='function'?creatorValue.apply(this,arguments):creatorValue;return base?base.apply(this,arguments):undefined};
  w.__v122CreatorAware=true;w.__v122Base=base;window[name]=w;
}
function installCreatorMode(){
  ensureCreatorCompletion();
  ['openPC','openDex','openCodex','openEcladex','openDexV83','openCodexV106Z'].forEach(wrapCreatorMenu);
  creatorAware('v108mSeal5Beaten',true);
  creatorAware('v108mCanUseVolNow',true);
  creatorAware('v106pHasVolMastery',true);
  creatorAware('v106pCitadelRequirements',()=>({caught:speciesCount(),seals:11,vol:true,ready:true,creator:true}));
  creatorAware('finalTempleAvailableV77',true);
  creatorAware('v83CitadelGateText','La Citadelle est accessible — mode créateur.');
}
function pendingRoad(route){try{return window.ValdoraGameplayV109W?.pendingRoadTrainers?.(route)||[]}catch(_){return []}}
function installProgressionRepair(){
  const pg=window.playerQuestGateMessage;
  if(typeof pg==='function'&&!pg.__v122Gate){
    const w=function(from,to){
      if(creatorModeV122())return null;
      let msg=pg.apply(this,arguments);if(!msg)return msg;const text=String(msg);
      if(/^route/.test(String(from))&&/dresseur|quête sur cette route|route n.est pas encore terminée/i.test(text)){
        const left=pendingRoad(from);return left.length?`Avant de continuer, bats les ${left.length} dresseur${left.length>1?'s':''} de route encore présent${left.length>1?'s':''}.`:null;
      }
      if(from==='town12'&&/mission|quête/i.test(text))return null;
      if(from==='town14'&&to!=='temple_final'&&/7\s*sceaux|sceau|gardien/i.test(text))return null;
      if(to==='town13'&&/team\s*taron|mission|quête/i.test(text))return null;
      if(from==='town6'&&to==='route_littoral'&&/mission|quête/i.test(text))return null;
      return msg;
    };w.__v122Gate=true;w.__v122Base=pg;window.playerQuestGateMessage=w;try{playerQuestGateMessage=w}catch(_){}
  }
  for(const name of ['v107kTownGate','v107kRouteGate','v107kBiomesGate']){
    const fn=window[name];if(typeof fn!=='function'||fn.__v122CreatorGate)continue;
    const w=function(){if(creatorModeV122())return null;return fn.apply(this,arguments)};w.__v122CreatorGate=true;w.__v122Base=fn;window[name]=w;
  }
}

function chestObjectsV122(sc=sceneV122()){
  const s=gameState();if(!sc||!s)return [];
  let list=[];
  try{
    if(sc.kind==='town'&&typeof townObjects==='function')list=townObjects(sc,s.zone)||[];
    else if(sc.kind==='route'&&typeof routeObjects==='function')list=routeObjects(sc,s.zone)||[];
  }catch(_){list=[]}
  if(!Array.isArray(list)||!list.some(o=>o?.type==='chest'))list=Array.isArray(sc.objects)?sc.objects:[];
  const seen=new Set(),out=[];
  for(const o of list){
    if(!o||o.type!=='chest')continue;
    const key=String(o.id||`${Math.round(Number(o.x)||0)}:${Math.round(Number(o.y)||0)}`);
    if(seen.has(key))continue;seen.add(key);out.push(o);
  }
  return out;
}
function chestKeyV122(o){
  const s=gameState(),zone=s?.zone||'zone';
  return String(o?.id||`v122_chest_${zone}_${Math.round(Number(o?.x)||0)}_${Math.round(Number(o?.y)||0)}`);
}
function chestOpenedV122(o){
  const s=gameState();if(!s||!o)return false;const key=chestKeyV122(o);
  return o.opened===true||!!s.routeFindsV93?.[key]||!!s.routeFindsV93?.[o.id]||!!s.flags?.v122OpenedChests?.[key];
}
function markChestOpenedV122(o){
  const s=gameState();if(!s||!o)return;
  const key=chestKeyV122(o);o.opened=true;
  s.routeFindsV93=s.routeFindsV93&&typeof s.routeFindsV93==='object'?s.routeFindsV93:{};
  s.routeFindsV93[key]=true;if(o.id)s.routeFindsV93[o.id]=true;
  s.flags=s.flags&&typeof s.flags==='object'?s.flags:{};
  s.flags.v122OpenedChests=s.flags.v122OpenedChests&&typeof s.flags.v122OpenedChests==='object'?s.flags.v122OpenedChests:{};
  s.flags.v122OpenedChests[key]=true;
}
function chestCameraV122(sc){
  try{if(typeof camera==='function'){const c=camera(sc);if(c&&Number.isFinite(c.sx)&&Number.isFinite(c.sy))return c}}catch(_){}
  const s=gameState(),mw=sc?.width||1800,mh=sc?.height||1100;
  return {camX:Math.max(0,Math.min(Math.max(0,mw-1600),(s?.x||800)-800)),camY:Math.max(0,Math.min(Math.max(0,mh-1000),(s?.y||500)-500)),sx:960/1600,sy:600/1000};
}
function drawChestFallbackV122(o,cam,opened){
  try{
    if(typeof ctx==='undefined'||!ctx)return;
    const x=(o.x-cam.camX)*cam.sx,y=(o.y-cam.camY)*cam.sy,s=Math.max(.72,cam.sx/.6);
    ctx.save();ctx.translate(x,y);ctx.scale(s,s);
    ctx.fillStyle='rgba(0,0,0,.22)';ctx.beginPath();ctx.ellipse(0,13,25,8,0,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='#5b321e';ctx.strokeStyle='#2d1a13';ctx.lineWidth=3;ctx.beginPath();ctx.roundRect(-25,-8,50,29,5);ctx.fill();ctx.stroke();
    ctx.fillStyle='#b98638';ctx.fillRect(-4,-9,8,30);ctx.fillRect(-25,3,50,5);
    ctx.save();ctx.translate(0,-8);if(opened)ctx.rotate(-.55);
    ctx.fillStyle='#6d3b21';ctx.strokeStyle='#2d1a13';ctx.lineWidth=3;ctx.beginPath();ctx.roundRect(-25,-13,50,16,6);ctx.fill();ctx.stroke();
    ctx.fillStyle='#c79a4b';ctx.fillRect(-4,-13,8,16);ctx.restore();
    ctx.fillStyle='#d6ab55';ctx.strokeStyle='#4a331e';ctx.lineWidth=2;ctx.beginPath();ctx.roundRect(-6,5,12,13,3);ctx.fill();ctx.stroke();
    ctx.restore();
  }catch(_){}
}
function drawChestsV122(){
  try{
    if(typeof scene!=='undefined'&&scene!=='world')return;
    const sc=sceneV122();if(!sc)return;const cam=chestCameraV122(sc);
    for(const o of chestObjectsV122(sc)){
      let drawn=false;
      try{if(typeof drawObject==='function'){drawObject(o,cam.camX,cam.camY,cam.sx,cam.sy);drawn=true}}catch(_){}
      if(!drawn){
        try{if(typeof drawSprite==='function'){drawSprite('chest',o.dir||0,o.x,o.y,82,cam.camX,cam.camY,cam.sx,cam.sy,chestOpenedV122(o) ? .64 : 1);drawn=true}}catch(_){}
      }
      if(!drawn)drawChestFallbackV122(o,cam,chestOpenedV122(o));
    }
  }catch(e){console.warn('V122 rendu coffre',e)}
}
function facingV122(){const d=Number(gameState()?.dir)||0;return d===0?{x:0,y:1}:d===1?{x:-1,y:0}:d===2?{x:1,y:0}:{x:0,y:-1}}
function nearestChestV122(max=110){
  const s=gameState(),sc=sceneV122();if(!s||!sc)return null;const v=facingV122();let best=null,score=Infinity;
  for(const o of chestObjectsV122(sc)){
    const dx=Number(o.x)-Number(s.x),dy=Number(o.y)-Number(s.y),d=Math.hypot(dx,dy);if(d>max)continue;
    const dot=d?((dx/d)*v.x+(dy/d)*v.y):1;if(d>30&&dot<-.08)continue;
    const rank=d+(1-dot)*24;if(rank<score){score=rank;best=o}
  }
  return best;
}
function fallbackOpenChestV122(o){
  const s=gameState();if(!s||!o)return false;
  if(chestOpenedV122(o)){try{toast('Ce coffre est déjà vide.')}catch(_){}return true}
  markChestOpenedV122(o);
  try{if(typeof ensureInventoryV81==='function')ensureInventoryV81(s)}catch(_){}
  s.inventory=s.inventory&&typeof s.inventory==='object'?s.inventory:{};
  const m=String(s.zone||'').match(/(\d+)/),routeIndex=Number(o.routeIndex??(m?m[1]:0))||0;
  const money=35+(routeIndex%5)*15,item=routeIndex%3===0?'SuperPotion':routeIndex%3===1?'Orbe':'Antidote';
  s.money=(Number(s.money)||0)+money;s.inventory[item]=(Number(s.inventory[item])||0)+1;
  try{save(false)}catch(_){}try{hud()}catch(_){}
  const label=(()=>{try{return SHOP_ITEMS?.[item]?.label||item}catch(_){return item}})();
  try{dialog(`<b>Coffre ouvert !</b><br>Tu récupères <b>${money} Voltrons</b> et <b>1 ${label}</b>.`)}catch(_){try{toast(`Coffre : +${money} Voltrons, +1 ${label}`)}catch(__){}}
  return true;
}
function interactChestV122(max=110){
  const candidate=nearestChestV122(max);if(!candidate)return false;
  if(chestOpenedV122(candidate)){try{toast('Ce coffre est déjà vide.')}catch(_){}return true}
  try{
    if(typeof interactFind==='function'&&candidate.id){
      interactFind(candidate);
      if(chestOpenedV122(candidate)||gameState()?.routeFindsV93?.[candidate.id]){markChestOpenedV122(candidate);return true}
    }
  }catch(e){console.warn('V122 interaction coffre historique',e)}
  return fallbackOpenChestV122(candidate);
}
function installChestRepair(){
  const bridge={version:'V122.1-CHEST',ownedByV118:true,near:max=>!!nearestChestV122(max),interact:interactChestV122,drawNow:drawChestsV122,objects:()=>chestObjectsV122(sceneV122())};
  window.ValdoraChestV118Bridge=bridge;return bridge;
}
function tryChestV122(max=145){
  if(typeof scene==='undefined'||scene!=='world')return false;
  try{
    if(sceneV122()?.kind==='route'&&typeof nearRouteObjectV93==='function'&&typeof searchRouteObjectV93==='function'){
      const o=nearRouteObjectV93();if(o?.type==='chest'){searchRouteObjectV93(o);return true}
    }
  }catch(e){console.warn('V122 coffre V93',e)}
  try{return !!window.ValdoraChestV118Bridge?.interact?.(max)}catch(e){console.warn('V122 coffre bridge',e);return false}
}
function installChestInteractionHookV122(){
  const fn=window.interact;if(typeof fn!=='function')return false;
  if(fn.__v122ChestRepair)return true;
  const base=fn;
  const w=function(){try{if(tryChestV122(145))return true}catch(e){console.warn('V122 coffre final',e)}return base.apply(this,arguments)};
  w.__v122ChestRepair=true;w.__v122Base=base;window.interact=w;try{interact=w}catch(_){}return true;
}

let npcPatrolStartedV122=false,npcPatrolLastV122=0;
function worldNpcListV122(sc){return Array.isArray(sc?.v118Citizens)?sc.v118Citizens.filter(n=>n&&(n.v118Generated===true||n.v121Roamer===true)): []}
function patrolSlotsV122(sc,n){
  const slots=Array.isArray(sc?._v118SpawnSlots?.list)?sc._v118SpawnSlots.list:[],a={x:Number(n.x),y:Number(n.y)},node=n._v118Node;
  const valid=slots.filter(q=>{const d=Math.hypot(Number(q.x)-a.x,Number(q.y)-a.y);return d>=90&&d<=300});
  const aligned=valid.filter(q=>Math.abs(Number(q.x)-a.x)<=38||Math.abs(Number(q.y)-a.y)<=38),sameNode=aligned.filter(q=>node&&q.nodeKey===node);
  return sameNode.length?sameNode:aligned.length?aligned:valid;
}
function initNpcPatrolV122(n,sc){
  if(n._v122Patrol?.a&&n._v122Patrol?.b)return n._v122Patrol;
  const a={x:Number(n.x),y:Number(n.y)},free=n._v118FreeTarget;let b=null;
  if(free&&Number.isFinite(Number(free.x))&&Number.isFinite(Number(free.y))){const d=Math.hypot(Number(free.x)-a.x,Number(free.y)-a.y);if(d>=70&&d<=330)b={x:Number(free.x),y:Number(free.y)}}
  if(!b){const slots=patrolSlotsV122(sc,n);if(slots.length){const q=slots[hashV122(`${n.id}|${n.name}|patrol`)%slots.length];b={x:Number(q.x),y:Number(q.y)}}}
  if(!b)return null;
  n.stationaryV118=true;n._v118FreeTarget=null;n._v118Target=null;n._v122Patrol={a,b,toB:true,waitUntil:performance.now()+120+(hashV122(n.id)%380)};return n._v122Patrol;
}
function npcPointSafeV122(sc,n,x,y,people){
  if(x<28||y<28||x>(sc.width||1800)-28||y>(sc.height||1100)-28)return false;
  if((sc.buildings||[]).some(b=>x>b.x-24&&x<b.x+b.w+24&&y>b.y-20&&y<b.y+b.h+30))return false;
  if((sc.v105dTrees||[]).some(t=>Math.hypot(x-t.x,y-t.y)<40*(t.s||1)))return false;
  if((people||[]).some(o=>o!==n&&Math.hypot(x-Number(o.x),y-Number(o.y))<30))return false;
  return true;
}
function tickNpcPatrolV122(now){
  if(!npcPatrolStartedV122)return;
  const dt=npcPatrolLastV122?Math.min(.05,Math.max(.001,(now-npcPatrolLastV122)/1000)):.016;npcPatrolLastV122=now;
  try{
    if(typeof scene==='undefined'||scene!=='world'){requestAnimationFrame(tickNpcPatrolV122);return}
    const sc=sceneV122();if(!sc||sc.kind!=='town'){requestAnimationFrame(tickNpcPatrolV122);return}
    const people=worldNpcListV122(sc);
    for(const n of people){
      n.stationaryV118=true;
      const p=initNpcPatrolV122(n,sc);if(!p){n.moving=false;continue}
      if(Date.now()<Number(n._v118PauseUntil||0)||now<Number(p.waitUntil||0)){n.moving=false;continue}
      const target=p.toB?p.b:p.a,dx=target.x-Number(n.x),dy=target.y-Number(n.y),d=Math.hypot(dx,dy);
      if(d<1.8){n.x=target.x;n.y=target.y;n.moving=false;p.toB=!p.toB;p.waitUntil=now+220+(hashV122(`${n.id}|${p.toB?'A':'B'}`)%680);continue}
      const speed=34+(hashV122(n.id)%17),step=Math.min(d,speed*dt),nx=Number(n.x)+dx/d*step,ny=Number(n.y)+dy/d*step;
      if(!npcPointSafeV122(sc,n,nx,ny,people)){n.moving=false;p.toB=!p.toB;p.waitUntil=now+260+(hashV122(`${n.id}|blocked`)%420);continue}
      n.dir=Math.abs(dx)>Math.abs(dy)?(dx<0?1:2):(dy>0?0:3);n.x=nx;n.y=ny;n.moving=true;
    }
  }catch(e){console.warn('V122 patrouille PNJ',e)}
  requestAnimationFrame(tickNpcPatrolV122);
}
function installNpcPatrolRepair(){if(npcPatrolStartedV122)return;npcPatrolStartedV122=true;npcPatrolLastV122=performance.now();requestAnimationFrame(tickNpcPatrolV122)}
function npcPatrolAuditV122(){const sc=sceneV122(),people=worldNpcListV122(sc);return {active:npcPatrolStartedV122,zone:gameState()?.zone||null,roamers:people.length,paired:people.filter(n=>n._v122Patrol?.a&&n._v122Patrol?.b).length}}

function reassertRepairs(){
  const v=window.ValdoraGameplayV109W;
  try{v?.install?.()}catch(e){console.warn('V122 réinstallation V109W',e)}
  try{v?.completeTemple?.()}catch(_){}
  try{v?.configureSimdor?.()}catch(_){}
  try{v?.ensureVolAgent?.()}catch(_){}
  try{v?.ensureTaronisLinkV109Y?.()}catch(_){}
  try{v?.ensureLateQuestNpcs?.()}catch(_){}
  try{window.ValdoraCycleV119?.repair?.()}catch(e){console.warn('V122 réparation vélo',e)}
  try{if(window.ValdoraBusV118Bridge)window.ValdoraBusV118Bridge.ownedByV118=true}catch(_){}
  try{if(window.ValdoraChestV118Bridge)window.ValdoraChestV118Bridge.ownedByV118=true}catch(_){}
}
function trackBattleParticipant(){
  try{
    if(typeof scene==='undefined'||scene!=='battle'||typeof battle==='undefined'||!battle)return;
    const a=typeof active==='function'?active():null;if(!a)return;
    battle._v122Participants=Array.isArray(battle._v122Participants)?battle._v122Participants:[];
    if(!battle._v122Participants.includes(a))battle._v122Participants.push(a);
  }catch(_){}
}
function install(){
  try{reassertRepairs()}catch(_){}
  try{installCreatorMode()}catch(e){console.warn('V122 mode créateur',e)}
  try{installProgressionRepair()}catch(e){console.warn('V122 progression',e)}
  try{installChestRepair();installChestInteractionHookV122()}catch(e){console.warn('V122 coffres',e)}
  try{installNpcPatrolRepair()}catch(e){console.warn('V122 PNJ',e)}
  try{document.documentElement.dataset.valdoraVersion=VERSION;document.documentElement.dataset.valdoraLastMile=LAST_MILE}catch(_){}
}
function audit(){
  const s=gameState(),all=species(),boxIds=new Set((s?.box||[]).map(m=>Number(m?.id))),missingBox=all.filter(c=>!boxIds.has(Number(c.id))).map(c=>c.id),missingDex=all.filter(c=>!s?.dex?.[c.id]?.caught).map(c=>c.id);
  let citadel=null,v109=null;try{citadel=window.v106pCitadelRequirements?.()}catch(_){}try{v109=window.ValdoraGameplayV109W?.audit?.()}catch(_){}
  return {version:VERSION,patch:LAST_MILE,creator:creatorModeV122(),species:all.length,dexMissing:missingDex,pcMissing:missingBox,citadel,v109,world:{chestBridge:window.ValdoraChestV118Bridge?.version||null,chestHook:!!window.interact?.__v122ChestRepair,chests:chestObjectsV122().length,npcPatrol:npcPatrolAuditV122()}};
}
window.ValdoraRegressionV122={version:VERSION,patch:LAST_MILE,install,audit,ensureCreatorCompletion,creatorMode:creatorModeV122,repairChests:installChestRepair,repairNpcPatrol:installNpcPatrolRepair,tryChest:tryChestV122};
setInterval(trackBattleParticipant,120);
setInterval(()=>{try{installChestInteractionHookV122();if(window.ValdoraChestV118Bridge)window.ValdoraChestV118Bridge.ownedByV118=true}catch(_){}},900);
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>{install();setTimeout(install,500);setTimeout(install,2000);setTimeout(install,6000)});else{install();setTimeout(install,500);setTimeout(install,2000);setTimeout(install,6000)}
})();
