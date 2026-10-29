// 渲染期 DOM 检查（仅 --props='{"check":true}' 时启用）：字号下限 / 文字填充率 / 行高 / 溢出 / 文字必须落在版式区内
import React, {useEffect, useState} from 'react';
import {continueRender, delayRender} from 'remotion';
import {MIN_FONT, RULE} from './tokens';
import type {Rect} from './grid.ts';

const textRects = (root: Element) => {
  const out: DOMRect[] = []; const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  let n: Node | null;
  while ((n = w.nextNode())) { if (!n.textContent?.trim()) continue; const r = document.createRange(); r.selectNodeContents(n);
    for (const x of Array.from(r.getClientRects())) if (x.width > 0) out.push(x); }
  return out;
};
const union = (rs: DOMRect[]) => rs.length ? {l: Math.min(...rs.map((r) => r.left)), r: Math.max(...rs.map((r) => r.right)), t: Math.min(...rs.map((r) => r.top)), b: Math.max(...rs.map((r) => r.bottom))} : null;
const blockOf = (el: Element): Element => { let e: Element | null = el; while (e && getComputedStyle(e).display.startsWith('inline')) e = e.parentElement; return e ?? el; };

export const DomCheck: React.FC<{id: string; zones: Record<string, Rect>}> = ({id, zones}) => {
  const [h] = useState(() => delayRender('domcheck'));
  useEffect(() => {
    (async () => {
      await (document as any).fonts.ready; await new Promise((r) => setTimeout(r, 300));
      const errs: string[] = []; const seenBlocks = new Set<Element>();
      const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT); let n: Node | null;
      while ((n = w.nextNode())) {
        const txt = n.textContent?.trim(); if (!txt) continue; const el = n.parentElement!; if (el.closest('style,script,[data-deco]')) continue;
        const cs = getComputedStyle(el); const fs = parseFloat(cs.fontSize);
        const body = !!el.closest('[data-role="body"]');
        if (fs < MIN_FONT.any - 0.5) errs.push(`字号过小 ${fs}px「${txt.slice(0, 12)}」`);
        else if (body && fs < MIN_FONT.body - 0.5) errs.push(`正文字号 ${fs}px < ${MIN_FONT.body}「${txt.slice(0, 12)}」`);
        const r = document.createRange(); r.selectNodeContents(n); const u = union(Array.from(r.getClientRects()) as DOMRect[]);
        if (u && !Object.values(zones).some((z) => u.l >= z.x - 6 && u.r <= z.x + z.w + 6 && u.t >= z.y - 6 && u.b <= z.y + z.h + 6))
          errs.push(`文字出版式区「${txt.slice(0, 12)}」@${Math.round(u.l)},${Math.round(u.t)}–${Math.round(u.r)},${Math.round(u.b)}`);
        const blk = blockOf(el); if (seenBlocks.has(blk)) continue; seenBlocks.add(blk);
        const rs = textRects(blk).sort((a, b) => a.top - b.top); let lines = 0, lb = -1e9;
        for (const x of rs) { if (x.top >= lb - 2) { lines++; lb = x.bottom; } else lb = Math.max(lb, x.bottom); }
        if (lines > 1) { const bcs = getComputedStyle(blk); const lh = bcs.lineHeight === 'normal' ? 1.2 : parseFloat(bcs.lineHeight) / parseFloat(bcs.fontSize);
          if (lh < RULE.lineHeight - 0.01) errs.push(`多行行高 ${lh.toFixed(2)} < ${RULE.lineHeight}「${(blk.textContent || '').slice(0, 12)}」`); }
      }
      document.querySelectorAll('[data-fit]').forEach((c) => {
        const box = c.getBoundingClientRect(); const target = c.querySelector('[data-fit-text]') ?? c; const u = union(textRects(target));
        if (!u) return; const ratio = (u.r - u.l) / box.width;
        if (ratio > RULE.fillMax + 0.005) errs.push(`填充率 ${(ratio * 100).toFixed(0)}% > ${RULE.fillMax * 100}%（${c.getAttribute('data-fit')}「${(c.textContent || '').slice(0, 12)}」）`);
        if (c.scrollWidth > c.clientWidth + 1 || c.scrollHeight > c.clientHeight + 1) errs.push(`容器溢出（${c.getAttribute('data-fit')}「${(c.textContent || '').slice(0, 12)}」）`);
      });
      console.log(`CHECK|${id}|${JSON.stringify(errs)}`);
      continueRender(h);
    })();
  }, []);
  return null;
};
