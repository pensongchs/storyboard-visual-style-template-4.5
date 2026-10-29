// 一键安装（Windows / macOS / Linux）：复用已有依赖 → 否则 npm install → 补字体 → 下载素材
//   node scripts/install.mjs [--no-stock] [--force-install]
// 复用顺序：
//   1) 环境变量 XT_SHARED_NODE_MODULES（指向某个 node_modules 目录，或包含 node_modules 的模板目录）
//   2) 本模板的上级目录逐级向上找 node_modules（例如把模板放在「自媒体模板/」下，与 4.0 模板共用）
//   3) 上级目录里的兄弟模板（例如 ../4.0模板/node_modules、../5.0样板/node_modules）
// 版本必须与 package.json 完全一致（remotion 4.0.484、react 19.2.7 等）才会复用；
// 复用方式：macOS/Linux 建软链接，Windows 建目录联接（junction，无需管理员权限）。
import {existsSync, lstatSync, readdirSync, symlinkSync, copyFileSync, mkdirSync, rmSync, realpathSync} from 'node:fs';
import {join, dirname, resolve} from 'node:path';
import {spawnSync} from 'node:child_process';
import {ROOT, compatible, REQUIRED} from './_util.mjs';
const args = process.argv.slice(2);
const local = join(ROOT, 'node_modules');
const [maj, min] = process.versions.node.split('.').map(Number);
if (maj < 22 || (maj === 22 && min < 18)) console.warn(`⚠ 当前 Node ${process.versions.node}，建议 ≥ 22.18（检查脚本直接读取 .ts 文件）`);

const candidates = () => {
  const out = []; const env = process.env.XT_SHARED_NODE_MODULES;
  if (env) { const p = resolve(env); out.push(p.endsWith('node_modules') ? p : join(p, 'node_modules')); }
  let d = dirname(ROOT);
  for (let i = 0; i < 6; i++) {
    out.push(join(d, 'node_modules'));
    try { for (const e of readdirSync(d, {withFileTypes: true})) if (e.isDirectory() && join(d, e.name) !== ROOT) out.push(join(d, e.name, 'node_modules')); } catch {}
    const up = dirname(d); if (up === d) break; d = up;
  }
  return [...new Set(out)];
};

let done = false;
if (!args.includes('--force-install')) {
  if (compatible(local)) { console.log('✓ 本地 node_modules 已满足版本要求，跳过安装'); done = true; }
  else for (const c of candidates()) {
    if (!compatible(c)) continue;
    const target = realpathSync(c);
    if (existsSync(local) || (() => { try { lstatSync(local); return true; } catch { return false; } })()) rmSync(local, {recursive: true, force: true});
    symlinkSync(target, local, process.platform === 'win32' ? 'junction' : 'dir');
    console.log(`✓ 复用已有依赖：${target}\n  （已建立${process.platform === 'win32' ? '目录联接' : '软链接'} node_modules → 该目录，不重复下载）`);
    done = true; break;
  }
}
if (!done) {
  console.log('… 未找到可复用的依赖（需要 ' + Object.entries(REQUIRED).map(([k, v]) => `${k}@${v}`).join(', ') + '），开始 npm install');
  const r = spawnSync(process.platform === 'win32' ? 'npm.cmd' : 'npm', ['install', '--no-audit', '--no-fund'], {cwd: ROOT, stdio: 'inherit', shell: process.platform === 'win32'});
  if (r.status !== 0) { console.error('✗ npm install 失败'); process.exit(1); }
}

// 数字字体：Arial Bold 不随仓库分发（微软授权），从本机系统字体复制；找不到则自动回退到系统无衬线字体
const fontDst = join(ROOT, 'public', 'fonts', 'Style40-Arial-Bold.ttf');
if (!existsSync(fontDst)) {
  const src = [process.env.XT_ARIAL_BOLD, 'C:\\Windows\\Fonts\\arialbd.ttf', '/System/Library/Fonts/Supplemental/Arial Bold.ttf', '/Library/Fonts/Arial Bold.ttf',
    '/usr/share/fonts/truetype/msttcorefonts/Arial_Bold.ttf'].filter(Boolean).find((p) => existsSync(p));
  if (src) { mkdirSync(dirname(fontDst), {recursive: true}); copyFileSync(src, fontDst); console.log('✓ 数字字体：已从系统复制 Arial Bold'); }
  else console.log('ℹ 未找到 Arial Bold，数字将使用系统无衬线字体（可设 XT_ARIAL_BOLD=字体路径 后重跑）');
}
if (!args.includes('--no-stock')) {
  const r = spawnSync(process.execPath, [join(ROOT, 'scripts', 'download-stock.mjs')], {cwd: ROOT, stdio: 'inherit'});
  if (r.status !== 0) process.exit(r.status ?? 1);
}
console.log('\n✓ 安装完成。下一步：npm run check → npm run stills → npm run render');
