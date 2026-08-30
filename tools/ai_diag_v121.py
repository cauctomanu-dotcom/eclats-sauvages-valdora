from pathlib import Path
import re

ROOT=Path('.')
OUT=[]

def add(title, text):
    OUT.append('\n===== '+title+' =====\n'+text[:50000])

# 1. Locate launcher/home and creator hooks.
for p in ROOT.rglob('*'):
    if not p.is_file() or p.suffix.lower() not in {'.html','.js','.txt','.md'}: continue
    try: s=p.read_text(encoding='utf-8',errors='ignore')
    except Exception: continue
    if 'Nouvelle partie' in s or 'Récupérer une sauvegarde' in s or 'Recuperer une sauvegarde' in s:
        hits=[]
        lines=s.splitlines()
        for i,l in enumerate(lines):
            if 'Nouvelle partie' in l or 'sauvegarde' in l.lower() or 'Continuer' in l:
                a=max(0,i-8); b=min(len(lines),i+16)
                hits.append(f'-- {p}:{i+1} --\n'+'\n'.join(f'{j+1}: {lines[j]}' for j in range(a,b)))
        add('HOME '+str(p),'\n'.join(hits))
    if 'v61CreatorMode' in s or 'CREATOR_MODE' in s or 'CREATEUR' in s.upper():
        hits=[]; lines=s.splitlines()
        for i,l in enumerate(lines):
            if 'v61CreatorMode' in l or 'CREATOR_MODE' in l or 'CREATEUR' in l.upper():
                a=max(0,i-4);b=min(len(lines),i+8)
                hits.append(f'-- {p}:{i+1} --\n'+'\n'.join(f'{j+1}: {lines[j]}' for j in range(a,b)))
                if len(hits)>=18: break
        if hits:add('CREATOR '+str(p),'\n'.join(hits))

# 2. Living-world PNJ movement code around likely symbols.
p=Path('game/VALDORA_LIVING_WORLD_V118.js')
if p.exists():
    s=p.read_text(encoding='utf-8',errors='ignore'); lines=s.splitlines()
    terms=('citizen','npc','target','waypoint','relocate','population','move','placed','despawn','spawn','path','pause')
    hits=[]
    for i,l in enumerate(lines):
        low=l.lower()
        if any(t in low for t in terms) and ('function ' in l or '=>' in l or '_v118' in l or 'splice' in l or '.filter' in l):
            a=max(0,i-3); b=min(len(lines),i+10)
            hits.append(f'-- {p}:{i+1} --\n'+'\n'.join(f'{j+1}: {lines[j]}' for j in range(a,b)))
    add('LIVING WORLD NPC FUNCTIONS','\n'.join(hits[:140]))

# 3. Find all functions/wrappers touching town citizens / coordinates.
for p in Path('game').rglob('*.js'):
    try:s=p.read_text(encoding='utf-8',errors='ignore')
    except:continue
    if not any(x in s for x in ('allWorldCitizens','townCitizens','v118Citizens','citizens','_v118Placed')): continue
    lines=s.splitlines(); hits=[]
    for i,l in enumerate(lines):
        if any(x in l for x in ('allWorldCitizens','townCitizens','v118Citizens','_v118Placed')):
            a=max(0,i-3);b=min(len(lines),i+10);hits.append(f'-- {p}:{i+1} --\n'+'\n'.join(f'{j+1}: {lines[j]}' for j in range(a,b)))
            if len(hits)>=35:break
    if hits:add('NPC REF '+str(p),'\n'.join(hits))

# 4. Scene graph and definitions useful for dedicated cycle routes.
for p in Path('game').rglob('*.js'):
    try:s=p.read_text(encoding='utf-8',errors='ignore')
    except:continue
    if 'SCENES' not in s: continue
    lines=s.splitlines(); hits=[]
    for i,l in enumerate(lines):
        if ('SCENES' in l and any(k in l for k in ('=', '[', '.'))) or re.search(r"\b(town\d+|route\d+)\b",l):
            if 'exits' in l or 'SCENES' in l or 'route0' in l or 'town0' in l:
                a=max(0,i-2);b=min(len(lines),i+7);hits.append(f'-- {p}:{i+1} --\n'+'\n'.join(f'{j+1}: {lines[j]}' for j in range(a,b)))
                if len(hits)>=45:break
    if hits:add('SCENE GRAPH '+str(p),'\n'.join(hits))

Path('_AI_DIAG_V121.txt').write_text('\n'.join(OUT),encoding='utf-8')
print('diagnostic sections',len(OUT))
