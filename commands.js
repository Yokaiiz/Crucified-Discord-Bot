const { ButtonBuilder, ActionRowBuilder, subtext } = require("@discordjs/builders");
const { EmbedBuilder, ButtonStyle } = require("discord.js");
const database = require("./database.js");
const { StringSelectMenuBuilder } = require("@discordjs/builders");
const { StringSelectMenuOptionBuilder } = require("@discordjs/builders");
const { ComponentType } = require("discord.js");

async function handleBegCommand(interaction) {
  const userId = interaction.user.id;

  // Ensure user exists in DB
  await database.ensureUser(userId);

  // Get user data
  const userData = await database.getUserData(userId);

  // Generate random amount
  const amount = Math.floor(Math.random() * 300) + 50;
  const experiencegain = Math.floor(Math.random() * 100) + 50;
  const itempool = [
    { item: "Sword", chance: 0.4 },
    { item: "Shovel", chance: 0.4 },
    { item: "Shield", chance: 0.1 },
    { item: "Pickaxe", chance: 0.1 },
  ];

  const random = Math.random();
  let cumulative = 0;
  let item = null;

  for (const obj of itempool) {
    cumulative += obj.chance;
    if (random <= cumulative) {
      item = obj.item;
      break;
    }
  }

  // Update balance
  userData.balance += amount;
  userData.experience += experiencegain
  if (userData.inventory[item]) {
    userData.inventory[item] += 1;
  } else {
    userData.inventory[item] = 1;
  }

  // Save back to DB
  await database.saveUserData(userId, userData);

  // Build embed
  const embed = new EmbedBuilder()
    .setColor("Green")
    .setTitle("You begged!")
    .setDescription(
      `You begged and received **¥${amount.toLocaleString("en-US")}** along with **${item}** and **${experiencegain.toLocaleString("en-US")} experience**!`
    )
    .setTimestamp();

  await interaction.reply({ embeds: [embed], ephemeral: false, });
}

async function handleProfileCommand(interaction) {
  const userId = interaction.user.id;
  const targetUserObj = interaction.options.getUser('user');
  let profileEmbed;

  if (targetUserObj) {
    const targetUserId = targetUserObj.id;
    await database.ensureUser(targetUserId);
    const targetUserData = await database.getUserData(targetUserId);
    const targetInventoryText = Object.entries(targetUserData.inventory)
      .map(([item, qty]) => `${item} x${qty}`)
      .join("\n");

    profileEmbed = new EmbedBuilder()
      .setColor('Default')
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
      .join("\n");

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
    ephemeral: false
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
    await interaction.reply(
      "Sorry, I could not fetch a kitty image right now."
    );
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
    { name: "Jackpot", multiplier: 5, chance: 0.1 },
    { name: "High Win", multiplier: 3, chance: 0.15 },
    { name: "Mid Win", multiplier: 2, chance: 0.2 },
    { name: "Low Win", multiplier: 1, chance: 0.25 },
    { name: "Loss", multiplier: 0, chance: 0.3 },
  ];

  // Select outcome based on weighted chance
  const rand = Math.random();
  let totalChance = 0;
  let selected = outcomes[outcomes.length - 1]; // Default to 'Loss'

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
      .addFields(
        {
          name: 'Your new balance',
          value: `${subtext(`¥${userData.balance.toLocaleString("en-US")}`)}`,
        }
      )
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

  return interaction.reply({ embeds: [messageEmbed], ephemeral: true,
   });
}

async function handleHelpCommand(interaction) {
  const avatar = interaction.user.displayAvatarURL();

  const DiscordServerButton = new ButtonBuilder()
    .setLabel("Discord Server")
    .setStyle(ButtonStyle.Link)
    .setURL("https://discord.gg/DPrxwz8nEQ");

  const TwitchButton = new ButtonBuilder()
    .setLabel("Twitch")
    .setStyle(ButtonStyle.Link)
    .setURL("https://www.twitch.tv/crucified_xx");

  const YouTubeButton = new ButtonBuilder()
    .setLabel("YouTube")
    .setStyle(ButtonStyle.Link)
    .setURL("https://www.youtube.com/@Sunken_zz");

  const TikTokButton = new ButtonBuilder()
    .setLabel("TikTok")
    .setStyle(ButtonStyle.Link)
    .setURL("https://www.tiktok.com/@crucified_xx");

  const GitHubButton = new ButtonBuilder()
    .setLabel("Github")
    .setStyle(ButtonStyle.Link)
    .setURL("https://github.com/Yokaiiz");

  const mainEmbedSelectMenu = new StringSelectMenuBuilder()
    .setCustomId("main-select-menu")
    .setPlaceholder("Make a selection")
    .addOptions([
      new StringSelectMenuOptionBuilder()
        .setValue("discord-server")
        .setLabel("Discord Server 🗣️")
        .setDescription(
          "Updates the embed to show information regarding the discord server"
        ),
      new StringSelectMenuOptionBuilder()
        .setValue("crucified-bot")
        .setLabel("Crucified Bot 🤖")
        .setDescription(
          "Updates the embed to show information regarding the discord bot"
        ),
    ]);

  const mainselectmenu = new ActionRowBuilder().addComponents(
    mainEmbedSelectMenu
  );
  const mainButtonRow = new ActionRowBuilder().addComponents(
    DiscordServerButton,
    YouTubeButton,
    TikTokButton,
    TwitchButton,
    GitHubButton
  );

  const DiscordEmbed = new EmbedBuilder()
    .setColor("DarkBlue")
    .setTitle(`Hello ${interaction.user.username}!`)
    .setDescription(
      "Welcome to the **Crucified** bot! Here you can find information about the bot, the discord server, and more!"
    )
    .setThumbnail(`${avatar}`)
    .setFooter({
      text: "Thank you for using crucified || Developed by crucifiedxx",
    })
    .setTimestamp();

  await interaction.reply({
    embeds: [DiscordEmbed],
    components: [mainButtonRow, mainselectmenu],
    ephemeral: false,
  });

  const collector = interaction.channel.createMessageComponentCollector({
    ComponentType: ComponentType.StringSelect,
    time: 60000,
    filter: (i) => i.user.id === interaction.user.id,
  });

  collector.on("collect", async (i) => {
    if (i.customId !== "main-select-menu") return;

    if (i.values[0] === "discord-server") {
      const discordserverEmbed = new EmbedBuilder()
        .setColor("DarkBlue")
        .setTitle("`Sunken`")
        .setDescription("Welcome to `Sunken`!")
        .setImage(
          "https://cdn.discordapp.com/attachments/1396996504719462452/1399854208840241312/download_21.jpg?ex=688a8353&is=688931d3&hm=6bc0d72b833654b00f21fbba3389ebfecc301bacd2861e5d7a8aafe8deac9992&"
        )
        .setThumbnail(
          "https://cdn.discordapp.com/attachments/1396996504719462452/1399854208504565801/Ocean.jpg?ex=688a8353&is=688931d3&hm=12afa3340e0b369b0d6def7b529d9d95197b4a6d09a4ba3fff25063e48655c29&"
        )
        .addFields(
          {
            name: "Sunken",
            value:
              "A community welcoming of all with total acceptance and no judgement.",
          },
          {
            name: "What we offer",
            value:
              "We offer a variety of channels for discussion, gaming, and more. We also have a variety of bots to enhance your experience.",
          },
          {
            name: "Join us",
            value:
              "Join us today and become a part of our community! We are always looking for new members to join us in our journey.",
          },
          {
            name: "Rules",
            value:
              "**1. Treat everyone with respect. Absolutely no harassment, witch hunting, sexism, racism or hate speech will be tolerated.\n2. No spam or self-promotion (server invites, advertisements etc) without permission from a staff member. This includes DMing fellow members.\n3. No age-restricted or obscene content. This includes text, images or links featuring nudity, sex, hard violence or other disturbing graphic content.\n4. If you see something against the rules or something that makes you feel unsafe, let staff know. We want this server to be a welcoming space!**",
          },
          {
            name: "Hierarchy",
            value:
              "Owner: Crucified, Crucified-Bot\nCo-owner: Chichi\nSenior Moderator: N/A\nMod: N/A\nTrial Mod: N/A\nTwitch Mod: Chichi, Eto, dooD, Cairo",
          },
          {
            name: "Events",
            value:
              "We host regular events such as game nights, movie nights, and more! We have set the events to happen every friday and sunday so please check the server updates channel for more information regarding the events!",
          },
          {
            name: "Schedule",
            value:
              "I stream on twitch **every day** at **6:30 PM UK time**. You can also check out my YouTube channel and TikTok for more content!",
          }
        )
        .setFooter({
          text: "Thank you for using the crucified bot! || Developed by crucifiedxx",
        })
        .setTimestamp();

      await i.update({
        embeds: [discordserverEmbed],
        components: [mainButtonRow, mainselectmenu],
        ephemeral: true,
      });
    } else if (i.values[0] === "crucified-bot") {
      const botEmbed = new EmbedBuilder()
        .setColor("DarkBlue")
        .setTitle("`Crucified Bot`")
        .setDescription("Welcome to the `Crucified Bot`!")
        .setThumbnail(`${avatar}`)
        .addFields(
          {
            name: "What is Crucified Bot?",
            value:
              "Crucified Bot is a multipurpose bot that offers a variety of features such as economy, moderation, and more!",
          },
          {
            name: "Commands",
            value:
              "`/help` - Shows this message\n`/cat` - Sends a random cat image\n`/beg` - Begs for money\n`/profile` - Shows your profile and balance\n`/gamble <amount>` - Gamble your money away\n`/dig` - Dig for items\n`/crafting` - Craft items using raw materials\n`/Sell` - Sell different items at different quantities\n`/Donate` - Donate money to others that are in need (brokies)\n`/Reset` - Full wipe of the target's data and only the bot team members can utilise this.\n`/Give Money` - Allows the bot team members to give anyone money by adding an amount to their overall balance without requiring to be on the PC where the bot is ran.\n`/Give Item` - Allows the bot team members to different items at different quantities\n`/Work` - Let's you work for money",
          },
          {
            name: "Support",
            value:
              "If you need help with the bot, feel free to join our discord server and ask for help!",
          }
        )
        .setFooter({
          text: "Thank you for using the crucified bot! || Developed by crucifiedxx",
        })
        .setTimestamp();

      await i.update({
        embeds: [botEmbed],
        components: [mainButtonRow, mainselectmenu],
        ephemeral: true,
      });
    }
  });
}

async function handleDigCommand(interaction) {
  const userId = interaction.user.id;
  await database.ensureUser(userId);
  const userData = await database.getUserData(userId);

  // Use "Shovel" to match handleBegCommand
  const shovelKey = "Shovel";
  if (!userData.inventory[shovelKey] || userData.inventory[shovelKey] <= 0) {
    return interaction.reply({
      content: "You need a Shovel to dig, go beg for one brokie.",
      ephemeral: true,
    });
  }

  // Remove one shovel
  userData.inventory[shovelKey] -= 1;
  if (userData.inventory[shovelKey] === 0) {
    delete userData.inventory[shovelKey];
  }
  await database.saveUserData(userId, userData);

  const digItemPool = [
    { item: 'Raw gold', chance: 0.05 },
    { item: 'Raw diamond', chance: 0.05 },
    { item: 'Raw iron', chance: 0.30 },
    { item: 'Raw copper', chance: 0.20 },
    { item: 'nothing', chance: 0.40 }
  ];

  const random = Math.random();
  let cumulative = 0;
  let item = null;
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
      ephemeral: true
    });
  }
}

async function handleCraftCommand(interaction) {
  const userId = interaction.user.id;
  await database.ensureUser(userId);
  const userData = await database.getUserData(userId);
  const avatar = interaction.user.displayAvatarURL();

  const craftingEmbed = new EmbedBuilder()
    .setColor('Default')
    .setTitle('Crafting Menu')
    .setDescription('Select an item to craft from the dropdown menu below.')
    .setThumbnail(`${avatar}`)
    .setFooter({
      text: 'Thank you for using the crucified bot! || Developed by crucifiedxx',
    })
    .setTimestamp();

  const craftingOptions = new StringSelectMenuBuilder()
    .setCustomId('crafting-select-menu')
    .setPlaceholder('Choose an item to craft')
    .addOptions([
      new StringSelectMenuOptionBuilder()
        .setValue('gold_bar')
        .setLabel('gold bar')
        .setDescription('Craft a gold bar using 5 raw gold and 1000 yen.'),
      new StringSelectMenuOptionBuilder()
        .setValue('iron_bar')
        .setLabel('iron bar')
        .setDescription('Craft an iron bar using 5 raw iron and 500 yen.'),
      new StringSelectMenuOptionBuilder()
        .setValue('copper_bar')
        .setLabel('copper bar')
        .setDescription('Craft a copper bar using 5 raw copper and 250 yen.')
    ]);

  const craftingselectmenu = new ActionRowBuilder().addComponents(
    craftingOptions,
  );

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

  craftingCollector.on('collect', async (i) => {
    let itemName = '';
    let requiredItem = '';
    let requiredAmount = 0;
    let requiredMoney = 0;
    const expGain = Math.floor(Math.random() * 100) + 50

    if (i.values[0] === 'gold_bar') {
      itemName = 'Gold bar';
      requiredItem = 'Raw gold';
      requiredAmount = 5;
      requiredMoney = 1000;
    } else if (i.values[0] === 'iron_bar') {
      itemName = 'Iron bar';
      requiredItem = 'Raw iron';
      requiredAmount = 5;
      requiredMoney = 500;
    } else if (i.values[0] === 'copper_bar') {
      itemName = 'Copper bar';
      requiredItem = 'Raw copper';
      requiredAmount = 5;
      requiredMoney = 250;
    } else {
      return i.reply({ content: 'Invalid crafting option.', ephemeral: true });
    }

    if ((userData.inventory[requiredItem] || 0) < requiredAmount || userData.balance < requiredMoney) {
      return i.reply({
        content: `You do not have enough resources to craft a ${itemName}.`,
        ephemeral: true
      });
    }

    // Deduct resources and add crafted item
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
      ephemeral: true
    });
  });
}

async function handleSellCommand(interaction) {
  const userId = interaction.user.id;
  await database.ensureUser(userId);
  const userData = await database.getUserData(userId);
  const ItemToSell = interaction.options.getString('item');
  const ItemQuantity = interaction.options.getInteger('amount')

  const itemPrice = [
    { name: 'Raw gold', price: 500 },
    { name: 'Raw diamond', price: 1000 },
    { name: 'Raw iron', price: 100 },
    { name: 'Raw copper', price: 50 },
    { name: 'Gold bar', price: 5000 },
    { name: 'Iron bar', price: 1000 },
    { name: 'Copper bar', price: 500 },
    { name: 'Sword', price: 5000 },
    { name: 'Shield', price: 3000 },
    { name: 'Pickaxe', price: 500 },
    { name: 'Shovel', price: 500 },
  ];

  const priceObj = itemPrice.find(item => item.name === ItemToSell);
  if (!priceObj) {
    return interaction.reply({
      content: `**${ItemToSell}** cannot be sold.`,
      ephemeral: true,
    });
  }

  const TotalItemPrice = priceObj.price * ItemQuantity;

  if (!userData.inventory[ItemToSell] || userData.inventory[ItemToSell] <= 0) {
    return interaction.reply({
      content: `You do not have any of **${ItemToSell}** to sell.`,
      ephemeral: true,
    });
  }

  userData.inventory[ItemToSell] -= ItemQuantity;
  if (userData.inventory[ItemToSell] === 0) {
    delete userData.inventory[ItemToSell];
  }

  userData.balance += TotalItemPrice
  await database.saveUserData(userId, userData);

  await interaction.reply({
    content: `You sold  **${ItemQuantity.toLocaleString("en-US")}** of **${ItemToSell}** for **¥${TotalItemPrice.toLocaleString("en-US")}**!`,
    ephemeral: true,
  });
}

async function handleDonateCommand(interaction) {
  const userId = interaction.user.id;
  await database.ensureUser(userId);
  const userData = await database.getUserData(userId);
  const amount = interaction.options.getInteger('amount');
  const targetUserId = interaction.options.getUser('user').id;

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
  await interaction.client.users.send(targetUserId, {
    content: `You received a donation of **¥${amount.toLocaleString("en-US")}** from <@${userId}>!`,
  });
}

async function handleResetCommand(interaction) {
  try {
    const targetUserId = interaction.options.getUser('user').id;
    // Ensure application owner is fetched
    if (!interaction.client.application.owner) {
      await interaction.client.application.fetch();
    }
    const owner = interaction.client.application.owner;
    let isOwner = false;
    if (owner.members) {
      // Team ownership: check if user is in the team
      isOwner = Array.from(owner.members.values()).some(member => member.id === interaction.user.id);
    } else {
      // Single user owner
      isOwner = owner.id === interaction.user.id;
    }
    if (!isOwner) {
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
  const userId = interaction.options.getUser('user').id;
  const amount = interaction.options.getInteger('amount');
  await database.ensureUser(userId);
  const userData = await database.getUserData(userId);

  if (!interaction.client.application.owner) {
    await interaction.client.application.fetch();
  }
  const owner = interaction.client.application.owner;
  let isOwner = false;
  if (owner.members) {
    // Team ownership: check if user is in the team
    isOwner = Array.from(owner.members.values()).some(member => member.id === interaction.user.id);
  } else {
    // Single user owner
    isOwner = owner.id === interaction.user.id;
  }
  if (!isOwner) {
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
  const userId = interaction.options.getUser('user').id;
  const item = interaction.options.getString('item');
  const quantity = interaction.options.getInteger('amount');
  await database.ensureUser(userId);
  const userData = await database.getUserData(userId);
  if (!interaction.client.application.owner) {
    await interaction.client.application.fetch();
  }
  const owner = interaction.client.application.owner;
  let isOwner = false;
  if (owner.members) {
    // Team ownership: check if user is in the team
    isOwner = Array.from(owner.members.values()).some(member => member.id === interaction.user.id);
  } else {
    // Single user owner
    isOwner = owner.id === interaction.user.id;
  }
  if (!isOwner) {
    return interaction.reply({
      content: "You do not have permission to use this command.",
      ephemeral: true,
    });
  }

  if (!userData.inventory[item]) {
    userData.inventory[item] = 0;
  }
  userData.inventory[item] += quantity;
  await database.saveUserData(userId, userData);
  await interaction.reply({
    content: `You gave **${quantity}** of **${item}** to <@${userId}>!`,
    ephemeral: true,
  });
}

async function handleWorkCommand(interaction) {
  const userId = interaction.user.id;
  await database.ensureUser(userId);
  const userData = await database.getUserData(userId); // <-- await added!
  const avatar = interaction.user.displayAvatarURL();

  const workEmbed = new EmbedBuilder()
    .setColor('Default')
    .setTitle(`Hello, ${interaction.user.username}`)
    .setDescription('Here are your work options!')
    .setThumbnail(`${avatar}`)
    .addFields(
      {
        name: 'Exotic dancer',
        value: '`Experience required: 0`\n`Wage: ¥750`\n`Experience gain: 100`'
      },
      {
        name: 'Janitor',
        value: '`Experience required: 150`\n`Wage: ¥1,000`\n`Experience gain: 250`'
      },
      {
        name: 'Waitress',
        value: '`Experience required: 500`\n`Wage: ¥2,000`\n`Experience gain: 500`'
      },
      {
        name: 'Cashier',
        value: '`Experience required: 1,000`\n`Wage: ¥3,000`\n`Experience gain: 750`'
      },
      {
        name: 'Teacher',
        value: '`Experience required: 2,000`\n`Wage: ¥10,000`\n`Experience gain: 1,000`'
      },
      {
        name: 'Care-taker',
        value: '`Experience required: 5,000`\n`Wage: ¥50,000`\n`Experience gain: 1,250`'
      },
      {
        name: 'Police officer',
        value: '`Experience required: 10,000`\n`Wage: ¥100,000`\n`Experience gain: 1,500`'
      },
      {
        name: 'Bank Employee',
        value: '`Experience required: 50,000`\n`Wage: ¥500,000`\n`Experience gain: 1,750`'
      },
      {
        name: 'Engineer',
        value: '`Experience required: 100,000`\n`Wage: ¥1,000,000`\n`Experience gain: 2,000`'
      }
    )
    .setFooter({
      text: 'Thank you for using the crucified bot! || Developed by crucifiedxx'
    })
    .setTimestamp();

  const selectWorkMenu = new StringSelectMenuBuilder()
    .setCustomId('select-work-menu')
    .setPlaceholder('Choice of work')
    .addOptions([
      new StringSelectMenuOptionBuilder()
        .setLabel('Exotic dancer 👯‍♀️')
        .setValue('exotic_dancer')
        .setDescription('You work as an exotic dancer in your local gentlemens club'),
      new StringSelectMenuOptionBuilder()
        .setLabel('Janitor 🧹')
        .setValue('janitor')
        .setDescription('You work as a janitor in your local school.'),
      new StringSelectMenuOptionBuilder()
        .setLabel('Waitress 🥐🍵')
        .setValue('waitress')
        .setDescription('You work as a waitress in your local café.'),
      new StringSelectMenuOptionBuilder()
        .setLabel('Cashier 💵')
        .setValue('cashier')
        .setDescription('You work as a cashier at your local supermarket.'),
      new StringSelectMenuOptionBuilder()
        .setLabel('Teacher 🏫')
        .setValue('teacher')
        .setDescription('You work as a teacher in your local high-school.'),
      new StringSelectMenuOptionBuilder()
        .setLabel('Care-taker 👩‍⚕️')
        .setValue('care_taker')
        .setDescription('You work as a care-taker for a person in need.'),
      new StringSelectMenuOptionBuilder()
        .setLabel('Police Officer 👮🚨')
        .setValue('police_officer')
        .setDescription('You work as a police officer for your local county'),
      new StringSelectMenuOptionBuilder()
        .setLabel('Bank Employee 🏦💴')
        .setValue('bank_employee')
        .setDescription('You work as a bank employee in your local bank'),
      new StringSelectMenuOptionBuilder()
        .setLabel('Engineer 🛠️')
        .setValue('engineer')
        .setDescription('You work as an engineer at your local engineering company'),
    ]);

  const selectWorkMenuRow = new ActionRowBuilder().addComponents(selectWorkMenu);

  await interaction.reply({
    embeds: [workEmbed],
    components: [selectWorkMenuRow]
  });

  const workSelectionCollector = interaction.channel.createMessageComponentCollector({
    ComponentType: ComponentType.StringSelect,
    time: 60000,
    filter: (i) => i.user.id === interaction.user.id,
  });

  workSelectionCollector.on('collect', async (i) => {
    if (i.customId !== 'select-work-menu') return;

    if (i.values[0] === 'exotic_dancer') {
      userData.balance += 750;
      userData.experience += 100;
      await database.saveUserData(userId, userData);

      await i.update({
        content: `You received **¥750** and **100** EXP, your new balance is **¥${userData.balance.toLocaleString("en-US")}** and your new EXP is **${userData.experience.toLocaleString("en-US")}**`,
        ephemeral: true,
      });
    }

    if (i.values[0] === 'janitor') {
      if (userData.experience < 150) {
        return i.update({
          content: 'You do not have enough experience required.',
          ephemeral: true,
        });
      } else {
        userData.balance += 1000;
        userData.experience += 250;
        await database.saveUserData(userId, userData);
        await i.update({
          content: `You earned **¥1,000** alongside **250** EXP, now your balance is: **¥${userData.balance.toLocaleString("en-US")}** and your EXP is **${userData.experience.toLocaleString("en-US")}**`,
          ephemeral: true,
        });
      }
    }

    if (i.values[0] === 'waitress') {
      if (userData.experience < 500) {
        return i.update({
          content: 'You do not have enough **experience** to work as a waitress.',
          ephemeral: true,
        });
      } else {
        userData.balance += 2000;
        userData.experience += 500;
        await database.saveUserData(userId, userData);
        await i.update({
          content: `You earned **¥2,000** alongside **500** EXP, now your balance is **¥${userData.balance.toLocaleString("en-US")}** and your EXP is **${userData.experience.toLocaleString("en-US")}**`,
          ephemeral: true,
        });
      }
    }

    if (i.values[0] === 'cashier') {
      if (userData.experience < 1000) {
        return i.update({
          content: 'You do not have enough **experience** to work as a cashier.',
          ephemeral: true,
        });
      } else {
        userData.balance += 3000;
        userData.experience += 750;
        await database.saveUserData(userId, userData);
        await i.update({
          content: `You earned **¥3,000** alongside **750** EXP, now your balance is **¥${userData.balance.toLocaleString("en-US")}** and your EXP is **${userData.experience.toLocaleString("en-US")}**`,
          ephemeral: true,
        });
      }
    }

    if (i.values[0] === 'teacher') {
      if (userData.experience < 2000) {
        return i.update({
          content: 'You do not have enough **experience** to work as a teacher',
          ephemeral: true
        });
      } else if (userData.experience > 2000) {
        userData.balance += 10000;
        userData.experience += 1000;
        await database.saveUserData(userId, userData);
        await i.update({
          content: `You earned **¥10,000** alongside **1,000** EXP, now your balance is **¥${userData.balance.toLocaleString("en-US")}** and your EXP is **${userData.experience.toLocaleString("en-US")}**`,
          ephemeral: true
        });
      }
    }

    if (i.values[0] === 'care_taker') {
      if (userData.experience < 5000) {
        return i.update({
          content: 'You do not have enough **experience** to work as a care taker',
          ephemeral: true
        });
      } else if (userData.experience >= 5000) {
        userData.balance += 50000;
        userData.experience += 1250;
        await database.saveUserData(userId, userData);

        await i.update({
          content: `You earned **¥50,000** alongside **1250** EXP, now your balance is **¥${userData.balance.toLocaleString("en-US")}** and your EXP is **${userData.experience.toLocaleString("en-US")}**`,
          ephemeral: true,
        });
      }
    }

    if (i.values[0] === 'police_officer') {
      if (userData.experience < 10000) {
        return i.update({
          content: 'You do not have enough **experience** to work as a police officer',
          ephemeral: true
        });
      } else if (userData.experience >= 10000) {
        userData.balance += 100000;
        userData.experience += 1500;
        await database.saveUserData(userId, userData);

        await i.update({
          content: `You earned **¥100,000** alongside **1500** EXP, now your balance is **¥${userData.balance.toLocaleString("en-US")}** and your EXP is **${userData.experience.toLocaleString("en-US")}**`,
          ephemeral: true
        });
      }
    }

    if (i.values[0] === 'bank_employee') {
      if (userData.experience < 50000) {
        return i.update({
          content: 'You do not have enough **experience** to work as a bank employee',
          ephemeral: true
        });
      } else if (userData.experience >= 50000) {
        userData.balance += 500000;
        userData.experience += 1750;
        await database.saveUserData(userId, userData);

        await i.update({
          content: `You earned **¥500,000** alongside **1750** EXP, now your balance is **¥${userData.balance.toLocaleString("en-US")}** and your EXP is **${userData.experience.toLocaleString("en-US")}**`,
          ephemeral: true
        });
      }
    }

    if (i.values[0] === 'engineer') {
      if (userData.experience < 100000) {
        return i.update({
          content: 'You do not have **experience** to work as an engineer',
          ephemeral: true
        });
      } else if (userData.experience >= 100000) {
        userData.balance += 1000000;
        userData.experience += 2000;
        await database.saveUserData(userId, userData);

        await i.update({
          content: `You earned **¥1,000,000** alongise **2,000** EXP, now your balance is **¥${userData.balance.toLocaleString("en-US")}** and your EXP is **${userData.experience.toLocaleString("en-US")}**`,
          ephemeral: true
        });
      }
    }
  });
}

async function handleGiveEXPCommand(interaction) {
  const userId = interaction.options.getUser('user').id;
  await database.ensureUser(userId);
  const userData = await database.getUserData(userId);
  const amount = interaction.options.getInteger('amount');

  if (!interaction.client.application.owner) {
    await interaction.client.application.fetch();
  }
  const owner = interaction.client.application.owner;
  let isOwner = false;
  if (owner.members) {
    // Team ownership: check if user is in the team
    isOwner = Array.from(owner.members.values()).some(member => member.id === interaction.user.id);
  } else {
    // Single user owner
    isOwner = owner.id === interaction.user.id;
  }
  if (!isOwner) {
    return interaction.reply({
      content: "You do not have permission to use this command.",
      ephemeral: true,
    });
  }

  userData.experience += amount
  await database.saveUserData(userId, userData);

  await interaction.reply({
    content: `You have given <@${userId}> **${amount.toLocaleString("en-US")}** EXP, their total EXP is now **${userData.experience.toLocaleString("en-US")}**`,
    ephemeral: true
  });

}

async function handleTakeMoneyCommand(interaction) {
  const userId = interaction.options.getUser('target').id;
  await database.ensureUser(userId);
  const userData = await database.getUserData(userId);
  const takeAmount = interaction.options.getInteger('amount');

  if (!interaction.client.application.owner) {
    await interaction.client.application.fetch();
  }
  const owner = interaction.client.application.owner;
  let isOwner = false;
  if (owner.members) {
    // Team ownership: check if user is in the team
    isOwner = Array.from(owner.members.values()).some(member => member.id === interaction.user.id);
  } else {
    // Single user owner
    isOwner = owner.id === interaction.user.id;
  }
  if (!isOwner) {
    return interaction.reply({
      content: "You do not have permission to use this command.",
      ephemeral: true,
    });
  }

  userData.balance -= takeAmount;
  await database.saveUserData(userId, userData);

  await interaction.reply({
    content: `You took away **¥${takeAmount.toLocaleString("en-US")}** from <@${userId}>, their new balance is **¥${userData.balance.toLocaleString("en-US")}**`,
    ephemeral: true
  });
}

async function handleTakeEXPCommand(interaction) {
  const targetID = interaction.options.getUser('target').id;
  await database.ensureUser(targetID);
  const userData = await database.getUserData(targetID);
  const TakeAwayAmount = interaction.options.getInteger('amount');

  if (!interaction.client.application.owner) {
    await interaction.client.application.fetch();
  }
  const owner = interaction.client.application.owner;
  let isOwner = false;
  if (owner.members) {
    // Team ownership: check if user is in the team
    isOwner = Array.from(owner.members.values()).some(member => member.id === interaction.user.id);
  } else {
    // Single user owner
    isOwner = owner.id === interaction.user.id;
  }
  if (!isOwner) {
    return interaction.reply({
      content: "You do not have permission to use this command.",
      ephemeral: true,
    });
  }

  userData.experience -= TakeAwayAmount;
  await database.saveUserData(targetID, userData);

  await interaction.reply({
    content: `You have taken away **${TakeAwayAmount}** from <@${targetID}>, their new experience count is **${userData.experience}**`,
    ephemeral: true
  });

}

// Add more functions here

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
  // Add more functions to export here
};
