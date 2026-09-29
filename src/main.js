import * as THREE from 'three';
import { GLTFLoader } from '../libs/loaders/GLTFLoader.js';
import { sounds } from './audio.js';
import { ParticleSystem } from './particles.js';
import { Arena } from './arena.js';
import { WeaponSystem } from './weapons.js';
import { PlayerController } from './player.js';
import { WaveManager, Zombie } from './enemies.js';
import { PickupManager } from './pickups.js';
import { UIManager } from './ui.js';
import { NetworkRoom, makeRemotePlayer } from './network.js';
import { normalizeCharacter } from './characters.js';
import { RoomLobby } from './lobby.js';

class CyberArenaGame {
    constructor() {
        this.canvas = document.getElementById('game-canvas');
        this.state = 'LOADING'; // LOADING, MENU, PLAYING, PAUSED, GAMEOVER

        this.score = 0;
        this.highScore = parseInt(localStorage.getItem('cyber_arena_highscore') || '0', 10);
        this.currentWave = 1; // Infinite Phase counter
        this.characterId = normalizeCharacter(localStorage.getItem('cyber_arena_character') || 'soldier');
        this.nextWaveTimer = 0;
        this.clock = new THREE.Clock();
        this.network = new NetworkRoom(this);
        this.remotePlayers = new Map();
        this.remoteProjectiles = new Map();
        this.practiceBot = null;

        this.initThree();
        this.initSubsystems();
        this.initDOM();
        this.loadAssetsAndStart();
    }

    initThree() {
        // Scene
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x0c1017);
        this.scene.fog = new THREE.FogExp2(0x0c1017, 0.014);

        // Camera
        this.viewHeight = 18;
        const aspect = window.innerWidth / window.innerHeight;
        this.camera = new THREE.OrthographicCamera(-this.viewHeight * aspect / 2, this.viewHeight * aspect / 2,
            this.viewHeight / 2, -this.viewHeight / 2, 0.1, 300);

        // High-Performance WebGL Renderer
        this.renderer = new THREE.WebGLRenderer({
            canvas: this.canvas,
            antialias: true,
            powerPreference: 'high-performance'
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.15;

        // Resize handler
        window.addEventListener('resize', () => {
            const aspect = window.innerWidth / window.innerHeight;
            this.camera.left = -this.viewHeight * aspect / 2;
            this.camera.right = this.viewHeight * aspect / 2;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(window.innerWidth, window.innerHeight);
        });

        // GLTF Loader
        this.gltfLoader = new GLTFLoader();
    }

    initSubsystems() {
        this.particles = new ParticleSystem(this.scene);
        this.arena = new Arena(this.scene, this.gltfLoader);
        this.weapons = new WeaponSystem(this.scene, this.gltfLoader, this.particles);
        this.player = new PlayerController(this.camera, this.canvas, this.arena, this.weapons, true, this.characterId);
        this.waveManager = new WaveManager(this.scene, this.gltfLoader, this.weapons, this.particles, this.arena);
        this.pickups = new PickupManager(this.scene, this.particles);
        this.ui = new UIManager();
        this.coopPlayers = [this.player];
    }

    initDOM() {
        this.screenLoading = document.getElementById('screen-loading');
        this.screenMenu = document.getElementById('screen-menu');
        this.screenPause = document.getElementById('screen-pause');
        this.screenGameOver = document.getElementById('screen-gameover');
        this.hud = document.getElementById('hud');

        this.btnStart = document.getElementById('btn-start');
        this.btnResume = document.getElementById('btn-resume');
        this.btnRestartPause = document.getElementById('btn-restart-pause');
        this.btnRestartOver = document.getElementById('btn-restart-gameover');
        this.roomName = document.getElementById('room-name');
        this.roomLobby = new RoomLobby(document.getElementById('room-lobby'), this.gltfLoader);
        this.roomCode = document.getElementById('room-code');
        this.roomCopy = document.getElementById('room-copy');
        this.roomStatus = document.getElementById('room-status');
        this.roomStart = document.getElementById('room-start');
        this.roomCreate = document.getElementById('room-create');
        this.roomJoin = document.getElementById('room-join');
        this.characterOptions = [...document.querySelectorAll('[data-character]')];
        this.characterOptions.forEach(option => option.addEventListener('click', () => this.selectCharacter(option.dataset.character)));
        this.updateCharacterSelection();
        this.roomCreate?.addEventListener('click', () => this.createRoom());
        this.roomJoin?.addEventListener('click', () => this.joinRoom());
        this.roomCopy?.addEventListener('click', () => this.copyRoomCode());
        this.roomStart?.addEventListener('click', () => this.network.start().catch(e => this.showRoomError(e.message)));

        this.finalScoreEl = document.getElementById('final-score');
        this.finalWaveEl = document.getElementById('final-wave');
        this.highScoreMenuEl = document.getElementById('menu-highscore');
        this.highScoreOverEl = document.getElementById('gameover-highscore');

        if (this.highScoreMenuEl) {
            this.highScoreMenuEl.textContent = this.highScore.toLocaleString();
        }

        // Button listeners
        if (this.btnStart) {
            this.btnStart.addEventListener('click', () => this.startGame());
        }
        if (this.btnResume) {
            this.btnResume.addEventListener('click', () => this.resumeGame());
        }
        if (this.btnRestartPause) {
            this.btnRestartPause.addEventListener('click', () => this.restartGame());
        }
        if (this.btnRestartOver) {
            this.btnRestartOver.addEventListener('click', () => this.restartGame());
        }
        this.btnToggleBot = document.getElementById('btn-toggle-bot');
        if (this.btnToggleBot) {
            this.btnToggleBot.addEventListener('click', () => this.togglePracticeBot());
        }

        // Pause Key (ESC)
        window.addEventListener('keydown', (e) => {
            if (e.code === 'Escape') {
                if (this.state === 'PLAYING') {
                    this.pauseGame();
                } else if (this.state === 'PAUSED') {
                    this.resumeGame();
                }
            }
        });

        window.addEventListener('blur', () => {
            if (this.state === 'PLAYING') this.pauseGame();
        });

        // Sound toggles in pause menu
        const soundBtn = document.getElementById('toggle-sound');
        if (soundBtn) {
            soundBtn.addEventListener('click', () => {
                const on = sounds.toggleAudio();
                soundBtn.textContent = on ? 'SOUND: ON' : 'SOUND: OFF';
            });
        }
        const musicBtn = document.getElementById('toggle-music');
        if (musicBtn) {
            musicBtn.addEventListener('click', () => {
                const on = sounds.toggleMusic();
                musicBtn.textContent = on ? 'MUSIC: ON' : 'MUSIC: OFF';
            });
        }
    }

    async loadAssetsAndStart() {
        const loadingProgress = document.getElementById('loading-bar-fill');
        const loadingText = document.getElementById('loading-status-text');

        const updateLoading = (pct, text) => {
            if (loadingProgress) loadingProgress.style.width = `${pct}%`;
            if (loadingText) loadingText.textContent = text;
        };

        updateLoading(15, 'Loading Arena Modules & Portals...');
        await this.arena.loadModels();

        updateLoading(40, 'Building Arena & Portals...');
        this.arena.buildArena();

        updateLoading(65, 'Loading Weapon Systems...');
        await this.weapons.init();

        updateLoading(80, 'Loading Cyber Soldier...');
        await this.player.loadModel(this.gltfLoader, this.scene);

        updateLoading(95, 'Loading Kenney Zombies & Mutants...');
        await this.waveManager.init();

        updateLoading(100, 'System Initialized');
        setTimeout(() => {
            if (this.screenLoading) this.screenLoading.style.display = 'none';
            if (this.screenMenu) this.screenMenu.style.display = 'flex';
            this.state = 'MENU';
        }, 300);

        // Start animation loop
        this.animate();
    }

    startGame(fromRoom = false) {
        sounds.init();
        sounds.startMusic();

        this.state = 'PLAYING';
        if (this.screenMenu) this.screenMenu.style.display = 'none';
        if (this.screenPause) this.screenPause.style.display = 'none';
        if (this.screenGameOver) this.screenGameOver.style.display = 'none';
        if (this.hud) this.hud.style.display = 'block';

        this.score = 0;
        this.currentWave = 1;
        this.nextWaveTimer = 0;
        this.weapons.resetRun();
        for (const remote of this.remotePlayers.values()) {
            remote.weapons.resetRun(); remote.health = remote.maxHealth; remote.shield = remote.maxShield;
            remote.isDead = false; remote.isDowned = false; remote.commandQueue = [];
        }
        this.player.reset();
        this.pickups.clear();
        this.particles.clear();
        this.waveManager.clear();

        this.player.setInputEnabled(true);
        this.player.cooperative = this.network.active;
        if (!this.network.active || this.network.host) this.waveManager.startWave(this.currentWave);
        else this.waveManager.clear();
        this.ui.showBanner(`PHASE 1: ZOMBIE INVASION BEGINS`);
    }

    pauseGame() {
        if (this.network.active) return;
        this.state = 'PAUSED';
        this.player.setInputEnabled(false);
        this.ui.clearTeammateIndicators();
        if (this.screenPause) this.screenPause.style.display = 'flex';
    }

    resumeGame() {
        this.state = 'PLAYING';
        if (this.screenPause) this.screenPause.style.display = 'none';
        this.player.setInputEnabled(true);
    }

    restartGame() {
        this.startGame();
    }

    gameOver() {
        this.state = 'GAMEOVER';
        this.player.setInputEnabled(false);
        this.ui.clearTeammateIndicators();

        if (this.score > this.highScore) {
            this.highScore = this.score;
            localStorage.setItem('cyber_arena_highscore', this.highScore.toString());
        }

        if (this.finalScoreEl) this.finalScoreEl.textContent = this.score.toLocaleString();
        if (this.finalWaveEl) this.finalWaveEl.textContent = this.currentWave.toString();
        if (this.highScoreOverEl) this.highScoreOverEl.textContent = this.highScore.toLocaleString();

        setTimeout(() => {
            if (this.hud) this.hud.style.display = 'none';
            if (this.screenGameOver) this.screenGameOver.style.display = 'flex';
        }, 1200);
    }

    onHitEnemy(damage, isCrit, hitPoint) {
        this.ui.triggerHitmarker(isCrit);
        this.ui.showDamageNumber(damage, isCrit, hitPoint, this.camera);
    }

    onEnemyKilled(enemy) {
        this.score += enemy.scoreValue;
        this.pickups.spawnDrop(enemy.position, enemy.type);

        if (enemy.type === 'boss') {
            this.ui.showBanner('MUTANT OVERLORD DESTROYED!');
        }
    }

    async createRoom() {
        try { const data = await this.network.create(this.roomName?.value || 'Chủ phòng', this.characterId); this.showRoomState(data); }
        catch (error) { this.showRoomError(error.message); }
    }

    async joinRoom() {
        try { const data = await this.network.join(this.roomCode?.value || '', this.roomName?.value || 'Đồng đội', this.characterId); this.showRoomState(data); }
        catch (error) { this.showRoomError(error.message); }
    }

    selectCharacter(characterId) {
        this.characterId = normalizeCharacter(characterId);
        localStorage.setItem('cyber_arena_character', this.characterId);
        this.updateCharacterSelection();
        this.player.setCharacter(this.characterId);
    }

    updateCharacterSelection() {
        this.characterOptions?.forEach(option => {
            const selected = option.dataset.character === this.characterId;
            option.classList.toggle('selected', selected);
            option.setAttribute('aria-pressed', selected ? 'true' : 'false');
        });
    }

    showRoomError(message) { if (this.roomStatus) this.roomStatus.textContent = message; }

    copyRoomCode() {
        if (this.roomCode && this.roomCode.value) {
            navigator.clipboard.writeText(this.roomCode.value).then(() => {
                if (this.roomCopy) {
                    const oldText = this.roomCopy.textContent;
                    this.roomCopy.textContent = 'ĐÃ COPY';
                    setTimeout(() => { this.roomCopy.textContent = oldText; }, 2000);
                }
            }).catch(() => {
                this.showRoomError('Không thể copy mã phòng.');
            });
        }
    }

    showRoomState(data) {
        this.roomLobby?.update(data);
        this.screenMenu?.classList.add('party-menu');
        if (!this.roomStatus) return;
        const names = (data.players || []).map(player => player.name).join(', ');
        this.roomStatus.textContent = `PHÒNG ${data.code}: ${names}${data.host === data.you ? ' • Bấm BẮT ĐẦU PHÒNG' : ' • Chờ chủ phòng'}`;
        if (this.roomCode) this.roomCode.value = data.code;
        if (this.roomCopy) this.roomCopy.style.display = 'inline-block';
        if (this.roomStart) this.roomStart.style.display = data.host === data.you ? 'inline-block' : 'none';
        if (this.roomStart) this.roomStart.disabled = (data.players || []).length < 2 || data.started;
        this.characterOptions?.forEach(option => { option.disabled = !!data.started; });
        if (this.roomCreate) this.roomCreate.disabled = true;
        if (this.roomJoin) this.roomJoin.disabled = true;
        if (this.btnStart) this.btnStart.style.display = 'none';
    }

    ensureCoopPlayer(id, name, character = 'soldier') {
        if (id === this.network.playerId) return this.player;
        if (this.remotePlayers.has(id)) {
            const remote = this.remotePlayers.get(id);
            remote.name = name || remote.name;
            remote.setCharacter?.(character);
            return remote;
        }
        const remote = makeRemotePlayer(this.scene, this.gltfLoader, id, name, character);
        remote.weapons = new WeaponSystem(this.scene, this.gltfLoader, this.particles);
        remote.weapons.models = this.weapons.models;
        remote.weapons.resetRun();
        // The character GLTF can finish loading before the WeaponSystem is
        // attached to the remote object. Re-attach here so remote players do
        // not appear empty-handed after the race.
        if (remote.handNode) remote.weapons.attachToArm(remote.handNode);
        this.remotePlayers.set(id, remote);
        this.coopPlayers.push(remote);
        return remote;
    }

    getCoopPlayer(id) { return id === this.network.playerId ? this.player : this.remotePlayers.get(id); }

    removeCoopPlayer(id) {
        const remote = this.remotePlayers.get(id);
        if (!remote) return;
        remote.dispose();
        this.remotePlayers.delete(id);
        this.coopPlayers = this.coopPlayers.filter(player => player !== remote);
    }

    reviveTeammate(teammate, reviver = this.player) {
        if (!teammate?.isDowned || teammate === reviver || teammate.position.distanceTo(reviver.position) > 2.4) return false;
        const revived = teammate.revive();
        if (revived) this.ui.showPickupAlert(`ĐÃ HỒI SINH ${teammate.name || 'ĐỒNG ĐỘI'}`);
        return revived;
    }

    reviveNearest(reviver) {
        const teammate = this.coopPlayers.find(player => player !== reviver && player.isDowned && player.position.distanceTo(reviver.position) <= 2.4);
        return this.reviveTeammate(teammate, reviver);
    }

    // Bật hoặc tắt đồng đội bot phục vụ thử nghiệm và chơi đơn
    togglePracticeBot() {
        if (this.practiceBot) {
            this.removeCoopPlayer(this.practiceBot.id);
            this.practiceBot = null;
            this.ui.showPickupAlert('ĐÃ HỦY ĐỒNG ĐỘI AI');
            if (this.btnToggleBot) this.btnToggleBot.textContent = 'ĐỒNG ĐỘI BOT: BẬT (PHÍM B)';
            return;
        }

        const botId = 'bot_practice';
        const bot = this.ensureCoopPlayer(botId, 'Chiến binh AI', 'soldier');
        bot.isBot = true;
        bot.botShootCooldown = 0;
        // Đặt vị trí ban đầu ngoài tầm nhìn màn hình (15m) để quan sát định vị rìa màn hình
        bot.position.copy(this.player.position).add(new THREE.Vector3(15, 0, 15));
        this.practiceBot = bot;
        this.ui.showPickupAlert('ĐÃ GỌI ĐỒNG ĐỘI AI (PHÍM B ĐỂ BẬT/TẮT)');
        if (this.btnToggleBot) this.btnToggleBot.textContent = 'ĐỒNG ĐỘI BOT: TẮT (PHÍM B)';
    }

    // Cập nhật hành vi cho đồng đội bot (di chuyển, ngắm bắn quái)
    updatePracticeBot(delta) {
        const bot = this.practiceBot;
        if (!bot || bot.isDead) return;

        if (bot.isDowned) {
            bot.moving = false;
            return;
        }

        bot.botShootCooldown = Math.max(0, (bot.botShootCooldown || 0) - delta);

        // Vector và khoảng cách tới người chơi
        const toPlayer = this.player.position.clone().sub(bot.position);
        toPlayer.y = 0;
        const distToPlayer = toPlayer.length();

        // Di chuyển theo người chơi nếu khoảng cách quá xa (> 26m)
        if (distToPlayer > 26) {
            toPlayer.normalize();
            bot.position.addScaledVector(toPlayer, 5.2 * delta);
            bot.aimYaw = Math.atan2(toPlayer.x, toPlayer.z);
            bot.moving = true;
        } else {
            bot.moving = false;
        }

        // Tìm kiếm quái gần nhất để bắn hỗ trợ
        let nearestEnemy = null;
        let minDist = 15;
        for (const enemy of this.waveManager.enemies) {
            if (enemy.isDead) continue;
            const d = enemy.position.distanceTo(bot.position);
            if (d < minDist) {
                minDist = d;
                nearestEnemy = enemy;
            }
        }

        if (nearestEnemy) {
            const toEnemy = nearestEnemy.position.clone().sub(bot.position);
            bot.aimYaw = Math.atan2(toEnemy.x, toEnemy.z);
            if (bot.botShootCooldown <= 0) {
                bot.botShootCooldown = 0.85;
                const shootOrigin = bot.position.clone().add(new THREE.Vector3(0, 1.2, 0));
                const shootTarget = nearestEnemy.position.clone().add(new THREE.Vector3(0, 0.8, 0));
                bot.weapons.shoot(shootOrigin, shootTarget, false, true);
            }
        }
    }

    makeCoopSnapshot() {
        return { state: this.state, wave: this.currentWave, score: this.score,
            projectiles: this.coopPlayers.flatMap(player => (player.weapons?.projectiles || []).filter(p => p.mesh).map(p => ({ id: `${player.id || this.network.playerId}:${p.id}`, owner: player.id || this.network.playerId, position: p.mesh.position.toArray(), direction: p.direction.toArray(), speed: p.speed, color: p.color }))),
            players: this.coopPlayers.map(player => ({ id: player.id || this.network.playerId, name: player.name || 'Bạn', character: player.characterId || this.characterId, position: player.position.toArray(), health: player.health, shield: player.shield, isDead: player.isDead, isDowned: player.isDowned, aim: player.aimYaw, moving: player === this.player ? player.velocity.lengthSq() > 0.1 : player.moving, weapons: player.weapons?.getNetworkState(), processedSeq: player.processedSeq || 0 })),
            enemies: this.waveManager.enemies.filter(enemy => !enemy.isDead).map(enemy => ({ id: enemy.id, type: enemy.type, position: enemy.position.toArray(), health: enemy.health, maxHealth: enemy.maxHealth })),
            pickups: this.pickups.pickups.map(pickup => ({ id: pickup.id, type: pickup.type, position: pickup.mesh.position.toArray(), weaponSlot: pickup.weaponSlot, life: pickup.life })) };
    }

    applyCoopSnapshot(snapshot, localId) {
        const sampleTime = performance.now();
        const projectileIds = new Set();
        for (const state of snapshot.projectiles || []) {
            if (state.owner === localId) continue;
            projectileIds.add(state.id);
            let projectile = this.remoteProjectiles.get(state.id);
            if (!projectile) {
                const mesh = new THREE.Mesh(this.weapons.bulletGeo, new THREE.MeshBasicMaterial({ color: state.color }));
                this.scene.add(mesh);
                projectile = { mesh, direction: new THREE.Vector3() };
                this.remoteProjectiles.set(state.id, projectile);
            }
            projectile.mesh.position.fromArray(state.position);
            projectile.direction.fromArray(state.direction);
            projectile.mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), projectile.direction);
            projectile.speed = state.speed;
        }
        for (const [id, projectile] of this.remoteProjectiles) {
            if (!projectileIds.has(id)) { projectile.mesh.removeFromParent(); projectile.mesh.material.dispose(); this.remoteProjectiles.delete(id); }
        }
        this.currentWave = snapshot.wave ?? this.currentWave;
        this.score = snapshot.score ?? this.score;
        for (const state of snapshot.players || []) {
            if (state.id === localId) {
                this.player.health = state.health; this.player.shield = state.shield;
                this.player.isDead = state.isDead; this.player.isDowned = state.isDowned;
                if (state.processedSeq >= this.network.seq) this.weapons.applyNetworkState(state.weapons);
                continue;
            }
            const remote = this.ensureCoopPlayer(state.id, state.name, state.character);
            const nextPosition = new THREE.Vector3().fromArray(state.position);
            if (remote.netTarget) {
                const elapsed = Math.max(0.02, (sampleTime - (remote.netSampleTime || sampleTime)) / 1000);
                remote.netVelocity.copy(nextPosition).sub(remote.netTarget).divideScalar(elapsed);
                remote.netVelocity.y = 0;
            }
            remote.netTarget = nextPosition;
            remote.netSampleTime = sampleTime;
            remote.position.copy(nextPosition); remote.health = state.health; remote.shield = state.shield;
            remote.isDead = state.isDead; remote.isDowned = state.isDowned;
            remote.aimYaw = state.aim; remote.moving = !!state.moving;
            remote.weapons.applyNetworkState(state.weapons);
        }
        const byId = new Map(this.waveManager.enemies.map(enemy => [enemy.id, enemy]));
        const snapshotEnemyIds = new Set((snapshot.enemies || []).map(enemy => enemy.id));
        for (const state of snapshot.enemies || []) {
            let enemy = byId.get(state.id);
            if (!enemy) {
                enemy = new Zombie(this.scene, state.type, new THREE.Vector3().fromArray(state.position), this.waveManager.models, this.particles, this.currentWave, this.weapons);
                enemy.id = state.id;
                this.waveManager.enemies.push(enemy);
            }
            const nextPosition = new THREE.Vector3().fromArray(state.position);
            if (enemy.netTarget) {
                const elapsed = Math.max(0.05, (sampleTime - (enemy.netSampleTime || sampleTime)) / 1000);
                enemy.netVelocity = enemy.netVelocity || new THREE.Vector3();
                enemy.netVelocity.copy(nextPosition).sub(enemy.netTarget).divideScalar(elapsed);
                enemy.netVelocity.y = 0;
            } else enemy.netVelocity = new THREE.Vector3();
            enemy.netTarget = nextPosition;
            enemy.netSampleTime = sampleTime;
            enemy.position.copy(nextPosition); enemy.health = state.health;
        }
        for (let i = this.waveManager.enemies.length - 1; i >= 0; i--) {
            if (!snapshotEnemyIds.has(this.waveManager.enemies[i].id)) {
                this.waveManager.enemies[i].disposeVisuals();
                this.waveManager.enemies.splice(i, 1);
            }
        }
        const pickupIds = new Set((snapshot.pickups || []).map(pickup => pickup.id));
        for (const state of snapshot.pickups || []) {
            let pickup = this.pickups.pickups.find(candidate => candidate.id === state.id);
            if (!pickup) pickup = this.pickups.createPickup(new THREE.Vector3().fromArray(state.position), state.type, { id: state.id, weaponSlot: state.weaponSlot });
            if (pickup) { pickup.life = state.life; pickup.mesh.position.fromArray(state.position); }
        }
        for (let i = this.pickups.pickups.length - 1; i >= 0; i--) {
            if (!pickupIds.has(this.pickups.pickups[i].id)) this.pickups.remove(i);
        }
    }

    onPickupCollected(text, type) {
        this.ui.showPickupAlert(text);
    }

    animate() {
        requestAnimationFrame(() => this.animate());

        const delta = Math.min(this.clock.getDelta(), 0.05);
        // Room polling continues while a teammate waits in the lobby.
        this.network.update(delta);

        if (this.state === 'PLAYING') {
            // Update arena portals and grass ambience.
            this.arena.update(delta);
            if (this.nextWaveTimer > 0) {
                this.nextWaveTimer -= delta;
                if (this.nextWaveTimer <= 0) {
                    this.waveManager.startWave(this.currentWave);
                    const message = this.currentWave % 5 === 0 ? 'WARNING: MUTANT OVERLORD DETECTED!'
                        : this.currentWave === 2 ? 'PHASE 2: TỐC HÀNH & PHUN AXIT'
                        : this.currentWave === 3 ? 'PHASE 3: ZOMBIE KHỔNG LỒ XUẤT HIỆN'
                        : `PHASE ${this.currentWave}: HORDE INCOMING`;
                    this.ui.showBanner(message);
                }
            }

            // Update Player
            this.player.update(delta, this.arena, this.waveManager.enemies);
            if (this.player.reviveRequested) {
                const downed = this.coopPlayers.find(player => player !== this.player && player.isDowned);
                this.reviveTeammate(downed, this.player);
                this.player.reviveRequested = false;
            }
            if (this.player.toggleBotRequested) {
                this.togglePracticeBot();
                this.player.toggleBotRequested = false;
            }
            if (this.practiceBot) {
                this.updatePracticeBot(delta);
            }
            for (const player of this.remotePlayers.values()) player.updateVisual(delta);
            // Player Damage Flash / Game Over check
            if (this.player.isDead && (!this.network.active || this.coopPlayers.every(player => player.isDead)) && this.state !== 'GAMEOVER') {
                this.gameOver();
            }

            // Update Weapons & Projectiles
            if (!this.network.active || this.network.host) {
                this.weapons.update(delta, this.arena, this.waveManager.enemies, this.coopPlayers,
                    (dmg, crit, pt) => this.onHitEnemy(dmg, crit, pt));
                for (const remote of this.remotePlayers.values()) {
                    this.network.processCommands(remote);
                    remote.weapons.update(delta, this.arena, this.waveManager.enemies, this.coopPlayers);
                }
            } else {
                // Client prediction: animate shots and tick cooldowns without applying damage.
                this.weapons.update(delta, this.arena, [], []);
                for (const projectile of this.remoteProjectiles.values()) projectile.mesh.position.addScaledVector(projectile.direction, projectile.speed * delta);
                for (const enemy of this.waveManager.enemies) {
                    if (enemy.netTarget && enemy.mesh) {
                        const age = Math.min(0.16, Math.max(0, (performance.now() - enemy.netSampleTime) / 1000));
                        const visualTarget = enemy.netTarget.clone().addScaledVector(enemy.netVelocity || new THREE.Vector3(), age);
                        enemy.mesh.position.lerp(visualTarget, 1 - Math.exp(-18 * delta));
                    } else enemy.mesh?.position.lerp(enemy.position, 1 - Math.exp(-18 * delta));
                    enemy.mixer?.update(delta);
                    enemy.healthBar?.update(enemy.mesh?.position || enemy.position, enemy.health, enemy.maxHealth, !enemy.isDead);
                }
            }

            // Update Infinite Phases & Zombies
            const waveFinished = (!this.network.active || this.network.host) && this.waveManager.update(
                delta, this.coopPlayers, this.arena, (enemy) => this.onEnemyKilled(enemy));

            if (waveFinished) {
                this.currentWave++;
                this.score += 300 * this.currentWave;
                sounds.play('land', { volume: 0.8 });
                this.ui.showBanner(`PHASE CLEARED! PREPARE FOR PHASE ${this.currentWave}`);

                this.nextWaveTimer = 3.2;
            }

            // Update Pickups
            this.pickups.update(delta, this.coopPlayers, (txt, type) => this.onPickupCollected(txt, type), !this.network.active || this.network.host);

            // Update Particles
            this.particles.update(delta);

            // Update UI & Radar with 4 Portals and Teammate Off-Screen Indicators
            const teammates = Array.from(this.remotePlayers.values());
            this.ui.updateStats(this.player, this.waveManager, this.score);
            this.ui.updateTeammateIndicators(teammates, this.player, this.camera);
            this.ui.updateTeamRoster(teammates, this.player);
            this.ui.drawRadar(this.player, this.waveManager.enemies, this.pickups.pickups, this.arena.getPortals(), teammates);
        } else if (this.state === 'MENU' || this.state === 'LOADING') {
            this.player.updateCamera(delta);
            this.particles.update(delta);
        }

        // Render 3D Scene
        if (this.state === 'MENU') this.roomLobby?.render(delta);
        this.renderer.render(this.scene, this.camera);
    }
}

// Instantiate game on page load
window.addEventListener('DOMContentLoaded', () => {
    window.game = new CyberArenaGame();
});
