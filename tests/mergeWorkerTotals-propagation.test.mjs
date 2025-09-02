import assert from 'assert';
import { mergeWorkerTotals } from '../src/js/utils/mergeWorkerTotals.js';

const dest = {
  _uid: 1,
  count: 0,
  countTotal: 0,
  buy_price: 0,
  components: [
    {
      _uid: 2,
      count: 0,
      countTotal: 0,
      buy_price: 0,
      components: [
        { _uid: 3, count: 0, countTotal: 0, buy_price: 0, components: [] }
      ]
    },
    {
      _uid: 4,
      count: 0,
      countTotal: 0,
      buy_price: 0,
      components: []
    }
  ]
};

const workerData = {
  _uid: 1,
  buy_price: 1,
  sell_price: 2,
  total_buy: 10,
  total_sell: 20,
  total_crafted: 30,
  crafted_price: 40,
  countTotal: 10,
  children: [
    {
      _uid: 2,
      buy_price: 3,
      sell_price: 4,
      total_buy: 0,
      total_sell: 0,
      total_crafted: 0,
      crafted_price: 0,
      countTotal: 3,
      children: [
        {
          _uid: 3,
          buy_price: 5,
          sell_price: 6,
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
      _uid: 4,
      buy_price: 7,
      sell_price: 8,
      total_buy: 0,
      total_sell: 0,
      total_crafted: 0,
      crafted_price: 0,
      countTotal: 7,
      children: []
    }
  ]
};

mergeWorkerTotals(workerData, dest);

assert.strictEqual(dest.count, 0);
assert.strictEqual(dest.countTotal, 10);
assert.strictEqual(dest.buy_price, 1);
assert.strictEqual(dest.components[0].count, 0);
assert.strictEqual(dest.components[0].countTotal, 3);
assert.strictEqual(dest.components[0].buy_price, 3);
assert.strictEqual(dest.components[0].components[0].countTotal, 5);
assert.strictEqual(dest.components[1].countTotal, 7);
assert.strictEqual(dest.components[1].count, 0);

console.log('mergeWorkerTotals propagation test passed');
