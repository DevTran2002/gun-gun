import * as THREE from 'three';
import { sounds } from './audio.js';

export const WEAPON_CONFIGS = [
    {
        id: 'blaster',
        name: 'BLASTER-X',
        category: 'SÚNG CHÍNH',
        modelFile: 'kenney-blaster/blaster-a.glb',
        icon: 'assets/previews/kenney-blaster/blaster-a.png',
        fireRate: 0.18,
        damage: 28,
        penPower: 1, // Xuyên giáp cấp 1
        critMultiplier: 2.0,
        magSize: 16,
        reloadTime: 1.15,
        bulletSpeed: 105,
        baseSpreadDegHip: 2.2, // Góc tản Hipfire (độ)
        baseSpreadDegADS: 0.5, // Góc tản ADS (độ)
        moveSpreadPenalty: 2.5, // Phạt tản khi chạy (độ)
        recoilSpreadPerShot: 0.8, // Tăng sau mỗi phát (độ)
        maxSpreadDeg: 9.0, // Tản tối đa (độ)
        spreadRecoveryRate: 20.0, // Co nhỏ lại (°/s)
        screenShake: 0.14, // Trauma rung camera nhẹ
        cursorKick: 2.8, // Pixel giật tâm ngắm
        color: 0x00f0ff,
        isAuto: false,
        pellets: 1,
        recoilPitch: 0.025,
        scale: 0.24,
        offset: new THREE.Vector3(-0.24, -0.05, 0.02),
        rotOffset: new THREE.Euler(0, Math.PI * 0.35, 0)
    },
    {
        id: 'repeater',
        name: 'REPEATER-9',
        category: 'SÚNG TỰ ĐỘNG',
        modelFile: 'kenney-blaster/blaster-d.glb',
        icon: 'assets/previews/kenney-blaster/blaster-d.png',
        fireRate: 0.09,
        damage: 17,
        penPower: 1,
        critMultiplier: 2.0,
        magSize: 32,
        reloadTime: 1.3,
        bulletSpeed: 115,
        baseSpreadDegHip: 3.5,
        baseSpreadDegADS: 1.0,
        moveSpreadPenalty: 3.0,
        recoilSpreadPerShot: 0.48,
        maxSpreadDeg: 12.0,
        spreadRecoveryRate: 24.0,
        screenShake: 0.10,
        cursorKick: 2.0,
        color: 0xffaa00,
        isAuto: true,
        pellets: 1,
        recoilPitch: 0.018,
        scale: 0.24,
        offset: new THREE.Vector3(-0.24, -0.05, 0.02),
        rotOffset: new THREE.Euler(0, Math.PI * 0.35, 0)
    },
    {
        id: 'scatter',
        name: 'SCATTER-V',
        category: 'SHOTGUN TÁN XẠ',
        modelFile: 'kenney-blaster/blaster-g.glb',
        icon: 'assets/previews/kenney-blaster/blaster-g.png',
        fireRate: 0.55,
        damage: 14,
        penPower: 1,
        critMultiplier: 1.8,
        magSize: 8,
        reloadTime: 1.5,
        bulletSpeed: 95,
        baseSpreadDegHip: 9.0,
        baseSpreadDegADS: 4.5,
        moveSpreadPenalty: 4.0,
        recoilSpreadPerShot: 2.0,
        maxSpreadDeg: 18.0,
        spreadRecoveryRate: 28.0,
        screenShake: 0.38,
        cursorKick: 7.0,
        color: 0xff22aa,
        isAuto: false,
        pellets: 6,
        recoilPitch: 0.06,
        scale: 0.24,
        offset: new THREE.Vector3(-0.24, -0.05, 0.02),
        rotOffset: new THREE.Euler(0, Math.PI * 0.35, 0)
    }
];

export const RARE_WEAPON_CONFIGS = [
    { ...WEAPON_CONFIGS[0], id: 'plasma', name: 'PLASMA LANCE', modelFile: 'kenney-blaster/blaster-j.glb', icon: 'assets/previews/kenney-blaster/blaster-j.png', damage: 54, penPower: 3, fireRate: 0.15, magSize: 24, baseSpreadDegHip: 1.8, baseSpreadDegADS: 0.4, screenShake: 0.22, cursorKick: 3.8, color: 0x9966ff, isAuto: true, tier: 1 },
    { ...WEAPON_CONFIGS[1], id: 'storm', name: 'STORM MK-II', modelFile: 'kenney-blaster/blaster-e.glb', icon: 'assets/previews/kenney-blaster/blaster-e.png', damage: 25, penPower: 2, fireRate: 0.065, magSize: 48, baseSpreadDegHip: 2.8, baseSpreadDegADS: 0.7, screenShake: 0.14, cursorKick: 2.4, color: 0x55ffcc, tier: 1 },
    { ...WEAPON_CONFIGS[2], id: 'nova', name: 'NOVA SHOTGUN', modelFile: 'kenney-blaster/blaster-g.glb', icon: 'assets/previews/kenney-blaster/blaster-g.png', damage: 22, penPower: 3, pellets: 8, fireRate: 0.45, magSize: 12, baseSpreadDegHip: 7.5, baseSpreadDegADS: 3.5, screenShake: 0.45, cursorKick: 8.0, color: 0xff6633, tier: 1 }
];

export const KNIFE_CONFIG = {
    id: 'knife',
    name: 'COMBAT KNIFE',
    category: 'VŨ KHÍ CẬN CHIẾN',
    damage: 85,
    penPower: 2, // Dao găm sắc bén xuyên giáp cấp 2
    fireRate: 0.30,
    range: 3.8,
    screenShake: 0.10,
    cursorKick: 1.2,
    baseSpreadDegHip: 0,
    baseSpreadDegADS: 0,
    moveSpreadPenalty: 0,
    recoilSpreadPerShot: 0,
    maxSpreadDeg: 0,
    spreadRecoveryRate: 0,
    color: 0x99e6ff,
    isKnife: true,
    isAuto: false,
    pellets: 1
};

export const MEDKIT_CONFIG = {
    id: 'medkit',
    name: 'TÚI CỨU THƯƠNG',
    category: 'TIỆN ÍCH HỒI PHỤC',
    healAmount: 45,
    isUtility: true,
    color: 0x00ff88
};

export const SHIELD_BATTERY_CONFIG = {
    id: 'shield_battery',
    name: 'PIN NĂNG LƯỢNG GIÁP',
    category: 'TIỆN ÍCH KHIÊN',
    shieldAmount: 50,
    isUtility: true,
    color: 0x00d0ff
};

// Reusable math objects to eliminate memory allocations in game loop
const _tempRay = new THREE.Ray();
const _tempNextPos = new THREE.Vector3();
const _tempHitPoint = new THREE.Vector3();
const _tempAimDir = new THREE.Vector3();
const _tempRotAxis = new THREE.Vector3(0, 1, 0);
const _tempSlashForward = new THREE.Vector3();
const _tempToEnemy = new THREE.Vector3();
const _tempToEnemyHoriz = new THREE.Vector3();
const _tempCheckRay = new THREE.Ray();
const _tempCheckRayDir = new THREE.Vector3();
const _tempSparkDir = new THREE.Vector3();
const _tempHitPointSparks = new THREE.Vector3();

export class WeaponSystem {
    constructor(scene, gltfLoader, particleSystem) {
        this.scene = scene;
        this.loader = gltfLoader;
        this.particles = particleSystem;

        this.models = {};
        this.weaponSlots = [];
        this.currentSlotIndex = 0;
        this.ammo = {};
        this.reserve = {};
        this.inventory = {
            medkits: 3
        };
        this.isUsingMedkit = false;
        this.medkitTimer = 0;
        this.medkitTotalTime = 5.0;
        this.medkitPlayerRef = null;
        this.bulletCalibers = [
            { id: 'rusty', name: 'S-Rusty Bullet', dmgMod: 1.0, penMod: 0, speedMod: 1.0 },
            { id: 'ap', name: 'AP-Armor Piercing', dmgMod: 1.2, penMod: 1, speedMod: 1.1 },
            { id: 'hv', name: 'HV-High Velocity', dmgMod: 0.95, penMod: 0, speedMod: 1.4 }
        ];
        this.currentCaliberIndex = 0;
        this.isReloading = false;
        this.reloadTimer = 0;
        this.fireCooldown = 0;
        this.recoilOffset = 0;
        this.upgrades = { damage: 0, rapid: 0, multishot: 0 };

        // Aim & Cone of fire state
        this.currentSpreadDeg = 2.2;

        // Active projectiles list
        this.projectiles = [];
        this.nextProjectileId = 1;

        // Shared geometries & materials pool
        this.bulletGeo = new THREE.CylinderGeometry(0.045, 0.045, 0.7, 6);
        this.bulletGeo.rotateX(Math.PI / 2);
        this.acidGeo = new THREE.IcosahedronGeometry(0.2, 1);

        // Pre-cached pool of bullet meshes (NOT added to scene until fired)
        this.bulletMeshPool = [];
        this.enemyMeshPool = [];
    }

    getBulletMesh(color) {
        let entry = this.bulletMeshPool.pop();
        if (!entry) {
            const mat = new THREE.MeshBasicMaterial({ color });
            const mesh = new THREE.Mesh(this.bulletGeo, mat);
            entry = { mesh, material: mat };
        } else {
            entry.material.color.setHex(color);
        }
        this.scene.add(entry.mesh);
        return entry;
    }

    recycleBulletMesh(entry) {
        if (!entry || !entry.mesh) return;
        this.scene.remove(entry.mesh);
        if (this.bulletMeshPool.length < 60) {
            this.bulletMeshPool.push(entry);
        } else {
            entry.material.dispose();
        }
    }

    getEnemyMesh(color, acid = false) {
        let entry = this.enemyMeshPool.pop();
        if (!entry) {
            const mat = new THREE.MeshBasicMaterial({ color });
            const mesh = new THREE.Mesh(acid ? this.acidGeo : this.bulletGeo, mat);
            entry = { mesh, material: mat };
        } else {
            entry.material.color.setHex(color);
        }
        this.scene.add(entry.mesh);
        return entry;
    }

    recycleEnemyMesh(entry) {
        if (!entry || !entry.mesh) return;
        this.scene.remove(entry.mesh);
        if (this.enemyMeshPool.length < 30) {
            this.enemyMeshPool.push(entry);
        } else {
            entry.material.dispose();
        }
    }

    async init() {
        const loadModel = (file) => new Promise((resolve) => {
            this.loader.load(`assets/models/${file}`, (gltf) => {
                gltf.scene.traverse(c => {
                    if (c.isMesh) {
                        c.castShadow = true;
                        c.receiveShadow = true;
                    }
                });
                this.models[file] = gltf.scene;
                resolve();
            }, undefined, () => resolve());
        });

        const allModels = [
            ...WEAPON_CONFIGS.map(w => w.modelFile),
            ...RARE_WEAPON_CONFIGS.map(w => w.modelFile)
        ].filter(Boolean);
        await Promise.all([...new Set(allModels)].map(loadModel));

        this.resetRun();
    }

    resetRun() {
        this.clear();
        // 3 ô trang bị tối giản: [1] Súng chính, [2] Dao cận chiến, [3] Túi cứu thương (mất 5s sơ cứu)
        this.weaponSlots = [
            WEAPON_CONFIGS[0], // 0: BLASTER-X
            KNIFE_CONFIG,      // 1: COMBAT KNIFE
            MEDKIT_CONFIG      // 2: TÚI CỨU THƯƠNG
        ];
        this.currentSlotIndex = 0;
        this.ammo = {
            [WEAPON_CONFIGS[0].id]: WEAPON_CONFIGS[0].magSize
        };
        // Tăng số lượng băng đạn khởi đầu lên 6 băng đạn dự trữ (16 x 6 = 96 viên)
        this.reserve = {
            [WEAPON_CONFIGS[0].id]: WEAPON_CONFIGS[0].magSize * 6
        };
        this.inventory = {
            medkits: 3
        };
        this.isUsingMedkit = false;
        this.medkitTimer = 0;
        this.medkitTotalTime = 5.0;
        this.medkitPlayerRef = null;
        this.currentCaliberIndex = 0;
        this.upgrades = { damage: 0, rapid: 0, multishot: 0 };
        this.isReloading = false;
        this.reloadTimer = 0;
        this.fireCooldown = 0;
        this.recoilOffset = 0;
        this.currentSpreadDeg = WEAPON_CONFIGS[0].baseSpreadDegHip;
        if (this.handNode) this.attachToArm(this.handNode);
    }

    get damageBoost() { return 1 + this.upgrades.damage * 0.2; }
    get fireRateBoost() { return 1 + this.upgrades.rapid * 0.125; }
    get beamCount() { return 1 + this.upgrades.multishot * 2; }

    getNetworkState() {
        return {
            gun: this.weaponSlots[0].id,
            slot: this.currentSlotIndex,
            ammo: { ...this.ammo },
            reserve: { ...this.reserve },
            upgrades: { ...this.upgrades },
            isReloading: this.isReloading,
            reloadTimer: this.reloadTimer,
            currentSpreadDeg: this.currentSpreadDeg,
            inventory: { ...this.inventory }
        };
    }

    applyNetworkState(state) {
        if (!state) return;
        const gun = [...WEAPON_CONFIGS, ...RARE_WEAPON_CONFIGS].find(w => w.id === state.gun) || WEAPON_CONFIGS[0];
        const changed = this.weaponSlots[0]?.id !== gun.id;
        this.weaponSlots[0] = gun;
        this.currentSlotIndex = Math.min(1, Math.max(0, state.slot || 0));
        this.ammo = { ...state.ammo };
        this.reserve = { ...state.reserve };
        if (state.inventory) this.inventory = { ...state.inventory };
        this.upgrades = { ...state.upgrades };
        this.isReloading = !!state.isReloading;
        this.reloadTimer = state.reloadTimer || 0;
        if (changed && this.handNode) this.attachToArm(this.handNode);
        this.updateEquippedMesh();
    }

    applyUpgrade(type) {
        const limits = { damage: 10, rapid: 8, multishot: 2 };
        if (!(type in limits)) return false;
        if (this.upgrades[type] >= limits[type]) return false;
        this.upgrades[type]++;
        return true;
    }

    equipRareWeapon(slot) {
        const weapon = RARE_WEAPON_CONFIGS[slot];
        const targetSlot = 0; // Trang bị vào súng chính
        const previous = this.weaponSlots[targetSlot];
        if (!weapon || (previous && previous.tier >= weapon.tier)) return false;
        const reserve = this.reserve[previous.id] || 0;
        delete this.ammo[previous.id];
        delete this.reserve[previous.id];
        this.weaponSlots[targetSlot] = weapon;
        this.ammo[weapon.id] = weapon.magSize;
        // Băng đạn dự trữ dồi dào khởi đầu: tối thiểu 6 băng đạn
        this.reserve[weapon.id] = Math.max(reserve, weapon.magSize * 6);
        this.currentSlotIndex = targetSlot;
        this.isReloading = false;
        this.reloadTimer = 0;
        this.fireCooldown = 0.15;
        if (this.handNode) this.attachToArm(this.handNode);
        return true;
    }

    getCurrentWeapon() {
        return this.weaponSlots[this.currentSlotIndex] || this.weaponSlots[0];
    }

    getCurrentAmmo() {
        const w = this.getCurrentWeapon();
        if (w.isKnife) {
            return { current: '∞', max: '∞', reserve: '∞', isKnife: true, isReloading: false, reloadProgress: 1 };
        }
        if (w.isUtility) {
            return { current: this.inventory.medkits, max: this.inventory.medkits, reserve: 0, isUtility: true, isReloading: false, reloadProgress: 1 };
        }
        return {
            current: this.ammo[w.id] ?? 0,
            max: w.magSize,
            reserve: this.reserve[w.id] ?? 0,
            isReloading: this.isReloading,
            reloadProgress: this.isReloading ? (1 - this.reloadTimer / w.reloadTime) : 1
        };
    }

    switchWeapon(index, player = null) {
        if (index < 0 || index >= this.weaponSlots.length) return;

        // Bất kỳ hành động đổi vũ khí nào cũng sẽ hủy tiến trình sơ cứu dở dang
        if (this.isUsingMedkit) {
            this.cancelMedkitUse();
        }

        // Bấm vào ô 2 (Túi cứu thương Medkit - Phím 3) -> Bắt đầu tiến trình sơ cứu 5 giây
        if (index === 2) {
            this.startMedkitUse(player);
            return;
        }

        if (index === this.currentSlotIndex) return;

        if (this.onCommand) this.onCommand({ type: 'switch', slot: index });
        this.currentSlotIndex = index;
        this.cancelReload();
        this.fireCooldown = 0.18;
        sounds.play('switchWeapon', { volume: 0.7 });

        // Tự động nạp đạn nếu chuyển sang vũ khí đang hết đạn trong băng
        const nextW = this.getCurrentWeapon();
        if (nextW && !nextW.isKnife && !nextW.isUtility && (this.ammo[nextW.id] || 0) <= 0 && (this.reserve[nextW.id] || 0) > 0) {
            this.reload();
        }
    }

    // Cơ chế Channeling sơ cứu vết thương trong 5.0 giây
    startMedkitUse(player) {
        if (!player || player.isDead) return false;
        if (this.inventory.medkits <= 0) return false;
        if (player.health >= player.maxHealth) return false;
        if (this.isUsingMedkit) return false;

        this.isUsingMedkit = true;
        this.medkitTimer = this.medkitTotalTime;
        this.medkitPlayerRef = player;
        sounds.playMedkit();
        return true;
    }

    cancelMedkitUse() {
        if (this.isUsingMedkit) {
            this.isUsingMedkit = false;
            this.medkitTimer = 0;
            this.medkitPlayerRef = null;
        }
    }

    usePainkiller(player) {
        if (!player || player.isDead || this.inventory.painkillers <= 0) return false;
        this.inventory.painkillers--;
        player.heal(25);
        player.painTimer = 0;
        sounds.playMedkit();
        this.particles.createImpactSparks(player.position.clone().add(new THREE.Vector3(0, 1.0, 0)), new THREE.Vector3(0, 1, 0), 0xffaa00, 14);
        return true;
    }

    useGrenade(player, enemies = null) {
        if (!player || player.isDead || this.inventory.grenades <= 0) return false;
        this.inventory.grenades--;
        sounds.play('enemyExplode', { volume: 0.9 });
        const blastPos = player.position.clone().add(new THREE.Vector3(
            Math.sin(player.mesh.rotation.y) * 4.2,
            0.5,
            Math.cos(player.mesh.rotation.y) * 4.2
        ));
        this.particles.createExplosion(blastPos, 0xff5500, 36);
        this.particles.createImpactSparks(blastPos, new THREE.Vector3(0, 1, 0), 0xffdd44, 28);
        if (enemies && enemies.length) {
            for (const e of enemies) {
                if (e && !e.isDead && e.position.distanceTo(blastPos) <= 6.0) {
                    e.takeDamage(120, null, true, player);
                }
            }
        }
        return true;
    }

    useWaterBottle(player) {
        if (!player || player.isDead || this.inventory.waterBottles <= 0) return false;
        this.inventory.waterBottles--;
        sounds.playShieldBattery();
        this.particles.createImpactSparks(player.position.clone().add(new THREE.Vector3(0, 1.0, 0)), new THREE.Vector3(0, 1, 0), 0x38bdf8, 14);
        return true;
    }

    useAmmoPack(player) {
        if (!player || player.isDead || this.inventory.ammoPacks <= 0) return false;
        this.inventory.ammoPacks--;
        for (const w of this.weaponSlots) {
            if (!w.isKnife && !w.isUtility) {
                this.reserve[w.id] = (this.reserve[w.id] || 0) + (w.magSize * 2);
            }
        }
        sounds.play('switchWeapon', { volume: 0.8, rate: 0.9 });
        this.particles.createImpactSparks(player.position.clone().add(new THREE.Vector3(0, 1.0, 0)), new THREE.Vector3(0, 1, 0), 0xffff00, 16);
        return true;
    }

    toggleBulletCaliber() {
        this.currentCaliberIndex = (this.currentCaliberIndex + 1) % this.bulletCalibers.length;
        sounds.play('switchWeapon', { volume: 0.5, rate: 1.6 });
        return this.bulletCalibers[this.currentCaliberIndex];
    }

    getCurrentCaliber() {
        return this.bulletCalibers[this.currentCaliberIndex] || this.bulletCalibers[0];
    }

    nextWeapon(player = null) {
        const next = this.currentSlotIndex === 0 ? 1 : 0;
        this.switchWeapon(next, player);
    }

    prevWeapon(player = null) {
        const prev = this.currentSlotIndex === 0 ? 1 : 0;
        this.switchWeapon(prev, player);
    }

    reload() {
        const w = this.getCurrentWeapon();
        if (w.isKnife || w.isUtility) return;
        if (this.isReloading || this.ammo[w.id] >= w.magSize || !this.reserve[w.id]) return;
        if (this.onCommand) this.onCommand({ type: 'reload' });
        this.isReloading = true;
        this.reloadTimer = w.reloadTime;
        sounds.play('switchWeapon', { volume: 0.6, rate: 1.2 });
    }

    cancelReload() {
        if (this.isReloading) {
            this.isReloading = false;
            this.reloadTimer = 0;
        }
    }

    addAmmo(packs = 2) {
        for (const w of this.weaponSlots) {
            if (w && !w.isKnife && !w.isUtility) {
                this.reserve[w.id] = Math.min(w.magSize * 15, (this.reserve[w.id] || 0) + w.magSize * packs);
            }
        }
    }

    attachToArm(handNode) {
        if (!handNode) return;
        for (const mesh of Object.values(this.weaponMeshes || {})) {
            mesh.removeFromParent();
        }
        this.handNode = handNode;
        this.weaponMeshes = {};

        this.weaponSlots.forEach(w => {
            if (!w) return;
            if (w.isKnife) {
                const mesh = this.createKnifeMesh(w);
                handNode.add(mesh);
                this.weaponMeshes[w.id] = mesh;
                return;
            }
            if (w.isUtility) return;

            const base = this.models[w.modelFile];
            if (!base) return;

            const mesh = base.clone(true);
            mesh.traverse(child => {
                if (!child.isMesh) return;
                if (Array.isArray(child.material)) {
                    child.material = child.material.map(m => m.clone());
                } else if (child.material) {
                    child.material = child.material.clone();
                }

                if (w.tier) {
                    if (Array.isArray(child.material)) {
                        child.material.forEach(m => {
                            m.color.setHex(w.color);
                            if (m.emissive) { m.emissive.setHex(w.color); m.emissiveIntensity = 0.35; }
                        });
                    } else {
                        child.material.color.setHex(w.color);
                        if (child.material.emissive) {
                            child.material.emissive.setHex(w.color);
                            child.material.emissiveIntensity = 0.35;
                        }
                    }
                }
            });
            // Kenney guns are ~0.8 model units long. Normalize to a readable
            // 0.95–1.15 world units instead of shrinking them again on the arm.
            const bounds = new THREE.Box3().setFromObject(mesh);
            handNode.updateWorldMatrix(true, false);
            const armScale = handNode.getWorldScale(new THREE.Vector3()).z;
            const worldLength = w.modelFile.includes('blaster-a') ? 0.95 : 1.15;
            const scale = worldLength / ((bounds.max.z - bounds.min.z) * armScale);
            mesh.scale.setScalar(scale);
            mesh.userData.gripOffset = new THREE.Vector3(0, 0.14, 0.18).multiplyScalar(scale);
            mesh.userData.handOffset = w.offset.clone();
            mesh.rotation.set(0, -Math.PI / 3, 0);
            mesh.position.copy(mesh.userData.gripOffset).applyQuaternion(mesh.quaternion).add(mesh.userData.handOffset);
            const muzzle = new THREE.Object3D();
            muzzle.name = 'weapon-muzzle';
            muzzle.position.set(0, 0.04, bounds.max.z + 0.025);
            mesh.add(muzzle);
            mesh.visible = false;
            handNode.add(mesh);
            this.weaponMeshes[w.id] = mesh;
        });

        this.updateEquippedMesh();
    }

    createKnifeMesh(config = KNIFE_CONFIG) {
        const group = new THREE.Group();
        const blade = new THREE.Mesh(
            new THREE.BoxGeometry(0.07, 0.48, 0.025),
            new THREE.MeshStandardMaterial({ color: config.color, metalness: 0.85, roughness: 0.2 })
        );
        const guard = new THREE.Mesh(
            new THREE.BoxGeometry(0.16, 0.045, 0.045),
            new THREE.MeshStandardMaterial({ color: 0x384458, metalness: 0.65, roughness: 0.35 })
        );
        const handle = new THREE.Mesh(
            new THREE.BoxGeometry(0.065, 0.22, 0.065),
            new THREE.MeshStandardMaterial({ color: 0x202838, roughness: 0.75 })
        );
        blade.position.y = 0.28;
        guard.position.y = 0.03;
        handle.position.y = -0.1;
        group.add(blade, guard, handle);
        group.scale.setScalar(0.8);
        group.position.set(-0.05, -0.12, 0.04);
        group.rotation.set(0, Math.PI * 0.35, -0.3);
        return group;
    }

    updateEquippedMesh() {
        const currentId = this.getCurrentWeapon().id;
        for (const [id, mesh] of Object.entries(this.weaponMeshes || {})) {
            mesh.visible = (id === currentId);
        }
    }

    updateHeldPose(character) {
        const mesh = this.weaponMeshes?.[this.getCurrentWeapon().id];
        if (!mesh?.userData.gripOffset || !this.handNode || !character) return;
        this.handNode.updateWorldMatrix(true, false);
        const parentRotation = this.handNode.getWorldQuaternion(new THREE.Quaternion());
        const facing = character.getWorldQuaternion(new THREE.Quaternion());
        mesh.quaternion.copy(parentRotation.invert().multiply(facing));
        mesh.position.copy(mesh.userData.gripOffset).applyQuaternion(mesh.quaternion).add(mesh.userData.handOffset);
        mesh.updateWorldMatrix(false, true);
    }

    getMuzzlePosition(target = new THREE.Vector3()) {
        const muzzle = this.weaponMeshes?.[this.getCurrentWeapon().id]?.getObjectByName('weapon-muzzle');
        if (!muzzle) return null;
        muzzle.updateWorldMatrix(true, false);
        return muzzle.getWorldPosition(target);
    }

    shoot(origin, targetPoint, isADS = false, isPlayer = true, damageMultiplier = 1.0, playerRef = null) {
        const current = this.getCurrentWeapon();
        if (current.isUtility) return false;

        // Nếu đang sơ cứu Medkit mà hành động bắn/chém -> Hủy sơ cứu ngay
        if (this.isUsingMedkit) {
            this.cancelMedkitUse();
        }

        // Tự động chuyển dao nếu cả súng và đạn dự trữ đều hết
        if (isPlayer && !current.isKnife && (this.ammo[current.id] <= 0) && !(this.reserve[current.id] > 0)) {
            this.switchWeapon(1, playerRef);
            return false;
        }

        // Bấm bắn khi đang nạp đạn -> Chỉ Hủy nạp đạn ngay (Reload Cancel) nếu trong băng vẫn còn đạn (> 0)
        // Nếu băng đạn đã hết (0 viên), giữ nguyên tiến trình nạp đạn không hủy để tránh bị kẹt khi giữ chuột
        if (this.isReloading) {
            if ((this.ammo[current.id] || 0) > 0) {
                this.cancelReload();
            }
            return false;
        }

        if (this.onCommand && isPlayer) {
            if (this.fireCooldown > 0) return false;
            if (!current.isKnife && (this.ammo[current.id] || 0) <= 0) {
                if ((this.reserve[current.id] || 0) > 0) this.reload();
                return false;
            }
            this.onCommand({ type: 'shoot', target: targetPoint.toArray(), ads: isADS });
            const send = this.onCommand;
            this.onCommand = null;
            try { return this.shoot(origin, targetPoint, isADS, isPlayer, damageMultiplier, playerRef); }
            finally { this.onCommand = send; }
        }

        const w = this.getCurrentWeapon();

        // Xử lý chém dao
        if (w.isKnife) {
            if (this.fireCooldown > 0) return false;
            const direction = new THREE.Vector3().subVectors(targetPoint, origin);
            if (direction.lengthSq() < 0.001) direction.set(0, 0, -1);
            direction.normalize();
            this.fireCooldown = w.fireRate;
            sounds.play('enemyAttack', { volume: 0.5, rate: 1.45 });
            this.particles?.createKnifeSlash?.(origin, direction, w.color);

            if (playerRef?.applyKickbackAndShake) playerRef.applyKickbackAndShake(w.cursorKick, w.screenShake);

            this.projectiles.push({
                meshEntry: null,
                mesh: null,
                origin: origin.clone(),
                direction,
                range: w.range,
                damage: w.damage * damageMultiplier * (isPlayer ? this.damageBoost : 1),
                penPower: w.penPower,
                critMultiplier: 1.8,
                life: 0.12,
                isPlayer,
                isKnife: true,
                ownerId: 'player'
            });
            return true;
        }

        // Kiểm tra hết băng đạn
        if (this.ammo[w.id] <= 0) {
            this.reload();
            return false;
        }

        if (this.fireCooldown > 0) return false;

        this.ammo[w.id]--;
        this.fireCooldown = w.fireRate / this.fireRateBoost;
        this.recoilOffset = w.recoilPitch;

        // Tăng nón tản đạn sau mỗi phát bắn (Recoil Spread)
        this.currentSpreadDeg = Math.min(w.maxSpreadDeg, this.currentSpreadDeg + (w.recoilSpreadPerShot || 0.8));

        // Phản lực con trỏ và rung màn hình (Cursor Kickback & Screen Shake)
        if (playerRef?.applyKickbackAndShake) {
            playerRef.applyKickbackAndShake(w.cursorKick, w.screenShake);
        }

        sounds.playShot(w.id);
        this.particles?.createMuzzleFlash?.(origin, new THREE.Vector3().subVectors(targetPoint, origin).normalize(), w.color);

        const beams = isPlayer ? this.beamCount : 1;
        const spreadRad = THREE.MathUtils.degToRad(this.currentSpreadDeg);

        for (let i = 0; i < w.pellets * beams; i++) {
            _tempAimDir.subVectors(targetPoint, origin).normalize();

            // Tính toán góc lệch Cone of Fire toán học
            const angleY = (Math.random() - 0.5) * spreadRad;
            const anglePitch = (Math.random() - 0.5) * (spreadRad * 0.3);
            _tempAimDir.applyAxisAngle(_tempRotAxis, angleY);
            _tempAimDir.y += anglePitch;
            _tempAimDir.normalize();

            // Phân nhánh đòn đánh đa tia
            const lane = Math.floor(i / w.pellets) - (beams - 1) / 2;
            _tempAimDir.applyAxisAngle(_tempRotAxis, lane * 0.07);

            // Lấy mesh từ pool linh hoạt
            const entry = this.getBulletMesh(w.color);
            entry.mesh.position.copy(origin);
            entry.mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), _tempAimDir);

            this.projectiles.push({
                meshEntry: entry,
                mesh: entry.mesh,
                id: this.nextProjectileId++,
                origin: origin.clone(),
                direction: _tempAimDir.clone(),
                speed: w.bulletSpeed,
                damage: w.damage * damageMultiplier * (isPlayer ? this.damageBoost : 1),
                penPower: w.penPower,
                critMultiplier: w.critMultiplier,
                color: w.color,
                life: 2.0,
                isPlayer: true,
                ownerId: 'player',
                isKnife: false
            });
        }

        if (this.ammo[w.id] <= 0) {
            this.reload();
        }

        return true;
    }

    shootEnemyBolt(origin, targetPos, damage = 12, speed = 35, acid = false) {
        _tempAimDir.subVectors(targetPos, origin).normalize();
        _tempAimDir.x += (Math.random() - 0.5) * 0.05;
        _tempAimDir.y += (Math.random() - 0.5) * 0.05;
        _tempAimDir.z += (Math.random() - 0.5) * 0.05;
        _tempAimDir.normalize();

        const color = acid ? 0x99ff22 : 0xff3322;
        this.particles.createMuzzleFlash(origin, _tempAimDir, color);
        sounds.play('enemyAttack', { volume: 0.65, pitchVariation: 0.1 });

        const entry = this.getEnemyMesh(color, acid);
        entry.mesh.position.copy(origin);
        entry.mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), _tempAimDir);

        this.projectiles.push({
            meshEntry: entry,
            mesh: entry.mesh,
            id: this.nextProjectileId++,
            origin: origin.clone(),
            direction: _tempAimDir.clone(),
            speed: speed,
            damage: damage,
            penPower: 1,
            critMultiplier: 1.0,
            color: color,
            life: 3.2,
            isPlayer: false,
            ownerId: 'enemy',
            isKnife: false
        });
    }

    update(delta, arena, enemies, player, onHitCallback) {
        if (this.fireCooldown > 0) {
            this.fireCooldown -= delta;
        }

        // Xử lý tiến trình sơ cứu Medkit 5 giây
        if (this.isUsingMedkit && this.medkitPlayerRef) {
            const p = this.medkitPlayerRef;
            if (p.isDead || p.health >= p.maxHealth) {
                this.cancelMedkitUse();
            } else {
                this.medkitTimer -= delta;
                if (Math.random() < 0.28) {
                    const sparkPos = p.position.clone().add(new THREE.Vector3(
                        (Math.random() - 0.5) * 0.7,
                        0.4 + Math.random() * 0.9,
                        (Math.random() - 0.5) * 0.7
                    ));
                    this.particles.createImpactSparks(sparkPos, new THREE.Vector3(0, 1, 0), 0x00ff88, 2);
                }

                if (this.medkitTimer <= 0) {
                    this.isUsingMedkit = false;
                    this.medkitTimer = 0;
                    if (this.inventory.medkits > 0) {
                        this.inventory.medkits--;
                        p.heal(50);
                        p.painTimer = 0;
                        sounds.playMedkit();
                        this.particles.createImpactSparks(p.position.clone().add(new THREE.Vector3(0, 1.0, 0)), new THREE.Vector3(0, 1, 0), 0x00ff88, 24);
                    }
                    this.medkitPlayerRef = null;
                }
            }
        }

        const currentW = this.getCurrentWeapon();
        const mainPlayer = Array.isArray(player) ? player[0] : player;

        // Cập nhật nón tản đạn (Cone of Fire co nhỏ theo thời gian)
        if (mainPlayer && !currentW.isKnife && !currentW.isUtility) {
            const isMoving = mainPlayer.velocity && (mainPlayer.velocity.x * mainPlayer.velocity.x + mainPlayer.velocity.z * mainPlayer.velocity.z > 0.05);
            const isADS = mainPlayer.isADS;
            const targetMinSpread = (isADS ? currentW.baseSpreadDegADS : currentW.baseSpreadDegHip) + (isMoving ? currentW.moveSpreadPenalty : 0);

            // Tự động co nhỏ lại về mức tối thiểu theo spreadRecoveryRate
            if (this.currentSpreadDeg > targetMinSpread) {
                this.currentSpreadDeg = Math.max(targetMinSpread, this.currentSpreadDeg - (currentW.spreadRecoveryRate || 20) * delta);
            } else if (this.currentSpreadDeg < targetMinSpread) {
                this.currentSpreadDeg = Math.min(targetMinSpread, this.currentSpreadDeg + (currentW.spreadRecoveryRate || 20) * delta);
            }
        }

        // Cập nhật tiến trình nạp đạn
        if (this.isReloading) {
            this.reloadTimer -= delta;
            if (this.reloadTimer <= 0) {
                const w = this.getCurrentWeapon();
                const amount = Math.min(w.magSize - (this.ammo[w.id] || 0), this.reserve[w.id] || 0);
                this.ammo[w.id] = (this.ammo[w.id] || 0) + amount;
                this.reserve[w.id] -= amount;
                this.isReloading = false;
                this.reloadTimer = 0;
                sounds.playClearJam(); // Âm thanh lên đạn cơ khí giòn giã khi nạp xong
            }
        } else {
            // Cơ chế tự động thay đạn: nếu súng hết đạn trong băng và còn đạn dự trữ mà chưa nạp đạn
            if (!currentW.isKnife && !currentW.isUtility && (this.ammo[currentW.id] || 0) <= 0 && (this.reserve[currentW.id] || 0) > 0) {
                this.reload();
            }
        }

        this.updateEquippedMesh();

        // Cập nhật đường đạn với Continuous Collision Detection (CCD)
        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            const p = this.projectiles[i];
            p.life -= delta;

            // Xử lý quét đòn chém diện rộng của dao
            if (p.isKnife) {
                const startPos = p.origin;
                _tempSlashForward.copy(p.direction);
                _tempSlashForward.y = 0;
                _tempSlashForward.normalize();
                const slashRange = p.range;
                let hitCount = 0;

                if (p.isPlayer) {
                    for (const enemy of enemies) {
                        if (enemy.isDead) continue;
                        _tempToEnemy.subVectors(enemy.position, startPos);
                        const dist = _tempToEnemy.length();
                        if (dist > slashRange + (enemy.radius || 0.6)) continue;
                        if (Math.abs(_tempToEnemy.y) > 2.2) continue;

                        _tempToEnemyHoriz.copy(_tempToEnemy);
                        _tempToEnemyHoriz.y = 0;
                        _tempToEnemyHoriz.normalize();
                        const dot = _tempSlashForward.dot(_tempToEnemyHoriz);
                        if (dot < 0.25) continue; // Cung quét chém 150°

                        // Check cản tường
                        _tempCheckRayDir.copy(_tempToEnemy).normalize();
                        _tempCheckRay.set(startPos, _tempCheckRayDir);
                        let blocked = false;
                        for (const col of arena.colliders) {
                            const hit = _tempCheckRay.intersectBox(col, _tempHitPoint);
                            if (hit && startPos.distanceTo(hit) < dist - 0.3) {
                                blocked = true;
                                break;
                            }
                        }
                        if (blocked) continue;

                        hitCount++;
                        const isCrit = dot > 0.82 && (Math.random() < 0.35);
                        const finalDamage = p.damage * (isCrit ? p.critMultiplier : 1.0);

                        if (enemy.velocity) {
                            enemy.velocity.addScaledVector(_tempToEnemyHoriz, 4.5);
                        }

                        // Sát thương dao với Pen Power 2
                        const hitResult = enemy.takeDamage(finalDamage, p.penPower, isCrit, _tempSlashForward);
                        _tempHitPointSparks.copy(enemy.position);
                        _tempHitPointSparks.y += 1.0;
                        _tempSparkDir.copy(_tempSlashForward).negate();
                        this.particles.createImpactSparks(_tempHitPointSparks, _tempSparkDir, isCrit ? 0xff2255 : 0x99e6ff, isCrit ? 14 : 9);
                        if (onHitCallback) onHitCallback(finalDamage, isCrit, _tempHitPointSparks, hitResult);
                    }

                    if (hitCount > 0) {
                        sounds.playHitMarker(false);
                    }
                }
                this.projectiles.splice(i, 1);
                continue;
            }

            if (p.life <= 0) {
                this.removeProjectile(i);
                continue;
            }

            // Continuous Collision Detection (CCD) theo frame
            const stepDist = p.speed * delta;
            const startPos = p.mesh.position;
            _tempNextPos.copy(startPos).addScaledVector(p.direction, stepDist);
            _tempRay.set(startPos, p.direction);
            let hitFound = false;

            // 1. Va chạm chướng ngại vật Arena
            for (const col of arena.colliders) {
                const hit = _tempRay.intersectBox(col, _tempHitPoint);
                if (hit && startPos.distanceTo(hit) <= stepDist) {
                    this.particles.createImpactSparks(hit, p.direction.clone().negate(), p.color, 8);
                    this.removeProjectile(i);
                    hitFound = true;
                    break;
                }
            }
            if (hitFound) continue;

            // 2. Đạn người chơi va chạm quái
            if (p.isPlayer) {
                for (const enemy of enemies) {
                    if (enemy.isDead) continue;
                    const hitInfo = enemy.checkHit(startPos, _tempNextPos, _tempRay);
                    if (hitInfo.hit) {
                        const isCrit = hitInfo.isCrit;
                        const finalDamage = p.damage * (isCrit ? p.critMultiplier : 1.0);

                        // Gọi takeDamage kèm penPower
                        const hitResult = enemy.takeDamage(finalDamage, p.penPower, isCrit, p.direction);

                        // Tia lửa phụ thuộc vào việc xuyên máu hay bị giáp cản
                        const sparkColor = hitResult?.isPenetrated ? (isCrit ? 0xff2255 : p.color) : 0xffffff;
                        this.particles.createImpactSparks(hitInfo.point, p.direction.clone().negate(), sparkColor, isCrit ? 14 : 8);

                        sounds.playHitMarker(isCrit);
                        if (onHitCallback) onHitCallback(finalDamage, isCrit, hitInfo.point, hitResult);

                        this.removeProjectile(i);
                        hitFound = true;
                        break;
                    }
                }
            } else {
                // 3. Đạn quái va chạm người chơi
                const targets = Array.isArray(player) ? player : [player];
                for (const target of targets) {
                    if (!target || target.isDead) continue;
                    const hitInfo = target.checkHit(startPos, _tempNextPos, _tempRay);
                    if (hitInfo.hit) {
                        target.takeDamage(p.damage, p.direction);
                        this.particles.createImpactSparks(hitInfo.point, p.direction.clone().negate(), p.color, 10);
                        this.removeProjectile(i);
                        hitFound = true;
                        break;
                    }
                }
            }

            if (!hitFound) {
                p.mesh.position.copy(_tempNextPos);
            }
        }
    }

    removeProjectile(index) {
        const p = this.projectiles[index];
        if (p) {
            if (p.meshEntry) {
                if (p.isPlayer) {
                    this.recycleBulletMesh(p.meshEntry);
                } else {
                    this.recycleEnemyMesh(p.meshEntry);
                }
            }
            this.projectiles.splice(index, 1);
        }
    }

    clear() {
        for (const p of this.projectiles) {
            if (p.meshEntry) {
                if (p.isPlayer) {
                    this.recycleBulletMesh(p.meshEntry);
                } else {
                    this.recycleEnemyMesh(p.meshEntry);
                }
            }
        }
        this.projectiles = [];
    }
}
