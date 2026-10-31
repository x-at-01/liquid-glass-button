// 液态玻璃按钮 · 运行时（浏览器端，无需 shebang）
// 语言：沿用 webc 的机制与组件结构 —— localStorage 存索引、BroadcastChannel 同步、
//      弹层用 BoxX 的 dialog.Box.X.FFF + I18n 的 .I18n > c-vs > b > .Btn(.Main) + a.X
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
const BTN_ID = "langBtn";
const TILE_ID = "tileStrip";
const TMPL_ID = "glass-template";
const BOX_CLASS = "Box X FFF";
const BTN_PLAIN = "Btn";
const BTN_MAIN = "Btn Main";
const FALLBACK_CLS = "En";
const FALLBACK_TITLE = "English";
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

const { idx: CUR_IDX, lang_li: LANG_LI, name_li: NAME_LI, own_li: OWN_LI, choose: CHOOSE_TEXT } = window.__GLASS__;
const { localStorage: STORE, BroadcastChannel: CH } = window;
const langBtn = document.getElementById(BTN_ID);
const defs = document.querySelector(DEFS_SEL);
const styles = document.getElementById(STYLE_ID);
const tile = document.getElementById(TILE_ID);
const rand = () => Math.random().toString(36).slice(2, 9);

/* ---------------- 语言 ---------------- */

const langGo = (idx) => {
  STORE[LANG_KEY] = idx;
  location.href = "../" + LANG_LI[idx] + "/index.html";
};

// 弹层结构 / 类名 / 交互沿用 webc 的 BoxX + I18n 组件
const langOpen = () => {
  const box = document.createElement("dialog"),
    x = document.createElement("a"),
    main = document.createElement("main"),
    title = document.createElement("h6"),
    con = document.createElement("c-vs"),
    inner = document.createElement("b");
  box.className = BOX_CLASS;
  box.addEventListener("close", () => box.remove());
  x.className = "X";
  x.addEventListener("click", () => box.close());
  main.className = "I18n";
  title.textContent = CHOOSE_TEXT;
  NAME_LI.forEach((name, idx) => {
    const btn = document.createElement("button"),
      own = OWN_LI.includes(LANG_LI[idx]);
    const label = document.createElement("span"); // 文字要在 ::before 磨砂层之上
    btn.type = "button";
    label.textContent = name;
    btn.setAttribute("aria-label", name);
    btn.className = idx === CUR_IDX ? BTN_MAIN : BTN_PLAIN;
    if (!own) {
      btn.classList.add(FALLBACK_CLS);
      btn.title = FALLBACK_TITLE;
    }
    btn.addEventListener("click", () => {
      box.close();
      langGo(idx);
    });
    btn.append(label);
    inner.append(btn);
  });
  con.append(inner);
  main.append(title, con);
  box.append(x, main);
  document.body.prepend(box);
  box.showModal();
};

const langInit = () => {
  STORE[LANG_KEY] = CUR_IDX;
  langBtn.addEventListener("click", langOpen);
  if (CH) {
    new CH(CH_LANG).addEventListener("message", (e) => {
      if (e.data !== CUR_IDX) langGo(e.data);
    });
  }
};

/* ---------------- Liquid Glass ---------------- */

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
  `.${cls}${sel}{backdrop-filter:url(#${id}) ${blur}}`;

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
  defs.querySelectorAll("filter").forEach((filter) => {
    if (filter.id !== TMPL_ID) filter.remove(); // 只删生成的，保留模板
  });
  styles.textContent = "";
  document.querySelectorAll(BTN_SEL).forEach((btn) => {
    [...btn.classList].filter((cls) => cls.startsWith("glass-btn-")).forEach((cls) => btn.classList.remove(cls));
    glassBtnBuild(btn);
  });
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
