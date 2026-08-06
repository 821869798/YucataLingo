# AGENTS.md — 开发者指南

本文件为 AI 工具（及人类开发者）提供本项目的关键技术知识。**动手改代码前请先读此文件**，尤其是涉及翻译词典、占位符、新增游戏时。

## 项目概述

Yucata 在线桌游（www.yucata.de）的油猴（Tampermonkey）用户脚本，把游戏中英文界面按浏览器语言翻译成中文。

- **脚本**：`src/index.ts` → esbuild 打包 → `dist/yucata-zh-help.user.js`（带油猴元数据头，可直接安装）
- **词典**：独立 JSON 文件，远端加载，`dicts/<游戏>/<语言>.json`（如 `dicts/FieldsOfArle/zh-CN.json`）
- **构建**：`bun run build`（类型检查 `bunx tsc --noEmit`，语法检查 `node --check`）
- **词典源**：`src/index.ts` 顶部 `DICT_SOURCES`，GitHub raw 优先（即时更新）、jsDelivr 兜底

## 两种翻译模式（关键决策点）

新增游戏时，**先判断该游戏属于哪种模式**，再决定词典内容如何组织：

### 模式 A：DOM 替换（FieldsOfArle 等）

- **适用**：游戏官方已有中文 UI（`/locales/zh/<游戏>.json` 非空），只有 `?` 帮助弹窗是英文
- **机制**：`?` 弹窗内容来自服务端规则页（`/Rules/<游戏>`），按锚点 id 克隆进弹窗。脚本用 MutationObserver 监听 `.modal`，把命中词典 id 的元素 innerHTML 替换为中文
- **词典键**：规则页 `#rules` 内的锚点 id（如 `Fisher`、`mill`、`wood`）
- **验证**：翻译保留原文 HTML 结构（`<h3>/<table>/<p>/<b>`），术语与官方 locale 对齐

### 模式 B：i18next 注入（Tiletum 等）

- **适用**：游戏官方中文词典为空（`/locales/zh/<游戏>.json` 是 `{}`），界面、历史记录、悬停提示、弹窗全英文
- **机制**：游戏所有文案走 `i18next.t('key')`。脚本用 `i18next.addResourceBundle('zh', <游戏>, dict)` 注入中文，然后：
  1. `y$.text.syncTranslations()` 刷新翻译快照
  2. 轮询等待游戏加载完成（`y$.game` 就绪且 `y$.dom.game` 有内容），若界面已用英文渲染则调用 `y$.basegame.refreshDisplay()` 完整重渲染
- **词典键**：直接复用官方英文词典的所有键（`/locales/en/<游戏>.json`），翻译其值
- **注册**：游戏类型必须加入 `src/index.ts` 的 `I18NEXT_GAMES` 集合

### 判断方法

抓取 `https://www.yucata.de/locales/zh/<游戏>.json`：
- 内容为 `{}` → 模式 B（i18next 注入）
- 内容非空 → 模式 A（DOM 替换）

## ⚠️ 占位符顺序（血泪教训，务必遵守）

### 问题背景

Tiletum 曾出现大量 `{{VictoryPointsCountPlusIcon}}` 残留——翻译是中文但占位符没被替换成图标。

### 根因

Tiletum 的历史记录用 `appendText($parent, i18next.t(key, i18nParams), iconParams)` 渲染，其实现是：

```js
function appendText($parentElem, sInText, oTextParams) {
  // 按 oTextParams 的键顺序，依次把文本按 {{key}} 切开，中间插入图标
  for (var i = 0; i < aKeys.length; i++) {
    aText = sText.split('{{' + aKeys[i] + '}}');
    $parentElem.append($('<span>').html(aText[0]));
    $parentElem.append(oTextParams[aKeys[i]]);
    sText = aText.length > 1 ? aText[1] : '';
  }
}
```

**`appendText` 按 `iconParams` 的键顺序硬编码切分文本**。`iconParams` 的顺序由游戏代码固定（对照 log.js / render.js 的调用）。**翻译文本里 `{{占位符}}` 的出现顺序必须与英文原文完全一致**，否则切分错位、残留 `{{}}`。

### 必须遵守的规则

1. **翻译文本中的 `{{占位符}}` 顺序必须逐字对齐英文原文**，即使中文语序因此不自然
2. **两类占位符要分清**：
   - i18next 插值参数（`i18next.t(key, {...})` 第一个对象，如 `count`、`sourceMapSpotName`）——在 `t()` 内已替换，**顺序无关**
   - appendText 图标参数（第二个对象，如 `{{MerchantOrArchitectActionKindIcon}}`）——**顺序必须对齐**
3. 稳妥做法：**全部占位符都按英文原文顺序排列**，零风险

### 验证方法（新增/修改翻译后必做）

用真实 i18next + 从游戏 log.js 提取的 iconParams 顺序，模拟 appendText 渲染，确认无 `{{` 残留。

**一键验证脚本**：`node scripts/verify-dict.mjs <游戏> <英文基准.json>`
- 校验键完整性（无缺失/多余）、占位符顺序与英文一致、模拟 appendText 无残留
- 英文基准获取：
  - 模式 B：`curl -s https://www.yucata.de/locales/en/<游戏>.json -o /tmp/<游戏>_en.json`
  - 模式 A：抓 `/en/Rules/<游戏>` 规则页，提取 `#rules` 内全部 `id` 锚点生成键列表（值可为空串，脚本只比对键）
- 参考实现：`scratchpad/e2e_render.mjs`（真实 i18next 端到端渲染）

## 新增游戏翻译完整流程

1. **确认游戏 URL 结构**：`https://www.yucata.de/zh/Game/<游戏类型>/<id>`
2. **判断翻译模式**（见上）：
   - 抓 `/locales/zh/<游戏>.json`，空 → 模式 B；非空 → 模式 A
3. **收集词典键**：
   - 模式 A：抓 `/en/Rules/<游戏>`，提取 `#rules` 内全部 `id` 锚点
   - 模式 B：抓 `/locales/en/<游戏>.json`，用其全部键
4. **翻译**：创建 `dicts/<游戏>/zh-CN.json`，键与原词典/锚点完全一致，值译为中文
   - 模式 B：**占位符顺序必须对齐英文**（见上）
   - 保留 HTML 结构（`<b>/<p>/<ul>/<li>` 等）
   - 术语先查官方中文 locale（若存在）对齐；无官方则保持本游戏内部统一
5. **注册模式**：模式 B 需把游戏类型加入 `I18NEXT_GAMES`（`src/index.ts`）
6. **构建**：`bun run build`（会复制词典到 `dist/dicts/`）
7. **验证**：
   - `bunx tsc --noEmit` 类型检查
   - `node --check dist/yucata-zh-help.user.js` 语法
   - `node scripts/verify-dict.mjs <游戏> <英文基准>` 一键校验（键完整性 + 占位符顺序 + 模拟 appendText 无残留）
   - jsdom 端到端模拟（i18next 注入返回中文 / DOM 替换生效）
8. **推送**：git push 或 `gh api`（contents API，网络不稳时用）

## 词典文件约定

- **文件名**：BCP 47 语言码，`<语言>-<区域大写>.json`（如 `zh-CN.json`、`ja-JP.json`）。⚠️ 大小写敏感（`zh-cn.json` ≠ `zh-CN.json`）
- **语言回退链**：脚本只读 `navigator.language`（主语言），候选为完整码 → 语言前缀 → `en`
- **空值**：若英文原文某键值为空字符串 `""`，翻译也保留空字符串（游戏代码对其有特殊处理）
- **不要提交** `en.json` 之类英文基准文件到 `dicts/`（那是翻译参考，不是加载的词典）

## 常见坑

1. **jsDelivr 缓存**：对词典/脚本有最长 12h CDN 缓存。发布后用户可能拿到旧版。词典源已改为 raw 优先缓解；若用户反馈"还是旧的"，等缓存过期或手动重装脚本
2. **`git push` 网络不稳**：GitHub 推送偶发超时/401。可用 `gh api -X PUT .../contents/<path>` 走 API 推送（需先 `gh api .../contents/<path> --jq .sha` 拿远程 SHA）。API 推完需 `git fetch && git reset --hard origin/main` 同步本地
3. **`document-start` 时序**：脚本 `@run-at document-start`，此时 `document.body`、`window.i18next`、`window.y$` 可能都未就绪，必须轮询等待（参考 `startDomMode` / `startI18nextMode`）
4. **`declare global` 报错**：TS 里全局类型增强需文件是模块（有 import/export）。本项目用辅助函数 + 类型断言代替
5. **depot vs barn 译名**：FieldsOfArle 中 `Depot`（货物翻倍板块）= 仓库，`Barn`（放设备）= 车库（官方译法）。两者易混，改翻译时注意区分
