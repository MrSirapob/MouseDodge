/* ============================================================
   state.js
   ตัวแปร/ค่าคงที่ tuning ทั้งหมดของเกม, obj player, obj boss
   เพิ่ม: BOSS_AI_TIME_LIMIT, bossAITimer
============================================================ */

let bullets    = [];
let lasers     = [];
let particles  = [];
let trail      = [];
let slashes    = [];
let shakeMag = 0, shakeTime = 0, shakeTotal = 0;
let furthestPhase = 1;
let lastTime = 0;
let deathTimer = 0;
let deathFade  = 0;

/* ---- Boss vs AI Timer ---- */
const BOSS_AI_TIME_LIMIT = 90000; // ms (90 วินาที)
let bossAITimer = BOSS_AI_TIME_LIMIT;

const DEATH_DURATION = 1600;

const GAMEOVER_QUOTES = [
  'คิดว่าจะรอดเหรอ?', 'อีกทีสิ 🙂', 'แค่นี้เอง?', 'ยังไม่ใช่...',
  'บอสยังอุ่นเครื่องอยู่เลย', 'พลาดนิดเดียวเอง...มั้ง', 'จะยอมแล้วเหรอ?',
  'ยังไม่ถึงเวลาชนะ', 'เกือบแล้ว...จริง ๆ นะ', 'เอาใหม่ ฉันรออยู่',
  'อดีต Beta Tester งั้นหรอ', 'อ้าว... จบไวไปนะ 😏', 'เมื่อกี้ตั้งใจแล้วใช่ไหม?',
  'นี่แค่เรียกน้ำย่อยเอง', 'อ้าวแตกละหรอ 🤭', 'ยังไม่คันมือเลย',
  'อืม... เอาใหม่ดีกว่า', 'ขอรอบที่จริงจังกว่านี้หน่อย', 'เมื่อกี้ถือว่าอบอุ่นร่างกาย',
  'นายทำได้ดีกว่านี้นะ 🙂', 'ฉันเชื่อว่านายจะกด \'ลองอีกครั้ง\'',
  'แค่นี้ยังไม่พอ ทำให้ฉันแพ้หรอก', 'อ๊ะ... โดนอีกแล้ว', 'ใจเย็น ๆ แล้วลองใหม่',
  'รอบหน้าขอให้ได้นานกว่านี้นะ', 'ข้ายังรอเจ้าอยู่...', 'ไม่เป็นไร... ฉันรอได้ 😌',
  'ฮึ... น่าสนุกขึ้นแล้ว', 'อย่าทำให้ฉันผิดหวังสิ', 'แสดงฝีมือให้ดูอีกหน่อย',
  'นี่เหรอ... ผู้ท้าชิง?', 'ยังมีแรงกด \'ลองอีกครั้ง\' ใช่ไหม?',
  'ฉันยังไม่เบื่อหรอก', 'คราวนี้คงไม่พลาด... ใช่ไหม?', 'ครั้งนี้ฉันชนะ 😏',
  'ลุกขึ้นมาอีกสิ'
];

/* ---- DEV / DEBUG ---- */
const DEV_GODMODE = false;
let devMode = false;

/* ---- TUNING ---- */
const SLOWMO_SCALE     = 0.32;
const SLOWMO_DURATION  = 1200;
const SKILL_COOLDOWN   = 5000;
const GRAZE_RADIUS     = 24;
const GRAZE_REFUND     = 150;
const PHASE_TRANSITION_MS = 2100;
const DEFEAT_MS        = 2000;

/* ---- PARRY ---- */
const PARRY_DURATION          = 1000;
const PARRY_RADIUS            = 34;
const PARRY_DEFLECT_SPEED_MULT = 1.18;
const PARRY_IMMUNITY_MS       = 260;

const SKILL_DURATIONS = { slowmo: SLOWMO_DURATION, parry: PARRY_DURATION };

/* ---- Hero (P1 / Mouse) ---- */
const player = {
  x: 0, y: 0, r: 9, hitR: 4,
  lives: 3, invuln: false, invulnTimer: 0,
  skillCooldown: 0, skillActive: false, skillTimer: 0,
  skillType: 'parry', parrying: false
};

/* ---- Classic Boss (AI-driven) ---- */
const boss = {
  x: 0, y: 0, homeX: 0, homeY: 120,
  baseY: 120,
  r: 64, bob: 0,
  phaseIndex: 0, cycle: 0, beatIndex: 0,
  state: 'TELEGRAPH', timer: 0, currentBeat: null,
  eyeColor: '#8f7bff', eyeGlow: '#8f7bff',
  dashTargetX: null, dashFrom: 0, dashProgress: 1,
  dashTargetY: null, dashFromY: 0,
  pupilX: 0, pupilY: 0,
  introDone: false
};
