import { defineConfig } from 'vite';
import { readFileSync, writeFileSync } from 'node:fs';

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
      // Make start_url, scope and icon paths absolute under the deploy base (e.g. /repo/ on GitHub Pages)
      name: 'manifest-base-paths',
      apply: 'build',
      closeBundle() {
        const file = new URL('./dist/manifest.json', import.meta.url);
        const manifest = JSON.parse(readFileSync(file, 'utf-8'));
        const withBase = (p) => base + p.replace(/^\.?\//, '');
        manifest.id = base;
        manifest.start_url = base;
        manifest.scope = base;
        manifest.icons = manifest.icons.map((icon) => ({ ...icon, src: withBase(icon.src) }));
        writeFileSync(file, JSON.stringify(manifest, null, 2));
      },
    },
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
