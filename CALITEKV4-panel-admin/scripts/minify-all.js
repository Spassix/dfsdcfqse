#!/usr/bin/env node
/**
 * Script de minification complète de tous les fichiers HTML, CSS et JS
 * Minifie sans obfuscation pour éviter le vol de code
 */

const fs = require('fs');
const path = require('path');
const { minify: minifyJS } = require('terser');
const CleanCSS = require('clean-css');
const { minify: minifyHtml } = require('html-minifier-terser');

// Dossiers à exclure
const EXCLUDE_DIRS = ['node_modules', '.git', 'dist', 'build', 'videos', 'images'];

/**
 * Récupère récursivement tous les fichiers d'un type donné
 */
function getAllFiles(dir, extensions, fileList = []) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    // Ignorer les dossiers exclus
    if (stat.isDirectory()) {
      const dirName = path.basename(filePath);
      if (!EXCLUDE_DIRS.includes(dirName)) {
        getAllFiles(filePath, extensions, fileList);
      }
    } else if (stat.isFile()) {
      const ext = path.extname(file).toLowerCase();
      if (extensions.includes(ext)) {
        fileList.push(filePath);
      }
    }
  });
  
  return fileList;
}

/**
 * Minifie un fichier JavaScript
 */
async function minifyJavaScript(filePath) {
  try {
    const code = fs.readFileSync(filePath, 'utf8');
    const result = await minifyJS(code, {
      compress: {
        drop_console: false, // Garder les console.log pour le debug
        drop_debugger: true,
        pure_funcs: [],
        passes: 2
      },
      mangle: false, // PAS d'obfuscation des noms de variables
      format: {
        comments: false // Supprimer les commentaires
      }
    });
    
    if (result.error) {
      throw result.error;
    }
    
    fs.writeFileSync(filePath, result.code);
    return true;
  } catch (error) {
    console.error(`❌ Erreur JS ${filePath}:`, error.message);
    return false;
  }
}

/**
 * Minifie un fichier CSS
 */
function minifyCSS(filePath) {
  try {
    const css = fs.readFileSync(filePath, 'utf8');
    const cleaner = new CleanCSS({
      level: 2,
      format: false // Pas de formatage, juste minification
    });
    
    const { styles, errors, warnings } = cleaner.minify(css);
    
    if (errors && errors.length) {
      console.error(`❌ Erreurs CSS ${filePath}:`, errors.join(', '));
      return false;
    }
    
    if (warnings && warnings.length) {
      console.warn(`⚠️  Avertissements CSS ${filePath}:`, warnings.join(', '));
    }
    
    fs.writeFileSync(filePath, styles);
    return true;
  } catch (error) {
    console.error(`❌ Erreur CSS ${filePath}:`, error.message);
    return false;
  }
}

/**
 * Minifie un fichier HTML
 */
async function minifyHTML(filePath) {
  try {
    const html = fs.readFileSync(filePath, 'utf8');
    const minified = await minifyHtml(html, {
      collapseWhitespace: true,
      removeComments: true,
      removeRedundantAttributes: true,
      removeEmptyAttributes: true,
      minifyCSS: true,
      minifyJS: true,
      sortAttributes: true,
      sortClassName: true,
      removeOptionalTags: false, // Garder les tags pour compatibilité
      removeScriptTypeAttributes: true,
      removeStyleLinkTypeAttributes: true,
      useShortDoctype: true,
      caseSensitive: false
    });
    
    fs.writeFileSync(filePath, minified);
    return true;
  } catch (error) {
    console.error(`❌ Erreur HTML ${filePath}:`, error.message);
    return false;
  }
}

/**
 * Fonction principale
 */
async function main() {
  console.log('🔧 Début de la minification complète...\n');
  
  const startTime = Date.now();
  const baseDir = process.cwd();
  
  // Exclure les fichiers API et serveur de la minification
  const excludePaths = [
    'api',
    'server.js',
    'scripts'
  ];
  
  // Trouver tous les fichiers
  console.log('📂 Recherche des fichiers...');
  
  const allHtmlFiles = getAllFiles(baseDir, ['.html'])
    .filter(file => {
      const relative = path.relative(baseDir, file);
      return !excludePaths.some(excluded => relative.startsWith(excluded));
    });
  
  const allCssFiles = getAllFiles(baseDir, ['.css'])
    .filter(file => {
      const relative = path.relative(baseDir, file);
      return !excludePaths.some(excluded => relative.startsWith(excluded));
    });
  
  const allJsFiles = getAllFiles(baseDir, ['.js'])
    .filter(file => {
      const relative = path.relative(baseDir, file);
      // Exclure les fichiers API, serveur et scripts
      if (relative.startsWith('api') || 
          relative.startsWith('scripts') || 
          relative === 'server.js') {
        return false;
      }
      return true;
    });
  
  console.log(`📄 Trouvé ${allHtmlFiles.length} fichier(s) HTML`);
  console.log(`🎨 Trouvé ${allCssFiles.length} fichier(s) CSS`);
  console.log(`📜 Trouvé ${allJsFiles.length} fichier(s) JS\n`);
  
  // Minifier les fichiers HTML
  console.log('🔄 Minification des fichiers HTML...');
  let htmlCount = 0;
  for (const file of allHtmlFiles) {
    const relative = path.relative(baseDir, file);
    if (await minifyHTML(file)) {
      htmlCount++;
      console.log(`✅ HTML minifié: ${relative}`);
    }
  }
  
  // Minifier les fichiers CSS
  console.log('\n🔄 Minification des fichiers CSS...');
  let cssCount = 0;
  for (const file of allCssFiles) {
    const relative = path.relative(baseDir, file);
    if (minifyCSS(file)) {
      cssCount++;
      console.log(`✅ CSS minifié: ${relative}`);
    }
  }
  
  // Minifier les fichiers JS
  console.log('\n🔄 Minification des fichiers JS...');
  let jsCount = 0;
  for (const file of allJsFiles) {
    const relative = path.relative(baseDir, file);
    if (await minifyJavaScript(file)) {
      jsCount++;
      console.log(`✅ JS minifié: ${relative}`);
    }
  }
  
  const duration = ((Date.now() - startTime) / 1000).toFixed(2);
  
  console.log('\n' + '='.repeat(50));
  console.log('📊 Résumé de la minification:');
  console.log(`   HTML: ${htmlCount}/${allHtmlFiles.length} fichier(s) minifié(s)`);
  console.log(`   CSS:  ${cssCount}/${allCssFiles.length} fichier(s) minifié(s)`);
  console.log(`   JS:   ${jsCount}/${allJsFiles.length} fichier(s) minifié(s)`);
  console.log(`⏱️  Temps total: ${duration}s`);
  console.log('='.repeat(50));
  console.log('\n🎉 Minification terminée avec succès!');
}

// Exécuter le script
if (require.main === module) {
  main().catch(error => {
    console.error('❌ Erreur fatale:', error);
    process.exit(1);
  });
}

module.exports = { minifyJavaScript, minifyCSS, minifyHTML };



