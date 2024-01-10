import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';


// OCEAN : 

// Texture
let loader = new THREE.TextureLoader();
const oceanTextureMap = loader.load('./textures/ocean2.jpeg');
oceanTextureMap.wrapS = oceanTextureMap.wrapT = THREE.RepeatWrapping;
oceanTextureMap.repeat.set( 5, 5 );
oceanTextureMap.colorSpace = THREE.SRGBColorSpace;

const oceanTextureDisplacement = loader.load('./textures/ocean3.jpeg');
oceanTextureDisplacement.wrapS = oceanTextureDisplacement.wrapT = THREE.RepeatWrapping;
oceanTextureDisplacement.repeat.set( 5, 5 );

const material = new THREE.MeshPhongMaterial({ 
    color: 0x0044ff, 
    map: oceanTextureMap,
    displacementMap: oceanTextureDisplacement,
    displacementScale: 40,
    specular: 0x111111, // Specular color of the material
    shininess: 100,     // How shiny the material is
    reflectivity: 0.5,  // Reflectivity strength 
});

// Geometry
const worldWidth = 256, worldDepth = 256;
const geometry = new THREE.PlaneGeometry(20000, 20000, worldWidth - 1, worldDepth - 1);
geometry.rotateX(-Math.PI / 2);


const ocean = new THREE.Mesh(geometry, material);

const clock = new THREE.Clock();

// Ocean movement
let waveAmplitude = 45;
let targetAmplitude = waveAmplitude; // New target amplitude
const stepAmplitude = 5; // The step for amplitude changes
const minAmplitude = 10;  // Minimum amplitude
const maxAmplitude = 100; // Maximum amplitude

const waveSettings = {
    getAmplitude: function() {
        return waveAmplitude;
    },
    setTargetAmplitude: function(newTarget) {
        targetAmplitude = newTarget;
    },
    // Add a method to increase target amplitude
    increaseTargetAmplitude: function() {
        this.setTargetAmplitude(Math.min(targetAmplitude + stepAmplitude, maxAmplitude));
    },
    // Add a method to decrease target amplitude
    decreaseTargetAmplitude: function() {
        this.setTargetAmplitude(Math.max(targetAmplitude - stepAmplitude, minAmplitude));
    },
    resetTargetAmplitude: function() {
        this.setTargetAmplitude(minAmplitude);
    }
    //...
};


function updateOcean() {
    if (waveAmplitude < targetAmplitude) {
        waveAmplitude = Math.min(waveAmplitude + 1, targetAmplitude);
    } else if (waveAmplitude > targetAmplitude) {
        waveAmplitude = Math.max(waveAmplitude - 1, targetAmplitude);
    }

    const time = clock.getElapsedTime() * 10;
    const position = geometry.attributes.position;

    for (let i = 0; i < position.count; i++) {
        const y = waveSettings.getAmplitude()  * Math.sin(i / 5 + (time + i) / 7);    // change ? 
        position.setY(i, y);
    }

    position.needsUpdate = true;
}

export { ocean, updateOcean, waveSettings, minAmplitude  };

// BOAT : 

const platformGeometry = new THREE.BoxGeometry(150, 15, 150); 
const platformMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 });
const platform = new THREE.Mesh(platformGeometry, platformMaterial);
platform.position.set(0, 0, 0);

export { platform, clock, platformGeometry };

const boat = new THREE.Group();

// Hull made of multiple cylinders
const cylinderCount = 10; 
const cylinderRadius = 7.5;
const cylinderHeight = 150;
const hullMaterial = new THREE.MeshPhongMaterial({ 
    color: 0x8B4513,
    map: loader.load('./textures/wood.webp'), 
/*  //displacement map on the wood, not working for now
    displacementMap: loader.load('./textures/wood.webp'),
    displacementScale: 1, */
}); 

for (let i = 0; i < cylinderCount; i++) {
    const cylinderGeometry = new THREE.CylinderGeometry(cylinderRadius, cylinderRadius, cylinderHeight, 32);
    const cylinder = new THREE.Mesh(cylinderGeometry, hullMaterial);
    cylinder.rotation.x = Math.PI / 2; 
    cylinder.position.set((i - cylinderCount / 2) * 2 * cylinderRadius, 5, 0);
    boat.add(cylinder);
}


// Mast 
const mastGeometry = new THREE.BoxGeometry(5, 100, 5);
const mastTexture = new THREE.TextureLoader().load('./textures/wood.jpeg');
const mastMaterial = new THREE.MeshPhongMaterial({ 
    color: 0xfffffff,
    map : mastTexture,
}); 
const mast = new THREE.Mesh(mastGeometry, mastMaterial);
mast.position.set(-30, 45, 0); 
boat.add(mast);


// Set the initial position of the boat
boat.position.set(0, 50, 0); 

export { boat };


// MESSAGE : 

// Speech Bubble
function createSpeechBubble() {
    const bubble = new THREE.Group();
/*  // remove for the moment, it's just show the message without bubble
    // Bubble shape (e.g., ellipse)
    const bubbleGeometry = new THREE.SphereGeometry(10, 32, 32); // Adjust size as needed
    const bubbleMaterial = new THREE.MeshPhysicalMaterial( {
        clearcoat: 0.3,
        clearcoatRoughness: 0.25,
        color: 0xffffff,
        envMapIntensity: 1.0,
        ior: 1.25,
        iridescence: 0.8,
        metalness: 0,
        roughness: 0.2,
        thickness: 5.0,
        transmission: 1.0,
    } );

    const bubbleMesh = new THREE.Mesh(bubbleGeometry, bubbleMaterial);
    bubbleMesh.position.set(30, 50, 0);
    bubble.add(bubbleMesh);

    // Tail shape 
    const tailGeometry = new THREE.ConeGeometry(3, 5, 32);
    const tailMesh = new THREE.Mesh(tailGeometry, bubbleMaterial);
    tailMesh.position.set(30, 40, 5); // Adjust position as needed
    tailMesh.rotation.x = -Math.PI / 4; // Rotate to point downwards
    tailMesh.rotation.y = -Math.PI / 5;
    tailMesh.rotation.z = -Math.PI / 2;
    bubble.add(tailMesh); */

    // Text sprite creation
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.width = 524;
    canvas.height = 100;
    const texture = new THREE.CanvasTexture(canvas);
    const spriteMaterial = new THREE.SpriteMaterial({ map: texture });
    const sprite = new THREE.Sprite(spriteMaterial);
    sprite.scale.set(120, 20, 1);
    sprite.position.set(70, 60, 0); 
    sprite.material.depthTest = false;
    sprite.renderOrder = 1;
    bubble.add(sprite);

    // Function to update text
    function updateText(text) {
        context.clearRect(0, 0, canvas.width, canvas.height);
        context.fillStyle = '#000';
        context.font = '48px Arial';
        context.fillText(text, 10, 60, canvas.width - 20, 50);
        texture.needsUpdate = true;
    }

    // Initial text
    updateText('You have the power to control the waves! \n Use the arrow keys to change the wave amplitude.');

    return { bubble, updateText };
}

const { bubble: speechBubble, updateText: updateSpeechBubbleText } = createSpeechBubble();
speechBubble.position.set(0, 100, 0);
speechBubble.visible = true;

export { speechBubble, updateSpeechBubbleText };



