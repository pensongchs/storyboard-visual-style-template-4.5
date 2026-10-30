import type {LayoutName} from './layouts.ts';
export type Media = {src: string; video?: boolean; label?: string; tag?: string; trim?: number};
export type ChipT = {t: string; tone?: 'gold' | 'glass' | 'coral' | 'green'};
export type Num = {label: string; value: number; dec?: number; sep?: boolean; unit: string; chip?: ChipT; ratio?: number};
export type Shot = {
  id: string; layout: LayoutName;
  /** 本镜从哪句口播开始：cue=字幕序号(1 起) / text=句中文字 / ms=毫秒。第一镜固定从 0 开始 */
  at?: {cue?: number; text?: string; ms?: number};
  /** 动效锚点：键 → 口播里的词（如 '30.6'）或字幕序号。元素在说到这个词时到位 */
  anchors?: Record<string, string | number>;
  /** 旧版固定秒数，仅在没有 at 时兜底（不推荐） */
  sec?: number; kicker?: string; title?: string;
  /** 可选城市名。只在填写时显示为栏目行前缀（如「杭州 · 第一笔账」）；模板默认不写城市 */
  city?: string;
  /** 本镜主动画名。相邻镜不得相同，一期至少 6 种（check-layout 会查） */
  motion?: string;
  /** 新动画库里的样式 id，见 mg-catalog.ts。同一种一期最多 2 次，相邻镜不能相同 */
  mg?: string;
  mgSpec?: Record<string, unknown>;
  bg: Media & {blur?: number; dark?: number};
  data: any;
};
/** 片尾数据：character 可选，默认无角色，按文案排版 */
export type OutroData = {
  eyebrow?: string; line: string; cta?: string; account?: string; character?: string;
};
