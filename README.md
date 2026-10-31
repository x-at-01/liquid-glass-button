# Liquid Glass Button

Apple-style **Liquid Glass** button for the web, written in **pure CSS** — no bitmaps, and the component
needs no JavaScript. The pill's width follows its label, its surface is a frosted blur with a hairline rim,
and hover sweeps a specular band across it once. The demo around it is a static 75-language site built from
**YAML translations + Pug**.

**[Live demo →](https://x-at-01.github.io/liquid-glass-button/)** · [中文说明](#中文说明)

![pure css](https://img.shields.io/badge/component-pure%20CSS-2f6fe0) ![i18n](https://img.shields.io/badge/i18n-75%20languages-0a84ff) ![license](https://img.shields.io/badge/license-MIT-black)

---

## What's inside

| Piece | What it does |
|---|---|
| `src/button.css` | **The button component** — the `.btn` pill, both colour variants, hover sweep, press state. The only file the component needs |
| `src/page.css` | Styles for this demo site only (layout, topbar, sections, language dialog) |
| `src/index.pug` | Page template (Apple-ish type scale: SF Pro, 17px body, 56px button) |
| `src/demo.pug` | Standalone demo page, rendered into the downloadable bundle |
| `src/site.js` | Site-only runtime: language switcher + the "…px" width labels. The button itself needs neither |
| `assets/icons/*.svg` | Icons (download / App Store mark / GitHub / globe), one line style, `currentColor`, SVGO-minified |
| `i18n/langs.yml` | Language table — the same 75 codes and native names as webc (`src/js/i18n/CODE.js` + `NAME.js`), same order |
| `i18n/*.yml` | UI strings — one file per language, all 75 translated |
| `tran.yml` | Same shape as webc's: source `zh`, `to_li: "*"` |
| `build.js` | YAML + Pug → `out/<lang>/index.html` + the `tar.xz` bundle (generated output is git-ignored) |
| `.github/workflows/pages.yml` | CI release: on every push to `main` it builds and deploys `out/` to Pages |

## How the glass works

Four CSS layers — no filters, no canvas, nothing that depends on the element's size:

1. **Frost** — `backdrop-filter: blur(20px) saturate(180%)`; the only layer that reads the background.
2. **Body** — a near-flat tint (black `rgba(12,12,14,.82)`, blue a ~6% vertical gradient) plus one very light
   radial band along the top edge, so the surface is lit from above but stays flat.
3. **Rim** — a 1px inset highlight on top, a 1px dark line at the bottom and a soft inner shade. The edge is
   drawn with hairlines instead of a border, which is what keeps it from reading as plastic trim.
4. **Interaction** — hover adds a faint **inset** ring (the surface presses in) and runs one specular band
   across the pill: a skewed white gradient that translates from left to right in 1.4s, clipped by the pill's
   rounded corners via `overflow: hidden`. Pressed deepens the inset, scales down slightly and engraves the
   label with a `text-shadow`.

No outer drop shadow in any state, and `outline` is reserved for `:focus-visible`. Because no layer depends on
the element's size, stretching with the label is free and every modern browser renders it the same way.

## Download

The site footer links **`liquid-glass-button.tar.xz`**, built by CI (never committed). It contains:

```
liquid-glass-button/
  demo.html          self-contained page (CSS inlined, no scripts)
  button.css         the button component, drop-in
  page.css           demo page layout (not needed when you only want the button)
  icons/             download / App Store SVGs
```

Extract and open `demo.html` — no build step, no dependencies, no JavaScript.

## Reusing the button

One stylesheet is enough:

```html
<link rel="stylesheet" href="button.css">

<button class="btn btn--blue">Download</button>
<button class="btn btn--black">App Store</button>
```

Rules of thumb:

- width comes from the label — never set `width`; change `--pill-h` (height) and `--cap` (horizontal inset)
  if you need another size: `.btn{ --pill-h:64px; --cap:32px }`;
- colour comes from the variant (`--tint` for a custom dark tint, or override `background` like
  `.btn--blue` does);
- icons inside the pill are plain `<img>` / `<svg>` children — the component only sizes them
  (`.btn img{height:20px;width:20px}`);
- `page.css` is the demo's own layout — copying it is not required.

## Build & run

```bash
bun install          # pug + js-yaml
bun run build        # i18n/*.yml + src/index.pug → out/<lang>/ + the tar.xz
bun run dev          # build + serve http://127.0.0.1:8765
```

Nothing generated is committed: `out/`, `docs/` and `*.tar.xz` are git-ignored. Publishing is done by
GitHub Actions (`.github/workflows/pages.yml`): a push to `main` builds the 75 pages, packs the `tar.xz`
and deploys `out/` to Pages with the workflow token — no local deploy step.

### Languages (webc-aligned)

- **Language table**: `i18n/langs.yml` mirrors webc's `CODE.js`/`NAME.js` exactly — 75 languages, same order.
- **Addressing**: a language is an **index**, not a code — `localStorage.lang` stores the index, exactly like
  webc's `store.js`.
- **Detection**: root page picks `localStorage.lang` → `navigator.language` (exact hit in the table) →
  its base prefix → index 0, then redirects to `./<code>/`.
- **Switcher**: the same round icon button → native `<dialog>` list of all 75 native names, current one
  highlighted; selection is broadcast to other tabs with `BroadcastChannel("lang")`.
- **Translations**: one `i18n/<code>.yml` per language — all 75 are translated. There is no fallback:
  if a language file is missing the build fails with `missing translation: i18n/<code>.yml`.
- **RTL**: `ar fa ur sd iw` get `dir="rtl"`.

Add a language: add the code to `i18n/langs.yml`, create `i18n/<code>.yml`, rebuild — the switcher picks it
up automatically.

### SVG assets & git hook

- `assets/icons/*.svg` — icons (download / App Store mark / GitHub / globe), all SVGO-minified.
  One style for every icon: 24-unit grid, stroke 2, `currentColor`, used through CSS `mask-image` +
  `background-color: currentColor`, so the icon follows the button's `color` on hover / active and
  no icon can out-weigh another. The topbar GitHub link and the language switcher are the same `webc`
  `.BtnC` component — only the mask differs (`.Ico.github` vs `.BtnC.lang .Ico`).
- **pre-commit hook** (`.githooks/pre-commit`, bun + zx): if the staged changes contain `.svg` files,
  it runs SVGO on them and re-stages the result. Generated dirs (`docs/`, `out/`) are skipped.
  `bun install` wires it up through the `prepare` script (`git config core.hooksPath .githooks`);
  manually: `bun run svgo`.

### Code style

`build.js` and `src/site.js` follow the house JS rules in [`skill/js.md`](skill/js.md) (bun shebang,
`import.meta.dirname`, arrow functions only, no `try/catch`, `snake_case` data / `camelCase` functions /
`UPPER_SNAKE_CASE` constants, flat params, array multi-returns, no classes).

## Credits & links

- [Apple Human Interface Guidelines — Materials](https://developer.apple.com/design/human-interface-guidelines/materials)
- The Apple logo is a trademark of Apple Inc., used only to demonstrate an App Store button.

MIT licensed.

---

## 中文说明

Apple 风格的**液态玻璃按钮**，**纯 CSS 实现**：没有位图，组件也不依赖任何 JavaScript。按钮宽度随文字伸缩，
表面是磨砂模糊 + 发丝级棱边，hover 时有一道光带掠过一次。外围演示站是 **YAML + Pug** 生成的静态多语言站点。

**[在线演示 →](https://x-at-01.github.io/liquid-glass-button/)**

### 玻璃是怎么做出来的

四层 CSS，没有滤镜、没有 canvas，也没有任何依赖元素尺寸的东西：

1. **磨砂** —— `backdrop-filter: blur(20px) saturate(180%)`，唯一读取背景的层；
2. **瓶身** —— 近乎平色的 tint（黑色 `rgba(12,12,14,.82)`，蓝色约 6% 的竖向渐变），顶缘一道极轻的径向亮带；
3. **棱边** —— 上缘 1px 内高光、下缘 1px 暗线、加一层柔和内阴影；用发丝线而不是 border，才不像塑料包边；
4. **交互** —— hover 加一圈很淡的内阴影（表面被按进去），并让一条斜向光带掠过瓶身一次：
   `skewX(-12deg)` 的白色渐变，1.4s 从左移到右，靠 `overflow: hidden` 按圆角裁切；按下时内阴影加深、
   轻微缩小，文字加凹陷字影。

任何状态都没有外投影，`outline` 只留给 `:focus-visible`。因为没有任何一层依赖元素尺寸，**宽度随文字伸缩是免费的**，
各现代浏览器渲染一致。

### 下载

页脚有 **`liquid-glass-button.tar.xz`**（CI 构建，不进代码库）：

```
liquid-glass-button/
  demo.html          独立演示页（CSS 内联，无脚本）
  button.css         按钮组件，可直接取用
  page.css           演示页布局（只要按钮时不需要）
  icons/             下载 / App Store 图标
```

解压后直接双击 `demo.html` 即可，无需构建、无依赖、无 JavaScript。

### 复用按钮

只需要一个样式文件：

```html
<link rel="stylesheet" href="button.css">

<button class="btn btn--blue">下载</button>
<button class="btn btn--black">应用商店安装</button>
```

要点：

- 宽度由文字决定，不要写 `width`；需要别的尺寸改 `--pill-h`（高度）和 `--cap`（左右内缩），
  例如 `.btn{ --pill-h:64px; --cap:32px }`；
- 颜色来自色系类（自定义深色用 `--tint`，或像 `.btn--blue` 那样直接覆盖 `background`）；
- 瓶身里的图标就是普通 `<img>` / `<svg>` 子元素，组件只负责尺寸（`.btn img{height:20px;width:20px}`）；
- `page.css` 是演示站自己的布局，复用按钮时不需要。

### 构建

```bash
bun install
bun run build     # → out/<lang>/ + liquid-glass-button.tar.xz
bun run dev       # 构建 + 本地预览 http://127.0.0.1:8765
```

生成物一律不进代码库：`out/`、`docs/`、`*.tar.xz` 都在 `.gitignore` 里。发布由 GitHub Actions 完成
（`.github/workflows/pages.yml`）：push 到 `main` 后自动构建 75 个页面、打包 tar.xz，并用工作流令牌部署
到 Pages——本地不需要执行发布。

### 多语言（对标 webc）

- **语言表**：`i18n/langs.yml` 与 webc 的 `CODE.js` / `NAME.js` 完全一致（75 种、同顺序、同母语名）；
- **寻址**：语言用**索引**表示，`localStorage.lang` 存索引，与 webc 的 `store.js` 相同；
- **识别**：首页按 `localStorage.lang` → `navigator.language`（先精确匹配，再取前缀）→ 索引 0 的顺序跳转；
- **切换器**：右上角圆形按钮 → 原生 `<dialog>` 列出 75 种母语名，当前项高亮，选择结果用
  `BroadcastChannel("lang")` 同步到其它标签页；
- **翻译**：每种语言一个 `i18n/<code>.yml`，75 种全部有译文，不做回退——缺文件构建直接报错
  `missing translation: i18n/<code>.yml`；
- **RTL**：`ar fa ur sd iw` 自动 `dir="rtl"`。

新增语言：在 `i18n/langs.yml` 里加代码，再补一份 `i18n/<code>.yml`，重新构建即可。

### 结构

| 路径 | 说明 |
|---|---|
| `src/button.css` | **可复用的按钮组件**：`.btn` 药丸、两种色系、hover 扫光、按下态 |
| `src/page.css` | 仅演示站使用（布局、顶栏、区块、语言弹层） |
| `src/index.pug` | 页面模板（SF Pro、17px 正文、56px 按钮） |
| `src/demo.pug` | 独立演示页，构建时渲染进 tar.xz 素材包 |
| `src/site.js` | 站点专用脚本：语言切换 + 宽度标签，按钮本身不需要 |
| `assets/icons/*.svg` | 图标：一套画法——24 网格、描边 2、`currentColor`，CSS 走 `mask-image` 跟随按钮颜色 |
| `build.js` | YAML + Pug → `out/<lang>/index.html` + 素材包 |
| `.github/workflows/pages.yml` | 线上构建并发布到 GitHub Pages |

### 参考

- [Apple HIG · Materials](https://developer.apple.com/design/human-interface-guidelines/materials)
- 代码规范：`skill/js.md`（bun shebang / 只用箭头函数 / 无 try-catch / snake_case 数据 + camelCase 函数 +
  UPPER_SNAKE 常量 / 参数扁平 / 多值返回数组 / 禁止 class）
- Apple 标志为 Apple Inc. 商标，仅用于演示 App Store 按钮。

MIT 许可。
