// 检查 + 每镜定格帧 + 联系表（纯 Node，不依赖 bash / python / 系统 ffmpeg）
//   npm run stills   → out/stills/S01.png… 与 out/联系表.png
import {readdirSync, mkdirSync, copyFileSync, rmSync} from 'node:fs';
import {join} from 'node:path';
import {spawnSync} from 'node:child_process';
import {ROOT} from './_util.mjs';
process.chdir(ROOT);
const r = spawnSync(process.execPath, ['--no-warnings', join('scripts', 'check-layout.mjs'), '--dom'], {stdio: 'inherit'});
const shots = readdirSync(join('out', 'stills')).filter((f) => /^S\d+\.png$/.test(f)).sort();
if (shots.length) {
  const tmp = join('public', '_contact');
  rmSync(tmp, {recursive: true, force: true}); mkdirSync(tmp, {recursive: true});
  shots.forEach((f) => copyFileSync(join('out', 'stills', f), join(tmp, f)));
  try {
    const {bundle} = await import('@remotion/bundler');
    const {selectComposition, renderStill} = await import('@remotion/renderer');
    const B = process.env.REMOTION_BROWSER || null;
    const serveUrl = await bundle({entryPoint: 'src/index.ts'});
    const inputProps = {files: shots};
    const composition = await selectComposition({serveUrl, id: 'ContactSheet', inputProps, browserExecutable: B});
    await renderStill({serveUrl, composition, inputProps, output: join('out', '联系表.png'), browserExecutable: B});
    console.log(`✓ out/联系表.png（${shots.length} 镜，按 S01→ 从左到右、从上到下）`);
  } catch (e) { console.error('✗ 联系表生成失败：', e.message); process.exitCode = 1; }
  finally { rmSync(tmp, {recursive: true, force: true}); }
}
if (r.status) process.exit(r.status);
