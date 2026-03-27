# Image Background Remover

一键移除图片背景的在线工具。

## 技术栈

- **框架**: Next.js 14 (App Router)
- **样式**: TailwindCSS
- **AI API**: Remove.bg
- **部署**: Cloudflare Pages

## Getting Started

### 安装依赖

```bash
npm install
```

### 配置环境变量

复制 `.env.local.example` 为 `.env.local` 并填入你的 Remove.bg API Key：

```bash
cp .env.local.example .env.local
```

获取 API Key: https://www.remove.bg/api

### 开发

```bash
npm run dev
```

打开 http://localhost:3000

### 构建

```bash
npm run build
npm start
```

## 项目结构

```
src/
├── app/
│   ├── api/
│   │   └── remove-bg/
│   │       └── route.ts    # Remove.bg API 集成
│   ├── globals.css          # 全局样式
│   ├── layout.tsx           # 根布局
│   └── page.tsx            # 首页
```

## 功能

- [x] 拖拽/点击上传图片
- [x] 支持 JPG/PNG/WebP
- [x] 调用 Remove.bg API 移除背景
- [x] 原图/结果图对比展示
- [x] 下载透明背景 PNG
- [x] 每日免费次数限制

## 许可证

MIT
