import assert from 'node:assert/strict';
import { registerHooks } from 'node:module';
import { test } from 'node:test';
registerHooks({ resolve(s,c,next) { return s==='three' ? {url:new URL('../libs/three.module.js',import.meta.url).href,shortCircuit:true}:next(s,c); } });
const THREE=await import('three');
const {Arena}=await import('../src/arena.js');
const {HealthBar3D}=await import('../src/healthbar.js');
const {Zombie}=await import('../src/enemies.js');
const V=(x,z)=>new THREE.Vector3(x,0,z);
function fixture() { const a=new Arena(new THREE.Scene(),null); a.colliders.push(new THREE.Box3(new THREE.Vector3(-1,0,-1),new THREE.Vector3(1,3,1)));return a; }
test('circular bodies clear an open corner; movement slides without tunneling and recovers overlap',()=>{
 const a=fixture();assert.equal(a.checkCollision(V(1.4,1.4),.5),false);
 const p=V(-3,0);a.moveCharacter(p,8,0,.55);assert.ok(p.x < -1.5);assert.equal(a.checkCollision(p,.55),false);
 a.moveCharacter(p,1,3,.55);assert.ok(p.z>2.9);
 const embedded=V(0,0);a.moveCharacter(embedded,0,0,.55);assert.equal(a.checkCollision(embedded,.55),false);
});
test('navigation routes around a solid pillar with body clearance at different radii',()=>{
 for(const radius of [.55,.9,1.4]) { const a=fixture(),start=V(0,-5),end=V(0,5);const path=a.findNavigationPath(start,end,radius);assert.ok(path.length>=3);let previous=start;for(const p of path){assert.ok(a.navigationClear(previous,p,radius));previous=p;}assert.ok(previous.distanceTo(end)<.01); }
});
test('zombie actually reaches a target on the other side of a pillar without switching sides',()=>{
 const a=fixture();const z=new Zombie(a.scene,'walker',V(0,-5),{'character-zombie':{scene:new THREE.Group(),animations:[]}}, {createImpactSparks(){}},1);const p={position:V(0,5),isDead:false,takeDamage(){}};
 for(let i=0;i<700;i++){z.update(1/60,p,a,[z]);assert.equal(a.checkCollision(z.position,z.radius),false);}
 assert.ok(z.position.distanceTo(p.position)<2,`remaining distance ${z.position.distanceTo(p.position)}`);
});
test('health fill shares the transparent queue, renders last and faces the camera',()=>{
 const bar=new HealthBar3D(new THREE.Scene());bar.update(V(0,0),25,100);assert.equal(bar.fill.scale.x,.25);
 const background=bar.group.children[0];assert.equal(background.material.transparent,bar.fill.material.transparent);assert.ok(bar.fill.renderOrder>background.renderOrder);
 const camera=new THREE.PerspectiveCamera();camera.position.set(0,15,10);camera.lookAt(0,0,0);background.onBeforeRender(null,null,camera);assert.ok(bar.group.quaternion.angleTo(camera.quaternion)<1e-6);
 bar.update(V(0,0),-20,100);assert.equal(bar.fill.scale.x,0);bar.dispose();
});
