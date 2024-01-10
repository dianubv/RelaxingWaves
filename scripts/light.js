import * as THREE from 'three';

const light = new THREE.DirectionalLight(0xffffff, 1);
light.position.set(0, 1, 0); // Top directional light

export { light };

function createDirectionalLight() {
    return light;
}
