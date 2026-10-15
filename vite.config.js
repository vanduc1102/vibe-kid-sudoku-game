import { defineConfig } from 'vite';
import { readFileSync } from 'node:fs';

const pkg = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf-8'));

// When building for GitHub Pages, GITHUB_REPOSITORY is set to "owner/repo-name".
// We extract the repo name to use as the Vite base path so all asset URLs are correct.
const repoName = process.env.GITHUB_REPOSITORY?.split('/')[1];
const base = repoName ? `/${repoName}/` : '/';

export default defineConfig({
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
  },

  plugins: [
    {
      name: 'html-version-transform',
      transformIndexHtml(html) {
        return html.replace(/%APP_VERSION%/g, pkg.version);
      },
    },
  ],

  // Base public path — '/' locally, '/<repo-name>/' on GitHub Pages
  base,

  // Serve the project root as the web root
  root: '.',

  // Public assets copied as-is (manifest.json, sw.js, icons, etc.)
  publicDir: 'public',

  build: {
    // Output directory for production build
    outDir: 'dist',
    emptyOutDir: true,
    // Three.js is large; raise limit to avoid noisy warnings
    chunkSizeWarningLimit: 600,

    rollupOptions: {
      input: 'index.html',

      output: {
        // Chunk vendor libs (three.js) separately for better caching
        manualChunks(id) {
          if (id.includes('node_modules/three')) return 'three';
        },
        // Asset file naming
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js',
        assetFileNames: 'assets/[ext]/[name]-[hash].[ext]',
      },
    },
  },

  server: {
    port: 5173,
    open: true,
  },

  preview: {
    port: 4173,
  },
});
