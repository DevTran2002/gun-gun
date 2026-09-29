import * as THREE from 'three';

/** A small world-space health bar that stays above a character's head. */
export class HealthBar3D {
    constructor(scene, { width = 1.25, offsetY = 2.2, color = 0x35e58a } = {}) {
        this.width = width;
        this.offsetY = offsetY;
        this.group = new THREE.Group();
        this.group.renderOrder = 100;

        const background = new THREE.Mesh(
            new THREE.BoxGeometry(width + 0.08, 0.085, 0.075),
            new THREE.MeshBasicMaterial({ color: 0x101722, transparent: true, opacity: 0.92, depthTest: false, depthWrite: false })
        );
        this.fill = new THREE.Mesh(
            new THREE.BoxGeometry(width, 0.06, 0.085),
            new THREE.MeshBasicMaterial({ color, depthTest: false, depthWrite: false })
        );
        this.fill.position.z = 0.006;
        this.group.add(background, this.fill);
        scene.add(this.group);
        this.update(new THREE.Vector3(), 1, 1, false);
    }

    update(position, health, maxHealth, visible = true) {
        this.group.position.set(position.x, position.y + this.offsetY, position.z);
        const ratio = Math.max(0, Math.min(1, Number(health) / Math.max(1, Number(maxHealth))));
        this.fill.scale.x = ratio;
        this.fill.position.x = -this.width * (1 - ratio) * 0.5;
        this.group.visible = visible;
    }

    dispose() {
        this.group.removeFromParent();
        this.group.traverse(child => {
            child.geometry?.dispose();
            child.material?.dispose();
        });
    }
}
