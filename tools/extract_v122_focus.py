from pathlib import Path

ROOT=Path('.')
GAME=ROOT/'game'

V122_JS=r'''// VALDORA V122 — correctifs finaux de régression, mode créateur et progression
(function(){
'use strict';
const VERSION='V122';

function creatorModeV122(){
  try{return /CREATEUR/i.test(location.pathname)||window.CREATOR_MODE===true||window.creatorMode===true||(typeof v61CreatorMode==='function'&&v61CreatorMode())}catch(_){return false}
}
function gameState(){try{return typeof state!=='undefined'&&state&&typeof state==='object'?state:null}catch(_){return null}}
function species(){try{return Array.isArray(CREATURES)?CREATURES:[]}catch(_){return []}}
function speciesCount(){const a=species();return a.length||169}
function legalLevel(id){try{return Math.max(1,Number(window.ValdoraCombatV105R?.minimumLegalLevel?.(id))||1)}catch(_){return 1}}
function creatorMon(c){
  const lvl=Math.max(5,legalLevel(c.id));
  try{if(typeof mon==='function'){const m=mon(c.id,lvl);if(m){m._v122CreatorStock=true;return m}}}catch(_){}
  let moves=[];try{if(typeof defaultMoves==='function')moves=defaultMoves(c.id,lvl)||[]}catch(_){}
  return {id:c.id,level:lvl,xp:0,hp:1,moves,_v122CreatorStock:true}
}
function ensureCreatorCompletion(){
  if(!creatorModeV122())return false;const s=gameState(),all=species();if(!s||!all.length)return false;
  s.dex=s.dex&&typeof s.dex==='object'?s.dex:{};s.box=Array.isArray(s.box)?s.box:[];s.flags=s.flags&&typeof s.flags==='object'?s.flags:{};
  const boxIds=new Set(s.box.map(m=>Number(m?.id)).filter(Number.isFinite));
  for(const c of all){const id=Number(c?.id);if(!Number.isFinite(id))continue;s.dex[id]={...(s.dex[id]||{}),seen:true,caught:true};if(!boxIds.has(id)){s.box.push(creatorMon(c));boxIds.add(id)}}
  s.flags.v122CreatorComplete=true;return true
}
function wrapCreatorMenu(name){
  const fn=window[name];if(typeof fn!=='function'||fn.__v122CreatorMenu)return;
  const w=function(){ensureCreatorCompletion();return fn.apply(this,arguments)};w.__v122CreatorMenu=true;w.__v122Base=fn;window[name]=w
}
function creatorAware(name,creatorValue){
  const fn=window[name];if(typeof fn==='function'&&fn.__v122CreatorAware)return;
  const base=typeof fn==='function'?fn:null;
  const w=function(){if(creatorModeV122())return typeof creatorValue==='function'?creatorValue.apply(this,arguments):creatorValue;return base?base.apply(this,arguments):undefined};
  w.__v122CreatorAware=true;w.__v122Base=base;window[name]=w
}
function installCreatorMode(){
  ensureCreatorCompletion();
  ['openPC','openDex','openCodex','openEcladex','openDexV83','openCodexV106Z'].forEach(wrapCreatorMenu);
  creatorAware('v108mSeal5Beaten',true);
  creatorAware('v108mCanUseVolNow',true);
  creatorAware('v106pHasVolMastery',true);
  creatorAware('v106pCitadelRequirements',()=>({caught:speciesCount(),seals:7,vol:true,ready:true,creator:true}));
  creatorAware('finalTempleAvailableV77',true);
  creatorAware('v83CitadelGateText','La Citadelle est accessible — mode créateur.');
}
function pendingRoad(route){try{return window.ValdoraGameplayV109W?.pendingRoadTrainers?.(route)||[]}catch(_){return []}}
function installProgressionRepair(){
  const pg=window.playerQuestGateMessage;
  if(typeof pg==='function'&&!pg.__v122Gate){
    const w=function(from,to){
      if(creatorModeV122())return null;let msg=pg.apply(this,arguments);if(!msg)return msg;
      const text=String(msg);
      if(/^route/.test(String(from))&&/dresseur|quête sur cette route|route n.est pas encore terminée/i.test(text)){
        const left=pendingRoad(from);return left.length?`Avant de continuer, bats les ${left.length} dresseur${left.length>1?'s':''} de route encore présent${left.length>1?'s':''}.`:null
      }
      if(from==='town12'&&/mission|quête/i.test(text))return null;
      if(from==='town14'&&to!=='temple_final'&&/7\s*sceaux|sceau|gardien/i.test(text))return null;
      if(to==='town13'&&/team\s*taron|mission|quête/i.test(text))return null;
      if(from==='town6'&&to==='route_littoral'&&/mission|quête/i.test(text))return null;
      return msg
    };w.__v122Gate=true;w.__v122Base=pg;window.playerQuestGateMessage=w;try{playerQuestGateMessage=w}catch(_){}
  }
  const rg=window.v107kRouteGate;
  if(typeof rg==='function'&&!rg.__v122Gate){
    const w=function(from,to){if(creatorModeV122())return null;let msg=rg.apply(this,arguments);if(msg&&/^route/.test(String(from))&&/dresseur|quête|route n.est pas encore terminée/i.test(String(msg))){const left=pendingRoad(from);if(!left.length)return null}return msg};
    w.__v122Gate=true;w.__v122Base=rg;window.v107kRouteGate=w;try{v107kRouteGate=w}catch(_){}
  }
}
function reassertRepairs(){
  try{window.ValdoraGameplayV109W?.install?.()}catch(e){console.warn('V122 réinstallation V109W',e)}
  try{window.ValdoraCycleV119?.repair?.()}catch(e){console.warn('V122 réparation vélo',e)}
  try{if(window.ValdoraBusV118Bridge)window.ValdoraBusV118Bridge.ownedByV118=true}catch(_){}
}
function install(){
  try{reassertRepairs()}catch(_){};
  try{installCreatorMode()}catch(e){console.warn('V122 mode créateur',e)}
  try{installProgressionRepair()}catch(e){console.warn('V122 progression',e)}
  try{document.documentElement.dataset.valdoraVersion=VERSION}catch(_){}
}
function audit(){
  const s=gameState(),all=species(),boxIds=new Set((s?.box||[]).map(m=>Number(m?.id))),missingBox=all.filter(c=>!boxIds.has(Number(c.id))).map(c=>c.id),missingDex=all.filter(c=>!s?.dex?.[c.id]?.caught).map(c=>c.id);
  let citadel=null,v109=null;try{citadel=window.v106pCitadelRequirements?.()}catch(_){}try{v109=window.ValdoraGameplayV109W?.audit?.()}catch(_){}
  return {version:VERSION,creator:creatorModeV122(),species:all.length,dexMissing:missingDex,pcMissing:missingBox,citadel,v109}
}
window.ValdoraRegressionV122={version:VERSION,install,audit,ensureCreatorCompletion,creatorMode:creatorModeV122};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>{install();setTimeout(install,500);setTimeout(install,2000);setTimeout(install,6000)});else{install();setTimeout(install,500);setTimeout(install,2000);setTimeout(install,6000)}
})();
'''

def read(path): return path.read_text(encoding='utf-8')
def write(path,text): path.write_text(text,encoding='utf-8')
def replace_exact(text,old,new,label,count=None):
    n=text.count(old)
    if count is not None and n!=count: raise SystemExit(f'{label}: attendu {count}, trouvé {n}')
    if n==0: raise SystemExit(f'{label}: motif absent')
    return text.replace(old,new),n

def function_block(text,name):
    anchor=f'function {name}('
    start=text.find(anchor)
    if start<0: raise SystemExit(f'fonction {name} absente')
    brace=text.find('{',start)
    if brace<0: raise SystemExit(f'accolade {name} absente')
    depth=0;quote=None;esc=False;line=False;block=False;i=brace
    while i<len(text):
        c=text[i];n=text[i+1] if i+1<len(text) else ''
        if line:
            if c=='\n': line=False
            i+=1;continue
        if block:
            if c=='*' and n=='/': block=False;i+=2;continue
            i+=1;continue
        if quote:
            if esc: esc=False
            elif c=='\\': esc=True
            elif c==quote: quote=None
            i+=1;continue
        if c=='/' and n=='/': line=True;i+=2;continue
        if c=='/' and n=='*': block=True;i+=2;continue
        if c in "'\"`": quote=c;i+=1;continue
        if c=='{': depth+=1
        elif c=='}':
            depth-=1
            if depth==0:return start,i+1
        i+=1
    raise SystemExit(f'fonction {name} non terminée')

def replace_function(text,name,new):
    a,b=function_block(text,name);return text[:a]+new+text[b:]

# 1. Couche finale V122.
write(GAME/'V122_REGRESSION_FIXES.js',V122_JS)

# 2. Distances d'interaction : moteur de référence ancien.
p=GAME/'V105Y_REFERENCE_INTERIEURS.js';t=read(p)
t,_=replace_exact(t,'const reach=58,','const reach=42,','V105Y portée meuble',1)
t,_=replace_exact(t,'return best&&bd<78?best:null;','return best&&bd<40?best:null;','V105Y seuil meuble',1)
t,_=replace_exact(t,'return best&&bd<88?best:null','return best&&bd<68?best:null','V105Y seuil PNJ',1)
write(p,t)

# 3. Distances d'interaction : moteur intérieur actuellement actif.
p=GAME/'V109V_INTERIEUR_REWRITE.js';t=read(p)
t,_=replace_exact(t,'targetMetrics(n.x,n.y,68)','targetMetrics(n.x,n.y,56)','V109V PNJ',1)
t,_=replace_exact(t,'function nearFurniture(max=72)','function nearFurniture(max=52)','V109V meuble API',1)
t,_=replace_exact(t,'nearestFurnitureWithDistance(72)','nearestFurnitureWithDistance(52)','V109V meuble interaction',1)
write(p,t)

# 4. Monde vivant : PNJ et arrêt de bus à portée réaliste, sans toucher au correctif anti-téléportation/coffres.
p=GAME/'VALDORA_LIVING_WORLD_V118.js';t=read(p)
t,_=replace_exact(t,'if(d>94)continue;','if(d>72)continue;','V118 PNJ extérieur',1)
t,_=replace_exact(t,'return best&&bd<=102?best:null','return best&&bd<=68?best:null','V118 PNJ intérieur',1)
t=t.replace('bus.near?.(125)','bus.near?.(110)')
if 'worldInteractV118.__v107dInteract=true;worldInteractV118.__v118StableInteract=true;' not in t: raise SystemExit('marqueur interaction coffre V118 perdu')
write(p,t)

TARON_NEW="""function startTaronBattle(){
  const ts=ensureTaronState(),a=ts.active;if(!a)return;
  const ri=Math.max(0,+String(state.zone||'').replace('route','')||0);
  const avg=Math.max(6,Math.round((state.team||[]).reduce((s,m)=>s+(Number(m?.level)||0),0)/Math.max(1,(state.team||[]).length)));
  const base=Math.max(7,Math.min(76,Math.max(7+ri*4,avg))),count=Math.min(5,Math.max(2,2+Math.floor(ri/3))),party=[];
  for(let i=0;i<count;i++){
    const lvl=Math.min(78,base+Math.floor(i/2)),idx=Math.min(CREATURES.length-1,8+ri*11+((i*17+ri*7)%12)),c=CREATURES[idx]||CREATURES[8]||CREATURES[0],m=mon(c.id,lvl);
    m.moves=defaultMoves(m.id,m.level);party.push(m)
  }
  const trainer={id:'taron_'+Date.now(),level:party[0]?.level||base,dialog:'Un agent de la Team Taron',taron:true,party,partyIndex:0};
  startBattle(party[0],trainer)
}"""

# 5. Gros HTML joueur + créateur : bus, Team Taron, chargement V122.
for name in ['index.html','CREATEUR.html']:
    p=GAME/name;t=read(p)
    old="{id:'B',name:'Ligne des Monts',stops:['town3','town8','town5','town6']}"
    new="{id:'B',name:'Ligne des Monts',stops:['town3','route_simdor','town8','town5','town6']}"
    t,_=replace_exact(t,old,new,f'{name} ligne bus Monts',1)
    old="if(!sc||sc.kind!=='town')return null;const h=healer(sc);if(!h)return null;"
    new="""if(!sc||sc.kind!=='town')return null;const h=healer(sc);if(!h){
  const w=Number(sc.width)||1800,hh=Number(sc.height)||1100;let x=Math.max(180,w*.18),y=Math.max(180,hh*.78);
  try{if(typeof nearestRoad==='function'&&sc.v105dRoad?.size){const q=nearestRoad(sc,x,y);if(q){x=q.x+70;y=q.y}}}catch(_){}
  return {id:`${zone}_bus_v122`,type:'bus',x:Math.max(78,Math.min(w-78,x)),y:Math.max(82,Math.min(hh-58,y)),roadY:y,curbSide:-1,dir:'front'}
}"
    t,_=replace_exact(t,old,new,f'{name} arrêt bus sans centre',1)
    t=t.replace('near(b,125)&&window.ValdoraGameplayV106Y?.openBus','near(b,110)&&window.ValdoraGameplayV106Y?.openBus')
    t=replace_function(t,'startTaronBattle',TARON_NEW)
    if 'V122_REGRESSION_FIXES.js' not in t:
        pos=t.rfind('</body>')
        if pos<0: raise SystemExit(f'{name}: </body> absent')
        t=t[:pos]+'<script src="V122_REGRESSION_FIXES.js?v=122-regression-1"></script>\n'+t[pos:]
    if name=='CREATEUR.html':
        t,_=replace_exact(t,"const SAVE='valdora_v41_player';","const SAVE='valdora_v41_creator';",'sauvegarde créateur séparée',1)
        t,_=replace_exact(t,'const PLAYER_PROGRESSION_LOCK=true;','const PLAYER_PROGRESSION_LOCK=false;','verrou progression créateur',1)
    write(p,t)

# Vérifications statiques finales.
for name in ['index.html','CREATEUR.html']:
    t=read(GAME/name)
    assert t.count('V122_REGRESSION_FIXES.js')==1,name
    assert "'route_simdor','town8'" in t,name
    assert 'party,partyIndex:0' in t,name
    assert '_bus_v122' in t,name
assert "const SAVE='valdora_v41_creator';" in read(GAME/'CREATEUR.html')
assert 'const PLAYER_PROGRESSION_LOCK=false;' in read(GAME/'CREATEUR.html')
assert 'if(d>72)continue;' in read(GAME/'VALDORA_LIVING_WORLD_V118.js')
assert 'bd<=68' in read(GAME/'VALDORA_LIVING_WORLD_V118.js')
assert 'worldInteractV118.__v107dInteract=true;worldInteractV118.__v118StableInteract=true;' in read(GAME/'VALDORA_LIVING_WORLD_V118.js')
print('V122 patch prepared successfully')
