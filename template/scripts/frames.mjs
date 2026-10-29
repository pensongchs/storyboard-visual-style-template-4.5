import {SHOTS} from '../src/demo/shots.ts';
let t = 0; const out = [];
for (const s of SHOTS) { const d = Math.ceil(s.sec * 30); out.push(`${s.id}:${t + d - 1}`); t += d; }
console.log(out.join(' '));
