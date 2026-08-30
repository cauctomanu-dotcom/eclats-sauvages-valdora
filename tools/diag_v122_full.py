from pathlib import Path
import re, json
ROOT=Path('.')
GAME=ROOT/'game'
FILES=[p for p in GAME.rglob('*') if p.suffix.lower() in {'.js','.html','.json','.md','.txt'} and p.is_file()]
TERMS={
'world_links':['Simdor','Cimes-d’Or','Cimes-d\'Or','Hautes Brumes','Hautes-Brumes','Littoral','Taronis','Aubeval','Sylv','route2','route3','route4','route7','route_m1','route_m2','route_horizons'],
'bus':['ValdoraBus','busStop','bus stop','arrêt','arret','Fluo','Crossway','busNetwork','busRoutes','openBus','interactBus'],
'xp':['grantEnemyXP','participants','participant','experience','exp','xp','KO','K.O.'],
'taron':['Team Taron','Taron','completeTaronMission','taronBoss','taron_agent','Dossier Team'],
'guardians':['guardian','gardien','rematch','revanche','circuit','seal','Sceau','attack reward','capsule'],
'museum':['musée','musee','museum','directeur','oeuf','œuf','relearn','réapprendre'],
'quests':['contre-espionnage','espionnage','Solème','Soleme','Aventure+','mission'],
'items':['Rappel','Elixir','Élixir','revive','shop','boutique'],
'codex':['Écladex','Ecladex','codex','CREATURES','169','161'],
'bike':['bike','bicycle','bicyclette','drawPlayer','drawHero','drawCharacter','spritePlayer'],
'care':['heal','soin','sleepAt','15000','joueurBloque','playerLocked']
}

def excerpt(path,pat,context=2):
    try: lines=path.read_text(encoding='utf-8',errors='ignore').splitlines()
    except: return []
    out=[]
    rx=re.compile(pat,re.I)
    for i,l in enumerate(lines):
        if rx.search(l):
            a=max(0,i-context); b=min(len(lines),i+context+1)
            out.append((i+1,'\n'.join(f'{j+1}: {lines[j]}' for j in range(a,b))))
    return out

lines=[]
lines.append('VALDORA V122 FULL REGRESSION AUDIT')
lines.append('='*80)
for cat,terms in TERMS.items():
    lines.append(f'\n## {cat.upper()}')
    count=0
    for p in FILES:
        txt=p.read_text(encoding='utf-8',errors='ignore')
        hits=[]
        for term in terms:
            if re.search(re.escape(term),txt,re.I): hits.append(term)
        if not hits: continue
        count+=1
        lines.append(f'\n### {p.as_posix()}  [terms: {", ".join(hits)}]')
        # show max 12 focused snippets for useful symbols/terms
        chosen=[]
        for term in hits:
            for ln,ex in excerpt(p,re.escape(term),1):
                if (ln,ex) not in chosen: chosen.append((ln,ex))
                if len(chosen)>=12: break
            if len(chosen)>=12: break
        for ln,ex in chosen: lines.append(ex)
    lines.append(f'FILES_MATCHED={count}')

# Creature roster summary / IDs if evaluable as text
lines.append('\n## CREATURE ID FOCUS')
for p in FILES:
    txt=p.read_text(encoding='utf-8',errors='ignore')
    if 'CREATURES' not in txt and 'Ecladex' not in txt and 'Écladex' not in txt: continue
    ids=[]
    for target in [59,100,127,149,150,161,169]:
        if re.search(rf'\bid\s*:\s*{target}\b|\[\s*{target}\s*\]|#{target}\b',txt): ids.append(target)
    if ids: lines.append(f'{p.as_posix()}: focus ids present {ids}')

# Route/exits and known scene definitions
lines.append('\n## SCENE / EXIT DEFINITIONS')
for p in FILES:
    txt=p.read_text(encoding='utf-8',errors='ignore')
    if 'SCENES' not in txt and 'exits' not in txt: continue
    wanted=['route_m1','route_m2','route2','route3','route4','route7','town6','town8','town14','route_horizons']
    if any(w in txt for w in wanted):
        lines.append(f'-- {p.as_posix()} --')
        for w in wanted:
            for ln,ex in excerpt(p,re.escape(w),2):
                lines.append(ex)
                break

# Find functions likely patched multiple times
lines.append('\n## DUPLICATE HOOK DEFINITIONS')
fnames=['move','drawWorld','drawPlayer','interact','checkPortal','playerQuestGateMessage','grantEnemyXP','completeTaronMission','startTrainer413','sceneNPCs','updateTownNPCs']
for fn in fnames:
    found=[]
    for p in FILES:
        txt=p.read_text(encoding='utf-8',errors='ignore')
        c=len(re.findall(rf'\b{re.escape(fn)}\b',txt))
        if c: found.append(f'{p.name}:{c}')
    lines.append(fn+' => '+', '.join(found[:30]))

(ROOT/'_AI_DIAG_V122.txt').write_text('\n'.join(lines),encoding='utf-8')
print('audit written', len(lines))
