# 素材来源（只用可商用的免费在线素材）

仓库**不提交视频文件**。运行 `npm run stock`（或 `npm run setup`）会按 `stock.json` 自动下载到本目录。

| 文件 | 用途 | 来源页面 | 直链 | 许可 |
|---|---|---|---|---|
| coverr_evening_coast.mp4 | S01 背景（海岸黄昏航拍）。Coverr 无稳定直链：自动改下 Mixkit #42349 同名保存；想要原片请到页面手动下载覆盖 | https://coverr.co/videos/evening-city-landscape | （无直链）替代：https://assets.mixkit.co/videos/42349/42349-1080.mp4 | Coverr Free Commercial |
| coverr_sunset_towers.mp4 | S08 背景（夕阳高楼）。自动改下 Mixkit #42351 同名保存；原片请手动下载覆盖 | https://coverr.co/videos/skyscrapers-in-buenos-aires | （无直链）替代：https://assets.mixkit.co/videos/42351/42351-1080.mp4 | Coverr Free Commercial |
| mixkit_shanghai_river.mp4 | S02 背景 1280×720 | https://mixkit.co/free-stock-video/20106/ | https://assets.mixkit.co/videos/20106/20106-720.mp4 | Mixkit Stock Video Free License |
| mixkit_hk_illuminated.mp4 | S03 背景 1280×720 | https://mixkit.co/free-stock-video/30959/ | https://assets.mixkit.co/videos/30959/30959-720.mp4 | Mixkit Stock Video Free License |
| mixkit_city_night_aerial_river.mp4 | S04 背景 | https://mixkit.co/free-stock-video/42353/ | https://assets.mixkit.co/videos/42353/42353-1080.mp4 | Mixkit Stock Video Free License |
| mixkit_city_night_approach.mp4 | S05 背景 | https://mixkit.co/free-stock-video/42350/ | https://assets.mixkit.co/videos/42350/42350-1080.mp4 | Mixkit Stock Video Free License |
| mixkit_guangzhou_pearl.mp4 | S07 背景 1280×720 | https://mixkit.co/free-stock-video/31000/ | https://assets.mixkit.co/videos/31000/31000-720.mp4 | Mixkit Stock Video Free License |
| mixkit_skyscraper_panorama.mp4 | S09 背景 | https://mixkit.co/free-stock-video/42355/ | https://assets.mixkit.co/videos/42355/42355-1080.mp4 | Mixkit Stock Video Free License |
| mixkit_city_night_skyscrapers.mp4 | 镜内媒体框 | https://mixkit.co/free-stock-video/42342/ | https://assets.mixkit.co/videos/42342/42342-1080.mp4 | Mixkit Stock Video Free License |
| mixkit_guangzhou_lights.mp4 | 镜内媒体框 1280×720 | https://mixkit.co/free-stock-video/31098/ | https://assets.mixkit.co/videos/31098/31098-720.mp4 | Mixkit Stock Video Free License |

说明：
- Mixkit 素材使用 Mixkit Stock Video Free License，可免费商用、不需要署名；不允许单独转售素材本身。
- 两条 Coverr 素材没有稳定的直链，所以下载脚本会改下表中的 Mixkit 替代片，并按同名保存，版式完全不受影响。想要和预览图一致，请打开页面手动下载，覆盖同名文件即可。
- 概念图在 `../gen/`，是 AI 生成的示意图，画面上标了「概念图」。
- 学员换成自己城市的素材时，必须保证**视频时长 ≥ 起点(trim) + 镜头时长 + 0.5 秒**，否则镜头末尾画面会停住，`npm run check` 会报错。
