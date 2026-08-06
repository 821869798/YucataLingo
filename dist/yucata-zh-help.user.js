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

"use strict";(()=>{var m="821869798",p="YucataLingo",v="main",T=[`https://fastly.jsdelivr.net/gh/${m}/${p}@${v}`,`https://raw.githubusercontent.com/${m}/${p}/${v}`];(()=>{let u=location.pathname.match(/\/Game\/([^/]+)\//),d=u?u[1]:void 0;if(!d)return;let f=d,g="data-yucata-zh",r=null,l=null;function i(e){r&&e.querySelectorAll("[id]").forEach(t=>{let n=r[t.id];n&&!t.hasAttribute(g)&&(t.innerHTML=n,t.setAttribute(g,"1"))})}function h(){l||(l=new MutationObserver(e=>{for(let t of e)for(let n of t.addedNodes){if(n.nodeType!==Node.ELEMENT_NODE)continue;let o=n;o.classList&&o.classList.contains("modal")?i(o):o.querySelectorAll&&o.querySelectorAll(".modal").forEach(i)}}),l.observe(document.body,{childList:!0,subtree:!0}),document.querySelectorAll(".modal").forEach(i))}function y(){var o;let e=[];typeof navigator!="undefined"&&((o=navigator.languages)!=null&&o.length&&e.push(...navigator.languages),navigator.language&&e.push(navigator.language));let t=new Set,n=[];for(let s of e){let a=s.toLowerCase().replace("_","-");if(t.has(a))continue;t.add(a),n.push(a);let c=a.split("-")[0];c!==a&&!t.has(c)&&(t.add(c),n.push(c))}return n.push("en"),n}async function E(e,t){for(let n of T){let o=`${n}/dicts/${encodeURIComponent(e)}/${encodeURIComponent(t)}.json`;try{let s=await fetch(o,{cache:"no-store"});if(!s.ok)continue;let a=await s.json();if(a&&typeof a=="object")return a}catch(s){}}return null}async function L(){for(let e of y()){let t=await E(f,e);if(t){r=t;break}}r?(h(),document.querySelectorAll(".modal").forEach(i)):console.warn(`[yucata-zh] 未找到 ${f} 的翻译词典（语言: ${navigator.language}），保持英文。`)}h(),L()})();})();
