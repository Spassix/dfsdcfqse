#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const esbuild = require('esbuild');
const CleanCSS = require('clean-css');
const { minify: minifyHtml } = require('html-minifier-terser');

function fileExists(p) { return fs.existsSync(p); }
function resolve(p) { return path.join(process.cwd(), p); }

async function minifyJS(files) {
  for (const rel of files) {
    const p = resolve(rel);
    if (!fileExists(p)) continue;
    await esbuild.build({
      entryPoints: [p],
      outfile: p,
      minify: true,
      bundle: false,
      format: 'iife',
      sourcemap: false,
      logLevel: 'silent',
      allowOverwrite: true
    });
    console.log(`✅ JS minifié: ${rel}`);
  }
}

function minifyCSS(files) {
  const cleaner = new CleanCSS({ level: 2 });
  for (const rel of files) {
    const p = resolve(rel);
    if (!fileExists(p)) continue;
    const css = fs.readFileSync(p, 'utf8');
    const { styles, errors } = cleaner.minify(css);
    if (errors && errors.length) {
      console.warn(`⚠️  Erreurs minification CSS ${rel}:`, errors.join(', '));
      continue;
    }
    fs.writeFileSync(p, styles);
    console.log(`✅ CSS minifié: ${rel}`);
  }
}

async function minifyHTML(files) {
  for (const rel of files) {
    const p = resolve(rel);
    if (!fileExists(p)) continue;
    const html = fs.readFileSync(p, 'utf8');
    const minified = await minifyHtml(html, {
      collapseWhitespace: true,
      removeComments: true,
      removeRedundantAttributes: true,
      removeEmptyAttributes: true,
      minifyCSS: true,
      minifyJS: true,
      sortAttributes: true,
      sortClassName: true
    });
    fs.writeFileSync(p, minified);
    console.log(`✅ HTML minifié: ${rel}`);
  }
}

(async () => {
  const jsFiles = [
    'assets/js/decryptor.js',
    'assets/js/site.js',
    'assets/js/loading-screen.js',
    'assets/js/product-modal.js',
    'assets/js/admin-sync.js'
  ];

  const cssFiles = [
    'admin/css/admin.css',
    'assets/css/style.css',
    'assets/css/theme-modern.css',
    'assets/css/banner.css',
    'assets/css/contact.css',
    'assets/css/loading.css',
    'assets/css/products-table.css'
  ];

  const htmlFiles = [
    'index.html',
    'admin/index.html'
  ];

  await minifyJS(jsFiles);
  minifyCSS(cssFiles);
  await minifyHTML(htmlFiles);

  console.log('\n🎉 Minification JS/CSS/HTML terminée');
})();
