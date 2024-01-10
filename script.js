import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';


import { light } from './scripts/light.js';
import { camera } from './scripts/camera.js';
import { ocean, updateOcean, waveSettings, minAmplitude, 
    clock, boat, 
    speechBubble, updateSpeechBubbleText} from './scripts/shapes.js';

import { GUI } from 'three/addons/libs/lil-gui.module.min.js';


// Setup the scene
const scene = new THREE.Scene();
scene.background = new THREE.Color( 0xaaccff );

const fogColor = 0xaaccff;
const fogDensity = 0.0007;
scene.fog = new THREE.FogExp2(fogColor, fogDensity);

const gui = new GUI();
const fogControls = {
    fogDensity: fogDensity
};

// Add fog density slider to the GUI
gui.add(fogControls, 'fogDensity', 0, 0.002).name('Fog Density').onChange(function (newDensity) {
    scene.fog.density = newDensity;
});

const canvas = document.getElementById('canvas');
const renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    // Antialiasing is used to smooth the edges of what is rendered
    antialias: true,
    // Activate the support of transparency
    alpha: true
});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio( window.devicePixelRatio );

const controls = new OrbitControls(camera, canvas);

// Create AxesHelper (the size can be adjusted as needed)
const axesHelper = new THREE.AxesHelper(500); // 500 is the size of the helper
scene.add(axesHelper);

// Handle the window resize event
window.addEventListener('resize', () => {
    // Update the camera
    camera.aspect =  window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    // Update the renderer
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
});






// Add lights
/* const light = createDirectionalLight(); */
scene.add(light);







// Add shapes
scene.add(ocean);

// Add wave changes
let spaceBarPressTimer;
let decreaseAmplitudeInterval;

const waveControls = {
    amplitude: waveSettings.getAmplitude()
};


// Boat
/* scene.add(platform); */

function getWaveHeightAtPosition(x, z) {
    // Calculate the wave height at position (x, z)
    // This calculation depends on your wave algorithm in `updateOcean`
    // Example:
    const time = clock.getElapsedTime() * 10;
    const waveHeight = waveSettings.getAmplitude() * Math.sin(x / 5 + (time + z) / 7);
    return waveHeight;
}

scene.add(boat);

// Add speech bubble
scene.add(speechBubble);

function updateSpeechBubble() {
    // Update position to follow the boat
    speechBubble.position.copy(boat.position);
    speechBubble.position.y += 20;

    // Update the text based on wave amplitude
    const currentAmplitude = waveSettings.getAmplitude();
    if (currentAmplitude > 75) {
        updateSpeechBubbleText('Owh too many waves! Keep your breathing in tune with the waves \n ');
    } else if (currentAmplitude < 20) {
        updateSpeechBubbleText("It's better, now you're calm :)");
    } else {
        updateSpeechBubbleText('You have the power\nto control the waves! \n Use the space bar to change the wave amplitude.');
    }
}


// Add the robot
function loadRobotModel() {
    const loader = new GLTFLoader();

    loader.load('./RobotExpressive.glb', function(gltf) {
        const robot = gltf.scene;
        robot.scale.set(0.5, 0.5, 0.5); 
        robot.position.set(0, 30, 0); 

        const helper = new THREE.BoxHelper(robot, 0xff0000);
        scene.add(robot);

        // If there are animations, you can access them with gltf.animations
        // Example: createAnimationMixer(robot, gltf.animations);
    }, undefined, function(error) {
        console.error(error);
    });
}
loadRobotModel();

let mixer;

function createAnimationMixer(robot, animations) {
    mixer = new THREE.AnimationMixer(robot);

    const action = mixer.clipAction(animations[0]); 
    action.play();
}




// Setup the camera 
// Add this near the top of your script.js
const cameraSpeed = 1;
let move = {
    up: false,
    down: false,
    left: false,
    right: false
};

function onKeyDown(event) {
    switch(event.code) {
        case 'ArrowUp':
        case 'KeyW':
            move.up = true;
            break;
        case 'ArrowDown':
        case 'KeyS':
            move.down = true;
            break;
        case 'ArrowLeft':
        case 'KeyA':
            move.left = true;
            break;
        case 'ArrowRight':
        case 'KeyD':
            move.right = true;
            break;
    }
    if (event.code === 'Space') {
        waveSettings.increaseTargetAmplitude();

        // Clear existing timer and interval
        clearTimeout(spaceBarPressTimer);
        clearInterval(decreaseAmplitudeInterval);

        // Set a new timer
        spaceBarPressTimer = setTimeout(() => {
            // Start an interval to decrease amplitude every 5 seconds
            decreaseAmplitudeInterval = setInterval(() => {
                waveSettings.decreaseTargetAmplitude();
                if (waveSettings.getAmplitude() <= minAmplitude) {
                    clearInterval(decreaseAmplitudeInterval);
                }
            }, 2000); // 5 seconds interval
        }, 2000); // 5 seconds delay before starting the interval
    }
}

function onKeyUp(event) {
    switch(event.code) {
        case 'ArrowUp':
        case 'KeyW':
            move.up = false;
            break;
        case 'ArrowDown':
        case 'KeyS':
            move.down = false;
            break;
        case 'ArrowLeft':
        case 'KeyA':
            move.left = false;
            break;
        case 'ArrowRight':
        case 'KeyD':
            move.right = false;
            break; 
    }
    if (event.code === 'Space') {
        waveSettings.decreaseTargetAmplitude();
    }
}

window.addEventListener('keydown', onKeyDown);
window.addEventListener('keyup', onKeyUp);


const someOffset = 15;

// Add event listeners
function animate() {
    requestAnimationFrame(animate);
    updateOcean(); // Update ocean based on user input

    // Camera movement
    if(move.up) camera.position.z -= cameraSpeed;
    if(move.down) camera.position.z += cameraSpeed;
    if(move.left) camera.position.x -= cameraSpeed;
    if(move.right) camera.position.x += cameraSpeed;

    // Update the controls
    controls.update();

    const elapsedTime = clock.getElapsedTime() * 10;


    // Inside the animate function
    const waveHeightAtPlatform = getWaveHeightAtPosition(boat.position.x, boat.position.z, elapsedTime);
    boat.position.y = waveHeightAtPlatform + someOffset;

    const deltaX = 500; // Small offset value for x
    const deltaZ = 500; // Small offset value for z
    const waveHeightAtPlatformX = getWaveHeightAtPosition(boat.position.x + deltaX, boat.position.z, elapsedTime);
    const waveHeightAtPlatformZ = getWaveHeightAtPosition(boat.position.x, boat.position.z + deltaZ, elapsedTime);

    // Calculate the angle for rotation
    boat.rotation.x = Math.atan2(waveHeightAtPlatform - waveHeightAtPlatformZ, deltaZ);
    boat.rotation.z = Math.atan2(waveHeightAtPlatform - waveHeightAtPlatformX, deltaX);

    const delta = clock.getDelta();
    if (mixer) {
        mixer.update(delta);
    }

    updateSpeechBubble();

    // Render the scene
    renderer.render(scene, camera);
}



animate();
