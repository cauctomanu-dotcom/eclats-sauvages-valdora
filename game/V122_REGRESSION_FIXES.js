// VALDORA V122 — correctifs finaux de régression, créateur et progression
(function(){
'use strict';
const VERSION='V122';

function creatorModeV122(){
  try{return /CREATEUR/i.test(location.pathname)||window.CREATOR_MODE===true||window.creatorMode===true||(typeof v61CreatorMode==='function'&&v61CreatorMode())}catch(_){return false}
}
function gameState(){try{return typeof state!=='undefined'&&state&&typeof state==='object'?state:null}catch(_){return null}}
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
  // Certaines anciennes sauvegardes utilisent boxes=[[]] pour le stockage PC.
  if(Array.isArray(s.boxes)){
    if(!s.boxes.length)s.boxes.push([]);
    const target=Array.isArray(s.boxes[0])?s.boxes[0]:s.boxes;
    for(const c of all)addToFlatBox(target,c);
  }
  // Conditions Citadelle : le créateur est considéré comme ayant tout accompli.
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
  try{document.documentElement.dataset.valdoraVersion=VERSION}catch(_){}
}
function audit(){
  const s=gameState(),all=species(),boxIds=new Set((s?.box||[]).map(m=>Number(m?.id))),missingBox=all.filter(c=>!boxIds.has(Number(c.id))).map(c=>c.id),missingDex=all.filter(c=>!s?.dex?.[c.id]?.caught).map(c=>c.id);
  let citadel=null,v109=null;try{citadel=window.v106pCitadelRequirements?.()}catch(_){}try{v109=window.ValdoraGameplayV109W?.audit?.()}catch(_){}
  return {version:VERSION,creator:creatorModeV122(),species:all.length,dexMissing:missingDex,pcMissing:missingBox,citadel,v109};
}
window.ValdoraRegressionV122={version:VERSION,install,audit,ensureCreatorCompletion,creatorMode:creatorModeV122};
setInterval(trackBattleParticipant,120);
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>{install();setTimeout(install,500);setTimeout(install,2000);setTimeout(install,6000)});else{install();setTimeout(install,500);setTimeout(install,2000);setTimeout(install,6000)}
})();
