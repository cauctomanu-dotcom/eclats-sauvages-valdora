from pathlib import Path
import re
ROOT=Path('.')
FILES=[p for p in (ROOT/'game').rglob('*') if p.is_file() and p.suffix.lower() in {'.js','.html'}]
NAMES=['playerQuestGateMessage','checkPortal','startTrainer413','grantEnemyXP','endBattle','finishBattle','endCombat','arenaChallenge','v83AwardGuardianSeal','startHealingSequence','openShop','openDex','openCodex','drawPlayer','drawHero','drawCharacter','v107dBusStop','openBusMenuV106Y','nearBusStop','completeTaronMission','questInteractionV106C','openMuseumDirectorV109A','openAdventureChallengesV106Y','startRematchV106Y','rematchAvailable','useMove']

def end_block(s,brace):
    depth=0; quote=None; esc=False; linec=False; blockc=False; template=False; i=brace
    while i<len(s):
        ch=s[i]; nx=s[i+1] if i+1<len(s) else ''
        if linec:
            if ch=='\n': linec=False
            i+=1; continue
        if blockc:
            if ch=='*' and nx=='/': blockc=False; i+=2; continue
            i+=1; continue
        if quote:
            if esc: esc=False
            elif ch=='\\': esc=True
            elif ch==quote: quote=None
            i+=1; continue
        if template:
            if esc: esc=False
            elif ch=='\\': esc=True
            elif ch=='`': template=False
            i+=1; continue
        if ch=='/' and nx=='/': linec=True; i+=2; continue
        if ch=='/' and nx=='*': blockc=True; i+=2; continue
        if ch in "'\"": quote=ch; i+=1; continue
        if ch=='`': template=True; i+=1; continue
        if ch=='{': depth+=1
        elif ch=='}':
            depth-=1
            if depth==0:return i+1
        i+=1
    return min(len(s),brace+5000)

def extract_named(txt,name):
    out=[]
    patterns=[
      rf'function\s+{re.escape(name)}\s*\(',
      rf'(?:window\.)?{re.escape(name)}\s*=\s*function\s*\(',
      rf'(?:const|let|var)\s+{re.escape(name)}\s*=\s*function\s*\(',
      rf'(?:const|let|var)\s+{re.escape(name)}\s*=\s*\([^)]*\)\s*=>',
      rf'window\.{re.escape(name)}\s*=\s*\([^)]*\)\s*=>'
    ]
    seen=set()
    for pat in patterns:
      for m in re.finditer(pat,txt):
        if m.start() in seen: continue
        seen.add(m.start())
        brace=txt.find('{',m.end()-1)
        if brace<0: continue
        end=end_block(txt,brace)
        line=txt.count('\n',0,m.start())+1
        out.append((line,txt[m.start():end]))
    return sorted(out)

res=[]
for name in NAMES:
    res.append('\n'+'='*110+f'\nFUNCTION {name}\n'+'='*110)
    found=0
    for p in FILES:
        txt=p.read_text(encoding='utf-8',errors='ignore')
        blocks=extract_named(txt,name)
        for line,b in blocks:
            found+=1;res.append(f'\n## {p.as_posix()} line {line}\n{b}\n')
    if not found: res.append('\n[not found]\n')
(ROOT/'_AI_V122_functions.txt').write_text('\n'.join(res),encoding='utf-8')
print('written',len(res))
