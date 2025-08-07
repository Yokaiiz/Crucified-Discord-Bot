// REQUIREMENTS
const { Client, GatewayIntentBits, SlashCommandBuilder, REST, Routes, } = require("discord.js");
const { handleHelpCommand, handleBegCommand, handleCatCommand, handleProfileCommand, handleGambleCommand, handleDigCommand, handleCraftCommand, handleSellCommand, handleDonateCommand, handleResetCommand, handleGiveMoneyCommand, handleGiveItemCommand, } = require("./commands.js");
const dotenv = require('dotenv');
const database = require('./database.js');
require('dotenv').config();


// LOAD SECRETS HERE
dotenv.config();

// DISCORD BOT TOKEN
const token = process.env.DISCORD_BOT_TOKEN;
if (!token) {
    throw new Error("No Discord bot token provided in .env file, are you sure it's set?");
}

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

async function initializeBot() {
    try {
        console.log('Began starting up bot');
        await client.login(token);
        console.log('Logged in successfully');

        console.log('Deploying commands');
        await deployCommands(client);
        console.log('Commands deployed successfully');

        console.log('Starting LOWDB');
        await database.initialize();
        console.log('LOWDB started successfully');

        console.log(`Logged in as ${client.user.tag}!`);
    } catch (error) {
        console.error('Error during initialization:', error);
        process.exit(1);
    }
}

const cooldowns = new Map();

const commands = [

    new SlashCommandBuilder().setName('help').setDescription('general support'),
    new SlashCommandBuilder().setName('cat').setDescription('Sends a pic of kitty!!'),
    new SlashCommandBuilder().setName('beg').setDescription('You beg for money!'),
    new SlashCommandBuilder().setName('profile').setDescription('shows you your balance and item inventory'),
    new SlashCommandBuilder()
    .setName('gamble')
    .setDescription('Gamble away all of your life savings')
    .addIntegerOption(option =>
        option.setName('amount')
        .setDescription('the amount you wish to bet')
        .setRequired(true)
    ),
    new SlashCommandBuilder().setName('dig').setDescription('Dig for items!'),
    new SlashCommandBuilder().setName('craft').setDescription('Craft items using raw materials'),
    new SlashCommandBuilder()
    .setName('sell')
    .setDescription('Sell items from your inventory')
    .addStringOption(option =>
        option.setName('item')
        .setDescription('The item you want to sell')
        .setRequired(true)
    ),
    new SlashCommandBuilder()
    .setName('donate')
    .setDescription('Donate money to another user')
    .addUserOption(option =>
        option.setName('user')
        .setDescription('The user you want to donate money to')
        .setRequired(true)
    )
    .addIntegerOption(option =>
        option.setName('amount')
        .setDescription('The amount of money you want to donate')
        .setRequired(true)
    ),
    new SlashCommandBuilder()
    .setName('reset')
    .setDescription('Allows the bot owner to reset your data!')
    .addUserOption(option =>
        option.setName('user')
        .setDescription('The user they want to reset')
        .setRequired(true)
    ),
    new SlashCommandBuilder()
    .setName('givemoney')
    .setDescription('Gives a user money (only for bot owner)')
    .addUserOption(option =>
        option.setName('user')
        .setDescription('The user you want to give money to')
        .setRequired(true)
    )
    .addIntegerOption(option =>
        option.setName('amount')
        .setDescription('The amount of money you want to give')
        .setRequired(true)
    ),
    new SlashCommandBuilder()
    .setName('giveitem')
    .setDescription('Gives a user an item (only for bot owner)')
    .addUserOption(option =>
        option.setName('user')
        .setDescription('The user you want to give an item to')
        .setRequired(true)
    )
    .addStringOption(option =>
        option.setName('item')
        .setDescription('The item you want to give')
        .setRequired(true)
    ),

].map(command => command.toJSON());

const rest = new REST({ version: '10' }).setToken(token);

async function deployCommands(client) {
    try {
        console.log('Started refreshing application (/) commands.');
        await rest.put(
            Routes.applicationCommands(client.user.id),
            { body: commands }
        );
        console.log('Successfully reloaded application (/) commands.');
    } catch (error) {
        console.error(error);
    }
}

function getCooldownTime(commandName) {
    // Define cooldowns per command (in milliseconds)
    const cooldowns = {
        help: 5000,
        cat: 5000,
        beg: 8500,
        profile: 9000,
        gamble: 10000,
        dig: 12000,
        craft: 20000,
        sell: 5000,
        donate: 15000,
        reset: 30000,
        givemoney: 30000,
        giveitem: 30000,

        // default fallback
        default: 5000
    };
    return cooldowns[commandName] || cooldowns.default;
}

// Command data, this is where you add more else if imports for more commands, handled in a try catch block.
client.on('interactionCreate', async interaction => {
    try {
        if (!interaction.isChatInputCommand()) return;

        await database.ensureUser(interaction.user.id);

        // ✅ Cooldown logic
        const commandName = interaction.commandName;
        const cooldownTime = getCooldownTime(commandName); // in ms
        const now = Date.now();

        if (!cooldowns.has(commandName)) {
            cooldowns.set(commandName, new Map());
        }

        const timestamps = cooldowns.get(commandName);
        const userCooldown = timestamps.get(interaction.user.id);

        if (userCooldown && now < userCooldown + cooldownTime) {
            const timeLeft = ((userCooldown + cooldownTime - now) / 1000).toFixed(1);
            return interaction.reply({
                content: `⏳ Please wait **${timeLeft} seconds** before using \`/${commandName}\` again.`,
                ephemeral: true,
            });
        }

        timestamps.set(interaction.user.id, now);
        setTimeout(() => timestamps.delete(interaction.user.id), cooldownTime);

        // Gwen: Updated to be a switch casement for faster, more reliable and efficient code. Better than if else statements.
        // ✅ Command execution


        switch (commandName) {
            case 'help':
                await handleHelpCommand(interaction);
                break;
            case 'cat':
                await handleCatCommand(interaction);
                break;
            case 'beg':
                await handleBegCommand(interaction);
                break;
            case 'profile':
                await handleProfileCommand(interaction);
                break;
            case 'gamble':
                await handleGambleCommand(interaction);
                break;
            case 'dig':
                await handleDigCommand(interaction);
                break;
            case 'craft':
                await handleCraftCommand(interaction);
                break;
            case 'sell':
                await handleSellCommand(interaction);
                break;
            case 'donate':
                await handleDonateCommand(interaction);
                break;
            case 'reset':
                await handleResetCommand(interaction);
                break;
            case 'givemoney':
                await handleGiveMoneyCommand(interaction);
                break;
            case 'giveitem':
                await handleGiveItemCommand(interaction);
                break;
        }

    } catch (error) {
        console.error('Error when executing command', error);
    }
});

initializeBot();

module.exports = {
    client,
    database
};
