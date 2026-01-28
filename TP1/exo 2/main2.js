import * as THREE from "three";
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';



// Scene
const scene = new THREE.Scene();

// Torus
const torus = new THREE.TorusGeometry(
   3, 1,
   16, 100,
   Math.PI * 2
)
const material = new THREE.MeshPhongMaterial({
  color: 0xffffff,
  specular: 0xffff,
  shininess: 60,
  flatShading: true,
  side: THREE.DoubleSide,
});
const mesh = new THREE.Mesh(torus, material);
mesh.rotation.x = Math.PI / 2;
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
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.render(scene, camera);

window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.render(scene, camera);
});


const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;
const loop = () => {
   controls.update();
   renderer.render(scene, camera);
   window.requestAnimationFrame(loop);
}
loop();

