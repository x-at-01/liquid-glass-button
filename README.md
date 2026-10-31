# Liquid Glass Button

Apple-style **Liquid Glass** button for the web, drawn with **CSS and SVG only — no bitmaps**. Real edge
refraction comes from an SVG `feDisplacementMap` filter generated for each button's size, with hover /
press states, on a static multi-language site built from **YAML translations + Pug**.

**[Live demo →](https://x-at-01.github.io/liquid-glass-button/)** · [中文说明](#中文说明)

![no bitmaps](https://img.shields.io/badge/assets-zero%20bitmaps-2f6fe0) ![i18n](https://img.shields.io/badge/i18n-75%20languages-0a84ff) ![license](https://img.shields.io/badge/license-MIT-black)

---

## What's inside

| Piece | What it does |
|---|---|
| `assets/glass-filters.svg` | **The SVG filter** (edge refraction + chromatic aberration) as a standalone file — inlined at build time, cloned per button at runtime |
| `assets/icons/*.svg` | Icons (download / App Store mark / GitHub / globe), one line style, `currentColor`, SVGO-minified |
| `src/app.js` | Displacement-map generator + per-button filter variants (normal / hover / active) + the webc-style language switcher |
| `src/index.pug`, `src/style.css` | Template and styles (Apple-ish type scale: SF Pro, 17px body, 56px button) |
| `src/demo.pug` | Standalone demo page, rendered into the downloadable bundle |
| `i18n/langs.yml` | Language table — the same 75 codes and native names as webc (`src/js/i18n/CODE.js` + `NAME.js`), same order |
| `i18n/*.yml` | UI strings — one file per language, all 75 translated |
| `tran.yml` | Same shape as webc's: source `zh`, `to_li: "*"` — missing languages fall back to `en` and are tagged in the switcher |
| `build.js` | YAML + Pug → `out/<lang>/index.html`, the `tar.xz` bundle, then syncs `docs/` for GitHub Pages |

## How the glass works

Background blur alone gives you *frosted* glass, not liquid glass. The “liquid” part is the
**SVG filter**:

1. `src/app.js` builds a displacement map for the button's exact size — `R` = x offset, `G` = y offset,
   `B` = edge strength (0 in the centre, 255 at the rim);
2. `feImage` feeds that map to **three** `feDisplacementMap` passes with slightly different scales;
   their R/G/B channels are separated and screen-blended → a subtle **chromatic aberration** at the rim;
3. an edge mask (from the map's `B` channel) keeps the centre crisp and un-displaced;
4. `backdrop-filter: url(#glass-N) blur(6px) contrast(1.15) brightness(1.04) saturate(170%)`.

The material itself is three CSS layers over a tint: a wide soft light band along the top edge (brightest
at the rim, fading inward, gone at the corners — no hard 1px line, which reads as plastic), a faint inner
bounce at the bottom, and a diagonal `mix-blend-mode: screen` sheen from the upper left.

Hover and active swap in pre-built filter variants (displacement ×1.45 / ×0.6) and change geometry
(`transform`, shadow, a press overlay) plus the label colour (`.9` → `#fff` on hover; the pressed label
gets an engraved `text-shadow` so it reads as pushed into the glass). `backdrop-filter` does not
interpolate between `url()` values, so smoothness comes from the `transform` / `box-shadow` / `opacity`
transitions. `outline` is reserved for `:focus-visible`, never for the pressed state.

Caveat: SVG filters inside `backdrop-filter` are Chromium-only today. Safari and Firefox keep the blur,
the tint and the rim light, and simply skip the refraction.

## Download

The site footer links **`liquid-glass-button.tar.xz`** (also at the repo root of `out/`). It contains a
standalone demo plus everything it needs:

```
liquid-glass-button/
  demo.html          self-contained page (CSS, JS and the filter inlined)
  style.css          button styles, drop-in
  app.js             displacement-map generator + filter builder
  glass-filters.svg  the filter template
  icons/             download / App Store SVGs
```

Extract and open `demo.html` — no build step, no dependencies.

## Build & run

```bash
bun install          # pug + js-yaml
bun run build        # i18n/*.yml + src/index.pug → out/<lang>/ + the tar.xz (and docs/ for Pages)
bun run dev          # build + serve http://127.0.0.1:8765
```

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
  `.BtnC` component — only the mask differs (`.Ico.github` vs `.BtnC.lang .Ico`), so they stay
  pixel-identical by construction.
- `assets/glass-filters.svg` — the filter template as a standalone SVG. It is referenced from CSS at
  runtime, so `svgo.config.mjs` **disables** `removeUselessDefs`, `removeHiddenElems`, `cleanupIds` and
  `removeUnknownsAndDefaults`; otherwise SVGO would delete the whole `<defs>` or rename
  `#glass-template` / `.g-map` / `.g-disp` and break the runtime.
- **pre-commit hook** (`.githooks/pre-commit`, bun + zx): if the staged changes contain `.svg` files,
  it runs SVGO on them and re-stages the result. Generated dirs (`docs/`, `out/`) are skipped.
  `bun install` wires it up through the `prepare` script (`git config core.hooksPath .githooks`);
  manually: `bun run svgo`.

### Code style

`build.js` and `src/app.js` follow the house JS rules in [`skill/js.md`](skill/js.md) (bun shebang,
`import.meta.dirname`, arrow functions only, no `try/catch`, `snake_case` data / `camelCase` functions /
`UPPER_SNAKE_CASE` constants, flat params, array multi-returns, no classes).

## Credits & links

- [shuding/liquid-glass](https://github.com/shuding/liquid-glass) — `feImage` + `feDisplacementMap` edge lensing
- [rdev/liquid-glass-react](https://github.com/rdev/liquid-glass-react) — RGB-split chromatic aberration at the edges
- [Apple Human Interface Guidelines — Materials](https://developer.apple.com/design/human-interface-guidelines/materials)
- The Apple logo is a trademark of Apple Inc., used only to demonstrate an App Store button.

MIT licensed.

---

## 中文说明

Apple 风格的**液态玻璃按钮**：只用 **CSS + SVG 绘制，不含任何位图**；边缘折射由按按钮尺寸生成的
SVG `feDisplacementMap` 滤镜完成，带 hover / 按下状态。演示页是 **YAML 翻译 + Pug** 生成的静态多语言站点。

**[在线演示 →](https://x-at-01.github.io/liquid-glass-button/)**

### 玻璃是怎么做出来的

只加背景模糊是「磨砂玻璃」，不是液态玻璃；“液态”来自 SVG 滤镜：按按钮尺寸生成位移图
（R=x 位移、G=y 位移、B=边缘强度），用 `feImage` 喂给**三次** `feDisplacementMap`，
RGB 分通道后 screen 叠加做**边缘色散**，再用边缘遮罩让中心保持清晰，最后
`backdrop-filter: url(#glass-N) blur(6px) contrast(1.15) brightness(1.04) saturate(170%)`。

材质本身是暗色 tint 上的三层 CSS：顶缘一条宽而柔的亮带（贴边最亮、往里 6–8px 渐隐、到转角消失——
没有 1px 硬线，那会读成塑料），底部一道很弱的内侧回光，左上角一团 `mix-blend-mode: screen` 的斜向天光。

hover / active 切换预生成的滤镜变体（位移 ×1.45 / ×0.6），并改变几何（transform、阴影）和文字状态：
hover 转纯白，按下时加凹陷的 `text-shadow`，读起来像被压进玻璃里。
`backdrop-filter` 在两组 `url()` 之间不会插值，所以顺滑感来自 transform / box-shadow / opacity 过渡；
`outline` 只留给 `:focus-visible`，不用于按下态。

注意：`backdrop-filter` 里的 SVG 滤镜目前只有 Chromium 支持。Safari 与 Firefox 会保留模糊、底色和棱边高光，
只是不做折射。

### 下载

页脚有 **`liquid-glass-button.tar.xz`** 的下载链接（构建产物在 `out/`）。包内容：

```
liquid-glass-button/
  demo.html          独立演示页（CSS、JS、滤镜全部内联）
  style.css          按钮样式，可直接取用
  app.js             位移图生成 + 滤镜构建
  glass-filters.svg  滤镜模板
  icons/             下载 / App Store 图标
```

解压后直接双击 `demo.html` 即可，无需构建、无依赖。

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
| `assets/glass-filters.svg` | **拆成独立文件的 SVG 滤镜**（边缘折射 + 色散）；构建时内联，运行时按按钮尺寸 clone |
| `assets/icons/*.svg` | 图标：一套画法——24 网格、描边 2、`currentColor`，CSS 侧走 `mask-image` 跟随按钮颜色 |
| `src/app.js` | 位移图生成 + 每按钮三份滤镜（常态 / hover / active）+ 语言切换 |
| `src/index.pug`、`src/style.css` | 模板与样式（SF Pro、17px 正文、56px 按钮） |
| `src/demo.pug` | 独立演示页，构建时渲染进 tar.xz 素材包 |
| `build.js` | YAML + Pug → `out/<lang>/index.html` + 素材包，并同步 `docs/` 给 GitHub Pages |

### 构建

```bash
bun install
bun run build   # → out/<lang>/ + liquid-glass-button.tar.xz（并同步 docs/）
bun run dev     # 构建 + 本地预览 http://127.0.0.1:8765
```

### 参考

- [shuding/liquid-glass](https://github.com/shuding/liquid-glass)（边缘折射）
- [rdev/liquid-glass-react](https://github.com/rdev/liquid-glass-react)（RGB 分通道色散）
- [Apple HIG · Materials](https://developer.apple.com/design/human-interface-guidelines/materials)
- 代码规范：`skill/js.md`（bun shebang / 只用箭头函数 / 无 try-catch / snake_case 数据 + camelCase 函数 +
  UPPER_SNAKE 常量 / 参数扁平 / 多值返回数组 / 禁止 class）
- Apple 标志为 Apple Inc. 商标，仅用于演示 App Store 按钮。

MIT 许可。
