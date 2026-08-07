/* ============================================================
   beats.js
   โรงงานสร้างท่าโจมตีของบอส (ring/aim/spiral/laser/homing/wall/combine)
============================================================ */

function beatRingBurst(o) {
  const rings = o.rings || 2, count = o.count || 22, speed = o.speed || 2.3, ringGap = o.ringGap || 220;
  return {
    telegraph: o.telegraph || 950, attackDuration: (rings - 1) * ringGap + 320, recovery: o.recovery || 800,
    telegraphKind: 'burst', data: {},
    prep() { },
    onAttackStart(bs) { fireRing(bs, count, speed, 0); },
    onAttackTick(elapsed, dtS, bs) {
      for (let r = 1; r < rings; r++) {
        const t = r * ringGap;
        if (!this._fired) this._fired = {};
        if (elapsed >= t && !this._fired[r]) { this._fired[r] = true; fireRing(bs, count, speed + r * 0.28, r * 0.22); }
      }
    },
    drawTelegraph(c, bs, p) {
      const rad = 20 + p * 85;
      c.save(); c.globalAlpha = 0.35 * p; c.strokeStyle = '#ffb454'; c.lineWidth = 2.5;
      c.shadowBlur = 14; c.shadowColor = '#ffb454';
      c.beginPath(); c.arc(bs.x, bs.y, rad, 0, Math.PI * 2); c.stroke(); c.restore();
    }
  };
}
function fireRing(bs, count, speed, rotOffset) {
  const bulletCount = Math.round(count * arenaDifficulty());
  for (let i = 0; i < bulletCount; i++) {
    const a = rotOffset + (Math.PI * 2 / bulletCount) * i;
    spawnBullet({ x: bs.x, y: bs.y, vx: Math.cos(a) * speed, vy: Math.sin(a) * speed, r: 6, color: '#ff8a6a', glow: '#ff8a6a' });
  }
}

function beatAimedVolley(o) {
  const count = o.count || 4, spacing = o.spacingMs || 180, speed = o.speed || 4.3;
  return {
    telegraph: o.telegraph || 750, attackDuration: count * spacing + 90, recovery: o.recovery || 800,
    telegraphKind: 'aim', data: {},
    prep(bs, pl) { this.data.angle = angleTo(bs.x, bs.y, pl.x, pl.y); },
    onAttackStart() { this._fired = 0; this._acc = 0; },
    onAttackTick(elapsed, dtS, bs, pl) {
      if (this._fired === undefined) this._fired = 0;
      while (this._fired < count && elapsed >= this._fired * spacing) {
        const a = angleTo(bs.x, bs.y, pl.x, pl.y);
        spawnBullet({ x: bs.x, y: bs.y, vx: Math.cos(a) * speed, vy: Math.sin(a) * speed, r: 6.5, color: '#ff5f7a', glow: '#ff5f7a' });
        this._fired++;
      }
    },
    drawTelegraph(c, bs, p) {
      const a = angleTo(bs.x, bs.y, player.x, player.y);
      this.data.angle = a;
      c.save(); c.globalAlpha = 0.32 * p; c.strokeStyle = '#ff5f7a'; c.lineWidth = 2;
      c.setLineDash([6, 10]); c.shadowBlur = 10; c.shadowColor = '#ff5f7a';
      c.beginPath(); c.moveTo(bs.x, bs.y); c.lineTo(bs.x + Math.cos(a) * 900, bs.y + Math.sin(a) * 900); c.stroke();
      c.restore();
    }
  };
}

function beatSpiralStream(o) {
  const dur = o.duration || 3000, rate = o.rate || 80, speed = o.speed || 2.6, rot = o.rotSpeed || 0.055, arms = o.arms || 3;
  return {
    telegraph: o.telegraph || 700, attackDuration: dur, recovery: o.recovery || 750,
    telegraphKind: 'spiral', data: {},
    prep() { this._ang = rand(0, Math.PI * 2); this._acc = 0; },
    onAttackStart() { this._acc = 0; },
    onAttackTick(elapsed, dtS, bs) {
      this._ang += rot * (dtS / 16.6667);
      this._acc += dtS;
      while (this._acc >= rate) {
        this._acc -= rate;
        for (let i = 0; i < arms; i++) {
          const a = this._ang + (Math.PI * 2 / arms) * i;
          spawnBullet({ x: bs.x, y: bs.y, vx: Math.cos(a) * speed, vy: Math.sin(a) * speed, r: 5.5, color: '#c39dff', glow: '#c39dff' });
        }
      }
    },
    drawTelegraph(c, bs, p) {
      c.save(); c.globalAlpha = 0.3 * p; c.strokeStyle = '#c39dff'; c.lineWidth = 2;
      c.shadowBlur = 12; c.shadowColor = '#c39dff';
      c.beginPath(); c.arc(bs.x, bs.y, 18 + p * 36, 0, Math.PI * 2); c.stroke(); c.restore();
    }
  };
}

function beatLaserSweep(o) {
  const arcSpan = o.arcSpan || 2.8, sweepDuration = o.sweepDuration || 1120, width = o.width || 20;
  const dir = o.reverse ? -1 : 1;
  return {
    telegraph: o.telegraph || 1300, attackDuration: sweepDuration, recovery: o.recovery || 850,
    telegraphKind: 'laser', center: true, data: {}, // ท่ากวาดเลเซอร์รอบตัว ต้องยิงจากกลางจอเสมอ
    prep(bs, pl) {
      const aim = angleTo(bs.x, bs.y, pl.x, pl.y);
      this.data.angleStart = aim - (arcSpan / 2) * dir;
      this.data.angleEnd = aim + (arcSpan / 2) * dir;
    },
    onAttackStart(bs) {
      spawnLaser({ ox: bs.x, oy: bs.y, angleStart: this.data.angleStart, angleEnd: this.data.angleEnd, width, sweepDuration });
    },
    onAttackTick() { },
    drawTelegraph(c, bs, p) {
      c.save(); c.globalAlpha = 0.22 * p;
      c.fillStyle = '#ff4d5e';
      c.beginPath(); c.moveTo(bs.x, bs.y);
      c.arc(bs.x, bs.y, 900, this.data.angleStart, this.data.angleEnd, this.data.angleEnd < this.data.angleStart);
      c.closePath(); c.fill(); c.restore();
    }
  };
}

function beatHomingOrbs(o) {
  const count = o.count || 6, speed = o.speed || 1.9, turnRate = o.turnRate || 0.035;
  return {
    telegraph: o.telegraph || 800, attackDuration: 220, recovery: o.recovery || 800,
    telegraphKind: 'homing', data: {},
    prep() { },
    onAttackStart(bs) {
      for (let i = 0; i < count; i++) {
        const a = rand(0, Math.PI * 2);
        spawnBullet({
          x: bs.x, y: bs.y, vx: Math.cos(a) * speed, vy: Math.sin(a) * speed, r: 6,
          color: '#ff9dd6', glow: '#ff9dd6', type: 'homing', turnRate, speed, maxLife: 5200
        });
      }
    },
    onAttackTick() { },
    drawTelegraph(c, bs, p) {
      c.save(); c.globalAlpha = 0.4 * p; c.fillStyle = '#ff9dd6'; c.shadowBlur = 14; c.shadowColor = '#ff9dd6';
      for (let i = 0; i < 6; i++) {
        const a = (Math.PI * 2 / 6) * i + p * 2;
        c.beginPath(); c.arc(bs.x + Math.cos(a) * (bs.r + 14), bs.y + Math.sin(a) * (bs.r + 14), 3, 0, Math.PI * 2); c.fill();
      }
      c.restore();
    }
  };
}

function beatBulletWall(o) {
  const gapWidth = o.gapWidth || 90, gapCount = o.gapCount || 1, speed = o.speed || 2.6, rows = o.rows || 2, rowGap = o.rowGap || 430;
  return {
    telegraph: o.telegraph || 950, attackDuration: (rows - 1) * rowGap + 260, recovery: o.recovery || 800,
    telegraphKind: 'wall', data: { gaps: [] },
    prep() {
      this.data.gaps = [];
      for (let i = 0; i < gapCount; i++) this.data.gaps.push(rand(arena.left + 60, arena.right - 60));
    },
    onAttackStart() { this._rowsFired = 0; },
    onAttackTick(elapsed, dtS, bs) {
      if (this._rowsFired === undefined) this._rowsFired = 0;
      while (this._rowsFired < rows && elapsed >= this._rowsFired * rowGap) {
        fireWallRow(this.data.gaps, gapWidth, speed, this._rowsFired % 2 === 1);
        this._rowsFired++;
      }
    },
    drawTelegraph(c, bs, p) {
      c.save();
      const step = 34;
      for (let x = arena.left; x < arena.right; x += step) {
        const inGap = this.data.gaps.some(g => Math.abs(x - g) < gapWidth / 2);
        if (!inGap) {
          c.globalAlpha = 0.22 * p; c.fillStyle = '#ffb454';
          c.fillRect(x, arena.top, step - 4, 26);
        }
      }
      c.restore();
    }
  };
}
function fireWallRow(gaps, gapWidth, speed, shift) {
  const step = 30;
  for (let x = arena.left; x < arena.right; x += step) {
    const inGap = gaps.some(g => Math.abs(x - g) < gapWidth / 2);
    if (inGap) continue;
    spawnBullet({ x: x + (shift ? step / 2 : 0), y: arena.top - 10, vx: 0, vy: speed, r: 6, color: '#ffb454', glow: '#ffb454' });
  }
}

function combine(subBeats, overrides) {
  overrides = overrides || {};
  return {
    telegraph: overrides.telegraph !== undefined ? overrides.telegraph : Math.max(...subBeats.map(b => b.telegraph)),
    attackDuration: overrides.attackDuration !== undefined ? overrides.attackDuration : Math.max(...subBeats.map(b => b.attackDuration)),
    recovery: overrides.recovery !== undefined ? overrides.recovery : Math.max(...subBeats.map(b => b.recovery)),
    // true ถ้าตั้ง override ไว้ตรงๆ หรือถ้ามีท่าย่อยตัวไหนต้องการให้บอสกลับกลางจอ (เช่น beatLaserSweep)
    center: overrides.center !== undefined ? overrides.center : subBeats.some(b => b.center),
    telegraphKind: 'combo',
    prep(bs, pl) { subBeats.forEach(b => b.prep && b.prep(bs, pl)); },
    onAttackStart(bs, pl) { subBeats.forEach(b => { b._fired = 0; b._rowsFired = 0; b.onAttackStart && b.onAttackStart(bs, pl); }); },
    onAttackTick(elapsed, dtS, bs, pl) { subBeats.forEach(b => { if (b.onAttackTick) b.onAttackTick(elapsed, dtS, bs, pl); }); },
    drawTelegraph(c, bs, p) { subBeats.forEach(b => b.drawTelegraph && b.drawTelegraph(c, bs, p)); }
  };
}
