from pathlib import Path
import re
ROOT=Path('.')
GAME=ROOT/'game'
FILES=[p for p in GAME.rglob('*') if p.is_file() and p.suffix.lower() in {'.js','.html','.json'}]

FUNCTIONS=[
 'startTrainer413','grantEnemyXP','finishBattle','endBattle','battleVictory','battleWin','enemyFainted','nextEnemy',
 'startHealingSequence','openShop','arenaChallenge','questInteractionV106C','v107bAubeNPCInteraction','v109kTalkToOutdoorNPC',
 'playerQuestGateMessage','v107kRouteGate','checkPortal','nearBusStop','openBusMenuV106Y','boardBusV106Y',
 'openCodex','openDex','openEcladex','drawPlayer','drawHero','movePlayer','tryMove','interact','nearDoorV114'
]
GROUPS={
 'battle_flow':['trainerTeam','enemyTeam','battle.participants','trainerQueue','partyIndex','teamIndex','battle.enemy','battle.trainer','startTrainer413','grantEnemyXP','trainerEvent','trainerWins'],
 'guardians_flow':['V106U_GUARDS','sealMap','arenaChallenge','sealReward','guardianReward','moveReward','attackReward','rematch','Sceau','Gardien'],
 'quests_flow':['Dossier Team Taron','contre-espionnage','Solème','Soleme','museum','musée','directeur','oeuf','œuf','relearn','réapprendre','town14','town13'],
 'progression_flow':['playerQuestGateMessage','v107kRouteGate','checkPortal','route_littoral','Route du littoral','Route Sylvestre','town12','town13','town14','route_simdor','Cimes d’Or','pendingRoadTrainers'],
 'dex_shop_flow':['Rappel','SuperRappel','Super Rappel','ElixirVital','Élixir vital','shopStock','openShop','dexTotal','caughtCount','seenCount','169','CREATURES.length','Object.keys(BY)','161'],
 'bike_heal_flow':['healingSeq','joueurBloque','15000','startHealingSequence','state.bike','bikeActive','bikeDir','velo','vélo','drawPlayer','drawHero'],
 'keys_bus_flow':['keydown','Enter','KeyE','e.key','nearBusStop','openBusMenuV106Y','ValdoraBusV118Bridge','v107dBusStop']
}

def line_number(txt,pos): return txt.count('\n',0,pos)+1

def brace_block(txt,start):
    brace=txt.find('{',start)
    if brace<0:return None
    depth=0; quote=None; esc=False; line_comment=False; block_comment=False; i=brace
    while i<len(txt):
        c=txt[i]; n=txt[i+1] if i+1<len(txt) else ''
        if line_comment:
            if c=='\n': line_comment=False
            i+=1; continue
        if block_comment:
            if c=='*' and n=='/': block_comment=False; i+=2; continue
            i+=1; continue
        if quote:
            if esc: esc=False
            elif c=='\\': esc=True
            elif c==quote: quote=None
            i+=1; continue
        if c=='/' and n=='/': line_comment=True; i+=2; continue
        if c=='/' and n=='*': block_comment=True; i+=2; continue
        if c in "'\"`": quote=c; i+=1; continue
        if c=='{': depth+=1
        elif c=='}':
            depth-=1
            if depth==0:return txt[start:i+1]
        i+=1
    return None

def extract_function(name):
    out=[f'V122 FUNCTION: {name}','='*90]
    for p in FILES:
        txt=p.read_text(encoding='utf-8',errors='ignore')
        pats=[rf'\bfunction\s+{re.escape(name)}\s*\(',rf'\b(?:window\.)?{re.escape(name)}\s*=\s*function\s*\(',rf'\b(?:window\.)?{re.escape(name)}\s*=\s*\([^\n]*?\)\s*=>\s*{{']
        for pat in pats:
            for m in re.finditer(pat,txt):
                block=brace_block(txt,m.start())
                if block: out.append(f'\n## {p.as_posix()} line {line_number(txt,m.start())}\n{block[:24000]}')
    return '\n'.join(out)

def contexts(terms,max_per_file=24,ctx_before=8,ctx_after=16):
    out=[]
    for p in FILES:
        txt=p.read_text(encoding='utf-8',errors='ignore'); ls=txt.splitlines(); seen=[]; local=[]
        for i,line in enumerate(ls):
            matches=[t for t in terms if t.lower() in line.lower()]
            if not matches or any(abs(i-j)<20 for j in seen): continue
            seen.append(i); a=max(0,i-ctx_before); b=min(len(ls),i+ctx_after)
            local.append(f'\n### line {i+1}: {", ".join(matches)}\n'+'\n'.join(f'{j+1}: {ls[j]}' for j in range(a,b)))
            if len(local)>=max_per_file: break
        if local: out.append(f'\n## {p.as_posix()}'+''.join(local))
    return ''.join(out)

for name in FUNCTIONS:
    (ROOT/f'_AI_V122_func_{name}.txt').write_text(extract_function(name),encoding='utf-8')
for group,terms in GROUPS.items():
    (ROOT/f'_AI_V122_{group}.txt').write_text(f'V122 GROUP: {group}\n'+('='*90)+contexts(terms),encoding='utf-8')
print('wrote',len(FUNCTIONS),'function files and',len(GROUPS),'group files')
