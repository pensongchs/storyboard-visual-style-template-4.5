# 小滕分镜风格 4.5 版本

用 Remotion 做 1920×1080 知识科普分镜视频的模板和 Skill。整体是深色电影感背景、暖金点缀、轻量 MG，自带排版检查和防顿帧处理，可在 Windows 和 macOS 上使用。

![联系表](references/preview/联系表.jpg)

| | |
|---|---|
| ![S01](references/preview/S01.jpg) | ![S02](references/preview/S02.jpg) |
| ![S03](references/preview/S03.jpg) | ![S04](references/preview/S04.jpg) |
| ![S05](references/preview/S05.jpg) | ![S06](references/preview/S06.jpg) |
| ![S07](references/preview/S07.jpg) | ![S08](references/preview/S08.jpg) |
| ![S09](references/preview/S09.jpg) | ![S10](references/preview/S10.jpg) |

## 安装
需要 Node ≥ 22.18。
```bash
git clone https://github.com/pensongchs/storyboard-visual-style-template-4.5.git
cd storyboard-visual-style-template-4.5/template
npm run setup      # 优先复用已有依赖（环境变量 XT_SHARED_NODE_MODULES / 父目录 / 同级模板），没有才 npm install；同时下载视频素材
npm run check      # 排版检查
npm run stills     # 输出定格图和联系表
npm run render     # 输出 out/成片.mp4
```
作为 Skill 使用时，把整个仓库放进你的 skills 目录（例如 `~/.codex/skills/小滕分镜风格4.5版本`），然后对 Codex 说「用小滕分镜风格4.5版本做这期视频」。

## 复用依赖
如果你已经装过其他小滕模板，只要它们的 `node_modules` 里 remotion 4.0.484 和 react 19.2.7 的版本一致，`setup` 就会直接链接复用（Windows 用 junction，macOS 用符号链接），不会重新下载。也可以手动指定：
```bash
# macOS
XT_SHARED_NODE_MODULES=/path/to/node_modules npm run setup
# Windows PowerShell
$env:XT_SHARED_NODE_MODULES="D:\模板\node_modules"; npm run setup
```

## 文档
- [SKILL.md](SKILL.md)：工作流程和设计思路
- [风格设计规范](references/风格设计规范.md) · [版式目录](references/版式目录.md) · [组件 API](references/组件API.md)
- [素材来源](template/public/media/stock/SOURCES.md) · [第三方资源说明](NOTICE.md)
