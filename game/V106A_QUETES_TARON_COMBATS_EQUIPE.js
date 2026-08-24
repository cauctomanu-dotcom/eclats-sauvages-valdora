// ============================================================================
// VALDORA V106A — QUÊTES VILLAGEOISES, TEAM TARON, PORTRAITS ÉQUIPE
// Le calcul des dégâts V106A est intégré directement au moteur V105U dans JEU.html.
// ============================================================================
(()=>{
'use strict';

const VERSION='V106A';
const PORTRAITS={"1":"assets/creatures/001_Florin/front.png","2":"assets/creatures/002_Floror/front.png","3":"assets/creatures/003_Florex/front.png","4":"assets/creatures/004_Pyroin/front.png","5":"assets/creatures/005_Pyroor/front.png","6":"assets/creatures/006_Pyroex/front.png","7":"assets/creatures/007_Aquain/front.png","8":"assets/creatures/008_Aquaor/front.png","9":"assets/creatures/009_Aquaex/front.png","10":"assets/creatures/010_Voltin/front.png","11":"assets/creatures/011_Voltor/front.png","12":"assets/creatures/012_Voltex/front.png","13":"assets/creatures/013_Noctin/front.png","14":"assets/creatures/014_Noctor/front.png","15":"assets/creatures/015_Noctex/front.png","16":"assets/creatures/016_Rocin/front.png","17":"assets/creatures/017_Rocor/front.png","18":"assets/creatures/018_Rocex/front.png","19":"assets/creatures/019_Zephin/front.png","20":"assets/creatures/020_Zephor/front.png","21":"assets/creatures/021_Zephex/front.png","22":"assets/creatures/022_Myrin/front.png","23":"assets/creatures/023_Myror/front.png","24":"assets/creatures/024_Myrex/front.png","25":"assets/creatures/025_Cervin/front.png","26":"assets/creatures/026_Cervor/front.png","27":"assets/creatures/027_Cervex/front.png","28":"assets/creatures/028_Brumin/front.png","29":"assets/creatures/029_Brumor/front.png","30":"assets/creatures/030_Brumex/front.png","31":"assets/creatures/031_Solarin/front.png","32":"assets/creatures/032_Solaror/front.png","33":"assets/creatures/033_Solarex/front.png","34":"assets/creatures/034_Cryoin/front.png","35":"assets/creatures/035_Cryoor/front.png","36":"assets/creatures/036_Cryoex/front.png","37":"assets/creatures/037_Lunain/front.png","38":"assets/creatures/038_Lunaor/front.png","39":"assets/creatures/039_Lunaex/front.png","40":"assets/creatures/040_Terrain/front.png","41":"assets/creatures/041_Terraor/front.png","42":"assets/creatures/042_Terraex/front.png","43":"assets/creatures/043_Fulgin/front.png","44":"assets/creatures/044_Fulgor/front.png","45":"assets/creatures/045_Fulgex/front.png","46":"assets/creatures/046_Sylvin/front.png","47":"assets/creatures/047_Sylvor/front.png","48":"assets/creatures/048_Sylvex/front.png","49":"assets/creatures/049_Coralin/front.png","50":"assets/creatures/050_Coralor/front.png","51":"assets/creatures/051_Coralex/front.png","52":"assets/creatures/052_Cendrin/front.png","53":"assets/creatures/053_Cendror/front.png","54":"assets/creatures/054_Cendrex/front.png","55":"assets/creatures/055_Onyxin/front.png","56":"assets/creatures/056_Onyxor/front.png","57":"assets/creatures/057_Onyxex/front.png","58":"assets/creatures/058_Azurin/front.png","59":"assets/creatures/059_Azuror/front.png","60":"assets/creatures/060_Azurex/front.png","61":"assets/creatures/061_Nivin/front.png","62":"assets/creatures/062_Nivor/front.png","63":"assets/creatures/063_Nivex/front.png","64":"assets/creatures/064_Muscin/front.png","65":"assets/creatures/065_Muscor/front.png","66":"assets/creatures/066_Muscex/front.png","67":"assets/creatures/067_Runain/front.png","68":"assets/creatures/068_Runaor/front.png","69":"assets/creatures/069_Runaex/front.png","70":"assets/creatures/070_Aeroin/front.png","71":"assets/creatures/071_Aeroor/front.png","72":"assets/creatures/072_Aeroex/front.png","73":"assets/creatures/073_Dunain/front.png","74":"assets/creatures/074_Dunaor/front.png","75":"assets/creatures/075_Dunaex/front.png","76":"assets/creatures/076_Prismin/front.png","77":"assets/creatures/077_Prismor/front.png","78":"assets/creatures/078_Prismex/front.png","79":"assets/creatures/079_Sporain/front.png","80":"assets/creatures/080_Sporaor/front.png","81":"assets/creatures/081_Sporaex/front.png","82":"assets/creatures/082_Feralin/front.png","83":"assets/creatures/083_Feralor/front.png","84":"assets/creatures/084_Feralex/front.png","85":"assets/creatures/085_Lumain/front.png","86":"assets/creatures/086_Lumaor/front.png","87":"assets/creatures/087_Lumaex/front.png","88":"assets/creatures/088_Marein/front.png","89":"assets/creatures/089_Mareor/front.png","90":"assets/creatures/090_Mareex/front.png","91":"assets/creatures/091_Vifin/front.png","92":"assets/creatures/092_Vifor/front.png","93":"assets/creatures/093_Vifex/front.png","94":"assets/creatures/094_Obsidin/front.png","95":"assets/creatures/095_Obsidor/front.png","96":"assets/creatures/096_Obsidex/front.png","97":"assets/creatures/097_Etherin/front.png","98":"assets/creatures/098_Etheror/front.png","99":"assets/creatures/099_Etherex/front.png","100":"assets/creatures/100_Valdorys/front.png","101":"assets/creatures/101_Verdain/front.png","102":"assets/creatures/102_Verdor/front.png","103":"assets/creatures/103_Verdex/front.png","104":"assets/creatures/104_Magmin/front.png","105":"assets/creatures/105_Magmor/front.png","106":"assets/creatures/106_Magmex/front.png","107":"assets/creatures/107_Rivain/front.png","108":"assets/creatures/108_Rivaor/front.png","109":"assets/creatures/109_Rivaex/front.png","110":"assets/creatures/110_Oragin/front.png","111":"assets/creatures/111_Oragor/front.png","112":"assets/creatures/112_Oragex/front.png","113":"assets/creatures/113_Spectrin/front.png","114":"assets/creatures/114_Spectror/front.png","115":"assets/creatures/115_Spectrex/front.png","116":"assets/creatures/116_Cristin/front.png","117":"assets/creatures/117_Cristor/front.png","118":"assets/creatures/118_Cristex/front.png","119":"assets/creatures/119_Cirrin/front.png","120":"assets/creatures/120_Cirror/front.png","121":"assets/creatures/121_Cirrex/front.png","122":"assets/creatures/122_Truffin/front.png","123":"assets/creatures/123_Truffor/front.png","124":"assets/creatures/124_Truffex/front.png","125":"assets/creatures/125_Polarin/front.png","126":"assets/creatures/126_Polaror/front.png","127":"assets/creatures/127_Polarex/front.png","128":"assets/creatures/128_Auroin/front.png","129":"assets/creatures/129_Auroor/front.png","130":"assets/creatures/130_Auroex/front.png","131":"assets/creatures/131_Felyin/front.png","132":"assets/creatures/132_Felyor/front.png","133":"assets/creatures/133_Felyex/front.png","134":"assets/creatures/134_Abyssin/front.png","135":"assets/creatures/135_Abyssor/front.png","136":"assets/creatures/136_Abyssex/front.png","137":"assets/creatures/137_Lavain/front.png","138":"assets/creatures/138_Lavaor/front.png","139":"assets/creatures/139_Lavaex/front.png","140":"assets/creatures/140_Canopin/front.png","141":"assets/creatures/141_Canopor/front.png","142":"assets/creatures/142_Canopex/front.png","143":"assets/creatures/143_Tempestin/front.png","144":"assets/creatures/144_Tempestor/front.png","145":"assets/creatures/145_Tempestex/front.png","146":"assets/creatures/146_Revin/front.png","147":"assets/creatures/147_Revor/front.png","148":"assets/creatures/148_Revex/front.png","149":"assets/creatures/149_Astryn/front.png","150":"assets/creatures/150_Astryss/front.png"};

// ---------------------------------------------------------------------------
// 1) PORTRAITS FIABLES DANS LE PANNEAU ÉQUIPE À DROITE
// ---------------------------------------------------------------------------
function portraitHtmlV106A(m){
  const src=PORTRAITS[Number(m?.id)];
  if(!src)return '<div style="width:44px;height:44px;border-radius:10px;background:#dbe9ed;display:flex;align-items:center;justify-content:center;font-weight:700;color:#294552;flex:0 0 44px">?</div>';
  const label=(typeof BY!=='undefined'&&BY[m.id]?.name)||'Éclat';
  return '<img src="'+src+'" alt="'+label.replace(/&/g,'&amp;').replace(/"/g,'&quot;')+'" style="width:44px;height:44px;object-fit:contain;border-radius:10px;background:#eef6f8;border:1px solid #c8d8dd;flex:0 0 44px" draggable="false">';
}
try{tinyPortraitHTML=portraitHtmlV106A}catch(_){}
window.tinyPortraitHTML=portraitHtmlV106A;

// ---------------------------------------------------------------------------
// 2) MISSIONS DONNÉES PAR LES VILLAGEOIS — OBLIGATOIRES POUR FINIR LE JEU
// ---------------------------------------------------------------------------
const VILLAGER_QUESTS=[];
const QUEST_BY_GIVER=Object.fromEntries(VILLAGER_QUESTS.map(q=>[q.giver,q]));

function questStateV106A(){
  state.v106a=state.v106a||{};
  state.v106a.villagerQuests=state.v106a.villagerQuests||{};
  return state.v106a.villagerQuests;
}
function caughtTypeCountV106A(type){
  let n=0;
  for(const [id,d] of Object.entries(state.dex||{}))if(d?.caught&&BY?.[id]?.type===type)n++;
  return n;
}
function taronWinCountV106A(){
  let boss=0;
  for(const sc of Object.values(SCENES||{}))for(const t of sc?.trainers||[])if(t?.taron&&state.trainerWins?.[t.id])boss++;
  return Math.max(Number(state.taron?.wins)||0,boss);
}
function questProgressV106A(q){
  if(q.kind==='trainerWins')return Object.values(state.trainerWins||{}).filter(Boolean).length;
  if(q.kind==='caughtType')return caughtTypeCountV106A(q.type);
  if(q.kind==='towns')return new Set((state.discovered||[]).filter(z=>/^town\d+$/.test(String(z)))).size;
  if(q.kind==='taronWins')return taronWinCountV106A();
  return 0;
}
function questEntryV106A(q){return questStateV106A()[q.id]||null}
function questDoneV106A(q){return questEntryV106A(q)?.status==='done'}
function allVillagerQuestsDoneV106A(){return VILLAGER_QUESTS.every(questDoneV106A)}
function acceptQuestV106A(q){
  const qs=questStateV106A();
  if(qs[q.id])return;
  qs[q.id]={status:'active',acceptedAt:Date.now()};
  try{logEvent('Mission de '+q.giverName+' acceptée : '+q.title+'.')}catch(_){}
  try{save(false);hud();toast('Nouvelle mission : '+q.title)}catch(_){}
}
function claimQuestV106A(q){
  const qs=questStateV106A(),e=qs[q.id];
  if(!e||e.status!=='active'||questProgressV106A(q)<q.goal)return false;
  e.status='done';e.completedAt=Date.now();
  state.money=(Number(state.money)||0)+q.money;
  state.inventory=state.inventory||{};state.inventory[q.item]=(Number(state.inventory[q.item])||0)+q.itemQty;
  try{logEvent('Mission terminée : '+q.title+'. Récompense : '+q.money+' V + '+q.itemQty+' '+q.item+'.')}catch(_){}
  try{save(false);hud();toast('Mission terminée : '+q.title)}catch(_){}
  return true;
}
function questInteractionV106A(n){
  const q=QUEST_BY_GIVER[n?.id];if(!q)return false;
  const e=questEntryV106A(q),p=Math.min(questProgressV106A(q),q.goal);
  if(!e){
    dialog('<b>'+q.giverName+' — '+q.title+'</b><br>'+q.text+'<br><br><b>Objectif : '+p+'/'+q.goal+'</b><br>Cette mission fait partie des services aux habitants nécessaires pour achever l’aventure.',()=>acceptQuestV106A(q));
    return true;
  }
  if(e.status==='active'&&p>=q.goal){
    dialog('<b>'+q.giverName+' — Mission accomplie</b><br>Merci ! Tu as rempli ma demande.<br><br>Récompense : <b>'+q.money+' V + '+q.itemQty+' '+q.item+'</b>.',()=>claimQuestV106A(q));
    return true;
  }
  if(e.status==='active'){
    dialog('<b>'+q.giverName+' — '+q.title+'</b><br>'+q.text+'<br><br><b>Progression : '+p+'/'+q.goal+'</b>');
    return true;
  }
  dialog('<b>'+q.giverName+'</b><br>Merci encore pour ton aide. Cette mission est terminée.');
  return true;
}

// Interception minimale : uniquement lorsque le PNJ proche est un donneur de mission.
const BASE_INTERACT=window.interact;
if(typeof BASE_INTERACT==='function'){
  const patchedInteract=function(){
    try{
      if(typeof closeDialog==='function'&&closeDialog())return;
      if(typeof scene!=='undefined'&&scene==='world'&&!trainerEvent){
        const n=typeof nearNPC==='function'?nearNPC():null;
        if(n&&!n.taron&&QUEST_BY_GIVER[n.id]){try{faceNPCToPlayer(n)}catch(_){};if(questInteractionV106A(n))return}
      }
    }catch(err){console.warn('V106A quête interaction',err)}
    return BASE_INTERACT();
  };
  try{interact=patchedInteract}catch(_){}
  window.interact=patchedInteract;
}

// Journal/Objectifs : la progression des missions villageoises est visible en permanence.
try{
  const BASE_OBJECTIVES=objectivesV84;
  objectivesV84=function(){
    const base=BASE_OBJECTIVES();
    if(!VILLAGER_QUESTS.length)return base;
    const done=VILLAGER_QUESTS.filter(questDoneV106A).length;
    const village=[{title:'Missions des habitants',progress:done+'/'+VILLAGER_QUESTS.length,txt:done===VILLAGER_QUESTS.length?'Tous les habitants aidés. La condition villageoise de fin de jeu est remplie.':'Parle aux habitants marqués par ces missions et termine leurs demandes avant l’ultime conclusion.'}];
    for(const q of VILLAGER_QUESTS){
      const e=questEntryV106A(q),p=Math.min(questProgressV106A(q),q.goal);
      village.push({title:(questDoneV106A(q)?'✓ ':'')+q.giverName+' — '+q.title,progress:e?(questDoneV106A(q)?'Terminée':p+'/'+q.goal):'À accepter',txt:q.text});
    }
    return [...village,...base];
  };
  window.objectivesV84=objectivesV84;
}catch(err){console.warn('V106A objectifs',err)}

// Les missions sont réellement obligatoires pour CONCLURE le jeu, pas pour explorer la Citadelle.
try{
  const BASE_ALTAR=tryFinalAltarV77;
  tryFinalAltarV77=function(){
    if(state.zone==='temple_final'&&Math.hypot(state.x-1200,state.y-140)<150&&!allVillagerQuestsDoneV106A()){
      const missing=VILLAGER_QUESTS.filter(q=>!questDoneV106A(q)).map(q=>'• '+q.giverName+' : '+q.title).join('<br>');
      dialog('<b>Autel du Cœur</b><br>Le Cœur ne peut pas être restauré tant que les engagements pris auprès des habitants ne sont pas honorés.<br><br><b>Missions restantes :</b><br>'+missing);
      return true;
    }
    return BASE_ALTAR();
  };
  window.tryFinalAltarV77=tryFinalAltarV77;
}catch(err){console.warn('V106A autel',err)}

// ---------------------------------------------------------------------------
// 3) TEAM TARON — APPARITIONS REMISES SUR LES ROUTES ACTUELLES
// ---------------------------------------------------------------------------
function roadPointV106A(sc,x,y){
  const C=Number(sc?.v105dCell)||220,road=sc?.v105dRoad;if(!road||!road.size)return null;
  let best=null,bd=Infinity;
  for(const key of road){const [gx,gy]=String(key).split(',').map(Number),px=gx*C+C/2,py=gy*C+C/2,d=Math.hypot(x-px,y-py);if(d<bd){bd=d;best={x:px,y:py,gx,gy}}}
  return best;
}
function taronSpawnPointV106A(sc){
  const C=Number(sc?.v105dCell)||220,road=[...(sc?.v105dRoad||[])];
  if(!road.length)return {x:(sc?.width||1800)*.5,y:(sc?.height||1100)*.5};
  const cx=(sc.width||1800)*.5,cy=(sc.height||1100)*.5;
  const candidates=road.map(key=>{const [gx,gy]=String(key).split(',').map(Number);return {x:gx*C+C/2,y:gy*C+C/2,d:Math.hypot(gx*C+C/2-cx,gy*C+C/2-cy)}})
    .filter(p=>Math.hypot(p.x-state.x,p.y-state.y)>220)
    .filter(p=>!(sc.trainers||[]).some(t=>Math.hypot(p.x-t.x,p.y-t.y)<150))
    .sort((a,b)=>a.d-b.d);
  return candidates[Math.min(candidates.length-1,Math.max(0,Math.floor(candidates.length*.25)))]||roadPointV106A(sc,cx,cy)||{x:cx,y:cy};
}
const BASE_MAYBE_TARON=typeof maybeSpawnTaron==='function'?maybeSpawnTaron:null;
if(BASE_MAYBE_TARON){
  maybeSpawnTaron=function(force=false){
    const sc=currentScene(),ts=ensureTaronState();
    if(!sc||sc.kind!=='route')return;
    // Une ancienne opération laissée sur une autre route ne bloque plus les suivantes.
    if(ts.active&&ts.active.zone!==state.zone)ts.active=null;
    if(ts.active&&ts.active.zone===state.zone)return;
    if(!force&&Math.random()>.58)return;
    const missionIndex=Math.floor(Math.random()*TARON_MISSIONS.length),p=taronSpawnPointV106A(sc);
    ts.active={zone:state.zone,missionIndex,x:p.x,y:p.y,look:39,dir:0};
    try{logEvent('Activité de la Team Taron signalée sur '+sc.name+'.');save(false);toast('La Team Taron a été aperçue sur cette route !')}catch(_){}
  };
  window.maybeSpawnTaron=maybeSpawnTaron;
}
function snapTaronBossesV106A(){
  try{
    for(const sc of Object.values(SCENES||{}))for(const t of sc?.trainers||[])if(t?.taronBossV102Z||t?.taron){
      const p=roadPointV106A(sc,t.x,t.y);if(!p)continue;
      // Seulement les agents Taron : on les replace exactement sur le tracé jouable actuel.
      t.x=p.x;t.y=p.y;t.homeX=p.x;t.homeY=p.y;t.look=39;
    }
  }catch(err){console.warn('V106A Team Taron snap',err)}
}

// Le moteur V105U avait écrasé le contexte des boss Taron. On le restaure au moment où le dresseur est marqué vaincu.
try{
  const BASE_MARK=markTrainerDefeatedV88;
  markTrainerDefeatedV88=function(t){const r=BASE_MARK(t);if(t?.taron)window._v106aLastTaron=t;return r};
  window.markTrainerDefeatedV88=markTrainerDefeatedV88;
}catch(_){}
try{
  const BASE_COMPLETE_TARON=completeTaronMission;
  completeTaronMission=function(){
    const t=window._v106aLastTaron;window._v106aLastTaron=null;
    if(t?.taronBossV102Z&&!window._v102zTaronBossContext)window._v102zTaronBossContext=t;
    return BASE_COMPLETE_TARON();
  };
  window.completeTaronMission=completeTaronMission;
}catch(_){}

// ---------------------------------------------------------------------------
// 4) PETITES MIGRATIONS / RAFRAÎCHISSEMENT SANS TOUCHER AUX SAUVEGARDES EXISTANTES
// ---------------------------------------------------------------------------
function refreshV106A(){
  try{questStateV106A();snapTaronBossesV106A();if(typeof hud==='function')hud()}catch(err){console.warn('V106A refresh',err)}
}
setTimeout(refreshV106A,250);
setTimeout(refreshV106A,1400);
setTimeout(refreshV106A,4200);
setTimeout(()=>{try{if(scene==='world'&&currentScene()?.kind==='route')maybeSpawnTaron(false)}catch(_){}},1800);

window.ValdoraV106A={version:VERSION,quests:VILLAGER_QUESTS,allVillagerQuestsDone:allVillagerQuestsDoneV106A,questProgress:questProgressV106A,taronWins:taronWinCountV106A,portraits:PORTRAITS};
console.log('V106A actif — quêtes villageoises, Team Taron et portraits équipe restaurés.');
})();
