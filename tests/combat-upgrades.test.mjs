import assert from 'node:assert/strict';
import { registerHooks } from 'node:module';
import { test } from 'node:test';

registerHooks({ resolve(specifier, context, next) {
    return specifier === 'three'
        ? { url: new URL('../libs/three.module.js', import.meta.url).href, shortCircuit: true }
        : next(specifier, context);
} });
const THREE = await import('three');
const { PlayerController } = await import('../src/player.js');
const { WeaponSystem, WEAPON_CONFIGS, RARE_WEAPON_CONFIGS } = await import('../src/weapons.js');
const { Zombie, WaveManager } = await import('../src/enemies.js');
const { PickupManager, DROP_TYPES } = await import('../src/pickups.js');
const { Arena } = await import('../src/arena.js');
const particles = { createImpactSparks() {}, createMuzzleFlash() {}, createExplosion() {} };

function fixture() {
    const scene = new THREE.Scene();
    const arena = new Arena(scene, null);
    const weapons = new WeaponSystem(scene, null, particles);
    weapons.resetRun();
    const player = Object.assign(Object.create(PlayerController.prototype), {
        position: new THREE.Vector3(), camera: new THREE.OrthographicCamera(-20, 20, 11, -11, 0.1, 300),
        arena, weapons, cameraOffset: new THREE.Vector3(0, 26, 18), cameraFocus: new THREE.Vector3(0, 0.7, 0),
        cameraYaw: 0, aimYaw: Math.PI, pointer: new THREE.Vector2(0, 0.35), aimPoint: new THREE.Vector3(), isADS: false,
        keys: {}, mouseButtons: { left: false, right: false }, inputEnabled: true, pointerInCanvas: true,
        health: 100, maxHealth: 100, shield: 100, maxShield: 100, isDead: false,
        velocity: new THREE.Vector3(), height: 1.6, radius: 0.55
    });
    const models = { 'character-zombie': { scene: new THREE.Group() } };
    const zombie = (type, position) => new Zombie(scene, type, position, models, particles, 1, weapons);
    return { scene, arena, weapons, player, zombie };
}

test('fixed overhead camera stays above ground and never rotates with aim, precision fire or jumping', () => {
    const { player } = fixture();
    player.updateCamera(1);
    const orientation = player.camera.quaternion.clone();
    for (const aspect of [1, 16 / 9, 32 / 9]) {
        player.camera.left = -11 * aspect;
        player.camera.right = 11 * aspect;
        for (const ads of [false, true]) {
            player.isADS = ads;
            player.camera.updateProjectionMatrix();
            for (const height of [0, 2, 0]) {
                player.position.y = height;
                for (let i = 0; i <= 80; i++) {
                    player.pointer.set(Math.sin(i), Math.cos(i));
                    player.updateCamera(1 / 60);
                    player.updateAim();
                    assert.ok(player.camera.quaternion.angleTo(orientation) < 1e-6);
                    assert.equal(player.camera.position.y, 26.7);
                    for (const x of [-1, 1]) for (const y of [-1, 1]) {
                        const corner = new THREE.Vector3(x, y, -1).unproject(player.camera);
                        assert.ok(corner.y > 0, `near plane penetrated floor: ${corner.y}`);
                    }
                }
            }
        }
    }
});

test('fixed camera follows movement above arena walls without shortening its offset', () => {
    const { player, arena } = fixture();
    const wall = new THREE.Box3(new THREE.Vector3(-120, 0, 110), new THREE.Vector3(120, 10, 112));
    arena.colliders.push(wall);
    player.position.set(30, 0, 108);
    let previousDistance = Infinity;
    for (let i = 0; i < 60; i++) {
        player.updateCamera(1 / 60);
        assert.equal(wall.containsPoint(player.camera.position), false);
        assert.ok(player.camera.position.clone().sub(player.cameraFocus).distanceTo(player.cameraOffset) < 1e-8);
        const distance = Math.hypot(player.cameraFocus.x - player.position.x, player.cameraFocus.z - player.position.z);
        assert.ok(distance < previousDistance);
        previousDistance = distance;
    }
    assert.ok(previousDistance < 0.01);
});

test('WASD stays screen-relative and shots follow the cursor on all sides of the character', () => {
    const { player, weapons, zombie, arena } = fixture();
    player.updateCamera(1);
    player.keys = { KeyW: true };
    const orientation = player.camera.quaternion.clone();
    for (const point of [[8, 0, 0], [-8, 0, 0], [0, 0, -8], [0, 0, 8]]) {
        const target = zombie('walker', new THREE.Vector3(...point));
        const screen = target.position.clone().add(new THREE.Vector3(0, target.scale * 0.45, 0)).project(player.camera);
        player.pointer.set(screen.x, screen.y);
        player.updateAim([target]);
        assert.deepEqual(player.getMovementInput().toArray(), [0, 0, -1]);
        player.mouseButtons.left = true;
        weapons.fireCooldown = 0;
        player.handleShooting();
        for (let i = 0; i < 12; i++) weapons.update(0.02, arena, [target], player);
        assert.ok(target.health < target.maxHealth, `cursor shot missed ${point}`);
        assert.ok(player.camera.quaternion.angleTo(orientation) < 1e-6);
        target.disposeVisuals();
    }
});

test('upgrades increase actual volley damage, fire rate and symmetric shot count with one ammo cost', () => {
    const { weapons } = fixture();
    weapons.applyUpgrade('damage');
    weapons.applyUpgrade('rapid');
    weapons.applyUpgrade('multishot');
    const random = Math.random;
    Math.random = () => 0.5;
    try {
        assert.equal(weapons.shoot(new THREE.Vector3(), new THREE.Vector3(0, 0, 10)), true);
        assert.equal(weapons.projectiles.length, 3);
        assert.equal(weapons.ammo.blaster, 15);
        assert.equal(weapons.projectiles[0].damage, 26 * 1.2);
        assert.equal(weapons.fireCooldown, 0.2 / 1.125);
        assert.ok(weapons.projectiles[0].direction.x < 0);
        assert.equal(weapons.projectiles[1].direction.x, 0);
        assert.ok(weapons.projectiles[2].direction.x > 0);
        assert.equal(weapons.shoot(new THREE.Vector3(), new THREE.Vector3(0, 0, 10)), false);
    } finally { Math.random = random; }
    for (let i = 0; i < 20; i++) for (const type of ['damage', 'rapid', 'multishot']) weapons.applyUpgrade(type);
    assert.deepEqual(weapons.upgrades, { damage: 10, rapid: 8, multishot: 2 });
    assert.equal(weapons.beamCount, 5);
});

test('ammo is finite, reloads from reserve, and ammo crates add reserve instead of refilling for free', () => {
    const { scene, weapons, player } = fixture();
    const pickups = new PickupManager(scene, particles);
    const startReserve = weapons.getCurrentAmmo().reserve;
    for (let i = 0; i < weapons.getCurrentWeapon().magSize; i++) {
        weapons.fireCooldown = 0;
        assert.equal(weapons.shoot(new THREE.Vector3(), new THREE.Vector3(0, 0, 10)), true);
    }
    assert.equal(weapons.getCurrentAmmo().current, 0);
    assert.equal(weapons.getCurrentAmmo().reserve, startReserve);
    weapons.reload();
    weapons.update(2, { colliders: [] }, [], player);
    assert.equal(weapons.getCurrentAmmo().current, weapons.getCurrentWeapon().magSize);
    assert.equal(weapons.getCurrentAmmo().reserve, startReserve - weapons.getCurrentWeapon().magSize);
    pickups.collect({ type: 'ammo' }, player);
    assert.equal(weapons.getCurrentAmmo().reserve, startReserve - weapons.getCurrentWeapon().magSize + weapons.getCurrentWeapon().magSize * 2);
});

test('rare weapon pickup upgrades the single gun slot, keeps the knife, and resets cleanly', () => {
    const { scene, weapons, player } = fixture();
    const pickups = new PickupManager(scene, particles);
    weapons.applyUpgrade('multishot');
    weapons.isReloading = true;
    pickups.collect({ type: 'weapon', weaponSlot: 0 }, player);
    assert.equal(weapons.getCurrentWeapon(), RARE_WEAPON_CONFIGS[0]);
    assert.equal(weapons.getCurrentAmmo().current, RARE_WEAPON_CONFIGS[0].magSize);
    assert.equal(weapons.isReloading, false);
    assert.equal(weapons.beamCount, 3);
    pickups.collect({ type: 'weapon', weaponSlot: 1 }, player);
    pickups.collect({ type: 'weapon', weaponSlot: 2 }, player);
    assert.equal(weapons.getCurrentWeapon(), RARE_WEAPON_CONFIGS[0]);
    assert.equal(weapons.upgrades.damage, 2);
    assert.equal(weapons.weaponSlots.length, 2);
    assert.equal(weapons.weaponSlots[1].isKnife, true);
    pickups.collect({ type: 'weapon', weaponSlot: 0 }, player);
    assert.equal(weapons.upgrades.damage, 3);
    weapons.fireCooldown = 0;
    weapons.shoot(new THREE.Vector3(), new THREE.Vector3(0, 0, 10));
    weapons.resetRun();
    assert.equal(weapons.weaponSlots[0], WEAPON_CONFIGS[0]);
    assert.equal(weapons.weaponSlots[1].isKnife, true);
    assert.equal(weapons.currentSlotIndex, 0);
    assert.equal(weapons.projectiles.length, 0);
    assert.equal(weapons.damageBoost, 1);
    assert.equal(weapons.beamCount, 1);
    assert.deepEqual(Object.keys(weapons.ammo), ['blaster']);
});

test('empty gun falls back to a usable knife attack', () => {
    const { arena, weapons, zombie, player } = fixture();
    const target = zombie('walker', new THREE.Vector3(0, 0, 1.7));
    weapons.ammo.blaster = 0;
    weapons.reserve.blaster = 0;
    weapons.fireCooldown = 0;
    assert.equal(weapons.shoot(new THREE.Vector3(0, 1, 0), new THREE.Vector3(0, 1, 2)), false);
    assert.equal(weapons.currentSlotIndex, 1);
    weapons.fireCooldown = 0;
    assert.equal(weapons.shoot(new THREE.Vector3(0, 1, 0), new THREE.Vector3(0, 1, 2)), true);
    weapons.update(0.1, arena, [target], player);
    assert.ok(target.health < target.maxHealth);
    target.disposeVisuals();
});

test('every drop is reachable in the weighted table, drops are 10%, and pickups apply once', () => {
    const { scene, player, weapons } = fixture();
    const pickups = new PickupManager(scene, particles);
    const original = Math.random;
    try {
        let cumulative = 0;
        for (const definition of DROP_TYPES) {
            const sequence = [0.1, cumulative + definition.weight / 2, 0.5];
            Math.random = () => sequence.shift() ?? 0.5;
            assert.equal(pickups.spawnDrop(new THREE.Vector3(20, 0, 20)).type, definition.id);
            cumulative += definition.weight;
        }
        Math.random = () => 0.99;
        assert.equal(pickups.spawnDrop(new THREE.Vector3()), null);
        Math.random = () => 0.05;
        assert.ok(pickups.spawnDrop(new THREE.Vector3(), 'boss'));
        pickups.clear();
        pickups.createPickup(player.position, 'damage');
        pickups.update(0.016, player);
        pickups.update(0.016, player);
        assert.equal(weapons.upgrades.damage, 1);
        assert.equal(pickups.pickups.length, 0);
        pickups.createPickup(new THREE.Vector3(10, 0, 10), 'multishot');
        pickups.update(46, player, undefined, false);
        assert.equal(pickups.pickups.length, 0);
    } finally { Math.random = original; }
});

test('spitter telegraphs then fires dodgeable acid; walls block firing and the projectile', () => {
    const { zombie, arena, player, weapons } = fixture();
    const enemy = zombie('spitter', new THREE.Vector3(0, 0, 15));
    enemy.attackTimer = 0;
    enemy.update(0.05, player, arena, [enemy]);
    assert.ok(enemy.spitCharge > 0);
    assert.equal(weapons.projectiles.length, 0);
    for (let i = 0; i < 16; i++) enemy.update(0.05, player, arena, [enemy]);
    assert.equal(weapons.projectiles.length, 1);
    assert.equal(weapons.projectiles[0].color, 0x99ff22);
    const initialShield = player.shield;
    for (let i = 0; i < 30; i++) weapons.update(0.05, arena, [], player);
    assert.ok(player.shield < initialShield, 'acid must damage player');
    weapons.clear();
    arena.colliders.push(new THREE.Box3(new THREE.Vector3(-5, 0, 6), new THREE.Vector3(5, 5, 8)));
    enemy.attackTimer = 0;
    for (let i = 0; i < 20; i++) enemy.update(0.05, player, arena, [enemy]);
    assert.equal(weapons.projectiles.length, 0);
    const shield = player.shield;
    weapons.shootEnemyBolt(new THREE.Vector3(0, 1, 15), new THREE.Vector3(0, 1, 0), 18, 18, true);
    for (let i = 0; i < 30; i++) weapons.update(0.05, arena, [], player);
    assert.equal(player.shield, shield);
    assert.equal(weapons.projectiles.length, 0);
});

test('giant stomp gives time to escape and damages only targets still in range', () => {
    const { zombie, arena, player } = fixture();
    const giant = zombie('giant', new THREE.Vector3(0, 0, 2.5));
    giant.attackTimer = 0;
    giant.update(0.05, player, arena, [giant]);
    assert.equal(player.shield, 100);
    assert.equal(giant.isAttacking, true);
    giant.update(0.05, player, arena, [giant]);
    assert.equal(giant.stompRing.visible, true);
    player.position.z = -10;
    for (let i = 0; i < 19; i++) giant.update(0.05, player, arena, [giant]);
    assert.equal(player.shield, 100);
    player.position.copy(giant.position).add(new THREE.Vector3(0, 0, -2));
    giant.attackTimer = 0;
    for (let i = 0; i < 21; i++) giant.update(0.05, player, arena, [giant]);
    assert.equal(player.shield, 65);
    giant.die();
    assert.equal(giant.stompRing, null);
});

test('wave progression introduces acid and fast zombies at phase 2, giants at phase 3', () => {
    const { scene, arena, weapons } = fixture();
    const waves = new WaveManager(scene, null, weapons, particles, arena);
    waves.startWave(1);
    assert.ok(waves.spawnQueue.every(type => type === 'walker'));
    waves.startWave(2);
    assert.ok(waves.spawnQueue.includes('spitter'));
    assert.ok(waves.spawnQueue.includes('sprinter'));
    waves.startWave(3);
    assert.ok(waves.spawnQueue.includes('giant'));
    waves.startWave(5);
    assert.ok(waves.spawnQueue.includes('boss'));
});
