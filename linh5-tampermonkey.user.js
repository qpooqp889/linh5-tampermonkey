// ==UserScript==
// @name         LinH5 工具箱 - 世界王置頂 & 背包檢索
// @namespace    https://linh5web.win/
// @version      1.1.3
// @description  世界王存活自動置頂 + 星星置頂(Chrome localStorage) + 背包物品檢索（搜尋/強化篩選）+ 浮動設定齒輪
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
    //  ⚙ 設定 + localStorage
    // ============================================================
    const STORAGE_KEY = 'lh5_settings';
    const DEFAULTS = { bossPinAlive: true, bagSearch: true };
    const PINNED_KEY = 'lh5_pinned_bosses';

    function loadSettings() {
        try { const r = GM_getValue(STORAGE_KEY, null); if (r) return { ...DEFAULTS, ...JSON.parse(r) }; } catch (_) {}
        return { ...DEFAULTS };
    }
    function saveSettings(s) { GM_setValue(STORAGE_KEY, JSON.stringify(s)); }
    function getPinned() {
        try { const r = localStorage.getItem(PINNED_KEY); return r ? JSON.parse(r) : []; } catch (_) { return []; }
    }
    function setPinned(l) { localStorage.setItem(PINNED_KEY, JSON.stringify(l)); }
    function togglePinned(id) {
        let l = getPinned();
        l = l.includes(id) ? l.filter(x => x !== id) : (l.push(id), l);
        setPinned(l);
        return l.includes(id);
    }

    // ============================================================
    //  🎨 CSS
    // ============================================================
    GM_addStyle(`
        #lh5-settings-btn {
            display:inline-flex;align-items:center;justify-content:center;
            width:32px;height:32px;cursor:pointer;border-radius:6px;
            background:rgba(255,255,255,0.08);font-size:18px;color:#c8a96e;
            transition:background .2s,transform .2s;user-select:none;
            margin-left:6px;flex-shrink:0;vertical-align:middle;
        }
        #lh5-settings-btn:hover { background:rgba(255,255,255,0.18); transform:rotate(30deg); }
        #lh5-modal-overlay {
            position:fixed;inset:0;z-index:999999;background:rgba(0,0,0,0.6);
            display:none;align-items:center;justify-content:center;backdrop-filter:blur(2px);
        }
        #lh5-modal-overlay.open { display:flex; }
        #lh5-modal {
            background:#1a1a2e;border:1px solid #c8a96e;border-radius:12px;
            padding:24px 28px;min-width:300px;max-width:400px;
            box-shadow:0 8px 40px rgba(0,0,0,0.6);color:#e0d5c1;font-size:14px;
        }
        #lh5-modal h2 { margin:0 0 20px;font-size:18px;color:#c8a96e;border-bottom:1px solid #333;padding-bottom:10px; }
        .lh5-switch-row { display:flex;align-items:center;justify-content:space-between;padding:10px 0;border-bottom:1px solid #2a2a3e; }
        .lh5-switch-row:last-child { border-bottom:none; }
        .lh5-switch-label { flex:1;cursor:pointer; }
        .lh5-switch-label .desc { font-size:12px;color:#888;margin-top:2px; }
        .lh5-toggle { position:relative;width:44px;height:24px;flex-shrink:0;margin-left:12px;cursor:pointer; }
        .lh5-toggle input { display:none; }
        .lh5-toggle .slider { position:absolute;inset:0;background:#444;border-radius:12px;transition:background .25s; }
        .lh5-toggle .slider::after { content:'';position:absolute;width:18px;height:18px;left:3px;top:3px;background:#ccc;border-radius:50%;transition:transform .25s,background .25s; }
        .lh5-toggle input:checked + .slider { background:#c8a96e; }
        .lh5-toggle input:checked + .slider::after { transform:translateX(20px);background:#fff; }
        #lh5-modal-close-hint { text-align:right;font-size:12px;color:#666;margin-top:12px;cursor:pointer; }
        #lh5-modal-close-hint:hover { color:#aaa; }
        #lh5-bag-search-bar { display:flex;align-items:center;gap:8px;padding:6px 8px;background:#12121e;border-bottom:1px solid #2a2a3e;flex-shrink:0; }
        #lh5-bag-search-bar input { flex:1;min-width:0;background:#0d0d18;border:1px solid #333;border-radius:6px;padding:5px 10px;color:#e0d5c1;font-size:13px;outline:none;transition:border-color .2s; }
        #lh5-bag-search-bar input:focus { border-color:#c8a96e; }
        #lh5-bag-search-bar input::placeholder { color:#555; }
        #lh5-bag-search-bar select { background:#0d0d18;border:1px solid #333;border-radius:6px;padding:5px 8px;color:#e0d5c1;font-size:13px;outline:none;cursor:pointer;flex-shrink:0; }
        #lh5-bag-search-bar select:focus { border-color:#c8a96e; }
        #lh5-bag-search-bar select option { background:#1a1a2e;color:#e0d5c1; }
        #lh5-bag-search-bar .lh5-bag-count { font-size:12px;color:#888;white-space:nowrap;flex-shrink:0; }
        .lh5-cell-hidden { display:none!important; }
        #lh5-boss-topbar { display:flex;align-items:center;justify-content:space-between;padding:4px 10px;background:#0e0e1a;border-bottom:1px solid #2a2a3e;font-size:11px;color:#666;flex-shrink:0; }
        #lh5-boss-topbar .lh5-boss-left { display:flex;align-items:center;gap:4px; }
        #lh5-boss-topbar .lh5-boss-dot { width:7px;height:7px;border-radius:50%;background:#22c55e;flex-shrink:0; }
        .lh5-star { cursor:pointer;font-size:16px;line-height:1;margin-right:4px;user-select:none;transition:transform .15s;flex-shrink:0; }
        .lh5-star:hover { transform:scale(1.25); }
        .lh5-star.pinned { color:#fbbf24; }
        .lh5-star:not(.pinned) { color:#444; }
        .wb-r1 { display:flex;align-items:center; }
        #lh5-blood-btn { display:inline-flex;align-items:center;justify-content:center;width:28px;height:28px;cursor:pointer;border-radius:50%;background:rgba(180,40,40,0.2);font-size:16px;color:#e04040;transition:background .2s,transform .2s;user-select:none;margin-left:4px;flex-shrink:0;vertical-align:middle; }
        #lh5-blood-btn:hover { background:rgba(180,40,40,0.45); transform:scale(1.15); }
    `);

    // ============================================================
    //  🧩 DOM（齒輪 + Modal）— 只建立一次
    // ============================================================
    const gearBtn = document.createElement('div');
    gearBtn.id = 'lh5-settings-btn'; gearBtn.textContent = '⚙'; gearBtn.title = '設定';

    const overlay = document.createElement('div'); overlay.id = 'lh5-modal-overlay';
    const modal = document.createElement('div'); modal.id = 'lh5-modal';
    modal.innerHTML = `<h2>⚙ 設定</h2><div id="lh5-modal-body"></div><div id="lh5-modal-close-hint">✕ 點擊空白關閉</div>`;
    overlay.appendChild(modal); document.body.appendChild(overlay);

    gearBtn.addEventListener('click', () => { renderSettings(); overlay.classList.add('open'); });
    overlay.addEventListener('click', e => { if (e.target === overlay) overlay.classList.remove('open'); });

    // ============================================================
    //  📋 設定面板
    // ============================================================
    const SETTINGS_DEF = [
        { key: 'bossPinAlive', label: '世界王自動更新置頂', desc: '將「存活中」的世界王自動排到列表最前面' },
        { key: 'bagSearch', label: '背包物品檢索', desc: '在背包上方新增搜尋框與 +4~+10 強化篩選下拉' },
    ];
    function renderSettings() {
        const s = loadSettings();
        document.getElementById('lh5-modal-body').innerHTML = SETTINGS_DEF.map(d => {
            const c = s[d.key] ? 'checked' : '';
            return `<div class="lh5-switch-row"><label class="lh5-switch-label"><div>${d.label}</div>${d.desc?`<div class="desc">${d.desc}</div>`:''}</label><label class="lh5-toggle"><input type="checkbox" data-key="${d.key}" ${c}><span class="slider"></span></label></div>`;
        }).join('');
        document.querySelectorAll('#lh5-modal-body .lh5-toggle input[type="checkbox"]').forEach(cb => {
            cb.addEventListener('change', () => {
                const k = cb.dataset.key, s2 = loadSettings(); s2[k] = cb.checked; saveSettings(s2); applyFeature(k, cb.checked);
            });
        });
    }

    // ============================================================
    //  🐉 世界王功能
    // ============================================================
    const bossFeature = (function () {
        let obs = null, bar = null;

        function injectStars(p) {
            const pinned = getPinned();
            p.querySelectorAll(':scope > .wb-card').forEach(c => {
                if (c.querySelector('.lh5-star')) return;
                const r1 = c.querySelector('.wb-r1'); if (!r1) return;
                const s = document.createElement('span');
                s.className = 'lh5-star' + (pinned.includes(c.dataset.boss) ? ' pinned' : '');
                s.textContent = pinned.includes(c.dataset.boss) ? '★' : '☆';
                s.addEventListener('click', e => {
                    e.stopPropagation();
                    const np = togglePinned(c.dataset.boss);
                    s.textContent = np ? '★' : '☆'; s.classList.toggle('pinned', np);
                    sortP(p);
                });
                r1.prepend(s);
            });
        }

        function sortP(p) {
            injectStars(p);
            const cards = Array.from(p.querySelectorAll(':scope > .wb-card'));
            if (cards.length < 2) return;
            const pinned = getPinned();
            const allDead = cards.every(el => el.querySelector('.wb-sub')?.textContent.includes('已被擊敗'));
            const sorted = cards.slice().sort((a, b) => {
                const pa = pinned.includes(a.dataset.boss), pb = pinned.includes(b.dataset.boss);
                if (pa && !pb) return -1; if (!pa && pb) return 1;
                if (!allDead) {
                    const aa = a.querySelector('.wb-sub')?.textContent.includes('已被擊敗') === false;
                    const ab = b.querySelector('.wb-sub')?.textContent.includes('已被擊敗') === false;
                    if (aa && !ab) return -1; if (!aa && ab) return 1;
                }
                return 0;
            });
            const existing = Array.from(p.children).filter(el => el.classList.contains('wb-card'));
            let need = false;
            for (let i = 0; i < sorted.length; i++) { if (sorted[i] !== existing[i]) { need = true; break; } }
            if (need) sorted.forEach(el => p.appendChild(el));
            if (bar && document.contains(bar)) {
                const now = new Date(), t = String(now.getHours()).padStart(2,'0')+':'+String(now.getMinutes()).padStart(2,'0')+':'+String(now.getSeconds()).padStart(2,'0');
                const te = bar.querySelector('.lh5-boss-time'); if (te) te.textContent = t;
            }
        }

        function ensureBar(p) {
            if (p.firstChild?.id === 'lh5-boss-topbar' && document.contains(p.firstChild)) { bar = p.firstChild; return; }
            bar = null;
            const b = document.createElement('div'); b.id = 'lh5-boss-topbar';
            b.innerHTML = `<span class="lh5-boss-left"><span class="lh5-boss-dot"></span><span>TOP</span></span><span>⏱ <span class="lh5-boss-time">--:--:--</span></span>`;
            p.insertBefore(b, p.firstChild); bar = b;
        }

        function tryStart() {
            const p = document.getElementById('panel-scroll');
            if (!p) return false;
            const cards = p.querySelectorAll(':scope > .wb-card');
            if (cards.length === 0) return false;
            ensureBar(p); sortP(p);
            if (obs) { obs.disconnect(); obs = null; }
            obs = new MutationObserver(() => sortP(p));
            obs.observe(p, { childList: true, subtree: false });
            return true;
        }

        function disable() {
            if (obs) { obs.disconnect(); obs = null; }
            if (bar && bar.parentNode) bar.parentNode.removeChild(bar);
            bar = null;
        }

        return { tryStart, disable };
    })();

    // ============================================================
    //  🎒 背包檢索功能
    // ============================================================
    const bagFeature = (function () {
        let panelObs = null, gridObs = null, searchBar = null;
        const filter = { text: '', enchant: '' };

        function applyFilter(grid) {
            if (!grid) return;
            const cells = grid.querySelectorAll(':scope > .cell');
            let v = 0;
            cells.forEach(c => {
                let show = true;
                if (filter.text) {
                    const img = c.querySelector('img');
                    let n = '';
                    if (img?.src) { const parts = decodeURIComponent(img.src).split('/'); n = parts[parts.length-1].replace(/\.\w+$/,''); }
                    if (!n.includes(filter.text)) show = false;
                }
                if (show && filter.enchant) {
                    const badge = c.querySelector('.enbadge');
                    if ((badge?.textContent.trim()||'') !== filter.enchant) show = false;
                }
                c.classList.toggle('lh5-cell-hidden', !show);
                if (show) v++;
            });
            const cs = searchBar?.querySelector('.lh5-bag-count');
            if (cs) cs.textContent = `顯示 ${v} / ${cells.length}`;
        }

        function injectUI(grid) {
            if (searchBar && document.contains(searchBar)) return; searchBar = null;
            const bar = document.createElement('div'); bar.id = 'lh5-bag-search-bar';
            const input = document.createElement('input'); input.type = 'text'; input.placeholder = '🔍 搜尋道具名稱…'; input.value = filter.text;
            const select = document.createElement('select');
            ['全部','+4','+5','+6','+7','+8','+9','+10'].forEach(v => {
                const o = document.createElement('option'); o.value = v==='全部'?'':v; o.textContent = v;
                if (o.value === filter.enchant) o.selected = true; select.appendChild(o);
            });
            const cs = document.createElement('span'); cs.className = 'lh5-bag-count';
            bar.appendChild(input); bar.appendChild(select); bar.appendChild(cs);
            grid.parentNode.insertBefore(bar, grid); searchBar = bar;
            const df = () => { filter.text = input.value.trim(); filter.enchant = select.value; applyFilter(grid); };
            input.addEventListener('input', df); select.addEventListener('change', df);
            if (gridObs) gridObs.disconnect();
            gridObs = new MutationObserver(() => { if (document.contains(grid)) df(); });
            gridObs.observe(grid, { childList: true });
            df();
        }

        function tryStart() {
            const p = document.getElementById('panel-scroll'); if (!p) return false;
            const grid = p.querySelector(':scope > .grid'); if (!grid) return false;
            injectUI(grid);
            if (panelObs) panelObs.disconnect();
            panelObs = new MutationObserver(() => {
                const g = p.querySelector(':scope > .grid');
                if (g && (!searchBar || !document.contains(searchBar))) injectUI(g);
                else if (!g && searchBar) { searchBar.parentNode?.removeChild(searchBar); searchBar = null; }
            });
            panelObs.observe(p, { childList: true });
            return true;
        }

        function disable() {
            if (searchBar?.parentNode) searchBar.parentNode.removeChild(searchBar); searchBar = null;
            if (panelObs) { panelObs.disconnect(); panelObs = null; }
            if (gridObs) { gridObs.disconnect(); gridObs = null; }
            document.querySelectorAll('.lh5-cell-hidden').forEach(el => el.classList.remove('lh5-cell-hidden'));
        }

        return { tryStart, disable };
    })();

    // ============================================================
    //  🩸 血盟按鈕功能
    // ============================================================
    const bloodBtn = document.createElement('div');
    bloodBtn.id = 'lh5-blood-btn';
    bloodBtn.textContent = '🧑';
    bloodBtn.title = '血盟';

    function mountBloodBtn() {
        const tb = document.getElementById('topbar');
        if (!tb) { setTimeout(mountBloodBtn, 300); return; }
        const nameEl = document.getElementById('t-name');
        if (!nameEl) { setTimeout(mountBloodBtn, 300); return; }
        if (nameEl.parentNode.querySelector('#lh5-blood-btn')) return; // 已存在
        nameEl.after(bloodBtn);
    }

    // 點擊血盟按鈕 → 找到血盟NPC並觸發
    bloodBtn.addEventListener('click', () => {
        const npcGrid = document.getElementById('npc-grid');
        if (!npcGrid) return;
        // 找血盟NPC: nn 包含「血盟」或 nt 包含「血盟」
        const cards = npcGrid.querySelectorAll('.npc-card');
        let target = null;
        for (const c of cards) {
            const nt = c.querySelector('.nt');
            if (nt && nt.textContent.includes('血盟')) { target = c; break; }
            const nn = c.querySelector('.nn');
            if (nn && nn.textContent.includes('血盟')) { target = c; break; }
        }
        if (target) {
            target.click();
            // 也試試程式化事件
            target.dispatchEvent(new MouseEvent('click', { bubbles: true }));
        }
    });

    // ============================================================
    //  🔧 開關控制
    // ============================================================
    function applyFeature(k, en) {
        if (k === 'bossPinAlive') { if (en) bossFeature.tryStart(); else bossFeature.disable(); }
        if (k === 'bagSearch') { if (en) bagFeature.tryStart(); else bagFeature.disable(); }
    }
    function initFeatures() { const s = loadSettings(); SETTINGS_DEF.forEach(d => applyFeature(d.key, s[d.key])); }

    // ============================================================
    //  ⚙ 齒輪掛載（topbar gold-box 右邊）
    // ============================================================
    function mountGear() {
        const tb = document.getElementById('topbar'); if (!tb) { setTimeout(mountGear, 300); return; }
        const gb = tb.querySelector('.gold-box');
        if (gb) { if (!gb.parentNode.querySelector('#lh5-settings-btn')) gb.after(gearBtn); }
        else { if (!tb.querySelector('#lh5-settings-btn')) tb.appendChild(gearBtn); }
    }

    // ============================================================
    //  🏁 初始化
    // ============================================================
    mountGear();
    mountBloodBtn();
    initFeatures();

    // ============================================================
    //  🛡️ 超級巡邏員（唯一 setInterval — 永遠有效，輕量無害）
    //  每 800ms 只做一件事：檢查「#panel-scroll 節點是否被重建」
    //  若重建 → 立刻重新掛載功能
    //  不掃描 DOM、不調度，100% 輕量
    // ============================================================
    let _lastPanelNode = null;

    setInterval(() => {
        const panel = document.getElementById('panel-scroll');
        // 節點參考變了 → panel 被砍掉換新 → 功能全死，需要重啟
        if (panel !== _lastPanelNode) {
            _lastPanelNode = panel;

            // 確認齒輪 + 血盟按鈕
            if (!document.getElementById('lh5-settings-btn')) mountGear();
            if (!document.getElementById('lh5-blood-btn')) mountBloodBtn();

            // 重啟功能
            const s = loadSettings();
            if (s.bossPinAlive) { bossFeature.disable(); bossFeature.tryStart(); }
            if (s.bagSearch) { bagFeature.disable(); bagFeature.tryStart(); }
        }
    }, 800);

})();
