---
name: 小滕分镜风格4.5版本
description: 用 Remotion 做 1920×1080 横屏的「深色电影感 + 暖金点缀 + 轻量 MG」知识科普分镜视频（房产、财经、城市科普等）。适用场景：用户给一段口播文案或一期选题，想要小滕风格（4.5 / 5.0 样板）的分镜画面、定格图或成片；或者要在不同城市、不同期号之间复用这套风格。包含版式选择思路、12 栏网格、自动排版检查、防顿帧转场，可在 Windows 和 Mac 上直接运行。
---

# 小滕分镜风格 4.5 版本

**这套风格的样子**：背景是深色、提亮过的城市实拍视频，前景是暖白文字加一处金色强调，用不加卡片的大数字、时间轴、圆环、编号条目等轻量 MG 讲清楚一个点。每个镜头 5.5–7 秒。镜头之间用 8–15 帧的克制转场，背景视频全程不停。

预览图：`references/preview/联系表.jpg`（10 个镜头的总览），以及 `S01–S10.jpg`。

## 快速开始
```bash
cd template
npm run setup          # 优先复用已有的 node_modules，没有才 npm install；同时下载素材
npm run check          # 静态检查加 DOM 排版检查（全部 ✓ 才继续）
npm run stills         # 输出 out/stills/S01–S10.png 和 out/联系表.png
npm run render         # 输出 out/成片.mp4；只渲前 3 秒可以用 npm run render -- --frames=0-89
npm run studio         # 打开 Remotion Studio 预览
```
- 需要 Node ≥ 22.18（脚本直接 import .ts 文件）。Windows、macOS、Linux 都用同一套 Node 脚本，不依赖 bash。
- **复用依赖**：`setup` 会依次查找 ① 环境变量 `XT_SHARED_NODE_MODULES`，② 往上 6 层父目录里的 `node_modules`，③ 同级目录（例如你已经装好的其他小滕模板）里的 `node_modules`。只要 remotion、@remotion/*、react、react-dom 的版本和 package.json **完全一致**，就链接过来复用（Windows 用 junction，Mac 用符号链接），不用重新下载。都找不到才执行 `npm install`。想强制重新安装用 `node scripts/install.mjs --force-install`。
- 浏览器：Remotion 会自动下载 Chrome Headless Shell。如果网络不通，可以设置 `REMOTION_BROWSER=本机 Chrome 的可执行文件路径`。
- 字体：阿里巴巴普惠体和阿里健康体已经放在 `public/fonts`。Arial Bold 不能随包分发，`setup` 会从系统字体里复制一份；Mac 和 Windows 自带这个字体，系统里没有时会自动用 Helvetica 等字体代替。

## 做一期新视频的完整流程
1. **拆文案**：把口播稿按「一个镜头只讲一个点」拆成 8–12 段，每段 5.5–7 秒，大约 25–40 个字的口播。
2. **写镜头表**：每个镜头先判断内容类型，再按下面的「版式选择」挑版式，然后检查**相邻两个镜头没有用同一种版式和同一种主动画**。
3. **改 `template/src/demo/shots.ts`**：只改数据，不改坐标。字段说明见 `references/版式目录.md`。金色用 `{…}` 标出，每个标题最多一处。数字如果是示例数据，就在 chip 或 label 里写明「示例」。
4. **找素材**：放到 `public/media/stock` 或 `public/media/gen`，**同一个素材在一期视频里只能用一次**。视频时长要 ≥ trim + 镜长 + 0.5s。在 stock.json 和 SOURCES.md 里登记来源。
5. **`npm run check`**：会检查贴栏线、组距 ≥48、字号（正文 ≥34，标签 ≥26）、填充率 ≤75%、行高 ≥1.3、有没有溢出、有没有城市名、素材有没有重复、素材够不够长。报错就改数据，或者缩短文案，**不要关掉检查**。
6. **`npm run stills`**：逐张看定格图，确认每张都满足：主信息一眼能看到、只有一处金色、画面不挤、右侧 15% 和底部字幕区是空的。
7. **`npm run render`**：渲染成片，然后抽查转场处有没有顿帧（方法见下面「验收」）。

## 设计思路（Codex 照着这些就能复现风格）
### 1. 按内容类型选版式
| 文案在说什么 | 首选版式 | 备选 |
|---|---|---|
| 开场、提出问题 | titleFloat | — |
| 一个关键数字 | bareNumber | ringFeature（如果是比例） |
| A 和 B 对比 | splitVs | waitVs（对比的是时间或等待） |
| 流程、步骤 | timeline | mediaRows |
| 清单、注意事项 | quoteStack | mediaRows（有合适配图时） |
| 比例、占比 | ringFeature | bareNumber |
| 金句、观点 | quoteStack（引号） | titleFloat |
| 总结、三个数字 | triadSoft | — |
| 片尾、关注引导 | outroAir | — |

### 2. MG 要有变化
- 相邻两个镜头**不能**用同一种版式，主动画也不能一样（数字滚动、画线、圆环、条目焦点移动、左右对比，轮换着用）。
- 一期视频至少用到 6 种版式。同一种版式要重复用时，中间至少隔 2 个镜头，而且数据形态要不同（比如一个是金额、一个是面积单价）。
- 能不用卡片就不用：数字、时间轴、条目都直接放在背景上，只靠细描边和柔和阴影区分层次。全片最多 2 个镜头用玻璃卡。

### 3. 密度和留白
- 全部用 12 栏网格，元素贴栏线。独立的 MG 组之间 ≥48px，左右相邻的组之间空出一整栏。
- 文字宽度不超过容器的 75%。正文 ≥34px，标签和胶囊 ≥26px，标题 80px，主数字 150px。
- 每个镜头只有 1 个主信息加 2–3 个辅助信息，文字太多就拆成两个镜头。
- 右侧 288px 留给抖音按钮，底部 180px 留给字幕，这两块区域不放东西。

### 4. 亮度
- 背景提亮 `brightness(1.1)`，压暗层 = max(0.22, dark−0.16)，再加上下渐变，保证文字对比够、整体画面又不发闷。
- 只用暖色：金色表示强调，珊瑚色表示风险，绿色表示利好。一个镜头里最多出现两种强调色。

### 5. 节奏和转场
- 入场 20 帧，元素之间错开 6 帧，数字滚动 30 帧。镜头最后 30 帧**只定格前景**，背景视频继续播放。
- 转场时长 8–15 帧，按 pushBlur → crossfade → maskWipe → lightSweep 轮换，不用花哨的转场。
- 防顿帧有三条硬规则：① 视频一律用 `LiveVideo`（受 `LiveFrameCtx` 驱动）；② 每个 Sequence 设 `premountFor={30}`；③ 素材长度要够。详见规范 §9.9。

### 6. 城市中性
- 模板默认不写城市名，检查脚本会拦截。需要标城市时，只在镜头里加 `city: '某市'`，它只会显示为栏目行的前缀。
- 数字都标为「示例」，具体城市的真实数据由使用者自己填。

### 7. 片尾角色是可选的
- 默认没有角色，按文案排版，四周大留白。需要人物出镜时，加 `character: 'media/xxx.png'`（透明底 PNG），版式会自动变成左边角色、右边文字。

### 8. 在线素材规范
- 只用允许免费商用的素材库（Mixkit、Coverr、Pexels、Pixabay）。优先选城市夜景、航拍、江景、室内暖光这类画面，避免能认出具体楼盘或品牌的镜头。
- 1080p 优先，720p 可以接受（会被压暗、模糊）。用 `trim` 跳过片头的 logo 或抖动段。
- 概念图（钥匙、计算器、装修现场之类）可以用 AI 生成，压缩到 ≤150KB 的 JPG，放进 `public/media/gen`。
- 每个素材都要登记到 `stock.json`（url 和 fallback 两个地址），这样别人运行 `npm run stock` 就能下载齐全。

## 验收
- `npm run check` 全部 ✓，`npm run stills` 的定格图逐张看过。
- 顿帧检查（可选）：`npx remotion ffmpeg -i out/成片.mp4 -vf signalstats,metadata=print:key=lavfi.signalstats.YDIF -f null -`，不能出现连续 ≥2 帧 YDIF=0。

## 目录
- `template/`：完整的 Remotion 工程（`src/style` 是风格核心，`src/demo` 是示例片，`scripts` 是跨平台脚本）
- `references/风格设计规范.md`：完整规范（网格、字号、颜色、动效、检查规则）
- `references/版式目录.md`、`references/组件API.md`
- `references/preview/`：预览图
