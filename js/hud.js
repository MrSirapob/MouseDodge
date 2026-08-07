/* ============================================================
   hud.js
   HUD ทุกโหมด:
     updateHud()        — classic
     updateHudBossAI()  — boss vs AI
     updateHudPvp()     — 2-player
     buildLifeUI()      — สร้างหัวใจ
     buildBossHPUI()    — สร้าง HP บอส (PvP)
============================================================ */

/* ---- Build UI ---- */
function buildLifeUI(elId = 'lives', count = 3) {
  const el = document.getElementById(elId);
  if (!el) return;
  el.innerHTML = '';
  for (let i = 0; i < count; i++) {
    const d = document.createElement('div');
    d.className = 'life';
    d.innerHTML = '❤️';
    el.appendChild(d);
  }
}

function buildBossHPUI() {
  const el = document.getElementById('boss-hp-pips');
  if (!el) return;
  el.innerHTML = '';
  for (let i = 0; i < bossPlayer.maxHp; i++) {
    const d = document.createElement('div');
    d.className = 'life boss-life';
    d.innerHTML = '💀';
    el.appendChild(d);
  }
}

/* ---- Classic HUD ---- */
function updateHud() {
  // Hero lives
  const lives = document.querySelectorAll('#lives .life');
  lives.forEach((el, i) => el.classList.toggle('lost', i >= player.lives));

  // Boss health bar
  const hp   = document.getElementById('boss-bar-fill');
  const bp   = bossProgress();
  const total = 1 - ((bp.phaseIndex + bp.phaseFrac) / PHASES.length);
  hp.style.width = (total * 100) + '%';

  // Skill HUD
  const cdFrac = player.skillActive ? 1 : (1 - player.skillCooldown / SKILL_COOLDOWN);
  const fill   = document.getElementById('skill-fill');
  const text   = document.getElementById('skill-text');
  fill.style.width = (cdFrac * 100) + '%';
  if (player.skillCooldown <= 0) {
    fill.style.background = '#4cff88';
    text.textContent = 'READY';
  } else {
    fill.style.background = cdFrac < 0.3 ? '#ff5c5c' : cdFrac < 0.7 ? '#ffcf40' : '#4cff88';
    text.textContent = (player.skillCooldown / 1000).toFixed(1) + 's';
  }

  document.getElementById('slowmo-veil').style.opacity =
    (player.skillActive && player.skillType === 'slowmo') ? '1' : '0';

  updateDevHud();
}

/* ---- Boss vs AI HUD ---- */
function updateHudBossAI() {
  // Countdown timer
  const timerEl = document.getElementById('bossai-timer');
  if (timerEl) {
    const sec = Math.ceil(bossAITimer / 1000);
    timerEl.textContent = sec + 's';
    timerEl.classList.toggle('urgent', sec <= 10);
    timerEl.style.color = sec <= 10 ? '#ff4d5e' : sec <= 30 ? '#ffb454' : '#4cff88';
  }

  // AI Hero lives
  const aiLives = document.querySelectorAll('#ai-lives .life');
  aiLives.forEach((el, i) => el.classList.toggle('lost', i >= aiHero.lives));

  // Boss Player energy bar
  _updateBossEnergyBar();
  _updateBossSkillHud('bossai');
}

/* ---- PvP HUD ---- */
function updateHudPvp() {
  // P1 Hero lives
  const lives = document.querySelectorAll('#lives-pvp .life');
  lives.forEach((el, i) => el.classList.toggle('lost', i >= player.lives));

  // Hero Skill (P1)
  const cdFrac = player.skillActive ? 1 : (1 - player.skillCooldown / SKILL_COOLDOWN);
  const fill   = document.getElementById('skill-fill-pvp');
  const text   = document.getElementById('skill-text-pvp');
  if (fill) fill.style.width = (cdFrac * 100) + '%';
  if (text) text.textContent = player.skillCooldown <= 0 ? 'READY' : (player.skillCooldown / 1000).toFixed(1) + 's';

  // P2 Boss HP pips
  const bossHpPips = document.querySelectorAll('#boss-hp-pips .boss-life');
  bossHpPips.forEach((el, i) => el.classList.toggle('lost', i >= bossPlayer.hp));

  // Boss energy
  _updateBossEnergyBarPvp();
  _updateBossSkillHud('pvp');
}

/* ---- Boss Energy + Skill HUD helpers ---- */
function _updateBossEnergyBar() {
  // bossAI mode
  const bar = document.getElementById('boss-energy-fill');
  if (!bar) return;
  const pct = bossPlayer.energy / BOSS_PLAYER_ENERGY_MAX * 100;
  bar.style.width = pct + '%';
  bar.style.background = pct < 25 ? '#ff4d5e' : pct < 60 ? '#ffb454' : '#c39dff';
}

function _updateBossEnergyBarPvp() {
  // pvp mode
  const bar = document.getElementById('boss-energy-fill-pvp');
  if (!bar) return;
  const pct = bossPlayer.energy / BOSS_PLAYER_ENERGY_MAX * 100;
  bar.style.width = pct + '%';
  bar.style.background = pct < 25 ? '#ff4d5e' : pct < 60 ? '#ffb454' : '#c39dff';
}

// suffix = 'bossai' | 'pvp'
function _updateBossSkillHud(suffix) {
  const gcdActive = bossPlayer.gcd > 0;
  bossSkills.forEach((sk, i) => {
    const slotEl = document.getElementById(`bsk-${i}-boss-skills-${suffix}`);
    if (!slotEl) return;

    const ready = sk.cdTimer <= 0 && bossPlayer.energy >= sk.energyCost && !gcdActive;
    const onCD  = sk.cdTimer > 0;

    slotEl.classList.toggle('bs-ready',     ready);
    slotEl.classList.toggle('bs-cooldown',  onCD);
    slotEl.classList.toggle('bs-no-energy', !onCD && bossPlayer.energy < sk.energyCost);
    slotEl.classList.toggle('bs-gcd',       gcdActive && !onCD);

    const cdText = slotEl.querySelector('.bs-cd-text');
    if (cdText) cdText.textContent = onCD ? (sk.cdTimer / 1000).toFixed(1) + 's' : '';

    const cdBar = slotEl.querySelector('.bs-cd-bar');
    if (cdBar) {
      cdBar.style.width = ((onCD ? 1 - sk.cdTimer / sk.cd : 1) * 100) + '%';
    }
  });
}

/* ---- Dev HUD ---- */
function updateDevHud() {
  if (!devMode) return;
  const el = document.getElementById('dev-hud');
  el.textContent =
    'DEV MODE (กด ` ปิด)\n' +
    'mode: ' + gameMode + '\n' +
    'godmode: ON\n' +
    'phase: ' + (boss.phaseIndex + 1) + ' / ' + PHASES.length + '\n' +
    'cycle: ' + boss.cycle + ' / ' + (PHASES[boss.phaseIndex] ? PHASES[boss.phaseIndex].cycles : '-') + '\n' +
    'beat: ' + boss.beatIndex + '  state: ' + boss.state + '\n' +
    'lives: ' + player.lives + '\n' +
    '[1-5] กระโดดไปเฟสนั้นทันที';
}

/* ---- showHud variants ---- */
function showHudBossAI() {
  SCREENS.forEach(s => {
    const el = document.getElementById('screen-' + s);
    if (el) el.classList.remove('active');
  });
  document.getElementById('hud').classList.remove('active');
  document.getElementById('hud-pvp').classList.remove('active');
  document.getElementById('hud-bossai').classList.add('active');
}
function showHudPvp() {
  SCREENS.forEach(s => {
    const el = document.getElementById('screen-' + s);
    if (el) el.classList.remove('active');
  });
  document.getElementById('hud').classList.remove('active');
  document.getElementById('hud-bossai').classList.remove('active');
  document.getElementById('hud-pvp').classList.add('active');
}
