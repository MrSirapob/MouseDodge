/* ============================================================
   lasers.js
   เลเซอร์กวาด (sweep) ของบอส
============================================================ */

function spawnLaser(o) {
  lasers.push({
    ox: o.ox, oy: o.oy, angleStart: o.angleStart, angleEnd: o.angleEnd,
    width: o.width || 16, sweepDuration: o.sweepDuration, elapsed: 0,
    active: true, hitCooldown: 0
  });
}
function updateLasers(dtS) {
  for (let i = lasers.length - 1; i >= 0; i--) {
    const l = lasers[i];
    l.elapsed += dtS;
    const t = clamp(l.elapsed / l.sweepDuration, 0, 1);
    const curAngle = lerp(l.angleStart, l.angleEnd, easeInOutQuad(t));
    l.curAngle = curAngle;
    if (!player.invuln && appState === 'playing') {
      const px = player.x - l.ox, py = player.y - l.oy;
      const dirx = Math.cos(curAngle), diry = Math.sin(curAngle);
      const proj = px * dirx + py * diry;
      if (proj > 0) {
        const closestX = l.ox + dirx * proj, closestY = l.oy + diry * proj;
        const d = dist(player.x, player.y, closestX, closestY);
        if (d < l.width / 2 + player.hitR) hitPlayer();
      }
    }
    if (t >= 1) lasers.splice(i, 1);
  }
}
function drawLasers() {
  for (const l of lasers) {
    const len = 1400;
    const ex = l.ox + Math.cos(l.curAngle) * len, ey = l.oy + Math.sin(l.curAngle) * len;
    const grad = ctx.createLinearGradient(l.ox, l.oy, ex, ey);
    grad.addColorStop(0, 'rgba(255,90,110,0.95)');
    grad.addColorStop(0.06, 'rgba(255,120,130,0.9)');
    grad.addColorStop(1, 'rgba(255,60,80,0)');
    ctx.save();
    ctx.strokeStyle = grad;
    ctx.lineWidth = l.width;
    ctx.lineCap = 'round';
    ctx.shadowBlur = 22; ctx.shadowColor = '#ff4d5e';
    ctx.beginPath(); ctx.moveTo(l.ox, l.oy); ctx.lineTo(ex, ey); ctx.stroke();
    ctx.lineWidth = l.width * 0.32;
    ctx.strokeStyle = 'rgba(255,235,235,0.9)';
    ctx.shadowBlur = 8;
    ctx.beginPath(); ctx.moveTo(l.ox, l.oy); ctx.lineTo(ex, ey); ctx.stroke();
    ctx.restore();
  }
}
