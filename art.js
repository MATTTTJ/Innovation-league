// PROTOTYPE - NOT FOR PRODUCTION
// Question: 지원서만 보고 고른 기업을 조달 카드로 키워 순위전에서 살아남게 하는 판단이 12턴 동안 재미있는가?
// Date: 2026-11-13
// 그림: 제품 14종과 카드 25종은 Codex 이미지 생성으로 만든 PNG(assets/prod, assets/card)를 쓴다.
// 배지·육각형 같은 도표는 여기서 SVG로 그린다. 이모지·폰트 기호는 쓰지 않는다.
'use strict';

const INK = '#24324a';

/** 제품 그림: assets/prod/<key>.png (투명 배경) */
function productArt(key, cls = 'art') { return `<img class="${cls} img-art" src="assets/prod/${key}.png" alt="" draggable="false">`; }

// ---- 카드 그림 25종: 분야 색 배경 위에 assets/card/<key>.png ----
const KIND_COLOR = {
  cert: '#3b5bdb', trial: '#d9480f', sales: '#2b8a3e', rnd: '#7048e8',
  consult: '#0c8599', stock: '#a87b00', pr: '#c2255c', all: '#495057',
};
function cardArt(key, kind) {
  const bg = KIND_COLOR[kind] || '#495057';
  return `<div class="card-art" style="background:radial-gradient(ellipse at 50% 40%, #ffffff 0%, ${bg}59 100%)"><img src="assets/card/${key}.png" alt="" draggable="false"></div>`;
}

// 작은 배지 그림 (텍스트와 함께 쓰는 인장 모양)
function badgeIcon(key) {
  const c = { innov: '#3b5bdb', excel: '#f08c00', gpass: '#0b7285', venture: '#2b8a3e', nominee: '#d6336c' }[key] || '#495057';
  return `<svg class="badge-ico" viewBox="0 0 20 20" aria-hidden="true"><path d="M10 1 L12.5 4 L16.5 3.5 L16 7.5 L19 10 L16 12.5 L16.5 16.5 L12.5 16 L10 19 L7.5 16 L3.5 16.5 L4 12.5 L1 10 L4 7.5 L3.5 3.5 L7.5 4 Z" fill="${c}"/><path d="M6.5 10 L9 12.5 L13.5 7.5" fill="none" stroke="#fff" stroke-width="2"/></svg>`;
}

// ---- 육각형 능력치 ----
// 이름표는 꼭짓점 바깥에 둔다: 위·아래 꼭짓점은 위·아래로, 옆 꼭짓점은 바깥쪽으로 밀어 육각형과 겹치지 않게 한다.
// 이름표가 들어갈 자리만큼 viewBox를 가로로 더 넓게 잡고, 화면 크기는 너비(size) 기준으로 맞춘다.
function hexagon(stats, opts = {}) {
  const size = opts.size || 120, labels = opts.labels !== false, color = opts.color || '#2a6f97';
  const padX = labels ? 64 : 6, padY = labels ? 28 : 6, R = 50, W = 100 + padX * 2, H = 100 + padY * 2;
  const pt = (i, r) => {
    const a = -Math.PI / 2 + i * Math.PI / 3;
    return [50 + padX + Math.cos(a) * r, 50 + padY + Math.sin(a) * r];
  };
  let g = '';
  for (const lvl of [0.25, 0.5, 0.75, 1]) {
    g += `<polygon points="${STATS.map((_, i) => pt(i, R * lvl).join(',')).join(' ')}" fill="${lvl === 1 ? '#f1f3f5' : 'none'}" stroke="#ced4da" stroke-width="1"/>`;
  }
  STATS.forEach((_, i) => { const [x, y] = pt(i, R); g += `<line x1="${50 + padX}" y1="${50 + padY}" x2="${x}" y2="${y}" stroke="#dee2e6" stroke-width="1"/>`; });
  if (opts.prev) {
    g += `<polygon points="${STATS.map((s, i) => pt(i, R * Math.min(1, opts.prev[s.key] / 100)).join(',')).join(' ')}" fill="none" stroke="#adb5bd" stroke-width="1.5" stroke-dasharray="3 3"/>`;
  }
  g += `<polygon points="${STATS.map((s, i) => pt(i, R * Math.min(1, stats[s.key] / 100)).join(',')).join(' ')}" fill="${color}" fill-opacity="0.35" stroke="${color}" stroke-width="2.5" stroke-linejoin="round"/>`;
  if (labels) {
    STATS.forEach((s, i) => {
      const [vx, vy] = pt(i, R);
      const core = opts.core && opts.core.includes(s.key);
      const fill = core ? '#c2255c' : '#495057', wt = core ? 800 : 600;
      let x = vx, y1, y2, anchor = 'middle';
      if (i === 0) { y1 = vy - 22; y2 = vy - 7; }                       // 위 꼭짓점: 이름·값을 위로
      else if (i === 3) { y1 = vy + 16; y2 = vy + 31; }                 // 아래 꼭짓점: 아래로
      else { x = vx + (i < 3 ? 8 : -8); anchor = i < 3 ? 'start' : 'end'; y1 = vy - 2; y2 = vy + 13; } // 옆 꼭짓점: 바깥쪽으로
      if (i === 0 || i === 3) { // 위·아래는 이름과 값을 한 줄에
        g += `<text x="${x}" y="${i === 0 ? vy - 9 : vy + 20}" text-anchor="middle" font-size="10.5" font-weight="${wt}" fill="${fill}">${s.name} <tspan font-weight="800" fill="${INK}">${Math.round(stats[s.key])}</tspan></text>`;
        return;
      }
      g += `<text x="${x}" y="${y1}" text-anchor="${anchor}" font-size="10.5" font-weight="${wt}" fill="${fill}">${s.name}</text>`;
      g += `<text x="${x}" y="${y2}" text-anchor="${anchor}" font-size="11" font-weight="800" fill="${INK}">${Math.round(stats[s.key])}</text>`;
    });
  }
  return `<svg class="hex" viewBox="0 0 ${W} ${H}" style="width:${size}px;height:${(size * H / W).toFixed(0)}px" aria-hidden="true">${g}</svg>`;
}
