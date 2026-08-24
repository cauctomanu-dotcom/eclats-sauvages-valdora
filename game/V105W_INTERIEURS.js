// ============================================================================
// VALDORA V105W — INTÉRIEURS INTÉGRÉS, PIÈCES, PASSAGES ET ASCENSEURS
// ============================================================================
(()=>{
  'use strict';

  const VERSION='V105W';
  const SX=.8, SY=.8;
  const IMG_CACHE=new Map();
  let INT=null;

  const BASE_DRAW=window.drawInterior;
  const BASE_MOVE=window.moveInterior;
  const BASE_INTERACT=window.interactInterior;

  const ASSET=(category,id)=>`assets/mobilier/${category}/${id}/front.png`;
  const STRUCT=id=>`assets/mobilier/structure/${id}.png`;

  function humanize(id){
    return String(id||'Mobilier').replaceAll('_',' ').replace(/\b\p{L}/gu,c=>c.toUpperCase());
  }
  function item(category,id,x,y,w,h,action='decor',label=null,solid=true){
    return {category,id,x,y,w,h,action,label:label||humanize(id),solid,src:ASSET(category,id)};
  }
  const plant=(x,y,w=105,h=125)=>item('hotel','plante_pot',x,y,w,h,'decor','Plante verte');

  const TEMPLATES={
    house:{
      label:'Maison',wall:'#f3e6d3',floor:'#c79562',accent:'#74aeb1',
      items:[
        item('maison','bibliotheque',75,105,225,190,'books','Bibliothèque'),
        item('maison','television',835,115,225,155,'tv','Télévision'),
        item('maison','console_salon',455,405,320,165,'rest','Coin salon'),
        item('maison','table_cuisine',155,470,300,165,'meal','Table de cuisine'),
        item('maison','lit_simple',785,455,270,175,'bed','Lit'),
        plant(65,500),plant(1040,500)
      ]
    },
    healer:{
      label:'Centre de soins',wall:'#eaf5f3',floor:'#c9e1dd',accent:'#32aeb2',
      items:[
        item('centre_soins','comptoir_medical',345,105,510,165,'heal','Comptoir de soins'),
        item('centre_soins','machine_soin',820,285,270,225,'heal','Machine de soins'),
        item('centre_soins','canape_attente',105,335,300,155,'rest','Canapé d’attente'),
        item('centre_soins','pc_public',470,340,180,175,'medical_info','Borne médicale'),
        item('centre_soins','carte_murale',430,95,340,120,'map','Carte médicale',false),
        plant(70,505),plant(1030,505)
      ]
    },
    shop:{
      label:'Boutique',wall:'#f3ead9',floor:'#d5b27c',accent:'#188d91',
      items:[
        item('boutique','comptoir_vente',335,105,530,170,'shop','Comptoir de vente'),
        item('boutique','etagere_produits',75,250,245,270,'shop','Rayonnage de produits'),
        item('boutique','caisse_enregistreuse',855,185,170,145,'shop','Caisse'),
        item('boutique','cartons_decor',850,390,235,180,'decor','Colis de livraison'),
        plant(70,510),plant(1030,510)
      ]
    },
    station:{
      label:'Gare',wall:'#e5eef0',floor:'#b9c9ca',accent:'#147f89',
      items:[
        item('gare','guichet_billets',365,95,470,175,'station','Guichet'),
        item('gare','tourniquet_acces',445,465,250,165,'station','Tourniquet'),
        item('gare','banc_quai',75,415,295,145,'rest','Banc'),
        item('gare','panneau_horaires',805,150,280,180,'board','Horaires'),
        item('gare','distributeur_boissons',870,405,180,195,'vending','Distributeur'),
        plant(65,505),plant(1035,505)
      ]
    },
    lab:{
      label:'Laboratoire',wall:'#edf2f4',floor:'#b8cdd1',accent:'#26a8bd',
      items:[
        item('laboratoire','table_starters',370,110,460,175,'starters','Table des compagnons'),
        item('laboratoire','supercalculateur',70,285,320,235,'computer','Supercalculateur'),
        item('laboratoire','tableau_blanc',430,115,340,135,'research','Tableau de recherche',false),
        item('laboratoire','incubateur',830,285,255,260,'egg','Incubateur'),
        plant(65,505),plant(1030,505)
      ]
    },
    museum:{
      label:'Musée',wall:'#f0e7d7',floor:'#c7aa81',accent:'#9b7344',
      items:[
        item('musee','vitrine_verre',75,130,280,200,'museum','Vitrine historique'),
        item('musee','socle_statue',455,135,290,230,'museum','Statue ancienne'),
        item('musee','cordon_securite',380,510,440,120,'museum','Espace protégé'),
        item('musee','bureau_conservateur',820,350,275,190,'museum','Bureau de conservation'),
        plant(65,505),plant(1030,505)
      ]
    },
    school:{
      label:'École',wall:'#f1e4d2',floor:'#cfad80',accent:'#238d91',
      items:[
        item('ecole','bureau_professeur',410,95,380,160,'school','Bureau du professeur'),
        item('ecole','tableau_cours',400,85,400,130,'school','Tableau de cours',false),
        item('ecole','pupitre_eleve',175,300,210,150,'school','Pupitre'),
        item('ecole','pupitre_eleve',495,300,210,150,'school','Pupitre'),
        item('ecole','casier_ecole',835,245,245,225,'school','Casiers'),
        item('ecole','globe_valdora',75,500,180,145,'map','Globe de Valdora'),
        plant(1030,505)
      ]
    },
    guardian:{
      label:'Bâtiment du Gardien',wall:'#e7e0d4',floor:'#88765e',accent:'#0d7c83',
      items:[
        item('gardien','pupitre_gardien',410,105,380,175,'guardian','Pupitre du Gardien'),
        item('gardien','autel_sceau',455,290,290,230,'guardian','Autel du Sceau'),
        item('gardien','banniere_gardien',90,130,170,245,'guardian','Bannière'),
        item('gardien','presentoir_trophees',840,160,270,255,'guardian','Trophées'),
        item('gardien','banc_defi',175,490,300,140,'rest','Banc du défi'),
        plant(65,505),plant(1030,505)
      ]
    },
    hotel_lobby:{
      label:'Hall de l’hôtel',wall:'#f4eadb',floor:'#bd9364',accent:'#0b797d',
      items:[
        item('hotel','reception_hotel',330,105,540,180,'hotel','Réception'),
        item('hotel','chariot_bagages',95,365,230,205,'hotel','Chariot à bagages'),
        item('residence','canape_modulaire',760,370,315,165,'rest','Salon du hall'),
        plant(65,500),plant(1035,500)
      ]
    },
    hotel_room:{
      label:'Chambre d’hôtel',wall:'#f2e5d6',floor:'#c79c6c',accent:'#a77948',
      items:[
        item('hotel','lit_luxe',375,115,450,260,'bed','Lit de la chambre'),
        item('residence','armoire',85,250,230,275,'wardrobe','Armoire'),
        item('residence','commode',850,310,245,195,'storage','Commode'),
        item('maison','television',840,110,240,155,'tv','Télévision'),
        item('residence','bureau_domestique',400,470,320,170,'desk','Bureau'),
        plant(65,505),plant(1035,505)
      ]
    },
    apartment:{
      label:'Appartement',wall:'#f0e6da',floor:'#c69b6d',accent:'#62a0a3',
      items:[
        item('residence','canape_modulaire',385,135,430,185,'rest','Canapé'),
        item('residence','table_basse',460,365,280,135,'rest','Table basse'),
        item('residence','armoire',85,205,225,280,'wardrobe','Armoire'),
        item('residence','commode',875,295,220,190,'storage','Commode'),
        item('residence','bureau_domestique',765,485,315,160,'desk','Bureau'),
        item('maison','lit_simple',85,480,280,165,'bed','Lit'),
        plant(65,505),plant(1035,505)
      ]
    },
    office:{
      label:'Bureau',wall:'#e8edef',floor:'#b8b8b0',accent:'#177b80',
      items:[
        item('bureau_guilde','bureau_direction',360,110,480,195,'desk','Bureau de direction'),
        item('bureau_guilde','fauteuil_bureau',505,340,190,180,'rest','Fauteuil'),
        item('bureau_guilde','table_reunion',385,460,430,170,'meeting','Table de réunion'),
        item('bureau_guilde','classeur_archives',80,260,220,280,'archive','Classeur'),
        item('bureau_guilde','tableau_missions',870,145,230,245,'missions','Tableau des missions'),
        plant(65,505),plant(1035,505)
      ]
    },
    library:{
      label:'Bibliothèque',wall:'#efe4d6',floor:'#b58d62',accent:'#0f7b79',
      items:[
        item('bibliotheque_publique','comptoir_bibliotheque',355,105,490,170,'library','Accueil de la bibliothèque'),
        item('bibliotheque_publique','rayonnage_livres',75,245,280,300,'books','Rayonnage'),
        item('bibliotheque_publique','rayonnage_livres',845,245,280,300,'books','Rayonnage'),
        item('bibliotheque_publique','table_lecture',390,365,420,190,'books','Table de lecture'),
        item('bibliotheque_publique','presentoir_archives',450,150,300,155,'archive','Archives',false),
        plant(65,505),plant(1035,505)
      ]
    },
    restaurant:{
      label:'Restaurant',wall:'#f3e6d8',floor:'#c49a6b',accent:'#126f73',
      items:[
        item('restaurant_cafe','comptoir_restaurant',335,95,530,170,'meal','Comptoir'),
        item('restaurant_cafe','cuisine_professionnelle',65,260,300,245,'meal','Cuisine professionnelle'),
        item('restaurant_cafe','presentoir_desserts',825,275,290,210,'meal','Desserts'),
        item('restaurant_cafe','table_restaurant',410,400,270,170,'meal','Table'),
        item('restaurant_cafe','chaise_restaurant',350,485,135,155,'rest','Chaise'),
        item('restaurant_cafe','chaise_restaurant',705,485,135,155,'rest','Chaise'),
        plant(65,505),plant(1035,505)
      ]
    },
    archive:{
      label:'Archives',wall:'#e9e0d5',floor:'#aa8a68',accent:'#647b80',
      items:[
        item('bureau_guilde','classeur_archives',80,180,245,305,'archive','Classeurs'),
        item('bibliotheque_publique','presentoir_archives',410,135,380,210,'archive','Présentoir d’archives'),
        item('bibliotheque_publique','rayonnage_livres',840,180,270,300,'books','Archives reliées'),
        item('bureau_guilde','bureau_direction',375,410,450,190,'desk','Bureau des archives'),
        plant(65,505),plant(1035,505)
      ]
    },
    clinic:{
      label:'Cabinet de soins',wall:'#e8f1ef',floor:'#c4d8d5',accent:'#2a989d',
      items:[
        item('centre_soins','machine_soin',440,110,320,250,'heal','Unité de soins'),
        item('centre_soins','pc_public',120,310,190,185,'medical_info','Dossier médical'),
        item('centre_soins','canape_attente',775,330,300,165,'rest','Canapé'),
        item('centre_soins','carte_murale',420,105,360,130,'map','Carte médicale',false),
        plant(65,505),plant(1035,505)
      ]
    },
    studio:{
      label:'Studio',wall:'#e7e3e4',floor:'#9f9389',accent:'#5b7e86',
      items:[
        item('maison','console_salon',385,125,430,195,'studio','Console de travail'),
        item('bureau_guilde','table_reunion',380,395,440,170,'meeting','Table de création'),
        item('ecole','tableau_cours',430,105,340,135,'research','Tableau de projets',false),
        item('residence','canape_modulaire',80,410,300,150,'rest','Canapé'),
        plant(65,505),plant(1035,505)
      ]
    },
    storage:{
      label:'Réserve',wall:'#e1d7c9',floor:'#a98a67',accent:'#6d7d78',
      items:[
        item('boutique','cartons_decor',90,180,300,235,'storage','Colis'),
        item('boutique','etagere_produits',820,180,280,300,'storage','Étagères'),
        item('residence','armoire',470,150,260,310,'storage','Armoire de réserve'),
        plant(65,505),plant(1035,505)
      ]
    },
    citadel:{
      label:'Citadelle',wall:'#dfe4e2',floor:'#5d6970',accent:'#0c8a91',
      items:[
        item('citadelle','trone_citadelle',420,90,360,250,'citadel','Trône'),
        item('citadelle','autel_coeur',440,335,320,235,'citadel','Autel du Cœur'),
        item('citadelle','brasero_sacre',90,315,230,210,'citadel','Brasero sacré'),
        item('citadelle','pilier_eclat',885,285,210,250,'citadel','Pilier d’Éclat'),
        item('citadelle','table_strategique',380,500,440,170,'map','Table stratégique'),
        plant(65,505),plant(1035,505)
      ]
    }
  };

  const KIND_TEMPLATE={
    home:'house',lab:'lab',healer:'healer',clinic:'healer',shop:'shop',station:'station',
    museum:'museum',school:'school',arena:'guardian',guardian:'guardian',inn:'hotel_lobby',hotel:'hotel_lobby',
    apartments:'apartment',apartment:'apartment',urban:'apartment',office:'office',library:'library',
    cafe:'restaurant',restaurant:'restaurant',brasserie:'restaurant',citadel:'citadel'
  };

  function imageFor(src){
    if(!IMG_CACHE.has(src)){
      const img=new Image(); img.decoding='async'; img.src=src; IMG_CACHE.set(src,img);
    }
    return IMG_CACHE.get(src);
  }
  function sourceBuilding(){
    if(typeof building==='undefined'||!building)return null;
    try{
      if(building.type==='v70building'&&typeof V70_INT!=='undefined'&&V70_INT?.building)return V70_INT.building;
      if(building.type==='hotel66'&&typeof hotelBuildingV66!=='undefined'&&hotelBuildingV66)return hotelBuildingV66;
      if(building.type==='megabuilding66'&&typeof megaBuildingV66!=='undefined'&&megaBuildingV66)return megaBuildingV66;
    }catch(_){ }
    return building;
  }
  function kindOf(b){
    const raw=String(b?.urbanType||b?.type||'home').toLowerCase();
    const label=String(b?.label||'').toLowerCase();
    if(label.includes('citadelle'))return 'citadel';
    if(label.includes('hôtel')||label.includes('hotel'))return 'hotel';
    if(label.includes('restaurant')||label.includes('café'))return 'restaurant';
    if(label.includes('biblioth'))return 'library';
    if(label.includes('gardien'))return 'guardian';
    return raw;
  }
  function supported(){
    if(typeof scene==='undefined'||scene!=='interior'||typeof building==='undefined'||!building||building.type==='playerhome')return false;
    const k=kindOf(sourceBuilding());
    return !!KIND_TEMPLATE[k]||['v70building','hotel66','megabuilding66','mFrenchBlock'].includes(building.type);
  }
  function buildingKey(b){
    return [state.zone,b?.id||'',b?.urbanType||b?.type||'',Math.round(b?.x||0),Math.round(b?.y||0)].join('|');
  }
  function multiInfo(b){
    const k=kindOf(b),shell=building?.type||'';
    const shellMulti=['v70building','hotel66','megabuilding66','mFrenchBlock'].includes(shell);
    const explicit=['hotel','inn','apartments','apartment','office','urban'].includes(k);
    const multi=shellMulti||explicit;
    const large=/grand|tour|mega/i.test(String(b?.label||''))||Number(b?.floors||0)>=6||shell==='megabuilding66';
    const floors=multi?Math.max(2,Math.min(8,Number(b?.floors)||((k==='hotel'||k==='inn')?3:(large?7:4)))):1;
    const rooms=multi?(large?4:3):1;
    return {multi,large,floors,rooms};
  }
  function ensureInterior(){
    if(!supported()){INT=null;return false}
    const src=sourceBuilding(),key=buildingKey(src);
    if(INT?.key===key)return true;
    const mi=multiInfo(src),kind=kindOf(src);
    INT={
      key,src,kind,label:src?.label||humanize(kind),returnZone:state.zone,
      multi:mi.multi,large:mi.large,floors:mi.floors,rooms:mi.rooms,
      floor:0,mode:mi.multi?'corridor':'room',roomIndex:0,roomTemplate:KIND_TEMPLATE[kind]||'apartment',
      cooldown:performance.now()+500,npcs:{},lastNpcUpdate:performance.now()
    };
    state.roomX=600;state.roomY=mi.multi?650:650;
    syncLegacy();
    toast((INT.label||'Bâtiment')+(mi.multi?' — rez-de-chaussée':''));
    return true
  }
  function syncLegacy(){
    try{
      if(building?.type==='v70building'&&typeof V70_INT!=='undefined'&&V70_INT){
        V70_INT.floor=INT.floor;V70_INT.mode=INT.mode==='room'?'room':'corridor';V70_INT.room=INT.roomIndex;
      }
    }catch(_){ }
  }
  function primaryTemplate(){return KIND_TEMPLATE[INT.kind]||'apartment'}
  function roomTemplate(floor,index){
    if(INT.kind==='hotel'||INT.kind==='inn')return floor===0&&index===0?'hotel_lobby':'hotel_room';
    if(floor===0&&index===0)return primaryTemplate();
    if(INT.kind==='apartments'||INT.kind==='apartment'||INT.kind==='urban')return ['apartment','apartment','studio','storage'][index%4];
    if(INT.kind==='office')return ['office','office','archive','studio'][index%4];
    const extras=['apartment','office','library','clinic','studio','storage'];
    return extras[(floor*3+index+(INT.large?1:0))%extras.length]
  }
  function activeTemplate(){
    return TEMPLATES[INT.multi?roomTemplate(INT.floor,INT.roomIndex):INT.roomTemplate]||TEMPLATES.house;
  }
  function roomLabel(floor,index){
    const tpl=TEMPLATES[roomTemplate(floor,index)]||TEMPLATES.apartment;
    if(INT.kind==='hotel'||INT.kind==='inn')return floor===0&&index===0?'Réception':`Chambre ${floor*INT.rooms+index+1}`;
    return tpl.label;
  }

  function rectPath(x,y,w,h,r=12){
    ctx.beginPath();ctx.roundRect(x*SX,y*SY,w*SX,h*SY,r*SX);
  }
  function drawBackdrop(tpl){
    ctx.fillStyle='#142c3b';ctx.fillRect(0,0,960,640);
    ctx.fillStyle=tpl.wall;rectPath(45,55,1110,700,18);ctx.fill();
    ctx.fillStyle=tpl.floor;ctx.fillRect(60*SX,155*SY,1080*SX,600*SY);
    ctx.strokeStyle='rgba(66,48,35,.14)';ctx.lineWidth=1;
    for(let y=175;y<750;y+=38){ctx.beginPath();ctx.moveTo(60*SX,y*SY);ctx.lineTo(1140*SX,y*SY);ctx.stroke()}
    ctx.fillStyle=tpl.accent||'#3b8588';ctx.fillRect(60*SX,145*SY,1080*SX,12*SY);
  }
  function drawAsset(m){
    const img=imageFor(m.src),x=m.x*SX,y=m.y*SY,w=m.w*SX,h=m.h*SY;
    if(img.complete&&img.naturalWidth){ctx.drawImage(img,x,y,w,h);return}
    ctx.fillStyle='rgba(23,63,69,.14)';ctx.beginPath();ctx.roundRect(x,y,w,h,10);ctx.fill();
  }
  function drawPassage(r,label){
    ctx.save();
    const x=r.x*SX,y=r.y*SY,w=r.w*SX,h=r.h*SY;
    ctx.fillStyle='rgba(23,83,86,.88)';ctx.beginPath();ctx.roundRect(x,y,w,h,9);ctx.fill();
    ctx.strokeStyle='#e4c768';ctx.lineWidth=3;ctx.stroke();
    ctx.fillStyle='#fff';ctx.font='800 11px Segoe UI';ctx.textAlign='center';ctx.fillText(label,x+w/2,y+h/2+4);
    ctx.restore();
  }
  function roomExitRect(){return {x:515,y:700,w:170,h:55}}
  function corridorExitRect(){return {x:515,y:710,w:170,h:48}}
  function corridorDoors(){
    const out=[];
    for(let i=0;i<INT.rooms;i++){
      const left=i%2===0,x=left?78:1002,y=205+Math.floor(i/2)*190;
      out.push({x,y,w:120,h:62,index:i});
    }
    return out
  }
  function drawHeader(title){
    ctx.fillStyle='#17364a';ctx.fillRect(0,0,960,43);
    ctx.fillStyle='#fff';ctx.font='800 15px Segoe UI';ctx.textAlign='left';ctx.fillText(title,16,27);ctx.textAlign='start';
  }
  function floorLabel(){return INT.floor===0?'Rez-de-chaussée':`Étage ${INT.floor}`}

  function standardNpcs(){
    if(INT.multi)return [];
    try{
      const positions={home:[600,350],lab:[600,325],healer:[600,345],shop:[600,340],station:[600,340],museum:[600,445],school:[600,585],arena:[600,585]};
      const pos=positions[building?.type];
      return (currentRoom()?.npcs||[]).map((n,i)=>({...n,x:pos&&i===0?pos[0]:n.x,y:pos&&i===0?pos[1]:n.y,custom:false}))
    }catch(_){return []}
  }
  function customNpcKey(){return `${INT.floor}:${INT.roomIndex}:${roomTemplate(INT.floor,INT.roomIndex)}`}
  function customNpcs(){
    if(!INT.multi||INT.mode!=='room')return [];
    const key=customNpcKey();
    if(!INT.npcs[key]){
      const tpl=roomTemplate(INT.floor,INT.roomIndex);
      const names={hotel_lobby:'Réceptionniste',hotel_room:'Voyageuse',apartment:'Résident',office:'Employée',library:'Bibliothécaire',restaurant:'Serveuse',clinic:'Soigneur',studio:'Artiste',storage:'Magasinier',archive:'Archiviste',guardian:'Gardien',museum:'Conservatrice',school:'Professeure'};
      const count=['hotel_lobby','restaurant','office','library'].includes(tpl)?2:1;
      INT.npcs[key]=Array.from({length:count},(_,i)=>({
        id:`v105w_${key}_${i}`,name:i?`${names[tpl]||'Habitant'} ${i+1}`:(names[tpl]||'Habitant'),look:(INT.floor*7+INT.roomIndex*3+i+6)%41,
        x:350+i*420,y:430-i*90,axis:(INT.floor+INT.roomIndex+i)%2?'y':'x',dir:2,moving:true,min:260,max:930,speed:26+i*4
      }));
    }
    return INT.npcs[key]
  }
  function updateCustomNpcs(list){
    const now=performance.now(),dt=Math.min(.05,(now-INT.lastNpcUpdate)/1000);INT.lastNpcUpdate=now;
    for(const n of list){
      if(n.axis==='x'){
        n.x+=(n.dir===2?1:-1)*n.speed*dt;
        if(n.x>n.max){n.x=n.max;n.dir=1}else if(n.x<n.min){n.x=n.min;n.dir=2}
      }else{
        n.y+=(n.dir===0?1:-1)*n.speed*dt;
        if(n.y>610){n.y=610;n.dir=3}else if(n.y<250){n.y=250;n.dir=0}
      }
    }
  }
  function drawRoom(){
    const tpl=activeTemplate();drawBackdrop(tpl);
    const npcs=INT.multi?customNpcs():standardNpcs();if(INT.multi)updateCustomNpcs(npcs);
    const layers=[];
    for(const m of tpl.items)layers.push({depth:m.y+m.h,draw:()=>drawAsset(m)});
    for(const n of npcs)layers.push({depth:n.y,draw:()=>drawNpc(n.look,n.x*SX,n.y*SY,n.dir||0,n.moving!==false)});
    layers.push({depth:state.roomY,draw:()=>drawHero(state.roomX*SX,state.roomY*SY,state.dir,Date.now()-lastMove<190)});
    layers.sort((a,b)=>a.depth-b.depth).forEach(o=>o.draw());
    drawPassage(roomExitRect(),INT.multi?'RETOUR AU COULOIR':'SORTIE');
    if(INT.multi&&building?.type==='v70building'){
      try{if(typeof drawDiscoveryV70==='function')drawDiscoveryV70()}catch(_){ }
    }
    const title=INT.multi?`${activeTemplate().label} — ${floorLabel()}`:activeTemplate().label;
    drawHeader(title);
  }
  function drawCorridor(){
    const tpl=INT.kind==='hotel'||INT.kind==='inn'?TEMPLATES.hotel_lobby:TEMPLATES.office;
    ctx.fillStyle='#142c3b';ctx.fillRect(0,0,960,640);
    ctx.fillStyle=tpl.wall;rectPath(45,55,1110,700,18);ctx.fill();
    ctx.fillStyle='#c7b6a2';rectPath(300,75,600,660,18);ctx.fill();
    ctx.strokeStyle='rgba(255,255,255,.2)';for(let y=110;y<720;y+=55){ctx.beginPath();ctx.moveTo(320*SX,y*SY);ctx.lineTo(880*SX,y*SY);ctx.stroke()}

    const elevator={src:STRUCT('ascenseur'),x:475,y:82,w:250,h:245};drawAsset(elevator);
    ctx.fillStyle='#17364a';ctx.font='900 12px Segoe UI';ctx.textAlign='center';ctx.fillText('ASCENSEUR',600*SX,76*SY);

    for(const d of corridorDoors())drawPassage(d,roomLabel(INT.floor,d.index));
    if(INT.floor===0)drawPassage(corridorExitRect(),'SORTIE');

    if(INT.floor===0&&(INT.kind==='hotel'||INT.kind==='inn')){
      drawAsset(item('hotel','reception_hotel',315,430,340,145,'hotel','Réception'));
      drawAsset(plant(245,500,85,105));drawAsset(plant(870,500,85,105));
    }else{
      drawAsset(item('residence','canape_modulaire',430,500,340,140,'rest','Banquette'));
      drawAsset(plant(245,500,85,105));drawAsset(plant(870,500,85,105));
    }
    drawHero(state.roomX*SX,state.roomY*SY,state.dir,Date.now()-lastMove<190);
    drawHeader(`${INT.label} — ${floorLabel()}`);ctx.textAlign='start';
  }
  function draw(){if(!ensureInterior())return BASE_DRAW();INT.mode==='corridor'?drawCorridor():drawRoom()}

  function inside(px,py,r){return px>=r.x&&px<=r.x+r.w&&py>=r.y&&py<=r.y+r.h}
  function collisionRect(m){
    const pad=12,top=m.y+Math.min(m.h*.36,55);
    return {x:m.x+pad,y:top,w:Math.max(20,m.w-pad*2),h:Math.max(24,m.y+m.h-top-5)};
  }
  function blocked(x,y){
    if(x<55||x>1145||y<70||y>755)return true;
    if(INT.mode==='room'){
      for(const m of activeTemplate().items){if(m.solid&&inside(x,y,collisionRect(m)))return true}
      const list=INT.multi?customNpcs():standardNpcs();
      for(const n of list)if(Math.hypot(x-n.x,y-n.y)<38)return true;
    }else{
      const elev={x:475,y:82,w:250,h:245};if(inside(x,y,{x:elev.x+30,y:elev.y+70,w:elev.w-60,h:elev.h-70}))return true;
      if(INT.floor===0&&(INT.kind==='hotel'||INT.kind==='inn')){
        if(inside(x,y,{x:330,y:475,w:310,h:90}))return true;
      }else if(inside(x,y,{x:455,y:545,w:290,h:90}))return true;
    }
    return false
  }
  function leaveBuilding(){
    const b=INT.src,zone=INT.returnZone;scene='world';state.zone=zone;
    if(b){state.x=Number(b.doorX??b.x+(b.w||0)/2)||state.x;state.y=(Number(b.doorY??b.y+(b.h||0))||state.y)+72}
    INT=null;building=null;toast(currentScene().name);
  }
  function enterRoom(index){
    INT.mode='room';INT.roomIndex=index;state.roomX=600;state.roomY=650;INT.cooldown=performance.now()+500;syncLegacy();toast(roomLabel(INT.floor,index));
  }
  function leaveRoom(){INT.mode='corridor';state.roomX=600;state.roomY=650;INT.cooldown=performance.now()+500;syncLegacy();toast(floorLabel())}
  function checkPassages(){
    if(performance.now()<INT.cooldown)return;
    if(INT.mode==='room'&&inside(state.roomX,state.roomY,roomExitRect())){INT.multi?leaveRoom():leaveBuilding();return}
    if(INT.mode==='corridor'){
      for(const d of corridorDoors())if(inside(state.roomX,state.roomY,d)){enterRoom(d.index);return}
      if(INT.floor===0&&inside(state.roomX,state.roomY,corridorExitRect()))leaveBuilding();
    }
  }
  function move(dx,dy,dir){
    if(!ensureInterior())return BASE_MOVE(dx,dy,dir);
    state.dir=dir;
    if(typeof healingSeq!=='undefined'&&healingSeq){toast('Soin en cours — attends la fin du traitement.');return}
    const nx=Math.max(45,Math.min(1155,state.roomX+dx)),ny=Math.max(55,Math.min(765,state.roomY+dy));
    if(!blocked(nx,ny)){state.roomX=nx;state.roomY=ny}
    lastMove=Date.now();checkPassages();
  }

  function distanceToRect(x,y,r){
    const dx=Math.max(r.x-x,0,x-(r.x+r.w)),dy=Math.max(r.y-y,0,y-(r.y+r.h));return Math.hypot(dx,dy);
  }
  function targetItem(){
    const reach=76,p=state.dir===0?{x:state.roomX,y:state.roomY+reach}:state.dir===1?{x:state.roomX-reach,y:state.roomY}:state.dir===2?{x:state.roomX+reach,y:state.roomY}:{x:state.roomX,y:state.roomY-reach};
    let best=null,bd=Infinity;
    for(const m of activeTemplate().items){const d=distanceToRect(p.x,p.y,{x:m.x,y:m.y,w:m.w,h:m.h});if(d<bd){bd=d;best=m}}
    if(best&&bd<65)return best;
    return null
  }
  function targetNpc(){
    const list=INT.multi?customNpcs():standardNpcs();let best=null,bd=Infinity;
    for(const n of list){const d=Math.hypot(state.roomX-n.x,state.roomY-n.y);if(d<bd){bd=d;best=n}}
    return best&&bd<78?best:null
  }
  function rest(message){
    state.team?.forEach(m=>{try{m.hp=maxHP(m);m.status=null}catch(_){ }});save(false);dialog(`<b>Repos</b><br>${message}<br>Ton équipe est de nouveau en pleine forme.`)
  }
  function describe(m){
    const texts={
      decor:'Cet élément apporte une touche vivante et chaleureuse à la pièce.',rest:'Un endroit confortable pour souffler un moment.',tv:'La chaîne locale diffuse les nouvelles de Valdora.',
      books:'Les rayonnages contiennent des récits, des guides et des archives de Valdora.',meal:'Tout est prêt pour accueillir les visiteurs et préparer un bon repas.',
      desk:'Les documents sont rangés avec soin.',archive:'Des dossiers classés retracent la vie du bâtiment.',storage:'Tout le matériel utile est rangé ici.',
      wardrobe:'L’armoire est propre et bien organisée.',meeting:'Cette table sert aux réunions et aux projets collectifs.',missions:'Plusieurs avis et missions locales sont affichés.',
      museum:'La fiche présente l’origine et l’histoire de cette pièce de collection.',school:'Le matériel de cours est prêt pour la prochaine leçon.',
      guardian:'L’objet porte l’emblème du Gardien de la ville.',hotel:'Le personnel veille à l’accueil et au confort des voyageurs.',studio:'Le matériel est installé pour travailler et créer.',
      medical_info:'La borne permet de consulter des conseils de soins.',research:'Des notes et des schémas de recherche couvrent le tableau.',egg:'Les capteurs de l’incubateur indiquent une activité stable.',
      citadel:'Une énergie ancienne semble vibrer autour de cet objet.',map:'La carte montre les principales régions et routes de Valdora.'
    };
    dialog(`<b>${m.label}</b><br>${texts[m.action]||'Cet objet fait partie de l’aménagement du bâtiment.'}`)
  }
  function useItem(m){
    switch(m.action){
      case 'heal':
        if(typeof startHealingSequence==='function')startHealingSequence();else rest('Les machines terminent le soin.');break;
      case 'shop': if(typeof openShop==='function')openShop();else describe(m);break;
      case 'station': dialog('<b>Gare</b><br>Choisis ta destination.',()=>typeof v62StationMasterDialog==='function'&&v62StationMasterDialog());break;
      case 'board': if(typeof stationBoard==='function')stationBoard();else describe(m);break;
      case 'vending': if(typeof vending==='function')vending();else describe(m);break;
      case 'starters': if(!state.team?.length&&typeof showStarters==='function')showStarters();else describe(m);break;
      case 'computer': if(typeof superComputer==='function')superComputer();else describe(m);break;
      case 'bed': rest(INT.kind==='hotel'||INT.kind==='inn'?'Tu passes une nuit paisible dans cette chambre.':'Tu prends le temps de te reposer.');break;
      default: describe(m)
    }
  }
  function interactNpc(n){
    if(!n)return false;
    if(!INT.multi){
      if(building.type==='lab'&&n.id==='prof'){
        if(!state.team.length)dialog('<b>Professeur Aurine</b><br>Choisis ton premier compagnon.',()=>showStarters());else dialog('<b>Professeur Aurine</b><br>Continue ton enquête sur Valdora.');return true
      }
      if(building.type==='healer'&&n.id==='healer'){if(typeof startHealingSequence==='function')startHealingSequence();return true}
      if(building.type==='shop'&&n.id==='seller'){dialog('<b>Marchand</b><br>Bienvenue !',()=>openShop());return true}
      if(building.type==='station'&&n.id==='agent'){dialog('<b>Chef de gare</b><br>Où souhaitez-vous aller ?',()=>v62StationMasterDialog());return true}
      if(building.type==='arena'&&n.id==='guard'){arenaChallenge(+state.zone.replace('town',''));return true}
      if(building.type==='home'){dialog(`<b>${n.name}</b><br>${typeof houseResidentDialogue==='function'?houseResidentDialogue(n):'Bienvenue dans notre maison.'}`);return true}
    }
    const tpl=INT.multi?roomTemplate(INT.floor,INT.roomIndex):INT.roomTemplate;
    if(tpl==='hotel_lobby'){dialog(`<b>${n.name}</b><br>Bienvenue ! Les chambres sont accessibles par les passages du couloir, et l’ascenseur dessert tous les étages.`);return true}
    dialog(`<b>${n.name}</b><br>Bienvenue. Cette pièce a été aménagée pour sa fonction et reste ouverte aux habitants et aux visiteurs.`);return true
  }
  function nearElevator(){return INT.mode==='corridor'&&distanceToRect(state.roomX,state.roomY,{x:475,y:82,w:250,h:245})<95}
  function openElevator(){
    let h='<div class="quest"><b>Ascenseur</b><br>Choisis un étage.</div><div class="baggrid">';
    for(let f=0;f<INT.floors;f++)h+=`<button class="bagitem" onclick="v105wGoFloor(${f})"><b>${f===0?'Rez-de-chaussée':'Étage '+f}</b></button>`;
    h+='</div>';openSimpleMenu('Ascenseur',h)
  }
  window.v105wGoFloor=f=>{
    if(!INT)return;INT.floor=Math.max(0,Math.min(INT.floors-1,Number(f)||0));INT.mode='corridor';INT.roomIndex=0;state.roomX=600;state.roomY=390;INT.cooldown=performance.now()+600;syncLegacy();
    const ov=document.getElementById('menuov');if(ov)ov.style.display='none';toast(floorLabel())
  };
  function interact(){
    if(!ensureInterior())return BASE_INTERACT();
    if(closeDialog())return;
    if(INT.mode==='corridor'){
      if(nearElevator()){openElevator();return}
      toast('Marche sur un passage pour entrer dans une pièce, ou approche-toi de l’ascenseur.');return
    }
    const m=targetItem();if(m){useItem(m);return}
    const n=targetNpc();if(n){interactNpc(n);return}
    if(INT.multi&&building?.type==='v70building'){
      try{BASE_INTERACT();return}catch(_){ }
    }
    toast('Approche-toi d’un meuble ou d’un personnage pour interagir.');
  }

  window.drawInterior=draw;
  window.moveInterior=move;
  window.interactInterior=interact;
  window.ValdoraInterieursV105W={version:VERSION,templates:TEMPLATES,state:()=>INT,goFloor:window.v105wGoFloor};

  function brand(){
    document.title='Éclats Sauvages — Valdora V105W';
    const b=document.querySelector('.brand b');if(b)b.textContent=`VALDORA V105W — ${String(b.textContent).includes('CRÉATEUR')?'CRÉATEUR':'JOUEUR'}`;
  }
  window.addEventListener('DOMContentLoaded',()=>{
    for(const t of Object.values(TEMPLATES))for(const m of t.items)imageFor(m.src);imageFor(STRUCT('ascenseur'));brand();
    console.log('V105W : intérieurs intégrés — mobilier fonctionnel, passages et ascenseurs.');
  });
  brand();setTimeout(brand,1200);
})();
