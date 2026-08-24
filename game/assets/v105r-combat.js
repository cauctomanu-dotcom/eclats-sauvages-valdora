/* =====================================================================
   VALDORA V105U — EVOLUTIONS LEGALES ET ORBES D'ECLAT
   Ce module ne prolonge pas l'ancien moteur : il remplace ses points
   d'entree, son tour de jeu, son interface et son rendu.
   ===================================================================== */
(function(){
'use strict';

const VERSION='V105U';
const TURN_DELAY=520;
const TYPE_COLORS={Nature:'#55a95e',Feu:'#df684d',Eau:'#4b95d1',Foudre:'#e4bd3e',Ombre:'#70598f',Roche:'#987458',Air:'#77b7c7',Spore:'#9a6db2',Glace:'#6fc5d2',Lumière:'#d9b94d',Neutre:'#7d8990'};
const ORB_PROFILES={
  Orbe:{label:"Orbe d'Éclat",src:'assets/orbes/orbe_eclat_v105u.png',mult:1,bonus:0,max:.93,glow:'#f5a623'},
  SuperOrbe:{label:'Super Orbe',src:'assets/orbes/super_orbe_eclat_v105u.png',mult:1.48,bonus:.12,max:.985,glow:'#55d8ff'},
  MegaOrbe:{label:'Méga Orbe',src:'assets/orbes/mega_orbe_eclat_v105u.png',mult:2.10,bonus:.24,max:.997,glow:'#cf74ff'}
};
const ORB_IMAGES={};

function el(id){return document.getElementById(id)}
function nameOf(m){return BY[m?.id]?.name||'Éclat'}
function typeOf(m){return BY[m?.id]?.type||'Neutre'}
function alive(m){return !!m&&Number(m.hp)>0}
function clamp(n,a,b){return Math.max(a,Math.min(b,n))}
function deepCopy(v){try{return JSON.parse(JSON.stringify(v))}catch(_){return v}}
function safeCall(fn,...args){try{return typeof fn==='function'?fn(...args):undefined}catch(err){console.warn('V105R intégration',err);return undefined}}
function currentPlayer(){return battle?.player||null}
function combatReady(){return scene==='battle'&&!!battle&&battle.engine===VERSION&&battle.token===battleToken}

function minimumLegalLevel(id){
  if(typeof minLevelForSpeciesV81==='function'){
    const level=Number(minLevelForSpeciesV81(id));
    if(Number.isFinite(level))return Math.max(1,level)
  }
  const c=BY[id];if(!c)return 1;
  const family=CREATURES.filter(x=>x.family===c.family).sort((a,b)=>(a.stage||0)-(b.stage||0));
  const index=family.findIndex(x=>x.id===c.id),previous=index>0?family[index-1]:null;
  if(previous?.evolve!=null)return Math.max(1,Number(previous.evolve)||1);
  return (c.stage||0)>=3?50:(c.stage||0)===2?32:(c.stage||0)===1?16:1
}

function ensureOrbInventory(){
  state.inventory=state.inventory||{};
  for(const key of Object.keys(ORB_PROFILES))if(state.inventory[key]==null)state.inventory[key]=0
}

function preloadOrbImages(){
  for(const [kind,profile] of Object.entries(ORB_PROFILES)){
    if(ORB_IMAGES[kind])continue;
    const image=new Image();image.decoding='async';image.src=profile.src;ORB_IMAGES[kind]=image
  }
}

function normalizeCreature(candidate,fallbackLevel=5){
  let m=candidate;
  const id=Number(m?.id);
  if(!m||!BY[id])m=mon(CREATURES[0].id,Math.max(1,Number(fallbackLevel)||5));
  m.id=Number(m.id);
  const previousLevel=Math.max(1,Number(m.level)||Math.max(1,Number(fallbackLevel)||5));
  let previousMax=0;try{previousMax=Math.max(1,Number(maxHP({...m,level:previousLevel}))||1)}catch(_){}
  const previousHP=Number(m.hp);
  m.level=Math.max(previousLevel,minimumLegalLevel(m.id));
  m.moves=Array.isArray(m.moves)?m.moves.filter(mid=>MOVE_DB[mid]).slice(0,4):[];
  if(!m.moves.length)m.moves=defaultMoves(m.id,m.level);
  if(!Number.isFinite(previousHP))m.hp=maxHP(m);
  else if(m.level!==previousLevel&&previousHP>0&&previousMax>0)m.hp=Math.max(1,Math.round(maxHP(m)*clamp(previousHP/previousMax,0,1)));
  m.hp=clamp(Number(m.hp),0,maxHP(m));
  m.status=typeof m.status==='string'?m.status:null;
  m.atkBuff=clamp(Number(m.atkBuff)||0,-3,3);
  m.defBuff=clamp(Number(m.defBuff)||0,-3,3);
  return m
}

function installInterface(){
  if(!el('battleStyleV105R')){
    const style=document.createElement('style');
    style.id='battleStyleV105R';
    style.textContent=`
      body.v101-battle-mode #battleUI,#battleUI[data-engine="V105U"][data-combat-active="true"]{
        display:flex!important;align-items:flex-end!important;justify-content:center!important;
        padding:0 8px 8px!important;box-sizing:border-box!important;z-index:26!important
      }
      #battleUI[data-engine="V105U"][data-combat-active="false"]{display:none!important}
      #battleUI[data-engine="V105U"] .battlebar{
        position:absolute!important;left:50%!important;bottom:8px!important;top:auto!important;
        transform:translateX(-50%)!important;width:min(720px,84%)!important;margin:0!important;
        padding:7px!important;display:grid!important;grid-template-columns:repeat(4,minmax(0,1fr))!important;
        gap:6px!important;border-radius:16px!important;background:rgba(247,252,254,.97)!important;
        box-shadow:0 9px 28px rgba(9,31,47,.34)!important;pointer-events:auto!important;z-index:28!important
      }
      #battleUI[data-engine="V105U"] .battlebar button{
        min-height:38px!important;padding:7px 8px!important;border-radius:10px!important;
        font-size:11px!important;line-height:1.12!important;white-space:normal!important
      }
      #battleUI[data-engine="V105U"] .battlebar button.v105r-move{border-left:5px solid var(--move-color,#7d8990)!important}
      #battleUI[data-engine="V105U"] .battlebar button.v105r-wide{grid-column:span 2}
      #battleMessageV105R{
        position:absolute;left:50%;bottom:105px;transform:translateX(-50%);width:min(730px,86%);
        min-height:42px;padding:10px 15px;box-sizing:border-box;border-radius:14px;
        background:rgba(12,33,48,.97);color:#fff;font:750 13px/1.35 system-ui,sans-serif;
        box-shadow:0 8px 26px rgba(0,0,0,.34);pointer-events:none;z-index:27
      }
      #battleMessageV84{display:none!important}
      @media(max-width:760px){
        #battleUI[data-engine="V105U"] .battlebar{width:96%!important;bottom:6px!important}
        #battleMessageV105R{width:94%;bottom:108px;font-size:12px}
      }
    `;
    document.head.appendChild(style)
  }
  const ui=el('battleUI');
  if(!ui)return;
  ui.dataset.engine=VERSION;
  let message=el('battleMessageV105R');
  if(!message){message=document.createElement('div');message.id='battleMessageV105R';ui.appendChild(message)}
  if(!combatReady()){
    ui.dataset.combatActive='false';ui.style.setProperty('display','none','important');
    message.textContent='';message.style.setProperty('display','none','important')
  }
}

function setMessage(message){
  if(!battle)return;
  battle.message=String(message||'');
  const box=el('battleMessageV105R');
  if(box){box.textContent=battle.message;box.style.setProperty('display','block','important')}
}

function schedule(ms,fn){
  const token=battle?.token;
  setTimeout(()=>{
    if(!combatReady()||battle.token!==token)return;
    try{fn()}catch(err){recoverTurn(err)}
  },ms)
}

function recoverTurn(err){
  console.error('V105R combat',err);
  if(!combatReady())return;
  battle.busy=false;battle.phase='player';battle.anim=null;
  setMessage('Le combat a été stabilisé. À toi de jouer.');
  buildButtons()
}

function button(label,action,disabled=false,klass='',color=''){
  const b=document.createElement('button');
  b.type='button';b.textContent=label;b.disabled=!!disabled;b.className=klass;
  if(color)b.style.setProperty('--move-color',color);
  b.addEventListener('click',()=>{try{action()}catch(err){recoverTurn(err)}});
  return b
}

function buildButtons(){
  const bar=el('bbuttons');if(!bar)return;
  bar.innerHTML='';
  if(!combatReady())return;
  ensureOrbInventory();
  const p=currentPlayer();
  const locked=!!battle.busy;

  if(battle.menu==='team'||battle.phase==='switch'){
    const forced=battle.phase==='switch';
    const choices=(state.team||[]).filter(m=>alive(m)&&m!==p);
    if(!choices.length){
      bar.appendChild(button('Aucun remplaçant',()=>{},true,'v105r-wide'))
    }else{
      for(const m of choices)bar.appendChild(button(`${nameOf(m)} — N.${m.level} — ${m.hp}/${maxHP(m)} PV`,()=>selectCreature(m,forced),locked,'v105r-wide'))
    }
    if(!forced)bar.appendChild(button('Retour',()=>{battle.menu='actions';buildButtons()},locked,'v105r-wide'));
    return
  }

  if(battle.menu==='revive'){
    const choices=(state.team||[]).filter(m=>m&&m.hp<=0);
    for(const m of choices)bar.appendChild(button(`${nameOf(m)} — K.O.`,()=>useRevive(m),locked,'v105r-wide'));
    bar.appendChild(button('Retour au sac',()=>{battle.menu='bag';buildButtons()},locked,'v105r-wide'));
    return
  }

  if(battle.menu==='bag'){
    const inv=state.inventory||{};
    bar.appendChild(button(`Potion (${inv.Potion||0})`,()=>useItem('Potion'),locked||!(inv.Potion>0)||p.hp>=maxHP(p)));
    bar.appendChild(button(`Super Potion (${inv.SuperPotion||0})`,()=>useItem('SuperPotion'),locked||!(inv.SuperPotion>0)||p.hp>=maxHP(p)));
    bar.appendChild(button(`Baie (${inv.Baie||0})`,()=>useItem('Baie'),locked||!(inv.Baie>0)||p.hp>=maxHP(p)));
    bar.appendChild(button(`Antidote (${inv.Antidote||0})`,()=>useItem('Antidote'),locked||!(inv.Antidote>0)||!p.status));
    bar.appendChild(button(`Rappel (${inv.Rappel||0})`,()=>openRevive(),locked||!(inv.Rappel>0)||!(state.team||[]).some(m=>m.hp<=0)));
    bar.appendChild(button(`Orbe (${inv.Orbe||0})`,()=>throwOrb('Orbe'),locked||!!battle.trainer||!(inv.Orbe>0)));
    bar.appendChild(button(`Super Orbe (${inv.SuperOrbe||0})`,()=>throwOrb('SuperOrbe'),locked||!!battle.trainer||!(inv.SuperOrbe>0)));
    bar.appendChild(button(`Méga Orbe (${inv.MegaOrbe||0})`,()=>throwOrb('MegaOrbe'),locked||!!battle.trainer||!(inv.MegaOrbe>0)));
    bar.appendChild(button('Retour',()=>{battle.menu='actions';buildButtons()},locked));
    return
  }

  const moves=(p?.moves||[]).slice(0,4);
  for(let i=0;i<4;i++){
    const mid=moves[i],mv=MOVE_DB[mid];
    bar.appendChild(button(mv?mv.name:'—',()=>chooseMoveV105R(i),locked||!mv,'v105r-move',TYPE_COLORS[mv?.type]||TYPE_COLORS.Neutre))
  }
  bar.appendChild(button('Sac',()=>{battle.menu='bag';buildButtons()},locked));
  bar.appendChild(button(`Orbe (${state.inventory?.Orbe||0})`,()=>throwOrb('Orbe'),locked||!!battle.trainer||!(state.inventory?.Orbe>0)));
  bar.appendChild(button('Changer',()=>{battle.menu='team';buildButtons()},locked||!(state.team||[]).some(m=>alive(m)&&m!==p)));
  bar.appendChild(button('Fuir',runV105R,locked||!!battle.trainer));
}

function beginBattle(enemy,trainer=null){
  ensureOrbInventory();preloadOrbImages();
  const player=(state.team||[]).find(alive);
  if(!player){safeCall(toast,'Toute ton équipe est K.O. Va la faire soigner avant de combattre.');return false}
  const priorScene=scene;
  const priorBuilding=building;
  const foe=normalizeCreature(enemy,trainer?.level||player.level||5);
  battleToken++;
  battle={
    engine:VERSION,token:battleToken,enemy:foe,trainer:trainer||null,
    trainerParty:Array.isArray(trainer?.party)?trainer.party:null,trainerIndex:Number(trainer?.partyIndex)||0,
    player,participants:[player],busy:true,phase:'intro',menu:'actions',message:'',anim:null,orb:null,
    result:null,reward:0,eventQueue:[],returnScene:priorScene,returnBuilding:priorBuilding
  };
  scene='battle';
  installInterface();
  const ui=el('battleUI');if(ui){ui.dataset.combatActive='true';ui.style.setProperty('display','flex','important')}
  const menu=el('menuov');if(menu)menu.style.display='none';
  const dlg=el('dialog');if(dlg){dlg.classList.remove('show');dlg.style.display='none'}
  setMessage(trainer?`${trainer.dialog||trainer.name||'Un dresseur'} te défie !`:`Un ${nameOf(foe)} sauvage apparaît !`);
  safeCall(startBattleMusic);safeCall(battleCry,foe.id);safeCall(hud);buildButtons();
  schedule(650,()=>{battle.busy=false;battle.phase='player';setMessage('À toi de jouer.');buildButtons()});
  return true
}

function beginTrainer(rawTrainer){
  if(!rawTrainer)return false;
  let t={...rawTrainer};
  const special=t.guardian||t.taron||t.finalBoss||t.templeGuard||t.buildingEventV66||t.buildingEventV67||t.buildingEventV68||t.buildingEventV70;
  if(!special&&safeCall(currentScene)?.kind==='route'&&typeof v98RoadTrainerLevel==='function'){
    t.level=v98RoadTrainerLevel(t);t.zone=state.zone
  }
  if(!t.guardian&&typeof trainerDefeatedV88==='function'&&trainerDefeatedV88(t)){
    safeCall(dialog,`<b>${t.dialog||'Dresseur'}</b><br>Ce combat a déjà été remporté.`);return false
  }
  let party=Array.isArray(t.party)&&t.party.length?t.party:safeCall(buildTrainerParty,t);
  if(!Array.isArray(party)||!party.length)party=[mon(CREATURES[0].id,Math.max(3,Number(t.level)||5))];
  party=party.map(m=>normalizeCreature(m,t.level||5));
  t.party=party;t.partyIndex=0;
  return beginBattle(party[0],t)
}

function beginWild(){
  let base=Math.max(3,Number(safeCall(v83AreaLevelBase))||3),pool;
  if(state.zone==='route4bis'){
    base=20+(state.seals||[]).length*2;
    pool=CREATURES.filter(c=>c.type==='Eau'&&minLevelForSpeciesV81(c.id)<=base+4)
  }else{
    const intended=Math.max(3,base-3+Math.floor(Math.random()*7));
    base=intended;pool=CREATURES.filter(c=>minLevelForSpeciesV81(c.id)<=intended)
  }
  const c=pool?.[Math.floor(Math.random()*Math.max(1,pool.length))]||CREATURES[0];
  const level=Math.max(minLevelForSpeciesV81(c.id),state.zone==='route4bis'?base-2+Math.floor(Math.random()*5):base);
  const enemy=mon(c.id,level);enemy.moves=defaultMoves(enemy.id,enemy.level);
  state.dex=state.dex||{};state.dex[c.id]={...(state.dex[c.id]||{}),seen:true};
  return beginBattle(enemy,null)
}

function canAct(m){
  if(m.status==='paralysé'&&Math.random()<.27)return `${nameOf(m)} est paralysé et ne peut pas agir !`;
  if(m.status==='gelé'){
    if(Math.random()<.30){m.status=null;return null}
    return `${nameOf(m)} est gelé et reste immobile !`
  }
  return null
}

function damageFor(user,target,mv){
  const us=creatureStats(user),ts=creatureStats(target);
  const attack=us.atk*(1+(user.atkBuff||0)*.17);
  const defense=ts.def*(1+(target.defBuff||0)*.17);
  const mult=typeEffectivenessV81(mv.type||'Neutre',typeOf(target));
  const crit=Math.random()<.085?1.5:1;
  const raw=(Number(mv.power)||0)+user.level*.42+attack*.28-defense*.15;
  return {damage:Math.max(1,Math.round(Math.max(2,raw)*(.9+Math.random()*.18)*mult*crit)),mult,critical:crit>1}
}

function applyEffect(user,target,mv){
  if(mv.kind==='heal'){
    const n=Math.min(maxHP(user)-user.hp,Math.max(12,Math.round(maxHP(user)*.28)));user.hp+=n;
    return `${nameOf(user)} récupère ${n} PV.`
  }
  if(mv.kind==='buff'){
    user.atkBuff=clamp((user.atkBuff||0)+1,-3,3);user.defBuff=clamp((user.defBuff||0)+1,-3,3);
    return `Les capacités de ${nameOf(user)} augmentent.`
  }
  if(mv.kind==='debuff'){
    target.atkBuff=clamp((target.atkBuff||0)-1,-3,3);return `L'attaque de ${nameOf(target)} baisse.`
  }
  if(!target.status){
    if(mv.kind==='poison'&&Math.random()<.30){target.status='empoisonné';return `${nameOf(target)} est empoisonné.`}
    if(mv.kind==='paralyze'&&Math.random()<.30){target.status='paralysé';return `${nameOf(target)} est paralysé.`}
    if(mv.kind==='freeze'&&Math.random()<.24){target.status='gelé';return `${nameOf(target)} est gelé.`}
    if(mv.kind==='blind'&&Math.random()<.30){target.status='aveuglé';return `${nameOf(target)} est aveuglé.`}
  }
  return ''
}

function resolveMove(playerTurn,mv){
  if(!combatReady())return;
  const user=playerTurn?currentPlayer():battle.enemy;
  const target=playerTurn?battle.enemy:currentPlayer();
  if(!user||!target){finishV105R('error');return}
  const accuracy=clamp((Number(mv.accuracy)||100)-(user.status==='aveuglé'?18:0),35,100);
  let text='';
  if(Math.random()*100>accuracy){text=`${nameOf(user)} manque ${mv.name} !`}
  else if((Number(mv.power)||0)<=0){text=applyEffect(user,target,mv)||'La capacité agit.'}
  else{
    const out=damageFor(user,target,mv);target.hp=Math.max(0,target.hp-out.damage);
    const effect=applyEffect(user,target,mv);
    text=`${nameOf(target)} perd ${out.damage} PV.${effectivenessTextV81(out.mult)}`;
    if(out.critical)text=`Coup critique ! ${text}`;
    if(effect)text+=` ${effect}`;
    battle.anim={...battle.anim,impact:true}
  }
  safeCall(hud);setMessage(text);
  schedule(TURN_DELAY,()=>{
    battle.anim=null;
    if(target.hp<=0){playerTurn?enemyDefeated():playerDefeated();return}
    poisonAfterAction(user,playerTurn)
  })
}

function poisonAfterAction(actor,playerTurn){
  if(actor.status==='empoisonné'&&actor.hp>0){
    const loss=Math.max(1,Math.floor(maxHP(actor)*.09));actor.hp=Math.max(0,actor.hp-loss);
    setMessage(`${nameOf(actor)} souffre du poison et perd ${loss} PV.`);safeCall(hud);
    schedule(500,()=>{
      if(actor.hp<=0){playerTurn?playerDefeated():enemyDefeated();return}
      playerTurn?enemyTurnV105R():returnToPlayer()
    });return
  }
  playerTurn?enemyTurnV105R():returnToPlayer()
}

function useMove(playerTurn,mv){
  if(!combatReady()||battle.busy||!mv)return;
  const user=playerTurn?currentPlayer():battle.enemy;if(!alive(user))return;
  battle.busy=true;battle.phase=playerTurn?'player-action':'enemy-action';battle.menu='actions';
  const blocked=canAct(user);
  if(blocked){setMessage(blocked);buildButtons();schedule(520,()=>poisonAfterAction(user,playerTurn));return}
  setMessage(`${nameOf(user)} utilise ${mv.name} !`);
  safeCall(playMoveSound,mv);
  battle.anim={start:performance.now(),duration:460,fromPlayer:playerTurn,move:mv,impact:false};
  buildButtons();schedule(460,()=>resolveMove(playerTurn,mv))
}

function chooseMoveV105R(slot){
  const p=currentPlayer(),mid=p?.moves?.[slot],mv=MOVE_DB[mid];if(mv)useMove(true,{...mv,_id:mid})
}

function enemyTurnV105R(){
  if(!combatReady())return;
  const enemy=battle.enemy;
  const pool=(enemy.moves||[]).map(id=>({id,mv:MOVE_DB[id]})).filter(x=>x.mv);
  const pick=pool[Math.floor(Math.random()*Math.max(1,pool.length))]||{id:'charge',mv:MOVE_DB.charge};
  battle.busy=false;useMove(false,{...pick.mv,_id:pick.id})
}

function returnToPlayer(message='À toi de jouer.'){
  if(!combatReady())return;
  battle.busy=false;battle.phase='player';battle.menu='actions';setMessage(message);buildButtons()
}

function grantEnemyXP(enemy){
  const base=Math.max(10,Math.floor(enemy.level*11+12+(BY[enemy.id]?.stage||0)*8));
  const members=[...new Set((battle.participants||[]).filter(Boolean))];
  for(const m of members){
    const amount=Math.max(6,Math.floor(base*(m===currentPlayer()?1:.72)));
    const wasKO=m.hp<=0;const events=safeCall(gainXP,m,amount)||[];if(wasKO)m.hp=0;
    battle.eventQueue.push(`${nameOf(m)} gagne ${amount} EXP.`,...events)
  }
}

function enemyDefeated(){
  if(!combatReady())return;
  const defeated=battle.enemy;grantEnemyXP(defeated);
  if(battle.trainer&&battle.trainerParty&&battle.trainerIndex<battle.trainerParty.length-1){
    battle.trainerIndex++;battle.enemy=normalizeCreature(battle.trainerParty[battle.trainerIndex],battle.trainer.level||defeated.level);
    battle.busy=true;setMessage(`Le dresseur envoie ${nameOf(battle.enemy)} !`);safeCall(battleCry,battle.enemy.id);
    schedule(720,()=>returnToPlayer());return
  }
  if(battle.trainer){
    battle.reward=Math.max(50,Math.floor((Number(battle.trainer.level)||defeated.level)*18));
    state.money=(state.money||0)+battle.reward;battle.eventQueue.push(`Récompense : ${voltronLabelV85(battle.reward)}.`)
  }else{
    battle.reward=Math.floor((safeCall(wildRewardV85,defeated)||20)*1.10);
    state.money=(state.money||0)+battle.reward;battle.eventQueue.push(`Combat sauvage : +${voltronLabelV85(battle.reward)}.`)
  }
  if(typeof zCombatLoot==='function'){
    const loot=safeCall(zCombatLoot,battle,defeated);if(Array.isArray(loot))battle.eventQueue.push(...loot)
  }
  battle.result='win';battle.busy=true;setMessage('Victoire !');safeCall(hud);buildButtons();
  schedule(850,()=>finishV105R('win'))
}

function playerDefeated(){
  if(!combatReady())return;
  const choices=(state.team||[]).filter(m=>alive(m)&&m!==currentPlayer());
  if(!choices.length){battle.result='lose';battle.busy=true;setMessage('Toute ton équipe est K.O. !');buildButtons();schedule(850,()=>finishV105R('lose'));return}
  battle.busy=false;battle.phase='switch';battle.menu='team';setMessage('Choisis une créature pour poursuivre le combat.');buildButtons()
}

function selectCreature(next,forced=false){
  if(!combatReady()||battle.busy||!alive(next)||next===currentPlayer())return;
  battle.player=next;if(!battle.participants.includes(next))battle.participants.push(next);
  const index=state.team.indexOf(next);if(index>0){state.team.splice(index,1);state.team.unshift(next)}
  battle.busy=true;battle.phase='switching';battle.menu='actions';setMessage(`${nameOf(next)} entre au combat !`);safeCall(hud);buildButtons();
  schedule(550,()=>{if(forced)returnToPlayer();else enemyTurnV105R()})
}

function useItem(kind){
  if(!combatReady()||battle.busy)return;
  state.inventory=state.inventory||{};if(!(state.inventory[kind]>0))return;
  const p=currentPlayer();let text='';
  if(kind==='Antidote'){
    if(!p.status)return;state.inventory[kind]--;p.status=null;text=`${nameOf(p)} n'a plus d'altération d'état.`
  }else{
    const amount=kind==='SuperPotion'?65:kind==='Baie'?20:30;
    const healed=Math.min(amount,maxHP(p)-p.hp);if(healed<=0)return;
    state.inventory[kind]--;p.hp+=healed;text=`${nameOf(p)} récupère ${healed} PV.`
  }
  battle.busy=true;battle.menu='actions';setMessage(text);safeCall(hud);buildButtons();schedule(560,enemyTurnV105R)
}

function openRevive(){battle.menu='revive';buildButtons()}
function useRevive(target){
  if(!combatReady()||battle.busy||target.hp>0||!(state.inventory?.Rappel>0))return;
  state.inventory.Rappel--;target.hp=Math.max(1,Math.floor(maxHP(target)*.45));target.status=null;
  battle.busy=true;battle.menu='actions';setMessage(`${nameOf(target)} revient avec ${target.hp} PV.`);safeCall(hud);buildButtons();schedule(560,enemyTurnV105R)
}

function completeOrbCapture(enemy){
  const xp=Math.max(8,Math.floor((enemy.level*11+12+(BY[enemy.id]?.stage||0)*8)*.80));
  const events=safeCall(gainXP,currentPlayer(),xp)||[];
  battle.eventQueue.push(`${nameOf(currentPlayer())} gagne ${xp} EXP pour la capture.`,...events);
  battle.captureXP=xp;battle.result='capture';setMessage(`${nameOf(enemy)} est capturé !`);
  schedule(900,()=>finishV105R('capture'))
}

function continueOrbShakes(orb,enemy,index=0){
  if(!combatReady()||battle.orb!==orb)return;
  if(index>=orb.shakeCount){
    if(orb.success){
      orb.stage='sealed';orb.start=performance.now();orb.duration=850;
      setMessage(`Le noyau de la ${ORB_PROFILES[orb.kind].label} se stabilise...`);safeCall(playOrbSound,'caught');
      schedule(850,()=>completeOrbCapture(enemy))
    }else{
      orb.stage='break';orb.start=performance.now();orb.duration=650;
      setMessage(`${nameOf(enemy)} brise le flux de la ${ORB_PROFILES[orb.kind].label} !`);safeCall(playOrbSound,'break');
      schedule(650,()=>{battle.orb=null;setMessage(`${nameOf(enemy)} ressort de l'Orbe !`);schedule(520,enemyTurnV105R)})
    }
    return
  }
  orb.stage='shake';orb.shakeIndex=index;orb.start=performance.now();orb.duration=520;
  setMessage(`La ${ORB_PROFILES[orb.kind].label} réagit... ${index+1}/${orb.shakeCount}`);safeCall(playOrbSound,'shake');
  schedule(520,()=>continueOrbShakes(orb,enemy,index+1))
}

function throwOrb(kind='Orbe'){
  if(!combatReady()||battle.busy||battle.trainer)return;
  ensureOrbInventory();
  const profile=ORB_PROFILES[kind]||ORB_PROFILES.Orbe;kind=ORB_PROFILES[kind]?kind:'Orbe';
  if(!(state.inventory[kind]>0)){safeCall(toast,`Tu n'as plus de ${profile.label}.`);return}
  state.inventory[kind]--;battle.busy=true;battle.menu='actions';
  const enemy=battle.enemy,missing=1-enemy.hp/maxHP(enemy),stage=BY[enemy.id]?.stage||0;
  const base=.20+missing*.61-stage*.055-Math.max(0,enemy.level-25)*.0025+(enemy.status?.08:0);
  const chance=clamp(base*profile.mult+profile.bonus,.07,profile.max),success=Math.random()<chance;
  const orb={kind,stage:'throw',start:performance.now(),duration:720,success,shakeCount:success?3:1+Math.floor(Math.random()*3),shakeIndex:0};
  battle.orb=orb;setMessage(`Tu lances une ${profile.label} !`);safeCall(playOrbSound,'throw');safeCall(hud);buildButtons();
  schedule(720,()=>{
    orb.stage='absorb';orb.start=performance.now();orb.duration=560;
    setMessage(`${nameOf(enemy)} est aspiré par le noyau d'Éclat !`);safeCall(playOrbSound,'absorb');
    schedule(560,()=>{
      orb.stage='fall';orb.start=performance.now();orb.duration=400;
      setMessage(`La ${profile.label} retombe...`);
      schedule(400,()=>continueOrbShakes(orb,enemy,0))
    })
  })
}

function runV105R(){
  if(!combatReady()||battle.busy||battle.trainer)return;
  battle.busy=true;battle.result='flee';setMessage('Tu prends la fuite !');buildButtons();schedule(380,()=>finishV105R('flee'))
}

function closeCombatChrome(snapshot){
  safeCall(stopBattleMusic);battleToken++;battle=null;
  const ui=el('battleUI');if(ui){ui.dataset.combatActive='false';ui.style.setProperty('display','none','important')}
  const bar=el('bbuttons');if(bar)bar.innerHTML='';
  const msg=el('battleMessageV105R');if(msg){msg.textContent='';msg.style.setProperty('display','none','important')}
  scene=snapshot.returnScene==='interior'?'interior':'world';
  building=snapshot.returnBuilding||building;
  document.body.classList.remove('v101-battle-mode');safeCall(hud);safeCall(save,false);safeCall(syncDefeatedTrainersV88)
}

function resolveSpecialReturn(b){
  const t=b.trainer;if(!t)return false;
  if(t.buildingEventV66){scheduleOutside(120,()=>safeCall(resolveBuildingBattleV66));return true}
  if(t.buildingEventV67){
    scheduleOutside(120,()=>{
      const c=window._v67Battle;if(!c)return;window._v67Battle=null;
      state.zone=c.zone;v67ReturnZone=c.zone;v67Building=c.building;v67Floor=c.floor;building={...c.building,type:'v67building'};
      scene='interior';state.roomX=600;state.roomY=420;c.event.done=true;state.flags=state.flags||{};state.flags[c.event.key]=true;
      state.money=(state.money||0)+700;safeCall(save,false);safeCall(dialog,'<b>Immeuble libéré</b><br>La Team Taron est repoussée. +700 Voltrons.')
    });return true
  }
  if(t.buildingEventV68){
    scheduleOutside(120,()=>{
      const c=window._v68Battle;if(!c)return;window._v68Battle=null;V68_INTERIOR=c.interior;state.zone=V68_INTERIOR.returnZone;
      building=V68_INTERIOR.building;scene='interior';state.roomX=640;state.roomY=620;state.flags=state.flags||{};
      try{state.flags[v69DiscoveryKey()]=true}catch(_){state.flags[t.id]=true}
      safeCall(save,false);safeCall(dialog,'<b>Étage libéré</b><br>La Team Taron est repoussée de cette pièce.')
    });return true
  }
  if(t.buildingEventV70){
    scheduleOutside(120,()=>{
      const c=window._v70Battle;if(!c)return;window._v70Battle=null;V70_INT=c.int;state.zone=V70_INT.returnZone;
      building=V70_INT.building;scene='interior';state.roomX=640;state.roomY=620;state.flags=state.flags||{};state.flags[v70DiscoveryKey()]=true;
      safeCall(save,false);safeCall(dialog,'<b>Pièce libérée</b><br>La Team Taron est repoussée. L’exploration peut continuer.')
    });return true
  }
  return false
}

function scheduleOutside(ms,fn){setTimeout(()=>{try{fn()}catch(err){console.error('V105R retour combat',err)}},ms)}

function transferAfterDefeat(){
  const discovered=new Set(Array.isArray(state.discovered)?state.discovered:[]);discovered.add('town0');
  const routeMatch=String(state.zone||'').match(/^route(\d+)$/);
  const preferred=[];
  if(/^town\d+$/.test(String(state.zone||'')))preferred.push(state.zone);
  if(routeMatch){const n=Number(routeMatch[1]);preferred.push(`town${n}`,`town${n+1}`)}
  preferred.push(...[...discovered].filter(z=>/^town\d+$/.test(z)).sort((a,b)=>Number(a.slice(4))-Number(b.slice(4))));
  let zone='town0',healer=null;
  for(const key of [...new Set(preferred)]){
    const sc=SCENES[key];if(!sc)continue;
    const found=(sc.buildings||[]).find(b=>b.type==='healer'||b.urbanType==='clinic'||/soins/i.test(b.label||''));
    if(found){zone=key;healer=found;break}
  }
  const sc=SCENES[zone];state.zone=zone;
  if(healer){
    state.x=healer.doorX??(healer.x+healer.w/2);state.y=(healer.doorY??(healer.y+healer.h))+60;
    building=healer;scene='interior';state.roomX=600;state.roomY=690
  }else{
    building=null;scene='world';state.x=(sc?.width||1800)/2;state.y=(sc?.height||1100)/2
  }
  safeCall(resetFollowerTrail);safeCall(hud);safeCall(save,false);
  scheduleOutside(120,()=>safeCall(dialog,`<b>Urgence — ${sc?.name||'Clairval'}</b><br>Toute ton équipe est K.O. Tu as été ramené au Centre de soins connu le plus proche.<br><br>Parle à la soigneuse pour commencer le traitement.`))
}

function finishV105R(forcedResult=null){
  if(!battle)return;
  const b=battle,result=forcedResult||b.result||'error',enemy=b.enemy,events=[...(b.eventQueue||[])];
  if(result==='capture'){
    state.dex=state.dex||{};state.dex[enemy.id]={...(state.dex[enemy.id]||{}),seen:true,caught:true};
    const captured=deepCopy(enemy);normalizeCreature(captured,enemy.level);captured.hp=Math.max(1,captured.hp);
    if((state.team||[]).length<7){state.team.push(captured);b.capturedTo='équipe'}else{state.box=state.box||[];state.box.push(captured);b.capturedTo='boîte'}
    safeCall(logEvent,`Capture de ${nameOf(enemy)}.`)
  }
  const won=result==='win'&&!!b.trainer;
  let sealObtained=false;
  if(won&&b.trainer.guardian)sealObtained=!!safeCall(v83AwardGuardianSeal,b.trainer);
  if(won)safeCall(markTrainerDefeatedV88,b.trainer);
  if(result==='win')safeCall(playVictoryJingleV81);
  closeCombatChrome(b);

  if(result==='lose'){
    scheduleOutside(420,()=>{if((state.team||[]).length&&(state.team||[]).every(m=>m.hp<=0))transferAfterDefeat()});return
  }
  if(result==='flee'){safeCall(toast,'Tu as quitté le combat.');return}
  if(won&&b.trainer.guardian){
    scheduleOutside(150,()=>safeCall(dialog,`<b>Gardien vaincu !</b><br>${sealObtained?`Tu remportes le <b>Sceau ${b.trainer.sealIndex}</b>.`:'Tu avais déjà remporté ce Sceau.'}<br><br>Récompense : ${voltronLabelV85(b.reward||0)}.${typeof window.v104GuardianRewardHtml==='function'?window.v104GuardianRewardHtml(b.trainer):''}`));return
  }
  if(won&&resolveSpecialReturn(b))return;
  if(won&&b.trainer.taron){scheduleOutside(150,()=>safeCall(completeTaronMission));return}
  if(won){
    scheduleOutside(150,()=>safeCall(dialog,`<b>${b.trainer.dialog||'Dresseur vaincu'}</b><br>${safeCall(trainerAfterBattleTextV88,b.trainer)||'Combat remporté.'}${events.length?'<br><br>'+events.join('<br>'):''}`));return
  }
  if(result==='capture'){
    const destination=b.capturedTo==='équipe'?'dans ton équipe':'dans ta Boîte';
    safeCall(dialog,`<b>Capture réussie !</b><br>${nameOf(enemy)} rejoint ${destination}.${b.captureXP?`<br>${b.captureXP} EXP gagnés.`:''}${events.length?'<br><br>'+events.join('<br>'):''}`);return
  }
  if(events.length)safeCall(dialog,'<b>Résultats</b><br>'+events.join('<br>'))
}

function roundRectPath(g,x,y,w,h,r){
  r=Math.min(r,w/2,h/2);g.beginPath();g.moveTo(x+r,y);g.arcTo(x+w,y,x+w,y+h,r);g.arcTo(x+w,y+h,x,y+h,r);g.arcTo(x,y+h,x,y,r);g.arcTo(x,y,x+w,y,r);g.closePath()
}

function drawCard(m,x,y,w,enemy=false){
  const hpMax=Math.max(1,maxHP(m)),ratio=clamp(m.hp/hpMax,0,1);
  ctx.save();roundRectPath(ctx,x,y,w,78,15);ctx.fillStyle='rgba(250,253,254,.94)';ctx.fill();ctx.strokeStyle='rgba(20,57,76,.24)';ctx.lineWidth=2;ctx.stroke();
  ctx.fillStyle='#173548';ctx.font='900 17px Segoe UI';ctx.fillText(nameOf(m),x+15,y+25);ctx.font='800 12px Segoe UI';ctx.fillText(`N.${m.level}  •  ${typeOf(m)}${m.status?'  •  '+m.status:''}`,x+15,y+44);
  const bx=x+15,by=y+55,bw=w-30;roundRectPath(ctx,bx,by,bw,10,5);ctx.fillStyle='#dbe4e7';ctx.fill();roundRectPath(ctx,bx,by,bw*ratio,10,5);ctx.fillStyle=ratio>.5?'#55ad68':ratio>.22?'#e2ad42':'#d95757';ctx.fill();
  ctx.fillStyle='#294955';ctx.font='800 10px Segoe UI';ctx.textAlign=enemy?'left':'right';ctx.fillText(`${Math.max(0,Math.round(m.hp))}/${hpMax} PV`,enemy?bx:bx+bw,y+76);ctx.textAlign='start';ctx.restore()
}


function moveAnimVariantV106H(move){
  const id=move?._id||move?.id||move?.name||'attaque';
  let h=0;for(const ch of String(id))h=(h*31+ch.charCodeAt(0))>>>0;
  return h
}
function drawMoveAnimationV106H(an,now){
  if(!an||!an.move)return;
  const mv=an.move,rawKind=mv.kind||'normal',type=mv.type||'Neutre',v=moveAnimVariantV106H(mv);
  const typeKind={Nature:'nature',Feu:'fire',Eau:'water',Foudre:'electric',Ombre:'shadow',Roche:'rock',Air:'air',Spore:'poison',Glace:'ice',Lumière:'light',Neutre:'normal'};
  const kind=['heal','buff','debuff'].includes(rawKind)?rawKind:(typeKind[type]||rawKind||'normal');
  const t=clamp((now-an.start)/Math.max(1,an.duration||1),0,1);
  const sx0=an.fromPlayer?275:690,sy0=an.fromPlayer?385:205;
  const tx=an.fromPlayer?690:250,ty=an.fromPlayer?205:390;
  const dir=an.fromPlayer?1:-1;
  ctx.save();
  const curve=((v%7)-3)*22,count=3+(v%6),spin=((v>>3)%5+1)*.7,phase=((v>>6)%100)/100*Math.PI*2;
  const qx=sx0+(tx-sx0)*t,qy=sy0+(ty-sy0)*t+curve*Math.sin(Math.PI*t);
  if(kind==='fire'){
    if(v%3===0){for(let i=0;i<count;i++){const a=phase+i*Math.PI*2/count;ctx.fillStyle=i%2?'#ffc247':'#ff5d34';ctx.beginPath();ctx.arc(qx+Math.cos(a+spin*t)*18,qy+Math.sin(a+spin*t)*18,8+(i%3)*3,0,Math.PI*2);ctx.fill()}}
    else if(v%3===1){ctx.strokeStyle='#ff7038';ctx.lineWidth=13;ctx.beginPath();ctx.moveTo(sx0,sy0);ctx.quadraticCurveTo((sx0+tx)/2,sy0-120+curve,tx,ty);ctx.stroke();ctx.strokeStyle='#ffd053';ctx.lineWidth=5;ctx.stroke()}
    else{for(let i=0;i<7;i++){const tt=clamp(t-i*.045,0,1);ctx.fillStyle=i%2?'#ffe05c':'#ef4d36';ctx.beginPath();ctx.ellipse(sx0+(tx-sx0)*tt,sy0+(ty-sy0)*tt-80*Math.sin(Math.PI*tt),12,6,tt*5,0,Math.PI*2);ctx.fill()}}
  }else if(kind==='water'){
    if(v%3===0){ctx.strokeStyle='#50c9ef';ctx.lineWidth=10;ctx.beginPath();ctx.moveTo(sx0,sy0);for(let i=1;i<=8;i++){const q=i/8;ctx.lineTo(sx0+(tx-sx0)*q,sy0+(ty-sy0)*q+Math.sin(q*10+phase)*24)}ctx.stroke()}
    else if(v%3===1){for(let i=0;i<count+2;i++){const a=phase+i*.8+t*4;ctx.fillStyle='#83dcf5';ctx.beginPath();ctx.arc(qx+Math.cos(a)*28,qy+Math.sin(a)*20,6+(i%2)*3,0,Math.PI*2);ctx.fill()}}
    else{ctx.fillStyle='rgba(73,186,226,.5)';ctx.beginPath();ctx.ellipse(tx,ty,70*t,30*t,0,0,Math.PI*2);ctx.fill()}
  }else if(kind==='electric'){
    ctx.strokeStyle='#ffe649';ctx.lineWidth=4+(v%4);ctx.beginPath();ctx.moveTo(sx0,sy0);const seg=6+(v%5);for(let i=1;i<=seg;i++){const q=i/seg;ctx.lineTo(sx0+(tx-sx0)*q+((i%2?1:-1)*(10+(v%17))),sy0+(ty-sy0)*q)}ctx.stroke();if(v%2){ctx.fillStyle='rgba(255,239,93,.35)';ctx.beginPath();ctx.arc(tx,ty,45*t,0,Math.PI*2);ctx.fill()}
  }else if(kind==='rock'){
    for(let i=0;i<count;i++){const delay=i*.05,tt=clamp((t-delay)/(1-delay),0,1),x=sx0+(tx-sx0)*tt+(i-count/2)*9,y=sy0+(ty-sy0)*tt-(70+(v%60))*Math.sin(Math.PI*tt);ctx.fillStyle=i%2?'#9a8066':'#75604d';ctx.save();ctx.translate(x,y);ctx.rotate(tt*spin+i);ctx.fillRect(-8,-8,16,16);ctx.restore()}
  }else if(kind==='ice'){
    const rays=5+(v%6);ctx.strokeStyle='#c8f7ff';ctx.lineWidth=4;for(let i=0;i<rays;i++){const a=phase+i*Math.PI*2/rays;ctx.beginPath();ctx.moveTo(tx,ty);ctx.lineTo(tx+Math.cos(a)*70*t,ty+Math.sin(a)*55*t);ctx.stroke()}if(v%2){ctx.fillStyle='rgba(215,250,255,.25)';ctx.beginPath();ctx.arc(tx,ty,55*t,0,Math.PI*2);ctx.fill()}
  }else if(kind==='shadow'){
    if(v%2===0){ctx.fillStyle='rgba(72,44,110,.28)';for(let i=0;i<count;i++){ctx.beginPath();ctx.arc(tx+Math.cos(i+phase)*45,ty+Math.sin(i+phase)*35,16+10*t,0,Math.PI*2);ctx.fill()}}else{ctx.strokeStyle='#7352a8';ctx.lineWidth=8;ctx.beginPath();ctx.arc(tx,ty,70*t,phase,phase+Math.PI*1.6);ctx.stroke()}
  }else if(kind==='light'){
    const rays=6+(v%7);ctx.strokeStyle='#fff2a0';ctx.lineWidth=5;for(let i=0;i<rays;i++){const a=i*Math.PI*2/rays+phase;ctx.beginPath();ctx.moveTo(tx,ty);ctx.lineTo(tx+Math.cos(a)*85*t,ty+Math.sin(a)*65*t);ctx.stroke()}
  }else if(kind==='air'||kind==='fly'){
    if(v%2===0){ctx.strokeStyle='#bceefa';ctx.lineWidth=5;for(let i=0;i<4+(v%3);i++){ctx.beginPath();ctx.arc(tx,ty,20+i*14,phase+t*3,phase+t*3+Math.PI*1.3);ctx.stroke()}}else{for(let i=0;i<count;i++){ctx.fillStyle='rgba(205,244,250,.55)';ctx.beginPath();ctx.ellipse(qx-i*14*dir,qy+Math.sin(i+phase)*18,20,6,-.3*dir,0,Math.PI*2);ctx.fill()}}
  }else if(kind==='nature'){
    const n=5+(v%5);for(let i=0;i<n;i++){const a=phase+i*Math.PI*2/n+t*2;ctx.fillStyle=i%2?'#6fc46b':'#9ed56e';ctx.save();ctx.translate(tx+Math.cos(a)*52*t,ty+Math.sin(a)*38*t);ctx.rotate(a);ctx.beginPath();ctx.ellipse(0,0,7,16,0,0,Math.PI*2);ctx.fill();ctx.restore()}
  }else if(kind==='poison'){
    const n=4+(v%6);for(let i=0;i<n;i++){ctx.fillStyle=`rgba(168,73,184,${.25+.05*(i%3)})`;ctx.beginPath();ctx.arc(tx+(i-n/2)*13,ty-25*Math.sin(t*Math.PI+i+phase),8+(v+i)%8,0,Math.PI*2);ctx.fill()}
  }else if(kind==='heal'){
    const n=5+(v%5);ctx.fillStyle='rgba(106,221,139,.55)';for(let i=0;i<n;i++){const a=phase+i*Math.PI*2/n+t;ctx.beginPath();ctx.arc(sx0+Math.cos(a)*38*t,sy0+Math.sin(a)*38*t,7+(i%2)*3,0,Math.PI*2);ctx.fill()}
  }else if(kind==='buff'||kind==='debuff'){
    const up=kind==='buff'?-1:1;ctx.strokeStyle=kind==='buff'?'#ffd16a':'#a575c8';ctx.lineWidth=5;for(let i=0;i<3+(v%3);i++){const ox=(i-1)*22;ctx.beginPath();ctx.moveTo(sx0+ox,sy0);ctx.lineTo(sx0+ox,sy0+up*65*t);ctx.lineTo(sx0+ox-8,sy0+up*50*t);ctx.moveTo(sx0+ox,sy0+up*65*t);ctx.lineTo(sx0+ox+8,sy0+up*50*t);ctx.stroke()}
  }else{
    const mode=v%4;if(mode===0){ctx.fillStyle='#f2d49b';ctx.beginPath();ctx.arc(qx,qy,10+(v%8),0,Math.PI*2);ctx.fill()}else if(mode===1){ctx.strokeStyle='#f3e1b7';ctx.lineWidth=7;ctx.beginPath();ctx.moveTo(tx-45*t,ty-30);ctx.lineTo(tx+45*t,ty+30);ctx.stroke()}else if(mode===2){ctx.strokeStyle='rgba(245,224,181,.8)';ctx.lineWidth=6;for(let i=0;i<3;i++){ctx.beginPath();ctx.arc(tx,ty,20+i*18*t,0,Math.PI*2);ctx.stroke()}}else{ctx.fillStyle='rgba(238,209,154,.45)';ctx.beginPath();ctx.ellipse(qx,qy,35,12,0,0,Math.PI*2);ctx.fill()}
  }
  if(an.impact&&t>.68){const k=clamp((t-.68)/.32,0,1);ctx.globalAlpha*=1-k;ctx.strokeStyle='#fff';ctx.lineWidth=5;ctx.beginPath();ctx.arc(tx,ty,18+48*k,0,Math.PI*2);ctx.stroke()}
  ctx.restore()
}

function drawSpriteSafe(m,x,y,size,direction){
  try{
    if(typeof window.drawCreatureFacingV105O==='function')window.drawCreatureFacingV105O(ctx,m.id,x,y,size,direction,1,1);
    else drawCreature(m.id,x,y,size,direction==='back')
  }catch(err){
    ctx.save();ctx.fillStyle=TYPE_COLORS[typeOf(m)]||TYPE_COLORS.Neutre;ctx.beginPath();ctx.ellipse(x+size/2,y+size*.62,size*.31,size*.28,0,0,Math.PI*2);ctx.fill();ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(x+size*.4,y+size*.53,6,0,Math.PI*2);ctx.arc(x+size*.6,y+size*.53,6,0,Math.PI*2);ctx.fill();ctx.restore()
  }
}

function easeOutCubic(t){return 1-Math.pow(1-clamp(t,0,1),3)}
function easeInOut(t){t=clamp(t,0,1);return t<.5?2*t*t:1-Math.pow(-2*t+2,2)/2}
function orbProgress(orb,now){return clamp((now-orb.start)/Math.max(1,orb.duration||1),0,1)}

function drawFallbackOrb(kind,x,y,size,rotation,alpha=1){
  const p=ORB_PROFILES[kind]||ORB_PROFILES.Orbe,colors=kind==='MegaOrbe'?['#17142d','#7639a8']:kind==='SuperOrbe'?['#164eb6','#d7e6f5']:['#f4ead1','#0d777c'];
  ctx.save();ctx.globalAlpha*=alpha;ctx.translate(x,y);ctx.rotate(rotation);ctx.shadowColor=p.glow;ctx.shadowBlur=14;
  ctx.fillStyle=colors[0];ctx.strokeStyle='#d4a84c';ctx.lineWidth=3;ctx.beginPath();ctx.arc(0,0,size*.39,0,Math.PI*2);ctx.fill();ctx.stroke();
  ctx.fillStyle=colors[1];for(let i=0;i<3;i++){ctx.rotate(Math.PI*2/3);ctx.beginPath();ctx.arc(0,-size*.18,size*.22,.12*Math.PI,.88*Math.PI);ctx.lineTo(0,0);ctx.closePath();ctx.fill()}
  ctx.fillStyle=p.glow;ctx.beginPath();ctx.moveTo(0,-size*.18);ctx.lineTo(size*.18,size*.14);ctx.lineTo(-size*.18,size*.14);ctx.closePath();ctx.fill();ctx.restore()
}

function drawOrbAsset(kind,x,y,size,rotation=0,alpha=1,scale=1){
  const profile=ORB_PROFILES[kind]||ORB_PROFILES.Orbe,image=ORB_IMAGES[kind];
  ctx.save();ctx.globalAlpha*=alpha;ctx.translate(x,y);ctx.rotate(rotation);ctx.scale(scale,scale);ctx.shadowColor=profile.glow;ctx.shadowBlur=18;
  if(image?.complete&&image.naturalWidth)ctx.drawImage(image,-size/2,-size/2,size,size);
  else{ctx.restore();drawFallbackOrb(kind,x,y,size*scale,rotation,alpha);return}
  ctx.restore()
}

function drawEnergyTriangle(x,y,r,color,alpha=1,rotation=0){
  ctx.save();ctx.translate(x,y);ctx.rotate(rotation);ctx.globalAlpha*=alpha;ctx.strokeStyle=color;ctx.lineWidth=3;ctx.beginPath();
  ctx.moveTo(0,-r);ctx.lineTo(r*.87,r*.5);ctx.lineTo(-r*.87,r*.5);ctx.closePath();ctx.stroke();ctx.restore()
}

function orbEnemyOpacity(orb,now){
  if(!orb)return 1;
  const t=orbProgress(orb,now);
  if(orb.stage==='absorb')return 1-easeInOut(t);
  if(['fall','shake','sealed'].includes(orb.stage))return 0;
  if(orb.stage==='break')return easeOutCubic(t);
  return 1
}

function drawOrbSequence(orb,now){
  if(!orb)return;
  const t=orbProgress(orb,now),profile=ORB_PROFILES[orb.kind]||ORB_PROFILES.Orbe;
  let x=690,y=322,size=84,rotation=0,alpha=1,scale=1;
  if(orb.stage==='throw'){
    const e=easeOutCubic(t);x=300+(690-300)*e;y=385+(230-385)*e-Math.sin(Math.PI*t)*70;size=68+24*e;rotation=t*Math.PI*3.6;
    for(let i=1;i<=5;i++){const q=clamp(t-i*.035,0,1),qe=easeOutCubic(q),tx=300+(690-300)*qe,ty=385+(230-385)*qe-Math.sin(Math.PI*q)*70;drawEnergyTriangle(tx,ty,8+i,profile.glow,.16*(6-i),rotation-i*.45)}
  }else if(orb.stage==='absorb'){
    x=690;y=230;size=96;rotation=t*Math.PI*.8;scale=1+Math.sin(t*Math.PI)*.14;
    const pulse=30+130*easeOutCubic(t);ctx.save();ctx.globalAlpha=.72*(1-t);ctx.strokeStyle=profile.glow;ctx.lineWidth=5;ctx.beginPath();ctx.arc(x,y,pulse,0,Math.PI*2);ctx.stroke();ctx.restore();
    for(let i=0;i<5;i++)drawEnergyTriangle(x,y,24+t*70+i*11,profile.glow,(1-t)*.42,t*2+i);
    ctx.save();ctx.globalCompositeOperation='screen';ctx.globalAlpha=Math.sin(Math.PI*t)*.72;ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(x,y,45+55*t,0,Math.PI*2);ctx.fill();ctx.restore()
  }else if(orb.stage==='fall'){
    const e=easeInOut(t);x=690;y=230+(322-230)*e-Math.sin(Math.PI*t)*24;size=88;rotation=(1-t)*1.4;
  }else if(orb.stage==='shake'){
    const side=(orb.shakeIndex||0)%2===0?1:-1;x=690+side*Math.sin(Math.PI*t)*28;y=322-Math.sin(Math.PI*t)*11;rotation=side*Math.sin(Math.PI*t)*.38;
    ctx.save();ctx.globalAlpha=.28*(1-t);ctx.fillStyle=profile.glow;ctx.beginPath();ctx.ellipse(690,338,55+18*t,12+5*t,0,0,Math.PI*2);ctx.fill();ctx.restore()
  }else if(orb.stage==='sealed'){
    const pulse=Math.sin(t*Math.PI*4);scale=1+pulse*.045;rotation=pulse*.035;
    for(let i=0;i<9;i++){const a=i*Math.PI*2/9+t*.8,r=48+38*t;drawEnergyTriangle(x+Math.cos(a)*r,y+Math.sin(a)*r*.55,7,profile.glow,(1-t)*.8,a+t)}
    drawEnergyTriangle(x,y,48+22*t,profile.glow,(1-t)*.85,t*Math.PI)
  }else if(orb.stage==='break'){
    x=690;y=300-28*easeOutCubic(t);rotation=t*Math.PI*1.6;scale=1+t*.45;alpha=1-t;
    for(let i=0;i<10;i++){const a=i*Math.PI*2/10,r=25+125*easeOutCubic(t);drawEnergyTriangle(x+Math.cos(a)*r,y+Math.sin(a)*r*.7,11,profile.glow,1-t,a)}
    ctx.save();ctx.globalAlpha=(1-t)*.7;ctx.strokeStyle=profile.glow;ctx.lineWidth=7*(1-t)+1;ctx.beginPath();ctx.arc(x,y,35+145*t,0,Math.PI*2);ctx.stroke();ctx.restore()
  }
  drawOrbAsset(orb.kind,x,y,size,rotation,alpha,scale)
}

function drawBattleV105R(){
  if(!combatReady())return;
  const now=performance.now(),p=currentPlayer(),e=battle.enemy;
  const grad=ctx.createLinearGradient(0,0,0,600);grad.addColorStop(0,'#7fc7d9');grad.addColorStop(.55,'#c7e8d3');grad.addColorStop(1,'#73aa75');ctx.fillStyle=grad;ctx.fillRect(0,0,960,600);
  ctx.save();ctx.globalAlpha=.22;ctx.fillStyle='#fff';for(let i=0;i<8;i++){ctx.beginPath();ctx.arc(80+i*145,75+(i%3)*42,42+(i%2)*15,0,Math.PI*2);ctx.fill()}ctx.restore();
  ctx.fillStyle='rgba(40,91,63,.25)';ctx.beginPath();ctx.ellipse(250,465,205,46,0,0,Math.PI*2);ctx.fill();ctx.beginPath();ctx.ellipse(690,275,165,37,0,0,Math.PI*2);ctx.fill();
  let px=115,py=270,ex=570,ey=70,ps=255,es=230;
  if(battle.anim){const t=clamp((now-battle.anim.start)/battle.anim.duration,0,1),hop=Math.sin(t*Math.PI)*34;if(battle.anim.fromPlayer)px+=hop;else ex-=hop;if(battle.anim.impact&&t>.7){if(battle.anim.fromPlayer)ex+=Math.sin(now/25)*7;else px+=Math.sin(now/25)*7}}
  drawSpriteSafe(p,px,py,ps,'back');
  ctx.save();ctx.globalAlpha*=orbEnemyOpacity(battle.orb,now);drawSpriteSafe(e,ex,ey,es,'front');ctx.restore();
  drawOrbSequence(battle.orb,now);
  if(battle.anim)drawMoveAnimationV106H(battle.anim,now);
  drawCard(e,525,24,380,true);drawCard(p,35,405,410,false);
  ctx.save();ctx.fillStyle='rgba(18,50,68,.86)';roundRectPath(ctx,18,18,180,33,11);ctx.fill();ctx.fillStyle='#fff';ctx.font='900 13px Segoe UI';ctx.fillText('COMBAT — MOTEUR V105U',32,40);ctx.restore()
}

// V105T : l'approche d'un dresseur ne peut plus rester bloquee sur « ! ».
// Une collision ou une position de bord de route ne doit jamais empecher le combat.
function updateTrainerEventV105T(){
  if(!trainerEvent||scene!=='world')return;
  const e=trainerEvent,t=e.trainer,now=performance.now();
  if(!t||state.trainerWins?.[t.id]){trainerEvent=null;return}
  if(e.stage==='alert'){
    t.moving=false;
    if(now-e.start<=520)return;
    e.stage='approach';e.start=now;e.deadline=now+1500
  }
  if(e.stage!=='approach'){
    if(now-e.start<=1800)return;
    e.stage='approach';e.deadline=now
  }
  const dx=state.x-t.x,dy=state.y-t.y,d=Math.hypot(dx,dy);
  if(d>72&&now<(e.deadline||now)){
    const step=Math.min(7,Math.max(0,d-68));
    if(d>0){t.x+=dx/d*step;t.y+=dy/d*step}
    t.moving=true;safeCall(faceNPCToPlayer,t);return
  }
  t.moving=false;trainerEvent=null;
  const partySize=Math.max(1,Number(safeCall(trainerPartySize,t))||1);
  const challenge=safeCall(trainerChallengeLine,t)||'Prepare-toi au combat !';
  const title=t.dialog||t.name||'Un dresseur te defie !';
  safeCall(dialog,'<b>'+title+'</b><br>'+challenge+'<br><br><small>Equipe adverse : '+partySize+' creature'+(partySize>1?'s':'')+'.</small>',()=>beginTrainer(t))
}

function brandV105R(){
  const creator=typeof v61CreatorMode==='function'&&v61CreatorMode();
  const brand=document.querySelector('.brand b');if(brand)brand.textContent=`VALDORA ${VERSION} — ${creator?'CRÉATEUR':'JOUEUR'}`;
  document.title=`VALDORA ${VERSION} — combats réécrits`;document.documentElement.dataset.valdoraVersion=VERSION;document.documentElement.dataset.combatEngine=VERSION
}

function installOrbEconomy(){
  ensureOrbInventory();preloadOrbImages();
  if(typeof SHOP_ITEMS==='object'){
    SHOP_ITEMS.Orbe={...(SHOP_ITEMS.Orbe||{}),label:"Orbe d'Éclat",price:50,desc:'Capture standard à noyau ambré.'};
    SHOP_ITEMS.SuperOrbe={...(SHOP_ITEMS.SuperOrbe||{}),label:'Super Orbe',price:240,desc:'Flux renforcé pour les captures difficiles.'};
    SHOP_ITEMS.MegaOrbe={label:'Méga Orbe',price:1800,desc:'Orbe d’élite vendue seulement très tard dans l’aventure.'}
  }
  if(!window.__v105uShopInstalled){
    window.__v105uShopInstalled=true;
    const priorNormal=window.pNormalShopIdsV101P;
    window.pNormalShopIdsV101P=function(){
      const ids=priorNormal?priorNormal():['Potion','Orbe','Antidote','Baie'];
      const seals=(state.seals||[]).length,town=Number(String(state.zone||'').match(/\d+/)?.[0]||0),creator=typeof v61CreatorMode==='function'&&v61CreatorMode();
      if(creator||seals>=3||town>=7)ids.push('SuperOrbe');
      if(creator||seals>=6||town>=12)ids.push('MegaOrbe');
      return [...new Set(ids)]
    };
    const priorMarket=window.pMarketItemIdsV101P;
    if(priorMarket)window.pMarketItemIdsV101P=function(){
      const ids=priorMarket(),seals=(state.seals||[]).length,town=Number(String(state.zone||'').match(/\d+/)?.[0]||0),creator=typeof v61CreatorMode==='function'&&v61CreatorMode();
      if(creator||seals>=6||town>=12)ids.push('MegaOrbe');
      return [...new Set(ids)]
    }
  }
}

// Remplacement des points d'entrée historiques utilisés dans le reste du jeu.
startBattle=beginBattle;window.startBattle=beginBattle;
startTrainer413=beginTrainer;window.startTrainer413=beginTrainer;
startWild=beginWild;window.startWild=beginWild;
drawBattle=drawBattleV105R;window.drawBattle=drawBattleV105R;
buildBattleButtons=buildButtons;window.buildBattleButtons=buildButtons;
chooseMove=chooseMoveV105R;window.chooseMove=chooseMoveV105R;
enemyTurn=enemyTurnV105R;window.enemyTurn=enemyTurnV105R;
throwBattleOrb=throwOrb;window.throwBattleOrb=throwOrb;
changeBattleCreature=function(){if(combatReady()&&!battle.busy){battle.menu='team';buildButtons()}};window.changeBattleCreature=changeBattleCreature;
runBattle=runV105R;window.runBattle=runV105R;
finishBattle=finishV105R;window.finishBattle=finishV105R;
battleAlive=combatReady;window.battleAlive=combatReady;
updateTrainerEvent=updateTrainerEventV105T;window.updateTrainerEvent=updateTrainerEventV105T;

window.ValdoraCombatV105R=window.ValdoraCombatV105U={
  version:VERSION,
  diagnostics:()=>({engine:battle?.engine||VERSION,scene,active:!!battle,phase:battle?.phase||null,busy:!!battle?.busy,enemy:battle?.enemy?.id||null,player:battle?.player?.id||null}),
  startWild:beginWild,startTrainer:beginTrainer,startBattle:beginBattle,
  minimumLegalLevel,
  testBattle:()=>beginBattle(mon(CREATURES[0].id,Math.max(3,currentPlayer()?.level||5)),null)
};

installInterface();installOrbEconomy();brandV105R();setTimeout(brandV105R,9800);setTimeout(brandV105R,11400);
})();
