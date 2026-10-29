import React from 'react';
import {AbsoluteFill, Sequence, Audio, staticFile, getInputProps} from 'remotion';
import {Fonts, ClipRateCtx} from '../style/components';
import {ShotView} from '../style/archetypes';
import {Transition, TRANSITIONS} from '../style/transitions';
import {Subtitles, type SubOpts} from '../style/subtitles';
import {COLOR} from '../style/tokens';
import {buildTimeline, type Episode} from '../sync/timeline.ts';
import {SHOTS, SUBTITLE} from './shots.ts';
import EP from './episode.json';
export const EPISODE = EP as unknown as Episode;
export const TIMELINE = buildTimeline(SHOTS, EPISODE);
/** 成片总帧数 = 音频帧数 + 片尾留白（音画同步，镜头时长全部来自字幕时间码） */
export const DEMO_FRAMES = TIMELINE.total;

/** 素材比本镜短 → 慢放补足（最慢 0.75×），避免最后一帧定住 */
const rates = (s: any, needFrames: number) => {
  const out: Record<string, number> = {}; const need = needFrames / 30;
  const add = (m: any) => { if (!m?.video) return; const ms = EPISODE.clips[m.src]; if (!ms) return;
    out[m.src] = Math.max(0.75, Math.min(1, (ms / 1000 - (m.trim ?? 0) - 0.1) / need)); };
  add(s.bg); const walk = (o: any) => { if (o && typeof o === 'object') { if (o.src && o.video) add(o); Object.values(o).forEach(walk); } }; walk(s.data);
  return out;
};

/** 镜间转场：下一镜在自己第 0 帧起做 T 帧入场，上一镜同时在定格状态下延续 T 帧退场（总时长不变） */
export const Demo: React.FC = () => {
  const ip = (getInputProps() as any) ?? {};
  const opts: SubOpts = {show: ip.subs ?? SUBTITLE.show, highlight: ip.highlight ?? SUBTITLE.highlight};
  const items = TIMELINE.items;
  return <AbsoluteFill style={{background: COLOR.ink}}>
    <Fonts />
    {items.map(({s, d, from, i, anchors}) => {
      const inT = i > 0 ? TRANSITIONS[(i - 1) % TRANSITIONS.length] : null;
      const outT = i < items.length - 1 ? TRANSITIONS[i % TRANSITIONS.length] : null;
      const len = d + (outT ? outT.dur : 0);
      return <Sequence key={s.id} from={from} durationInFrames={len} premountFor={30}>
        <ClipRateCtx.Provider value={rates(s, len)}>
          <Transition d={d} inT={inT} outT={outT} z={i}>
            <ShotView s={s} dur={d} anchors={anchors} exampleData={!String(s.layout).startsWith('outro')} />
          </Transition>
        </ClipRateCtx.Provider>
      </Sequence>;
    })}
    <AbsoluteFill style={{zIndex: 100, pointerEvents: 'none'}}><Subtitles ep={EPISODE} opts={opts} /></AbsoluteFill>
    {!ip.check && <Audio src={staticFile(EPISODE.audio)} />}
  </AbsoluteFill>;
};
export {rates as clipRates};
