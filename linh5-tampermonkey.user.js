// ==UserScript==
// @name         LinH5 工具箱 - 世界王置頂 & 背包檢索
// @namespace    https://linh5web.win/
// @version      1.1.1
// @description  設定面板：世界王存活自動置頂 + 背包物品檢索（按名稱搜尋 / 按強化 +4~+10 篩選）
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
    //  1. 設定 key
    // ============================================================
    const STORAGE_KEY = 'lh5_settings';
    const DEFAULTS = {
        bossPinAlive: true,
        bagSearch: true,
    };

    function loadSettings() {
        try {
            const raw = GM_getValue(STORAGE_KEY, null);
            if (raw) return { ...DEFAULTS, ...JSON.parse(raw) };
        } catch (_) {}
        return { ...DEFAULTS };
    }

    function saveSettings(s) {
        GM_setValue(STORAGE_KEY, JSON.stringify(s));
    }

    // ============================================================
    //  2. CSS
    // ============================================================
    GM_addStyle(`
        /* ── 浮動齒輪按鈕 ── */
        #lh5-settings-btn {
            position: fixed;
            bottom: 80px;
            right: 6px;
            z-index: 999999;
            display: flex;
            align-items: center;
            justify-content: center;
            width: 38px;
            height: 38px;
            cursor: pointer;
            border-radius: 50%;
            background: rgba(26,26,46,0.85);
            border: 1px solid #c8a96e;
            font-size: 20px;
            color: #c8a96e;
            transition: background 0.2s, transform 0.2s;
            user-select: none;
            box-shadow: 0 2px 12px rgba(0,0,0,0.4);
        }
        #lh5-settings-btn:hover {
            background: rgba(60,60,90,0.95);
            transform: scale(1.12);
        }

        /* ── Modal ── */
        #lh5-modal-overlay {
            position: fixed;
            inset: 0;
            z-index: 999999;
            background: rgba(0,0,0,0.6);
            display: none;
            align-items: center;
            justify-content: center;
            backdrop-filter: blur(2px);
        }
        #lh5-modal-overlay.open { display: flex; }

        #lh5-modal {
            background: #1a1a2e;
            border: 1px solid #c8a96e;
            border-radius: 12px;
            padding: 24px 28px;
            min-width: 300px;
            max-width: 400px;
            box-shadow: 0 8px 40px rgba(0,0,0,0.6);
            color: #e0d5c1;
            font-size: 14px;
        }
        #lh5-modal h2 {
            margin: 0 0 20px;
            font-size: 18px;
            color: #c8a96e;
            border-bottom: 1px solid #333;
            padding-bottom: 10px;
        }
        .lh5-switch-row {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 10px 0;
            border-bottom: 1px solid #2a2a3e;
        }
        .lh5-switch-row:last-child { border-bottom: none; }
        .lh5-switch-label { flex: 1; cursor: pointer; }
        .lh5-switch-label .desc { font-size: 12px; color: #888; margin-top: 2px; }
        .lh5-toggle {
            position: relative;
            width: 44px; height: 24px;
            flex-shrink: 0; margin-left: 12px; cursor: pointer;
        }
        .lh5-toggle input { display: none; }
        .lh5-toggle .slider {
            position: absolute; inset: 0;
            background: #444; border-radius: 12px; transition: background 0.25s;
        }
        .lh5-toggle .slider::after {
            content: '';
            position: absolute;
            width: 18px; height: 18px;
            left: 3px; top: 3px;
            background: #ccc; border-radius: 50%;
            transition: transform 0.25s, background 0.25s;
        }
        .lh5-toggle input:checked + .slider { background: #c8a96e; }
        .lh5-toggle input:checked + .slider::after {
            transform: translateX(20px); background: #fff;
        }
        #lh5-modal-close-hint {
            text-align: right; font-size: 12px; color: #666; margin-top: 12px; cursor: pointer;
        }
        #lh5-modal-close-hint:hover { color: #aaa; }

        /* ── 背包檢索 ── */
        #lh5-bag-search-bar {
            display: flex; align-items: center; gap: 8px;
            padding: 6px 8px;
            background: #12121e;
            border-bottom: 1px solid #2a2a3e;
            flex-shrink: 0;
        }
        #lh5-bag-search-bar input {
            flex: 1; min-width: 0;
            background: #0d0d18; border: 1px solid #333; border-radius: 6px;
            padding: 5px 10px; color: #e0d5c1; font-size: 13px; outline: none;
            transition: border-color 0.2s;
        }
        #lh5-bag-search-bar input:focus { border-color: #c8a96e; }
        #lh5-bag-search-bar input::placeholder { color: #555; }
        #lh5-bag-search-bar select {
            background: #0d0d18; border: 1px solid #333; border-radius: 6px;
            padding: 5px 8px; color: #e0d5c1; font-size: 13px; outline: none;
            cursor: pointer; flex-shrink: 0;
        }
        #lh5-bag-search-bar select:focus { border-color: #c8a96e; }
        #lh5-bag-search-bar select option { background: #1a1a2e; color: #e0d5c1; }
        #lh5-bag-search-bar .lh5-bag-count {
            font-size: 12px; color: #888; white-space: nowrap; flex-shrink: 0;
        }
        .lh5-cell-hidden { display: none !important; }
    `);

    // ============================================================
    //  3. DOM 元素（一次性建立，不依賴遊戲 DOM）
    // ============================================================
    // 齒輪是 position:fixed 的浮動按鈕，直接掛在 body
    const gearBtn = document.createElement('div');
    gearBtn.id = 'lh5-settings-btn';
    gearBtn.textContent = '⚙';
    gearBtn.title = '設定';

    // Modal
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

    gearBtn.addEventListener('click', () => {
        renderSettings();
        overlay.classList.add('open');
    });
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) overlay.classList.remove('open');
    });

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
            return `
                <div class="lh5-switch-row">
                    <label class="lh5-switch-label">
                        <div>${def.label}</div>
                        ${def.desc ? `<div class="desc">${def.desc}</div>` : ''}
                    </label>
                    <label class="lh5-toggle">
                        <input type="checkbox" data-key="${def.key}" ${checked}>
                        <span class="slider"></span>
                    </label>
                </div>
            `;
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
    //  5. 功能
    // ============================================================
    const features = {};

    // ── 5a. 世界王置頂 ──
    features.bossPinAlive = {
        observer: null,
        start() {
            if (this.observer) return;
            const panel = document.getElementById('panel-scroll');
            if (!panel) {
                setTimeout(() => this.start(), 500);
                return;
            }
            this.sortPanel(panel);
            this.observer = new MutationObserver(() => this.sortPanel(panel));
            this.observer.observe(panel, { childList: true, subtree: false });
        },
        stop() {
            if (this.observer) { this.observer.disconnect(); this.observer = null; }
        },
        sortPanel(panel) {
            const cards = Array.from(panel.querySelectorAll(':scope > .wb-card'));
            if (cards.length < 2) return;
            cards.sort((a, b) => {
                const subA = a.querySelector('.wb-sub');
                const subB = b.querySelector('.wb-sub');
                const aliveA = subA ? !subA.textContent.includes('已被擊敗') : false;
                const aliveB = subB ? !subB.textContent.includes('已被擊敗') : false;
                if (aliveA && !aliveB) return -1;
                if (!aliveA && aliveB) return 1;
                return 0;
            });
            let needs = false;
            const existing = Array.from(panel.children);
            for (let i = 0; i < cards.length; i++) {
                if (cards[i] !== existing[i]) { needs = true; break; }
            }
            if (needs) cards.forEach(el => panel.appendChild(el));
        },
    };

    // ── 5b. 背包檢索 ──
    features.bagSearch = {
        panelObserver: null,
        gridObserver: null,
        searchBar: null,
        filterText: '',
        filterEnchant: '',
        start() { this._observePanel(); },
        stop() { this._removeUI(); if (this.panelObserver) { this.panelObserver.disconnect(); this.panelObserver = null; } if (this.gridObserver) { this.gridObserver.disconnect(); this.gridObserver = null; } },
        _removeUI() {
            if (this.searchBar && this.searchBar.parentNode) this.searchBar.parentNode.removeChild(this.searchBar);
            this.searchBar = null;
            document.querySelectorAll('.lh5-cell-hidden').forEach(el => el.classList.remove('lh5-cell-hidden'));
        },
        _observePanel() {
            const panel = document.getElementById('panel-scroll');
            if (!panel) { setTimeout(() => this.start(), 500); return; }
            const grid = panel.querySelector(':scope > .grid');
            if (grid) this._injectUI(grid);
            if (this.panelObserver) this.panelObserver.disconnect();
            this.panelObserver = new MutationObserver(() => {
                const g = panel.querySelector(':scope > .grid');
                if (g && !this.searchBar) this._injectUI(g);
                else if (!g && this.searchBar) this._removeUI();
            });
            this.panelObserver.observe(panel, { childList: true });
        },
        _injectUI(grid) {
            if (this.searchBar) return;
            const bar = document.createElement('div');
            bar.id = 'lh5-bag-search-bar';
            const input = document.createElement('input');
            input.type = 'text'; input.placeholder = '🔍 搜尋道具名稱…'; input.value = this.filterText;
            const select = document.createElement('select');
            ['全部','+4','+5','+6','+7','+8','+9','+10'].forEach(v => {
                const opt = document.createElement('option');
                opt.value = v === '全部' ? '' : v;
                opt.textContent = v;
                if (opt.value === this.filterEnchant) opt.selected = true;
                select.appendChild(opt);
            });
            const countSpan = document.createElement('span');
            countSpan.className = 'lh5-bag-count';
            bar.appendChild(input); bar.appendChild(select); bar.appendChild(countSpan);
            grid.parentNode.insertBefore(bar, grid);
            this.searchBar = bar;
            const doFilter = () => {
                this.filterText = input.value.trim();
                this.filterEnchant = select.value;
                this._applyFilter(grid, countSpan);
            };
            input.addEventListener('input', doFilter);
            select.addEventListener('change', doFilter);
            if (this.gridObserver) this.gridObserver.disconnect();
            this.gridObserver = new MutationObserver(() => { if (document.contains(grid)) doFilter(); });
            this.gridObserver.observe(grid, { childList: true });
            doFilter();
        },
        _applyFilter(grid, countSpan) {
            const cells = grid.querySelectorAll(':scope > .cell');
            let visibleCount = 0;
            cells.forEach(cell => {
                let show = true;
                if (this.filterText) {
                    const img = cell.querySelector('img');
                    let itemName = '';
                    if (img && img.src) {
                        const parts = decodeURIComponent(img.src).split('/');
                        itemName = parts[parts.length - 1].replace(/\.\w+$/, '');
                    }
                    if (!itemName.includes(this.filterText)) show = false;
                }
                if (show && this.filterEnchant) {
                    const badge = cell.querySelector('.enbadge');
                    if ((badge ? badge.textContent.trim() : '') !== this.filterEnchant) show = false;
                }
                if (show) { cell.classList.remove('lh5-cell-hidden'); visibleCount++; }
                else { cell.classList.add('lh5-cell-hidden'); }
            });
            if (countSpan) countSpan.textContent = `顯示 ${visibleCount} / ${cells.length}`;
        },
    };

    // ============================================================
    //  6. 應用功能
    // ============================================================
    function applyFeature(key, enabled) {
        const feat = features[key];
        if (!feat) return;
        if (enabled) feat.start(); else feat.stop();
    }

    function initFeatures() {
        const s = loadSettings();
        SETTINGS_DEF.forEach(def => applyFeature(def.key, s[def.key]));
    }

    // ============================================================
    //  7. 掛載齒輪（放 body，不再依賴 topbar）
    // ============================================================
    document.body.appendChild(gearBtn);

    // ============================================================
    //  8. 啟動
    // ============================================================
    initFeatures();

    // watchdog: 每 1.5 秒檢查功能是否活著
    const WATCH_INTERVAL = 1500;
    setInterval(() => {
        // 齒輪（fixed 不會被洗掉，但保留檢查防止被其他腳本刪除）
        if (!document.getElementById('lh5-settings-btn')) {
            document.body.appendChild(gearBtn);
        }

        const s = loadSettings();

        // 世界王
        if (s.bossPinAlive) {
            const panel = document.getElementById('panel-scroll');
            const cards = panel ? panel.querySelectorAll(':scope > .wb-card') : [];
            if (cards.length > 0) {
                const obs = features.bossPinAlive.observer;
                // 如果 observer 不存在或其綁定 root 不在 DOM 中，重啟
                if (!obs || !document.contains(obs.root || panel)) {
                    features.bossPinAlive.stop();
                    features.bossPinAlive.start();
                }
            }
        }

        // 背包
        if (s.bagSearch) {
            const panel = document.getElementById('panel-scroll');
            const grid = panel && panel.querySelector(':scope > .grid');
            if (grid && (!features.bagSearch.searchBar || !document.contains(features.bagSearch.searchBar))) {
                features.bagSearch.stop();
                features.bagSearch.start();
            }
        }
    }, WATCH_INTERVAL);

})();
