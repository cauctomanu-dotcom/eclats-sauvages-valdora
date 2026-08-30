from pathlib import Path

ROOT=Path('.')
GAME=ROOT/'game'
FILES=[
 GAME/'index.html', GAME/'CREATEUR.html', GAME/'V105Y_REFERENCE_INTERIEURS.js',
 GAME/'V109V_INTERIEUR_REWRITE.js', GAME/'V109W_CORRECTIFS_GAMEPLAY.js',
 GAME/'VALDORA_LIVING_WORLD_V118.js'
]
FILES=[p for p in FILES if p.exists()]

FUNCTIONS=[
 'v61CreatorMode','creatorMode','isCreatorMode','enableCreatorMode','applyCreatorMode',
 'openPC','openPc','openStorage','openDex','openCodex','dex','codex',
 'citadel','citadelle','canEnterCitadel','canEnterCitadelle','playerQuestGateMessage',
 'interactInterior','interactInteriorNew','targetFurniture','targetNpc','nearInteriorNPC',
 'nearNpc','serviceInteract','worldInteractV118','nearNPC','near'
]
TERMS=[
 'v61CreatorMode','creator','createur','créateur','Codex','Écladex','Ecladex','caught','seen',
 'storage','reserve','réserve','box','pcBox','computer','ordinateur','Citadelle','citadel',
 'seals','sceaux','legendary','légendaire','trainerWins','targetFurniture','targetNpc',
 'nearInteriorNPC','interaction','interactif','Math.hypot','distanceRect','reach=',
 'bd<','range=','near?.('
]

def function_block(txt,name):
    starts=[f'function {name}(',f'function {name} (']
    s=-1
    for p in starts:
        i=txt.find(p)
        if i>=0:s=i;break
    if s<0:return None
    b=txt.find('{',s)
    if b<0:return None
    depth=0;quote=None;esc=False;line=False;comment=False;i=b
    while i<len(txt):
        c=txt[i];n=txt[i+1] if i+1<len(txt) else ''
        if line:
            if c=='\n':line=False
        elif comment:
            if c=='*' and n=='/':comment=False;i+=1
        elif quote:
            if esc:esc=False
            elif c=='\\':esc=True
            elif c==quote:quote=None
        else:
            if c=='/' and n=='/':line=True;i+=1
            elif c=='/' and n=='*':comment=True;i+=1
            elif c in "'\"`":quote=c
            elif c=='{':depth+=1
            elif c=='}':
                depth-=1
                if depth==0:return txt[s:i+1]
        i+=1
    return txt[s:s+12000]

def contexts(txt,term,limit=8,before=5,after=10):
    ls=txt.splitlines();out=[]
    for i,line in enumerate(ls):
        if term.lower() not in line.lower():continue
        a=max(0,i-before);b=min(len(ls),i+after)
        out.append(f'### line {i+1} :: {term}\n'+'\n'.join(f'{j+1}: {ls[j][:1800]}' for j in range(a,b)))
        if len(out)>=limit:break
    return out

out=[]
for p in FILES:
    txt=p.read_text(encoding='utf-8',errors='ignore')
    section=[f'\n\n######## {p.as_posix()} ########\n']
    for name in FUNCTIONS:
        b=function_block(txt,name)
        if b:section.append(f'\n===== FUNCTION {name} =====\n{b[:18000]}\n')
    for term in TERMS:
        cs=contexts(txt,term)
        if cs:section.append(f'\n===== TERM {term} =====\n'+'\n---\n'.join(cs)+'\n')
    out.extend(section)

text='V122 CREATOR / CITADEL / INTERACTION DIAGNOSTIC\n'+''.join(out)
(ROOT/'_AI_V122_creator_interactions.txt').write_text(text,encoding='utf-8')
print('report chars',len(text))
