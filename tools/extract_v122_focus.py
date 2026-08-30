from pathlib import Path
ROOT=Path('.')
GAME=ROOT/'game'
FILES=[p for p in GAME.rglob('*') if p.is_file() and p.suffix.lower() in {'.js','.html','.json'}]
TERMS=[
 'buildTrainerParty','trainerLevels','completeTaronMission','interactTaron','taronMission','mainTaron',
 'v104RematchGuardianBattle','v104AwardGuardianSeal','v104GuardianRewardHtml','v104CompleteTrainerBattle',
 'V106U_GUARDS','arenaChallenge','guardian','Gardien','sealReward','Sceau',
 'SHOP_ITEMS','SuperRappel','Super Rappel','Rappel','ElixirVital','Élixir vital','pNormalShopIdsV101P',
 'CREATURES','Object.keys(BY)','BY[59]','BY[100]','BY[127]','BY[149]','BY[150]','BY[161]','BY[169]',
 'id:59','id:100','id:127','id:149','id:150','id:161','id:169','encounters','encounterPool','wildPool',
 'Sylvaris','Sylvestre','Siondon','Simdor','Hautes-Brumes','Hautes Brumes','Caverne d’Or',"Caverne d'Or",
 'route_littoral','Route du littoral','route4','route3','town6','town8','town12','town13','town14',
 'museum','musée','directeur','oeuf','œuf','relearn','réapprendre','Solène','Solème','Soleme','contre-espionnage','Dossier Team Taron',
 'mastery','maîtrise','stationMastery','cityMastery','dexTotal','caughtCount','seenCount',
 'state.bike','bikeActive','bikeDir','drawHeroBaseV103O','startHealingSequence','healingSeq','joueurBloque',
 'ValdoraBusV118Bridge','openBusMenuV106Y','v107dBusStop','keydown','KeyE','Enter'
]

def contexts(path,max_hits=180,before=12,after=24):
    txt=path.read_text(encoding='utf-8',errors='ignore'); ls=txt.splitlines(); hits=[]; seen=[]
    for i,line in enumerate(ls):
        m=[t for t in TERMS if t.lower() in line.lower()]
        if not m: continue
        # Keep nearby contexts separate only if far enough apart.
        if any(abs(i-j)<22 for j in seen): continue
        seen.append(i); a=max(0,i-before); b=min(len(ls),i+after)
        block='\n'.join(f'{j+1}: {ls[j]}' for j in range(a,b))
        hits.append(f'\n### line {i+1}: {", ".join(m)}\n{block}')
        if len(hits)>=max_hits: break
    return ''.join(hits)

out=['V122 MISSING EXACT CONTEXTS','='*100]
for p in FILES:
    c=contexts(p)
    if c: out.append(f'\n## {p.as_posix()}'+c)
(ROOT/'_AI_V122_missing.txt').write_text('\n'.join(out),encoding='utf-8')
print('wrote _AI_V122_missing.txt', sum(len(x) for x in out))
