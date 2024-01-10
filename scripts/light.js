import * as THREE from 'three';

const light = new THREE.DirectionalLight(0xffffff, 1);
light.position.set(0, 10, 0); 

export { light };

const ambientLight = new THREE.HemisphereLight(0xffffff, 0x000080, 1); 




export { ambientLight };

