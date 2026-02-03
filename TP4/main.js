import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { GUI } from "three/addons/libs/lil-gui.module.min.js";
import Stats from "three/addons/libs/stats.module.js";

async function main() {
  const canvas = document.querySelector("#c");
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const fov = 75;
  const aspect = 2;
  const near = 0.1;
  const far = 1000;
  const camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
  camera.position.set(30, 25, 30);
  camera.lookAt(0, 0, 0);

  // Chargement de la Skybox depuis TP3
  const loader = new THREE.CubeTextureLoader().setPath("../TP3/Skybox/");
  const cubeTexture = await loader.loadAsync([
    "right.png",
    "left.png",
    "top.png",
    "bottom.png",
    "front.png",
    "back.png",
  ]);

  const scene = new THREE.Scene();
  scene.background = cubeTexture;

  // OrbitControls
  const controls = new OrbitControls(camera, canvas);
  controls.target.set(0, 5, 0);
  controls.update();

  // Lumière directionnelle avec ombres
  const light = new THREE.DirectionalLight(0xffffff, 1.5);
  light.position.set(20, 30, 15);
  light.castShadow = true;
  
  // Configuration des ombres
  light.shadow.mapSize.width = 2048;
  light.shadow.mapSize.height = 2048;
  light.shadow.camera.left = -100;
  light.shadow.camera.right = 100;
  light.shadow.camera.top = 100;
  light.shadow.camera.bottom = -100;
  light.shadow.camera.near = 0.5;
  light.shadow.camera.far = 150;
  
  scene.add(light);

  // Lumière ambiante pour éviter des zones trop sombres
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.3);
  scene.add(ambientLight);

  // Helper de lumière
  const lightHelper = new THREE.DirectionalLightHelper(light, 5);
  lightHelper.visible = false;
  scene.add(lightHelper);

  // Interface GUI
  const gui = new GUI();
  const lightFolder = gui.addFolder("Lumière");
  const guiParams = {
    showLightHelper: false,
  };

  lightFolder
    .add(guiParams, "showLightHelper")
    .name("Afficher Helper")
    .onChange((value) => {
      lightHelper.visible = value;
    });

  lightFolder.add(light, "intensity", 0, 5, 0.1).name("Intensité");
  lightFolder.addColor(light, "color").name("Couleur");
  lightFolder.open();

  // Stats pour afficher les FPS
  const stats = new Stats();
  document.body.appendChild(stats.dom);

  // Plateforme pour voir les ombres
  const platformGeometry = new THREE.BoxGeometry(500, 1, 500);
  const platformMaterial = new THREE.MeshStandardMaterial({
    color: 0x808080,
    roughness: 0.8,
    metalness: 0.2,
  });
  const platform = new THREE.Mesh(platformGeometry, platformMaterial);
  platform.position.y = -0.5;
  platform.receiveShadow = true;
  scene.add(platform);

  // Création de la "forêt" de blocs
  const blockMaterial = new THREE.MeshStandardMaterial({
    color: 0x4a90e2,
    roughness: 0.6,
    metalness: 0.4,
  });

  const baseAltitude = 0; // Altitude du bas des blocs
  const minHeight = 2;
  const maxHeight = 15;
  const gridSize = 25; // Grille 
  const spacing = 4; // Espacement entre les blocs

  for (let x = 0; x < gridSize; x++) {
    for (let z = 0; z < gridSize; z++) {
      // Hauteur aléatoire pour chaque bloc
      const height = minHeight + Math.random() * (maxHeight - minHeight);
      
      const blockGeometry = new THREE.BoxGeometry(2, height, 2);
      const block = new THREE.Mesh(blockGeometry, blockMaterial.clone());
      
      // Variation de couleur
      block.material.color.setHSL(
        0.55 + Math.random() * 0.1, 
        0.6 + Math.random() * 0.2,   
        0.4 + Math.random() * 0.2   
      );
      
      // Position: le bas est à baseAltitude, donc le centre est à height/2
      block.position.x = (x - (gridSize - 1) / 2) * spacing;
      block.position.y = baseAltitude + height / 2;
      block.position.z = (z - (gridSize - 1) / 2) * spacing;
      
      // Rotation légère aléatoire
      block.rotation.y = Math.random() * Math.PI * 2;
      
      // Activer les ombres
      block.castShadow = true;
      block.receiveShadow = true;
      
      scene.add(block);
    }
  }

  // Fonction de redimensionnement
  function resizeRendererToDisplaySize(renderer) {
    const canvas = renderer.domElement;
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    const needResize = canvas.width !== width || canvas.height !== height;
    if (needResize) {
      renderer.setSize(width, height, false);
    }
    return needResize;
  }

  // Boucle de rendu
  function render(time) {
    time *= 0.001; // Convertir en secondes

    if (resizeRendererToDisplaySize(renderer)) {
      const canvas = renderer.domElement;
      camera.aspect = canvas.clientWidth / canvas.clientHeight;
      camera.updateProjectionMatrix();
    }

    stats.update();
    renderer.render(scene, camera);
    requestAnimationFrame(render);
  }

  requestAnimationFrame(render);
}

main();
