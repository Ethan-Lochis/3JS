import * as THREE from "three";
import { GUI } from "three/addons/libs/lil-gui.module.min.js";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import Stats from "three/addons/libs/stats.module.js";

class AxisGridHelper {
  constructor(node, units = 10) {
    const axes = new THREE.AxesHelper();
    axes.material.depthTest = false;
    axes.renderOrder = 2;
    node.add(axes);

    const grid = new THREE.GridHelper(units, units);
    grid.material.depthTest = false;
    grid.renderOrder = 1;
    node.add(grid);

    this.grid = grid;
    this.axes = axes;
    this.visible = false;
  }
  get visible() {
    return this._visible;
  }
  set visible(v) {
    this._visible = v;
    this.grid.visible = v;
    this.axes.visible = v;
  }
}

async function main() {
  const canvas = document.querySelector("#c");
  const renderer = new THREE.WebGLRenderer({ antialias: true, canvas });

  const fov = 40;
  const aspect = 2; // the canvas default
  const near = 0.1;
  const far = 1000;
  const camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
  const loader = new THREE.CubeTextureLoader().setPath("./CubeMap2/");
  const cubeTexture = await loader.loadAsync([
    "right.png",
    "left.png",
    "top.png",
    "bottom.png",
    "front.png",
    "back.png",
  ]);
  camera.position.set(0, 50, 0);
  camera.up.set(0, 0, 1);
  camera.lookAt(0, 0, 0);

  const scene = new THREE.Scene();

  {
    const color = 0xffffff;
    const intensity = 300;
    const light = new THREE.PointLight(color, intensity);
    scene.add(light);
    scene.background = cubeTexture;
  }

  // an array of objects who's rotation to update
  const objects = [];

  // Paramètres pour la GUI
  const params = {
    rotationSpeed: 1.0,
  };

  // Stats pour afficher les FPS
  const stats = new Stats();
  document.body.appendChild(stats.dom);

  const radius = 1;
  const widthSegments = 200;
  const heightSegments = 200;
  const sphereGeometry = new THREE.SphereGeometry(
    radius,
    widthSegments,
    heightSegments,
  );

  const solarSystem = new THREE.Object3D();
  scene.add(solarSystem);
  objects.push(solarSystem);

  const textureLoader = new THREE.TextureLoader();

  // Fonction pour créer une orbite visible
  function createOrbit(radius) {
    const orbitGeometry = new THREE.TorusGeometry(
      radius,
      0.05,
      8,
      100
    );
    const orbitMaterial = new THREE.MeshBasicMaterial({
      color: 0x888888,
      transparent: true,
      opacity: 0.3
    });
    const orbitLine = new THREE.Mesh(orbitGeometry, orbitMaterial);
    orbitLine.rotation.x = Math.PI / 2;
    return orbitLine;
  }

  // SOLEIL
  const sunMaterial = new THREE.MeshPhongMaterial({
    emissive: 0xffff00,
    emissiveMap: textureLoader.load("./Planets/2k_sun.jpg"),
    emissiveIntensity: 1,
  });
  const sunMesh = new THREE.Mesh(sphereGeometry, sunMaterial);
  sunMesh.scale.set(5, 5, 5);
  solarSystem.add(sunMesh);
  objects.push(sunMesh);

  // MERCURE
  const mercuryOrbitRadius = 7;
  const mercuryOrbit = new THREE.Object3D();
  mercuryOrbit.position.x = mercuryOrbitRadius;
  solarSystem.add(mercuryOrbit);
  objects.push(mercuryOrbit);
  solarSystem.add(createOrbit(mercuryOrbitRadius));

  const mercuryMaterial = new THREE.MeshPhongMaterial({
    map: textureLoader.load("./Planets/2k_mercury.jpg"),
  });
  const mercuryMesh = new THREE.Mesh(sphereGeometry, mercuryMaterial);
  mercuryMesh.scale.set(0.4, 0.4, 0.4);
  mercuryOrbit.add(mercuryMesh);
  objects.push(mercuryMesh);

  // VÉNUS
  const venusOrbitRadius = 10;
  const venusOrbit = new THREE.Object3D();
  venusOrbit.position.x = venusOrbitRadius;
  solarSystem.add(venusOrbit);
  objects.push(venusOrbit);
  solarSystem.add(createOrbit(venusOrbitRadius));

  const venusMaterial = new THREE.MeshPhongMaterial({
    map: textureLoader.load("./Planets/2k_venus.jpg"),
  });
  const venusMesh = new THREE.Mesh(sphereGeometry, venusMaterial);
  venusMesh.scale.set(0.9, 0.9, 0.9);
  venusOrbit.add(venusMesh);
  objects.push(venusMesh);

  // TERRE + LUNE
  const earthOrbitRadius = 15;
  const earthOrbit = new THREE.Object3D();
  earthOrbit.position.x = earthOrbitRadius;
  solarSystem.add(earthOrbit);
  objects.push(earthOrbit);
  solarSystem.add(createOrbit(earthOrbitRadius));

  const earthMaterial = new THREE.MeshPhongMaterial({
    map: textureLoader.load("./Planets/2k_earth_daymap.jpg"),
    bumpMap: textureLoader.load("./Planets/earthbump1k.jpg"),
    specularMap: textureLoader.load("./Planets/earthspec1k.jpg"),
    bumpScale: 0.05,
    shininess: 10,
  });
  const earthMesh = new THREE.Mesh(sphereGeometry, earthMaterial);
  earthOrbit.add(earthMesh);
  objects.push(earthMesh);

  const moonOrbit = new THREE.Object3D();
  moonOrbit.position.x = 2;
  earthOrbit.add(moonOrbit);

  const moonMaterial = new THREE.MeshPhongMaterial({
    map: textureLoader.load("./Planets/2k_moon.jpg"),
  });
  const moonMesh = new THREE.Mesh(sphereGeometry, moonMaterial);
  moonMesh.scale.set(0.27, 0.27, 0.27);
  moonOrbit.add(moonMesh);
  objects.push(moonMesh);

  // MARS
  const marsOrbitRadius = 20;
  const marsOrbit = new THREE.Object3D();
  marsOrbit.position.x = marsOrbitRadius;
  solarSystem.add(marsOrbit);
  objects.push(marsOrbit);
  solarSystem.add(createOrbit(marsOrbitRadius));

  const marsMaterial = new THREE.MeshPhongMaterial({
    map: textureLoader.load("./Planets/2k_mars.jpg"),
  });
  const marsMesh = new THREE.Mesh(sphereGeometry, marsMaterial);
  marsMesh.scale.set(0.53, 0.53, 0.53);
  marsOrbit.add(marsMesh);
  objects.push(marsMesh);

  // JUPITER
  const jupiterOrbitRadius = 28;
  const jupiterOrbit = new THREE.Object3D();
  jupiterOrbit.position.x = jupiterOrbitRadius;
  solarSystem.add(jupiterOrbit);
  objects.push(jupiterOrbit);
  solarSystem.add(createOrbit(jupiterOrbitRadius));

  const jupiterMaterial = new THREE.MeshPhongMaterial({
    map: textureLoader.load("./Planets/2k_jupiter.jpg"),
  });
  const jupiterMesh = new THREE.Mesh(sphereGeometry, jupiterMaterial);
  jupiterMesh.scale.set(2.5, 2.5, 2.5);
  jupiterOrbit.add(jupiterMesh);
  objects.push(jupiterMesh);

  // SATURNE + ANNEAUX
  const saturnOrbitRadius = 38;
  const saturnOrbit = new THREE.Object3D();
  saturnOrbit.position.x = saturnOrbitRadius;
  solarSystem.add(saturnOrbit);
  objects.push(saturnOrbit);
  solarSystem.add(createOrbit(saturnOrbitRadius));

  const saturnMaterial = new THREE.MeshPhongMaterial({
    map: textureLoader.load("./Planets/2k_saturn.jpg"),
  });
  const saturnMesh = new THREE.Mesh(sphereGeometry, saturnMaterial);
  saturnMesh.scale.set(2.1, 2.1, 2.1);
  saturnOrbit.add(saturnMesh);
  objects.push(saturnMesh);

  // Anneaux de Saturne
  const ringGeometry = new THREE.RingGeometry(2.5, 4.5, 64);
  const ringMaterial = new THREE.MeshBasicMaterial({
    map: textureLoader.load("./Planets/2k_saturn_ring_alpha.png"),
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.8
  });
  const saturnRing = new THREE.Mesh(ringGeometry, ringMaterial);
  saturnRing.rotation.x = Math.PI / 2;
  saturnOrbit.add(saturnRing);

  // URANUS
  const uranusOrbitRadius = 50;
  const uranusOrbit = new THREE.Object3D();
  uranusOrbit.position.x = uranusOrbitRadius;
  solarSystem.add(uranusOrbit);
  objects.push(uranusOrbit);
  solarSystem.add(createOrbit(uranusOrbitRadius));

  const uranusMaterial = new THREE.MeshPhongMaterial({
    map: textureLoader.load("./Planets/2k_uranus.jpg"),
  });
  const uranusMesh = new THREE.Mesh(sphereGeometry, uranusMaterial);
  uranusMesh.scale.set(1.5, 1.5, 1.5);
  uranusOrbit.add(uranusMesh);
  objects.push(uranusMesh);

  // NEPTUNE
  const neptuneOrbitRadius = 60;
  const neptuneOrbit = new THREE.Object3D();
  neptuneOrbit.position.x = neptuneOrbitRadius;
  solarSystem.add(neptuneOrbit);
  objects.push(neptuneOrbit);
  solarSystem.add(createOrbit(neptuneOrbitRadius));

  const neptuneMaterial = new THREE.MeshPhongMaterial({
    map: textureLoader.load("./Planets/2k_neptune.jpg"),
  });
  const neptuneMesh = new THREE.Mesh(sphereGeometry, neptuneMaterial);
  neptuneMesh.scale.set(1.45, 1.45, 1.45);
  neptuneOrbit.add(neptuneMesh);
  objects.push(neptuneMesh);

  const gui = new GUI();

  // Contrôle de la vitesse de rotation
  gui.add(params, "rotationSpeed", 0, 5, 0.1).name("Vitesse Rotation");

  // Contrôles de visibilité des objets
  const visibilityFolder = gui.addFolder("Visibilité Planètes");
  visibilityFolder.add(sunMesh, "visible").name("Soleil");
  visibilityFolder.add(mercuryMesh, "visible").name("Mercure");
  visibilityFolder.add(venusMesh, "visible").name("Vénus");
  visibilityFolder.add(earthMesh, "visible").name("Terre");
  visibilityFolder.add(moonMesh, "visible").name("Lune");
  visibilityFolder.add(marsMesh, "visible").name("Mars");
  visibilityFolder.add(jupiterMesh, "visible").name("Jupiter");
  visibilityFolder.add(saturnMesh, "visible").name("Saturne");
  visibilityFolder.add(uranusMesh, "visible").name("Uranus");
  visibilityFolder.add(neptuneMesh, "visible").name("Neptune");
  visibilityFolder.open();

  // Contrôles des axes et grilles
  const axesFolder = gui.addFolder("Axes & Grilles");

  function makeAxisGrid(node, label, units) {
    const helper = new AxisGridHelper(node, units);
    axesFolder.add(helper, "visible").name(label);
  }

  makeAxisGrid(solarSystem, "solarSystem", 70);

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
  const controls = new OrbitControls(camera, canvas);
  controls.enableDamping = true;

  function render(time) {
    time *= 0.001;

    if (resizeRendererToDisplaySize(renderer)) {
      const canvas = renderer.domElement;
      camera.aspect = canvas.clientWidth / canvas.clientHeight;
      camera.updateProjectionMatrix();
    }

    // Rotation simplifiée avec vitesse contrôlable
    objects.forEach((obj) => {
      obj.rotation.y = time * params.rotationSpeed;
    });

    controls.update();
    stats.update();

    renderer.render(scene, camera);

    requestAnimationFrame(render);
  }

  requestAnimationFrame(render);
}

main();
