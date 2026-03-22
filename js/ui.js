// --- DOM ELEMENTS ---
const moneyElement = document.getElementById('money');
const dayElement = document.getElementById('day');
const ratingElement = document.getElementById('rating');
const servedElement = document.getElementById('served');
const customersListElement = document.getElementById('customers-list');
const orderPanel = document.getElementById('order-panel');
const currentOrderElement = document.getElementById('current-order');
const ingredientsListElement = document.getElementById('ingredients-list');
const recipesListElement = document.getElementById('recipes-list');
const dayProgressElement = document.getElementById('day-progress');
const goalCustomersElement = document.getElementById('goal-customers');
const notificationElement = document.getElementById('notification');
const restockPanel = document.getElementById('restock-panel');
const restockList = document.getElementById('restock-list');
const upgradePanel = document.getElementById('upgrade-panel');
const upgradeList = document.getElementById('upgrade-list');
const tutorialTip = document.getElementById('tutorial-tip');

// Crafting Modal Elements
const craftingOverlay = document.getElementById('crafting-overlay');
const craftingGrid = document.getElementById('crafting-grid');
const craftingTitle = document.getElementById('crafting-title');
const craftingHint = document.getElementById('crafting-recipe-hint');
const cancelCraftBtn = document.getElementById('cancel-craft-btn');
const confirmCraftBtn = document.getElementById('confirm-craft-btn');

let selectedCraftIngredients = [];

// Buttons
const takeOrderButton = document.getElementById('take-order-btn');
const makeDrinkButton = document.getElementById('make-drink-btn');
const serveButton = document.getElementById('serve-btn');
const restockButton = document.getElementById('restock-btn');
const pauseButton = document.getElementById('pause-btn');
const speedButton = document.getElementById('speed-btn');
const endDayButton = document.getElementById('end-day-btn');
const startGameBtn = document.getElementById('start-game-btn');
const backToHomeBtn = document.getElementById('back-to-home');
const closeRestockBtn = document.getElementById('close-restock');
const closeUpgradeBtn = document.getElementById('close-upgrade');
const upgradeButton = document.getElementById('upgrade-btn');

// --- NEW TOGGLE BUTTONS ---
const closeSidebarBtn = document.getElementById('close-sidebar-btn');
const openSidebarBtn = document.getElementById('open-sidebar-btn');
const sidebar = document.getElementById('sidebar');

// --- UI UPDATE LOGIC ---
window.updateUI = function() {
    moneyElement.textContent = `RM ${gameState.money}`;
    dayElement.textContent = `Day ${gameState.day}`;
    ratingElement.textContent = gameState.rating.toFixed(1);
    
    // Update Customer Count display based on daily config
    const maxCustomers = gameState.levelConfig[gameState.day] ? gameState.levelConfig[gameState.day].customers : 15;
    servedElement.textContent = `${gameState.customersServed}/${maxCustomers}`;
    
    dayProgressElement.style.width = `${gameState.dayProgress}%`;

    // Ingredients List
    ingredientsListElement.innerHTML = '';
    Object.keys(gameState.ingredients).forEach(key => {
        const ingredient = gameState.ingredients[key];
        const ingredientElement = document.createElement('div');
        ingredientElement.className = `ingredient-item ${ingredient.stock <= 3 ? 'low' : ''}`;
        ingredientElement.innerHTML = `
            <div class="ingredient-info">
                <div class="ingredient-icon"><i class="fas ${ingredient.icon}"></i></div>
                <div class="ingredient-name">${ingredient.name}</div>
            </div>
            <div class="ingredient-stock">${ingredient.stock}</div>
        `;
        ingredientsListElement.appendChild(ingredientElement);
    });

    // Recipes List
    recipesListElement.innerHTML = '';
    gameState.recipes.forEach(recipe => {
        if (recipe.unlocked) {
            const finalPrice = Math.floor(recipe.price * gameState.upgrades.recipeQuality.priceMultiplier);
            const recipeElement = document.createElement('div');
            recipeElement.className = 'recipe-item';
            recipeElement.innerHTML = `
                <div class="recipe-header">
                    <div class="recipe-name">${recipe.name}</div>
                    <div class="recipe-price">RM ${finalPrice}</div>
                </div>
                <div class="recipe-ingredients" style="font-size:0.8rem">${recipe.ingredients.join(', ')}</div>
            `;
            recipesListElement.appendChild(recipeElement);
        }
    });

    const hasCustomer = gameState.selectedCustomer && gameState.selectedCustomer.status === "waiting_order";
    const hasOrder = gameState.currentOrder;
    const canMakeDrink = hasOrder && !gameState.drinkInProgress && !gameState.staff.busy;
    const canServe = hasOrder && gameState.staff.holdingDrink && !gameState.staff.busy;

    takeOrderButton.disabled = !hasCustomer || gameState.staff.busy;
    makeDrinkButton.disabled = !canMakeDrink;
    serveButton.disabled = !canServe;

    window.updateOrderPanel();
    window.checkGoals();
};

window.updateOrderPanel = function() {
    if (!gameState.currentOrder) {
        currentOrderElement.innerHTML = '<p style="color: #A0522D; font-style: italic;">No active order. Select a customer.</p>';
        return;
    }
    const recipe = gameState.currentOrder;
    const finalPrice = Math.floor(recipe.price * gameState.upgrades.recipeQuality.priceMultiplier);
    const isMade = gameState.staff.holdingDrink;

    currentOrderElement.innerHTML = `
        <div class="order-item">
            <div class="order-name"><span>${recipe.name}</span><span style="color: #4CAF50; font-weight: bold;">RM ${finalPrice}</span></div>
            <div class="order-steps" style="margin-top:5px;">
                ${isMade ? '<div class="step completed">Drink Ready!</div>' : '<div>Waiting to brew...</div>'}
            </div>
        </div>
    `;
};

window.updateCustomerUI = function(customer) {
    const customerElement = document.querySelector(`.customer-item[data-id="${customer.id}"]`);
    if (customerElement) {
        const patienceFill = customerElement.querySelector('.patience-fill');
        if (patienceFill) patienceFill.style.width = `${customer.patience}%`;
        const statusElement = customerElement.querySelector('.customer-status');
        if (statusElement) statusElement.textContent = `${customer.status.replace('_', ' ')} - ${customer.order}`;
        
        if (gameState.selectedCustomer?.id === customer.id) customerElement.classList.add('selected');
        else customerElement.classList.remove('selected');
    }
};

window.checkGoals = function() {
    const maxCustomers = gameState.levelConfig[gameState.day] ? gameState.levelConfig[gameState.day].customers : 15;
    goalCustomersElement.textContent = `${gameState.customersServed}/${maxCustomers}`;
    
    if (gameState.customersServed >= maxCustomers && gameState.customers.length === 0) {
        setTimeout(() => { window.showNotification(" 🎉  Day complete! All customers served.  🎉 "); }, 1000);
    }
};

// --- CRAFTING POPUP LOGIC ---
window.openCraftingModal = function() {
    if (!gameState.currentOrder) return;
    selectedCraftIngredients = [];
    craftingGrid.innerHTML = '';
    craftingTitle.textContent = `Crafting: ${gameState.currentOrder.name}`;
    craftingHint.textContent = `Recipe: ${gameState.currentOrder.ingredients.join(' + ')}`;
    
    Object.keys(gameState.ingredients).forEach(key => {
        const ing = gameState.ingredients[key];
        const btn = document.createElement('div');
        btn.className = 'craft-item';
        if(ing.stock <= 0) btn.className += ' disabled';
        btn.innerHTML = `
            <i class="fas ${ing.icon}"></i>
            <span>${ing.name}</span>
            <span style="font-size:0.8rem; color:#A0522D">x${ing.stock}</span>
        `;
        btn.onclick = () => {
            if(ing.stock <= 0) return;
            if(selectedCraftIngredients.includes(ing.name)) {
                selectedCraftIngredients = selectedCraftIngredients.filter(i => i !== ing.name);
                btn.classList.remove('selected');
            } else {
                selectedCraftIngredients.push(ing.name);
                btn.classList.add('selected');
            }
        };
        craftingGrid.appendChild(btn);
    });
    craftingOverlay.style.display = 'flex';
};

confirmCraftBtn.onclick = () => {
    const required = gameState.currentOrder.ingredients.slice().sort();
    const selected = selectedCraftIngredients.slice().sort();
    const isCorrect = JSON.stringify(required) === JSON.stringify(selected);
    if(isCorrect) {
        craftingOverlay.style.display = 'none';
        selected.forEach(ingName => {
            const key = Object.keys(gameState.ingredients).find(k => gameState.ingredients[k].name === ingName);
            if(key) gameState.ingredients[key].stock--;
        });
        window.startBrewingProcess(); 
    } else {
        alert("Incorrect ingredients! Check the recipe hint.");
    }
};

cancelCraftBtn.onclick = () => { craftingOverlay.style.display = 'none'; };

// --- PANELS & POPUPS ---
window.showNotification = function(message) {
    notificationElement.textContent = message; notificationElement.style.display = 'block';
    setTimeout(() => { notificationElement.style.display = 'none'; }, 3000);
};

window.showRestockPanel = function() {
    restockList.innerHTML = '';
    Object.keys(gameState.ingredients).forEach(key => {
        const ingredient = gameState.ingredients[key];
        const restockItem = document.createElement('div');
        restockItem.className = 'restock-item';
        restockItem.innerHTML = `
            <div>
                <div style="font-weight: bold; color: #8B4513;">${ingredient.name}</div>
                <div style="font-size: 0.9rem; color: #A0522D;">RM ${ingredient.price} each</div>
            </div>
            <div class="restock-controls">
                <button class="restock-btn" data-ingredient="${key}" data-amount="-5">-5</button>
                <span style="font-weight: bold; min-width: 40px; text-align: center;">${ingredient.stock}</span>
                <button class="restock-btn" data-ingredient="${key}" data-amount="5">+5</button>
            </div>
        `;
        restockList.appendChild(restockItem);
    });
    restockPanel.style.display = 'block';
    
    restockList.querySelectorAll('.restock-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const ingredient = this.getAttribute('data-ingredient');
            const amount = parseInt(this.getAttribute('data-amount'));
            const cost = Math.abs(amount) * gameState.ingredients[ingredient].price;
            if (amount < 0) {
                if (gameState.ingredients[ingredient].stock >= Math.abs(amount)) {
                    gameState.ingredients[ingredient].stock += amount; gameState.money += cost; window.showNotification(`Sold items.`);
                }
            } else {
                if (gameState.money >= cost) {
                    gameState.ingredients[ingredient].stock += amount; gameState.money -= cost; window.showNotification(`Restocked ${gameState.ingredients[ingredient].name}`);
                } else { window.showNotification(`Not enough funds!`); }
            }
            window.updateUI(); window.showRestockPanel();
        });
    });
};

window.showUpgradePanel = function() {
    upgradeList.innerHTML = '';
    const upgrades = [
        { id: 'coffeeMachine', name: 'Espresso Machine', description: 'Brew faster', level: gameState.upgrades.coffeeMachine.level, cost: gameState.upgrades.coffeeMachine.cost },
        { id: 'staffTraining', name: 'Staff Training', description: 'Move faster', level: gameState.upgrades.staffTraining.level, cost: gameState.upgrades.staffTraining.cost },
        { id: 'recipeQuality', name: 'Recipe Quality', description: 'Sell for more', level: gameState.upgrades.recipeQuality.level, cost: gameState.upgrades.recipeQuality.cost }
    ];
    upgrades.forEach(upgrade => {
        const upgradeItem = document.createElement('div');
        upgradeItem.className = 'restock-item';
        upgradeItem.innerHTML = `
            <div>
                <div style="font-weight: bold; color: #8B4513;">${upgrade.name} (Lvl ${upgrade.level})</div>
                <div style="font-size: 0.9rem; color: #A0522D;">${upgrade.description}</div>
            </div>
            <div>
                <div style="font-weight: bold; color: #A0522D; margin-bottom: 5px;">RM ${upgrade.cost}</div>
                <button class="restock-btn" data-upgrade="${upgrade.id}" style="width: 80px;">Buy</button>
            </div>
        `;
        upgradeList.appendChild(upgradeItem);
    });
    upgradePanel.style.display = 'block';

    upgradeList.querySelectorAll('.restock-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const upgradeId = this.getAttribute('data-upgrade');
            const upgrade = gameState.upgrades[upgradeId];
            if (gameState.money >= upgrade.cost) {
                gameState.money -= upgrade.cost;
                if (upgradeId === 'coffeeMachine') { upgrade.level++; upgrade.speedMultiplier += 0.3; upgrade.cost = Math.floor(upgrade.cost * 1.5); gameState.staff.speed += 0.02; }
                else if (upgradeId === 'staffTraining') { upgrade.level++; upgrade.speedMultiplier += 0.2; upgrade.cost = Math.floor(upgrade.cost * 1.4); gameState.staff.speed += 0.03; }
                else if (upgradeId === 'recipeQuality') { upgrade.level++; upgrade.priceMultiplier += 0.15; upgrade.cost = Math.floor(upgrade.cost * 1.6); }
                window.showNotification(`${upgrade.name} Upgraded!`);
                window.updateUI(); window.showUpgradePanel();
            } else { window.showNotification(`Not enough money.`); }
        });
    });
};

window.showTutorialTip = function() {
    if (!gameState.tutorialShown) {
        tutorialTip.style.display = 'block'; gameState.tutorialShown = true;
        setTimeout(() => { tutorialTip.style.display = 'none'; }, 8000);
    }
};

// --- EVENT LISTENERS ---
takeOrderButton.addEventListener('click', () => { if (window.takeOrder) window.takeOrder(); });
makeDrinkButton.addEventListener('click', () => { 
    if (gameState.currentOrder && !gameState.staff.busy && !gameState.drinkInProgress) { window.openCraftingModal(); }
});
serveButton.addEventListener('click', () => { if (!serveButton.disabled) { window.serveCustomer(); } });
restockButton.addEventListener('click', showRestockPanel);
upgradeButton.addEventListener('click', showUpgradePanel);
closeRestockBtn.addEventListener('click', () => { restockPanel.style.display = 'none'; window.updateUI(); });
closeUpgradeBtn.addEventListener('click', () => { upgradePanel.style.display = 'none'; window.updateUI(); });

pauseButton.addEventListener('click', () => {
    gameState.isPaused = !gameState.isPaused;
    pauseButton.textContent = gameState.isPaused ? " ▶️  Resume" : " ⏸️  Pause";
});

speedButton.addEventListener('click', () => {
    gameState.gameSpeed = gameState.gameSpeed === 1 ? 2 : 1;
    speedButton.textContent = gameState.gameSpeed === 1 ? " ▶️  Speed 1x" : " ▶️  Speed 2x";
});

endDayButton.addEventListener('click', () => { if (confirm("End the day early?")) { gameState.dayProgress = 100; } });

// --- SIDEBAR TOGGLE LISTENERS ---
closeSidebarBtn.addEventListener('click', () => {
    sidebar.style.display = 'none';
    openSidebarBtn.style.display = 'block';
    setTimeout(() => { window.onWindowResize(); }, 50); // Resize game to fill space
});

openSidebarBtn.addEventListener('click', () => {
    sidebar.style.display = 'flex';
    openSidebarBtn.style.display = 'none';
    setTimeout(() => { window.onWindowResize(); }, 50); // Resize game back
});

startGameBtn.addEventListener('click', () => {
    document.getElementById('home-page').style.opacity = '0';
    setTimeout(() => {
        document.getElementById('home-page').style.display = 'none';
        document.getElementById('game-page').style.display = 'flex';
        window.init3DScene();
        window.updateUI();
        window.startGameLoop();
    }, 500);
});

backToHomeBtn.addEventListener('click', () => {
    document.getElementById('game-page').style.display = 'none';
    const home = document.getElementById('home-page');
    home.style.display = 'flex';
    setTimeout(() => { home.style.opacity = '1'; }, 10);
});