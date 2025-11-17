#!/usr/bin/env node
/**
 * Script pour télécharger toutes les données depuis votre site Vercel en production
 * AUCUN credential Upstash nécessaire - Utilise l'API publique
 * Usage: node scripts/download-from-production.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ⚠️ REMPLACEZ par l'URL de votre site Vercel
const PRODUCTION_URL = 'https://votre-site.vercel.app';

const DATA_KEYS = [
  'products',
  'categories',
  'farms',
  'socials',
  'banner',
  'loadingscreen',
  'config',
  'typography',
  'productModal',
  'payments',
  'cart_services',
  'reviews',
  'promos',
  'farmsEnabled',
];

async function downloadData() {
  console.log('📥 Téléchargement des données depuis la production...');
  console.log(`🌐 URL: ${PRODUCTION_URL}\n`);
  
  // Vérifier que l'URL a été modifiée
  if (PRODUCTION_URL === 'https://votre-site.vercel.app') {
    console.error('❌ ERREUR: Veuillez modifier PRODUCTION_URL dans le script');
    console.error('   Ouvrez scripts/download-from-production.js');
    console.error('   Et remplacez la ligne 14 par votre vraie URL Vercel\n');
    console.error('   Exemple: const PRODUCTION_URL = \'https://calitekv4.vercel.app\';');
    process.exit(1);
  }
  
  const apiDir = path.join(__dirname, '..', 'api');
  
  // Créer le dossier api s'il n'existe pas
  if (!fs.existsSync(apiDir)) {
    fs.mkdirSync(apiDir, { recursive: true });
  }
  
  let successCount = 0;
  let errorCount = 0;
  
  for (const key of DATA_KEYS) {
    try {
      const url = `${PRODUCTION_URL}/api/${key}.json`;
      console.log(`⏳ Téléchargement ${key}.json...`);
      
      const response = await fetch(url);
      
      if (!response.ok) {
        console.log(`⚠️  ${key}.json - Non trouvé (${response.status})`);
        continue;
      }
      
      const data = await response.json();
      
      fs.writeFileSync(
        path.join(apiDir, `${key}.json`),
        JSON.stringify(data, null, 2),
        'utf8'
      );
      
      const itemCount = Array.isArray(data) ? data.length : 'config';
      console.log(`✅ ${key}.json - ${itemCount} ${Array.isArray(data) ? 'éléments' : ''}`);
      successCount++;
      
    } catch (error) {
      console.error(`❌ ${key}.json - Erreur: ${error.message}`);
      errorCount++;
    }
  }
  
  console.log(`\n📊 Résumé:`);
  console.log(`   ✅ ${successCount} fichiers téléchargés`);
  console.log(`   ❌ ${errorCount} erreurs`);
  
  if (successCount > 0) {
    console.log(`\n✨ Données récupérées avec succès !`);
    console.log(`📂 Fichiers dans: ${apiDir}`);
    console.log(`\n🚀 Vous pouvez maintenant accéder au panel admin:`);
    console.log(`   http://localhost:8080/admin`);
    console.log(`   Identifiants: admin / admin@123@123`);
  }
}

downloadData().catch(error => {
  console.error('❌ Erreur fatale:', error);
  process.exit(1);
});
