import React from 'react';
import {AbsoluteFill, Freeze, Img, OffthreadVideo, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import type {Rect} from './grid.ts';
import {COLOR, FONT, MIN_FONT, MOTION, RADIUS, TYPE} from './tokens';

export const Fonts: React.FC = () => (
  <style>{`
    @font-face{font-family:'PuHui';src:url('${staticFile('fonts/AlibabaPuHuiTi-Black.woff2')}') format('woff2');font-weight:900}
    @font-face{font-family:'Health';src:url('${staticFile('fonts/AlibabaHealthFont2.0CN-85B.ttf')}') format('truetype');font-weight:700}
    @font-face{font-family:'Health';src:url('${staticFile('fonts/AlibabaHealthFont2.0CN-45R.ttf')}') format('truetype');font-weight:400}
    @font-face{font-family:'ArialB';src:local('Arial Bold'),local('Arial-BoldMT'),url('${staticFile('fonts/Style40-Arial-Bold.ttf')}') format('truetype');font-weight:700}
  `}</style>
);

export const prog = (f: number, start: number, dur: number = MOTION.enter) =>
  interpolate(f, [start, start + dur], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});

const ease = (p: number) => 1 - Math.pow(1 - p, 3);

export type Tone = 'dark' | 'pearl' | 'gold' | 'coral' | 'ghost';
export type Enter = 'up' | 'left' | 'right' | 'scale' | 'fade' | 'blur' | 'none';

const enterStyle = (from: Enter, p: number): React.CSSProperties => {
  const e = ease(p);
  switch (from) {
    case 'up': return {opacity: e, transform: `translateY(${(1 - e) * MOTION.maxShift}px)`};
    case 'left': return {opacity: e, transform: `translateX(${(1 - e) * -MOTION.maxShift}px)`};
    case 'right': return {opacity: e, transform: `translateX(${(1 - e) * MOTION.maxShift}px)`};
    case 'scale': return {opacity: e, transform: `scale(${0.94 + 0.06 * e})`};
    case 'blur': return {opacity: e, filter: `blur(${(1 - e) * 8}px)`, transform: `translateY(${(1 - e) * 12}px)`};
    case 'fade': return {opacity: e};
    default: return {opacity: 1};
  }
};

const toneBg: Record<Tone, React.CSSProperties> = {
  dark: {background: 'linear-gradient(160deg, rgba(36,33,30,0.82), rgba(18,17,16,0.78))', color: COLOR.warm, border: '1px solid rgba(255,255,255,0.14)',
    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.18), 0 18px 40px rgba(0,0,0,0.45)'},
  pearl: {background: 'linear-gradient(160deg, rgba(250,246,238,0.94), rgba(232,224,210,0.9))', color: COLOR.pearlInk, border: '1px solid rgba(255,255,255,0.7)',
    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.9), 0 18px 40px rgba(0,0,0,0.35)'},
  gold: {background: 'linear-gradient(160deg, rgba(80,60,28,0.88), rgba(36,28,14,0.86))', color: COLOR.warm, border: '1px solid rgba(243,215,158,0.55)',
    boxShadow: 'inset 0 1px 0 rgba(255,240,210,0.35), 0 0 36px rgba(217,178,111,0.28), 0 18px 40px rgba(0,0,0,0.45)'},
  coral: {background: 'linear-gradient(160deg, rgba(120,42,32,0.9), rgba(56,22,18,0.88))', color: '#FFE3DB', border: '1px solid rgba(224,113,92,0.7)',
    boxShadow: 'inset 0 1px 0 rgba(255,200,180,0.25), 0 0 28px rgba(224,113,92,0.35), 0 18px 40px rgba(0,0,0,0.45)'},
  ghost: {background: 'rgba(255,255,255,0.04)', color: COLOR.warm, border: '1px solid rgba(255,255,255,0.08)', boxShadow: 'none'},
};

/** 玻璃卡（少用；全屏不要堆满） */
export const GlassCard: React.FC<{r: Rect; start: number; tone?: Tone; from?: Enter; dim?: number; radius?: number; pad?: number | string; children: React.ReactNode; style?: React.CSSProperties}> =
({r, start, tone = 'dark', from = 'up', dim = 1, radius = RADIUS.card, pad = 36, children, style}) => {
  const f = useCurrentFrame(); const p = prog(f, start);
  return <div style={{position: 'absolute', left: r.x, top: r.y, width: r.w, height: r.h, borderRadius: radius, backdropFilter: tone === 'ghost' ? undefined : 'blur(18px)',
    WebkitBackdropFilter: tone === 'ghost' ? undefined : 'blur(18px)', padding: pad, boxSizing: 'border-box', display: 'flex', flexDirection: 'column',
    opacity: dim, ...toneBg[tone], ...enterStyle(from, p), ...style}}>{children}</div>;
};

/** 真实帧上下文：镜头末尾定格时，前景冻结，但视频（背景/媒体框）继续播放，避免「顿一下」 */
export const LiveFrameCtx = React.createContext<number | null>(null);
/** 素材比镜头短时的慢放倍率（0.75–1），由 Demo 按镜头时长与素材时长计算 */
export const ClipRateCtx = React.createContext<Record<string, number>>({});
export const LiveVideo: React.FC<{src: string; style: React.CSSProperties; trimStart?: number}> = ({src, style, trimStart = 0}) => {
  const live = React.useContext(LiveFrameCtx); const rate = React.useContext(ClipRateCtx)[src] ?? 1;
  const v = <OffthreadVideo src={staticFile(src)} style={style} muted playbackRate={rate} startFrom={Math.round(trimStart * 30)} />;
  return live == null ? v : <Freeze frame={live}>{v}</Freeze>;
};

/** 媒体框：描边在内侧 */
export const MediaFrame: React.FC<{r: Rect; start: number; src: string; video?: boolean; label?: string; tag?: string; trimStart?: number; from?: Enter; fit?: 'cover' | 'contain'; soft?: boolean}> =
({r, start, src, video, label, tag, trimStart = 0, from = 'scale', fit = 'cover', soft}) => {
  const f = useCurrentFrame(); const p = prog(f, start); const B = soft ? 0 : 8;
  return <div style={{position: 'absolute', left: r.x, top: r.y, width: r.w, height: r.h, borderRadius: RADIUS.frame, overflow: 'hidden',
    border: soft ? 'none' : '1px solid rgba(255,255,255,0.22)', boxShadow: soft ? '0 20px 50px rgba(0,0,0,0.4)' : 'inset 0 0 0 1px rgba(255,255,255,0.08), 0 18px 40px rgba(0,0,0,0.4)',
    ...enterStyle(from, p)}}>
    <div style={{position: 'absolute', inset: B, borderRadius: RADIUS.frame - 4, overflow: 'hidden'}}>
      {video
        ? <LiveVideo src={src} style={{width: '100%', height: '100%', objectFit: fit}} trimStart={trimStart} />
        : <Img src={staticFile(src)} style={{width: '100%', height: '100%', objectFit: fit}} />}
    </div>
    {tag && <div data-fit="tag" style={{position: 'absolute', top: 20, right: 20, padding: '8px 30px', borderRadius: 999, fontFamily: FONT.body, fontWeight: 700, fontSize: TYPE.chip,
      background: 'linear-gradient(135deg,#F3D79E,#C99A52)', color: '#2a2012'}}>{tag}</div>}
    {label && <div style={{position: 'absolute', left: 24, bottom: 22, display: 'flex', alignItems: 'center', gap: 12}}>
      <div style={{width: 4, height: 28, background: COLOR.goldHi, borderRadius: 2}} />
      <span style={{fontFamily: FONT.body, fontWeight: 700, fontSize: TYPE.label, color: COLOR.warm, textShadow: '0 2px 8px rgba(0,0,0,0.6)'}}>{label}</span>
    </div>}
  </div>;
};

export type ChipTone = 'gold' | 'glass' | 'coral' | 'green';
export const Chip: React.FC<{children: React.ReactNode; start: number; tone?: ChipTone; size?: number}> = ({children, start, tone = 'glass', size = TYPE.chip}) => {
  const f = useCurrentFrame(); const p = prog(f, start, MOTION.chip);
  const st: Record<ChipTone, React.CSSProperties> = {
    gold: {background: 'linear-gradient(135deg,#F3D79E,#C99A52)', color: '#2a2012', border: '1px solid rgba(255,240,210,0.9)'},
    glass: {background: 'rgba(255,255,255,0.10)', color: COLOR.warm, border: '1px solid rgba(255,255,255,0.28)'},
    coral: {background: 'rgba(224,113,92,0.22)', color: '#FFD3C8', border: '1px solid rgba(224,113,92,0.7)'},
    green: {background: 'rgba(141,184,154,0.2)', color: '#D3EEDC', border: '1px solid rgba(141,184,154,0.7)'},
  };
  return <div data-fit="chip" style={{display: 'inline-flex', alignItems: 'center', alignSelf: 'flex-start', flexShrink: 0, whiteSpace: 'nowrap', padding: `${Math.round(size * 0.42)}px ${Math.round(size * 1.3)}px`, borderRadius: 999,
    fontFamily: FONT.body, fontWeight: 700, fontSize: size, opacity: ease(p), transform: `translateY(${(1 - ease(p)) * 8}px)`,
    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.3), 0 8px 18px rgba(0,0,0,0.3)', ...st[tone]}}>{children}</div>;
};

export const Badge: React.FC<{children: React.ReactNode; size?: number; active?: boolean}> = ({children, size = 72, active = true}) => (
  <div style={{width: size, height: size, borderRadius: size * 0.3, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontFamily: FONT.num, fontSize: size * 0.38, color: active ? '#2a2012' : COLOR.warm,
    background: active ? 'radial-gradient(circle at 30% 25%, #FBE6BC, #D9B26F 55%, #9C7536)' : 'rgba(255,255,255,0.12)',
    boxShadow: active ? '0 0 22px rgba(217,178,111,0.55)' : 'none'}}>{children}</div>
);

export const Kicker: React.FC<{text: string}> = ({text}) => {
  const f = useCurrentFrame(); const p = prog(f, 0, 12);
  return <div style={{position: 'absolute', left: 96, top: 56, height: 36, display: 'flex', alignItems: 'center', gap: 14, opacity: ease(p)}}>
    <div style={{width: 28 * ease(p), height: 2, background: COLOR.goldHi}} />
    <span style={{fontFamily: FONT.body, fontWeight: 700, fontSize: TYPE.kicker, color: COLOR.warm, letterSpacing: 2}}>{text}</span>
  </div>;
};

export const GoldText: React.FC<{text: string}> = ({text}) => <>{text.split(/(\{[^}]+\})/).map((s, i) =>
  s.startsWith('{') ? <span key={i} style={{background: 'linear-gradient(180deg,#FBE6BC,#D9B26F 60%,#B48843)', WebkitBackgroundClip: 'text', color: 'transparent'}}>{s.slice(1, -1)}</span> : <span key={i}>{s}</span>)}</>;

export const Headline: React.FC<{text: string; start?: number}> = ({text, start = 2}) => {
  const f = useCurrentFrame(); const p = prog(f, start, 16);
  return <div style={{position: 'absolute', left: 96, top: 100, width: 1536, height: 100, display: 'flex', alignItems: 'center', opacity: ease(p), transform: `translateY(${(1 - ease(p)) * 16}px)`}}>
    <div style={{fontFamily: FONT.title, fontSize: TYPE.title, color: COLOR.warm, lineHeight: 1.15, whiteSpace: 'pre-line'}}><GoldText text={text} /></div>
  </div>;
};

export const Count: React.FC<{to: number; start: number; dec?: number; sep?: boolean}> = ({to, start, dec = 0, sep}) => {
  const f = useCurrentFrame(); const p = prog(f, start, MOTION.count); const v = to * ease(p);
  const raw = dec > 0 ? v.toFixed(dec) : Math.round(v).toString();
  const shown = sep ? raw.replace(/\B(?=(\d{3})+(?!\d))/g, ',') : raw;
  return <>{shown}</>;
};

export const Bar: React.FC<{ratio: number; start: number; hi?: boolean}> = ({ratio, start, hi}) => {
  const f = useCurrentFrame(); const p = prog(f, start, 22);
  return <div style={{height: 6, borderRadius: 3, background: 'rgba(255,255,255,0.12)', overflow: 'hidden', marginTop: 12}}>
    <div style={{height: '100%', width: `${ratio * 100 * ease(p)}%`, borderRadius: 3, background: hi ? 'linear-gradient(90deg,#F3D79E,#C99A52)' : 'rgba(255,255,255,0.45)'}} />
  </div>;
};

export const ExampleMark: React.FC = () => (
  <div style={{position: 'absolute', left: 1400, top: 56, width: 232, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'flex-end',
    fontFamily: FONT.body, fontSize: MIN_FONT.any, color: 'rgba(244,238,228,0.45)'}}>* 数据为示例</div>
);

/** 背景：整体提亮（亮度 ×1.1、压暗降约 0.15），文字可读性靠左上/底部的渐变压暗而非整屏压黑 */
export const Backdrop: React.FC<{src: string; video?: boolean; blur?: number; dark?: number; trimStart?: number}> = ({src, video, blur = 0, dark = 0.45, trimStart = 0}) => {
  const k = Math.max(0.22, dark - 0.16);
  // 静态图背景做缓慢推近（按真实帧，不受定格影响），避免静图镜头「停住」
  const cur = useCurrentFrame(); const live = React.useContext(LiveFrameCtx) ?? cur;
  const filter = `${blur ? `blur(${blur}px) ` : ''}brightness(1.1) saturate(1.05)`;
  return <AbsoluteFill>
    {video
      ? <LiveVideo src={src} style={{width: '100%', height: '100%', objectFit: 'cover', filter}} trimStart={trimStart} />
      : <Img src={staticFile(src)} style={{width: '100%', height: '100%', objectFit: 'cover', filter, transform: `scale(${1.02 + live * 0.0003})`}} />}
    <AbsoluteFill style={{background: `rgba(12,11,10,${k})`}} />
    <AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(12,11,10,0.38) 0%, rgba(12,11,10,0) 30%, rgba(12,11,10,0) 70%, rgba(12,11,10,0.32) 100%)'}} />
  </AbsoluteFill>;
};

/* ========== 新增 MG 元素（不全是卡片） ========== */

/** 下划线描画 */
export const UnderlineDraw: React.FC<{x: number; y: number; w: number; start: number; color?: string}> = ({x, y, w, start, color = COLOR.goldHi}) => {
  const f = useCurrentFrame(); const p = prog(f, start, 18);
  return <div style={{position: 'absolute', left: x, top: y, width: w * ease(p), height: 3, borderRadius: 2, background: `linear-gradient(90deg,${color},rgba(217,178,111,0))`}} />;
};

/** 无卡底的大数字 */
export const BareNumber: React.FC<{r: Rect; start: number; value: number; unit: string; dec?: number; sep?: boolean; label?: string; gold?: boolean; from?: Enter; size?: number; children?: React.ReactNode; flow?: boolean}> =
({r, start, value, unit, dec, sep, label, gold = true, from = 'up', size, children, flow}) => {
  const fs = size ?? Math.min(TYPE.number, Math.round(r.h * 0.42));
  const f = useCurrentFrame(); const p = prog(f, start);
  const pos: React.CSSProperties = flow ? {position: 'relative'} : {position: 'absolute', left: r.x, top: r.y, width: r.w, height: r.h};
  return <div style={{...pos, display: 'flex', flexDirection: 'column', justifyContent: 'center', ...enterStyle(from, p)}}>
    {label && <div style={{fontFamily: FONT.body, fontWeight: 700, fontSize: TYPE.body, color: COLOR.sub, marginBottom: 16}}>{label}</div>}
    <div style={{fontFamily: FONT.num, fontSize: fs, lineHeight: 1.05, whiteSpace: 'nowrap',
      ...(gold ? {background: 'linear-gradient(180deg,#FBE6BC,#D9B26F 55%,#9C7536)', WebkitBackgroundClip: 'text', color: 'transparent'} : {color: COLOR.warm})}}>
      <Count to={value} start={start + 4} dec={dec} sep={sep} />
      <span style={{fontFamily: FONT.title, fontSize: Math.max(TYPE.body, Math.round(fs * 0.36)), marginLeft: 14, color: gold ? COLOR.goldHi : COLOR.warm}}>{unit}</span>
    </div>
    {children && <div style={{marginTop: 32, display: 'flex', gap: 20}}>{children}</div>}
  </div>;
};

/** 浮动标签（轻量，无大卡） */
export const FloatLabel: React.FC<{r: Rect; start: number; text: string; tone?: ChipTone | 'plain'; from?: Enter}> = ({r, start, text, tone = 'glass', from = 'fade'}) => {
  const f = useCurrentFrame(); const p = prog(f, start, MOTION.chip);
  const bob = Math.sin((f - start) / 18) * 3;
  if (tone === 'plain') return <div style={{position: 'absolute', left: r.x, top: r.y + bob, width: r.w, height: r.h, display: 'flex', alignItems: 'center',
    fontFamily: FONT.body, fontWeight: 700, fontSize: TYPE.body, color: COLOR.warm, ...enterStyle(from, p)}}>{text}</div>;
  return <div style={{position: 'absolute', left: r.x, top: r.y + bob * 0.4, ...enterStyle(from, p)}}><Chip start={start} tone={tone as ChipTone}>{text}</Chip></div>;
};

/** 时间轴节点 */
export const Timeline: React.FC<{r: Rect; start: number; steps: {t: string; s: string; chip?: string}[]; active: number}> = ({r, start, steps, active}) => {
  const f = useCurrentFrame(); const n = steps.length; const gap = 48;
  const cw = (r.w - gap * (n - 1)) / n;
  return <div style={{position: 'absolute', left: r.x, top: r.y, width: r.w, height: r.h}}>
    {/* 连接线 */}
    <div style={{position: 'absolute', left: cw / 2, right: cw / 2, top: 36, height: 2, background: 'rgba(255,255,255,0.15)'}}>
      <div style={{height: '100%', width: `${Math.min(1, Math.max(0, (active + prog(f, start + 20, 40)) / (n - 1))) * 100}%`, background: 'linear-gradient(90deg,#D9B26F,#F3D79E)', transition: 'width 0.3s'}} />
    </div>
    {steps.map((st, i) => {
      const p = prog(f, start + i * MOTION.stagger, 18); const on = i === active; const done = i < active;
      const x = i * (cw + gap);
      return <div key={i} style={{position: 'absolute', left: x, top: 0, width: cw, height: r.h, display: 'flex', flexDirection: 'column', alignItems: 'center', opacity: ease(p), transform: `translateY(${(1 - ease(p)) * 20}px)`}}>
        <div style={{width: 28, height: 28, borderRadius: 14, marginTop: 22, background: on || done ? 'radial-gradient(circle at 30% 25%,#FBE6BC,#D9B26F)' : 'rgba(255,255,255,0.2)',
          boxShadow: on ? '0 0 22px rgba(217,178,111,0.7)' : 'none', border: on ? '2px solid #fff' : '2px solid transparent'}} />
        <div style={{marginTop: 32, fontFamily: FONT.title, fontSize: on ? 46 : 40, lineHeight: 1.3, color: on ? COLOR.goldHi : COLOR.warm, textAlign: 'center'}}>{st.t}</div>
        <div data-role="body" style={{marginTop: 14, fontFamily: FONT.body, fontSize: TYPE.body, color: COLOR.sub, textAlign: 'center', lineHeight: 1.4}}>{st.s}</div>
        {st.chip && <div style={{marginTop: 28}}><Chip start={start + 10 + i * 6} tone={on ? 'gold' : 'glass'}>{st.chip}</Chip></div>}
      </div>;
    })}
  </div>;
};

/** 图标+文字细行 */
export const IconRow: React.FC<{r: Rect; start: number; idx: string; title: string; sub: string; tip?: string; active?: boolean; from?: Enter}> =
({r, start, idx, title, sub, tip, active, from = 'right'}) => {
  const f = useCurrentFrame(); const p = prog(f, start);
  return <div style={{position: 'absolute', left: r.x, top: r.y, width: r.w, height: r.h, display: 'flex', alignItems: 'center', gap: 32, padding: '0 24px', boxSizing: 'border-box',
    borderBottom: '1px solid rgba(255,255,255,0.12)', ...enterStyle(from, p)}}>
    <div style={{fontFamily: FONT.num, fontSize: 40, color: active ? COLOR.goldHi : 'rgba(244,238,228,0.4)', width: 64, flexShrink: 0}}>{idx}</div>
    <div style={{flex: 1, minWidth: 0}}>
      <div style={{fontFamily: FONT.title, fontSize: TYPE.rowTitle, lineHeight: 1.3, color: active ? COLOR.goldHi : COLOR.warm}}>{title}</div>
      <div data-role="body" style={{fontFamily: FONT.body, fontSize: TYPE.body, lineHeight: 1.35, color: COLOR.sub, marginTop: 6}}>{sub}</div>
    </div>
    {tip && <div style={{flexShrink: 0}}><Chip start={start + 8} tone={active ? 'gold' : 'glass'}>{tip}</Chip></div>}
    {active && <div style={{position: 'absolute', left: 0, top: r.h - 2, width: `${100 * ease(prog(f, start + 4, 16))}%`, height: 2, background: COLOR.goldHi}} />}
  </div>;
};

/** 引用号 + 引文 */
export const QuoteBlock: React.FC<{r: Rect; start: number; text: string; sub?: string}> = ({r, start, text, sub}) => {
  const f = useCurrentFrame(); const p = prog(f, start);
  return <div style={{position: 'absolute', left: r.x, top: r.y, width: r.w, height: r.h, ...enterStyle('blur', p)}}>
    <div data-deco style={{fontFamily: FONT.title, fontSize: 120, lineHeight: 0.8, color: 'rgba(217,178,111,0.35)'}}>“</div>
    <div style={{fontFamily: FONT.title, fontSize: TYPE.quote, color: COLOR.warm, lineHeight: 1.35, marginTop: 0, whiteSpace: 'pre-line'}}><GoldText text={text} /></div>
    {sub && <div data-role="body" style={{fontFamily: FONT.body, fontSize: TYPE.body, lineHeight: 1.4, color: COLOR.sub, marginTop: 40}}>{sub}</div>}
  </div>;
};

/** 软发光提示条（比玻璃卡更轻） */
export const SoftCallout: React.FC<{r: Rect; start: number; text: string; tone?: 'gold' | 'coral'; icon?: string; h?: number}> = ({r, start, text, tone = 'gold', icon, h = 112}) => {
  const f = useCurrentFrame(); const p = prog(f, start, 16); const H = Math.min(h, r.h);
  // 宽度随文字收缩（左边贴栏线），内边距 56；文字宽 ≤ 容器 75%
  return <div data-fit="callout" style={{position: 'absolute', left: r.x, top: r.y + (r.h - H) / 2, maxWidth: r.w, height: H, display: 'inline-flex', alignItems: 'center', gap: 24, padding: '0 56px', boxSizing: 'border-box', whiteSpace: 'nowrap',
    borderRadius: 18, background: tone === 'coral' ? 'rgba(224,113,92,0.16)' : 'rgba(217,178,111,0.12)', border: `1px solid ${tone === 'coral' ? 'rgba(224,113,92,0.5)' : 'rgba(217,178,111,0.4)'}`,
    boxShadow: `0 0 40px ${tone === 'coral' ? 'rgba(224,113,92,0.2)' : 'rgba(217,178,111,0.18)'}`, ...enterStyle('scale', p)}}>
    <div style={{width: 52, height: 52, borderRadius: 26, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: FONT.num, fontSize: 28,
      color: tone === 'coral' ? '#fff' : '#2a2012', background: tone === 'coral' ? COLOR.coral : 'radial-gradient(circle at 30% 25%,#FBE6BC,#D9B26F)'}}>{icon ?? (tone === 'coral' ? '!' : '✓')}</div>
    <span data-fit-text style={{fontFamily: FONT.title, fontSize: 38, color: tone === 'coral' ? '#FFE3DB' : COLOR.warm}}><GoldText text={text} /></span>
  </div>;
};

/** 进度环 */
export const ProgressRing: React.FC<{cx: number; cy: number; size: number; start: number; ratio: number; label: string; value: string}> =
({cx, cy, size, start, ratio, label, value}) => {
  const f = useCurrentFrame(); const p = prog(f, start, 28); const r = (size - 10) / 2; const c = 2 * Math.PI * r; const dash = c * ratio * ease(p);
  return <div style={{position: 'absolute', left: cx - size / 2, top: cy - size / 2, width: size, height: size, opacity: ease(prog(f, start, 14))}}>
    <svg width={size} height={size} style={{transform: 'rotate(-90deg)'}}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth={8} />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#D9B26F" strokeWidth={8} strokeLinecap="round" strokeDasharray={`${dash} ${c}`} />
    </svg>
    <div style={{position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', transform: 'rotate(0)'}}>
      <div style={{fontFamily: FONT.num, fontSize: TYPE.ringValue, color: COLOR.goldHi, lineHeight: 1.2}}>{value}</div>
      <div style={{fontFamily: FONT.body, fontWeight: 700, fontSize: TYPE.label, color: COLOR.sub, marginTop: 8}}>{label}</div>
    </div>
  </div>;
};

/** 箭头连接 */
export const ArrowConnector: React.FC<{x: number; y: number; w: number; start: number}> = ({x, y, w, start}) => {
  const f = useCurrentFrame(); const p = prog(f, start, 16);
  return <div style={{position: 'absolute', left: x, top: y, width: w * ease(p), height: 2, background: 'linear-gradient(90deg,rgba(217,178,111,0.2),#D9B26F)', opacity: ease(p)}}>
    <div style={{position: 'absolute', right: -2, top: -6, width: 0, height: 0, borderLeft: '12px solid #D9B26F', borderTop: '7px solid transparent', borderBottom: '7px solid transparent'}} />
  </div>;
};

/** 高亮竖条 / 焦点条 */
export const HighlightBar: React.FC<{x: number; y: number; h: number; start: number}> = ({x, y, h, start}) => {
  const f = useCurrentFrame(); const p = prog(f, start, 14);
  return <div style={{position: 'absolute', left: x, top: y, width: 4, height: h * ease(p), borderRadius: 2, background: 'linear-gradient(180deg,#F3D79E,#9C7536)', boxShadow: '0 0 16px rgba(217,178,111,0.5)'}} />;
};

/** 分裂大标题（一行主标题 + 一行副） */
export const SplitType: React.FC<{r: Rect; start: number; line1: string; line2: string; sub?: string}> = ({r, start, line1, line2, sub}) => {
  const f = useCurrentFrame();
  return <div style={{position: 'absolute', left: r.x, top: r.y, width: r.w, height: r.h, display: 'flex', flexDirection: 'column', justifyContent: 'center'}}>
    <div style={{fontFamily: FONT.title, fontSize: TYPE.heroTitle, color: COLOR.warm, lineHeight: 1.3, opacity: ease(prog(f, start, 16)), transform: `translateY(${(1 - ease(prog(f, start, 16))) * 24}px)`}}>{line1}</div>
    <div style={{fontFamily: FONT.title, fontSize: TYPE.heroTitle, lineHeight: 1.3, marginTop: 0, opacity: ease(prog(f, start + 8, 16)), transform: `translateY(${(1 - ease(prog(f, start + 8, 16))) * 24}px)`,
      background: 'linear-gradient(180deg,#FBE6BC,#D9B26F 60%,#B48843)', WebkitBackgroundClip: 'text', color: 'transparent'}}>{line2}</div>
    <div style={{position: 'relative', marginTop: 28, height: 3}}>
      <UnderlineDraw x={0} y={0} w={Math.min(420, r.w * 0.55)} start={start + 20} />
    </div>
    {sub && <div data-role="body" style={{fontFamily: FONT.body, fontSize: TYPE.body, lineHeight: 1.4, color: COLOR.sub, marginTop: 48, opacity: ease(prog(f, start + 26, 14))}}>{sub}</div>}
  </div>;
};

/** 紧凑统计胶囊（小元素） */
export const StatPill: React.FC<{r: Rect; start: number; k: string; value: number; unit: string; dec?: number; sep?: boolean; s?: string; hi?: boolean}> =
({r, start, k, value, unit, dec, sep, s, hi}) => {
  const f = useCurrentFrame(); const p = prog(f, start);
  return <div data-fit="pill" style={{position: 'absolute', left: r.x, top: r.y, width: r.w, height: r.h, borderRadius: 22, padding: '40px 44px', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', justifyContent: 'center',
    background: hi ? 'linear-gradient(160deg, rgba(80,60,28,0.7), rgba(36,28,14,0.65))' : 'rgba(255,255,255,0.06)',
    border: hi ? '1px solid rgba(243,215,158,0.45)' : '1px solid rgba(255,255,255,0.12)', backdropFilter: 'blur(12px)', ...enterStyle('up', p)}}>
    <div style={{fontFamily: FONT.body, fontWeight: 700, fontSize: TYPE.label, color: COLOR.goldHi, letterSpacing: 2}}>{k}</div>
    <div style={{fontFamily: FONT.num, fontSize: 68, color: COLOR.warm, marginTop: 18, lineHeight: 1.1, whiteSpace: 'nowrap'}}>
      <Count to={value} start={start + 6} dec={dec} sep={sep} /><span style={{fontFamily: FONT.body, fontWeight: 700, fontSize: TYPE.body, marginLeft: 10}}>{unit}</span>
    </div>
    {s && <div data-role="body" style={{fontFamily: FONT.body, fontSize: TYPE.body, lineHeight: 1.35, color: COLOR.sub, marginTop: 20}}>{s}</div>}
  </div>;
};
