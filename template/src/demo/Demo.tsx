import React from 'react';
import {AbsoluteFill, Sequence, useCurrentFrame, interpolate} from 'remotion';
import {Fonts} from '../style/components';
import {ShotView} from '../style/archetypes';
import {Transition, TRANSITIONS} from '../style/transitions';
import {COLOR} from '../style/tokens';
import {SHOTS} from './shots.ts';
export const frames = (sec: number) => Math.ceil(sec * 30);
export const DEMO_FRAMES = SHOTS.reduce((a, s) => a + frames(s.sec), 0);
/** 镜间转场：下一镜在自己第 0 帧起做 T 帧入场，上一镜同时在定格状态下延续 T 帧退场（总时长不变） */
export const Demo: React.FC = () => {
  let t = 0;
  const items = SHOTS.map((s, i) => { const d = frames(s.sec); const from = t; t += d; return {s, d, from, i}; });
  return <AbsoluteFill style={{background: COLOR.ink}}>
    <Fonts />
    {items.map(({s, d, from, i}) => {
      const inT = i > 0 ? TRANSITIONS[(i - 1) % TRANSITIONS.length] : null;
      const outT = i < items.length - 1 ? TRANSITIONS[i % TRANSITIONS.length] : null;
      return <Sequence key={s.id} from={from} durationInFrames={d + (outT ? outT.dur : 0)} premountFor={30}>
        <Transition d={d} inT={inT} outT={outT} z={i}>
          <ShotView s={s} dur={d} exampleData={!String(s.layout).startsWith('outro')} />
        </Transition>
      </Sequence>;
    })}
  </AbsoluteFill>;
};
