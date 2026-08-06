// ==UserScript==
// @name         Yucata 帮助提示多语言翻译
// @name:en      Yucata Help Multi-language Translation
// @namespace    yucata-lingo
// @version      0.2.0
// @description  将 Yucata 游戏内点击 "?" 弹出的英文规则帮助按浏览器语言翻译（词典远端加载，支持多语言；需配置词典仓库地址）
// @match        https://www.yucata.de/*/Game/*
// @grant        none
// @connect      fastly.jsdelivr.net
// @connect      raw.githubusercontent.com
// @run-at       document-idle
// @updateURL    https://fastly.jsdelivr.net/gh/821869798/YucataLingo@main/dist/yucata-zh-help.user.js
// @downloadURL  https://fastly.jsdelivr.net/gh/821869798/YucataLingo@main/dist/yucata-zh-help.user.js
// ==/UserScript==

"use strict";(()=>{var h="821869798",y="YucataLingo",p="main",v=[`https://fastly.jsdelivr.net/gh/${h}/${y}@${p}`,`https://raw.githubusercontent.com/${h}/${y}/${p}`];(()=>{let u=location.pathname.match(/\/Game\/([^/]+)\//),d=u?u[1]:void 0;if(!d)return;let f=d,g="data-yucata-zh",i=null,l=null;function c(n){i&&n.querySelectorAll("[id]").forEach(t=>{let e=i[t.id];e&&!t.hasAttribute(g)&&(t.innerHTML=e,t.setAttribute(g,"1"))})}function m(){l||(l=new MutationObserver(n=>{for(let t of n)for(let e of t.addedNodes){if(e.nodeType!==Node.ELEMENT_NODE)continue;let o=e;o.classList&&o.classList.contains("modal")?c(o):o.querySelectorAll&&o.querySelectorAll(".modal").forEach(c)}}),l.observe(document.body,{childList:!0,subtree:!0}),document.querySelectorAll(".modal").forEach(c))}function E(){let n=[],t=new Set,e=s=>{!s||t.has(s)||(t.add(s),n.push(s))},o="";typeof navigator!="undefined"&&(o=navigator.language||"");let[r,a]=o.replace("_","-").split("-");if(r){let s=a?`${r.toLowerCase()}-${a.toUpperCase()}`:r.toLowerCase();e(s),s!==r.toLowerCase()&&e(r.toLowerCase())}return e("en"),n}async function L(n,t){for(let e of v){let o=`${e}/dicts/${encodeURIComponent(n)}/${encodeURIComponent(t)}.json`;try{let r=await fetch(o,{cache:"no-store"});if(!r.ok)continue;let a=await r.json();if(a&&typeof a=="object")return a}catch(r){}}return null}async function T(){for(let n of E()){let t=await L(f,n);if(t){i=t;break}}i?(m(),document.querySelectorAll(".modal").forEach(c)):console.warn(`[yucata-zh] 未找到 ${f} 的翻译词典（语言: ${navigator.language}），保持英文。`)}m(),T()})();})();
