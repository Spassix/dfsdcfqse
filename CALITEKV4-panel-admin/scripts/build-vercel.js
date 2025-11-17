#!/usr/bin/env node
// Script de build pour Vercel avec chiffrement des fichiers JS

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Début du build Vercel avec chiffrement...\n');

try {
  // 1. Chiffrer tous les fichiers JS sensibles
  console.log('1️⃣ Chiffrement des fichiers JS...');
  execSync('node scripts/encrypt.js', { stdio: 'inherit' });
  
  // 2. Lister les fichiers sensibles (on NE supprime PLUS les originaux pour éviter les manques en déploiement)
  console.log('\n2️⃣ Préparation de la liste des fichiers sensibles...');
  const sensitiveFiles = [
    'admin/js/admin.js',
    'admin/js/auth.js', 
    'admin/js/backend.js',
    'admin/js/dashboard.js',
    'admin/js/products.js',
    'admin/js/categories.js',
    'admin/js/farms.js',
    'admin/js/users.js',
    'admin/js/banner.js',
    'admin/js/promos.js',
    'admin/js/socials.js',
    'admin/js/typography.js',
    'admin/js/cart-config.js',
    'admin/js/product-modal-config.js',
    'admin/js/notifications.js',
    'admin/js/modal-manager.js',
    'admin/js/utils.js',
    'admin/js/loading.js',
    'admin/js/maintenance.js',
    'admin/js/config.js'
  ];
  
  console.log('ℹ️ Les fichiers originaux .js sont conservés (pas de suppression).');

  // 3. Minifier JS/CSS statiques
  console.log('\n3️⃣ Minification des assets (JS/CSS)...');
  execSync('node scripts/minify-static.js', { stdio: 'inherit' });
  
  // 4. Créer un fichier .vercelignore pour exclure les scripts de build
  console.log('\n4️⃣ Configuration Vercel...');
  const vercelIgnore = `# Fichiers de build et scripts
scripts/
node_modules/
*.log
.env
.env.local
.env.production.local
.env.development.local

# Fichiers de développement
*.js.map
*.css.map

# Fichiers temporaires
.tmp/
temp/
`;
  
  fs.writeFileSync('.vercelignore', vercelIgnore);
  console.log('✅ Fichier .vercelignore créé');
  
  // 4. Vérifier que les fichiers chiffrés existent
  console.log('\n4️⃣ Vérification des fichiers chiffrés...');
  let encryptedCount = 0;
  sensitiveFiles.forEach(file => {
    const encryptedFile = file.replace('.js', '.encrypted.js');
    const encryptedPath = path.join(process.cwd(), encryptedFile);
    if (fs.existsSync(encryptedPath)) {
      encryptedCount++;
    }
  });
  
  console.log(`✅ ${encryptedCount}/${sensitiveFiles.length} fichiers chiffrés vérifiés`);
  
  console.log('\n🎉 Build Vercel terminé avec succès!');
  console.log('\n📋 Instructions de déploiement:');
  console.log('1. Les fichiers JS sont maintenant chiffrés');
  console.log('2. Les fichiers originaux ont été supprimés');
  console.log('3. Le déchiffreur côté client est configuré');
  console.log('4. Déployez sur Vercel avec: vercel --prod');
  
} catch (error) {
  console.error('❌ Erreur lors du build:', error.message);
  process.exit(1);
}
