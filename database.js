const { Low } = require('lowdb');
const { JSONFile } = require('lowdb/node');

class Database {
    constructor() {
        this.db = null;
    }

    async initialize() {
        const defaultData = {
            users: [],
            settings: {},
        };
        const adapter = new JSONFile('db.json');
        this.db = new Low(adapter, defaultData);
        await this.db.read();
        if (this.db.data === null) {
            this.db.data = defaultData;
            await this.db.write();
        }
    }

    async getData() {
        if (!this.db) {
            throw new Error('Database not initialized');
        }
        return this.db.data;
    }

    async write() {
        if (!this.db) {
            throw new Error('Database not initialized');
        }
        await this.db.write();
    }

    async getUserData(userId) {
        if (!this.db) {
            throw new Error('Database not initialized');
        }

        if (typeof userId !== 'string' || userId.trim() === '') {
            throw new Error('Invalid user ID');
        }

        const user = this.db.data.users.find(u => u.id === userId);
        return user || null;
    }

    async saveUserData(userId, userData) {
        if (!this.db) throw new Error('Database not initialized');
        if (typeof userId !== 'string' || userId.trim() === '') throw new Error('Invalid user ID');

        let userIndex = this.db.data.users.findIndex(u => u.id === userId);

        if (userIndex === -1) {
            const newUser = {
                id: userId,
                balance: 0,
                experience: 0,
                lastDaily: null,
                inventory: {},
                dailyStreak: 0,
                timezone: 'UTC',
                gambleHistory: [],
                ...userData
            };
            this.db.data.users.push(newUser);
        } else {
            this.db.data.users[userIndex] = {
                ...this.db.data.users[userIndex],
                ...userData
            };
        }

        await this.write();
        return this.db.data.users.find(u => u.id === userId);
    }

    async updateUserBalance(userId, newBalance) {
        if (!this.db) {
            throw new Error('Database not initialized');
        }

        if (typeof userId !== 'string' || userId.trim() === '') {
            throw new Error('Invalid user ID');
        }

        if (typeof newBalance !== 'number' || isNaN(newBalance)) {
            throw new Error('Invalid balance amount');
        }

        const user = await this.getUserData(userId);
        if (!user) {
            throw new Error('User not found');
        }

        user.balance = newBalance;
        await this.write();

        return user;
    }

    async ensureUser(userId) {
    if (!this.db) {
        throw new Error('Database not initialized');
    }

    if (typeof userId !== 'string' || userId.trim() === '') {
        throw new Error('Invalid user ID');
    }

    // ✅ Ensure db.data and db.data.users are initialized
    this.db.data ||= {};
    this.db.data.users ||= [];

    let user = this.db.data.users.find(u => u.id === userId);

    // If user doesn't exist, create new user
    if (!user) {
        user = {
            id: userId,
            balance: 0,
            experience: 0,
            lastDaily: null,
            inventory: {},
            dailyStreak: 0,
            timezone: 'UTC',
            gambleHistory: [],
        };
        this.db.data.users.push(user);
        await this.write();
    }

    return user;
}

    async checkUserExists(userId) {
        if (!this.db) {
            throw new Error('Database not initialized');
        }
        return this.db.data.users.some(u => u.id === userId);
    }

    async getUserInventory(userId) {
        if (!this.db) {
            throw new Error('Database not initialized');
        }

        if (typeof userId !== 'string' || userId.trim() === '') {
            throw new Error('Invalid user ID');
        }

        const user = await this.ensureUser(userId);

        // Return inventory (Empty if the user doesn't exist)
        return user.inventory || [];
    }

    async getUserExperience(userId) {
        if (!this.db) {
            throw new Error('Database not initialized');
        }

        if (typeof userId !== 'string' || userId.trim() === '') {
            throw new Error('Invalid user ID');
        }

        const user = await this.ensureUser(userId);

        // Return inventory (Empty if the user doesn't exist)
        return user.experience || [];
    }

    async updateUserInventory(userId, items = [], action = "add") {
        if (!this.db) throw new Error('Database not initialized');

        if (typeof userId !== 'string' || userId.trim() === '') {
            throw new Error('Invalid user ID');
        }

        if (!Array.isArray(items) || items.length === 0) {
            throw new Error('Items must be a non-empty array');
        }

        const user = await this.ensureUser(userId);

        if (!Array.isArray(user.inventory)) {
            user.inventory = [];
        }

        for (const item of items) {
            if (typeof item.name !== 'string' || typeof item.quantity !== 'number') {
                throw new Error('Each item must have a name (string) and quantity (number)');
            }

            const index = user.inventory.findIndex(i => i.name === item.name);

            if (action === "add") {
                if (index !== -1) {
                    user.inventory[index].quantity += item.quantity;
                } else {
                    user.inventory.push({ name: item.name, quantity: item.quantity });
                }
            } else if (action === "remove") {
                if (index !== -1) {
                    user.inventory[index].quantity -= item.quantity;
                    if (user.inventory[index].quantity <= 0) {
                        user.inventory.splice(index, 1); // Remove item if quantity drops to 0 or less
                    }
                }
            } else {
                throw new Error('Invalid action. Use "add" or "remove".');
            }
        }

        await this.write();
        return user.inventory;
    }

    async updateUserExperience(userId, newExperience) {
        if (!this.db) {
            throw new Error('Database not initialised');
        }

        if (typeof userId !== 'string' || userId.trim() === '') {
            throw new Error('Invalid user ID');
        }

        if (typeof newExperience !== 'number' || isNaN(newExperience)) {
            throw new Error('Invalid experience amount');
        }

        const user = await this.getUserData(userId);
        if (!user) {
            throw new Error('User not found');
        }

        user.experience = newExperience;
        await this.write();

        return user
    }

    async incrementUserBalance(userId, amount) {
        if (!this.db) throw new Error('Database not initialized');
        if (typeof userId !== 'string' || userId.trim() === '') throw new Error('Invalid user ID');
        if (typeof amount !== 'number' || isNaN(amount)) throw new Error('Invalid balance amount');

        const user = await this.ensureUser(userId);

        user.balance += amount;
        await this.write();

        return user;
    }

    async recordGambleHistory(userId, entry) {
        if (!this.db) throw new Error('Database not initialized');
        if (typeof userId !== 'string' || userId.trim() === '') throw new Error('Invalid user ID');

        const user = await this.ensureUser(userId);

        if (!Array.isArray(user.gambleHistory)) {
            user.gambleHistory = [];
        }

        user.gambleHistory.unshift(entry); // Add new entry to front

        // Optional: Keep only the 10 most recent entries
        if (user.gambleHistory.length > 10) {
            user.gambleHistory = user.gambleHistory.slice(0, 10);
        }

        await this.write();
    }
}

async function resetUserData(userId) {
  // Example: Reset user data to defaults
  const defaultData = {
    id: userId,
    balance: 0,
    experience: 0,
    lastDaily: null,
    inventory: {},
    dailyStreak: 0,
    timezone: 'UTC',
    gambleHistory: [],
    // add other default fields here
  };
  // Save default data for the user
  await saveUserData(userId, defaultData);
}

// Export the instance
module.exports = database;
