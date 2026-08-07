/* ============================================================
   ui-controls.js
   - หน้าจอ/appState
   - Mouse input (Hero P1)
   - Keyboard: Space pause, WASD (Boss P2), J/K/L/;/' (Boss skills), dev keys
   - ปุ่มเมนูทุกโหมด
============================================================ */

const SCREENS = ['menu', 'howto', 'howto-boss', 'howto-pvp', 'pause', 'gameover', 'victory'];
let appState = 'menu'; // menu | howto | playing | paused | gameover | victory | intro | dying

function showScreen(id) {
  SCREENS.forEach(s => {
    const el = document.getElementById('screen-' + s);
    if (el) el.classList.toggle('active', s === id);
  });
  // ซ่อน HUD ทุกตัว
  ['hud', 'hud-bossai', 'hud-pvp'].forEach(h => {
    const el = document.getElementById(h);
    if (el) el.classList.remove('active');
  });
}

function showHud() {
  SCREENS.forEach(s => {
    const el = document.getElementById('screen-' + s);
    if (el) el.classList.remove('active');
  });
  document.getElementById('hud').classList.add('active');
  document.getElementById('hud-bossai').classList.remove('active');
  document.getElementById('hud-pvp').classList.remove('active');
}

/* ============================================================
   MOUSE / TOUCH INPUT (Hero P1)
============================================================ */
const mouse = { x: innerWidth / 2, y: innerHeight * 0.7 };

canvas.addEventListener('mousemove', e => {
  mouse.x = e.clientX;
  mouse.y = e.clientY;
});
canvas.addEventListener('touchmove', e => {
  if (e.touches[0]) {
    mouse.x = e.touches[0].clientX;
    mouse.y = e.touches[0].clientY - touchOffsetY;
  }
  e.preventDefault();
}, { passive: false });

// คลิกซ้าย = Parry / Skill (Hero P1) — ทุกโหมดที่ Player ควบคุม hero
window.addEventListener('mousedown', e => {
  if (appState !== 'playing') return;
  if (isModeClassic() || isModePvp()) {
    if (e.button === 0) tryActivateSkill();       // ซ้าย = skill/parry
    if (e.button === 2) tryActivateSkillAlt();     // ขวา = skill สลับ (future-proof)
  }
});
window.addEventListener('contextmenu', e => e.preventDefault()); // กัน right-click menu

window.addEventListener('touchstart', e => {
  if (appState === 'playing' && (isModeClassic() || isModePvp())) tryActivateSkill();
});

/* ============================================================
   KEYBOARD
============================================================ */

// WASD state tracking สำหรับ bossPlayer
const _wasdMap = { KeyW: 'w', KeyA: 'a', KeyS: 's', KeyD: 'd' };
// skill key mapping → slot index
const _bossSkillMap = {
  KeyJ: 0, KeyK: 1, KeyL: 2,
  Semicolon: 3, Quote: 4
};

window.addEventListener('keydown', e => {
  // ===== Global =====
  if (e.code === 'Space') {
    e.preventDefault();
    if (appState === 'playing') pauseGame();
    else if (appState === 'paused') resumeGame();
    return;
  }

  // Dev mode toggle
  if (e.code === 'Backquote') {
    devMode = !devMode;
    document.getElementById('dev-hud').classList.toggle('active', devMode);
    return;
  }
  if (devMode && /^Digit[1-9]$/.test(e.code)) {
    devJumpToPhase(Number(e.code.slice(5)) - 1);
    return;
  }

  // ===== Boss Player Controls (bossAI + pvp) =====
  if (isBossControlledByPlayer() && appState === 'playing') {
    // WASD movement
    if (_wasdMap[e.code] !== undefined) {
      bossPlayer.keys[_wasdMap[e.code]] = true;
      e.preventDefault();
      return;
    }

    // Skill keys
    if (_bossSkillMap[e.code] !== undefined) {
      tryBossSkill(_bossSkillMap[e.code]);
      e.preventDefault();
      return;
    }
  }
});

window.addEventListener('keyup', e => {
  if (isBossControlledByPlayer()) {
    if (_wasdMap[e.code] !== undefined) {
      bossPlayer.keys[_wasdMap[e.code]] = false;
    }
  }
});

/* ============================================================
   SKILL HELPERS
============================================================ */
let selectedSkill = 'parry';

function tryActivateSkill() {
  if (player.skillActive || player.skillCooldown > 0) return;
  player.skillActive = true; player.skillTimer = 0;
  if (player.skillType === 'parry') {
    player.parrying = true;
    spawnParticles(player.x, player.y, '#ffe066', 14, [1, 3], [200, 350], [1.5, 3]);
  } else {
    spawnParticles(player.x, player.y, '#6fd8ff', 18, [1, 3.5], [300, 500], [1.5, 3]);
  }
}

function tryActivateSkillAlt() {
  // คลิกขวา: ใช้สกิลรอง (เตรียมสำหรับอนาคต — ตอนนี้ไม่ทำอะไร)
}

/* ============================================================
   PAUSE / RESUME
============================================================ */
function pauseGame()  {
  appState = 'paused';
  // บันทึก WASD state ไว้ก่อน pause (กันปุ่มค้าง)
  bossPlayer.keys.w = bossPlayer.keys.a = bossPlayer.keys.s = bossPlayer.keys.d = false;
  showScreen('pause');
}
function resumeGame() {
  appState = 'playing';
  if (isModeClassic()) showHud();
  else if (isModeBossAI()) showHudBossAI();
  else if (isModePvp()) showHudPvp();
}

/* ============================================================
   SKILL SELECT (เมนู classic)
============================================================ */
document.querySelectorAll('.skill-option').forEach(btn => {
  btn.addEventListener('click', () => {
    if (btn.disabled || btn.classList.contains('disabled')) return;
    document.querySelectorAll('.skill-option').forEach(b => b.classList.remove('selected'));
    btn.classList.add('selected');
    selectedSkill = btn.dataset.skill;
  });
});

/* ============================================================
   BUTTON WIRING
============================================================ */
document.getElementById('pause-btn')?.addEventListener('click', () => {
  if (appState === 'playing') pauseGame();
});

// Menu → Classic
document.getElementById('btn-start')?.addEventListener('click', () => startGame());

// Menu → Boss vs AI
document.getElementById('btn-boss-ai')?.addEventListener('click', () => startBossAIMode());

// Menu → PvP
document.getElementById('btn-pvp')?.addEventListener('click', () => startPvpMode());

// How To Play
document.getElementById('btn-howto')?.addEventListener('click',         () => { appState = 'howto'; showScreen('howto'); });
document.getElementById('btn-howto-back')?.addEventListener('click',    () => { appState = 'menu'; showScreen('menu'); });
document.getElementById('btn-howto-boss')?.addEventListener('click',    () => showScreen('howto-boss'));
document.getElementById('btn-howto-boss-back')?.addEventListener('click',() => showScreen('howto'));
document.getElementById('btn-howto-pvp')?.addEventListener('click',     () => showScreen('howto-pvp'));
document.getElementById('btn-howto-pvp-back')?.addEventListener('click',() => showScreen('howto'));

// Pause
document.getElementById('btn-resume')?.addEventListener('click',      () => resumeGame());
document.getElementById('btn-pause-menu')?.addEventListener('click',  () => { appState = 'menu'; showScreen('menu'); });

// Game Over / Victory (retry ตาม mode)
document.getElementById('btn-retry')?.addEventListener('click', () => {
  if (isModeClassic()) startGame();
  else if (isModeBossAI()) startBossAIMode();
  else startPvpMode();
});
document.getElementById('btn-gameover-menu')?.addEventListener('click',  () => { appState = 'menu'; showScreen('menu'); });
document.getElementById('btn-victory-again')?.addEventListener('click', () => {
  if (isModeClassic()) startGame();
  else if (isModeBossAI()) startBossAIMode();
  else startPvpMode();
});
document.getElementById('btn-victory-menu')?.addEventListener('click', () => { appState = 'menu'; showScreen('menu'); });
