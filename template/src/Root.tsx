import React from 'react';
import {Composition} from 'remotion';
import {Demo, DEMO_FRAMES} from './demo/Demo';
import {ContactSheet} from './ContactSheet';
import {MgStage} from './style/MgStage';
export const Root: React.FC = () => (<>
  <Composition id="Style50-Demo" component={Demo} durationInFrames={DEMO_FRAMES} fps={30} width={1920} height={1080} />
  <Composition id="MgStage" component={MgStage} durationInFrames={60} fps={30} width={1920} height={1080} defaultProps={{mg: 'flipCount'}} />
  <Composition id="ContactSheet" component={ContactSheet as any} durationInFrames={1} fps={30} width={1328}
    height={392} defaultProps={{files: [] as string[]}}
    calculateMetadata={({props}: any) => ({height: Math.ceil(Math.max(1, props.files.length) / 2) * 376 + 16})} />
</>);
