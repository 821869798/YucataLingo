/**
 * Yucata 帮助提示多语言翻译油猴脚本。
 *
 * 翻译词典不内联进脚本，按需从远端加载：
 *   <源>/dicts/<游戏类型>/<语言>.json
 *
 * 语言回退链（按 navigator.language）：
 *   完整语言码（zh-CN）→ 语言前缀（zh）→ en → 放弃
 *
 * 两种翻译模式：
 *   - DOM 替换（如 FieldsOfArle）：? 弹窗是规则页克隆的 HTML，按锚点 id 替换。
 *   - i18next 注入（如 Tiletum）：官方 zh 词典为空，把中文注入 i18next 的
 *     zh/<游戏> 命名空间，历史记录 / 悬停提示 / 按钮 / 弹窗全部自动变中文。
 */

/** GitHub 仓库：词典 JSON 存放在 <repo>/dicts/<游戏>/<语言>.json */
const GITHUB_USER = "821869798";
const GITHUB_REPO = "YucataLingo";
const GITHUB_BRANCH = "main";

/**
 * 词典源（按优先级）。GitHub raw 优先（无长 CDN 缓存，词典修正即时生效），jsDelivr 兜底。
 * 最终 URL：<源>/dicts/<游戏>/<语言>.json
 */
const DICT_SOURCES = [
  `https://raw.githubusercontent.com/${GITHUB_USER}/${GITHUB_REPO}/${GITHUB_BRANCH}`,
  `https://fastly.jsdelivr.net/gh/${GITHUB_USER}/${GITHUB_REPO}@${GITHUB_BRANCH}`,
];

/**
 * 使用 i18next 注入模式的游戏（官方 zh 词典为空，需整体注入）。
 * 其余游戏默认走 DOM 替换模式。
 */
const I18NEXT_GAMES = new Set(["Tiletum"]);

type Dict = Record<string, string>;

/** 访问页面全局的 i18next（baseStartup.js 引入）。 */
function getI18next(): {
  addResourceBundle: (lng: string, ns: string, resources: Dict) => void;
  emit: (event: string) => void;
  t: (key: string, opts?: unknown) => string;
} | null {
  const i18n = (window as unknown as { i18next?: unknown }).i18next;
  if (i18n && typeof (i18n as { addResourceBundle?: unknown }).addResourceBundle === "function") {
    return i18n as {
      addResourceBundle: (lng: string, ns: string, resources: Dict) => void;
      emit: (event: string) => void;
      t: (key: string, opts?: unknown) => string;
    };
  }
  return null;
}

/** 访问 Yucata 全局对象 y$（baseStartup.js 里 var y$ = {}）。 */
function getYucata(): {
  text?: { syncTranslations?: () => void };
  log?: { update?: () => void };
} {
  return (window as unknown as { y$?: object }).y$ ?? {};
}

(() => {
  const m = location.pathname.match(/\/Game\/([^/]+)\//);
  const gameTypeRaw = m ? m[1] : undefined;
  if (!gameTypeRaw) return; // 不在游戏页，退出
  const gameType: string = gameTypeRaw;

  /** 已翻译标记，避免同一元素被重复处理（DOM 模式）。 */
  const MARK = "data-yucata-zh";

  /**
   * 按浏览器主语言（navigator.language）计算候选词典语言列表（含回退链）。
   * 只取主语言，不遍历 navigator.languages 偏好列表，避免无谓的多语言请求。
   * BCP 47：语言小写 + 区域大写（zh-CN）；回退：完整码 → 语言前缀 → en。
   */
  function candidateLangs(): string[] {
    const out: string[] = [];
    const seen = new Set<string>();
    const push = (lang: string): void => {
      if (!lang || seen.has(lang)) return;
      seen.add(lang);
      out.push(lang);
    };

    let primary = "";
    if (typeof navigator !== "undefined") {
      primary = navigator.language || "";
    }
    const [langPart, regionPart] = primary.replace("_", "-").split("-");
    if (langPart) {
      const full = regionPart
        ? `${langPart.toLowerCase()}-${regionPart.toUpperCase()}`
        : langPart.toLowerCase();
      push(full);
      if (full !== langPart.toLowerCase()) push(langPart.toLowerCase());
    }
    push("en"); // 终极兜底：无对应语言词典时保持英文
    return out;
  }

  async function fetchDict(type: string, lang: string): Promise<Dict | null> {
    for (const base of DICT_SOURCES) {
      const url = `${base}/dicts/${encodeURIComponent(type)}/${encodeURIComponent(lang)}.json`;
      try {
        const res = await fetch(url, { cache: "no-store" });
        if (!res.ok) continue;
        const data = (await res.json()) as Dict;
        if (data && typeof data === "object") return data;
      } catch {
        // 尝试下一个源
      }
    }
    return null;
  }

  // ==================== DOM 替换模式 ====================

  function startDomMode(dict: Dict): void {
    let observer: MutationObserver | null = null;

    function translateModal(modal: HTMLElement): void {
      modal.querySelectorAll<HTMLElement>("[id]").forEach((el) => {
        const zh = dict[el.id];
        if (zh && !el.hasAttribute(MARK)) {
          el.innerHTML = zh;
          el.setAttribute(MARK, "1");
        }
      });
    }

    if (observer) return;
    observer = new MutationObserver((mutations) => {
      for (const mu of mutations) {
        for (const node of mu.addedNodes) {
          if (node.nodeType !== Node.ELEMENT_NODE) continue;
          const el = node as HTMLElement;
          if (el.classList && el.classList.contains("modal")) {
            translateModal(el);
          } else if (el.querySelectorAll) {
            el.querySelectorAll<HTMLElement>(".modal").forEach(translateModal);
          }
        }
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });
    document.querySelectorAll<HTMLElement>(".modal").forEach(translateModal);
  }

  // ==================== i18next 注入模式 ====================

  function startI18nextMode(dict: Dict): void {
    const i18n = getI18next();
    if (!i18n) {
      console.warn("[yucata-zh] 页面未暴露 i18next，无法注入词典，保持英文。");
      return;
    }

    // 注入到 zh 命名空间（i18next 在 /zh/ 路径下使用 zh 语言）。
    i18n.addResourceBundle("zh", gameType, dict);

    // 刷新 y$.text 的翻译快照（y$.text.get 内部走 i18next.t）。
    const y$ = getYucata();
    try {
      y$.text?.syncTranslations?.();
    } catch {
      // 忽略快照刷新错误
    }

    // 重渲染历史记录（已有日志条目用新词典刷新）。
    try {
      y$.log?.update?.();
    } catch {
      // 忽略重渲染错误
    }

    console.log(`[yucata-zh] 已注入 ${gameType} 中文词典到 i18next（${Object.keys(dict).length} 条）。`);
  }

  // ==================== 启动 ====================

  async function loadDict(): Promise<void> {
    for (const lang of candidateLangs()) {
      const d = await fetchDict(gameType, lang);
      if (d) {
        if (I18NEXT_GAMES.has(gameType)) {
          startI18nextMode(d);
        } else {
          startDomMode(d);
        }
        return;
      }
    }
    console.warn(`[yucata-zh] 未找到 ${gameType} 的翻译词典（语言: ${navigator.language}），保持英文。`);
  }

  void loadDict();
})();
