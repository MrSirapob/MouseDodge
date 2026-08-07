"use strict";

/* ============================================================
   setup.js
   แคนวาส, ขนาดจอ, arena bounds — เรียก resize() เมื่อ resize จอ
============================================================ */

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
let W = 0, H = 0, DPR = Math.min(window.devicePixelRatio || 1, 2);
let arena = { left: 0, top: 0, right: 0, bottom: 0 };
let touchOffsetY = 0;
let vignetteGrad = null;
let gridOffsetX = 0;
let gridOffsetY = 0;
let arenaGridColor = "#8f7bff";

function resize() {
  W = window.innerWidth; H = window.innerHeight;
  touchOffsetY = Math.min(120, H * 0.12);
  canvas.width = W * DPR; canvas.height = H * DPR;
  canvas.style.width = W + 'px'; canvas.style.height = H + 'px';
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  arena.left = 0;
  arena.right = W;
  arena.top = 0;
  arena.bottom = H;
  boss.homeX = W / 2;
  vignetteGrad = ctx.createRadialGradient(W / 2, H * 0.55, H * 0.15, W / 2, H * 0.55, H * 0.75);
  vignetteGrad.addColorStop(0, 'rgba(0,0,0,0)');
  vignetteGrad.addColorStop(1, 'rgba(0,0,0,0.55)');
}
window.addEventListener('resize', resize);
