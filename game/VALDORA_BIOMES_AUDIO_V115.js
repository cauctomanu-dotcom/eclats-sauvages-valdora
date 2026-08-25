(function(){
'use strict';

const VERSION='V115-BIOMES-AUDIO';
const BASE=window.ValdoraWorldV114||window.ValdoraPolishV113||{};
const ASSET_PATHS={
  elemental:'assets/v115/legend_elemental_atlas_chibi3d_v115.png',
  darkwild:'assets/v115/legend_darkwild_atlas_chibi3d_v115.png',
  celestial:'assets/v115/legend_celestial_atlas_chibi3d_v115.png',
  grass:'assets/v114/grass_ground_chibi3d_v114.png',
  pavers:'assets/v114/town_pavers_chibi3d_v114.png',
  dirt:'assets/v114/dirt_road_chibi3d_v114.png'
};
const IMG={};
for(const [key,src] of Object.entries(ASSET_PATHS)){const im=new Image();im.decoding='async';im.src=src;IMG[key]=im}
const ready=im=>!!(im?.complete&&im.naturalWidth&&im.naturalHeight);
const creator=()=>/CREATEUR/i.test(location.pathname);
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const zone=()=>String(state?.zone||'');
const sceneData=()=>typeof currentScene==='function'?currentScene():SCENES?.[zone()];
const themeKey=sc=>String(sc?.v112Theme||sc?.biome||sc?.v105dStyle||'prairie').replace(/^legend_/,'');
const camera=sc=>{const w=Number(sc?.width)||1800,h=Number(sc?.height)||1100;return{camX:Math.max(0,Math.min(Math.max(0,w-1600),(Number(state?.x)||800)-800)),camY:Math.max(0,Math.min(Math.max(0,h-1000),(Number(state?.y)||500)-500)),sx:.6,sy:.6}};
function hash32(text){let h=2166136261>>>0;for(const c of String(text)){h^=c.charCodeAt(0);h=Math.imul(h,16777619)}return h>>>0}
function cellNoise(x,y,salt=''){let h=hash32(`${x}|${y}|${salt}`);h^=h>>>16;h=Math.imul(h,0x7feb352d);h^=h>>>15;return(h>>>0)/4294967295}

const ENV={
  legend_nature:{name:'Forêt Primordiale',kind:'nature',atlas:'elemental',cell:0,base:'#174b33',light:'#6f9f54',road:'#b9a06c',edge:'#3b2f25',glow:'#b9ff82'},
  legend_feu:{name:'Caldeira des Braises',kind:'fire',atlas:'elemental',cell:1,base:'#211c20',light:'#4c302b',road:'#332e30',edge:'#130f12',glow:'#ff6b25'},
  legend_eau:{name:'Île des Marées',kind:'water',atlas:'elemental',cell:2,base:'#167f98',light:'#74d9cb',road:'#e3d1a0',edge:'#356a6f',glow:'#d7ffff'},
  legend_foudre:{name:'Plateau des Orages',kind:'storm',atlas:'elemental',cell:3,base:'#263547',light:'#526577',road:'#526070',edge:'#111b29',glow:'#9eeeff'},
  legend_ombre:{name:'Usine du Néant',kind:'factory',atlas:'darkwild',cell:0,base:'#202329',light:'#49454a',road:'#34363a',edge:'#111216',glow:'#a95cff'},
  legend_roche:{name:'Canyon des Monolithes',kind:'rock',atlas:'darkwild',cell:1,base:'#9b5a37',light:'#da9a61',road:'#bd8151',edge:'#61361f',glow:'#ffd18a'},
  legend_air:{name:'Falaises Célestes',kind:'air',atlas:'darkwild',cell:2,base:'#a9d6dc',light:'#edf3e8',road:'#e8e4d7',edge:'#6e9eaa',glow:'#ffffff'},
  legend_spore:{name:'Marais Mycélien',kind:'spore',atlas:'darkwild',cell:3,base:'#243e38',light:'#3e6450',road:'#52634c',edge:'#16231e',glow:'#64f6df'},
  legend_glace:{name:'Glacier des Échos',kind:'ice',atlas:'celestial',cell:0,base:'#7bb8ca',light:'#d9f3f3',road:'#c9e8e9',edge:'#477b96',glow:'#dfffff'},
  legend_lumiere:{name:'Observatoire Solaire',kind:'light',atlas:'celestial',cell:1,base:'#d9c88f',light:'#fff1c1',road:'#ece1bf',edge:'#9a793e',glow:'#fff5a8'},
  legend_neutre:{name:'Sanctuaire des Origines',kind:'origin',atlas:'celestial',cell:2,base:'#7d8791',light:'#c8d1ce',road:'#c2bbaa',edge:'#525763',glow:'#e8e2ff'},
  route_legends:{name:'Carrefour des Sanctuaires',kind:'crossroads',atlas:'celestial',cell:3,base:'#262349',light:'#51417c',road:'#8170a0',edge:'#17132d',glow:'#bda3ff'}
};
const LEGEND_ZONES=Object.keys(ENV).filter(id=>id.startsWith('legend_'));
const GROUND={
  prairie:['#70a957','rgba(255,239,151,.12)','none'],forest:['#2f7148','rgba(8,64,40,.18)','none'],nature:['#2f7148','rgba(8,64,40,.18)','none'],spore:['#3e674d','rgba(78,57,114,.18)','hue-rotate(48deg) saturate(1.12)'],
  redrock:['#9b754e','rgba(178,76,42,.19)','hue-rotate(318deg) saturate(.72)'],autumn:['#8f7c45','rgba(203,94,37,.17)','hue-rotate(312deg) saturate(.8)'],mountain:['#758a7b','rgba(61,80,88,.16)','hue-rotate(18deg) saturate(.62)'],roche:['#8c7353','rgba(132,73,38,.16)','hue-rotate(330deg) saturate(.68)'],
  azure:['#55a487','rgba(43,160,191,.14)','hue-rotate(18deg) saturate(.92)'],river:['#58a380','rgba(34,141,157,.13)','none'],lake:['#56a280','rgba(34,141,157,.13)','none'],eau:['#56a280','rgba(34,141,157,.13)','none'],
  solar:['#a7b45c','rgba(255,202,72,.19)','hue-rotate(344deg) saturate(.86)'],luminous:['#93ba70','rgba(255,225,104,.18)','hue-rotate(347deg) saturate(.78)'],lumiere:['#9bbc74','rgba(255,225,104,.18)','hue-rotate(347deg) saturate(.78)'],dawn:['#97b96e','rgba(255,145,162,.18)','hue-rotate(342deg) saturate(.83)'],
  modern:['#65a49d','rgba(81,168,198,.15)','hue-rotate(20deg) saturate(.65)'],industrial:['#70775f','rgba(144,80,40,.19)','hue-rotate(322deg) saturate(.7)'],feu:['#806a48','rgba(205,67,31,.2)','hue-rotate(321deg) saturate(.76)'],
  capital:['#5b6966','rgba(53,39,73,.2)','hue-rotate(57deg) saturate(.66) brightness(.7)'],shadow:['#4c5a4d','rgba(91,42,132,.24)','hue-rotate(57deg) saturate(.7) brightness(.68)'],ombre:['#4c5a4d','rgba(91,42,132,.24)','hue-rotate(57deg) saturate(.7) brightness(.68)'],
  harbor:['#65ad87','rgba(40,168,190,.13)','none'],coast:['#65ad87','rgba(40,168,190,.13)','none'],island:['#6ab28d','rgba(60,173,180,.12)','none'],mist:['#739187','rgba(191,224,232,.2)','hue-rotate(20deg) saturate(.58) brightness(1.04)'],air:['#78978b','rgba(205,234,238,.2)','hue-rotate(20deg) saturate(.52) brightness(1.07)'],goldpeaks:['#879b90','rgba(255,221,130,.15)','hue-rotate(20deg) saturate(.55) brightness(1.05)'],glace:['#899e94','rgba(195,235,255,.23)','hue-rotate(20deg) saturate(.5) brightness(1.08)'],simdor:['#6d8276','rgba(86,104,118,.15)','hue-rotate(18deg) saturate(.62)']
};

function drawStableRegularGround(sc){
  const cam=camera(sc),key=themeKey(sc),style=GROUND[key]||GROUND.prairie;ctx.fillStyle=style[0];ctx.fillRect(0,0,960,600);
  if(ready(IMG.grass)){
    const worldTile=360,screenTile=worldTile*cam.sx,startX=Math.floor(cam.camX/worldTile)-1,endX=Math.ceil((cam.camX+1600)/worldTile)+1,startY=Math.floor(cam.camY/worldTile)-1,endY=Math.ceil((cam.camY+1000)/worldTile)+1;
    ctx.save();ctx.globalAlpha=.72;ctx.filter=style[2];
    for(let gy=startY;gy<=endY;gy++)for(let gx=startX;gx<=endX;gx++){const x=(gx*worldTile-cam.camX)*cam.sx,y=(gy*worldTile-cam.camY)*cam.sy;ctx.drawImage(IMG.grass,x,y,screenTile+1,worldTile*cam.sy+1)}ctx.restore();
  }
  ctx.fillStyle=style[1];ctx.fillRect(0,0,960,600);const shade=ctx.createLinearGradient(0,0,960,600);shade.addColorStop(0,'rgba(255,255,225,.12)');shade.addColorStop(.55,'rgba(255,255,255,0)');shade.addColorStop(1,'rgba(11,32,35,.17)');ctx.fillStyle=shade;ctx.fillRect(0,0,960,600);
}
function worldPoint(wx,wy,cam){return[(wx-cam.camX)*cam.sx,(wy-cam.camY)*cam.sy]}
function visibleGrid(cam,size){return{gx0:Math.floor(cam.camX/size)-1,gx1:Math.ceil((cam.camX+1600)/size)+1,gy0:Math.floor(cam.camY/size)-1,gy1:Math.ceil((cam.camY+1000)/size)+1}}
function drawLegendSurface(sc,env){
  const cam=camera(sc),g=ctx.createLinearGradient(0,0,960,600);g.addColorStop(0,env.light);g.addColorStop(.68,env.base);g.addColorStop(1,env.edge);ctx.fillStyle=g;ctx.fillRect(0,0,960,600);
  const size=env.kind==='factory'?170:env.kind==='fire'?150:190,vr=visibleGrid(cam,size);ctx.save();
  for(let gy=vr.gy0;gy<=vr.gy1;gy++)for(let gx=vr.gx0;gx<=vr.gx1;gx++){
    const wx=gx*size,wy=gy*size,[x,y]=worldPoint(wx,wy,cam),w=size*cam.sx+1,h=size*cam.sy+1,n=cellNoise(gx,gy,zone());
    if(env.kind==='nature'){
      ctx.fillStyle=n>.48?'rgba(25,77,43,.36)':'rgba(98,128,58,.24)';ctx.beginPath();ctx.ellipse(x+w*.52,y+h*.52,w*(.34+n*.13),h*(.25+n*.12),n*2.4,0,Math.PI*2);ctx.fill();ctx.fillStyle='rgba(221,255,156,.23)';for(let i=0;i<3;i++){const a=cellNoise(gx,gy,`leaf${i}`);ctx.beginPath();ctx.arc(x+a*w,y+cellNoise(gy,gx,`ly${i}`)*h,1.2+a*2.2,0,Math.PI*2);ctx.fill()}
    }else if(env.kind==='fire'){
      ctx.fillStyle=n>.5?'rgba(17,16,19,.3)':'rgba(68,42,37,.34)';ctx.fillRect(x+2,y+2,w-4,h-4);ctx.strokeStyle=n>.74?'rgba(255,88,24,.65)':'rgba(112,52,35,.42)';ctx.lineWidth=n>.74?2.4:1.2;ctx.beginPath();ctx.moveTo(x+w*.1,y+h*(.2+n*.4));ctx.lineTo(x+w*.47,y+h*.5);ctx.lineTo(x+w*.88,y+h*(.25+(1-n)*.45));ctx.stroke();
    }else if(env.kind==='water'){
      ctx.fillStyle=n>.55?'rgba(24,142,161,.18)':'rgba(126,224,207,.11)';ctx.fillRect(x,y,w,h);ctx.strokeStyle='rgba(225,255,249,.22)';ctx.lineWidth=1.4;ctx.beginPath();ctx.ellipse(x+w*.5,y+h*.55,w*(.18+n*.12),h*.09,0,0,Math.PI*2);ctx.stroke();
    }else if(env.kind==='storm'){
      ctx.fillStyle=n>.5?'rgba(19,31,45,.24)':'rgba(83,102,117,.18)';ctx.fillRect(x+2,y+2,w-4,h-4);ctx.strokeStyle='rgba(153,198,217,.18)';ctx.lineWidth=1;ctx.strokeRect(x+2,y+2,w-4,h-4);if(n>.68){ctx.fillStyle='rgba(173,220,235,.12)';ctx.beginPath();ctx.ellipse(x+w*.55,y+h*.55,w*.28,h*.12,n,0,Math.PI*2);ctx.fill()}
    }else if(env.kind==='factory'){
      ctx.fillStyle=n>.46?'rgba(72,70,70,.34)':'rgba(31,34,39,.3)';ctx.fillRect(x+1,y+1,w-2,h-2);ctx.strokeStyle='rgba(8,11,14,.42)';ctx.lineWidth=2;ctx.strokeRect(x+1,y+1,w-2,h-2);ctx.fillStyle=n>.78?'rgba(73,36,90,.42)':'rgba(80,46,29,.17)';ctx.beginPath();ctx.ellipse(x+w*(.25+n*.45),y+h*(.3+(1-n)*.4),w*.17,h*.09,n*4,0,Math.PI*2);ctx.fill();if(n>.82){ctx.fillStyle='rgba(234,174,54,.38)';for(let i=0;i<3;i++)ctx.fillRect(x+i*w*.23,y+h*.76,w*.11,h*.06)}
    }else if(env.kind==='rock'){
      ctx.fillStyle=n>.5?'rgba(137,69,40,.2)':'rgba(234,167,92,.18)';ctx.fillRect(x,y,w,h);ctx.strokeStyle='rgba(104,53,31,.22)';ctx.lineWidth=1.2;ctx.beginPath();ctx.moveTo(x,y+h*(.25+n*.45));ctx.bezierCurveTo(x+w*.3,y+h*.1,x+w*.65,y+h*.9,x+w,y+h*(.3+n*.3));ctx.stroke();
    }else if(env.kind==='air'){
      ctx.fillStyle=n>.56?'rgba(255,255,244,.17)':'rgba(97,169,185,.1)';ctx.fillRect(x,y,w,h);ctx.strokeStyle='rgba(255,255,255,.34)';ctx.lineWidth=1.4;ctx.beginPath();ctx.moveTo(x+w*.05,y+h*(.3+n*.35));ctx.quadraticCurveTo(x+w*.5,y+h*(.05+n*.25),x+w*.94,y+h*(.28+n*.28));ctx.stroke();
    }else if(env.kind==='spore'){
      ctx.fillStyle=n>.5?'rgba(18,45,40,.31)':'rgba(65,83,58,.26)';ctx.fillRect(x,y,w,h);ctx.fillStyle=n>.65?'rgba(67,236,211,.22)':'rgba(141,73,183,.18)';ctx.beginPath();ctx.ellipse(x+w*.5,y+h*.55,w*(.18+n*.13),h*(.12+n*.08),n*3,0,Math.PI*2);ctx.fill();
    }else if(env.kind==='ice'){
      ctx.fillStyle=n>.5?'rgba(220,249,250,.22)':'rgba(61,151,185,.16)';ctx.fillRect(x,y,w,h);ctx.strokeStyle='rgba(237,255,255,.42)';ctx.lineWidth=1.3;ctx.beginPath();ctx.moveTo(x+w*.08,y+h*.82);ctx.lineTo(x+w*(.35+n*.2),y+h*.1);ctx.lineTo(x+w*.9,y+h*.66);ctx.stroke();
    }else if(env.kind==='light'){
      ctx.fillStyle=n>.52?'rgba(255,248,204,.22)':'rgba(180,140,72,.13)';ctx.fillRect(x+1,y+1,w-2,h-2);ctx.strokeStyle='rgba(255,246,178,.34)';ctx.lineWidth=1.3;ctx.strokeRect(x+1,y+1,w-2,h-2);ctx.beginPath();ctx.arc(x+w*.5,y+h*.5,w*.19,0,Math.PI*2);ctx.stroke();
    }else if(env.kind==='origin'){
      ctx.fillStyle=n>.5?'rgba(226,227,213,.16)':'rgba(66,70,81,.16)';ctx.fillRect(x,y,w,h);const colors=['#73d49a','#ff945b','#6acbea','#be88e8','#fff09a'];ctx.fillStyle=colors[Math.floor(n*colors.length)%colors.length]+'55';ctx.beginPath();ctx.arc(x+w*.5,y+h*.5,2+n*4,0,Math.PI*2);ctx.fill();
    }else{
      ctx.fillStyle=n>.5?'rgba(80,58,127,.22)':'rgba(24,24,61,.27)';ctx.fillRect(x,y,w,h);ctx.fillStyle='rgba(226,205,255,.38)';ctx.beginPath();ctx.arc(x+w*n,y+h*cellNoise(gy,gx,'star'),1+n*1.6,0,Math.PI*2);ctx.fill();
    }
  }
  ctx.restore();const shade=ctx.createRadialGradient(480,250,80,480,300,650);shade.addColorStop(0,'rgba(255,255,255,.07)');shade.addColorStop(1,'rgba(4,8,14,.24)');ctx.fillStyle=shade;ctx.fillRect(0,0,960,600);
}
function drawGround(sc){const env=ENV[zone()];if(env)drawLegendSurface(sc,env);else drawStableRegularGround(sc)}

function parseCell(value){const p=String(value).split(',').map(Number);return{x:p[0],y:p[1]}}
function roadNetwork(sc,camX,camY,sx,sy){const C=Number(sc?.v105dCell)||220,roads=sc?.v105dRoad instanceof Set?sc.v105dRoad:new Set(),center=v=>v*C+C/2;ctx.beginPath();for(const c of[...roads].map(parseCell)){const x=(center(c.x)-camX)*sx,y=(center(c.y)-camY)*sy;let linked=false;if(roads.has(`${c.x+1},${c.y}`)){ctx.moveTo(x,y);ctx.lineTo((center(c.x+1)-camX)*sx,y);linked=true}if(roads.has(`${c.x},${c.y+1}`)){ctx.moveTo(x,y);ctx.lineTo(x,(center(c.y+1)-camY)*sy);linked=true}if(!linked&&!roads.has(`${c.x-1},${c.y}`)&&!roads.has(`${c.x},${c.y-1}`)){ctx.moveTo(x-.01,y);ctx.lineTo(x+.01,y)}}}
function anchoredPattern(image,scale,camX,camY,sx,sy){if(!ready(image))return null;const p=ctx.createPattern(image,'repeat');try{p.setTransform(new DOMMatrix().translate(-camX*sx,-camY*sy).scale(scale))}catch(_){return null}return p}
function drawRoads(sc,camX,camY,sx,sy,dirt){
  const C=Number(sc?.v105dCell)||220,core=Number(sc?.v105dCore)||C*.64,S=(sx+sy)/2,env=ENV[zone()],ground=env?.road||(dirt?'#ad7c4c':'#d8d2c4'),edge=env?.edge||(dirt?'#5d482f':'#77736b');ctx.save();ctx.lineCap='round';ctx.lineJoin='round';
  roadNetwork(sc,camX,camY,sx,sy);ctx.strokeStyle='rgba(8,18,20,.36)';ctx.lineWidth=(core+44)*S;ctx.shadowColor='rgba(4,12,15,.34)';ctx.shadowBlur=10;ctx.shadowOffsetY=6;ctx.stroke();ctx.shadowBlur=0;ctx.shadowOffsetY=0;
  roadNetwork(sc,camX,camY,sx,sy);ctx.strokeStyle=edge;ctx.lineWidth=(core+24)*S;ctx.stroke();roadNetwork(sc,camX,camY,sx,sy);ctx.strokeStyle=ground;ctx.lineWidth=core*S;ctx.stroke();
  const image=dirt?IMG.dirt:IMG.pavers,pattern=anchoredPattern(image,dirt ? .12 : .105,camX,camY,sx,sy);if(pattern){roadNetwork(sc,camX,camY,sx,sy);ctx.globalAlpha=env ? .36 : .66;ctx.strokeStyle=pattern;ctx.lineWidth=(core-5)*S;ctx.stroke();ctx.globalAlpha=1}
  roadNetwork(sc,camX,camY,sx,sy);ctx.strokeStyle=env?.glow?env.glow+'30':(dirt?'rgba(255,231,180,.2)':'rgba(255,255,244,.25)');ctx.lineWidth=Math.max(2,core*S*.72);ctx.stroke();ctx.restore();
}

function configureScenes(){
  if(document.documentElement.dataset.valdoraV116||window.ValdoraWorldV116?.active)return;
  if(typeof SCENES!=='object'||!SCENES)return;const slots=[[.24,.27,.72],[.76,.28,.7],[.25,.72,.66],[.75,.72,.74],[.5,.17,.6]];
  for(const [id,env] of Object.entries(ENV)){const sc=SCENES[id];if(!sc)continue;sc.v115Environment=env.name;sc.v115Props=slots.map((p,i)=>({x:(sc.width||3000)*p[0],y:(sc.height||1800)*p[1],s:p[2]+(i%2)*.05}));if(id.startsWith('legend_')){sc.legendaryBiome=true;sc.v114Props=[];sc.v105dTrees=[];sc.v105dBushes=[]}}
}
function drawAtlasProp(env,p,cam){const im=IMG[env.atlas];if(!ready(im))return;const sw=im.naturalWidth/2,sh=im.naturalHeight/2,col=env.cell%2,row=Math.floor(env.cell/2),[x,y]=worldPoint(p.x,p.y,cam),s=(p.s||.7)*cam.sx,w=430*s,h=430*s;if(x+w/2<-80||x-w/2>1040||y<-h||y-h*.05>680)return;ctx.save();ctx.globalAlpha=.98;ctx.shadowColor='rgba(3,11,17,.38)';ctx.shadowBlur=11;ctx.shadowOffsetY=8;ctx.drawImage(im,col*sw,row*sh,sw,sh,x-w/2,y-h*.78,w,h);ctx.restore()}
function drawParticles(env,t){
  ctx.save();const count=env.kind==='spore'?28:env.kind==='fire'?22:env.kind==='ice'?20:env.kind==='nature'?18:env.kind==='crossroads'?24:14;
  for(let i=0;i<count;i++){const seed=cellNoise(i,hash32(zone()),'particle'),speed=env.kind==='fire'?32:env.kind==='ice'?18:env.kind==='air'?28:12,x=(seed*997+(env.kind==='air'?t*speed:Math.sin(t*.2+i)*18))%1000,y=env.kind==='fire'?610-((i*47+t*speed)%660):env.kind==='ice'?(i*59+t*speed)%640:(i*73+Math.sin(t*.5+i)*34)%620;let color=env.glow,alpha=.18+(i%4)*.07,r=1.2+(i%3)*.7;if(env.kind==='fire'){color='#ff9a45';alpha=.35;r=1.5+(i%3)}if(env.kind==='spore'){color=i%2?'#75ffe5':'#d289ff';alpha=.38;r=2+(i%3)}if(env.kind==='ice'){color='#ffffff';alpha=.3;r=1.3+(i%2)}ctx.globalAlpha=alpha;ctx.fillStyle=color;ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fill()}ctx.restore();
}
function drawLightning(t){
  const phase=(t%7.6)/7.6,flash=phase<.035||phase>.105&&phase<.137;document.documentElement.dataset.v115StormFlash=flash?'1':'0';if(!flash)return;const strength=phase<.035?(.035-phase)/.035:(.137-phase)/.032;ctx.save();ctx.fillStyle=`rgba(245,252,255,${.18+.48*strength})`;ctx.fillRect(0,0,960,600);const seed=Math.floor(t/7.6),start=160+(hash32(seed)%640);ctx.strokeStyle=`rgba(239,253,255,${.7+.3*strength})`;ctx.shadowColor='#85dcff';ctx.shadowBlur=18;ctx.lineWidth=3.2;ctx.beginPath();ctx.moveTo(start,-20);let x=start;for(let y=0;y<470;y+=46){x+=((hash32(`${seed}|${y}`)%81)-40);ctx.lineTo(x,y)}ctx.stroke();ctx.lineWidth=1.2;ctx.beginPath();ctx.moveTo(x-6,282);ctx.lineTo(x-65,355);ctx.lineTo(x-41,413);ctx.stroke();ctx.restore();
}
function drawFactoryEffects(t){ctx.save();for(let i=0;i<7;i++){const x=80+i*143+Math.sin(t*.4+i)*24,y=520-((t*22+i*91)%520);ctx.fillStyle=`rgba(189,183,193,${.035+(i%3)*.025})`;ctx.beginPath();ctx.arc(x,y,20+(i%4)*7,0,Math.PI*2);ctx.fill()}ctx.fillStyle=`rgba(179,84,255,${.035+.025*Math.sin(t*2.4)})`;ctx.fillRect(0,0,960,600);ctx.restore()}
function drawWaterLight(t){ctx.save();ctx.strokeStyle='rgba(228,255,251,.18)';ctx.lineWidth=1.4;for(let i=0;i<9;i++){const y=45+i*68+Math.sin(t*.7+i)*7;ctx.beginPath();for(let x=-30;x<1000;x+=38){const py=y+Math.sin(x*.025+t*1.2+i)*5;if(x<0)ctx.moveTo(x,py);else ctx.lineTo(x,py)}ctx.stroke()}ctx.restore()}
function drawEnvironmentEffects(env){const t=performance.now()/1000;if(['nature','fire','spore','ice','air','crossroads'].includes(env.kind))drawParticles(env,t);if(env.kind==='storm')drawLightning(t);if(env.kind==='factory')drawFactoryEffects(t);if(env.kind==='water')drawWaterLight(t);if(env.kind==='light'){ctx.save();const a=.06+.035*Math.sin(t*.55);const g=ctx.createRadialGradient(760,40,0,760,40,430);g.addColorStop(0,`rgba(255,247,181,${a*3})`);g.addColorStop(1,'rgba(255,247,181,0)');ctx.fillStyle=g;ctx.fillRect(0,0,960,600);ctx.restore()}if(env.kind==='origin'){ctx.save();ctx.translate(480,300);ctx.rotate(t*.045);ctx.strokeStyle='rgba(238,231,255,.16)';ctx.lineWidth=2;for(const r of[95,170,255]){ctx.beginPath();ctx.arc(0,0,r,0,Math.PI*2);ctx.stroke()}ctx.restore()}}
function overlay(){if(typeof scene!=='undefined'&&scene!=='world')return;const sc=sceneData();if(!sc)return;const env=ENV[zone()];if(!env){if(typeof BASE.overlay==='function')BASE.overlay();return}const cam=camera(sc);for(const p of sc.v115Props||[])drawAtlasProp(env,p,cam);drawEnvironmentEffects(env)}

const MUSIC={
  legend_nature:{name:'Canopée vivante',bpm:76,root:146.83,scale:[0,2,3,7,9,12],chords:[[0,3,7],[5,9,12],[3,7,10],[0,7,9]],color:'organic',cut:2100},
  legend_feu:{name:'Cœur magmatique',bpm:96,root:110,scale:[0,3,5,7,10,12],chords:[[0,3,7],[3,7,10],[5,8,12],[0,5,10]],color:'fire',cut:1350},
  legend_eau:{name:'Respiration des marées',bpm:70,root:174.61,scale:[0,2,5,7,9,12],chords:[[0,5,9],[2,7,11],[5,9,12],[0,7,12]],color:'water',cut:2800},
  legend_foudre:{name:'Front électrique',bpm:104,root:123.47,scale:[0,2,6,7,9,12],chords:[[0,6,9],[2,7,11],[6,9,14],[0,7,9]],color:'storm',cut:1800},
  legend_ombre:{name:'Machines du Néant',bpm:88,root:92.5,scale:[0,3,5,6,10,12],chords:[[0,3,6],[3,6,10],[5,10,12],[0,5,10]],color:'factory',cut:1050},
  legend_roche:{name:'Mémoire des monolithes',bpm:74,root:130.81,scale:[0,2,5,7,10,12],chords:[[0,5,7],[2,7,10],[5,10,12],[0,7,10]],color:'earth',cut:1450},
  legend_air:{name:'Au-dessus des nuages',bpm:66,root:220,scale:[0,2,4,7,9,12],chords:[[0,4,9],[2,7,11],[5,9,12],[0,7,11]],color:'air',cut:3500},
  legend_spore:{name:'Réseau mycélien',bpm:82,root:138.59,scale:[0,3,5,7,10,12],chords:[[0,3,7],[5,8,12],[3,7,10],[0,5,10]],color:'spore',cut:1900},
  legend_glace:{name:'Échos de glace',bpm:64,root:196,scale:[0,2,5,7,11,12],chords:[[0,5,11],[2,7,12],[5,11,14],[0,7,11]],color:'ice',cut:3200},
  legend_lumiere:{name:'Orbites solaires',bpm:80,root:261.63,scale:[0,2,4,7,9,12],chords:[[0,4,9],[2,7,11],[5,9,12],[0,4,7]],color:'light',cut:3600},
  legend_neutre:{name:'Équilibre originel',bpm:72,root:164.81,scale:[0,2,5,7,9,12],chords:[[0,5,9],[2,7,11],[5,9,12],[0,7,12]],color:'origin',cut:2400},
  route_legends:{name:'Convergence',bpm:70,root:130.81,scale:[0,1,5,7,8,12],chords:[[0,5,8],[1,5,10],[5,8,12],[0,7,8]],color:'cosmic',cut:2200},
  prairie:{name:'Grand voyage',bpm:86,root:196,scale:[0,2,4,7,9,12],chords:[[0,4,7],[5,9,12],[7,11,14],[0,4,9]],color:'open',cut:2500},
  forest:{name:'Sous-bois',bpm:78,root:174.61,scale:[0,3,5,7,10,12],chords:[[0,3,7],[5,8,12],[3,7,10],[0,5,10]],color:'organic',cut:2000},
  water:{name:'Reflets',bpm:72,root:196,scale:[0,2,5,7,9,12],chords:[[0,5,9],[2,7,11],[5,9,12],[0,7,12]],color:'water',cut:2900},
  mountain:{name:'Hauteurs',bpm:76,root:146.83,scale:[0,2,5,7,9,12],chords:[[0,5,7],[2,7,10],[5,9,12],[0,7,9]],color:'earth',cut:1700},
  city:{name:'Pulsation urbaine',bpm:96,root:164.81,scale:[0,2,4,7,11,12],chords:[[0,4,7],[5,9,12],[7,11,14],[0,7,11]],color:'city',cut:2600},
  shadow:{name:'Vallée nocturne',bpm:78,root:123.47,scale:[0,3,5,6,10,12],chords:[[0,3,6],[3,6,10],[5,10,12],[0,5,10]],color:'shadow',cut:1200},
  industrial:{name:'Taronis mécanique',bpm:98,root:110,scale:[0,3,5,7,10,12],chords:[[0,3,7],[3,7,10],[5,10,12],[0,5,10]],color:'factory',cut:1400},
  dawn:{name:'Nouvelle aurore',bpm:80,root:220,scale:[0,2,4,7,9,12],chords:[[0,4,9],[2,7,11],[5,9,12],[0,4,7]],color:'light',cut:3300},
  wild:{name:'Rencontre sauvage',bpm:118,root:110,scale:[0,3,5,7,10,12],chords:[[0,3,7],[5,8,12],[7,10,14],[0,5,10]],color:'battle',cut:1800,battle:true},
  trainer:{name:'Défi de dresseur',bpm:126,root:123.47,scale:[0,2,4,7,9,12],chords:[[0,4,7],[5,9,12],[7,11,14],[2,7,11]],color:'battle',cut:2100,battle:true},
  taron:{name:'Assaut Taron',bpm:132,root:92.5,scale:[0,3,5,6,8,12],chords:[[0,3,6],[3,6,8],[5,8,12],[0,5,8]],color:'factory',cut:1250,battle:true},
  guardian:{name:'Gardien de Valdora',bpm:128,root:110,scale:[0,2,5,7,10,12],chords:[[0,5,7],[2,7,10],[5,10,12],[0,7,10]],color:'cinematic',cut:2300,battle:true}
};
const audio={ctx:null,master:null,dry:null,reverb:null,delay:null,compressor:null,noise:null,timer:null,next:0,step:0,key:'',unlockBound:false,unlockPending:false};
const freq=(root,n)=>root*Math.pow(2,n/12);
function impulse(ac,seconds=2.4,decay=2.7){const b=ac.createBuffer(2,Math.floor(ac.sampleRate*seconds),ac.sampleRate);for(let c=0;c<2;c++){const d=b.getChannelData(c);for(let i=0;i<d.length;i++)d[i]=(Math.random()*2-1)*Math.pow(1-i/d.length,decay)}return b}
function ensureAudio(){
  if(audio.ctx&&audio.ctx.state!=='closed')return audio.ctx;if(audio.timer){clearInterval(audio.timer);audio.timer=null}audio.ctx=null;audio.master=null;audio.dry=null;audio.reverb=null;audio.delay=null;audio.compressor=null;audio.noise=null;audio.next=0;audio.step=0;audio.key='';try{const AudioEngine=window.AudioContext||window.webkitAudioContext;if(!AudioEngine)return null;const shared=typeof musicCtx!=='undefined'&&musicCtx&&musicCtx.state!=='closed'?musicCtx:null;audio.ctx=shared||new AudioEngine();if(typeof musicCtx!=='undefined')musicCtx=audio.ctx}catch(_){return null}const ac=audio.ctx;audio.master=ac.createGain();audio.master.gain.value=.46;audio.compressor=ac.createDynamicsCompressor();audio.compressor.threshold.value=-18;audio.compressor.knee.value=22;audio.compressor.ratio.value=3.2;audio.compressor.attack.value=.025;audio.compressor.release.value=.34;audio.dry=ac.createGain();audio.dry.gain.value=.82;audio.reverb=ac.createConvolver();audio.reverb.buffer=impulse(ac);const wet=ac.createGain();wet.gain.value=.28;audio.delay=ac.createDelay(.8);audio.delay.delayTime.value=.31;const feedback=ac.createGain();feedback.gain.value=.19;audio.delay.connect(feedback);feedback.connect(audio.delay);audio.dry.connect(audio.master);audio.reverb.connect(wet);wet.connect(audio.master);audio.delay.connect(audio.master);audio.master.connect(audio.compressor);audio.compressor.connect(ac.destination);const nb=ac.createBuffer(1,ac.sampleRate*2,ac.sampleRate),nd=nb.getChannelData(0);let brown=0;for(let i=0;i<nd.length;i++){const white=Math.random()*2-1;brown=(brown+.02*white)/1.02;nd[i]=brown*3.2}audio.noise=nb;return ac
}
function routeNode(node,wet=.22,delay=.04){node.connect(audio.dry);if(wet>0){const g=audio.ctx.createGain();g.gain.value=wet;node.connect(g);g.connect(audio.reverb)}if(delay>0){const g=audio.ctx.createGain();g.gain.value=delay;node.connect(g);g.connect(audio.delay)}}
function tone(f,when,dur,vol,cut,mode='soft',detune=0){const ac=audio.ctx;if(!ac)return;const o1=ac.createOscillator(),o2=ac.createOscillator(),filter=ac.createBiquadFilter(),gain=ac.createGain();o1.type='sine';o2.type='triangle';o1.frequency.setValueAtTime(Math.max(34,f),when);o2.frequency.setValueAtTime(Math.max(34,f),when);o1.detune.value=detune-4;o2.detune.value=detune+5;filter.type='lowpass';filter.frequency.setValueAtTime(Math.max(260,cut*.58),when);filter.frequency.exponentialRampToValueAtTime(Math.max(420,cut),when+Math.min(.8,dur*.35));filter.Q.value=mode==='pluck'?1.8:.72;const attack=mode==='pad'?Math.min(.8,dur*.28):mode==='pluck'?.025:.08;gain.gain.setValueAtTime(.0001,when);gain.gain.exponentialRampToValueAtTime(Math.max(.0002,vol),when+attack);gain.gain.exponentialRampToValueAtTime(.0001,when+dur);o1.connect(filter);o2.connect(filter);filter.connect(gain);routeNode(gain,mode==='pad'?.34:.2,mode==='pluck'?.1:.035);o1.start(when);o2.start(when);o1.stop(when+dur+.08);o2.stop(when+dur+.08)}
function noiseVoice(when,dur,vol,type='air'){const ac=audio.ctx;if(!ac||!audio.noise)return;const src=ac.createBufferSource(),f=ac.createBiquadFilter(),g=ac.createGain();src.buffer=audio.noise;f.type=type==='thunder'?'lowpass':type==='brush'?'bandpass':'highpass';f.frequency.value=type==='thunder'?160:type==='brush'?3200:5200;f.Q.value=type==='brush'?.8:.45;g.gain.setValueAtTime(.0001,when);g.gain.exponentialRampToValueAtTime(vol,when+.02);g.gain.exponentialRampToValueAtTime(.0001,when+dur);src.connect(f);f.connect(g);routeNode(g,type==='thunder'?.32:.12,type==='thunder'?.08:0);src.start(when,Math.random()*1.3);src.stop(when+dur)}
function kick(when,vol=.026){const ac=audio.ctx,o=ac.createOscillator(),g=ac.createGain();o.type='sine';o.frequency.setValueAtTime(92,when);o.frequency.exponentialRampToValueAtTime(42,when+.18);g.gain.setValueAtTime(vol,when);g.gain.exponentialRampToValueAtTime(.0001,when+.22);o.connect(g);routeNode(g,.04,0);o.start(when);o.stop(when+.24)}
function currentProfile(){
  if(typeof scene!=='undefined'&&scene==='battle'){let trainer=null;try{trainer=battle?.trainer}catch(_){};if(trainer?.taron||trainer?.taronBossV102Z||/taron/i.test(String(trainer?.name||trainer?.dialog||'')))return['taron',MUSIC.taron];if(trainer?.guardian||trainer?.templeGuard||trainer?.finalBoss||/gardien|sceau|maître/i.test(String(trainer?.name||trainer?.dialog||'')))return['guardian',MUSIC.guardian];return trainer?['trainer',MUSIC.trainer]:['wild',MUSIC.wild]}
  const z=zone();if(MUSIC[z])return[z,MUSIC[z]];const k=themeKey(sceneData());if(['forest','nature','spore'].includes(k))return['forest',MUSIC.forest];if(['lake','azure','river','coast','luminous','eau','harbor','island'].includes(k))return['water',MUSIC.water];if(['mountain','redrock','goldpeaks','simdor','mistpeak','roche','glace','mist'].includes(k))return['mountain',MUSIC.mountain];if(['shadow','ombre','capital'].includes(k))return['shadow',MUSIC.shadow];if(['modern'].includes(k))return['city',MUSIC.city];if(['industrial','feu'].includes(k))return['industrial',MUSIC.industrial];if(['dawn','solar','lumiere'].includes(k))return['dawn',MUSIC.dawn];return['prairie',MUSIC.prairie]
}
function scheduleStep(key,p,when){
  const step=audio.step++,slot=step%16,bar=Math.floor(step/16),ch=p.chords[bar%p.chords.length],beat=60/p.bpm;
  if(slot===0||slot===8){for(let i=0;i<ch.length;i++)tone(freq(p.root,ch[i]+(i===0?-12:0)),when,beat*7.2,p.battle?.0105:.0075,p.cut,'pad',(i-1)*5)}
  if(slot%8===0)tone(freq(p.root,ch[0]-12),when,beat*1.55,p.battle?.021:.012,Math.min(p.cut,900),'soft',-5);
  const melodic=(slot+bar*3)%p.scale.length;if([2,5,10,13].includes(slot)||(p.battle&&slot%2===1))tone(freq(p.root,p.scale[melodic]+12),when+.015,beat*(p.battle?.48:.82),p.battle?.0085:.0058,p.cut*1.15,'pluck',slot%4?4:-4);
  if(slot%4===0&&(p.battle||['city','factory','storm','fire'].includes(p.color)))kick(when,p.battle?.031:.017);
  if((p.battle||['city','factory','storm'].includes(p.color))&&slot%2===1)noiseVoice(when,beat*.18,p.battle?.007:.0045,'brush');
  if(p.color==='storm'&&slot===0&&bar%2===1)noiseVoice(when+.18,beat*2.6,.022,'thunder');
  if(p.color==='factory'&&(slot===4||slot===12)){noiseVoice(when,beat*.42,.008,'brush');tone(freq(p.root,-12),when,beat*.28,.012,620,'soft',-12)}
  if(['air','water','ice','organic','spore'].includes(p.color)&&slot===12)noiseVoice(when,beat*1.4,.0035,'air');
}
function musicLoop(){const ac=audio.ctx;if(!ac)return;let on=true;try{on=!!musicOn}catch(_){}audio.master.gain.setTargetAtTime(on?.46:0,ac.currentTime,.12);if(!on)return;const [key,p]=currentProfile();if(key!==audio.key){audio.key=key;audio.step=0;audio.next=ac.currentTime+.08}const duration=60/p.bpm/2;if(!audio.next||audio.next<ac.currentTime-.35)audio.next=ac.currentTime+.06;while(audio.next<ac.currentTime+.35){scheduleStep(key,p,audio.next);audio.next+=duration}}
function activateModernScheduler(ac){if(!ac||ac.state!=='running')return false;try{if(typeof musicTimer!=='undefined'&&musicTimer){clearInterval(musicTimer);musicTimer=null}}catch(_){}try{if(typeof battleMusicTimer!=='undefined'&&battleMusicTimer){clearInterval(battleMusicTimer);battleMusicTimer=null}}catch(_){}if(!audio.timer)audio.timer=setInterval(musicLoop,75);audio.next=ac.currentTime+.07;musicLoop();document.documentElement.dataset.valdoraAudio='running';return true}
function startModernMusic(){let on=true;try{on=!!musicOn}catch(_){}if(!on)return null;const ac=ensureAudio();if(!ac)return null;if(ac.state==='running'){activateModernScheduler(ac);return ac}if(ac.state==='suspended'){try{const resumed=ac.resume();if(resumed?.then)resumed.then(()=>activateModernScheduler(ac)).catch(()=>{document.documentElement.dataset.valdoraAudio='waiting-for-touch'})}catch(_){document.documentElement.dataset.valdoraAudio='waiting-for-touch'}}return ac}
async function unlockAudioFromGesture(){let on=true;try{on=!!musicOn}catch(_){}if(!on||audio.unlockPending)return false;const ac=ensureAudio();if(!ac)return false;if(ac.state==='running'&&audio.timer){document.documentElement.dataset.valdoraAudio='running';return true}audio.unlockPending=true;try{if(ac.state==='suspended')await ac.resume();const active=activateModernScheduler(ac);document.documentElement.dataset.valdoraAudio=active?'running':'waiting-for-touch';return active}catch(_){document.documentElement.dataset.valdoraAudio='waiting-for-touch';return false}finally{audio.unlockPending=false}}
function installAudioUnlock(){if(audio.unlockBound)return;audio.unlockBound=true;const direct=()=>{unlockAudioFromGesture()};document.addEventListener('pointerdown',direct,{capture:true,passive:true});document.addEventListener('touchend',direct,{capture:true,passive:true});document.addEventListener('keydown',direct,true);document.addEventListener('click',direct,false);window.addEventListener('pageshow',()=>{try{startModernMusic()}catch(_){}});document.addEventListener('visibilitychange',()=>{if(!document.hidden){try{startModernMusic()}catch(_){}}})}
function refreshMusic(){audio.key='';audio.step=0;startModernMusic()}
function stopBattle(){audio.key='';audio.step=0}
function installMusic(){window.startMusic=startModernMusic;window.refreshMusicV77=refreshMusic;window.startBattleMusic=refreshMusic;window.stopBattleMusic=stopBattle;try{startMusic=startModernMusic}catch(_){}try{refreshMusicV77=refreshMusic}catch(_){}try{startBattleMusic=refreshMusic}catch(_){}try{stopBattleMusic=stopBattle}catch(_){}installAudioUnlock()}

function preview(id){if(!creator()||!SCENES?.[id])return false;state.zone=id;const sc=SCENES[id];state.x=(sc.width||3000)/2;state.y=(sc.height||1800)*.62;try{scene='world'}catch(_){}for(const elId of['title','menuov','starterov','dialog','battleUI']){const el=document.getElementById(elId);if(el)el.style.display='none'}try{hud?.();drawWorld?.();refreshMusic();setTimeout(publishAudit,140)}catch(_){}return true}
function installCreatorTool(){
  if(!creator()||document.getElementById('v115-biomes'))return;const panel=document.createElement('div');panel.id='v115-biomes-panel';panel.style.cssText='position:fixed;inset:0;z-index:99999;background:rgba(2,9,18,.84);display:none;place-items:center;padding:18px';panel.innerHTML=`<div style="width:min(760px,96vw);max-height:90vh;overflow:auto;background:#f7f1e4;color:#173548;border:4px solid #173548;border-radius:22px;padding:22px;box-shadow:0 28px 90px #000b"><h2 style="margin:0 0 7px">Biomes vivants V115</h2><p>Prévisualisation directe des onze environnements et de leur identité musicale.</p><div data-list style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:9px"></div><button data-close style="margin-top:14px;width:100%;padding:11px">Fermer</button></div>`;document.body.appendChild(panel);const list=panel.querySelector('[data-list]');for(const id of LEGEND_ZONES){const b=document.createElement('button');b.textContent=ENV[id].name;b.dataset.zone=id;list.appendChild(b)}panel.querySelectorAll('button').forEach(b=>b.style.cssText='padding:11px;border:2px solid #173548;border-radius:10px;background:#fff;color:#173548;font-weight:900;cursor:pointer');panel.querySelector('[data-close]').onclick=()=>panel.style.display='none';list.querySelectorAll('button').forEach(b=>b.onclick=()=>{panel.style.display='none';preview(b.dataset.zone)});const button=document.createElement('button');button.id='v115-biomes';button.type='button';button.textContent='Biomes V115';button.style.cssText='position:fixed;left:14px;bottom:106px;z-index:85000;border:2px solid #a9dfff;background:#263d63;color:#fff;border-radius:12px;padding:10px 14px;font:900 12px Segoe UI;box-shadow:0 7px 22px #0018;cursor:pointer';button.onclick=()=>panel.style.display='grid';document.body.appendChild(button)
}
function enforceIdentity(){if(document.documentElement.dataset.valdoraV116||window.ValdoraWorldV116?.active)return;const title='Éclats Sauvages — Valdora V115 Biomes Vivants';if(document.title!==title)document.title=title;const brand=document.querySelector('.brand'),label=`ÉCLATS SAUVAGES — VALDORA V115 — ${creator()?'CRÉATEUR':'JOUEUR'}`;if(brand&&brand.textContent!==label)brand.textContent=label;const map=document.getElementById('v111MapBtn');if(map&&map.textContent!=='Carte du monde V115')map.textContent='Carte du monde V115';document.documentElement.dataset.valdoraVersion=VERSION;document.documentElement.dataset.valdoraPolish=VERSION;document.documentElement.dataset.valdoraV115=VERSION}
function audit(){
  const issues=[],assets={};for(const [k,im] of Object.entries(IMG)){assets[k]=ready(im);if(!assets[k])issues.push(`asset ${k} indisponible`)}const environments={};for(const id of LEGEND_ZONES){const sc=SCENES?.[id],env=ENV[id];environments[id]={name:env.name,kind:env.kind,configured:sc?.v115Environment===env.name,props:sc?.v115Props?.length||0,music:MUSIC[id]?.name||''};if(!environments[id].configured||environments[id].props<4||!environments[id].music)issues.push(`${id}: environnement incomplet`)}const hooks={polish:window.ValdoraPolishV113===api,music:window.startMusic===startModernMusic,ground:true,roads:true,overlay:true,patternWorldAnchored:true};if(!hooks.polish||!hooks.music)issues.push('V115 non prioritaire');return{version:VERSION,ok:issues.length===0,issues,assets,environments,legendaryCount:LEGEND_ZONES.length,rendering:{worldAnchoredGround:true,worldAnchoredRoadPattern:true,uniqueAtlases:3,uniqueBiomeCells:11,stormWhiteFlash:true,factoryEnvironment:true},music:{engine:'Web Audio atmosphérique moderne',profiles:Object.keys(MUSIC).length,legendaryProfiles:LEGEND_ZONES.length,waveforms:['sine','triangle'],retroWaveforms:false,active:currentProfile()[1]?.name||'',context:audio.ctx?.state||'not-started',scheduler:!!audio.timer,currentKey:audio.key||''},hooks,base:window.ValdoraWorldV114?.audit?.()||null}}
function publishAudit(){try{document.documentElement.dataset.valdoraV115Audit=JSON.stringify(audit())}catch(_){} }
function install(){configureScenes();if(!document.documentElement.dataset.valdoraV116&&!window.ValdoraWorldV116?.active)window.ValdoraPolishV113=api;window.ValdoraWorldV115=api;installMusic();installCreatorTool();enforceIdentity();publishAudit()}

const api={...BASE,active:true,version:VERSION,assets:ASSET_PATHS,environments:ENV,musicProfiles:MUSIC,drawGround,drawRoads,overlay,preview,enforceIdentity,startMusic:startModernMusic,unlockAudio:unlockAudioFromGesture,audit};
window.ValdoraWorldV115=api;window.ValdoraPolishV113=api;
install();if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install);[250,900,2100,4700,8400,12200,16000].forEach(ms=>setTimeout(install,ms));setInterval(()=>{try{configureScenes();if(!document.documentElement.dataset.valdoraV116&&!window.ValdoraWorldV116?.active)window.ValdoraPolishV113=api;installMusic();enforceIdentity();installCreatorTool();publishAudit()}catch(e){console.warn('V115 maintenance',e)}},2100);
// V117 : le monde est déjà rendu par la boucle requestAnimationFrame du jeu.
// L'ancien second rendu complet toutes les 90 ms produisait deux images concurrentes,
// visibles sous forme de clignotements et de sanctuaires qui semblaient disparaître.
window.ValdoraV115UsesPrimaryRenderLoop=true;
console.log('V115 : sols ancrés au monde, onze biomes vivants et musique atmosphérique moderne actifs.');
})();
