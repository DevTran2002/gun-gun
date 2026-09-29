import * as THREE from 'three';
import * as SkeletonUtils from '../libs/SkeletonUtils.js';
import { CHARACTER_CONFIGS, normalizeCharacter } from './characters.js';

export class RoomLobby {
    constructor(container, loader) {
        this.container = container;
        this.loader = loader;
        this.models = new Map();
        this.members = new Map();
        this.signature = '';
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0xe8a43e);
        this.camera = new THREE.PerspectiveCamera(36, 2, 0.1, 100);
        this.camera.position.set(0, 4.7, 13.5);
        this.camera.lookAt(0, 1, 0);
        this.scene.add(new THREE.HemisphereLight(0xfff7df, 0x735338, 2.8));
        const light = new THREE.DirectionalLight(0xffffff, 3);
        light.position.set(-4, 8, 6);
        this.scene.add(light);
        const floor = new THREE.Mesh(new THREE.PlaneGeometry(100, 100), new THREE.MeshStandardMaterial({ color: 0xf2b84f, roughness: 1 }));
        floor.rotation.x = -Math.PI / 2;
        floor.position.y = -0.08;
        this.scene.add(floor);
        for (let i = 0; i < 4; i++) {
            const base = new THREE.Mesh(new THREE.CylinderGeometry(0.85, 0.95, 0.14, 48), new THREE.MeshStandardMaterial({ color: 0xc78832 }));
            base.position.set((i - 1.5) * 2.7, 0, 0);
            this.scene.add(base);
        }
    }

    load(character) {
        if (!this.models.has(character)) {
            this.models.set(character, new Promise((resolve, reject) => this.loader.load(
                `assets/models/${CHARACTER_CONFIGS[character].modelFile}`, resolve, undefined, reject)));
        }
        return this.models.get(character);
    }

    mount() {
        if (this.renderer) return;
        this.heading = document.createElement('div');
        this.heading.className = 'lobby-heading';
        this.stage = document.createElement('div');
        this.stage.className = 'lobby-stage';
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
        this.renderer.domElement.setAttribute('aria-label', 'Các nhân vật đứng trong sảnh chờ');
        this.labels = document.createElement('div');
        this.labels.className = 'lobby-labels';
        this.stage.append(this.renderer.domElement, this.labels);
        this.container.replaceChildren(this.heading, this.stage);
    }

    update(data) {
        if (!this.container) return;
        this.mount();
        this.container.hidden = false;
        const players = data.players || [];
        const signature = JSON.stringify([data.code, data.host, data.you, players]);
        if (signature === this.signature) return;
        this.signature = signature;
        this.heading.innerHTML = '';
        const textSpan = document.createElement('span');
        textSpan.textContent = `SẢNH CHỜ · ${players.length}/4 NGƯỜI · MÃ ${data.code} `;
        
        const copyCodeBtn = document.createElement('button');
        copyCodeBtn.className = 'btn-toggle';
        copyCodeBtn.style.cssText = 'padding: 4px 10px; font-size: 10px; margin-left: 10px; vertical-align: middle; min-width: auto; height: auto;';
        copyCodeBtn.textContent = 'COPY MÃ';
        copyCodeBtn.onclick = () => {
            navigator.clipboard.writeText(data.code).then(() => {
                copyCodeBtn.textContent = 'ĐÃ COPY';
                setTimeout(() => copyCodeBtn.textContent = 'COPY MÃ', 2000);
            });
        };

        const copyLinkBtn = document.createElement('button');
        copyLinkBtn.className = 'btn-toggle';
        copyLinkBtn.style.cssText = 'padding: 4px 10px; font-size: 10px; margin-left: 6px; vertical-align: middle; min-width: auto; height: auto;';
        copyLinkBtn.textContent = 'COPY LINK';
        copyLinkBtn.onclick = () => {
            const link = window.location.href.split('?')[0] + '?room=' + data.code;
            navigator.clipboard.writeText(link).then(() => {
                copyLinkBtn.textContent = 'ĐÃ COPY';
                setTimeout(() => copyLinkBtn.textContent = 'COPY LINK', 2000);
            });
        };

        this.heading.append(textSpan, copyCodeBtn, copyLinkBtn);
        const ids = new Set(players.map(p => p.id));
        for (const [id, member] of this.members) {
            if (!ids.has(id)) { this.remove(member); this.members.delete(id); }
        }
        this.labels.replaceChildren();
        for (let index = 0; index < 4; index++) {
            const player = players[index];
            const label = document.createElement('div');
            label.className = 'lobby-nameplate';
            this.labels.append(label);
            if (!player) { label.textContent = '+ Chờ đồng đội'; continue; }
            const character = normalizeCharacter(player.character);
            const name = document.createElement('strong');
            name.textContent = player.name + (player.id === data.you ? ' (Bạn)' : '');
            const role = document.createElement('small');
            role.textContent = `${player.id === data.host ? '★ CHỦ PHÒNG' : 'ĐỒNG ĐỘI'} · ${CHARACTER_CONFIGS[character].label}`;
            label.append(name, role);
            let member = this.members.get(player.id);
            if (member?.character !== character) {
                if (member) this.remove(member);
                member = { character, index, model: null, mixer: null };
                this.members.set(player.id, member);
                const pending = member;
                this.load(character).then(gltf => {
                    if (this.members.get(player.id) !== pending) return;
                    const model = SkeletonUtils.clone(gltf.scene);
                    model.scale.setScalar(2.7);
                    model.rotation.y = -0.12;
                    pending.model = model;
                    this.scene.add(model);
                    pending.mixer = new THREE.AnimationMixer(model);
                    const idle = gltf.animations?.find(clip => clip.name === 'idle');
                    if (idle) pending.mixer.clipAction(idle).play();
                    this.position(pending);
                }).catch(() => { if (this.members.get(player.id) === pending) role.textContent = 'Không tải được nhân vật'; });
            }
            member.index = index;
            this.position(member);
        }
    }

    position(member) { member.model?.position.set((member.index - 1.5) * 2.7, 0.1, 0); }
    remove(member) {
        member.mixer?.stopAllAction();
        if (member.model) { member.mixer?.uncacheRoot(member.model); member.model.removeFromParent(); }
    }
    render(delta) {
        if (!this.renderer || !this.stage.clientWidth) return;
        const width = this.stage.clientWidth;
        const height = this.stage.clientHeight;
        if (this.width !== width || this.height !== height) {
            this.width = width; this.height = height;
            this.renderer.setSize(width, height);
            this.camera.aspect = width / height;
            this.camera.position.z = Math.max(13.5, 17 / this.camera.aspect);
            this.camera.lookAt(0, 1, 0);
            this.camera.updateProjectionMatrix();
        }
        for (const member of this.members.values()) member.mixer?.update(delta);
        this.renderer.render(this.scene, this.camera);
    }
}
