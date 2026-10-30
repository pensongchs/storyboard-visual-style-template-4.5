/** 新 MG 动画库（与旧版式组件分开）。check-layout 读取这份纯数据。 */
export type MgId =
  | 'flipCount' | 'gauge' | 'barChart' | 'lineChart'
  | 'pinMap' | 'floorPlan' | 'checkCross' | 'typeLine';

export type MgInfo = {
  id: MgId;
  name: string;
  /** 一期里同一种最多出现几次 */
  max: number;
  /** 适合讲什么 */
  use: string;
};

export const MG_LIB: MgInfo[] = [
  {id: 'flipCount', name: '翻牌计数', max: 2, use: '总价、首付、月供这种需要「数字在转」的关键金额'},
  {id: 'gauge', name: '仪表盘', max: 2, use: '占比、达成率、贷款成数，要一根指针而不是整圆'},
  {id: 'barChart', name: '柱状生长', max: 2, use: '两三笔账、几个方案并排比高低'},
  {id: 'lineChart', name: '折线生长', max: 2, use: '价格、利率、租金随时间的走势'},
  {id: 'pinMap', name: '区位连线', max: 2, use: '小区和地铁、学校、商场的相对位置'},
  {id: 'floorPlan', name: '户型描线', max: 2, use: '户型结构、动线、哪一间是亮点'},
  {id: 'checkCross', name: '对勾对照', max: 2, use: '该做和不该做、算进去和容易漏的两项对照'},
  {id: 'typeLine', name: '逐字高亮', max: 2, use: '一句结论、片尾金句，字逐个出现'},
];

export const MG_IDS = new Set(MG_LIB.map((m) => m.id));
export const mgInfo = (id: string) => MG_LIB.find((m) => m.id === id);
