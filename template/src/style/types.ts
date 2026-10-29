import type {LayoutName} from './layouts.ts';
export type Media = {src: string; video?: boolean; label?: string; tag?: string; trim?: number};
export type ChipT = {t: string; tone?: 'gold' | 'glass' | 'coral' | 'green'};
export type Num = {label: string; value: number; dec?: number; sep?: boolean; unit: string; chip?: ChipT; ratio?: number};
export type Shot = {
  id: string; layout: LayoutName; sec: number; kicker?: string; title?: string;
  /** 可选城市名。只在填写时显示为栏目行前缀（如「杭州 · 第一笔账」）；模板默认不写城市 */
  city?: string;
  bg: Media & {blur?: number; dark?: number};
  data: any;
};
/** 片尾数据：character 可选，默认无角色，按文案排版 */
export type OutroData = {
  eyebrow?: string; line: string; cta?: string; account?: string; character?: string;
};
