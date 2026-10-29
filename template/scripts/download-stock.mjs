// 下载示例用的免费素材视频到 public/media/stock（Windows / macOS / Linux 通用，Node ≥18 自带 fetch）
//   node scripts/download-stock.mjs [--force]
// 清单见 public/media/stock/stock.json 与 SOURCES.md。仓库不提交视频文件。
import {readFileSync, existsSync, statSync, createWriteStream, renameSync, rmSync} from 'node:fs';
import {join} from 'node:path';
import {Readable} from 'node:stream';
import {pipeline} from 'node:stream/promises';
import {ROOT} from './_util.mjs';
const dir = join(ROOT, 'public', 'media', 'stock');
const list = JSON.parse(readFileSync(join(dir, 'stock.json'), 'utf8'));
const force = process.argv.includes('--force');
let fail = 0;
for (const it of list) {
  const dst = join(dir, it.file);
  if (!force && existsSync(dst) && statSync(dst).size > 100000) { console.log(`✓ 已有 ${it.file}`); continue; }
  const urls = [it.url, it.fallback].filter(Boolean); let ok = false;
  for (const u of urls) {
    try {
      process.stdout.write(`↓ ${it.file} ← ${u} … `);
      const res = await fetch(u, {headers: {'User-Agent': 'Mozilla/5.0'}, redirect: 'follow'});
      if (!res.ok) throw new Error('HTTP ' + res.status);
      await pipeline(Readable.fromWeb(res.body), createWriteStream(dst + '.part'));
      renameSync(dst + '.part', dst); ok = true;
      console.log(`${(statSync(dst).size / 1e6).toFixed(1)} MB${u === it.fallback ? '（替代素材）' : ''}`); break;
    } catch (e) { console.log('失败 ' + e.message); rmSync(dst + '.part', {force: true}); }
  }
  if (!ok) { fail++; console.log(`  ✗ 请手动下载：${it.page} → 保存为 public/media/stock/${it.file}`); }
}
console.log(fail ? `✗ ${fail} 个素材未下载` : '✓ 素材已就绪');
process.exit(fail ? 1 : 0);
