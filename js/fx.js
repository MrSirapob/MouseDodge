/* ============================================================
   fx.js
   เอฟเฟกต์หน้าจอ: flash แดง/ทอง, ข้อความชื่อเฟส/บอส
============================================================ */

function flashRed() {
  const el = document.getElementById('flash');
  el.style.transition = 'none'; el.style.opacity = '0.55';
  requestAnimationFrame(() => { el.style.transition = 'opacity .5s'; el.style.opacity = '0'; });
}

function flashWhite() {
  const el = document.getElementById('flash');
  el.style.transition = 'none';
  el.style.background = '#fff3b0';
  el.style.opacity = '0.18';
  requestAnimationFrame(() => {
    el.style.transition = 'opacity .22s';
    el.style.opacity = '0';
    setTimeout(() => { el.style.background = 'var(--danger)'; }, 220);
  });
}

function showPhaseTitle(text) {

  const el = document.getElementById("phase-title");
  const veil = document.getElementById("intro-veil");

  el.textContent = text;

  el.style.transition = "none";
  el.style.opacity = "0";
  el.style.transform = "translate(-50%, -46%) scale(.95)";

  veil.style.opacity = ".45";

  requestAnimationFrame(() => {

    el.style.transition =
      "opacity .7s ease, transform .7s ease";

    el.style.opacity = "1";
    el.style.transform =
      "translate(-50%, -50%) scale(1)";

    setTimeout(() => {

      el.style.transition =
        "opacity .8s ease, transform .8s ease";

      el.style.opacity = "0";
      el.style.transform =
        "translate(-50%, -54%) scale(1.03)";

      veil.style.opacity = "0";

    }, 1400);

  });

}
