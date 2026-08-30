from pathlib import Path

G=Path('game/VALDORA_CREATOR_GATE_V121.js')
I=Path('game/index.html')
S=Path('game/sw.js')

g=G.read_text(encoding='utf-8')
g=g.replace("const HASH='2071eacbcc461240288799233872f9c15e7714f58be2a9ad413f399986b75eea';","const HASH='00c4e4e30b58c4f17d24467eabef210d3ebd6cb67f0bb0c348f79c1c8d804931';")
g=g.replace('2177026357,2456956037','2177026350,2456956037')
G.write_text(g,encoding='utf-8')

i=I.read_text(encoding='utf-8')
i=i.replace('VALDORA_CREATOR_GATE_V121.js?v=121-creator-1','VALDORA_CREATOR_GATE_V121.js?v=121-creator-2')
I.write_text(i,encoding='utf-8')

s=S.read_text(encoding='utf-8')
s=s.replace("const VERSION = 'v121-pwa-1';","const VERSION = 'v121-pwa-2';")
s=s.replace('VALDORA_CREATOR_GATE_V121.js?v=121-creator-1','VALDORA_CREATOR_GATE_V121.js?v=121-creator-2')
S.write_text(s,encoding='utf-8')

assert "00c4e4e30b58c4f17d24467eabef210d3ebd6cb67f0bb0c348f79c1c8d804931" in g
assert '2177026350,2456956037' in g
assert 'VALDORA-5ZWE-2JWB-EMPM' not in g
assert '121-creator-2' in i and '121-creator-2' in s
assert "v121-pwa-2" in s
print('creator digest/cache fix ready')
