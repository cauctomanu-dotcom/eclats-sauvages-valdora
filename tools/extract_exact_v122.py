from pathlib import Path
import re

ROOT=Path('.')
GAME=ROOT/'game'
FILES=[GAME/'index.html',GAME/'CREATEUR.html',GAME/'V109W_CORRECTIFS_GAMEPLAY.js']
NAMES=['v104RematchGuardianBattle','v104AwardGuardianSeal','v104GuardianRewardHtml','v104CompleteTrainerBattle','startGuardian','interactInterior','interactInteriorNew','nearNpc','openShop','pNormalShopIdsV101P','interactTaronOpV106Z','activateTaronOpV106Z','openTaronDossierV106Z','v106zContractProgress','contractProgressV106Z','openContractsV106Z','drawHero','move','toggleBike','useBike']
TERMS=['guide','directeur','museum','musee','oeuf','œuf','relearn','réapprendre','Rappel','ElixirVital','SuperRappel','10 gares','gares découvertes','masteries','Maîtrise urbaine','contre-espionnage','taronOps','guardianCircuit','circuit','rematchV106Y','revanche','ValdoraCycleV119','bike_left','bike_right','bike_up','bike_down']

def block(txt,name):
    for prefix in [f'function {name}(',f'function {name} (']:
        s=txt.find(prefix)
        if s>=0:break
    else:return None
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

def contexts(txt,term,limit=5):
    ls=txt.splitlines();out=[]
    for i,l in enumerate(ls):
        if term.lower() not in l.lower():continue
        a=max(0,i-4);b=min(len(ls),i+7)
        sn='\n'.join(f'{j+1}: {ls[j][:1600]}' for j in range(a,b))
        out.append(sn)
        if len(out)>=limit:break
    return out

for p in FILES:
    txt=p.read_text(encoding='utf-8',errors='ignore');out=[f'EXACT V122 — {p.name}\n']
    for name in NAMES:
        b=block(txt,name)
        if b:out.append(f'\n===== FUNCTION {name} =====\n{b[:12000]}\n')
    for term in TERMS:
        cs=contexts(txt,term)
        if cs:out.append(f'\n===== TERM {term} =====\n'+'\n---\n'.join(cs)+'\n')
    dst=ROOT/f'_AI_V122_exact_{p.stem}.txt';dst.write_text(''.join(out),encoding='utf-8');print(dst,len(''.join(out)))
