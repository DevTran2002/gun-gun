import * as THREE from 'three';
import { sounds } from './audio.js';

// Danh mục vật phẩm chuẩn Hardcore Extraction Shooter
export const LOOT_ITEMS = {
    // 1. Vũ khí quân dụng (Weapons)
    weapon_assault: {
        id: 'weapon_assault',
        name: 'Súng Trường Tấn Công AK-CYBER',
        category: 'weapon',
        rarity: 'epic',
        color: '#b026ff',
        icon: 'AK',
        description: 'Vũ khí tự động quân dụng 7.62mm, uy lực cao, độ giật đầm, tàn phá mục tiêu bọc giáp.',
        value: 1200,
        stackMax: 1,
        weaponSlotId: 1
    },
    weapon_sniper: {
        id: 'weapon_sniper',
        name: 'Súng Bắn Tỉa Hạng Nặng DSR-50',
        category: 'weapon',
        rarity: 'legendary',
        color: '#ffaa00',
        icon: 'SR',
        description: 'Súng bắn tỉa hạng nặng công phá cao, đạn xuyên thấu mọi lớp vỏ bảo hộ của zombie khổng lồ.',
        value: 2500,
        stackMax: 1,
        weaponSlotId: 2
    },
    weapon_shotgun: {
        id: 'weapon_shotgun',
        name: 'Shotgun Tác Chiến STRIKER-12',
        category: 'weapon',
        rarity: 'rare',
        color: '#00d0ff',
        icon: 'SG',
        description: 'Shotgun tác chiến cự ly gần với chùm đạn đa tia diện rộng, đẩy lùi đàn zombie hung hãn.',
        value: 800,
        stackMax: 1,
        weaponSlotId: 0
    },

    // 2. Đạn dược chuyên dụng (Ammunition)
    ammo_ap: {
        id: 'ammo_ap',
        name: 'Hộp Đạn Xuyên Giáp AP (Armor Piercing)',
        category: 'ammo',
        rarity: 'epic',
        color: '#b026ff',
        icon: 'AP',
        description: 'Đạn lõi vonfram mật độ cao, tăng 100% xuyên thấu giáp và xé rách mô cứng đột biến.',
        value: 650,
        stackMax: 3,
        effect: { type: 'damage_boost', duration: 45, value: 0.35 }
    },
    ammo_standard: {
        id: 'ammo_standard',
        name: 'Băng Đạn Quân Dụng Tiêu Chuẩn',
        category: 'ammo',
        rarity: 'common',
        color: '#94a3b8',
        icon: 'STD',
        description: 'Băng đạn tiêu chuẩn nạp đầy 4 băng đạn dự trữ cho mọi loại súng tác chiến.',
        value: 200,
        stackMax: 5,
        effect: { type: 'add_ammo', packs: 4 }
    },
    ammo_hollow: {
        id: 'ammo_hollow',
        name: 'Hộp Đạn Sát Thương Mô Mềm HP',
        category: 'ammo',
        rarity: 'rare',
        color: '#00d0ff',
        icon: 'HP',
        description: 'Đạn nở khi va chạm, tăng 40% sát thương chí mạng crit lên quái không mặc giáp.',
        value: 450,
        stackMax: 3,
        effect: { type: 'crit_boost', duration: 30, value: 0.4 }
    },

    // 3. Giáp bảo hộ & Phòng vệ (Armor & Defense)
    armor_vest_lvl4: {
        id: 'armor_vest_lvl4',
        name: 'Áo Giáp Chống Đạn Kevlar Cấp 4',
        category: 'armor',
        rarity: 'rare',
        color: '#00d0ff',
        icon: 'LV4',
        description: 'Áo giáp sợi aramid tăng thêm +60 Giáp tối đa và lập tức sạc đầy lớp khiên phòng hộ.',
        value: 900,
        stackMax: 1,
        effect: { type: 'equip_armor', bonusShield: 60 }
    },
    armor_vest_lvl6: {
        id: 'armor_vest_lvl6',
        name: 'Áo Giáp Gốm Titan Cấp 6 (Heavy Armor)',
        category: 'armor',
        rarity: 'legendary',
        color: '#ffaa00',
        icon: 'LV6',
        description: 'Giáp tấm gốm cao cấp cấp độ đặc nhiệm, tăng +120 Giáp tối đa và giảm 25% sát thương nhận vào.',
        value: 2800,
        stackMax: 1,
        effect: { type: 'equip_armor', bonusShield: 120, damageReduction: 0.25 }
    },

    // 4. Y tế & Sinh tồn (Medical & Stimulants)
    medkit_military: {
        id: 'medkit_military',
        name: 'Túi Cứu Thương Dã Chiến IFAK',
        category: 'medical',
        rarity: 'rare',
        color: '#10b981',
        icon: 'MED',
        description: 'Bộ cấp cứu tiêu chuẩn NATO: cầm máu tức thì, hồi phục 75 Máu và giải trừ độc tính axit.',
        value: 500,
        stackMax: 3,
        effect: { type: 'heal', amount: 75 }
    },
    painkiller_morphine: {
        id: 'painkiller_morphine',
        name: 'Ống Tiêm Giảm Đau Morphine',
        category: 'medical',
        rarity: 'rare',
        color: '#00d0ff',
        icon: 'MOR',
        description: 'Xóa bỏ mọi cảm giác đau đớn, tăng 35% tốc độ di chuyển trong 20 giây.',
        value: 400,
        stackMax: 4,
        effect: { type: 'speed_boost', duration: 20, multiplier: 1.35 }
    },
    stimpack_adrenaline: {
        id: 'stimpack_adrenaline',
        name: 'Huyết Thanh Kích Thích Adrenaline Combat',
        category: 'medical',
        rarity: 'epic',
        color: '#b026ff',
        icon: 'ADR',
        description: 'Kích thích phản xạ thần kinh: tăng 25% tốc độ xả đạn và hồi 30 Máu khẩn cấp.',
        value: 750,
        stackMax: 2,
        effect: { type: 'rapid_stim', duration: 25, fireRateMultiplier: 1.25, heal: 30 }
    },

    // 5. Đồ quý giá & Tài liệu mật (Valuables)
    gold_bar: {
        id: 'gold_bar',
        name: 'Thỏi Vàng Quân Quỹ 9999 (1kg)',
        category: 'valuable',
        rarity: 'legendary',
        color: '#ffaa00',
        icon: 'AU',
        description: 'Tài sản thanh khoản cực cao từ kho dự trữ ngầm. Quy đổi trực tiếp 3000 Điểm sinh tồn.',
        value: 3000,
        stackMax: 5,
        effect: { type: 'score', points: 3000 }
    },
    military_flashdrive: {
        id: 'military_flashdrive',
        name: 'Ổ Cứng Mã Hóa Dữ Liệu Quân Sự',
        category: 'valuable',
        rarity: 'epic',
        color: '#b026ff',
        icon: 'USB',
        description: 'Chứa sơ đồ trạm nghiên cứu sinh học ngầm. Quy đổi 1800 Điểm sinh tồn.',
        value: 1800,
        stackMax: 3,
        effect: { type: 'score', points: 1800 }
    },
    classified_intel: {
        id: 'classified_intel',
        name: 'Tài Liệu Tuyệt Mật Mutant Project',
        category: 'valuable',
        rarity: 'epic',
        color: '#b026ff',
        icon: 'DOC',
        description: 'Hồ sơ nghiên cứu gen đột biến Mutant Overlord. Quy đổi 2200 Điểm sinh tồn.',
        value: 2200,
        stackMax: 2,
        effect: { type: 'score', points: 2200 }
    }
};

// Cấu hình các loại hòm đồ tương tác trong sàn đấu
export const CONTAINER_CONFIGS = {
    wooden_crate: {
        id: 'wooden_crate',
        name: 'Thùng Gỗ Quân Trang',
        searchDuration: 1.8,
        capacity: 8,
        meshColor: 0x8b5a2b,
        accentColor: 0x4a3525,
        promptLabel: '[F] LỤC THÙNG GỖ',
        lootTable: [
            { itemId: 'ammo_standard', chance: 0.85, min: 1, max: 2 },
            { itemId: 'ammo_hollow', chance: 0.35, min: 1, max: 1 },
            { itemId: 'medkit_military', chance: 0.45, min: 1, max: 1 },
            { itemId: 'painkiller_morphine', chance: 0.40, min: 1, max: 1 },
            { itemId: 'armor_vest_lvl4', chance: 0.20, min: 1, max: 1 },
            { itemId: 'weapon_shotgun', chance: 0.15, min: 1, max: 1 }
        ]
    },
    military_safe: {
        id: 'military_safe',
        name: 'Két Sắt Quân Sự Chống Đạn',
        searchDuration: 3.2,
        capacity: 6,
        meshColor: 0x334155,
        accentColor: 0x0284c7,
        promptLabel: '[F] MỞ KHÓA KÉT SẮT',
        lootTable: [
            { itemId: 'ammo_ap', chance: 0.75, min: 1, max: 2 },
            { itemId: 'armor_vest_lvl6', chance: 0.35, min: 1, max: 1 },
            { itemId: 'gold_bar', chance: 0.50, min: 1, max: 2 },
            { itemId: 'military_flashdrive', chance: 0.60, min: 1, max: 1 },
            { itemId: 'classified_intel', chance: 0.45, min: 1, max: 1 },
            { itemId: 'weapon_assault', chance: 0.40, min: 1, max: 1 }
        ]
    },
    dead_body: {
        id: 'dead_body',
        name: 'Thi Thể Đặc Nhiệm Tử Trận',
        searchDuration: 2.2,
        capacity: 8,
        meshColor: 0x475569,
        accentColor: 0xef4444,
        promptLabel: '[F] KHÁM XÁC CHIẾN BINH',
        lootTable: [
            { itemId: 'ammo_standard', chance: 0.70, min: 1, max: 2 },
            { itemId: 'medkit_military', chance: 0.50, min: 1, max: 1 },
            { itemId: 'stimpack_adrenaline', chance: 0.35, min: 1, max: 1 },
            { itemId: 'painkiller_morphine', chance: 0.45, min: 1, max: 1 },
            { itemId: 'armor_vest_lvl4', chance: 0.25, min: 1, max: 1 },
            { itemId: 'military_flashdrive', chance: 0.30, min: 1, max: 1 },
            { itemId: 'weapon_shotgun', chance: 0.20, min: 1, max: 1 }
        ]
    },
    airdrop_crate: {
        id: 'airdrop_crate',
        name: 'Hòm Thính Tiếp Tế Chiến Thuật',
        searchDuration: 4.5,
        capacity: 12,
        meshColor: 0xd97706,
        accentColor: 0x06b6d4,
        promptLabel: '[F] MỞ HÒM THÍNH (4.5s)',
        lootTable: [
            { itemId: 'weapon_sniper', chance: 0.65, min: 1, max: 1 },
            { itemId: 'weapon_assault', chance: 0.75, min: 1, max: 1 },
            { itemId: 'armor_vest_lvl6', chance: 0.80, min: 1, max: 1 },
            { itemId: 'ammo_ap', chance: 0.90, min: 2, max: 3 },
            { itemId: 'stimpack_adrenaline', chance: 0.85, min: 1, max: 2 },
            { itemId: 'medkit_military', chance: 0.95, min: 2, max: 3 },
            { itemId: 'gold_bar', chance: 0.70, min: 1, max: 2 },
            { itemId: 'classified_intel', chance: 0.60, min: 1, max: 1 }
        ]
    }
};

// Quản lý Túi đồ của Người chơi (Player Inventory Grid)
export class PlayerInventory {
    constructor(slotsCount = 16) {
        this.slotsCount = slotsCount;
        this.slots = new Array(slotsCount).fill(null);
        this.initDefaultLoadout();
    }

    // Đồ khởi đầu cơ bản của chiến binh
    initDefaultLoadout() {
        this.slots[0] = { itemId: 'ammo_standard', count: 2, revealed: true };
        this.slots[1] = { itemId: 'medkit_military', count: 1, revealed: true };
    }

    // Thêm vật phẩm vào ô trống đầu tiên hoặc gộp stack
    addItem(itemId, count = 1, revealed = true) {
        const itemDef = LOOT_ITEMS[itemId];
        if (!itemDef) return 0;

        let remaining = count;

        // 1. Thử gộp vào các ô có cùng itemId chưa đầy stack
        for (let i = 0; i < this.slotsCount; i++) {
            const slot = this.slots[i];
            if (slot && slot.itemId === itemId && slot.count < itemDef.stackMax) {
                const space = itemDef.stackMax - slot.count;
                const add = Math.min(space, remaining);
                slot.count += add;
                remaining -= add;
                if (remaining <= 0) return count;
            }
        }

        // 2. Cho vào ô trống đầu tiên
        for (let i = 0; i < this.slotsCount; i++) {
            if (!this.slots[i]) {
                const add = Math.min(itemDef.stackMax, remaining);
                this.slots[i] = { itemId, count: add, revealed: true };
                remaining -= add;
                if (remaining <= 0) return count;
            }
        }

        return count - remaining; // Số lượng đã nhặt thành công
    }

    removeItemAt(slotIndex, count = 1) {
        const slot = this.slots[slotIndex];
        if (!slot) return null;
        const removeCount = Math.min(slot.count, count);
        slot.count -= removeCount;
        const res = { itemId: slot.itemId, count: removeCount };
        if (slot.count <= 0) {
            this.slots[slotIndex] = null;
        }
        return res;
    }

    hasFreeSlot() {
        return this.slots.some(s => s === null);
    }
}

// Đối tượng Hòm đồ tương tác trong 3D Scene
export class LootContainer {
    constructor(scene, type, position, options = {}) {
        this.scene = scene;
        this.type = type;
        this.config = CONTAINER_CONFIGS[type] || CONTAINER_CONFIGS.wooden_crate;
        this.name = options.customName || this.config.name;
        this.position = position.clone();
        this.searchDuration = this.config.searchDuration;
        this.capacity = this.config.capacity;
        this.slots = new Array(this.capacity).fill(null);
        this.isSearched = false;
        this.isLooted = false;
        this.isOpen = false;
        this.id = options.id || ('container_' + Math.random().toString(36).substring(2, 9));

        this.mesh = null;
        this.smokeParticles = null;
        this.buildMesh();
        this.generateLoot();
    }

    // Sinh mô hình 3D cho Container dựa trên phân loại
    buildMesh() {
        const group = new THREE.Group();
        group.position.copy(this.position);

        if (this.type === 'wooden_crate') {
            // Hòm gỗ có đai sắt bọc góc
            const boxGeo = new THREE.BoxGeometry(1.2, 0.75, 0.9);
            const boxMat = new THREE.MeshStandardMaterial({
                color: this.config.meshColor,
                roughness: 0.85,
                metalness: 0.1
            });
            const crate = new THREE.Mesh(boxGeo, boxMat);
            crate.castShadow = true;
            crate.receiveShadow = true;
            crate.position.y = 0.38;

            const bandGeo = new THREE.BoxGeometry(1.22, 0.12, 0.92);
            const bandMat = new THREE.MeshStandardMaterial({ color: 0x222222, metalness: 0.7, roughness: 0.4 });
            const band1 = new THREE.Mesh(bandGeo, bandMat);
            band1.position.y = 0.22;
            const band2 = new THREE.Mesh(bandGeo, bandMat);
            band2.position.y = 0.54;

            group.add(crate, band1, band2);
        } else if (this.type === 'military_safe') {
            // Két sắt quân sự bằng kim loại đen bóng viền xanh
            const safeGeo = new THREE.BoxGeometry(0.9, 1.1, 0.85);
            const safeMat = new THREE.MeshStandardMaterial({
                color: this.config.meshColor,
                metalness: 0.85,
                roughness: 0.25
            });
            const safe = new THREE.Mesh(safeGeo, safeMat);
            safe.position.y = 0.55;
            safe.castShadow = true;

            const dialGeo = new THREE.CylinderGeometry(0.12, 0.12, 0.08, 16);
            const dialMat = new THREE.MeshStandardMaterial({ color: 0x00f0ff, emissive: 0x005577, metalness: 0.9 });
            const dial = new THREE.Mesh(dialGeo, dialMat);
            dial.rotation.x = Math.PI / 2;
            dial.position.set(0, 0.65, 0.46);

            group.add(safe, dial);
        } else if (this.type === 'dead_body') {
            // Xác chiến binh tử trận nằm cạnh túi đồ dã chiến
            const bodyGeo = new THREE.CapsuleGeometry(0.3, 1.2, 4, 8);
            const bodyMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.9 });
            const bodyMesh = new THREE.Mesh(bodyGeo, bodyMat);
            bodyMesh.rotation.z = Math.PI / 2;
            bodyMesh.rotation.y = Math.random() * Math.PI;
            bodyMesh.position.y = 0.2;
            bodyMesh.castShadow = true;

            const bagGeo = new THREE.BoxGeometry(0.5, 0.35, 0.4);
            const bagMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.9 });
            const bagMesh = new THREE.Mesh(bagGeo, bagMat);
            bagMesh.position.set(0.45, 0.18, 0.25);

            group.add(bodyMesh, bagMesh);
        } else if (this.type === 'airdrop_crate') {
            // Hòm thính Airdrop có màu cam nổi bật và dải phản quang
            const crateGeo = new THREE.BoxGeometry(1.5, 1.1, 1.5);
            const crateMat = new THREE.MeshStandardMaterial({
                color: this.config.meshColor,
                roughness: 0.65,
                metalness: 0.3
            });
            const crate = new THREE.Mesh(crateGeo, crateMat);
            crate.position.y = 0.55;
            crate.castShadow = true;

            // Đèn hải đăng chớp tín hiệu
            const beaconGeo = new THREE.CylinderGeometry(0.08, 0.1, 0.45, 8);
            const beaconMat = new THREE.MeshBasicMaterial({ color: 0xff0044 });
            const beacon = new THREE.Mesh(beaconGeo, beaconMat);
            beacon.position.set(0, 1.25, 0);

            group.add(crate, beacon);
        }

        // Vòng sáng tương tác dưới sàn
        const ringGeo = new THREE.RingGeometry(1.2, 1.35, 24);
        const ringMat = new THREE.MeshBasicMaterial({
            color: this.config.accentColor,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.4
        });
        const ring = new THREE.Mesh(ringGeo, ringMat);
        ring.rotation.x = -Math.PI / 2;
        ring.position.y = 0.03;
        group.add(ring);
        this.interactRing = ring;

        this.scene.add(group);
        this.mesh = group;
    }

    // Sinh vật phẩm ngẫu nhiên theo bảng Loot Table
    generateLoot() {
        const table = this.config.lootTable || [];
        let slotIdx = 0;

        for (const entry of table) {
            if (slotIdx >= this.capacity) break;
            if (Math.random() <= entry.chance) {
                const count = Math.floor(Math.random() * (entry.max - entry.min + 1)) + entry.min;
                this.slots[slotIdx] = {
                    itemId: entry.itemId,
                    count: count,
                    revealed: false // Mới mở hòm lần đầu sẽ chưa nhận diện
                };
                slotIdx++;
            }
        }

        // Đảm bảo hòm luôn có tối thiểu 1 vật phẩm hữu ích
        if (slotIdx === 0 && table.length > 0) {
            const first = table[0];
            this.slots[0] = { itemId: first.itemId, count: 1, revealed: false };
        }
    }

    // Kiểm tra xem hòm đã bị lấy sạch đồ chưa
    checkEmpty() {
        this.isLooted = this.slots.every(s => s === null);
        if (this.interactRing) {
            this.interactRing.material.opacity = this.isLooted ? 0.1 : 0.45;
        }
        return this.isLooted;
    }

    dispose() {
        if (this.mesh) {
            this.mesh.removeFromParent();
            this.mesh.traverse(c => {
                c.geometry?.dispose();
                c.material?.dispose();
            });
        }
    }
}

// Đối tượng Hòm Thính Rơi Từ Bầu Trời (Airdrop Drop Simulation)
export class AirdropDropEntity {
    constructor(scene, targetPos, lootingSystem) {
        this.scene = scene;
        this.lootingSystem = lootingSystem;
        this.targetPos = targetPos.clone();
        this.currentPos = new THREE.Vector3(targetPos.x, 34, targetPos.z);
        this.fallSpeed = 5.2; // Tốc độ hạ cánh
        this.landed = false;
        this.smokeTimer = 75; // Khói đỏ nghi ngút phụt lên trong 75 giây
        this.group = new THREE.Group();

        // 1. Thùng hàng thính Airdrop
        const boxGeo = new THREE.BoxGeometry(1.6, 1.2, 1.6);
        const boxMat = new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.6 });
        const boxMesh = new THREE.Mesh(boxGeo, boxMat);
        boxMesh.position.y = 0.6;
        boxMesh.castShadow = true;

        // 2. Dù lượn đơn giản (Parachute dome)
        const chuteGeo = new THREE.SphereGeometry(2.4, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.48);
        const chuteMat = new THREE.MeshStandardMaterial({
            color: 0xff4422,
            roughness: 0.8,
            side: THREE.DoubleSide
        });
        const chuteMesh = new THREE.Mesh(chuteGeo, chuteMat);
        chuteMesh.position.y = 3.6;
        this.chuteMesh = chuteMesh;

        // 4 dây dù nối từ dù xuống 4 góc hòm
        const linesGeo = new THREE.BufferGeometry();
        const linePositions = new Float32Array([
            0, 3.5, 0, -0.7, 1.2, -0.7,
            0, 3.5, 0,  0.7, 1.2, -0.7,
            0, 3.5, 0,  0.7, 1.2,  0.7,
            0, 3.5, 0, -0.7, 1.2,  0.7
        ]);
        linesGeo.setAttribute('position', new THREE.BufferAttribute(linePositions, 3));
        const linesMat = new THREE.LineBasicMaterial({ color: 0xffffff });
        const linesMesh = new THREE.LineSegments(linesGeo, linesMat);
        this.linesMesh = linesMesh;

        // 3. Vòng tròn bóng đổ (Shadow Ring) trên mặt đất to dần khi hạ cánh
        const shadowGeo = new THREE.RingGeometry(0.2, 1.6, 24);
        const shadowMat = new THREE.MeshBasicMaterial({
            color: 0x0a0a0a,
            transparent: true,
            opacity: 0.15,
            side: THREE.DoubleSide
        });
        this.shadowMesh = new THREE.Mesh(shadowGeo, shadowMat);
        this.shadowMesh.rotation.x = -Math.PI / 2;
        this.shadowMesh.position.set(targetPos.x, 0.04, targetPos.z);
        this.scene.add(this.shadowMesh);

        this.group.add(boxMesh, chuteMesh, linesMesh);
        this.group.position.copy(this.currentPos);
        this.scene.add(this.group);
    }

    update(delta, particles, enemies) {
        if (!this.landed) {
            // Hạ cánh dần theo trục Y
            this.currentPos.y -= this.fallSpeed * delta;
            this.group.position.copy(this.currentPos);

            // Bóng đổ trên mặt đất nở to và đậm dần khi hòm tiếp cận mặt đất
            const heightRatio = Math.max(0, Math.min(1, (34 - this.currentPos.y) / 34));
            const shadowScale = 0.4 + heightRatio * 0.9;
            this.shadowMesh.scale.set(shadowScale, shadowScale, 1);
            this.shadowMesh.material.opacity = 0.15 + heightRatio * 0.65;

            // Nhẹ nhàng chao liệng dù
            this.chuteMesh.rotation.z = Math.sin(performance.now() * 0.003) * 0.08;

            if (this.currentPos.y <= 0.0) {
                this.landed = true;
                this.currentPos.y = 0;
                this.group.position.y = 0;

                // Ẩn dù và dây dù khi tiếp đất
                this.chuteMesh.visible = false;
                this.linesMesh.visible = false;
                sounds.play('land', { volume: 0.95 });

                // Tạo container Airdrop chính thức
                this.container = this.lootingSystem.spawnContainer('airdrop_crate', this.targetPos);

                // Kích động đàn zombie xung quanh lao tới hòm thính
                this.lootingSystem.alertEnemies(this.targetPos, 26.0);
            }
        } else {
            // Sau khi tiếp đất: Khói hiệu ứng màu đỏ phụt lên liên tục trong 60-90 giây
            if (this.smokeTimer > 0) {
                this.smokeTimer -= delta;
                if (Math.random() < 0.45 && particles) {
                    const smokePos = this.targetPos.clone().add(new THREE.Vector3(
                        (Math.random() - 0.5) * 0.6,
                        1.2 + Math.random() * 0.8,
                        (Math.random() - 0.5) * 0.6
                    ));
                    particles.createImpactSparks(smokePos, new THREE.Vector3(0, 1, 0), 0xff2200, 3);
                }
            }
        }
    }

    dispose() {
        if (this.group) {
            this.group.removeFromParent();
            this.group.traverse(c => {
                c.geometry?.dispose();
                c.material?.dispose();
            });
        }
        if (this.shadowMesh) {
            this.shadowMesh.removeFromParent();
            this.shadowMesh.geometry.dispose();
            this.shadowMesh.material.dispose();
        }
    }
}

// Hệ thống Điều Phối Looting & Airdrop Toàn Diện
export class LootingSystem {
    constructor(scene, particles, player, waveManager, ui) {
        this.scene = scene;
        this.particles = particles;
        this.player = player;
        this.waveManager = waveManager;
        this.ui = ui;

        this.inventory = new PlayerInventory(16);
        this.containers = [];
        this.airdropDrops = [];

        // Trạng thái lục hòm hiện thời
        this.activeContainer = null;
        this.isSearching = false;
        this.searchTimer = 0;
        this.searchDuration = 2.0;

        // Trạng thái nhận diện từng ô (Item Reveal)
        this.revealingSlotIndex = -1;
        this.revealTimer = 0;
        this.revealDuration = 0.5;

        // Chu kỳ Airdrop Event
        this.airdropInterval = 90; // Xuất hiện mỗi 90 giây
        this.airdropCountdown = 60; // Lần đầu tiên rơi ở giây thứ 60
        this.activeAirdropZone = null;

        this.initEventListeners();
    }

    initEventListeners() {
        window.addEventListener('keydown', (e) => {
            // Phím [F] để bắt đầu lục hòm hoặc đóng hòm nếu đang mở
            if (e.code === 'KeyF') {
                if (this.isSearching) {
                    this.cancelSearch();
                } else if (this.activeContainer?.isOpen) {
                    this.closeContainerUI();
                } else {
                    this.tryStartSearch();
                }
            }
            // Phím [Space] để nhặt toàn bộ đồ khi đang mở hòm
            if (e.code === 'Space' && this.activeContainer?.isOpen) {
                e.preventDefault();
                this.lootAll();
            }
            // Phím [Escape] để đóng hòm đồ
            if (e.code === 'Escape' && this.activeContainer?.isOpen) {
                this.closeContainerUI();
            }
        });
    }

    // Sinh hòm đồ mới trong bản đồ
    spawnContainer(type, position, options = {}) {
        const container = new LootContainer(this.scene, type, position, options);
        this.containers.push(container);
        return container;
    }

    // Rải số lượng tối thiểu hòm đồ khi bắt đầu game (tránh làm tràn ngập hòm trên sàn đấu)
    spawnInitialContainers(arena) {
        this.clearAll();
        // Chỉ để duy nhất 1 thùng gỗ quân trang dã chiến ở góc xa để người chơi làm quen
        this.spawnContainer('wooden_crate', new THREE.Vector3(-12, 0, -10));
    }

    // Xử lý rơi hòm đồ khi tiêu diệt quái vật theo các tỷ lệ nhỏ
    handleEnemyKilled(enemy) {
        if (!enemy || !enemy.position) return;

        // Giới hạn số lượng hòm đồ tối đa đồng thời trên sân để giữ map gọn gàng
        const MAX_ACTIVE_CONTAINERS = 6;
        if (this.containers.length >= MAX_ACTIVE_CONTAINERS) return;

        const rand = Math.random();
        let dropType = null;

        // Phân loại tỷ lệ rơi đồ theo từng loại quái vật
        switch (enemy.type) {
            case 'boss':
                // Boss chắc chắn rơi Két sắt quân sự chống đạn chứa đồ giá trị cao
                dropType = 'military_safe';
                break;

            case 'giant':
            case 'tank':
                // Quái đột biến khổng lồ: 16% tỷ lệ rơi
                if (rand < 0.16) {
                    dropType = Math.random() < 0.35 ? 'military_safe' : 'wooden_crate';
                }
                break;

            case 'spitter':
                // Quái phun độc: 7% tỷ lệ rơi
                if (rand < 0.07) {
                    dropType = Math.random() < 0.6 ? 'wooden_crate' : 'dead_body';
                }
                break;

            case 'sprinter':
            case 'walker':
            default:
                // Quái thường: Tỷ lệ rơi nhỏ 3.5%
                if (rand < 0.035) {
                    dropType = Math.random() < 0.75 ? 'wooden_crate' : 'dead_body';
                }
                break;
        }

        if (dropType) {
            // Giữ hòm đồ nằm trong giới hạn di chuyển an toàn của sàn đấu
            const dropX = Math.max(-20, Math.min(20, enemy.position.x));
            const dropZ = Math.max(-20, Math.min(20, enemy.position.z));
            const dropPos = new THREE.Vector3(dropX, 0, dropZ);

            this.spawnContainer(dropType, dropPos);
            sounds.play('land', { volume: 0.45, rate: 1.3 });

            const cfg = CONTAINER_CONFIGS[dropType];
            const containerName = cfg ? cfg.name : 'HÒM ĐỒ';
            this.ui?.showPickupAlert(`CHIẾN LỢI PHẨM: ${containerName.toUpperCase()} ĐÃ RƠI RA!`);
        }
    }

    // Tìm hòm đồ gần người chơi nhất trong bán kính tương tác (2.4m)
    getNearestInteractableContainer() {
        if (!this.player || this.player.isDead) return null;
        let nearest = null;
        let minDist = 2.4;

        for (const c of this.containers) {
            const d = this.player.position.distanceTo(c.position);
            if (d < minDist) {
                minDist = d;
                nearest = c;
            }
        }
        return nearest;
    }

    // Bắt đầu tiến trình lục hòm
    tryStartSearch() {
        const container = this.getNearestInteractableContainer();
        if (!container || this.isSearching || container.isOpen) return false;

        this.activeContainer = container;
        this.isSearching = true;
        this.searchDuration = container.searchDuration;
        this.searchTimer = this.searchDuration;

        // Cơ chế khóa nhân vật: khóa di chuyển và khóa bắn
        this.player.isSearching = true;
        this.player.velocity.set(0, 0, 0);

        // Âm thanh sột soạt lục lọi và kích thích zombie gần đó
        sounds.playSearchSound?.();
        this.alertEnemies(container.position, 8.5);

        // Hiển thị thanh thời gian đếm ngược trên UI
        this.ui?.showSearchProgress(this.searchDuration, container.name);
        return true;
    }

    // Hủy tiến trình lục hòm ngay lập tức khi di chuyển, bấm chuột hoặc dính đòn
    cancelSearch() {
        if (!this.isSearching) return;
        this.isSearching = false;
        this.searchTimer = 0;
        this.player.isSearching = false;
        this.ui?.hideSearchProgress();
        this.ui?.showPickupAlert('ĐÃ HỦY LỤC HÒM (DO DI CHUYỂN HOẶC HÀNH ĐỘNG)');
    }

    // Hoàn tất lục hòm và mở giao diện Dual-Grid
    completeSearch() {
        this.isSearching = false;
        this.player.isSearching = false;
        this.ui?.hideSearchProgress();

        if (!this.activeContainer) return;
        this.activeContainer.isOpen = true;
        sounds.playClearJam(); // Tiếng khóa mở hòm cơ khí

        // Mở giao diện hòm đồ hai bên
        this.ui?.openDualInventory(this.inventory, this.activeContainer, this);
    }

    // Đóng giao diện hòm đồ
    closeContainerUI() {
        if (this.activeContainer) {
            this.activeContainer.isOpen = false;
            // Nếu hòm đã bị vét sạch đồ thì gỡ bỏ khỏi sàn đấu để giữ map gọn gàng
            if (this.activeContainer.checkEmpty()) {
                const idx = this.containers.indexOf(this.activeContainer);
                if (idx !== -1) {
                    this.activeContainer.dispose();
                    this.containers.splice(idx, 1);
                }
            }
            this.activeContainer = null;
        }
        this.revealingSlotIndex = -1;
        this.revealTimer = 0;
        this.ui?.closeDualInventory();
    }

    // Nhận diện từng ô vật phẩm (Item Reveal - 0.5s Search Time mỗi ô)
    startRevealItem(slotIndex) {
        if (!this.activeContainer || slotIndex < 0 || slotIndex >= this.activeContainer.slots.length) return;
        const slot = this.activeContainer.slots[slotIndex];
        if (!slot || slot.revealed) return;

        this.revealingSlotIndex = slotIndex;
        this.revealTimer = this.revealDuration;
        sounds.playSearchSound?.();
        this.ui?.updateRevealingProgress(slotIndex, 0);
    }

    // Chuyển thẳng vật phẩm sang túi bên kia (Shift + Click)
    transferItem(fromSide, slotIndex) {
        if (!this.activeContainer) return;

        if (fromSide === 'container') {
            const slot = this.activeContainer.slots[slotIndex];
            if (!slot || !slot.revealed) return;
            const added = this.inventory.addItem(slot.itemId, slot.count, true);
            if (added > 0) {
                slot.count -= added;
                if (slot.count <= 0) {
                    this.activeContainer.slots[slotIndex] = null;
                }
                sounds.playLootTransferSound?.();
                this.activeContainer.checkEmpty();
                this.ui?.refreshDualInventory();
            } else {
                this.ui?.showPickupAlert('TÚI ĐỒ ĐÃ ĐẦY! KHÔNG THỂ CHUYỂN');
            }
        } else if (fromSide === 'player') {
            const slot = this.inventory.slots[slotIndex];
            if (!slot) return;
            // Tìm ô trống trong hòm
            const emptyIdx = this.activeContainer.slots.findIndex(s => s === null);
            if (emptyIdx !== -1) {
                this.activeContainer.slots[emptyIdx] = { ...slot, revealed: true };
                this.inventory.slots[slotIndex] = null;
                sounds.playLootTransferSound?.();
                this.activeContainer.checkEmpty();
                this.ui?.refreshDualInventory();
            } else {
                this.ui?.showPickupAlert('HÒM ĐỒ ĐÃ CHẬT CHỖ!');
            }
        }
    }

    // Nhặt toàn bộ đồ tương thích (Loot All / Phím Space)
    lootAll() {
        if (!this.activeContainer) return;
        let transferred = 0;

        for (let i = 0; i < this.activeContainer.slots.length; i++) {
            const slot = this.activeContainer.slots[i];
            if (!slot) continue;
            // Nhặt toàn bộ thì tự động mở nhận diện luôn
            slot.revealed = true;
            const added = this.inventory.addItem(slot.itemId, slot.count, true);
            if (added > 0) {
                slot.count -= added;
                transferred += added;
                if (slot.count <= 0) {
                    this.activeContainer.slots[i] = null;
                }
            }
        }

        if (transferred > 0) {
            sounds.playLootTransferSound?.();
            this.activeContainer.checkEmpty();
            this.ui?.refreshDualInventory();
            this.ui?.showPickupAlert(`ĐÃ NHẶT TOÀN BỘ ĐỒ VÀO TÚI`);
        }
    }

    // Sử dụng vật phẩm từ túi đồ
    useItem(slotIndex) {
        const slot = this.inventory.slots[slotIndex];
        if (!slot) return;
        const itemDef = LOOT_ITEMS[slot.itemId];
        if (!itemDef || !itemDef.effect) return;

        const effect = itemDef.effect;
        let used = false;

        if (effect.type === 'heal') {
            this.player.heal(effect.amount);
            used = true;
        } else if (effect.type === 'add_ammo') {
            this.player.weapons.addAmmo(effect.packs);
            used = true;
        } else if (effect.type === 'equip_armor') {
            this.player.maxShield += effect.bonusShield;
            this.player.rechargeShield(this.player.maxShield);
            used = true;
        } else if (effect.type === 'score') {
            if (typeof window.game !== 'undefined') {
                window.game.score += effect.points;
            }
            used = true;
        }

        if (used) {
            sounds.playPickup('health');
            this.inventory.removeItemAt(slotIndex, 1);
            this.ui?.refreshDualInventory();
            this.ui?.showPickupAlert(`ĐÃ SỬ DỤNG: ${itemDef.name}`);
        }
    }

    // Kích hoạt sự kiện Hòm Tiếp Tế Rơi (Airdrop Event)
    triggerAirdropEvent() {
        const px = this.player ? this.player.position.x : 0;
        const pz = this.player ? this.player.position.z : 0;
        const angle = Math.random() * Math.PI * 2;
        const dist = 8 + Math.random() * 10;
        const dropX = Math.max(-20, Math.min(20, px + Math.cos(angle) * dist));
        const dropZ = Math.max(-20, Math.min(20, pz + Math.sin(angle) * dist));
        const targetPos = new THREE.Vector3(dropX, 0, dropZ);

        // 1. Âm thanh máy bay vận tải gầm rú trên bầu trời pan từ loa trái sang phải
        sounds.playAirdropPlaneSound?.();

        // 2. Banner cảnh báo hình ảnh toàn màn hình
        this.ui?.showBanner('CẢNH BÁO: HÒM THÍNH TIẾP TẾ CHIẾN THUẬT ĐANG THẢ DÙ!');

        // 3. Đánh dấu vòng tròn đỏ trên bản đồ Tactical Radar
        this.activeAirdropZone = { x: dropX, z: dropZ, radius: 4.5, time: 40 };

        // 4. Sinh mô phỏng rơi thùng hàng và dù
        const airdropDrop = new AirdropDropEntity(this.scene, targetPos, this);
        this.airdropDrops.push(airdropDrop);
    }

    // Cảnh báo zombie trong bán kính nghe thấy âm thanh
    alertEnemies(position, radius) {
        if (!this.waveManager?.enemies) return;
        for (const enemy of this.waveManager.enemies) {
            if (enemy.isDead) continue;
            if (enemy.position.distanceTo(position) <= radius) {
                // Kích động quái vật hướng về vị trí tiếng ồn
                if (enemy.velocity) {
                    const toNoise = position.clone().sub(enemy.position).normalize();
                    enemy.velocity.addScaledVector(toNoise, 3.5);
                }
            }
        }
    }

    // Cập nhật hệ sinh thái Looting & Airdrop mỗi frame
    update(delta) {
        // 1. Quản lý chu kỳ Airdrop Event
        this.airdropCountdown -= delta;
        if (this.airdropCountdown <= 0) {
            this.airdropCountdown = this.airdropInterval;
            this.triggerAirdropEvent();
        }

        // Cập nhật marker Airdrop trên radar
        if (this.activeAirdropZone) {
            this.activeAirdropZone.time -= delta;
            if (this.activeAirdropZone.time <= 0) {
                this.activeAirdropZone = null;
            }
        }

        // Cập nhật các hòm thính đang rơi
        for (let i = this.airdropDrops.length - 1; i >= 0; i--) {
            const drop = this.airdropDrops[i];
            drop.update(delta, this.particles, this.waveManager?.enemies);
            if (drop.landed && drop.smokeTimer <= 0) {
                drop.dispose();
                this.airdropDrops.splice(i, 1);
            }
        }

        // 2. Kiểm tra tiến trình lục hòm của người chơi
        if (this.isSearching) {
            // Nếu người chơi di chuyển hoặc bấm phím hành động -> Hủy tiến trình
            const isMoving = this.player.keys['KeyW'] || this.player.keys['KeyS'] ||
                             this.player.keys['KeyA'] || this.player.keys['KeyD'] ||
                             this.player.mouseButtons.left || this.player.mouseButtons.right ||
                             this.player.isDodging;

            if (isMoving) {
                this.cancelSearch();
                return;
            }

            this.searchTimer -= delta;
            const progress = 1 - (this.searchTimer / this.searchDuration);
            this.ui?.updateSearchProgress(progress, this.searchTimer);

            if (this.searchTimer <= 0) {
                this.completeSearch();
            }
        }

        // 3. Tiến trình nhận diện từng ô vật phẩm (Item Reveal)
        if (this.revealingSlotIndex !== -1 && this.activeContainer) {
            this.revealTimer -= delta;
            const revProgress = 1 - (this.revealTimer / this.revealDuration);
            this.ui?.updateRevealingProgress(this.revealingSlotIndex, revProgress);

            if (this.revealTimer <= 0) {
                const slot = this.activeContainer.slots[this.revealingSlotIndex];
                if (slot) {
                    slot.revealed = true;
                    sounds.playItemRevealSound?.();
                }
                this.revealingSlotIndex = -1;
                this.ui?.refreshDualInventory();
            }
        }

        // 4. Hiển thị gợi ý tương tác [F] khi tới gần hòm
        const nearest = this.getNearestInteractableContainer();
        if (nearest && !this.isSearching && !nearest.isOpen) {
            this.ui?.showContainerPrompt(nearest.config.promptLabel, nearest.position, this.player.camera);
        } else {
            this.ui?.hideContainerPrompt();
        }
    }

    clearAll() {
        while (this.containers.length) {
            this.containers.pop().dispose();
        }
        while (this.airdropDrops.length) {
            this.airdropDrops.pop().dispose();
        }
        this.activeAirdropZone = null;
        this.closeContainerUI();
    }
}
