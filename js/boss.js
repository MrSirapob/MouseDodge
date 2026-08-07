/* ============================================================
   boss.js
   state machine ของบอส (telegraph/attack/recovery/phase transition/defeat) + การวาดบอส
============================================================ */

let victoryPending = false;

function eyeColorFor(kind) {
  switch (kind) {
    case 'burst': return '#ffb454';
    case 'aim': return '#ff5f7a';
    case 'spiral': return '#c39dff';
    case 'laser': return '#ff4d5e';
    case 'homing': return '#ff9dd6';
    case 'wall': return '#ffb454';
    case 'combo': return '#ff6d6d';
    default: return '#8f7bff';
  }
}

function enterTelegraph() {
  boss.state = 'TELEGRAPH'; boss.timer = 0;
  boss.currentBeat = PHASES[boss.phaseIndex].beats[boss.beatIndex];
  boss.currentBeat.prep && boss.currentBeat.prep(boss, player);
  boss.eyeColor = eyeColorFor(boss.currentBeat.telegraphKind);
}
function enterAttack() {
  boss.state = 'ATTACK'; boss.timer = 0;
  boss.currentBeat.onAttackStart && boss.currentBeat.onAttackStart(boss, player);
}
function peekNextBeat() {
  // เช็คว่าท่าถัดไปคือท่าอะไร ใช้ตัดสินใจว่าบอสต้องกลับไปกลางจอก่อนไหม
  const beats = PHASES[boss.phaseIndex].beats;
  let nextIndex = boss.beatIndex + 1;
  let nextCycle = boss.cycle;
  if (nextIndex >= beats.length) { nextIndex = 0; nextCycle++; }
  if (nextCycle >= PHASES[boss.phaseIndex].cycles) return null; // รอบถัดไปคือเปลี่ยนเฟสแล้ว ไม่ต้องกลาง
  return beats[nextIndex];
}

function devJumpToPhase(idx) {
  if (!devMode || idx < 0 || idx >= PHASES.length) return;
  if (appState !== 'playing' && appState !== 'intro') return;
  bullets = []; lasers = [];
  boss.phaseIndex = idx; boss.cycle = 0; boss.beatIndex = 0;
  furthestPhase = Math.max(furthestPhase, idx + 1);
  setupBossDash(PHASES[idx].beats[0]);
  boss.state = 'TELEGRAPH'; // กันเคสกระโดดตอนบอสยังอยู่ intro/defeated
  enterTelegraph();
  appState = 'playing';
}

function setupBossDash(nextBeat) {
  // เรียกก่อนเริ่มท่าใดๆ (ทั้งท่าถัดไปในเฟสเดียวกัน และท่าแรกของเฟสใหม่)
  // แยก 2 เรื่องออกจากกัน:
  //  - centerNeeded: ท่ากวาดเลเซอร์ ต้องย้ายไปกลางจอเสมอ ทุกเฟส (ตั้งแต่เฟส 2 ที่เริ่มมีท่านี้)
  //  - wanderEnabled: การสุ่มเดินไปมาระหว่างท่า เป็นดีไซน์ความยาก เริ่มเฟส 3 ขึ้นไปเท่านั้น
  const centerNeeded = !!(nextBeat && nextBeat.center);
  const wanderEnabled = boss.phaseIndex >= 2;
  if (!centerNeeded && !wanderEnabled) return; // เฟสต้นๆ ไม่มีท่ากวาดเลเซอร์ ไม่ต้องขยับ

  boss.dashFrom = boss.x;
  boss.dashFromY = boss.homeY;
  if (centerNeeded) {
    // ท่ากวาดเลเซอร์รอบตัว: ย้ายบอสไปกลางจอทั้งแนวนอนและแนวตั้ง
    boss.dashTargetX = W / 2;
    boss.dashTargetY = H / 2;
  } else if (wanderEnabled) {
    // ท่าปกติ (เฟส 3 ขึ้นไป): สุ่มตำแหน่งแนวนอน แล้วกลับขึ้นไปด้านบน
    boss.dashTargetX = clamp(boss.homeX + rand(-220, 220), 180, W - 180);
    boss.dashTargetY = BOSS_TOP_Y;
  } else {
    // จบท่ากวาดเลเซอร์ในเฟสที่ยังไม่ปลดล็อก wander (เฟส 2): กลับขึ้นบน ตำแหน่งแนวนอนเดิม
    boss.dashTargetX = boss.homeX;
    boss.dashTargetY = BOSS_TOP_Y;
  }
  boss.dashProgress = 0;
}

function enterRecovery() {
  boss.state = 'RECOVERY'; boss.timer = 0;
  boss.eyeColor = '#8f7bff';
  setupBossDash(peekNextBeat());
}
function advanceBeat() {
  boss.beatIndex++;
  if (boss.beatIndex >= PHASES[boss.phaseIndex].beats.length) {
    boss.beatIndex = 0; boss.cycle++;
    if (boss.cycle >= PHASES[boss.phaseIndex].cycles) {
      if (boss.phaseIndex >= PHASES.length - 1) { startDefeat(); return; }
      enterPhaseTransition(); return;
    }
  }
  enterTelegraph();
}
function enterPhaseTransition() {
  boss.state = 'PHASE_TRANSITION'; boss.timer = 0;
  boss.eyeColor = '#ffffff';
  shake(12, 480);
  showPhaseTitle('เฟส ' + (boss.phaseIndex + 2));

  const bossBar = document.getElementById("boss-bar-wrap");
  bossBar.classList.add("phase-up");
  setTimeout(() => {
    bossBar.classList.remove("phase-up");
  }, 800);
}
function startDefeat() {
  boss.state = 'DEFEATED'; boss.timer = 0;
  shake(20, 900);
  spawnParticles(boss.x, boss.y, '#ffffff', 70, [1.5, 6], [600, 1200], [1.5, 4.5]);
  spawnParticles(boss.x, boss.y, '#8f7bff', 50, [0.5, 3], [800, 1400], [2, 5]);
}

const BOSS_TOP_Y = 120; // ตำแหน่ง Y ปกติของบอส (มุมบนจอ) ตอนไม่ได้ใช้ท่ากวาดเลเซอร์

function updateBoss(dtS) {
  boss.bob += dtS * 0.0022;
  arenaGridColor = lerpColor(
    arenaGridColor,
    boss.eyeColor,
    0.08
  );
  let targetX = boss.homeX;
  let targetY = boss.homeY;
  if (boss.dashTargetX !== null && boss.dashProgress < 1) {
    boss.dashProgress = clamp(boss.dashProgress + dtS / 650, 0, 1);
    const dashT = easeInOutQuad(boss.dashProgress);
    targetX = lerp(boss.dashFrom, boss.dashTargetX, dashT);
    targetY = lerp(boss.dashFromY, boss.dashTargetY, dashT);
    boss.homeX = boss.dashTargetX;
    boss.homeY = boss.dashTargetY;
  } else {
    targetX = boss.homeX;
    targetY = boss.homeY;
  }
  boss.x = lerp(boss.x || targetX, targetX, 0.12);
  boss.baseY = lerp(boss.baseY || targetY, targetY, 0.12);
  boss.y = boss.baseY + Math.sin(boss.bob) * 7;

  const pdx = player.x - boss.x, pdy = player.y - boss.y;
  const plen = Math.hypot(pdx, pdy) || 1;
  boss.pupilX = (pdx / plen) * 9; boss.pupilY = (pdy / plen) * 9;

  if (boss.state === 'DEFEATED') {
    boss.timer += dtS;
    if (boss.timer >= DEFEAT_MS && !victoryPending) {
      victoryPending = true;
      appState = 'victory';
      showScreen('victory');
      // คืนค่าข้อความ victory screen กลับเป็น classic
      const sub = document.querySelector('#screen-victory .result-sub');
      if (sub) sub.textContent = 'เจ้าเอาชนะบอสตัวแรกได้แล้ว — ชัยชนะนี้เจ้าเป็นผู้ไขว่คว้ามันมาเอง';
    }
    return;
  }

  boss.timer += dtS;
  // ===== INTRO =====
  if (boss.state === "INTRO") {

    // แสดงชื่อบอสครั้งเดียว
    if (boss.timer >= 900 && !boss.introDone) {
      boss.introDone = true;
      showPhaseTitle("EYE OF THE HOLLOW");
    }

    // จบ Intro
    if (boss.timer >= 3000) {
      enterTelegraph();
      appState = "playing";
    }

    return;
  }

  switch (boss.state) {
    case 'TELEGRAPH':
      if (boss.timer >= boss.currentBeat.telegraph) enterAttack();
      break;
    case 'ATTACK':
      boss.currentBeat.onAttackTick && boss.currentBeat.onAttackTick(boss.timer, dtS, boss, player);
      if (boss.timer >= boss.currentBeat.attackDuration) enterRecovery();
      break;
    case 'RECOVERY':
      if (boss.timer >= boss.currentBeat.recovery) advanceBeat();
      break;
    case 'PHASE_TRANSITION':
      if (boss.timer >= PHASE_TRANSITION_MS) {
        boss.phaseIndex++; boss.cycle = 0; boss.beatIndex = 0;
        furthestPhase = Math.max(furthestPhase, boss.phaseIndex + 1);
        setupBossDash(PHASES[boss.phaseIndex].beats[0]);
        enterTelegraph();
      }
      break;
  }
}

function bossProgress() {
  // 0..1 overall
  const phaseFrac = boss.state === 'PHASE_TRANSITION' ? 1 :
    (boss.cycle + (boss.beatIndex / (PHASES[boss.phaseIndex].beats.length))) / PHASES[boss.phaseIndex].cycles;
  return { phaseIndex: boss.phaseIndex, phaseFrac: clamp(phaseFrac, 0, 1) };
}


function drawBoss() {
  const r = boss.r;
  ctx.save();
  let drawX = boss.x;
  let drawY = boss.y;
  let alpha = 1;

  if (boss.state === "INTRO") {

    const p = easeOutCubic(
      clamp(boss.timer / 1200, 0, 1)
    );

    drawY = boss.y - 80 + (80 * p);
    alpha = p;
  }

  ctx.translate(drawX, drawY);
  ctx.globalAlpha = alpha;

  // ===== INTRO EFFECT =====
  let introScale = 1;
  let introAlpha = 1;

  if (boss.state === "INTRO") {

    const p = clamp(boss.timer / 1000, 0, 1);

    introScale = 0.15 + easeOutCubic(p) * 0.85;
    introAlpha = p;
  }

  // outer glow ring
  ctx.save();
  ctx.globalAlpha = 0.5 * alpha;
  ctx.strokeStyle = boss.eyeColor; ctx.lineWidth = 2;
  ctx.shadowBlur = 30 * alpha;
  ctx.shadowColor = boss.eyeColor;
  ctx.beginPath(); ctx.arc(0, 0, r + 10, 0, Math.PI * 2); ctx.stroke();
  ctx.restore();

  // iris body
  const g = ctx.createRadialGradient(-r * 0.25, -r * 0.25, 4, 0, 0, r);
  g.addColorStop(0, shadeColor(boss.eyeColor, 40));
  g.addColorStop(0.55, boss.eyeColor);
  g.addColorStop(1, '#1a1330');
  ctx.fillStyle = g;
  ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.fill();

  // pupil
  ctx.fillStyle = '#0a0714';
  ctx.beginPath(); ctx.arc(boss.pupilX, boss.pupilY, r * 0.36, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,.75)';
  ctx.beginPath(); ctx.arc(boss.pupilX - r * 0.1, boss.pupilY - r * 0.1, r * 0.09, 0, Math.PI * 2); ctx.fill();

  ctx.restore();

  // telegraph fx (world space, not eye-local)
  if (boss.state === 'TELEGRAPH' && boss.currentBeat && boss.currentBeat.drawTelegraph) {
    const p = easeOutCubic(clamp(boss.timer / boss.currentBeat.telegraph, 0, 1));
    boss.currentBeat.drawTelegraph(ctx, boss, p);
  }

  // defeat effect
  if (boss.state === 'DEFEATED') {
    const t = clamp(boss.timer / DEFEAT_MS, 0, 1);
    ctx.save();
    ctx.globalAlpha = 1 - t;
    ctx.translate(boss.x, boss.y);
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.shadowBlur = 20; ctx.shadowColor = '#fff';
    ctx.beginPath(); ctx.arc(0, 0, r * (1 + t * 0.6), 0, Math.PI * 2); ctx.stroke();
    ctx.restore();
  }
}

function shadeColor(hex, amt) {
  const num = parseInt(hex.slice(1), 16);
  let r = (num >> 16) + amt, g = ((num >> 8) & 0xff) + amt, b = (num & 0xff) + amt;
  r = clamp(r, 0, 255) | 0; g = clamp(g, 0, 255) | 0; b = clamp(b, 0, 255) | 0;
  return '#' + (1 << 24 | r << 16 | g << 8 | b).toString(16).slice(1);
}

function lerpColor(a, b, t) {

  const ar = parseInt(a.substr(1, 2), 16);
  const ag = parseInt(a.substr(3, 2), 16);
  const ab = parseInt(a.substr(5, 2), 16);

  const br = parseInt(b.substr(1, 2), 16);
  const bg = parseInt(b.substr(3, 2), 16);
  const bb = parseInt(b.substr(5, 2), 16);

  const rr = Math.round(lerp(ar, br, t));
  const rg = Math.round(lerp(ag, bg, t));
  const rb = Math.round(lerp(ab, bb, t));

  return "#" +
    rr.toString(16).padStart(2, "0") +
    rg.toString(16).padStart(2, "0") +
    rb.toString(16).padStart(2, "0");
}
