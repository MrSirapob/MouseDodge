/* ============================================================
   ui-controls.js
   หน้าจอเมนู/สถานะแอป, การรับ input (เมาส์/คีย์บอร์ด/แตะ), ปุ่มเลือกสกิล, wiring ปุ่มต่างๆ
============================================================ */

const SCREENS = ['menu', 'howto', 'pause', 'gameover', 'victory'];
let appState = 'menu'; // menu | howto | playing | paused | gameover | victory

function showScreen(id) {
  SCREENS.forEach(s => {
    document.getElementById('screen-' + s).classList.toggle('active', s === id);
  });
  document.getElementById('hud').classList.remove('active');
}
function showHud() {
  SCREENS.forEach(s => document.getElementById('screen-' + s).classList.remove('active'));
  document.getElementById('hud').classList.add('active');
}


const mouse = { x: innerWidth / 2, y: innerHeight * 0.7 };
canvas.addEventListener('mousemove', e => { mouse.x = e.clientX; mouse.y = e.clientY; });
canvas.addEventListener('touchmove', e => {
  if (e.touches[0]) { mouse.x = e.touches[0].clientX; mouse.y = e.touches[0].clientY - touchOffsetY; }
  e.preventDefault();
}, { passive: false });

let selectedSkill = 'parry'; // ค่าเริ่มต้น ผู้เล่นเลือกเปลี่ยนเป็น 'slowmo' ได้จากปุ่มในเมนู
let isBossMode = false;

window.addEventListener('mousedown', e => {
  if (e.button !== 0) return;
  if (appState === 'playing') tryActivateSkill();
  else if (appState === 'playing_bossmode') triggerBossSkill(1);
});
window.addEventListener('touchstart', e => {
  if (appState === 'playing') tryActivateSkill();
  else if (appState === 'playing_bossmode') triggerBossSkill(1);
});

window.addEventListener('keydown', e => {
  if (e.code === 'Space') {
    e.preventDefault();
    if (appState === 'playing' || appState === 'playing_bossmode') pauseGame();
    else if (appState === 'paused') resumeGame();
    return;
  }
  if (appState === 'playing_bossmode') {
    if (e.code === 'Digit1') triggerBossSkill(2);
    else if (e.code === 'Digit2') triggerBossSkill(3);
    else if (e.code === 'Digit3') triggerBossSkill(4);
    else if (e.code === 'Digit4') triggerBossSkill(5);
    return;
  }
  if (e.code === 'Backquote') {
    devMode = !devMode;
    document.getElementById('dev-hud').classList.toggle('active', devMode);
    return;
  }
  if (devMode && /^Digit[1-9]$/.test(e.code)) {
    const idx = Number(e.code.slice(5)) - 1;
    devJumpToPhase(idx);
  }
});

document.getElementById('pause-btn').addEventListener('click', () => {
  if (appState === 'playing' || appState === 'playing_bossmode') pauseGame();
});


document.querySelectorAll('.skill-option').forEach(btn => {
  btn.addEventListener('click', () => {
    if (btn.disabled || btn.classList.contains('disabled')) return;
    document.querySelectorAll('.skill-option').forEach(b => b.classList.remove('selected'));
    btn.classList.add('selected');
    selectedSkill = btn.dataset.skill;
  });
});


document.getElementById('btn-start').onclick = () => { isBossMode = false; startGame(); };
document.getElementById('btn-bossmode').onclick = () => { isBossMode = true; startBossMode(); };
document.getElementById('btn-howto').onclick = () => { appState = 'howto'; showScreen('howto'); };
document.getElementById('btn-howto-back').onclick = () => { appState = 'menu'; showScreen('menu'); };
document.getElementById('btn-resume').onclick = () => resumeGame();
document.getElementById('btn-pause-menu').onclick = () => { isBossMode = false; appState = 'menu'; showScreen('menu'); };
document.getElementById('btn-retry').onclick = () => { if (isBossMode) startBossMode(); else startGame(); };
document.getElementById('btn-gameover-menu').onclick = () => { isBossMode = false; appState = 'menu'; showScreen('menu'); };
document.getElementById('btn-victory-again').onclick = () => { if (isBossMode) startBossMode(); else startGame(); };
document.getElementById('btn-victory-menu').onclick = () => { isBossMode = false; appState = 'menu'; showScreen('menu'); };

function pauseGame() { appState = 'paused'; showScreen('pause'); }
function resumeGame() {
  if (isBossMode) {
    appState = 'playing_bossmode';
    showBossModeHud();
  } else {
    appState = 'playing';
    showHud();
  }
}
