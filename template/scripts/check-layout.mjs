// 自动排版检查（终版）。用法:
//   node --no-warnings scripts/check-layout.mjs          静态检查
//   node --no-warnings scripts/check-layout.mjs --dom    + 逐镜渲染定格帧做 DOM 检查，并输出 out/stills/*.png（npm run stills 会再拼联系表）
// 静态：越界 / 栏线 / 独立组间距 ≥48（页眉行 8、连接件 24）/ 素材不复用 / 文案无城市名 / 字号令牌与字面量下限
// DOM ：实际字号 ≥26（正文 ≥34）/ 文字宽 ≤ 容器 75% / 多行行高 ≥1.3 / 容器不溢出 / 文字不出版式区
import {readFileSync, mkdirSync, rmSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {SAFE, GRID, ROWS, MG_GAP} from '../src/style/grid.ts';
import {layoutRects, titleRect, usesTitle} from '../src/style/layouts.ts';
import {TYPE, MIN_FONT} from '../src/style/tokens.ts';
import {SHOTS} from '../src/demo/shots.ts';
process.chdir(fileURLToPath(new URL('..', import.meta.url)));
const errs = []; const colLinesL = new Set(), colLinesR = new Set();
for (let c = 0; c < GRID.cols; c++) { colLinesL.add(SAFE.left + c * GRID.step); colLinesR.add(SAFE.left + c * GRID.step + GRID.colW); }
const KICKER = {x: SAFE.left, y: ROWS.kickerY, w: 1240, h: ROWS.kickerH};
const EXAMPLE = {x: 1400, y: ROWS.kickerY, w: SAFE.right - 1400, h: ROWS.kickerH};
// 1) 版式矩形
for (const s of SHOTS) {
  const n = s.data.steps?.length ?? s.data.rows?.length ?? s.data.cards?.length;
  const R = {...layoutRects(s.layout, n, {character: !!s.data.character})};
  if (usesTitle(s.layout)) R._title = titleRect();
  for (const [k, r] of Object.entries(R)) {
    if (r.x < SAFE.left || r.x + r.w > SAFE.right || r.y < 0 || r.y + r.h > SAFE.subtitleTop) errs.push(`${s.id}.${k} 越界 ${JSON.stringify(r)}`);
    if (!colLinesL.has(r.x)) errs.push(`${s.id}.${k} 左边 ${r.x} 不在栏线上`);
    if (!colLinesR.has(r.x + r.w)) errs.push(`${s.id}.${k} 右边 ${r.x + r.w} 不在栏线上`);
  }
  const all = Object.entries({...R, _kicker: KICKER, _example: EXAMPLE});
  for (let i = 0; i < all.length; i++) for (let j = i + 1; j < all.length; j++) {
    const [ka, a] = all[i], [kb, b] = all[j];
    const gx = Math.max(b.x - (a.x + a.w), a.x - (b.x + b.w)), gy = Math.max(b.y - (a.y + a.h), a.y - (b.y + b.h));
    const hdr = (k) => k.startsWith('_');
    const need = hdr(ka) && hdr(kb) ? 8 : (ka.startsWith('conn') || kb.startsWith('conn')) ? GRID.gutter : MG_GAP;
    if (Math.max(gx, gy) < need) errs.push(`${s.id}: ${ka} 与 ${kb} 间距 ${Math.max(gx, gy)}px < ${need}`);
  }
}
// 2) 素材不复用
const seen = new Map(); const walk = (o, id) => { if (!o || typeof o !== 'object') return;
  for (const [k, v] of Object.entries(o)) { if ((k === 'src' || k === 'character') && typeof v === 'string') { if (seen.has(v)) errs.push(`素材复用 ${v}: ${seen.get(v)} 与 ${id}`); else seen.set(v, id); } else walk(v, id); } };
for (const s of SHOTS) walk(s, s.id);
// 3) 城市中性：除 city 字段外，所有屏幕文字不得出现城市名
const CITIES = '长沙|北京|上海|广州|深圳|杭州|成都|重庆|武汉|南京|西安|天津|苏州|郑州|合肥|青岛|宁波|厦门|福州|济南|昆明|南昌|贵阳|南宁|长春|沈阳|大连|哈尔滨|石家庄|太原|兰州|海口|佛山|东莞|无锡|株洲|湘潭';
const cityRe = new RegExp(CITIES);
const textWalk = (o, id, path = '') => { if (!o || typeof o !== 'object') return;
  for (const [k, v] of Object.entries(o)) { if (k === 'city' || k === 'src' || k === 'character') continue;
    if (typeof v === 'string' && cityRe.test(v)) errs.push(`${id}.${path}${k} 含城市名「${v}」→ 改用 city 字段`); else textWalk(v, id, `${path}${k}.`); } };
for (const s of SHOTS) textWalk(s, s.id);
// 4) 字号下限（令牌 + 源码字面量）
for (const [k, v] of Object.entries(TYPE)) if (v < MIN_FONT.any) errs.push(`TYPE.${k}=${v} < ${MIN_FONT.any}`);
if (TYPE.body < MIN_FONT.body) errs.push(`TYPE.body=${TYPE.body} < ${MIN_FONT.body}`);
for (const f of ['src/style/components.tsx', 'src/style/archetypes.tsx']) {
  readFileSync(f, 'utf8').split('\n').forEach((line, i) => { for (const m of line.matchAll(/fontSize:\s*(\d+)/g)) if (+m[1] < MIN_FONT.any) errs.push(`${f}:${i + 1} fontSize ${m[1]} < ${MIN_FONT.any}`); });
}
// 视频素材时长须 ≥ trim + 镜长 + 0.5s（转场延续），否则末尾会定住「顿一下」
{ const probe = (f) => { const r = spawnSync(process.execPath, ['node_modules/@remotion/cli/remotion-cli.js', 'ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', f], {encoding: 'utf8'}); return r.status === 0 ? parseFloat(r.stdout) : null; };
  for (const s of SHOTS) if (s.bg?.video) { const d = probe('public/' + s.bg.src); if (d != null && d < (s.bg.trim || 0) + s.sec + 0.5) errs.push(`${s.id}: 背景视频 ${s.bg.src} 只有 ${d.toFixed(2)}s，不够 ${(s.bg.trim || 0) + s.sec + 0.5}s`); } }
console.log(`静态检查 ${SHOTS.length} 镜，素材 ${seen.size} 个`);
// 5) DOM 检查
if (process.argv.includes('--dom')) {
  const B = process.env.REMOTION_BROWSER || null; // 可选：自定义 Chrome Headless Shell 路径；不填则由 Remotion 自动下载
  mkdirSync('out/stills', {recursive: true});
  const {bundle} = await import('@remotion/bundler');
  const {selectComposition, renderStill} = await import('@remotion/renderer');
  const serveUrl = await bundle({entryPoint: 'src/index.ts'});
  const inputProps = {check: true};
  const composition = await selectComposition({serveUrl, id: 'Style50-Demo', inputProps, browserExecutable: B});
  let t = 0;
  for (const s of SHOTS) {
    const d = Math.ceil(s.sec * 30); const fr = t + d - 1; t += d;
    let got = null;
    await renderStill({serveUrl, composition, inputProps, frame: fr, output: `out/stills/${s.id}.png`, browserExecutable: B,
      onBrowserLog: (l) => { const m = l.text.match(new RegExp(`CHECK\\|${s.id}\\|(\\[.*\\])`)); if (m) got = JSON.parse(m[1]); }});
    if (!got) { errs.push(`${s.id}: 未拿到 DOM 检查结果`); continue; }
    got.forEach((e) => errs.push(`${s.id}: ${e}`));
    console.log(`  ${s.id} DOM ${got.length ? '✗ ' + got.length : '✓'}`);
  }
}
if (errs.length) { console.log('✗ 发现问题:\n' + errs.join('\n')); process.exit(1); }
console.log('✓ 全部通过：贴栏线、无重叠、组距≥48、素材不复用、无城市名、字号达标' + (process.argv.includes('--dom') ? '、填充率≤75%、行高≥1.3、无溢出' : ''));
