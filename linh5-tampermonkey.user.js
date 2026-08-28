// ==UserScript==
// @name         LinH5 工具箱 - 世界王置頂 & 背包檢索
// @namespace    https://linh5web.win/
// @version      3.0.39
// @updateURL     https://raw.githubusercontent.com/qpooqp889/linh5-tampermonkey/main/linh5-tampermonkey.user.js
// @downloadURL   https://raw.githubusercontent.com/qpooqp889/linh5-tampermonkey/main/linh5-tampermonkey.user.js
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
    gearBtn.id = 'lh5-settings-btn'; gearBtn.textContent = '⚙'; gearBtn.title = '設定 v2.87 · 按一下打開';

    const overlay = document.createElement('div'); overlay.id = 'lh5-modal-overlay';
    const modal = document.createElement('div'); modal.id = 'lh5-modal';
    const now = new Date();
    const dateStr = now.getFullYear() + '-' + String(now.getMonth()+1).padStart(2,'0') + '-' + String(now.getDate()).padStart(2,'0');
    modal.innerHTML = `<h2><span>⚙ 設定 <span style="font-size:11px;color:#666;font-weight:normal">v3.0.0 (${dateStr})</span></span><span id="lh5-modal-close-x">✕</span></h2><div id="lh5-modal-body"></div>`;
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
        { key: 'tradeMoneySearch', label: '交易所金錢搜尋', desc: '在交易所新增金額模糊搜尋 + 價錢低→高排序' },
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
            const farmZoneVal = localStorage.getItem(FARM_ZONE_KEY) || 'training';
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
                            <div style="display:flex;align-items:center;gap:8px;margin-top:6px;font-size:12px;color:#ccc">
                                <span>🎭 角色槽：</span>
                                <select id="lh5-farm-slot" style="flex:1;background:#0d0d18;border:1px solid #333;border-radius:4px;padding:3px 6px;color:#e0d5c1;font-size:12px;outline:none;cursor:pointer">
                                    <option value="0" ${(parseInt(localStorage.getItem(FARM_SLOT_KEY),10)||0)===0?'selected':''}>槽位 0（第一隻）</option>
                                    <option value="1" ${(parseInt(localStorage.getItem(FARM_SLOT_KEY),10)||0)===1?'selected':''}>槽位 1（第二隻）</option>
                                    <option value="2" ${(parseInt(localStorage.getItem(FARM_SLOT_KEY),10)||0)===2?'selected':''}>槽位 2（第三隻）</option>
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
                                        <span id="lh5-delay-cd" style="margin-left:8px;color:#ff6b6b;font-size:11px"></span>
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
                            const z = document.getElementById('lh5-farm-zone')?.value || 'training';
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
                // 角色槽
                const slotEl = document.getElementById('lh5-farm-slot');
                if (slotEl) localStorage.setItem(FARM_SLOT_KEY, slotEl.value);

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
            const slotEl2 = document.getElementById('lh5-farm-slot');
            if (slotEl2) slotEl2.addEventListener('change', saveFarm);
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

        // 原網站上架視窗是由遊戲自己管理；開啟期間不得重建、排序或觸碰任何表單狀態。
        function isNativeListingOpen() {
            const popup = document.getElementById('list-popup');
            return !!(popup && !popup.classList.contains('hidden'));
        }

        // ── 模糊匹配 ──
        function fuzzyMatchPrice(priceText, query) {
            const priceNum = parseInt(priceText.replace(/[^\d]/g, ''), 10);
            if (isNaN(priceNum) || !query) return true;
            const qNum = parseInt(query.replace(/[^\d]/g, ''), 10);
            if (isNaN(qNum)) return true;
            return String(priceNum).includes(String(qNum));
        }

        // ── 解析價格數字（新 DOM: <b>1億</b> 或舊格式） ──
        function parsePrice(el) {
            // 新版 DOM: <div class="si-p">💰 <b>1億</b> <span class="dim">(100,000,000)</span> ...</div>
            const dimEl = el.querySelector('.si-p .dim');
            if (dimEl) {
                // 從括號內提取數字: (100,000,000)
                const dimText = dimEl.textContent || '';
                const match = dimText.match(/\(([\d,]+)\)/);
                if (match) {
                    return parseInt(match[1].replace(/,/g, ''), 10) || 0;
                }
            }
            // 舊版 fallback: 從整個 .si-p textContent 提取
            const priceText = el.querySelector('.si-p')?.textContent || '0';
            return parseInt(priceText.replace(/[^\d]/g, ''), 10) || 0;
        }

        // ── 過濾（移除價格簡寫功能，網站已內建） ──
        function applyFilterAndFormat() {
            if (_busy || isNativeListingOpen()) return;
            const list = document.getElementById('trade-list');
            if (!list) return;
            const items = list.querySelectorAll(':scope > .shop-item');
            if (!items.length) return;

            const query = moneyInput ? moneyInput.value.trim() : '';

            _busy = true;
            items.forEach(el => {
                const priceEl = el.querySelector('.si-p');
                if (!priceEl) { el.classList.remove('lh5-trade-hidden-money'); return; }

                // 使用 parsePrice 取得價格數字（兼容新舊 DOM）
                const priceNum = parsePrice(el);

                // ── 過濾 ──
                if (!query || fuzzyMatchPrice(String(priceNum), query)) {
                    el.classList.remove('lh5-trade-hidden-money');
                } else {
                    el.classList.add('lh5-trade-hidden-money');
                }
            });

            // ── 排序（使用 parsePrice 從 .dim 提取精確數字） ──
            const sortSelect = document.getElementById('lh5-trade-sort');
            if (sortSelect && sortSelect.value === 'priceAsc') {
                if (listObserver) listObserver.disconnect();
                const sorted = Array.from(list.children).filter(el => el.classList.contains('shop-item')).sort((a, b) => {
                    const pa = parsePrice(a);
                    const pb = parsePrice(b);
                    return pa - pb;
                });
                sorted.forEach(el => list.appendChild(el));
                if (listObserver) listObserver.observe(list, { childList: true });
            }
            _busy = false;
        }

        // ── 注入金錢搜尋 input + 排序下拉 ──
        function injectMoneySearch() {
            if (isNativeListingOpen()) return false;
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
                    if (_busy || isNativeListingOpen()) return;
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
            if (isNativeListingOpen()) return false;
            const ok = injectMoneySearch();
            setupObserver();
            // ★ 立刻過濾（處理 observer 綁定前已存在的項目）
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
        let _targetZone = 'training';
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
let _lastDelayLogMin = 0;       // 上次報剩餘時間的分鐘數（避免重複 log）
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
            const short = _externalIP || '??';
            if (_externalIP && isIPBlacklisted(_externalIP)) {
                btn.textContent = '配置 · IP黑名單!';
                btn.style.color = '#e04040';
            } else {
                btn.textContent = '配置 · ' + short + ' · ' + _ipCountdown + 's';
                btn.style.color = '';
            }
        }

        function mountIPPanel() {
            const loginBtn = document.getElementById('btn-login');
            if (!loginBtn || !loginBtn.parentNode) {
                console.log('[LinH5] mountIPPanel: 找不到 loginBtn 或 parentNode');
                return;
            }
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
            console.log('[LinH5] IP面板已掛載');
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
                _ipCountdown = 20; // 重置倒數（與 IP 更新同步）
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
                _targetZone = localStorage.getItem(FARM_ZONE_KEY) || 'training';
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
        // 確保 autoFarmFeature 外的 setInterval（如 startAfkCheck 內的）也能抓到
        window._emitSocket = _emitSocket;

        // 回大廳/選角（依設定選擇封包）
        // 注意：selectChar 可直接在遊戲中發送，伺服器處理重生回銀騎士+滿血滿魔
        function goLobby() {
            const weaponId = localStorage.getItem(FARM_LOBBY_WEAPON_KEY);
            const now = new Date();
            const timestamp = now.toLocaleString('zh-TW', { hour12: false });
            
            let targetZone = '大廳';
            
            // 即時更新 lobby count 顯示（不用等下次 tick）
            updateLobbyCountDisplay();
            
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
                            _lastDelayLogMin = 0;
                            const cdEl = document.getElementById('lh5-delay-cd');
                            const totalSec = Math.round(totalWaitMs/1000);
                            if (cdEl) {
                                const min = Math.floor(totalSec / 60);
                                const sec = totalSec % 60;
                                cdEl.textContent = totalSec >= 60 ? `⏳ ${min}m${sec.toString().padStart(2,'0')}s` : `⏳ ${totalSec}s`;
                            }
                            console.log(`[LinH5 掛機] 回地圖延遲 ${totalSec} 秒`);
                            return; // 等待中，本次 tick 不行動
                        }
                    }

                    // ② 還在等待中：檢查是否期滿，同時更新倒數
                    if (_gotoDelayStart > 0) {
                        const elapsed = now - _gotoDelayStart;
                        const remainingMs = _gotoDelayTotalMs - elapsed;
                        const remainingSec = Math.ceil(remainingMs / 1000);
                        
                        // UI 倒數
                        const cdEl = document.getElementById('lh5-delay-cd');
                        if (cdEl) {
                            const min = Math.floor(remainingSec / 60);
                            const sec = remainingSec % 60;
                            cdEl.textContent = remainingSec >= 60 ? `⏳ ${min}m${sec.toString().padStart(2,'0')}s` : `⏳ ${remainingSec}s`;
                        }
                        
                        // 控制台每分鐘報一次剩餘時間
                        const remainingMin = Math.ceil(remainingSec / 60);
                        if (remainingMin !== _lastDelayLogMin && remainingMin > 0) {
                            _lastDelayLogMin = remainingMin;
                            console.log(`[LinH5 掛機] 回地圖剩餘 ${remainingMin} 分鐘（${remainingSec} 秒）`);
                        }
                        
                        if (elapsed < _gotoDelayTotalMs) {
                            return; // 仍在等待中
                        }
                        // 期滿了，重置並繼續
                        _gotoDelayStart = 0;
                        _lastDelayLogMin = 0;
                        const cdEl2 = document.getElementById('lh5-delay-cd');
                        if (cdEl2) cdEl2.textContent = '';
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
    let _charSelFired = false; // 防止 1 秒 interval 重複發送 selectChar
    let _loginContainer = null; // 記錄登入容器，黑名單刪除按鈕後仍用來保留 IP 面板
    function startAfkCheck() {
        // 倒數 UI 每秒更新（共用 _afkCountdown，兩個畫面不同時出現）
        setInterval(() => {
            // 登入頁倒數
            const loginBtn = document.getElementById('btn-login');
            if (loginBtn && !loginBtn.classList.contains('hidden') && loginBtn.offsetParent !== null) {
                console.log('[LinH5] 登入頁 visible = true，hidden=', loginBtn.classList.contains('hidden'), 'offsetParent=', loginBtn.offsetParent);
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
                _loginContainer = lb2.parentNode; // 記住登入容器
                console.log('[LinH5] 登入頁偵測到，呼叫 mountIPPanel');
                autoFarmFeature.mountIPPanel();
                autoFarmFeature.updateIPPanel();
                // 黑名單 → 直接刪除登入按鈕
                if (!autoFarmFeature.isIPAllowed()) {
                    lb2.remove();
                }
            } else {
                const ipPanel = document.getElementById('lh5-ip-panel');
                // 只有在登入容器已離開文件時才移除面板（黑名單刪除按鈕時容器仍在，保留面板）
                if (ipPanel && (!_loginContainer || !document.contains(_loginContainer))) {
                    ipPanel.remove();
                }
            }
            // 選角頁倒數（同時檢查 h2 文字 + #slots 容器存在）
            const h2 = document.querySelector('h2');
            const h2txt = h2 ? h2.textContent.trim() : '';
            const slotsEl = document.getElementById('slots');
            if (h2 && h2txt.startsWith('選 擇 角 色') && slotsEl) {
                // 進場時（flag 未設）立即發送一次 selectChar
                if (!_charSelFired) {
                    _charSelFired = true;
                    const slotIdx = parseInt(localStorage.getItem('lh5_farm_slot'), 10) || 0;
                    window._emitSocket('selectChar', slotIdx);
                    console.log(`[LinH5] 選角頁 → 立即送出 selectChar slot=${slotIdx}`);
                }
                let cd = h2.querySelector('.lh5-afk-cd');
                if (!cd) { cd = document.createElement('span'); cd.className = 'lh5-afk-cd'; cd.style.cssText = 'color:#ff6b6b;font-size:16px;margin-left:10px;font-weight:bold'; h2.appendChild(cd); }
                cd.textContent = `(${_afkCountdown}s 後自動點擊)`;
                _afkCountdown = (_afkCountdown + 59) % 60;
            } else {
                _charSelFired = false; // 離開選角頁 → 重置 flag
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
            // 3. 選擇角色畫面（同時檢查 h2 文字 + #slots 容器存在）
            const h2 = document.querySelector('h2');
            const h2txt2 = h2 ? h2.textContent.trim() : '';
            const slotsEl2 = document.getElementById('slots');
            if (h2 && h2txt2.startsWith('選 擇 角 色') && slotsEl2) {
                const slotIdx = parseInt(localStorage.getItem('lh5_farm_slot'), 10) || 0;
                window._emitSocket('selectChar', slotIdx);
                console.log(`[LinH5] 送出 selectChar slot=${slotIdx}`);
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
            let themeBtn = document.createElement('button');
            themeBtn.id = 'theme-btn';
            themeBtn.textContent = '配置';
            themeBtn.style.cssText = 'margin-left:6px;padding:4px 10px;background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.15);border-radius:6px;color:#c8a96e;font-size:12px;cursor:pointer;font-family:inherit;';
            themeBtn.addEventListener('click', () => { renderSettings(); overlay.classList.add('open'); });
            // 防重：已存在就直接更新文字，不重複建立
            const existingThemeBtn = document.getElementById('theme-btn');
            if (existingThemeBtn) { themeBtn = existingThemeBtn; }
            else { gb.after(themeBtn); }
        }
        else {
            if (!tb.querySelector('#lh5-settings-btn')) tb.appendChild(gearBtn);
            let themeBtn = document.createElement('button');
            themeBtn.id = 'theme-btn';
            themeBtn.textContent = '配置';
            themeBtn.style.cssText = 'margin-left:6px;padding:4px 10px;background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.15);border-radius:6px;color:#c8a96e;font-size:12px;cursor:pointer;font-family:inherit;';
            themeBtn.addEventListener('click', () => { renderSettings(); overlay.classList.add('open'); });
            // 防重：已存在就直接更新文字，不重複建立
            const existingThemeBtn = document.getElementById('theme-btn');
            if (existingThemeBtn) { themeBtn = existingThemeBtn; }
            else { tb.appendChild(themeBtn); }
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
                        recordEnhanceReturnPacket(ev, args, 'onAny');
                    });
                console.log('[LH5] ✅ onAny 攔截啟動');
            }

            // onevent (socket.io v2 fallback)
            const origOnevent = socket.onevent?.bind(socket);
            if (origOnevent) {
                socket.onevent = function(packet) {
                    if (packet && packet.data && packet.data.length >= 1) {
                        console.log('[LH5] 📥 pack:', packet.data[0], packet.data.length > 1 ? packet.data.slice(1) : '');
                        recordEnhanceReturnPacket(packet.data[0], packet.data.slice(1), 'onevent');
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
                                    recordEnhanceReturnPacket(ev, args, 'callback');
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
            socket.emit = function(ev, ...args) {
                console.log('[LH5] 📤 emit:', ev, ...args);
                return origEmit(ev, ...args);
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

        // 交易所金錢搜尋：檢查是否需要重新注入；原生上架視窗開啟時完全跳過
        if (!document.getElementById('list-popup')?.classList.contains('hidden') && document.getElementById('list-popup')) {
            // 不觸碰原網站上架表單，尤其是 #lp-qty。
        } else if (document.getElementById('trade-search') && !document.getElementById('lh5-trade-money')) {
            const s2 = loadSettings();
            if (s2.tradeMoneySearch) tradeMoneyFeature.tryStart();
        }

    }, 400);

    // ============================================================
    //  🚀 2.0 擴充：狀態儀表板、快捷鍵、設定匯出／匯入
    // ============================================================
    (function initV20Enhancements() {
        const V20_PREFIX = 'lh5_';
        const DASHBOARD_ID = 'lh5-v20-dashboard';
        const TOOLS_ID = 'lh5-v20-tools';
        const exportKeys = () => Object.keys(localStorage).filter(k => k.startsWith(V20_PREFIX));

        GM_addStyle(`
            #${DASHBOARD_ID}{position:fixed;right:12px;bottom:12px;z-index:99990;min-width:190px;padding:10px 12px;border:1px solid rgba(200,169,110,.7);border-radius:10px;background:rgba(18,18,30,.94);box-shadow:0 5px 22px rgba(0,0,0,.35);color:#e0d5c1;font:12px/1.55 system-ui,sans-serif;display:none;backdrop-filter:blur(5px)}
            #${DASHBOARD_ID}.open{display:block}
            #${DASHBOARD_ID} .lh5-v20-head{display:flex;justify-content:space-between;align-items:center;color:#c8a96e;font-weight:700;margin-bottom:5px}
            #${DASHBOARD_ID} .lh5-v20-close{border:0;background:none;color:#888;cursor:pointer;font-size:14px}
            #${DASHBOARD_ID} .lh5-v20-row{display:flex;justify-content:space-between;gap:14px;border-top:1px solid #2a2a3e;padding:3px 0}
            #${DASHBOARD_ID} .lh5-v20-value{color:#fff;font-variant-numeric:tabular-nums;text-align:right}
            #${TOOLS_ID}{margin-top:12px;padding-top:10px;border-top:1px solid #333}
            #${TOOLS_ID} .lh5-v20-tool-title{font-size:12px;color:#c8a96e;margin-bottom:6px}
            #${TOOLS_ID} .lh5-v20-tool-row{display:flex;gap:6px}
            #${TOOLS_ID} button{flex:1;padding:5px 6px;border:1px solid #444;border-radius:5px;background:#2a2a3e;color:#e0d5c1;font-size:11px;cursor:pointer}
            #${TOOLS_ID} button:hover{background:#3a3a4e;border-color:#c8a96e}
            #lh5-v20-file{display:none}
            #lh5-craft-modal{position:fixed;inset:0;z-index:1000000;background:rgba(0,0,0,.7);display:none;align-items:center;justify-content:center}
            #lh5-craft-modal.open{display:flex}
            #lh5-craft-modal .lh5-craft-card{width:min(380px,calc(100vw - 32px));background:#1a1a2e;border:1px solid #c8a96e;border-radius:12px;padding:18px;color:#e0d5c1;box-shadow:0 8px 40px rgba(0,0,0,.65);font:13px/1.5 system-ui,sans-serif}
            #lh5-craft-modal h3{margin:0 0 12px;color:#c8a96e;font-size:17px;display:flex;justify-content:space-between;align-items:center}
            #lh5-craft-modal .lh5-craft-close{border:0;background:none;color:#ff7777;cursor:pointer;font-size:18px}
            #lh5-craft-modal .lh5-craft-materials{margin:10px 0;padding:10px;background:#12121e;border-radius:8px;border:1px solid #2a2a3e}
            #lh5-craft-modal .lh5-craft-material{display:flex;justify-content:space-between;border-bottom:1px solid #2a2a3e;padding:4px 0}
            #lh5-craft-modal .lh5-craft-material:last-child{border-bottom:0}
            #lh5-craft-modal .lh5-craft-input{width:100%;box-sizing:border-box;margin:5px 0 10px;padding:8px;background:#0d0d18;border:1px solid #444;border-radius:6px;color:#fff;font-size:14px}
            #lh5-craft-modal .lh5-craft-actions{display:flex;gap:8px}
            #lh5-craft-modal .lh5-craft-actions button{flex:1;padding:8px;border:0;border-radius:6px;cursor:pointer;font-weight:700}
            #lh5-craft-modal .lh5-craft-submit{background:#c8a96e;color:#1a1a2e}
            #lh5-craft-modal .lh5-craft-cancel{background:#3a3a4e;color:#e0d5c1}
            #lh5-enhance-modal{position:fixed;inset:0;z-index:1000001;background:rgba(0,0,0,.7);display:none;align-items:center;justify-content:center}
            #lh5-enhance-modal.open{display:flex}
            #lh5-enhance-modal .lh5-enhance-card{width:min(400px,calc(100vw - 32px));background:#1a1a2e;border:1px solid #c8a96e;border-radius:12px;padding:18px;color:#e0d5c1;box-shadow:0 8px 40px rgba(0,0,0,.65);font:13px/1.5 system-ui,sans-serif}
            #lh5-enhance-modal h3{margin:0 0 12px;color:#c8a96e;font-size:17px;display:flex;justify-content:space-between;align-items:center}
            #lh5-enhance-modal .lh5-enhance-close{border:0;background:none;color:#ff7777;cursor:pointer;font-size:18px}
            #lh5-enhance-modal select,#lh5-enhance-modal input{width:100%;box-sizing:border-box;margin:5px 0 10px;padding:8px;background:#0d0d18;border:1px solid #444;border-radius:6px;color:#fff;font-size:13px}
            #lh5-enhance-modal .lh5-enhance-qty-row{display:flex;align-items:center;gap:6px}
            #lh5-enhance-modal .lh5-enhance-qty-row input{flex:1;min-width:0}
            #lh5-enhance-modal .lh5-enhance-qty-row button{height:34px;margin:5px 0 10px;padding:0 10px;border:1px solid #555;border-radius:6px;background:#2a2a3e;color:#e0d5c1;cursor:pointer;font-weight:700}
            #lh5-enhance-modal .lh5-enhance-qty-row button:hover{border-color:#c8a96e;color:#fff}
            #lh5-enhance-modal #lh5-enhance-qty-clear{color:#ff9b9b;font-size:16px;padding:0 9px}
            #lh5-enhance-modal #lh5-enhance-qty-max{color:#8ee28e}
            #lh5-enhance-modal .lh5-enhance-actions{display:flex;gap:8px}
            #lh5-enhance-modal .lh5-enhance-actions button{flex:1;padding:8px;border:0;border-radius:6px;cursor:pointer;font-weight:700}
            #lh5-enhance-modal .lh5-enhance-submit{background:#c8a96e;color:#1a1a2e}
            #lh5-enhance-modal .lh5-enhance-cancel{background:#3a3a4e;color:#e0d5c1}
            #lh5-enhance-stats-modal{position:fixed;inset:0;z-index:1000002;background:rgba(0,0,0,.75);display:none;align-items:center;justify-content:center}
            #lh5-enhance-stats-modal.open{display:flex}
            #lh5-enhance-stats-modal .lh5-enhance-stats-card{width:min(680px,calc(100vw - 28px));max-height:82vh;display:flex;flex-direction:column;background:#1a1a2e;border:1px solid #c8a96e;border-radius:12px;padding:18px;color:#e0d5c1;box-shadow:0 8px 40px rgba(0,0,0,.65);font:12px/1.5 system-ui,sans-serif}
            #lh5-enhance-stats-modal h3{margin:0 0 10px;color:#c8a96e;font-size:17px;display:flex;justify-content:space-between;align-items:center}
            #lh5-enhance-stats-modal .lh5-enhance-stats-close{border:0;background:none;color:#ff7777;cursor:pointer;font-size:17px}
            #lh5-enhance-stats-modal .lh5-enhance-stats-table-wrap{overflow:auto;flex:1;border:1px solid #2a2a3e}
            #lh5-enhance-stats-modal table{width:100%;border-collapse:collapse;white-space:nowrap}
            #lh5-enhance-stats-modal th,#lh5-enhance-stats-modal td{padding:6px 8px;text-align:left;border-bottom:1px solid #2a2a3e}
            #lh5-enhance-stats-modal th{position:sticky;top:0;background:#12121e;color:#c8a96e}
            #lh5-enhance-stats-modal .status-success{color:#4ade80}.status-failed{color:#ff6b6b}.status-unknown{color:#facc15}
            #lh5-enhance-stats-modal .lh5-enhance-stats-actions{display:flex;gap:8px;margin-top:10px}.lh5-enhance-stats-actions button{padding:6px 12px;border:0;border-radius:6px;background:#3a3a4e;color:#e0d5c1;cursor:pointer}.lh5-enhance-stats-actions button:first-child{background:#5a2a2a;color:#ff9999}
        `);

        const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
        function readChar() {
            try { const w = typeof unsafeWindow !== 'undefined' ? unsafeWindow : window; return w.__lh5_char || {}; } catch (_) { return {}; }
        }
        function getZone() { return document.getElementById('zone-name')?.textContent?.trim() || '未進入地圖'; }
        function farmStatus() { return autoFarmFeature?.isRunning?.() ? '運行中' : '已停止'; }
        function createDashboard() {
            let el = document.getElementById(DASHBOARD_ID);
            if (el) return el;
            el = document.createElement('div'); el.id = DASHBOARD_ID;
            el.innerHTML = `<div class="lh5-v20-head"><span>📊 LinH5 2.0 狀態</span><button class="lh5-v20-close" title="關閉">✕</button></div><div class="lh5-v20-row"><span>地圖</span><span class="lh5-v20-value" data-v20="zone">-</span></div><div class="lh5-v20-row"><span>HP</span><span class="lh5-v20-value" data-v20="hp">-</span></div><div class="lh5-v20-row"><span>MP</span><span class="lh5-v20-value" data-v20="mp">-</span></div><div class="lh5-v20-row"><span>掛機</span><span class="lh5-v20-value" data-v20="farm">-</span></div><div class="lh5-v20-row"><span>快捷鍵</span><span class="lh5-v20-value">Ctrl+Shift+L</span></div>`;
            el.querySelector('.lh5-v20-close').addEventListener('click', () => el.classList.remove('open'));
            document.body.appendChild(el); return el;
        }
        function updateDashboard() {
            const el = document.getElementById(DASHBOARD_ID); if (!el?.classList.contains('open')) return;
            const c = readChar();
            const ratio = (v, max) => v !== undefined && max > 0 ? `${Math.round(v / max * 100)}% (${v}/${max})` : '-';
            el.querySelector('[data-v20="zone"]').textContent = getZone();
            el.querySelector('[data-v20="hp"]').textContent = ratio(c.hp, c.maxHp);
            el.querySelector('[data-v20="mp"]').textContent = ratio(c.mp, c.maxMp);
            el.querySelector('[data-v20="farm"]').textContent = farmStatus();
        }
        function toggleDashboard() { const el = createDashboard(); el.classList.toggle('open'); updateDashboard(); }
        function downloadProfile() {
            const data = { schema: 'linh5-tampermonkey-profile', version: '3.0.4', exportedAt: new Date().toISOString(), settings: loadSettings(), localStorage: Object.fromEntries(exportKeys().map(k => [k, localStorage.getItem(k)])) };
            const blob = new Blob([JSON.stringify(data, null, 2)], {type:'application/json'});
            const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `linh5-profile-${new Date().toISOString().slice(0,10)}.json`; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 1000);
        }
        function importProfile(file) {
            const reader = new FileReader();
            reader.onload = () => {
                try {
                    const data = JSON.parse(reader.result);
                    if (!data || data.schema !== 'linh5-tampermonkey-profile' || !data.localStorage || typeof data.localStorage !== 'object') throw new Error('格式不正確');
                    Object.entries(data.localStorage).forEach(([key, value]) => { if (key.startsWith(V20_PREFIX) && typeof value === 'string') localStorage.setItem(key, value); });
                    if (data.settings && typeof data.settings === 'object') saveSettings({...loadSettings(), ...data.settings});
                    alert('設定匯入完成，重新整理頁面後生效。');
                } catch (e) { alert('設定匯入失敗：' + e.message); }
            };
            reader.readAsText(file);
        }
        const CRAFT_RECIPES = [
            { key: 'tshirt', npcId: 'npc_herbert', recipeIdx: 0, name: 'T恤', yield: 1, aliases: ['T恤', 'T-shirt'], materials: [
                { id: '50', need: 10, name: '白色布料' }, { id: '85', need: 3, name: '紅色布料' },
                { id: '115', need: 2, name: '藍色布料' }, { id: '1106427', need: 30000, name: '金幣' }
            ] },
            { key: 'iron-boots', npcId: 'npc_herbert', recipeIdx: 0, name: '鋼鐵長靴', yield: 1, aliases: ['鋼鐵長靴', '鐵靴'], materials: [
                { id: '0', need: 1, name: '長靴（可合成）' }, { id: '0', need: 160, name: '金屬塊' }, { id: '952441', need: 8000, name: '金幣' }
            ] },
            { key: 'iron-gloves', npcId: 'npc_herbert', recipeIdx: 0, name: '鋼鐵手套', yield: 1, aliases: ['鋼鐵手套', '鐵手套'], materials: [
                { id: '0', need: 1, name: '手套' }, { id: '0', need: 150, name: '金屬塊' }, { id: '952441', need: 25000, name: '金幣' }
            ] }
        ];
        let selectedCraftKey = 'tshirt';
        let craftItemsBound = false;
        function getCraftRecipe() { return CRAFT_RECIPES.find(r => r.key === selectedCraftKey) || CRAFT_RECIPES[0]; }
        function renderCraftRecipe(modal) {
            const recipe = getCraftRecipe();
            const idx = modal.querySelector('#lh5-craft-recipe-idx');
            const materials = modal.querySelector('.lh5-craft-materials');
            const selected = modal.querySelector('[data-craft-recipe="' + recipe.key + '"]');
            if (idx) idx.textContent = String(recipe.recipeIdx);
            if (materials) materials.innerHTML = recipe.materials.map(m => `<div class="lh5-craft-material"><span>${m.name} <small style="color:#777">(${m.id})</small></span><strong>${m.need.toLocaleString()}</strong></div>`).join('');
            modal.querySelectorAll('[data-craft-recipe]').forEach(el => { el.style.borderColor = el === selected ? '#c8a96e' : '#444'; el.style.background = el === selected ? '#3a3040' : '#2a2a3e'; });
            const qty = modal.querySelector('#lh5-craft-qty');
            const submit = modal.querySelector('.lh5-craft-submit');
            const hint = modal.querySelector('#lh5-craft-hint');
            const n = Math.max(1, Math.min(9999, parseInt(qty?.value, 10) || 1));
            if (qty) qty.value = n;
            if (submit) submit.textContent = `${n} 製作`;
            if (hint) hint.textContent = `將送出 craftAction ${recipe.npcId} ${recipe.recipeIdx} ${n}`;
        }
        function bindCraftItems() {
            if (craftItemsBound) return;
            try {
                const w = typeof unsafeWindow !== 'undefined' ? unsafeWindow : window;
                const s = w.socket || (typeof socket !== 'undefined' ? socket : null);
                if (!s || typeof s.on !== 'function') return;
                s.on('craftItems', payload => {
                    const recipes = Array.isArray(payload?.recipes) ? payload.recipes : [];
                    CRAFT_RECIPES.forEach(recipe => {
                        const found = recipes.find(r => recipe.aliases.some(alias => String(r.n || r.name || '').includes(alias)));
                        if (found && Number.isInteger(Number(found.idx))) recipe.recipeIdx = Number(found.idx);
                    });
                    const modal = document.getElementById('lh5-craft-modal');
                    if (modal) renderCraftRecipe(modal);
                    console.log('[LinH5] 🧵 已更新製作配方索引:', CRAFT_RECIPES.map(r => `${r.name}=${r.recipeIdx}`).join(', '));
                });
                craftItemsBound = true;
            } catch (e) { console.warn('[LinH5] craftItems 監聽失敗', e); }
        }
        function craftEmit(event, ...args) {
            try {
                const w = typeof unsafeWindow !== 'undefined' ? unsafeWindow : window;
                if (w.socket && typeof w.socket.emit === 'function') return w.socket.emit(event, ...args);
                if (typeof socket !== 'undefined' && socket && typeof socket.emit === 'function') return socket.emit(event, ...args);
            } catch (e) { console.warn('[LinH5] craft emit 失敗', e); }
            return false;
        }
        function openCraftModal() {
            let modal = document.getElementById('lh5-craft-modal');
            if (!modal) {
                modal = document.createElement('div'); modal.id = 'lh5-craft-modal';
                modal.innerHTML = `<div class="lh5-craft-card"><h3><span>🧵 批次製作</span><button class="lh5-craft-close" type="button">✕</button></h3><div style="color:#aaa">NPC：npc_herbert　配方索引：<span id="lh5-craft-recipe-idx">0</span></div><div style="margin-top:10px;font-weight:700;color:#fff">選擇配方</div>${CRAFT_RECIPES.map(r => `<button type="button" data-craft-recipe="${r.key}" style="width:100%;margin-top:5px;padding:8px;border:1px solid #444;border-radius:6px;background:#2a2a3e;color:#fff;cursor:pointer;text-align:left">${r.name} <span style="float:right;color:#c8a96e">每次產出 ${r.yield}</span></button>`).join('')}<div class="lh5-craft-materials"></div><label for="lh5-craft-qty">製作數量</label><input id="lh5-craft-qty" class="lh5-craft-input" type="number" min="1" max="9999" value="1" step="1"><div id="lh5-craft-hint" style="color:#888;font-size:12px;margin-bottom:10px"></div><div class="lh5-craft-actions"><button type="button" class="lh5-craft-cancel">取消</button><button type="button" class="lh5-craft-submit">1 製作</button></div></div>`;
                document.body.appendChild(modal);
                const close = () => modal.classList.remove('open');
                modal.querySelector('.lh5-craft-close').addEventListener('click', close);
                modal.querySelector('.lh5-craft-cancel').addEventListener('click', close);
                modal.addEventListener('click', e => { if (e.target === modal) close(); });
                modal.querySelectorAll('[data-craft-recipe]').forEach(button => button.addEventListener('click', () => { selectedCraftKey = button.dataset.craftRecipe; renderCraftRecipe(modal); }));
                const qty = modal.querySelector('#lh5-craft-qty');
                qty.addEventListener('input', () => renderCraftRecipe(modal));
                modal.querySelector('.lh5-craft-submit').addEventListener('click', () => { renderCraftRecipe(modal); const recipe = getCraftRecipe(); const n = Number(qty.value); craftEmit('craftAction', recipe.npcId, recipe.recipeIdx, n); console.log('[LinH5] 🧵 批次製作:', recipe.name, '數量:', n, 'recipeIdx:', recipe.recipeIdx); close(); });
            }
            bindCraftItems();
            craftEmit('openCraft', 'npc_herbert');
            renderCraftRecipe(modal);
            modal.classList.add('open');
            modal.querySelector('#lh5-craft-qty')?.focus();
                }
        function getEnhanceTab(cat) {
            const subtab = document.querySelector(`.subtab[data-c="${cat}"]`);
            if (!subtab) return null;
            let node = subtab.parentElement;
            for (let level = 0; node && level < 5; level++, node = node.parentElement) {
                const cells = [...node.querySelectorAll('.cell[data-i]')];
                if (cells.length) return { cat, subtab, cells };
            }
            return { cat, subtab, cells: [] };
        }
        function getItemLabel(cell, invItem) {
            const image = cell.querySelector('img');
            const fromAlt = image?.alt?.trim();
            const fromSrc = image?.getAttribute('src')?.split('/').pop()?.replace(/\.[^.]+$/, '') || '';
            return fromAlt || fromSrc || invItem?.n || `index ${cell.dataset.i}`;
        }
        function getEnhanceInventory(catFilter = '') {
            const result = [];
            let inv = [];
            try { const w = typeof unsafeWindow !== 'undefined' ? unsafeWindow : window; inv = Array.isArray(w.__lh5_inv) ? w.__lh5_inv : []; } catch (_) {}
            const cats = catFilter ? [catFilter] : ['wpn', 'arm'];
            cats.forEach(cat => {
                const tab = getEnhanceTab(cat); if (!tab) return;
                tab.cells.forEach(cell => {
                    const index = Number(cell.dataset.i);
                    if (!Number.isInteger(index) || index < 0) return;
                    const item = inv[index] || {};
                    if (item.cat && item.cat !== cat) return;
                    const countText = cell.querySelector('.cnt')?.textContent?.replace(/,/g, '').trim();
                    const count = Math.max(1, parseInt(countText, 10) || 1);
                    const enchant = Number(item.en || 0);
                    result.push({ cat, index, count, name: getItemLabel(cell, item), enchant, item });
                });
            });
            return result;
        }
        function getEnhanceGroups(catFilter = '') {
            const map = new Map();
            getEnhanceInventory(catFilter).forEach(x => {
                const key = `${x.cat}|${x.name}|${x.enchant}`;
                if (!map.has(key)) map.set(key, { key, cat: x.cat, name: x.name, enchant: x.enchant, total: 0, entries: [] });
                const group = map.get(key); group.total += x.count; group.entries.push({ index: x.index, count: x.count });
            });
            return [...map.values()].sort((a, b) => (a.entries[0]?.index ?? Number.MAX_SAFE_INTEGER) - (b.entries[0]?.index ?? Number.MAX_SAFE_INTEGER) || a.cat.localeCompare(b.cat) || a.name.localeCompare(b.name, 'zh-Hant') || a.enchant - b.enchant);
        }
        function switchEnhanceTab(cat) {
            const tab = getEnhanceTab(cat);
            if (!tab) return false;
            if (!tab.subtab.classList.contains('active')) tab.subtab.click();
            return true;
        }
        function expandEnhanceIndices(group, count) {
            const result = [];
            for (const entry of group.entries) for (let i = 0; i < entry.count && result.length < count; i++) result.push(entry.index);
            return result;
        }
        function lockedEnhanceDebug(label, payload) {
            try { console.log('[LH5][LOCK-DEBUG] ' + label, payload === undefined ? '' : payload); } catch (_) {}
        }
        function getEnhanceCellSnapshot(index) {
            try { return [...document.querySelectorAll(`.cell[data-i="${index}"]`)].map(cell => cell.outerHTML.slice(0, 500)); } catch (_) { return []; }
        }
        const ENHANCE_STOP_KEY = 'lh5_enhance_stop_values';
        function getEnhanceStopValues() {
            try { const raw = JSON.parse(localStorage.getItem(ENHANCE_STOP_KEY) || '{}'); return { wpn: Number.isInteger(raw.wpn) ? raw.wpn : 7, arm: Number.isInteger(raw.arm) ? raw.arm : 5 }; } catch (_) { return { wpn: 7, arm: 5 }; }
        }
        function saveEnhanceStopValue(cat, value) { const values = getEnhanceStopValues(); values[cat] = value; localStorage.setItem(ENHANCE_STOP_KEY, JSON.stringify(values)); }
        function getLockedEnhanceState(lock) {
            const entries = getEnhanceInventory(lock.cat).filter(x => x.name === lock.name);
            // 下拉選取的強化值是固定目標；例如選 +6，只找 +6，不會先選 +0 或追到 +7。
            const targetEnchant = Number.isInteger(lock.targetEnchant) ? lock.targetEnchant : lock.currentEnchant;
            const eligible = entries.filter(x => x.enchant === targetEnchant);
            const higher = entries.filter(x => x.enchant > lock.currentEnchant);
            return {
                entries,
                eligible,
                eligibleTotal: eligible.reduce((sum, x) => sum + x.count, 0),
                total: entries.reduce((sum, x) => sum + x.count, 0),
                higherTotal: higher.reduce((sum, x) => sum + x.count, 0)
            };
        }
        function findLockedEnhanceEntry(lock) {
            const state = getLockedEnhanceState(lock);
            return state.eligible.slice().sort((a, b) => a.enchant - b.enchant || a.index - b.index)[0] || null;
        }
        function startLockedEnhance(lock, total, eventName, onDone, intervalMs = 350) {
            const batchId = 'enh-lock-' + Date.now(); let completed = 0; let stopped = false; let timer = null; let lastCheckLog = 0;
            if (enhanceProgressState) enhanceProgressState.batchId = batchId;
            lockedEnhanceDebug('START', { batchId, lock: {...lock}, total, eventName, rule: '只處理下拉選取名稱與強化值分組' });
            const stop = (reason) => { stopped = true; if (timer) clearTimeout(timer); if (enhanceProgressState && enhanceProgressState.batchId === batchId) enhanceProgressState.cancelled = true; console.warn('[LH5] 🔒 鎖定名稱強化停止:', reason); lockedEnhanceDebug('STOP', { batchId, reason, completed, total, lock: {...lock} }); if (enhanceProgressState && enhanceProgressState.batchId === batchId && completed < total) finishEnhanceProgress(reason); onDone?.(reason); };
            if (enhanceProgressState && enhanceProgressState.batchId === batchId) enhanceProgressState.cancel = () => stop('使用者取消');
            const runOne = () => {
                if (stopped || completed >= total) { if (!stopped) { finishEnhanceProgress('全部完成'); onDone?.('completed'); } return; }
                // 每輪重新掃描武器／防具分頁與下拉選取的道具名稱；已達停止值的分組不會再被選中。
                const beforeState = getLockedEnhanceState(lock);
                const found = beforeState.eligible.slice().sort((a, b) => a.enchant - b.enchant || a.index - b.index)[0];
                if (!found) return stop(`找不到低於停止值 +${lock.stopEnchant} 的「${lock.name}」剩餘道具，已完成 ${completed}/${total}`);
                lockedEnhanceDebug('FOUND', { batchId, cat: lock.cat, name: lock.name, stopEnchant: lock.stopEnchant, currentEnchant: found.enchant, index: found.index, eligibleTotal: beforeState.eligibleTotal, item: found.item, cell: getEnhanceCellSnapshot(found.index) });
                switchEnhanceTab(lock.cat);
                const before = Number(found.item?.en || found.enchant || 0); const operation = queueEnhanceOperation({ name: lock.name, cat: lock.cat }, found.index, eventName, batchId);
                operation.createdAt = Date.now(); operation.sent = true; operation.lockedName = lock.name; operation.stopEnchant = lock.stopEnchant;
                if (enhanceProgressState && enhanceProgressState.batchId === batchId) { enhanceProgressState.sent++; enhanceProgressState.current = { name: lock.name, index: found.index }; renderEnhanceProgress(); }
                lockedEnhanceDebug('EMIT', { batchId, event: eventName, index: found.index, cat: lock.cat, name: lock.name, beforeEnchant: before, stopEnchant: lock.stopEnchant, beforeState: { eligibleTotal: beforeState.eligibleTotal, total: beforeState.total }, item: getLiveInventoryItem(found.index), cell: getEnhanceCellSnapshot(found.index) });
                craftEmit(eventName, found.index);
                console.log('[LH5] 🔒 停止值強化:', lock.name, `+${before}`, 'index:', found.index, `停止 +${lock.stopEnchant}`, `${completed + 1}/${total}`);
                const started = Date.now();
                const check = () => {
                    if (stopped) return;
                    const state = getLockedEnhanceState(lock);
                    const toastNow = getEnhanceToastSnapshot();
                    const toastChanged = toastNow.text !== operation.toastBefore.text || toastNow.html !== operation.toastBefore.html;
                    const toastResult = toastChanged ? parseEnhanceToast(toastNow.text) : null;
                    if (toastResult && Date.now() - started > 250) {
                        lockedEnhanceDebug('TOAST', { batchId, oldIndex: found.index, result: toastResult, toast: toastNow });
                        resolveEnhanceOperation(operation, toastResult.status, toastResult.detail, toastResult);
                        completed++;
                        if (toastResult.status === 'failed') { timer = setTimeout(runOne, intervalMs); return; }
                        timer = setTimeout(runOne, intervalMs); return;
                    }
                    if (Date.now() - lastCheckLog > 1000) { lastCheckLog = Date.now(); lockedEnhanceDebug('CHECK', { batchId, oldIndex: found.index, lock: {...lock}, eligibleTotal: state.eligibleTotal, total: state.total, eligibleIndices: state.eligible.map(x => x.index), item: getLiveInventoryItem(found.index), cell: getEnhanceCellSnapshot(found.index) }); }
                    // 只有鎖定的 targetEnchant 數量減少才進入下一輪，避免同 index 的其他強化值被誤判。
                    if (state.eligibleTotal < beforeState.eligibleTotal) {
                        const upgraded = state.entries.filter(x => x.name === lock.name && x.enchant > before).sort((a, b) => a.enchant - b.enchant || a.index - b.index)[0] || null;
                        const status = upgraded ? 'success' : 'failed';
                        const detail = upgraded ? `成功，強化值 ${before} → ${upgraded.enchant}，下一輪只重新掃描 +${lock.targetEnchant} 的同名裝備` : (state.total < beforeState.total ? '強化消失，下一輪重新掃描最新 index' : `強化前後同為 +${before}，維持不變`);
                        lockedEnhanceDebug(upgraded ? 'SUCCESS' : 'FAILED_SHIFT', { batchId, oldIndex: found.index, newIndex: state.eligible[0]?.index ?? null, beforeEnchant: before, afterEnchant: upgraded?.enchant ?? null, eligibleBefore: beforeState.eligibleTotal, eligibleAfter: state.eligibleTotal, totalBefore: beforeState.total, totalAfter: state.total, cell: getEnhanceCellSnapshot(state.eligible[0]?.index ?? found.index) });
                        resolveEnhanceOperation(operation, status, detail);
                        completed++; timer = setTimeout(runOne, intervalMs); return;
                    }
                    if (Date.now() - started > 8000) { lockedEnhanceDebug('TIMEOUT', { batchId, oldIndex: found.index, lock: {...lock}, targetEnchant: lock.targetEnchant, eligibleTotal: state.eligibleTotal, total: state.total, item: getLiveInventoryItem(found.index), cell: getEnhanceCellSnapshot(found.index) }); resolveEnhanceOperation(operation, 'failed', '維持不變'); return stop('強化結果維持不變，已停止'); }
                    timer = setTimeout(check, 300);
                };
                timer = setTimeout(check, 300);
            };
            runOne();
        }
        function showEnhanceConfirm(detail, onConfirm) {
            const modal = document.getElementById('lh5-enhance-modal');
            const card = modal?.querySelector('.lh5-enhance-card');
            if (!modal || !card) return;
            const previous = card.innerHTML;
            const restore = () => { card.innerHTML = previous; modal.classList.remove('open'); openEnhanceModal(); };
            card.innerHTML = `<h3><span>⚠️ 確認一般強化</span><button type="button" data-confirm-close>✕</button></h3><div data-confirm-detail style="white-space:pre-line;color:#ddd;line-height:1.7;margin:10px 0"></div><div class="lh5-enhance-actions"><button type="button" data-confirm-cancel>返回修改</button><button type="button" data-confirm-start style="color:#fff;background:#9b3d3d">確認開始強化</button></div>`;
            card.querySelector('[data-confirm-detail]').textContent = detail;
            card.querySelector('[data-confirm-close]').onclick = restore;
            card.querySelector('[data-confirm-cancel]').onclick = restore;
            card.querySelector('[data-confirm-start]').onclick = () => { onConfirm(); };
        }
        function openEnhanceModal() {
            let modal = document.getElementById('lh5-enhance-modal');
            if (!modal) {
                modal = document.createElement('div'); modal.id = 'lh5-enhance-modal';
                modal.innerHTML = `<div class="lh5-enhance-card"><h3><span>🛡️ 批次安定值強化</span><button class="lh5-enhance-close" type="button">✕</button></h3><div style="color:#aaa;margin-bottom:8px">只掃描武器／防具分頁；執行前會先切換到對應分頁，再依該分頁 cell 的 data-i 送出安全強化。</div><label for="lh5-enhance-mode">強化模式</label><select id="lh5-enhance-mode"><option value="safe">安定值強化（enhanceSafeInv）</option><option value="normal">一般強化（enhanceInv）</option></select><label for="lh5-enhance-item">選擇武器／防具</label><select id="lh5-enhance-item"></select><label for="lh5-enhance-qty">批次強化數量</label><div class="lh5-enhance-qty-row"><input id="lh5-enhance-qty" type="number" min="1" max="9999" value="1" step="1"><button type="button" id="lh5-enhance-qty-clear" title="清空數量">✕</button><button type="button" id="lh5-enhance-qty-max" title="填入最大可強化數量">MAX</button></div><label for="lh5-enhance-interval">封包間隔（一般／安定共用，毫秒）</label><input id="lh5-enhance-interval" type="number" min="100" max="10000" value="500" step="50"><label for="lh5-enhance-stop">停止強化值</label><select id="lh5-enhance-stop">${Array.from({length: 12}, (_, i) => `<option value="${i + 1}">+${i + 1} 達到後停止</option>`).join('')}</select><div id="lh5-enhance-hint" style="color:#888;font-size:12px;margin-bottom:10px"></div><div class="lh5-enhance-actions"><button type="button" class="lh5-enhance-cancel">取消</button><button type="button" class="lh5-enhance-submit">開始強化</button></div></div>`;
                document.body.appendChild(modal);
                const close = () => modal.classList.remove('open');
                modal.querySelector('.lh5-enhance-close').addEventListener('click', close);
                modal.querySelector('.lh5-enhance-cancel').addEventListener('click', close);
                modal.addEventListener('click', e => { if (e.target === modal) close(); });
                const mode = modal.querySelector('#lh5-enhance-mode');
                const select = modal.querySelector('#lh5-enhance-item');
                const qty = modal.querySelector('#lh5-enhance-qty');
                const hint = modal.querySelector('#lh5-enhance-hint');
                const stopInput = modal.querySelector('#lh5-enhance-stop');
                const intervalInput = modal.querySelector('#lh5-enhance-interval');
                const savedInterval = Number(localStorage.getItem('lh5_enhance_interval_ms'));
                intervalInput.value = String(Number.isFinite(savedInterval) && savedInterval >= 100 ? Math.min(10000, Math.floor(savedInterval)) : 500);
                const refresh = () => {
                    const groups = getEnhanceGroups();
                    const old = select.value;
                    select.innerHTML = groups.length ? groups.map(g => { const shown = g.entries.slice(0, 5).map(e => e.index).join(','); const rest = g.entries.length > 5 ? `…（另 ${g.entries.length - 5} 個）` : ''; return `<option value="${g.key.replace(/"/g, '&quot;')}">${g.cat === 'wpn' ? '武器' : '防具'}｜${g.name} ${g.enchant > 0 ? '+' + g.enchant + ' ' : ''}(數量 ${g.total}，index: ${shown}${rest})</option>`; }).join('') : '<option value="">尚未讀取到武器／防具</option>';
                    if (groups.some(g => g.key === old)) select.value = old;
                    const current = groups.find(g => g.key === select.value);
                    const max = current ? current.total : 1;
                    qty.max = max;
                    const qtyValue = Number(qty.value);
                    if (qty.value !== '' && Number.isFinite(qtyValue)) qty.value = String(Math.min(Math.max(1, Math.floor(qtyValue)), max));
                    const eventName = mode.value === 'normal' ? 'enhanceInv' : 'enhanceSafeInv';
                    if (current) { const savedStop = getEnhanceStopValues()[current.cat]; stopInput.value = String(savedStop); }
                    const hintIndices = current ? current.entries.slice(0, 5).map(e => `${e.index}×${e.count}`).join(', ') : '';
                    const hintRest = current && current.entries.length > 5 ? `…（另 ${current.entries.length - 5} 個）` : '';
                    hint.textContent = current ? `${mode.value === 'normal' ? '一般強化' : '安定值強化'}｜${current.cat === 'wpn' ? '武器' : '防具'}｜可用數量：${current.total}｜停止值：+${stopInput.value}｜間隔：${intervalInput.value || 500}ms｜實際 index：${hintIndices}${hintRest}｜封包：${eventName}` : '請先進入角色並等待武器／防具背包資料載入';
                };
                modal.querySelector('#lh5-enhance-qty-clear').addEventListener('click', () => { qty.value = ''; qty.focus(); });
                modal.querySelector('#lh5-enhance-qty-max').addEventListener('click', () => { const current = getEnhanceGroups().find(g => g.key === select.value); if (current) { qty.value = String(current.total); qty.dispatchEvent(new Event('input', { bubbles: true })); qty.focus(); } });
                intervalInput.addEventListener('input', () => { const value = Math.min(10000, Math.max(100, Math.floor(Number(intervalInput.value) || 500))); if (Number.isFinite(value)) localStorage.setItem('lh5_enhance_interval_ms', String(value)); refresh(); });
                mode.addEventListener('change', refresh); select.addEventListener('change', refresh); qty.addEventListener('input', refresh); stopInput.addEventListener('change', () => { const current = getEnhanceGroups().find(g => g.key === select.value); if (current) saveEnhanceStopValue(current.cat, Number(stopInput.value)); refresh(); });
                modal.querySelector('.lh5-enhance-submit').addEventListener('click', () => {
                    const groups = getEnhanceGroups(); const current = groups.find(g => g.key === select.value);
                    if (!current) { alert('找不到武器或防具，請先打開背包並等待資料載入。'); return; }
                    const count = Math.max(1, Math.min(current.total, parseInt(qty.value, 10) || 1));
                    const intervalMs = Math.min(10000, Math.max(100, Math.floor(Number(intervalInput.value) || 500)));
                    intervalInput.value = String(intervalMs); localStorage.setItem('lh5_enhance_interval_ms', String(intervalMs));
                    const eventName = mode.value === 'normal' ? 'enhanceInv' : 'enhanceSafeInv';
                    const stopEnchant = parseInt(stopInput.value, 10);
                    if (!Number.isInteger(stopEnchant) || stopEnchant < 1 || stopEnchant > 12) { alert('請選擇有效的停止強化值（+1～+12）。'); return; }
                    saveEnhanceStopValue(current.cat, stopEnchant);
                    const lock = { cat: current.cat, name: current.name, currentEnchant: current.enchant, targetEnchant: current.enchant, stopEnchant };
                    const execute = () => {
                        switchEnhanceTab(current.cat);
                        const indices = expandEnhanceIndices(current, count);
                        if (!indices.length) { alert('找不到可強化的背包 index。'); return; }
                        // 開始後保留同一個 Modal；右上角 X 只隱藏視窗，不停止批次。
                        beginEnhanceProgress(current, eventName, indices.length, stopEnchant);
                        startLockedEnhance(lock, count, eventName, reason => console.log(mode.value === 'normal' ? '[LH5] 🔒 鎖定名稱一般強化結束:' : '[LH5] 🛡️ 安定值強化結束:', reason), intervalMs);
                    };
                    if (mode.value === 'normal') showEnhanceConfirm(`裝備：${current.cat === 'wpn' ? '武器' : '防具'}｜${current.name} +${current.enchant}\n強化數量：${count}\n規則：達到 +${stopEnchant} 後停止\n封包：enhanceInv(index)\n\n取消或關閉不會送出封包。`, execute);
                    else execute();
                });
                modal._lh5Refresh = refresh;
            }
            modal._lh5Refresh?.();
            modal.classList.add('open');
            modal.querySelector('#lh5-enhance-qty')?.focus();
        }
        function openLockedEnhanceModal() {
            openEnhanceModal();
            const mode = document.querySelector('#lh5-enhance-mode');
            if (mode) { mode.value = 'normal'; mode.dispatchEvent(new Event('change')); }
        }
        const ENHANCE_LOG_KEY = 'lh5_enhance_log';
        const ENHANCE_PACKET_LOG_KEY = 'lh5_enhance_packet_log';
        const enhancePending = [];
        let lastEnhancePacketFingerprint = '';
        let lastEnhancePacketAt = 0;
        function packetText(value) {
            try { return typeof value === 'string' ? value : JSON.stringify(value); } catch (_) { return String(value); }
        }
        function getEnhancePacketLog() {
            try { const raw = localStorage.getItem(ENHANCE_PACKET_LOG_KEY); const data = raw ? JSON.parse(raw) : []; return Array.isArray(data) ? data : []; } catch (_) { return []; }
        }
        function saveEnhancePacketLog(data) { localStorage.setItem(ENHANCE_PACKET_LOG_KEY, JSON.stringify(data.slice(-200))); }
        function recordEnhanceReturnPacket(eventName, args, source) {
            // 以批次進度狀態為主；toast 可能先完成 pending 移除，但返回封包仍需保留。
            if (!enhanceProgressState && !enhancePending.length) return;
            const payload = args.length <= 1 ? (args[0] ?? '') : args;
            const text = packetText(payload);
            const fingerprint = `${eventName}|${text}`;
            const now = Date.now();
            if (fingerprint === lastEnhancePacketFingerprint && now - lastEnhancePacketAt < 100) return;
            lastEnhancePacketFingerprint = fingerprint; lastEnhancePacketAt = now;
            const data = getEnhancePacketLog();
            data.push({ time: new Date().toLocaleString('zh-TW', { hour12: false }), event: String(eventName), source, payload: text, matched: /強化|獲得狀態|道具已破壞/.test(text) ? '可能是強化結果' : '', batchId: enhanceProgressState?.batchId || enhancePending[0]?.batchId || '' });
            saveEnhancePacketLog(data);
            console.log('[LH5][ENHANCE-PACKET]', eventName, payload);
            renderEnhancePacketLog();
        }
        let enhanceStatsTimer = null;
        let enhanceProgressState = null;
        function renderEnhanceProgress() {
            const modal = document.getElementById('lh5-enhance-modal'); const card = modal?.querySelector('.lh5-enhance-card'); const state = enhanceProgressState;
            if (!card || !state) return;
            const pct = state.total ? Math.min(100, Math.round((state.completed / state.total) * 100)) : 0;
            const current = state.current ? `目前：${state.current.name}｜index ${state.current.index}` : '';
            const cancelButton = state.finished ? '' : '<button type="button" data-progress-cancel style="color:#fff;background:#9b3d3d">取消</button>';
            const statusColor = state.finished ? '#8ee28e' : '#c8a96e';
            const resultRows = state.results.slice(-8).reverse().map(item => `<div style="border-top:1px solid #333;padding:4px 0;color:${item.status === 'success' ? '#8ee28e' : item.status === 'failed' ? '#ff9b9b' : '#aaa'}">${item.status === 'success' ? '成功' : item.status === 'failed' ? (item.detail || '失敗') : '未知'}｜${item.name}｜index ${item.index}</div>`).join('');
            card.innerHTML = `<h3><span>🛡️ 批次強化進度</span><button type="button" data-progress-close>✕</button></h3><div data-progress-summary style="color:${statusColor};font-weight:700;margin:8px 0">${state.finished ? state.finishText : `${state.completed}/${state.total}（${pct}%）`}</div><div style="height:8px;background:#333;border-radius:5px;overflow:hidden;margin:8px 0 12px"><div style="height:100%;width:${pct}%;background:${state.finished ? '#55b96b' : '#c8a96e'};transition:width .25s"></div></div><div data-progress-current style="color:#bbb;font-size:12px;min-height:18px">${current}</div><div data-progress-results style="margin-top:10px;color:#ddd;font-size:12px;line-height:1.8"><span style="color:#8ee28e">成功 ${state.success}</span>｜<span style="color:#ff9b9b">失敗 ${state.failed}</span>｜<span style="color:#aaa">未知 ${state.unknown}</span><br>模式：${state.eventName === 'enhanceInv' ? '一般強化' : '安定值強化'}｜停止值：+${state.stopEnchant}<div style="max-height:150px;overflow:auto;margin-top:6px">${resultRows || '<span style="color:#777">等待第一筆結果...</span>'}</div></div><div class="lh5-enhance-actions">${cancelButton}<button type="button" data-progress-close>${state.finished ? '關閉' : '隱藏視窗'}</button></div>`;
            const resetToInitial = () => { modal.remove(); enhanceProgressState = null; openEnhanceModal(); };
            card.querySelectorAll('[data-progress-close]').forEach(button => button.onclick = () => { if (state.finished) resetToInitial(); else modal.classList.remove('open'); });
            card.querySelector('[data-progress-cancel]')?.addEventListener('click', () => { const cancel = state.cancel; if (typeof cancel === 'function') cancel(); resetToInitial(); });
        }
        function beginEnhanceProgress(current, eventName, total, stopEnchant) {
            enhanceProgressState = { name: current.name, cat: current.cat, eventName, total, stopEnchant, sent: 0, completed: 0, success: 0, failed: 0, unknown: 0, current: null, results: [], finished: false, finishText: '', cancel: null, cancelled: false, timerIds: [] };
            renderEnhanceProgress();
        }
        function updateEnhanceProgressForOperation(op, status, detail) {
            const state = enhanceProgressState; if (!state || op.batchId !== state.batchId) return;
            state.completed = Math.min(state.total, state.completed + 1); state.current = { name: op.name, index: op.index };
            if (status === 'success') state.success++; else state.failed++;
            state.results.push({ status, name: op.name, index: op.index, detail: detail || '' });
            if (state.completed >= state.total) { state.finished = true; const resolved = state.success + state.failed; const rate = resolved ? ((state.success / resolved) * 100).toFixed(1) : '0.0'; state.finishText = `${state.completed}/${state.total} 完成｜成功 ${state.success}｜失敗 ${state.failed}｜未知 ${state.unknown}｜成功率 ${rate}%`; }
            renderEnhanceProgress();
        }
        function finishEnhanceProgress(reason) {
            const state = enhanceProgressState; if (!state || state.finished) return;
            state.finished = true; const resolved = state.success + state.failed; const rate = resolved ? ((state.success / resolved) * 100).toFixed(1) : '0.0'; state.finishText = `${state.completed}/${state.total} 結束｜成功 ${state.success}｜失敗 ${state.failed}｜未知 ${state.unknown}｜成功率 ${rate}%｜${reason}`; renderEnhanceProgress();
        }
        function getEnhanceLog() {
            try { const raw = localStorage.getItem(ENHANCE_LOG_KEY); const data = raw ? JSON.parse(raw) : []; return Array.isArray(data) ? data : []; } catch (_) { return []; }
        }
        function saveEnhanceLog(data) { localStorage.setItem(ENHANCE_LOG_KEY, JSON.stringify(data.slice(-500))); }
        function addEnhanceLog(entry) { const data = getEnhanceLog(); data.push({...entry, time: new Date().toLocaleString('zh-TW', { hour12: false })}); saveEnhanceLog(data); }
        function getLiveInventoryItem(index) {
            try { const w = typeof unsafeWindow !== 'undefined' ? unsafeWindow : window; return Array.isArray(w.__lh5_inv) ? w.__lh5_inv[index] : null; } catch (_) { return null; }
        }
        function getEnhanceToastSnapshot() {
            const toast = document.getElementById('toast');
            if (!toast) return { text: '', html: '' };
            return { text: String(toast.textContent || '').replace(/\s+/g, ' ').trim(), html: String(toast.innerHTML || '') };
        }
        function parseEnhanceToast(text) {
            const value = String(text || '').replace(/\s+/g, ' ').trim();
            if (!value) return null;
            if (/強化失敗.{0,30}(道具已破壞|裝備已破壞|道具消失|裝備消失)/.test(value) || /道具已破壞|裝備已破壞/.test(value)) return { status: 'failed', detail: value };
            const match = value.match(/獲得狀態[：:]\s*(.+?)\s*\+(\d+)\s*$/);
            if (match) return { status: 'success', detail: match[0], resultName: match[1].trim(), enchant: Number(match[2]) };
            if (/強化成功|強化完成/.test(value)) return { status: 'success', detail: value, enchant: null };
            // 遊戲可能使用「強化失敗，強化值不變／裝備保持原樣」等文字，均以 DOM 原文作為失敗依據。
            if (/強化失敗|強化值不變|強化等級不變|保持原樣|維持原樣|維持不變/.test(value)) return { status: 'failed', detail: value };
            return null;
        }
        function queueEnhanceOperation(current, index, eventName, batchId) {
            const before = getLiveInventoryItem(index); const toast = getEnhanceToastSnapshot();
            const op = { index, eventName, batchId, name: current.name, cat: current.cat, beforeEnchant: Number(before?.en || 0), createdAt: 0, sent: false, toastBefore: toast, toastAfter: null };
            enhancePending.push(op); return op;
        }
        function resolveEnhanceOperation(op, status, detail, toastResult = null) {
            const idx = enhancePending.indexOf(op); if (idx >= 0) enhancePending.splice(idx, 1);
            const toastEnchant = Number(toastResult?.enchant);
            const domAfter = Number(getLiveInventoryItem(op.index)?.en || 0);
            // toast 的 +N 是伺服器實際結果；優先使用它，避免道具消失或 index 前移後讀錯 DOM slot。
            const after = Number.isInteger(toastEnchant) && toastEnchant >= 0 ? toastEnchant : domAfter;
            // 只有沒有明確失敗訊息時，才把強化前後相同歸類為維持不變。
            if (after === op.beforeEnchant && status !== 'success' && !/失敗|破壞|消失/.test(String(detail || ''))) { status = 'failed'; detail = '維持不變'; }
            addEnhanceLog({ batchId: op.batchId, name: op.name, cat: op.cat, index: op.index, event: op.eventName, mode: op.eventName === 'enhanceInv' ? '一般強化' : '安定值強化', before: op.beforeEnchant, after, status, detail: detail || '' });
            updateEnhanceProgressForOperation(op, status, detail || '');
            enhancePending.filter(next => next.index === op.index).forEach(next => { next.beforeEnchant = after; });
        }
        function pollEnhanceResults() {
            const now = Date.now();
            for (let i = enhancePending.length - 1; i >= 0; i--) {
                const op = enhancePending[i]; if (!op.sent) continue; const item = getLiveInventoryItem(op.index);
                const toast = getEnhanceToastSnapshot(); const toastChanged = toast.text !== op.toastBefore.text || toast.html !== op.toastBefore.html;
                if (toastChanged) { const result = parseEnhanceToast(toast.text); if (result) { op.toastAfter = toast; resolveEnhanceOperation(op, result.status, result.detail); continue; } }
                else if (item && Number(item.en || 0) > op.beforeEnchant) resolveEnhanceOperation(op, 'success', '強化值上升');
                else if (!item && now - op.createdAt > 2500) resolveEnhanceOperation(op, 'failed', '強化消失');
                else if (now - op.createdAt > 8000) resolveEnhanceOperation(op, 'failed', '維持不變');
            }
            updateEnhanceStatsModal();
        }
        function enhanceStatsSummary() {
            const data = getEnhanceLog();
            const success = data.filter(x => x.status === 'success').length;
            const failed = data.filter(x => x.status === 'failed').length;
            const unknown = data.filter(x => x.status === 'unknown').length;
            const resolved = success + failed;
            return { total: data.length, success, failed, unknown, pending: enhancePending.length, rate: resolved ? (success / resolved * 100).toFixed(1) : '0.0' };
        }
        function updateEnhanceStatsModal() {
            const modal = document.getElementById('lh5-enhance-stats-modal'); if (!modal?.classList.contains('open')) return;
            const s = enhanceStatsSummary();
            const summary = modal.querySelector('[data-enhance-summary]');
            if (summary) summary.textContent = `總筆數 ${s.total}｜成功 ${s.success}｜失敗 ${s.failed}｜未知 ${s.unknown}｜處理中 ${s.pending}｜已判定成功率 ${s.rate}%`;
        }
        function csvEscape(value) { const text = String(value ?? ''); return /[",\n\r]/.test(text) ? '"' + text.replace(/"/g, '""') + '"' : text; }
        function exportEnhanceCsv() {
            const rows = getEnhanceLog();
            const headers = ['batchId', 'time', 'category', 'itemName', 'mode', 'index', 'beforeEnchant', 'afterEnchant', 'status', 'detail'];
            const csvRows = [headers, ...rows.map(r => [r.batchId, r.time, r.cat === 'wpn' ? '武器' : r.cat === 'arm' ? '防具' : r.cat, r.name, r.mode || (r.event === 'enhanceInv' ? '一般強化' : '安定值強化'), r.index, r.before, r.after, r.status === 'success' ? '成功' : r.status === 'failed' ? '失敗' : r.status === 'unknown' ? '未知' : r.status, r.detail])];
            const csv = '\ufeff' + csvRows.map(row => row.map(csvEscape).join(',')).join('\r\n') + '\r\n';
            const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
            const url = URL.createObjectURL(blob); const a = document.createElement('a');
            a.href = url; a.download = `linh5-enhance-log-${new Date().toISOString().slice(0, 10)}.csv`; document.body.appendChild(a); a.click(); a.remove();
            setTimeout(() => URL.revokeObjectURL(url), 1000);
        }
        function showEnhanceStatsModal() {
            let modal = document.getElementById('lh5-enhance-stats-modal');
            if (!modal) {
                modal = document.createElement('div'); modal.id = 'lh5-enhance-stats-modal'; modal.className = 'lh5-enhance-stats-modal';
                modal.innerHTML = `<div class="lh5-enhance-stats-card"><h3><span>📊 強化記錄與成功率</span><button type="button" class="lh5-enhance-stats-close">✕</button></h3><div data-enhance-summary style="color:#c8a96e;font-size:12px;margin-bottom:8px"></div><div style="margin:8px 0;color:#aaa;font-size:12px">📥 強化返回封包（只記錄強化等待期間收到的事件，最新資料在最下方）</div><pre data-enhance-packets style="max-height:180px;overflow:auto;white-space:pre-wrap;word-break:break-all;background:#0d0d18;border:1px solid #444;border-radius:6px;padding:8px;color:#b9d7ff;font:11px/1.5 monospace;margin:0 0 10px"></pre><div class="lh5-enhance-stats-table-wrap"><table><thead><tr><th>時間</th><th>道具</th><th>模式</th><th>index</th><th>強化前</th><th>強化後</th><th>結果</th></tr></thead><tbody data-enhance-rows></tbody></table></div><div class="lh5-enhance-stats-actions"><button type="button" data-enhance-export>匯出 CSV</button><button type="button" data-enhance-clear>清除記錄</button><button type="button" class="lh5-enhance-stats-close">關閉</button></div></div>`;
                document.body.appendChild(modal);
                const close = () => modal.classList.remove('open');
                modal.querySelectorAll('.lh5-enhance-stats-close').forEach(b => b.addEventListener('click', close));
                modal.addEventListener('click', e => { if (e.target === modal) close(); });
                modal.querySelector('[data-enhance-export]').addEventListener('click', exportEnhanceCsv);
                modal.querySelector('[data-enhance-clear]').addEventListener('click', () => { if (confirm('確定清除強化記錄？')) { localStorage.removeItem(ENHANCE_LOG_KEY); localStorage.removeItem(ENHANCE_PACKET_LOG_KEY); renderEnhanceStatsRows(); renderEnhancePacketLog(); updateEnhanceStatsModal(); } });
            }
            renderEnhanceStatsRows(); renderEnhancePacketLog(); updateEnhanceStatsModal(); modal.classList.add('open');
        }
        function renderEnhancePacketLog() {
            const box = document.querySelector('#lh5-enhance-stats-modal [data-enhance-packets]'); if (!box) return;
            const rows = getEnhancePacketLog().slice(-50);
            box.textContent = rows.length ? rows.map((r, i) => `[${i + 1}] ${r.time}｜${r.event}｜${r.source}${r.matched ? '｜' + r.matched : ''}\n${r.payload}`).join('\n\n') : '尚未捕捉到強化返回封包；開始強化後再開啟此面板查看。';
        }
        function renderEnhanceStatsRows() {
            const body = document.querySelector('#lh5-enhance-stats-modal [data-enhance-rows]'); if (!body) return;
            const rows = getEnhanceLog().slice(-100).reverse();
            body.innerHTML = rows.length ? rows.map(r => `<tr><td>${r.time || '-'}</td><td>${r.name || '-'}</td><td>${r.mode || (r.event === 'enhanceInv' ? '一般強化' : '安定值強化')}</td><td>${r.index}</td><td>+${r.before ?? 0}</td><td>+${r.after ?? 0}</td><td class="status-${r.status}">${r.status === 'success' ? '成功' : r.status === 'failed' ? '失敗' : r.status === 'unknown' ? '未知' : r.status}</td></tr>`).join('') : '<tr><td colspan="7" style="text-align:center;color:#777;padding:18px">尚無記錄</td></tr>';
        }
        function injectTools() {
            const body = document.getElementById('lh5-modal-body'); if (!body || document.getElementById(TOOLS_ID)) return;
            const tools = document.createElement('div'); tools.id = TOOLS_ID;
            tools.innerHTML = `<div class="lh5-v20-tool-title">🧰 2.0 工具</div><div class="lh5-v20-tool-row"><button type="button" data-v20-action="export">匯出設定</button><button type="button" data-v20-action="import">匯入設定</button><button type="button" data-v20-action="dashboard">狀態面板</button></div><div class="lh5-v20-tool-row" style="margin-top:6px"><button type="button" data-v20-action="craft">🧵 批次製作</button><button type="button" data-v20-action="enhance">🛡️ 批次強化</button><button type="button" data-v20-action="enhance-stats">📊 強化記錄</button></div><input id="lh5-v20-file" type="file" accept="application/json">`;
            body.appendChild(tools);
            tools.querySelector('[data-v20-action="export"]').addEventListener('click', downloadProfile);
            tools.querySelector('[data-v20-action="dashboard"]').addEventListener('click', toggleDashboard);
            tools.querySelector('[data-v20-action="craft"]').addEventListener('click', openCraftModal);
            tools.querySelector('[data-v20-action="enhance"]').addEventListener('click', openEnhanceModal);
            tools.querySelector('[data-v20-action="enhance-stats"]').addEventListener('click', showEnhanceStatsModal);
            const file = tools.querySelector('#lh5-v20-file');
            tools.querySelector('[data-v20-action="import"]').addEventListener('click', () => file.click());
            file.addEventListener('change', () => { if (file.files?.[0]) importProfile(file.files[0]); file.value = ''; });
        }
        document.addEventListener('keydown', e => { if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'l') { e.preventDefault(); toggleDashboard(); } });
        if (!enhanceStatsTimer) enhanceStatsTimer = setInterval(pollEnhanceResults, 500);
        setInterval(() => { injectTools(); updateDashboard(); renderEnhanceStatsRows(); const enhanceModal = document.getElementById('lh5-enhance-modal'); if (enhanceModal?.classList.contains('open') && enhanceModal.querySelector('#lh5-enhance-item')) enhanceModal._lh5Refresh?.(); }, 1000);
        console.log('[LinH5] ✅ 2.0 擴充模組已啟動：Ctrl+Shift+L 開啟狀態面板');
    })();

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
