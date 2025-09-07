// index.js
require("dotenv").config();
const {
  Client,
  GatewayIntentBits,
  REST,
  Routes,
  SlashCommandBuilder,
} = require("discord.js");
const database = require("./database.js");
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
  handleUseItemCommand,
} = require("./commands.js");

// --- Bot Token ---
const TOKEN = process.env.DISCORD_BOT_TOKEN;
if (!TOKEN) throw new Error("❌ Missing DISCORD_BOT_TOKEN in .env file");

// --- Bot Owner ID ---
const OWNER_ID = process.env.OWNER_ID; // set your Discord ID in .env

// --- Client ---
const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent],
});

// --- Cooldowns ---
const cooldowns = new Map();
function isOnCooldown(userId, cmd) {
  const now = Date.now();
  if (!cooldowns.has(userId)) return false;
  const userCooldowns = cooldowns.get(userId);
  if (!userCooldowns.has(cmd)) return false;
  return now < userCooldowns.get(cmd);
}
function setCooldown(userId, cmd, ms) {
  const now = Date.now();
  if (!cooldowns.has(userId)) cooldowns.set(userId, new Map());
  cooldowns.get(userId).set(cmd, now + ms);
  setTimeout(() => cooldowns.get(userId).delete(cmd), ms);
}
function getCooldownTime(cmd) {
  const defaults = {
    help: 5000, cat: 3000, beg: 5000, profile: 5000, dig: 10000,
    craft: 15000, sell: 7500, donate: 15000, work: 1800000,
    gamble: 35000, rob: 15000, use: 5000, reroll: 5000
  };
  return defaults[cmd] ?? 5000;
}

// --- Slash Commands ---
const commands = [
  new SlashCommandBuilder().setName("help").setDescription("general support"),
  new SlashCommandBuilder().setName("cat").setDescription("Sends a pic of kitty!!"),
  new SlashCommandBuilder().setName("beg").setDescription("You beg for money!"),
  new SlashCommandBuilder()
    .setName("profile")
    .setDescription("Shows your balance and inventory")
    .addUserOption(option => option.setName("user").setDescription("The user to view").setRequired(false)),
  new SlashCommandBuilder()
    .setName("gamble")
    .setDescription("Gamble away your money")
    .addIntegerOption(option => option.setName("amount").setDescription("Amount to bet").setRequired(true)),
  new SlashCommandBuilder().setName("dig").setDescription("Dig for items!"),
  new SlashCommandBuilder().setName("craft").setDescription("Craft items"),
  new SlashCommandBuilder()
    .setName("sell")
    .setDescription("Sell items from your inventory")
    .addStringOption(option => option.setName("item").setDescription("Item to sell").setRequired(true))
    .addIntegerOption(option => option.setName("amount").setDescription("Amount").setRequired(true)),
  new SlashCommandBuilder()
    .setName("donate")
    .setDescription("Donate money to a user")
    .addUserOption(option => option.setName("user").setDescription("Target user").setRequired(true))
    .addIntegerOption(option => option.setName("amount").setDescription("Amount").setRequired(true)),
  // Owner/admin commands
  new SlashCommandBuilder().setName("reset").setDescription("Reset user data (owner only)")
    .addUserOption(option => option.setName("user").setDescription("The user to reset").setRequired(true)),
  new SlashCommandBuilder().setName("givemoney").setDescription("Give money to a user (owner only)")
    .addUserOption(option => option.setName("user").setDescription("Target user").setRequired(true))
    .addIntegerOption(option => option.setName("amount").setDescription("Amount").setRequired(true)),
  new SlashCommandBuilder().setName("giveitem").setDescription("Give an item to a user (owner only)")
    .addUserOption(option => option.setName("user").setDescription("Target user").setRequired(true))
    .addStringOption(option => option.setName("item").setDescription("Item to give").setRequired(true))
    .addIntegerOption(option => option.setName("amount").setDescription("Amount").setRequired(true)),
  new SlashCommandBuilder().setName("give_experience").setDescription("Give experience (owner only)")
    .addUserOption(option => option.setName("user").setDescription("Target user").setRequired(true))
    .addIntegerOption(option => option.setName("amount").setDescription("Amount").setRequired(true)),
  new SlashCommandBuilder().setName("take_money").setDescription("Take money from a user (owner only)")
    .addUserOption(option => option.setName("target").setDescription("Target user").setRequired(true))
    .addIntegerOption(option => option.setName("amount").setDescription("Amount").setRequired(true)),
  new SlashCommandBuilder().setName("take_exp").setDescription("Take experience (owner only)")
    .addUserOption(option => option.setName("target").setDescription("Target user").setRequired(true))
    .addIntegerOption(option => option.setName("amount").setDescription("Amount")),
  new SlashCommandBuilder().setName("timeout").setDescription("Timeout a member (admin only)")
    .addUserOption(option => option.setName("target").setDescription("Target user").setRequired(true))
    .addIntegerOption(option => option.setName("time").setDescription("Time in seconds").setRequired(true)),
  new SlashCommandBuilder().setName("ban").setDescription("Ban a member (admin only)")
    .addUserOption(option => option.setName("user").setDescription("Target user").setRequired(true))
    .addStringOption(option => option.setName("reason").setDescription("Reason")),
  new SlashCommandBuilder().setName("rob").setDescription("Rob a person")
    .addUserOption(option => option.setName("target").setDescription("Target user").setRequired(true)),
  new SlashCommandBuilder().setName("encyclopaedia").setDescription("Game encyclopaedia")
    .addSubcommand(sub => sub.setName("type_soul").setDescription("Info about Type Soul")),
  new SlashCommandBuilder().setName("shop").setDescription("Shop for items")
    .addSubcommand(sub => sub.setName("weapons").setDescription("Buy weapons")),
  new SlashCommandBuilder().setName("use").setDescription("Use an item")
    .addStringOption(option => option.setName("item").setDescription("Item to use").setRequired(true)),
  new SlashCommandBuilder().setName("fight").setDescription("Fight a random boss"),
].map(cmd => cmd.toJSON());

// --- Deploy Commands ---
const rest = new REST({ version: "10" }).setToken(TOKEN);
async function deployCommands() {
  try {
    console.log("🌍 Deploying commands...");
    await rest.put(Routes.applicationCommands(client.user.id), { body: commands });
    console.log("✅ Commands deployed");
  } catch (err) {
    console.error("❌ Failed to deploy commands:", err);
  }
}

// --- Modal Interaction (Shop) ---
client.on("interactionCreate", async (interaction) => {
  if (!interaction.isModalSubmit()) return;

  const customId = interaction.customId;
  const match = customId.match(/^buy_(.+)_(\d+)$/);
  if (!match) return;

  const itemKey = match[1];
  const userId = match[2];
  if (interaction.user.id !== userId) {
    return interaction.reply({ content: "❌ This modal isn’t for you.", ephemeral: true }).catch(() => {});
  }

  try {
    await interaction.deferReply({ ephemeral: true });
    const quantity = parseInt(interaction.fields.getTextInputValue("quantity"), 10);
    if (isNaN(quantity) || quantity <= 0) return interaction.editReply("❌ Please enter a valid number.");

    const shop = {
      zanpakuto: { name: "Zanpakuto", price: 5000 },
      zanpakuto_reroll: { name: "Zanpakuto Reroll", price: 10000 },
    };
    const selectedItem = shop[itemKey];
    if (!selectedItem) return interaction.editReply("❌ That item does not exist.");

    await database.ensureUser(userId);
    const userData = await database.getUserData(userId);
    const totalPrice = selectedItem.price * quantity;
    if (userData.balance < totalPrice) {
      return interaction.editReply(`❌ You don’t have enough money. You need **${totalPrice}**, you have **${userData.balance}**.`);
    }

    if (selectedItem.name === "Zanpakuto" && userData.power) {
      return interaction.editReply(`❌ You have already awakened your ${userData.race} power. Use a Zanpakuto Reroll to reroll it.`);
    }

    userData.balance -= totalPrice;
    userData.inventory[selectedItem.name] = (userData.inventory[selectedItem.name] || 0) + quantity;
    await database.saveUserData(userId, userData);

    return interaction.editReply(`✅ You bought **${quantity}x ${selectedItem.name}(s)** for **¥${totalPrice}**.`);
  } catch (err) {
    console.error("Error handling shop modal:", err);
    if (!interaction.replied && !interaction.deferred) {
      return interaction.reply({ content: "❌ Something went wrong.", ephemeral: true }).catch(() => {});
    }
  }
});

// --- Command Interaction ---
client.on("interactionCreate", async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  const userId = interaction.user.id;
  await database.ensureUser(userId);
  const cmd = interaction.commandName;
  const sub = interaction.options.getSubcommand(false);

  // Owner/admin-only check
  const ownerOnly = ["reset","givemoney","giveitem","give_experience","take_money","take_exp"];
  if (ownerOnly.includes(cmd) && interaction.user.id !== OWNER_ID) {
    return interaction.reply({ content: "❌ Only the bot owner can use this command.", ephemeral: true });
  }

  // Cooldown
  if (isOnCooldown(userId, cmd)) {
    const expiresAt = cooldowns.get(userId).get(cmd);
    const timeLeft = ((expiresAt - Date.now()) / 1000).toFixed(1);
    return interaction.reply({ content: `⏳ Wait **${timeLeft}s** before using \`/${cmd}\`.`, ephemeral: true });
  }
  setCooldown(userId, cmd, getCooldownTime(cmd));

  // Handle commands
  try {
    switch (cmd) {
      case "help": return handleHelpCommand(interaction);
      case "cat": return handleCatCommand(interaction);
      case "beg": return handleBegCommand(interaction);
      case "profile": return handleProfileCommand(interaction);
      case "gamble": return handleGambleCommand(interaction);
      case "dig": return handleDigCommand(interaction);
      case "craft": return handleCraftCommand(interaction);
      case "sell": return handleSellCommand(interaction);
      case "donate": return handleDonateCommand(interaction);
      case "reset": return handleResetCommand(interaction);
      case "givemoney": return handleGiveMoneyCommand(interaction);
      case "giveitem": return handleGiveItemCommand(interaction);
      case "work": return handleWorkCommand(interaction);
      case "give_experience": return handleGiveEXPCommand(interaction);
      case "take_money": return handleTakeMoneyCommand(interaction);
      case "take_exp": return handleTakeEXPCommand(interaction);
      case "timeout": return handleTimeoutCommand(interaction);
      case "ban": return handleBanCommand(interaction);
      case "rob": return handleRobCommand(interaction);
      case "encyclopaedia":
        if (sub === "type_soul") return handleTypeSoulEncyclopaediaCommand(interaction);
        break;
      case "shop":
        if (sub === "weapons") return handleShopWeaponsCommand(interaction);
        break;
      case "use": return handleUseItemCommand(interaction);
      case "fight": return handleFightCommand(interaction);
    }
  } catch (err) {
    console.error("⚠️ Error handling command:", err);
  }
});

// --- Ready Event ---
client.on("ready", async () => {
  console.log(`🤖 Logged in as ${client.user.tag}`);
  await database.initialize();
  console.log("📂 Database initialized");
  await deployCommands();
});

// --- Login ---
client.login(TOKEN);
