// VALDORA V125 — Chapitre I : rendre les premières heures mémorables
(function(){
'use strict';
const VERSION='V125-FIRST-HOURS-1';
const STORY_TITLE='Chapitre I — La première Résonance';
let lastStateRef=null,lastZone='',lastNpcSignature='',lastObjectiveFn=null;

function S(){try{return typeof state!=='undefined'&&state&&typeof state==='object'?state:null}catch(_){return null}}
function creator(){try{return /CREATEUR/i.test(location.pathname)||window.CREATOR_MODE===true||window.creatorMode===true}catch(_){return /CREATEUR/i.test(location.pathname)}}
function story(){
  const s=S();if(!s)return null;
  if(!s.v125Story||typeof s.v125Story!=='object')s.v125Story={stage:0,witnesses:{},started:false,completed:false,version:VERSION};
  const q=s.v125Story;q.witnesses=q.witnesses&&typeof q.witnesses==='object'?q.witnesses:{};q.version=VERSION;return q
}
function saveQuiet(){try{if(typeof save==='function')save(false)}catch(_){}try{if(typeof hud==='function')hud()}catch(_){} }
function caughtCount(){
  const s=S();if(!s)return 0;const ids=new Set();
  for(const [id,d] of Object.entries(s.dex||{}))if(d?.caught)ids.add(String(Number(id)));
  for(const m of [...(s.team||[]),...(s.box||[])])if(m?.id!=null)ids.add(String(Number(m.id)));
  return ids.size
}
function log(text){try{if(typeof logEvent==='function')logEvent(text)}catch(_){} }
function notify(title,text){
  let el=document.getElementById('v125StoryNotice');
  if(!el){el=document.createElement('div');el.id='v125StoryNotice';el.innerHTML='<b></b><span></span>';document.body.appendChild(el)}
  el.querySelector('b').textContent=title;el.querySelector('span').textContent=text;el.classList.remove('show');void el.offsetWidth;el.classList.add('show');
  clearTimeout(el._v125Timer);el._v125Timer=setTimeout(()=>el.classList.remove('show'),4300)
}
function style(){
  if(document.getElementById('v125StoryStyle'))return;const st=document.createElement('style');st.id='v125StoryStyle';st.textContent=`
  #v125StoryNotice{position:fixed;z-index:2400000;left:50%;top:max(18px,calc(env(safe-area-inset-top) + 10px));width:min(520px,calc(100vw - 28px));transform:translate(-50%,-18px);opacity:0;pointer-events:none;padding:13px 16px;border-radius:18px;background:rgba(8,31,47,.94);color:#fff;border:1px solid rgba(130,225,255,.34);box-shadow:0 14px 42px rgba(0,0,0,.4);backdrop-filter:blur(10px);transition:.22s ease;font-family:Inter,Segoe UI,Arial,sans-serif}
  #v125StoryNotice.show{transform:translate(-50%,0);opacity:1}#v125StoryNotice b{display:block;color:#8fe2c4;font-size:13px;letter-spacing:.045em;margin-bottom:4px}#v125StoryNotice span{display:block;font-size:12px;line-height:1.4;color:#edf8fb}
  #v125StoryCreator{background:linear-gradient(#fff7d6,#f0d58d)!important}
  @media(max-height:520px){#v125StoryNotice{top:7px;padding:9px 12px;border-radius:13px}#v125StoryNotice b{font-size:11px}#v125StoryNotice span{font-size:10px}}
  `;document.head.appendChild(st)
}
function migrate(){
  const s=S(),q=story();if(!s||!q)return;
  if(q.migrated)return;
  const discovered=new Set(s.discovered||[]),seals=(s.seals||[]).length;
  if(!s.team?.length)q.stage=0;
  else if(seals>0||discovered.has('town1')||[...(s.discovered||[])].some(z=>/^town(?:[2-9]|1[0-4])$/.test(String(z)))){q.stage=6;q.completed=true;q.legacyCompleted=true}
  else if(discovered.has('route0'))q.stage=4;
  else q.stage=1;
  q.started=q.stage>0;q.migrated=true;q.migratedAt=Date.now();saveQuiet()
}
function setStage(n,msg){const q=story();if(!q)return;q.stage=n;q.started=n>0;if(n>=6){q.completed=true;q.completedAt=q.completedAt||Date.now()}saveQuiet();syncNPCs(true);if(msg)notify(STORY_TITLE,msg)}
function rewardFinal(){
  const s=S(),q=story();if(!s||!q||q.rewarded)return '';
  s.inventory=s.inventory||{};s.inventory.Potion=(s.inventory.Potion||0)+3;s.inventory.SuperOrbe=(s.inventory.SuperOrbe||0)+2;
  let bonus='';if(caughtCount()>=5){s.inventory.SuperPotion=(s.inventory.SuperPotion||0)+1;bonus=' Comme ton Codex contient déjà au moins cinq espèces, je t’ajoute aussi une Super Potion.'}
  q.rewarded=true;log('Chapitre I terminé : Orée remet 3 Potions et 2 Super Orbes.');saveQuiet();return bonus
}
function storyDialogue(n){
  const q=story();if(!q)return n.text||'...';
  switch(n.v125Id){
    case 'oree_clairval':
      if(q.stage===1){setStage(2,'Interroge Maëlle et Rémi à Clairval.');log('Orée ouvre une enquête sur une anomalie de Résonance à Clairval.');return '<b>Orée</b> travaille avec le Professeur Aurine sur le terrain.<br><br>« Tu es le nouveau partenaire d’Aurine ? Parfait. Depuis hier soir, nos capteurs enregistrent une <b>Résonance anormale</b> sous Clairval. Ce n’est pas un simple phénomène naturel : quelqu’un a effectué des relevés avant nous.<br><br><b>Maëlle</b> a vu des lumières près des jardins. <b>Rémi</b>, lui, était à la gare quand un groupe étrange est arrivé. Parle-leur, puis reviens me voir. »'}
      if(q.stage===3){q.fieldScanner=true;setStage(4,'Prépare ton équipe, puis enquête sur la Route 1.');log('Orée confie un module de relevé pour suivre la Résonance sur la Route 1.');return '« Les deux témoignages se recoupent. Les uniformes décrits par Rémi ressemblent à ceux de la <b>Team Taron</b>, et les balises vues par Maëlle sont du matériel de mesure.<br><br>Je viens d’ajouter un <b>module de relevé</b> à ton Codex. Quand tu seras prêt à quitter Clairval, garde les yeux ouverts sur la <b>Route 1</b>. Si la vibration revient, ils ne seront probablement pas loin. »'}
      return '« Continue l’enquête. Les petites incohérences sont souvent les traces les plus importantes. »';
    case 'maelle':
      if(!q.witnesses.maelle){q.witnesses.maelle=true;log('Témoignage de Maëlle enregistré.');notify('Témoignage enregistré','Maëlle a vu des balises lumineuses près de Clairval.');if(q.witnesses.remi)setStage(3,'Les deux témoignages sont complets. Retourne voir Orée.');else saveQuiet()}
      return '« J’étais dehors tard hier. J’ai vu trois petites balises bleues plantées près du chemin, puis quelqu’un les a récupérées dès que le sol s’est mis à vibrer. Ce n’était pas du matériel d’Aurine : je connais ses caisses de terrain. »';
    case 'remi':
      if(!q.witnesses.remi){q.witnesses.remi=true;log('Témoignage de Rémi enregistré.');notify('Témoignage enregistré','Rémi a aperçu des inconnus venus par la gare.');if(q.witnesses.maelle)setStage(3,'Les deux témoignages sont complets. Retourne voir Orée.');else saveQuiet()}
      return '« Juste avant la fermeture, trois voyageurs sont descendus sans bagages. Vestes sombres, symbole violet, et ils posaient beaucoup de questions sur les anciennes galeries sous Clairval. Ils sont repartis avant le premier train du matin. »';
    case 'taron_route1':
      if(q.stage===4){q.routeClue=true;setStage(5,'Atteins Rochebrune et retrouve Orée.');log('Un éclaireur Taron confirme l’existence d’un Projet Résonance.');return 'L’inconnu range brusquement son appareil.<br><br>« Tu n’as rien vu. Les données du <b>Projet Résonance</b> ne concernent pas les petits dresseurs de Clairval… Attends. Ce signal… ton Éclat réagit lui aussi ? »<br><br>Il recule, jette un regard vers le nord puis disparaît par le sentier. Sur son écran, tu as eu le temps de lire : <b>RÉSONANCE — PHASE 1 / ROCHEBRUNE</b>.'}
      return 'Il ne reste ici que des traces de pas et une marque violette presque effacée.';
    case 'oree_rochebrune':
      if(q.stage===5){const bonus=rewardFinal();setStage(6,'Chapitre I terminé — l’enquête sur le Projet Résonance commence vraiment.');q.oreeTrust=(q.oreeTrust||0)+1;saveQuiet();return '« Tu l’as donc vu toi aussi… <b>Projet Résonance</b>. Aurine craignait que la Team Taron ne cherche à provoquer artificiellement les perturbations.<br><br>Ce qui m’inquiète le plus, c’est la réaction de ton premier Éclat au signal. Ça signifie que cette histoire te concerne peut-être davantage qu’on ne le pensait.<br><br>Garde ton Codex avec toi. Je vais suivre leur piste de mon côté, et on se recroisera. Tiens : <b>3 Potions et 2 Super Orbes</b> pour la route.'+bonus+' »'}
      return '« L’affaire de Clairval n’était que le début. Continue à observer les endroits où les Éclats se comportent étrangement. On se reverra. »';
  }
  return n.text||'...'
}
function evolvedDialogue(n){
  const q=story();if(!q||q.stage<6||S()?.zone!=='town0')return null;
  const seal=(S()?.seals||[]).length;
  if(n.id==='lina')return seal?'Depuis ton départ, Aurine reçoit des relevés de toute la région. Clairval est devenu un vrai point de coordination.':'Aurine et Orée comparent sans arrêt leurs relevés. Tout le laboratoire parle maintenant du Projet Résonance.';
  if(n.id==='marc')return seal?'Tu te souviens quand je te disais de préparer quelques Orbes pour la Route 1 ? Maintenant, c’est toi qui donnes des conseils aux nouveaux.':'Depuis ce qui s’est passé sur la Route 1, les voyageurs font beaucoup plus attention aux gens en uniforme violet.';
  if(n.id==='jade')return seal?'On entend parler de tes Sceaux jusque dans le Centre de Clairval. Ça fait drôle de te voir revenir ici.':'Le Centre a reçu plusieurs Éclats agités après la perturbation. On dirait que toute la ville l’a ressentie.';
  return null
}
function installDialogueHook(){
  let current=null;try{current=window.npcDialogue||(typeof npcDialogue==='function'?npcDialogue:null)}catch(_){current=window.npcDialogue}
  if(typeof current!=='function'||current.__v125Outer)return;
  const base=current;const wrapped=function(n){if(n?.v125Story)return storyDialogue(n);const evolved=evolvedDialogue(n);if(evolved)return evolved;return base(n)};
  wrapped.__v125Outer=true;wrapped.__v125Base=base;window.npcDialogue=wrapped;try{npcDialogue=wrapped}catch(_){}
}
function storyNpc(id,zone,x,y,look,name,v125Id){return {id:`special_v125_${id}`,zone,x,y,look,dir:0,name,text:'',v125Id,v125Story:true,stationaryV118:true}}
function desiredNPCs(){
  const q=story();if(!q)return [];const a=[];
  if(q.stage===1||q.stage===3)a.push(storyNpc('oree_clairval','town0',790,690,7,'Orée','oree_clairval'));
  if(q.stage===2){a.push(storyNpc('maelle','town0',650,600,11,'Maëlle','maelle'));a.push(storyNpc('remi','town0',1050,650,12,'Rémi','remi'))}
  if(q.stage===4)a.push(storyNpc('taron_route1','route0',1500,350,15,'Éclaireur inconnu','taron_route1'));
  if(q.stage===5||(q.stage===6&&(S()?.seals||[]).length===0))a.push(storyNpc('oree_rochebrune','town1',900,610,7,'Orée','oree_rochebrune'));
  return a
}
function syncNPCs(force=false){
  let list=null;try{list=typeof NPCDATA!=='undefined'&&Array.isArray(NPCDATA)?NPCDATA:null}catch(_){return}if(!list)return;
  const want=desiredNPCs(),sig=want.map(n=>`${n.id}:${n.zone}`).join('|');if(!force&&sig===lastNpcSignature&&list.some(n=>n?.v125Story)===!!want.length)return;
  for(let i=list.length-1;i>=0;i--)if(list[i]?.v125Story)list.splice(i,1);for(const n of want)list.push(n);lastNpcSignature=sig;
  try{if(S()?.zone?.startsWith('town'))window.ValdoraV123?.maintain?.()}catch(_){}
}
function objective(){
  const q=story();if(!q||q.stage<=0||q.stage>=6)return null;
  if(q.stage===1)return {title:STORY_TITLE,progress:'Nouvelle enquête',txt:'Trouve Orée dans les rues de Clairval après avoir reçu ton premier Éclat.'};
  if(q.stage===2){const n=Number(!!q.witnesses.maelle)+Number(!!q.witnesses.remi);return {title:STORY_TITLE,progress:`${n}/2 témoignages`,txt:'Interroge Maëlle et Rémi à Clairval sur les événements de la nuit.'}}
  if(q.stage===3)return {title:STORY_TITLE,progress:'Témoignages complets',txt:'Retourne voir Orée à Clairval.'};
  if(q.stage===4)return {title:STORY_TITLE,progress:'Piste : Route 1',txt:'Prépare au moins trois Éclats de niveau 10 comme prévu par Aurine, puis cherche la source de la Résonance sur la Route 1.'};
  if(q.stage===5)return {title:STORY_TITLE,progress:'Projet Résonance',txt:'Atteins Rochebrune et retrouve Orée pour lui rapporter ce que tu as découvert.'};
  return null
}
function installObjectiveHook(){
  let current=null;try{current=window.objectivesV84||(typeof objectivesV84==='function'?objectivesV84:null)}catch(_){current=window.objectivesV84}
  if(typeof current!=='function'||current===lastObjectiveFn)return;
  if(current.__v125Outer){lastObjectiveFn=current;return}
  const base=current;const wrapped=function(){let q=[];try{q=base()||[]}catch(_){q=[]}q=q.filter(x=>x?.title!==STORY_TITLE);const o=objective();if(o)q.unshift(o);return q};
  wrapped.__v125Outer=true;wrapped.__v125Base=base;window.objectivesV84=wrapped;try{objectivesV84=wrapped}catch(_){}lastObjectiveFn=wrapped
}
function routePulse(){
  const s=S(),q=story();if(!s||!q||q.stage!==4||s.zone!=='route0'||q.routePulseSeen)return;
  q.routePulseSeen=true;saveQuiet();notify('Résonance détectée','Le sol vibre brièvement. Ton Éclat se tourne vers le nord avant même que tu ne bouges.');log('Une impulsion de Résonance traverse la Route 1.')
}
function returnToClairval(){
  const s=S(),q=story();if(!s||!q||q.stage<6||q.clairvalReturnSeen||s.zone!=='town0'||lastZone==='town0')return;
  q.clairvalReturnSeen=true;saveQuiet();notify('Clairval a changé','Les habitants parlent désormais de la perturbation et de l’enquête d’Aurine. Certains dialogues ont évolué.')
}
function creatorButton(){
  if(!creator()||document.getElementById('v125StoryCreator'))return;const grid=document.querySelector('aside .panel:nth-of-type(3) .grid')||document.querySelector('aside .grid');if(!grid)return;
  const b=document.createElement('button');b.id='v125StoryCreator';b.textContent='Chapitre I';b.onclick=()=>{
    const q=story(),text=`V125 — étape ${q?.stage??0}/6`;
    if(typeof openSimpleMenu==='function')openSimpleMenu('Créateur — Chapitre I',`<div class="quest"><b>${text}</b><br>Permet de rejouer et tester le nouveau début sans modifier le reste du mode Créateur.</div><button onclick="ValdoraFirstHoursV125.resetStory()">Rejouer depuis Clairval</button><button onclick="ValdoraFirstHoursV125.completeStory()">Marquer comme terminé</button>`);else notify('Créateur — Chapitre I',text+' • utilise ValdoraFirstHoursV125.resetStory() pour le rejouer.');
  };grid.appendChild(b)
}
function resetStory(){
  const s=S();if(!s)return false;s.v125Story={stage:s.team?.length?1:0,witnesses:{},started:!!s.team?.length,completed:false,migrated:true,version:VERSION,creatorReplay:creator()};
  if(creator()){s.zone='town0';s.discovered=Array.isArray(s.discovered)?s.discovered:[];if(!s.discovered.includes('town0'))s.discovered.push('town0')}
  lastNpcSignature='';syncNPCs(true);saveQuiet();notify(STORY_TITLE,s.team?.length?'Retrouve Orée à Clairval.':'Choisis d’abord ton premier Éclat chez le Professeur Aurine.');return true
}
function completeStory(){const q=story();if(!q)return false;q.stage=6;q.completed=true;q.migrated=true;lastNpcSignature='';syncNPCs(true);saveQuiet();notify(STORY_TITLE,'Chapitre marqué comme terminé.');return true}
function maintain(){
  style();const s=S();if(!s)return;
  if(s!==lastStateRef){lastStateRef=s;lastNpcSignature='';migrate()}
  const q=story();if(!s.team?.length&&q.stage!==0){q.stage=0;q.completed=false;q.witnesses={};q.started=false;saveQuiet()}
  else if(s.team?.length&&q.stage===0&&!q.completed){q.stage=1;q.started=true;saveQuiet();if(!q.startNotice){q.startNotice=true;notify(STORY_TITLE,'Aurine t’a demandé d’aider son équipe de terrain. Trouve Orée à Clairval.')}}
  installDialogueHook();installObjectiveHook();syncNPCs();routePulse();returnToClairval();creatorButton();lastZone=s.zone||'';document.documentElement.dataset.valdoraFirstHours=VERSION
}
function audit(){const s=S(),q=story();let npcs=[];try{npcs=typeof NPCDATA!=='undefined'?NPCDATA.filter(n=>n?.v125Story).map(n=>({id:n.id,zone:n.zone,x:n.x,y:n.y})):[]}catch(_){}return {version:VERSION,creator:creator(),zone:s?.zone||null,stage:q?.stage??null,witnesses:q?.witnesses||{},completed:!!q?.completed,caught:caughtCount(),storyNpcs:npcs,objective:objective()}}
window.ValdoraFirstHoursV125={version:VERSION,maintain,audit,resetStory,completeStory,notify};
[100,500,1200,2600,5200,9000,14000].forEach(ms=>setTimeout(()=>{try{maintain()}catch(e){console.warn('V125 démarrage',e)}},ms));
setInterval(()=>{try{maintain()}catch(e){console.warn('V125 maintenance',e)}},1800);
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',maintain);else maintain();
console.log('V125 : Chapitre I « La première Résonance » installé.');
})();
