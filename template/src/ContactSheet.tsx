// 联系表：把 public/_contact/ 下的定格图按 2 列排版（由 scripts/stills.mjs 调用）
import React from 'react';
import {AbsoluteFill, Img, staticFile} from 'remotion';
export const ContactSheet: React.FC<{files: string[]}> = ({files}) => (
  <AbsoluteFill style={{background: '#121110'}}>
    {files.map((f, i) => <Img key={f} src={staticFile(`_contact/${f}`)}
      style={{position: 'absolute', left: 16 + (i % 2) * 656, top: 16 + Math.floor(i / 2) * 376, width: 640, height: 360}} />)}
  </AbsoluteFill>
);
