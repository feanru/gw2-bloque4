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
const matchZero = html.match(/<td>(\d+)<\/td>/);
assert.ok(matchZero, 'Debe renderizar una celda de cantidad');
assert.strictEqual(matchZero[1], '0', 'countTotal=0 debe mostrarse correctamente');

// countTotal undefined should fall back to count
const ingredientFallback = {
  ...ingredient,
  _uid: 'uid1b',
  countTotal: undefined,
  count: 4
};

const htmlFallback = renderRows([ingredientFallback]);
const matchFallback = htmlFallback.match(/<td>(\d+)<\/td>/);
assert.ok(matchFallback, 'Debe renderizar una celda de cantidad para fallback');
assert.strictEqual(matchFallback[1], '4', 'Debe usar count cuando countTotal es undefined');

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
const matchMain = mainHtml.match(/<td>(\d+)<\/td>/);
assert.ok(matchMain, 'Debe renderizar una celda de cantidad en la fila principal');
assert.strictEqual(matchMain[1], '0', 'countTotal=0 debe mostrarse en la fila principal');

console.log('item-ui renderRows countTotal 0 test passed');
console.log('item-ui renderMainItemRow countTotal 0 test passed');

// Test for renderIngredient rounding of fractional countTotal
function createStubElement() {
  return {
    innerHTML: '',
    className: '',
    appendChild() {},
    querySelector(sel) {
      if (sel === '.item-count') {
        const m = this.innerHTML.match(/<span class="item-count">([^<]*)<\/span>/);
        return m ? { textContent: m[1] } : null;
      }
      return null;
    }
  };
}

global.document.getElementById = () => ({ addEventListener: () => {}, style: {} });
global.document.createElement = createStubElement;
global.document.addEventListener = () => {};
global.document.querySelectorAll = () => [];

global.formatGold = (value) => String(value);
global.getRarityClass = () => '';
window.formatGoldColored = global.formatGoldColored;
window.formatGold = global.formatGold;
window.getRarityClass = global.getRarityClass;

await import('../src/js/bundle-legendary.js');
const app = window.appThirdGen;

const container = {
  appendChild(el) {
    this.el = el;
  }
};

const fractionalIngredient = {
  id: 99,
  name: 'Frac',
  count: 1,
  countTotal: 1.6,
  components: [],
  type: '',
  icon: '1',
  buyPrice: 0,
  sellPrice: 0,
  total_buy: 0,
  total_sell: 0,
  isPriceLoaded: () => false,
  getTotalBuyPrice: () => 0,
  getTotalSellPrice: () => 0
};

await app.renderIngredient(fractionalIngredient, container);
const span = container.el.querySelector('.item-count');
assert.ok(span, 'Debe renderizar .item-count para cantidades fraccionadas');
assert.strictEqual(span.textContent, 'x2', 'Debe redondear y mostrar el entero esperado');
console.log('bundle-legendary renderIngredient fractional count test passed');
