import { fetchWithCache } from '../utils/requestCache.js';

self.onmessage = async (e) => {
  const { mainItemId, mainRecipeData } = e.data;
  try {
    const data = await prepareIngredientTreeData(mainItemId, mainRecipeData);
    self.postMessage(data);
  } catch (err) {
    self.postMessage({ error: err.message });
  }
};

async function prepareIngredientTreeData(mainItemId, mainRecipeData) {
  if (!mainRecipeData || !mainRecipeData.ingredients || mainRecipeData.ingredients.length === 0) {
    return [];
  }

  const allItemIdsInTree = new Set();
  const recipeDetailsMap = new Map();
  const recipeIdByOutput = new Map();

  recipeDetailsMap.set(mainRecipeData.id, mainRecipeData);
  const toProcess = [mainRecipeData.id];

  while (toProcess.length > 0) {
    const currentId = toProcess.shift();
    const currentRecipe = recipeDetailsMap.get(currentId);
    if (!currentRecipe?.ingredients) continue;

    const newRecipeIds = new Set();
    for (const ing of currentRecipe.ingredients) {
      allItemIdsInTree.add(ing.item_id);
      if (!recipeIdByOutput.has(ing.item_id)) {
        const search = await fetchWithCache(`https://api.guildwars2.com/v2/recipes/search?output=${ing.item_id}`).then(r => r.json());
        const subId = search && search.length > 0 ? search[0] : null;
        recipeIdByOutput.set(ing.item_id, subId);
        if (subId) newRecipeIds.add(subId);
      } else {
        const subId = recipeIdByOutput.get(ing.item_id);
        if (subId) newRecipeIds.add(subId);
      }
    }

    const idsToFetch = Array.from(newRecipeIds).filter(id => !recipeDetailsMap.has(id));
    for (let i = 0; i < idsToFetch.length; i += 200) {
      const chunk = idsToFetch.slice(i, i + 200);
      const recipesChunk = await fetchWithCache(`https://api.guildwars2.com/v2/recipes?ids=${chunk.join(',')}&lang=es`).then(r => r.json());
      recipesChunk.forEach(rec => {
        recipeDetailsMap.set(rec.id, rec);
        toProcess.push(rec.id);
      });
    }
  }

  const allItemsDetailsMap = new Map();
  if (allItemIdsInTree.size > 0) {
    const allIdsArray = Array.from(allItemIdsInTree);
    for (let i = 0; i < allIdsArray.length; i += 200) {
      const chunk = allIdsArray.slice(i, i + 200);
      const itemsChunkData = await fetchWithCache(`https://api.guildwars2.com/v2/items?ids=${chunk.join(',')}&lang=es`).then(r => r.json());
      itemsChunkData.forEach(item => allItemsDetailsMap.set(item.id, item));
    }
  }

  const marketDataMap = new Map();
  if (allItemIdsInTree.size > 0) {
    try {
      const csvUrl = `https://api.datawars2.ie/gw2/v1/items/csv?fields=id,buy_price,sell_price&ids=${Array.from(allItemIdsInTree).join(',')}`;
      const csvText = await fetchWithCache(csvUrl).then(r => r.text());
      const [headers, ...rows] = csvText.trim().split('\n').map(line => line.split(','));
      if (headers && headers.length > 0 && rows.length > 0 && rows[0].length === headers.length) {
        for (const row of rows) {
          const obj = {};
          headers.forEach((h, idx) => {
            const value = row[idx];
            if (h === 'id') obj[h] = parseInt(value, 10);
            else if (h === 'buy_price' || h === 'sell_price') obj[h] = value !== '' && value !== undefined ? parseInt(value, 10) : null;
            else obj[h] = value;
          });
          if (obj.id) marketDataMap.set(obj.id, obj);
        }
      }
    } catch (e) {
      // ignore CSV fetch errors
    }
  }

  async function buildTreeRecursive(ingredientRecipeInfo, currentParentMultiplier, parentId = null) {
    const itemDetail = allItemsDetailsMap.get(ingredientRecipeInfo.item_id);
    if (!itemDetail) return null;
    let marketInfo = marketDataMap.get(ingredientRecipeInfo.item_id);
    if (!marketInfo) {
      try {
        const priceData = await fetchWithCache(`https://api.guildwars2.com/v2/commerce/prices/${ingredientRecipeInfo.item_id}`).then(r => r.json());
        marketInfo = {
          id: ingredientRecipeInfo.item_id,
          buy_price: priceData?.buys?.unit_price ?? null,
          sell_price: priceData?.sells?.unit_price ?? null
        };
        marketDataMap.set(ingredientRecipeInfo.item_id, marketInfo);
      } catch (e) {
        marketInfo = {};
      }
    }
    let children = [];
    let subRecipeFullData = null;
    let isCraftable = false;
    const subRecipeId = recipeIdByOutput.get(ingredientRecipeInfo.item_id);
    if (subRecipeId) {
      subRecipeFullData = recipeDetailsMap.get(subRecipeId);
      if (subRecipeFullData && subRecipeFullData.ingredients) {
        isCraftable = true;
        children = await Promise.all(
          subRecipeFullData.ingredients.map(subIng => buildTreeRecursive(subIng, subRecipeFullData.output_item_count || 1, itemDetail.id))
        );
        children = children.filter(c => c !== null);
      }
    }
    return {
      id: itemDetail.id,
      name: itemDetail.name,
      icon: itemDetail.icon,
      rarity: itemDetail.rarity,
      count: ingredientRecipeInfo.count,
      parentMultiplier: currentParentMultiplier,
      buy_price: marketInfo.buy_price !== undefined ? marketInfo.buy_price : null,
      sell_price: marketInfo.sell_price !== undefined ? marketInfo.sell_price : null,
      crafted_price: null,
      is_craftable: isCraftable,
      recipe: subRecipeFullData,
      children: children,
      _parentId: parentId
    };
  }

  let finalIngredientObjs = [];
  if (mainRecipeData && mainRecipeData.ingredients) {
    finalIngredientObjs = await Promise.all(
      mainRecipeData.ingredients.map(ing => buildTreeRecursive(ing, mainRecipeData.output_item_count || 1, mainItemId))
    );
    finalIngredientObjs = finalIngredientObjs.filter(c => c !== null);
  }
  return finalIngredientObjs;
}
