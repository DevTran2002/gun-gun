import * as THREE from 'three';

const _tempMateWorldPos = new THREE.Vector3();
const _tempNdc = new THREE.Vector3();

// Cấu hình màu sắc đặc trưng theo từng nhân vật
const CHARACTER_COLORS = {
    soldier: '#22e6a5',
    skeleton: '#ffe06a',
    vampire: '#ff5577'
};

// Hàm trả về chuỗi SVG đại diện cho avatar nhân vật
function getCharacterAvatarSvg(characterId) {
    switch (characterId) {
        case 'skeleton':
            // Biểu tượng khung xương
            return `<svg viewBox="0 0 24 24"><path fill="currentColor" d="M12 2a8 8 0 0 0-8 8c0 3.2 1.9 6 4.7 7.2l.3 2.8h6l.3-2.8A8 8 0 0 0 20 10a8 8 0 0 0-8-8zm-3 7.5a2 2 0 1 1 0 4 2 2 0 0 1 0-4zm6 0a2 2 0 1 1 0 4 2 2 0 0 1 0-4zm-4.5 7h3v2h-3v-2z"/></svg>`;
        case 'vampire':
            // Biểu tượng ma cà rồng
            return `<svg viewBox="0 0 24 24"><path fill="currentColor" d="M12 2l-3 4-5-1 2 5-4 2 4 4-2 6 6-3 2 3 2-3 6 3-2-6 4-4-4-2 2-5-5 1-3-4zm0 6a3 3 0 0 1 3 3c0 1.2-.7 2.2-1.7 2.7l.7 2.3-2-.7-2 .7.7-2.3C9.7 13.2 9 12.2 9 11a3 3 0 0 1 3-3z"/></svg>`;
        case 'soldier':
        default:
            // Biểu tượng chiến binh / lính
            return `<svg viewBox="0 0 24 24"><path fill="currentColor" d="M12 2C8 2 4.5 4.5 4 8.5v3c0 4.5 3.5 8 8 8.5 4.5-.5 8-4 8-8.5v-3C19.5 4.5 16 2 12 2zm0 3c2.5 0 5 1.5 5.5 3.5H6.5C7 6.5 9.5 5 12 5zm-6 6.5c0-.8.2-1.5.5-2h11c.3.5.5 1.2.5 2 0 3-2.5 5.5-6 6-3.5-.5-6-3-6-6z"/></svg>`;
    }
}

export class UIManager {
    constructor() {
        this.healthFill = document.getElementById('health-fill');
        this.healthText = document.getElementById('health-text');
        this.shieldFill = document.getElementById('shield-fill');
        this.shieldText = document.getElementById('shield-text');
        this.staminaFill = document.getElementById('stamina-fill');
        this.staminaText = document.getElementById('stamina-text');

        this.buffDamage = document.getElementById('buff-damage');
        this.buffDamageVal = document.getElementById('buff-damage-val');
        this.buffRapid = document.getElementById('buff-rapid');
        this.buffRapidVal = document.getElementById('buff-rapid-val');
        this.buffMulti = document.getElementById('buff-multi');
        this.buffMultiVal = document.getElementById('buff-multi-val');
        this.buffShield = document.getElementById('buff-shield');
        this.buffShieldVal = document.getElementById('buff-shield-val');
        this.buffCrit = document.getElementById('buff-crit');
        this.buffCritVal = document.getElementById('buff-crit-val');

        this.scoreVal = document.getElementById('score-value');
        this.waveVal = document.getElementById('wave-value');
        this.enemiesVal = document.getElementById('enemies-value');

        this.weaponName = document.getElementById('weapon-name');
        this.upgradeStats = document.getElementById('upgrade-stats');
        this.ammoCurrent = document.getElementById('ammo-current');
        this.ammoMax = document.getElementById('ammo-max');
        this.reloadBar = document.getElementById('reload-progress-bar');
        this.weaponSlots = [
            document.getElementById('slot-1'),
            document.getElementById('slot-2'),
            document.getElementById('slot-3'),
            document.getElementById('slot-4'),
            document.getElementById('slot-5')
        ];
        this.slot1Label = document.getElementById('slot-1-label');
        this.slot3Label = document.getElementById('slot-3-label');
        this.slotMedkitQty = document.getElementById('slot-medkit-qty');
        this.slotShieldQty = document.getElementById('slot-shield-qty');

        this.crosshair = document.getElementById('crosshair');
        this.hitmarker = document.getElementById('hitmarker');
        this.damageVignette = document.getElementById('damage-vignette');
        this.floatingContainer = document.getElementById('floating-numbers');
        this.bannerText = document.getElementById('announcement-banner');
        this.pickupAlert = document.getElementById('pickup-alert');

        this.bossContainer = document.getElementById('boss-health-container');
        this.bossFill = document.getElementById('boss-health-fill');

        this.radarCanvas = document.getElementById('radar-canvas');
        if (this.radarCanvas) {
            this.radarCtx = this.radarCanvas.getContext('2d');
        }

        // Vùng chứa biểu tượng đồng đội ngoài màn hình và danh sách đồng đội
        this.teammateContainer = document.getElementById('teammate-indicators');
        this.teamRoster = document.getElementById('team-roster');
        this.teammateMarkers = new Map();

        // Minimalist Survival Bottom HUD System Elements
        this.thBottomHud = document.getElementById('th-bottom-hud');
        this.thDistVal = document.getElementById('th-dist-val');
        this.thStatusPain = document.getElementById('th-status-pain');
        this.thStatusLight = document.getElementById('th-status-light');
        this.thHealthFill = document.getElementById('th-health-fill');
        this.thHealthVal = document.getElementById('th-health-val');
        this.thCircleWater = document.getElementById('th-circle-water');
        this.thCircleEnergy = document.getElementById('th-circle-energy');
        this.thAmmoCur = document.getElementById('th-ammo-cur');
        this.thAmmoReserve = document.getElementById('th-ammo-reserve');
        this.thActiveSlot = document.getElementById('th-active-slot');
        this.thActiveSilhouette = document.getElementById('th-active-silhouette');

        this.thSlot2 = document.getElementById('th-slot-2');
        this.thSlot3 = document.getElementById('th-slot-3');
        this.thQtyMedkit = document.getElementById('th-qty-medkit');

        // Thanh tiến trình sơ cứu Medkit 5 giây
        this.thMedkitChannel = document.getElementById('th-medkit-channel');
        this.thMedkitCountdown = document.getElementById('th-medkit-countdown');
        this.thMedkitFill = document.getElementById('th-medkit-channel-fill');

        this.bannerTimeout = null;
        this.pickupTimeout = null;

        // Cache dirty check để tối ưu 60 FPS, không gây layout reflow / GC rác
        this._lastPosX = -9999;
        this._lastPosY = -9999;
        this._lastCrossDisplay = null;
        this._lastSpreadGap = -1;
        this._lastHpVal = -1;
        this._lastMaxHp = -1;
        this._lastShVal = -1;
        this._lastMaxSh = -1;
        this._lastStPercent = -1;
        this._lastStText = '';
        this._lastUpgradesKey = '';
        this._lastVignettePulse = null;
        this._lastScore = -1;
        this._lastPhase = -1;
        this._lastEnemies = -1;
        this._lastWeaponId = '';
        this._lastUpgradeStats = '';
        this._lastAmmoCur = -1;
        this._lastAmmoMaxStr = '';
        this._lastReloadKey = '';
        this._lastSlotKey = '';
        this._lastBossVisible = null;
        this._lastBossPct = -1;
        this._lastRosterKey = '';

        // Survival Bottom HUD dirty cache
        this._lastDistVal = '';
        this._lastPainText = '';
        this._lastLightText = '';
        this._lastThHpText = '';
        this._lastThHpPct = -1;
        this._lastAmmoCurText = '';
        this._lastAmmoResText = '';
        this._lastCaliberText = '';
        this._lastActiveWeaponSilh = '';
        this._lastSurvivalSlotKey = '';
        this._thClicksBound = false;
    }

    updateStats(player, waveManager, score) {
        // Vị trí con trỏ cộng thêm Cursor Kickback (đẩy trực tiếp tọa độ tâm ngắm trên màn hình)
        const kickX = player.cursorKick ? player.cursorKick.x : 0;
        const kickY = player.cursorKick ? player.cursorKick.y : 0;
        const posX = Math.round(player.pointerScreen.x + kickX);
        const posY = Math.round(player.pointerScreen.y + kickY);

        if (posX !== this._lastPosX || posY !== this._lastPosY) {
            this._lastPosX = posX;
            this._lastPosY = posY;
            if (this.crosshair) {
                this.crosshair.style.left = `${posX}px`;
                this.crosshair.style.top = `${posY}px`;
            }
            if (this.hitmarker) {
                this.hitmarker.style.left = `${posX}px`;
                this.hitmarker.style.top = `${posY}px`;
            }
        }

        const shouldDisplay = player.pointerInCanvas ? '' : 'none';
        if (this._lastCrossDisplay !== shouldDisplay) {
            this._lastCrossDisplay = shouldDisplay;
            if (this.crosshair) this.crosshair.style.display = shouldDisplay;
            if (this.hitmarker) this.hitmarker.style.display = shouldDisplay;
        }

        // Cập nhật nón tản đạn mở rộng / co hẹp trực quan trên Crosshair (chỉ đổi CSS var khi giá trị pixel thay đổi)
        if (this.crosshair) {
            const spreadGap = Math.round(6 + (player.weapons?.currentSpreadDeg || 2) * 3.4);
            if (spreadGap !== this._lastSpreadGap) {
                this._lastSpreadGap = spreadGap;
                this.crosshair.style.setProperty('--spread-gap', `${spreadGap}px`);
            }
        }

        // 1. Health Bar (Đỏ) - Dirty check
        const hpVal = Math.ceil(player.health);
        if (hpVal !== this._lastHpVal || player.maxHealth !== this._lastMaxHp) {
            this._lastHpVal = hpVal;
            this._lastMaxHp = player.maxHealth;
            const hpPercent = Math.max(0, Math.min(100, (player.health / player.maxHealth) * 100));
            if (this.healthFill) this.healthFill.style.width = `${hpPercent}%`;
            if (this.healthText) this.healthText.textContent = `${hpVal} / ${player.maxHealth}`;
        }

        // 2. Shield Bar (Xanh lam) - Dirty check
        const shVal = Math.ceil(player.shield);
        if (shVal !== this._lastShVal || player.maxShield !== this._lastMaxSh) {
            this._lastShVal = shVal;
            this._lastMaxSh = player.maxShield;
            const shPercent = Math.max(0, Math.min(100, (player.shield / player.maxShield) * 100));
            if (this.shieldFill) this.shieldFill.style.width = `${shPercent}%`;
            if (this.shieldText) this.shieldText.textContent = `${shVal} / ${player.maxShield}`;
        }

        // Weapon & Ammo info
        const ammoInfo = player.weapons.getCurrentAmmo();
        const curWeapon = player.weapons.getCurrentWeapon();

        // 3. Stamina / Ammo Bar (Cam - thanh thứ 3) - Dirty check
        let stPercent = 100;
        let stText = 'CẬN CHIẾN';
        if (!curWeapon.isKnife) {
            if (ammoInfo.isReloading) {
                stPercent = Math.max(0, Math.min(100, Math.round(ammoInfo.reloadProgress * 100)));
                stText = `NẠP ĐẠN ${stPercent}%`;
            } else {
                stPercent = Math.max(0, Math.min(100, Math.round((ammoInfo.current / ammoInfo.max) * 100)));
                stText = `BĂNG ĐẠN ${ammoInfo.current}/${ammoInfo.max}`;
            }
        }
        if (stPercent !== this._lastStPercent || stText !== this._lastStText) {
            this._lastStPercent = stPercent;
            this._lastStText = stText;
            if (this.staminaFill) this.staminaFill.style.width = `${stPercent}%`;
            if (this.staminaText) this.staminaText.textContent = stText;
        }

        // 4. Hàng ô Buff RPG - Dirty check
        const upgrades = player.weapons.upgrades;
        const isRegening = player.shieldRegenTimer <= 0 && player.shield < player.maxShield;
        const upgradesKey = `${upgrades.damage}_${upgrades.rapid}_${upgrades.multishot}_${isRegening}_${player.shield >= player.maxShield}_${curWeapon.critMultiplier}_${curWeapon.id}`;
        if (upgradesKey !== this._lastUpgradesKey) {
            this._lastUpgradesKey = upgradesKey;
            if (this.buffDamage) {
                this.buffDamage.classList.toggle('active', upgrades.damage > 0);
                if (this.buffDamageVal) this.buffDamageVal.textContent = `×${player.weapons.damageBoost.toFixed(1)}`;
            }
            if (this.buffRapid) {
                this.buffRapid.classList.toggle('active', upgrades.rapid > 0);
                if (this.buffRapidVal) this.buffRapidVal.textContent = `×${player.weapons.fireRateBoost.toFixed(2)}`;
            }
            if (this.buffMulti) {
                this.buffMulti.classList.toggle('active', upgrades.multishot > 0);
                if (this.buffMultiVal) this.buffMultiVal.textContent = `${player.weapons.beamCount} TIA`;
            }
            if (this.buffShield) {
                this.buffShield.classList.toggle('active', isRegening || player.shield >= player.maxShield);
                if (this.buffShieldVal) this.buffShieldVal.textContent = isRegening ? 'REGEN' : (player.shield >= player.maxShield ? 'FULL' : 'WAIT');
            }
            if (this.buffCrit) {
                this.buffCrit.classList.toggle('active', true);
                if (this.buffCritVal) this.buffCritVal.textContent = `×${(curWeapon.critMultiplier || 2.0).toFixed(1)}`;
            }
        }

        // Low health vignette - Dirty check
        if (this.damageVignette) {
            const shouldPulse = player.health <= 30 && !player.isDead;
            if (shouldPulse !== this._lastVignettePulse) {
                this._lastVignettePulse = shouldPulse;
                if (shouldPulse) {
                    this.damageVignette.classList.add('critical-pulsing');
                } else {
                    this.damageVignette.classList.remove('critical-pulsing');
                }
            }
        }

        // Score & Phase - Dirty check
        if (score !== this._lastScore) {
            this._lastScore = score;
            if (this.scoreVal) this.scoreVal.textContent = score.toLocaleString();
        }
        if (waveManager.currentPhase !== this._lastPhase) {
            this._lastPhase = waveManager.currentPhase;
            if (this.waveVal) this.waveVal.textContent = waveManager.currentPhase;
        }
        const remEnemies = waveManager.getRemainingEnemiesCount();
        if (remEnemies !== this._lastEnemies) {
            this._lastEnemies = remEnemies;
            if (this.enemiesVal) this.enemiesVal.textContent = remEnemies;
        }

        // Hotbar Weapon Title & Ammo - Dirty check
        if (curWeapon.id !== this._lastWeaponId) {
            this._lastWeaponId = curWeapon.id;
            if (this.weaponName) {
                this.weaponName.textContent = curWeapon.name;
                this.weaponName.classList.toggle('rare', !!curWeapon.tier);
            }
        }
        const upgradeStatsStr = `DAME ×${player.weapons.damageBoost.toFixed(1)} · TỐC BẮN ×${player.weapons.fireRateBoost.toFixed(2)} · ${player.weapons.beamCount} TIA`;
        if (upgradeStatsStr !== this._lastUpgradeStats) {
            this._lastUpgradeStats = upgradeStatsStr;
            if (this.upgradeStats) this.upgradeStats.textContent = upgradeStatsStr;
        }
        if (ammoInfo.current !== this._lastAmmoCur) {
            this._lastAmmoCur = ammoInfo.current;
            if (this.ammoCurrent) this.ammoCurrent.textContent = ammoInfo.current;
        }
        const ammoMaxStr = ammoInfo.isKnife ? 'CẬN CHIẾN' : `${ammoInfo.max} + ${ammoInfo.reserve}`;
        if (ammoMaxStr !== this._lastAmmoMaxStr) {
            this._lastAmmoMaxStr = ammoMaxStr;
            if (this.ammoMax) this.ammoMax.textContent = ammoMaxStr;
        }

        // Reload progress bar - Dirty check
        const reloadKey = `${ammoInfo.isReloading}_${Math.round(ammoInfo.reloadProgress * 100)}`;
        if (reloadKey !== this._lastReloadKey) {
            this._lastReloadKey = reloadKey;
            if (this.reloadBar) {
                if (ammoInfo.isReloading) {
                    this.reloadBar.style.width = `${Math.round(ammoInfo.reloadProgress * 100)}%`;
                    this.reloadBar.classList.add('active');
                } else {
                    this.reloadBar.style.width = '0%';
                    this.reloadBar.classList.remove('active');
                }
            }
        }

        // Hotbar 5 Slots Updates - Dirty check
        const medkitQty = player.weapons.inventory?.medkits ?? 0;
        const shieldQty = player.weapons.inventory?.shieldBatteries ?? 0;
        const slotKey = `${player.weapons.currentSlotIndex}_${medkitQty}_${shieldQty}_${player.weapons.weaponSlots[0]?.id}_${player.weapons.weaponSlots[2]?.id}`;
        if (slotKey !== this._lastSlotKey) {
            this._lastSlotKey = slotKey;
            if (this.slot1Label && player.weapons.weaponSlots[0]) {
                this.slot1Label.textContent = player.weapons.weaponSlots[0].name;
            }
            if (this.slot3Label && player.weapons.weaponSlots[2]) {
                this.slot3Label.textContent = player.weapons.weaponSlots[2].name;
            }
            if (this.slotMedkitQty) {
                this.slotMedkitQty.textContent = `x${medkitQty}`;
            }
            if (this.slotShieldQty) {
                this.slotShieldQty.textContent = `x${shieldQty}`;
            }

            this.weaponSlots.forEach((slot, idx) => {
                if (!slot) return;
                if (!slot._clickBound) {
                    slot._clickBound = true;
                    slot.addEventListener('click', () => {
                        player.weapons?.switchWeapon(idx, player);
                    });
                }
                const item = player.weapons.weaponSlots[idx];
                if (!item) return;

                slot.classList.toggle('rare', !!item.tier);
                slot.title = item.name;

                if (idx < 3) {
                    if (idx === player.weapons.currentSlotIndex) {
                        slot.classList.add('active');
                    } else {
                        slot.classList.remove('active');
                    }
                } else {
                    // Ô tiện ích 4 và 5: làm mờ nếu số lượng = 0
                    const count = idx === 3 ? medkitQty : shieldQty;
                    slot.style.opacity = count > 0 ? '1' : '0.45';
                }
            });
        }

        // Boss Health Bar - Dirty check
        const boss = waveManager.getBoss();
        const bossActive = !!(boss && !boss.isDead);
        if (bossActive !== this._lastBossVisible) {
            this._lastBossVisible = bossActive;
            if (this.bossContainer) this.bossContainer.style.display = bossActive ? 'block' : 'none';
        }
        if (bossActive) {
            const bPct = Math.round(Math.max(0, (boss.health / boss.maxHealth) * 100));
            if (bPct !== this._lastBossPct) {
                this._lastBossPct = bPct;
                if (this.bossFill) this.bossFill.style.width = `${bPct}%`;
            }
        }

        // ----------------------------------------------------
        // MINIMALIST SURVIVAL BOTTOM HUD SYSTEM UPDATES (3 CỤM)
        // ----------------------------------------------------
        if (this.thBottomHud) {
            // CỤM 1: Rada khoảng cách, trạng thái đau/nhìn & thanh máu
            let minDist = 14;
            const enemies = waveManager?.enemies;
            if (enemies && enemies.length > 0) {
                let dMin = Infinity;
                for (let i = 0; i < enemies.length; i++) {
                    const en = enemies[i];
                    if (en && !en.isDead) {
                        const d = player.position.distanceTo(en.position);
                        if (d < dMin) dMin = d;
                    }
                }
                if (dMin !== Infinity) minDist = Math.max(1, Math.round(dMin * 1.5));
            }
            const distStr = `${minDist} M`;
            if (distStr !== this._lastDistVal) {
                this._lastDistVal = distStr;
                if (this.thDistVal) this.thDistVal.textContent = distStr;
            }

            const painSec = Math.ceil(player.painTimer || 0);
            const painStr = `Pain ${painSec}s`;
            if (painStr !== this._lastPainText) {
                this._lastPainText = painStr;
                if (this.thStatusPain) {
                    this.thStatusPain.textContent = painStr;
                    this.thStatusPain.style.color = painSec > 0 ? '#ef4444' : '#94a3b8';
                }
            }

            const lightStr = player.isADS ? 'ADS' : 'Light';
            if (lightStr !== this._lastLightText) {
                this._lastLightText = lightStr;
                if (this.thStatusLight) this.thStatusLight.textContent = lightStr;
            }

            const hpFormatted = `${player.health.toFixed(1)} / ${player.maxHealth}`;
            const hpThPct = Math.max(0, Math.min(100, (player.health / player.maxHealth) * 100));
            if (hpFormatted !== this._lastThHpText || hpThPct !== this._lastThHpPct) {
                this._lastThHpText = hpFormatted;
                this._lastThHpPct = hpThPct;
                if (this.thHealthFill) this.thHealthFill.style.width = `${hpThPct}%`;
                if (this.thHealthVal) this.thHealthVal.textContent = hpFormatted;
            }

            if (this.thCircleWater) {
                this.thCircleWater.style.opacity = player.shield > 0 ? '1' : '0.55';
            }
            if (this.thCircleEnergy) {
                this.thCircleEnergy.style.opacity = player.isDodging ? '0.5' : '1';
            }

            // CỤM 2: Thông tin hộp đạn lớn & Silhouette súng kích hoạt
            const curAmmoStr = curWeapon.isKnife ? '∞' : String(ammoInfo.current);
            const resAmmoStr = curWeapon.isKnife ? '∞' : String(ammoInfo.reserve);
            if (curAmmoStr !== this._lastAmmoCurText || resAmmoStr !== this._lastAmmoResText) {
                this._lastAmmoCurText = curAmmoStr;
                this._lastAmmoResText = resAmmoStr;
                if (this.thAmmoCur) this.thAmmoCur.textContent = curAmmoStr;
                if (this.thAmmoReserve) this.thAmmoReserve.textContent = resAmmoStr;
            }

            // Slot 1 always represents the equipped gun, even while using the knife.
            const gun = player.weapons.weaponSlots[0];
            if (gun?.id !== this._lastActiveWeaponSilh) {
                this._lastActiveWeaponSilh = gun?.id;
                if (this.thActiveSilhouette && gun?.icon) {
                    const image = document.createElement('img');
                    image.src = gun.icon;
                    image.alt = gun.name;
                    this.thActiveSilhouette.replaceChildren(image);
                }
            }
            // CỤM 3: Hotbar 3 ô [1] Súng, [2] Dao, [3] Medkit
            const inv = player.weapons?.inventory || {};
            const isUsingMed = !!player.weapons?.isUsingMedkit;
            const survKey = `${player.weapons.currentSlotIndex}_${inv.medkits}_${isUsingMed}`;
            if (survKey !== this._lastSurvivalSlotKey) {
                this._lastSurvivalSlotKey = survKey;
                if (this.thQtyMedkit) this.thQtyMedkit.textContent = `x${inv.medkits ?? 0}`;
                if (this.thSlot3) {
                    this.thSlot3.style.opacity = (inv.medkits > 0) ? '1' : '0.45';
                    this.thSlot3.classList.toggle('active', isUsingMed);
                }

                const cSlot = player.weapons.currentSlotIndex;
                if (this.thActiveSlot) this.thActiveSlot.classList.toggle('active', cSlot === 0);
                if (this.thSlot2) this.thSlot2.classList.toggle('active', cSlot === 1);
            }

            // Hiển thị thanh tiến trình sơ cứu Medkit 5 giây
            if (this.thMedkitChannel) {
                if (player.weapons?.isUsingMedkit) {
                    this.thMedkitChannel.style.display = 'block';
                    const curTime = Math.max(0, player.weapons.medkitTimer);
                    const totalTime = player.weapons.medkitTotalTime || 5.0;
                    const pct = Math.max(0, Math.min(100, (1 - curTime / totalTime) * 100));
                    if (this.thMedkitFill) this.thMedkitFill.style.width = `${pct}%`;
                    if (this.thMedkitCountdown) this.thMedkitCountdown.textContent = `${curTime.toFixed(1)}s`;
                } else {
                    this.thMedkitChannel.style.display = 'none';
                }
            }

            if (!this._thClicksBound) {
                this._thClicksBound = true;
                if (this.thActiveSlot) this.thActiveSlot.addEventListener('click', () => player.weapons?.switchWeapon(0, player));
                if (this.thSlot2) this.thSlot2.addEventListener('click', () => player.weapons?.switchWeapon(1, player));
                if (this.thSlot3) this.thSlot3.addEventListener('click', () => player.weapons?.startMedkitUse(player));
            }
        }
    }

    triggerDamageFlash() {
        if (!this.damageVignette) return;
        this.damageVignette.classList.add('hit-flash');
        setTimeout(() => {
            this.damageVignette.classList.remove('hit-flash');
        }, 150);
    }

    triggerHitmarker(isCrit = false) {
        if (!this.hitmarker) return;
        this.hitmarker.className = isCrit ? 'hitmarker crit active' : 'hitmarker active';
        setTimeout(() => {
            this.hitmarker.classList.remove('active');
        }, 120);
    }

    showBanner(text, duration = 3000) {
        if (!this.bannerText) return;
        this.bannerText.textContent = text;
        this.bannerText.classList.add('show');
        if (this.bannerTimeout) clearTimeout(this.bannerTimeout);
        this.bannerTimeout = setTimeout(() => {
            this.bannerText.classList.remove('show');
        }, duration);
    }

    showPickupAlert(text) {
        if (!this.pickupAlert) return;
        this.pickupAlert.textContent = text;
        this.pickupAlert.classList.add('show');
        if (this.pickupTimeout) clearTimeout(this.pickupTimeout);
        this.pickupTimeout = setTimeout(() => {
            this.pickupAlert.classList.remove('show');
        }, 1600);
    }

    showDamageNumber(amount, isCrit, worldPos, camera, hitResult = null) {
        if (!this.floatingContainer) return;

        // Giới hạn DOM elements tối đa 20 thẻ để tối ưu hiệu năng Web không lag
        while (this.floatingContainer.children.length >= 20) {
            this.floatingContainer.firstElementChild?.remove();
        }

        const screenPos = worldPos.clone().project(camera);
        if (screenPos.z > 1) return;

        const x = (screenPos.x * 0.5 + 0.5) * window.innerWidth;
        const y = (-screenPos.y * 0.5 + 0.5) * window.innerHeight;

        const el = document.createElement('div');

        if (hitResult && hitResult.isBlunt) {
            // Sát thương bị giáp cản: Hiện số sát thương giáp + sát thương cùn
            el.className = 'damage-popup armor';
            el.textContent = `GIÁP [-${hitResult.armorDamage}] (${hitResult.healthDamage} HP)`;
        } else {
            // Xuyên giáp hoặc trúng máu trực tiếp
            el.className = isCrit ? 'damage-popup crit' : 'damage-popup';
            const displayDmg = hitResult ? hitResult.healthDamage : Math.round(amount);
            el.textContent = `${displayDmg}${isCrit ? ' HEADSHOT' : ''}`;
        }

        el.style.left = `${x + (Math.random() - 0.5) * 24}px`;
        el.style.top = `${y + (Math.random() - 0.5) * 12}px`;

        this.floatingContainer.appendChild(el);
        setTimeout(() => {
            el.remove();
        }, 800);
    }

    drawRadar(player, enemies, pickups, portals = [], teammates = []) {
        if (!this.radarCtx) return;
        const ctx = this.radarCtx;
        const w = this.radarCanvas.width;
        const h = this.radarCanvas.height;
        const cx = w / 2;
        const cy = h / 2;
        const radarRange = 28;
        const scale = (w * 0.44) / radarRange;

        ctx.clearRect(0, 0, w, h);

        // Radar background ring
        ctx.strokeStyle = 'rgba(0, 240, 255, 0.25)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(cx, cy, w * 0.44, 0, Math.PI * 2);
        ctx.stroke();

        ctx.strokeStyle = 'rgba(0, 240, 255, 0.10)';
        ctx.beginPath();
        ctx.arc(cx, cy, w * 0.22, 0, Math.PI * 2);
        ctx.stroke();

        // Cross lines
        ctx.beginPath();
        ctx.moveTo(cx, cy - w * 0.44);
        ctx.lineTo(cx, cy + w * 0.44);
        ctx.moveTo(cx - w * 0.44, cy);
        ctx.lineTo(cx + w * 0.44, cy);
        ctx.stroke();

        const pPos = player.position;
        const pYaw = player.cameraYaw;

        // Draw 4 Portals (Purple glowing diamonds)
        for (const port of portals) {
            const dx = port.position.x - pPos.x;
            const dz = port.position.z - pPos.z;

            const rx = dx * Math.cos(pYaw) - dz * Math.sin(pYaw);
            const rz = dx * Math.sin(pYaw) + dz * Math.cos(pYaw);

            const px = cx + rx * scale;
            const py = cy + rz * scale;

            if (Math.hypot(rx, rz) <= radarRange) {
                ctx.fillStyle = '#b026ff';
                ctx.shadowColor = '#b026ff';
                ctx.shadowBlur = 6;
                ctx.beginPath();
                ctx.moveTo(px, py - 4);
                ctx.lineTo(px + 4, py);
                ctx.lineTo(px, py + 4);
                ctx.lineTo(px - 4, py);
                ctx.closePath();
                ctx.fill();
                ctx.shadowBlur = 0;
            }
        }

        // Draw Pickups
        for (const pick of pickups) {
            const dx = pick.mesh.position.x - pPos.x;
            const dz = pick.mesh.position.z - pPos.z;

            const rx = dx * Math.cos(pYaw) - dz * Math.sin(pYaw);
            const rz = dx * Math.sin(pYaw) + dz * Math.cos(pYaw);

            const px = cx + rx * scale;
            const py = cy + rz * scale;

            if (Math.hypot(rx, rz) <= radarRange) {
                ctx.fillStyle = `#${pick.color.toString(16).padStart(6, '0')}`;
                ctx.beginPath();
                ctx.arc(px, py, 3, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        // Draw Zombies
        for (const enemy of enemies) {
            if (enemy.isDead) continue;
            const dx = enemy.position.x - pPos.x;
            const dz = enemy.position.z - pPos.z;

            const rx = dx * Math.cos(pYaw) - dz * Math.sin(pYaw);
            const rz = dx * Math.sin(pYaw) + dz * Math.cos(pYaw);

            const px = cx + rx * scale;
            const py = cy + rz * scale;

            if (Math.hypot(rx, rz) <= radarRange) {
                if (enemy.type === 'boss') {
                    ctx.fillStyle = '#ff0055';
                    ctx.shadowColor = '#ff0055';
                    ctx.shadowBlur = 8;
                    ctx.beginPath();
                    ctx.arc(px, py, 6, 0, Math.PI * 2);
                    ctx.fill();
                } else if (enemy.type === 'tank' || enemy.type === 'giant') {
                    ctx.fillStyle = '#ff8800';
                    ctx.shadowColor = '#ff8800';
                    ctx.shadowBlur = 5;
                    ctx.beginPath();
                    ctx.arc(px, py, enemy.type === 'giant' ? 6 : 4.5, 0, Math.PI * 2);
                    ctx.fill();
                } else if (enemy.type === 'spitter') {
                    ctx.fillStyle = '#99ff22';
                    ctx.shadowColor = '#99ff22';
                    ctx.shadowBlur = 5;
                    ctx.fillRect(px - 3, py - 3, 6, 6);
                } else if (enemy.type === 'sprinter') {
                    ctx.fillStyle = '#ffff00';
                    ctx.shadowColor = '#ffff00';
                    ctx.shadowBlur = 4;
                    ctx.beginPath();
                    ctx.arc(px, py, 3, 0, Math.PI * 2);
                    ctx.fill();
                } else {
                    ctx.fillStyle = '#ff2a5f';
                    ctx.shadowColor = '#ff2a5f';
                    ctx.shadowBlur = 4;
                    ctx.beginPath();
                    ctx.arc(px, py, 3.5, 0, Math.PI * 2);
                    ctx.fill();
                }
                ctx.shadowBlur = 0;
            }
        }

        // Vẽ vị trí đồng đội trên Radar
        if (Array.isArray(teammates)) {
            for (const mate of teammates) {
                if (!mate || (mate.isDead && !mate.isDowned)) continue;
                const matePos = mate.mesh ? mate.mesh.position : mate.position;
                const dx = matePos.x - pPos.x;
                const dz = matePos.z - pPos.z;

                const rx = dx * Math.cos(pYaw) - dz * Math.sin(pYaw);
                const rz = dx * Math.sin(pYaw) + dz * Math.cos(pYaw);

                const dist = Math.hypot(rx, rz);
                const isOutside = dist > radarRange;
                const drawDist = isOutside ? (radarRange - 1.5) : dist;
                const scaleDist = dist > 0 ? (drawDist / dist) : 1;

                const px = cx + (rx * scaleDist) * scale;
                const py = cy + (rz * scaleDist) * scale;

                ctx.save();
                if (mate.isDowned) {
                    // Đồng đội bị hạ gục: vòng tròn đỏ nhấp nháy
                    ctx.fillStyle = '#ff1744';
                    ctx.shadowColor = '#ff1744';
                    ctx.shadowBlur = 8;
                    ctx.beginPath();
                    ctx.arc(px, py, 5, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.strokeStyle = '#ffffff';
                    ctx.lineWidth = 1.5;
                    ctx.stroke();

                    // Ký hiệu dấu chấm than báo động
                    ctx.fillStyle = '#ffffff';
                    ctx.font = 'bold 8px Rajdhani, sans-serif';
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillText('!', px, py);
                } else {
                    // Đồng đội bình thường: biểu tượng theo màu nhân vật với tâm trắng sáng
                    const charColor = CHARACTER_COLORS[mate.characterId] || '#00f0ff';
                    ctx.fillStyle = charColor;
                    ctx.shadowColor = charColor;
                    ctx.shadowBlur = 7;
                    ctx.beginPath();
                    ctx.arc(px, py, isOutside ? 3.5 : 4.8, 0, Math.PI * 2);
                    ctx.fill();

                    ctx.fillStyle = '#ffffff';
                    ctx.beginPath();
                    ctx.arc(px, py, 1.8, 0, Math.PI * 2);
                    ctx.fill();
                }
                ctx.restore();
            }
        }

        // Player central pointer (triangle pointing forward: up)
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(Math.PI - player.aimYaw);
        ctx.fillStyle = '#00f0ff';
        ctx.shadowColor = '#00f0ff';
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.moveTo(0, -6);
        ctx.lineTo(-4, 5);
        ctx.lineTo(4, 5);
        ctx.closePath();
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.restore();
    }

    // Tạo phần tử DOM biểu thị đồng đội ngoài màn hình
    createTeammateMarker(id, characterId) {
        if (!this.teammateContainer) return null;

        const el = document.createElement('div');
        el.className = 'teammate-offscreen-marker';
        el.id = `teammate-marker-${id}`;

        // Mũi tên chỉ hướng ra ngoài rìa màn hình
        const arrowWrapper = document.createElement('div');
        arrowWrapper.className = 'indicator-arrow-wrapper';
        const arrow = document.createElement('div');
        arrow.className = 'indicator-arrow';
        arrowWrapper.appendChild(arrow);
        el.appendChild(arrowWrapper);

        // Hộp chứa avatar và các vòng tròn SVG
        const avatarBox = document.createElement('div');
        avatarBox.className = 'indicator-avatar-box';

        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('class', 'indicator-rings');
        svg.setAttribute('viewBox', '0 0 56 56');

        // Vòng nền mờ
        const bgCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        bgCircle.setAttribute('class', 'ring-bg');
        bgCircle.setAttribute('cx', '28');
        bgCircle.setAttribute('cy', '28');
        bgCircle.setAttribute('r', '22');
        svg.appendChild(bgCircle);

        // Vòng khiên (màu cyan, bán kính 25)
        const shieldCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        shieldCircle.setAttribute('class', 'ring-shield');
        shieldCircle.setAttribute('cx', '28');
        shieldCircle.setAttribute('cy', '28');
        shieldCircle.setAttribute('r', '25');
        shieldCircle.setAttribute('stroke-dasharray', '157.08');
        shieldCircle.setAttribute('stroke-dashoffset', '0');
        svg.appendChild(shieldCircle);

        // Vòng máu (màu xanh/cam/đỏ, bán kính 22)
        const healthCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        healthCircle.setAttribute('class', 'ring-health');
        healthCircle.setAttribute('cx', '28');
        healthCircle.setAttribute('cy', '28');
        healthCircle.setAttribute('r', '22');
        healthCircle.setAttribute('stroke-dasharray', '138.23');
        healthCircle.setAttribute('stroke-dashoffset', '0');
        svg.appendChild(healthCircle);

        avatarBox.appendChild(svg);

        // Khung tròn chứa avatar
        const avatarCenter = document.createElement('div');
        avatarCenter.className = 'avatar-center';

        const iconContainer = document.createElement('div');
        iconContainer.className = 'avatar-icon';
        iconContainer.innerHTML = getCharacterAvatarSvg(characterId);
        avatarCenter.appendChild(iconContainer);

        const downedBadge = document.createElement('div');
        downedBadge.className = 'avatar-downed-badge';
        downedBadge.textContent = '!';
        avatarCenter.appendChild(downedBadge);

        avatarBox.appendChild(avatarCenter);
        el.appendChild(avatarBox);

        // Nhãn tên và khoảng cách
        const label = document.createElement('div');
        label.className = 'indicator-label';

        const nameSpan = document.createElement('span');
        nameSpan.className = 'indicator-name';
        label.appendChild(nameSpan);

        const distSpan = document.createElement('span');
        distSpan.className = 'indicator-distance';
        label.appendChild(distSpan);

        el.appendChild(label);

        this.teammateContainer.appendChild(el);

        const markerData = {
            el,
            arrowWrapper,
            arrow,
            healthCircle,
            shieldCircle,
            iconContainer,
            nameSpan,
            distSpan,
            label,
            characterId
        };
        this.teammateMarkers.set(id, markerData);
        return markerData;
    }

    // Cập nhật vị trí và thanh máu tròn cho đồng đội ở rìa màn hình
    updateTeammateIndicators(teammates, localPlayer, camera) {
        if (!this.teammateContainer) return;

        // Tập hợp các ID đồng đội còn hoạt động
        const activeIds = new Set();
        const width = window.innerWidth;
        const height = window.innerHeight;
        const margin = 48;
        const cx = width / 2;
        const cy = height / 2;
        const halfW = cx - margin;
        const halfH = cy - margin;

        const offscreenList = [];

        for (const mate of teammates) {
            if (!mate || (mate.isDead && !mate.isDowned)) continue;
            activeIds.add(mate.id);

            let marker = this.teammateMarkers.get(mate.id);
            if (!marker) {
                marker = this.createTeammateMarker(mate.id, mate.characterId || 'soldier');
                if (!marker) continue;
            }

            // Cập nhật lại biểu tượng nếu nhân vật thay đổi
            if (marker.characterId !== mate.characterId) {
                marker.iconContainer.innerHTML = getCharacterAvatarSvg(mate.characterId);
                marker.characterId = mate.characterId;
            }

            const charColor = CHARACTER_COLORS[mate.characterId] || '#22e6a5';
            marker.el.style.setProperty('--character-color', charColor);
            marker.el.style.setProperty('--indicator-color', mate.isDowned ? '#ff1744' : charColor);

            // Tọa độ thế giới của đồng đội (sử dụng vector tái sử dụng tránh GC)
            const matePos = mate.mesh ? mate.mesh.position : mate.position;
            _tempMateWorldPos.copy(matePos);
            _tempMateWorldPos.y += 1.2;
            _tempNdc.copy(_tempMateWorldPos).project(camera);

            const screenX = (_tempNdc.x * 0.5 + 0.5) * width;
            const screenY = (-_tempNdc.y * 0.5 + 0.5) * height;

            // Kiểm tra xem đồng đội có đang nằm gọn trong màn hình không
            const viewMarginX = 85;
            const viewMarginY = 80;
            const onScreen = (
                screenX >= viewMarginX &&
                screenX <= width - viewMarginX &&
                screenY >= viewMarginY &&
                screenY <= height - viewMarginY &&
                _tempNdc.z >= -1 && _tempNdc.z <= 1
            );

            if (onScreen) {
                // Nếu đồng đội ở trong màn hình, ẩn biểu tượng rìa màn hình
                marker.el.style.display = 'none';
            } else {
                // Nếu đồng đội ở ngoài màn hình, tính toán tọa độ chiếu lên rìa màn hình
                marker.el.style.display = 'block';

                const dx = screenX - cx;
                const dy = screenY - cy;

                const tx = halfW / (Math.abs(dx) || 0.0001);
                const ty = halfH / (Math.abs(dy) || 0.0001);
                const t = Math.min(tx, ty);

                let edgeX = cx + dx * t;
                let edgeY = cy + dy * t;
                const angleDeg = Math.atan2(dy, dx) * (180 / Math.PI);

                // Tránh che khuất các cụm giao diện cố định ở các góc:
                // Góc dưới phải: Bảng vũ khí & đạn
                if (edgeX > width - 260 && edgeY > height - 165) {
                    if (Math.abs(dx) >= Math.abs(dy)) {
                        edgeX = width - 275;
                    } else {
                        edgeY = height - 175;
                    }
                }
                // Góc trên phải: Radar chiến thuật
                else if (edgeX > width - 190 && edgeY < 200) {
                    if (Math.abs(dx) >= Math.abs(dy)) {
                        edgeX = width - 200;
                    } else {
                        edgeY = 205;
                    }
                }
                // Góc trên trái: Bảng máu và danh sách đồng đội
                else if (edgeX < 300 && edgeY < 330) {
                    if (Math.abs(dx) >= Math.abs(dy)) {
                        edgeX = 310;
                    } else {
                        edgeY = 335;
                    }
                }

                offscreenList.push({
                    marker,
                    mate,
                    matePos,
                    x: edgeX,
                    y: edgeY,
                    angle: angleDeg
                });
            }
        }

        // Tách các biểu tượng nếu bị đè lên nhau ở cùng góc viền
        for (let i = 0; i < offscreenList.length; i++) {
            for (let j = i + 1; j < offscreenList.length; j++) {
                const a = offscreenList[i];
                const b = offscreenList[j];
                const d = Math.hypot(a.x - b.x, a.y - b.y);
                if (d < 58) {
                    const nx = (b.x - a.x) || 1;
                    const ny = (b.y - a.y) || 0;
                    const len = Math.hypot(nx, ny) || 1;
                    const shift = (58 - d) / 2;
                    a.x -= (nx / len) * shift;
                    a.y -= (ny / len) * shift;
                    b.x += (nx / len) * shift;
                    b.y += (ny / len) * shift;
                }
            }
        }

        // Cập nhật vị trí, vòng máu tròn và trạng thái cho từng biểu tượng ngoài màn hình
        for (const item of offscreenList) {
            const { marker, mate, matePos, x, y, angle } = item;

            marker.el.style.left = `${Math.round(x)}px`;
            marker.el.style.top = `${Math.round(y)}px`;
            marker.arrowWrapper.style.transform = `rotate(${angle.toFixed(1)}deg)`;

            // Tự động căn chỉnh nhãn để không bao giờ bị cắt mép màn hình
            marker.label.classList.toggle('label-top', y > height - 100);
            marker.label.classList.toggle('label-right', x > width - 75);
            marker.label.classList.toggle('label-left', x < 75);

            // Tính toán lượng máu và khiên
            const maxHp = mate.maxHealth || 100;
            const curHp = Math.max(0, mate.health ?? maxHp);
            const hpRatio = Math.max(0, Math.min(1, curHp / maxHp));

            const maxSh = mate.maxShield || 100;
            const curSh = Math.max(0, mate.shield ?? 0);
            const shRatio = Math.max(0, Math.min(1, curSh / maxSh));

            // Vòng tròn máu: chu vi 138.23
            const hpOffset = 138.23 * (1 - hpRatio);
            marker.healthCircle.style.strokeDashoffset = hpOffset.toFixed(2);

            // Đổi màu theo trạng thái máu
            if (mate.isDowned) {
                marker.healthCircle.style.stroke = '#ff1744';
            } else if (hpRatio > 0.5) {
                marker.healthCircle.style.stroke = '#00ff88';
            } else if (hpRatio > 0.25) {
                marker.healthCircle.style.stroke = '#ffaa00';
            } else {
                marker.healthCircle.style.stroke = '#ff2a5f';
            }

            // Vòng tròn khiên: chu vi 157.08
            const shOffset = 157.08 * (1 - shRatio);
            marker.shieldCircle.style.strokeDashoffset = shOffset.toFixed(2);
            marker.shieldCircle.style.display = curSh > 0 ? 'block' : 'none';

            // Khoảng cách tới đồng đội (mét)
            const dist = Math.max(0, localPlayer.position.distanceTo(matePos));

            marker.nameSpan.textContent = mate.name || 'Đồng đội';

            if (mate.isDowned) {
                marker.el.classList.add('is-downed');
                if (dist <= 2.4) {
                    marker.distSpan.textContent = 'NHẤN E ĐỂ CỨU';
                    marker.distSpan.classList.add('can-revive');
                } else {
                    marker.distSpan.textContent = `HẠ GỤC · ${Math.round(dist)}m`;
                    marker.distSpan.classList.remove('can-revive');
                }
            } else {
                marker.el.classList.remove('is-downed');
                marker.distSpan.textContent = `${Math.round(dist)}m`;
                marker.distSpan.classList.remove('can-revive');
            }
        }

        // Xóa biểu tượng của đồng đội đã thoát hoặc biến mất
        for (const [id, marker] of this.teammateMarkers) {
            if (!activeIds.has(id)) {
                marker.el.remove();
                this.teammateMarkers.delete(id);
            }
        }
    }

    // Cập nhật bảng thông tin danh sách đồng đội trong HUD
    updateTeamRoster(teammates, localPlayer) {
        if (!this.teamRoster) return;
        const validMates = (teammates || []).filter(mate => mate && (!mate.isDead || mate.isDowned));
        if (validMates.length === 0) {
            if (this._lastRosterKey !== 'empty') {
                this._lastRosterKey = 'empty';
                this.teamRoster.style.display = 'none';
            }
            return;
        }

        const rosterKey = validMates.map(m => `${m.id}_${Math.round(m.health || 0)}_${Math.round(m.shield || 0)}_${m.isDowned}_${m.characterId}`).join('|');
        if (rosterKey === this._lastRosterKey) return;
        this._lastRosterKey = rosterKey;

        this.teamRoster.style.display = 'block';

        let html = `<div class="team-roster-title"><span>ĐỒNG ĐỘI</span><span>${validMates.length}</span></div><div class="team-roster-list">`;
        for (const mate of validMates) {
            const charColor = CHARACTER_COLORS[mate.characterId] || '#22e6a5';
            const maxHp = mate.maxHealth || 100;
            const curHp = Math.max(0, mate.health ?? maxHp);
            const hpPct = Math.round((curHp / maxHp) * 100);

            const maxSh = mate.maxShield || 100;
            const curSh = Math.max(0, mate.shield ?? 0);
            const shPct = Math.round((curSh / maxSh) * 100);

            const isDowned = !!mate.isDowned;
            const statusText = isDowned ? 'BỊ HẠ GỤC' : (hpPct <= 30 ? 'NGUY HIỂM' : 'SẴN SÀNG');
            const hpClass = isDowned ? 'danger' : (hpPct <= 30 ? 'danger' : (hpPct <= 60 ? 'warn' : ''));

            html += `
                <div class="team-roster-item ${isDowned ? 'downed' : ''}">
                    <div class="roster-avatar" style="--char-color: ${charColor};">
                        ${getCharacterAvatarSvg(mate.characterId)}
                    </div>
                    <div class="roster-info">
                        <div class="roster-name-row">
                            <span class="roster-name">${mate.name || 'Đồng đội'}</span>
                            <span class="roster-status">${statusText}</span>
                        </div>
                        <div class="roster-bars">
                            ${curSh > 0 ? `<div class="roster-bar-track"><div class="roster-bar-fill shield" style="width: ${shPct}%"></div></div>` : ''}
                            <div class="roster-bar-track"><div class="roster-bar-fill health ${hpClass}" style="width: ${hpPct}%"></div></div>
                        </div>
                    </div>
                </div>
            `;
        }
        html += `</div>`;
        this.teamRoster.innerHTML = html;
    }

    // Ẩn tất cả chỉ báo đồng đội ngoài màn hình (dùng khi tạm dừng hoặc kết thúc màn chơi)
    clearTeammateIndicators() {
        for (const marker of this.teammateMarkers.values()) {
            marker.el.style.display = 'none';
        }
    }
}


