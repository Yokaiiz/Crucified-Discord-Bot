// database.js
const { Low } = require('lowdb');
const { JSONFile } = require('lowdb/node');
const { ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType } = require('discord.js');

class Database {
    constructor() {
        this.db = null;

        // ✅ Define defaults once, reuse everywhere
        this.userDefaults = {
            id: null,
            balance: 0,
            experience: 0,
            lastDaily: null,
            inventory: [],
            dailyStreak: 0,
            timezone: 'UTC',
            gambleHistory: [],
            power: "",
            race: "Human",
            firstTime: true,
        };
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
        if (!this.db) throw new Error('Database not initialized');
        return this.db.data;
    }

    async write() {
        if (!this.db) throw new Error('Database not initialized');
        await this.db.write();
    }

    async getUserData(userId) {
        if (!this.db) throw new Error('Database not initialized');
        if (typeof userId !== 'string' || userId.trim() === '') throw new Error('Invalid user ID');

        return this.db.data.users.find(u => u.id === userId) || null;
    }

    async saveUserData(userId, userData) {
        if (!this.db) throw new Error('Database not initialized');
        if (typeof userId !== 'string' || userId.trim() === '') throw new Error('Invalid user ID');

        let userIndex = this.db.data.users.findIndex(u => u.id === userId);

        if (userIndex === -1) {
            // ✅ Merge defaults with provided data
            const newUser = {
                ...this.userDefaults,
                id: userId,
                ...userData
            };
            this.db.data.users.push(newUser);
        } else {
            // ✅ Ignore undefined values, allow null to overwrite
            const cleanedData = Object.fromEntries(
                Object.entries(userData).filter(([_, v]) => v !== undefined)
            );

            this.db.data.users[userIndex] = {
                ...this.db.data.users[userIndex],
                ...cleanedData
            };

            // ✅ Backfill any missing fields with defaults
            for (const [key, value] of Object.entries(this.userDefaults)) {
                if (this.db.data.users[userIndex][key] == null) {
                    this.db.data.users[userIndex][key] = value;
                }
            }
        }

        await this.write();
        return this.db.data.users.find(u => u.id === userId);
    }

    async updateUserBalance(userId, newBalance) {
        if (!this.db) throw new Error('Database not initialized');
        if (typeof userId !== 'string' || userId.trim() === '') throw new Error('Invalid user ID');
        if (typeof newBalance !== 'number' || isNaN(newBalance)) throw new Error('Invalid balance amount');

        const user = await this.ensureUser(userId);
        user.balance = Math.max(0, newBalance); // ✅ No negatives
        await this.write();
        return user;
    }

    async ensureUser(userId) {
        if (!this.db) throw new Error('Database not initialized');
        if (typeof userId !== 'string' || userId.trim() === '') throw new Error('Invalid user ID');

        this.db.data ||= {};
        this.db.data.users ||= [];

        let user = this.db.data.users.find(u => u.id === userId);

        if (!user) {
            // ✅ Create new user with defaults
            user = { ...this.userDefaults, id: userId };
            this.db.data.users.push(user);
            await this.write();
        } else {
            // ✅ Backfill missing fields for old users
            let updated = false;
            for (const [key, value] of Object.entries(this.userDefaults)) {
                if (user[key] == null) {
                    user[key] = value;
                    updated = true;
                }
            }
            if (updated) await this.write();
        }

        return user;
    }

    async checkUserExists(userId) {
        if (!this.db) throw new Error('Database not initialized');
        return this.db.data.users.some(u => u.id === userId);
    }

    async getUserInventory(userId) {
        const user = await this.ensureUser(userId);
        return user.inventory || [];
    }

    async getUserExperience(userId) {
        const user = await this.ensureUser(userId);
        return user.experience || 0;
    }

    async updateUserInventory(userId, items = [], action = "add") {
        if (!this.db) throw new Error('Database not initialized');
        if (typeof userId !== 'string' || userId.trim() === '') throw new Error('Invalid user ID');
        if (!Array.isArray(items) || items.length === 0) throw new Error('Items must be a non-empty array');

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
                        user.inventory.splice(index, 1);
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
        if (!this.db) throw new Error('Database not initialized');
        if (typeof userId !== 'string' || userId.trim() === '') throw new Error('Invalid user ID');
        if (typeof newExperience !== 'number' || isNaN(newExperience)) throw new Error('Invalid experience amount');

        const user = await this.ensureUser(userId);
        user.experience = newExperience;
        await this.write();
        return user;
    }

    async incrementUserBalance(userId, amount) {
        if (!this.db) throw new Error('Database not initialized');
        if (typeof userId !== 'string' || userId.trim() === '') throw new Error('Invalid user ID');
        if (typeof amount !== 'number' || isNaN(amount)) throw new Error('Invalid balance amount');

        const user = await this.ensureUser(userId);
        user.balance = Math.max(0, user.balance + amount);
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

        user.gambleHistory.unshift(entry);

        if (user.gambleHistory.length > 10) {
            user.gambleHistory = user.gambleHistory.slice(0, 10);
        }

        await this.write();
    }

    async resetUserData(userId) {
        if (!this.db) throw new Error('Database not initialized');
        if (typeof userId !== 'string' || userId.trim() === '') throw new Error('Invalid user ID');

        const userIndex = this.db.data.users.findIndex(u => u.id === userId);
        if (userIndex === -1) throw new Error('User not found');

        this.db.data.users[userIndex] = { ...this.userDefaults, id: userId };
        await this.write();
    }
}

const database = new Database();
module.exports = database;
