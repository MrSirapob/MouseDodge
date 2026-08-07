/* ============================================================
   main-loop.js
   requestAnimationFrame loop หลัก: update ทุกระบบตามลำดับ แล้ว render()
============================================================ */

function frame(ts) {
  requestAnimationFrame(frame);
  if (!lastTime) lastTime = ts;
  let dtReal = ts - lastTime;
  lastTime = ts;
  dtReal = Math.min(dtReal, 34);
  gridOffsetX += dtReal * 0.010;
  gridOffsetY += dtReal * 0.006;

  if (appState === 'playing_bossmode') {
    if (shakeTime > 0) { shakeTime = Math.max(0, shakeTime - dtReal); }
    updateBossMode(dtReal);
    renderBossMode();
    return;
  }

  const timeScale = (appState === 'playing' && player.skillActive && player.skillType === 'slowmo') ? SLOWMO_SCALE : 1;
  const dtS = dtReal * timeScale;

  if (
    appState === 'playing' ||
    appState === 'intro' ||
    appState === 'dying'
  ) {

    updatePlayer(dtReal);
    updateBoss(dtS);

    if (appState === 'playing') {
      updateBullets(dtS);
      updateLasers(dtS);
    }

    updateParticles(dtS);
    updateSlashes(dtS);
    updateHud();
    if (appState === "dying") {

      deathTimer += dtReal;

      deathFade = clamp(
        (deathTimer - 800) / 600,
        0,
        1
      );

      if (deathTimer >= DEATH_DURATION) {
        triggerGameOver();
      }
    }

  } else if (appState !== 'menu' && appState !== 'howto') {
    updateParticles(dtReal * 0.6);
  }

  if (shakeTime > 0) { shakeTime = Math.max(0, shakeTime - dtReal); }

  render();
}

function render() {
  ctx.save();
  if (shakeTime > 0) {
    const k = shakeTime / Math.max(shakeTotal, 1);
    const mag = shakeMag * k;
    ctx.translate(rand(-mag, mag), rand(-mag, mag));
  }
  drawArena();
  drawParticles();
  if (
    appState === "playing" ||
    appState === "paused" ||
    appState === "intro" ||
    appState === "dying"
  ) {
    drawBullets();
    drawLasers();
    drawSlashes();
    drawBoss();
    drawPlayer();
  }
  ctx.restore();

  if (deathFade > 0) {
    ctx.save();
    ctx.globalAlpha = deathFade;
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, W, H);
    ctx.restore();
  }

  if (vignetteGrad) {
    ctx.fillStyle = vignetteGrad;
    ctx.fillRect(0, 0, W, H);
  }
}
