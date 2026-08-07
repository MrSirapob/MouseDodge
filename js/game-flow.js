/* ============================================================
   game-flow.js
   ลำดับตาย, startGame() (classic), startBossAIMode(), startPvpMode(),
   triggerModeVictory(), triggerGameOver()
============================================================ */

/* ---- Classic: ผู้เล่นตาย ---- */
function startPlayerDeath() {
  appState = 'dying';
  deathTimer = 0; deathFade = 0;
  shake(18, 700);
  spawnParticles(player.x, player.y, '#6fd8ff', 40, [2, 6], [500, 900], [2, 5]);
  flashRed();
}

/* ---- Classic: Game Over ---- */
function triggerGameOver() {
  furthestPhase = Math.max(furthestPhase, boss.phaseIndex + 1);
  const quote = GAMEOVER_QUOTES[Math.floor(Math.random() * GAMEOVER_QUOTES.length)];
  document.getElementById('gameover-quote').textContent = quote;
  document.getElementById('gameover-sub').textContent   = 'ไปได้ถึงเฟส ' + furthestPhase;

  let deathCount = parseInt(localStorage.getItem('mouseDodge_deathCount') || '0', 10);
  deathCount++;
  localStorage.setItem('mouseDodge_deathCount', deathCount);
  const el = document.getElementById('gameover-death-count');
  if (el) el.textContent = `จำนวนครั้งที่ตายสะสม: ${deathCount} ครั้ง`;

  appState = 'gameover';
  showScreen('gameover');
}

/* ============================================================
   MODE-AWARE VICTORY / DEFEAT
   triggerModeVictory(winner)
     winner = 'hero' | 'boss'
   เรียกโดย:
     - hitAiHero()  → 'boss'  (bossAI mode)
     - bossAITimer หมด → 'hero' (bossAI mode)
     - hitBossPlayer() → 'hero' (pvp mode)
     - hitPlayer() → lives<=0 → classic death OR pvp 'boss'
============================================================ */
function triggerModeVictory(winner) {
  if (appState !== 'playing' && appState !== 'intro') return;

  if (winner === 'hero') {
    // Hero (หรือผู้เล่น P1) ชนะ
    appState = 'victory';
    let msg = '';
    if (isModeBossAI()) msg = 'บอสล้มเหลว — Hero AI รอดมาได้ครบเวลา!';
    else if (isModePvp()) msg = 'Hero ชนะ! — Boss หมด HP';
    _showModeResult('ชัยชนะ', msg, 'victory');
  } else {
    // Boss ชนะ
    appState = 'gameover';
    let msg = '';
    if (isModeBossAI()) msg = 'คุณฆ่า Hero AI ได้ภายในเวลา!';
    else if (isModePvp()) msg = 'Boss ชนะ! — Hero หมดชีวิต';
    _showModeResult('บอสชนะ', msg, 'gameover');
  }
}

function _showModeResult(title, sub, screenId) {
  if (screenId === 'victory') {
    showScreen('victory');
    document.querySelector('#screen-victory .result-sub').textContent = sub;
  } else {
    document.getElementById('gameover-quote').textContent = title;
    document.getElementById('gameover-sub').textContent   = sub;
    document.getElementById('gameover-death-count').textContent = '';
    showScreen('gameover');
  }
}

/* ============================================================
   RESET ทั่วไป (ใช้ร่วมกันทุกโหมด)
============================================================ */
function _resetCommon() {
  bullets  = [];
  lasers   = [];
  particles = [];
  trail    = [];
  slashes  = [];
  deathTimer = 0;
  deathFade  = 0;
  victoryPending = false;
}

function _resetHeroPlayer() {
  player.lives = 3;
  player.invuln = false; player.invulnTimer = 0;
  player.skillType = selectedSkill;
  player.skillActive = false; player.parrying = false;
  player.skillCooldown = 0;  player.skillTimer = 0;
  player.x = arena.left + (arena.right - arena.left) / 2;
  player.y = arena.bottom - 90;
  // skill-label มีแค่ใน classic HUD, pvp ใช้ skill-label-pvp แทน
  const skillLabel = document.getElementById(
    isModeClassic() ? 'skill-label' : 'skill-label-pvp'
  );
  if (skillLabel) skillLabel.textContent =
    player.skillType === 'parry' ? 'PARRY' : 'SLOW MOTION';
}

function _resetAiHero() {
  aiHero.lives = 3;
  aiHero.invuln = false; aiHero.invulnTimer = 0;
  aiHero.skillActive = false; aiHero.parrying = false;
  aiHero.skillCooldown = 0;  aiHero.skillTimer = 0;
  aiHero.x = arena.left + (arena.right - arena.left) / 2;
  aiHero.y = arena.bottom - 90;
  aiHero.targetX = aiHero.x;
  aiHero.targetY = aiHero.y;
  aiHero.panicMode = false;
  aiHero.reactTimer = 0;
}

function _resetBossPlayer() {
  bossPlayer.x = W / 2;
  bossPlayer.y = H * 0.25;
  bossPlayer.vx = 0; bossPlayer.vy = 0;
  bossPlayer.hp = 5; bossPlayer.energy = BOSS_PLAYER_ENERGY_MAX;
  bossPlayer.gcd = 0;
  bossPlayer.invuln = false; bossPlayer.invulnTimer = 0;
  bossPlayer.eyeColor = '#ff6b6b';
  bossPlayer.keys.w = bossPlayer.keys.a = bossPlayer.keys.s = bossPlayer.keys.d = false;
  for (const sk of bossSkills) sk.cdTimer = 0;
}

/* ============================================================
   START GAME FUNCTIONS
============================================================ */

/* ---- Classic (เดิม) ---- */
function startGame() {
  gameMode = GAME_MODE.CLASSIC;
  buildPhases();
  _resetCommon();
  _resetHeroPlayer();
  furthestPhase = 1;
  appState = 'intro';
  boss.phaseIndex = 0; boss.cycle = 0; boss.beatIndex = 0;
  boss.homeX = W / 2; boss.homeY = BOSS_TOP_Y;
  boss.x = boss.homeX; boss.baseY = boss.homeY; boss.y = boss.homeY;
  boss.dashTargetX = null; boss.dashTargetY = null; boss.dashProgress = 1;
  boss.state = 'INTRO'; boss.timer = 0; boss.introDone = false;
  buildLifeUI('lives', player.lives);
  showHud();
}

/* ---- Boss vs AI ---- */
function startBossAIMode() {
  gameMode = GAME_MODE.BOSS_AI;
  _resetCommon();
  _resetAiHero();
  _resetBossPlayer();
  bossAITimer = BOSS_AI_TIME_LIMIT;
  appState = 'playing';
  buildLifeUI('ai-lives', aiHero.lives); // แสดง HP Hero AI ด้านบน
  showHudBossAI();
  showPhaseTitle('Boss vs AI — ฆ่าให้ได้ใน 90 วินาที!');
}

/* ---- 2-Player PvP ---- */
function startPvpMode() {
  gameMode = GAME_MODE.PVP;
  _resetCommon();
  _resetHeroPlayer();
  _resetBossPlayer();
  appState = 'playing';
  buildLifeUI('lives-pvp', player.lives);
  buildBossHPUI();
  showHudPvp();
  showPhaseTitle('2 ผู้เล่น — Hero P1 vs Boss P2');
}
