// 液态玻璃按钮 · 运行时（浏览器端，无需 shebang）
// 语言：与 webc src/js/i18n 相同机制 —— localStorage 存索引、BroadcastChannel 同步、语言表由构建注入
// 玻璃：按按钮尺寸生成位移图，clone assets/glass-filters.svg 的滤镜模板，生成常态/hover/active 三份
const LANG_KEY = "lang";
const CH_LANG = "lang";
const TILE_IMG = "url(../assets/glass/black-mid.webp)";
const BTN_SEL = ".btn";
const MAP_SEL = ".g-map";
const DISP_SEL = ".g-disp";
const STYLE_ID = "glass-styles";
const DEFS_SEL = ".glass-defs";
const MEASURE_SEL = ".measure";
const DIALOG_ID = "langDialog";
const BTN_ID = "langBtn";
const TILE_ID = "tileStrip";
const TMPL_ID = "glass-template";
const MAP_X = 0, MAP_Y = 1, MAP_EDGE = 2; // 位移图通道语义
const BAND_RATIO = 0.42; // 折射带宽度（相对高度）
const SCALE_RATIO = 0.34;
const SPECULAR_STEP = 0.08;
const HOVER_RATIO = 1.45;
const ACTIVE_RATIO = 0.6;
const BLUR_NORMAL = "blur(6px) contrast(1.15) brightness(1.04) saturate(170%)";
const BLUR_HOVER = "blur(6px) contrast(1.18) brightness(1.14) saturate(190%)";
const BLUR_ACTIVE = "blur(10px) contrast(1.08) brightness(.94) saturate(140%)";
const RESIZE_DELAY = 200;

const { code: CUR_CODE, idx: CUR_IDX, lang_li: LANG_LI } = window.__GLASS__;
const { localStorage: STORE, BroadcastChannel: CH } = window;
const dialog = document.getElementById(DIALOG_ID);
const langBtn = document.getElementById(BTN_ID);
const defs = document.querySelector(DEFS_SEL);
const styles = document.getElementById(STYLE_ID);
const tile = document.getElementById(TILE_ID);
const rand = () => Math.random().toString(36).slice(2, 9);

const langGo = (idx) => {
  STORE[LANG_KEY] = idx;
  if (idx === CUR_IDX) return dialog.close();
  if (CH) new CH(CH_LANG).postMessage(idx);
  location.href = "../" + LANG_LI[idx] + "/index.html";
};

// 位移图：R = x 位移、G = y 位移、B = 边缘强度（0 中心 → 255 贴边）
const dispMapDraw = (w, h) => {
  const canvas = document.createElement("canvas"),
    ctx = canvas.getContext("2d"),
    img = ctx.createImageData(w, h),
    data = img.data,
    radius = h / 2,
    cx = w / 2,
    cy = h / 2,
    band = Math.max(5, h * BAND_RATIO);
  canvas.width = w;
  canvas.height = h;
  for (let y = 0; y < h; ++y) {
    for (let x = 0; x < w; ++x) {
      const qx = Math.abs(x - cx) - (w / 2 - radius),
        qy = Math.abs(y - cy),
        dist = Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) + Math.min(Math.max(qx, qy), 0) - radius,
        gx = (x - cx) / (w / 2),
        gy = (y - cy) / (h / 2),
        len = Math.hypot(gx, gy) || 1,
        nx = dist < 0 ? gx / len : 0,
        ny = dist < 0 ? gy / len : 0,
        edge = (Math.max(0, 1 - Math.abs(dist) / band)) ** 2,
        at = (y * w + x) * 4;
      data[at + MAP_X] = 128 + nx * edge * 127;
      data[at + MAP_Y] = 128 + ny * edge * 127;
      data[at + MAP_EDGE] = edge * 255;
      data[at + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  return canvas;
};

const filterBuild = (id, w, h, mapUrl, scale) => {
  const filter = document.getElementById(TMPL_ID).cloneNode(true),
    map = filter.querySelector(MAP_SEL),
    disp_li = filter.querySelectorAll(DISP_SEL);
  filter.id = id;
  filter.setAttribute("width", w);
  filter.setAttribute("height", h);
  map.setAttribute("href", mapUrl);
  map.setAttribute("width", w);
  map.setAttribute("height", h);
  disp_li.forEach((disp, i) => disp.setAttribute("scale", (scale * (1 - SPECULAR_STEP * i)).toFixed(2)));
  defs.appendChild(filter);
};

const glassRule = (cls, sel, id, blur) =>
  `.${cls}${sel}{backdrop-filter:url(#${id}) ${blur};-webkit-backdrop-filter:url(#${id}) ${blur}}`;

const glassBtnBuild = (btn) => {
  const rect = btn.getBoundingClientRect(),
    w = Math.max(2, Math.round(rect.width)),
    h = Math.max(2, Math.round(rect.height)),
    id = "glass-" + rand(),
    scale = Math.max(6, Math.round(h * SCALE_RATIO)),
    mapUrl = dispMapDraw(w, h).toDataURL(),
    cls = "glass-btn-" + rand();
  filterBuild(id, w, h, mapUrl, scale);
  filterBuild(id + "-h", w, h, mapUrl, scale * HOVER_RATIO);
  filterBuild(id + "-a", w, h, mapUrl, scale * ACTIVE_RATIO);
  btn.classList.add(cls);
  styles.textContent +=
    glassRule(cls, "", id, BLUR_NORMAL) +
    glassRule(cls, ":hover", id + "-h", BLUR_HOVER) +
    glassRule(cls, ":active", id + "-a", BLUR_ACTIVE);
};

const captionFit = () =>
  document.querySelectorAll(MEASURE_SEL).forEach((box) => {
    const btn = box.querySelector(BTN_SEL),
      tip = box.querySelector(".w");
    tip.textContent = Math.round(btn.getBoundingClientRect().width) + " px";
  });

const glassRebuild = () => {
  defs.querySelectorAll("filter").forEach((filter) => filter.remove());
  styles.textContent = "";
  document.querySelectorAll(BTN_SEL).forEach((btn) => {
    [...btn.classList].filter((cls) => cls.startsWith("glass-btn-")).forEach((cls) => btn.classList.remove(cls));
    glassBtnBuild(btn);
  });
};

const langInit = () => {
  STORE[LANG_KEY] = CUR_IDX;
  langBtn.addEventListener("click", () => dialog.showModal());
  dialog.addEventListener("click", (e) => {
    const item = e.target.closest("[data-idx]");
    if (item) return langGo(+item.getAttribute("data-idx"));
    if (e.target === dialog) return dialog.close();
  });
  if (CH) {
    new CH(CH_LANG).addEventListener("message", (e) => {
      if (e.data !== CUR_IDX) location.href = "../" + LANG_LI[e.data] + "/index.html";
    });
  }
};

let resizeTimer;
const onResize = () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => {
    glassRebuild();
    captionFit();
  }, RESIZE_DELAY);
};

tile.style.backgroundImage = TILE_IMG;
langInit();
glassRebuild();
captionFit();
window.addEventListener("resize", onResize);
