/* ============================================================
   hud.js
   อัปเดต HUD: หัวใจ, หลอดเลือดบอส, หลอดสกิล, dev overlay
============================================================ */

function buildLifeUI() {
  const el = document.getElementById('lives');
  el.innerHTML = '';

  for (let i = 0; i < 3; i++) {
    const d = document.createElement('div');
    d.className = 'life';
    d.innerHTML = '❤️';
    el.appendChild(d);
  }
}

function updateHud() {
  const lives = document.querySelectorAll('#lives .life');
  lives.forEach((el, i) => el.classList.toggle('lost', i >= player.lives));

  const hp = document.getElementById("boss-bar-fill");

  const bp = bossProgress();

  const total =
    1 - ((bp.phaseIndex + bp.phaseFrac) / PHASES.length);

  hp.style.width = (total * 100) + "%";

  // ===== Skill HUD =====
  const cdFrac = player.skillActive
    ? 1
    : (1 - player.skillCooldown / SKILL_COOLDOWN);

  const fill = document.getElementById("skill-fill");
  const text = document.getElementById("skill-text");

  fill.style.width = (cdFrac * 100) + "%";

  if (player.skillCooldown <= 0) {
    fill.style.background = "#4cff88";
    text.textContent = "READY";
  } else {

    if (cdFrac < 0.3) {
      fill.style.background = "#ff5c5c";      // แดง
    } else if (cdFrac < 0.7) {
      fill.style.background = "#ffcf40";      // เหลือง
    } else {
      fill.style.background = "#4cff88";      // เขียว
    }

    text.textContent = (player.skillCooldown / 1000).toFixed(1) + "s";
  }

  document.getElementById('slowmo-veil').style.opacity =
    (player.skillActive && player.skillType === 'slowmo') ? '1' : '0';

  updateDevHud();
}

function updateDevHud() {
  if (!devMode) return;
  const el = document.getElementById('dev-hud');
  el.textContent =
    'DEV MODE (กด ` ปิด)\n' +
    'godmode: ON\n' +
    'phase: ' + (boss.phaseIndex + 1) + ' / ' + PHASES.length + '\n' +
    'cycle: ' + boss.cycle + ' / ' + (PHASES[boss.phaseIndex] ? PHASES[boss.phaseIndex].cycles : '-') + '\n' +
    'beat: ' + boss.beatIndex + '  state: ' + boss.state + '\n' +
    'lives: ' + player.lives + '\n' +
    '[1-5] กระโดดไปเฟสนั้นทันที';
}
