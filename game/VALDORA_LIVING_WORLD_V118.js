// ÉCLATS SAUVAGES — VALDORA V118
// Moteur unifié du monde vivant : populations extérieures et intérieures,
// dialogues contextuels, activités locales, animations ambiantes et implantation urbaine.
(function(){
'use strict';
const VERSION='V118-MONDE-VIVANT';
window.__VALDORA_V118_LIVING_ACTIVE__=true;if(window.ValdoraBusV118Bridge)window.ValdoraBusV118Bridge.ownedByV118=true;if(window.ValdoraChestV118Bridge)window.ValdoraChestV118Bridge.ownedByV118=true;
const TOWNS=Array.from({length:15},(_,i)=>'town'+i);
const BASE={
  drawWorld:window.drawWorld,
  interact:window.interact,
  move:window.move,
  collision:window.collision,
  startWild:window.startWild,
  updateTownNPCs:window.updateTownNPCs,
  nearNPC:window.nearNPC,
  sceneNPCs:typeof sceneNPCs==='function'?sceneNPCs:null,
  drawInterior:window.drawInterior,
  interactInterior:window.interactInterior,
  interior:window.ValdoraInteriorV109V||window.ValdoraBuildingV109I||null
};
if(BASE.interior){
  BASE.interiorEnter=BASE.interior.enter?.bind(BASE.interior);
  BASE.interiorMoveToRoom=BASE.interior.moveToRoom?.bind(BASE.interior);
}

function creator(){try{return typeof v61CreatorMode==='function'?!!v61CreatorMode():location.pathname.toLowerCase().includes('createur')}catch(_){return false}}
function hash(s){let h=2166136261>>>0;for(const c of String(s??'')){h^=c.charCodeAt(0);h=Math.imul(h,16777619)}return h>>>0}
function rng(seed){let a=seed>>>0;return()=>{a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
function clamp(v,a,b){return Math.max(a,Math.min(b,v))}
function distance(a,b){return Math.hypot(Number(a?.x||0)-Number(b?.x||0),Number(a?.y||0)-Number(b?.y||0))}
function rectHit(a,b,p=0){return a.x-p<b.x+b.w+p&&a.x+a.w+p>b.x-p&&a.y-p<b.y+b.h+p&&a.y+a.h+p>b.y-p}
function overlapArea(a,b){const w=Math.max(0,Math.min(a.x+a.w,b.x+b.w)-Math.max(a.x,b.x)),h=Math.max(0,Math.min(a.y+a.h,b.y+b.h)-Math.max(a.y,b.y));return w*h}
function sceneFor(zone){return typeof SCENES==='object'?SCENES?.[zone]:null}
function current(){try{return typeof currentScene==='function'?currentScene():sceneFor(state.zone)}catch(_){return sceneFor(state?.zone)}}
function stateV118(){
  state.v118Living=state.v118Living||{};const s=state.v118Living;
  s.version=VERSION;s.towns=s.towns||{};s.rewards=s.rewards||{};s.region=s.region||{};
  for(const zone of TOWNS)s.towns[zone]=s.towns[zone]||{talks:0,uniqueNpcs:{},interiors:{},visits:0,contracts:{}};
  return s
}
function townState(zone=state.zone){return stateV118().towns[zone]||(stateV118().towns[zone]={talks:0,uniqueNpcs:{},interiors:{},visits:0,contracts:{}})}
function zoneName(zone){return sceneFor(zone)?.name||({town0:'Clairval',town1:'Rochebrune',town2:'Azurive',town3:'Montfaucon',town4:'Belrive',town5:'Soleria',town6:'Novacité',town7:'Valombre',town8:"Cimes d’Or",town9:'Port-Écume',town10:'Luminon',town11:'Brumlac',town12:'Silvaris',town13:'Taronis',town14:'Aubeval'}[zone]||'Valdora')}

// ---------------------------------------------------------------------
// Banque narrative : 96 dialogues différents par ville, soit 1 440
// compositions contextuelles avant même les variantes de rôle/progression.
// ---------------------------------------------------------------------
const OPENERS=[
  'Bonjour, voyageur.','Tiens, te voilà !','Hé, une petite minute.','Bienvenue dans le quartier.','On se croise enfin.','Je faisais justement une pause.','Tu arrives au bon moment.','Entre voyageurs, on peut partager une information.','Quel plaisir de voir une nouvelle tête.','Tu as l’air d’avoir beaucoup marché.','Je surveille souvent les allées et venues.','Approche, j’ai peut-être quelque chose d’utile à te dire.','La journée est animée, pas vrai ?','J’aime prendre le temps de parler aux dresseurs.','On n’apprend jamais autant qu’en discutant.','Les nouvelles circulent vite à Valdora.'
];
const CONTEXTS=[
  'Depuis quelques jours, les habitants remarquent des changements subtils dans le comportement des Éclats.',
  'Les commerçants disent que les voyageurs préparent leurs équipes avec beaucoup plus de soin qu’avant.',
  'Les anciens du quartier comparent chaque nouvelle rumeur aux récits conservés dans les musées.',
  'Les enfants inventent déjà des histoires sur les dresseurs capables de traverser toute la région.',
  'On reconnaît les bons explorateurs à leur manière de regarder les chemins secondaires.',
  'La Team Taron préfère les endroits où personne ne prend le temps de poser des questions.',
  'Les transports rapprochent les villes, mais chaque route garde encore ses propres secrets.',
  'Certains phénomènes de Résonance semblent plus intenses lorsque plusieurs types d’Éclats voyagent ensemble.',
  'Les Gardiens observent autant la patience et la curiosité que la force brute.',
  'Les habitants se souviennent des dresseurs qui reviennent prendre de leurs nouvelles.',
  'Les directeurs de musée échangent discrètement des rapports sur les découvertes récentes.',
  'Les boutiques adaptent parfois leurs conseils à la progression des voyageurs.',
  'Une équipe bien préparée peut transformer un détour difficile en véritable opportunité.',
  'Les détails les plus importants sont souvent cachés dans une conversation ordinaire.',
  'Les saisons, l’heure et la météo changent la façon dont la ville semble respirer.'
];
const TIPS=[
  'Pense à consulter ton Codex après plusieurs captures : les informations accumulées finissent par révéler des tendances.',
  'Parler aux habitants des anciennes villes peut débloquer de nouvelles rumeurs après un événement important.',
  'Un détour par une maison ou un lieu public permet parfois de trouver un objet, un indice ou une activité locale.',
  'Une attaque moins puissante mais mieux adaptée au type adverse peut renverser un combat difficile.',
  'Garder plusieurs sortes d’Orbes évite d’être pris au dépourvu face à une créature rare.',
  'Les centres de soins restaurent aussi les PP : mieux vaut y passer avant une longue exploration.',
  'Les routes secondaires valent le détour lorsque ton équipe a gagné quelques niveaux.',
  'Observe la direction des personnages : leurs routines peuvent les conduire vers des points intéressants.',
  'Le journal de vie locale récompense les dresseurs qui visitent réellement chaque ville.',
  'Les transports font gagner du temps, mais marcher permet de rencontrer davantage d’habitants.',
  'Une équipe variée résiste mieux aux longues séries de combats qu’un groupe spécialisé dans un seul type.',
  'Les meubles interactifs ne sont pas tous décoratifs : certains donnent accès à des services ou à des fragments d’histoire.',
  'Les missions facultatives peuvent fournir les ressources nécessaires avant un Gardien exigeant.',
  'Revenir après avoir gagné un Sceau change parfois le regard que les habitants portent sur toi.'
];
const ENDINGS=[
  'Bonne route, et reviens donner de tes nouvelles.','Prends ton temps : Valdora récompense la curiosité.','On se reparlera sûrement avec d’autres nouvelles.','Que ton équipe reste soudée.','Garde les yeux ouverts sur le prochain chemin.','J’espère que ce conseil te servira.','Profite de la ville avant de repartir.','Les meilleures aventures ne sont pas toujours les plus rapides.','À bientôt, voyageur.','Je serai curieux de voir comment ton histoire évolue.','Passe saluer les autres habitants, chacun a son point de vue.'
];
const LOCAL={
  town0:['À Clairval, tout commence par de petites habitudes : soigner, observer puis oser prendre la Route 1','Les herbes de Clairval sont un terrain idéal pour apprendre sans brûler les étapes','Le laboratoire attire des curieux depuis que le Professeur étudie la Résonance','Les habitants protègent l’atmosphère paisible de la place tout en préparant les nouveaux départs','La Route 1 paraît familière, mais elle teste déjà la préparation des jeunes équipes','Les maisons de Clairval conservent des souvenirs des toutes premières expéditions'],
  town1:['Rochebrune vit au rythme de la pierre, des sentiers et des voyageurs venus de la Route 1','Les habitants savent lire les fissures de la roche comme d’autres lisent une carte','Les bois voisins abritent des espèces qui n’aiment pas les passages trop bruyants','Les artisans locaux échangent volontiers des conseils contre une bonne histoire de voyage','La Route 2 demande plus d’attention qu’elle n’en donne l’impression','Les pierres anciennes autour de la ville portent encore des marques difficiles à dater'],
  town2:['Azurive change d’humeur avec le vent qui traverse le lac','Les pêcheurs observent les remous pour prévoir l’activité des Éclats Eau','La Route 3 longe des zones où les traces disparaissent très vite','Les habitants entretiennent des pontons et des chemins pour protéger les rives','Les chercheurs comparent la couleur de l’eau aux phénomènes de Résonance','Les nuits calmes d’Azurive sont parfois interrompues par des lueurs sous la surface'],
  town3:['Montfaucon est un carrefour où l’on hésite souvent entre la corniche et la Route 4','Les hauteurs donnent une vue superbe, mais le vent peut fatiguer une équipe mal préparée','Les habitants connaissent des histoires différentes selon le chemin par lequel on arrive','La corniche de Simdor attire les marcheurs qui aiment les itinéraires exigeants','Les oiseaux et les Éclats Air utilisent les courants qui longent les falaises','Le marché local mélange produits des montagnes et marchandises venues de Belrive'],
  town4:['Belrive sert de respiration avant la Route 5 et les étapes plus longues','Les jardins de la ville sont entretenus pour laisser les chemins parfaitement dégagés','Les habitants suivent avec attention les nouvelles venues de Soleria','Les voyageurs comparent souvent la douceur de Belrive aux reliefs qu’ils viennent de quitter','Certains objets rares arrivent ici par de petites caravanes','Les dresseurs locaux aiment tester des équipes équilibrées plutôt que spécialisées'],
  town5:['Soleria rayonne autour de ses places claires et de ses routes très fréquentées','Le passage vers Simdor offre un raccourci spectaculaire mais exigeant','La Route 6 marque pour beaucoup le début d’un voyage plus ambitieux','Les habitants décorent leurs façades avec des couleurs inspirées du soleil','Les musées locaux étudient des fragments trouvés dans les terres sèches','Les soirées de Soleria rassemblent commerçants, chercheurs et dresseurs itinérants'],
  town6:['Novacité ne s’arrête presque jamais, même lorsque les routes se calment','Les quartiers modernes côtoient encore de vieux passages connus des habitants','La Route 7 concentre beaucoup de dresseurs désireux de mesurer leurs progrès','Les transports urbains facilitent les retours vers les premières régions','Les chercheurs de Novacité testent de nouvelles façons de suivre les migrations','Les lumières de la ville rendent les promenades nocturnes très différentes'],
  town7:['Valombre garde une ambiance mystérieuse jusque sur ses places les plus animées','La Route des Ombres n’est pas le seul passage qui mérite d’être exploré','Les habitants parlent à voix basse des mouvements de la Team Taron','Les brumes donnent aux rues une apparence différente selon l’heure','Les dresseurs locaux apprennent à ne pas dépendre uniquement de la vision','Le chemin vers les Cimes d’Or récompense les équipes patientes'],
  town8:["Les Cimes d’Or dominent une grande partie de Valdora et changent de couleur au coucher du soleil","La Route du littoral commence après des reliefs où le vent devient imprévisible","Les habitants savent reconnaître les signes annonçant un changement brutal de météo","Les ponts de montagne sont surveillés avec soin pour rester praticables","Les Éclats Air et Roche se croisent souvent autour des hauteurs","Les voyageurs racontent que la vue aide à comprendre la forme entière de la région"],
  town9:['Port-Écume vit au rythme des marées, des départs et des cargaisons','La Route du littoral laisse le sel jusque sur les vêtements des voyageurs','Le détroit de Luminon attire des espèces marines difficiles à observer ailleurs','Les marins échangent des rumeurs venues de régions très éloignées','Les maisons proches de la plage sont conçues pour résister aux vents forts','Les quais s’animent davantage lorsque les transports arrivent ensemble'],
  town10:['Luminon éclaire ses rues jusque tard et attire de nombreux chercheurs','Le détroit apporte chaque jour des voyageurs et des histoires différentes','La Route des Brumes commence dans une lumière trompeusement douce','Les habitants étudient les phénomènes lumineux sans négliger les créatures de l’ombre','Les ateliers testent des matériaux capables de réagir aux Éclats','Les places de Luminon accueillent souvent des démonstrations de combat'],
  town11:['Brumlac se découvre lentement, entre eau calme et nappes de brume','La Route Sylvestre commence là où les roseaux laissent place aux arbres','Les habitants connaissent des repères invisibles aux voyageurs pressés','Les sons portent très loin au-dessus du lac lorsque la brume tombe','Les chercheurs surveillent les variations d’humidité autour des habitats sauvages','Les anciennes maisons conservent des cartes dessinées avant les routes modernes'],
  town12:['Silvaris est une véritable porte vers les forêts profondes','La végétation change rapidement dès qu’on quitte les rues entretenues','La Route de Taronis est surveillée depuis les dernières opérations ennemies','Les habitants savent reconnaître les plantes utiles sans abîmer les sous-bois','Les espèces Nature et Spore partagent des territoires très différents','Les sentiers forestiers révèlent davantage de détails à ceux qui reviennent plusieurs fois'],
  town13:['Taronis porte encore les traces des opérations de la Team Taron','La métropole réunit des habitants venus de toutes les étapes du voyage','La Route des Aubes est surveillée comme un passage stratégique','Les bâtiments publics restent animés jusque tard à cause des enquêtes en cours','Les dresseurs échangent des informations avant de poursuivre vers Aubeval','Les quartiers rénovés côtoient des zones où l’histoire récente reste visible'],
  town14:['Aubeval est la dernière grande halte avant la Citadelle du Cœur et les expéditions légendaires','Les voyageurs viennent ici vérifier une dernière fois leur équipe et leurs réserves','La Route des Aubes donne à chaque arrivée une impression de nouveau départ','Les habitants collectionnent les récits de ceux qui ont parcouru toute Valdora','Les biomes légendaires ne s’ouvrent qu’aux équipes réellement préparées','La lumière du matin donne à la ville une atmosphère différente de toutes les autres']
};
const DIALOGUE_BANK={};
function buildDialogueBank(){
  for(const [zi,zone] of TOWNS.entries()){
    const local=LOCAL[zone]||['Cette partie de Valdora a développé ses propres habitudes'];
    DIALOGUE_BANK[zone]=Array.from({length:96},(_,i)=>{
      const op=OPENERS[(i*5+zi)%OPENERS.length],loc=local[(i*7+zi)%local.length],ctx=CONTEXTS[(i*11+zi*3)%CONTEXTS.length],tip=TIPS[(i*13+zi*5)%TIPS.length],end=ENDINGS[(i*17+zi)%ENDINGS.length];
      return `${op} ${loc}. ${ctx} ${tip} ${end}`
    })
  }
}
buildDialogueBank();

const NAMES=['Adèle','Alban','Alix','Amélie','Anatole','Apolline','Basile','Bérénice','Camille','Célestin','Clara','Colin','Diane','Éloi','Émilie','Esteban','Fanny','Florian','Garance','Gaspard','Hanaé','Hector','Iris','Ismaël','Jeanne','Joachim','Kenza','Léandre','Lila','Louison','Maël','Maëlys','Malo','Mélina','Naël','Nina','Octave','Olivia','Oscar','Paloma','Quentin','Romy','Samir','Sixtine','Solal','Thaïs','Tilio','Valentin','Victoire','Yasmine','Zélie','Aïdan','Côme','Énora','Faustine','Ilian','Lison','Marceau','Noémie','Sohan','Yuna'];
const OUTDOOR_ROLES=['habitante','artisan','étudiante','jardinier','voyageuse','chercheur','commerçante','guide local','musicienne','photographe','coursier','naturaliste'];
function npcIdentity(zone,index,salt='world'){
  const h=hash(`${zone}|${salt}|${index}`);return{name:NAMES[h%NAMES.length],look:(h>>>8)%41,role:OUTDOOR_ROLES[(h>>>14)%OUTDOOR_ROLES.length]}
}

// ---------------------------------------------------------------------
// Progression locale : 4 activités dans chacune des 15 villes.
// ---------------------------------------------------------------------
const CONTRACTS=[
  {id:'rencontres',title:'Visages du quartier',metric:'unique',goal:5,money:350,item:'Orbe',qty:2},
  {id:'portes',title:'Porte à porte',metric:'interiors',goal:3,money:450,item:'Potion',qty:2},
  {id:'chronique',title:'Chroniques vivantes',metric:'talks',goal:15,money:600,item:'SuperOrbe',qty:1},
  {id:'ancrage',title:'Ami de la ville',metric:'score',goal:45,money:850,item:'SuperPotion',qty:2}
];
function metric(zone,kind){const t=townState(zone),u=Object.keys(t.uniqueNpcs||{}).length,i=Object.keys(t.interiors||{}).length;if(kind==='unique')return u;if(kind==='interiors')return i;if(kind==='talks')return t.talks||0;return u*4+i*5+Math.min(20,t.talks||0)}
function reward(zone,c){
  const t=townState(zone);if(t.contracts[c.id])return false;t.contracts[c.id]=true;
  state.money=Number(state.money||0)+c.money;state.inventory=state.inventory||{};if(c.item)state.inventory[c.item]=Number(state.inventory[c.item]||0)+(c.qty||1);
  try{hud?.();save?.(false);toast?.(`${zoneName(zone)} — ${c.title} terminé : ${c.money} V${c.item?' + '+(c.qty||1)+' '+c.item:''}`)}catch(_){}return true
}
function checkContracts(zone){for(const c of CONTRACTS)if(metric(zone,c.metric)>=c.goal)reward(zone,c)}
function recordTalk(n,zone=state.zone){
  if(!TOWNS.includes(zone))return;const t=townState(zone),key=String(n?.id||n?.name||n?.look||'habitant');t.talks=Number(t.talks||0)+1;t.uniqueNpcs[key]=true;checkContracts(zone)
}
function buildingId(b,session){return String(b?.id||b?.label||b?.name||`${session?.key||'batiment'}:${Math.round(b?.x||0)}:${Math.round(b?.y||0)}`)}
function recordInterior(session){
  const zone=session?.zone;if(!TOWNS.includes(zone))return;const key=buildingId(session.source,session);if(session._v118RecordedVisitKey===key)return;session._v118RecordedVisitKey=key;const t=townState(zone);t.visits=Number(t.visits||0)+1;t.interiors[key]=true;checkContracts(zone)
}
function talkLine(n,zone=state.zone,context='extérieur'){
  const t=townState(zone),key=String(n?.id||n?.name||n?.look||'habitant');n._v118Talk=Number(n._v118Talk||0)+1;const bank=DIALOGUE_BANK[zone]||DIALOGUE_BANK.town0,stage=Math.min(4,(state.seals||[]).length),index=(hash(`${zone}|${key}|${context}`)+n._v118Talk*37+stage*19)%bank.length;
  recordTalk(n,zone);const role=n.v118Role?`<small>${n.v118Role}</small><br>`:'';return role+bank[index]
}

// ---------------------------------------------------------------------
// Population extérieure : génération, placement sans chevauchement et
// trajectoires réservées sur le graphe réel des rues.
// ---------------------------------------------------------------------
function roadNodes(sc){
  if(sc?._v118RoadNodes&&sc._v118RoadNodes.sig===`${sc.v105dCell}|${sc.v105dRoad?.size}`)return sc._v118RoadNodes;
  const C=Number(sc?.v105dCell)||220,set=sc?.v105dRoad instanceof Set?sc.v105dRoad:new Set(),map=new Map();
  for(const key of set){const [gx,gy]=String(key).split(',').map(Number);map.set(key,{key,gx,gy,x:(gx+.5)*C,y:(gy+.5)*C,neighbors:[]})}
  for(const node of map.values())for(const [dx,dy] of[[1,0],[-1,0],[0,1],[0,-1]]){const k=(node.gx+dx)+','+(node.gy+dy);if(map.has(k))node.neighbors.push(k)}
  const list=[...map.values()].filter(n=>{
    if(n.x<35||n.y<35||n.x>(sc.width||1800)-35||n.y>(sc.height||1100)-35)return false;
    if((sc.exits||[]).some(e=>Math.hypot(n.x-(e.x+e.w/2),n.y-(e.y+e.h/2))<100))return false;
    if((sc.buildings||[]).some(b=>n.x>b.x-36&&n.x<b.x+b.w+36&&n.y>b.y-26&&n.y<b.y+b.h+42))return false;
    return true
  });
  sc._v118RoadNodes={sig:`${sc.v105dCell}|${sc.v105dRoad?.size}`,map,list};return sc._v118RoadNodes
}
function baseCitizens(sc,zone,includeTaron=true){
  const core=[];try{if(typeof NPCDATA!=='undefined')core.push(...NPCDATA.filter(n=>n.zone===zone))}catch(_){}
  const target=sc?.megacity?18:12,supplemental=[...(sc?.v118Citizens||[]),...(sc?.megaNPCs||[]),...(sc?.v105dStreetNPCs||[])],all=[...core];
  for(const n of supplemental){if(all.length>=target)break;all.push(n)}
  if(includeTaron&&zone===state.zone)try{const t=typeof currentTaronNPC==='function'?currentTaronNPC():null;if(t)all.push(t)}catch(_){}
  const seenObject=new Set(),seenId=new Set();return all.filter(n=>{if(!n||seenObject.has(n))return false;seenObject.add(n);const id=String(n.id||'');if(id&&seenId.has(id))return false;if(id)seenId.add(id);return true})
}
function allWorldCitizens(sc,zone){return baseCitizens(sc,zone,true)}
function movable(n){return !!n&&!n.taron&&!n.guardian&&!n.service&&!n.stationaryV118}
function safeSpawn(node,occupied,min=68){return node&&occupied.every(o=>Math.hypot(node.x-o.x,node.y-o.y)>=min)}
function nearestNode(nodes,x,y){let best=null,bd=Infinity;for(const n of nodes.list){const d=Math.hypot(n.x-x,n.y-y);if(d<bd){bd=d;best=n}}return best}
function roadSpawnSlots(sc,nodes){
  const sig=`${sc?.v105dCell}|${sc?.v105dCore}|${sc?.v105dRoad?.size}|${(sc?.buildings||[]).map(b=>[Math.round(b.x),Math.round(b.y),Math.round(b.w),Math.round(b.h)].join(',')).join(';')}|${sc?.v105dTrees?.length||0}`;if(sc?._v118SpawnSlots?.sig===sig)return sc._v118SpawnSlots.list;
  const core=Number(sc?.v105dCore)||90,roads=roadRects(sc),out=[],seen=new Set();function add(x,y){x=Math.round(x);y=Math.round(y);const k=Math.round(x/12)+','+Math.round(y/12);if(seen.has(k))return;if(x<30||y<30||x>(sc.width||1800)-30||y>(sc.height||1100)-30)return;if((sc.exits||[]).some(e=>Math.hypot(x-(e.x+e.w/2),y-(e.y+e.h/2))<84))return;if((sc.buildings||[]).some(b=>x>b.x-28&&x<b.x+b.w+28&&y>b.y-24&&y<b.y+b.h+34))return;if((sc.v105dTrees||[]).some(t=>Math.hypot(x-t.x,y-t.y)<48*(t.s||1)))return;seen.add(k);const node=nearestNode(nodes,x,y);out.push({x,y,key:k,nodeKey:node?.key||null})}
  for(const r of roads){if(r.w>=r.h*1.35){for(let x=r.x+30;x<r.x+r.w-20;x+=62){add(x,r.y+core*.24);add(x,r.y+core*.76)}}else if(r.h>=r.w*1.35){for(let y=r.y+30;y<r.y+r.h-20;y+=62){add(r.x+core*.24,y);add(r.x+core*.76,y)}}else{add(r.x+core*.2,r.y+core*.5);add(r.x+core*.8,r.y+core*.5)}}
  // Places, trottoirs et bandes piétonnes proches des rues : cette seconde
  // maille donne assez d'espace aux métropoles sans placer de PNJ dans les bâtiments.
  for(let y=42;y<(sc.height||1100)-42;y+=58)for(let x=42;x<(sc.width||1800)-42;x+=58){const rd=Math.min(...roads.map(r=>pointRectDistance(x,y,r)));if(rd<=core*1.35)add(x,y)}
  for(const n of nodes.list)add(n.x,n.y);sc._v118SpawnSlots={sig,list:out};return out
}
function placeTownCitizens(zone,force=false){
  const sc=sceneFor(zone);if(!sc||sc.kind!=='town')return;const nodes=roadNodes(sc);if(!nodes.list.length)return;
  const target=sc.megacity?18:12;sc.v118Citizens=Array.isArray(sc.v118Citizens)?sc.v118Citizens:[];
  let people=baseCitizens(sc,zone,false);for(let i=people.length;i<target;i++){const id=npcIdentity(zone,i);sc.v118Citizens.push({id:`v118_${zone}_${i}`,zone,x:0,y:0,homeX:0,homeY:0,look:id.look,name:id.name,v118Role:id.role,dir:i%4,moving:false,v118Generated:true})}
  people=baseCitizens(sc,zone,false);if(sc._v118PopulationReady&&!force){const stable=people.every(n=>!movable(n)||n._v118Placed);if(stable)return}
  const slots=roadSpawnSlots(sc,nodes),occupied=people.filter(n=>!movable(n)&&Number.isFinite(n.x)&&Number.isFinite(n.y)).map(n=>({x:n.x,y:n.y}));
  for(const [i,n] of people.entries()){
    if(!movable(n))continue;let choice=null;const start=hash(`${zone}|${n.id||n.name}|spawn`)%Math.max(1,slots.length);
    for(const minimum of[62,54,46]){for(let k=0;k<slots.length;k++){const q=slots[(start+k)%slots.length];if(safeSpawn(q,occupied,minimum)){choice=q;break}}if(choice)break}
    choice=choice||nodes.list[(hash(n.id)+i)%nodes.list.length];const nodeKey=choice.nodeKey||choice.key||nearestNode(nodes,choice.x,choice.y)?.key;n.x=choice.x;n.y=choice.y;n.homeX=choice.x;n.homeY=choice.y;n._v118Node=nodeKey;n._v118Target=null;n._v118Wait=performance.now()+250+(hash(n.id)%900);n.dir=hash(n.id+'dir')%4;n.moving=false;n._v118Placed=true;occupied.push({x:n.x,y:n.y})
  }
  sc._v118PopulationReady=VERSION
}
function worldPointFree(sc,n,x,y,all){
  if(x<26||y<26||x>(sc.width||1800)-26||y>(sc.height||1100)-26)return false;if((sc.buildings||[]).some(b=>x>b.x-24&&x<b.x+b.w+24&&y>b.y-20&&y<b.y+b.h+30))return false;if((sc.v105dTrees||[]).some(t=>Math.hypot(x-t.x,y-t.y)<43*(t.s||1)))return false;if(all.some(o=>o!==n&&Math.hypot(x-o.x,y-o.y)<46))return false;return true
}
function chooseTarget(n,sc,slots,reserved,all,now){
  let options=slots.filter(q=>!reserved.has(q.key)).filter(q=>{const d=Math.hypot(q.x-n.x,q.y-n.y);return d>=70&&d<=310&&all.every(o=>o===n||Math.hypot(q.x-o.x,q.y-o.y)>=50)});if(!options.length)options=slots.filter(q=>!reserved.has(q.key)&&all.every(o=>o===n||Math.hypot(q.x-o.x,q.y-o.y)>=48));
  if(!options.length){n._v118FreeTarget=null;n._v118Wait=now+420+(hash(n.id+now)%500);return false}const q=options[hash(`${n.id}|${Math.floor(now/700)}|${n._v118Talk||0}`)%options.length];n._v118FreeTarget={x:q.x,y:q.y,key:q.key};reserved.add(q.key);return true
}
function relocateOverlap(n,nodes,all){const sc=current();if(!sc||!n)return false;let vx=0,vy=0,nearest=Infinity;for(const o of all){if(o===n)continue;const dx=n.x-o.x,dy=n.y-o.y,d=Math.hypot(dx,dy);if(d>=43)continue;nearest=Math.min(nearest,d);if(d<.01){const a=(hash(`${n.id}|${o.id||o.name}`)%628)/100;vx+=Math.cos(a);vy+=Math.sin(a)}else{vx+=dx/d;vy+=dy/d}}const len=Math.hypot(vx,vy);if(!len||!Number.isFinite(nearest))return false;const step=Math.min(2.4,Math.max(.8,(43-nearest)*.16)),nx=n.x+vx/len*step,ny=n.y+vy/len*step;const free=nx>=26&&ny>=26&&nx<=(sc.width||1800)-26&&ny<=(sc.height||1100)-26&&!(sc.buildings||[]).some(b=>nx>b.x-24&&nx<b.x+b.w+24&&ny>b.y-20&&ny<b.y+b.h+30)&&!(sc.v105dTrees||[]).some(t=>Math.hypot(nx-t.x,ny-t.y)<43*(t.s||1));if(!free){n.moving=false;n._v118FreeTarget=null;n._v118Wait=performance.now()+160;return false}n.dir=Math.abs(vx)>Math.abs(vy)?(vx<0?1:2):(vy>0?0:3);n.x=nx;n.y=ny;n.moving=true;n._v118FreeTarget=null;n._v118Wait=performance.now()+18;return true}
let worldLast=performance.now();
function updateWorldCitizens(){
  const sc=current();if(!sc||sc.kind!=='town')return;placeTownCitizens(state.zone);const all=allWorldCitizens(sc,state.zone),nodes=roadNodes(sc),now=performance.now(),dt=Math.min(.05,Math.max(.001,(now-worldLast)/1000));worldLast=now;
  for(let i=0;i<all.length;i++)for(let j=i+1;j<all.length;j++)if(distance(all[i],all[j])<43){const n=movable(all[j])?all[j]:movable(all[i])?all[i]:null;if(n)relocateOverlap(n,nodes,all)}
  const slots=roadSpawnSlots(sc,nodes),reserved=new Set(all.map(n=>n._v118FreeTarget?.key).filter(Boolean));
  for(const n of all){
    if(!movable(n)){n.moving=false;continue}if(Date.now()<(n._v118PauseUntil||0)||now<(n._v118Wait||0)){n.moving=false;continue}
    let target=n._v118FreeTarget;if(!target){if(!chooseTarget(n,sc,slots,reserved,all,now)){n.moving=false;continue}target=n._v118FreeTarget}
    const dx=target.x-n.x,dy=target.y-n.y,d=Math.hypot(dx,dy);if(d<2){n.x=target.x;n.y=target.y;n._v118FreeTarget=null;n._v118Wait=now+180+(hash(`${n.id}|${target.key}`)%920);n.moving=false;continue}
    const speed=36+(hash(n.id)%19),step=Math.min(d,speed*dt),nx=n.x+dx/d*step,ny=n.y+dy/d*step;
    if(!worldPointFree(sc,n,nx,ny,all)){n.moving=false;n._v118FreeTarget=null;n._v118Wait=now+360+(hash(n.id+now)%500);continue}
    n.dir=Math.abs(dx)>Math.abs(dy)?(dx<0?1:2):(dy>0?0:3);n.x=nx;n.y=ny;n.moving=true
  }
}
function facingVector(){return state.dir===0?{x:0,y:1}:state.dir===1?{x:-1,y:0}:state.dir===2?{x:1,y:0}:{x:0,y:-1}}
function nearWorldNpc(){
  const sc=current();if(!sc||sc.kind!=='town')return null;const v=facingVector(),people=allWorldCitizens(sc,state.zone);let best=null,score=Infinity;
  for(const n of people){const dx=n.x-state.x,dy=n.y-state.y,d=Math.hypot(dx,dy);if(d>94)continue;const dot=d?((dx/d)*v.x+(dy/d)*v.y):1,side=1-dot,rank=d+side*34;if(rank<score){score=rank;best=n}}
  return best
}
function faceWorldNpc(n){const dx=state.x-n.x,dy=state.y-n.y;n.dir=Math.abs(dx)>Math.abs(dy)?(dx<0?1:2):(dy>0?0:3);n.moving=false;n._v118PauseUntil=Date.now()+3600;n._v118Wait=performance.now()+3800}
function questStillActive(n){
  try{const q=typeof V106C_QUEST_BY_GIVER!=='undefined'?V106C_QUEST_BY_GIVER[n?.id]:null;if(!q)return false;const e=typeof v106cQuestState==='function'?v106cQuestState()?.[q.id]:null;return !e||e.status==='active'}catch(_){return false}
}
function talkWorldNpc(n){
  if(!n)return false;faceWorldNpc(n);recordTalk(n,state.zone);
  if(n.taron&&typeof interactTaron==='function'){interactTaron(n);return true}
  try{if(questStillActive(n)&&typeof questInteractionV106C==='function'&&questInteractionV106C(n))return true}catch(_){}
  try{if(typeof v107bAubeNPCInteraction==='function'&&v107bAubeNPCInteraction(n))return true}catch(_){}
  n._v118Talk=Number(n._v118Talk||0)+1;const bank=DIALOGUE_BANK[state.zone]||DIALOGUE_BANK.town0,index=(hash(`${state.zone}|${n.id||n.name}`)+n._v118Talk*37+(state.seals||[]).length*19)%bank.length,role=n.v118Role?`<small>${n.v118Role}</small><br>`:'';
  if(typeof dialog==='function')dialog(`<b>${n.name||n.dialog||'Habitant'}</b><br>${role}${bank[index]}`);return true
}
function worldInteractV118(){
  if(typeof scene!=='undefined'&&scene==='world'){
    try{
      const bus=window.ValdoraBusV118Bridge;
      if(bus){bus.ownedByV118=true;if(bus.near?.(125)&&bus.open?.())return true}
    }catch(e){console.warn('V118 interaction arrêt Fluo Valdora',e)}
    try{
      const chest=window.ValdoraChestV118Bridge;
      if(chest){chest.ownedByV118=true;if(chest.interact?.(110))return true}
    }catch(e){console.warn('V118 interaction coffre Valdora',e)}
    const n=nearWorldNpc();if(n&&distance(n,state)<=88)return talkWorldNpc(n);
    const before=scene,result=typeof BASE.interact==='function'?BASE.interact.apply(this,arguments):false;
    if(before==='world'&&scene==='interior')ensureInteriorPopulation(true);
    return result
  }
  return typeof BASE.interact==='function'?BASE.interact.apply(this,arguments):false
}
worldInteractV118.__v107dInteract=true;worldInteractV118.__v118StableInteract=true;
// Les anciens modules d'ambiance se réinstallent encore à intervalles fixes.
// Ces marqueurs leur indiquent que V118 contient déjà leurs interactions et
// évitent qu'ils réenveloppent ce moteur en formant une boucle récursive.
worldInteractV118.__v107dInteract=true;
worldInteractV118.__v113Museum=true;

// ---------------------------------------------------------------------
// Intérieurs habités : plusieurs personnes par pièce, placement sur les
// zones réellement libres du mobilier V105X et interactions individuelles.
// ---------------------------------------------------------------------
const INTERIOR_ROLES={
  maison:['habitante','parent','jeune dresseuse','voisin en visite'],residence:['résidente','voisin','gardienne de l’immeuble','livreur'],immeuble_moyen:['résidente','employé de bureau','technicienne','visiteur'],grand_immeuble:['résidente','agent d’entretien','consultante','visiteur'],
  centre_soins:['patient','accompagnatrice','stagiaire médicale','dresseur en convalescence'],laboratoire:['assistante de recherche','étudiant','technicienne','observateur du Codex'],boutique:['cliente','fournisseur','apprentie marchande','collectionneur'],gare:['voyageuse','contrôleur','employée des quais','touriste'],musee:['visiteuse','archiviste','guide','chercheuse'],ecole:['élève','professeur invité','surveillante','parent'],gardien:['aspirante','arbitre','supporter','dresseur local'],hotel:['cliente','concierge','voyageuse','bagagiste'],restaurant_cafe:['cliente','cuisinier','serveuse','habitué'],bureau_guilde:['éclaireuse','cartographe','contractuelle','responsable de mission'],bibliotheque_publique:['lectrice','archiviste','étudiante','bibliothécaire adjointe'],citadelle:['gardienne','érudit','émissaire','stratège']
};
const INTERIOR_COUNT={maison:3,residence:4,immeuble_moyen:4,grand_immeuble:5,centre_soins:4,laboratoire:4,boutique:3,gare:5,musee:5,ecole:5,gardien:4,hotel:4,restaurant_cafe:5,bureau_guilde:4,bibliotheque_publique:5,citadelle:4};
function interiorSession(){try{return BASE.interior?.session?.()||null}catch(_){return null}}
function roomGeometry(){const rr=BASE.interior?.rawRoom?.(),room=rr?.room||{};return{rr,w:Math.max(1,Number(room.width)||1200),h:Math.max(1,Number(room.height)||800)}}
function furnRect(m){if(m?.collision)return{x:Number(m.collision.x)||0,y:Number(m.collision.y)||0,w:Number(m.collision.w)||0,h:Number(m.collision.h)||0};return{x:Number(m?.x)||0,y:Number(m?.y)||0,w:Number(m?.w)||0,h:Number(m?.h)||0}}
function interiorCandidates(g,furniture){
  const out=[];for(let y=92;y<g.h-92;y+=72)for(let x=74;x<g.w-74;x+=84){if(y>g.h-150&&Math.abs(x-g.w/2)<150)continue;const p={x,y};if(furniture.some(m=>{const r=furnRect(m);return x>r.x-36&&x<r.x+r.w+36&&y>r.y-42&&y<r.y+r.h+38}))continue;out.push(p)}return out
}
function ensureInteriorPopulation(record=false){
  const s=interiorSession();if(!s)return false;const g=roomGeometry(),key=`${s.zone}|${buildingId(s.source,s)}|${s.floorId}|${s.roomId}`;if(record)recordInterior(s);if(s._v118PopulationKey===key&&s.npcs?.some(n=>n.v118Resident))return true;
  const base=(s.npcs||[]).filter(n=>!n.v118Resident),roles=INTERIOR_ROLES[s.key]||INTERIOR_ROLES.maison,count=INTERIOR_COUNT[s.key]||3,candidates=interiorCandidates(g,BASE.interior?.furniture?.()||[]),random=rng(hash(key)),used=base.map(n=>({x:n.x,y:n.y})),people=[];
  const reservedLooks=new Set(base.filter(n=>n?.service).map(n=>Number(n.look)).filter(Number.isFinite));
  const reservedNames=new Set(base.filter(n=>n?.service).map(n=>String(n.name||'').trim().toLowerCase()).filter(Boolean));
  for(let i=0;i<count&&candidates.length;i++){
    let pick=-1;for(let tries=0;tries<candidates.length;tries++){const at=Math.floor(random()*candidates.length),p=candidates[at];if(used.every(o=>distance(p,o)>=76)){pick=at;break}}if(pick<0)pick=0;const p=candidates.splice(pick,1)[0],id=npcIdentity(s.zone||state.zone,i,key),role=roles[i%roles.length];
    let look=Number(id.look);if(!Number.isFinite(look))look=0;while(reservedLooks.has(look))look=(look+7)%41;
    let name=String(id.name||'Habitant');if(reservedNames.has(name.trim().toLowerCase()))name=`${name} — visiteur`;
    const n={id:`v118_inside_${hash(key).toString(36)}_${i}`,name,look,x:p.x,y:p.y,homeX:p.x,homeY:p.y,targetX:p.x,targetY:p.y,dir:hash(name+key)%4,moving:false,service:false,v118Resident:true,v118Role:role,nextDecision:0,pauseUntil:0};people.push(n);used.push(p)
  }
  s.npcs=[...base,...people];s._v118PopulationKey=key;return true
}
function nearInteriorResident(){const s=interiorSession();if(!s)return null;let best=null,bd=Infinity;for(const n of s.npcs||[]){if(!n.v118Resident)continue;const d=Math.hypot(Number(state.roomX)-n.x,Number(state.roomY)-n.y);if(d<bd){bd=d;best=n}}return best&&bd<=102?best:null}
function faceInterior(n){const dx=state.roomX-n.x,dy=state.roomY-n.y;n.dir=Math.abs(dx)>Math.abs(dy)?(dx<0?1:2):(dy>0?0:3);n.moving=false;n.pauseUntil=Date.now()+3600;n.nextDecision=performance.now()+3900}
function interactInteriorV118(){
  ensureInteriorPopulation(true);const n=nearInteriorResident();if(n){faceInterior(n);const s=interiorSession(),zone=s?.zone||state.zone,name=n.name||'Habitant';if(typeof dialog==='function')dialog(`<b>${name}</b><br>${talkLine(n,zone,s?.key||'intérieur')}`);return true}
  return typeof BASE.interactInterior==='function'?BASE.interactInterior.apply(this,arguments):false
}
function drawInteriorV118(){ensureInteriorPopulation(true);return typeof BASE.drawInterior==='function'?BASE.drawInterior.apply(this,arguments):undefined}
function enterInteriorV118(b){const ok=typeof BASE.interiorEnter==='function'?BASE.interiorEnter(b):false;if(ok)ensureInteriorPopulation(true);return ok}
function moveInteriorRoomV118(){const ok=typeof BASE.interiorMoveToRoom==='function'?BASE.interiorMoveToRoom(...arguments):false;if(ok)ensureInteriorPopulation(true);return ok}

// ---------------------------------------------------------------------
// Implantation : détection et déplacement conservateur des bâtiments qui
// occupent réellement une portion importante de la chaussée.
// ---------------------------------------------------------------------
function roadRects(sc){
  const C=Number(sc?.v105dCell)||220,core=Number(sc?.v105dCore)||90,set=sc?.v105dRoad instanceof Set?sc.v105dRoad:new Set(),out=[];
  for(const key of set){const [gx,gy]=String(key).split(',').map(Number),cx=(gx+.5)*C,cy=(gy+.5)*C;out.push({x:cx-core/2,y:cy-core/2,w:core,h:core});if(set.has((gx+1)+','+gy))out.push({x:cx,y:cy-core/2,w:C,h:core});if(set.has(gx+','+(gy+1)))out.push({x:cx-core/2,y:cy,w:core,h:C})}
  return out
}
function pointRectDistance(x,y,r){const dx=Math.max(r.x-x,0,x-(r.x+r.w)),dy=Math.max(r.y-y,0,y-(r.y+r.h));return Math.hypot(dx,dy)}
function severeRoadOverlap(b,roads){const area=Math.max(1,Number(b.w)*Number(b.h));return roads.reduce((sum,r)=>sum+overlapArea({x:b.x,y:b.y,w:b.w,h:b.h},r),0)/area}
function candidateBuilding(sc,b,x,y,others,roads){
  const r={x,y,w:b.w,h:b.h};if(x<18||y<18||x+b.w>(sc.width||1800)-18||y+b.h>(sc.height||1100)-18)return null;if(others.some(o=>rectHit(r,{x:o.x,y:o.y,w:o.w,h:o.h},10)))return null;if((sc.exits||[]).some(e=>rectHit(r,{x:e.x,y:e.y,w:e.w,h:e.h},38)))return null;
  const ratio=roads.reduce((sum,rr)=>sum+overlapArea(r,rr),0)/Math.max(1,b.w*b.h);if(ratio>.025)return null;const dx=x+b.w/2,dy=y+b.h,roadDistance=Math.min(...roads.map(rr=>pointRectDistance(dx,dy,rr)));if(!Number.isFinite(roadDistance))return null;return{score:Math.hypot(x-b.x,y-b.y)+roadDistance*.18,x,y,roadDistance}
}
function repairTownBuildings(zone){
  const sc=sceneFor(zone);if(!sc||sc.kind!=='town'||!Array.isArray(sc.buildings))return 0;const sig=sc.buildings.map(b=>[Math.round(b.x),Math.round(b.y),Math.round(b.w),Math.round(b.h)].join(',')).join(';');if(sc._v118BuildingInputSig===sig)return sc._v118RelocatedCount||0;const roads=roadRects(sc);let moved=0;
  for(const b of sc.buildings){
    if(/station|gare/i.test([b.type,b.urbanType,b.id,b.label].join(' '))&&sc.rail)continue;
    const others=sc.buildings.filter(o=>o!==b),isHotel=/hotel|hôtel|auberge|inn/i.test([b.type,b.urbanType,b.id,b.label].join(' ')),roadLimit=isHotel ? .24 : .13,pairOverlap=others.some(o=>rectHit({x:b.x,y:b.y,w:b.w,h:b.h},{x:o.x,y:o.y,w:o.w,h:o.h},6));if(severeRoadOverlap(b,roads)<roadLimit&&!pairOverlap)continue;const candidates=[];
    for(let rad=24;rad<=480;rad+=24)for(const [dx,dy] of[[0,-rad],[-rad,0],[rad,0],[0,rad],[-rad,-rad],[rad,-rad],[-rad,rad],[rad,rad]]){const c=candidateBuilding(sc,b,b.x+dx,b.y+dy,others,roads);if(c)candidates.push(c)}
    if(!candidates.length)for(const r of roads){const cx=r.x+r.w/2,cy=r.y+r.h/2;for(const [x,y] of[[cx-b.w/2,r.y-b.h-18],[cx-b.w/2,r.y+r.h+18],[r.x-b.w-18,cy-b.h/2],[r.x+r.w+18,cy-b.h/2]]){const c=candidateBuilding(sc,b,Math.round(x),Math.round(y),others,roads);if(c)candidates.push(c)}}
    if(!candidates.length&&!b._v118Resized){const old={w:b.w,h:b.h,x:b.x,y:b.y},cx=b.x+b.w/2,bottom=b.y+b.h;b.w=Math.round(b.w*.82);b.h=Math.round(b.h*.82);b.x=Math.round(cx-b.w/2);b.y=Math.round(bottom-b.h);for(const r of roads){const rx=r.x+r.w/2,ry=r.y+r.h/2;for(const [x,y] of[[rx-b.w/2,r.y-b.h-18],[rx-b.w/2,r.y+r.h+18],[r.x-b.w-18,ry-b.h/2],[r.x+r.w+18,ry-b.h/2]]){const c=candidateBuilding(sc,b,Math.round(x),Math.round(y),others,roads);if(c)candidates.push(c)}}if(candidates.length)b._v118Resized=true;else Object.assign(b,old)}
    if(!candidates.length&&!b._v118Resized){const old={w:b.w,h:b.h,x:b.x,y:b.y},cx=b.x+b.w/2,bottom=b.y+b.h;b.w=Math.round(b.w*.64);b.h=Math.round(b.h*.70);b.x=Math.round(cx-b.w/2);b.y=Math.round(bottom-b.h);for(const r of roads){const rx=r.x+r.w/2,ry=r.y+r.h/2;for(const [x,y] of[[rx-b.w/2,r.y-b.h-16],[rx-b.w/2,r.y+r.h+16],[r.x-b.w-16,ry-b.h/2],[r.x+r.w+16,ry-b.h/2]]){const c=candidateBuilding(sc,b,Math.round(x),Math.round(y),others,roads);if(c)candidates.push(c)}}if(candidates.length)b._v118Resized='compact';else Object.assign(b,old)}
    candidates.sort((a,z)=>a.score-z.score);const c=candidates[0];if(!c)continue;b._v118Original=b._v118Original||{x:b.x,y:b.y,doorX:b.doorX,doorY:b.doorY};b.x=Math.round(c.x);b.y=Math.round(c.y);b.doorX=Math.round(b.x+b.w/2);b.doorY=Math.round(b.y+b.h);let nearest=null,bd=Infinity;for(const r of roads){const d=pointRectDistance(b.doorX,b.doorY,r);if(d<bd){bd=d;nearest=r}}b.v105dRoadY=nearest?clamp(b.doorY,nearest.y,nearest.y+nearest.h):b.doorY+50;b._v118Relocated=true;moved++
  }
  if(moved){sc.v105dTrees=(sc.v105dTrees||[]).filter(t=>!sc.buildings.some(b=>b._v118Relocated&&t.x>b.x-42&&t.x<b.x+b.w+42&&t.y>b.y-54&&t.y<b.y+b.h+50));sc.v105dBushes=(sc.v105dBushes||[]).filter(t=>!sc.buildings.some(b=>b._v118Relocated&&t.x>b.x-28&&t.x<b.x+b.w+28&&t.y>b.y-30&&t.y<b.y+b.h+36))}
  sc._v118RelocatedCount=(sc._v118RelocatedCount||0)+moved;sc._v118BuildingInputSig=sc.buildings.map(b=>[Math.round(b.x),Math.round(b.y),Math.round(b.w),Math.round(b.h)].join(',')).join(';');sc._v118RoadNodes=null;sc._v118SpawnSlots=null;return moved
}
function repairAllBuildings(){let count=0;for(const zone of TOWNS)count+=repairTownBuildings(zone);return count}

// ---------------------------------------------------------------------
// Animations ambiantes et indications d’interaction.
// ---------------------------------------------------------------------
const AMBIENT_COLORS=['#9edc78','#b8a06b','#72c9dc','#dc9a68','#85d3a0','#f1c868','#9ac8e8','#a392c8','#f0cf72','#7ed6d0','#ffe486','#b8d0cc','#79c58c','#e0b762','#f7d589'];
function drawTownAmbience(){
  const sc=current();if(!sc||sc.kind!=='town'||typeof ctx==='undefined')return;const t=performance.now()/1000,sx=960/1600,sy=600/1000,camX=Math.max(0,Math.min(Math.max(0,(sc.width||1800)-1600),state.x-800)),camY=Math.max(0,Math.min(Math.max(0,(sc.height||1100)-1000),state.y-500)),zi=Math.max(0,TOWNS.indexOf(state.zone));ctx.save();
  for(let i=0;i<14;i++){const seed=hash(`${state.zone}|particle|${i}`),wx=((seed%Math.max(1,sc.width||1800))+t*(7+seed%9))%(sc.width||1800),wy=(((seed>>>10)%Math.max(1,sc.height||1100))+Math.sin(t*.7+i)*18),x=(wx-camX)*sx,y=(wy-camY)*sy;if(x<-8||x>968||y<-8||y>608)continue;ctx.globalAlpha=.18+(i%4)*.05;ctx.fillStyle=AMBIENT_COLORS[zi];ctx.beginPath();ctx.arc(x,y,1.5+(i%3),0,Math.PI*2);ctx.fill()}
  const people=allWorldCitizens(sc,state.zone);for(const n of people){const phase=(t+hash(n.id||n.name)%11)%9;if(phase>1.15||n.moving)continue;const x=(n.x-camX)*sx,y=(n.y-camY)*sy-39;if(x<0||x>960||y<0||y>600)continue;ctx.globalAlpha=.78;ctx.fillStyle='rgba(255,255,255,.92)';ctx.strokeStyle='rgba(24,55,72,.72)';ctx.lineWidth=1.5;ctx.beginPath();ctx.roundRect(x-12,y-14,24,20,8);ctx.fill();ctx.stroke();ctx.fillStyle='#28485c';ctx.font='900 12px Segoe UI';ctx.textAlign='center';ctx.fillText(['…','♪','!','?'][hash(n.id+'emote')%4],x,y+1)}
  const near=nearWorldNpc();if(near&&distance(near,state)<90){const label=`E / Entrée — ${near.name||'Habitant'}`,w=Math.min(520,ctx.measureText(label).width+34);ctx.globalAlpha=1;ctx.fillStyle='rgba(13,34,47,.93)';ctx.beginPath();ctx.roundRect((960-w)/2,539,w,38,12);ctx.fill();ctx.strokeStyle='rgba(255,222,129,.75)';ctx.stroke();ctx.fillStyle='#fff';ctx.font='800 13px Segoe UI';ctx.fillText(label,480,563)}ctx.restore();ctx.textAlign='start';ctx.globalAlpha=1
}
function drawWorldV118(){
  const result=typeof BASE.drawWorld==='function'?BASE.drawWorld.apply(this,arguments):undefined;
  if(typeof scene!=='undefined'&&scene==='world'){
    try{if(window.ValdoraChestV118Bridge){window.ValdoraChestV118Bridge.ownedByV118=true;window.ValdoraChestV118Bridge.drawNow?.()}}catch(e){console.warn('V118 coffre Valdora',e)}
    if(current()?.kind==='town'){
      try{if(window.ValdoraBusV118Bridge){window.ValdoraBusV118Bridge.ownedByV118=true;window.ValdoraBusV118Bridge.drawNow?.()}}catch(e){console.warn('V118 arrêt Fluo Valdora',e)}
      drawTownAmbience()
    }
  }
  return result
}
drawWorldV118.__v107dDraw=true;
drawWorldV118.__v112World=true;

// ---------------------------------------------------------------------
// Interface Vie locale.
// ---------------------------------------------------------------------
function progressBar(value,goal){const p=clamp(Math.round(value/goal*100),0,100);return `<div class="v118bar"><i style="width:${p}%"></i></div><small>${Math.min(value,goal)} / ${goal}</small>`}
function panelHtml(){
  const s=stateV118(),completed=TOWNS.reduce((n,z)=>n+Object.keys(townState(z).contracts||{}).length,0),unique=TOWNS.reduce((n,z)=>n+Object.keys(townState(z).uniqueNpcs||{}).length,0),inside=TOWNS.reduce((n,z)=>n+Object.keys(townState(z).interiors||{}).length,0);
  let html=`<div class="v118hero"><h2>Vie locale — Valdora V118</h2><p>Rencontre les habitants, visite réellement les bâtiments et reviens après les grandes étapes. Les 60 activités de quartier étendent l’aventure sans bloquer la progression principale.</p><div class="v118summary"><b>${completed}/60 activités</b><b>${unique} habitants rencontrés</b><b>${inside} intérieurs visités</b></div></div><div class="v118towns">`;
  for(const zone of TOWNS){const t=townState(zone);html+=`<section><h3>${zoneName(zone)}</h3>`;for(const c of CONTRACTS){const v=metric(zone,c.metric),done=!!t.contracts[c.id];html+=`<div class="v118contract ${done?'done':''}"><b>${done?'✓ ':''}${c.title}</b><span>${c.money} V${c.item?' + '+(c.qty||1)+' '+c.item:''}</span>${progressBar(v,c.goal)}</div>`}html+='</section>'}
  html+='</div>';if(creator())html+=`<div class="v118creator"><button onclick="ValdoraLivingWorldV118.previewHouse()">Tester une maison habitée</button><button onclick="ValdoraLivingWorldV118.publishAudit();toast('Audit V118 actualisé')">Actualiser l’audit V118</button></div>`;return html
}
function installPanel(){
  if(!document.getElementById('v118-living-style')){const st=document.createElement('style');st.id='v118-living-style';st.textContent='#v118-living-panel{position:fixed;inset:0;z-index:100080;background:rgba(3,12,21,.88);display:none;place-items:center;padding:16px}#v118-living-card{width:min(1040px,97vw);max-height:94vh;overflow:auto;background:#f4f0e5;color:#173548;border:4px solid #173548;border-radius:24px;padding:22px;box-shadow:0 30px 100px #000c}.v118hero h2{margin:0}.v118summary{display:flex;gap:9px;flex-wrap:wrap;margin:13px 0}.v118summary b{background:#173548;color:#fff;padding:8px 12px;border-radius:999px}.v118towns{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px}.v118towns section{background:#fff;border:2px solid #b9c8c4;border-radius:15px;padding:12px}.v118towns h3{margin:0 0 8px}.v118contract{border-top:1px solid #d8dfda;padding:8px 0}.v118contract span{float:right;font-size:11px;color:#52666e}.v118contract.done{color:#287653}.v118bar{height:6px;background:#dce5e2;border-radius:99px;overflow:hidden;margin-top:5px}.v118bar i{display:block;height:100%;background:linear-gradient(90deg,#46a978,#e7bd56)}.v118creator{display:flex;gap:8px;margin-top:14px}.v118creator button,#v118-living-close{padding:11px 15px;border:2px solid #173548;border-radius:10px;background:#fff;color:#173548;font-weight:900;cursor:pointer}@media(max-width:780px){.v118towns{grid-template-columns:1fr}}aside .grid[data-v118-stable="1"]{grid-auto-rows:minmax(42px,auto);align-content:start}aside .grid[data-v118-stable="1"]>button{contain:layout paint}';document.head.appendChild(st)}
  let panel=document.getElementById('v118-living-panel');if(!panel){panel=document.createElement('div');panel.id='v118-living-panel';panel.innerHTML='<div id="v118-living-card"><div data-content></div><button id="v118-living-close">Fermer</button></div>';document.body.appendChild(panel);panel.querySelector('#v118-living-close').onclick=()=>panel.style.display='none';panel.addEventListener('click',e=>{if(e.target===panel)panel.style.display='none'})}
  return panel
}
function openPanel(){const p=installPanel();p.querySelector('[data-content]').innerHTML=panelHtml();p.style.display='grid'}
const MENU_ORDER=['objectivesBtnV84','teamBtn','dexBtn','journalBtn','v118LivingBtn','bag','musicBtn','save','flyBtnV106Y','challengeBtnV106Y','adventurePlusV106Z','v107fSaveMenu','v107fHelp','v111MapBtn','v109aLivretBtn','voiceBtn','v96ImportSave','sealCaseBtnV93','creatorNavV105N'];
function stabilizeSidebar(){
  const grid=document.getElementById('musicBtn')?.parentElement||document.querySelector('aside .grid');if(!grid)return false;let btn=document.getElementById('v118LivingBtn');if(!btn){btn=document.createElement('button');btn.id='v118LivingBtn';btn.textContent='Vie locale V118';btn.onclick=openPanel;grid.appendChild(btn)}
  const map=document.getElementById('v111MapBtn');if(map&&map.textContent!=='Carte du monde V118')map.textContent='Carte du monde V118';const shrine=document.getElementById('v117-sanctuaries');if(shrine&&shrine.textContent!=='Sanctuaires V118')shrine.textContent='Sanctuaires V118';
  for(const b of [...grid.querySelectorAll('button')])if(!b.id&&!String(b.textContent||'').trim())b.remove();const desired=MENU_ORDER.map(id=>document.getElementById(id)).filter(el=>el?.parentElement===grid),currentButtons=[...grid.children].filter(el=>el.tagName==='BUTTON'),extras=currentButtons.filter(el=>!desired.includes(el)),wanted=[...desired,...extras];if(wanted.length===currentButtons.length&&wanted.some((el,i)=>el!==currentButtons[i]))for(const el of wanted)grid.appendChild(el);grid.dataset.v117Stable='1';grid.dataset.v118Stable='1';installPanel();return true
}
function enforceIdentity(){
  const label='Éclats Sauvages — Valdora V118 Monde Vivant';if(document.title!==label)document.title=label;const brand=document.querySelector('.brand'),wanted=`ÉCLATS SAUVAGES — VALDORA V118 — ${creator()?'CRÉATEUR':'JOUEUR'}`;if(brand&&brand.textContent!==wanted)brand.textContent=wanted;const map=document.getElementById('v111MapBtn');if(map&&map.textContent!=='Carte du monde V118')map.textContent='Carte du monde V118';document.documentElement.dataset.valdoraV118=VERSION;document.documentElement.dataset.valdoraVersion=VERSION;document.documentElement.dataset.valdoraPolish=VERSION
}

// ---------------------------------------------------------------------
// Audit et outils Créateur.
// ---------------------------------------------------------------------
function buildingAudit(){const issues=[],rows=[];for(const zone of TOWNS){const sc=sceneFor(zone),roads=roadRects(sc),bs=sc?.buildings||[];let road=0,pairs=0;for(let i=0;i<bs.length;i++){const fields=[bs[i].type,bs[i].urbanType,bs[i].id,bs[i].label].join(' '),station=/station|gare/i.test(fields)&&sc.rail,hotel=/hotel|hôtel|auberge|inn/i.test(fields),limit=hotel ? .24 : .13;if(!station&&severeRoadOverlap(bs[i],roads)>=limit){road++;issues.push(`${zone}: bâtiment sur la route — ${bs[i].label||bs[i].id||i}`)}for(let j=i+1;j<bs.length;j++)if(rectHit(bs[i],bs[j],6)){pairs++;issues.push(`${zone}: bâtiments superposés`)}}rows.push({zone,buildings:bs.length,roadOverlaps:road,buildingOverlaps:pairs,relocated:sc?._v118RelocatedCount||0})}return{issues,rows}}
function populationAudit(){const issues=[],rows=[];for(const zone of TOWNS){const sc=sceneFor(zone),p=baseCitizens(sc,zone,false);let min=Infinity,overlaps=0;for(let i=0;i<p.length;i++)for(let j=i+1;j<p.length;j++){const d=distance(p[i],p[j]);min=Math.min(min,d);if(d<43)overlaps++}const moving=p.filter(movable).length,target=sc?.megacity?18:12;if(p.length<target)issues.push(`${zone}: population ${p.length}/${target}`);if(overlaps)issues.push(`${zone}: ${overlaps} superpositions`);rows.push({zone,name:zoneName(zone),population:p.length,mobile:moving,minDistance:Number.isFinite(min)?Math.round(min):null,overlaps})}return{issues,rows}}
function audit(){
  const issues=[],dialogues=Object.values(DIALOGUE_BANK).flat(),unique=new Set(dialogues),pop=populationAudit(),buildings=buildingAudit(),s=interiorSession();issues.push(...pop.issues,...buildings.issues);if(dialogues.length<1400||unique.size<1400)issues.push(`banque de dialogues insuffisante : ${unique.size}`);if(window.updateTownNPCs!==updateWorldCitizens)issues.push('moteur de déplacement PNJ non prioritaire');if(window.interact!==worldInteractV118)issues.push('interaction monde V118 non prioritaire');if(window.interactInterior!==interactInteriorV118)issues.push('interaction intérieure V118 non prioritaire');if(window.drawWorld!==drawWorldV118)issues.push('animations ambiantes V118 non prioritaires');if(document.getElementById('v111MapBtn')?.textContent!=='Carte du monde V118')issues.push('identité du menu non stabilisée');const residents=(s?.npcs||[]).filter(n=>n.v118Resident),currentInterior=s?{key:s.key,room:`${s.floorId}/${s.roomId}`,npcs:s.npcs?.length||0,residents:residents.length,mobile:residents.filter(n=>!n.service).length,moving:residents.filter(n=>n.moving).length,overlaps:(s.npcs||[]).flatMap((n,i)=>s.npcs.slice(i+1).map(o=>distance(n,o))).filter(d=>d<42).length}:null;if(currentInterior?.overlaps)issues.push('PNJ intérieurs superposés');return{version:VERSION,ok:issues.length===0,issues,dialogues:{total:dialogues.length,unique:unique.size,perTown:96},gameplay:{townActivities:TOWNS.length*CONTRACTS.length,completed:TOWNS.reduce((n,z)=>n+Object.keys(townState(z).contracts||{}).length,0),reputationTowns:TOWNS.length},population:pop,buildings,currentInterior,hooks:{worldMovement:window.updateTownNPCs===updateWorldCitizens,worldInteraction:window.interact===worldInteractV118,interiorInteraction:window.interactInterior===interactInteriorV118,worldAnimation:window.drawWorld===drawWorldV118},baseSanctuaries:window.ValdoraLegendAuditV117||null}}
function publishAudit(){try{const a=audit();window.ValdoraLivingAuditV118=a;document.documentElement.dataset.valdoraV118Audit=JSON.stringify(a);return a}catch(e){console.warn('Audit V118',e);return{version:VERSION,ok:false,issues:[String(e)]}}}
function previewHouse(){
  if(!creator())return false;const panel=document.getElementById('v118-living-panel');if(panel)panel.style.display='none';for(const zone of TOWNS){const sc=sceneFor(zone),b=(sc?.buildings||[]).find(x=>/home|maison|residence|appartement/i.test([x.type,x.urbanType,x.id,x.label].join(' ')))||(sc?.buildings||[])[0];if(!b)continue;state.zone=zone;try{scene='world';building=null}catch(_){}const ok=enterInteriorV118(b);if(ok){for(const id of['title','prologue','menuov','starterov','battleUI']){const el=document.getElementById(id);if(el)el.style.display='none'}ensureInteriorPopulation(true);const s=interiorSession(),n=(s?.npcs||[]).find(x=>x.v118Resident);if(n){state.roomX=n.x;state.roomY=n.y+64;state.dir=3}try{hud?.();drawInteriorV118();toast?.(`${zoneName(zone)} — maison habitée V118`)}catch(_){}return true}}return false
}
function installHooks(){
  window.sceneNPCs=allWorldCitizens;try{sceneNPCs=allWorldCitizens}catch(_){}window.updateTownNPCs=updateWorldCitizens;try{updateTownNPCs=updateWorldCitizens}catch(_){}window.updateNPCsD=updateWorldCitizens;try{updateNPCsD=updateWorldCitizens}catch(_){}window.nearNPC=nearWorldNpc;try{nearNPC=nearWorldNpc}catch(_){}window.interact=worldInteractV118;try{interact=worldInteractV118}catch(_){}window.drawWorld=drawWorldV118;try{drawWorld=drawWorldV118}catch(_){}window.move=BASE.move;try{move=BASE.move}catch(_){}window.collision=BASE.collision;try{collision=BASE.collision}catch(_){}window.startWild=BASE.startWild;try{startWild=BASE.startWild}catch(_){}window.drawInterior=drawInteriorV118;try{drawInterior=drawInteriorV118}catch(_){}window.interactInterior=interactInteriorV118;try{interactInterior=interactInteriorV118}catch(_){};
  if(BASE.interior){BASE.interior.enter=enterInteriorV118;BASE.interior.moveToRoom=moveInteriorRoomV118;BASE.interior.draw=drawInteriorV118;BASE.interior.interact=interactInteriorV118;window.ValdoraInteriorV109V=BASE.interior;window.ValdoraBuildingV109I=BASE.interior}
  window.v109eEnterBuilding=enterInteriorV118;window.enterBuildingV67=enterInteriorV118;window.enterBuildingV68=enterInteriorV118;window.enterBuildingV70=enterInteriorV118;return true
}
function configureCurrent(force=false){if(TOWNS.includes(state?.zone))placeTownCitizens(state.zone,force);ensureInteriorPopulation(false)}
function configureAll(force=false){for(const zone of TOWNS)placeTownCitizens(zone,force);ensureInteriorPopulation(false)}
function scheduleTownPopulation(force=false,delay=260){TOWNS.forEach((zone,i)=>setTimeout(()=>{try{placeTownCitizens(zone,force);if(i===TOWNS.length-1)publishAudit()}catch(e){console.warn('V118 population '+zone,e)}},delay+i*95))}
let lastBuildingRepair=Date.now();
function refreshBuildings(){const now=Date.now();if(now-lastBuildingRepair<9000)return 0;lastBuildingRepair=now;const moved=repairAllBuildings();if(moved)scheduleTownPopulation(false,80);return moved}
function install(){configureCurrent(false);installHooks();stabilizeSidebar();enforceIdentity();publishAudit()}

const api={version:VERSION,active:true,dialogues:DIALOGUE_BANK,contracts:CONTRACTS,install,installHooks,configure:configureAll,stabilizeSidebar,enforceIdentity,openPanel,previewHouse,publishAudit,audit,allWorldCitizens,nearWorldNpc,ensureInteriorPopulation,repairAllBuildings};
window.ValdoraLivingWorldV118=api;stateV118();install();scheduleTownPopulation(false,320);if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install);[80,420,1100,2400,4200,7200,10800,17600].forEach(ms=>setTimeout(install,ms));setTimeout(()=>{try{lastBuildingRepair=0;refreshBuildings();install();}catch(e){console.warn('V118 implantation',e)}},11800);setInterval(()=>{try{installHooks();stabilizeSidebar();enforceIdentity();configureCurrent(false);refreshBuildings();publishAudit()}catch(e){console.warn('V118 maintenance',e)}},3500);
console.log('V118 : monde vivant actif — 1 440 dialogues, 60 activités locales et intérieurs habités.');
})();
