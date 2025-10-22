let scene, camera, renderer, drone, droneParts = [];
let droneCenter = new THREE.Vector3();

function init() {
    scene = new THREE.Scene();
    
    camera = new THREE.PerspectiveCamera(
        45,
        window.innerWidth / window.innerHeight,
        0.1,
        1000
    );
    camera.position.set(0, 0.3, 0.8);
    camera.lookAt(0, 0, 0);

    renderer = new THREE.WebGLRenderer({
        canvas: document.getElementById('canvas3d'),
        antialias: true,
        alpha: true
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setClearColor(0x000000, 0);
    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const mainLight = new THREE.DirectionalLight(0xffffff, 0.8);
    mainLight.position.set(5, 5, 5);
    scene.add(mainLight);

    const fillLight = new THREE.DirectionalLight(0x4facfe, 0.3);
    fillLight.position.set(-5, 0, -5);
    scene.add(fillLight);

    const backLight = new THREE.DirectionalLight(0xffffff, 0.5);
    backLight.position.set(0, -5, -5);
    scene.add(backLight);

    loadDrone();

    window.addEventListener('resize', onWindowResize);
    animate();
}

function loadDrone() {
    const loader = new THREE.GLTFLoader();
    
    loader.load(
        'attached_assets/result1_1761168165742.gltf',
        function(gltf) {
            drone = gltf.scene;
            
            const box = new THREE.Box3().setFromObject(drone);
            box.getCenter(droneCenter);
            
            drone.position.sub(droneCenter);
            
            const size = new THREE.Vector3();
            box.getSize(size);
            const maxDim = Math.max(size.x, size.y, size.z);
            const scale = 0.4 / maxDim;
            drone.scale.setScalar(scale);
            
            separateDroneIntoParts();
            
            scene.add(drone);
            
            setupScrollAnimations();
            
            hideLoading();
        },
        function(xhr) {
            const percentComplete = (xhr.loaded / xhr.total) * 100;
            console.log('Loading: ' + Math.round(percentComplete) + '%');
        },
        function(error) {
            console.error('Error loading model:', error);
        }
    );
}

function separateDroneIntoParts() {
    const allMeshes = [];
    drone.traverse((child) => {
        if (child.isMesh) {
            allMeshes.push(child);
        }
    });

    const meshCount = allMeshes.length;
    const partsCount = 6;
    const meshesPerPart = Math.ceil(meshCount / partsCount);

    for (let i = 0; i < partsCount; i++) {
        const startIdx = i * meshesPerPart;
        const endIdx = Math.min(startIdx + meshesPerPart, meshCount);
        const partMeshes = allMeshes.slice(startIdx, endIdx);
        
        if (partMeshes.length > 0) {
            const partGroup = new THREE.Group();
            
            partMeshes.forEach(mesh => {
                const worldPos = new THREE.Vector3();
                mesh.getWorldPosition(worldPos);
                partGroup.userData.meshes = partGroup.userData.meshes || [];
                partGroup.userData.meshes.push({
                    mesh: mesh,
                    originalParent: mesh.parent,
                    originalPosition: mesh.position.clone(),
                    originalRotation: mesh.rotation.clone(),
                    worldPosition: worldPos
                });
            });
            
            const isCenterPart = (i === Math.floor(partsCount / 2));
            const partColor = isCenterPart ? 0x4facfe : 0x808080;
            
            partMeshes.forEach(mesh => {
                if (mesh.material) {
                    const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
                    materials.forEach(mat => {
                        mat.color.setHex(partColor);
                        mat.metalness = 0.6;
                        mat.roughness = 0.4;
                    });
                }
            });
            
            partGroup.userData.originalPositions = [];
            partGroup.userData.direction = new THREE.Vector3(
                (Math.random() - 0.5) * 2,
                (Math.random() - 0.5) * 2,
                (Math.random() - 0.5) * 2
            ).normalize();
            
            droneParts.push(partGroup);
        }
    }
}

function setupScrollAnimations() {
    gsap.registerPlugin(ScrollTrigger);

    const droneObject = drone;

    gsap.timeline({
        scrollTrigger: {
            trigger: "#screen1",
            start: "top top",
            end: "bottom top",
            scrub: 1
        }
    })
    .to(droneObject.rotation, { y: Math.PI * 0.2, duration: 1 })
    .to(droneObject.position, { y: 0, duration: 1 }, "<");

    gsap.timeline({
        scrollTrigger: {
            trigger: "#screen2",
            start: "top top",
            end: "bottom top",
            scrub: 1
        }
    })
    .to(camera.position, { x: 0.2, y: 0.25, z: 0.5, duration: 1 })
    .to(droneObject.rotation, { y: Math.PI * 0.5, x: -Math.PI * 0.1, duration: 1 }, "<");

    gsap.timeline({
        scrollTrigger: {
            trigger: "#screen3",
            start: "top top",
            end: "bottom top",
            scrub: 1
        }
    })
    .to(camera.position, { x: -0.2, y: 0.2, z: 0.5, duration: 1 })
    .to(droneObject.rotation, { y: Math.PI * 0.8, x: Math.PI * 0.1, duration: 1 }, "<");

    gsap.timeline({
        scrollTrigger: {
            trigger: "#screen4",
            start: "top top",
            end: "bottom top",
            scrub: 1,
            onUpdate: (self) => {
                const progress = self.progress;
                disassembleDrone(progress * 0.4);
            }
        }
    })
    .to(camera.position, { x: 0, y: 0.3, z: 1.2, duration: 1 })
    .to(droneObject.rotation, { y: Math.PI * 1.2, x: 0, duration: 1 }, "<");

    gsap.timeline({
        scrollTrigger: {
            trigger: "#screen5",
            start: "top top",
            end: "bottom top",
            scrub: 1,
            onUpdate: (self) => {
                const progress = 0.4 + (self.progress * 0.3);
                disassembleDrone(progress);
            }
        }
    })
    .to(droneObject.rotation, { y: Math.PI * 1.6, duration: 1 });

    gsap.timeline({
        scrollTrigger: {
            trigger: "#screen6",
            start: "top top",
            end: "bottom top",
            scrub: 1,
            onUpdate: (self) => {
                const progress = 0.7 - (self.progress * 0.7);
                disassembleDrone(progress);
            }
        }
    })
    .to(droneObject.rotation, { y: Math.PI * 2, duration: 1 })
    .to(camera.position, { x: 0, y: 0.3, z: 0.8, duration: 1 }, "<");

    gsap.timeline({
        scrollTrigger: {
            trigger: "#screen7",
            start: "top top",
            end: "bottom top",
            scrub: 1
        }
    })
    .to(droneObject.scale, { x: 0.01, y: 0.01, z: 0.01, duration: 1 })
    .to(droneObject.rotation, { y: Math.PI * 2.5, duration: 1 }, "<");

    gsap.timeline({
        scrollTrigger: {
            trigger: "#screen8",
            start: "top top",
            end: "bottom top",
            scrub: 1
        }
    })
    .to(droneObject.scale, { x: 1, y: 1, z: 1, duration: 1 })
    .to(droneObject.rotation, { y: Math.PI * 3, duration: 1 }, "<");

    gsap.timeline({
        scrollTrigger: {
            trigger: "#screen9",
            start: "top top",
            end: "bottom top",
            scrub: 1
        }
    })
    .to(droneObject.rotation, { y: Math.PI * 5, duration: 1, ease: "none" });
}

function disassembleDrone(progress) {
    const maxDistance = 0.5;
    
    droneParts.forEach((part, index) => {
        const meshes = part.userData.meshes || [];
        const direction = part.userData.direction;
        
        meshes.forEach(meshData => {
            const { mesh, originalPosition } = meshData;
            const offset = direction.clone().multiplyScalar(progress * maxDistance * (1 + index * 0.2));
            mesh.position.copy(originalPosition).add(offset);
            
            mesh.rotation.x = meshData.originalRotation.x + (progress * Math.PI * 0.5);
            mesh.rotation.y = meshData.originalRotation.y + (progress * Math.PI * 0.3);
        });
    });
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
}

function hideLoading() {
    const loadingScreen = document.querySelector('.loading-screen');
    if (loadingScreen) {
        loadingScreen.classList.add('hidden');
        setTimeout(() => loadingScreen.remove(), 500);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const loadingHTML = `
        <div class="loading-screen">
            <div class="loading-text">Loading Drone Model...</div>
            <div class="loading-bar">
                <div class="loading-progress"></div>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('afterbegin', loadingHTML);
    
    init();
});
