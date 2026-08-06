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

"use strict";(()=>{var v="821869798",y="YucataLingo",E="main",$=[`https://fastly.jsdelivr.net/gh/${v}/${y}@${E}`,`https://raw.githubusercontent.com/${v}/${y}/${E}`];(()=>{let d=location.pathname.match(/\/Game\/([^/]+)\//),f=d?d[1]:void 0;if(!f)return;let g=f,h="data-yucata-zh",i=null,u=null;function c(e){i&&e.querySelectorAll("[id]").forEach(t=>{let n=i[t.id];n&&!t.hasAttribute(h)&&(t.innerHTML=n,t.setAttribute(h,"1"))})}function m(){u||(u=new MutationObserver(e=>{for(let t of e)for(let n of t.addedNodes){if(n.nodeType!==Node.ELEMENT_NODE)continue;let o=n;o.classList&&o.classList.contains("modal")?c(o):o.querySelectorAll&&o.querySelectorAll(".modal").forEach(c)}}),u.observe(document.body,{childList:!0,subtree:!0}),document.querySelectorAll(".modal").forEach(c))}function L(){var o;let e=[];typeof navigator!="undefined"&&((o=navigator.languages)!=null&&o.length&&e.push(...navigator.languages),navigator.language&&e.push(navigator.language));let t=new Set,n=[];for(let s of e){let[a,p]=s.replace("_","-").split("-"),r=p?`${a.toLowerCase()}-${p.toUpperCase()}`:a.toLowerCase();if(t.has(r))continue;t.add(r),n.push(r);let l=r.split("-")[0];l!==r&&!t.has(l)&&(t.add(l),n.push(l))}return n.push("en"),n}async function T(e,t){for(let n of $){let o=`${n}/dicts/${encodeURIComponent(e)}/${encodeURIComponent(t)}.json`;try{let s=await fetch(o,{cache:"no-store"});if(!s.ok)continue;let a=await s.json();if(a&&typeof a=="object")return a}catch(s){}}return null}async function b(){for(let e of L()){let t=await T(g,e);if(t){i=t;break}}i?(m(),document.querySelectorAll(".modal").forEach(c)):console.warn(`[yucata-zh] 未找到 ${g} 的翻译词典（语言: ${navigator.language}），保持英文。`)}m(),b()})();})();
