const {
  ButtonBuilder,
  ActionRowBuilder,
  subtext,
  italic,
} = require("@discordjs/builders");
const {
  EmbedBuilder,
  ButtonStyle,
  PermissionFlagsBits,
  ComponentType,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  UserContextMenuCommandInteraction,
} = require("discord.js");
const database = require("./database.js");
const { StringSelectMenuBuilder, StringSelectMenuOptionBuilder } = require("@discordjs/builders");
const { job, } = require("./utils/utils.js");



const powerMovesets = {
  'Sode no Shirayuki': [
    { name: 'Frost Slash', damage: 100, description: 'A chilling slash that may potentially freeze the boss.' },
    { name: 'Below Freezing', damage: 0, description: 'Raises your overall defense by 20 for this fight.', defenseBoost: 20 },
    { name: 'Freezing Aurora', damage: 200, description: 'You freeze everything that surrounds you.' },
    { name: 'Bankai: Sode no Shirayuki - Hakka no Togame', damage: 0, description: 'You activate Bankai.', bankaiActivate: true },
    { name: 'Ultimate Freeze', damage: 500, description: 'You unleash the ultimate freezing attack at the boss.', ultimate: true },
    { name: 'Inescapable Blizzard', damage: 1000, description: 'You freeze everything around you forever, doing 1,000 damage.', ultimate: true }
  ],
  'Benihime': [
    { name: 'Fierce Slash', damage: 50, description: 'You launch a slash at the boss at fierce speeds.' },
    { name: 'Immaculate Shield', damage: 0, description: 'You apply a shield onto yourself, increasing your defense by 15.', defenseBoost: 15 },
    { name: 'Unstoppable Barrage', damage: 150, description: 'You create an unstoppable barrage of slashes.' },
    { name: 'Bankai: Kannonbiraki Benihime Aratame', damage: 0, description: 'You awaken your Bankai.', bankaiActivate: true },
    { name: 'Crimson Destruction', damage: 500, description: 'You unleash the ultimate attack, Crimson Destruction.', ultimate: true },
    { name: 'Reconstruction', damage: 1000, description: 'You bring yourself back from the dead to unleash the ultimate skill upon your opponent.', ultimate: true },
  ],
  'Zangetsu': [
    { name: 'Getsuga Tenshou', damage: 120, description: 'You launch a powerful slash of energy at the boss.' },
    { name: 'Getsuga Jujinshou', damage: 200, description: 'You launch 2 powerful slashes of energy in a cross formation.' },
    { name: 'Getsuga Barrage', damage: 250, description: 'You build up energy around your blade and slash the boss repeatedly.' },
    { name: 'Bankai: Tensa Zangetsu', damage: 0, description: 'You awaken your Bankai.', bankaiActivate: true },
    { name: 'Mugetsu', damage: 500, description: 'You unleash the ultimate attack, Mugetsu, sacrificing your power in the process.', ultimate: true, sacrifice: true },
    { name: 'Blut Vene', damage: 0, description: 'You use Blut Vene to boost your defense.', defenseBoost: 50 }
  ],
  'Ryujin Jakka': [
    { name: 'Incinerating Slash', damage: 200, description: 'You incinerate your opponent with a slash almost as hot as the sun.' },
    { name: 'Devastating Bisection', damage: 150, description: 'You smite your opponent with your fiery sword dealing 150 damage.' },
    { name: 'Fiery Hell', damage: 50, description: 'You heat up your surroundings to dangerous levels, boosting your defense.', defenseBoost: 50 },
    { name: 'Bankai: Zanka no Tachi', damage: 100, description: 'You unleash your Bankai onto your opponent.', bankaiActivate: true },
    { name: 'Undead Army', damage: 500, description: 'You raise past opponents from the dead as fiery skeletons and make them fight for you.', ultimate: true }
  ],
  'Kyoka Suigetsu': [
    { name: 'Perfect Hypnosis', damage: 350, description: 'You manipulate the opponent’s optical nerves to blind them and backstab.' },
    { name: 'Danku', damage: 50, description: 'You gather reishi to create a fortified wall, boosting defense.', defenseBoost: 100 },
    { name: 'Hypnotic Counter', damage: 200, description: 'You hypnotize the opponent to counter their attack!', counterAttack: true },
    { name: 'Hogyoku Ball', damage: 50, description: 'You utilize a Hogyoku Ball to evolve in this fight, boosting defense.', bankaiActivate: true, defenseBoost: 100 },
    { name: 'Hado 90: Kurohitsugi', damage: 1000, description: 'You engulf the opponent in a black coffin filled with blades.', ultimate: true }
  ],
  'Zabimaru': [
    { name: 'Bleeding Slash', damage: 150, description: 'You slash your opponent, making them bleed for 150 damage.' },
    { name: 'Hungry Mamba', damage: 300, description: 'You unleash a large snake-like creature that attacks ferociously.' },
    { name: 'Bankai: Zabimaru', damage: 0, description: 'You unleash your Bankai.', bankaiActivate: true }
  ],
  'Shinso': [
    { name: 'Expanding Blade', damage: 500, description: 'You expand your blade to 15km, striking your opponent.' },
    { name: 'Elongated Barrage', damage: 350, description: 'You extend your blade repeatedly to barrage your opponent.' },
    { name: 'Bankai: Kamishini no Yari', damage: 0, description: 'You activate Bankai.', bankaiActivate: true },
    { name: 'Murderous Expansion', damage: 1000, description: 'You expand your blade to its maximum capacity and slash everything nearby.', ultimate: true }
  ],
  'Hyorinmaru': [
    { name: 'Freezing Frost', damage: 150, description: 'You emit a freezing aura, slightly boosting defense.', defenseBoost: 10 },
    { name: 'Freezing Tip', damage: 300, description: 'You stab your opponent with the frozen tip of your sword.' },
    { name: 'Icy Counter', damage: 500, description: 'You use ice as a shield and counter attack!', counterAttack: true },
    { name: 'Bankai: Daiguren Hyorinmaru', damage: 0, description: 'You activate your Bankai!', bankaiActivate: true },
    { name: 'Icy Cross', damage: 1000, description: 'You encase your enemy in an icy cross that freezes them to death.', ultimate: true }
  ],
  'Wabisuke': [
    { name: 'Gravity Multiplication', damage: 300, description: 'You multiply the enemy’s weight tenfold, crushing them.' },
    { name: 'Gravity Slash', damage: 500, description: 'You conjure a kido-enhanced slash, striking heavily.' },
    { name: 'Gravity Field', damage: 250, description: 'You increase the weight of everything nearby, boosting defense.', defenseBoost: 50 }
  ],
  'Senbonzakura': [
    { name: 'Bankai: Senbonzakura Kageyoshi', damage: 0, description: 'You unleash your Bankai!', bankaiActivate: true },
    { name: 'Flower Blades', damage: 500, description: 'You throw thousands of flower blades at your opponent.' },
    { name: 'Flower Colosseum', damage: 1500, description: 'You form a colosseum of blades that shreds the enemy.', defenseBoost: 50, ultimate: true },
    { name: 'Flower Shield', damage: 100, description: 'You form a shield out of blades, countering attacks.', counterAttack: true }
  ],
  'Katen Kyokotsu': [
    { name: 'Bankai: Katen Kyokotsu Shinju', damage: 2000, description: 'You unleash your Bankai and perform an instant kill ability.', bankaiActivate: true }
  ],
  'Minazuki': [
    { name: 'Bleeding Slash', damage: 350, description: 'You slash your opponent with blood, causing heavy bleeding.' },
    { name: 'Bleeding Willow', damage: 500, description: 'You whirl blood around you, critically striking enemies.' },
    { name: 'Bankai: Minazuki', damage: 0, description: 'You summon your Bankai, a giant creature of blood.', bankaiActivate: true }
  ],
  'Suzumebachi': [
    { name: 'Hornet Strike', damage: 200, description: 'You strike swiftly like a hornet.' },
    { name: 'Death Stinger', damage: 350, description: 'You deliver a venomous sting that weakens the enemy.' },
    { name: 'Bankai: Jakuhō Raikōben', damage: 1000, description: 'You activate Bankai, summoning a massive missile.', bankaiActivate: true },
  ],
  'Beast': [
    { name: 'Savage Bite', damage: 100, description: 'You bite into the opponent with wild ferocity.' },
    { name: 'Claw Frenzy', damage: 250, description: 'You unleash a barrage of claw strikes.' },
    { name: 'Beast King’s Roar', damage: 300, description: 'You roar with primal fury, dealing devastating damage.', ultimate: true }
  ],
  'Los Lobos': [
    { name: 'Twin Fang Shot', damage: 100, description: 'You fire twin spiritual blasts at the enemy.' },
    { name: 'Wolf Pack Barrage', damage: 200, description: 'You summon spirit wolves to attack relentlessly.' },
    { name: 'Cero: Corazon', damage: 150, description: 'You charge up your gun and release a large spiritual blast that does continuous damage.' },
    { name: 'Ressurecion: Los Lobos', damage: 1, description: 'You awaken your ressurecion, unleashing your true powers', bankaiActivate: true },
    { name: 'Cero: Metralleta', damage: 500, description: 'You shoot thousands of Ceros from your gun like a machine gun.', ultimate: true },
  ],
  'Arrogante': [
    { name: 'Rotting Slash', damage: 250, description: 'You slash with decaying energy that weakens the opponent.' },
    { name: 'Decay Field', damage: 100, description: 'You release a field of rot, lowering enemy strength.', defenseBoost: 50 },
    { name: 'Bankai: Rōtting Apocalypse', damage: 0, description: 'You unleash ultimate decay with Bankai.', bankaiActivate: true },
    { name: 'Rotting Grab', damage: 1000, description: 'You grab the opponent and rot them to death.', ultimate: true },
  ],
  'Shark': [
    { name: 'Shark Bite', damage: 300, description: 'You bite into your enemy with shark-like jaws.' },
    { name: 'Water Prison', damage: 400, description: 'You trap your enemy inside a water sphere, restricting them.' },
    { name: 'Tidal Wave', damage: 600, description: 'You summon a giant wave to crush your opponent.' },
  ],
  'Horse': [
    { name: 'Trample', damage: 200, description: 'You trample the enemy under hooves.' },
    { name: 'Gallop Slash', damage: 300, description: 'You charge forward and slash the opponent.' },
    { name: 'Lance Throw', damage: 500, description: 'You charge up your lance and throw it towards your opponent like a javelin.' },
    { name: 'Bankai: Spirit Stallion', damage: 0, description: 'You summon your Bankai steed, a massive spirit horse.', bankaiActivate: true }
  ],
  'Murcielago': [
    { name: 'Cero Oscuras', damage: 500, description: 'You fire a black cero at the opponent.' },
    { name: 'Lanza del Relámpago', damage: 850, description: 'You throw a powerful energy spear that explodes on impact.', ultimate: true },
    { name: 'Segunda Etapa', damage: 0, description: 'You transform into your second release form.', bankaiActivate: true }
  ],
  'Pantera': [
    { name: 'Claw Slash', damage: 100, description: 'You slash your opponent with panther-like claws.' },
    { name: 'Roaring Pounce', damage: 250, description: 'You pounce on your opponent with incredible force.' },
    { name: 'Pantera Rampage', damage: 450, description: 'You unleash your ultimate rampage attack.' }
  ],
  'Ichimonji': [
    { name: 'Erasing Cut', damage: 500, description: 'You perform a cut with your ink brush and do 500 damage to the opponent.' },
    { name: 'Ink Shield', damage: 0, description: 'You create a shield of ink that boosts your defense by 50.', defenseBoost: 50 },
    { name: 'Bankai: Shirafude Ichimonji', damage: 0, description: 'You awaken your bankai.', bankaiActivate: true },
    { name: 'Futen Taisatsuryo', damage: 5000, description: 'You unleash the ultimate ink attack that is capable of existence erasure.', ultimate: true},
    { name: 'Ink Castle', damage: 0, description: 'You manifest a castle of ink that boosts your defense by 100.', defenseBoost: 100, ultimate: true },
  ],
  'Nozarashi': [
    { name: 'Sword Smash', damage: 600, description: 'You smash your opponent with your giant axe.' },
    { name: 'Earth Shatter', damage: 800, description: 'You slam your sword into the ground, causing an earth-shattering shockwave.' },
    { name: 'Bankai: RAGHHHHHH', damage: 0, description: 'You awaken your bankai.', bankaiActivate: true },
  ]
};


const bossPool = [
  {
    name:  'Sosuke Aizen',
    health: 2000,
    defense: 0,
    abilities: [
      { name: 'Perfect Hypnosis', effect: 'dodge', chance: 0.02 },
      { name: 'Danku', effect: 'block', chance: 0.08 },
      { name: 'Slash', damage: 250, chance: 0.2 },
      { name: 'Kido: Hado 90: Kurohitsugi', damage: 300, chance: 0.1 },
    ]
  },
  {
    name: 'Grimmjow',
    health: 1000,
    defense: 0,
    abilities: [
      { name: 'Claw Slash', damage: 200, chance: 0.50 },
      { name: 'Roar', damage: 30, chance: 0.1 },
    ]
  },
  {
    name: 'Yhwach',
    health: 1500,
    defense: 0,
    abilities: [
      { name: 'Almighty', damage: 150, effect: 'dodge', chance: 0.1 },
      { name: 'Slash', damage: 125, chance: 0.1 },
      { name: "Absolute Eradication", damage: 300, chance: 0.01 },
    ]
  },
]

// --- Command Handlers ---

async function handleBegCommand(interaction) {
  const userId = interaction.user.id;
  await database.ensureUser(userId);
  const userData = await database.getUserData(userId);

  const amount = Math.floor(Math.random() * 5000) + 500;
  const experiencegain = Math.floor(Math.random() * 1000) + 100;
  const itempool = [
    { item: "Fishing Rod", chance: 0.4 },
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

  try {
    userData.balance += amount;
    userData.experience += experiencegain;
    userData.inventory[item] = (userData.inventory[item] || 0) + 1;
    await database.saveUserData(userId, userData);
  } catch (error) {
    console.log("Error updating user data on beg command:", error);
    return interaction.reply({
      content: "There was an error processing your beg command. Please try again later.",
      ephemeral: true,
    });
  }

  const embed = new EmbedBuilder()
    .setColor("Green")
    .setTitle("You begged!")
    .setDescription(
      `You begged and received **¥${amount.toLocaleString("en-US")}** along with **${item}** and **${experiencegain.toLocaleString("en-US")} experience**!`
    )
    .setThumbnail(interaction.user.displayAvatarURL())
    .setTimestamp();

  await interaction.reply({ embeds: [embed], ephemeral: false });
}

async function handleProfileCommand(interaction) {
  const userId = interaction.user.id;
  const targetUserObj = interaction.options.getUser("user");
  let profileEmbed;

  // Helper function to format violations safely
  function formatViolations(violations) {
    if (!Array.isArray(violations) || violations.length === 0) return "None";

    return violations
      .slice(-5) // last 5
      .map(v => {
        const reason = v.reason || "No reason provided";
        const date = v.date ? new Date(v.date).toLocaleString() : "Unknown Date";
        return `${reason} (${date})`;
      })
      .join("\n");
  }

  // Helper function for inventory
  function formatInventory(inv) {
    if (!inv || Object.keys(inv).length === 0) return "None";

    return Object.entries(inv)
      .map(([item, qty]) => `${item} x${qty}`)
      .join("\n");
  }

  // PROFILE OF ANOTHER USER
  if (targetUserObj) {
    const targetUserId = targetUserObj.id;
    await database.ensureUser(targetUserId);
    const targetUserData = await database.getUserData(targetUserId);

    const violationsText = formatViolations(targetUserData.violations);
    const inventoryText = formatInventory(targetUserData.inventory);

    profileEmbed = new EmbedBuilder()
      .setColor("Default")
      .setTitle(`${targetUserObj.displayName}'s inventory, balance and experience`)
      .setThumbnail(targetUserObj.displayAvatarURL())
      .addFields(
        { name: "**Balance**", value: `**¥${targetUserData.balance.toLocaleString("en-US")}**` },
        { name: "**Experience**", value: `**${targetUserData.experience.toLocaleString("en-US")}**` },
        { name: "**Inventory**", value: `**${inventoryText}**` },
        { name: "**Shikai**", value: `**${targetUserData.power}**` },
        { name: "**Race**", value: `**${targetUserData.race}**` },
        { name: "**Violations**", value: `**${violationsText}**` },
      )
      .setTimestamp();

  // PROFILE OF SELF
  } else {
    await database.ensureUser(userId);
    const userData = await database.getUserData(userId);

    const violationsText = formatViolations(userData.violations);
    const inventoryText = formatInventory(userData.inventory);

    profileEmbed = new EmbedBuilder()
      .setColor("Default")
      .setTitle(`${interaction.user.displayName}'s inventory, balance and experience!`)
      .setThumbnail(interaction.user.displayAvatarURL())
      .addFields(
        { name: "**Balance**", value: `**¥${userData.balance.toLocaleString("en-US")}**` },
        { name: "**Experience**", value: `**${userData.experience.toLocaleString("en-US")}**` },
        { name: "**Inventory**", value: `**${inventoryText}**` },
        { name: "**Shikai**", value: `**${userData.power}**` },
        { name: "**Race**", value: `**${userData.race}**` },
        { name: "**Violations**", value: `**${violationsText}**` },
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
  { name: "Jackpot", multiplier: 30, chance: 0.01 },   // 1% chance
  { name: "High Win", multiplier: 5, chance: 0.05 },   // 5% chance
  { name: "Mid Win", multiplier: 3, chance: 0.15 },    // 15% chance
  { name: "Low Win", multiplier: 1, chance: 0.39 },    // 39% chance
  { name: "Loss", multiplier: 0, chance: 0.40 },       // 40% chance
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
  const avatar = interaction.user.displayAvatarURL();

  const helpembed = new EmbedBuilder()
    .setColor('Random')
    .setTitle('Welcome to the Help Menu!')
    .setDescription(`Here are the available options, **${interaction.user.username}(${interaction.user.id})**`)
    .setThumbnail(avatar)
    .setAuthor({
      name: 'Eto',
      iconURL: 'https://cdn.discordapp.com/attachments/1418360206248775754/1421582156710412299/Patrick_Bateman_n_Hello_Kitty.jpg',
      url: 'https://www.github.com/Yokaiiz'
    })
    .addFields(
      { name: '`Support server` 🆘', value: 'Information about the support server!' },
      { name: '`Crucified Bot` 🤖', value: 'Information about the Crucified Bot such as commands!' },
      { name: '`Additional information` 📜', value: 'Additional information that is considered unnecessary by the bot owner (Eto)' }
    )
    .setFooter({ text: 'Thank you for using the Crucified Bot! || Catawampus' })
    .setTimestamp();

  const helpmenuselect = new StringSelectMenuBuilder()
    .setPlaceholder('Select an option!')
    .setCustomId('helpmenuselect')
    .addOptions([
      { label: 'Support server 🆘', description: 'Information about our support server!', value: 'support_server' },
      { label: 'Crucified Bot 🤖', description: 'Information about the discord bot!', value: 'crucified_bot' },
      { label: 'Additional information', description: 'Additional info such as adverts', value: 'additional' },
    ]);

  const additionalMenuSelect = new StringSelectMenuBuilder()
    .setPlaceholder('Choose an option!')
    .setCustomId('additionalmenuselect')
    .addOptions([
      { label: 'adverts', description: 'server advertisements!', value: 'adverts' },
    ]);

  const advertMenuSelect = new StringSelectMenuBuilder()
    .setPlaceholder('Choose a server!')
    .setCustomId('advertmenuselect')
    .addOptions([
      { label: 'Whimsyx', description: 'Information about Whimsyx!', value: 'whimsyx' },
    ]);

  const supportserverButton = new ButtonBuilder()
    .setStyle(ButtonStyle.Link)
    .setLabel(' Support server! 🆘 ')
    .setURL('https://discord.gg/zzATAzdDHH');

  const githubButton = new ButtonBuilder()
    .setStyle(ButtonStyle.Link)
    .setLabel(' Github 🤖 ')
    .setURL('https://github.com/Yokaiiz/Crucified-Discord-Bot');

  const mainmenuhelpselectrow = new ActionRowBuilder().addComponents(helpmenuselect);
  const additionalmenuselectrow = new ActionRowBuilder().addComponents(additionalMenuSelect);
  const advertmenuselectrow = new ActionRowBuilder().addComponents(advertMenuSelect);
  const supportButtons = new ActionRowBuilder().addComponents(supportserverButton, githubButton);

  // Send reply and fetch the message so we can attach a message-level collector
  let msg;
  try {
    msg = await interaction.reply({
      embeds: [helpembed],
      components: [mainmenuhelpselectrow],
      fetchReply: true,
      ephemeral: true,
    });
  } catch (err) {
    console.error('Failed to send help reply:', err);
    return interaction.reply({ content: 'There has been a problem with the command!', ephemeral: true }).catch(() => {});
  }

  // Collector attached to the sent message (safer than channel collector)
  const collector = msg.createMessageComponentCollector({
    componentType: ComponentType.StringSelect,
    time: 5 * 60 * 1000, // 5 minutes
    filter: (i) => i.user.id === interaction.user.id,
  });

  collector.on('collect', async (i) => {
    try {
      // protect against wrong customId usage
      if (!['helpmenuselect', 'additionalmenuselect', 'advertmenuselect'].includes(i.customId)) {
        return i.reply({ content: 'You did not use the correct select menu for this command.', ephemeral: true }).catch(() => {});
      }

      const value = i.values && i.values[0];
      switch (value) {
        case 'support_server': {
          const supportServerEmbed = new EmbedBuilder()
            .setColor('Random')
            .setTitle('Deflexcted')
            .setDescription('Welcome to our support server, Deflexcted!')
            .setThumbnail('https://cdn.discordapp.com/attachments/1418360206248775754/1421568582357090456/meme_twitter_viral_dexter.jpg')
            .setImage('https://i.pinimg.com/originals/6e/38/c4/6e38c452d1ac28ac6d8f21eb74eaeb4b.gif')
            .addFields(
              { name: '`Rules`', value: '1. Treat everyone with respect. No harassment, hate, spam, or NSFW content.\n2. No spam or self-promotion without permission.\n3. Keep content appropriate.\n4. Report rule breaking to staff.' },
              { name: '`Information about Deflexcted`', value: 'The server originally started as an idea...' },
              { name: '`How can I get support?`', value: 'Use the ticket system or DM the bot owner.' }
            )
            .setFooter({ text: 'Thank you for using the Crucified Bot || Catawampus ' })
            .setTimestamp();

          return i.update({ embeds: [supportServerEmbed], components: [mainmenuhelpselectrow, supportButtons], ephemeral: true });
        }

        case 'crucified_bot': {
          const crucifiedbotEmbed = new EmbedBuilder()
            .setColor('Random')
            .setTitle('Crucified Bot 🤖')
            .setDescription('random')
            .setThumbnail(avatar)
            .addFields(
              { name: 'Fun', value: '`Cat`, `Beg`, `Gamble`, `Dig`, `Craft`, `Fight`, `Fish`, `Use`' },
              { name: 'Economy', value: '`Profile`, `Sell`, `Donate`, `Rob`, `Shop`' },
              { name: 'Administrative', value: '`Help`, `Ban`, `Timeout (uses milliseconds)`' },
              { name: 'Roleplay', value: '`Hug`, `Slap`, `Cuddle`, `Kiss`' }
            )
            .setFooter({ text: 'Thank you for using the Crucified Bot! || Catawampus' })
            .setTimestamp();

          return i.update({ embeds: [crucifiedbotEmbed], components: [mainmenuhelpselectrow], ephemeral: true });
        }

        case 'additional': {
          const additionalEmbed = new EmbedBuilder()
            .setColor('Random')
            .setTitle(`Hello ${interaction.user.username}!`)
            .setDescription('Here are your options:')
            .setThumbnail(avatar)
            .addFields({ name: 'Adverts', value: '`Whimsyx`' })
            .setTimestamp();

          return i.update({ embeds: [additionalEmbed], components: [mainmenuhelpselectrow, additionalmenuselectrow], ephemeral: true });
        }

        case 'adverts': {
          const advertEmbed = new EmbedBuilder()
            .setColor('Random')
            .setTitle('Advertisements')
            .setDescription(`Hello ${interaction.user.username}, which advert would you like to view?`)
            .setThumbnail(avatar)
            .addFields({ name: 'Whimsyx', value: 'Information about Whimsyx' })
            .setFooter({ text: 'Thank you for using the Crucified Bot! || Catawampus' })
            .setTimestamp();

          return i.update({ embeds: [advertEmbed], components: [mainmenuhelpselectrow, additionalmenuselectrow, advertmenuselectrow], ephemeral: true });
        }

        case 'whimsyx': {
          const whimsyxEmbed = new EmbedBuilder()
            .setColor('Random')
            .setTitle('Whimsyx')
            .setDescription('Welcome to Whimsyx, a friendly community server!')
            .setThumbnail('https://cdn.discordapp.com/attachments/1405954272624902328/1407383473861296311/IMG_0895.jpg')
            .addFields(
              { name: '`Rules`', value: '1. Be respectful.\n2. No spam or self-promotion without permission.\n3. Keep content appropriate.\n4. Use channels correctly.' },
              { name: '`What is Whimsyx?`', value: 'A friendly community server with channels for various topics.' },
              { name: '`Join Whimsyx`', value: '[Click here to join Whimsyx!](https://discord.gg/ax5PFRKdMb)' }
            )
            .setFooter({ text: 'Thank you for using the Crucified Bot! || Catawampus' })
            .setTimestamp();

          return i.update({ embeds: [whimsyxEmbed], components: [mainmenuhelpselectrow, additionalmenuselectrow, advertmenuselectrow, supportButtons], ephemeral: true });
        }

        default:
          return i.reply({ content: 'Unknown selection.', ephemeral: true }).catch(() => {});
      }
    } catch (err) {
      console.error('Help collector error:', err);
      return i.reply({ content: 'There was an error handling your selection.', ephemeral: true }).catch(() => {});
    }
  });

  collector.on('end', async (collected) => {
    // Disable components on end
    try {
      const disabledRow = new ActionRowBuilder().addComponents(helpmenuselect.setDisabled(true));
      await interaction.editReply({ components: [disabledRow] }).catch(() => {});
    } catch (err) {
      // ignore edit failures
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

    try {
      userData.balance -= requiredMoney;
      userData.inventory[requiredItem] -= requiredAmount;
      userData.inventory[itemName] = (userData.inventory[itemName] || 0) + 1;
      userData.experience += expGain;

      if (userData.inventory[requiredItem] === 0) {
        delete userData.inventory[requiredItem];
      }

      await database.saveUserData(userId, userData);
    } catch (error) {
      console.log("Error updating user data on craft command:", error);
      return i.reply({
        content: "There was an error processing your craft command. Please try again later.",
        ephemeral: true,
      });

    }

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
    { name: 'Salmon', price: 5000 },
    { name: 'Tuna', price: 3000 },
    { name: 'Trout', price: 1000 },
    { name: 'Fishing Rod', price: 2000 },
    { name: 'Catfish', price: 5000 },
    { name: 'Bass', price: 3000 },
    { name: 'Carp', price: 1000 },
    { name: 'Goldfish', price: 10000 },
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
    try {
        const targetUser = interaction.options.getUser("user");
        const amount = interaction.options.getInteger("amount");

        if (!targetUser) {
            return interaction.reply({ content: "❌ Target user not found.", ephemeral: true });
        }

        if (amount <= 0) {
            return interaction.reply({ content: "❌ Amount must be greater than 0.", ephemeral: true });
        }

        // Ensure the target user exists
        const userData = await database.ensureUser(targetUser.id);

        // Add money
        userData.balance += amount;
        await database.saveUserData(targetUser.id, userData);

        return interaction.reply({
            content: `✅ Gave **¥${amount}** to ${targetUser.username}.`,
            ephemeral: true
        });
    } catch (err) {
        console.error("Error in handleGiveMoneyCommand:", err);
        if (!interaction.replied && !interaction.deferred) {
            return interaction.reply({ content: "❌ Something went wrong.", ephemeral: true }).catch(() => {});
        }
    }
}

async function handleGiveItemCommand(interaction) {
  const userId = interaction.options.getUser("user").id;
  const item = interaction.options.getString("item");
  const quantity = interaction.options.getInteger("amount");
  await database.ensureUser(userId);
  const userData = await database.getUserData(userId);

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

  // Build menu options safely
  const jobOptions = Object.entries(job).map(([key, value]) =>
    new StringSelectMenuOptionBuilder()
      .setLabel((value.name || key).toString().slice(0, 100) || "Job")
      .setValue(key)
      .setDescription((value.description || "No description").toString().slice(0, 100))
  );

  const workEmbed = new EmbedBuilder()
    .setColor('Random')
    .setTitle(`Hello, ${interaction.user.username}`)
    .setDescription("Here are your work options!")
    .setThumbnail(`${avatar}`)
    .addFields(
      Object.entries(job).map(([key, value]) => {
        return {
          name: value.name?.slice(0, 256) || key,
          value: [
            subtext((value.description || "N/A").toString().slice(0, 1024)),
            subtext(`Experience required: **${value.experience_required?.toLocaleString("en-US") ?? 0}**`),
            subtext(`Wage: **¥${value.wage?.toLocaleString("en-US") ?? 0}**`),
            subtext(`EXP Gain: **${value.experience_gain?.toLocaleString("en-US") ?? 0}**`),
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
          `Your experience: ${userData.experience} Needed: ${selectedJob?.experience_required ?? 0}`
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

  if (userData.race.toLowerCase() === "human") {
    return interaction.reply({
      content: `You are a ${userData.race}. You cannot utilise this command.`,
      ephemeral: true,
    });
  }

  // ✅ Shop items (keys now match select menu + modal submit values)
  const shop = {
    zanpakuto: { name: "Zanpakuto", price: 5000 },
    zanpakuto_reroll: { name: "Zanpakuto Reroll", price: 10000 },
  };

  // Select menu
  const weaponBuySelectMenu = new StringSelectMenuBuilder()
    .setPlaceholder("Select a weapon to buy")
    .setCustomId("weapon_shop")
    .addOptions([
      new StringSelectMenuOptionBuilder()
        .setLabel("Zanpakuto")
        .setValue("zanpakuto") // matches shop key
        .setDescription("Lets you buy a Zanpakuto || Cost: 5,000"),
      new StringSelectMenuOptionBuilder()
        .setLabel("Zanpakuto Reroll")
        .setValue("zanpakuto_reroll") // matches shop key
        .setDescription("Lets you buy a Zanpakuto Reroll || Cost: 10,000"),
    ]);

  const weaponBuyRow = new ActionRowBuilder().addComponents(weaponBuySelectMenu);

  // Shop embed
  const mainShopWeaponEmbed = new EmbedBuilder()
    .setColor("Grey")
    .setTitle("Weapon Shop")
    .setDescription("Welcome to the weapon shop! What would you like to buy?")
    .setImage("https://i.pinimg.com/1200x/d5/99/2c/d5992c7c032d63578138dd76abf3a72c.jpg")
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

    const choice = i.values[0]; // "zanpakuto" or "zanpakuto_reroll"
    const selectedItem = shop[choice];

    if (!selectedItem) {
      return i.reply({
        content: "❌ That item is not available!",
        ephemeral: true,
      });
    }

    // Show modal to ask for quantity
    const modal = new ModalBuilder()
      .setCustomId(`buy_${choice}_${userId}`) // e.g. buy_zanpakuto_reroll_123456
      .setTitle(`Buy ${selectedItem.name}`);

    const quantityInput = new TextInputBuilder()
      .setCustomId("quantity")
      .setLabel(`How many ${selectedItem.name}s do you want to buy?`.slice(0, 45))
      .setStyle(TextInputStyle.Short)
      .setPlaceholder("Enter a number (e.g. 2)")
      .setRequired(true);

    const modalRow = new ActionRowBuilder().addComponents(quantityInput);
    modal.addComponents(modalRow);

    await i.showModal(modal);
  });

  collector.on("end", async (collected) => {
    if (collected.size === 0) {
      await interaction.editReply({
        content: "🛑 Shop closed due to inactivity.",
        components: [],
      }).catch(() => {});
    } else {
      await interaction.editReply({ components: [] }).catch(() => {});
    }
  });
}




async function handleUseItemCommand(interaction) {
  const userId = interaction.user.id;

  try {
    // Ensure user exists
    await database.ensureUser(userId);
    const userData = await database.getUserData(userId);

    const item = interaction.options.getString("item");

    const ZANPAKUTO = "Zanpakuto";
    const REROLL = "Zanpakuto Reroll";

    // Power pools by race
    const powerPools = {
      "Soul Reaper": [
        { name: 'Sode no Shirayuki', chance: 0.01 },
        { name: 'Benihime', chance: 0.01 },
        { name: 'Zangetsu', chance: 0.01 },
        { name: 'Ryujin Jakka', chance: 0.01 },
        { name: 'Kyoka Suigetsu', chance: 0.01 },
        { name: 'Zabimaru', chance: 0.05 },
        { name: 'Shinso', chance: 0.05 },
        { name: 'Hyorinmaru', chance: 0.05 },
        { name: 'Wabisuke', chance: 0.5 },
        { name: 'Senbonzakura', chance: 0.1 },
        { name: 'Katen Kyokotsu', chance: 0.1 },
        { name: 'Minazuki', chance: 0.1 },
        { name: 'Suzumebachi', chance: 0.05 },
        { name: 'Ichimonji', chance: 0.001 },
        { name: 'Nozarashi', chance: 0.001 },
      ],
      "Arrancar": [
        { name: 'Beast', chance: 0.5 },
        { name: 'Los Lobos', chance: 0.05 },
        { name: 'Arrogante', chance: 0.05 },
        { name: 'Shark', chance: 0.2 },
        { name: 'Horse', chance: 0.1 },
        { name: 'Murcielago', chance: 0.05 },
        { name: 'Pantera', chance: 0.05 },
      ],
      "Quincy": [
        { name: 'Antithesis', chance: 0.2 },
        { name: 'Balance', chance: 0.05 },
        { name: 'Deathdealing', chance: 0.05 },
        { name: 'Explode', chance: 0.05 },
        { name: 'Fear', chance: 0.1 },
        { name: 'Gluttony', chance: 0.05 },
        { name: 'Heat', chance: 0.05 },
        { name: 'Iron', chance: 0.05 },
        { name: 'Superstar', chance: 0.05 },
        { name: 'Visionary', chance: 0.05 },
        { name: 'Wind', chance: 0.05 },
        { name: 'X-Axis', chance: 0.05 },
        { name: 'Thunderbolt', chance: 0.05 },
        { name: 'Zombie', chance: 0.05 },
        { name: 'Almighty', chance: 0.01 },
        { name: 'Miracle', chance: 0.02 },
        { name: 'Compulsory', chance: 0.02 },
        { name: 'Generic Schrift', chance: 0.12 },
      ],
      "Fullbringer": [
        { name: 'Cross of Scaffold', chance: 0.05 },
        { name: 'Dirty Boots', chance: 0.05 },
        { name: 'Book of the End', chance: 0.05 },
        { name: 'Invaders Must Die', chance: 0.05 },
        { name: 'Jackie’s Rage', chance: 0.1 },
        { name: 'Giriko’s Timepiece', chance: 0.1 },
        { name: 'Yukio’s Console', chance: 0.1 },
        { name: 'Generic Fullbring', chance: 0.5 },
      ],
    };

    const race = (userData.race || "").trim();

    // Helper: get power type name
    const getPowerType = (race) => {
      switch (race) {
        case "Soul Reaper": return "shikai";
        case "Arrancar": return "Resurrección";
        case "Quincy": return "Schrift";
        case "Fullbringer": return "Fullbring";
        default: return "power";
      }
    };

    const powerType = getPowerType(race);

    // Weighted random roll
    const rollPower = (pool) => {
      const roll = Math.random();
      let cumulative = 0;
      for (const p of pool) {
        cumulative += p.chance;
        if (roll <= cumulative) return p.name;
      }
      return pool[pool.length - 1].name;
    };

    if (!powerPools[race]) {
      return interaction.reply({
        content: `You are a ${race}, you cannot use this command.`,
        ephemeral: true,
      });
    }

    // Safe reply helper
    const safeReply = async (content, ephemeral = true) => {
      if (interaction.replied || interaction.deferred) {
        return interaction.followUp({ content, ephemeral }).catch(() => {});
      } else {
        return interaction.reply({ content, ephemeral }).catch(() => {});
      }
    };

    // --- Zanpakuto Use ---
    if (item === ZANPAKUTO) {
      if (!userData.inventory?.[ZANPAKUTO]) {
        return safeReply("❌ You don't have a Zanpakuto to use.");
      }

      if (userData.power) {
        return safeReply(`❌ You have already awakened your ${powerType}. Use a Zanpakuto Reroll to reroll it.`);
      }

      // Consume Zanpakuto
      userData.inventory[ZANPAKUTO] = Math.max(0, (userData.inventory[ZANPAKUTO] || 1) - 1);
      if (userData.inventory[ZANPAKUTO] === 0) delete userData.inventory[ZANPAKUTO];

      // Roll power
      userData.power = rollPower(powerPools[race]);
      await database.saveUserData(userId, userData);

      return safeReply(`✅ You used a Zanpakuto and awakened the **${userData.power}** ${powerType}!`, false);
    }

    // --- Zanpakuto Reroll ---
    if (item === REROLL) {
      if (!userData.inventory?.[REROLL]) {
        return safeReply("❌ You don't have a Zanpakuto Reroll to use.");
      }

      if (!userData.power) {
        return safeReply("❌ You must awaken a power first before you can reroll it.");
      }

      // Consume Reroll
      userData.inventory[REROLL] = Math.max(0, userData.inventory[REROLL] - 1);
      if (userData.inventory[REROLL] === 0) delete userData.inventory[REROLL];

      // Roll new power
      userData.power = rollPower(powerPools[race]);
      await database.saveUserData(userId, userData);

      return safeReply(`✅ You used a Zanpakuto Reroll and rerolled your ${powerType}! Your new power is **${userData.power}**.`, false);
    }

    // --- Unknown Item ---
    return safeReply("❌ That item cannot be used.");
  } catch (err) {
    console.error("Error in handleUseItemCommand:", err);
    if (!interaction.replied && !interaction.deferred) {
      return interaction.reply({ content: "❌ Something went wrong.", ephemeral: true }).catch(() => {});
    }
  }
}

async function handleFightCommand(interaction) {
  const userId = interaction.user.id;
  await database.ensureUser(userId);
  const userData = await database.getUserData(userId);

  if (!userData.power || !powerMovesets[userData.power]) {
    return interaction.reply({
      content: 'You require a shikai/power to fight or your current shikai is not implemented yet.',
      ephemeral: true,
    });
  }

  if (userData.race?.toLowerCase() === 'human') {
    return interaction.reply({
      content: `You are a ${userData.race}, you cannot utilise this command yet.`,
      ephemeral: false,
    });
  }

  // Pick random boss
  const enemy = bossPool[Math.floor(Math.random() * bossPool.length)];
  let bossHealth = enemy.health;
  let playerDefense = userData.defense || 0;
  let playerHealth = 700 + (userData.healthBoost || 0);
  let turn = 1;
  let fightActive = true;
  let bankaiActive = false;
  let battleLog = [];

  // Player moves
  const moveset = powerMovesets[userData.power];
  function getAvailableMoves() {
    return moveset
      .filter(move => {
        if (move.ultimate && !bankaiActive) return false;
        if (move.name.toLowerCase() === 'mugetsu' && !bankaiActive) return false;
        return true;
      })
      .map((move, idx) => ({
        label: move.name.slice(0, 100),
        value: idx.toString(),
        description: move.description.slice(0, 100),
      }));
  }

  const moveMenu = new StringSelectMenuBuilder()
    .setCustomId("fight-move-select")
    .setPlaceholder("Choose your move")
    .addOptions(getAvailableMoves());

  const moveRow = new ActionRowBuilder().addComponents(moveMenu);

  // Initial message (fetchReply so we can attach collector)
  const fightMessage = await interaction.reply({
    embeds: [
      new EmbedBuilder()
        .setTitle(`⚔️ Boss Fight: ${enemy.name}`)
        .setDescription(`Boss HP: **${bossHealth}**\nYour HP: **${playerHealth}**\nYour Defense: **${playerDefense}**`)
        .setColor("Red")
    ],
    components: [moveRow],
    ephemeral: false,
    fetchReply: true, // <— KEY
  });

  // Collector attached to the message, not channel
  const collector = fightMessage.createMessageComponentCollector({
    componentType: ComponentType.StringSelect,
    time: 120000,
    filter: (i) => i.user.id === userId,
  });

  collector.on("collect", async (i) => {
    if (!fightActive || i.customId !== "fight-move-select") return;

    const moveIdx = parseInt(i.values[0]);
    const move = moveset[moveIdx];
    let turnLog = [`**Turn ${turn}:**`];

    // === Player move ===
    if (move.name.toLowerCase() === "mugetsu") {
      bossHealth = 0;
      fightActive = false;
      turnLog.push(`🌑 You unleashed **Mugetsu**! ${enemy.name} was completely obliterated...`);
      turnLog.push(`⚠️ The cost of this forbidden technique is everything. Your powers have vanished...`);

      userData.power = null;
      await database.saveUserData(userId, userData);

      battleLog.push(turnLog.join('\n'));
      turn++;

    } else if (move.defenseBoost) {
      playerDefense += move.defenseBoost;
      turnLog.push(`You used **${move.name}** and increased your defense by ${move.defenseBoost}!`);
    } else {
      let damage = move.damage;
      if (bankaiActive) damage = Math.floor(damage * 1.5);

      let prevented = false;
      for (const ability of enemy.abilities || []) {
        if (ability.effect === "dodge" && Math.random() < ability.chance) {
          turnLog.push(`${enemy.name} used **${ability.name}** and dodged your attack!`);
          prevented = true;
          break;
        }
        if (ability.effect === "block" && Math.random() < ability.chance) {
          turnLog.push(`${enemy.name} used **${ability.name}** and blocked your attack!`);
          prevented = true;
          break;
        }
      }

      if (!prevented) {
        const dmg = Math.max(1, damage - enemy.defense);
        bossHealth -= dmg;
        turnLog.push(`You used **${move.name}** and dealt **${dmg}** damage to ${enemy.name}!`);
      }
    }

    if (move.counterAttack === true) {
      bossHealth -= move.damage;
      playerHealth += 200;
      turnLog.push(`You countered the boss' attack, dealt **${move.damage}** damage, and healed **200 HP**.`);
    }

    if (move.bankaiActivate && !bankaiActive) {
      bankaiActive = true;
      playerDefense += 50;
      playerHealth += 100;
      turnLog.push(`🔥 You have activated **Bankai/Ressurecion**! +50 Defense and +100 HP, your attacks hit harder!`);
    }

    // === Boss turn ===
    if (bossHealth > 0 && fightActive) {
      let bossDidAction = false;

      if (enemy.abilities?.length) {
        const ability = enemy.abilities[Math.floor(Math.random() * enemy.abilities.length)];
        if (ability.damage && Math.random() < ability.chance) {
          let effectiveDefense = Math.floor(playerDefense * 0.5);
          let bossDmg = ability.damage - effectiveDefense;
          bossDmg = Math.max(Math.floor(ability.damage * 0.3), bossDmg);
          playerHealth -= bossDmg;
          turnLog.push(`${enemy.name} used **${ability.name}** and dealt **${bossDmg}** damage to you!`);
          bossDidAction = true;
        }
      }

      if (!bossDidAction) {
        let baseAttack = enemy.abilities?.find(a => a.damage)?.damage || 15;
        let effectiveDefense = Math.floor(playerDefense * 0.5);
        let bossDmg = baseAttack - effectiveDefense;
        bossDmg = Math.max(Math.floor(baseAttack * 0.3), bossDmg);
        playerHealth -= bossDmg;
        turnLog.push(`${enemy.name} attacks and deals **${bossDmg}** damage to you!`);
      }
    }

    playerHealth = Math.max(0, playerHealth);
    bossHealth = Math.max(0, bossHealth);

    battleLog.push(turnLog.join('\n'));
    turn++;

    // === End conditions ===
    let resultMsg;
    let embedColor = "Red";

    if (bossHealth <= 0) {
      fightActive = false;
      const rewardMoney = Math.floor(Math.random() * 3000) + 1000;
      const rewardExp = Math.floor(Math.random() * 500) + 250;
      userData.balance += rewardMoney;
      userData.experience += rewardExp;
      await database.saveUserData(userId, userData);

      if (move.name.toLowerCase() === "mugetsu") embedColor = "#000000";

      resultMsg = `🎉 You defeated **${enemy.name}**!\n\n**Rewards:**\n¥${rewardMoney} and ${rewardExp} EXP\n\n${battleLog.join('\n')}`;
      collector.stop();
    } else if (playerHealth <= 0) {
      fightActive = false;
      resultMsg = `💀 You were defeated by **${enemy.name}**!\n\n${battleLog.join('\n')}`;
      collector.stop();
    } else if (turn > 20) {
      fightActive = false;
      resultMsg = `⏳ The fight ended in a draw after 20 turns!\n\n${battleLog.join('\n')}`;
      collector.stop();
    } else {
      resultMsg = `Boss HP: ${bossHealth}\nYour HP: ${playerHealth}\nYour Defense: ${playerDefense}\n\n${turnLog.join('\n')}\n\n👉 Choose another move!`;
    }

    // === Safe update ===
    try {
      await i.update({
        embeds: [
          new EmbedBuilder()
            .setTitle(`⚔️ Boss Fight: ${enemy.name}`)
            .setDescription(resultMsg)
            .setColor(embedColor)
        ],
        components: fightActive ? [new ActionRowBuilder().addComponents(
          new StringSelectMenuBuilder()
            .setCustomId("fight-move-select")
            .setPlaceholder("Choose your move")
            .addOptions(getAvailableMoves())
        )] : [],
      });
    } catch (err) {
      console.error("Failed to update interaction:", err);
      try {
        await fightMessage.edit({
          embeds: [
            new EmbedBuilder()
              .setTitle(`⚔️ Boss Fight: ${enemy.name}`)
              .setDescription(resultMsg)
              .setColor(embedColor)
          ],
          components: fightActive ? [new ActionRowBuilder().addComponents(
            new StringSelectMenuBuilder()
              .setCustomId("fight-move-select")
              .setPlaceholder("Choose your move")
              .addOptions(getAvailableMoves())
          )] : [],
        });
      } catch (editErr) {
        console.error("Also failed to edit fight message:", editErr);
      }
    }
  });

  collector.on("end", async () => {
    if (fightActive) {
      fightActive = false;
      await interaction.followUp({
        content: `⌛ The fight timed out after 2 minutes!`,
        ephemeral: false,
      });
    }
  });
}

async function handleFishCommand(interaction) {
  const userId = interaction.user.id;
  await database.ensureUser(userId);
  const userData = await database.getUserData(userId);
  const fishingRodKey = 'Fishing Rod';

  if (!userData.inventory[fishingRodKey] || userData.inventory[fishingRodKey] <= 0) {
    return interaction.reply({
      content: "❌ You need a Fishing Rod to fish! Acquire one.",
      ephemeral: true,
    });
  }

  const randomFish = ["Salmon", "Tuna", "Trout", "Catfish", "Bass", "Carp", "Goldfish"];
  const caughtFish = randomFish[Math.floor(Math.random() * randomFish.length)];

  userData.inventory[caughtFish] = (userData.inventory[caughtFish] || 0) + 1;
  userData.inventory[fishingRodKey] -= 1;
  if (userData.inventory[fishingRodKey] === 0) delete userData.inventory[fishingRodKey];
  await database.saveUserData(userId, userData);
  return interaction.reply({
    content: `🎣 You went fishing and caught a **${caughtFish}**!`,
    ephemeral: false,
  });
}

async function handleSuggestCommand(interaction) {
  const suggestion = interaction.options.getString('suggestion');
  const userId = interaction.user.id;
  const userSend = '961370035555811388';

  const suggestionEmbed = new EmbedBuilder()
  .setColor('Random')
  .setTitle(`New suggestion from ${interaction.user.username} (${userId})`)
  .setDescription(suggestion)
  .setFooter({ text: 'Thank you for using the crucified bot! Developed by crucifiedxx' })
  .setTimestamp();

  try {
    const user = await interaction.client.users.fetch(userSend);
    await user.send({ embeds: [suggestionEmbed] });
    await interaction.reply({
      content: '✅ Your suggestion has been sent to the bot developer. Thank you!',
      ephemeral: true,
    });
  } catch (error) {
    console.error('Error sending suggestion:', error);
    await interaction.reply({
      content: '❌ There was an error sending your suggestion. Please try again later.',
      ephemeral: true,
    });
  }
}

async function handleHugCommand(interaction) {
  const targetUser = interaction.options.getUser('target');
  const userId = interaction.user.id;
  const avatar = interaction.user.displayAvatarURL({ dynamic: true });

  if (targetUser.id === userId) {
    return interaction.reply({
      content: "You cannot hug yourself!",
      ephemeral: true,
    });
  }

  await database.ensureUser(userId);
  const userData = await database.getUserData(userId);

  // --- Counter logic ---
  userData.name ||= interaction.user.displayName;
  userData.roleplayActions ||= {};
  userData.roleplayActions.hug ||= {};
  userData.roleplayActions.hug[targetUser.id] = (userData.roleplayActions.hug[targetUser.id] || 0) + 1;
  const count = userData.roleplayActions.hug[targetUser.id];
  await database.saveUserData(userId, userData);

  // --- Embed logic ---
  const hugImages = [
    'https://i.pinimg.com/originals/16/f4/ef/16f4ef8659534c88264670265e2a1626.gif',
    'https://i.pinimg.com/originals/bf/b5/be/bfb5bed89f8c09bf53eab687eb3f9404.gif',
    'https://i.pinimg.com/originals/6f/26/b1/6f26b102d674cb74e8869103af40f253.gif',
    'https://i.pinimg.com/originals/ef/b6/e3/efb6e37a8a31e47b1ea969833555b4b6.gif',
    'https://i.pinimg.com/originals/ef/ec/4e/efec4efb80165788a794f94c14bc9eb6.gif',
    'https://i.pinimg.com/originals/9c/18/12/9c18129e8449737c6ab013567cddaac0.gif',
    'https://i.pinimg.com/originals/6e/93/f7/6e93f79d1db5af77a09414b632c2054f.gif',
    'https://i.pinimg.com/originals/3f/ad/d2/3fadd265abfb14aaace51414f30a55af.gif',
  ];
  const selectedImage = hugImages[Math.floor(Math.random() * hugImages.length)];

  const hugEmbed = new EmbedBuilder()
    .setColor('Random')
    .setDescription(`**<@${userId}>** has hugged **<@${targetUser.id}>** (**${count}** time${count === 1 ? "" : "s"})!`)
    .setAuthor({
      name: `${interaction.user.displayName}`,
      iconURL: avatar,
    })
    .setImage(selectedImage)
    .setFooter({ text: 'Hugs are nice!' })
    .setTimestamp();

  await interaction.reply({ embeds: [hugEmbed] });
}

async function handleSlapCommand(interaction) {
  const targetUser = interaction.options.getUser('target');
  const userID = interaction.user.id;
  const avatar = interaction.user.displayAvatarURL({ dynamic: true});

  if (targetUser.id === userID) {
    return interaction.reply({
      content: 'You cannot slap yourself!',
      ephemeral: true
    });
  }

  await database.ensureUser(userID);
  const userData = await database.getUserData(userID);

  userData.name ||= interaction.user.displayName;
  userData.roleplayActions ||= {};
  userData.roleplayActions.slap ||= {};
  userData.roleplayActions.slap[targetUser.id] = (userData.roleplayActions.slap[targetUser.id] || 0) + 1;
  const count = userData.roleplayActions.slap[targetUser.id];
  await database.saveUserData(userID, userData);

  const slapimages = [
    'https://i.pinimg.com/originals/2b/3a/3e/2b3a3e107ac57d4f170a8f8e414fec9f.gif',
    'https://i.pinimg.com/originals/1e/0d/de/1e0dde7324127aa8de046ede80b89d2d.gif',
    'https://i.pinimg.com/originals/a9/b8/bd/a9b8bd2060d76ec286ec8b4c61ec1f5a.gif',
    'https://i.pinimg.com/originals/8c/a5/fc/8ca5fc2e6657e04b6a4236cf3dcc3f6b.gif',
    'https://i.pinimg.com/originals/70/0b/b2/700bb2cc9429e2bab1da767b4486f4e1.gif',
    'https://i.pinimg.com/originals/a5/b6/da/a5b6da6669d9e8684fdae18932a22ff6.gif',
    'https://i.pinimg.com/originals/f3/73/d9/f373d9bd0f4e703c0f0d1eae35ec157a.gif',
  ];
  const selectedImage = slapimages[Math.floor(Math.random() * slapimages.length)];

  const slapEmbed = new EmbedBuilder()
  .setColor('Random')
  .setDescription(`<@${interaction.user.id}> has slapped <@${targetUser.id}> **${count}** time${count === 1 ? "" : "s"}!`)
  .setImage(selectedImage)
  .setAuthor({
    name: interaction.user.displayName,
    iconURL: avatar
  })
  .setFooter({ text: 'Owh that must hurt!' })
  .setTimestamp();

  try {
    await interaction.reply({
      embeds: [slapEmbed]
    });
  } catch (error) {
    console.log(error);
    return interaction.reply({
      content: 'There has been an error with the command!',
      ephemeral: true
    });
  }
}

async function handleKissCommand(interaction) {
  const targetUser = interaction.options.getUser('target');
  const userID = interaction.user.id;
  const avatar = interaction.user.displayAvatarURL({dynamic: true});

  await database.ensureUser(userID);
  const userData = await database.getUserData(userID);

  if (targetUser.id === userID) {
    return interaction.reply({
      content: 'You cannot kiss yourself, sadly.',
      ephemeral: true
    });
  }

  userData.name ||= interaction.user.displayName;
  userData.roleplayActions ||= {};
  userData.roleplayActions.kiss ||= {};
  userData.roleplayActions.kiss[targetUser.id] = (userData.roleplayActions.kiss[targetUser.id] || 0) + 1;
  const count = userData.roleplayActions.kiss[targetUser.id];
  await database.saveUserData(userID, userData);

  const kissImages = [
    'https://i.pinimg.com/originals/da/64/eb/da64eb02a04941d4eb31f173cc2c6c40.gif',
    'https://i.pinimg.com/originals/10/5a/7a/105a7ad7edbe74e5ca834348025cc650.gif',
    'https://i.pinimg.com/originals/4b/5d/5a/4b5d5afd747fe053ed79317628aac106.gif',
    'https://i.pinimg.com/originals/6c/05/e5/6c05e58405258b50711b84ac9db7441a.gif',
    'https://i.pinimg.com/originals/37/63/3f/37633f0b8d39daf70a50f69293e303fc.gif',
    'https://i.pinimg.com/originals/41/6a/85/416a8536c3ba7830c64cd9847e3b880d.gif',
    'https://i.pinimg.com/originals/d0/cd/64/d0cd64030f383d56e7edc54a484d4b8d.gif',
    'https://i.pinimg.com/originals/ae/4c/ad/ae4cad79c863407377e7f498b27bba78.gif'
  ];
  const randomKissImage = kissImages[Math.floor(Math.random() * kissImages.length)];

  const kissEmbed = new EmbedBuilder()
  .setColor('Random')
  .setDescription(`<@${userID}> has kissed <@${targetUser.id}> **${count}** time${count === 1 ? "" : "s"}!`)
  .setImage(randomKissImage)
  .setAuthor({
    name: interaction.user.displayName,
    iconURL: avatar,
  })
  .setFooter({text: 'All lovey dovey huh'})
  .setTimestamp();

  try {
    await interaction.reply({
      embeds: [kissEmbed]
    });
  } catch (error) {
    console.log(error);
    return interaction.reply({
      content: 'There has been an issue with the command!',
      ephemeral: true
    });
  }
}

async function handleCuddleCommand(interaction) {
  const targetUser = interaction.options.getUser('target');
  const userID = interaction.user.id;

  await database.ensureUser(userID);
  const userData = await database.getUserData(userID);

  userData.name ||= interaction.user.displayName;
  userData.roleplayActions ||= {};
  userData.roleplayActions.cuddle ||= {};
  userData.roleplayActions.cuddle[targetUser.id] = (userData.roleplayActions.cuddle[targetUser.id] || 0) + 1;
  const count = userData.roleplayActions.cuddle[targetUser.id];

  const cuddleImages = [
    'https://i.pinimg.com/originals/ae/43/03/ae4303ff0a5ba51017874911797e3620.gif',
    'https://i.pinimg.com/originals/36/d7/4d/36d74d6358b6abb17ad43e2c210a1e84.gif',
    'https://i.pinimg.com/originals/8d/60/5d/8d605dba1b4b9e0b0c1e4860d4dd2da3.gif',
    'https://i.pinimg.com/originals/ba/48/1c/ba481c1dcc966425688847b6e17f9299.gif',
    'https://i.pinimg.com/originals/d1/e8/4c/d1e84cdd185e7cd31daec5d411788eef.gif'
  ];
  const selectedCuddleImage = cuddleImages[Math.floor(Math.random() * cuddleImages.length)];

  const cuddleEmbed = new EmbedBuilder()
  .setColor('Random')
  .setDescription(`<@${userID}> has cuddled <@${targetUser.id}> **${count}** time${count === 1 ? "" : "s"}!`)
  .setImage(selectedCuddleImage)
  .setFooter({text: 'How cute'})
  .setTimestamp();

  try {
    await interaction.reply({
      embeds: [cuddleEmbed]
    });
  } catch (error) {
    console.log(error);
    return interaction.reply({
      content: 'There has been an error with the command!',
      ephemeral: true,
    });
  }
}

async function handleFuckCommand(interaction) {
  const targetUserID = interaction.options.getUser('target').id;
  const userID = interaction.user.id;

  await database.ensureUser(userID);
  const userData = await database.getUserData(userID);

  if (interaction.channel.nsfw === false) {
    return interaction.reply({
      content: 'This command can only be used in NSFW channels.',
      ephemeral: true
    });
  }

  userData.name ||= interaction.user.displayName;
  userData.roleplayActions ||= {};
  userData.roleplayActions.fuck ||= {};
  userData.roleplayActions.fuck[targetUserID] = (userData.roleplayActions.fuck[targetUserID] || 0) + 1;
  const count = userData.roleplayActions.fuck[targetUserID];

  await database.saveUserData(userID, userData);

  const fuckImages = [
    'https://r2.greed.best/fuck/fuck6.gif',
    'https://r2.greed.best/fuck/fuck1.gif',
    'https://r2.greed.best/fuck/fuck4.gif',
    'https://r2.greed.best/fuck/fuck2.gif',
    'https://r2.greed.best/fuck/fuck7.gif',
    'https://r2.greed.best/fuck/fuck10.gif',
    'https://r2.greed.best/fuck/fuck5.gif',
    'https://r2.greed.best/fuck/fuck3.gif',
    'https://r2.greed.best/fuck/fuck11.gif',
    'https://r2.greed.best/fuck/fuck9.gif',
    'https://r2.greed.best/fuck/fuck8.gif',
    ''
  ];
  const selectedfuckImages = fuckImages[Math.floor(Math.random() * fuckImages.length)];

  const fuckEmbed = new EmbedBuilder()
  .setColor('Random')
  .setDescription(`<@${userID}> has fucked <@${targetUserID}> **${count}** time${count === 1 ? "" : "s"}`)
  .setImage(selectedfuckImages)
  .setAuthor({
    name: interaction.user.displayName,
    iconURL: interaction.user.displayAvatarURL({dynamic: true})
  })
  .setFooter({text: 'Ooh... get a room.'})
  .setTimestamp();

  try {
    await interaction.reply({
      embeds: [fuckEmbed]
    });
  } catch (error) {
    console.log(error);
    return interaction.reply({
      content: 'There has been an issue with the command!',
      ephemeral: true
    });
  }
}

async function handleClearUserWarningCommand(interaction) {
  // Permission check first - remove .Flags
  if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
    return interaction.reply({
      content: '❌ You do not have permission to use this command.',
      ephemeral: true,
    });
  }

  const targetID = interaction.options.getUser('user').id;
  await database.ensureUser(targetID);
  const targetData = await database.getUserData(targetID);

  // Check if user has warnings
  if (!targetData.violations || targetData.violations.length === 0) {
    return interaction.reply({
      content: `❌ <@${targetID}> has no warnings to clear.`,
      ephemeral: true,
    });
  }

  // Clear warnings and save
  targetData.violations = [];
  await database.saveUserData(targetID, targetData);

  return interaction.reply({
    content: `✅ All warnings for <@${targetID}> have been cleared.`,
    ephemeral: true,
  });
}

async function handleGiveWarningCommand(interaction) {
  const targetUser = interaction.options.getUser('target');
  const targetID = targetUser.id;
  const reason = interaction.options.getString('reason') || 'No reason provided';
  const MOD_LOG_CHANNEL_ID = process.env.MOD_LOG_CHANNEL;

  const targetMember = interaction.guild.members.resolve(targetID);

  await database.ensureUser(targetID);
  const targetData = await database.getUserData(targetID);

  // Permission check
  const hasModerate = interaction.member.permissions.has(PermissionFlagsBits.ModerateMembers);
  const hasAdmin = interaction.member.permissions.has(PermissionFlagsBits.Administrator);

  if (!hasModerate && !hasAdmin) {
    return interaction.reply({
      content: 'You do not have the required permissions to issue warnings.',
      ephemeral: true,
    });
  }

  // Add warning
  targetData.violations ??= [];
  targetData.violations.push({
    reason,
    date: new Date().toISOString(),
    issuedBy: interaction.user.id,
  });

  await database.saveUserData(targetID, targetData);

  // Timeout lengths
  const timeoutMs5 = 60 * 60 * 1000; // 1 hour
  const timeoutMs10 = 5 * 60 * 60 * 1000; // 5 hours

  const readable5 = msToReadable(timeoutMs5);
  const readable10 = msToReadable(timeoutMs10);

  let replyMessage = `✅ <@${targetID}> has been warned for: **${reason}**.`;

  // Handle 5-warning timeout
  if (targetData.violations.length === 5 && targetMember) {
    try {
      await targetMember.timeout(timeoutMs5, 'Accumulated 5 warnings');
      replyMessage += `\n⚠️ User has been timed out for accumulating **5 warnings**.\n⏳ Duration: **${readable5}**`;

      const logChannel = interaction.client.channels.cache.get(MOD_LOG_CHANNEL_ID);
      if (logChannel) {
        await logChannel.send({
          embeds: [
            new EmbedBuilder()
              .setTitle('User Timed Out for 5 Warnings')
              .setDescription(`<@${targetID}> has been timed out after reaching 5 warnings.`)
              .addFields(
                { name: 'Duration', value: readable5, inline: true },
                { name: 'Issued By', value: `<@${interaction.user.id}>`, inline: true },
                { name: 'Reason', value: 'Accumulated 5 warnings', inline: false }
              )
              .setColor('Random')
              .setThumbnail(targetUser.displayAvatarURL({ dynamic: true }))
              .setTimestamp()
          ]
        });
      }
    } catch (err) {
      console.error('Timeout (5 warnings) failed:', err);
    }
  }

  // Send initial reply
  await interaction.reply({ content: replyMessage, ephemeral: true });

  // Handle 10-warning timeout
  if (targetData.violations.length === 10 && targetMember) {
    try {
      await targetMember.timeout(timeoutMs10, 'Accumulated 10 warnings');

      await interaction.followUp({
        content:
          `⚠️ <@${targetID}> has been timed out for accumulating **10 warnings**.\n⏳ Duration: **${readable10}**`,
        ephemeral: true,
      });

      const logChannel = interaction.client.channels.cache.get(MOD_LOG_CHANNEL_ID);
      if (logChannel) {
        await logChannel.send({
          embeds: [
            new EmbedBuilder()
              .setTitle('User Timed Out for 10 Warnings')
              .setDescription(`<@${targetID}> has been timed out after reaching 10 warnings.`)
              .addFields(
                { name: 'Duration', value: readable10, inline: true },
                { name: 'Issued By', value: `<@${interaction.user.id}>`, inline: true },
                { name: 'Reason', value: 'Accumulated 10 warnings', inline: false }
              )
              .setColor('Random')
              .setThumbnail(targetUser.displayAvatarURL({ dynamic: true }))
              .setTimestamp()
          ]
        });
      }
    } catch (err) {
      console.error('Timeout (10 warnings) failed:', err);
    }
  }
}


// Converts milliseconds to human readable text (e.g. "1 hour", "30 minutes")
function msToReadable(ms) {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  if (hours >= 1) return `${hours} hour${hours > 1 ? 's' : ''}`;
  if (minutes >= 1) return `${minutes} minute${minutes > 1 ? 's' : ''}`;
  return `${seconds} second${seconds > 1 ? 's' : ''}`;
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
  handleUseItemCommand,
  handleFightCommand,
  handleFishCommand,
  handleSuggestCommand,
  handleHugCommand,
  handleSlapCommand,
  handleKissCommand,
  handleCuddleCommand,
  handleFuckCommand,
  handleClearUserWarningCommand,
  handleGiveWarningCommand,
};
