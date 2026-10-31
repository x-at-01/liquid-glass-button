#!/usr/bin/env -S bun
// 构建：tran.yml + i18n/*.yml + src/index.pug → out/<lang>/index.html（静态多语言站点）
// 语言表、语言寻址（索引）、回退策略都与 webc 的 src/js/i18n 一致。
import { readFileSync, writeFileSync, mkdirSync, rmSync, cpSync, existsSync } from "node:fs";
import { join } from "node:path";
import { load } from "js-yaml";
import pug from "pug";

const ROOT = import.meta.dirname;
const I18N_DIR = join(ROOT, "i18n");
const SRC_DIR = join(ROOT, "src");
const OUT_DIR = join(ROOT, "out");
const ASSETS_DIR = join(ROOT, "assets");
const LANG_FILE = join(I18N_DIR, "langs.yml");
const PAGE_TMPL = join(SRC_DIR, "index.pug");
const DEMO_TMPL = join(SRC_DIR, "demo.pug");
const BUTTON_CSS = join(SRC_DIR, "button.css");
const PAGE_CSS = join(SRC_DIR, "page.css");
const SITE_FILE = join(SRC_DIR, "site.js");

const T = 0, DICT = 1, IS_OWN = 2; // 多值返回的位置语义：[code, dict, isOwn]
const RTL_CODE_LI = ["ar", "fa", "ur", "sd", "iw"];
const RTL = "rtl", LTR = "ltr";

const textRead = (path) => readFileSync(path, "utf8");
const ymlRead = (path) => load(textRead(path));

const langLi = ymlRead(LANG_FILE);

// 每种语言都必须有 i18n/<code>.yml；缺一个就让构建失败（没有回退）
const dictLi = langLi.map(({ code }) => {
  const file = join(I18N_DIR, code + ".yml");
  if (!existsSync(file)) throw new Error(`missing translation: i18n/${code}.yml`);
  return [code, ymlRead(file)];
});

const pageDir = (code) => join(OUT_DIR, code);

const pageBuild = (code, dict) => {
  const idx = langLi.findIndex((lang) => lang.code === code),
    glass = JSON.stringify({
      code,
      idx,
      lang_li: langLi.map((lang) => lang.code),
      name_li: langLi.map((lang) => lang.name),
      choose: dict.lang_choose,
    }),
    html = pug.renderFile(PAGE_TMPL, {
    t: dict,
    code,
    glass,
    dir: RTL_CODE_LI.includes(code) ? RTL : LTR,
    css: textRead(BUTTON_CSS) + "\n" + textRead(PAGE_CSS),
    siteJs: textRead(SITE_FILE),
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
dictLi.forEach(([code, dict]) => pageBuild(code, dict));
writeFileSync(join(OUT_DIR, "index.html"), rootPage);
cpSync(ASSETS_DIR, join(OUT_DIR, "assets"), { recursive: true });

// 素材包：独立演示页 + CSS + 运行时 JS + 滤镜模板 + 图标 → tar.xz
const PACK_NAME = "liquid-glass-button",
  PACK_DIR = join(OUT_DIR, PACK_NAME),
  PACK_FILE = join(OUT_DIR, PACK_NAME + ".tar.xz");

mkdirSync(join(PACK_DIR, "icons"), { recursive: true });
writeFileSync(
  join(PACK_DIR, "demo.html"),
  pug.renderFile(DEMO_TMPL, {
    css: textRead(BUTTON_CSS) + "\n" + textRead(PAGE_CSS),
  })
);
cpSync(BUTTON_CSS, join(PACK_DIR, "button.css"));
cpSync(PAGE_CSS, join(PACK_DIR, "page.css"));
cpSync(join(ASSETS_DIR, "icons"), join(PACK_DIR, "icons"), { recursive: true });
{
  const run = Bun.spawnSync(["tar", "-cJf", PACK_FILE, "-C", OUT_DIR, PACK_NAME]);
  if (run.exitCode !== 0) throw new Error("tar failed: " + run.stderr.toString());
}
rmSync(PACK_DIR, { recursive: true, force: true });

writeFileSync(join(OUT_DIR, ".nojekyll"), ""); // Pages 不做 Jekyll 处理

console.log(`built ${langLi.length} languages → out/`);
