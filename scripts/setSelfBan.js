// scripts/setSelfBan.js
const database = require('../database.js');

async function main() {
  const [, , userId, ...words] = process.argv;
  if (!userId || words.length === 0) {
    console.error('Usage: node scripts/setSelfBan.js <userId> <word1> [word2] ...');
    process.exit(2);
  }

  await database.initialize();
  await database.ensureUser(userId);
  const user = await database.getUserData(userId) || {};
  user.selfBanWords = words.map(w => String(w).toLowerCase());
  await database.saveUserData(userId, user);
  console.log(`Set selfBanWords for ${userId}:`, user.selfBanWords);
}

main().catch(err => { console.error(err); process.exit(1); });
