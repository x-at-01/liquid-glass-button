/* 液态玻璃按钮 · 运行时
   1) 语言切换（按钮 + dialog，localStorage + BroadcastChannel 同步，仿 webc）
   2) Liquid Glass：按按钮尺寸生成位移图，clone assets/glass-filters.svg 的滤镜模板，
      为常态 / hover / active 各生成一份，并注入按按钮类名区分的 backdrop-filter 规则。 */
(function () {
  "use strict";

  var G = window.__GLASS__ || { code: "en", langs: ["en"] };
  var KEY = "lang";

  /* ---------------- 语言 ---------------- */
  var bc = null;
  try {
    bc = new BroadcastChannel("lang");
  } catch (e) {}

  function go(code) {
    try {
      localStorage[KEY] = code;
    } catch (e) {}
    if (code === G.code) {
      if (dlg && dlg.open) dlg.close();
      return;
    }
    if (bc) {
      try {
        bc.postMessage(code);
      } catch (e) {}
    }
    location.href = "../" + code + "/index.html";
  }

  var dlg = document.getElementById("langDialog");
  var btn = document.getElementById("langBtn");

  // 语言页只记录当前选择（不做跳转），这样 /ja/、/ar/ 这类深链可以直接打开；
  // 根页面 out/index.html 才按 localStorage / 浏览器语言跳转。
  (function rememberLang() {
    try {
      localStorage[KEY] = G.code;
    } catch (e) {}
  })();

  if (bc) {
    bc.onmessage = function (e) {
      if (e.data && e.data !== G.code && G.langs.indexOf(e.data) >= 0) {
        location.href = "../" + e.data + "/index.html";
      }
    };
  }

  if (btn && dlg) {
    btn.addEventListener("click", function () {
      if (dlg.showModal) dlg.showModal();
      else dlg.setAttribute("open", "");
    });
    dlg.addEventListener("click", function (e) {
      var item = e.target.closest ? e.target.closest("button[data-lang]") : null;
      if (item) {
        go(item.getAttribute("data-lang"));
        return;
      }
      if (e.target === dlg) dlg.close();
    });
  }

  /* ---------------- Liquid Glass ---------------- */
  var tpl = document.getElementById("glass-template");
  var defs = document.querySelector(".glass-defs");
  var styles = document.getElementById("glass-styles");

  // 位移图：R = x 位移、G = y 位移、B = 边缘强度（0 中心 → 255 贴边）
  function displacementMap(w, h) {
    var canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    var ctx = canvas.getContext("2d");
    var img = ctx.createImageData(w, h);
    var r = h / 2,
      cx = w / 2,
      cy = h / 2,
      band = Math.max(5, h * 0.42);
    for (var y = 0; y < h; y++) {
      for (var x = 0; x < w; x++) {
        var qx = Math.abs(x - cx) - (w / 2 - r);
        var qy = Math.abs(y - cy);
        var d = Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) + Math.min(Math.max(qx, qy), 0) - r;
        var nx = 0,
          ny = 0;
        if (d < 0) {
          var gx = (x - cx) / (w / 2),
            gy = (y - cy) / (h / 2),
            len = Math.hypot(gx, gy) || 1;
          nx = gx / len;
          ny = gy / len;
        }
        var k = Math.pow(Math.max(0, 1 - Math.abs(d) / band), 2);
        var i = (y * w + x) * 4;
        img.data[i] = 128 + nx * k * 127;
        img.data[i + 1] = 128 + ny * k * 127;
        img.data[i + 2] = k * 255;
        img.data[i + 3] = 255;
      }
    }
    ctx.putImageData(img, 0, 0);
    return canvas;
  }

  function buildGlass(target) {
    if (!tpl || !defs || !styles) return;
    var rect = target.getBoundingClientRect();
    var w = Math.max(2, Math.round(rect.width)),
      h = Math.max(2, Math.round(rect.height));
    var id = "glass-" + Math.random().toString(36).slice(2, 9);
    var s0 = Math.max(6, Math.round(h * 0.34));
    var map = displacementMap(w, h).toDataURL();
    var variants = [
      ["", s0],
      ["-h", s0 * 1.45],
      ["-a", s0 * 0.6]
    ];
    variants.forEach(function (v) {
      var f = tpl.cloneNode(true);
      f.setAttribute("id", id + v[0]);
      f.setAttribute("width", w);
      f.setAttribute("height", h);
      var feImg = f.querySelector(".g-map");
      if (feImg) {
        feImg.setAttribute("href", map);
        feImg.setAttribute("width", w);
        feImg.setAttribute("height", h);
      }
      var disp = f.querySelectorAll(".g-disp");
      for (var i = 0; i < disp.length; i++) {
        disp[i].setAttribute("scale", (v[1] * (1 - 0.08 * i)).toFixed(2));
      }
      defs.appendChild(f);
    });

    var cls = "glass-btn-" + Math.random().toString(36).slice(2, 8);
    target.classList.add(cls);
    var normal = "url(#" + id + ") blur(6px) contrast(1.15) brightness(1.04) saturate(170%)";
    var hover = "url(#" + id + "-h) blur(6px) contrast(1.18) brightness(1.14) saturate(190%)";
    var active = "url(#" + id + "-a) blur(10px) contrast(1.08) brightness(.94) saturate(140%)";
    styles.textContent +=
      "." + cls + "{backdrop-filter:" + normal + ";-webkit-backdrop-filter:" + normal + "}" +
      "." + cls + ":hover{backdrop-filter:" + hover + ";-webkit-backdrop-filter:" + hover + "}" +
      "." + cls + ":active{backdrop-filter:" + active + ";-webkit-backdrop-filter:" + active + "}";
  }

  function rebuild() {
    if (!defs || !styles) return;
    Array.prototype.forEach.call(defs.querySelectorAll("filter[id^='glass-']"), function (f) {
      f.remove();
    });
    styles.textContent = "";
    Array.prototype.forEach.call(document.querySelectorAll(".btn"), function (b) {
      Array.prototype.slice.call(b.classList).forEach(function (c) {
        if (c.indexOf("glass-btn-") === 0) b.classList.remove(c);
      });
      buildGlass(b);
    });
  }

  function fitCaptions() {
    Array.prototype.forEach.call(document.querySelectorAll(".measure"), function (box) {
      var b = box.querySelector(".btn"),
        w = box.querySelector(".w");
      if (!b || !w) return;
      w.textContent = Math.round(b.getBoundingClientRect().width) + " px";
    });
  }

  var tile = document.getElementById("tileStrip");
  if (tile) tile.style.backgroundImage = "url(./assets/glass/black-mid.webp)";

  rebuild();
  fitCaptions();

  var timer;
  window.addEventListener("resize", function () {
    clearTimeout(timer);
    timer = setTimeout(function () {
      rebuild();
      fitCaptions();
    }, 200);
  });
})();
