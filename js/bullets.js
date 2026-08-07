/* ============================================================
   bullets.js
   สร้าง/อัปเดต/วาดกระสุนปกติ (รวม homing)
============================================================ */

function spawnBullet(o) {
  bullets.push({
    x: o.x, y: o.y, vx: o.vx, vy: o.vy, r: o.r || 6,
    color: o.color || '#ff8a6a', glow: o.glow || o.color || '#ff8a6a',
    type: o.type || 'normal',
    turnRate: o.turnRate || 0, speed: o.speed || Math.hypot(o.vx, o.vy),
    life: 0, maxLife: o.maxLife || 6000, grazed: false
  });
}

function updateBullets(dtS) {
  for (let i = bullets.length - 1; i >= 0; i--) {
    const b = bullets[i];
    b.life += dtS;
    if (b.justParried > 0) b.justParried = Math.max(0, b.justParried - dtS);
    if (b.type === 'homing') {
      const desired = angleTo(b.x, b.y, player.x, player.y);
      const cur = Math.atan2(b.vy, b.vx);
      let diff = desired - cur;
      while (diff > Math.PI) diff -= Math.PI * 2;
      while (diff < -Math.PI) diff += Math.PI * 2;
      const maxTurn = b.turnRate * (dtS / 16.6667);
      const na = cur + clamp(diff, -maxTurn, maxTurn);
      b.vx = Math.cos(na) * b.speed; b.vy = Math.sin(na) * b.speed;
    }
    b.x += b.vx * (dtS / 16.6667);
    b.y += b.vy * (dtS / 16.6667);

    const outOfBounds = b.x < arena.left - 60 || b.x > arena.right + 60 || b.y < arena.top - 60 || b.y > arena.bottom + 80;
    if (outOfBounds || b.life > b.maxLife) { bullets.splice(i, 1); continue; }

    if (!player.invuln && appState === 'playing') {
      const d = dist(b.x, b.y, player.x, player.y);

      if (player.parrying && !(b.justParried > 0) && d < b.r + PARRY_RADIUS) {
        deflectBullet(b);
        continue;
      }

      if (b.justParried > 0) {
        // ช่วงกันโดนซ้ำหลังปัด ข้ามการเช็คโดนตี/graze ของเฟรมนี้
      } else {
        if (d < b.r + player.hitR) { hitPlayer(); bullets.splice(i, 1); continue; }
        if (!b.grazed && d < b.r + GRAZE_RADIUS) {
          b.grazed = true;
          player.skillCooldown = Math.max(0, player.skillCooldown - GRAZE_REFUND);
          const fx = (b.x + player.x) * 0.5;
          const fy = (b.y + player.y) * 0.5;

          spawnParticles(
            fx,
            fy,
            '#bfe9ff',
            6,
            [0.8, 2.0],
            [180, 300],
            [1.2, 2.8]
          );
        }
      }
    }
  }
}

function drawBullets() {
  for (const b of bullets) {
    ctx.save();
    ctx.shadowBlur = 14; ctx.shadowColor = b.glow;
    ctx.fillStyle = b.color;
    ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2); ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = 'rgba(255,255,255,.55)';
    ctx.beginPath(); ctx.arc(b.x - b.r * 0.28, b.y - b.r * 0.28, b.r * 0.32, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }
}
