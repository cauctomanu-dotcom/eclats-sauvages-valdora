from pathlib import Path
import re

ROOT=Path('.')
LIVING=ROOT/'game/VALDORA_LIVING_WORLD_V118.js'
INDEX=ROOT/'game/index.html'
CREATOR=ROOT/'game/CREATEUR.html'
SW=ROOT/'game/sw.js'
GATE=ROOT/'game/VALDORA_CREATOR_GATE_V121.js'


def block_end(src, open_brace):
    depth=0; quote=None; esc=False; template=False; i=open_brace
    while i<len(src):
        ch=src[i]
        if esc: esc=False; i+=1; continue
        if quote:
            if ch=='\\': esc=True
            elif ch==quote: quote=None
            i+=1; continue
        if ch in ('"',"'"): quote=ch; i+=1; continue
        if ch=='`': template=not template; i+=1; continue
        if template: i+=1; continue
        if ch=='{': depth+=1
        elif ch=='}':
            depth-=1
            if depth==0:return i+1
        i+=1
    raise RuntimeError('unbalanced block')


def replace_function(src, anchor, replacement):
    start=src.find(anchor)
    if start<0: raise RuntimeError('missing '+anchor)
    brace=src.find('{',start+len(anchor))
    if brace<0: raise RuntimeError('missing brace '+anchor)
    end=block_end(src,brace)
    return src[:start]+replacement+src[end:]


text=LIVING.read_text(encoding='utf-8')
start=text.find('// V120 — Réseau cyclable utile.')
if start<0: raise RuntimeError('cycle start missing')
start=text.rfind('// ---------------------------------------------------------------------',0,start)
end=text.find('function stateV118()',start)
if end<0: raise RuntimeError('cycle end missing')

cycle=r'''// ---------------------------------------------------------------------
// V121 — VRAIES ROUTES CYCLABLES, façon Pokémon.
// La bicyclette ne se superpose plus aux routes normales : elle ouvre des
// chemins dédiés qui relient rapidement deux zones déjà connues.
// ---------------------------------------------------------------------
const CYCLE_LINKS_V121=[
  {id:'cycle_clairval_rochebrune',a:'town0',b:'town2'},
  {id:'cycle_soleria_novacite',a:'town4',b:'town6'},
  {id:'cycle_route4_route7',a:'route3',b:'route6'},
  {id:'cycle_town9_town10',a:'town9',b:'town10'},
  {id:'cycle_route9_route11',a:'route8',b:'route10'},
  {id:'cycle_route11_route13',a:'route10',b:'route12'}
];
let bikeNoticeAtV119=0;
function bikeUnlockedV119(){return creator()||!!state?.flags?.v119BikeUnlocked||(Array.isArray(state?.seals)&&state.seals.length>=3)}
function cycleZoneV121(zone=state?.zone){return CYCLE_LINKS_V121.some(l=>l.id===zone)}
function cycleKnownV121(zone){
  if(creator()||state?.zone===zone)return true;
  const lists=[state?.discovered,state?.visited,state?.visitedZones,state?.visitedCities];
  return lists.some(a=>Array.isArray(a)&&a.includes(zone))
}
function cycleSceneV121(link){
  const width=2800,height=1400,path=[[130,700],[480,560],[850,760],[1220,610],[1580,790],[1950,590],[2320,750],[2670,700]];
  return{name:`Voie cyclable — ${sceneFor(link.a)?.name||link.a} / ${sceneFor(link.b)?.name||link.b}`,kind:'route',cycleOnlyV121:true,routeEngine:'V121-CYCLE',width,height,buildings:[],trainers:[],objects:[],obstacles:[],mObstacles:[],grass:[],v105dTrees:[],v105dBushes:[],v105dCell:220,v105dCore:118,v105dRoad:new Set(),v76Path:path,v104Path:path,kPath:path,exits:[
    {x:0,y:610,w:150,h:180,side:'west',to:link.a,label:sceneFor(link.a)?.name||'Retour',v121CycleExit:true},
    {x:2650,y:610,w:150,h:180,side:'east',to:link.b,label:sceneFor(link.b)?.name||'Sortie',v121CycleExit:true}
  ]}
}
function cycleEntryRectV121(sc,side,slot){
  const w=Number(sc?.width)||1800,h=Number(sc?.height)||1100,span=150,depth=92,p=slot?0.68:0.32;
  if(side==='west')return{x:0,y:Math.round(h*p-span/2),w:depth,h:span,side};
  return{x:Math.max(0,w-depth),y:Math.round(h*p-span/2),w:depth,h:span,side:'east'}
}
function cycleUpsertExitV121(sc,to,value){
  if(!sc)return;sc.exits=Array.isArray(sc.exits)?sc.exits:[];const i=sc.exits.findIndex(e=>e?.v121CycleEntry&&String(e.to||e.target)===to);
  if(i>=0)sc.exits[i]={...sc.exits[i],...value,to};else sc.exits.push({...value,to})
}
function cycleRemoveExitV121(sc,to){if(sc?.exits)sc.exits=sc.exits.filter(e=>!(e?.v121CycleEntry&&String(e.to||e.target)===to))}
function ensureCycleNetworkV121(){
  if(typeof SCENES!=='object'||!SCENES)return false;const unlocked=bikeUnlockedV119();
  for(const [i,link] of CYCLE_LINKS_V121.entries()){
    const a=sceneFor(link.a),b=sceneFor(link.b);if(!a||!b)continue;
    const available=unlocked&&(creator()||(cycleKnownV121(link.a)&&cycleKnownV121(link.b)));
    if(!SCENES[link.id]||!SCENES[link.id].cycleOnlyV121)SCENES[link.id]=cycleSceneV121(link);
    else{SCENES[link.id].name=`Voie cyclable — ${a.name||link.a} / ${b.name||link.b}`;SCENES[link.id].exits[0].label=a.name||'Retour';SCENES[link.id].exits[1].label=b.name||'Sortie'}
    if(available){
      cycleUpsertExitV121(a,link.id,{...cycleEntryRectV121(a,'east',i%2),label:`🚲 Voie cyclable vers ${b.name||link.b}`,v121CycleEntry:true});
      cycleUpsertExitV121(b,link.id,{...cycleEntryRectV121(b,'west',(i+1)%2),label:`🚲 Voie cyclable vers ${a.name||link.a}`,v121CycleEntry:true})
    }else{cycleRemoveExitV121(a,link.id);cycleRemoveExitV121(b,link.id)}
  }
  return true
}
function ensureBikeUnlockV119(){
  state.flags=state.flags||{};
  if(Array.isArray(state.seals)&&state.seals.length>=3&&!state.flags.v119BikeUnlocked){
    state.flags.v119BikeUnlocked=true;state.bike=false;
    if(!state.flags.v119BikeUnlockNotified){state.flags.v119BikeUnlockNotified=true;try{toast?.('Bicyclette débloquée ! De nouvelles voies cyclables permettent maintenant de relier rapidement des zones déjà découvertes.')}catch(_){} }
    try{save?.(false)}catch(_){}
  }
  if(!bikeUnlockedV119()&&state.bike)state.bike=false;ensureCycleNetworkV121();return bikeUnlockedV119()
}
function cycleSegmentsV119(){return[]}
function onCycleTrackV119(zone=state?.zone){return cycleZoneV121(zone)}
function drawCycleTracksV119(){/* V121 : aucun marquage superposé aux routes normales. */}
function bikeNoticeV119(msg){const now=Date.now();if(now-bikeNoticeAtV119<1200)return;bikeNoticeAtV119=now;try{toast?.(msg)}catch(_){}}
function refreshBikeUiV119(){
  const unlocked=ensureBikeUnlockV119(),onPath=cycleZoneV121();if(typeof scene!=='undefined'&&scene!=='world'&&state.bike)state.bike=false;if(onPath)state.bike=true;else if(state.bike)state.bike=false;
  let panel=document.getElementById('v119CyclePanel'),btn=document.getElementById('v119BikeBtn');
  if(!panel){const aside=document.querySelector('aside');if(aside){panel=document.createElement('div');panel.id='v119CyclePanel';panel.className='panel';panel.innerHTML='<h3>Déplacement</h3><button id="v119BikeBtn" style="width:100%"></button><div class="small" style="margin-top:7px">Après 3 Sceaux, la bicyclette ouvre des voies dédiées servant de raccourcis entre des zones déjà découvertes.</div>';aside.prepend(panel);btn=panel.querySelector('#v119BikeBtn')}}
  if(!btn)return;btn.disabled=true;btn.textContent=!unlocked?'🔒 Bicyclette — 3 Sceaux':onPath?'🚲 Voie cyclable — vitesse ×2':'🚲 Bicyclette débloquée — cherche les voies cyclables'
}
function toggleBikeV119(){if(cycleZoneV121()){state.bike=true;bikeNoticeV119('La bicyclette est utilisée automatiquement sur cette voie.');return true}bikeNoticeV119('La bicyclette s’utilise sur les voies cyclables dédiées.');return false}
function cycleMoveV119(dx,dy,dir){
  ensureBikeUnlockV119();const startZone=state?.zone,onPath=cycleZoneV121(startZone);state.bike=!!onPath;let result=false,passes=onPath?2:1;
  for(let i=0;i<passes;i++){const r=typeof BASE.move==='function'?BASE.move.apply(this,arguments):false;result=!!r||result;if(state?.zone!==startZone)break}
  if(!cycleZoneV121(state?.zone))state.bike=false;refreshBikeUiV119();return result
}
window.ValdoraCycleV119={version:'V121-CYCLE-ROUTES',unlocked:bikeUnlockedV119,onTrack:onCycleTrackV119,toggle:toggleBikeV119,segments:cycleSegmentsV119,refresh:refreshBikeUiV119,links:CYCLE_LINKS_V121,repair:ensureCycleNetworkV121};
try{ensureCycleNetworkV121()}catch(_){}

'''
text=text[:start]+cycle+text[end:]

text=replace_function(text,'function movable(n)',"function movable(n){return !!n&&(n.v118Generated===true||n.v121Roamer===true)&&!n.taron&&!n.guardian&&!n.service&&!n.stationaryV118}")

place=r'''function placeTownCitizens(zone,force=false){
  const sc=sceneFor(zone);if(!sc||sc.kind!=='town')return;const nodes=roadNodes(sc);if(!nodes.list.length)return;
  // V121 : seuls les habitants créés et possédés par ce moteur se déplacent.
  // Les anciens PNJ (quêtes, services, couches historiques) restent fixes : un
  // autre module ne peut donc plus les recréer à leur point de départ pendant
  // que V118/V121 les fait marcher.
  sc.v118Citizens=Array.isArray(sc.v118Citizens)?sc.v118Citizens:[];
  for(const n of baseCitizens(sc,zone,false))if(!n?.v118Generated&&!n?.v121Roamer)n.stationaryV118=true;
  const target=sc.megacity?14:10;let roamers=sc.v118Citizens.filter(n=>n&&n.v118Generated);
  for(let i=roamers.length;i<target;i++){
    const ident=npcIdentity(zone,i);sc.v118Citizens.push({id:`v121_roamer_${zone}_${i}`,zone,x:0,y:0,homeX:0,homeY:0,look:ident.look,name:ident.name,v118Role:ident.role,dir:i%4,moving:false,v118Generated:true,v121Roamer:true})
  }
  roamers=sc.v118Citizens.filter(n=>n&&n.v118Generated);const all=baseCitizens(sc,zone,false),slots=roadSpawnSlots(sc,nodes),occupied=[];
  for(const n of all){
    if(n.v118Generated&&(n._v121Placed||n._v118Placed)&&Number.isFinite(Number(n.x))&&Number.isFinite(Number(n.y))){n._v121Placed=true;n.v121Roamer=true;occupied.push({x:n.x,y:n.y})}
    else if(!movable(n)&&Number.isFinite(Number(n.x))&&Number.isFinite(Number(n.y)))occupied.push({x:n.x,y:n.y})
  }
  for(const [i,n] of roamers.entries()){
    n.v121Roamer=true;if(n._v121Placed&&Number.isFinite(Number(n.x))&&Number.isFinite(Number(n.y)))continue;
    let choice=null;const start=hash(`${zone}|${n.id||n.name}|v121-spawn`)%Math.max(1,slots.length);
    for(const minimum of[64,56,48]){for(let k=0;k<slots.length;k++){const q=slots[(start+k)%slots.length];if(safeSpawn(q,occupied,minimum)){choice=q;break}}if(choice)break}
    choice=choice||nodes.list[(hash(n.id)+i)%nodes.list.length];const nodeKey=choice.nodeKey||choice.key||nearestNode(nodes,choice.x,choice.y)?.key;
    n.x=choice.x;n.y=choice.y;n.homeX=choice.x;n.homeY=choice.y;n._v118Node=nodeKey;n._v118Target=null;n._v118FreeTarget=null;n._v118Wait=performance.now()+250+(hash(n.id)%900);n.dir=hash(n.id+'dir')%4;n.moving=false;n._v118Placed=true;n._v121Placed=true;occupied.push({x:n.x,y:n.y})
  }
  sc._v118PopulationReady='V121-PERSISTENT-ROAMERS'
}'''
text=replace_function(text,'function placeTownCitizens(zone,force=false)',place)

# Keep cycle network repaired alongside other late installers.
text=text.replace('function install(){configureCurrent(false);installHooks();stabilizeSidebar();enforceIdentity();publishAudit()}',
                  'function install(){configureCurrent(false);ensureCycleNetworkV121();installHooks();stabilizeSidebar();enforceIdentity();publishAudit()}')
LIVING.write_text(text,encoding='utf-8')

# Password gate. Only the SHA-256 digest is stored in the public client.
GATE.write_text(r'''// Valdora V121 — accès au mode Créateur depuis l'accueil.
(function(){
'use strict';
const HASH='2071eacbcc461240288799233872f9c15e7714f58be2a9ad413f399986b75eea';
const SESSION_KEY='valdoraCreatorAuthV121';
function hex(buf){return Array.from(new Uint8Array(buf)).map(b=>b.toString(16).padStart(2,'0')).join('')}
async function digest(value){
  const data=new TextEncoder().encode(String(value||''));
  if(globalThis.crypto?.subtle)return hex(await crypto.subtle.digest('SHA-256',data));
  // Fallback compact pour exécution locale sans WebCrypto.
  function rr(v,n){return(v>>>n)|(v<<(32-n))}const K=[1116352408,1899447441,3049323471,3921009573,961987163,1508970993,2453635748,2870763221,3624381080,310598401,607225278,1426881987,1925078388,2162078206,2614888103,3248222580,3835390401,4022224774,264347078,604807628,770255983,1249150122,1555081692,1996064986,2554220882,2821834349,2952996808,3210313671,3336571891,3584528711,113926993,338241895,666307205,773529912,1294757372,1396182291,1695183700,1986661051,2177026350,2456956037,2730485921,2820302411,3259730800,3345764771,3516065817,3600352804,4094571909,275423344,430227734,506948616,659060556,883997877,958139571,1322822218,1537002063,1747873779,1955562222,2024104815,2227730452,2361852424,2428436474,2756734187,3204031479,3329325298];
  const bytes=Array.from(data),bit=bytes.length*8;bytes.push(128);while(bytes.length%64!==56)bytes.push(0);for(let i=7;i>=0;i--)bytes.push(Math.floor(bit/2**(i*8))&255);let H=[1779033703,3144134277,1013904242,2773480762,1359893119,2600822924,528734635,1541459225];
  for(let o=0;o<bytes.length;o+=64){const w=new Array(64);for(let i=0;i<16;i++)w[i]=(bytes[o+4*i]<<24)|(bytes[o+4*i+1]<<16)|(bytes[o+4*i+2]<<8)|bytes[o+4*i+3];for(let i=16;i<64;i++){const x=w[i-15],y=w[i-2],s0=rr(x,7)^rr(x,18)^(x>>>3),s1=rr(y,17)^rr(y,19)^(y>>>10);w[i]=(w[i-16]+s0+w[i-7]+s1)|0}let[a,b,c,d,e,f,g,h]=H;for(let i=0;i<64;i++){const S1=rr(e,6)^rr(e,11)^rr(e,25),ch=(e&f)^(~e&g),t1=(h+S1+ch+K[i]+w[i])|0,S0=rr(a,2)^rr(a,13)^rr(a,22),maj=(a&b)^(a&c)^(b&c),t2=(S0+maj)|0;h=g;g=f;f=e;e=(d+t1)|0;d=c;c=b;b=a;a=(t1+t2)|0}H=H.map((v,i)=>(v+[a,b,c,d,e,f,g,h][i])|0)}return H.map(v=>(v>>>0).toString(16).padStart(8,'0')).join('')
}
function style(){if(document.getElementById('v121CreatorStyle'))return;const s=document.createElement('style');s.id='v121CreatorStyle';s.textContent=`#v121CreatorBtn{margin-top:8px!important;padding:9px 15px!important;font-size:12px!important;opacity:.86}#v121CreatorGate{position:fixed;inset:0;z-index:999999;background:rgba(5,13,25,.82);display:flex;align-items:center;justify-content:center;padding:20px}#v121CreatorGate .box{width:min(430px,92vw);background:#102334;border:1px solid rgba(120,239,210,.5);border-radius:18px;padding:24px;box-shadow:0 24px 70px rgba(0,0,0,.5);color:#fff}#v121CreatorGate h2{margin:0 0 8px}#v121CreatorGate p{opacity:.8;line-height:1.45}#v121CreatorGate input{width:100%;box-sizing:border-box;padding:12px 14px;border-radius:10px;border:1px solid #506b7c;background:#081823;color:#fff;font-size:15px}#v121CreatorGate .actions{display:flex;gap:10px;margin-top:14px}#v121CreatorGate button{flex:1;padding:11px;border-radius:10px;border:0;font-weight:800;cursor:pointer}#v121CreatorError{min-height:18px;color:#ff9b9b;margin-top:8px;font-size:13px}`;document.head.appendChild(s)}
function close(){document.getElementById('v121CreatorGate')?.remove()}
function openGate(){
  style();close();const ov=document.createElement('div');ov.id='v121CreatorGate';ov.innerHTML='<div class="box"><h2>Mode créateur</h2><p>Accès réservé. Entre le code créateur pour ouvrir Valdora avec tous les droits de test et de progression.</p><input id="v121CreatorPassword" type="password" autocomplete="current-password" placeholder="Code créateur"><div id="v121CreatorError"></div><div class="actions"><button id="v121CreatorCancel">Annuler</button><button id="v121CreatorOpen">Ouvrir le mode créateur</button></div></div>';document.body.appendChild(ov);const input=ov.querySelector('#v121CreatorPassword'),err=ov.querySelector('#v121CreatorError');input.focus();
  async function submit(){err.textContent='Vérification…';try{if(await digest(input.value)===HASH){sessionStorage.setItem(SESSION_KEY,'1');location.href='./CREATEUR.html';return}err.textContent='Code incorrect.';input.select()}catch(e){err.textContent='Impossible de vérifier le code sur ce navigateur.'}}
  ov.querySelector('#v121CreatorCancel').onclick=close;ov.querySelector('#v121CreatorOpen').onclick=submit;input.addEventListener('keydown',e=>{if(e.key==='Enter')submit();if(e.key==='Escape')close()});ov.addEventListener('click',e=>{if(e.target===ov)close()})
}
function install(){
  if(/CREATEUR\.html/i.test(location.pathname))return;
  style();const card=document.querySelector('.titlecard');if(!card||document.getElementById('v121CreatorBtn'))return;const b=document.createElement('button');b.id='v121CreatorBtn';b.type='button';b.textContent='🛠 Mode créateur';b.title='Ouvrir le mode créateur protégé';b.onclick=openGate;card.appendChild(b);if(location.hash==='#creator-auth')setTimeout(openGate,80)
}
window.ValdoraCreatorGateV121={open:openGate,authenticated:()=>sessionStorage.getItem(SESSION_KEY)==='1'};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install);else install();
})();
''',encoding='utf-8')

# Inject creator gate on normal home and hard guard in creator page.
idx=INDEX.read_text(encoding='utf-8')
idx=re.sub(r'VALDORA_LIVING_WORLD_V118\.js\?v=[^"\']+', 'VALDORA_LIVING_WORLD_V118.js?v=121-living-1', idx)
script='<script src="VALDORA_CREATOR_GATE_V121.js?v=121-creator-1"></script>'
if 'VALDORA_CREATOR_GATE_V121.js' not in idx:
    idx=idx.replace('</body>',script+'\n</body>') if '</body>' in idx else idx+'\n'+script+'\n'
INDEX.write_text(idx,encoding='utf-8')

crt=CREATOR.read_text(encoding='utf-8')
crt=re.sub(r'VALDORA_LIVING_WORLD_V118\.js\?v=[^"\']+', 'VALDORA_LIVING_WORLD_V118.js?v=121-living-1', crt)
guard="<script>try{if(sessionStorage.getItem('valdoraCreatorAuthV121')!=='1'){location.replace('./index.html#creator-auth');}}catch(_){location.replace('./index.html#creator-auth');}</script>"
if 'valdoraCreatorAuthV121' not in crt:
    if '<head>' in crt: crt=crt.replace('<head>','<head>\n'+guard,1)
    else: crt=guard+'\n'+crt
CREATOR.write_text(crt,encoding='utf-8')

sw=SW.read_text(encoding='utf-8')
sw=re.sub(r"const VERSION = '[^']+';","const VERSION = 'v121-pwa-1';",sw,1)
sw=re.sub(r"'\./VALDORA_LIVING_WORLD_V118\.js\?v=[^']+'","'./VALDORA_LIVING_WORLD_V118.js?v=121-living-1'",sw)
if 'VALDORA_CREATOR_GATE_V121.js' not in sw:
    needle="  './VALDORA_LIVING_WORLD_V118.js?v=121-living-1'"
    sw=sw.replace(needle,needle+",\n  './VALDORA_CREATOR_GATE_V121.js?v=121-creator-1'")
SW.write_text(sw,encoding='utf-8')

print('V121 patch prepared')
