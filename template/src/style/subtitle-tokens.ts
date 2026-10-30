import {CANVAS} from './grid.ts';
// 字幕设计令牌（纯 TS，check-layout 也会读取）
/** 字幕设计参数（check-layout 会检查字号范围 38–46、单行 ≤18 字、水平居中） */
export const SUB = {
  size: 42, maxChars: 18, bottom: 44, centerX: CANVAS.w / 2, // 画面水平中心
  color: '#F4EEE4', dim: 0.72, hi: '#F3D79E',
  pill: 'rgba(18,17,16,0.38)', border: 'rgba(243,215,158,0.14)',
  fadeIn: 5, rise: 8, fadeOut: 4, holdGapMs: 600,
};
