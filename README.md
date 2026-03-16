# PDF 合并工具

一个基于 Electron 的桌面端 PDF 合并工具，支持拖拽上传、调整顺序、合并压缩、合并预览、下载，以及打包成 macOS/Windows 安装包。

## 功能

- 拖拽/点击上传 PDF
- 调整文件顺序、移除文件
- 合并选项：启用 PDF 压缩
- 合并后预览（内嵌 iframe）
- 可放大预览弹窗
- 下载合并后的 PDF
- 支持打包 macOS (`dmg`, `zip`) 和 Windows (`nsis`, `zip`)
- 开发热更新命令

## 目录结构

```
pdf-merge/
├── src/
│   ├── main.js
│   ├── preload.js
│   ├── renderer.js
│   ├── index.html
│   └── styles.css
├── build/
│   ├── icon.png
│   └── icon-512.png
├── package.json
└── README.md
```

## 快速开始

```bash
cd pdf-merge
npm install
npm run start
```

### 热更新开发

```bash
npm run hot
```

### 打包

macOS:

```bash
npm run dist
```

Windows:

```bash
npm run dist:win
```

## 版本迭代建议

1. 先在 `main` 分支开发核心功能；
2. 通过分支/PR 做功能迭代；
3. 每次发布前更新 `README.md` 的版本说明和打包结果；
4. 可以加上 `CHANGELOG.md` 记录修订。

## 常见问题

- 如果报 `electron-builder` 依赖缺失，请先执行 `npm install`。
- 如果 macOS 打包 Windows 需要 Wine/mono 环境。

## 版权

作者：Rafong973
