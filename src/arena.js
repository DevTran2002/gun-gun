import * as THREE from 'three';

const _tempArenaBox = new THREE.Box3();
const _tempArenaMin = new THREE.Vector3();
const _tempArenaMax = new THREE.Vector3();
const _tempLosDir = new THREE.Vector3();
const _tempLosRay = new THREE.Ray();
const _tempLosHit = new THREE.Vector3();

export class Arena {
    constructor(scene, gltfLoader) {
        this.scene = scene;
        this.loader = gltfLoader;
        this.colliders = []; // Array of THREE.Box3 for obstacle collisions
        this.portals = [];
        this.models = {};
    }

    async loadModels() {
        const modelNames = [
            'floor', 'floor-detail', 'wall', 'wall-corner', 'wall-high', 'wall-low', 'wall-gate',
            'column', 'column-damaged', 'tree', 'stairs', 'platform', 'platform-large-grass',
            'banner', 'block', 'statue', 'trophy', 'weapon-rack'
        ];

        const promises = modelNames.map(name => {
            return new Promise((resolve) => {
                this.loader.load(
                    `assets/models/${name}.glb`,
                    (gltf) => {
                        this.models[name] = gltf.scene;
                        gltf.scene.traverse((child) => {
                            if (child.isMesh) {
                                child.castShadow = true;
                                child.receiveShadow = true;
                            }
                        });
                        resolve();
                    },
                    undefined,
                    () => resolve()
                );
            });
        });

        await Promise.all(promises);
    }

    buildArena() {
        this.setupLighting();
        this.buildFloorAndWalls();
        this.buildCenterPlaza();
        this.buildTacticalCover();
        this.buildSpawnPortals();
        this.buildGrass();
    }

    setupLighting() {
        const ambientLight = new THREE.AmbientLight(0xddeeff, 0.75);
        this.scene.add(ambientLight);

        const hemiLight = new THREE.HemisphereLight(0x88ccff, 0x223344, 0.6);
        this.scene.add(hemiLight);

        const sun = new THREE.DirectionalLight(0xfff5e6, 1.8);
        sun.position.set(25, 38, 20);
        sun.castShadow = true;
        sun.shadow.mapSize.width = 1024;
        sun.shadow.mapSize.height = 1024;
        sun.shadow.camera.near = 1.0;
        sun.shadow.camera.far = 80;
        const d = 26;
        sun.shadow.camera.left = -d;
        sun.shadow.camera.right = d;
        sun.shadow.camera.top = d;
        sun.shadow.camera.bottom = -d;
        sun.shadow.bias = -0.0005;
        this.scene.add(sun);
    }

    placeInstance(modelName, position, rotationY = 0, scale = 1, addCollider = false) {
        const base = this.models[modelName];
        if (!base) return null;

        const clone = base.clone(true);
        clone.position.copy(position);
        clone.rotation.y = rotationY;
        clone.scale.set(scale, scale, scale);
        this.scene.add(clone);

        if (addCollider) {
            clone.updateMatrixWorld(true);
            const box = new THREE.Box3().setFromObject(clone);
            this.colliders.push(box);
        }

        return clone;
    }

    buildFloorAndWalls() {
        const halfSize = 110; // 220x220 map size (5x original)
        const tileSize = 2;

        // 1. High-Performance Instanced Floor
        const floorBase = this.models['floor'];
        let floorGeo = null;
        let floorMat = null;
        if (floorBase) {
            floorBase.traverse(c => {
                if (c.isMesh && !floorGeo) {
                    floorGeo = c.geometry;
                    floorMat = c.material;
                }
            });
        }

        if (floorGeo && floorMat) {
            const steps = Math.floor((halfSize * 2) / tileSize) + 1;
            const totalTiles = steps * steps;
            const turfMaterial = new THREE.MeshStandardMaterial({ color: 0x9dbf68, roughness: 1 });
            const instancedFloor = new THREE.InstancedMesh(floorGeo, turfMaterial, totalTiles);
            instancedFloor.name = 'grass-ground';
            instancedFloor.receiveShadow = true;
            instancedFloor.castShadow = false;

            const dummy = new THREE.Object3D();
            let idx = 0;
            for (let x = -halfSize; x <= halfSize; x += tileSize) {
                for (let z = -halfSize; z <= halfSize; z += tileSize) {
                    dummy.position.set(x, 0, z);
                    dummy.rotation.set(0, 0, 0);
                    dummy.scale.set(tileSize, tileSize, tileSize);
                    dummy.updateMatrix();
                    instancedFloor.setMatrixAt(idx, dummy.matrix);
                    const shade = 0.94 + (Math.sin(x * 0.73 + z * 0.39) + 1) * 0.03;
                    instancedFloor.setColorAt(idx++, new THREE.Color(shade, 1, shade));
                }
            }
            instancedFloor.instanceMatrix.needsUpdate = true;
            this.scene.add(instancedFloor);
        }

        // 2. High-Performance Instanced Perimeter Walls
        const wallBase = this.models['wall-high'];
        let wallGeo = null;
        let wallMat = null;
        if (wallBase) {
            wallBase.traverse(c => {
                if (c.isMesh && !wallGeo) {
                    wallGeo = c.geometry;
                    wallMat = c.material;
                }
            });
        }

        if (wallGeo && wallMat) {
            const wallStep = 2;
            const wallScale = 2;
            const stepsCount = Math.floor((halfSize * 2) / wallStep) + 1;
            const totalWalls = stepsCount * 4;

            const instancedWalls = new THREE.InstancedMesh(wallGeo, wallMat, totalWalls);
            instancedWalls.castShadow = true;
            instancedWalls.receiveShadow = true;

            const dummy = new THREE.Object3D();
            let wIdx = 0;

            for (let x = -halfSize; x <= halfSize; x += wallStep) {
                // Skip center where portals are located (x around 0)
                if (Math.abs(x) > 2.5) {
                    dummy.position.set(x, 0, -halfSize - 1);
                    dummy.rotation.set(0, 0, 0);
                    dummy.scale.set(wallScale, wallScale, wallScale);
                    dummy.updateMatrix();
                    instancedWalls.setMatrixAt(wIdx++, dummy.matrix);

                    dummy.position.set(x, 0, halfSize + 1);
                    dummy.rotation.set(0, Math.PI, 0);
                    dummy.scale.set(wallScale, wallScale, wallScale);
                    dummy.updateMatrix();
                    instancedWalls.setMatrixAt(wIdx++, dummy.matrix);
                }
            }

            for (let z = -halfSize; z <= halfSize; z += wallStep) {
                if (Math.abs(z) > 2.5) {
                    dummy.position.set(-halfSize - 1, 0, z);
                    dummy.rotation.set(0, Math.PI * 0.5, 0);
                    dummy.scale.set(wallScale, wallScale, wallScale);
                    dummy.updateMatrix();
                    instancedWalls.setMatrixAt(wIdx++, dummy.matrix);

                    dummy.position.set(halfSize + 1, 0, z);
                    dummy.rotation.set(0, -Math.PI * 0.5, 0);
                    dummy.scale.set(wallScale, wallScale, wallScale);
                    dummy.updateMatrix();
                    instancedWalls.setMatrixAt(wIdx++, dummy.matrix);
                }
            }

            instancedWalls.instanceMatrix.needsUpdate = true;
            this.scene.add(instancedWalls);
        }

        // Perimeter Boundary Colliders
        const wallHeight = 10;
        this.colliders.push(new THREE.Box3(
            new THREE.Vector3(-halfSize - 2, 0, -halfSize - 2),
            new THREE.Vector3(halfSize + 2, wallHeight, -halfSize)
        ));
        this.colliders.push(new THREE.Box3(
            new THREE.Vector3(-halfSize - 2, 0, halfSize),
            new THREE.Vector3(halfSize + 2, wallHeight, halfSize + 2)
        ));
        this.colliders.push(new THREE.Box3(
            new THREE.Vector3(-halfSize - 2, 0, -halfSize - 2),
            new THREE.Vector3(-halfSize, wallHeight, halfSize + 2)
        ));
        this.colliders.push(new THREE.Box3(
            new THREE.Vector3(halfSize, 0, -halfSize - 2),
            new THREE.Vector3(halfSize + 2, wallHeight, halfSize + 2)
        ));
    }

    buildSpawnPortals() {
        // 4 Dimensional Portals placed around the arena
        const portalDist = 108;
        const portalDefs = [
            { name: 'North Portal', pos: new THREE.Vector3(0, 0, -portalDist), rot: 0, spawnDir: new THREE.Vector3(0, 0, 1) },
            { name: 'South Portal', pos: new THREE.Vector3(0, 0, portalDist), rot: Math.PI, spawnDir: new THREE.Vector3(0, 0, -1) },
            { name: 'West Portal',  pos: new THREE.Vector3(-portalDist, 0, 0), rot: Math.PI * 0.5, spawnDir: new THREE.Vector3(1, 0, 0) },
            { name: 'East Portal',  pos: new THREE.Vector3(portalDist, 0, 0), rot: -Math.PI * 0.5, spawnDir: new THREE.Vector3(-1, 0, 0) }
        ];

        portalDefs.forEach((p, idx) => {
            // Portal Archway Gate
            const gate = this.placeInstance('wall-gate', p.pos, p.rot, 2.4, true);
            // The arch uses a solid box collider. Spawn beyond its arena-facing
            // surface, with the individual zombie's radius added at spawn time.
            let gateDepth = 0;
            if (gate) {
                const bounds = new THREE.Box3().setFromObject(gate);
                const front = new THREE.Vector3(
                    p.spawnDir.x >= 0 ? bounds.max.x : bounds.min.x,
                    0,
                    p.spawnDir.z >= 0 ? bounds.max.z : bounds.min.z
                );
                gateDepth = front.sub(p.pos).dot(p.spawnDir);
            }

            // Glowing Pulsating Vortex Disc
            const vortexGeo = new THREE.PlaneGeometry(1.6, 2.4);
            const vortexMat = new THREE.MeshBasicMaterial({
                color: idx % 2 === 0 ? 0xb026ff : 0xff0055,
                side: THREE.DoubleSide,
                transparent: true,
                opacity: 0.85
            });
            const vortexMesh = new THREE.Mesh(vortexGeo, vortexMat);
            vortexMesh.position.copy(p.pos);
            vortexMesh.position.y = 1.3;
            vortexMesh.rotation.y = p.rot;
            this.scene.add(vortexMesh);

            // Inner Portal Core Ring
            const ringGeo = new THREE.RingGeometry(0.3, 0.7, 16);
            const ringMat = new THREE.MeshBasicMaterial({
                color: 0x00f0ff,
                side: THREE.DoubleSide,
                transparent: true,
                opacity: 0.95
            });
            const ringMesh = new THREE.Mesh(ringGeo, ringMat);
            ringMesh.position.copy(p.pos);
            ringMesh.position.y = 1.3;
            ringMesh.position.addScaledVector(p.spawnDir, 0.05);
            ringMesh.rotation.y = p.rot;
            this.scene.add(ringMesh);

            // Dynamic Portal Light
            const pLight = new THREE.PointLight(idx % 2 === 0 ? 0xb026ff : 0xff0055, 4, 10);
            pLight.position.copy(p.pos);
            pLight.position.y = 1.4;
            pLight.position.addScaledVector(p.spawnDir, 0.8);
            this.scene.add(pLight);

            this.portals.push({
                name: p.name,
                position: p.pos,
                spawnPos: p.pos.clone().addScaledVector(p.spawnDir, gateDepth),
                spawnDir: p.spawnDir,
                vortex: vortexMesh,
                ring: ringMesh,
                light: pLight,
                baseLightIntensity: 4
            });
        });
    }

    buildCenterPlaza() {
        this.placeInstance('platform', new THREE.Vector3(0, 0, 0), 0, 4, true);
        this.placeInstance('trophy', new THREE.Vector3(0, 0.8, 0), 0, 2.2, true);

        const colDist = 6;
        const colScale = 2.2;
        this.placeInstance('column', new THREE.Vector3(-colDist, 0, -colDist), 0, colScale, true);
        this.placeInstance('column-damaged', new THREE.Vector3(colDist, 0, -colDist), 0.5, colScale, true);
        this.placeInstance('column', new THREE.Vector3(-colDist, 0, colDist), 1.2, colScale, true);
        this.placeInstance('column-damaged', new THREE.Vector3(colDist, 0, colDist), 2.1, colScale, true);

        this.placeInstance('stairs', new THREE.Vector3(0, 0, -3.2), 0, 1.8, false);
        this.placeInstance('stairs', new THREE.Vector3(0, 0, 3.2), Math.PI, 1.8, false);
    }

    buildTacticalCover() {
        const coverPoints = [
            { model: 'wall-low', pos: [-48, 0, -40], rot: 0, scale: 2 },
            { model: 'block', pos: [-56, 0, -40], rot: 0.2, scale: 1.8 },
            { model: 'tree', pos: [-64, 0, -56], rot: 0, scale: 2 },
            { model: 'weapon-rack', pos: [-40, 0, -48], rot: 1.5, scale: 1.8 },

            { model: 'wall-low', pos: [48, 0, -40], rot: 0, scale: 2 },
            { model: 'block', pos: [56, 0, -40], rot: -0.4, scale: 1.8 },
            { model: 'tree', pos: [64, 0, -56], rot: 0.8, scale: 2 },
            { model: 'banner', pos: [40, 0, -56], rot: 0, scale: 2.2 },

            { model: 'wall-low', pos: [-48, 0, 40], rot: Math.PI, scale: 2 },
            { model: 'block', pos: [-56, 0, 40], rot: 0.7, scale: 1.8 },
            { model: 'tree', pos: [-64, 0, 56], rot: 1.2, scale: 2 },
            { model: 'banner', pos: [-40, 0, 56], rot: Math.PI, scale: 2.2 },

            { model: 'wall-low', pos: [48, 0, 40], rot: Math.PI, scale: 2 },
            { model: 'block', pos: [56, 0, 40], rot: -0.8, scale: 1.8 },
            { model: 'tree', pos: [64, 0, 56], rot: 2.0, scale: 2 },
            { model: 'statue', pos: [56, 0, 16], rot: -1.2, scale: 2 },
            
            // Add more randomized cover objects to fill the empty space
            { model: 'wall-low', pos: [0, 0, -60], rot: Math.PI * 0.5, scale: 2 },
            { model: 'wall-low', pos: [0, 0, 60], rot: Math.PI * 0.5, scale: 2 },
            { model: 'tree', pos: [30, 0, 30], rot: 0.7, scale: 2 },
            { model: 'tree', pos: [-30, 0, -30], rot: 1.3, scale: 2 },
            { model: 'tree', pos: [30, 0, -30], rot: 2.1, scale: 2 },
            { model: 'tree', pos: [-30, 0, 30], rot: 2.6, scale: 2 }
        ];

        coverPoints.forEach(cp => {
            this.placeInstance(cp.model, new THREE.Vector3(cp.pos[0], cp.pos[1], cp.pos[2]), cp.rot, cp.scale, true);
        });

        this.placeInstance('platform-large-grass', new THREE.Vector3(-68, 0, 0), 0, 2.5, true);
        this.placeInstance('platform-large-grass', new THREE.Vector3(68, 0, 0), 0, 2.5, true);
        this.placeInstance('column', new THREE.Vector3(-68, 1.2, 0), 0, 1.5, true);
        this.placeInstance('column', new THREE.Vector3(68, 1.2, 0), 0, 1.5, true);
    }

    buildGrass() {
        const blades = new THREE.InstancedMesh(new THREE.ConeGeometry(0.10, 0.3, 3),
            new THREE.MeshStandardMaterial({ color: 0x609743, roughness: 1 }), 3200);
        blades.name = 'grass-blades';
        const dummy = new THREE.Object3D();
        // Identical decoration on every client; no colliders or extra draw calls.
        let seed = 731;
        const random = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);
        for (let i = 0; i < blades.count; i++) {
            dummy.position.set((random() - 0.5) * 216, 0.15, (random() - 0.5) * 216);
            dummy.rotation.y = random() * Math.PI;
            dummy.scale.set(1, 0.6 + random(), 1);
            dummy.updateMatrix();
            blades.setMatrixAt(i, dummy.matrix);
        }
        this.scene.add(blades);
    }

    update(delta) {
        // Animate portals only; the overhead arena has no cloud layer.
        const time = performance.now() * 0.003;
        for (const p of this.portals) {
            if (p.ring) {
                p.ring.rotation.z += delta * 2.5;
            }
            if (p.light) {
                p.light.intensity = p.baseLightIntensity + Math.sin(time * 3 + p.position.x) * 1.5;
            }
            if (p.vortex && p.vortex.material) {
                p.vortex.material.opacity = 0.75 + Math.sin(time * 4 + p.position.z) * 0.15;
            }
        }
    }

    getPortals() {
        return this.portals;
    }

    getPortalSpawnPosition(portal, radius) {
        const lateral = new THREE.Vector3(portal.spawnDir.z, 0, -portal.spawnDir.x);
        const jitter = (Math.random() - 0.5) * 1.5;
        // Jitter only across the exit, never backwards into the gate. Check the
        // complete body and search inward if another obstacle occupies the exit.
        for (let step = 0; step <= 16; step++) {
            const candidate = portal.spawnPos.clone()
                .addScaledVector(portal.spawnDir, radius + 0.15 + step * 0.5)
                .addScaledVector(lateral, jitter);
            if (!this.checkCollision(candidate, radius)) return candidate;
        }
        return null;
    }

    checkCollision(pos, radius = 0.5) {
        _tempArenaMin.set(pos.x - radius, 0.1, pos.z - radius);
        _tempArenaMax.set(pos.x + radius, 2.0, pos.z + radius);
        _tempArenaBox.min.copy(_tempArenaMin);
        _tempArenaBox.max.copy(_tempArenaMax);

        for (const col of this.colliders) {
            if (col.intersectsBox(_tempArenaBox)) {
                return true;
            }
        }
        return false;
    }

    hasLineOfSight(fromPos, toPos) {
        _tempLosDir.subVectors(toPos, fromPos);
        const dist = _tempLosDir.length();
        if (dist > 0.0001) _tempLosDir.multiplyScalar(1 / dist);

        _tempLosRay.set(fromPos, _tempLosDir);
        for (const col of this.colliders) {
            const hit = _tempLosRay.intersectBox(col, _tempLosHit);
            if (hit && fromPos.distanceTo(hit) < dist - 0.2) {
                return false;
            }
        }
        return true;
    }
}

