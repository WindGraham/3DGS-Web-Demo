# 腾讯云部署指南

## 方式一：我直接帮你部署（最快，推荐）

把以下信息发给我，我远程登录你的腾讯云服务器，10 分钟内搞定：

- 服务器公网 IP
- SSH 端口（默认 22）
- 用户名（默认 root 或 ubuntu）
- 密码或私钥文件路径

## 方式二：你自己部署

### 1. 上传文件到服务器

在**本地电脑**执行（请把 `YOUR_SERVER_IP` 换成实际 IP）：

```bash
# 打包 web_demo（不含模型，模型太大单独传）
cd /home/graham/Science/3DGS
tar czvf web_demo_code.tar.gz web_demo/index.html web_demo/server.js web_demo/package.json web_demo/tech_brief.md web_demo/DEPLOY.md

# 上传到服务器（需要服务器已配置 SSH 密钥或密码）
scp web_demo_code.tar.gz root@YOUR_SERVER_IP:/opt/

# 单独上传模型文件（514MB，根据网速可能需要几分钟）
scp /home/graham/Science/3DGS/02_复现代码/3DGS_Project/output/train/point_cloud/iteration_30000/point_cloud.ply root@YOUR_SERVER_IP:/opt/web_demo/models/train.ply
```

### 2. 在服务器上解压并启动

```bash
ssh root@YOUR_SERVER_IP
cd /opt
mkdir -p web_demo/models
tar xzvf web_demo_code.tar.gz
mv web_demo_code/* web_demo/ 2>/dev/null || true

# 安装依赖
cd web_demo
npm install

# 修改 server.js 中的 MODEL_PATH 为服务器上的实际路径
# （如果模型放在 /opt/web_demo/models/train.ply，则不需要改）

# 启动服务
nohup node server.js > server.log 2>&1 &
```

### 3. 开放防火墙端口

在腾讯云控制台 → 安全组 → 入站规则，添加：

- 协议：TCP
- 端口：8080
- 来源：0.0.0.0/0

### 4. 访问 Demo

浏览器打开：`http://YOUR_SERVER_IP:8080`

---

## 附：使用 systemd 保持服务常驻（可选）

创建 `/etc/systemd/system/3dgs-web.service`：

```ini
[Unit]
Description=3DGS Web Demo
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/opt/web_demo
ExecStart=/usr/bin/node /opt/web_demo/server.js
Restart=on-failure

[Install]
WantedBy=multi-user.target
```

然后执行：

```bash
systemctl daemon-reload
systemctl enable 3dgs-web
systemctl start 3dgs-web
```
