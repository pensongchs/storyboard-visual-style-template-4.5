// 跨平台小工具（Windows / macOS / Linux 通用，不依赖 bash）
import {existsSync, readFileSync} from 'node:fs';
import {join, dirname, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';
export const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
export const PKG = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8'));
export const REQUIRED = Object.assign({}, PKG.dependencies); // 必须完全一致的版本
export const pkgVersion = (nm, name) => { try { return JSON.parse(readFileSync(join(nm, name, 'package.json'), 'utf8')).version; } catch { return null; } };
/** node_modules 目录是否满足本模板（remotion 系列与 react 版本完全一致） */
export const compatible = (nm) => existsSync(nm) && Object.entries(REQUIRED).every(([n, v]) => pkgVersion(nm, n) === v);
/** 用本机 node 直接调 Remotion CLI（避免 npx / .cmd 差异） */
export const remotionCli = (args, opts = {}) => {
  const cli = join(ROOT, 'node_modules', '@remotion', 'cli', 'remotion-cli.js');
  if (!existsSync(cli)) { console.error('✗ 没找到依赖，请先运行 npm run setup'); process.exit(1); }
  return spawnSync(process.execPath, [cli, ...args], {cwd: ROOT, stdio: 'inherit', ...opts});
};
