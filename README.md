# Yucata 帮助提示多语言翻译（油猴插件）

把 Yucata 在线桌游中点击 `?` 弹出的**英文规则帮助框**按浏览器语言翻译成中文 / 日语 / 其他语言。

当前支持游戏：
- **阿勒农场（Fields of Arle）**：`?` 帮助弹窗（108 条）
- **蒂尔特之辉（Tiletum）**：全界面翻译（398 条）——历史记录、悬停提示、按钮、`?` 弹窗全部中文化（官方中文词典为空，由本插件注入）

翻译词典**不内联在脚本里**，而是从远端仓库按需加载：

```
<词典仓库>/dicts/<游戏类型>/<语言>.json
```

- 语言自动匹配 `navigator.language`（如 `zh-CN` → 中文、`ja-JP` → 日语）
- 回退链：完整语言码（`zh-CN`）→ 语言前缀（`zh`）→ `en` → 放弃（保持英文）
- 找不到对应语言词典时静默保持英文，不干扰游戏

## 安装

### 方式一：一键安装（推荐）

浏览器已安装 Tampermonkey / Violentmonkey 时，直接点击下面的链接即可自动弹出安装页面：

- **jsDelivr 镜像（推荐，国内快）**：
  https://fastly.jsdelivr.net/gh/821869798/YucataLingo@main/dist/yucata-zh-help.user.js
- **GitHub 原始地址**：
  https://raw.githubusercontent.com/821869798/YucataLingo/main/dist/yucata-zh-help.user.js

### 方式二：手动导入

1. 浏览器安装 Tampermonkey（Chrome/Edge）或 Violentmonkey（Firefox）。
2. 从上方链接下载 `yucata-zh-help.user.js` 文件。
3. 打开扩展面板，选择 **管理面板 → 实用工具 → 导入**，选择下载的脚本文件；或「新建脚本」后把文件内容整体粘贴进去并保存（Ctrl+S）。
4. 打开任意 Yucata 对局，点击 `?` 查看翻译（词典源默认已配置，无需手动设置）。

> 词典数据与脚本分离，从远端加载，脚本本身只有约 2KB；语言按浏览器自动匹配，无需配置。

## 词典文件路径

翻译词典 JSON 存放在仓库 `dicts/` 目录，也可通过镜像/原始地址直接访问：

| 文件 | jsDelivr 镜像 | GitHub 原始 |
| --- | --- | --- |
| 阿勒农场中文词典 | https://fastly.jsdelivr.net/gh/821869798/YucataLingo@main/dicts/FieldsOfArle/zh-CN.json | https://raw.githubusercontent.com/821869798/YucataLingo/main/dicts/FieldsOfArle/zh-CN.json |

## 配置词典仓库

词典源在 `src/index.ts` 顶部集中配置，已默认指向本仓库并启用 jsDelivr 加速镜像：

```ts
const GITHUB_USER = "821869798";
const GITHUB_REPO = "YucataLingo";
const GITHUB_BRANCH = "main";

// 词典源（按优先级）：jsDelivr 加速镜像优先，GitHub raw 兜底
const DICT_SOURCES = [
  `https://fastly.jsdelivr.net/gh/${GITHUB_USER}/${GITHUB_REPO}@${GITHUB_BRANCH}`,
  `https://raw.githubusercontent.com/${GITHUB_USER}/${GITHUB_REPO}/${GITHUB_BRANCH}`,
];
```

- **jsDelivr 镜像**：`https://fastly.jsdelivr.net/gh/<user>/<repo>@<branch>`，对 GitHub 免费 CDN 加速，国内访问快。
- **GitHub raw 兜底**：jsDelivr 不可用时自动回退官方源。
- 想换成自建仓库（Gitee、GitHub Pages 等），改 `DICT_SOURCES` 数组即可；使用新域名时记得在 `userscript.header.txt` 加对应的 `// @connect <域名>`。

### 词典仓库目录结构

```
yucata-dicts/
├── dicts/
│   ├── FieldsOfArle/
│   │   ├── zh-CN.json     # 中文
│   │   ├── ja-JP.json     # 日语（可自行添加）
│   │   └── ...
│   └── <其他游戏>/
│       └── <语言>.json
```

本仓库 `dicts/` 目录下已含阿勒农场中文词典（`dicts/FieldsOfArle/zh-CN.json`），构建时会同步复制到 `dist/dicts/`——你可以直接把这个目录的内容上传到你的词典仓库。

## 工作原理

1. 解析 URL 中的游戏类型（`/Game/<类型>/<id>`）。
2. 按浏览器主语言依次尝试加载 `<仓库>/dicts/<游戏>/<语言>.json`。
3. 按游戏类型分两种翻译模式：
   - **DOM 替换**（如 FieldsOfArle）：用 `MutationObserver` 监听页面，弹窗（`.modal`）出现时把命中词典的英文段落替换为目标语言 HTML。
   - **i18next 注入**（如 Tiletum）：官方中文词典为空，把中文注入 `i18next` 的 `zh/<游戏>` 命名空间并刷新 `y$.text` 快照、重渲染历史记录，历史记录 / 悬停提示 / 按钮 / 弹窗全部自动中文。
4. 词典加载期间/失败时保持英文，不阻塞游戏。

## 开发

环境：Node.js ≥ 18 或 Bun（推荐 Bun）。

```bash
bun install          # 安装依赖（esbuild + typescript）
bun run build        # 构建 -> dist/yucata-zh-help.user.js（并复制词典到 dist/dicts/）
bun run watch        # 监听源码变化自动重建
bunx tsc --noEmit    # 类型检查
```

### 项目结构

```
├── src/
│   └── index.ts               # 插件主逻辑（语言检测 + 远端词典加载 + 弹窗翻译）
├── dicts/                     # 词典数据（JSON，独立于脚本，可单独发布）
│   └── FieldsOfArle/
│       └── zh-CN.json         # 阿勒农场中文词典（108 条）
├── scripts/build.mjs          # esbuild 构建脚本（注入油猴元数据 + 复制词典）
├── userscript.header.txt      # 油猴元数据（@name/@match/@connect 等）
├── dist/
│   ├── yucata-zh-help.user.js # 构建产物 = 可安装脚本
│   └── dicts/                 # 复制出的词典，可整体上传做静态托管
└── package.json / tsconfig.json
```

## 添加新语言 / 新游戏

### 新语言（如日语）

1. 把 `dicts/FieldsOfArle/zh-CN.json` 复制为 `dicts/FieldsOfArle/ja-JP.json`。
2. 翻译其中的值（键保持不变），上传到你的词典仓库。
3. 浏览器语言为日语（`ja`/`ja-JP`）的用户打开游戏即自动加载。

### 新游戏

1. 抓取该游戏规则页 `/en/Rules/<游戏>`，把 `#rules` 内的锚点 id 收集为键。
2. 翻译各段落（保持原文 `<h3>/<table>/<p>` 结构），存为 `dicts/<游戏>/zh-CN.json`。
3. 上传到词典仓库即可——**脚本无需改动**。

## 验证

| 场景 | 结果 |
| --- | --- |
| `bunx tsc --noEmit` 类型检查 | ✅ |
| 构建产物语法（`node --check`） | ✅ |
| `zh-CN` 语言 → 加载 `zh-cn.json` → 弹窗翻译 | ✅ |
| `ja-JP` 语言 → 回退链 `ja-JP`→`ja`→`en` | ✅ |
| 词典缺失 → 保持英文、不干扰 | ✅ |
