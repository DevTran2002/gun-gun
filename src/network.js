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
        this.playerId = '';
        this.seq = 0;
        this.pendingCommands = [];
        this.pollTimer = 0;
        this.error = '';
        
        this.peer = null;
        this.conn = null;
        this.connections = [];
        this.players = [];
    }

    async create(name, character = 'soldier') {
        return new Promise((resolve, reject) => {
            const code = Math.random().toString(36).substring(2, 6).toUpperCase();
            this.peer = new window.Peer('gungun-room-' + code);
            
            this.peer.on('open', (id) => {
                this.active = true;
                this.host = true;
                this.code = code;
                this.playerId = 'host';
                this.epoch = Date.now();
                this.connections = [];
                this.players = [{ id: 'host', name, character }];
                
                this.game.player.setCharacter(character);
                this.game.player.cooperative = true;
                this.game.weapons.onCommand = null;
                this.game.showRoomState({ code, players: this.players, isHost: true });
                resolve({ code, you: 'host' });
            });

            this.peer.on('error', (err) => {
                reject(new Error("Không thể tạo phòng, có thể lỗi mạng: " + err.message));
            });
            
            this.peer.on('connection', (conn) => {
                let pId = 'p' + Math.random().toString(36).substring(2, 8);
                let pName = 'Player';
                let pChar = 'soldier';
                let clientState = { id: pId, conn, input: {}, commands: [], ack: 0 };
                this.connections.push(clientState);
                
                conn.on('data', (data) => {
                    if (data.type === 'join') {
                        pName = data.name;
                        pChar = data.character;
                        this.players.push({ id: pId, name: pName, character: pChar });
                        conn.send({ type: 'accept', you: pId, epoch: this.epoch, players: this.players });
                        this.broadcastRoster();
                    } else if (data.type === 'sync') {
                        clientState.input = data.input;
                        if (data.commands && data.commands.length > 0) {
                            this.applyCommands([{ player: pId, commands: data.commands }]);
                        }
                    }
                });
                
                conn.on('close', () => {
                    this.connections = this.connections.filter(c => c.conn !== conn);
                    this.players = this.players.filter(p => p.id !== pId);
                    this.broadcastRoster();
                });
            });
        });
    }

    broadcastRoster() {
        const data = { type: 'roster', players: this.players };
        for (const c of this.connections) c.conn.send(data);
        this.updateRoster(this.players);
        this.game.showRoomState({ code: this.code, players: this.players, isHost: true });
    }

    async join(code, name, character = 'soldier') {
        return new Promise((resolve, reject) => {
            code = code.toUpperCase();
            this.peer = new window.Peer();
            
            this.peer.on('open', (id) => {
                this.conn = this.peer.connect('gungun-room-' + code);
                
                this.conn.on('open', () => {
                    this.conn.send({ type: 'join', name, character });
                });
                
                this.conn.on('data', (data) => {
                    if (data.type === 'accept') {
                        this.active = true;
                        this.host = false;
                        this.code = code;
                        this.playerId = data.you;
                        this.epoch = data.epoch;
                        
                        this.game.player.setCharacter(character);
                        this.game.player.cooperative = true;
                        this.game.weapons.onCommand = (cmd) => this.sendCommand(cmd);
                        
                        this.updateRoster(data.players || []);
                        this.game.showRoomState({ code, players: data.players, isHost: false });
                        resolve(data);
                    } else if (data.type === 'roster') {
                        this.updateRoster(data.players || []);
                        this.game.showRoomState({ code: this.code, players: data.players, isHost: false });
                    } else if (data.type === 'start') {
                        this.epoch = data.epoch;
                        this.game.startGame(true);
                    } else if (data.type === 'snapshot') {
                        if (data.started && data.epoch !== this.epoch) {
                            this.epoch = data.epoch;
                            this.game.startGame(true);
                        }
                        this.applyInputs(data.inputs || {});
                        this.game.applyCoopSnapshot(data.snapshot, this.playerId);
                        if (data.ack) {
                            this.pendingCommands = this.pendingCommands.filter(c => c.seq > data.ack);
                        }
                    }
                });
                
                this.conn.on('close', () => {
                    this.active = false;
                    this.game.showRoomError('Mất kết nối với Host.');
                });
                
                this.conn.on('error', (err) => reject(new Error("Lỗi kết nối: " + err.message)));
            });
            this.peer.on('error', (err) => reject(new Error("Lỗi mạng PeerJS: " + err.message)));
        });
    }

    async start() {
        if (!this.host) return;
        this.epoch = Date.now();
        this.game.startGame(true);
        this.game.showRoomState({ code: this.code, players: this.players, isHost: true });
        const data = { type: 'start', epoch: this.epoch };
        for (const c of this.connections) c.conn.send(data);
    }

    sendCommand(command) {
        if (!this.active || this.host) return;
        command.seq = ++this.seq;
        this.pendingCommands.push(command);
    }

    update(delta) {
        if (!this.active) return;
        this.pollTimer -= delta;
        if (this.pollTimer > 0) return;
        
        // Polling rate of 33ms (30fps) for syncing
        this.pollTimer = 0.033;
        
        if (this.host) {
            const inputs = {};
            for (const c of this.connections) {
                if (c.input && c.input.position) inputs[c.id] = c.input;
            }
            this.applyInputs(inputs);
            
            const snapshot = this.game.makeCoopSnapshot();
            const started = this.game.state === 'PLAYING';
            for (const c of this.connections) {
                c.conn.send({ type: 'snapshot', inputs, snapshot, started, epoch: this.epoch, ack: c.ack });
            }
        } else {
            if (!this.conn || !this.conn.open) return;
            const local = this.game.player;
            const body = {
                type: 'sync',
                input: { position: local.position.toArray(), aim: local.aimYaw, revive: !!local.reviveRequested, moving: local.velocity.lengthSq() > 0.1 },
                commands: this.pendingCommands.slice(0, 30)
            };
            local.reviveRequested = false;
            this.conn.send(body);
        }
    }

    applyInputs(inputs) {
        for (const [id, input] of Object.entries(inputs)) {
            if (id === this.playerId) continue;
            const player = this.game.getCoopPlayer(id);
            if (!player || !Array.isArray(input?.position)) continue;
            player.position.fromArray(input.position);
            player.aimYaw = input.aim;
            player.moving = !!input.moving;
            if (input.revive) this.game.reviveNearest(player);
        }
    }

    applyCommands(commandsList) {
        for (const item of commandsList) {
            const player = this.game.getCoopPlayer(item.player);
            if (!player) continue;
            const connState = this.connections.find(c => c.id === item.player);
            for (const command of item.commands) {
                if (player.isDead || !player.weapons || command.seq <= (player.lastCommandId || 0)) continue;
                player.lastCommandId = command.seq;
                if (connState) connState.ack = command.seq;
                (player.commandQueue ||= []).push(command);
            }
        }
    }

    processCommands(player) {
        const queue = player.commandQueue || [];
        if (player.isDead) { queue.length = 0; return; }
        while (queue.length) {
            const command = queue[0];
            if (command.type === 'shoot' && (player.weapons.fireCooldown > 0 || player.weapons.isReloading)) break;
            queue.shift();
            if (command.type === 'reload') player.weapons.reload();
            if (command.type === 'switch') player.weapons.switchWeapon(command.slot);
            if (command.type === 'shoot' && Array.isArray(command.target) && command.target.length === 3 && command.target.every(Number.isFinite)) {
                player.weapons.shoot(player.position.clone().add(new THREE.Vector3(0, 1.2, 0)), new THREE.Vector3().fromArray(command.target), !!command.ads, true);
            }
            player.processedSeq = command.seq;
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
        this.active = false;
        if (this.conn) this.conn.close();
        if (this.peer) this.peer.destroy();
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
    let mixer = null;
    let actions = {};
    let action = null;
    let disposed = false;
    let initialized = false;
    const remote = { id, name, characterId: normalizeCharacter(characterId), position: new THREE.Vector3(0, 0, 8), velocity: new THREE.Vector3(), netTarget: null, netVelocity: new THREE.Vector3(), netSampleTime: 0, aimYaw: Math.PI,
        isDead: false, isDowned: false, health: 100, maxHealth: 100, shield: 100, maxShield: 100,
        radius: 0.55, height: 1.6, mesh: group, healthBar,
        updateVisual(delta = 1 / 60) {
            const blend = 1 - Math.exp(-12 * delta);
            let visualTarget = this.position;
            if (this.netTarget && this.netSampleTime) {
                const age = Math.min(0.16, Math.max(0, (performance.now() - this.netSampleTime) / 1000));
                visualTarget = this.netTarget.clone().addScaledVector(this.netVelocity || new THREE.Vector3(), age);
            }
            if (!initialized || group.position.distanceTo(visualTarget) > 12) { group.position.copy(visualTarget); initialized = true; }
            else group.position.lerp(visualTarget, blend);
            const angle = Math.atan2(Math.sin(this.aimYaw - group.rotation.y), Math.cos(this.aimYaw - group.rotation.y));
            group.rotation.y += angle * blend;
            group.visible = !this.isDead || this.isDowned;
            const next = actions[this.moving && !this.isDead ? 'walk' : 'idle'];
            if (next && action !== next) { action?.fadeOut(0.15); next.reset().fadeIn(0.15).play(); action = next; }
            mixer?.update(delta);
            this.weapons?.updateEquippedMesh();
            healthBar.update(group.position, this.health, this.maxHealth, group.visible);
        },
        checkHit(start, end, ray) { const hit = ray.intersectBox(new THREE.Box3(this.position.clone().add(new THREE.Vector3(-.55, 0, -.55)), this.position.clone().add(new THREE.Vector3(.55, 1.6, .55))), new THREE.Vector3()); return hit ? { hit: true, point: hit } : { hit: false }; },
        takeDamage(amount) { this.health -= amount; if (this.health <= 0) { this.health = 0; this.isDead = true; this.isDowned = true; } },
        heal(amount) { this.health = Math.min(this.maxHealth, this.health + amount); },
        rechargeShield(amount) { this.shield = Math.min(this.maxShield, this.shield + amount); },
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
                if (disposed || remote.characterId !== next) return;
                mixer?.stopAllAction();
                if (characterModel) mixer?.uncacheRoot(characterModel);
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
                mixer = new THREE.AnimationMixer(characterModel);
                actions = {}; action = null;
                for (const source of gltf.animations || []) {
                    const clip = source.clone();
                    if (['idle', 'walk'].includes(clip.name)) clip.tracks = clip.tracks.filter(t => !t.name.includes('arm-right'));
                    actions[clip.name] = mixer.clipAction(clip);
                }
                actions['holding-right']?.play();
                const hand = characterModel.getObjectByName('arm-right');
                remote.handNode = hand || null;
                if (hand) remote.weapons?.attachToArm(hand);
            }, undefined, () => { if (loadingCharacter === next) loadingCharacter = null; });
        },
        dispose() { disposed = true; mixer?.stopAllAction(); this.weapons?.clear(); group.removeFromParent(); healthBar.dispose(); }
    };
    remote.setCharacter(characterId);
    return remote;
}
