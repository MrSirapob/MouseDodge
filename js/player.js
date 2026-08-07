/* ============================================================
   player.js
   อัปเดตตำแหน่งผู้เล่น, ระบบสกิล (cooldown/duration), โดนตี, วาดผู้เล่น+trail
============================================================ */

const PLAYER_FOLLOW_T = 0.32;
const PLAYER_MAX_LAG = 46; // px ที่ยอมให้ hitbox ตามหลังเมาส์จริงได้มากสุด (กันบัคตอนสบัดเมาส์ไวๆ แล้ว hitbox ค้างอยู่ไกลจากเมาส์)

function updatePlayer(dtReal) {
  const tx = clamp(mouse.x, arena.left + player.r, arena.right - player.r);
  const ty = clamp(mouse.y, arena.top + player.r, arena.bottom - player.r);

  const curX = player.x || tx, curY = player.y || ty;
  const lagDist = dist(curX, curY, tx, ty);
  // ถ้าสบัดเมาส์ไวจนตัวละครตามไม่ทันเกินระยะที่กำหนด ให้เร่งตามให้ทันทันที
  // ป้องกัน hitbox ล้าหลังตำแหน่งเมาส์จริงจนโดนยิง/รอดแบบไม่สมเหตุสมผล
  const followT = lagDist > PLAYER_MAX_LAG
    ? 1 - (PLAYER_MAX_LAG / lagDist) * (1 - PLAYER_FOLLOW_T)
    : PLAYER_FOLLOW_T;

  player.x = lerp(curX, tx, followT);
  player.y = lerp(curY, ty, followT);

  if (appState === "playing") {

    trail.push({
      x: player.x,
      y: player.y,
      life: 0
    });

    if (trail.length > 10) {
      trail.shift();
    }

    trail.forEach(t => {
      t.life += dtReal;
    });

  }

  if (player.invuln) {
    player.invulnTimer += dtReal;
    if (player.invulnTimer > 1100) player.invuln = false;
  }

  if (appState === "playing") {
    if (player.skillActive) {
      player.skillTimer += dtReal;
      const dur = SKILL_DURATIONS[player.skillType] || SLOWMO_DURATION;
      if (player.skillTimer >= dur) {
        player.skillActive = false;
        player.parrying = false;
        player.skillCooldown = SKILL_COOLDOWN;
      }
    } else if (player.skillCooldown > 0) {

      player.skillCooldown = Math.max(
        0,
        player.skillCooldown - dtReal
      );
    }
  }
}

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

function hitPlayer() {
  if (DEV_GODMODE || devMode) return;

  if (player.invuln) return;

  player.lives--;

  // Animation หัวใจที่เสีย
  const hearts = document.querySelectorAll("#lives .life");
  const lostHeart = hearts[player.lives];

  if (lostHeart) {
    lostHeart.classList.add("hit");

    setTimeout(() => {
      lostHeart.classList.remove("hit");
    }, 350);
  }

  // สถานะอมตะชั่วคราว
  player.invuln = true;
  player.invulnTimer = 0;

  // เอฟเฟกต์
  shake(11, 320);
  flashRed();
  spawnParticles(
    player.x,
    player.y,
    '#ff4d5e',
    22,
    [1, 4],
    [350, 600],
    [1.5, 3.5]
  );

  // Game Over
  if (player.lives <= 0) {
    startPlayerDeath();
  }
}

function drawPlayer() {

  // ----- Trail -----
  if (appState !== "dying") {
    for (const t of trail) {
      const a = 1 - t.life / 260;
      if (a <= 0) continue;

      ctx.save();
      ctx.globalAlpha = a * 0.28;

      ctx.fillStyle = "#6fd8ff";
      ctx.beginPath();
      ctx.arc(t.x, t.y, player.r * 0.6, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    }
  }

  // ----- Player -----
  ctx.save();

  if (appState === "dying") {

    // หายไปภายใน 120ms
    ctx.globalAlpha = Math.max(0, 1 - deathTimer / 120);

  } else if (
    player.invuln &&
    Math.floor(player.invulnTimer / 90) % 2 === 0
  ) {

    ctx.globalAlpha = 0.35;
  }

  ctx.shadowBlur = player.skillActive ? 34 : 20;
  ctx.shadowColor = player.parrying ? "#ffe066" : (player.skillActive ? "#bfe9ff" : "#6fd8ff");

  const g = ctx.createRadialGradient(
    player.x - 2,
    player.y - 2,
    1,
    player.x,
    player.y,
    player.r
  );

  g.addColorStop(0, "#ffffff");
  g.addColorStop(0.4, "#bfe9ff");
  g.addColorStop(1, "#3f92c9");

  ctx.fillStyle = g;

  ctx.beginPath();
  ctx.arc(player.x, player.y, player.r, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}
