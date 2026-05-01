# 模型文件说明

本目录用于存放 3D Gaussian Splatting 模型文件。

## 当前使用的模型

- **文件名**: `train.ply`
- **来源**: `~/Science/3DGS/02_复现代码/3DGS_Project/output/train/point_cloud/iteration_30000/point_cloud.ply`
- **大小**: 约 514 MB
- **场景**: Train（Tanks and Temples 数据集）
- **训练迭代**: 30,000 steps

## 部署时的模型路径配置

`server.js` 中默认通过硬编码路径加载模型：

```javascript
const MODEL_PATH = '/home/graham/Science/3DGS/02_复现代码/3DGS_Project/output/train/point_cloud/iteration_30000/point_cloud.ply';
```

部署到服务器时，请将模型文件复制到本目录（`models/train.ply`），并修改 `server.js` 中的 `MODEL_PATH` 为：

```javascript
const MODEL_PATH = path.join(__dirname, 'models', 'train.ply');
```

## 替换其他场景

如需替换为其他古迹/建筑场景，将新的 `.ply` 文件放入本目录，并修改 `index.html` 中的加载路径：

```javascript
viewer.addSplatScene('./models/your_scene.ply', { ... })
```
