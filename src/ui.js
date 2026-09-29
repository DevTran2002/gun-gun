import * as THREE from 'three';

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
            document.getElementById('slot-2')
        ];

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

        this.bannerTimeout = null;
        this.pickupTimeout = null;
    }

    updateStats(player, waveManager, score) {
        for (const element of [this.crosshair, this.hitmarker]) {
            if (!element) continue;
            element.style.left = `${player.pointerScreen.x}px`;
            element.style.top = `${player.pointerScreen.y}px`;
            element.style.display = player.pointerInCanvas ? '' : 'none';
        }

        // 1. Health Bar (Đỏ)
        const hpPercent = Math.max(0, Math.min(100, (player.health / player.maxHealth) * 100));
        if (this.healthFill) this.healthFill.style.width = `${hpPercent}%`;
        if (this.healthText) this.healthText.textContent = `${Math.ceil(player.health)} / ${player.maxHealth}`;

        // 2. Shield Bar (Xanh lam)
        const shPercent = Math.max(0, Math.min(100, (player.shield / player.maxShield) * 100));
        if (this.shieldFill) this.shieldFill.style.width = `${shPercent}%`;
        if (this.shieldText) this.shieldText.textContent = `${Math.ceil(player.shield)} / ${player.maxShield}`;

        // Weapon & Ammo info
        const ammoInfo = player.weapons.getCurrentAmmo();
        const curWeapon = player.weapons.getCurrentWeapon();

        // 3. Stamina / Ammo Bar (Cam - thanh thứ 3 giống Ảnh 2)
        if (this.staminaFill) {
            let stPercent = 100;
            if (!curWeapon.isKnife) {
                if (ammoInfo.isReloading) {
                    stPercent = Math.max(0, Math.min(100, ammoInfo.reloadProgress * 100));
                    if (this.staminaText) this.staminaText.textContent = `NẠP ĐẠN ${Math.round(stPercent)}%`;
                } else {
                    stPercent = Math.max(0, Math.min(100, (ammoInfo.current / ammoInfo.max) * 100));
                    if (this.staminaText) this.staminaText.textContent = `BĂNG ĐẠN ${ammoInfo.current}/${ammoInfo.max}`;
                }
            } else {
                stPercent = 100;
                if (this.staminaText) this.staminaText.textContent = 'CẬN CHIẾN';
            }
            this.staminaFill.style.width = `${stPercent}%`;
        }

        // 4. Hàng ô Buff RPG (Ảnh 2)
        const upgrades = player.weapons.upgrades;
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
            const isRegening = player.shieldRegenTimer <= 0 && player.shield < player.maxShield;
            this.buffShield.classList.toggle('active', isRegening || player.shield >= player.maxShield);
            if (this.buffShieldVal) this.buffShieldVal.textContent = isRegening ? 'REGEN' : (player.shield >= player.maxShield ? 'FULL' : 'WAIT');
        }
        if (this.buffCrit) {
            this.buffCrit.classList.toggle('active', true);
            if (this.buffCritVal) this.buffCritVal.textContent = `×${(curWeapon.critMultiplier || 2.0).toFixed(1)}`;
        }

        // Low health vignette
        if (this.damageVignette) {
            if (player.health <= 30 && !player.isDead) {
                this.damageVignette.classList.add('critical-pulsing');
            } else {
                this.damageVignette.classList.remove('critical-pulsing');
            }
        }

        // Score & Phase
        if (this.scoreVal) this.scoreVal.textContent = score.toLocaleString();
        if (this.waveVal) this.waveVal.textContent = waveManager.currentPhase;
        if (this.enemiesVal) this.enemiesVal.textContent = waveManager.getRemainingEnemiesCount();

        // Hotbar Weapon Title & Ammo
        if (this.weaponName) this.weaponName.textContent = curWeapon.name;
        if (this.weaponName) this.weaponName.classList.toggle('rare', !!curWeapon.tier);
        if (this.upgradeStats) {
            this.upgradeStats.textContent = `DAME ×${player.weapons.damageBoost.toFixed(1)} · TỐC BẮN ×${player.weapons.fireRateBoost.toFixed(2)} · ${player.weapons.beamCount} TIA`;
        }
        if (this.ammoCurrent) this.ammoCurrent.textContent = ammoInfo.current;
        if (this.ammoMax) this.ammoMax.textContent = ammoInfo.isKnife ? 'CẬN CHIẾN' : `${ammoInfo.max} + ${ammoInfo.reserve}`;

        if (this.reloadBar) {
            if (ammoInfo.isReloading) {
                this.reloadBar.style.width = `${ammoInfo.reloadProgress * 100}%`;
                this.reloadBar.classList.add('active');
            } else {
                this.reloadBar.style.width = '0%';
                this.reloadBar.classList.remove('active');
            }
        }

        // Hotbar Slots
        this.weaponSlots.forEach((slot, idx) => {
            if (slot) {
                if (!slot._clickBound) {
                    slot._clickBound = true;
                    slot.addEventListener('click', () => {
                        player.weapons?.switchWeapon(idx);
                    });
                }
                const weapon = player.weapons.weaponSlots[idx];
                if (!weapon) return;
                slot.classList.toggle('rare', !!weapon.tier);
                slot.title = weapon.name;
                const icon = slot.querySelector('img');
                if (icon && weapon.icon && icon.getAttribute('src') !== weapon.icon) {
                    icon.src = weapon.icon;
                    icon.alt = weapon.name;
                }
                if (idx === player.weapons.currentSlotIndex) {
                    slot.classList.add('active');
                } else {
                    slot.classList.remove('active');
                }
            }
        });

        // Boss Health Bar
        const boss = waveManager.getBoss();
        if (boss && !boss.isDead) {
            if (this.bossContainer) this.bossContainer.style.display = 'block';
            const bPct = Math.max(0, (boss.health / boss.maxHealth) * 100);
            if (this.bossFill) this.bossFill.style.width = `${bPct}%`;
        } else {
            if (this.bossContainer) this.bossContainer.style.display = 'none';
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

    showDamageNumber(amount, isCrit, worldPos, camera) {
        if (!this.floatingContainer) return;

        const screenPos = worldPos.clone().project(camera);
        if (screenPos.z > 1) return;

        const x = (screenPos.x * 0.5 + 0.5) * window.innerWidth;
        const y = (-screenPos.y * 0.5 + 0.5) * window.innerHeight;

        const el = document.createElement('div');
        el.className = isCrit ? 'damage-popup crit' : 'damage-popup';
        el.textContent = `${Math.round(amount)}${isCrit ? ' HEADSHOT' : ''}`;
        el.style.left = `${x + (Math.random() - 0.5) * 20}px`;
        el.style.top = `${y + (Math.random() - 0.5) * 10}px`;

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

            // Tọa độ thế giới của đồng đội
            const matePos = mate.mesh ? mate.mesh.position : mate.position;
            const worldPos = matePos.clone().add(new THREE.Vector3(0, 1.2, 0));
            const ndc = worldPos.clone().project(camera);

            const screenX = (ndc.x * 0.5 + 0.5) * width;
            const screenY = (-ndc.y * 0.5 + 0.5) * height;

            // Kiểm tra xem đồng đội có đang nằm gọn trong màn hình không
            const viewMarginX = 85;
            const viewMarginY = 80;
            const onScreen = (
                screenX >= viewMarginX &&
                screenX <= width - viewMarginX &&
                screenY >= viewMarginY &&
                screenY <= height - viewMarginY &&
                ndc.z >= -1 && ndc.z <= 1
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
            this.teamRoster.style.display = 'none';
            return;
        }

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


