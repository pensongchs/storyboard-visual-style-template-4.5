export const COLOR = {
  ink: '#121110', graphite: '#1d1b19', warm: '#F4EEE4', sub: 'rgba(244,238,228,0.78)',
  gold: '#D9B26F', goldHi: '#F3D79E', goldDeep: '#9C7536', coral: '#E0715C', green: '#8DB89A', pearlInk: '#1d1b19',
};
export const FONT = {title: 'PuHui', body: 'Health', num: "ArialB, Arial, 'Helvetica Neue', Helvetica, sans-serif"};
/** 字号 px @1920×1080。手机可读底线：正文 ≥34，标签/胶囊 ≥26（检查脚本强制） */
export const TYPE = {
  kicker: 30, title: 80, heroTitle: 92, number: 150, quote: 60, rowTitle: 40, body: 34, label: 28, chip: 28, ringValue: 52,
};
export const MIN_FONT = {any: 26, body: 34};
/** 排版规则（检查脚本强制） */
export const RULE = {
  mgGap: 48,        // 独立 MG 组之间最小间距
  fillMax: 0.75,    // 文字宽 / 容器宽 上限
  lineHeight: 1.3,  // 多行文字最小行高倍数
};
export const RADIUS = {card: 26, frame: 24, chip: 999, badge: 0.3};
export const MOTION = { // 帧 @30fps
  enter: 20, stagger: 6, chip: 14, count: 30, focus: 10, freeze: 30, maxShift: 36,
};
