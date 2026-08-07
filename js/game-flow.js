/* ============================================================
   game-flow.js
   ลำดับตาย -> เกมโอเวอร์, และ startGame() (reset ค่าทั้งหมดตอนเริ่ม/เริ่มใหม่)
============================================================ */

function startPlayerDeath() {

  appState = "dying";
  deathTimer = 0;
  deathFade = 0;

  // เอฟเฟกต์
  shake(18, 700);

  spawnParticles(
    player.x,
    player.y,
    "#6fd8ff",
    40,
    [2, 6],
    [500, 900],
    [2, 5]
  );

  flashRed();
}

function triggerGameOver() {
  furthestPhase = Math.max(furthestPhase, boss.phaseIndex + 1);
  const quote =
    GAMEOVER_QUOTES[Math.floor(Math.random() * GAMEOVER_QUOTES.length)];
  document.getElementById("gameover-quote").textContent = quote;
  document.getElementById("gameover-sub").textContent =
    "ไปได้ถึงเฟส " + furthestPhase;
  appState = "gameover";
  showScreen("gameover");
}

function startGame() {
  if (typeof hideBossModeHud !== 'undefined') hideBossModeHud();
  buildPhases();
  bullets = []; lasers = []; particles = []; trail = []; slashes = [];
  player.lives = 3;
  deathTimer = 0;
  deathFade = 0;
  furthestPhase = 1; // รีเซ็ตทุกครั้งที่เริ่มเกมใหม่ ไม่งั้นข้อความ "ไปได้ถึงเฟส" ตอนตายจะค้างค่าจากรอบก่อนหน้า
  appState = "intro";
  player.invuln = false; player.invulnTimer = 0;
  player.skillType = selectedSkill;
  player.skillActive = false; player.parrying = false; player.skillCooldown = 0; player.skillTimer = 0;
  document.getElementById('skill-label').textContent =
    player.skillType === 'parry' ? 'PARRY' : 'SLOW MOTION';
  player.x = arena.left + (arena.right - arena.left) / 2;
  player.y = arena.bottom - 90;
  boss.phaseIndex = 0; boss.cycle = 0; boss.beatIndex = 0;
  boss.homeX = W / 2; boss.homeY = BOSS_TOP_Y;
  boss.x = boss.homeX; boss.baseY = boss.homeY; boss.y = boss.homeY;
  boss.dashTargetX = null; boss.dashTargetY = null; boss.dashProgress = 1;
  victoryPending = false;
  buildLifeUI();
  boss.state = "INTRO";
  boss.timer = 0;
  boss.introDone = false;
  showHud();
}
