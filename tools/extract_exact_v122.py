from pathlib import Path

ROOT=Path('.')
GAME=ROOT/'game'
FILES=[GAME/'index.html',GAME/'CREATEUR.html',GAME/'V109W_CORRECTIFS_GAMEPLAY.js']
NAMES=['zContractProgress','serviceInteract','v104RematchGuardianBattle','v104AwardGuardianSeal','v104GuardianRewardHtml','v104CompleteTrainerBattle','arenaChallenge','drawHeroBaseV103O','hookBikeVisual','toggleBike','useBike','v104GuardianParty','v106cProgress','v106cQuestDone','nearInteriorNPC']
TERMS=['directeur','oeuf','œuf','relearn','réapprendre','ElixirVital','SuperRappel','masteries','Maîtrise urbaine','taronOps','rematchV106Y','revanche','ValdoraCycleV119','bike_left','bike_right','bike_up','bike_down','"id":59','"id":100','"id":127','"id":149','"id":150','BY[59]','BY[100]','BY[127]','BY[149]','BY[150]']

def block(txt,name):
    starts=[f'function {name}(',f'function {name} (']
    s=next((txt.find(p) for p in starts if txt.find(p)>=0),-1)
    if s<0:return None
    b=txt.find('{',s);depth=0;quote=None;esc=False;line=False;comment=False;i=b
    while i<len(txt):
        c=txt[i];n=txt[i+1] if i+1<len(txt) else ''
        if line:
            if c=='\n':line=False
            i+=1;continue
        if comment:
            if c=='*' and n=='/':comment=False;i+=2;continue
            i+=1;continue
        if quote:
            if esc:esc=False
            elif c=='\\':esc=True
            elif c==quote:quote=None
            i+=1;continue
        if c=='/' and n=='/':line=True;i+=2;continue
        if c=='/' and n=='*':comment=True;i+=2;continue
        if c in "'\"`":quote=c;i+=1;continue
        if c=='{':depth+=1
        elif c=='}':
            depth-=1
            if depth==0:return txt[s:i+1]
        i+=1
    return None

def safe_name(s):return ''.join(ch if ch.isalnum() else '_' for ch in s)[:80]

for name in NAMES:
    out=[]
    for p in FILES:
        txt=p.read_text(encoding='utf-8',errors='ignore');b=block(txt,name)
        if b:out.append(f'===== {p.name} :: {name} =====\n{b}\n')
    if out:
        (ROOT/f'_AI_V122_fn_{safe_name(name)}.txt').write_text('\n'.join(out),encoding='utf-8')
        print(name,sum(map(len,out)))

for term in TERMS:
    out=[]
    for p in FILES:
        ls=p.read_text(encoding='utf-8',errors='ignore').splitlines();hits=0
        for i,l in enumerate(ls):
            if term.lower() not in l.lower():continue
            a=max(0,i-3);b=min(len(ls),i+5)
            out.append(f'===== {p.name} line {i+1} :: {term} =====\n'+'\n'.join(f'{j+1}: {ls[j][:1200]}' for j in range(a,b)))
            hits+=1
            if hits>=3:break
    if out:
        (ROOT/f'_AI_V122_term_{safe_name(term)}.txt').write_text('\n\n'.join(out),encoding='utf-8')
        print(term,sum(map(len,out)))
