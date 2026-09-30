const { chromium } = require('playwright');
const { createServer } = require('node:http');
const fs = require('node:fs/promises');
const path = require('node:path');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '..');
(async () => {
 const server = createServer(async (req,res) => {
  const url = new URL(req.url,'http://localhost');
  const file = path.resolve(root,'.'+(url.pathname==='/'?'/index.html':decodeURIComponent(url.pathname)));
  if (!file.startsWith(root+path.sep)) return res.writeHead(403).end();
  try { const data=await fs.readFile(file); res.writeHead(200,{'Content-Type':({'.js':'application/javascript','.html':'text/html','.css':'text/css','.glb':'model/gltf-binary','.png':'image/png'})[path.extname(file)]||'application/octet-stream'});res.end(data); } catch {res.writeHead(404).end();}
 });
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 let browser;
 try {
 browser=await chromium.launch({channel:'chrome',headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 const page=await browser.newPage({viewport:{width:1440,height:900}});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(`http://127.0.0.1:${server.address().port}`);
 await page.waitForFunction(()=>window.game?.state==='MENU' && window.game.roomLobby.members.get('preview')?.model);
 await fs.mkdir(path.join(__dirname,'artifacts'),{recursive:true});
 await page.screenshot({path:path.join(__dirname,'artifacts','home-desktop.png')});
 await page.locator('[data-open="characters"]').click();
 await page.locator('[data-character="vampire"]').click();
 await page.waitForFunction(()=>window.game.roomLobby.members.get('preview')?.character==='vampire' && window.game.roomLobby.members.get('preview')?.model);
 await page.keyboard.press('Escape');
 await page.locator('[data-open="profile"]').click();
 await page.locator('#room-name').fill('Chiến binh');await page.locator('#save-profile').click();
 assert.equal(await page.locator('#profile-name').textContent(),'CHIẾN BINH');
 await page.locator('[data-open="settings"]').click();await page.locator('#home-sound').click();assert.match(await page.locator('#home-sound').textContent(),/TẮT/);await page.keyboard.press('Escape');
 await page.locator('[data-open="friends"]').first().click();
 assert.equal(await page.locator('#room-create').isVisible(),true);
 // Render the connected-room UI without depending on the external PeerJS service.
 await page.evaluate(()=>window.game.showRoomState({code:'AB12',you:'a',host:'a',players:[{id:'a',name:'Chiến binh',character:'vampire'}]}));
 await page.waitForFunction(()=>document.querySelector('#room-qr canvas'));
 assert.match(await page.locator('#share-link').inputValue(),/room=AB12/);
 await page.screenshot({path:path.join(__dirname,'artifacts','home-friends.png')});
 await page.keyboard.press('Escape');
 await page.evaluate(()=>window.game.resetRoomUI());
 await page.setViewportSize({width:390,height:844});
 await page.screenshot({path:path.join(__dirname,'artifacts','home-mobile.png')});
 assert.equal(await page.locator('#btn-start').isVisible(),true);
 await page.locator('[data-open="friends"]').first().click();
 await page.screenshot({path:path.join(__dirname,'artifacts','home-mobile-dialog.png')});
 await page.keyboard.press('Escape');
 await page.locator('#btn-start').click();
 await page.waitForFunction(()=>window.game.state==='PLAYING');
 assert.equal(await page.locator('#screen-menu').isVisible(),false);
 assert.deepEqual(errors,[]);
 console.log('PASS: desktop/mobile lobby, character preview, profile, settings, invite QR/link, leave, start game; no browser exceptions.');
 } finally {if(browser) await browser.close();await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e);process.exitCode=1;});
