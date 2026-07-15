// ==UserScript==
// @name         LinH5 工具箱 - 世界王置頂 & 背包檢索
// @namespace    https://linh5web.win/
// @version      1.1.2
// @description  設定面板：世界王存活自動置頂 + 星星置頂 + 背包物品檢索（按名稱搜尋 / 按強化 +4~+10 篩選）
// @author       QClaw
// @match        https://linh5web.win/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=linh5web.win
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_addStyle
// @run-at       document-idle
// ==/UserScript==

(function () {
    'use strict';

    // ============================================================
    //  1. 設定 / localStorage（星星）
    // ============================================================
    const STORAGE_KEY = 'lh5_settings';
    const DEFAULTS = { bossPinAlive: true, bagSearch: true };
    const PINNED_KEY = 'lh5_pinned_bosses';

    function loadSettings() {
        try { const raw = GM_getValue(STORAGE_KEY, null); if (raw) return { ...DEFAULTS, ...JSON.parse(raw) }; } catch (_) {}
        return { ...DEFAULTS };
    }
    function saveSettings(s) { GM_setValue(STORAGE_KEY, JSON.stringify(s)); }

    function getPinned() {
        try { const raw = localStorage.getItem(PINNED_KEY); return raw ? JSON.parse(raw) : []; } catch (_) { return []; }
    }
    function setPinned(list) { localStorage.setItem(PINNED_KEY, JSON.stringify(list)); }
    function togglePinned(bossId) {
        let list = getPinned();
        list = list.includes(bossId) ? list.filter(id => id !== bossId) : (list.push(bossId), list);
        setPinned(list);
        return list.includes(bossId);
    }

    // ============================================================
    //  2. CSS
    // ============================================================
    GM_addStyle(`
        /* ── 齒輪按鈕（掛在 topbar gold-box 右邊） ── */
        #lh5-settings-btn {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            width: 32px;
            height: 32px;
            cursor: pointer;
            border-radius: 6px;
            background: rgba(255,255,255,0.08);
            font-size: 18px;
            color: #c8a96e;
            transition: background 0.2s, transform 0.2s;
            user-select: none;
            margin-left: 6px;
            flex-shrink: 0;
            vertical-align: middle;
        }
        #lh5-settings-btn:hover {
            background: rgba(255,255,255,0.18);
            transform: rotate(30deg);
        }

        /* ── Modal ── */
        #lh5-modal-overlay {
            position: fixed; inset: 0; z-index: 999999;
            background: rgba(0,0,0,0.6); display: none;
            align-items: center; justify-content: center;
            backdrop-filter: blur(2px);
        }
        #lh5-modal-overlay.open { display: flex; }
        #lh5-modal {
            background: #1a1a2e; border: 1px solid #c8a96e; border-radius: 12px;
            padding: 24px 28px; min-width: 300px; max-width: 400px;
            box-shadow: 0 8px 40px rgba(0,0,0,0.6);
            color: #e0d5c1; font-size: 14px;
        }
        #lh5-modal h2 { margin: 0 0 20px; font-size: 18px; color: #c8a96e; border-bottom: 1px solid #333; padding-bottom: 10px; }
        .lh5-switch-row { display: flex; align-items: center; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #2a2a3e; }
        .lh5-switch-row:last-child { border-bottom: none; }
        .lh5-switch-label { flex: 1; cursor: pointer; }
        .lh5-switch-label .desc { font-size: 12px; color: #888; margin-top: 2px; }
        .lh5-toggle { position: relative; width: 44px; height: 24px; flex-shrink: 0; margin-left: 12px; cursor: pointer; }
        .lh5-toggle input { display: none; }
        .lh5-toggle .slider { position: absolute; inset: 0; background: #444; border-radius: 12px; transition: background 0.25s; }
        .lh5-toggle .slider::after { content: ''; position: absolute; width: 18px; height: 18px; left: 3px; top: 3px; background: #ccc; border-radius: 50%; transition: transform 0.25s, background 0.25s; }
        .lh5-toggle input:checked + .slider { background: #c8a96e; }
        .lh5-toggle input:checked + .slider::after { transform: translateX(20px); background: #fff; }
        #lh5-modal-close-hint { text-align: right; font-size: 12px; color: #666; margin-top: 12px; cursor: pointer; }
        #lh5-modal-close-hint:hover { color: #aaa; }

        /* ── 背包檢索 ── */
        #lh5-bag-search-bar {
            display: flex; align-items: center; gap: 8px;
            padding: 6px 8px; background: #12121e;
            border-bottom: 1px solid #2a2a3e; flex-shrink: 0;
        }
        #lh5-bag-search-bar input {
            flex: 1; min-width: 0; background: #0d0d18; border: 1px solid #333;
            border-radius: 6px; padding: 5px 10px; color: #e0d5c1;
            font-size: 13px; outline: none; transition: border-color 0.2s;
        }
        #lh5-bag-search-bar input:focus { border-color: #c8a96e; }
        #lh5-bag-search-bar input::placeholder { color: #555; }
        #lh5-bag-search-bar select {
            background: #0d0d18; border: 1px solid #333; border-radius: 6px;
            padding: 5px 8px; color: #e0d5c1; font-size: 13px;
            outline: none; cursor: pointer; flex-shrink: 0;
        }
        #lh5-bag-search-bar select:focus { border-color: #c8a96e; }
        #lh5-bag-search-bar select option { background: #1a1a2e; color: #e0d5c1; }
        #lh5-bag-search-bar .lh5-bag-count { font-size: 12px; color: #888; white-space: nowrap; flex-shrink: 0; }
        .lh5-cell-hidden { display: none !important; }

        /* ── 世界王 TOP 狀態列（插在 wb-cards 最前面） ── */
        #lh5-boss-topbar {
            display: flex; align-items: center; justify-content: space-between;
            padding: 4px 10px; background: #0e0e1a;
            border-bottom: 1px solid #2a2a3e;
            font-size: 11px; color: #666; flex-shrink: 0;
        }
        #lh5-boss-topbar .lh5-boss-left { display: flex; align-items: center; gap: 4px; }
        #lh5-boss-topbar .lh5-boss-dot { width: 7px; height: 7px; border-radius: 50%; background: #22c55e; flex-shrink: 0; }

        /* ── 星星按鈕 ── */
        .lh5-star {
            cursor: pointer; font-size: 16px; line-height: 1;
            margin-right: 4px; user-select: none;
            transition: transform 0.15s; flex-shrink: 0;
        }
        .lh5-star:hover { transform: scale(1.25); }
        .lh5-star.pinned { color: #fbbf24; }
        .lh5-star:not(.pinned) { color: #444; }
        .wb-r1 { display: flex; align-items: center; }
    `);

    // ============================================================
    //  3. DOM 元素（齒輪 + Modal）
    // ============================================================
    const gearBtn = document.createElement('div');
    gearBtn.id = 'lh5-settings-btn';
    gearBtn.textContent = '⚙';
    gearBtn.title = '設定';

    const overlay = document.createElement('div');
    overlay.id = 'lh5-modal-overlay';
    const modal = document.createElement('div');
    modal.id = 'lh5-modal';
    modal.innerHTML = `
        <h2>⚙ 設定</h2>
        <div id="lh5-modal-body"></div>
        <div id="lh5-modal-close-hint">✕ 點擊空白關閉</div>
    `;
    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    gearBtn.addEventListener('click', () => { renderSettings(); overlay.classList.add('open'); });
    overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.classList.remove('open'); });

    // ============================================================
    //  4. 設定渲染
    // ============================================================
    const SETTINGS_DEF = [
        { key: 'bossPinAlive', label: '世界王自動更新置頂', desc: '將「存活中」的世界王自動排到列表最前面' },
        { key: 'bagSearch', label: '背包物品檢索', desc: '在背包上方新增搜尋框與 +4~+10 強化篩選下拉' },
    ];

    function renderSettings() {
        const s = loadSettings();
        const body = document.getElementById('lh5-modal-body');
        body.innerHTML = SETTINGS_DEF.map(def => {
            const checked = s[def.key] ? 'checked' : '';
            return `<div class="lh5-switch-row">
                <label class="lh5-switch-label"><div>${def.label}</div>${def.desc ? `<div class="desc">${def.desc}</div>` : ''}</label>
                <label class="lh5-toggle"><input type="checkbox" data-key="${def.key}" ${checked}><span class="slider"></span></label>
            </div>`;
        }).join('');
        body.querySelectorAll('.lh5-toggle input[type="checkbox"]').forEach(cb => {
            cb.addEventListener('change', () => {
                const key = cb.dataset.key;
                const s2 = loadSettings();
                s2[key] = cb.checked;
                saveSettings(s2);
                applyFeature(key, cb.checked);
            });
        });
    }

    // ============================================================
    //  5. 世界王功能（置頂 + 星星 + TOP 列）
    // ============================================================
    const bossFeature = (function () {
        let observer = null;
        let statusBar = null;
        let alive = false;

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
                    sortPanel(panel);
                });
                r1.prepend(star);
            });
        }

        function sortPanel(panel) {
            injectStars(panel);
            const cards = Array.from(panel.querySelectorAll(':scope > .wb-card'));
            if (cards.length < 2) return;
            const pinned = getPinned();
            const allDead = cards.every(el => {
                const sub = el.querySelector('.wb-sub');
                return sub && sub.textContent.includes('已被擊敗');
            });
            const sorted = cards.slice().sort((a, b) => {
                const pinA = pinned.includes(a.dataset.boss);
                const pinB = pinned.includes(b.dataset.boss);
                if (pinA && !pinB) return -1;
                if (!pinA && pinB) return 1;
                if (!allDead) {
                    const subA = a.querySelector('.wb-sub');
                    const subB = b.querySelector('.wb-sub');
                    const aliveA = subA ? !subA.textContent.includes('已被擊敗') : false;
                    const aliveB = subB ? !subB.textContent.includes('已被擊敗') : false;
                    if (aliveA && !aliveB) return -1;
                    if (!aliveA && aliveB) return 1;
                }
                return 0;
            });
            let needs = false;
            const existing = Array.from(panel.children).filter(el => el.classList.contains('wb-card'));
            for (let i = 0; i < sorted.length; i++) {
                if (sorted[i] !== existing[i]) { needs = true; break; }
            }
            if (needs) sorted.forEach(el => panel.appendChild(el));
            // 更新 TOP 列時間
            if (statusBar && document.contains(statusBar)) {
                const now = new Date();
                const pad = n => String(n).padStart(2, '0');
                const ts = pad(now.getHours()) + ':' + pad(now.getMinutes()) + ':' + pad(now.getSeconds());
                const timeEl = statusBar.querySelector('.lh5-boss-time');
                if (timeEl) timeEl.textContent = ts;
            }
        }

        function ensureStatusBar(panel) {
            const first = panel.firstChild;
            if (first && first.id === 'lh5-boss-topbar' && document.contains(first)) {
                statusBar = first;
                return;
            }
            if (statusBar) statusBar = null;
            const bar = document.createElement('div');
            bar.id = 'lh5-boss-topbar';
            bar.innerHTML = `
                <span class="lh5-boss-left">
                    <span class="lh5-boss-dot"></span>
                    <span>TOP</span>
                </span>
                <span>⏱ <span class="lh5-boss-time">--:--:--</span></span>
            `;
            panel.insertBefore(bar, panel.firstChild);
            statusBar = bar;
        }

        function start() {
            alive = true;
            const panel = document.getElementById('panel-scroll');
            if (!panel) { setTimeout(start, 500); return; }
            // 只在有 wb-card 時啟用（世界王分頁）
            const cards = panel.querySelectorAll(':scope > .wb-card');
            if (cards.length === 0) { setTimeout(start, 500); return; }
            ensureStatusBar(panel);
            sortPanel(panel);
            if (observer) { observer.disconnect(); observer = null; }
            observer = new MutationObserver(() => {
                if (alive) sortPanel(panel);
            });
            observer.observe(panel, { childList: true, subtree: false });
        }

        function stop() {
            alive = false;
            if (observer) { observer.disconnect(); observer = null; }
            if (statusBar && statusBar.parentNode) statusBar.parentNode.removeChild(statusBar);
            statusBar = null;
        }

        // 從外部觸發一次檢查（切分頁時呼叫）
        function poke() {
            const panel = document.getElementById('panel-scroll');
            if (!panel) return;
            const cards = panel.querySelectorAll(':scope > .wb-card');
            if (cards.length > 0) {
                alive = true;
                ensureStatusBar(panel);
                sortPanel(panel);
                if (!observer) {
                    observer = new MutationObserver(() => { if (alive) sortPanel(panel); });
                    observer.observe(panel, { childList: true, subtree: false });
                }
            } else {
                // 不在世界王分頁 → 暫停
                stop();
            }
        }

        return { start, stop, poke };
    })();

    // ============================================================
    //  6. 背包檢索
    // ============================================================
    const bagFeature = (function () {
        let panelObserver = null;
        let gridObserver = null;
        let searchBar = null;
        let alive = false;
        const filter = { text: '', enchant: '' };

        function removeUI() {
            if (searchBar && searchBar.parentNode) searchBar.parentNode.removeChild(searchBar);
            searchBar = null;
            document.querySelectorAll('.lh5-cell-hidden').forEach(el => el.classList.remove('lh5-cell-hidden'));
        }

        function applyFilter(grid) {
            if (!grid) return;
            const cells = grid.querySelectorAll(':scope > .cell');
            let visible = 0;
            cells.forEach(cell => {
                let show = true;
                if (filter.text) {
                    const img = cell.querySelector('img');
                    let name = '';
                    if (img && img.src) {
                        const parts = decodeURIComponent(img.src).split('/');
                        name = parts[parts.length - 1].replace(/\.\w+$/, '');
                    }
                    if (!name.includes(filter.text)) show = false;
                }
                if (show && filter.enchant) {
                    const badge = cell.querySelector('.enbadge');
                    if ((badge ? badge.textContent.trim() : '') !== filter.enchant) show = false;
                }
                if (show) { cell.classList.remove('lh5-cell-hidden'); visible++; }
                else { cell.classList.add('lh5-cell-hidden'); }
            });
            const cs = searchBar && searchBar.querySelector('.lh5-bag-count');
            if (cs) cs.textContent = `顯示 ${visible} / ${cells.length}`;
        }

        function injectUI(grid) {
            if (searchBar && document.contains(searchBar)) return;
            searchBar = null;
            const bar = document.createElement('div');
            bar.id = 'lh5-bag-search-bar';
            const input = document.createElement('input');
            input.type = 'text'; input.placeholder = '🔍 搜尋道具名稱…'; input.value = filter.text;
            const select = document.createElement('select');
            ['全部','+4','+5','+6','+7','+8','+9','+10'].forEach(v => {
                const opt = document.createElement('option');
                opt.value = v === '全部' ? '' : v;
                opt.textContent = v;
                if (opt.value === filter.enchant) opt.selected = true;
                select.appendChild(opt);
            });
            const countSpan = document.createElement('span');
            countSpan.className = 'lh5-bag-count';
            bar.appendChild(input); bar.appendChild(select); bar.appendChild(countSpan);
            grid.parentNode.insertBefore(bar, grid);
            searchBar = bar;
            const doFilter = () => { filter.text = input.value.trim(); filter.enchant = select.value; applyFilter(grid); };
            input.addEventListener('input', doFilter);
            select.addEventListener('change', doFilter);
            if (gridObserver) gridObserver.disconnect();
            gridObserver = new MutationObserver(() => { if (document.contains(grid)) doFilter(); });
            gridObserver.observe(grid, { childList: true });
            doFilter();
        }

        function start() {
            alive = true;
            const panel = document.getElementById('panel-scroll');
            if (!panel) { setTimeout(start, 500); return; }
            const grid = panel.querySelector(':scope > .grid');
            if (grid) injectUI(grid);
            if (panelObserver) panelObserver.disconnect();
            panelObserver = new MutationObserver(() => {
                if (!alive) return;
                const g = panel.querySelector(':scope > .grid');
                if (g && (!searchBar || !document.contains(searchBar))) injectUI(g);
                else if (!g && searchBar) removeUI();
            });
            panelObserver.observe(panel, { childList: true });
        }

        function stop() {
            alive = false;
            removeUI();
            if (panelObserver) { panelObserver.disconnect(); panelObserver = null; }
            if (gridObserver) { gridObserver.disconnect(); gridObserver = null; }
        }

        function poke() {
            const panel = document.getElementById('panel-scroll');
            if (!panel) return;
            const grid = panel.querySelector(':scope > .grid');
            if (grid) {
                alive = true;
                injectUI(grid);
                if (!panelObserver) {
                    panelObserver = new MutationObserver(() => {
                        if (!alive) return;
                        const g = panel.querySelector(':scope > .grid');
                        if (g && (!searchBar || !document.contains(searchBar))) injectUI(g);
                        else if (!g && searchBar) removeUI();
                    });
                    panelObserver.observe(panel, { childList: true });
                }
            } else {
                stop();
            }
        }

        return { start, stop, poke };
    })();

    // ============================================================
    //  7. 應用功能
    // ============================================================
    function applyFeature(key, enabled) {
        if (key === 'bossPinAlive') { if (enabled) bossFeature.start(); else bossFeature.stop(); }
        if (key === 'bagSearch') { if (enabled) bagFeature.start(); else bagFeature.stop(); }
    }

    function initFeatures() {
        const s = loadSettings();
        SETTINGS_DEF.forEach(def => applyFeature(def.key, s[def.key]));
    }

    // ============================================================
    //  8. 掛載齒輪到 topbar gold-box 右邊
    // ============================================================
    function mountGear() {
        const topbar = document.getElementById('topbar');
        if (!topbar) { setTimeout(mountGear, 500); return; }
        // 掛在 gold-box 後面（同一行）
        const goldBox = topbar.querySelector('.gold-box');
        if (goldBox) {
            // 確認齒輪還沒掛上
            if (!goldBox.parentNode.querySelector('#lh5-settings-btn')) {
                goldBox.after(gearBtn);
            }
        } else {
            if (!topbar.querySelector('#lh5-settings-btn')) {
                topbar.appendChild(gearBtn);
            }
        }
    }

    // ============================================================
    //  9. 啟動
    // ============================================================
    mountGear();
    initFeatures();

    // 不用全域 setInterval！
    // 改用 MutationObserver 監聽 panel-scroll 內容變化（切分頁時觸發）
    const pokeObserver = new MutationObserver(() => {
        const s = loadSettings();
        if (s.bossPinAlive) bossFeature.poke();
        if (s.bagSearch) bagFeature.poke();
        // 齒輪也要確保
        if (!document.getElementById('lh5-settings-btn')) mountGear();
    });
    // 啟動觀察
    function startPokeWatcher() {
        const panel = document.getElementById('panel-scroll');
        if (!panel) { setTimeout(startPokeWatcher, 500); return; }
        pokeObserver.observe(panel, { childList: true, subtree: false });
    }
    startPokeWatcher();

    // 也監聽 topbar 重建（確保齒輪在）
    const topbarObserver = new MutationObserver(() => {
        if (!document.getElementById('lh5-settings-btn')) mountGear();
    });
    function startTopbarWatcher() {
        const topbar = document.getElementById('topbar');
        if (!topbar) { setTimeout(startTopbarWatcher, 500); return; }
        topbarObserver.observe(topbar, { childList: true, subtree: false });
    }
    startTopbarWatcher();

})();
