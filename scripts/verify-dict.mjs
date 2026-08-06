// 词典验证脚本：键完整性 + 占位符顺序（模式 B 必做）
// 用法：node scripts/verify-dict.mjs <游戏类型> <英文基准路径>
// 示例：node scripts/verify-dict.mjs Tiletum /tmp/tiletum_en.json
//
// 验证内容：
//   1. 中文词典键与英文基准完全一致（无缺失、无多余）
//   2. 含占位符的键，中文里 {{}} 顺序与英文完全一致（appendText 硬性要求）
//   3. 模拟 appendText 渲染，确认无 {{ 残留

import { readFileSync, existsSync } from "node:fs";

const gameType = process.argv[2];
const enPath = process.argv[3];
if (!gameType || !enPath) {
  console.error("用法: node scripts/verify-dict.mjs <游戏类型> <英文基准json路径>");
  process.exit(1);
}

const zhPath = `dicts/${gameType}/zh-CN.json`;
if (!existsSync(enPath)) {
  console.error(`英文基准不存在: ${enPath}`);
  process.exit(1);
}
if (!existsSync(zhPath)) {
  console.error(`中文词典不存在: ${zhPath}`);
  process.exit(1);
}

const en = JSON.parse(readFileSync(enPath, "utf8"));
const zh = JSON.parse(readFileSync(zhPath, "utf8"));
let failed = false;

// 1. 键完整性
const enKeys = Object.keys(en);
const zhKeys = new Set(Object.keys(zh));
const missing = enKeys.filter((k) => !zhKeys.has(k));
const extra = Object.keys(zh).filter((k) => !(k in en));
if (missing.length) {
  failed = true;
  console.error(`❌ 缺失键 (${missing.length}): ${missing.join(", ")}`);
}
if (extra.length) {
  failed = true;
  console.error(`❌ 多余键 (${extra.length}): ${extra.join(", ")}`);
}
console.log(`键: en=${enKeys.length} zh=${zhKeys.size} 缺失=${missing.length} 多余=${extra.length}`);

// 2. 占位符顺序
const phRe = /\{\{[^}]+\}\}/g;
const orderBad = [];
for (const k of enKeys) {
  const eo = (en[k] || "").match(phRe) || [];
  const zo = (zh[k] || "").match(phRe) || [];
  const same = eo.length === zo.length && eo.every((v, i) => v === zo[i]);
  if (!same && (eo.length || zo.length)) orderBad.push(k);
}
if (orderBad.length) {
  failed = true;
  console.error(`❌ 占位符顺序不一致 (${orderBad.length}): ${orderBad.join(", ")}`);
} else {
  console.log("占位符顺序: 全部一致 ✅");
}

// 3. 模拟 appendText（按英文占位符顺序切分）
function simulateAppendText(text, params) {
  let sText = text;
  const parts = [];
  for (const key of params) {
    const split = sText.split("{{" + key + "}}");
    parts.push(split[0] + "[ICON]");
    sText = split.length > 1 ? split[1] : "";
  }
  if (sText !== "") parts.push(sText);
  return parts.join("");
}
let residual = 0;
for (const k of enKeys) {
  const zhText = zh[k];
  if (!zhText) continue;
  const params = (en[k].match(phRe) || []).map((m) => m.slice(2, -2));
  if (!params.length) continue;
  const out = simulateAppendText(zhText, params);
  if (out.includes("{{")) {
    residual++;
    failed = true;
    console.error(`❌ 模拟渲染残留 {{: ${k} -> ${out.slice(0, 80)}`);
  }
}
console.log(`模拟 appendText: ${residual === 0 ? "无残留 ✅" : `${residual} 处残留 ❌`}`);

if (failed) process.exit(1);
console.log("✅ 词典验证全部通过");
