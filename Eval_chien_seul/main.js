import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { gsap } from "gsap";
import { GUI } from "three/addons/libs/lil-gui.module.min.js";

// Helper function to convert degrees to radians
const degreesToRadians = (degrees) => {
  return degrees * (Math.PI / 180);
};

// Helper function to get a random number between min and max
const random = (min, max) => Math.random() * (max - min) + min;

// Scène
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x222222);

// Caméra
const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000,
);
camera.position.set(3, 3, 5);

// init class
const material = new THREE.MeshLambertMaterial({ color: 0xffffff });
const geometry = new THREE.SphereGeometry(1, 32, 16);

class Figure {
  constructor(params) {
    this.params = {
      x: 0,
      y: 0,
      z: 0,
      ry: 0,
      armRotation: 0,
      bodyRotation: 0,
      figureRotation: 0,
      walkSpeed: 0,
      ...params,
    };

    this.group = new THREE.Group();
    scene.add(this.group);

    this.headHue = random(0, 360);
    this.bodyHue = random(0, 360);

    this.headMaterial = new THREE.MeshLambertMaterial({
      color: `hsl(${this.headHue}, 30%, 50%)`,
    });
    this.bodyMaterial = new THREE.MeshLambertMaterial({
      color: `hsl(${this.bodyHue}, 85%, 50%)`,
    });
  }

  createBody() {
    const geometry = new THREE.BoxGeometry(1, 1, 2);
    this.body = new THREE.Mesh(geometry, this.bodyMaterial);
    this.body.castShadow = true;
    this.body.receiveShadow = true;
    this.group.add(this.body);
  }

  createHead() {
    // Create a new group for the head
    this.head = new THREE.Group();

    // Create the main cube of the head and add to the group
    const geometry = new THREE.BoxGeometry(0.7, 1, 0.7);
    const headMain = new THREE.Mesh(geometry, this.headMaterial);
    headMain.castShadow = true;
    headMain.receiveShadow = true;
    this.head.add(headMain);

    // Add the head group to the figure
    this.group.add(this.head);

    // Position the head group
    this.head.position.y = 1;
    this.head.position.z = 0.6;

    // Add the eyes by calling the function we already made
    this.createEyes();
    this.createEars();
    this.createNose();
  }

  createEyes() {
    const eyes = new THREE.Group();
    // const geometry = new THREE.SphereGeometry(0.15, 12, 8);
    const geometry = new THREE.BoxGeometry(0.1, 0.1, 0.1);
    const geometry2 = new THREE.BoxGeometry(0.2, 0.2, 0.05);

    // Define the eye material
    const material = new THREE.MeshLambertMaterial({ color: 0x44445c });
    const material2 = new THREE.MeshLambertMaterial({ color: 0xffffff });

    for (let i = 0; i < 2; i++) {
      const pupil = new THREE.Mesh(geometry, material);
      const m = i % 2 === 0 ? 1 : -1;

      const white = new THREE.Mesh(geometry2, material2);

      // Add the pupil to the group
      eyes.add(pupil);
      pupil.castShadow = true;

      eyes.add(white);
      white.castShadow = true;

      // Position the pupil
      pupil.position.x = 0.2 * m;
      pupil.position.z = -0.2;

      white.position.x = 0.2 * m;
      white.position.z = -0.2;
    }

    // Add the eyes group to the head
    this.head.add(eyes);
    this.eyes = eyes;

    // Move the eyes forwards by half of the head depth so they're visible on the face
    eyes.position.z = 0.6;
    eyes.position.y = 0.25; // Slightly below center for better placement
  }

  createEars() {
    const Ears = new THREE.Group();
    const geometry = new THREE.BoxGeometry(0.2, 0.4, 0.05);

    // Define the eye material
    const material = new THREE.MeshLambertMaterial({ color: 0x53c258 });

    for (let i = 0; i < 2; i++) {
      const ear = new THREE.Mesh(geometry, material);
      const m = i % 2 === 0 ? 1 : -1;

      // Add the ear to the group
      Ears.add(ear);
      ear.castShadow = true;

      // Position the ear
      ear.position.x = 0.2 * m;
      ear.position.z = -0.2;
    }

    // Add the Ears group to the head
    this.head.add(Ears);
    this.Ears = Ears;

    // Move the Ears forwards by half of the head depth so they're visible on the face
    Ears.position.z = 0.4;
    Ears.position.y = 0.6; // Slightly below center for better placement
  }

  createNose() {
    const Nose = new THREE.Group();
    // const geometry = new THREE.SphereGeometry(0.15, 12, 8);
    const geometry = new THREE.BoxGeometry(0.6, 0.15, 0.15);
    const geometry2 = new THREE.BoxGeometry(0.3, 0.1, 0.1);

    // Define the eye material
    const material = new THREE.MeshLambertMaterial({ color: 0xb58b45 });
    const material2 = new THREE.MeshLambertMaterial({ color: 0x000000 });

    for (let i = 0; i < 2; i++) {
      const nose = new THREE.Mesh(geometry, material);
      const m = i % 2 === 0 ? 1 : -1;

      const nostril = new THREE.Mesh(geometry2, material2);

      // Add the nose to the group
      Nose.add(nose);
      nose.castShadow = true;

      Nose.add(nostril);
      nostril.castShadow = true;

      // Position the nose
      nose.position.y = 0.09 * m;
      nose.position.z = -0.2;

      nostril.position.z = -0.17;
      nostril.position.y = 0.13;
    }

    // Add the Nose group to the head
    this.head.add(Nose);
    this.Nose = Nose;

    // Move the Nose forwards by half of the head depth so they're visible on the face
    Nose.position.z = 0.6;
    Nose.position.y = -0.25; // Slightly below center for better placement
  }

  createArms() {
    // Set the variable
    const height = 0.6;
    const geometry = new THREE.BoxGeometry(0.25, height, 0.25);

    // Store arms in an array
    this.arms = [];
    this.armHelpers = [];

    for (let i = 0; i < 2; i++) {
      const armGroup = new THREE.Group();
      const arm = new THREE.Mesh(geometry, this.bodyMaterial);
      arm.castShadow = true;
      arm.receiveShadow = true;

      const m = i % 2 === 0 ? 1 : -1;

      armGroup.add(arm);
      this.group.add(armGroup);

      // Add to arms array
      this.arms.push(armGroup);

      // Translate the arm (not the group) downwards by half the height
      arm.position.y = height * -0.5;

      armGroup.position.x = m * 0.3;
      armGroup.position.y = -0.5;
      armGroup.position.z = 0.8;

      // Helper
      const box = new THREE.BoxHelper(armGroup, 0xffff00);
      box.visible = false; // Invisible par défaut
      this.armHelpers.push(box);
      this.group.add(box);
    }
  }

  createLegs() {
    const height = 0.6;
    const geometry = new THREE.BoxGeometry(0.25, height, 0.25);
    this.legs = [];

    for (let i = 0; i < 2; i++) {
      const legGroup = new THREE.Group();
      const leg = new THREE.Mesh(geometry, this.bodyMaterial);
      const m = i % 2 === 0 ? 1 : -1;

      leg.castShadow = true;
      leg.receiveShadow = true;
      leg.position.y = height * -0.5;

      legGroup.add(leg);
      legGroup.position.x = m * 0.3;
      legGroup.position.y = -0.5;
      legGroup.position.z = -0.8;

      this.body.add(legGroup);
      this.legs.push(legGroup);
    }
  }

  bounce() {
    this.group.rotation.y = this.params.ry;
    this.group.position.y = this.params.y;

    // Déplacement selon la direction
    if (this.params.walkSpeed !== 0) {
      this.params.x += this.params.walkSpeed * Math.sin(this.params.ry);
      this.params.z += this.params.walkSpeed * Math.cos(this.params.ry);
    }
    this.group.position.x = this.params.x;
    this.group.position.z = this.params.z;

    // Rotation des bras (saut)
    if (this.params.armRotation !== undefined && this.arms) {
      this.arms.forEach((arm, index) => {
        const direction = index === 0 ? 1 : -1;
        arm.rotation.z = this.params.armRotation * direction;
      });
    }
    // Back-flip
    if (this.params.figureRotation !== undefined && this.group) {
      this.group.rotation.x = this.params.figureRotation;
    }
  }

  init() {
    this.createBody();
    this.createHead();
    this.createArms();
    this.createLegs();
  }
}

const figure = new Figure();
figure.init();
// Renderer
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.appendChild(renderer.domElement);

// Render function
const render = () => {
  renderer.render(scene, camera);
};

// Initialiser la position de départ
gsap.set(figure.params, {
  y: -1.5,
  armRotation: 0,
  bodyRotation: 0,
});

// Stocker la timeline pour pouvoir vérifier isActive()
let jumpTimeline = gsap.timeline();

// Fonction pour créer l'animation de saut
const jump = () => {
  if (jumpTimeline.isActive()) return;

  // Pause idle et marche, reset tête
  const wasWalking = figure.params.walkSpeed !== 0;
  idleTimeline.pause();
  if (wasWalking) walkTimeline.pause();
  gsap.to(figure.head.rotation, { y: 0, x: 0, duration: 0.1 });
  gsap.to(figure.eyes.scale, { y: 1, duration: 0.05 });

  jumpTimeline = gsap.timeline({
    onComplete: () => {
      if (wasWalking) walkTimeline.play();
      else idleTimeline.play();
    },
  });


  // utilisation de l'ia pour faie la boucle du backflip,
  // mauvaise compréhension de la boucle, quand je voulais remettre figure rotation a 0 
  // le chien refaisais un backflip dans l'autre sens

  // Animation de saut
  jumpTimeline
    .to(figure.params, {
      y: 0,
      duration: 0.5,
      ease: "power3.out",
    })
    .to(figure.params, {
      figureRotation: degreesToRadians(360),
      duration: 1,        // durée totale du saut
      ease: "none",       // rotation constante
    }, 0)                 // démarre en même temps que le premier .to()
    .to(figure.params, {
      y: -1.5,
      armRotation: 0,
      duration: 0.5,
      ease: "power3.in",
    })
    .set(figure.params, { figureRotation: 0 }); // reset sans animation);
};

// État des touches
const keys = {};

window.addEventListener("keydown", (event) => {
  if (["Space", "ArrowUp", "ArrowLeft", "ArrowRight"].includes(event.code)) {
    event.preventDefault();
  }
  if (keys[event.code]) return; // déjà enfoncée
  keys[event.code] = true;

  if (event.code === "Space") {
    jump();
  }

  if (event.code === "ArrowUp" && !jumpTimeline.isActive()) {
    idleTimeline.pause();
    gsap.to(figure.head.rotation, { x: 0, z: 0, duration: 0.1 });
    gsap.to(figure.eyes.scale, { y: 1, duration: 0.05 });
    figure.params.walkSpeed = 0.05;
    walkTimeline.play();
  }
});

window.addEventListener("keyup", (event) => {
  keys[event.code] = false;

  if (event.code === "ArrowUp") {
    figure.params.walkSpeed = 0;
    walkTimeline.pause();
    // Remettre bras et jambes à zéro
    gsap.to(
      [
        ...figure.arms.map((a) => a.rotation),
        ...figure.legs.map((l) => l.rotation),
      ],
      { x: 0, duration: 0.2, ease: "power2.out" },
    );
    idleTimeline.play();
  }
});

// Helper pour ajouter un clignement sur une timeline
const blink = (tl) =>
  tl
    .to(figure.eyes.scale, { y: 0.05, duration: 0.06, ease: "none" })
    .to(figure.eyes.scale, { y: 1, duration: 0.06, ease: "none" });

const idleTimeline = gsap.timeline({ repeat: -1 });

blink(idleTimeline.to({}, { duration: 2 }))
  .to({}, { duration: 4.5 })
  .to(figure.head.rotation, {
    z: degreesToRadians(7),
    duration: 0.7,
    ease: "power2.out",
  })
  .to(figure.head.rotation, {
    z: degreesToRadians(-7),
    duration: 0.7,
    ease: "power2.out",
  })
  .to(figure.head.rotation, { z: 0, duration: 0.2, ease: "power2.in" });

blink(idleTimeline).to({}, { duration: 0.25 });

blink(idleTimeline)
  .to({}, { duration: 2.5 })
  .to(figure.head.rotation, {
    x: degreesToRadians(7),
    duration: 0.2,
    ease: "power2.out",
  })
  .to(figure.head.rotation, { x: 0, duration: 0.2, ease: "power2.in" })
  .to({}, { duration: 1.5 });

// Timeline de marche (paused par défaut)
const walkAngle = degreesToRadians(40);
const walkTimeline = gsap
  .timeline({ repeat: -1, paused: true })
  .to(
    figure.arms[0].rotation,
    { x: -walkAngle, duration: 0.3, ease: "sine.inOut" },
    0,
  )
  .to(
    figure.arms[1].rotation,
    { x: walkAngle, duration: 0.3, ease: "sine.inOut" },
    0,
  )
  .to(
    figure.legs[0].rotation,
    { x: walkAngle, duration: 0.3, ease: "sine.inOut" },
    0,
  )
  .to(
    figure.legs[1].rotation,
    { x: -walkAngle, duration: 0.3, ease: "sine.inOut" },
    0,
  )
  .to(
    figure.arms[0].rotation,
    { x: walkAngle, duration: 0.3, ease: "sine.inOut" },
    0.3,
  )
  .to(
    figure.arms[1].rotation,
    { x: -walkAngle, duration: 0.3, ease: "sine.inOut" },
    0.3,
  )
  .to(
    figure.legs[0].rotation,
    { x: -walkAngle, duration: 0.3, ease: "sine.inOut" },
    0.3,
  )
  .to(
    figure.legs[1].rotation,
    { x: walkAngle, duration: 0.3, ease: "sine.inOut" },
    0.3,
  );

// OrbitControls
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;

// Lumières
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
directionalLight.position.set(5, 10, 5);
directionalLight.castShadow = true;
directionalLight.shadow.camera.left = -10;
directionalLight.shadow.camera.right = 10;
directionalLight.shadow.camera.top = 10;
directionalLight.shadow.camera.bottom = -10;
scene.add(directionalLight);

// Helper de lumière directionnelle
const lightHelper = new THREE.DirectionalLightHelper(directionalLight, 2);
lightHelper.visible = false; // Invisible par défaut
scene.add(lightHelper);

// Plan pour le sol
const planeGeometry = new THREE.PlaneGeometry(20, 20);
const planeMaterial = new THREE.MeshLambertMaterial({
  color: 0x808080,
  side: THREE.DoubleSide,
});
const plane = new THREE.Mesh(planeGeometry, planeMaterial);
plane.rotation.x = Math.PI / 2;
plane.position.y = -3;
plane.receiveShadow = true;
scene.add(plane);

// Gestion du redimensionnement
window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// Interface GUI
const gui = new GUI();
const guiParams = {
  ambientIntensity: 0.5,
  directionalIntensity: 0.8,
  showShadows: true,
  showLightHelper: false,
  showArmHelpers: false,
  backgroundColor: 0x222222,
};

// Dossier pour la lumière ambiante
const ambientFolder = gui.addFolder("Lumière Ambiante");
ambientFolder
  .add(guiParams, "ambientIntensity", 0, 2, 0.1)
  .name("Intensité")
  .onChange((value) => {
    ambientLight.intensity = value;
  });

// Dossier pour la lumière directionnelle
const directionalFolder = gui.addFolder("Lumière Directionnelle");
directionalFolder
  .add(guiParams, "directionalIntensity", 0, 2, 0.1)
  .name("Intensité")
  .onChange((value) => {
    directionalLight.intensity = value;
  });

directionalFolder
  .add(directionalLight.position, "x", -20, 20, 0.5)
  .name("Position X");
directionalFolder
  .add(directionalLight.position, "y", 0, 20, 0.5)
  .name("Position Y");
directionalFolder
  .add(directionalLight.position, "z", -20, 20, 0.5)
  .name("Position Z");

// Dossier pour les ombres
const shadowFolder = gui.addFolder("Ombres");
shadowFolder
  .add(guiParams, "showShadows")
  .name("Afficher ombres")
  .onChange((value) => {
    renderer.shadowMap.enabled = value;
  });

// Dossier pour les helpers
const helpersFolder = gui.addFolder("Helpers");
helpersFolder
  .add(guiParams, "showLightHelper")
  .name("Helper lumière")
  .onChange((value) => {
    lightHelper.visible = value;
  });

helpersFolder
  .add(guiParams, "showArmHelpers")
  .name("Helpers bras")
  .onChange((value) => {
    figure.armHelpers.forEach((helper) => {
      helper.visible = value;
    });
  });

// Couleur de fond
gui
  .addColor(guiParams, "backgroundColor")
  .name("Couleur de fond")
  .onChange((value) => {
    scene.background.setHex(value);
  });

gsap.ticker.add(() => {
  // Rotation gauche/droite
  if (keys["ArrowLeft"]) figure.params.ry += 0.03;
  if (keys["ArrowRight"]) figure.params.ry -= 0.03;

  figure.bounce();
  controls.update();
  render();
});
