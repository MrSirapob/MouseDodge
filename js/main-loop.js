/* ============================================================
   main-loop.js
   requestAnimationFrame loop หลัก: dispatch update/render ตาม gameMode
============================================================ */

function frame(ts) {
  requestAnimationFrame(frame);
  if (!lastTime) lastTime = ts;
  let dtReal = ts - lastTime;
  lastTime = ts;
  dtReal = Math.min(dtReal, 34);
  gridOffsetX += dtReal * 0.010;
  gridOffsetY += dtReal * 0.006;

  const timeScale = (
    appState === 'playing' &&
    player.skillActive &&
    player.skillType === 'slowmo' &&
    isModeClassic()
  ) ? SLOWMO_SCALE : 1;
  const dtS = dtReal * timeScale;

  /* ---- UPDATE ---- */
  if (isModeClassic()) {
    _updateClassic(dtReal, dtS);
  } else if (isModeBossAI()) {
    _updateBossAI(dtReal);
  } else if (isModePvp()) {
    _updatePvp(dtReal);
  }

  // Particles ทุกโหมด (รวม menu/gameover)
  if (appState !== 'menu' && appState !== 'howto') {
    if (appState === 'playing' || appState === 'intro' || appState === 'dying') {
      // อัปเดตแล้วใน _update* ด้านบน
    } else {
      updateParticles(dtReal * 0.6);
    }
  }

  if (shakeTime > 0) { shakeTime = Math.max(0, shakeTime - dtReal); }

  render();
}

/* ---- Classic Mode Update ---- */
function _updateClassic(dtReal, dtS) {
  if (appState === 'playing' || appState === 'intro' || appState === 'dying') {
    updatePlayer(dtReal);
    updateBoss(dtS);
    if (appState === 'playing') {
      updateBullets(dtS);
      updateLasers(dtS);
    }
    updateParticles(dtS);
    updateSlashes(dtS);
    updateHud();

    if (appState === 'dying') {
      deathTimer += dtReal;
      deathFade = clamp((deathTimer - 800) / 600, 0, 1);
      if (deathTimer >= DEATH_DURATION) triggerGameOver();
    }
  }
}

/* ---- Boss vs AI Mode Update ---- */
function _updateBossAI(dtReal) {
  if (appState !== 'playing') return;

  // Countdown timer
  bossAITimer -= dtReal;
  if (bossAITimer <= 0) {
    bossAITimer = 0;
    triggerModeVictory('hero'); // หมดเวลา → Hero AI รอดได้ → Boss แพ้
    return;
  }

  updateBossPlayer(dtReal);
  updateAiHero(dtReal);
  updateBullets(dtReal);
  updateLasers(dtReal);
  updateParticles(dtReal);
  updateSlashes(dtReal);
  updateHudBossAI();
}

/* ---- PvP Mode Update ---- */
function _updatePvp(dtReal) {
  if (appState !== 'playing') return;

  updatePlayer(dtReal);
  updateBossPlayer(dtReal);
  updateBullets(dtReal);
  updateLasers(dtReal);
  updateParticles(dtReal);
  updateSlashes(dtReal);
  updateHudPvp();

  // Hero ชีวิตหมดใน pvp → Boss ชนะ
  if (player.lives <= 0) {
    triggerModeVictory('boss');
  }
}

/* ============================================================
   RENDER
============================================================ */
function render() {
  ctx.save();
  if (shakeTime > 0) {
    const k = shakeTime / Math.max(shakeTotal, 1);
    const mag = shakeMag * k;
    ctx.translate(rand(-mag, mag), rand(-mag, mag));
  }

  drawArena();
  drawParticles();

  const shouldDrawGame =
    appState === 'playing' ||
    appState === 'paused'  ||
    appState === 'intro'   ||
    appState === 'dying';

  if (shouldDrawGame) {
    drawBullets();
    drawLasers();
    drawSlashes();

    if (isModeClassic()) {
      // Classic: AI Boss + Player Hero
      drawBoss();
      drawPlayer();
    } else if (isModeBossAI()) {
      // BossAI: Player Boss + AI Hero
      drawBossPlayer();
      drawAiHero();
    } else if (isModePvp()) {
      // PvP: Player Boss (P2) + Player Hero (P1)
      drawBossPlayer();
      drawPlayer();
    }
  }

  ctx.restore();

  // Death fade (classic)
  if (deathFade > 0 && isModeClassic()) {
    ctx.save();
    ctx.globalAlpha = deathFade;
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, W, H);
    ctx.restore();
  }

  if (vignetteGrad) {
    ctx.fillStyle = vignetteGrad;
    ctx.fillRect(0, 0, W, H);
  }
}
