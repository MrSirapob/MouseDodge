/* ============================================================
   boss-mode.js
   Logic for Play as Boss Mode
   - AI Player evasion physics & skills
   - Boss user controls (mouse lerp)
   - Skills cooldowns & activation
   - Boss HUD updating
============================================================ */

let bossmodeTimer = 60; // 60 seconds limit
let bossmodeCooldowns = [0, 0, 0, 0, 0];
let bossmodeActiveAttacks = [];
let aiVx = 0, aiVy = 0; // AI Player velocity

function showBossModeHud() {
  SCREENS.forEach(s => document.getElementById('screen-' + s).classList.remove('active'));
  document.getElementById('hud').classList.remove('active');
  document.getElementById('bossmode-hud').classList.add('active');
}

function hideBossModeHud() {
  document.getElementById('bossmode-hud').classList.remove('active');
}

function startBossMode() {
  isBossMode = true;
  appState = 'playing_bossmode';
  bullets = [];
  lasers = [];
  particles = [];
  trail = [];
  slashes = [];
  bossmodeActiveAttacks = [];
  bossmodeCooldowns = [0, 0, 0, 0, 0];
  bossmodeTimer = 60;

  // Set up Boss starting state
  boss.x = W / 2;
  boss.y = BOSS_TOP_Y;
  boss.homeX = W / 2;
  boss.homeY = BOSS_TOP_Y;
  boss.baseY = BOSS_TOP_Y;
  boss.r = 64;
  boss.eyeColor = '#8f7bff';
  boss.bob = 0;
  boss.state = 'ATTACK'; // Keep it in active attack state to draw eye pupil and prevent cycle advancement

  // Set up AI Player
  player.lives = 5;
  player.x = W / 2;
  player.y = H * 0.75;
  player.invuln = false;
  player.invulnTimer = 0;
  player.skillActive = false;
  player.parrying = false;
  player.skillCooldown = 0;
  player.skillTimer = 0;
  player.skillType = 'parry';
  aiVx = 0;
  aiVy = 0;

  // Set up AI Lives UI in HUD
  const livesDiv = document.getElementById('bossmode-ai-lives');
  if (livesDiv) {
    livesDiv.innerHTML = '';
    for (let i = 0; i < player.lives; i++) {
      const heart = document.createElement('span');
      heart.className = 'life';
      heart.textContent = '❤️';
      livesDiv.appendChild(heart);
    }
  }

  showBossModeHud();
}

function triggerBossSkill(skillIndex) {
  if (appState !== 'playing_bossmode') return;
  if (bossmodeCooldowns[skillIndex - 1] > 0) return;

  // Set Cooldowns
  const cooldowns = [1200, 2000, 4000, 3500, 6000];
  bossmodeCooldowns[skillIndex - 1] = cooldowns[skillIndex - 1];

  // Get Beat parameters
  let beat;
  switch (skillIndex) {
    case 1:
      beat = beatRingBurst({ count: 22, speed: 2.6, rings: 2, ringGap: 180, telegraph: 450, recovery: 100 });
      break;
    case 2:
      beat = beatAimedVolley({ count: 5, spacingMs: 160, speed: 4.8, telegraph: 550, recovery: 100 });
      break;
    case 3:
      beat = beatSpiralStream({ duration: 2500, rate: 45, speed: 3.0, arms: 4, rotSpeed: 0.085, telegraph: 450, recovery: 100 });
      break;
    case 4:
      beat = beatHomingOrbs({ count: 6, speed: 2.1, turnRate: 0.045, telegraph: 450, recovery: 100 });
      break;
    case 5:
      beat = beatLaserSweep({ sweepDuration: 950, arcSpan: 3.1, width: 24, telegraph: 650, recovery: 100 });
      break;
  }

  // Pre-calculations and active insertion
  beat.prep && beat.prep(boss, player);
  bossmodeActiveAttacks.push({
    skillIndex: skillIndex,
    beat: beat,
    state: 'telegraph',
    elapsed: 0,
    telegraphDuration: beat.telegraph
  });
}

function updateBossMode(dtReal) {
  // Timer countdown
  bossmodeTimer -= dtReal / 1000;
  if (bossmodeTimer <= 0) {
    bossmodeTimer = 0;
    triggerBossModeDefeat();
    return;
  }

  // Update cooldowns
  for (let i = 0; i < bossmodeCooldowns.length; i++) {
    if (bossmodeCooldowns[i] > 0) {
      bossmodeCooldowns[i] = Math.max(0, bossmodeCooldowns[i] - dtReal);
    }
  }

  // Boss movement (follow mouse with lerp)
  boss.bob += dtReal * 0.0022;
  boss.x = lerp(boss.x || W / 2, mouse.x, 0.075);
  boss.y = lerp(boss.y || BOSS_TOP_Y, mouse.y, 0.075);
  boss.baseY = boss.y; // Match baseY so drawBoss bobs around this Y

  // Look at player
  const pdx = player.x - boss.x, pdy = player.y - boss.y;
  const plen = Math.hypot(pdx, pdy) || 1;
  boss.pupilX = (pdx / plen) * 9;
  boss.pupilY = (pdy / plen) * 9;

  // Update active attacks
  let isTelegraphing = false;
  let activeEyeColor = '#8f7bff';
  for (let i = bossmodeActiveAttacks.length - 1; i >= 0; i--) {
    const att = bossmodeActiveAttacks[i];
    att.elapsed += dtReal;

    if (att.state === 'telegraph') {
      isTelegraphing = true;
      activeEyeColor = eyeColorFor(att.beat.telegraphKind);
      if (att.elapsed >= att.telegraphDuration) {
        att.state = 'attack';
        att.elapsed = 0;
        att.beat.onAttackStart && att.beat.onAttackStart(boss, player);
      }
    } else if (att.state === 'attack') {
      att.beat.onAttackTick && att.beat.onAttackTick(att.elapsed, dtReal, boss, player);
      if (att.elapsed >= att.beat.attackDuration) {
        bossmodeActiveAttacks.splice(i, 1);
      }
    }
  }
  boss.eyeColor = isTelegraphing ? activeEyeColor : '#8f7bff';

  // AI Player movement logic (Steering Behavior)
  let avoidForceX = 0, avoidForceY = 0;

  // 1. Avoid bullets
  for (const b of bullets) {
    if (b.justParried > 0) continue;
    const d = dist(player.x, player.y, b.x, b.y);
    if (d < 155) {
      const force = (155 - d) / 155;
      const angle = angleTo(b.x, b.y, player.x, player.y);
      avoidForceX += Math.cos(angle) * force * 15;
      avoidForceY += Math.sin(angle) * force * 15;

      // AI Parry
      if (d < 40 && !player.skillActive && player.skillCooldown === 0) {
        player.skillActive = true;
        player.skillTimer = 0;
        player.parrying = true;
        spawnParticles(player.x, player.y, '#ffe066', 12, [1, 3], [200, 350], [1.5, 3]);
      }
    }
  }

  // 2. Avoid lasers
  for (const l of lasers) {
    const px = player.x - l.ox, py = player.y - l.oy;
    const dirx = Math.cos(l.curAngle), diry = Math.sin(l.curAngle);
    const proj = px * dirx + py * diry;
    if (proj > 0) {
      const closestX = l.ox + dirx * proj, closestY = l.oy + diry * proj;
      const d = dist(player.x, player.y, closestX, closestY);
      if (d < 180) {
        const force = (180 - d) / 180;
        const angle = angleTo(closestX, closestY, player.x, player.y);
        avoidForceX += Math.cos(angle) * force * 25;
        avoidForceY += Math.sin(angle) * force * 25;
      }
    }
  }

  // 3. Avoid boss body
  const dToBoss = dist(player.x, player.y, boss.x, boss.y);
  if (dToBoss < 170) {
    const force = (170 - dToBoss) / 170;
    const angle = angleTo(boss.x, boss.y, player.x, player.y);
    avoidForceX += Math.cos(angle) * force * 8;
    avoidForceY += Math.sin(angle) * force * 8;
  }

  // 4. Center-seeking force (AI likes to stay bottom-middle)
  const targetX = W / 2;
  const targetY = H * 0.72;
  avoidForceX += (targetX - player.x) * 0.016;
  avoidForceY += (targetY - player.y) * 0.016;

  // Apply forces to velocity
  aiVx += avoidForceX * 0.22;
  aiVy += avoidForceY * 0.22;

  // Friction
  aiVx *= 0.84;
  aiVy *= 0.84;

  // Speed clamp
  const aiSpeed = Math.hypot(aiVx, aiVy);
  const maxSpeed = 7.5;
  if (aiSpeed > maxSpeed) {
    aiVx = (aiVx / aiSpeed) * maxSpeed;
    aiVy = (aiVy / aiSpeed) * maxSpeed;
  }

  // Move
  player.x += aiVx;
  player.y += aiVy;

  // Clamp within arena boundaries
  player.x = clamp(player.x, arena.left + player.r + 14, arena.right - player.r - 14);
  player.y = clamp(player.y, arena.top + player.r + 14, arena.bottom - player.r - 14);

  // Update AI trails & invulnerability & skill states
  trail.push({ x: player.x, y: player.y, life: 0 });
  if (trail.length > 10) trail.shift();
  trail.forEach(t => t.life += dtReal);

  if (player.invuln) {
    player.invulnTimer += dtReal;
    if (player.invulnTimer > 1100) player.invuln = false;
  }

  if (player.skillActive) {
    player.skillTimer += dtReal;
    const dur = PARRY_DURATION;
    if (player.skillTimer >= dur) {
      player.skillActive = false;
      player.parrying = false;
      player.skillCooldown = SKILL_COOLDOWN;
    }
  } else if (player.skillCooldown > 0) {
    player.skillCooldown = Math.max(0, player.skillCooldown - dtReal);
  }

  // Standard update loops
  updateBullets(dtReal);
  updateLasers(dtReal);
  updateParticles(dtReal);
  updateSlashes(dtReal);

  // Update HUD elements
  const timerEl = document.getElementById('bossmode-timer');
  if (timerEl) {
    timerEl.textContent = Math.ceil(bossmodeTimer);
  }

  // Sync AI Hearts UI
  const hearts = document.querySelectorAll('#bossmode-ai-lives .life');
  for (let i = 0; i < hearts.length; i++) {
    if (i >= player.lives) {
      hearts[i].classList.add('lost');
    } else {
      hearts[i].classList.remove('lost');
    }
  }

  // Update Skill UI buttons cooldown overlay
  for (let i = 1; i <= 5; i++) {
    const skillEl = document.getElementById('bskill-' + i);
    if (skillEl) {
      const cooldown = bossmodeCooldowns[i - 1];
      const cooldownTextEl = skillEl.querySelector('.boss-skill-cooldown');
      
      const isCasting = bossmodeActiveAttacks.some(att => att.skillIndex === i && att.state === 'telegraph');
      const isAttacking = bossmodeActiveAttacks.some(att => att.skillIndex === i && att.state === 'attack');
      
      if (isCasting) {
        skillEl.classList.add('casting');
        skillEl.classList.remove('on-cooldown');
        if (cooldownTextEl) cooldownTextEl.textContent = 'CASTING';
      } else if (isAttacking) {
        skillEl.classList.remove('casting');
        skillEl.classList.remove('on-cooldown');
        if (cooldownTextEl) cooldownTextEl.textContent = 'ACTIVE';
      } else if (cooldown > 0) {
        skillEl.classList.remove('casting');
        skillEl.classList.add('on-cooldown');
        if (cooldownTextEl) cooldownTextEl.textContent = (cooldown / 1000).toFixed(1) + 's';
      } else {
        skillEl.classList.remove('casting');
        skillEl.classList.remove('on-cooldown');
        if (cooldownTextEl) cooldownTextEl.textContent = 'READY';
      }
    }
  }
}

function renderBossMode() {
  ctx.save();
  if (shakeTime > 0) {
    const k = shakeTime / Math.max(shakeTotal, 1);
    const mag = shakeMag * k;
    ctx.translate(rand(-mag, mag), rand(-mag, mag));
  }
  drawArena();
  drawParticles();
  drawBullets();
  drawLasers();
  drawSlashes();

  // Draw active telegraphs
  for (const att of bossmodeActiveAttacks) {
    if (att.state === 'telegraph' && att.beat.drawTelegraph) {
      const p = easeOutCubic(clamp(att.elapsed / att.telegraphDuration, 0, 1));
      att.beat.drawTelegraph(ctx, boss, p);
    }
  }

  drawBoss();
  drawPlayer();
  ctx.restore();

  if (vignetteGrad) {
    ctx.fillStyle = vignetteGrad;
    ctx.fillRect(0, 0, W, H);
  }
}

function triggerBossModeVictory() {
  appState = 'victory';
  hideBossModeHud();
  document.getElementById('victory-sub').textContent = 'บอสเป็นฝ่ายชนะ! คุณสามารถจัดการ AI ผู้ท้าชิงลงได้สำเร็จ';
  showScreen('victory');
}

function triggerBossModeDefeat() {
  appState = 'gameover';
  hideBossModeHud();
  document.getElementById('gameover-quote').textContent = 'เวลาหมดลงแล้ว...';
  document.getElementById('gameover-sub').textContent = 'AI ผู้ท้าชิงรอดชีวิตจากการโจมตีของคุณ บอสเป็นฝ่ายพ่ายแพ้!';
  showScreen('gameover');
}
