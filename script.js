import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';


import { light, ambientLight } from './scripts/light.js';
import { camera } from './scripts/camera.js';
import { ocean, updateOcean, waveSettings, minAmplitude, 
    clock, boat,
    speechBubble, updateSpeechBubbleText} from './scripts/shapes.js';

// import { GUI } from 'three/addons/libs/lil-gui.module.min.js';


// Setup the scene 
const scene = new THREE.Scene();
scene.background = new THREE.Color( 0xaaccff );

const fogColor = 0xaaccff;
const fogDensity = 0.0017;
scene.fog = new THREE.FogExp2(fogColor, fogDensity);

/* 
// GUI (for developping) 
const gui = new GUI();
const fogControls = {
    fogDensity: fogDensity
};

// Add fog density slider to the GUI
gui.add(fogControls, 'fogDensity', 0, 0.002).name('Fog Density').onChange(function (newDensity) {
    scene.fog.density = newDensity;
});
 */

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
/* 
// AxesHelper (for debugging) 
const axesHelper = new THREE.AxesHelper(500); // 500 is the size of the helper
scene.add(axesHelper);
 */

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

scene.add(light);

scene.add(ambientLight);


// Add shapes 
scene.add(ocean);

// Add wave changes 
let spaceBarPressTimer;
let decreaseAmplitudeInterval;

const waveControls = {
    amplitude: waveSettings.getAmplitude()
};


// Add boat 

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
        updateSpeechBubbleText('Owhh too many waves! Keep your breathing in tune with the waves \n ');
        setRobotExpression("Surprised");
        ambientLight.intensity = 0;
    } else if (currentAmplitude < 20) {
        updateSpeechBubbleText("It's better, now you're calm :)");
        setRobotExpression("Normal");
        ambientLight.intensity = 1;
    } else if (currentAmplitude < 45) {
        updateSpeechBubbleText("You have too many power ! You can also control my emotions with the 'e' key \n and my action with the 'a' key");
        setRobotExpression("Angry");
        ambientLight.intensity = 0.5;
    } else {
        updateSpeechBubbleText('You have the power to control the waves! \n Use the space bar to change the wave amplitude.');
        ambientLight.intensity = 0.3;
    }
}


// Add Robot 

let robot;
let face;
let animation = {};

function loadRobotModel() {
    const loaderGLTF = new GLTFLoader();
    
    loaderGLTF.load('./RobotExpressive.glb', function(gltf) {
        robot = gltf.scene;
        robot.scale.set(10, 10, 10); 
        robot.position.copy(boat.position);
        face = robot.getObjectByName('Head_4');
        
        scene.add(robot);
        /* // Add animations (not working for now)
        animations = gltf.animations.reduce((acc, anim) => {
            acc[anim.name] = anim;
            return acc;
        }, {});
        
        setupRobotAnimations();
 */

    }, undefined, function(error) {
        console.error(error);
    });
}

loadRobotModel();


function updateRobot(robot){
    if (robot) { 
        robot.position.copy(boat.position);
        robot.position.y += 10;
    }
}



let mixer;
let actions = {};

// Add animations (not working for now) 
function setupAnimationAnimations() {
    mixer = new THREE.AnimationMixer(robot);

    for (const [name, animation] of Object.entries(animations)) {
        actions[name] = mixer.clipAction(animation);
    }
}

// Robot's expressions 
document.addEventListener('keydown', function(event) {
    if (event.key === 'e' || event.key === 'E') {
        changeRobotExpression();
    }
});
let currentExpressionIndex = 0; // Keep track of the current expression

function setRobotExpression(expressionName) {
    if (!face || !face.morphTargetDictionary) {
        console.log("Face not defined or model not loaded");
        return;
    }

    // Reset all morph target influences
    face.morphTargetInfluences.fill(0);

    // Set the morph target influence for the specified expression
    if (expressionName in face.morphTargetDictionary) {
        const expressionIndex = face.morphTargetDictionary[expressionName];
        face.morphTargetInfluences[expressionIndex] = 1;
    } else {
        console.log("Expression not found:", expressionName);
    }
}

function changeRobotExpression() {
    if (!face) {
        console.log("Face not defined or model not loaded");
        return;
    }
    if (!robot) return; 

    const expressions = Object.keys(face.morphTargetDictionary);
    currentExpressionIndex = (currentExpressionIndex + 1) % expressions.length;
    
    // Reset all morph target influences
    for (let i = 0; i < expressions.length; i++) {
        face.morphTargetInfluences[i] = 0;
    }

    // Set the morph target influence for the current expression
    const expressionName = expressions[currentExpressionIndex];
    const expressionIndex = face.morphTargetDictionary[expressionName];
    face.morphTargetInfluences[expressionIndex] = 1;
}



// Robot's actions
document.addEventListener('keydown', function(event) {
    if (!mixer || !actions) return;

    switch (event.key.toLowerCase()) {
        case 'y': // 'Yes' animation
            playAnimation('Yes');
            break;
        case 'n': // 'No' animation
            playAnimation('No');
            break;
        case 'w': // 'Wave' animation
            playAnimation('Wave');
            break;
        case 't': // 'ThumbsUp' animation
            playAnimation('ThumbsUp');
            break;
        // Add other cases as needed ('Jump', 'Punch')
    }
});

function playAnimation(name) {
    if (name in actions) {
        const action = actions[name];
        action.reset().play();
    } else {
        console.log("Animation not found:", name);
    }
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
    updateRobot(robot);
    updateSpeechBubble();

    // Render the scene
    renderer.render(scene, camera);
}



animate();
