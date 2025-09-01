import assert from 'assert';
import { applyWorkerData } from '../src/js/utils/applyWorkerData.js';

const dest = {
  count: 0,
  countTotal: 0,
  components: [
    {
      count: 0,
      countTotal: 0,
      components: [
        { count: 0, countTotal: 0, components: [] }
      ]
    },
    {
      count: 0,
      countTotal: 0,
      components: []
    }
  ]
};

const workerData = {
  total_buy: 0,
  total_sell: 0,
  total_crafted: 0,
  crafted_price: 0,
  countTotal: 10,
  children: [
    {
      total_buy: 0,
      total_sell: 0,
      total_crafted: 0,
      crafted_price: 0,
      countTotal: 3,
      children: [
        {
          total_buy: 0,
          total_sell: 0,
          total_crafted: 0,
          crafted_price: 0,
          countTotal: 5,
          children: []
        }
      ]
    },
    {
      total_buy: 0,
      total_sell: 0,
      total_crafted: 0,
      crafted_price: 0,
      countTotal: 7,
      children: []
    }
  ]
};

applyWorkerData(workerData, dest);

assert.strictEqual(dest.count, 10);
assert.strictEqual(dest.countTotal, 10);
assert.strictEqual(dest.components[0].count, 3);
assert.strictEqual(dest.components[0].countTotal, 3);
assert.strictEqual(dest.components[0].components[0].count, 5);
assert.strictEqual(dest.components[0].components[0].countTotal, 5);
assert.strictEqual(dest.components[1].count, 7);
assert.strictEqual(dest.components[1].countTotal, 7);

console.log('applyWorkerData propagation test passed');
