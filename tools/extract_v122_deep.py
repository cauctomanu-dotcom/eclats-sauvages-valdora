from pathlib import Path
import re
ROOT=Path('.')
FILES=[p for p in (ROOT/'game').rglob('*') if p.is_file() and p.suffix.lower() in {'.js','.html'}]
NAMES=['buildTrainerParty','enemyDefeated','beginBattle','beginTrainer','beginWild','startWild','grantEnemyXP','markCurrentParticipant','startHealingSequence','sleepAt','drawHero','v83AwardGuardianSeal','v104GuardianRewardHtml','finalTempleAvailableV77','templeGuardsClearedV77','openMuseumDirectorV109A','openAdventureChallengesV106Y','questInteractionV106C','townDiscovered','nearBusStop','v107dBusStop','openBusMenuV106Y','arenaChallenge','startRematchV106Y','rematchAvailable','wildPool','encounterPool','pickWild','chooseWild','wildForZone','routeWild','openCodex','openDex']

def end_block(s,brace):
    dep=0;q=None;esc=False;lc=False;bc=False;tmpl=False;i=brace
    while i<len(s):
        ch=s[i];nx=s[i+1] if i+1<len(s) else ''
        if lc:
            if ch=='\n':lc=False
            i+=1;continue
        if bc:
            if ch=='*' and nx=='/':bc=False;i+=2;continue
            i+=1;continue
        if q:
            if esc:esc=False
            elif ch=='\\':esc=True
            elif ch==q:q=None
            i+=1;continue
        if tmpl:
            if esc:esc=False
            elif ch=='\\':esc=True
            elif ch=='`':tmpl=False
            i+=1;continue
        if ch=='/' and nx=='/':lc=True;i+=2;continue
        if ch=='/' and nx=='*':bc=True;i+=2;continue
        if ch in "'\"":q=ch;i+=1;continue
        if ch=='`':tmpl=True;i+=1;continue
        if ch=='{':dep+=1
        elif ch=='}':
            dep-=1
            if dep==0:return i+1
        i+=1
    return min(len(s),brace+12000)

def funcs(txt,name):
    pats=[rf'function\s+{re.escape(name)}\s*\(',rf'(?:window\.)?{re.escape(name)}\s*=\s*function\s*\(',rf'(?:const|let|var)\s+{re.escape(name)}\s*=\s*(?:async\s*)?function\s*\(',rf'(?:const|let|var)\s+{re.escape(name)}\s*=\s*(?:async\s*)?\([^)]*\)\s*=>']
    out=[];seen=set()
    for pat in pats:
        for m in re.finditer(pat,txt):
            if m.start() in seen:continue
            seen.add(m.start());brace=txt.find('{',m.end()-1)
            if brace<0:continue
            out.append((txt.count('\n',0,m.start())+1,txt[m.start():end_block(txt,brace)]))
    return sorted(out)

out=[]
for name in NAMES:
    out+=['\n'+'='*100,f'FUNCTION {name}','='*100]
    hit=0
    for p in FILES:
        txt=p.read_text(encoding='utf-8',errors='ignore')
        for ln,b in funcs(txt,name):hit+=1;out+=['',f'## {p.as_posix()} line {ln}',b]
    if not hit:out.append('[not found]')

# Raw-context probes for encounter/codex/quest structures that are not functions.
PROBES=['WILD','ENCOUNTER','encounter','wild','CREATURES','dexTotal','codexTotal','161','169','museum_director','solene_aubeval','contre-espionnage','Dossier Team Taron','Aventure+','guardianCircuit','circuit','rematch','legendary','legend_']
out+=['\n'+'='*100,'RAW PROBES','='*100]
for p in FILES:
    txt=p.read_text(encoding='utf-8',errors='ignore');ls=txt.splitlines();hits=[]
    for i,l in enumerate(ls):
        if any(k.lower() in l.lower() for k in PROBES):
            a=max(0,i-2);b=min(len(ls),i+3);block='\n'.join(f'{j+1}: {ls[j]}' for j in range(a,b))
            if block not in hits:hits.append(block)
            if len(hits)>=35:break
    if hits:out+=['',f'## {p.as_posix()}',*hits]
(ROOT/'_AI_V122_deep.txt').write_text('\n'.join(out),encoding='utf-8')
print('deep report',len(out))
