// scripts/build_comprehensive_pictionary.js
import fs from 'fs';
import path from 'path';

// Geometric stroke helper functions
function circle(cx, cy, r, n = 14) {
  const pts = [];
  for (let i = 0; i <= n; i++) {
    const a = (i / n) * Math.PI * 2;
    pts.push([Math.round((cx + r * Math.cos(a)) * 10) / 10, Math.round((cy + r * Math.sin(a)) * 10) / 10]);
  }
  return pts;
}

function ellipse(cx, cy, rx, ry, n = 14) {
  const pts = [];
  for (let i = 0; i <= n; i++) {
    const a = (i / n) * Math.PI * 2;
    pts.push([Math.round((cx + rx * Math.cos(a)) * 10) / 10, Math.round((cy + ry * Math.sin(a)) * 10) / 10]);
  }
  return pts;
}

function arc(cx, cy, r, startA, endA, n = 10) {
  const pts = [];
  for (let i = 0; i <= n; i++) {
    const a = startA + (i / n) * (endA - startA);
    pts.push([Math.round((cx + r * Math.cos(a)) * 10) / 10, Math.round((cy + r * Math.sin(a)) * 10) / 10]);
  }
  return pts;
}

function rect(x, y, w, h) {
  return [[x, y], [x + w, y], [x + w, y + h], [x, y + h], [x, y]];
}

function tri(x1, y1, x2, y2, x3, y3) {
  return [[x1, y1], [x2, y2], [x3, y3], [x1, y1]];
}

function star(cx, cy, r1, r2, p = 5) {
  const pts = [];
  for (let i = 0; i <= p * 2; i++) {
    const a = (i / (p * 2)) * Math.PI * 2 - Math.PI / 2;
    const r = i % 2 === 0 ? r1 : r2;
    pts.push([Math.round((cx + r * Math.cos(a)) * 10) / 10, Math.round((cy + r * Math.sin(a)) * 10) / 10]);
  }
  return pts;
}

function line(x1, y1, x2, y2) {
  return [[x1, y1], [x2, y2]];
}

export { circle, ellipse, arc, rect, tri, star, line };
