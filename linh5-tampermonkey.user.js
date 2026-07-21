// ==UserScript==
// @name         LinH5 工具箱 - 世界王置頂 & 背包檢索
// @namespace    https://linh5web.win/
// @version      2.77
// @description  世界王存活自動置頂 + 星星置頂(Chrome localStorage) + 背包物品檢索（搜尋/強化篩選）+ 浮動設定齒輪
// @author       QClaw
// @match        https://linh5web.win/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=linh5web.win
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_addStyle
// @grant        unsafeWindow
// @run-at       document-idle
// ==/UserScript==

(function () {
    'use strict';

    // ============================================================
    //  ⚙ 設定 + localStorage
    // ============================================================
    const STORAGE_KEY = 'lh5_settings';
    const DEFAULTS = { bossPinAlive: true, bagSearch: true, nameChange: false, autoFarm: false };
    const PINNED_KEY = 'lh5_pinned_bosses';
    const NAME_KEY = 'lh5_custom_name';
    const FARM_LOW_KEY = 'lh5_farm_mp_low';
    const FARM_HIGH_KEY = 'lh5_farm_mp_high';
    const FARM_ZONE_KEY = 'lh5_farm_zone';
    const FARM_SLOT_KEY = 'lh5_farm_slot';
    const FARM_RECONNECT_KEY = 'lh5_farm_reconnect';
    const FARM_UI_KEY = 'lh5_farm_ui_open'; // 僅 UI 展開/收合
    const FARM_MP_ENABLED_KEY = 'lh5_farm_mp_enabled';
    const FARM_HP_ENABLED_KEY = 'lh5_farm_hp_enabled';
    const FARM_HP_LOW_KEY = 'lh5_farm_hp_low';
    const FARM_HP_HIGH_KEY = 'lh5_farm_hp_high';
    const FARM_LOBBY_MODE_KEY = 'lh5_farm_lobby_mode'; // 回大廳方式：toLobby / randomTown
    const FARM_LOBBY_WEAPON_KEY = 'lh5_farm_lobby_weapon';
    const FARM_ZONE_WEAPON_KEY = 'lh5_farm_zone_weapon';
    const FARM_AUTO_RUN_KEY = 'lh5_farm_auto_run';
    const FARM_GOTO_DELAY_MIN_KEY = 'lh5_farm_goto_delay_min';   // 回地圖隨機延遲下限（秒）
    const FARM_GOTO_DELAY_MAX_KEY = 'lh5_farm_goto_delay_max';   // 回地圖隨機延遲上限（秒），0=關閉
    const FARM_LOBBY_COUNT_LIMIT_KEY = 'lh5_farm_lobby_count_limit'; // 回大廳次數上限，達到此值觸發長延遲
    const FARM_LOBBY_COUNT_DELAY_MIN_KEY = 'lh5_farm_lobby_count_delay_min'; // 超出次數後隨機延遲下限（分鐘）
    const FARM_LOBBY_COUNT_DELAY_MAX_KEY = 'lh5_farm_lobby_count_delay_max'; // 超出次數後隨機延遲上限（分鐘）
    const FARM_LOBBY_COUNT_KEY = 'lh5_farm_lobby_count'; // 累計回大廳次數（持久化）
    const FARM_LOBBY_HISTORY_KEY = 'lh5_farm_lobby_history'; // 回大廳歷史清單（JSON array）

    // 隨機村莊清單（安全區）
    const RANDOM_TOWNS = [
        'town_silver_knight', // 銀騎士村
        'town_elf',           // 妖精森林
        'town_talking',       // 說話之島
        'town_gludio',        // 燃柳村
        'town_giran',         // 奇岩
        'town_heine',         // 海音
        'town_oren',          // 歐瑞村莊
        'town_ivory_tower',   // 象牙塔
        'town_witon'          // 威頓村
    ];

    const FARM_ZONES = [
        // ── 野外 ──
        { id: 'training', name: '新兵修練場' },
        { id: 'silver_knight', name: '銀騎士地區' },
        { id: 'talking_island', name: '說話之島周邊' },
        { id: 'zone_01', name: '妖精森林周邊' },
        { id: 'talking_island_port', name: '說話之島港口' },
        { id: 'elf_forest', name: '妖魔森林' },
        { id: 'gludio', name: '古魯丁' },
        { id: 'windwood', name: '風木' },
        { id: 'desert', name: '沙漠' },
        { id: 'kent', name: '肯特' },
        { id: 'dragon_valley', name: '龍之谷' },
        { id: 'fire_dragon', name: '火龍窟' },
        { id: 'giran', name: '奇岩' },
        { id: 'heine', name: '海音' },
        { id: 'mirror_forest', name: '鏡子森林' },
        { id: 'zone_02', name: '歐瑞' },
        { id: 'zone_03', name: '歐瑞雪原' },
        { id: 'zone_04', name: '艾爾摩激戰地' },
        { id: 'zone_05', name: '國境要塞' },
        { id: 'dream_island', name: '夢幻之島' },
        { id: 'oblivion_island', name: '遺忘之島' },
        { id: 'twilight_mt', name: '黃昏山脈' },
        // ── 地監 ──
        { id: 'zone_06', name: '古魯丁地監1樓' },
        { id: 'zone_07', name: '古魯丁地監2樓' },
        { id: 'zone_08', name: '古魯丁地監3樓' },
        { id: 'zone_09', name: '古魯丁地監4樓' },
        { id: 'zone_10', name: '古魯丁地監5樓' },
        { id: 'zone_11', name: '古魯丁地監6樓' },
        { id: 'zone_12', name: '古魯丁地監7樓' },
        { id: 'zone_13', name: '說話之島地監1樓' },
        { id: 'zone_14', name: '說話之島地監2樓' },
        { id: 'zone_15', name: '眠龍洞穴1樓' },
        { id: 'zone_16', name: '眠龍洞穴2樓' },
        { id: 'zone_17', name: '眠龍洞穴3樓' },
        { id: 'crystal_cave1', name: '水晶洞穴1樓' },
        { id: 'crystal_cave2', name: '水晶洞穴2樓' },
        { id: 'crystal_cave3', name: '水晶洞穴3樓' },
        { id: 'zone_18', name: '奇岩地監1樓' },
        { id: 'zone_19', name: '奇岩地監2樓' },
        { id: 'zone_20', name: '奇岩地監3樓' },
        { id: 'zone_21', name: '奇岩地監4樓' },
        { id: 'zone_22', name: '沙漠地監1樓' },
        { id: 'zone_23', name: '沙漠地監2樓' },
        { id: 'zone_24', name: '沙漠地監3樓' },
        { id: 'zone_25', name: '沙漠地監4樓' },
        { id: 'zone_26', name: '龍之谷地監1樓' },
        { id: 'zone_27', name: '龍之谷地監2樓' },
        { id: 'zone_28', name: '龍之谷地監3樓' },
        { id: 'zone_29', name: '龍之谷地監4樓' },
        { id: 'zone_30', name: '龍之谷地監5樓' },
        { id: 'zone_31', name: '龍之谷地監6樓' },
        { id: 'zone_32', name: '螞蟻洞窟1樓' },
        { id: 'zone_33', name: '螞蟻洞窟2樓' },
        { id: 'zone_34', name: '地下通道1樓' },
        { id: 'zone_35', name: '地下通道2樓' },
        { id: 'zone_36', name: '地下通道3樓' },
        { id: 'eva_kingdom', name: '伊娃王國' },
        { id: 'zone_37', name: '象牙塔4樓' },
        { id: 'zone_38', name: '象牙塔5樓' },
        { id: 'zone_39', name: '象牙塔6樓' },
        { id: 'zone_40', name: '象牙塔7樓' },
        { id: 'zone_41', name: '象牙塔8樓' },
    ];

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
            transition:background .2s;user-select:none;
            margin-left:6px;flex-shrink:0;vertical-align:middle;
            position:relative;
        }
        #lh5-settings-btn.lh5-running {
            box-shadow: 0 0 6px rgba(34,197,94,0.6);
            color:#22c55e;
        }
        #lh5-settings-btn.lh5-running::before {
            content:'';
            position:absolute;
            inset:-2px;
            border-radius:8px;
            border:2px solid transparent;
            border-top-color:#22c55e;
            border-right-color:#22c55e;
            animation:lh5-spin 1s linear infinite;
            pointer-events:none;
        }
        @keyframes lh5-spin {
            to { transform:rotate(360deg); }
        }
        #lh5-settings-btn:hover { background:rgba(255,255,255,0.18); }
        #lh5-modal-overlay {
            position:fixed;inset:0;z-index:999999;background:rgba(0,0,0,0.6);
            display:none;align-items:center;justify-content:center;backdrop-filter:blur(2px);
        }
        #lh5-modal-overlay.open { display:flex; }
        #lh5-modal {
            background:#1a1a2e;border:1px solid #c8a96e;border-radius:12px;
            padding:24px 28px;min-width:300px;max-width:400px;
            max-height:90vh;overflow-y:auto;
            box-shadow:0 8px 40px rgba(0,0,0,0.6);color:#e0d5c1;font-size:14px;
        }
        #lh5-modal h2 { margin:0;font-size:18px;color:#c8a96e;padding:12px 16px;border-bottom:1px solid #333;display:flex;align-items:center;justify-content:space-between;position:sticky;top:0;background:#1a1a2e;z-index:10;border-radius:12px 12px 0 0; }
        #lh5-modal-close-x { cursor:pointer;color:#ff4444;font-size:18px;font-weight:bold;line-height:1;padding:2px 6px;border-radius:4px;transition:background .15s;user-select:none; }
        #lh5-modal-close-x:hover { background:rgba(255,68,68,0.2); }
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


        #lh5-friend-btn {
            display:inline-flex;align-items:center;justify-content:center;
            width:28px;height:28px;cursor:pointer;border-radius:50%;
            background:rgba(255,80,80,0.15);font-size:15px;color:#ff6b6b;
            transition:background .2s,transform .2s;user-select:none;
            margin-left:4px;flex-shrink:0;vertical-align:middle;
        }
        #lh5-friend-btn:hover { background:rgba(255,80,80,0.3); transform:scale(1.15); }

        #lh5-boss-countdown { display:none;font-size:14px;font-weight:bold;color:#ff3333;margin-left:6px;flex-shrink:0;font-variant-numeric:tabular-nums; }
        #lh5-friend-overlay {
            position:fixed;inset:0;z-index:999998;background:rgba(0,0,0,0.6);
            display:none;align-items:center;justify-content:center;backdrop-filter:blur(2px);
        }
        #lh5-friend-overlay.open { display:flex; }
        #lh5-friend-modal {
            background:#1a1a2e;border:1px solid #ff6b6b;border-radius:12px;
            padding:24px 28px;min-width:320px;max-width:420px;
            max-height:85vh;overflow-y:auto;
            box-shadow:0 8px 40px rgba(0,0,0,0.6);color:#e0d5c1;font-size:14px;
        }
        #lh5-friend-modal h2 { margin:0 0 16px;font-size:17px;color:#ff6b6b;border-bottom:1px solid #333;padding-bottom:10px;display:flex;align-items:center;justify-content:space-between; }
        #lh5-friend-input-row { display:flex;gap:6px;margin-bottom:10px; }
        #lh5-friend-input-row input { flex:1;background:#0d0d18;border:1px solid #333;border-radius:6px;padding:6px 10px;color:#e0d5c1;font-size:13px;outline:none; }
        #lh5-friend-input-row input:focus { border-color:#ff6b6b; }
        #lh5-friend-input-row input::placeholder { color:#555; }
        #lh5-friend-input-row button { padding:6px 14px;border:none;border-radius:6px;background:#ff6b6b;color:#fff;font-size:13px;cursor:pointer;font-weight:bold; }
        #lh5-friend-input-row button:hover { background:#e05555; }
        #lh5-friend-search { width:100%;padding:6px 10px;margin-bottom:8px;background:#0d0d18;border:1px solid #333;border-radius:6px;color:#e0d5c1;font-size:13px;outline:none;box-sizing:border-box; }
        #lh5-friend-search:focus { border-color:#ff6b6b; }
        #lh5-friend-search::placeholder { color:#555; }
        .lh5-friend-item {
            display:flex;align-items:center;justify-content:space-between;
            padding:8px 10px;border-bottom:1px solid #2a2a3e;
            font-size:13px;
        }
        .lh5-friend-item:last-child { border-bottom:none; }
        .lh5-friend-name { color:#e0d5c1; }
        .cu.cu-link { color:#ffd700;cursor:pointer;text-decoration:underline dotted; }
        .cu.cu-link:hover { text-decoration:underline; }
        .lh5-friend-del {
            padding:3px 10px;border:none;border-radius:4px;
            background:#5a2a2a;color:#ff6b6b;font-size:12px;cursor:pointer;
        }
        .lh5-friend-del:hover { background:#7a3a3a; }
        .lh5-friend-count { font-size:11px;color:#666;margin-top:6px;text-align:center; }
        .lh5-friend-toolbar { display:flex;gap:6px;margin-top:10px;padding-top:10px;border-top:1px solid #2a2a3e; }
        .lh5-friend-toolbar button {
            flex:1;padding:5px 0;border:none;border-radius:6px;
            font-size:12px;cursor:pointer;color:#e0d5c1;background:#2a2a3e;
        }
        .lh5-friend-toolbar button:hover { background:#3a3a4e; }
        #lh5-bag-search-bar { display:flex;align-items:center;gap:8px;padding:6px 8px;background:#12121e;border-bottom:1px solid #2a2a3e;flex-shrink:0; }
        #lh5-bag-search-bar input { flex:1;min-width:0;background:#0d0d18;border:1px solid #333;border-radius:6px;padding:5px 10px;color:#e0d5c1;font-size:13px;outline:none;transition:border-color .2s; }
        #lh5-bag-search-bar input:focus { border-color:#c8a96e; }
        #lh5-bag-search-bar input::placeholder { color:#555; }
        #lh5-bag-search-bar select { background:#0d0d18;border:1px solid #333;border-radius:6px;padding:5px 8px;color:#e0d5c1;font-size:13px;outline:none;cursor:pointer;flex-shrink:0; }
        #lh5-bag-search-bar select:focus { border-color:#c8a96e; }
        #lh5-bag-search-bar select option { background:#1a1a2e;color:#e0d5c1; }
        #lh5-bag-search-bar .lh5-bag-count { font-size:12px;color:#888;white-space:nowrap;flex-shrink:0; }
        .lh5-cell-hidden { display:none!important; }
        /* ── 怪物血條 ── */
        .mslot { position:relative !important; }
        .lh5-mhp-text { position:absolute;top:-16px;left:0;right:0;font-size:9px;color:#fff;text-align:center;text-shadow:0 0 4px #000, 0 0 4px #000, 0 0 4px #000;line-height:1.2;z-index:10;pointer-events:none; }
        .lh5-mhp-wrap { position:absolute;bottom:0;left:0;right:0;height:5px;background:rgba(0,0,0,0.5);border-radius:0 0 3px 3px;z-index:5;pointer-events:none; }
        .lh5-mhp-bar { height:100%;background:linear-gradient(90deg,#e74c3c,#ff6b6b);border-radius:0 0 3px 3px;transition:width .25s ease; }
        /* ── 交易所金錢搜尋 ── */
        #lh5-trade-money-wrap { display:flex;align-items:center;gap:6px;margin-bottom:8px; }
        #lh5-trade-money { flex:1;padding:8px;border-radius:8px;border:1px solid #5a4a26;background:#efe9dc;color:#2a2018;font-size:14px;outline:none; }
        #lh5-trade-money-clear { cursor:pointer;flex-shrink:0;font-size:16px;color:#888;padding:4px 6px;border-radius:4px;line-height:1;user-select:none;transition:background .15s,color .15s; }
        #lh5-trade-money-clear:hover { background:#c0392b;color:#fff; }
        #lh5-trade-money:focus { border-color:#c8a96e; }
        #lh5-trade-money::placeholder { color:#999; }
        .lh5-trade-hidden-money { display:none!important; }
        .lh5-price-fmt { color:#f5c451; font-weight:bold; font-size:11px; margin-left:4px; }





        #lh5-boss-topbar { display:flex;align-items:center;justify-content:space-between;padding:4px 10px;background:#0e0e1a;border-bottom:1px solid #2a2a3e;font-size:11px;color:#666;flex-shrink:0; }
        #lh5-boss-topbar .lh5-boss-left { display:flex;align-items:center;gap:4px; }
        #lh5-boss-topbar .lh5-boss-dot { width:7px;height:7px;border-radius:50%;background:#22c55e;flex-shrink:0; }
        .lh5-star { cursor:pointer;font-size:16px;line-height:1;margin-right:4px;user-select:none;transition:transform .15s;flex-shrink:0; }
        .lh5-star:hover { transform:scale(1.25); }
        .lh5-star.pinned { color:#fbbf24; }
                .lh5-star:not(.pinned) { color:#444; }
        .wb-r1 { display:flex;align-items:center; }
        .lh5-boss-countdown { color:#fbbf24; font-weight:bold; margin-right:6px; }
        .lh5-ba-toggle { display:inline-flex;align-items:center;justify-content:center; }
        .lh5-ba-toggle.on { background:#16a34a;color:#fff; }
        .lh5-ba-toggle:not(.on) { background:#dc2626;color:#fff; }

    `);

    // ============================================================
    //  🧩 DOM（齒輪 + Modal）— 只建立一次
    // ============================================================
    const gearBtn = document.createElement('div');
    gearBtn.id = 'lh5-settings-btn'; gearBtn.textContent = '⚙'; gearBtn.title = '設定 v2.77 · 按一下打開';

    const overlay = document.createElement('div'); overlay.id = 'lh5-modal-overlay';
    const modal = document.createElement('div'); modal.id = 'lh5-modal';
    const now = new Date();
    const dateStr = now.getFullYear() + '-' + String(now.getMonth()+1).padStart(2,'0') + '-' + String(now.getDate()).padStart(2,'0');
    modal.innerHTML = `<h2><span>⚙ 設定 <span style="font-size:11px;color:#666;font-weight:normal">v2.77 (${dateStr})</span></span><span id="lh5-modal-close-x">✕</span></h2><div id="lh5-modal-body"></div>`;
    overlay.appendChild(modal); document.body.appendChild(overlay);

    gearBtn.addEventListener('click', () => { renderSettings(); overlay.classList.add('open'); });
    overlay.addEventListener('click', e => { if (e.target === overlay || e.target.id === 'lh5-modal-close-x') overlay.classList.remove('open'); });

    // ============================================================
    //  📋 設定面板
    // ============================================================
    const SETTINGS_DEF = [
        { key: 'autoFarm', label: '🤖 掛機腳本', desc: 'MP過低自動回大廳，MP足夠自動前往地圖掛機' },
        { key: 'bossPinAlive', label: '世界王自動更新置頂', desc: '將「存活中」的世界王自動排到列表最前面' },
        { key: 'bagSearch', label: '背包物品檢索', desc: '在背包上方新增搜尋框與 +4~+10 強化篩選下拉' },
        { key: 'tradeMoneySearch', label: '交易所金錢搜尋', desc: '在交易所新增金額模糊搜尋 + 價格簡寫' },
        { key: 'nameChange', label: '變更姓名', desc: '自訂顯示名稱（不影響伺服器）' },
    ];
    function getStored(key, def) {
        try { const r = localStorage.getItem(key); return r !== null ? r : def; } catch (_) { return def; }
    }
    function renderSettings() {
        const s = loadSettings();
        let html = SETTINGS_DEF.map(d => {
            const c = s[d.key] ? 'checked' : '';
            if (d.key === 'autoFarm') {
                // 掛機腳本：改用展開/收合圖示，不顯示 toggle
                const uiOpen = localStorage.getItem('lh5_farm_ui_open') !== '0';
                const arrow = uiOpen ? '▼' : '▶';
                return `<div class="lh5-switch-row lh5-farm-toggle-row" style="cursor:pointer;user-select:none">
                    <label class="lh5-switch-label" style="cursor:pointer">
                        <div>${d.label}</div>
                        ${d.desc?`<div class="desc">${d.desc}</div>`:''}
                    </label>
                    <span class="lh5-farm-arrow" style="font-size:14px;color:#888;flex-shrink:0;margin-left:12px;transition:transform .2s">${arrow}</span>
                </div>`;
            }
            if (d.key === 'nameChange') {
                // 變更姓名維持開關 + 輸入框邏輯
                return `<div class="lh5-switch-row"><label class="lh5-switch-label"><div>${d.label}</div>${d.desc?`<div class="desc">${d.desc}</div>`:''}</label><label class="lh5-toggle"><input type="checkbox" data-key="${d.key}" ${c}><span class="slider"></span></label></div>`;
            }
            return `<div class="lh5-switch-row"><label class="lh5-switch-label"><div>${d.label}</div>${d.desc?`<div class="desc">${d.desc}</div>`:''}</label><label class="lh5-toggle"><input type="checkbox" data-key="${d.key}" ${c}><span class="slider"></span></label></div>`;
        }).join('');
        document.getElementById('lh5-modal-body').innerHTML = html;
        // 掛機腳本展開/收合
        const farmRow = document.querySelector('.lh5-farm-toggle-row');
        if (farmRow) {
            farmRow.addEventListener('click', () => {
                const s2 = loadSettings();
                // 收合只影響 UI，不影響掛機執行
                const nowOpen = localStorage.getItem(FARM_UI_KEY) !== '0';
                localStorage.setItem(FARM_UI_KEY, nowOpen ? '0' : '1');
                renderSettings();
            });
        }
        // 變更姓名開關開啟時，在該 switch-row 內插入輸入框（同一層）
        if (s.nameChange) {
            const curName = localStorage.getItem(NAME_KEY) || '';
            const rows = document.querySelectorAll('#lh5-modal-body .lh5-switch-row');
            for (const row of rows) {
                const cb = row.querySelector('input[data-key="nameChange"]');
                if (cb) {
                    const wrap = document.createElement('div');
                    wrap.style.cssText = 'display:flex;gap:6px;margin-top:6px;width:100%';
                    const inp = document.createElement('input');
                    inp.id = 'lh5-name-input'; inp.type = 'text'; inp.maxLength = 12;
                    inp.placeholder = '輸入自訂名稱…'; inp.value = curName;
                    inp.style.cssText = 'flex:1;background:#0d0d18;border:1px solid #333;border-radius:4px;padding:4px 8px;color:#e0d5c1;font-size:12px;outline:none;min-width:0';
                    const btn = document.createElement('button');
                    btn.id = 'lh5-name-apply'; btn.textContent = '套用';
                    btn.style.cssText = 'padding:4px 12px;border:none;border-radius:4px;background:#c8a96e;color:#1a1a2e;font-size:12px;cursor:pointer;font-weight:bold;flex-shrink:0';
                    wrap.appendChild(inp); wrap.appendChild(btn);
                    row.parentNode.insertBefore(wrap, row.nextSibling);
                    const apply = () => {
                        const v = inp.value.trim();
                        if (v) { localStorage.setItem(NAME_KEY, v); const el = document.getElementById('t-name'); if (el) el.textContent = v; }
                    };
                    btn.addEventListener('click', apply);
                    inp.addEventListener('keydown', e => { if (e.key === 'Enter') apply(); });
                    break;
                }
            }
        }
        // 🤖 掛機腳本開關開啟時，插入參數 UI（用 UI key 判斷）
        if (localStorage.getItem('lh5_farm_ui_open') !== '0') {
            const farmLowVal = localStorage.getItem(FARM_LOW_KEY) || '10';
            const farmHighVal = localStorage.getItem(FARM_HIGH_KEY) || '80';
            const farmZoneVal = localStorage.getItem(FARM_ZONE_KEY) || 'zone_07';
            const farmZoneName = FARM_ZONES.find(z => z.id === farmZoneVal)?.name || '古魯丁地監2樓';
            const mpEnabled = localStorage.getItem(FARM_MP_ENABLED_KEY) !== '0'; // 預設 1
            const hpEnabled = localStorage.getItem(FARM_HP_ENABLED_KEY) === '1';
            const autoRunEnabled = localStorage.getItem(FARM_AUTO_RUN_KEY) !== '0'; // 預設勾選
            const hpLowVal = localStorage.getItem(FARM_HP_LOW_KEY) || '30';
            const hpHighVal = localStorage.getItem(FARM_HP_HIGH_KEY) || '80';
            const lobbyMode = localStorage.getItem(FARM_LOBBY_MODE_KEY) || 'randomTown'; // 預設隨機村莊
            const rows = document.querySelectorAll('#lh5-modal-body .lh5-switch-row');
            for (const row of rows) {
                // autoFarm 改用 .lh5-farm-toggle-row 比對
                if (!row.classList.contains('lh5-farm-toggle-row')) continue;
                    const wrapper = document.createElement('div');
                    wrapper.style.cssText = 'margin-top:8px;width:100%';
                    const weapons = scanWeapons();
                    const lobbyWpn = localStorage.getItem(FARM_LOBBY_WEAPON_KEY) || '';
                    const zoneWpn = localStorage.getItem(FARM_ZONE_WEAPON_KEY) || '';
                    const mkChk = (key, label, checked) =>
                        `<label style="display:inline-flex;align-items:center;gap:4px;cursor:pointer;font-size:12px;color:#aaa;user-select:none;margin-right:8px"><input type="checkbox" data-farm-cb="${key}" ${checked?'checked':''} style="accent-color:#c8a96e"> ${label}</label>`;
                    wrapper.innerHTML = `
                        <div style="padding:10px;background:#12121e;border-radius:8px">
                            <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;font-size:12px;color:#ccc">
                                ${mkChk('mp','✔ MP',mpEnabled)}
                                <span>MP <：</span>
                                <input id="lh5-farm-low" type="number" min="1" max="99" value="${farmLowVal}" style="width:50px;background:#0d0d18;border:1px solid #333;border-radius:4px;padding:3px 6px;color:#e0d5c1;font-size:12px;outline:none">
                                <span>% 回大廳</span>
                                <span>MP >：</span>
                                <input id="lh5-farm-high" type="number" min="1" max="99" value="${farmHighVal}" style="width:50px;background:#0d0d18;border:1px solid #333;border-radius:4px;padding:3px 6px;color:#e0d5c1;font-size:12px;outline:none">
                                <span>% 出發</span>
                            </div>
                            <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;font-size:12px;color:#ccc">
                                ${mkChk('hp','✔ HP',hpEnabled)}
                                <span>HP <：</span>
                                <input id="lh5-farm-hp-low" type="number" min="1" max="99" value="${hpLowVal}" style="width:50px;background:#0d0d18;border:1px solid #333;border-radius:4px;padding:3px 6px;color:#e0d5c1;font-size:12px;outline:none">
                                <span>% 回大廳</span>
                                <span>HP >：</span>
                                <input id="lh5-farm-hp-high" type="number" min="1" max="99" value="${hpHighVal}" style="width:50px;background:#0d0d18;border:1px solid #333;border-radius:4px;padding:3px 6px;color:#e0d5c1;font-size:12px;outline:none">
                                <span>% 出發</span>
                            </div>
                            <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;font-size:12px;color:#ccc">
                                <span>地圖：</span>
                                <input id="lh5-farm-filter" type="text" placeholder="🔍 檢索地圖…" style="flex:1;background:#0d0d18;border:1px solid #333;border-radius:4px;padding:3px 6px;color:#e0d5c1;font-size:12px;outline:none">
                            </div>
                            <div style="display:flex;align-items:center;gap:8px;font-size:12px;color:#ccc">
                                <select id="lh5-farm-zone" size="6" style="flex:1;background:#0d0d18;border:1px solid #333;border-radius:4px;color:#e0d5c1;font-size:12px;outline:none;cursor:pointer">
                                    ${FARM_ZONES.map(z => `<option value="${z.id}"${z.id===farmZoneVal?' selected':''}>${z.name}</option>`).join('')}
                                </select>
                            </div>
                            <div style="display:flex;align-items:center;gap:8px;margin-top:6px;font-size:12px;color:#ccc">
                                <span>回大廳方式：</span>
                                <select id="lh5-farm-lobby-mode" style="flex:1;background:#0d0d18;border:1px solid #333;border-radius:4px;padding:3px 6px;color:#e0d5c1;font-size:12px;outline:none;cursor:pointer">
                                    <option value="toLobby">🏠 回大廳</option>
                                    <option value="randomTown" ${lobbyMode === 'randomTown' ? 'selected' : ''}>🎲 隨機村莊（9選1）</option>
                                </select>
                            </div>
                            <div style="margin-top:8px;padding:6px;background:#15152a;border-radius:6px;font-size:12px;color:#aaa">
                                <div style="margin-bottom:4px">🔫 回大廳裝備：</div>
                                <select id="lh5-farm-lobby-weapon" style="width:100%;background:#0d0d18;border:1px solid #333;border-radius:4px;padding:3px 6px;color:#e0d5c1;font-size:12px;outline:none;cursor:pointer">
                                    <option value="">-- 不換武 --</option>
                                    ${weapons.map(w => `<option value="${w.value}"${lobbyWpn === w.value ? ' selected' : ''}>${w.label}</option>`).join('')}
                                </select>
                                <div style="margin-top:4px;margin-bottom:4px">🔫 出發前裝備：</div>
                                <select id="lh5-farm-zone-weapon" style="width:100%;background:#0d0d18;border:1px solid #333;border-radius:4px;padding:3px 6px;color:#e0d5c1;font-size:12px;outline:none;cursor:pointer">
                                    <option value="">-- 不換武 --</option>
                                    ${weapons.map(w => `<option value="${w.value}"${zoneWpn === w.value ? ' selected' : ''}>${w.label}</option>`).join('')}
                                </select>
                                <div style="margin-top:8px;padding-top:8px;border-top:1px solid #2a2a3e;display:flex;flex-direction:column;gap:4px">
                                    <div style="font-size:12px;color:#aaa">⏱ 回地圖延遲（秒）</div>
                                    <div style="display:flex;align-items:center;gap:4px">
                                        <input id="lh5-farm-goto-delay-min" type="number" min="0" max="300" value="${localStorage.getItem(FARM_GOTO_DELAY_MIN_KEY) || '0'}" style="width:50px;background:#0d0d18;border:1px solid #333;border-radius:4px;padding:3px 6px;color:#e0d5c1;font-size:12px;outline:none">
                                        <span style="font-size:12px;color:#888">~</span>
                                        <input id="lh5-farm-goto-delay-max" type="number" min="0" max="300" value="${localStorage.getItem(FARM_GOTO_DELAY_MAX_KEY) || '2'}" style="width:50px;background:#0d0d18;border:1px solid #333;border-radius:4px;padding:3px 6px;color:#e0d5c1;font-size:12px;outline:none">
                                        <span style="font-size:12px;color:#888">秒隨機（0=關閉）</span>
                                    </div>
                                    <div style="font-size:12px;color:#aaa;margin-top:4px;display:flex;align-items:center;gap:6px">
                                        <span>🔄 回大廳次數保護</span>
                                        <span id="lh5-lobby-count-display" style="color:#ff4444;font-weight:bold">0</span>
                                        <button id="lh5-lobby-history-btn" style="margin-left:4px;padding:2px 8px;background:#2a2a3e;border:1px solid #444;border-radius:4px;color:#aaa;font-size:11px;cursor:pointer">📋 歷史</button>
                                    </div>
                                    <div style="display:flex;align-items:center;gap:4px;flex-wrap:wrap">
                                        <span style="font-size:12px;color:#888">回大廳 &gt;</span>
                                        <input id="lh5-farm-lobby-count-limit" type="number" min="1" max="99" value="${localStorage.getItem(FARM_LOBBY_COUNT_LIMIT_KEY) || '30'}" style="width:45px;background:#0d0d18;border:1px solid #333;border-radius:4px;padding:3px 6px;color:#e0d5c1;font-size:12px;outline:none">
                                        <span style="font-size:12px;color:#888">次，隨機等</span>
                                        <input id="lh5-farm-lobby-count-delay-min" type="number" min="1" max="60" value="${localStorage.getItem(FARM_LOBBY_COUNT_DELAY_MIN_KEY) || '5'}" style="width:40px;background:#0d0d18;border:1px solid #333;border-radius:4px;padding:3px 6px;color:#e0d5c1;font-size:12px;outline:none">
                                        <span style="font-size:12px;color:#888">~</span>
                                        <input id="lh5-farm-lobby-count-delay-max" type="number" min="1" max="60" value="${localStorage.getItem(FARM_LOBBY_COUNT_DELAY_MAX_KEY) || '8'}" style="width:40px;background:#0d0d18;border:1px solid #333;border-radius:4px;padding:3px 6px;color:#e0d5c1;font-size:12px;outline:none">
                                        <span style="font-size:12px;color:#888">分鐘再回地圖</span>
                                    </div>
                                </div>
                            </div>
	                            <div id="lh5-farm-status" style="font-size:11px;color:#666;margin-top:6px;">監控中 (MP < ${farmLowVal}% / HP < ${hpLowVal}% 回大廳, > ${farmHighVal}% / > ${hpHighVal}% 出發 ${farmZoneName})</div>
	                            <div style="margin-top:8px;padding-top:8px;border-top:1px solid #2a2a3e">
	                                <label style="display:inline-flex;align-items:center;gap:6px;cursor:pointer;font-size:13px;color:#4ade80;user-select:none">
	                                    <input id="lh5-farm-auto-run-cb" type="checkbox" ${autoRunEnabled?'checked':''} style="width:16px;height:16px;accent-color:#22c55e"> 
	                                    <span>自動執行 (斷線重連或頁面重整後自動開始)</span>
	                                </label>
	                            </div>
	                        </div>
	                    `;
	                    // 運行/停止按鈕
	                    const runBtn = document.createElement('div');
                    runBtn.id = 'lh5-farm-run-btn';
                    runBtn.style.cssText = 'margin-top:6px;padding:8px 12px;text-align:center;border-radius:8px;font-size:13px;font-weight:bold;cursor:pointer;transition:background .2s';
                    if (autoFarmFeature.isRunning()) {
                        runBtn.style.cssText += 'background:#5a2a2a;color:#ff6b6b';
                        runBtn.textContent = '■ 停止';
                    } else {
                        runBtn.style.cssText += 'background:#2a4a3a;color:#4ade80';
                        runBtn.textContent = '▶ 運行';
                    }
                    runBtn.addEventListener('click', () => {
                        if (autoFarmFeature.isRunning()) {
                            autoFarmFeature.stop();
                            gearBtn.style.animation = 'none';
                        } else {
                            const l = parseInt(document.getElementById('lh5-farm-low')?.value || '10', 10);
                            const h = parseInt(document.getElementById('lh5-farm-high')?.value || '80', 10);
                            const z = document.getElementById('lh5-farm-zone')?.value || 'zone_07';
                            autoFarmFeature.runWithConfig(l, h, z);
                            gearBtn.style.animation = 'lh5-gear-running 1.5s linear infinite';
                            gearBtn.style.border = '2px solid #4ade80';
                            gearBtn.style.borderRadius = '50%';
                        }
                        renderSettings();
                    });
                    wrapper.appendChild(runBtn);
                    row.parentNode.insertBefore(wrapper, row.nextSibling);
                    break;
            }
        }
        document.querySelectorAll('#lh5-modal-body .lh5-toggle input[type="checkbox"]').forEach(cb => {
            cb.addEventListener('change', () => {
                const k = cb.dataset.key, s2 = loadSettings(); s2[k] = cb.checked; saveSettings(s2);
                renderSettings();
                applyFeature(k, cb.checked);
            });
        });

        // 🤖 掛機設定連動
        const farmLow = document.getElementById('lh5-farm-low');
        const farmHigh = document.getElementById('lh5-farm-high');
        const farmZone = document.getElementById('lh5-farm-zone');
        const farmFilter = document.getElementById('lh5-farm-filter');
        if (farmLow && farmHigh && farmZone) {
            // 檢索過濾
            if (farmFilter) {
                farmFilter.addEventListener('input', () => {
                    const q = farmFilter.value.trim();
                    Array.from(farmZone.options).forEach(opt => {
                        opt.hidden = !!q && !opt.text.includes(q);
                    });
                    // 如果選中的被隱藏，自動選第一個可見的
                    if (farmZone.selectedOptions[0]?.hidden) {
                        const firstVisible = Array.from(farmZone.options).find(o => !o.hidden);
                        if (firstVisible) { firstVisible.selected = true; saveFarm(); }
                    }
                });
            }
            const saveFarm = () => {
                const l = parseInt(farmLow.value, 10);
                const h = parseInt(farmHigh.value, 10);
                if (!isNaN(l) && l >= 1 && l <= 99) localStorage.setItem(FARM_LOW_KEY, String(l));
                if (!isNaN(h) && h >= 1 && h <= 99) localStorage.setItem(FARM_HIGH_KEY, String(h));
                localStorage.setItem(FARM_ZONE_KEY, farmZone.value);
                // HP
                const hpLowEl = document.getElementById('lh5-farm-hp-low');
                const hpHighEl = document.getElementById('lh5-farm-hp-high');
                if (hpLowEl) { const v = parseInt(hpLowEl.value,10); if (!isNaN(v)&&v>=1&&v<=99) localStorage.setItem(FARM_HP_LOW_KEY, String(v)); }
                if (hpHighEl) { const v = parseInt(hpHighEl.value,10); if (!isNaN(v)&&v>=1&&v<=99) localStorage.setItem(FARM_HP_HIGH_KEY, String(v)); }

                localStorage.setItem(FARM_LOBBY_WEAPON_KEY, document.getElementById('lh5-farm-lobby-weapon')?.value || '');
                localStorage.setItem(FARM_ZONE_WEAPON_KEY, document.getElementById('lh5-farm-zone-weapon')?.value || '');

                // 更新狀態列
                const st = document.getElementById('lh5-farm-status');
                if (st) {
                    const zn = FARM_ZONES.find(z => z.id === farmZone.value)?.name || '';
                    st.textContent = `監控中 (MP < ${farmLow.value}% / HP < ${hpLowEl?.value||'30'}% 回大廳, > ${farmHigh.value}% / > ${hpHighEl?.value||'80'}% 出發 ${zn})`;
                }
            };
            farmLow.addEventListener('input', saveFarm);
            farmHigh.addEventListener('input', saveFarm);
            farmZone.addEventListener('change', saveFarm);
            farmZone.addEventListener('click', saveFarm);
            // 武器下拉立即存
            document.getElementById('lh5-farm-lobby-mode')?.addEventListener('change', function(){
                localStorage.setItem(FARM_LOBBY_MODE_KEY, this.value);
            });
            document.getElementById('lh5-farm-lobby-weapon')?.addEventListener('change', function(){
                localStorage.setItem(FARM_LOBBY_WEAPON_KEY, this.value);
            });
            document.getElementById('lh5-farm-zone-weapon')?.addEventListener('change', function(){
                localStorage.setItem(FARM_ZONE_WEAPON_KEY, this.value);
            });
            // 新增：回地圖延遲設定（秒）
            document.getElementById('lh5-farm-goto-delay-min')?.addEventListener('input', function(){
                const v = parseInt(this.value, 10);
                if (!isNaN(v) && v >= 0 && v <= 300) localStorage.setItem(FARM_GOTO_DELAY_MIN_KEY, String(v));
            });
            document.getElementById('lh5-farm-goto-delay-max')?.addEventListener('input', function(){
                const v = parseInt(this.value, 10);
                if (!isNaN(v) && v >= 0 && v <= 300) localStorage.setItem(FARM_GOTO_DELAY_MAX_KEY, String(v));
            });
            // 新增：回大廳次數保護設定
            document.getElementById('lh5-farm-lobby-count-limit')?.addEventListener('input', function(){
                const v = parseInt(this.value, 10);
                if (!isNaN(v) && v >= 1 && v <= 99) localStorage.setItem(FARM_LOBBY_COUNT_LIMIT_KEY, String(v));
            });
            document.getElementById('lh5-farm-lobby-count-delay-min')?.addEventListener('input', function(){
                const v = parseInt(this.value, 10);
                if (!isNaN(v) && v >= 1 && v <= 60) localStorage.setItem(FARM_LOBBY_COUNT_DELAY_MIN_KEY, String(v));
            });
            document.getElementById('lh5-farm-lobby-count-delay-max')?.addEventListener('input', function(){
                const v = parseInt(this.value, 10);
                if (!isNaN(v) && v >= 1 && v <= 60) localStorage.setItem(FARM_LOBBY_COUNT_DELAY_MAX_KEY, String(v));
            });
            
            // 歷史清單按鈕
            document.getElementById('lh5-lobby-history-btn')?.addEventListener('click', showLobbyHistoryModal);
            
            // HP inputs
            const hpLowEl = document.getElementById('lh5-farm-hp-low');
            const hpHighEl = document.getElementById('lh5-farm-hp-high');
            if (hpLowEl) hpLowEl.addEventListener('input', saveFarm);
	            if (hpHighEl) hpHighEl.addEventListener('input', saveFarm);

	            const autoRunCb = document.getElementById('lh5-farm-auto-run-cb');
	            if (autoRunCb) {
	                autoRunCb.addEventListener('change', () => {
	                    localStorage.setItem(FARM_AUTO_RUN_KEY, autoRunCb.checked ? '1' : '0');
	                });
	            }
	
	            // 打勾開關
	            document.querySelectorAll('[data-farm-cb]').forEach(cb => {
                cb.addEventListener('change', () => {
                    localStorage.setItem(cb.dataset.farmCb === 'mp' ? FARM_MP_ENABLED_KEY : FARM_HP_ENABLED_KEY, cb.checked ? '1' : '0');
                    saveFarm();
                });
            });
        }
        // 運行/停止按鈕
        const toggleBtn = document.getElementById('lh5-farm-toggle');
        if (toggleBtn) {
            const isRunning = autoFarmFeature.isRunning();
            toggleBtn.textContent = isRunning ? '■ 停止' : '▶ 運行';
            toggleBtn.style.background = isRunning ? '#e04040' : '#22c55e';
            toggleBtn.addEventListener('click', () => {
                if (autoFarmFeature.isRunning()) {
                    autoFarmFeature.stop();
                } else {
                    autoFarmFeature.runWithConfig();
                }
                renderSettings();
            });
        }
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
            b.innerHTML = `<span class="lh5-boss-left"><span class="lh5-boss-dot"></span><span>TOP</span></span><span><span class="lh5-boss-countdown"></span> ⏱ <span class="lh5-boss-time">--:--:--</span></span>`;
            p.insertBefore(b, p.firstChild); bar = b;
        }

        let countdownTimer = null;
        function startCountdown(p) {
            if (countdownTimer) { clearInterval(countdownTimer); countdownTimer = null; }
            countdownTimer = setInterval(() => {
                const cde = bar?.querySelector('.lh5-boss-countdown');
                if (!cde || !document.contains(bar)) { clearInterval(countdownTimer); countdownTimer = null; return; }
                const now = new Date();
                let nearest = null, nearestSec = Infinity;
                const cards = p.querySelectorAll(':scope > .wb-card');
                cards.forEach(c => {
                    const sub = c.querySelector('.wb-sub');
                    if (!sub) return;
                    const txt = sub.textContent;
                    // 存活中 → 跳過
                    if (txt.includes('存活中')) return;
                    // 已被擊敗，HH:00 重生 或 已被擊敗，HH:MM 重生
                    const m = txt.match(/(\d{1,2}):(\d{2})/);
                    if (!m) return;
                    let h = parseInt(m[1], 10), mi = parseInt(m[2], 10);
                    // 如果小時 < 目前小時 → 明天
                    let target = new Date();
                    target.setHours(h, mi, 0, 0);
                    if (target <= now) target.setDate(target.getDate() + 1);
                    const sec = Math.floor((target - now) / 1000);
                    if (sec < nearestSec) { nearestSec = sec; nearest = { name: c.querySelector('.wb-tag')?.nextSibling?.textContent?.trim() || '', target }; }
                });
                if (nearest && nearestSec >= 0 && nearestSec < 86400) {
                    const hh = Math.floor(nearestSec / 3600);
                    const mm = Math.floor((nearestSec % 3600) / 60);
                    const ss = nearestSec % 60;
                    const t = String(hh).padStart(2,'0')+':'+String(mm).padStart(2,'0')+':'+String(ss).padStart(2,'0');
                    cde.textContent = '⏳ '+nearest.name+' '+t;
                } else {
                    cde.textContent = '';
                }
                // 同時更新時間
                const te = bar.querySelector('.lh5-boss-time');
                if (te) {
                    const t = String(now.getHours()).padStart(2,'0')+':'+String(now.getMinutes()).padStart(2,'0')+':'+String(now.getSeconds()).padStart(2,'0');
                    te.textContent = t;
                }
            }, 1000);
        }

        function stopCountdown() {
            if (countdownTimer) { clearInterval(countdownTimer); countdownTimer = null; }
        }

        function tryStart() {
            const p = document.getElementById('panel-scroll');
            if (!p) return false;
            const cards = p.querySelectorAll(':scope > .wb-card');
            if (cards.length === 0) return false;
            ensureBar(p); sortP(p); startCountdown(p);
            if (obs) { obs.disconnect(); obs = null; }
            obs = new MutationObserver(() => sortP(p));
            obs.observe(p, { childList: true, subtree: false });
            return true;
        }

        function disable() {
            stopCountdown();
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
    //  💰 交易所金錢搜尋（模糊匹配 + 高亮）
    // ============================================================
    const tradeMoneyFeature = (function () {
        let moneyInput = null;
        let listObserver = null;
        let _busy = false;
        let _savedQuery = ''; // 保留輸入值，切分頁重建時 restore

        // ── 模糊匹配 ──
        function fuzzyMatchPrice(priceText, query) {
            const priceNum = parseInt(priceText.replace(/[^\d]/g, ''), 10);
            if (isNaN(priceNum) || !query) return true;
            const qNum = parseInt(query.replace(/[^\d]/g, ''), 10);
            if (isNaN(qNum)) return true;
            return String(priceNum).includes(String(qNum));
        }

        // ── 價格簡寫: 1299999 → 129.99... 萬 / 2800000 → 280 萬 / 1.5 億 ──
        function formatPriceShort(priceNum) {
            if (priceNum >= 100000000) {
                const yi = (priceNum / 100000000).toFixed(1).replace(/\.0$/, '');
                return yi + ' 億';
            }
            if (priceNum >= 10000) {
                const s = String(priceNum);
                const intPart = s.slice(0, -4);
                const decPart = s.slice(-4);
                // 全部 0 → 整數萬
                if (decPart === '0000') return intPart + ' 萬';
                // 取前 2 位小數，去尾零
                const kept = decPart.slice(0, 2).replace(/0+$/, '');
                return intPart + '.' + kept + ' 萬';
            }
            return '';
        }

        // ── 過濾 + 價格簡寫 ──
        function applyFilterAndFormat() {
            if (_busy) return;
            const list = document.getElementById('trade-list');
            if (!list) return;
            const items = list.querySelectorAll(':scope > .shop-item');
            if (!items.length) return;

            const query = moneyInput ? moneyInput.value.trim() : '';

            _busy = true;
            items.forEach(el => {
                const priceEl = el.querySelector('.si-p');
                if (!priceEl) { el.classList.remove('lh5-trade-hidden-money'); return; }

                // ★ 先移除舊的簡寫 span（否則 textContent 會包含它的數字，導致下一輪數字膨脹）
                const oldFmt = priceEl.querySelector('.lh5-price-fmt');
                if (oldFmt) oldFmt.remove();

                // ★ 現在讀 textContent 才是乾淨的
                const priceText = priceEl.textContent || '';

                // ── 過濾 ──
                if (!query || fuzzyMatchPrice(priceText, query)) {
                    el.classList.remove('lh5-trade-hidden-money');
                } else {
                    el.classList.add('lh5-trade-hidden-money');
                }

                // ── 價格簡寫 ──
                const priceNum = parseInt(priceText.replace(/[^\d]/g, ''), 10);
                if (!isNaN(priceNum)) {
                    const fmt = formatPriceShort(priceNum);
                    if (fmt) {
                        const span = document.createElement('span');
                        span.className = 'lh5-price-fmt';
                        span.textContent = fmt;
                        span.style.cssText = 'color:#f5c451;font-weight:bold;font-size:11px;margin-left:4px;';
                        priceEl.appendChild(span);
                    }
                }
            });

            // ── 排序 ──
            const sortSelect = document.getElementById('lh5-trade-sort');
            if (sortSelect && sortSelect.value === 'priceAsc') {
                if (listObserver) listObserver.disconnect();
                const sorted = Array.from(list.children).filter(el => el.classList.contains('shop-item')).sort((a, b) => {
                    const pa = parseInt((a.querySelector('.si-p')?.textContent || '0').replace(/[^\d]/g, ''), 10) || 0;
                    const pb = parseInt((b.querySelector('.si-p')?.textContent || '0').replace(/[^\d]/g, ''), 10) || 0;
                    return pa - pb;
                });
                sorted.forEach(el => list.appendChild(el));
                if (listObserver) listObserver.observe(list, { childList: true });
            }
            _busy = false;
        }

        // ── 注入金錢搜尋 input + 排序下拉 ──
        function injectMoneySearch() {
            const searchInput = document.getElementById('trade-search');
            if (!searchInput) return false;
            if (document.getElementById('lh5-trade-money')) return true;

            const wrap = document.createElement('div');
            wrap.id = 'lh5-trade-money-wrap';
            wrap.innerHTML = '<span style="flex-shrink:0;color:#f5c451;font-weight:bold">💰</span><span id="lh5-trade-money-clear" style="cursor:pointer;flex-shrink:0;font-size:16px;color:#888;padding:4px 6px;border-radius:4px;line-height:1;user-select:none" title="清除">✕</span>';
            const inp = document.createElement('input');
            inp.id = 'lh5-trade-money';
            inp.type = 'text';
            inp.placeholder = '💰 金額模糊搜尋（如 800 → 找到 2,800,000）';
            wrap.appendChild(inp);

            // ── 排序下拉（右邊） ──
            const sortSelect = document.createElement('select');
            sortSelect.id = 'lh5-trade-sort';
            sortSelect.style.cssText = 'background:#0d0d18;border:1px solid #333;border-radius:6px;padding:5px 8px;color:#e0d5c1;font-size:13px;outline:none;cursor:pointer;flex-shrink:0;';
            const optDefault = document.createElement('option');
            optDefault.value = 'default';
            optDefault.textContent = '預設';
            const optPriceAsc = document.createElement('option');
            optPriceAsc.value = 'priceAsc';
            optPriceAsc.textContent = '價錢低→高';
            sortSelect.appendChild(optDefault);
            sortSelect.appendChild(optPriceAsc);
            wrap.appendChild(sortSelect);

            searchInput.parentNode.insertBefore(wrap, searchInput.nextSibling);
            moneyInput = inp;

            inp.value = _savedQuery;
            inp.addEventListener('input', () => { _savedQuery = inp.value; applyFilterAndFormat(); });

            // 排序變更
            sortSelect.addEventListener('change', applyFilterAndFormat);

            // ✕ 清除按鈕
            const clearBtn = document.getElementById('lh5-trade-money-clear');
            if (clearBtn) {
                clearBtn.addEventListener('click', () => {
                    inp.value = '';
                    _savedQuery = '';
                    applyFilterAndFormat();
                    inp.focus();
                });
            }
            return true;
        }

        // ── Observer ──
        function setupObserver() {
            const list = document.getElementById('trade-list');
            if (list) {
                if (listObserver) listObserver.disconnect();
                listObserver = new MutationObserver(() => {
                    if (_busy) return;
                    if (!document.getElementById('lh5-trade-money')) {
                        moneyInput = null;
                        injectMoneySearch();
                    }
                    applyFilterAndFormat();
                });
                listObserver.observe(list, { childList: true });
            }
        }

        function tryStart() {
            const ok = injectMoneySearch();
            setupObserver();
            // ★ 立刻過濾 + 價格簡寫（處理 observer 綁定前已存在的項目）
            applyFilterAndFormat();
            setTimeout(applyFilterAndFormat, 200);
            setTimeout(applyFilterAndFormat, 800);
            return true;
        }

        function disable() {
            const w = document.getElementById('lh5-trade-money-wrap');
            if (w) w.parentNode?.removeChild(w);
            moneyInput = null;
            if (listObserver) { listObserver.disconnect(); listObserver = null; }
            document.querySelectorAll('.lh5-trade-hidden-money').forEach(el => el.classList.remove('lh5-trade-hidden-money'));
            document.querySelectorAll('.lh5-price-fmt').forEach(el => el.remove());
        }

        return { tryStart, disable };
    })();

    // ============================================================
    //  🤖 掛機腳本功能
    // ============================================================
        // 注入持續橋接腳本到頁面上下文（unsafeWindow 讀取頁面 window.__lh5_inv）
        if (!document.getElementById('__lh5_inv_bridge')) {
            const s = document.createElement('script');
            s.id = '__lh5_inv_bridge';
            s.textContent = 'try{window.__lh5_inv=(typeof lastState!=="undefined"&&lastState)?lastState.inv:null;window.__lh5_char=(typeof lastState!=="undefined"&&lastState&&lastState.char)?lastState.char:null}catch(e){}setInterval(()=>{try{window.__lh5_inv=(typeof lastState!=="undefined"&&lastState)?lastState.inv:null;window.__lh5_char=(typeof lastState!=="undefined"&&lastState&&lastState.char)?lastState.char:null}catch(e){window.__lh5_inv=null;window.__lh5_char=null}},500)';
            document.documentElement.appendChild(s);
        }

        function scanWeapons() {
        try {
            const w = typeof unsafeWindow !== 'undefined' ? unsafeWindow : window;
            const inv = w.__lh5_inv;
            if (!inv || !Array.isArray(inv)) return [];
            return inv
                .map((it, i) => ({ idx: i, item: it }))
                .filter(x => x.item && x.item.cat === 'wpn')
                .map(x => ({
                    idx: x.idx,
                    value: (x.item.n || '??') + '|' + (x.item.en || 0),
                    label: (x.item.n || '??') + (x.item.en > 0 ? ' +' + x.item.en : ''),
                }));
        } catch(e) { return []; }
    }

    // 根據名稱+強化等級，在 lastState.inv 中找到對應的當前 index
    function findWeaponById(idStr) {
        if (!idStr) return -1;
        const [targetName, targetEn] = idStr.split('|');
        try {
            const w = typeof unsafeWindow !== 'undefined' ? unsafeWindow : window;
            const inv = w.__lh5_inv;
            if (!inv || !Array.isArray(inv)) return -1;
            for (let i = 0; i < inv.length; i++) {
                const it = inv[i];
                if (it && it.cat === 'wpn' && it.n === targetName && String(it.en || 0) === targetEn) return i;
            }
        } catch(e) {}
        return -1;
    }

    const autoFarmFeature = (function () {
        let timer = null;
        let _enabled = false;
        let _mpLow = 10;
        let _mpHigh = 80;
        let _targetZone = 'zone_07';
        let _isResting = false; // 是否正在回MP狀態
        let _reconnectSlot = 0; // 斷線重連的角色位置 0/1/2
        let _reconnectSec = 300; // 斷線重連檢查間隔（秒）
        let _reconnectTimer = null; // 斷線重連 timer

        let _mpEnabled = true;
        let _hpEnabled = false;
        let _hpLow = 30;
        let _hpHigh = 80;
        let _lobbyMode = 'randomTown';

        // 新增：回地圖延遲 + 回大廳次數保護
        let _gotoDelayMin = 0;            // 回地圖隨機延遲下限（秒）
        let _gotoDelayMax = 2;            // 回地圖隨機延遲上限（秒），0=關閉
        let _lobbyCountLimit = 30;      // 回大廳次數上限
        let _lobbyCountDelayMin = 5;    // 超出上限後隨機延遲下限（分鐘）
        let _lobbyCountDelayMax = 8;    // 超出上限後隨機延遲上限（分鐘）
        let _lobbyCount = 0;              // 累計回大廳次數
        let _gotoDelayStart = 0;         // 回地圖延遲開始時間戳（ms），0=未在等待
        let _gotoDelayTotalMs = 0;       // 計算好的延遲總毫秒數
        let _gotoDelayWaitSeconds = 0;   // 計算好的延遲總秒數（用於歷史記錄）
        let _lastLobbyRecord = null;    // 最後一次回大廳記錄（暫存）
        // IP 偵測 / 黑名單相關
        const DEFAULT_BLACKLIST = ['203.203.81.145', '211.72.117.241']; // 隱藏預設黑名單
        const FARM_IP_BLACKLIST_KEY = 'lh5_ip_blacklist';
        let _externalIP = '';            // 當前對外 IP
        let _userBlacklist = [];        // 使用者新增的黑名單（localStorage）
        let _blacklist = [];            // 完整黑名單（預設 + 使用者）
        let _ipAllowed = true;          // 目前 IP 是否允許自動登入
        let _ipTimer = null;            // 每 20 秒偵測 IP 的定時器
        let _themeTimer = null;         // 每 1 秒更新按鈕倒數
        let _ipCountdown = 20;          // 按鈕倒數秒數（20 秒週期）
        let _ipCheckStarted = false;    // IP 偵測是否已啟動

        function updateLobbyCountDisplay() {
            const el = document.getElementById('lh5-lobby-count-display');
            if (el) el.textContent = _lobbyCount;
        }

        function getLobbyHistory() {
            try {
                const data = localStorage.getItem(FARM_LOBBY_HISTORY_KEY);
                return data ? JSON.parse(data) : [];
            } catch (_) { return []; }
        }

        function addLobbyHistory(record) {
            const history = getLobbyHistory();
            history.unshift(record); // 新記錄在最前面
            // 只保留最近 100 筆
            if (history.length > 100) history.length = 100;
            localStorage.setItem(FARM_LOBBY_HISTORY_KEY, JSON.stringify(history));
        }

        // ===== IP 偵測 / 黑名單功能 =====
        async function fetchExternalIP() {
            try {
                const ctrl = new AbortController();
                const to = setTimeout(() => ctrl.abort(), 5000);
                const r = await fetch('https://api.ipify.org?format=json', { signal: ctrl.signal });
                clearTimeout(to);
                const d = await r.json();
                return (d && d.ip) ? d.ip : '';
            } catch (_) {
                return '';
            }
        }

        function loadUserBlacklist() {
            try {
                const data = localStorage.getItem(FARM_IP_BLACKLIST_KEY);
                _userBlacklist = data ? JSON.parse(data) : [];
                if (!Array.isArray(_userBlacklist)) _userBlacklist = [];
            } catch (_) { _userBlacklist = []; }
            rebuildBlacklist();
        }

        function saveUserBlacklist() {
            localStorage.setItem(FARM_IP_BLACKLIST_KEY, JSON.stringify(_userBlacklist));
        }

        function rebuildBlacklist() {
            _blacklist = Array.from(new Set([...DEFAULT_BLACKLIST, ..._userBlacklist]));
        }

        function isIPBlacklisted(ip) {
            return _blacklist.indexOf(ip) >= 0;
        }

        function updateIPAllowState() {
            _ipAllowed = !!(_externalIP && !isIPBlacklisted(_externalIP));
            if (!_ipAllowed) {
                // IP 在黑名單 → 停用自動登入（斷線重連巡邏）
                if (_reconnectTimer) { clearInterval(_reconnectTimer); _reconnectTimer = null; }
                console.log(`[LinH5] ⛔ IP ${_externalIP} 在黑名單，自動登入停用`);
            } else if (_enabled && !_reconnectTimer) {
                // IP 允許且正在掛機 → 重新啟動自動登入
                _reconnectTimer = setInterval(reconnectCheck, _reconnectSec * 1000);
                console.log(`[LinH5] ✅ IP 允許，自動登入已啟動`);
            }
            return _ipAllowed;
        }

        function updateThemeBtn() {
            const btn = document.getElementById('theme-btn');
            if (!btn) return;
            const short = _externalIP ? _externalIP.replace(/\.\d+$/, '.*') : '??';
            if (_externalIP && isIPBlacklisted(_externalIP)) {
                btn.textContent = `配置 · IP黑名單!`;
                btn.style.color = '#e04040';
            } else {
                btn.textContent = `配置 · ${short} · ${_ipCountdown}s`;
                btn.style.color = '';
            }
        }

        function mountIPPanel() {
            const loginBtn = document.getElementById('btn-login');
            if (!loginBtn || !loginBtn.parentNode) return;
            if (loginBtn.parentNode.querySelector('#lh5-ip-panel')) return;
            const panel = document.createElement('div');
            panel.id = 'lh5-ip-panel';
            panel.style.cssText = 'margin-top:8px;padding:8px 10px;background:rgba(0,0,0,0.35);border:1px solid rgba(255,255,255,0.12);border-radius:6px;font-size:12px;color:#ccc;display:flex;flex-direction:column;gap:4px;max-width:280px';
            panel.innerHTML = `
                <div>現在IP: <span id="lh5-ip-now" style="color:#4fc3f7;font-weight:bold">--</span></div>
                <div style="display:flex;gap:6px;align-items:center;margin-top:2px">
                    <button id="lh5-ip-toggle" style="padding:3px 8px;background:rgba(255,255,255,0.1);border:1px solid rgba(255,255,255,0.2);border-radius:4px;color:#e0d5c1;font-size:11px;cursor:pointer">加入黑名單</button>
                    <button id="lh5-ip-refresh" style="padding:3px 8px;background:rgba(255,255,255,0.1);border:1px solid rgba(255,255,255,0.2);border-radius:4px;color:#e0d5c1;font-size:11px;cursor:pointer">刷新</button>
                    <span id="lh5-ip-status" style="font-size:11px;margin-left:auto"></span>
                </div>
            `;
            loginBtn.parentNode.insertBefore(panel, loginBtn.nextSibling);
            // 面板首次出現時立即重新偵測一次 IP（確保現在IP最新）
            fetchExternalIP().then(ip => {
                if (ip) { _externalIP = ip; updateIPAllowState(); updateIPPanel(); updateThemeBtn(); }
            });
            panel.querySelector('#lh5-ip-refresh').addEventListener('click', async () => {
                _externalIP = await fetchExternalIP();
                updateIPAllowState();
                updateIPPanel();
                updateThemeBtn();
            });
            panel.querySelector('#lh5-ip-toggle').addEventListener('click', () => {
                if (!_externalIP || DEFAULT_BLACKLIST.indexOf(_externalIP) >= 0) return; // 預設黑名單不可移除
                const idx = _userBlacklist.indexOf(_externalIP);
                if (idx >= 0) _userBlacklist.splice(idx, 1); // 移除
                else _userBlacklist.push(_externalIP);        // 加入
                saveUserBlacklist();
                rebuildBlacklist();
                updateIPAllowState();
                updateIPPanel();
                updateThemeBtn();
                console.log(`[LinH5] 黑名單更新: ${_userBlacklist.join(', ') || '(空)'}`);
            });
        }

        function updateIPPanel() {
            const now = document.getElementById('lh5-ip-now');
            const status = document.getElementById('lh5-ip-status');
            const toggle = document.getElementById('lh5-ip-toggle');
            if (now) now.textContent = _externalIP || '??';
            const blacklisted = _externalIP ? isIPBlacklisted(_externalIP) : false;
            if (status) {
                if (!_externalIP) { status.textContent = '偵測中...'; status.style.color = '#888'; }
                else if (blacklisted) { status.textContent = '⛔ 黑名單'; status.style.color = '#e04040'; }
                else { status.textContent = '✅ 可登入'; status.style.color = '#22c55e'; }
            }
            if (toggle) {
                if (!_externalIP) { toggle.disabled = true; toggle.textContent = '加入黑名單'; toggle.style.opacity = '0.5'; }
                else if (DEFAULT_BLACKLIST.indexOf(_externalIP) >= 0) { toggle.disabled = true; toggle.textContent = '預設黑名單'; toggle.style.opacity = '0.5'; }
                else if (_userBlacklist.indexOf(_externalIP) >= 0) { toggle.disabled = false; toggle.textContent = '移除黑名單'; toggle.style.opacity = '1'; }
                else { toggle.disabled = false; toggle.textContent = '加入黑名單'; toggle.style.opacity = '1'; }
            }
        }

        async function startIPCheck() {
            if (_ipCheckStarted) return;
            _ipCheckStarted = true;
            loadUserBlacklist();
            _externalIP = await fetchExternalIP();
            updateIPAllowState();
            mountIPPanel();
            updateIPPanel();
            updateThemeBtn();
            console.log(`[LinH5] 對外 IP: ${_externalIP}（黑名單 ${_blacklist.length} 筆）`);
            // 每 20 秒偵測一次 IP
            _ipTimer = setInterval(async () => {
                _externalIP = await fetchExternalIP();
                updateIPAllowState();
                updateIPPanel();
                updateThemeBtn();
            }, 20000);
            // 每 1 秒更新按鈕倒數（20 秒週期顯示）
            _themeTimer = setInterval(() => {
                _ipCountdown--;
                if (_ipCountdown <= 0) _ipCountdown = 20;
                updateThemeBtn();
            }, 1000);
        }

        function loadConfig() {
            try {
                _mpEnabled = localStorage.getItem(FARM_MP_ENABLED_KEY) !== '0';
                _hpEnabled = localStorage.getItem(FARM_HP_ENABLED_KEY) === '1';
                _mpLow = parseInt(localStorage.getItem(FARM_LOW_KEY), 10) || 10;
                _mpHigh = parseInt(localStorage.getItem(FARM_HIGH_KEY), 10) || 80;
                _hpLow = parseInt(localStorage.getItem(FARM_HP_LOW_KEY), 10) || 30;
                _hpHigh = parseInt(localStorage.getItem(FARM_HP_HIGH_KEY), 10) || 80;
                _targetZone = localStorage.getItem(FARM_ZONE_KEY) || 'zone_07';
                _lobbyMode = localStorage.getItem(FARM_LOBBY_MODE_KEY) || 'randomTown';
                _reconnectSlot = parseInt(localStorage.getItem(FARM_SLOT_KEY), 10) || 0;
                _reconnectSec = parseInt(localStorage.getItem(FARM_RECONNECT_KEY), 10) || 300;
                if (_reconnectSlot < 0 || _reconnectSlot > 2) _reconnectSlot = 0;
                if (_reconnectSec < 10) _reconnectSec = 10;
                if (_reconnectSec > 3600) _reconnectSec = 3600;
                // 新增設定讀取（秒）
                _gotoDelayMin = parseInt(localStorage.getItem(FARM_GOTO_DELAY_MIN_KEY), 10) || 0;
                _gotoDelayMax = parseInt(localStorage.getItem(FARM_GOTO_DELAY_MAX_KEY), 10) || 2;
                if (_gotoDelayMin < 0) _gotoDelayMin = 0;
                if (_gotoDelayMin > 300) _gotoDelayMin = 300;
                if (_gotoDelayMax < 0) _gotoDelayMax = 0;
                if (_gotoDelayMax > 300) _gotoDelayMax = 300;
                if (_gotoDelayMin > _gotoDelayMax) _gotoDelayMin = _gotoDelayMax;
                _lobbyCountLimit = parseInt(localStorage.getItem(FARM_LOBBY_COUNT_LIMIT_KEY), 10) || 30;
                if (_lobbyCountLimit < 1) _lobbyCountLimit = 1;
                if (_lobbyCountLimit > 99) _lobbyCountLimit = 99;
                _lobbyCountDelayMin = parseInt(localStorage.getItem(FARM_LOBBY_COUNT_DELAY_MIN_KEY), 10) || 5;
                if (_lobbyCountDelayMin < 1) _lobbyCountDelayMin = 1;
                if (_lobbyCountDelayMin > 60) _lobbyCountDelayMin = 60;
                _lobbyCountDelayMax = parseInt(localStorage.getItem(FARM_LOBBY_COUNT_DELAY_MAX_KEY), 10) || 8;
                if (_lobbyCountDelayMax < 1) _lobbyCountDelayMax = 1;
                if (_lobbyCountDelayMax > 60) _lobbyCountDelayMax = 60;
                if (_lobbyCountDelayMin > _lobbyCountDelayMax) _lobbyCountDelayMin = _lobbyCountDelayMax;
                // 讀取累計回大廳次數
                _lobbyCount = parseInt(localStorage.getItem(FARM_LOBBY_COUNT_KEY), 10) || 0;
            } catch (_) {}
            _mpLow = Math.max(1, Math.min(99, _mpLow));
            _mpHigh = Math.max(1, Math.min(99, _mpHigh));
            _hpLow = Math.max(1, Math.min(99, _hpLow));
            _hpHigh = Math.max(1, Math.min(99, _hpHigh));
        }

        function getMPPercent() {
            try {
                const w = typeof unsafeWindow !== 'undefined' ? unsafeWindow : window;
                const c = w.__lh5_char;
                if (c && c.mp !== undefined && c.maxMp > 0) return (c.mp / c.maxMp) * 100;
            } catch(_) {}
            return 100;
        }

        function getHPPercent() {
            try {
                const w = typeof unsafeWindow !== 'undefined' ? unsafeWindow : window;
                const c = w.__lh5_char;
                if (c && c.hp !== undefined && c.maxHp > 0) return (c.hp / c.maxHp) * 100;
            } catch(_) {}
            return 100;
        }

        function getCurrentZoneName() {
            const el = document.getElementById('zone-name');
            if (!el || el.classList.contains('hidden')) return '';
            return el.textContent.trim();
        }

        function getTargetZoneName() {
            const z = FARM_ZONES.find(x => x.id === _targetZone);
            return z ? z.name : '';
        }

        function _emitSocket(event, ...args) {
            try {
                if (typeof socket !== 'undefined' && socket && typeof socket.emit === 'function') {
                    socket.emit(event, ...args);
                }
            } catch(_) {}
        }

        // 回大廳/選角（依設定選擇封包）
        // 注意：selectChar 可直接在遊戲中發送，伺服器處理重生回銀騎士+滿血滿魔
        function goLobby() {
            const weaponId = localStorage.getItem(FARM_LOBBY_WEAPON_KEY);
            const now = new Date();
            const timestamp = now.toLocaleString('zh-TW', { hour12: false });
            
            let targetZone = '大廳';
            
            // 判斷回大廳模式
            if (_lobbyMode === 'randomTown') {
                // 隨機村莊
                const randomZone = RANDOM_TOWNS[Math.floor(Math.random() * RANDOM_TOWNS.length)];
                targetZone = randomZone;
                console.log(`[LinH5 掛機] 隨機村莊: ${randomZone}`);
                if (weaponId) {
                    const idx = findWeaponById(weaponId);
                    if (idx >= 0) {
                        _emitSocket('equip', idx);
                        setTimeout(() => _emitSocket('setZone', randomZone), 500);
                    } else {
                        _emitSocket('setZone', randomZone);
                    }
                } else {
                    _emitSocket('setZone', randomZone);
                }
            } else {
                // 預設回大廳
                if (weaponId) {
                    const idx = findWeaponById(weaponId);
                    if (idx >= 0) {
                        _emitSocket('equip', idx);
                        setTimeout(() => _emitSocket('toLobby'), 500);
                    } else {
                        _emitSocket('toLobby');
                    }
                } else {
                    _emitSocket('toLobby');
                }
            }
            
            // 記錄回大廳歷史（等待時間為 0，將在出發時更新）
            _lastLobbyRecord = {
                timestamp,
                targetZone,
                waitSeconds: 0
            };
            console.log(`[LinH5 掛機] 已回大廳: ${targetZone}`);
        }

        // 傳送到目標地圖並自動攻擊（直接封包，不再靠 DOM 點擊流程）
        function goToZone() {
            const zoneName = getTargetZoneName();
            if (!zoneName) return;

            const weaponId = localStorage.getItem(FARM_ZONE_WEAPON_KEY);
            const go = () => {
                _emitSocket('setZone', _targetZone);
                setTimeout(() => _emitSocket('attack'), 3000);
            };
            if (weaponId) {
                const idx = findWeaponById(weaponId);
                if (idx >= 0) { _emitSocket('equip', idx); }
                setTimeout(go, 500);
            } else {
                go();
            }
        }

        function tick() {
            if (!_enabled) return;
            loadConfig();

            const mp = getMPPercent();
            const hp = getHPPercent();
            const zoneName = getCurrentZoneName();
            const targetName = getTargetZoneName();
            const now = Date.now();

            // ── 判斷是否該回大廳（MP 或 HP 任一啟用且低於門檻）
            let shouldRest = false;
            if (_mpEnabled && mp < _mpLow) shouldRest = true;
            if (_hpEnabled && hp < _hpLow) shouldRest = true;

            if (shouldRest) {
                if (!_isResting) {
                    _isResting = true;
                    _lobbyCount++;                          // 累計回大廳次數
                    localStorage.setItem(FARM_LOBBY_COUNT_KEY, String(_lobbyCount));
                    updateLobbyCountDisplay();
                    goLobby();
                }
                return;
            }

            // ── 判斷是否該出發：所有啟用的條件都高於門檻
            let canGo = true;
            if (_mpEnabled && mp <= _mpHigh) canGo = false;
            if (_hpEnabled && hp <= _hpHigh) canGo = false;

            if (canGo) {
                const needToGo = _isResting || (targetName && zoneName !== targetName);
                console.log(`[LinH5 掛機] canGo=${canGo}, needToGo=${needToGo}, _isResting=${_isResting}, zone=${zoneName}, target=${targetName}`);
                if (needToGo) {
                    // ── 延遲回地圖邏輯 ──
                    // ① 首次決定要去地圖：計算總等待時間
                    if (_gotoDelayStart === 0) {
                        let totalWaitMs = 0;
                        let delaySecPart = 0;
                        let extraMinPart = 0;
                        
                        if (_gotoDelayMax > 0) {
                            delaySecPart = Math.floor(Math.random() * (_gotoDelayMax - _gotoDelayMin + 1)) + _gotoDelayMin; // min ~ max
                            totalWaitMs = delaySecPart * 1000;
                        }
                        if (_lobbyCount > _lobbyCountLimit) {
                            extraMinPart = Math.floor(Math.random() * (_lobbyCountDelayMax - _lobbyCountDelayMin + 1)) + _lobbyCountDelayMin; // min ~ max
                            totalWaitMs += extraMinPart * 60 * 1000;
                            console.log(`[LinH5 掛機] 回大廳 ${_lobbyCount} 次（上限 ${_lobbyCountLimit}），額外等待 ${extraMinPart} 分鐘`);
                        }
                        
                        _gotoDelayTotalMs = totalWaitMs; // 保存計算結果
                        _gotoDelayWaitSeconds = delaySecPart + (extraMinPart * 60); // 保存等待秒數
                        
                        if (totalWaitMs > 0) {
                            _gotoDelayStart = now;
                            console.log(`[LinH5 掛機] 回地圖延遲 ${Math.round(totalWaitMs/1000)} 秒`);
                            return; // 等待中，本次 tick 不行動
                        }
                    }

                    // ② 還在等待中：檢查是否期滿
                    if (_gotoDelayStart > 0) {
                        if (now - _gotoDelayStart < _gotoDelayTotalMs) {
                            return; // 仍在等待中
                        }
                        // 期滿了，重置並繼續
                        _gotoDelayStart = 0;
                    }

                    // ③ 真正執行：出發
                    _isResting = false;
                    
                    // 如果本次等待是長延遲（>30次觸發），歸零計數器
                    if (_gotoDelayWaitSeconds >= 180) { // 3分鐘以上視為長延遲
                        _lobbyCount = 0;
                        localStorage.setItem(FARM_LOBBY_COUNT_KEY, '0');
                        updateLobbyCountDisplay();
                        console.log(`[LinH5 掛機] 長延遲完成，計數器歸零`);
                    }
                    
                    // 記錄歷史（更新等待時間）
                    if (_lastLobbyRecord) {
                        _lastLobbyRecord.waitSeconds = _gotoDelayWaitSeconds || 0;
                        addLobbyHistory(_lastLobbyRecord);
                        _lastLobbyRecord = null;
                    }
                    
                    console.log(`[LinH5 掛機] 延遲期滿，出發前往 ${targetName}`);
                    goToZone();
                }
            }
            // 在中間區間或已在掛機：不做任何事，維持現狀
        }

        // 斷線重連：先點登入按鈕（若存在）→延遲5秒→再選角色slot
        function reconnectCheck() {
            // 1. 檢查登入按鈕
            const loginBtn = document.getElementById('btn-login');
            if (loginBtn && !loginBtn.classList.contains('hidden')) {
                clickElement(loginBtn);
                // 點完後延遲5秒再選角色
                setTimeout(() => pickCharSlot(), 5000);
                return;
            }
            // 2. 沒有登入鈕 → 直接檢查角色
            pickCharSlot();
        }

        function pickCharSlot() {
            const slots = document.getElementById('slots');
            if (!slots) return;
            const charSlots = slots.querySelectorAll(':scope > .char-slot');
            if (charSlots.length <= _reconnectSlot) return;
            const targetSlot = charSlots[_reconnectSlot];
            if (!targetSlot) return;
            const empty = targetSlot.querySelector('.empty');
            if (empty) return;
            clickElement(targetSlot);
            // 選角後延遲5秒自動執行掛機
            setTimeout(() => {
                loadConfig();
                _isResting = false;
                // 直接觸發一次完整的掛機流程
                const mp = getMPPercent();
                if (mp > _mpHigh) {
                    goToZone();
                }
            }, 5000);
        }

        function runWithConfig() {
            loadConfig();
            _enabled = true;
            _isResting = false;
            _gotoDelayStart = 0; // 重置延遲計時器
            _gotoDelayTotalMs = 0; // 重置延遲總毫秒數
            // _lobbyCount 不重置，跨 session 持續累計
            updateLobbyCountDisplay(); // 啟動時更新 UI
            // IP 偵測：啟動偵測並確認 IP 是否允許
            if (!_ipCheckStarted) startIPCheck();
            updateIPAllowState();
            updateIPPanel();
            updateThemeBtn();
            console.log(`[LinH5 掛機] 啟動，目標地圖: ${getTargetZoneName()} · IP${_ipAllowed ? '允許' : '黑名單(自動登入停用)'}`);
            if (timer) { clearInterval(timer); timer = null; }
            timer = setInterval(tick, 2000);
            // 斷線重連巡邏（IP 黑名單時不啟動）
            if (_reconnectTimer) { clearInterval(_reconnectTimer); _reconnectTimer = null; }
            if (_ipAllowed) {
                _reconnectTimer = setInterval(reconnectCheck, _reconnectSec * 1000);
            } else {
                console.log(`[LinH5] IP 黑名單，自動登入（斷線重連）已停用`);
            }
            // 齒輪動畫
            const gb = document.getElementById('lh5-settings-btn');
            if (gb) gb.classList.add('lh5-running');
        }

        function tryStart() {
            runWithConfig();
            return true;
        }

        function stop() {
            _enabled = false;
            if (timer) { clearInterval(timer); timer = null; }
            if (_reconnectTimer) { clearInterval(_reconnectTimer); _reconnectTimer = null; }
            _isResting = false;
            _gotoDelayStart = 0; // 重置延遲計時器
            // 移除齒輪動畫
            const gb = document.getElementById('lh5-settings-btn');
            if (gb) gb.classList.remove('lh5-running');
        }

        function disable() {
            stop();
        }

        function isRunning() { return _enabled; }

        return { tryStart, disable, runWithConfig, stop, isRunning, getLobbyHistory, startIPCheck, mountIPPanel, updateIPPanel, isIPAllowed: () => _ipAllowed };
    })();

    // ============================================================
    //  🔧 開關控制 + 名稱功能
    // ============================================================
    function applyFeature(k, en) {
        if (k === 'bossPinAlive') { if (en) bossFeature.tryStart(); else bossFeature.disable(); }
        if (k === 'bagSearch') { if (en) bagFeature.tryStart(); else bagFeature.disable(); }
        if (k === 'tradeMoneySearch') { if (en) tradeMoneyFeature.tryStart(); else tradeMoneyFeature.disable(); }
        if (k === 'nameChange') { nameFeature(en); }
        if (k === 'autoFarm') { if (!en) autoFarmFeature.stop(); }
    }
    function initFeatures() { const s = loadSettings(); SETTINGS_DEF.forEach(d => applyFeature(d.key, s[d.key])); }

    // ── 名稱功能 ──
    function nameFeature(en) {
        if (en) {
            applyCustomName();
            if (!window._lh5_nameWatcher) {
                window._lh5_nameWatcher = setInterval(() => {
                    if (!loadSettings().nameChange) return;
                    applyCustomName();
                }, 600);
            }
        } else {
            if (window._lh5_nameWatcher) {
                clearInterval(window._lh5_nameWatcher);
                window._lh5_nameWatcher = null;
            }
        }
    }
    function applyCustomName() {
        const v = localStorage.getItem(NAME_KEY);
        if (!v) return;
        const el = document.getElementById('t-name');
        if (el && el.textContent !== v) el.textContent = v;
    }

    // ============================================================
    //  😍 好友按鈕 + Modal
    // ============================================================
    const FRIEND_STORAGE_KEY = 'lh5_friends';

    function getFriends() {
        try { const r = localStorage.getItem(FRIEND_STORAGE_KEY); return r ? JSON.parse(r) : []; } catch(_) { return []; }
    }
    function saveFriends(list) { localStorage.setItem(FRIEND_STORAGE_KEY, JSON.stringify(list)); }

    const friendBtn = document.createElement('div');
    friendBtn.id = 'lh5-friend-btn'; friendBtn.textContent = '😍'; friendBtn.title = '好友管理';

    const friendOverlay = document.createElement('div'); friendOverlay.id = 'lh5-friend-overlay';
    friendOverlay.innerHTML = `
        <div id="lh5-friend-modal">
            <h2><span>😍 好友清單</span><span style="font-size:11px;color:#666;cursor:pointer" id="lh5-friend-close">✕ 關閉</span></h2>
            <div id="lh5-friend-input-row" class="lh5-friend-input-row">
                <input id="lh5-friend-add-input" type="text" placeholder="輸入玩家名稱…" maxlength="24">
                <button id="lh5-friend-add-btn">新增</button>
            </div>
            <input id="lh5-friend-search" type="text" placeholder="🔍 搜尋好友…">
            <div id="lh5-friend-list"></div>
            <div class="lh5-friend-count" id="lh5-friend-count"></div>
            <div style="display:flex;align-items:center;gap:6px;margin:8px 0;padding:8px;background:#12121e;border-radius:6px">
                <span style="font-size:12px;color:#8a8aff">🎯 測試選角</span>
                <select id="lh5-sct-slot" style="flex:1;background:#0d0d18;border:1px solid #333;border-radius:4px;padding:4px 6px;color:#e0d5c1;font-size:12px;outline:none;cursor:pointer">
                    <option value="0">0</option>
                    <option value="1">1</option>
                    <option value="2">2</option>
                </select>
                <button id="lh5-sct-send" style="padding:4px 10px;border:none;border-radius:4px;background:#5858d0;color:#fff;font-size:12px;cursor:pointer;font-weight:bold;flex-shrink:0">發送</button>
            </div>
            <div class="lh5-friend-toolbar">
                <button id="lh5-friend-export">📤 匯出 JSON</button>
                <button id="lh5-friend-import">📥 匯入 JSON</button>
            </div>
            <input id="lh5-friend-file-input" type="file" accept=".json" style="display:none">
        </div>
    `;
    document.body.appendChild(friendOverlay);

    friendBtn.addEventListener('click', () => { renderFriendList(); friendOverlay.classList.add('open'); });
    friendOverlay.addEventListener('click', e => {
        if (e.target === friendOverlay || e.target.id === 'lh5-friend-close') friendOverlay.classList.remove('open');
    });

    // 🎯 selectChar 發送按鈕（好友 modal 內）— 用委派監聽，不怕 SPA 重建
    friendOverlay.addEventListener('click', e => {
        if (e.target.id === 'lh5-sct-send') {
            const slot = parseInt(document.getElementById('lh5-sct-slot')?.value || '0', 10);
            try {
                if (typeof socket !== 'undefined' && socket && typeof socket.emit === 'function') {
                    console.log('[LH5] 📤 selectChar emit -> slot:', slot);
                    socket.emit('selectChar', slot);
                } else {
                    console.warn('[LH5] ❌ socket not available');
                }
            } catch(e) {
                console.error('[LH5] ❌ selectChar error:', e);
            }
        }
    });

    function renderFriendList() {
        const list = getFriends();
        const searchVal = (document.getElementById('lh5-friend-search')?.value || '').trim().toLowerCase();
        let html = '';
        let visible = 0;
        list.forEach((f, i) => {
            if (searchVal && !f.name.toLowerCase().includes(searchVal)) return;
            visible++;
            html += `<div class="lh5-friend-item">
                <span class="cu cu-link" data-name="${f.name.replace(/</g,'&lt;').replace(/>/g,'&gt;')}">${f.name.replace(/</g,'&lt;').replace(/>/g,'&gt;')}</span>
                <button class="lh5-friend-del" data-idx="${i}">刪除</button>
            </div>`;
        });
        const listEl = document.getElementById('lh5-friend-list');
        listEl.innerHTML = html || '<div style="text-align:center;color:#666;padding:20px;font-size:13px">暫無好友</div>';

        // 點好友名稱 → 查看玩家資料（與遊戲聊天室/排行榜行為一致）
        listEl.querySelectorAll('.cu-link[data-name]').forEach(el => {
            el.onclick = () => {
                const name = el.dataset.name;
                // 遊戲透過 socket.emit('viewPlayer', name) 彈出玩家資訊
                if (typeof socket !== 'undefined' && socket && typeof socket.emit === 'function') {
                    socket.emit('viewPlayer', name);
                }
            };
        });
        document.getElementById('lh5-friend-count').textContent = visible > 0 ? `顯示 ${visible} / ${list.length} 人` : `共 ${list.length} 人`;

        // 刪除事件
        listEl.querySelectorAll('.lh5-friend-del').forEach(btn => {
            btn.addEventListener('click', () => {
                const idx = parseInt(btn.dataset.idx, 10);
                const l = getFriends();
                if (idx >= 0 && idx < l.length) {
                    l.splice(idx, 1);
                    saveFriends(l);
                    renderFriendList();
                }
            });
        });
    }

    // 輸入搜尋
    document.addEventListener('input', e => {
        if (e.target.id === 'lh5-friend-search') renderFriendList();
    });

    // 新增好友
    document.addEventListener('click', e => {
        if (e.target.id === 'lh5-friend-add-btn') {
            const inp = document.getElementById('lh5-friend-add-input');
            const name = inp?.value?.trim();
            if (!name) return;
            const l = getFriends();
            if (l.some(f => f.name === name)) { inp.value = ''; return; }
            l.push({ name, addedAt: Date.now() });
            saveFriends(l);
            inp.value = '';
            renderFriendList();
        }
    });

    // Enter 新增
    document.addEventListener('keydown', e => {
        if (e.key === 'Enter' && e.target.id === 'lh5-friend-add-input') {
            document.getElementById('lh5-friend-add-btn')?.click();
        }
    });

    // 匯出 JSON
    document.addEventListener('click', e => {
        if (e.target.id === 'lh5-friend-export') {
            const data = JSON.stringify(getFriends(), null, 2);
            const blob = new Blob([data], { type: 'application/json' });
            const a = document.createElement('a');
            a.href = URL.createObjectURL(blob);
            const now = new Date();
            a.download = `好友清單_${now.getFullYear()}${String(now.getMonth()+1).padStart(2,'0')}${String(now.getDate()).padStart(2,'0')}.json`;
            a.click();
            URL.revokeObjectURL(a.href);
        }
    });

    // 匯入 JSON
    document.addEventListener('click', e => {
        if (e.target.id === 'lh5-friend-import') {
            document.getElementById('lh5-friend-file-input')?.click();
        }
    });
    document.addEventListener('change', e => {
        if (e.target.id === 'lh5-friend-file-input' && e.target.files?.[0]) {
            const reader = new FileReader();
            reader.onload = ev => {
                try {
                    const arr = JSON.parse(ev.target.result);
                    if (!Array.isArray(arr)) throw new Error('非陣列');
                    const clean = arr.filter(x => x && typeof x.name === 'string' && x.name.trim());
                    const existing = getFriends();
                    const names = new Set(existing.map(f => f.name));
                    clean.forEach(f => { if (!names.has(f.name)) { names.add(f.name); existing.push({ name: f.name, addedAt: f.addedAt || Date.now() }); } });
                    saveFriends(existing);
                    renderFriendList();
                } catch(_) { alert('JSON 格式錯誤，請確認為 [{name:"..."}] 陣列'); }
            };
            reader.readAsText(e.target.files[0]);
            e.target.value = '';
        }
    });

    // ============================================================
    //  🛎️ 斷線重連自動處理（每60秒檢查）
    // ============================================================
    function _clickEl(el) {
        if (!el) return;
        if (typeof el.click === 'function') el.click();
        try { el.dispatchEvent(new MouseEvent('click', { bubbles: true })); } catch(_){}
        try { el.dispatchEvent(new MouseEvent('mousedown', { bubbles: true })); } catch(_){}
        try { el.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true })); } catch(_){}
    }

    let _afkCountdown = 0;
    function startAfkCheck() {
        // 倒數 UI 每秒更新（共用 _afkCountdown，兩個畫面不同時出現）
        setInterval(() => {
            // 登入頁倒數
            const loginBtn = document.getElementById('btn-login');
            if (loginBtn && !loginBtn.classList.contains('hidden') && loginBtn.offsetParent !== null) {
                let cd = loginBtn.parentNode.querySelector('.lh5-login-cd');
                if (!cd) { cd = document.createElement('span'); cd.className = 'lh5-login-cd'; cd.style.cssText = 'color:#ff6b6b;font-size:13px;margin-left:8px;font-weight:bold'; loginBtn.parentNode.insertBefore(cd, loginBtn.nextSibling); }
                // 黑名單 → 不自動登入，停止倒數顯示
                if (!autoFarmFeature.isIPAllowed()) {
                    cd.textContent = '（IP黑名單，已停用自動登入）';
                    cd.style.color = '#e04040';
                } else {
                    cd.textContent = `（${_afkCountdown}s 後自動登入）`;
                    cd.style.color = '#ff6b6b';
                }
            } else {
                const old = document.querySelector('.lh5-login-cd');
                if (old) old.remove();
            }
            // IP 面板掛載（登入頁顯示）
            const lb2 = document.getElementById('btn-login');
            if (lb2 && !lb2.classList.contains('hidden') && lb2.offsetParent !== null) {
                autoFarmFeature.mountIPPanel();
                autoFarmFeature.updateIPPanel();
                // 黑名單 → 登入按鈕反灰（禁用自動登入視覺提示）
                if (!autoFarmFeature.isIPAllowed()) {
                    lb2.style.filter = 'grayscale(100%) brightness(0.7)';
                    lb2.style.opacity = '0.5';
                    lb2.style.cursor = 'not-allowed';
                    lb2.title = 'IP 在黑名單，自動登入已停用';
                } else {
                    lb2.style.filter = '';
                    lb2.style.opacity = '';
                    lb2.style.cursor = '';
                    lb2.title = '';
                }
            } else {
                const ipPanel = document.getElementById('lh5-ip-panel');
                if (ipPanel) ipPanel.remove();
                // 登入頁離開時還原按鈕樣式
                const lb3 = document.getElementById('btn-login');
                if (lb3) { lb3.style.filter = ''; lb3.style.opacity = ''; lb3.style.cursor = ''; lb3.title = ''; }
            }
            // 選角頁倒數
            const h2 = document.querySelector('h2');
            const h2txt = h2 ? h2.textContent.trim() : '';
            if (h2 && h2txt.startsWith('選 擇 角 色')) {
                let cd = h2.querySelector('.lh5-afk-cd');
                if (!cd) { cd = document.createElement('span'); cd.className = 'lh5-afk-cd'; cd.style.cssText = 'color:#ff6b6b;font-size:16px;margin-left:10px;font-weight:bold'; h2.appendChild(cd); }
                cd.textContent = `(${_afkCountdown}s 後自動點擊)`;
                _afkCountdown = (_afkCountdown + 59) % 60;
            } else if (!loginBtn || loginBtn.classList.contains('hidden') || loginBtn.offsetParent === null) {
                _afkCountdown = 0;
                const old = document.querySelector('.lh5-afk-cd');
                if (old) old.remove();
            }
        }, 1000);


        // 實際動作每60秒一次
        setInterval(() => {
            // 1. AFK 畫面按「收下」
            const btn = document.getElementById('afk-ok');
            if (btn && btn.offsetParent !== null) { btn.click(); return; }
            // 2. 登入按鈕
            const loginBtn = document.getElementById('btn-login');
            if (loginBtn && !loginBtn.classList.contains('hidden') && loginBtn.offsetParent !== null) {
                if (!autoFarmFeature.isIPAllowed()) {
                    // IP 黑名單 → 不自動登入
                    const cd = loginBtn.parentNode.querySelector('.lh5-login-cd');
                    if (cd) cd.textContent = '（IP黑名單，已停用自動登入）';
                    return;
                }
                _clickEl(loginBtn);
            }
            // 3. 選擇角色畫面
            const h2 = document.querySelector('h2');
            const h2txt2 = h2 ? h2.textContent.trim() : '';
            if (h2 && h2txt2.startsWith('選 擇 角 色')) {
                const slots = document.getElementById('slots');
                if (slots) {
                    const charSlots = slots.querySelectorAll(':scope > .char-slot');
                    const slotIdx = parseInt(localStorage.getItem('lh5_farm_slot'), 10) || 0;
                    if (charSlots.length > slotIdx) {
                        const target = charSlots[slotIdx];
                        if (target && !target.querySelector('.empty')) {
                            _clickEl(target);
                        }
                    }
                }
            }
        }, 60000);
    }

    const bossCountdownEl = document.createElement('span');
    bossCountdownEl.id = 'lh5-boss-countdown';

    // ============================================================
    //  🔄 戰鬥面板自動送 bossAction（每個 bcell card 加上 toggle）
    // ============================================================
    const BA_KEY = 'lh5_boss_auto';
    let _bossAutoTimer = null;

    function getBossAutoSettings() {
        try {
            const raw = localStorage.getItem(BA_KEY);
            return raw ? JSON.parse(raw) : {};
        } catch (_) { return {}; }
    }

    function setBossAutoSetting(act, on) {
        const s = getBossAutoSettings();
        if (on) s[act] = true;
        else delete s[act];
        localStorage.setItem(BA_KEY, JSON.stringify(s));
    }

    function injectBossAutoToggles() {
        // bcell 版
        document.querySelectorAll('.bcell').forEach(el => {
            if (el.querySelector('.lh5-ba-toggle')) return;
            const act = el.dataset.act;
            if (!act) return;
            const settings = getBossAutoSettings();
            const checked = settings[act] || false;
            const toggle = document.createElement('span');
            toggle.className = 'lh5-ba-toggle' + (checked ? ' on' : '');
            toggle.textContent = checked ? '▶' : '■';
            toggle.title = checked ? '自動送出中' : '點擊開啟自動';
            toggle.style.cssText = 'position:absolute;top:4px;left:10px;width:22px;height:18px;font-size:10px;cursor:pointer;z-index:5;user-select:none;line-height:1;display:flex;align-items:center;justify-content:center;border-radius:4px;font-weight:bold;transition:background .2s,color .2s' + (checked ? ';background:#16a34a;color:#fff' : ';background:#dc2626;color:#fff');
            toggle.addEventListener('click', e => {
                e.stopPropagation();
                const nowOn = !toggle.classList.contains('on');
                toggle.classList.toggle('on', nowOn);
                toggle.textContent = nowOn ? '▶' : '■';
                toggle.title = nowOn ? '自動送出中' : '點擊開啟自動';
                toggle.style.border = '';
                if (nowOn) { toggle.style.background = '#16a34a'; toggle.style.color = '#fff'; }
                else { toggle.style.background = '#dc2626'; toggle.style.color = '#fff'; }
                setBossAutoSetting(act, nowOn);
            });
            el.style.position = 'relative';
            el.appendChild(toggle);
        });
        // slot 版（新 UI）
        document.querySelectorAll('.slot[data-k]').forEach(el => {
            if (el.querySelector('.lh5-ba-toggle')) return;
            let k = el.dataset.k.trim();
            // data-k="　"（空白）= heal
            if (!k || k === 'heal') k = 'heal';
            const settings = getBossAutoSettings();
            const checked = settings[k] || false;
            const toggle = document.createElement('span');
            toggle.className = 'lh5-ba-toggle' + (checked ? ' on' : '');
            toggle.textContent = checked ? '▶' : '■';
            toggle.title = checked ? '自動送出中' : '點擊開啟自動';
            toggle.style.cssText = 'position:absolute;top:4px;left:10px;width:22px;height:18px;font-size:10px;cursor:pointer;z-index:5;user-select:none;line-height:1;display:flex;align-items:center;justify-content:center;border-radius:4px;font-weight:bold;transition:background .2s,color .2s' + (checked ? ';background:#16a34a;color:#fff' : ';background:#dc2626;color:#fff');
            toggle.addEventListener('click', e => {
                e.stopPropagation();
                const nowOn = !toggle.classList.contains('on');
                toggle.classList.toggle('on', nowOn);
                toggle.textContent = nowOn ? '▶' : '■';
                toggle.title = nowOn ? '自動送出中' : '點擊開啟自動';
                if (nowOn) { toggle.style.background = '#16a34a'; toggle.style.color = '#fff'; }
                else { toggle.style.background = '#dc2626'; toggle.style.color = '#fff'; }
                setBossAutoSetting(k, nowOn);
            });
            el.style.position = 'relative';
            el.appendChild(toggle);
        });
    }

    function bossAutoTick() {
        const settings = getBossAutoSettings();
        const acts = Object.keys(settings);
        if (!acts.length) return;

        // 檢查是否在戰鬥中
        if (typeof lastState === 'undefined' || !lastState) return;
        if (lastState.mode !== 'bosscombat' && lastState.mode !== 'combat') return;

        const boss = lastState.boss || {};
        const cd = boss.cd || {};

        acts.forEach(k => {
            if (!settings[k]) return;

            // slot key → 讀取 select 的值作為實際 action
            let act = k;
            const slot = document.querySelector(`.slot[data-k="${k}"], .slot[data-k=" ${k}"]`);
            if (slot) {
                const sel = slot.querySelector('select');
                if (sel) {
                    const v = sel.value.trim();
                    if (!v) return;
                    act = v;
                }
            }

            // 檢查 cd
            const cdSec = cd[act];
            if (cdSec && cdSec > 0.1) return;

            // 檢查 bcell 是否 dis
            const cell = document.getElementById('bcell-' + act);
            if (cell && cell.classList.contains('dis')) return;

            // 送封包
            if (typeof socket !== 'undefined' && socket && typeof socket.emit === 'function') {
                socket.emit('bossAction', act);
            }
        });
    }

    function startBossAuto() {
        // 每 600ms 注入 toggle（DOM 重建時補上）
        setInterval(() => {
            if (!document.querySelector('.bcell') && !document.querySelector('.slot[data-k]')) return;
            injectBossAutoToggles();
        }, 800);

        // 每 300ms 檢查並送封包
        _bossAutoTimer = setInterval(bossAutoTick, 300);
    }

    function startBossCountdown() {
        setInterval(() => {
            const now = new Date();
            const m = now.getMinutes();
            const s = now.getSeconds();
            if (m === 59) {
                const secsLeft = 59 - s;
                bossCountdownEl.textContent = secsLeft + 's';
                bossCountdownEl.style.display = 'inline';
                if (secsLeft <= 10) bossCountdownEl.style.color = '#ff0000';
                else bossCountdownEl.style.color = '#ff3333';
            } else {
                bossCountdownEl.style.display = 'none';
            }
        }, 1000);
    }

    function mountFriendBtn() {
        const tb = document.getElementById('topbar'); if (!tb) { setTimeout(mountFriendBtn, 300); return; }
        const nameEl = document.getElementById('t-name');
        if (!nameEl) { setTimeout(mountFriendBtn, 300); return; }
        if (nameEl.parentNode.querySelector('#lh5-friend-btn')) return;
        nameEl.after(friendBtn);
        if (!document.getElementById('lh5-boss-countdown')) {
            friendBtn.after(bossCountdownEl);
        }
    }

    // ============================================================
    //  🎯 selectChar 測試按鈕（浮動下拉 0/1/2）
    // ============================================================
    function createSelectCharTestEl() {
        const el = document.createElement('span');
        el.id = 'lh5-selectchar-test';
        el.innerHTML = '<select class="lh5-sct-slot"><option value="0">0</option><option value="1">1</option><option value="2">2</option></select><span class="sct-btn lh5-sct-send">🎯</span>';
        el.title = '測試 selectChar (slot 0/1/2)';
        el.querySelector('.lh5-sct-send').addEventListener('click', function() {
            const slot = parseInt(el.querySelector('.lh5-sct-slot')?.value || '0', 10);
            try {
                if (typeof socket !== 'undefined' && socket && typeof socket.emit === 'function') {
                    socket.emit('selectChar', slot);
                    console.log('[LH5] selectChar sent, slot:', slot);
                } else {
                    console.warn('[LH5] socket not available');
                }
            } catch(e) {
                console.error('[LH5] selectChar error:', e);
            }
        });
        return el;
    }

    const selectCharTest = createSelectCharTestEl();

    function mountSelectCharTest() {
        const cs = document.getElementById('charselect');
        if (!cs || cs.querySelector('#lh5-selectchar-test')) { setTimeout(mountSelectCharTest, 500); return; }
        const el = createSelectCharTestEl();
        el.style.cssText = 'display:inline-flex;align-items:center;gap:4px;margin:0 auto 10px;padding:4px 12px;background:rgba(60,60,180,0.15);border-radius:6px;width:fit-content';
        const h2 = cs.querySelector('h2');
        if (h2) { h2.after(el); }
        // 持續監聽 #charselect 的 class 變化（screen/hidden 切換時可能被砍掉重建）
        if (!window._lh5_sct_obs) {
            const obs = new MutationObserver(() => {
                const cs2 = document.getElementById('charselect');
                if (cs2 && !cs2.querySelector('#lh5-selectchar-test')) {
                    const e2 = createSelectCharTestEl();
                    e2.style.cssText = el.style.cssText;
                    const h = cs2.querySelector('h2');
                    if (h) h.after(e2);
                }
            });
            obs.observe(document.getElementById('app') || document.body, { childList: true, subtree: true });
            window._lh5_sct_obs = obs;
        }
    }

    // ============================================================
    //  🎰 世界王抽抽樂：自動抽 + 歷史紀錄
    // ============================================================
    const GACHA_HISTORY_KEY = 'lh5_gacha_history';

    function getGachaHistory() {
        try { return JSON.parse(localStorage.getItem(GACHA_HISTORY_KEY) || '[]'); } catch(_) { return []; }
    }
    function addGachaHistory(itemHtml) {
        const h = getGachaHistory();
        h.unshift({ item: itemHtml, time: new Date().toLocaleTimeString() });
        if (h.length > 200) h.length = 200;
        localStorage.setItem(GACHA_HISTORY_KEY, JSON.stringify(h));
    }
    function clearGachaHistory() { localStorage.removeItem(GACHA_HISTORY_KEY); }

    // 🎰 黑市 header 右邊的 switch
    function injectGachaSwitch() {
        const hd = document.querySelector('.shop-hd');
        if (!hd) return;
        if (document.getElementById('lh5-gacha-switch')) return;

        const wrap = document.createElement('span');
        wrap.id = 'lh5-gacha-switch';
        wrap.style.cssText = 'display:inline-flex;align-items:center;gap:4px;margin-left:8px;flex-shrink:0;font-size:12px;color:#888;cursor:pointer;user-select:none';
        wrap.title = '自動抽抽樂（每 3 秒）';

        const label = document.createElement('span');
        label.textContent = '🎰';

        const toggle = document.createElement('span');
        toggle.style.cssText = 'display:inline-block;width:28px;height:14px;border-radius:7px;background:#444;position:relative;transition:background .2s';
        const dot = document.createElement('span');
        dot.style.cssText = 'display:inline-block;width:10px;height:10px;border-radius:50%;background:#ccc;position:absolute;top:2px;left:2px;transition:transform .2s,background .2s';
        toggle.appendChild(dot);

        let running = false;
        function updateUI() {
            if (running) {
                toggle.style.background = '#22c55e';
                dot.style.transform = 'translateX(14px)';
                dot.style.background = '#fff';
                label.textContent = '🔄';
            } else {
                toggle.style.background = '#444';
                dot.style.transform = 'none';
                dot.style.background = '#ccc';
                label.textContent = '🎰';
            }
        }

        wrap.appendChild(label);
        wrap.appendChild(toggle);
        hd.appendChild(wrap);

        wrap.addEventListener('click', () => {
            running = !running;
            updateUI();
            if (running) gachaAutoStart(); else gachaAutoStop();
        });
    }

    // 🔁 自動抽：每 3 秒直接送 socket wbGacha
    function gachaAutoTick() {
        try {
            const w = typeof unsafeWindow !== 'undefined' ? unsafeWindow : window;
            if (w.__wbEmit) {
                w.__wbEmit('wbGacha', []);
            } else if (w.socket && typeof w.socket.emit === 'function') {
                w.socket.emit('wbGacha', []);
            } else if (typeof socket !== 'undefined' && socket && typeof socket.emit === 'function') {
                socket.emit('wbGacha', []);
            }
        } catch(_) {}

        // 延遲抓取結果
        setTimeout(() => {
            const msg = document.getElementById('gacha-msg');
            if (!msg) return;
            const txt = msg.textContent.trim();
            if (!txt || !txt.includes('恭喜獲得')) return;
            const itemSpan = msg.querySelector('span');
            const itemHtml = itemSpan ? itemSpan.outerHTML : txt;
            addGachaHistory(itemHtml);
        }, 200);
    }

    let _gachaTimer = null;
    function gachaAutoStart() {
        if (_gachaTimer) return;
        gachaAutoTick(); // 立刻一次
        _gachaTimer = setInterval(gachaAutoTick, 3000);
    }
    function gachaAutoStop() {
        if (_gachaTimer) { clearInterval(_gachaTimer); _gachaTimer = null; }
    }

    // 📜 歷史紀錄 Modal（跟原本一樣）
    function showGachaHistory() {
        const existing = document.getElementById('lh5-gacha-hist-overlay');
        if (existing) existing.remove();

        const overlay = document.createElement('div');
        overlay.id = 'lh5-gacha-hist-overlay';
        overlay.style.cssText = 'position:fixed;inset:0;z-index:999998;background:rgba(0,0,0,0.6);display:flex;align-items:center;justify-content:center;backdrop-filter:blur(2px)';

        const modal = document.createElement('div');
        modal.style.cssText = 'background:#1a1a2e;border:1px solid #f5c451;border-radius:12px;padding:20px 24px;min-width:320px;max-width:420px;max-height:80vh;overflow-y:auto;box-shadow:0 8px 40px rgba(0,0,0,0.6);color:#e0d5c1;font-size:14px';

        const h = getGachaHistory();

        modal.innerHTML = `
            <h2 style="margin:0 0 12px;font-size:17px;color:#f5c451;border-bottom:1px solid #333;padding-bottom:8px;display:flex;justify-content:space-between;align-items:center">
                <span>🎰 抽抽樂歷史 ($(h.length))</span>
                <span style="font-size:12px;color:#888;cursor:pointer" id="lh5-gacha-clear">清除全部</span>
            </h2>
            <div style="font-size:12px;color:#666;margin-bottom:8px">點空白關閉</div>
            $(h.length === 0 ? '<div style="color:#888;padding:20px;text-align:center">尚無紀錄</div>' :
                h.map((r, i) => '<div style="padding:4px 0;border-bottom:1px solid #1a1a2e;font-size:13px;display:flex;justify-content:space-between"><span>' + r.item + '</span><span style="color:#666;font-size:11px;flex-shrink:0;margin-left:8px">' + r.time + '</span></div>').join('')
            }
        `;

        overlay.appendChild(modal);
        document.body.appendChild(overlay);

        overlay.addEventListener('click', e => {
            if (e.target === overlay) overlay.remove();
        });

        const clearBtn = document.getElementById('lh5-gacha-clear');
        if (clearBtn) {
            clearBtn.addEventListener('click', () => {
                clearGachaHistory();
                showGachaHistory();
            });
        }
    }

    // 📜 按鈕注入（在 #gacha-wb 下方）
    function injectGachaButtons() {
        const gachaBtn = document.getElementById('gacha-wb');
        if (!gachaBtn) return;
        if (document.getElementById('lh5-gacha-hist-btn')) return;

        const histBtn = document.createElement('button');
        histBtn.id = 'lh5-gacha-hist-btn';
        histBtn.className = 'btn-dark';
        histBtn.textContent = '📜 歷史紀錄';
        histBtn.style.cssText = 'margin-top:8px;width:100%;padding:10px;border-color:#888;color:#ccc;font-size:13px';
        histBtn.addEventListener('click', showGachaHistory);
        gachaBtn.parentNode.insertBefore(histBtn, gachaBtn.nextSibling);
    }

    function gachaFeaturesStart() {
        setInterval(() => {
            if (!document.querySelector('.shop-hd')) return;
            injectGachaSwitch();
            if (document.getElementById('gacha-wb')) injectGachaButtons();
        }, 1000);
    }

    // ============================================================
    //  ⚙ 齒輪掛載（topbar gold-box 右邊）
    // ============================================================
    function mountGear() {
        const tb = document.getElementById('topbar'); if (!tb) { setTimeout(mountGear, 300); return; }
        const gb = tb.querySelector('.gold-box');
        if (gb) {
            if (!gb.parentNode.querySelector('#lh5-settings-btn')) gb.after(gearBtn);
            // 掛載 theme-btn（配置 + IP 倒數）
            if (!gb.parentNode.querySelector('#theme-btn')) {
                const themeBtn = document.createElement('button');
                themeBtn.id = 'theme-btn';
                themeBtn.textContent = '配置';
                themeBtn.style.cssText = 'margin-left:6px;padding:4px 10px;background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.15);border-radius:6px;color:#c8a96e;font-size:12px;cursor:pointer;font-family:inherit;';
                themeBtn.addEventListener('click', () => { renderSettings(); overlay.classList.add('open'); });
                gb.after(themeBtn);
            }
        }
        else {
            if (!tb.querySelector('#lh5-settings-btn')) tb.appendChild(gearBtn);
            if (!tb.querySelector('#theme-btn')) {
                const themeBtn = document.createElement('button');
                themeBtn.id = 'theme-btn';
                themeBtn.textContent = '配置';
                themeBtn.style.cssText = 'margin-left:6px;padding:4px 10px;background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.15);border-radius:6px;color:#c8a96e;font-size:12px;cursor:pointer;font-family:inherit;';
                themeBtn.addEventListener('click', () => { renderSettings(); overlay.classList.add('open'); });
                tb.appendChild(themeBtn);
            }
        }
    }

    // ============================================================
    //  🔌 Socket 日誌攔截（在主控台印出 emit / on）
    // ============================================================
    let _lh5SockPatched = false;
    function interceptSocketLog() {
        if (_lh5SockPatched) return;
        const check = setInterval(() => {
            if (typeof socket === 'undefined' || !socket || typeof socket.emit !== 'function') return;
            clearInterval(check);
            if (_lh5SockPatched) return;
            _lh5SockPatched = true;

            console.log('[LH5] socket.io 版本:', socket.io?.engine?.transport?.name || socket.transport?.name || '未知');

            // socket.onAny (socket.io v3+)
            if (typeof socket.onAny === 'function') {
                socket.onAny((ev, ...args) => {
                    const len = args.length;
                    console.log('[LH5] 📥 onAny:', ev, len === 0 ? '' : (len === 1 ? args[0] : args));
                });
                console.log('[LH5] ✅ onAny 攔截啟動');
            }

            // onevent (socket.io v2 fallback)
            const origOnevent = socket.onevent?.bind(socket);
            if (origOnevent) {
                socket.onevent = function(packet) {
                    if (packet && packet.data && packet.data.length >= 1) {
                        console.log('[LH5] 📥 pack:', packet.data[0], packet.data.length > 1 ? packet.data.slice(1) : '');
                    }
                    return origOnevent(packet);
                };
                console.log('[LH5] ✅ onevent 攔截啟動');
            } else {
                // 連 onevent 都沒有，直接攔截 _callbacks
                console.log('[LH5] ⚠️ 無 onevent, 改用 _callbacks 攔截');
                const origCallbacks = socket._callbacks;
                if (origCallbacks) {
                    for (const key of Object.keys(origCallbacks)) {
                        const ev = key.replace(/^\$/, '');
                        const fns = origCallbacks[key];
                        if (Array.isArray(fns)) {
                            origCallbacks[key] = fns.map(fn => {
                                const wrapped = function() {
                                    const args = Array.from(arguments);
                                    console.log('[LH5] 📥 cb:', ev, args.length === 0 ? '' : (args.length === 1 ? args[0] : args));
                                    return fn.apply(this, arguments);
                                };
                                return wrapped;
                            });
                        }
                    }
                }
            }

            // emit 攔截
            const origEmit = socket.emit.bind(socket);
            socket.emit = function(ev, data, cb) {
                console.log('[LH5] 📤 emit:', ev, data !== undefined ? data : '');
                return origEmit(ev, data, cb);
            };

            // lastState 輪詢（每 500ms 更新怪物血條）
            setInterval(() => {
                if (typeof lastState === 'undefined' || !lastState) return;
                const ls = lastState;
                const summary = [];
                const c = ls.char || {};
                if (c.hp !== undefined && c.maxHp !== undefined) summary.push('HP:' + c.hp + '/' + c.maxHp);
                if (c.mp !== undefined && c.maxMp !== undefined) summary.push('MP:' + c.mp + '/' + c.maxMp);
                if (ls.monsters && Array.isArray(ls.monsters)) summary.push('怪:' + ls.monsters.length + '隻');
                if (ls.players && Array.isArray(ls.players)) summary.push('玩家:' + ls.players.length + '人');
                if (c.gold !== undefined) summary.push('金幣:' + c.gold);
                if (c.exp !== undefined) summary.push('經驗:' + c.exp);
                if (ls.party && Array.isArray(ls.party)) summary.push('組隊:' + ls.party.length + '人');
                console.log('[LH5] 📊 lastState:', summary.join(' | '), summary.length ? '' : '(無遊戲狀態)');

                // 怪物即時血條 — 先清空空槽的血條/圖示，再更新有資料的
                // 先處理空槽（怪物死亡變成 null）
                for (let i = 0; i < 3; i++) {
                    const slot = document.getElementById('mslot-' + i);
                    if (!slot) continue;
                    const m = ls.monsters && ls.monsters.length > i ? ls.monsters[i] : null;
                    if (!m) {
                        // 空槽 → 清掉血條
                        const wrap = slot.querySelector('.lh5-mhp-wrap');
                        if (wrap) wrap.remove();
                        continue;
                    }
                    if (m.hp === undefined) continue;
                    // 建立血條
                    let wrap = slot.querySelector('.lh5-mhp-wrap');
                    if (!wrap) {
                        wrap = document.createElement('div');
                        wrap.className = 'lh5-mhp-wrap';
                        const bar = document.createElement('div');
                        bar.className = 'lh5-mhp-bar';
                        wrap.appendChild(bar);
                        const txt = document.createElement('div');
                        txt.className = 'lh5-mhp-text';
                        wrap.appendChild(txt);
                        slot.appendChild(wrap);
                    }
                    // 存名稱
                    if (m.n != null) wrap.dataset.mname = m.n;
                    const mn = wrap.dataset.mname || '??';
                    if (m.hp <= 0) {
                        // 死亡 → 清空
                        wrap.querySelector('.lh5-mhp-text').textContent = '';
                        wrap.querySelector('.lh5-mhp-bar').style.width = '0%';
                        const img = slot.querySelector('img');
                        if (img) { img.src = ''; img.removeAttribute('data-src'); }
                    } else {
                        const pct = m.maxHp > 0 ? Math.round((m.hp / m.maxHp) * 100) : 0;
                        wrap.querySelector('.lh5-mhp-bar').style.width = pct + '%';
                        wrap.querySelector('.lh5-mhp-text').innerHTML = mn + '<br>' + m.hp + '/' + m.maxHp;
                        const barEl = wrap.querySelector('.lh5-mhp-bar');
                        if (pct > 60) barEl.style.background = 'linear-gradient(90deg,#27ae60,#2ecc71)';
                        else if (pct > 30) barEl.style.background = 'linear-gradient(90deg,#f39c12,#f1c40f)';
                        else barEl.style.background = 'linear-gradient(90deg,#e74c3c,#ff6b6b)';
                    }
                }
            }, 500);

            console.log('[LH5] ✅ 全部攔截已啟動');
        }, 500);
    }

    // ============================================================
    //  🏁 初始化
    // ============================================================
    interceptSocketLog();
    mountGear();
    mountFriendBtn();
    mountSelectCharTest();
    startBossCountdown();
    startAfkCheck();
    gachaFeaturesStart();
    initFeatures();
    startBossAuto();
    autoFarmFeature.startIPCheck(); // 啟動 IP 偵測（腳本開始時）

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

            // 確認齒輪
            if (!document.getElementById('lh5-settings-btn')) mountGear();
            if (!document.getElementById('lh5-friend-btn')) { mountFriendBtn(); if (!document.getElementById('lh5-boss-countdown') && friendBtn.nextSibling) { friendBtn.after(bossCountdownEl); } }
            if (!document.getElementById('lh5-selectchar-test')) mountSelectCharTest();

            // 重啟功能
    const s = loadSettings();
            if (s.bossPinAlive) { bossFeature.disable(); bossFeature.tryStart(); }
            if (s.bagSearch) { bagFeature.disable(); bagFeature.tryStart(); }
            if (s.tradeMoneySearch) { tradeMoneyFeature.disable(); tradeMoneyFeature.tryStart(); }
            // autoFarm：根據自動執行設定決定是否重啟
            const autoRunEnabled = localStorage.getItem(FARM_AUTO_RUN_KEY) !== '0';
            const farmUiOpen = localStorage.getItem('lh5_farm_ui_open') !== '0';
            if ((s.autoFarm || farmUiOpen) && (autoFarmFeature.isRunning() || autoRunEnabled)) {
                autoFarmFeature.stop();
                autoFarmFeature.runWithConfig();
            } else if (autoFarmFeature.isRunning()) {
                // 開關關了但還在跑→停掉
                autoFarmFeature.stop();
            }
            // 🎰 抽抽樂 switch 注入
            injectGachaSwitch();
            injectGachaButtons();

        }

        // 交易所金錢搜尋：檢查是否需要重新注入
        if (document.getElementById('trade-search') && !document.getElementById('lh5-trade-money')) {
            const s2 = loadSettings();
            if (s2.tradeMoneySearch) tradeMoneyFeature.tryStart();
        }

    }, 400);

    // ============================================================
    //  📋 回大廳歷史清單 Modal
    // ============================================================
    function showLobbyHistoryModal() {
        const history = autoFarmFeature.getLobbyHistory();
        
        // 移除舊 modal
        const oldModal = document.getElementById('lh5-lobby-history-modal');
        if (oldModal) oldModal.remove();
        
        // 建立 modal
        const modal = document.createElement('div');
        modal.id = 'lh5-lobby-history-modal';
        modal.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.8);z-index:99999;display:flex;align-items:center;justify-content:center;';
        
        const content = document.createElement('div');
        content.style.cssText = 'background:#1a1a2e;border:1px solid #333;border-radius:12px;width:90%;max-width:600px;max-height:80vh;overflow:hidden;display:flex;flex-direction:column;';
        
        // 標題列
        const header = document.createElement('div');
        header.style.cssText = 'padding:12px 16px;border-bottom:1px solid #333;display:flex;justify-content:space-between;align-items:center;';
        header.innerHTML = `
            <span style="color:#e0d5c1;font-size:14px;font-weight:bold">📋 回大廳歷史清單</span>
            <button id="lh5-history-close" style="background:#3a3a4e;border:1px solid #555;border-radius:6px;padding:4px 12px;color:#aaa;font-size:12px;cursor:pointer">關閉</button>
        `;
        content.appendChild(header);
        
        // 內容區
        const body = document.createElement('div');
        body.style.cssText = 'padding:12px 16px;overflow-y:auto;flex:1;';
        
        if (history.length === 0) {
            body.innerHTML = '<div style="color:#888;font-size:13px;text-align:center;padding:20px">尚無歷史記錄</div>';
        } else {
            const townNames = {
                'town_silver_knight': '銀騎士村',
                'town_elf': '妖精森林',
                'town_talking': '說話之島',
                'town_gludio': '燃柳村',
                'town_giran': '奇岩',
                'town_heine': '海音',
                'town_oren': '歐瑞村莊',
                'town_ivory_tower': '象牙塔',
                'town_witon': '威頓村',
                '大廳': '大廳'
            };
            
            const table = document.createElement('table');
            table.style.cssText = 'width:100%;border-collapse:collapse;font-size:12px;color:#ccc';
            table.innerHTML = `
                <thead>
                    <tr style="background:#15152a">
                        <th style="padding:8px;text-align:left;border-bottom:1px solid #333">日期時間</th>
                        <th style="padding:8px;text-align:left;border-bottom:1px solid #333">傳送地點</th>
                        <th style="padding:8px;text-align:right;border-bottom:1px solid #333">等待秒數</th>
                    </tr>
                </thead>
                <tbody>
                    ${history.map(r => `
                        <tr>
                            <td style="padding:6px 8px;border-bottom:1px solid #2a2a3e">${r.timestamp}</td>
                            <td style="padding:6px 8px;border-bottom:1px solid #2a2a3e">${townNames[r.targetZone] || r.targetZone}</td>
                            <td style="padding:6px 8px;border-bottom:1px solid #2a2a3e;text-align:right;color:${r.waitSeconds > 60 ? '#ff6b6b' : '#4ade80'}">${r.waitSeconds} 秒</td>
                        </tr>
                    `).join('')}
                </tbody>
            `;
            body.appendChild(table);
            
            // 清除按鈕
            const clearBtn = document.createElement('button');
            clearBtn.textContent = '清除所有記錄';
            clearBtn.style.cssText = 'margin-top:12px;background:#5a2a2a;border:1px solid #833;border-radius:6px;padding:6px 12px;color:#ff6b6b;font-size:12px;cursor:pointer';
            clearBtn.addEventListener('click', () => {
                if (confirm('確定要清除所有歷史記錄？')) {
                    localStorage.removeItem(FARM_LOBBY_HISTORY_KEY);
                    localStorage.setItem(FARM_LOBBY_COUNT_KEY, '0');
                    autoFarmFeature.stop();
                    modal.remove();
                    // 更新計數器顯示
                    const countEl = document.getElementById('lh5-lobby-count-display');
                    if (countEl) countEl.textContent = '0';
                }
            });
            body.appendChild(clearBtn);
        }
        
        content.appendChild(body);
        modal.appendChild(content);
        document.body.appendChild(modal);
        
        // 關閉事件
        document.getElementById('lh5-history-close')?.addEventListener('click', () => modal.remove());
        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.remove();
        });
    }

})();
