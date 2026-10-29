// 校验视频素材：npm run stock:verify [-- 文件…] [--min-h=1080]
// 检查分辨率 ≥1920×1080、帧率、时长 ≥ trim+镜长+0.5s、每段只用一次、SOURCES.md 已登记。
// ffprobe 查找顺序：ffprobe-static → @remotion/cli 内置 ffprobe → 系统 ffprobe。Windows / macOS / Linux 通用。
import {existsSync, readdirSync, readFileSync} from 'node:fs';
import {join, basename} from 'node:path';
import {spawnSync} from 'node:child_process';
import {createRequire} from 'node:module';
import {pathToFileURL} from 'node:url';
import {ROOT} from './_util.mjs';
process.chdir(ROOT);
const args = process.argv.slice(2);
const minH = Number((args.find((a) => a.startsWith('--min-h=')) || '--min-h=1080').split('=')[1]);
const STOCK = join('public', 'media', 'stock');

const runners = [];
try { const p = createRequire(join(ROOT, 'package.json'))('ffprobe-static').path; if (p && existsSync(p)) runners.push((a) => spawnSync(p, a, {encoding: 'utf8'})); } catch {}
const cli = join('node_modules', '@remotion', 'cli', 'remotion-cli.js');
if (existsSync(cli)) runners.push((a) => spawnSync(process.execPath, [cli, 'ffprobe', ...a], {encoding: 'utf8'}));
runners.push((a) => spawnSync('ffprobe', a, {encoding: 'utf8', shell: process.platform === 'win32'}));
const probe = (f) => {
  const a = ['-v', 'error', '-select_streams', 'v:0', '-show_entries', 'stream=width,height,r_frame_rate:stream_side_data=rotation:format=duration', '-of', 'json', f];
  for (const run of runners) {
    const r = run(a);
    if (r.status === 0 && r.stdout) { try {
      const j = JSON.parse(r.stdout); const s = j.streams?.[0] || {}; const [n, d] = String(s.r_frame_rate || '0/1').split('/').map(Number);
      const rot = Math.abs(Number(s.side_data_list?.[0]?.rotation || 0)) % 180 === 90;
      return {w: rot ? s.height : s.width, h: rot ? s.width : s.height, fps: d ? n / d : 0, dur: parseFloat(j.format?.duration || '0')};
    } catch {} }
  }
  return null;
};

// 素材 → 用到它的镜头
const {SHOTS} = await import(pathToFileURL(join(ROOT, 'src', 'demo', 'shots.ts')).href);
const uses = new Map();
const add = (m, s) => { if (m?.video && m.src) { const k = basename(m.src); uses.set(k, [...(uses.get(k) || []), {id: s.id, need: (m.trim || 0) + s.sec + 0.5}]); } };
for (const s of SHOTS) { add(s.bg, s); const d = s.data || {}; [d.media, d.L?.media, d.R?.media].forEach((m) => add(m, s)); }

const demo = new Set(); try { JSON.parse(readFileSync(join(STOCK, 'stock.json'), 'utf8')).forEach((e) => demo.add(e.file)); } catch {}
const sources = existsSync(join(STOCK, 'SOURCES.md')) ? readFileSync(join(STOCK, 'SOURCES.md'), 'utf8') : '';
const files = args.filter((a) => !a.startsWith('--')).map((f) => basename(f));
const list = files.length ? files : readdirSync(STOCK).filter((f) => /\.(mp4|mov|webm)$/i.test(f));

let err = 0, warn = 0;
console.log('文件 | 分辨率 | fps | 时长 | 结论');
for (const f of list) {
  const p = join(STOCK, f); const msgs = []; let bad = false;
  if (!existsSync(p)) { console.log(`${f} | — | — | — | ✗ 文件不存在`); err++; continue; }
  const m = probe(p);
  if (!m) { console.log(`${f} | ? | ? | ? | ✗ 无法读取（ffprobe 不可用或文件损坏）`); err++; continue; }
  const isDemo = demo.has(f);
  if (m.h < minH || m.w < Math.round(minH * 16 / 9)) { msgs.push(`分辨率低于 ${Math.round(minH * 16 / 9)}×${minH}${isDemo ? '（演示素材，仅警告）' : ''}`); if (!isDemo) bad = true; else warn++; }
  if (m.w / m.h < 1.7) { msgs.push('不是横屏 16:9'); bad = true; }
  if (m.fps < 23.5 || m.fps > 60.5) { msgs.push(`帧率 ${m.fps.toFixed(2)} 异常（应为 24–60）`); bad = true; }
  const u = uses.get(f) || [];
  if (u.length > 1) { msgs.push(`被 ${u.map((x) => x.id).join('、')} 重复使用`); bad = true; }
  for (const x of u) if (m.dur < x.need) { msgs.push(`${x.id} 需要 ≥${x.need.toFixed(1)}s`); bad = true; }
  if (!u.length) { msgs.push('本期未使用'); warn++; }
  if (!sources.includes(f)) { msgs.push('SOURCES.md 未登记'); bad = true; }
  if (bad) err++;
  console.log(`${f} | ${m.w}×${m.h} | ${m.fps.toFixed(2)} | ${m.dur.toFixed(1)}s | ${bad ? '✗' : '✓'} ${msgs.join('；')}`);
}
for (const k of uses.keys()) if (!list.includes(k) && !files.length) { console.log(`${k} | — | — | — | ✗ shots.ts 引用了但文件不存在`); err++; }
console.log(err ? `\n✗ ${err} 个素材不合格（${warn} 个警告）` : `\n✓ 全部合格（${warn} 个警告）`);
process.exit(err ? 1 : 0);
