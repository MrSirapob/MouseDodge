/* ============================================================
   boot.js
   จุดเริ่มเกม:
   - resize() + ตำแหน่งเริ่มต้น
   - สร้าง Boss Skill Slots ใน DOM
   - เริ่ม requestAnimationFrame
   โหลดเป็นไฟล์สุดท้ายเสมอ
============================================================ */

resize();

// ตำแหน่งเริ่มต้น
boss.x = W / 2; boss.homeY = BOSS_TOP_Y; boss.baseY = boss.homeY; boss.y = boss.homeY;
player.x = W / 2; player.y = H * 0.75;

// สร้าง Skill Slots ใน HUD ทั้ง 2 (bossAI + pvp ใช้ร่วมกัน)
_buildBossSkillSlots();

// Pause button สำหรับ HUD ใหม่
document.getElementById('pause-btn-bossai')?.addEventListener('click', () => {
  if (appState === 'playing') pauseGame();
});
document.getElementById('pause-btn-pvp')?.addEventListener('click', () => {
  if (appState === 'playing') pauseGame();
});

requestAnimationFrame(frame);

/* ---- Build Boss Skill Slots ---- */
function _buildBossSkillSlots() {
  // สร้าง slot เดียวกัน 2 ชุด (หนึ่งสำหรับ hud-bossai, หนึ่งสำหรับ hud-pvp)
  ['boss-skills-bossai', 'boss-skills-pvp'].forEach(containerId => {
    const container = document.getElementById(containerId);
    if (!container) return;

    bossSkills.forEach((sk, i) => {
      const slot = document.createElement('div');
      slot.className = 'boss-skill-slot';
      slot.id = `bsk-${i}-${containerId}`;
      slot.innerHTML = `
        <div class="bs-key">${sk.label}</div>
        <div class="bs-name">${sk.name}</div>
        <div class="bs-cd-bar-wrap"><div class="bs-cd-bar" style="background:${sk.color}"></div></div>
        <div class="bs-cd-text"></div>
      `;
      container.appendChild(slot);
    });
  });
}
