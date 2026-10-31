# 渲染选型台：来源核查

核查日期：2026-10-29。以下为候选目录，不代表用户已选定任何平台。未购买订阅、安装插件或调用付费服务。

## 素材库候选

| 素材库 | 免费范围与许可 | 在本页适合怎样比较 | 官方依据 |
|---|---|---|---|
| Poly Haven | 可下载资产为 CC0；网站内容、API 与插件服务另有条款 | 材质、实拍 HDRI；可作为实际替换样本 | [许可](https://polyhaven.com/license)、[材质](https://polyhaven.com/textures)、[HDRI](https://polyhaven.com/hdris) |
| ambientCG | 可下载资产采用 CC0 1.0，无强制署名要求 | 金属、塑料、橡胶等 PBR；已有项目资产可复用 | [许可](https://docs.ambientcg.com/license/)、[素材](https://ambientcg.com/list) |
| CGBookcase | 官网明确纹理为 CC0 1.0，免费使用；不是 cgbook.com | 本页新增两套完整 1K PBR，供实际替换 | [许可与目录](https://www.cgbookcase.com/textures)、[作者介绍](https://www.dorianzgraggen.com/projects/cgbookcase/) |
| Blendkit（原 BlenderKit） | 有免费与 Full 素材；逐项区分 CC0 与 Royalty Free，不能一概称为 CC0 | 官方浏览及 Blender 插件拖拽；本页不分发未经逐项核查的素材 | [官网](https://www.blendkit.com/)、[许可](https://www.blendkit.com/docs/licenses/)、[许可 FAQ](https://www.blendkit.com/docs/licenses/licensing-faq/) |
| Poliigon | 有免费素材，可用于个人和商用创作；为专有许可。可提取贴图、场景对外分发及 AI/ML 使用有限制 | 保留官方免费目录入口；未导入到本页材质替换器 | [免费目录](https://www.poliigon.com/free)、[许可说明](https://help.poliigon.com/en/articles/8749749-asset-use-licensing)、[完整条款](https://www.poliigon.com/terms) |
| Adobe Substance 3D Assets | 官方有 Free assets 筛选及订阅资源；使用 Adobe 专有许可，禁止让第三方单独提取资产 | 适合后续参数化材质和精修评估；本页只提供官方入口 | [免费筛选](https://substance3d.adobe.com/assets/allassets?assetType=substanceMaterial&free=true)、[产品许可](https://www.adobe.com/go/substance3dassets) |

Blendkit 的部分教程仍写“所有材质免费”，但当前官网区分 Free/Full 计划，故本页应按具体资产显示可用性，避免套用旧描述。未核实各平台本地币种价格，不显示未经核实的数值。

## CGBookcase 已下载样本

下载范围仅限以下两套 1K 素材，保留原始 ZIP 与原图，未改写已有模型或材质。

### Brushed Iron 01

- 来源：https://www.cgbookcase.com/textures/brushed-iron-01
- ZIP：https://cgbookcase-volume.b-cdn.net/t/BrushedIron01_MR_1K.zip
- 官网预览：https://cdn.cgbookcase.cloud/file/cgbookcase/textures/renders/bg_white/720w/Brushed_iron_01_default.jpg
- 本地目录：`assets/cgbook/BrushedIron01/`
- 文件：`BrushedIron01_1K_BaseColor.png`、`BrushedIron01_1K_Metallic.png`、`BrushedIron01_1K_Normal.png`、`BrushedIron01_1K_Roughness.png`、`BrushedIron01_1K_Height.png`。

### Painted Metal 03

- 来源：https://www.cgbookcase.com/textures/painted-metal-03
- ZIP：https://cgbookcase-volume.b-cdn.net/t/PaintedMetal03_MR_1K.zip
- 官网预览：https://cdn.cgbookcase.cloud/file/cgbookcase/textures/renders/bg_white/720w/Painted_metal_03_default.jpg
- 本地目录：`assets/cgbook/PaintedMetal03/`
- 文件：`PaintedMetal03_1K_BaseColor.png`、`PaintedMetal03_1K_Metallic.png`、`PaintedMetal03_1K_Normal.png`、`PaintedMetal03_1K_Roughness.png`、`PaintedMetal03_1K_Height.png`、`PaintedMetal03_1K_AO.png`。

两套官网都注明 Normal 为 DirectX。Three.js 的切线空间法线默认按 OpenGL 方向；导入时需反转 Y（例如 `normalScale.y = -strength`），并在页面导出选择记录中保留这一信息。原始下载为 PNG，并非 JPEG。

## 预览实现复用判断

- 当前项目 `YL-A1-3D-Simulator/node_modules/three/package.json` 实际版本为 `0.186.0`。
- 现有 `实验箱重构/实验箱照片重建/studio-source.js` 已使用 GLTFLoader、OrbitControls、HDRLoader 和材质环境光照，可复用这些受支持入口，无须增加新渲染依赖。
- [Three.js 官方仓库](https://github.com/mrdoob/three.js)持续维护；[MIT 许可](https://github.com/mrdoob/three.js/blob/dev/LICENSE)允许使用和修改，分发时保留许可与版权声明。
- [官方 GLTFLoader 文档](https://threejs.org/docs/pages/GLTFLoader.html)列出 glTF 2.0、材质扩展及 register 插件扩展点。本次不实现新的加载器或 PBR 渲染器。
- 本页浏览器预览用于快速选材，不能冒充 Blender Cycles 的真实输出；材质最终是否符合实物仍要在目标模型、固定灯光及 Blender 中核对。

## 搜索边界

读取了本地技能、项目已有代码及安装版本，查询了官方站点与 GitHub 官方仓库。由于已有依赖满足本次需求，未遍历 npm/PyPI 或安装其他依赖。上述许可摘要用于透明呈现候选差异；具体交付应按选择的资产、账号和最终用途再次核对。

## 全量目录升级（2026-10-29）

- 用户已授权执行“完整目录 + 按需缓存 + 可选批量离线”。本轮同步 Poly Haven 869 套、ambientCG 2,037 套材质；没有默认下载所有贴图。CGBookcase 保持两套样本。
- [Poly Haven 官方目录 API](https://api.polyhaven.com/assets?t=textures)、[官方文档与条款](https://github.com/Poly-Haven/Public-API)：消费公开接口，使用统一自定义 User-Agent 与页面来源署名；未复制其 AGPL 服务代码。
- [ambientCG v3 assets 文档](https://docs.ambientcg.com/api/v3/assets)、[实际接口](https://ambientcg.com/api/v3/assets?type=material&limit=1&include=title,downloads,thumbnails)：按 limit=500 / offset 获取全部材质；include 为 title,tags,downloads,thumbnails,maps。官方缩略图许可见既有 ambientCG 许可链接。
- Poly Haven `/files/<id>` 返回各通道不同分辨率的下载 URL、长度与 MD5；ambientCG 返回 JPG ZIP 的属性及长度。通道按实际存在情况接入，不把缺失通道伪造为已提供。
- 下载参考设计核查：`alvarognnzz/ambientcg-downloader` 未识别清晰 LICENSE，未采用；`VenitStudios/AmbientCG` 是 Godot 插件，环境不匹配。复用 Python 标准库 urllib、zipfile、threading、并使用现有 Pillow 生成缩略图，没有新增下载框架依赖。
- 目录属于有时间点的本地快照；页面可主动同步。既有条目数量不等于承诺所有分辨率、所有未来新增条目均能下载。

## 本页新增 Poly Haven 样本

接入 `metal_plate`、`metal_plate_02`、`blue_metal_plate` 三套 1K 贴图。来源分别为 `https://polyhaven.com/a/<asset-id>`；实际下载 URL 保存在 `catalog.json` 的 `downloads`。仅从官方 API 获取这三个样本的通道信息，没有抓取网站内容。缩略图使用资产颜色通道，不使用许可另计的网站示例渲染图。页面保留 Powered by Poly Haven 链接。

## 工作流与预览实现依据

- [Blender 官方渲染介绍](https://www.blender.org/features/rendering/)：Cycles 与 EEVEE 分工。
- [Blender 5.2 EEVEE 手册](https://docs.blender.org/manual/en/5.2/render/eevee/index.html)：实时预览。
- [Blender 5.2 Cycles 手册](https://docs.blender.org/manual/en/5.2/render/cycles/index.html)：路径追踪渲染。
- Three.js 官方 r186 文档已通过 Context7 核对纹理重复、色彩空间和材质贴图连接；本地代码依照已安装的 0.186.0 使用 GLTFLoader、HDRLoader、MeshPhysicalMaterial 和 OrbitControls。
- 部分 Blender 手册直读受限，渲染能力说明使用官方站点搜索索引及官方 features 页面交叉核查；未据此宣称本页运行了 Blender 渲染。


## 实时摄影棚细纹修正（2026-10-30）

复用已安装 Three.js 0.186.0（MIT）的 RoomEnvironment、EffectComposer、RenderPass、GTAOPass、OutputPass 和 Reflector，未新增依赖。通过 Context7 核对官方 r186 文档，并直接核对本地同版本 bumpmap shader 与 GTAOPass 的参数和输出枚举。特别注意：本版本 bump 导数归一化，不能直接沿用 Blender 米制 Distance。最终使用微表面法线，取消明显的高度褶皱。

assets/microfinish/grain_normal.png 与 grain_rough.png 是本项目生成的非颜色数据，不含第三方图像；build_microfinish.py 保留确定性生成过程。Foil003/Plastic001 的原始来源仍保留在 Blender 与导出资产中，网页版目前黑色涂层和绿色壳体由微表面数据替代，不再展示强褶皱。实物参照使用用户提供文件夹中的原始两张 JPG；没有将后处理 PNG 当成实物证据。


## 现成实拍环境与木桌复用（2026-10-30）

- [Aerodynamics Workshop](https://polyhaven.com/a/aerodynamics_workshop)：实拍工业车间，大窗日光，默认环境。
- [Industrial Workshop Foundry](https://polyhaven.com/a/industrial_workshop_foundry)：工业铸造车间，冷暖混合反射。
- [Studio Small 09](https://polyhaven.com/a/studio_small_09)：现成大型柔光箱摄影棚，提供不同形状的金属高光。
- [Poly Haven 资产许可](https://polyhaven.com/license)：上述 HDRI 均 CC0；使用官方公开 API /files/<id> 获取资产下载文件信息，没有复制网站示例渲染图。2K HDR 原文件及元数据、MD5 保存在 assets/environments/。
- 木桌 Canvas 纹理复用本项目 YL-A1-3D-Simulator/backup/index.original.html 中 Lu/Ru/Wu 的实现，wood-texture.js 保留出处；没有加载该页面中嵌入的整套 Three.js。保留原有 MIT Three.js 0.186.0，未新增依赖。
- 黑色金属微纹复用已有 ambientCG Metal009 的 NormalGL，保留原材质来源记录；采用独立微表面法线与较低强度，不使用 Foil003 的明显凹凸。

已查询 Three.js 官方 r186 文档中 DirectionalLight shadow、PMREMGenerator 和环境照明配置。现成完整实验室 3D 场景的检索结果未找到同时满足写实程度、许可与直接接入需求的更好候选，因此本轮实际采用以上三套实拍 HDRI，不宣称已下载完整实验室模型。

## 交付版表面修正（2026-10-30）

箱壳撤下高重复周期竖纹，采用已有 CC0 Metal009 的极低强度法线和适度各向异性反射，保留铝金属 BRDF 与轮廓；法线使用 mipmap 与各向异性纹理过滤。云台哑光支架、夹爪和黑色涂层加入已有 CC0 Plastic001 的低强度真实表面浅划痕，不统一作用于玻璃或抛光金属。Portable Windows 版包含 CPython 3.13.16 与 Pillow 的运行依赖和许可证。
