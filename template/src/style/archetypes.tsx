import React from 'react';
import {AbsoluteFill, Freeze, Img, staticFile, useCurrentFrame, getInputProps} from 'remotion';
import {
  ArrowConnector, Backdrop, BareNumber, Chip, ExampleMark, FloatLabel, GoldText, Headline, HighlightBar,
  IconRow, Kicker, MediaFrame, ProgressRing, QuoteBlock, SoftCallout, SplitType, StatPill, Timeline, UnderlineDraw, prog,
  LiveFrameCtx,
} from './components';
import {layoutRects, titleRect, usesTitle} from './layouts.ts';
import {splitRows, type Rect} from './grid.ts';
import {COLOR, FONT, MOTION, TYPE} from './tokens';
import type {Shot} from './types';
import {DomCheck} from './domcheck';

/** 口播锚点：shots.ts 里 anchors:{count:'30.6万'} → 该词说出时的帧（相对本镜）。元素提前 6 帧开始入场，正好在说到时到位 */
export const AnchorCtx = React.createContext<Record<string, number>>({});
const useAt = () => { const a = React.useContext(AnchorCtx); return (k: string, fb: number) => (a[k] != null ? Math.max(0, a[k] - 6) : fb); };


/** 有锚点 s0/s1…（或 r0/r1…）时，焦点随口播逐项移动 */
const anchoredIdx = (f: number, n: number, p: string, a: Record<string, number>) => {
  if (a[`${p}0`] == null) return null; let k = 0;
  for (let i = 0; i < n; i++) if (a[`${p}${i}`] != null && f >= a[`${p}${i}`] - 4) k = i;
  return k;
};
const focusIdx = (f: number, n: number, from: number, to: number) =>
  Math.min(n - 1, Math.max(0, Math.floor(((f - from) / Math.max(1, to - from)) * n)));

const TitleFloat: React.FC<{s: Shot}> = ({s}) => {
  const R = layoutRects('titleFloat'); const d = s.data;
  const titleBody = {...R.title, y: R.title.y + 80, h: R.title.h - 80};
  return <>
    <div style={{position: 'absolute', left: R.title.x, top: R.title.y, display: 'flex', gap: 20}}>
      {d.chips?.map((c: any, i: number) => <Chip key={i} start={8 + i * 5} tone={c.tone}>{c.t}</Chip>)}
    </div>
    <SplitType r={titleBody} start={4} line1={d.line1} line2={d.line2} sub={d.sub} />
    <MediaFrame r={R.media} start={18} {...d.media} from="right" soft />
    <SoftCallout r={R.callout} start={32} text={d.callout} icon={d.icon ?? '▲'} />
  </>;
};

const BareNumView: React.FC<{s: Shot}> = ({s}) => {
  const R = layoutRects('bareNumber'); const d = s.data; const at = useAt(); const c0 = at('count', 10); const f = useCurrentFrame(); const N = R.number;
  return <>
    <div style={{position: 'absolute', left: N.x, top: N.y, width: N.w, height: N.h, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 48}}>
      <Chip start={6} tone="gold">{d.chip}</Chip>
      <BareNumber r={{x: 0, y: 0, w: N.w, h: 260}} start={c0} value={d.value} unit={d.unit} dec={d.dec} label={d.label} size={150} flow />
      <div style={{position: 'relative'}}>
        <UnderlineDraw x={0} y={0} w={360} start={c0 + 18} />
        <div style={{paddingTop: 28, fontFamily: FONT.body, fontWeight: 700, fontSize: TYPE.body, lineHeight: 1.4, color: COLOR.sub, opacity: prog(f, c0 + 22, 14)}} data-role="body">
          <GoldText text={d.formula} />
        </div>
      </div>
      <div style={{display: 'flex', gap: 24}}>{d.chips?.map((c: any, i: number) => <Chip key={i} start={c0 + 30 + i * 6} tone={c.tone}>{c.t}</Chip>)}</div>
    </div>
    <MediaFrame r={R.media} start={16} {...d.media} from="right" soft />
  </>;
};

const SplitVs: React.FC<{s: Shot}> = ({s}) => {
  const R = layoutRects('splitVs'); const d = s.data; const A = R.connArrow; const at = useAt(); const l0 = at('L', 28), r0 = Math.max(at('R', 36), l0 + 8);
  return <>
    <MediaFrame r={R.mediaL} start={6} {...d.L.media} from="left" soft />
    <MediaFrame r={R.mediaR} start={12} {...d.R.media} from="right" soft />
    <ArrowConnector x={A.x + 48} y={A.y + 18} w={A.w - 96} start={22} />
    <BareNumber r={R.dataL} start={l0} value={d.L.value} unit={d.L.unit} dec={d.L.dec} label={d.L.label} gold={d.winner === 'L'} size={110}>
      {d.L.chip && <Chip start={l0 + 16} tone={d.L.chip.tone}>{d.L.chip.t}</Chip>}
    </BareNumber>
    <BareNumber r={R.dataR} start={r0} value={d.R.value} unit={d.R.unit} dec={d.R.dec} label={d.R.label} gold={d.winner === 'R'} size={110}>
      {d.R.chip && <Chip start={r0 + 12} tone={d.R.chip.tone}>{d.R.chip.t}</Chip>}
    </BareNumber>
  </>;
};

const TimelineView: React.FC<{s: Shot; dur: number}> = ({s, dur}) => {
  const f = useCurrentFrame(); const d = s.data; const R = layoutRects('timeline', d.steps.length);
  const at = useAt(); const act = anchoredIdx(f, d.steps.length, 's', React.useContext(AnchorCtx)) ?? focusIdx(f, d.steps.length, 24, dur - 60);
  return <>
    <Timeline r={R.steps} start={8} steps={d.steps} active={act} />
    <SoftCallout r={R.note} start={at('note', dur - 56)} text={d.note.t} tone={d.note.tone} icon={d.note.icon} />
  </>;
};

const rowRects = (r: Rect, n: number) => splitRows(r.y, r.h, Array(n).fill(1), 24).map((y) => ({x: r.x, w: r.w, ...y}));

const MediaRows: React.FC<{s: Shot; dur: number}> = ({s, dur}) => {
  const f = useCurrentFrame(); const d = s.data; const n = d.rows.length; const R = layoutRects('mediaRows', n);
  const act = anchoredIdx(f, n, 'r', React.useContext(AnchorCtx)) ?? focusIdx(f, n, 20, dur - 40); const rows = rowRects(R.rows, n);
  return <>
    <MediaFrame r={R.media} start={6} {...d.media} from="left" soft />
    {d.rows.map((row: any, i: number) =>
      <IconRow key={i} r={rows[i]} start={14 + i * MOTION.stagger} idx={`0${i + 1}`} title={row.t} sub={row.s} tip={row.k} active={i === act} />)}
  </>;
};

const QuoteStack: React.FC<{s: Shot; dur: number}> = ({s, dur}) => {
  const f = useCurrentFrame(); const d = s.data; const n = d.rows.length; const R = layoutRects('quoteStack', n);
  const at = useAt(); const act = anchoredIdx(f, n, 'r', React.useContext(AnchorCtx)) ?? focusIdx(f, n, 24, dur - 64); const rows = rowRects(R.rows, n);
  return <>
    <QuoteBlock r={R.quote} start={4} text={d.quote} sub={d.sub} />
    {d.rows.map((row: any, i: number) =>
      <IconRow key={i} r={rows[i]} start={16 + i * MOTION.stagger} idx={`0${i + 1}`} title={row.t} sub={row.s} tip={row.k} active={i === act} />)}
    <SoftCallout r={R.warn} start={at('warn', dur - 56)} text={d.warn} tone="coral" />
  </>;
};

const RingFeature: React.FC<{s: Shot}> = ({s}) => {
  const R = layoutRects('ringFeature'); const d = s.data; const ring = R.ring; const at = useAt();
  const size = Math.min(ring.w, ring.h);
  return <>
    <MediaFrame r={R.media} start={6} {...d.media} from="left" soft />
    <ProgressRing cx={ring.x + size / 2} cy={ring.y + ring.h / 2} size={size} start={at('ring', 18)} ratio={d.ring.ratio} label={d.ring.label} value={d.ring.value} />
    {d.ring.note && <div data-role="body" style={{position: 'absolute', left: ring.x + size + 48, top: ring.y, width: ring.w - size - 48, height: ring.h, display: 'flex', alignItems: 'center',
      fontFamily: FONT.body, fontWeight: 700, fontSize: TYPE.body, lineHeight: 1.4, color: COLOR.sub, whiteSpace: 'pre-line'}}><GoldText text={d.ring.note} /></div>}
    <StatPill r={R.a} start={Math.max(at('a', 28), at('ring', 18) + 10)} {...d.a} hi />
  </>;
};

const WaitVs: React.FC<{s: Shot}> = ({s}) => {
  const R = layoutRects('waitVs'); const d = s.data; const A = R.connArrow; const at = useAt(); const l0 = at('L', 26), r0 = Math.max(at('R', 36), l0 + 8);
  return <>
    <MediaFrame r={R.mediaL} start={6} {...d.L.media} from="left" soft />
    <MediaFrame r={R.mediaR} start={12} {...d.R.media} from="right" soft />
    <HighlightBar x={R.numL.x} y={R.numL.y + 8} h={R.numL.h - 16} start={l0 - 2} />
    <BareNumber r={{...R.numL, x: R.numL.x + 40, w: R.numL.w - 40}} start={l0} value={d.L.value} unit={d.L.unit} label={d.L.label} gold={false} size={110}>
      {d.L.chip && <Chip start={l0 + 18} tone={d.L.chip.tone}>{d.L.chip.t}</Chip>}
    </BareNumber>
    <ArrowConnector x={A.x + 48} y={A.y + 16} w={A.w - 96} start={r0 - 2} />
    <BareNumber r={R.numR} start={r0} value={d.R.value} unit={d.R.unit} label={d.R.label} gold size={110}>
      {d.R.chip && <Chip start={r0 + 12} tone={d.R.chip.tone}>{d.R.chip.t}</Chip>}
    </BareNumber>
  </>;
};

const TriadSoft: React.FC<{s: Shot; dur: number}> = ({s, dur}) => {
  const d = s.data; const R = layoutRects('triadSoft'); const at = useAt();
  return <>
    {d.cols.map((c: any, i: number) => <StatPill key={i} r={R[`c${i}`]} start={at(`c${i}`, 8 + i * 8)} {...c} hi={i === 1} />)}
    <SoftCallout r={R.note} start={at('note', dur - 56)} text={d.note.t} />
  </>;
};

/** 片尾：默认纯文案（总结一句 + CTA），character 为可选 */
const OutroAir: React.FC<{s: Shot}> = ({s}) => {
  const f = useCurrentFrame(); const d = s.data; const R = layoutRects('outroAir', 0, {character: !!d.character});
  const p = prog(f, 4, 24); const t = R.text; const center = !d.character; const c0 = useAt()('cta', 38);
  return <>
    {d.character && <div style={{position: 'absolute', left: R.character.x, top: R.character.y, width: R.character.w, height: R.character.h, opacity: p, transform: `translateY(${(1 - p) * 20}px)`}}>
      <Img src={staticFile(d.character)} style={{width: '100%', height: '100%', objectFit: 'contain', objectPosition: 'left bottom', filter: 'drop-shadow(0 16px 36px rgba(0,0,0,0.45))'}} />
    </div>}
    <div style={{position: 'absolute', left: t.x, top: t.y, width: t.w, height: t.h, display: 'flex', flexDirection: 'column', justifyContent: 'center',
      alignItems: center ? 'center' : 'flex-start', textAlign: center ? 'center' : 'left'}}>
      {d.eyebrow && <div style={{fontFamily: FONT.body, fontWeight: 700, fontSize: TYPE.label, color: COLOR.goldHi, letterSpacing: 8, opacity: prog(f, 6, 14)}}>{d.eyebrow}</div>}
      <div style={{fontFamily: FONT.title, fontSize: 76, color: COLOR.warm, marginTop: 40, lineHeight: 1.35, whiteSpace: 'pre-line',
        opacity: prog(f, 12, 18), transform: `translateY(${(1 - prog(f, 12, 18)) * 24}px)`}}><GoldText text={d.line} /></div>
      <div style={{position: 'relative', width: 240, height: 3, marginTop: 48}}><UnderlineDraw x={0} y={0} w={240} start={30} /></div>
      {d.cta && <div data-role="body" style={{marginTop: 48, fontFamily: FONT.body, fontWeight: 700, fontSize: TYPE.body, lineHeight: 1.4, color: COLOR.sub, opacity: prog(f, c0, 14)}}><GoldText text={d.cta} /></div>}
      {d.account && <div style={{marginTop: 24, fontFamily: FONT.body, fontWeight: 700, fontSize: TYPE.label, color: COLOR.goldHi, opacity: prog(f, c0 + 6, 14)}}>{d.account}</div>}
    </div>
  </>;
};

const VIEWS: Record<string, React.FC<{s: Shot; dur: number}>> = {
  titleFloat: ({s}) => <TitleFloat s={s} />,
  bareNumber: ({s}) => <BareNumView s={s} />,
  splitVs: ({s}) => <SplitVs s={s} />,
  timeline: ({s, dur}) => <TimelineView s={s} dur={dur} />,
  mediaRows: ({s, dur}) => <MediaRows s={s} dur={dur} />,
  quoteStack: ({s, dur}) => <QuoteStack s={s} dur={dur} />,
  ringFeature: ({s}) => <RingFeature s={s} />,
  waitVs: ({s}) => <WaitVs s={s} />,
  triadSoft: ({s, dur}) => <TriadSoft s={s} dur={dur} />,
  outroAir: ({s}) => <OutroAir s={s} />,
};

/** 栏目行：city 可选，填了才显示为前缀 */
export const kickerText = (s: Shot) => (s.kicker ? (s.city ? `${s.city} · ${s.kicker}` : s.kicker) : undefined);

export const ShotView: React.FC<{s: Shot; dur: number; exampleData?: boolean; anchors?: Record<string, number>}> = ({s, dur, exampleData, anchors = {}}) => {
  const f = useCurrentFrame();
  const View = VIEWS[s.layout];
  const kt = kickerText(s);
  const body = <AbsoluteFill>
    <Backdrop src={s.bg.src} video={s.bg.video} blur={s.bg.blur} dark={s.bg.dark} trimStart={s.bg.trim} />
    {kt && <Kicker text={kt} />}
    {exampleData && <ExampleMark />}
    {usesTitle(s.layout) && s.title && <Headline text={s.title} />}
    {View ? <View s={s} dur={dur} /> : null}
  </AbsoluteFill>;
  // 音画同步：不再提前 1 秒定格（会和口播错位），只在退场转场期间冻结前景
  const freezeAt = dur - 1;
  const check = !!(getInputProps() as any)?.check && f >= freezeAt;
  const zones: Record<string, Rect> = {...layoutRects(s.layout, s.data?.steps?.length ?? s.data?.rows?.length ?? 3, {character: !!s.data?.character}),
    _kicker: {x: 96, y: 56, w: 1240, h: 36}, _example: {x: 1400, y: 56, w: 232, h: 36}};
  if (usesTitle(s.layout)) zones._title = titleRect();
  return <>
    <AnchorCtx.Provider value={anchors}><LiveFrameCtx.Provider value={f}>{f >= freezeAt ? <Freeze frame={freezeAt}>{body}</Freeze> : body}</LiveFrameCtx.Provider></AnchorCtx.Provider>
    {check && <DomCheck id={s.id} zones={zones} />}
  </>;
};
