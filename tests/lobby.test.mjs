import assert from 'node:assert/strict';
import { registerHooks } from 'node:module';
import { test } from 'node:test';
registerHooks({ resolve(specifier, context, next) {
    return specifier === 'three' ? { url: new URL('../libs/three.module.js', import.meta.url).href, shortCircuit: true } : next(specifier, context);
} });
const { RoomLobby } = await import('../src/lobby.js');
const THREE = await import('three');

class Element {
    children = [];
    style = { setProperty() {} };
    append(...children) { this.children.push(...children); }
    replaceChildren(...children) { this.children = children; }
}

test('lobby displays matching portraits, host and self labels, then removes departed members', async () => {
    globalThis.document = { createElement: () => new Element() };
    try {
        const container = new Element();
        const lobby = new RoomLobby(container, null);
        lobby.mount = () => { lobby.heading ??= new Element(); lobby.labels ??= new Element(); };
        lobby.load = async character => ({ scene: Object.assign(new THREE.Group(), { name: character }), animations: [] });
        const data = { code: 'ABC123', host: 'a', you: 'b', players: [
            { id: 'a', name: 'Host', character: 'soldier' },
            { id: 'b', name: '<b>Guest</b>', character: 'vampire' }
        ] };
        lobby.update(data);
        await Promise.resolve();
        const cards = lobby.labels.children;
        assert.equal(cards.length, 4);
        assert.match(cards[0].children[1].textContent, /CHỦ PHÒNG/);
        assert.equal(cards[1].children[0].textContent, '<b>Guest</b> (Bạn)');
        assert.equal(lobby.members.get('b').model.name, 'vampire');
        assert.equal(lobby.members.get('b').model.parent, lobby.scene);
        assert.equal(cards[2].textContent, '+ Chờ đồng đội');
        lobby.update(data);
        assert.equal(lobby.labels.children, cards, 'unchanged polling preserves models and labels');
        data.players[1].character = 'skeleton';
        lobby.update(data);
        await Promise.resolve();
        assert.equal(lobby.members.get('b').model.name, 'skeleton');
        const departed = lobby.members.get('b').model;
        data.players.pop();
        lobby.update(data);
        assert.equal(lobby.labels.children[1].textContent, '+ Chờ đồng đội');
        assert.equal(departed.parent, null);
    } finally { delete globalThis.document; }
});
