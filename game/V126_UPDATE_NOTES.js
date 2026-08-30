// Fiche de nouveautés publique — Valdora V1.0.1
(function(){
'use strict';

const VERSION='V126-UPDATE-NOTES-1';
const RELEASE_KEY='valdora_last_seen_update';
const CURRENT_ID='v1.0.1-release-1';
const LEGACY_ID='v118-mobile-5';
const RELEASE={
  id:CURRENT_ID,
  title:'Mise à jour V1.0.1 — La première Résonance',
  intro:'Cette mise à jour renforce le début de l’aventure, améliore la vie du monde et corrige plusieurs systèmes importants.',
  notes:[
    'Nouveau Chapitre I « La première Résonance » : Orée devient un personnage récurrent lié au Professeur Aurine, aux anomalies et à la Team Taron.',
    'Nouvelle enquête à Clairval : témoignages de Maëlle et Rémi, module de relevé, piste sur la Route 1 et première découverte du Projet Résonance.',
    'Nouvel événement de Résonance sur la Route 1 avec un éclaireur mystérieux et une conclusion du chapitre à Rochebrune.',
    'Clairval évolue après ton départ : certains habitants changent de dialogue selon l’enquête et ta progression dans les Sceaux.',
    'Récompenses de fin du Chapitre I : 3 Potions, 2 Super Orbes et un bonus supplémentaire si ton Codex est déjà bien avancé.',
    'Les anciennes sauvegardes sont protégées : une partie déjà avancée n’est pas renvoyée artificiellement au nouveau prologue.',
    'Les coffres ont retrouvé une interaction fiable, leur état ouvert est sauvegardé et leur affichage privilégie désormais le rendu officiel du jeu.',
    'Les PNJ itinérants effectuent désormais de vrais allers-retours visibles au lieu de disparaître pour revenir à leur point de départ.',
    'Les PNJ des villes sont recalés sur les chemins et évitent les bâtiments, arbres et zones incohérentes.',
    'La maison du héros ne génère plus d’habitants aléatoires : seuls les personnages prévus, comme sa mère lorsqu’elle existe, peuvent y rester.',
    'Le déplacement tactile a été revu : sur smartphone, il suffit maintenant de glisser le doigt dans la zone de déplacement, sans joystick à manipuler.',
    'Le mode Créateur utilise les mêmes correctifs de gameplay que le mode Joueur et permet de rejouer le Chapitre I pour le tester rapidement.'
  ]
};

function previousSeen(){
  if(typeof window.__valdoraUpdatePreviousSeenV126==='string')return window.__valdoraUpdatePreviousSeenV126;
  try{return localStorage.getItem(RELEASE_KEY)||''}catch(_){try{return sessionStorage.getItem(RELEASE_KEY)||''}catch(__){return ''}}
}
function setSeen(value){
  try{localStorage.setItem(RELEASE_KEY,value)}catch(_){try{sessionStorage.setItem(RELEASE_KEY,value)}catch(__){}}
}
function wasCurrentSeen(){return previousSeen()===CURRENT_ID}
function ensureDialog(){
  let dialog=document.getElementById('valdoraUpdateDialog');
  if(dialog)return dialog;
  dialog=document.createElement('div');
  dialog.id='valdoraUpdateDialog';
  dialog.hidden=true;
  dialog.setAttribute('role','dialog');
  dialog.setAttribute('aria-modal','true');
  dialog.setAttribute('aria-labelledby','valdoraUpdateTitle');
  dialog.innerHTML='<div class="valdoraUpdateCard"><span class="valdoraUpdateKicker">NOUVEAUTÉS</span><h2 id="valdoraUpdateTitle"></h2><p id="valdoraUpdateIntro"></p><ul class="valdoraUpdateList"></ul><button type="button" class="valdoraUpdateClose">Fermer et jouer</button></div>';
  document.body.appendChild(dialog);
  return dialog
}
function fillDialog(dialog){
  const title=dialog.querySelector('#valdoraUpdateTitle');if(title)title.textContent=RELEASE.title;
  const intro=dialog.querySelector('#valdoraUpdateIntro');if(intro)intro.textContent=RELEASE.intro;
  const list=dialog.querySelector('.valdoraUpdateList');
  if(list){list.replaceChildren(...RELEASE.notes.map(note=>{const li=document.createElement('li');li.textContent=note;return li}))}
}
function close(){
  const dialog=document.getElementById('valdoraUpdateDialog');if(dialog)dialog.hidden=true;
  setSeen(CURRENT_ID)
}
function open(force=false){
  if(!force&&wasCurrentSeen()){setSeen(CURRENT_ID);return false}
  const dialog=ensureDialog();fillDialog(dialog);dialog.hidden=false;
  const oldBtn=dialog.querySelector('.valdoraUpdateClose');
  if(oldBtn){const btn=oldBtn.cloneNode(true);oldBtn.replaceWith(btn);btn.addEventListener('click',close);setTimeout(()=>btn.focus(),0)}
  try{window.ValdoraMobileUIV118?.stopJoystick?.()}catch(_){}
  return true
}
function replaceNewsButton(){
  const old=document.getElementById('valdoraWhatsNewBtn');if(!old)return false;
  if(old.dataset.v126Notes==='1')return true;
  const btn=old.cloneNode(true);btn.dataset.v126Notes='1';btn.textContent='NOUVEAUTÉS';btn.title='Relire les nouveautés de cette mise à jour';old.replaceWith(btn);btn.addEventListener('click',()=>open(true));return true
}
function syncMobileApi(){
  const api=window.ValdoraMobileUIV118;if(!api)return;
  try{api.release=RELEASE;api.openUpdateDialog=open;api.closeUpdateDialog=close}catch(_){}
}
function install(){
  syncMobileApi();replaceNewsButton();
  if(wasCurrentSeen())setSeen(CURRENT_ID);
  try{window.ValdoraStableV110?.applyPublicBranding?.()}catch(_){}
  document.documentElement.dataset.valdoraUpdateNotes=VERSION
}

const firstSeen=previousSeen();
window.ValdoraUpdateNotesV126={version:VERSION,publicVersion:'V1.0.1',release:RELEASE,open,close,install,previousSeen:firstSeen};
install();
setTimeout(()=>{install();if(firstSeen!==CURRENT_ID)open(false);else setSeen(CURRENT_ID)},140);
[500,1200,2600,5200].forEach(ms=>setTimeout(install,ms));
setInterval(()=>{try{replaceNewsButton();syncMobileApi();window.ValdoraStableV110?.applyPublicBranding?.()}catch(_){}},2500);
console.log('Fiche de nouveautés Valdora V1.0.1 synchronisée.');
})();