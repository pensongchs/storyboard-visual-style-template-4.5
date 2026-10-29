// 检查 + 每镜定格帧 + 联系表（不依赖 bash / python）
//   npm run stills   → out/stills/S01.png… 与 out/联系表.png
import {readdirSync} from 'node:fs';
import {join} from 'node:path';
import {spawnSync} from 'node:child_process';
import {ROOT, remotionCli} from './_util.mjs';
const r = spawnSync(process.execPath, ['--no-warnings', join(ROOT, 'scripts', 'check-layout.mjs'), '--dom'], {cwd: ROOT, stdio: 'inherit'});
const shots = readdirSync(join(ROOT, 'out', 'stills')).filter((f) => /^S\d+\.png$/.test(f)).sort();
if (shots.length) {
  const rows = Math.ceil(shots.length / 2);
  const inputs = shots.flatMap((f) => ['-i', join('out', 'stills', f)]);
  const scaled = shots.map((_, i) => `[${i}:v]scale=640:360[v${i}]`).join(';');
  const layout = shots.map((_, i) => `${16 + (i % 2) * 656}_${16 + Math.floor(i / 2) * 376}`).join('|');
  const fc = `${scaled};${shots.map((_, i) => `[v${i}]`).join('')}xstack=inputs=${shots.length}:layout=${layout}:fill=0x121110,pad=${2 * 656 + 16}:${rows * 376 + 16}:color=0x121110`;
  const singleFix = shots.length === 1 ? ['-vf', 'pad=672:392:16:16:color=0x121110'] : ['-filter_complex', fc];
  remotionCli(['ffmpeg', '-v', 'error', '-y', ...inputs, ...singleFix, '-frames:v', '1', join('out', '联系表.png')]);
  console.log(`✓ out/联系表.png（${shots.length} 镜，按 S01→ 从左到右、从上到下）`);
}
process.exit(r.status ?? 0);
