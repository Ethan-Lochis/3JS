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
  platform.position.y = -15;
  platform.receiveShadow = true;
  scene.add(platform);

  // ==========
  
  // Géométries partagées
  const sphereGeometry = new THREE.SphereGeometry(1, 32, 32);
  const cylinderGeometry = new THREE.CylinderGeometry(0.5, 0.5, 1, 16);
  
  // Matériaux
  const sphereMaterial = new THREE.MeshStandardMaterial({
    color: 0x3498db,
    metalness: 0.3,
    roughness: 0.4,
  });
  const rodMaterial = new THREE.MeshStandardMaterial({
    color: 0x2c3e50,
    metalness: 0.6,
    roughness: 0.3,
  });

  // Groupe principal
  const mainGroup = new THREE.Group();
  mainGroup.position.y = 20; // Déplacer tout vers le haut
  scene.add(mainGroup);

  // Tige horizontale
  const horizontalRod = new THREE.Mesh(cylinderGeometry, rodMaterial);
  horizontalRod.rotation.z = Math.PI / 2; // aligner avec l'axe X
  horizontalRod.scale.set(1, 50, 1); // Allonger le cylindre
  horizontalRod.castShadow = true;
  mainGroup.add(horizontalRod);

  // Configuration pour les pendules
  const numPendulums = 15; // Nombre de pendules
  const pendulumGroups = [];
  const speeds = [];
  
  // Booléen pour démarrer l'animation
  let go = false;

  // Paramètres de départ
  const startLength = 5; // Longueur minimale
  const lengthIncrement = 1; // Augmentation de longueur
  const startSpeed = 0.02; // Vitesse initiale
  const spacing = 3; // Espacement entre les pendules

  // Créer tous les sous-groupes de pendules
  for (let i = 0; i < numPendulums; i++) {
    // Créer un sous-groupe pour chaque pendule
    const pendulumGroup = new THREE.Group();
    
    // Position en X (espacer les pendules le long de l'axe X)
    const xPos = (i - numPendulums / 2) * spacing;
    pendulumGroup.position.x = xPos;
    
    // Calculer la longueur du cylindre pour ce pendule
    const length = startLength + i * lengthIncrement;
    
    // Créer le cylindre de liaison
    const cylinder = new THREE.Mesh(cylinderGeometry, rodMaterial);
    cylinder.scale.set(0.3, length, 0.3);
    cylinder.position.y = -length / 2; // Positionner vers le bas
    cylinder.castShadow = true;
    pendulumGroup.add(cylinder);
    
    // Créer la sphère
    const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
    sphere.scale.set(1.2, 1.2, 1.2);
    sphere.position.y = -length; // Positionner à l'extrémité du cylindre
    sphere.castShadow = true;
    pendulumGroup.add(sphere);
    
    // Ajouter le sous-groupe au groupe principal
    mainGroup.add(pendulumGroup);
    pendulumGroups.push(pendulumGroup);
    
    // Calculer la vitesse (inversement proportionnelle à la longueur)
    const speed = startSpeed / (1 + i * 0.15);
    speeds.push(speed);
  }

  // Écouter les touches du clavier pour démarrer l'animation
  window.addEventListener('keydown', () => {
    go = true;
  });

  // Fonction pour gérer le redimensionnement
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

    // Redimensionner le renderer si nécessaire
    if (resizeRendererToDisplaySize(renderer)) {
      const canvas = renderer.domElement;
      camera.aspect = canvas.clientWidth / canvas.clientHeight;
      camera.updateProjectionMatrix();
    }

    // Animer les pendules
    if (go) {
      for (let i = 0; i < pendulumGroups.length; i++) {
        const group = pendulumGroups[i];
        
        // ++ vitesse
        group.rotation.x += speeds[i];
        
        // Si la rotation dépasse PI/2, inverser la vitesse
        if (Math.abs(group.rotation.x) > Math.PI / 2) {
          speeds[i] *= -1;
        }
      }
    }

    stats.update();
    renderer.render(scene, camera);
    requestAnimationFrame(render);
  }

  requestAnimationFrame(render);
}

main();
