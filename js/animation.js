// ==========================================
// ANIMATION.JS - The Movement Engine
// ==========================================

// This function starts the render loop
window.startAnimationLoop = function() {
    console.log("Animation Engine Started");
    animate();
};

function animate() {
    requestAnimationFrame(animate);
    
    // 1. Update Camera
    if(window.controls) window.controls.update();

    // 2. Run Game Logic (Day Progress, Spawning)
    // We check if game.js has defined logic functions to run
    if (window.gameLoopLogic) window.gameLoopLogic();

    // 3. ANIMATE ENTITIES
    animateCustomers();
    animateStaff();
    animateChairs();
    animateEffects();

    // 4. RENDER
    if(window.renderer && window.scene && window.camera) {
        window.renderer.render(window.scene, window.camera);
    }
}

// ==========================================
// CUSTOMER BEHAVIOR (The "Sit & Jump")
// ==========================================
function animateCustomers() {
    if(!window.gameState || !window.gameState.customers) return;

    // Cleanup: Remove 3D meshes if the customer is gone from data
    cleanupMeshes();

    gameState.customers.forEach(customerData => {
        // Link Visual Mesh to Data ID
        let mesh = window.customerMeshes.find(m => m.userData.id === customerData.id);
        
        // Safety: Create mesh if missing
        if(!mesh && window.createCustomerVisuals) {
            mesh = window.createCustomerVisuals(customerData.id);
        }
        if(!mesh) return;

        // --- STATE MACHINE ---
        // We look at the visual state (userData.logicState) to decide movement

        const POS_COUNTER = new THREE.Vector3(6, 0, 8); // The Order Zone

        // CASE 1: Walking to Counter
        if (mesh.userData.logicState === 'entering') {
            moveTo(mesh, POS_COUNTER, 0.15); // Fast walk

            // Check Arrival
            if (mesh.position.distanceTo(POS_COUNTER) < 0.5) {
                mesh.userData.logicState = 'ordering';
                mesh.userData.waitTimer = 0;
            }
        }
        
        // CASE 2: Ordering (Waiting)
        else if (mesh.userData.logicState === 'ordering') {
            mesh.userData.waitTimer++;
            // Rotate to face counter
            mesh.rotation.y = lerp(mesh.rotation.y, Math.PI, 0.1); 
            
            // Wait approx 2 seconds (120 frames), then find a seat
            if (mesh.userData.waitTimer > 120) {
                const chair = assignRandomChair(mesh);
                if (chair) {
                    mesh.userData.logicState = 'walking_to_seat';
                    mesh.userData.hasOrdered = true;
                }
            }
        }

        // CASE 3: Walking to Chair
        else if (mesh.userData.logicState === 'walking_to_seat') {
            const chair = mesh.userData.myChair;
            if (!chair) return; // Safety

            const seatTarget = new THREE.Vector3(chair.position.x, 0, chair.position.z);
            const dist = mesh.position.distanceTo(seatTarget);

            if (dist > 1.5) {
                moveTo(mesh, seatTarget, 0.1);
            } else {
                // Arrived at Chair! Switch to Sitting Animation
                mesh.userData.logicState = 'sitting';
            }
        }

        // CASE 4: The "Sit & Jump" Interaction
        else if (mesh.userData.logicState === 'sitting') {
            const chair = mesh.userData.myChair;
            
            // A. Slide Chair Out (Smooth Lerp)
            const pullPos = chair.userData.pulledPos;
            chair.position.x = lerp(chair.position.x, pullPos.x, 0.05);
            chair.position.z = lerp(chair.position.z, pullPos.z, 0.05);

            // B. Move Customer to Seat Center
            mesh.position.x = lerp(mesh.position.x, chair.position.x, 0.1);
            mesh.position.z = lerp(mesh.position.z, chair.position.z, 0.1);

            // C. JUMP UP (The requested animation)
            // Target Y = 1.8 (Standing on seat)
            mesh.position.y = lerp(mesh.position.y, 1.8, 0.1);

            // D. Face Table
            mesh.rotation.y = lerp(mesh.rotation.y, chair.userData.angle + Math.PI, 0.1);
        }
    });
}

// ==========================================
// CHAIR LOGIC (Slide Back In)
// ==========================================
function animateChairs() {
    window.chairMeshes.forEach(chair => {
        // If the chair is NOT marked occupied by a customer, slide it in
        if (!chair.userData.occupied) {
            const orig = chair.userData.originalPos;
            chair.position.x = lerp(chair.position.x, orig.x, 0.05);
            chair.position.z = lerp(chair.position.z, orig.z, 0.05);
        }
    });
}

// ==========================================
// STAFF ANIMATION
// ==========================================
function animateStaff() {
    if (!window.staffMesh) return;

    // Staff moves between Register and Machine depending on orders
    const POS_REGISTER = new THREE.Vector3(6, 0.9, -15);
    const POS_MACHINE = new THREE.Vector3(0, 0.9, -28);

    // Check if anyone is sitting (meaning they ordered)
    const hasActiveOrders = window.customerMeshes.some(c => c.userData.logicState === 'sitting');
    
    const target = hasActiveOrders ? POS_MACHINE : POS_REGISTER;

    // Move Staff
    window.staffMesh.position.x = lerp(window.staffMesh.position.x, target.x, 0.04);
    window.staffMesh.position.z = lerp(window.staffMesh.position.z, target.z, 0.04);
    
    // Face Target
    if (window.staffMesh.position.distanceTo(target) > 0.5) {
        window.staffMesh.lookAt(target.x, window.staffMesh.position.y, target.z);
    } else {
        // If at register, face forward (PI). If at machine, face wall (0).
        const targetRot = hasActiveOrders ? 0 : Math.PI;
        window.staffMesh.rotation.y = lerp(window.staffMesh.rotation.y, targetRot, 0.1);
    }
}

// ==========================================
// UTILITIES & EFFECTS
// ==========================================

function animateEffects() {
    // Steam / Sparkles logic
    if (window.doorGroup) {
        // Open door if someone is close
        const someoneNear = window.customerMeshes.some(m => m.position.distanceTo(new THREE.Vector3(0,0,25)) < 8);
        const targetRot = someoneNear ? -Math.PI/2 : 0;
        window.doorGroup.rotation.y = lerp(window.doorGroup.rotation.y, targetRot, 0.05);
    }
}

// Math Helper: Linear Interpolation
function lerp(start, end, amount) {
    return (1 - amount) * start + amount * end;
}

// Movement Helper: Moves mesh & bobs head
function moveTo(mesh, target, speed) {
    const dir = new THREE.Vector3().subVectors(target, mesh.position).normalize();
    mesh.position.addScaledVector(dir, speed);
    mesh.lookAt(target.x, mesh.position.y, target.z);
    // Walking Bob
    mesh.position.y = Math.abs(Math.sin(Date.now() * 0.015)) * 0.2; 
}

// Logic Helper: Find an empty chair
function assignRandomChair(mesh) {
    const emptyChairs = window.chairMeshes.filter(c => !c.userData.occupied);
    if (emptyChairs.length > 0) {
        const chair = emptyChairs[Math.floor(Math.random() * emptyChairs.length)];
        chair.userData.occupied = true;
        mesh.userData.myChair = chair;
        return chair;
    }
    return null;
}

// Cleanup Helper
function cleanupMeshes() {
    window.customerMeshes = window.customerMeshes.filter(m => {
        const exists = gameState.customers.find(c => c.id === m.userData.id);
        if(!exists) {
            // Free the chair
            if(m.userData.myChair) m.userData.myChair.userData.occupied = false;
            window.scene.remove(m);
            return false;
        }
        return true;
    });
}