# Liquid Glass Button

Apple-style **Liquid Glass** button for the web: three-slice 4× assets, real edge refraction via an
SVG `feDisplacementMap` filter, hover / active states, and a static multi-language demo built from
**YAML translations + Pug**.

**[Live demo →](https://x-at-01.github.io/liquid-glass-button/)** · [中文说明](#中文说明)

![button](https://img.shields.io/badge/assets-4%C3%97%20lossless%20WebP-2f6fe0) ![i18n](https://img.shields.io/badge/i18n-9%20languages-0a84ff) ![license](https://img.shields.io/badge/license-MIT-black)

---

## What's inside

| Piece | What it does |
|---|---|
| `assets/glass/*.webp` | The button skin: left cap · middle tile · right cap · combined sheet, all 4× (224px tall, shown at 56px), lossless WebP with alpha |
| `assets/glass-filters.svg` | **The SVG filter** (edge refraction + chromatic aberration), as a standalone file — inlined at build time, cloned per button at runtime |
| `src/app.js` | Language switcher + displacement-map generator + per-button filter variants (normal / hover / active) |
| `src/index.pug`, `src/style.css` | Template and styles (Apple-ish type scale: SF Pro, 17px body, 56px button) |
| `i18n/*.yml` | UI strings for 9 languages |
| `build.js` | YAML + Pug → `out/<lang>/index.html`, then syncs `docs/` for GitHub Pages |

## How the glass works

Background blur alone gives you *frosted* glass, not liquid glass. The “liquid” part is the
**SVG filter**:

1. `src/app.js` builds a displacement map for the button's exact size — `R` = x offset, `G` = y offset,
   `B` = edge strength (0 in the centre, 255 at the rim);
2. `feImage` feeds that map to **three** `feDisplacementMap` passes with slightly different scales;
   their R/G/B channels are separated and screen-blended → a subtle **chromatic aberration** at the rim;
3. an edge mask (from the map's `B` channel) keeps the centre crisp and un-displaced;
4. `backdrop-filter: url(#glass-N) blur(6px) contrast(1.15) brightness(1.04) saturate(170%)`.

Hover and active swap in pre-built filter variants (displacement ×1.45 / ×0.6) and change geometry
(`transform`, shadow, a press overlay) — `backdrop-filter` does not interpolate between `url()` values,
so smoothness comes from the `transform`/`box-shadow` transitions. `outline` is reserved for
`:focus-visible`, never for the pressed state.

The material comes from a **Qwen-Image-2.1** render (native alpha), then the shape and lighting are
redrawn by a procedural liquid-glass renderer: an SDF capsule, a normal-based specular that follows the
contour, an inner shadow for thickness, and a flattened middle tile so the slice repeats with
pixel-identical seams. See the generator: [`example/pill-asset`](https://github.com/x-at-01/liquid-glass-button#credits).

## Build & run

```bash
bun install          # pug + js-yaml
bun run build        # i18n/*.yml + src/index.pug → out/<lang>/  (and docs/ for Pages)
bun run dev          # build + serve http://127.0.0.1:8765
```

Adding a language = drop a new `i18n/<code>.yml` (copy `en.yml`) and rebuild; the switcher picks it up
automatically. RTL (`ar`) is handled with `dir="rtl"`.

## Credits & links

- [shuding/liquid-glass](https://github.com/shuding/liquid-glass) — `feImage` + `feDisplacementMap` edge lensing
- [rdev/liquid-glass-react](https://github.com/rdev/liquid-glass-react) — RGB-split chromatic aberration at the edges
- [Apple Human Interface Guidelines — Materials](https://developer.apple.com/design/human-interface-guidelines/materials)
- Material generated with [Qwen-Image-2.1](https://huggingface.co/Qwen/Qwen-Image-2.1) (text-to-image, native alpha channel)
- Icons: SVGO-minified SVG. The Apple logo is a trademark of Apple Inc., used only to demonstrate an App Store button.

MIT licensed.

---

## 中文说明

Apple 风格的**液态玻璃按钮**：三段式 4× 素材 + SVG `feDisplacementMap` 做真实边缘折射，
带 hover / active 状态；演示页是 **YAML 翻译 + Pug** 生成的静态多语言站点。

**[在线演示 →](https://x-at-01.github.io/liquid-glass-button/)**

### 结构

| 路径 | 说明 |
|---|---|
| `assets/glass/*.webp` | 按钮皮肤：左端 / 中间平铺块 / 右端 / 整图，全部 4×（224px 高，显示 56px），无损透明 WebP |
| `assets/glass-filters.svg` | **拆成独立文件的 SVG 滤镜**（边缘折射 + 色散）；构建时内联，运行时按按钮尺寸 clone |
| `src/app.js` | 语言切换 + 位移图生成 + 每按钮三份滤镜（常态 / hover / active） |
| `src/index.pug`、`src/style.css` | 模板与样式（SF Pro、17px 正文、56px 按钮） |
| `i18n/*.yml` | 9 种语言的文案 |
| `build.js` | YAML + Pug → `out/<lang>/index.html`，并同步 `docs/` 给 GitHub Pages |

### 玻璃是怎么做出来的

只加背景模糊是「磨砂玻璃」，不是液态玻璃；“液态”来自 SVG 滤镜：按按钮尺寸生成位移图
（R=x 位移、G=y 位移、B=边缘强度），用 `feImage` 喂给**三次** `feDisplacementMap`，
RGB 分通道后 screen 叠加做**边缘色散**，再用边缘遮罩让中心保持清晰，最后
`backdrop-filter: url(#glass-N) blur(6px) contrast(1.15) brightness(1.04) saturate(170%)`。

hover / active 切换预生成的滤镜变体（位移 ×1.45 / ×0.6）并改变几何（transform、阴影、按压覆盖层）。
`backdrop-filter` 在两组 `url()` 之间不会插值，所以顺滑感来自 transform/box-shadow 过渡；
`outline` 只留给 `:focus-visible`，不用于按下态。

材质由 **Qwen-Image-2.1** 生成（原生透明），形状与光影由程序化液态玻璃渲染重绘：
SDF 胶囊 + 基于法线的高光（自动顺着轮廓绕过端帽）+ 内阴影厚度感 + 平铺块按行压平（接缝逐像素一致）。

### 构建

```bash
bun install
bun run build   # → out/<lang>/（并同步 docs/）
bun run dev     # 构建 + 本地预览 http://127.0.0.1:8765
```

新增语言：复制一份 `i18n/en.yml` 改成 `<code>.yml` 再构建即可，语言切换按钮会自动带上。

### 参考

- [shuding/liquid-glass](https://github.com/shuding/liquid-glass)（边缘折射）
- [rdev/liquid-glass-react](https://github.com/rdev/liquid-glass-react)（RGB 分通道色散）
- [Apple HIG · Materials](https://developer.apple.com/design/human-interface-guidelines/materials)
- 材质：[Qwen-Image-2.1](https://huggingface.co/Qwen/Qwen-Image-2.1)（原生 alpha）
- Apple 标志为 Apple Inc. 商标，仅用于演示 App Store 按钮。

MIT 许可。
