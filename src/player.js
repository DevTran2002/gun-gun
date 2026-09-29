import * as THREE from 'three';
import { sounds } from './audio.js';
import { HealthBar3D } from './healthbar.js';
import { CHARACTER_CONFIGS, normalizeCharacter } from './characters.js';

export class PlayerController {
    constructor(camera, domElement, arena, weaponSystem, bindInput = true, characterId = 'soldier') {
        this.camera = camera;
        this.domElement = domElement;
        this.arena = arena;
        this.weapons = weaponSystem;
        this.characterId = normalizeCharacter(characterId);
        this.loader = null;
        this.scene = null;

        // Player transform & physics
        this.position = new THREE.Vector3(0, 0, 8);
        this.velocity = new THREE.Vector3();
        this.speed = 7.5;
        this.jumpForce = 9.2;
        this.gravity = 24.0;
        this.isGrounded = true;
        this.radius = 0.55;
        this.height = 1.6;

        // Stats
        this.maxHealth = 100;
        this.health = 100;
        this.maxShield = 100;
        this.shield = 100;
        this.isDead = false;
        this.cooperative = false;
        this.isDowned = false;
        this.invulnerability = 0;
        this.damageRevision = 0;
        this.shieldRegenDelay = 4.0;
        this.shieldRegenTimer = 0;
        this.shieldRegenRate = 25;

        // Dodge / Dash
        this.dodgeCooldown = 0;
        this.isDodging = false;
        this.dodgeTimer = 0;
        this.dodgeDir = new THREE.Vector3();

        // Fixed elevated view; aiming never changes the camera orientation.
        this.cameraYaw = 0;
        this.cameraOffset = new THREE.Vector3(0, 26, 18);
        this.cameraFocus = new THREE.Vector3(this.position.x, 0.7, this.position.z);
        this.aimYaw = Math.PI;
        this.aimPoint = this.position.clone().add(new THREE.Vector3(0, 0.85, -10));
        this.pointer = new THREE.Vector2(0, 0.35);
        this.pointerScreen = new THREE.Vector2(window.innerWidth / 2, window.innerHeight * 0.325);
        this.pointerInCanvas = true;
        this.reviveRequested = false;
        this.isADS = false;

        // Input state
        this.keys = {};
        this.mouseButtons = { left: false, right: false };
        this.inputEnabled = false;
        this.stepTimer = 0;

        // 3D Model & Animation
        this.model = null;
        this.mixer = null;
        this.animations = {};
        this.currentAction = null;
        this.holdingAction = null;
        this.handBone = null;
        this.healthBar = null;

        if (bindInput) this.initInput();
    }

    initInput() {
        window.addEventListener('keydown', (e) => {
            if (!this.inputEnabled) return;
            if (e.code === 'Space') e.preventDefault();
            this.keys[e.code] = true;

            if (e.code === 'KeyR') {
                this.weapons.reload();
            }
            if (e.code === 'Digit1') this.weapons.switchWeapon(0);
            if (e.code === 'Digit2') this.weapons.switchWeapon(1);
            if (e.code === 'KeyQ') this.tryDodge();
            if (e.code === 'KeyE') this.reviveRequested = true;
        });

        window.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
        });

        window.addEventListener('mousedown', (e) => {
            if (!this.inputEnabled || e.target !== this.domElement) return;
            if (e.button === 0) this.mouseButtons.left = true;
            if (e.button === 2) this.mouseButtons.right = true;
        });

        window.addEventListener('mouseup', (e) => {
            if (e.button === 0) this.mouseButtons.left = false;
            if (e.button === 2) this.mouseButtons.right = false;
        });

        window.addEventListener('wheel', (e) => {
            if (!this.inputEnabled) return;
            if (e.deltaY > 0) this.weapons.nextWeapon();
            else if (e.deltaY < 0) this.weapons.prevWeapon();
        });

        window.addEventListener('mousemove', (e) => {
            const bounds = this.domElement.getBoundingClientRect();
            this.pointer.set((e.clientX - bounds.left) / bounds.width * 2 - 1,
                1 - (e.clientY - bounds.top) / bounds.height * 2);
            this.pointerScreen.set(e.clientX, e.clientY);
            this.pointerInCanvas = Math.abs(this.pointer.x) <= 1 && Math.abs(this.pointer.y) <= 1;
        });
        this.domElement.addEventListener('contextmenu', (e) => e.preventDefault());
        window.addEventListener('blur', () => {
            this.keys = {};
            this.mouseButtons = { left: false, right: false };
        });
    }

    setInputEnabled(enabled) {
        this.inputEnabled = enabled;
        this.domElement.style.cursor = enabled ? 'none' : 'default';
        this.keys = {};
        this.mouseButtons = { left: false, right: false };
    }

    async loadModel(loader, scene, characterId = this.characterId) {
        this.characterId = normalizeCharacter(characterId);
        this.loader = loader;
        this.scene = scene;
        this.handBone = null;
        this.mixer = null;
        this.animations = {};
        this.currentAction = null;
        this.holdingAction = null;
        return new Promise((resolve) => {
            if (this.model) {
                this.model.removeFromParent();
                this.healthBar?.dispose();
                this.healthBar = null;
            }
            const config = CHARACTER_CONFIGS[this.characterId];
            loader.load(`assets/models/${config.modelFile}`, (gltf) => {
                this.model = gltf.scene;
                this.model.scale.set(1.7, 1.7, 1.7);
                this.model.position.copy(this.position);
                this.model.rotation.y = Math.PI;

                this.model.traverse(child => {
                    if (child.isMesh) {
                        child.castShadow = true;
                        child.receiveShadow = true;
                    }
                    if (child.name === 'arm-right') {
                        this.handBone = child;
                    }
                });
                if (!this.handBone) {
                    this.handBone = this.model.getObjectByName('hand-right')
                        || this.model.getObjectByName('hand')
                        || this.model;
                }

                scene.add(this.model);
                this.healthBar = new HealthBar3D(scene, { width: 1.35, offsetY: 2.35, color: 0x22e6a5 });

                // Setup Animation Mixer with separate aiming and locomotion layers
                this.mixer = new THREE.AnimationMixer(this.model);

                gltf.animations.forEach(clip => {
                    // Separate arm-right aiming animation from locomotion tracks
                    if (['idle', 'walk', 'sprint', 'jump'].includes(clip.name)) {
                        clip.tracks = clip.tracks.filter(track => !track.name.includes('arm-right'));
                    }
                    this.animations[clip.name] = this.mixer.clipAction(clip);
                });

                // Attach weapon to right arm
                if (this.handBone) {
                    this.weapons.attachToArm(this.handBone);
                }

                // Start holding-right animation so character holds weapon in firing position
                if (this.animations['holding-right']) {
                    this.holdingAction = this.animations['holding-right'];
                    this.holdingAction.play();
                }

                this.playAnimation('idle');
                resolve();
            }, undefined, () => resolve());
        });
    }

    setCharacter(characterId) {
        const next = normalizeCharacter(characterId);
        if (next === this.characterId && this.model) return Promise.resolve();
        this.characterId = next;
        if (this.loader && this.scene) return this.loadModel(this.loader, this.scene, next);
        return Promise.resolve();
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

    tryDodge() {
        if (this.dodgeCooldown > 0 || this.isDead || !this.isGrounded) return;

        const moveDir = this.getMovementInput();
        if (moveDir.lengthSq() > 0.01) {
            this.dodgeDir.copy(moveDir).normalize();
        } else {
            this.dodgeDir.set(Math.sin(this.aimYaw), 0, Math.cos(this.aimYaw));
        }

        this.isDodging = true;
        this.dodgeTimer = 0.28;
        this.dodgeCooldown = 1.0;
        sounds.play('jump', { volume: 0.8, rate: 1.4 });
    }

    getMovementInput() {
        const input = new THREE.Vector3();
        if (this.keys['KeyW']) input.z -= 1;
        if (this.keys['KeyS']) input.z += 1;
        if (this.keys['KeyA']) input.x -= 1;
        if (this.keys['KeyD']) input.x += 1;

        if (input.lengthSq() > 0) {
            input.normalize();
            // Screen-up always means arena north, independently of aim.
        }
        return input;
    }

    takeDamage(amount, hitDir) {
        if (this.isDead || this.isDodging || this.invulnerability > 0) return;
        this.damageRevision++;

        this.shieldRegenTimer = this.shieldRegenDelay;

        if (this.shield > 0) {
            sounds.playShieldDamage();
            if (this.shield >= amount) {
                this.shield -= amount;
                amount = 0;
            } else {
                amount -= this.shield;
                this.shield = 0;
            }
        }

        if (amount > 0) {
            this.health -= amount;
            sounds.play('enemyHurt', { volume: 0.6, rate: 1.1 });

            if (hitDir) {
                this.velocity.x += hitDir.x * 3.0;
                this.velocity.z += hitDir.z * 3.0;
            }
        }

        if (this.health <= 0) {
            this.health = 0;
            this.die();
        }
    }

    heal(amount) {
        this.health = Math.min(this.maxHealth, this.health + amount);
    }

    rechargeShield(amount) {
        this.shield = Math.min(this.maxShield, this.shield + amount);
    }

    die() {
        if (this.isDead) return;
        this.isDead = true;
        this.isDowned = this.cooperative;
        sounds.play('enemyDestroy', { volume: 0.9 });
        if (this.holdingAction) this.holdingAction.stop();
        // Keep the character in place without a death animation or burst effect.
        this.playAnimation('idle', 0.05);
    }

    revive() {
        if (!this.isDowned) return false;
        this.isDead = false;
        this.isDowned = false;
        this.reviveRequested = false;
        this.health = 60;
        this.shield = 0;
        this.invulnerability = 2;
        this.velocity.set(0, 0, 0);
        if (this.holdingAction) this.holdingAction.play();
        this.playAnimation('idle');
        return true;
    }

    checkHit(startPos, endPos, ray) {
        const playerBox = new THREE.Box3(
            new THREE.Vector3(this.position.x - this.radius, this.position.y, this.position.z - this.radius),
            new THREE.Vector3(this.position.x + this.radius, this.position.y + this.height, this.position.z + this.radius)
        );

        const hitPoint = new THREE.Vector3();
        const hit = ray.intersectBox(playerBox, hitPoint);
        if (hit && startPos.distanceTo(hitPoint) <= startPos.distanceTo(endPos)) {
            return { hit: true, point: hitPoint };
        }
        return { hit: false };
    }

    update(delta, arena, enemies = []) {
        this.invulnerability = Math.max(0, this.invulnerability - delta);
        if (this.mixer) {
            this.mixer.update(delta);
        }

        if (this.isDead) {
            this.healthBar?.update(this.position, this.health, this.maxHealth, true);
            this.updateCamera(delta);
            return;
        }

        // Shield auto-regeneration
        if (this.shieldRegenTimer > 0) {
            this.shieldRegenTimer -= delta;
        } else if (this.shield < this.maxShield) {
            this.shield = Math.min(this.maxShield, this.shield + this.shieldRegenRate * delta);
        }

        // Dodge handling
        if (this.dodgeCooldown > 0) {
            this.dodgeCooldown -= delta;
        }
        if (this.isDodging) {
            this.dodgeTimer -= delta;
            this.velocity.x = this.dodgeDir.x * 16.0;
            this.velocity.z = this.dodgeDir.z * 16.0;
            if (this.dodgeTimer <= 0) {
                this.isDodging = false;
            }
        }

        // Precision fire affects spread and movement, never camera zoom/angle.
        this.isADS = this.mouseButtons.right;

        // Locomotion input
        let currentSpeed = this.speed;
        if (this.isADS) {
            currentSpeed *= 0.65;
        }

        const moveDir = this.getMovementInput();
        const isMoving = moveDir.lengthSq() > 0.01;

        if (!this.isDodging) {
            if (isMoving) {
                this.velocity.x = moveDir.x * currentSpeed;
                this.velocity.z = moveDir.z * currentSpeed;

                this.stepTimer -= delta;
                if (this.stepTimer <= 0 && this.isGrounded) {
                    sounds.play('step', { volume: 0.35, rate: 1.0 });
                    this.stepTimer = 0.42;
                }
            } else {
                this.velocity.x *= Math.pow(0.001, delta);
                this.velocity.z *= Math.pow(0.001, delta);
            }
        }

        // Jumping
        if (this.keys['Space'] && this.isGrounded && !this.isDodging) {
            this.velocity.y = this.jumpForce;
            this.isGrounded = false;
            sounds.play('jump', { volume: 0.65 });
            this.playAnimation('jump', 0.1);
        }

        // Gravity
        this.velocity.y -= this.gravity * delta;

        // Apply movement with obstacle collision
        const newX = this.position.x + this.velocity.x * delta;
        const newZ = this.position.z + this.velocity.z * delta;

        if (!arena.checkCollision(new THREE.Vector3(newX, this.position.y, this.position.z), this.radius)) {
            this.position.x = newX;
        } else {
            this.velocity.x = 0;
        }

        if (!arena.checkCollision(new THREE.Vector3(this.position.x, this.position.y, newZ), this.radius)) {
            this.position.z = newZ;
        } else {
            this.velocity.z = 0;
        }

        // Vertical collision
        this.position.y += this.velocity.y * delta;
        if (this.position.y <= 0) {
            this.position.y = 0;
            if (!this.isGrounded && this.velocity.y < -4) {
                sounds.play('land', { volume: 0.5 });
            }
            this.velocity.y = 0;
            this.isGrounded = true;
        }

        this.updateCamera(delta);
        this.updateAim(enemies);

        // Sync 3D model orientation
        if (this.model) {
            this.model.position.copy(this.position);
            this.healthBar?.update(this.position, this.health, this.maxHealth, true);

            const targetModelYaw = this.aimYaw;

            // Shortest arc angle interpolation
            let diff = (targetModelYaw - this.model.rotation.y) % (Math.PI * 2);
            if (diff < -Math.PI) diff += Math.PI * 2;
            if (diff > Math.PI) diff -= Math.PI * 2;
            this.model.rotation.y += diff * Math.min(1.0, delta * 16);

            // Animation selection
            if (!this.isGrounded) {
                this.playAnimation('jump');
            } else if (this.isDodging) {
                this.playAnimation('walk', 0.05);
            } else if (isMoving) {
                this.playAnimation('walk');
            } else {
                this.playAnimation('idle');
            }
        }

        // Weapon firing
        this.handleShooting();
    }

    updateAim(enemies = []) {
        const raycaster = new THREE.Raycaster();
        raycaster.setFromCamera(this.pointer, this.camera);
        // Aim at torso height for empty space; directly pointing at a zombie
        // uses its actual hit volume, including larger mutants and headshots.
        const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -(this.position.y + 0.85));
        const target = raycaster.ray.intersectPlane(plane, new THREE.Vector3());
        if (!target) return;
        for (const collider of this.arena.colliders) {
            const hit = raycaster.ray.intersectBox(collider, new THREE.Vector3());
            if (hit && raycaster.ray.origin.distanceTo(hit) < raycaster.ray.origin.distanceTo(target)) target.copy(hit);
        }
        for (const enemy of enemies) {
            if (enemy.isDead || !enemy.mesh) continue;
            const center = enemy.position.clone().add(new THREE.Vector3(0, enemy.scale * 0.45, 0));
            const hit = raycaster.ray.intersectSphere(new THREE.Sphere(center, enemy.radius), new THREE.Vector3());
            if (hit && raycaster.ray.origin.distanceTo(hit) < raycaster.ray.origin.distanceTo(target)) {
                // Aim just inside the body so overhead selection does not send
                // the muzzle ray grazing tangentially along the hit sphere.
                target.copy(hit).lerp(center, 0.25);
            }
        }
        this.aimPoint.copy(target);
        const dx = target.x - this.position.x;
        const dz = target.z - this.position.z;
        if (Math.hypot(dx, dz) > 0.1) this.aimYaw = Math.atan2(dx, dz);
    }

    handleShooting() {
        if (!this.inputEnabled || !this.pointerInCanvas || this.isDead) return;

        const w = this.weapons.getCurrentWeapon();
        const shouldShoot = w.isAuto ? this.mouseButtons.left : (this.mouseButtons.left && this.weapons.fireCooldown <= 0);

        if (shouldShoot) {
            // Compute muzzle origin from character right arm
            const muzzlePos = new THREE.Vector3();
            if (this.handBone) {
                this.model.updateMatrixWorld(true);
                this.handBone.getWorldPosition(muzzlePos);
                // Forward offset in character facing direction
                const forward = new THREE.Vector3(Math.sin(this.aimYaw), 0, Math.cos(this.aimYaw));
                muzzlePos.addScaledVector(forward, 0.45);
                muzzlePos.y += 0.05;
            } else {
                muzzlePos.copy(this.position).add(new THREE.Vector3(0, 1.2, 0));
            }

            this.weapons.shoot(muzzlePos, this.aimPoint, this.isADS, true);
        }
    }

    updateCamera(delta) {
        // Follow X/Z only so jumping cannot bob or rotate the fixed camera.
        const target = new THREE.Vector3(this.position.x, 0.7, this.position.z);
        this.cameraFocus.lerp(target, 1 - Math.exp(-10 * Math.max(0, delta)));
        this.camera.position.copy(this.cameraFocus).add(this.cameraOffset);
        this.camera.lookAt(this.cameraFocus);
        this.camera.updateMatrixWorld(true);
    }

    reset(startPos = new THREE.Vector3(0, 0, 8)) {
        this.position.copy(startPos);
        this.velocity.set(0, 0, 0);
        this.health = this.maxHealth;
        this.shield = this.maxShield;
        this.isDead = false;
        this.isDowned = false;
        this.invulnerability = 0;
        this.aimYaw = Math.PI;
        this.isADS = false;
        this.cameraFocus.set(this.position.x, 0.7, this.position.z);
        this.aimPoint.copy(this.position).add(new THREE.Vector3(0, 0.85, -10));
        this.updateCamera(0);
        this.keys = {};
        this.mouseButtons = { left: false, right: false };
        this.isDodging = false;
        this.isGrounded = true;
        this.dodgeCooldown = 0;
        this.shieldRegenTimer = 0;
        if (this.model) this.model.rotation.y = Math.PI;
        this.healthBar?.update(this.position, this.health, this.maxHealth, true);
        if (this.holdingAction) this.holdingAction.play();
        this.playAnimation('idle');
    }
}
