# YL-A1 动作演示 · Three.js 实时摄影棚

这是亚龙 YL-A1 实验箱的公开动作演示页面。打开站点后可直接看到实时 3D 模型、实拍 HDRI 反射、细微表面法线和动作控制。

- 远景／中景／近景切换
- 机械臂搬运、云台升起、复位
- 十一组整齐爆炸拆解
- 三套 Poly Haven 实拍环境：车间、铸造车间、柔光摄影棚
- 细微磨砂、拉丝金属和轻微磨损，不使用密集周期性竖条纹
- `materials.html` 保留材质工作台与来源目录

页面使用 Three.js r186（MIT）实时渲染。它不使用 Cycles 路径追踪，因此拖动和动作不会因为逐帧累积而变成马赛克；最终 Cycles 成片仍属于 Blender 工程。

## 本地运行

```powershell
python -m http.server 8000
```

然后访问 `http://127.0.0.1:8000/index.html?view=detail&env=workshop#materials`。

## 许可

Three.js、Poly Haven、ambientCG、CGBookcase 等来源和许可见 [`SOURCES.md`](SOURCES.md)。模型和实拍参考照片属于本项目工程资料。
