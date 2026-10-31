#!/usr/bin/env -S bun
// 构建：tran.yml + i18n/*.yml + src/index.pug → out/<lang>/index.html（静态多语言站点）
// 语言表、语言寻址（索引）、回退策略都与 webc 的 src/js/i18n 一致。
import { readFileSync, writeFileSync, mkdirSync, rmSync, cpSync, readdirSync } from "node:fs";
import { join } from "node:path";
import yaml from "js-yaml";
import pug from "pug";

const ROOT = import.meta.dirname;
const I18N_DIR = join(ROOT, "i18n");
const SRC_DIR = join(ROOT, "src");
const OUT_DIR = join(ROOT, "out");
const DOCS_DIR = join(ROOT, "docs");
const ASSETS_DIR = join(ROOT, "assets");
const LANG_FILE = join(I18N_DIR, "langs.yml");
const PAGE_TMPL = join(SRC_DIR, "index.pug");
const CSS_FILE = join(SRC_DIR, "style.css");
const APP_FILE = join(SRC_DIR, "app.js");
const FILTER_FILE = join(ASSETS_DIR, "glass-filters.svg");

const T = 0, DICT = 1, IS_OWN = 2; // 多值返回的位置语义：[code, dict, isOwn]
const RTL_CODE_LI = ["ar", "fa", "ur", "sd", "iw"];
const FALLBACK_CODE = "en";
const RTL = "rtl", LTR = "ltr";

const textRead = (path) => readFileSync(path, "utf8");
const ymlRead = (path) => yaml.load(textRead(path));

// assets/glass-filters.svg 可独立预览；内联时去掉最外层 <svg> 包裹
const filterSvg = textRead(FILTER_FILE)
  .replace(/^[\s\S]*?<svg[^>]*>/, "")
  .replace(/<\/svg\s*>\s*$/, "")
  .trim();

const langLi = ymlRead(LANG_FILE);
const ownLi = readdirSync(I18N_DIR)
  .filter((name) => name.endsWith(".yml") && name !== "langs.yml")
  .map((name) => name.replace(/\.yml$/, ""));

const dictLi = langLi.map(({ code }) => [
  code,
  ymlRead(join(I18N_DIR, (ownLi.includes(code) ? code : FALLBACK_CODE) + ".yml")),
  ownLi.includes(code),
]);

const pageDir = (code) => join(OUT_DIR, code);

const pageBuild = (code, dict, own_li) => {
  const html = pug.renderFile(PAGE_TMPL, {
    t: dict,
    code,
    dir: RTL_CODE_LI.includes(code) ? RTL : LTR,
    langs: langLi.map((lang, idx) => ({ ...lang, idx, own: ownLi.includes(lang.code) })),
    css: textRead(CSS_FILE),
    appJs: textRead(APP_FILE),
    filterSvg,
    fallback: !own_li.includes(code),
  });
  mkdirSync(pageDir(code), { recursive: true });
  writeFileSync(join(pageDir(code), "index.html"), html);
};

// 首页：与 webc store.js 相同的取语言逻辑（localStorage 存索引 → navigator.language → 前缀 → 0）
const rootPage = `<!doctype html><meta charset="utf-8"><title>Liquid Glass Button</title>
<script>const CODE = ${JSON.stringify(langLi.map(({ code }) => code))};
const KEY = "lang", local = localStorage[KEY];
const idx = local !== undefined && local !== ""
  ? +local
  : (() => {
      const nav = navigator.language || "en";
      const hit = CODE.indexOf(nav);
      return hit >= 0 ? hit : Math.max(0, CODE.indexOf(nav.split("-")[0]));
    })();
location.replace("./" + CODE[idx] + "/index.html");</script>
<p>Loading… <a href="./en/index.html">en</a></p>
`;

rmSync(OUT_DIR, { recursive: true, force: true });
dictLi.forEach(([code, dict]) => pageBuild(code, dict, ownLi));
writeFileSync(join(OUT_DIR, "index.html"), rootPage);
cpSync(ASSETS_DIR, join(OUT_DIR, "assets"), { recursive: true });

rmSync(DOCS_DIR, { recursive: true, force: true });
cpSync(OUT_DIR, DOCS_DIR, { recursive: true });

console.log(
  `built ${langLi.length} languages (${ownLi.length} translated, ${langLi.length - ownLi.length} fallback to ${FALLBACK_CODE}) → out/ + docs/`
);
