import * as THREE from 'three';
import { sounds } from './audio.js';

export const WEAPON_CONFIGS = [
    {
        id: 'blaster',
        name: 'BLASTER-X',
        modelFile: 'blaster.glb',
        fireRate: 0.20,
        damage: 26,
        critMultiplier: 2.0,
        magSize: 16,
        reloadTime: 1.1,
        bulletSpeed: 95,
        spreadHip: 0.018,
        spreadADS: 0.004,
        color: 0x00f0ff,
        isAuto: false,
        pellets: 1,
        recoilPitch: 0.025,
        scale: 0.11,
        offset: new THREE.Vector3(-0.24, -0.05, 0.02),
        rotOffset: new THREE.Euler(0, Math.PI * 0.35, 0)
    },
    {
        id: 'repeater',
        name: 'REPEATER-9',
        modelFile: 'blaster-repeater.glb',
        fireRate: 0.10,
        damage: 16,
        critMultiplier: 2.0,
        magSize: 32,
        reloadTime: 1.35,
        bulletSpeed: 105,
        spreadHip: 0.038,
        spreadADS: 0.010,
        color: 0xffaa00,
        isAuto: true,
        pellets: 1,
        recoilPitch: 0.018,
        scale: 0.12,
        offset: new THREE.Vector3(-0.24, -0.05, 0.02),
        rotOffset: new THREE.Euler(0, Math.PI * 0.35, 0)
    },
    {
        id: 'scatter',
        name: 'SCATTER-V',
        modelFile: 'blaster.glb',
        fireRate: 0.62,
        damage: 13,
        critMultiplier: 1.8,
        magSize: 8,
        reloadTime: 1.6,
        bulletSpeed: 85,
        spreadHip: 0.085,
        spreadADS: 0.045,
        color: 0xff22aa,
        isAuto: false,
        pellets: 6,
        recoilPitch: 0.06,
        scale: 0.12,
        offset: new THREE.Vector3(-0.24, -0.05, 0.02),
        rotOffset: new THREE.Euler(0, Math.PI * 0.35, 0)
    }
];

export const RARE_WEAPON_CONFIGS = [
    { ...WEAPON_CONFIGS[0], id: 'plasma', name: 'PLASMA LANCE', damage: 52, fireRate: 0.16, magSize: 24, color: 0x9966ff, isAuto: true, tier: 1 },
    { ...WEAPON_CONFIGS[1], id: 'storm', name: 'STORM MK-II', damage: 24, fireRate: 0.065, magSize: 48, color: 0x55ffcc, tier: 1 },
    { ...WEAPON_CONFIGS[2], id: 'nova', name: 'NOVA SHOTGUN', damage: 20, pellets: 8, fireRate: 0.48, magSize: 12, color: 0xff6633, tier: 1 }
];

export const KNIFE_CONFIG = {
    id: 'knife',
    name: 'COMBAT KNIFE',
    damage: 48,
    fireRate: 0.42,
    range: 2.35,
    color: 0xdbe8ff,
    isKnife: true,
    isAuto: false,
    pellets: 1
};

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
        this.isReloading = false;
        this.reloadTimer = 0;
        this.fireCooldown = 0;
        this.recoilOffset = 0;
        this.upgrades = { damage: 0, rapid: 0, multishot: 0 };

        // Active projectiles
        this.projectiles = [];

        // Projectile reusable geometry
        this.bulletGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.6, 6);
        this.bulletGeo.rotateX(Math.PI / 2);
        this.acidGeo = new THREE.IcosahedronGeometry(0.18, 1);
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

        await Promise.all([
            loadModel('blaster.glb'),
            loadModel('blaster-repeater.glb')
        ]);

        this.resetRun();
    }

    resetRun() {
        this.clear();
        // Slot 1 is the only firearm. Slot 2 is always available as a knife.
        this.weaponSlots = [WEAPON_CONFIGS[0], KNIFE_CONFIG];
        this.currentSlotIndex = 0;
        this.ammo = { [WEAPON_CONFIGS[0].id]: WEAPON_CONFIGS[0].magSize };
        this.reserve = { [WEAPON_CONFIGS[0].id]: WEAPON_CONFIGS[0].magSize * 2 };
        this.upgrades = { damage: 0, rapid: 0, multishot: 0 };
        this.isReloading = false;
        this.reloadTimer = 0;
        this.fireCooldown = 0;
        this.recoilOffset = 0;
        if (this.handNode) this.attachToArm(this.handNode);
    }

    get damageBoost() { return 1 + this.upgrades.damage * 0.2; }
    get fireRateBoost() { return 1 + this.upgrades.rapid * 0.125; }
    get beamCount() { return 1 + this.upgrades.multishot * 2; }

    applyUpgrade(type) {
        const limits = { damage: 10, rapid: 8, multishot: 2 };
        if (!(type in limits)) return false;
        if (this.upgrades[type] >= limits[type]) return false;
        this.upgrades[type]++;
        return true;
    }

    equipRareWeapon(slot) {
        const weapon = RARE_WEAPON_CONFIGS[slot];
        const previous = this.weaponSlots[0];
        if (!weapon || previous.tier >= weapon.tier) return false;
        const reserve = this.reserve[previous.id] || 0;
        delete this.ammo[previous.id];
        delete this.reserve[previous.id];
        this.weaponSlots[0] = weapon;
        this.ammo[weapon.id] = weapon.magSize;
        this.reserve[weapon.id] = reserve;
        this.currentSlotIndex = 0;
        this.isReloading = false;
        this.reloadTimer = 0;
        this.fireCooldown = 0.15;
        if (this.handNode) this.attachToArm(this.handNode);
        return true;
    }

    getCurrentWeapon() {
        return this.weaponSlots[this.currentSlotIndex];
    }

    getCurrentAmmo() {
        const w = this.getCurrentWeapon();
        if (w.isKnife) {
            return { current: '∞', max: '∞', reserve: 0, isKnife: true, isReloading: false, reloadProgress: 1 };
        }
        return {
            current: this.ammo[w.id],
            max: w.magSize,
            reserve: this.reserve[w.id] || 0,
            isReloading: this.isReloading,
            reloadProgress: this.isReloading ? (1 - this.reloadTimer / w.reloadTime) : 1
        };
    }

    switchWeapon(index) {
        if (index < 0 || index >= this.weaponSlots.length || index === this.currentSlotIndex) return;
        if (this.onCommand) { this.onCommand({ type: 'switch', slot: index }); return; }
        this.currentSlotIndex = index;
        this.isReloading = false;
        this.reloadTimer = 0;
        this.fireCooldown = 0.2;
        sounds.play('switchWeapon', { volume: 0.7 });
    }

    nextWeapon() {
        const next = (this.currentSlotIndex + 1) % this.weaponSlots.length;
        this.switchWeapon(next);
    }

    prevWeapon() {
        const prev = (this.currentSlotIndex - 1 + this.weaponSlots.length) % this.weaponSlots.length;
        this.switchWeapon(prev);
    }

    reload() {
        if (this.onCommand) { this.onCommand({ type: 'reload' }); return; }
        const w = this.getCurrentWeapon();
        if (w.isKnife) return;
        if (this.isReloading || this.ammo[w.id] >= w.magSize || !this.reserve[w.id]) return;
        this.isReloading = true;
        this.reloadTimer = w.reloadTime;
        sounds.play('switchWeapon', { volume: 0.6, rate: 1.2 });
    }

    addAmmo(packs = 1) {
        const w = this.weaponSlots.find(weapon => !weapon.isKnife);
        if (w) this.reserve[w.id] = Math.min(w.magSize * 12, (this.reserve[w.id] || 0) + w.magSize * packs);
    }

    attachToArm(handNode) {
        if (!handNode) return;
        for (const mesh of Object.values(this.weaponMeshes || {})) {
            mesh.removeFromParent();
            mesh.traverse(child => { if (child.isMesh) child.material.dispose(); });
        }
        this.handNode = handNode;
        this.weaponMeshes = {};

        this.weaponSlots.forEach(w => {
            if (w.isKnife) {
                const mesh = this.createKnifeMesh(w);
                handNode.add(mesh);
                this.weaponMeshes[w.id] = mesh;
                return;
            }
            const base = this.models[w.modelFile];
            if (!base) return;

            const mesh = base.clone(true);
            mesh.traverse(child => {
                if (!child.isMesh) return;
                child.material = child.material.clone();
                if (w.tier) {
                    child.material.color.setHex(w.color);
                    if (child.material.emissive) {
                        child.material.emissive.setHex(w.color);
                        child.material.emissiveIntensity = 0.35;
                    }
                }
            });
            mesh.scale.set(w.scale, w.scale, w.scale);
            mesh.position.copy(w.offset);
            mesh.rotation.copy(w.rotOffset);
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

    shoot(origin, targetPoint, isADS = false, isPlayer = true, damageMultiplier = 1.0) {
        const current = this.getCurrentWeapon();
        if (isPlayer && !current.isKnife && this.ammo[current.id] <= 0 && !(this.reserve[current.id] > 0)) {
            // Automatic fallback keeps the player armed when the magazine and reserve are empty.
            this.switchWeapon(1);
            return false;
        }
        if (this.onCommand && isPlayer) {
            if (this.fireCooldown > 0 || this.isReloading) return false;
            if (!current.isKnife && this.ammo[current.id] <= 0) { this.reload(); return false; }
            this.onCommand({ type: 'shoot', target: targetPoint.toArray(), ads: isADS });
            this.fireCooldown = current.fireRate / this.fireRateBoost;
            return true;
        }
        const w = this.getCurrentWeapon();
        if (this.isReloading) return false;
        if (w.isKnife) {
            if (this.fireCooldown > 0) return false;
            const direction = new THREE.Vector3().subVectors(targetPoint, origin);
            if (direction.lengthSq() < 0.001) direction.set(0, 0, -1);
            direction.normalize();
            this.fireCooldown = w.fireRate;
            sounds.play('enemyAttack', { volume: 0.45, rate: 1.45 });
            this.projectiles.push({
                mesh: null,
                origin: origin.clone(),
                direction,
                range: w.range,
                damage: w.damage * damageMultiplier,
                critMultiplier: 1,
                life: 0.08,
                isPlayer,
                isKnife: true,
                ownerId: 'player'
            });
            return true;
        }
        if (this.ammo[w.id] <= 0) {
            this.reload();
            return false;
        }
        if (this.fireCooldown > 0) return false;

        this.ammo[w.id]--;
        this.fireCooldown = w.fireRate / this.fireRateBoost;
        this.recoilOffset = w.recoilPitch;

        sounds.playShot(w.id);

        const spreadVal = isADS ? w.spreadADS : w.spreadHip;
        this.particles.createMuzzleFlash(origin, new THREE.Vector3(0, 0, 1), w.color);

        const beams = isPlayer ? this.beamCount : 1;
        for (let i = 0; i < w.pellets * beams; i++) {
            const dir = new THREE.Vector3().subVectors(targetPoint, origin).normalize();

            dir.x += (Math.random() - 0.5) * spreadVal;
            dir.y += (Math.random() - 0.5) * spreadVal;
            dir.z += (Math.random() - 0.5) * spreadVal;
            dir.normalize();
            // Keep a central shot, with extra lanes fanning symmetrically out.
            const lane = Math.floor(i / w.pellets) - (beams - 1) / 2;
            dir.applyAxisAngle(new THREE.Vector3(0, 1, 0), lane * 0.07);

            const mat = new THREE.MeshBasicMaterial({ color: w.color });
            const bulletMesh = new THREE.Mesh(this.bulletGeo, mat);
            bulletMesh.position.copy(origin);
            bulletMesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), dir);

            this.scene.add(bulletMesh);

            this.projectiles.push({
                mesh: bulletMesh,
                direction: dir,
                speed: w.bulletSpeed,
                damage: w.damage * damageMultiplier * (isPlayer ? this.damageBoost : 1),
                critMultiplier: w.critMultiplier,
                color: w.color,
                life: 2.5,
                isPlayer: isPlayer,
                ownerId: 'player'
            });
        }

        if (this.ammo[w.id] <= 0) {
            this.reload();
        }

        return true;
    }

    shootEnemyBolt(origin, targetPos, damage = 12, speed = 35, acid = false) {
        const dir = new THREE.Vector3().subVectors(targetPos, origin).normalize();
        dir.x += (Math.random() - 0.5) * 0.06;
        dir.y += (Math.random() - 0.5) * 0.06;
        dir.z += (Math.random() - 0.5) * 0.06;
        dir.normalize();

        const color = acid ? 0x99ff22 : 0xff3322;
        const mat = new THREE.MeshBasicMaterial({ color });
        const bulletMesh = new THREE.Mesh(acid ? this.acidGeo : this.bulletGeo, mat);
        bulletMesh.position.copy(origin);
        bulletMesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), dir);

        this.scene.add(bulletMesh);
        this.particles.createMuzzleFlash(origin, dir, color);

        sounds.play('enemyAttack', { volume: 0.65, pitchVariation: 0.1 });

        this.projectiles.push({
            mesh: bulletMesh,
            direction: dir,
            speed: speed,
            damage: damage,
            critMultiplier: 1.0,
            color: color,
            life: 3.5,
            isPlayer: false,
            ownerId: 'enemy'
        });
    }

    update(delta, arena, enemies, player, onHitCallback) {
        if (this.fireCooldown > 0) {
            this.fireCooldown -= delta;
        }

        if (this.isReloading) {
            this.reloadTimer -= delta;
            if (this.reloadTimer <= 0) {
                const w = this.getCurrentWeapon();
                const amount = Math.min(w.magSize - this.ammo[w.id], this.reserve[w.id] || 0);
                this.ammo[w.id] += amount;
                this.reserve[w.id] -= amount;
                this.isReloading = false;
            }
        }

        this.updateEquippedMesh();

        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            const p = this.projectiles[i];
            p.life -= delta;

            if (p.isKnife) {
                const startPos = p.origin;
                const ray = new THREE.Ray(startPos, p.direction);
                const endPos = startPos.clone().addScaledVector(p.direction, p.range);
                let blocked = false;
                for (const col of arena.colliders) {
                    const hit = ray.intersectBox(col, new THREE.Vector3());
                    if (hit && startPos.distanceTo(hit) <= p.range) {
                        blocked = true;
                        break;
                    }
                }
                if (!blocked && p.isPlayer) {
                    for (const enemy of enemies) {
                        if (enemy.isDead) continue;
                        const hitInfo = enemy.checkHit(startPos, endPos, ray);
                        if (hitInfo.hit) {
                            const finalDamage = p.damage * (hitInfo.isCrit ? p.critMultiplier : 1);
                            enemy.takeDamage(finalDamage, hitInfo.isCrit, p.direction);
                            this.particles.createImpactSparks(hitInfo.point, p.direction.clone().negate(), 0xdbe8ff, 8);
                            if (onHitCallback) onHitCallback(finalDamage, hitInfo.isCrit, hitInfo.point);
                            break;
                        }
                    }
                }
                this.removeProjectile(i);
                continue;
            }

            if (p.life <= 0) {
                this.removeProjectile(i);
                continue;
            }

            const stepDist = p.speed * delta;
            const startPos = p.mesh.position.clone();
            const nextPos = startPos.clone().addScaledVector(p.direction, stepDist);

            const ray = new THREE.Ray(startPos, p.direction);
            let hitFound = false;

            // 1. Obstacle collision
            for (const col of arena.colliders) {
                const hit = ray.intersectBox(col, new THREE.Vector3());
                if (hit && startPos.distanceTo(hit) <= stepDist) {
                    this.particles.createImpactSparks(hit, p.direction.clone().negate(), p.color, 8);
                    this.removeProjectile(i);
                    hitFound = true;
                    break;
                }
            }
            if (hitFound) continue;

            // 2. Player projectiles vs Enemies
            if (p.isPlayer) {
                for (const enemy of enemies) {
                    if (enemy.isDead) continue;
                    const hitInfo = enemy.checkHit(startPos, nextPos, ray);
                    if (hitInfo.hit) {
                        const isCrit = hitInfo.isCrit;
                        const finalDamage = p.damage * (isCrit ? p.critMultiplier : 1.0);

                        enemy.takeDamage(finalDamage, isCrit, p.direction);
                        this.particles.createImpactSparks(hitInfo.point, p.direction.clone().negate(), isCrit ? 0xff2255 : p.color, isCrit ? 14 : 8);

                        sounds.playHitMarker(isCrit);
                        if (onHitCallback) onHitCallback(finalDamage, isCrit, hitInfo.point);

                        this.removeProjectile(i);
                        hitFound = true;
                        break;
                    }
                }
            } else {
                // 3. Enemy projectiles vs Player
                for (const target of (Array.isArray(player) ? player : [player])) {
                    if (!target || target.isDead) continue;
                    const hitInfo = target.checkHit(startPos, nextPos, ray);
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
                p.mesh.position.copy(nextPos);
            }
        }
    }

    removeProjectile(index) {
        const p = this.projectiles[index];
        if (p) {
            if (p.mesh) {
                this.scene.remove(p.mesh);
                // Projectile geometries are shared for the lifetime of the system.
                p.mesh.material.dispose();
            }
            this.projectiles.splice(index, 1);
        }
    }

    clear() {
        for (const p of this.projectiles) {
            if (p.mesh) {
                this.scene.remove(p.mesh);
                p.mesh.material.dispose();
            }
        }
        this.projectiles = [];
    }
}
