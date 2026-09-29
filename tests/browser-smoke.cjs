// Requires Playwright and an installed Chrome. Run: node tests/browser-smoke.cjs
const { chromium } = require('playwright');
const { createServer } = require('node:http');
const fs = require('node:fs/promises');
const path = require('node:path');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '..');

(async () => {
    const server = createServer(async (req, res) => {
        const target = path.resolve(root, '.' + decodeURIComponent(new URL(req.url, 'http://localhost').pathname === '/'
            ? '/index.html' : new URL(req.url, 'http://localhost').pathname));
        if (!target.startsWith(root + path.sep)) { res.writeHead(403).end(); return; }
        try {
            let body = await fs.readFile(target);
            // Expose the instance in this test server only; production has no test hooks.
            if (target.endsWith(path.join('src', 'main.js'))) body = body.toString().replace('new CyberArenaGame();', 'window.__game = new CyberArenaGame();');
            const mime = { '.js': 'application/javascript', '.html': 'text/html', '.css': 'text/css', '.glb': 'model/gltf-binary', '.ogg': 'audio/ogg', '.png': 'image/png' };
            res.writeHead(200, { 'Content-Type': mime[path.extname(target)] || 'application/octet-stream' });
            res.end(body);
        } catch { res.writeHead(404).end(); }
    });
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
    let browser;
    try {
        browser = await chromium.launch({ channel: 'chrome', headless: true, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
        const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
        const errors = [];
        page.on('pageerror', error => errors.push(error.message));
        await page.goto(`http://127.0.0.1:${server.address().port}`);
        await page.waitForFunction(() => window.__game?.state === 'MENU', { timeout: 30000 });
        const artifacts = path.join(__dirname, 'artifacts');
        await fs.mkdir(artifacts, { recursive: true });
        await page.screenshot({ path: path.join(artifacts, 'mutations-menu.png') });
        await page.locator('#btn-start').click();
        await page.waitForFunction(() => window.__game.state === 'PLAYING');
        const result = await page.evaluate(async () => {
            const game = window.__game;
            const THREE = await import('/libs/three.module.js');
            const { Zombie } = await import('/src/enemies.js');
            game.state = 'PAUSED';
            game.player.setInputEnabled(false);
            game.waveManager.clear();
            game.player.reset(new THREE.Vector3(0, 0, 12));
            game.player.model.position.copy(game.player.position);
            game.player.mixer.update(0.1);
            for (const [type, x, z] of [['giant', -4, 8], ['sprinter', 0, 6], ['spitter', 4, 8]]) {
                const enemy = new Zombie(game.scene, type, new THREE.Vector3(x, 0, z), game.waveManager.models, game.particles, 3, game.weapons);
                enemy.mesh.rotation.y = 0;
                enemy.mixer?.update(0.1);
                game.waveManager.enemies.push(enemy);
            }
            ['damage', 'rapid', 'multishot', 'weapon'].forEach((type, i) => game.pickups.createPickup(new THREE.Vector3(-5.25 + i * 3.5, 0, 15), type));
            game.player.updateCamera(1);
            game.ui.updateStats(game.player, game.waveManager, 1200);
            game.ui.drawRadar(game.player, game.waveManager.enemies, game.pickups.pickups, game.arena.portals);
            game.ui.showBanner('ĐỘT BIẾN MỚI • NÂNG CẤP VŨ KHÍ', 10000);
            game.renderer.render(game.scene, game.camera);
            return { models: Object.keys(game.waveManager.models), enemies: game.waveManager.enemies.length, pickups: game.pickups.pickups.length };
        });
        assert.equal(result.enemies, 3);
        assert.equal(result.pickups, 4);
        assert.equal(result.models.length, 3);
        await page.screenshot({ path: path.join(artifacts, 'mutations-loot.png') });
        const stats = await page.evaluate(() => {
            const game = window.__game;
            for (const pickup of [...game.pickups.pickups]) game.pickups.collect(pickup, game.player);
            game.ui.updateStats(game.player, game.waveManager, 1200);
            game.player.updateCamera(1);
            game.renderer.render(game.scene, game.camera);
            return { height: game.camera.position.y, name: game.weapons.getCurrentWeapon().name, beams: game.weapons.beamCount, damage: game.weapons.damageBoost, text: document.querySelector('#upgrade-stats').textContent };
        });
        assert.ok(stats.height >= 0.25 - 1e-8);
        assert.equal(stats.beams, 3);
        assert.equal(stats.damage, 1.2);
        assert.match(stats.text, /3 TIA/);
        await page.screenshot({ path: path.join(artifacts, 'overhead-upgrades.png') });
        await page.evaluate(() => {
            const game = window.__game;
            game.restartGame();
        });
        const reset = await page.evaluate(() => ({ beams: window.__game.weapons.beamCount, weapon: window.__game.weapons.getCurrentWeapon().id }));
        assert.equal(reset.beams, 1);
        assert.equal(reset.weapon, 'blaster');
        const before = await page.evaluate(() => {
            const game = window.__game;
            game.waveManager.clear();
            return { rotation: game.camera.quaternion.toArray(), position: game.player.position.toArray() };
        });
        await page.mouse.move(1100, 400);
        await page.mouse.down();
        await page.waitForFunction(() => window.__game.weapons.ammo.blaster < 16);
        await page.mouse.up();
        await page.mouse.move(300, 300);
        await page.mouse.down({ button: 'right' });
        await page.keyboard.down('KeyW');
        await page.waitForFunction(z => window.__game.player.position.z < z - 0.5, before.position[2]);
        await page.keyboard.up('KeyW');
        await page.mouse.up({ button: 'right' });
        const controls = await page.evaluate(() => ({
            rotation: window.__game.camera.quaternion.toArray(), position: window.__game.player.position.toArray(),
            pointerLocked: !!document.pointerLockElement, crosshairX: document.querySelector('#crosshair').style.left
        }));
        assert.ok(controls.rotation.every((n, i) => Math.abs(n - before.rotation[i]) < 1e-8));
        assert.ok(Math.abs(controls.position[0] - before.position[0]) < 0.01);
        assert.equal(controls.pointerLocked, false);
        assert.equal(controls.crosshairX, '300px');
        await page.keyboard.press('Escape');
        assert.equal(await page.evaluate(() => window.__game.player.inputEnabled), false);
        await page.setViewportSize({ width: 1100, height: 700 });
        await page.waitForFunction(() => Math.abs((window.__game.camera.right - window.__game.camera.left)
            / (window.__game.camera.top - window.__game.camera.bottom) - window.innerWidth / window.innerHeight) < 1e-8);
        const aspect = await page.evaluate(() => (window.__game.camera.right - window.__game.camera.left) / (window.__game.camera.top - window.__game.camera.bottom));
        assert.ok(Math.abs(aspect - 1100 / 700) < 1e-8);
        assert.deepEqual(errors, []);
        console.log(JSON.stringify({ result, stats, reset, controls, errors, artifacts }, null, 2));
    } finally {
        if (browser) await browser.close();
        await new Promise(resolve => server.close(resolve));
    }
})().catch(error => { console.error(error); process.exitCode = 1; });
