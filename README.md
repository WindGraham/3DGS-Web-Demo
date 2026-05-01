# 3DGS-Web-Demo

基于 3D Gaussian Splatting 的 Web 端实时三维漫游 Demo。

## 在线体验

浏览器访问：`http://<你的服务器IP>:8080`

## 功能特性

- 🌐 **纯前端渲染**：基于 WebGL，无需 CUDA，浏览器直接运行
- 🖱️ **实时交互**：鼠标左键旋转、滚轮缩放、右键平移
- 📦 **大模型支持**：HTTP Range 断点续传，514MB 模型也能流畅加载
- 🚀 **一键部署**：Node.js 静态服务器，含 systemd 常驻配置

## 技术栈

| 模块 | 技术 |
|------|------|
| 3D 渲染 | [GaussianSplats3D](https://github.com/mkkellogg/GaussianSplats3D) + Three.js |
| 后端 | Node.js 原生 HTTP 模块 |
| 训练框架 | INRIA gaussian-splatting (PyTorch + CUDA) |

## 快速开始

```bash
npm install
node server.js
# 打开浏览器访问 http://localhost:8080
```

## 部署

详见 [DEPLOY.md](./DEPLOY.md)。

## 模型说明

当前场景为 Tanks and Temples 数据集的 **Train**，训练迭代 30,000 steps。模型文件需单独放置于 `models/` 目录下，详见 [models/README.md](./models/README.md)。
