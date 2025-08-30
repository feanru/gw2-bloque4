import assert from 'assert';
import { CraftIngredient } from '../src/js/items-core.js';

const leaf = new CraftIngredient({
  id: 3,
  name: 'Leaf',
  count: 6,
  buy_price: 10,
  sell_price: 0,
  is_craftable: false,
  recipe: null,
  children: []
});

const mid = new CraftIngredient({
  id: 2,
  name: 'Mid',
  count: 2,
  is_craftable: true,
  recipe: { output_item_count: 3 },
  children: [leaf]
});

const root = new CraftIngredient({
  id: 1,
  name: 'Root',
  count: 1,
  is_craftable: true,
  recipe: { output_item_count: 2 },
  children: [mid]
});

root.recalc(1, null);

assert.strictEqual(mid.countTotal, 2);
assert.strictEqual(leaf.countTotal, 12);
assert.strictEqual(leaf.total_buy, 120);
assert.strictEqual(root.total_buy, 120);

console.log('items-core recalc test passed');
