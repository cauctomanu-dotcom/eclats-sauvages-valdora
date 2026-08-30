from pathlib import Path
import re
ROOT=Path('.')
GAME=ROOT/'game'
FILES=[p for p in GAME.rglob('*') if p.is_file() and p.suffix.lower() in {'.js','.html','.json'}]

GROUPS={
 'combat':[ 'buildTrainerParty','trainerLevels','completeTaronMission','interactTaron','taronMission','mainTaron','trainerParty','trainerIndex','enemyDefeated','grantEnemyXP' ],
 'guardians':[ 'v104RematchGuardianBattle','v104AwardGuardianSeal','v104GuardianRewardHtml','v104CompleteTrainerBattle','V106U_GUARDS','arenaChallenge','sealMap','guardian','Gardien','sealReward' ],
 'shop':[ 'SHOP_ITEMS','SuperRappel','Super Rappel','Rappel','ElixirVital','Élixir vital','pNormalShopIdsV101P','shopProgress','shopTier','openShop' ],
 'dex':[ 'CREATURES','Object.keys(BY)','BY[59]','BY[100]','BY[127]','BY[149]','BY[150]','BY[161]','BY[162]','BY[163]','BY[164]','BY[165]','BY[166]','BY[167]','BY[168]','BY[169]','id:59','id:100','id:127','id:149','id:150','encounters','encounterPool','wildPool','dexTotal','caughtCount','seenCount' ],
 'routes':[ 'Sylvaris','Sylvestre','Siondon','Simdor','Hautes-Brumes','Hautes Brumes','Caverne d’Or',"Caverne d'Or",'route_littoral','Route du littoral','route4','route3','town6','town8','town12','town13','town14','playerQuestGateMessage','v107kRouteGate','pendingRoadTrainers' ],
 'quests':[ 'museum','musee','musée','directeur','oeuf','œuf','relearn','réapprendre','Solène','Solème','Soleme','contre-espionnage','contre espionnage','Dossier Team Taron','questInteractionV106C','v109kTalkToOutdoorNPC','aube_solene','guardian7_city' ],
 'bike':[ 'state.bike','bikeActive','bikeDir','drawHeroBaseV103O','hookBikeVisual','drawPlayer','drawHero','bikeSpeed','vélo','velo' ],
 'heal_bus_keys':[ 'startHealingSequence','healingSeq','joueurBloque','ValdoraBusV118Bridge','openBusMenuV106Y','v107dBusStop','nearBusStop','keydown','KeyE','Enter' ]
}

def contexts(terms,max_per_file=35,before=8,after=14):
    out=[]
    for p in FILES:
        txt=p.read_text(encoding='utf-8',errors='ignore'); ls=txt.splitlines(); local=[]; seen=[]
        for i,line in enumerate(ls):
            m=[t for t in terms if t.lower() in line.lower()]
            if not m or any(abs(i-j)<18 for j in seen): continue
            seen.append(i); a=max(0,i-before); b=min(len(ls),i+after)
            local.append(f'\n### line {i+1}: {", ".join(m)}\n'+'\n'.join(f'{j+1}: {ls[j]}' for j in range(a,b)))
            if len(local)>=max_per_file: break
        if local: out.append(f'\n## {p.as_posix()}'+''.join(local))
    return ''.join(out)

for name,terms in GROUPS.items():
    text=f'V122 SMALL REPORT: {name.upper()}\n'+('='*96)+contexts(terms)
    (ROOT/f'_AI_V122_small_{name}.txt').write_text(text,encoding='utf-8')
    print(name,len(text))
