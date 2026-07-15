// ==UserScript==
// @name         LinH5 工具箱 - 所有功能常駐
// @namespace    https://linh5web.win/
// @version      1.4
// @description  世界王存活自動置頂 + 背包物品檢索（搜尋/強化篩選）+ 道具名稱顯示（常駐）
// @author       QClaw
// @match        https://linh5web.win/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=linh5web.win
// @grant        GM_addStyle
// @run-at       document-idle
// ==/UserScript==

(function () {
    'use strict';

    // ============================================================
    //  0. CSS
    // ============================================================
    GM_addStyle(`
        /* ── 背包搜尋列 ── */
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

        .lh5-cell-hidden { display: none !important; }

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

        .grid > .cell {
            display: inline-flex !important;
            flex-direction: column !important;
            align-items: center !important;
        }
        .grid > .cell > .cnt { order: 20; }

        /* ── 世界王 TOP 狀態列 ── */
        #lh5-boss-topbar {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 4px 10px;
            background: #0e0e1a;
            border-bottom: 1px solid #2a2a3e;
            font-size: 11px;
            color: #666;
            flex-shrink: 0;
        }
        #lh5-boss-topbar .lh5-boss-status {
            display: flex;
            align-items: center;
            gap: 4px;
        }
        #lh5-boss-topbar .lh5-boss-dot {
            width: 7px; height: 7px;
            border-radius: 50%;
            background: #22c55e;
            flex-shrink: 0;
        }

        /* ── 星星按鈕 ── */
        .lh5-star {
            cursor: pointer;
            font-size: 16px;
            line-height: 1;
            margin-right: 6px;
            user-select: none;
            transition: transform 0.15s;
            flex-shrink: 0;
        }
        .lh5-star:hover { transform: scale(1.25); }
        .lh5-star.pinned { color: #fbbf24; }
        .lh5-star:not(.pinned) { color: #444; }
        .wb-r1 { display: flex; align-items: center; }
    `);

    // ============================================================
    //  1. 工具函式
    // ============================================================
    function getItemNameFromImg(img) {
        if (!img || !img.src) return '';
        const parts = decodeURIComponent(img.src).split('/');
        return parts[parts.length - 1].replace(/\.\w+$/, '');
    }

    // Chrome localStorage 存取星標
    const PINNED_KEY = 'lh5_pinned_bosses';
    function getPinned() {
        try {
            const raw = localStorage.getItem(PINNED_KEY);
            return raw ? JSON.parse(raw) : [];
        } catch (_) { return []; }
    }
    function setPinned(list) {
        localStorage.setItem(PINNED_KEY, JSON.stringify(list));
    }
    function togglePinned(bossId) {
        let list = getPinned();
        if (list.includes(bossId)) {
            list = list.filter(id => id !== bossId);
        } else {
            list.push(bossId);
        }
        setPinned(list);
        return list.includes(bossId); // 回傳新狀態
    }

    // ============================================================
    //  2. 世界王功能（置頂 + 星星 + TOP 列）
    // ============================================================
    const bossFeature = (function () {
        let observer = null;
        let originalOrder = null;
        let statusBar = null;

        function captureOrder(panel) {
            if (originalOrder) return;
            originalOrder = Array.from(panel.querySelectorAll(':scope > .wb-card')).map(el => el.dataset.boss);
        }

        function restoreOriginal(panel) {
            if (!originalOrder || !originalOrder.length) return;
            const map = {};
            panel.querySelectorAll(':scope > .wb-card').forEach(el => { map[el.dataset.boss] = el; });
            const existing = Array.from(panel.children);
            let changed = false;
            originalOrder.forEach((bossId, i) => {
                if (map[bossId] && existing[i] !== map[bossId]) changed = true;
            });
            if (changed) {
                originalOrder.forEach(bossId => { if (map[bossId]) panel.appendChild(map[bossId]); });
            }
        }

        /** 為每個 wb-card 加上星星（若尚未加） */
        function injectStars(panel) {
            const pinned = getPinned();
            panel.querySelectorAll(':scope > .wb-card').forEach(card => {
                if (card.querySelector('.lh5-star')) return;
                const r1 = card.querySelector('.wb-r1');
                if (!r1) return;
                const star = document.createElement('span');
                star.className = 'lh5-star' + (pinned.includes(card.dataset.boss) ? ' pinned' : '');
                star.textContent = pinned.includes(card.dataset.boss) ? '★' : '☆';
                star.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const nowPinned = togglePinned(card.dataset.boss);
                    star.textContent = nowPinned ? '★' : '☆';
                    star.classList.toggle('pinned', nowPinned);
                    sortPanel(panel); // 點擊後立即重排
                });
                r1.prepend(star);
            });
        }

        function sortPanel(panel) {
            captureOrder(panel);
            injectStars(panel);
            const cards = Array.from(panel.querySelectorAll(':scope > .wb-card'));
            if (cards.length < 2) return;

            const pinned = getPinned();

            // 檢查所有卡片是否存活
            const allDead = cards.every(el => {
                const sub = el.querySelector('.wb-sub');
                return sub && sub.textContent.includes('已被擊敗');
            });

            // 排序規則：星標 → 存活(原始順序) → 已擊敗(原始順序)
            const sorted = cards.slice().sort((a, b) => {
                const bossA = a.dataset.boss;
                const bossB = b.dataset.boss;
                const pinA = pinned.includes(bossA);
                const pinB = pinned.includes(bossB);
                if (pinA && !pinB) return -1;
                if (!pinA && pinB) return 1;

                const aliveA = allDead ? false : (a.querySelector('.wb-sub') ? !a.querySelector('.wb-sub').textContent.includes('已被擊敗') : false);
                const aliveB = allDead ? false : (b.querySelector('.wb-sub') ? !b.querySelector('.wb-sub').textContent.includes('已被擊敗') : false);
                if (aliveA && !aliveB) return -1;
                if (!aliveA && aliveB) return 1;

                const ia = originalOrder ? originalOrder.indexOf(bossA) : 0;
                const ib = originalOrder ? originalOrder.indexOf(bossB) : 0;
                return ia - ib;
            });

            const existing = Array.from(panel.children);
            let needs = false;
            for (let i = 0; i < sorted.length; i++) {
                if (sorted[i] !== existing[i]) { needs = true; break; }
            }
            if (needs) sorted.forEach(el => panel.appendChild(el));

            // 更新 TOP 狀態列時間戳
            if (statusBar) {
                const now = new Date();
                const pad = n => String(n).padStart(2, '0');
                const ts = pad(now.getHours()) + ':' + pad(now.getMinutes()) + ':' + pad(now.getSeconds());
                const timeSpan = statusBar.querySelector('.lh5-boss-time');
                if (timeSpan) timeSpan.textContent = ts;
            }
        }

        function ensureStatusBar(panel) {
            if (statusBar && document.contains(statusBar)) return;
            if (statusBar) statusBar = null;

            // 插在 panel 最前面
            const bar = document.createElement('div');
            bar.id = 'lh5-boss-topbar';
            bar.innerHTML = `
                <span class="lh5-boss-status">
                    <span class="lh5-boss-dot"></span>
                    <span>TOP</span>
                </span>
                <span>⏱ <span class="lh5-boss-time">--:--:--</span></span>
            `;
            panel.parentNode.insertBefore(bar, panel);
            statusBar = bar;
        }

        function start() {
            if (observer) return;
            const panel = document.getElementById('panel-scroll');
            if (!panel) { setTimeout(start, 500); return; }
            ensureStatusBar(panel);
            sortPanel(panel);
            observer = new MutationObserver(() => { sortPanel(panel); });
            observer.observe(panel, { childList: true, subtree: false });
        }

        function stop() {
            if (observer) { observer.disconnect(); observer = null; }
            if (statusBar && statusBar.parentNode) { statusBar.parentNode.removeChild(statusBar); }
            statusBar = null;
        }

        return { start, stop };
    })();

    // ============================================================
    //  3. 背包檢索 + 道具名稱
    // ============================================================
    const bagFeature = (function () {
        let panelObserver = null;
        let gridObserver = null;
        let searchBar = null;
        const bagFilter = { text: '', enchant: '' };

        function removeUI() {
            if (searchBar && searchBar.parentNode) searchBar.parentNode.removeChild(searchBar);
            searchBar = null;
            document.querySelectorAll('.lh5-cell-hidden').forEach(el => el.classList.remove('lh5-cell-hidden'));
        }

        function applyFilter(grid) {
            const cells = grid.querySelectorAll(':scope > .cell');
            let visible = 0;
            const kw = bagFilter.text;

            cells.forEach(cell => {
                const img = cell.querySelector('img');
                const name = getItemNameFromImg(img);

                let show = true;
                let keywordMatches = false;

                if (kw) {
                    keywordMatches = name && name.includes(kw);
                    if (!keywordMatches) show = false;     // 無關鍵字匹配 → 隱藏
                }

                if (show && bagFilter.enchant) {
                    const badge = cell.querySelector('.enbadge');
                    const badgeT = badge ? badge.textContent.trim() : '';
                    if (badgeT !== bagFilter.enchant) show = false;
                }

                if (show) { cell.classList.remove('lh5-cell-hidden'); visible++; }
                else { cell.classList.add('lh5-cell-hidden'); }

                // 名稱標籤：只有關鍵字匹配時才顯示
                let label = cell.querySelector('.lh5-cell-label');
                if (kw && keywordMatches && img) {
                    if (!label) {
                        label = document.createElement('span');
                        label.className = 'lh5-cell-label';
                        img.after(label);
                    }
                    const idx = name.indexOf(kw);
                    label.innerHTML = name.slice(0, idx)
                        + `<span class="lh5-hl">${escapeHtml(name.slice(idx, idx + kw.length))}</span>`
                        + escapeHtml(name.slice(idx + kw.length));
                } else {
                    if (label) label.remove();
                }
            });

            const cs = searchBar && searchBar.querySelector('.lh5-bag-count');
            if (cs) cs.textContent = kw || bagFilter.enchant ? `顯示 ${visible} / ${cells.length}` : '';
        }

        function escapeHtml(s) {
            const d = document.createElement('div');
            d.textContent = s;
            return d.innerHTML;
        }

        function injectUI(grid) {
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

            if (gridObserver) gridObserver.disconnect();
            gridObserver = new MutationObserver(() => {
                if (document.contains(grid)) doFilter();
            });
            gridObserver.observe(grid, { childList: true });

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
    //  4. 啟動
    // ============================================================
    bossFeature.start();
    bagFeature.start();

    setInterval(() => {
        const panel = document.getElementById('panel-scroll');
        if (!panel) return;

        const wbCards = panel.querySelectorAll(':scope > .wb-card');
        if (wbCards.length > 0) bossFeature.start();

        const grid = panel.querySelector(':scope > .grid');
        if (grid) {
            const bar = document.getElementById('lh5-bag-search-bar');
            if (!bar) bagFeature.start();
        }
    }, 3000);

})();
