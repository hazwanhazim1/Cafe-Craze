// --- GAME LOGIC ---
window.startGameLoop = function() {
    console.log("Café game loop started");
    setTimeout(() => { window.showTutorialTip(); }, 2000);
    setTimeout(() => { window.createCustomer(); }, 3000);

    let gameLoopInterval = setInterval(() => {
        if(gameState.isPaused) return;

        const maxCustomers = gameState.levelConfig[gameState.day] ? gameState.levelConfig[gameState.day].customers : 15;

        // Spawn logic
        if (gameState.customers.length === 0 && gameState.customersServed < maxCustomers) {
            if (Math.random() > 0.7) {
                window.createCustomer();
            }
        }

        // End of Day
        if (gameState.customersServed >= maxCustomers && gameState.customers.length === 0) {
            clearInterval(gameLoopInterval);
            window.showNotification(" 🕒  Business hours are over! Great work today!");

            setTimeout(() => {
                const bonus = Math.floor(gameState.rating * 20);
                gameState.money += bonus;
                window.showNotification(` 🎉  Day ${gameState.day} complete! Bonus: RM${bonus}`);
                
                gameState.day++;
                gameState.customersServed = 0;
                gameState.moneyEarned = 0;
                gameState.dayProgress = 0;

                if(gameState.day === 2) {
                    gameState.recipes[1].unlocked = true; 
                    window.showNotification(" ✨ New Recipe: Café Latte unlocked! ✨ ");
                }
                if(gameState.day === 3) {
                    gameState.recipes[2].unlocked = true;
                    gameState.recipes[3].unlocked = true;
                    window.showNotification(" ✨ New Recipes: Cappuccino & Mocha unlocked! ✨ ");
                }

                window.updateUI();
                window.startGameLoop();
            }, 4000);
        }
    }, 2000);

    animate();
}

function animate() {
    requestAnimationFrame(animate);
    if (!gameState.isPaused) {
        window.moveStaff();
        window.animateCustomers();
        
        // IMPORTANT: Updates the door animation only
        if (window.animateCoffeeSteam) window.animateCoffeeSteam();
        
        const maxCustomers = gameState.levelConfig[gameState.day] ? gameState.levelConfig[gameState.day].customers : 15;
        const progress = (gameState.customersServed / maxCustomers) * 100;
        gameState.dayProgress = progress;
        window.updateUI(); 
    }
    window.controls.update();
    window.renderer.render(window.scene, window.camera);
}

// --- STAFF LOGIC (PATHFINDING) ---
window.moveStaff = function() {
    if (!gameState.staff.busy && gameState.staff.pathQueue && gameState.staff.pathQueue.length > 0) {
        const nextTarget = gameState.staff.pathQueue.shift();
        window.staffGoTo(nextTarget, true); 
        return;
    }

    if (!gameState.staff.target || !gameState.staff.busy) return;

    const dx = gameState.staff.target.x - window.staffMesh.position.x;
    const dz = gameState.staff.target.z - window.staffMesh.position.z;
    const distance = Math.sqrt(dx * dx + dz * dz);

    if (distance > 0.3) {
        const speed = gameState.staff.speed * gameState.gameSpeed;
        window.staffMesh.position.x += (dx / distance) * speed;
        window.staffMesh.position.z += (dz / distance) * speed;
        if (Math.abs(dx) > 0.01 || Math.abs(dz) > 0.01) {
            window.staffMesh.lookAt(window.staffMesh.position.x + dx, window.staffMesh.position.y, window.staffMesh.position.z + dz);
        }
    } else {
        gameState.staff.target = null;
        gameState.staff.busy = false;

        if (gameState.staff.onReachDestination) {
            const callback = gameState.staff.onReachDestination;
            gameState.staff.onReachDestination = null;
            callback();
        }
    }

    if (gameState.staff.holdingDrink && window.cupMesh) {
        window.cupMesh.position.set(window.staffMesh.position.x, 3, window.staffMesh.position.z);
    }
}

window.staffGoTo = function(position, isInternal) {
    if (!isInternal) {
        gameState.staff.pathQueue = []; 
        
        const currentZ = window.staffMesh.position.z;
        const targetZ = position.z;
        
        if (currentZ < -9 && targetZ > -7) {
            gameState.staff.pathQueue.push({ x: 12, z: currentZ }); 
            gameState.staff.pathQueue.push({ x: 12, z: targetZ }); 
            gameState.staff.pathQueue.push(position); 
        } 
        else if (currentZ > -7 && targetZ < -9) {
            gameState.staff.pathQueue.push({ x: 12, z: currentZ });
            gameState.staff.pathQueue.push({ x: 12, z: targetZ });
            gameState.staff.pathQueue.push(position);
        } 
        else {
            gameState.staff.target = position;
            gameState.staff.busy = true;
            return;
        }
        
        const first = gameState.staff.pathQueue.shift();
        gameState.staff.target = first;
        gameState.staff.busy = true;
    } else {
        gameState.staff.target = position;
        gameState.staff.busy = true;
    }
}

// --- CUSTOMER LOGIC ---
window.createCustomer = function() {
    const maxCustomers = gameState.levelConfig[gameState.day] ? gameState.levelConfig[gameState.day].customers : 15;
    if (gameState.customersServed >= maxCustomers) return null;
    if (gameState.customers.length >= 2) return null; 

    const names = ["James", "Sarah", "Michael", "Emma", "David", "Lisa", "Robert", "Julia"];
    const randomName = names[Math.floor(Math.random() * names.length)];
    gameState.lastCustomerId++;

    const availableTable = gameState.tables.find(t => !t.occupied);
    if (!availableTable) return null;

    const chairIndex = Math.floor(Math.random() * availableTable.chairPositions.length);
    const targetChair = availableTable.chairPositions[chairIndex];

    const unlockedRecipes = gameState.recipes.filter(recipe => recipe.unlocked);
    const recipe = unlockedRecipes[Math.floor(Math.random() * unlockedRecipes.length)];

    const customer = {
        id: gameState.lastCustomerId,
        name: randomName,
        order: recipe.name,
        recipe: recipe,
        patience: 120,
        status: "entering",
        tableId: availableTable.id,
        chairPosition: targetChair,
        position: { x: gameState.entrance.position.x, y: 0, z: gameState.entrance.position.z },
        target: { x: 0, y: 0, z: -3.5 }, // Wait in front of counter
        mesh: null,
        served: false,
        atCounter: false,
        sitting: false,
        moveToChair: false,
        moveToExit: false
    };

    gameState.customers.push(customer);
    availableTable.occupied = true;
    availableTable.customer = customer.id;

    window.createCustomerMesh(customer);

    const customerElement = document.createElement('div');
    customerElement.className = 'customer-item';
    customerElement.setAttribute('data-id', customer.id);
    customerElement.innerHTML = `
        <div class="customer-info">
            <div class="customer-name">${customer.name}</div>
            <div class="customer-status">${customer.status}</div>
            <div class="patience-meter"><div class="patience-fill" style="width: ${customer.patience}%"></div></div>
        </div>
        <div class="customer-avatar">${customer.name.charAt(0)}</div>
    `;
    customerElement.addEventListener('click', () => {
        if (customer.status === "waiting_order" || customer.status === "waiting_food") {
            gameState.selectedCustomer = customer;
            window.updateUI();
        }
    });
    document.getElementById('customers-list').appendChild(customerElement);

    window.showNotification(` 👋  ${customer.name} entered.`);
    window.updateUI();
    return customer;
}

window.animateCustomers = function() {
    gameState.customers.forEach(customer => {
        if (!customer.mesh) return;

        if (customer.moveToChair && customer.status !== "going_to_chair" && customer.status !== "sitting") {
            customer.status = "going_to_chair";
            customer.target = { x: customer.chairPosition.x, z: customer.chairPosition.z };
            window.updateCustomerUI(customer);
            return;
        }

        if (customer.moveToExit && customer.status !== "leaving") {
            customer.status = "leaving";
            customer.target = gameState.entrance.position;
            window.updateCustomerUI(customer);
            return;
        }

        const dx = customer.target.x - customer.mesh.position.x;
        const dz = customer.target.z - customer.mesh.position.z;
        const distance = Math.sqrt(dx * dx + dz * dz);

        if (distance > 0.3) {
            const speed = 0.08 * gameState.gameSpeed;
            customer.mesh.position.x += (dx / distance) * speed;
            customer.mesh.position.z += (dz / distance) * speed;
            if (Math.abs(dx) > 0.01 || Math.abs(dz) > 0.01) {
                customer.mesh.lookAt(customer.mesh.position.x + dx, customer.mesh.position.y, customer.mesh.position.z + dz);
            }
        } else {
            if (customer.status === "entering") {
                customer.status = "waiting_order";
                customer.atCounter = true;
                if (!gameState.selectedCustomer) gameState.selectedCustomer = customer;
                window.updateUI();
            } else if (customer.status === "going_to_chair") {
                customer.status = "waiting_food";
                customer.sitting = true;
                customer.moveToChair = false;
                
                // Snap to seat since graphics.js lerp is removed
                customer.mesh.position.set(customer.chairPosition.x, 1.8, customer.chairPosition.z);
                customer.mesh.rotation.y = customer.chairPosition.rotation + Math.PI;

            } else if (customer.status === "leaving") {
                customer.moveToExit = false;
                window.removeCustomer(customer.id);
            }
        }

        if ((customer.status === "waiting_order" || customer.status === "waiting_food") && !customer.served) {
            customer.patience -= 0.02 * gameState.gameSpeed;
            if (customer.patience <= 0) {
                customer.patience = 0;
                window.customerLeaves(customer.id, false);
            }
        }
        window.updateCustomerUI(customer);
    });
}

window.customerLeaves = function(customerId, wasServed) {
    const customerIndex = gameState.customers.findIndex(c => c.id === customerId);
    if (customerIndex === -1) return;
    const customer = gameState.customers[customerIndex];
    
    if (!wasServed) {
        gameState.rating = Math.max(1.0, gameState.rating - 0.5);
        window.showNotification(` 😢  ${customer.name} left angry!`);
    }

    const table = gameState.tables.find(t => t.id === customer.tableId);
    if (table) { table.occupied = false; table.customer = null; }
    
    customer.moveToExit = true;
    if (gameState.selectedCustomer?.id === customerId) gameState.selectedCustomer = null;
    gameState.currentOrder = null;
    gameState.drinkInProgress = false;
    gameState.staff.holdingDrink = false;
    
    if (window.cupMesh) { window.disposeMesh(window.cupMesh); window.cupMesh = null; }
    
    document.getElementById('order-panel').style.display = 'none';
    window.updateUI();
}

window.removeCustomer = function(customerId) {
    const customerIndex = gameState.customers.findIndex(c => c.id === customerId);
    if (customerIndex === -1) return;
    const customer = gameState.customers[customerIndex];

    if (customer.mesh) {
        window.disposeMesh(customer.mesh);
        const meshIndex = window.customerMeshes.indexOf(customer.mesh);
        if (meshIndex > -1) window.customerMeshes.splice(meshIndex, 1);
    }
    const customerElement = document.querySelector(`.customer-item[data-id="${customer.id}"]`);
    if (customerElement) customerElement.remove();
    gameState.customers.splice(customerIndex, 1);
    window.updateUI();
}

// --- INTERACTION LOGIC ---
window.takeOrder = function() {
    if (!gameState.selectedCustomer || gameState.staff.busy) return;
    
    window.staffGoTo({ x: 0, y: 0, z: -10 }); 

    setTimeout(() => {
        gameState.currentOrder = gameState.selectedCustomer.recipe;
        document.getElementById('order-panel').style.display = 'block';
        const customer = gameState.selectedCustomer;
        customer.moveToChair = true; 
        
        window.updateUI();
        window.showNotification(` 📝  Order: ${customer.order} (RM${customer.recipe.price})`);
    }, 1500);
}

// --- BREWING LOGIC WITH POURING ANIMATION ---
window.startBrewingProcess = function() {
    if (!gameState.currentOrder) return;
    const recipe = gameState.currentOrder;
    
    gameState.drinkInProgress = true;
    
    // Go to Coffee Machine
    window.staffGoTo({ x: gameState.coffeeMachine.position.x, y: 0, z: -13 }); 

    // Once there...
    gameState.staff.onReachDestination = function() {
        // 1. Create the Cup
        window.createCupAtMachine(recipe.color);
        
        // 2. Start Pouring Animation
        window.animatePouring(recipe.color);

        // 3. Wait for pouring to finish (approx 1.5s)
        setTimeout(() => {
            gameState.staff.holdingDrink = true;
            window.staffGoTo(gameState.staff.basePosition); 
            
            setTimeout(() => {
                gameState.drinkInProgress = false;
                window.showNotification(` ✅  ${recipe.name} Ready! Click 'Serve Customer'.`);
                window.updateUI();
            }, 1000);
        }, 1500);
    };
    window.updateUI();
}

window.serveCustomer = function() {
    if (!gameState.selectedCustomer || !gameState.currentOrder || gameState.staff.busy || !gameState.staff.holdingDrink) return;
    
    const customer = gameState.selectedCustomer;
    const table = gameState.tables.find(t => t.id === customer.tableId);
    
    if (table && table.servePosition) {
        gameState.staff.busy = true; 
        window.updateUI(); 
        
        window.staffGoTo({ x: table.servePosition.x, y: 0, z: table.servePosition.z });
        
        gameState.staff.onReachDestination = function() {
            setTimeout(() => {
                window.completeServe();
            }, 500); 
        };
    }
}

window.completeServe = function() {
    const customer = gameState.selectedCustomer;
    const recipe = gameState.currentOrder;
    if (!customer || !recipe) return;

    customer.served = true;
    const basePrice = recipe.price;
    const qualityMultiplier = gameState.upgrades.recipeQuality.priceMultiplier;
    const finalPrice = Math.floor(basePrice * qualityMultiplier);

    gameState.money += finalPrice;
    gameState.moneyEarned += finalPrice;
    gameState.customersServed++;
    gameState.rating = Math.min(5.0, gameState.rating + (0.2 * qualityMultiplier));

    if (window.cupMesh) { window.disposeMesh(window.cupMesh); window.cupMesh = null; }
    if (window.coffeeLiquid) { window.scene.remove(window.coffeeLiquid); window.coffeeLiquid = null; }

    gameState.staff.holdingDrink = false;

    window.staffGoTo(gameState.staff.basePosition);
    
    setTimeout(() => {
        window.customerLeaves(customer.id, true);
        window.showNotification(` ✅  Served ${customer.name}! Earned RM${finalPrice}`);
        window.checkGoals();
        window.updateUI();
    }, 1500);
}

// Master Entry Point
window.addEventListener('load', () => {
    const loadingScreen = document.getElementById('loading-screen');
    const homePage = document.getElementById('home-page');
    setTimeout(() => {
        if(loadingScreen) loadingScreen.style.display = 'none';
        if(homePage) { homePage.style.display = 'flex'; setTimeout(() => { homePage.style.opacity = '1'; }, 50); }
        if(window.updateUI) window.updateUI();
    }, 1500);
});