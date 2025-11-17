#!/usr/bin/env node

/**
 * Script de migration des anciennes clés Redis vers les nouvelles
 * Copie les données de data:*.json vers data:*
 */

import { Redis } from '@upstash/redis';

// Configuration Redis
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL || 'https://pumped-flamingo-35383.upstash.io',
  token: process.env.UPSTASH_REDIS_REST_TOKEN || 'AYo3AAIncDJiMDJkNjRjZDBmYTI0OTVjODI2NGZhZjFiNDg3OTQ5OHAyMzUzODM',
});

const MIGRATIONS = [
  { old: 'data:categories.json', new: 'data:categories' },
  { old: 'data:products.json', new: 'data:products' },
  { old: 'data:farms.json', new: 'data:farms' },
  { old: 'data:reviews.json', new: 'data:reviews' },
  { old: 'data:promos.json', new: 'data:promos' },
  { old: 'data:banner.json', new: 'data:banner' },
  { old: 'data:loadingscreen.json', new: 'data:loadingscreen' },
  { old: 'data:config.json', new: 'data:config' },
  { old: 'data:cart_services.json', new: 'data:cart_services' },
  { old: 'data:payments.json', new: 'data:payments' },
];

async function migrateKey(oldKey, newKey) {
  try {
    // Vérifier si l'ancienne clé existe
    const exists = await redis.exists(oldKey);
    if (!exists) {
      console.log(`⏭️  ${oldKey} n'existe pas, ignoré`);
      return false;
    }

    // Récupérer les données de l'ancienne clé
    const oldData = await redis.get(oldKey);
    
    if (!oldData) {
      console.log(`⏭️  ${oldKey} est vide, ignoré`);
      return false;
    }

    // Vérifier si la nouvelle clé existe déjà et a des données
    const newExists = await redis.exists(newKey);
    const newData = newExists ? await redis.get(newKey) : null;
    
    const oldCount = Array.isArray(oldData) ? oldData.length : 1;
    const newCount = Array.isArray(newData) ? newData.length : (newData ? 1 : 0);

    if (newExists && newCount > 0) {
      console.log(`⚠️  ${newKey} existe déjà avec ${newCount} élément(s)`);
      console.log(`   Ancienne clé: ${oldCount} élément(s)`);
      
      // Si l'ancienne clé a plus de données, on migre
      if (oldCount > newCount) {
        console.log(`   → Migration (ancienne clé a plus de données)`);
        await redis.set(newKey, oldData);
        console.log(`✅ ${oldKey} → ${newKey}: ${oldCount} élément(s) migré(s)`);
        return true;
      } else {
        console.log(`   → Garder les données actuelles (nouvelle clé a autant ou plus de données)`);
        return false;
      }
    }

    // Copier les données vers la nouvelle clé
    await redis.set(newKey, oldData);
    console.log(`✅ ${oldKey} → ${newKey}: ${oldCount} élément(s) migré(s)`);
    
    // Afficher un aperçu des données migrées
    if (Array.isArray(oldData) && oldData.length > 0) {
      console.log(`   Aperçu des données:`);
      oldData.slice(0, 3).forEach(item => {
        const name = item.name || item.username || item.title || item.id || 'Sans nom';
        console.log(`     - ${name}`);
      });
      if (oldData.length > 3) {
        console.log(`     ... et ${oldData.length - 3} autres`);
      }
    }
    
    return true;
  } catch (error) {
    console.error(`❌ Erreur migration ${oldKey} → ${newKey}:`, error.message);
    return false;
  }
}

async function main() {
  console.log('🔄 Migration des anciennes clés Redis vers les nouvelles...\n');
  
  // Vérifier la connexion Redis
  try {
    await redis.ping();
    console.log('✅ Connexion Redis OK\n');
  } catch (error) {
    console.error('❌ Erreur connexion Redis:', error.message);
    process.exit(1);
  }

  let migratedCount = 0;
  let skippedCount = 0;

  for (const { old: oldKey, new: newKey } of MIGRATIONS) {
    const migrated = await migrateKey(oldKey, newKey);
    if (migrated) {
      migratedCount++;
    } else {
      skippedCount++;
    }
  }

  console.log('\n📊 Résumé de la migration:');
  console.log(`  ✅ ${migratedCount} clé(s) migrée(s)`);
  console.log(`  ⏭️  ${skippedCount} clé(s) ignorée(s)`);
  
  if (migratedCount > 0) {
    console.log('\n✅ Migration terminée avec succès !');
    console.log('\n📢 Prochaines étapes:');
    console.log('  1. Redémarrez votre serveur');
    console.log('  2. Vérifiez que vos données apparaissent côté client');
    console.log('  3. Vérifiez le panel admin');
  } else {
    console.log('\n⚠️  Aucune donnée à migrer.');
    console.log('\nSi vous ne voyez toujours pas vos données:');
    console.log('  1. Vérifiez que vous utilisez la bonne base de données Upstash');
    console.log('  2. Vérifiez les variables d\'environnement');
    console.log('  3. Ajoutez vos données via le panel admin');
  }
}

main().catch(error => {
  console.error('❌ Erreur:', error);
  process.exit(1);
});
