/* ============================================================
   ai-hero.js
   AI Hero สำหรับโหมด Boss vs AI (Hard difficulty)
   กลยุทธ์:
     1. Potential Field: กระสุนทุกลูก "ผลัก" ออก, กลางจอ "ดึง" เข้า
     2. Predictive dodge: คำนวณว่ากระสุนจะอยู่ที่ไหนใน X ms ข้างหน้า
     3. Auto-Parry: ถ้ากระสุนจะชนใน ~300ms และผู้เล่นบอสไม่กดขัดจังหวะ
     4. Wall avoidance: ออกจาก edge ของ arena
============================================================ */

const AI_SPEED          = 5.2;    // px/frame (เร็วกว่าบอส ~85%)
const AI_REACT_INTERVAL = 80;     // ms ระหว่างการคำนวณ target ใหม่
const AI_PARRY_LOOKAHEAD = 320;   // ms ล่วงหน้าสำหรับ predictive parry
const AI_DANGER_RADIUS  = 120;    // px — รัศมีที่ถือว่ากระสุน "อันตราย"
const AI_WALL_MARGIN    = 60;     // px — ระยะห่างจาก edge ที่เริ่มผลัก

const aiHero = {
  x: 0, y: 0,
  vx: 0, vy: 0,
  r: 9, hitR: 4,
  lives: 3,
  invuln: false, invulnTimer: 0,
  skillCooldown: 0, skillActive: false, skillTimer: 0,
  skillType: 'parry', parrying: false,

  // AI state
  targetX: 0, targetY: 0,
  reactTimer: 0,       // นับถอยหลัง re-evaluate target
  panicMode: false,    // true = อันตรายสูง ใช้ escape vector แรงขึ้น
};

/* ============================================================
   UPDATE
============================================================ */
function updateAiHero(dtReal) {
  // --- invuln timer ---
  if (aiHero.invuln) {
    aiHero.invulnTimer += dtReal;
    if (aiHero.invulnTimer > 1100) aiHero.invuln = false;
  }

  // --- skill cooldown / active ---
  if (aiHero.skillActive) {
    aiHero.skillTimer += dtReal;
    if (aiHero.skillTimer >= PARRY_DURATION) {
      aiHero.skillActive = false;
      aiHero.parrying = false;
      aiHero.skillCooldown = SKILL_COOLDOWN * 0.7; // AI regen เร็วกว่าผู้เล่น
    }
  } else if (aiHero.skillCooldown > 0) {
    aiHero.skillCooldown = Math.max(0, aiHero.skillCooldown - dtReal);
  }

  // --- re-evaluate target ---
  aiHero.reactTimer -= dtReal;
  if (aiHero.reactTimer <= 0) {
    aiHero.reactTimer = AI_REACT_INTERVAL;
    _aiCalcTarget();
    _aiCheckParry();
  }

  // --- move toward target ---
  const dx = aiHero.targetX - aiHero.x;
  const dy = aiHero.targetY - aiHero.y;
  const dlen = Math.hypot(dx, dy) || 1;

  const speedScale = aiHero.panicMode ? 1.0 : 0.75;
  const step = Math.min(dlen, AI_SPEED * speedScale * (dtReal / 16.6667));

  if (dlen > 2) {
    aiHero.x += (dx / dlen) * step;
    aiHero.y += (dy / dlen) * step;
  }

  // clamp to arena
  aiHero.x = clamp(aiHero.x, arena.left + aiHero.r, arena.right  - aiHero.r);
  aiHero.y = clamp(aiHero.y, arena.top  + aiHero.r, arena.bottom - aiHero.r);

  // trail
  if (appState === 'playing') {
    trail.push({ x: aiHero.x, y: aiHero.y, life: 0 });
    if (trail.length > 10) trail.shift();
    trail.forEach(t => { t.life += dtReal; });
  }
}

/* ---- Potential Field: คำนวณ target position ---- */
function _aiCalcTarget() {
  let fx = 0, fy = 0; // force accumulator

  // 1. กระสุน: ผลักออก + น้ำหนักตามความอันตราย
  for (const b of bullets) {
    // คาดการณ์ตำแหน่งกระสุนใน AI_PARRY_LOOKAHEAD ms
    const predX = b.x + b.vx * (AI_PARRY_LOOKAHEAD / 16.6667);
    const predY = b.y + b.vy * (AI_PARRY_LOOKAHEAD / 16.6667);

    const d = dist(aiHero.x, aiHero.y, predX, predY);
    if (d < AI_DANGER_RADIUS) {
      // แรงผลักแบบ inverse square
      const strength = Math.pow(1 - d / AI_DANGER_RADIUS, 2) * 180;
      const nx = aiHero.x - predX;
      const ny = aiHero.y - predY;
      const nl = Math.hypot(nx, ny) || 1;
      fx += (nx / nl) * strength;
      fy += (ny / nl) * strength;
    }
  }

  // 2. เลเซอร์: ผลักออกจากทิศเลเซอร์
  for (const l of lasers) {
    const lx = Math.cos(l.curAngle || l.angleStart);
    const ly = Math.sin(l.curAngle || l.angleStart);
    const px = aiHero.x - l.ox, py = aiHero.y - l.oy;
    const proj = px * lx + py * ly;
    if (proj > 0) {
      const cx = l.ox + lx * proj, cy = l.oy + ly * proj;
      const d = dist(aiHero.x, aiHero.y, cx, cy);
      if (d < (l.width || 16) * 3) {
        // หนีตั้งฉากกับเลเซอร์
        const perp = { x: -ly, y: lx };
        fx += perp.x * 200;
        fy += perp.y * 200;
      }
    }
  }

  // 3. ดึงเข้ากลางจอ (weak pull)
  const cx = (arena.left + arena.right) / 2;
  const cy = (arena.top  + arena.bottom) / 2;
  const cdx = cx - aiHero.x, cdy = cy - aiHero.y;
  const clen = Math.hypot(cdx, cdy) || 1;
  fx += (cdx / clen) * 15;
  fy += (cdy / clen) * 15;

  // 4. Wall repulsion
  const marginL = aiHero.x - (arena.left  + AI_WALL_MARGIN);
  const marginR = (arena.right  - AI_WALL_MARGIN) - aiHero.x;
  const marginT = aiHero.y - (arena.top   + AI_WALL_MARGIN);
  const marginB = (arena.bottom - AI_WALL_MARGIN) - aiHero.y;
  if (marginL < 0) fx += Math.abs(marginL) * 3;
  if (marginR < 0) fx -= Math.abs(marginR) * 3;
  if (marginT < 0) fy += Math.abs(marginT) * 3;
  if (marginB < 0) fy -= Math.abs(marginB) * 3;

  // panicMode ถ้า force field แรงมาก
  aiHero.panicMode = Math.hypot(fx, fy) > 100;

  // target = ตำแหน่งปัจจุบัน + force direction
  const flen = Math.hypot(fx, fy) || 1;
  const moveRange = aiHero.panicMode ? 80 : 50;
  aiHero.targetX = clamp(aiHero.x + (fx / flen) * moveRange, arena.left + 30, arena.right  - 30);
  aiHero.targetY = clamp(aiHero.y + (fy / flen) * moveRange, arena.top  + 30, arena.bottom - 30);
}

/* ---- Predictive Parry ---- */
function _aiCheckParry() {
  if (aiHero.skillActive || aiHero.skillCooldown > 0) return;

  // หาว่ามีกระสุนที่จะชน aiHero ใน AI_PARRY_LOOKAHEAD ms ไหม
  for (const b of bullets) {
    // จุดที่ใกล้ที่สุดของวิถีกระสุน
    const predX = b.x + b.vx * (AI_PARRY_LOOKAHEAD / 16.6667);
    const predY = b.y + b.vy * (AI_PARRY_LOOKAHEAD / 16.6667);
    const d = dist(aiHero.x, aiHero.y, predX, predY);

    // ถ้ากระสุนจะมาชนภายในรัศมีแพรี่ + margin → parry
    if (d < PARRY_RADIUS + aiHero.hitR + 10) {
      _aiActivateParry();
      return;
    }
  }
}

function _aiActivateParry() {
  aiHero.skillActive = true;
  aiHero.skillTimer = 0;
  aiHero.parrying = true;
  spawnParticles(aiHero.x, aiHero.y, '#ffe066', 14, [1, 3], [200, 350], [1.5, 3]);
}

/* ============================================================
   HIT AI HERO
============================================================ */
function hitAiHero() {
  if (DEV_GODMODE || devMode) return;
  if (aiHero.invuln) return;

  aiHero.lives--;
  aiHero.invuln = true;
  aiHero.invulnTimer = 0;

  shake(11, 320);
  flashRed();
  spawnParticles(aiHero.x, aiHero.y, '#6fd8ff', 22, [1, 4], [350, 600], [1.5, 3.5]);

  if (aiHero.lives <= 0) {
    triggerModeVictory('boss'); // Boss ชนะ
  }
}

/* ============================================================
   DRAW AI HERO
============================================================ */
function drawAiHero() {
  // Trail
  for (const t of trail) {
    const a = 1 - t.life / 260;
    if (a <= 0) continue;
    ctx.save();
    ctx.globalAlpha = a * 0.28;
    ctx.fillStyle = '#6fd8ff';
    ctx.beginPath();
    ctx.arc(t.x, t.y, aiHero.r * 0.6, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // Body
  ctx.save();

  if (aiHero.invuln && Math.floor(aiHero.invulnTimer / 90) % 2 === 0) {
    ctx.globalAlpha = 0.35;
  }

  ctx.shadowBlur = aiHero.skillActive ? 34 : 20;
  ctx.shadowColor = aiHero.parrying ? '#ffe066' : (aiHero.skillActive ? '#bfe9ff' : '#6fd8ff');

  const g = ctx.createRadialGradient(
    aiHero.x - 2, aiHero.y - 2, 1,
    aiHero.x, aiHero.y, aiHero.r
  );
  g.addColorStop(0, '#ffffff');
  g.addColorStop(0.4, '#bfe9ff');
  g.addColorStop(1, '#3f92c9');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(aiHero.x, aiHero.y, aiHero.r, 0, Math.PI * 2);
  ctx.fill();

  // "AI" label เล็กๆ เพื่อแยกจาก Hero จริง
  ctx.shadowBlur = 0;
  ctx.fillStyle = 'rgba(255,255,255,0.6)';
  ctx.font = 'bold 8px Chakra Petch, monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('AI', aiHero.x, aiHero.y);

  ctx.restore();
}
