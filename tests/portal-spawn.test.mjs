// Run with: node --test tests/portal-spawn.test.mjs
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { registerHooks } from 'node:module';
import { test } from 'node:test';

registerHooks({
    resolve(specifier, context, nextResolve) {
        if (specifier === 'three') {
            return { url: new URL('../libs/three.module.js', import.meta.url).href, shortCircuit: true };
        }
        return nextResolve(specifier, context);
    }
});
const THREE = await import('three');
const { Arena } = await import('../src/arena.js');
const { WaveManager } = await import('../src/enemies.js');

// Read the real gate vertices without a browser or its texture loader.
function loadGateGeometry() {
    const glb = readFileSync(new URL('../assets/models/wall-gate.glb', import.meta.url));
    const jsonLength = glb.readUInt32LE(12);
    const asset = JSON.parse(glb.subarray(20, 20 + jsonLength).toString());
    const binaryOffset = 20 + jsonLength + 8;
    const nodes = asset.nodes.map(node => {
        const group = new THREE.Group();
        for (const primitive of asset.meshes[node.mesh]?.primitives ?? []) {
            const accessor = asset.accessors[primitive.attributes.POSITION];
            const view = asset.bufferViews[accessor.bufferView];
            assert.equal(accessor.componentType, 5126);
            const positions = new Float32Array(accessor.count * 3);
            for (let i = 0; i < accessor.count; i++) {
                for (let axis = 0; axis < 3; axis++) {
                    positions[i * 3 + axis] = glb.readFloatLE(binaryOffset + (view.byteOffset ?? 0)
                        + (accessor.byteOffset ?? 0) + i * (view.byteStride ?? 12) + axis * 4);
                }
            }
            const geometry = new THREE.BufferGeometry();
            geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
            group.add(new THREE.Mesh(geometry, new THREE.MeshBasicMaterial()));
        }
        if (node.translation) group.position.fromArray(node.translation);
        if (node.rotation) group.quaternion.fromArray(node.rotation);
        if (node.scale) group.scale.fromArray(node.scale);
        return group;
    });
    asset.nodes.forEach((node, i) => node.children?.forEach(child => nodes[i].add(nodes[child])));
    const root = new THREE.Group();
    asset.scenes[asset.scene ?? 0].nodes.forEach(i => root.add(nodes[i]));
    return root;
}

function fixture() {
    const scene = new THREE.Scene();
    const arena = new Arena(scene, null);
    arena.models['wall-gate'] = loadGateGeometry();
    arena.buildFloorAndWalls();
    arena.buildSpawnPortals();
    const particles = { createImpactSparks() {} };
    const waves = new WaveManager(scene, null, null, particles, arena);
    waves.models['character-zombie'] = { scene: new THREE.Group() };
    return { arena, waves };
}

test('legacy spawn intersects the real gate collider at all four exits', () => {
    const { arena } = fixture();
    for (const portal of arena.portals) {
        const oldSpawn = portal.position.clone().addScaledVector(portal.spawnDir, 1.2);
        assert.ok(arena.checkCollision(oldSpawn, 0.6), portal.name);
    }
});

test('all enemy sizes spawn clear and walk away from every gate at varied frame rates', () => {
    const { arena, waves } = fixture();
    const player = { position: new THREE.Vector3(), isDead: false, takeDamage() {} };
    const originalRandom = Math.random;
    let scenarios = 0;
    try {
        for (const portal of arena.portals) {
            arena.getPortals = () => [portal];
            for (const type of ['walker', 'sprinter', 'tank', 'boss', 'giant', 'spitter']) {
                for (const jitter of [0, 0.5, 0.999999]) {
                    Math.random = () => jitter;
                    for (const fps of [30, 60, 144]) {
                        waves.clear();
                        assert.equal(waves.spawnZombie(type), true);
                        const zombie = waves.enemies[0];
                        const start = zombie.position.clone();
                        const label = `${portal.name}/${type}/${jitter}/${fps}`;
                        assert.equal(arena.checkCollision(start, zombie.radius), false, label);
                        for (let frame = 0; frame < fps * 2; frame++) {
                            zombie.update(1 / fps, player, arena, waves.enemies);
                            assert.equal(arena.checkCollision(zombie.position, zombie.radius), false, label);
                        }
                        const progress = zombie.position.clone().sub(start).dot(portal.spawnDir);
                        assert.ok(progress > zombie.speed, `${label}: did not leave gate (${progress})`);
                        scenarios++;
                    }
                }
            }
        }
    } finally {
        Math.random = originalRandom;
    }
    assert.equal(scenarios, 216);
});

test('spawn search clears an obstacle directly in front of a portal', () => {
    const { arena } = fixture();
    const portal = arena.portals[0];
    arena.colliders.push(new THREE.Box3(
        new THREE.Vector3(-3, 0, -107), new THREE.Vector3(3, 3, -104)
    ));
    const spawn = arena.getPortalSpawnPosition(portal, 1.3);
    assert.ok(spawn);
    assert.equal(arena.checkCollision(spawn, 1.3), false);
});

test('blocked exits preserve the wave queue and retry after clearance', () => {
    const { arena, waves } = fixture();
    const obstruction = new THREE.Box3(new THREE.Vector3(-120, 0, -120), new THREE.Vector3(120, 5, 120));
    arena.colliders.push(obstruction);
    waves.spawnQueue = ['boss'];
    waves.isWaveInProgress = true;
    const player = { position: new THREE.Vector3(), isDead: false };
    assert.equal(waves.update(1, player, arena), false);
    assert.deepEqual(waves.spawnQueue, ['boss']);
    assert.equal(waves.enemies.length, 0);
    arena.colliders.pop();
    waves.update(1, player, arena);
    assert.equal(waves.spawnQueue.length, 0);
    assert.equal(waves.enemies.length, 1);
});
