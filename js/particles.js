/* ============================================================
   particles.js
   อัปเดต/วาดพาร์ทิเคิลทั่วไป (spawnParticles อยู่ใน utils.js)
============================================================ */

function updateParticles(dtS) {
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.life += dtS;
    if (p.life > p.maxLife) { particles.splice(i, 1); continue; }
    p.x += p.vx * (dtS / 16.6667); p.y += p.vy * (dtS / 16.6667);
    p.vx *= 0.965; p.vy *= 0.965;
  }
}
function drawParticles() {
  for (const p of particles) {
    const t = 1 - p.life / p.maxLife;
    ctx.save();
    ctx.globalAlpha = Math.max(0, t);
    ctx.fillStyle = p.color;
    ctx.shadowBlur = 10; ctx.shadowColor = p.color;
    ctx.beginPath(); ctx.arc(p.x, p.y, p.size * t + 0.4, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }
}
