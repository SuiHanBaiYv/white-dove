/* ============================================================
   白鸽软件库 · 宣传片脚本
   - 深空星空：星星柔和呼吸 + 偶尔流星 + 鼠标靠近轻微散开
   - 多场景自动轮播（片头 → 主题 → 特点 → 产品 → 开发者 → 结尾）
   - 进度条 / 场景圆点 / 跳过 / 重播 / 氛围音开关
   ============================================================ */
(function () {
  "use strict";

  /* ================= 星空画布 ================= */
  var canvas = document.getElementById("sky");
  var ctx = canvas.getContext("2d");
  var width = 0, height = 0;
  var dpr = Math.min(window.devicePixelRatio || 1, 2);
  var stars = [];
  var shooting = [];       // 流星
  var mouse = { x: -9999, y: -9999 };
  var lastShoot = 0;

  var STAR_COUNT = 260;    // 星星数量
  var REPEL_RADIUS = 120;  // 鼠标影响半径
  var REPEL_FORCE = 0.8;   // 柔和散开力度

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
    else resetHome();
  }

  function makeStar() {
    var hx = Math.random() * width;
    var hy = Math.random() * height;
    return {
      x: hx, y: hy,
      homeX: hx, homeY: hy,
      vx: 0, vy: 0,
      r: Math.random() * 1.2 + 0.4,
      baseAlpha: Math.random() * 0.35 + 0.5,
      twinkleSpeed: Math.random() * 0.014 + 0.004,
      twinklePhase: Math.random() * Math.PI * 2,
      hue: Math.random() < 0.85 ? 215 : 180,
    };
  }

  function buildStars() {
    stars = [];
    for (var i = 0; i < STAR_COUNT; i++) stars.push(makeStar());
  }

  function resetHome() {
    for (var i = 0; i < stars.length; i++) {
      var s = stars[i];
      s.homeX = Math.random() * width;
      s.homeY = Math.random() * height;
      s.x = s.homeX;
      s.y = s.homeY;
      s.vx = 0; s.vy = 0;
    }
  }

  // 鼠标（指针设备用 mousemove，触屏用 touchmove）
  if (window.matchMedia("(pointer: fine)").matches) {
    window.addEventListener("mousemove", function (e) {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    });
    window.addEventListener("mouseout", function () { mouse.x = -9999; mouse.y = -9999; });
  } else {
    window.addEventListener("touchmove", function (e) {
      if (e.touches.length > 0) { mouse.x = e.touches[0].clientX; mouse.y = e.touches[0].clientY; }
    }, { passive: true });
  }

  function spawnShoot(time) {
    // 每隔 1.6~2.6 秒随机一颗流星
    if (time - lastShoot > 1600 + Math.random() * 1000) {
      lastShoot = time;
      var fromX = Math.random() * width;
      var fromY = Math.random() * height * 0.5;
      shooting.push({
        x: fromX, y: fromY,
        vx: (Math.random() * 4 + 5) * (Math.random() < 0.5 ? 1 : -1),
        vy: Math.random() * 3 + 2.5,
        life: 1,
      });
    }
  }

  function tick(time) {
    var i, s;
    ctx.clearRect(0, 0, width, height);

    // 星星物理
    for (i = 0; i < stars.length; i++) {
      s = stars[i];
      var dx = s.x - mouse.x;
      var dy = s.y - mouse.y;
      var dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < REPEL_RADIUS && dist > 0.001) {
        var f = (1 - dist / REPEL_RADIUS) * REPEL_FORCE;
        s.vx += (dx / dist) * f;
        s.vy += (dy / dist) * f;
      }
      s.vx += (s.homeX - s.x) * 0.02;
      s.vy += (s.homeY - s.y) * 0.02;
      var sp = Math.sqrt(s.vx * s.vx + s.vy * s.vy);
      if (sp > 4) { s.vx = (s.vx / sp) * 4; s.vy = (s.vy / sp) * 4; }
      s.vx *= 0.9; s.vy *= 0.9;
      s.x += s.vx; s.y += s.vy;
    }

    // 绘制星星（柔和呼吸，不爆闪）
    for (i = 0; i < stars.length; i++) {
      s = stars[i];
      var tw = 0.88 + 0.12 * Math.sin(time * s.twinkleSpeed + s.twinklePhase);
      var a = s.baseAlpha * tw;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fillStyle = "hsla(" + s.hue + ", 90%, 88%," + a.toFixed(3) + ")";
      ctx.fill();
      if (s.r > 1.1) {
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r * 2.4, 0, Math.PI * 2);
        ctx.fillStyle = "hsla(" + s.hue + ", 90%, 85%," + (a * 0.1).toFixed(3) + ")";
        ctx.fill();
      }
    }

    // 流星
    spawnShoot(time);
    for (i = shooting.length - 1; i >= 0; i--) {
      var m = shooting[i];
      m.x += m.vx; m.y += m.vy;
      m.life -= 0.02;
      if (m.life <= 0 || m.x < -100 || m.x > width + 100 || m.y > height + 100) {
        shooting.splice(i, 1);
        continue;
      }
      var len = 12;
      var grad = ctx.createLinearGradient(m.x, m.y, m.x - m.vx * len, m.y - m.vy * len);
      grad.addColorStop(0, "rgba(255,255,255," + (0.7 * m.life).toFixed(3) + ")");
      grad.addColorStop(1, "rgba(255,255,255,0)");
      ctx.strokeStyle = grad;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(m.x, m.y);
      ctx.lineTo(m.x - m.vx * len, m.y - m.vy * len);
      ctx.stroke();
    }

    requestAnimationFrame(tick);
  }

  resize();
  window.addEventListener("resize", resize);
  requestAnimationFrame(tick);

  /* ================= 场景轮播 ================= */
  var scenes = Array.prototype.slice.call(document.querySelectorAll(".scene"));
  var dots = document.getElementById("dots");
  var bar = document.getElementById("progressBar");
  var btnReplay = document.getElementById("btnReplay");
  var btnSound = document.getElementById("btnSound");

  // 每场景停留时长（ms），最后一段为结尾（停留更久供点击）
  var durations = [3000, 3600, 4600, 3600, 3800, 9000];
  var total = durations.reduce(function (a, b) { return a + b; }, 0);
  var cur = 0;
  var timer = null;
  var startTime = 0;
  var rafProgress = null;

  // 生成场景圆点
  var dotEls = [];
  for (var d = 0; d < scenes.length; d++) {
    var dot = document.createElement("span");
    dot.className = "dot" + (d === 0 ? " on" : "");
    dots.appendChild(dot);
    dotEls.push(dot);
  }

  function showScene(idx) {
    for (var i = 0; i < scenes.length; i++) {
      scenes[i].classList.toggle("active", i === idx);
    }
    for (var j = 0; j < dotEls.length; j++) {
      dotEls[j].className = "dot" + (j === idx ? " on" : "");
    }
  }

  // 进度条：按时间推进
  function startProgress() {
    cancelAnimationFrame(rafProgress);
    startTime = performance.now();
    function step(now) {
      var p = (now - startTime) / total;
      if (p > 1) p = 1;
      bar.style.width = (p * 100).toFixed(2) + "%";
      if (p < 1) rafProgress = requestAnimationFrame(step);
    }
    rafProgress = requestAnimationFrame(step);
  }

  function advance() {
    if (cur >= scenes.length - 1) {
      // 结尾：停留等待用户操作
      return;
    }
    cur++;
    showScene(cur);
    timer = setTimeout(advance, durations[cur]);
  }

  function start() {
    cur = 0;
    clearTimeout(timer);
    showScene(0);
    startProgress();
    timer = setTimeout(advance, durations[0]);
  }

  btnReplay.addEventListener("click", function () { start(); });

  /* ================= 氛围音（Web Audio 合成，默认关） ================= */
  var audioCtx = null;
  var masterGain = null;
  var soundOn = false;

  function initAudio() {
    if (audioCtx) return;
    var AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    audioCtx = new AC();
    masterGain = audioCtx.createGain();
    masterGain.gain.value = 0;
    masterGain.connect(audioCtx.destination);

    // 低音持续（星空底噪）
    var o1 = audioCtx.createOscillator();
    o1.type = "sine";
    o1.frequency.value = 55;
    var g1 = audioCtx.createGain();
    g1.gain.value = 0.14;
    o1.connect(g1); g1.connect(masterGain);
    o1.start();

    // 微颤的高音（星星闪烁感）
    var o2 = audioCtx.createOscillator();
    o2.type = "triangle";
    o2.frequency.value = 220;
    var g2 = audioCtx.createGain();
    g2.gain.value = 0.025;
    var lfo = audioCtx.createOscillator();
    lfo.frequency.value = 0.4;
    var lfoGain = audioCtx.createGain();
    lfoGain.gain.value = 0.015;
    lfo.connect(lfoGain); lfoGain.connect(g2.gain);
    o2.connect(g2); g2.connect(masterGain);
    o2.start(); lfo.start();
  }

  btnSound.addEventListener("click", function () {
    initAudio();
    if (!audioCtx) return;
    if (audioCtx.state === "suspended") audioCtx.resume();
    soundOn = !soundOn;
    masterGain.gain.linearRampToValueAtTime(soundOn ? 0.5 : 0, audioCtx.currentTime + 0.4);
    btnSound.textContent = soundOn ? "🔊" : "🔇";
  });

  /* ================= 启动 ================= */
  start();
})();