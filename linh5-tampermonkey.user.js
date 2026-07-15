// ==UserScript==
// @name         LinH5 工具箱 - 所有功能常駐
// @namespace    https://linh5web.win/
// @version      1.3
// @description  世界王存活自動置頂 + 背包物品檢索（搜尋/強化篩選）+ 道具名稱顯示（常駐，免設定）
// @author       QClaw
// @match        https://linh5web.win/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=linh5web.win
// @grant        GM_addStyle
// @run-at       document-idle
// ==/UserScript==

(function () {
    'use strict';

    // ============================================================
    //  0. 強制背包格子垂直疊放（img → label → cnt）
    // ============================================================
    GM_addStyle(`
        /* 世界王搜尋列 */
        #lh5-bag-search-bar {
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 6px 8px;
            background: #12121e;
            border-bottom: 1px solid #2a2a3e;
            flex-shrink: 0;
        }
        #lh5-bag-search-bar input {
            flex: 1;
            min-width: 0;
            background: #0d0d18;
            border: 1px solid #333;
            border-radius: 6px;
            padding: 5px 10px;
            color: #e0d5c1;
            font-size: 13px;
            outline: none;
            transition: border-color 0.2s;
        }
        #lh5-bag-search-bar input:focus { border-color: #c8a96e; }
        #lh5-bag-search-bar input::placeholder { color: #555; }
        #lh5-bag-search-bar select {
            background: #0d0d18;
            border: 1px solid #333;
            border-radius: 6px;
            padding: 5px 8px;
            color: #e0d5c1;
            font-size: 13px;
            outline: none;
            cursor: pointer;
            flex-shrink: 0;
        }
        #lh5-bag-search-bar select:focus { border-color: #c8a96e; }
        #lh5-bag-search-bar select option { background: #1a1a2e; color: #e0d5c1; }
        #lh5-bag-search-bar .lh5-bag-count {
            font-size: 12px;
            color: #888;
            white-space: nowrap;
            flex-shrink: 0;
        }

        /* 隱藏格子 */
        .lh5-cell-hidden { display: none !important; }

        /* 道具名稱（疊在圖片正下方） */
        .lh5-cell-label {
            display: block;
            text-align: center;
            font-size: 10pt;
            color: #ccc;
            line-height: 1.2;
            margin-top: 2px;
            word-break: break-all;
            max-width: 90px;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
            width: 100%;
            flex: 0 0 100%;
            order: 10;
        }
        .lh5-cell-label .lh5-hl { color: #ffd700; font-weight: bold; }

        /* 強制 cell 內垂直疊放（讓 label 在 img 正下方、cnt 在最尾端） */
        .grid > .cell {
            display: inline-flex !important;
            flex-direction: column !important;
            align-items: center !important;
        }
        .grid > .cell > .cnt {
            order: 20;
        }
    `);

    // ============================================================
    //  1. 跨功能共享狀態
    // ============================================================
    const bagFilter = { text: '', enchant: '' };

    // ============================================================
    //  2. 工具函式
    // ============================================================
    function getItemNameFromImg(img) {
        if (!img || !img.src) return '';
        const parts = decodeURIComponent(img.src).split('/');
        return parts[parts.length - 1].replace(/\.\w+$/, '');
    }

    // ============================================================
    //  3. 世界王自動置頂
    // ============================================================
    const bossFeature = (function () {
        let observer = null;
        let originalOrder = null;

        function captureOrder(panel) {
            if (originalOrder) return;
            originalOrder = Array.from(panel.querySelectorAll(':scope > .wb-card')).map(el => el.dataset.boss);
        }

        function restoreOriginal(panel) {
            if (!originalOrder || !originalOrder.length) return;
            const map = {};
            panel.querySelectorAll(':scope > .wb-card').forEach(el => { map[el.dataset.boss] = el; });
            let changed = false;
            const existing = Array.from(panel.children);
            originalOrder.forEach((bossId, i) => {
                if (map[bossId] && existing[i] !== map[bossId]) changed = true;
            });
            if (changed) {
                originalOrder.forEach(bossId => { if (map[bossId]) panel.appendChild(map[bossId]); });
            }
        }

        function sortPanel(panel) {
            captureOrder(panel);
            const cards = Array.from(panel.querySelectorAll(':scope > .wb-card'));
            if (cards.length < 2) return;

            const allDead = cards.every(el => {
                const sub = el.querySelector('.wb-sub');
                return sub && sub.textContent.includes('已被擊敗');
            });

            if (allDead) { restoreOriginal(panel); return; }

            const sorted = cards.slice().sort((a, b) => {
                const aliveA = a.querySelector('.wb-sub') ? !a.querySelector('.wb-sub').textContent.includes('已被擊敗') : false;
                const aliveB = b.querySelector('.wb-sub') ? !b.querySelector('.wb-sub').textContent.includes('已被擊敗') : false;
                if (aliveA && !aliveB) return -1;
                if (!aliveA && aliveB) return 1;
                const ia = originalOrder ? originalOrder.indexOf(a.dataset.boss) : 0;
                const ib = originalOrder ? originalOrder.indexOf(b.dataset.boss) : 0;
                return ia - ib;
            });

            const existing = Array.from(panel.children);
            let needs = false;
            for (let i = 0; i < sorted.length; i++) {
                if (sorted[i] !== existing[i]) { needs = true; break; }
            }
            if (needs) sorted.forEach(el => panel.appendChild(el));
        }

        let statusEl = null;

        function updateStatus(panel) {
            if (!statusEl || !document.contains(statusEl)) {
                statusEl = document.createElement('div');
                statusEl.id = 'lh5-boss-status';
                statusEl.style.cssText = 'padding:6px 10px;font-size:11px;color:#666;text-align:right;border-top:1px solid #2a2a3e;';
                panel.appendChild(statusEl);
            }
            const now = new Date();
            const pad = n => String(n).padStart(2, '0');
            const ts = pad(now.getHours()) + ':' + pad(now.getMinutes()) + ':' + pad(now.getSeconds());
            statusEl.textContent = '⏱ 監控中 · ' + ts;
        }

        function start() {
            if (observer) return;
            const panel = document.getElementById('panel-scroll');
            if (!panel) { setTimeout(start, 500); return; }
            sortPanel(panel);
            updateStatus(panel);
            observer = new MutationObserver(() => {
                sortPanel(panel);
                updateStatus(panel);
            });
            observer.observe(panel, { childList: true, subtree: false });
        }

        return { start };
    })();

    // ============================================================
    //  4. 背包檢索 + 道具名稱
    // ============================================================
    const bagFeature = (function () {
        let panelObserver = null;
        let gridObserver = null;
        let searchBar = null;

        function removeUI() {
            if (searchBar && searchBar.parentNode) searchBar.parentNode.removeChild(searchBar);
            searchBar = null;
            document.querySelectorAll('.lh5-cell-hidden').forEach(el => el.classList.remove('lh5-cell-hidden'));
        }

        function applyFilter(grid) {
            const cells = grid.querySelectorAll(':scope > .cell');
            let visible = 0;
            let hasActiveFilter = false;

            cells.forEach(cell => {
                let show = true;

                // 名稱過濾
                if (bagFilter.text) {
                    hasActiveFilter = true;
                    const name = getItemNameFromImg(cell.querySelector('img'));
                    if (!name.includes(bagFilter.text)) show = false;
                }

                // 強化篩選
                if (show && bagFilter.enchant) {
                    hasActiveFilter = true;
                    const badge = cell.querySelector('.enbadge');
                    const t = badge ? badge.textContent.trim() : '';
                    if (t !== bagFilter.enchant) show = false;
                }

                if (show) { cell.classList.remove('lh5-cell-hidden'); visible++; }
                else { cell.classList.add('lh5-cell-hidden'); }
            });

            // 更新計數
            const cs = searchBar && searchBar.querySelector('.lh5-bag-count');
            if (cs) cs.textContent = hasActiveFilter ? `顯示 ${visible} / ${cells.length}` : '';

            // 更新名稱高亮
            updateLabels(grid);
        }

        function updateLabels(grid) {
            if (!grid) return;
            const cells = grid.querySelectorAll(':scope > .cell');
            cells.forEach(cell => {
                const img = cell.querySelector('img');
                if (!img) return;
                const name = getItemNameFromImg(img);
                if (!name) return;

                let label = cell.querySelector('.lh5-cell-label');
                if (!label) {
                    label = document.createElement('span');
                    label.className = 'lh5-cell-label';
                    // 插在 img 之後（cnt 之前），因 CSS order 保證垂直疊放
                    img.after(label);
                }

                const kw = bagFilter.text;
                if (kw && name.includes(kw)) {
                    const idx = name.indexOf(kw);
                    label.innerHTML = name.slice(0, idx)
                        + `<span class="lh5-hl">${escapeHtml(name.slice(idx, idx + kw.length))}</span>`
                        + escapeHtml(name.slice(idx + kw.length));
                } else {
                    label.textContent = name;
                }
            });
        }

        function escapeHtml(s) {
            const d = document.createElement('div');
            d.textContent = s;
            return d.innerHTML;
        }

        function injectUI(grid) {
            // 偵測檢索欄是否真的存在於 DOM
            if (searchBar && document.contains(searchBar)) return;
            searchBar = null;

            const bar = document.createElement('div');
            bar.id = 'lh5-bag-search-bar';

            const input = document.createElement('input');
            input.type = 'text';
            input.placeholder = '🔍 搜尋道具名稱…';

            const select = document.createElement('select');
            ['全部', '+4', '+5', '+6', '+7', '+8', '+9', '+10'].forEach(v => {
                const opt = document.createElement('option');
                opt.value = v === '全部' ? '' : v;
                opt.textContent = v;
                select.appendChild(opt);
            });

            const countSpan = document.createElement('span');
            countSpan.className = 'lh5-bag-count';

            bar.appendChild(input);
            bar.appendChild(select);
            bar.appendChild(countSpan);
            grid.parentNode.insertBefore(bar, grid);
            searchBar = bar;

            const doFilter = () => {
                bagFilter.text = input.value.trim();
                bagFilter.enchant = select.value;
                applyFilter(grid);
            };

            input.addEventListener('input', doFilter);
            select.addEventListener('change', doFilter);

            // 監聽 grid 內道具重繪
            if (gridObserver) gridObserver.disconnect();
            gridObserver = new MutationObserver(() => {
                if (document.contains(grid)) doFilter();
            });
            gridObserver.observe(grid, { childList: true });

            // 初始過濾 + 名稱
            applyFilter(grid);
        }

        function observePanel() {
            const panel = document.getElementById('panel-scroll');
            if (!panel) { setTimeout(observePanel, 500); return; }

            const grid = panel.querySelector(':scope > .grid');
            if (grid) injectUI(grid);

            if (panelObserver) panelObserver.disconnect();
            panelObserver = new MutationObserver(() => {
                const g = panel.querySelector(':scope > .grid');
                if (g && (!searchBar || !document.contains(searchBar))) injectUI(g);
                else if (!g && searchBar) removeUI();
            });
            panelObserver.observe(panel, { childList: true });
        }

        function start() { observePanel(); }
        return { start };
    })();

    // ============================================================
    //  5. 啟動全部功能
    // ============================================================
    bossFeature.start();
    bagFeature.start();

    // 每 3 秒檢查 DOM 完整性（SPA 重繪時重新掛載）
    setInterval(() => {
        const panel = document.getElementById('panel-scroll');
        if (!panel) return;

        // 世界王
        const wbCards = panel.querySelectorAll(':scope > .wb-card');
        if (wbCards.length > 0) {
            bossFeature.start();
        }

        // 背包
        const grid = panel.querySelector(':scope > .grid');
        if (grid) {
            // 如果有 grid 但搜尋列不見了，強制重建
            const bar = document.getElementById('lh5-bag-search-bar');
            if (!bar) bagFeature.start();
        }
    }, 3000);

})();
