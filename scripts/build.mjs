import { build, context } from "esbuild";
import { readFileSync, cpSync, mkdirSync, rmSync } from "node:fs";

const watch = process.argv.includes("--watch");
const banner = readFileSync(new URL("../userscript.header.txt", import.meta.url), "utf8");

// 把词典 JSON 复制到 dist/dicts/（产物目录可整体作为词典的静态托管源）
rmSync("dist/dicts", { recursive: true, force: true });
mkdirSync("dist/dicts", { recursive: true });
cpSync("dicts", "dist/dicts", { recursive: true });

const options = {
  entryPoints: ["src/index.ts"],
  bundle: true,
  format: "iife",
  target: "es2018",
  minify: true,
  legalComments: "none",
  charset: "utf8",
  banner: { js: banner },
  outfile: "dist/yucata-zh-help.user.js",
};

if (watch) {
  const ctx = await context(options);
  await ctx.watch();
  console.log("[watch] 监听中… 按 Ctrl+C 停止");
} else {
  await build(options);
  console.log("[build] 已生成 dist/yucata-zh-help.user.js（词典已复制到 dist/dicts/）");
}
