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

  document.addEventListener("DOMContentLoaded", function () {
    highlightNav();
    setupMobileMenu();
    setFooterYear();
  });
})();