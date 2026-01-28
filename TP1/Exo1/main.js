import * as THREE from "three";
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';


// Scene
const scene = new THREE.Scene();

// Sphere
const geometry = new THREE.SphereGeometry(3, 16, 16);
const material = new THREE.MeshPhongMaterial({
  color: 0xffffff,
  specular: 0xffff,
  shininess: 60,
  flatShading: true,
});
const mesh = new THREE.Mesh(geometry, material);
scene.add(mesh);

// Light
const light = new THREE.PointLight(0xffffff, 100, 100);
light.position.set(0, 5, 10);
scene.add(light);
const aLight = new THREE.AmbientLight(0x303030);
scene.add(aLight);

// Camera
const camera = new THREE.PerspectiveCamera(25, 800 / 600);
camera.position.z = 20;
scene.add(camera);

// Renderer
const canvas = document.querySelector(".webgl");
const renderer = new THREE.WebGLRenderer({ canvas });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.render(scene, camera);

window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.render(scene, camera);
});

// Gestion de la pause
let isPaused = false;
const pauseBtn = document.getElementById("pauseBtn");

pauseBtn.addEventListener("click", () => {
  isPaused = !isPaused;
  if (isPaused) {
    pauseBtn.textContent = "Reprendre";
    pauseBtn.classList.add("paused");
  } else {
    pauseBtn.textContent = "Pause";
    pauseBtn.classList.remove("paused");
  }
});

const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;
const loop = () => {
   controls.update();
   renderer.render(scene, camera);
   window.requestAnimationFrame(loop);
}
loop();

