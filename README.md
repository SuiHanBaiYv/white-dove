# <img src="yjtp.png" width="28" align="center" alt="白鸽软件库图标"> 白鸽软件库

「白鸽软件库」—— 独立开发者 **岁寒白羽** 的软件总站。一个纯静态、无依赖、开箱即用的多页面网站。

## ✨ 功能

- 🧭 顶部导航：**主页 · 产品 · 下载 · 关于** 四个页面
- 🌌 **星空背景**：满屏闪烁的星星，鼠标靠近时星星会弹开远离，移开后缓慢飘回原位（Canvas 实现，自适应屏幕与触屏）
- 🏠 主页：网站介绍、网站特点、产品预览
- 📦 产品页：占位卡片（后续补充产品介绍）
- 📥 下载页：占位说明（后续补充下载入口）
- 👤 关于页：开发者「岁寒白羽」的自我简介、技术栈、开发历程与联系方式
- 📱 响应式布局：移动端自动折叠为汉堡菜单

## 📁 目录结构

```
新网站/
├── index.html      # 主页
├── products.html   # 产品页（占位，后续补充）
├── download.html   # 下载页（占位，后续补充）
├── about.html      # 关于页（开发者简介）
├── yjtp.ico        # 网站图标（favicon）
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
| 星座连线密度 / 透明度 | `js/stars.js` 顶部参数（`LINK_DIST`、`MAX_LINKS`、`LINE_ALPHA`） |
| 星星闪烁快慢 | `js/stars.js` 的 `twinkleSpeed`（数值越大闪得越快） |
| 主题配色 | `css/style.css` 的 `:root` 变量 |
| 导航菜单 | 四个 `.html` 中的 `<ul class="nav-links">` |
| 添加产品 | `products.html` 中把占位卡片替换为真实产品卡片即可 |

## 📌 待办

- [ ] 在 `products.html` 补充真实产品与截图
- [ ] 在 `download.html` 提供各版本下载链接
- [ ] 在 `about.html` 更新真实邮箱地址

---

© 2025 白鸽软件库 · 开发者：岁寒白羽
