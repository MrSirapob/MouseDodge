/* ============================================================
   boot.js
   จุดเริ่มเกม: ตั้งค่าตำแหน่งเริ่มต้น แล้วเริ่ม game loop — โหลดเป็นไฟล์สุดท้ายเสมอ
============================================================ */

resize();
boss.x = W / 2; boss.homeY = BOSS_TOP_Y; boss.baseY = boss.homeY; boss.y = boss.homeY;
player.x = W / 2; player.y = H * 0.75;
requestAnimationFrame(frame);
