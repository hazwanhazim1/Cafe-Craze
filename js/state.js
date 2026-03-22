window.gameState = {
    money: 100,
    day: 1,
    rating: 5.0,
    customersServed: 0,
    moneyEarned: 0,
    dayProgress: 0,
    gameSpeed: 1,
    isPaused: false,
    currentLevel: 1,
    selectedCustomer: null,
    currentOrder: null,
    drinkInProgress: false,
    tutorialShown: false,
    lastCustomerId: 0,
    waitingForNextCustomer: true,
    currentStep: 0,
    
    // Config for Levels
    levelConfig: {
        1: { customers: 4, unlockMsg: "Welcome! Serve 4 customers today." },
        2: { customers: 8, unlockMsg: "Day 2! Business is picking up. 8 Customers incoming." },
        3: { customers: 15, unlockMsg: "Day 3! It's a rush! 15 Customers expected." }
    },

    upgrades: {
        coffeeMachine: { level: 1, cost: 200, speedMultiplier: 1 },
        staffTraining: { level: 1, cost: 150, speedMultiplier: 1 },
        recipeQuality: { level: 1, cost: 100, priceMultiplier: 1 }
    },
    ingredients: {
        coffeeBeans: { name: "Arabica Beans", stock: 20, icon: "fa-seedling", price: 5 },
        milk: { name: "Fresh Milk", stock: 15, icon: "fa-wine-bottle", price: 3 },
        teaLeaves: { name: "Earl Grey", stock: 10, icon: "fa-leaf", price: 4 },
        sugar: { name: "Cane Sugar", stock: 15, icon: "fa-cube", price: 2 },
        chocolate: { name: "Dark Chocolate", stock: 10, icon: "fa-candy", price: 6 },
        caramel: { name: "Caramel Syrup", stock: 8, icon: "fa-droplet", price: 5 }
    },
    recipes: [
        { id: 1, name: "Classic Coffee", price: 12, steps: ["Grind arabica beans", "Brew coffee", "Pour into cup"], ingredients: ["Arabica Beans"], color: 0x4E342E, unlocked: true },
        { id: 2, name: "Café Latte", price: 18, steps: ["Brew espresso", "Steam fresh milk", "Combine", "Add milk foam"], ingredients: ["Arabica Beans", "Fresh Milk"], color: 0xD7CCC8, unlocked: false },
        { id: 3, name: "Cappuccino", price: 20, steps: ["Brew espresso", "Steam milk", "Add fluffy foam"], ingredients: ["Arabica Beans", "Fresh Milk", "Cane Sugar"], color: 0xF5E6D3, unlocked: false },
        { id: 4, name: "Mocha", price: 22, steps: ["Brew coffee", "Add dark chocolate", "Steam milk", "Combine"], ingredients: ["Arabica Beans", "Fresh Milk", "Dark Chocolate"], color: 0x6B4423, unlocked: false }
    ],
    customers: [],
    tables: [
        { id: 1, x: -10, z: 5, occupied: false, customer: null, chairPositions: [{ x: -12, z: 3, rotation: Math.PI/4 }, { x: -8, z: 7, rotation: -Math.PI/4 }], servePosition: { x: -10, z: 2 } },
        { id: 2, x: 10, z: 5, occupied: false, customer: null, chairPositions: [{ x: 8, z: 3, rotation: Math.PI/4 }, { x: 12, z: 7, rotation: -Math.PI/4 }], servePosition: { x: 10, z: 2 } },
        { id: 3, x: -10, z: 10, occupied: false, customer: null, chairPositions: [{ x: -12, z: 8, rotation: Math.PI/4 }, { x: -8, z: 12, rotation: -Math.PI/4 }], servePosition: { x: -10, z: 7 } },
        { id: 4, x: 10, z: 10, occupied: false, customer: null, chairPositions: [{ x: 8, z: 8, rotation: Math.PI/4 }, { x: 12, z: 12, rotation: -Math.PI/4 }], servePosition: { x: 10, z: 7 } }
    ],
    staff: {
        position: { x: 0, y: 0, z: -10 },
        target: null,
        pathQueue: [], // Added queue for pathfinding
        busy: false,
        holdingDrink: false,
        speed: 0.12,
        basePosition: { x: 0, y: 0, z: -10 } 
    },
    coffeeMachine: { position: { x: 0, y: 1.5, z: -15 }, level: 1, makingCoffee: false },
    cashRegister: { position: { x: 4, y: 0, z: -8 } },
    counter: { position: { x: 0, y: 1.5, z: -8 } },
    entrance: { position: { x: 0, y: 0, z: 20 } }
};