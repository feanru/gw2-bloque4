import assert from 'assert'

global.window = {}
global.document = {
  getElementById: () => null,
  querySelectorAll: () => []
}

await import('../src/js/bundle-legendary.js')
const { Ingredient, Ingredient3 } = window.LegendaryUtils

// Caso 77: cada material se multiplica por 250
const leaf77 = () => {
  const ing = new Ingredient(1, 'mat', 'mat', null, 250/77)
  ing.setPrices(1, 2)
  return ing
}
const root77 = new Ingredient(19675, 'Trébol', 'account_bound', null, 1)
root77.parentMultiplier = 77
;[leaf77(), leaf77(), leaf77(), leaf77()].forEach(c => root77.addComponent(c))
const totals77 = root77.calculateTotals()
assert.strictEqual(totals77.buy, 4 * 250)
assert.strictEqual(totals77.sell, 4 * 250 * 2)
root77.components.forEach(c => {
  const t = c.calculateTotals(77)
  assert.strictEqual(t.buy, 250)
  assert.strictEqual(t.sell, 500)
})

// Caso 38: cada material se multiplica por 38 (1:1)
const leaf38 = () => {
  const ing = new Ingredient3(1, 'mat', 'mat', null, 1)
  ing.setPrices(1, 2)
  return ing
}
const root38 = new Ingredient3(19675, 'Trébol', 'account_bound', null, 1)
root38.parentMultiplier = 38
;[leaf38(), leaf38(), leaf38(), leaf38()].forEach(c => root38.addComponent(c))
const totals38 = root38.calculateTotals()
assert.strictEqual(totals38.buy, 4 * 38)
assert.strictEqual(totals38.sell, 4 * 38 * 2)
root38.components.forEach(c => {
  const t = c.calculateTotals(38)
  assert.strictEqual(t.buy, 38)
  assert.strictEqual(t.sell, 76)
})

console.log('calculateTotals multiplier tests passed')
