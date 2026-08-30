from pathlib import Path
import re

ROOT=Path('.')
FILES=[ROOT/'game/index.html',ROOT/'game/CREATEUR.html',ROOT/'game/V109W_CORRECTIFS_GAMEPLAY.js']
TERMS=['partyIndex','trainer.party','v109wEnemyParticipants','grantEnemyXP(','finishBattle(','enemy.hp<=0','enemy.hp <= 0','battle.result','startTaronBattle','completeTaronMission','startBattle(','buildTrainerParty','next enemy','prochain Éclat','prochain eclat']

def block_around(lines,i,before=18,after=45):
    a=max(0,i-before);b=min(len(lines),i+after)
    return '\n'.join(f'{j+1}: {lines[j]}' for j in range(a,b))

out=['V122 BATTLE CORE DIAGNOSTIC\n'+'='*100+'\n']
for p in FILES:
    if not p.exists():continue
    txt=p.read_text(encoding='utf-8',errors='ignore');lines=txt.splitlines()
    out.append(f'\n######## {p.as_posix()} ########\n')
    hits=[]
    for i,line in enumerate(lines):
        matched=[t for t in TERMS if t.lower() in line.lower()]
        if not matched:continue
        if any(abs(i-j)<28 for j,_ in hits):continue
        hits.append((i,matched))
    for i,matched in hits[:80]:
        out.append(f'\n### line {i+1}: {", ".join(matched)}\n{block_around(lines,i)}\n')

(ROOT/'_AI_V122_battle_core.txt').write_text(''.join(out),encoding='utf-8')
print('wrote',len(''.join(out)),'chars')
