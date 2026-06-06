# 🎤 BEJ48-吴睿莎 唱歌切片收藏馆

<p align="center">
  <a href="https://wrs.abm48.com/">
    <img src="https://img.shields.io/badge/Live-点击访问网站-ff6b81?style=for-the-badge&logo=safari" alt="Website">
  </a>
  <a href="https://gitee.com/albert-chen04/video-editing-toolkit">
    <img src="https://img.shields.io/badge/Tools-桌面版剪辑软件-409EFF?style=for-the-badge&logo=python" alt="Tools">
  </a>
</p>

这是一个为 **BEJ48 成员吴睿莎** 建立的个人应援档案站。

项目核心是基于**直播唱歌切片文本记录**，自动生成一个可检索、可追溯、可下载的歌曲归档库。同时包含成员简介、上传后台等功能。

## 📸 界面预览

| 日期归档墙 | 切片检索与列表 | 日历归档墙 | 成员简介 | 上传后台 |
| :---: | :---: | :---: | :---: | :---: |
| <img src="screenshots/screenshot1.png" width="300" alt="日期归档" /> | <img src="screenshots/screenshot2.png" width="300" alt="切片列表" /> | <img src="screenshots/screenshot3.png" width="300" alt="切片列表" /> | <img src="screenshots/screenshot4.png" width="300" alt="成员简介" /> | <img src="screenshots/screenshot5.png" width="300" alt="上传后台" /> |

## ✨ 核心功能

### 1. 🗂️ 归档与检索
*   **多视图浏览**: 提供 **"日历归档墙"** 和 **"瀑布流列表"** 两种模式，支持按日期快速回溯。
*   **毫秒级搜索**: 纯前端实现，支持输入 **歌名** 或 **日期** (如 `2025-12-08`) 实时过滤。
*   **双站联动**: 一键复制 `歌名+日期` 组合关键词，并自动跳转至 [小偶像音乐站](https://abm48.com)，实现"查到即听到"。

### 2. 🔄 自动化数据流
*   **自动更新**: 服务器端配置了自动化脚本。只需上传 `.txt` 切片记录文件，网站数据会在 1 分钟内自动解析并更新，无需重新编译前端。
*   **批量下载**: 支持将搜索结果对应的源 `.txt` 文件批量打包下载。

### 3. 👤 成员简介
*   **API 数据**: 通过 `profile.php` 后端代理调用 [abm48.com](https://abm48.com) 公开 API 获取成员基本信息等数据。
  - 名称→ID 映射：`GET https://abm48.com/api/public/snh48/mapping`
  - 成员详情：`GET https://abm48.com/api/public/snh48/members/{id}`
*   **图片预览**: 支持头像等图片的全屏预览查看。

## 🛠️ 技术栈

*   **核心框架**: Vue 3 + Vite
*   **UI 组件库**: Element Plus
*   **后端**: PHP (提供 profile、upload 等 API)
*   **数据脚本**: Node.js (服务端自动化解析生成 `data.json`)
*   **工具库**: JSZip (文件打包)

## 🚀 快速开始

### 环境配置

项目需要创建一个 `.env` 文件存放上传管理密码（由 `upload.php` 后端读取校验）。

在项目根目录创建 `.env` 文件：

```bash
# .env
# 上传后台管理密码（upload.php 读取此变量校验，前端不可见）
UPLOAD_PASSWORD=your_password_here
```

如果不创建此文件或未设置 `UPLOAD_PASSWORD`，上传页面将无法使用。

### 本地开发

1.  **克隆项目（main 分支）**
    ```bash
    git clone [项目地址]
    cd wrs-fansite
    ```

2.  **创建 .env 文件**（参照上方「环境配置」）

3.  **安装依赖**
    ```bash
    npm install
    ```

4.  **准备数据**
    *   将切片记录 `.txt` 文件放入 `scripts/txt_source/` 目录。
    *   运行脚本生成数据：
    ```bash
    npm run gen
    ```

5.  **启动 PHP 后端**（如果需要简介、上传功能）
    ```bash
    php -S localhost:8000
    ```

6.  **启动前端服务**
    ```bash
    npm run dev
    ```

## 📦 部署说明

本项目为纯静态网站，但为了支持 **FFmpeg.wasm** 的多线程特性，服务器 (**Nginx**) 必须配置特定的响应头 (COOP/COEP)。

### 推荐 Nginx 配置

```nginx
server {
    listen 80;
    server_name your-domain.com;
    root /www/wwwroot/your-project;
    index index.html;

    # 1. 核心：为所有 HTML/JS/CSS 添加跨域隔离头，否则 FFmpeg 无法启动
    add_header Cross-Origin-Opener-Policy same-origin always;
    add_header Cross-Origin-Embedder-Policy require-corp always;

    # 2. 正确处理 .wasm 文件类型
    location ~ \.wasm$ {
        default_type application/wasm;
    }

    # 3. PHP 后端转发
    location ~ \.php$ {
        fastcgi_pass 127.0.0.1:9000;
        fastcgi_index index.php;
        fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;
        include fastcgi_params;
    }

    # 4. 防止 Vue 路由刷新 404
    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

## 🌿 项目说明

本项目基于 [snh48-fansite](https://gitee.com/albert-chen04/snh48-fansite) 的 **lite 分支** 修改而来，仅将原谭思慧版本替换为吴睿莎的内容（背景图、成员名、简介等），功能与原版一致。

网站部署在 [wrs.abm48.com](https://wrs.abm48.com/)。

## ✂️ 关于剪辑

本项目已移除 Web 端批量剪辑功能，如需使用剪辑工具：

*   **[在线批量剪辑 (Web版)](https://gitee.com/albert-chen04/tools-site)**: 独立的 Web 剪辑项目，支持切片本导入、批量剪切。
*   **[桌面版剪辑软件](https://gitee.com/albert-chen04/video-editing-toolkit)**: 功能更强大的 Python 桌面版，支持切片本一键导入剪切。

## 🔗 相关项目

*   **[snh48-fansite](https://gitee.com/albert-chen04/snh48-fansite)**: 本项目上游，谭思慧唱歌记录网站（lite 分支）。
*   **[Tools Site](https://gitee.com/albert-chen04/tools-site)**: Web 版在线批量剪辑工具（独立项目）。
*   **[Video Editing Toolkit](https://gitee.com/albert-chen04/video-editing-toolkit)**: 桌面版剪辑软件原身，功能更强大。
*   **[Albert Music Frontend](https://abm48.com)**: 关联的音乐网站。
*   **[Singing Detector](https://gitee.com/albert-chen04/singing_detector)**: 弹幕唱歌检测工具。

## ❤️ 致谢

感谢吴睿莎每天带来的动听歌声。
