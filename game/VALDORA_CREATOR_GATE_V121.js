// Valdora V121 — accès au mode Créateur depuis l'accueil.
(function(){
'use strict';
const HASH='00c4e4e30b58c4f17d24467eabef210d3ebd6cb67f0bb0c348f79c1c8d804931';
const SESSION_KEY='valdoraCreatorAuthV121';
function hex(buf){return Array.from(new Uint8Array(buf)).map(b=>b.toString(16).padStart(2,'0')).join('')}
async function digest(value){
  const data=new TextEncoder().encode(String(value||''));
  if(globalThis.crypto?.subtle)return hex(await crypto.subtle.digest('SHA-256',data));
  // Fallback compact pour exécution locale sans WebCrypto.
  function rr(v,n){return(v>>>n)|(v<<(32-n))}const K=[1116352408,1899447441,3049323471,3921009573,961987163,1508970993,2453635748,2870763221,3624381080,310598401,607225278,1426881987,1925078388,2162078206,2614888103,3248222580,3835390401,4022224774,264347078,604807628,770255983,1249150122,1555081692,1996064986,2554220882,2821834349,2952996808,3210313671,3336571891,3584528711,113926993,338241895,666307205,773529912,1294757372,1396182291,1695183700,1986661051,2177026357,2456956037,2730485921,2820302411,3259730800,3345764771,3516065817,3600352804,4094571909,275423344,430227734,506948616,659060556,883997877,958139571,1322822218,1537002063,1747873779,1955562222,2024104815,2227730452,2361852424,2428436474,2756734187,3204031479,3329325298];
  const bytes=Array.from(data),bit=bytes.length*8;bytes.push(128);while(bytes.length%64!==56)bytes.push(0);for(let i=7;i>=0;i--)bytes.push(Math.floor(bit/2**(i*8))&255);let H=[1779033703,3144134277,1013904242,2773480762,1359893119,2600822924,528734635,1541459225];
  for(let o=0;o<bytes.length;o+=64){const w=new Array(64);for(let i=0;i<16;i++)w[i]=(bytes[o+4*i]<<24)|(bytes[o+4*i+1]<<16)|(bytes[o+4*i+2]<<8)|bytes[o+4*i+3];for(let i=16;i<64;i++){const x=w[i-15],y=w[i-2],s0=rr(x,7)^rr(x,18)^(x>>>3),s1=rr(y,17)^rr(y,19)^(y>>>10);w[i]=(w[i-16]+s0+w[i-7]+s1)|0}let[a,b,c,d,e,f,g,h]=H;for(let i=0;i<64;i++){const S1=rr(e,6)^rr(e,11)^rr(e,25),ch=(e&f)^(~e&g),t1=(h+S1+ch+K[i]+w[i])|0,S0=rr(a,2)^rr(a,13)^rr(a,22),maj=(a&b)^(a&c)^(b&c),t2=(S0+maj)|0;h=g;g=f;f=e;e=(d+t1)|0;d=c;c=b;b=a;a=(t1+t2)|0}H=H.map((v,i)=>(v+[a,b,c,d,e,f,g,h][i])|0)}return H.map(v=>(v>>>0).toString(16).padStart(8,'0')).join('')
}
function style(){if(document.getElementById('v121CreatorStyle'))return;const s=document.createElement('style');s.id='v121CreatorStyle';s.textContent=`#v121CreatorBtn{margin-top:8px!important;padding:9px 15px!important;font-size:12px!important;opacity:.86}#v121CreatorGate{position:fixed;inset:0;z-index:999999;background:rgba(5,13,25,.82);display:flex;align-items:center;justify-content:center;padding:20px}#v121CreatorGate .box{width:min(430px,92vw);background:#102334;border:1px solid rgba(120,239,210,.5);border-radius:18px;padding:24px;box-shadow:0 24px 70px rgba(0,0,0,.5);color:#fff}#v121CreatorGate h2{margin:0 0 8px}#v121CreatorGate p{opacity:.8;line-height:1.45}#v121CreatorGate input{width:100%;box-sizing:border-box;padding:12px 14px;border-radius:10px;border:1px solid #506b7c;background:#081823;color:#fff;font-size:15px}#v121CreatorGate .actions{display:flex;gap:10px;margin-top:14px}#v121CreatorGate button{flex:1;padding:11px;border-radius:10px;border:0;font-weight:800;cursor:pointer}#v121CreatorError{min-height:18px;color:#ff9b9b;margin-top:8px;font-size:13px}`;document.head.appendChild(s)}
function close(){document.getElementById('v121CreatorGate')?.remove()}
function openGate(){
  style();close();const ov=document.createElement('div');ov.id='v121CreatorGate';ov.innerHTML='<div class="box"><h2>Mode créateur</h2><p>Accès réservé. Entre le code créateur pour ouvrir Valdora avec tous les droits de test et de progression.</p><input id="v121CreatorPassword" type="password" autocomplete="current-password" placeholder="Code créateur"><div id="v121CreatorError"></div><div class="actions"><button id="v121CreatorCancel">Annuler</button><button id="v121CreatorOpen">Ouvrir le mode créateur</button></div></div>';document.body.appendChild(ov);const input=ov.querySelector('#v121CreatorPassword'),err=ov.querySelector('#v121CreatorError');input.focus();
  async function submit(){err.textContent='Vérification…';try{if(await digest(input.value)===HASH){sessionStorage.setItem(SESSION_KEY,'1');location.href='./CREATEUR.html';return}err.textContent='Code incorrect.';input.select()}catch(e){err.textContent='Impossible de vérifier le code sur ce navigateur.'}}
  ov.querySelector('#v121CreatorCancel').onclick=close;ov.querySelector('#v121CreatorOpen').onclick=submit;input.addEventListener('keydown',e=>{if(e.key==='Enter')submit();if(e.key==='Escape')close()});ov.addEventListener('click',e=>{if(e.target===ov)close()})
}
function install(){
  if(/CREATEUR\.html/i.test(location.pathname))return;
  style();const card=document.querySelector('.titlecard');if(!card||document.getElementById('v121CreatorBtn'))return;const b=document.createElement('button');b.id='v121CreatorBtn';b.type='button';b.textContent='🛠 Mode créateur';b.title='Ouvrir le mode créateur protégé';b.onclick=openGate;card.appendChild(b);if(location.hash==='#creator-auth')setTimeout(openGate,80)
}
window.ValdoraCreatorGateV121={open:openGate,authenticated:()=>sessionStorage.getItem(SESSION_KEY)==='1'};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install);else install();
})();
