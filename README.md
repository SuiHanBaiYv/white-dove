# <img src="yjtp.png" width="28" align="center" alt="白鸽软件库图标"> 白鸽软件库

「白鸽软件库」—— 独立开发者 **岁寒白羽** 的软件总站。一个纯静态、无依赖、开箱即用的多页面网站。

## ✨ 功能

- 🧭 顶部导航：**主页 · 产品 · 下载 · 关于** 四个页面
- 🌌 **星空背景**：480 颗星星柔和呼吸微光（不爆闪）；切换页面时星星错落渐入、轻轻浮现；鼠标靠近时星星会弹开远离，移开后缓慢飘回原位（Canvas 实现，自适应屏幕与触屏）
- 🏠 主页：网站介绍、网站特点、产品预览
- 📦 产品页：已上架产品卡片，点击卡片进入产品详情页
- 📥 下载页：产品下载入口，点击卡片进入详情页下载
- 🪶 产品详情页：产品头像 + 名称 + 「立即下载」，下方为软件简介与系统要求
- 👤 关于页：开发者「岁寒白羽」的自我简介、技术栈、开发历程与联系方式
- 📱 响应式布局：移动端自动折叠为汉堡菜单

## 📁 目录结构

```
White Dove/
├── index.html        # 主页
├── products.html     # 产品页（产品卡片，点击进详情页）
├── download.html     # 下载页（下载入口，点击进详情页）
├── whitefeather.html # 产品详情页（白羽 White Feather 0.1.0）
├── about.html        # 关于页（开发者简介）
├── yjtp.ico        # 网站图标（favicon，标签页用）
├── yjtp.png        # 页面展示图标（导航 / 页脚 / 头像，由 ico 提取）
├── wf.png          # 白羽 White Feather 图标（产品卡 / 详情页头像）
├── css/
│   └── style.css   # 全局样式（暗夜星空 / 玻璃拟态）
├── js/
│   ├── stars.js    # 星空背景特效（鼠标排斥）
│   └── main.js     # 导航高亮 / 移动端菜单 / 年份
└── README.md
```

## 🚀 本地预览

网站为纯静态页面，**无需安装任何依赖**，直接用浏览器打开 `index.html` 即可，或用任意静态服务器：

```bash
# 例如 Python
python -m http.server 8080
# 或 Node
npx serve .
```

## 🛠️ 常用修改

| 想改什么 | 改哪里 |
| --- | --- |
| 星星数量 / 排斥力度 | `js/stars.js` 顶部参数（`STAR_COUNT`、`REPEL_RADIUS`、`REPEL_FORCE`） |
| 切换页面的渐入效果 | `js/stars.js` 顶部参数（`FADE_IN_MS` 单颗渐入时长、`BORN_SPREAD_MS` 错落跨度） |
| 星星闪烁快慢 | `js/stars.js` 的 `twinkleSpeed`（数值越大闪得越快） |
| 主题配色 | `css/style.css` 的 `:root` 变量 |
| 导航菜单 / 选中高亮 | 四个 `.html` 中的 `<ul class="nav-links">`（每个页面已硬编码 `active`） |
| 联系邮箱 / B站 | `about.html` 的「联系我」板块 |
| 更换下载地址 | `whitefeather.html` 中「立即下载」按钮的 `href` |
| 添加产品 | 复制 `products.html` 的 `.product-card` 卡片块改名称/图标/链接；新详情页可复制 `whitefeather.html` |

## 📌 待办

- [x] 在 `products.html` 上架首款产品「白羽 White Feather」
- [x] 在 `download.html` 提供下载入口（0.1.0 安装包）
- [x] 在 `about.html` 更新真实邮箱地址（已填 `suihanbaiyv@qq.com`）
- [ ] 后续产品上架时，参照 `whitefeather.html` 新建详情页

---

© 2026 白鸽软件库 · 开发者：岁寒白羽
