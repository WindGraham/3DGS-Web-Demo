# 3D Gaussian Splatting 实时漫游技术验证简报

**项目方向**：三维重建古迹名胜实现实时游览  
**验证场景**：Train（Tanks and Temples 数据集）  
**训练迭代**：30,000 steps  
**汇报人**：[你的名字]  
**日期**：2026年5月

---

## 1. 核心成果

基于 3D Gaussian Splatting（3DGS）实现了从多视图图像到实时可交互三维场景的完整 pipeline，并部署为 Web 端实时漫游 Demo。

- **模型规模**：1,078,186 个 3D 高斯椭球
- **模型大小**：约 514 MB（.ply 格式）
- **渲染方式**：WebGL 实时光栅化，无需 CUDA，浏览器直接运行
- **交互操作**：鼠标左键旋转、滚轮缩放、右键平移
- **部署状态**：已部署至服务器，支持外网访问（链接见文末）

## 2. 技术路线

```
多视图图像 → COLMAP 稀疏重建 → 3DGS 训练（30k iter）
                                   ↓
                         WebGL Viewer 实时渲染
                                   ↓
                         浏览器端交互式漫游
```

| 模块 | 技术选型 | 说明 |
|------|----------|------|
| 三维表示 | 3D Gaussian Splatting | 显式高斯表示，训练快、渲染快 |
| 训练框架 | INRIA gaussian-splatting (PyTorch + CUDA) | 官方实现，Colab / 本地 GPU 训练 |
| Web 渲染 | GaussianSplats3D (Three.js) | 纯前端方案，支持 .ply 直接加载 |
| 部署 | Node.js + 静态资源服务 | 支持 Range 请求与断点续传 |

## 3. 关键问题与解决

| 问题 | 现象 | 解决方案 |
|------|------|----------|
| 本地无显卡 | 无法运行 CUDA 训练 | 使用 Google Colab T4 GPU 完成训练，下载模型至本地 |
| .ply 文件过大 | 原始模型 514MB，网页加载慢 | 启用 HTTP Range 请求支持，浏览器可分段加载；后续计划转为 .ksplat 压缩格式 |
| Web 端 CORS 限制 | SharedArrayBuffer 需要跨域隔离 | 服务器配置 COOP/COEP 响应头，或在 Viewer 中禁用 shared memory |
| 球谐函数兼容 | 训练使用 SH degree 3，Web viewer 最高支持 degree 2 | 渲染时降级为 SH degree 0，保证兼容性，牺牲少量视角相关光照效果 |

## 4. 性能指标

| 指标 | 数值 | 测试环境 |
|------|------|----------|
| 训练时间 | ~55 分钟 | Google Colab T4 |
| 训练 PSNR | 25.13 dB | Train 场景测试集 |
| Web 端加载时间 | 15–30 秒（首次） | 100Mbps 下行带宽 |
| 实时渲染帧率 | 30–60 fps | Chrome 桌面端 |
| 浏览器兼容性 | Chrome / Edge / Firefox | WebGL 2.0 支持 |

## 5. 下一步计划

1. **场景迁移**：将当前技术 pipeline 迁移至真实古迹数据（如寺庙、石窟、牌坊），拍摄多视图图像并重建。
2. **轻量化**：将 .ply 转换为 .ksplat 压缩格式，模型体积预计缩减至 100MB 以内，提升移动端加载速度。
3. **移动端适配**：优化触控交互，测试手机浏览器渲染性能。
4. **语义增强**：探索为高斯点云附加语义标签，实现景点导览信息的点击查询。

---

**Demo 链接**：http://[你的服务器IP]:8080  
**代码仓库**：`/home/graham/Science/3DGS/web_demo`
