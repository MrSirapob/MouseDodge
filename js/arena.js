/* ============================================================
   arena.js
   วาดพื้นหลัง/เส้นกริดของสนาม
============================================================ */

function drawArena() {
  ctx.fillStyle = '#05060a';
  ctx.fillRect(0, 0, W, H);

  ctx.save();

  ctx.strokeStyle = arenaGridColor;
  ctx.globalAlpha = 0.15;

  // เพิ่ม 2 บรรทัดนี้
  ctx.shadowBlur = 8;
  ctx.shadowColor = arenaGridColor;

  ctx.lineWidth = 1;

  const step = 42;

  ctx.beginPath();

  const ox = gridOffsetX % step;
  const oy = gridOffsetY % step;

  // แนวตั้ง
  for (let x = -step; x <= W + step; x += step) {
    ctx.moveTo(x + ox, 0);
    ctx.lineTo(x + ox, H);
  }

  // แนวนอน
  for (let y = -step; y <= H + step; y += step) {
    ctx.moveTo(0, y + oy);
    ctx.lineTo(W, y + oy);
  }

  ctx.stroke();

  // รีเซ็ตค่า
  ctx.shadowBlur = 0;
  ctx.globalAlpha = 1;

  ctx.restore();
}
