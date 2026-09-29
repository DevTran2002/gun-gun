import * as THREE from 'three';

export class ParticleSystem {
    constructor(scene) {
        this.scene = scene;
        this.particles = [];
        this.debris = [];
        this.muzzleFlashes = [];

        // Pre-create reusable materials for performance
        this.sparkMaterial = new THREE.MeshBasicMaterial({
            color: 0x00f0ff,
            transparent: true,
            opacity: 1
        });
        this.orangeSparkMaterial = new THREE.MeshBasicMaterial({
            color: 0xffaa00,
            transparent: true,
            opacity: 1
        });
        this.critSparkMaterial = new THREE.MeshBasicMaterial({
            color: 0xff2255,
            transparent: true,
            opacity: 1
        });
        this.smokeMaterial = new THREE.MeshBasicMaterial({
            color: 0x556677,
            transparent: true,
            opacity: 0.6
        });
        this.sparkGeo = new THREE.BoxGeometry(0.08, 0.08, 0.08);
        this.debrisGeo = new THREE.BoxGeometry(0.18, 0.18, 0.18);
    }

    createMuzzleFlash(position, direction, color = 0x00f0ff) {
        const flashGroup = new THREE.Group();
        flashGroup.position.copy(position);

        const light = new THREE.PointLight(color, 8, 4);
        flashGroup.add(light);

        const geo = new THREE.SphereGeometry(0.15, 8, 8);
        const mat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.9 });
        const mesh = new THREE.Mesh(geo, mat);
        flashGroup.add(mesh);

        this.scene.add(flashGroup);
        this.muzzleFlashes.push({
            obj: flashGroup,
            light: light,
            mat: mat,
            life: 0.06,
            maxLife: 0.06
        });
    }

    createKnifeSlash(position, direction, color = 0xdbe8ff) {
        const slashGroup = new THREE.Group();
        // Position slightly in front of the player
        slashGroup.position.copy(position).addScaledVector(direction, 0.8);
        
        // Create an arc geometry for the slash
        const geo = new THREE.PlaneGeometry(3.0, 0.6);
        const mat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.9, side: THREE.DoubleSide });
        const mesh = new THREE.Mesh(geo, mat);
        
        // Orient the slash facing the camera (or upright)
        mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, -1), direction);
        mesh.rotateZ((Math.random() - 0.5) * Math.PI * 0.5); // Random slant

        slashGroup.add(mesh);
        this.scene.add(slashGroup);
        
        this.muzzleFlashes.push({
            obj: slashGroup,
            mat: mat,
            life: 0.12,
            maxLife: 0.12,
            scaleSpeed: 2.5
        });
    }

    createImpactSparks(position, normal, color = 0x00f0ff, count = 10) {
        const mat = color === 0xff2255 ? this.critSparkMaterial : 
                    color === 0xffaa00 ? this.orangeSparkMaterial : this.sparkMaterial;

        for (let i = 0; i < count; i++) {
            const mesh = new THREE.Mesh(this.sparkGeo, mat.clone());
            mesh.position.copy(position);

            const spread = 0.8;
            const velocity = new THREE.Vector3(
                normal.x + (Math.random() - 0.5) * spread,
                normal.y + (Math.random() - 0.5) * spread,
                normal.z + (Math.random() - 0.5) * spread
            ).normalize().multiplyScalar(4 + Math.random() * 6);

            this.scene.add(mesh);
            this.particles.push({
                mesh: mesh,
                velocity: velocity,
                life: 0.25 + Math.random() * 0.2,
                maxLife: 0.45,
                gravity: 9.8,
                drag: 0.92,
                scaleSpeed: 2.0
            });
        }
    }

    createExplosion(position, color = 0xff6600, debrisCount = 18) {
        // Flash light
        const flashLight = new THREE.PointLight(0xffaa22, 15, 8);
        flashLight.position.copy(position);
        this.scene.add(flashLight);
        this.muzzleFlashes.push({
            obj: flashLight,
            light: flashLight,
            life: 0.2,
            maxLife: 0.2
        });

        // Sparks
        this.createImpactSparks(position, new THREE.Vector3(0, 1, 0), 0xffaa00, 24);

        // Debris pieces
        const debrisColors = [0x333333, 0xff5500, 0x8899aa, 0x111111];
        for (let i = 0; i < debrisCount; i++) {
            const dColor = debrisColors[Math.floor(Math.random() * debrisColors.length)];
            const mat = new THREE.MeshStandardMaterial({
                color: dColor,
                roughness: 0.4,
                metalness: 0.8
            });
            const mesh = new THREE.Mesh(this.debrisGeo, mat);
            mesh.position.copy(position);
            mesh.castShadow = true;

            const angle = Math.random() * Math.PI * 2;
            const elevation = (Math.random() - 0.2) * Math.PI;
            const speed = 4 + Math.random() * 8;
            const velocity = new THREE.Vector3(
                Math.cos(angle) * Math.cos(elevation) * speed,
                Math.sin(elevation) * speed + 3,
                Math.sin(angle) * Math.cos(elevation) * speed
            );

            const rotVelocity = new THREE.Vector3(
                (Math.random() - 0.5) * 12,
                (Math.random() - 0.5) * 12,
                (Math.random() - 0.5) * 12
            );

            this.scene.add(mesh);
            this.debris.push({
                mesh: mesh,
                velocity: velocity,
                rotVelocity: rotVelocity,
                life: 1.2 + Math.random() * 0.8,
                maxLife: 2.0,
                gravity: 16.0,
                bounce: 0.5
            });
        }
    }

    createShieldHit(position) {
        this.createImpactSparks(position, new THREE.Vector3(0, 1, 0), 0x00f0ff, 12);
    }

    update(delta) {
        // Update muzzle flashes
        for (let i = this.muzzleFlashes.length - 1; i >= 0; i--) {
            const f = this.muzzleFlashes[i];
            f.life -= delta;
            const progress = f.life / f.maxLife;
            if (f.light) f.light.intensity = progress * 8;
            if (f.mat) f.mat.opacity = progress;

            if (f.life <= 0) {
                this.scene.remove(f.obj);
                this.muzzleFlashes.splice(i, 1);
            }
        }

        // Update sparks
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.life -= delta;
            if (p.life <= 0) {
                this.scene.remove(p.mesh);
                p.mesh.geometry.dispose();
                this.particles.splice(i, 1);
                continue;
            }

            p.velocity.y -= p.gravity * delta;
            p.velocity.multiplyScalar(p.drag);
            p.mesh.position.addScaledVector(p.velocity, delta);

            const scale = Math.max(0.01, p.life / p.maxLife);
            p.mesh.scale.set(scale, scale, scale);
            if (p.mesh.material) {
                p.mesh.material.opacity = scale;
            }
        }

        // Update debris
        for (let i = this.debris.length - 1; i >= 0; i--) {
            const d = this.debris[i];
            d.life -= delta;

            if (d.life <= 0) {
                this.scene.remove(d.mesh);
                d.mesh.geometry.dispose();
                d.mesh.material.dispose();
                this.debris.splice(i, 1);
                continue;
            }

            d.velocity.y -= d.gravity * delta;
            d.mesh.position.addScaledVector(d.velocity, delta);

            // Ground bounce
            if (d.mesh.position.y < 0.1) {
                d.mesh.position.y = 0.1;
                d.velocity.y = -d.velocity.y * d.bounce;
                d.velocity.x *= 0.7;
                d.velocity.z *= 0.7;
            }

            d.mesh.rotation.x += d.rotVelocity.x * delta;
            d.mesh.rotation.y += d.rotVelocity.y * delta;
            d.mesh.rotation.z += d.rotVelocity.z * delta;

            if (d.life < 0.5) {
                const s = d.life / 0.5;
                d.mesh.scale.set(s, s, s);
            }
        }
    }

    clear() {
        for (const p of this.particles) {
            this.scene.remove(p.mesh);
        }
        for (const d of this.debris) {
            this.scene.remove(d.mesh);
        }
        for (const f of this.muzzleFlashes) {
            this.scene.remove(f.obj);
        }
        this.particles = [];
        this.debris = [];
        this.muzzleFlashes = [];
    }
}
