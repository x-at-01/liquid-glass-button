#!/usr/bin/env -S bun
// 一键发布：构建（含 tar.xz）→ 把 out/ 强推到 gh-pages 分支
// main 分支不保存任何生成物；GitHub Pages 从 gh-pages 提供站点与 tar.xz。
import { cpSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const ROOT = import.meta.dirname;
const BRANCH = "gh-pages";

const run = (argv, cwd) => {
  const r = Bun.spawnSync(argv, { cwd, stdout: "inherit", stderr: "inherit" });
  if (r.exitCode !== 0) throw new Error(`${argv.join(" ")} 失败`);
};
const capture = (argv) => {
  const r = Bun.spawnSync(argv, { cwd: ROOT, stdout: "pipe", stderr: "pipe" });
  if (r.exitCode !== 0) throw new Error(`${argv.join(" ")} 失败`);
  return r.stdout.toString().trim();
};

// 1) 构建：75 种语言页面 + 素材包 tar.xz（全部落在 out/）
run(["bun", "run", "build"], ROOT);

// 2) 在临时目录建 gh-pages 提交，强推上去
const remote = capture(["git", "remote", "get-url", "origin"]);
const name = capture(["git", "config", "user.name"]);
const email = capture(["git", "config", "user.email"]);
const dir = mkdtempSync(join(tmpdir(), "liquid-glass-button-pages-"));

cpSync(join(ROOT, "out"), dir, { recursive: true });
writeFileSync(join(dir, ".nojekyll"), "");
run(["git", "init", "-q", "-b", BRANCH], dir);
run(["git", "add", "-A"], dir);
run(
  ["git", "-c", `user.name=${name}`, "-c", `user.email=${email}`, "commit", "-q", "-m",
    `deploy ${new Date().toISOString().slice(0, 19).replace("T", " ")}`],
  dir
);
run(["git", "push", "-q", "-f", remote, BRANCH], dir);
rmSync(dir, { recursive: true, force: true });

console.log(`published → ${BRANCH}`);
