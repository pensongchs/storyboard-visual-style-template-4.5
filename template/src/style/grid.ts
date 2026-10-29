// 5.0 网格系统（纯数据，无 React 依赖，可被检查脚本直接 import）
export const CANVAS = {w: 1920, h: 1080, fps: 30};
export const SAFE = {
  left: 96,            // 左边距
  right: 1632,         // 内容右边界（右侧 288px ≈15% 留给抖音按钮）
  subtitleTop: 900,    // 底部 180px 字幕区
};
export const GRID = {cols: 12, gutter: 24, colW: 106, step: 130}; // step = colW + gutter
export const ROWS = {
  kickerY: 56, kickerH: 36,   // 栏目行
  titleY: 100, titleH: 100,   // 标题行
  contentTop: 248,            // 内容区顶（距标题文字 ≥48）
  contentBottom: 880,         // 内容区底（距字幕区 20px）
};
export const CONTENT_H = ROWS.contentBottom - ROWS.contentTop; // 632
export const MG_GAP = 48;
export type Rect = {x: number; y: number; w: number; h: number};
/** 第 c 列起（0 起），跨 n 列 */
export const cols = (c: number, n: number) => ({x: SAFE.left + c * GRID.step, w: n * GRID.step - GRID.gutter});
/** 在 [y, y+H] 内按比例/等分切行；默认行距 = MG_GAP(48)，同组内细行可传 24 */
export const splitRows = (y: number, H: number, parts: number[], gap: number = MG_GAP): {y: number; h: number}[] => {
  const total = parts.reduce((a, b) => a + b, 0);
  const free = H - gap * (parts.length - 1);
  let cur = y; const out: {y: number; h: number}[] = [];
  parts.forEach((p, i) => {
    const h = i === parts.length - 1 ? y + H - cur : Math.round((free * p) / total);
    out.push({y: cur, h}); cur += h + gap;
  });
  return out;
};
export const rect = (c: number, n: number, r: {y: number; h: number}): Rect => ({...cols(c, n), ...r});
export const FULL = {y: ROWS.contentTop, h: CONTENT_H};
