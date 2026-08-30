from pathlib import Path

ROOT=Path('.')
GAME=ROOT/'game'

V122_JS=r'''// VALDORA V122 — correctifs finaux de régression, créateur et progression
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
'''

def read(path): return path.read_text(encoding='utf-8')
def write(path,text): path.write_text(text,encoding='utf-8')

def replace_one(text,old,new,label):
    if old in text:return text.replace(old,new,1)
    if new in text:return text
    raise SystemExit(f'{label}: motif absent')

def replace_all_if_present(text,old,new):
    return text.replace(old,new) if old in text else text

def function_block(text,name):
    anchor=f'function {name}('
    start=text.find(anchor)
    if start<0: raise SystemExit(f'fonction {name} absente')
    brace=text.find('{',start)
    depth=0;quote=None;esc=False;line=False;block=False;i=brace
    while i<len(text):
        c=text[i];n=text[i+1] if i+1<len(text) else ''
        if line:
            if c=='\n':line=False
            i+=1;continue
        if block:
            if c=='*' and n=='/':block=False;i+=2;continue
            i+=1;continue
        if quote:
            if esc:esc=False
            elif c=='\\':esc=True
            elif c==quote:quote=None
            i+=1;continue
        if c=='/' and n=='/':line=True;i+=2;continue
        if c=='/' and n=='*':block=True;i+=2;continue
        if c in "'\"`":quote=c;i+=1;continue
        if c=='{':depth+=1
        elif c=='}':
            depth-=1
            if depth==0:return start,i+1
        i+=1
    raise SystemExit(f'fonction {name} non terminée')

def replace_function(text,name,new):
    a,b=function_block(text,name);return text[:a]+new+text[b:]

# 1) Couche V122.
write(GAME/'V122_REGRESSION_FIXES.js',V122_JS)

# 2) Portées d'interaction anciennes + Citadelle créateur.
p=GAME/'V105Y_REFERENCE_INTERIEURS.js';t=read(p)
t=replace_one(t,'const reach=58,','const reach=42,','V105Y portée meuble')
t=replace_one(t,'return best&&bd<78?best:null;','return best&&bd<40?best:null;','V105Y seuil meuble')
t=replace_one(t,'return best&&bd<88?best:null','return best&&bd<68?best:null','V105Y seuil PNJ')
old="function passageLocked(p){\n    if(INT.type!=='citadelle')return false;"
new="function passageLocked(p){\n    if((typeof v61CreatorMode==='function'&&v61CreatorMode())||INT.type!=='citadelle')return false;"
t=replace_one(t,old,new,'V105Y passages Citadelle créateur')
write(p,t)

# 3) Moteur intérieur actif : portée courte meubles / PNJ.
p=GAME/'V109V_INTERIEUR_REWRITE.js';t=read(p)
t=replace_one(t,'targetMetrics(n.x,n.y,68)','targetMetrics(n.x,n.y,56)','V109V PNJ')
t=replace_one(t,'function nearFurniture(max=72)','function nearFurniture(max=52)','V109V meuble API')
t=replace_one(t,'nearestFurnitureWithDistance(72)','nearestFurnitureWithDistance(52)','V109V meuble interaction')
write(p,t)

# 4) Monde vivant : interaction proche + Team Taron appelée explicitement avant les fallbacks.
p=GAME/'VALDORA_LIVING_WORLD_V118.js';t=read(p)
t=replace_one(t,'if(d>94)continue;','if(d>72)continue;','V118 PNJ extérieur')
t=replace_one(t,'return best&&bd<=102?best:null','return best&&bd<=68?best:null','V118 PNJ proche')
t=replace_all_if_present(t,'bus.near?.(125)','bus.near?.(110)')
needle="function worldInteractV118(){\n  if(typeof scene!=='undefined'&&scene==='world'){"
inject="""function worldInteractV118(){
  if(typeof scene!=='undefined'&&scene==='world'){
    // V122 : les agents Team Taron vivent sur les routes et ne font pas partie de nearWorldNpc().
    try{
      const taron=typeof currentTaronNPC==='function'?currentTaronNPC():null;
      const d=taron?Math.hypot(Number(state?.x||0)-Number(taron.x||0),Number(state?.y||0)-Number(taron.y||0)):Infinity;
      if(taron&&d<=72){
        try{if(typeof faceNPCToPlayer==='function')faceNPCToPlayer(taron)}catch(_){}
        if(typeof interactTaron==='function'){interactTaron(taron);return true}
      }
    }catch(e){console.warn('V122 interaction Team Taron',e)}"""
if 'V122 interaction Team Taron' not in t:
    if needle not in t:raise SystemExit('V118 point insertion Team Taron absent')
    t=t.replace(needle,inject,1)
if 'worldInteractV118.__v107dInteract=true;worldInteractV118.__v118StableInteract=true;' not in t:raise SystemExit('marqueur interaction V118 perdu')
write(p,t)

TARON_NEW="""function startTaronBattle(){
  const ts=ensureTaronState(),a=ts.active;if(!a)return;
  const ri=Math.max(0,+String(state.zone||'').replace('route','')||0);
  const avg=Math.max(6,Math.round((state.team||[]).reduce((s,m)=>s+(Number(m?.level)||0),0)/Math.max(1,(state.team||[]).length)));
  const base=Math.max(7,Math.min(76,Math.max(7+ri*4,avg))),count=Math.min(5,Math.max(2,2+Math.floor(ri/3))),party=[];
  const used=new Set();
  for(let i=0;i<count;i++){
    let idx=Math.min(CREATURES.length-1,8+ri*11+((i*17+ri*7)%Math.max(12,CREATURES.length-8)));
    while(used.has(idx)&&idx<CREATURES.length-1)idx++;used.add(idx);
    const lvl=Math.min(78,base+Math.floor(i/2)),c=CREATURES[idx]||CREATURES[8]||CREATURES[0],m=mon(c.id,lvl);
    m.moves=defaultMoves(m.id,m.level);party.push(m);
  }
  const trainer={id:'taron_'+Date.now(),level:party[0]?.level||base,dialog:'Un agent de la Team Taron',taron:true,party,partyIndex:0,partySize:party.length,partyMax:party.length};
  trainerEvent=trainer;
  battle={enemy:party[0],trainer,trainerEvent:trainer,party,partyIndex:0,eventQueue:[],_v122Participants:[]};
  try{startBattleEnemy()}catch(_){startBattle(party[0],trainer)}
}"""

XP_OLD="""const ev=gainXP(a,xp);
  battle.eventQueue.push(BY[a.id].name+' gagne '+xp+' EXP.',...ev);"""
XP_NEW="""battle._v122Participants=Array.isArray(battle._v122Participants)?battle._v122Participants:[];
  if(a&&!battle._v122Participants.includes(a))battle._v122Participants.push(a);
  const participants=[...new Set(battle._v122Participants)].filter(Boolean);
  for(const p of participants){
    const ev=gainXP(p,xp);
    battle.eventQueue.push(BY[p.id].name+' gagne '+xp+' EXP.',...ev);
  }"""

# 5) HTML joueur et créateur : Team Taron multi-éclats, XP participation, bus et chargement V122.
for name in ['index.html','CREATEUR.html']:
    p=GAME/name;t=read(p)
    old="{id:'B',name:'Ligne des Monts',stops:['town3','town8','town5','town6']}"
    new="{id:'B',name:'Ligne des Monts',stops:['town3','route_simdor','town8','town5','town6']}"
    t=replace_one(t,old,new,f'{name} ligne bus Monts')

    old="if(!sc||sc.kind!=='town')return null;const h=healer(sc);if(!h)return null;"
    new="""if(!sc||sc.kind!=='town')return null;const h=healer(sc);if(!h){
  const w=Number(sc.width)||1800,hh=Number(sc.height)||1100;let x=Math.max(180,w*.18),y=Math.max(180,hh*.78);
  try{if(typeof nearestRoad==='function'&&sc.v105dRoad?.size){const q=nearestRoad(sc,x,y);if(q){x=q.x+70;y=q.y}}}catch(_){}
  return {id:`${zone}_bus_v122`,type:'bus',x:Math.max(78,Math.min(w-78,x)),y:Math.max(82,Math.min(hh-58,y)),roadY:y,curbSide:-1,dir:'front'};
}"""
    t=replace_one(t,old,new,f'{name} arrêt bus sans centre')
    t=replace_all_if_present(t,'near(b,125)&&window.ValdoraGameplayV106Y?.openBus','near(b,110)&&window.ValdoraGameplayV106Y?.openBus')
    t=replace_function(t,'startTaronBattle',TARON_NEW)
    if XP_NEW not in t:
        if XP_OLD not in t:raise SystemExit(f'{name}: bloc XP enemyKO absent')
        t=t.replace(XP_OLD,XP_NEW,1)
    if 'V122_REGRESSION_FIXES.js' not in t:
        pos=t.rfind('</body>')
        if pos<0:raise SystemExit(f'{name}: </body> absent')
        t=t[:pos]+'<script src="V122_REGRESSION_FIXES.js?v=122-regression-2"></script>\n'+t[pos:]
    if name=='CREATEUR.html':
        t=replace_one(t,"const SAVE='valdora_v41_player';","const SAVE='valdora_v41_creator';",'sauvegarde créateur séparée')
        t=replace_one(t,'const PLAYER_PROGRESSION_LOCK=true;','const PLAYER_PROGRESSION_LOCK=false;','verrou progression créateur')
    write(p,t)

# Vérifications statiques finales.
for name in ['index.html','CREATEUR.html']:
    t=read(GAME/name)
    assert t.count('V122_REGRESSION_FIXES.js')==1,name
    assert "'route_simdor','town8'" in t,name
    assert 'party,partyIndex:0' in t,name
    assert '_v122Participants' in t,name
    assert '_bus_v122' in t,name
assert "const SAVE='valdora_v41_creator';" in read(GAME/'CREATEUR.html')
assert 'const PLAYER_PROGRESSION_LOCK=false;' in read(GAME/'CREATEUR.html')
live=read(GAME/'VALDORA_LIVING_WORLD_V118.js')
assert 'V122 interaction Team Taron' in live
assert 'if(d>72)continue;' in live and 'bd<=68' in live
assert 'worldInteractV118.__v107dInteract=true;worldInteractV118.__v118StableInteract=true;' in live
legacy=read(GAME/'V105Y_REFERENCE_INTERIEURS.js')
assert 'const reach=42,' in legacy and 'bd<40' in legacy and 'bd<68' in legacy
assert "v61CreatorMode==='function'&&v61CreatorMode()" in legacy
interior=read(GAME/'V109V_INTERIEUR_REWRITE.js')
assert 'function nearFurniture(max=52)' in interior and 'targetMetrics(n.x,n.y,56)' in interior
print('V122 patch prepared successfully')
