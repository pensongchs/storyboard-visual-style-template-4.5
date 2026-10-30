import React from 'react';
import {AbsoluteFill} from 'remotion';
import {Fonts} from './components';
import {COLOR, FONT} from './tokens';
import {mgInfo} from './mg-catalog.ts';
import {MgSlot} from './mg-library';

/** 单种新 MG 的预览舞台。duration 60 帧：约第 10 / 26 / 50 帧是入场、中段、完成。 */
export const MgStage: React.FC<{mg?: string}> = ({mg = 'flipCount'}) => {
  const meta = mgInfo(mg);
  return <AbsoluteFill style={{background: COLOR.ink}}>
    <Fonts />
    <div style={{position: 'absolute', left: 140, top: 42, fontFamily: FONT.body, fontWeight: 700, fontSize: 36, color: COLOR.goldHi}}>{meta?.name ?? mg}</div>
    <MgSlot id={mg} r={{x: 140, y: 120, w: 1640, h: 840}} start={6} />
  </AbsoluteFill>;
};
