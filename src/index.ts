/**
 * Yucata 帮助提示多语言翻译油猴脚本。
 *
 * 翻译词典不内联进脚本，按需从远端加载：
 *   <源>/dicts/<游戏类型>/<语言>.json
 *
 * 语言回退链（按 navigator.language）：
 *   完整语言码（zh-CN）→ 语言前缀（zh）→ en → 放弃
 *
 * 词典加载成功前弹窗保持英文；加载失败则静默放弃，不干扰游戏。
 */

/** GitHub 仓库：词典 JSON 存放在 <repo>/dicts/<游戏>/<语言>.json */
const GITHUB_USER = "821869798";
const GITHUB_REPO = "YucataLingo";
const GITHUB_BRANCH = "main";

/**
 * 词典源（按优先级）。jsDelivr 加速镜像优先，GitHub raw 兜底。
 * {gh} 会被替换为 GitHub 的 user/repo@branch 形式。
 */
const DICT_SOURCES = [
  `https://fastly.jsdelivr.net/gh/${GITHUB_USER}/${GITHUB_REPO}@${GITHUB_BRANCH}`,
  `https://raw.githubusercontent.com/${GITHUB_USER}/${GITHUB_REPO}/${GITHUB_BRANCH}`,
];

(() => {
  const m = location.pathname.match(/\/Game\/([^/]+)\//);
  const gameTypeRaw = m ? m[1] : undefined;
  if (!gameTypeRaw) return; // 不在游戏页，退出
  const gameType: string = gameTypeRaw;

  /** 已翻译标记，避免同一元素被重复处理。 */
  const MARK = "data-yucata-zh";
  let dict: Record<string, string> | null = null;
  let observer: MutationObserver | null = null;

  function translateModal(modal: HTMLElement): void {
    if (!dict) return;
    modal.querySelectorAll<HTMLElement>("[id]").forEach((el) => {
      const zh = dict![el.id];
      if (zh && !el.hasAttribute(MARK)) {
        el.innerHTML = zh;
        el.setAttribute(MARK, "1");
      }
    });
  }

  function startObserving(): void {
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

  /** 按浏览器语言计算候选词典语言列表（含回退链）。BCP 47：语言小写 + 区域大写（zh-CN）。 */
  function candidateLangs(): string[] {
    const navLangs: string[] = [];
    if (typeof navigator !== "undefined") {
      if (navigator.languages?.length) navLangs.push(...navigator.languages);
      if (navigator.language) navLangs.push(navigator.language);
    }
    const seen = new Set<string>();
    const out: string[] = [];
    for (const raw of navLangs) {
      const [langPart, regionPart] = raw.replace("_", "-").split("-");
      const lang = regionPart
        ? `${langPart.toLowerCase()}-${regionPart.toUpperCase()}`
        : langPart.toLowerCase();
      if (seen.has(lang)) continue;
      seen.add(lang);
      out.push(lang);
      const prefix = lang.split("-")[0];
      if (prefix !== lang && !seen.has(prefix)) {
        seen.add(prefix);
        out.push(prefix);
      }
    }
    out.push("en"); // 兜底
    return out;
  }

  async function fetchDict(type: string, lang: string): Promise<Record<string, string> | null> {
    for (const base of DICT_SOURCES) {
      const url = `${base}/dicts/${encodeURIComponent(type)}/${encodeURIComponent(lang)}.json`;
      try {
        const res = await fetch(url, { cache: "no-store" });
        if (!res.ok) continue;
        const data = (await res.json()) as Record<string, string>;
        if (data && typeof data === "object") return data;
      } catch {
        // 尝试下一个源
      }
    }
    return null;
  }

  async function loadDict(): Promise<void> {
    for (const lang of candidateLangs()) {
      const d = await fetchDict(gameType, lang);
      if (d) {
        dict = d;
        break;
      }
    }
    if (dict) {
      startObserving();
      // 词典加载期间可能已有弹窗出现，词典到位后补翻译一次。
      document.querySelectorAll<HTMLElement>(".modal").forEach(translateModal);
    } else {
      console.warn(`[yucata-zh] 未找到 ${gameType} 的翻译词典（语言: ${navigator.language}），保持英文。`);
    }
  }

  // 词典加载是异步的：先开始监听弹窗，词典到位后统一翻译（含已出现的弹窗）。
  startObserving();
  void loadDict();
})();
