// VALDORA V109W — Citadelle, réseau Simdor/Hautes Brumes, Vol, EXP et boutiques
(function(){
'use strict';
const VERSION='V109Y';

function creatorMode(){
  try{return /CREATEUR/i.test(location.pathname)||window.CREATOR_MODE===true||(typeof v61CreatorMode==='function'&&v61CreatorMode())}catch(_){return false}
}
function uniq(a){return [...new Set(a)]}
function dest(e){return String(e?.to||e?.target||'')}
function rect(sc,side,slot=0,total=1){
  const w=Number(sc?.width)||2600,h=Number(sc?.height)||1800,p=(slot+1)/(total+1);
  if(side==='north')return{x:w*p-90,y:0,w:180,h:90,side};
  if(side==='south')return{x:w*p-90,y:h-90,w:180,h:90,side};
  if(side==='west')return{x:0,y:h*p-90,w:90,h:180,side};
  return{x:w-90,y:h*p-90,w:90,h:180,side:'east'};
}

// ------------------------------------------------------------------
// 1) CITADELLE : les 10 gardiens existent réellement + mouvement dédié.
// ------------------------------------------------------------------
const TEMPLE_POS=[
  [950,1850],[1450,1710],[950,1510],[1450,1370],[950,1170],
  [1450,1030],[950,830],[1450,690],[950,490],[1450,390]
];
function completeTemple(){
  const sc=window.SCENES?.temple_final;if(!sc)return false;
  sc.kind='temple';sc.name='Citadelle du Cœur';sc.width=2400;sc.height=2100;
  sc.trainers=Array.isArray(sc.trainers)?sc.trainers:[];
  for(let i=0;i<10;i++){
    const id='temple_guard_'+(i+1),p=TEMPLE_POS[i];
    let t=sc.trainers.find(x=>x?.id===id);
    const data={id,x:p[0],y:p[1],look:(i+5)%41,level:64+i*2,dir:0,moving:false,templeGuard:true,guardian:false,dialog:'Gardien du Sanctuaire '+(i+1)};
    if(t)Object.assign(t,data);else sc.trainers.push(data);
  }
  let boss=sc.trainers.find(x=>x?.id==='final_boss');
  if(!boss)sc.trainers.push({id:'final_boss',x:1200,y:245,look:15,level:78,dir:0,moving:false,finalBoss:true,dialog:'Maître du Cœur'});
  sc.exits=[{x:1110,y:2010,w:180,h:90,side:'south',to:'town14',label:'Aubeval'}];
  return true;
}
try{
  if(typeof ensureFinalTempleV77==='function'){
    const baseEnsure=ensureFinalTempleV77;
    ensureFinalTempleV77=function(){const r=baseEnsure.apply(this,arguments);completeTemple();return r};
    window.ensureFinalTempleV77=ensureFinalTempleV77;
  }
}catch(e){console.warn('V109W ensure temple',e)}

function templeMove(dx,dy,dir){
  if(!(scene==='world'&&state.zone==='temple_final'))return false;
  state.dir=dir;
  if(window.joueurBloque)return true;
  if(!Number.isFinite(+state.x)||!Number.isFinite(+state.y)||state.x<390||state.x>2010||state.y<70||state.y>2040){state.x=1200;state.y=1900}
  const speed=state.bike?1.55:1,nx=state.x+dx*speed,ny=state.y+dy*speed;
  let bad=false;
  try{bad=typeof finalTempleCollisionV77==='function'?finalTempleCollisionV77(nx,ny):(nx<390||nx>2010||ny<70||ny>2040)}catch(_){bad=nx<390||nx>2010||ny<70||ny>2040}
  if(!bad){
    for(const t of (SCENES.temple_final?.trainers||[])){
      if(state.trainerWins?.[t.id])continue;
      const nd=Math.hypot(nx-t.x,ny-t.y),od=Math.hypot(state.x-t.x,state.y-t.y);
      if(nd<34&&nd<=od+.01){bad=true;break}
    }
  }
  if(!bad){
    try{recordFollowerStep?.()}catch(_){}
    state.x=nx;state.y=ny;lastMove=Date.now();
    try{checkTrainerDetection?.()}catch(_){}
    try{checkPortal?.()}catch(_){}
  }
  return true;
}
try{
  const baseMove=typeof move==='function'?move:window.move;
  const patchedMove=function(dx,dy,dir){if(templeMove(dx,dy,dir))return;return baseMove?.apply(this,arguments)};
  window.move=patchedMove;move=patchedMove;
}catch(e){console.warn('V109W mouvement Citadelle',e)}

// ------------------------------------------------------------------
// 2) SIMDOR <-> SENTIER DES HAUTES BRUMES <-> CIMES-D'OR.
// ------------------------------------------------------------------
function removeExit(sc,to){if(sc?.exits)sc.exits=sc.exits.filter(e=>dest(e)!==to)}
function configureSimdor(){
  const sim=SCENES?.route_simdor,m1=SCENES?.route_m1,m2=SCENES?.route_m2,cimes=SCENES?.town8,mont=SCENES?.town3;
  if(!sim||!m1||!cimes)return false;
  sim.kind='town';sim.name='Simdor';
  m1.kind='route';m1.name='Sentier des Hautes Brumes';
  m1.exits=[{...rect(m1,'west'),to:'route_simdor',label:'Simdor'},{...rect(m1,'east'),to:'town8',label:'Cimes-d’Or'}];
  if(m2){m2.kind='route';m2.name='Corniche de Simdor';m2.exits=[{...rect(m2,'north'),to:'town3',label:'Montfaucon'},{...rect(m2,'south'),to:'route_simdor',label:'Simdor'}]}
  // Deux sorties distinctes au nord de Simdor : Corniche et Hautes Brumes.
  sim.exits=[
    {...rect(sim,'north',0,2),to:'route_m2',label:'Corniche de Simdor'},
    {...rect(sim,'north',1,2),to:'route_m1',label:'Sentier des Hautes Brumes'},
    {...rect(sim,'south'),to:'route_m3',label:'Passe de Soléria'},
    {...rect(sim,'west'),to:'route_m5',label:'Route des Ombres'},
    {...rect(sim,'east'),to:'route_m4',label:'Col de Nova'}
  ];
  removeExit(cimes,'route_m1');cimes.exits=Array.isArray(cimes.exits)?cimes.exits:[];cimes.exits.push({...rect(cimes,'north'),to:'route_m1',label:'Sentier des Hautes Brumes'});
  if(mont&&m2){removeExit(mont,'route_m2');mont.exits=Array.isArray(mont.exits)?mont.exits:[];mont.exits.push({...rect(mont,'south'),to:'route_m2',label:'Corniche de Simdor'})}
  return true;
}

// ------------------------------------------------------------------
// 3) PROGRESSION : seuls les vrais dresseurs de route sont obligatoires.
//    La mission globale "Dresseur confirmé" de Nova-Cité reste jouable,
//    mais ne bloque plus l'histoire principale.
// ------------------------------------------------------------------
function isMandatoryRoadTrainer(t){
  if(!t||!t.id)return false;
  if(t.taron||t.taronBossV102Z||t.v109wVolAgent||t.v106zOpId||t.guardian||t.finalBoss||t.templeGuard||t.rematchV106Y)return false;
  if(t.buildingEventV66||t.buildingEventV67||t.buildingEventV68||t.buildingEventV70||t.optional||t.questOnly)return false;
  return true;
}
function pendingRoadTrainers(route){return (SCENES?.[route]?.trainers||[]).filter(t=>isMandatoryRoadTrainer(t)&&!state.trainerWins?.[t.id])}
try{
  if(typeof V106C_QUESTS!=='undefined'){
    const q=V106C_QUESTS.find(x=>x?.id==='v106c_mila');if(q)q.required=false;
  }
}catch(_){}
try{
  const routeGateV109W=function(from,to){
    if(typeof window.v107kIsAdvancingRouteExit==='function'&&!window.v107kIsAdvancingRouteExit(from,to))return null;
    if(!/^route/.test(String(from)))return null;
    const pending=pendingRoadTrainers(from);
    return pending.length?`La route n’est pas encore terminée : bats les ${pending.length} dresseur${pending.length>1?'s':''} de route restant${pending.length>1?'s':''} avant d’atteindre la ville suivante.`:null;
  };
  window.v107kRouteGate=routeGateV109W;
}catch(e){console.warn('V109W route gate',e)}
try{
  const basePlayerGate=typeof playerQuestGateMessage==='function'?playerQuestGateMessage:window.playerQuestGateMessage;
  const cleanPlayerGate=function(from,to){
    let msg=basePlayerGate?basePlayerGate(from,to):null;
    if(msg&&/^route/.test(String(from))&&/dresseur|quête sur cette route|route n.est pas encore terminée/i.test(String(msg))){
      const pending=pendingRoadTrainers(from);msg=pending.length?`Avant de continuer, bats les ${pending.length} dresseur${pending.length>1?'s':''} de route encore présent${pending.length>1?'s':''}.`:null;
    }
    // Correctif V109Y : l'ancien moteur assimilait le numéro de ville au numéro de Sceau.
    // Exemple : town12 -> route12 réclamait un impossible « Sceau 12 ».
    if(msg&&/^town\d+$/.test(String(from))&&/^route\d+$/.test(String(to))&&/Sceau/i.test(String(msg))){
      const actualSeal=Number(window.V106U_GUARDS?.[from]||0);
      if(!actualSeal||(state.seals||[]).includes(actualSeal))msg=null;
      else msg=`Le passage vers la suite est verrouillé : bats d’abord le Gardien de ${SCENES?.[from]?.name||'la ville'} et obtiens le Sceau ${actualSeal}.`;
    }
    return msg;
  };
  window.playerQuestGateMessage=cleanPlayerGate;playerQuestGateMessage=cleanPlayerGate;
}catch(e){console.warn('V109W player gate',e)}

// ------------------------------------------------------------------
// 4) ROUTE 4 : Agent Team Taron donnant la Capsule Vol après victoire.
// ------------------------------------------------------------------
const VOL_AGENT_ID='taron_agent_vol_route4';
function ensureVolAgent(){
  const sc=SCENES?.route3;if(!sc)return false;
  sc.trainers=Array.isArray(sc.trainers)?sc.trainers:[];
  let t=sc.trainers.find(x=>x?.id===VOL_AGENT_ID);
  const path=Array.isArray(sc.v104Path)&&sc.v104Path.length?sc.v104Path:(Array.isArray(sc.v76Path)?sc.v76Path:[]);
  const p=path[Math.max(1,Math.min(path.length-2,Math.floor(path.length*.55)))]||[(sc.width||3200)*.55,(sc.height||1800)*.5];
  const data={id:VOL_AGENT_ID,zone:'route3',x:Number(p[0])+115,y:Number(p[1])+75,look:39,dir:0,level:27,moving:false,name:'Agent Team Taron',dialog:'Agent Team Taron — Gardien de la Capsule Vol',taron:true,v109wVolAgent:true,guardian:false};
  if(t)Object.assign(t,data);else sc.trainers.push(data);
  return true;
}
try{
  const baseStart=typeof startTrainer413==='function'?startTrainer413:window.startTrainer413;
  const patchedStart=function(t){
    if(t?.v109wVolAgent){window._v109wVolAgentActive=true;window._v109wVolTrainer=t;try{dialog('<b>Agent Team Taron</b><br>Cette Capsule Vol appartient désormais à la Team Taron. Si tu la veux, viens la prendre !',()=>baseStart(t));return}catch(_){}}
    else{window._v109wVolAgentActive=false;window._v109wVolTrainer=null}
    return baseStart?.apply(this,arguments);
  };
  window.startTrainer413=patchedStart;startTrainer413=patchedStart;
}catch(e){console.warn('V109W agent Vol start',e)}
try{
  const baseComplete=typeof completeTaronMission==='function'?completeTaronMission:window.completeTaronMission;
  const patchedComplete=function(){
    if(window._v109wVolAgentActive&&state.trainerWins?.[VOL_AGENT_ID]){
      window._v109wVolAgentActive=false;window._v109wVolTrainer=null;
      state.flags=state.flags||{};state.capsules=Array.isArray(state.capsules)?state.capsules:[];
      const first=!state.flags.v109wVolReward;
      if(!state.capsules.includes('vol')&&!state.flyLearned)state.capsules.push('vol');
      state.flags.v109wVolReward=true;state.taron=state.taron||{wins:0,missions:0,active:null};state.taron.wins=(Number(state.taron.wins)||0)+1;
      try{save(false);hud();logEvent('Route 4 : Capsule Vol récupérée après la victoire contre la Team Taron.')}catch(_){}
      try{dialog(`<b>Agent Team Taron vaincu</b><br>${first?'Tu récupères la <b>Capsule Vol</b>.':'La Capsule Vol est déjà en ta possession.'}<br><br>Elle peut être enseignée à une créature de type <b>Air</b>. Son utilisation comme déplacement reste liée à ta progression dans les Sceaux.`)}catch(_){}
      return true;
    }
    return baseComplete?.apply(this,arguments);
  };
  window.completeTaronMission=patchedComplete;completeTaronMission=patchedComplete;
}catch(e){console.warn('V109W agent Vol reward',e)}

// ------------------------------------------------------------------
// 5) EXP : participation PAR adversaire + aucun gain pour un Éclat K.O.
// ------------------------------------------------------------------
function markCurrentParticipant(){
  if(!battle)return;const p=typeof currentPlayer==='function'?currentPlayer():battle.player;if(!p||p.hp<=0)return;
  battle.v109wEnemyParticipants=Array.isArray(battle.v109wEnemyParticipants)?battle.v109wEnemyParticipants:[];
  if(!battle.v109wEnemyParticipants.includes(p))battle.v109wEnemyParticipants.push(p);
}
try{
  const baseUseMove=window.useMove;
  if(typeof baseUseMove==='function')window.useMove=function(playerTurn,mv){
    // Un Éclat compte comme participant s'il agit OU s'il est la cible vivante de l'adversaire.
    if(battle&&(playerTurn||(!playerTurn&&battle.enemy?.hp>0)))markCurrentParticipant();
    return baseUseMove.apply(this,arguments);
  };
}catch(e){console.warn('V109W EXP useMove',e)}
try{
  if(typeof window.grantEnemyXP==='function')window.grantEnemyXP=function(enemy){
    const base=Math.max(10,Math.floor(enemy.level*11+12+(BY[enemy.id]?.stage||0)*8));
    const members=uniq((battle?.v109wEnemyParticipants||[]).filter(m=>m&&m.hp>0)),xpLines=[];
    battle.eventQueue=Array.isArray(battle.eventQueue)?battle.eventQueue:[];
    for(const m of members){
      if(m.hp<=0)continue;
      const amount=Math.max(6,Math.floor(base*(m===currentPlayer()?1:.72)));
      const events=(typeof safeCall==='function'?safeCall(gainXP,m,amount):gainXP(m,amount))||[];
      xpLines.push(`${nameOf(m)} : +${amount} EXP`);battle.eventQueue.push(`${nameOf(m)} gagne ${amount} EXP.`,...events);
    }
    if(!members.length)battle.eventQueue.push('Aucun Éclat encore conscient n’a participé à cet affrontement : aucune EXP distribuée.');
    battle.xpFlashLines=xpLines;battle.xpFlashUntil=performance.now()+2400;
    // Le prochain Éclat du dresseur repart avec une liste de participants vide.
    battle.v109wEnemyParticipants=[];
  };
}catch(e){console.warn('V109W EXP grant',e)}

// ------------------------------------------------------------------
// 6) BOUTIQUES : vrais paliers + Rappel/Élixir plus tôt + aucun objet perdu.
// ------------------------------------------------------------------
function highestTown(){
  const vals=(state.discovered||[]).map(z=>{const m=String(z).match(/^town(\d+)$/);return m?+m[1]:-1}).filter(n=>n>=0);
  const cur=String(state.zone||'').match(/^town(\d+)$/);if(cur)vals.push(+cur[1]);return Math.max(0,...vals)
}
function shopTier(){
  if(creatorMode())return 6;const town=highestTown(),seals=(state.seals||[]).length;
  if(town>=13||seals>=7)return 6;if(town>=11||seals>=6)return 5;if(town>=9||seals>=5)return 4;if(town>=6||seals>=3)return 3;if(town>=3||seals>=1)return 2;if(town>=1)return 1;return 0;
}
window.pShopTierV101P=shopTier;
window.pNormalShopIdsV101P=function(){
  const t=shopTier(),ids=['Potion','Orbe','Antidote','Baie'];
  if(t>=1)ids.push('SuperPotion','FioleAttaque','FioleDefense','Rappel');
  if(t>=2)ids.push('SuperOrbe','FioleGuerison','ElixirVital','Artefact1');
  if(t>=3)ids.push('Artefact2');
  if(t>=4)ids.push('MegaOrbe','Artefact3');
  if(t>=5)ids.push('Artefact4');
  if(t>=6)ids.push('Artefact5');
  return uniq(ids.filter(id=>typeof SHOP_ITEMS==='undefined'||SHOP_ITEMS[id]));
};
try{
  if(typeof pMarketItemIdsV101P==='function'||window.pMarketItemIdsV101P){
    const baseMarket=window.pMarketItemIdsV101P||pMarketItemIdsV101P;
    window.pMarketItemIdsV101P=function(){return uniq([...(baseMarket?.()||[]),...window.pNormalShopIdsV101P()])};
    try{pMarketItemIdsV101P=window.pMarketItemIdsV101P}catch(_){}
  }
}catch(_){}


// ------------------------------------------------------------------
// 7) SOINS : blocage réel du déplacement pendant le soin et sortie
//    interdite après un K.O. global tant que l'équipe n'est pas soignée.
// ------------------------------------------------------------------
function v109xStateFlags(){state.flags=state.flags||{};return state.flags}
function v109xTeamHealthy(){
  const team=Array.isArray(state.team)?state.team:[];
  if(!team.length)return true;
  return team.every(m=>m&&Number(m.hp||0)>=Number(maxHP(m)||0)&&!m.status);
}
function v109xHealingActive(){
  try{return typeof healingSeq!=='undefined'&&!!healingSeq}catch(_){return false}
}
function v109xMustHeal(){return !!v109xStateFlags().v109xForceHeal}
function v109xHealingLocked(){return v109xHealingActive()||!!v109xStateFlags().v109xHealingInProgress}
function v109xSetMustHeal(on){const f=v109xStateFlags();if(on)f.v109xForceHeal=true;else delete f.v109xForceHeal}
function v109xSetHealing(on){const f=v109xStateFlags();if(on)f.v109xHealingInProgress=true;else delete f.v109xHealingInProgress}
function v109xClearHealLockIfDone(){
  if(v109xHealingActive())return false;
  if(v109xTeamHealthy()){
    const f=v109xStateFlags();
    const had=!!(f.v109xForceHeal||f.v109xHealingInProgress);
    delete f.v109xForceHeal;delete f.v109xHealingInProgress;
    if(had){try{save(false)}catch(_){}}
    return had;
  }
  return false;
}
try{
  const baseStartHeal=window.startHealingSequence||startHealingSequence;
  const patchedStartHeal=function(){
    if(v109xHealingActive())return;
    v109xSetHealing(true);
    return baseStartHeal?.apply(this,arguments);
  };
  window.startHealingSequence=patchedStartHeal;startHealingSequence=patchedStartHeal;
}catch(e){console.warn('V109W soins start',e)}
try{
  const baseMovePostHeal=window.move||move;
  const patchedMovePostHeal=function(dx,dy,dir){
    if(v109xHealingLocked()){state.dir=dir;return true}
    return baseMovePostHeal?.apply(this,arguments);
  };
  window.move=patchedMovePostHeal;move=patchedMovePostHeal;
}catch(e){console.warn('V109W soins move',e)}
try{
  const baseLeaveHeal=window.leave;
  if(typeof baseLeaveHeal==='function')window.leave=function(){
    if(v109xHealingActive()){
      try{toast('Le soin est en cours. Attends la fin du traitement.')}catch(_){ }
      return false;
    }
    if(v109xMustHeal()&&!v109xTeamHealthy()){
      try{dialog('<b>Centre de soins</b><br>Ton équipe vient d’être ramenée ici après un K.O. complet. Tu dois d’abord la faire soigner avant de pouvoir repartir.')}catch(_){ }
      try{toast('Soins obligatoires avant de quitter le centre.')}catch(_){ }
      return false;
    }
    v109xClearHealLockIfDone();
    return baseLeaveHeal?.apply(this,arguments);
  };
}catch(e){console.warn('V109W soins leave',e)}
try{
  const baseInteractInterior=window.interactInteriorNew||window.interactInterior;
  if(typeof baseInteractInterior==='function'){
   const patchedInteractInterior=function(){
    if(v109xMustHeal()&&!v109xHealingActive()&&!v109xTeamHealthy()){
      let nearHealer=false,healFurniture=false;
      try{const n=typeof nearNpc==='function'?nearNpc():null;nearHealer=!!(n&&/élise|elise|infirm|soigneuse/i.test(String(n.name||'')))}catch(_){ }
      try{const m=typeof v109jTargetFurniture==='function'?v109jTargetFurniture():null;healFurniture=String(m?.fonction||'')==='soins_centre'}catch(_){ }
      if(!nearHealer&&!healFurniture){
        try{toast('Ton équipe doit d’abord être soignée.')}catch(_){ }
        try{dialog('<b>Centre de soins</b><br>Commence d’abord le traitement auprès de la soigneuse avant de faire autre chose.')}catch(_){ }
        return true;
      }
    }
    return baseInteractInterior?.apply(this,arguments);
  };
   window.interactInteriorNew=patchedInteractInterior;window.interactInterior=patchedInteractInterior;
  }
}catch(e){console.warn('V109W soins interaction',e)}
try{
  const baseTransferKO=window.transferAfterDefeat;
  if(typeof baseTransferKO==='function')window.transferAfterDefeat=function(){v109xSetMustHeal(true);v109xSetHealing(false);return baseTransferKO?.apply(this,arguments)};
}catch(e){console.warn('V109W KO transfer',e)}
try{
  if(typeof window.v98TransferToHealingCenter==='function'){
    const baseV98=window.v98TransferToHealingCenter;
    window.v98TransferToHealingCenter=function(){v109xSetMustHeal(true);v109xSetHealing(false);return baseV98.apply(this,arguments)};
    try{v98TransferToHealingCenter=window.v98TransferToHealingCenter}catch(_){ }
  }
}catch(e){console.warn('V109W KO transfer legacy',e)}
setInterval(()=>{try{v109xClearHealLockIfDone()}catch(_){ }},350);

// ------------------------------------------------------------------
// 8) SYLVARIS -> ROUTE DE TARONIS -> TARONIS : liaison explicite.
//    La mission de Mathis reste le verrou narratif ; aucun Sceau fantôme
//    ne doit se substituer à cette mission.
// ------------------------------------------------------------------
function v109yRoadCells(sc){
  const C=Number(sc?.v105dCell)||220,out=[];
  for(const k of sc?.v105dRoad||[]){const [gx,gy]=String(k).split(',').map(Number);out.push({x:(gx+.5)*C,y:(gy+.5)*C})}
  return out;
}
function v109yNearRoad(sc,x,y,pad=120){
  const cells=v109yRoadCells(sc);return cells.some(p=>Math.hypot(Number(x)-p.x,Number(y)-p.y)<=pad)
}
function v109yCleanRouteRoad(sc){
  if(!sc)return;
  if(Array.isArray(sc.v105dTrees))sc.v105dTrees=sc.v105dTrees.filter(t=>!v109yNearRoad(sc,t.x,t.y,120));
  if(Array.isArray(sc.obstacles))sc.obstacles=sc.obstacles.filter(o=>!v109yNearRoad(sc,o.x,o.y,(Number(o.r)||30)+85));
  if(Array.isArray(sc.mObstacles))sc.mObstacles=sc.mObstacles.filter(o=>!v109yNearRoad(sc,o.x,o.y,(Number(o.r)||30)+85));
}
function v109yExit(sc,side,to,label){
  const w=Number(sc?.width)||1800,h=Number(sc?.height)||1100;
  const road=v109yRoadCells(sc);
  if(side==='west'){
    const p=road.sort((a,b)=>a.x-b.x)[0]||{y:h/2};return{x:0,y:Math.max(40,p.y-110),w:150,h:220,side,to,label,v109yTaronis:true};
  }
  if(side==='east'){
    const p=road.sort((a,b)=>b.x-a.x)[0]||{y:h/2};return{x:w-150,y:Math.max(40,p.y-110),w:150,h:220,side,to,label,v109yTaronis:true};
  }
  if(side==='north')return{x:w/2-110,y:0,w:220,h:150,side,to,label,v109yTaronis:true};
  return{x:w/2-110,y:h-150,w:220,h:150,side:'south',to,label,v109yTaronis:true};
}
function ensureTaronisLinkV109Y(){
  const syl=SCENES?.town12,route=SCENES?.route12,tar=SCENES?.town13;if(!syl||!route||!tar)return false;
  syl.exits=Array.isArray(syl.exits)?syl.exits:[];route.exits=Array.isArray(route.exits)?route.exits:[];tar.exits=Array.isArray(tar.exits)?tar.exits:[];
  syl.exits=syl.exits.filter(e=>dest(e)!=='route12');
  route.exits=route.exits.filter(e=>!['town12','town13'].includes(dest(e)));
  tar.exits=tar.exits.filter(e=>dest(e)!=='route12');
  // Les derniers générateurs de carte dessinent la chaîne principale ouest -> est.
  // On se cale sur cette géométrie, plus robuste que les anciens côtés sud/nord.
  syl.exits.push(v109yExit(syl,'east','route12','Route de Taronis'));
  route.exits.push(v109yExit(route,'west','town12','Sylvaris'));
  route.exits.push(v109yExit(route,'east','town13','Taronis'));
  tar.exits.push(v109yExit(tar,'west','route12','Route de Taronis'));
  v109yCleanRouteRoad(route);
  // Corridor de sécurité aux quatre portails.
  for(const [sc,to] of [[syl,'route12'],[route,'town12'],[route,'town13'],[tar,'route12']]){
    const ex=(sc.exits||[]).find(e=>dest(e)===to);if(!ex)continue;
    const cx=Number(ex.x||0)+Number(ex.w||0)/2,cy=Number(ex.y||0)+Number(ex.h||0)/2;
    if(Array.isArray(sc.v105dTrees))sc.v105dTrees=sc.v105dTrees.filter(t=>Math.hypot(t.x-cx,t.y-cy)>150);
    if(Array.isArray(sc.obstacles))sc.obstacles=sc.obstacles.filter(o=>Math.hypot(o.x-cx,o.y-cy)>(Number(o.r)||30)+120);
    if(Array.isArray(sc.mObstacles))sc.mObstacles=sc.mObstacles.filter(o=>Math.hypot(o.x-cx,o.y-cy)>(Number(o.r)||30)+120);
  }
  return true;
}

// Mathis est le seul verrou de mission de Sylvaris pour la Route de Taronis.
function v109yMathisQuest(){return typeof V106C_QUESTS!=='undefined'?V106C_QUESTS.find(q=>q?.id==='v106c_mathis'):null}
function v109yMathisDone(){const q=v109yMathisQuest();return !q||(typeof v106cQuestDone==='function'&&v106cQuestDone(q))}
try{
  const baseQuestInteraction=window.questInteractionV106C||questInteractionV106C;
  const patchedQuestInteraction=function(n){
    if(n?.id!=='mathis')return baseQuestInteraction?.apply(this,arguments);
    const q=v109yMathisQuest();if(!q)return baseQuestInteraction?.apply(this,arguments);
    q.title='Autorisation pour la Route de Taronis';
    q.text='Avant d’ouvrir la Route de Taronis, Mathis vérifie que ton parcours jusqu’à Sylvaris est bien enregistré. Une fois l’autorisation validée, le passage vers Taronis est ouvert.';
    q.kind='towns';q.goal=13;q.required=true;
    const st=v106cQuestState(),e=st[q.id],p=Math.min(v106cProgress(q),q.goal);
    if(e?.status==='done'){state.flags=state.flags||{};state.flags.v109yTaronisPermit=true;return dialog('<b>Mathis — Autorisation valide</b><br>La Route de Taronis est ouverte. Tu peux continuer vers Taronis.'),true}
    if(p>=q.goal){
      if(!e)v106cAccept(q);
      v106cClaim(q);state.flags=state.flags||{};state.flags.v109yTaronisPermit=true;try{save(false)}catch(_){ }
      dialog('<b>Mathis — Autorisation pour Taronis</b><br>Tout est en ordre. Je valide ton passage.<br><br><b>La Route de Taronis est maintenant ouverte.</b>');return true;
    }
    if(!e){dialog('<b>Mathis — Autorisation pour Taronis</b><br>'+q.text+`<br><br><b>Progression : ${p}/${q.goal} villes enregistrées.</b>`,()=>v106cAccept(q));return true}
    dialog('<b>Mathis — Autorisation pour Taronis</b><br>'+q.text+`<br><br><b>Progression : ${p}/${q.goal}.</b>`);return true;
  };
  window.questInteractionV106C=patchedQuestInteraction;questInteractionV106C=patchedQuestInteraction;
}catch(e){console.warn('V109Y mission Mathis',e)}
try{
  const baseTownGate=window.v107kTownGate;
  const patchedTownGate=function(from,to){
    if(from==='town12'&&to==='route12'&&!creatorMode()){
      if(!v109yMathisDone()&&!state.flags?.v109yTaronisPermit)return 'La Route de Taronis nécessite l’autorisation de Mathis. Parle-lui à Sylvaris pour terminer la mission « Autorisation pour la Route de Taronis ».';
      return null;
    }
    return baseTownGate?.apply(this,arguments)||null;
  };
  window.v107kTownGate=patchedTownGate;
}catch(e){console.warn('V109Y gate Taronis',e)}

// ------------------------------------------------------------------
// 10) QUÊTES FINALES : sécurise la présence des PNJ clés de Sylvaris,
//    Taronis et Aubeval pour éviter tout blocage de progression.
// ------------------------------------------------------------------
function upsertNpcV109W(data){
  if(typeof NPCDATA==='undefined'||!Array.isArray(NPCDATA)||!data?.id)return false;
  let n=NPCDATA.find(x=>x&&x.id===data.id);
  if(n)Object.assign(n,data);else NPCDATA.push({...data});
  return true;
}
const V109W_LATE_NPCS=[
  {id:'eva',zone:'town12',x:720,y:560,look:8,dir:0,name:'Éva',text:'Sylvaris est idéal pour observer les espèces Nature.'},
  {id:'mathis',zone:'town12',x:1070,y:690,look:24,dir:1,name:'Mathis',text:'Je guide les voyageurs qui veulent explorer les bois.'},
  {id:'zoe',zone:'town13',x:720,y:570,look:5,dir:0,name:'Zoé',text:'À Taronis, tout le monde parle des opérations de la Team Taron.'},
  {id:'alexis',zone:'town13',x:1070,y:690,look:27,dir:1,name:'Alexis',text:'Seule une équipe d’élite peut tenir la distance jusque-là.'},
  {id:'manon',zone:'town14',x:720,y:560,look:10,dir:0,name:'Manon',text:'Aubeval marque souvent la dernière étape avant de grands départs.'},
  {id:'victor',zone:'town14',x:1070,y:690,look:37,dir:1,name:'Victor',text:'Je collectionne les récits des dresseurs qui ont parcouru Valdora.'},
  {id:'helene',zone:'town14',x:900,y:620,look:12,dir:0,name:'Hélène',text:'J’aide les voyageurs à préparer leur dernière étape à Aubeval.'},
  {id:'solene_aubeval',zone:'town14',x:1240,y:555,look:40,dir:1,name:'Solène',text:'Je dirige les expéditions vers les sanctuaires légendaires.'}
];
function ensureLateQuestNpcs(){for(const npc of V109W_LATE_NPCS)upsertNpcV109W(npc);return V109W_LATE_NPCS.length}

// ------------------------------------------------------------------
// 11) CODEX / suivi : garantit 169 espèces reconnues dans les compteurs
//    synthétiques utilisés par les menus additionnels.
// ------------------------------------------------------------------
function totalCreaturesV109W(){
  try{return Array.isArray(CREATURES)&&CREATURES.length?CREATURES.length:169}catch(_){return 169}
}
// ------------------------------------------------------------------
// Installation répétée uniquement pour les scènes qu'anciens timers peuvent régénérer.
// ------------------------------------------------------------------
function install(){
  try{completeTemple()}catch(e){console.warn(e)}
  try{configureSimdor()}catch(e){console.warn(e)}
  try{ensureVolAgent();if(state.trainerWins?.[VOL_AGENT_ID]&&!state.flags?.v109wVolReward){state.flags=state.flags||{};state.capsules=Array.isArray(state.capsules)?state.capsules:[];if(!state.capsules.includes('vol')&&!state.flyLearned)state.capsules.push('vol');state.flags.v109wVolReward=true}}catch(e){console.warn(e)}
  try{if(typeof V106C_QUESTS!=='undefined'){const q=V106C_QUESTS.find(x=>x?.id==='v106c_mila');if(q)q.required=false}}catch(_){}
  try{ensureTaronisLinkV109Y()}catch(e){console.warn(e)}
  try{ensureLateQuestNpcs()}catch(e){console.warn(e)}
  try{v109xClearHealLockIfDone()}catch(e){console.warn(e)}
  document.documentElement.dataset.valdoraVersion=VERSION;
  const b=document.querySelector('.brand b');if(b)b.textContent=`VALDORA ${VERSION} — ${creatorMode()?'CRÉATEUR':'JOUEUR'}`;
  document.title=`Éclats Sauvages — Valdora ${VERSION}`;
}
install();if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>{setTimeout(install,3000);setTimeout(install,8000);setTimeout(install,11500)});else{setTimeout(install,2500);setTimeout(install,7500);setTimeout(install,11000)}

window.ValdoraGameplayV109W={
  version:VERSION,install,completeTemple,configureSimdor,ensureVolAgent,shopTier,pendingRoadTrainers,ensureTaronisLinkV109Y,ensureLateQuestNpcs,totalCreatures:totalCreaturesV109W,
  audit(){
    const issues=[];
    const temple=SCENES?.temple_final,ids=new Set((temple?.trainers||[]).map(t=>t.id));for(let i=1;i<=10;i++)if(!ids.has('temple_guard_'+i))issues.push('Citadelle : gardien '+i+' absent');
    const pairs=[['route_simdor','route_m1'],['route_m1','town8']];for(const [a,b] of pairs){if(!(SCENES?.[a]?.exits||[]).some(e=>dest(e)===b)||!(SCENES?.[b]?.exits||[]).some(e=>dest(e)===a))issues.push(`${a} <-> ${b} non réciproque`)}
    if(!(SCENES?.route3?.trainers||[]).some(t=>t.id===VOL_AGENT_ID))issues.push('Route 4 : agent Vol absent');
    const tiers={rappel:window.pNormalShopIdsV101P().includes('Rappel'),elixir:shopTier()>=2?window.pNormalShopIdsV101P().includes('ElixirVital'):true};if(!tiers.rappel&&shopTier()>=1)issues.push('Rappel absent du palier attendu');if(!tiers.elixir)issues.push('Élixir Vital absent du palier attendu');
    if(typeof NPCDATA!=='undefined'){for(const npc of V109W_LATE_NPCS)if(!NPCDATA.some(n=>n?.id===npc.id))issues.push('PNJ final absent : '+npc.id)}
    if(!(SCENES?.town12?.exits||[]).some(e=>dest(e)==='route12'))issues.push('Sylvaris -> Route de Taronis absent');
    if(!(SCENES?.route12?.exits||[]).some(e=>dest(e)==='town13'))issues.push('Route de Taronis -> Taronis absent');
    if(!(SCENES?.town13?.exits||[]).some(e=>dest(e)==='route12'))issues.push('Taronis -> Route de Taronis absent');
    return{ok:issues.length===0,issues,templeGuards:(temple?.trainers||[]).filter(t=>t.templeGuard).length,simdorToBrumes:(SCENES?.route_simdor?.exits||[]).some(e=>dest(e)==='route_m1'),brumesToCimes:(SCENES?.route_m1?.exits||[]).some(e=>dest(e)==='town8'),mustHealAfterKO:!!state?.flags?.v109xForceHeal,totalCreatures:totalCreaturesV109W()};
  }
};
})();
