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
    const manager = new THREE.LoadingManager();
    
    manager.onError = function(url) {
        console.warn('There was an error loading: ' + url);
    };
    
    const loader = new THREE.GLTFLoader(manager);
    
    console.log('Starting to load GLTF model...');
    
    loader.load(
        'attached_assets/result2_1761173319946.gltf',
        function(gltf) {
            console.log('GLTF loaded successfully!', gltf);
            drone = gltf.scene;
            
            console.log('Drone scene:', drone);
            console.log('Drone children:', drone.children.length);
            
            drone.traverse((child) => {
                if (child.isMesh && child.material) {
                    const materials = Array.isArray(child.material) ? child.material : [child.material];
                    materials.forEach(mat => {
                        if (mat.map) mat.map = null;
                        if (mat.normalMap) mat.normalMap = null;
                        if (mat.roughnessMap) mat.roughnessMap = null;
                        if (mat.metalnessMap) mat.metalnessMap = null;
                        mat.needsUpdate = true;
                    });
                }
            });
            
            const box = new THREE.Box3().setFromObject(drone);
            box.getCenter(droneCenter);
            
            console.log('Drone center:', droneCenter);
            
            drone.position.sub(droneCenter);
            
            const size = new THREE.Vector3();
            box.getSize(size);
            const maxDim = Math.max(size.x, size.y, size.z);
            const scale = 0.4 / maxDim;
            drone.scale.setScalar(scale);
            
            console.log('Drone scale:', scale);
            
            separateDroneIntoParts();
            
            scene.add(drone);
            
            console.log('Drone added to scene');
            
            setupScrollAnimations();
            
            hideLoading();
        },
        function(xhr) {
            if (xhr.lengthComputable) {
                const percentComplete = (xhr.loaded / xhr.total) * 100;
                console.log('Loading: ' + Math.round(percentComplete) + '%');
            }
        },
        function(error) {
            console.error('Error loading model:', error);
            if (error.message) console.error('Error message:', error.message);
            if (error.stack) console.error('Error stack:', error.stack);
            
            createFallbackDrone();
            hideLoading();
        }
    );
}

function createFallbackDrone() {
    console.log('Creating fallback drone geometry...');
    
    drone = new THREE.Group();
    
    const centerGeometry = new THREE.BoxGeometry(0.08, 0.02, 0.08);
    const centerMaterial = new THREE.MeshPhongMaterial({ 
        color: 0x4facfe,
        shininess: 60
    });
    const centerPart = new THREE.Mesh(centerGeometry, centerMaterial);
    drone.add(centerPart);
    
    const armLength = 0.12;
    const armPositions = [
        [armLength, 0, armLength],
        [-armLength, 0, armLength],
        [-armLength, 0, -armLength],
        [armLength, 0, -armLength]
    ];
    
    armPositions.forEach((pos, index) => {
        const armGeometry = new THREE.CylinderGeometry(0.005, 0.005, armLength, 8);
        const propellerGeometry = new THREE.CylinderGeometry(0.025, 0.025, 0.005, 16);
        
        const greyMaterial = new THREE.MeshPhongMaterial({ 
            color: 0x808080,
            shininess: 60
        });
        
        const angle = Math.atan2(pos[2], pos[0]);
        const arm = new THREE.Mesh(armGeometry, greyMaterial);
        arm.position.set(pos[0]/2, 0, pos[2]/2);
        arm.rotation.z = angle - Math.PI/2;
        
        const propeller = new THREE.Mesh(propellerGeometry, greyMaterial);
        propeller.position.set(pos[0], 0.015, pos[2]);
        
        drone.add(arm);
        drone.add(propeller);
    });
    
    scene.add(drone);
    
    createFallbackParts();
    
    setupScrollAnimations();
    
    console.log('Fallback drone created');
}

function createFallbackParts() {
    const meshes = [];
    let centerMesh = null;
    
    drone.traverse((child) => {
        if (child.isMesh) {
            if (child.material && child.material.color && child.material.color.getHex() === 0x4facfe) {
                centerMesh = child;
            } else {
                meshes.push(child);
            }
        }
    });
    
    const partsCount = 1;
    droneParts.length = 0;
    
    for (let i = 0; i < partsCount; i++) {
        const partGroup = new THREE.Group();
        partGroup.userData.meshes = [];
        
        if (i === 0 && centerMesh) {
            partGroup.userData.meshes.push({
                mesh: centerMesh,
                originalPosition: centerMesh.position.clone(),
                originalRotation: centerMesh.rotation.clone()
            });
        }
        
        meshes.forEach((mesh, meshIndex) => {
            if (meshIndex % (partsCount - 1) === (i < 1 ? i : i - 1) && i !== 3) {
                partGroup.userData.meshes.push({
                    mesh: mesh,
                    originalPosition: mesh.position.clone(),
                    originalRotation: mesh.rotation.clone()
                });
            }
        });
        
        partGroup.userData.direction = new THREE.Vector3(
            (Math.random() - 0.5) * 2,
            (Math.random() - 0.5) * 2,
            (Math.random() - 0.5) * 2
        ).normalize();
        
        droneParts.push(partGroup);
    }
}

function separateDroneIntoParts() {
    const allMeshes = [];
    drone.traverse((child) => {
        if (child.isMesh) {
            allMeshes.push(child);
        }
    });

    const partsCount = 6;
    const centerPartIndex = 3;
    droneParts.length = 0;

    for (let i = 0; i < partsCount; i++) {
        const partGroup = new THREE.Group();
        partGroup.userData.meshes = [];
        
        const isCenterPart = (i === centerPartIndex);
        const partColor = isCenterPart ? 0x4facfe : 0x808080;
        
        allMeshes.forEach((mesh, meshIndex) => {
            const assignedPart = (meshIndex % partsCount);
            
            if (assignedPart === i) {
                const worldPos = new THREE.Vector3();
                mesh.getWorldPosition(worldPos);
                
                partGroup.userData.meshes.push({
                    mesh: mesh,
                    originalParent: mesh.parent,
                    originalPosition: mesh.position.clone(),
                    originalRotation: mesh.rotation.clone(),
                    worldPosition: worldPos
                });
                
                if (mesh.material) {
                    const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
                    materials.forEach(mat => {
                        mat.color.setHex(partColor);
                        if (mat.metalness !== undefined) mat.metalness = 0.6;
                        if (mat.roughness !== undefined) mat.roughness = 0.4;
                    });
                }
            }
        });
        
        partGroup.userData.direction = new THREE.Vector3(
            (Math.random() - 0.5) * 2,
            (Math.random() - 0.5) * 2,
            (Math.random() - 0.5) * 2
        ).normalize();
        
        droneParts.push(partGroup);
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
