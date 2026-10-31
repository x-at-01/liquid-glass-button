// 站点运行时（浏览器端，无需 shebang）：只负责语言切换与宽度标签
// 按钮本身是纯 CSS（button.css），不依赖任何 JS。
// 语言：沿用 webc 的机制与组件结构 —— localStorage 存索引、BroadcastChannel 同步，
//      弹层用 BoxX 的 dialog.Box.X.FFF + I18n 的 .I18n > c-vs > b > .Btn(.Main) + a.X
const LANG_KEY = "lang";
const CH_LANG = "lang";
const MEASURE_SEL = ".measure";
const BTN_ID = "langBtn";
const BOX_CLASS = "Box X FFF";
const BTN_PLAIN = "Btn";
const BTN_MAIN = "Btn Main";
const RESIZE_DELAY = 200;

const { idx: CUR_IDX, lang_li: LANG_LI, name_li: NAME_LI, choose: CHOOSE_TEXT } =
  window.__GLASS__ ?? { idx: 0, lang_li: [], name_li: [], choose: "" };
const { localStorage: STORE, BroadcastChannel: CH } = window;
const langBtn = document.getElementById(BTN_ID); // 没有语言按钮的页面直接跳过

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
      label = document.createElement("span"); // 文字要在 ::before 磨砂层之上
    btn.type = "button";
    label.textContent = name;
    btn.setAttribute("aria-label", name);
    btn.className = idx === CUR_IDX ? BTN_MAIN : BTN_PLAIN;
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
  if (!langBtn) return;
  STORE[LANG_KEY] = CUR_IDX;
  langBtn.addEventListener("click", langOpen);
  if (CH) {
    new CH(CH_LANG).addEventListener("message", (e) => {
      if (e.data !== CUR_IDX) langGo(e.data);
    });
  }
};

/* ---------------- 宽度标签 ---------------- */

const captionFit = () =>
  document.querySelectorAll(MEASURE_SEL).forEach((box) => {
    const btn = box.querySelector(".btn"),
      tip = box.querySelector(".w");
    tip.textContent = Math.round(btn.getBoundingClientRect().width) + " px";
  });

let resizeTimer;
window.addEventListener("resize", () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(captionFit, RESIZE_DELAY);
});

langInit();
captionFit();
window.addEventListener("load", captionFit); // 图标/字体就位后再校准一次
