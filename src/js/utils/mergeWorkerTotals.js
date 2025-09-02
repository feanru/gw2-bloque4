export function mergeWorkerTotals(src, dest) {
  if (!src || !dest) return;

  // Build a map of destination nodes by _uid for quick lookup
  const uidMap = new Map();
  (function buildMap(node) {
    if (node && typeof node._uid !== 'undefined') {
      uidMap.set(String(node._uid), node);
    }
    if (Array.isArray(node?.components)) {
      node.components.forEach(child => buildMap(child));
    }
  })(dest);

  const fields = [
    'buy_price',
    'sell_price',
    'total_buy',
    'total_sell',
    'total_crafted',
    'crafted_price',
    'countTotal'
  ];

  (function merge(node) {
    const target = uidMap.get(String(node._uid));
    if (target) {
      fields.forEach(key => {
        if (Object.prototype.hasOwnProperty.call(node, key)) {
          target[key] = node[key];
        }
      });
    }
    if (Array.isArray(node.children)) {
      node.children.forEach(merge);
    }
  })(src);
}
