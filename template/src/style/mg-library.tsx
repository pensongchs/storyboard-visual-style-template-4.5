// 新 MG 动画库。和旧的时间轴、圆环、横条、数字滚动不是同一类结构。
import React from 'react';
import {useCurrentFrame} from 'remotion';
import type {Rect} from './grid.ts';
import {COLOR, FONT} from './tokens';
import type {MgId} from './mg-catalog.ts';

const lin = (f: number, start: number, dur: number) => {
  const p = (f - start) / dur;
  return p < 0 ? 0 : p > 1 ? 1 : p;
};

const Plate: React.FC<{r: Rect; children: React.ReactNode}> = ({r, children}) => (
  <div style={{position: 'absolute', left: r.x, top: r.y, width: r.w, height: r.h, borderRadius: 22, overflow: 'hidden',
    background: 'linear-gradient(165deg, rgba(36,30,24,0.95), rgba(14,12,10,0.93))',
    border: '1px solid rgba(243,215,158,0.4)', boxShadow: '0 16px 36px rgba(0,0,0,0.35)', boxSizing: 'border-box'}}>
    {children}
  </div>
);

const cap: React.CSSProperties = {fontFamily: FONT.body, fontWeight: 700, fontSize: 28, color: COLOR.goldHi, letterSpacing: 1};

/** 翻牌计数：每一位从 0 滚到目标数字，不是整段数字一起变 */
export const MgFlipCount: React.FC<{r: Rect; start?: number; text?: string; unit?: string; label?: string}> = ({r, start = 0, text = '30.6', unit = '万', label = '首付款约'}) => {
  const f = useCurrentFrame();
  const chars = [...text];
  const digitH = Math.min(120, Math.max(72, r.h * 0.28));
  return <Plate r={r}>
    <div style={{position: 'absolute', left: 36, top: 28, ...cap}}>{label}</div>
    <div style={{position: 'absolute', left: 36, right: 36, top: r.h * 0.38, display: 'flex', alignItems: 'flex-end', gap: 8}}>
      {chars.map((ch, i) => {
        const p = lin(f, start + i * 5, 28);
        if (ch < '0' || ch > '9') return <div key={i} style={{fontFamily: FONT.num, fontSize: digitH * 0.72, color: COLOR.goldHi, lineHeight: 1, paddingBottom: 8}}>{ch}</div>;
        const digit = +ch;
        const y = -p * digit * digitH;
        return <div key={i} style={{width: digitH * 0.72, height: digitH, overflow: 'hidden', borderRadius: 12, background: 'rgba(0,0,0,0.35)', border: '1px solid rgba(243,215,158,0.28)'}}>
          <div style={{transform: `translateY(${y}px)`}}>
            {Array.from({length: 10}, (_, n) => <div key={n} style={{height: digitH, lineHeight: `${digitH}px`, textAlign: 'center', fontFamily: FONT.num, fontSize: digitH * 0.7, color: COLOR.warm}}>{n}</div>)}
          </div>
        </div>;
      })}
      <div style={{fontFamily: FONT.title, fontSize: 42, color: COLOR.goldHi, marginLeft: 12, paddingBottom: 10}}>{unit}</div>
    </div>
  </Plate>;
};

/** 仪表盘：半圆刻度 + 指针，不是整圆环 */
export const MgGauge: React.FC<{r: Rect; start?: number; ratio?: number; label?: string; value?: string}> = ({r, start = 0, ratio = 0.7, label = '贷款占总价', value = '70%'}) => {
  const f = useCurrentFrame();
  const p = lin(f, start, 36);
  const shown = ratio * p;
  const w = r.w; const h = r.h;
  const cx = w / 2; const cy = h * 0.62;
  const rad = Math.min(w * 0.36, h * 0.42);
  const ang = Math.PI * (1 - shown);
  const nx = cx + Math.cos(ang) * (rad - 8);
  const ny = cy - Math.sin(ang) * (rad - 8);
  const ticks = Array.from({length: 7}, (_, i) => {
    const a = Math.PI * (1 - i / 6);
    return {x1: cx + Math.cos(a) * (rad - 16), y1: cy - Math.sin(a) * (rad - 16), x2: cx + Math.cos(a) * rad, y2: cy - Math.sin(a) * rad};
  });
  return <Plate r={r}>
    <svg width={w} height={h} style={{position: 'absolute', inset: 0}}>
      <path d={`M ${cx - rad} ${cy} A ${rad} ${rad} 0 0 1 ${cx + rad} ${cy}`} fill="none" stroke="rgba(255,255,255,0.14)" strokeWidth={14} strokeLinecap="round" pathLength={100} />
      <path d={`M ${cx - rad} ${cy} A ${rad} ${rad} 0 0 1 ${cx + rad} ${cy}`} fill="none" stroke="#D9B26F" strokeWidth={14} strokeLinecap="round" pathLength={100} strokeDasharray={100} strokeDashoffset={100 * (1 - shown)} />
      {ticks.map((t, i) => <line key={i} {...t} stroke="rgba(244,238,228,0.45)" strokeWidth={3} />)}
      <line x1={cx} y1={cy} x2={nx} y2={ny} stroke="#F3D79E" strokeWidth={6} strokeLinecap="round" />
      <circle cx={cx} cy={cy} r={8} fill="#F3D79E" />
    </svg>
    <div style={{position: 'absolute', left: 0, right: 0, top: cy + 18, textAlign: 'center', fontFamily: FONT.num, fontSize: 52, color: COLOR.warm}}>{p > 0.98 && value ? value : `${Math.round(shown * 100)}%`}</div>
    <div style={{position: 'absolute', left: 0, right: 0, top: 28, textAlign: 'center', ...cap}}>{label}</div>
  </Plate>;
};

const slotsOf = (r: Rect | undefined, n: number, rects?: Rect[]) => {
  if (rects?.length) return rects;
  const box = r ?? {x: 0, y: 0, w: 600, h: 400};
  const gap = 18;
  const w = (box.w - gap * (n - 1)) / n;
  return Array.from({length: n}, (_, i) => ({x: box.x + i * (w + gap), y: box.y, w, h: box.h}));
};

/** 柱状生长：多根柱子从基线长高，不是一根横条 */
export const MgBarChart: React.FC<{r?: Rect; rects?: Rect[]; start?: number; bars?: {k: string; n: number; unit: string}[]}> = ({r, rects, start = 0, bars}) => {
  const f = useCurrentFrame();
  const data = bars ?? [{k: '首付', n: 30.6, unit: '万'}, {k: '一年月供', n: 5.2, unit: '万'}, {k: '隐性', n: 17, unit: '万'}];
  const slots = slotsOf(r, data.length, rects);
  const max = Math.max(...data.map((b) => b.n)) * 1.2;
  return <>
    {data.map((b, i) => {
      const s = slots[i]; const p = lin(f, start + i * 6, 28);
      const track = Math.max(80, s.h - 150);
      const bh = track * (b.n / max) * p;
      return <Plate key={b.k} r={s}>
        <div style={{position: 'absolute', left: 20, right: 20, bottom: 24, top: 24, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', alignItems: 'center'}}>
          <div style={{fontFamily: FONT.num, fontSize: 36, color: COLOR.warm, marginBottom: 10}}>{p > 0.98 ? b.n : (b.n * p).toFixed(1)}{b.unit}</div>
          <div style={{width: '46%', height: track, display: 'flex', alignItems: 'flex-end', justifyContent: 'center'}}>
            <div style={{width: '100%', height: bh, borderRadius: 10, background: 'linear-gradient(180deg,#FBE6BC,#C99A52)', boxShadow: '0 0 18px rgba(217,178,111,0.35)'}} />
          </div>
          <div style={{marginTop: 14, ...cap}}>{b.k}</div>
        </div>
      </Plate>;
    })}
  </>;
};

/** 折线生长：折线按路径画出来，点在经过时点亮 */
export const MgLineChart: React.FC<{r: Rect; start?: number; label?: string; unit?: string; points?: {t: string; v: number}[]}> = ({r, start = 0, label = '单价走势', unit = '万/㎡', points}) => {
  const f = useCurrentFrame();
  const p = lin(f, start, 40);
  const pts = points ?? [{t: '看房', v: 0.92}, {t: '出价', v: 1.02}, {t: '议价', v: 1.12}, {t: '成交', v: 1.05}];
  const padL = 56; const padR = 36; const padT = 88; const padB = 64;
  const iw = r.w - padL - padR; const ih = r.h - padT - padB;
  const min = Math.min(...pts.map((d) => d.v)) * 0.9;
  const max = Math.max(...pts.map((d) => d.v)) * 1.08;
  const xy = pts.map((d, i) => ({
    x: padL + (iw * i) / (pts.length - 1),
    y: padT + ih * (1 - (d.v - min) / (max - min)),
    ...d,
  }));
  const d = xy.map((q, i) => `${i ? 'L' : 'M'}${q.x} ${q.y}`).join(' ');
  return <Plate r={r}>
    <div style={{position: 'absolute', left: 28, top: 24, ...cap}}>{label} · {unit}</div>
    <svg width={r.w} height={r.h} style={{position: 'absolute', inset: 0}}>
      <path d={d} fill="none" stroke="#F3D79E" strokeWidth={4} strokeLinejoin="round" strokeLinecap="round" pathLength={100} strokeDasharray={100} strokeDashoffset={100 * (1 - p)} />
      {xy.map((q, i) => <circle key={q.t} cx={q.x} cy={q.y} r={p >= i / (pts.length - 1) ? 7 : 0} fill="#FBE6BC" />)}
    </svg>
    {xy.map((q) => <div key={q.t} style={{position: 'absolute', left: q.x - 36, top: r.h - 48, width: 72, textAlign: 'center', fontFamily: FONT.body, fontWeight: 700, fontSize: 28, color: COLOR.sub}}>{q.t}</div>)}
    {xy.map((q, i) => p >= i / (pts.length - 1) ? <div key={q.v + q.t} style={{position: 'absolute', left: q.x - 40, top: q.y - 40, width: 80, textAlign: 'center', fontFamily: FONT.num, fontSize: 28, color: COLOR.warm}}>{q.v}</div> : null)}
  </Plate>;
};

/** 区位连线：标记落下，波纹散开，再把点连起来 */
export const MgPinMap: React.FC<{r: Rect; start?: number; pins?: {x: number; y: number; t: string}[]}> = ({r, start = 0, pins}) => {
  const f = useCurrentFrame();
  const pts = pins ?? [{x: 0.28, y: 0.62, t: '地铁'}, {x: 0.52, y: 0.4, t: '小区'}, {x: 0.76, y: 0.58, t: '学校'}];
  const P = pts.map((q) => ({...q, px: 48 + q.x * (r.w - 96), py: 70 + q.y * (r.h - 140)}));
  const drop = lin(f, start, 16);
  const ring = lin(f, start + 10, 18);
  const link = lin(f, start + 18, 22);
  const d = P.map((q, i) => `${i ? 'L' : 'M'}${q.px} ${q.py}`).join(' ');
  return <Plate r={r}>
    <div style={{position: 'absolute', left: 28, top: 22, ...cap}}>区位示意</div>
    <svg width={r.w} height={r.h} style={{position: 'absolute', inset: 0}}>
      <rect x={48} y={78} width={r.w - 96} height={r.h - 150} rx={16} fill="rgba(255,255,255,0.03)" stroke="rgba(255,255,255,0.08)" />
      <path d={d} fill="none" stroke="#D9B26F" strokeWidth={3} pathLength={100} strokeDasharray={100} strokeDashoffset={100 * (1 - link)} />
      {P.map((q) => <g key={q.t}>
        <circle cx={q.px} cy={q.py} r={10 + ring * 26} fill="none" stroke="rgba(243,215,158,0.7)" strokeWidth={2} opacity={1 - ring * 0.65} />
        <circle cx={q.px} cy={q.py + (1 - drop) * 28} r={8} fill="#F3D79E" />
      </g>)}
    </svg>
    {P.map((q) => <div key={q.t} style={{position: 'absolute', left: q.px - 36, top: q.py + 16, width: 72, textAlign: 'center', opacity: drop, fontFamily: FONT.body, fontWeight: 700, fontSize: 28, color: COLOR.warm}}>{q.t}</div>)}
  </Plate>;
};

/** 户型描线：墙线按笔顺描出，房间名随后出现 */
export const MgFloorPlan: React.FC<{r: Rect; start?: number}> = ({r, start = 0}) => {
  const f = useCurrentFrame();
  const wall = lin(f, start, 32);
  const name = lin(f, start + 24, 14);
  const pad = 36;
  const x0 = pad; const y0 = 72; const x1 = r.w - pad; const y1 = r.h - pad;
  const mx = (x0 + x1) / 2; const my = (y0 + y1) / 2;
  const rooms = [
    {t: '客厅', x: (x0 + mx) / 2, y: (y0 + my) / 2},
    {t: '主卧', x: (mx + x1) / 2, y: (y0 + my) / 2},
    {t: '厨房', x: (x0 + mx) / 2, y: (my + y1) / 2},
    {t: '卫生间', x: (mx + x1) / 2, y: (my + y1) / 2},
  ];
  return <Plate r={r}>
    <div style={{position: 'absolute', left: 28, top: 22, ...cap}}>户型示意</div>
    <svg width={r.w} height={r.h} style={{position: 'absolute', inset: 0}}>
      <path d={`M ${x0} ${y0} H ${x1} V ${y1} H ${x0} Z M ${mx} ${y0} V ${y1} M ${x0} ${my} H ${x1}`} fill="none" stroke="#F3D79E" strokeWidth={3} pathLength={100} strokeDasharray={100} strokeDashoffset={100 * (1 - wall)} />
      <rect x={x0} y={y0} width={mx - x0} height={my - y0} fill="rgba(217,178,111,0.16)" opacity={name} />
    </svg>
    {rooms.map((q) => <div key={q.t} style={{position: 'absolute', left: q.x - 48, top: q.y - 16, width: 96, textAlign: 'center', opacity: name, fontFamily: FONT.body, fontWeight: 700, fontSize: 28, color: COLOR.warm}}>{q.t}</div>)}
  </Plate>;
};

/** 对勾对照：一边把对勾描出来，另一边把叉号描出来 */
export const MgCheckCross: React.FC<{r: Rect; start?: number; yes?: {t: string; s: string}; no?: {t: string; s: string}}> = ({r, start = 0, yes, no}) => {
  const f = useCurrentFrame();
  const a = lin(f, start, 18);
  const b = lin(f, start + 16, 18);
  const L = yes ?? {t: '签前问清', s: '契税与装修'};
  const R = no ?? {t: '先别漏算', s: '物业和车位'};
  const col = (title: string, sub: string, p: number, kind: 'ok' | 'no', x: number) => (
    <div style={{position: 'absolute', left: x, top: 28, width: (r.w - 72) / 2, bottom: 28, borderRadius: 18, background: 'rgba(0,0,0,0.28)', border: `1px solid ${kind === 'ok' ? 'rgba(141,184,154,0.45)' : 'rgba(224,113,92,0.5)'}`}}>
      <svg width="120" height="88" style={{display: 'block', margin: '28px auto 8px'}}>
        {kind === 'ok'
          ? <path d="M16 48 L42 72 L104 16" fill="none" stroke="#8DB89A" strokeWidth={8} strokeLinecap="round" strokeLinejoin="round" pathLength={100} strokeDasharray={100} strokeDashoffset={100 * (1 - p)} />
          : <path d="M20 16 L100 72 M100 16 L20 72" fill="none" stroke="#E0715C" strokeWidth={8} strokeLinecap="round" pathLength={100} strokeDasharray={100} strokeDashoffset={100 * (1 - p)} />}
      </svg>
      <div style={{textAlign: 'center', fontFamily: FONT.title, fontSize: 36, color: COLOR.warm}}>{title}</div>
      <div style={{textAlign: 'center', marginTop: 12, fontFamily: FONT.body, fontWeight: 700, fontSize: 28, lineHeight: 1.35, color: COLOR.sub}}>{sub}</div>
    </div>
  );
  return <Plate r={r}>
    {col(L.t, L.s, a, 'ok', 24)}
    {col(R.t, R.s, b, 'no', r.w / 2 + 12)}
  </Plate>;
};

/** 逐字高亮：句子一个字一个字出现，当前字是沙金，带光标 */
export const MgTypeLine: React.FC<{r: Rect; start?: number; text?: string; label?: string}> = ({r, start = 0, text = '三笔账算清再出手', label = '一句记住'}) => {
  const f = useCurrentFrame();
  const chars = [...text];
  const p = lin(f, start, Math.max(40, chars.length * 3));
  const n = Math.min(chars.length, Math.floor(p * chars.length + 0.001));
  const caret = n < chars.length && Math.floor(f / 8) % 2 === 0;
  return <Plate r={r}>
    <div style={{position: 'absolute', left: 36, top: 28, ...cap}}>{label}</div>
    <div style={{position: 'absolute', left: 36, right: 36, top: r.h * 0.38, fontFamily: FONT.title, fontSize: Math.min(72, r.h * 0.28), lineHeight: 1.35, color: COLOR.warm}}>
      {chars.map((ch, i) => <span key={i} style={{color: i === n - 1 ? COLOR.goldHi : COLOR.warm, opacity: i < n ? 1 : 0}}>{ch}</span>)}
      <span style={{display: 'inline-block', width: 3, height: '0.8em', marginLeft: 6, background: COLOR.goldHi, opacity: caret ? 1 : 0, verticalAlign: 'middle'}} />
    </div>
  </Plate>;
};

export const MgSlot: React.FC<{id: MgId | string; r?: Rect; rects?: Rect[]; start?: number; spec?: Record<string, unknown>}> = ({id, r, rects, start = 0, spec}) => {
  const box = r ?? rects?.[0] ?? {x: 0, y: 0, w: 640, h: 420};
  const s = spec ?? {};
  if (id === 'flipCount') return <MgFlipCount r={box} start={start} text={s.text as string} unit={s.unit as string} label={s.label as string} />;
  if (id === 'gauge') return <MgGauge r={box} start={start} ratio={s.ratio as number} label={s.label as string} value={s.value as string} />;
  if (id === 'barChart') return <MgBarChart r={r} rects={rects} start={start} bars={s.bars as {k: string; n: number; unit: string}[]} />;
  if (id === 'lineChart') return <MgLineChart r={box} start={start} label={s.label as string} unit={s.unit as string} points={s.points as {t: string; v: number}[]} />;
  if (id === 'pinMap') return <MgPinMap r={box} start={start} pins={s.pins as {x: number; y: number; t: string}[]} />;
  if (id === 'floorPlan') return <MgFloorPlan r={box} start={start} />;
  if (id === 'checkCross') return <MgCheckCross r={box} start={start} yes={s.yes as {t: string; s: string}} no={s.no as {t: string; s: string}} />;
  if (id === 'typeLine') return <MgTypeLine r={box} start={start} text={s.text as string} label={s.label as string} />;
  return null;
};
