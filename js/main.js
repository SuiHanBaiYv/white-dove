/* ============================================================
   白鸽软件库 · 通用脚本
   - 根据当前页面自动高亮导航菜单
   - 移动端汉堡菜单开关
   - 页脚自动填充当前年份
   ============================================================ */
(function () {
  "use strict";

  // ---------- 1. 导航高亮：按当前文件名匹配 ----------
  // 说明：HTML 里已为每个页面硬编码正确的 active（保证 JS 失效也能显示选中）。
  // 这里只做 URL 匹配的“补强”，不再删除任何已有的 active，避免误清兜底。
  function highlightNav() {
    var path = window.location.pathname;
    var page = path.split("/").pop();
    if (!page) page = "index.html"; // 根路径默认主页

    var links = document.querySelectorAll(".nav-links a");
    for (var i = 0; i < links.length; i++) {
      var href = links[i].getAttribute("href");
      if (href && href.toLowerCase() === page.toLowerCase()) {
        links[i].classList.add("active");
        links[i].setAttribute("aria-current", "page");
      }
    }
  }

  // ---------- 2. 移动端菜单开关 ----------
  function setupMobileMenu() {
    var toggle = document.querySelector(".nav-toggle");
    var links = document.querySelector(".nav-links");
    if (!toggle || !links) return;

    toggle.addEventListener("click", function () {
      var isOpen = links.classList.toggle("open");
      toggle.setAttribute("aria-expanded", isOpen ? "true" : "false");
      toggle.textContent = isOpen ? "✕" : "☰";
    });

    // 点击某个链接后自动收起菜单
    links.addEventListener("click", function (e) {
      if (e.target.tagName === "A") {
        links.classList.remove("open");
        toggle.setAttribute("aria-expanded", "false");
        toggle.textContent = "☰";
      }
    });
  }

  // ---------- 3. 页脚年份 ----------
  function setFooterYear() {
    var el = document.querySelector("[data-year]");
    if (el) el.textContent = String(new Date().getFullYear());
  }

  // ---------- 4. 下载确认弹窗 ----------
  // 带 data-dl-trigger 的按钮不再直接跳转，而是先弹出提示（含网盘提取密码），
  // 由弹窗内的「立即下载」真正打开链接。
  // 链接本身仍写在触发按钮的 href 上 —— 脚本失效时按钮照样能直接下载（渐进增强）。
  function setupDownloadModal() {
    var modal = document.getElementById("dl-modal");
    var triggers = document.querySelectorAll("[data-dl-trigger]");
    if (!modal || !triggers.length) return;

    var goBtn = document.getElementById("dl-go");
    var lastFocus = null;

    function openModal(e) {
      if (e) e.preventDefault();

      // 焦点交还目标 = 被点击的那个按钮本身。
      // 不依赖 document.activeElement：程序化触发时它可能还停在 body 上。
      var trigger = (e && e.currentTarget) || document.activeElement;
      lastFocus = trigger;

      // 把真实链接交给弹窗里的按钮（链接只在触发按钮上写一份）
      if (goBtn) goBtn.setAttribute("href", trigger.getAttribute("href") || "#");

      modal.classList.add("open");
      modal.setAttribute("aria-hidden", "false");

      // 锁滚动，并补掉滚动条消失带来的宽度差，避免页面横向跳动
      var gap = window.innerWidth - document.documentElement.clientWidth;
      if (gap > 0) document.body.style.paddingRight = gap + "px";
      document.body.classList.add("dl-open");

      // 强制一次样式重算（读 offsetHeight 触发 reflow）。
      // 弹窗刚从 visibility:hidden 转为可见，不做这一步的话浏览器仍会
      // 认为该元素不可聚焦，focus() 会被静默忽略。
      void modal.offsetHeight;
      if (goBtn) goBtn.focus();
    }

    function closeModal() {
      modal.classList.remove("open");
      modal.setAttribute("aria-hidden", "true");
      document.body.classList.remove("dl-open");
      document.body.style.paddingRight = "";
      if (lastFocus && lastFocus.focus) lastFocus.focus();
    }

    for (var i = 0; i < triggers.length; i++) {
      triggers[i].addEventListener("click", openModal);
    }

    // 取消按钮 / 点击遮罩关闭
    modal.addEventListener("click", function (e) {
      if (e.target.closest && e.target.closest("[data-dl-cancel]")) closeModal();
    });

    // Esc 关闭
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && modal.classList.contains("open")) closeModal();
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    highlightNav();
    setupMobileMenu();
    setFooterYear();
    setupDownloadModal();
  });
})();