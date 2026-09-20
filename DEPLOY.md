# Java面试通 · 部署指南

纯静态站点（HTML/CSS/JS），无需后端、无需构建，任意静态托管平台均可。

## 方式一：Netlify Drop（最快，推荐）

1. 打开 https://app.netlify.com/drop
2. 把整个 `/workspace` 文件夹**拖进**页面虚线框
3. 等待几秒，Netlify 自动生成一个 `https://xxx.netlify.app` 网址
4. 打开网址即可使用；点 "Site settings" → "Change site name" 可改域名

> 注意：必须拖整个文件夹（含 `index.html`、`css/`、`js/`、`icons/`、`manifest.json`、`sw.js`），不能只拖单个文件。

## 方式二：Vercel

1. 打开 https://vercel.com/new
2. 点 "Upload" → 上传 `/workspace` 文件夹
3. Framework Preset 选 **Other**，Build Command 留空，Output Directory 填 `.`
4. Deploy 即可

## 方式三：Cloudflare Pages

1. 打开 https://dash.cloudflare.com → Pages → Create → Upload assets
2. 上传 `/workspace` 文件夹
3. Deploy

## 方式四：GitHub Pages

1. 把 `/workspace` 内容推到 GitHub 仓库
2. Settings → Pages → Branch 选 `main` / `/root` → Save
3. 等 1-2 分钟，访问 `https://<用户名>.github.io/<仓库名>/`

## PWA 生效条件

- 必须通过 **HTTPS** 访问（以上平台默认都带 HTTPS）
- `manifest.json` 和 `sw.js` 必须放在站点根目录
- 首次打开后，浏览器会提示"添加到主屏幕"；iOS Safari 需手动点分享 → 添加到主屏幕

## 更新上线

修改文件后，重新拖一次整个文件夹到 Netlify Drop 即可覆盖旧版本。资源已带版本号（`?v=4`），用户刷新后自动加载新版。
