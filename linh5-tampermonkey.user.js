// ==UserScript==
// @name         LinH5 工具箱 - 世界王置頂 & 背包檢索
// @namespace    https://linh5web.win/
// @version      2.55
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
    const FARM_MP_ENABLED_KEY = 'lh5_farm_mp_enabled';
    const FARM_HP_ENABLED_KEY = 'lh5_farm_hp_enabled';
    const FARM_HP_LOW_KEY = 'lh5_farm_hp_low';
    const FARM_HP_HIGH_KEY = 'lh5_farm_hp_high';
    const FARM_LOBBY_MODE_KEY = 'lh5_farm_lobby_mode';
    const FARM_LOBBY_WEAPON_KEY = 'lh5_farm_lobby_weapon';
    const FARM_ZONE_WEAPON_KEY = 'lh5_farm_zone_weapon';
    const FARM_AUTO_RUN_KEY = 'lh5_farm_auto_run';

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
        #t-exp-txt { color:#fff !important; }
        .wb-r1 { display:flex;align-items:center; }
        .lh5-boss-countdown { color:#fbbf24; font-weight:bold; margin-right:6px; }
        

    `);

    // ============================================================
    //  🧩 DOM（齒輪 + Modal）— 只建立一次
    // ============================================================
    const gearBtn = document.createElement('div');
    gearBtn.id = 'lh5-settings-btn'; gearBtn.textContent = '⚙'; gearBtn.title = '設定';

    const overlay = document.createElement('div'); overlay.id = 'lh5-modal-overlay';
    const modal = document.createElement('div'); modal.id = 'lh5-modal';
    const now = new Date();
    const dateStr = now.getFullYear() + '-' + String(now.getMonth()+1).padStart(2,'0') + '-' + String(now.getDate()).padStart(2,'0');
    modal.innerHTML = `<h2>⚙ 設定 <span style="font-size:11px;color:#666;font-weight:normal">v2.23 (${dateStr})</span></h2><div id="lh5-modal-body"></div><div id="lh5-modal-close-hint">關閉</div>`;
    overlay.appendChild(modal); document.body.appendChild(overlay);

    gearBtn.addEventListener('click', () => { renderSettings(); overlay.classList.add('open'); });
    overlay.addEventListener('click', e => { if (e.target === overlay || e.target.id === 'lh5-modal-close-hint') overlay.classList.remove('open'); });

    // ============================================================
    //  📋 設定面板
    // ============================================================
    const SETTINGS_DEF = [
        { key: 'bossPinAlive', label: '世界王自動更新置頂', desc: '將「存活中」的世界王自動排到列表最前面' },
        { key: 'bagSearch', label: '背包物品檢索', desc: '在背包上方新增搜尋框與 +4~+10 強化篩選下拉' },
        { key: 'tradeMoneySearch', label: '交易所金錢搜尋', desc: '在交易所新增金額模糊搜尋 + 價格簡寫' },
        { key: 'nameChange', label: '變更姓名', desc: '自訂顯示名稱（不影響伺服器）' },
        { key: 'autoFarm', label: '🤖 掛機腳本', desc: 'MP過低自動回大廳，MP足夠自動前往地圖掛機' },
    ];
    function getStored(key, def) {
        try { const r = localStorage.getItem(key); return r !== null ? r : def; } catch (_) { return def; }
    }
    function renderSettings() {
        const s = loadSettings();
        let html = SETTINGS_DEF.map(d => {
            const c = s[d.key] ? 'checked' : '';
            return `<div class="lh5-switch-row"><label class="lh5-switch-label"><div>${d.label}</div>${d.desc?`<div class="desc">${d.desc}</div>`:''}</label><label class="lh5-toggle"><input type="checkbox" data-key="${d.key}" ${c}><span class="slider"></span></label></div>`;
        }).join('');
        document.getElementById('lh5-modal-body').innerHTML = html;
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
        // 🤖 掛機腳本開關開啟時，插入參數 UI
        if (s.autoFarm) {
            const farmLowVal = localStorage.getItem(FARM_LOW_KEY) || '10';
            const farmHighVal = localStorage.getItem(FARM_HIGH_KEY) || '80';
            const farmZoneVal = localStorage.getItem(FARM_ZONE_KEY) || 'zone_07';
            const farmZoneName = FARM_ZONES.find(z => z.id === farmZoneVal)?.name || '古魯丁地監2樓';
            const mpEnabled = localStorage.getItem(FARM_MP_ENABLED_KEY) !== '0'; // 預設 1
            const hpEnabled = localStorage.getItem(FARM_HP_ENABLED_KEY) === '1';
            const autoRunEnabled = localStorage.getItem(FARM_AUTO_RUN_KEY) !== '0'; // 預設勾選
            const hpLowVal = localStorage.getItem(FARM_HP_LOW_KEY) || '30';
            const hpHighVal = localStorage.getItem(FARM_HP_HIGH_KEY) || '80';
            const lobbyMode = 'toLobby'; // 固定回大廳
            const rows = document.querySelectorAll('#lh5-modal-body .lh5-switch-row');
            for (const row of rows) {
                const cb = row.querySelector('input[data-key="autoFarm"]');
                if (cb) {
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
                            <div style="display:flex;align-items:center;gap:8px;font-size:12px;color:#ccc">
                                <span>地圖：</span>
                                <input id="lh5-farm-filter" type="text" placeholder="🔍 檢索地圖…" style="width:60px;background:#0d0d18;border:1px solid #333;border-radius:4px;padding:3px 6px;color:#e0d5c1;font-size:12px;outline:none">
                                <select id="lh5-farm-zone" size="6" style="flex:1;background:#0d0d18;border:1px solid #333;border-radius:4px;color:#e0d5c1;font-size:12px;outline:none;cursor:pointer">
                                    ${FARM_ZONES.map(z => `<option value="${z.id}"${z.id===farmZoneVal?' selected':''}>${z.name}</option>`).join('')}
                                </select>
                            </div>
                            <div style="display:flex;align-items:center;gap:8px;margin-top:6px;font-size:12px;color:#ccc">
                                <span>回大廳方式：</span>
                                <select id="lh5-farm-lobby-mode" style="flex:1;background:#0d0d18;border:1px solid #333;border-radius:4px;padding:3px 6px;color:#e0d5c1;font-size:12px;outline:none;cursor:pointer">
                                    <option value="toLobby" selected>🏠 回大廳（socket.emit('toLobby')）</option>

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
            document.getElementById('lh5-farm-lobby-weapon')?.addEventListener('change', function(){
                localStorage.setItem(FARM_LOBBY_WEAPON_KEY, this.value);
            });
            document.getElementById('lh5-farm-zone-weapon')?.addEventListener('change', function(){
                localStorage.setItem(FARM_ZONE_WEAPON_KEY, this.value);
            });
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
        let _lobbyMode = 'selectChar';

        function loadConfig() {
            try {
                _mpEnabled = localStorage.getItem(FARM_MP_ENABLED_KEY) !== '0';
                _hpEnabled = localStorage.getItem(FARM_HP_ENABLED_KEY) === '1';
                _mpLow = parseInt(localStorage.getItem(FARM_LOW_KEY), 10) || 10;
                _mpHigh = parseInt(localStorage.getItem(FARM_HIGH_KEY), 10) || 80;
                _hpLow = parseInt(localStorage.getItem(FARM_HP_LOW_KEY), 10) || 30;
                _hpHigh = parseInt(localStorage.getItem(FARM_HP_HIGH_KEY), 10) || 80;
                _targetZone = localStorage.getItem(FARM_ZONE_KEY) || 'zone_07';
                _lobbyMode = localStorage.getItem(FARM_LOBBY_MODE_KEY) || 'selectChar';
                _reconnectSlot = parseInt(localStorage.getItem(FARM_SLOT_KEY), 10) || 0;
                _reconnectSec = parseInt(localStorage.getItem(FARM_RECONNECT_KEY), 10) || 300;
                if (_reconnectSlot < 0 || _reconnectSlot > 2) _reconnectSlot = 0;
                if (_reconnectSec < 10) _reconnectSec = 10;
                if (_reconnectSec > 3600) _reconnectSec = 3600;
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

            // 判斷是否該回大廳（MP 或 HP 任一啟用且低於門檻）
            let shouldRest = false;
            if (_mpEnabled && mp < _mpLow) shouldRest = true;
            if (_hpEnabled && hp < _hpLow) shouldRest = true;

            if (shouldRest) {
                if (!_isResting) {
                    _isResting = true;
                    goLobby();
                }
                return;
            }

            // 判斷是否該出發：所有啟用的條件都高於門檻
            let canGo = true;
            if (_mpEnabled && mp <= _mpHigh) canGo = false;
            if (_hpEnabled && hp <= _hpHigh) canGo = false;

            if (canGo) {
                if (_isResting || (targetName && zoneName !== targetName)) {
                    _isResting = false;
                    goToZone();
                }
            }
            // 在中間區間：不做任何事，維持現狀
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
            if (timer) { clearInterval(timer); timer = null; }
            timer = setInterval(tick, 2000);
            // 斷線重連巡邏
            if (_reconnectTimer) { clearInterval(_reconnectTimer); _reconnectTimer = null; }
            _reconnectTimer = setInterval(reconnectCheck, _reconnectSec * 1000);
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
            // 移除齒輪動畫
            const gb = document.getElementById('lh5-settings-btn');
            if (gb) gb.classList.remove('lh5-running');
        }

        function disable() {
            stop();
        }

        function isRunning() { return _enabled; }

        return { tryStart, disable, runWithConfig, stop, isRunning };
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
                cd.textContent = `（${_afkCountdown}s 後自動登入）`;
            } else {
                const old = document.querySelector('.lh5-login-cd');
                if (old) old.remove();
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
    //  ⚙ 齒輪掛載（topbar gold-box 右邊）
    // ============================================================
    function mountGear() {
        const tb = document.getElementById('topbar'); if (!tb) { setTimeout(mountGear, 300); return; }
        const gb = tb.querySelector('.gold-box');
        if (gb) { if (!gb.parentNode.querySelector('#lh5-settings-btn')) gb.after(gearBtn); }
        else { if (!tb.querySelector('#lh5-settings-btn')) tb.appendChild(gearBtn); }
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
	            if (s.autoFarm && (autoFarmFeature.isRunning() || autoRunEnabled)) {
	                autoFarmFeature.stop();
	                autoFarmFeature.runWithConfig();
	            } else if (autoFarmFeature.isRunning()) {
	                // 開關關了但還在跑→停掉
	                autoFarmFeature.stop();
	            }

        }

        // 交易所金錢搜尋：檢查是否需要重新注入
        if (document.getElementById('trade-search') && !document.getElementById('lh5-trade-money')) {
            const s2 = loadSettings();
            if (s2.tradeMoneySearch) tradeMoneyFeature.tryStart();
        }

        // EXP 條顯示 exp/expToNext（取代百分比）
        const expTxt = document.getElementById('t-exp-txt');
        const expBar = document.getElementById('t-exp-bar');
        if (expTxt && expBar) {
            try {
                const w = typeof unsafeWindow !== 'undefined' ? unsafeWindow : window;
                const c = w.__lh5_char;
                if (c && c.exp !== undefined && c.expToNext !== undefined) {
                    const pct = expBar.style.width || '0%';
                    expTxt.textContent = pct + '  ' + c.exp + ' / ' + c.expToNext;
                }
            } catch(_) {}
        }
    }, 400);

})();
