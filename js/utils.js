/* ============================================================
   utils.js
   ฟังก์ชันช่วยทั่วไป: คณิตศาสตร์, easing, screen shake
============================================================ */

function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
function lerp(a, b, t) { return a + (b - a) * t; }
function dist(x1, y1, x2, y2) { return Math.hypot(x2 - x1, y2 - y1); }
function angleTo(x1, y1, x2, y2) { return Math.atan2(y2 - y1, x2 - x1); }
function rand(a, b) { return a + Math.random() * (b - a); }

function arenaDifficulty() {
  const width = arena.right - arena.left;

  // อิงจอ Full HD
  const scale = width / 1868;

  // จำกัดไว้ระหว่าง 90% - 115%
  return clamp(scale, 0.9, 1.15);
}

function easeOutCubic(t) { return 1 - Math.pow(1 - t, 3); }
function easeInOutQuad(t) { return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; }

function shake(mag, dur) { shakeMag = mag; shakeTime = dur; shakeTotal = dur; }

function spawnParticles(x, y, color, count, speedRange, lifeRange, sizeRange) {
  for (let i = 0; i < count; i++) {
    const a = rand(0, Math.PI * 2);
    const sp = rand(speedRange[0], speedRange[1]);
    particles.push({
      x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp,
      life: 0, maxLife: rand(lifeRange[0], lifeRange[1]),
      size: rand(sizeRange[0], sizeRange[1]), color
    });
  }
}
