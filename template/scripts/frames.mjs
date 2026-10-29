import {SHOTS} from '../src/demo/shots.ts';
import {buildTimeline} from '../src/sync/timeline.ts';
import {ensureEpisode} from './episode.mjs';
const TL = buildTimeline(SHOTS, ensureEpisode());
console.log(TL.items.map(({s, from, d}) => `${s.id}:${from + d - 1}`).join(' '));
