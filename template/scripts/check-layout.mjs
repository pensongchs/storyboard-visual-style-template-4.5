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
import {buildTimeline, F, TAIL} from '../src/sync/timeline.ts';
import {SUB} from '../src/style/subtitle-tokens.ts';
import {ensureEpisode} from './episode.mjs';
import {width} from './lib/subs.mjs';
import {existsSync} from 'node:fs';
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
// 6) 音画同步：音频存在 / 总帧 = 音频帧 + 片尾 / 每镜起点递增且 ≥1.2s / 每句字幕都落在某一镜 / 锚点可解析
const EP = ensureEpisode(); const TL = buildTimeline(SHOTS, EP);
TL.errors.forEach((e) => errs.push(e));
if (!existsSync('public/' + EP.audio)) errs.push(`音频不存在：public/${EP.audio}（先 npm run episode）`);
{ const sum = TL.items.reduce((a, it) => a + it.d, 0); const want = F(EP.audioMs) + TAIL;
  if (sum !== want || TL.total !== want) errs.push(`总帧数 ${sum} ≠ 音频 ${F(EP.audioMs)} 帧 + 片尾 ${TAIL}`);
  TL.items.forEach((it, i) => { if (i && it.from <= TL.items[i - 1].from) errs.push(`${it.s.id}: 起点没有晚于上一镜`);
    if (it.d < 36) errs.push(`${it.s.id}: 只有 ${it.d} 帧（<1.2s），合并到相邻镜头`);
    if (i && i < TL.items.length && it.from !== TL.items[i - 1].from + TL.items[i - 1].d) errs.push(`${it.s.id}: 与上一镜之间有空隙`);
    if (it.cueRange[0] < 0) errs.push(`${it.s.id}: 本镜内没有任何一句口播`);
    for (const [k, v] of Object.entries(it.anchors)) if (v >= it.d) errs.push(`${it.s.id}: 锚点 ${k} 在第 ${v} 帧，超出本镜 ${it.d} 帧`); });
  const lastEnd = TL.items.at(-1).from + TL.items.at(-1).d;
  for (const c of EP.cues) { const fr = F(c.startMs); if (fr >= lastEnd) errs.push(`字幕 #${c.i}「${c.text}」超出成片`); }
  if (EP.cues.length && F(EP.cues.at(-1).endMs) > TL.total) errs.push('最后一句字幕在成片结束后才结束'); }
// 7) 字幕规格：字号 38–46 / 单行 ≤18 字 / 最多 2 行 / 位置在底部字幕区
if (SUB.size < 38 || SUB.size > 46) errs.push(`字幕字号 ${SUB.size}px 不在 38–46`);
for (const c of EP.subs) { if (c.lines.length > 2) errs.push(`字幕「${c.lines.flat().map((t) => t.t).join('')}」超过 2 行`);
  for (const l of c.lines) { const t = l.map((x) => x.t).join(''); if (width(t) > SUB.maxChars + 0.01) errs.push(`字幕行「${t}」宽 ${width(t).toFixed(1)} 字 > ${SUB.maxChars}`); } }
// 8) 素材慢放：素材比镜头短时自动慢放，最慢 0.75×，再短就报错（换更长的素材或调 trim）
TL.items.forEach((it, i) => { const need = (it.d + (i < TL.items.length - 1 ? 14 : 0)) / 30;
  const chk = (m) => { if (!m?.video) return; const ms = EP.clips[m.src]; if (!ms) return; const r = (ms / 1000 - (m.trim ?? 0) - 0.1) / need;
    if (r < 0.75) errs.push(`${it.s.id}: 视频 ${m.src} 只有 ${(ms / 1000).toFixed(1)}s，本镜要 ${need.toFixed(1)}s（需慢放到 ${r.toFixed(2)}× < 0.75）`); };
  chk(it.s.bg); const w = (o) => { if (o && typeof o === 'object') { if (o.src && o.video) chk(o); Object.values(o).forEach(w); } }; w(it.s.data); });
console.log(`静态检查 ${SHOTS.length} 镜，素材 ${seen.size} 个；本期「${EP.name}」音频 ${(EP.audioMs / 1000).toFixed(2)}s → ${TL.total} 帧，${EP.cues.length} 句字幕`);
// 5) DOM 检查
if (process.argv.includes('--dom')) {
  const B = process.env.REMOTION_BROWSER || null; // 可选：自定义 Chrome Headless Shell 路径；不填则由 Remotion 自动下载
  mkdirSync('out/stills', {recursive: true});
  const {bundle} = await import('@remotion/bundler');
  const {selectComposition, renderStill} = await import('@remotion/renderer');
  const serveUrl = await bundle({entryPoint: 'src/index.ts'});
  const inputProps = {check: true};
  const composition = await selectComposition({serveUrl, id: 'Style50-Demo', inputProps, browserExecutable: B});
  for (const {s, from, d} of TL.items) {
    const fr = from + d - 1;
    let got = null;
    await renderStill({serveUrl, composition, inputProps, frame: fr, output: `out/stills/${s.id}.png`, browserExecutable: B,
      onBrowserLog: (l) => { const m = l.text.match(new RegExp(`CHECK\\|${s.id}\\|(\\[.*\\])`)); if (m) got = JSON.parse(m[1]); }});
    if (!got) { errs.push(`${s.id}: 未拿到 DOM 检查结果`); continue; }
    got.forEach((e) => errs.push(`${s.id}: ${e}`));
    console.log(`  ${s.id} DOM ${got.length ? '✗ ' + got.length : '✓'}`);
  }
  // 字幕 DOM：抽 8 句，在句中点出图并检查位置 / 字号 / 溢出
  const picks = [...new Set(Array.from({length: 8}, (_, k) => Math.round((k * (EP.subs.length - 1)) / 7)))];
  for (const k of picks) { const c = EP.subs[k]; const fr = F((c.startMs + c.endMs) / 2); let got = null;
    await renderStill({serveUrl, composition, inputProps, frame: fr, output: `out/stills/sub_${String(k + 1).padStart(2, '0')}.png`, browserExecutable: B,
      onBrowserLog: (l) => { const m = l.text.match(new RegExp(`SUBCHECK\\|${fr}\\|(.*)`)); if (m) got = m[1] === 'null' ? 'null' : JSON.parse(m[1]); }});
    const tag = `字幕 #${k + 1}@${fr}`;
    if (!got || got === 'null') { errs.push(`${tag}: 应显示但没渲染出来`); continue; }
    if (got.x < SAFE.left || got.x + got.w > SAFE.right) errs.push(`${tag}: 横向超出内容区 ${Math.round(got.x)}–${Math.round(got.x + got.w)}`);
    if (got.y < SAFE.subtitleTop || got.y + got.h > 1080) errs.push(`${tag}: 纵向超出字幕区 ${Math.round(got.y)}–${Math.round(got.y + got.h)}`);
    if (got.fs < 38 || got.fs > 46) errs.push(`${tag}: 字号 ${got.fs}`);
    if (got.over) errs.push(`${tag}: 行内溢出`);
    console.log(`  字幕 #${k + 1} ✓ y ${Math.round(got.y)}–${Math.round(got.y + got.h)}，宽 ${Math.round(got.w)}`); }
}
if (errs.length) { console.log('✗ 发现问题:\n' + errs.join('\n')); process.exit(1); }
console.log('✓ 全部通过：音画同步（总帧=音频+片尾、无空隙、字幕全覆盖、锚点有效）、字幕规格、贴栏线、无重叠、组距≥48、素材不复用、无城市名、字号达标' + (process.argv.includes('--dom') ? '、填充率≤75%、行高≥1.3、无溢出' : ''));
