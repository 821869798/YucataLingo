// ==UserScript==
// @name         Yucata 帮助提示多语言翻译
// @name:en      Yucata Help Multi-language Translation
// @namespace    yucata-lingo
// @version      0.3.0
// @description  将 Yucata 游戏内点击 "?" 弹出的英文规则帮助按浏览器语言翻译（词典远端加载，支持多语言；需配置词典仓库地址）
// @match        https://www.yucata.de/*/Game/*
// @grant        none
// @connect      fastly.jsdelivr.net
// @connect      raw.githubusercontent.com
// @run-at       document-idle
// @updateURL    https://raw.githubusercontent.com/821869798/YucataLingo/main/dist/yucata-zh-help.user.js
// @downloadURL  https://raw.githubusercontent.com/821869798/YucataLingo/main/dist/yucata-zh-help.user.js
// ==/UserScript==

"use strict";(()=>{var l="821869798",f="YucataLingo",g="main",T=[`https://raw.githubusercontent.com/${l}/${f}/${g}`,`https://fastly.jsdelivr.net/gh/${l}/${f}@${g}`],$=new Set(["Tiletum"]);function E(){let a=window.i18next;return a&&typeof a.addResourceBundle=="function"?a:null}function L(){var a;return(a=window.y$)!=null?a:{}}(()=>{let a=location.pathname.match(/\/Game\/([^/]+)\//),u=a?a[1]:void 0;if(!u)return;let c=u,d="data-yucata-zh";function y(){let r=[],o=new Set,i=e=>{!e||o.has(e)||(o.add(e),r.push(e))},s="";typeof navigator!="undefined"&&(s=navigator.language||"");let[t,n]=s.replace("_","-").split("-");if(t){let e=n?`${t.toLowerCase()}-${n.toUpperCase()}`:t.toLowerCase();i(e),e!==t.toLowerCase()&&i(t.toLowerCase())}return i("en"),r}async function h(r,o){for(let i of T){let s=`${i}/dicts/${encodeURIComponent(r)}/${encodeURIComponent(o)}.json`;try{let t=await fetch(s,{cache:"no-store"});if(!t.ok)continue;let n=await t.json();if(n&&typeof n=="object")return n}catch(t){}}return null}function m(r){let o=null;function i(s){s.querySelectorAll("[id]").forEach(t=>{let n=r[t.id];n&&!t.hasAttribute(d)&&(t.innerHTML=n,t.setAttribute(d,"1"))})}o||(o=new MutationObserver(s=>{for(let t of s)for(let n of t.addedNodes){if(n.nodeType!==Node.ELEMENT_NODE)continue;let e=n;e.classList&&e.classList.contains("modal")?i(e):e.querySelectorAll&&e.querySelectorAll(".modal").forEach(i)}}),o.observe(document.body,{childList:!0,subtree:!0}),document.querySelectorAll(".modal").forEach(i))}function w(r){var s,t,n,e;let o=E();if(!o){console.warn("[yucata-zh] 页面未暴露 i18next，无法注入词典，保持英文。");return}o.addResourceBundle("zh",c,r);let i=L();try{(t=(s=i.text)==null?void 0:s.syncTranslations)==null||t.call(s)}catch(v){}try{(e=(n=i.log)==null?void 0:n.update)==null||e.call(n)}catch(v){}console.log(`[yucata-zh] 已注入 ${c} 中文词典到 i18next（${Object.keys(r).length} 条）。`)}async function p(){for(let r of y()){let o=await h(c,r);if(o){$.has(c)?w(o):m(o);return}}console.warn(`[yucata-zh] 未找到 ${c} 的翻译词典（语言: ${navigator.language}），保持英文。`)}p()})();})();
