// ============================================================================
// VALDORA V105Y — IMPLANTATION MOBILIER V105X ET CITADELLE DU CŒUR
// ============================================================================
(()=>{
  'use strict';

  const VERSION='V105Y';
  const REF=window.VALDORA_MOBILIER_REFERENCE_V105X;
  if(!REF?.buildings){
    console.error('V105Y : référence mobilier V105X introuvable.');
    return;
  }

  const BASE_DRAW=window.drawInterior;
  const BASE_MOVE=window.moveInterior;
  const BASE_INTERACT=window.interactInterior;
  const BASE_ENTER_ZONE=window.enterZone;
  const IMG_CACHE=new Map();
  const PASSAGE_ID='passage_sol';
  const PRIMARY_ROOM='principal';
  const HERO_BASE_SCALE=.8;
  let INT=null;

  const TYPE_MAP={
    home:'maison',house:'maison',lab:'laboratoire',laboratory:'laboratoire',
    healer:'centre_soins',clinic:'centre_soins',shop:'boutique',station:'gare',
    museum:'musee',restaurant:'restaurant_cafe',cafe:'restaurant_cafe',brasserie:'restaurant_cafe',
    inn:'hotel',hotel:'hotel',apartments:'residence',apartment:'residence',residence:'residence',
    arena:'gardien',guardian:'gardien',citadel:'citadelle'
  };

  const PALETTES={
    maison:{wall:'#f3e8d8',floor:'#c79562',trim:'#76aeb0'},
    centre_soins:{wall:'#e8f5f3',floor:'#c5dedb',trim:'#31aeb2'},
    boutique:{wall:'#f3ead9',floor:'#d4b17c',trim:'#16898e'},
    hotel:{wall:'#f4eadb',floor:'#bd9364',trim:'#0b797d'},
    gare:{wall:'#e5eef0',floor:'#b9c9ca',trim:'#147f89'},
    laboratoire:{wall:'#edf2f4',floor:'#b8cdd1',trim:'#26a8bd'},
    musee:{wall:'#f0e7d7',floor:'#c7aa81',trim:'#9b7344'},
    restaurant_cafe:{wall:'#f3e6d8',floor:'#c49a6b',trim:'#126f73'},
    residence:{wall:'#f0e6da',floor:'#c69b6d',trim:'#62a0a3'},
    gardien:{wall:'#e7e0d4',floor:'#88765e',trim:'#0d7c83'},
    citadelle:{wall:'#dfe4e2',floor:'#53626b',trim:'#13a4aa'}
  };

  function asset(category,id,view='front'){
    return `assets/mobilier/${category}/${id}/${view}.png`;
  }
  function guardianItem(id,label,x,y,w,h,fonction='decor',category='gardien'){
    const instanceId=`v105y_gardien_${id}_${x}_${y}`;
    return {
      instanceId,id,label,x,y,w,h,view:'front',rotation:0,flipX:false,flipY:false,z:y,
      bloquant:true,interactif:fonction!=='decor',fonction,
      description:`${label} du bâtiment du Gardien.`,categoryId:category,
      asset:asset(category,id),assets:{front:asset(category,id),left:asset(category,id,'left'),back:asset(category,id,'back')},
      collision:{x,y,w,h}
    };
  }

  function installGuardianLayout(){
    const b=REF.buildings.gardien;
    const room=b?.floors?.rdc?.rooms?.principal;
    if(!room||room.furniture?.length)return;
    room.width=1200;room.height=800;
    room.furniture=[
      guardianItem('pupitre_gardien','Pupitre du Gardien',420,70,360,170,'dialogue_gardien'),
      guardianItem('autel_sceau','Autel du Sceau',470,285,260,210,'dialogue_gardien'),
      guardianItem('banniere_gardien','Bannière du Gardien',75,95,155,235,'dialogue_gardien'),
      guardianItem('banniere_gardien','Bannière du Gardien',970,95,155,235,'dialogue_gardien'),
      guardianItem('presentoir_trophees','Présentoir des trophées',850,335,255,235,'dialogue_gardien'),
      guardianItem('banc_defi','Banc du défi',145,500,310,145,'s_asseoir'),
      guardianItem('plante_pot','Plante en pot',55,565,100,125,'decor','hotel'),
      guardianItem('plante_pot','Plante en pot',1045,565,100,125,'decor','hotel')
    ];
  }
  installGuardianLayout();

  function imageFor(src){
    if(!src)return null;
    if(!IMG_CACHE.has(src)){
      const img=new Image();img.decoding='async';img.src=src;IMG_CACHE.set(src,img);
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
  function typeFromBuilding(b){
    if(b?.referenceType)return b.referenceType;
    const label=String(b?.label||'').toLowerCase();
    if(label.includes('citadelle'))return 'citadelle';
    if(label.includes('gardien'))return 'gardien';
    if(label.includes('hôtel')||label.includes('hotel'))return 'hotel';
    if(label.includes('restaurant')||label.includes('café'))return 'restaurant_cafe';
    if(label.includes('musée'))return 'musee';
    if(label.includes('gare'))return 'gare';
    if(label.includes('laboratoire'))return 'laboratoire';
    if(label.includes('soins'))return 'centre_soins';
    if(label.includes('boutique'))return 'boutique';
    const raw=String(b?.urbanType||b?.type||'').toLowerCase();
    return TYPE_MAP[raw]||raw;
  }
  function firstRoom(buildingRef){
    const floors=buildingRef?.floors||{};
    const floorId=Object.keys(floors)[0]||'rdc';
    const rooms=floors[floorId]?.rooms||{};
    const roomId=rooms[PRIMARY_ROOM]?PRIMARY_ROOM:(Object.keys(rooms)[0]||PRIMARY_ROOM);
    return {floorId,roomId};
  }
  function hasFurniture(type){
    const b=REF.buildings[type];if(!b)return false;
    return Object.values(b.floors||{}).some(f=>Object.values(f.rooms||{}).some(r=>(r.furniture||[]).length));
  }
  function supported(){
    if(typeof scene==='undefined'||scene!=='interior'||typeof building==='undefined'||!building||building.type==='playerhome')return false;
    return hasFurniture(typeFromBuilding(sourceBuilding()));
  }
  function buildingKey(src,type){
    if(type==='citadelle')return 'citadelle-du-coeur-v105y';
    return [state.zone,src?.id||'',src?.urbanType||src?.type||'',Math.round(src?.x||0),Math.round(src?.y||0)].join('|');
  }
  function ensureInterior(){
    if(!supported()){INT=null;return false}
    const src=sourceBuilding(),type=typeFromBuilding(src),key=buildingKey(src,type);
    if(INT?.key===key)return true;
    const ref=REF.buildings[type],start=firstRoom(ref);
    INT={
      key,src,type,ref,returnZone:type==='citadelle'?'town13':state.zone,
      floorId:start.floorId,roomId:start.roomId,landingByPassage:new Map(),
      passageArmed:false,passageCooldown:performance.now()+480,pose:null,lastBlockedToast:0
    };
    const room=currentRefRoom();
    state.roomX=room.width/2;state.roomY=Math.max(70,room.height-90);state.dir=3;
    safeToast(type==='citadelle'?'Citadelle du Cœur — Salle 1':(src?.label||ref?.name||'Intérieur'));
    return true;
  }
  function currentRefFloor(){return INT?.ref?.floors?.[INT.floorId]||null}
  function currentRefRoom(){return currentRefFloor()?.rooms?.[INT.roomId]||{width:1200,height:800,furniture:[]}}
  function allRoomItems(room=currentRefRoom()){return [...(room.furniture||[])]}
  function roomPassages(room=currentRefRoom()){return allRoomItems(room).filter(m=>m.id===PASSAGE_ID||m.fonction==='passage_piece_sol')}
  function roomFurniture(room=currentRefRoom()){return allRoomItems(room).filter(m=>m.id!==PASSAGE_ID&&m.fonction!=='passage_piece_sol')}
  function roomBy(floorId,roomId){return INT?.ref?.floors?.[floorId]?.rooms?.[roomId]||null}
  function safeToast(msg){try{toast(msg)}catch(_){ }}
  function safeDialog(html,cb){try{dialog(html,cb)}catch(_){safeToast(String(html).replace(/<[^>]+>/g,' '))}}
  function call(name,...args){const fn=window[name];if(typeof fn==='function')return fn(...args)}

  function view(){
    const room=currentRefRoom(),w=Math.max(300,Number(room.width)||1200),h=Math.max(260,Number(room.height)||800);
    const top=53,availableH=575,padX=24;
    const scale=Math.min((960-padX*2)/w,(availableH-12)/h);
    return {w,h,scale,ox:(960-w*scale)/2,oy:top+(availableH-h*scale)/2};
  }
  function palette(){return PALETTES[INT.type]||PALETTES.maison}
  function roundRect(x,y,w,h,r=12){ctx.beginPath();ctx.roundRect(x,y,w,h,Math.min(r,w/2,h/2))}
  function drawBackdrop(v){
    const p=palette();ctx.fillStyle='#142c3b';ctx.fillRect(0,0,960,640);
    ctx.save();ctx.translate(v.ox,v.oy);
    ctx.fillStyle=p.wall;roundRect(0,0,v.w*v.scale,v.h*v.scale,18);ctx.fill();
    ctx.fillStyle=p.floor;ctx.fillRect(10*v.scale,82*v.scale,(v.w-20)*v.scale,(v.h-92)*v.scale);
    ctx.fillStyle=p.trim;ctx.fillRect(10*v.scale,74*v.scale,(v.w-20)*v.scale,10*v.scale);
    ctx.strokeStyle='rgba(57,42,31,.12)';ctx.lineWidth=1;
    for(let y=105;y<v.h-10;y+=40){ctx.beginPath();ctx.moveTo(10*v.scale,y*v.scale);ctx.lineTo((v.w-10)*v.scale,y*v.scale);ctx.stroke()}
    ctx.restore();
  }
  function transformedBounds(m){
    const r=((Number(m.rotation)||0)%360+360)%360;
    if(r===90||r===270){const cx=m.x+m.w/2,cy=m.y+m.h/2;return {x:cx-m.h/2,y:cy-m.w/2,w:m.h,h:m.w}}
    return {x:Number(m.x)||0,y:Number(m.y)||0,w:Number(m.w)||1,h:Number(m.h)||1};
  }
  function drawAsset(m,v){
    const src=m.asset||m.assets?.[m.view||'front']||m.assets?.front;
    const img=imageFor(src),cx=v.ox+(m.x+m.w/2)*v.scale,cy=v.oy+(m.y+m.h/2)*v.scale;
    ctx.save();ctx.translate(cx,cy);ctx.rotate((Number(m.rotation)||0)*Math.PI/180);ctx.scale(m.flipX?-1:1,m.flipY?-1:1);
    ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';
    if(img?.complete&&img.naturalWidth)ctx.drawImage(img,-m.w*v.scale/2,-m.h*v.scale/2,m.w*v.scale,m.h*v.scale);
    else{ctx.fillStyle='rgba(22,68,72,.18)';roundRect(-m.w*v.scale/2,-m.h*v.scale/2,m.w*v.scale,m.h*v.scale,9);ctx.fill()}
    ctx.restore();
    if(m.id==='brasero_sacre')drawBrazierFlame(m,v);
  }
  function drawBrazierFlame(m,v){
    const t=performance.now()/230,flutter=Math.sin(t+(m.x||0)*.031)*2.8;
    const x=v.ox+(m.x+m.w*.5)*v.scale,y=v.oy+(m.y+m.h*.18)*v.scale;
    ctx.save();ctx.globalCompositeOperation='lighter';
    const glow=ctx.createRadialGradient(x,y,1,x,y,30*v.scale);glow.addColorStop(0,'rgba(132,255,255,.72)');glow.addColorStop(.45,'rgba(44,222,236,.30)');glow.addColorStop(1,'rgba(20,181,218,0)');
    ctx.fillStyle=glow;ctx.beginPath();ctx.arc(x,y,30*v.scale,0,Math.PI*2);ctx.fill();
    ctx.translate(x+flutter*v.scale,y);
    ctx.fillStyle='rgba(43,221,239,.92)';ctx.beginPath();ctx.moveTo(0,-24*v.scale);ctx.quadraticCurveTo(18*v.scale,-4*v.scale,7*v.scale,15*v.scale);ctx.quadraticCurveTo(-13*v.scale,19*v.scale,-11*v.scale,1*v.scale);ctx.closePath();ctx.fill();
    ctx.fillStyle='rgba(218,255,231,.90)';ctx.beginPath();ctx.moveTo(0,-12*v.scale);ctx.quadraticCurveTo(9*v.scale,0,3*v.scale,10*v.scale);ctx.quadraticCurveTo(-7*v.scale,8*v.scale,-5*v.scale,0);ctx.closePath();ctx.fill();
    for(let i=0;i<3;i++){const phase=(t*.35+i*.37+(m.y||0)*.01)%1;ctx.fillStyle=`rgba(116,247,255,${1-phase})`;ctx.beginPath();ctx.arc((i-1)*7*v.scale,-(22+phase*28)*v.scale,Math.max(1,2.3*(1-phase))*v.scale,0,Math.PI*2);ctx.fill()}
    ctx.restore();
  }
  function passageLocked(p){
    if((typeof v61CreatorMode==='function'&&v61CreatorMode())||INT.type!=='citadelle')return false;
    const rule={salle_2:{salle_3:'citadelle_coeur_gardien_1'},salle_3:{salle_4:'citadelle_coeur_gardien_2'},salle_4:{salle_5:'citadelle_coeur_gardien_3'}};
    const needed=rule[INT.roomId]?.[p.targetRoom];
    return needed?!state.trainerWins?.[needed]:false;
  }
  function drawPassage(p,v,label='PASSAGE'){
    const locked=passageLocked(p),x=v.ox+p.x*v.scale,y=v.oy+p.y*v.scale,w=p.w*v.scale,h=p.h*v.scale;
    ctx.save();ctx.fillStyle=locked?'rgba(113,42,50,.92)':'rgba(23,103,109,.90)';roundRect(x,y,w,h,7);ctx.fill();
    ctx.strokeStyle=locked?'#ef9b91':'#f0c96b';ctx.lineWidth=Math.max(2,3*v.scale);ctx.stroke();
    if(w>58&&h>18){ctx.fillStyle='#fff';ctx.font=`800 ${Math.max(8,Math.min(11,10*v.scale))}px Segoe UI`;ctx.textAlign='center';ctx.fillText(locked?'VERROUILLÉ':label,x+w/2,y+h/2+4)}
    ctx.restore();
  }
  function exitRect(room=currentRefRoom()){
    const w=Math.min(190,Math.max(120,room.width*.24));
    return {id:'v105y_exit',x:(room.width-w)/2,y:room.height-28,w,h:28};
  }
  function drawHeader(){
    const roomNames={principal:'Salle 1 — Entrée',salle_2:'Salle 2 — Premier Gardien',salle_3:'Salle 3 — Deuxième Gardien',salle_4:'Salle 4 — Troisième Gardien',salle_5:'Salle 5 — Maître du Cœur'};
    const base=INT.type==='citadelle'?(roomNames[INT.roomId]||'Citadelle du Cœur'):(INT.src?.label||INT.ref?.name||'Intérieur');
    ctx.fillStyle='#17364a';ctx.fillRect(0,0,960,43);ctx.fillStyle='#fff';ctx.font='800 15px Segoe UI';ctx.textAlign='left';ctx.fillText(base,16,27);
    if(INT.type==='citadelle'&&INT.roomId!=='principal'){
      const idx=Math.max(1,Number(INT.roomId.replace('salle_',''))-1),id=idx<=3?`citadelle_coeur_gardien_${idx}`:'final_boss';
      ctx.textAlign='right';ctx.fillStyle=state.trainerWins?.[id]?'#83e2a6':'#ffd27a';ctx.fillText(state.trainerWins?.[id]?'VICTOIRE':'DÉFI EN COURS',944,27);
    }
    ctx.textAlign='start';
  }
  function drawHeroScaled(v,rotation=0){
    const x=v.ox+state.roomX*v.scale,y=v.oy+state.roomY*v.scale,scale=v.scale/HERO_BASE_SCALE;
    ctx.save();ctx.translate(x,y);ctx.rotate(rotation);ctx.scale(scale,scale);drawHero(0,0,state.dir,Date.now()-lastMove<190);ctx.restore();
  }
  function drawNpcScaled(n,v){
    const x=v.ox+n.x*v.scale,y=v.oy+n.y*v.scale,scale=v.scale/HERO_BASE_SCALE;
    ctx.save();ctx.translate(x,y);ctx.scale(scale,scale);drawNpc(n.look||0,0,0,n.dir||0,n.moving!==false);ctx.restore();
  }

  function standardNpcs(){
    if(INT.type==='citadelle')return citadelNpcs();
    if(INT.roomId!==PRIMARY_ROOM)return [];
    let list=[];try{list=(currentRoom()?.npcs||[]).map(n=>({...n}))}catch(_){ }
    if(!list.length&&INT.type==='gardien')list=[{id:'guard',name:'Gardien',look:18,x:600,y:570,dir:3,moving:false}];
    if(!list.length)return list;
    const room=currentRefRoom(),targets={
      centre_soins:['comptoir_medical','machine_soin'],boutique:['comptoir_vente','etagere_produits'],laboratoire:['table_starters'],
      gare:['guichet_billets'],gardien:['autel_sceau','pupitre_gardien']
    };
    const ids=targets[INT.type]||[],target=roomFurniture().find(m=>ids.includes(m.id));
    if(target){list[0].x=Math.max(50,Math.min(room.width-50,target.x+target.w/2));list[0].y=Math.max(90,Math.min(room.height-80,target.y+target.h+48));list[0].dir=3;list[0].moving=false}
    return list.map((n,i)=>({...n,x:Number.isFinite(n.x)?n.x:room.width/2+i*70,y:Number.isFinite(n.y)?n.y:room.height*.48}));
  }
  function citadelTrainer(roomId){
    const defs={
      salle_2:{id:'citadelle_coeur_gardien_1',dialog:'Premier Gardien du Cœur',look:18,level:70,templeGuard:true},
      salle_3:{id:'citadelle_coeur_gardien_2',dialog:'Deuxième Gardien du Cœur',look:27,level:72,templeGuard:true},
      salle_4:{id:'citadelle_coeur_gardien_3',dialog:'Troisième Gardien du Cœur',look:34,level:74,templeGuard:true},
      salle_5:{id:'final_boss',dialog:'Maître du Cœur',look:15,level:78,finalBoss:true}
    };
    return defs[roomId]?{...defs[roomId]}:null;
  }
  function citadelNpcs(){
    const t=citadelTrainer(INT.roomId);if(!t)return [];
    const room=currentRefRoom(),anchor=roomFurniture().find(m=>m.id===(INT.roomId==='salle_5'?'trone_citadelle':'pilier_eclat'));
    t.x=anchor?anchor.x+anchor.w/2:room.width/2;t.y=anchor?Math.min(room.height-100,anchor.y+anchor.h+70):room.height*.48;t.dir=3;t.moving=false;t._citadelV105Y=true;
    return [t];
  }
  function drawPose(v){
    if(!INT.pose){drawHeroScaled(v);return}
    const p=INT.pose,item=p.item,b=transformedBounds(item),cx=b.x+b.w/2,cy=b.y+b.h/2;
    state.roomX=cx;state.roomY=cy;
    let rotation=(Number(item.rotation)||0)*Math.PI/180;
    if(p.mode==='bed'&&item.w>item.h)rotation+=Math.PI/2;
    const x=v.ox+cx*v.scale,y=v.oy+cy*v.scale,scale=v.scale/HERO_BASE_SCALE;
    ctx.save();ctx.translate(x,y);ctx.rotate(rotation);if(p.mode==='seat')ctx.scale(scale,scale*.78);else ctx.scale(scale,scale);drawHero(0,0,state.dir,false);ctx.restore();
  }
  function drawStatus(){
    if(INT.pose?.mode!=='bed')return;
    const sec=Math.max(0,Math.ceil((INT.pose.ends-Date.now())/1000));ctx.save();ctx.fillStyle='rgba(15,37,49,.90)';roundRect(350,48,260,40,14);ctx.fill();ctx.fillStyle='#fff';ctx.font='800 14px Segoe UI';ctx.textAlign='center';ctx.fillText(`Repos en cours… ${sec} s`,480,73);ctx.restore();ctx.textAlign='start';
  }
  function draw(){
    if(!ensureInterior())return BASE_DRAW();
    const v=view();drawBackdrop(v);
    for(const p of roomPassages())drawPassage(p,v,'PASSAGE');
    if(INT.roomId===PRIMARY_ROOM)drawPassage(exitRect(),v,'SORTIE');
    const layers=[];
    for(const m of roomFurniture())layers.push({depth:m.y+m.h,z:Number(m.z)||0,draw:()=>drawAsset(m,v)});
    for(const n of standardNpcs())layers.push({depth:n.y,z:100000,draw:()=>drawNpcScaled(n,v)});
    layers.push({depth:INT.pose?.mode==='bed'?999999:state.roomY,z:999999,draw:()=>drawPose(v)});
    layers.sort((a,b)=>a.depth-b.depth||a.z-b.z).forEach(o=>o.draw());
    try{drawHealingOverlay()}catch(_){ }
    drawHeader();drawStatus();
  }

  function inside(x,y,r){return x>=r.x&&x<=r.x+r.w&&y>=r.y&&y<=r.y+r.h}
  function distanceRect(x,y,r){const dx=Math.max(r.x-x,0,x-(r.x+r.w)),dy=Math.max(r.y-y,0,y-(r.y+r.h));return Math.hypot(dx,dy)}
  function collisionRect(m){
    if(!m.bloquant)return null;
    if(m.collision&&Number.isFinite(Number(m.collision.x))){
      const c={x:Number(m.collision.x),y:Number(m.collision.y),w:Number(m.collision.w),h:Number(m.collision.h)};
      if((Number(m.rotation)||0)%180!==0){const cx=c.x+c.w/2,cy=c.y+c.h/2;return {x:cx-c.h/2,y:cy-c.w/2,w:c.h,h:c.w}}
      return c;
    }
    return transformedBounds(m);
  }
  function blocked(x,y){
    const room=currentRefRoom();if(x<18||y<25||x>room.width-18||y>room.height-18)return true;
    for(const m of roomFurniture()){const r=collisionRect(m);if(r&&inside(x,y,r))return true}
    for(const n of standardNpcs())if(Math.hypot(x-n.x,y-n.y)<36)return true;
    return false;
  }
  function safeOutside(p,room){
    const margin=Math.max(42,Math.min(68,Math.min(room.width,room.height)*.09));
    const distances={left:p.x,right:room.width-(p.x+p.w),top:p.y,bottom:room.height-(p.y+p.h)};
    const side=Object.entries(distances).sort((a,b)=>a[1]-b[1])[0][0];
    let x=p.x+p.w/2,y=p.y+p.h/2;
    if(side==='left')x=p.x+p.w+margin;
    else if(side==='right')x=p.x-margin;
    else if(side==='top')y=p.y+p.h+margin;
    else y=p.y-margin;
    x=Math.max(35,Math.min(room.width-35,x));y=Math.max(45,Math.min(room.height-45,y));
    if(!blocked(x,y))return {x,y};
    for(let ring=1;ring<=5;ring++)for(const [dx,dy] of [[ring*35,0],[-ring*35,0],[0,ring*35],[0,-ring*35]]){
      const nx=Math.max(35,Math.min(room.width-35,x+dx)),ny=Math.max(45,Math.min(room.height-45,y+dy));if(!blocked(nx,ny))return {x:nx,y:ny}
    }
    return {x:room.width/2,y:room.height-85};
  }
  function matchingPassage(targetRoom,sourceFloor,sourceRoom){
    return (targetRoom?.furniture||[]).find(m=>(m.id===PASSAGE_ID||m.fonction==='passage_piece_sol')&&m.targetFloor===sourceFloor&&m.targetRoom===sourceRoom)||null;
  }
  function changeRoom(p){
    if(passageLocked(p)){
      const safe=safeOutside(p,currentRefRoom());state.roomX=safe.x;state.roomY=safe.y;INT.passageCooldown=performance.now()+650;
      safeToast('Le passage reste scellé : remporte d’abord le combat de cette salle.');return false;
    }
    const sourceFloor=INT.floorId,sourceRoom=INT.roomId,source=currentRefRoom();
    const targetFloor=p.targetFloor||sourceFloor,targetRoomId=p.targetRoom||PRIMARY_ROOM,target=roomBy(targetFloor,targetRoomId);
    if(!target){safeToast('Cette pièce n’est pas encore disponible.');return false}
    const pair=matchingPassage(target,sourceFloor,sourceRoom);
    if(pair)INT.landingByPassage.set(pair.instanceId,safeOutside(p,source));
    const remembered=INT.landingByPassage.get(p.instanceId);
    INT.floorId=targetFloor;INT.roomId=targetRoomId;
    const arrival=remembered||{x:Number(p.arrivalX),y:Number(p.arrivalY)};
    state.roomX=Number.isFinite(arrival.x)?arrival.x:target.width/2;state.roomY=Number.isFinite(arrival.y)?arrival.y:target.height-85;
    if(blocked(state.roomX,state.roomY)){const s=pair?safeOutside(pair,target):{x:target.width/2,y:target.height-85};state.roomX=s.x;state.roomY=s.y}
    INT.passageArmed=false;INT.passageCooldown=performance.now()+420;state.dir=3;safeToast(target.label||target.name||targetRoomId.replaceAll('_',' '));return true;
  }
  function leaveBuilding(){
    const src=INT.src,type=INT.type,returnZone=INT.returnZone;INT.pose=null;window.joueurBloque=false;INT=null;building=null;scene='world';state.zone=returnZone;
    if(type==='citadelle'){
      const sc=typeof SCENES!=='undefined'?SCENES.town13:null,ex=sc?.exits?.find(e=>e.to==='temple_final');
      if(ex){state.x=ex.side==='east'?ex.x-75:ex.side==='west'?ex.x+ex.w+75:ex.x+ex.w/2;state.y=ex.side==='north'?ex.y+ex.h+75:ex.side==='south'?ex.y-75:ex.y+ex.h/2}
      else{state.x=(sc?.width||1800)-180;state.y=(sc?.height||1100)/2}
    }else if(src){state.x=Number(src.doorX??src.x+(src.w||0)/2)||state.x;state.y=(Number(src.doorY??src.y+(src.h||0))||state.y)+72}
    call('resetFollowerTrail');call('refreshMusicV77');safeToast(call('currentScene')?.name||'Extérieur');
  }
  function checkPassages(){
    const now=performance.now(),passages=roomPassages(),hasExit=INT.roomId===PRIMARY_ROOM,onAny=passages.some(p=>inside(state.roomX,state.roomY,p))||(hasExit&&inside(state.roomX,state.roomY,exitRect()));
    if(!INT.passageArmed){if(!onAny&&now>=INT.passageCooldown)INT.passageArmed=true;return}
    if(now<INT.passageCooldown)return;
    if(hasExit&&inside(state.roomX,state.roomY,exitRect())){leaveBuilding();return}
    for(const p of passages)if(inside(state.roomX,state.roomY,p)){changeRoom(p);return}
  }
  function move(dx,dy,dir){
    if(!ensureInterior())return BASE_MOVE(dx,dy,dir);
    state.dir=dir;
    if(INT.pose||window.joueurBloque){if(Date.now()-INT.lastBlockedToast>1100){INT.lastBlockedToast=Date.now();safeToast(INT.pose?.mode==='seat'?'Tu es assis — appuie sur E pour te relever.':'Repos en cours…')}return}
    if(typeof healingSeq!=='undefined'&&healingSeq){safeToast('Soin en cours — attends la fin du traitement.');return}
    const room=currentRefRoom(),nx=Math.max(20,Math.min(room.width-20,state.roomX+dx)),ny=Math.max(25,Math.min(room.height-20,state.roomY+dy));
    if(!blocked(nx,ny)){state.roomX=nx;state.roomY=ny}lastMove=Date.now();checkPassages();
  }

  function targetFurniture(){
    const v=state.dir===0?{x:0,y:1}:state.dir===1?{x:-1,y:0}:state.dir===2?{x:1,y:0}:{x:0,y:-1};
    let best=null,score=Infinity;
    for(const m of roomFurniture()){
      if(!m.interactif)continue;
      const r=transformedBounds(m),tx=Math.max(r.x,Math.min(r.x+r.w,state.roomX)),ty=Math.max(r.y,Math.min(r.y+r.h,state.roomY));
      const dx=tx-state.roomX,dy=ty-state.roomY,d=Math.hypot(dx,dy);if(d>54)continue;
      const forward=dx*v.x+dy*v.y,side=Math.abs(dx*v.y-dy*v.x);
      if(d>18&&(forward<0||side>Math.max(24,forward*.72+9)))continue;
      const rank=d+side*.18;if(rank<score){score=rank;best=m}
    }
    return best;
  }
  function targetNpc(){
    const people=standardNpcs(),v=state.dir===0?{x:0,y:1}:state.dir===1?{x:-1,y:0}:state.dir===2?{x:1,y:0}:{x:0,y:-1};
    let best=null,score=Infinity;
    for(const n of people){
      const dx=n.x-state.roomX,dy=n.y-state.roomY,d=Math.hypot(dx,dy);if(d>56)continue;
      const dot=d?((dx/d)*v.x+(dy/d)*v.y):1;if(d>22&&dot<.05)continue;
      const rank=d+(1-dot)*12;if(rank<score){score=rank;best=n}
    }
    return best;
  }
  function healTeam(){
    for(const m of state.team||[]){try{m.hp=maxHP(m);m.status=null}catch(_){ }}call('hud');call('save',false);
  }
  function startBed(m){
    if(INT.pose)return;INT.pose={mode:'bed',item:m,returnX:state.roomX,returnY:state.roomY,returnDir:state.dir,ends:Date.now()+15000};window.joueurBloque=true;
    safeToast('Le dresseur se couche dans le sens du lit. Repos pendant 15 secondes…');
    setTimeout(()=>{
      if(!INT?.pose||INT.pose.item.instanceId!==m.instanceId)return;const p=INT.pose;healTeam();state.roomX=p.returnX;state.roomY=p.returnY;state.dir=p.returnDir;INT.pose=null;window.joueurBloque=false;
      safeDialog('<b>Repos terminé</b><br>Ton équipe est entièrement soignée et tous les statuts ont disparu.');
    },15000);
  }
  function sit(m){
    INT.pose={mode:'seat',item:m,returnX:state.roomX,returnY:state.roomY,returnDir:state.dir};window.joueurBloque=true;safeToast('Tu t’assois. Appuie de nouveau sur E ou Entrée pour te relever.');
  }
  function stand(){const p=INT.pose;if(!p)return;state.roomX=p.returnX;state.roomY=p.returnY;state.dir=p.returnDir;INT.pose=null;window.joueurBloque=false;safeToast('Tu te relèves.')}
  function mealAction(label){
    for(const m of state.team||[]){try{m.hp=Math.min(maxHP(m),m.hp+Math.max(1,Math.ceil(maxHP(m)*.25)))}catch(_){ }}call('hud');call('save',false);safeDialog(`<b>${label}</b><br>Le repas rend un peu d’énergie à toute ton équipe.`);
  }
  function finalAltar(){
    if(!state.trainerWins?.final_boss){safeDialog('<b>Autel du Cœur</b><br>Le Maître du Cœur se tient encore entre toi et l’autel.');return}
    if((state.seals||[]).length<7){safeDialog('<b>Autel du Cœur</b><br>Il manque des Sceaux. Les sept doivent être réunis pour restaurer le Cœur de Valdora.');return}
    state.flags=state.flags||{};
    if(state.flags.finalHeartRestored){safeDialog('<b>Cœur de Valdora</b><br>Le Cœur bat de nouveau en harmonie.');return}
    state.flags.finalHeartRestored=true;state.story=Math.max(state.story||0,100);state.money=(state.money||0)+7000;call('logEvent','Le Cœur de Valdora a été restauré grâce aux sept Sceaux.');call('save',false);call('tone',392,.18,.028,'sine');call('tone',523,.20,.026,'sine',.18);call('tone',659,.22,.024,'sine',.36);
    safeDialog('<b>LES SEPT SCEAUX RÉSONNENT</b><br><br>Le Cœur de Valdora bat de nouveau. Une onde lumineuse traverse toute la région.<br><br>+7000 ✦');
  }
  function useFurniture(m){
    // V106E : les fonctions indispensables sont appelées directement par le moteur
    // d'intérieur final. Elles ne dépendent plus d'un ancien gestionnaire masqué dans une IIFE.
    if(m.fonction==='ouvrir_stockage'){call('openPC');return}
    if(m.fonction==='soins_centre'){call('startHealingSequence');return}
    if(m.fonction==='ouvrir_boutique'){call('openShop');return}
    if(m.fonction==='voyage_train'){call('v62StationMasterDialog');return}
    if(m.fonction==='repos_15s_soin_complet'){startBed(m);return}
    if(m.fonction==='s_asseoir'){sit(m);return}
    if(['commander_repas','acheter_dessert','prendre_repas','repas_recup_pv','cuisiner'].includes(m.fonction)){mealAction(m.label||'Repas');return}
    if(m.fonction==='interaction_finale'){finalAltar();return}
    if(m.fonction==='carte_citadelle'){safeDialog('<b>Table stratégique</b><br>Le plan montre cinq salles : l’entrée, trois salles de Gardiens puis la salle du Maître du Cœur.');return}
    if(m.fonction==='dialogue_citadelle'){safeDialog('<b>Trône de la Citadelle</b><br>Le trône domine la dernière salle. Une énergie ancienne vibre dans ses ornements.');return}
    if(m.fonction==='lore_citadelle'){safeDialog('<b>Pilier d’Éclat</b><br>Les symboles du pilier s’illuminent à l’approche d’un combat décisif.');return}
    if(m.fonction==='dialogue_gardien'){safeDialog(`<b>${m.label}</b><br>Ce mobilier porte les couleurs, les trophées et le Sceau du Gardien de la ville.`);return}
    if(m.fonction==='ouvrir_rangement'){safeDialog(`<b>${m.label}</b><br>Le rangement est propre et soigneusement organisé.`);return}
    try{if(typeof triggerFurniture==='function'){triggerFurniture({...m,nom:m.label});return}}catch(err){console.warn('V105Y interaction mobilier',err)}
    safeDialog(`<b>${m.label||'Mobilier'}</b><br>${m.description||'Cet objet fait partie de l’aménagement du bâtiment.'}`);
  }
  function interactNpc(n){
    if(n?._citadelV105Y){
      if(state.trainerWins?.[n.id]){safeDialog(`<b>${n.dialog}</b><br>Tu as remporté ce combat. Le passage vers la salle suivante est désormais ouvert.`);return}
      if(typeof startTrainer413==='function')startTrainer413(n);else call('startTrainer413',n);return;
    }
    if(INT.type==='laboratoire'&&n.id==='prof'){if(!state.team?.length)safeDialog('<b>Professeur Aurine</b><br>Choisis ton premier compagnon.',()=>call('showStarters'));else safeDialog('<b>Professeur Aurine</b><br>Continue ton enquête sur Valdora.');return}
    if(INT.type==='centre_soins'){if(typeof healingSeq!=='undefined'&&healingSeq)safeToast('Le soin est déjà en cours.');else call('startHealingSequence');return}
    if(INT.type==='boutique'){safeDialog('<b>Marchand</b><br>Bienvenue !',()=>call('openShop'));return}
    if(INT.type==='gare'){safeDialog('<b>Chef de gare</b><br>Où souhaitez-vous aller ?',()=>call('v62StationMasterDialog'));return}
    if(INT.type==='gardien'){
      const sealMap={town1:1,town3:2,town5:3,town6:4,town9:5,town10:6,town13:7};
      const src=sourceBuilding();
      const seal=Number(src?.v105nSealIndex)||sealMap[state.zone]||Number(String(state.zone).replace('town',''))||1;
      call('arenaChallenge',seal);return
    }
    safeDialog(`<b>${n.name||'Habitant'}</b><br>Bienvenue dans ce bâtiment.`);
  }
  function interact(){
    if(!ensureInterior())return BASE_INTERACT();
    try{if(closeDialog())return}catch(_){ }
    if(INT.pose){if(INT.pose.mode==='seat')stand();else safeToast('Le repos doit d’abord se terminer.');return}
    const n=targetNpc();if(n){interactNpc(n);return}
    const m=targetFurniture();if(m){useFurniture(m);return}
    safeToast('Approche-toi d’un meuble ou d’un personnage pour interagir.');
  }

  function enterCitadel(){
    const creatorMode=typeof v61CreatorMode==='function'&&v61CreatorMode();
    if(!creatorMode&&typeof finalTempleAvailableV77==='function'&&!finalTempleAvailableV77()){
      safeToast(typeof v83CitadelGateText==='function'?v83CitadelGateText():'La Citadelle n’est pas encore accessible.');
      return false;
    }
    state.zone='temple_final';state.discovered=state.discovered||[];if(!state.discovered.includes('temple_final'))state.discovered.push('temple_final');
    const menu=document.getElementById('menuov');if(menu)menu.style.display='none';
    scene='interior';building={id:'citadelle_coeur_v105y',type:'citadel',referenceType:'citadelle',label:'Citadelle du Cœur'};INT=null;ensureInterior();
    const location=document.getElementById('location');if(location)location.textContent='Citadelle du Cœur';
    call('resetFollowerTrail');call('zoneTransitionSoundV77');call('refreshMusicV77');
    try{if(typeof hud==='function')hud()}catch(_){ }
    call('logEvent','Entrée dans la Citadelle du Cœur.');call('save',false);
    return true;
  }
  const enterZoneV105Y=function(to,entry){if(to==='temple_final')return enterCitadel();return BASE_ENTER_ZONE(to,entry)};

  const BASE_CREATOR_TELEPORT=window.creatorTeleportZoneV105N;
  const creatorTeleportV105Y=function(zone){
    if(zone==='temple_final')return enterCitadel();
    return typeof BASE_CREATOR_TELEPORT==='function'?BASE_CREATOR_TELEPORT(zone):false;
  };

  window.drawInterior=draw;window.moveInterior=move;window.interactInterior=interact;window.enterZone=enterZoneV105Y;window.creatorTeleportZoneV105N=creatorTeleportV105Y;
  try{drawInterior=draw;moveInterior=move;interactInterior=interact;enterZone=enterZoneV105Y}catch(_){ }
  window.ValdoraInterieursV105Y={version:VERSION,reference:REF,state:()=>INT,enterCitadel};

  function brand(){
    document.title='Éclats Sauvages — Valdora V105Z';
    const b=document.querySelector('.brand b');if(b)b.textContent=`VALDORA V105Z — ${String(b.textContent).includes('CRÉATEUR')?'CRÉATEUR':'JOUEUR'}`;
  }
  window.addEventListener('DOMContentLoaded',()=>{
    for(const b of Object.values(REF.buildings))for(const f of Object.values(b.floors||{}))for(const r of Object.values(f.rooms||{}))for(const m of r.furniture||[])if(m.id!==PASSAGE_ID)imageFor(m.asset||m.assets?.front);
    brand();console.log('V105Y : implantation V105X intégrée, retours sécurisés, bâtiment du Gardien aménagé et Citadelle en cinq salles.');
  });
  brand();setTimeout(brand,1300);
})();
