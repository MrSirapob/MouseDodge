/* ============================================================
   boss-player.js
   บอสที่ผู้เล่นควบคุม (โหมด bossAI = P1, โหมด pvp = P2)
   - เคลื่อนที่ด้วย WASD (~55% ความเร็ว Hero)
   - สกิล 5 ตัว: J / K / L / ; / '
   - ระบบ Energy + Global Cooldown (GCD)
   - HP 5 หัวใจ (ใน pvp: Hero parry ไม่ทำ damage, แต่ deflect)
============================================================ */

/* ---- ค่าปรับแต่ง ---- */
const BOSS_PLAYER_SPEED    = 2.8;   // px ต่อ frame (16.7ms) ~55% ของ hero
const BOSS_PLAYER_FRICTION = 0.80;  // friction (0-1, น้อย = ลื่นมาก)
const BOSS_PLAYER_R        = 56;    // รัศมีวาด (เล็กกว่า AI boss เดิม 64)
const BOSS_PLAYER_GCD      = 420;   // global cooldown หลังใช้สกิล (ms)
const BOSS_PLAYER_ENERGY_MAX  = 100;
const BOSS_PLAYER_ENERGY_REGEN = 9; // พลังงานต่อวินาที

/* ---- state object ---- */
const bossPlayer = {
  x: 0, y: 0,
  vx: 0, vy: 0,
  r: BOSS_PLAYER_R,
  hp: 5, maxHp: 5,
  energy: BOSS_PLAYER_ENERGY_MAX,
  gcd: 0,            // global cooldown timer (ms)
  bob: 0,            // animation bob
  eyeColor: '#ff6b6b',
  eyeGlow:  '#ff6b6b',
  pupilX: 0, pupilY: 0,
  // input keys (ตั้งค่าโดย ui-controls.js)
  keys: { w: false, a: false, s: false, d: false },
  // invuln หลังโดนตี
  invuln: false, invulnTimer: 0,
};

/* ---- สกิลแต่ละ slot ---- */
// fire(hero) — ฟังก์ชันยิงสกิล รับ hero object (player หรือ aiHero)
const BOSS_SKILL_DEFS = [
  {
    key: 'KeyJ', label: 'J', name: 'BURST',
    energyCost: 20, cd: 3000,
    color: '#ffb454', desc: 'Ring Burst',
    fire(hero) { _bossFireBurst(); }
  },
  {
    key: 'KeyK', label: 'K', name: 'VOLLEY',
    energyCost: 15, cd: 2200,
    color: '#ff5f7a', desc: 'Aimed Volley',
    fire(hero) { _bossFireVolley(hero); }
  },
  {
    key: 'KeyL', label: 'L', name: 'HOMING',
    energyCost: 25, cd: 5000,
    color: '#ff9dd6', desc: 'Homing Orbs',
    fire(hero) { _bossFireHoming(); }
  },
  {
    key: 'Semicolon', label: ';', name: 'LASER',
    energyCost: 30, cd: 6000,
    color: '#ff4d5e', desc: 'Laser Sweep',
    fire(hero) { _bossFireLaser(); }
  },
  {
    key: 'Quote', label: "'", name: 'ULTIMATE',
    energyCost: 50, cd: 10000,
    color: '#c39dff', desc: 'Ultimate',
    fire(hero) { _bossFireUltimate(hero); }
  }
];

// สร้าง skill instances (มี cdTimer แยกจาก def)
const bossSkills = BOSS_SKILL_DEFS.map(def => ({
  ...def,
  cdTimer: 0  // ค่าที่เหลือของ cooldown (ms)
}));

/* ============================================================
   UPDATE
============================================================ */
function updateBossPlayer(dtReal) {
  const dtFrame = dtReal / 16.6667; // normalize เป็น frame unit

  // --- Energy regen ---
  bossPlayer.energy = Math.min(
    BOSS_PLAYER_ENERGY_MAX,
    bossPlayer.energy + BOSS_PLAYER_ENERGY_REGEN * (dtReal / 1000)
  );

  // --- Global cooldown ---
  if (bossPlayer.gcd > 0) bossPlayer.gcd = Math.max(0, bossPlayer.gcd - dtReal);

  // --- Skill cooldowns ---
  for (const sk of bossSkills) {
    if (sk.cdTimer > 0) sk.cdTimer = Math.max(0, sk.cdTimer - dtReal);
  }

  // --- Invuln timer ---
  if (bossPlayer.invuln) {
    bossPlayer.invulnTimer += dtReal;
    if (bossPlayer.invulnTimer > 1200) bossPlayer.invuln = false;
  }

  // --- Movement (WASD) ---
  const k = bossPlayer.keys;
  let ax = 0, ay = 0;
  if (k.a) ax -= 1;
  if (k.d) ax += 1;
  if (k.w) ay -= 1;
  if (k.s) ay += 1;

  // normalize diagonal
  const alen = Math.hypot(ax, ay) || 1;
  if (ax !== 0 || ay !== 0) {
    bossPlayer.vx += (ax / alen) * BOSS_PLAYER_SPEED;
    bossPlayer.vy += (ay / alen) * BOSS_PLAYER_SPEED;
  }

  // friction
  bossPlayer.vx *= Math.pow(BOSS_PLAYER_FRICTION, dtFrame);
  bossPlayer.vy *= Math.pow(BOSS_PLAYER_FRICTION, dtFrame);

  // integrate position
  bossPlayer.x += bossPlayer.vx * dtFrame;
  bossPlayer.y += bossPlayer.vy * dtFrame;

  // clamp to arena
  bossPlayer.x = clamp(bossPlayer.x, arena.left + bossPlayer.r, arena.right  - bossPlayer.r);
  bossPlayer.y = clamp(bossPlayer.y, arena.top  + bossPlayer.r, arena.bottom - bossPlayer.r);

  // --- Visual bob ---
  bossPlayer.bob += dtReal * 0.0018;

  // --- Pupil tracks hero ---
  const hero = getActiveHero();
  const pdx = hero.x - bossPlayer.x;
  const pdy = hero.y - bossPlayer.y;
  const plen = Math.hypot(pdx, pdy) || 1;
  bossPlayer.pupilX = (pdx / plen) * 8;
  bossPlayer.pupilY = (pdy / plen) * 8;
}

/* ============================================================
   SKILL ACTIVATION — เรียกจาก ui-controls.js
============================================================ */
function tryBossSkill(slotIndex) {
  if (appState !== 'playing') return;
  if (bossPlayer.gcd > 0) return; // global cooldown

  const sk = bossSkills[slotIndex];
  if (!sk) return;
  if (sk.cdTimer > 0) return;           // skill-specific cooldown
  if (bossPlayer.energy < sk.energyCost) return; // ไม่มีพลังงาน

  // หักพลังงาน + ตั้ง cooldowns
  bossPlayer.energy -= sk.energyCost;
  sk.cdTimer = sk.cd;
  bossPlayer.gcd = BOSS_PLAYER_GCD;
  bossPlayer.eyeColor = sk.color;

  // ยิงสกิล
  const hero = getActiveHero();
  sk.fire(hero);

  // เอฟเฟกต์
  spawnParticles(bossPlayer.x, bossPlayer.y, sk.color, 10, [1, 3], [200, 400], [1.5, 3]);
  shake(4, 120);
}

/* ============================================================
   SKILL IMPLEMENTATIONS
============================================================ */

// J — Burst Ring: วงแหวน 18 ลูกรอบตัวบอส
function _bossFireBurst() {
  const count = 18;
  const speed = 2.6;
  for (let i = 0; i < count; i++) {
    const a = (Math.PI * 2 / count) * i;
    spawnBullet({
      x: bossPlayer.x, y: bossPlayer.y,
      vx: Math.cos(a) * speed, vy: Math.sin(a) * speed,
      r: 6, color: '#ffb454', glow: '#ffb454', maxLife: 5000
    });
  }
}

// K — Aimed Volley: ยิง 6 ลูกตรงหา hero ทยอยกัน
function _bossFireVolley(hero) {
  const count = 6;
  const speed = 4.5;
  const spread = 0.18; // radian spread ระหว่างลูก
  const baseAngle = angleTo(bossPlayer.x, bossPlayer.y, hero.x, hero.y);
  for (let i = 0; i < count; i++) {
    const delay = i * 120;
    const a = baseAngle + (i - (count - 1) / 2) * spread * 0.3;
    setTimeout(() => {
      if (appState !== 'playing') return;
      spawnBullet({
        x: bossPlayer.x, y: bossPlayer.y,
        vx: Math.cos(a) * speed, vy: Math.sin(a) * speed,
        r: 5.5, color: '#ff5f7a', glow: '#ff5f7a', maxLife: 5000
      });
    }, delay);
  }
}

// L — Homing Orbs: ปล่อย orb ไล่ hero 3 ลูก
function _bossFireHoming() {
  const count = 3;
  const speed = 2.4;
  for (let i = 0; i < count; i++) {
    const a = (Math.PI * 2 / count) * i;
    setTimeout(() => {
      if (appState !== 'playing') return;
      spawnBullet({
        x: bossPlayer.x, y: bossPlayer.y,
        vx: Math.cos(a) * speed, vy: Math.sin(a) * speed,
        r: 8, color: '#ff9dd6', glow: '#ff9dd6',
        type: 'homing', turnRate: 0.055, speed, maxLife: 7000
      });
    }, i * 200);
  }
}

// ; — Laser Sweep: กวาดเลเซอร์จากทิศบอส → hero ไปอีกด้าน
function _bossFireLaser() {
  const heroAngle = angleTo(bossPlayer.x, bossPlayer.y, getActiveHero().x, getActiveHero().y);
  const span = 2.4;
  spawnLaser({
    ox: bossPlayer.x, oy: bossPlayer.y,
    angleStart: heroAngle - span / 2,
    angleEnd:   heroAngle + span / 2,
    width: 20, sweepDuration: 1100
  });
}

// ' — Ultimate: ระเบิดวงขนาดใหญ่ + สไปรัลสั้น
function _bossFireUltimate(hero) {
  // ring ใหญ่
  const countRing = 24;
  const speed = 3.0;
  for (let i = 0; i < countRing; i++) {
    const a = (Math.PI * 2 / countRing) * i;
    spawnBullet({
      x: bossPlayer.x, y: bossPlayer.y,
      vx: Math.cos(a) * speed, vy: Math.sin(a) * speed,
      r: 7, color: '#c39dff', glow: '#c39dff', maxLife: 6000
    });
  }
  // aimed burst ตาม hero
  const baseAngle = angleTo(bossPlayer.x, bossPlayer.y, hero.x, hero.y);
  for (let i = -2; i <= 2; i++) {
    const a = baseAngle + i * 0.22;
    setTimeout(() => {
      if (appState !== 'playing') return;
      spawnBullet({
        x: bossPlayer.x, y: bossPlayer.y,
        vx: Math.cos(a) * 5, vy: Math.sin(a) * 5,
        r: 6, color: '#e8b3ff', glow: '#c39dff', maxLife: 4000
      });
    }, i * 80 + 200);
  }
  shake(10, 400);
}

/* ============================================================
   HIT bossPlayer (เมื่อกระสุน deflect กลับมาโดน — pvp mode)
   ในโหมด bossAI บอสไม่มีระบบ HP เพราะ Hero ชนะด้วยการรอด
============================================================ */
function hitBossPlayer() {
  if (bossPlayer.invuln) return;
  bossPlayer.invuln = true;
  bossPlayer.invulnTimer = 0;
  bossPlayer.hp--;
  shake(8, 260);
  flashRed();
  spawnParticles(bossPlayer.x, bossPlayer.y, '#ff4d5e', 20, [1, 4], [300, 600], [1.5, 3.5]);

  if (bossPlayer.hp <= 0 && isModePvp()) {
    triggerModeVictory('hero'); // Hero ชนะใน PvP
  }
}

/* ============================================================
   DRAW bossPlayer
============================================================ */
function drawBossPlayer() {
  const r = bossPlayer.r;
  const bobOffset = Math.sin(bossPlayer.bob) * 5;

  ctx.save();
  ctx.translate(bossPlayer.x, bossPlayer.y + bobOffset);

  // invuln flicker
  if (bossPlayer.invuln && Math.floor(bossPlayer.invulnTimer / 90) % 2 === 0) {
    ctx.globalAlpha = 0.35;
  }

  // outer glow ring
  ctx.save();
  ctx.globalAlpha *= 0.55;
  ctx.strokeStyle = bossPlayer.eyeColor;
  ctx.lineWidth = 2;
  ctx.shadowBlur = 28;
  ctx.shadowColor = bossPlayer.eyeColor;
  ctx.beginPath(); ctx.arc(0, 0, r + 9, 0, Math.PI * 2); ctx.stroke();
  ctx.restore();

  // iris body
  const g = ctx.createRadialGradient(-r * 0.22, -r * 0.22, 3, 0, 0, r);
  g.addColorStop(0, '#ff9b9b');
  g.addColorStop(0.5, bossPlayer.eyeColor);
  g.addColorStop(1, '#2a0a0a');
  ctx.fillStyle = g;
  ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.fill();

  // pupil
  ctx.fillStyle = '#0a0305';
  ctx.beginPath(); ctx.arc(bossPlayer.pupilX, bossPlayer.pupilY, r * 0.34, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,.72)';
  ctx.beginPath(); ctx.arc(bossPlayer.pupilX - r * 0.1, bossPlayer.pupilY - r * 0.1, r * 0.09, 0, Math.PI * 2); ctx.fill();

  ctx.restore();
}
