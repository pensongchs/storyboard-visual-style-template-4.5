// 演示片脚本（终版）：城市中性；数字均为示例。
// 需要显示城市时，给镜头加 city: '某市'（只作栏目行前缀），不要写进标题/标签。
import type {Shot} from '../style/types.ts';
const S = (f: string) => `media/stock/${f}`;
const G = (f: string) => `media/gen/${f}`;

/** 字幕开关：show=是否烧录字幕，highlight=当前词沙金高亮（需逐词时间）。渲染时也可用 --no-subs / --no-highlight 覆盖 */
export const SUBTITLE = {show: true, highlight: true};
/** 每镜 at = 从哪句字幕开始（时长自动 = 到下一镜开始），anchors = 动效在哪个词上到位 */
export const SHOTS: Shot[] = [
  {id: 'S01', layout: 'titleFloat', at: {cue: 1}, kicker: '楼市观察 · 示例片',
    bg: {src: S('coverr_evening_coast.mp4'), video: true, dark: 0.48},
    data: {chips: [{t: '买房必看', tone: 'gold'}, {t: '三笔账'}],
      line1: '买房之前', line2: '先算清三笔账',
      sub: '首付、月供、隐性成本，一笔都不能漏',
      media: {src: G('waterfront_dusk.jpg'), label: '江景天际线', tag: '氛围'},
      callout: '先算账，{再看房}', icon: '▲'}},

  {id: 'S02', layout: 'bareNumber', at: {cue: 7}, anchors: {count: '30.6'}, kicker: '第一笔账 · 首付',
    title: '首付不是总价的{三成}那么简单',
    bg: {src: S('mixkit_shanghai_river.mp4'), video: true, dark: 0.55},
    data: {chip: '示例 · 100㎡', label: '首付款约', value: 30.6, dec: 1, unit: '万',
      formula: '总价 {102 万} × 首付比例 {30%}',
      chips: [{t: '首套可降至 15%'}, {t: '二套更高', tone: 'coral'}],
      media: {src: G('downpayment.jpg'), label: '钥匙 · 首付概念', tag: '概念图'}}},

  {id: 'S03', layout: 'splitVs', at: {cue: 12}, anchors: {L: '1.12', R: '0.86'}, kicker: '第一笔账 · 单价',
    title: '同样预算，{新房} vs {二手}',
    bg: {src: S('mixkit_hk_illuminated.mp4'), video: true, blur: 4, dark: 0.55},
    data: {winner: 'R',
      L: {media: {src: G('new_vs_used.jpg'), label: '新房外立面', tag: '新房'}, label: '新房均价', value: 1.12, dec: 2, unit: '万/㎡', chip: {t: '交付约 2 年', tone: 'coral'}},
      R: {media: {src: G('interior_warm.jpg'), label: '二手现房内景', tag: '二手'}, label: '二手均价', value: 0.86, dec: 2, unit: '万/㎡', chip: {t: '便宜 23%', tone: 'green'}}}},

  {id: 'S04', layout: 'timeline', at: {cue: 16}, anchors: {s0: '网签', s1: '银行', s2: '审批', s3: '抵押', note: '四步'}, kicker: '第二笔账 · 贷款',
    title: '房贷审批，{四步}走完',
    bg: {src: S('mixkit_city_night_aerial_river.mp4'), video: true, dark: 0.58},
    data: {steps: [
      {t: '网签备案', s: '合同上传住建系统', chip: '第 1 天'},
      {t: '银行面签', s: '夫妻双方到场签字', chip: '第 3 天'},
      {t: '审批放款', s: '征信流水逐项核查', chip: '约 2 周'},
      {t: '抵押登记', s: '办完才算真正放款', chip: '约 1 月'}],
      note: {t: '全流程约 {1 个月}，留足缓冲'}}},

  {id: 'S05', layout: 'ringFeature', at: {cue: 22}, anchors: {ring: '71.4', a: '4368'}, kicker: '第二笔账 · 月供',
    title: '每月要还多少，{先算}再买',
    bg: {src: S('mixkit_city_night_approach.mp4'), video: true, dark: 0.58},
    data: {media: {src: G('mortgage.jpg'), label: '月供 · 概念图', tag: '月供'},
      ring: {ratio: 0.7, label: '贷款占总价', value: '70%', note: '贷款\n{71.4 万}'},
      a: {k: '每月还款', value: 4368, sep: true, unit: '元', s: '30 年 · 等额本息'}}},

  {id: 'S06', layout: 'quoteStack', at: {cue: 25}, anchors: {r0: '契税', r1: '物业', r2: '装修和家电', warn: '最容易'}, kicker: '第三笔账 · 隐性成本',
    bg: {src: G('hidden_costs.jpg'), blur: 8, dark: 0.52},
    data: {quote: '三项隐性成本\n最容易漏算', sub: '签合同前，逐项问清',
      rows: [
        {t: '契税与维修基金', s: '示例：约 1.5 万', k: '一次性'},
        {t: '物业费与停车位', s: '示例：每月约 500 元', k: '长期'},
        {t: '装修与家电', s: '示例：约 15 万', k: '大头'}],
      warn: '漏算一项，预算超{十几万}'}},

  {id: 'S07', layout: 'bareNumber', at: {cue: 29}, anchors: {count: '15万'}, kicker: '第三笔账 · 装修',
    title: '装修预算，按{面积}估',
    bg: {src: S('mixkit_guangzhou_pearl.mp4'), video: true, dark: 0.55},
    data: {chip: '示例 · 100㎡', label: '装修 + 家电约', value: 15, unit: '万',
      formula: '{100㎡} × {1500 元/㎡}',
      chips: [{t: '精装房省一半'}, {t: '老房水电另算', tone: 'coral'}],
      media: {src: G('renovation.jpg'), label: '装修现场概念', tag: '装修'}}},

  {id: 'S08', layout: 'waitVs', at: {cue: 31}, anchors: {L: '两年', R: '现房贵'}, kicker: '选择 · 期房还是现房',
    title: '{期房}便宜，{现房}安心',
    bg: {src: S('coverr_sunset_towers.mp4'), video: true, dark: 0.55},
    data: {
      L: {media: {src: S('mixkit_city_night_skyscrapers.mp4'), video: true, label: '在建 · 期房意象', tag: '期房'}, label: '等待交付', value: 24, unit: '个月', chip: {t: '烂尾风险', tone: 'coral'}},
      R: {media: {src: S('mixkit_guangzhou_lights.mp4'), video: true, label: '江景现房意象', tag: '现房'}, label: '等待交付', value: 0, unit: '个月', chip: {t: '所见即所得', tone: 'green'}}}},

  {id: 'S09', layout: 'triadSoft', at: {cue: 35}, anchors: {c0: '30.6', c1: '4368', c2: '17万', note: '50万'}, kicker: '总结 · 三笔账',
    title: '三笔账，{一张表}算清',
    bg: {src: S('mixkit_skyscraper_panorama.mp4'), video: true, dark: 0.58},
    data: {cols: [
      {k: '首付', value: 30.6, dec: 1, unit: '万', s: '一次付清'},
      {k: '月供', value: 4368, sep: true, unit: '元', s: '每月还款'},
      {k: '隐性', value: 17, unit: '万', s: '税费+装修'}],
      note: {t: '买房前，至少备好 {50 万}'}}},

  {id: 'S10', layout: 'outroAir', at: {cue: 40}, anchors: {cta: '关注'},
    bg: {src: G('outro_windows.jpg'), dark: 0.4},
    // 片尾按文案排版；如需出镜角色/账号名，加 character: 'media/xxx.png'、account: '…'（可选，默认无）
    data: {eyebrow: '本期总结', line: '首付 · 月供 · 隐性成本\n{三笔账}算清再出手', cta: '关注我，下期讲{贷款避坑}'}},
];
