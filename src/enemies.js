import * as THREE from 'three';
import * as SkeletonUtils from '../libs/SkeletonUtils.js';
import { sounds } from './audio.js';
import { HealthBar3D } from './healthbar.js';

const ZOMBIE_RADII = { walker: 0.6, sprinter: 0.55, tank: 0.9, boss: 1.3, giant: 1.65, spitter: 0.7 };

const _upAxis = new THREE.Vector3(0, 1, 0);
const _tempCenter = new THREE.Vector3();
const _tempSphere = new THREE.Sphere();
const _tempHitPoint = new THREE.Vector3();
const _tempToPlayer = new THREE.Vector3();
const _tempSpitOrigin = new THREE.Vector3();
const _tempPlayerTarget = new THREE.Vector3();
const _tempSeparation = new THREE.Vector3();
const _tempDiff = new THREE.Vector3();
const _tempMoveVel = new THREE.Vector3();
const _tempDesiredDir = new THREE.Vector3();
const _tempNextPos = new THREE.Vector3();
const _tempLeftDir = new THREE.Vector3();
const _tempRightDir = new THREE.Vector3();
const _tempCheckPos = new THREE.Vector3();

export class Zombie {
    constructor(scene, type, position, gltfModels, particles, phaseNum = 1, weapons = null) {
        this.scene = scene;
        this.type = type;
        this.weapons = weapons;
        this.spitCharge = 0;
        this.position = position.clone();
        this.particles = particles;
        this.isDead = false;
        this.radius = ZOMBIE_RADII[type] ?? ZOMBIE_RADII.walker;

        // Infinite phase scaling formulas
        const phaseMult = 1 + (phaseNum - 1) * 0.22; // +22% HP per phase
        const speedMult = Math.min(1.45, 1 + (phaseNum - 1) * 0.03); // Speed scales up to +45%
        const dmgMult = 1 + (phaseNum - 1) * 0.12;

        if (type === 'giant') {
            this.baseHealth = 460;
            this.baseArmor = 220;
            this.armorClass = 3; // Giáp nặng cấp 3
            this.speed = 2.8 * speedMult;
            this.scale = 3.8;
            this.damage = Math.round(35 * dmgMult);
            this.attackRange = 3.1;
            this.attackCooldown = 2.4;
            this.scoreValue = 350 * phaseNum;
        } else if (type === 'spitter') {
            this.baseHealth = 100;
            this.baseArmor = 20;
            this.armorClass = 1; // Giáp nhẹ cấp 1
            this.speed = 3.9 * speedMult;
            this.scale = 1.85;
            this.damage = Math.round(18 * dmgMult);
            this.attackRange = 1.5;
            this.attackCooldown = 2.8;
            this.scoreValue = 160 * phaseNum;
        } else if (type === 'boss') {
            this.baseHealth = 700;
            this.baseArmor = 380;
            this.armorClass = 4; // Giáp siêu cấp 4
            this.speed = 4.2 * speedMult;
            this.scale = 2.4;
            this.damage = Math.round(28 * dmgMult);
            this.attackRange = 2.2;
            this.attackCooldown = 1.2;
            this.scoreValue = 600 * phaseNum;
        } else if (type === 'tank') {
            this.baseHealth = 220;
            this.baseArmor = 130;
            this.armorClass = 2; // Giáp kim loại cấp 2
            this.speed = 3.6 * speedMult;
            this.scale = 2.1;
            this.damage = Math.round(22 * dmgMult);
            this.attackRange = 1.8;
            this.attackCooldown = 1.4;
            this.scoreValue = 180 * phaseNum;
        } else if (type === 'sprinter') {
            this.baseHealth = 55;
            this.baseArmor = 0;
            this.armorClass = 0; // Không có giáp
            this.speed = 9.0 * speedMult;
            this.scale = 1.6;
            this.damage = Math.round(14 * dmgMult);
            this.attackRange = 1.3;
            this.attackCooldown = 0.85;
            this.scoreValue = 120 * phaseNum;
        } else { // 'walker'
            this.baseHealth = 85;
            this.baseArmor = 0;
            this.armorClass = 0; // Không có giáp
            this.speed = 4.8 * speedMult;
            this.scale = 1.65;
            this.damage = Math.round(16 * dmgMult);
            this.attackRange = 1.4;
            this.attackCooldown = 1.1;
            this.scoreValue = 90 * phaseNum;
        }

        this.maxHealth = Math.round(this.baseHealth * phaseMult);
        this.health = this.maxHealth;
        this.maxArmor = Math.round(this.baseArmor * phaseMult);
        this.armor = this.maxArmor;

        this.attackTimer = 0.4 + Math.random() * 0.5;
        this.isAttacking = false;
        this.attackDuration = type === 'giant' ? 0.9 : 0.5;
        this.currentAttackTimer = 0;
        this.flashTimer = 0;

        // Model & Visuals
        this.mesh = null;
        this.mixer = null;
        this.animations = {};
        this.currentAction = null;
        this.healthBar = null;

        this.setupVisuals(gltfModels);
    }

    setupVisuals(models) {
        let baseModelKey = 'character-zombie';
        if (this.type === 'sprinter') {
            baseModelKey = models['character-skeleton'] ? 'character-skeleton' : 'character-zombie';
        } else if (this.type === 'boss') {
            baseModelKey = models['character-vampire'] ? 'character-vampire' : 'character-zombie';
        }

        const base = models[baseModelKey];
        if (!base) return;

        this.mesh = SkeletonUtils.clone(base.scene);
        this.mesh.scale.set(this.scale, this.scale, this.scale);
        if (this.type === 'sprinter') this.mesh.scale.multiply(new THREE.Vector3(0.8, 1, 0.8));
        if (this.type === 'giant') this.mesh.scale.multiply(new THREE.Vector3(1.15, 1, 1.15));
        this.mesh.position.copy(this.position);
        this.mesh.rotation.y = Math.random() * Math.PI * 2;

        // Visual distinction per zombie tier
        this.mesh.traverse(child => {
            if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
                child.material = child.material.clone();

                if (this.type === 'giant') {
                    child.material.color.setHex(0x996044);
                } else if (this.type === 'spitter') {
                    child.material.color.setHex(0x709d28);
                } else if (this.type === 'tank') {
                    // Dark rusted bruised armor
                    child.material.color.setHex(0x554433);
                } else if (this.type === 'boss') {
                    // Glowing crimson vampire overlord
                    child.material.color.setHex(0x770022);
                } else if (this.type === 'sprinter') {
                    // Bleached bone skeleton
                    child.material.color.setHex(0xffd34e);
                }
            }
        });

        this.addMutationVisuals();

        this.scene.add(this.mesh);
        const barColor = this.type === 'spitter' ? 0x99ff22 : this.type === 'boss' ? 0xff2255 : 0xff4d5f;
        this.healthBar = new HealthBar3D(this.scene, {
            width: this.type === 'giant' || this.type === 'boss' ? 1.8 : 1.15,
            offsetY: this.scale * 1.05,
            color: barColor
        });
        this.healthBar.update(this.position, this.health, this.maxHealth, true);

        // Animation mixer
        if (base.animations && base.animations.length > 0) {
            this.mixer = new THREE.AnimationMixer(this.mesh);
            base.animations.forEach(clip => {
                this.animations[clip.name] = this.mixer.clipAction(clip);
            });

            // Start with sprint for fast zombies or walk for regular
            const startAnim = (this.type === 'sprinter') ? 'sprint' : 'walk';
            this.playAnimation(this.animations[startAnim] ? startAnim : 'walk');
        }
    }

    addMutationVisuals() {
        // Silhouettes remain readable at a distance, using the existing rig.
        const color = this.type === 'spitter' ? 0x99ff22 : this.type === 'giant' ? 0xff6622 : 0xffdd33;
        this.mutationParts = [];
        const add = (geometry, x, y, z, anchor = 'torso') => {
            const material = new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 0.45, roughness: 0.5 });
            material.userData.baseEmissive = color;
            const part = new THREE.Mesh(geometry, material);
            part.position.set(x, y, z);
            part.castShadow = true;
            (this.mesh.getObjectByName(anchor) || this.mesh).add(part);
            this.mutationParts.push(part);
            return part;
        };
        if (this.type === 'spitter') {
            add(new THREE.IcosahedronGeometry(0.16, 1), -0.17, 0.17, -0.16);
            add(new THREE.IcosahedronGeometry(0.16, 1), 0.17, 0.17, -0.16);
            this.spitMouth = add(new THREE.IcosahedronGeometry(0.075, 1), 0, 0.16, 0.19, 'head');
        } else if (this.type === 'giant') {
            add(new THREE.BoxGeometry(0.18, 0.12, 0.26), -0.21, 0.17, 0);
            add(new THREE.BoxGeometry(0.18, 0.12, 0.26), 0.21, 0.17, 0);
            add(new THREE.ConeGeometry(0.07, 0.22, 4), -0.14, 0.42, 0, 'head');
            add(new THREE.ConeGeometry(0.07, 0.22, 4), 0.14, 0.42, 0, 'head');
            this.stompRing = new THREE.Mesh(new THREE.RingGeometry(0.88, 1, 40),
                new THREE.MeshBasicMaterial({ color: 0xff6622, transparent: true, opacity: 0.7, side: THREE.DoubleSide, depthWrite: false }));
            this.stompRing.rotation.x = -Math.PI / 2;
            this.stompRing.scale.setScalar(this.attackRange);
            this.stompRing.visible = false;
            this.scene.add(this.stompRing);
        } else if (this.type === 'sprinter') {
            for (const x of [-0.12, 0, 0.12]) {
                const fin = add(new THREE.ConeGeometry(0.05, 0.28, 3), x, 0.17, -0.14);
                fin.rotation.x = -0.65;
            }
        }
    }

    playAnimation(name, duration = 0.15) {
        if (!this.mixer || !this.animations[name]) return;
        const newAction = this.animations[name];

        if (this.currentAction === newAction) return;

        if (this.currentAction) {
            this.currentAction.fadeOut(duration);
        }

        newAction.reset();
        newAction.fadeIn(duration);
        newAction.play();
        this.currentAction = newAction;
    }

    takeDamage(amount, penPower = 1, isCrit = false, hitDir = null) {
        if (this.isDead) return { isPenetrated: false, isBlunt: false, healthDamage: 0, armorDamage: 0 };

        const ac = this.armorClass || 0;
        const isPenetrated = (penPower >= ac) || (this.armor <= 0);
        let healthDmg = 0;
        let armorDmg = 0;
        let isBlunt = false;

        if (isPenetrated) {
            // Đạn xuyên giáp (Pen Power >= AC): Sát thương trừ thẳng vào Máu (Health), giảm nhẹ Giáp
            healthDmg = Math.round(amount * 0.88);
            armorDmg = Math.round(amount * 0.32);
            this.health -= healthDmg;
            this.armor = Math.max(0, this.armor - armorDmg);
            this.flashTimer = 0.12;

            sounds.play('enemyHurt', { volume: 0.5, pitchVariation: 0.2 });

            // Nháy đỏ / cam (Damage Flash Shader/Material)
            if (this.mesh) {
                this.mesh.traverse(c => {
                    if (c.isMesh && c.material && c.material.emissive) {
                        c.material.emissive.setHex(isCrit ? 0xff0022 : 0xcc3300);
                    }
                });
            }
        } else {
            // Bị giáp cản (Pen Power < AC): Đạn trừ vào Giáp, chỉ gây sát thương cùn (Blunt: 1-2 HP) vào Máu
            armorDmg = Math.min(this.armor, Math.round(amount));
            this.armor = Math.max(0, this.armor - armorDmg);
            healthDmg = Math.min(2, Math.max(1, Math.round(amount * 0.08))); // 1-2 HP sát thương cùn
            this.health -= healthDmg;
            isBlunt = true;
            this.flashTimer = 0.08;

            // Âm thanh kim loại va đập cản giáp
            sounds.playArmorDeflect();

            // Nháy trắng sáng kim loại (Damage Flash kim loại)
            if (this.mesh) {
                this.mesh.traverse(c => {
                    if (c.isMesh && c.material && c.material.emissive) {
                        c.material.emissive.setHex(0xffffff);
                    }
                });
            }
        }

        // Knockback (tanks and bosses have heavy resistance)
        if (hitDir && this.type !== 'boss') {
            const kb = this.type === 'giant' ? 0.08 : this.type === 'tank' ? 0.15 : 0.55;
            const displaced = this.position.clone().addScaledVector(new THREE.Vector3(hitDir.x, 0, hitDir.z), kb);
            if (!this.arena || !this.arena.checkCollision(displaced, this.radius)) this.position.copy(displaced);
        }

        if (this.health <= 0) {
            this.die();
        }

        return {
            isPenetrated,
            isBlunt,
            healthDamage: healthDmg,
            armorDamage: armorDmg,
            isCrit
        };
    }

    die() {
        if (this.isDead) return;
        this.isDead = true;

        sounds.play('enemyDestroy', { volume: this.type === 'boss' ? 1.0 : 0.75 });
        this.disposeVisuals();
    }

    disposeVisuals() {
        this.healthBar?.dispose();
        this.healthBar = null;
        if (this.stompRing) {
            this.stompRing.removeFromParent();
            this.stompRing.geometry.dispose();
            this.stompRing.material.dispose();
            this.stompRing = null;
        }
        if (this.mesh) {
            this.mesh.removeFromParent();
            this.mesh.traverse(c => { if (c.isMesh) c.material.dispose(); });
            for (const part of this.mutationParts || []) part.geometry.dispose();
            this.mesh = null;
        }
    }

    checkHit(startPos, endPos, ray) {
        if (!this.mesh || this.isDead) return { hit: false };

        _tempCenter.copy(this.position);
        _tempCenter.y += (this.scale * 0.45);

        _tempSphere.center.copy(_tempCenter);
        _tempSphere.radius = this.radius;

        const hit = ray.intersectSphere(_tempSphere, _tempHitPoint);

        if (hit && startPos.distanceTo(_tempHitPoint) <= startPos.distanceTo(endPos)) {
            // Headshot is top 30% of zombie height
            const isCrit = (_tempHitPoint.y > _tempCenter.y + this.radius * 0.32);
            return { hit: true, point: _tempHitPoint.clone(), isCrit: isCrit };
        }

        return { hit: false };
    }

    update(delta, player, arena, allZombies) {
        if (this.isDead || !this.mesh) return;
        this.arena = arena;

        if (this.mixer) {
            this.mixer.update(delta);
        }

        // Reset hit flash
        if (this.flashTimer > 0) {
            this.flashTimer -= delta;
            if (this.flashTimer <= 0) {
                this.mesh.traverse(c => {
                    if (c.isMesh && c.material && c.material.emissive) {
                        c.material.emissive.setHex(c.material.userData.baseEmissive || 0x000000);
                    }
                });
            }
        }

        if (player.isDead) {
            this.playAnimation('idle');
            return;
        }

        // Distance and direction to player (tái sử dụng vector module)
        _tempToPlayer.subVectors(player.position, this.position);
        _tempToPlayer.y = 0;
        const dist = _tempToPlayer.length();
        if (dist > 0.001) _tempToPlayer.multiplyScalar(1 / dist);

        _tempSpitOrigin.copy(this.position);
        _tempSpitOrigin.y += this.scale * 0.61;
        if (this.spitMouth && this.mesh.getObjectByName('head')) {
            this.mesh.updateMatrixWorld(true);
            this.spitMouth.getWorldPosition(_tempSpitOrigin);
        }
        _tempPlayerTarget.copy(player.position);
        _tempPlayerTarget.y += 0.9;
        const canSpit = this.type === 'spitter' && dist <= 24 && arena.hasLineOfSight(_tempSpitOrigin, _tempPlayerTarget);

        // 1. Swarm separation: giải thuật đẩy quái không sinh rác GC
        _tempSeparation.set(0, 0, 0);
        let neighborCount = 0;
        for (const other of allZombies) {
            if (other === this || other.isDead) continue;
            _tempDiff.subVectors(this.position, other.position);
            _tempDiff.y = 0;
            const d = _tempDiff.length();
            const minSpace = this.radius + other.radius;
            if (d > 0.01 && d < minSpace) {
                _tempDiff.multiplyScalar((minSpace - d) / (minSpace * d));
                _tempSeparation.add(_tempDiff);
                neighborCount++;
            }
        }
        if (neighborCount > 0) {
            _tempSeparation.multiplyScalar(4.0);
        }

        // 2. Chasing movement & AI Obstacle Avoidance
        _tempMoveVel.set(0, 0, 0);
        const holdingRange = canSpit && dist >= 9 && dist <= 17;
        const windingUp = this.spitCharge > 0 || (this.type === 'giant' && this.isAttacking);
        if (!windingUp && !holdingRange && dist > this.attackRange * 0.8) {
            _tempDesiredDir.copy(_tempToPlayer);
            if (canSpit && dist < 9) _tempDesiredDir.negate();
            
            // AI: Obstacle avoidance check
            const feelerDist = this.radius * 2.5;
            _tempNextPos.copy(this.position).addScaledVector(_tempDesiredDir, feelerDist);
            if (arena.checkCollision(_tempNextPos, this.radius)) {
                // Try left and right feelers to slide around obstacle
                _tempLeftDir.copy(_tempDesiredDir).applyAxisAngle(_upAxis, Math.PI / 3);
                _tempRightDir.copy(_tempDesiredDir).applyAxisAngle(_upAxis, -Math.PI / 3);
                
                _tempNextPos.copy(this.position).addScaledVector(_tempLeftDir, feelerDist);
                const canGoLeft = !arena.checkCollision(_tempNextPos, this.radius);
                _tempNextPos.copy(this.position).addScaledVector(_tempRightDir, feelerDist);
                const canGoRight = !arena.checkCollision(_tempNextPos, this.radius);
                
                if (canGoLeft && !canGoRight) {
                    _tempDesiredDir.copy(_tempLeftDir);
                } else if (canGoRight && !canGoLeft) {
                    _tempDesiredDir.copy(_tempRightDir);
                } else if (canGoLeft && canGoRight) {
                    // Pick one randomly if both are open but forward is blocked
                    _tempDesiredDir.copy(Math.random() > 0.5 ? _tempLeftDir : _tempRightDir);
                } else {
                    // Heavily blocked, try sharper turn to get unstuck
                    _tempDesiredDir.applyAxisAngle(_upAxis, Math.PI / 1.5);
                }
            }

            // Flanking behavior for sprinters
            if (this.type === 'sprinter' && dist > 5) {
                _tempDesiredDir.applyAxisAngle(_upAxis, Math.sin(performance.now() * 0.002 + this.position.x) * 0.6);
            }

            _tempDesiredDir.normalize();
            _tempMoveVel.addScaledVector(_tempDesiredDir, this.speed);
        }
        _tempMoveVel.add(_tempSeparation);

        // Apply movement with arena collision
        const nextX = this.position.x + _tempMoveVel.x * delta;
        const nextZ = this.position.z + _tempMoveVel.z * delta;

        _tempCheckPos.set(nextX, this.position.y, this.position.z);
        if (!arena.checkCollision(_tempCheckPos, this.radius)) {
            this.position.x = nextX;
        }
        _tempCheckPos.set(this.position.x, this.position.y, nextZ);
        if (!arena.checkCollision(_tempCheckPos, this.radius)) {
            this.position.z = nextZ;
        }

        this.mesh.position.copy(this.position);
        this.healthBar?.update(this.position, this.health, this.maxHealth, true);

        // Zombie faces direction of motion / player
        let targetYaw = Math.atan2(_tempToPlayer.x, _tempToPlayer.z);
        if (_tempMoveVel.lengthSq() > 0.5) {
            targetYaw = Math.atan2(_tempMoveVel.x, _tempMoveVel.z);
        }
        // Removed the + Math.PI offset because Kenney models face +Z natively

        let diff = (targetYaw - this.mesh.rotation.y) % (Math.PI * 2);
        if (diff < -Math.PI) diff += Math.PI * 2;
        if (diff > Math.PI) diff -= Math.PI * 2;
        this.mesh.rotation.y += diff * Math.min(1.0, delta * 14);

        // 3. Melee Attack Execution
        this.attackTimer -= delta;

        if (this.type === 'spitter') {
            if (this.spitCharge > 0) {
                this.spitCharge -= delta;
                for (const part of this.mutationParts) part.scale.setScalar(1 + Math.sin(this.spitCharge * 25) * 0.2);
                if (this.spitCharge <= 0) {
                    if (this.acidTarget && arena.hasLineOfSight(_tempSpitOrigin, this.acidTarget)) {
                        this.weapons?.shootEnemyBolt(_tempSpitOrigin, this.acidTarget, this.damage, 18, true);
                    }
                    for (const part of this.mutationParts) part.scale.setScalar(1);
                }
            } else if (canSpit && dist > 4 && this.attackTimer <= 0 && this.weapons) {
                this.spitCharge = 0.7;
                this.acidTarget = _tempPlayerTarget.clone();
                this.attackTimer = this.attackCooldown;
                this.particles.createImpactSparks(_tempSpitOrigin, _upAxis, 0x99ff22, 6);
            }
        }

        if (this.stompRing) {
            this.stompRing.position.copy(this.position);
            this.stompRing.position.y = 0.04;
            this.stompRing.visible = this.isAttacking;
            this.stompRing.material.opacity = 0.3 + 0.5 * (1 - this.currentAttackTimer / this.attackDuration);
        }

        if (this.isAttacking) {
            this.currentAttackTimer -= delta;
            if (this.currentAttackTimer <= 0) {
                this.isAttacking = false;
                if (this.type === 'giant') {
                    _tempHitPoint.copy(this.position);
                    _tempHitPoint.y += 0.15;
                    this.particles.createImpactSparks(_tempHitPoint, _upAxis, 0xff6622, 24);
                    if (dist <= this.attackRange && arena.hasLineOfSight(_tempSpitOrigin, _tempPlayerTarget)) this.applyMeleeDamage(player);
                }
                const runAnim = (this.type === 'sprinter') ? 'sprint' : 'walk';
                this.playAnimation(this.animations[runAnim] ? runAnim : 'walk');
            }
        }

        if (dist <= this.attackRange && this.attackTimer <= 0 && !this.isAttacking && this.spitCharge <= 0 && arena.hasLineOfSight(_tempSpitOrigin, _tempPlayerTarget)) {
            this.performMeleeAttack(player);
        }
    }

    performMeleeAttack(player) {
        this.isAttacking = true;
        this.currentAttackTimer = this.attackDuration;
        this.attackTimer = this.attackCooldown;

        // Choose attack animation
        const attackAnims = ['attack-melee-right', 'attack-melee-left'];
        const animName = attackAnims[Math.floor(Math.random() * attackAnims.length)];
        if (this.animations[animName]) {
            this.playAnimation(animName, 0.08);
        }

        // Giants telegraph a stomp; damage is checked at the end of the wind-up.
        if (this.type !== 'giant') this.applyMeleeDamage(player);
    }

    applyMeleeDamage(player) {
        sounds.play('enemyAttack', { volume: 0.7, pitchVariation: 0.15 });
        const hitDir = new THREE.Vector3().subVectors(player.position, this.position).normalize();
        player.takeDamage(this.damage, hitDir);

        // Claw impact spark
        const clawPos = player.position.clone().add(new THREE.Vector3(0, 1.1, 0));
        this.particles.createImpactSparks(clawPos, hitDir.clone().negate(), 0xff1133, 10);
    }
}

export class WaveManager {
    constructor(scene, gltfLoader, weapons, particles, arena) {
        this.scene = scene;
        this.loader = gltfLoader;
        this.weapons = weapons;
        this.particles = particles;
        this.arena = arena;
        this.models = {};

        this.currentPhase = 1;
        this.enemies = [];
        this.isWaveInProgress = false;
        this.spawnQueue = [];
        this.spawnInterval = 0.75;
        this.lastSpawnTime = 0;
        this.nextId = 1;
    }

    async init() {
        const load = (name, file) => new Promise(resolve => {
            this.loader.load(`assets/models/${file}`, (gltf) => {
                this.models[name] = gltf;
                resolve();
            }, undefined, () => resolve());
        });

        await Promise.all([
            load('character-zombie', 'character-zombie.glb'),
            load('character-skeleton', 'character-skeleton.glb'),
            load('character-vampire', 'character-vampire.glb')
        ]);
    }

    startWave(phaseNum) {
        this.currentPhase = phaseNum;
        this.isWaveInProgress = true;
        this.spawnQueue = [];

        // INFINITE PHASE SCALING FORMULA:
        // Zombie count increases each phase
        const walkerCount = Math.floor(6 + phaseNum * 2.5);
        const sprinterCount = phaseNum >= 2 ? Math.floor(2 + phaseNum * 1.5) : 0;
        const tankCount = phaseNum >= 3 ? Math.floor(1 + (phaseNum - 2) * 0.8) : 0;
        const spitterCount = phaseNum >= 2 ? Math.min(10, Math.floor(1 + phaseNum * 0.6)) : 0;
        const giantCount = phaseNum >= 3 ? Math.min(5, Math.floor(phaseNum / 3)) : 0;
        const hasBoss = (phaseNum % 5 === 0);

        for (let i = 0; i < walkerCount; i++) this.spawnQueue.push('walker');
        for (let i = 0; i < sprinterCount; i++) this.spawnQueue.push('sprinter');
        for (let i = 0; i < tankCount; i++) this.spawnQueue.push('tank');
        for (let i = 0; i < spitterCount; i++) this.spawnQueue.push('spitter');
        for (let i = 0; i < giantCount; i++) this.spawnQueue.push('giant');
        if (hasBoss) this.spawnQueue.push('boss');

        // Shuffle spawn queue
        this.spawnQueue.sort(() => Math.random() - 0.5);

        // Dynamic spawn interval (gets slightly faster in later phases)
        this.spawnInterval = Math.max(0.4, 0.85 - phaseNum * 0.03);
    }

    spawnZombie(type) {
        // Pick one of the 4 Arena Portals
        const portals = this.arena.getPortals();
        let spawnPos = new THREE.Vector3(0, 0, -18);
        const radius = ZOMBIE_RADII[type] ?? ZOMBIE_RADII.walker;

        if (portals && portals.length > 0) {
            const portal = portals[Math.floor(Math.random() * portals.length)];
            spawnPos = this.arena.getPortalSpawnPosition(portal, radius);
            if (!spawnPos) return false;

            // Flash portal light on spawn
            if (portal.light) {
                portal.light.intensity = 10;
            }
        }

        if (this.arena.checkCollision(spawnPos, radius)) return false;

        // Portal spawn energy burst
        this.particles.createImpactSparks(spawnPos, new THREE.Vector3(0, 1, 0), 0xb026ff, 18);

        const zombie = new Zombie(
            this.scene,
            type,
            spawnPos,
            this.models,
            this.particles,
            this.currentPhase,
            this.weapons
        );
        zombie.arena = this.arena;
        zombie.id = this.nextId++;
        this.enemies.push(zombie);
        return true;
    }

    update(delta, player, arena, onEnemyKilled) {
        const targets = (Array.isArray(player) ? player : [player]).filter(p => !p.isDead);
        // Spawn queue from portals
        if (this.spawnQueue.length > 0) {
            this.lastSpawnTime += delta;
            if (this.lastSpawnTime >= this.spawnInterval) {
                this.lastSpawnTime = 0;
                // Keep the queued enemy when an exit is blocked; retry later.
                if (this.spawnZombie(this.spawnQueue[0])) this.spawnQueue.shift();
            }
        }

        // Update active zombies
        for (let i = this.enemies.length - 1; i >= 0; i--) {
            const zombie = this.enemies[i];
            const target = targets.reduce((nearest, p) => !nearest || p.position.distanceToSquared(zombie.position) < nearest.position.distanceToSquared(zombie.position) ? p : nearest, null);
            if (target) zombie.update(delta, target, arena, this.enemies);

            if (zombie.isDead) {
                if (onEnemyKilled) {
                    onEnemyKilled(zombie);
                }
                this.enemies.splice(i, 1);
            }
        }

        // Phase finished check
        if (this.spawnQueue.length === 0 && this.enemies.length === 0 && this.isWaveInProgress) {
            this.isWaveInProgress = false;
            return true;
        }

        return false;
    }

    getRemainingEnemiesCount() {
        return this.spawnQueue.length + this.enemies.length;
    }

    getBoss() {
        return this.enemies.find(e => e.type === 'boss');
    }

    clear() {
        for (const e of this.enemies) {
            e.disposeVisuals();
        }
        this.enemies = [];
        this.spawnQueue = [];
        this.isWaveInProgress = false;
        this.lastSpawnTime = 0;
    }
}
