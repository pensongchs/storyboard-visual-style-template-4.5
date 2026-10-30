// 字幕：底部 180px 字幕安全区内水平居中，单行优先；磨砂浅底 + 暖白字 + 当前词沙金色（卡拉 OK）
import React from 'react';
import {useCurrentFrame, interpolate, Easing, getInputProps, delayRender, continueRender} from 'remotion';
import {FONT} from './tokens';
import {SAFE} from './grid';
import type {Episode} from '../sync/timeline.ts';
import {F} from '../sync/timeline.ts';

import {SUB} from './subtitle-tokens.ts';
export {SUB};
export type SubOpts = {show?: boolean; highlight?: boolean};

export const Subtitles: React.FC<{ep: Episode; opts: SubOpts}> = ({ep, opts}) => {
  const f = useCurrentFrame(); const ms = (f * 1000) / 30; const ref = React.useRef<HTMLDivElement>(null);
  const check = !!(getInputProps() as any)?.check;
  const [h] = React.useState(() => (check ? delayRender('subcheck') : null));
  React.useEffect(() => { if (h == null) return; (async () => {
    await (document as any).fonts.ready; await new Promise((r) => setTimeout(r, 300));
    const el = ref.current;
    if (!el) console.log(`SUBCHECK|${f}|null`);
    else { const r = el.getBoundingClientRect(); const ls = el.querySelectorAll('[data-sub="line"]');
      const fs = parseFloat(getComputedStyle(ls[0] as Element).fontSize);
      const over = [...ls].some((l) => (l as HTMLElement).scrollWidth > (l as HTMLElement).clientWidth + 1);
      const ink = [...ls].map((l) => { const range = document.createRange(); range.selectNodeContents(l); const b = range.getBoundingClientRect(); return Math.round((b.x + b.width / 2) * 10) / 10; });
      console.log(`SUBCHECK|${f}|${JSON.stringify({x: r.x, y: r.y, w: r.width, h: r.height, fs, lines: ls.length, over, ink})}`); }
    continueRender(h); })(); }, [h]);
  if (opts.show === false) return null;
  const list = ep.subs;
  const idx = list.findIndex((c, k) => { const next = list[k + 1];
    const end = next && next.startMs - c.endMs < SUB.holdGapMs ? next.startMs : c.endMs + 120; return ms >= c.startMs && ms < end; });
  if (idx < 0) return null;
  const c = list[idx]; const next = list[idx + 1];
  const a = F(c.startMs); const held = next && next.startMs - c.endMs < SUB.holdGapMs; const z = held ? F(next.startMs) : F(c.endMs + 120);
  const pIn = interpolate(f, [a, a + SUB.fadeIn], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic)});
  const pOut = held ? 1 : interpolate(f, [z - SUB.fadeOut, z], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const hiOn = opts.highlight !== false && ep.hasWords;
  return <div ref={ref} data-sub="box" style={{position: 'absolute', left: SUB.centerX, bottom: SUB.bottom, transform: `translate(-50%, ${(1 - pIn) * SUB.rise}px)`,
    opacity: pIn * pOut, padding: '10px 28px 12px', borderRadius: 16, background: SUB.pill, border: `1px solid ${SUB.border}`,
    backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)', boxShadow: '0 8px 24px rgba(0,0,0,0.18)', whiteSpace: 'nowrap', textAlign: 'center'}}>
    {c.lines.map((line, li) => <div key={li} data-sub="line" style={{fontFamily: FONT.body, fontWeight: 700, fontSize: SUB.size, lineHeight: 1.32, letterSpacing: 1.5,
      color: SUB.color, textShadow: '0 2px 10px rgba(0,0,0,0.45)'}}>
      {line.map((t, k) => {
        if (!hiOn || t.s == null || t.e == null) return <span key={k}>{t.t}</span>;
        const now = ms >= t.s && ms < Math.max(t.e, t.s + 120); const past = ms >= t.e;
        const u = now ? Math.min(1, (ms - t.s) / Math.max(80, t.e - t.s)) : past ? 1 : 0;
        return <span key={k} style={{position: 'relative', display: 'inline-block', color: now ? SUB.hi : SUB.color, opacity: now || past ? 1 : SUB.dim}}>
          {t.t}
          {now && <span style={{position: 'absolute', left: 0, bottom: -2, height: 3, borderRadius: 2, width: `${u * 100}%`, background: SUB.hi, opacity: 0.85}} />}
        </span>;
      })}
    </div>)}
  </div>;
};
export const SUB_TOP = SAFE.subtitleTop;
