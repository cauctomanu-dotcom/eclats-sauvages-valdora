from pathlib import Path

path = Path('game/VALDORA_LIVING_WORLD_V118.js')
text = path.read_text(encoding='utf-8')


def block_end(src, open_brace):
    depth = 0
    quote = None
    escape = False
    template = False
    i = open_brace
    while i < len(src):
        ch = src[i]
        if escape:
            escape = False
            i += 1
            continue
        if quote:
            if ch == '\\':
                escape = True
            elif ch == quote:
                quote = None
            i += 1
            continue
        if ch in ('"', "'"):
            quote = ch
            i += 1
            continue
        if ch == '`':
            template = not template
            i += 1
            continue
        if template:
            i += 1
            continue
        if ch == '{':
            depth += 1
        elif ch == '}':
            depth -= 1
            if depth == 0:
                return i + 1
        i += 1
    raise SystemExit('Unbalanced block')


def replace_function(src, anchor, replacement):
    start = src.find(anchor)
    if start < 0:
        raise SystemExit('Missing anchor: ' + anchor)
    brace = src.find('{', start + len(anchor))
    if brace < 0:
        raise SystemExit('Missing opening brace: ' + anchor)
    end = block_end(src, brace)
    return src[:start] + replacement + src[end:]


# Replace the old route-path helper and insert the structured-network helpers.
text = replace_function(text, 'function cycleRoutePathV119(sc,zone)', r'''function cycleRoutePathV119(sc,zone){
  if(!CYCLE_ROUTES_V119.has(zone)||sc?.kind!=='route'||sc?.v116Sanctuary)return[];
  const p=Array.isArray(sc.v104Path)&&sc.v104Path.length?sc.v104Path:Array.isArray(sc.v76Path)&&sc.v76Path.length?sc.v76Path:Array.isArray(sc.kPath)?sc.kPath:[];
  return p.map(q=>Array.isArray(q)?{x:Number(q[0]),y:Number(q[1])}:{x:Number(q?.x),y:Number(q?.y)}).filter(q=>Number.isFinite(q.x)&&Number.isFinite(q.y))
}

// V120 — Le réseau cyclable est un vrai réseau de déplacement : quelques
// axes utiles, continus et lisibles. On ne transforme plus chaque rue en piste.
const CYCLE_SERVICE_PRIORITY_V120=['gare','centre_soins','gardien','laboratoire','musee'];
function cycleBuildingFamilyV120(b){
  const f=[b?.type,b?.urbanType,b?.id,b?.label,b?.name,b?.interiorKey,b?.key].filter(Boolean).join(' ').toLowerCase();
  if(/centre[_ -]?soins|centre de soins|soins_centre|clinique/.test(f))return'centre_soins';
  if(!/bus|arr[eê]t|d[eé]p[oô]t/.test(f)&&/\bgare\b|station ferroviaire|rail station/.test(f))return'gare';
  if(/laboratoire|\blabo\b/.test(f))return'laboratoire';
  if(/mus[eé]e/.test(f))return'musee';
  if(/gardien|ar[eè]ne/.test(f))return'gardien';
  return null
}
function cycleNearestNodeV120(g,x,y){
  let best=null,bd=Infinity;for(const n of g.list||[]){const d=Math.hypot(n.x-x,n.y-y);if(d<bd){bd=d;best=n}}return best
}
function cycleBfsV120(g,startKey,endKey){
  if(!startKey||!endKey)return[];if(startKey===endKey)return[startKey];
  const q=[startKey],prev=new Map([[startKey,null]]);let qi=0;
  while(qi<q.length){const key=q[qi++],node=g.map.get(key);if(!node)continue;for(const next of node.neighbors||[]){if(prev.has(next)||!g.map.has(next))continue;prev.set(next,key);if(next===endKey){const out=[endKey];let k=key;while(k){out.push(k);k=prev.get(k)}return out.reverse()}q.push(next)}}
  return[]
}
function cycleTownAnchorsV120(sc,g){
  const anchors=[];
  for(const e of sc.exits||[]){const n=cycleNearestNodeV120(g,e.x+e.w/2,e.y+e.h/2);if(n)anchors.push({key:n.key,kind:'exit'})}
  for(const fam of CYCLE_SERVICE_PRIORITY_V120){const b=(sc.buildings||[]).find(x=>cycleBuildingFamilyV120(x)===fam);if(!b)continue;const n=cycleNearestNodeV120(g,Number.isFinite(Number(b.doorX))?Number(b.doorX):b.x+b.w/2,Number.isFinite(Number(b.doorY))?Number(b.doorY):b.y+b.h);if(n)anchors.push({key:n.key,kind:fam})}
  const unique=[];const seen=new Set();for(const a of anchors)if(!seen.has(a.key)){seen.add(a.key);unique.push(a)}
  if(unique.length>=2)return unique.slice(0,5);
  const nodes=g.list||[];if(nodes.length<2)return unique;
  const byX=[...nodes].sort((a,b)=>a.x-b.x),byY=[...nodes].sort((a,b)=>a.y-b.y),fallback=[byX[0],byX.at(-1),byY[0],byY.at(-1)];
  for(const n of fallback)if(n&&!seen.has(n.key)){seen.add(n.key);unique.push({key:n.key,kind:'axis'});if(unique.length>=3)break}
  return unique
}
function cycleTownBackboneV120(sc){
  const g=roadNodes(sc),anchors=cycleTownAnchorsV120(sc,g);if(anchors.length<2)return[];
  const connected=new Set([anchors[0].key]),remaining=new Set(anchors.slice(1).map(a=>a.key)),edges=new Map();
  while(remaining.size){let best=null,bd=Infinity;for(const from of connected)for(const to of remaining){const a=g.map.get(from),b=g.map.get(to);if(!a||!b)continue;const d=Math.hypot(a.x-b.x,a.y-b.y);if(d<bd){bd=d;best={from,to}}}if(!best)break;const path=cycleBfsV120(g,best.from,best.to);if(path.length<2){remaining.delete(best.to);continue}for(let i=0;i<path.length-1;i++){const a=g.map.get(path[i]),b=g.map.get(path[i+1]);if(!a||!b)continue;const key=[a.key,b.key].sort().join('|');edges.set(key,[{x:a.x,y:a.y,key:a.key},{x:b.x,y:b.y,key:b.key}])}connected.add(best.to);remaining.delete(best.to)}
  return[...edges.values()]
}
function cycleOffsetSegmentV120(a,b,offset=30){
  let p=a,q=b;if((p.x>q.x)||(p.x===q.x&&p.y>q.y)){p=b;q=a}const dx=q.x-p.x,dy=q.y-p.y,len=Math.hypot(dx,dy)||1,nx=-dy/len,ny=dx/len;return[{x:a.x+nx*offset,y:a.y+ny*offset},{x:b.x+nx*offset,y:b.y+ny*offset}]
}
function cycleOffsetPolylineV120(points,offset=34){
  if(points.length<2)return[];const shifted=[];
  for(let i=0;i<points.length;i++){const prev=points[Math.max(0,i-1)],next=points[Math.min(points.length-1,i+1)],dx=next.x-prev.x,dy=next.y-prev.y,len=Math.hypot(dx,dy)||1;shifted.push({x:points[i].x-dy/len*offset,y:points[i].y+dx/len*offset})}
  const out=[];for(let i=0;i<shifted.length-1;i++)out.push([shifted[i],shifted[i+1]]);return out
}''')

text = replace_function(text, 'function cycleSegmentsV119(sc=current(),zone=state?.zone)', r'''function cycleSegmentsV119(sc=current(),zone=state?.zone){
  if(!sc)return[];
  if(CYCLE_ROUTES_V119.has(zone))return cycleOffsetPolylineV120(cycleRoutePathV119(sc,zone),34);
  if(CYCLE_TOWNS_V119.has(zone)&&sc.kind==='town')return cycleTownBackboneV120(sc).map(([a,b])=>cycleOffsetSegmentV120(a,b,30));
  return[]
}''')

text = replace_function(text, 'function onCycleTrackV119(zone=state?.zone,x=state?.x,y=state?.y)', r'''function onCycleTrackV119(zone=state?.zone,x=state?.x,y=state?.y){
  const sc=sceneFor(zone);if(!sc||typeof scene!=='undefined'&&scene!=='world')return false;
  const px=Number(x),py=Number(y);if(!Number.isFinite(px)||!Number.isFinite(py))return false;
  return cycleSegmentsV119(sc,zone).some(([a,b])=>pointSegmentDistanceV119(px,py,a,b)<=46)
}''')

text = replace_function(text, 'function drawCycleTracksV119()', r'''function drawCycleTracksV119(){
  if(typeof scene==='undefined'||scene!=='world')return;const sc=current(),segments=cycleSegmentsV119(sc,state?.zone);if(!segments.length)return;
  const c=cycleCameraV119(sc),holes=[];
  holes.push({x:(Number(state.x)-c.camX)*c.sx,y:(Number(state.y)-c.camY)*c.sy,w:34,h:48});
  try{if(sc?.kind==='town')for(const n of allWorldCitizens(sc,state.zone))holes.push({x:(Number(n.x)-c.camX)*c.sx,y:(Number(n.y)-c.camY)*c.sy,w:32,h:46})}catch(_){}
  ctx.save();ctx.beginPath();ctx.rect(-80,-80,1120,760);for(const h of holes)ctx.rect(h.x-h.w/2,h.y-h.h*.8,h.w,h.h);try{ctx.clip('evenodd')}catch(_){ctx.clip()}
  ctx.lineCap='round';ctx.lineJoin='round';ctx.globalAlpha=.72;
  for(const [a,b] of segments){const x1=(a.x-c.camX)*c.sx,y1=(a.y-c.camY)*c.sy,x2=(b.x-c.camX)*c.sx,y2=(b.y-c.camY)*c.sy;if(Math.max(x1,x2)<-40||Math.min(x1,x2)>1000||Math.max(y1,y2)<-40||Math.min(y1,y2)>640)continue;ctx.strokeStyle='rgba(31,126,96,.82)';ctx.lineWidth=7;ctx.setLineDash([]);ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.stroke();ctx.strokeStyle='rgba(246,255,251,.86)';ctx.lineWidth=1.5;ctx.setLineDash([13,15]);ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.stroke()}
  ctx.setLineDash([]);ctx.restore()
}''')

text = replace_function(text, 'function refreshBikeUiV119()', r'''function refreshBikeUiV119(){
  ensureBikeUnlockV119();if(typeof scene!=='undefined'&&scene!=='world'&&state.bike)state.bike=false;
  let panel=document.getElementById('v119CyclePanel'),btn=document.getElementById('v119BikeBtn');
  if(!panel){const aside=document.querySelector('aside');if(aside){panel=document.createElement('div');panel.id='v119CyclePanel';panel.className='panel';panel.innerHTML='<h3>Déplacement</h3><button id="v119BikeBtn" style="width:100%"></button><div class="small" style="margin-top:7px">Bicyclette : après 3 Sceaux. Les pistes relient les axes utiles et permettent de rouler plus vite.</div>';aside.prepend(panel);btn=panel.querySelector('#v119BikeBtn')}}
  if(!btn)return;const unlocked=bikeUnlockedV119(),track=onCycleTrackV119();btn.disabled=false;btn.textContent=!unlocked?'🔒 Bicyclette — 3 Sceaux':state.bike?'🚲 Descendre du vélo':track?'🚲 Monter — vitesse ×2':'🚲 Rejoins une piste cyclable';btn.onclick=toggleBikeV119
}''')

text = replace_function(text, 'function cycleMoveV119(dx,dy,dir)', r'''function cycleMoveV119(dx,dy,dir){
  ensureBikeUnlockV119();
  if(typeof scene!=='undefined'&&scene==='world'&&state.bike&&!onCycleTrackV119()){state.bike=false;bikeNoticeV119('Tu dois être sur une piste cyclable pour utiliser la bicyclette.')}
  const riding=typeof scene!=='undefined'&&scene==='world'&&state.bike&&onCycleTrackV119();let result=false;
  const passes=riding?2:1;for(let i=0;i<passes;i++){const r=typeof BASE.move==='function'?BASE.move.apply(this,arguments):false;result=!!r||result;if(riding&&!onCycleTrackV119()){state.bike=false;bikeNoticeV119('Tu quittes la piste cyclable : bicyclette rangée.');break}}
  refreshBikeUiV119();return result
}''')

text = text.replace("window.ValdoraCycleV119={version:'V119-CYCLE'", "window.ValdoraCycleV119={version:'V120-CYCLE'")
text = text.replace("// V119 — Réseau cyclable. La bicyclette est débloquée après 3 Sceaux,\n// mais n'est utilisable que sur les pistes explicitement matérialisées.", "// V120 — Réseau cyclable utile. La bicyclette est débloquée après 3 Sceaux,\n// circule sur quelques axes dédiés et apporte réellement un gain de vitesse.")

path.write_text(text, encoding='utf-8')
