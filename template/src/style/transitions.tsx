// 克制转场（8–15 帧，轮换使用）：crossfade / pushBlur / lightSweep / maskWipe
import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame, Easing} from 'remotion';
export type TKind = 'crossfade' | 'pushBlur' | 'lightSweep' | 'maskWipe';
export type TSpec = {kind: TKind; dur: number};
export const TRANSITIONS: TSpec[] = [
  {kind: 'pushBlur', dur: 12}, {kind: 'crossfade', dur: 10}, {kind: 'maskWipe', dur: 14}, {kind: 'lightSweep', dur: 12},
];
const ease = Easing.bezier(0.45, 0, 0.2, 1);
const P = (f: number, a: number, b: number) => interpolate(f, [a, b], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: ease});

/** 包住一镜：入场按 inT（第 0..dur 帧），退场按 outT（d..d+dur 帧，此时画面已定格） */
export const Transition: React.FC<{d: number; inT: TSpec | null; outT: TSpec | null; z: number; children: React.ReactNode}> = ({d, inT, outT, z, children}) => {
  const f = useCurrentFrame();
  let style: React.CSSProperties = {zIndex: z};
  let overlay: React.ReactNode = null;
  if (inT && f < inT.dur) {
    const p = P(f, 0, inT.dur);
    if (inT.kind === 'crossfade') style = {...style, opacity: p};
    if (inT.kind === 'pushBlur') style = {...style, opacity: p, transform: `translateX(${(1 - p) * 80}px)`, filter: `blur(${(1 - p) * 10}px)`};
    if (inT.kind === 'maskWipe') { const x = (1 - p) * 110 - 10; // 带软边的左→右擦除
      const m = `linear-gradient(90deg, #000 ${100 - x - 10}%, transparent ${100 - x}%)`; style = {...style, WebkitMaskImage: m, maskImage: m}; }
    if (inT.kind === 'lightSweep') { style = {...style, opacity: p};
      overlay = <AbsoluteFill style={{zIndex: z + 0.5, pointerEvents: 'none', opacity: 0.22 * Math.sin(Math.PI * p),
        background: `linear-gradient(105deg, transparent ${p * 120 - 40}%, rgba(255,240,215,0.9) ${p * 120 - 20}%, transparent ${p * 120}%)`}} />; }
  }
  if (outT && f >= d) {
    const p = P(f, d, d + outT.dur);
    if (outT.kind === 'pushBlur') style = {...style, transform: `translateX(${-p * 60}px)`, filter: `blur(${p * 8}px)`};
    if (outT.kind === 'crossfade' || outT.kind === 'lightSweep') style = {...style, opacity: 1 - p * 0.3};
  }
  return <><AbsoluteFill style={style}>{children}</AbsoluteFill>{overlay}</>;
};
