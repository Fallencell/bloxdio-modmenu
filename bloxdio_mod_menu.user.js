// ==UserScript==
// @name         Bloxd.io Ultimate Mod Menu
// @namespace    https://github.com/Fallencell/bloxdio-modmenu
// @namespace    https://www.tampermonkey.net/
// @version      3.0
// @description  Power-user mod menu for Bloxd.io: Custom crosshairs, auto-pickup, ESP, killaura, speed, noclip, fly, rainbow, night mode, notifications, and AGGRESSIVE anti-cheat bypass. Author: Fallencell
// @author       Fallencell
// @match        *://bloxd.io/*
// @icon         https://cdn.discordapp.com/attachments/1147409720076935189/1159516375396659320/Client_v1.0_Watermark.png
// @grant        none
// @run-at       document-start
// ==/UserScript==

(function () {
    'use strict';

    // ====== CONFIGURATION & STATE ======
    const CROSSHAIRS = [
        {name: "Classic", svg: `<svg width="36" height="36"><circle cx="18" cy="18" r="3" fill="CURRENT_COLOR"/><line x1="18" y1="2" x2="18" y2="34" stroke="CURRENT_COLOR" stroke-width="2"/><line x1="2" y1="18" x2="34" y2="18" stroke="CURRENT_COLOR" stroke-width="2"/></svg>`},
        {name: "Dot", svg: `<svg width="36" height="36"><circle cx="18" cy="18" r="4" fill="CURRENT_COLOR"/></svg>`},
        {name: "X", svg: `<svg width="36" height="36"><line x1="5" y1="5" x2="31" y2="31" stroke="CURRENT_COLOR" stroke-width="3"/><line x1="31" y1="5" x2="5" y2="31" stroke="CURRENT_COLOR" stroke-width="3"/></svg>`},
        {name: "Chevron", svg: `<svg width="36" height="36"><polyline points="7,13 18,27 29,13" fill="none" stroke="CURRENT_COLOR" stroke-width="4"/></svg>`},
        {name: "Plus", svg: `<svg width="36" height="36"><rect x="16" y="7" width="4" height="22" fill="CURRENT_COLOR"/><rect x="7" y="16" width="22" height="4" fill="CURRENT_COLOR"/></svg>`},
    ];
    const CROSSHAIR_COLORS = ["#00FFFF", "#FF0000", "#00FF00", "#FFFF00", "#FFFFFF", "#FFA500"];
    let selectedCrosshair = 0, selectedColor = 0;

    const MODS = [
        { key: "speed",         label: "Speed Hack",       hotkey: "G",    default: false, desc: "Dramatically increase your player movement speed for quick map traversal." },
        { key: "noclip",        label: "Phase (NoClip)",   hotkey: "H",    default: false, desc: "Move through walls and obstacles unhindered." },
        { key: "tpup",          label: "Testhack (TP Up)", hotkey: "K",    default: false, desc: "Teleport your character upwards (useful for parkour/escape)." },
        { key: "freecam",       label: "Freecam",          hotkey: "Y",    default: false, desc: "Detach camera and fly around the map freely. WASD/Space/Shift to control." },
        { key: "killaura",      label: "Killaura",         hotkey: "F",    default: false, desc: "Automatically attacks the nearest player within range." },
        { key: "autoclicker",   label: "Autoclicker",      hotkey: "R",    default: false, desc: "Rapidly auto-click for fast attacking or mining." },
        { key: "notifs",        label: "Notifications",    hotkey: "M",    default: false, desc: "Display on-screen notifications for kills, low HP, and more." },
        { key: "crosshair",     label: "Crosshair",        hotkey: "U",    default: false, desc: "Overlay a custom crosshair at screen center." },
        { key: "esp",           label: "Player ESP",       hotkey: "E",    default: false, desc: "Highlight enemy and teammate positions with on-screen boxes and names." },
        { key: "fly",           label: "Fly (hold: Space/Shift)", hotkey: "B", default: false, desc: "Allows flying by holding Space (up) or Shift (down)." },
        { key: "rainbow",       label: "Rainbow Skin",     hotkey: "N",    default: false, desc: "Turns your player skin into a cycling rainbow color." },
        { key: "nightmode",     label: "Night Mode",       hotkey: "Z",    default: false, desc: "Darkens the game visuals for night aesthetics or stealth." },
        { key: "autopickup",    label: "Auto-Pickup",      hotkey: "P",    default: false, desc: "Automatically pick up nearby items when close." },
        { key: "anticheat",     label: "Anti-Cheat Bypass",hotkey: "O",    default: false, desc: "Activates AGGRESSIVE anti-cheat bypass (recommended ON at all times)." },
    ];
    const DEFAULT_FOV = 100;
    let state = {};
    MODS.forEach(mod => state[mod.key] = mod.default);
    state.fov = DEFAULT_FOV;
    state.menuVisible = true;

    // ====== GUI ======
    function createMenu() {
        const style = document.createElement('style');
        style.textContent = `
        #bloxdio-modmenu {
            position: fixed; top: 80px; left: 10px; z-index: 99999;
            background: rgba(24,26,32,0.98); color: #fff; border-radius: 12px;
            border: 2px solid #555; box-shadow: 0 8px 32px #000b;
            font-family: 'Segoe UI', Arial, sans-serif; font-size: 15px;
            width: 340px; padding: 20px 18px 15px 18px; user-select: none;
        }
        #bloxdio-modmenu.hide { display:none !important }
        #bloxdio-modmenu h2 { text-align: center; font-size: 21px; margin: 0 0 16px 0; letter-spacing: .5px; }
        #bloxdio-modmenu .mod-row { display: flex; align-items: center; margin-bottom: 7px;}
        #bloxdio-modmenu label { flex: 1; cursor: pointer; display:flex; align-items:center;}
        #bloxdio-modmenu input[type="checkbox"] { margin-right: 8px; }
        #bloxdio-modmenu input[type="range"] { flex: 1; margin-left: 8px;}
        #bloxdio-modmenu .hotkey { background: #222; color: #99f; font-size: 12px; padding: 1px 6px; border-radius: 6px; margin-left: 4px;}
        #bloxdio-modmenu .desc { color:#ccc;font-size:12px;margin-left:24px;margin-bottom:3px;margin-top:-3px;}
        #bloxdio-modmenu .footer { margin-top: 10px; color: #aaa; font-size: 13px; text-align: center;}
        #bloxdio-modmenu .credits { margin-top: 10px; color: #789; font-size: 13px; text-align: center;}
        #bloxdio-modmenu .divider { border-bottom: 1px solid #444; margin: 11px 0 9px 0;}
        #bloxdio-crosshair { position: fixed; left: 50vw; top: 50vh; z-index: 99997; pointer-events: none; }
        #bloxdio-modmenu .slider-label { flex:0 0 110px; }
        #bloxdio-modmenu input[type="range"] { accent-color: #0ff; }
        #crosshair-controls { display:flex;align-items:center;gap:7px;margin-bottom:6px;}
        #crosshair-preview {display:inline-block;width:38px;height:38px;vertical-align:middle;}
        .crosshair-opt {padding:0 6px;}
        `;
        document.head.appendChild(style);

        // Menu HTML
        const menu = document.createElement('div');
        menu.id = "bloxdio-modmenu";
        let html = `<h2>Bloxd.io Mod Menu</h2>
        <div id="crosshair-controls">
            <label style="font-size:14px;margin-right:7px;">Crosshair:</label>
            <select id="crosshair-style">${CROSSHAIRS.map((c,i)=>`<option value="${i}">${c.name}</option>`)}</select>
            <select id="crosshair-color">${CROSSHAIR_COLORS.map((c,i)=>`<option value="${i}" style="color:${c};background:${c};">&#9632;</option>`)}</select>
            <span id="crosshair-preview"></span>
        </div>
        <div class="divider"></div>`;
        MODS.forEach(mod => {
            html += `<div class="mod-row">
                <label title="${mod.desc}">
                  <input type="checkbox" id="mod_${mod.key}" ${mod.default ? "checked" : ""}>
                  ${mod.label} <span class="hotkey">${mod.hotkey}</span>
                </label>
            </div>
            <div class="desc">${mod.desc}</div>`;
        });
        html += `<div class="divider"></div>
            <div class="mod-row" style="margin-bottom:0;">
                <span class="slider-label">Field of View:</span>
                <input type="range" min="60" max="160" value="${DEFAULT_FOV}" id="mod_fov" style="width:110px;">
                <span id="fov_val">${DEFAULT_FOV}</span>
            </div>
            <div class="divider"></div>
            <div class="footer"><b>Menu:</b> <kbd>/</kbd> &nbsp;|&nbsp; <b>GUI:</b> <kbd>L</kbd></div>
            <div class="credits">Author: <b>Fallencell</b> &mdash; 2025</div>`;
        menu.innerHTML = html;
        document.body.appendChild(menu);

        // UI events
        function updateCrosshairPreview() {
            let svg = CROSSHAIRS[selectedCrosshair].svg.replace(/CURRENT_COLOR/g, CROSSHAIR_COLORS[selectedColor]);
            document.getElementById('crosshair-preview').innerHTML = svg;
            if(state.crosshair) crosshairToggle(); // update live
        }
        document.getElementById('crosshair-style').onchange = e => { selectedCrosshair = +e.target.value; updateCrosshairPreview(); };
        document.getElementById('crosshair-color').onchange = e => { selectedColor = +e.target.value; updateCrosshairPreview(); };
        updateCrosshairPreview();

        MODS.forEach(mod => {
            document.getElementById(`mod_${mod.key}`).onchange = e => {
                state[mod.key] = e.target.checked;
                if(mod.key === "crosshair") crosshairToggle();
            };
        });
        document.getElementById("mod_fov").oninput = e => {
            state.fov = Number(e.target.value);
            document.getElementById("fov_val").textContent = e.target.value;
            updateFOV();
        };

        // Menu show/hide
        function toggleMenu() {
            state.menuVisible = !state.menuVisible;
            menu.classList.toggle('hide', !state.menuVisible);
        }
        document.addEventListener('keydown', function(e) {
            if(document.activeElement.tagName === "INPUT" || document.activeElement.tagName === "TEXTAREA") return;
            if(e.key === '/' || (e.key === 'l' && !e.repeat)) toggleMenu();
        });
    }

    // ====== HOTKEYS ======
    document.addEventListener('keydown', function(e) {
        if(document.activeElement.tagName === "INPUT" || document.activeElement.tagName === "TEXTAREA") return;
        MODS.forEach(mod => {
            if(e.key.toUpperCase() === mod.hotkey && !e.repeat) {
                state[mod.key] = !state[mod.key];
                document.getElementById(`mod_${mod.key}`).checked = state[mod.key];
                if(mod.key === "crosshair") crosshairToggle();
            }
        });
    });

    // ====== MEMORY SCANNERS ======
    function getPlayer() {
        for(const k in window) {
            try {
                const v = window[k];
                if(v && typeof v === "object" && v.hasOwnProperty("x") && v.hasOwnProperty("y") && v.hasOwnProperty("z") && v.hasOwnProperty("velocity")) {
                    return v;
                }
            } catch(_) {}
        }
        return null;
    }
    function getAllPlayers() {
        for(const k in window) {
            try {
                const arr = window[k];
                if(Array.isArray(arr) && arr.length > 1 && arr[0] && typeof arr[0] === "object" && arr[0].x !== undefined && arr[0].y !== undefined) {
                    return arr;
                }
            } catch(_) {}
        }
        return [];
    }
    function getCamera() {
        for(const k in window) {
            try {
                const v = window[k];
                if(v && v.camera && v.camera.isPerspectiveCamera) {
                    return v.camera;
                }
            } catch(_) {}
        }
        return null;
    }

    // ====== MOD IMPLEMENTATIONS ======
    function speedMod(player) {
        if(state.speed && player) player.speed = 0.24;
        else if(player) player.speed = 0.12;
    }
    function noclipMod(player) {
        if(state.noclip && player) player.noclip = true;
        else if(player) player.noclip = false;
    }
    function testhackMod(player) {
        if(state.tpup && player) {
            player.y += 1.1;
            state.tpup = false;
            document.getElementById("mod_tpup").checked = false;
        }
    }
    let freecamActive = false, freecamPos = {x:0, y:0, z:0};
    function freecamMod(player, camera) {
        if(state.freecam && camera) {
            if(!freecamActive) {
                freecamPos.x = camera.position.x;
                freecamPos.y = camera.position.y;
                freecamPos.z = camera.position.z;
                freecamActive = true;
            }
            if(keymap["w"]) freecamPos.z -= 0.8;
            if(keymap["s"]) freecamPos.z += 0.8;
            if(keymap["a"]) freecamPos.x -= 0.8;
            if(keymap["d"]) freecamPos.x += 0.8;
            if(keymap[" "]) freecamPos.y += 0.8;
            if(keymap["Shift"]) freecamPos.y -= 0.8;
            camera.position.x = freecamPos.x;
            camera.position.y = freecamPos.y;
            camera.position.z = freecamPos.z;
        } else if(freecamActive && camera) {
            freecamActive = false;
            if(player) {
                camera.position.x = player.x;
                camera.position.y = player.y + 3;
                camera.position.z = player.z + 7;
            }
        }
    }
    function killauraMod(player, allPlayers) {
        if(state.killaura && player && allPlayers && allPlayers.length > 1) {
            let minDist = 999, target = null;
            for(const p of allPlayers) {
                if(p === player || !p.x) continue;
                let dx = p.x - player.x, dz = p.z - player.z;
                let d = Math.sqrt(dx*dx + dz*dz);
                if(d < minDist && d < 4) { minDist = d; target = p; }
            }
            if(target) {
                document.dispatchEvent(new MouseEvent("mousedown"));
                setTimeout(()=>{document.dispatchEvent(new MouseEvent("mouseup"));}, 15);
            }
        }
    }
    let autoclickInterval = null;
    function autoclickerMod() {
        if(state.autoclicker && !autoclickInterval) {
            autoclickInterval = setInterval(() => {
                document.dispatchEvent(new MouseEvent("mousedown"));
                setTimeout(()=>{document.dispatchEvent(new MouseEvent("mouseup"));}, 15);
            }, 90);
        } else if(!state.autoclicker && autoclickInterval) {
            clearInterval(autoclickInterval);
            autoclickInterval = null;
        }
    }
    let playerLastHP = null;
    function notifsMod(player) {
        if(state.notifs && player) {
            if(playerLastHP !== null && player.hp !== playerLastHP && player.hp < playerLastHP) {
                showNotif("You took damage! HP: "+player.hp);
            }
            playerLastHP = player.hp;
        }
    }
    function showNotif(msg) {
        let notif = document.createElement("div");
        notif.style = "position:fixed;top:30px;right:30px;z-index:99999;background:#222;padding:15px 25px;color:#fff;border-radius:10px;font-size:16px;box-shadow:0 2px 12px #000a;opacity:0.95;";
        notif.textContent = msg;
        document.body.appendChild(notif);
        setTimeout(()=>notif.remove(), 1800);
    }
    function crosshairToggle() {
        let el = document.getElementById("bloxdio-crosshair");
        if(state.crosshair && !el) {
            el = document.createElement("div");
            el.id = "bloxdio-crosshair";
            el.style = "position:fixed;left:50vw;top:50vh;transform:translate(-50%,-50%);z-index:99997;pointer-events:none;";
            document.body.appendChild(el);
        }
        if(state.crosshair) {
            let svg = CROSSHAIRS[selectedCrosshair].svg.replace(/CURRENT_COLOR/g, CROSSHAIR_COLORS[selectedColor]);
            document.getElementById("bloxdio-crosshair").innerHTML = svg;
        } else if(el) {
            el.remove();
        }
    }
    function espMod(player, allPlayers) {
        if(!state.esp) {
            let e = document.getElementById("bloxdio-esp");
            if(e) e.remove();
            return;
        }
        let canvas = document.getElementById("bloxdio-esp");
        if(!canvas) {
            canvas = document.createElement("canvas");
            canvas.id = "bloxdio-esp";
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            canvas.style = "position:fixed;left:0;top:0;pointer-events:none;z-index:99996;";
            document.body.appendChild(canvas);
        }
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        let ctx = canvas.getContext("2d");
        ctx.clearRect(0,0,canvas.width,canvas.height);
        let camera = getCamera();
        if(!camera) return;
        function project(x,y,z) {
            let dx = x - camera.position.x, dy = y - camera.position.y, dz = z - camera.position.z;
            let scale = (camera.fov/100)*(canvas.height/2)/Math.abs(dz||1);
            return [canvas.width/2 + dx*scale, canvas.height/2 - dy*scale];
        }
        for(const p of allPlayers) {
            if(p === player) continue;
            let [x,y] = project(p.x,p.y,p.z);
            ctx.strokeStyle = "#0ff";
            ctx.lineWidth = 3;
            ctx.strokeRect(x-15, y-34, 32, 66);
            ctx.fillStyle = "#fff";
            ctx.font = "bold 14px Arial";
            ctx.fillText(p.name||"Player", x-16, y-36);
        }
    }
    function flyMod(player) {
        if(state.fly && player) {
            if(keymap[' ']) player.velocity.y = 0.7;
            else if(keymap['Shift']) player.velocity.y = -0.7;
            else player.velocity.y = 0;
        }
    }
    function rainbowMod(player) {
        if(state.rainbow && player) {
            let h = (Date.now()/10)%360;
            player.color = `hsl(${h},92%,54%)`;
        }
    }
    function nightModeMod() {
        if(state.nightmode) {
            document.body.style.filter = "invert(.85) hue-rotate(180deg) brightness(0.7)";
        } else {
            document.body.style.filter = "";
        }
    }
    function autopickupMod(player) {
        if(!state.autopickup || !player) return;
        for(const k in window) {
            try {
                const arr = window[k];
                if(Array.isArray(arr) && arr.length && arr[0] && arr[0].x !== undefined && arr[0].y !== undefined && (arr[0].active !== undefined || arr[0].collect !== undefined)) {
                    arr.forEach(obj => {
                        if(obj.active && Math.abs(obj.x-player.x)<3 && Math.abs(obj.y-player.y)<3 && Math.abs(obj.z-player.z)<3) {
                            if(typeof obj.collect === "function") obj.collect();
                            else obj.active = false;
                        }
                    });
                }
            } catch(_) {}
        }
    }

    // ====== AGGRESSIVE ANTI-CHEAT BYPASS ======
    function anticheatBypass() {
        if (!state.anticheat) return;

        // 1. Patch ban/kick/anticheat functions at all levels
        for (const k in window) {
            try {
                if (typeof window[k] === "function" && /ban|anti.?cheat|punish|kick|report|detect|flag/i.test(k)) {
                    window[k] = function () { /* noop - blocked */ };
                } else if (window[k] && typeof window[k] === "object") {
                    for (const j in window[k]) {
                        if (typeof window[k][j] === "function" && /ban|anti.?cheat|punish|kick|report|detect|flag/i.test(j)) {
                            window[k][j] = function () { /* noop - blocked */ };
                        }
                    }
                }
            } catch (_) {}
        }

        // 2. Defang WebSocket send/intercept suspicious packets
        if (!window._ws_patched) {
            window._ws_patched = true;
            const wsSend = WebSocket.prototype.send;
            WebSocket.prototype.send = function (data) {
                try {
                    if (typeof data === "string") {
                        if (/ban|kick|punish|report|cheat|flag/i.test(data)) return;
                    }
                } catch (_) {}
                return wsSend.apply(this, arguments);
            };
        }

        // 3. Tamper with Object.defineProperty for critical vars
        const denyList = ["isCheating", "banned", "banReason", "cheatDetected", "isInjected", "modded", "injected", "exploit"];
        const _defineProperty = Object.defineProperty;
        Object.defineProperty = function (obj, prop, desc) {
            if (denyList.includes(prop) && desc && desc.set) {
                desc.set = function () {};
            }
            if (denyList.includes(prop) && desc && desc.get) {
                desc.get = function () { return false; };
            }
            return _defineProperty.apply(this, arguments);
        };

        // 4. Proxy/freeze player state so anti-cheat sees legit values
        try {
            let player = getPlayer();
            if (player && !player._ac_patched) {
                player._ac_patched = true;
                let fakeProps = ["speed", "noclip", "fly", "isCheating", "modded", "hacks"];
                fakeProps.forEach(p => {
                    try {
                        Object.defineProperty(player, p, {
                            get: () => { return (p === "speed" ? 0.12 : false); },
                            set: () => {},
                            configurable: true
                        });
                    } catch (_) {}
                });
            }
        } catch (_) {}

        // 5. Block error popups (ban/kick dialogs)
        let origAlert = window.alert;
        window.alert = function(msg) {
            if (/ban|kick|punish|cheat|anticheat|exploit|hacked|detected|illegal/i.test(msg)) return;
            return origAlert.apply(this, arguments);
        };

        // 6. Remove event listeners for security events
        try {
            const suspicious = ["cheat", "ban", "kick", "flag", "report", "security", "illegal"];
            suspicious.forEach(evt => {
                window.removeEventListener(evt, ()=>{});
                document.removeEventListener(evt, ()=>{});
            });
        } catch (_) {}

        // 7. Patch Function.prototype.toString to hide tampered code
        if (!Function.prototype._ac_toString_patched) {
            Function.prototype._ac_toString_patched = true;
            const realToString = Function.prototype.toString;
            Function.prototype.toString = function() {
                if (this.toString.name === 'anticheatBypass' || this.name === 'anticheatBypass') {
                    return "function anticheatBypass() { [native code] }";
                }
                return realToString.apply(this, arguments);
            };
        }

        // 8. Destroy mutation observers (anti-cheat often uses them)
        if (window.MutationObserver) {
            try {
                window.MutationObserver = class extends window.MutationObserver {
                    constructor() { super(() => {}); }
                    observe() {}
                    disconnect() {}
                };
            } catch(_) {}
        }

        // 9. Patch setInterval/setTimeout to block anti-cheat routines
        if (!window._ac_timer_patched) {
            window._ac_timer_patched = true;
            const origSetInterval = window.setInterval;
            const origSetTimeout = window.setTimeout;
            window.setInterval = function(fn, t) {
                if (typeof fn === "function" && fn.toString().match(/cheat|ban|kick|flag|punish|integrity|scan|report/i)) return null;
                return origSetInterval.apply(this, arguments);
            };
            window.setTimeout = function(fn, t) {
                if (typeof fn === "function" && fn.toString().match(/cheat|ban|kick|flag|punish|integrity|scan|report/i)) return null;
                return origSetTimeout.apply(this, arguments);
            };
        }

        // 10. Patch fetch/XHR for anti-cheat calls
        if (!window._ac_fetch_patched) {
            window._ac_fetch_patched = true;
            if (window.fetch) {
                const origFetch = window.fetch;
                window.fetch = function() {
                    if (arguments[0] && typeof arguments[0] === "string" && /anticheat|report|flag|ban|kick|punish|exploit/i.test(arguments[0])) {
                        return new Promise(()=>{});
                    }
                    return origFetch.apply(this, arguments);
                };
            }
            if (window.XMLHttpRequest) {
                const origOpen = window.XMLHttpRequest.prototype.open;
                window.XMLHttpRequest.prototype.open = function(method, url) {
                    if (url && /anticheat|report|flag|ban|kick|punish|exploit/i.test(url)) {
                        this.abort();
                        return;
                    }
                    return origOpen.apply(this, arguments);
                };
            }
        }
    }

    // ====== FOV ======
    function updateFOV() {
        let camera = getCamera();
        if(camera) {
            camera.fov = state.fov;
            if(camera.updateProjectionMatrix) camera.updateProjectionMatrix();
        }
    }

    // ====== INPUTS ======
    let keymap = {};
    document.addEventListener('keydown', e => keymap[e.key] = true);
    document.addEventListener('keyup', e => keymap[e.key] = false);

    // ====== MAIN GAME LOOP ======
    function mainLoop() {
        let player = getPlayer();
        let allPlayers = getAllPlayers();
        let camera = getCamera();
        speedMod(player);
        noclipMod(player);
        testhackMod(player);
        freecamMod(player, camera);
        killauraMod(player, allPlayers);
        autoclickerMod();
        notifsMod(player);
        espMod(player, allPlayers);
        flyMod(player);
        rainbowMod(player);
        nightModeMod();
        autopickupMod(player);
        anticheatBypass();
        requestAnimationFrame(mainLoop);
    }

    // ====== INIT ======
    window.addEventListener('DOMContentLoaded', () => {
        createMenu();
        mainLoop();
    });
})();
