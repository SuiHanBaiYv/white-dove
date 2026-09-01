/* ============================================================
   白鸽软件库 · 星空背景
   - 大量星星 + 柔和缓慢的呼吸式微光（不爆闪）
   - 切换页面时：星星错落渐入，轻轻浮现（有生机但不乱跳）
   - 鼠标靠近时，星星会被弹开（远离鼠标）
   - 鼠标移开后，星星会缓慢飘回原位
   ============================================================ */
(function () {
  "use strict";

  var canvas = document.getElementById("stars-canvas");
  if (!canvas) return;

  var ctx = canvas.getContext("2d");
  var stars = [];
  var mouse = { x: -9999, y: -9999 }; // 初始放在屏幕外，避免开场全被弹开
  var width = 0;
  var height = 0;
  var dpr = Math.min(window.devicePixelRatio || 1, 2);
  var rafId = null;
  var reducedMotion = false;

  // ---------- 参数（想调整星星数量/力度改这里） ----------
  var STAR_COUNT = 480;        // 星星数量
  var REPEL_RADIUS = 170;      // 鼠标影响半径（px），范围内星星会被推开
  var REPEL_FORCE = 1.5;       // 推开力度
  var RETURN_SPRING = 0.018;   // 回到原位的“弹簧”强度
  var DAMPING = 0.86;          // 速度衰减（越大越滑）
  var MAX_SPEED = 8;           // 星星最快移动速度

  // 渐入效果参数
  var FADE_IN_MS = 650;        // 单颗星星完全显现所需时间（ms）
  var BORN_SPREAD_MS = 900;    // 全部星星错落完成出现的时间跨度（ms）

  // ---------- 尺寸 ----------
  function resize() {
    width = window.innerWidth;
    height = window.innerHeight;
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = width + "px";
    canvas.style.height = height + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (stars.length === 0) buildStars();
    else snapStarsBack(); // 窗口变化时让星星重新分布
  }

  // ---------- 生成星星 ----------
  function makeStar() {
    // 关键：初始位置 = 家的位置，星星在原位渐入，不产生开场跳动
    var homeX = Math.random() * width;
    var homeY = Math.random() * height;
    return {
      x: homeX,
      y: homeY,
      homeX: homeX,
      homeY: homeY,
      vx: 0,
      vy: 0,
      r: Math.random() * 1.1 + 0.4,          // 半径（小一点更精致）
      baseAlpha: Math.random() * 0.35 + 0.5, // 基础亮度
      twinkleSpeed: Math.random() * 0.012 + 0.004, // 缓慢呼吸
      twinklePhase: Math.random() * Math.PI * 2,
      hue: Math.random() < 0.85 ? 215 : 180, // 白蓝为主，少量青色
      born: Math.random() * BORN_SPREAD_MS,  // 出生时间偏移（错落渐入）
    };
  }

  function buildStars() {
    stars = [];
    for (var i = 0; i < STAR_COUNT; i++) {
      stars.push(makeStar());
    }
  }

  // 窗口尺寸变化后：把星星的“家”重新铺满新屏幕（并重新错落渐入）
  function snapStarsBack() {
    for (var i = 0; i < stars.length; i++) {
      var s = stars[i];
      s.homeX = Math.random() * width;
      s.homeY = Math.random() * height;
      s.x = s.homeX;
      s.y = s.homeY;
      s.vx = 0;
      s.vy = 0;
      s.born = Math.random() * BORN_SPREAD_MS;
    }
  }

  // ---------- 鼠标 ----------
  if (window.matchMedia("(pointer: fine)").matches) {
    window.addEventListener("mousemove", function (e) {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    });
    window.addEventListener("mouseout", function () {
      mouse.x = -9999;
      mouse.y = -9999;
    });
  } else {
    // 触屏设备：用最近一次触摸代替鼠标
    window.addEventListener("touchmove", function (e) {
      if (e.touches.length > 0) {
        mouse.x = e.touches[0].clientX;
        mouse.y = e.touches[0].clientY;
      }
    }, { passive: true });
  }

  // ---------- 动画主循环 ----------
  function tick(time) {
    var i, s;
    // 清屏（透明，露出 CSS 渐变背景）
    ctx.clearRect(0, 0, width, height);

    // ===== 第一步：更新所有星星的物理状态 =====
    for (i = 0; i < stars.length; i++) {
      s = stars[i];

      // 1) 鼠标弹开：离鼠标越近，推力越大
      var dx = s.x - mouse.x;
      var dy = s.y - mouse.y;
      var dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < REPEL_RADIUS && dist > 0.001) {
        var force = (1 - dist / REPEL_RADIUS) * REPEL_FORCE;
        s.vx += (dx / dist) * force;
        s.vy += (dy / dist) * force;
      }

      // 2) 缓慢飘回原位（弹簧 + 阻尼）
      s.vx += (s.homeX - s.x) * RETURN_SPRING;
      s.vy += (s.homeY - s.y) * RETURN_SPRING;

      // 限速，防止飞出屏幕后卡顿
      var speed = Math.sqrt(s.vx * s.vx + s.vy * s.vy);
      if (speed > MAX_SPEED) {
        s.vx = (s.vx / speed) * MAX_SPEED;
        s.vy = (s.vy / speed) * MAX_SPEED;
      }

      // 阻尼衰减：让星星平滑停下，避免无限来回振荡
      s.vx *= DAMPING;
      s.vy *= DAMPING;

      // 3) 移动
      s.x += s.vx;
      s.y += s.vy;
    }

    // ===== 第二步：绘制星星（柔和微光 + 错落渐入） =====
    for (i = 0; i < stars.length; i++) {
      s = stars[i];

      // 渐入：透明度从 0 缓缓显现，尺寸从 70% 微微舒展（不启用时直接满显）
      var fadeIn = 1;
      if (!reducedMotion) {
        var elapsed = time - s.born;
        if (elapsed <= 0) fadeIn = 0;
        else if (elapsed < FADE_IN_MS) fadeIn = elapsed / FADE_IN_MS;
        else fadeIn = 1;
      }

      // 缓慢的呼吸式闪烁：波动幅度小、速度快不了
      var twinkle =
        0.88 +
        0.12 * Math.sin(time * s.twinkleSpeed + s.twinklePhase);
      var alpha = s.baseAlpha * twinkle * fadeIn;
      var drawR = s.r * (0.7 + 0.3 * fadeIn);

      ctx.beginPath();
      ctx.arc(s.x, s.y, drawR, 0, Math.PI * 2);
      ctx.fillStyle = "hsla(" + s.hue + ", 90%, 88%," + alpha.toFixed(3) + ")";
      ctx.fill();

      // 略大一点的星星带一圈极淡光晕（随渐入一起显现）
      if (s.r > 1.0 && fadeIn > 0) {
        ctx.beginPath();
        ctx.arc(s.x, s.y, drawR * 2.6, 0, Math.PI * 2);
        ctx.fillStyle = "hsla(" + s.hue + ", 90%, 85%," + (alpha * 0.10).toFixed(3) + ")";
        ctx.fill();
      }
    }

    rafId = requestAnimationFrame(tick);
  }

  // ---------- 启动 ----------
  resize();

  // 偏好减少动画：跳过渐入，直接显示静态星空
  reducedMotion = !!(window.matchMedia("(prefers-reduced-motion: reduce)") || {}).matches;
  window.addEventListener("resize", resize);

  if (reducedMotion) {
    // 静止一帧（fadeIn 强制为 1），之后不继续动画
    tick(0);
    cancelAnimationFrame(rafId);
  } else {
    rafId = requestAnimationFrame(tick);
  }
})();