/* ============================================================
   skill-parry.js
   สกิล 'แพรี่': ปัดกระสุนออกด้านข้าง + slash effect — ไฟล์นี้แยกไว้เพื่อให้เพิ่ม/แก้สกิลใหม่ๆ ได้ง่ายในอนาคต
============================================================ */

function deflectBullet(b) {
  // ทิศจากตัวผู้เล่นไปยังกระสุน (normal ของวงกลม parry)
  const rx = b.x - player.x, ry = b.y - player.y;
  const rlen = Math.hypot(rx, ry) || 1;
  const nx = rx / rlen, ny = ry / rlen;

  // สองทิศที่ตั้งฉากกับ normal — คือแนวปัด "ออกด้านข้าง" ที่เป็นไปได้
  const tx1 = -ny, ty1 = nx;
  const tx2 = ny, ty2 = -nx;

  // เลือกทิศที่ใกล้เคียงกับทิศทางที่กระสุนวิ่งเข้ามาอยู่แล้วมากที่สุด
  // เพื่อให้กระสุนแค่ "เบี่ยง" ออกข้าง ไม่ใช่หักกลับทิศ (และไม่มีทางพุ่งกลับไปหาบอสตรงๆ)
  const dot1 = b.vx * tx1 + b.vy * ty1;
  const dot2 = b.vx * tx2 + b.vy * ty2;
  const tx = dot1 >= dot2 ? tx1 : tx2;
  const ty = dot1 >= dot2 ? ty1 : ty2;

  const incomingAngle = Math.atan2(b.vy, b.vx);
  const speed = (Math.hypot(b.vx, b.vy) || b.speed || 3) * PARRY_DEFLECT_SPEED_MULT;

  b.vx = tx * speed;
  b.vy = ty * speed;
  b.speed = speed;

  // กระสุนโฮมมิ่งที่โดนปัดแล้วต้องไม่หันมาไล่ผู้เล่นซ้ำ
  if (b.type === 'homing') b.type = 'deflected';

  b.justParried = PARRY_IMMUNITY_MS;
  b.grazed = true; // กันไม่ให้เข้าเงื่อนไข graze หลังปัดแล้ว
  b.color = '#fff3b0'; b.glow = '#ffe066';

  const slashAngle = Math.atan2(ty, tx);
  spawnSlashEffect(b.x, b.y, slashAngle, incomingAngle);
  spawnParticles(b.x, b.y, '#ffe066', 9, [1.2, 3.2], [160, 300], [1, 2.6]);
  flashWhite();
  shake(3, 90);
}

function spawnSlashEffect(x, y, angle, incomingAngle) {
  slashes.push({ x, y, angle, incomingAngle, life: 0, maxLife: 220 });
}
function updateSlashes(dtS) {
  for (let i = slashes.length - 1; i >= 0; i--) {
    const s = slashes[i];
    s.life += dtS;
    if (s.life > s.maxLife) slashes.splice(i, 1);
  }
}
function drawSlashes() {
  for (const s of slashes) {
    const t = clamp(s.life / s.maxLife, 0, 1);
    const alpha = 1 - t;
    const len = 40 + t * 26;
    ctx.save();
    ctx.translate(s.x, s.y);
    ctx.rotate(s.angle);
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = '#ffe066';
    ctx.lineWidth = Math.max(1, 4 * (1 - t * 0.7));
    ctx.lineCap = 'round';
    ctx.shadowBlur = 16; ctx.shadowColor = '#fff3b0';
    ctx.beginPath();
    ctx.moveTo(-len / 2, 0);
    ctx.lineTo(len / 2, 0);
    ctx.stroke();
    ctx.restore();
  }
}
