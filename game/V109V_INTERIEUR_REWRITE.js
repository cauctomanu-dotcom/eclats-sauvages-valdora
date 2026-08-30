// V109V — RÉÉCRITURE TOTALE DU MOTEUR D'INTÉRIEURS ET D'INTERACTIONS
// Source de géométrie/mobilier : MOBILIER_REFERENCE_VALDORA_V105X.js (export V105X fourni par l'utilisateur).
(function(){
'use strict';
const VERSION='V109V';
const REF=()=>window.VALDORA_MOBILIER_REFERENCE_V105X||{};
let session=null;
let npcLast=performance.now();
const imgs=new Map();

function norm(v){return String(v??'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'')}
function textOf(b){return [b?.type,b?.urbanType,b?.role,b?.kind,b?.id,b?.label,b?.name].map(norm).join('|')}
function refKeyFor(b){
  const s=textOf(b);
  if(/citadelle|citadel/.test(s))return 'citadelle';
  if(/musee|museum/.test(s))return 'musee';
  if(/centre.?de.?soins|healer|clinic|dispensaire|medical|secours/.test(s))return 'centre_soins';
  if(/laboratoire|\blab\b/.test(s))return 'laboratoire';
  if(/gare|station/.test(s))return 'gare';
  if(/bibliotheque.?publique|public.?library/.test(s))return 'bibliotheque_publique';
  if(/guilde|guild/.test(s))return 'bureau_guilde';
  if(/grand.?immeuble|highrise/.test(s))return 'grand_immeuble';
  if(/immeuble.?moyen|midrise/.test(s))return 'immeuble_moyen';
  if(/residence|appartement/.test(s))return 'residence';
  if(/restaurant|cafe|brasserie/.test(s))return 'restaurant_cafe';
  if(/boutique|shop|galerie|marche|echoppe/.test(s))return 'boutique';
  if(/gardien|arena|guardian|sanctuaire/.test(s))return 'gardien';
  if(/ecole|school|academie/.test(s))return 'ecole';
  if(/hotel|auberge|inn|refuge|relais/.test(s))return 'hotel';
  return 'maison';
}
function buildingRef(key){return REF().buildings?.[key]||REF().buildings?.maison||null}
function firstRoom(key){
  const b=buildingRef(key); if(!b)return null;
  const floorId=Object.keys(b.floors||{})[0]; const floor=b.floors?.[floorId]; if(!floor)return null;
  const roomId=Object.keys(floor.rooms||{})[0]; const room=floor.rooms?.[roomId];
  return room?{key,b,floorId,floor,roomId,room}:null;
}
function rawRoom(floorId=session?.floorId,roomId=session?.roomId){
  if(!session)return null; const b=buildingRef(session.key); if(!b)return null;
  const fid=b.floors?.[floorId]?floorId:Object.keys(b.floors||{})[0]; const floor=b.floors?.[fid]; if(!floor)return null;
  const rid=floor.rooms?.[roomId]?roomId:Object.keys(floor.rooms||{})[0]; const room=floor.rooms?.[rid];
  return room?{key:session.key,b,floorId:fid,floor,roomId:rid,room}:null;
}
function geometry(){
  const rr=rawRoom(); const w=Math.max(1,Number(rr?.room?.width)||Number(REF().coordinateSystem?.defaultWidth)||1200); const h=Math.max(1,Number(rr?.room?.height)||Number(REF().coordinateSystem?.defaultHeight)||800);
  const scale=Math.min(940/w,580/h), ox=(960-w*scale)/2, oy=(600-h*scale)/2;
  return {rr,w,h,scale,ox,oy};
}
function toScreen(x,y){const g=geometry();return{x:g.ox+Number(x)*g.scale,y:g.oy+Number(y)*g.scale}}
function furn(){return (rawRoom()?.room?.furniture||[]).map(m=>({...m,_raw:m}))}
function rectOf(m){
  if(m?.collision)return{x:Number(m.collision.x)||0,y:Number(m.collision.y)||0,w:Number(m.collision.w)||0,h:Number(m.collision.h)||0};
  return{x:Number(m?.x)||0,y:Number(m?.y)||0,w:Number(m?.w)||0,h:Number(m?.h)||0};
}
function pointRectDistance(x,y,r){const dx=Math.max(r.x-x,0,x-(r.x+r.w)),dy=Math.max(r.y-y,0,y-(r.y+r.h));return Math.hypot(dx,dy)}
function hitRect(x,y,r,pad=0){return x>=r.x-pad&&x<=r.x+r.w+pad&&y>=r.y-pad&&y<=r.y+r.h+pad}
function isStructuralWall(m){return String(m?.fonction||'')==='collision_mur'||String(m?.id||'')==='mur'}
function userInteractable(m){return !!m&&!isStructuralWall(m)}
function blockedByFurniture(x,y,radius=17){for(const m of furn()){if(!m?.bloquant)continue;const r=rectOf(m);if(x+radius>r.x&&x-radius<r.x+r.w&&y+radius>r.y&&y-radius<r.y+r.h)return true}return false}
function npcBlocked(x,y,ignore){for(const n of session?.npcs||[]){if(n===ignore)continue;if(Math.hypot(x-n.x,y-n.y)<34)return true}return false}
function blocked(x,y,ignoreNpc=null){const g=geometry();if(x<18||y<18||x>g.w-18||y>g.h-18)return true;if(blockedByFurniture(x,y,17))return true;if(npcBlocked(x,y,ignoreNpc))return true;return false}
function nearestFree(x,y){const g=geometry(),cx=Math.max(24,Math.min(g.w-24,Number(x)||g.w/2)),cy=Math.max(24,Math.min(g.h-24,Number(y)||g.h-80));if(!blocked(cx,cy))return[cx,cy];for(let rad=20;rad<Math.max(g.w,g.h);rad+=20){for(let a=0;a<Math.PI*2;a+=Math.PI/12){const px=Math.max(24,Math.min(g.w-24,cx+Math.cos(a)*rad)),py=Math.max(24,Math.min(g.h-24,cy+Math.sin(a)*rad));if(!blocked(px,py))return[px,py]}}return[g.w/2,g.h/2]}

const FLOOR_THEMES={
  // Palette reconstruite depuis le rendu visuel V105X : bois chaud pour les logements,
  // carrelage blanc/bleu pour soins/labo, crème pour boutique/gare, pierre beige pour musée.
  maison:{wall:'#d79a56',wall2:'#a8622f',a:'#df984d',b:'#e7a75d',line:'#b86f33',kind:'wood',border:'#704127'},
  residence:{wall:'#d19a61',wall2:'#8d5935',a:'#dfa361',b:'#e9b371',line:'#b8753e',kind:'wood',border:'#70472d'},
  hotel:{wall:'#d8a35e',wall2:'#85502d',a:'#e9ad68',b:'#f0bd7d',line:'#bd7942',kind:'wood',border:'#684027'},
  restaurant_cafe:{wall:'#d8a15c',wall2:'#84512e',a:'#e6ad69',b:'#efbd7d',line:'#bd7c45',kind:'wood',border:'#6d4329'},
  bibliotheque_publique:{wall:'#c99656',wall2:'#704629',a:'#d69a55',b:'#e3aa66',line:'#ab6733',kind:'wood',border:'#5d3b28'},
  centre_soins:{wall:'#a9c9de',wall2:'#507fa3',a:'#e5e5e2',b:'#d5d8d9',line:'#b8c6cf',kind:'medical',border:'#486f8a'},
  laboratoire:{wall:'#a9c8dc',wall2:'#536f88',a:'#bed3e1',b:'#d0dfE8',line:'#91b4c9',kind:'medical',border:'#4f687d'},
  boutique:{wall:'#d5c49f',wall2:'#8d7651',a:'#e5dcc2',b:'#d6cbaa',line:'#c2b58f',kind:'tile',border:'#735d3e'},
  gare:{wall:'#8aa5bd',wall2:'#425a72',a:'#eed79f',b:'#e5cb91',line:'#c4ad78',kind:'station',border:'#46586a'},
  musee:{wall:'#d8c2aa',wall2:'#755940',a:'#e7d2bd',b:'#ddc4a9',line:'#c4a98b',kind:'museum',border:'#654d39'},
  ecole:{wall:'#d7cfab',wall2:'#5f725b',a:'#e7dfbd',b:'#d9d0aa',line:'#bbb081',kind:'tile',border:'#536650'},
  gardien:{wall:'#b9aa9a',wall2:'#60483d',a:'#cec1b3',b:'#b5a494',line:'#8f7a6a',kind:'stone',border:'#5c473e'},
  citadelle:{wall:'#8e8170',wall2:'#40362e',a:'#b7aa94',b:'#9f927d',line:'#786b5a',kind:'citadel',border:'#372f29'},
  bureau_guilde:{wall:'#b8aa9a',wall2:'#5f5148',a:'#cfc2b2',b:'#b9aa97',line:'#948572',kind:'carpet',border:'#5a4b42'},
  immeuble_moyen:{wall:'#c6c8c7',wall2:'#616b70',a:'#d6d2cb',b:'#c5c0b7',line:'#a7a097',kind:'tile',border:'#555f63'},
  grand_immeuble:{wall:'#bcc7c6',wall2:'#526466',a:'#d1d8d6',b:'#bdc8c5',line:'#98a8a5',kind:'tile',border:'#4d5d5f'}
};
function drawFloor(){
  const g=geometry(),t=FLOOR_THEMES[session?.key]||FLOOR_THEMES.maison;
  const X=g.ox,Y=g.oy,W=g.w*g.scale,H=g.h*g.scale,wall=Math.max(5,Math.min(18,22*g.scale));
  ctx.save();
  // Hors pièce sombre, comme dans les intérieurs de référence.
  ctx.fillStyle='#172b38';ctx.fillRect(0,0,960,600);
  ctx.shadowColor='rgba(0,0,0,.42)';ctx.shadowBlur=16;ctx.fillStyle=t.wall2;ctx.fillRect(X,Y,W,H);ctx.shadowBlur=0;
  // Bande de mur périphérique puis sol : aucune modification des coordonnées du JSON.
  ctx.fillStyle=t.wall;ctx.fillRect(X+wall*.18,Y+wall*.18,W-wall*.36,H-wall*.36);
  const fx=X+wall,fy=Y+wall,fw=Math.max(1,W-wall*2),fh=Math.max(1,H-wall*2);
  ctx.fillStyle=t.a;ctx.fillRect(fx,fy,fw,fh);
  ctx.save();ctx.beginPath();ctx.rect(fx,fy,fw,fh);ctx.clip();
  const unit=(t.kind==='wood'?34:t.kind==='medical'?42:t.kind==='station'?48:t.kind==='museum'?58:t.kind==='tile'?50:t.kind==='stone'?62:t.kind==='citadel'?58:60)*g.scale;
  ctx.lineWidth=Math.max(.65,g.scale*1.05);ctx.strokeStyle=t.line;
  if(t.kind==='wood'){
    // Lames de parquet en quinconce, proches du rendu Maison/Hôtel de la planche V105X.
    let row=0;for(let y=fy;y<=fy+fh;y+=unit){ctx.beginPath();ctx.moveTo(fx,y);ctx.lineTo(fx+fw,y);ctx.stroke();const off=(row++%2)*unit*1.7;for(let x=fx-off;x<fx+fw;x+=unit*3.4){ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x,y+unit);ctx.stroke()}}
    ctx.fillStyle='rgba(255,224,169,.08)';for(let y=fy+unit*.3;y<fy+fh;y+=unit*2){ctx.fillRect(fx,y,fw,unit*.18)}
  }else if(t.kind==='medical'){
    // Petits carreaux blancs/bleutés de Centre de soins/Laboratoire.
    ctx.fillStyle=t.b;ctx.globalAlpha=.34;ctx.fillRect(fx,fy,fw,fh);ctx.globalAlpha=1;
    for(let x=fx;x<=fx+fw;x+=unit){ctx.beginPath();ctx.moveTo(x,fy);ctx.lineTo(x,fy+fh);ctx.stroke()}
    for(let y=fy;y<=fy+fh;y+=unit){ctx.beginPath();ctx.moveTo(fx,y);ctx.lineTo(fx+fw,y);ctx.stroke()}
    ctx.fillStyle='rgba(255,255,255,.16)';for(let yy=0,y=fy;y<fy+fh;y+=unit,yy++)for(let xx=0,x=fx;x<fx+fw;x+=unit,xx++)if((xx+yy)%2===0)ctx.fillRect(x+1,y+1,unit-2,unit-2);
  }else if(t.kind==='station'){
    // Dalles crème avec bordure bleutée, comme la gare de référence.
    ctx.fillStyle=t.b;ctx.globalAlpha=.36;ctx.fillRect(fx,fy,fw,fh);ctx.globalAlpha=1;
    for(let x=fx;x<=fx+fw;x+=unit){ctx.beginPath();ctx.moveTo(x,fy);ctx.lineTo(x,fy+fh);ctx.stroke()}
    for(let y=fy;y<=fy+fh;y+=unit){ctx.beginPath();ctx.moveTo(fx,y);ctx.lineTo(fx+fw,y);ctx.stroke()}
    ctx.fillStyle='rgba(67,88,111,.18)';ctx.fillRect(fx,fy,fw,Math.max(4,unit*.22));ctx.fillRect(fx,fy+fh-Math.max(4,unit*.22),fw,Math.max(4,unit*.22));
  }else if(t.kind==='museum'){
    // Grandes dalles pierre beige légèrement nuancées.
    ctx.fillStyle=t.b;ctx.globalAlpha=.33;ctx.fillRect(fx,fy,fw,fh);ctx.globalAlpha=1;
    for(let y=fy,rr=0;y<=fy+fh;y+=unit,rr++){ctx.beginPath();ctx.moveTo(fx,y);ctx.lineTo(fx+fw,y);ctx.stroke();const off=(rr%2)*unit*.55;for(let x=fx-off;x<fx+fw;x+=unit*1.1){ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x,y+unit);ctx.stroke()}}
    ctx.fillStyle='rgba(255,255,255,.08)';for(let y=fy+unit*.15;y<fy+fh;y+=unit*2)ctx.fillRect(fx,y,fw,unit*.2);
  }else if(t.kind==='carpet'){
    ctx.fillStyle=t.b;ctx.globalAlpha=.52;ctx.fillRect(fx,fy,fw,fh);ctx.globalAlpha=1;for(let y=fy;y<fy+fh;y+=unit*.45){ctx.beginPath();ctx.moveTo(fx,y);ctx.lineTo(fx+fw,y);ctx.stroke()}
  }else{
    ctx.fillStyle=t.b;ctx.globalAlpha=.30;ctx.fillRect(fx,fy,fw,fh);ctx.globalAlpha=1;
    for(let x=fx;x<=fx+fw;x+=unit){ctx.beginPath();ctx.moveTo(x,fy);ctx.lineTo(x,fy+fh);ctx.stroke()}
    for(let y=fy;y<=fy+fh;y+=unit){ctx.beginPath();ctx.moveTo(fx,y);ctx.lineTo(fx+fw,y);ctx.stroke()}
    if(t.kind==='citadel'){ctx.strokeStyle='rgba(61,48,36,.34)';ctx.lineWidth=Math.max(1,g.scale*2);for(let y=fy+unit/2;y<fy+fh;y+=unit){ctx.beginPath();ctx.moveTo(fx,y);ctx.lineTo(fx+fw,y);ctx.stroke()}}
  }
  ctx.restore();
  ctx.strokeStyle=t.border;ctx.lineWidth=Math.max(2,g.scale*5);ctx.strokeRect(X,Y,W,H);
  ctx.restore();
}
function img(src){if(!src)return null;if(imgs.has(src))return imgs.get(src);const im=new Image();im.decoding='async';im.src=src;imgs.set(src,im);return im}
function drawFurniture(m){
  const src=m?.assets?.[m.view]||m?.asset||m?.assets?.front; const im=img(src); if(!im||!im.complete||!im.naturalWidth)return;
  const g=geometry(),cx=g.ox+(Number(m.x)+Number(m.w)/2)*g.scale,cy=g.oy+(Number(m.y)+Number(m.h)/2)*g.scale;
  ctx.save();ctx.translate(cx,cy);ctx.rotate((Number(m.rotation)||0)*Math.PI/180);ctx.scale(m.flipX?-1:1,m.flipY?-1:1);ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';ctx.drawImage(im,-Number(m.w)*g.scale/2,-Number(m.h)*g.scale/2,Number(m.w)*g.scale,Number(m.h)*g.scale);ctx.restore();
}

const SERVICE={
  centre_soins:{id:'healer',look:21,name:'Infirmière Élise',anchors:['comptoir_medical','machine_soin']},laboratoire:{id:'prof',look:40,name:'Professeur Aurine',anchors:['table_starters','supercalculateur']},boutique:{id:'seller',look:26,name:'Marchand',anchors:['comptoir_vente']},gare:{id:'agent',look:24,name:'Agent de gare',anchors:['guichet_billets']},musee:{id:'museum_director',look:9,name:'Directeur du musée',anchors:['bureau_conservateur']},ecole:{id:'teacher',look:0,name:'Professeure Emma',anchors:['bureau_professeur']},gardien:{id:'guard',look:20,name:'Gardien',anchors:['pupitre_gardien']},hotel:{id:'host',look:6,name:'Aubergiste Clara',anchors:['reception_hotel']},restaurant_cafe:{id:'server',look:34,name:'Serveuse',anchors:['comptoir_restaurant']},bureau_guilde:{id:'guild_master',look:23,name:'Responsable de Guilde',anchors:['bureau_direction']},bibliotheque_publique:{id:'librarian',look:13,name:'Bibliothécaire',anchors:['comptoir_bibliotheque']}
};
function serviceNpc(){
  const def=SERVICE[session?.key];if(!def)return [];
  const list=furn();let a=null;for(const id of def.anchors){a=list.find(m=>m.id===id);if(a)break}
  const g=geometry();let x=a?Number(a.x)+Number(a.w)/2:g.w/2,y=a?Number(a.y)+Number(a.h)+38:g.h*.35;[x,y]=nearestFree(x,y);
  return[{...def,x,y,homeX:x,homeY:y,dir:0,moving:false,service:true,targetX:x,targetY:y,nextDecision:0}]
}
function updateNpcs(){
  if(!session)return;const now=performance.now(),dt=Math.min(.06,Math.max(0,(now-npcLast)/1000));npcLast=now;
  for(const n of session.npcs||[]){if(Date.now()<(n.pauseUntil||0)){n.moving=false;continue}if(!n.nextDecision||now>=n.nextDecision){let ok=false;for(let i=0;i<20&&!ok;i++){const a=Math.random()*Math.PI*2,r=Math.random()*44,nx=n.homeX+Math.cos(a)*r,ny=n.homeY+Math.sin(a)*r;if(!blocked(nx,ny,n)){n.targetX=nx;n.targetY=ny;ok=true}}n.nextDecision=now+1200+Math.random()*1800}
    const dx=n.targetX-n.x,dy=n.targetY-n.y,d=Math.hypot(dx,dy);if(d<2){n.moving=false;continue}const step=Math.min(d,24*dt),nx=n.x+dx/d*step,ny=n.y+dy/d*step;if(blocked(nx,ny,n)){n.nextDecision=0;n.moving=false;continue}n.dir=Math.abs(dx)>Math.abs(dy)?(dx<0?1:2):(dy>0?0:3);n.x=nx;n.y=ny;n.moving=true;
  }
}
function drawNpcExact(n){const p=toScreen(n.x,n.y),g=geometry();ctx.save();ctx.translate(p.x,p.y);ctx.scale(g.scale,g.scale);drawNpc(n.look,0,0,n.dir||0,!!n.moving);ctx.restore()}
function drawHeroExact(){const p=toScreen(state.roomX,state.roomY),g=geometry();ctx.save();ctx.translate(p.x,p.y);ctx.scale(g.scale,g.scale);drawHero(0,0,state.dir,Date.now()-lastMove<190);ctx.restore()}
function facingVector(){
  const d=((Number(state.dir)||0)%4+4)%4;
  return d===1?{x:-1,y:0}:d===2?{x:1,y:0}:d===3?{x:0,y:-1}:{x:0,y:1}
}
function targetMetrics(x,y,maxDistance){
  const dx=Number(x)-Number(state.roomX),dy=Number(y)-Number(state.roomY),dist=Math.hypot(dx,dy);
  if(!Number.isFinite(dist)||dist>maxDistance)return null;
  if(dist<1)return{distance:0,forward:0,side:0,score:0};
  const f=facingVector(),forward=dx*f.x+dy*f.y,side=Math.abs(dx*f.y-dy*f.x);
  if(dist>24&&(forward<3||side>Math.max(42,forward*.82+18)))return null;
  return{distance:dist,forward,side,score:dist+side*.58-Math.max(0,forward)*.08}
}
function furnitureAimPoint(m){
  const r=rectOf(m),px=Number(state.roomX),py=Number(state.roomY),x=Math.max(r.x,Math.min(r.x+r.w,px)),y=Math.max(r.y,Math.min(r.y+r.h,py));
  if(Math.hypot(x-px,y-py)>1)return{x,y};
  return{x:r.x+r.w/2,y:r.y+r.h/2}
}
function nearestNpcWithDistance(){
  let best=null,bm=null;for(const n of session?.npcs||[]){const m=targetMetrics(n.x,n.y,84);if(!m)continue;if(!bm||m.score<bm.score){best=n;bm=m}}
  return{target:best,distance:bm?.distance??Infinity,score:bm?.score??Infinity,metrics:bm}
}
function nearestFurnitureWithDistance(max=96){
  let best=null,bm=null;for(const m of furn()){
    if(!userInteractable(m))continue;const d=pointRectDistance(state.roomX,state.roomY,rectOf(m));if(d>max)continue;
    const p=furnitureAimPoint(m),metrics=targetMetrics(p.x,p.y,max+8);if(!metrics)continue;
    const fn=String(m.fonction||'decor'),functional=fn!=='decor'&&fn!=='collision_mur',score=metrics.score+(functional?-4:7);
    if(!bm||score<bm.score){best=m;bm={...metrics,score}}
  }
  return{target:best,distance:bm?.distance??Infinity,score:bm?.score??Infinity,metrics:bm}
}
function nearNpc(){const q=nearestNpcWithDistance();return q.target||null}
function nearFurniture(max=96){return nearestFurnitureWithDistance(max).target}
function nearestInteractionTarget(){
  const nq=nearestNpcWithDistance(),fq=nearestFurnitureWithDistance(96),n=nq.target,m=fq.target;
  if(n&&m)return fq.score<=nq.score+6?{kind:'furniture',target:m,score:fq.score}:{kind:'npc',target:n,score:nq.score};
  if(m)return{kind:'furniture',target:m,score:fq.score};if(n)return{kind:'npc',target:n,score:nq.score};return null
}
function prompt(){
  const q=nearestInteractionTarget();if(!q)return;const n=q.kind==='npc'?q.target:null,m=q.kind==='furniture'?q.target:null;
  const label=n?n.name:(m.label||m.nom||m.id||'Interagir');
  ctx.save();ctx.font='800 13px Segoe UI';const txt='E / Entrée — '+label,w=Math.min(700,ctx.measureText(txt).width+34),x=(960-w)/2,y=548;ctx.fillStyle='rgba(15,32,43,.92)';ctx.beginPath();ctx.roundRect(x,y,w,36,12);ctx.fill();ctx.strokeStyle='rgba(255,255,255,.28)';ctx.stroke();ctx.fillStyle='#fff';ctx.textAlign='center';ctx.fillText(txt,480,y+23);ctx.textAlign='start';ctx.restore();
}
function draw(){
  if(!session)return;updateNpcs();drawFloor();const objects=[];for(const m of furn())objects.push({depth:Number(m.y||0)+Number(m.h||0),z:Number(m.z)||0,draw:()=>drawFurniture(m)});for(const n of session.npcs||[])objects.push({depth:n.y,z:100000,draw:()=>drawNpcExact(n)});objects.push({depth:state.roomY,z:999999,draw:drawHeroExact});objects.sort((a,b)=>a.depth-b.depth||a.z-b.z).forEach(o=>o.draw());try{if(typeof drawHealingOverlay==='function')drawHealingOverlay()}catch(_){}prompt();
}

function labelFor(b,key){return b?.label||b?.name||buildingRef(key)?.name||'Bâtiment'}
function door(b){return{x:Number(b?.doorX??(Number(b?.x||0)+Number(b?.w||0)/2)),y:Number(b?.doorY??(Number(b?.y||0)+Number(b?.h||0)))} }
function nearDoor(){
  if(scene!=='world'||currentScene?.()?.kind!=='town')return null;let best=null,bd=Infinity;for(const b of currentScene().buildings||[]){const d=door(b),dist=Math.hypot(Number(state.x)-d.x,Number(state.y)-d.y);if(dist<bd){bd=dist;best=b}}return best&&bd<=110?best:null;
}
function enter(b){
  if(!b)return false;const key=refKeyFor(b),fr=firstRoom(key);if(!fr)return false;const d=door(b);session={key,zone:state.zone,source:b,door:d,floorId:fr.floorId,roomId:fr.roomId,entryFloorId:fr.floorId,entryRoomId:fr.roomId,npcs:[]};building={...b,type:key,_buildingEngine:VERSION};scene='interior';
  const g=geometry();let [x,y]=nearestFree(g.w/2,g.h-62);state.roomX=x;state.roomY=y;state.dir=3;session.npcs=serviceNpc();npcLast=performance.now();try{resetFollowerTrail?.()}catch(_){}try{toast(labelFor(b,key))}catch(_){}return true;
}
function teamHealthyV118(){const team=Array.isArray(state?.team)?state.team:[];if(!team.length)return true;try{return team.every(m=>m&&Number(m.hp||0)>=Number(maxHP(m)||0)&&!m.status)}catch(_){return false}}
function leave(){
  if(!session)return false;
  const flags=state.flags=state.flags||{},healing=!!(flags.v109xHealingInProgress||window.joueurBloque);
  if(healing){try{toast('Le soin est en cours. Attends la fin du traitement.')}catch(_){}return false}
  if(session.key==='centre_soins'&&flags.v109xForceHeal&&!teamHealthyV118()){
    dialogSafe('Centre de soins','Ton équipe vient d’être ramenée ici après un K.O. complet. Fais-la soigner avant de repartir.');
    try{toast('Soins obligatoires avant de quitter le centre.')}catch(_){}return false
  }
  if(teamHealthyV118()){delete flags.v109xForceHeal;delete flags.v109xHealingInProgress}
  const s=session;scene='world';state.zone=s.zone;state.x=s.door.x;state.y=s.door.y+78;state.dir=0;building=null;session=null;try{resetFollowerTrail?.()}catch(_){}try{toast(currentScene()?.name||'Valdora')}catch(_){}return true
}
function moveToRoom(floorId,roomId,arrivalX=null,arrivalY=null){if(!session)return false;const rr=rawRoom(floorId,roomId);if(!rr)return false;session.floorId=rr.floorId;session.roomId=rr.roomId;const g=geometry();let [x,y]=nearestFree(arrivalX==null?g.w/2:Number(arrivalX),arrivalY==null?g.h-70:Number(arrivalY));state.roomX=x;state.roomY=y;session.npcs=serviceNpc();npcLast=performance.now();try{toast((rr.floor.name||rr.floorId)+' — '+(rr.room.name||rr.roomId))}catch(_){}return true}
function destinations(){const b=buildingRef(session?.key),out=[];for(const [fid,f] of Object.entries(b?.floors||{}))for(const [rid,r] of Object.entries(f.rooms||{}))out.push({floorId:fid,roomId:rid,label:(f.name||fid)+' — '+(r.name||rid)});return out}
function passageAt(x,y){for(const m of furn()){if(!['passage_piece_sol'].includes(String(m.fonction||'')))continue;if(hitRect(x,y,{x:Number(m.x)||0,y:Number(m.y)||0,w:Number(m.w)||0,h:Number(m.h)||0}))return m}return null}
let lastPassage='';
function activatePassage(){const m=passageAt(state.roomX,state.roomY);if(!m){lastPassage='';return false}const k=(m.instanceId||m.id)+'|'+session.floorId+'|'+session.roomId;if(k===lastPassage)return false;lastPassage=k;return moveToRoom(m.targetFloor||session.floorId,m.targetRoom||session.roomId,m.arrivalX,m.arrivalY)}
function moveInteriorNew(dx,dy,dir){
  if(!session)return;if(window.joueurBloque||state.flags?.v109xHealingInProgress){state.dir=dir;return}state.dir=dir;const g=geometry(),nx=Math.max(18,Math.min(g.w-18,state.roomX+dx)),ny=Math.max(18,Math.min(g.h-18,state.roomY+dy));if(!blocked(nx,ny)){state.roomX=nx;state.roomY=ny;lastMove=Date.now()}if(activatePassage())return;if(session.floorId===session.entryFloorId&&session.roomId===session.entryRoomId&&state.roomY>g.h-22&&Math.abs(state.roomX-g.w/2)<100)leave();
}

function dialogSafe(title,text,cb){if(typeof dialog==='function')dialog('<b>'+title+'</b><br>'+text,cb);else if(typeof toast==='function')toast(title+' : '+text)}
function healAll(){for(const x of state.team||[]){try{x.hp=maxHP(x);x.status=null}catch(_){}}try{hud();save(false)}catch(_){}}
function partialHeal(frac=.25){for(const x of state.team||[]){try{x.hp=Math.min(maxHP(x),Number(x.hp||0)+Math.max(8,Math.round(maxHP(x)*frac)))}catch(_){}}try{hud();save(false)}catch(_){}}
function rummage(m){state.flags=state.flags||{};state.inventory=state.inventory||{};const k='v109v_search_'+(m.instanceId||m.id);if(state.flags[k])return dialogSafe(m.label||'Rangement','Tu l’as déjà fouillé.');state.flags[k]=true;state.inventory.Baie=(state.inventory.Baie||0)+1;try{hud();save(false)}catch(_){}dialogSafe(m.label||'Rangement','Tu trouves une Baie.')}
function study(m){if(state.team?.length){state.team[0].xp=(state.team[0].xp||0)+15;try{hud();save(false)}catch(_){}dialogSafe(m.label||'Étude','La première créature de ton équipe gagne 15 EXP.')}else dialogSafe(m.label||'Étude',m.description||'Tu étudies les documents.')}
function archives(m){dialogSafe(m.label||m.nom||'Archives',m.description||'Des documents anciens racontent l’histoire de Valdora.')}
function roomAction(m){return moveToRoom(m.targetFloor||session.floorId,m.targetRoom||session.roomId,m.arrivalX,m.arrivalY)}
function elevator(){const list=destinations();if(!list.length)return dialogSafe('Ascenseur','Aucune destination.');let html='<div class="quest"><b>Ascenseur</b><br>Choisis une destination.</div><div class="baggrid">'+list.map(x=>`<button class="bagitem" onclick="ValdoraInteriorV109V.moveToRoom('${x.floorId}','${x.roomId}')">${x.label}</button>`).join('')+'</div>';if(typeof openSimpleMenu==='function')openSimpleMenu('Ascenseur',html);else dialogSafe('Ascenseur',list.map(x=>x.label).join(' • '))}
const HANDLED=new Set(['acheter_dessert','ascenseur_etages','carte_citadelle','choix_starters','collision_mur','commander_repas','consulter_archives','consulter_reunion','controle_ticket','cuisiner','decor','dialogue_citadelle','dialogue_direction','distributeur_boissons','emprunter_livre','etudier','horaires_train','infos_carte_region','infos_oeuf','infos_valdora','interaction_finale','lancer_defi_gardien','lecon','lire_lore_indices','lore_citadelle','lore_gardien','lore_musee','lore_recherche','missions_guilde','ouvrir_boutique','ouvrir_casier','ouvrir_rangement','ouvrir_stockage','parler_professeur','passage_etage','passage_piece_sol','prendre_repas','recevoir_sceau','recherche_codex','repas_recup_pv','repos_15s_soin_complet','reservation_hotel','s_asseoir','soins_centre','voir_trophees','voyage_train']);
function interactFurniture(m){
  if(!m)return false;const fn=String(m.fonction||'decor'),title=m.label||m.nom||m.id||'Mobilier';state.mobilierInstanceIdV102Y=m.instanceId;
  switch(fn){
    case 'ouvrir_stockage': if(typeof window.openPC==='function')window.openPC(); else dialogSafe('PC','Le stockage est indisponible.'); break;
    case 'soins_centre': if(typeof startHealingSequence==='function')startHealingSequence();else{healAll();dialogSafe('Centre de soins','Ton équipe est soignée.')}break;
    case 'ouvrir_boutique': if(typeof openShop==='function')openShop();else dialogSafe('Boutique','Le service est indisponible.');break;
    case 'repos_15s_soin_complet': if(typeof sleepAt==='function')sleepAt(m);else{healAll();dialogSafe(title,'Ton équipe récupère complètement.')}break;
    case 's_asseoir': if(typeof sitAt==='function')sitAt(m);else dialogSafe(title,m.description||'Tu t’assois un instant.');break;
    case 'repas_recup_pv':case 'prendre_repas':case 'commander_repas':case 'cuisiner':case 'acheter_dessert':partialHeal(.25);dialogSafe(title,m.description||'Ton équipe récupère un peu d’énergie.');break;
    case 'infos_valdora':dialogSafe(title,m.description||'Informations sur Valdora.');break;
    case 'lire_lore_indices':case 'consulter_archives':case 'consulter_reunion':case 'lore_recherche':case 'lore_musee':case 'lore_gardien':case 'lore_citadelle':case 'emprunter_livre':archives(m);break;
    case 'infos_carte_region':dialogSafe(title,m.description||'Une carte détaillée de Valdora.');break;
    case 'reservation_hotel': if(typeof reserveHotel==='function')reserveHotel();else dialogSafe(title,m.description||'Réception.');break;
    case 'voyage_train':case 'controle_ticket':window.ValdoraTrainV109D?.open?.();break;
    case 'horaires_train':if(typeof stationBoard==='function')stationBoard();else dialogSafe(title,m.description||'Horaires des trains.');break;
    case 'distributeur_boissons':if(typeof vending==='function')vending();else dialogSafe(title,m.description||'Distributeur.');break;
    case 'choix_starters':if(!(state.team||[]).length&&typeof showStarters==='function')showStarters();else dialogSafe(title,'Ton premier compagnon a déjà été choisi.');break;
    case 'recherche_codex':if(typeof superComputer==='function')superComputer();else dialogSafe(title,m.description||'Recherche Codex.');break;
    case 'infos_oeuf':dialogSafe(title,m.description||'Les capteurs surveillent l’œuf.');break;
    case 'passage_piece_sol':case 'passage_etage':roomAction(m);break;
    case 'ascenseur_etages':elevator();break;
    case 'ouvrir_casier':case 'ouvrir_rangement':rummage(m);break;
    case 'etudier':case 'lecon':study(m);break;
    case 'parler_professeur':dialogSafe('Professeure Emma',m.description||'Le professeur te parle du cours.');break;
    case 'lancer_defi_gardien':if(typeof arenaChallenge==='function')arenaChallenge(+String(state.zone).replace('town',''));else dialogSafe(title,m.description||'Le défi du Gardien.');break;
    case 'recevoir_sceau':dialogSafe(title,'Le Sceau est remis après la victoire contre le Gardien.');break;
    case 'voir_trophees':dialogSafe(title,m.description||'Les trophées des anciens défis.');break;
    case 'missions_guilde':if(typeof openObjectivesV84==='function')openObjectivesV84();else dialogSafe(title,m.description||'Missions de la Guilde.');break;
    case 'dialogue_direction':dialogSafe(title,m.description||'Bureau de direction.');break;
    case 'carte_citadelle':dialogSafe(title,m.description||'Carte stratégique de la Citadelle.');break;
    case 'dialogue_citadelle':dialogSafe(title,m.description||'Le trône domine la salle.');break;
    case 'interaction_finale':if(state.zone==='temple_final'&&typeof tryFinalAltarV77==='function')tryFinalAltarV77();else dialogSafe(title,m.description||'Une énergie intense émane de l’autel.');break;
    case 'collision_mur':return false;
    case 'decor':default:dialogSafe(title,m.description||'Tu observes cet élément.');break;
  }return true;
}
function faceNpc(n){if(!n)return;const dx=state.roomX-n.x,dy=state.roomY-n.y;n.dir=Math.abs(dx)>Math.abs(dy)?(dx<0?1:2):(dy>0?0:3);n.pauseUntil=Date.now()+2600;n.moving=false}
function serviceNpcInteract(n){faceNpc(n);switch(session?.key){case 'centre_soins':return interactFurniture(furn().find(m=>m.fonction==='soins_centre')||{fonction:'soins_centre',label:'Centre de soins'});case 'laboratoire':if(!(state.team||[]).length&&typeof showStarters==='function')showStarters();else dialogSafe('Professeur Aurine','Continue ton enquête sur Valdora.');return true;case 'boutique':if(typeof openShop==='function')openShop();return true;case 'gare':window.ValdoraTrainV109D?.open?.();return true;case 'musee':if(typeof window.openMuseumDirectorV109A==='function')window.openMuseumDirectorV109A();else dialogSafe(n.name,'Bienvenue au musée.');return true;case 'gardien':if(typeof arenaChallenge==='function')arenaChallenge(+String(state.zone).replace('town',''));return true;default:dialogSafe(n.name,'Bonjour !');return true}}
function interact(){if(!session)return;const q=nearestInteractionTarget();if(q?.kind==='furniture')return interactFurniture(q.target);if(q?.kind==='npc')return serviceNpcInteract(q.target);try{toast('Approche-toi d’un élément ou d’un personnage : E / Entrée.')}catch(_){}}

// Interaction monde : la porte du bâtiment utilise exclusivement ce nouveau moteur.
const WORLD_INTERACT_BEFORE=window.interact;
function worldInteract(){if(scene==='world'){const b=nearDoor();if(b)return enter(b)}return WORLD_INTERACT_BEFORE?.apply(this,arguments)}

// Citadelle monde : déplacement dédié, sans dépendance au réseau routier des villes.
const WORLD_MOVE_BEFORE=window.move;
function worldMove(dx,dy,dir){if(scene==='world'&&state.zone==='temple_final'){
  state.dir=dir;const sc=currentScene(),speed=state.bike?1.55:1,nx=state.x+dx*speed,ny=state.y+dy*speed;let bad=false;if(typeof finalTempleCollisionV77==='function')bad=finalTempleCollisionV77(nx,ny);else bad=nx<390||nx>2010||ny<70||ny>2040;
  if(!bad){for(const t of (typeof currentTrainers==='function'?currentTrainers():[])){const nd=Math.hypot(nx-t.x,ny-t.y),od=Math.hypot(state.x-t.x,state.y-t.y);if(nd<36&&nd<=od+.01){bad=true;break}}}
  if(!bad){try{recordFollowerStep?.()}catch(_){}state.x=nx;state.y=ny;lastMove=Date.now();try{checkPortal?.()}catch(_){}}return;
 }return WORLD_MOVE_BEFORE?.apply(this,arguments)}

function recover(){if(scene==='interior'&&!session&&building){try{enter(building)}catch(e){console.warn('V109V restauration intérieur',e)}}if(scene==='world'&&state.zone==='temple_final'){if(!Number.isFinite(Number(state.x))||!Number.isFinite(Number(state.y))||Number(state.x)<390||Number(state.x)>2010||Number(state.y)<70||Number(state.y)>2040){state.x=1200;state.y=1900}}}
function audit(){const functions=new Set(),rooms=[];for(const [bk,b] of Object.entries(REF().buildings||{}))for(const [fk,f] of Object.entries(b.floors||{}))for(const [rk,r] of Object.entries(f.rooms||{})){rooms.push({building:bk,floor:fk,room:rk,w:r.width,h:r.height,count:(r.furniture||[]).length});for(const m of r.furniture||[])functions.add(String(m.fonction||'decor'))}return{version:VERSION,rooms,functions:[...functions].sort(),unhandled:[...functions].filter(x=>!HANDLED.has(x)).sort()}}
const api={version:VERSION,enter,leave,move:moveInteriorNew,draw,interact,interactFurniture,nearFurniture,nearNpc,nearDoor,blocked,moveToRoom,destinations,session:()=>session,rawRoom,furniture:furn,interactionTarget:nearestInteractionTarget,audit};
window.ValdoraInteriorV109V=api;window.ValdoraBuildingV109I=api;
window.drawInterior=draw;try{drawInterior=draw}catch(_){}window.moveInterior=moveInteriorNew;try{moveInterior=moveInteriorNew}catch(_){}window.interactInterior=interact;try{interactInterior=interact}catch(_){}window.interiorBlocked=blocked;try{interiorBlocked=blocked}catch(_){}window.interiorCollision=(x,y)=>blocked(x,y);try{interiorCollision=window.interiorCollision}catch(_){}window.nearInteriorNPC=nearNpc;try{nearInteriorNPC=nearNpc}catch(_){}window.interact=worldInteract;try{interact=worldInteract}catch(_){}window.move=worldMove;try{move=worldMove}catch(_){}window.v109eNearEntryBuilding=nearDoor;window.v109eEnterBuilding=enter;window.enterBuildingV67=enter;window.enterBuildingV68=enter;window.enterBuildingV70=enter;window.V109OFurnitureAction=interactFurniture;window.declencherInteraction=interactFurniture;try{triggerFurniture=interactFurniture}catch(_){}
function stampVersion(){try{document.title=String(document.title||'Éclats Sauvages — Valdora').replace(/V108T|V109[O-U]/g,VERSION);document.documentElement.dataset.valdoraVersion=VERSION;for(const el of document.querySelectorAll('h1,h2,.title,.game-title'))if(/VALDORA/i.test(el.textContent||''))el.textContent=String(el.textContent).replace(/V108T|V109[O-U]/g,VERSION)}catch(_){}}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>{setTimeout(recover,350);setTimeout(stampVersion,420)});else{setTimeout(recover,200);setTimeout(stampVersion,260)};
setTimeout(()=>{const a=audit();if(a.unhandled.length)console.error('V109V fonctions mobilier non gérées',a.unhandled);else console.log('V109V : moteur intérieur réécrit —',a.rooms.length,'pièces,',a.functions.length,'fonctions prises en charge.')},1200);
})();
