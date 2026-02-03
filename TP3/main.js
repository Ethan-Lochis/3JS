import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { GUI } from "three/addons/libs/lil-gui.module.min.js";
import Stats from "three/addons/libs/stats.module.js";

async function main() {
  const canvas = document.querySelector("#c");
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.shadowMap.enabled = true;

  const fov = 75;
  const aspect = 2; // the canvas default
  const near = 0.1;
  const far = 1000;
  const camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
  camera.position.set(0, 10, 20);
  camera.lookAt(0, 0, 0);

  // Chargement de la Skybox
  const loader = new THREE.CubeTextureLoader().setPath("./Skybox/");
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
  controls.target.set(0, 0, 0);
  controls.update();

  // Lumière directionnelle
  let light = new THREE.DirectionalLight(0xffffff, 1.0);
  light.position.set(50, 150, 50);
  light.target.position.set(0, 0, 0);
  light.castShadow = true;
  scene.add(light);

  // Helper de lumière
  const lightHelper = new THREE.DirectionalLightHelper(light, 5);
  lightHelper.visible = false; // Invisible par défaut
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

  // Chargement du Rocketship
  const gltfLoader = new GLTFLoader();
  const gltf = await gltfLoader.loadAsync("./Assets/Rocketship.glb");
  // const gltf = await gltfLoader.loadAsync("./Assets/Kim Jong Un.glb");
  // const gltf = await gltfLoader.loadAsync("./Assets/Cow.glb");
  const rocketship = gltf.scene;
  rocketship.castShadow = true;
  rocketship.traverse((child) => {
    if (child.isMesh) {
      child.castShadow = true;
    }
  });
  scene.add(rocketship);

  // Système de particules pour les flammes du moteur
  const particleCount = 500;
  const particlesGeometry = new THREE.BufferGeometry();
  const particlePositions = new Float32Array(particleCount * 3);
  const particleVelocities = [];

  // Initialiser les particules
  for (let i = 0; i < particleCount; i++) {
    particlePositions[i * 3] = 0;
    particlePositions[i * 3 + 1] = -1; // Sous la fusée
    particlePositions[i * 3 + 2] = 0;

    // Vélocité aléatoire pour chaque particule
    particleVelocities.push({
      x: (Math.random() - 0.5) * 0.1,
      y: -Math.random() * 0.3 - 0.2, // Descend vers le bas
      z: (Math.random() - 0.5) * 0.1,
      life: Math.random(), // Durée de vie aléatoire
    });
  }

  particlesGeometry.setAttribute(
    "position",
    new THREE.BufferAttribute(particlePositions, 3),
  );

  const particlesMaterial = new THREE.PointsMaterial({
    color: 0xff6600,
    size: 0.3,
    transparent: true,
    opacity: 0.8,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });

  const particleSystem = new THREE.Points(particlesGeometry, particlesMaterial);
  particleSystem.visible = false; // Invisible au début
  scene.add(particleSystem);

  // Variables pour l'animation de décollage
  const platformPosition = new THREE.Vector3(0, 0, 0);
  const moonPosition = new THREE.Vector3(0, 112, 0); // Position sous la lune (plus haute)
  let currentBase = 'platform'; // 'platform' ou 'moon'
  let targetPosition = moonPosition.clone();
  let startPosition = platformPosition.clone();
  let isLaunching = false;
  let isReturning = false;
  const launchSpeed = 0.2; // Vitesse de montée
  const rotationSpeed = 0.08; // Vitesse de rotation
  let targetRotation = Math.PI; // Rotation cible (180°)
  let isRotating = false;
  let hasRotated = false; // Pour savoir si la rotation est déjà faite

  // Configuration du Raycaster pour détecter les clics
  const raycaster = new THREE.Raycaster();
  const mouse = new THREE.Vector2();

  // Gestionnaire de clic
  function onClick(event) {
    // Convertir la position de la souris en coordonnées normalisées (-1 à +1)
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    // Mettre à jour le rayon de picking
    raycaster.setFromCamera(mouse, camera);

    // Trouver les objets intersectés (recursive = true pour tous les enfants)
    const intersects = raycaster.intersectObject(rocketship, true);

    if (intersects.length > 0 && !isLaunching && !isReturning) {
      // Déclencher le décollage vers l'autre base
      isLaunching = true;
      isRotating = false;
      hasRotated = false;
      
      if (currentBase === 'platform') {
        startPosition = platformPosition.clone();
        targetPosition = moonPosition.clone();
        targetRotation = Math.PI; // 180° pour arriver à l'envers sur la lune
      } else {
        startPosition = moonPosition.clone();
        targetPosition = platformPosition.clone();
        targetRotation = 0; // 0° pour revenir à l'endroit
      }
    }
  }

  // Ajouter l'event listener sur le canvas
  canvas.addEventListener("click", onClick);

  // Ajout d'un sol (plateforme)
  const planeGeometry = new THREE.PlaneGeometry(20, 20);
  const planeMaterial = new THREE.MeshPhongMaterial({
    color: 0x808080,
    side: THREE.DoubleSide,
  });
  const plane = new THREE.Mesh(planeGeometry, planeMaterial);
  plane.rotation.x = Math.PI / 2;
  plane.position.y = -2;
  plane.receiveShadow = true;
  scene.add(plane);

  // Création de la lune
  const moonGeometry = new THREE.SphereGeometry(8, 32, 32);
  const moonMaterial = new THREE.MeshPhongMaterial({
    color: 0xaaaaaa,
    emissive: 0x222222,
  });
  const moon = new THREE.Mesh(moonGeometry, moonMaterial);
  moon.position.set(0, 120, 0); // Position plus haute
  moon.castShadow = true;
  moon.receiveShadow = true;
  scene.add(moon);

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

  function render(time) {
    time *= 0.001; // convert time to seconds

    if (resizeRendererToDisplaySize(renderer)) {
      const canvas = renderer.domElement;
      camera.aspect = canvas.clientWidth / canvas.clientHeight;
      camera.updateProjectionMatrix();
    }

    // Animation de décollage
    if (isLaunching) {
      const direction = currentBase === 'platform' ? 1 : -1;
      rocketship.position.y += launchSpeed * direction;

      // Calculer la distance parcourue
      const totalDistance = Math.abs(targetPosition.y - startPosition.y);
      const currentDistance = Math.abs(rocketship.position.y - startPosition.y);
      const progress = currentDistance / totalDistance;

      // Déclencher la rotation à 50% du trajet (mode atterrissage)
      if (progress >= 0.5 && !hasRotated) {
        isRotating = true;
        hasRotated = true;
      }

      // Rotation progressive de la fusée à mi-chemin
      if (isRotating) {
        const currentRot = rocketship.rotation.z;
        const diff = targetRotation - currentRot;
        
        if (Math.abs(diff) > 0.01) {
          rocketship.rotation.z += Math.sign(diff) * rotationSpeed;
        } else {
          rocketship.rotation.z = targetRotation;
          isRotating = false;
        }
      }

      // Activer les particules
      particleSystem.visible = true;
      particleSystem.position.copy(rocketship.position);
      // Ne pas appliquer la rotation du vaisseau aux particules
      // particleSystem.rotation.z = rocketship.rotation.z;

      // Animer les particules
      const positions = particlesGeometry.attributes.position.array;
      for (let i = 0; i < particleCount; i++) {
        const vel = particleVelocities[i];

        // Mettre à jour la position
        positions[i * 3] += vel.x;
        positions[i * 3 + 1] += vel.y;
        positions[i * 3 + 2] += vel.z;

        // Réinitialiser les particules qui descendent trop
        if (positions[i * 3 + 1] < -2) {
          positions[i * 3] = (Math.random() - 0.5) * 0.5;
          positions[i * 3 + 1] = -0.5;
          positions[i * 3 + 2] = (Math.random() - 0.5) * 0.5;
        }
      }
      particlesGeometry.attributes.position.needsUpdate = true;

      // Vérifier si la fusée a atteint la position cible
      const hasReached = currentBase === 'platform' 
        ? rocketship.position.y >= targetPosition.y
        : rocketship.position.y <= targetPosition.y;
      
      if (hasReached) {
        isLaunching = false;
        rocketship.position.copy(targetPosition);
        particleSystem.visible = false;
        
        // Changer de base
        currentBase = currentBase === 'platform' ? 'moon' : 'platform';
        console.log('🚀 Fusée arrivée sur:', currentBase === 'moon' ? 'la Lune' : 'la Plateforme');
      }
    }

    // Rotation continue autour de l'axe Y (sauf pendant le vol)
    if (!isLaunching) {
      rocketship.rotation.y = time;
    }

    controls.update();
    stats.update();

    renderer.render(scene, camera);

    requestAnimationFrame(render);
  }

  requestAnimationFrame(render);
}

main();
