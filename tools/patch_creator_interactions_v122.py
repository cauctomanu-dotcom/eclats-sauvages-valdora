from pathlib import Path

ROOT=Path('.')

# ---------- JS function parser / replacer ----------
def function_ranges(text,name):
    needle=f'function {name}('
    out=[];pos=0
    while True:
        s=text.find(needle,pos)
        if s<0:break
        b=text.find('{',s)
        if b<0:break
        depth=0;quote=None;esc=False;line=False;block=False;i=b
        while i<len(text):
            c=text[i];n=text[i+1] if i+1<len(text) else ''
            if line:
                if c=='\n':line=False
            elif block:
                if c=='*' and n=='/':block=False;i+=1
            elif quote:
                if esc:esc=False
                elif c=='\\':esc=True
                elif c==quote:quote=None
            else:
                if c=='/' and n=='/':line=True;i+=1
                elif c=='/' and n=='*':block=True;i+=1
                elif c in "'\"`":quote=c
                elif c=='{':depth+=1
                elif c=='}':
                    depth-=1
                    if depth==0:
                        out.append((s,i+1));pos=i+1;break
            i+=1
        else:raise RuntimeError(f'Unclosed function {name}')
    return out

def replace_one(text,name,new):
    ranges=function_ranges(text,name)
    if len(ranges)!=1:
        raise RuntimeError(f'{name}: expected exactly 1 definition, got {len(ranges)}')
    a,b=ranges[0]
    return text[:a]+new+text[b:]

def replace_literal(text,old,new,label,count=1):
    got=text.count(old)
    if got!=count:raise RuntimeError(f'{label}: expected {count} occurrence(s), got {got}')
    return text.replace(old,new,count)

CREATOR_COLLECTION=r'''function creatorLegends(){
  if(!creatorMode()||typeof state==='undefined'||typeof mon!=='function'||typeof BY==='undefined')return;
  state.team=Array.isArray(state.team)?state.team:[];
  state.box=Array.isArray(state.box)?state.box:[];
  state.dex=state.dex||{};
  state.flags=state.flags||{};

  const ids=Array.from({length:169},(_,i)=>i+1);
  const available=ids.filter(id=>!!BY[id]);
  const firstFullSeed=!state.flags.creatorFullCollectionV122;
  const boxIds=new Set(state.box.map(m=>Number(m?.id)).filter(Boolean));
  const ownedIds=new Set([...state.team,...state.box].map(m=>Number(m?.id)).filter(Boolean));
  const legendLevels={151:60,152:64,153:61,154:63,155:66,156:62,157:65,158:60,159:64,160:67,161:68};
  let changed=false;

  for(const id of ids){
    const previous=state.dex[id]||{};
    if(!previous.seen||!previous.caught){state.dex[id]={...previous,seen:true,caught:true};changed=true}
    if(!BY[id]||boxIds.has(id))continue;
    // Première activation : les 169 espèces sont réellement disponibles dans le PC,
    // même si le joueur a déjà un exemplaire dans son équipe. Ensuite, retirer un
    // Éclat du PC ne crée pas de clone tant qu'il reste possédé dans l'équipe.
    if(!firstFullSeed&&ownedIds.has(id))continue;
    const level=legendLevels[id]||(id>=162?30:30);
    const m=mon(id,level);
    if(typeof defaultMoves==='function')m.moves=defaultMoves(id,m.level);
    state.box.push(m);boxIds.add(id);ownedIds.add(id);changed=true;
  }

  if(available.length===169&&!state.flags.creatorFullCollectionV122){state.flags.creatorFullCollectionV122=true;changed=true}

  // Le mode Créateur représente un dossier de progression complet pour les
  // prérequis de la Citadelle, sans modifier le comportement du mode Joueur.
  const seals=new Set((Array.isArray(state.seals)?state.seals:[]).map(Number).filter(Number.isFinite));
  for(let i=1;i<=7;i++)if(!seals.has(i)){seals.add(i);changed=true}
  state.seals=[...seals].sort((a,b)=>a-b);
  if(state.fly!==true){state.fly=true;changed=true}

  const flyer=[...state.team,...state.box].find(m=>BY?.[m?.id]?.type==='Air');
  if(flyer){
    flyer.moves=Array.isArray(flyer.moves)?flyer.moves:[];
    if(!flyer.moves.includes('vol')){
      if(flyer.moves.length>=4)flyer.moves[flyer.moves.length-1]='vol';else flyer.moves.push('vol');
      try{if(typeof ensureMovePPV106U==='function')ensureMovePPV106U(flyer,true)}catch(_){}
      changed=true;
    }
  }
  if(changed){try{save(false)}catch(_){}}
}'''

CITADEL_REQ=r'''function v106pCitadelRequirements(){
  const creator=(()=>{try{return typeof v61CreatorMode==='function'?!!v61CreatorMode():/CREATEUR/i.test(location.pathname)}catch(_){return false}})();
  if(creator)return {caught:169,seals:7,vol:true,ready:true,creator:true};
  const caught=v83CaughtCount(),seals=(state.seals||[]).length,vol=v106pHasVolMastery();
  return {caught,seals,vol,ready:caught>=75&&seals>=7&&vol};
}'''

NEAR_INTERIOR=r'''function nearInteriorNPC(){
  const list=currentRoom().npcs||[];
  if(!list.length)return null;
  const reach=30;
  const p=state.dir===0?{x:state.roomX,y:state.roomY+reach}:
          state.dir===1?{x:state.roomX-reach,y:state.roomY}:
          state.dir===2?{x:state.roomX+reach,y:state.roomY}:
                        {x:state.roomX,y:state.roomY-reach};
  let best=null,bd=Infinity;
  for(const n of list){const d=Math.hypot(p.x-n.x,p.y-n.y);if(d<bd){bd=d;best=n}}
  if(best&&bd<30)return best;
  best=null;bd=Infinity;
  for(const n of list){const d=Math.hypot(state.roomX-n.x,state.roomY-n.y);if(d<bd){bd=d;best=n}}
  return best&&bd<42?best:null
}'''

NEAR_NPC_OLD=r'''function nearNpc(){
  const list=current().npcs||[];let best=null,score=Infinity;
  const v=state.dir===0?{x:0,y:1}:state.dir===1?{x:-1,y:0}:state.dir===2?{x:1,y:0}:{x:0,y:-1};
  for(const n of list){
    const dx=n.x-state.roomX,dy=n.y-state.roomY,d=Math.hypot(dx,dy);if(d>56)continue;
    const dot=d?((dx/d)*v.x+(dy/d)*v.y):1;if(d>22&&dot<.05)continue;
    const rank=d+(1-dot)*12;if(rank<score){score=rank;best=n}
  }
  return best;
}'''

V109J_FURNITURE=r'''function v109jTargetFurniture(){
  const v=state.dir===0?{x:0,y:1}:state.dir===1?{x:-1,y:0}:state.dir===2?{x:1,y:0}:{x:0,y:-1};
  let best=null,score=Infinity;
  for(const m of furniture()){
    if(!m.interactif)continue;
    const r=v109jRect(m),tx=Math.max(r.x,Math.min(r.x+r.w,state.roomX)),ty=Math.max(r.y,Math.min(r.y+r.h,state.roomY));
    const dx=tx-state.roomX,dy=ty-state.roomY,d=Math.hypot(dx,dy);if(d>56)continue;
    const forward=dx*v.x+dy*v.y,side=Math.abs(dx*v.y-dy*v.x);
    if(d>18&&(forward<0||side>Math.max(24,forward*.7+10)))continue;
    const rank=d+side*.18;if(rank<score){score=rank;best=m}
  }
  return best;
}'''

FACES_FURNITURE=r'''function facesFurniture(m){
  if(!m.interactif)return false;
  const v=dirVector(state.dir),reach=30;
  const px=state.roomX+v.x*reach,py=state.roomY+v.y*reach;
  const r=interactionRect(m),d=distanceRect(px,py,r);
  const cx=r.x+r.w/2,cy=r.y+r.h/2;
  const dot=(cx-state.roomX)*v.x+(cy-state.roomY)*v.y;
  return d<=32&&dot>-8;
}'''

PLAYER_POINT=r'''function playerInteractionPoint(){
  const dist=34;
  if(state.dir===0)return {x:state.x,y:state.y+dist};
  if(state.dir===1)return {x:state.x-dist,y:state.y};
  if(state.dir===2)return {x:state.x+dist,y:state.y};
  return {x:state.x,y:state.y-dist};
}'''

NEAR_WORLD_LEGACY=r'''function nearNPC(){
  const sc=currentScene();
  const list=[...currentNPCs(),...((sc&&sc.megacity&&Array.isArray(sc.megaNPCs))?sc.megaNPCs:[])];
  if(!list.length)return null;
  const p=playerInteractionPoint();
  let best=null,bd=Infinity;
  for(const n of list){const d=Math.hypot(p.x-n.x,p.y-n.y);if(d<bd){bd=d;best=n}}
  if(best&&bd<34)return best;
  best=null;bd=Infinity;
  for(const n of list){const d=Math.hypot(state.x-n.x,state.y-n.y);if(d<bd){bd=d;best=n}}
  return best&&bd<44?best:null
}'''

V105Y_FURNITURE=r'''function targetFurniture(){
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
  }'''

V105Y_NPC=r'''function targetNpc(){
    const people=standardNpcs(),v=state.dir===0?{x:0,y:1}:state.dir===1?{x:-1,y:0}:state.dir===2?{x:1,y:0}:{x:0,y:-1};
    let best=null,score=Infinity;
    for(const n of people){
      const dx=n.x-state.roomX,dy=n.y-state.roomY,d=Math.hypot(dx,dy);if(d>56)continue;
      const dot=d?((dx/d)*v.x+(dy/d)*v.y):1;if(d>22&&dot<.05)continue;
      const rank=d+(1-dot)*12;if(rank<score){score=rank;best=n}
    }
    return best;
  }'''

V109V_NEAR_NPC=r'''function nearestNpcWithDistance(){
  let best=null,bm=null;for(const n of session?.npcs||[]){const m=targetMetrics(n.x,n.y,50);if(!m)continue;if(!bm||m.score<bm.score){best=n;bm=m}}
  return{target:best,distance:bm?.distance??Infinity,score:bm?.score??Infinity,metrics:bm}
}'''

V109V_NEAR_FURN=r'''function nearestFurnitureWithDistance(max=50){
  let best=null,bm=null;for(const m of furn()){
    if(!userInteractable(m))continue;const d=pointRectDistance(state.roomX,state.roomY,rectOf(m));if(d>max)continue;
    const p=furnitureAimPoint(m),metrics=targetMetrics(p.x,p.y,max+2);if(!metrics)continue;
    const fn=String(m.fonction||'decor'),functional=fn!=='decor'&&fn!=='collision_mur',score=metrics.score+(functional?-3:8);
    if(!bm||score<bm.score){best=m;bm={...metrics,score}}
  }
  return{target:best,distance:bm?.distance??Infinity,score:bm?.score??Infinity,metrics:bm}
}'''

V109V_NEAR_FURN_ALIAS="function nearFurniture(max=50){return nearestFurnitureWithDistance(max).target}"
V109V_NEAREST_TARGET=r'''function nearestInteractionTarget(){
  const fq=nearestFurnitureWithDistance(50);if(fq.target)return{kind:'furniture',target:fq.target,score:fq.score};
  const nq=nearestNpcWithDistance();if(nq.target)return{kind:'npc',target:nq.target,score:nq.score};
  return null
}'''

V118_NEAR_WORLD=r'''function nearWorldNpc(){
  const sc=current();if(!sc||sc.kind!=='town')return null;const v=facingVector(),people=allWorldCitizens(sc,state.zone);let best=null,score=Infinity;
  for(const n of people){
    const dx=n.x-state.x,dy=n.y-state.y,d=Math.hypot(dx,dy);if(d>58)continue;
    const dot=d?((dx/d)*v.x+(dy/d)*v.y):1;if(d>22&&dot<.05)continue;
    const rank=d+(1-dot)*16;if(rank<score){score=rank;best=n}
  }
  return best
}'''

# ---------- giant HTML copies ----------
for rel in ['game/index.html','game/CREATEUR.html']:
    p=ROOT/rel
    txt=p.read_text(encoding='utf-8')
    for name,new in [
      ('creatorLegends',CREATOR_COLLECTION),('v106pCitadelRequirements',CITADEL_REQ),
      ('nearInteriorNPC',NEAR_INTERIOR),('nearNpc',NEAR_NPC_OLD),
      ('v109jTargetFurniture',V109J_FURNITURE),('facesFurniture',FACES_FURNITURE),
      ('playerInteractionPoint',PLAYER_POINT),('nearNPC',NEAR_WORLD_LEGACY)
    ]:
        txt=replace_one(txt,name,new)
    p.write_text(txt,encoding='utf-8')
    print(rel,'patched')

# ---------- final interior implementation ----------
p=ROOT/'game/V105Y_REFERENCE_INTERIEURS.js';txt=p.read_text(encoding='utf-8')
txt=replace_one(txt,'targetFurniture',V105Y_FURNITURE)
txt=replace_one(txt,'targetNpc',V105Y_NPC)
p.write_text(txt,encoding='utf-8');print(p,'patched')

# ---------- rewritten interior implementation ----------
p=ROOT/'game/V109V_INTERIEUR_REWRITE.js';txt=p.read_text(encoding='utf-8')
txt=replace_one(txt,'nearestNpcWithDistance',V109V_NEAR_NPC)
txt=replace_one(txt,'nearestFurnitureWithDistance',V109V_NEAR_FURN)
txt=replace_one(txt,'nearFurniture',V109V_NEAR_FURN_ALIAS)
txt=replace_one(txt,'nearestInteractionTarget',V109V_NEAREST_TARGET)
p.write_text(txt,encoding='utf-8');print(p,'patched')

# ---------- living world ----------
p=ROOT/'game/VALDORA_LIVING_WORLD_V118.js';txt=p.read_text(encoding='utf-8')
txt=replace_one(txt,'nearWorldNpc',V118_NEAR_WORLD)
txt=replace_literal(txt,'if(taron&&d<=72){','if(taron&&d<=58){','Team Taron interaction distance')
txt=replace_literal(txt,'if(n&&distance(n,state)<=94)return talkWorldNpc(n);','if(n&&distance(n,state)<=60)return talkWorldNpc(n);','V118 NPC final distance')
p.write_text(txt,encoding='utf-8');print(p,'patched')

# ---------- source-level verification ----------
for rel in ['game/index.html','game/CREATEUR.html']:
    txt=(ROOT/rel).read_text(encoding='utf-8')
    required=[
      'Array.from({length:169}', 'creatorFullCollectionV122',
      'return {caught:169,seals:7,vol:true,ready:true,creator:true}',
      'const dist=34;', 'return best&&bd<44?best:null', 'if(d>56)continue;'
    ]
    for needle in required:
        if needle not in txt:raise RuntimeError(f'{rel}: missing {needle}')
    if 'return best&&bd<=105?best:null' in txt:raise RuntimeError(f'{rel}: old 105 interaction radius remains')
    if 'd<118&&d<bd' in txt:raise RuntimeError(f'{rel}: old furniture 118 radius remains')

v105=(ROOT/'game/V105Y_REFERENCE_INTERIEURS.js').read_text(encoding='utf-8')
if 'if(d>54)continue;' not in v105 or 'if(d>56)continue;' not in v105:raise RuntimeError('V105Y interaction calibration absent')
v109=(ROOT/'game/V109V_INTERIEUR_REWRITE.js').read_text(encoding='utf-8')
if 'targetMetrics(n.x,n.y,50)' not in v109 or 'nearestFurnitureWithDistance(50)' not in v109:raise RuntimeError('V109V interaction calibration absent')
v118=(ROOT/'game/VALDORA_LIVING_WORLD_V118.js').read_text(encoding='utf-8')
if 'if(d>58)continue;' not in v118 or 'distance(n,state)<=60' not in v118:raise RuntimeError('V118 world interaction calibration absent')
print('All V122 creator/citadel/interaction source checks passed')
