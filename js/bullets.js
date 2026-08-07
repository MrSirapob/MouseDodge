/* ============================================================
   bullets.js
   สร้าง/อัปเดต/วาดกระสุนปกติ (รวม homing)
   --- โหมด classic/pvp: collision กับ player
   --- โหมด bossAI:      collision กับ aiHero
============================================================ */

function spawnBullet(o) {
  bullets.push({
    x: o.x, y: o.y, vx: o.vx, vy: o.vy, r: o.r || 6,
    color: o.color || '#ff8a6a', glow: o.glow || o.color || '#ff8a6a',
    type: o.type || 'normal',
    turnRate: o.turnRate || 0, speed: o.speed || Math.hypot(o.vx, o.vy),
    life: 0, maxLife: o.maxLife || 6000, grazed: false,
    justParried: 0
  });
}

function updateBullets(dtS) {
  // เลือก hero target ตามโหมด
  const hero = getActiveHero();

  for (let i = bullets.length - 1; i >= 0; i--) {
    const b = bullets[i];
    b.life += dtS;
    if (b.justParried > 0) b.justParried = Math.max(0, b.justParried - dtS);

    // homing ไล่ hero
    if (b.type === 'homing') {
      const desired = angleTo(b.x, b.y, hero.x, hero.y);
      const cur = Math.atan2(b.vy, b.vx);
      let diff = desired - cur;
      while (diff >  Math.PI) diff -= Math.PI * 2;
      while (diff < -Math.PI) diff += Math.PI * 2;
      const maxTurn = b.turnRate * (dtS / 16.6667);
      const na = cur + clamp(diff, -maxTurn, maxTurn);
      b.vx = Math.cos(na) * b.speed;
      b.vy = Math.sin(na) * b.speed;
    }

    b.x += b.vx * (dtS / 16.6667);
    b.y += b.vy * (dtS / 16.6667);

    // out of bounds / expired
    const outOfBounds =
      b.x < arena.left  - 60 || b.x > arena.right  + 60 ||
      b.y < arena.top   - 60 || b.y > arena.bottom  + 80;
    if (outOfBounds || b.life > b.maxLife) { bullets.splice(i, 1); continue; }

    if (appState !== 'playing') continue;

    // --- collision vs hero ---
    if (!hero.invuln) {
      const d = dist(b.x, b.y, hero.x, hero.y);

      // Parry check
      if (hero.parrying && !(b.justParried > 0) && d < b.r + PARRY_RADIUS) {
        _deflectBulletFrom(b, hero);
        continue;
      }

      if (b.justParried > 0) continue; // immunity window หลัง parry

      // ถูกตี
      if (d < b.r + hero.hitR) {
        _hitHero(hero);
        bullets.splice(i, 1);
        continue;
      }

      // Graze (เฉพาะโหมดที่ hero มี skillCooldown ลด)
      if (!b.grazed && d < b.r + GRAZE_RADIUS) {
        b.grazed = true;
        if (hero.skillCooldown !== undefined) {
          hero.skillCooldown = Math.max(0, hero.skillCooldown - GRAZE_REFUND);
        }
        const fx = (b.x + hero.x) * 0.5;
        const fy = (b.y + hero.y) * 0.5;
        spawnParticles(fx, fy, '#bfe9ff', 6, [0.8, 2.0], [180, 300], [1.2, 2.8]);
      }
    }

    // --- กระสุน deflect ชน bossPlayer ใน pvp mode ---
    if (isModePvp() && b.justParried > 0 && b.type === 'deflected') {
      if (!bossPlayer.invuln) {
        const db = dist(b.x, b.y, bossPlayer.x, bossPlayer.y);
        if (db < b.r + bossPlayer.r * 0.4) {
          hitBossPlayer();
          bullets.splice(i, 1);
        }
      }
    }
  }
}

/* ---- helper: deflect กระสุนจาก hero ที่ระบุ ---- */
function _deflectBulletFrom(b, hero) {
  const rx = b.x - hero.x, ry = b.y - hero.y;
  const rlen = Math.hypot(rx, ry) || 1;
  const nx = rx / rlen, ny = ry / rlen;

  const tx1 = -ny, ty1 =  nx;
  const tx2 =  ny, ty2 = -nx;
  const dot1 = b.vx * tx1 + b.vy * ty1;
  const dot2 = b.vx * tx2 + b.vy * ty2;
  const tx = dot1 >= dot2 ? tx1 : tx2;
  const ty = dot1 >= dot2 ? ty1 : ty2;

  const incomingAngle = Math.atan2(b.vy, b.vx);
  const speed = (Math.hypot(b.vx, b.vy) || b.speed || 3) * PARRY_DEFLECT_SPEED_MULT;
  b.vx = tx * speed;
  b.vy = ty * speed;
  b.speed = speed;

  if (b.type === 'homing') b.type = 'deflected';

  b.justParried = PARRY_IMMUNITY_MS;
  b.grazed = true;
  b.color = '#fff3b0'; b.glow = '#ffe066';

  spawnSlashEffect(b.x, b.y, Math.atan2(ty, tx), incomingAngle);
  spawnParticles(b.x, b.y, '#ffe066', 9, [1.2, 3.2], [160, 300], [1, 2.6]);
  flashWhite();
  shake(3, 90);
}

/* ---- helper: เรียก hitPlayer / hitAiHero ตาม mode ---- */
function _hitHero(hero) {
  if (isModeBossAI()) hitAiHero();
  else hitPlayer();
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
