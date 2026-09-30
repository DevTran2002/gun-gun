import { sounds } from './audio.js?v=4';

export class HomeMenu {
    constructor(game) {
        this.game = game;
        this.dialog = document.getElementById('home-dialog');
        this.titles = { friends: 'CHƠI CÙNG BẠN BÈ', profile: 'HỒ SƠ CỦA BẠN', characters: 'CHỌN NHÂN VẬT', help: 'CÁCH CHƠI', settings: 'CÀI ĐẶT', records: 'KỶ LỤC CỦA BẠN' };
        document.querySelectorAll('[data-open]').forEach(button => button.addEventListener('click', () => this.open(button.dataset.open)));
        this.dialog.querySelector('.close-dialog').addEventListener('click', () => this.dialog.close());
        this.dialog.addEventListener('click', event => { if (event.target === this.dialog) { const r = this.dialog.getBoundingClientRect(); if (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom) this.dialog.close(); } });
        game.roomName.value = localStorage.getItem('arena_player_name') || 'Người chơi';
        document.getElementById('profile-name').textContent = game.roomName.value.toUpperCase();
        document.getElementById('save-profile').addEventListener('click', () => {
            const name = game.roomName.value.trim() || 'Người chơi';
            game.roomName.value = name;
            localStorage.setItem('arena_player_name', name);
            document.getElementById('profile-name').textContent = name.toUpperCase();
            this.dialog.close();
        });
        document.getElementById('home-sound').addEventListener('click', () => { sounds.toggleAudio(); this.syncAudio(); });
        document.getElementById('home-music').addEventListener('click', () => { sounds.toggleMusic(); this.syncAudio(); });
        document.getElementById('copy-link').addEventListener('click', async event => {
            try { await navigator.clipboard.writeText(document.getElementById('share-link').value); event.target.textContent = 'ĐÃ COPY'; setTimeout(() => event.target.textContent = 'COPY', 1800); }
            catch { game.showRoomError('Hãy chọn và sao chép liên kết trong ô phía trên.'); }
        });
        game.roomCode.addEventListener('input', () => { game.roomCode.value = game.roomCode.value.toUpperCase().replace(/[^A-Z0-9]/g, ''); });
        game.roomCode.addEventListener('keydown', event => { if (event.key === 'Enter' && !game.roomJoin.disabled) game.roomJoin.click(); });
        this.preview();
    }
    open(panel) {
        document.getElementById('dialog-title').textContent = this.titles[panel];
        this.dialog.querySelectorAll('[data-panel]').forEach(section => section.hidden = section.dataset.panel !== panel);
        document.getElementById('record-score').textContent = this.game.highScore.toLocaleString();
        this.syncAudio();
        this.dialog.showModal();
    }
    syncAudio() {
        document.getElementById('home-sound').textContent = `ÂM THANH: ${sounds.enabled ? 'BẬT' : 'TẮT'}`;
        document.getElementById('home-music').textContent = `NHẠC: ${sounds.musicEnabled ? 'BẬT' : 'TẮT'}`;
        document.getElementById('toggle-sound').textContent = `SOUND: ${sounds.enabled ? 'ON' : 'OFF'}`;
        document.getElementById('toggle-music').textContent = `MUSIC: ${sounds.musicEnabled ? 'ON' : 'OFF'}`;
    }
    preview() {
        if (!this.game.network.active) this.game.roomLobby.update({ solo: true, code: '', you: 'preview', host: 'preview', players: [{ id: 'preview', name: this.game.roomName.value, character: this.game.characterId }] });
    }
    room(data) {
        const code = data?.code || '';
        const active = !!code;
        document.getElementById('share-room').hidden = !active;
        document.getElementById('share-link-row').hidden = !active;
        this.game.roomCreate.hidden = active;
        document.getElementById('share-code').textContent = code;
        document.getElementById('mode-status').textContent = active ? `TỔ ĐỘI · ${data.players.length} / 4` : 'SẴN SÀNG CHIẾN ĐẤU';
        document.getElementById('guest-wait').hidden = !active || data.host === data.you || !!data.isHost;
        if (active) {
            const url = new URL(location.pathname, location.origin);
            url.searchParams.set('room', code);
            document.getElementById('share-link').value = url.href;
            if (this.qrCode !== code) {
                const qr = document.getElementById('room-qr');
                qr.replaceChildren();
                if (window.QRCode) new window.QRCode(qr, { text: url.href, width: 124, height: 124, colorDark: '#211b2d', correctLevel: window.QRCode.CorrectLevel.M });
                else qr.textContent = 'Dùng liên kết bên dưới';
                this.qrCode = code;
            }
        } else this.preview();
    }
}
