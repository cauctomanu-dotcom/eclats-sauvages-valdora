// ============================================================================
// VALDORA V105Z — ROUTES SPÉCIALES, SAC DE COMBAT UNIFIÉ ET INTÉRIEURS
// ============================================================================
(()=>{
  'use strict';

  const VERSION='V105Z';
  const REF=window.VALDORA_MOBILIER_REFERENCE_V105X;
  const PASSAGE_ID='passage_sol';

  // --------------------------------------------------------------------------
  // 1. MOBILIER DES MODÈLES RESTÉS VIDES
  // --------------------------------------------------------------------------
  function asset(category,id,view='front'){
    if(category==='structure')return `assets/mobilier/structure/${id}.png`;
    return `assets/mobilier/${category}/${id}/${view}.png`;
  }

  let furnitureSerial=0;
  function furniture(category,id,label,x,y,w,h,fonction='decor',options={}){
    const front=asset(category,id,'front');
    return {
      instanceId:`v105z_${category}_${id}_${++furnitureSerial}`,
      id,label,x,y,w,h,
      view:options.view||'front',rotation:options.rotation||0,
      flipX:false,flipY:false,z:options.z??y,
      bloquant:options.bloquant!==false,
      interactif:fonction!=='decor',fonction,
      description:options.description||`${label}, installé pour cet intérieur.`,
      categoryId:category,asset:front,
      assets:category==='structure'?{front,left:front,back:front}:{front,left:asset(category,id,'left'),back:asset(category,id,'back')},
      collision:options.bloquant===false?null:{x,y,w,h}
    };
  }

  function plant(x,y,w=92,h=115){return furniture('hotel','plante_pot','Plante en pot',x,y,w,h)}
  function passage(x,y,w,h,targetRoom,targetFloor='rdc'){
    return {
      instanceId:`v105z_passage_${++furnitureSerial}`,
      id:PASSAGE_ID,label:'Passage vers une autre pièce',x,y,w,h,
      view:'front',rotation:0,flipX:false,flipY:false,z:999999,
      bloquant:false,interactif:false,fonction:'passage_piece_sol',
      description:'Passage fonctionnel entre deux pièces.',categoryId:'structure',
      asset:null,assets:{},collision:null,targetFloor,targetRoom
    };
  }

  function room(label,width,height,items){return {name:label,label,width,height,furniture:items}}
  function setRooms(buildingId,rooms){
    const b=REF?.buildings?.[buildingId];
    if(!b)return;
    b.floors=b.floors||{};
    b.floors.rdc=b.floors.rdc||{name:'Rez-de-chaussée',rooms:{}};
    const existing=Object.values(b.floors.rdc.rooms||{}).reduce((n,r)=>n+(r.furniture||[]).length,0);
    if(existing>0)return;
    b.floors.rdc.rooms=rooms;
  }

  function furnishMissingReferences(){
    if(!REF?.buildings)return;

    setRooms('immeuble_moyen',{
      principal:room('Hall de l’immeuble moyen',1200,800,[
        furniture('structure','ascenseur','Ascenseur',505,45,190,185,'decor'),
        furniture('residence','canape_modulaire','Canapé du hall',80,205,300,165,'s_asseoir'),
        furniture('residence','table_basse','Table basse',155,400,170,105,'decor'),
        furniture('residence','bureau_domestique','Bureau d’accueil',815,190,250,170,'ouvrir_rangement'),
        furniture('bureau_guilde','classeur_archives','Classeur des résidents',900,405,150,175,'ouvrir_rangement'),
        plant(55,570),plant(1050,570),
        passage(155,735,130,30,'bureau'),passage(915,735,130,30,'appartement')
      ]),
      bureau:room('Bureau partagé',1000,700,[
        furniture('bureau_guilde','bureau_direction','Bureau de travail',350,80,300,180,'ouvrir_rangement'),
        furniture('bureau_guilde','fauteuil_bureau','Fauteuil de bureau',450,300,125,135,'s_asseoir'),
        furniture('bureau_guilde','classeur_archives','Archives',80,120,170,205,'ouvrir_rangement'),
        furniture('bureau_guilde','tableau_missions','Panneau d’informations',740,105,180,195,'decor'),
        plant(70,500),plant(835,500),passage(435,650,130,30,'principal')
      ]),
      appartement:room('Appartement témoin',1000,700,[
        furniture('residence','canape_modulaire','Canapé',90,110,300,165,'s_asseoir'),
        furniture('residence','table_basse','Table basse',155,320,175,105,'decor'),
        furniture('residence','armoire','Armoire',735,90,175,235,'ouvrir_rangement'),
        furniture('residence','bureau_domestique','Bureau domestique',625,365,245,165,'ouvrir_rangement'),
        furniture('maison','lit_simple','Lit',75,440,250,165,'repos_15s_soin_complet'),
        plant(850,500),passage(435,650,130,30,'principal')
      ])
    });

    setRooms('grand_immeuble',{
      principal:room('Grand hall',1300,850,[
        furniture('structure','ascenseur','Batterie d’ascenseurs',520,45,260,210,'decor'),
        furniture('residence','canape_modulaire','Canapé du grand hall',90,250,330,175,'s_asseoir'),
        furniture('residence','canape_modulaire','Canapé du grand hall',880,250,330,175,'s_asseoir'),
        furniture('residence','table_basse','Table centrale',545,365,210,125,'decor'),
        furniture('bureau_guilde','tableau_missions','Tableau des étages',95,65,180,205,'decor'),
        plant(45,635),plant(1160,635),
        passage(115,785,130,30,'bureaux'),passage(585,785,130,30,'salon'),passage(1055,785,130,30,'appartement')
      ]),
      bureaux:room('Plateau de bureaux',1100,740,[
        furniture('bureau_guilde','table_reunion','Table de réunion',350,95,400,200,'s_asseoir'),
        furniture('bureau_guilde','bureau_direction','Bureau de direction',715,345,285,175,'ouvrir_rangement'),
        furniture('bureau_guilde','fauteuil_bureau','Fauteuil',800,540,125,130,'s_asseoir'),
        furniture('bureau_guilde','classeur_archives','Classeur',80,105,170,215,'ouvrir_rangement'),
        furniture('bureau_guilde','tableau_missions','Planning',80,390,190,200,'decor'),
        plant(960,105),passage(485,690,130,30,'principal')
      ]),
      salon:room('Salon commun',1100,740,[
        furniture('residence','canape_modulaire','Grand canapé',130,140,330,175,'s_asseoir'),
        furniture('residence','canape_modulaire','Grand canapé',640,140,330,175,'s_asseoir'),
        furniture('residence','table_basse','Table basse',445,370,210,125,'decor'),
        furniture('maison','television','Écran commun',430,60,240,160,'decor'),
        furniture('maison','bibliotheque','Bibliothèque',70,430,205,220,'ouvrir_rangement'),
        plant(900,480),passage(485,690,130,30,'principal')
      ]),
      appartement:room('Grand appartement',1100,740,[
        furniture('residence','canape_modulaire','Canapé',80,105,310,170,'s_asseoir'),
        furniture('residence','table_basse','Table basse',145,330,180,110,'decor'),
        furniture('residence','armoire','Armoire',820,80,185,245,'ouvrir_rangement'),
        furniture('residence','commode','Commode',785,370,220,150,'ouvrir_rangement'),
        furniture('residence','bureau_domestique','Bureau domestique',430,105,245,170,'ouvrir_rangement'),
        furniture('maison','lit_simple','Lit',90,480,260,175,'repos_15s_soin_complet'),
        plant(940,540),passage(485,690,130,30,'principal')
      ])
    });

    setRooms('bureau_guilde',{
      principal:room('Maison des Guildes',1200,800,[
        furniture('bureau_guilde','bureau_direction','Bureau de la Guilde',420,70,360,195,'ouvrir_rangement'),
        furniture('bureau_guilde','fauteuil_bureau','Fauteuil du responsable',535,300,130,145,'s_asseoir'),
        furniture('bureau_guilde','table_reunion','Table de réunion',390,470,420,195,'s_asseoir'),
        furniture('bureau_guilde','classeur_archives','Archives',75,115,180,220,'ouvrir_rangement'),
        furniture('bureau_guilde','classeur_archives','Archives',945,115,180,220,'ouvrir_rangement'),
        furniture('bureau_guilde','tableau_missions','Tableau des missions',75,390,205,220,'dialogue_guilde'),
        plant(960,520),plant(65,625)
      ])
    });

    setRooms('bibliotheque_publique',{
      principal:room('Bibliothèque publique',1200,800,[
        furniture('bibliotheque_publique','comptoir_bibliotheque','Comptoir de prêt',420,65,360,185,'ouvrir_rangement'),
        furniture('bibliotheque_publique','rayonnage_livres','Rayonnage',65,100,210,260,'ouvrir_rangement'),
        furniture('bibliotheque_publique','rayonnage_livres','Rayonnage',925,100,210,260,'ouvrir_rangement'),
        furniture('bibliotheque_publique','rayonnage_livres','Rayonnage',65,405,210,260,'ouvrir_rangement'),
        furniture('bibliotheque_publique','rayonnage_livres','Rayonnage',925,405,210,260,'ouvrir_rangement'),
        furniture('bibliotheque_publique','table_lecture','Table de lecture',385,355,430,205,'s_asseoir'),
        furniture('bibliotheque_publique','presentoir_archives','Archives de Valdora',430,590,340,145,'ouvrir_rangement'),
        plant(300,600),plant(810,600)
      ])
    });

    setRooms('ecole',{
      principal:room('École de Valdora',1200,800,[
        furniture('ecole','tableau_cours','Tableau de cours',405,55,390,190,'decor'),
        furniture('ecole','bureau_professeur','Bureau du professeur',455,270,290,170,'ouvrir_rangement'),
        furniture('ecole','pupitre_eleve','Pupitre',130,455,190,135,'s_asseoir'),
        furniture('ecole','pupitre_eleve','Pupitre',385,455,190,135,'s_asseoir'),
        furniture('ecole','pupitre_eleve','Pupitre',640,455,190,135,'s_asseoir'),
        furniture('ecole','pupitre_eleve','Pupitre',895,455,190,135,'s_asseoir'),
        furniture('ecole','casier_ecole','Casiers',70,90,220,230,'ouvrir_rangement'),
        furniture('ecole','casier_ecole','Casiers',910,90,220,230,'ouvrir_rangement'),
        furniture('ecole','globe_valdora','Globe de Valdora',75,600,150,150,'decor'),
        plant(1000,620)
      ])
    });
  }

  furnishMissingReferences();

  function referenceForBuilding(b){
    const label=String(b?.label||'').toLowerCase();
    const raw=String(b?.urbanType||b?.type||'').toLowerCase();
    if(label.includes('guilde'))return 'bureau_guilde';
    if(label.includes('biblioth')||raw==='library')return 'bibliotheque_publique';
    if(label.includes('école')||label.includes('ecole')||label.includes('académie')||raw==='school')return 'ecole';
    if(label.includes('gardien')||raw==='guardian'||b?.guardianBuilding)return 'gardien';
    if(label.includes('grand immeuble'))return 'grand_immeuble';
    if(label.includes('immeuble moyen'))return 'immeuble_moyen';
    if(raw==='apartments'||raw==='office'||label.includes('immeuble'))return Number(b?.floors||0)>=8?'grand_immeuble':'immeuble_moyen';
    return null;
  }

  function tagBuildings(){
    if(typeof SCENES==='undefined')return;
    for(const sc of Object.values(SCENES||{}))for(const b of sc?.buildings||[]){
      const ref=referenceForBuilding(b);if(ref)b.referenceType=ref;
    }
  }

  // --------------------------------------------------------------------------
  // 2. CINQ ROUTES DE MONTAGNE COMPLÈTES
  // --------------------------------------------------------------------------
  const ROUTES={
    route_m1:{name:'Route des Brumes',level:31,orientation:'NS',a:'town11',aLabel:'Brumelac',b:'town3',bLabel:'Montfaucon',points:[[8,0],[8,2],[4,2],[4,5],[11,5],[11,7],[7,7],[7,9]]},
    route_m2:{name:'Corniche de Simdor',level:35,orientation:'NS',a:'town3',aLabel:'Montfaucon',b:'route_simdor',bLabel:'Simdor',points:[[7,0],[7,2],[11,2],[11,4],[5,4],[5,7],[8,7],[8,9]]},
    route_m3:{name:'Passe de Soléria',level:39,orientation:'NS',a:'route_simdor',aLabel:'Simdor',b:'town5',bLabel:'Soléria',points:[[8,0],[8,2],[3,2],[3,5],[10,5],[10,7],[6,7],[6,9]]},
    route_m4:{name:'Col de Nova',level:43,orientation:'WE',a:'route_simdor',aLabel:'Simdor',b:'town6',bLabel:'Nova-Cité',points:[[0,5],[3,5],[3,2],[7,2],[7,7],[11,7],[11,4],[15,4]]},
    route_m5:{name:'Route des Ombres',level:47,orientation:'WE',a:'town7',aLabel:'Valombre',b:'town3',bLabel:'Montfaucon',points:[[0,4],[3,4],[3,7],[7,7],[7,2],[12,2],[12,6],[15,6]]}
  };

  function addLine(set,a,b){
    let x=a[0],y=a[1];set.add(`${x},${y}`);
    while(x!==b[0]){x+=Math.sign(b[0]-x);set.add(`${x},${y}`)}
    while(y!==b[1]){y+=Math.sign(b[1]-y);set.add(`${x},${y}`)}
  }
  function configureMountainRoute(id,def,index){
    if(typeof SCENES==='undefined')return;
    const C=220,cols=16,rows=10,width=cols*C,height=rows*C,road=new Set();
    for(let i=1;i<def.points.length;i++)addLine(road,def.points[i-1],def.points[i]);
    const path=def.points.map(([x,y])=>[(x+.5)*C,(y+.5)*C]);
    const exits=def.orientation==='NS'?
      [{x:(def.points[0][0]+.5)*C-95,y:0,w:190,h:112,side:'north',to:def.a,label:`Vers ${def.aLabel}`},
       {x:(def.points.at(-1)[0]+.5)*C-95,y:height-112,w:190,h:112,side:'south',to:def.b,label:`Vers ${def.bLabel}`}]:
      [{x:0,y:(def.points[0][1]+.5)*C-95,w:112,h:190,side:'west',to:def.a,label:`Vers ${def.aLabel}`},
       {x:width-112,y:(def.points.at(-1)[1]+.5)*C-95,w:112,h:190,side:'east',to:def.b,label:`Vers ${def.bLabel}`}];
    const trees=[],grass=[];
    for(let y=1;y<rows-1;y++)for(let x=1;x<cols-1;x++){
      const key=`${x},${y}`;if(road.has(key))continue;
      const near=[[0,0],[1,0],[-1,0],[0,1],[0,-1]].some(([dx,dy])=>road.has(`${x+dx},${y+dy}`));
      if(((x*13+y*17+index*7)%5===0)&&!near&&trees.length<34)trees.push({x:(x+.5)*C,y:(y+.5)*C,s:.82+((x+y)%4)*.08,v:(x+y+index)%4});
      if(((x*7+y*11+index*5)%13===0)&&grass.length<9)grass.push({x:x*C+28,y:y*C+28,w:C-56,h:C-56});
    }
    const trainers=[];
    for(let n=1;n<=4;n++){
      const q=path[Math.min(path.length-2,n+1)]||path[Math.floor(path.length/2)];
      trainers.push({id:`${id}_dresseur_${n}`,zone:id,x:q[0],y:q[1],homeX:q[0],homeY:q[1],look:(index*7+n*5)%41,dir:n%4,level:def.level+(n-1)*2,dialog:`Guide de ${def.name}`,moving:false});
    }
    const sc=SCENES[id]||(SCENES[id]={});
    Object.assign(sc,{
      kind:'route',name:def.name,biome:'mountain',routeKind:'mountain',routeEngine:'V105D',
      width,height,v105dCell:C,v105dCore:142,v105dCols:cols,v105dRows:rows,
      v105dStyle:'mountain',v105dRoad:road,v104Path:path,kPath:path,v76Path:path,
      exits,grass,v105dTrees:trees,v105dBushes:[],v105dDots:[],obstacles:[],mObstacles:[],trainers,
      v67Mountain:true,v105zPopulated:true
    });
  }
  function configureSpecialRoutes(){let i=0;for(const [id,def] of Object.entries(ROUTES))configureMountainRoute(id,def,i++)}

  const originalAreaLevel=typeof v83AreaLevelBase==='function'?v83AreaLevelBase:null;
  if(originalAreaLevel){
    const patchedAreaLevel=function(){return ROUTES[state?.zone]?.level??originalAreaLevel()};
    try{v83AreaLevelBase=patchedAreaLevel}catch(_){ }
    window.v83AreaLevelBase=patchedAreaLevel;
  }

  // --------------------------------------------------------------------------
  // 3. SAC UNIQUE EN COMBAT + UN TOUR POUR CHAQUE OBJET
  // --------------------------------------------------------------------------
  function combatActive(){return typeof scene!=='undefined'&&scene==='battle'&&typeof battle!=='undefined'&&!!battle}
  function menu(){return document.getElementById('menuov')}
  function closeMenu(){const m=menu();if(m)m.style.display='none'}
  function ensureInventory(){
    state.inventory=state.inventory||{};
    for(const id of ['Potion','SuperPotion','Rappel','Baie','Antidote','Repas','FioleGuerison','ElixirVital','FioleAttaque','FioleDefense','Orbe','SuperOrbe','MegaOrbe'])if(state.inventory[id]==null)state.inventory[id]=0;
  }
  function itemLabel(id){return SHOP_ITEMS?.[id]?.label||({Potion:'Potion',SuperPotion:'Super Potion',Rappel:'Rappel',Baie:'Baie',Antidote:'Antidote',Repas:'Repas maison',FioleGuerison:'Fiole de Guérison',ElixirVital:'Élixir Vital',FioleAttaque:'Fiole d’Attaque',FioleDefense:'Fiole de Défense',Orbe:'Orbe d’Éclat',SuperOrbe:'Super Orbe',MegaOrbe:'Méga Orbe'}[id]||id)}
  function battleMessage(text){
    if(!battle)return;battle.message=text;
    for(const id of ['battleMessageV105R','battleMessageV84']){const el=document.getElementById(id);if(el){el.textContent=text;if(id==='battleMessageV105R')el.style.setProperty('display','block','important')}}
  }
  function rebuildBattleBar(){try{window.buildBattleButtons?.()}catch(_){try{buildBattleButtons()}catch(__){ }}}
  function consumeTurn(text){
    if(!combatActive())return;
    closeMenu();battle.busy=true;battle.menu='actions';battle.phase='player-item';battleMessage(text);
    try{hud()}catch(_){ }try{save(false)}catch(_){ }rebuildBattleBar();
    const token=battle.token;
    setTimeout(()=>{if(!combatActive()||battle.token!==token)return;try{window.enemyTurn?.()}catch(err){console.error('V105Z tour objet',err);battle.busy=false;rebuildBattleBar()}},650);
  }
  function canUseOn(id,m){
    if(!m)return false;
    if(id==='Rappel')return m.hp<=0;
    if(m.hp<=0)return false;
    if(['Potion','SuperPotion','Repas','FioleGuerison','ElixirVital'].includes(id))return m.hp<maxHP(m)||(['FioleGuerison','ElixirVital'].includes(id)&&!!m.status);
    if(id==='Baie')return !!m.status&&m.status!=='empoisonné';
    if(id==='Antidote')return m.status==='empoisonné';
    return true;
  }
  function targetHtml(id){
    const choices=(state.team||[]).map((m,i)=>({m,i})).filter(x=>canUseOn(id,x.m));
    if(!choices.length){toast('Aucun Éclat ne peut bénéficier de cet objet.');return}
    let h=`<div id="v105zBattleBagMarker" class="quest"><b>${itemLabel(id)}</b><br>Choisis la cible. Son utilisation consommera ton tour.</div><div class="partyselect">`;
    for(const {m,i} of choices)h+=`<button class="partycard" onclick="ValdoraV105Z.applyBattleItem('${id}',${i})"><b>${BY[m.id]?.name||'Éclat'}</b><br>N.${m.level}<br>PV ${m.hp}/${maxHP(m)}${m.status?`<br><small>${m.status}</small>`:''}</button>`;
    h+=`</div><button onclick="ValdoraV105Z.openBattleBag()">Retour au sac</button>`;
    openSimpleMenu('Sac — Choix de la cible',h);
  }
  function applyBattleItem(id,index){
    if(!combatActive()||battle.busy)return;ensureInventory();
    const inv=state.inventory,m=state.team?.[index];if(!m||!(inv[id]>0)||!canUseOn(id,m)){toast('Cet objet ne peut pas être utilisé ici.');return}
    inv[id]--;let text='';
    if(id==='Rappel'){m.hp=Math.max(1,Math.floor(maxHP(m)*.5));m.status=null;text=`${BY[m.id]?.name||'L’Éclat'} revient avec ${m.hp} PV.`}
    else if(id==='Baie'){m.status=null;text=`Le statut de ${BY[m.id]?.name||'l’Éclat'} est soigné.`}
    else if(id==='Antidote'){m.status=null;text=`Le poison de ${BY[m.id]?.name||'l’Éclat'} est soigné.`}
    else{
      const amount={Potion:30,SuperPotion:80,Repas:50,FioleGuerison:120,ElixirVital:Infinity}[id]||0,before=m.hp;
      m.hp=id==='ElixirVital'?maxHP(m):Math.min(maxHP(m),m.hp+amount);
      if(id==='FioleGuerison'||id==='ElixirVital')m.status=null;
      text=`${itemLabel(id)} rend ${m.hp-before} PV à ${BY[m.id]?.name||'l’Éclat'}.`;
    }
    consumeTurn(text);
  }
  function applyBattleBoost(id){
    if(!combatActive()||battle.busy)return;ensureInventory();if(!(state.inventory[id]>0)){toast('Tu n’en as plus.');return}
    const m=battle.player||state.team?.[0];if(!m)return;state.inventory[id]--;
    if(id==='FioleAttaque')m.atkBuff=Math.min(3,(m.atkBuff||0)+2);else m.defBuff=Math.min(3,(m.defBuff||0)+2);
    consumeTurn(`${itemLabel(id)} renforce ${BY[m.id]?.name||'ton Éclat'}.`);
  }
  function useOrb(id){
    if(!combatActive()||battle.busy)return;if(battle.trainer){toast('Impossible d’utiliser une Orbe contre la créature d’un dresseur.');return}
    closeMenu();try{window.throwBattleOrb?.(id)}catch(_){try{throwBattleOrb(id)}catch(__){ }}
  }
  function bagButton(id,icon,desc,action='target',forcedDisabled=false){
    const n=state.inventory?.[id]||0,onclick=action==='orb'?`ValdoraV105Z.useOrb('${id}')`:action==='boost'?`ValdoraV105Z.applyBattleBoost('${id}')`:`ValdoraV105Z.selectBattleItem('${id}')`;
    return `<button class="bagitem" ${n<=0||forcedDisabled?'disabled':''} onclick="${onclick}"><b>${icon} ${itemLabel(id)}</b><br>${n}<br><small>${desc}</small></button>`;
  }
  function openBattleBag(){
    if(!combatActive()||battle.busy)return;ensureInventory();
    let h='<div id="v105zBattleBagMarker" class="quest"><b>Sac unifié</b><br>Ce sac contient exactement les objets disponibles depuis le panneau de droite. Utiliser un objet consomme un tour.</div><div class="baggrid">';
    h+=bagButton('Potion','🧪','Restaure 30 PV.');
    h+=bagButton('SuperPotion','🧪✨','Restaure 80 PV.');
    h+=bagButton('Rappel','✨','Réanime à 50 % des PV.');
    h+=bagButton('Baie','🍓','Soigne un statut, sauf le poison.');
    h+=bagButton('Antidote','⚗️','Soigne le poison.');
    if((state.inventory.Repas||0)>0)h+=bagButton('Repas','🍲','Restaure 50 PV.');
    h+=bagButton('FioleGuerison','💗','Restaure 120 PV et soigne le statut.');
    h+=bagButton('ElixirVital','💎','Restaure tous les PV et soigne le statut.');
    h+=bagButton('FioleAttaque','🔴','Augmente l’attaque.','boost');
    h+=bagButton('FioleDefense','🔵','Augmente la défense.','boost');
    h+=bagButton('Orbe','◈',battle.trainer?'Indisponible contre un dresseur.':'Capture standard.','orb',!!battle.trainer);
    h+=bagButton('SuperOrbe','◆',battle.trainer?'Indisponible contre un dresseur.':'Capture améliorée.','orb',!!battle.trainer);
    h+=bagButton('MegaOrbe','✦',battle.trainer?'Indisponible contre un dresseur.':'Capture d’élite.','orb',!!battle.trainer);
    for(let n=1;n<=5;n++){const id=`Artefact${n}`;if((state.inventory[id]||0)>0)h+=`<button class="bagitem" disabled><b>🔷 ${itemLabel(id)}</b><br>${state.inventory[id]}<br><small>Utilisable hors combat.</small></button>`}
    h+='</div><h3>Capsules de capacité</h3>';
    h+=(state.capsules||[]).length?(state.capsules||[]).map(id=>`<div class="quest"><b>${MOVE_DB?.[id]?.name||id}</b><br>Apprentissage disponible hors combat depuis le menu Équipe.</div>`).join(''):'<div class="quest">Aucune Capsule de capacité pour le moment.</div>';
    openSimpleMenu('Sac — Combat',h);
  }

  const worldBag=window.openBag;
  window.openBag=function(){return combatActive()?openBattleBag():worldBag?.()};
  const rightBag=document.getElementById('bag');if(rightBag)rightBag.onclick=()=>window.openBag();

  document.addEventListener('click',event=>{
    if(!combatActive())return;
    const button=event.target?.closest?.('#battleUI button');
    if(!button||(button.textContent||'').trim()!=='Sac')return;
    event.preventDefault();event.stopImmediatePropagation();openBattleBag();
  },true);

  function closeOrphanBattleInterface(){
    if(combatActive())return;
    const ui=document.getElementById('battleUI');
    if(ui){ui.dataset.combatActive='false';ui.style.setProperty('display','none','important')}
    const bar=document.getElementById('bbuttons');if(bar&&typeof battle!=='undefined'&&!battle)bar.innerHTML='';
    for(const id of ['battleMessageV105R','battleMessageV84']){const el=document.getElementById(id);if(el){el.textContent='';el.style.setProperty('display','none','important')}}
    document.body.classList.remove('v101-battle-mode');
    const overlay=menu();if(overlay?.querySelector('#v105zBattleBagMarker'))overlay.style.display='none';
  }
  setInterval(closeOrphanBattleInterface,120);

  window.ValdoraV105Z={version:VERSION,openBattleBag,selectBattleItem:targetHtml,applyBattleItem,applyBattleBoost,useOrb,configureSpecialRoutes,furnishMissingReferences};

  // --------------------------------------------------------------------------
  // INITIALISATION ET MARQUE DE VERSION
  // --------------------------------------------------------------------------
  function brand(){
    document.title='Éclats Sauvages — Valdora V105Z';
    const b=document.querySelector('.brand b');if(b)b.textContent=`VALDORA V105Z — ${String(b.textContent).includes('CRÉATEUR')?'CRÉATEUR':'JOUEUR'}`;
    document.documentElement.dataset.valdoraVersion=VERSION;
  }
  function install(){
    furnishMissingReferences();tagBuildings();configureSpecialRoutes();brand();
    if(document.getElementById('bag'))document.getElementById('bag').onclick=()=>window.openBag();
    document.documentElement.dataset.v105zFurnished=String(['immeuble_moyen','grand_immeuble','bureau_guilde','bibliotheque_publique','ecole'].filter(id=>Object.values(REF?.buildings?.[id]?.floors?.rdc?.rooms||{}).some(r=>(r.furniture||[]).length)).length);
    document.documentElement.dataset.v105zRoutes=String(['route_m1','route_m2','route_m3','route_m4','route_m5'].filter(id=>typeof SCENES!=='undefined'&&SCENES[id]?.v76Path?.length&&SCENES[id]?.trainers?.length).length);
  }
  install();
  window.addEventListener('DOMContentLoaded',()=>{install();setTimeout(install,250);setTimeout(install,1750);setTimeout(install,3000)});
  setInterval(brand,1200);
  console.log('V105Z : routes spéciales peuplées, sac de combat unifié, fermeture de combat sécurisée et intérieurs complétés.');
})();
