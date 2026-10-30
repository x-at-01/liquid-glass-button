/* 构建：i18n/*.yml + src/index.pug → out/<lang>/index.html（静态多语言页面）
   同时把 out/ 同步到 docs/（GitHub Pages 用）。 */
import { readFileSync, writeFileSync, mkdirSync, rmSync, cpSync, readdirSync, existsSync } from "node:fs";
import { join } from "node:path";
import yaml from "js-yaml";
import pug from "pug";

const ROOT = import.meta.dir;
const RTL = new Set(["ar", "he", "fa", "ur"]);

const LANGS = readdirSync(join(ROOT, "i18n"))
  .filter((f) => f.endsWith(".yml"))
  .map((f) => f.replace(/\.yml$/, ""))
  .sort();

const css = readFileSync(join(ROOT, "src/style.css"), "utf8");
const appJs = readFileSync(join(ROOT, "src/app.js"), "utf8");

// assets/glass-filters.svg 是独立可预览的 SVG；内联时去掉最外层 <svg> 包裹
const filtersSvg = readFileSync(join(ROOT, "assets/glass-filters.svg"), "utf8")
  .replace(/^[\s\S]*?<svg[^>]*>/, "")
  .replace(/<\/svg\s*>\s*$/, "")
  .trim();

const langs = LANGS.map((code) => {
  const dict = yaml.load(readFileSync(join(ROOT, "i18n", `${code}.yml`), "utf8"));
  return { code, name: dict.lang_name };
});

rmSync(join(ROOT, "out"), { recursive: true, force: true });

for (const code of LANGS) {
  const t = yaml.load(readFileSync(join(ROOT, "i18n", `${code}.yml`), "utf8"));
  const html = pug.renderFile(join(ROOT, "src/index.pug"), {
    t,
    code,
    dir: RTL.has(code) ? "rtl" : "ltr",
    langs,
    css,
    appJs,
    filtersSvg,
  });
  const dir = join(ROOT, "out", code);
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, "index.html"), html);
  cpSync(join(ROOT, "assets"), join(dir, "assets"), { recursive: true });
}

// 根页面：按 localStorage / 浏览器语言跳转到对应语言
writeFileSync(
  join(ROOT, "out/index.html"),
  `<!doctype html><meta charset="utf-8"><title>Liquid Glass Button</title>
<script>(function(){var L=${JSON.stringify(LANGS)},s=null;try{s=localStorage.lang}catch(e){}
var n=(navigator.language||"en").toLowerCase(),m=n.split("-")[0];
var c=L.indexOf(s)>=0?s:(L.indexOf(n)>=0?n:(L.indexOf(m)>=0?m:"en"));
location.replace("./"+c+"/index.html");})();</script>
<p>Loading… <a href="./en/index.html">en</a></p>`
);

// GitHub Pages：docs/ 与 out/ 保持同步
rmSync(join(ROOT, "docs"), { recursive: true, force: true });
cpSync(join(ROOT, "out"), join(ROOT, "docs"), { recursive: true });

console.log(`built ${LANGS.length} languages (${LANGS.join(", ")}) → out/ + docs/`);
if (!existsSync(join(ROOT, "docs/en/index.html"))) process.exit(1);
