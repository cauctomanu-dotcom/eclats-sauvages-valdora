from pathlib import Path
import re
ROOT=Path('.')
GAME=ROOT/'game'
FILES=[p for p in GAME.rglob('*') if p.is_file() and p.suffix.lower() in {'.js','.html','.json'}]
TOPICS={
 'bus':['BUS_LINES_V106Y','function busStop','openBus','ValdoraBusV118Bridge','drawBus','lineStopsV108R','route_simdor','Cimes d’Or','Simdor'],
 'progression':['playerQuestGateMessage','v107kRouteGate','checkPortal','route_littoral','Littoral','town6','town8','town12','town13','town14','route_m1','route_m2','route_horizons','route_legends','Route Sylvestre'],
 'combat':['grantEnemyXP','startTrainer413','completeTaronMission','enemyTeam','trainerTeam','nextEnemy','battle.enemy','battle.trainer','v109wEnemyParticipants','Team Taron'],
 'guardians':['V106U_GUARDS','guardian','Gardien','rematch','revanche','circuit','sealReward','Sceau','moveReward','attackReward','legend'],
 'quests':['museum','musee','musée','directeur','oeuf','œuf','relearn','réapprendre','Solème','Soleme','contre-espionnage','Dossier Team Taron','Aventure+','seven','7 sceaux','7 Sceaux'],
 'codex_items_bike':['CREATURES','Ecladex','Écladex','codex','Rappel','Elixir','Élixir','shop','boutique','drawPlayer','drawHero','state.bike','bike','15000','sleepAt','heal']
}

def snippets(path,terms,max_matches=55,ctx=4):
    txt=path.read_text(encoding='utf-8',errors='ignore')
    ls=txt.splitlines(); hits=[]; seen=[]
    for i,line in enumerate(ls):
        matched=[t for t in terms if t.lower() in line.lower()]
        if not matched: continue
        if any(abs(i-j)<ctx*2+1 for j in seen): continue
        seen.append(i)
        a=max(0,i-ctx); b=min(len(ls),i+ctx+1)
        hits.append((i+1,matched,'\n'.join(f'{j+1}: {ls[j]}' for j in range(a,b))))
        if len(hits)>=max_matches: break
    return hits

for topic,terms in TOPICS.items():
    out=[f'V122 FOCUS: {topic.upper()}','='*100]
    for p in FILES:
        h=snippets(p,terms)
        if not h: continue
        out.append(f'\n## {p.as_posix()}')
        for ln,matched,block in h:
            out.append(f'\n-- match line {ln}: {", ".join(matched)} --\n{block}')
    (ROOT/f'_AI_V122_{topic}.txt').write_text('\n'.join(out),encoding='utf-8')
    print(topic, len(out))

# Deeper V122 extraction: full function bodies and broad context around critical systems.
FUNCTIONS=[
 'startTrainer413','grantEnemyXP','finishBattle','endBattle','battleVictory','battleWin','enemyFainted','nextEnemy',
 'startHealingSequence','openShop','arenaChallenge','questInteractionV106C','v107bAubeNPCInteraction','v109kTalkToOutdoorNPC',
 'playerQuestGateMessage','v107kRouteGate','checkPortal','nearBusStop','openBusMenuV106Y','boardBusV106Y',
 'openCodex','openDex','openEcladex','drawPlayer','drawHero','movePlayer','tryMove','interact','nearDoorV114'
]
CONTEXT_TERMS=[
 'trainerTeam','enemyTeam','battle.participants','trainerQueue','partyIndex','teamIndex','next trainer','next enemy',
 'V106U_GUARDS','sealMap','arenaChallenge','sealReward','guardianReward','moveReward','attackReward','rematch',
 'Rappel','SuperRappel','Super Rappel','ElixirVital','Élixir vital','shopStock','SHOP',
 'dexTotal','caughtCount','seenCount','169','CREATURES.length','Object.keys(BY)','59','100','127','149','150','161',
 'healingSeq','joueurBloque','15000','state.bike','bikeActive','bikeDir','velo','vélo',
 'Dossier Team Taron','contre-espionnage','Solème','Soleme','museum','musée','oeuf','œuf','relearn','réapprendre',
 'route_littoral','Route du littoral','Route Sylvestre','town12','town13','town14','route_simdor','Cimes d’Or',
 'keydown','Enter','KeyE','e.key'
]

def line_number(txt,pos):
    return txt.count('\n',0,pos)+1

def brace_block(txt,start):
    brace=txt.find('{',start)
    if brace<0:return None
    depth=0; quote=None; esc=False; line_comment=False; block_comment=False
    i=brace
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

out=['V122 DEEP FUNCTION EXTRACTION','='*100]
for p in FILES:
    txt=p.read_text(encoding='utf-8',errors='ignore')
    found=False
    for name in FUNCTIONS:
        # declarations or assignments to a function / arrow with a braced body
        pats=[rf'\bfunction\s+{re.escape(name)}\s*\(',rf'\b(?:window\.)?{re.escape(name)}\s*=\s*function\s*\(',rf'\b(?:window\.)?{re.escape(name)}\s*=\s*\([^\n]*?\)\s*=>\s*{{']
        for pat in pats:
            for m in re.finditer(pat,txt):
                block=brace_block(txt,m.start())
                if not block: continue
                if not found: out.append(f'\n## {p.as_posix()}'); found=True
                ln=line_number(txt,m.start())
                out.append(f'\n### FUNCTION {name} @ line {ln}\n{block[:18000]}')
    # broad high-value contexts, de-duplicated
    ls=txt.splitlines(); seen=[]; local=[]
    for i,line in enumerate(ls):
        matches=[t for t in CONTEXT_TERMS if t.lower() in line.lower()]
        if not matches or any(abs(i-j)<18 for j in seen): continue
        seen.append(i); a=max(0,i-10); b=min(len(ls),i+18)
        local.append((i+1,matches,'\n'.join(f'{j+1}: {ls[j]}' for j in range(a,b))))
        if len(local)>=45: break
    if local:
        if not found: out.append(f'\n## {p.as_posix()}')
        for ln,matches,block in local:
            out.append(f'\n### CONTEXT line {ln}: {", ".join(matches)}\n{block}')
(ROOT/'_AI_V122_deep.txt').write_text('\n'.join(out),encoding='utf-8')
print('deep',len(out))
