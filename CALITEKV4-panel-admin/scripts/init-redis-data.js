#!/usr/bin/env node

/**
 * Script d'initialisation des données Redis Upstash
 * Ce script vérifie et initialise les clés Redis nécessaires pour l'application
 */

import { Redis } from '@upstash/redis';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configuration Redis
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL || 'https://pumped-flamingo-35383.upstash.io',
  token: process.env.UPSTASH_REDIS_REST_TOKEN || 'AYo3AAIncDJiMDJkNjRjZDBmYTI0OTVjODI2NGZhZjFiNDg3OTQ5OHAyMzUzODM',
});

// Les clés Redis utilisées par l'application
const REDIS_KEYS = {
  categories: 'data:categories',
  products: 'data:products',
  farms: 'data:farms',
  admin_users: 'data:admin_users',
  reviews: 'data:reviews',
  socials: 'data:socials',
  events: 'data:events',
  settings: 'data:settings',
};

/**
 * Charge les données depuis les fichiers JSON
 */
function loadDefaultData(filename) {
  try {
    const filePath = join(__dirname, '..', 'api', 'data', `${filename}.json`);
    const data = readFileSync(filePath, 'utf8');
    const lines = data.trim().split('\n');
    // Prendre la dernière ligne valide (format NDJSON)
    const lastLine = lines[lines.length - 1];
    return JSON.parse(lastLine);
  } catch (error) {
    console.error(`Erreur chargement ${filename}:`, error.message);
    return [];
  }
}

/**
 * Vérifie l'existence d'une clé dans Redis
 */
async function checkKey(key) {
  try {
    const exists = await redis.exists(key);
    const data = await redis.get(key);
    return {
      exists: exists > 0,
      hasData: data && (Array.isArray(data) ? data.length > 0 : Object.keys(data).length > 0),
      data: data,
      count: Array.isArray(data) ? data.length : (data ? 1 : 0)
    };
  } catch (error) {
    console.error(`Erreur vérification clé ${key}:`, error.message);
    return { exists: false, hasData: false, data: null, count: 0 };
  }
}

/**
 * Initialise une clé Redis avec des données par défaut
 */
async function initKey(key, defaultData) {
  try {
    await redis.set(key, defaultData);
    console.log(`✅ Clé ${key} initialisée avec ${Array.isArray(defaultData) ? defaultData.length : 1} élément(s)`);
    return true;
  } catch (error) {
    console.error(`❌ Erreur initialisation ${key}:`, error.message);
    return false;
  }
}

/**
 * Liste toutes les clés dans Redis
 */
async function listAllKeys() {
  try {
    // Upstash Redis ne supporte pas SCAN, on utilise KEYS
    const keys = await redis.keys('*');
    return keys;
  } catch (error) {
    console.error('Erreur listage des clés:', error.message);
    return [];
  }
}

/**
 * Main
 */
async function main() {
  console.log('🔍 Vérification de la configuration Redis Upstash...\n');
  
  // Vérifier la connexion Redis
  try {
    await redis.ping();
    console.log('✅ Connexion Redis OK\n');
  } catch (error) {
    console.error('❌ Erreur connexion Redis:', error.message);
    console.error('Vérifiez vos variables d\'environnement UPSTASH_REDIS_REST_URL et UPSTASH_REDIS_REST_TOKEN\n');
    process.exit(1);
  }

  // Lister toutes les clés existantes
  console.log('📋 Clés Redis existantes:');
  const allKeys = await listAllKeys();
  if (allKeys.length === 0) {
    console.log('  (aucune clé trouvée)\n');
  } else {
    allKeys.forEach(key => console.log(`  - ${key}`));
    console.log('');
  }

  // Vérifier chaque clé importante
  console.log('📊 Vérification des données:\n');
  
  const checks = await Promise.all([
    checkKey(REDIS_KEYS.categories),
    checkKey(REDIS_KEYS.products),
    checkKey(REDIS_KEYS.farms),
    checkKey(REDIS_KEYS.admin_users),
    checkKey(REDIS_KEYS.reviews),
  ]);

  const results = {
    categories: checks[0],
    products: checks[1],
    farms: checks[2],
    admin_users: checks[3],
    reviews: checks[4],
  };

  // Afficher les résultats
  Object.entries(results).forEach(([name, result]) => {
    const icon = result.hasData ? '✅' : '⚠️';
    const status = result.hasData ? `${result.count} élément(s)` : 'vide';
    console.log(`${icon} ${REDIS_KEYS[name]}: ${status}`);
    
    // Afficher un aperçu des données si elles existent
    if (result.hasData && Array.isArray(result.data)) {
      result.data.slice(0, 3).forEach(item => {
        console.log(`    - ${item.name || item.username || item.id}`);
      });
      if (result.data.length > 3) {
        console.log(`    ... et ${result.data.length - 3} autres`);
      }
    }
  });

  console.log('\n');

  // Demander confirmation pour initialiser les clés vides
  const emptyKeys = Object.entries(results).filter(([_, result]) => !result.hasData);
  
  if (emptyKeys.length === 0) {
    console.log('✅ Toutes les clés ont des données !');
    console.log('\n📢 Si vous ne voyez pas vos données côté client:');
    console.log('  1. Vérifiez que le bon URL d\'API est configuré');
    console.log('  2. Redémarrez votre serveur');
    console.log('  3. Vérifiez les logs du navigateur (F12)');
    return;
  }

  console.log(`⚠️  ${emptyKeys.length} clé(s) vide(s) détectée(s):\n`);
  
  for (const [name, _] of emptyKeys) {
    console.log(`❌ ${REDIS_KEYS[name]} est vide`);
    
    // Charger les données par défaut
    const defaultData = loadDefaultData(name);
    
    if (defaultData && defaultData.length > 0) {
      console.log(`   → Initialisation avec ${defaultData.length} élément(s) par défaut...`);
      await initKey(REDIS_KEYS[name], defaultData);
    } else {
      console.log(`   → Initialisation avec un tableau vide...`);
      await initKey(REDIS_KEYS[name], []);
    }
  }

  console.log('\n✅ Initialisation terminée !');
  console.log('\n📢 Prochaines étapes:');
  console.log('  1. Vérifiez vos données dans le panel admin');
  console.log('  2. Ajoutez vos catégories et produits');
  console.log('  3. Les données seront automatiquement sauvegardées dans Redis');
}

main().catch(error => {
  console.error('❌ Erreur:', error);
  process.exit(1);
});
