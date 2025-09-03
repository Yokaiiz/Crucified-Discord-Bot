// REQUIREMENTS
const {
  Client,
  GatewayIntentBits,
  SlashCommandBuilder,
  REST,
  Routes,
  SlashCommandAssertions,
} = require("discord.js");
const {
  handleHelpCommand,
  handleBegCommand,
  handleCatCommand,
  handleProfileCommand,
  handleGambleCommand,
  handleDigCommand,
  handleCraftCommand,
  handleSellCommand,
  handleDonateCommand,
  handleResetCommand,
  handleGiveMoneyCommand,
  handleGiveItemCommand,
  handleWorkCommand,
  handleGiveEXPCommand,
  handleTakeMoneyCommand,
  handleTakeEXPCommand,
  handleTimeoutCommand,
  handleBanCommand,
  handleRobCommand,
  handleTypeSoulEncyclopaediaCommand,
  handleFightCommand,
  handleShopWeaponsCommand,
  handleShopItemsCommand,
} = require("./commands.js");
const dotenv = require("dotenv");
const database = require("./database.js");
require("dotenv").config();

// LOAD SECRETS HERE
dotenv.config();

// DISCORD BOT TOKEN
const token = process.env.DISCORD_BOT_TOKEN;
if (!token) {
  throw new Error(
    "No Discord bot token provided in .env file, are you sure it's set?"
  );
}

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

async function initializeBot() {
  try {
    console.log("Began starting up bot");
    await client.login(token);
    console.log("Logged in successfully");

    console.log("Deploying commands");
    await deployCommands(client);
    console.log("Commands deployed successfully");

    console.log("Starting LOWDB");
    await database.initialize();
    console.log("LOWDB started successfully");

    console.log(`Logged in as ${client.user.tag}!`);
    console.log(`Brina bot, are you out there! Hello!!!`);
  } catch (error) {
    console.error("Error during initialization:", error);
    process.exit(1);
  }
}

const commands = [
  new SlashCommandBuilder().setName("help").setDescription("general support"),
  new SlashCommandBuilder()
    .setName("cat")
    .setDescription("Sends a pic of kitty!!"),
  new SlashCommandBuilder().setName("beg").setDescription("You beg for money!"),
  new SlashCommandBuilder()
    .setName("profile")
    .setDescription("shows you your balance and item inventory")
    .addUserOption((option) =>
      option
        .setName("user")
        .setDescription("the user you want to look into.")
        .setRequired(false)
    ),
  new SlashCommandBuilder()
    .setName("gamble")
    .setDescription("Gamble away all of your life savings")
    .addIntegerOption((option) =>
      option
        .setName("amount")
        .setDescription("the amount you wish to bet")
        .setRequired(true)
    ),
  new SlashCommandBuilder().setName("dig").setDescription("Dig for items!"),
  new SlashCommandBuilder()
    .setName("craft")
    .setDescription("Craft items using raw materials"),
  new SlashCommandBuilder()
    .setName("sell")
    .setDescription("Sell items from your inventory")
    .addStringOption((option) =>
      option
        .setName("item")
        .setDescription("The item you want to sell")
        .setRequired(true)
    )
    .addIntegerOption((option) =>
      option
        .setName("amount")
        .setDescription("Amount of the item that you wish to sell")
        .setRequired(true)
    ),
  new SlashCommandBuilder()
    .setName("donate")
    .setDescription("Donate money to another user")
    .addUserOption((option) =>
      option
        .setName("user")
        .setDescription("The user you want to donate money to")
        .setRequired(true)
    )
    .addIntegerOption((option) =>
      option
        .setName("amount")
        .setDescription("The amount of money you want to donate")
        .setRequired(true)
    ),
  new SlashCommandBuilder()
    .setName("reset")
    .setDescription("Allows the bot owner to reset your data!")
    .addUserOption((option) =>
      option
        .setName("user")
        .setDescription("The user they want to reset")
        .setRequired(true)
    ),
  new SlashCommandBuilder()
    .setName("givemoney")
    .setDescription("Gives a user money (only for bot owner)")
    .addUserOption((option) =>
      option
        .setName("user")
        .setDescription("The user you want to give money to")
        .setRequired(true)
    )
    .addIntegerOption((option) =>
      option
        .setName("amount")
        .setDescription("The amount of money you want to give")
        .setRequired(true)
    ),
  new SlashCommandBuilder()
    .setName("giveitem")
    .setDescription("Gives a user an item (only for bot owner)")
    .addUserOption((option) =>
      option
        .setName("user")
        .setDescription("The user you want to give an item to")
        .setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName("item")
        .setDescription("The item you want to give")
        .setRequired(true)
    )
    .addIntegerOption((option) =>
      option
        .setName("amount")
        .setDescription("The amount of the item you want to give")
        .setRequired(true)
    ),
  new SlashCommandBuilder().setName("work").setDescription("Lets you work"),
  new SlashCommandBuilder()
    .setName("give_experience")
    .setDescription("Gives a user an amount of EXP (only for bot owner)")
    .addUserOption((option) =>
      option
        .setName("user")
        .setDescription("The user you want to give the EXP to")
        .setRequired(true)
    )
    .addIntegerOption((option) =>
      option
        .setName("amount")
        .setDescription("The amount you want to give to this user")
        .setRequired(true)
    ),
  new SlashCommandBuilder()
    .setName("take_money")
    .setDescription(
      "Takes a specific amount of money from a user (only for bot owner)"
    )
    .addUserOption((option) =>
      option
        .setName("target")
        .setDescription("The user you wish to take the money from")
        .setRequired(true)
    )
    .addIntegerOption((option) =>
      option
        .setName("amount")
        .setDescription("The amount you wish to take from that user")
    ),
  new SlashCommandBuilder()
    .setName("take_exp")
    .setDescription(
      "Takes a sepcific amount of exp from a user (only for bot owner)"
    )
    .addUserOption((option) =>
      option
        .setName("target")
        .setDescription("the user you wish to take the EXP from")
    )
    .addIntegerOption((option) =>
      option
        .setName("amount")
        .setDescription("The amount you wish to take from this user")
    ),
  new SlashCommandBuilder()
  .setName('timeout')
  .setDescription('timeout a member! (EXCLUSIVE TO ADMINS!!)')
  .addUserOption(option =>
    option.setName('target')
    .setDescription('the person which you wish to mute')
    .setRequired(true)
  )
  .addIntegerOption(option =>
    option.setName('time')
    .setDescription('the amount of time you wish to time them out for (in milliseconds btw)')
    .setRequired(true)
  ),
  new SlashCommandBuilder()
  .setName('ban')
  .setDescription('Ban a member! (EXCLUSIVE TO ADMINS!!)')
  .addUserOption(option =>
    option.setName('user')
    .setDescription('The person you wish to ban.')
    .setRequired(true)
  )
  .addStringOption(option =>
    option.setName('reason')
    .setDescription('The reason why you wish to ban that user.')
    .setRequired(true)
  ),
  new SlashCommandBuilder()
  .setName('rob')
  .setDescription('Rob a player!')
  .addUserOption(option =>
    option.setName('target')
    .setDescription('the player you wish to rob')
    .setRequired(true)
  ),
  new SlashCommandBuilder()
  .setName('encyclopaedia')
  .setDescription('An encyclopaedia for you to use incase you want to find out something.')
  .addSubcommand(command =>
    command.setName('type_soul')
    .setDescription('Shows you information regarding the game Type Soul')
  ),
  new SlashCommandBuilder()
  .setName('fight')
  .setDescription('You fight monsters for money and EXP'),
  new SlashCommandBuilder()
  .setName('shop')
  .setDescription('Lets you shop for a variety of items')
  .addSubcommand(command =>
    command.setName('weapons')
  )
  .addSubcommand(command =>
    command.setName('items')
  )
].map((command) => command.toJSON());

const rest = new REST({ version: "10" }).setToken(token);

async function deployCommands(client) {
  try {
    console.log("Started refreshing application (/) commands.");
    await rest.put(Routes.applicationCommands(client.user.id), {
      body: commands,
    });
    console.log("Successfully reloaded application (/) commands.");
  } catch (error) {
    console.error(error);
  }
}

// --- Cooldown System ---
const cooldowns = new Map(); // Map<userId, Map<commandName, expiresAt>>

function isOnCooldown(userId, commandName) {
  const now = Date.now();
  if (!cooldowns.has(userId)) return false;
  const userCooldowns = cooldowns.get(userId);
  if (!userCooldowns.has(commandName)) return false;
  const expiresAt = userCooldowns.get(commandName);
  return now < expiresAt;
}

function getCooldownTime(commandName) {
  // Customize per command, or use a default (in ms)
  const defaultCooldown = 5000;
  const cooldowns = {
    help: 5000,
    cat: 3000,
    beg: 5000,
    profile: 5000,
    dig: 10000,
    craft: 15000,
    sell: 7500,
    donate: 15000,
    reset: 15000,
    givemoney: 15000,
    giveitem: 15000,
    work: 1800000,
    take_money: 15000,
    take_exp: 15000,
    timeout: 5000,
    ban: 5000,
    gamble: 35000,
    rob: 15000,
    fight: 10000,
    // ...add more as needed
  };
  return cooldowns[commandName] ?? defaultCooldown;
}

function setCooldown(userId, commandName, cooldownTime) {
  const now = Date.now();
  if (!cooldowns.has(userId)) {
    cooldowns.set(userId, new Map());
  }
  const userCooldowns = cooldowns.get(userId);
  userCooldowns.set(commandName, now + cooldownTime);

  // Cleanup after cooldown expires
  setTimeout(() => {
    userCooldowns.delete(commandName);
    if (userCooldowns.size === 0) {
      cooldowns.delete(userId);
    }
  }, cooldownTime);
}

// --- Interaction Handler ---
client.on("interactionCreate", async (interaction) => {
  try {
    if (!interaction.isChatInputCommand()) return;

    await database.ensureUser(interaction.user.id);

    const commandName = interaction.commandName;
    const cooldownTime = getCooldownTime(commandName);

    if (isOnCooldown(interaction.user.id, commandName)) {
      const expiresAt = cooldowns.get(interaction.user.id).get(commandName);
      const timeLeft = ((expiresAt - Date.now()) / 1000).toFixed(1);
      return interaction.reply({
        content: `⏳ Please wait **${timeLeft} seconds** before using \`/${commandName}\` again.`,
        ephemeral: true,
      });
    }

    setCooldown(interaction.user.id, commandName, cooldownTime);

    // --- Command Execution ---
    switch (commandName) {
      case "help":
        await handleHelpCommand(interaction);
        break;
      case "cat":
        await handleCatCommand(interaction);
        break;
      case "beg":
        await handleBegCommand(interaction);
        break;
      case "profile":
        await handleProfileCommand(interaction);
        break;
      case "gamble":
        await handleGambleCommand(interaction);
        break;
      case "dig":
        await handleDigCommand(interaction);
        break;
      case "craft":
        await handleCraftCommand(interaction);
        break;
      case "sell":
        await handleSellCommand(interaction);
        break;
      case "donate":
        await handleDonateCommand(interaction);
        break;
      case "reset":
        await handleResetCommand(interaction);
        break;
      case "givemoney":
        await handleGiveMoneyCommand(interaction);
        break;
      case "giveitem":
        await handleGiveItemCommand(interaction);
        break;
      case "work":
        await handleWorkCommand(interaction);
        break;
      case "give_experience":
        await handleGiveEXPCommand(interaction);
        break;
      case "take_money":
        await handleTakeMoneyCommand(interaction);
        break;
      case "take_exp":
        await handleTakeEXPCommand(interaction);
        break;
      case "timeout":
        await handleTimeoutCommand(interaction);
        break;
      case "ban":
        await handleBanCommand(interaction);
        break;
      case "rob":
        await handleRobCommand(interaction);
        break;
      case "encyclopaedia":
        const sub = interaction.options.getSubcommand();

        if (sub === "type_soul") {
          await handleTypeSoulEncyclopaediaCommand(interaction);
        }
        break;
      case "fight":
        await handleFightCommand(interaction);
        break;
      case 'shop':
        sub = interaction.options.getSubcommand();

        switch (sub) {
          case 'weapons': {
            await handleShopWeaponsCommand(interaction);
            break;
          }

          case 'items': {
            await handleShopItemsCommand(interaction);
            break;
          }
        }
    }
  } catch (error) {
    console.error("Error when executing command", error);
  }
});

initializeBot();

module.exports = {
  client,
  database,
};
