export function applyWorkerData(src, dest) {
  dest.total_buy = src.total_buy;
  dest.total_sell = src.total_sell;
  dest.total_crafted = src.total_crafted;
  dest.crafted_price = src.crafted_price;
  dest.countTotal = src.countTotal;
  dest.count = src.countTotal;
  if (src.children && dest.components) {
    for (let i = 0; i < src.children.length && i < dest.components.length; i++) {
      applyWorkerData(src.children[i], dest.components[i]);
    }
  }
}
