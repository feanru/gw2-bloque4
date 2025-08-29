const { MongoClient } = require('mongodb');
const { createClient } = require('redis');
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
const { log } = require('./logger');
const { getLastSync, setLastSync } = require('./syncStatus');

const MONGO_URL = process.env.MONGO_URL || 'mongodb://localhost:27017/gw2';
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
const API_URL = 'https://api.guildwars2.com/v2/items';

async function fetchItems() {
  const idsParam = process.env.ITEM_IDS || 'all';
  const res = await fetch(`${API_URL}?ids=${idsParam}`);
  return res.json();
}

async function updateItems() {
  const mongo = new MongoClient(MONGO_URL);
  const redis = createClient({ url: REDIS_URL });

  await mongo.connect();
  await redis.connect();

  try {
    log('[items] job started');
    if (process.env.DRY_RUN) {
      log('[items] DRY_RUN active - skipping fetch');
      await setLastSync(mongo, 'items');
      return;
    }
    const lastSync = await getLastSync(mongo, 'items');
    if (lastSync) log(`[items] last sync ${lastSync.toISOString()}`);
    const items = await fetchItems();
    const collection = mongo.db().collection('items');
    for (const item of items) {
      await collection.updateOne({ id: item.id }, { $set: item }, { upsert: true });
      await redis.hSet('items', String(item.id), JSON.stringify(item));
    }
    await setLastSync(mongo, 'items');
    log(`[items] upserted ${items.length} documents`);
  } catch (err) {
    log(`[items] error: ${err.message}`);
    throw err;
  } finally {
    await mongo.close();
    await redis.disconnect();
    log('[items] job finished');
  }
}

module.exports = updateItems;

if (require.main === module) {
  updateItems().catch(err => {
    console.error(err);
    process.exit(1);
  });
}
