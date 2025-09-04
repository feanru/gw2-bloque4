import terser from '@rollup/plugin-terser';
import { writeFileSync } from 'node:fs';

// Algunos módulos, como items-core, necesitan conservar ciertos nombres de
// exportaciones para que puedan ser importados dinámicamente desde otros
// bundles.  En builds anteriores, el minificador y el tree shaking eliminaban
// o renombraban estas funciones, rompiendo las importaciones de item-loader.
// Listamos los nombres que deben preservarse y desactivamos el tree‑shaking
// global para evitar que se descarten.
const RESERVED_EXPORTS = [
  'prepareIngredientTreeData',
  'setIngredientObjs',
  'findIngredientsById',
  'cancelItemRequests',
  'recalcAll',
  'CraftIngredient'
];

export default {
  // Entradas separadas para cada vista o funcionalidad pesada
  input: {
    'bundle-auth-nav': 'src/js/bundle-auth-nav.js',
    'bundle-dones': 'src/js/bundle-dones.js',
    'bundle-fractales': 'src/js/bundle-fractales.js',
    'bundle-forja-mistica': 'src/js/bundle-forja-mistica.js',
    'bundle-legendary': 'src/js/bundle-legendary.js',
    'bundle-utils-1': 'src/js/bundle-utils-1.js',
    'item-loader': 'src/js/item-loader.js',
    'items-core': 'src/js/items-core.js',
    'tabs': 'src/js/tabs.js',
    'feedback-modal': 'src/js/feedback-modal.js',
    'leg-craft-tabs': 'src/js/leg-craft-tabs.js',
    'search-modal': 'src/js/search-modal.js',
    'search-modal-core': 'src/js/search-modal-core.js',
    'search-modal-compare-craft': 'src/js/search-modal-compare-craft.js',
    'sw-register': 'src/js/sw-register.js',
      'ingredientTreeWorker': 'src/js/workers/ingredientTreeWorker.js',
      'costsWorker': 'src/js/workers/costsWorker.js'
    },
  external: ['./tabs.min.js', './services/recipeService.min.js'],
  // Desactivamos tree shaking para preservar todas las exportaciones de los
  // módulos de entrada, en especial items-core, cuyas funciones se consumen
  // dinámicamente desde otros bundles.
  treeshake: false,
  plugins: [
    terser({
      mangle: {
        reserved: RESERVED_EXPORTS
      }
    }),
    {
      name: 'manifest',
      generateBundle(options, bundle) {
        const manifest = {};
        for (const [fileName, chunk] of Object.entries(bundle)) {
          if (chunk.type === 'chunk' && chunk.isEntry) {
            const isWorker = chunk.facadeModuleId?.includes('/workers/') ?? false;
            const originalName = `/dist/js/${chunk.name}${isWorker ? '.js' : '.min.js'}`;
            manifest[originalName] = `/dist/js/${fileName}`;
          }
        }
        writeFileSync('dist/manifest.json', JSON.stringify(manifest, null, 2));
      }
    }
  ],
  output: {
    dir: 'dist/js',
    format: 'es',
    entryFileNames: (chunkInfo) =>
      chunkInfo.facadeModuleId.includes('/workers/')
        ? '[name].[hash].js'
        : '[name].[hash].min.js',
    chunkFileNames: (chunkInfo) =>
      chunkInfo.name === 'services-Bc-4z6yK'
        ? '[name].js'
        : '[name]-[hash].js',
    manualChunks(id) {
      if (id.includes('src/js/utils')) {
        return 'utils';
      }
      if (id.includes('src/js/services/recipeService.js')) {
        return 'services-Bc-4z6yK';
      }
    }
  }
};
