export class UIManager {
    constructor() {
        this.healthFill = document.getElementById('health-fill');
        this.healthText = document.getElementById('health-text');
        this.shieldFill = document.getElementById('shield-fill');
        this.shieldText = document.getElementById('shield-text');
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
        // Health
        const hpPercent = Math.max(0, (player.health / player.maxHealth) * 100);
        if (this.healthFill) this.healthFill.style.width = `${hpPercent}%`;
        if (this.healthText) this.healthText.textContent = `${Math.ceil(player.health)} / ${player.maxHealth}`;

        // Shield
        const shPercent = Math.max(0, (player.shield / player.maxShield) * 100);
        if (this.shieldFill) this.shieldFill.style.width = `${shPercent}%`;
        if (this.shieldText) this.shieldText.textContent = `${Math.ceil(player.shield)} / ${player.maxShield}`;

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

        // Weapon & Ammo
        const ammoInfo = player.weapons.getCurrentAmmo();
        const curWeapon = player.weapons.getCurrentWeapon();
        if (this.weaponName) this.weaponName.textContent = curWeapon.name;
        if (this.weaponName) this.weaponName.classList.toggle('rare', !!curWeapon.tier);
        if (this.upgradeStats) {
            this.upgradeStats.textContent = `DAME ×${player.weapons.damageBoost.toFixed(1)} · TỐC BẮN ×${player.weapons.fireRateBoost.toFixed(2)} · ${player.weapons.beamCount} TIA`;
        }
        if (this.ammoCurrent) this.ammoCurrent.textContent = ammoInfo.current;
        if (this.ammoMax) this.ammoMax.textContent = ammoInfo.isKnife ? 'DAO' : `${ammoInfo.max} + ${ammoInfo.reserve}`;

        if (this.reloadBar) {
            if (ammoInfo.isReloading) {
                this.reloadBar.style.width = `${ammoInfo.reloadProgress * 100}%`;
                this.reloadBar.classList.add('active');
            } else {
                this.reloadBar.style.width = '0%';
                this.reloadBar.classList.remove('active');
            }
        }

        // Weapon slots
        this.weaponSlots.forEach((slot, idx) => {
            if (slot) {
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

    drawRadar(player, enemies, pickups, portals = []) {
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
}
