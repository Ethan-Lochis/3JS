import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GUI } from 'three/addons/libs/lil-gui.module.min.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import * as CANNON from 'cannon-es';
import CannonDebugger from 'cannon-es-debugger';
const gltfLoader = new GLTFLoader();
let CanHit = false;

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.z = 3;
const canvas = document.querySelector('.webgl');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(window.devicePixelRatio);


renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

renderer.setSize(window.innerWidth, window.innerHeight);
scene.background = new THREE.Color(0x1a1a1a);
// const gui = new GUI();




async function loadSkybox() {
  const loader = new THREE.CubeTextureLoader().setPath('./asset/cube/');
  const cubeTexture = await loader.loadAsync([
    'posx.jpg', 'negx.jpg', 
    'posy.jpg', 'negy.jpg', 
    'posz.jpg', 'negz.jpg'
  ]);
  scene.background = cubeTexture;
}

loadSkybox();



let light = new THREE.DirectionalLight(0xFFFFFF, 1.0);
light.position.set(50, 100, 10);
light.target.position.set(0, 0, 0);
light.castShadow = true;
light.shadow.isDirectionalLightShadow = true;
scene.add(light);
scene.add(new THREE.DirectionalLightHelper(light));

light.shadow.bias = -0.00005;
light.shadow.mapSize.width = 8192;
light.shadow.mapSize.height = 8192;
light.shadow.camera.near = 0.5;
light.shadow.camera.far = 500;
light.shadow.camera.left = -50;
light.shadow.camera.right = 50;
light.shadow.camera.top = 50;
light.shadow.camera.bottom = -50;

let ambianceLight = new THREE.AmbientLight(0x404040, 1);
scene.add(ambianceLight);

// Création du monde physique Cannon
const world = new CANNON.World();
world.gravity.set(0, -9.82, 0);
world.defaultContactMaterial.friction = 0.4;

// Créer les matériaux physiques Cannon
const handMaterial = new CANNON.Material('hand');
const sphereMaterial = new CANNON.Material('sphere');
const wallMaterial = new CANNON.Material('wall');

// ContactMaterials pour définir les interactions entre matériaux
world.addContactMaterial(new CANNON.ContactMaterial(handMaterial, sphereMaterial, { friction: 0.3, restitution: 0.7 }));
world.addContactMaterial(new CANNON.ContactMaterial(sphereMaterial, sphereMaterial, { friction: 0.4, restitution: 0.6 }));
world.addContactMaterial(new CANNON.ContactMaterial(handMaterial, wallMaterial, { friction: 0.2, restitution: 0.4 }));
world.addContactMaterial(new CANNON.ContactMaterial(sphereMaterial, wallMaterial, { friction: 0.3, restitution: 0.5 }));

// Debug renderer Cannon
const cannonDebugger = new CannonDebugger(scene, world);

let loadedModel;
let handPhysicsBody;

function handlerClickModel() {
  CanHit = !CanHit;
}

//clic event
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

window.addEventListener('click', (event) => {
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
  
  raycaster.setFromCamera(mouse, camera);
  
  if(loadedModel) {
    const intersects = raycaster.intersectObject(loadedModel, true);
    if(intersects.length > 0) {
      handlerClickModel();
    }
  }
});



 gltfLoader.load('asset/hand.glb', (gltf) => {
    loadedModel = gltf.scene;
    
    loadedModel.position.set(0, 2, 0);
    loadedModel.scale.set(0.03, 0.03, 0.03);

    loadedModel.traverse((child) => {
      if(child.isMesh){
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
    scene.add(loadedModel);

    // Créer un corps physique pour la main (box plus grand)
    const handShape = new CANNON.Box(new CANNON.Vec3(0.2, 0.2, 0.2));
    handPhysicsBody = new CANNON.Body({
      mass: 1,
      shape: handShape,
      position: new CANNON.Vec3(0, 2, 0),
      linearDamping: 0.3,
      angularDamping: 0.3,
      material: handMaterial
    });
    world.addBody(handPhysicsBody);
 });



// const cubeGeometry = new THREE.BoxGeometry();
// const cubeMaterial = new THREE.MeshStandardMaterial({ color: 0x00ff00, metalness: 0.5, roughness: 0.5 });
// const cube = new THREE.Mesh(cubeGeometry, cubeMaterial);
// cube.castShadow = true;
// cube.receiveShadow = true;
// scene.add(cube);



const sol = new THREE.PlaneGeometry(10, 10);
const solMaterial = new THREE.MeshStandardMaterial({ color: 0x808080, metalness: 0.5, roughness: 0.5 });
const plane = new THREE.Mesh(sol, solMaterial);
plane.rotation.x = - Math.PI / 2;
plane.position.y = 0;
plane.receiveShadow = true;
scene.add(plane);

// Créer un cube creux avec collisions (invisible visuellement)
const wallThickness = 0.1;
const wallBodies = []; // Stocker les corps des murs pour pouvoir les supprimer

// Mur gauche (X = -4)
const leftShape = new CANNON.Box(new CANNON.Vec3(wallThickness / 2, 5 / 2, 8 / 2));
const leftBody = new CANNON.Body({ mass: 0, shape: leftShape, material: wallMaterial });
leftBody.position.set(-4, 2.5, 0);
world.addBody(leftBody);
wallBodies.push(leftBody);

// Mur droite (X = 4)
const rightShape = new CANNON.Box(new CANNON.Vec3(wallThickness / 2, 5 / 2, 8 / 2));
const rightBody = new CANNON.Body({ mass: 0, shape: rightShape, material: wallMaterial });
rightBody.position.set(4, 2.5, 0);
world.addBody(rightBody);
wallBodies.push(rightBody);

// Mur avant (Z = -4)
const frontShape = new CANNON.Box(new CANNON.Vec3(8 / 2, 5 / 2, wallThickness / 2));
const frontBody = new CANNON.Body({ mass: 0, shape: frontShape, material: wallMaterial });
frontBody.position.set(0, 2.5, -4);
world.addBody(frontBody);
wallBodies.push(frontBody);

// Mur arrière (Z = 4)
const backShape = new CANNON.Box(new CANNON.Vec3(8 / 2, 5 / 2, wallThickness / 2));
const backBody = new CANNON.Body({ mass: 0, shape: backShape, material: wallMaterial });
backBody.position.set(0, 2.5, 4);
world.addBody(backBody);
wallBodies.push(backBody);

// Sol (Y = 0)
const floorShape = new CANNON.Box(new CANNON.Vec3(8 / 2, wallThickness / 2, 8 / 2));
const floorBody = new CANNON.Body({ mass: 0, shape: floorShape, material: wallMaterial });
floorBody.position.set(0, 0, 0);
world.addBody(floorBody);
wallBodies.push(floorBody);

// Plafond (Y = 5)
const ceilingShape = new CANNON.Box(new CANNON.Vec3(8 / 2, wallThickness / 2, 8 / 2));
const ceilingBody = new CANNON.Body({ mass: 0, shape: ceilingShape, material: wallMaterial });
ceilingBody.position.set(0, 5, 0);
world.addBody(ceilingBody);
wallBodies.push(ceilingBody);

// Sol secondaire en bordure en dessous du cube (ne sera pas supprimé avec les murs)
const borderFloorGeometry = new THREE.BoxGeometry(10, 0.2, 10);
const borderFloorMaterial = new THREE.MeshStandardMaterial({ color: 0x404040, metalness: 0.3, roughness: 0.7 });
const borderFloorMesh = new THREE.Mesh(borderFloorGeometry, borderFloorMaterial);
borderFloorMesh.position.set(0, -5, 0);
borderFloorMesh.castShadow = true;
borderFloorMesh.receiveShadow = true;
scene.add(borderFloorMesh);

const borderFloorShape = new CANNON.Box(new CANNON.Vec3(10 / 2, 0.2 / 2, 10 / 2));
const borderFloorBody = new CANNON.Body({ mass: 0, shape: borderFloorShape, material: wallMaterial });
borderFloorBody.position.set(0, -5, 0);
world.addBody(borderFloorBody);

// Créer plein de sphères pour remplir le cube
const spheres = [];
for(let i = 0; i < 2300; i++) {
  const sphereGeometry = new THREE.SphereGeometry(0.3, 16, 16);
  const sphereMaterial = new THREE.MeshStandardMaterial({ 
    color: new THREE.Color().setHSL(Math.random(), 0.7, 0.6),
    metalness: 0.4,
    roughness: 0.6
  });
  const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
  
  // Position aléatoire dans le cube (X: -3 à 3, Y: 0.5 à 4.5, Z: -3 à 3)
  const x = (Math.random() - 0.5) * 6;
  const y = Math.random() * 4 + 0.5;
  const z = (Math.random() - 0.5) * 6;
  
  sphere.position.set(x, y, z);
  sphere.castShadow = true;
  sphere.receiveShadow = true;
  scene.add(sphere);
  
  // Corps physique pour la sphère
  const sphereShape = new CANNON.Sphere(0.3);
  const sphereBody = new CANNON.Body({
    mass: 1,
    shape: sphereShape,
    position: new CANNON.Vec3(x, y, z),
    linearDamping: 0.3,
    angularDamping: 0.3,
    material: sphereMaterial
  });
  world.addBody(sphereBody);
  
  spheres.push({ mesh: sphere, body: sphereBody });
}

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;

// Créer un bouton pour supprimer/ajouter les murs
const wallButton = document.createElement('button');
wallButton.textContent = 'Supprimer les murs';
wallButton.style.position = 'absolute';
wallButton.style.top = '20px';
wallButton.style.left = '20px';
wallButton.style.padding = '10px 20px';
wallButton.style.fontSize = '16px';
wallButton.style.backgroundColor = '#4CAF50';
wallButton.style.color = 'white';
wallButton.style.border = 'none';
wallButton.style.borderRadius = '4px';
wallButton.style.cursor = 'pointer';
wallButton.style.zIndex = '100';
document.body.appendChild(wallButton);

let wallsVisible = true;

wallButton.addEventListener('click', () => {
  if(wallsVisible) {
    // Supprimer les murs
    wallBodies.forEach(body => world.removeBody(body));
    wallButton.textContent = 'Ajouter les murs';
    wallButton.style.backgroundColor = '#f44336';
    plane.removeFromParent(); // Supprimer le sol visuel
    wallsVisible = false;
  } else {
    // Ajouter les murs
    wallBodies.forEach(body => world.addBody(body));
    scene.add(plane); // Ajouter le sol visuel
    wallButton.textContent = 'Supprimer les murs';
    wallButton.style.backgroundColor = '#4CAF50';
    wallsVisible = true;
  }
});

// Système de mouvement pour la main
const handMovement = {
  forward: false,
  backward: false,
  left: false,
  right: false,
  up: false,
  down: false
};

window.addEventListener('keydown', (e) => {
  if(e.key === 'z' || e.key === 'Z') handMovement.forward = true;
  if(e.key === 's' || e.key === 'S') handMovement.backward = true;
  if(e.key === 'q' || e.key === 'Q') handMovement.left = true;
  if(e.key === 'd' || e.key === 'D') handMovement.right = true;
  if(e.key === ' ') { handMovement.up = true; e.preventDefault(); }
  if(e.key === 'Control') handMovement.down = true;
});

window.addEventListener('keyup', (e) => {
  if(e.key === 'z' || e.key === 'Z') handMovement.forward = false;
  if(e.key === 's' || e.key === 'S') handMovement.backward = false;
  if(e.key === 'q' || e.key === 'Q') handMovement.left = false;
  if(e.key === 'd' || e.key === 'D') handMovement.right = false;
  if(e.key === ' ') handMovement.up = false;
  if(e.key === 'Control') handMovement.down = false;
});

function animate() {
  requestAnimationFrame(animate);
  
  // Mettre à jour la simulation physique
  world.step(1 / 60);
  
  // Appliquer le mouvement à la main
  if(handPhysicsBody) {
    const handSpeed = 10;
    
    if(handMovement.forward) handPhysicsBody.velocity.z -= handSpeed;
    if(handMovement.backward) handPhysicsBody.velocity.z += handSpeed;
    if(handMovement.left) handPhysicsBody.velocity.x -= handSpeed;
    if(handMovement.right) handPhysicsBody.velocity.x += handSpeed;
    if(handMovement.up) handPhysicsBody.velocity.y += handSpeed;
    if(handMovement.down) handPhysicsBody.velocity.y -= handSpeed;
  }
  
  // Mettre à jour le debug renderer
  //cannonDebugger.update();
  
  controls.update();
  
  // Synchroniser la main visuelle avec le corps physique
  if(loadedModel && handPhysicsBody) {
    loadedModel.position.copy(handPhysicsBody.position);
    loadedModel.quaternion.copy(handPhysicsBody.quaternion);
  }
  
  // Synchroniser les sphères avec leur corps physique
  spheres.forEach(({ mesh, body }, index) => {
    mesh.position.copy(body.position);
    mesh.quaternion.copy(body.quaternion);
    
    // Si la sphère tombe trop bas, la retéléporter et la dupliquer
    if(body.position.y < -6) {
      // Retéléporter la sphère au centre du cube
      body.position.set((Math.random() - 0.5) * 6, Math.random() * 4 + 0.5, (Math.random() - 0.5) * 6);
      body.velocity.set(0, 0, 0);
      body.angularVelocity.set(0, 0, 0);
      
      // Créer une nouvelle sphère dupliquée
      const sphereGeometry = new THREE.SphereGeometry(0.3, 16, 16);
      const sphereMaterial = new THREE.MeshStandardMaterial({ 
        color: new THREE.Color().setHSL(Math.random(), 0.7, 0.6),
        metalness: 0.4,
        roughness: 0.6
      });
      const newSphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
      
      const x = (Math.random() - 0.5) * 6;
      const y = Math.random() * 4 + 0.5;
      const z = (Math.random() - 0.5) * 6;
      
      newSphere.position.set(x, y, z);
      newSphere.castShadow = true;
      newSphere.receiveShadow = true;
      scene.add(newSphere);
      
      const newSphereShape = new CANNON.Sphere(0.3);
      const newSphereBody = new CANNON.Body({
        mass: 1,
        shape: newSphereShape,
        position: new CANNON.Vec3(x, y, z),
        linearDamping: 0.3,
        angularDamping: 0.3,
        material: sphereMaterial
      });
      world.addBody(newSphereBody);
      
      spheres.push({ mesh: newSphere, body: newSphereBody });
    }
  });


  
  renderer.render(scene, camera);
}

animate();


