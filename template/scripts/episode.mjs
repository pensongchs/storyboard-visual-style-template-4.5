// 准备一期：读取 episodes/<名字>/ 下的音频 + 字幕，生成 src/demo/episode.json，并把音频拷进 public/episode/
//   npm run episode -- demo           （默认沿用上次的期名，首次为 demo）
// 输入文件（任意命名均可，按扩展名识别）：
//   音频：*.mp3 / *.m4a / *.aac / *.wav / *.flac / *.ogg（只取一个）
//   字幕：*.srt（句级，可选）+ *.json（Remotion Caption 逐词，可选）；至少要有一个
import {existsSync, readdirSync, readFileSync, writeFileSync, mkdirSync, copyFileSync, rmSync, statSync} from 'node:fs';
import {join, extname} from 'node:path';
import {spawnSync} from 'node:child_process';
import {ROOT} from './_util.mjs';
import {parseSrt, parseCaptions, cuesFromWords, layoutCue, clean, charTimes} from './lib/subs.mjs';
process.chdir(ROOT);
const OUT = join('src', 'demo', 'episode.json');
export const prepare = (name, {quiet = false} = {}) => {
  const dir = join('episodes', name);
  if (!existsSync(dir)) { console.error(`✗ 没有找到 ${dir}/（把音频和字幕放进去）`); process.exit(1); }
  const files = readdirSync(dir);
  const audio = files.find((f) => /\.(mp3|m4a|aac|wav|flac|ogg)$/i.test(f));
  const srt = files.find((f) => /\.srt$/i.test(f));
  const json = files.find((f) => /\.json$/i.test(f) && f !== 'episode.json');
  if (!audio) { console.error(`✗ ${dir}/ 里没有音频（mp3/m4a/aac/wav/flac/ogg）`); process.exit(1); }
  if (!srt && !json) { console.error(`✗ ${dir}/ 里没有字幕（.srt 或 Caption .json）`); process.exit(1); }
  const words = json ? parseCaptions(readFileSync(join(dir, json), 'utf8')) : [];
  const cues = srt ? parseSrt(readFileSync(join(dir, srt), 'utf8')) : cuesFromWords(words);
  const probe = (f) => { for (const run of [() => spawnSync(process.execPath, [join('node_modules', '@remotion', 'cli', 'remotion-cli.js'), 'ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', f], {encoding: 'utf8'}),
    () => spawnSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', f], {encoding: 'utf8', shell: process.platform === 'win32'})]) {
    const r = run(); if (r.status === 0 && parseFloat(r.stdout) > 0) return Math.round(parseFloat(r.stdout) * 1000); } return null; };
  const audioMs = probe(join(dir, audio));
  if (!audioMs) { console.error('✗ 读不到音频时长（ffprobe 不可用或文件损坏）'); process.exit(1); }
  const pub = join('public', 'episode'); rmSync(pub, {recursive: true, force: true}); mkdirSync(pub, {recursive: true});
  const ext = extname(audio).toLowerCase(); copyFileSync(join(dir, audio), join(pub, 'audio' + ext));
  // 视频素材时长（给慢放补足用）
  const clips = {}; const stock = join('public', 'media', 'stock');
  if (existsSync(stock)) for (const f of readdirSync(stock)) if (/\.(mp4|mov|webm)$/i.test(f)) { const d = probe(join(stock, f)); if (d) clips[`media/stock/${f}`] = d; }
  const out = {
    name, audio: `episode/audio${ext}`, audioMs, hasWords: words.length > 0,
    cues: cues.map((c, i) => { const t = clean(c.text); const ct = charTimes({...c, text: t}, words);
      return {i: i + 1, startMs: c.startMs, endMs: c.endMs, text: t, cs: ct.s}; }),
    subs: cues.flatMap((c) => layoutCue(c, words)),
    clips,
  };
  writeFileSync(OUT, JSON.stringify(out));
  if (!quiet) console.log(`✓ 本期「${name}」：音频 ${(audioMs / 1000).toFixed(2)}s，${out.cues.length} 句字幕 → ${out.subs.length} 条显示，${words.length ? '有' : '无'}逐词时间 → ${OUT}`);
  return out;
};
/** 其他脚本调用：沿用当前期名，音频没拷贝或输入更新过就重建 */
export const ensureEpisode = () => {
  let name = 'demo'; let stale = true;
  if (existsSync(OUT)) { try { const j = JSON.parse(readFileSync(OUT, 'utf8')); name = j.name || name;
    const dir = join('episodes', name); const t = statSync(OUT).mtimeMs;
    stale = !existsSync(join('public', j.audio || '')) || readdirSync(dir).some((f) => statSync(join(dir, f)).mtimeMs > t); } catch {} }
  return stale ? prepare(name, {quiet: false}) : JSON.parse(readFileSync(OUT, 'utf8'));
};
if (process.argv[1] && process.argv[1].endsWith('episode.mjs')) {
  const a = process.argv.slice(2).find((x) => !x.startsWith('--'));
  if (a) prepare(a); else ensureEpisode();
}
