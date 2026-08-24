(function(){
'use strict';

const VERSION='V114-ROUTES-BIOMES';
const LAYOUT_REVISION='V114B';
const LEGACY=window.ValdoraPolishV113||{};
let BASE_WORLD_INTERACT=window.interact;
try{BASE_WORLD_INTERACT=window.interact||interact}catch(_){}
let BASE_COLLISION=window.collision;
try{BASE_COLLISION=window.collision||collision}catch(_){}
let BASE_MOVE=window.move;
try{BASE_MOVE=window.move||move}catch(_){}

const ASSETS={
  grass:'assets/v114/grass_ground_chibi3d_v114.png',
  pavers:'assets/v114/town_pavers_chibi3d_v114.png',
  dirt:'assets/v114/dirt_road_chibi3d_v114.png',
  tallGrass:'assets/v114/tall_grass_patch_chibi3d_v114.png',
  biomeAtlas:'assets/v114/biome_props_atlas_chibi3d_v114.png',
  tree:'assets/v112/tree_chibi3d_v112.png',
  bush:'assets/v113/bush_chibi3d_v113.png'
};
const IMG={};
for(const [key,src] of Object.entries(ASSETS)){const image=new Image();image.decoding='async';image.src=src;IMG[key]=image}
const ready=image=>!!(image?.complete&&image.naturalWidth&&image.naturalHeight);
const creator=()=>/CREATEUR/i.test(location.pathname);
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const exitTarget=e=>String(e?.to||e?.target||'');
const key=(x,y)=>x+','+y;
const unkey=s=>String(s).split(',').map(Number);
const sideOpposite={north:'south',south:'north',west:'east',east:'west'};
const repairState={running:false,last:0,scenes:0};
const motionDiagnostics={zone:'',x:0,y:0,corridor:false,baseBlocked:false};

function hash(value){let h=2166136261>>>0;for(const c of String(value||'')){h^=c.charCodeAt(0);h=Math.imul(h,16777619)}return h>>>0}
function rng(seed){let x=seed>>>0||1;return()=>{x=Math.imul(x^x>>>15,1|x);x^=x+Math.imul(x^x>>>7,61|x);return((x^x>>>14)>>>0)/4294967296}}
function camera(sc){const mw=Number(sc?.width)||1800,mh=Number(sc?.height)||1100;return{camX:Math.max(0,Math.min(Math.max(0,mw-1600),(Number(state?.x)||800)-800)),camY:Math.max(0,Math.min(Math.max(0,mh-1000),(Number(state?.y)||500)-500)),sx:.6,sy:.6}}
function themeKey(sc){return String(sc?.v112Theme||sc?.biome||sc?.v105dStyle||'prairie').replace(/^legend_/,'')}

const THEME_TINT={
  prairie:['#7fc85c','rgba(255,239,151,.16)'],forest:['#3f8a54','rgba(13,76,53,.25)'],nature:['#3f8a54','rgba(13,76,53,.25)'],spore:['#428a5b','rgba(109,73,144,.14)'],
  redrock:['#9d7b52','rgba(188,83,44,.23)'],autumn:['#9d8b50','rgba(202,95,39,.19)'],mountain:['#7e9582','rgba(77,91,100,.20)'],roche:['#7e9582','rgba(77,91,100,.20)'],
  azure:['#58a78d','rgba(51,171,204,.18)'],river:['#5aa884','rgba(38,147,166,.15)'],lake:['#5aa884','rgba(38,147,166,.15)'],eau:['#5aa884','rgba(38,147,166,.15)'],
  solar:['#afbd60','rgba(255,204,74,.24)'],luminous:['#9fca78','rgba(255,229,109,.22)'],lumiere:['#9fca78','rgba(255,229,109,.22)'],dawn:['#9ec576','rgba(255,151,167,.21)'],
  modern:['#6eaaa2','rgba(88,176,205,.18)'],industrial:['#788066','rgba(151,84,42,.22)'],feu:['#8e7651','rgba(211,74,36,.24)'],
  capital:['#61706c','rgba(57,42,76,.18)'],shadow:['#536152','rgba(92,45,135,.28)'],ombre:['#536152','rgba(92,45,135,.28)'],
  harbor:['#6bb88c','rgba(45,177,197,.16)'],coast:['#6bb88c','rgba(45,177,197,.16)'],island:['#72bc92','rgba(67,181,188,.14)'],
  mist:['#799a8c','rgba(198,229,237,.23)'],air:['#799a8c','rgba(198,229,237,.23)'],goldpeaks:['#91a69a','rgba(255,224,136,.16)'],glace:['#91a69a','rgba(197,237,255,.28)'],simdor:['#748b7d','rgba(95,111,125,.17)']
};
function tintFor(sc){return THEME_TINT[themeKey(sc)]||THEME_TINT.prairie}

function canonicalLinks(){
  const source=[...(window.ValdoraProV112?.links||[])];
  if(!source.some(link=>link.id==='route4bis'))source.push({id:'route4bis',a:'town4',b:'town5',name:'Route 4 bis — Lac des Reflets',kind:'lake',theme:'lake',as:'south',bs:'south',ra:'west',rb:'east'});
  return source.map(link=>link.id==='route_m3'?{...link,as:'north'}:{...link});
}
function upsertExit(sc,to,label,side,meta={}){
  if(!sc)return null;sc.exits=Array.isArray(sc.exits)?sc.exits:[];
  let first=null;const kept=[];
  for(const ex of sc.exits){if(exitTarget(ex)!==to)kept.push(ex);else if(!first)first=ex}
  const value={...(first||{}),to,label,side,...meta,v114Canonical:true};kept.push(value);sc.exits=kept;return value;
}
function ensureCanonicalExits(){
  const links=canonicalLinks();
  for(const link of links){
    const route=SCENES?.[link.id],a=SCENES?.[link.a],b=SCENES?.[link.b];if(!route||!a||!b)continue;
    route.kind='route';route.name=link.name;route.v114Canonical=true;
    route.exits=(route.exits||[]).filter(ex=>[link.a,link.b].includes(exitTarget(ex)));
    const main=/^route(?:[0-9]|1[0-3])$/.test(link.id);
    upsertExit(route,link.a,a.name||link.a,link.ra,main?{v78End:'A'}:{});
    upsertExit(route,link.b,b.name||link.b,link.rb,main?{v78End:'B'}:{});
    upsertExit(a,link.id,link.name,link.as,main?{v78Enter:'A'}:{});
    upsertExit(b,link.id,link.name,link.bs,main?{v78Enter:'B'}:{});
  }
}

function insideExpandedBuilding(sc,gx,gy,pad=38){
  const C=Number(sc.v105dCell)||220,x=(gx+.5)*C,y=(gy+.5)*C;
  return(sc.buildings||[]).some(b=>x>Number(b.x||0)-pad&&x<Number(b.x||0)+Number(b.w||0)+pad&&y>Number(b.y||0)-pad&&y<Number(b.y||0)+Number(b.h||0)+pad);
}
function rebuildGraph(sc){
  const graph=new Map(),roads=sc.v105dRoad||new Set();
  for(const value of roads){const [x,y]=unkey(value),next=[];for(const [dx,dy] of[[0,-1],[1,0],[0,1],[-1,0]]){const k=key(x+dx,y+dy);if(roads.has(k))next.push(k)}graph.set(String(value),next)}
  sc.v105dGraph=graph;
}
function ensureRoadSet(sc){
  if(!sc||!['town','route'].includes(sc.kind))return false;if(sc.v105dRoad instanceof Set)return true;
  const C=Number(sc.v105dCell)||220,cols=Math.max(3,Math.round((Number(sc.width)||1800)/C)),rows=Math.max(3,Math.round((Number(sc.height)||1100)/C)),roads=new Set();
  const source=Array.isArray(sc.v104Path)&&sc.v104Path.length?sc.v104Path:Array.isArray(sc.v76Path)?sc.v76Path:[];
  const points=source.map(p=>Array.isArray(p)?p:[p?.x,p?.y]).filter(p=>Number.isFinite(Number(p[0]))&&Number.isFinite(Number(p[1]))).map(p=>({x:clamp(Math.floor(Number(p[0])/C),0,cols-1),y:clamp(Math.floor(Number(p[1])/C),0,rows-1)}));
  if(!points.length)points.push({x:Math.floor(cols/2),y:Math.floor(rows/2)});
  const addLine=(a,b)=>{let x=a.x,y=a.y;roads.add(key(x,y));while(x!==b.x){x+=Math.sign(b.x-x);roads.add(key(x,y))}while(y!==b.y){y+=Math.sign(b.y-y);roads.add(key(x,y))}};
  for(let i=1;i<points.length;i++)addLine(points[i-1],points[i]);if(points.length===1)roads.add(key(points[0].x,points[0].y));
  sc.v105dCell=C;sc.v105dCore=Number(sc.v105dCore)||Math.round(C*.64);sc.v105dCols=cols;sc.v105dRows=rows;sc.width=cols*C;sc.height=rows*C;sc.v105dRoad=roads;return true;
}
function connectCell(sc,target){
  const roads=sc.v105dRoad;if(!(roads instanceof Set))return false;
  const C=Number(sc.v105dCell)||220,cols=Math.max(1,Math.round((Number(sc.width)||C)/C)),rows=Math.max(1,Math.round((Number(sc.height)||C)/C));
  const start=key(target.gx,target.gy);if(roads.has(start))return true;
  const queue=[[target.gx,target.gy]],seen=new Set([start]),prev=new Map(),dirs=[[0,-1],[1,0],[0,1],[-1,0]];let found='';
  while(queue.length){const [x,y]=queue.shift(),here=key(x,y);if(roads.has(here)){found=here;break}for(const [dx,dy] of dirs){const nx=x+dx,ny=y+dy,nk=key(nx,ny);if(nx<0||ny<0||nx>=cols||ny>=rows||seen.has(nk))continue;if(nk!==start&&insideExpandedBuilding(sc,nx,ny,30))continue;seen.add(nk);prev.set(nk,here);queue.push([nx,ny])}}
  if(!found)return false;for(let cursor=found;cursor;cursor=prev.get(cursor)){roads.add(cursor);if(cursor===start)break}return roads.has(start)
}
function setPortalGeometry(sc,ex,side,index,count){
  const C=Number(sc.v105dCell)||220,core=Number(sc.v105dCore)||C*.64,cols=Math.max(1,Math.round((Number(sc.width)||C)/C)),rows=Math.max(1,Math.round((Number(sc.height)||C)/C));
  const span=clamp(Math.round(core*1.08),132,Math.round(C*.88));
  const slot=(limit)=>clamp(Math.round(((index+1)/(count+1))*(limit-1)),1,Math.max(1,limit-2));
  let gx=0,gy=0,cx=0,cy=0;
  if(side==='north'||side==='south'){
    gx=slot(cols);gy=side==='north'?0:rows-1;cx=(gx+.5)*C;cy=(gy+.5)*C;
    Object.assign(ex,{x:cx-span/2,y:side==='north'?0:(Number(sc.height)||rows*C)-C,w:span,h:C,side});
  }else{
    gy=slot(rows);gx=side==='west'?0:cols-1;cx=(gx+.5)*C;cy=(gy+.5)*C;
    Object.assign(ex,{x:side==='west'?0:(Number(sc.width)||cols*C)-C,y:cy-span/2,w:C,h:span,side});
  }
  const reach=Math.max(C*1.45,260);if(side==='north')ex.v114Corridor={x:ex.x-24,y:0,w:ex.w+48,h:C+reach};else if(side==='south')ex.v114Corridor={x:ex.x-24,y:(Number(sc.height)||rows*C)-C-reach,w:ex.w+48,h:C+reach};else if(side==='west')ex.v114Corridor={x:0,y:ex.y-24,w:C+reach,h:ex.h+48};else ex.v114Corridor={x:(Number(sc.width)||cols*C)-C-reach,y:ex.y-24,w:C+reach,h:ex.h+48};
  ex.v114RoadCell=key(gx,gy);ex.v114RoadCenter={x:cx,y:cy};const targetKey=key(gx,gy),roads=sc.v105dRoad,connected=connectCell(sc,{gx,gy});
  if(!connected&&roads instanceof Set&&roads.size){let nearest=null,best=Infinity;for(const value of roads){const [rx,ry]=unkey(value),d=Math.abs(rx-gx)+Math.abs(ry-gy);if(d<best){best=d;nearest={x:rx,y:ry}}}if(nearest){let x=gx,y=gy;roads.add(targetKey);while(x!==nearest.x){x+=Math.sign(nearest.x-x);roads.add(key(x,y))}while(y!==nearest.y){y+=Math.sign(nearest.y-y);roads.add(key(x,y))}}}
  if(roads instanceof Set)roads.add(targetKey);return{gx,gy};
}
function alignDoorRoads(sc){
  if(sc.kind!=='town'||!(sc.v105dRoad instanceof Set))return;
  const C=Number(sc.v105dCell)||220,cols=Math.max(1,Math.round(sc.width/C)),rows=Math.max(1,Math.round(sc.height/C));
  for(const b of sc.buildings||[]){
    const x=Number(b.doorX??(Number(b.x||0)+Number(b.w||0)/2)),doorY=Number(b.doorY??(Number(b.y||0)+Number(b.h||0)));
    let roadY=Number(b.v105dRoadY);if(!Number.isFinite(roadY))roadY=doorY+Math.max(72,C*.45);
    const gx=clamp(Math.floor(x/C),0,cols-1),gy=clamp(Math.floor(roadY/C),0,rows-1);connectCell(sc,{gx,gy});
    b.doorX=x;b.doorY=doorY;b.v105dRoadY=(gy+.5)*C;b.v114DoorZone={x:x-Math.max(76,(sc.v105dCore||140)*.48),y:doorY-30,w:Math.max(152,(sc.v105dCore||140)*.96),h:Math.max(90,b.v105dRoadY-doorY+(sc.v105dCore||140)*.55)};
  }
}
function planScenePortals(sc){
  if(!ensureRoadSet(sc)||!sc.v105dCell)return;
  const groups={north:[],south:[],west:[],east:[]};
  for(const ex of sc.exits||[]){const side=groups[ex.side]?ex.side:'east';groups[side].push(ex)}
  for(const [side,list] of Object.entries(groups))for(let i=0;i<list.length;i++)setPortalGeometry(sc,list[i],side,i,list.length);
  alignDoorRoads(sc);rebuildGraph(sc);
}
function repairLake(){
  if(!SCENES)return;const sc=SCENES.route4bis||(SCENES.route4bis={kind:'route',trainers:[],objects:[],obstacles:[],mObstacles:[],grass:[],exits:[]});
  sc.kind='route';sc.name='Route 4 bis — Lac des Reflets';sc.routeKind='lake';sc.biome='lake';sc.v112Theme='lake';sc.width=3600;sc.height=1800;sc.v105dCell=240;sc.v105dCore=156;sc.v105dCols=15;sc.v105dRows=8;
  const roads=new Set();for(let x=0;x<15;x++)roads.add(key(x,3));sc.v105dRoad=roads;sc.v104Path=[[120,840],[3480,840]];sc.v76Path=sc.v104Path;sc.kPath=sc.v104Path;sc.grass=[];sc.v105dTrees=[];sc.v105dBushes=[];
  upsertExit(sc,'town4',SCENES.town4?.name||'Belrive','west');upsertExit(sc,'town5',SCENES.town5?.name||'Soléria','east');
}

function rectDistance(x,y,r){const dx=Math.max(Number(r.x||0)-x,0,x-(Number(r.x||0)+Number(r.w||0))),dy=Math.max(Number(r.y||0)-y,0,y-(Number(r.y||0)+Number(r.h||0)));return Math.hypot(dx,dy)}
function roadDistance(sc,x,y){
  if(!(sc.v105dRoad instanceof Set)||!sc.v105dRoad.size)return Infinity;const C=Number(sc.v105dCell)||220,core=Number(sc.v105dCore)||C*.64;let best=Infinity;
  for(const value of sc.v105dRoad){const [gx,gy]=unkey(value),cx=(gx+.5)*C,cy=(gy+.5)*C;best=Math.min(best,Math.max(0,Math.hypot(x-cx,y-cy)-core*.55))}return best;
}
function clearDecorationPoint(sc,x,y,clearance=105){
  if(x<70||y<70||x>sc.width-70||y>sc.height-70||roadDistance(sc,x,y)<clearance)return false;
  const railY=Number(sc.rail?.y);if(Number.isFinite(railY)&&Math.abs(y-railY)<190)return false;
  if((sc.buildings||[]).some(b=>rectDistance(x,y,{x:Number(b.x||0)-90,y:Number(b.y||0)-90,w:Number(b.w||0)+180,h:Number(b.h||0)+180})<clearance*.25))return false;
  if((sc.exits||[]).some(ex=>rectDistance(x,y,{x:Number(ex.x||0)-120,y:Number(ex.y||0)-120,w:Number(ex.w||0)+240,h:Number(ex.h||0)+240})<clearance*.35))return false;
  return true;
}
function atlasIndex(sc){
  const t=themeKey(sc);if(['harbor','coast','island','lake','azure','river','eau'].includes(t))return 0;if(['mountain','redrock','autumn','roche','simdor'].includes(t))return 1;if(['forest','nature','spore','prairie'].includes(t))return 2;if(['mist','air','goldpeaks','glace'].includes(t))return 3;if(['shadow','ombre','capital'].includes(t))return 4;if(['industrial','feu','modern'].includes(t))return 5;if(t==='dawn')return 6;return 7;
}
function decorateScene(sc,zone){
  if(!sc||sc.v116Sanctuary||state?.zone==='route4bis'&&zone==='route4bis'||zone==='route4bis'||zone==='temple_final'||!(sc.v105dRoad instanceof Set))return;
  const layoutSignature=`${LAYOUT_REVISION}|${sc.width}|${sc.height}|${sc.v105dRoad.size}`;
  if(sc.v114RoadReference===sc.v105dRoad&&sc.v114LayoutSignature===layoutSignature)return;
  sc.v114RoadReference=sc.v105dRoad;sc.v114LayoutSignature=layoutSignature;
  const random=rng(hash('V114|'+zone)),trees=[],bushes=[],props=[],C=Number(sc.v105dCell)||220;
  const treeTarget=sc.kind==='town'?(sc.megacity?32:26):38,edgeStep=Math.max(300,C*1.45);
  const tryTree=(x,y)=>{if(clearDecorationPoint(sc,x,y,125)&&!trees.some(t=>Math.hypot(t.x-x,t.y-y)<150)){trees.push({x,y,s:.78+random()*.31,v:Math.floor(random()*4),v114:true});return true}return false};
  for(let x=110;x<sc.width-110;x+=edgeStep){tryTree(x+(random()-.5)*90,105+random()*80);tryTree(x+(random()-.5)*90,sc.height-105-random()*80)}
  for(let y=220;y<sc.height-220;y+=edgeStep){tryTree(105+random()*80,y+(random()-.5)*90);tryTree(sc.width-105-random()*80,y+(random()-.5)*90)}
  for(let tries=0;trees.length<treeTarget&&tries<5000;tries++)tryTree(80+random()*(sc.width-160),80+random()*(sc.height-160));
  const roadCells=[...sc.v105dRoad];for(let i=0;i<roadCells.length&&bushes.length<(sc.kind==='town'?44:34);i++){
    if((i+hash(zone))%3)continue;const [gx,gy]=unkey(roadCells[i]),cx=(gx+.5)*C,cy=(gy+.5)*C,off=(sc.v105dCore||C*.64)*.68+58,axis=(hash(zone+'|'+i)&1),sign=(hash(i+'|'+zone)&2)?1:-1,x=cx+(axis?off*sign:0),y=cy+(axis?0:off*sign);
    if(clearDecorationPoint(sc,x,y,55)&&!bushes.some(b=>Math.hypot(b.x-x,b.y-y)<86))bushes.push({x,y,r:12+random()*5,v114:true});
  }
  for(let tries=0;props.length<(sc.kind==='town'?10:16)&&tries<3500;tries++){
    const x=90+random()*(sc.width-180),y=90+random()*(sc.height-180);if(!clearDecorationPoint(sc,x,y,150)||trees.some(t=>Math.hypot(t.x-x,t.y-y)<130)||props.some(p=>Math.hypot(p.x-x,p.y-y)<210))continue;props.push({x,y,s:.78+random()*.30,index:atlasIndex(sc)});
  }
  const grass=[];if(sc.kind==='route'&&!sc.legendaryBiome){for(let tries=0;grass.length<7&&tries<2500;tries++){const w=C*(1.05+random()*.55),h=C*(.70+random()*.35),x=C+random()*Math.max(C,sc.width-w-C*2),y=C+random()*Math.max(C,sc.height-h-C*2);if(roadDistance(sc,x+w/2,y+h/2)<Math.max(w,h)*.65||grass.some(g=>rectDistance(x+w/2,y+h/2,g)<90))continue;grass.push({x,y,w,h,wild:true,v114:true})}}
  sc.v105dTrees=trees;sc.v105dBushes=bushes;sc.v114Props=props;if(sc.kind==='route'&&!sc.legendaryBiome)sc.grass=grass;
}
function decorateAll(){for(const [zone,sc] of Object.entries(SCENES||{}))if(sc?.kind==='town'||sc?.kind==='route')decorateScene(sc,zone)}

function repairTopology(){
  if(repairState.running||typeof SCENES!=='object'||!SCENES)return false;repairState.running=true;
  try{ensureCanonicalExits();repairLake();for(const sc of Object.values(SCENES))planScenePortals(sc);decorateAll();repairState.last=Date.now();repairState.scenes=Object.keys(SCENES).length;repairState.running=false;publishAudit();return true}finally{repairState.running=false}
}

function imagePattern(image,scale=.16){
  if(!ready(image))return null;const pattern=ctx.createPattern(image,'repeat');try{pattern.setTransform(new DOMMatrix().scale(scale))}catch(_){}return pattern;
}
function drawGround(sc){
  const [base,tint]=tintFor(sc),cam=camera(sc);ctx.fillStyle=base;ctx.fillRect(0,0,960,600);
  if(ready(IMG.grass)){
    const tile=250,ox=-((cam.camX*.6)%tile)-tile,oy=-((cam.camY*.6)%tile)-tile;ctx.save();ctx.globalAlpha=.78;
    const t=themeKey(sc);if(['shadow','ombre','capital'].includes(t))ctx.filter='hue-rotate(55deg) saturate(.72) brightness(.65)';else if(['redrock','autumn','feu','industrial'].includes(t))ctx.filter='hue-rotate(320deg) saturate(.72) brightness(.88)';else if(['mist','air','goldpeaks','glace','modern'].includes(t))ctx.filter='hue-rotate(22deg) saturate(.58) brightness(1.05)';else if(['solar','dawn','luminous','lumiere'].includes(t))ctx.filter='hue-rotate(345deg) saturate(.82) brightness(1.10)';
    for(let y=oy;y<650;y+=tile)for(let x=ox;x<1010;x+=tile)ctx.drawImage(IMG.grass,x,y,tile+1,tile+1);ctx.restore();
  }
  ctx.fillStyle=tint;ctx.fillRect(0,0,960,600);const light=ctx.createLinearGradient(0,0,960,600);light.addColorStop(0,'rgba(255,255,220,.15)');light.addColorStop(.5,'rgba(255,255,255,0)');light.addColorStop(1,'rgba(16,45,39,.18)');ctx.fillStyle=light;ctx.fillRect(0,0,960,600);
}
function parseCell(value){const [x,y]=unkey(value);return{x,y}}
function roadNetwork(sc,camX,camY,sx,sy){
  const C=Number(sc.v105dCell)||220,cells=[...(sc.v105dRoad||[])].map(parseCell),roads=sc.v105dRoad||new Set(),center=v=>v*C+C/2;ctx.beginPath();
  for(const c of cells){const x=(center(c.x)-camX)*sx,y=(center(c.y)-camY)*sy;let linked=false;if(roads.has(key(c.x+1,c.y))){ctx.moveTo(x,y);ctx.lineTo((center(c.x+1)-camX)*sx,y);linked=true}if(roads.has(key(c.x,c.y+1))){ctx.moveTo(x,y);ctx.lineTo(x,(center(c.y+1)-camY)*sy);linked=true}if(!linked&&!roads.has(key(c.x-1,c.y))&&!roads.has(key(c.x,c.y-1))){ctx.moveTo(x-.01,y);ctx.lineTo(x+.01,y)}}
}
function drawRoads(sc,camX,camY,sx,sy,dirt){
  const C=Number(sc.v105dCell)||220,core=Number(sc.v105dCore)||C*.64,S=(sx+sy)/2;ctx.save();ctx.lineCap='round';ctx.lineJoin='round';
  roadNetwork(sc,camX,camY,sx,sy);ctx.strokeStyle='rgba(19,43,38,.36)';ctx.lineWidth=(core+42)*S;ctx.shadowColor='rgba(7,29,25,.36)';ctx.shadowBlur=9;ctx.shadowOffsetY=6;ctx.stroke();ctx.shadowBlur=0;ctx.shadowOffsetY=0;
  roadNetwork(sc,camX,camY,sx,sy);ctx.strokeStyle=dirt?'#806039':'#bbb7aa';ctx.lineWidth=(core+24)*S;ctx.stroke();
  const pattern=imagePattern(dirt?IMG.dirt:IMG.pavers,dirt?.16:.13);roadNetwork(sc,camX,camY,sx,sy);ctx.strokeStyle=pattern||(dirt?'#c89657':'#dfd9ca');ctx.lineWidth=core*S;ctx.stroke();
  roadNetwork(sc,camX,camY,sx,sy);ctx.strokeStyle=dirt?'rgba(255,230,168,.24)':'rgba(255,255,245,.32)';ctx.lineWidth=Math.max(2,core*S*.76);ctx.setLineDash(dirt?[34*S,23*S]:[26*S,14*S]);ctx.stroke();ctx.setLineDash([]);ctx.restore();
}
function drawTree(t,camX,camY,sx,sy){if(typeof LEGACY.drawTree==='function')return LEGACY.drawTree(t,camX,camY,sx,sy)}
function drawBush(b,camX,camY,sx,sy){if(typeof LEGACY.drawBush==='function')return LEGACY.drawBush(b,camX,camY,sx,sy)}
function drawGrass(sc,camX,camY,sx,sy){
  if(!ready(IMG.tallGrass))return typeof LEGACY.drawGrass==='function'?LEGACY.drawGrass(sc,camX,camY,sx,sy):undefined;ctx.save();
  for(const patch of sc.grass||[]){const x0=(patch.x-camX)*sx,y0=(patch.y-camY)*sy,w=patch.w*sx,h=patch.h*sy;if(x0+w<0||x0>960||y0+h<0||y0>600)continue;ctx.fillStyle='rgba(24,79,39,.24)';ctx.beginPath();ctx.roundRect(x0+3,y0+h*.57,w-6,h*.34,14);ctx.fill();const spriteW=82*sx,spriteH=57*sy,stepX=Math.max(34,spriteW*.64),stepY=Math.max(23,spriteH*.54);let row=0;for(let y=y0+h-spriteH*.72;y>y0-spriteH*.08;y-=stepY,row++){for(let x=x0-(row%2)*stepX*.35;x<x0+w;x+=stepX){ctx.save();ctx.globalAlpha=.94;ctx.drawImage(IMG.tallGrass,x,y,spriteW,spriteH);ctx.restore()}}}
  ctx.restore();
}
function drawBiomeProps(sc){
  if(!ready(IMG.biomeAtlas)||!Array.isArray(sc.v114Props))return;const cam=camera(sc),sw=IMG.biomeAtlas.naturalWidth/4,sh=IMG.biomeAtlas.naturalHeight/2;
  for(const p of sc.v114Props){const x=(p.x-cam.camX)*cam.sx,y=(p.y-cam.camY)*cam.sy,s=(p.s||1)*cam.sx,w=235*s,h=168*s;if(x+w/2<-40||x-w/2>1000||y<-120||y-h>720)continue;const col=p.index%4,row=Math.floor(p.index/4);ctx.save();ctx.shadowColor='rgba(13,35,27,.25)';ctx.shadowBlur=7;ctx.shadowOffsetY=5;ctx.drawImage(IMG.biomeAtlas,col*sw,row*sh,sw,sh,x-w/2,y-h*.76,w,h);ctx.restore()}
}
function overlay(){
  if(typeof scene!=='undefined'&&scene!=='world')return;const sc=typeof currentScene==='function'?currentScene():SCENES?.[state?.zone];if(!sc)return;
  if(state.zone==='route4bis'){if(typeof LEGACY.overlay==='function')LEGACY.overlay();return}
  if(typeof LEGACY.overlay==='function')LEGACY.overlay();ctx.save();drawBiomeProps(sc);ctx.restore();
}
function drawCitadel(sc,camX,camY,sx,sy){return typeof LEGACY.drawCitadel==='function'?LEGACY.drawCitadel(sc,camX,camY,sx,sy):undefined}

function doorPoint(b){return{x:Number(b?.doorX??(Number(b?.x||0)+Number(b?.w||0)/2)),y:Number(b?.doorY??(Number(b?.y||0)+Number(b?.h||0))),roadY:Number(b?.v105dRoadY)}}
function doorZone(b,sc){
  if(b?.v114DoorZone)return b.v114DoorZone;const d=doorPoint(b),core=Number(sc?.v105dCore)||140,roadY=Number.isFinite(d.roadY)?d.roadY:d.y+Math.max(80,core*.75);return{x:d.x-Math.max(76,core*.48),y:d.y-30,w:Math.max(152,core*.96),h:Math.max(100,roadY-d.y+core*.55)};
}
function pointInRect(x,y,r){return x>=r.x&&x<=r.x+r.w&&y>=r.y&&y<=r.y+r.h}
function nearDoorV114(){
  if(typeof scene!=='undefined'&&scene!=='world')return null;const sc=typeof currentScene==='function'?currentScene():SCENES?.[state?.zone];if(!sc||sc.kind!=='town')return null;let best=null,score=Infinity;
  for(const b of sc.buildings||[]){const zone=doorZone(b,sc),d=doorPoint(b);if(!pointInRect(Number(state.x),Number(state.y),zone))continue;const s=Math.abs(Number(state.x)-d.x)+Math.abs(Number(state.y)-d.y)*.22;if(s<score){score=s;best=b}}
  return best;
}
function enterBuildingV114(b){const api=window.ValdoraInteriorV109V||window.ValdoraBuildingV109I;if(!b||typeof api?.enter!=='function')return false;const ok=api.enter(b);if(ok){try{toast?.((b.label||b.name||'Bâtiment')+' — entrée ouverte')}catch(_){}}return !!ok}
function interactV114(){
  if(typeof scene!=='undefined'&&scene==='interior'){
    try{if(LEGACY.tryMuseumDirector?.())return true}catch(_){}const api=window.ValdoraInteriorV109V||window.ValdoraBuildingV109I;if(typeof api?.interact==='function')return api.interact();
  }
  if(typeof scene!=='undefined'&&scene==='world'){
    const dialogBox=document.getElementById('dialog');if(dialogBox?.classList.contains('show'))return false;
    try{if(typeof tryFinalAltarV77==='function'&&tryFinalAltarV77())return true}catch(_){}
    const b=nearDoorV114();if(b)return enterBuildingV114(b);
    const sc=typeof currentScene==='function'?currentScene():SCENES?.[state?.zone];
    try{if(sc?.kind==='town'&&typeof v107dBusStop==='function'){const stop=v107dBusStop(sc,state.zone);if(stop&&typeof near==='function'&&near(stop,125)&&window.ValdoraGameplayV106Y?.openBus){window.ValdoraGameplayV106Y.openBus();return true}}}catch(_){}
    try{const o=sc?.kind==='town'&&typeof townNearest==='function'?townNearest():sc?.kind==='route'&&typeof routeNearest==='function'?routeNearest():null;if(o&&typeof interactFind==='function'){interactFind(o);return true}}catch(_){}
    let n=null;try{n=typeof nearNPC==='function'?nearNPC():null}catch(_){}if(n){try{faceNPCToPlayer?.(n)}catch(_){}if(n.taron&&typeof interactTaron==='function'){interactTaron(n);return true}try{if(typeof questInteractionV106C==='function'&&questInteractionV106C(n))return true}catch(_){}try{if(typeof v107bAubeNPCInteraction==='function'&&v107bAubeNPCInteraction(n))return true}catch(_){}try{if(typeof v109kTalkToOutdoorNPC==='function'&&v109kTalkToOutdoorNPC(n))return true}catch(_){}try{dialog?.('<b>'+(n.name||n.dialog||'Habitant')+'</b><br>'+(typeof npcDialogue==='function'?npcDialogue(n):'Bonjour !'));return true}catch(_){}}
    if(sc&&['route','temple'].includes(sc.kind)){try{const t=typeof nearTrainer==='function'?nearTrainer():null;if(t){faceNPCToPlayer?.(t);if(t.finalBoss&&typeof templeGuardsClearedV77==='function'&&!templeGuardsClearedV77()){dialog?.('<b>Maître du Cœur</b><br>Tu n’as pas encore vaincu les dix Gardiens du Sanctuaire.');return true}if(state.trainerWins?.[t.id])dialog?.('<b>'+(t.dialog||'Dresseur')+'</b><br>'+(typeof trainerAfterLine==='function'?trainerAfterLine(t):'Bien joué pour notre dernier combat.'));else dialog?.('<b>'+(t.dialog||'Dresseur')+'</b><br>'+(typeof trainerChallengeLine==='function'?trainerChallengeLine(t):'Tu veux te mesurer à moi ?'),()=>startTrainer413?.(t));return true}}catch(_){}}
  }
  return false;
}
function collisionV114(x,y,ox,oy){
  if(typeof scene!=='undefined'&&scene==='world'){
    const sc=typeof currentScene==='function'?currentScene():SCENES?.[state?.zone];if(!sc)return false;Object.assign(motionDiagnostics,{zone:String(state?.zone||''),x:Math.round(x),y:Math.round(y),corridor:false,baseBlocked:false});
    if(x<22||y<22||x>Number(sc.width||1800)-22||y>Number(sc.height||1100)-22)return true;
    for(const ex of sc.exits||[])if(ex.v114Corridor&&pointInRect(x,y,ex.v114Corridor)){motionDiagnostics.corridor=true;return false}
    if(sc.kind==='town')for(const b of sc.buildings||[])if(pointInRect(x,y,doorZone(b,sc)))return false;
    if(sc.kind==='temple'&&typeof finalTempleCollisionV77==='function'&&finalTempleCollisionV77(x,y))return true;
    if(sc.kind==='town'){
      for(const b of sc.buildings||[]){const r={x:Number(b.x||0)-10,y:Number(b.y||0)-12,w:Number(b.w||0)+20,h:Number(b.h||0)+28};if(pointInRect(x,y,r))return true}
      try{if(typeof busStopHitV107E==='function'&&busStopHitV107E(x,y,state.zone)&&!busStopHitV107E(ox,oy,state.zone))return true}catch(_){}
      try{const tr=typeof trainMotion==='function'?trainMotion(sc):null;if(tr&&pointInRect(x,y,tr))return true}catch(_){}
    }
    for(const t of sc.v105dTrees||[])if(Math.hypot(x-Number(t.x||0),y-Number(t.y||0))<38*Number(t.s||1))return true;
    if(sc.kind==='route')for(const ob of sc.mObstacles||sc.obstacles||[]){const r=Number(ob.r||30);if(Math.hypot(x-Number(ob.x||0),y-Number(ob.y||0))<r+20)return true}
    const npcs=[];try{if(typeof sceneNPCs==='function')npcs.push(...sceneNPCs(sc,state.zone))}catch(_){}try{if(!npcs.length&&typeof currentNPCs==='function')npcs.push(...currentNPCs())}catch(_){}
    for(const n of npcs){const nd=Math.hypot(x-Number(n.x||0),y-Number(n.y||0)),od=Math.hypot(Number(ox)-Number(n.x||0),Number(oy)-Number(n.y||0));if(nd<34&&nd<=od+.01)return true}
    try{const n=typeof currentTaronNPC==='function'?currentTaronNPC():null;if(n){const nd=Math.hypot(x-n.x,y-n.y),od=Math.hypot(ox-n.x,oy-n.y);if(nd<38&&nd<=od+.01)return true}}catch(_){}
    try{for(const t of typeof currentTrainers==='function'?currentTrainers():[]){const nd=Math.hypot(x-t.x,y-t.y),od=Math.hypot(ox-t.x,oy-t.y);if(nd<36&&nd<=od+.01)return true}}catch(_){}
    return false;
  }
  return false;
}
function progressionGate(from,to){try{return window.ValdoraProgressionV107K?.gate?.(from,to)||null}catch(_){return null}}
function pushBack(ex){const d=58;if(ex.side==='north')state.y+=d;else if(ex.side==='south')state.y-=d;else if(ex.side==='west')state.x+=d;else state.x-=d}
function checkPortalV114(){
  if(typeof scene!=='undefined'&&scene!=='world'||Date.now()<Number(state?.v114PortalLock||0))return false;const sc=typeof currentScene==='function'?currentScene():SCENES?.[state?.zone];if(!sc)return false;
  const ex=(sc.exits||[]).find(e=>pointInRect(Number(state.x),Number(state.y),e));if(!ex)return false;const from=String(state.zone||''),to=exitTarget(ex);if(!to||!SCENES?.[to]){try{toast?.('Cette liaison n’est pas encore disponible.')}catch(_){}pushBack(ex);return false}
  if(ex.finalTemple&&typeof finalTempleAvailableV77==='function'&&!finalTempleAvailableV77()){try{toast?.(typeof v83CitadelGateText==='function'?v83CitadelGateText():'La Citadelle est encore verrouillée.')}catch(_){}pushBack(ex);return false}
  const gate=progressionGate(from,to);if(gate&&!creator()){pushBack(ex);try{toast?.(gate);dialog?.('<b>Progression verrouillée</b><br><br>'+gate)}catch(_){}return false}
  state.v114PortalLock=Date.now()+520;let go=window.enterZone;try{go=window.enterZone||enterZone}catch(_){};return typeof go==='function'?go(to,sideOpposite[ex.side]):false;
}
function moveV114(dx,dy,dir){
  state.dir=dir;if(typeof scene!=='undefined'&&scene!=='world'||typeof trainerEvent!=='undefined'&&trainerEvent)return false;
  if(state.zone==='temple_final'&&typeof finalTempleCollisionV77==='function'&&finalTempleCollisionV77(state.x,state.y)){state.x=1200;state.y=1900;try{toast?.('Position rétablie dans la Citadelle.')}catch(_){}}
  const speed=state.bike?1.55:1,nx=Number(state.x)+Number(dx)*speed,ny=Number(state.y)+Number(dy)*speed;
  if(collisionV114(nx,ny,state.x,state.y)){try{lastMove=Date.now();const n=typeof npcCollision==='function'?npcCollision(nx,ny):null;if(n&&Math.random()<.12)toast?.('E / Entrée pour parler à '+n.name)}catch(_){}return false}
  try{recordFollowerStep?.()}catch(_){}state.x=nx;state.y=ny;try{lastMove=Date.now()}catch(_){}if(checkPortalV114())return true;
  const kind=typeof currentScene==='function'?currentScene()?.kind:null;if(state.team?.length){if((kind==='route'||kind==='temple')&&!(typeof trainerEvent!=='undefined'&&trainerEvent))try{checkTrainerDetection?.()}catch(_){}if((kind==='route'||state.zone==='town0')&&!(typeof trainerEvent!=='undefined'&&trainerEvent))try{v104EncounterStep?.()}catch(_){}}
  return true;
}

function installHooks(){
  const v116=window.ValdoraWorldV116;
  const worldInteract=v116?.active&&typeof v116.interact==='function'?v116.interact:interactV114;
  const worldCollision=v116?.active&&typeof v116.collision==='function'?v116.collision:collisionV114;
  const worldMove=v116?.active&&typeof v116.move==='function'?v116.move:moveV114;
  window.interact=worldInteract;try{interact=worldInteract}catch(_){}window.collision=worldCollision;try{collision=worldCollision}catch(_){}window.checkPortal=checkPortalV114;try{checkPortal=checkPortalV114}catch(_){}window.move=worldMove;try{move=worldMove}catch(_){}window.v109eNearEntryBuilding=nearDoorV114;window.nearBuilding=nearDoorV114;
}
interactV114.__v107dInteract=true;interactV114.__v113Museum=true;collisionV114.__v107eBusCollision=true;
function enforceIdentity(){
  if(document.documentElement.dataset.valdoraV115||window.ValdoraWorldV115?.active)return;
  const title='Éclats Sauvages — Valdora V114 Routes & Biomes';if(document.title!==title)document.title=title;const brand=document.querySelector('.brand'),label=`ÉCLATS SAUVAGES — VALDORA V114 — ${creator()?'CRÉATEUR':'JOUEUR'}`;if(brand&&brand.textContent!==label)brand.textContent=label;
  document.documentElement.dataset.valdoraVersion=VERSION;document.documentElement.dataset.valdoraPolish=VERSION;const map=document.getElementById('v111MapBtn');if(map&&map.textContent!=='Carte du monde V114')map.textContent='Carte du monde V114';
}
function portalAligned(sc,ex){if(!(sc?.v105dRoad instanceof Set)||!ex?.v114RoadCell)return false;return sc.v105dRoad.has(ex.v114RoadCell)}
function audit(){
  const issues=[],portals=[],doors=[];for(const [zone,sc] of Object.entries(SCENES||{})){
    const seen=new Set();for(const ex of sc.exits||[]){const to=exitTarget(ex),sig=[Math.round(ex.x),Math.round(ex.y),Math.round(ex.w),Math.round(ex.h)].join('|');if(seen.has(sig))issues.push(`${zone}: portails superposés`);seen.add(sig);const aligned=!(sc.v105dRoad instanceof Set)||portalAligned(sc,ex);if(sc.v105dRoad instanceof Set&&!aligned)issues.push(`${zone} -> ${to}: sortie hors route`);if(to&&SCENES[to]&&!SCENES[to].exits?.some(back=>exitTarget(back)===zone))issues.push(`${zone} -> ${to}: retour absent`);portals.push({zone,to,side:ex.side,cell:ex.v114RoadCell,aligned})}
    for(const b of sc.buildings||[]){const z=doorZone(b,sc),ok=z.w>=140&&z.h>=90;doors.push({zone,label:b.label||b.name||b.type,ok});if(!ok)issues.push(`${zone}: accès bâtiment trop étroit`)}
    for(const p of sc.v114Props||[]){if(roadDistance(sc,p.x,p.y)<120)issues.push(`${zone}: décor posé sur la route`);const railY=Number(sc.rail?.y);if(Number.isFinite(railY)&&Math.abs(p.y-railY)<170)issues.push(`${zone}: décor posé sur la voie ferrée`)}
  }
  const soleria=SCENES?.town5?.exits||[],lake=soleria.find(e=>exitTarget(e)==='route4bis'),pass=soleria.find(e=>exitTarget(e)==='route_m3');if(!lake||!pass||lake.side===pass.side)issues.push('Soléria: lac et Passe de Soléria non séparés');
  const assets={};for(const [k,img] of Object.entries(IMG)){assets[k]=ready(img);if(!assets[k])issues.push('asset '+k+' indisponible')}
  const v116=window.ValdoraWorldV116,expectedMove=v116?.active?v116.move:moveV114,expectedCollision=v116?.active?v116.collision:collisionV114,expectedInteract=v116?.active?v116.interact:interactV114;
  const hooks={move:window.move===expectedMove,collision:window.collision===expectedCollision,portal:window.checkPortal===checkPortalV114,interaction:window.interact===expectedInteract};for(const [name,active] of Object.entries(hooks))if(!active)issues.push(`moteur ${name} remplacé par un ancien module`);
  return{version:VERSION,ok:issues.length===0,issues,portalCount:portals.length,portals,doorCount:doors.length,doors,soleria:{lake:lake?.side,simdor:pass?.side},assets,hooks,motion:{...motionDiagnostics},biomes:Object.values(SCENES||{}).filter(sc=>Array.isArray(sc.v114Props)&&sc.v114Props.length).length,repair:{...repairState}};
}
function publishAudit(){try{const a=audit();document.documentElement.dataset.valdoraV114Audit=JSON.stringify({version:a.version,ok:a.ok,issues:a.issues,portalCount:a.portalCount,doorCount:a.doorCount,soleria:a.soleria,assets:a.assets,hooks:a.hooks,motion:a.motion,biomes:a.biomes,repair:a.repair})}catch(_){} }
function hideGameOverlays(){for(const id of['title','menuov','starterov','dialog','battleUI']){const el=document.getElementById(id);if(el)el.style.setProperty('display','none','important')}}
function previewPortal(zone,to){
  if(!creator()||!SCENES?.[zone])return false;repairTopology();const sc=SCENES[zone],ex=(sc.exits||[]).find(e=>exitTarget(e)===to);if(!ex)return false;try{scene='world';building=null}catch(_){}state.zone=zone;const cx=ex.x+ex.w/2,cy=ex.y+ex.h/2,pad=Math.max(80,(sc.v105dCell||220)*.58);if(ex.side==='north'){state.x=cx;state.y=ex.y+ex.h+pad}else if(ex.side==='south'){state.x=cx;state.y=ex.y-pad}else if(ex.side==='west'){state.x=ex.x+ex.w+pad;state.y=cy}else{state.x=ex.x-pad;state.y=cy}try{hideGameOverlays();resetFollowerTrail?.();toast?.(`${sc.name} — approche de ${ex.label||to}`)}catch(_){}return true;
}
function previewBuilding(zone,kind='lab'){
  if(!creator()||!SCENES?.[zone])return false;repairTopology();const sc=SCENES[zone],b=(sc.buildings||[]).find(x=>[x.type,x.urbanType,x.id,x.label].join(' ').toLowerCase().includes(kind))||(sc.buildings||[])[0];if(!b)return false;try{scene='world';building=null}catch(_){}state.zone=zone;const d=doorPoint(b);state.x=d.x;state.y=Number.isFinite(d.roadY)?d.roadY:d.y+110;state.dir=3;try{hideGameOverlays();resetFollowerTrail?.();toast?.(`Test porte — ${b.label||b.type}`)}catch(_){}return true;
}
function installCreatorTool(){
  if(!creator()||document.getElementById('v114-diagnostic'))return;
  const panel=document.createElement('div');panel.id='v114-diagnostic-panel';panel.style.cssText='position:fixed;inset:0;z-index:99998;background:rgba(3,14,21,.78);display:none;place-items:center;padding:20px';panel.innerHTML='<div style="width:min(580px,94vw);background:#f7f1df;color:#173548;border:4px solid #173548;border-radius:22px;padding:22px;box-shadow:0 24px 70px #0009"><h2 style="margin:0 0 8px">Diagnostic routes et bâtiments</h2><p>Choisis un parcours ciblé. Le joueur sera placé sur le chemin praticable, juste avant le point à tester.</p><div style="display:grid;grid-template-columns:1fr 1fr;gap:10px"><button data-v114-portal="town5|route4bis">Soléria → Lac</button><button data-v114-portal="route4bis|town5">Lac → Soléria</button><button data-v114-portal="town4|route4bis">Belrive → Lac</button><button data-v114-portal="route4bis|town4">Lac → Belrive</button><button data-v114-building="town0|lab">Laboratoire</button><button data-v114-building="town5|museum">Musée</button></div><button data-v114-close style="margin-top:12px;width:100%">Fermer</button></div>';document.body.appendChild(panel);
  panel.querySelectorAll('button').forEach(el=>el.style.cssText='padding:12px;border:2px solid #173548;border-radius:11px;background:#fff;color:#173548;font-weight:900;cursor:pointer');panel.querySelector('[data-v114-close]').onclick=()=>panel.style.display='none';panel.querySelectorAll('[data-v114-portal]').forEach(el=>el.onclick=()=>{const [zone,to]=el.dataset.v114Portal.split('|');panel.style.display='none';previewPortal(zone,to)});panel.querySelectorAll('[data-v114-building]').forEach(el=>el.onclick=()=>{const [zone,kind]=el.dataset.v114Building.split('|');panel.style.display='none';previewBuilding(zone,kind)});
  const button=document.createElement('button');button.id='v114-diagnostic';button.type='button';button.textContent='Diagnostic V114';button.style.cssText='position:fixed;left:14px;bottom:60px;z-index:85000;border:2px solid #ffd77c;background:#473817;color:#fff;border-radius:12px;padding:10px 14px;font:900 12px Segoe UI;box-shadow:0 7px 22px #0018;cursor:pointer';button.onclick=()=>panel.style.display='grid';document.body.appendChild(button);
}
function install(){repairTopology();installHooks();if(!document.documentElement.dataset.valdoraV115&&!window.ValdoraWorldV115?.active)window.ValdoraPolishV113=api;enforceIdentity();installCreatorTool();publishAudit()}

const api={active:true,version:VERSION,assets:ASSETS,repairTopology,drawGround,drawRoads,drawTree,drawBush,drawGrass,drawCitadel,overlay,nearDoor:nearDoorV114,enterBuilding:enterBuildingV114,checkPortal:checkPortalV114,previewPortal,previewBuilding,enforceIdentity,audit};
window.ValdoraWorldV114=api;window.ValdoraPolishV113=api;
install();if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install);[300,950,2200,4800,8200,11200,15000].forEach(ms=>setTimeout(install,ms));setInterval(()=>{try{repairTopology();installHooks();if(!document.documentElement.dataset.valdoraV115&&!window.ValdoraWorldV115?.active)window.ValdoraPolishV113=api;enforceIdentity();installCreatorTool();publishAudit()}catch(e){console.warn('V114 maintenance',e)}},2400);
console.log('V114 : sorties alignées, bâtiments accessibles et biomes chibi 3D actifs.');
})();
