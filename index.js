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
  handleSlapCommand,
  handleKissCommand,
  handleCuddleCommand,
  handleFuckCommand,
  handleClearUserWarningCommand
} = require("./commands.js");

const TOKEN = process.env.DISCORD_BOT_TOKEN;
if (!TOKEN) throw new Error("❌ Missing DISCORD_BOT_TOKEN in .env file");
const OWNER_ID = process.env.OWNER_ID;
const OWNER_ID2 = process.env.OWNER_ID2;
const MOD_LOG_CHANNEL = process.env.MOD_LOG_CHANNEL || null;

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

// --- AutoMod patterns & helpers (enhanced, no command changes) ---
const autoModPatterns = {
  // contextual phrases that target protected groups or encourage exclusion/violence
  contextual: [
    /\b(go\s+back\s+to|go\s+back\s+where|return\s+to)\b/i,
    /\b(get\s+out\s+of|get\s+out)\b/i,
    /\b(not\s+welcome|you\s+are\s+not\s+welcome)\b/i,
    /\b(kill\s+them|kill\s+all|death\s+to)\b/i,
    /\b(exterminate|extermination|ethnic\s+cleansing)\b/i
  ],
  // category-specific regexes (catch obvious patterns, but rely mainly on normalization + fuzzy match)
  categories: {
    racism: [
      // lightweight regex seeds — normalized input is used later for fuzzy checks
      /\b(nig+|n[i1!|¡].*g+)\b/i,
      /\b(chin[kk]?)\b/i,
      /\b(coo+n+)\b/i,
      /\b(g[o0][\s_]*[kc])\b/i,
      /\b(sl[a@]nt)\b/i,
      /\b(y[e3]ll[o0]w)\s*(b[o0]ne|d[e3]v[i1]l|m[o0]nk[e3]y|p[e3][o0]pl[e3])\b/i,
      /\b(r[i1]c[e3])\s*(p[i1]ck[e3]r|n[i1]gg[e3]r)\b/i
    ],
    homophobia: [
      /\b(fag+|faggo+t?)\b/i,
      /\b(dyke|dyk[ek]?)\b/i
    ],
    ableism: [
      /\b(retard+|r[e3]t[a4@]rd)\b/i,
      /\b(spaz+)\b/i
    ],
    antisemitic_xenophobic: [
      /\b(kik+e?)\b/i,
      /\b(jew+)\b/i
    ]
  },
  // evasion helpers
  evasion: {
    separators: /[\s._\-+=*&^%$#@!~\/\\,:;'"<>()[\]{}⠀\u200B-\u200D\uFEFF\u2060-\u2064]/g,
    repeats: /(.)\1{2,}/g,
    // expanded leet -> letter mappings (used to normalize text before checks)
    leet: {
      a: /[@4∆^àáâãäåāăąǎ]/g,
      e: /[3€èéêëēĕėęě]/g,
      i: /[!1|¡ìíîïĩīĭį]/g,
      o: /[0θōŏő]/g,
      s: /[$5ѕ]/g,
      t: /[7†]/g,
      g: /[6q]/g,
      b: /[8|ß]/g,
      n: /[ñń]/g,
      c: /[¢©]/g
    },
    // some common homoglyphs mapped to ascii
    homoglyphs: new Map([
      ['а','a'], ['е','e'], ['і','i'], ['о','o'], ['р','p'],
      ['с','c'], ['у','y'], ['х','x'], ['ь','b'], ['ѕ','s'],
      ['ґ','g'], ['є','e'], ['ї','i'], ['л','l']
    ])
  }
};

// small curated list of slur stems for fuzzy detection (used only for moderation)
// these are stems/pieces used to detect obfuscated variants — they are not output as suggestions
const slurStems = {
  racism: ['nig', 'nigg', 'coon', 'chink', 'spic', 'gypo', 'wetback', 'ching', 'whigg', 'whigger', 'gook', 'slant', 'zippr'],
  homophobia: ['fag', 'faag', 'dyke', 'queer'],
  ableism: ['retard', 'spaz', 'crip'],
  antisemitic: ['kike', 'yid']
};

// Levenshtein distance (iterative DP) -> returns similarity ratio 0..1
function levenshteinSimilarity(a, b) {
  if (!a || !b) return 0;
  const la = a.length, lb = b.length;
  if (la === 0) return 0;
  const dp = Array.from({ length: la + 1 }, () => new Array(lb + 1));
  for (let i = 0; i <= la; i++) dp[i][0] = i;
  for (let j = 0; j <= lb; j++) dp[0][j] = j;
  for (let i = 1; i <= la; i++) {
    for (let j = 1; j <= lb; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + cost
      );
    }
  }
  const dist = dp[la][lb];
  const maxLen = Math.max(la, lb);
  return maxLen === 0 ? 0 : 1 - dist / maxLen;
}

// Normalize text to reduce evasion attempts and split into tokens
function normalizeText(text) {
  if (!text) return { raw: '', normalized: '', tokens: [] };
  let s = String(text).toLowerCase();

  // 1) Remove zero-width & invisible characters
  s = s.replace(/[\u200B-\u200F\uFEFF\u2060-\u206F\u180E\u00AD\u034F]/g, '');

  // 2) Replace homoglyphs
  for (const [hg, ch] of autoModPatterns.evasion.homoglyphs) {
    s = s.replace(new RegExp(hg, 'g'), ch);
  }

  // 3) Replace common leet sequences
  for (const [letter, regex] of Object.entries(autoModPatterns.evasion.leet)) {
    s = s.replace(regex, letter);
  }

  // 4) Remove punctuation & separators but keep spaces for tokenization
  s = s.replace(autoModPatterns.evasion.separators, ' ').trim();

  // 5) Collapse long repeated characters (aaaa -> a)
  s = s.replace(/(.)\1{2,}/g, '$1');

  // 6) Normalize remaining non-alphanumerics and trim
  s = s.replace(/[^\p{L}\p{N}\s]/gu, '').trim();

  // 7) produce tokens (words)
  const tokens = s.split(/\s+/).filter(Boolean);

  return { raw: text, normalized: s, tokens };
}

// Main detection function (returns category string or null)
function detectViolation(originalContent) {
  if (!originalContent) return null;
  const { raw, normalized, tokens } = normalizeText(originalContent);

  // 1) Contextual regex checks on raw content (catches direct phrases)
  for (const rx of autoModPatterns.contextual) {
    if (rx.test(raw)) return 'contextual_hate';
  }

  // 2) Category-specific regex checks against normalized text
  for (const [cat, list] of Object.entries(autoModPatterns.categories)) {
    for (const rx of list) {
      if (rx.test(normalized)) return cat;
    }
  }

  // 3) Fuzzy/stem checks
  // - First: check individual tokens (words) with a conservative similarity threshold
  // - Second: check the concatenated normalized sentence (no spaces) for substrings
  //   that may represent obfuscated or split slurs. Substring checks use a
  //   higher similarity threshold to avoid reintroducing false positives
  //   (e.g. 'watching' -> 'ching').
  const SIM_THRESHOLD = 0.89; // token-based similarity
  const SUBSTR_SIM_THRESHOLD = 0.94; // substring-based similarity (stricter)

  const safeTokens = new Set([
    'night', 'knight', 'ignite', 'reignite', 'significant', 'denigrate',
    'nigeria', 'niger', 'nigel', 'nightmare', 'zipper', 'watching', 'watch',
    'conjuring', 'conjure', 'last', 'rites', 'rights', 'everyone', 'teaching',
    'teacher', 'retired', 'retire'
  ]);

  // Token-level checks (conservative)
  const candidates = new Set(tokens);
  for (const [category, stems] of Object.entries(slurStems)) {
    for (const stem of stems) {
      for (const cand of candidates) {
        if (safeTokens.has(cand)) continue;
        const similarity = levenshteinSimilarity(cand, stem);
        if (similarity >= SIM_THRESHOLD) return category;
      }
    }
  }

  // Concatenated-substring checks (stricter rules)
  // Build a compact form of the message removing spaces so we can detect
  // obfuscated slurs that are split across separators/tokens.
  const concat = tokens.join('');
  if (concat.length >= 3) {
    // map each token to its start/end index inside the concatenated string
    const tokenPositions = [];
    let _pos = 0;
    for (const t of tokens) {
      tokenPositions.push({ token: t, start: _pos, end: _pos + t.length - 1 });
      _pos += t.length;
    }
    for (const [category, stems] of Object.entries(slurStems)) {
      for (const stem of stems) {
        // consider substrings with lengths close to the stem length
        const minLen = Math.max(3, stem.length - 1);
        const maxLen = Math.min(concat.length, stem.length + 2);
        for (let i = 0; i <= concat.length - minLen; i++) {
          for (let l = minLen; l <= maxLen && i + l <= concat.length; l++) {
            const sub = concat.substr(i, l);
            if (safeTokens.has(sub)) continue;
            // Require length proximity to reduce accidental matches
            if (Math.abs(sub.length - stem.length) > 2) continue;

            // If the substring is fully inside a single original token,
            // apply an extra heuristic: skip matches that are likely English
            // gerunds (words ending with 'ing') which commonly create false
            // positives (e.g. 'teaching' contains 'ching'). This preserves
            // detection for standalone or clearly obfuscated slurs while
            // reducing accidental triggers inside normal words.
            const subStart = i;
            const subEnd = i + l - 1;
            const covering = tokenPositions.filter(p => p.start <= subStart && p.end >= subEnd);
            if (covering.length === 1) {
              const tok = covering[0].token;
              if (tok.endsWith('ing') && tok.length > stem.length + 1) continue;
              if (safeTokens.has(tok)) continue;
            }

            const sim = levenshteinSimilarity(sub, stem);
            if (sim >= SUBSTR_SIM_THRESHOLD) return category;
          }
        }
      }
    }
  }

  // 4) Fallback: detect explicit short exclusionary phrases in normalized text
  const fallbackExclusions = [/go?back/i, /getout|getoutof/i, /notwelcome/i, /\bkill\b/];
  for (const rx of fallbackExclusions) {
    if (rx.test(normalized)) return 'exclusionary';
  }

  return null;
}

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
// leave this block unchanged as requested
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
  new SlashCommandBuilder().setName('kiss').setDescription('Kiss a user!')
    .addUserOption(option => option.setName('target').setDescription('The person you want to kiss!')),
  new SlashCommandBuilder().setName('cuddle').setDescription('Cuddle with a person!')
    .addUserOption(option => option.setName('target').setDescription('Person you want to cuddle with').setRequired(true)),
  new SlashCommandBuilder().setName('fuck').setDescription('Lets you fuck a person')
    .addUserOption(option => option.setName('target').setDescription('The person you want to fuck').setRequired(true)),
  new SlashCommandBuilder().setName('clear_user').setDescription('Allows a moderator to clear someones warnings.')
    .addUserOption(option => option.setName('user').setDescription('The person who you want to clear.').setRequired(true)),
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

client.on('messageCreate', async (message) => {
  // Skip bot messages and DMs
  if (message.author.bot || !message.guild) return;

  try {
    const content = message.content || "";

  // Skip checking Discord role/user mentions by removing them before analysis
  const cleanContent = content.replace(/<@&?\d+>/g, '') // Remove role/user mentions
           .replace(/@(everyone|here)/g, '') // Remove @everyone/@here
           .replace(/^@\w+\s+/g, '') // Remove any other @ mentions at start
           .trim();

    // Only check if there's content left after removing mentions
    if (!cleanContent) return;

    // --- Self-ban feature: if the user has configured selfBanWords in their
    // user data, and they say one of those words, notify a configured user
    // (BAN_NOTIFY_ID env or owner) and delete the message. This allows people
    // to opt into a personal "can't say these words" enforcement.
    try {
      await database.ensureUser(message.author.id).catch(() => {});
      const selfData = await database.getUserData(message.author.id) || {};
      // support legacy/db variations: accept `selfBanWords` or `SelfBanWords` (case differences)
      const rawSelfList = Array.isArray(selfData.selfBanWords)
        ? selfData.selfBanWords
        : (Array.isArray(selfData.SelfBanWords) ? selfData.SelfBanWords : []);
      const selfBanWords = rawSelfList.map(w => String(w).toLowerCase()).filter(Boolean);
      // If the DB used the legacy `SelfBanWords` key, migrate it to `selfBanWords`
      if (Array.isArray(selfData.SelfBanWords) && !Array.isArray(selfData.selfBanWords)) {
        try {
          selfData.selfBanWords = selfBanWords.slice();
          await database.saveUserData(message.author.id, selfData).catch(() => {});
        } catch (mErr) {
          // non-fatal
          console.error('Failed to migrate SelfBanWords to selfBanWords:', mErr);
        }
      }
      // Restrict self-ban enforcement to the bot owner(s) only
      if (message.author.id !== OWNER_ID && message.author.id !== OWNER_ID2) {
        // not owner, skip self-ban check
      } else if (selfBanWords.length > 0) {
        const { normalized: normalizedClean } = normalizeText(cleanContent);
        // debug logging to help diagnose why self-ban might not trigger
        console.log(`AutoMod: selfBan check for ${message.author.id} -> words=[${selfBanWords.join(',')}] normalized="${normalizedClean}"`);
        const escapeRegExp = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        for (const bw of selfBanWords) {
          const rx = new RegExp('\\b' + escapeRegExp(bw) + '\\b', 'i');
          if (rx.test(normalizedClean)) {
            // delete the message (best-effort)
            await message.delete().catch(() => {});

            // notify configured recipient
            const notifyId = process.env.BAN_NOTIFY_ID || OWNER_ID || OWNER_ID2;
            try {
              if (notifyId) {
                const notifyUser = await client.users.fetch(notifyId).catch(() => null);
                if (notifyUser) {
                  await notifyUser.send({
                    content: `🔔 Notice: **${message.author.tag}** (${message.author.id}) said a self-banned word: **${bw}**\nContext: ${cleanContent}`
                  }).catch(() => {});
                }
              }
            } catch (notifyErr) {
              console.error('Failed to notify about self-ban:', notifyErr);
            }

            // optional: log to mod channel for visibility
            if (MOD_LOG_CHANNEL) {
              try {
                const logChannel = message.guild.channels.cache.get(MOD_LOG_CHANNEL) ||
                                     await message.guild.channels.fetch(MOD_LOG_CHANNEL).catch(() => null);
                if (logChannel?.isTextBased()) {
                  await logChannel.send({
                    embeds: [{
                      color: 0xFFA500,
                      title: '🔒 Self-Ban Triggered',
                      fields: [
                        { name: 'User', value: `${message.author.tag} (${message.author.id})`, inline: true },
                        { name: 'Word', value: bw, inline: true },
                        { name: 'Content', value: cleanContent || '*no content*' }
                      ],
                      timestamp: new Date()
                    }]
                  }).catch(() => {});
                }
              } catch (logErr) {
                console.error('Failed to send self-ban log:', logErr);
              }
            }

            // record the self-ban violation in user data
            try {
              selfData.selfBanViolations = selfData.selfBanViolations || [];
              selfData.selfBanViolations.unshift({ word: bw, time: Date.now(), content: cleanContent });
              if (selfData.selfBanViolations.length > 50) selfData.selfBanViolations.length = 50;
              await database.saveUserData(message.author.id, selfData).catch(() => {});
            } catch (dbErr) {
              console.error('Failed to record self-ban violation:', dbErr);
            }

            // stop further processing for this message
            return;
          }
        }
      }
    } catch (err) {
      console.error('Self-ban check error:', err);
    }

    // Use the dedicated detection function on the cleaned content
    const violation = detectViolation(cleanContent);

    // If a violation is found, handle it
    if (violation) {
      try {
        // Delete the message
        await message.delete();

        // Send warning
        const warning = await message.channel.send({
          embeds: [{
            color: 0xFF0000,
            title: "⚠️ Message Removed",
            description: `${message.author}, your message was removed for containing prohibited content.`,
            fields: [
              { name: "Category", value: violation, inline: true },
              { name: "Note", value: "Please keep conversations respectful. Repeated violations may lead to moderation." }
            ],
            footer: { text: "This warning will auto-delete in 10 seconds" },
            timestamp: new Date()
          }]
        });

        // Delete warning after 10s
        setTimeout(() => warning.delete().catch(() => {}), 10000);

        // Log to mod channel if configured
        if (MOD_LOG_CHANNEL) {
          try {
            const logChannel = message.guild.channels.cache.get(MOD_LOG_CHANNEL) ||
                             await message.guild.channels.fetch(MOD_LOG_CHANNEL).catch(() => null);

            if (logChannel?.isTextBased()) {
              const { normalized } = normalizeText(content);
              await logChannel.send({
                embeds: [{
                  color: 0xFF0000,
                  title: "🛡️ AutoMod - Message Filtered",
                  fields: [
                    { name: "User", value: `${message.author.tag} (${message.author.id})`, inline: true },
                    { name: "Channel", value: `<#${message.channel.id}>`, inline: true },
                    { name: "Category", value: violation, inline: true },
                    { name: "Message Content", value: content ? `||${content}||` : "*No content*" },
                    { name: "Normalized Form", value: normalized ? `||${normalized}||` : "*No content*" }
                  ],
                  timestamp: new Date()
                }]
              }).catch(error => console.error("Failed to send log message:", error));
            } else {
              console.error("Log channel is not a text channel");
            }
          } catch (error) {
            console.error("Error sending to log channel:", error);
          }
        }

        // Record violation in database
        try {
          await database.ensureUser(message.author.id);
          const userData = await database.getUserData(message.author.id) || {};
          userData.violations = userData.violations || [];
          userData.violations.unshift({
            type: violation,
            time: Date.now(),
            content: content // Optional: store the violating message
          });
          // Keep last 20 violations
          if (userData.violations.length > 20) userData.violations.length = 20;
          await database.saveUserData(message.author.id, userData);
        } catch (dbError) {
          console.error("Failed to record violation:", dbError);
        }

      } catch (actionError) {
        console.error("Failed to handle violation:", actionError);
      }
    }
  } catch (error) {
    console.error("AutoMod error:", error);
  }
});

// --- Interaction Handler ---
client.on("interactionCreate", async (interaction) => {
  if (!interaction || !interaction.user) return;
  const userId = interaction.user.id;
  try {
    await database.ensureUser(userId);
  } catch (err) {
    console.error("DB ensureUser error:", err);
  }
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
        case "slap": return handleSlapCommand(interaction);
        case "kiss": return handleKissCommand(interaction);
        case "cuddle": return handleCuddleCommand(interaction);
        case "fuck": return handleFuckCommand(interaction);
        case "clear_user": return handleClearUserWarningCommand(interaction);
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

  // 🔹 Shop modal submit
  if (interaction.isModalSubmit && interaction.isModalSubmit()) {
    const match = interaction.customId.match(/^buy_(.+)_(\d+)$/);
    if (match) {
      const [, rawItemKey, modalUserId] = match;
      if (String(modalUserId) !== String(interaction.user.id)) {
        return interaction.reply({ content: "❌ This modal is not for you.", ephemeral: true });
      }
      const itemKey = rawItemKey.toLowerCase().trim();
      const quantity = parseInt(interaction.fields.getTextInputValue("quantity"), 10);
      if (isNaN(quantity) || quantity <= 0) {
        return interaction.reply({ content: "❌ Invalid quantity.", ephemeral: true });
      }
      const userData = await database.getUserData(interaction.user.id) || {};
      const shop = {
        zanpakuto: { name: "Zanpakuto", price: 5000 },
        zanpakuto_reroll: { name: "Zanpakuto Reroll", price: 10000 },
      };
      const selectedItem = shop[itemKey];
      if (!selectedItem) {
        return interaction.reply({ content: "❌ That item cannot be bought.", ephemeral: true });
      }
      const totalCost = selectedItem.price * quantity;
      if ((userData.balance || 0) < totalCost) {
        return interaction.reply({
          content: `❌ You don’t have enough money! Need **${totalCost}**, but you only have **${userData.balance || 0}**.`,
          ephemeral: true,
        });
      }
      userData.balance = (userData.balance || 0) - totalCost;
      userData.inventory = userData.inventory || {};
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
  try {
    await database.initialize();
    console.log("📂 Database initialized");
  } catch (err) {
    console.error("Database initialization failed:", err);
  }
  try {
    await deployCommands();
  } catch (err) {
    console.error("Command deploy failed:", err);
  }
});

// --- Login ---
client.login(TOKEN);
