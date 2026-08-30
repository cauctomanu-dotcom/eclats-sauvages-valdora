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
        # de-dupe overlapping windows
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
