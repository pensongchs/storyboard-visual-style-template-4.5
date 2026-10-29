// 音画同步：把字幕时间码换算成每镜起止帧与动效锚点（纯函数，Remotion 与 check 脚本共用）
import type {Shot} from '../style/types.ts';
export const FPS = 30;
/** 毫秒 → 帧：F(ms) = ceil(ms × 30 / 1000) */
export const F = (ms: number) => Math.ceil((ms * FPS) / 1000);
/** 最后一镜在音频结束后再留的帧数（让片尾停稳） */
export const TAIL = 15;
export type Cue = {i: number; startMs: number; endMs: number; text: string; cs: number[]};
export type SubTok = {t: string; s: number | null; e: number | null};
export type Episode = {name: string; audio: string; audioMs: number; hasWords: boolean; cues: Cue[];
  subs: {startMs: number; endMs: number; lines: SubTok[][]}[]; clips: Record<string, number>};
export type Item = {s: Shot; i: number; from: number; d: number; startMs: number; anchors: Record<string, number>; cueRange: [number, number]};

const norm = (t: string) => t.replace(/\s/g, '');
/** 在 [fromMs, toMs) 内找某个词第一次被说出的时刻 */
export const findText = (ep: Episode, text: string, fromMs = 0, toMs = Infinity): number | null => {
  const q = norm(text);
  for (const c of ep.cues) {
    if (c.endMs <= fromMs || c.startMs >= toMs) continue;
    const k = norm(c.text).indexOf(q);
    if (k >= 0 && (c.cs[k] ?? c.startMs) >= fromMs - 50) return c.cs[k] ?? c.startMs;
  }
  return null;
};
const startOf = (ep: Episode, s: Shot, prevMs: number): number | null => {
  const a = s.at; if (!a) return null;
  if (a.ms != null) return a.ms;
  if (a.cue != null) return ep.cues[a.cue - 1]?.startMs ?? null;
  if (a.text != null) return findText(ep, a.text, prevMs + 1);
  return null;
};
export const buildTimeline = (shots: Shot[], ep: Episode) => {
  const errors: string[] = []; const starts: number[] = []; let prev = -1;
  shots.forEach((s, i) => {
    let ms = i === 0 ? 0 : startOf(ep, s, prev);
    if (ms == null) { errors.push(`${s.id}: at ${JSON.stringify(s.at)} 在字幕里找不到`); ms = prev + 1000; }
    starts.push(ms); prev = ms;
  });
  const total = F(ep.audioMs) + TAIL;
  const items: Item[] = shots.map((s, i) => {
    const from = i === 0 ? 0 : F(starts[i]);
    const end = i < shots.length - 1 ? F(starts[i + 1]) : total;
    const endMs = i < shots.length - 1 ? starts[i + 1] : Infinity;
    const anchors: Record<string, number> = {};
    for (const [k, v] of Object.entries(s.anchors ?? {})) {
      const ms = typeof v === 'number' ? ep.cues[v - 1]?.startMs ?? null : findText(ep, v, starts[i], endMs);
      if (ms == null) errors.push(`${s.id}: 锚点 ${k}='${v}' 不在本镜口播范围内`);
      else anchors[k] = F(ms) - from;
    }
    const inShot = ep.cues.filter((c) => c.startMs >= starts[i] - 1 && c.startMs < endMs).map((c) => c.i);
    return {s, i, from, d: end - from, startMs: starts[i], anchors, cueRange: [inShot[0] ?? -1, inShot[inShot.length - 1] ?? -1]};
  });
  return {items, total, errors};
};
