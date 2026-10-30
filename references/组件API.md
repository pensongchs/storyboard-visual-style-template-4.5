# 组件 API（src/style/components.tsx）

所有尺寸都基于 1920×1080。`r: Rect = {x,y,w,h}` 一律来自 `layouts.ts`。`start` 是入场开始的帧（30fps），`from` 是入场方向：`'up'|'left'|'right'|'scale'|'fade'|'blur'|'none'`。

## 基础
| 组件 | 用途 | 关键参数 |
|---|---|---|
| `Fonts` | 注册阿里巴巴普惠体 Black（标题）、阿里健康体（正文）、Arial Bold（数字） | — |
| `Backdrop` | 背景（视频或图片）：提亮、压暗、上下渐变压暗；静图会缓慢推近 | `src video blur dark trimStart` |
| `LiveVideo` / `LiveFrameCtx` | 不受镜头末尾定格影响、一直播放的视频（防顿帧的核心）；素材不够长时按 `ClipRateCtx` 慢放 | `src style trimStart` |
| `Subtitles` | 烧录字幕（磨砂胶囊 + 当前词高亮），读 episode.json | `ep opts={show,highlight}` |
| `AnchorCtx` | 本镜动效锚点（帧），版式里用来决定元素入场时刻 | — |
| `Kicker` | 左上角栏目行（短金线加文字） | `text` |
| `Headline` | 标题行，`{…}` 部分为金色 | `text start` |
| `GoldText` | 把行内 `{…}` 渲染成金色 | `text` |
| `ExampleMark` | 右上角「* 数据为示例」 | — |
| `GlassCard` | 磨砂玻璃卡（尽量少用，避免满屏都是卡片） | `r start tone from dim radius pad` |
| `MediaFrame` | 媒体框（图片或视频），描边在框内侧，可带角标和图注 | `r start src video label tag trimStart from fit soft` |
| `Chip` | 胶囊标签，有 `gold / glass / coral / green` 四种色调，自动留 25% 余白 | `start tone size` |
| `Count` | 数字滚动 | `to start dec sep` |
| `Bar` | 比例条 | `ratio start hi` |

## 轻量 MG（优先用这些，避免满屏都是卡片）
| 组件 | 视觉 | 关键参数 |
|---|---|---|
| `BareNumber` | 不加卡片的超大数字和单位，可以在 children 里放胶囊 | `r start value unit dec sep label gold size flow` |
| `FloatLabel` | 悬浮的小标签 | `r start text tone` |
| `Timeline` | 横向时间轴，焦点高亮 | `r start steps active` |
| `IconRow` | 编号条目（编号 + 标题 + 说明 + 右侧胶囊），当前行会高亮 | `r start idx title sub tip active` |
| `QuoteBlock` | 引号大字观点 | `r start text sub` |
| `SoftCallout` | 半透明提示条（金色或珊瑚色），宽度贴合内容 | `r start text tone icon h` |
| `ProgressRing` | 圆环比例 | `cx cy size start ratio label value` |
| `ArrowConnector` | 连接箭头（只需要和两边保持 24px） | `x y w start` |
| `HighlightBar` | 竖向高亮条 | `x y h start` |
| `UnderlineDraw` | 金线从左往右划出 | `x y w start` |
| `SplitType` | 两行对比大字 | `r start line1 line2 sub` |
| `StatPill` | 数据胶囊卡（键、数字、说明），底色不透明 | `r start k value unit dec sep s hi from` |
| `FillMeter` | 横向金条，和第二处大数字的下划线错开 | `start ratio label?` |

## 检查标记（DOM 检查依赖这些属性，新写组件时也要加）
- `data-role="body"`：正文或说明文字，字号必须 ≥34。
- `data-fit="名字"` 加子元素 `data-fit-text`：容器里的文字宽度不能超过容器的 75%。
- `data-deco`：纯装饰的字形（例如大引号），不做版式区检查。

## 令牌（tokens.ts）
- 颜色：墨黑 `#121110`、暖白 `#F4EEE4`、金 `#D9B26F` / 高光 `#F3D79E`、珊瑚 `#E0715C`（风险）、绿 `#8DB89A`（利好）。
- 字号：kicker 30、title 80、heroTitle 92、number 150、quote 60、rowTitle 40、body 34、label 28、chip 28、ringValue 52。
- 动效（帧）：enter 20、stagger 6、chip 14、count 30、focus 10、freeze 30。
- 转场（transitions.tsx）：pushBlur 12 → crossfade 10 → maskWipe 14 → lightSweep 12 → goldCut 11，按顺序轮换。背景本身不糊。
