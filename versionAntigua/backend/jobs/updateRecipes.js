const { MongoClient } = require('mongodb');
const { createClient } = require('redis');
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
const { log } = require('./logger');
const { getLastSync, setLastSync } = require('./syncStatus');

const MONGO_URL = process.env.MONGO_URL || 'mongodb://localhost:27017/gw2';
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
const API_URL = 'https://api.guildwars2.com/v2/recipes';

async function fetchRecipes() {
  const idsParam = process.env.RECIPE_IDS || 'all';
  const res = await fetch(`${API_URL}?ids=${idsParam}`);
  return res.json();
}

async function updateRecipes() {
  const mongo = new MongoClient(MONGO_URL);
  const redis = createClient({ url: REDIS_URL });

  await mongo.connect();
  await redis.connect();

  try {
    log('[recipes] job started');
    if (process.env.DRY_RUN) {
      log('[recipes] DRY_RUN active - skipping fetch');
      await setLastSync(mongo, 'recipes');
      return;
    }
    const lastSync = await getLastSync(mongo, 'recipes');
    if (lastSync) log(`[recipes] last sync ${lastSync.toISOString()}`);
    const recipes = await fetchRecipes();
    const collection = mongo.db().collection('recipes');
    for (const recipe of recipes) {
      await collection.updateOne({ id: recipe.id }, { $set: recipe }, { upsert: true });
      await redis.hSet('recipes', String(recipe.id), JSON.stringify(recipe));
    }
    await setLastSync(mongo, 'recipes');
    log(`[recipes] upserted ${recipes.length} documents`);
  } catch (err) {
    log(`[recipes] error: ${err.message}`);
    throw err;
  } finally {
    await mongo.close();
    await redis.disconnect();
    log('[recipes] job finished');
  }
}

module.exports = updateRecipes;

if (require.main === module) {
  updateRecipes().catch(err => {
    console.error(err);
    process.exit(1);
  });
}
