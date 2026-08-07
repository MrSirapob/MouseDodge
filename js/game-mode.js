/* ============================================================
   game-mode.js
   ตัวแปรโหมดเกมกลาง — ทุกระบบตรวจสอบจากไฟล์นี้
   โหมด:
     'classic' — Hero (Mouse) vs Boss AI (เดิม)
     'bossAI'  — Hero AI (Hard) vs Boss (ผู้เล่น, WASD+skills)
     'pvp'     — Hero P1 (Mouse) vs Boss P2 (WASD+skills)
============================================================ */

// โหมดปัจจุบัน
let gameMode = 'classic';

const GAME_MODE = {
  CLASSIC : 'classic',
  BOSS_AI : 'bossAI',
  PVP     : 'pvp'
};

/* ---- helper ---- */
function isModeClassic() { return gameMode === GAME_MODE.CLASSIC; }
function isModeBossAI()  { return gameMode === GAME_MODE.BOSS_AI; }
function isModePvp()     { return gameMode === GAME_MODE.PVP; }

// คืน object ของ "ฝ่าย Hero" ที่ใช้ใน mode นั้น
// classic/pvp  → player   (ผู้เล่น P1)
// bossAI       → aiHero   (AI)
function getActiveHero() {
  return isModeBossAI() ? aiHero : player;
}

// คืน true ถ้าต้องวาด/อัปเดตบอสที่ AI ควบคุม (phase system เดิม)
function isBossAI() { return isModeClassic(); }

// คืน true ถ้าต้องวาด/อัปเดต bossPlayer (บอสที่ผู้เล่นควบคุม)
function isBossControlledByPlayer() { return isModeBossAI() || isModePvp(); }
