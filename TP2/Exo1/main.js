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

  const sunMaterial = new THREE.MeshPhongMaterial({
    emissive: 0xffff00,
    emissiveMap: new THREE.TextureLoader().load("./Planets/2k_sun.jpg"),
    emissiveIntensity: 1,
  });

  const sunMesh = new THREE.Mesh(sphereGeometry, sunMaterial);
  sunMesh.scale.set(5, 5, 5);
  solarSystem.add(sunMesh);
  objects.push(sunMesh);

  const earthOrbit = new THREE.Object3D();
  earthOrbit.position.x = 10;
  solarSystem.add(earthOrbit);
  objects.push(earthOrbit);

  // Création orbite Terre (Torus)
  const earthOrbitRadius = 10; 
  const orbitTubeRadius = 0.05; 
  const orbitRadialSegments = 8; 
  const orbitTubularSegments = 100; 
  
  const earthOrbitGeometry = new THREE.TorusGeometry(
    earthOrbitRadius,
    orbitTubeRadius,
    orbitRadialSegments,
    orbitTubularSegments
  );
  
  const earthOrbitMaterial = new THREE.MeshBasicMaterial({
    color: 0x888888,
    transparent: true,
    opacity: 0.3
  });
  
  const earthOrbitLine = new THREE.Mesh(earthOrbitGeometry, earthOrbitMaterial);
  // Rotation pour que le torus soit horizontal (orbite dans le plan XY)
  earthOrbitLine.rotation.x = Math.PI / 2;
  solarSystem.add(earthOrbitLine);

  const earthColor = "Planets/earthmap1k.jpg";
  const earthBump = "Planets/earthbump1k.jpg";
  const earthSpec = "Planets/earthspec1k.jpg";
  const textureLoader = new THREE.TextureLoader();
  const earthMaterial = new THREE.MeshPhongMaterial({
    map: textureLoader.load(earthColor),
    bumpMap: textureLoader.load(earthBump),
    specularMap: textureLoader.load(earthSpec),
    bumpScale: 0.25,
    shininess: 1,
  });

  const earthMesh = new THREE.Mesh(sphereGeometry, earthMaterial);
  earthOrbit.add(earthMesh);
  objects.push(earthMesh);

  const moonOrbit = new THREE.Object3D();
  moonOrbit.position.x = 2;
  earthOrbit.add(moonOrbit);

  const moonMaterial = new THREE.MeshPhongMaterial({
    emissive: 0x222222,
    emissiveMap: new THREE.TextureLoader().load("./Planets/2k_moon.jpg"),
    emissiveIntensity: 3,
  });
  const moonMesh = new THREE.Mesh(sphereGeometry, moonMaterial);
  moonMesh.scale.set(0.5, 0.5, 0.5);
  moonOrbit.add(moonMesh);
  objects.push(moonMesh);

  const gui = new GUI();

  // Contrôle de la vitesse de rotation
  gui.add(params, "rotationSpeed", 0, 5, 0.1).name("Vitesse Rotation");

  // Contrôles de visibilité des objets
  const visibilityFolder = gui.addFolder("Visibilité Objets");
  visibilityFolder.add(sunMesh, "visible").name("Soleil");
  visibilityFolder.add(earthMesh, "visible").name("Terre");
  visibilityFolder.add(moonMesh, "visible").name("Lune");
  visibilityFolder.open();

  // Contrôles des axes et grilles
  const axesFolder = gui.addFolder("Axes & Grilles");

  function makeAxisGrid(node, label, units) {
    const helper = new AxisGridHelper(node, units);
    axesFolder.add(helper, "visible").name(label);
  }

  makeAxisGrid(solarSystem, "solarSystem", 25);
  makeAxisGrid(sunMesh, "sunMesh");
  makeAxisGrid(earthOrbit, "earthOrbit");
  makeAxisGrid(earthMesh, "earthMesh");
  makeAxisGrid(moonOrbit, "moonOrbit");
  makeAxisGrid(moonMesh, "moonMesh");

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
