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

const { renderRows } = await import('../src/js/item-ui.js');

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

console.log('item-ui renderRows countTotal 0 test passed');
