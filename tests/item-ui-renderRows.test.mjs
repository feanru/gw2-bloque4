import assert from 'assert';

// Minimal DOM stubs
global.window = {};
global.document = {
  addEventListener: () => {},
  getElementById: () => null,
  querySelectorAll: () => []
};

global.IntersectionObserver = class {
  constructor() {}
  observe() {}
  unobserve() {}
};

global.formatGoldColored = (value) => String(value);
global.getTotals = () => ({ totalBuy: 1, totalSell: 1, totalCrafted: 1 });

const { renderRows, renderMainItemRow } = await import('../src/js/item-ui.js');

const ingredient = {
  id: 1,
  _uid: 'uid1',
  icon: 'icon.png',
  name: 'Test',
  countTotal: 0,
  count: 5,
  is_craftable: false,
  children: [],
  buy_price: 1,
  sell_price: 2,
  total_buy: 1,
  total_sell: 2,
  total_crafted: null,
  modeForParentCrafted: null,
  expanded: false,
  rarity: 'common'
};

const html = renderRows([ingredient]);

assert.ok(html.includes('<td>0</td>'));
assert.ok(!html.includes('<td>5</td>'));

// countTotal undefined should fall back to count
const ingredientFallback = {
  ...ingredient,
  _uid: 'uid1b',
  countTotal: undefined,
  count: 4
};

const htmlFallback = renderRows([ingredientFallback]);

assert.ok(htmlFallback.includes('<td>4</td>'));

// Test for renderMainItemRow with countTotal = 0
const mainNode = {
  id: 2,
  _uid: 'uid2',
  icon: 'icon.png',
  name: 'Main',
  countTotal: 0,
  count: 7,
  children: [{}], // triggers getTotals
  buy_price: 0,
  sell_price: 0,
  total_crafted: null,
  expanded: false,
  rarity: 'common'
};

const mainHtml = renderMainItemRow(mainNode);

assert.ok(mainHtml.includes('<td>0</td>'));
assert.ok(!mainHtml.includes('<td>7</td>'));

console.log('item-ui renderRows countTotal 0 test passed');
console.log('item-ui renderMainItemRow countTotal 0 test passed');
