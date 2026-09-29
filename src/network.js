import * as THREE from 'three';
import * as SkeletonUtils from '../libs/SkeletonUtils.js';
import { HealthBar3D } from './healthbar.js';
import { CHARACTER_CONFIGS, normalizeCharacter } from './characters.js';

export class NetworkRoom {
    constructor(game) {
        this.game = game;
        this.active = false;
        this.host = false;
        this.code = '';
        this.token = '';
        this.playerId = '';
        this.seq = 0;
        this.ack = 0;
        this.pollTimer = 0;
        this.error = '';
        this.remote = new Map();
    }

    async request(action, payload = {}) {
        const response = await fetch(`/api/rooms/${action}`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const contentType = response.headers.get('content-type') || '';
        const raw = await response.text();
        let data = null;
        if (contentType.includes('application/json')) {
            try { data = JSON.parse(raw); } catch { data = null; }
        }
        if (!response.ok) {
            if (response.status === 501 || response.status === 405 || !data) {
                throw new Error('Cổng này đang chạy server cũ. Hãy mở terminal mới, chạy “$env:PORT=8091; py server.py”, rồi mở lại http://localhost:8091.');
            }
            throw new Error(data.error || 'Không thể kết nối phòng.');
        }
        if (!data) {
            throw new Error('Máy chủ phòng LAN trả về dữ liệu không hợp lệ. Hãy chạy “$env:PORT=8091; py server.py” rồi mở lại http://localhost:8091.');
        }
        return data;
    }

    async create(name, character = 'soldier') {
        const data = await this.request('create', { name, character });
        this.accept(data, true);
        return data;
    }

    async join(code, name, character = 'soldier') {
        const data = await this.request('join', { code: code.toUpperCase(), name, character });
        this.accept(data, false);
        return data;
    }

    accept(data, host) {
        this.active = true;
        this.host = host;
        this.code = data.code;
        this.token = data.token;
        this.playerId = data.you;
        this.epoch = data.epoch;
        this.game.player.setCharacter(data.character || this.game.characterId);
        this.game.player.cooperative = true;
        this.game.weapons.onCommand = host ? null : (command) => this.sendCommand(command);
        this.game.showRoomState(data);
    }

    async start() {
        const data = await this.request('start', this.auth());
        this.epoch = data.epoch;
        this.game.startGame(true);
        this.game.showRoomState(data);
    }

    auth() { return { code: this.code, token: this.token, epoch: this.epoch }; }

    sendCommand(command) {
        if (!this.active || this.host) return;
        command.seq = ++this.seq;
        this.pendingCommand = command;
    }

    update(delta) {
        if (!this.active) return;
        this.pollTimer -= delta;
        if (this.pollTimer > 0) return;
        this.pollTimer = 0.12;
        this.sync().catch(error => { this.error = error.message; this.game.showRoomError(this.error); });
    }

    async sync() {
        const local = this.game.player;
        const body = {
            ...this.auth(),
            input: { position: local.position.toArray(), aim: local.aimYaw, revive: !!local.reviveRequested,
                moving: local.velocity.lengthSq() > 0.1 },
            ack: this.ack
        };
        local.reviveRequested = false;
        if (this.host) body.snapshot = this.game.makeCoopSnapshot();
        else if (this.pendingCommand) {
            body.commands = [this.pendingCommand];
            this.pendingCommand = null;
        }
        const data = await this.request('sync', body);
        if (this.host) {
            this.applyInputs(data.inputs || {});
            this.ack = data.commands?.at(-1)?.id || this.ack;
            this.applyCommands(data.commands || []);
        } else if (data.started && this.game.state !== 'PLAYING') {
            this.game.startGame(true);
            if (data.snapshot) this.game.applyCoopSnapshot(data.snapshot, this.playerId);
        } else if (data.snapshot) {
            this.game.applyCoopSnapshot(data.snapshot, this.playerId);
        }
        this.updateRoster(data.players || []);
    }

    applyInputs(inputs) {
        for (const [id, input] of Object.entries(inputs)) {
            if (id === this.playerId) continue;
            const player = this.game.getCoopPlayer(id);
            if (!player || !input) continue;
            player.position.fromArray(input.position);
            player.aimYaw = input.aim;
            if (input.revive) this.game.reviveNearest(player);
        }
    }

    applyCommands(commands) {
        for (const item of commands) {
            const player = this.game.getCoopPlayer(item.player);
            const command = item.command || {};
            if (!player || !command) continue;
            if (command.type === 'reload') this.game.weapons.reload();
            if (command.type === 'switch') this.game.weapons.switchWeapon(command.slot);
            if (command.type === 'shoot' && Array.isArray(command.target)) {
                const origin = player.position.clone().add(new THREE.Vector3(0, 1.2, 0));
                this.game.weapons.shoot(origin, new THREE.Vector3().fromArray(command.target), !!command.ads, true);
            }
        }
    }

    updateRoster(players) {
        const ids = new Set(players.map(p => p.id));
        for (const player of players) {
            if (player.id !== this.playerId) this.game.ensureCoopPlayer(player.id, player.name, player.character);
        }
        for (const [id] of this.game.remotePlayers) {
            if (!ids.has(id)) this.game.removeCoopPlayer(id);
        }
    }

    leave() {
        if (!this.active) return;
        fetch('/api/rooms/leave', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(this.auth()) }).catch(() => {});
        this.active = false;
    }
}

export function makeRemotePlayer(scene, loader, id, name, characterId = 'soldier') {
    const group = new THREE.Group();
    const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.35, 0.8, 4, 8), new THREE.MeshStandardMaterial({ color: 0x44aaff, emissive: 0x113355 }));
    const marker = new THREE.Mesh(new THREE.RingGeometry(0.45, 0.53, 24), new THREE.MeshBasicMaterial({ color: 0x44ddff, side: THREE.DoubleSide }));
    marker.rotation.x = -Math.PI / 2;
    marker.position.y = -0.48;
    group.add(body, marker);
    scene.add(group);
    const healthBar = new HealthBar3D(scene, { width: 1.25, offsetY: 2.15, color: 0x44ddff });
    let characterModel = null;
    let loadingCharacter = null;
    const remote = { id, name, characterId: normalizeCharacter(characterId), position: new THREE.Vector3(0, 0, 8), velocity: new THREE.Vector3(), aimYaw: Math.PI,
        isDead: false, isDowned: false, health: 100, maxHealth: 100, shield: 100, maxShield: 100,
        radius: 0.55, height: 1.6, mesh: group, healthBar,
        updateVisual() { group.position.copy(this.position); group.visible = !this.isDead; healthBar.update(this.position, this.health, this.maxHealth, true); },
        checkHit(start, end, ray) { const hit = ray.intersectBox(new THREE.Box3(this.position.clone().add(new THREE.Vector3(-.55, 0, -.55)), this.position.clone().add(new THREE.Vector3(.55, 1.6, .55))), new THREE.Vector3()); return hit ? { hit: true, point: hit } : { hit: false }; },
        takeDamage(amount) { this.health -= amount; if (this.health <= 0) { this.health = 0; this.isDead = true; this.isDowned = true; } },
        revive() { if (!this.isDowned) return false; this.health = 60; this.isDowned = false; this.isDead = false; return true; },
        setCharacter(nextCharacter) {
            const next = normalizeCharacter(nextCharacter);
            if (next === this.characterId && (characterModel || loadingCharacter === next)) return;
            this.characterId = next;
            if (!loader) return;
            const config = CHARACTER_CONFIGS[next];
            loadingCharacter = next;
            loader.load(`assets/models/${config.modelFile}`, gltf => {
                loadingCharacter = null;
                if (remote.characterId !== next) return;
                characterModel?.removeFromParent();
                characterModel = SkeletonUtils.clone(gltf.scene);
                characterModel.scale.set(1.7, 1.7, 1.7);
                characterModel.traverse(child => {
                    if (!child.isMesh) return;
                    child.castShadow = true;
                    child.receiveShadow = true;
                });
                body.visible = false;
                group.add(characterModel);
            }, undefined, () => { if (loadingCharacter === next) loadingCharacter = null; });
        },
        dispose() { group.removeFromParent(); healthBar.dispose(); characterModel?.traverse(child => child.isMesh && child.material?.dispose()); }
    };
    remote.setCharacter(characterId);
    return remote;
}
