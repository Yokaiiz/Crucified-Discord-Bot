// index.js
require("dotenv").config();
const {
  Client,
  GatewayIntentBits,
  Partials,
  REST,
  Routes,
  SlashCommandBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
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
  handleShopWeaponsCommand,
  handleUseItemCommand,
  handleFightCommand,
  handleFishCommand,
  handleSuggestCommand,
  handleHugCommand,
} = require("./commands.js");

const TOKEN = process.env.DISCORD_BOT_TOKEN;
if (!TOKEN) throw new Error("❌ Missing DISCORD_BOT_TOKEN in .env file");
const OWNER_ID = process.env.OWNER_ID;
const OWNER_ID2 = process.env.OWNER_ID2;

// --- Client setup ---
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.DirectMessages,
  ],
  partials: [Partials.Channel],
});

// --- Cooldowns ---
const cooldowns = new Map();
function isOnCooldown(userId, cmd) {
  return cooldowns.has(userId) && cooldowns.get(userId).has(cmd) && cooldowns.get(userId).get(cmd) > Date.now();
}
function setCooldown(userId, cmd, ms) {
  if (!cooldowns.has(userId)) cooldowns.set(userId, new Map());
  cooldowns.get(userId).set(cmd, Date.now() + ms);
}
function getCooldownTime(cmd) {
  const times = {
    beg: 15000,
    work: 1800000,
    cat: 0,
    help: 0,
    fish: 10000,
    profile: 5000,
    gamble: 15000,
    dig: 7500,
    craft: 10000,
    sell: 10000,
    donate: 10000,
    rob: 10000,
    use: 10000,
    fight: 10000,
  };
  return times[cmd] || 5000;
}

// --- Available races ---
const races = [
  { label: "Soul Reaper", value: "Soul Reaper" },
  { label: "Arrancar (Hollow)", value: "Arrancar" },
  { label: "Quincy", value: "Quincy" },
  { label: "Fullbringer", value: "Fullbringer" },
];

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
  // Owner/Admin Commands
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
  new SlashCommandBuilder().setName("fish").setDescription("You use a fishing rod to fish!"),
  new SlashCommandBuilder().setName("work").setDescription("Work to earn money"),
  new SlashCommandBuilder().setName("suggest").setDescription("Suggest a feature to the bot owner")
    .addStringOption(option => option.setName("suggestion").setDescription("Your suggestion").setRequired(true)),
  new SlashCommandBuilder().setName('hug').setDescription('Hug another user!')
    .addUserOption(option => option.setName('target').setDescription('Who do you want to hug?').setRequired(true)),
  new SlashCommandBuilder().setName('slap').setDescription('Slap a user!')
    .addUserOption(option => option.setName('target').setDescription('The user you want to slap').setRequired(true)),
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

// --- Interaction Handler ---
client.on("interactionCreate", async (interaction) => {
  const userId = interaction.user.id;
  await database.ensureUser(userId);
  const userData = await database.getUserData(userId);

  // 🔹 Race selection enforcement
  if (interaction.isChatInputCommand()) {
    if (!userData.raceChosen && userData.race === "Human") {
      const row = new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
          .setCustomId(`select_race_${userId}`)
          .setPlaceholder("Select your race to continue")
          .addOptions(races)
      );
      return interaction.reply({
        content: "❌ You must choose a race before continuing. (Human is default)",
        components: [row],
        ephemeral: true,
      });
    }
  }

  // Slash command handling
  if (interaction.isChatInputCommand()) {
    const cmd = interaction.commandName;

    // 🔹 Owner-only check
    const ownerOnly = ["reset", "givemoney", "giveitem", "give_experience", "take_money", "take_exp"];
    if (ownerOnly.includes(cmd) && interaction.user.id !== OWNER_ID && interaction.user.id !== OWNER_ID2) {
      return interaction.reply({ content: "❌ Only the bot owner can use this command.", ephemeral: true });
    }

    // 🔹 Guild-only check
    const guildOnly = ["timeout", "ban", "help"];
    if (guildOnly.includes(cmd) && !interaction.inGuild()) {
      return interaction.reply({ content: "❌ This command can only be used in a server.", ephemeral: true });
    }

    // 🔹 Cooldowns
    if (isOnCooldown(userId, cmd)) {
      const expiresAt = cooldowns.get(userId).get(cmd);
      const timeLeft = ((expiresAt - Date.now()) / 1000).toFixed(1);
      return interaction.reply({ content: `⏳ Wait **${timeLeft}s** before using \`/${cmd}\`.`, ephemeral: true });
    }
    setCooldown(userId, cmd, getCooldownTime(cmd));

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
          if (interaction.options.getSubcommand(false) === "type_soul")
            return handleTypeSoulEncyclopaediaCommand(interaction);
          break;
        case "shop":
          if (interaction.options.getSubcommand(false) === "weapons")
            return handleShopWeaponsCommand(interaction);
          break;
        case "use": return handleUseItemCommand(interaction);
        case "fight": return handleFightCommand(interaction);
        case "fish": return handleFishCommand(interaction);
        case "suggest": return handleSuggestCommand(interaction);
        case "hug": return handleHugCommand(interaction);
        default:
          return interaction.reply({ content: "❌ Unknown command.", ephemeral: true });
      }
    } catch (err) {
      console.error("⚠️ Error handling command:", err);
    }
  }

  // 🔹 Race menu
  if (interaction.isStringSelectMenu()) {
    const match = interaction.customId.match(/^select_race_(\d+)$/);
    if (match && match[1] === interaction.user.id) {
      const selectedRace = interaction.values[0];
      userData.race = selectedRace;
      userData.raceChosen = true;
      await database.saveUserData(userId, userData);

      return interaction.update({
        content: `✅ You have selected **${selectedRace}** as your race!`,
        components: [],
      });
    }
  }

  // 🔹 Shop modal
  if (interaction.isModalSubmit()) {
    const match = interaction.customId.match(/^buy_(.+)_(\d+)$/);
    if (match) {
      let [itemKey, modalUserId] = match;
      if (modalUserId !== interaction.user.id) {
        return interaction.reply({ content: "❌ This modal is not for you.", ephemeral: true });
      }

      // normalize key
      itemKey = itemKey.toLowerCase().trim();

      const quantity = parseInt(interaction.fields.getTextInputValue("quantity"), 10);
      if (isNaN(quantity) || quantity <= 0) {
        return interaction.reply({ content: "❌ Invalid quantity.", ephemeral: true });
      }

      const userData = await database.getUserData(interaction.user.id);
      const shop = {
        zanpakuto: { name: "Zanpakuto", price: 5000 },
        zanpakuto_reroll: { name: "Zanpakuto Reroll", price: 10000 },
      };

      const selectedItem = shop[itemKey];
      if (!selectedItem) {
        return interaction.reply({ content: "❌ That item cannot be bought.", ephemeral: true });
      }

      const totalCost = selectedItem.price * quantity;
      if (userData.balance < totalCost) {
        return interaction.reply({
          content: `❌ You don’t have enough money! Need **${totalCost}**, but you only have **${userData.balance}**.`,
          ephemeral: true,
        });
      }

      userData.balance -= totalCost;
      userData.inventory[selectedItem.name] = (userData.inventory[selectedItem.name] || 0) + quantity;
      await database.saveUserData(interaction.user.id, userData);

      return interaction.reply({
        content: `✅ You bought **${quantity}x ${selectedItem.name}** for **${totalCost}** coins!`,
        ephemeral: true,
      });
    }
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
