const {
  ButtonBuilder,
  ActionRowBuilder,
  subtext,
  italic,
  bold,
  UserSelectMenuBuilder,
} = require("@discordjs/builders");
const {
  EmbedBuilder,
  ButtonStyle,
  PermissionFlagsBits,
  ComponentType,
  User,
  RoleFlags,
  ActionRow,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ReactionUserManager,
} = require("discord.js");
const database = require("./database.js");
const { StringSelectMenuBuilder, StringSelectMenuOptionBuilder } = require("@discordjs/builders");
const { job, createDynamicColour } = require("./utils/utils.js");

const Tester = [
  {
    name: 'Anon',
    ID: '1222889346747859036'
  },
  {
    name: 'Derrick',
    ID: '1053281458602655816'
  },
  {
    name: 'Eto',
    ID: '961370035555811388'
  },
  {
    name: 'Exact.Pressure',
    value: '1222050305743523932'
  }
]

// --- Helper: Owner Check ---
async function isBotOwner(interaction) {
  if (!interaction.client.application.owner) {
    await interaction.client.application.fetch();
  }
  const owner = interaction.client.application.owner;
  if (owner.members) {
    return Array.from(owner.members.values()).some(
      (member) => member.id === interaction.user.id
    );
  } else {
    return owner.id === interaction.user.id;
  }
}

// --- Command Handlers ---

async function handleBegCommand(interaction) {
  const userId = interaction.user.id;
  await database.ensureUser(userId);
  const userData = await database.getUserData(userId);

  const amount = Math.floor(Math.random() * 5000) + 500;
  const experiencegain = Math.floor(Math.random() * 1000) + 100;
  const itempool = [
    { item: "Sword", chance: 0.4 },
    { item: "Shovel", chance: 0.4 },
    { item: "Shield", chance: 0.1 },
    { item: "Pickaxe", chance: 0.1 },
  ];

  let item = null;
  let cumulative = 0;
  const random = Math.random();
  for (const obj of itempool) {
    cumulative += obj.chance;
    if (random <= cumulative) {
      item = obj.item;
      break;
    }
  }

  const isTester = Tester.some(t => t.ID === userId);

  let finalAmount = amount;
  let finalExperience = experiencegain;

  if (isTester) {
    finalAmount *= 2;       // Double rewards for testers
    finalExperience *= 2;
  }

  userData.balance += amount;
  userData.experience += experiencegain;
  userData.inventory[item] = (userData.inventory[item] || 0) + 1;
  await database.saveUserData(userId, userData);

  const embed = new EmbedBuilder()
    .setColor("Green")
    .setTitle("You begged!")
    .setDescription(
      `You begged and received **¥${amount.toLocaleString("en-US")}** along with **${item}** and **${experiencegain.toLocaleString("en-US")} experience**!`
    )
    .setTimestamp();

  await interaction.reply({ embeds: [embed], ephemeral: false });
}

async function handleProfileCommand(interaction) {
  const userId = interaction.user.id;
  const targetUserObj = interaction.options.getUser("user");
  let profileEmbed;

  if (targetUserObj) {
    const targetUserId = targetUserObj.id;
    await database.ensureUser(targetUserId);
    const targetUserData = await database.getUserData(targetUserId);
    const targetInventoryText = Object.entries(targetUserData.inventory)
      .map(([item, qty]) => `${item} x${qty}`)
      .join("\n") || "None";

    profileEmbed = new EmbedBuilder()
      .setColor("Default")
      .setTitle(`${targetUserObj.username}'s inventory, balance and experience`)
      .setThumbnail(targetUserObj.displayAvatarURL())
      .addFields(
        { name: "**Balance**", value: `**¥${targetUserData.balance.toLocaleString("en-US")}**` },
        { name: "**Experience**", value: `**${targetUserData.experience.toLocaleString("en-US")}**` },
        { name: "**Inventory**", value: `**${targetInventoryText}**` }
      )
      .setTimestamp();
  } else {
    await database.ensureUser(userId);
    const userData = await database.getUserData(userId);
    const inventoryText = Object.entries(userData.inventory)
      .map(([item, qty]) => `${item} x${qty}`)
      .join("\n") || "None";

    profileEmbed = new EmbedBuilder()
      .setColor("Default")
      .setTitle(`${interaction.user.username}'s inventory, balance and experience!`)
      .setThumbnail(interaction.user.displayAvatarURL())
      .addFields(
        { name: "**Balance**", value: `**¥${userData.balance.toLocaleString("en-US")}**` },
        { name: "**Experience**", value: `**${userData.experience.toLocaleString("en-US")}**` },
        { name: "**Inventory**", value: `**${inventoryText}**` }
      )
      .setTimestamp();
  }

  await interaction.reply({
    embeds: [profileEmbed],
    ephemeral: false,
  });
}

async function handleCatCommand(interaction) {
  try {
    const response = await fetch("https://api.thecatapi.com/v1/images/search");
    const data = await response.json();
    const imageUrl = data[0].url;

    const embed = new EmbedBuilder()
      .setTitle("Here's a cute kitty")
      .setImage(imageUrl)
      .setColor("Default")
      .setFooter({ text: "kittyuh || Catawampus" });

    await interaction.reply({ embeds: [embed] });
  } catch (error) {
    console.error("Failed to fetch cat image:", error);
    await interaction.reply("Sorry, I could not fetch a kitty image right now.");
  }
}

async function handleGambleCommand(interaction) {
  const userId = interaction.user.id;
  const amount = interaction.options.getInteger("amount");
  await database.ensureUser(userId);
  const userData = await database.getUserData(userId);

  if (!amount || amount <= 0 || userData.balance < amount) {
    return interaction.reply({
      content: "Go beg so you can actually give me some money.",
      ephemeral: true,
    });
  }

  const outcomes = [
    { name: "Jackpot", multiplier: 30, chance: 0.0025 },
    { name: "High Win", multiplier: 5, chance: 0.0075 },
    { name: "Mid Win", multiplier: 3, chance: 0.10 },
    { name: "Low Win", multiplier: 1, chance: 0.29 },
    { name: "Loss", multiplier: 0, chance: 0.60 },
  ];

  let totalChance = 0;
  let selected = outcomes[outcomes.length - 1];
  const rand = Math.random();
  for (const outcome of outcomes) {
    totalChance += outcome.chance;
    if (rand <= totalChance) {
      selected = outcome;
      break;
    }
  }

  let messageEmbed;
  const winnings = amount * selected.multiplier;

  if (selected.multiplier > 0) {
    userData.balance += winnings;
    messageEmbed = new EmbedBuilder()
      .setTitle(`🎉 You hit a **${selected.name}**!`)
      .setDescription(`You won **¥${winnings.toLocaleString("en-US")}**!`)
      .addFields({
        name: "Your new balance",
        value: `${subtext(`¥${userData.balance.toLocaleString("en-US")}`)}`,
      })
      .setColor("Green")
      .setTimestamp();
  } else {
    userData.balance -= amount;
    messageEmbed = new EmbedBuilder()
      .setTitle("💸 You lost...")
      .setDescription(
        `You lost ¥${amount.toLocaleString("en-US")}, but nothing is stopping you from trying again!`
      )
      .setColor("Red")
      .setTimestamp();
  }

  await database.saveUserData(userId, userData);
  return interaction.reply({ embeds: [messageEmbed], ephemeral: false });
}

async function handleHelpCommand(interaction) {
  const DiscordButton = new ButtonBuilder()
    .setLabel('Discord')
    .setStyle(ButtonStyle.Link)
    .setURL('https://discord.gg/ax5PFRKdMb');
  const GitHubButton = new ButtonBuilder()
    .setLabel('Github')
    .setStyle(ButtonStyle.Link)
    .setURL('https://github.com/Yokaiiz');
  const YouTubeButton = new ButtonBuilder()
    .setLabel('YouTube')
    .setStyle(ButtonStyle.Link)
    .setURL('https://www.youtube.com/@Sunken_zz');
  const TikTokButton = new ButtonBuilder()
    .setLabel('TikTok')
    .setStyle(ButtonStyle.Link)
    .setURL('https://www.tiktok.com/@crucified_xx');
  const TwitchButton = new ButtonBuilder()
    .setLabel('Twitch')
    .setStyle(ButtonStyle.Link)
    .setURL('https://www.twitch.tv/crucified_xx');

  const helpmenu = new StringSelectMenuBuilder()
    .setPlaceholder('select an option')
    .setCustomId('help-menu')
    .addOptions([
      new StringSelectMenuOptionBuilder()
        .setLabel('Discord Server 🗣️')
        .setDescription('Updates the embed to show information regarding our discord server')
        .setValue('discord-server'),
      new StringSelectMenuOptionBuilder()
        .setLabel('Crucified bot 🤖')
        .setDescription('Updates the embed to show information regarding the discord bot Crucified')
        .setValue('crucified-bot'),
      new StringSelectMenuOptionBuilder()
        .setLabel('Credits 💳')
        .setDescription('Updates the embed to show information regarding the credits')
        .setValue('credits'),
      new StringSelectMenuOptionBuilder()
        .setLabel('Updates 📜')
        .setDescription('Updates the embed to show information regarding each update about the discord bot!')
        .setValue('updates'),
    ]);

  const avatar = interaction.user.displayAvatarURL();
  const username = interaction.user.username;

  const selectmenuRow = new ActionRowBuilder().addComponents(helpmenu);
  const helpbuttonRow = new ActionRowBuilder().addComponents(
    DiscordButton, GitHubButton, YouTubeButton, TikTokButton, TwitchButton
  );

  const mainEmbed = new EmbedBuilder()
    .setColor('Default')
    .setTitle(`Hello, ${username} how may I help you today?`)
    .setThumbnail(`${avatar}`)
    .addFields(
      { name: '`Discord Server` 🗣️', value: 'Shows you information regarding our discord server such as; hierarchy, who to contact and events!' },
      { name: '`Crucified Bot` 🤖', value: 'Shows information regarding the crucified discord bot such as; list of commands' },
      { name: '`Credits` 💳', value: 'Shows information regarding the credits for the discord bot' },
      { name: '`Updates` 📜', value: 'Shows information regarding the updates list for the most recent update on the discord bot'},
    )
    .setFooter({ text: 'Thank you for using the crucified bot! || Catawampus'})
    .setTimestamp();

  await interaction.reply({
    embeds: [mainEmbed],
    components: [helpbuttonRow, selectmenuRow]
  });

  const collector = interaction.channel.createMessageComponentCollector({
    ComponentType: ComponentType.StringSelect,
    time: 60000,
    filter: (i) => i.user.id === interaction.user.id,
  });

  collector.on('collect', async (i) => {
    if (i.customId === 'help-menu' || interaction.user.id) {
      if (i.values[0] === 'discord-server') {
        const discordServerEmbed = new EmbedBuilder()
          .setColor('Gold')
          .setTitle(`Welcome to Whimsyx, ${username}`)
          .setDescription('I hope you enjoy it here!')
          .setThumbnail(`${interaction.guild.iconURL({dynamic: true})}`)
          .setAuthor({
            name: 'Eto',
            iconURL: 'https://cdn.discordapp.com/attachments/1405954272624902328/1407379269218340977/IMG_3715.jpg?ex=68a5e395&is=68a49215&hm=0fbcecf28e025401e7f34ba3418b2c546712750542ef75240da8ad196969ea32&'
          })
          .addFields({ name: 'About `Whimsyx`', value: 'We are quite the inclusive server that aims to make an environment where people can enjoy themselves, make new friends, find potential partners and also feel like theyre welcome into our server!'},
            {
              name: '`Server Hierarchy`',
              value: 'Owner: Kitty\nCo-owner: Eto/Crucified\nHead-mod: Rosie\nMod: Gaelle, Twenty\nTrial-mod: N/A\nGamenight Mod/Movienight Mod: Char'
            },
            {
              name: '`Rules`',
              value: '1. No discriminatory message of ANY kind and no distribution of NSFW content.\n2. If you are incapable of taking a joke, then please either say youre uncomfortable or leave the server.\n3. No form of leaking each others details including: faces, addresses or/and anything sensitive. (please ask for their content!)\n4. If you are in need of any form of help please dm the owner Kitty or a moderator.\n5. Nobody under 13 is to be allowed in the server at all.\n6. Be kind to each other, we are here to make new friendships or even find a potential partner and not to start any sort of drama between one another.\n7. Everyone is given 2 warnings before being entirely banned from the server, of course this varies depending on the situation/scenario.\n8. Do not self-advertise without the permission of an admin or higher.\n9. Do not be disrespectful towards mods or higher.\n10. if you are not hispanic/black or have any black ancestry then do NOT say the N word (emphasis on the first rule.)'
            },
            {
              name: '`Events`',
              value: 'Every saturday there will be a movie night hosted by Eto/Kitty or the moderator for the events. Please drop your suggestions in the suggestions channel, and for the game-nights it has not been decided yet.'
            },
            {
              name: '`Partnerships`',
              value: 'We at `Whimsyx` value actual and properly done partnerships between servers, so if you have any sort of plans to be partnering with us please be aware we demand you are active in our server as much as we are in yours.'
            }
          )
          .setFooter({ text: 'Thank you for using the Crucified Bot || Catawampus' })
          .setTimestamp();

        await i.update({
          embeds: [discordServerEmbed],
          components: [helpbuttonRow, selectmenuRow],
          ephemeral: false,
        });
      } else if (i.values[0] === 'crucified-bot') {
        const crucifiedbotEmbed = new EmbedBuilder()
        .setColor('Random')
        .setTitle(`Welcome to the page regarding the bot, ${username}`)
        .setAuthor({
          name: 'Eto',
          iconURL: 'https://cdn.discordapp.com/attachments/1405954272624902328/1407379269218340977/IMG_3715.jpg?ex=68a5e395&is=68a49215&hm=0fbcecf28e025401e7f34ba3418b2c546712750542ef75240da8ad196969ea32&',
        })
        .setThumbnail(`${avatar}`)
        .setImage('https://i.pinimg.com/1200x/bb/e4/51/bbe4511516852422983846dfd85d6f18.jpg')
        .addFields(
          {
            name: '`/beg`',
            value: 'Lets you beg for a randomised amount of yen and experience alongside an item which you can utilise to `/dig`(if it is the shovel) or `/sell` if you do not want to use it at all.'
          },
          {
            name: '`/cat`',
            value: 'sends a completely random image of a cat utilising the fetch function from an API, has no other uses and will NOT have any other uses.'
          },
          {
            name: '`/craft`',
            value: 'Lets you craft sellable items from raw materials, I plan to use this so you can craft your own swords, shields and whatnot for fighting.'
          },
          {
            name: '`/Dig`',
            value: 'Uses a shovel to dig for for raw materials which you can utilise within the `/craft` command.'
          },
          {
            name: '`/donate <user> <amount>`',
            value: 'Lets you donate money to anyone! it also gives them a client message that they have been donated to by you.'
          },
          {
            name: '`/gamble <amount>`',
            value: 'Quite literally lets you gamble your life savings away.'
          },
          {
            name: '`/give_experience <user> <amount>`',
            value: 'Do not try and use, its an owner-bot exclusive command that lets the creator give experience to anyone within the database meanwhile not being home.'
          },
          {
            name: '`/giveitem <user> <amount>`',
            value: 'Same as give_experience, do not use as it is an owner-bot exclusive command that lets the creator give any item at any quantity'
          },
          {
            name: '`/givemoney <user> <amount>`',
            value: 'Do not use as its owner-bot exclusive. It lets me give any amount of money to anyone as long as i have their userID at hand.'
          },
          {
            name: '`/help`',
            value: 'You are using the command right now!'
          },
          {
            name: '`/profile <user(optional btw)>`',
            value: 'Lets you see your own balance, experience and inventory. it also lets you see other individuals profiles.'
          },
          {
            name: '`/reset <user>`',
            value: 'its a command thats exclusive to the bot-owner, it lets him reset anybodys data.'
          },
          {
            name: '`/sell <item> <amount>`',
            value: 'lets you sell items within your inventory for yen'
          },
          {
            name: '`/take_exp`',
            value: 'lets the bot-owner take any amount of exp from someone without requiring direct access to the database from his PC'
          },
          {
            name: '`/take_money`',
            value: 'lets the bot-owner take any amount of money from you at will without requiring direct access to the database.'
          },
          {
            name: '`/timeout <user> <time (in milliseconds)>`',
            value: 'lets server admins timeout members for a specific duration of time.'
          },
          {
            name: '`/work`',
            value: 'lets you work to gain exp and money faster, of course though there is a 30 minute cooldown to this command.'
          },
          {
            name: '`/timeout <user> <time>`',
            value: 'Allows the admins within the server to timeout a member, the maximum time someone can be timed out is 28 days.'
          },
          {
            name: '`/ban <user> <reason>`',
            value: 'Allows the admins within the server to ban a member, of course with a reason as well as it is required.'
          },
          {
            name: '`/rob <user>`',
            value: 'Lets you rob a specific user for an amount of money (max is 5K) with the 50% chance of failing and succeeding.'
          },
          {
            name: '`/encyclopaedia <subcommand>`',
            value: 'It functions like a wikipedia command but for games, the subcommand (e.g, minecraft) tells you what game you will be learning about'
          }
        )
        .setFooter({text: `thank you for using the Crucified bot || Catawampus`})
        .setTimestamp();

        await i.update({
          embeds: [crucifiedbotEmbed],
          components: [helpbuttonRow, selectmenuRow]
        });
      } else if (i.values[0] === 'credits') {
        const creditsEmbed = new EmbedBuilder()
        .setColor('Random')
        .setTitle('Welcome to the credits page!')
        .setDescription('the utmost amount of credit goes to my friend Alison, the creator of NStudios and the JJK bot!')
        .setThumbnail(`${avatar}`)
        .setFooter({text: `Thank you for using the Crucified bot! || Catawampus`})
        .setTimestamp();

        await i.update({
          embeds: [creditsEmbed],
          components: [helpbuttonRow, selectmenuRow]
        });
      } else if (i.values[0] === 'updates') {
        const updatesEmbed = new EmbedBuilder()
        .setColor('Grey')
        .setTitle('Update 1')
        .setDescription('Here is our very first update, small but impactful nonetheless.')
        .setImage('https://i.pinimg.com/736x/b7/31/31/b73131e43d1b84ef9c4935827511485f.jpg')
        .setThumbnail(`${avatar}`)
        .addFields(
          {
            name: 'New commands!',
            value: 'The following commands were added in update 1:\n`/timeout`\n`/ban`\n`/rob`'
          },
          {
            name: 'Nerfs, Buffs and Changes!',
            value: '1. Gambling has been nerfed so the chances of winning are way lower (accurate to casinos)\n2. Jobs in `/work` have been buffed but require more experience compared to what they were like before.\n3. Entirely rewrote `/help` to show information regarding the server such as: partnerships.\n I also updated it so it is up to date with the newest information regarding Eto Bot.\n4. Buffed `/beg` quite a bit to make up for the gambling nerf.\n5. Increased the cooldowns on some commands to make up for the increased usage of gambling and so it is not over-used\n5. Made it so you cannot rob yourself using the `/rob` command.'
          }
        )
        .setFooter({text: 'Thank you for using Crucified bot || Catawampus'})
        .setTimestamp();

        await i.update({
          embeds: [updatesEmbed],
          components: [helpbuttonRow, selectmenuRow]
        });
      }
      // Add more cases for other menu options as needed
    }
  });
}

async function handleDigCommand(interaction) {
  const userId = interaction.user.id;
  await database.ensureUser(userId);
  const userData = await database.getUserData(userId);

  const shovelKey = "Shovel";
  if (!userData.inventory[shovelKey] || userData.inventory[shovelKey] <= 0) {
    return interaction.reply({
      content: "You need a Shovel to dig, go beg for one brokie.",
      ephemeral: true,
    });
  }

  userData.inventory[shovelKey] -= 1;
  if (userData.inventory[shovelKey] === 0) {
    delete userData.inventory[shovelKey];
  }
  await database.saveUserData(userId, userData);

  const digItemPool = [
    { item: "Raw gold", chance: 0.05 },
    { item: "Raw diamond", chance: 0.05 },
    { item: "Raw iron", chance: 0.3 },
    { item: "Raw copper", chance: 0.2 },
    { item: "nothing", chance: 0.4 },
  ];

  let item = null;
  let cumulative = 0;
  const random = Math.random();
  for (const obj of digItemPool) {
    cumulative += obj.chance;
    if (random <= cumulative) {
      item = obj.item;
      break;
    }
  }

  if (item === "nothing") {
    return interaction.reply({
      content: "You dug but found nothing, better luck next time brokie.",
      ephemeral: true,
    });
  } else {
    userData.inventory[item] = (userData.inventory[item] || 0) + 1;
    await database.saveUserData(userId, userData);
    return interaction.reply({
      content: `You dug and found **${item}**!`,
      ephemeral: true,
    });
  }
}

async function handleCraftCommand(interaction) {
  const userId = interaction.user.id;
  await database.ensureUser(userId);
  const userData = await database.getUserData(userId);
  const avatar = interaction.user.displayAvatarURL();

  const craftingEmbed = new EmbedBuilder()
    .setColor("Default")
    .setTitle("Crafting Menu")
    .setDescription("Select an item to craft from the dropdown menu below.")
    .setThumbnail(`${avatar}`)
    .setFooter({
      text: "Thank you for using the crucified bot! || Developed by crucifiedxx",
    })
    .setTimestamp();

  const craftingOptions = new StringSelectMenuBuilder()
    .setCustomId("crafting-select-menu")
    .setPlaceholder("Choose an item to craft")
    .addOptions([
      new StringSelectMenuOptionBuilder()
        .setValue("gold_bar")
        .setLabel("gold bar")
        .setDescription("Craft a gold bar using 5 raw gold and 1000 yen."),
      new StringSelectMenuOptionBuilder()
        .setValue("iron_bar")
        .setLabel("iron bar")
        .setDescription("Craft an iron bar using 5 raw iron and 500 yen."),
      new StringSelectMenuOptionBuilder()
        .setValue("copper_bar")
        .setLabel("copper bar")
        .setDescription("Craft a copper bar using 5 raw copper and 250 yen."),
    ]);

  const craftingselectmenu = new ActionRowBuilder().addComponents(craftingOptions);

  await interaction.reply({
    embeds: [craftingEmbed],
    components: [craftingselectmenu],
    ephemeral: false,
  });

  const craftingCollector = interaction.channel.createMessageComponentCollector({
    ComponentType: ComponentType.StringSelect,
    time: 60000,
    filter: (i) => i.user.id === interaction.user.id,
  });

  craftingCollector.on("collect", async (i) => {
    let itemName = "";
    let requiredItem = "";
    let requiredAmount = 0;
    let requiredMoney = 0;
    const expGain = Math.floor(Math.random() * 100) + 50;

    if (i.values[0] === "gold_bar") {
      itemName = "Gold bar";
      requiredItem = "Raw gold";
      requiredAmount = 5;
      requiredMoney = 1000;
    } else if (i.values[0] === "iron_bar") {
      itemName = "Iron bar";
      requiredItem = "Raw iron";
      requiredAmount = 5;
      requiredMoney = 500;
    } else if (i.values[0] === "copper_bar") {
      itemName = "Copper bar";
      requiredItem = "Raw copper";
      requiredAmount = 5;
      requiredMoney = 250;
    } else {
      return i.reply({ content: "Invalid crafting option.", ephemeral: true });
    }

    if (
      (userData.inventory[requiredItem] || 0) < requiredAmount ||
      userData.balance < requiredMoney
    ) {
      return i.reply({
        content: `You do not have enough resources to craft a ${itemName}.`,
        ephemeral: true,
      });
    }

    userData.inventory[requiredItem] -= requiredAmount;
    if (userData.inventory[requiredItem] === 0) {
      delete userData.inventory[requiredItem];
    }
    userData.balance -= requiredMoney;
    userData.inventory[itemName] = (userData.inventory[itemName] || 0) + 1;
    userData.experience += expGain;

    await database.saveUserData(userId, userData);

    await i.reply({
      content: `You crafted a **${itemName}** and also acquired **${expGain}** EXP from crafting!`,
      ephemeral: true,
    });
  });
}

async function handleSellCommand(interaction) {
  const userId = interaction.user.id;
  await database.ensureUser(userId);
  const userData = await database.getUserData(userId);
  const ItemToSell = interaction.options.getString("item");
  const ItemQuantity = interaction.options.getInteger("amount");

  const itemPrice = [
    { name: "Raw gold", price: 500 },
    { name: "Raw diamond", price: 1000 },
    { name: "Raw iron", price: 100 },
    { name: "Raw copper", price: 50 },
    { name: "Gold bar", price: 5000 },
    { name: "Iron bar", price: 1000 },
    { name: "Copper bar", price: 500 },
    { name: "Sword", price: 5000 },
    { name: "Shield", price: 3000 },
    { name: "Pickaxe", price: 500 },
    { name: "Shovel", price: 500 },
  ];

  const priceObj = itemPrice.find((item) => item.name === ItemToSell);
  if (!priceObj) {
    return interaction.reply({
      content: `**${ItemToSell}** cannot be sold.`,
      ephemeral: true,
    });
  }

  const TotalItemPrice = priceObj.price * ItemQuantity;

  if (!userData.inventory[ItemToSell] || userData.inventory[ItemToSell] < ItemQuantity) {
    return interaction.reply({
      content: `You do not have enough of **${ItemToSell}** to sell.`,
      ephemeral: true,
    });
  }

  userData.inventory[ItemToSell] -= ItemQuantity;
  if (userData.inventory[ItemToSell] === 0) {
    delete userData.inventory[ItemToSell];
  }

  userData.balance += TotalItemPrice;
  await database.saveUserData(userId, userData);

  await interaction.reply({
    content: `You sold **${ItemQuantity.toLocaleString("en-US")}** of **${ItemToSell}** for **¥${TotalItemPrice.toLocaleString("en-US")}**!`,
    ephemeral: true,
  });
}

async function handleDonateCommand(interaction) {
  const userId = interaction.user.id;
  await database.ensureUser(userId);
  const userData = await database.getUserData(userId);
  const amount = interaction.options.getInteger("amount");
  const targetUserId = interaction.options.getUser("user").id;

  if (!amount || amount <= 0 || userData.balance < amount) {
    return interaction.reply({
      content: `You do not have enough balance to donate ¥${amount}.`,
      ephemeral: true,
    });
  } else if (targetUserId === userId) {
    return interaction.reply({
      content: "You can't donate to yourself, brokie.",
      ephemeral: true,
    });
  }
  const targetUserData = await database.getUserData(targetUserId);
  if (!targetUserData) {
    return interaction.reply({
      content: "The user you are trying to donate to does not exist.",
      ephemeral: true,
    });
  }

  userData.balance -= amount;
  targetUserData.balance += amount;
  await database.saveUserData(userId, userData);
  await database.saveUserData(targetUserId, targetUserData);
  await interaction.reply({
    content: `You donated **¥${amount.toLocaleString("en-US")}** to <@${targetUserId}>!`,
    ephemeral: true,
  });
  await interaction.client.users.fetch(targetUserId).then(user =>
    user.send({
      content: `You received a donation of **¥${amount.toLocaleString("en-US")}** from <@${userId}>!`,
    }).catch(() => {})
  );
}

async function handleResetCommand(interaction) {
  try {
    const targetUserId = interaction.options.getUser("user").id;
    if (!(await isBotOwner(interaction))) {
      return interaction.reply({
        content: "You do not have permission to use this command.",
        ephemeral: true,
      });
    }
    await database.resetUserData(targetUserId);
    await interaction.reply({
      content: `Successfully reset data for <@${targetUserId}>`,
      ephemeral: true,
    });
  } catch (error) {
    console.error(error);
    await interaction.reply({
      content: "An error occurred while resetting user data.",
      ephemeral: true,
    });
  }
}

async function handleGiveMoneyCommand(interaction) {
  const userId = interaction.options.getUser("user").id;
  const amount = interaction.options.getInteger("amount");
  await database.ensureUser(userId);
  const userData = await database.getUserData(userId);

  if (!(await isBotOwner(interaction))) {
    return interaction.reply({
      content: "You do not have permission to use this command.",
      ephemeral: true,
    });
  }
  userData.balance += amount;
  await database.saveUserData(userId, userData);
  await interaction.reply({
    content: `You gave **¥${amount.toLocaleString("en-US")}** to <@${userId}>!`,
    ephemeral: true,
  });
}

async function handleGiveItemCommand(interaction) {
  const userId = interaction.options.getUser("user").id;
  const item = interaction.options.getString("item");
  const quantity = interaction.options.getInteger("amount");
  await database.ensureUser(userId);
  const userData = await database.getUserData(userId);

  if (!(await isBotOwner(interaction))) {
    return interaction.reply({
      content: "You do not have permission to use this command.",
      ephemeral: true,
    });
  }

  userData.inventory[item] = (userData.inventory[item] || 0) + quantity;
  await database.saveUserData(userId, userData);
  await interaction.reply({
    content: `You gave **${quantity}** of **${item}** to <@${userId}>!`,
    ephemeral: true,
  });
}

async function handleWorkCommand(interaction) {
  const userId = interaction.user.id;
  await database.ensureUser(userId);
  const userData = await database.getUserData(userId);
  const avatar = interaction.user.displayAvatarURL();

  const jobOptions = Object.entries(job).map(([key, value]) => ({
    label: key,
    value: key,
    name: value.name,
    description: value.description,
  }));

  const workEmbed = new EmbedBuilder()
    .setColor(await createDynamicColour())
    .setTitle(`Hello, ${interaction.user.username}`)
    .setDescription("Here are your work options!")
    .setThumbnail(`${avatar}`)
    .addFields(
      jobOptions.map(({ value }) => {
        const {
          name,
          description,
          experience_required,
          wage,
          experience_gain,
        } = job[value] || {};
        return {
          name: name || value,
          value: [
            subtext(description || "N/A"),
            subtext(`Experience required: **${experience_required?.toLocaleString("en-US") ?? 0}**`),
            subtext(`Wage: **¥${wage?.toLocaleString("en-US") ?? 0}**`),
            subtext(`EXP Gain: **${experience_gain?.toLocaleString("en-US") ?? 0}**`),
          ].join("\n"),
        };
      })
    )
    .setFooter({
      text: "Thank you for using the crucified bot!\nDeveloped by crucifiedxx",
    })
    .setTimestamp();

  const selectWorkMenu = new StringSelectMenuBuilder()
    .setCustomId("select-work-menu")
    .setPlaceholder("Choice of work")
    .addOptions(jobOptions);

  const selectWorkMenuRow = new ActionRowBuilder().addComponents(selectWorkMenu);

  await interaction.reply({
    embeds: [workEmbed],
    components: [selectWorkMenuRow],
  });

  const workSelectionCollector = interaction.channel.createMessageComponentCollector({
    ComponentType: ComponentType.StringSelect,
    time: 60000,
    filter: (i) => i.user.id === interaction.user.id,
  });

  workSelectionCollector.on("collect", async (i) => {
    if (i.customId !== "select-work-menu") return;

    const selectedJobKey = i.values[0];
    const selectedJob = job[selectedJobKey];

    if (!selectedJob || userData.experience < selectedJob.experience_required) {
      return i.reply({
        content: `You don't have enough experience to work this job.\n${subtext(
          `Your experience: ${userData.experience} Needed: ${selectedJob.experience_required}`
        )}`,
        ephemeral: true,
      });
    }

    userData.balance += selectedJob.wage;
    userData.experience += selectedJob.experience_gain;
    await database.saveUserData(userId, userData);

    await i.reply({
      content: `You worked as a **${selectedJob.name.replace(
        /_/g,
        " "
      )}** and earned **¥${selectedJob.wage.toLocaleString(
        "en-US"
      )}**!\n-# You also gained **${selectedJob.experience_gain.toLocaleString("en-US")}** EXP.`,
    });

    const disabledMenu = new StringSelectMenuBuilder()
      .setCustomId("select-work-menu")
      .setPlaceholder("Choice of work")
      .addOptions(jobOptions)
      .setDisabled(true);
    const disabledRow = new ActionRowBuilder().addComponents(disabledMenu);
    await i.message.edit({
      content: `${italic(
        "You've worked, so the components for this message have been disabled!"
      )}`,
      components: [disabledRow],
    });
  });
}

async function handleGiveEXPCommand(interaction) {
  const userId = interaction.options.getUser("user").id;
  await database.ensureUser(userId);
  const userData = await database.getUserData(userId);
  const amount = interaction.options.getInteger("amount");

  if (!(await isBotOwner(interaction))) {
    return interaction.reply({
      content: "You do not have permission to use this command.",
      ephemeral: true,
    });
  }

  userData.experience += amount;
  await database.saveUserData(userId, userData);

  await interaction.reply({
    content: `You have given <@${userId}> **${amount.toLocaleString(
      "en-US"
    )}** EXP, their total EXP is now **${userData.experience.toLocaleString(
      "en-US"
    )}**`,
    ephemeral: true,
  });
}

async function handleTakeMoneyCommand(interaction) {
  const userId = interaction.options.getUser("target").id;
  await database.ensureUser(userId);
  const userData = await database.getUserData(userId);
  const takeAmount = interaction.options.getInteger("amount");

  if (!(await isBotOwner(interaction))) {
    return interaction.reply({
      content: "You do not have permission to use this command.",
      ephemeral: true,
    });
  }

  userData.balance -= takeAmount;
  await database.saveUserData(userId, userData);

  await interaction.reply({
    content: `You took away **¥${takeAmount.toLocaleString(
      "en-US"
    )}** from <@${userId}>, their new balance is **¥${userData.balance.toLocaleString(
      "en-US"
    )}**`,
    ephemeral: true,
  });
}

async function handleTakeEXPCommand(interaction) {
  const targetID = interaction.options.getUser("target").id;
  await database.ensureUser(targetID);
  const userData = await database.getUserData(targetID);
  const TakeAwayAmount = interaction.options.getInteger("amount");

  if (!(await isBotOwner(interaction))) {
    return interaction.reply({
      content: "You do not have permission to use this command.",
      ephemeral: true,
    });
  }

  userData.experience -= TakeAwayAmount;
  await database.saveUserData(targetID, userData);

  await interaction.reply({
    content: `You have taken away **${TakeAwayAmount}** from <@${targetID}>, their new experience count is **${userData.experience}**`,
    ephemeral: true,
  });
}

async function handleTimeoutCommand(interaction) {
  const targetUser = interaction.options.getUser('target');
  const time = interaction.options.getInteger('time'); // in ms

  const MAX_TIMEOUT = 2419200000; // 28 days in ms
  if (!time || time < 1000 || time > MAX_TIMEOUT) {
    return interaction.reply({
      content: "Please provide a valid timeout duration (1s to 28d in ms).",
      ephemeral: true,
    });
  }

  let member;
  try {
    member = await interaction.guild.members.fetch(targetUser.id);
  } catch {
    return interaction.reply({
      content: "That user is not in this server.",
      ephemeral: true,
    });
  }

  if (!interaction.member.permissions.has(PermissionFlagsBits.ModerateMembers)) {
    return interaction.reply({
      content: "You do not have permission to timeout members.",
      ephemeral: true,
    });
  }

  if (!interaction.guild.members.me.permissions.has(PermissionFlagsBits.ModerateMembers)) {
    return interaction.reply({
      content: "I do not have permission to timeout members.",
      ephemeral: true,
    });
  }

  try {
    await member.timeout(time, `Timed out by ${interaction.user.username}`);
    await interaction.reply({
      content: `<@${targetUser.id}> has been timed out for ${(time / 1000).toLocaleString("en-US")} seconds by ${interaction.user.username}`,
      ephemeral: false,
    });
  } catch (error) {
    console.error(error);
    await interaction.reply({
      content: "Failed to timeout the member. Do I have the right permissions and is the target below me in the role list?",
      ephemeral: true,
    });
  }
}

async function handleBanCommand(interaction) {
  const targetUser = interaction.options.getUser('user');
  const reason = interaction.options.getString('reason') || 'No reason provided';
  const admin = interaction.user.id;

  // Ensure target exists
  if (!targetUser) {
    return interaction.reply({
      content: 'You must specify a user to ban!',
      ephemeral: true,
    });
  }

  // Permission checks
  if (!interaction.member.permissions.has(PermissionFlagsBits.BanMembers)) {
    console.log(`${interaction.user.username} tried to use /ban but lacked permissions.`);
    return interaction.reply({
      content: 'You do not have permission to use this command.',
      ephemeral: true,
    });
  }

  if (!interaction.guild.members.me.permissions.has(PermissionFlagsBits.BanMembers)) {
    console.log(`Bot does not have permission to ban members.`);
    return interaction.reply({
      content: 'I do not have permission to ban members.',
      ephemeral: true,
    });
  }

  // Try to fetch the member
  let member;
  try {
    member = await interaction.guild.members.fetch(targetUser.id);
  } catch (error) {
    console.error(error);
    return interaction.reply({
      content: 'Could not find this member in the server.',
      ephemeral: true,
    });
  }

  // Ban user
  try {
    await member.ban({ reason: `Banned by ${interaction.user.username}: ${reason}` });
    return interaction.reply({
      content: `<@${targetUser.id}> has been banned by <@${admin}> for: **${reason}**`,
    });
  } catch (error) {
    console.error(error);
    return interaction.reply({
      content: 'Sorry, something went wrong while trying to ban this user.',
      ephemeral: true,
    });
  }
}

async function handleRobCommand(interaction) {
  const target = interaction.options.getUser('target');
  const robber = interaction.user.id;

  // Ensure both users exist in the DB
  await database.ensureUser(robber);
  await database.ensureUser(target.id);

  const robberData = await database.getUserData(robber);
  const targetData = await database.getUserData(target.id);

  // Decide outcome (50/50 chance)
  const outcome = Math.random() < 0.5 ? "Success" : "Failure";
  const robAmount = Math.floor(Math.random() * 5000) + 100;

  if (target.id === interaction.user.id) {
    return interaction.reply({
      content: 'You cannot rob yourself dummy'
    });
  }

  if (outcome === "Success") {
    // Update balances
    robberData.balance += robAmount;
    targetData.balance = Math.max(0, targetData.balance - robAmount);

    // Save both users
    await database.saveUserData(robber, robberData);
    await database.saveUserData(target.id, targetData);

    // Reply in channel
    await interaction.reply({
      content: `<@${robber}> stole **¥${robAmount.toLocaleString("en-US")}** from <@${target.id}>`,
      ephemeral: false,
    });

    // DM the target
    try {
      const targetUser = await interaction.client.users.fetch(target.id);
      await targetUser.send(
        `<@${robber}> stole **¥${robAmount.toLocaleString("en-US")}** from you! Your new balance is **¥${targetData.balance.toLocaleString("en-US")}**.`
      );
    } catch (err) {
      console.log("Could not DM target user:", err);
    }
  } else {
    // Failure outcome
    await interaction.reply({
      content: `You tried to steal **¥${robAmount.toLocaleString("en-US")}** from <@${target.id}> but failed!`,
      ephemeral: true,
    });

    try {
      const targetUser = await interaction.client.users.fetch(target.id);
      await targetUser.send(
        `<@${robber}> tried to steal **¥${robAmount.toLocaleString("en-US")}** from you but failed.`
      );
    } catch (err) {
      console.log("Could not DM target user:", err);
    }
  }
}

async function handleTypeSoulEncyclopaediaCommand(interaction) {
  const TrelloButton = new ButtonBuilder()
  .setLabel('Type soul trello')
  .setStyle(ButtonStyle.Link)
  .setURL('https://trello.com/b/B8cRro0r/type-soul-info-hell-update')

  const trelloButtonRow = new ActionRowBuilder().addComponents(TrelloButton);

  await interaction.reply({
    content: 'Figure it out bruh... Stop being lazy fr',
    components: [trelloButtonRow]
  });
}


async function handleShopWeaponsCommand(interaction) {
  const userId = interaction.user.id;
  await database.ensureUser(userId);
  const userData = await database.getUserData(userId);

  // Shop items
  const shop = {
    zanpakuto: { name: "Zanpakuto", price: 5000 },
  };

  // Select menu
  const weaponBuySelectMenu = new StringSelectMenuBuilder()
    .setPlaceholder("Select a weapon to buy")
    .setCustomId("weapon_shop")
    .addOptions([
      new StringSelectMenuOptionBuilder()
        .setLabel("Zanpakuto")
        .setValue("zanpakuto")
        .setDescription("Lets you buy a Zanpakuto || Cost: 5,000"),
    ]);

  const weaponBuyRow = new ActionRowBuilder().addComponents(weaponBuySelectMenu);

  // Shop embed
  const mainShopWeaponEmbed = new EmbedBuilder()
    .setColor("Grey")
    .setTitle("Weapon Shop")
    .setDescription("Welcome to the weapon shop! What would you like to buy?")
    .setImage(
      "https://i.pinimg.com/1200x/d5/99/2c/d5992c7c032d63578138dd76abf3a72c.jpg"
    )
    .setThumbnail(interaction.user.displayAvatarURL())
    .setFooter({ text: "Thank you for visiting the weapon shop! || Catawampus" })
    .setTimestamp();

  await interaction.reply({
    embeds: [mainShopWeaponEmbed],
    components: [weaponBuyRow],
  });

  // Collector for menu
  const collector = interaction.channel.createMessageComponentCollector({
    componentType: ComponentType.StringSelect,
    time: 60000,
    filter: (i) => i.user.id === interaction.user.id,
  });

  collector.on("collect", async (i) => {
    if (i.customId !== "weapon_shop") return;

    const choice = i.values[0];
    const selectedItem = shop[choice];

    if (!selectedItem) {
      return i.reply({
        content: "❌ That item is not available!",
        ephemeral: true,
      });
    }

    // Show modal to ask for quantity
    const modal = new ModalBuilder()
      .setCustomId(`buy_${choice}_${userId}`) // Make modal ID unique per user
      .setTitle(`Buy ${selectedItem.name}`);

    const quantityInput = new TextInputBuilder()
      .setCustomId("quantity")
      .setLabel(`How many ${selectedItem.name}s do you want to buy?`)
      .setStyle(TextInputStyle.Short)
      .setPlaceholder("Enter a number (e.g. 2)")
      .setRequired(true);

    const modalRow = new ActionRowBuilder().addComponents(quantityInput);
    modal.addComponents(modalRow);

    await i.showModal(modal);
  });

  collector.on("end", () => {
    interaction
      .update({
        components: [],
      })
      .catch(() => {});
  });
}

async function handleShopItemsCommand(interaction) {

}

async function handleUseItemCommand(interaction) {
  const userId = interaction.user.id;
  await database.ensureUser(userId);
  const userData = await database.getUserData(userId);
  const item = interaction.options.getString('item');

  // Usable items
  const zanpakutoKey = 'Zanpakuto';

  if (item === zanpakutoKey) {
    if (!userData.inventory[zanpakutoKey] || userData.inventory[zanpakutoKey] < 1) {
      return interaction.reply({
        content: "You don't have a Zanpakuto to use.",
        ephemeral: true,
      });
    }

    userData.inventory[zanpakutoKey] -= 1;
    if (userData.inventory[zanpakutoKey] === 0) {
      delete userData.inventory[zanpakutoKey];
    }

    const randomshikai = [
      {name: 'Snow', chance: 0.01},
      {name: 'Benihime', chance: 0.01},
      {name: 'Zangetsu', chance: 0.01},
      {name: 'Fire', chance: 0.01},
      {name: 'Kyoka Suigetsu', chance: 0.01},
      {name: 'Zabimaru', chance: 0.05},
      {name: 'Shinso', chance: 0.10},
      {name: 'Hyorinmaru', chance: 0.10},
      {name: 'Wabisuke', chance: 0.20},
      {name: 'Senbonzakura', chance: 0.5}
    ];

    let cumulative = 0;
    const roll = Math.random();
    let selectedShikai = randomshikai[randomshikai.length - 1].name;
    for (const s of randomshikai) {
      cumulative += s.chance;
      if (roll <= cumulative) {
        selectedShikai = s.name;
        break;
      }
    }

    userData.power = selectedShikai;
    await database.saveUserData(userId, userData);

    return interaction.reply({
      content: `You used a Zanpakuto and awakened the **${selectedShikai}** shikai!`,
      ephemeral: false,
    });
  } else {
    return interaction.reply({
      content: "That item cannot be used.",
      ephemeral: true,
    });
  }
}

// --- Exports ---
module.exports = {
  handleCatCommand,
  handleBegCommand,
  handleProfileCommand,
  handleGambleCommand,
  handleHelpCommand,
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
  handleShopItemsCommand,
  handleUseItemCommand,
};
