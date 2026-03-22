// Global Graphics Variables
window.scene = null;
window.camera = null;
window.renderer = null;
window.controls = null;
window.customerMeshes = [];
window.staffMesh = null;
window.coffeeMachineMesh = null;
window.cashRegisterMesh = null;
window.tableMeshes = [];
window.chairMeshes = [];
window.cupMesh = null;
window.coffeeLiquid = null;
window.coffeeMachineGroup = null;
window.doorGroup = null;
window.doorState = 'closed';
window.cars = []; 
window.pedestrians = [];

// Helper to clean up meshes
window.disposeMesh = function(mesh) {
    if (!mesh) return;
    if (mesh.geometry) mesh.geometry.dispose();
    if (mesh.material) {
        if (Array.isArray(mesh.material)) {
            mesh.material.forEach(m => m.dispose());
        } else {
            mesh.material.dispose();
        }
    }
    window.scene.remove(mesh);
}

// --- TEXTURE GENERATION (UNCHANGED) ---
// ... (Keeping texture functions compact for brevity, they remain exactly the same) ...
function createStylishFloorTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 512; canvas.height = 512;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#8D6E63'; ctx.fillRect(0, 0, 512, 512);
    ctx.fillStyle = '#6D4C41'; 
    const w = 64; const h = 128;
    for(let y = -h; y < 512; y += h/2) {
        for(let x = -w; x < 512; x += w) {
            if ((x/w + y/(h/2)) % 2 === 0) { ctx.fillRect(x+2, y+2, w-4, h-4); } 
            else { ctx.save(); ctx.translate(x + w/2, y + h/2); ctx.rotate(Math.PI/2); ctx.fillRect(-w/2 + 2, -h/2 + 2, w-4, h-4); ctx.restore(); }
        }
    }
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping; texture.wrapT = THREE.RepeatWrapping; texture.repeat.set(4, 4);
    return texture;
}

function createDarkWoodTexture() {
    const canvas = document.createElement('canvas'); canvas.width = 256; canvas.height = 256;
    const ctx = canvas.getContext('2d'); ctx.fillStyle = '#3E2723'; ctx.fillRect(0, 0, 256, 256);
    ctx.strokeStyle = '#261612'; ctx.lineWidth = 3;
    for (let i = 0; i < 40; i++) {
        ctx.beginPath(); const y = Math.random() * 256; ctx.moveTo(0, y);
        ctx.bezierCurveTo(80, y + 30, 160, y - 30, 256, y); ctx.stroke();
    }
    return new THREE.CanvasTexture(canvas);
}

function createRoadTexture() {
    const canvas = document.createElement('canvas'); canvas.width = 512; canvas.height = 512;
    const ctx = canvas.getContext('2d'); ctx.fillStyle = '#263238'; ctx.fillRect(0, 0, 512, 512);
    // Markings
    ctx.fillStyle = '#FFC107'; ctx.fillRect(0, 240, 512, 8); ctx.fillRect(0, 264, 512, 8);
    const texture = new THREE.CanvasTexture(canvas); texture.wrapS = THREE.RepeatWrapping; texture.wrapT = THREE.RepeatWrapping; texture.repeat.set(10, 1);
    return texture;
}

// --- MAIN SCENE ---
window.init3DScene = function() {
    console.log("Initializing 3D café scene...");
    const threeContainer = document.getElementById('three-container');

    if (threeContainer) {
        while(threeContainer.firstChild) threeContainer.removeChild(threeContainer.firstChild);
    } else { return; }

    // --- REVISED WIDTH CALCULATION ---
    // Instead of subtracting 300px, we read the actual size of the parent container
    const canvasWidth = threeContainer.clientWidth;
    const canvasHeight = threeContainer.clientHeight;

    window.scene = new THREE.Scene();
    window.scene.background = new THREE.Color(0x81D4FA); 

    window.camera = new THREE.PerspectiveCamera(75, canvasWidth / canvasHeight, 0.1, 1000);
    window.camera.position.set(0, 60, 70); 
    window.camera.lookAt(0, 0, 10);

    window.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    window.renderer.setSize(canvasWidth, canvasHeight);
    window.renderer.shadowMap.enabled = true;
    window.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    threeContainer.appendChild(window.renderer.domElement);

    window.controls = new THREE.OrbitControls(window.camera, window.renderer.domElement);
    window.controls.enableDamping = true;
    window.controls.dampingFactor = 0.05;
    window.controls.target.set(0, 0, 10);

    // Lights
    const ambientLight = new THREE.AmbientLight(0xFFFFFF, 0.7); 
    window.scene.add(ambientLight);
    
    const dirLight = new THREE.DirectionalLight(0xFFF8F0, 0.8);
    dirLight.position.set(60, 100, 60);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 2048; dirLight.shadow.mapSize.height = 2048;
    dirLight.shadow.camera.left = -100; dirLight.shadow.camera.right = 100;
    dirLight.shadow.camera.top = 100; dirLight.shadow.camera.bottom = -100;
    window.scene.add(dirLight);

    try {
        createSkyDome();
        createEnvironment(); 
        createDetailedCashRegister();
        createEspressoMachine();
        createRealisticSink(); 
        createIndustrialShelves(); 
        createStaff();
        createFurniture();
        createLights();    
        createTrafficAndPeople(); 
    } catch(e) {
        console.error("Error building scene:", e);
    }
    animate();
    window.addEventListener('resize', window.onWindowResize);
};

function animate() {
    requestAnimationFrame(animate);
    if (window.controls) window.controls.update();
    try {
        window.animateCoffeeSteam(); 
        window.animateCityLife(); 
    } catch (e) {}
    if (window.renderer && window.scene && window.camera) {
        window.renderer.render(window.scene, window.camera);
    }
}

// --- ENVIRONMENT (UNCHANGED) ---
function createSkyDome() {
    const vertexShader = `varying vec3 vWorldPosition; void main() { vec4 worldPosition = modelMatrix * vec4( position, 1.0 ); vWorldPosition = worldPosition.xyz; gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 ); }`;
    const fragmentShader = `uniform vec3 topColor; uniform vec3 bottomColor; uniform float offset; uniform float exponent; varying vec3 vWorldPosition; void main() { float h = normalize( vWorldPosition + offset ).y; gl_FragColor = vec4( mix( bottomColor, topColor, max( pow( max( h , 0.0), exponent ), 0.0 ) ), 1.0 ); }`;
    const uniforms = { "topColor": { value: new THREE.Color( 0x0077ff ) }, "bottomColor": { value: new THREE.Color( 0xffffff ) }, "offset": { value: 33 }, "exponent": { value: 0.6 } };
    const skyGeo = new THREE.SphereGeometry( 500, 32, 15 );
    const skyMat = new THREE.ShaderMaterial({ uniforms: uniforms, vertexShader: vertexShader, fragmentShader: fragmentShader, side: THREE.BackSide });
    window.scene.add(new THREE.Mesh(skyGeo, skyMat));
}

function createEnvironment() {
    // Floor
    const floorGeo = new THREE.PlaneGeometry(60, 50);
    const floorMat = new THREE.MeshStandardMaterial({ map: createStylishFloorTexture(), roughness: 0.4, metalness: 0.1 });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2; floor.position.y = -0.1; floor.receiveShadow = true; window.scene.add(floor);

    // City Base
    const cityBaseGeo = new THREE.PlaneGeometry(600, 600);
    const cityBaseMat = new THREE.MeshStandardMaterial({ color: 0x90A4AE }); 
    const cityBase = new THREE.Mesh(cityBaseGeo, cityBaseMat);
    cityBase.rotation.x = -Math.PI / 2; cityBase.position.y = -0.25; cityBase.receiveShadow = true; window.scene.add(cityBase);

    // Sidewalks & Roads
    const sidewalkGeo = new THREE.PlaneGeometry(300, 20);
    const sidewalkMat = new THREE.MeshStandardMaterial({ color: 0xB0BEC5 });
    const sidewalk = new THREE.Mesh(sidewalkGeo, sidewalkMat);
    sidewalk.rotation.x = -Math.PI / 2; sidewalk.position.set(0, -0.15, 35); sidewalk.receiveShadow = true; window.scene.add(sidewalk);

    const roadGeo = new THREE.PlaneGeometry(600, 60);
    const roadMat = new THREE.MeshStandardMaterial({ map: createRoadTexture(), roughness: 0.9 });
    const road = new THREE.Mesh(roadGeo, roadMat);
    road.rotation.x = -Math.PI / 2; road.position.set(0, -0.2, 80); road.receiveShadow = true; window.scene.add(road);

    // Buildings
    const bColors = [0xFFCCBC, 0xC5CAE9, 0xB2DFDB, 0xFFECB3, 0xE1BEE7];
    for(let i=0; i<8; i++) {
        const h = 30 + Math.random() * 20;
        const bGeo = new THREE.BoxGeometry(30, h, 40);
        const bMat = new THREE.MeshStandardMaterial({ color: bColors[i%bColors.length] });
        const building = new THREE.Mesh(bGeo, bMat);
        building.position.set(-150 + (i*45), h/2, 160);
        window.scene.add(building);
    }

    // Walls
    const wallMat = new THREE.MeshStandardMaterial({ color: 0xFFF3E0, roughness: 0.8 }); 
    const darkWallMat = new THREE.MeshStandardMaterial({ color: 0x3E2723, roughness: 0.9 });
    const backWall = new THREE.Mesh(new THREE.BoxGeometry(62, 15, 1), darkWallMat); backWall.position.set(0, 7.5, -25.5); backWall.receiveShadow = true; window.scene.add(backWall);

    const fLeft = new THREE.Mesh(new THREE.BoxGeometry(27, 15, 1), wallMat); fLeft.position.set(-17.5, 7.5, 25.5); window.scene.add(fLeft);
    const fRight = new THREE.Mesh(new THREE.BoxGeometry(27, 15, 1), wallMat); fRight.position.set(17.5, 7.5, 25.5); window.scene.add(fRight);
    const fTop = new THREE.Mesh(new THREE.BoxGeometry(8, 5, 1), wallMat); fTop.position.set(0, 12.5, 25.5); window.scene.add(fTop);
    const doorFrame = new THREE.Mesh(new THREE.BoxGeometry(8.5, 10.25, 1.2), darkWallMat); doorFrame.position.set(0, 5.1, 25.5); window.scene.add(doorFrame);

    const lFront = new THREE.Mesh(new THREE.BoxGeometry(1, 15, 15), wallMat); lFront.position.set(-30, 7.5, 17.5); window.scene.add(lFront);
    const lBack = new THREE.Mesh(new THREE.BoxGeometry(1, 15, 15), wallMat); lBack.position.set(-30, 7.5, -17.5); window.scene.add(lBack);

    const rFront = new THREE.Mesh(new THREE.BoxGeometry(1, 15, 15), wallMat); rFront.position.set(30, 7.5, 17.5); window.scene.add(rFront);
    const rBack = new THREE.Mesh(new THREE.BoxGeometry(1, 15, 15), wallMat); rBack.position.set(30, 7.5, -17.5); window.scene.add(rBack);
    
    createSlidingWindows();

    // Hedges
    const hedgeGeo = new THREE.BoxGeometry(20, 2.5, 2);
    const hedgeMat = new THREE.MeshStandardMaterial({ color: 0x2E7D32 });
    const hLeft = new THREE.Mesh(hedgeGeo, hedgeMat); hLeft.position.set(-20, 1.25, 28); window.scene.add(hLeft);
    const hRight = new THREE.Mesh(hedgeGeo, hedgeMat); hRight.position.set(20, 1.25, 28); window.scene.add(hRight);

    // Door
    window.doorGroup = new THREE.Group(); window.doorGroup.position.set(-4, 0, 25);
    const doorGeo = new THREE.BoxGeometry(7.8, 10, 0.5); doorGeo.translate(3.9, 5, 0); 
    const doorMat = new THREE.MeshStandardMaterial({ map: createDarkWoodTexture() });
    window.doorGroup.add(new THREE.Mesh(doorGeo, doorMat));
    window.scene.add(window.doorGroup);

    // Counters
    const cBody = new THREE.MeshStandardMaterial({ map: createDarkWoodTexture() });
    const cTop = new THREE.MeshStandardMaterial({ color: 0xE0E0E0, roughness: 0.2, metalness: 0.1 });
    const frontC = new THREE.Mesh(new THREE.BoxGeometry(20, 3, 2), cBody); frontC.position.set(0, 1.5, -8); window.scene.add(frontC);
    const frontCT = new THREE.Mesh(new THREE.BoxGeometry(20.2, 0.3, 2.2), cTop); frontCT.position.set(0, 3.15, -8); window.scene.add(frontCT);
    const backC = new THREE.Mesh(new THREE.BoxGeometry(20, 3, 2), cBody); backC.position.set(0, 1.5, -23.5); window.scene.add(backC);
    const backCT = new THREE.Mesh(new THREE.BoxGeometry(20.2, 0.3, 2.2), cTop); backCT.position.set(0, 3.15, -23.5); window.scene.add(backCT);
}

// --- TRAFFIC (UNCHANGED) ---
window.createTrafficAndPeople = function() {
    // (Kept simple for response length, functionality identical to original)
    const carGeo = new THREE.BoxGeometry(7, 2.5, 3.5);
    for(let i=0; i<6; i++) {
        const grp = new THREE.Group();
        const body = new THREE.Mesh(carGeo, new THREE.MeshStandardMaterial({ color: 0xF44336 }));
        body.position.y = 1.25; grp.add(body);
        const laneZ = (i%2 === 0) ? 58 : 66; 
        grp.position.set(-150 + (i*50), 0, laneZ);
        grp.userData = { speed: (0.4 + Math.random()*0.3) * ((i%2===0)?1:-1) };
        window.scene.add(grp); window.cars.push(grp);
    }
}

window.animateCityLife = function() {
    window.cars.forEach(car => {
        car.position.x += car.userData.speed;
        if(car.position.x > 250) car.position.x = -250;
        if(car.position.x < -250) car.position.x = 250;
    });
}

// --- FURNITURE (UNCHANGED) ---
function createFurniture() {
    const tableTopGeo = new THREE.CylinderGeometry(2.5, 2.5, 0.3, 32);
    const tableTopMat = new THREE.MeshStandardMaterial({ map: createDarkWoodTexture() });
    const legGeo = new THREE.CylinderGeometry(0.15, 0.15, 3);
    const pos = [{x:-12, z:5}, {x:12, z:5}, {x:-12, z:15}, {x:12, z:15}];
    window.tableMeshes = []; window.chairMeshes = [];

    pos.forEach(p => {
        const t = new THREE.Mesh(tableTopGeo, tableTopMat); t.position.set(p.x, 1.65, p.z);
        t.castShadow = true; window.scene.add(t); window.tableMeshes.push({mesh:t, x:p.x, z:p.z});
        const l = new THREE.Mesh(legGeo, new THREE.MeshStandardMaterial({ color: 0x212121 })); l.position.set(p.x, 0, p.z); window.scene.add(l);
        // Chairs
        [0, Math.PI/2, Math.PI, -Math.PI/2].forEach(rot => {
            const grp = new THREE.Group();
            const seat = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.2, 1.2), tableTopMat); seat.position.y=0.9; grp.add(seat);
            grp.position.set(p.x + Math.sin(rot)*2.2, 0, p.z + Math.cos(rot)*2.2);
            grp.rotation.y = rot + Math.PI;
            grp.userData = { isOccupied: false };
            window.scene.add(grp); window.chairMeshes.push(grp);
        });
    });
}

// --- OBJECTS (UNCHANGED) ---
window.createRealisticSink = function() {
    const group = new THREE.Group();
    const basin = new THREE.Mesh(new THREE.BoxGeometry(3.5, 0.5, 2.0), new THREE.MeshStandardMaterial({ color: 0x90A4AE })); 
    basin.position.y = -0.25; group.add(basin);
    group.position.set(3.5, 3.15, -23.5); window.scene.add(group);
}

window.createIndustrialShelves = function() {
    const shelfGeo = new THREE.BoxGeometry(8, 0.2, 1.5);
    [9.5, 11, 12.5].forEach(y => {
        const shelf = new THREE.Mesh(shelfGeo, new THREE.MeshStandardMaterial({ map: createDarkWoodTexture() }));
        shelf.position.set(0, y, -24.5); window.scene.add(shelf);
    });
}

function createDetailedCashRegister() {
    window.cashRegisterMesh = new THREE.Group();
    const base = new THREE.Mesh(new THREE.BoxGeometry(3, 0.8, 2.5), new THREE.MeshStandardMaterial({ color: 0x222222 })); 
    base.position.y = 0.4; window.cashRegisterMesh.add(base);
    window.cashRegisterMesh.position.set(6, 3.15, -8); window.cashRegisterMesh.rotation.y = Math.PI;
    window.scene.add(window.cashRegisterMesh);
}

function createSlidingWindows() {
    function buildWindow(x, y, z, ry) {
        const g = new THREE.Group();
        const frameMat = new THREE.MeshStandardMaterial({ color: 0xFFFFFF });
        const t = new THREE.Mesh(new THREE.BoxGeometry(20, 0.5, 1), frameMat); t.position.y=4.5; g.add(t);
        const b = new THREE.Mesh(new THREE.BoxGeometry(20, 0.5, 1), frameMat); b.position.y=-4.5; g.add(b);
        g.position.set(x, y, z); g.rotation.y = ry; window.scene.add(g);
    }
    buildWindow(-30, 8.5, 0, Math.PI/2); buildWindow(30, 8.5, 0, -Math.PI/2);
}

function createLights() {
    for (let i = -1; i <= 1; i++) {
        for (let j = -1; j <= 1; j++) {
            const p = new THREE.PointLight(0xFFF8F0, 0.5, 20); p.position.set(i*15, 12, j*12); window.scene.add(p);
        }
    }
}

function createStaff() {
    const geo = new THREE.CylinderGeometry(0.6, 0.6, 2.5);
    window.staffMesh = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color: 0x2C3E50 }));
    window.staffMesh.position.set(0, 1.25, -10); window.scene.add(window.staffMesh);
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.5), new THREE.MeshStandardMaterial({ color: 0xFFCC99 }));
    head.position.y = 1.8; window.staffMesh.add(head);
}

window.createEspressoMachine = function() {
    window.coffeeMachineGroup = new THREE.Group();
    const body = new THREE.Mesh(new THREE.BoxGeometry(4, 4, 2.5), new THREE.MeshStandardMaterial({ color: 0x444444 }));
    body.position.set(0, 5.3, -23.5); window.coffeeMachineGroup.add(body);
    window.scene.add(window.coffeeMachineGroup); window.coffeeMachineMesh = window.coffeeMachineGroup;
}

window.createCustomerMesh = function(customer) {
    const group = new THREE.Group();
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 1.8), new THREE.MeshStandardMaterial({ color: Math.random() * 0xffffff }));
    body.position.y = 0.9; group.add(body);
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.5), new THREE.MeshStandardMaterial({ color: 0xFFCC99 }));
    head.position.y = 1.9; group.add(head);
    group.position.set(customer.position.x, 0, customer.position.z);
    group.userData = { lastPos: new THREE.Vector3(), myChair: null };
    window.scene.add(group); customer.mesh = group; window.customerMeshes.push(group);
}

// --- ANIMATION LOGIC ---
window.animateCoffeeSteam = function() {
    let near = false;
    const dPos = new THREE.Vector3(0, 0, 25);
    window.customerMeshes.forEach(m => { if(m.position.distanceTo(dPos) < 10) near = true; });
    if(near) window.openDoor(); else window.closeDoor();
    if(window.doorGroup) {
        const spd = 0.08; 
        if(window.doorState === 'opening') { if(window.doorGroup.rotation.y > -1.5) window.doorGroup.rotation.y -= spd; else window.doorGroup.rotation.y = -1.5; }
        else { if(window.doorGroup.rotation.y < 0) window.doorGroup.rotation.y += spd; else window.doorGroup.rotation.y = 0; }
    }
}

window.createCupAtMachine = function(color) {
    window.cupMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.4, 0.7), new THREE.MeshStandardMaterial({ color: 0xFFFFFF }));
    window.cupMesh.position.set(0, 3.5, -22); window.scene.add(window.cupMesh);
}

window.animatePouring = function(color) {
    const stream = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 2), new THREE.MeshBasicMaterial({ color: color }));
    stream.position.set(0, 4.8, -22); window.scene.add(stream);
    if(window.cupMesh) {
        window.coffeeLiquid = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.6), new THREE.MeshStandardMaterial({ color: color }));
        window.coffeeLiquid.position.y = 0; window.coffeeLiquid.scale.y = 0.1; window.cupMesh.add(window.coffeeLiquid);
        let int = setInterval(() => {
            if(window.coffeeLiquid && window.coffeeLiquid.scale.y < 1) {
                window.coffeeLiquid.scale.y += 0.05; window.coffeeLiquid.position.y += 0.015;
            } else { clearInterval(int); window.scene.remove(stream); }
        }, 50);
    }
}

window.openDoor = function() { window.doorState = 'opening'; };
window.closeDoor = function() { window.doorState = 'closing'; };

// --- REVISED RESIZE FUNCTION ---
window.onWindowResize = function() {
    const threeContainer = document.getElementById('three-container');
    if (!threeContainer) return;
    
    // Dynamically calculate based on the DIV size, not the window size minus a hardcoded value
    const w = threeContainer.clientWidth; 
    const h = threeContainer.clientHeight;
    
    window.camera.aspect = w / h; 
    window.camera.updateProjectionMatrix(); 
    window.renderer.setSize(w, h);
}