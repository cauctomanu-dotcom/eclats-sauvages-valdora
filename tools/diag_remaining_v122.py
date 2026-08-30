from pathlib import Path

ROOT=Path('.')
GAME=ROOT/'game'
SKIP={'MOBILIER_REFERENCE_VALDORA_V105X.js','V105Y_REFERENCE_INTERIEURS.js'}
TERMS={
 'museum':['directeur','museum','musee','musée','oeuf','œuf','egg','relearn','réapprendre','reapprendre','move reminder'],
 'seals':['7 sceaux','sept sceaux','seal','sceau','aubeval','town14','citadel','citadelle'],
 'quests':['contre-espionnage','contre espionnage','espion','dossier team taron','dossier','aventure+','aventure plus','solene','solème','soleme'],
 'guardians':['rematch','revanche','circuit','guardian reward','guardian','gardien','rewardHtml','AwardGuardian','attaque récompense','attaque recompense'],
 'shop':['Super Rappel','SuperRappel','Rappel','ElixirVital','Élixir vital','Elixir vital','SHOP_ITEMS','shopTier','shopProgress'],
 'bike':['bike','velo','vélo','cycle','drawHero','isOnBike','bikeDir'],
 'dex':['169','id:59','id:100','id:127','id:149','id:150','BY[59]','BY[100]','BY[127]','BY[149]','BY[150]','encounterPool','wildPool','caughtCount','dexTotal'],
}

def contexts(terms,before=5,after=9,max_per_file=28):
    out=[]
    for p in sorted(GAME.rglob('*')):
        if not p.is_file() or p.suffix.lower() not in {'.js','.html'} or p.name in SKIP: continue
        txt=p.read_text(encoding='utf-8',errors='ignore')
        lines=txt.splitlines();local=[];last=-100
        for i,line in enumerate(lines):
            low=line.lower();hits=[t for t in terms if t.lower() in low]
            if not hits or i-last<8: continue
            last=i;a=max(0,i-before);b=min(len(lines),i+after+1);snippet=[]
            for j in range(a,b):
                s=lines[j]
                if len(s)>1500:s=s[:1500]+' …[truncated]'
                snippet.append(f'{j+1}: {s}')
            local.append(f'\n### {p.as_posix()} line {i+1} — {", ".join(hits)}\n'+'\n'.join(snippet))
            if len(local)>=max_per_file:break
        if local:out.extend(local)
    return ''.join(out)

for name,terms in TERMS.items():
    text=f'V122 REMAINING DIAGNOSTIC — {name.upper()}\n'+('='*100)+contexts(terms)
    path=ROOT/f'_AI_V122_remaining_{name}.txt'
    path.write_text(text,encoding='utf-8')
    print(name,len(text))
