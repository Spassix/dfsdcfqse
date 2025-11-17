#!/usr/bin/env node
// Script de chiffrement des fichiers JS sensibles

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

// Configuration de chiffrement
const SECRET_KEY = 'LaFabrique92_SecretKey_2024_UltraSecure!@#$%^&*()';

// Chiffrement XOR simple (pour la démonstration)
function xorEncrypt(text, key) {
  let result = '';
  for (let i = 0; i < text.length; i++) {
    result += String.fromCharCode(text.charCodeAt(i) ^ key.charCodeAt(i % key.length));
  }
  return result;
}

// Chiffrer un fichier
function encryptFile(inputPath, outputPath) {
  try {
    // Lire le fichier source
    const plaintext = fs.readFileSync(inputPath, 'utf8');
    
    // Chiffrer avec XOR
    const encrypted = xorEncrypt(plaintext, SECRET_KEY);
    
    // Créer l'objet de sortie
    const encryptedData = {
      encrypted: encrypted,
      algorithm: 'xor'
    };
    
    // Sauvegarder le fichier chiffré
    fs.writeFileSync(outputPath, JSON.stringify(encryptedData, null, 2));
    
    console.log(`✅ Fichier chiffré: ${inputPath} → ${outputPath}`);
    return true;
  } catch (error) {
    console.error(`❌ Erreur chiffrement ${inputPath}:`, error.message);
    return false;
  }
}

// Chiffrer tous les fichiers JS sensibles
function encryptAllSensitiveFiles() {
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
  
  console.log('🔐 Début du chiffrement des fichiers sensibles...\n');
  
  let successCount = 0;
  let totalCount = sensitiveFiles.length;
  
  sensitiveFiles.forEach(file => {
    const inputPath = path.join(process.cwd(), file);
    const outputPath = path.join(process.cwd(), file.replace('.js', '.encrypted.js'));
    
    if (fs.existsSync(inputPath)) {
      if (encryptFile(inputPath, outputPath)) {
        successCount++;
      }
    } else {
      console.log(`⚠️  Fichier non trouvé: ${inputPath}`);
    }
  });
  
  console.log(`\n📊 Résultat: ${successCount}/${totalCount} fichiers chiffrés avec succès`);
  
  if (successCount > 0) {
    console.log('\n💡 Instructions:');
    console.log('1. Les fichiers .encrypted.js sont prêts pour le déploiement');
    console.log('2. Utilisez le déchiffreur côté client pour les décrypter');
    console.log('3. Supprimez les fichiers .js originaux en production');
  }
}

// Exécuter le chiffrement
if (require.main === module) {
  encryptAllSensitiveFiles();
}

module.exports = { encryptFile, encryptAllSensitiveFiles };