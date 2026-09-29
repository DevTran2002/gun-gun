import * as THREE from 'three';
import { sounds } from './audio.js';
import { RARE_WEAPON_CONFIGS } from './weapons.js';

export const DROP_TYPES = [
    { id: 'health', label: '+40 MÁU', color: 0x00ff88, weight: 0.15 },
    { id: 'medkit', label: '+1 TÚI CỨU THƯƠNG', color: 0x10b981, weight: 0.12 },
    { id: 'shield', label: '+50 GIÁP', color: 0x00d0ff, weight: 0.10 },
    { id: 'ammo', label: '+3 BĂNG ĐẠN DỰ TRỮ', color: 0xffffff, weight: 0.35 },
    { id: 'damage', label: '+20% SÁT THƯƠNG', color: 0xff6644, weight: 0.10 },
    { id: 'rapid', label: '+12.5% TỐC ĐỘ BẮN', color: 0xffdd33, weight: 0.08 },
    { id: 'multishot', label: '+2 TIA ĐẠN', color: 0xdd66ff, weight: 0.06 },
    { id: 'weapon', label: 'SÚNG HIẾM', color: 0xffaa22, weight: 0.04 }
];

export class PickupManager {
    constructor(scene, particles) {
        this.scene = scene;
        this.particles = particles;
        this.pickups = [];
        this.nextId = 1;
        this.airdropTimer = 16;
        this.geoBox = new THREE.BoxGeometry(0.4, 0.4, 0.4);
        this.geoOcta = new THREE.OctahedronGeometry(0.35);
        this.geoBarrel = new THREE.BoxGeometry(0.75, 0.16, 0.18);
        this.geoBeam = new THREE.CylinderGeometry(0.04, 0.1, 2.2, 6);
        this.geoRing = new THREE.TorusGeometry(0.48, 0.035, 4, 24);
    }

    spawnDrop(position, enemyType = 'walker') {
        if (Math.random() > 0.15) return null;
        let roll = Math.random();
        const definition = DROP_TYPES.find(drop => {
            roll -= drop.weight;
            return roll < 0;
        }) || DROP_TYPES.at(-1);
        return this.createPickup(position, definition.id);
    }

    createPickup(position, type, options = {}) {
        if (type === 'airdrop') return this.createAirdrop(position, options);
        const definition = DROP_TYPES.find(drop => drop.id === type);
        if (!definition) return null;
        const { color } = definition;
        const weaponSlot = type === 'weapon' ? (options.weaponSlot ?? Math.floor(Math.random() * RARE_WEAPON_CONFIGS.length)) : null;
        const label = type === 'weapon' ? RARE_WEAPON_CONFIGS[weaponSlot].name : definition.label;
        const mesh = new THREE.Group();
        mesh.position.copy(position);
        mesh.position.y = 0.7;
        const material = new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 0.8, roughness: 0.25 });
        const body = new THREE.Group();
        mesh.add(body);
        if (type === 'multishot') {
            for (let i = -1; i <= 1; i++) {
                const shard = new THREE.Mesh(this.geoOcta, material);
                shard.scale.setScalar(0.55);
                shard.position.x = i * 0.3;
                body.add(shard);
            }
        } else if (type === 'weapon') {
            const barrel = new THREE.Mesh(this.geoBarrel, material);
            const grip = new THREE.Mesh(this.geoBox, material);
            grip.scale.set(0.35, 0.8, 0.35);
            grip.position.set(-0.16, -0.2, 0);
            body.add(barrel, grip);
        } else {
            const core = new THREE.Mesh(['health', 'medkit', 'shield', 'ammo'].includes(type) ? this.geoBox : this.geoOcta, material);
            body.add(core);
        }
        const ring = new THREE.Mesh(this.geoRing, material);
        ring.rotation.x = Math.PI / 2;
        ring.position.y = -0.5;
        mesh.add(ring);
        const beam = new THREE.Mesh(this.geoBeam, new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.22, depthWrite: false }));
        beam.position.y = 0.5;
        mesh.add(beam);
        // Billboard labels let players identify a reward before collecting it.
        if (typeof document !== 'undefined') {
            const canvas = document.createElement('canvas');
            canvas.width = 512;
            canvas.height = 80;
            const ctx = canvas.getContext('2d');
            ctx.fillStyle = 'rgba(8, 15, 24, 0.85)';
            ctx.fillRect(0, 0, 512, 80);
            ctx.font = 'bold 40px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = `#${color.toString(16).padStart(6, '0')}`;
            ctx.fillText(label, 256, 40, 490);
            const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(canvas), depthWrite: false }));
            sprite.position.y = 1.3;
            sprite.scale.set(3, 0.47, 1);
            mesh.add(sprite);
        }
        this.scene.add(mesh);
        const pickup = { id: options.id ?? this.nextId++, mesh, body, type, color, weaponSlot, baseY: 0.7, life: type === 'weapon' ? 60 : 45 };
        this.pickups.push(pickup);
        return pickup;
    }

    createAirdrop(position, options = {}) {
        const group = new THREE.Group();
        group.position.copy(position);
        group.position.y = 0.45;
        const crate = new THREE.Mesh(new THREE.BoxGeometry(1.25, 0.8, 1.25),
            new THREE.MeshStandardMaterial({ color: 0xd14a28, roughness: 0.75 }));
        const strap = new THREE.Mesh(new THREE.BoxGeometry(1.34, 0.12, 0.16),
            new THREE.MeshStandardMaterial({ color: 0xf2cf63, emissive: 0x553300, emissiveIntensity: 0.4 }));
        const beacon = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 2.2, 8),
            new THREE.MeshBasicMaterial({ color: 0xff5522, transparent: true, opacity: 0.6, depthWrite: false }));
        strap.position.y = 0.42;
        beacon.position.y = 1.35;
        group.add(crate, strap, beacon);
        this.scene.add(group);
        const pickup = { id: options.id ?? this.nextId++, mesh: group, body: group, type: 'airdrop', color: 0xff5522,
            weaponSlot: Math.floor(Math.random() * RARE_WEAPON_CONFIGS.length), baseY: 0.45, life: 90 };
        this.pickups.push(pickup);
        return pickup;
    }

    collect(pickup, player) {
        const weapons = player.weapons;
        // Hòm tiếp tế chứa combo đầy đủ vật phẩm buff, đạn, hồi máu
        if (pickup.type === 'airdrop') {
            weapons.addAmmo(4); // +4 băng đạn
            player.heal(40); // Hồi 40 máu
            if (weapons.inventory.medkits < 5) weapons.inventory.medkits++; // +1 túi cứu thương
            // Ngẫu nhiên nhận buff hoặc súng hiếm
            const roll = Math.random();
            if (roll < 0.28) {
                weapons.equipRareWeapon(pickup.weaponSlot);
                return 'HÒM TIẾP TẾ: +SÚNG HIẾM +4 BĂNG ĐẠN +HỒI MÁU!';
            } else if (roll < 0.52) {
                weapons.applyUpgrade('damage');
                return 'HÒM TIẾP TẾ: +20% SÁT THƯƠNG +4 BĂNG ĐẠN +HỒI MÁU!';
            } else if (roll < 0.76) {
                weapons.applyUpgrade('rapid');
                return 'HÒM TIẾP TẾ: +TỐC ĐỘ BẮN +4 BĂNG ĐẠN +HỒI MÁU!';
            } else {
                weapons.applyUpgrade('multishot');
                return 'HÒM TIẾP TẾ: +ĐA TIA ĐẠN +4 BĂNG ĐẠN +HỒI MÁU!';
            }
        }
        if (pickup.type === 'health') { player.heal(40); return '+40 MÁU'; }
        if (pickup.type === 'medkit') {
            if (weapons.inventory.medkits < 5) weapons.inventory.medkits++;
            return '+1 TÚI CỨU THƯƠNG [PHÍM 3]';
        }
        if (pickup.type === 'shield') { player.rechargeShield(50); return '+50 GIÁP'; }
        if (pickup.type === 'ammo') { weapons.addAmmo(3); return '+3 BĂNG ĐẠN DỰ TRỮ • R ĐỂ NẠP'; }
        if (pickup.type === 'weapon') {
            if (weapons.equipRareWeapon(pickup.weaponSlot)) return `ĐÃ TRANG BỊ ${weapons.getCurrentWeapon().name} • Ô 1`;
            if (weapons.applyUpgrade('damage')) return 'SÚNG TRÙNG → +20% SÁT THƯƠNG';
        } else if (weapons.applyUpgrade(pickup.type)) {
            const level = weapons.upgrades[pickup.type];
            return `${DROP_TYPES.find(drop => drop.id === pickup.type).label} • CẤP ${level}`;
        }
        weapons.addAmmo(2);
        player.rechargeShield(35);
        return 'ĐÃ ĐẠT TỐI ĐA → +2 BĂNG ĐẠN +35 GIÁP';
    }

    update(delta, player, onPickupNotify, authoritative = true) {
        const players = Array.isArray(player) ? player : [player];
        if (authoritative && !Array.isArray(player)) {
            this.airdropTimer -= delta;
            if (this.airdropTimer <= 0) {
                this.airdropTimer = 18 + Math.random() * 8;
                const centerP = Array.isArray(player) ? player[0] : player;
                const px = centerP ? centerP.position.x : 0;
                const pz = centerP ? centerP.position.z : 0;
                const angle = Math.random() * Math.PI * 2;
                const dist = 10 + Math.random() * 12;
                const x = Math.max(-24, Math.min(24, px + Math.cos(angle) * dist));
                const z = Math.max(-24, Math.min(24, pz + Math.sin(angle) * dist));
                this.createPickup(new THREE.Vector3(x, 0, z), 'airdrop');
                onPickupNotify?.('HÒM TIẾP TẾ ĐÃ RƠI XUỐNG CHIẾN TRƯỜNG!', 'airdrop', centerP);
            }
        }
        for (let i = this.pickups.length - 1; i >= 0; i--) {
            const pickup = this.pickups[i];
            pickup.life -= delta;
            if (pickup.life <= 0) { this.remove(i); continue; }
            pickup.body.rotation.y += (pickup.type === 'airdrop' ? 0.4 : 2.2) * delta;
            pickup.mesh.position.y = pickup.baseY + Math.sin(performance.now() * 0.005 + i) * 0.15;
            const collector = authoritative && players.find(p => !p.isDead && Math.hypot(pickup.mesh.position.x - p.position.x, pickup.mesh.position.z - p.position.z) < 1.6);
            if (collector) {
                const text = this.collect(pickup, collector);
                sounds.playPickup(pickup.type);
                this.particles.createImpactSparks(pickup.mesh.position, new THREE.Vector3(0, 1, 0), pickup.color, 18);
                if (onPickupNotify) onPickupNotify(text, pickup.type, collector);
                this.remove(i);
            }
        }
    }

    remove(index) {
        const pickup = this.pickups[index];
        pickup.mesh.removeFromParent();
        const materials = new Set();
        pickup.mesh.traverse(child => { if (child.material) materials.add(child.material); });
        for (const material of materials) {
            material.map?.dispose();
            material.dispose();
        }
        this.pickups.splice(index, 1);
    }

    clear() {
        while (this.pickups.length) this.remove(this.pickups.length - 1);
    }
}
