// 渲染成片 / 打开预览（跨平台）
//   npm run render                         → out/成片.mp4（全片）
//   npm run render -- --frames=0-89        → 只渲染前 3 秒（快速试片）
//   npm run render -- --out=out/xxx.mp4    → 指定输出
//   npm run render -- --no-subs           → 不烧字幕；--no-highlight → 字幕不做当前词高亮
//   npm run studio                         → 打开 Remotion Studio 预览
import {remotionCli} from './_util.mjs';
import {ensureEpisode} from './episode.mjs';
const a = process.argv.slice(2);
const get = (k) => a.find((x) => x.startsWith(`--${k}=`))?.split('=').slice(1).join('=');
const browser = process.env.REMOTION_BROWSER ? [`--browser-executable=${process.env.REMOTION_BROWSER}`] : [];
ensureEpisode(); // 音频 / 字幕有更新就重新准备
if (a.includes('--studio')) process.exit(remotionCli(['studio', 'src/index.ts', ...browser]).status ?? 0);
const out = get('out') || 'out/成片.mp4';
const args = ['render', 'src/index.ts', get('comp') || 'Style50-Demo', out, '--codec=h264', '--crf=18', '--audio-codec=aac', '--audio-bitrate=192k', ...browser];
const props = {}; if (a.includes('--no-subs')) props.subs = false; if (a.includes('--no-highlight')) props.highlight = false;
if (Object.keys(props).length) args.push(`--props=${JSON.stringify(props)}`);
if (get('frames')) args.push(`--frames=${get('frames')}`);
const r = remotionCli(args);
if (r.status === 0) console.log(`✓ ${out}`);
process.exit(r.status ?? 1);
