export function mergeWorkerTotals(costs, dest) {
  if (!Array.isArray(costs) || !dest) return;

  // Build a map of destination nodes by _uid for quick lookup
  const uidMap = new Map();
  (function buildMap(node) {
    if (node && typeof node._uid !== 'undefined') {
      uidMap.set(String(node._uid), node);
    }
    const children = Array.isArray(node?.components)
      ? node.components
      : Array.isArray(node?.children)
        ? node.children
        : [];
    children.forEach(buildMap);
  })(Array.isArray(dest) ? { children: dest } : dest);

  const ALLOWED_FIELDS = [
    'total_buy',
    'total_sell',
    'total_crafted',
    'crafted_price',
    'countTotal'
  ];

  costs.forEach(node => {
    const target = uidMap.get(String(node.uid));
    if (target) {
      ALLOWED_FIELDS.forEach(key => {
        if (Object.prototype.hasOwnProperty.call(node, key)) {
          target[key] = node[key];
        }
      });
    }
  });
}
